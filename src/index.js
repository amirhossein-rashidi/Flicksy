// Flicksy backend (Cloudflare Worker)
// Step 8: Telegram login + title search

const MAX_INITDATA_AGE_SECONDS = 24 * 60 * 60; // reject login data older than 24 hours
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w185";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === "/api/health") {
        return await handleHealth(env);
      }

      if (path === "/api/me") {
        const auth = await authenticate(request, env);
        if (auth.error) return json({ error: auth.error }, auth.status);
        const user = await upsertUser(env, auth.user);
        return json({ user: user });
      }

      if (path === "/api/search") {
        const auth = await authenticate(request, env);
        if (auth.error) return json({ error: auth.error }, auth.status);
        return await handleSearch(url, env);
      }

      if (path.startsWith("/api/")) {
        return json({ error: "not_found" }, 404);
      }

      return env.ASSETS.fetch(request);
    } catch (e) {
      return json({ error: "server_error" }, 500);
    }
  },
};

// ---------- helpers ----------

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

async function handleHealth(env) {
  let db = "not-connected";
  try {
    const row = await env.DB.prepare("SELECT 1 AS ok").first();
    db = row && row.ok === 1 ? "ok" : "error";
  } catch (e) {
    db = "error";
  }
  return json({
    app: "flicksy",
    status: "ok",
    db: db,
    bot_token: env.BOT_TOKEN ? "set" : "missing",
    tmdb_token: env.TMDB_TOKEN ? "set" : "missing",
    time: new Date().toISOString(),
  });
}

// ---------- Telegram authentication ----------

function hexToBytes(hex) {
  if (typeof hex !== "string" || !/^[0-9a-f]{64}$/i.test(hex)) return null;
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

// Checks the signature of the data Telegram gives the Mini App (initData).
// Returns the Telegram user object if valid, otherwise an error.
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

async function authenticate(request, env) {
  if (!env.BOT_TOKEN) return { error: "server_misconfigured", status: 500 };

  const header = request.headers.get("Authorization") || "";
  if (!header.startsWith("tma ")) return { error: "unauthorized", status: 401 };
  const initData = header.slice(4);

  const result = await verifyInitData(initData, env.BOT_TOKEN, Math.floor(Date.now() / 1000));
  if (result.error) return { error: result.error, status: 401 };
  return { user: result.user };
}

async function upsertUser(env, tgUser) {
  const displayName =
    [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ").trim() ||
    tgUser.username ||
    "User";

  await env.DB.prepare(
    "INSERT INTO users (telegram_id, display_name, photo_url, language_code, last_seen_at) " +
      "VALUES (?1, ?2, ?3, ?4, datetime('now')) " +
      "ON CONFLICT(telegram_id) DO UPDATE SET " +
      "display_name = excluded.display_name, " +
      "photo_url = excluded.photo_url, " +
      "language_code = excluded.language_code, " +
      "last_seen_at = datetime('now')"
  )
    .bind(tgUser.id, displayName, tgUser.photo_url || null, tgUser.language_code || null)
    .run();

  const row = await env.DB.prepare(
    "SELECT id, telegram_id, username, display_name, photo_url, is_private, created_at " +
      "FROM users WHERE telegram_id = ?1"
  )
    .bind(tgUser.id)
    .first();

  return row;
}

// ---------- Search (TMDB) ----------

async function handleSearch(url, env) {
  if (!env.TMDB_TOKEN) return json({ error: "server_misconfigured" }, 500);

  const q = (url.searchParams.get("q") || "").trim();
  if (q.length < 2) return json({ results: [] });
  if (q.length > 100) return json({ error: "query_too_long" }, 400);

  const tmdbUrl =
    TMDB_BASE +
    "/search/multi?include_adult=false&language=fa-IR&page=1&query=" +
    encodeURIComponent(q);

  const res = await fetch(tmdbUrl, {
    headers: {
      Authorization: "Bearer " + env.TMDB_TOKEN,
      Accept: "application/json",
    },
    cf: { cacheTtl: 3600, cacheEverything: true },
  });

  if (!res.ok) return json({ error: "search_unavailable" }, 502);

  const data = await res.json();
  return json({ results: mapSearchResults(data) });
}

function mapSearchResults(data) {
  const list = Array.isArray(data && data.results) ? data.results : [];
  return list
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .slice(0, 20)
    .map((r) => {
      const date = r.release_date || r.first_air_date || "";
      return {
        tmdb_id: r.id,
        media_type: r.media_type,
        title: r.title || r.name || "",
        original_title: r.original_title || r.original_name || "",
        year: date ? parseInt(date.slice(0, 4), 10) || null : null,
        poster: r.poster_path ? TMDB_IMG + r.poster_path : null,
        overview: (r.overview || "").slice(0, 240),
        rating: typeof r.vote_average === "number" ? Math.round(r.vote_average * 10) / 10 : null,
      };
    });
}
