// Social features: find people, profiles, follow / follow requests, privacy settings,
// profile header and the notification bell.
// Other people are always identified by their Flicksy ID (public_id), never by internal
// ids or Telegram ids.

import { json, parseTitleRef } from "./util.js";
import { TMDB_IMG, tmdbGet } from "./tmdb.js";

const MAX_FOLLOWING = 1000;
const MAX_PENDING_ACCEPT = 200;
const HEADER_PRESETS = ["g1", "g2", "g3", "g4", "g5", "g6"];

async function readBody(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : null;
  } catch (e) {
    return null;
  }
}

function cleanPublicId(value) {
  return typeof value === "string" && /^\d{8}$/.test(value.trim()) ? value.trim() : null;
}

function relationOf(row) {
  if (!row) return "none";
  return row.status === "accepted" ? "following" : "requested";
}

function personOut(row, relation) {
  return {
    public_id: row.public_id,
    display_name: row.display_name,
    username: row.username || null,
    photo_url: row.photo_url || null,
    is_private: row.is_private === 1,
    relation: relation,
  };
}

// GET /api/people-search?q=...
// q = 3 to 8 digits  -> up to 5 people whose Flicksy ID starts with those digits
// q = a Telegram username (with or without @) -> that exact person
export async function handlePeopleSearch(url, env, user) {
  const raw = (url.searchParams.get("q") || "").trim();
  if (!raw) return json({ people: [] });

  let rows;
  const base =
    "SELECT u.public_id, u.display_name, u.username, u.photo_url, u.is_private, f.status AS fstatus " +
    "FROM users u LEFT JOIN follows f ON f.follower_id = ?1 AND f.followed_id = u.id ";

  if (/^\d+$/.test(raw)) {
    if (raw.length < 3 || raw.length > 8) return json({ people: [] });
    rows = await env.DB.prepare(
      base +
        "WHERE u.public_id LIKE ?2 AND u.id != ?1 ORDER BY u.public_id LIMIT 5"
    )
      .bind(user.id, raw + "%")
      .all();
  } else {
    const name = raw.replace(/^@/, "");
    if (!/^[A-Za-z0-9_]{3,32}$/.test(name)) return json({ people: [] });
    rows = await env.DB.prepare(
      base + "WHERE lower(u.username) = lower(?2) AND u.id != ?1 LIMIT 5"
    )
      .bind(user.id, name)
      .all();
  }

  const people = (rows.results || [])
    .filter((r) => r.public_id)
    .map((r) => personOut(r, relationOf(r.fstatus ? { status: r.fstatus } : null)));
  return json({ people: people });
}

