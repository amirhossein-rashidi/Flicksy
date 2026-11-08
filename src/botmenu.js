// The bot's own menu: /start screen, search (inline), lists, settings - inside the chat.

import { searchCards, loadCard, supportedLang } from "./titlecard.js";

const APP_URL = "https://flicksy.rashidi-a96.workers.dev/";
const LANGS = [
  ["en", "English"], ["fa", "فارسی"], ["ar", "العربية"], ["tr", "Türkçe"],
  ["ru", "Русский"], ["es", "Español"], ["fr", "Français"], ["de", "Deutsch"],
];

const S = {
  en: {
    welcome: "🎬 <b>Welcome to Flicksy</b>\n\nYour movies and series, right here in the chat.\n\n🔎 Search any movie or series\n📚 See your lists, or anyone's lists\n⚙️ Change your settings\n🔗 Or send me an IMDb / TMDB link",
    search: "🔎 Search", lists: "📚 Lists", settings: "⚙️ Settings", app: "🌐 Open Flicksy", home: "‹ Menu",
    searchPrompt: "Type the name of a movie or series:", placeholder: "Movie or series name",
    results: "Results for “{q}”", noResults: "Nothing found. Try another name.",
    listsText: "📚 <b>Lists</b>\n\n• <b>Your lists:</b> tap the first button, then pick a list from the results.\n• <b>Anyone's lists:</b> tap the second button, then type the person's 8-digit Flicksy ID after the bot name. You will see their public lists.",
    myLists: "📚 My lists", anyLists: "👤 Someone's lists",
    setTitle: "⚙️ <b>Settings</b>", setLang: "Language", setInl: "Show my public lists when someone searches my Flicksy ID",
    on: "On", off: "Off", pickLang: "Choose a language:",
    first: "Open Flicksy once first, then come back here.", err: "Something went wrong. Please try again.", done: "Saved ✓",
  },
  fa: {
    welcome: "🎬 <b>به Flicksy خوش آمدی</b>\n\nفیلم‌ها و سریال‌هایت، همین‌جا توی چت.\n\n🔎 هر فیلم یا سریالی را جستجو کن\n📚 لیست‌های خودت یا هر کس دیگری را ببین\n⚙️ تنظیماتت را عوض کن\n🔗 یا یک لینک IMDb / TMDB بفرست",
    search: "🔎 جستجو", lists: "📚 لیست‌ها", settings: "⚙️ تنظیمات", app: "🌐 باز کردن Flicksy", home: "‹ منو",
    searchPrompt: "اسم فیلم یا سریال را بنویس:", placeholder: "اسم فیلم یا سریال",
    results: "نتیجه‌ی «{q}»", noResults: "چیزی پیدا نشد. اسم دیگری امتحان کن.",
    listsText: "📚 <b>لیست‌ها</b>\n\n• <b>لیست‌های خودت:</b> دکمه‌ی اول را بزن، بعد یکی از لیست‌ها را از نتیجه‌ها انتخاب کن.\n• <b>لیست‌های هر کس دیگر:</b> دکمه‌ی دوم را بزن، بعد جلوی اسم ربات، شناسه‌ی ۸ رقمی Flicksy آن شخص را بنویس. لیست‌های عمومی‌اش را می‌بینی.",
    myLists: "📚 لیست‌های من", anyLists: "👤 لیست‌های یک نفر",
    setTitle: "⚙️ <b>تنظیمات</b>", setLang: "زبان", setInl: "نمایش لیست‌های عمومی من وقتی کسی شناسه‌ی Flicksy من را جستجو می‌کند",
    on: "روشن", off: "خاموش", pickLang: "یک زبان انتخاب کن:",
    first: "اول یک بار Flicksy را باز کن، بعد برگرد اینجا.", err: "مشکلی پیش آمد. دوباره امتحان کن.", done: "ذخیره شد ✓",
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

const appButton = function (lang) { return { text: s(lang, "app"), web_app: { url: APP_URL } }; };
const homeButton = function (lang) { return { text: s(lang, "home"), callback_data: "menu:h" }; };
// opens the text box with "@flicksyrobot " already typed, so the person just types the name
const inlineButton = function (text) { return { text: text, switch_inline_query_current_chat: "" }; };

// ---------- views: each returns { text, markup } ----------

function homeView(lang) {
  return {
    text: s(lang, "welcome"),
    markup: {
      inline_keyboard: [
        [inlineButton(s(lang, "search")), { text: s(lang, "lists"), callback_data: "menu:l" }],
        [{ text: s(lang, "settings"), callback_data: "menu:g" }],
        [appButton(lang)],
      ],
    },
  };
}

function listsView(lang) {
  return {
    text: s(lang, "listsText"),
    markup: { inline_keyboard: [[inlineButton(s(lang, "myLists")), inlineButton(s(lang, "anyLists"))], [homeButton(lang)]] },
  };
}

async function settingsView(env, user, lang) {
  const row = await env.DB.prepare("SELECT inline_hidden FROM users WHERE id = ?1").bind(user.id).first();
  const visible = !(row && row.inline_hidden);
  const cur = LANGS.find(function (l) { return l[0] === lang; });
  const kb = [];
  for (let i = 0; i < LANGS.length; i += 4) {
    kb.push(LANGS.slice(i, i + 4).map(function (l) {
      return { text: (l[0] === lang ? "✓ " : "") + l[1], callback_data: "set:l:" + l[0] };
    }));
  }
  kb.push([{ text: (visible ? "✅ " : "⬜ ") + clip(s(lang, "setInl"), 50), callback_data: "set:i:" + (visible ? "0" : "1") }]);
  kb.push([homeButton(lang)]);
  const text =
    s(lang, "setTitle") + "\n\n" +
    "• " + esc(s(lang, "setLang")) + ": <b>" + esc(cur ? cur[1] : lang) + "</b>\n" +
    "• " + esc(s(lang, "setInl")) + ": <b>" + esc(s(lang, visible ? "on" : "off")) + "</b>";
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
      text: view.text, parse_mode: "HTML", reply_markup: view.markup, link_preview_options: { is_disabled: true },
    }, target));
  } else {
    await tg(env, "sendMessage", {
      chat_id: chatId, text: view.text, parse_mode: "HTML", reply_markup: view.markup, link_preview_options: { is_disabled: true },
    });
  }
}

