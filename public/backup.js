// Backup: export your library, import from IMDb / TV Time / Letterboxd / Bingers / a Flicksy backup, add titles by link.
// Plugs into the Settings list (FX.hooks.settings). Nothing already in your library is ever overwritten or deleted.

(function () {
  "use strict";
  var FX = window.FX;
  if (!FX) return;
  var el = FX.el, clear = FX.clear, button = FX.button;

  // ---------- texts ----------
  var STR = {
    en: {
      sync_b: "Mark finished series as watched", sync_done: "Series marked as watched: {n}", r_upgraded: "Series marked as watched",
      title: "Backup", export_t: "Export", export_d: "Sends a backup file with your whole library and all your lists (private ones too) to your chat with the bot.",
      export_b: "Send backup to my chat", export_ok: "Backup sent to your chat with the bot.", export_fail: "Couldn’t send it. Open the bot chat, press Start, and try again.",
      import_t: "Import", import_d: "Bring your data from IMDb, TV Time, Letterboxd, Bingers or a Flicksy backup. Choose the exported file (ZIP, CSV or JSON). Nothing you already have is changed or deleted: “watched” always wins and your ratings stay.",
      pick: "Choose files", reading: "Reading files…", nodata: "No supported data was found in these files.", zip_fail: "Couldn’t open this ZIP file. Unzip it and choose the CSV files inside instead.",
      k_titles: "titles", k_eps: "episodes", k_lists: "lists", found: "Found", start: "Start import", cancel: "Cancel", other: "Choose other files",
      running: "Importing… keep this screen open", report: "Import finished", cancelled: "Import stopped", r_added: "Added", r_updated: "Updated", r_same: "Already there", r_missing: "Not found",
      r_eps: "Episodes added", r_lists: "Lists", more: "and {n} more", again: "Done", link_t: "Add by link", link_d: "Paste one or more IMDb or TMDB links (one per line).",
      link_ph: "https://www.imdb.com/title/tt0133093/", link_want: "Watchlist", link_watching: "Watching", link_watched: "Watched", link_b: "Add", link_none: "No IMDb or TMDB link found in the text.",
      err_net: "Connection problem. Try again.", sources: "From", too_many_lists: "Some lists were skipped (limit reached).", list_cut: "Long lists were cut to 200 titles."
    },
    fa: {
      sync_b: "سریال‌های کامل‌دیده را «دیده‌ام» کن", sync_done: "سریال‌هایی که «دیده‌ام» شد: {n}", r_upgraded: "سریال «دیده‌ام» شد",
      title: "بکاپ", export_t: "خروجی گرفتن", export_d: "یک فایل بکاپ از کل کتابخانه و همه‌ی لیست‌هایت (حتی خصوصی‌ها) را به چت تو با ربات می‌فرستد.",
      export_b: "ارسال بکاپ به چت من", export_ok: "بکاپ به چت تو با ربات ارسال شد.", export_fail: "ارسال نشد. چت ربات را باز کن، Start را بزن و دوباره امتحان کن.",
      import_t: "ورودی گرفتن", import_d: "اطلاعاتت را از IMDb، TV Time، Letterboxd، Bingers یا بکاپ Flicksy بیاور. فایل خروجی (ZIP، CSV یا JSON) را انتخاب کن. هیچ چیزی از اطلاعات فعلی‌ات تغییر نمی‌کند یا پاک نمی‌شود: «دیده‌ام» همیشه می‌ماند و امتیازهایت حفظ می‌شود.",
      pick: "انتخاب فایل‌ها", reading: "در حال خواندن فایل‌ها…", nodata: "در این فایل‌ها اطلاعات قابل‌پشتیبانی پیدا نشد.", zip_fail: "این فایل ZIP باز نشد. آن را از حالت فشرده دربیاور و فایل‌های CSV داخلش را انتخاب کن.",
      k_titles: "عنوان", k_eps: "قسمت", k_lists: "لیست", found: "پیدا شد", start: "شروع ورود اطلاعات", cancel: "لغو", other: "انتخاب فایل‌های دیگر",
      running: "در حال ورود اطلاعات… این صفحه را باز نگه دار", report: "ورود اطلاعات تمام شد", cancelled: "ورود اطلاعات متوقف شد", r_added: "اضافه شد", r_updated: "به‌روز شد", r_same: "از قبل بود", r_missing: "پیدا نشد",
      r_eps: "قسمت اضافه‌شده", r_lists: "لیست", more: "و {n} مورد دیگر", again: "تمام", link_t: "افزودن با لینک", link_d: "یک یا چند لینک IMDb یا TMDB را بچسبان (هر کدام در یک خط).",
      link_ph: "https://www.imdb.com/title/tt0133093/", link_want: "می‌خواهم ببینم", link_watching: "در حال دیدن", link_watched: "دیده‌ام", link_b: "افزودن", link_none: "در متن، لینک IMDb یا TMDB پیدا نشد.",
      err_net: "مشکل اتصال. دوباره امتحان کن.", sources: "از", too_many_lists: "بعضی لیست‌ها رد شدند (به سقف رسید).", list_cut: "لیست‌های طولانی تا ۲۰۰ عنوان کوتاه شدند."
    },
    ar: {
      sync_b: "اجعل المسلسلات المكتملة «شاهدته»", sync_done: "مسلسلات تم تعليمها كمشاهدة: {n}", r_upgraded: "مسلسلات شاهدتها",
      title: "نسخة احتياطية", export_t: "تصدير", export_d: "يرسل ملف نسخة احتياطية بمكتبتك كاملة وكل قوائمك (حتى الخاصة) إلى محادثتك مع البوت.",
      export_b: "أرسل النسخة إلى محادثتي", export_ok: "تم إرسال النسخة إلى محادثتك مع البوت.", export_fail: "تعذّر الإرسال. افتح محادثة البوت واضغط Start ثم حاول مجددًا.",
      import_t: "استيراد", import_d: "استورد بياناتك من IMDb أو TV Time أو Letterboxd أو Bingers أو نسخة Flicksy. اختر الملف المُصدَّر (ZIP أو CSV أو JSON). لن يتغير أو يُحذف شيء لديك: «شاهدته» يبقى دائمًا وتقييماتك محفوظة.",
      pick: "اختيار الملفات", reading: "جارٍ قراءة الملفات…", nodata: "لم يتم العثور على بيانات مدعومة في هذه الملفات.", zip_fail: "تعذّر فتح ملف ZIP. فكّ الضغط واختر ملفات CSV بداخله.",
      k_titles: "عمل", k_eps: "حلقة", k_lists: "قائمة", found: "تم العثور على", start: "ابدأ الاستيراد", cancel: "إلغاء", other: "اختيار ملفات أخرى",
      running: "جارٍ الاستيراد… أبقِ هذه الشاشة مفتوحة", report: "اكتمل الاستيراد", cancelled: "توقف الاستيراد", r_added: "أُضيف", r_updated: "حُدّث", r_same: "موجود مسبقًا", r_missing: "غير موجود",
      r_eps: "حلقات مضافة", r_lists: "قوائم", more: "و{n} أخرى", again: "تم", link_t: "الإضافة برابط", link_d: "الصق رابط IMDb أو TMDB واحدًا أو أكثر (رابط في كل سطر).",
      link_ph: "https://www.imdb.com/title/tt0133093/", link_want: "قائمة المشاهدة", link_watching: "أشاهده", link_watched: "شاهدته", link_b: "إضافة", link_none: "لم يتم العثور على رابط IMDb أو TMDB في النص.",
      err_net: "مشكلة في الاتصال. حاول مجددًا.", sources: "من", too_many_lists: "تم تخطي بعض القوائم (بلغت الحد).", list_cut: "تم اقتطاع القوائم الطويلة إلى 200 عمل."
    },
    tr: {
      sync_b: "Bitmiş dizileri “izledim” yap", sync_done: "“İzledim” yapılan dizi: {n}", r_upgraded: "İzledim yapılan dizi",
      title: "Yedek", export_t: "Dışa aktar", export_d: "Tüm kitaplığını ve bütün listelerini (özel olanlar dahil) içeren bir yedek dosyasını bot sohbetine gönderir.",
      export_b: "Yedeği sohbetime gönder", export_ok: "Yedek bot sohbetine gönderildi.", export_fail: "Gönderilemedi. Bot sohbetini aç, Start’a bas ve tekrar dene.",
      import_t: "İçe aktar", import_d: "Verilerini IMDb, TV Time, Letterboxd, Bingers veya bir Flicksy yedeğinden getir. Dışa aktarılan dosyayı (ZIP, CSV veya JSON) seç. Mevcut hiçbir şey değişmez veya silinmez: “izledim” her zaman kalır, puanların korunur.",
      pick: "Dosya seç", reading: "Dosyalar okunuyor…", nodata: "Bu dosyalarda desteklenen veri bulunamadı.", zip_fail: "Bu ZIP açılamadı. Arşivden çıkarıp içindeki CSV dosyalarını seç.",
      k_titles: "yapım", k_eps: "bölüm", k_lists: "liste", found: "Bulundu", start: "İçe aktarmayı başlat", cancel: "İptal", other: "Başka dosya seç",
      running: "İçe aktarılıyor… bu ekranı açık tut", report: "İçe aktarma bitti", cancelled: "İçe aktarma durdu", r_added: "Eklendi", r_updated: "Güncellendi", r_same: "Zaten vardı", r_missing: "Bulunamadı",
      r_eps: "Eklenen bölüm", r_lists: "Listeler", more: "ve {n} tane daha", again: "Tamam", link_t: "Bağlantıyla ekle", link_d: "Bir veya birkaç IMDb ya da TMDB bağlantısı yapıştır (her satıra bir tane).",
      link_ph: "https://www.imdb.com/title/tt0133093/", link_want: "İzleme listesi", link_watching: "İzliyorum", link_watched: "İzledim", link_b: "Ekle", link_none: "Metinde IMDb veya TMDB bağlantısı bulunamadı.",
      err_net: "Bağlantı sorunu. Tekrar dene.", sources: "Kaynak", too_many_lists: "Bazı listeler atlandı (sınıra ulaşıldı).", list_cut: "Uzun listeler 200 yapıma kısaltıldı."
    },
    ru: {
      sync_b: "Отметить досмотренные сериалы", sync_done: "Сериалов отмечено как просмотренные: {n}", r_upgraded: "Сериалов просмотрено",
      title: "Резервная копия", export_t: "Экспорт", export_d: "Отправляет в твой чат с ботом файл резервной копии: вся библиотека и все списки (включая приватные).",
      export_b: "Отправить копию в мой чат", export_ok: "Копия отправлена в твой чат с ботом.", export_fail: "Не удалось отправить. Открой чат с ботом, нажми Start и попробуй снова.",
      import_t: "Импорт", import_d: "Перенеси данные из IMDb, TV Time, Letterboxd, Bingers или копии Flicksy. Выбери экспортированный файл (ZIP, CSV или JSON). Ничего из того, что у тебя уже есть, не меняется и не удаляется: «просмотрено» всегда остаётся, оценки сохраняются.",
      pick: "Выбрать файлы", reading: "Читаю файлы…", nodata: "В этих файлах нет поддерживаемых данных.", zip_fail: "Не удалось открыть ZIP. Распакуй его и выбери CSV-файлы внутри.",
      k_titles: "тайтлов", k_eps: "серий", k_lists: "списков", found: "Найдено", start: "Начать импорт", cancel: "Отмена", other: "Выбрать другие файлы",
      running: "Идёт импорт… не закрывай экран", report: "Импорт завершён", cancelled: "Импорт остановлен", r_added: "Добавлено", r_updated: "Обновлено", r_same: "Уже было", r_missing: "Не найдено",
      r_eps: "Добавлено серий", r_lists: "Списки", more: "и ещё {n}", again: "Готово", link_t: "Добавить по ссылке", link_d: "Вставь одну или несколько ссылок IMDb или TMDB (по одной в строке).",
      link_ph: "https://www.imdb.com/title/tt0133093/", link_want: "В планах", link_watching: "Смотрю", link_watched: "Просмотрено", link_b: "Добавить", link_none: "В тексте нет ссылок IMDb или TMDB.",
      err_net: "Проблема с соединением. Попробуй снова.", sources: "Из", too_many_lists: "Часть списков пропущена (достигнут лимит).", list_cut: "Длинные списки обрезаны до 200 тайтлов."
    },
    es: {
      sync_b: "Marcar series terminadas como vistas", sync_done: "Series marcadas como vistas: {n}", r_upgraded: "Series vistas",
      title: "Copia de seguridad", export_t: "Exportar", export_d: "Envía a tu chat con el bot un archivo con toda tu biblioteca y todas tus listas (también las privadas).",
      export_b: "Enviar copia a mi chat", export_ok: "Copia enviada a tu chat con el bot.", export_fail: "No se pudo enviar. Abre el chat del bot, pulsa Start e inténtalo de nuevo.",
      import_t: "Importar", import_d: "Trae tus datos de IMDb, TV Time, Letterboxd, Bingers o una copia de Flicksy. Elige el archivo exportado (ZIP, CSV o JSON). Nada de lo que ya tienes se cambia ni se borra: “visto” siempre gana y tus valoraciones se mantienen.",
      pick: "Elegir archivos", reading: "Leyendo archivos…", nodata: "No se encontraron datos compatibles en estos archivos.", zip_fail: "No se pudo abrir el ZIP. Descomprímelo y elige los CSV de dentro.",
      k_titles: "títulos", k_eps: "episodios", k_lists: "listas", found: "Encontrado", start: "Empezar importación", cancel: "Cancelar", other: "Elegir otros archivos",
      running: "Importando… mantén esta pantalla abierta", report: "Importación terminada", cancelled: "Importación detenida", r_added: "Añadidos", r_updated: "Actualizados", r_same: "Ya estaban", r_missing: "No encontrados",
      r_eps: "Episodios añadidos", r_lists: "Listas", more: "y {n} más", again: "Listo", link_t: "Añadir por enlace", link_d: "Pega uno o varios enlaces de IMDb o TMDB (uno por línea).",
      link_ph: "https://www.imdb.com/title/tt0133093/", link_want: "Quiero ver", link_watching: "Viendo", link_watched: "Visto", link_b: "Añadir", link_none: "No hay enlaces de IMDb o TMDB en el texto.",
      err_net: "Problema de conexión. Inténtalo de nuevo.", sources: "Desde", too_many_lists: "Se omitieron algunas listas (límite alcanzado).", list_cut: "Las listas largas se cortaron a 200 títulos."
    },
    fr: {
      sync_b: "Marquer les séries terminées comme vues", sync_done: "Séries marquées comme vues : {n}", r_upgraded: "Séries vues",
      title: "Sauvegarde", export_t: "Exporter", export_d: "Envoie à ton chat avec le bot un fichier de sauvegarde avec toute ta bibliothèque et toutes tes listes (même privées).",
      export_b: "Envoyer la sauvegarde à mon chat", export_ok: "Sauvegarde envoyée à ton chat avec le bot.", export_fail: "Envoi impossible. Ouvre le chat du bot, appuie sur Start et réessaie.",
      import_t: "Importer", import_d: "Apporte tes données depuis IMDb, TV Time, Letterboxd, Bingers ou une sauvegarde Flicksy. Choisis le fichier exporté (ZIP, CSV ou JSON). Rien de ce que tu as déjà n’est modifié ni supprimé : « vu » gagne toujours et tes notes restent.",
      pick: "Choisir des fichiers", reading: "Lecture des fichiers…", nodata: "Aucune donnée prise en charge dans ces fichiers.", zip_fail: "Impossible d’ouvrir ce ZIP. Décompresse-le et choisis les fichiers CSV à l’intérieur.",
      k_titles: "titres", k_eps: "épisodes", k_lists: "listes", found: "Trouvé", start: "Lancer l’import", cancel: "Annuler", other: "Choisir d’autres fichiers",
      running: "Import en cours… garde cet écran ouvert", report: "Import terminé", cancelled: "Import arrêté", r_added: "Ajoutés", r_updated: "Mis à jour", r_same: "Déjà présents", r_missing: "Introuvables",
      r_eps: "Épisodes ajoutés", r_lists: "Listes", more: "et {n} de plus", again: "Terminé", link_t: "Ajouter par lien", link_d: "Colle un ou plusieurs liens IMDb ou TMDB (un par ligne).",
      link_ph: "https://www.imdb.com/title/tt0133093/", link_want: "À voir", link_watching: "En cours", link_watched: "Vu", link_b: "Ajouter", link_none: "Aucun lien IMDb ou TMDB dans le texte.",
      err_net: "Problème de connexion. Réessaie.", sources: "Depuis", too_many_lists: "Certaines listes ont été ignorées (limite atteinte).", list_cut: "Les longues listes ont été coupées à 200 titres."
    },
    de: {
      sync_b: "Fertige Serien als gesehen markieren", sync_done: "Serien als gesehen markiert: {n}", r_upgraded: "Serien als gesehen",
      title: "Backup", export_t: "Exportieren", export_d: "Sendet eine Backup-Datei mit deiner ganzen Bibliothek und allen Listen (auch privaten) an deinen Chat mit dem Bot.",
      export_b: "Backup an meinen Chat senden", export_ok: "Backup an deinen Chat mit dem Bot gesendet.", export_fail: "Senden fehlgeschlagen. Öffne den Bot-Chat, tippe auf Start und versuche es erneut.",
      import_t: "Importieren", import_d: "Hol deine Daten aus IMDb, TV Time, Letterboxd, Bingers oder einem Flicksy-Backup. Wähle die exportierte Datei (ZIP, CSV oder JSON). Nichts, was du schon hast, wird geändert oder gelöscht: „Gesehen“ gewinnt immer und deine Bewertungen bleiben.",
      pick: "Dateien wählen", reading: "Dateien werden gelesen…", nodata: "In diesen Dateien wurden keine unterstützten Daten gefunden.", zip_fail: "Diese ZIP-Datei lässt sich nicht öffnen. Entpacke sie und wähle die CSV-Dateien darin.",
      k_titles: "Titel", k_eps: "Folgen", k_lists: "Listen", found: "Gefunden", start: "Import starten", cancel: "Abbrechen", other: "Andere Dateien wählen",
      running: "Import läuft… lass diesen Bildschirm offen", report: "Import abgeschlossen", cancelled: "Import gestoppt", r_added: "Hinzugefügt", r_updated: "Aktualisiert", r_same: "Schon vorhanden", r_missing: "Nicht gefunden",
      r_eps: "Folgen hinzugefügt", r_lists: "Listen", more: "und {n} weitere", again: "Fertig", link_t: "Per Link hinzufügen", link_d: "Füge einen oder mehrere IMDb- oder TMDB-Links ein (einen pro Zeile).",
      link_ph: "https://www.imdb.com/title/tt0133093/", link_want: "Merkliste", link_watching: "Schaue ich", link_watched: "Gesehen", link_b: "Hinzufügen", link_none: "Im Text wurde kein IMDb- oder TMDB-Link gefunden.",
      err_net: "Verbindungsproblem. Versuch es nochmal.", sources: "Aus", too_many_lists: "Einige Listen wurden übersprungen (Limit erreicht).", list_cut: "Lange Listen wurden auf 200 Titel gekürzt."
    }
  };

  function lang() { return (window.I18N && I18N.lang) || "en"; }
  function lt(key, params) {
    var tbl = STR[lang()] || STR.en;
    var text = tbl[key] !== undefined ? tbl[key] : (STR.en[key] !== undefined ? STR.en[key] : key);
    if (params) Object.keys(params).forEach(function (k) { text = text.split("{" + k + "}").join(String(params[k])); });
    return text;
  }

  // ---------- small helpers ----------
  function lower(s) { return String(s === undefined || s === null ? "" : s).trim().toLowerCase(); }
  function toInt(v) { var n = parseInt(v, 10); return isNaN(n) ? null : n; }
  function dateOf(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}):(\d{2}))?/.exec(String(v || "").trim());
    if (!m) return null;
    return m[1] + "-" + m[2] + "-" + m[3] + (m[4] ? " " + m[4] + ":" + m[5] + ":" + m[6] : "");
  }
  function yearOf(v) {
    var m = /^(\d{4})/.exec(String(v || "").trim());
    var y = m ? parseInt(m[1], 10) : null;
    return y && y > 1870 && y < 2200 ? y : null;
  }
  function imdbId(v) { var m = /tt\d{5,10}/i.exec(String(v || "")); return m ? m[0].toLowerCase() : null; }
  function tenScale(n) { return n >= 1 && n <= 10 ? Math.round(n) : null; }

  // ---------- CSV ----------
  function parseCSV(text) {
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    var rows = [], row = [], field = "", i = 0, n = text.length, q = false, c;
    while (i < n) {
      c = text.charAt(i);
      if (q) {
        if (c === '"') {
          if (text.charAt(i + 1) === '"') { field += '"'; i += 2; continue; }
          q = false; i++; continue;
        }
        field += c; i++; continue;
      }
      if (c === '"' && field === "") { q = true; i++; continue; }
      if (c === ",") { row.push(field); field = ""; i++; continue; }
      if (c === "\r") { i++; continue; }
      if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
      field += c; i++;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  // { header: [lowercase names], rows: [ {name: value} ] }
  function table(rows) {
    var head = (rows[0] || []).map(function (h) { return lower(h); });
    var out = [];
    for (var r = 1; r < rows.length; r++) {
      var cells = rows[r];
      if (cells.length === 1 && cells[0] === "") continue;
      var o = {};
      for (var c = 0; c < head.length; c++) o[head[c]] = cells[c] === undefined ? "" : cells[c];
      out.push(o);
    }
    return { header: head, rows: out };
  }

  // ---------- ZIP (reads the files inside with the browser's own decompressor) ----------
  function readZip(buf) {
    var dv = new DataView(buf);
    var eocd = -1, i;
    for (i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 66000); i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) return Promise.reject(new Error("zip"));
    var count = dv.getUint16(eocd + 10, true);
    var pos = dv.getUint32(eocd + 16, true);
    var dec = new TextDecoder("utf-8");
    var jobs = [];
    for (i = 0; i < count; i++) {
      if (dv.getUint32(pos, true) !== 0x02014b50) break;
      var method = dv.getUint16(pos + 10, true);
      var csize = dv.getUint32(pos + 20, true);
      var usize = dv.getUint32(pos + 24, true);
      var nlen = dv.getUint16(pos + 28, true);
      var xlen = dv.getUint16(pos + 30, true);
      var clen = dv.getUint16(pos + 32, true);
      var off = dv.getUint32(pos + 42, true);
      var name = dec.decode(new Uint8Array(buf, pos + 46, nlen));
      pos += 46 + nlen + xlen + clen;
      if (/\/$/.test(name) || !/\.(csv|json|txt)$/i.test(name) || /^__MACOSX/.test(name)) continue;
      if (usize > 60 * 1024 * 1024) continue;
      jobs.push({ name: name, method: method, csize: csize, off: off });
    }
    var out = [];
    return jobs.reduce(function (p, j) {
      return p.then(function () {
        if (dv.getUint32(j.off, true) !== 0x04034b50) return;
        var start = j.off + 30 + dv.getUint16(j.off + 26, true) + dv.getUint16(j.off + 28, true);
        var slice = buf.slice(start, start + j.csize);
        if (j.method === 0) { out.push({ name: j.name, text: dec.decode(new Uint8Array(slice)) }); return; }
        if (j.method !== 8 || typeof DecompressionStream === "undefined") throw new Error("zip");
        var stream = new Blob([slice]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
        return new Response(stream).arrayBuffer().then(function (ab) { out.push({ name: j.name, text: dec.decode(new Uint8Array(ab)) }); });
      });
    }, Promise.resolve()).then(function () { return out; });
  }

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onerror = function () { reject(new Error("read")); };
      r.onload = function () { resolve(r.result); };
      r.readAsArrayBuffer(file);
    }).then(function (buf) {
      var head = new Uint8Array(buf, 0, Math.min(4, buf.byteLength));
      if (head[0] === 0x50 && head[1] === 0x4b) return readZip(buf);
      return [{ name: file.name, text: new TextDecoder("utf-8").decode(new Uint8Array(buf)) }];
    });
  }

  // ---------- the collected data ----------
  var RANK = { want: 1, paused: 2, dropped: 2, watching: 2, watched: 3 };

  function newAcc() { return { map: {}, order: [], lists: [], sources: {}, listKeep: {} }; }

  function keyOf(o) {
    if (o.tmdb) return (o.type || "?") + "t" + o.tmdb;
    if (o.imdb) return "i" + o.imdb;
    if (o.tvdb) return "v" + o.tvdb;
    return "n" + (o.type || "?") + "|" + lower(o.title) + "|" + (o.year || "");
  }

  function addItem(acc, src, o) {
    if (!o || !(o.tmdb || o.imdb || o.tvdb || o.title)) return null;
    acc.sources[src] = true;
    var k = keyOf(o);
    var cur = acc.map[k];
    if (!cur) {
      cur = acc.map[k] = { type: o.type || null, tmdb: o.tmdb || null, imdb: o.imdb || null, tvdb: o.tvdb || null, title: o.title || "", year: o.year || null,
        status: null, rating: null, started: null, finished: null, note: null, mood: null, actor: null, episodes: [], epKeys: {}, alt: o.alt || "" };
      acc.order.push(cur);
    }
    if (!cur.imdb && o.imdb) cur.imdb = o.imdb;
    if (!cur.alt && o.alt) cur.alt = o.alt;
    if (!cur.tvdb && o.tvdb) cur.tvdb = o.tvdb;
    if (!cur.year && o.year) cur.year = o.year;
    if (o.status && (!cur.status || (RANK[o.status] || 0) > (RANK[cur.status] || 0))) cur.status = o.status;
    if (!cur.rating && o.rating) cur.rating = o.rating;
    if (o.started && (!cur.started || o.started < cur.started)) cur.started = o.started;
    if (o.finished && (!cur.finished || o.finished < cur.finished)) cur.finished = o.finished;
    if (!cur.note && o.note) cur.note = o.note;
    if (!cur.mood && o.mood) cur.mood = o.mood;
    if (!cur.actor && o.actor) cur.actor = o.actor;
    if (o.episodes) {
      for (var i = 0; i < o.episodes.length; i++) {
        var ep = o.episodes[i];
        var ek = ep[0] + ":" + ep[1];
        if (cur.epKeys[ek] === undefined) { cur.epKeys[ek] = cur.episodes.length; cur.episodes.push([ep[0], ep[1], ep[2] || null]); }
        else if (ep[2] && (!cur.episodes[cur.epKeys[ek]][2] || ep[2] < cur.episodes[cur.epKeys[ek]][2])) cur.episodes[cur.epKeys[ek]][2] = ep[2];
      }
    }
    return cur;
  }

  function addList(acc, src, title, description, ranked, items) {
    items = items.filter(function (x) { return x && (x.tmdb || x.imdb || x.tvdb || x.title); });
    if (!items.length) return;
    acc.sources[src] = true;
    acc.lists.push({ title: String(title || "List").slice(0, 60), description: description || "", ranked: !!ranked, items: items });
  }

  // ---------- Flicksy backup (JSON) ----------
  function parseFlicksy(acc, d) {
    var eps = {};
    (d.episodes || []).forEach(function (e) { eps[e.tmdb_id] = e.items || []; });
    (d.library || []).forEach(function (l) {
      addItem(acc, "Flicksy", { type: l.type, tmdb: l.tmdb_id, imdb: l.imdb, title: l.title, year: l.year, status: l.status, rating: l.rating,
        mood: l.mood && l.mood.length ? l.mood : null, actor: l.actor || null, started: l.started_at, finished: l.finished_at,
        episodes: l.type === "tv" ? (eps[l.tmdb_id] || []) : null });
    });
    (d.lists || []).forEach(function (l) {
      addList(acc, "Flicksy", l.title, l.description, l.is_ranked, (l.items || []).map(function (it) {
        return { type: it.type, tmdb: it.tmdb_id, imdb: it.imdb, title: it.title, year: it.year, note: it.note };
      }));
    });
  }

  // ---------- Bingers ----------
  function parseBingers(acc, t) {
    var S = "Bingers";
    if (t.kind === "bg_library") {
      t.rows.forEach(function (r) {
        var type = r.type === "show" ? "tv" : "movie";
        var st = r.list_status;
        if (type === "movie") {
          if (st === "for_later") addItem(acc, S, { type: type, tmdb: toInt(r.tmdb_id), tvdb: null, title: r.title, alt: r.original_title, year: toInt(r.year), status: "want" });
          return; // followed movies are added from the watches file
        }
        addItem(acc, S, { type: type, tmdb: toInt(r.tmdb_id), tvdb: toInt(r.tvdb_id), title: r.title, alt: r.original_title, year: toInt(r.year), status: st === "for_later" ? "want" : null });
      });
    } else if (t.kind === "bg_watches") {
      t.rows.forEach(function (r) {
        if (r.type === "movie") {
          addItem(acc, S, { type: "movie", tmdb: toInt(r.tmdb_id), title: r.title, status: "watched", finished: dateOf(r.last_watched_at) });
        } else if (r.type === "episode") {
          var s = toInt(r.season_number), e = toInt(r.episode_number);
          if (s === null || e === null) return;
          addItem(acc, S, { type: "tv", tmdb: toInt(r.tmdb_id), tvdb: toInt(r.tvdb_id), title: r.title, episodes: [[s, e, dateOf(r.first_watched_at)]] });
        }
      });
    } else if (t.kind === "bg_ratings") {
      t.rows.forEach(function (r) {
        if (r.type !== "movie") return;
        var n = toInt(r.rating);
        addItem(acc, S, { type: "movie", tmdb: toInt(r.tmdb_id), title: r.title, status: "watched", rating: n ? tenScale(n * 2) : null });
      });
    } else if (t.kind === "bg_lists") {
      var by = {}, order = [];
      t.rows.forEach(function (r) {
        var name = r.list_name || "List";
        if (!by[name]) { by[name] = { description: r.list_description, items: [] }; order.push(name); }
        by[name].items.push({ type: r.type === "show" ? "tv" : "movie", tmdb: toInt(r.tmdb_id), tvdb: toInt(r.tvdb_id), title: r.title });
      });
      order.forEach(function (n) { addList(acc, S, n, by[n].description, false, by[n].items); });
    }
  }

  // ---------- TV Time ----------
  var TT_STARS = { "1": 1, "27": 2, "28": 3, "29": 4, "3": 5 };

  function parseTvTime(acc, tables) {
    var S = "TV Time";
    var movies = {};   // uuid -> { title, year }
    var shows = {};    // tvdb id -> title
    tables.forEach(function (t) {
      if (t.kind === "tt_movies") {
        t.rows.forEach(function (r) {
          if (!r.uuid || !r.movie_name) return;
          var info = { title: r.movie_name, year: yearOf(r.release_date) };
          movies[r.uuid] = info;
          if (r.type === "watch") addItem(acc, S, { type: "movie", title: info.title, year: info.year, status: "watched", finished: dateOf(r.created_at) });
          else if (r.type === "towatch") addItem(acc, S, { type: "movie", title: info.title, year: info.year, status: "want" });
        });
      }
    });
    tables.forEach(function (t) {
      if (t.kind === "tt_series") {
        t.rows.forEach(function (r) {
          var id = toInt(r.s_id);
          if (!id) return;
          if (r.key.indexOf("user-series") === 0) {
            shows[id] = r.series_name || shows[id] || "";
            addItem(acc, S, { type: "tv", tvdb: id, title: r.series_name, status: r.is_for_later === "true" ? "want" : null });
          } else if (r.key.indexOf("watch-episode") === 0) {
            var s = toInt(r.season_number), e = toInt(r.episode_number);
            if (s === null || e === null) return;
            shows[id] = shows[id] || r.series_name || "";
            addItem(acc, S, { type: "tv", tvdb: id, title: r.series_name, episodes: [[s, e, dateOf(r.created_at)]] });
          }
        });
      } else if (t.kind === "tt_ratings") {
        t.rows.forEach(function (r) {
          var code = String(r.vote_key || "").split("-").pop();
          var stars = TT_STARS[code];
          if (!stars) return;
          var info = movies[r.uuid] || { title: r.movie_name, year: null };
          addItem(acc, S, { type: "movie", title: info.title, year: info.year, status: "watched", rating: stars * 2 });
        });
      }
    });
    tables.forEach(function (t) {
      if (t.kind !== "tt_lists") return;
      t.rows.forEach(function (r) {
        if (!r.name || r.type !== "list" || !r.objects) return;
        var items = [], re = /map\[([^\]]*)\]/g, m;
        while ((m = re.exec(r.objects))) {
          var o = {};
          m[1].split(" ").forEach(function (p) { var i = p.indexOf(":"); if (i > 0) o[p.slice(0, i)] = p.slice(i + 1); });
          if (o.type === "movie" && movies[o.uuid]) items.push({ type: "movie", title: movies[o.uuid].title, year: movies[o.uuid].year });
          else if (o.type === "series" && o.id) items.push({ type: "tv", tvdb: toInt(o.id), title: shows[o.id] || "" });
        }
        addList(acc, S, r.name, r.description, false, items);
      });
    });
  }

  // ---------- IMDb ----------
  function imdbType(v) {
    var s = lower(v).replace(/[^a-z]/g, "");
    if (s === "movie" || s === "tvmovie" || s === "short" || s === "tvshort" || s === "video" || s === "tvspecial") return "movie";
    if (s === "tvseries" || s === "tvminiseries") return "tv";
    return null;
  }

  function parseImdb(acc, t) {
    var S = "IMDb";
    var name = t.file.replace(/\.[a-z]+$/i, "");
    var mode = /rating/i.test(name) ? "ratings" : /watchlist/i.test(name) ? "watchlist" : /check/i.test(name) ? "checkins" : "list";
    var items = [];
    t.rows.forEach(function (r) {
      var type = imdbType(r["title type"]);
      if (!type) return;
      var o = { type: type, imdb: imdbId(r["const"]), title: r.title, year: toInt(r.year) };
      if (!o.imdb) return;
      if (mode === "ratings") { o.status = "watched"; o.rating = tenScale(toInt(r["your rating"])); o.finished = dateOf(r["date rated"]); addItem(acc, S, o); }
      else if (mode === "watchlist") { o.status = "want"; addItem(acc, S, o); }
      else if (mode === "checkins") { o.status = "watched"; o.finished = dateOf(r.created); addItem(acc, S, o); }
      else items.push(o);
    });
    if (mode === "list") addList(acc, S, name.replace(/[_-]+/g, " "), "", false, items);
  }

  // ---------- Letterboxd ----------
  function parseLetterboxd(acc, t) {
    var S = "Letterboxd";
    var name = t.name.replace(/\.[a-z]+$/i, "").toLowerCase();
    t.rows.forEach(function (r) {
      var o = { type: "movie", title: r.name, year: toInt(r.year) };
      var rating = parseFloat(r.rating);
      var stars = !isNaN(rating) && rating > 0 ? tenScale(Math.round(rating * 2)) : null;
      if (name === "watched") { o.status = "watched"; o.finished = dateOf(r.date); }
      else if (name === "ratings") { o.status = "watched"; o.rating = stars; o.finished = dateOf(r.date); }
      else if (name === "diary") { o.status = "watched"; o.rating = stars; o.finished = dateOf(r["watched date"] || r.date); }
      else if (name === "watchlist") { o.status = "want"; }
      else return;
      addItem(acc, S, o);
    });
  }

  function parseLetterboxdList(acc, text, fileName) {
    var rows = parseCSV(text);
    var title = fileName.split("/").pop().replace(/\.[a-z]+$/i, "").replace(/[-_]+/g, " ");
    var desc = "", i, items = [];
    for (i = 0; i < rows.length; i++) {
      if (lower(rows[i][0]) === "date" && lower(rows[i][1]) === "name" && rows[i + 1]) {
        title = rows[i + 1][1] || title; desc = rows[i + 1][4] || "";
      }
      if (lower(rows[i][0]) === "position") {
        for (var j = i + 1; j < rows.length; j++) {
          if (rows[j][1]) items.push({ type: "movie", title: rows[j][1], year: toInt(rows[j][2]) });
        }
        break;
      }
    }
    addList(acc, "Letterboxd", title, desc, false, items);
  }

  // ---------- any other CSV ----------
  function findCol(header, names) {
    for (var i = 0; i < names.length; i++) if (header.indexOf(names[i]) >= 0) return names[i];
    return null;
  }

  function parseGeneric(acc, t) {
    var h = t.header;
    var cTitle = findCol(h, ["title", "name", "movie", "film", "show"]);
    var cImdb = findCol(h, ["imdb_id", "imdb", "imdb id", "const"]);
    var cTmdb = findCol(h, ["tmdb_id", "tmdb", "tmdb id"]);
    var cType = findCol(h, ["type", "media_type", "media type", "kind"]);
    var cYear = findCol(h, ["year", "release year", "release_year"]);
    var cStatus = findCol(h, ["status", "list", "list_status"]);
    var cRating = findCol(h, ["rating", "my rating", "your rating", "score", "my_rating"]);
    var cDate = findCol(h, ["date", "watched_at", "watched", "date watched", "date rated", "finished", "finished_at"]);
    var maxRating = 0;
    if (cRating) t.rows.forEach(function (r) { var n = parseFloat(r[cRating]); if (n > maxRating) maxRating = n; });
    var factor = maxRating > 0 && maxRating <= 5 ? 2 : 1;
    t.rows.forEach(function (r) {
      var type = null;
      if (cType) {
        var v = lower(r[cType]);
        if (/movie|film/.test(v)) type = "movie"; else if (/tv|show|series/.test(v)) type = "tv";
      }
      var st = null;
      if (cStatus) {
        var s = lower(r[cStatus]);
        if (/watched|seen|done|complete/.test(s)) st = "watched";
        else if (/watching|progress/.test(s)) st = "watching";
        else if (/dropped|abandon/.test(s)) st = "dropped";
        else if (/paused|hold/.test(s)) st = "paused";
        else if (/want|plan|watchlist|to watch|later|queue/.test(s)) st = "want";
      }
      var rating = null;
      if (cRating) { var n = parseFloat(r[cRating]); if (!isNaN(n) && n > 0) rating = tenScale(Math.round(n * factor)); }
      if (!st) st = rating ? "watched" : (cStatus ? null : "want");
      addItem(acc, "CSV", {
        type: type, imdb: cImdb ? imdbId(r[cImdb]) : null, tmdb: type && cTmdb ? toInt(r[cTmdb]) : null,
        title: cTitle ? r[cTitle] : "", year: cYear ? toInt(r[cYear]) : null, status: st, rating: rating, finished: cDate ? dateOf(r[cDate]) : null
      });
    });
  }

  // ---------- put it together ----------
  function classify(t) {
    var h = t.header;
    function has(x) { return h.indexOf(x) >= 0; }
    if (has("type-uuid-n")) return "tt_movies";
    if (has("bulk_type") && has("series_name")) return "tt_series";
    if (has("vote_key") && has("movie_name") && /rating/.test(t.name)) return "tt_ratings";
    if (has("objects") && has("s_key")) return "tt_lists";
    if (has("list_status") && has("tvdb_id")) return "bg_library";
    if (has("first_watched_at")) return "bg_watches";
    if (has("favorite_character")) return "bg_ratings";
    if (has("list_name") && has("tmdb_id")) return "bg_lists";
    if (has("const") && (has("title type") || has("your rating"))) return "imdb";
    if (has("letterboxd uri")) return "lb";
    if (findCol(h, ["title", "name", "movie", "film", "show"]) || findCol(h, ["imdb_id", "imdb", "imdb id", "const"])) return "generic";
    return null;
  }

  function analyze(files) {
    var acc = newAcc();
    var tables = [];
    files.forEach(function (f) {
      var base = f.name.split("/").pop().toLowerCase();
      if (/\.json$/.test(base)) {
        try { var d = JSON.parse(f.text); if (d && d.app === "flicksy") parseFlicksy(acc, d); } catch (e) { /* not ours */ }
        return;
      }
      if (/^\s*letterboxd list export/i.test(f.text.slice(0, 80))) { parseLetterboxdList(acc, f.text, f.name); return; }
      if (!/\.(csv|txt)$/.test(base)) return;
      var t = table(parseCSV(f.text));
      t.name = base;
      t.file = f.name.split("/").pop();
      t.kind = classify(t);
      if (t.kind) tables.push(t);
    });
    // other CSV files are only used when nothing from a known service was found (a ZIP often holds unrelated files)
    var known = tables.some(function (t) { return t.kind !== "generic"; });
    parseTvTime(acc, tables);
    tables.forEach(function (t) {
      if (t.kind.indexOf("bg_") === 0) parseBingers(acc, t);
      else if (t.kind === "imdb") parseImdb(acc, t);
      else if (t.kind === "lb") parseLetterboxd(acc, t);
      else if (t.kind === "generic" && !known) parseGeneric(acc, t);
    });
    var eps = 0;
    acc.order.forEach(function (x) { eps += x.episodes.length; });
    return { items: acc.order, lists: acc.lists, sources: Object.keys(acc.sources), episodes: eps };
  }

  // ---------- sending ----------
  var MAX_BATCH = 10, MAX_EPS_BATCH = 3000;

  function payload(x, episodes, withMeta) {
    var o = { alt: x.alt || undefined, type: x.type || undefined, tmdb: x.tmdb || undefined, imdb: x.imdb || undefined, tvdb: x.tvdb || undefined, title: x.title || undefined, year: x.year || undefined };
    if (withMeta) {
      if (x.status) o.status = x.status;
      if (x.rating) o.rating = x.rating;
      if (x.started) o.started_at = x.started;
      if (x.finished) o.finished_at = x.finished;
      if (x.note) o.note = x.note;
      if (x.mood) o.mood = x.mood;
      if (x.actor) o.actor = x.actor;
    }
    if (episodes && episodes.length) o.episodes = episodes;
    return o;
  }

  // Groups into requests: at most 10 titles and about 3000 episodes each. A show with a huge number of episodes is split.
  function buildBatches(items) {
    var batches = [], cur = [], eps = 0;
    function push(entry, srcItem, n) {
      if (cur.length >= MAX_BATCH || eps + n > MAX_EPS_BATCH) { batches.push(cur); cur = []; eps = 0; }
      cur.push({ entry: entry, src: srcItem });
      eps += n;
    }
    items.forEach(function (x) {
      var list = x.episodes || [];
      if (list.length <= MAX_EPS_BATCH) { push(payload(x, list, true), x, list.length); return; }
      for (var i = 0; i < list.length; i += MAX_EPS_BATCH) {
        push(payload(x, list.slice(i, i + MAX_EPS_BATCH), i === 0), x, Math.min(MAX_EPS_BATCH, list.length - i));
      }
    });
    if (cur.length) batches.push(cur);
    return batches;
  }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // POST with a few retries (rate limit, bad network). Resolves { status, data } or rejects after giving up.
  function post(path, body, job) {
    var tries = 0;
    function go() {
      if (job.cancelled) return Promise.resolve({ status: 0, data: null });
      return FX.api(path, { method: "POST", body: body }).then(function (res) {
        if (res.status === 429 && tries < 8) { tries++; return wait(6000).then(go); }
        if (res.status >= 500 && tries < 3) { tries++; return wait(2000).then(go); }
        return res;
      }, function () {
        if (tries < 3) { tries++; return wait(2500).then(go); }
        return { status: -1, data: null };
      });
    }
    return go();
  }

  function titleName(src) { return src.title || src.imdb || (src.tmdb ? "TMDB " + src.tmdb : src.tvdb ? "TVDB " + src.tvdb : "?"); }

  // After an import: series with every aired episode marked become "watched".
  function syncSeries(job, onStep) {
    function step(after) {
      if (job.cancelled) return Promise.resolve();
      return post("/api/import-sync", { after: after }, job).then(function (res) {
        if (res.status !== 200 || !res.data) return;
        job.upgraded = (job.upgraded || 0) + (res.data.upgraded || 0);
        if (onStep) onStep();
        if (res.data.next) return step(res.data.next);
      });
    }
    return step(0);
  }

  function runImport(data, job, onProgress) {
    var batches = buildBatches(data.items);
    var listUnits = 0;
    data.lists.forEach(function (l) { listUnits += Math.min(l.items.length, 200); });
    job.total = data.items.length + listUnits;
    job.done = 0;
    var seenTitles = {};

    function fatal(res) {
      if (res.status === 401) job.error = "login"; else job.error = "net";
    }

    var chain = Promise.resolve();
    batches.forEach(function (batch) {
      chain = chain.then(function () {
        if (job.cancelled || job.error) return;
        return post("/api/import-batch", { entries: batch.map(function (b) { return b.entry; }) }, job).then(function (res) {
          if (job.cancelled) return;
          if (res.status !== 200 || !res.data || !res.data.ok) {
            if (res.status === 401 || res.status === -1) { fatal(res); return; }
            job.errors += batch.length; job.done += batch.length; onProgress();
            return;
          }
          job.eps += res.data.episodes_added || 0;
          res.data.results.forEach(function (r, i) {
            var src = batch[i].src;
            var id = (src.type || "") + "|" + (src.tmdb || "") + "|" + (src.imdb || "") + "|" + (src.tvdb || "") + "|" + src.title;
            var first = !seenTitles[id];
            seenTitles[id] = true;
            if (first) job.done++;
            if (r.outcome === "added") job.added++;
            else if (r.outcome === "updated") job.updated++;
            else if (r.outcome === "same") job.same++;
            else if (first) { job.missing.push(titleName(src)); }
          });
          onProgress();
        });
      });
    });

    // lists
    chain = chain.then(function () {
      if (job.cancelled || job.error || !data.lists.length) return;
      return FX.api("/api/lists").then(function (res) {
        var existing = {};
        if (res.status === 200 && res.data && res.data.lists) res.data.lists.forEach(function (l) { existing[lower(l.title)] = l.id; });
        var lc = Promise.resolve();
        data.lists.forEach(function (l) {
          lc = lc.then(function () {
            if (job.cancelled || job.error) return;
            var items = l.items.slice(0, 200);
            if (l.items.length > 200) job.cut = true;
            var getId = existing[lower(l.title)] ? Promise.resolve(existing[lower(l.title)]) :
              post("/api/lists", { title: l.title, description: l.description || "", visibility: "unlisted", is_ranked: l.ranked }, job).then(function (r) {
                if (r.status === 200 && r.data && r.data.list) { existing[lower(l.title)] = r.data.list.id; job.listsMade++; return r.data.list.id; }
                if (r.status === 400) job.listsSkipped = true;
                if (r.status === 401 || r.status === -1) fatal(r);
                return null;
              });
            return getId.then(function (listId) {
              if (!listId) { job.done += items.length; onProgress(); return; }
              var c2 = Promise.resolve();
              for (var i = 0; i < items.length; i += MAX_BATCH) {
                (function (chunk) {
                  c2 = c2.then(function () {
                    if (job.cancelled || job.error) return;
                    var entries = chunk.map(function (x) { return payload(x, null, false); });
                    chunk.forEach(function (x, n) { if (x.note) entries[n].note = x.note; });
                    return post("/api/import-list-items", { list_id: listId, entries: entries }, job).then(function (r2) {
                      if (r2.status === 401 || r2.status === -1) { fatal(r2); return; }
                      job.done += chunk.length;
                      onProgress();
                    });
                  });
                })(items.slice(i, i + MAX_BATCH));
              }
              job.listsDone++;
              return c2;
            });
          });
        });
        return lc;
      });
    });

    // series with every episode marked become "watched"
    chain = chain.then(function () {
      if (job.cancelled || job.error || !data.episodes) return;
      return syncSeries(job, onProgress);
    });

    return chain;
  }

  // ---------- add by link ----------
  function extractRefs(text) {
    var out = [], seen = {}, re = /themoviedb\.org\/(movie|tv)\/(\d+)|(tt\d{7,10})/gi, m;
    while ((m = re.exec(String(text || "")))) {
      var ref = m[3] ? { imdb: m[3].toLowerCase() } : { type: m[1].toLowerCase(), tmdb: parseInt(m[2], 10) };
      var k = ref.imdb || ref.type + ":" + ref.tmdb;
      if (seen[k]) continue;
      seen[k] = true;
      out.push(ref);
    }
    return out;
  }

  // ---------- the page ----------
  var CSS =
    ".bkpage { z-index: 29; }" +
    ".bk-body { max-width: 560px; margin: 0 auto; padding: calc(64px + env(safe-area-inset-top)) 16px 24px; }" +
    ".bk-h1 { font-size: 26px; font-weight: 800; letter-spacing: -.3px; }" +
    ".bk-card { margin-top: 16px; padding: 16px; border-radius: 22px; background: var(--surface); border: 1px solid var(--line); }" +
    ".bk-card h3 { font-size: 17px; font-weight: 800; }" +
    ".bk-card p { margin-top: 6px; font-size: 13px; line-height: 1.8; color: var(--muted); }" +
    ".bk-card .btn { margin-top: 14px; }" +
    ".bk-bar { height: 10px; margin-top: 16px; border-radius: 99px; background: rgba(255,255,255,.08); overflow: hidden; }" +
    ".bk-bar i { display: block; height: 100%; width: 0; border-radius: 99px; background: var(--grad); transition: width .3s; }" +
    ".bk-stats { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }" +
    ".bk-pill { padding: 8px 12px; border-radius: 14px; background: var(--surface-2); font-size: 13px; font-weight: 700; }" +
    ".bk-pill small { display: block; font-size: 11px; font-weight: 500; color: var(--muted); }" +
    ".bk-src { display: inline-block; margin: 8px 6px 0 0; padding: 5px 11px; border-radius: 999px; font-size: 12px; font-weight: 700; background: rgba(139,92,246,.2); border: 1px solid rgba(168,85,247,.4); }" +
    ".bk-miss { margin-top: 12px; max-height: 190px; overflow: auto; font-size: 12px; line-height: 1.9; color: var(--muted); direction: ltr; text-align: start; }" +
    ".bk-seg { display: flex; gap: 6px; margin-top: 12px; }" +
    ".bk-seg .seg-btn { flex: 1; }" +
    ".bk-card textarea.field { margin-top: 12px; min-height: 96px; direction: ltr; }" +
    ".bk-note { margin-top: 10px; font-size: 12px; color: var(--muted); }" +
    ".bk-btnrow { display: flex; gap: 8px; flex-wrap: wrap; }";

  var styleDone = false;
  function ensureStyle() {
    if (styleDone) return;
    styleDone = true;
    var s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  var DOWN = ["M12 3v12", "M7 10l5 5 5-5", "M5 19h14"];
  function svgIcon(paths, size) {
    var NS = "http://www.w3.org/2000/svg";
    var s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("width", size); s.setAttribute("height", size);
    s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "2");
    s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round"); s.setAttribute("class", "ic");
    paths.forEach(function (d) { var p = document.createElementNS(NS, "path"); p.setAttribute("d", d); s.appendChild(p); });
    return s;
  }

  var page = null;

  function closePage() {
    if (!page) return;
    var p = page;
    page = null;
    if (p.job) p.job.cancelled = true;
    p.root.remove();
    FX.popBack(p.back);
    FX.rerender();
  }

  function openPage() {
    ensureStyle();
    if (page) closePage();
    var p = { root: el("div", "page bkpage"), back: closePage, view: "home", data: null, job: null, linkStatus: "want", linkBusy: false, linkText: "", message: "" };
    page = p;
    document.body.appendChild(p.root);
    FX.pushBack(p.back);
    draw(p);
  }

  function pill(value, label) {
    var d = el("div", "bk-pill", String(value));
    d.appendChild(el("small", "", label));
    return d;
  }

  function draw(p) {
    if (page !== p) return;
    clear(p.root);
    var back = FX.iconButton("round-btn", "back", I18N.t("btn_close"), closePage);
    back.firstChild.classList.add("flip");
    p.root.appendChild(back);
    var scroller = el("div", "page-scroll");
    p.root.appendChild(scroller);
    var body = el("div", "bk-body");
    scroller.appendChild(body);
    body.appendChild(el("h1", "bk-h1", lt("title")));

    if (p.view === "home") drawHome(p, body);
    else if (p.view === "reading") { var c = el("div", "bk-card"); c.appendChild(el("p", "", lt("reading"))); body.appendChild(c); }
    else if (p.view === "preview") drawPreview(p, body);
    else if (p.view === "running" || p.view === "done") drawJob(p, body);
  }

  function drawHome(p, body) {
    // export
    var ex = el("section", "bk-card");
    ex.appendChild(el("h3", "", lt("export_t")));
    ex.appendChild(el("p", "", lt("export_d")));
    var exBtn = button("btn primary block", lt("export_b"), function () {
      exBtn.disabled = true;
      FX.api("/api/backup-send", { method: "POST", body: {} }).then(function (res) {
        exBtn.disabled = false;
        if (res.status === 200 && res.data && res.data.ok) { FX.haptic(); FX.toast(lt("export_ok")); }
        else if (res.status === 429) FX.toast(I18N.t("err_rate"), true);
        else FX.toast(lt("export_fail"), true);
      }).catch(function () { exBtn.disabled = false; FX.toast(lt("err_net"), true); });
    });
    ex.appendChild(exBtn);
    body.appendChild(ex);

    // import
    var im = el("section", "bk-card");
    im.appendChild(el("h3", "", lt("import_t")));
    im.appendChild(el("p", "", lt("import_d")));
    if (p.message) im.appendChild(el("div", "bk-note", p.message));
    var input = el("input");
    input.type = "file"; input.multiple = true; input.accept = ".zip,.csv,.json,.txt,application/zip,text/csv,application/json";
    input.style.display = "none";
    input.addEventListener("change", function () { pickFiles(p, input.files); });
    im.appendChild(input);
    im.appendChild(button("btn primary block", lt("pick"), function () { input.click(); }));
    var syncBtn = button("btn glass block", lt("sync_b"), function () {
      syncBtn.disabled = true;
      var job = { cancelled: false, upgraded: 0 };
      syncSeries(job, null).then(function () {
        syncBtn.disabled = false;
        FX.haptic();
        FX.toast(lt("sync_done", { n: job.upgraded }));
      }).catch(function () { syncBtn.disabled = false; FX.toast(lt("err_net"), true); });
    });
    im.appendChild(syncBtn);
    body.appendChild(im);

    // add by link
    var lk = el("section", "bk-card");
    lk.appendChild(el("h3", "", lt("link_t")));
    lk.appendChild(el("p", "", lt("link_d")));
    var ta = el("textarea", "field");
    ta.placeholder = lt("link_ph");
    ta.value = p.linkText;
    ta.addEventListener("input", function () { p.linkText = ta.value; });
    lk.appendChild(ta);
    var seg = el("div", "segment bk-seg");
    [["want", "link_want"], ["watching", "link_watching"], ["watched", "link_watched"]].forEach(function (pair) {
      seg.appendChild(button("seg-btn" + (p.linkStatus === pair[0] ? " active" : ""), lt(pair[1]), function () {
        p.linkStatus = pair[0];
        Array.prototype.forEach.call(seg.children, function (b, i) { b.classList.toggle("active", ["want", "watching", "watched"][i] === p.linkStatus); });
      }));
    });
    lk.appendChild(seg);
    var result = el("div", "bk-note");
    var addBtn = button("btn primary block", lt("link_b"), function () { addByLink(p, addBtn, result); });
    lk.appendChild(addBtn);
    lk.appendChild(result);
    body.appendChild(lk);
  }

  function pickFiles(p, fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    if (!files.length) return;
    p.view = "reading";
    draw(p);
    var all = [];
    files.reduce(function (chain, f) {
      return chain.then(function () { return readFile(f).then(function (list) { all = all.concat(list); }); });
    }, Promise.resolve()).then(function () {
      if (page !== p) return;
      var data = analyze(all);
      if (!data.items.length && !data.lists.length) { p.message = lt("nodata"); p.view = "home"; draw(p); return; }
      p.data = data; p.message = ""; p.view = "preview"; draw(p);
    }).catch(function (e) {
      if (page !== p) return;
      p.message = e && e.message === "zip" ? lt("zip_fail") : lt("nodata");
      p.view = "home";
      draw(p);
    });
  }

  function drawPreview(p, body) {
    var d = p.data;
    var c = el("section", "bk-card");
    c.appendChild(el("h3", "", lt("found")));
    var stats = el("div", "bk-stats");
    stats.appendChild(pill(d.items.length, lt("k_titles")));
    if (d.episodes) stats.appendChild(pill(d.episodes, lt("k_eps")));
    if (d.lists.length) stats.appendChild(pill(d.lists.length, lt("k_lists")));
    c.appendChild(stats);
    var src = el("div");
    src.appendChild(el("span", "bk-note", lt("sources") + ":"));
    d.sources.forEach(function (s) { src.appendChild(el("span", "bk-src", s)); });
    c.appendChild(src);
    c.appendChild(button("btn primary block", lt("start"), function () { startJob(p); }));
    c.appendChild(button("btn glass block", lt("other"), function () { p.data = null; p.view = "home"; draw(p); }));
    body.appendChild(c);
  }

  function startJob(p) {
    var job = { upgraded: 0, cancelled: false, error: null, total: 0, done: 0, added: 0, updated: 0, same: 0, missing: [], errors: 0, eps: 0, listsMade: 0, listsDone: 0, listsSkipped: false, cut: false };
    p.job = job;
    p.view = "running";
    draw(p);
    function progress() {
      if (page !== p || p.view !== "running") return;
      var bar = p.root.querySelector(".bk-bar i");
      var txt = p.root.querySelector(".bk-count");
      if (bar) bar.style.width = (job.total ? Math.min(100, Math.round(job.done / job.total * 100)) : 0) + "%";
      if (txt) txt.textContent = job.done + " / " + job.total;
    }
    runImport(p.data, job, progress).then(function () {
      if (page !== p) return;
      p.view = "done"; draw(p);
    }, function () {
      if (page !== p) return;
      job.error = "net"; p.view = "done"; draw(p);
    });
  }

  function drawJob(p, body) {
    var job = p.job;
    var c = el("section", "bk-card");
    var running = p.view === "running";
    c.appendChild(el("h3", "", running ? lt("running") : (job.cancelled ? lt("cancelled") : lt("report"))));
    if (running) {
      var bar = el("div", "bk-bar");
      bar.appendChild(el("i"));
      c.appendChild(bar);
      c.appendChild(el("div", "bk-note bk-count", job.done + " / " + job.total));
      c.appendChild(button("btn glass block", lt("cancel"), function () { job.cancelled = true; }));
      body.appendChild(c);
      return;
    }
    if (job.error) c.appendChild(el("p", "", job.error === "login" ? I18N.t("err_expired") : lt("err_net")));
    var stats = el("div", "bk-stats");
    stats.appendChild(pill(job.added, lt("r_added")));
    stats.appendChild(pill(job.updated, lt("r_updated")));
    stats.appendChild(pill(job.same, lt("r_same")));
    stats.appendChild(pill(job.missing.length + job.errors, lt("r_missing")));
    if (job.eps) stats.appendChild(pill(job.eps, lt("r_eps")));
    if (job.upgraded) stats.appendChild(pill(job.upgraded, lt("r_upgraded")));
    if (job.listsMade) stats.appendChild(pill(job.listsMade, lt("r_lists")));
    c.appendChild(stats);
    if (job.listsSkipped) c.appendChild(el("div", "bk-note", lt("too_many_lists")));
    if (job.cut) c.appendChild(el("div", "bk-note", lt("list_cut")));
    if (job.missing.length) {
      var box = el("div", "bk-miss");
      job.missing.slice(0, 40).forEach(function (n) { box.appendChild(el("div", "", n)); });
      if (job.missing.length > 40) box.appendChild(el("div", "", lt("more", { n: job.missing.length - 40 })));
      c.appendChild(box);
    }
    c.appendChild(button("btn primary block", lt("again"), closePage));
    body.appendChild(c);
  }

  function addByLink(p, btn, result) {
    if (p.linkBusy) return;
    var refs = extractRefs(p.linkText).slice(0, 100);
    if (!refs.length) { result.textContent = lt("link_none"); return; }
    p.linkBusy = true;
    btn.disabled = true;
    result.textContent = "…";
    var entries = refs.map(function (r) { return { type: r.type, tmdb: r.tmdb, imdb: r.imdb, status: p.linkStatus }; });
    var job = { cancelled: false };
    var totals = { added: 0, updated: 0, same: 0, missing: 0 };
    var chain = Promise.resolve();
    for (var i = 0; i < entries.length; i += MAX_BATCH) {
      (function (chunk) {
        chain = chain.then(function () {
          return post("/api/import-batch", { entries: chunk }, job).then(function (res) {
            if (res.status === 200 && res.data && res.data.results) res.data.results.forEach(function (r) {
              if (r.outcome === "added") totals.added++; else if (r.outcome === "updated") totals.updated++;
              else if (r.outcome === "same") totals.same++; else totals.missing++;
            });
            else totals.missing += chunk.length;
          });
        });
      })(entries.slice(i, i + MAX_BATCH));
    }
    chain.then(function () {
      p.linkBusy = false;
      btn.disabled = false;
      result.textContent = lt("r_added") + ": " + totals.added + " · " + lt("r_updated") + ": " + totals.updated + " · " + lt("r_same") + ": " + totals.same + " · " + lt("r_missing") + ": " + totals.missing;
      FX.haptic();
    });
  }

  // ---------- plug into Settings ----------
  var previous = FX.hooks.settings;
  FX.hooks.settings = function (list, me) {
    if (previous) previous(list, me);
    var row = button("setting", null, openPage);
    var left = el("span", "setting-left");
    left.appendChild(svgIcon(DOWN, 20));
    left.appendChild(el("span", "", lt("title")));
    row.appendChild(left);
    var right = el("span", "setting-right");
    var chev = FX.icon("chevron", 18);
    chev.classList.add("flip");
    right.appendChild(chev);
    row.appendChild(right);
    list.appendChild(row);
  };

  // for tests
  FX.backup = { parseCSV: parseCSV, analyze: analyze, readZip: readZip, buildBatches: buildBatches, extractRefs: extractRefs };
})();
