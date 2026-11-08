// The bot's own menu: /start screen, search, watchlist and "next episode" - all inside the chat,
// without opening the Mini App.

import { searchCards, loadCard } from "./titlecard.js";
import { tmdbGet } from "./tmdb.js";
import { cleanEntries, importEntries } from "./backup.js";

const APP_URL = "https://flicksy.rashidi-a96.workers.dev/";
const PAGE = 8;
const NEXT_MAX = 6;

const S = {
  en: {
    welcome: "🎬 <b>Welcome to Flicksy</b>\n\nYour movies and series, right here in the chat.\n\n🔎 Type any title to search\n📋 See your watchlist\n▶️ Get the next episode of your series\n🔗 Or send me an IMDb / TMDB link",
    search: "🔎 Search", watchlist: "📋 Watchlist", next: "▶️ Next episodes", app: "🌐 Open Flicksy", home: "‹ Menu",
    searchPrompt: "Type the name of a movie or series:", placeholder: "Movie or series name",
    results: "Results for “{q}”", noResults: "Nothing found. Try another name.",
    wlTitle: "📋 <b>Your watchlist</b>", wlEmpty: "Your watchlist is empty. Search for a title to add one.",
    nextTitle: "▶️ <b>Next episodes</b>", nextEmpty: "You have no series marked as “Watching”.",
    caught: "all caught up", nextWord: "next",
    first: "Open Flicksy once first, then come back here.", err: "Something went wrong. Please try again.",
    more: "More ›", back: "‹ Back", done: "Done ✓", hint: "Tap a title to mark it: movies → Watched, series → Watching.",
  },
  fa: {
    welcome: "🎬 <b>به Flicksy خوش آمدی</b>\n\nفیلم‌ها و سریال‌هایت، همین‌جا توی چت.\n\n🔎 اسم هر فیلم یا سریال را بنویس تا جستجو کنم\n📋 واچ‌لیستت را ببین\n▶️ قسمت بعدی سریال‌هایت را بگیر\n🔗 یا یک لینک IMDb / TMDB بفرست",
    search: "🔎 جستجو", watchlist: "📋 واچ‌لیست", next: "▶️ قسمت بعدی", app: "🌐 باز کردن Flicksy", home: "‹ منو",
    searchPrompt: "اسم فیلم یا سریال را بنویس:", placeholder: "اسم فیلم یا سریال",
    results: "نتیجه‌ی «{q}»", noResults: "چیزی پیدا نشد. اسم دیگری امتحان کن.",
    wlTitle: "📋 <b>واچ‌لیست تو</b>", wlEmpty: "واچ‌لیستت خالی است. یک عنوان را جستجو کن و اضافه کن.",
    nextTitle: "▶️ <b>قسمت‌های بعدی</b>", nextEmpty: "سریالی با وضعیت «در حال دیدن» نداری.",
    caught: "به‌روز هستی", nextWord: "بعدی",
    first: "اول یک بار Flicksy را باز کن، بعد برگرد اینجا.", err: "مشکلی پیش آمد. دوباره امتحان کن.",
    more: "بیشتر ›", back: "‹ قبلی", done: "انجام شد ✓", hint: "روی هر عنوان بزن: فیلم ← دیده‌ام، سریال ← در حال دیدن.",
  },
};

function s(lang, key, params) {
  let text = (S[lang] && S[lang][key]) || S.en[key] || key;
  if (params) Object.keys(params).forEach(function (k) { text = text.split("{" + k + "}").join(String(params[k])); });
  return text;
}

function esc(text) {
  return String(text === undefined || text === null ? "" : text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function tg(env, method, payload) {
  try {
    const res = await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/" + method, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload || {}),
    });
    return await res.json();
  } catch (e) {
    return null;
  }
}

function clip(text, n) {
  text = String(text || "");
  return text.length > n ? text.slice(0, n - 1) + "…" : text;
}

function nameOf(row, lang) {
  return lang === "fa" && row.title_fa ? row.title_fa : row.title;
}

const appButton = function (lang) { return { text: s(lang, "app"), web_app: { url: APP_URL } }; };
const homeButton = function (lang) { return { text: s(lang, "home"), callback_data: "menu:h" }; };

// ---------- views: each returns { text, markup } ----------

