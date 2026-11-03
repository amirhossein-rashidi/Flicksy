// Notifications for comments (replies, likes) and the settings for them.
//
//   GET /api/notif-prefs   -> { reply_app, reply_bot, like_app, like_bot, follow_app, follow_bot, list_follow_app, list_follow_bot, bot_all }  (booleans)
//   PUT /api/notif-prefs   -> same keys, send any of them
//
// "app" = the bell on Home, "bot" = a message in the bot chat. Tables come from migration 11 (db/schema.sql);
// before it is run everything here quietly does nothing.

import { json } from "./util.js";

const BOT_USERNAME = "flicksyrobot";
const DEFAULTS = { reply_app: 1, reply_bot: 1, like_app: 1, like_bot: 0, follow_app: 1, follow_bot: 1, list_follow_app: 1, list_follow_bot: 1, bot_all: 1 };
const KEYS = Object.keys(DEFAULTS);

const WORDS = {
  en: {
    reply: "💬 <b>{name}</b> replied to your comment on <b>{title}</b>",
    like: "♥ <b>{name}</b> liked your comment on <b>{title}</b>",
    follow: "👤 <b>{name}</b> started following you",
    request: "👤 <b>{name}</b> wants to follow you",
    list_follow: "📋 <b>{name}</b> followed your list <b>{title}</b>",
    spoiler: "⚠ Spoiler — open Flicksy to read it",
    open: "Open in Flicksy",
    hint: "⚙ You can turn these messages off in Flicksy → Settings → Notifications.",
  },
  fa: {
    reply: "💬 <b>{name}</b> به نظرت درباره‌ی <b>{title}</b> پاسخ داد",
    like: "♥ <b>{name}</b> نظرت درباره‌ی <b>{title}</b> را پسندید",
    follow: "👤 <b>{name}</b> شروع به دنبال‌کردنت کرد",
    request: "👤 <b>{name}</b> می‌خواهد تو را دنبال کند",
    list_follow: "📋 <b>{name}</b> لیست <b>{title}</b> تو را دنبال کرد",
    spoiler: "⚠ اسپویلر — برای خواندن Flicksy را باز کن",
    open: "باز کردن در Flicksy",
    hint: "⚙ این پیام‌ها را می‌توانی در Flicksy ← تنظیمات ← اعلان‌ها خاموش کنی.",
  },
};

function esc(s) {
  return String(s === undefined || s === null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function cut(s, max) {
  const x = String(s || "");
  return x.length > max ? x.slice(0, max - 1) + "…" : x;
}

export async function getPrefs(env, userId) {
  const out = Object.assign({}, DEFAULTS);
  try {
    const row = await env.DB.prepare("SELECT * FROM notif_prefs WHERE user_id = ?1").bind(userId).first();
    if (row) KEYS.forEach((k) => { if (row[k] !== null && row[k] !== undefined) out[k] = row[k]; });
  } catch (e) {
    // table not created yet: defaults
  }
  return out;
}

export async function handleNotifPrefsGet(url, env, user) {
  const p = await getPrefs(env, user.id);
  const out = {};
  KEYS.forEach((k) => { out[k] = p[k] === 1 || p[k] === true; });
  return json(out);
}

export async function handleNotifPrefsSet(request, env, user) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "bad_json" }, 400);
  }
  if (!body || typeof body !== "object") return json({ error: "bad_request" }, 400);
  const sets = [];
  const binds = [];
  for (const k of KEYS) {
    if (body[k] === undefined) continue;
    if (typeof body[k] !== "boolean") return json({ error: "bad_request" }, 400);
    binds.push(body[k] ? 1 : 0);
    sets.push(k + " = ?" + (binds.length + 1));
  }
  if (!sets.length) return json({ error: "bad_request" }, 400);
  try {
    await env.DB.prepare("INSERT OR IGNORE INTO notif_prefs (user_id) VALUES (?1)").bind(user.id).run();
    await env.DB.prepare("UPDATE notif_prefs SET " + sets.join(", ") + " WHERE user_id = ?1").bind(user.id, ...binds).run();
  } catch (e) {
    return json({ error: "notifs_unavailable" }, 503);
  }
  return handleNotifPrefsGet(null, env, user);
}

// A message in the bot chat of the person (only works if they started the bot before; errors are ignored).
async function sendBot(env, who, kind, vars, link) {
  try {
    if (!env.BOT_TOKEN || !who || !who.telegram_id) return;
    const lang = String(who.app_lang || who.language_code || "en").slice(0, 2) === "fa" ? "fa" : "en";
    const w = WORDS[lang];
    const rtl = lang === "fa" ? "‏" : "";
    const lines = [rtl + w[kind].replace("{name}", esc(cut(vars.name, 40))).replace("{title}", esc(cut(vars.title, 80)))];
    if (vars.snippet) lines.push(rtl + "“" + esc(cut(vars.snippet, 200)) + "”");
    else if (vars.spoiler) lines.push(rtl + w.spoiler);
    lines.push("");
    lines.push(rtl + "<i>" + esc(w.hint) + "</i>");
    await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/sendMessage", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: who.telegram_id,
        text: lines.join("\n"),
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: { inline_keyboard: [[{ text: w.open, url: link }]] },
      }),
    });
  } catch (e) {
    // never let a failed message break the action that caused it
  }
}