// ---------- entry points ----------

// A command (/start, /menu, /search, /lists, /settings, /app). Returns true when it was one of ours.
export async function handleMenuCommand(env, message, user, lang) {
  const text = message.text || "";
  const m = /^\/(start|help|menu|search|lists|settings|app)(@\w+)?(\s|$)/i.exec(text);
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
    } else if (data === "menu:g") {
      await answer();
      await show(env, target, chatId, await settingsView(env, user, lang));
    } else if ((m = /^set:l:([a-z]{2})$/.exec(data))) {
      const code = supportedLang(m[1]);
      if (!code) { await answer(s(lang, "err")); return; }
      await env.DB.prepare("UPDATE users SET app_lang = ?1 WHERE id = ?2").bind(code, user.id).run();
      await answer(s(code, "done"));
      await show(env, target, chatId, await settingsView(env, user, code));
    } else if ((m = /^set:i:([01])$/.exec(data))) {
      await env.DB.prepare("UPDATE users SET inline_hidden = ?1 WHERE id = ?2").bind(m[1] === "1" ? 0 : 1, user.id).run();
      await answer(s(lang, "done"));
      await show(env, target, chatId, await settingsView(env, user, lang));
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

// Called from /bot/setup: the command list and the menu button next to the text field.
export async function setupBotMenu(env) {
  const cmds = {
    en: [
      ["menu", "Main menu"], ["search", "Search a movie or series"], ["lists", "Lists"],
      ["settings", "Settings"], ["app", "Open Flicksy"],
    ],
    fa: [
      ["menu", "منوی اصلی"], ["search", "جستجوی فیلم یا سریال"], ["lists", "لیست‌ها"],
      ["settings", "تنظیمات"], ["app", "باز کردن Flicksy"],
    ],
  };
  const out = {};
  const pack = function (list) { return list.map(function (c) { return { command: c[0], description: c[1] }; }); };
  out.default = await tg(env, "setMyCommands", { commands: pack(cmds.en) });
  out.fa = await tg(env, "setMyCommands", { commands: pack(cmds.fa), language_code: "fa" });
  out.menu = await tg(env, "setChatMenuButton", { menu_button: { type: "commands" } });
  return out;
}
