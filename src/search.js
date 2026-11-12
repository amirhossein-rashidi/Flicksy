// Title search (via TMDB), marking which results are already in the user's library.
// With kind=actors the same endpoint searches actors by name instead (the "Actors" tab on Discover).

import { json, tmdbLang } from "./util.js";
import { tmdbGet, mapSearchResults, imgUrl, TMDB_PROFILE } from "./tmdb.js";

export async function handleSearch(url, env, user) {
  if (!env.TMDB_TOKEN) return json({ error: "server_misconfigured" }, 500);

  const q = (url.searchParams.get("q") || "").trim();
  if (q.length < 2) return json({ results: [] });
  if (q.length > 100) return json({ error: "query_too_long" }, 400);
  if (url.searchParams.get("kind") === "actors") return await searchActors(q, url, env);

  let data;
  try {
    const res = await tmdbGet(
      env,
      "/search/multi?include_adult=false&language=" + tmdbLang(url) + "&page=1&query=" + encodeURIComponent(q),
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

// Actors only (directors, writers and other crew are left out). TMDB already orders by popularity.
async function searchActors(q, url, env) {
  let data;
  try {
    const res = await tmdbGet(
      env,
      "/search/person?include_adult=false&language=" + tmdbLang(url) + "&page=1&query=" + encodeURIComponent(q),
      3600
    );
    data = res.data;
  } catch (e) {
    return json({ error: "search_unavailable" }, 502);
  }

  const list = Array.isArray(data && data.results) ? data.results : [];
  const results = list
    .filter((p) => p.known_for_department === "Acting")
    .slice(0, 20)
    .map((p) => ({
      id: p.id,
      name: p.name || "",
      photo: imgUrl(TMDB_PROFILE, p.profile_path),
      known_for: (Array.isArray(p.known_for) ? p.known_for : [])
        .map((k) => k.title || k.name || "")
        .filter(Boolean)
        .slice(0, 3),
    }));
  return json({ results: results });
}

export async function attachLibraryState(env, userId, results) {
  const ids = results.map((r) => r.tmdb_id).filter((n) => Number.isInteger(n));
  if (ids.length === 0) return;

  // Looks the titles up first, then checks only those in my library (instead of walking my whole library).
  const placeholders = ids.map((_, i) => "?" + (i + 2)).join(",");
  const rows = await env.DB.prepare(
    "SELECT t.tmdb_id, t.media_type, ut.status, ut.rating " +
      "FROM user_titles ut JOIN titles t ON t.id = ut.title_id " +
      "WHERE ut.user_id = ?1 AND ut.title_id IN (SELECT id FROM titles WHERE tmdb_id IN (" + placeholders + "))"
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
