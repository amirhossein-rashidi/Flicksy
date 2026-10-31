// Activity tab: the feed of people you follow, and the leaderboard.
// Read-only. Other people are identified only by their Flicksy ID (public_id).
// Privacy rules used here:
//  - the feed shows only accepted follows whose "show my activity" switch is on
//  - the leaderboard shows only public profiles with "show my activity" on (plus you)

import { json } from "./util.js";
import { TMDB_IMG } from "./tmdb.js";

const FEED_PAGE = 30;
const BOARD_SIZE = 50;

function person(r) {
  return {
    public_id: r.public_id,
    display_name: r.display_name,
    username: r.username || null,
    photo_url: r.photo_url || null,
  };
}

// GET /api/feed?before=<id>
// -> { items: [{ id, type, value, at, person, title, list }], next }
export async function handleFeed(url, env, user) {
  const before = parseInt(url.searchParams.get("before") || "0", 10);
  const beforeId = Number.isInteger(before) && before > 0 ? before : 2147483647;

  const rows = await env.DB.prepare(
    "SELECT a.id, a.type, a.value, a.created_at, " +
      "u.public_id, u.display_name, u.username, u.photo_url, " +
      "t.tmdb_id, t.media_type, t.title, t.title_fa, t.year, t.poster_path, " +
      "l.title AS list_title, l.share_code AS list_code " +
      "FROM activities a " +
      "JOIN follows f ON f.followed_id = a.actor_id AND f.follower_id = ?1 AND f.status = 'accepted' " +
      "JOIN users u ON u.id = a.actor_id " +
      "LEFT JOIN titles t ON t.id = a.title_id " +
      "LEFT JOIN lists l ON l.id = a.list_id " +
      "WHERE u.activity_visible = 1 " +
      "AND a.visibility IN ('public', 'followers') " +
      "AND (a.list_id IS NULL OR l.visibility = 'public') " +
      "AND a.id < ?2 " +
      "ORDER BY a.id DESC LIMIT " + (FEED_PAGE + 1)
  )
    .bind(user.id, beforeId)
    .all();

  const all = rows.results || [];
  const page = all.slice(0, FEED_PAGE);
  const items = page.map((r) => ({
    id: r.id,
    type: r.type,
    value: r.value || null,
    at: r.created_at,
    person: person(r),
    title: r.tmdb_id
      ? {
          tmdb_id: r.tmdb_id,
          media_type: r.media_type,
          title: r.title_fa || r.title,
          title_en: r.title,
          title_fa: r.title_fa || null,
          year: r.year,
          poster: r.poster_path ? TMDB_IMG + r.poster_path : null,
        }
      : null,
    list: r.list_code ? { title: r.list_title, share_code: r.list_code } : null,
  }));

  const followingCount = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM follows WHERE follower_id = ?1 AND status = 'accepted'"
  )
    .bind(user.id)
    .first();

  return json({
    items: items,
    next: all.length > FEED_PAGE && page.length ? page[page.length - 1].id : null,
    following: (followingCount && followingCount.n) || 0,
  });
}

// GET /api/leaderboard?kind=movies|episodes
// -> { kind, rows: [{ rank, person, value, followers, relation, is_me }] }
export async function handleLeaderboard(url, env, user) {
  const kind = url.searchParams.get("kind") === "episodes" ? "episodes" : "movies";

  const source =
    kind === "movies"
      ? "SELECT ut.user_id AS uid, COUNT(*) AS n FROM user_titles ut " +
        "JOIN titles t ON t.id = ut.title_id " +
        "WHERE t.media_type = 'movie' AND ut.status = 'watched' GROUP BY ut.user_id"
      : "SELECT ep.user_id AS uid, COUNT(*) AS n FROM episode_progress ep " +
        "WHERE ep.season_number >= 1 GROUP BY ep.user_id";

  const rows = await env.DB.prepare(
    "SELECT u.id AS uid, u.public_id, u.display_name, u.username, u.photo_url, c.n AS n, " +
      "f.status AS fstatus, " +
      "(SELECT COUNT(*) FROM follows x WHERE x.followed_id = u.id AND x.status = 'accepted') AS followers " +
      "FROM (" + source + ") c " +
      "JOIN users u ON u.id = c.uid " +
      "LEFT JOIN follows f ON f.follower_id = ?1 AND f.followed_id = u.id " +
      "WHERE u.id = ?1 OR (u.is_private = 0 AND u.activity_visible = 1) " +
      "ORDER BY c.n DESC, u.id ASC LIMIT " + BOARD_SIZE
  )
    .bind(user.id)
    .all();

  const list = (rows.results || []).map((r, i) => ({
    rank: i + 1,
    person: person(r),
    value: r.n,
    followers: r.followers || 0,
    relation: r.uid === user.id ? "self" : r.fstatus === "accepted" ? "following" : r.fstatus ? "requested" : "none",
    is_me: r.uid === user.id,
  }));

  return json({ kind: kind, rows: list });
}
