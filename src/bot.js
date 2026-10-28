// The bot side: Telegram sends us "inline queries" (someone typed @flicksyrobot in a chat)
// and we answer with the person's lists as ready-to-send cards.

import { json } from "./util.js";
import { buildCard, pickLang, WORDS } from "./share.js";
import { handleLinkMessage, handleLinkCallback, inlineTitleResults, findUser, langFor } from "./botlinks.js";

const MAX_RESULTS = 15;

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map(function (b) { return b.toString(16).padStart(2, "0"); })
    .join("");
}

// A secret only Telegram and we know (made from the bot token, nothing new to store).
async function webhookSecret(env) {
  return await sha256Hex("flicksy-webhook:" + env.BOT_TOKEN);
}

async function tg(env, method, payload) {
  const res = await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/" + method, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  return await res.json();
}

// GET /bot/setup - tells Telegram where to send inline queries. Safe to open any number of times.
export async function handleBotSetup(request, env) {
  if (!env.BOT_TOKEN) return json({ ok: false, error: "no_bot_token" }, 500);
  const origin = new URL(request.url).origin;
  let set, info;
  try {
    set = await tg(env, "setWebhook", {
      url: origin + "/bot/webhook",
      secret_token: await webhookSecret(env),
      allowed_updates: ["inline_query", "message", "callback_query"],
    });
    info = await tg(env, "getWebhookInfo", {});
  } catch (e) {
    return json({ ok: false, error: "telegram_unreachable" }, 502);
  }
  const w = (info && info.result) || {};
  return json({
    ok: !!(set && set.ok),
    telegram_says: set && set.description,
    webhook_url: w.url || null,
    pending_updates: w.pending_update_count,
    last_error: w.last_error_message || null,
  });
}

function likeEscape(text) {
  return text.replace(/[\\%_]/g, function (c) { return "\\" + c; });
}

async function loadCards(env, ownerId, onlyPublic, filter, lang, origin) {
  let sql =
    "SELECT l.id, l.title, l.description, l.visibility, l.share_code, u.display_name AS owner_name, " +
    "(SELECT COUNT(*) FROM list_items li WHERE li.list_id = l.id) AS n, si.updated_at AS img_at " +
    "FROM lists l JOIN users u ON u.id = l.owner_id LEFT JOIN share_images si ON si.list_id = l.id " +
    "WHERE l.owner_id = ?1 AND " +
    (onlyPublic ? "l.visibility = 'public'" : "l.visibility != 'private'");
  const binds = [ownerId];
  if (filter) {
    sql += " AND l.title LIKE ?2 ESCAPE '\\'";
    binds.push("%" + likeEscape(filter) + "%");
  }
  sql += " ORDER BY l.updated_at DESC, l.id DESC LIMIT " + MAX_RESULTS;

  const lists = ((await env.DB.prepare(sql).bind(...binds).all()).results) || [];
  if (!lists.length) return [];

  const ids = lists.map(function (l) { return l.id; });
  const marks = ids.map(function (_, i) { return "?" + (i + 1); }).join(",");
  const itemRows =
    ((
      await env.DB.prepare(
        "SELECT * FROM (SELECT li.list_id AS list_id, t.title, t.title_fa, t.year, t.poster_path, t.backdrop_path, " +
          "ROW_NUMBER() OVER (PARTITION BY li.list_id ORDER BY li.position, li.id) AS rn " +
          "FROM list_items li JOIN titles t ON t.id = li.title_id WHERE li.list_id IN (" + marks + ")) WHERE rn <= 5 " +
          "ORDER BY list_id, rn"
      )
        .bind(...ids)
        .all()
    ).results) || [];

  const byList = {};
  itemRows.forEach(function (r) {
    (byList[r.list_id] = byList[r.list_id] || []).push(r);
  });

  return lists.map(function (l) {
    return buildCard({
      list: l,
      items: byList[l.id] || [],
      total: l.n,
      lang: lang,
      origin: origin,
      stamp: l.img_at ? String(l.img_at).replace(/[^0-9]/g, "") : "",
    }).result;
  });
}

async function answerInline(env, iq, origin) {
  const me = iq.from && typeof iq.from.id === "number" ? await findUser(env, iq.from.id) : null;
  const lang = langFor(me, iq.from);
  const words = WORDS[lang];
  const q = String(iq.query || "").trim().slice(0, 64);

  let results = [];
  let personal = true;

  if (/^\d{8}$/.test(q)) {
    // someone else's Public lists, found by their Flicksy ID
    personal = false;
    const owner = await env.DB.prepare(
      "SELECT id FROM users WHERE public_id = ?1 AND inline_hidden = 0 AND is_private = 0"
    )
      .bind(q)
      .first();
    if (owner) results = await loadCards(env, owner.id, true, "", lang, origin);
  } else {
    // words: movie / series info cards first, then your own lists (all except private ones) with that word in the title
    if (q.length >= 2) {
      try {
        results = await inlineTitleResults(env, me, q, lang, 6);
      } catch (e) {
        results = [];
      }
    }
    if (me) {
      const lists = await loadCards(env, me.id, false, q, lang, origin);
      results = results.concat(lists.slice(0, MAX_RESULTS));
    }
  }

  const payload = {
    inline_query_id: iq.id,
    results: results,
    cache_time: personal ? 0 : 20,
    is_personal: personal,
    button: { text: results.length ? words.open : words.none, web_app: { url: origin + "/" } },
  };
  await tg(env, "answerInlineQuery", payload);
}

// POST /bot/webhook - Telegram calls this. We always answer 200 so Telegram never retries in a loop.
export async function handleBotWebhook(request, env) {
  if (!env.BOT_TOKEN) return json({ ok: false }, 500);
  const sent = request.headers.get("X-Telegram-Bot-Api-Secret-Token") || "";
  if (sent !== (await webhookSecret(env))) return json({ error: "forbidden" }, 403);

  let update = null;
  try {
    update = await request.json();
  } catch (e) {
    return json({ ok: true });
  }

  if (update && update.inline_query) {
    try {
      await answerInline(env, update.inline_query, new URL(request.url).origin);
    } catch (e) {
      // nothing to do: the person just sees no results
    }
  }
  if (update && update.message) {
    try {
      await handleLinkMessage(env, update.message);
    } catch (e) {
      // ignore: the person just gets no answer
    }
  }
  if (update && update.callback_query) {
    try {
      await handleLinkCallback(env, update.callback_query);
    } catch (e) {
      // ignore
    }
  }
  return json({ ok: true });
}

// PUT /api/inline-settings  { hidden: true|false } - hides/shows your Public lists in @flicksyrobot <your ID>
export async function handleInlineSettings(request, env, user) {
  let body = null;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "bad_request" }, 400);
  }
  if (!body || typeof body.hidden !== "boolean") return json({ error: "bad_request" }, 400);
  await env.DB.prepare("UPDATE users SET inline_hidden = ?1 WHERE id = ?2")
    .bind(body.hidden ? 1 : 0, user.id)
    .run();
  return json({ ok: true, hidden: body.hidden });
}
