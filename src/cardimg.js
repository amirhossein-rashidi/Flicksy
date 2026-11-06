// Share-card pictures for chats, stories and saving.
// The Mini App draws the card (profile, movie, recap, list) and uploads it here.
// Each upload gets a random, unguessable address: /card/<id>.jpg (Telegram stories and downloads need a public address).
// Old pictures are cleaned up automatically.
//   POST /api/card-upload   upload a picture
//   GET  /card/<id>.jpg     the picture (public)
//   POST /api/card-share    a ready-made chat message: the picture + text + an "Open" button

import { json } from "./util.js";

const PREFIX = "data:image/jpeg;base64,";
const MAX_BASE64_CHARS = 1400000; // about 1 MB of JPEG
const KEEP_PER_USER = 30;
const KEEP_DAYS = 3;

async function readBody(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : null;
  } catch (e) {
    return null;
  }
}

function randomId() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let id = "";
  for (let i = 0; i < bytes.length; i++) id += ("0" + bytes[i].toString(16)).slice(-2);
  return id;
}

// POST /api/card-upload  { image: "data:image/jpeg;base64,...." }  -> { ok, id, url }
export async function handleCardUpload(request, env, user) {
  const body = await readBody(request);
  if (!body) return json({ error: "bad_request" }, 400);
  if (typeof body.image !== "string" || !body.image.startsWith(PREFIX)) return json({ error: "bad_image" }, 400);

  const b64 = body.image.slice(PREFIX.length);
  if (b64.length < 100 || b64.length > MAX_BASE64_CHARS) return json({ error: "bad_image" }, 400);

  // A real JPEG starts with the bytes FF D8 FF.
  try {
    const head = atob(b64.slice(0, 8));
    if (head.charCodeAt(0) !== 0xff || head.charCodeAt(1) !== 0xd8 || head.charCodeAt(2) !== 0xff) {
      return json({ error: "bad_image" }, 400);
    }
  } catch (e) {
    return json({ error: "bad_image" }, 400);
  }

  const id = randomId();
  await env.DB.prepare("INSERT INTO card_images (id, user_id, data) VALUES (?1, ?2, ?3)").bind(id, user.id, b64).run();

  // tidy up: this person keeps their latest pictures only, and everything old goes
  try {
    await env.DB.prepare(
      "DELETE FROM card_images WHERE user_id = ?1 AND id NOT IN " +
        "(SELECT id FROM card_images WHERE user_id = ?1 ORDER BY created_at DESC, rowid DESC LIMIT " + KEEP_PER_USER + ")"
    )
      .bind(user.id)
      .run();
    await env.DB.prepare("DELETE FROM card_images WHERE created_at < datetime('now', '-" + KEEP_DAYS + " days')").run();
  } catch (e) {
    // cleaning up is best effort
  }

  const origin = new URL(request.url).origin;
  return json({ ok: true, id: id, url: origin + "/card/" + id + ".jpg" });
}

// GET /card/<id>.jpg  (public - Telegram has to be able to download it)
export async function handleCardGet(url, env) {
  const m = /^\/card\/([a-f0-9]{16})\.jpg$/.exec(url.pathname);
  if (!m) return json({ error: "not_found" }, 404);

  const row = await env.DB.prepare("SELECT data FROM card_images WHERE id = ?1").bind(m[1]).first();
  if (!row || !row.data) return json({ error: "not_found" }, 404);

  let bytes;
  try {
    const bin = atob(row.data);
    bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  } catch (e) {
    return json({ error: "not_found" }, 404);
  }

  return new Response(bytes, {
    status: 200,
    headers: {
      "content-type": "image/jpeg",
      "cache-control": "public, max-age=3600",
      "x-content-type-options": "nosniff",
    },
  });
}

const BOT_USERNAME = "flicksyrobot";

function cut(text, max) {
  const s = String(text || "");
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// the part after ?startapp= : like user-12345678 or list-abcd2345
function validParam(p) {
  return typeof p === "string" && /^[a-z]{1,12}-[A-Za-z0-9_-]{1,80}$/.test(p);
}

// POST /api/card-share  { card_id, param, caption, button }  -> { ok, id }  (id goes to Telegram.WebApp.shareMessage)
export async function handleCardShare(request, env, user) {
  const body = await readBody(request);
  if (!body) return json({ error: "bad_request" }, 400);
  if (typeof body.card_id !== "string" || !/^[a-f0-9]{16}$/.test(body.card_id)) return json({ error: "bad_request" }, 400);
  if (!validParam(body.param)) return json({ error: "bad_request" }, 400);

  // only a picture this person uploaded
  const row = await env.DB.prepare("SELECT id FROM card_images WHERE id = ?1 AND user_id = ?2").bind(body.card_id, user.id).first();
  if (!row) return json({ error: "not_found" }, 404);

  if (!env.BOT_TOKEN || !user.telegram_id) return json({ error: "share_failed" }, 502);

  const origin = new URL(request.url).origin;
  const photo = origin + "/card/" + body.card_id + ".jpg";
  const link = "https://t.me/" + BOT_USERNAME + "?startapp=" + body.param;
  const caption = cut(typeof body.caption === "string" ? body.caption : "", 900);
  const button = cut(typeof body.button === "string" && body.button ? body.button : "Open in Flicksy", 60);

  const result = {
    type: "photo",
    id: "c" + body.card_id,
    photo_url: photo,
    thumbnail_url: photo,
    caption: caption,
    reply_markup: { inline_keyboard: [[{ text: button, url: link }]] },
  };

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
