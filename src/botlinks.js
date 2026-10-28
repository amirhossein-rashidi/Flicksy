// Links pasted in the bot chat: send @flicksyrobot an IMDb or TMDB link (or several) and it shows
// the title with buttons to put it in your library.

import { cleanEntries, importEntries, resolveAndStore, MAX_ENTRIES } from "./backup.js";
import { pickLang } from "./share.js";

const IMG = "https://image.tmdb.org/t/p/w500";
const BOT_LINK = "https://t.me/flicksyrobot";

const W = {
  en: {
    help: "Send me an IMDb or TMDB link (or several, one per line) and I'll add the titles to your Flicksy library.",
    open: "Open Flicksy", first: "Open Flicksy once first, then send me the links again.",
    want: "Watchlist", watching: "Watching", watched: "Watched", paused: "Paused", dropped: "Dropped",
    movie: "Movie", tv: "Series", found: "{n} titles found", missing: "Not found: {n}",
    many: "Only the first {n} links were used.", all_want: "All → Watchlist", all_watching: "All → Watching",
    all_watched: "All → Watched", done: "Done: {a} added, {u} updated, {s} already there.",
    saved: "Saved as {s}", err: "Something went wrong. Please try again.", none: "I couldn't find those titles.",
  },
  fa: {
    help: "یک لینک IMDb یا TMDB (یا چند لینک، هر کدام در یک خط) برایم بفرست تا به کتابخانه‌ی Flicksy تو اضافه کنم.",
    open: "باز کردن Flicksy", first: "اول یک بار Flicksy را باز کن، بعد دوباره لینک‌ها را بفرست.",
    want: "می‌خواهم ببینم", watching: "در حال دیدن", watched: "دیده‌ام", paused: "متوقف", dropped: "رها شده",
    movie: "فیلم", tv: "سریال", found: "{n} عنوان پیدا شد", missing: "پیدا نشد: {n}",
    many: "فقط {n} لینک اول استفاده شد.", all_want: "همه ← می‌خواهم ببینم", all_watching: "همه ← در حال دیدن",
    all_watched: "همه ← دیده‌ام", done: "انجام شد: {a} اضافه، {u} به‌روز، {s} از قبل بود.",
    saved: "ذخیره شد: {s}", err: "مشکلی پیش آمد. دوباره امتحان کن.", none: "این عنوان‌ها را پیدا نکردم.",
  },
  ar: {
    help: "أرسل لي رابط IMDb أو TMDB (أو عدة روابط، كل رابط في سطر) وسأضيف الأعمال إلى مكتبتك في Flicksy.",
    open: "افتح Flicksy", first: "افتح Flicksy مرة واحدة أولًا ثم أرسل الروابط مجددًا.",
    want: "قائمة المشاهدة", watching: "أشاهده", watched: "شاهدته", paused: "متوقف", dropped: "تركته",
    movie: "فيلم", tv: "مسلسل", found: "تم العثور على {n} عمل", missing: "لم يتم العثور: {n}",
    many: "تم استخدام أول {n} روابط فقط.", all_want: "الكل ← قائمة المشاهدة", all_watching: "الكل ← أشاهده",
    all_watched: "الكل ← شاهدته", done: "تم: أضيف {a}، وحُدّث {u}، وكان موجودًا {s}.",
    saved: "تم الحفظ: {s}", err: "حدث خطأ. حاول مرة أخرى.", none: "لم أجد هذه الأعمال.",
  },
  tr: {
    help: "Bana bir IMDb veya TMDB bağlantısı (ya da her satırda bir tane olmak üzere birkaçı) gönder, yapımları Flicksy kitaplığına ekleyeyim.",
    open: "Flicksy’yi aç", first: "Önce Flicksy’yi bir kez aç, sonra bağlantıları tekrar gönder.",
    want: "İzleme listesi", watching: "İzliyorum", watched: "İzledim", paused: "Duraklattım", dropped: "Bıraktım",
    movie: "Film", tv: "Dizi", found: "{n} yapım bulundu", missing: "Bulunamadı: {n}",
    many: "Yalnızca ilk {n} bağlantı kullanıldı.", all_want: "Hepsi → İzleme listesi", all_watching: "Hepsi → İzliyorum",
    all_watched: "Hepsi → İzledim", done: "Tamam: {a} eklendi, {u} güncellendi, {s} zaten vardı.",
    saved: "Kaydedildi: {s}", err: "Bir sorun oluştu. Tekrar dene.", none: "Bu yapımları bulamadım.",
  },
  ru: {
    help: "Пришли мне ссылку IMDb или TMDB (или несколько, по одной в строке), и я добавлю тайтлы в твою библиотеку Flicksy.",
    open: "Открыть Flicksy", first: "Сначала один раз открой Flicksy, потом снова пришли ссылки.",
    want: "В планах", watching: "Смотрю", watched: "Просмотрено", paused: "Пауза", dropped: "Брошено",
    movie: "Фильм", tv: "Сериал", found: "Найдено: {n}", missing: "Не найдено: {n}",
    many: "Использованы только первые {n} ссылок.", all_want: "Все → В планах", all_watching: "Все → Смотрю",
    all_watched: "Все → Просмотрено", done: "Готово: добавлено {a}, обновлено {u}, уже было {s}.",
    saved: "Сохранено: {s}", err: "Что-то пошло не так. Попробуй ещё раз.", none: "Не удалось найти эти тайтлы.",
  },
  es: {
    help: "Envíame un enlace de IMDb o TMDB (o varios, uno por línea) y añadiré los títulos a tu biblioteca de Flicksy.",
    open: "Abrir Flicksy", first: "Abre Flicksy una vez primero y luego vuelve a enviarme los enlaces.",
    want: "Quiero ver", watching: "Viendo", watched: "Visto", paused: "En pausa", dropped: "Abandonado",
    movie: "Película", tv: "Serie", found: "{n} títulos encontrados", missing: "No encontrados: {n}",
    many: "Solo se usaron los primeros {n} enlaces.", all_want: "Todos → Quiero ver", all_watching: "Todos → Viendo",
    all_watched: "Todos → Visto", done: "Listo: {a} añadidos, {u} actualizados, {s} ya estaban.",
    saved: "Guardado como {s}", err: "Algo salió mal. Inténtalo de nuevo.", none: "No encontré esos títulos.",
  },
  fr: {
    help: "Envoie-moi un lien IMDb ou TMDB (ou plusieurs, un par ligne) et j’ajouterai les titres à ta bibliothèque Flicksy.",
    open: "Ouvrir Flicksy", first: "Ouvre d’abord Flicksy une fois, puis renvoie-moi les liens.",
    want: "À voir", watching: "En cours", watched: "Vu", paused: "En pause", dropped: "Abandonné",
    movie: "Film", tv: "Série", found: "{n} titres trouvés", missing: "Introuvables : {n}",
    many: "Seuls les {n} premiers liens ont été utilisés.", all_want: "Tous → À voir", all_watching: "Tous → En cours",
    all_watched: "Tous → Vu", done: "Terminé : {a} ajoutés, {u} mis à jour, {s} déjà présents.",
    saved: "Enregistré : {s}", err: "Un problème est survenu. Réessaie.", none: "Je n’ai pas trouvé ces titres.",
  },
  de: {
    help: "Schick mir einen IMDb- oder TMDB-Link (oder mehrere, einen pro Zeile) und ich füge die Titel deiner Flicksy-Bibliothek hinzu.",
    open: "Flicksy öffnen", first: "Öffne zuerst einmal Flicksy und schick mir die Links dann erneut.",
    want: "Merkliste", watching: "Schaue ich", watched: "Gesehen", paused: "Pausiert", dropped: "Abgebrochen",
    movie: "Film", tv: "Serie", found: "{n} Titel gefunden", missing: "Nicht gefunden: {n}",
    many: "Nur die ersten {n} Links wurden verwendet.", all_want: "Alle → Merkliste", all_watching: "Alle → Schaue ich",
    all_watched: "Alle → Gesehen", done: "Fertig: {a} hinzugefügt, {u} aktualisiert, {s} schon vorhanden.",
    saved: "Gespeichert: {s}", err: "Etwas ist schiefgelaufen. Versuch es nochmal.", none: "Ich habe diese Titel nicht gefunden.",
  },
};

