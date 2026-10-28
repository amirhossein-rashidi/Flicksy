// The user's library: list, set status/rating, remove.

import { json, STATUSES, parseTitleRef } from "./util.js";
import { TMDB_IMG, TMDB_BACKDROP, ensureTitle } from "./tmdb.js";

// The feelings a user can attach to a title they watched (max 3).
export const MOODS = ["😍", "😂", "😢", "😱", "🤯", "😴", "😡", "🤔"];

// undefined = not sent (keep what is saved); null = clear; array = new value; false = invalid.
function parseMood(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!Array.isArray(value) || value.length > 3) return false;
  const out = [];
  for (const m of value) {
    if (!MOODS.includes(m)) return false;
    if (!out.includes(m)) out.push(m);
  }
  return out.length ? out : null;
}

// Favorite actor: { id, name, photo }. Same undefined / null / false rules as above.
function parseActor(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) return false;
  if (!Number.isInteger(value.id) || value.id <= 0) return false;
  if (typeof value.name !== "string" || !value.name.trim() || value.name.length > 100) return false;
  let photo = null;
  if (value.photo !== undefined && value.photo !== null) {
    if (typeof value.photo !== "string" || value.photo.length > 200) return false;
    if (!value.photo.startsWith("https://image.tmdb.org/")) return false;
    photo = value.photo;
  }
  return { id: value.id, name: value.name.trim(), photo: photo };
}

export async function handleLibraryList(url, env, user) {
  const status = url.searchParams.get("status");
  if (status && !STATUSES.includes(status)) return json({ error: "bad_status" }, 400);

  let sql =
    "SELECT t.tmdb_id, t.media_type, t.title, t.title_fa, t.year, t.poster_path, t.backdrop_path, " +
    "ut.status, ut.rating, ut.updated_at " +
    "FROM user_titles ut JOIN titles t ON t.id = ut.title_id " +
    "WHERE ut.user_id = ?1";
  const binds = [user.id];
  if (status) {
    sql += " AND ut.status = ?2";
    binds.push(status);
  }
  // pages: ?limit=500&offset=0 (the app loads big libraries page by page)
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "100", 10) || 100, 1), 500);
  const offset = Math.min(Math.max(parseInt(url.searchParams.get("offset") || "0", 10) || 0, 0), 100000);
  sql += " ORDER BY ut.updated_at DESC, ut.id DESC LIMIT " + limit + " OFFSET " + offset;

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
    title_en: r.title,
    title_fa: r.title_fa || null,
    year: r.year,
    poster: r.poster_path ? TMDB_IMG + r.poster_path : null,
    backdrop: r.backdrop_path ? TMDB_BACKDROP + r.backdrop_path : null,
    status: r.status,
    my_rating: r.rating,
  }));

  return json({ items: items, counts: counts });
}

export async function handleLibrarySet(request, env, user) {
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

  const moodIn = parseMood(body.mood);
  if (moodIn === false) return json({ error: "bad_mood" }, 400);
  const actorIn = parseActor(body.actor);
  if (actorIn === false) return json({ error: "bad_actor" }, 400);

  if (!env.TMDB_TOKEN) return json({ error: "server_misconfigured" }, 500);

  let titleId;
  try {
    titleId = await ensureTitle(env, ref.tmdbId, ref.mediaType);
  } catch (e) {
    return json({ error: "title_unavailable" }, 502);
  }
  if (!titleId) return json({ error: "title_not_found" }, 404);

  const existing = await env.DB.prepare(
    "SELECT status, rating, mood, fav_actor_id, fav_actor_name, fav_actor_photo " +
      "FROM user_titles WHERE user_id = ?1 AND title_id = ?2"
  )
    .bind(user.id, titleId)
    .first();

  // Rating, feelings and favorite actor only exist for titles that were watched.
  let mood = null;
  let actor = null;
  if (status === "watched") {
    if (moodIn === undefined) mood = existing && existing.mood ? existing.mood : null;
    else mood = moodIn ? moodIn.join(",") : null;
    if (actorIn === undefined) {
      actor =
        existing && existing.fav_actor_id
          ? { id: existing.fav_actor_id, name: existing.fav_actor_name, photo: existing.fav_actor_photo }
          : null;
    } else actor = actorIn;
  } else {
    rating = null;
  }

  const statements = [
    env.DB.prepare(
      "INSERT INTO user_titles (user_id, title_id, status, rating, mood, fav_actor_id, fav_actor_name, " +
        "fav_actor_photo, started_at, finished_at) " +
        "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, " +
        "CASE WHEN ?3 = 'watching' THEN datetime('now') ELSE NULL END, " +
        "CASE WHEN ?3 = 'watched' THEN datetime('now') ELSE NULL END) " +
        "ON CONFLICT(user_id, title_id) DO UPDATE SET " +
        "status = excluded.status, " +
        "rating = excluded.rating, " +
        "mood = excluded.mood, " +
        "fav_actor_id = excluded.fav_actor_id, " +
        "fav_actor_name = excluded.fav_actor_name, " +
        "fav_actor_photo = excluded.fav_actor_photo, " +
        "started_at = CASE WHEN excluded.status = 'watching' AND user_titles.started_at IS NULL " +
        "THEN datetime('now') ELSE user_titles.started_at END, " +
        "finished_at = CASE WHEN excluded.status = 'watched' AND user_titles.finished_at IS NULL " +
        "THEN datetime('now') ELSE user_titles.finished_at END, " +
        "updated_at = datetime('now')"
    ).bind(
      user.id,
      titleId,
      status,
      rating,
      mood,
      actor ? actor.id : null,
      actor ? actor.name : null,
      actor ? actor.photo : null
    ),
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
  return json({
    ok: true,
    status: status,
    my_rating: rating,
    mood: mood ? mood.split(",") : [],
    fav_actor: actor,
  });
}

export async function handleLibraryDelete(url, env, user) {
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
