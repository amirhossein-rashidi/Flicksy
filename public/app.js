(function () {
  "use strict";

  var t = function (key, params) { return I18N.t(key, params); };
  var $ = function (id) { return document.getElementById(id); };

  // Small bridge so extra feature files (like lists.js) can plug into the app.
  var FX = window.FX = { hooks: {}, backStack: [] };

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
    bell: ["M6 16V11a6 6 0 0 1 12 0v5l2 2H4z", "M10 21h4"]
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

  // extra (optional): { mood: [emoji], actor: { id, name, photo } | null }. Left out = keep what is saved.
  function setStatus(item, status, rating, extra) {
    var body = { tmdb_id: item.tmdb_id, media_type: item.media_type, status: status, rating: rating || null };
    if (extra && extra.mood !== undefined) body.mood = extra.mood;
    if (extra && extra.actor !== undefined) body.actor = extra.actor;
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
  function lazyRow(titleKey, kind, filterFn) {
    var wrap = el("section", "section");
    wrap.appendChild(sectionHeader(t(titleKey)));
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
    greet.appendChild(el("span", "", t("home_sub")));
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

    var tabsHolder = el("div", "segment sp-tabs");
    v.appendChild(tabsHolder);
    var chipsHolder = el("div");
    v.appendChild(chipsHolder);
    var body = el("div", "disc-body");
    v.appendChild(body);

    // The Titles / People tabs show only while the search box is in use (keyboard open) or has text.
    var searching = false;
    function syncTabs() {
      tabsHolder.classList.toggle("hidden", !(searching || disc.q.trim().length > 0));
    }

    function drawTabs() {
      clear(tabsHolder);
      [["titles", "sx_tab_titles"], ["people", "sx_tab_people"]].forEach(function (pair) {
        tabsHolder.appendChild(button("seg-btn" + (disc.tab === pair[0] ? " active" : ""), t(pair[1]), function () {
          if (disc.tab === pair[0]) return;
          disc.tab = pair[0];
          drawTabs(); drawChips(); drawBody();
          if (disc.tab === "titles" && disc.q.trim().length >= 2 && disc.status === "idle") runSearch(disc.q.trim());
        }));
      });
    }

    function drawChips() {
      clear(chipsHolder);
      if (disc.tab !== "titles") return;
      chipsHolder.appendChild(filterChips(disc.filter, function (f) { disc.filter = f; drawChips(); drawBody(); }));
    }

    function drawBody() {
      clear(body);
      if (disc.tab === "people") {
        if (FX.hooks.people) FX.hooks.people(body, disc.q);
        return;
      }
      var q = disc.q.trim();
      if (q.length < 2) {
        if (q.length === 1) body.appendChild(msg(t("search_hint")));
        var f = disc.filter;
        if (f !== "tv") { body.appendChild(lazyRow("sec_top_movies", "top_movies")); body.appendChild(lazyRow("sec_popular_movies", "popular_movies")); }
        if (f !== "movie") { body.appendChild(lazyRow("sec_top_tv", "top_tv")); body.appendChild(lazyRow("sec_popular_tv", "popular_tv")); }
        return;
      }
      if (disc.status === "loading") { body.appendChild(msg(t("searching"))); return; }
      if (disc.status === "error") { body.appendChild(msg(disc.error, true)); return; }
      var list = disc.results.filter(function (r) { return disc.filter === "all" || r.media_type === disc.filter; });
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
    tabsHolder.addEventListener("mousedown", function (e) { e.preventDefault(); });
    input.addEventListener("focus", function () { searching = true; syncTabs(); });
    input.addEventListener("blur", function () {
      setTimeout(function () {
        searching = document.activeElement === input;
        if (!searching && disc.q.trim().length === 0 && disc.tab !== "titles") {
          disc.tab = "titles";
          drawTabs(); drawChips(); drawBody();
        }
        syncTabs();
      }, 150);
    });

    input.addEventListener("input", function () {
      clearTimeout(disc.timer);
      disc.q = input.value;
      syncTabs();
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

    drawTabs();
    syncTabs();
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

  function renderProfile() {
    var v = $("view-profile");
    clear(v);
    v.appendChild(topBar(t("nav_profile")));
    if (FX.hooks.profileTop) FX.hooks.profileTop(v, me);

    var card = el("div", "profile-card");
    var av = avatarNode();
    av.classList.add("avatar-lg");
    card.appendChild(av);
    card.appendChild(el("div", "profile-name", (me && me.display_name) || ""));
    var stats = el("div", "stats");
    function stat(value, label) {
      var s = el("div", "stat");
      s.appendChild(el("b", "", String(value)));
      s.appendChild(el("span", "", label));
      return s;
    }
    var statsNodes = { watched: stat("–", t("status_watched")), watching: stat("–", t("status_watching")), want: stat("–", t("status_want")) };
    stats.appendChild(statsNodes.watched);
    stats.appendChild(statsNodes.watching);
    stats.appendChild(statsNodes.want);
    card.appendChild(stats);
    if (FX.hooks.profileCard) FX.hooks.profileCard(card, me);
    v.appendChild(card);

    function fillStats() {
      var c = { watched: 0, watching: 0, want: 0 };
      library.items.forEach(function (i) { var s = getMine(i).status; if (c[s] !== undefined) c[s]++; });
      Object.keys(statsNodes).forEach(function (k) { statsNodes[k].firstChild.textContent = String(c[k]); });
    }
    if (library.loaded) fillStats();
    ensureLibrary(false).then(function () { if (currentTab === "profile") fillStats(); });

    var list = el("div", "settings");
    list.appendChild(el("h2", "sec-title", t("settings")));
    list.appendChild(settingRow("globe", t("language"), languageName(), openLanguageSheet));
    list.appendChild(settingRow("info", t("about"), "", openAboutSheet));
    if (FX.hooks.settings) FX.hooks.settings(list, me);
    v.appendChild(list);
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
    var d = { item: item, data: null, tab: "overview", ep: null, error: "", els: {} };
    detailStack.push(d);
    $("detail").classList.remove("hidden");
    syncLock();
    tgBack();
    renderDetail(d);
    loadDetail(d);
  }

  function backDetail() {
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

  function renderDetail(d) {
    var page = $("detail");
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

    if (d.data && d.data.genres && d.data.genres.length) {
      var genres = el("div", "genres");
      d.data.genres.forEach(function (g) { genres.appendChild(el("span", "genre", g)); });
      body.appendChild(genres);
    }

    d.els.actions = el("div", "d-actions");
    body.appendChild(d.els.actions);
    renderActions(d);

    d.els.tabs = el("div", "d-tabs");
    body.appendChild(d.els.tabs);
    d.els.pane = el("div", "d-pane");
    body.appendChild(d.els.pane);
    renderTabs(d);
    renderPane(d);

    scroller.appendChild(body);
  }

  function renderActions(d) {
    var box = d.els.actions;
    clear(box);
    var item = d.item;
    var m = getMine(item);
    if (d.data && m.status !== "watched") { d.data.mood = []; d.data.fav_actor = null; }

    var watch = button("abtn" + (m.status === "want" ? " on" : ""), null, function () {
      var cur = getMine(item).status;
      if (cur && cur !== "want") { openEditSheet(d); return; }
      var p = cur === "want" ? removeFromLibrary(item) : setStatus(item, "want", getMine(item).rating);
      p.then(function () { if (topDetail() === d) renderActions(d); });
    });
    watch.appendChild(icon(m.status === "want" ? "check" : "bookmark", 18));
    watch.appendChild(el("span", "", m.status === "want" ? t("btn_in_watchlist") : t("btn_watchlist")));
    box.appendChild(watch);

    var seen = button("abtn" + (m.status === "watched" ? " on seen" : ""), null, function () {
      if (getMine(item).status === "watched") {
        removeFromLibrary(item).then(function () { if (topDetail() === d) renderActions(d); });
        return;
      }
      setStatus(item, "watched", getMine(item).rating).then(function (ok) {
        if (topDetail() !== d) return;
        renderActions(d);
        if (ok) openEditSheet(d, { rate: true });
      });
    });
    seen.appendChild(icon("check", 18));
    seen.appendChild(el("span", "", t("btn_seen")));
    box.appendChild(seen);

    box.appendChild(iconButton("abtn icon-only", "sliders", t("btn_edit"), function () { openEditSheet(d); }));
    if (FX.hooks.detailAction) FX.hooks.detailAction(d, box);

    if (m.status) {
      var line = el("div", "mine-line");
      line.appendChild(statusBadge(m.status));
      if (m.status === "watched") line.lastChild.appendChild(document.createTextNode(" " + t("status_watched")));
      if (m.rating) line.appendChild(ratingBadge(m.rating));
      if (m.status === "watched" && d.data && d.data.mood && d.data.mood.length) {
        line.appendChild(el("span", "mine-moods", d.data.mood.join(" ")));
      }
      if (m.status === "watched" && d.data && d.data.fav_actor) {
        var fa = el("span", "mine-actor");
        if (d.data.fav_actor.photo) {
          var faImg = el("img");
          faImg.src = d.data.fav_actor.photo;
          faImg.alt = "";
          fa.appendChild(faImg);
        }
        fa.appendChild(document.createTextNode("♥ " + d.data.fav_actor.name));
        line.appendChild(fa);
      }
      box.appendChild(line);
    }
  }

  function renderTabs(d) {
    var box = d.els.tabs;
    clear(box);
    var tabs = [["overview", "tab_overview"]];
    if (d.item.media_type === "tv") tabs.push(["episodes", "tab_episodes"]);
    tabs.push(["cast", "tab_cast"]);
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
      if (data.directors && data.directors.length) {
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
      if (data.similar && data.similar.length) {
        var sec = el("section", "section flush");
        sec.appendChild(sectionHeader(t("sec_similar")));
        sec.appendChild(cardsRow(data.similar));
        pane.appendChild(sec);
      }
    } else if (d.tab === "episodes") {
      if (!d.ep) d.ep = newEpState(d);
      renderEps(d.ep);
      if (d.ep.status === "idle") loadEps(d.ep);
    } else {
      if (!data.cast || !data.cast.length) { pane.appendChild(msg("—")); return; }
      var row = el("div", "hscroll cast-row");
      data.cast.forEach(function (c) {
        var card = el("div", "cast");
        var av;
        if (c.photo) { av = el("img", "cast-photo"); av.src = c.photo; av.alt = ""; av.loading = "lazy"; }
        else { av = el("div", "cast-photo ph", (c.name || "?").charAt(0)); }
        card.appendChild(av);
        card.appendChild(el("div", "cast-name", c.name));
        if (c.character) card.appendChild(el("div", "cast-role", c.character));
        row.appendChild(card);
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
        setStatus(item, selStatus, isWatched ? selRating : null, extras).then(function (ok) {
          saving = false;
          if (ok) {
            if (d.data) {
              d.data.mood = isWatched ? selMood : [];
              d.data.fav_actor = isWatched ? selActor : null;
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

  // ---------- episodes (series) ----------
  function newEpState(d) {
    return { d: d, item: d.item, seasons: [], total: 0, watched: 0, open: null, cache: {}, busy: false, status: "idle", note: "" };
  }

  function epActive(state) { return topDetail() === state.d && state.d.tab === "episodes"; }
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

  function loadSeason(state, num) {
    if (state.cache[num]) return;
    state.cache[num] = { loading: true };
    api(L("/api/episodes?tmdb_id=" + state.item.tmdb_id + "&season=" + num)).then(function (res) {
      state.cache[num] = res.status === 200 ? { episodes: res.data.episodes || [] } : { error: problem(res, "err_load") };
      if (epActive(state)) renderEps(state);
    }).catch(function () {
      state.cache[num] = { error: t("err_network") };
      if (epActive(state)) renderEps(state);
    });
  }

  function applyServer(state, data, seasonNum) {
    state.watched = data.watched;
    if (data.total !== null && data.total !== undefined) state.total = data.total;
    if (seasonNum && data.season_watched !== null && data.season_watched !== undefined) {
      state.seasons.forEach(function (s) {
        if (s.season_number === seasonNum) s.watched = Math.min(data.season_watched, s.episode_count);
      });
    }
    var item = state.item;
    if (data.library_status && data.library_status !== getMine(item).status) {
      mine[key(item)] = { status: data.library_status, rating: getMine(item).rating };
      library.stale = true;
      if (topDetail() === state.d) renderActions(state.d);
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

  function toggleEpisode(state, seasonNum, episode) {
    var value = !episode.watched;
    mutateEps(state, { tmdb_id: state.item.tmdb_id, scope: "episode", season: seasonNum, episode: episode.episode_number, watched: value }, function () {
      episode.watched = value;
      var s = findSeason(state, seasonNum);
      if (s) s.watched = Math.max(0, Math.min(s.episode_count, s.watched + (value ? 1 : -1)));
      epRecalc(state);
    });
  }

  function setSeason(state, seasonNum, value) {
    mutateEps(state, { tmdb_id: state.item.tmdb_id, scope: "season", season: seasonNum, watched: value }, function () {
      var c = state.cache[seasonNum];
      if (c && c.episodes) c.episodes.forEach(function (e) { e.watched = value; });
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
        if (c && c.episodes) c.episodes.forEach(function (e) { e.watched = value; });
      });
      epRecalc(state);
    });
  }

  function markSeriesWatched(state) {
    if (state.busy) return;
    state.busy = true;
    setStatus(state.item, "watched", getMine(state.item).rating).then(function (ok) {
      state.busy = false;
      if (epActive(state)) {
        renderEps(state);
        renderActions(state.d);
        if (ok) openEditSheet(state.d, { rate: true });
      }
    });
  }

  function renderSeason(state, s) {
    var isOpen = state.open === s.season_number;
    var box = el("div", "season" + (isOpen ? " open" : ""));
    var head = button("season-head", null, function () {
      state.open = isOpen ? null : s.season_number;
      if (!isOpen) loadSeason(state, s.season_number);
      renderEps(state);
    });
    head.appendChild(el("span", "season-name", t("season_n", { n: s.season_number })));
    var right = el("span", "season-count", s.watched + " / " + s.episode_count);
    if (s.watched >= s.episode_count) right.classList.add("full");
    head.appendChild(right);
    box.appendChild(head);

    if (isOpen) {
      var c = state.cache[s.season_number];
      var body = el("div", "season-body");
      if (!c || c.loading) body.appendChild(msg(t("loading")));
      else if (c.error) body.appendChild(msg(c.error, true));
      else {
        var allDone = s.watched >= s.episode_count;
        body.appendChild(button("minibtn", t(allDone ? "unmark_season" : "mark_season"), function () { setSeason(state, s.season_number, !allDone); }));
        c.episodes.forEach(function (e) {
          var row = button("ep" + (e.watched ? " done" : ""), null, function () { toggleEpisode(state, s.season_number, e); });
          var check = el("span", "check");
          if (e.watched) check.appendChild(icon("check", 14));
          row.appendChild(check);
          var txt = el("span", "ep-text");
          txt.appendChild(el("span", "ep-name", e.episode_number + ". " + (e.name || t("episode_n", { n: e.episode_number }))));
          if (e.air_date) txt.appendChild(el("span", "ep-date", e.air_date));
          row.appendChild(txt);
          body.appendChild(row);
        });
      }
      box.appendChild(body);
    }
    return box;
  }

  function renderEps(state) {
    if (!epActive(state)) return;
    var pane = state.d.els.pane;
    clear(pane);
    if (state.status === "idle" || state.status === "loading") { pane.appendChild(msg(t("loading"))); return; }
    if (state.status === "error") { pane.appendChild(msg(state.note, true)); return; }
    if (!state.seasons.length) { pane.appendChild(msg("—")); return; }

    var percent = state.total ? Math.round((state.watched / state.total) * 100) : 0;
    var top = el("div", "prog-row");
    top.appendChild(el("span", "", t("episodes_of", { w: state.watched, t: state.total })));
    top.appendChild(el("span", "", percent + "%"));
    pane.appendChild(top);
    var bar = el("div", "bar");
    var fill = el("i");
    fill.style.width = percent + "%";
    bar.appendChild(fill);
    pane.appendChild(bar);

    var complete = state.total > 0 && state.watched >= state.total;
    pane.appendChild(button("minibtn", t(complete ? "unmark_all" : "mark_all"), function () { setAllEpisodes(state, !complete); }));

    if (complete && getMine(state.item).status !== "watched") {
      var banner = el("div", "banner");
      banner.appendChild(el("p", "", t("all_done_q")));
      banner.appendChild(button("btn primary", t("yes_watched"), function () { markSeriesWatched(state); }));
      pane.appendChild(banner);
    }
    if (state.note) pane.appendChild(msg(state.note, true));
    state.seasons.forEach(function (s) { pane.appendChild(renderSeason(state, s)); });
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
