// The /help screen of the bot, sent as a Telegram Rich Message (Bot API 10.1+):
// a heading, a table of commands, collapsible sections and a button that opens the Mini App.
// If Telegram refuses the rich message, a plain text version is sent instead.

const APP_URL = "https://flicksy.rashidi-a96.workers.dev/";
const CMD_ROWS = ["/menu", "/search", "/lists", "/settings", "/help", "/app"];

// every language: title, intro, table headers, one description per command, sections [title, text, code?, text after code?]
const H = {
  en: {
    title: "Flicksy help", intro: "Everything you can do in this chat:", cmd: "Command", does: "What it does", open: "Open Flicksy",
    rows: ["main menu", "find a movie or series", "your lists and sharing", "language and backup", "this help", "open the Flicksy app"],
    sec: [
      ["🔎 Searching", "Tap Search (or send /search), then type a name after the bot name:", "@flicksyrobot inception"],
      ["🔗 Links", "Send an IMDb or TMDB link, or several (one per line). You get a card with buttons: want to watch, watching, watched."],
      ["📚 Lists", "My lists shows your lists here; pick one to send it to this chat. Share lists with my friend lets you choose any chat or group. To see someone's public lists, type the bot name and their 8-digit Flicksy ID:", "@flicksyrobot 12345678"],
      ["🎲 Surprise me", "Picks a random movie or series from your watchlist. Tap Try again for another one."],
      ["⚙️ Settings and backup", "Change the language, send yourself a backup file of all your titles and lists, or import one inside the app."],
    ],
  },
  fa: {
    title: "راهنمای Flicksy", intro: "همه‌ی کارهایی که توی این چت می‌تونی بکنی:", cmd: "دستور", does: "چیکار می‌کنه", open: "باز کردن Flicksy",
    rows: ["منوی اصلی", "پیدا کردن فیلم یا سریال", "لیست‌هات و فرستادنشون", "زبان و بکاپ", "همین راهنما", "باز کردن اپ Flicksy"],
    sec: [
      ["🔎 جستجو", "روی «جستجو» بزن (یا /search بفرست)، بعد جلوی اسم ربات اسم فیلم رو بنویس:", "@flicksyrobot inception"],
      ["🔗 لینک", "یه لینک IMDb یا TMDB بفرست، یا چندتا (هر کدوم توی یه خط). یه کارت با دکمه‌ها می‌گیری: می‌خوام ببینم، دارم می‌بینم، دیده‌ام."],
      ["📚 لیست‌ها", "«لیست‌های من» لیست‌هات رو همین‌جا نشون می‌ده؛ یکی رو بزن تا توی همین چت فرستاده بشه. «اشتراک لیست‌ها با دوستم» بهت اجازه می‌ده هر چت یا گروهی رو انتخاب کنی. برای دیدن لیست‌های عمومی یکی دیگه، اسم ربات و شناسه‌ی ۸ رقمی Flicksy اون آدم رو بنویس:", "@flicksyrobot 12345678"],
      ["🎲 سورپرایزم کن", "یه فیلم یا سریال تصادفی از واچ‌لیستت انتخاب می‌کنه. «یکی دیگه» رو بزن تا عوض بشه."],
      ["⚙️ تنظیمات و بکاپ", "زبان رو عوض کن، یه فایل بکاپ از همه‌ی عنوان‌ها و لیست‌هات برای خودت بفرست، یا توی خود اپ وارد کنش."],
    ],
  },
  ar: {
    title: "مساعدة Flicksy", intro: "كل ما يمكنك فعله في هذه المحادثة:", cmd: "الأمر", does: "ماذا يفعل", open: "افتح Flicksy",
    rows: ["القائمة الرئيسية", "ابحث عن فيلم أو مسلسل", "قوائمك ومشاركتها", "اللغة والنسخة الاحتياطية", "هذه المساعدة", "افتح تطبيق Flicksy"],
    sec: [
      ["🔎 البحث", "اضغط «بحث» (أو أرسل /search) ثم اكتب الاسم بعد اسم البوت:", "@flicksyrobot inception"],
      ["🔗 الروابط", "أرسل رابط IMDb أو TMDB، أو عدة روابط (كل رابط في سطر). ستحصل على بطاقة بأزرار: أريد المشاهدة، أشاهده، شاهدته."],
      ["📚 القوائم", "«قوائمي» تعرض قوائمك هنا؛ اختر واحدة لإرسالها إلى هذه المحادثة. «شارك القوائم مع صديقي» يتيح لك اختيار أي محادثة أو مجموعة. لرؤية القوائم العامة لشخص آخر اكتب اسم البوت ومعرّف Flicksy المكوّن من 8 أرقام:", "@flicksyrobot 12345678"],
      ["🎲 فاجئني", "يختار فيلمًا أو مسلسلًا عشوائيًا من قائمة المشاهدة. اضغط «مرة أخرى» للحصول على غيره."],
      ["⚙️ الإعدادات والنسخة الاحتياطية", "غيّر اللغة، أو أرسل لنفسك ملف نسخة احتياطية بكل أعمالك وقوائمك، أو استورد واحدًا داخل التطبيق."],
    ],
  },
  tr: {
    title: "Flicksy yardım", intro: "Bu sohbette yapabileceğin her şey:", cmd: "Komut", does: "Ne yapar", open: "Flicksy’yi aç",
    rows: ["ana menü", "film veya dizi bul", "listelerin ve paylaşma", "dil ve yedek", "bu yardım", "Flicksy uygulamasını aç"],
    sec: [
      ["🔎 Arama", "Ara’ya dokun (ya da /search gönder), sonra bot adından sonra bir isim yaz:", "@flicksyrobot inception"],
      ["🔗 Bağlantılar", "Bir IMDb veya TMDB bağlantısı, ya da birkaç tane gönder (her satıra bir tane). Düğmeli bir kart alırsın: izlemek istiyorum, izliyorum, izledim."],
      ["📚 Listeler", "Listelerim, listelerini burada gösterir; birini seç, bu sohbete gönderilsin. Listeleri arkadaşımla paylaş ile istediğin sohbeti veya grubu seçebilirsin. Başkasının herkese açık listelerini görmek için bot adını ve onun 8 haneli Flicksy kimliğini yaz:", "@flicksyrobot 12345678"],
      ["🎲 Beni şaşırt", "İzleme listenden rastgele bir film veya dizi seçer. Başkası için Tekrar dene’ye dokun."],
      ["⚙️ Ayarlar ve yedek", "Dili değiştir, tüm yapımlarının ve listelerinin yedek dosyasını kendine gönder, ya da uygulamanın içinde içe aktar."],
    ],
  },
  ru: {
    title: "Справка Flicksy", intro: "Всё, что можно делать в этом чате:", cmd: "Команда", does: "Что делает", open: "Открыть Flicksy",
    rows: ["главное меню", "найти фильм или сериал", "твои списки и отправка", "язык и резервная копия", "эта справка", "открыть приложение Flicksy"],
    sec: [
      ["🔎 Поиск", "Нажми «Поиск» (или отправь /search), потом напиши название после имени бота:", "@flicksyrobot inception"],
      ["🔗 Ссылки", "Пришли ссылку IMDb или TMDB, или несколько (по одной в строке). Получишь карточку с кнопками: хочу посмотреть, смотрю, посмотрел."],
      ["📚 Списки", "«Мои списки» показывает твои списки здесь; выбери один, и он уйдёт в этот чат. «Поделиться списками с другом» позволяет выбрать любой чат или группу. Чтобы увидеть чужие публичные списки, напиши имя бота и 8-значный Flicksy ID человека:", "@flicksyrobot 12345678"],
      ["🎲 Удиви меня", "Выбирает случайный фильм или сериал из твоего списка «В планах». Нажми «Ещё раз», чтобы выбрать другой."],
      ["⚙️ Настройки и копия", "Смени язык, отправь себе файл резервной копии со всеми тайтлами и списками или импортируй её в приложении."],
    ],
  },
  es: {
    title: "Ayuda de Flicksy", intro: "Todo lo que puedes hacer en este chat:", cmd: "Comando", does: "Qué hace", open: "Abrir Flicksy",
    rows: ["menú principal", "buscar una película o serie", "tus listas y compartirlas", "idioma y copia de seguridad", "esta ayuda", "abrir la app de Flicksy"],
    sec: [
      ["🔎 Búsqueda", "Toca Buscar (o envía /search) y escribe un nombre después del nombre del bot:", "@flicksyrobot inception"],
      ["🔗 Enlaces", "Envía un enlace de IMDb o TMDB, o varios (uno por línea). Recibes una tarjeta con botones: quiero verla, la estoy viendo, la vi."],
      ["📚 Listas", "Mis listas muestra tus listas aquí; elige una y se envía a este chat. Compartir listas con mi amigo te deja elegir cualquier chat o grupo. Para ver las listas públicas de otra persona, escribe el nombre del bot y su ID de Flicksy de 8 dígitos:", "@flicksyrobot 12345678"],
      ["🎲 Sorpréndeme", "Elige una película o serie al azar de tu lista de «Quiero ver». Toca Otra vez para otra."],
      ["⚙️ Ajustes y copia", "Cambia el idioma, envíate un archivo de copia con todos tus títulos y listas, o impórtalo dentro de la app."],
    ],
  },
  fr: {
    title: "Aide Flicksy", intro: "Tout ce que tu peux faire dans ce chat :", cmd: "Commande", does: "Ce qu’elle fait", open: "Ouvrir Flicksy",
    rows: ["menu principal", "chercher un film ou une série", "tes listes et leur partage", "langue et sauvegarde", "cette aide", "ouvrir l’appli Flicksy"],
    sec: [
      ["🔎 Recherche", "Touche Rechercher (ou envoie /search), puis écris un nom après le nom du bot :", "@flicksyrobot inception"],
      ["🔗 Liens", "Envoie un lien IMDb ou TMDB, ou plusieurs (un par ligne). Tu reçois une carte avec des boutons : à voir, en cours, vu."],
      ["📚 Listes", "Mes listes affiche tes listes ici ; choisis-en une pour l’envoyer dans ce chat. Partager mes listes avec un ami te laisse choisir n’importe quel chat ou groupe. Pour voir les listes publiques de quelqu’un, écris le nom du bot et son identifiant Flicksy à 8 chiffres :", "@flicksyrobot 12345678"],
      ["🎲 Surprends-moi", "Choisit un film ou une série au hasard dans ta liste « À voir ». Touche Encore pour en changer."],
      ["⚙️ Réglages et sauvegarde", "Change la langue, envoie-toi un fichier de sauvegarde de tous tes titres et listes, ou importe-en un dans l’appli."],
    ],
  },
  de: {
    title: "Flicksy-Hilfe", intro: "Alles, was du in diesem Chat tun kannst:", cmd: "Befehl", does: "Was er macht", open: "Flicksy öffnen",
    rows: ["Hauptmenü", "Film oder Serie finden", "deine Listen und Teilen", "Sprache und Backup", "diese Hilfe", "die Flicksy-App öffnen"],
    sec: [
      ["🔎 Suche", "Tipp auf Suchen (oder sende /search) und schreib dann einen Namen hinter den Bot-Namen:", "@flicksyrobot inception"],
      ["🔗 Links", "Schick einen IMDb- oder TMDB-Link, oder mehrere (einen pro Zeile). Du bekommst eine Karte mit Buttons: will ich sehen, schaue ich, gesehen."],
      ["📚 Listen", "Meine Listen zeigt deine Listen hier; wähl eine aus, dann geht sie in diesen Chat. Mit Listen mit meinem Freund teilen kannst du jeden Chat oder jede Gruppe wählen. Um die öffentlichen Listen von jemand anderem zu sehen, schreib den Bot-Namen und die 8-stellige Flicksy-ID:", "@flicksyrobot 12345678"],
      ["🎲 Überrasch mich", "Wählt einen zufälligen Film oder eine Serie aus deiner Merkliste. Tipp auf Nochmal für einen anderen."],
      ["⚙️ Einstellungen und Backup", "Ändere die Sprache, schick dir eine Backup-Datei mit all deinen Titeln und Listen, oder importiere eine in der App."],
    ],
  },
};

