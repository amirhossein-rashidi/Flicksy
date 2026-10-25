// Rich share card for a list: asks Telegram to store a ready-made message
// (cover photo + title + first titles + an "Open" button) that the user can send to any chat.

import { json } from "./util.js";

const BOT_USERNAME = "flicksyrobot";
const IMG_BASE = "https://image.tmdb.org/t/p/w780";
const SHOWN_TITLES = 5;

const WORDS = {
  en: { titles: "titles", by: "by", open: "Open in Flicksy", more: "and {n} more" },
  fa: { titles: "عنوان", by: "از", open: "باز کردن در Flicksy", more: "و {n} مورد دیگر" },
  ar: { titles: "عنوان", by: "بواسطة", open: "افتح في Flicksy", more: "و{n} آخرين" },
  tr: { titles: "başlık", by: "hazırlayan", open: "Flicksy’de aç", more: "ve {n} tane daha" },
  ru: { titles: "тайтлов", by: "от", open: "Открыть во Flicksy", more: "и ещё {n}" },
  es: { titles: "títulos", by: "de", open: "Abrir en Flicksy", more: "y {n} más" },
  fr: { titles: "titres", by: "par", open: "Ouvrir dans Flicksy", more: "et {n} de plus" },
  de: { titles: "Titel", by: "von", open: "In Flicksy öffnen", more: "und {n} weitere" },
};

function esc(text) {
  return String(text === undefined || text === null ? "" : text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function cut(text, max) {
  const s = String(text || "");
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

async function readBody(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : null;
  } catch (e) {
    return null;
  }
}

// POST /api/list-share  { list_id: 12 } (your own list)  or  { code: "abcd2345" } (a shared list), plus optional lang
export async function handleListShare(request, env, user) {
  const body = await readBody(request);
  if (!body) return json({ error: "bad_request" }, 400);

  const words = WORDS[body.lang] || WORDS.en;

  let list = null;
  if (Number.isInteger(body.list_id) && body.list_id > 0) {
    list = await env.DB.prepare(
      "SELECT l.*, u.display_name AS owner_name FROM lists l JOIN users u ON u.id = l.owner_id " +
        "WHERE l.id = ?1 AND l.owner_id = ?2"
    )
      .bind(body.list_id, user.id)
      .first();
  } else if (typeof body.code === "string" && /^[a-z0-9]{4,16}$/.test(body.code)) {
    list = await env.DB.prepare(
      "SELECT l.*, u.display_name AS owner_name FROM lists l JOIN users u ON u.id = l.owner_id WHERE l.share_code = ?1"
    )
      .bind(body.code)
      .first();
  } else {
    return json({ error: "bad_request" }, 400);
  }

  const isOwner = !!list && list.owner_id === user.id;
  if (!list || (list.visibility === "private" && !isOwner)) return json({ error: "not_found" }, 404);
  if (list.visibility === "private") return json({ error: "private" }, 403);

  const rows = await env.DB.prepare(
    "SELECT t.title, t.title_fa, t.year, t.poster_path, t.backdrop_path " +
      "FROM list_items li JOIN titles t ON t.id = li.title_id " +
      "WHERE li.list_id = ?1 ORDER BY li.position, li.id LIMIT 60"
  )
    .bind(list.id)
    .all();
  const items = rows.results || [];

  const countRow = await env.DB.prepare("SELECT COUNT(*) AS n FROM list_items WHERE list_id = ?1")
    .bind(list.id)
    .first();
  const total = countRow ? countRow.n : items.length;

  // Caption (Telegram allows 1024 characters)
  const lines = [];
  lines.push("🎬 <b>" + esc(cut(list.title, 120)) + "</b>");
  if (list.description) lines.push(esc(cut(list.description, 200)));
  lines.push(total + " " + words.titles + " · " + words.by + " " + esc(cut(list.owner_name, 40)));
  if (items.length) {
    lines.push("");
    items.slice(0, SHOWN_TITLES).forEach(function (it, i) {
      const name = it.title_fa || it.title;
      lines.push(i + 1 + ". " + esc(cut(name, 60)) + (it.year ? " (" + it.year + ")" : ""));
    });
    if (total > SHOWN_TITLES) lines.push(words.more.replace("{n}", String(total - SHOWN_TITLES)));
  }
  const caption = cut(lines.join("\n"), 1000);

  const link = "https://t.me/" + BOT_USERNAME + "?startapp=l_" + list.share_code;
  const markup = { inline_keyboard: [[{ text: words.open, url: link }]] };

  // Cover: the promo picture the app drew (if any), otherwise the first backdrop (wide),
  // otherwise the first poster, otherwise a plain text card.
  let cover = null;
  const img = await env.DB.prepare("SELECT updated_at FROM share_images WHERE list_id = ?1")
    .bind(list.id)
    .first();
  if (img && img.updated_at) {
    const stamp = String(img.updated_at).replace(/[^0-9]/g, "");
    cover = new URL(request.url).origin + "/share/" + list.share_code + ".jpg?v=" + stamp;
  }
  if (!cover) {
    for (const it of items) {
      if (it.backdrop_path) { cover = IMG_BASE + it.backdrop_path; break; }
    }
  }
  if (!cover) {
    for (const it of items) {
      if (it.poster_path) { cover = IMG_BASE + it.poster_path; break; }
    }
  }

  let result;
  if (cover) {
    result = {
      type: "photo",
      id: "l" + list.share_code,
      photo_url: cover,
      thumbnail_url: cover,
      caption: caption,
      parse_mode: "HTML",
      reply_markup: markup,
    };
  } else {
    result = {
      type: "article",
      id: "l" + list.share_code,
      title: cut(list.title, 100),
      input_message_content: { message_text: caption, parse_mode: "HTML" },
      reply_markup: markup,
    };
  }

  if (!env.BOT_TOKEN || !user.telegram_id) return json({ error: "share_failed" }, 502);

  let reply;
  try {
    const res = await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/savePreparedInlineMessage", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_id: user.telegram_id,
        result: result,
        allow_user_chats: true,
        allow_bot_chats: false,
        allow_group_chats: true,
        allow_channel_chats: true,
      }),
    });
    reply = await res.json();
  } catch (e) {
    return json({ error: "share_failed" }, 502);
  }

  if (!reply || !reply.ok || !reply.result || !reply.result.id) return json({ error: "share_failed" }, 502);
  return json({ ok: true, id: reply.result.id });
}
