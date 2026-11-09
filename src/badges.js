// Badges, worked out on the fly from data that already exists (nothing is stored per badge).
// The look (frames, glyphs, colours, texts) lives in public/badges.js; here only the rules.
//   computeBadges(env, userId)      -> { counts, earned: [badge ids], primary: badge id | null, pinned, auto }
//   primaryBadgesFor(env, userIds)  -> Map(userId -> primary badge id), a cheap batch version for list rows
//
// Rules in this first version:
//   movies / episodes watched, lists created, followers, comments  (ladders)
//   a list with 100 / 1000 followers                               (cur100, cur1000)
//   founder (first 100 users), early (first 1,000 users)           (by sign-up order)
//   team, verified, beta, supporter                                (set by hand in the user_badges table)
//   hours (estimated), best streak, genre masters, rewatcher, spoiler-safe, series finisher
//     -> earned and can be pinned, but never chosen automatically as the main badge
//   marathon (10 episodes on one day, counted by different watch times so "mark all" and imports do not count),
//   seasonal: yalda (Dec 20-21), nowruz (Mar 20-23), hallo (Oct 31) -> watched something on those days,
//     only days from SEASON_FROM on count; they can also be given by hand in user_badges
// Not yet: leaderboard rank, night owl (needs the viewer's time zone), Oscar night (moving date).

import { json } from "./util.js";

export const LADDERS = {
  m: [10, 50, 100, 250, 500, 1000, 2500, 5000],
  e: [50, 250, 1000, 2500, 5000, 10000],
  l: [1, 5, 20],
  f: [10, 100, 1000, 10000],
  c: [10, 100, 1000],
  h: [100, 500, 1000, 5000],
  s: [7, 30, 100, 365],
};

// which count each ladder reads
const COUNT_OF = { m: "movies", e: "episodes", l: "lists", f: "followers", c: "comments", h: "hours", s: "streak" };
// the order used to break ties between ladders of the same tier (only these can become the automatic main badge)
const LADDER_ORDER = ["m", "e", "f", "l", "c"];
// ladders that are earned and can be pinned, but never become the automatic main badge
// (they cost more to work out, and the main badge of many people is needed at once in list rows)
const EXTRA_LADDERS = ["h", "s"];
// single badges with a goal
const GENRE_GOAL = 20;
const GENRES = {
  horror: ["Horror"],
  scifi: ["Science Fiction", "Sci-Fi & Fantasy"],
  comedy: ["Comedy"],
  drama: ["Drama"],
  thriller: ["Thriller"],
  anim: ["Animation"],
  doc: ["Documentary"],
  romance: ["Romance"],
};
const GOALS = { rewatch: ["rewatches", 5], spoiler: ["spoilers", 10], finisher: ["finished", 3], marathon: ["marathon", 10] };
// seasonal badges: [first month, first day, last month, last day] of the dates that count
const SEASONS = { yalda: [12, 20, 12, 21], nowruz: [3, 20, 3, 23], hallo: [10, 31, 10, 31] };
// ids that need the extra counts: used to trust a pinned badge in the batch version
const EXTRA_ID = /^(h\d+|s\d+|rewatch|spoiler|finisher|marathon|yalda|nowruz|hallo|horror|scifi|comedy|drama|thriller|anim|doc|romance)$/;
// special badges that are shown first, best first
const SPECIAL_ORDER = ["team", "verified", "founder", "early", "beta", "supporter"];
const MANUAL = ["team", "verified", "beta", "supporter", "yalda", "nowruz", "hallo"];
// seasonal days only count from this date on, so history imported from other apps (old dates) does not earn them
const SEASON_FROM = "2026-11-09";

function one(result) {
  return (result && result.results && result.results[0]) || {};
}

// colour level of a ladder badge: 0 bronze ... 4 diamond (same formula as the design)
function tierOf(index, n) {
  return n < 2 ? 0 : Math.round((index * 4) / (n - 1));
}

