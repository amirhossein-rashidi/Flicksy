// Episode tracking for TV series: seasons, episodes, and which ones the user has watched.

import { json, parseTitleRef, tmdbLang } from "./util.js";
import { tmdbGet, ensureTitle, imgUrl, TMDB_BACKDROP } from "./tmdb.js";

const CACHE_SECONDS = 6 * 60 * 60; // TMDB season/episode data is cached for 6 hours
const MAX_SEASON = 100;
const MAX_EPISODE = 2000;

function parseIntParam(value, min, max) {
  const n = typeof value === "string" ? parseInt(value, 10) : value;
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

// Series info from TMDB: list of seasons (specials excluded) and the total episode count.
async function getSeasons(env, tmdbId, language) {
  const res = await tmdbGet(env, "/tv/" + tmdbId + "?language=" + (language || "en-US"), CACHE_SECONDS);
  if (res.status === 404 || !res.data) return null;
  const seasons = (Array.isArray(res.data.seasons) ? res.data.seasons : [])
    .filter((s) => Number.isInteger(s.season_number) && s.season_number >= 1 && s.episode_count > 0)
    .map((s) => ({
      season_number: s.season_number,
      name: s.name || "",
      episode_count: s.episode_count,
      air_date: s.air_date || null,
    }));
  const total = seasons.reduce((sum, s) => sum + s.episode_count, 0);
  return { seasons: seasons, total: total };
}

async function getTitleId(env, tmdbId) {
  const row = await env.DB.prepare("SELECT id FROM titles WHERE tmdb_id = ?1 AND media_type = 'tv'")
    .bind(tmdbId)
    .first();
  return row ? row.id : null;
}

// GET /api/tv?tmdb_id=  -> seasons with how many episodes the user watched in each
export async function handleTvInfo(url, env, user) {
  const ref = parseTitleRef(url.searchParams.get("tmdb_id"), "tv");
  if (!ref) return json({ error: "bad_title" }, 400);
  if (!env.TMDB_TOKEN) return json({ error: "server_misconfigured" }, 500);

  let info;
  try {
    info = await getSeasons(env, ref.tmdbId, tmdbLang(url));
  } catch (e) {
    return json({ error: "title_unavailable" }, 502);
  }
  if (!info) return json({ error: "title_not_found" }, 404);

  const perSeason = new Map();
  const titleId = await getTitleId(env, ref.tmdbId);
  if (titleId) {
    const rows = await env.DB.prepare(
      "SELECT season_number, COUNT(*) AS n FROM episode_progress " +
        "WHERE user_id = ?1 AND title_id = ?2 AND season_number >= 1 GROUP BY season_number"
    )
      .bind(user.id, titleId)
      .all();
    for (const r of rows.results || []) perSeason.set(r.season_number, r.n);
  }

  let watched = 0;
  const seasons = info.seasons.map((s) => {
    const w = Math.min(perSeason.get(s.season_number) || 0, s.episode_count);
    watched += w;
    return Object.assign({}, s, { watched: w });
  });
  return json({ seasons: seasons, total: info.total, watched: watched });
}

// GET /api/episodes?tmdb_id=&season=  -> episodes of one season with watched flags
export async function handleSeasonEpisodes(url, env, user) {
  const ref = parseTitleRef(url.searchParams.get("tmdb_id"), "tv");
  const season = parseIntParam(url.searchParams.get("season"), 1, MAX_SEASON);
  if (!ref || season === null) return json({ error: "bad_title" }, 400);
  if (!env.TMDB_TOKEN) return json({ error: "server_misconfigured" }, 500);

  let res;
  try {
    res = await tmdbGet(env, "/tv/" + ref.tmdbId + "/season/" + season + "?language=" + tmdbLang(url), CACHE_SECONDS);
  } catch (e) {
    return json({ error: "title_unavailable" }, 502);
  }
  if (res.status === 404 || !res.data) return json({ error: "season_not_found" }, 404);

  const watchedMap = new Map();
  const notesMap = new Map();
  const titleId = await getTitleId(env, ref.tmdbId);
  if (titleId) {
    const rows = await env.DB.prepare(
      "SELECT episode_number, watched_at FROM episode_progress WHERE user_id = ?1 AND title_id = ?2 AND season_number = ?3"
    )
      .bind(user.id, titleId, season)
      .all();
    for (const r of rows.results || []) watchedMap.set(r.episode_number, r.watched_at || "");
    // my rating / feelings / favorite character per episode (the table may not exist before migration 9)
    try {
      const nrows = await env.DB.prepare(
        "SELECT episode_number, rating, mood, fav_actor_id, fav_actor_name, fav_actor_photo FROM episode_notes " +
          "WHERE user_id = ?1 AND title_id = ?2 AND season_number = ?3"
      )
        .bind(user.id, titleId, season)
        .all();
      for (const r of nrows.results || []) notesMap.set(r.episode_number, r);
    } catch (e) {
      /* no notes yet */
    }
  }

  const list = Array.isArray(res.data.episodes) ? res.data.episodes : [];
  const episodes = list.map((e) => {
    const isWatched = watchedMap.has(e.episode_number);
    const n = notesMap.get(e.episode_number);
    const at = watchedMap.get(e.episode_number) || "";
    return {
      episode_number: e.episode_number,
      name: e.name || "",
      air_date: e.air_date || null,
      runtime: e.runtime || null,
      overview: e.overview || "",
      still: imgUrl(TMDB_BACKDROP, e.still_path),
      vote: e.vote_average && e.vote_count > 0 ? Math.round(e.vote_average * 10) / 10 : null,
      watched: isWatched,
      watched_on: isWatched && /^\d{4}-\d{2}-\d{2}/.test(at) ? at.slice(0, 10) : null,
      my:
        isWatched && n
          ? {
              rating: n.rating || null,
              mood: n.mood ? n.mood.split(",").filter(Boolean) : [],
              actor: n.fav_actor_id ? { id: n.fav_actor_id, name: n.fav_actor_name, photo: n.fav_actor_photo } : null,
            }
          : null,
    };
  });
  return json({ season: season, episodes: episodes });
}

function range(from, to) {
  const out = [];
  for (let i = from; i <= to; i++) out.push(i);
  return out;
}

// PUT /api/episodes
// body: { tmdb_id, scope: "episode"|"season"|"all", season?, episode?, watched: true|false }
export async function handleEpisodesSet(request, env, user) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "bad_json" }, 400);
  }
  if (!body || typeof body !== "object") return json({ error: "bad_request" }, 400);

  const ref = parseTitleRef(body.tmdb_id, "tv");
  if (!ref) return json({ error: "bad_title" }, 400);
  if (typeof body.watched !== "boolean") return json({ error: "bad_request" }, 400);
  const scope = body.scope;
  if (scope !== "episode" && scope !== "season" && scope !== "all") {
    return json({ error: "bad_request" }, 400);
  }
  const season = scope === "all" ? null : parseIntParam(body.season, 1, MAX_SEASON);
  const episode = scope === "episode" ? parseIntParam(body.episode, 1, MAX_EPISODE) : null;
  if (scope !== "all" && season === null) return json({ error: "bad_request" }, 400);
  if (scope === "episode" && episode === null) return json({ error: "bad_request" }, 400);
  if (!env.TMDB_TOKEN) return json({ error: "server_misconfigured" }, 500);

  // Which (season -> episode numbers) are we changing?
  const plan = []; // [{season, numbers}]
  let info = null;
  try {
    if (scope === "episode") {
      plan.push({ season: season, numbers: [episode] });
    } else if (scope === "season") {
      const res = await tmdbGet(env, "/tv/" + ref.tmdbId + "/season/" + season + "?language=en-US", CACHE_SECONDS);
      if (res.status === 404 || !res.data) return json({ error: "season_not_found" }, 404);
      const numbers = (Array.isArray(res.data.episodes) ? res.data.episodes : [])
        .map((e) => e.episode_number)
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= MAX_EPISODE);
      plan.push({ season: season, numbers: numbers });
    } else {
      info = await getSeasons(env, ref.tmdbId, "en-US");
      if (!info) return json({ error: "title_not_found" }, 404);
      for (const s of info.seasons) {
        plan.push({ season: s.season_number, numbers: range(1, Math.min(s.episode_count, MAX_EPISODE)) });
      }
    }
  } catch (e) {
    return json({ error: "title_unavailable" }, 502);
  }

  let titleId;
  try {
    titleId = await ensureTitle(env, ref.tmdbId, "tv");
  } catch (e) {
    return json({ error: "title_unavailable" }, 502);
  }
  if (!titleId) return json({ error: "title_not_found" }, 404);

  const statements = [];
  for (const p of plan) {
    if (p.numbers.length === 0) continue;
    const arr = JSON.stringify(p.numbers);
    if (body.watched) {
      statements.push(
        env.DB.prepare(
          "INSERT OR IGNORE INTO episode_progress (user_id, title_id, season_number, episode_number) " +
            "SELECT ?1, ?2, ?3, value FROM json_each(?4)"
        ).bind(user.id, titleId, p.season, arr)
      );
    } else {
      statements.push(
        env.DB.prepare(
          "DELETE FROM episode_progress WHERE user_id = ?1 AND title_id = ?2 AND season_number = ?3 " +
            "AND episode_number IN (SELECT value FROM json_each(?4))"
        ).bind(user.id, titleId, p.season, arr)
      );
    }
  }

  // Marking something watched moves a series that is not in the library (or is only
  // "want to watch") to "watching".
  let libraryStatus = null;
  const existing = await env.DB.prepare(
    "SELECT status FROM user_titles WHERE user_id = ?1 AND title_id = ?2"
  )
    .bind(user.id, titleId)
    .first();
  libraryStatus = existing ? existing.status : null;

  if (body.watched && (!existing || existing.status === "want")) {
    statements.push(
      env.DB.prepare(
        "INSERT INTO user_titles (user_id, title_id, status, started_at) " +
          "VALUES (?1, ?2, 'watching', datetime('now')) " +
          "ON CONFLICT(user_id, title_id) DO UPDATE SET status = 'watching', " +
          "started_at = COALESCE(user_titles.started_at, datetime('now')), updated_at = datetime('now')"
      ).bind(user.id, titleId)
    );
    statements.push(
      env.DB.prepare(
        "INSERT INTO activities (actor_id, type, title_id, value, visibility) VALUES (?1, 'status', ?2, 'watching', ?3)"
      ).bind(user.id, titleId, user.is_private ? "followers" : "public")
    );
    libraryStatus = "watching";
  }

  if (statements.length) await env.DB.batch(statements);

  // Un-marking episodes also forgets my rating / feelings for them (best effort).
  if (body.watched === false) {
    try {
      if (scope === "episode") {
        await env.DB.prepare(
          "DELETE FROM episode_notes WHERE user_id = ?1 AND title_id = ?2 AND season_number = ?3 AND episode_number = ?4"
        )
          .bind(user.id, titleId, season, episode)
          .run();
      } else if (scope === "season") {
        await env.DB.prepare("DELETE FROM episode_notes WHERE user_id = ?1 AND title_id = ?2 AND season_number = ?3")
          .bind(user.id, titleId, season)
          .run();
      } else {
        await env.DB.prepare("DELETE FROM episode_notes WHERE user_id = ?1 AND title_id = ?2")
          .bind(user.id, titleId)
          .run();
      }
    } catch (e) {
      /* table not created yet */
    }
  }

  // Fresh numbers for the screen.
  if (!info) {
    try {
      info = await getSeasons(env, ref.tmdbId, "en-US");
    } catch (e) {
      info = null;
    }
  }
  const total = info ? info.total : null;

  const w = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM episode_progress WHERE user_id = ?1 AND title_id = ?2 AND season_number >= 1"
  )
    .bind(user.id, titleId)
    .first();
  const watched = w ? w.n : 0;

  let seasonWatched = null;
  if (season !== null) {
    const sw = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM episode_progress WHERE user_id = ?1 AND title_id = ?2 AND season_number = ?3"
    )
      .bind(user.id, titleId, season)
      .first();
    seasonWatched = sw ? sw.n : 0;
  }

  return json({
    ok: true,
    watched: watched,
    total: total,
    season_watched: seasonWatched,
    library_status: libraryStatus,
    complete: total !== null && total > 0 && watched >= total,
  });
}

