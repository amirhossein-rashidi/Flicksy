// Who follows me / who I follow. Only for your own profile (you never see another person's lists of people).
//   GET /api/follow-list?kind=followers|following   -> { kind, total, items: [{ person, at }] }

import { json } from "./util.js";

const MAX = 200;

export async function handleFollowList(url, env, user) {
  const kind = url.searchParams.get("kind") === "following" ? "following" : "followers";
  const join = kind === "followers" ? "f.follower_id" : "f.followed_id";
  const where = kind === "followers" ? "f.followed_id" : "f.follower_id";
  try {
    const rows = await env.DB.prepare(
      "SELECT u.public_id, u.display_name, u.username, u.photo_url, f.created_at AS at " +
        "FROM follows f JOIN users u ON u.id = " + join + " " +
        "WHERE " + where + " = ?1 AND f.status = 'accepted' " +
        "ORDER BY f.created_at DESC, u.id DESC LIMIT " + MAX
    )
      .bind(user.id)
      .all();
    const items = (rows.results || []).map((r) => ({
      person: {
        public_id: r.public_id,
        display_name: r.display_name,
        username: r.username || null,
        photo_url: r.photo_url || null,
      },
      at: r.at,
    }));
    return json({ kind: kind, total: items.length, items: items });
  } catch (e) {
    return json({ kind: kind, total: 0, items: [] });
  }
}
