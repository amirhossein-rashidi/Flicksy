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
      ac_watching: "{name} شروع به دیدن {title} کرد",
      ac_want: "{name} می‌خواد {title} را ببیند",
      ac_paused: "{name} {title} را متوقف کرد",
      ac_dropped: "{name} {title} را رها کرد",
      ac_list_create: "{name} لیست {list} را ساخت",
      ac_list_add: "{name} {title} را به لیست {list} اضافه کرد"
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
      if (["watching", "want", "paused", "dropped"].indexOf(a.value) >= 0) return "ac_" + a.value;
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
    vh.appendChild(sentence(key, { name: a.person.display_name, title: a.title ? a.title.title : "", v: a.value }));
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
    mx.appendChild(sentence(key, { name: a.person.display_name, title: a.title ? a.title.title : "", list: a.list ? a.list.title : "" }));
    mx.appendChild(el("small", "", ago(a.at)));
    card.appendChild(mx);
    if (a.title) { var po = el("div", "ac-po ac-po-s"); po.appendChild(FX.posterNode(a.title)); card.appendChild(po); }
    card.addEventListener("click", function () { openTitle(a); });
    return card;
  }

  // ---------- state ----------
  var view = document.getElementById("view-activity");
  var tab = "following";   // following | board
  var kind = "movies";     // movies | episodes
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
    b.appendChild(el("bdi", "", r.is_me ? t("ac_you") : r.person.display_name));
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

  function loadBoard(holder, my) {
    clear(holder);
    holder.appendChild(FX.msg(t("loading")));
    FX.api("/api/leaderboard?kind=" + kind).then(function (res) {
      if (my !== token) return;
      clear(holder);
      if (res.status !== 200 || !res.data) { holder.appendChild(errorBox(function () { loadBoard(holder, my); })); return; }
      var rows = res.data.rows || [];
      if (!rows.length) { holder.appendChild(FX.msg(t("ac_board_empty"))); return; }
      rows.forEach(function (r) { holder.appendChild(boardRow(r)); });
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
      [["movies", "ac_movies"], ["episodes", "ac_episodes"]].forEach(function (pair) {
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

  watch();
})();