function esc(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildHtml(h) {
  let html = "<h2>📖 " + esc(h.title) + "</h2><p>" + esc(h.intro) + "</p>";
  html += "<table bordered><tr><th>" + esc(h.cmd) + "</th><th>" + esc(h.does) + "</th></tr>";
  CMD_ROWS.forEach(function (c, i) { html += "<tr><td>" + c + "</td><td>" + esc(h.rows[i]) + "</td></tr>"; });
  html += "</table><hr/>";
  h.sec.forEach(function (x) {
    html += "<details><summary>" + esc(x[0]) + "</summary><p>" + esc(x[1]) + "</p>";
    if (x[2]) html += "<pre><code>" + esc(x[2]) + "</code></pre>";
    html += "</details>";
  });
  html += '<tg-button-row><tg-button type="web_app" url="' + APP_URL + '">' + esc(h.open) + "</tg-button></tg-button-row>";
  return html;
}

function buildPlain(h) {
  let t = "📖 " + h.title + "\n\n" + h.intro + "\n\n";
  CMD_ROWS.forEach(function (c, i) { t += c + " — " + h.rows[i] + "\n"; });
  h.sec.forEach(function (x) { t += "\n" + x[0] + "\n" + x[1] + (x[2] ? "\n" + x[2] : "") + "\n"; });
  return t;
}

async function call(env, method, payload) {
  try {
    const res = await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/" + method, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function sendHelp(env, chatId, lang) {
  const h = H[lang] || H.en;
  const r = await call(env, "sendRichMessage", { chat_id: chatId, rich_message: { html: buildHtml(h) } });
  if (r && r.ok) return;
  // fallback: plain text with the same button
  await call(env, "sendMessage", {
    chat_id: chatId, text: buildPlain(h),
    reply_markup: { inline_keyboard: [[{ text: h.open, web_app: { url: APP_URL } }]] },
  });
}