// GET /api/profile?id=<Flicksy ID>
export async function handleProfile(url, env, user) {
  const pid = cleanPublicId(url.searchParams.get("id"));
  if (!pid) return json({ error: "bad_id" }, 400);

  const target = await env.DB.prepare(
    "SELECT id, public_id, display_name, username, photo_url, header, is_private, created_at " +
      "FROM users WHERE public_id = ?1"
  )
    .bind(pid)
    .first();
  if (!target) return json({ error: "not_found" }, 404);

  const isSelf = target.id === user.id;
  let relation = "none";
  if (isSelf) {
    relation = "self";
  } else {
    const f = await env.DB.prepare(
      "SELECT status FROM follows WHERE follower_id = ?1 AND followed_id = ?2"
    )
      .bind(user.id, target.id)
      .first();
    relation = relationOf(f);
  }

  const [counts, eps, followers, following] = await env.DB.batch([
    env.DB.prepare(
      "SELECT " +
        "COALESCE(SUM(CASE WHEN t.media_type = 'movie' AND ut.status = 'watched' THEN 1 ELSE 0 END), 0) AS movies, " +
        "COALESCE(SUM(CASE WHEN t.media_type = 'tv' AND ut.status IN ('watched', 'watching') THEN 1 ELSE 0 END), 0) AS shows " +
        "FROM user_titles ut JOIN titles t ON t.id = ut.title_id WHERE ut.user_id = ?1"
    ).bind(target.id),
    env.DB.prepare(
      "SELECT COUNT(*) AS n FROM episode_progress WHERE user_id = ?1 AND season_number >= 1"
    ).bind(target.id),
    env.DB.prepare(
      "SELECT COUNT(*) AS n FROM follows WHERE followed_id = ?1 AND status = 'accepted'"
    ).bind(target.id),
    env.DB.prepare(
      "SELECT COUNT(*) AS n FROM follows WHERE follower_id = ?1 AND status = 'accepted'"
    ).bind(target.id),
  ]);

  const c = (counts.results && counts.results[0]) || { movies: 0, shows: 0 };
  const stats = {
    movies: c.movies || 0,
    shows: c.shows || 0,
    episodes: (eps.results && eps.results[0] && eps.results[0].n) || 0,
    followers: (followers.results && followers.results[0] && followers.results[0].n) || 0,
    following: (following.results && following.results[0] && following.results[0].n) || 0,
  };

  // Public lists are shown to everyone on a public profile. On a private profile only the owner
  // and accepted followers see them here (anyone can still open a list from its share link).
  const canSeeLists = isSelf || relation === "following" || target.is_private !== 1;
  let lists = [];
  if (canSeeLists) {
    const rows = await env.DB.prepare(
      "SELECT l.id, l.title, l.description, l.share_code, " +
        "(SELECT COUNT(*) FROM list_items li WHERE li.list_id = l.id) AS n " +
        "FROM lists l WHERE l.owner_id = ?1 AND l.visibility = 'public' " +
        "ORDER BY l.updated_at DESC, l.id DESC LIMIT 30"
    )
      .bind(target.id)
      .all();
    const previews = await env.DB.prepare(
      "SELECT list_id, poster_path FROM (" +
        "SELECT li.list_id AS list_id, t.poster_path AS poster_path, " +
        "ROW_NUMBER() OVER (PARTITION BY li.list_id ORDER BY li.position, li.id) AS rn " +
        "FROM list_items li JOIN titles t ON t.id = li.title_id " +
        "WHERE li.list_id IN (SELECT id FROM lists WHERE owner_id = ?1 AND visibility = 'public')" +
        ") WHERE rn <= 4"
    )
      .bind(target.id)
      .all();
    const posters = new Map();
    for (const p of previews.results || []) {
      if (!p.poster_path) continue;
      if (!posters.has(p.list_id)) posters.set(p.list_id, []);
      posters.get(p.list_id).push(TMDB_IMG + p.poster_path);
    }
    lists = (rows.results || []).map((r) => ({
      share_code: r.share_code,
      title: r.title,
      description: r.description || "",
      count: r.n,
      posters: posters.get(r.id) || [],
    }));
  }

  return json({
    profile: {
      public_id: target.public_id,
      display_name: target.display_name,
      username: target.username || null,
      photo_url: target.photo_url || null,
      header: target.header || null,
      is_private: target.is_private === 1,
      joined: target.created_at,
    },
    stats: stats,
    relation: relation,
    lists_locked: !canSeeLists,
    lists: lists,
  });
}

// POST /api/follow  { id }   -> follow (public profile) or send a request (private profile)
export async function handleFollow(request, env, user) {
  const body = await readBody(request);
  const pid = body ? cleanPublicId(body.id) : null;
  if (!pid) return json({ error: "bad_id" }, 400);

  const target = await env.DB.prepare("SELECT id, is_private FROM users WHERE public_id = ?1")
    .bind(pid)
    .first();
  if (!target) return json({ error: "not_found" }, 404);
  if (target.id === user.id) return json({ error: "self" }, 400);

  const existing = await env.DB.prepare(
    "SELECT status FROM follows WHERE follower_id = ?1 AND followed_id = ?2"
  )
    .bind(user.id, target.id)
    .first();
  if (existing) return json({ ok: true, relation: relationOf(existing) });

  const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM follows WHERE follower_id = ?1")
    .bind(user.id)
    .first();
  if (n && n.n >= MAX_FOLLOWING) return json({ error: "too_many_follows" }, 400);

  if (target.is_private === 1) {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO follows (follower_id, followed_id, status) VALUES (?1, ?2, 'pending')"
    )
      .bind(user.id, target.id)
      .run();
    return json({ ok: true, relation: "requested" });
  }

  await env.DB.batch([
    env.DB.prepare(
      "INSERT OR IGNORE INTO follows (follower_id, followed_id, status) VALUES (?1, ?2, 'accepted')"
    ).bind(user.id, target.id),
    env.DB.prepare(
      "INSERT INTO notifications (user_id, actor_id, type) VALUES (?1, ?2, 'follow')"
    ).bind(target.id, user.id),
  ]);
  return json({ ok: true, relation: "following" });
}

