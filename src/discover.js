// Home / Discover rows: trending, popular and top-rated lists from TMDB.

import { json, tmdbLang } from "./util.js";
import { tmdbGet, mapList, imgUrl, TMDB_PROFILE } from "./tmdb.js";
import { attachLibraryState } from "./search.js";

const KINDS = {
  trending: { path: "/trending/all/week", type: null },
  popular_movies: { path: "/movie/popular", type: "movie" },
  popular_tv: { path: "/tv/popular", type: "tv" },
  top_movies: { path: "/movie/top_rated", type: "movie" },
  top_tv: { path: "/tv/top_rated", type: "tv" },
};

export async function handleDiscover(url, env, user) {
  if (!env.TMDB_TOKEN) return json({ error: "server_misconfigured" }, 500);

  if (url.searchParams.get("kind") === "actors") return await popularActors(url, env);

  const kind = KINDS[url.searchParams.get("kind")];
  if (!kind) return json({ error: "bad_kind" }, 400);

  let data;
  try {
    const sep = kind.path.includes("?") ? "&" : "?";
    const res = await tmdbGet(env, kind.path + sep + "language=" + tmdbLang(url) + "&page=1", 3600);
    data = res.data;
  } catch (e) {
    return json({ error: "discover_unavailable" }, 502);
  }

  const results = mapList(data, kind.type);
  await attachLibraryState(env, user.id, results);
  return json({ results: results });
}

// Popular actors row (TMDB /person/popular, cached for a day). Only people with a photo.
async function popularActors(url, env) {
  try {
    const res = await tmdbGet(env, "/person/popular?language=" + tmdbLang(url) + "&page=1", 86400);
    const out = (res.data.results || [])
      .filter((p) => p.profile_path && p.known_for_department === "Acting")
      .slice(0, 20)
      .map((p) => ({ id: p.id, name: p.name, photo: imgUrl(TMDB_PROFILE, p.profile_path) }));
    return json({ results: out });
  } catch (e) {
    return json({ error: "discover_unavailable" }, 502);
  }
}
