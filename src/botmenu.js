// The bot's own menu: /start screen, search (inline), lists, settings - inside the chat.

import { searchCards, loadCard, supportedLang } from "./titlecard.js";
import { handleBackupSend } from "./backup.js";
import { LANGS, S, ABOUT, DESC, CMDS } from "./bottext.js";
import { runRichTest } from "./botrich.js";

const APP_URL = "https://flicksy.rashidi-a96.workers.dev/";
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

const appButton = function (lang) { return { text: s(lang, "app"), web_app: { url: APP_URL } }; };
const homeButton = function (lang) { return { text: s(lang, "home"), callback_data: "menu:h" }; };
// opens the text box with "@flicksyrobot " already typed, so the person just types the name
const inlineButton = function (text) { return { text: text, switch_inline_query_current_chat: "" }; };
// lets the person pick any chat or group first, then opens the bot there
const shareButton = function (text) { return { text: text, switch_inline_query: "" }; };

// ---------- views: each returns { text, markup } ----------

function homeView(lang) {
  return {
    text: s(lang, "welcome"),
    markup: {
      inline_keyboard: [
        [inlineButton(s(lang, "search")), { text: s(lang, "lists"), callback_data: "menu:l" }],
        [{ text: s(lang, "surprise"), callback_data: "menu:r" }],
        [{ text: s(lang, "settings"), callback_data: "menu:g" }],
        [appButton(lang)],
      ],
    },
  };
}

function listsView(lang) {
  return {
    text: s(lang, "listsText"),
    markup: { inline_keyboard: [[inlineButton(s(lang, "myLists"))], [shareButton(s(lang, "anyLists"))], [homeButton(lang)]] },
  };
}

function surpriseMenuView(lang) {
  return {
    text: s(lang, "surpriseText"),
    markup: {
      inline_keyboard: [
        [{ text: s(lang, "rMovie"), callback_data: "sur:m:0" }, { text: s(lang, "rTv"), callback_data: "sur:t:0" }],
        [homeButton(lang)],
      ],
    },
  };
}

// one random title from the person's watchlist ("want"), not the same as the last one when there is a choice
async function surpriseView(env, user, lang, kind, last, ctx) {
  const type = kind === "t" ? "tv" : "movie";
  const back = [homeButton(lang)];
  let row = await env.DB.prepare(
    "SELECT t.tmdb_id FROM user_titles ut JOIN titles t ON t.id = ut.title_id " +
      "WHERE ut.user_id = ?1 AND ut.status = 'want' AND t.media_type = ?2 AND t.tmdb_id != ?3 ORDER BY RANDOM() LIMIT 1"
  ).bind(user.id, type, last).first();
  if (!row) {
    row = await env.DB.prepare(
      "SELECT t.tmdb_id FROM user_titles ut JOIN titles t ON t.id = ut.title_id " +
        "WHERE ut.user_id = ?1 AND ut.status = 'want' AND t.media_type = ?2 ORDER BY RANDOM() LIMIT 1"
    ).bind(user.id, type).first();
  }
  if (!row) return { text: esc(s(lang, "nothing")), markup: { inline_keyboard: [[{ text: s(lang, "surprise"), callback_data: "menu:r" }], back] } };
  const card = await loadCard(env, type, row.tmdb_id, lang);
  if (!card) return null;
  return {
    text: card.text,
    preview: ctx.cardPreview(card),
    markup: {
      inline_keyboard: [
        [{ text: s(lang, "again"), callback_data: "sur:" + kind + ":" + row.tmdb_id }],
        [{ text: s(lang, "explore"), url: "https://t.me/flicksyrobot?startapp=title-" + type + "-" + row.tmdb_id }],
        back,
      ],
    },
  };
}

async function settingsView(env, user, lang) {
  const cur = LANGS.find(function (l) { return l[0] === lang; });
  const kb = [];
  for (let i = 0; i < LANGS.length; i += 4) {
    kb.push(LANGS.slice(i, i + 4).map(function (l) {
      return { text: (l[0] === lang ? "✓ " : "") + l[1], callback_data: "set:l:" + l[0] };
    }));
  }
  kb.push([{ text: s(lang, "bkExport"), callback_data: "bk:e" }, { text: s(lang, "bkImport"), callback_data: "bk:i" }]);
  kb.push([homeButton(lang)]);
  const text =
    s(lang, "setTitle") + "\n\n" +
    "• " + esc(s(lang, "setLang")) + ": <b>" + esc(cur ? cur[1] : lang) + "</b>";
  return { text: text, markup: { inline_keyboard: kb } };
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
      text: view.text, parse_mode: "HTML", reply_markup: view.markup, link_preview_options: view.preview || { is_disabled: true },
    }, target));
  } else {
    await tg(env, "sendMessage", {
      chat_id: chatId, text: view.text, parse_mode: "HTML", reply_markup: view.markup, link_preview_options: view.preview || { is_disabled: true },
    });
  }
}