// DELETE /api/follow?id=<Flicksy ID>   -> unfollow, or cancel your request
export async function handleUnfollow(url, env, user) {
  const pid = cleanPublicId(url.searchParams.get("id"));
  if (!pid) return json({ error: "bad_id" }, 400);
  const target = await env.DB.prepare("SELECT id FROM users WHERE public_id = ?1")
    .bind(pid)
    .first();
  if (!target) return json({ error: "not_found" }, 404);

  await env.DB.batch([
    env.DB.prepare("DELETE FROM follows WHERE follower_id = ?1 AND followed_id = ?2").bind(
      user.id,
      target.id
    ),
    env.DB.prepare(
      "DELETE FROM notifications WHERE user_id = ?1 AND actor_id = ?2 AND type = 'follow'"
    ).bind(target.id, user.id),
  ]);
  return json({ ok: true, relation: "none" });
}

// POST /api/follow-requests  { id, action: "accept" | "decline" }
export async function handleFollowRequest(request, env, user) {
  const body = await readBody(request);
  const pid = body ? cleanPublicId(body.id) : null;
  if (!pid || !body || (body.action !== "accept" && body.action !== "decline")) {
    return json({ error: "bad_request" }, 400);
  }

  const requester = await env.DB.prepare("SELECT id FROM users WHERE public_id = ?1")
    .bind(pid)
    .first();
  if (!requester) return json({ error: "not_found" }, 404);

  const pending = await env.DB.prepare(
    "SELECT 1 AS x FROM follows WHERE follower_id = ?1 AND followed_id = ?2 AND status = 'pending'"
  )
    .bind(requester.id, user.id)
    .first();
  if (!pending) return json({ error: "no_request" }, 404);

  if (body.action === "accept") {
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE follows SET status = 'accepted' WHERE follower_id = ?1 AND followed_id = ?2"
      ).bind(requester.id, user.id),
      env.DB.prepare(
        "INSERT INTO notifications (user_id, actor_id, type) VALUES (?1, ?2, 'request_accepted')"
      ).bind(requester.id, user.id),
    ]);
    return json({ ok: true, action: "accept" });
  }

  await env.DB.prepare("DELETE FROM follows WHERE follower_id = ?1 AND followed_id = ?2")
    .bind(requester.id, user.id)
    .run();
  return json({ ok: true, action: "decline" });
}

// GET /api/notifications
// -> { badge, requests: [people waiting for your answer], items: [latest notifications] }
export async function handleNotifications(url, env, user) {
  const [req, items, unread] = await env.DB.batch([
    env.DB.prepare(
      "SELECT u.public_id, u.display_name, u.username, u.photo_url, f.created_at AS at " +
        "FROM follows f JOIN users u ON u.id = f.follower_id " +
        "WHERE f.followed_id = ?1 AND f.status = 'pending' ORDER BY f.created_at DESC LIMIT 50"
    ).bind(user.id),
    env.DB.prepare(
      "SELECT n.id, n.type, n.is_read, n.created_at AS at, u.public_id, u.display_name, u.username, u.photo_url " +
        "FROM notifications n LEFT JOIN users u ON u.id = n.actor_id " +
        "WHERE n.user_id = ?1 ORDER BY n.id DESC LIMIT 30"
    ).bind(user.id),
    env.DB.prepare(
      "SELECT COUNT(*) AS n FROM notifications WHERE user_id = ?1 AND is_read = 0"
    ).bind(user.id),
  ]);

  const requests = (req.results || []).map((r) => ({
    public_id: r.public_id,
    display_name: r.display_name,
    username: r.username || null,
    photo_url: r.photo_url || null,
    at: r.at,
  }));
  const list = (items.results || [])
    .filter((r) => r.public_id)
    .map((r) => ({
      type: r.type,
      read: r.is_read === 1,
      at: r.at,
      person: {
        public_id: r.public_id,
        display_name: r.display_name,
        username: r.username || null,
        photo_url: r.photo_url || null,
      },
    }));
  const unreadCount = (unread.results && unread.results[0] && unread.results[0].n) || 0;

  return json({ badge: unreadCount + requests.length, requests: requests, items: list });
}

// POST /api/notifications-read  -> marks every notification as read
export async function handleNotificationsRead(request, env, user) {
  await env.DB.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?1 AND is_read = 0")
    .bind(user.id)
    .run();
  return json({ ok: true });
}

