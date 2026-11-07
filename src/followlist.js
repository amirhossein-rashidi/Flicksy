// Who follows me / who I follow, or the same for another person (&id=<their Flicksy ID>).
// Another person's lists are shown only when they allow it (Privacy -> followers and following) and,
// for a private profile, only to people who follow them.
//   GET /api/follow-list?kind=followers|following[&id=12345678]   -> { kind, total, items: [{ person, at }] }
//   403 { error: "hidden" | "private" } when the lists are not open to you

import { json } from "./util.js";

const MAX = 200;

export async function handleFollowList(url, env, user) {
  const kind = url.searchParams.get("kind") === "following" ? "following" : "followers";
  const join = kind === "followers" ? "f.follower_id" : "f.followed_id";
  const where = kind === "followers" ? "f.followed_id" : "f.follower_id";
  let ownerId = user.id;
  const pid = url.searchParams.get("id");
  if (pid) {
    if (!/^\d{8}$/.test(pid)) return json({ error: "bad_id" }, 400);
    const target = await env.DB.prepare("SELECT id, is_private, follows_visible FROM users WHERE public_id = ?1")
      .bind(pid)
      .first();
    if (!target) return json({ error: "not_found" }, 404);
    if (target.id !== user.id) {
      if (target.follows_visible === 0) return json({ error: "hidden" }, 403);
      if (target.is_private === 1) {
        const f = await env.DB.prepare(
          "SELECT status FROM follows WHERE follower_id = ?1 AND followed_id = ?2 AND status = 'accepted'"
        )
          .bind(user.id, target.id)
          .first();
        if (!f) return json({ error: "private" }, 403);
      }
      ownerId = target.id;
    }
  }
  try {
    const rows = await env.DB.prepare(
      "SELECT u.public_id, u.display_name, CASE WHEN u.username_visible = 1 THEN u.username END AS username, u.photo_url, f.created_at AS at " +
        "FROM follows f JOIN users u ON u.id = " + join + " " +
        "WHERE " + where + " = ?1 AND f.status = 'accepted' " +
        "ORDER BY f.created_at DESC, u.id DESC LIMIT " + MAX
    )
      .bind(ownerId)
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