const NOTE_MOODS = ["😍", "😂", "😢", "😱", "🤯", "😴", "😡", "🤔"];

// PUT /api/episode-note
// body: { tmdb_id, season, episode, rating?: 1-10|null, mood?: [emoji], actor?: {id,name,photo}|null }
// Only the fields that are sent are changed. The episode has to be marked watched first.
export async function handleEpisodeNoteSet(request, env, user) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "bad_json" }, 400);
  }
  if (!body || typeof body !== "object") return json({ error: "bad_request" }, 400);
  const ref = parseTitleRef(body.tmdb_id, "tv");
  const season = parseIntParam(body.season, 1, MAX_SEASON);
  const episode = parseIntParam(body.episode, 1, MAX_EPISODE);
  if (!ref || season === null || episode === null) return json({ error: "bad_request" }, 400);

  const sets = [];
  const binds = [];
  if (body.rating !== undefined) {
    if (body.rating !== null && !(Number.isInteger(body.rating) && body.rating >= 1 && body.rating <= 10)) {
      return json({ error: "bad_request" }, 400);
    }
    sets.push("rating = ?");
    binds.push(body.rating);
  }
  if (body.mood !== undefined) {
    if (!Array.isArray(body.mood) || body.mood.length > 3 || body.mood.some((m) => NOTE_MOODS.indexOf(m) < 0)) {
      return json({ error: "bad_request" }, 400);
    }
    sets.push("mood = ?");
    binds.push(body.mood.length ? body.mood.join(",") : null);
  }
  if (body.actor !== undefined) {
    const a = body.actor;
    if (a === null) {
      sets.push("fav_actor_id = ?", "fav_actor_name = ?", "fav_actor_photo = ?");
      binds.push(null, null, null);
    } else {
      if (!a || !Number.isInteger(a.id) || a.id < 1 || typeof a.name !== "string") return json({ error: "bad_request" }, 400);
      const photo = typeof a.photo === "string" && a.photo.length < 400 && /^https:\/\//.test(a.photo) ? a.photo : null;
      sets.push("fav_actor_id = ?", "fav_actor_name = ?", "fav_actor_photo = ?");
      binds.push(a.id, a.name.slice(0, 100), photo);
    }
  }
  if (!sets.length) return json({ error: "bad_request" }, 400);

  const titleId = await getTitleId(env, ref.tmdbId);
  if (!titleId) return json({ error: "title_not_found" }, 404);

  try {
    const seen = await env.DB.prepare(
      "SELECT 1 AS x FROM episode_progress WHERE user_id = ?1 AND title_id = ?2 AND season_number = ?3 AND episode_number = ?4"
    )
      .bind(user.id, titleId, season, episode)
      .first();
    if (!seen) return json({ error: "not_watched" }, 409);

    await env.DB.prepare(
      "INSERT OR IGNORE INTO episode_notes (user_id, title_id, season_number, episode_number) VALUES (?1, ?2, ?3, ?4)"
    )
      .bind(user.id, titleId, season, episode)
      .run();
    // placeholders ?1-?4 are the fixed ones; the changed columns continue from ?5
    let n = 4;
    const setSql = sets.map((x) => x.replace("?", () => "?" + ++n)).join(", ");
    await env.DB.prepare(
      "UPDATE episode_notes SET " + setSql + ", updated_at = datetime('now') " +
        "WHERE user_id = ?1 AND title_id = ?2 AND season_number = ?3 AND episode_number = ?4"
    )
      .bind(user.id, titleId, season, episode, ...binds)
      .run();
  } catch (e) {
    return json({ error: "save_failed" }, 500);
  }
  return json({ ok: true });
}
