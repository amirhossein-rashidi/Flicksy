// Telegram login: checks the signed data Telegram gives the Mini App, and finds/creates the user.

const MAX_INITDATA_AGE_SECONDS = 24 * 60 * 60; // reject login data older than 24 hours

const USER_SELECT =
  "SELECT id, telegram_id, username, display_name, photo_url, is_private, public_id, inline_hidden, header, activity_visible, app_lang, created_at " +
  "FROM users WHERE telegram_id = ?1";

function hexToBytes(hex) {
  if (typeof hex !== "string" || !/^[0-9a-f]{64}$/i.test(hex)) return null;
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

// Returns { user } (the Telegram user object) if the data is genuine, otherwise { error }.
async function verifyInitData(initData, botToken, nowSeconds) {
  if (!initData || !botToken) return { error: "unauthorized" };

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  const hashBytes = hexToBytes(hash);
  if (!hashBytes) return { error: "unauthorized" };
  params.delete("hash");

  const pairs = [];
  for (const [key, value] of params.entries()) {
    pairs.push(key + "=" + value);
  }
  pairs.sort();
  const dataCheckString = pairs.join("\n");

  const enc = new TextEncoder();
  const k1 = await crypto.subtle.importKey(
    "raw",
    enc.encode("WebAppData"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const secret = await crypto.subtle.sign("HMAC", k1, enc.encode(botToken));
  const k2 = await crypto.subtle.importKey(
    "raw",
    secret,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const valid = await crypto.subtle.verify("HMAC", k2, hashBytes, enc.encode(dataCheckString));
  if (!valid) return { error: "unauthorized" };

  const authDate = parseInt(params.get("auth_date") || "0", 10);
  if (!authDate || nowSeconds - authDate > MAX_INITDATA_AGE_SECONDS) {
    return { error: "expired" };
  }

  let user;
  try {
    user = JSON.parse(params.get("user") || "null");
  } catch (e) {
    return { error: "unauthorized" };
  }
  if (!user || typeof user.id !== "number") return { error: "unauthorized" };

  return { user: user };
}

export async function authenticate(request, env) {
  if (!env.BOT_TOKEN) return { error: "server_misconfigured", status: 500 };

  const header = request.headers.get("Authorization") || "";
  if (!header.startsWith("tma ")) return { error: "unauthorized", status: 401 };
  const initData = header.slice(4);

  const result = await verifyInitData(initData, env.BOT_TOKEN, Math.floor(Date.now() / 1000));
  if (result.error) return { error: result.error, status: 401 };
  return { user: result.user };
}

export async function getOrCreateUser(env, tgUser, refresh) {
  let user = null;
  if (!refresh) user = await env.DB.prepare(USER_SELECT).bind(tgUser.id).first();
  if (!user) user = await upsertUser(env, tgUser);
  if (user && !user.public_id) user = await assignPublicId(env, user, tgUser.id);
  return user;
}

// Gives the user a random 8-digit Flicksy ID (used for @flicksyrobot <id> in any chat).
// It has nothing to do with the Telegram ID, so it can be shared freely.
async function assignPublicId(env, user, telegramId) {
  for (let i = 0; i < 6; i++) {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    const id = String(10000000 + (bytes[0] % 90000000));
    try {
      await env.DB.prepare("UPDATE users SET public_id = ?1 WHERE id = ?2 AND public_id IS NULL")
        .bind(id, user.id)
        .run();
      break;
    } catch (e) {
      // that number is already taken: try another one
    }
  }
  const fresh = await env.DB.prepare(USER_SELECT).bind(telegramId).first();
  return fresh || user;
}

async function upsertUser(env, tgUser) {
  const displayName =
    [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ").trim() ||
    tgUser.username ||
    "User";

  // Telegram usernames are not case-sensitive and can pass from one person to another.
  // If someone else in our table still holds this username, they lose it (they get it
  // back, with the right owner, the next time they open the app).
  const username =
    typeof tgUser.username === "string" && /^[A-Za-z0-9_]{3,32}$/.test(tgUser.username)
      ? tgUser.username
      : null;
  if (username) {
    await env.DB.prepare(
      "UPDATE users SET username = NULL WHERE lower(username) = lower(?1) AND telegram_id != ?2"
    )
      .bind(username, tgUser.id)
      .run();
  }

  await env.DB.prepare(
    "INSERT INTO users (telegram_id, username, display_name, photo_url, language_code, is_private, last_seen_at) " +
      "VALUES (?1, ?2, ?3, ?4, ?5, 1, datetime('now')) " +
      "ON CONFLICT(telegram_id) DO UPDATE SET " +
      "username = excluded.username, " +
      "display_name = excluded.display_name, " +
      "photo_url = excluded.photo_url, " +
      "language_code = excluded.language_code, " +
      "last_seen_at = datetime('now')"
  )
    .bind(tgUser.id, username, displayName, tgUser.photo_url || null, tgUser.language_code || null)
    .run();

  return await env.DB.prepare(USER_SELECT).bind(tgUser.id).first();
}
