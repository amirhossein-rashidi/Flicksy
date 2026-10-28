// The "info card" text for a movie or series, used by the bot (links sent in chat and @flicksyrobot <title>).
// Everything is fetched from TMDB in the person's language (English by default).

import { tmdbGet } from "./tmdb.js";

const TMDB_LANG = { en: "en-US", fa: "fa-IR", ar: "ar", tr: "tr-TR", ru: "ru-RU", es: "es-ES", fr: "fr-FR", de: "de-DE" };
export const POSTER = "https://image.tmdb.org/t/p/w500";
export const THUMB = "https://image.tmdb.org/t/p/w185";

const L = {
  en: { movie: "Movie", tv: "Series", aka: "Also Known As", rating: "Rating", based: "{r} based on {n} user ratings", nr: "Not Rated", release: "Release Info", genre: "Genre", language: "Language", country: "Country of Origin", story: "Story Line", directors: "Directors", writers: "Writers", creators: "Creators", stars: "Stars", more: "Read More ..." },
  fa: { movie: "فیلم", tv: "سریال", aka: "نام دیگر", rating: "امتیاز", based: "{r} از {n} رأی کاربران", nr: "بدون رده‌بندی", release: "اطلاعات انتشار", genre: "ژانر", language: "زبان", country: "کشور سازنده", story: "خلاصه‌ی داستان", directors: "کارگردان", writers: "نویسنده", creators: "سازنده", stars: "بازیگران", more: "اطلاعات بیشتر ..." },
  ar: { movie: "فيلم", tv: "مسلسل", aka: "يُعرف أيضًا باسم", rating: "التقييم", based: "{r} بناءً على {n} تقييم", nr: "غير مصنّف", release: "معلومات الإصدار", genre: "النوع", language: "اللغة", country: "بلد الإنتاج", story: "القصة", directors: "المخرج", writers: "الكتّاب", creators: "المنشئ", stars: "البطولة", more: "اقرأ المزيد ..." },
  tr: { movie: "Film", tv: "Dizi", aka: "Diğer adı", rating: "Puan", based: "{r} — {n} kullanıcı puanına göre", nr: "Derecelendirilmemiş", release: "Yayın bilgisi", genre: "Tür", language: "Dil", country: "Yapım ülkesi", story: "Konu", directors: "Yönetmen", writers: "Yazarlar", creators: "Yapımcı", stars: "Oyuncular", more: "Devamı ..." },
  ru: { movie: "Фильм", tv: "Сериал", aka: "Также известен как", rating: "Рейтинг", based: "{r} по оценкам {n} пользователей", nr: "Без рейтинга", release: "Выход", genre: "Жанр", language: "Язык", country: "Страна", story: "Сюжет", directors: "Режиссёр", writers: "Сценаристы", creators: "Создатель", stars: "В ролях", more: "Подробнее ..." },
  es: { movie: "Película", tv: "Serie", aka: "También conocida como", rating: "Valoración", based: "{r} según {n} valoraciones", nr: "Sin clasificar", release: "Estreno", genre: "Género", language: "Idioma", country: "País de origen", story: "Argumento", directors: "Dirección", writers: "Guion", creators: "Creador", stars: "Reparto", more: "Leer más ..." },
  fr: { movie: "Film", tv: "Série", aka: "Aussi connu sous le nom de", rating: "Note", based: "{r} sur {n} notes", nr: "Non classé", release: "Sortie", genre: "Genre", language: "Langue", country: "Pays d’origine", story: "Synopsis", directors: "Réalisation", writers: "Scénario", creators: "Créateur", stars: "Avec", more: "En savoir plus ..." },
  de: { movie: "Film", tv: "Serie", aka: "Auch bekannt als", rating: "Bewertung", based: "{r} bei {n} Bewertungen", nr: "Nicht bewertet", release: "Veröffentlichung", genre: "Genre", language: "Sprache", country: "Herkunftsland", story: "Handlung", directors: "Regie", writers: "Drehbuch", creators: "Schöpfer", stars: "Besetzung", more: "Mehr lesen ..." },
};

const GENRE_EMOJI = {
  28: "💥", 12: "🧭", 16: "🎨", 35: "😂", 80: "🕵️", 99: "🎞", 18: "🎭", 10751: "👨‍👩‍👧", 14: "🧙", 36: "📜", 27: "🧟",
  10402: "🎵", 9648: "🔍", 10749: "❤️", 878: "🚀", 10770: "📺", 53: "😰", 10752: "⚔️", 37: "🤠",
  10759: "💥", 10762: "🧸", 10763: "📰", 10764: "🎤", 10765: "🚀", 10766: "🍿", 10767: "🎙", 10768: "🏛",
};

