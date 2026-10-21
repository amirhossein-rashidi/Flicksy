(function () {
  var STATUS_ORDER = ["want", "watching", "watched", "paused", "dropped"];
  var STATUS_LABEL = {
    want: "می‌خواهم ببینم",
    watching: "در حال تماشا",
    watched: "دیده‌ام",
    paused: "متوقف‌شده",
    dropped: "رهاشده"
  };

  var $ = function (id) { return document.getElementById(id); };
  var qEl = $("q"), msgEl = $("msg"), listEl = $("results");
  var libMsgEl = $("lib-msg"), libListEl = $("lib-results"), chipsEl = $("chips");
  var nameEl = $("hello-name"), avatarEl = $("avatar");

  var initData = "";
  var timer = null, controller = null;
  var searchResults = [];
  var libFilter = null, libStale = true, libLoading = false;
  var sheetItem = null, selStatus = null, selRating = null, saving = false;

  // ---------- small helpers ----------
  function setMsg(el, text, isError) {
    el.textContent = text || "";
    el.classList.toggle("error", !!isError);
    el.classList.toggle("hidden", !text);
  }

  function readInitData() {
    try {
      var h = new URLSearchParams(location.hash.replace(/^#/, ""));
      var fromHash = h.get("tgWebAppData");
      if (fromHash) return fromHash;
    } catch (e) {}
    try {
      if (window.Telegram && Telegram.WebApp && Telegram.WebApp.initData) {
        return Telegram.WebApp.initData;
      }
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

  // Turns a failed response into a Persian message.
  function problem(res, fallback) {
    if (res.status === 401) {
      if (res.data && res.data.error === "expired") {
        return "نشست منقضی شده؛ برنامه را دوباره از تلگرام باز کن.";
      }
      return "ورود ناموفق بود. برنامه را دوباره از تلگرام باز کن.";
    }
    if (res.status === 429) return "کمی آرام‌تر؛ چند ثانیه دیگر دوباره امتحان کن.";
    return fallback;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function posterNode(item, className) {
    var node = el(item.poster ? "img" : "div", className || "poster");
    if (item.poster) { node.src = item.poster; node.alt = ""; node.loading = "lazy"; }
    return node;
  }

  function mineText(item) {
    if (!item.status) return "";
    var t = STATUS_LABEL[item.status] || "";
    if (item.my_rating) t += " · ★ " + item.my_rating;
    return t;
  }

  function fillMeta(container, item) {
    container.textContent = "";
    container.appendChild(el("span", "badge", item.media_type === "tv" ? "سریال" : "فیلم"));
    if (item.year) container.appendChild(el("span", "", String(item.year)));
    if (item.rating) container.appendChild(el("span", "", "★ " + item.rating));
    var mine = mineText(item);
    if (mine) container.appendChild(el("span", "mine", mine));
  }

  function card(item, withOverview) {
    var li = el("li");
    li.appendChild(posterNode(item));
    var info = el("div", "info");
    info.appendChild(el("p", "title", item.title || item.original_title));
    if (item.original_title && item.original_title !== item.title) {
      info.appendChild(el("p", "orig", item.original_title));
    }
    var meta = el("div", "meta");
    fillMeta(meta, item);
    info.appendChild(meta);
    if (withOverview && item.overview) info.appendChild(el("p", "ov", item.overview));
    li.appendChild(info);
    li.addEventListener("click", function () { openSheet(item); });
    return li;
  }

  // ---------- search ----------
  function renderSearch() {
    listEl.textContent = "";
    searchResults.forEach(function (r) { listEl.appendChild(card(r, true)); });
  }

  function search(text) {
    if (controller) controller.abort();
    controller = new AbortController();
    setMsg(msgEl, "در حال جست‌وجو…");
    api("/api/search?q=" + encodeURIComponent(text), { signal: controller.signal })
      .then(function (res) {
        if (res.status !== 200) {
          setMsg(msgEl, problem(res, "جست‌وجو فعلاً در دسترس نیست. کمی بعد دوباره امتحان کن."), true);
          return;
        }
        searchResults = res.data.results || [];
        renderSearch();
        setMsg(msgEl, searchResults.length ? "" : "نتیجه‌ای پیدا نشد.");
      })
      .catch(function (e) {
        if (e && e.name === "AbortError") return;
        setMsg(msgEl, "اتصال برقرار نشد. اینترنت را بررسی کن.", true);
      });
  }

  qEl.addEventListener("input", function () {
    clearTimeout(timer);
    var text = qEl.value.trim();
    if (text.length < 2) {
      if (controller) controller.abort();
      searchResults = [];
      listEl.textContent = "";
      setMsg(msgEl, "حداقل دو حرف بنویس.");
      return;
    }
    timer = setTimeout(function () { search(text); }, 400);
  });

  // ---------- library ----------
  function renderChips(counts) {
    chipsEl.textContent = "";
    var total = 0;
    STATUS_ORDER.forEach(function (s) { total += counts[s] || 0; });

    function addChip(label, value) {
      var c = el("button", "chip" + (libFilter === value ? " active" : ""), label);
      c.type = "button";
      c.addEventListener("click", function () {
        libFilter = value;
        loadLibrary();
      });
      chipsEl.appendChild(c);
    }
    addChip("همه (" + total + ")", null);
    STATUS_ORDER.forEach(function (s) {
      addChip(STATUS_LABEL[s] + " (" + (counts[s] || 0) + ")", s);
    });
  }

  function loadLibrary() {
    if (libLoading) return;
    libLoading = true;
    setMsg(libMsgEl, "در حال بارگذاری…");
    var path = "/api/library" + (libFilter ? "?status=" + libFilter : "");
    api(path).then(function (res) {
      libLoading = false;
      if (res.status !== 200) {
        setMsg(libMsgEl, problem(res, "بارگذاری کتابخانه ممکن نشد."), true);
        return;
      }
      libStale = false;
      renderChips(res.data.counts || {});
      libListEl.textContent = "";
      var items = res.data.items || [];
      items.forEach(function (it) { libListEl.appendChild(card(it, false)); });
      setMsg(libMsgEl, items.length ? "" : "اینجا هنوز چیزی نیست. از تب جست‌وجو اضافه کن.");
    }).catch(function () {
      libLoading = false;
      setMsg(libMsgEl, "اتصال برقرار نشد.", true);
    });
  }

  // ---------- tabs ----------
  function showTab(name) {
    var isSearch = name === "search";
    $("view-search").classList.toggle("hidden", !isSearch);
    $("view-library").classList.toggle("hidden", isSearch);
    $("tab-search").classList.toggle("active", isSearch);
    $("tab-library").classList.toggle("active", !isSearch);
    if (!isSearch && libStale) loadLibrary();
  }
  $("tab-search").addEventListener("click", function () { showTab("search"); });
  $("tab-library").addEventListener("click", function () { showTab("library"); });

  // ---------- title sheet ----------
  function buildSheetButtons() {
    var st = $("statuses");
    st.textContent = "";
    STATUS_ORDER.forEach(function (s) {
      var b = el("button", "pill" + (selStatus === s ? " sel" : ""), STATUS_LABEL[s]);
      b.type = "button";
      b.addEventListener("click", function () { selStatus = s; buildSheetButtons(); });
      st.appendChild(b);
    });

    var rt = $("ratings");
    rt.textContent = "";
    for (var n = 1; n <= 10; n++) {
      (function (num) {
        var b = el("button", "pill" + (selRating === num ? " sel" : ""), String(num));
        b.type = "button";
        b.addEventListener("click", function () {
          selRating = selRating === num ? null : num;
          buildSheetButtons();
        });
        rt.appendChild(b);
      })(n);
    }
    $("save").disabled = !selStatus || saving;
  }

  function openSheet(item) {
    sheetItem = item;
    selStatus = item.status || null;
    selRating = item.my_rating || null;
    saving = false;

    var p = $("sheet-poster");
    var newPoster = posterNode(item);
    newPoster.id = "sheet-poster";
    p.replaceWith(newPoster);

    $("sheet-title").textContent = item.title || item.original_title;
    var orig = item.original_title && item.original_title !== item.title ? item.original_title : "";
    $("sheet-orig").textContent = orig;
    $("sheet-orig").classList.toggle("hidden", !orig);
    fillMeta($("sheet-meta"), item);
    setMsg($("sheet-msg"), "");
    $("remove").classList.toggle("hidden", !item.status);

    buildSheetButtons();
    $("overlay").classList.remove("hidden");
    document.body.classList.add("locked");
  }

  function closeSheet() {
    $("overlay").classList.add("hidden");
    document.body.classList.remove("locked");
    sheetItem = null;
  }

  function syncItem(tmdbId, mediaType, status, myRating) {
    searchResults.forEach(function (r) {
      if (r.tmdb_id === tmdbId && r.media_type === mediaType) {
        r.status = status;
        r.my_rating = myRating;
      }
    });
    renderSearch();
    libStale = true;
    if (!$("view-library").classList.contains("hidden")) loadLibrary();
  }

  $("save").addEventListener("click", function () {
    if (!sheetItem || !selStatus || saving) return;
    saving = true;
    $("save").disabled = true;
    $("save").textContent = "در حال ذخیره…";
    var item = sheetItem;
    api("/api/library", {
      method: "PUT",
      body: { tmdb_id: item.tmdb_id, media_type: item.media_type, status: selStatus, rating: selRating }
    }).then(function (res) {
      saving = false;
      $("save").textContent = "ذخیره";
      if (res.status === 200) {
        item.status = res.data.status;
        item.my_rating = res.data.my_rating;
        syncItem(item.tmdb_id, item.media_type, item.status, item.my_rating);
        closeSheet();
      } else {
        setMsg($("sheet-msg"), problem(res, "ذخیره نشد. کمی بعد دوباره امتحان کن."), true);
        $("save").disabled = false;
      }
    }).catch(function () {
      saving = false;
      $("save").textContent = "ذخیره";
      $("save").disabled = false;
      setMsg($("sheet-msg"), "اتصال برقرار نشد.", true);
    });
  });

  $("remove").addEventListener("click", function () {
    if (!sheetItem || saving) return;
    saving = true;
    var item = sheetItem;
    api("/api/library?tmdb_id=" + item.tmdb_id + "&media_type=" + item.media_type, { method: "DELETE" })
      .then(function (res) {
        saving = false;
        if (res.status === 200) {
          item.status = null;
          item.my_rating = null;
          syncItem(item.tmdb_id, item.media_type, null, null);
          closeSheet();
        } else {
          setMsg($("sheet-msg"), problem(res, "حذف نشد. کمی بعد دوباره امتحان کن."), true);
        }
      }).catch(function () {
        saving = false;
        setMsg($("sheet-msg"), "اتصال برقرار نشد.", true);
      });
  });

  $("close").addEventListener("click", closeSheet);
  $("overlay").addEventListener("click", function (e) {
    if (e.target === $("overlay")) closeSheet();
  });

  // ---------- about sheet ----------
  function openAbout() {
    $("about-overlay").classList.remove("hidden");
    document.body.classList.add("locked");
  }
  function closeAbout() {
    $("about-overlay").classList.add("hidden");
    document.body.classList.remove("locked");
  }
  $("open-about").addEventListener("click", openAbout);
  $("about-close").addEventListener("click", closeAbout);
  $("about-overlay").addEventListener("click", function (e) {
    if (e.target === $("about-overlay")) closeAbout();
  });
  // If the TMDB logo file has not been uploaded yet, simply hide the broken image.
  $("tmdb-logo").addEventListener("error", function () { $("tmdb-logo").classList.add("hidden"); });

  // ---------- start ----------
  function start(attempt) {
    initData = readInitData();
    if (!initData) {
      if (attempt < 6) { setTimeout(function () { start(attempt + 1); }, 300); return; }
      setMsg(msgEl, "Flicksy را از داخل تلگرام و از طریق ربات باز کن.", true);
      return;
    }
    api("/api/me").then(function (res) {
      if (res.status !== 200) { setMsg(msgEl, problem(res, "ورود ناموفق بود."), true); return; }
      var u = res.data.user;
      nameEl.textContent = u.display_name;
      if (u.photo_url) {
        var img = el("img", "avatar");
        img.id = "avatar";
        img.alt = "";
        img.src = u.photo_url;
        avatarEl.replaceWith(img);
        avatarEl = img;
      } else {
        avatarEl.textContent = (u.display_name || "F").charAt(0).toUpperCase();
      }
      qEl.disabled = false;
      setMsg(msgEl, "چیزی را جست‌وجو کن، مثلاً نام یک فیلم.");
    }).catch(function () {
      setMsg(msgEl, "اتصال به سرور برقرار نشد.", true);
    });
  }

  window.addEventListener("load", function () {
    try {
      if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
      }
    } catch (e) {}
  });

  start(0);
})();
