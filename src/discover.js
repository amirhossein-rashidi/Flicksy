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

// Popular actors row. TMDB's own order follows what is trending right now, which puts unknown
// names first, so we take the top 100 popular people and mix long-time famous names (by total votes of their best-known
// titles) with this week's hot names. Cached for a day.
async function popularActors(url, env) {
  try {
    const lang = tmdbLang(url);
    const pages = await Promise.all(
      [1, 2, 3, 4, 5].map((n) => tmdbGet(env, "/person/popular?language=" + lang + "&page=" + n, 86400).then((r) => (r.data && r.data.results) || []).catch(() => []))
    );
    const seen = new Set();
    const people = [];
    for (const list of pages) {
      for (const p of list) {
        if (seen.has(p.id) || !p.profile_path || p.known_for_department !== "Acting") continue;
        seen.add(p.id);
        let fame = 0;
        for (const k of p.known_for || []) fame += k.vote_count || 0;
        people.push({ id: p.id, name: p.name, photo: imgUrl(TMDB_PROFILE, p.profile_path), fame: fame });
      }
    }
    // Mix: two long-time famous names, then one who is hot this week (TMDB's own order), repeating.
    const trending = people.slice(0, 40);
    const famous = people.slice().sort((a, b) => b.fame - a.fame);
    const used = new Set();
    const out = [];
    let fi = 0, ti = 0;
    const take = (list, idx) => {
      while (idx < list.length && used.has(list[idx].id)) idx++;
      if (idx >= list.length) return idx;
      used.add(list[idx].id);
      out.push({ id: list[idx].id, name: list[idx].name, photo: list[idx].photo });
      return idx + 1;
    };
    while (out.length < 20 && (fi < famous.length || ti < trending.length)) {
      fi = take(famous, fi);
      if (out.length < 20) fi = take(famous, fi);
      if (out.length < 20) ti = take(trending, ti);
    }
    if (!out.length) return json({ error: "discover_unavailable" }, 502);
    return json({ results: out });
  } catch (e) {
    return json({ error: "discover_unavailable" }, 502);
  }
}
