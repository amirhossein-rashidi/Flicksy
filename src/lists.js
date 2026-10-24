// Custom lists: create, edit, delete, add/remove titles, view (own or shared by code).

import { json, parseTitleRef } from "./util.js";
import { TMDB_IMG, TMDB_BACKDROP, ensureTitle } from "./tmdb.js";

const VISIBILITIES = ["public", "unlisted", "private"];
const MAX_LISTS = 50;
const MAX_ITEMS = 200;
const CODE_CHARS = "abcdefghijkmnpqrstuvwxyz23456789";

function makeCode() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += CODE_CHARS[b % CODE_CHARS.length];
  return out;
}

function cleanText(value, max) {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (text.length > max) return null;
  return text;
}

async function readBody(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : null;
  } catch (e) {
    return null;
  }
}

function listOut(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    visibility: row.visibility,
    share_code: row.share_code,
    is_ranked: row.is_ranked === 1,
  };
}

// GET /api/lists  (optional: ?tmdb_id=..&media_type=.. adds a "has" flag to each list)
export async function handleListsGet(url, env, user) {
  let titleId = null;
  const tmdbParam = url.searchParams.get("tmdb_id");
  if (tmdbParam) {
    const ref = parseTitleRef(tmdbParam, url.searchParams.get("media_type"));
    if (!ref) return json({ error: "bad_title" }, 400);
    const t = await env.DB.prepare("SELECT id FROM titles WHERE tmdb_id = ?1 AND media_type = ?2")
      .bind(ref.tmdbId, ref.mediaType)
      .first();
    titleId = t ? t.id : 0;
  }

  const rows = await env.DB.prepare(
    "SELECT l.id, l.title, l.description, l.visibility, l.share_code, l.is_ranked, " +
      "(SELECT COUNT(*) FROM list_items li WHERE li.list_id = l.id) AS n, " +
      "(SELECT COUNT(*) FROM list_items li WHERE li.list_id = l.id AND li.title_id = ?2) AS has " +
      "FROM lists l WHERE l.owner_id = ?1 ORDER BY l.updated_at DESC, l.id DESC LIMIT 100"
  )
    .bind(user.id, titleId === null ? 0 : titleId)
    .all();

  const previews = await env.DB.prepare(
    "SELECT list_id, poster_path FROM (" +
      "SELECT li.list_id AS list_id, t.poster_path AS poster_path, " +
      "ROW_NUMBER() OVER (PARTITION BY li.list_id ORDER BY li.position, li.id) AS rn " +
      "FROM list_items li JOIN titles t ON t.id = li.title_id " +
      "WHERE li.list_id IN (SELECT id FROM lists WHERE owner_id = ?1)" +
      ") WHERE rn <= 4"
  )
    .bind(user.id)
    .all();

  const posters = new Map();
  for (const p of previews.results || []) {
    if (!p.poster_path) continue;
    if (!posters.has(p.list_id)) posters.set(p.list_id, []);
    posters.get(p.list_id).push(TMDB_IMG + p.poster_path);
  }

  const lists = (rows.results || []).map((r) => {
    const out = listOut(r);
    out.count = r.n;
    out.posters = posters.get(r.id) || [];
    if (titleId !== null) out.has = r.has > 0;
    return out;
  });
  return json({ lists: lists });
}

