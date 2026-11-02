// Comments: on a title (movie / series) or on one episode, with replies, likes, spoiler flag,
// edit (first 5 minutes), delete and report.
//
//   GET    /api/comments?tmdb_id=&type=&season=&episode=&sort=top|new|friends&offset=
//   GET    /api/comments?parent=<id>            all replies of one comment
//   GET    /api/comments?id=<id>                one comment (for shared links)
//   POST   /api/comments                        {tmdb_id,type,season?,episode?,parent_id?,body,spoiler}
//   PUT    /api/comments                        {id, body, spoiler}  (owner, within 5 minutes)
//   DELETE /api/comments?id=<id>                (owner)
//   PUT    /api/comment-like                    {id, liked}
//   POST   /api/comment-report                  {id}
//
// Tables come from migration 10 (see db/schema.sql). Before it is run every call answers
// {"error":"comments_unavailable"} instead of crashing.

import { json, parseTitleRef } from "./util.js";
import { ensureTitle } from "./tmdb.js";
import { notifyReply, notifyLike, removeLikeNotif } from "./notify.js";

const EDIT_WINDOW_MS = 5 * 60 * 1000;
const MAX_BODY = 1000;
const PAGE = 20;

function toMs(sqlDate) {
  // SQLite datetime('now') = "YYYY-MM-DD HH:MM:SS" in UTC
  return Date.parse(String(sqlDate).replace(" ", "T") + "Z");
}

function intOrNull(v, max) {
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "string" ? parseInt(v, 10) : v;
  if (!Number.isInteger(n) || n < 1 || n > max) return undefined;
  return n;
}

async function findTitle(env, ref) {
  const row = await env.DB.prepare("SELECT id FROM titles WHERE tmdb_id = ?1 AND media_type = ?2")
    .bind(ref.tmdbId, ref.mediaType)
    .first();
  if (row) return row.id;
  try {
    const made = await ensureTitle(env, ref.tmdbId, ref.mediaType);
    if (made && made.id) return made.id;
    if (typeof made === "number") return made;
  } catch (e) {
    // fall through
  }
  const again = await env.DB.prepare("SELECT id FROM titles WHERE tmdb_id = ?1 AND media_type = ?2")
    .bind(ref.tmdbId, ref.mediaType)
    .first();
  return again ? again.id : null;
}

// Turns raw rows into what the app needs (ratings of the authors, likes, my like).
async function shape(env, user, rows) {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const marks = ids.map((_, i) => "?" + (i + 2)).join(",");

  const liked = new Set();
  try {
    const lk = await env.DB.prepare(
      "SELECT comment_id FROM comment_likes WHERE user_id = ?1 AND comment_id IN (" + marks + ")"
    )
      .bind(user.id, ...ids)
      .all();
    (lk.results || []).forEach((x) => liked.add(x.comment_id));
  } catch (e) {
    // ignore
  }

  // the author's own rating of the title (or of the episode)
  const titleRating = new Map();
  const epRating = new Map();
  try {
    const t = rows.find((r) => r.season_number === null);
    if (t) {
      const rs = await env.DB.prepare("SELECT user_id, rating FROM user_titles WHERE title_id = ?1 AND rating IS NOT NULL")
        .bind(t.title_id)
        .all();
      (rs.results || []).forEach((x) => titleRating.set(x.user_id, x.rating));
    }
    const e = rows.find((r) => r.season_number !== null);
    if (e) {
      const rs = await env.DB.prepare(
        "SELECT user_id, rating FROM episode_notes WHERE title_id = ?1 AND season_number = ?2 AND episode_number = ?3 AND rating IS NOT NULL"
      )
        .bind(e.title_id, e.season_number, e.episode_number)
        .all();
      (rs.results || []).forEach((x) => epRating.set(x.user_id, x.rating));
    }
  } catch (e) {
    // ratings are optional
  }

  return rows.map((r) => {
    const rating = r.season_number === null ? titleRating.get(r.user_id) : epRating.get(r.user_id);
    return {
      id: r.id,
      parent_id: r.parent_id || null,
      user: {
        public_id: r.public_id,
        display_name: r.display_name,
        photo_url: r.photo_url || null,
      },
      body: r.deleted ? "" : r.body,
      deleted: !!r.deleted,
      spoiler: !!r.spoiler,
      created_at: r.created_at,
      edited: !!r.edited_at,
      likes: r.likes || 0,
      liked: liked.has(r.id),
      reply_count: r.reply_count || 0,
      mine: r.user_id === user.id,
      can_edit: r.user_id === user.id && !r.deleted && Date.now() - toMs(r.created_at) < EDIT_WINDOW_MS,
      rating: rating ? Math.ceil(rating / 2) : null,
      season: r.season_number,
      episode: r.episode_number,
    };
  });
}

