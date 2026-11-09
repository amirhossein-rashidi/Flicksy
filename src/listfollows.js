// List follows: follow / unfollow a public list, who follows my list (owner only),
// popular lists (leaderboard, Discover, Home "this week") and the lists I follow (Library).
// Needs the list_follows table (migration 12). Every handler is safe if the table is missing.

import { json } from "./util.js";
import { TMDB_IMG, posterSql } from "./tmdb.js";
import { notifyListFollow } from "./notify.js";

const BOARD_SIZE = 50;
const PAGE = 50;

function cleanCode(value) {
  return typeof value === "string" && /^[a-z0-9]{4,16}$/.test(value) ? value : null;
}

function marks(n) {
  return new Array(n).fill("?").join(",");
}

function owner(r) {
  return {
    public_id: r.public_id,
    display_name: r.display_name,
    username: r.username || null,
    photo_url: r.photo_url || null,
  };
}

// up to 4 poster pictures for each list id
async function posterMap(env, user, ids) {
  const map = new Map();
  if (!ids.length) return map;
  const rows = await env.DB.prepare(
    "SELECT list_id, poster_path FROM (" +
      "SELECT li.list_id AS list_id, " + posterSql(user) + " AS poster_path, " +
      "ROW_NUMBER() OVER (PARTITION BY li.list_id ORDER BY li.position, li.id) AS rn " +
      "FROM list_items li JOIN titles t ON t.id = li.title_id " +
      "WHERE li.list_id IN (" + marks(ids.length) + ")" +
      ") WHERE rn <= 4"
  )
    .bind(...ids)
    .all();
  for (const p of rows.results || []) {
    if (!p.poster_path) continue;
    if (!map.has(p.list_id)) map.set(p.list_id, []);
    map.get(p.list_id).push(TMDB_IMG + p.poster_path);
  }
  return map;
}

function card(r, posters) {
  return {
    title: r.title,
    share_code: r.share_code,
    owner: owner(r),
    count: r.n || 0,
    followers: r.followers || 0,
    posters: posters.get(r.id) || [],
  };
}

async function findList(env, code) {
  return await env.DB.prepare(
    "SELECT l.id, l.owner_id, l.visibility, l.title FROM lists l WHERE l.share_code = ?1"
  )
    .bind(code)
    .first();
}

async function followerCount(env, listId) {
  const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM list_follows WHERE list_id = ?1").bind(listId).first();
  return (row && row.n) || 0;
}

// GET /api/list-follow?code=..  -> { followers, following, is_owner }
// POST /api/list-follow  { code }   -> follow (public lists only, not your own)
// DELETE /api/list-follow?code=..   -> unfollow
export async function handleListFollow(request, url, env, user) {
  try {
    const method = request.method;
    let code;
    if (method === "POST") {
      let body = null;
      try {
        body = await request.json();
      } catch (e) {
        body = null;
      }
      code = cleanCode(body && body.code);
    } else {
      code = cleanCode(url.searchParams.get("code"));
    }
    if (!code) return json({ error: "bad_request" }, 400);

    const list = await findList(env, code);
    const isOwner = !!list && list.owner_id === user.id;
    if (!list || (list.visibility === "private" && !isOwner)) return json({ error: "not_found" }, 404);

    if (method === "POST") {
      if (isOwner) return json({ error: "own_list" }, 400);
      if (list.visibility !== "public") return json({ error: "not_public" }, 400);
      const res = await env.DB.prepare("INSERT OR IGNORE INTO list_follows (list_id, user_id) VALUES (?1, ?2)")
        .bind(list.id, user.id)
        .run();
      // tell the owner (bell + bot) - only for a brand new follow
      if (res.meta && res.meta.changes) {
        await notifyListFollow(env, user, { id: list.id, title: list.title, share_code: code, owner_id: list.owner_id });
      }
    } else if (method === "DELETE") {
      await env.DB.prepare("DELETE FROM list_follows WHERE list_id = ?1 AND user_id = ?2").bind(list.id, user.id).run();
    } else if (method !== "GET") {
      return json({ error: "method_not_allowed" }, 405);
    }

    const mine = await env.DB.prepare("SELECT 1 AS x FROM list_follows WHERE list_id = ?1 AND user_id = ?2")
      .bind(list.id, user.id)
      .first();
    return json({
      ok: true,
      followers: await followerCount(env, list.id),
      following: !!mine,
      is_owner: isOwner,
    });
  } catch (e) {
    return json({ ok: true, followers: 0, following: false, is_owner: false });
  }
}