// POST /api/lists  { title, description?, visibility?, is_ranked? }
export async function handleListCreate(request, env, user) {
  const body = await readBody(request);
  if (!body) return json({ error: "bad_request" }, 400);

  const title = cleanText(body.title, 60);
  const description = cleanText(body.description, 300);
  if (!title) return json({ error: "bad_title" }, 400);
  if (description === null) return json({ error: "bad_description" }, 400);
  const visibility = body.visibility === undefined ? "unlisted" : body.visibility;
  if (!VISIBILITIES.includes(visibility)) return json({ error: "bad_visibility" }, 400);
  const ranked = body.is_ranked ? 1 : 0;

  const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM lists WHERE owner_id = ?1")
    .bind(user.id)
    .first();
  if (count && count.n >= MAX_LISTS) return json({ error: "too_many_lists" }, 400);

  for (let attempt = 0; attempt < 3; attempt++) {
    const code = makeCode();
    try {
      const res = await env.DB.prepare(
        "INSERT INTO lists (owner_id, title, description, visibility, share_code, is_ranked) " +
          "VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
      )
        .bind(user.id, title, description || null, visibility, code, ranked)
        .run();
      const id = res.meta && res.meta.last_row_id;
      if (visibility !== "private") {
        await env.DB.prepare(
          "INSERT INTO activities (actor_id, type, list_id, visibility) VALUES (?1, 'list_create', ?2, ?3)"
        )
          .bind(user.id, id, user.is_private ? "followers" : "public")
          .run();
      }
      return json({
        ok: true,
        list: { id: id, title: title, description: description, visibility: visibility, share_code: code, is_ranked: ranked === 1 },
      });
    } catch (e) {
      // most likely a duplicate share code: try again with a new one
    }
  }
  return json({ error: "server_error" }, 500);
}

// PUT /api/lists  { id, title?, description?, visibility?, is_ranked? }
export async function handleListUpdate(request, env, user) {
  const body = await readBody(request);
  if (!body || !Number.isInteger(body.id)) return json({ error: "bad_request" }, 400);

  const current = await env.DB.prepare("SELECT * FROM lists WHERE id = ?1 AND owner_id = ?2")
    .bind(body.id, user.id)
    .first();
  if (!current) return json({ error: "not_found" }, 404);

  let title = current.title;
  if (body.title !== undefined) {
    title = cleanText(body.title, 60);
    if (!title) return json({ error: "bad_title" }, 400);
  }
  let description = current.description;
  if (body.description !== undefined) {
    description = cleanText(body.description, 300);
    if (description === null) return json({ error: "bad_description" }, 400);
  }
  let visibility = current.visibility;
  if (body.visibility !== undefined) {
    if (!VISIBILITIES.includes(body.visibility)) return json({ error: "bad_visibility" }, 400);
    visibility = body.visibility;
  }
  const ranked = body.is_ranked === undefined ? current.is_ranked : body.is_ranked ? 1 : 0;

  await env.DB.prepare(
    "UPDATE lists SET title = ?1, description = ?2, visibility = ?3, is_ranked = ?4, " +
      "updated_at = datetime('now') WHERE id = ?5 AND owner_id = ?6"
  )
    .bind(title, description || null, visibility, ranked, body.id, user.id)
    .run();

  return json({
    ok: true,
    list: { id: body.id, title: title, description: description || "", visibility: visibility, share_code: current.share_code, is_ranked: ranked === 1 },
  });
}

// DELETE /api/lists?id=..
export async function handleListDelete(url, env, user) {
  const id = parseInt(url.searchParams.get("id") || "", 10);
  if (!Number.isInteger(id) || id <= 0) return json({ error: "bad_request" }, 400);
  await env.DB.prepare("DELETE FROM lists WHERE id = ?1 AND owner_id = ?2").bind(id, user.id).run();
  return json({ ok: true });
}