// GET /api/privacy
export async function handlePrivacyGet(url, env, user) {
  const row = await env.DB.prepare(
    "SELECT is_private, activity_visible, inline_hidden, header FROM users WHERE id = ?1"
  )
    .bind(user.id)
    .first();
  if (!row) return json({ error: "not_found" }, 404);
  return json({
    is_private: row.is_private === 1,
    activity_visible: row.activity_visible !== 0,
    inline_hidden: row.inline_hidden === 1,
    header: row.header || null,
  });
}

// PUT /api/privacy  { is_private?, activity_visible?, inline_hidden? }  (send any of them)
// Turning "private" off accepts everyone who was waiting for approval.
export async function handlePrivacySet(request, env, user) {
  const body = await readBody(request);
  if (!body) return json({ error: "bad_request" }, 400);

  const keys = ["is_private", "activity_visible", "inline_hidden"];
  const sets = [];
  const values = [];
  for (const k of keys) {
    if (body[k] === undefined) continue;
    if (typeof body[k] !== "boolean") return json({ error: "bad_request" }, 400);
    values.push(body[k] ? 1 : 0);
    sets.push(k + " = ?" + values.length);
  }
  if (!sets.length) return json({ error: "bad_request" }, 400);

  const before = await env.DB.prepare("SELECT is_private FROM users WHERE id = ?1")
    .bind(user.id)
    .first();

  values.push(user.id);
  await env.DB.prepare("UPDATE users SET " + sets.join(", ") + " WHERE id = ?" + values.length)
    .bind(...values)
    .run();

  if (body.is_private === false && before && before.is_private === 1) {
    const waiting = await env.DB.prepare(
      "SELECT follower_id FROM follows WHERE followed_id = ?1 AND status = 'pending' LIMIT ?2"
    )
      .bind(user.id, MAX_PENDING_ACCEPT)
      .all();
    const stmts = [];
    for (const w of waiting.results || []) {
      stmts.push(
        env.DB.prepare(
          "UPDATE follows SET status = 'accepted' WHERE follower_id = ?1 AND followed_id = ?2"
        ).bind(w.follower_id, user.id)
      );
      stmts.push(
        env.DB.prepare(
          "INSERT INTO notifications (user_id, actor_id, type) VALUES (?1, ?2, 'request_accepted')"
        ).bind(w.follower_id, user.id)
      );
    }
    if (stmts.length) await env.DB.batch(stmts);
  }

  return handlePrivacyGet(null, env, user);
}

// PUT /api/profile-header  { header: "g1".."g6" | "img:<file>.jpg" | null }
export async function handleHeaderSet(request, env, user) {
  const body = await readBody(request);
  if (!body || body.header === undefined) return json({ error: "bad_request" }, 400);

  let value = body.header;
  if (value !== null) {
    const ok =
      typeof value === "string" &&
      (HEADER_PRESETS.indexOf(value) >= 0 || /^img:[A-Za-z0-9_-]{5,80}\.jpg$/.test(value));
    if (!ok) return json({ error: "bad_header" }, 400);
  }
  await env.DB.prepare("UPDATE users SET header = ?1 WHERE id = ?2").bind(value, user.id).run();
  return json({ ok: true, header: value });
}

// GET /api/header-options?tmdb_id=..&media_type=movie|tv
// Gives the scene pictures of a title you watched, so you can choose one as your profile header.
export async function handleHeaderOptions(url, env, user) {
  const ref = parseTitleRef(url.searchParams.get("tmdb_id"), url.searchParams.get("media_type"));
  if (!ref) return json({ error: "bad_title" }, 400);

  const mine = await env.DB.prepare(
    "SELECT 1 AS x FROM user_titles ut JOIN titles t ON t.id = ut.title_id " +
      "WHERE ut.user_id = ?1 AND t.tmdb_id = ?2 AND t.media_type = ?3 " +
      "AND ut.status IN ('watched', 'watching')"
  )
    .bind(user.id, ref.tmdbId, ref.mediaType)
    .first();
  if (!mine) return json({ error: "not_in_library" }, 403);

  let res;
  try {
    res = await tmdbGet(
      env,
      "/" + ref.mediaType + "/" + ref.tmdbId + "/images?include_image_language=null",
      86400
    );
  } catch (e) {
    return json({ error: "tmdb_error" }, 502);
  }
  const backdrops = res.data && Array.isArray(res.data.backdrops) ? res.data.backdrops : [];
  const files = backdrops
    .map((b) => (typeof b.file_path === "string" ? b.file_path.replace(/^\//, "") : ""))
    .filter((f) => /^[A-Za-z0-9_-]{5,80}\.jpg$/.test(f))
    .slice(0, 12);
  return json({ images: files });
}