function homeView(lang) {
  return {
    text: s(lang, "welcome"),
    markup: {
      inline_keyboard: [
        [{ text: s(lang, "search"), callback_data: "menu:s" }, { text: s(lang, "watchlist"), callback_data: "menu:w:0" }],
        [{ text: s(lang, "next"), callback_data: "menu:n" }],
        [appButton(lang)],
      ],
    },
  };
}

async function watchlistView(env, user, lang, offset) {
  const rows = ((await env.DB.prepare(
    "SELECT t.tmdb_id, t.media_type, t.title, t.title_fa, t.year FROM user_titles ut JOIN titles t ON t.id = ut.title_id " +
      "WHERE ut.user_id = ?1 AND ut.status = 'want' ORDER BY ut.updated_at DESC, ut.id DESC LIMIT ?2 OFFSET ?3"
  ).bind(user.id, PAGE + 1, offset).all()).results) || [];
  if (!rows.length) {
    return { text: s(lang, "wlTitle") + "\n\n" + s(lang, "wlEmpty"), markup: { inline_keyboard: [[homeButton(lang)]] } };
  }
  const shown = rows.slice(0, PAGE);
  const kb = shown.map(function (r) {
    const tv = r.media_type === "tv";
    return [{
      text: (tv ? "▶ 📺 " : "✓ 🎬 ") + clip(nameOf(r, lang) + (r.year ? " (" + r.year + ")" : ""), 40),
      callback_data: "wd:" + (tv ? "t" : "m") + ":" + r.tmdb_id + ":" + offset,
    }];
  });
  const nav = [];
  if (offset > 0) nav.push({ text: s(lang, "back"), callback_data: "menu:w:" + Math.max(0, offset - PAGE) });
  if (rows.length > PAGE) nav.push({ text: s(lang, "more"), callback_data: "menu:w:" + (offset + PAGE) });
  if (nav.length) kb.push(nav);
  kb.push([homeButton(lang)]);
  return { text: s(lang, "wlTitle") + "\n\n" + esc(s(lang, "hint")), markup: { inline_keyboard: kb } };
}

// Next unwatched episode of one series, or null when the person is up to date.
async function nextEpisode(env, userId, row) {
  const res = await tmdbGet(env, "/tv/" + row.tmdb_id + "?language=en-US", 6 * 60 * 60);
  if (!res || !res.data) return null;
  const seasons = (Array.isArray(res.data.seasons) ? res.data.seasons : [])
    .filter(function (x) { return Number.isInteger(x.season_number) && x.season_number >= 1 && x.episode_count > 0; })
    .sort(function (a, b) { return a.season_number - b.season_number; });
  if (!seasons.length) return null;
  const last = await env.DB.prepare(
    "SELECT season_number AS s, episode_number AS e FROM episode_progress WHERE user_id = ?1 AND title_id = ?2 " +
      "ORDER BY season_number DESC, episode_number DESC LIMIT 1"
  ).bind(userId, row.id).first();
  let cand;
  if (!last) cand = { s: seasons[0].season_number, e: 1 };
  else {
    const cur = seasons.find(function (x) { return x.season_number === last.s; });
    if (cur && last.e < cur.episode_count) cand = { s: last.s, e: last.e + 1 };
    else {
      const nx = seasons.find(function (x) { return x.season_number > last.s; });
      cand = nx ? { s: nx.season_number, e: 1 } : null;
    }
  }
  if (!cand) return null;
  // do not offer an episode that has not aired yet
  const aired = res.data.last_episode_to_air;
  if (aired && Number.isInteger(aired.season_number)) {
    if (cand.s > aired.season_number || (cand.s === aired.season_number && cand.e > aired.episode_number)) return null;
  }
  return cand;
}