const SELECT =
  "SELECT c.id, c.user_id, c.title_id, c.season_number, c.episode_number, c.parent_id, c.body, c.spoiler, c.deleted, " +
  "c.edited_at, c.created_at, u.public_id, u.display_name, u.photo_url, " +
  "(SELECT COUNT(*) FROM comment_likes l WHERE l.comment_id = c.id) AS likes, " +
  "(SELECT COUNT(*) FROM comments r WHERE r.parent_id = c.id AND (r.deleted = 0 OR EXISTS " +
  "(SELECT 1 FROM comments g WHERE g.parent_id = r.id AND g.deleted = 0))) AS reply_count " +
  "FROM comments c JOIN users u ON u.id = c.user_id ";

function unavailable() {
  return json({ error: "comments_unavailable" }, 503);
}

export async function handleCommentsGet(url, env, user) {
  try {
    const idParam = intOrNull(url.searchParams.get("id"), 2147483647);
    const parentParam = intOrNull(url.searchParams.get("parent"), 2147483647);

    // one comment (shared link)
    if (idParam) {
      const row = await env.DB.prepare(SELECT + "WHERE c.id = ?1").bind(idParam).first();
      if (!row) return json({ error: "not_found" }, 404);
      const t = await env.DB.prepare("SELECT tmdb_id, media_type, title FROM titles WHERE id = ?1").bind(row.title_id).first();
      const list = await shape(env, user, [row]);
      return json({
        comment: list[0],
        title: t ? { tmdb_id: t.tmdb_id, media_type: t.media_type, title: t.title } : null,
      });
    }

    // all replies of one comment
    if (parentParam) {
      const rs = await env.DB.prepare(
        SELECT +
          "WHERE c.parent_id = ?1 AND (c.deleted = 0 OR EXISTS (SELECT 1 FROM comments g WHERE g.parent_id = c.id AND g.deleted = 0)) " +
          "ORDER BY c.id ASC LIMIT 200"
      )
        .bind(parentParam)
        .all();
      const kids = await shape(env, user, rs.results || []);
      kids.forEach((k) => { k.replies = []; });
      return json({ comments: kids });
    }

    const ref = parseTitleRef(url.searchParams.get("tmdb_id"), url.searchParams.get("type"));
    if (!ref) return json({ error: "bad_title" }, 400);
    const season = intOrNull(url.searchParams.get("season"), 1000);
    const episode = intOrNull(url.searchParams.get("episode"), 10000);
    if (season === undefined || episode === undefined) return json({ error: "bad_request" }, 400);
    if ((season === null) !== (episode === null)) return json({ error: "bad_request" }, 400);

    const titleId = await findTitle(env, ref);
    if (!titleId) return json({ comments: [], count: 0, more: false });

    const sort = url.searchParams.get("sort");
    const offset = Math.max(0, Math.min(5000, parseInt(url.searchParams.get("offset") || "0", 10) || 0));

    let where = "WHERE c.title_id = ?1 AND c.season_number IS ?2 AND c.episode_number IS ?3 AND c.parent_id IS NULL ";
    // a deleted comment stays only while it still has replies
    where += "AND (c.deleted = 0 OR EXISTS (SELECT 1 FROM comments r WHERE r.parent_id = c.id AND r.deleted = 0)) ";
    const binds = [titleId, season, episode];
    if (sort === "friends") {
      where +=
        "AND (c.user_id = ?4 OR c.user_id IN (SELECT followed_id FROM follows WHERE follower_id = ?4 AND status = 'accepted')) ";
      binds.push(user.id);
    }
    let order = "ORDER BY c.id DESC";
    if (sort === "top") order = "ORDER BY likes DESC, c.id DESC";

    const rs = await env.DB.prepare(SELECT + where + order + " LIMIT " + (PAGE + 1) + " OFFSET " + offset)
      .bind(...binds)
      .all();
    let rows = rs.results || [];
    const more = rows.length > PAGE;
    if (more) rows = rows.slice(0, PAGE);

    const out = await shape(env, user, rows);

    // replies are not sent here: the app loads them when someone taps the comment icon
    for (const c of out) c.replies = [];

    const total = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM comments WHERE title_id = ?1 AND season_number IS ?2 AND episode_number IS ?3 AND deleted = 0"
    )
      .bind(titleId, season, episode)
      .first();

    return json({ comments: out, count: total ? total.n : 0, more: more });
  } catch (e) {
    return unavailable();
  }
}

