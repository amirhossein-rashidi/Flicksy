// Rich share card for a list: a ready-made message (cover picture + title + first titles + an "Open" button).
// buildCard() is used both for the Share button (Telegram stores the message for us) and for inline mode.

import { json } from "./util.js";

const BOT_USERNAME = "flicksyrobot";
const IMG_BASE = "https://image.tmdb.org/t/p/w780";
export const SHOWN_TITLES = 5;

export const WORDS = {
  en: { titles: "titles", by: "by", open: "Open in Flicksy", more: "and {n} more", none: "No lists found. Tap to open Flicksy." },
  fa: { titles: "عنوان", by: "از", open: "باز کردن در Flicksy", more: "و {n} مورد دیگر", none: "لیستی پیدا نشد. برای باز کردن Flicksy بزن." },
  ar: { titles: "عنوان", by: "بواسطة", open: "افتح في Flicksy", more: "و{n} آخرين", none: "لم يتم العثور على قوائم. اضغط لفتح Flicksy." },
  tr: { titles: "başlık", by: "hazırlayan", open: "Flicksy’de aç", more: "ve {n} tane daha", none: "Liste bulunamadı. Flicksy’yi açmak için dokun." },
  ru: { titles: "тайтлов", by: "от", open: "Открыть во Flicksy", more: "и ещё {n}", none: "Списков не найдено. Нажми, чтобы открыть Flicksy." },
  es: { titles: "títulos", by: "de", open: "Abrir en Flicksy", more: "y {n} más", none: "No se encontraron listas. Toca para abrir Flicksy." },
  fr: { titles: "titres", by: "par", open: "Ouvrir dans Flicksy", more: "et {n} de plus", none: "Aucune liste trouvée. Touche pour ouvrir Flicksy." },
  de: { titles: "Titel", by: "von", open: "In Flicksy öffnen", more: "und {n} weitere", none: "Keine Listen gefunden. Tippe, um Flicksy zu öffnen." },
};

export function pickLang(code) {
  const c = String(code || "en").slice(0, 2).toLowerCase();
  return WORDS[c] ? c : "en";
}

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

// o: { list: { title, description, share_code, owner_name }, items: [first titles], total, lang, origin, stamp }
// stamp = version of the uploaded promo picture (or empty). Returns { result, caption } - result is an inline-query result.
export function buildCard(o) {
  const lang = WORDS[o.lang] ? o.lang : "en";
  const words = WORDS[lang];
  const list = o.list;
  const items = o.items || [];
  const total = o.total === undefined ? items.length : o.total;

  // Same rule as the app: Persian shows the Persian title (when there is one), every other language shows the English title.
  const useFa = lang === "fa";
  // Right-to-left languages: this invisible mark makes every line start on the right.
  const rtlMark = lang === "fa" || lang === "ar" ? "‏" : "";

  const lines = [];
  lines.push("🎬 <b>" + esc(cut(list.title, 120)) + "</b>");
  if (list.description) lines.push(esc(cut(list.description, 200)));
  lines.push(total + " " + words.titles + " · " + words.by + " " + esc(cut(list.owner_name, 40)));
  if (items.length) {
    lines.push("");
    items.slice(0, SHOWN_TITLES).forEach(function (it, i) {
      const name = useFa ? it.title_fa || it.title : it.title;
      lines.push(i + 1 + ". " + esc(cut(name, 60)) + (it.year ? " (" + it.year + ")" : ""));
    });
    if (total > SHOWN_TITLES) lines.push(words.more.replace("{n}", String(total - SHOWN_TITLES)));
  }
  const caption = cut(
    lines
      .map(function (line) { return line ? rtlMark + line : line; })
      .join("\n"),
    1000
  );

  const link = "https://t.me/" + BOT_USERNAME + "?startapp=list-" + list.share_code;
  const markup = { inline_keyboard: [[{ text: words.open, url: link }]] };

  // Cover: the promo picture the app drew (if any), otherwise the first backdrop (wide),
  // otherwise the first poster, otherwise a plain text card.
  let cover = null;
  if (o.stamp) cover = o.origin + "/share/" + list.share_code + ".jpg?v=" + o.stamp;
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
      description: cut(total + " " + words.titles, 100),
      input_message_content: { message_text: caption, parse_mode: "HTML" },
      reply_markup: markup,
    };
  }
  return { result: result, caption: caption };
}

// POST /api/list-share  { list_id: 12 } (your own list)  or  { code: "abcd2345" } (a shared list), plus optional lang
export async function handleListShare(request, env, user) {
  const body = await readBody(request);
  if (!body) return json({ error: "bad_request" }, 400);

  const lang = WORDS[body.lang] ? body.lang : "en";

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

  const img = await env.DB.prepare("SELECT updated_at FROM share_images WHERE list_id = ?1")
    .bind(list.id)
    .first();
  const stamp = img && img.updated_at ? String(img.updated_at).replace(/[^0-9]/g, "") : "";

  const card = buildCard({
    list: list,
    items: items,
    total: total,
    lang: lang,
    origin: new URL(request.url).origin,
    stamp: stamp,
  });

  if (!env.BOT_TOKEN || !user.telegram_id) return json({ error: "share_failed" }, 502);

  let reply;
  try {
    const res = await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/savePreparedInlineMessage", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_id: user.telegram_id,
        result: card.result,
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
