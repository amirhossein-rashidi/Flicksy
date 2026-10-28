// Backup: export everything (JSON, sent to the user's Telegram chat) and import
// from other services in small batches (the app reads the file and sends the entries here).
//
// Import never makes things worse: "watched" always wins, existing ratings are kept,
// nothing is deleted, and no activity-feed items are created.

import { json } from "./util.js";
import { tmdbGet } from "./tmdb.js";

export const MAX_ENTRIES = 10; // titles per import request (keeps every request small and fast)
const MAX_EPISODES = 4000; // episodes per import request
const MAX_LIST_ITEMS = 200;
const STATUSES = ["want", "watching", "watched", "paused", "dropped"];
const MOODS = ["😍", "😂", "😢", "😱", "🤯", "😴", "😡", "🤔"];

async function readBody(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : null;
  } catch (e) {
    return null;
  }
}

// ---------- cleaning what the app sends ----------

function cleanDate(v) {
  if (typeof v !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?/.exec(v.trim());
  if (!m) return null;
  const y = parseInt(m[1], 10);
  if (y < 1900 || y > 2100) return null;
  return m[1] + "-" + m[2] + "-" + m[3] + " " + (m[4] ? m[4] + ":" + m[5] + ":" + m[6] : "00:00:00");
}

function cleanEntry(raw) {
  if (!raw || typeof raw !== "object") return null;
  const e = {};
  e.type = raw.type === "movie" || raw.type === "tv" ? raw.type : null;
  e.tmdb = Number.isInteger(raw.tmdb) && raw.tmdb > 0 ? raw.tmdb : null;
  e.imdb = typeof raw.imdb === "string" && /^tt\d{5,10}$/.test(raw.imdb) ? raw.imdb : null;
  e.tvdb = Number.isInteger(raw.tvdb) && raw.tvdb > 0 ? raw.tvdb : null;
  e.title = typeof raw.title === "string" ? raw.title.trim().slice(0, 200) : "";
  e.alt = typeof raw.alt === "string" ? raw.alt.trim().slice(0, 200) : "";
  e.year = Number.isInteger(raw.year) && raw.year > 1870 && raw.year < 2200 ? raw.year : null;
  // "Them (2021)", "Shelter - 2010", "God Loves Storks (IR)": the year / country is not part of the name
  if (e.title) {
    const ym = /\s*[(\[]\s*((?:19|20)\d{2})\s*[)\]]\s*$/.exec(e.title) || /\s+-\s+((?:19|20)\d{2})\s*$/.exec(e.title);
    if (ym && ym.index > 0) {
      if (!e.year) e.year = parseInt(ym[1], 10);
      e.title = e.title.slice(0, ym.index).trim();
    }
    const cm = /\s*\(([A-Z]{2,3})\)\s*$/.exec(e.title);
    if (cm && cm.index > 0) e.title = e.title.slice(0, cm.index).trim();
  }
  if (e.tmdb && !e.type) e.tmdb = null; // an id alone is not enough: it needs a type
  if (!e.tmdb && !e.imdb && !e.tvdb && !e.title) return null;

  e.status = STATUSES.indexOf(raw.status) >= 0 ? raw.status : null;
  e.override = raw.override === true; // the user explicitly chose this status: it replaces the old one
  e.rating = Number.isInteger(raw.rating) && raw.rating >= 1 && raw.rating <= 10 ? raw.rating : null;
  e.started_at = cleanDate(raw.started_at);
  e.finished_at = cleanDate(raw.finished_at);
  e.note = typeof raw.note === "string" ? raw.note.trim().slice(0, 300) : null;

  e.mood = null;
  if (Array.isArray(raw.mood)) {
    const m = raw.mood.filter((x) => MOODS.indexOf(x) >= 0).slice(0, 3);
    e.mood = m.length ? m.join(",") : null;
  }
  e.actor = null;
  if (raw.actor && typeof raw.actor === "object" && Number.isInteger(raw.actor.id) && typeof raw.actor.name === "string") {
    const photo = typeof raw.actor.photo === "string" && raw.actor.photo.indexOf("https://image.tmdb.org/") === 0 ? raw.actor.photo.slice(0, 200) : null;
    e.actor = { id: raw.actor.id, name: raw.actor.name.slice(0, 80), photo: photo };
  }

  e.episodes = [];
  if (Array.isArray(raw.episodes)) {
    for (const ep of raw.episodes) {
      if (!Array.isArray(ep)) continue;
      const s = ep[0];
      const n = ep[1];
      if (!Number.isInteger(s) || s < 0 || s > 300 || !Number.isInteger(n) || n < 1 || n > 5000) continue;
      e.episodes.push({ s: s, e: n, at: cleanDate(ep[2]) });
    }
  }
  return e;
}

export function cleanEntries(list) {
  if (!Array.isArray(list) || list.length === 0 || list.length > MAX_ENTRIES) return null;
  const out = [];
  let episodes = 0;
  for (const raw of list) {
    const e = cleanEntry(raw);
    out.push(e); // keep the position (null = unusable entry)
    if (e) episodes += e.episodes.length;
  }
  if (episodes > MAX_EPISODES) return null;
  return out;
}

// ---------- finding the title on TMDB ----------

function norm(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function yearOf(r) {
  const d = r.release_date || r.first_air_date || "";
  return d ? parseInt(d.slice(0, 4), 10) || null : null;
}

function lite(r, type) {
  return {
    tmdbId: r.id,
    mediaType: type,
    title: r.title || r.name || r.original_title || r.original_name || "Untitled",
    original_title: r.original_title || r.original_name || null,
    year: yearOf(r),
    overview: r.overview || null,
    poster_path: r.poster_path || null,
    backdrop_path: r.backdrop_path || null,
    rating: typeof r.vote_average === "number" ? r.vote_average : null,
  };
}

function pickBest(results, e, fixedType) {
  let best = null;
  let bestScore = -1;
  const want = norm(e.title);
  results.forEach((r, i) => {
    const type = fixedType || r.media_type;
    if (type !== "movie" && type !== "tv") return;
    const names = [r.title, r.name, r.original_title, r.original_name].map(norm);
    const nameHit = want && names.indexOf(want) >= 0;
    const y = yearOf(r);
    let yearScore = 0;
    if (e.year && y) yearScore = y === e.year ? 3 : Math.abs(y - e.year) === 1 ? 1 : -2;
    const score = (nameHit ? 5 : 0) + yearScore - i * 0.01;
    if (score > bestScore) {
      bestScore = score;
      best = { r: r, type: type };
    }
  });
  if (!best) return null;
  // Accept an exact name, or the first result when the year matches.
  const nameHit = want && [best.r.title, best.r.name, best.r.original_title, best.r.original_name].map(norm).indexOf(want) >= 0;
  const yearHit = e.year && yearOf(best.r) === e.year;
  // "Formula 1" for "Formula 1: Drive to Survive": the first result starts with (or is a start of) the name
  const near = want && results[0] === best.r && [best.r.title, best.r.name, best.r.original_title, best.r.original_name].map(norm).some(function (n) {
    return n && (n.indexOf(want + " ") === 0 || want.indexOf(n + " ") === 0);
  });
  if (!nameHit && !(yearHit && results[0] === best.r) && !near) return null;
  return lite(best.r, best.type);
}

// Returns { tmdbId, mediaType, ... } or null when nothing matches. Network problems throw.
async function resolveEntry(env, e, known) {
  if (e.tmdb && e.type) {
    const hit = known.get(e.type + ":" + e.tmdb);
    if (hit) return { tmdbId: e.tmdb, mediaType: e.type, existingId: hit };
    const res = await tmdbGet(env, "/" + e.type + "/" + e.tmdb + "?language=en-US", 86400);
    if (!res.data) return null;
    return lite(res.data, e.type);
  }

  if (e.imdb || e.tvdb) {
    const path = e.imdb
      ? "/find/" + e.imdb + "?external_source=imdb_id&language=en-US"
      : "/find/" + e.tvdb + "?external_source=tvdb_id&language=en-US";
    const res = await tmdbGet(env, path, 86400);
    const d = res.data || {};
    const movies = Array.isArray(d.movie_results) ? d.movie_results : [];
    const shows = Array.isArray(d.tv_results) ? d.tv_results : [];
    let found = null;
    if (e.type === "movie" || (!e.type && !e.tvdb)) found = movies[0] ? lite(movies[0], "movie") : null;
    if (!found && (e.type === "tv" || !e.type)) found = shows[0] ? lite(shows[0], "tv") : null;
    if (!found && !e.type && movies[0]) found = lite(movies[0], "movie");
    if (found) {
      if (e.imdb) found.imdb_id = e.imdb;
      return found;
    }
    if (!e.title && !e.alt) return null;
  }

  if (!e.title && !e.alt) return null;
  const names = [e.title, e.alt].filter(function (n, i, all) { return n && all.indexOf(n) === i; });
  for (const name of names) {
    const one = Object.assign({}, e, { title: name });
    const hit = await searchByTitle(env, one);
    if (hit) return hit;
  }
  return null;
}

async function searchByTitle(env, e) {
  const q = encodeURIComponent(e.title);
  if (e.type) {
    const yearParam = e.year ? (e.type === "movie" ? "&year=" : "&first_air_date_year=") + e.year : "";
    let res = await tmdbGet(env, "/search/" + e.type + "?include_adult=false&language=en-US&page=1&query=" + q + yearParam, 86400);
    let list = res.data && Array.isArray(res.data.results) ? res.data.results : [];
    let hit = pickBest(list, e, e.type);
    if (!hit && e.year) {
      res = await tmdbGet(env, "/search/" + e.type + "?include_adult=false&language=en-US&page=1&query=" + q, 86400);
      list = res.data && Array.isArray(res.data.results) ? res.data.results : [];
      hit = pickBest(list, e, e.type);
    }
    return hit;
  }
  const res = await tmdbGet(env, "/search/multi?include_adult=false&language=en-US&page=1&query=" + q, 86400);
  const list = res.data && Array.isArray(res.data.results) ? res.data.results : [];
  return pickBest(list.filter((r) => r.media_type === "movie" || r.media_type === "tv"), e, null);
}

// Finds every entry on TMDB, makes sure the titles exist in our table, and returns, for each entry,
// { titleId, tmdbId, mediaType, title, year } or { error: "notfound" | "error" }.
export async function resolveAndStore(env, entries) {
  // Titles we already know (no TMDB call needed when the entry carries a TMDB id).
  const wantedIds = entries.filter((e) => e && e.tmdb).map((e) => e.tmdb);
  const known = new Map();
  if (wantedIds.length) {
    const rows = await env.DB.prepare(
      "SELECT id, tmdb_id, media_type FROM titles WHERE tmdb_id IN (SELECT value FROM json_each(?1))"
    )
      .bind(JSON.stringify(wantedIds))
      .all();
    for (const r of rows.results || []) known.set(r.media_type + ":" + r.tmdb_id, r.id);
  }

  const resolved = await Promise.all(
    entries.map(async (e) => {
      if (!e) return { error: "notfound" };
      try {
        const r = await resolveEntry(env, e, known);
        return r || { error: "notfound" };
      } catch (err) {
        return { error: "error" };
      }
    })
  );

  // New titles: add a row (with the Persian name when TMDB has one).
  const fresh = new Map();
  for (const r of resolved) {
    if (r.error || r.existingId) continue;
    const key = r.mediaType + ":" + r.tmdbId;
    if (!known.has(key) && !fresh.has(key)) fresh.set(key, r);
  }
  const freshList = Array.from(fresh.values());
  await Promise.all(
    freshList.map(async (r) => {
      try {
        const res = await tmdbGet(env, "/" + r.mediaType + "/" + r.tmdbId + "?language=fa-IR", 86400);
        const f = res.data || {};
        const fa = f.title || f.name || "";
        r.title_fa = fa && fa !== r.title ? fa : null;
        r.imdb_id = r.imdb_id || f.imdb_id || null;
        r.runtime = r.mediaType === "movie" ? f.runtime || null : Array.isArray(f.episode_run_time) && f.episode_run_time.length ? f.episode_run_time[0] : null;
        r.genres = Array.isArray(f.genres) && f.genres.length ? JSON.stringify(f.genres.map((g) => g.name)) : null;
        if (!r.overview && f.overview) r.overview = f.overview;
      } catch (err) {
        r.title_fa = null;
      }
    })
  );

  if (freshList.length) {
    const payload = freshList.map((r) => ({
      tmdb_id: r.tmdbId,
      media_type: r.mediaType,
      imdb_id: r.imdb_id || null,
      title: r.title,
      original_title: r.original_title,
      title_fa: r.title_fa || null,
      year: r.year,
      overview: r.overview,
      poster_path: r.poster_path,
      backdrop_path: r.backdrop_path,
      genres: r.genres || null,
      runtime: r.runtime || null,
      rating: r.rating,
    }));
    await env.DB.prepare(
      "INSERT OR IGNORE INTO titles (tmdb_id, media_type, imdb_id, title, original_title, title_fa, year, overview, " +
        "poster_path, backdrop_path, genres, runtime, tmdb_rating) " +
        "SELECT json_extract(value, '$.tmdb_id'), json_extract(value, '$.media_type'), json_extract(value, '$.imdb_id'), " +
        "json_extract(value, '$.title'), json_extract(value, '$.original_title'), json_extract(value, '$.title_fa'), " +
        "json_extract(value, '$.year'), json_extract(value, '$.overview'), json_extract(value, '$.poster_path'), " +
        "json_extract(value, '$.backdrop_path'), json_extract(value, '$.genres'), json_extract(value, '$.runtime'), " +
        "json_extract(value, '$.rating') FROM json_each(?1) WHERE 1"
    )
      .bind(JSON.stringify(payload))
      .run();
  }

  // Our internal ids for everything that was found.
  const ids = resolved.filter((r) => !r.error).map((r) => r.tmdbId);
  const idMap = new Map();
  if (ids.length) {
    const rows = await env.DB.prepare(
      "SELECT id, tmdb_id, media_type, title, year FROM titles WHERE tmdb_id IN (SELECT value FROM json_each(?1))"
    )
      .bind(JSON.stringify(ids))
      .all();
    for (const r of rows.results || []) idMap.set(r.media_type + ":" + r.tmdb_id, r);
  }

  return resolved.map((r) => {
    if (r.error) return { error: r.error };
    const row = idMap.get(r.mediaType + ":" + r.tmdbId);
    if (!row) return { error: "error" };
    return { titleId: row.id, tmdbId: row.tmdb_id, mediaType: row.media_type, title: row.title, year: row.year };
  });
}

// ---------- merging with what the user already has ----------

function mergeStatus(existing, incoming) {
  if (!incoming) return existing;
  if (!existing) return incoming;
  if (existing === "watched" || incoming === "watched") return "watched";
  return existing === "want" ? incoming : existing;
}

function earlier(a, b) {
  if (!a) return b || null;
  if (!b) return a;
  return a < b ? a : b;
}

function nowText() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

// Core of the import (also used by the bot for pasted links). `entries` must already be cleaned
// with cleanEntries(). Returns { ok, results, counts, episodes_added } or { error }.
export async function importEntries(env, user, entries) {
  let found;
  try {
    found = await resolveAndStore(env, entries);
  } catch (e) {
    return { error: "server_error" };
  }

  // What the user already has for these titles.
  const titleIds = Array.from(new Set(found.filter((f) => !f.error).map((f) => f.titleId)));
  const state = new Map();
  if (titleIds.length) {
    const rows = await env.DB.prepare(
      "SELECT title_id, status, rating, mood, fav_actor_id, fav_actor_name, fav_actor_photo, started_at, finished_at " +
        "FROM user_titles WHERE user_id = ?1 AND title_id IN (SELECT value FROM json_each(?2))"
    )
      .bind(user.id, JSON.stringify(titleIds))
      .all();
    for (const r of rows.results || []) state.set(r.title_id, { existing: true, changed: false, row: r });
  }

  const results = [];
  const episodeRows = [];
  const touched = new Set();

  entries.forEach((e, i) => {
    const f = found[i];
    if (!e || f.error) {
      results.push({ i: i, outcome: f.error || "notfound" });
      return;
    }

    let st = state.get(f.titleId);
    if (!st) {
      st = { existing: false, changed: false, row: null };
      state.set(f.titleId, st);
    }
    const before = st.row;

    let incoming = e.status;
    if (!incoming && f.mediaType === "tv" && e.episodes.length) incoming = "watching";
    if (!incoming && !before) incoming = "want";

    const status = e.override && incoming ? incoming : mergeStatus(before ? before.status : null, incoming);
    let rating = before ? before.rating : null;
    let mood = before ? before.mood : null;
    let actor = before && before.fav_actor_id ? { id: before.fav_actor_id, name: before.fav_actor_name, photo: before.fav_actor_photo } : null;
    if (status === "watched") {
      if (rating === null && e.rating !== null) rating = e.rating;
      if (!mood && e.mood) mood = e.mood;
      if (!actor && e.actor) actor = e.actor;
    } else {
      rating = null;
      mood = null;
      actor = null;
    }

    let startedAt = before ? before.started_at : null;
    let finishedAt = before ? before.finished_at : null;
    if (status === "watching" || status === "watched") startedAt = earlier(startedAt, e.started_at) || (status === "watching" ? nowText() : null);
    if (status === "watched") finishedAt = earlier(finishedAt, e.finished_at) || nowText();

    const next = {
      title_id: f.titleId,
      status: status,
      rating: rating,
      mood: mood,
      fav_actor_id: actor ? actor.id : null,
      fav_actor_name: actor ? actor.name : null,
      fav_actor_photo: actor ? actor.photo : null,
      started_at: startedAt,
      finished_at: finishedAt,
    };

    const same =
      before &&
      before.status === next.status &&
      before.rating === next.rating &&
      (before.mood || null) === next.mood &&
      (before.fav_actor_id || null) === next.fav_actor_id &&
      (before.started_at || null) === next.started_at &&
      (before.finished_at || null) === next.finished_at;

    let outcome = "same";
    if (!before) outcome = "added";
    else if (!same) outcome = "updated";
    st.row = next;
    if (!same) { st.changed = true; touched.add(f.titleId); }

    if (f.mediaType === "tv") {
      for (const ep of e.episodes) episodeRows.push({ t: f.titleId, s: ep.s, e: ep.e, at: ep.at });
    }
    results.push({ i: i, outcome: outcome, tmdb_id: f.tmdbId, media_type: f.mediaType, title: f.title, year: f.year, status: next.status, episodes: f.mediaType === "tv" ? e.episodes.length : 0 });
  });

  const changedRows = [];
  for (const [titleId, st] of state) {
    if (st.changed && touched.has(titleId)) changedRows.push(st.row);
  }

  const statements = [];
  if (changedRows.length) {
    statements.push(
      env.DB.prepare(
        "INSERT INTO user_titles (user_id, title_id, status, rating, mood, fav_actor_id, fav_actor_name, " +
          "fav_actor_photo, started_at, finished_at) " +
          "SELECT ?1, json_extract(value, '$.title_id'), json_extract(value, '$.status'), json_extract(value, '$.rating'), " +
          "json_extract(value, '$.mood'), json_extract(value, '$.fav_actor_id'), json_extract(value, '$.fav_actor_name'), " +
          "json_extract(value, '$.fav_actor_photo'), json_extract(value, '$.started_at'), json_extract(value, '$.finished_at') " +
          "FROM json_each(?2) WHERE 1 " +
          "ON CONFLICT(user_id, title_id) DO UPDATE SET status = excluded.status, rating = excluded.rating, " +
          "mood = excluded.mood, fav_actor_id = excluded.fav_actor_id, fav_actor_name = excluded.fav_actor_name, " +
          "fav_actor_photo = excluded.fav_actor_photo, started_at = excluded.started_at, " +
          "finished_at = excluded.finished_at, updated_at = datetime('now')"
      ).bind(user.id, JSON.stringify(changedRows))
    );
  }
  const epIndex = statements.length;
  if (episodeRows.length) {
    statements.push(
      env.DB.prepare(
        "INSERT OR IGNORE INTO episode_progress (user_id, title_id, season_number, episode_number, watched_at) " +
          "SELECT ?1, json_extract(value, '$.t'), json_extract(value, '$.s'), json_extract(value, '$.e'), " +
          "COALESCE(json_extract(value, '$.at'), datetime('now')) FROM json_each(?2) WHERE 1"
      ).bind(user.id, JSON.stringify(episodeRows))
    );
  }

  let episodesAdded = 0;
  if (statements.length) {
    try {
      const out = await env.DB.batch(statements);
      if (episodeRows.length) {
        const meta = out[epIndex] && out[epIndex].meta;
        episodesAdded = meta && Number.isInteger(meta.changes) ? meta.changes : 0;
      }
    } catch (e) {
      return { error: "server_error" };
    }
  }

  const counts = { added: 0, updated: 0, same: 0, notfound: 0, error: 0 };
  for (const r of results) counts[r.outcome] = (counts[r.outcome] || 0) + 1;
  return { ok: true, results: results, counts: counts, episodes_added: episodesAdded };
}

// POST /api/import-batch  { entries: [ ... up to 10 ... ] }
export async function handleImportBatch(request, env, user) {
  const body = await readBody(request);
  const entries = body ? cleanEntries(body.entries) : null;
  if (!entries) return json({ error: "bad_request" }, 400);
  if (!env.TMDB_TOKEN) return json({ error: "server_misconfigured" }, 500);
  const out = await importEntries(env, user, entries);
  return out.error ? json({ error: out.error }, 500) : json(out);
}

// POST /api/import-list-items  { list_id, entries: [ ... up to 10 ... ] }
// Adds titles to one of your lists (without touching your library).
export async function handleImportListItems(request, env, user) {
  const body = await readBody(request);
  const entries = body ? cleanEntries(body.entries) : null;
  if (!entries || !body || !Number.isInteger(body.list_id)) return json({ error: "bad_request" }, 400);
  if (!env.TMDB_TOKEN) return json({ error: "server_misconfigured" }, 500);

  const list = await env.DB.prepare("SELECT id FROM lists WHERE id = ?1 AND owner_id = ?2")
    .bind(body.list_id, user.id)
    .first();
  if (!list) return json({ error: "not_found" }, 404);

  let found;
  try {
    found = await resolveAndStore(env, entries);
  } catch (e) {
    return json({ error: "server_error" }, 500);
  }

  const info = await env.DB.prepare(
    "SELECT COUNT(*) AS n, COALESCE(MAX(position), 0) AS maxpos FROM list_items WHERE list_id = ?1"
  )
    .bind(list.id)
    .first();
  const have = new Set();
  const titleIds = found.filter((f) => !f.error).map((f) => f.titleId);
  if (titleIds.length) {
    const rows = await env.DB.prepare(
      "SELECT title_id FROM list_items WHERE list_id = ?1 AND title_id IN (SELECT value FROM json_each(?2))"
    )
      .bind(list.id, JSON.stringify(titleIds))
      .all();
    for (const r of rows.results || []) have.add(r.title_id);
  }

  let count = info ? info.n : 0;
  let pos = info ? info.maxpos : 0;
  const rowsToAdd = [];
  const results = [];
  entries.forEach((e, i) => {
    const f = found[i];
    if (!e || f.error) { results.push({ i: i, outcome: f.error || "notfound" }); return; }
    if (have.has(f.titleId)) { results.push({ i: i, outcome: "same", title: f.title }); return; }
    if (count >= MAX_LIST_ITEMS) { results.push({ i: i, outcome: "full", title: f.title }); return; }
    have.add(f.titleId);
    count++;
    pos++;
    rowsToAdd.push({ t: f.titleId, p: pos, note: e.note || null });
    results.push({ i: i, outcome: "added", title: f.title, year: f.year });
  });

  if (rowsToAdd.length) {
    try {
      await env.DB.batch([
        env.DB.prepare(
          "INSERT OR IGNORE INTO list_items (list_id, title_id, position, note) " +
            "SELECT ?1, json_extract(value, '$.t'), json_extract(value, '$.p'), json_extract(value, '$.note') " +
            "FROM json_each(?2) WHERE 1"
        ).bind(list.id, JSON.stringify(rowsToAdd)),
        env.DB.prepare("UPDATE lists SET updated_at = datetime('now') WHERE id = ?1").bind(list.id),
      ]);
    } catch (e) {
      return json({ error: "server_error" }, 500);
    }
  }

  const counts = { added: 0, same: 0, full: 0, notfound: 0, error: 0 };
  for (const r of results) counts[r.outcome] = (counts[r.outcome] || 0) + 1;
  return json({ ok: true, results: results, counts: counts });
}

// ---------- export ----------

function day(text) {
  return text ? String(text).slice(0, 10) : null;
}

async function buildBackup(env, user) {
  const [lib, eps, lists, items] = await env.DB.batch([
    env.DB.prepare(
      "SELECT t.tmdb_id, t.media_type, t.imdb_id, t.title, t.year, ut.status, ut.rating, ut.mood, " +
        "ut.fav_actor_id, ut.fav_actor_name, ut.fav_actor_photo, ut.started_at, ut.finished_at " +
        "FROM user_titles ut JOIN titles t ON t.id = ut.title_id WHERE ut.user_id = ?1 ORDER BY ut.id"
    ).bind(user.id),
    env.DB.prepare(
      "SELECT t.tmdb_id, e.season_number AS s, e.episode_number AS n, e.watched_at AS at " +
        "FROM episode_progress e JOIN titles t ON t.id = e.title_id WHERE e.user_id = ?1 " +
        "ORDER BY t.tmdb_id, e.season_number, e.episode_number"
    ).bind(user.id),
    env.DB.prepare(
      "SELECT id, title, description, visibility, is_ranked FROM lists WHERE owner_id = ?1 ORDER BY id"
    ).bind(user.id),
    env.DB.prepare(
      "SELECT li.list_id, t.tmdb_id, t.media_type, t.imdb_id, t.title, t.year, li.note, li.position " +
        "FROM list_items li JOIN titles t ON t.id = li.title_id " +
        "WHERE li.list_id IN (SELECT id FROM lists WHERE owner_id = ?1) ORDER BY li.list_id, li.position, li.id"
    ).bind(user.id),
  ]);

  const library = (lib.results || []).map((r) => {
    const o = { tmdb_id: r.tmdb_id, type: r.media_type, imdb: r.imdb_id || undefined, title: r.title, year: r.year || undefined, status: r.status };
    if (r.rating) o.rating = r.rating;
    if (r.mood) o.mood = r.mood.split(",");
    if (r.fav_actor_id) o.actor = { id: r.fav_actor_id, name: r.fav_actor_name, photo: r.fav_actor_photo };
    if (r.started_at) o.started_at = r.started_at;
    if (r.finished_at) o.finished_at = r.finished_at;
    return o;
  });

  const episodes = [];
  let cur = null;
  for (const r of eps.results || []) {
    if (!cur || cur.tmdb_id !== r.tmdb_id) {
      cur = { tmdb_id: r.tmdb_id, items: [] };
      episodes.push(cur);
    }
    cur.items.push([r.s, r.n, day(r.at)]);
  }

  const byList = new Map();
  for (const r of items.results || []) {
    if (!byList.has(r.list_id)) byList.set(r.list_id, []);
    const it = { tmdb_id: r.tmdb_id, type: r.media_type, imdb: r.imdb_id || undefined, title: r.title, year: r.year || undefined };
    if (r.note) it.note = r.note;
    byList.get(r.list_id).push(it);
  }
  const outLists = (lists.results || []).map((l) => ({
    title: l.title,
    description: l.description || "",
    visibility: l.visibility,
    is_ranked: l.is_ranked === 1,
    items: byList.get(l.id) || [],
  }));

  return {
    app: "flicksy",
    version: 1,
    exported_at: new Date().toISOString(),
    user: { flicksy_id: user.public_id, name: user.display_name },
    library: library,
    episodes: episodes,
    lists: outLists,
  };
}

// GET /api/backup-export  -> the backup as JSON
export async function handleBackupExport(url, env, user) {
  try {
    const data = await buildBackup(env, user);
    return json(data);
  } catch (e) {
    return json({ error: "server_error" }, 500);
  }
}

// POST /api/backup-send  -> builds the backup and sends it to your chat with the bot as a file
export async function handleBackupSend(request, env, user) {
  if (!env.BOT_TOKEN || !user.telegram_id) return json({ error: "send_failed" }, 502);

  let data;
  try {
    data = await buildBackup(env, user);
  } catch (e) {
    return json({ error: "server_error" }, 500);
  }

  const text = JSON.stringify(data);
  const name = "flicksy-backup-" + new Date().toISOString().slice(0, 10) + ".json";
  const form = new FormData();
  form.append("chat_id", String(user.telegram_id));
  form.append(
    "caption",
    "Flicksy backup · " + data.library.length + " titles · " + data.lists.length + " lists"
  );
  form.append("document", new Blob([text], { type: "application/json" }), name);

  try {
    const res = await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/sendDocument", {
      method: "POST",
      body: form,
    });
    const out = await res.json().catch(() => null);
    if (!res.ok || !out || !out.ok) return json({ error: "send_failed" }, 502);
  } catch (e) {
    return json({ error: "send_failed" }, 502);
  }
  return json({ ok: true, titles: data.library.length, lists: data.lists.length, file: name });
}