// ---------- entry points ----------

// A command (/start, /menu, /search, /lists, /settings, /app). Returns true when it was one of ours.
export async function handleMenuCommand(env, message, user, lang) {
  const text = message.text || "";
  const m = /^\/(start|help|menu|search|lists|settings|app|richtest)(@\w+)?(\s|$)/i.exec(text);
  if (!m) return false;
  if (m[1].toLowerCase() === "richtest") { await runRichTest(env, message.chat.id); return true; }
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
  if (cmd === "search") {
    await tg(env, "sendMessage", {
      chat_id: chatId, text: s(lang, "searchPrompt"), reply_markup: { inline_keyboard: [[inlineButton(s(lang, "search"))]] },
    });
    return true;
  }
  if (cmd === "lists") {
    await show(env, null, chatId, listsView(lang));
    return true;
  }
  if (!user) {
    await tg(env, "sendMessage", { chat_id: chatId, text: s(lang, "first"), reply_markup: { inline_keyboard: [[appButton(lang)]] } });
    return true;
  }
  await show(env, null, chatId, await settingsView(env, user, lang));
  return true;
}

// Plain words (no link, no command): search for a title and show the results as buttons.
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
    } else if (data === "menu:l") {
      await answer();
      await show(env, target, chatId, listsView(lang));
    } else if (data === "menu:r") {
      await answer();
      await show(env, target, chatId, surpriseMenuView(lang));
    } else if ((m = /^sur:([mt]):(\d{1,9})$/.exec(data))) {
      const view = await surpriseView(env, user, lang, m[1], parseInt(m[2], 10), ctx);
      if (!view) { await answer(s(lang, "err")); return; }
      await answer();
      await show(env, target, chatId, view);
    } else if (data === "menu:g") {
      await answer();
      await show(env, target, chatId, await settingsView(env, user, lang));
    } else if (data === "bk:e") {
      await answer(s(lang, "bkSending"));
      const res = await handleBackupSend(null, env, user);
      if (!res.ok) await tg(env, "sendMessage", { chat_id: chatId, text: s(lang, "bkFail") });
    } else if (data === "bk:i") {
      await answer();
      await show(env, target, chatId, {
        text: s(lang, "bkImportText"),
        markup: { inline_keyboard: [[appButton(lang)], [{ text: s(lang, "settingsBack"), callback_data: "menu:g" }]] },
      });
    } else if ((m = /^set:l:([a-z]{2})$/.exec(data))) {
      const code = supportedLang(m[1]);
      if (!code) { await answer(s(lang, "err")); return; }
      await env.DB.prepare("UPDATE users SET app_lang = ?1 WHERE id = ?2").bind(code, user.id).run();
      await answer(s(code, "done"));
      await show(env, target, chatId, await settingsView(env, user, code));
    } else if ((m = /^v:([mt]):(\d{1,9})$/.exec(data))) {
      const type = m[1] === "t" ? "tv" : "movie";
      const card = await loadCard(env, type, parseInt(m[2], 10), lang);
      await answer();
      if (!card) { await tg(env, "sendMessage", { chat_id: chatId, text: s(lang, "err") }); return; }
      const status = await ctx.statusOf(env, user.id, card.type, card.tmdb);
      await tg(env, "sendMessage", {
        chat_id: chatId, text: card.text, parse_mode: "HTML", link_preview_options: ctx.cardPreview(card),
        reply_markup: ctx.statusKeyboard(lang, card.type, card.tmdb, status),
      });
    }
  } catch (e) {
    await answer(s(lang, "err"));
  }
}

// Called from /bot/setup: command list, About, Description and name, in every language.
export async function setupBotMenu(env) {
  const names = ["menu", "search", "lists", "settings", "app"];
  const out = {};
  for (const l of LANGS) {
    const code = l[0];
    const extra = code === "en" ? {} : { language_code: code };
    const commands = names.map(function (n, i) { return { command: n, description: CMDS[code][i] }; });
    const r = await Promise.all([
      tg(env, "setMyCommands", Object.assign({ commands: commands }, extra)),
      tg(env, "setMyShortDescription", Object.assign({ short_description: ABOUT[code] }, extra)),
      tg(env, "setMyDescription", Object.assign({ description: DESC[code] }, extra)),
    ]);
    out[code] = r.map(function (x) { return !!(x && x.ok); });
  }
  out.menu = await tg(env, "setChatMenuButton", { menu_button: { type: "commands" } });
  out.name = await tg(env, "setMyName", { name: "Flicksy" });
  return out;
}
