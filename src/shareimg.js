// Share-card pictures: the Mini App draws a promo picture for a list and uploads it here;
// Telegram then fetches it from /share/<code>.jpg when the card is sent.

import { json } from "./util.js";

const MAX_BASE64_CHARS = 800000; // about 600 KB of JPEG
const PREFIX = "data:image/jpeg;base64,";

async function readBody(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : null;
  } catch (e) {
    return null;
  }
}

// POST /api/list-share-image  { code: "abcd2345", image: "data:image/jpeg;base64,...." }  (owner only)
export async function handleShareImageSet(request, env, user) {
  const body = await readBody(request);
  if (!body) return json({ error: "bad_request" }, 400);
  if (typeof body.code !== "string" || !/^[a-z0-9]{4,16}$/.test(body.code)) return json({ error: "bad_request" }, 400);
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

  const list = await env.DB.prepare("SELECT id FROM lists WHERE share_code = ?1 AND owner_id = ?2")
    .bind(body.code, user.id)
    .first();
  if (!list) return json({ error: "not_found" }, 404);

  await env.DB.prepare(
    "INSERT INTO share_images (list_id, data, updated_at) VALUES (?1, ?2, datetime('now')) " +
      "ON CONFLICT(list_id) DO UPDATE SET data = excluded.data, updated_at = datetime('now')"
  )
    .bind(list.id, b64)
    .run();

  return json({ ok: true });
}

// GET /share/<code>.jpg  (public - Telegram has to be able to download it; private lists are never served)
export async function handleShareImageGet(url, env) {
  const m = /^\/share\/([a-z0-9]{4,16})\.jpg$/.exec(url.pathname);
  if (!m) return json({ error: "not_found" }, 404);

  const row = await env.DB.prepare(
    "SELECT si.data AS data FROM share_images si JOIN lists l ON l.id = si.list_id " +
      "WHERE l.share_code = ?1 AND l.visibility != 'private'"
  )
    .bind(m[1])
    .first();
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
      "cache-control": "public, max-age=300",
      "x-content-type-options": "nosniff",
    },
  });
}
