(function () {
  "use strict";

  var t = function (key, params) { return I18N.t(key, params); };
  var $ = function (id) { return document.getElementById(id); };

  // Small bridge so extra feature files (like lists.js) can plug into the app.
  var FX = window.FX = { hooks: {}, backStack: [] };

  // New look: each new element shows only when its flag is true (and its data is there). The backend steps turn them on one by one.
  var FEATURES = FX.features = { reminders: false, rewatch: true, spoiler: false, trailer: true, commentsRow: false, friendsRow: true, profileTabs: false };

  var STATUS_ORDER = ["want", "watching", "watched", "paused", "dropped"];
  var LS_LANG = "flicksy_lang";
  var TABS = ["home", "discover", "activity", "library", "profile"];
  var TAB_ICON = { home: "home", discover: "compass", activity: "activity", library: "bookmark", profile: "user" };

  // ---------- state ----------
  var initData = "";
  var me = null;
  var currentTab = "home";
  var mine = {};          // "type:id" -> { status, rating }   (the user's own state, shared by all screens)
  var rowsCache = {};     // "lang:kind" -> { items } or { promise }
  var library = { items: [], loaded: false, stale: true, loading: null };
  var detailStack = [];
  var heroTimer = null;
  var disc = { q: "", filter: "all", tab: "titles", results: [], status: "idle", timer: null, controller: null };
  var libView = { type: "all", status: null };
  var tg = null;

  // ---------- icons (drawn with code, no files) ----------
  var ICONS = {
    home: ["M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"],
    compass: ["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z", "M16 8l-2 6-6 2 2-6z"],
    bookmark: ["M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"],
    user: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M4 21a8 8 0 0 1 16 0"],
    star: ["M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"],
    check: ["M5 12.5l4.5 4.5L19 7"],
    plus: ["M12 5v14M5 12h14"],
    chevron: ["M9 6l6 6-6 6"],
    back: ["M15 5l-7 7 7 7"],
    globe: ["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z", "M2 12h20", "M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"],
    info: ["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z", "M12 11v5", "M12 8h.01"],
    x: ["M6 6l12 12M18 6L6 18"],
    sliders: ["M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"],
    film: ["M4 4h16v16H4z", "M8 4v16M16 4v16M4 8h4M4 16h4M16 8h4M16 16h4"],
    search: ["M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z", "M21 21l-4.3-4.3"],
    play: ["M7 4l13 8-13 8z"],
    listplus: ["M4 6h12M4 12h12M4 18h8M18 15v6M15 18h6"],
    pencil: ["M4 20h4L19 9l-4-4L4 16z"],
    trash: ["M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"],
    activity: ["M3 12h4l3-8 4 16 3-8h4"],
    bell: ["M6 16V11a6 6 0 0 1 12 0v5l2 2H4z", "M10 21h4"],
    repeat: ["M17 2l4 4-4 4", "M3 11V9a3 3 0 0 1 3-3h15", "M7 22l-4-4 4-4", "M21 13v2a3 3 0 0 1-3 3H3"],
    cal: ["M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z", "M4 10h16M8 3v4M16 3v4"],
    share: ["M12 3v12", "M7 8l5-5 5 5", "M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"],
    eye: ["M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z", "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"],
    pause: ["M8 5v14M16 5v14"],
    skip: ["M5 4l10 8-10 8z", "M19 5v14"],
    all: ["M3 12.5l4 4L15 8", "M10 16.5l1 1L21 8"]
  };
  var FILLED = { star: true, play: true };

  function icon(name, size) {
    var ns = "http://www.w3.org/2000/svg";
    var s = document.createElementNS(ns, "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("width", size || 20);
    s.setAttribute("height", size || 20);
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("class", "ic" + (FILLED[name] ? " ic-fill" : ""));
    (ICONS[name] || []).forEach(function (d) {
      var p = document.createElementNS(ns, "path");
      p.setAttribute("d", d);
      s.appendChild(p);
    });
    return s;
  }

  // ---------- small helpers ----------
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  function button(className, text, handler) {
    var b = el("button", className, text);
    b.type = "button";
    if (handler) b.addEventListener("click", handler);
    return b;
  }

  function iconButton(className, iconName, label, handler) {
    var b = button(className, null, handler);
    b.setAttribute("aria-label", label);
    b.appendChild(icon(iconName, 20));
    return b;
  }

  function msg(text, isError) { return el("div", "msg" + (isError ? " error" : ""), text); }

  function key(item) { return item.media_type + ":" + item.tmdb_id; }

  function getMine(item) {
    var m = mine[key(item)];
    if (m) return m;
    return { status: item.status || null, rating: item.my_rating || null };
  }

  function ingest(items) {
    (items || []).forEach(function (it) {
      if (it.status !== undefined) mine[key(it)] = { status: it.status || null, rating: it.my_rating || null };
    });
  }

  function displayTitle(item) {
    if (item.title_en !== undefined && I18N.lang !== "fa") return item.title_en || item.title || "";
    return item.title || item.original_title || "";
  }

  function typeLabel(item) { return item.media_type === "tv" ? t("type_tv") : t("type_movie"); }

  function formatRuntime(minutes) {
    if (!minutes) return "";
    var h = Math.floor(minutes / 60), m = minutes % 60;
    return h > 0 ? t("runtime_hm", { h: h, m: m }) : t("runtime_m", { m: m });
  }

  function toast(text, isError) {
    var box = $("toast");
    box.textContent = text;
    box.className = "toast show" + (isError ? " error" : "");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { box.className = "toast"; }, 2800);
  }

  function haptic() {
    try { if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred("light"); } catch (e) {}
  }

  // ---------- server calls ----------
  function readInitData() {
    try {
      var h = new URLSearchParams(location.hash.replace(/^#/, ""));
      var fromHash = h.get("tgWebAppData");
      if (fromHash) return fromHash;
    } catch (e) {}
    try {
      if (window.Telegram && Telegram.WebApp && Telegram.WebApp.initData) return Telegram.WebApp.initData;
    } catch (e) {}
    return "";
  }

  function api(path, options) {
    options = options || {};
    var headers = { Authorization: "tma " + initData };
    var init = { method: options.method || "GET", headers: headers, signal: options.signal };
    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(options.body);
    }
    return fetch(path, init).then(function (r) {
      return r.json().then(function (data) { return { status: r.status, data: data }; });
    });
  }

  // Adds the chosen language to a URL.
  function L(path) { return path + (path.indexOf("?") < 0 ? "?" : "&") + "lang=" + I18N.lang; }

  function problem(res, fallbackKey) {
    if (res.status === 401) return t(res.data && res.data.error === "expired" ? "err_expired" : "err_login");
    if (res.status === 429) return t("err_rate");
    return t(fallbackKey || "err_generic");
  }

  function todayStr() {
    var d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  function niceDate(iso) {
    var d = new Date(iso + "T12:00:00");
    if (isNaN(d.getTime())) return iso;
    try { return d.toLocaleDateString(I18N.lang === "fa" ? "fa-IR" : I18N.lang, { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return iso; }
  }

  // extra (optional): { mood: [emoji], actor: { id, name, photo } | null }. Left out = keep what is saved.
  function setStatus(item, status, rating, extra) {
    var body = { tmdb_id: item.tmdb_id, media_type: item.media_type, status: status, rating: rating || null };
    if (extra && extra.mood !== undefined) body.mood = extra.mood;
    if (extra && extra.actor !== undefined) body.actor = extra.actor;
    if (extra && extra.watched_on) body.watched_on = extra.watched_on;
    if (extra && extra.rewatch) body.rewatch = true;
    return api("/api/library", { method: "PUT", body: body }).then(function (res) {
      if (res.status !== 200) { toast(problem(res, "err_save"), true); return false; }
      mine[key(item)] = { status: res.data.status, rating: res.data.my_rating || null };
      library.stale = true;
      haptic();
      return true;
    }).catch(function () { toast(t("err_network"), true); return false; });
  }

  function removeFromLibrary(item) {
    return api("/api/library?tmdb_id=" + item.tmdb_id + "&media_type=" + item.media_type, { method: "DELETE" })
      .then(function (res) {
        if (res.status !== 200) { toast(problem(res, "err_save"), true); return false; }
        mine[key(item)] = { status: null, rating: null };
        library.stale = true;
        haptic();
        return true;
      }).catch(function () { toast(t("err_network"), true); return false; });
  }

  function fetchRow(kind) {
    var k = I18N.lang + ":" + kind;
    var c = rowsCache[k];
    if (c && c.items) return Promise.resolve(c.items);
    if (c && c.promise) return c.promise;
    var p = api(L("/api/discover?kind=" + kind)).then(function (res) {
      if (res.status !== 200) { delete rowsCache[k]; return null; }
      var items = res.data.results || [];
      ingest(items);
      rowsCache[k] = { items: items };
      return items;
    }).catch(function () { delete rowsCache[k]; return null; });
    rowsCache[k] = { promise: p };
    return p;
  }

  function ensureLibrary(force) {
    if (!force && library.loaded && !library.stale) return Promise.resolve(true);
    if (library.loading) return library.loading;
    // the library can hold thousands of titles (after an import): load it in pages of 500
    function page(offset, all) {
      return api("/api/library?limit=500&offset=" + offset).then(function (res) {
        if (res.status !== 200) return null;
        var got = res.data.items || [];
        all = all.concat(got);
        var counts = res.data.counts || {}, total = 0;
        Object.keys(counts).forEach(function (k) { total += counts[k] || 0; });
        if (got.length >= 500 && all.length < total && offset < 20000) return page(offset + 500, all);
        return all;
      });
    }
    library.loading = page(0, []).then(function (all) {
      library.loading = null;
      if (!all) return false;
      library.items = all;
      library.loaded = true;
      library.stale = false;
      ingest(library.items);
      return true;
    }).catch(function () { library.loading = null; return false; });
    return library.loading;
  }

  // ---------- shared pieces ----------
  function posterNode(item, className) {
    if (item.poster) {
      var img = el("img", className || "poster");
      img.src = item.poster;
      img.alt = "";
      img.loading = "lazy";
      img.addEventListener("error", function () { img.classList.add("broken"); });
      return img;
    }
    var ph = el("div", (className || "poster") + " ph");
    ph.appendChild(icon("film", 26));
    return ph;
  }

  function ratingBadge(value) {
    var b = el("span", "badge-rate");
    b.appendChild(icon("star", 11));
    b.appendChild(document.createTextNode(" " + value));
    return b;
  }

  function statusBadge(status) {
    var b = el("span", "badge-status s-" + status);
    if (status === "watched") b.appendChild(icon("check", 12));
    else b.textContent = t("status_" + status);
    return b;
  }

  function posterCard(item) {
    var card = el("button", "pcard");
    card.type = "button";
    var box = el("div", "pimg");
    box.appendChild(posterNode(item));
    if (item.rating) box.appendChild(ratingBadge(item.rating));
    var m = getMine(item);
    if (m.status) box.appendChild(statusBadge(m.status));
    card.appendChild(box);
    card.appendChild(el("div", "ptitle", displayTitle(item)));
    var sub = [];
    if (item.year) sub.push(String(item.year));
    sub.push(typeLabel(item));
    card.appendChild(el("div", "psub", sub.join(" · ")));
    card.addEventListener("click", function () { openDetail(item); });
    return card;
  }

  function sectionHeader(text) { return el("h2", "sec-title", text); }

  function rowSkeleton() {
    var row = el("div", "hscroll");
    for (var i = 0; i < 4; i++) {
      var s = el("div", "pcard");
      s.appendChild(el("div", "pimg skel"));
      s.appendChild(el("div", "ptitle skel-line"));
      row.appendChild(s);
    }
    return row;
  }

  function cardsRow(items) {
    var row = el("div", "hscroll");
    items.forEach(function (it) { row.appendChild(posterCard(it)); });
    return row;
  }

  // A titled row that fills itself when the data arrives.
  function lazyRow(titleKey, kind, filterFn, hairline) {
    var wrap = el("section", hairline ? "" : "section");
    wrap.appendChild(hairline ? el("h2", "sec", t(titleKey)) : sectionHeader(t(titleKey)));
    var holder = rowSkeleton();
    wrap.appendChild(holder);
    fetchRow(kind).then(function (items) {
      if (!items) { holder.replaceWith(msg(t("err_load"), true)); return; }
      var list = filterFn ? items.filter(filterFn) : items;
      if (!list.length) { wrap.remove(); return; }
      holder.replaceWith(cardsRow(list));
    });
    return wrap;
  }

  // ---------- bottom sheets ----------
  function syncLock() {
    var open = detailStack.length > 0 || $("sheet-root").children.length > 0 || FX.backStack.length > 0;
    document.body.classList.toggle("locked", open);
  }

  function closeSheet() {
    clear($("sheet-root"));
    syncLock();
  }

  function openSheet(build) {
    closeSheet();
    var ov = el("div", "sheet-ov");
    var sh = el("div", "sheet");
    sh.appendChild(el("div", "grab"));
    build(sh);
    ov.appendChild(sh);
    ov.addEventListener("click", function (e) { if (e.target === ov) closeSheet(); });
    $("sheet-root").appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add("on"); });
    syncLock();
  }

  // ---------- navigation ----------
  function renderNav() {
    var nav = $("nav");
    clear(nav);
    TABS.forEach(function (name) {
      var b = el("button", "nav-item" + (name === currentTab ? " active" : ""));
      b.type = "button";
      b.appendChild(icon(TAB_ICON[name], 22));
      b.appendChild(el("span", "", t("nav_" + name)));
      b.addEventListener("click", function () { goTab(name); });
      nav.appendChild(b);
    });
  }

  function renderTab(name) {
    stopHero();
    if (name === "home") renderHome();
    else if (name === "discover") renderDiscover();
    else if (name === "library") renderLibrary();
    else if (name === "activity") renderActivity();
    else renderProfile();
  }

  // Every tab has a "view-<name>" box inside <main class="app">; the box is created here if index.html does not have it yet.
  function viewNode(name) {
    var v = $("view-" + name);
    if (!v) {
      v = el("div", "view hidden");
      v.id = "view-" + name;
      var host = document.querySelector("main.app");
      var after = $("view-" + TABS[Math.max(0, TABS.indexOf(name) - 1)]);
      if (after && after.parentNode === host && name !== TABS[0]) host.insertBefore(v, after.nextSibling);
      else host.appendChild(v);
    }
    return v;
  }

  function goTab(name) {
    currentTab = name;
    TABS.forEach(function (n) { viewNode(n).classList.toggle("hidden", n !== name); });
    renderNav();
    renderTab(name);
    window.scrollTo(0, 0);
  }

  function topBar(titleText) {
    var bar = el("header", "topbar");
    bar.appendChild(el("h1", "page-title", titleText));
    return bar;
  }

  // ---------- home ----------
  function stopHero() { if (heroTimer) { clearInterval(heroTimer); heroTimer = null; } }

  function avatarNode() {
    if (me && me.photo_url) {
      var img = el("img", "avatar");
      img.src = me.photo_url;
      img.alt = "";
      return img;
    }
    return el("div", "avatar", ((me && me.display_name) || "F").charAt(0).toUpperCase());
  }

  function heroSlide(item) {
    var slide = el("div", "hero-slide");
    var img = el("img", "hero-img");
    img.src = item.backdrop;
    img.alt = "";
    slide.appendChild(img);
    slide.appendChild(el("div", "hero-shade"));
    var body = el("div", "hero-body");
    var top = el("div", "hero-tags");
    top.appendChild(el("span", "tag", typeLabel(item)));
    if (item.rating) top.appendChild(ratingBadge(item.rating));
    body.appendChild(top);
    body.appendChild(el("h2", "hero-title", displayTitle(item)));
    if (item.year) body.appendChild(el("p", "hero-meta", String(item.year)));
    var actions = el("div", "hero-actions");
    var add = button("btn primary", "");
    function label() {
      var m = getMine(item);
      clear(add);
      if (m.status) { add.appendChild(icon("check", 16)); add.appendChild(document.createTextNode(" " + t("status_" + m.status))); }
      else { add.appendChild(icon("plus", 16)); add.appendChild(document.createTextNode(" " + t("btn_add_watchlist"))); }
    }
    label();
    add.addEventListener("click", function (e) {
      e.stopPropagation();
      if (getMine(item).status) { openDetail(item); return; }
      add.disabled = true;
      setStatus(item, "want").then(function () { add.disabled = false; label(); });
    });
    actions.appendChild(add);
    actions.appendChild(button("btn glass", t("btn_details"), function (e) { e.stopPropagation(); openDetail(item); }));
    body.appendChild(actions);
    slide.appendChild(body);
    slide.addEventListener("click", function () { openDetail(item); });
    return slide;
  }

  function buildHero(box, items) {
    var picks = items.filter(function (i) { return i.backdrop; }).slice(0, 5);
    if (!picks.length) { box.remove(); return; }
    box.className = "hero";
    clear(box);
    var slides = picks.map(heroSlide);
    var dots = el("div", "dots");
    var dotNodes = picks.map(function () { var d = el("span", "dot"); dots.appendChild(d); return d; });
    slides.forEach(function (s) { box.appendChild(s); });
    box.appendChild(dots);
    var index = 0;
    function show(i) {
      index = i;
      // only the slide on top may receive taps (the others are stacked invisibly underneath)
      slides.forEach(function (s, n) { s.classList.toggle("on", n === i); s.style.pointerEvents = n === i ? "auto" : "none"; });
      dotNodes.forEach(function (d, n) { d.classList.toggle("on", n === i); });
    }
    show(0);
    function startTimer() {
      stopHero();
      if (picks.length > 1) heroTimer = setInterval(function () { show((index + 1) % picks.length); }, 6000);
    }
    startTimer();

    // swipe left / right to change the slide by hand
    var startX = 0, startY = 0, swiped = false, tracking = false;
    box.addEventListener("touchstart", function (e) {
      if (!e.touches || e.touches.length !== 1) return;
      tracking = true; swiped = false;
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
      stopHero();
    }, { passive: true });
    box.addEventListener("touchend", function (e) {
      if (!tracking) return;
      tracking = false;
      var t0 = e.changedTouches && e.changedTouches[0];
      if (t0 && picks.length > 1) {
        var dx = t0.clientX - startX, dy = t0.clientY - startY;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) {
          swiped = true;
          var rtl = document.documentElement.dir === "rtl";
          var forward = rtl ? dx > 0 : dx < 0;
          show((index + (forward ? 1 : picks.length - 1)) % picks.length);
        }
      }
      startTimer();
    }, { passive: true });
    box.addEventListener("touchcancel", function () { tracking = false; startTimer(); }, { passive: true });
    // a swipe must not count as a tap on the title
    box.addEventListener("click", function (e) { if (swiped) { e.stopPropagation(); e.preventDefault(); swiped = false; } }, true);
    dotNodes.forEach(function (d, n) { d.addEventListener("click", function (e) { e.stopPropagation(); show(n); startTimer(); }); });
  }

  function renderHome() {
    var v = $("view-home");
    clear(v);

    var head = el("header", "topbar home-bar");
    var who = button("who", null, function () { goTab("profile"); });
    who.appendChild(avatarNode());
    var greet = el("div", "greet");
    greet.appendChild(el("small", "", t("hello")));
    greet.appendChild(el("b", "", (me && me.display_name) || ""));
    who.appendChild(greet);
    head.appendChild(who);
    var slot = el("div", "home-slot");
    head.appendChild(slot);
    if (FX.hooks.homeTop) FX.hooks.homeTop(slot, me);
    v.appendChild(head);

    var heroBox = el("div", "hero skel");
    v.appendChild(heroBox);

    var cont = el("section", "section hidden");
    cont.appendChild(sectionHeader(t("sec_continue")));
    var contHolder = el("div");
    cont.appendChild(contHolder);
    v.appendChild(cont);

    fetchRow("trending").then(function (items) {
      if (!items) { heroBox.remove(); return; }
      if (currentTab === "home") buildHero(heroBox, items);
    });

    ensureLibrary(false).then(function () {
      var watching = library.items.filter(function (i) { return getMine(i).status === "watching"; });
      if (!watching.length) return;
      clear(contHolder);
      contHolder.appendChild(cardsRow(watching));
      cont.classList.remove("hidden");
    });

    v.appendChild(lazyRow("sec_trending", "trending"));
    v.appendChild(lazyRow("sec_popular_movies", "popular_movies"));
    v.appendChild(lazyRow("sec_popular_tv", "popular_tv"));
    v.appendChild(lazyRow("sec_top_movies", "top_movies"));
    v.appendChild(lazyRow("sec_top_tv", "top_tv"));
  }

  // ---------- activity (the feed and the leaderboard are built later; for now an empty state) ----------
  var actView = "following";

  function renderActivity() {
    var v = viewNode("activity");
    clear(v);
    v.appendChild(topBar(t("act_title")));
    var seg = el("div", "segment");
    [["following", "act_following"], ["board", "act_board"]].forEach(function (pair) {
      seg.appendChild(button("seg-btn" + (actView === pair[0] ? " active" : ""), t(pair[1]), function () {
        actView = pair[0];
        renderActivity();
      }));
    });
    v.appendChild(seg);
    var box = el("div", "empty");
    box.appendChild(icon("activity", 44));
    box.appendChild(el("p", "", t("act_empty")));
    v.appendChild(box);
  }

  // ---------- discover ----------
  function filterChips(current, onPick) {
    var row = el("div", "chips");
    [["all", "filter_all"], ["movie", "filter_movies"], ["tv", "filter_series"]].forEach(function (pair) {
      row.appendChild(button("chip" + (current === pair[0] ? " active" : ""), t(pair[1]), function () { onPick(pair[0]); }));
    });
    return row;
  }

  function renderDiscover() {
    var v = $("view-discover");
    clear(v);
    v.appendChild(topBar(t("nav_discover")));

    var box = el("div", "searchbox");
    box.appendChild(icon("search", 18));
    var input = el("input", "searchinput");
    input.type = "search";
    input.setAttribute("inputmode", "search");
    input.setAttribute("autocomplete", "off");
    input.placeholder = t("sx_search_ph");
    input.value = disc.q;
    box.appendChild(input);
    v.appendChild(box);

    // Browsing: one segment (All / Movies / Series). While the search box is in use (keyboard open) or has text:
    // two tabs (Titles | People) and, under Titles, the All / Movies / Series chips.
    var seg = el("div", "segment sp-tabs");
    v.appendChild(seg);
    var chipsHolder = el("div");
    v.appendChild(chipsHolder);
    var body = el("div", "disc-body");
    v.appendChild(body);

    var searching = false;
    function searchMode() { return searching || disc.q.trim().length > 0; }

    function drawSeg() {
      clear(seg);
      if (searchMode()) {
        [["titles", "sx_tab_titles"], ["people", "sx_tab_people"]].forEach(function (pair) {
          seg.appendChild(button("seg-btn" + (disc.tab === pair[0] ? " active" : ""), t(pair[1]), function () {
            if (disc.tab === pair[0]) return;
            disc.tab = pair[0];
            drawSeg(); drawChips(); drawBody();
            if (disc.tab === "titles" && disc.q.trim().length >= 2 && disc.status === "idle") runSearch(disc.q.trim());
          }));
        });
      } else {
        [["all", "filter_all"], ["movie", "filter_movies"], ["tv", "filter_series"]].forEach(function (pair) {
          seg.appendChild(button("seg-btn" + (disc.filter === pair[0] ? " active" : ""), t(pair[1]), function () {
            disc.filter = pair[0];
            drawSeg(); drawBody();
          }));
        });
      }
    }

    function drawChips() {
      clear(chipsHolder);
      // while searching there are only the two tabs (Titles | People), no All / Movies / Series chips
      return;
    }

    function drawBody() {
      clear(body);
      if (disc.tab === "people") {
        if (FX.hooks.people) FX.hooks.people(body, disc.q);
        return;
      }
      var q = disc.q.trim();
      if (q.length < 2 && searchMode()) {
        var hint = el("div", "empty");
        hint.appendChild(icon("search", 40));
        hint.appendChild(el("p", "", t(q.length === 1 ? "search_hint" : "disc_start")));
        body.appendChild(hint);
        return;
      }
      if (q.length < 2) {
        var f = disc.filter;
        if (f !== "tv") { body.appendChild(lazyRow("sec_top_movies", "top_movies", null, true)); body.appendChild(lazyRow("sec_popular_movies", "popular_movies", null, true)); }
        if (f !== "movie") { body.appendChild(lazyRow("sec_top_tv", "top_tv", null, true)); body.appendChild(lazyRow("sec_popular_tv", "popular_tv", null, true)); }
        return;
      }
      if (disc.status === "loading") { body.appendChild(msg(t("searching"))); return; }
      if (disc.status === "error") { body.appendChild(msg(disc.error, true)); return; }
      var list = disc.results;
      if (!list.length) { body.appendChild(msg(t("no_results"))); return; }
      var grid = el("div", "grid");
      list.forEach(function (it) { grid.appendChild(posterCard(it)); });
      body.appendChild(grid);
    }

    function redrawTitles() { if (disc.tab === "titles") drawBody(); }

    function runSearch(q) {
      if (disc.controller) disc.controller.abort();
      disc.controller = new AbortController();
      disc.status = "loading";
      redrawTitles();
      api(L("/api/search?q=" + encodeURIComponent(q)), { signal: disc.controller.signal }).then(function (res) {
        if (res.status !== 200) { disc.status = "error"; disc.error = problem(res, "err_search"); }
        else { disc.status = "ok"; disc.results = res.data.results || []; ingest(disc.results); }
        redrawTitles();
      }).catch(function (e) {
        if (e && e.name === "AbortError") return;
        disc.status = "error";
        disc.error = t("err_network");
        redrawTitles();
      });
    }

    // Tapping a tab must not take the focus away from the search box (that would hide the tabs first).
    // Tapping a tab or a chip must not take the focus away from the search box (that would switch the menu back to All / Movies / Series).
    seg.addEventListener("mousedown", function (e) { e.preventDefault(); });
    chipsHolder.addEventListener("mousedown", function (e) { e.preventDefault(); });
    input.addEventListener("focus", function () { searching = true; drawSeg(); drawChips(); drawBody(); });
    input.addEventListener("blur", function () {
      setTimeout(function () {
        searching = document.activeElement === input;
        if (!searching && disc.q.trim().length === 0 && disc.tab !== "titles") {
          disc.tab = "titles";
          drawBody();
        }
        drawSeg(); drawChips(); drawBody();
      }, 150);
    });

    input.addEventListener("input", function () {
      clearTimeout(disc.timer);
      disc.q = input.value;
      drawSeg(); drawChips();
      if (disc.tab === "people") {
        disc.timer = setTimeout(drawBody, 400);
        return;
      }
      var q = disc.q.trim();
      if (q.length < 2) {
        if (disc.controller) disc.controller.abort();
        disc.status = "idle";
        drawBody();
        return;
      }
      disc.timer = setTimeout(function () { runSearch(q); }, 400);
    });

    drawSeg();
    drawChips();
    if (disc.tab === "titles" && disc.q.trim().length >= 2 && disc.status === "idle") runSearch(disc.q.trim());
    drawBody();
  }

  // ---------- library ----------
  function renderLibrary() {
    var v = $("view-library");
    clear(v);
    v.appendChild(topBar(t("nav_library")));

    var listsHolder = el("div");
    v.appendChild(listsHolder);
    if (FX.hooks.library) FX.hooks.library(listsHolder);

    var seg = el("div", "segment");
    var chipsHolder = el("div");
    var body = el("div");
    v.appendChild(seg);
    v.appendChild(chipsHolder);
    v.appendChild(body);

    function visibleItems() {
      return library.items.filter(function (i) {
        var m = getMine(i);
        if (!m.status) return false;
        return libView.type === "all" || i.media_type === libView.type;
      });
    }

    function drawSeg() {
      clear(seg);
      [["all", "filter_all"], ["movie", "filter_movies"], ["tv", "filter_series"]].forEach(function (pair) {
        seg.appendChild(button("seg-btn" + (libView.type === pair[0] ? " active" : ""), t(pair[1]), function () {
          libView.type = pair[0];
          drawSeg(); drawChips(); drawGrid();
        }));
      });
    }

    function drawChips() {
      clear(chipsHolder);
      var base = visibleItems();
      var counts = {};
      base.forEach(function (i) { var s = getMine(i).status; counts[s] = (counts[s] || 0) + 1; });
      var row = el("div", "chips");
      row.appendChild(button("chip" + (libView.status === null ? " active" : ""), t("library_all") + " (" + base.length + ")", function () {
        libView.status = null; drawChips(); drawGrid();
      }));
      STATUS_ORDER.forEach(function (s) {
        row.appendChild(button("chip" + (libView.status === s ? " active" : ""), t("status_" + s) + " (" + (counts[s] || 0) + ")", function () {
          libView.status = s; drawChips(); drawGrid();
        }));
      });
      chipsHolder.appendChild(row);
    }

    function drawGrid() {
      clear(body);
      var list = visibleItems().filter(function (i) { return !libView.status || getMine(i).status === libView.status; });
      if (!list.length) {
        var empty = el("div", "empty");
        empty.appendChild(icon("film", 40));
        empty.appendChild(el("p", "", t("library_empty")));
        body.appendChild(empty);
        return;
      }
      var grid = el("div", "grid");
      list.forEach(function (it) { grid.appendChild(posterCard(it)); });
      body.appendChild(grid);
    }

    drawSeg();
    if (library.loaded) { drawChips(); drawGrid(); } else { body.appendChild(msg(t("loading"))); }
    ensureLibrary(false).then(function (ok) {
      if (currentTab !== "library") return;
      if (!ok && !library.loaded) { clear(body); body.appendChild(msg(t("err_load"), true)); return; }
      drawChips();
      drawGrid();
    });
  }

  // ---------- profile and settings ----------
  function languageName() {
    var langs = I18N.languages;
    for (var i = 0; i < langs.length; i++) if (langs[i].code === I18N.lang) return langs[i].name;
    return "English";
  }

  function setLanguage(code) {
    I18N.set(code);
    try { localStorage.setItem(LS_LANG, code); } catch (e) {}
    api("/api/me?lang=" + code).catch(function () {}); // tell the server, so the bot answers in the same language
    closeSheet();
    renderNav();
    renderTab(currentTab);
  }

  function openLanguageSheet() {
    openSheet(function (sh) {
      sh.appendChild(el("h3", "sheet-title", t("language")));
      var list = el("div", "lang-list");
      I18N.languages.forEach(function (l) {
        var row = button("lang-row" + (l.code === I18N.lang ? " active" : ""), null, function () { setLanguage(l.code); });
        row.appendChild(el("span", "", l.name));
        if (l.code === I18N.lang) row.appendChild(icon("check", 18));
        list.appendChild(row);
      });
      sh.appendChild(list);
      sh.appendChild(el("p", "note", t("lang_note")));
    });
  }

  function openAboutSheet() {
    openSheet(function (sh) {
      sh.appendChild(el("h3", "sheet-title", "Flicksy"));
      sh.appendChild(el("p", "about-text", t("about_text")));
      var credit = el("div", "credit");
      var logo = el("img", "tmdb-logo");
      logo.src = "/tmdb-logo.svg";
      logo.alt = "TMDB";
      logo.addEventListener("error", function () { logo.classList.add("hidden"); });
      credit.appendChild(logo);
      credit.appendChild(el("p", "", "This product uses the TMDB API but is not endorsed or certified by TMDB."));
      sh.appendChild(credit);
      sh.appendChild(button("btn glass block", t("btn_close"), closeSheet));
    });
  }

  function settingRow(iconName, label, value, handler) {
    var row = button("setting", null, handler);
    var left = el("span", "setting-left");
    left.appendChild(icon(iconName, 20));
    left.appendChild(el("span", "", label));
    row.appendChild(left);
    var right = el("span", "setting-right");
    if (value) right.appendChild(el("span", "", value));
    var chev = icon("chevron", 18);
    chev.classList.add("flip");
    right.appendChild(chev);
    row.appendChild(right);
    return row;
  }

  // Settings now open from the profile's three-dot menu.
  function openSettingsSheet() {
    openSheet(function (sh) {
      var list = el("div", "settings sheet-settings");
      list.appendChild(el("h2", "sec-title", t("settings")));
      list.appendChild(settingRow("globe", t("language"), languageName(), openLanguageSheet));
      list.appendChild(settingRow("info", t("about"), "", openAboutSheet));
      if (FX.hooks.settings) FX.hooks.settings(list, me);
      // tapping a row closes this sheet first, so pages and sheets that rows open are not hidden behind it
      list.addEventListener("click", function () { closeSheet(); }, true);
      sh.appendChild(list);
    });
  }

  // "My activity": the titles you marked lately, newest first (taken from your library).
  function activityRows() {
    var box = el("div", "pf-acts");
    var items = library.items.filter(function (i) { var s = getMine(i).status; return s && s !== "want"; }).slice(0, 20);
    if (!items.length) {
      box.appendChild(el("div", "pf-empty", t("pf_act_empty")));
      return box;
    }
    var SHOW = 5;
    items.forEach(function (it, idx) {
      var m = getMine(it);
      var row = el("button", "ar" + (idx >= SHOW ? " hidden more-row" : ""));
      row.type = "button";
      var po = el("div", "ar-po");
      po.appendChild(posterNode(it));
      row.appendChild(po);
      var tx = el("div", "ar-tx");
      tx.appendChild(el("b", "", displayTitle(it)));
      var sub = [t("status_" + m.status)];
      if (it.year) sub.push(String(it.year));
      tx.appendChild(el("small", "", sub.join(" · ")));
      row.appendChild(tx);
      if (m.rating) {
        var sc = el("span", "ar-sc");
        sc.appendChild(icon("star", 13));
        sc.appendChild(el("span", "", String(m.rating)));
        row.appendChild(sc);
      }
      row.addEventListener("click", function () { openDetail(it); });
      box.appendChild(row);
    });
    if (items.length > SHOW) {
      var more = el("button", "pf-showmore", t("pf_more"));
      more.type = "button";
      var open = false;
      more.addEventListener("click", function () {
        open = !open;
        Array.prototype.forEach.call(box.querySelectorAll(".more-row"), function (r) { r.classList.toggle("hidden", !open); });
        more.textContent = t(open ? "pf_less" : "pf_more");
      });
      box.appendChild(more);
    }
    return box;
  }

  function renderProfile() {
    var v = $("view-profile");
    clear(v);
    if (FX.hooks.profileHead) FX.hooks.profileHead(v, me);
    else v.appendChild(topBar(t("nav_profile")));
    if (FX.hooks.profileLists) FX.hooks.profileLists(v, me);

    var tabs = el("div", "pf-tabline");
    tabs.appendChild(el("button", "", t("pf_myact")));
    v.appendChild(tabs);

    var actHolder = el("div");
    v.appendChild(actHolder);
    function drawAct() { clear(actHolder); actHolder.appendChild(activityRows()); }
    if (library.loaded) drawAct();
    else actHolder.appendChild(msg(t("loading")));
    ensureLibrary(false).then(function () { if (currentTab === "profile" && actHolder.isConnected) drawAct(); });

    if (FX.hooks.profile) FX.hooks.profile(v, me);
  }

  // ---------- title page ----------
  function topDetail() { return detailStack.length ? detailStack[detailStack.length - 1] : null; }

  function tgBack() {
    try {
      if (tg && tg.BackButton) {
        if (detailStack.length || $("sheet-root").children.length || FX.backStack.length) tg.BackButton.show();
        else tg.BackButton.hide();
      }
    } catch (e) {}
  }

  function openDetail(item) {
    var d = { item: item, data: null, tab: "cast", ep: null, error: "", els: {} };
    detailStack.push(d);
    // a title opened from a profile that sits on top of the title page must come to the front again
    $("detail").style.zIndex = document.querySelector(".spage") ? "40" : "";
    $("detail").classList.remove("hidden");
    syncLock();
    tgBack();
    renderDetail(d);
    loadDetail(d);
  }

  function backDetail() {
    if (epPage) { closeEpisode(); return; }
    detailStack.pop();
    var d = topDetail();
    if (d) {
      renderDetail(d);
    } else {
      $("detail").classList.add("hidden");
      clear($("detail"));
      renderTab(currentTab);
    }
    syncLock();
    tgBack();
  }

  function loadDetail(d) {
    var item = d.item;
    api(L("/api/title?tmdb_id=" + item.tmdb_id + "&media_type=" + item.media_type)).then(function (res) {
      if (res.status !== 200) { d.error = problem(res, "err_load"); }
      else {
        d.data = res.data;
        mine[key(item)] = { status: res.data.status || null, rating: res.data.my_rating || null };
        ingest(res.data.similar);
      }
      if (topDetail() === d) renderDetail(d);
    }).catch(function () {
      d.error = t("err_network");
      if (topDetail() === d) renderDetail(d);
    });
  }

  function infoOf(d) { return d.data || d.item; }

  // Share a movie or series: opens Telegram's chat picker with a link that opens this title (the text is only the title).
  function shareTitle(item, name) {
    var link = "https://t.me/flicksyrobot?startapp=title-" + (item.media_type === "tv" ? "tv" : "movie") + "-" + item.tmdb_id;
    var url = "https://t.me/share/url?url=" + encodeURIComponent(link) + "&text=" + encodeURIComponent(name || displayTitle(item));
    try {
      if (tg && tg.openTelegramLink) { tg.openTelegramLink(url); return; }
    } catch (e) {}
    window.open(url, "_blank");
  }

  function friendAvatar(p, cls) {
    if (p.photo_url) {
      var img = el("img", "avatar " + cls);
      img.src = p.photo_url;
      img.alt = "";
      return img;
    }
    return el("div", "avatar " + cls, (p.display_name || "?").charAt(0).toUpperCase());
  }

  // "Watched by friends": a sheet listing the people you follow who watched this title. Tap a person to open their profile.
  function openFriendsSheet(fw) {
    openSheet(function (sh) {
      sh.appendChild(el("h3", "sheet-title", t("dt_friends")));
      (fw.list || []).forEach(function (p) {
        var r = button("fr-row", null, function () {
          closeSheet();
          if (FX.openProfile && p.public_id) {
            FX.openProfile(p.public_id);
            // the title page is above profile pages by default; lift this profile over it
            var sp = document.querySelectorAll(".spage");
            if (sp.length) sp[sp.length - 1].style.zIndex = "35";
          }
        });
        r.appendChild(friendAvatar(p, "fr-av"));
        var nm = el("span", "fr-nm");
        nm.appendChild(el("bdi", "", p.display_name || ""));
        r.appendChild(nm);
        if (p.rating) {
          var sc = el("span", "fr-sc");
          sc.appendChild(icon("star", 13));
          sc.appendChild(el("span", "", String(p.rating)));
          r.appendChild(sc);
        }
        sh.appendChild(r);
      });
    });
  }

  // Three menu rows under the action buttons. Their screens come later, for now they say "coming soon".
  function detailRows(d) {
    var box = el("div", "drows");
    function row(label, trail) {
      var r = button("drow", null, function () { toast(t("pf_soon")); });
      r.appendChild(el("span", "", label));
      var end = el("span", "rowc");
      end.appendChild(trail());
      r.appendChild(end);
      box.appendChild(r);
    }
    var tkey = FEATURES.trailer && d && d.data && d.data.trailer_key;
    if (tkey) {
      var tr = button("drow", null, function () {
        var link = "https://www.youtube.com/watch?v=" + encodeURIComponent(tkey);
        try { if (tg && tg.openLink) { tg.openLink(link); return; } } catch (e) {}
        window.open(link, "_blank");
      });
      tr.appendChild(el("span", "", t("dt_trailer")));
      var tend = el("span", "rowc");
      var pill = el("span", "yti");
      pill.appendChild(icon("play", 13));
      tend.appendChild(pill);
      tr.appendChild(tend);
      box.appendChild(tr);
    }
    function chev() { var c = icon("chevron", 16); c.classList.add("flip"); return c; }
    row(t("dt_comments"), chev);
    var fw = FEATURES.friendsRow && d && d.data && d.data.friends_watched;
    if (fw && fw.count > 0) {
      var fr = button("drow", null, function () { openFriendsSheet(fw); });
      fr.appendChild(el("span", "", t("dt_friends")));
      var fend = el("span", "rowc");
      var stk = el("span", "stk");
      (fw.sample || []).slice(0, 2).forEach(function (p) { stk.appendChild(friendAvatar(p, "stk-av")); });
      fend.appendChild(stk);
      if (fw.count > 2) { var more = el("em", "", "+" + (fw.count - 2)); more.setAttribute("dir", "ltr"); fend.appendChild(more); }
      fend.appendChild(chev());
      fr.appendChild(fend);
      box.appendChild(fr);
    }
    return box;
  }

  function renderDetail(d) {
    var page = $("detail");
    closeEpisode();
    clear(page);
    var info = infoOf(d);
    var scroller = el("div", "page-scroll");
    page.appendChild(scroller);

    var hero = el("div", "d-hero");
    var pic = info.backdrop || d.item.backdrop || info.poster || d.item.poster;
    if (pic) {
      var img = el("img", "d-hero-img");
      img.src = pic;
      img.alt = "";
      hero.appendChild(img);
    }
    hero.appendChild(el("div", "d-hero-shade"));
    var back = iconButton("round-btn d-back", "back", t("btn_close"), backDetail);
    back.firstChild.classList.add("flip");
    hero.appendChild(back);
    var tools = el("div", "d-tools");
    if (d.item.media_type === "tv") {
      // new-episode reminder: the look is ready, it switches on with the backend
      tools.appendChild(iconButton("round-btn d-bell", "bell", t("dt_reminder"), function () { toast(t("pf_soon")); }));
    }
    tools.appendChild(iconButton("round-btn", "share", t("dt_share"), function () { shareTitle(d.item, d.data && d.data.title); }));
    hero.appendChild(tools);
    scroller.appendChild(hero);

    var body = el("div", "d-body");
    var top = el("div", "d-top");
    top.appendChild(posterNode(d.data || d.item, "d-poster"));
    var box = el("div", "d-info");
    box.appendChild(el("h1", "d-title", d.data ? d.data.title : displayTitle(d.item)));
    var orig = info.original_title;
    var shown = d.data ? d.data.title : displayTitle(d.item);
    if (orig && orig !== shown) box.appendChild(el("p", "d-orig", orig));
    var meta = el("div", "d-meta");
    meta.appendChild(el("span", "tag", typeLabel(d.item)));
    if (info.year) meta.appendChild(el("span", "", String(info.year)));
    if (d.data && d.data.runtime) meta.appendChild(el("span", "", formatRuntime(d.data.runtime)));
    if (info.rating) meta.appendChild(ratingBadge(info.rating));
    box.appendChild(meta);
    top.appendChild(box);
    body.appendChild(top);

    d.els.actions = el("div", "d-actions mv");
    body.appendChild(d.els.actions);
    renderActions(d);

    // overview (tagline, text, genres) sits above the trailer / comments rows
    if (d.data && (d.data.tagline || d.data.overview || (d.data.genres && d.data.genres.length))) {
      var ov = el("div", "sx-ov");
      if (d.data.tagline) ov.appendChild(el("p", "tagline", d.data.tagline));
      if (d.data.overview) ov.appendChild(el("p", "overview", d.data.overview));
      if (d.data.genres && d.data.genres.length) ov.appendChild(el("p", "gen", d.data.genres.join(" · ")));
      body.appendChild(ov);
    }

    body.appendChild(detailRows(d));

    if (d.item.media_type === "tv") {
      // series: no tabs. Overview, seasons and episodes, cast and crew follow each other on one page.
      d.els.pane = el("div", "d-pane sx-body");
      body.appendChild(d.els.pane);
      renderSeriesBody(d);
    } else {
      d.els.tabs = el("div", "d-tabs");
      body.appendChild(d.els.tabs);
      d.els.pane = el("div", "d-pane");
      body.appendChild(d.els.pane);
      renderTabs(d);
      renderPane(d);
    }

    // "More like this" stays under every tab
    if (d.data && d.data.similar && d.data.similar.length) {
      var more = el("section", "section flush d-more");
      more.appendChild(sectionHeader(t("sec_similar")));
      more.appendChild(cardsRow(d.data.similar));
      body.appendChild(more);
    }

    scroller.appendChild(body);
  }

  // ---------- person page: biography and filmography (newest first) ----------
  var personPage = null;

  function closePerson() {
    if (!personPage) return;
    personPage.root.remove();
    FX.popBack(personPage.back);
    personPage = null;
  }

  function openPerson(seed) {
    if (!seed || !seed.id) return;
    if (personPage) closePerson();
    var root = el("div", "page spage ppage");
    root.style.zIndex = "35";
    var pg = { root: root, back: closePerson, data: null, error: "", open: false };
    personPage = pg;
    document.body.appendChild(root);
    FX.pushBack(pg.back);
    drawPerson(pg, seed);
    api(L("/api/person?id=" + encodeURIComponent(seed.id))).then(function (res) {
      if (personPage !== pg) return;
      if (res.status !== 200) pg.error = problem(res, "err_load");
      else pg.data = res.data;
      drawPerson(pg, seed);
    }).catch(function () {
      if (personPage !== pg) return;
      pg.error = t("err_network");
      drawPerson(pg, seed);
    });
  }

  function drawPerson(pg, seed) {
    var root = pg.root;
    clear(root);
    var scroller = el("div", "page-scroll");
    root.appendChild(scroller);
    var back = iconButton("round-btn", "back", t("btn_close"), closePerson);
    back.firstChild.classList.add("flip");
    root.appendChild(back);

    var d = pg.data;
    var name = d ? d.name : seed.name;
    var photo = d ? d.photo : seed.photo;

    var top = el("div", "pp-top");
    top.appendChild(personCard(name, "", photo, 0, "div"));
    var info = el("div", "pp-info");
    info.appendChild(el("h2", "pp-name", name || ""));
    if (d) {
      if (d.department) info.appendChild(el("small", "", t("pp_d_" + d.department) === "pp_d_" + d.department ? d.department : t("pp_d_" + d.department)));
      var life = [];
      if (d.birthday) life.push(t("pp_born") + " " + niceDate(d.birthday));
      if (d.deathday) life.push(t("pp_died") + " " + niceDate(d.deathday));
      if (life.length) info.appendChild(el("small", "", life.join(" · ")));
      if (d.place) info.appendChild(el("small", "", d.place));
    }
    top.appendChild(info);
    scroller.appendChild(top);

    var body = el("div", "pp-body");
    scroller.appendChild(body);
    if (pg.error && !d) { body.appendChild(msg(pg.error, true)); return; }
    if (!d) { body.appendChild(msg(t("loading"))); return; }

    var bio = el("p", "pp-bio" + (pg.open ? "" : " cl"), d.bio || t("pp_nobio"));
    body.appendChild(bio);
    if ((d.bio || "").length > 260) {
      var more = button("pp-more", t(pg.open ? "pp_less" : "pp_more"), function () {
        pg.open = !pg.open;
        bio.classList.toggle("cl", !pg.open);
        more.textContent = t(pg.open ? "pp_less" : "pp_more");
      });
      body.appendChild(more);
    }

    if (d.credits && d.credits.length) {
      var fh = el("div", "pp-fh");
      fh.appendChild(el("h4", "", t("pp_films") + " (" + d.total + ")"));
      fh.appendChild(el("small", "", t("pp_newest")));
      body.appendChild(fh);
      var list = el("div", "pp-list");
      d.credits.forEach(function (c) {
        var r = button("pp-fi", null, function () {
          openDetail({ tmdb_id: c.tmdb_id, media_type: c.media_type, title: c.title, year: c.year, poster: c.poster });
        });
        var mp = el("div", "pp-mp");
        mp.appendChild(posterNode({ poster: c.poster }, "poster"));
        r.appendChild(mp);
        var nm = el("div", "pp-nm");
        nm.appendChild(el("b", "", c.title));
        if (c.role) nm.appendChild(el("small", "", c.kind === "cast" ? t("pp_as", { r: c.role }) : c.role));
        r.appendChild(nm);
        if (c.year) r.appendChild(el("span", "pp-yr", String(c.year)));
        list.appendChild(r);
      });
      body.appendChild(list);
    }
  }

  // ---------- movie page: actions, rating, feelings, favorite character ----------
  var PC_COLORS = ["5b3fd0", "2a5bd7", "b0397a", "1f8a8a", "c0662b", "6a4ad0"];

  // A tall card: photo (or a colored letter), name and a small line under it.
  function personCard(name, sub, photo, i, tag) {
    var c = el(tag || "div", "pc");
    if (tag === "button") c.type = "button";
    if (photo) {
      var im = el("img", "pc-img");
      im.src = photo;
      im.alt = "";
      im.loading = "lazy";
      im.addEventListener("error", function () { im.remove(); });
      c.appendChild(im);
    }
    var ph = el("span", "pc-ph", (name || "?").charAt(0).toUpperCase());
    ph.style.background = "linear-gradient(" + (150 + (i || 0) * 40) + "deg,#" + PC_COLORS[(i || 0) % PC_COLORS.length] + ",#14143a)";
    c.insertBefore(ph, c.firstChild);
    var tx = el("span", "pc-tx");
    tx.appendChild(el("b", "", name || ""));
    if (sub) tx.appendChild(el("small", "", sub));
    c.appendChild(tx);
    return c;
  }

  function shortDate(iso) {
    if (!iso) return "";
    if (iso === todayStr()) return t("dt_today");
    var dt = new Date(iso + "T12:00:00");
    if (isNaN(dt.getTime())) return iso;
    var o = { day: "numeric", month: "short" };
    if (dt.getFullYear() !== new Date().getFullYear()) o.year = "numeric";
    try { return dt.toLocaleDateString(I18N.lang === "fa" ? "fa-IR" : I18N.lang, o); } catch (e) { return iso; }
  }

  var STAR_KEYS = ["st_bad", "st_ok", "st_good", "st_great", "st_wow"];
  var MOOD_KEYS = { "😍": "mood_love", "😂": "mood_funny", "😢": "mood_sad", "😱": "mood_scared", "🤯": "mood_mind", "😴": "mood_bored", "😡": "mood_angry", "🤔": "mood_think" };

  // Share of people (in %) from the counts the server sends. "–" while nobody has voted.
  function pctText(count, total) {
    if (!total) return "0%";
    var v = Math.round((count / total) * 100);
    try { return v.toLocaleString(I18N.lang === "fa" ? "fa-IR" : undefined) + "%"; } catch (e) { return v + "%"; }
  }

  // Keeps the community counts in step with what I just changed (so the numbers move when I tap).
  function statsMine(d, oldRating, newRating, oldMood, newMood) {
    var st = d.data && d.data.stats;
    if (!st) return;
    function bucket(r) { return r ? Math.ceil(r / 2) - 1 : -1; }
    if (oldRating !== newRating) {
      var ob = bucket(oldRating), nb = bucket(newRating);
      if (ob >= 0) { st.stars[ob] = Math.max(0, st.stars[ob] - 1); st.rated = Math.max(0, st.rated - 1); }
      if (nb >= 0) { st.stars[nb] += 1; st.rated += 1; }
    }
    if (oldMood && newMood) {
      oldMood.forEach(function (e) { if (newMood.indexOf(e) < 0) st.moods[e] = Math.max(0, (st.moods[e] || 0) - 1); });
      newMood.forEach(function (e) { if (oldMood.indexOf(e) < 0) st.moods[e] = (st.moods[e] || 0) + 1; });
      if (oldMood.length && !newMood.length) st.moded = Math.max(0, st.moded - 1);
      if (!oldMood.length && newMood.length) st.moded += 1;
    }
  }

  // The menu that opens when you tap the green "Watched" button.
  function openWatchedMenu(d) {
    var item = d.item;
    openSheet(function (sh) {
      function row(cls, iconName, label, handler) {
        var r = button("mi " + cls, null, handler);
        r.appendChild(icon(iconName, 20));
        r.appendChild(el("span", "", label));
        sh.appendChild(r);
      }
      row("", "repeat", t("rw_log"), function () {
        closeSheet();
        var prev = d.data && d.data.my ? d.data.my.watch_count : 1;
        setStatus(item, "watched", getMine(item).rating, { rewatch: true, watched_on: todayStr() }).then(function (ok) {
          if (!ok) return;
          if (d.data) d.data.my = { watch_count: prev + 1, last_watched_on: todayStr() };
          toast(t("rw_logged"));
          if (topDetail() === d) renderActions(d);
        });
      });
      row("", "cal", t("rw_change"), function () { openDateSheet(d); });
      row("red", "x", t("rw_unwatch"), function () {
        closeSheet();
        var m0 = getMine(item);
        removeFromLibrary(item).then(function (ok) {
          if (ok && d.data) {
            statsMine(d, m0.rating, null, d.data.mood || [], []);
            d.data.mood = []; d.data.fav_actor = null; d.data.my = null;
          }
          if (topDetail() === d) renderActions(d);
        });
      });
    });
  }

  function openDateSheet(d) {
    var item = d.item;
    var cur = (d.data && d.data.my && d.data.my.last_watched_on) || todayStr();
    openSheet(function (sh) {
      sh.appendChild(el("h3", "sheet-title", t("wdate")));
      var inp = document.createElement("input");
      inp.type = "date";
      inp.className = "date-input";
      inp.max = todayStr();
      inp.value = cur;
      sh.appendChild(inp);
      var save = button("btn primary", t("btn_save"), function () {
        if (!inp.value) return;
        save.disabled = true;
        setStatus(item, "watched", getMine(item).rating, { watched_on: inp.value }).then(function (ok) {
          if (!ok) { save.disabled = false; return; }
          if (d.data) d.data.my = { watch_count: (d.data.my && d.data.my.watch_count) || 1, last_watched_on: inp.value };
          closeSheet();
          if (topDetail() === d) renderActions(d);
        });
      });
      sh.appendChild(save);
    });
  }

  function renderMovieActions(d) {
    var box = d.els.actions;
    clear(box);
    var item = d.item;
    var m = getMine(item);
    var watched = m.status === "watched";
    var my = d.data && d.data.my;

    var row = el("div", "mv-row");
    box.appendChild(row);

    // watchlist: icon only
    var wl = button("sq" + (m.status === "want" ? " on" : ""), null, function () {
      var cur = getMine(item).status;
      if (cur === "watched") { toast(t("status_watched")); return; }
      var p = cur === "want" ? removeFromLibrary(item) : setStatus(item, "want", null);
      p.then(function () { if (topDetail() === d) renderActions(d); });
    });
    wl.setAttribute("aria-label", t("btn_watchlist"));
    wl.appendChild(icon("bookmark", 22));
    row.appendChild(wl);

    // Seen / Watched
    var seen;
    if (!watched) {
      seen = button("seenbtn", null, function () {
        if (seen.disabled) return;
        seen.disabled = true;
        setStatus(item, "watched", getMine(item).rating).then(function (ok) {
          if (ok && d.data) d.data.my = { watch_count: 1, last_watched_on: todayStr() };
          if (topDetail() === d) renderActions(d);
        });
      });
      seen.appendChild(icon("check", 20));
      seen.appendChild(el("span", "", t("btn_seen")));
    } else {
      seen = button("seenbtn done", null, function () { openWatchedMenu(d); });
      var left = el("span", "l");
      left.appendChild(icon("check", 20));
      var cnt = my && my.watch_count > 1 ? " · " + t("rw_n", { n: my.watch_count }) : "";
      left.appendChild(el("span", "", t("status_watched") + cnt));
      seen.appendChild(left);
      if (my && my.last_watched_on) seen.appendChild(el("span", "r", shortDate(my.last_watched_on)));
    }
    row.appendChild(seen);

    // add to list (button comes from lists.js)
    if (FX.hooks.detailAction) FX.hooks.detailAction(d, row);

    if (!watched) return;

    renderMineSections(d, box);
  }

  // rating, feelings and favorite character of the title itself (movie or series marked as watched)
  function renderMineSections(d, box) {
    var item = d.item;
    var secs = el("div", "mv-secs");
    box.appendChild(secs);

    // 1) rating: five stars (stored as 2, 4, 6, 8, 10)
    var s1 = el("div", "mv-sec");
    s1.appendChild(el("h4", "", t(item.media_type === "tv" ? "dt_rate_h_tv" : "dt_rate_h")));
    var stars = el("div", "stars");
    s1.appendChild(stars);
    secs.appendChild(s1);
    function drawStars() {
      clear(stars);
      var r = getMine(item).rating;
      var cur = r ? Math.ceil(r / 2) : 0;
      for (var n = 1; n <= 5; n++) {
        (function (num) {
          var b = button("star" + (cur >= num ? " lit" : "") + (cur === num ? " on" : ""), null, function () {
            var next = cur === num ? null : num * 2;
            var oldR = getMine(item).rating;
            setStatus(item, "watched", next).then(function (ok) {
              if (ok) { statsMine(d, oldR, next, null, null); drawStars(); }
            });
          });
          b.appendChild(icon("star", 22));
          // no choice yet: the word (Bad ... Wow); after choosing: the share of people for every star
          var stc = d.data && d.data.stats;
          b.appendChild(el("span", "", cur > 0 && stc ? pctText(stc.stars[num - 1], stc.rated) : t(STAR_KEYS[num - 1])));
          stars.appendChild(b);
        })(n);
      }
    }
    drawStars();

    if (!d.data) return;

    // 2) feelings (up to 3)
    var s2 = el("div", "mv-sec");
    s2.appendChild(el("h4", "", t("dt_feel_h")));
    var moods = el("div", "moods");
    s2.appendChild(moods);
    secs.appendChild(s2);
    function drawMoods() {
      clear(moods);
      var sel = d.data.mood || [];
      MOODS.forEach(function (e) {
        var on = sel.indexOf(e) >= 0;
        var b = button("mood" + (on ? " on" : ""), null, function () {
          var next = on ? sel.filter(function (x) { return x !== e; }) : sel.concat([e]).slice(-3);
          setStatus(item, "watched", getMine(item).rating, { mood: next }).then(function (ok) {
            if (ok) { statsMine(d, getMine(item).rating, getMine(item).rating, sel, next); d.data.mood = next; drawMoods(); }
          });
        });
        b.appendChild(el("span", "e", e));
        var smc = d.data.stats;
        b.appendChild(el("span", "", sel.length && smc ? pctText((smc.moods && smc.moods[e]) || 0, smc.moded) : t(MOOD_KEYS[e])));
        b.setAttribute("aria-label", t(MOOD_KEYS[e]));
        moods.appendChild(b);
      });
    }
    drawMoods();

    // 3) favorite character (the card shows the character; it is saved with the actor's picture)
    var cast = (d.data.cast || []).filter(function (c) { return c.id; });
    if (cast.length) {
      var s3 = el("div", "mv-sec");
      s3.appendChild(el("h4", "", t("dt_char_h")));
      var chars = el("div", "hscroll pc-row");
      s3.appendChild(chars);
      secs.appendChild(s3);
      var drawChars = function () {
        var keep = chars.scrollLeft;
        clear(chars);
        var fav = d.data.fav_actor;
        cast.forEach(function (c, i) {
          var label = c.character || c.name;
          var on = !!fav && fav.id === c.id;
          var card = personCard(c.name, c.character, c.photo, i, "button");
          if (on) card.classList.add("on");
          var tick = el("span", "pc-tick");
          tick.appendChild(icon("check", 13));
          card.appendChild(tick);
          card.addEventListener("click", function () {
            var next = on ? null : { id: c.id, name: label.slice(0, 100), photo: c.photo || null };
            setStatus(item, "watched", getMine(item).rating, { actor: next }).then(function (ok) {
              if (ok) { d.data.fav_actor = next; drawChars(); }
            });
          });
          chars.appendChild(card);
        });
        chars.scrollLeft = keep;
      };
      drawChars();
    }
  }

  function renderActions(d) {
    if (d.item.media_type === "movie") { renderMovieActions(d); return; }
    renderSeriesActions(d);
  }

  function renderTabs(d) {
    var box = d.els.tabs;
    clear(box);
    var tabs = [];
    tabs.push(["cast", "tab_cast"]);
    tabs.push(["crew", "tab_crew"]);
    tabs.forEach(function (pair) {
      box.appendChild(button("dtab" + (d.tab === pair[0] ? " active" : ""), t(pair[1]), function () {
        d.tab = pair[0];
        renderTabs(d);
        renderPane(d);
      }));
    });
  }

  function renderPane(d) {
    var pane = d.els.pane;
    clear(pane);
    if (d.error && !d.data) { pane.appendChild(msg(d.error, true)); return; }
    if (!d.data) { pane.appendChild(msg(t("loading"))); return; }
    var data = d.data;

    if (d.tab === "overview") {
      if (data.tagline) pane.appendChild(el("p", "tagline", data.tagline));
      if (data.overview) pane.appendChild(el("p", "overview", data.overview));
      var facts = el("div", "facts");
      if (data.genres && data.genres.length) pane.appendChild(el("p", "gen", data.genres.join(" · ")));
      if (d.item.media_type === "tv" && data.directors && data.directors.length) {
        var f = el("div", "fact");
        f.appendChild(el("span", "fact-label", t(d.item.media_type === "tv" ? "created_by" : "director")));
        f.appendChild(el("span", "fact-value", data.directors.join(", ")));
        facts.appendChild(f);
      }
      if (data.seasons) {
        var s = el("div", "fact");
        s.appendChild(el("span", "fact-value", t("seasons_n", { n: data.seasons })));
        facts.appendChild(s);
      }
      if (facts.firstChild) pane.appendChild(facts);
    } else {
      var people = d.tab === "crew" ? data.crew : data.cast;
      if (!people || !people.length) { pane.appendChild(msg("—")); return; }
      var row = el("div", "hscroll pc-row");
      people.forEach(function (c, i) {
        var pcard = personCard(c.name, d.tab === "crew" ? c.job : c.character, c.photo, i, "button");
        pcard.addEventListener("click", function () { openPerson({ id: c.id, name: c.name, photo: c.photo }); });
        row.appendChild(pcard);
      });
      pane.appendChild(row);
    }
  }

  // ---------- edit sheet (status, rating, feelings, favorite actor) ----------
  var MOODS = ["😍", "😂", "😢", "😱", "🤯", "😴", "😡", "🤔"];

  // opts.rate = true: opened right after "Seen", so it is titled "How was it?" and has no status choice.
  function openEditSheet(d, opts) {
    opts = opts || {};
    var rateMode = !!opts.rate;
    var item = d.item;
    var m = getMine(item);
    var hasData = !!d.data;
    var selStatus = m.status, selRating = m.rating, saving = false;
    var wasWatched = m.status === "watched";
    var myW = d.data && d.data.my;
    var selRewatch = !!opts.rewatch && wasWatched;
    var selDate = selRewatch ? todayStr() : (myW && myW.last_watched_on) || todayStr();
    var dateTouched = false;
    var isMovie = item.media_type === "movie";
    var selMood = d.data && d.data.mood ? d.data.mood.slice() : [];
    var selActor = d.data && d.data.fav_actor ? d.data.fav_actor : null;
    var cast = d.data && d.data.cast ? d.data.cast.filter(function (c) { return c.id; }) : [];

    openSheet(function (sh) {
      var heading = d.data ? d.data.title : displayTitle(item);
      sh.appendChild(el("h3", "sheet-title", rateMode ? t("rate_title") : heading));
      if (rateMode) sh.appendChild(el("p", "rate-sub", heading));

      var st = el("div", "pills");
      if (!rateMode) {
        sh.appendChild(el("div", "label", t("status_label")));
        sh.appendChild(st);
      }
      var extra = el("div");
      sh.appendChild(extra);

      var actions = el("div", "sheet-actions");
      var save = button("btn primary", t("btn_save"));
      var remove = button("btn danger" + (m.status && !rateMode ? "" : " hidden"), t("btn_remove"));
      actions.appendChild(save);
      actions.appendChild(remove);
      actions.appendChild(button("btn glass", t("btn_close"), closeSheet));
      sh.appendChild(actions);

      function drawRating(box) {
        clear(box);
        for (var n = 1; n <= 10; n++) {
          (function (num) {
            box.appendChild(button("pill" + (selRating === num ? " sel" : ""), String(num), function () {
              selRating = selRating === num ? null : num;
              drawRating(box);
            }));
          })(n);
        }
      }

      function drawMood(box) {
        clear(box);
        MOODS.forEach(function (e) {
          var on = selMood.indexOf(e) >= 0;
          box.appendChild(button("emo" + (on ? " sel" : ""), e, function () {
            if (on) selMood = selMood.filter(function (x) { return x !== e; });
            else { selMood.push(e); if (selMood.length > 3) selMood.shift(); }
            drawMood(box);
          }));
        });
      }

      function drawActors(box) {
        var nodes = [];
        function paint() {
          nodes.forEach(function (n) { n.node.classList.toggle("sel", !!selActor && selActor.id === n.c.id); });
        }
        cast.forEach(function (c) {
          var a = button("actor", null, function () {
            selActor = selActor && selActor.id === c.id ? null : { id: c.id, name: c.name, photo: c.photo || null };
            paint();
          });
          var wrap = el("span", "actor-wrap");
          if (c.photo) {
            var img = el("img", "actor-img");
            img.src = c.photo;
            img.alt = "";
            img.loading = "lazy";
            wrap.appendChild(img);
          } else {
            wrap.appendChild(el("span", "actor-img", (c.name || "?").charAt(0)));
          }
          var heart = el("span", "actor-heart");
          heart.appendChild(icon("check", 12));
          wrap.appendChild(heart);
          a.appendChild(wrap);
          a.appendChild(el("span", "actor-name", c.name));
          box.appendChild(a);
          nodes.push({ node: a, c: c });
        });
        paint();
      }

      // Rating, feelings and favorite actor are only shown for titles marked as watched.
      function drawExtra() {
        clear(extra);
        if (selStatus !== "watched") {
          extra.appendChild(el("div", "rate-locked", t("rate_locked")));
          return;
        }
        if (FEATURES.rewatch && isMovie) {
          var wrow = el("div", "wrow");
          var wl = el("label", "wd");
          wl.appendChild(icon("cal", 17));
          wl.appendChild(el("span", "", t("wdate")));
          var wi = document.createElement("input");
          wi.type = "date";
          wi.max = todayStr();
          wi.value = selDate;
          wi.addEventListener("change", function () {
            if (wi.value) { selDate = wi.value; dateTouched = true; }
          });
          wl.appendChild(wi);
          wrow.appendChild(wl);
          if (wasWatched && !rateMode) {
            var rwb = button("rwb" + (selRewatch ? " on" : ""), null, function () {
              selRewatch = !selRewatch;
              if (selRewatch && !dateTouched) { selDate = todayStr(); wi.value = selDate; }
              rwb.classList.toggle("on", selRewatch);
            });
            rwb.appendChild(icon("repeat", 16));
            rwb.appendChild(el("span", "", t("rwl")));
            wrow.appendChild(rwb);
          }
          extra.appendChild(wrow);
        }
        extra.appendChild(el("div", "label", t("my_rating")));
        var rb = el("div", "pills nums");
        extra.appendChild(rb);
        drawRating(rb);
        if (hasData) {
          extra.appendChild(el("div", "label", t("rate_feel")));
          var mb = el("div", "emos");
          extra.appendChild(mb);
          drawMood(mb);
          if (cast.length) {
            extra.appendChild(el("div", "label", t("rate_actor")));
            extra.appendChild(el("p", "rate-hint", t("rate_actor_hint")));
            var ab = el("div", "actors");
            extra.appendChild(ab);
            drawActors(ab);
          }
        }
      }

      function drawStatus() {
        clear(st);
        STATUS_ORDER.forEach(function (s) {
          st.appendChild(button("pill" + (selStatus === s ? " sel" : ""), t("status_" + s), function () {
            selStatus = s;
            drawStatus();
            drawExtra();
            save.disabled = !selStatus || saving;
          }));
        });
      }

      if (!rateMode) drawStatus();
      drawExtra();
      save.disabled = !selStatus;

      save.addEventListener("click", function () {
        if (!selStatus || saving) return;
        saving = true;
        save.disabled = true;
        save.textContent = t("btn_saving");
        var isWatched = selStatus === "watched";
        var extras = hasData ? { mood: isWatched ? selMood : [], actor: isWatched ? selActor : null } : {};
        var sendRewatch = isWatched && isMovie && FEATURES.rewatch && selRewatch && wasWatched;
        if (isWatched && isMovie && FEATURES.rewatch && (sendRewatch || dateTouched)) extras.watched_on = selDate;
        if (sendRewatch) extras.rewatch = true;
        setStatus(item, selStatus, isWatched ? selRating : null, extras).then(function (ok) {
          saving = false;
          if (ok) {
            if (d.data) {
              d.data.mood = isWatched ? selMood : [];
              d.data.fav_actor = isWatched ? selActor : null;
              if (isWatched && isMovie && FEATURES.rewatch) {
                var prev = d.data.my || { watch_count: 0, last_watched_on: null };
                if (sendRewatch) d.data.my = { watch_count: prev.watch_count + 1, last_watched_on: selDate };
                else if (!wasWatched && !prev.watch_count) d.data.my = { watch_count: 1, last_watched_on: dateTouched ? selDate : todayStr() };
                else if (dateTouched && prev.watch_count) d.data.my = { watch_count: prev.watch_count, last_watched_on: selDate };
              }
            }
            closeSheet();
            if (topDetail() === d) renderActions(d);
          } else {
            save.textContent = t("btn_save");
            save.disabled = false;
          }
        });
      });
      remove.addEventListener("click", function () {
        if (saving) return;
        saving = true;
        removeFromLibrary(item).then(function (ok) {
          saving = false;
          if (ok) { closeSheet(); if (topDetail() === d) renderActions(d); }
        });
      });
    });
  }

  // ---------- series page: actions, seasons, episodes, episode page ----------
  function num(n) {
    try { return Number(n).toLocaleString(I18N.lang === "fa" ? "fa-IR" : undefined); } catch (e) { return String(n); }
  }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function newEpState(d) {
    return { d: d, item: d.item, seasons: [], total: 0, watched: 0, open: null, cache: {}, pending: {}, next: null, nextBusy: false, busy: false, status: "idle", note: "" };
  }

  function epActive(state) { return topDetail() === state.d; }
  function epRecalc(state) {
    var sum = 0;
    state.seasons.forEach(function (s) { sum += s.watched; });
    state.watched = sum;
  }

  function loadEps(state) {
    state.status = "loading";
    renderEps(state);
    api(L("/api/tv?tmdb_id=" + state.item.tmdb_id)).then(function (res) {
      if (res.status !== 200) { state.status = "error"; state.note = problem(res, "err_load"); }
      else {
        state.status = "ready";
        state.seasons = res.data.seasons || [];
        state.total = res.data.total || 0;
        state.watched = res.data.watched || 0;
      }
      if (epActive(state)) renderEps(state);
    }).catch(function () {
      state.status = "error";
      state.note = t("err_network");
      if (epActive(state)) renderEps(state);
    });
  }

  // Loads the episodes of one season once; gives back a promise with { episodes } or { error }.
  function ensureSeason(state, sNum) {
    var c = state.cache[sNum];
    if (c && c.episodes) return Promise.resolve(c);
    if (state.pending[sNum]) return state.pending[sNum];
    var p = api(L("/api/episodes?tmdb_id=" + state.item.tmdb_id + "&season=" + sNum)).then(function (res) {
      delete state.pending[sNum];
      state.cache[sNum] = res.status === 200 ? { episodes: res.data.episodes || [] } : { error: problem(res, "err_load") };
      return state.cache[sNum];
    }).catch(function () {
      delete state.pending[sNum];
      state.cache[sNum] = { error: t("err_network") };
      return state.cache[sNum];
    });
    state.pending[sNum] = p;
    state.cache[sNum] = { loading: true };
    return p;
  }

  function applyServer(state, data, seasonNum) {
    state.watched = data.watched;
    if (data.total !== null && data.total !== undefined) state.total = data.total;
    if (seasonNum && data.season_watched !== null && data.season_watched !== undefined) {
      state.seasons.forEach(function (s) {
        if (s.season_number === seasonNum) s.watched = Math.min(data.season_watched, s.episode_count);
      });
    }
    var item = state.item, d = state.d;
    if (data.library_status && data.library_status !== getMine(item).status) {
      mine[key(item)] = { status: data.library_status, rating: getMine(item).rating };
      library.stale = true;
    }
    // every episode done -> the series becomes "watched"; one taken back -> back to "watching"
    var cur = getMine(item).status;
    if (data.complete && cur !== "watched") {
      setStatus(item, "watched", getMine(item).rating).then(function () { if (topDetail() === d) renderActions(d); });
    } else if (!data.complete && cur === "watched") {
      setStatus(item, "watching", null).then(function () { if (topDetail() === d) renderActions(d); });
    } else if (topDetail() === d) {
      renderActions(d);
    }
  }

  function mutateEps(state, body, optimistic) {
    if (state.busy) return;
    state.busy = true;
    var snapshot = JSON.parse(JSON.stringify({ seasons: state.seasons, watched: state.watched, cache: state.cache }));
    optimistic();
    state.note = "";
    renderEps(state);
    function undo(message) {
      state.seasons = snapshot.seasons;
      state.watched = snapshot.watched;
      state.cache = snapshot.cache;
      state.note = message;
    }
    api("/api/episodes", { method: "PUT", body: body }).then(function (res) {
      state.busy = false;
      if (res.status === 200) { applyServer(state, res.data, body.season || null); haptic(); }
      else undo(problem(res, "err_save"));
      if (epActive(state)) renderEps(state);
    }).catch(function () {
      state.busy = false;
      undo(t("err_network"));
      if (epActive(state)) renderEps(state);
    });
  }

  function findSeason(state, num) {
    for (var i = 0; i < state.seasons.length; i++) if (state.seasons[i].season_number === num) return state.seasons[i];
    return null;
  }

  function seasonIndex(state, num) {
    for (var i = 0; i < state.seasons.length; i++) if (state.seasons[i].season_number === num) return i;
    return -1;
  }

  function markEpisodeLocal(e, value) {
    e.watched = value;
    e.watched_on = value ? todayStr() : null;
    if (!value) e.my = null;
  }

  function toggleEpisode(state, seasonNum, episode) {
    var value = !episode.watched;
    mutateEps(state, { tmdb_id: state.item.tmdb_id, scope: "episode", season: seasonNum, episode: episode.episode_number, watched: value }, function () {
      markEpisodeLocal(episode, value);
      var s = findSeason(state, seasonNum);
      if (s) s.watched = Math.max(0, Math.min(s.episode_count, s.watched + (value ? 1 : -1)));
      epRecalc(state);
    });
  }

  function setSeason(state, seasonNum, value) {
    mutateEps(state, { tmdb_id: state.item.tmdb_id, scope: "season", season: seasonNum, watched: value }, function () {
      var c = state.cache[seasonNum];
      if (c && c.episodes) c.episodes.forEach(function (e) { markEpisodeLocal(e, value); });
      var s = findSeason(state, seasonNum);
      if (s) s.watched = value ? s.episode_count : 0;
      epRecalc(state);
    });
  }

  function setAllEpisodes(state, value) {
    mutateEps(state, { tmdb_id: state.item.tmdb_id, scope: "all", watched: value }, function () {
      state.seasons.forEach(function (s) {
        s.watched = value ? s.episode_count : 0;
        var c = state.cache[s.season_number];
        if (c && c.episodes) c.episodes.forEach(function (e) { markEpisodeLocal(e, value); });
      });
      epRecalc(state);
    });
  }

  // First episode I have not watched yet (loads that season if needed). Used for "Up next".
  function refreshNext(state) {
    if (state.nextBusy || state.status !== "ready") return;
    var s = null;
    for (var i = 0; i < state.seasons.length; i++) {
      if (state.seasons[i].watched < state.seasons[i].episode_count) { s = state.seasons[i]; break; }
    }
    var d = state.d;
    if (!s) {
      if (state.next) { state.next = null; if (topDetail() === d) renderActions(d); }
      return;
    }
    state.nextBusy = true;
    ensureSeason(state, s.season_number).then(function (c) {
      state.nextBusy = false;
      var found = null;
      if (c && c.episodes) {
        for (var j = 0; j < c.episodes.length; j++) if (!c.episodes[j].watched) { found = c.episodes[j]; break; }
      }
      var nk = found ? s.season_number + "-" + found.episode_number : "";
      var ok = state.next ? state.next.s + "-" + state.next.e.episode_number : "";
      state.next = found ? { s: s.season_number, e: found } : null;
      if (nk !== ok && topDetail() === d) renderActions(d);
    });
  }

  function renderSeason(state, s) {
    var isOpen = state.open === s.season_number;
    var full = s.watched >= s.episode_count;
    var box = el("div", "sx-season" + (isOpen ? " open" : ""));
    var head = button("sx-head", null, function () {
      state.open = isOpen ? null : s.season_number;
      if (!isOpen) ensureSeason(state, s.season_number).then(function () { if (epActive(state)) renderEps(state); });
      renderEps(state);
    });
    head.appendChild(el("span", "", t("season_n", { n: num(s.season_number) })));
    var right = el("small", full ? "full" : "");
    right.appendChild(document.createTextNode(num(s.watched) + " / " + num(s.episode_count)));
    right.appendChild(icon("chevron", 16));
    head.appendChild(right);
    box.appendChild(head);
    var bar = el("div", "sx-bar");
    var fill = el("i");
    fill.style.width = Math.round((s.watched / Math.max(1, s.episode_count)) * 100) + "%";
    bar.appendChild(fill);
    box.appendChild(bar);

    if (isOpen) {
      var c = state.cache[s.season_number];
      var body = el("div", "sx-list");
      if (!c || c.loading) body.appendChild(msg(t("loading")));
      else if (c.error) body.appendChild(msg(c.error, true));
      else {
        body.appendChild(button("sx-markall", t(full ? "unmark_season" : "mark_season"), function () { setSeason(state, s.season_number, !full); }));
        c.episodes.forEach(function (e, i) {
          var row = el("div", "sx-ep" + (e.watched ? " on" : ""));
          var open = button("sx-epm", null, function () { openEpisode(state, s.season_number, e.episode_number); });
          var th = el("span", "sx-th", String(e.episode_number));
          th.style.background = "linear-gradient(" + (140 + i * 25) + "deg,#" + PC_COLORS[(i + s.season_number) % PC_COLORS.length] + ",#14143a)";
          if (e.still) {
            var im = el("img");
            im.src = e.still;
            im.alt = "";
            im.loading = "lazy";
            im.addEventListener("error", function () { im.remove(); });
            th.appendChild(im);
          }
          open.appendChild(th);
          var nm = el("span", "sx-nm");
          nm.appendChild(el("b", "", e.name || t("episode_n", { n: e.episode_number })));
          var sub = ["E" + pad2(e.episode_number)];
          if (e.runtime) sub.push(formatRuntime(e.runtime));
          nm.appendChild(el("small", "", sub.join(" · ")));
          open.appendChild(nm);
          row.appendChild(open);
          var ck = button("sx-ck", null, function () { toggleEpisode(state, s.season_number, e); });
          ck.setAttribute("aria-label", t("status_watched"));
          ck.appendChild(icon("check", 16));
          row.appendChild(ck);
          body.appendChild(row);
        });
      }
      box.appendChild(body);
    }
    return box;
  }

  function renderEps(state) {
    if (!epActive(state)) return;
    var host = state.d.els.eps;
    if (!host || !host.isConnected) return;
    clear(host);
    if (state.status === "idle" || state.status === "loading") { host.appendChild(msg(t("loading"))); return; }
    if (state.status === "error") { host.appendChild(msg(state.note, true)); return; }
    if (!state.seasons.length) return;
    if (state.note) host.appendChild(msg(state.note, true));
    state.seasons.forEach(function (s) { host.appendChild(renderSeason(state, s)); });
    renderActions(state.d);
    refreshNext(state);
    if (epPage && epPage.state === state) drawEpisode(epPage);
  }

  // cast and crew rows + overview + the episodes; there are no tabs on the series page
  function renderSeriesBody(d) {
    var pane = d.els.pane;
    clear(pane);
    if (d.error && !d.data) { pane.appendChild(msg(d.error, true)); return; }
    if (!d.data) { pane.appendChild(msg(t("loading"))); return; }
    var data = d.data;
    d.els.eps = el("div", "sx-eps");
    pane.appendChild(d.els.eps);
    if (!d.ep) d.ep = newEpState(d);
    if (d.ep.status === "idle") loadEps(d.ep);
    else renderEps(d.ep);

    [["tab_cast", data.cast, "character"], ["tab_crew", data.crew, "job"]].forEach(function (g) {
      var people = g[1];
      if (!people || !people.length) return;
      var sec = el("section", "sx-people");
      sec.appendChild(el("h4", "", t(g[0])));
      var row = el("div", "hscroll pc-row");
      people.forEach(function (c, i) {
        var pcard = personCard(c.name, c[g[2]], c.photo, i, "button");
        pcard.addEventListener("click", function () { openPerson({ id: c.id, name: c.name, photo: c.photo }); });
        row.appendChild(pcard);
      });
      sec.appendChild(row);
      pane.appendChild(sec);
    });
  }

  // ---------- series: the buttons under the title ----------
  function renderSeriesActions(d) {
    var box = d.els.actions;
    clear(box);
    var item = d.item;
    var st = getMine(item).status;
    var ep = d.ep && d.ep.status === "ready" ? d.ep : null;
    if (d.data && st !== "watched") { d.data.mood = []; d.data.fav_actor = null; }

    var row = el("div", "mv-row");
    box.appendChild(row);

    var wl = button("sq" + (st === "want" ? " on" : ""), null, function () {
      var cur = getMine(item).status;
      if (cur && cur !== "want") { toast(t("status_" + cur)); return; }
      var p = cur === "want" ? removeFromLibrary(item) : setStatus(item, "want", null);
      p.then(function () { if (topDetail() === d) renderActions(d); });
    });
    wl.setAttribute("aria-label", t("btn_watchlist"));
    wl.appendChild(icon("bookmark", 22));
    row.appendChild(wl);

    var main;
    if (!st || st === "want") {
      main = button("seenbtn", null, function () {
        if (main.disabled) return;
        main.disabled = true;
        setStatus(item, "watching", null).then(function () { if (topDetail() === d) renderActions(d); });
      });
      main.appendChild(icon("play", 18));
      main.appendChild(el("span", "", t("sx_start")));
    } else if (st === "watched") {
      main = button("seenbtn done", null, function () { openSeriesMenu(d); });
      var l1 = el("span", "l");
      l1.appendChild(icon("check", 20));
      l1.appendChild(el("span", "", t("status_watched")));
      main.appendChild(l1);
      if (ep) main.appendChild(el("span", "r", num(ep.total) + " / " + num(ep.total)));
    } else {
      main = button("seenbtn prog", null, function () { openSeriesMenu(d); });
      if (ep && ep.total) {
        var fill = el("i");
        fill.style.width = Math.round((ep.watched / ep.total) * 100) + "%";
        main.appendChild(fill);
      }
      var l2 = el("span", "l");
      l2.appendChild(icon("eye", 20));
      l2.appendChild(el("span", "", t("status_" + st)));
      main.appendChild(l2);
      if (ep) main.appendChild(el("span", "r", num(ep.watched) + " / " + num(ep.total)));
    }
    row.appendChild(main);

    if (FX.hooks.detailAction) FX.hooks.detailAction(d, row);

    if ((st === "watching" || st === "paused") && ep && ep.next) {
      var n = ep.next;
      var nx = el("div", "sx-next");
      var nb = el("span", "nb");
      nb.appendChild(icon("play", 16));
      nx.appendChild(nb);
      var tx = button("nx", null, function () { openEpisode(ep, n.s, n.e.episode_number); });
      tx.appendChild(el("small", "", t("sx_next")));
      tx.appendChild(el("b", "", t("sx_sxex", { s: n.s, e: n.e.episode_number }) + (n.e.name ? " — " + n.e.name : "")));
      nx.appendChild(tx);
      nx.appendChild(button("go", t("sx_mark"), function () { toggleEpisode(ep, n.s, n.e); }));
      box.appendChild(nx);
    }
  }

  function menuRow(sh, cls, iconName, label, handler) {
    var r = button("mi " + cls, null, handler);
    r.appendChild(icon(iconName, 20));
    r.appendChild(el("span", "", label));
    sh.appendChild(r);
  }

  function openSeriesMenu(d) {
    var item = d.item;
    var st = getMine(item).status;
    var ep = d.ep && d.ep.status === "ready" ? d.ep : null;
    function setTo(status) {
      closeSheet();
      setStatus(item, status, null).then(function () { if (topDetail() === d) renderActions(d); });
    }
    openSheet(function (sh) {
      if (st !== "watched") {
        if (ep && ep.next) menuRow(sh, "", "skip", t("sx_m_next"), function () { closeSheet(); toggleEpisode(ep, ep.next.s, ep.next.e); });
        if (ep) menuRow(sh, "", "all", t("sx_m_all"), function () { closeSheet(); setAllEpisodes(ep, true); });
        if (st === "watching") menuRow(sh, "", "pause", t("sx_m_hold"), function () { setTo("paused"); });
        else menuRow(sh, "", "play", t("sx_m_resume"), function () { setTo("watching"); });
        if (st !== "dropped") menuRow(sh, "", "x", t("sx_m_drop"), function () { setTo("dropped"); });
      }
      menuRow(sh, "red", "x", t("sx_m_remove"), function () { closeSheet(); removeSeries(d); });
    });
  }

  // "Remove from my shows": out of the library, and the episodes I marked are cleared too.
  function removeSeries(d) {
    var item = d.item, ep = d.ep;
    removeFromLibrary(item).then(function (ok) {
      if (!ok) return;
      if (d.data) { d.data.mood = []; d.data.fav_actor = null; }
      if (ep && ep.status === "ready" && ep.watched > 0) {
        api("/api/episodes", { method: "PUT", body: { tmdb_id: item.tmdb_id, scope: "all", watched: false } });
        ep.seasons.forEach(function (s) { s.watched = 0; });
        Object.keys(ep.cache).forEach(function (k) {
          if (ep.cache[k].episodes) ep.cache[k].episodes.forEach(function (e) { markEpisodeLocal(e, false); });
        });
        epRecalc(ep);
        ep.next = null;
      }
      if (topDetail() === d) { if (ep) renderEps(ep); renderActions(d); }
    });
  }

  // ---------- episode page (opens over the series page) ----------
  var epPage = null;

  function closeEpisode() {
    if (!epPage) return;
    epPage.root.remove();
    epPage = null;
  }

  function findEpisode(state, sn, en) {
    var c = state.cache[sn];
    if (!c || !c.episodes) return null;
    for (var i = 0; i < c.episodes.length; i++) if (c.episodes[i].episode_number === en) return c.episodes[i];
    return null;
  }

  function openEpisode(state, sn, en) {
    closeEpisode();
    var root = el("div", "ep-page");
    $("detail").appendChild(root);
    var pg = { root: root, state: state, sn: sn, en: en, scroller: null };
    epPage = pg;
    state.open = sn;
    drawEpisode(pg, true);
    ensureSeason(state, sn).then(function () { if (epPage === pg) drawEpisode(pg, true); });
  }

  function goEpisode(pg, dir) {
    var state = pg.state;
    var c = state.cache[pg.sn];
    var list = (c && c.episodes) || [];
    var idx = -1;
    for (var i = 0; i < list.length; i++) if (list[i].episode_number === pg.en) { idx = i; break; }
    var nxt = list[idx + dir];
    if (idx >= 0 && nxt) { pg.en = nxt.episode_number; drawEpisode(pg, true); return; }
    var adj = state.seasons[seasonIndex(state, pg.sn) + dir];
    if (!adj) return;
    ensureSeason(state, adj.season_number).then(function (cc) {
      if (epPage !== pg || !cc.episodes || !cc.episodes.length) return;
      pg.sn = adj.season_number;
      pg.en = dir > 0 ? cc.episodes[0].episode_number : cc.episodes[cc.episodes.length - 1].episode_number;
      state.open = pg.sn;
      drawEpisode(pg, true);
    });
  }

  function drawEpisode(pg, toTop) {
    var state = pg.state, d = state.d, root = pg.root;
    var keepY = pg.scroller && !toTop ? pg.scroller.scrollTop : 0;
    clear(root);
    var sn = pg.sn, en = pg.en;
    var e = findEpisode(state, sn, en);
    var scroller = el("div", "page-scroll");
    pg.scroller = scroller;
    root.appendChild(scroller);

    var hero = el("div", "d-hero ep-hero");
    if (e && e.still) {
      var img = el("img", "d-hero-img");
      img.src = e.still;
      img.alt = "";
      hero.appendChild(img);
    }
    hero.appendChild(el("div", "d-hero-shade"));
    scroller.appendChild(hero);

    var ser = el("div", "ep-ser");
    ser.appendChild(posterNode(d.data || d.item, "ep-mp"));
    ser.appendChild(el("span", "", d.data ? d.data.title : displayTitle(d.item)));
    scroller.appendChild(ser);

    // previous / next episode
    var list = (state.cache[sn] && state.cache[sn].episodes) || [];
    var idx = -1;
    for (var i = 0; i < list.length; i++) if (list[i].episode_number === en) { idx = i; break; }
    var si = seasonIndex(state, sn);
    var hasPrev = idx > 0 || si > 0;
    var hasNext = (idx >= 0 && idx < list.length - 1) || (si >= 0 && si < state.seasons.length - 1);
    var nav = el("div", "ep-nav");
    var pb = iconButton("", "chevron", t("sx_prev"), function () { goEpisode(pg, -1); });
    pb.firstChild.classList.add("flip");
    pb.disabled = !hasPrev;
    nav.appendChild(pb);
    nav.appendChild(el("h2", "", "S" + pad2(sn) + " E" + pad2(en)));
    var nb = iconButton("", "chevron", t("sx_nextep"), function () { goEpisode(pg, 1); });
    nb.disabled = !hasNext;
    nav.appendChild(nb);
    scroller.appendChild(nav);
    if (e && e.name) scroller.appendChild(el("p", "ep-title", e.name));

    var back = iconButton("round-btn", "back", t("btn_close"), closeEpisode);
    back.firstChild.classList.add("flip");
    root.appendChild(back);

    var body = el("div", "ep-body");
    scroller.appendChild(body);
    if (!e) {
      var c = state.cache[sn];
      body.appendChild(msg(c && c.error ? c.error : t("loading"), !!(c && c.error)));
      return;
    }

    // watched button
    var row = el("div", "mv-row");
    body.appendChild(row);
    var seen;
    if (!e.watched) {
      seen = button("seenbtn", null, function () { toggleEpisode(state, sn, e); });
      seen.appendChild(icon("check", 20));
      seen.appendChild(el("span", "", t("btn_seen")));
    } else {
      seen = button("seenbtn done", null, function () {
        openSheet(function (sh) {
          menuRow(sh, "red", "x", t("rw_unwatch"), function () { closeSheet(); toggleEpisode(state, sn, e); });
        });
      });
      var left = el("span", "l");
      left.appendChild(icon("check", 20));
      left.appendChild(el("span", "", t("status_watched")));
      seen.appendChild(left);
      if (e.watched_on) seen.appendChild(el("span", "r", shortDate(e.watched_on)));
    }
    row.appendChild(seen);

    if (e.watched) renderEpisodeMine(pg, e, body, sn, en);

    // what others say (screens come later)
    var com = el("div", "mv-sec");
    com.appendChild(el("h4", "", t("sx_community")));
    var rows = el("div", "drows");
    var cr = button("drow", null, function () { toast(t("pf_soon")); });
    cr.appendChild(el("span", "", t("dt_comments")));
    var cend = el("span", "rowc");
    var chev = icon("chevron", 16);
    chev.classList.add("flip");
    cend.appendChild(chev);
    cr.appendChild(cend);
    rows.appendChild(cr);
    com.appendChild(rows);
    body.appendChild(com);

    // episode info
    var info = el("div", "mv-sec ep-info");
    info.appendChild(el("h4", "", t("sx_einfo")));
    var meta = [];
    if (e.runtime) meta.push(formatRuntime(e.runtime));
    if (e.air_date) meta.push(niceDate(e.air_date));
    if (meta.length) info.appendChild(el("small", "", meta.join(" · ")));
    if (e.overview) info.appendChild(el("p", "overview", e.overview));
    if (e.vote) {
      var pill = el("span", "ep-pill");
      var five = Math.round(e.vote / 2);
      pill.appendChild(document.createTextNode(num((Math.round(e.vote * 5) / 10)) + " "));
      pill.appendChild(el("span", "st", "★★★★★".slice(0, five) + "☆☆☆☆☆".slice(0, 5 - five)));
      info.appendChild(pill);
    }
    body.appendChild(info);
    scroller.scrollTop = keepY;
  }

  // my rating, feelings and favorite character for ONE episode (shown when the episode is marked watched)
  function renderEpisodeMine(pg, e, box, sn, en) {
    var state = pg.state, d = state.d;
    var my = e.my || (e.my = { rating: null, mood: [], actor: null });
    var wrap = el("div");
    box.appendChild(wrap);
    var cast = ((d.data && d.data.cast) || []).filter(function (c) { return c.id; });
    var charsEl = null;

    function put(patch) {
      var prev = JSON.parse(JSON.stringify(my));
      Object.keys(patch).forEach(function (k) { my[k] = patch[k]; });
      draw();
      var body = { tmdb_id: state.item.tmdb_id, season: sn, episode: en };
      Object.keys(patch).forEach(function (k) { body[k] = patch[k]; });
      api("/api/episode-note", { method: "PUT", body: body }).then(function (res) {
        if (res.status !== 200) { revert(problem(res, "err_save")); return; }
        haptic();
      }).catch(function () { revert(t("err_network")); });
      function revert(message) {
        Object.keys(prev).forEach(function (k) { my[k] = prev[k]; });
        draw();
        toast(message, true);
      }
    }

    function draw() {
      var keep = charsEl ? charsEl.scrollLeft : 0;
      clear(wrap);
      // stars
      var s1 = el("div", "mv-sec");
      s1.appendChild(el("h4", "", t("sx_rate_ep")));
      var stars = el("div", "stars");
      var cur = my.rating ? Math.ceil(my.rating / 2) : 0;
      for (var n = 1; n <= 5; n++) {
        (function (num) {
          var b = button("star" + (cur >= num ? " lit" : "") + (cur === num ? " on" : ""), null, function () {
            put({ rating: cur === num ? null : num * 2 });
          });
          b.appendChild(icon("star", 22));
          b.appendChild(el("span", "", t(STAR_KEYS[num - 1])));
          stars.appendChild(b);
        })(n);
      }
      s1.appendChild(stars);
      wrap.appendChild(s1);
      // feelings (up to 3)
      var s2 = el("div", "mv-sec");
      s2.appendChild(el("h4", "", t("dt_feel_h")));
      var moods = el("div", "moods");
      MOODS.forEach(function (em) {
        var on = my.mood.indexOf(em) >= 0;
        var b = button("mood" + (on ? " on" : ""), null, function () {
          put({ mood: on ? my.mood.filter(function (x) { return x !== em; }) : my.mood.concat([em]).slice(-3) });
        });
        b.appendChild(el("span", "e", em));
        b.appendChild(el("span", "", t(MOOD_KEYS[em])));
        moods.appendChild(b);
      });
      s2.appendChild(moods);
      wrap.appendChild(s2);
      // favorite character
      if (cast.length) {
        var s3 = el("div", "mv-sec");
        s3.appendChild(el("h4", "", t("dt_char_h")));
        charsEl = el("div", "hscroll pc-row");
        cast.forEach(function (c, i) {
          var on = !!my.actor && my.actor.id === c.id;
          var card = personCard(c.name, c.character, c.photo, i, "button");
          if (on) card.classList.add("on");
          var tick = el("span", "pc-tick");
          tick.appendChild(icon("check", 13));
          card.appendChild(tick);
          card.addEventListener("click", function () {
            put({ actor: on ? null : { id: c.id, name: (c.character || c.name).slice(0, 100), photo: c.photo || null } });
          });
          charsEl.appendChild(card);
        });
        s3.appendChild(charsEl);
        wrap.appendChild(s3);
        charsEl.scrollLeft = keep;
      }
    }
    draw();
  }

  // ---------- bridge for extra feature files ----------
  FX.api = api;
  FX.L = L;
  FX.el = el;
  FX.clear = clear;
  FX.button = button;
  FX.iconButton = iconButton;
  FX.icon = icon;
  FX.msg = msg;
  FX.toast = toast;
  FX.haptic = haptic;
  FX.problem = problem;
  FX.ingest = ingest;
  FX.openSheet = openSheet;
  FX.closeSheet = closeSheet;
  FX.openDetail = openDetail;
  FX.posterCard = posterCard;
  FX.posterNode = posterNode;
  FX.typeLabel = typeLabel;
  FX.displayTitle = displayTitle;
  FX.sectionHeader = sectionHeader;
  FX.rerender = function () { renderTab(currentTab); };
  FX.openSettings = openSettingsSheet;
  FX.refreshLock = function () { syncLock(); tgBack(); };
  FX.pushBack = function (fn) { FX.backStack.push(fn); FX.refreshLock(); };
  FX.popBack = function (fn) {
    var i = FX.backStack.lastIndexOf(fn);
    if (i >= 0) FX.backStack.splice(i, 1);
    FX.refreshLock();
  };

  // ---------- start ----------
  function showFatal(text) {
    var v = $("view-home");
    clear(v);
    var box = el("div", "empty");
    box.appendChild(icon("film", 44));
    box.appendChild(el("p", "", text));
    v.appendChild(box);
  }

  // A shared link looks like https://t.me/flicksyrobot?startapp=list-CODE ; Telegram hands us "list-CODE" (older links: "l_CODE").
  function readStartParam() {
    try {
      if (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.start_param) {
        return String(Telegram.WebApp.initDataUnsafe.start_param);
      }
    } catch (e) {}
    try {
      var h = new URLSearchParams(location.hash.replace(/^#/, ""));
      var fromHash = h.get("tgWebAppStartParam");
      if (fromHash) return fromHash;
    } catch (e) {}
    try {
      var d = new URLSearchParams(initData);
      var fromData = d.get("start_param");
      if (fromData) return fromData;
    } catch (e) {}
    return "";
  }

  var startHandled = false;
  function openStartParam() {
    if (startHandled) return;
    startHandled = true;
    var param = readStartParam();
    var m = /^(?:list-|list_|l_)([a-z0-9]{4,16})$/.exec(param);
    if (m && FX.openListByCode) FX.openListByCode(m[1]);
    var u = /^user-(\d{3,12})$/.exec(param);
    if (u && FX.openProfile) FX.openProfile(u[1]);
    var ti = /^title-(movie|tv)-(\d{1,9})$/.exec(param);
    if (ti) openDetail({ tmdb_id: parseInt(ti[2], 10), media_type: ti[1] });
  }

  function start(attempt) {
    initData = readInitData();
    if (!initData) {
      if (attempt < 6) { setTimeout(function () { start(attempt + 1); }, 300); return; }
      showFatal(t("err_open_tg"));
      return;
    }
    api("/api/me?lang=" + encodeURIComponent(I18N.lang)).then(function (res) {
      if (res.status !== 200) { showFatal(problem(res, "err_login")); return; }
      me = res.data.user;
      goTab("home");
      openStartParam();
    }).catch(function () { showFatal(t("err_network")); });
  }

  function init() {
    var saved = "en";
    try { saved = localStorage.getItem(LS_LANG) || "en"; } catch (e) {}
    I18N.set(saved);

    try {
      if (window.Telegram && Telegram.WebApp) {
        tg = Telegram.WebApp;
        tg.ready();
        tg.expand();
        try { tg.setHeaderColor("#07071a"); tg.setBackgroundColor("#07071a"); } catch (e) {}
        tg.BackButton.onClick(function () {
          if ($("sheet-root").children.length) closeSheet();
          else if (detailStack.length) backDetail();
          else if (FX.backStack.length) FX.backStack[FX.backStack.length - 1]();
        });
      }
    } catch (e) {}

    renderNav();
    var splash = $("view-home");
    clear(splash);
    splash.appendChild(msg(t("logging_in")));
    start(0);
  }

  // The Telegram script loads asynchronously: wait for the page, then start.
  if (document.readyState === "complete") init();
  else window.addEventListener("load", init);
})();