async function recipient(env, userId) {
  return await env.DB.prepare("SELECT id, telegram_id, language_code, app_lang FROM users WHERE id = ?1").bind(userId).first();
}

async function titleName(env, c) {
  let name = "";
  try {
    const t = await env.DB.prepare("SELECT title FROM titles WHERE id = ?1").bind(c.title_id).first();
    name = t ? t.title : "";
    if (c.season_number !== null && c.season_number !== undefined) name += " · S" + c.season_number + " E" + c.episode_number;
  } catch (e) {
    // ignore
  }
  return name;
}

// someone answered a comment. parent: { id, user_id }, comment: the new comment row
export async function notifyReply(env, actor, parent, comment) {
  try {
    if (!parent || parent.user_id === actor.id) return;
    await env.DB.prepare("INSERT OR IGNORE INTO comment_notifs (user_id, actor_id, kind, comment_id) VALUES (?1, ?2, 'reply', ?3)")
      .bind(parent.user_id, actor.id, comment.id)
      .run();
    const prefs = await getPrefs(env, parent.user_id);
    if (prefs.reply_bot !== 1 || prefs.bot_all !== 1) return;
    const who = await recipient(env, parent.user_id);
    await sendBot(
      env,
      who,
      "reply",
      { name: actor.display_name, title: await titleName(env, comment), snippet: comment.spoiler ? "" : comment.body, spoiler: !!comment.spoiler },
      "https://t.me/" + BOT_USERNAME + "?startapp=comment-" + comment.id
    );
  } catch (e) {
    // notifications are optional
  }
}

// someone liked a comment. comment: { id, user_id, title_id, season_number, episode_number, body, spoiler }
export async function notifyLike(env, actor, comment) {
  try {
    if (!comment || comment.user_id === actor.id) return;
    const res = await env.DB.prepare("INSERT OR IGNORE INTO comment_notifs (user_id, actor_id, kind, comment_id) VALUES (?1, ?2, 'like', ?3)")
      .bind(comment.user_id, actor.id, comment.id)
      .run();
    if (!res.meta || !res.meta.changes) return;
    const prefs = await getPrefs(env, comment.user_id);
    if (prefs.like_bot !== 1 || prefs.bot_all !== 1) return;
    const who = await recipient(env, comment.user_id);
    await sendBot(
      env,
      who,
      "like",
      { name: actor.display_name, title: await titleName(env, comment), snippet: comment.spoiler ? "" : comment.body, spoiler: !!comment.spoiler },
      "https://t.me/" + BOT_USERNAME + "?startapp=comment-" + comment.id
    );
  } catch (e) {
    // ignore
  }
}

export async function removeLikeNotif(env, actor, commentId) {
  try {
    await env.DB.prepare("DELETE FROM comment_notifs WHERE comment_id = ?1 AND actor_id = ?2 AND kind = 'like'")
      .bind(commentId, actor.id)
      .run();
  } catch (e) {
    // ignore
  }
}

// someone followed you (or asked to). Only the bot message; the bell already knows about follows.
export async function notifyFollowBot(env, actor, targetUserId, isRequest) {
  try {
    const prefs = await getPrefs(env, targetUserId);
    if (prefs.follow_bot !== 1 || prefs.bot_all !== 1) return;
    const who = await recipient(env, targetUserId);
    await sendBot(env, who, isRequest ? "request" : "follow", { name: actor.display_name }, "https://t.me/" + BOT_USERNAME + "?startapp=user-" + actor.public_id);
  } catch (e) {
    // ignore
  }
}

// someone followed your list. list: { id, title, share_code, owner_id }. Needs migration 12 (list_follow_notifs).
export async function notifyListFollow(env, actor, list) {
  try {
    if (!list || list.owner_id === actor.id) return;
    const res = await env.DB.prepare("INSERT OR IGNORE INTO list_follow_notifs (user_id, actor_id, list_id) VALUES (?1, ?2, ?3)")
      .bind(list.owner_id, actor.id, list.id)
      .run();
    // follow, unfollow, follow again: only the first time sends a message
    if (!res.meta || !res.meta.changes) return;
    const prefs = await getPrefs(env, list.owner_id);
    if (prefs.list_follow_bot !== 1 || prefs.bot_all !== 1) return;
    const who = await recipient(env, list.owner_id);
    await sendBot(env, who, "list_follow", { name: actor.display_name, title: list.title }, "https://t.me/" + BOT_USERNAME + "?startapp=list-" + list.share_code);
  } catch (e) {
    // ignore
  }
}