// POST /api/import-sync { after: <title id> }
// After an import: series whose every aired episode is marked get the status "watched" (instead of "watching").
// Works through the user's series in small steps; the app calls it again with `next` until it is null.
export async function handleImportSync(request, env, user) {
  const body = await readBody(request);
  const after = body && Number.isInteger(body.after) && body.after > 0 ? body.after : 0;
  if (!env.TMDB_TOKEN) return json({ error: "server_misconfigured" }, 500);

  const rows = await env.DB.prepare(
    "SELECT ut.id AS ut_id, ut.title_id, t.tmdb_id, " +
      "(SELECT COUNT(*) FROM episode_progress e WHERE e.user_id = ?1 AND e.title_id = ut.title_id AND e.season_number > 0) AS seen, " +
      "(SELECT MAX(e.watched_at) FROM episode_progress e WHERE e.user_id = ?1 AND e.title_id = ut.title_id) AS last_at " +
      "FROM user_titles ut JOIN titles t ON t.id = ut.title_id " +
      "WHERE ut.user_id = ?1 AND t.media_type = 'tv' AND ut.status IN ('want', 'watching') AND ut.title_id > ?2 " +
      "AND EXISTS (SELECT 1 FROM episode_progress e WHERE e.user_id = ?1 AND e.title_id = ut.title_id) " +
      "ORDER BY ut.title_id LIMIT 12"
  )
    .bind(user.id, after)
    .all();
  const list = rows.results || [];
  const today = new Date().toISOString().slice(0, 10);

  const done = [];
  await Promise.all(
    list.map(async (r) => {
      try {
        const res = await tmdbGet(env, "/tv/" + r.tmdb_id + "?language=en-US", 86400);
        const seasons = (res.data && res.data.seasons) || [];
        let total = 0;
        for (const s of seasons) {
          if (!s.season_number || s.season_number < 1) continue;
          if (s.air_date && s.air_date <= today) total += s.episode_count || 0;
        }
        if (total > 0 && r.seen >= total) done.push(r);
      } catch (e) {
        // leave it as it is
      }
    })
  );

  if (done.length) {
    await env.DB.batch(
      done.map((r) =>
        env.DB.prepare(
          "UPDATE user_titles SET status = 'watched', finished_at = COALESCE(finished_at, ?1), updated_at = datetime('now') WHERE id = ?2"
        ).bind(r.last_at || null, r.ut_id)
      )
    );
  }

  const next = list.length >= 12 ? list[list.length - 1].title_id : null;
  return json({ ok: true, checked: list.length, upgraded: done.length, next: next });
}