// earnedBase = founder / early / hand-given badges. Adds every ladder level reached and picks the primary badge.
// pinnedRaw = the badge the person pinned next to their name (used only while it is still earned).
function finish(counts, earnedBase, pinnedRaw, trustExtraPin) {
  const earned = earnedBase.slice();

  // ladders: every level reached is earned; remember the best colour level for the "primary" badge
  const best = [];
  LADDER_ORDER.forEach((k) => {
    const levels = LADDERS[k];
    const have = counts[COUNT_OF[k]];
    let top = -1;
    levels.forEach((v, i) => {
      if (have >= v) { earned.push(k + v); top = i; }
    });
    if (top >= 0) best.push({ id: k + levels[top], tier: tierOf(top, levels.length) });
  });
  if (counts.list_followers >= 100) { earned.push("cur100"); best.push({ id: "cur100", tier: 3 }); }
  if (counts.list_followers >= 1000) { earned.push("cur1000"); best.push({ id: "cur1000", tier: 4 }); }

  // hours and streak ladders, goals, genre masters: earned (and pinnable) but not part of the automatic choice
  EXTRA_LADDERS.forEach((k) => {
    const have = counts[COUNT_OF[k]] || 0;
    LADDERS[k].forEach((v) => {
      if (have >= v) earned.push(k + v);
    });
  });
  Object.keys(GOALS).forEach((id) => {
    if ((counts[GOALS[id][0]] || 0) >= GOALS[id][1]) earned.push(id);
  });
  Object.keys(GENRES).forEach((id) => {
    if (((counts.genres || {})[id] || 0) >= GENRE_GOAL) earned.push(id);
  });
  (counts.seasons || []).forEach((id) => earned.push(id));

  // automatic primary badge: a special one first, otherwise the ladder badge with the highest colour level
  let auto = null;
  for (const id of SPECIAL_ORDER) {
    if (earned.indexOf(id) !== -1) { auto = id; break; }
  }
  if (!auto && best.length) {
    let pick = best[0];
    best.forEach((b) => { if (b.tier > pick.tier) pick = b; });
    auto = pick.id;
  }

  const pinned =
    pinnedRaw && (earned.indexOf(pinnedRaw) !== -1 || (trustExtraPin && EXTRA_ID.test(pinnedRaw))) ? pinnedRaw : null;
  return { counts: counts, earned: earned, primary: pinned || auto, pinned: pinned, auto: auto };
}

