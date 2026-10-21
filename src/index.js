// Flicksy backend (Cloudflare Worker)
// Step 10: library (status + rating) on top of Telegram login and TMDB search

const MAX_INITDATA_AGE_SECONDS = 24 * 60 * 60; // reject login data older than 24 hours
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w185";
const STATUSES = ["want", "watching", "watched", "paused", "dropped"];
const MEDIA_TYPES = ["movie", "tv"];

const USER_SELECT =
  "SELECT id, telegram_id, username, display_name, photo_url, is_private, created_at " +
  "FROM users WHERE telegram_id = ?1";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === "/api/health") {
        return await handleHealth(env);
      }

      if (path.startsWith("/api/")) {
        const auth = await authenticate(request, env);
        if (auth.error) return json({ error: auth.error }, auth.status);

        const user = await getOrCreateUser(env, auth.user, path === "/api/me");

        if (path === "/api/me") {
          return json({ user: user });
        }
        if (path === "/api/search" && request.method === "GET") {
          return await handleSearch(url, env, user);
        }
        if (path === "/api/library") {
          if (request.method === "GET") return await handleLibraryList(url, env, user);
          if (request.method === "PUT") return await handleLibrarySet(request, env, user);
          if (request.method === "DELETE") return await handleLibraryDelete(url, env, user);
          return json({ error: "method_not_allowed" }, 405);
        }
        return json({ error: "not_found" }, 404);
      }

      return env.ASSETS.fetch(request);
    } catch (e) {
      return json({ error: "server_error" }, 500);
    }
  },
};

// ---------- helpers ----------

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

async function handleHealth(env) {
  let db = "not-connected";
  try {
    const row = await env.DB.prepare("SELECT 1 AS ok").first();
    db = row && row.ok === 1 ? "ok" : "error";
  } catch (e) {
    db = "error";
  }

  let tmdb = "missing";
  if (env.TMDB_TOKEN) {
    try {
      const r = await fetch(TMDB_BASE + "/authentication", {
        headers: { Authorization: "Bearer " + env.TMDB_TOKEN, Accept: "application/json" },
      });
      tmdb = r.ok ? "ok" : "http_" + r.status;
    } catch (e) {
      tmdb = "unreachable";
    }
  }

  return json({
    app: "flicksy",
    status: "ok",
    db: db,
    bot_token: env.BOT_TOKEN ? "set" : "missing",
    tmdb: tmdb,
    time: new Date().toISOString(),
  });
}

// ---------- Telegram authentication ----------

