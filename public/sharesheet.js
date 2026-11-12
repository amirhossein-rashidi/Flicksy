// Flicksy share: one "Share" action for profile, title, recap and lists.
// It opens a small sheet: Telegram chat (message with the picture), Telegram story,
// save picture (pick a size and download it), copy link. Pictures are drawn on demand (see cards.js).
//
//   FX.share.profile(me)   - share my profile
//   FX.share.list(list, text) - share a public / unlisted list
//   FX.share.recap(me)     - share my month / year recap
//   FX.share.title(ctx)    - share a movie or series: { item, data, name }
//   FX.share.person(ctx)   - share an actor / crew person: { id, name, photo, department, bio, movies, series, total, known_for }
//   FX.share.open(opts)    - generic: { make(fmt) -> Promise<canvas>, link, text, name, param, formats }   fmt = "chat" | "story" | "tw"
(function () {
  "use strict";

  var FX = window.FX;
  if (!FX) return;

  var TXT = {
    fa: { cmov: "{n} فیلم", cser: "{n} سریال", rlocked: "این پروفایل خصوصیه. برای دیدن ریکپش باید دنبالش کنی.", rmine: "ریکپ خودم رو می‌خوام", rprof: "باز کردن پروفایل", rnone: "در این بازه چیزی تماشا نکرده", rmonth: "این ماه", ryear: "امسال تا امروز", rempty: "در این بازه چیزی تماشا نکردی", runit: "ساعت", rlbl: "ساعت تماشا", rmov: "فیلم", repi: "قسمت", rstreak: "روز پیاپی", rgenre: "ژانر اول", rtop: "پربیننده‌ترین: {t}", rtops: "پربیننده‌ترین‌ها", lkind: "لیست", lby: "ساخته‌شده توسط", ltitles: "{n} عنوان", lfollowers: "{n} دنبال‌کننده", rated: "{n} داد", outof: "از ۱۰", fchat: "چت", fstory: "استوری", ftw: "توییتر و پست", open: "باز کردن در Flicksy", preparing: "در حال آماده‌سازی تصویر...", title: "اشتراک‌گذاری", chat: "ارسال در چت تلگرام", story: "استوری تلگرام", x: "توییتر (X)", save: "ذخیره تصویر", copy: "کپی لینک", copied: "لینک کپی شد", fail: "ارسال نشد، دوباره امتحان کن", bio: "فیلم‌ها و سریال‌هام توی Flicksy", tag: "فیلم و سریال‌هات رو با دوستات دنبال کن", movies: "فیلم", episodes: "قسمت", lists: "لیست", followers: "دنبال‌کننده", thousand: "هزار" },
    en: { cmov: "{n} movies", cser: "{n} series", rlocked: "This profile is private. Follow them to see their recap.", rmine: "I want my recap", rprof: "Open profile", rnone: "Nothing watched in this period", rmonth: "This month", ryear: "This year so far", rempty: "Nothing watched in this period", runit: "h", rlbl: "hours watched", rmov: "Movies", repi: "Episodes", rstreak: "Day streak", rgenre: "Top genre", rtop: "Most watched: {t}", rtops: "Most watched", lkind: "LIST", lby: "by", ltitles: "{n} titles", lfollowers: "{n} followers", rated: "rated it {n}", outof: "/ 10", fchat: "Chat", fstory: "Story", ftw: "Twitter & posts", open: "Open in Flicksy", preparing: "Preparing the picture...", title: "Share", chat: "Send in a Telegram chat", story: "Telegram story", x: "X (Twitter)", save: "Save picture", copy: "Copy link", copied: "Link copied", fail: "Could not share, try again", bio: "My movies & series on Flicksy", tag: "Track movies & series with friends in Telegram", movies: "Movies", episodes: "Episodes", lists: "Lists", followers: "Followers" },
    ar: { cmov: "{n} فيلم", cser: "{n} مسلسل", rlocked: "هذا الحساب خاص. تابعه لترى ملخصه.", rmine: "أريد ملخصي", rprof: "فتح الملف الشخصي", rnone: "لم يشاهد شيئًا في هذه الفترة", rmonth: "هذا الشهر", ryear: "هذه السنة حتى اليوم", rempty: "لا شيء تمت مشاهدته في هذه الفترة", runit: "س", rlbl: "ساعة مشاهدة", rmov: "أفلام", repi: "حلقات", rstreak: "أيام متتالية", rgenre: "النوع الأول", rtop: "الأكثر مشاهدة: {t}", rtops: "الأكثر مشاهدة", lkind: "قائمة", lby: "بواسطة", ltitles: "{n} عنوان", lfollowers: "{n} متابع", rated: "قيّمه {n}", outof: "من 10", fchat: "محادثة", fstory: "قصة", ftw: "تويتر والمنشورات", open: "افتح في Flicksy", preparing: "جارٍ تجهيز الصورة...", title: "مشاركة", chat: "إرسال في محادثة تيليجرام", story: "قصة تيليجرام", x: "إكس (تويتر)", save: "حفظ الصورة", copy: "نسخ الرابط", copied: "تم نسخ الرابط", fail: "تعذّرت المشاركة، حاول مرة أخرى", bio: "أفلامي ومسلسلاتي على Flicksy", tag: "تابع الأفلام والمسلسلات مع أصدقائك على تيليجرام", movies: "أفلام", episodes: "حلقات", lists: "قوائم", followers: "متابعون", thousand: "ألف" },
    tr: { cmov: "{n} film", cser: "{n} dizi", rlocked: "Bu profil gizli. Özetini görmek için takip et.", rmine: "Kendi özetimi istiyorum", rprof: "Profili aç", rnone: "Bu dönemde bir şey izlememiş", rmonth: "Bu ay", ryear: "Bu yıl bugüne kadar", rempty: "Bu dönemde izlenen bir şey yok", runit: "sa", rlbl: "izlenen saat", rmov: "Film", repi: "Bölüm", rstreak: "Günlük seri", rgenre: "En çok tür", rtop: "En çok izlenen: {t}", rtops: "En çok izlenenler", lkind: "LİSTE", lby: "hazırlayan", ltitles: "{n} yapım", lfollowers: "{n} takipçi", rated: "{n} verdi", outof: "/ 10", fchat: "Sohbet", fstory: "Hikâye", ftw: "Twitter ve gönderi", open: "Flicksy’de aç", preparing: "Görsel hazırlanıyor...", title: "Paylaş", chat: "Telegram sohbetinde gönder", story: "Telegram hikâyesi", x: "X (Twitter)", save: "Görseli kaydet", copy: "Bağlantıyı kopyala", copied: "Bağlantı kopyalandı", fail: "Paylaşılamadı, tekrar dene", bio: "Flicksy'deki filmlerim ve dizilerim", tag: "Telegram'da arkadaşlarınla film ve dizi takip et", movies: "Film", episodes: "Bölüm", lists: "Liste", followers: "Takipçi" },
    ru: { cmov: "{n} фильмов", cser: "{n} сериалов", rlocked: "Этот профиль закрыт. Подпишитесь, чтобы увидеть итоги.", rmine: "Хочу свои итоги", rprof: "Открыть профиль", rnone: "За этот период ничего не просмотрено", rmonth: "Этот месяц", ryear: "Этот год на сегодня", rempty: "За этот период ничего не просмотрено", runit: "ч", rlbl: "часов просмотра", rmov: "Фильмы", repi: "Серии", rstreak: "Дней подряд", rgenre: "Топ жанр", rtop: "Больше всего: {t}", rtops: "Больше всего смотрели", lkind: "СПИСОК", lby: "автор", ltitles: "{n} тайтлов", lfollowers: "{n} подписчиков", rated: "поставил(а) {n}", outof: "из 10", fchat: "Чат", fstory: "История", ftw: "Twitter и посты", open: "Открыть во Flicksy", preparing: "Готовим картинку...", title: "Поделиться", chat: "Отправить в чат Telegram", story: "История Telegram", x: "X (Twitter)", save: "Сохранить картинку", copy: "Копировать ссылку", copied: "Ссылка скопирована", fail: "Не удалось поделиться, попробуй ещё раз", bio: "Мои фильмы и сериалы на Flicksy", tag: "Следи за фильмами и сериалами вместе с друзьями в Telegram", movies: "Фильмы", episodes: "Серии", lists: "Списки", followers: "Подписчики" },
    es: { cmov: "{n} películas", cser: "{n} series", rlocked: "Este perfil es privado. Síguelo para ver su resumen.", rmine: "Quiero mi resumen", rprof: "Abrir perfil", rnone: "No vio nada en este período", rmonth: "Este mes", ryear: "Este año hasta hoy", rempty: "Nada visto en este período", runit: "h", rlbl: "horas vistas", rmov: "Películas", repi: "Episodios", rstreak: "Racha de días", rgenre: "Género favorito", rtop: "Más visto: {t}", rtops: "Lo más visto", lkind: "LISTA", lby: "por", ltitles: "{n} títulos", lfollowers: "{n} seguidores", rated: "le dio {n}", outof: "/ 10", fchat: "Chat", fstory: "Historia", ftw: "Twitter y publicaciones", open: "Abrir en Flicksy", preparing: "Preparando la imagen...", title: "Compartir", chat: "Enviar en un chat de Telegram", story: "Historia de Telegram", x: "X (Twitter)", save: "Guardar imagen", copy: "Copiar enlace", copied: "Enlace copiado", fail: "No se pudo compartir, inténtalo de nuevo", bio: "Mis películas y series en Flicksy", tag: "Sigue películas y series con tus amigos en Telegram", movies: "Películas", episodes: "Episodios", lists: "Listas", followers: "Seguidores" },
    fr: { cmov: "{n} films", cser: "{n} séries", rlocked: "Ce profil est privé. Suivez-le pour voir son récap.", rmine: "Je veux mon récap", rprof: "Ouvrir le profil", rnone: "Rien vu sur cette période", rmonth: "Ce mois-ci", ryear: "Cette année jusqu'à aujourd'hui", rempty: "Rien vu sur cette période", runit: "h", rlbl: "heures regardées", rmov: "Films", repi: "Épisodes", rstreak: "Jours d'affilée", rgenre: "Genre préféré", rtop: "Le plus regardé : {t}", rtops: "Les plus regardés", lkind: "LISTE", lby: "par", ltitles: "{n} titres", lfollowers: "{n} abonnés", rated: "a mis {n}", outof: "/ 10", fchat: "Discussion", fstory: "Story", ftw: "Twitter et publications", open: "Ouvrir dans Flicksy", preparing: "Préparation de l'image...", title: "Partager", chat: "Envoyer dans une discussion Telegram", story: "Story Telegram", x: "X (Twitter)", save: "Enregistrer l'image", copy: "Copier le lien", copied: "Lien copié", fail: "Partage impossible, réessaie", bio: "Mes films et séries sur Flicksy", tag: "Suis des films et séries avec tes amis sur Telegram", movies: "Films", episodes: "Épisodes", lists: "Listes", followers: "Abonnés" },
    de: { cmov: "{n} Filme", cser: "{n} Serien", rlocked: "Dieses Profil ist privat. Folge der Person, um den Rückblick zu sehen.", rmine: "Ich will meinen Rückblick", rprof: "Profil öffnen", rnone: "In diesem Zeitraum nichts gesehen", rmonth: "Dieser Monat", ryear: "Dieses Jahr bis heute", rempty: "In diesem Zeitraum nichts gesehen", runit: "Std", rlbl: "Stunden geschaut", rmov: "Filme", repi: "Folgen", rstreak: "Tage in Folge", rgenre: "Top-Genre", rtop: "Meistgesehen: {t}", rtops: "Meistgesehen", lkind: "LISTE", lby: "von", ltitles: "{n} Titel", lfollowers: "{n} Follower", rated: "gab {n}", outof: "/ 10", fchat: "Chat", fstory: "Story", ftw: "Twitter & Beiträge", open: "In Flicksy öffnen", preparing: "Bild wird vorbereitet...", title: "Teilen", chat: "In einem Telegram-Chat senden", story: "Telegram-Story", x: "X (Twitter)", save: "Bild speichern", copy: "Link kopieren", copied: "Link kopiert", fail: "Teilen nicht möglich, versuch es nochmal", bio: "Meine Filme und Serien auf Flicksy", tag: "Verfolge Filme und Serien mit Freunden in Telegram", movies: "Filme", episodes: "Folgen", lists: "Listen", followers: "Follower" }
  };

  function lang() { return (window.I18N && I18N.lang) || "en"; }
  function T(k) {
    var tb = TXT[lang()] || TXT.en;
    return tb[k] !== undefined ? tb[k] : TXT.en[k];
  }

  function tg() { try { return window.Telegram && Telegram.WebApp; } catch (e) { return null; } }
  function tgAtLeast(v) { var w = tg(); try { return !!(w && w.isVersionAtLeast && w.isVersionAtLeast(v)); } catch (e) { return false; } }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function icon(paths, size) {
    var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("width", size || 20);
    s.setAttribute("height", size || 20);
    s.setAttribute("fill", "none");
    s.setAttribute("stroke", "currentColor");
    s.setAttribute("stroke-width", "2");
    s.setAttribute("stroke-linecap", "round");
    s.setAttribute("stroke-linejoin", "round");
    paths.forEach(function (d) {
      var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", d);
      s.appendChild(p);
    });
    return s;
  }
  var IC = {
    chat: ["M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"],
    story: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M12 8v8M8 12h8"],
    x: ["M4 4l16 16M20 4L4 20"],
    save: ["M12 3v12", "M7 11l5 5 5-5", "M5 20h14"],
    copy: ["M9 9h11v11H9z", "M5 15V5a1 1 0 0 1 1-1h10"]
  };

  // ---------- helpers ----------
  function viaOurServer(url) {
    var m = /^https:\/\/image\.tmdb\.org\/t\/p\/(w\d{3})\/([A-Za-z0-9_-]+\.jpg)$/.exec(String(url));
    return m ? "/tmdb-img/" + m[1] + "/" + m[2] : url;
  }

  // a poster picture, or null if it fails / takes too long (one bad poster never breaks a card)
  function loadImage(url) {
    return new Promise(function (resolve) {
      if (!url) { resolve(null); return; }
      var done = false;
      function finish(v) { if (!done) { done = true; resolve(v); } }
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () { finish(img); };
      img.onerror = function () { finish(null); };
      setTimeout(function () { finish(null); }, 8000);
      img.src = viaOurServer(url);
    });
  }

  function toDataUrl(canvas) {
    var q = [0.9, 0.8, 0.7];
    for (var i = 0; i < q.length; i++) {
      var u = canvas.toDataURL("image/jpeg", q[i]);
      if (u.length < 1300000) return u;
    }
    return canvas.toDataURL("image/jpeg", 0.6);
  }

  function copyText(text) {
    return new Promise(function (resolve, reject) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(resolve, function () { fallback(); });
          return;
        }
      } catch (e) {}
      fallback();
      function fallback() {
        try {
          var ta = document.createElement("textarea");
          ta.value = text;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          var ok = document.execCommand("copy");
          ta.remove();
          if (ok) resolve(); else reject();
        } catch (e) { reject(e); }
      }
    });
  }

  // uploads a card and gives its public address (cached per canvas)
  function upload(canvas) {
    if (canvas.__url) return canvas.__url;
    canvas.__url = FX.api("/api/card-upload", { method: "POST", body: { image: toDataUrl(canvas) } }).then(function (res) {
      if (res.status !== 200 || !res.data || !res.data.url || !res.data.id) throw new Error("upload");
      return { id: res.data.id, url: res.data.url };
    });
    canvas.__url.catch(function () { canvas.__url = null; });
    return canvas.__url;
  }

  // ---------- the share sheet ----------
  var SIZES = { chat: "1200 × 630", story: "1080 × 1920", tw: "1200 × 675" };

  function row(path, label, fn) {
    var b = el("button", "setting");
    b.type = "button";
    var left = el("span", "setting-left");
    var ic = icon(path, 20);
    ic.setAttribute("class", "ic");
    left.appendChild(ic);
    left.appendChild(el("span", "", label));
    b.appendChild(left);
    b.addEventListener("click", fn);
    return b;
  }

  // draws each size once, only when a row needs it
  function cardGetter(o) {
    var cache = {};
    return function (fmt) {
      if (!cache[fmt]) {
        cache[fmt] = o.make(fmt);
        cache[fmt].catch(function () { cache[fmt] = null; });
      }
      return cache[fmt];
    };
  }

  function thumb(canvas) {
    var w = 96, h = Math.round((canvas.height * w) / canvas.width);
    if (h > 96) { h = 96; w = Math.round((canvas.width * h) / canvas.height); }
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    c.getContext("2d").drawImage(canvas, 0, 0, w, h);
    var img = el("img");
    img.src = c.toDataURL("image/jpeg", 0.8);
    img.width = w; img.height = h;
    img.style.borderRadius = "8px";
    img.style.flex = "none";
    return img;
  }

  // second sheet: every picture size, tap one to download it
  function savePicker(o, get) {
    var formats = o.formats || ["chat", "story", "tw"];
    FX.openSheet(function (sh) {
      sh.appendChild(el("div", "sheet-title", T("save")));
      var list = el("div", "settings");
      list.style.marginTop = "10px";
      var note = el("div", "muted", T("preparing"));
      sh.appendChild(note);
      sh.appendChild(list);
      Promise.all(formats.map(get)).then(function (cvs) {
        note.remove();
        formats.forEach(function (fmt, i) {
          var b = el("button", "setting");
          b.type = "button";
          var left = el("span", "setting-left");
          left.style.gap = "12px";
          left.appendChild(thumb(cvs[i]));
          var col = el("span");
          col.style.display = "grid";
          col.style.gap = "2px";
          col.style.textAlign = "start";
          col.appendChild(el("span", "", T("f" + fmt)));
          var dim = el("span", "", SIZES[fmt]);
          dim.style.fontSize = "12px";
          dim.style.opacity = ".6";
          dim.style.direction = "ltr";
          col.appendChild(dim);
          left.appendChild(col);
          b.appendChild(left);
          var ic = icon(IC.save, 20);
          ic.setAttribute("class", "ic");
          b.appendChild(ic);
          b.addEventListener("click", function () {
            FX.toast(T("preparing"));
            upload(cvs[i]).then(function (r) {
              tg().downloadFile({ url: r.url, file_name: "flicksy-" + fmt + ".jpg" });
            }).catch(function () { FX.toast(T("fail"), true); });
          });
          list.appendChild(b);
        });
      }).catch(function () { note.textContent = T("fail"); });
    });
  }

  // ---------- generic share ----------
  function open(o) {
    var get = cardGetter(o);
    FX.openSheet(function (sh) {
      sh.appendChild(el("div", "sheet-title", T("title")));
      var list = el("div", "settings");
      list.style.marginTop = "10px";

      function chatByLink() {
        var url = "https://t.me/share/url?url=" + encodeURIComponent(o.link) + "&text=" + encodeURIComponent(o.text);
        FX.closeSheet();
        var w = tg();
        try { if (w && w.openTelegramLink) { w.openTelegramLink(url); return; } } catch (e) {}
        window.open(url, "_blank");
      }

      list.appendChild(row(IC.chat, T("chat"), function () {
        // ready message with the picture and an Open button (Telegram 8.0+); otherwise just the link
        if (!(o.param && tg() && tg().shareMessage && tgAtLeast("8.0"))) { chatByLink(); return; }
        FX.toast(T("preparing"));
        get("chat").then(upload).then(function (r) {
          return FX.api("/api/card-share", { method: "POST", body: { card_id: r.id, param: o.param, caption: o.text, button: T("open") } });
        }).then(function (res) {
          if (res.status !== 200 || !res.data || !res.data.id) throw new Error("share");
          FX.closeSheet();
          tg().shareMessage(res.data.id);
        }).catch(function () { chatByLink(); });
      }));

      if (tg() && tg().shareToStory && tgAtLeast("7.8")) {
        list.appendChild(row(IC.story, T("story"), function () {
          FX.toast(T("preparing"));
          get("story").then(upload).then(function (r) {
            FX.closeSheet();
            tg().shareToStory(r.url, { text: o.text, widget_link: { url: o.link, name: String(o.name || "Flicksy").slice(0, 48) } });
          }).catch(function () { FX.toast(T("fail"), true); });
        }));
      }

      if (tg() && tg().downloadFile && tgAtLeast("8.0")) {
        list.appendChild(row(IC.save, T("save"), function () { savePicker(o, get); }));
      }

      list.appendChild(row(IC.copy, T("copy"), function () {
        copyText(o.link).then(function () {
          FX.closeSheet();
          FX.toast(T("copied"));
        }, function () { FX.toast(o.link); });
      }));

      sh.appendChild(list);
    });
  }

  // ---------- profile ----------
  function cardLang() {
    var l = lang();
    return l === "fa" || l === "ar" ? "fa" : "en";
  }

  function fmtNum(n, l) {
    n = Number(n) || 0;
    var fa = l === "fa" || l === "ar";
    var loc = l === "fa" ? "fa-IR" : l === "ar" ? "ar-EG" : "en-US";
    if (n >= 1000 && n % 100 === 0) {
      var k = n / 1000;
      if (fa) return { v: k.toLocaleString(loc, { maximumFractionDigits: 1 }), u: T("thousand") };
      return { v: k + "K" };
    }
    return { v: n.toLocaleString(loc) };
  }

  function profileData(me, stats, listCount, posters, badgeImg) {
    var l = lang();
    function st(n, label) {
      var f = fmtNum(n, l);
      return { v: f.v, u: f.u, l: label };
    }
    var name = me.display_name || "Flicksy";
    return {
      lang: cardLang(),
      name: name,
      un: me.username ? "@" + me.username : String(me.public_id || ""),
      ini: (Array.from(name)[0] || "F").toUpperCase(),
      bio: T("bio"),
      tagline: T("tag"),
      stats: [
        st(stats.movies, T("movies")),
        st(stats.episodes, T("episodes")),
        st(listCount, T("lists")),
        st(stats.followers, T("followers"))
      ],
      posters: posters,
      badgeImg: badgeImg || null
    };
  }

  var HUES = [230, 35, 12, 265];

  // the picture address of a person's main badge from an /api/profile answer (null = show the Flicksy mark)
  function mainBadgeUrl(res) {
    var b = res && res.status === 200 && res.data && res.data.badges;
    return b && b.primary && FX.badgeImageUrl ? FX.badgeImageUrl(b.primary) : null;
  }

  function profile(me) {
    if (!me || !me.public_id) return;
    var link = "https://t.me/flicksyrobot?startapp=user-" + me.public_id;
    var text = I18N.t("pf_share_text", { name: me.display_name || "Flicksy" });
    var cache = null;

    function load() {
      if (cache) return cache;
      cache = Promise.all([
        FX.api("/api/profile?id=" + encodeURIComponent(me.public_id)).catch(function () { return null; }),
        FX.api("/api/lists").catch(function () { return null; }),
        FX.api("/api/library?limit=12").catch(function () { return null; })
      ]).then(function (r) {
        var stats = (r[0] && r[0].status === 200 && r[0].data && r[0].data.stats) || {};
        var lists = (r[1] && r[1].status === 200 && r[1].data && r[1].data.lists) || [];
        var items = (r[2] && r[2].status === 200 && r[2].data && r[2].data.items) || [];
        var urls = [];
        for (var i = 0; i < items.length && urls.length < 4; i++) if (items[i].poster) urls.push(items[i].poster);
        return Promise.all([Promise.all(urls.map(loadImage)), loadImage(mainBadgeUrl(r[0]))]).then(function (got) {
          var imgs = got[0], posters = [];
          for (var k = 0; k < 4; k++) {
            posters.push(imgs[k] || { h: HUES[k], letter: String.fromCharCode(65 + k) });
          }
          return profileData(me, stats, lists.length, posters, got[1]);
        });
      });
      return cache;
    }

    open({
      param: "user-" + me.public_id,
      link: link,
      text: text,
      name: me.display_name,
      make: function (fmt) {
        return load().then(function (d) { return FX.cards.render("profile", d, fmt); });
      }
    });
  }

  // ---------- movie / series ----------
  // ctx = { item: {media_type, tmdb_id, poster}, data: the title page data, name: my name }
  function titleShare(ctx) {
    var item = ctx && ctx.item, data = (ctx && ctx.data) || {};
    if (!item || !item.tmdb_id) return;
    var isTv = item.media_type === "tv";
    var l = lang(), cl = cardLang(), fa = cl === "fa";
    var param = "title-" + (isTv ? "tv" : "movie") + "-" + item.tmdb_id;
    var link = "https://t.me/flicksyrobot?startapp=" + param;
    var name = data.title || item.title || item.name || "Flicksy";
    var loc = l === "fa" ? "fa-IR" : l === "ar" ? "ar-EG" : "en-US";
    function num(n) { return Number(n).toLocaleString(loc, { maximumFractionDigits: 1 }); }

    var meta = [];
    if (data.year) meta.push(String(data.year).replace(/\d/g, function (c) { return fa ? Number(c).toLocaleString(loc) : c; }));
    if (!isTv && data.runtime) {
      var h = Math.floor(data.runtime / 60), m = data.runtime % 60;
      meta.push(I18N.t(h > 0 ? "runtime_hm" : "runtime_m", { h: h, m: m }));
    }
    if (isTv && data.seasons) meta.push(I18N.t("seasons_n", { n: data.seasons }).replace(/\d+/, function (x) { return fa ? num(x) : x; }));
    if (data.genres && data.genres.length) meta.push(data.genres.slice(0, 2).join(fa ? "، " : ", "));
    var kind = I18N.t(isTv ? "type_tv" : "type_movie");
    var cache = null;

    function load() {
      if (cache) return cache;
      cache = loadImage(data.poster || item.poster).then(function (img) {
        var d = {
          lang: cl,
          type: isTv ? "series" : "movie",
          kind: fa ? kind : kind.toUpperCase(),
          title: name,
          orig: data.original_title && data.original_title !== name ? data.original_title : "",
          meta: meta.join(" · "),
          rating: data.rating ? num(data.rating) : "",
          outOf: T("outof"),
          tagline: T("tag"),
          poster: img || { h: isTv ? 200 : 28, letter: String(name).charAt(0).toUpperCase() }
        };
        if (data.my_rating && ctx.name) {
          d.who = ctx.name;
          d.rated = T("rated").replace("{n}", num(data.my_rating));
        }
        return d;
      });
      return cache;
    }

    open({
      param: param,
      link: link,
      text: name,
      name: name,
      make: function (fmt) { return load().then(function (d) { return FX.cards.render("title", d, fmt); }); }
    });
  }

  // ---------- people (actors, directors ...) ----------
  // ctx = { id, name, photo, department, bio, movies, series (counts), total, known_for: [titles] }. Uses the title card look with the photo as the picture.
  function personShare(ctx) {
    if (!ctx || !ctx.id) return;
    var cl = cardLang(), fa = cl === "fa";
    var param = "person-" + ctx.id;
    var link = "https://t.me/flicksyrobot?startapp=" + param;
    var name = ctx.name || "Flicksy";
    var dk = "pp_d_" + (ctx.department || "Acting");
    var kindText = I18N.t(dk);
    if (kindText === dk) kindText = I18N.t("pp_d_Acting");
    var cache = null;
    var loc = lang() === "fa" ? "fa-IR" : lang() === "ar" ? "ar-EG" : "en-US";
    // a few lines of biography; the card cuts it with "..." after three lines. No biography: the best-known titles instead.
    var bio = String(ctx.bio || "").replace(/\s+/g, " ").trim().slice(0, 260);
    var meta = bio || (ctx.known_for || []).slice(0, 3).join(fa ? "، " : " · ");
    // how many movies and how many series (a pill each); old data without the split shows one total
    var counts = [];
    if (ctx.movies) counts.push({ icon: "film", text: T("cmov").replace("{n}", Number(ctx.movies).toLocaleString(loc)) });
    if (ctx.series) counts.push({ icon: "tv", text: T("cser").replace("{n}", Number(ctx.series).toLocaleString(loc)) });
    if (!counts.length && ctx.total) counts.push({ icon: "film", text: T("ltitles").replace("{n}", Number(ctx.total).toLocaleString(loc)) });

    function load() {
      if (cache) return cache;
      cache = loadImage(ctx.photo).then(function (img) {
        return {
          lang: cl,
          type: "person",
          kind: fa ? kindText : kindText.toUpperCase(),
          title: name,
          orig: "",
          meta: meta,
          metaLines: 3,
          counts: counts,
          rating: "",
          outOf: "",
          tagline: T("tag"),
          poster: img || { h: 265, letter: String(name).charAt(0).toUpperCase() }
        };
      });
      return cache;
    }

    open({
      param: param,
      link: link,
      text: name,
      name: name,
      make: function (fmt) { return load().then(function (d) { return FX.cards.render("title", d, fmt); }); }
    });
  }

  // ---------- lists ----------
  // the picture shown when the list is sent from @flicksyrobot (inline) follows the new look; only the owner can set it
  function refreshInline(l, canvas) {
    try {
      FX.api("/api/list-share-image", { method: "POST", body: { code: l.share_code, image: canvas.toDataURL("image/jpeg", 0.85) } }).catch(function () {});
    } catch (e) {}
  }

  // l = the list (title, share_code, owner_name, items[], visibility). Private lists are not shared (checked by the caller).
  function listShare(l, shareText) {
    if (!l || !l.share_code) return;
    var cl = cardLang(), loc = lang() === "fa" ? "fa-IR" : lang() === "ar" ? "ar-EG" : "en-US";
    var param = "list-" + l.share_code;
    var link = "https://t.me/flicksyrobot?startapp=" + param;
    var text = shareText || l.title;
    var items = l.items || [];
    var cache = null, refreshed = false;

    function load() {
      if (cache) return cache;
      var urls = [];
      for (var i = 0; i < items.length && urls.length < 5; i++) if (items[i].poster) urls.push(items[i].poster);
      var fol = FX.api("/api/list-follow?code=" + encodeURIComponent(l.share_code)).then(function (r) {
        return (r && r.status === 200 && r.data && r.data.followers) || 0;
      }).catch(function () { return 0; });
      cache = Promise.all([fol, Promise.all(urls.map(loadImage))]).then(function (r) {
        var nf = fmtNum(r[0], lang());
        var posters = [];
        for (var k = 0; k < 5; k++) posters.push(r[1][k] || { h: HUES[k % 4], letter: String.fromCharCode(65 + k) });
        var owner = l.owner_name || "Flicksy";
        return {
          lang: cl,
          kind: T("lkind"),
          title: l.title,
          by: T("lby"),
          owner: owner,
          items: T("ltitles").replace("{n}", Number(items.length).toLocaleString(loc)),
          followers: T("lfollowers").replace("{n}", nf.v + (nf.u ? " " + nf.u : "")),
          tagline: T("tag"),
          posters: posters
        };
      });
      return cache;
    }

    open({
      param: param,
      link: link,
      text: text,
      name: l.title,
      formats: ["chat", "story"],
      make: function (fmt) {
        return load().then(function (d) { return FX.cards.render("list", d, fmt); }).then(function (canvas) {
          if (fmt === "chat" && !refreshed) { refreshed = true; refreshInline(l, canvas); }
          return canvas;
        });
      }
    });
  }

  // ---------- recap (this month / this year) ----------
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function ymd(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }

  // Persian calendar for fa / ar, Gregorian for the others
  function persianParts(d) {
    var p = new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", { year: "numeric", month: "numeric", day: "numeric" }).formatToParts(d);
    var o = {};
    p.forEach(function (x) { if (x.type === "year" || x.type === "month" || x.type === "day") o[x.type] = parseInt(x.value, 10); });
    return o;
  }

  function periodOf(kind) {
    var l = lang(), jal = l === "fa" || l === "ar", now = new Date(), from;
    var loc = l === "fa" ? "fa-IR-u-ca-persian" : l === "ar" ? "ar-u-ca-persian" : l + "-u-ca-gregory";
    if (jal) {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (kind === "month") {
        from.setDate(from.getDate() - (persianParts(now).day - 1));
      } else {
        for (var i = 0; i < 372; i++) {
          var p = persianParts(from);
          if (p.month === 1 && p.day === 1) break;
          from.setDate(from.getDate() - 1);
        }
      }
    } else {
      from = kind === "month" ? new Date(now.getFullYear(), now.getMonth(), 1) : new Date(now.getFullYear(), 0, 1);
    }
    var label;
    try {
      label = new Intl.DateTimeFormat(loc, kind === "month" ? { month: "long", year: "numeric" } : { year: "numeric" }).format(now);
    } catch (e) { label = String(now.getFullYear()); }
    return { from: ymd(from), to: ymd(now), label: label };
  }

  // the same period written the way a link carries it: 20261101-20261107
  function compact(day) { return String(day).replace(/-/g, ""); }
  function expand(c) { return c.slice(0, 4) + "-" + c.slice(4, 6) + "-" + c.slice(6, 8); }

  // "November 2026" or "2026" for a period that came from a link (a month if it is about a month long)
  function labelOfPeriod(from, to) {
    var l = lang(), jal = l === "fa" || l === "ar";
    var loc = l === "fa" ? "fa-IR-u-ca-persian" : l === "ar" ? "ar-u-ca-persian" : l + "-u-ca-gregory";
    var a = new Date(from + "T12:00:00Z"), b = new Date(to + "T12:00:00Z");
    var month = (b - a) / 86400000 < 40;
    try {
      return new Intl.DateTimeFormat(loc, month ? { month: "long", year: "numeric", timeZone: "UTC" } : { year: "numeric", timeZone: "UTC" }).format(b);
    } catch (e) { return jal ? to : to.slice(0, 4); }
  }

  // Opens a recap that arrived by link (recap-ID-FROM-TO): a sheet with that person's numbers.
  function openRecapLink(pid, fromC, toC) {
    var from = expand(fromC), to = expand(toC), loc = lang() === "fa" ? "fa-IR" : lang() === "ar" ? "ar-EG" : "en-US";
    FX.openSheet(function (sh) {
      var box = el("div");
      sh.appendChild(box);
      box.appendChild(FX.msg(I18N.t("loading")));
      FX.api("/api/recap?from=" + from + "&to=" + to + "&lang=" + cardLang() + "&id=" + encodeURIComponent(pid)).then(function (res) {
        box.textContent = "";
        if (res.status !== 200 || !res.data || !res.data.person) { box.appendChild(FX.msg(T("rnone"))); return; }
        var r = res.data, p = r.person;
        box.appendChild(el("div", "sheet-title", p.display_name || "Flicksy"));
        var pill = el("div", "");
        pill.textContent = labelOfPeriod(from, to);
        pill.style.cssText = "display:inline-block;font-size:12px;font-weight:700;padding:4px 12px;border-radius:99px;background:rgba(139,92,246,.22);color:#d8c8ff;margin-bottom:6px";
        box.appendChild(pill);
        if (r.locked) {
          var lk = el("p", "", T("rlocked"));
          lk.style.cssText = "color:var(--muted,#a3a3c4);line-height:1.8;margin:10px 0 4px";
          box.appendChild(lk);
        } else if (!r.movies && !r.episodes) {
          var no = el("p", "", T("rnone"));
          no.style.cssText = "color:var(--muted,#a3a3c4);line-height:1.8;margin:10px 0 4px";
          box.appendChild(no);
        } else {
          var hrs = r.minutes / 60;
          var big = el("div", "", hrs.toLocaleString(loc, { maximumFractionDigits: hrs >= 10 ? 0 : 1 }));
          big.style.cssText = "font-size:54px;font-weight:800;line-height:1.1;margin-top:6px;background:linear-gradient(135deg,#c084fc,#6366f1);-webkit-background-clip:text;background-clip:text;color:transparent";
          box.appendChild(big);
          var sub = el("div", "", T("rlbl"));
          sub.style.cssText = "color:var(--muted,#a3a3c4);font-size:13px;margin-bottom:14px";
          box.appendChild(sub);
          var grid = el("div", "");
          grid.style.cssText = "display:grid;grid-template-columns:repeat(3,1fr);gap:8px";
          [[r.movies, T("rmov")], [r.episodes, T("repi")], [r.streak, T("rstreak")]].forEach(function (c) {
            var cell = el("div", "");
            cell.style.cssText = "background:rgba(255,255,255,.07);border-radius:14px;padding:12px 4px;text-align:center";
            var v = el("div", "", Number(c[0]).toLocaleString(loc));
            v.style.cssText = "font-size:20px;font-weight:800";
            var l = el("div", "", c[1]);
            l.style.cssText = "font-size:11.5px;color:var(--muted,#a3a3c4);margin-top:2px";
            cell.appendChild(v); cell.appendChild(l); grid.appendChild(cell);
          });
          box.appendChild(grid);
          if (r.genre) {
            var gl = el("div", "", T("rgenre") + ": " + r.genre);
            gl.style.cssText = "margin-top:12px;font-size:13px;color:var(--muted,#a3a3c4)";
            box.appendChild(gl);
          }
        }
        var go = el("button", "btn glass block", T("rprof"));
        go.type = "button";
        go.addEventListener("click", function () { FX.closeSheet(); if (FX.openProfile) FX.openProfile(p.public_id); });
        box.appendChild(go);
        if (!p.is_me) {
          var mine = el("button", "btn primary block", T("rmine"));
          mine.type = "button";
          mine.addEventListener("click", function () { FX.closeSheet(); FX.share.recap(FX.me ? FX.me() : null); });
          box.appendChild(mine);
        }
      }).catch(function () { box.textContent = ""; box.appendChild(FX.msg(T("fail"))); });
    });
  }

  function recapShare(me) {
    if (!me || !me.public_id) return;
    FX.openSheet(function (sh) {
      sh.appendChild(el("div", "sheet-title", I18N.t("pf_yir")));
      var list = el("div", "settings");
      list.style.marginTop = "10px";
      [["month", "rmonth"], ["year", "ryear"]].forEach(function (k) {
        list.appendChild(row(IC.story, T(k[1]), function () { recapStart(me, k[0]); }));
      });
      sh.appendChild(list);
    });
  }

  function recapStart(me, kind) {
    var per = periodOf(kind), l = lang(), cl = cardLang();
    var loc = l === "fa" ? "fa-IR" : l === "ar" ? "ar-EG" : "en-US";
    FX.closeSheet();
    FX.toast(T("preparing"));
    FX.api("/api/recap?from=" + per.from + "&to=" + per.to + "&lang=" + cl).then(function (res) {
      if (res.status !== 200 || !res.data) throw new Error("recap");
      var r = res.data;
      if (!r.movies && !r.episodes) { FX.toast(T("rempty")); return; }
      function num(n, max) { return Number(n).toLocaleString(loc, { maximumFractionDigits: max || 0 }); }
      var hrs = r.minutes / 60;
      var name = me.display_name || "Flicksy";
      var cache = null;

      function load() {
        if (cache) return cache;
        var top = r.top || [];
        var prof = FX.api("/api/profile?id=" + encodeURIComponent(me.public_id)).catch(function () { return null; });
        cache = Promise.all([Promise.all([0, 1, 2].map(function (i) { return loadImage(top[i] && top[i].poster); })), prof.then(function (pr) { return loadImage(mainBadgeUrl(pr)); })]).then(function (got) {
          var imgs = got[0], posters = [];
          for (var k = 0; k < 3; k++) posters.push(imgs[k] || { h: HUES[k], letter: String((top[k] && top[k].title) || String.fromCharCode(65 + k)).charAt(0).toUpperCase() });
          return {
            lang: cl,
            period: per.label,
            name: name,
            un: me.username ? "@" + me.username : String(me.public_id || ""),
            ini: (Array.from(name)[0] || "F").toUpperCase(),
            hours: num(hrs, hrs >= 10 ? 0 : 1),
            unit: T("runit"),
            lbl: T("rlbl"),
            tiles: [
              { v: num(r.movies), l: T("rmov") },
              { v: num(r.episodes), l: T("repi") },
              { v: num(r.streak), l: T("rstreak") }
            ],
            genre: { v: r.genre || "—", l: T("rgenre") },
            cap: top[0] ? T("rtop").replace("{t}", top[0].title) : T("rtops"),
            capStory: T("rtops"),
            tagline: T("tag"),
            posters: posters,
            badgeImg: got[1]
          };
        });
        return cache;
      }

      // the link opens this very period of this person's recap (recap-ID-FROM-TO)
      var rparam = "recap-" + me.public_id + "-" + compact(per.from) + "-" + compact(per.to);
      open({
        param: rparam,
        link: "https://t.me/flicksyrobot?startapp=" + rparam,
        text: I18N.t("pf_share_text", { name: name }),
        name: name,
        make: function (fmt) { return load().then(function (d) { return FX.cards.render("recap", d, fmt); }); }
      });
    }).catch(function () { FX.toast(T("fail"), true); });
  }

  FX.share = { open: open, profile: profile, title: titleShare, person: personShare, list: listShare, recap: recapShare, openRecapLink: openRecapLink };
})();
