// Badges, worked out on the fly from data that already exists (nothing is stored per badge).
// The look (frames, glyphs, colours, texts) lives in public/badges.js; here only the rules.
//   computeBadges(env, userId) -> { counts, earned: [badge ids], primary: badge id | null }
//
// Rules in this first version:
//   movies / episodes watched, lists created, followers, comments  (ladders)
//   a list with 100 / 1000 followers                               (cur100, cur1000)
//   founder (first 100 users), early (first 1,000 users)           (by sign-up order)
//   team, verified, beta, supporter                                (set by hand in the user_badges table)
// Not yet: hours, streaks, genre masters, leaderboard, behavior, seasonal.

export const LADDERS = {
  m: [10, 50, 100, 250, 500, 1000, 2500, 5000],
  e: [50, 250, 1000, 2500, 5000, 10000],
  l: [1, 5, 20],
  f: [10, 100, 1000, 10000],
  c: [10, 100, 1000],
};

// which count each ladder reads
const COUNT_OF = { m: "movies", e: "episodes", l: "lists", f: "followers", c: "comments" };
// the order used to break ties between ladders of the same tier
const LADDER_ORDER = ["m", "e", "f", "l", "c"];
// special badges that are shown first, best first
const SPECIAL_ORDER = ["team", "verified", "founder", "early", "beta", "supporter"];
const MANUAL = ["team", "verified", "beta", "supporter"];

function one(result) {
  return (result && result.results && result.results[0]) || {};
}

// colour level of a ladder badge: 0 bronze ... 4 diamond (same formula as the design)
function tierOf(index, n) {
  return n < 2 ? 0 : Math.round((index * 4) / (n - 1));
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

  // primary badge: a special one first, otherwise the ladder badge with the highest colour level
  let primary = null;
  for (const id of SPECIAL_ORDER) {
    if (earned.indexOf(id) !== -1) { primary = id; break; }
  }
  if (!primary && best.length) {
    let pick = best[0];
    best.forEach((b) => { if (b.tier > pick.tier) pick = b; });
    primary = pick.id;
  }
  return { counts: counts, earned: earned, primary: primary };
}