export async function handleCommentCreate(request, env, user) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "bad_json" }, 400);
  }
  if (!body || typeof body !== "object") return json({ error: "bad_request" }, 400);
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text || text.length > MAX_BODY) return json({ error: "bad_body" }, 400);
  const spoiler = body.spoiler ? 1 : 0;

  try {
    let titleId, season, episode, parentId = null;

    if (body.parent_id !== undefined && body.parent_id !== null) {
      const pid = intOrNull(body.parent_id, 2147483647);
      if (!pid) return json({ error: "bad_request" }, 400);
      const p = await env.DB.prepare(
        "SELECT id, title_id, season_number, episode_number, parent_id, deleted FROM comments WHERE id = ?1"
      )
        .bind(pid)
        .first();
      if (!p || p.deleted) return json({ error: "not_found" }, 404);
      // a reply belongs to exactly the comment it answers (replies can have replies)
      parentId = p.id;
      titleId = p.title_id;
      season = p.season_number;
      episode = p.episode_number;
    } else {
      const ref = parseTitleRef(body.tmdb_id, body.type);
      if (!ref) return json({ error: "bad_title" }, 400);
      season = intOrNull(body.season, 1000);
      episode = intOrNull(body.episode, 10000);
      if (season === undefined || episode === undefined) return json({ error: "bad_request" }, 400);
      if ((season === null) !== (episode === null)) return json({ error: "bad_request" }, 400);
      if (season !== null && ref.mediaType !== "tv") return json({ error: "bad_request" }, 400);
      titleId = await findTitle(env, ref);
      if (!titleId) return json({ error: "title_not_found" }, 404);
    }

    // simple flood guard: at most 8 comments per minute per person
    const recent = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM comments WHERE user_id = ?1 AND created_at > datetime('now', '-1 minute')"
    )
      .bind(user.id)
      .first();
    if (recent && recent.n >= 8) return json({ error: "rate_limited" }, 429);

    const res = await env.DB.prepare(
      "INSERT INTO comments (user_id, title_id, season_number, episode_number, parent_id, body, spoiler) " +
        "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)"
    )
      .bind(user.id, titleId, season, episode, parentId, text, spoiler)
      .run();
    const id = res.meta && res.meta.last_row_id;
    const row = await env.DB.prepare(SELECT + "WHERE c.id = ?1").bind(id).first();
    const list = await shape(env, user, row ? [row] : []);
    const c = list[0] || null;
    if (c) c.replies = [];
    if (parentId && row) {
      const par = await env.DB.prepare("SELECT id, user_id FROM comments WHERE id = ?1").bind(parentId).first();
      await notifyReply(env, user, par, {
        id: id, title_id: titleId, season_number: season, episode_number: episode, body: text, spoiler: spoiler,
      });
    }
    return json({ comment: c });
  } catch (e) {
    return unavailable();
  }
}

