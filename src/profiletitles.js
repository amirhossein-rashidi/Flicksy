// GET /api/profile-titles?id=<public_id>&kind=movies|series&limit=10&offset=0
// -> { items: [...], more: bool, locked: bool }
// The movies / series shelves on a profile (and the "see all" page behind them).
//   movies = status watched; series = status watched or watching. Newest activity first.
// Same privacy as the profile lists: a private profile is shown only to the owner and accepted followers.

import { json } from "./util.js";
import { TMDB_IMG, posterSql } from "./tmdb.js";
import { cleanPublicId } from "./social.js";

const KINDS = {
  movies: { type: "movie", statuses: ["watched"] },
  series: { type: "tv", statuses: ["watched", "watching"] },
};

export async function handleProfileTitles(url, env, user) {
  const pid = cleanPublicId(url.searchParams.get("id"));
  const kind = KINDS[url.searchParams.get("kind") || ""];
  if (!pid || !kind) return json({ error: "bad_request" }, 400);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "10", 10) || 10, 1), 60);
  const offset = Math.min(Math.max(parseInt(url.searchParams.get("offset") || "0", 10) || 0, 0), 2000);

  const target = await env.DB.prepare("SELECT id, is_private FROM users WHERE public_id = ?1").bind(pid).first();
  if (!target) return json({ error: "not_found" }, 404);

  let canSee = target.id === user.id || target.is_private !== 1;
  if (!canSee) {
    const f = await env.DB.prepare("SELECT status FROM follows WHERE follower_id = ?1 AND followed_id = ?2")
      .bind(user.id, target.id)
      .first();
    canSee = !!f && f.status === "accepted";
  }
  if (!canSee) return json({ items: [], more: false, locked: true });

  // one ordered read per status (each follows the user_titles index), merged here
  const need = offset + limit + 1;
  const sql =
    "SELECT ut.id AS ut_id, ut.last_activity_at AS at, t.tmdb_id, t.media_type, t.title, t.title_fa, t.year, " +
    posterSql(user) + " AS poster_path, t.tmdb_rating " +
    "FROM user_titles ut JOIN titles t ON t.id = ut.title_id " +
    "WHERE ut.user_id = ?1 AND ut.status = ?2 AND t.media_type = ?3 " +
    "ORDER BY ut.last_activity_at DESC, ut.id DESC LIMIT " + need;
  const parts = await env.DB.batch(kind.statuses.map((s) => env.DB.prepare(sql).bind(target.id, s, kind.type)));
  const rows = [];
  for (const p of parts) for (const r of p.results || []) rows.push(r);
  rows.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : b.ut_id - a.ut_id));

  const page = rows.slice(offset, offset + limit);
  const items = page.map((r) => ({
    tmdb_id: r.tmdb_id,
    media_type: r.media_type,
    title: r.title_fa || r.title,
    original_title: r.title,
    title_en: r.title,
    title_fa: r.title_fa || null,
    year: r.year,
    poster: r.poster_path ? TMDB_IMG + r.poster_path : null,
    rating: typeof r.tmdb_rating === "number" && r.tmdb_rating > 0 ? Math.round(r.tmdb_rating * 10) / 10 : null,
  }));
  return json({ items: items, more: rows.length > offset + limit, locked: false });
}