// bell rows "X followed your list": only while X still follows it and the list is public
async function listFollowBellItems(env, userId, prefs) {
  const items = [];
  let unread = 0;
  if (prefs.list_follow_app !== 1) return { items: items, unread: unread };
  try {
    const rs = await env.DB.prepare(
      "SELECT n.is_read, n.created_at AS at, u.public_id, u.display_name, u.username, u.photo_url, l.title, l.share_code " +
        "FROM list_follow_notifs n JOIN users u ON u.id = n.actor_id JOIN lists l ON l.id = n.list_id " +
        "JOIN list_follows lf ON lf.list_id = n.list_id AND lf.user_id = n.actor_id " +
        "WHERE n.user_id = ?1 AND l.visibility = 'public' ORDER BY n.id DESC LIMIT 30"
    )
      .bind(userId)
      .all();
    (rs.results || []).forEach((r) => {
      items.push({
        type: "l_follow",
        read: r.is_read === 1,
        at: r.at,
        list: { title: r.title, share_code: r.share_code },
        person: { public_id: r.public_id, display_name: r.display_name, username: r.username || null, photo_url: r.photo_url || null },
      });
      if (r.is_read !== 1) unread += 1;
    });
  } catch (e) {
    // tables not created yet
  }
  return { items: items, unread: unread };
}

// What the bell shows for comments: replies (one row each) and likes (one row per comment: "X and 3 others").
// Returns { items, unread }. Empty when the tables don't exist yet.
export async function commentBellItems(env, userId, prefs) {
  const items = [];
  let unread = 0;
  try {
    if (prefs.reply_app === 1) {
      const rs = await env.DB.prepare(
        "SELECT cn.is_read, cn.created_at AS at, cn.comment_id, u.public_id, u.display_name, u.username, u.photo_url, " +
          "c.body, c.spoiler, t.title FROM comment_notifs cn JOIN users u ON u.id = cn.actor_id " +
          "JOIN comments c ON c.id = cn.comment_id LEFT JOIN titles t ON t.id = c.title_id " +
          "WHERE cn.user_id = ?1 AND cn.kind = 'reply' AND c.deleted = 0 ORDER BY cn.id DESC LIMIT 30"
      )
        .bind(userId)
        .all();
      (rs.results || []).forEach((r) => {
        items.push({
          type: "c_reply",
          read: r.is_read === 1,
          at: r.at,
          comment_id: r.comment_id,
          title: r.title || "",
          spoiler: !!r.spoiler,
          snippet: r.spoiler ? null : cut(r.body, 90),
          others: 0,
          person: { public_id: r.public_id, display_name: r.display_name, username: r.username || null, photo_url: r.photo_url || null },
        });
        if (r.is_read !== 1) unread += 1;
      });
    }
    if (prefs.like_app === 1) {
      const ls = await env.DB.prepare(
        "SELECT cn.comment_id, COUNT(*) AS n, MAX(cn.id) AS last_id, MIN(cn.is_read) AS is_read, MAX(cn.created_at) AS at, " +
          "c.body, c.spoiler, t.title FROM comment_notifs cn JOIN comments c ON c.id = cn.comment_id " +
          "LEFT JOIN titles t ON t.id = c.title_id WHERE cn.user_id = ?1 AND cn.kind = 'like' AND c.deleted = 0 " +
          "GROUP BY cn.comment_id ORDER BY last_id DESC LIMIT 20"
      )
        .bind(userId)
        .all();
      for (const r of ls.results || []) {
        const a = await env.DB.prepare(
          "SELECT u.public_id, u.display_name, u.username, u.photo_url FROM comment_notifs cn JOIN users u ON u.id = cn.actor_id WHERE cn.id = ?1"
        )
          .bind(r.last_id)
          .first();
        if (!a) continue;
        items.push({
          type: "c_like",
          read: r.is_read === 1,
          at: r.at,
          comment_id: r.comment_id,
          title: r.title || "",
          spoiler: !!r.spoiler,
          snippet: r.spoiler ? null : cut(r.body, 90),
          others: Math.max(0, r.n - 1),
          person: { public_id: a.public_id, display_name: a.display_name, username: a.username || null, photo_url: a.photo_url || null },
        });
        if (r.is_read !== 1) unread += 1;
      }
    }
  } catch (e) {
    return { items: [], unread: 0 };
  }
  const lf = await listFollowBellItems(env, userId, prefs);
  lf.items.forEach((x) => items.push(x));
  unread += lf.unread;
  return { items: items, unread: unread };
}

export async function markCommentNotifsRead(env, userId) {
  try {
    await env.DB.prepare("UPDATE comment_notifs SET is_read = 1 WHERE user_id = ?1 AND is_read = 0").bind(userId).run();
  } catch (e) {
    // ignore
  }
  try {
    await env.DB.prepare("UPDATE list_follow_notifs SET is_read = 1 WHERE user_id = ?1 AND is_read = 0").bind(userId).run();
  } catch (e) {
    // table not created yet
  }
}