async function nextView(env, user, lang) {
  const rows = ((await env.DB.prepare(
    "SELECT t.id, t.tmdb_id, t.title, t.title_fa FROM user_titles ut JOIN titles t ON t.id = ut.title_id " +
      "WHERE ut.user_id = ?1 AND ut.status = 'watching' AND t.media_type = 'tv' ORDER BY ut.updated_at DESC LIMIT ?2"
  ).bind(user.id, NEXT_MAX).all()).results) || [];
  if (!rows.length) {
    return { text: s(lang, "nextTitle") + "\n\n" + s(lang, "nextEmpty"), markup: { inline_keyboard: [[homeButton(lang)]] } };
  }
  const nexts = await Promise.all(rows.map(function (r) {
    return nextEpisode(env, user.id, r).catch(function () { return null; });
  }));
  const lines = [];
  const kb = [];
  rows.forEach(function (r, i) {
    const n = nexts[i];
    const nm = nameOf(r, lang);
    if (n) {
      const code = "S" + n.s + "E" + n.e;
      lines.push("📺 <b>" + esc(nm) + "</b> — " + esc(s(lang, "nextWord")) + ": " + code);
      kb.push([{ text: "✓ " + clip(nm, 28) + " " + code, callback_data: "ne:" + r.tmdb_id + ":" + n.s + ":" + n.e }]);
    } else {
      lines.push("📺 <b>" + esc(nm) + "</b> — " + esc(s(lang, "caught")));
    }
  });
  kb.push([homeButton(lang)]);
  return { text: s(lang, "nextTitle") + "\n\n" + lines.join("\n"), markup: { inline_keyboard: kb } };
}

async function searchView(env, q, lang) {
  const cards = await searchCards(env, q, lang, 6);
  if (!cards.length) return { text: esc(s(lang, "noResults")), markup: { inline_keyboard: [[homeButton(lang)]] } };
  const kb = cards.map(function (c) {
    return [{
      text: (c.type === "tv" ? "📺 " : "🎬 ") + clip(c.title + (c.year ? " (" + c.year + ")" : ""), 44),
      callback_data: "v:" + (c.type === "tv" ? "t" : "m") + ":" + c.tmdb,
    }];
  });
  kb.push([homeButton(lang)]);
  return { text: "<b>" + esc(s(lang, "results", { q: clip(q, 40) })) + "</b>", markup: { inline_keyboard: kb } };
}

async function show(env, target, chatId, view) {
  if (target) {
    await tg(env, "editMessageText", Object.assign({
      text: view.text, parse_mode: "HTML", reply_markup: view.markup, link_preview_options: { is_disabled: true },
    }, target));
  } else {
    await tg(env, "sendMessage", {
      chat_id: chatId, text: view.text, parse_mode: "HTML", reply_markup: view.markup, link_preview_options: { is_disabled: true },
    });
  }
}

// ---------- entry points ----------

// A command (/start, /menu, /search, /watchlist, /next, /app). Returns true when it was one of ours.
export async function handleMenuCommand(env, message, user, lang) {
  const text = message.text || "";
  const m = /^\/(start|help|menu|search|watchlist|next|app)(@\w+)?(\s|$)/i.exec(text);
  if (!m) return false;
  const cmd = m[1].toLowerCase();
  const chatId = message.chat.id;

  if (cmd === "app") {
    await tg(env, "sendMessage", { chat_id: chatId, text: "🎬", reply_markup: { inline_keyboard: [[appButton(lang)]] } });
    return true;
  }
  if (cmd === "start" || cmd === "help" || cmd === "menu") {
    await show(env, null, chatId, homeView(lang));
    return true;
  }
  if (!user) {
    await tg(env, "sendMessage", { chat_id: chatId, text: s(lang, "first"), reply_markup: { inline_keyboard: [[appButton(lang)]] } });
    return true;
  }
  if (cmd === "search") {
    await askSearch(env, chatId, lang);
  } else if (cmd === "watchlist") {
    await show(env, null, chatId, await watchlistView(env, user, lang, 0));
  } else if (cmd === "next") {
    await show(env, null, chatId, await nextView(env, user, lang));
  }
  return true;
}

async function askSearch(env, chatId, lang) {
  await tg(env, "sendMessage", {
    chat_id: chatId, text: s(lang, "searchPrompt"),
    reply_markup: { force_reply: true, input_field_placeholder: s(lang, "placeholder") },
  });
}

// Plain words (no link, no command): search for a title.
export async function handleMenuSearch(env, message, user, lang) {
  const q = String(message.text || "").trim().slice(0, 64);
  if (q.length < 2 || q[0] === "/") return;
  if (!user) {
    await tg(env, "sendMessage", { chat_id: message.chat.id, text: s(lang, "first"), reply_markup: { inline_keyboard: [[appButton(lang)]] } });
    return;
  }
  let view;
  try {
    view = await searchView(env, q, lang);
  } catch (e) {
    view = { text: esc(s(lang, "err")), markup: { inline_keyboard: [[homeButton(lang)]] } };
  }
  await show(env, null, message.chat.id, view);
}