function hexToBytes(hex) {
  if (typeof hex !== "string" || !/^[0-9a-f]{64}$/i.test(hex)) return null;
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

// Checks the signature of the data Telegram gives the Mini App (initData).
// Returns the Telegram user object if valid, otherwise an error.
async function verifyInitData(initData, botToken, nowSeconds) {
  if (!initData || !botToken) return { error: "unauthorized" };

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  const hashBytes = hexToBytes(hash);
  if (!hashBytes) return { error: "unauthorized" };
  params.delete("hash");

  const pairs = [];
  for (const [key, value] of params.entries()) {
    pairs.push(key + "=" + value);
  }
  pairs.sort();
  const dataCheckString = pairs.join("\n");

  const enc = new TextEncoder();
  const k1 = await crypto.subtle.importKey(
    "raw",
    enc.encode("WebAppData"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const secret = await crypto.subtle.sign("HMAC", k1, enc.encode(botToken));
  const k2 = await crypto.subtle.importKey(
    "raw",
    secret,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const valid = await crypto.subtle.verify("HMAC", k2, hashBytes, enc.encode(dataCheckString));
  if (!valid) return { error: "unauthorized" };

  const authDate = parseInt(params.get("auth_date") || "0", 10);
  if (!authDate || nowSeconds - authDate > MAX_INITDATA_AGE_SECONDS) {
    return { error: "expired" };
  }

  let user;
  try {
    user = JSON.parse(params.get("user") || "null");
  } catch (e) {
    return { error: "unauthorized" };
  }
  if (!user || typeof user.id !== "number") return { error: "unauthorized" };

  return { user: user };
}

async function authenticate(request, env) {
  if (!env.BOT_TOKEN) return { error: "server_misconfigured", status: 500 };

  const header = request.headers.get("Authorization") || "";
  if (!header.startsWith("tma ")) return { error: "unauthorized", status: 401 };
  const initData = header.slice(4);

  const result = await verifyInitData(initData, env.BOT_TOKEN, Math.floor(Date.now() / 1000));
  if (result.error) return { error: result.error, status: 401 };
  return { user: result.user };
}

async function getOrCreateUser(env, tgUser, refresh) {
  if (!refresh) {
    const existing = await env.DB.prepare(USER_SELECT).bind(tgUser.id).first();
    if (existing) return existing;
  }
  return await upsertUser(env, tgUser);
}

async function upsertUser(env, tgUser) {
  const displayName =
    [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ").trim() ||
    tgUser.username ||
    "User";

  await env.DB.prepare(
    "INSERT INTO users (telegram_id, display_name, photo_url, language_code, last_seen_at) " +
      "VALUES (?1, ?2, ?3, ?4, datetime('now')) " +
      "ON CONFLICT(telegram_id) DO UPDATE SET " +
      "display_name = excluded.display_name, " +
      "photo_url = excluded.photo_url, " +
      "language_code = excluded.language_code, " +
      "last_seen_at = datetime('now')"
  )
    .bind(tgUser.id, displayName, tgUser.photo_url || null, tgUser.language_code || null)
    .run();

  return await env.DB.prepare(USER_SELECT).bind(tgUser.id).first();
}

// ---------- TMDB ----------

async function tmdbGet(env, pathAndQuery, cacheSeconds) {
  const options = {
    headers: { Authorization: "Bearer " + env.TMDB_TOKEN, Accept: "application/json" },
  };
  if (cacheSeconds) options.cf = { cacheTtl: cacheSeconds, cacheEverything: true };

  const res = await fetch(TMDB_BASE + pathAndQuery, options);
  if (res.status === 404) return { status: 404, data: null };
  if (!res.ok) throw new Error("tmdb_" + res.status);
  return { status: 200, data: await res.json() };
}

// ---------- Search ----------

async function handleSearch(url, env, user) {
  if (!env.TMDB_TOKEN) return json({ error: "server_misconfigured" }, 500);

  const q = (url.searchParams.get("q") || "").trim();
  if (q.length < 2) return json({ results: [] });
  if (q.length > 100) return json({ error: "query_too_long" }, 400);

  let data;
  try {
    const res = await tmdbGet(
      env,
      "/search/multi?include_adult=false&language=fa-IR&page=1&query=" + encodeURIComponent(q),
      3600
    );
    data = res.data;
  } catch (e) {
    return json({ error: "search_unavailable" }, 502);
  }

  const results = mapSearchResults(data);
  await attachLibraryState(env, user.id, results);
  return json({ results: results });
}

function mapSearchResults(data) {
  const list = Array.isArray(data && data.results) ? data.results : [];
  return list
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .slice(0, 20)
    .map((r) => {
      const date = r.release_date || r.first_air_date || "";
      return {
        tmdb_id: r.id,
        media_type: r.media_type,
        title: r.title || r.name || "",
        original_title: r.original_title || r.original_name || "",
        year: date ? parseInt(date.slice(0, 4), 10) || null : null,
        poster: r.poster_path ? TMDB_IMG + r.poster_path : null,
        overview: (r.overview || "").slice(0, 240),
        rating: typeof r.vote_average === "number" ? Math.round(r.vote_average * 10) / 10 : null,
        status: null,
        my_rating: null,
      };
    });
}

// Marks which search results are already in this user's library.
async function attachLibraryState(env, userId, results) {
  const ids = results.map((r) => r.tmdb_id).filter((n) => Number.isInteger(n));
  if (ids.length === 0) return;

  const placeholders = ids.map((_, i) => "?" + (i + 2)).join(",");
  const rows = await env.DB.prepare(
    "SELECT t.tmdb_id, t.media_type, ut.status, ut.rating " +
      "FROM user_titles ut JOIN titles t ON t.id = ut.title_id " +
      "WHERE ut.user_id = ?1 AND t.tmdb_id IN (" + placeholders + ")"
  )
    .bind(userId, ...ids)
    .all();

  const found = new Map();
  for (const row of rows.results || []) {
    found.set(row.media_type + ":" + row.tmdb_id, row);
  }
  for (const r of results) {
    const hit = found.get(r.media_type + ":" + r.tmdb_id);
    if (hit) {
      r.status = hit.status;
      r.my_rating = hit.rating;
    }
  }
}

// ---------- Library ----------

function parseTitleRef(tmdbId, mediaType) {
  const id = typeof tmdbId === "string" ? parseInt(tmdbId, 10) : tmdbId;
  if (!Number.isInteger(id) || id <= 0) return null;
  if (!MEDIA_TYPES.includes(mediaType)) return null;
  return { tmdbId: id, mediaType: mediaType };
}

async function handleLibraryList(url, env, user) {
  const status = url.searchParams.get("status");
  if (status && !STATUSES.includes(status)) return json({ error: "bad_status" }, 400);

  let sql =
    "SELECT t.tmdb_id, t.media_type, t.title, t.title_fa, t.year, t.poster_path, " +
    "ut.status, ut.rating, ut.updated_at " +
    "FROM user_titles ut JOIN titles t ON t.id = ut.title_id " +
    "WHERE ut.user_id = ?1";
  const binds = [user.id];
  if (status) {
    sql += " AND ut.status = ?2";
    binds.push(status);
  }
  sql += " ORDER BY ut.updated_at DESC, ut.id DESC LIMIT 100";

  const rows = await env.DB.prepare(sql).bind(...binds).all();
  const countRows = await env.DB.prepare(
    "SELECT status, COUNT(*) AS n FROM user_titles WHERE user_id = ?1 GROUP BY status"
  )
    .bind(user.id)
    .all();

  const counts = {};
  for (const s of STATUSES) counts[s] = 0;
  for (const row of countRows.results || []) counts[row.status] = row.n;

  const items = (rows.results || []).map((r) => ({
    tmdb_id: r.tmdb_id,
    media_type: r.media_type,
    title: r.title_fa || r.title,
    original_title: r.title,
    year: r.year,
    poster: r.poster_path ? TMDB_IMG + r.poster_path : null,
    status: r.status,
    my_rating: r.rating,
  }));

  return json({ items: items, counts: counts });
}

async function handleLibrarySet(request, env, user) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "bad_json" }, 400);
  }
  if (!body || typeof body !== "object") return json({ error: "bad_request" }, 400);

  const ref = parseTitleRef(body.tmdb_id, body.media_type);
  if (!ref) return json({ error: "bad_title" }, 400);
  if (!STATUSES.includes(body.status)) return json({ error: "bad_status" }, 400);

  let rating = body.rating === undefined ? null : body.rating;
  if (rating !== null && !(Number.isInteger(rating) && rating >= 1 && rating <= 10)) {
    return json({ error: "bad_rating" }, 400);
  }
  const status = body.status;

  if (!env.TMDB_TOKEN) return json({ error: "server_misconfigured" }, 500);

  let titleId;
  try {
    titleId = await ensureTitle(env, ref.tmdbId, ref.mediaType);
  } catch (e) {
    return json({ error: "title_unavailable" }, 502);
  }
  if (!titleId) return json({ error: "title_not_found" }, 404);

  const existing = await env.DB.prepare(
    "SELECT status, rating FROM user_titles WHERE user_id = ?1 AND title_id = ?2"
  )
    .bind(user.id, titleId)
    .first();

  const statements = [
    env.DB.prepare(
      "INSERT INTO user_titles (user_id, title_id, status, rating, started_at, finished_at) " +
        "VALUES (?1, ?2, ?3, ?4, " +
        "CASE WHEN ?3 = 'watching' THEN datetime('now') ELSE NULL END, " +
        "CASE WHEN ?3 = 'watched' THEN datetime('now') ELSE NULL END) " +
        "ON CONFLICT(user_id, title_id) DO UPDATE SET " +
        "status = excluded.status, " +
        "rating = excluded.rating, " +
        "started_at = CASE WHEN excluded.status = 'watching' AND user_titles.started_at IS NULL " +
        "THEN datetime('now') ELSE user_titles.started_at END, " +
        "finished_at = CASE WHEN excluded.status = 'watched' AND user_titles.finished_at IS NULL " +
        "THEN datetime('now') ELSE user_titles.finished_at END, " +
        "updated_at = datetime('now')"
    ).bind(user.id, titleId, status, rating),
  ];

  const visibility = user.is_private ? "followers" : "public";
  const activitySql =
    "INSERT INTO activities (actor_id, type, title_id, value, visibility) VALUES (?1, ?2, ?3, ?4, ?5)";
  if (!existing || existing.status !== status) {
    statements.push(env.DB.prepare(activitySql).bind(user.id, "status", titleId, status, visibility));
  }
  if (rating !== null && (!existing || existing.rating !== rating)) {
    statements.push(
      env.DB.prepare(activitySql).bind(user.id, "rating", titleId, String(rating), visibility)
    );
  }

  await env.DB.batch(statements);
  return json({ ok: true, status: status, my_rating: rating });
}

async function handleLibraryDelete(url, env, user) {
  const ref = parseTitleRef(url.searchParams.get("tmdb_id"), url.searchParams.get("media_type"));
  if (!ref) return json({ error: "bad_title" }, 400);

  await env.DB.prepare(
    "DELETE FROM user_titles WHERE user_id = ?1 AND title_id = " +
      "(SELECT id FROM titles WHERE tmdb_id = ?2 AND media_type = ?3)"
  )
    .bind(user.id, ref.tmdbId, ref.mediaType)
    .run();

  return json({ ok: true });
}

// Makes sure the title exists in our own table (fetching it from TMDB the first time).
// Returns our internal title id, or null if TMDB does not know it.
async function ensureTitle(env, tmdbId, mediaType) {
  const found = await env.DB.prepare(
    "SELECT id FROM titles WHERE tmdb_id = ?1 AND media_type = ?2"
  )
    .bind(tmdbId, mediaType)
    .first();
  if (found) return found.id;

  const base = "/" + mediaType + "/" + tmdbId;
  const [en, fa] = await Promise.all([
    tmdbGet(env, base + "?language=en-US&append_to_response=external_ids", 86400),
    tmdbGet(env, base + "?language=fa-IR", 86400).catch(() => ({ data: null })),
  ]);
  if (en.status === 404 || !en.data) return null;

  const e = en.data;
  const f = fa && fa.data ? fa.data : {};

  const titleEn = e.title || e.name || e.original_title || e.original_name || "Untitled";
  const titleFaRaw = f.title || f.name || "";
  const titleFa = titleFaRaw && titleFaRaw !== titleEn ? titleFaRaw : null;
  const date = e.release_date || e.first_air_date || "";
  const year = date ? parseInt(date.slice(0, 4), 10) || null : null;
  const genres = Array.isArray(e.genres) ? JSON.stringify(e.genres.map((g) => g.name)) : null;
  const runtime =
    mediaType === "movie"
      ? e.runtime || null
      : Array.isArray(e.episode_run_time) && e.episode_run_time.length
      ? e.episode_run_time[0]
      : null;
  const imdbId = e.imdb_id || (e.external_ids && e.external_ids.imdb_id) || null;

  await env.DB.prepare(
    "INSERT OR IGNORE INTO titles " +
      "(tmdb_id, media_type, imdb_id, title, original_title, title_fa, year, overview, " +
      "poster_path, backdrop_path, genres, runtime, tmdb_rating) " +
      "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)"
  )
    .bind(
      tmdbId,
      mediaType,
      imdbId,
      titleEn,
      e.original_title || e.original_name || null,
      titleFa,
      year,
      f.overview || e.overview || null,
      f.poster_path || e.poster_path || null,
      e.backdrop_path || null,
      genres,
      runtime,
      typeof e.vote_average === "number" ? e.vote_average : null
    )
    .run();

  const row = await env.DB.prepare(
    "SELECT id FROM titles WHERE tmdb_id = ?1 AND media_type = ?2"
  )
    .bind(tmdbId, mediaType)
    .first();
  return row ? row.id : null;
}
