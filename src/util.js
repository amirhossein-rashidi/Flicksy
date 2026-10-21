// Small shared helpers and constants

export const STATUSES = ["want", "watching", "watched", "paused", "dropped"];
export const MEDIA_TYPES = ["movie", "tv"];

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: Object.assign(
      {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
      extraHeaders
    ),
  });
}

// Reads a TMDB id + media type (from JSON body or URL) and validates them.
export function parseTitleRef(tmdbId, mediaType) {
  const id = typeof tmdbId === "string" ? parseInt(tmdbId, 10) : tmdbId;
  if (!Number.isInteger(id) || id <= 0) return null;
  if (!MEDIA_TYPES.includes(mediaType)) return null;
  return { tmdbId: id, mediaType: mediaType };
}
