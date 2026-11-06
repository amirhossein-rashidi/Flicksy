// Flicksy share: one "Share" action for profile, title, recap and lists.
// It opens a small sheet: Telegram chat (message with the picture), Telegram story,
// save picture (pick a size and download it), copy link. Pictures are drawn on demand (see cards.js).
//
//   FX.share.profile(me)   - share my profile
//   FX.share.title(ctx)    - share a movie or series: { item, data, name }
//   FX.share.open(opts)    - generic: { make(fmt) -> Promise<canvas>, link, text, name, param, formats }   fmt = "chat" | "story" | "tw"
(function () {
  "use strict";

  var FX = window.FX;
  if (!FX) return;

  var TXT = {
    fa: { rated: "{n} داد", outof: "از ۱۰", fchat: "چت", fstory: "استوری", ftw: "توییتر و پست", open: "باز کردن در Flicksy", preparing: "در حال آماده‌سازی تصویر...", title: "اشتراک‌گذاری", chat: "ارسال در چت تلگرام", story: "استوری تلگرام", x: "توییتر (X)", save: "ذخیره تصویر", copy: "کپی لینک", copied: "لینک کپی شد", fail: "ارسال نشد، دوباره امتحان کن", bio: "فیلم‌ها و سریال‌هام توی Flicksy", tag: "فیلم و سریال‌هات رو با دوستات دنبال کن", movies: "فیلم", episodes: "قسمت", lists: "لیست", followers: "دنبال‌کننده", thousand: "هزار" },
    en: { rated: "rated it {n}", outof: "/ 10", fchat: "Chat", fstory: "Story", ftw: "Twitter & posts", open: "Open in Flicksy", preparing: "Preparing the picture...", title: "Share", chat: "Send in a Telegram chat", story: "Telegram story", x: "X (Twitter)", save: "Save picture", copy: "Copy link", copied: "Link copied", fail: "Could not share, try again", bio: "My movies & series on Flicksy", tag: "Track movies & series with friends in Telegram", movies: "Movies", episodes: "Episodes", lists: "Lists", followers: "Followers" },
    ar: { rated: "قيّمه {n}", outof: "من 10", fchat: "محادثة", fstory: "قصة", ftw: "تويتر والمنشورات", open: "افتح في Flicksy", preparing: "جارٍ تجهيز الصورة...", title: "مشاركة", chat: "إرسال في محادثة تيليجرام", story: "قصة تيليجرام", x: "إكس (تويتر)", save: "حفظ الصورة", copy: "نسخ الرابط", copied: "تم نسخ الرابط", fail: "تعذّرت المشاركة، حاول مرة أخرى", bio: "أفلامي ومسلسلاتي على Flicksy", tag: "تابع الأفلام والمسلسلات مع أصدقائك على تيليجرام", movies: "أفلام", episodes: "حلقات", lists: "قوائم", followers: "متابعون", thousand: "ألف" },
    tr: { rated: "{n} verdi", outof: "/ 10", fchat: "Sohbet", fstory: "Hikâye", ftw: "Twitter ve gönderi", open: "Flicksy’de aç", preparing: "Görsel hazırlanıyor...", title: "Paylaş", chat: "Telegram sohbetinde gönder", story: "Telegram hikâyesi", x: "X (Twitter)", save: "Görseli kaydet", copy: "Bağlantıyı kopyala", copied: "Bağlantı kopyalandı", fail: "Paylaşılamadı, tekrar dene", bio: "Flicksy'deki filmlerim ve dizilerim", tag: "Telegram'da arkadaşlarınla film ve dizi takip et", movies: "Film", episodes: "Bölüm", lists: "Liste", followers: "Takipçi" },
    ru: { rated: "поставил(а) {n}", outof: "из 10", fchat: "Чат", fstory: "История", ftw: "Twitter и посты", open: "Открыть во Flicksy", preparing: "Готовим картинку...", title: "Поделиться", chat: "Отправить в чат Telegram", story: "История Telegram", x: "X (Twitter)", save: "Сохранить картинку", copy: "Копировать ссылку", copied: "Ссылка скопирована", fail: "Не удалось поделиться, попробуй ещё раз", bio: "Мои фильмы и сериалы на Flicksy", tag: "Следи за фильмами и сериалами вместе с друзьями в Telegram", movies: "Фильмы", episodes: "Серии", lists: "Списки", followers: "Подписчики" },
    es: { rated: "le dio {n}", outof: "/ 10", fchat: "Chat", fstory: "Historia", ftw: "Twitter y publicaciones", open: "Abrir en Flicksy", preparing: "Preparando la imagen...", title: "Compartir", chat: "Enviar en un chat de Telegram", story: "Historia de Telegram", x: "X (Twitter)", save: "Guardar imagen", copy: "Copiar enlace", copied: "Enlace copiado", fail: "No se pudo compartir, inténtalo de nuevo", bio: "Mis películas y series en Flicksy", tag: "Sigue películas y series con tus amigos en Telegram", movies: "Películas", episodes: "Episodios", lists: "Listas", followers: "Seguidores" },
    fr: { rated: "a mis {n}", outof: "/ 10", fchat: "Discussion", fstory: "Story", ftw: "Twitter et publications", open: "Ouvrir dans Flicksy", preparing: "Préparation de l'image...", title: "Partager", chat: "Envoyer dans une discussion Telegram", story: "Story Telegram", x: "X (Twitter)", save: "Enregistrer l'image", copy: "Copier le lien", copied: "Lien copié", fail: "Partage impossible, réessaie", bio: "Mes films et séries sur Flicksy", tag: "Suis des films et séries avec tes amis sur Telegram", movies: "Films", episodes: "Épisodes", lists: "Listes", followers: "Abonnés" },
    de: { rated: "gab {n}", outof: "/ 10", fchat: "Chat", fstory: "Story", ftw: "Twitter & Beiträge", open: "In Flicksy öffnen", preparing: "Bild wird vorbereitet...", title: "Teilen", chat: "In einem Telegram-Chat senden", story: "Telegram-Story", x: "X (Twitter)", save: "Bild speichern", copy: "Link kopieren", copied: "Link kopiert", fail: "Teilen nicht möglich, versuch es nochmal", bio: "Meine Filme und Serien auf Flicksy", tag: "Verfolge Filme und Serien mit Freunden in Telegram", movies: "Filme", episodes: "Folgen", lists: "Listen", followers: "Follower" }
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

  function profileData(me, stats, listCount, posters) {
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
      posters: posters
    };
  }

  var HUES = [230, 35, 12, 265];

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
        return Promise.all(urls.map(loadImage)).then(function (imgs) {
          var posters = [];
          for (var k = 0; k < 4; k++) {
            posters.push(imgs[k] || { h: HUES[k], letter: String.fromCharCode(65 + k) });
          }
          return profileData(me, stats, lists.length, posters);
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

  FX.share = { open: open, profile: profile, title: titleShare };
})();
