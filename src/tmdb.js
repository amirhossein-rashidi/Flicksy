// Everything that talks to TMDB (the movie database).

export const TMDB_BASE = "https://api.themoviedb.org/3";
export const TMDB_IMG = "https://image.tmdb.org/t/p/w185";

export async function tmdbGet(env, pathAndQuery, cacheSeconds) {
  const options = {
    headers: { Authorization: "Bearer " + env.TMDB_TOKEN, Accept: "application/json" },
  };
  if (cacheSeconds) options.cf = { cacheTtl: cacheSeconds, cacheEverything: true };

  const res = await fetch(TMDB_BASE + pathAndQuery, options);
  if (res.status === 404) return { status: 404, data: null };
  if (!res.ok) throw new Error("tmdb_" + res.status);
  return { status: 200, data: await res.json() };
}

export function mapSearchResults(data) {
  const list = Array.isArray(data && data.results) ? data.results : [];
  return list
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .slice(0, 20)
    .map((r) => {
      const date = r.release_date || r.first_air_date || "";
      return {
        tmdb_id: r.id,
        media_type: r.media_type,
        title: r.title || r.name || "",
        original_title: r.original_title || r.original_name || "",
        year: date ? parseInt(date.slice(0, 4), 10) || null : null,
        poster: r.poster_path ? TMDB_IMG + r.poster_path : null,
        overview: (r.overview || "").slice(0, 240),
        rating: typeof r.vote_average === "number" ? Math.round(r.vote_average * 10) / 10 : null,
        status: null,
        my_rating: null,
      };
    });
}

// Makes sure the title exists in our own table (fetching it from TMDB the first time).
// Returns our internal title id, or null if TMDB does not know it.
export async function ensureTitle(env, tmdbId, mediaType) {
  const found = await env.DB.prepare(
    "SELECT id FROM titles WHERE tmdb_id = ?1 AND media_type = ?2"
  )
    .bind(tmdbId, mediaType)
    .first();
  if (found) return found.id;

  const base = "/" + mediaType + "/" + tmdbId;
  const [en, fa] = await Promise.all([
    tmdbGet(env, base + "?language=en-US&append_to_response=external_ids", 86400),
    tmdbGet(env, base + "?language=fa-IR", 86400).catch(() => ({ data: null })),
  ]);
  if (en.status === 404 || !en.data) return null;

  const e = en.data;
  const f = fa && fa.data ? fa.data : {};

  const titleEn = e.title || e.name || e.original_title || e.original_name || "Untitled";
  const titleFaRaw = f.title || f.name || "";
  const titleFa = titleFaRaw && titleFaRaw !== titleEn ? titleFaRaw : null;
  const date = e.release_date || e.first_air_date || "";
  const year = date ? parseInt(date.slice(0, 4), 10) || null : null;
  const genres = Array.isArray(e.genres) ? JSON.stringify(e.genres.map((g) => g.name)) : null;
  const runtime =
    mediaType === "movie"
      ? e.runtime || null
      : Array.isArray(e.episode_run_time) && e.episode_run_time.length
      ? e.episode_run_time[0]
      : null;
  const imdbId = e.imdb_id || (e.external_ids && e.external_ids.imdb_id) || null;

  await env.DB.prepare(
    "INSERT OR IGNORE INTO titles " +
      "(tmdb_id, media_type, imdb_id, title, original_title, title_fa, year, overview, " +
      "poster_path, backdrop_path, genres, runtime, tmdb_rating) " +
      "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)"
  )
    .bind(
      tmdbId,
      mediaType,
      imdbId,
      titleEn,
      e.original_title || e.original_name || null,
      titleFa,
      year,
      f.overview || e.overview || null,
      f.poster_path || e.poster_path || null,
      e.backdrop_path || null,
      genres,
      runtime,
      typeof e.vote_average === "number" ? e.vote_average : null
    )
    .run();

  const row = await env.DB.prepare(
    "SELECT id FROM titles WHERE tmdb_id = ?1 AND media_type = ?2"
  )
    .bind(tmdbId, mediaType)
    .first();
  return row ? row.id : null;
}
