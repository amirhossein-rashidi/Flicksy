// "Recap": my watching numbers for a period (this month / this year), for the share card.
//   GET /api/recap?from=YYYY-MM-DD&to=YYYY-MM-DD&lang=xx[&id=<Flicksy ID>]
// Without id: the signed-in person's own numbers. With id: that person's numbers, the same rule as a profile:
// a private profile shows them only to its owner and to accepted followers, everyone else gets { locked: true }.
// The answer carries "person" (who the recap belongs to) when id is given. Counted from the watch history (movies) and the
// watched episodes. Hours = runtime of what was watched (a missing runtime counts as 100 min for a
// movie and 40 min for an episode). Streak = the longest run of days in a row with something watched.

import { json } from "./util.js";
import { TMDB_IMG } from "./tmdb.js";

const MOVIE_MIN = 100;
const EPISODE_MIN = 40;
const MAX_DAYS = 400;
const MAX_ROWS = 20000;

function validDay(v) {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + "T12:00:00Z");
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v && v >= "2000-01-01";
}

function longestStreak(days) {
  const sorted = Array.from(new Set(days)).sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const day of sorted) {
    const t = Date.parse(day + "T12:00:00Z");
    run = prev !== null && Math.round((t - prev) / 86400000) === 1 ? run + 1 : 1;
    prev = t;
    if (run > best) best = run;
  }
  return best;
}

function genresOf(text) {
  try {
    const g = JSON.parse(text || "[]");
    return Array.isArray(g) ? g.filter((x) => typeof x === "string") : [];
  } catch (e) {
    return [];
  }
}

export async function handleRecap(url, env, user) {
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const fa = url.searchParams.get("lang") === "fa";
  if (!validDay(from) || !validDay(to) || from > to) return json({ error: "bad_range" }, 400);
  if ((Date.parse(to + "T12:00:00Z") - Date.parse(from + "T12:00:00Z")) / 86400000 > MAX_DAYS) {
    return json({ error: "bad_range" }, 400);
  }

  // whose recap: mine, or the person with this Flicksy ID
  let ownerId = user.id;
  let person = null;
  const pidRaw = url.searchParams.get("id");
  if (pidRaw) {
    if (!/^\d{3,12}$/.test(pidRaw)) return json({ error: "bad_id" }, 400);
    const target = await env.DB.prepare(
      "SELECT id, public_id, display_name, photo_url, is_private FROM users WHERE public_id = ?1"
    )
      .bind(pidRaw)
      .first();
    if (!target) return json({ error: "not_found" }, 404);
    person = { public_id: target.public_id, display_name: target.display_name, photo_url: target.photo_url || null, is_me: target.id === user.id };
    if (target.id !== user.id && target.is_private === 1) {
      const f = await env.DB.prepare("SELECT status FROM follows WHERE follower_id = ?1 AND followed_id = ?2")
        .bind(user.id, target.id)
        .first();
      if (!f || f.status !== "accepted") return json({ locked: true, person: person });
    }
    ownerId = target.id;
  }

  const rs = await env.DB.batch([
    env.DB.prepare(
      "SELECT w.watched_on AS day, t.id AS tid, t.title, t.title_fa, t.poster_path, t.genres, t.runtime " +
        "FROM watch_log w JOIN titles t ON t.id = w.title_id " +
        "WHERE w.user_id = ?1 AND t.media_type = 'movie' AND w.watched_on >= ?2 AND w.watched_on <= ?3 LIMIT " + MAX_ROWS
    ).bind(ownerId, from, to),
    env.DB.prepare(
      "SELECT substr(ep.watched_at, 1, 10) AS day, t.id AS tid, t.title, t.title_fa, t.poster_path, t.genres, t.runtime " +
        "FROM episode_progress ep JOIN titles t ON t.id = ep.title_id " +
        "WHERE ep.user_id = ?1 AND ep.season_number >= 1 AND substr(ep.watched_at, 1, 10) >= ?2 AND substr(ep.watched_at, 1, 10) <= ?3 LIMIT " + MAX_ROWS
    ).bind(ownerId, from, to),
  ]);
  const movieRows = (rs[0] && rs[0].results) || [];
  const episodeRows = (rs[1] && rs[1].results) || [];

  let minutes = 0;
  const days = [];
  const movieTitles = new Set();
  const genreCount = {};
  const titleCount = new Map();

  function add(r, mins) {
    minutes += mins;
    days.push(r.day);
    genresOf(r.genres).forEach((g) => { genreCount[g] = (genreCount[g] || 0) + 1; });
    const cur = titleCount.get(r.tid) || { n: 0, row: r };
    cur.n += 1;
    titleCount.set(r.tid, cur);
  }
  movieRows.forEach((r) => { movieTitles.add(r.tid); add(r, r.runtime || MOVIE_MIN); });
  episodeRows.forEach((r) => add(r, r.runtime || EPISODE_MIN));

  let genre = null;
  let bestG = 0;
  Object.keys(genreCount).forEach((g) => { if (genreCount[g] > bestG) { bestG = genreCount[g]; genre = g; } });

  const top = Array.from(titleCount.values())
    .sort((a, b) => b.n - a.n)
    .slice(0, 3)
    .map((x) => ({
      title: (fa && x.row.title_fa) || x.row.title,
      poster: x.row.poster_path ? TMDB_IMG + x.row.poster_path : null,
      count: x.n,
    }));

  return json({
    from: from,
    to: to,
    minutes: minutes,
    movies: movieTitles.size,
    episodes: episodeRows.length,
    streak: longestStreak(days),
    genre: genre,
    top: top,
    person: person,
  });
}