function esc(text) {
  return String(text === undefined || text === null ? "" : text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function tag(name) {
  const s = String(name || "").replace(/[^\p{L}\p{N}_]+/gu, "_").replace(/^_+|_+$/g, "");
  return s ? "#" + s : "";
}

function flag(code) {
  if (!/^[A-Za-z]{2}$/.test(code || "")) return "";
  return String.fromCodePoint.apply(null, code.toUpperCase().split("").map(function (c) { return 127397 + c.charCodeAt(0); }));
}

function display(lang, type, code, fallback) {
  try {
    const name = new Intl.DisplayNames([lang], { type: type }).of(code);
    if (name && name !== code) return name;
  } catch (e) {
    // fall through
  }
  return fallback || code;
}

function fmt(l, key, params) {
  let text = l[key] || key;
  Object.keys(params || {}).forEach(function (k) { text = text.split("{" + k + "}").join(String(params[k])); });
  return text;
}

function person(p) {
  return '<a href="https://www.themoviedb.org/person/' + p.id + '">' + esc(p.name) + "</a>";
}

// TMDB id (+type) behind an IMDb id, or null.
export async function findByImdb(env, imdb) {
  try {
    const res = await tmdbGet(env, "/find/" + encodeURIComponent(imdb) + "?external_source=imdb_id", 86400);
    const d = res.data || {};
    if (d.movie_results && d.movie_results[0]) return { type: "movie", tmdb: d.movie_results[0].id };
    if (d.tv_results && d.tv_results[0]) return { type: "tv", tmdb: d.tv_results[0].id };
  } catch (e) {
    // not found
  }
  return null;
}

// The full card. Returns { type, tmdb, title, year, poster, thumb, overview, text } or null.
export async function loadCard(env, type, tmdbId, lang) {
  lang = L[lang] ? lang : "en";
  const l = L[lang];
  const extra = type === "tv" ? "credits,external_ids,content_ratings" : "credits,external_ids,release_dates";
  let res;
  try {
    res = await tmdbGet(env, "/" + type + "/" + tmdbId + "?language=" + TMDB_LANG[lang] + "&append_to_response=" + extra, 3600);
  } catch (e) {
    return null;
  }
  const d = res.data;
  if (!d) return null;

  let overview = d.overview || "";
  if (!overview && lang !== "en") {
    try {
      const en = await tmdbGet(env, "/" + type + "/" + tmdbId + "?language=en-US", 3600);
      overview = (en.data && en.data.overview) || "";
    } catch (e) {
      // keep it empty
    }
  }

  const title = (type === "tv" ? d.name : d.title) || "";
  const original = (type === "tv" ? d.original_name : d.original_title) || "";
  const date = (type === "tv" ? d.first_air_date : d.release_date) || "";
  const year = date ? date.slice(0, 4) : "";
  const imdb = (d.external_ids && d.external_ids.imdb_id) || d.imdb_id || "";
  const tmdbUrl = "https://www.themoviedb.org/" + type + "/" + tmdbId;
  const main = imdb ? "https://www.imdb.com/title/" + imdb : tmdbUrl;

  // age rating (US)
  let cert = "";
  if (type === "movie") {
    const rd = (d.release_dates && d.release_dates.results) || [];
    const us = rd.find(function (r) { return r.iso_3166_1 === "US"; });
    if (us) {
      const c = (us.release_dates || []).find(function (x) { return x.certification; });
      cert = c ? c.certification : "";
    }
  } else {
    const cr = (d.content_ratings && d.content_ratings.results) || [];
    const us = cr.find(function (r) { return r.iso_3166_1 === "US"; });
    cert = us ? us.rating || "" : "";
  }

  let minutes = type === "movie" ? d.runtime : (d.episode_run_time && d.episode_run_time[0]) || 0;
  minutes = parseInt(minutes, 10) || 0;
  const runtime = minutes ? (minutes >= 60 ? Math.floor(minutes / 60) + "h " : "") + (minutes % 60) + "min" : "";

  const lines = [];
  lines.push("<b>" + esc(l[type]) + ":</b> <a href=\"" + main + "\">" + esc(title) + "</a>" + (year ? " [" + year + "]" : ""));
  if (original && original !== title) lines.push("<b>" + esc(l.aka) + ":</b> " + esc(original));

  if (d.vote_count > 0) {
    const r = (Math.round(d.vote_average * 10) / 10).toFixed(1);
    lines.push("<b>" + esc(l.rating) + " ⭐️:</b> " + r + " / 10");
    lines.push("(<code>" + esc(fmt(l, "based", { r: r, n: d.vote_count })) + "</code>) | <code>" + esc(cert || l.nr) + "</code>" + (runtime ? " | <code>" + runtime + "</code>" : ""));
  } else if (cert || runtime) {
    lines.push("<code>" + esc(cert || l.nr) + "</code>" + (runtime ? " | <code>" + runtime + "</code>" : ""));
  }

  if (date) {
    const parts = date.split("-");
    const shown = parts.length === 3 ? parts[2] + " / " + parts[1] + " / " + parts[0] : date;
    const link = imdb ? "https://www.imdb.com/title/" + imdb + "/releaseinfo" : tmdbUrl;
    lines.push("<b>" + esc(l.release) + ":</b> <a href=\"" + link + "\">" + esc(shown) + "</a>");
  }

  const genres = (d.genres || []).map(function (g) {
    const t = tag(g.name);
    return t ? t + (GENRE_EMOJI[g.id] ? " " + GENRE_EMOJI[g.id] : "") : "";
  }).filter(Boolean);
  if (genres.length) lines.push("<b>" + esc(l.genre) + ":</b> " + esc(genres.join(" ")));

  const spoken = (d.spoken_languages || []).slice(0, 3).map(function (s) {
    return tag(display(lang, "language", s.iso_639_1, s.english_name || s.name));
  }).filter(Boolean);
  if (spoken.length) lines.push("<b>" + esc(l.language) + ":</b> " + esc(spoken.join(" ")));

  const codes = (type === "tv" ? d.origin_country : (d.production_countries || []).map(function (c) { return c.iso_3166_1; })) || [];
  const countries = codes.slice(0, 3).map(function (c) {
    const name = tag(display(lang, "region", c, c));
    return name ? (flag(c) ? flag(c) + " " : "") + name : "";
  }).filter(Boolean);
  if (countries.length) lines.push("<b>" + esc(l.country) + ":</b> " + esc(countries.join(" ")));

  if (overview) lines.push("<b>" + esc(l.story) + ":</b> " + esc(overview.length > 700 ? overview.slice(0, 699) + "…" : overview));

  const credits = d.credits || {};
  const crew = credits.crew || [];
  const names = function (list, max) {
    const seen = new Set();
    return list.filter(function (p) { if (seen.has(p.id)) return false; seen.add(p.id); return true; }).slice(0, max).map(person).join(" ");
  };
  const directors = crew.filter(function (c) { return c.job === "Director"; });
  const writers = crew.filter(function (c) { return /^(Writer|Screenplay|Story|Novel)$/.test(c.job); });
  if (type === "tv") {
    if ((d.created_by || []).length) lines.push("<b>" + esc(l.creators) + "</b> " + names(d.created_by, 3));
  } else {
    if (directors.length) lines.push("<b>" + esc(l.directors) + "</b> " + names(directors, 3));
    if (writers.length) lines.push("<b>" + esc(l.writers) + "</b> " + names(writers, 3));
  }
  if ((credits.cast || []).length) lines.push("<b>" + esc(l.stars) + "</b> " + names(credits.cast, 4));

  lines.push("");
  lines.push("<a href=\"" + (imdb ? "https://www.imdb.com/title/" + imdb + "/fullcredits#cast" : tmdbUrl + "/cast") + "\">" + esc(l.more) + "</a>");

  return {
    type: type,
    tmdb: tmdbId,
    title: title,
    year: year,
    overview: overview,
    rating: d.vote_count > 0 ? Math.round(d.vote_average * 10) / 10 : null,
    poster: d.poster_path ? POSTER + d.poster_path : null,
    thumb: d.poster_path ? THUMB + d.poster_path : null,
    text: lines.join("\n"),
  };
}

// Title search for @flicksyrobot <words>: up to `max` cards.
export async function searchCards(env, query, lang, max) {
  lang = L[lang] ? lang : "en";
  let res;
  try {
    res = await tmdbGet(env, "/search/multi?query=" + encodeURIComponent(query) + "&language=" + TMDB_LANG[lang] + "&include_adult=false", 600);
  } catch (e) {
    return [];
  }
  const hits = ((res.data && res.data.results) || [])
    .filter(function (r) { return r.media_type === "movie" || r.media_type === "tv"; })
    .slice(0, max);
  const cards = await Promise.all(hits.map(function (h) { return loadCard(env, h.media_type, h.id, lang); }));
  return cards.filter(Boolean);
}

export function supportedLang(code) {
  return L[code] ? code : null;
}
