// A person (actor or crew member): short biography and everything they worked on, newest first.

import { json, tmdbLang } from "./util.js";
import { tmdbGet, imgUrl, TMDB_IMG, TMDB_PROFILE } from "./tmdb.js";

const SKIP_GENRES = [10767, 10763, 10764]; // talk shows, news, reality
const MAX_CREDITS = 500; // the app shows them 40 at a time with a "show more" button

function isSelf(character) {
  return /^(self|himself|herself|themselves)\b/i.test(String(character || "").trim());
}

function mapCredit(c, role, kind) {
  const date = c.release_date || c.first_air_date || "";
  return {
    tmdb_id: c.id,
    media_type: c.media_type,
    title: c.title || c.name || "",
    year: date ? parseInt(date.slice(0, 4), 10) || null : null,
    date: date,
    poster: imgUrl(TMDB_IMG, c.poster_path),
    role: role || "",
    kind: kind,
  };
}

// GET /api/person?id=...
export async function handlePerson(url, env, user) {
  const id = parseInt(url.searchParams.get("id") || "", 10);
  if (!Number.isInteger(id) || id <= 0) return json({ error: "bad_person" }, 400);
  if (!env.TMDB_TOKEN) return json({ error: "server_misconfigured" }, 500);

  const language = tmdbLang(url);
  const base = "/person/" + id;

  let res;
  try {
    res = await tmdbGet(env, base + "?language=" + language + "&append_to_response=combined_credits", 21600);
  } catch (e) {
    return json({ error: "person_unavailable" }, 502);
  }
  if (res.status === 404 || !res.data) return json({ error: "person_not_found" }, 404);
  const d = res.data;

  // Some people have no translated biography: use the English one.
  let bio = d.biography || "";
  if (!bio && language !== "en-US") {
    try {
      const en = await tmdbGet(env, base + "?language=en-US", 21600);
      if (en.data) bio = en.data.biography || "";
    } catch (e) {}
  }

  const cc = d.combined_credits || {};
  const seen = new Set();
  let credits = [];

  (Array.isArray(cc.cast) ? cc.cast : []).forEach((c) => {
    if (c.media_type !== "movie" && c.media_type !== "tv") return;
    const genres = Array.isArray(c.genre_ids) ? c.genre_ids : [];
    if (genres.some((g) => SKIP_GENRES.includes(g))) return;
    if (isSelf(c.character) && (c.media_type === "tv" || genres.includes(99))) return;
    const key = c.media_type + ":" + c.id;
    if (seen.has(key)) return;
    seen.add(key);
    credits.push(mapCredit(c, c.character, "cast"));
  });

  // Crew people (directors, writers ...) also get their work, with the job instead of a role.
  (Array.isArray(cc.crew) ? cc.crew : []).forEach((c) => {
    if (c.media_type !== "movie" && c.media_type !== "tv") return;
    const key = c.media_type + ":" + c.id;
    if (seen.has(key)) return;
    seen.add(key);
    credits.push(mapCredit(c, c.job, "crew"));
  });

  // Newest first; titles without a date (announced) go last.
  credits.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.localeCompare(a.date);
  });
  const total = credits.length;
  credits = credits.slice(0, MAX_CREDITS);

  return json({
    id: id,
    name: d.name || "",
    photo: imgUrl(TMDB_PROFILE, d.profile_path),
    department: d.known_for_department || "",
    birthday: d.birthday || null,
    deathday: d.deathday || null,
    place: d.place_of_birth || null,
    bio: bio.slice(0, 4000),
    total: total,
    credits: credits,
  });
}