export async function handleCommentEdit(request, env, user) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "bad_json" }, 400);
  }
  const id = body ? intOrNull(body.id, 2147483647) : null;
  const text = body && typeof body.body === "string" ? body.body.trim() : "";
  if (!id || !text || text.length > MAX_BODY) return json({ error: "bad_request" }, 400);
  try {
    const row = await env.DB.prepare("SELECT id, user_id, created_at, deleted FROM comments WHERE id = ?1").bind(id).first();
    if (!row || row.deleted) return json({ error: "not_found" }, 404);
    if (row.user_id !== user.id) return json({ error: "forbidden" }, 403);
    if (Date.now() - toMs(row.created_at) >= EDIT_WINDOW_MS) return json({ error: "edit_expired" }, 403);
    await env.DB.prepare("UPDATE comments SET body = ?1, spoiler = ?2, edited_at = datetime('now') WHERE id = ?3")
      .bind(text, body.spoiler ? 1 : 0, id)
      .run();
    const fresh = await env.DB.prepare(SELECT + "WHERE c.id = ?1").bind(id).first();
    const list = await shape(env, user, fresh ? [fresh] : []);
    return json({ comment: list[0] || null });
  } catch (e) {
    return unavailable();
  }
}

export async function handleCommentDelete(url, env, user) {
  const id = intOrNull(url.searchParams.get("id"), 2147483647);
  if (!id) return json({ error: "bad_request" }, 400);
  try {
    const row = await env.DB.prepare("SELECT id, user_id FROM comments WHERE id = ?1").bind(id).first();
    if (!row) return json({ ok: true });
    if (row.user_id !== user.id) return json({ error: "forbidden" }, 403);
    const kids = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM comments r WHERE r.parent_id = ?1 AND (r.deleted = 0 OR EXISTS " +
        "(SELECT 1 FROM comments g WHERE g.parent_id = r.id AND g.deleted = 0))"
    )
      .bind(id)
      .first();
    if (kids && kids.n > 0) {
      // keep the place so the replies under it stay readable
      await env.DB.prepare("UPDATE comments SET deleted = 1, body = '' WHERE id = ?1").bind(id).run();
    } else {
      await env.DB.prepare("DELETE FROM comment_likes WHERE comment_id = ?1").bind(id).run();
      await env.DB.prepare("DELETE FROM comment_reports WHERE comment_id = ?1").bind(id).run();
      try { await env.DB.prepare("DELETE FROM comment_notifs WHERE comment_id = ?1").bind(id).run(); } catch (e) { /* table not created yet */ }
      await env.DB.prepare("DELETE FROM comments WHERE parent_id = ?1").bind(id).run();
      await env.DB.prepare("DELETE FROM comments WHERE id = ?1").bind(id).run();
    }
    return json({ ok: true });
  } catch (e) {
    return unavailable();
  }
}

export async function handleCommentLike(request, env, user) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "bad_json" }, 400);
  }
  const id = body ? intOrNull(body.id, 2147483647) : null;
  if (!id) return json({ error: "bad_request" }, 400);
  try {
    const c = await env.DB.prepare(
      "SELECT id, user_id, title_id, season_number, episode_number, body, spoiler FROM comments WHERE id = ?1 AND deleted = 0"
    )
      .bind(id)
      .first();
    if (!c) return json({ error: "not_found" }, 404);
    if (body.liked) {
      await env.DB.prepare("INSERT OR IGNORE INTO comment_likes (comment_id, user_id) VALUES (?1, ?2)")
        .bind(id, user.id)
        .run();
      await notifyLike(env, user, c);
    } else {
      await env.DB.prepare("DELETE FROM comment_likes WHERE comment_id = ?1 AND user_id = ?2").bind(id, user.id).run();
      await removeLikeNotif(env, user, id);
    }
    const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM comment_likes WHERE comment_id = ?1").bind(id).first();
    return json({ liked: !!body.liked, likes: n ? n.n : 0 });
  } catch (e) {
    return unavailable();
  }
}

