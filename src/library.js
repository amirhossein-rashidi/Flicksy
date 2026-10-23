// The user's library: list, set status/rating, remove.

import { json, STATUSES, parseTitleRef } from "./util.js";
import { TMDB_IMG, TMDB_BACKDROP, ensureTitle } from "./tmdb.js";

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

  const rating = body.rating === undefined ? null : body.rating;
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