// GET /api/list-followers?code=..&before=<id>   (only the owner of the list)
// -> { items: [{ id, person, at }], next, total }
export async function handleListFollowers(url, env, user) {
  const code = cleanCode(url.searchParams.get("code"));
  if (!code) return json({ error: "bad_request" }, 400);
  try {
    const list = await findList(env, code);
    if (!list) return json({ error: "not_found" }, 404);
    if (list.owner_id !== user.id) return json({ error: "forbidden" }, 403);

    const before = parseInt(url.searchParams.get("before") || "0", 10);
    const beforeId = Number.isInteger(before) && before > 0 ? before : 2147483647;
    const rows = await env.DB.prepare(
      "SELECT lf.id, lf.created_at, u.public_id, u.display_name, CASE WHEN u.username_visible = 1 THEN u.username END AS username, u.photo_url " +
        "FROM list_follows lf JOIN users u ON u.id = lf.user_id " +
        "WHERE lf.list_id = ?1 AND lf.id < ?2 ORDER BY lf.id DESC LIMIT " + (PAGE + 1)
    )
      .bind(list.id, beforeId)
      .all();
    const all = rows.results || [];
    const page = all.slice(0, PAGE);
    return json({
      items: page.map((r) => ({ id: r.id, person: owner(r), at: r.created_at })),
      next: all.length > PAGE && page.length ? page[page.length - 1].id : null,
      total: await followerCount(env, list.id),
    });
  } catch (e) {
    return json({ items: [], next: null, total: 0 });
  }
}

// GET /api/leaderboard?kind=lists&limit=3   (limit is optional: Discover uses 3)
// -> { kind: "lists", rows: [{ rank, list }] }  only public lists of non-private accounts
export async function handleListsLeaderboard(url, env, user) {
  const lim = parseInt(url.searchParams.get("limit") || "", 10);
  const limit = Number.isInteger(lim) && lim > 0 ? Math.min(lim, BOARD_SIZE) : BOARD_SIZE;
  try {
    const rows = await env.DB.prepare(
      "SELECT l.id, l.title, l.share_code, u.public_id, u.display_name, CASE WHEN u.username_visible = 1 THEN u.username END AS username, u.photo_url, " +
        "(SELECT COUNT(*) FROM list_items li WHERE li.list_id = l.id) AS n, " +
        "(SELECT COUNT(*) FROM list_follows lf WHERE lf.list_id = l.id) AS followers " +
        "FROM lists l JOIN users u ON u.id = l.owner_id " +
        "WHERE l.visibility = 'public' AND (u.is_private = 0 OR u.id = ?1) " +
        "AND n > 0 AND followers > 0 " +
        "ORDER BY followers DESC, l.id ASC LIMIT " + limit
    )
      .bind(user.id)
      .all();
    const list = rows.results || [];
    const posters = await posterMap(env, user, list.map((r) => r.id));
    return json({
      kind: "lists",
      rows: list.map((r, i) => ({ rank: i + 1, list: card(r, posters) })),
    });
  } catch (e) {
    return json({ kind: "lists", rows: [] });
  }
}

// GET /api/lists-weekly   (Home: lists that got the most new followers in the last 7 days)
// -> { items: [{ list, weekly }] }
export async function handleListsWeekly(url, env, user) {
  try {
    const rows = await env.DB.prepare(
      "SELECT l.id, l.title, l.share_code, u.public_id, u.display_name, CASE WHEN u.username_visible = 1 THEN u.username END AS username, u.photo_url, " +
        "(SELECT COUNT(*) FROM list_items li WHERE li.list_id = l.id) AS n, " +
        "(SELECT COUNT(*) FROM list_follows lf WHERE lf.list_id = l.id) AS followers, " +
        "(SELECT COUNT(*) FROM list_follows lw WHERE lw.list_id = l.id AND lw.created_at >= datetime('now', '-7 days')) AS weekly " +
        "FROM lists l JOIN users u ON u.id = l.owner_id " +
        "WHERE l.visibility = 'public' AND (u.is_private = 0 OR u.id = ?1) " +
        "AND n > 0 AND weekly > 0 " +
        "ORDER BY weekly DESC, followers DESC, l.id ASC LIMIT 10"
    )
      .bind(user.id)
      .all();
    const list = rows.results || [];
    const posters = await posterMap(env, user, list.map((r) => r.id));
    return json({ items: list.map((r) => ({ list: card(r, posters), weekly: r.weekly || 0 })) });
  } catch (e) {
    return json({ items: [] });
  }
}

// GET /api/lists-followed   (Library: the lists I follow, newest follow first)
// -> { items: [{ list }] }
export async function handleListsFollowed(url, env, user) {
  try {
    const rows = await env.DB.prepare(
      "SELECT l.id, l.title, l.share_code, u.public_id, u.display_name, CASE WHEN u.username_visible = 1 THEN u.username END AS username, u.photo_url, " +
        "(SELECT COUNT(*) FROM list_items li WHERE li.list_id = l.id) AS n, " +
        "(SELECT COUNT(*) FROM list_follows x WHERE x.list_id = l.id) AS followers " +
        "FROM list_follows lf JOIN lists l ON l.id = lf.list_id JOIN users u ON u.id = l.owner_id " +
        "WHERE lf.user_id = ?1 AND l.visibility = 'public' " +
        "ORDER BY lf.id DESC LIMIT 100"
    )
      .bind(user.id)
      .all();
    const list = rows.results || [];
    const posters = await posterMap(env, user, list.map((r) => r.id));
    return json({ items: list.map((r) => ({ list: card(r, posters) })) });
  } catch (e) {
    return json({ items: [] });
  }
}