// longest run of days in a row, from a list of "YYYY-MM-DD" days (days in the future are ignored)
function bestStreak(days) {
  const today = Date.now() + 86400000;
  const nums = [];
  days.forEach((d) => {
    if (typeof d !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
    const ms = Date.parse(d + "T12:00:00Z");
    if (Number.isNaN(ms) || ms > today) return;
    nums.push(Math.round(ms / 86400000));
  });
  nums.sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev = null;
  nums.forEach((n) => {
    if (n === prev) return;
    run = prev !== null && n === prev + 1 ? run + 1 : 1;
    prev = n;
    if (run > best) best = run;
  });
  return best;
}

// hours watched, best streak, rewatches, spoiler comments, finished series, titles per genre
async function addExtraCounts(env, userId, counts) {
  counts.hours = 0;
  counts.streak = 0;
  counts.rewatches = 0;
  counts.spoilers = 0;
  counts.finished = 0;
  counts.genres = {};
  counts.marathon = 0;
  counts.seasons = [];
  try {
    const rs = await env.DB.batch([
      env.DB.prepare(
        "SELECT COALESCE(SUM(COALESCE(t.runtime, 100)), 0) AS n FROM user_titles ut JOIN titles t ON t.id = ut.title_id " +
          "WHERE ut.user_id = ?1 AND t.media_type = 'movie' AND ut.status = 'watched'"
      ).bind(userId),
      env.DB.prepare(
        "SELECT COALESCE(SUM(COALESCE(t.runtime, 40)), 0) AS n FROM episode_progress ep JOIN titles t ON t.id = ep.title_id " +
          "WHERE ep.user_id = ?1 AND ep.season_number >= 1"
      ).bind(userId),
      env.DB.prepare("SELECT COUNT(*) AS n FROM watch_log WHERE user_id = ?1 AND is_rewatch = 1").bind(userId),
      env.DB.prepare("SELECT COUNT(*) AS n FROM comments WHERE user_id = ?1 AND deleted = 0 AND spoiler = 1").bind(userId),
      env.DB.prepare(
        "SELECT COUNT(*) AS n FROM user_titles ut JOIN titles t ON t.id = ut.title_id " +
          "WHERE ut.user_id = ?1 AND t.media_type = 'tv' AND ut.status = 'watched'"
      ).bind(userId),
      env.DB.prepare(
        "SELECT t.genres AS g FROM user_titles ut JOIN titles t ON t.id = ut.title_id " +
          "WHERE ut.user_id = ?1 AND ut.status = 'watched' AND t.genres IS NOT NULL"
      ).bind(userId),
      env.DB.prepare(
        "SELECT substr(watched_at, 1, 10) AS d FROM episode_progress WHERE user_id = ?1 " +
          "UNION SELECT watched_on AS d FROM watch_log WHERE user_id = ?1"
      ).bind(userId),
      // most episodes on one day, counted by different watch times (a whole season marked at once shares one time)
      env.DB.prepare(
        "SELECT COALESCE(MAX(c), 0) AS n FROM (SELECT COUNT(DISTINCT watched_at) AS c FROM episode_progress " +
          "WHERE user_id = ?1 AND season_number >= 1 GROUP BY substr(watched_at, 1, 10))"
      ).bind(userId),
    ]);
    counts.hours = Math.floor((((one(rs[0]).n || 0) + (one(rs[1]).n || 0)) / 60));
    counts.rewatches = one(rs[2]).n || 0;
    counts.spoilers = one(rs[3]).n || 0;
    counts.finished = one(rs[4]).n || 0;
    ((rs[5] && rs[5].results) || []).forEach((r) => {
      let list = [];
      try {
        list = JSON.parse(r.g || "[]");
      } catch (e) {
        list = [];
      }
      if (!Array.isArray(list)) return;
      Object.keys(GENRES).forEach((id) => {
        if (GENRES[id].some((name) => list.indexOf(name) !== -1)) counts.genres[id] = (counts.genres[id] || 0) + 1;
      });
    });
    const days = ((rs[6] && rs[6].results) || []).map((r) => r.d);
    counts.streak = bestStreak(days);
    counts.marathon = one(rs[7]).n || 0;
    Object.keys(SEASONS).forEach((id) => {
      const s = SEASONS[id];
      const hit = days.some((d) => {
        const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(d || "");
        if (!m || d < SEASON_FROM) return false;
        const v = +m[1] * 100 + +m[2];
        return v >= s[0] * 100 + s[1] && v <= s[2] * 100 + s[3];
      });
      if (hit) counts.seasons.push(id);
    });
  } catch (e) {
    // watch_log is added by migration 8; without it these badges simply stay locked
  }
}

export async function computeBadges(env, userId) {
  const counts = { movies: 0, episodes: 0, lists: 0, followers: 0, comments: 0, list_followers: 0 };
  const earned = [];
  try {
    const rs = await env.DB.batch([
      env.DB.prepare(
        "SELECT COUNT(*) AS n FROM user_titles ut JOIN titles t ON t.id = ut.title_id " +
          "WHERE ut.user_id = ?1 AND t.media_type = 'movie' AND ut.status = 'watched'"
      ).bind(userId),
      env.DB.prepare("SELECT COUNT(*) AS n FROM episode_progress WHERE user_id = ?1 AND season_number >= 1").bind(userId),
      env.DB.prepare("SELECT COUNT(*) AS n FROM lists WHERE owner_id = ?1").bind(userId),
      env.DB.prepare("SELECT COUNT(*) AS n FROM follows WHERE followed_id = ?1 AND status = 'accepted'").bind(userId),
      env.DB.prepare("SELECT COUNT(*) AS n FROM comments WHERE user_id = ?1 AND deleted = 0").bind(userId),
      env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE id <= ?1").bind(userId),
    ]);
    counts.movies = one(rs[0]).n || 0;
    counts.episodes = one(rs[1]).n || 0;
    counts.lists = one(rs[2]).n || 0;
    counts.followers = one(rs[3]).n || 0;
    counts.comments = one(rs[4]).n || 0;
    const signupRank = one(rs[5]).n || 0;
    if (signupRank >= 1 && signupRank <= 100) earned.push("founder");
    if (signupRank >= 1 && signupRank <= 1000) earned.push("early");
  } catch (e) {
    return { counts: counts, earned: [], primary: null };
  }

  // the most followed public list of this person
  try {
    const r = await env.DB.prepare(
      "SELECT COALESCE(MAX(c), 0) AS n FROM (" +
        "SELECT COUNT(*) AS c FROM list_follows lf JOIN lists l ON l.id = lf.list_id " +
        "WHERE l.owner_id = ?1 AND l.visibility = 'public' GROUP BY lf.list_id)"
    )
      .bind(userId)
      .first();
    counts.list_followers = (r && r.n) || 0;
  } catch (e) {
    // list_follows is added by migration 12
  }

  // badges that are given by hand
  try {
    const rows = await env.DB.prepare("SELECT badge_id FROM user_badges WHERE user_id = ?1").bind(userId).all();
    (rows.results || []).forEach((r) => {
      if (MANUAL.indexOf(r.badge_id) !== -1 && earned.indexOf(r.badge_id) === -1) earned.push(r.badge_id);
    });
  } catch (e) {
    // user_badges is added by migration 13
  }

  await addExtraCounts(env, userId, counts);

  // the badge the person pinned next to their name
  let pinnedRaw = null;
  try {
    const r = await env.DB.prepare("SELECT primary_badge FROM users WHERE id = ?1").bind(userId).first();
    if (r && r.primary_badge) pinnedRaw = r.primary_badge;
  } catch (e) {
    // users.primary_badge is added by migration 14
  }
  return finish(counts, earned, pinnedRaw);
}

function toMap(result, field) {
  const m = new Map();
  ((result && result.results) || []).forEach((r) => m.set(r.uid, r[field || "n"]));
  return m;
}

// Batch version for rows of people (leaderboard, comments, people search): one set of grouped queries
// for many people instead of seven queries per person. Gives the same primary badge as computeBadges.
// People without any badge are simply missing from the Map.
export async function primaryBadgesFor(env, userIds) {
  const out = new Map();
  const all = Array.from(new Set((userIds || []).filter((x) => Number.isInteger(x))));
  for (let at = 0; at < all.length; at += 80) {
    const ids = all.slice(at, at + 80);
    const marks = ids.map((_, i) => "?" + (i + 1)).join(",");
    const stmt = (sql) => env.DB.prepare(sql.replace(/\{IN\}/g, "(" + marks + ")")).bind(...ids);

    let rs;
    try {
      rs = await env.DB.batch([
        stmt(
          "SELECT ut.user_id AS uid, COUNT(*) AS n FROM user_titles ut JOIN titles t ON t.id = ut.title_id " +
            "WHERE t.media_type = 'movie' AND ut.status = 'watched' AND ut.user_id IN {IN} GROUP BY ut.user_id"
        ),
        stmt("SELECT user_id AS uid, COUNT(*) AS n FROM episode_progress WHERE season_number >= 1 AND user_id IN {IN} GROUP BY user_id"),
        stmt("SELECT owner_id AS uid, COUNT(*) AS n FROM lists WHERE owner_id IN {IN} GROUP BY owner_id"),
        stmt("SELECT followed_id AS uid, COUNT(*) AS n FROM follows WHERE status = 'accepted' AND followed_id IN {IN} GROUP BY followed_id"),
        stmt("SELECT user_id AS uid, COUNT(*) AS n FROM comments WHERE deleted = 0 AND user_id IN {IN} GROUP BY user_id"),
        stmt("SELECT u.id AS uid, (SELECT COUNT(*) FROM users x WHERE x.id <= u.id) AS n FROM users u WHERE u.id IN {IN}"),
      ]);
    } catch (e) {
      continue;
    }
    const movies = toMap(rs[0]);
    const episodes = toMap(rs[1]);
    const lists = toMap(rs[2]);
    const followers = toMap(rs[3]);
    const comments = toMap(rs[4]);
    const rank = toMap(rs[5]);

    let listFollowers = new Map();
    try {
      listFollowers = toMap(
        await stmt(
          "SELECT owner_id AS uid, MAX(c) AS n FROM (" +
            "SELECT l.owner_id AS owner_id, COUNT(*) AS c FROM list_follows lf JOIN lists l ON l.id = lf.list_id " +
            "WHERE l.visibility = 'public' AND l.owner_id IN {IN} GROUP BY lf.list_id) GROUP BY owner_id"
        ).all()
      );
    } catch (e) {
      // list_follows is added by migration 12
    }

    const manual = new Map();
    try {
      const rows = await stmt("SELECT user_id AS uid, badge_id FROM user_badges WHERE user_id IN {IN}").all();
      (rows.results || []).forEach((r) => {
        if (MANUAL.indexOf(r.badge_id) === -1) return;
        if (!manual.has(r.uid)) manual.set(r.uid, []);
        manual.get(r.uid).push(r.badge_id);
      });
    } catch (e) {
      // user_badges is added by migration 13
    }

    let pins = new Map();
    try {
      pins = toMap(await stmt("SELECT id AS uid, primary_badge AS pb FROM users WHERE id IN {IN}").all(), "pb");
    } catch (e) {
      // users.primary_badge is added by migration 14
    }

    ids.forEach((id) => {
      const counts = {
        movies: movies.get(id) || 0,
        episodes: episodes.get(id) || 0,
        lists: lists.get(id) || 0,
        followers: followers.get(id) || 0,
        comments: comments.get(id) || 0,
        list_followers: listFollowers.get(id) || 0,
      };
      const earnedBase = [];
      const r = rank.get(id) || 0;
      if (r >= 1 && r <= 100) earnedBase.push("founder");
      if (r >= 1 && r <= 1000) earnedBase.push("early");
      (manual.get(id) || []).forEach((b) => {
        if (earnedBase.indexOf(b) === -1) earnedBase.push(b);
      });
      // the extra counts are not worked out here, so a pinned extra badge is trusted (it was checked when it was pinned)
      const res = finish(counts, earnedBase, pins.get(id) || null, true);
      if (res.primary) out.set(id, res.primary);
    });
  }
  return out;
}

// PUT /api/badge-pin  { badge_id: "m100" | null }   null goes back to the automatic badge
export async function handleBadgePin(request, env, user) {
  let body = null;
  try {
    body = await request.json();
  } catch (e) {
    body = null;
  }
  if (!body || typeof body !== "object" || body.badge_id === undefined) return json({ error: "bad_request" }, 400);
  const badges = await computeBadges(env, user.id);
  let value = body.badge_id;
  if (value !== null) {
    if (typeof value !== "string" || badges.earned.indexOf(value) === -1) return json({ error: "not_earned" }, 400);
  }
  try {
    await env.DB.prepare("UPDATE users SET primary_badge = ?1 WHERE id = ?2").bind(value, user.id).run();
  } catch (e) {
    return json({ error: "server_error" }, 500);
  }
  return json({ ok: true, badges: await computeBadges(env, user.id) });
}
