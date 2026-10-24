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
    res = await tmdbGet(env, base + "?language=" + language + "&append_to_response=credits,recommendations", 21600);
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
  const cast = (Array.isArray(credits.cast) ? credits.cast : []).slice(0, 16).map((c) => ({
    id: c.id,
    name: c.name || "",
    character: c.character || "",
    photo: imgUrl(TMDB_PROFILE, c.profile_path),
  }));

  let directors = [];
  if (isTv) {
    directors = (Array.isArray(d.created_by) ? d.created_by : []).map((p) => p.name).filter(Boolean);
  } else {
    directors = (Array.isArray(credits.crew) ? credits.crew : [])
      .filter((p) => p.job === "Director")
      .map((p) => p.name)
      .filter(Boolean);
  }

  const similar = mapList(d.recommendations, ref.mediaType).slice(0, 14);
  await attachLibraryState(env, user.id, similar);

  const mine = await env.DB.prepare(
    "SELECT ut.status, ut.rating, ut.mood, ut.fav_actor_id, ut.fav_actor_name, ut.fav_actor_photo " +
      "FROM user_titles ut JOIN titles t ON t.id = ut.title_id " +
      "WHERE ut.user_id = ?1 AND t.tmdb_id = ?2 AND t.media_type = ?3"
  )
    .bind(user.id, ref.tmdbId, ref.mediaType)
    .first();

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
    similar: similar,
    status: mine ? mine.status : null,
    my_rating: mine ? mine.rating : null,
    mood: mine && mine.mood ? mine.mood.split(",") : [],
    fav_actor:
      mine && mine.fav_actor_id
        ? { id: mine.fav_actor_id, name: mine.fav_actor_name, photo: mine.fav_actor_photo }
        : null,
  });
}