const CODE = { w: "want", g: "watching", d: "watched" };
const LETTER = { want: "w", watching: "g", watched: "d" };

function t(lang, key, params) {
  let text = (W[lang] && W[lang][key]) || W.en[key] || key;
  if (params) {
    Object.keys(params).forEach(function (k) {
      text = text.split("{" + k + "}").join(String(params[k]));
    });
  }
  return text;
}

function esc(text) {
  return String(text === undefined || text === null ? "" : text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function tg(env, method, payload) {
  try {
    const res = await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/" + method, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
    return await res.json();
  } catch (e) {
    return null;
  }
}

// IMDb ids and TMDB links found anywhere in a text, in order, without repeats.
export function extractRefs(text) {
  const found = [];
  const seen = new Set();
  const src = String(text || "");
  const re = /themoviedb\.org\/(movie|tv)\/(\d+)|(tt\d{7,10})/gi;
  let m;
  while ((m = re.exec(src))) {
    let ref;
    if (m[3]) ref = { imdb: m[3].toLowerCase() };
    else ref = { type: m[1].toLowerCase(), tmdb: parseInt(m[2], 10) };
    const key = ref.imdb || ref.type + ":" + ref.tmdb;
    if (seen.has(key)) continue;
    seen.add(key);
    found.push(ref);
  }
  return found;
}

function openButton(lang) {
  return { text: t(lang, "open"), url: BOT_LINK };
}

async function findUser(env, telegramId) {
  return await env.DB.prepare("SELECT id, telegram_id, display_name, public_id, is_private FROM users WHERE telegram_id = ?1")
    .bind(telegramId)
    .first();
}

function statusKeyboard(lang, type, tmdbId, current) {
  const row = ["want", "watching", "watched"].map(function (s) {
    return {
      text: (current === s ? "✓ " : "") + t(lang, s),
      callback_data: "a:" + (type === "tv" ? "t" : "m") + ":" + tmdbId + ":" + LETTER[s],
    };
  });
  return { inline_keyboard: [row, [openButton(lang)]] };
}

// A message with links arrived.
export async function handleLinkMessage(env, message) {
  if (!message || !message.chat || message.chat.type !== "private" || !message.from) return;
  const lang = pickLang(message.from.language_code);
  const chatId = message.chat.id;
  const text = message.text || message.caption || "";

  if (/^\/(start|help)(@\w+)?(\s|$)/i.test(text)) {
    await tg(env, "sendMessage", {
      chat_id: chatId,
      text: t(lang, "help"),
      reply_markup: { inline_keyboard: [[openButton(lang)]] },
    });
    return;
  }

  const refs = extractRefs(text);
  if (!refs.length) return;

  const user = await findUser(env, message.from.id);
  if (!user) {
    await tg(env, "sendMessage", { chat_id: chatId, text: t(lang, "first"), reply_markup: { inline_keyboard: [[openButton(lang)]] } });
    return;
  }

  const used = refs.slice(0, MAX_ENTRIES);
  const entries = cleanEntries(used);
  if (!entries) {
    await tg(env, "sendMessage", { chat_id: chatId, text: t(lang, "err") });
    return;
  }

  let found;
  try {
    found = await resolveAndStore(env, entries);
  } catch (e) {
    await tg(env, "sendMessage", { chat_id: chatId, text: t(lang, "err") });
    return;
  }
  const good = found.filter(function (f) { return !f.error; });
  if (!good.length) {
    await tg(env, "sendMessage", { chat_id: chatId, text: t(lang, "none"), reply_to_message_id: message.message_id });
    return;
  }

  // Details for the card(s) + what the user already has.
  const ids = good.map(function (f) { return f.titleId; });
  const rows = ((await env.DB.prepare(
    "SELECT t.id, t.tmdb_id, t.media_type, t.title, t.title_fa, t.year, t.overview, t.poster_path, t.tmdb_rating, ut.status " +
      "FROM titles t LEFT JOIN user_titles ut ON ut.title_id = t.id AND ut.user_id = ?1 " +
      "WHERE t.id IN (SELECT value FROM json_each(?2))"
  )
    .bind(user.id, JSON.stringify(ids))
    .all()).results) || [];
  const byId = new Map(rows.map(function (r) { return [r.id, r]; }));

  const name = function (r) { return lang === "fa" && r.title_fa ? r.title_fa : r.title; };
  const kind = function (r) { return t(lang, r.media_type === "tv" ? "tv" : "movie"); };

  if (good.length === 1 && refs.length === 1) {
    const r = byId.get(good[0].titleId);
    if (!r) { await tg(env, "sendMessage", { chat_id: chatId, text: t(lang, "err") }); return; }
    let caption = "<b>" + esc(name(r)) + "</b>" + (r.year ? " (" + r.year + ")" : "") + "\n" + (r.media_type === "tv" ? "📺 " : "🎬 ") + esc(kind(r));
    if (r.tmdb_rating) caption += " · ⭐ " + (Math.round(r.tmdb_rating * 10) / 10);
    if (r.overview) caption += "\n\n" + esc(r.overview.length > 280 ? r.overview.slice(0, 277) + "…" : r.overview);
    const markup = statusKeyboard(lang, r.media_type, r.tmdb_id, r.status);
    if (r.poster_path) {
      await tg(env, "sendPhoto", {
        chat_id: chatId, photo: IMG + r.poster_path, caption: caption, parse_mode: "HTML",
        reply_markup: markup, reply_to_message_id: message.message_id,
      });
    } else {
      await tg(env, "sendMessage", { chat_id: chatId, text: caption, parse_mode: "HTML", reply_markup: markup, reply_to_message_id: message.message_id });
    }
    return;
  }

  // Several links: a list, with "all" buttons.
  const lines = [];
  good.forEach(function (f, i) {
    const r = byId.get(f.titleId);
    if (r) lines.push((i + 1) + ". " + (r.media_type === "tv" ? "📺 " : "🎬 ") + esc(name(r)) + (r.year ? " (" + r.year + ")" : "") + (r.status ? " — " + esc(t(lang, r.status)) : ""));
  });
  let textOut = "<b>" + esc(t(lang, "found", { n: good.length })) + "</b>\n\n" + lines.join("\n");
  const missing = found.length - good.length;
  if (missing) textOut += "\n\n" + esc(t(lang, "missing", { n: missing }));
  if (refs.length > MAX_ENTRIES) textOut += "\n" + esc(t(lang, "many", { n: MAX_ENTRIES }));
  await tg(env, "sendMessage", {
    chat_id: chatId, text: textOut, parse_mode: "HTML", reply_to_message_id: message.message_id,
    reply_markup: {
      inline_keyboard: [
        [{ text: t(lang, "all_want"), callback_data: "all:w" }],
        [{ text: t(lang, "all_watching"), callback_data: "all:g" }, { text: t(lang, "all_watched"), callback_data: "all:d" }],
        [openButton(lang)],
      ],
    },
  });
}

// A button under one of our cards was pressed.
export async function handleLinkCallback(env, cq) {
  if (!cq || !cq.from || !cq.message || typeof cq.data !== "string") return;
  const lang = pickLang(cq.from.language_code);
  const answer = function (text) { return tg(env, "answerCallbackQuery", { callback_query_id: cq.id, text: text }); };

  const user = await findUser(env, cq.from.id);
  if (!user) { await answer(t(lang, "first")); return; }
  const chatId = cq.message.chat.id;
  const messageId = cq.message.message_id;

  let m;
  if ((m = /^a:([mt]):(\d{1,9}):([wgd])$/.exec(cq.data))) {
    const type = m[1] === "t" ? "tv" : "movie";
    const status = CODE[m[3]];
    const entries = cleanEntries([{ type: type, tmdb: parseInt(m[2], 10), status: status, override: true }]);
    const out = entries ? await importEntries(env, user, entries) : { error: "bad" };
    if (out.error || !out.results || out.results[0].outcome === "notfound" || out.results[0].outcome === "error") {
      await answer(t(lang, "err"));
      return;
    }
    await answer(t(lang, "saved", { s: t(lang, out.results[0].status || status) }));
    await tg(env, "editMessageReplyMarkup", {
      chat_id: chatId, message_id: messageId,
      reply_markup: statusKeyboard(lang, type, parseInt(m[2], 10), out.results[0].status || status),
    });
    return;
  }

  if ((m = /^all:([wgd])$/.exec(cq.data))) {
    const original = cq.message.reply_to_message;
    const refs = extractRefs((original && (original.text || original.caption)) || "").slice(0, MAX_ENTRIES);
    if (!refs.length) { await answer(t(lang, "err")); return; }
    const status = CODE[m[1]];
    const entries = cleanEntries(refs.map(function (r) { return Object.assign({}, r, { status: status }); }));
    const out = entries ? await importEntries(env, user, entries) : { error: "bad" };
    if (out.error) { await answer(t(lang, "err")); return; }
    const c = out.counts;
    const summary = t(lang, "done", { a: c.added, u: c.updated, s: c.same }) + (c.notfound ? "\n" + t(lang, "missing", { n: c.notfound }) : "");
    await answer(t(lang, "saved", { s: t(lang, status) }));
    await tg(env, "editMessageText", {
      chat_id: chatId, message_id: messageId, text: "✅ " + summary,
      reply_markup: { inline_keyboard: [[openButton(lang)]] },
    });
  }
}
