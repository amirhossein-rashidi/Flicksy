// Title search (via TMDB), marking which results are already in the user's library.

import { json } from "./util.js";
import { tmdbGet, mapSearchResults } from "./tmdb.js";

export async function handleSearch(url, env, user) {
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