export async function handleCommentReport(request, env, user) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "bad_json" }, 400);
  }
  const id = body ? intOrNull(body.id, 2147483647) : null;
  if (!id) return json({ error: "bad_request" }, 400);
  try {
    const c = await env.DB.prepare("SELECT id, user_id FROM comments WHERE id = ?1").bind(id).first();
    if (!c) return json({ error: "not_found" }, 404);
    if (c.user_id === user.id) return json({ error: "own_comment" }, 400);
    await env.DB.prepare("INSERT OR IGNORE INTO comment_reports (comment_id, user_id) VALUES (?1, ?2)")
      .bind(id, user.id)
      .run();
    return json({ ok: true });
  } catch (e) {
    return unavailable();
  }
}

// Number of comments on a title (not episodes), for the "Comments" row. Returns null if the tables are missing.
export async function titleCommentCount(env, titleId) {
  try {
    const r = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM comments WHERE title_id = ?1 AND season_number IS NULL AND deleted = 0"
    )
      .bind(titleId)
      .first();
    return r ? r.n : 0;
  } catch (e) {
    return null;
  }
}

// ---------- share as a card (a ready-made Telegram message with an "Open" button) ----------
const SHARE_WORDS = {
  en: { open: "Open in Flicksy", spoiler: "⚠ Spoiler — open Flicksy to read it", on: "on" },
  fa: { open: "باز کردن در Flicksy", spoiler: "⚠ اسپویلر — برای خواندن Flicksy را باز کن", on: "درباره‌ی" },
};

function escHtml(s) {
  return String(s === undefined || s === null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function cutText(s, max) {
  const x = String(s || "");
  return x.length > max ? x.slice(0, max - 1) + "…" : x;
}

// POST /api/comment-share  { id, lang }  -> { ok, id }  (id goes to Telegram's shareMessage)
export async function handleCommentShare(request, env, user) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "bad_json" }, 400);
  }
  const id = body ? intOrNull(body.id, 2147483647) : null;
  if (!id) return json({ error: "bad_request" }, 400);
  const lang = body.lang === "fa" ? "fa" : "en";
  const w = SHARE_WORDS[lang];
  try {
    const row = await env.DB.prepare(SELECT + "WHERE c.id = ?1 AND c.deleted = 0").bind(id).first();
    if (!row) return json({ error: "not_found" }, 404);
    const t = await env.DB.prepare("SELECT title, title_fa FROM titles WHERE id = ?1").bind(row.title_id).first();
    let name = t ? (lang === "fa" && t.title_fa ? t.title_fa : t.title) : "";
    if (row.season_number !== null) name += " · S" + row.season_number + " E" + row.episode_number;
    const rtl = lang === "fa" ? "‏" : "";
    const lines = [];
    lines.push(rtl + "💬 <b>" + escHtml(cutText(name, 100)) + "</b>");
    // spoilers never leave the app in a message
    lines.push(rtl + (row.spoiler ? escHtml(w.spoiler) : "“" + escHtml(cutText(row.body, 600)) + "”"));
    lines.push(rtl + "— " + escHtml(cutText(row.display_name, 40)));
    const caption = lines.join("\n");
    const link = "https://t.me/flicksyrobot?startapp=comment-" + id;
    if (!env.BOT_TOKEN || !user.telegram_id) return json({ error: "share_failed" }, 502);
    const res = await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/savePreparedInlineMessage", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_id: user.telegram_id,
        result: {
          type: "article",
          id: "c" + id,
          title: cutText(name, 100),
          description: row.spoiler ? "Spoiler" : cutText(row.body, 100),
          input_message_content: { message_text: caption, parse_mode: "HTML" },
          reply_markup: { inline_keyboard: [[{ text: w.open, url: link }]] },
        },
        allow_user_chats: true,
        allow_bot_chats: false,
        allow_group_chats: true,
        allow_channel_chats: true,
      }),
    });
    const reply = await res.json();
    if (!reply || !reply.ok || !reply.result || !reply.result.id) return json({ error: "share_failed" }, 502);
    return json({ ok: true, id: reply.result.id });
  } catch (e) {
    return json({ error: "share_failed" }, 502);
  }
}
