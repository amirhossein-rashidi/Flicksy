// Activity tab: "Following" (feed of people you follow) and "Leaderboard" (movies / episodes).
// It takes over #view-activity whenever app.js draws the tab.
(function () {
  "use strict";
  if (!window.FX || !window.I18N) return;
  var FX = window.FX;

  // ---------- texts (English and Persian; other languages fall back to English) ----------
  var EXTRA = {
    en: {
      ac_sub: "Activity from {n} people you follow",
      ac_empty: "You are not following anyone yet.<br>Start from the leaderboard.",
      ac_quiet: "Nothing new from the people you follow yet.",
      ac_more: "Show more",
      ac_movies: "Movies",
      ac_episodes: "Episodes",
      ac_lists: "Lists",
      ac_lists_empty: "No lists on the leaderboard yet.",
      ac_list_sub: "by {name} · {n} Followers",
      ac_you: "You",
      ac_followers: "followers",
      ac_follow: "Follow",
      ac_following: "Following",
      ac_requested: "Requested",
      ac_board_empty: "Nobody is on the leaderboard yet.",
      ac_err: "Could not load. Check your connection and try again.",
      ac_retry: "Try again",
      ac_rated: "{name} rated {title} {v}/10",
      ac_watched_m: "{name} watched {title}",
      ac_watched_t: "{name} watched the series {title}",
      ac_rewatched: "{name} watched {title} again",
      ac_watching: "{name} started watching {title}",
      ac_want: "{name} wants to watch {title}",
      ac_paused: "{name} paused {title}",
      ac_dropped: "{name} dropped {title}",
      ac_list_create: "{name} created the list {list}",
      ac_list_add: "{name} added {title} to {list}"
    },
    fa: {
      ac_sub: "فعالیت {n} نفری که دنبال می‌کنی",
      ac_empty: "هنوز کسی رو دنبال نمی‌کنی.<br>از لیدربرد شروع کن.",
      ac_quiet: "هنوز فعالیت تازه‌ای از دنبال‌شده‌هات نیست.",
      ac_more: "نمایش بیشتر",
      ac_movies: "فیلم‌ها",
      ac_episodes: "قسمت‌ها",
      ac_lists: "لیست‌ها",
      ac_lists_empty: "هنوز لیستی در لیدربرد نیست.",
      ac_list_sub: "از {name} · {n} دنبال‌کننده",
      ac_you: "تو",
      ac_followers: "دنبال‌کننده",
      ac_follow: "دنبال کن",
      ac_following: "دنبال می‌کنی",
      ac_requested: "درخواست داده‌ای",
      ac_board_empty: "هنوز کسی در لیدربرد نیست.",
      ac_err: "بارگذاری نشد. اینترنت را بررسی کن و دوباره امتحان کن.",
      ac_retry: "تلاش دوباره",
      ac_rated: "{name} به {title} نمره {v} داد",
      ac_watched_m: "{name} فیلم {title} را دید",
      ac_watched_t: "{name} سریال {title} را دید",
      ac_rewatched: "{name} دوباره {title} را دید",
      ac_watching: "{name} شروع به دیدن {title} کرد",
      ac_want: "{name} می‌خواد {title} را ببیند",
      ac_paused: "{name} {title} را متوقف کرد",
      ac_dropped: "{name} {title} را رها کرد",
      ac_list_create: "{name} لیست {list} را ساخت",
      ac_list_add: "{name} {title} را به لیست {list} اضافه کرد"
    },
    ar: {
      ac_sub: "نشاط {n} ممن تتابعهم",
      ac_empty: "لا تتابع أحداً بعد.<br>ابدأ من لوحة المتصدرين.",
      ac_quiet: "لا جديد من الذين تتابعهم حتى الآن.",
      ac_more: "عرض المزيد",
      ac_movies: "الأفلام",
      ac_episodes: "الحلقات",
      ac_lists: "القوائم",
      ac_lists_empty: "لا قوائم في لوحة المتصدرين بعد.",
      ac_list_sub: "بواسطة {name} · {n} متابع",
      ac_you: "أنت",
      ac_followers: "متابع",
      ac_follow: "تابع",
      ac_following: "تتابعه",
      ac_requested: "تم الطلب",
      ac_board_empty: "لا أحد في لوحة المتصدرين بعد.",
      ac_err: "تعذّر التحميل. تحقق من اتصالك وحاول مرة أخرى.",
      ac_retry: "حاول مجدداً",
      ac_rated: "{name} قيّم {title} بـ {v}/10",
      ac_watched_m: "{name} شاهد {title}",
      ac_watched_t: "{name} شاهد مسلسل {title}",
      ac_rewatched: "{name} شاهد {title} مرة أخرى",
      ac_watching: "{name} بدأ مشاهدة {title}",
      ac_want: "{name} يريد مشاهدة {title}",
      ac_paused: "{name} أوقف {title} مؤقتاً",
      ac_dropped: "{name} تخلّى عن {title}",
      ac_list_create: "{name} أنشأ القائمة {list}",
      ac_list_add: "{name} أضاف {title} إلى {list}"
    },
    tr: {
      ac_sub: "Takip ettiğin {n} kişinin etkinliği",
      ac_empty: "Henüz kimseyi takip etmiyorsun.<br>Liderlik tablosundan başla.",
      ac_quiet: "Takip ettiklerinden henüz yeni bir şey yok.",
      ac_more: "Daha fazla göster",
      ac_movies: "Filmler",
      ac_episodes: "Bölümler",
      ac_lists: "Listeler",
      ac_lists_empty: "Liderlik tablosunda henüz liste yok.",
      ac_list_sub: "{name} · {n} takipçi",
      ac_you: "Sen",
      ac_followers: "takipçi",
      ac_follow: "Takip et",
      ac_following: "Takip ediyorsun",
      ac_requested: "İstek gönderildi",
      ac_board_empty: "Liderlik tablosunda henüz kimse yok.",
      ac_err: "Yüklenemedi. Bağlantını kontrol edip tekrar dene.",
      ac_retry: "Tekrar dene",
      ac_rated: "{name}, {title} için {v}/10 verdi",
      ac_watched_m: "{name}, {title} filmini izledi",
      ac_watched_t: "{name}, {title} dizisini izledi",
      ac_rewatched: "{name}, {title} yapımını tekrar izledi",
      ac_watching: "{name}, {title} izlemeye başladı",
      ac_want: "{name}, {title} yapımını izlemek istiyor",
      ac_paused: "{name}, {title} yapımını beklemeye aldı",
      ac_dropped: "{name}, {title} yapımını bıraktı",
      ac_list_create: "{name}, {list} listesini oluşturdu",
      ac_list_add: "{name}, {title} yapımını {list} listesine ekledi"
    },
    ru: {
      ac_sub: "Активность {n} человек, на которых ты подписан",
      ac_empty: "Ты пока ни на кого не подписан.<br>Начни с рейтинга.",
      ac_quiet: "От тех, на кого ты подписан, пока ничего нового.",
      ac_more: "Показать ещё",
      ac_movies: "Фильмы",
      ac_episodes: "Серии",
      ac_lists: "Списки",
      ac_lists_empty: "В рейтинге пока нет списков.",
      ac_list_sub: "от {name} · подписчиков: {n}",
      ac_you: "Ты",
      ac_followers: "подписчиков",
      ac_follow: "Подписаться",
      ac_following: "Ты подписан",
      ac_requested: "Запрос отправлен",
      ac_board_empty: "В рейтинге пока никого нет.",
      ac_err: "Не удалось загрузить. Проверь интернет и попробуй ещё раз.",
      ac_retry: "Попробовать снова",
      ac_rated: "{name} оценил(а) {title} на {v}/10",
      ac_watched_m: "{name} посмотрел(а) {title}",
      ac_watched_t: "{name} посмотрел(а) сериал {title}",
      ac_rewatched: "{name} пересмотрел(а) {title}",
      ac_watching: "{name} начал(а) смотреть {title}",
      ac_want: "{name} хочет посмотреть {title}",
      ac_paused: "{name} поставил(а) {title} на паузу",
      ac_dropped: "{name} бросил(а) {title}",
      ac_list_create: "{name} создал(а) список {list}",
      ac_list_add: "{name} добавил(а) {title} в список {list}"
    },
    es: {
      ac_sub: "Actividad de {n} personas que sigues",
      ac_empty: "Aún no sigues a nadie.<br>Empieza por el ranking.",
      ac_quiet: "Todavía no hay novedades de la gente que sigues.",
      ac_more: "Ver más",
      ac_movies: "Películas",
      ac_episodes: "Episodios",
      ac_lists: "Listas",
      ac_lists_empty: "Aún no hay listas en el ranking.",
      ac_list_sub: "de {name} · {n} seguidores",
      ac_you: "Tú",
      ac_followers: "seguidores",
      ac_follow: "Seguir",
      ac_following: "Siguiendo",
      ac_requested: "Solicitado",
      ac_board_empty: "Aún no hay nadie en el ranking.",
      ac_err: "No se pudo cargar. Revisa tu conexión e inténtalo de nuevo.",
      ac_retry: "Reintentar",
      ac_rated: "{name} puntuó {title} con {v}/10",
      ac_watched_m: "{name} vio {title}",
      ac_watched_t: "{name} vio la serie {title}",
      ac_rewatched: "{name} volvió a ver {title}",
      ac_watching: "{name} empezó a ver {title}",
      ac_want: "{name} quiere ver {title}",
      ac_paused: "{name} puso {title} en pausa",
      ac_dropped: "{name} abandonó {title}",
      ac_list_create: "{name} creó la lista {list}",
      ac_list_add: "{name} añadió {title} a {list}"
    },
    fr: {
      ac_sub: "Activité de {n} personnes que tu suis",
      ac_empty: "Tu ne suis personne pour l'instant.<br>Commence par le classement.",
      ac_quiet: "Rien de nouveau chez les gens que tu suis.",
      ac_more: "Voir plus",
      ac_movies: "Films",
      ac_episodes: "Épisodes",
      ac_lists: "Listes",
      ac_lists_empty: "Aucune liste dans le classement pour l'instant.",
      ac_list_sub: "par {name} · {n} abonnés",
      ac_you: "Toi",
      ac_followers: "abonnés",
      ac_follow: "Suivre",
      ac_following: "Abonné",
      ac_requested: "Demandé",
      ac_board_empty: "Personne dans le classement pour l'instant.",
      ac_err: "Impossible de charger. Vérifie ta connexion et réessaie.",
      ac_retry: "Réessayer",
      ac_rated: "{name} a noté {title} {v}/10",
      ac_watched_m: "{name} a regardé {title}",
      ac_watched_t: "{name} a regardé la série {title}",
      ac_rewatched: "{name} a revu {title}",
      ac_watching: "{name} a commencé {title}",
      ac_want: "{name} veut regarder {title}",
      ac_paused: "{name} a mis {title} en pause",
      ac_dropped: "{name} a abandonné {title}",
      ac_list_create: "{name} a créé la liste {list}",
      ac_list_add: "{name} a ajouté {title} à {list}"
    },
    de: {
      ac_sub: "Aktivität von {n} Leuten, denen du folgst",
      ac_empty: "Du folgst noch niemandem.<br>Fang bei der Bestenliste an.",
      ac_quiet: "Von den Leuten, denen du folgst, gibt es noch nichts Neues.",
      ac_more: "Mehr anzeigen",
      ac_movies: "Filme",
      ac_episodes: "Folgen",
      ac_lists: "Listen",
      ac_lists_empty: "Noch keine Listen in der Bestenliste.",
      ac_list_sub: "von {name} · {n} Follower",
      ac_you: "Du",
      ac_followers: "Follower",
      ac_follow: "Folgen",
      ac_following: "Folgst du",
      ac_requested: "Angefragt",
      ac_board_empty: "Noch niemand in der Bestenliste.",
      ac_err: "Laden fehlgeschlagen. Prüf deine Verbindung und versuch es nochmal.",
      ac_retry: "Nochmal versuchen",
      ac_rated: "{name} hat {title} mit {v}/10 bewertet",
      ac_watched_m: "{name} hat {title} gesehen",
      ac_watched_t: "{name} hat die Serie {title} gesehen",
      ac_rewatched: "{name} hat {title} nochmal gesehen",
      ac_watching: "{name} hat angefangen, {title} zu schauen",
      ac_want: "{name} möchte {title} sehen",
      ac_paused: "{name} hat {title} pausiert",
      ac_dropped: "{name} hat {title} abgebrochen",
      ac_list_create: "{name} hat die Liste {list} erstellt",
      ac_list_add: "{name} hat {title} zu {list} hinzugefügt"
    }
  };
  var baseT = window.I18N.t;
  window.I18N.t = function (key, params) {
    var table = EXTRA[window.I18N.lang];
    var text = table ? table[key] : undefined;
    if (text === undefined) text = EXTRA.en[key];
    if (text === undefined) return baseT.call(window.I18N, key, params);
    if (params) {
      Object.keys(params).forEach(function (k) { text = text.split("{" + k + "}").join(String(params[k])); });
    }
    return text;
  };
  var t = function (k, p) { return window.I18N.t(k, p); };
  var el = FX.el, clear = FX.clear;

  // ---------- helpers ----------
  function nf(n) {
    try { return Number(n).toLocaleString(I18N.lang === "fa" ? "fa-IR" : undefined); } catch (e) { return String(n); }
  }

  function ago(at) {
    if (!at) return "";
    var d = new Date(String(at).replace(" ", "T") + "Z");
    if (isNaN(d.getTime())) return "";
    var sec = Math.round((d.getTime() - Date.now()) / 1000);
    if (sec > 0) sec = 0;
    var abs = Math.abs(sec), unit = "second", val = sec;
    if (abs >= 86400) { unit = "day"; val = Math.round(sec / 86400); }
    else if (abs >= 3600) { unit = "hour"; val = Math.round(sec / 3600); }
    else if (abs >= 60) { unit = "minute"; val = Math.round(sec / 60); }
    try { return new Intl.RelativeTimeFormat(I18N.lang, { numeric: "auto" }).format(val, unit); } catch (e) { return d.toLocaleDateString(); }
  }

  function personAvatar(p, cls) {
    var box;
    if (p.photo_url) {
      box = el("img", "avatar " + cls);
      box.src = p.photo_url;
      box.alt = "";
    } else {
      box = el("div", "avatar " + cls, (p.display_name || "?").charAt(0).toUpperCase());
    }
    return box;
  }

  // Fills a translated sentence; {name}, {title} and {list} are shown bold, {v} as a number.
  function sentence(key, vars) {
    var text = t(key);
    var out = el("span", "ac-text");
    var re = /\{(name|title|list|v)\}/g;
    var last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) out.appendChild(document.createTextNode(text.slice(last, m.index)));
      var val = vars[m[1]] === undefined ? "" : vars[m[1]];
      if (m[1] === "v") out.appendChild(document.createTextNode(nf(val)));
      else out.appendChild(el("bdi", "", val));
      last = re.lastIndex;
    }
    if (last < text.length) out.appendChild(document.createTextNode(text.slice(last)));
    return out;
  }

  function eventKey(a) {
    if (a.type === "rating") return "ac_rated";
    if (a.type === "list_create") return "ac_list_create";
    if (a.type === "list_add") return "ac_list_add";
    if (a.type === "status") {
      if (a.value === "watched") return a.title && a.title.media_type === "tv" ? "ac_watched_t" : "ac_watched_m";
      if (["watching", "want", "paused", "dropped", "rewatched"].indexOf(a.value) >= 0) return "ac_" + a.value;
    }
    return null;
  }

  function openPerson(p) { if (FX.openProfile && p && p.public_id) FX.openProfile(p.public_id); }

  function openTitle(a) {
    if (a.title && FX.openDetail) FX.openDetail({ tmdb_id: a.title.tmdb_id, media_type: a.title.media_type, title: a.title.title, title_en: a.title.title_en, year: a.title.year, poster: a.title.poster });
    else if (a.list && FX.openListByCode) FX.openListByCode(a.list.share_code);
  }

  function who(a) {
    var b = el("button", "ac-who");
    b.type = "button";
    b.appendChild(personAvatar(a.person, "ac-av"));
    b.addEventListener("click", function (e) { e.stopPropagation(); openPerson(a.person); });
    return b;
  }

  // ---------- feed cards ----------
  function ticket(a) {
    var key = eventKey(a);
    var card = el("div", "ac-tk");
    var top = el("div", "ac-tp");
    if (a.title) { var po = el("div", "ac-po"); po.appendChild(FX.posterNode(a.title)); top.appendChild(po); }
    var tx = el("div", "ac-tx");
    var vh = el("div", "ac-vh");
    vh.appendChild(who(a));
    vh.appendChild(sentence(key, { name: a.person.display_name, title: a.title ? FX.displayTitle(a.title) : "", v: a.value }));
    tx.appendChild(vh);
    top.appendChild(tx);
    var sc = el("div", "ac-sco");
    sc.appendChild(el("b", "", nf(a.value)));
    sc.appendChild(el("small", "", "/" + nf(10)));
    top.appendChild(sc);
    card.appendChild(top);
    card.appendChild(el("div", "ac-sb", ago(a.at)));
    card.addEventListener("click", function () { openTitle(a); });
    return card;
  }

  function miniCard(a) {
    var key = eventKey(a);
    var card = el("div", "ac-mc");
    card.appendChild(who(a));
    var mx = el("div", "ac-mx");
    mx.appendChild(sentence(key, { name: a.person.display_name, title: a.title ? FX.displayTitle(a.title) : "", list: a.list ? a.list.title : "" }));
    mx.appendChild(el("small", "", ago(a.at)));
    card.appendChild(mx);
    if (a.title) { var po = el("div", "ac-po ac-po-s"); po.appendChild(FX.posterNode(a.title)); card.appendChild(po); }
    card.addEventListener("click", function () { openTitle(a); });
    return card;
  }

  // ---------- state ----------
  var view = document.getElementById("view-activity");
  var tab = "following";   // following | board
  var kind = "movies";     // movies | episodes | lists
  var feedCache = null;    // { at, items, next, following }
  var building = false;
  var obs = null;
  var token = 0;

  function errorBox(retry) {
    var box = el("div", "msg error", t("ac_err"));
    var b = FX.button("chip active ac-retry", t("ac_retry"), retry);
    box.appendChild(document.createElement("br"));
    box.appendChild(b);
    return box;
  }

  // ---------- following ----------
  function drawFeed(holder, my) {
    clear(holder);
    var c = feedCache;
    if (!c.following) {
      var e = el("div", "empty");
      e.appendChild(FX.icon("activity", 44));
      var p = el("p");
      p.innerHTML = t("ac_empty");
      e.appendChild(p);
      holder.appendChild(e);
      return;
    }
    holder.appendChild(el("small", "ac-subline", t("ac_sub", { n: nf(c.following) })));
    var shown = c.items.filter(function (a) { return eventKey(a); });
    if (!shown.length) { holder.appendChild(FX.msg(t("ac_quiet"))); return; }
    shown.forEach(function (a) { holder.appendChild(a.type === "rating" ? ticket(a) : miniCard(a)); });
    if (c.next) {
      var more = FX.button("ac-more", t("ac_more"), function () {
        more.disabled = true;
        FX.api("/api/feed?before=" + c.next).then(function (res) {
          if (res.status !== 200 || !res.data) { more.disabled = false; FX.toast(t("ac_err"), true); return; }
          c.items = c.items.concat(res.data.items || []);
          c.next = res.data.next;
          if (my === token) drawFeed(holder, my);
        }).catch(function () { more.disabled = false; FX.toast(t("ac_err"), true); });
      });
      holder.appendChild(more);
    }
  }

  function loadFeed(holder, my) {
    if (feedCache && Date.now() - feedCache.at < 20000) { drawFeed(holder, my); return; }
    clear(holder);
    holder.appendChild(FX.msg(t("loading")));
    FX.api("/api/feed").then(function (res) {
      if (my !== token) return;
      if (res.status !== 200 || !res.data) { clear(holder); holder.appendChild(errorBox(function () { loadFeed(holder, my); })); return; }
      feedCache = { at: Date.now(), items: res.data.items || [], next: res.data.next, following: res.data.following || 0 };
      drawFeed(holder, my);
    }).catch(function () {
      if (my !== token) return;
      clear(holder);
      holder.appendChild(errorBox(function () { loadFeed(holder, my); }));
    });
  }

  // ---------- leaderboard ----------
  function boardRow(r) {
    var row = el("div", "ac-lr r" + r.rank + (r.is_me ? " me" : ""));
    row.appendChild(el("span", "ac-n", nf(r.rank)));
    row.appendChild(personAvatar(r.person, "ac-lav"));
    var nm = el("div", "ac-nm");
    var b = el("b");
    b.appendChild(el("bdi", "nm-t", r.is_me ? t("ac_you") : r.person.display_name));
    if (r.person.badge && FX.badgeMini) {
      var mini = FX.badgeMini(r.person.badge, 20);
      if (mini) { b.className = "has-bdg"; b.appendChild(mini); }
    }
    nm.appendChild(b);
    nm.appendChild(el("small", "", nf(r.followers) + " " + t("ac_followers")));
    row.appendChild(nm);
    var v = el("div", "ac-v");
    v.appendChild(el("b", "", nf(r.value)));
    v.appendChild(el("small", "", t(kind === "movies" ? "ac_movies" : "ac_episodes")));
    row.appendChild(v);
    if (!r.is_me) row.addEventListener("click", function () { openPerson(r.person); });
    return row;
  }

  // Lists tab: rank number + 3 stacked posters + name + "by X · N Followers". Tap opens the list.
  function listBoardRow(r) {
    var l = r.list;
    var row = el("div", "ac-lr r" + r.rank);
    row.appendChild(el("span", "ac-n", nf(r.rank)));
    var stack = el("div", "mini");
    var posters = (l.posters || []).slice(0, 3);
    if (!posters.length) posters = [null];
    posters.forEach(function (src) {
      var cell = el("div", "mp");
      if (src) {
        var img = el("img");
        img.src = src;
        img.alt = "";
        img.loading = "lazy";
        cell.appendChild(img);
      }
      stack.appendChild(cell);
    });
    row.appendChild(stack);
    var nm = el("div", "ac-nm");
    nm.appendChild(el("b", "", l.title));
    nm.appendChild(el("small", "", t("ac_list_sub", { name: (l.owner && l.owner.display_name) || "", n: nf(l.followers) })));
    row.appendChild(nm);
    row.addEventListener("click", function () { if (FX.openListByCode) FX.openListByCode(l.share_code); });
    return row;
  }

  function loadBoard(holder, my) {
    clear(holder);
    holder.appendChild(FX.msg(t("loading")));
    FX.api("/api/leaderboard?kind=" + kind).then(function (res) {
      if (my !== token) return;
      clear(holder);
      if (res.status !== 200 || !res.data) { holder.appendChild(errorBox(function () { loadBoard(holder, my); })); return; }
      var rows = res.data.rows || [];
      if (!rows.length) { holder.appendChild(FX.msg(t(kind === "lists" ? "ac_lists_empty" : "ac_board_empty"))); return; }
      rows.forEach(function (r) { holder.appendChild(kind === "lists" ? listBoardRow(r) : boardRow(r)); });
    }).catch(function () {
      if (my !== token) return;
      clear(holder);
      holder.appendChild(errorBox(function () { loadBoard(holder, my); }));
    });
  }

  // ---------- the tab ----------
  function build() {
    if (!view) return;
    building = true;
    if (obs) obs.disconnect();
    token += 1;
    var my = token;
    clear(view);

    var bar = el("header", "topbar");
    bar.appendChild(el("h1", "page-title", t("act_title")));
    view.appendChild(bar);

    var seg = el("div", "segment");
    [["following", "act_following"], ["board", "act_board"]].forEach(function (pair) {
      seg.appendChild(FX.button("seg-btn" + (tab === pair[0] ? " active" : ""), t(pair[1]), function () { tab = pair[0]; build(); }));
    });
    view.appendChild(seg);

    var holder = el("div", "ac-body");
    if (tab === "board") {
      var chips = el("div", "chips");
      [["movies", "ac_movies"], ["episodes", "ac_episodes"], ["lists", "ac_lists"]].forEach(function (pair) {
        chips.appendChild(FX.button("chip" + (kind === pair[0] ? " active" : ""), t(pair[1]), function () { kind = pair[0]; build(); }));
      });
      view.appendChild(chips);
      view.appendChild(holder);
      loadBoard(holder, my);
    } else {
      view.appendChild(holder);
      loadFeed(holder, my);
    }

    building = false;
    watch();
  }

  // app.js draws its own placeholder every time the tab opens (or the language changes); we replace it.
  function watch() {
    if (!view) return;
    if (!obs) {
      obs = new MutationObserver(function () {
        if (building) return;
        if (view.querySelector(".ac-body")) return;
        build();
      });
    }
    obs.observe(view, { childList: true });
  }

  // "See all" on Home / Discover: open the Activity tab on Leaderboard > Lists.
  FX.openListsBoard = function () {
    tab = "board";
    kind = "lists";
    if (FX.goTab) FX.goTab("activity");
  };

  watch();
})();