// GET /api/list?code=..  (anyone with the code, unless private)   or   ?id=.. (owner only)
export async function handleListView(url, env, user) {
  const code = url.searchParams.get("code");
  const idParam = parseInt(url.searchParams.get("id") || "", 10);

  let list;
  if (code) {
    if (!/^[a-z0-9]{4,16}$/.test(code)) return json({ error: "not_found" }, 404);
    list = await env.DB.prepare(
      "SELECT l.*, u.display_name AS owner_name FROM lists l JOIN users u ON u.id = l.owner_id WHERE l.share_code = ?1"
    )
      .bind(code)
      .first();
  } else if (Number.isInteger(idParam) && idParam > 0) {
    list = await env.DB.prepare(
      "SELECT l.*, u.display_name AS owner_name FROM lists l JOIN users u ON u.id = l.owner_id " +
        "WHERE l.id = ?1 AND l.owner_id = ?2"
    )
      .bind(idParam, user.id)
      .first();
  } else {
    return json({ error: "bad_request" }, 400);
  }

  const isOwner = !!list && list.owner_id === user.id;
  if (!list || (list.visibility === "private" && !isOwner)) return json({ error: "not_found" }, 404);

  const rows = await env.DB.prepare(
    "SELECT t.tmdb_id, t.media_type, t.title, t.title_fa, t.year, t.poster_path, t.backdrop_path, t.tmdb_rating, " +
      "ut.status, ut.rating AS my_rating " +
      "FROM list_items li JOIN titles t ON t.id = li.title_id " +
      "LEFT JOIN user_titles ut ON ut.title_id = t.id AND ut.user_id = ?2 " +
      "WHERE li.list_id = ?1 ORDER BY li.position, li.id"
  )
    .bind(list.id, user.id)
    .all();

  const items = (rows.results || []).map((r) => ({
    tmdb_id: r.tmdb_id,
    media_type: r.media_type,
    title: r.title_fa || r.title,
    original_title: r.title,
    title_en: r.title,
    year: r.year,
    poster: r.poster_path ? TMDB_IMG + r.poster_path : null,
    backdrop: r.backdrop_path ? TMDB_BACKDROP + r.backdrop_path : null,
    rating: r.tmdb_rating ? Math.round(r.tmdb_rating * 10) / 10 : null,
    status: r.status || null,
    my_rating: r.my_rating || null,
  }));

  const out = listOut(list);
  out.owner_name = list.owner_name;
  out.is_owner = isOwner;
  out.items = items;
  return json({ list: out });
}

// PUT /api/list-items  { list_id, tmdb_id, media_type, add: true|false }
export async function handleListItemSet(request, env, user) {
  const body = await readBody(request);
  if (!body || !Number.isInteger(body.list_id)) return json({ error: "bad_request" }, 400);
  const ref = parseTitleRef(body.tmdb_id, body.media_type);
  if (!ref) return json({ error: "bad_title" }, 400);

  const list = await env.DB.prepare("SELECT id, visibility FROM lists WHERE id = ?1 AND owner_id = ?2")
    .bind(body.list_id, user.id)
    .first();
  if (!list) return json({ error: "not_found" }, 404);

  if (!body.add) {
    await env.DB.batch([
      env.DB.prepare(
        "DELETE FROM list_items WHERE list_id = ?1 AND title_id = " +
          "(SELECT id FROM titles WHERE tmdb_id = ?2 AND media_type = ?3)"
      ).bind(list.id, ref.tmdbId, ref.mediaType),
      env.DB.prepare("UPDATE lists SET updated_at = datetime('now') WHERE id = ?1").bind(list.id),
    ]);
    return json({ ok: true, has: false });
  }

  if (!env.TMDB_TOKEN) return json({ error: "server_misconfigured" }, 500);
  let titleId;
  try {
    titleId = await ensureTitle(env, ref.tmdbId, ref.mediaType);
  } catch (e) {
    return json({ error: "title_unavailable" }, 502);
  }
  if (!titleId) return json({ error: "title_not_found" }, 404);

  const info = await env.DB.prepare(
    "SELECT COUNT(*) AS n, COALESCE(MAX(position), 0) AS maxpos, " +
      "(SELECT COUNT(*) FROM list_items WHERE list_id = ?1 AND title_id = ?2) AS already " +
      "FROM list_items WHERE list_id = ?1"
  )
    .bind(list.id, titleId)
    .first();
  if (info.already > 0) return json({ ok: true, has: true });
  if (info.n >= MAX_ITEMS) return json({ error: "list_full" }, 400);

  const statements = [
    env.DB.prepare("INSERT OR IGNORE INTO list_items (list_id, title_id, position) VALUES (?1, ?2, ?3)").bind(
      list.id,
      titleId,
      info.maxpos + 1
    ),
    env.DB.prepare("UPDATE lists SET updated_at = datetime('now') WHERE id = ?1").bind(list.id),
  ];
  if (list.visibility !== "private") {
    statements.push(
      env.DB.prepare(
        "INSERT INTO activities (actor_id, type, title_id, list_id, visibility) VALUES (?1, 'list_add', ?2, ?3, ?4)"
      ).bind(user.id, titleId, list.id, user.is_private ? "followers" : "public")
    );
  }
  await env.DB.batch(statements);
  return json({ ok: true, has: true });
}
