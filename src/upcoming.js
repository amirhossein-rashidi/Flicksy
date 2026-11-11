// New episodes: the next episode to air of the series you are watching or want to watch.
//   GET /api/upcoming?days=14|60  -> { results: [{ ...title, air: "YYYY-MM-DD", season, episode }] } sorted by date
// The next-episode info is cached on the title (columns next_*; migration 20) and refreshed from TMDB
// when it is old. At most REFRESH_MAX series are refreshed per request (CPU limit), so a big
// library fills in over the first few visits.

import { json } from "./util.js";
import { tmdbGet, TMDB_IMG, posterSql } from "./tmdb.js";

const REFRESH_MAX = 12;
const HOUR = 3600 * 1000;

function parseDb(s) {
  return s ? new Date(String(s).replace(" ", "T") + "Z").getTime() : 0;
}

export async function handleUpcoming(url, env, user) {
  const days = url.searchParams.get("days") === "60" ? 60 : 14;
  const now = Date.now();
  const today = new Date(now).toISOString().slice(0, 10);

  let rows;
  try {
    rows = (
      await env.DB.prepare(
        "SELECT t.id AS tid, t.tmdb_id, t.title, t.title_fa, t.year, " + posterSql(user) + " AS poster_path, t.tmdb_rating, " +
          "t.next_air_date, t.next_season, t.next_episode, t.next_checked_at, ut.status " +
          "FROM user_titles ut JOIN titles t ON t.id = ut.title_id " +
          "WHERE ut.user_id = ?1 AND t.media_type = 'tv' AND ut.status IN ('watching', 'want')"
      )
        .bind(user.id)
        .all()
    ).results || [];
  } catch (e) {
    return json({ results: [], pending_migration: true });
  }

  // which ones are out of date: never checked, a date that has passed, or checked long ago
  const stale = rows.filter((r) => {
    const age = now - parseDb(r.next_checked_at);
    if (!r.next_checked_at) return true;
    if (r.next_air_date && r.next_air_date < today) return true;
    return age > (r.next_air_date ? 24 * HOUR : 72 * HOUR);
  });
  stale.sort((a, b) => (a.next_checked_at ? 1 : 0) - (b.next_checked_at ? 1 : 0) || (a.status === "watching" ? 0 : 1) - (b.status === "watching" ? 0 : 1));
  const batch = stale.slice(0, REFRESH_MAX);

  if (batch.length && env.TMDB_TOKEN) {
    const got = await Promise.all(
      batch.map((r) =>
        tmdbGet(env, "/tv/" + r.tmdb_id + "?language=en-US", 3600)
          .then((res) => ({ r: r, d: res.data }))
          .catch(() => ({ r: r, d: undefined }))
      )
    );
    const stmts = [];
    for (const g of got) {
      if (g.d === undefined) continue; // TMDB hiccup: try again next time
      const ne = g.d && g.d.next_episode_to_air;
      g.r.next_air_date = ne && ne.air_date ? ne.air_date : "";
      g.r.next_season = ne && ne.season_number != null ? ne.season_number : null;
      g.r.next_episode = ne && ne.episode_number != null ? ne.episode_number : null;
      g.r.next_checked_at = new Date(now).toISOString().slice(0, 19).replace("T", " ");
      stmts.push(
        env.DB.prepare("UPDATE titles SET next_air_date = ?1, next_season = ?2, next_episode = ?3, next_checked_at = ?4 WHERE id = ?5")
          .bind(g.r.next_air_date, g.r.next_season, g.r.next_episode, g.r.next_checked_at, g.r.tid)
      );
    }
    if (stmts.length) {
      try { await env.DB.batch(stmts); } catch (e) {}
    }
  }

  // one day of slack before today so a phone in a later time zone still sees "today"
  const from = new Date(now - 24 * HOUR).toISOString().slice(0, 10);
  const to = new Date(now + days * 24 * HOUR).toISOString().slice(0, 10);
  const results = rows
    .filter((r) => r.next_air_date && r.next_air_date >= from && r.next_air_date <= to)
    .sort((a, b) => (a.next_air_date < b.next_air_date ? -1 : a.next_air_date > b.next_air_date ? 1 : (a.title < b.title ? -1 : 1)))
    .map((r) => ({
      tmdb_id: r.tmdb_id,
      media_type: "tv",
      title: r.title_fa || r.title,
      original_title: r.title,
      title_en: r.title,
      title_fa: r.title_fa || null,
      year: r.year,
      poster: r.poster_path ? TMDB_IMG + r.poster_path : null,
      rating: typeof r.tmdb_rating === "number" && r.tmdb_rating > 0 ? Math.round(r.tmdb_rating * 10) / 10 : null,
      status: r.status,
      my_rating: null,
      air: r.next_air_date,
      season: r.next_season,
      episode: r.next_episode,
    }));
  return json({ results: results });
}
