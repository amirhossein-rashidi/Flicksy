// Full details for one movie or series (the title page).

import { json, parseTitleRef, tmdbLang } from "./util.js";
import { tmdbGet, mapList, imgUrl, TMDB_IMG, TMDB_BACKDROP, TMDB_PROFILE } from "./tmdb.js";
import { attachLibraryState } from "./search.js";

export async function handleTitle(url, env, user) {
  const ref = parseTitleRef(url.searchParams.get("tmdb_id"), url.searchParams.get("media_type"));
  if (!ref) return json({ error: "bad_title" }, 400);
  if (!env.TMDB_TOKEN) return json({ error: "server_misconfigured" }, 500);

  const language = tmdbLang(url);
  const base = "/" + ref.mediaType + "/" + ref.tmdbId;

  let res;
  try {
    res = await tmdbGet(env, base + "?language=" + language + "&append_to_response=credits,recommendations,videos&include_video_language=" + (language.slice(0, 2) + ",en,null"), 21600);
  } catch (e) {
    return json({ error: "title_unavailable" }, 502);
  }
  if (res.status === 404 || !res.data) return json({ error: "title_not_found" }, 404);
  const d = res.data;

  // Some titles have no translated description: fall back to English.
  let overview = d.overview || "";
  let tagline = d.tagline || "";
  if (!overview && language !== "en-US") {
    try {
      const en = await tmdbGet(env, base + "?language=en-US", 21600);
      if (en.data) {
        overview = en.data.overview || "";
        tagline = tagline || en.data.tagline || "";
      }
    } catch (e) {}
  }

  const isTv = ref.mediaType === "tv";
  const date = d.release_date || d.first_air_date || "";
  const credits = d.credits || {};
  const cast = (Array.isArray(credits.cast) ? credits.cast : []).slice(0, 20).map((c) => ({
    id: c.id,
    name: c.name || "",
    character: c.character || "",
    photo: imgUrl(TMDB_PROFILE, c.profile_path),
  }));

  // Behind the scenes: one card per person (jobs merged), the most important jobs first.
  const CREW_RANK = ["Director", "Writer", "Screenplay", "Story", "Novel", "Producer", "Executive Producer", "Original Music Composer", "Director of Photography", "Editor", "Production Design", "Costume Design"];
  const crewMap = new Map();
  (Array.isArray(credits.crew) ? credits.crew : []).forEach((p) => {
    const rank = CREW_RANK.indexOf(p.job);
    if (rank < 0 || !p.id || !p.name) return;
    const cur = crewMap.get(p.id);
    if (!cur) crewMap.set(p.id, { id: p.id, name: p.name, jobs: [p.job], rank: rank, photo: imgUrl(TMDB_PROFILE, p.profile_path) });
    else {
      if (!cur.jobs.includes(p.job)) cur.jobs.push(p.job);
      if (rank < cur.rank) cur.rank = rank;
    }
  });
  const crew = Array.from(crewMap.values())
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 24)
    .map((c) => ({ id: c.id, name: c.name, job: c.jobs.slice(0, 2).join(" · "), photo: c.photo }));

  let directors = [];
  if (isTv) {
    directors = (Array.isArray(d.created_by) ? d.created_by : []).map((p) => p.name).filter(Boolean);
  } else {
    directors = (Array.isArray(credits.crew) ? credits.crew : [])
      .filter((p) => p.job === "Director")
      .map((p) => p.name)
      .filter(Boolean);
  }

  // Best YouTube trailer: official first, then the newest one. Only the key is sent to the app.
  const vids = (d.videos && Array.isArray(d.videos.results) ? d.videos.results : []).filter(
    (v) => v.site === "YouTube" && v.type === "Trailer" && typeof v.key === "string" && /^[A-Za-z0-9_-]{6,20}$/.test(v.key)
  );
  vids.sort((a, b) => (b.official ? 1 : 0) - (a.official ? 1 : 0) || String(b.published_at || "").localeCompare(String(a.published_at || "")));
  const trailerKey = vids.length ? vids[0].key : null;

  const similar = mapList(d.recommendations, ref.mediaType).slice(0, 14);
  await attachLibraryState(env, user.id, similar);

  const mine = await env.DB.prepare(
    "SELECT ut.status, ut.rating, ut.mood, ut.fav_actor_id, ut.fav_actor_name, ut.fav_actor_photo " +
      "FROM user_titles ut JOIN titles t ON t.id = ut.title_id " +
      "WHERE ut.user_id = ?1 AND t.tmdb_id = ?2 AND t.media_type = ?3"
  )
    .bind(user.id, ref.tmdbId, ref.mediaType)
    .first();

  // Friends = people you follow (accepted only) who have this title as watched and show their activity.
  const friendBind = [user.id, ref.tmdbId, ref.mediaType];
  const friendFrom =
    "FROM follows f JOIN users u ON u.id = f.followed_id " +
    "JOIN user_titles ut ON ut.user_id = u.id JOIN titles t ON t.id = ut.title_id " +
    "WHERE f.follower_id = ?1 AND f.status = 'accepted' AND u.activity_visible = 1 " +
    "AND ut.status = 'watched' AND t.tmdb_id = ?2 AND t.media_type = ?3";
  let friendsWatched = { count: 0, sample: [], list: [] };
  try {
    const [fc, fl] = await env.DB.batch([
      env.DB.prepare("SELECT COUNT(*) AS n " + friendFrom).bind(...friendBind),
      env.DB.prepare(
        "SELECT u.public_id, u.display_name, u.photo_url, ut.rating " + friendFrom + " ORDER BY ut.updated_at DESC LIMIT 30"
      ).bind(...friendBind),
    ]);
    const list = (fl.results || []).map((r) => ({
      public_id: r.public_id,
      display_name: r.display_name,
      photo_url: r.photo_url || null,
      rating: r.rating || null,
    }));
    friendsWatched = {
      count: (fc.results && fc.results[0] && fc.results[0].n) || 0,
      sample: list.slice(0, 2),
      list: list,
    };
  } catch (e) {}

  // What everyone chose (counts only, nobody is named): stars (1-2 = 1 star ... 9-10 = 5 stars) and feelings.
  const MOOD_LIST = ["😍", "😂", "😢", "😱", "🤯", "😴", "😡", "🤔"];
  let stats = { rated: 0, stars: [0, 0, 0, 0, 0], moded: 0, moods: {} };
  try {
    const sql =
      "SELECT COUNT(CASE WHEN ut.rating IS NOT NULL THEN 1 END) AS rated, " +
      [1, 3, 5, 7, 9].map((lo, i) => "COALESCE(SUM(CASE WHEN ut.rating IN (" + lo + "," + (lo + 1) + ") THEN 1 ELSE 0 END),0) AS s" + (i + 1)).join(", ") +
      ", COUNT(CASE WHEN ut.mood IS NOT NULL AND ut.mood != '' THEN 1 END) AS moded, " +
      MOOD_LIST.map((e, i) => "COALESCE(SUM(CASE WHEN ut.mood LIKE ?" + (i + 4) + " THEN 1 ELSE 0 END),0) AS m" + i).join(", ") +
      " FROM user_titles ut JOIN titles t ON t.id = ut.title_id " +
      "WHERE t.tmdb_id = ?1 AND t.media_type = ?2 AND ut.status = 'watched'";
    const binds = [ref.tmdbId, ref.mediaType].concat(MOOD_LIST.map((e) => "%" + e + "%"));
    const row = await env.DB.prepare(sql).bind(...binds).first();
    if (row) {
      stats = {
        rated: row.rated || 0,
        stars: [row.s1 || 0, row.s2 || 0, row.s3 || 0, row.s4 || 0, row.s5 || 0],
        moded: row.moded || 0,
        moods: {},
      };
      MOOD_LIST.forEach((e, i) => { stats.moods[e] = row["m" + i] || 0; });
    }
  } catch (e) {}

  // My watch history (movies): how many times and the last date.
  let myWatch = null;
  if (!isTv && mine && mine.status === "watched") {
    try {
      const w = await env.DB.prepare(
        "SELECT COUNT(*) AS n, MAX(watched_on) AS last FROM watch_log w JOIN titles t ON t.id = w.title_id " +
          "WHERE w.user_id = ?1 AND t.tmdb_id = ?2 AND t.media_type = ?3"
      )
        .bind(user.id, ref.tmdbId, ref.mediaType)
        .first();
      if (w && w.n > 0) myWatch = { watch_count: w.n, last_watched_on: w.last || null };
    } catch (e) {}
  }

  const runtime = isTv
    ? Array.isArray(d.episode_run_time) && d.episode_run_time.length
      ? d.episode_run_time[0]
      : null
    : d.runtime || null;

  return json({
    tmdb_id: ref.tmdbId,
    media_type: ref.mediaType,
    title: d.title || d.name || "",
    original_title: d.original_title || d.original_name || "",
    tagline: tagline,
    overview: overview,
    year: date ? parseInt(date.slice(0, 4), 10) || null : null,
    runtime: runtime,
    genres: (Array.isArray(d.genres) ? d.genres : []).map((g) => g.name).filter(Boolean),
    rating: typeof d.vote_average === "number" ? Math.round(d.vote_average * 10) / 10 : null,
    votes: d.vote_count || 0,
    poster: imgUrl(TMDB_IMG, d.poster_path),
    backdrop: imgUrl(TMDB_BACKDROP, d.backdrop_path),
    seasons: isTv ? d.number_of_seasons || null : null,
    directors: directors.slice(0, 3),
    cast: cast,
    crew: crew,
    stats: stats,
    similar: similar,
    trailer_key: trailerKey,
    friends_watched: friendsWatched,
    my: myWatch,
    status: mine ? mine.status : null,
    my_rating: mine ? mine.rating : null,
    mood: mine && mine.mood ? mine.mood.split(",") : [],
    fav_actor:
      mine && mine.fav_actor_id
        ? { id: mine.fav_actor_id, name: mine.fav_actor_name, photo: mine.fav_actor_photo }
        : null,
  });
}