// A button of ours was pressed. ctx = { statusKeyboard, statusOf, cardPreview } from botlinks.js
export async function handleMenuCallback(env, cq, user, lang, ctx) {
  const chatId = cq.message && cq.message.chat.id;
  if (!chatId) return;
  const target = { chat_id: chatId, message_id: cq.message.message_id };
  const answer = function (text) { return tg(env, "answerCallbackQuery", { callback_query_id: cq.id, text: text || undefined }); };
  const data = cq.data;
  let m;

  try {
    if (data === "menu:h") {
      await answer();
      await show(env, target, chatId, homeView(lang));
    } else if (data === "menu:s") {
      await answer();
      await askSearch(env, chatId, lang);
    } else if ((m = /^menu:w:(\d{1,4})$/.exec(data))) {
      await answer();
      await show(env, target, chatId, await watchlistView(env, user, lang, parseInt(m[1], 10)));
    } else if (data === "menu:n") {
      await answer();
      await show(env, target, chatId, await nextView(env, user, lang));
    } else if ((m = /^v:([mt]):(\d{1,9})$/.exec(data))) {
      const type = m[1] === "t" ? "tv" : "movie";
      const tmdb = parseInt(m[2], 10);
      const card = await loadCard(env, type, tmdb, lang);
      await answer();
      if (!card) { await tg(env, "sendMessage", { chat_id: chatId, text: s(lang, "err") }); return; }
      const status = await ctx.statusOf(env, user.id, card.type, card.tmdb);
      await tg(env, "sendMessage", {
        chat_id: chatId, text: card.text, parse_mode: "HTML", link_preview_options: ctx.cardPreview(card),
        reply_markup: ctx.statusKeyboard(lang, card.type, card.tmdb, status),
      });
    } else if ((m = /^wd:([mt]):(\d{1,9}):(\d{1,4})$/.exec(data))) {
      // from the watchlist: movie -> Watched, series -> Watching
      const type = m[1] === "t" ? "tv" : "movie";
      const entries = cleanEntries([{ type: type, tmdb: parseInt(m[2], 10), status: type === "tv" ? "watching" : "watched", override: true }]);
      const out = entries ? await importEntries(env, user, entries) : { error: "bad" };
      if (out.error) { await answer(s(lang, "err")); return; }
      await answer(s(lang, "done"));
      await show(env, target, chatId, await watchlistView(env, user, lang, parseInt(m[3], 10)));
    } else if ((m = /^ne:(\d{1,9}):(\d{1,3}):(\d{1,4})$/.exec(data))) {
      const row = await env.DB.prepare("SELECT id FROM titles WHERE tmdb_id = ?1 AND media_type = 'tv'").bind(parseInt(m[1], 10)).first();
      if (!row) { await answer(s(lang, "err")); return; }
      await env.DB.prepare(
        "INSERT OR IGNORE INTO episode_progress (user_id, title_id, season_number, episode_number) VALUES (?1, ?2, ?3, ?4)"
      ).bind(user.id, row.id, parseInt(m[2], 10), parseInt(m[3], 10)).run();
      await answer(s(lang, "done"));
      await show(env, target, chatId, await nextView(env, user, lang));
    }
  } catch (e) {
    await answer(s(lang, "err"));
  }
}

// Called from /bot/setup: the command list and the menu button next to the text field.
export async function setupBotMenu(env) {
  const cmds = {
    en: [
      ["menu", "Main menu"], ["search", "Search a movie or series"], ["watchlist", "My watchlist"],
      ["next", "Next episodes of my series"], ["app", "Open Flicksy"],
    ],
    fa: [
      ["menu", "منوی اصلی"], ["search", "جستجوی فیلم یا سریال"], ["watchlist", "واچ‌لیست من"],
      ["next", "قسمت بعدی سریال‌هایم"], ["app", "باز کردن Flicksy"],
    ],
  };
  const out = {};
  const pack = function (list) { return list.map(function (c) { return { command: c[0], description: c[1] }; }); };
  out.default = await tg(env, "setMyCommands", { commands: pack(cmds.en) });
  out.fa = await tg(env, "setMyCommands", { commands: pack(cmds.fa), language_code: "fa" });
  out.menu = await tg(env, "setChatMenuButton", { menu_button: { type: "commands" } });
  return out;
}
