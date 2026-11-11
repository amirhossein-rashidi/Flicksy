// Home rows that are about you and your friends:
//   GET /api/home-rows?kind=rec      -> "Recommended for you" (from the titles you rated highly)
//   GET /api/home-rows?kind=fshows   -> series your friends watched lately
//   GET /api/home-rows?kind=fmovies  -> movies your friends watched lately
// Every answer is { results: [...] }. An empty list makes the app hide the row.
// Friends = people you follow (accepted) whose "show my activity" switch is on.

import { json, tmdbLang } from "./util.js";
import { tmdbGet, mapList, TMDB_IMG, posterSql } from "./tmdb.js";
import { attachLibraryState } from "./search.js";

const DAYS = 45;
const OUT = 20;

export async function handleHomeRows(url, env, user) {
  const kind = url.searchParams.get("kind");
  try {
    if (kind === "rec") return await recommended(url, env, user);
    if (kind === "fshows") return await friendsRow(env, user, "tv");
    if (kind === "fmovies") return await friendsRow(env, user, "movie");
  } catch (e) {
    return json({ results: [] });
  }
  return json({ error: "bad_kind" }, 400);
}

async function friendsRow(env, user, type) {
  const rows = await env.DB.prepare(
    "SELECT t.id AS tid, t.tmdb_id, t.media_type, t.title, t.title_fa, t.year, " + posterSql(user) + " AS poster_path, t.tmdb_rating, " +
      "ut.last_activity_at AS at, u.public_id, u.display_name, u.photo_url " +
      "FROM follows f " +
      "JOIN users u ON u.id = f.followed_id " +
      "JOIN user_titles ut ON ut.user_id = f.followed_id " +
      "JOIN titles t ON t.id = ut.title_id " +
      "WHERE f.follower_id = ?1 AND f.status = 'accepted' AND u.activity_visible = 1 " +
      "AND ut.status = 'watched' AND t.media_type = ?2 AND ut.last_activity_at >= date('now', ?3) " +
      "AND NOT EXISTS (SELECT 1 FROM user_titles m WHERE m.user_id = ?1 AND m.title_id = t.id AND m.status = 'watched') " +
      "ORDER BY ut.last_activity_at DESC LIMIT 300"
  )
    .bind(user.id, type, "-" + DAYS + " days")
    .all();

  const byTitle = new Map();
  for (const r of rows.results || []) {
    let g = byTitle.get(r.tid);
    if (!g) {
      g = {
        tmdb_id: r.tmdb_id,
        media_type: r.media_type,
        title: r.title_fa || r.title,
        original_title: r.title,
        title_en: r.title,
        title_fa: r.title_fa || null,
        year: r.year,
        poster: r.poster_path ? TMDB_IMG + r.poster_path : null,
        rating: typeof r.tmdb_rating === "number" && r.tmdb_rating > 0 ? Math.round(r.tmdb_rating * 10) / 10 : null,
        friends: { count: 0, sample: [] },
        _at: r.at,
      };
      byTitle.set(r.tid, g);
    }
    g.friends.count += 1;
    if (g.friends.sample.length < 3) {
      g.friends.sample.push({ public_id: r.public_id, display_name: r.display_name, photo_url: r.photo_url || null });
    }
  }
  const list = Array.from(byTitle.values());
  list.sort((a, b) => b.friends.count - a.friends.count || (a._at < b._at ? 1 : a._at > b._at ? -1 : 0));
  const results = list.slice(0, OUT).map((g) => {
    delete g._at;
    return g;
  });
  await attachLibraryState(env, user.id, results);
  return json({ results: results });
}

// Recommended for you: TMDB's "recommendations" for a few titles you rated 8+ (or, if you rated
// nothing high yet, the ones you watched last). Titles already in your library are left out.
async function recommended(url, env, user) {
  if (!env.TMDB_TOKEN) return json({ results: [] });

  let seeds = (
    await env.DB.prepare(
      "SELECT t.tmdb_id, t.media_type FROM user_titles ut JOIN titles t ON t.id = ut.title_id " +
        "WHERE ut.user_id = ?1 AND ut.status = 'watched' AND ut.rating >= 8 " +
        "ORDER BY ut.last_activity_at DESC LIMIT 12"
    )
      .bind(user.id)
      .all()
  ).results || [];
  if (seeds.length < 3) {
    const more =
      (
        await env.DB.prepare(
          "SELECT t.tmdb_id, t.media_type FROM user_titles ut JOIN titles t ON t.id = ut.title_id " +
            "WHERE ut.user_id = ?1 AND ut.status = 'watched' ORDER BY ut.last_activity_at DESC LIMIT 6"
        )
          .bind(user.id)
          .all()
      ).results || [];
    seeds = seeds.concat(more);
  }
  if (!seeds.length) return json({ results: [] });

  // a different handful each day-part, so the row is not always the same
  const day = Math.floor(Date.now() / 21600000);
  const picked = [];
  const pool = seeds.slice();
  for (let i = 0; i < 5 && pool.length; i++) {
    const k = (day * 7 + i * 3) % pool.length;
    picked.push(pool.splice(k, 1)[0]);
  }

  const lang = tmdbLang(url);
  const lists = await Promise.all(
    picked.map((s) =>
      tmdbGet(env, "/" + (s.media_type === "tv" ? "tv" : "movie") + "/" + s.tmdb_id + "/recommendations?language=" + lang + "&page=1", 21600)
        .then((r) => mapList(r.data, s.media_type === "tv" ? "tv" : "movie"))
        .catch(() => [])
    )
  );

  const score = new Map();
  lists.forEach((l) =>
    l.slice(0, 12).forEach((it, idx) => {
      const k = it.media_type + ":" + it.tmdb_id;
      const cur = score.get(k) || { it: it, n: 0 };
      cur.n += 12 - idx;
      score.set(k, cur);
    })
  );
  const merged = Array.from(score.values())
    .sort((a, b) => b.n - a.n)
    .map((x) => x.it)
    .slice(0, 40);
  await attachLibraryState(env, user.id, merged);
  const results = merged.filter((it) => !it.status).slice(0, OUT);
  return json({ results: results });
}
