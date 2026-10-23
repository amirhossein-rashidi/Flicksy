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

// Languages the app offers and the matching TMDB language codes.
export const LANGS = {
  en: "en-US",
  fa: "fa-IR",
  ar: "ar-SA",
  tr: "tr-TR",
  ru: "ru-RU",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
};

// Reads ?lang=xx from the URL and returns the TMDB language code (English if unknown).
export function tmdbLang(url) {
  const code = url.searchParams.get("lang") || "en";
  return LANGS[code] || LANGS.en;
}
