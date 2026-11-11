// "New episodes": a Home row with the next episodes of the series you watch or want to watch
// (next 14 days) and, behind the arrow, a calendar page (next 60 days). Data: /api/upcoming.
(function () {
  "use strict";
  var FX = window.FX, el = FX.el, clear = FX.clear, button = FX.button;

  var T = {
    en: { title: "New episodes", movies: "Upcoming movies", today: "Today", tomorrow: "Tomorrow", empty: "No new episodes in the next 60 days.", err: "Could not load. Try again." },
    fa: { title: "قسمت‌های جدید", movies: "فیلم‌های در راه", today: "امروز", tomorrow: "فردا", empty: "تا ۶۰ روز آینده قسمت جدیدی نیست.", err: "بارگذاری نشد. دوباره امتحان کن." },
    ar: { title: "حلقات جديدة", movies: "أفلام قادمة", today: "اليوم", tomorrow: "غداً", empty: "لا حلقات جديدة خلال 60 يوماً القادمة.", err: "تعذّر التحميل. حاول مجدداً." },
    tr: { title: "Yeni bölümler", movies: "Yakında gelecek filmler", today: "Bugün", tomorrow: "Yarın", empty: "Önümüzdeki 60 günde yeni bölüm yok.", err: "Yüklenemedi. Tekrar dene." },
    ru: { title: "Новые серии", movies: "Скоро в кино", today: "Сегодня", tomorrow: "Завтра", empty: "В ближайшие 60 дней новых серий нет.", err: "Не загрузилось. Попробуй ещё раз." },
    es: { title: "Nuevos episodios", movies: "Próximos estrenos", today: "Hoy", tomorrow: "Mañana", empty: "No hay episodios nuevos en los próximos 60 días.", err: "No se pudo cargar. Inténtalo de nuevo." },
    fr: { title: "Nouveaux épisodes", movies: "Films à venir", today: "Aujourd'hui", tomorrow: "Demain", empty: "Aucun nouvel épisode dans les 60 prochains jours.", err: "Chargement impossible. Réessaie." },
    de: { title: "Neue Folgen", movies: "Kommende Filme", today: "Heute", tomorrow: "Morgen", empty: "Keine neuen Folgen in den nächsten 60 Tagen.", err: "Konnte nicht geladen werden. Versuch es noch einmal." }
  };
  function tr(k) { return (T[I18N.lang] && T[I18N.lang][k]) || T.en[k]; }
  function loc() { return I18N.lang === "fa" ? "fa-IR" : I18N.lang; }

  var NS = "http://www.w3.org/2000/svg";
  function arrow() {
    var s = document.createElementNS(NS, "svg");
    [["viewBox", "0 0 24 24"], ["width", "16"], ["height", "16"], ["fill", "none"], ["stroke", "currentColor"], ["stroke-width", "2.6"], ["stroke-linecap", "round"], ["stroke-linejoin", "round"]].forEach(function (a) { s.setAttribute(a[0], a[1]); });
    var p = document.createElementNS(NS, "path");
    p.setAttribute("d", "M9 6l6 6-6 6");
    s.appendChild(p);
    return s;
  }

  var st = document.createElement("style");
  st.textContent =
    ".up-chip{position:absolute;inset-inline-start:6px;bottom:6px;padding:3px 8px;border-radius:9px;background:rgba(0,0,0,.65);font-size:11px;font-weight:800;color:#fff}" +
    ".up-chip.hot{background:var(--grad)}" +
    ".up-day{font-size:13px;font-weight:800;color:var(--muted);margin:16px 0 8px;display:flex;gap:8px;align-items:center}" +
    ".up-day em{font-style:normal;background:var(--grad);color:#fff;padding:2px 9px;border-radius:9px;font-size:11px}" +
    ".up-row{display:flex;gap:12px;align-items:center;padding:10px;border-radius:16px;background:var(--surface);border:1px solid var(--line);margin-bottom:8px;cursor:pointer;width:100%;text-align:start}" +
    ".up-pos{width:48px;height:70px;border-radius:10px;flex:none;object-fit:cover;background:var(--surface-2)}" +
    ".up-info{display:flex;flex-direction:column;gap:2px;min-width:0}.up-info b{font-size:15px}.up-info span{font-size:13px;color:#c9b8ff;font-weight:700}";
  document.head.appendChild(st);

  // "2026-11-12" -> whole days from today (local time)
  function dayDiff(iso) {
    var p = iso.split("-");
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    var n = new Date();
    n = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    return Math.round((d.getTime() - n.getTime()) / 86400000);
  }
  function dateOf(iso) { var p = iso.split("-"); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function shortDate(iso) {
    var o = { day: "numeric", month: "short" };
    if (dateOf(iso).getFullYear() !== new Date().getFullYear()) o.year = "numeric";
    try { return dateOf(iso).toLocaleDateString(loc(), o); } catch (e) { return iso; }
  }
  function label(iso) {
    var n = dayDiff(iso);
    if (n === 0) return tr("today");
    if (n === 1) return tr("tomorrow");
    if (n > 1 && n < 7) { try { return dateOf(iso).toLocaleDateString(loc(), { weekday: "short" }); } catch (e) {} }
    return shortDate(iso);
  }
  function epText(it) {
    if (it.season == null || it.episode == null) return "";
    return "S" + it.season + " · E" + it.episode;
  }

  var cache = {};
  function load(days, type) {
    var key = type + days;
    var c = cache[key];
    if (c && Date.now() - c.at < 300000) return Promise.resolve(c.items);
    return FX.api("/api/upcoming?type=" + type + "&days=" + days).then(function (res) {
      if (res.status !== 200) return null;
      var items = (res.data.results || []).filter(function (it) { return dayDiff(it.air) >= 0; });
      FX.ingest(items);
      cache[key] = { at: Date.now(), items: items };
      return items;
    }).catch(function () { return null; });
  }

  function openCalendar() {
    FX.openPage(tr("title"), function (body) {
      var holder = el("div");
      body.appendChild(holder);
      holder.appendChild(FX.msg(I18N.t("loading")));
      load(60, "tv").then(function (items) {
        clear(holder);
        if (!items) { holder.appendChild(FX.msg(tr("err"), true)); return; }
        if (!items.length) { holder.appendChild(FX.msg(tr("empty"))); return; }
        var last = "";
        items.forEach(function (it) {
          if (it.air !== last) {
            last = it.air;
            var day = el("div", "up-day");
            var n = dayDiff(it.air);
            var wd = "";
            try { wd = dateOf(it.air).toLocaleDateString(loc(), { weekday: "long" }); } catch (e) {}
            day.appendChild(el("span", "", n === 0 ? tr("today") : n === 1 ? tr("tomorrow") : wd));
            day.appendChild(el("em", "", shortDate(it.air)));
            holder.appendChild(day);
          }
          var card = FX.posterCard(it); // reused only for its click (opens the title page)
          var row = el("button", "up-row");
          row.type = "button";
          if (it.poster) {
            var im = el("img", "up-pos");
            im.src = it.poster; im.alt = ""; im.loading = "lazy";
            row.appendChild(im);
          } else {
            row.appendChild(el("div", "up-pos"));
          }
          var info = el("div", "up-info");
          info.appendChild(el("b", "", I18N.lang === "fa" ? (it.title || it.title_en) : (it.title_en || it.title)));
          var ep = epText(it);
          if (ep) info.appendChild(el("span", "", ep));
          row.appendChild(info);
          row.addEventListener("click", function () { card.click(); });
          holder.appendChild(row);
        });
      });
    });
  }

  // One Home row. `type` tv = next episodes (14 days, arrow opens the calendar); movie = release dates (next year, no arrow).
  function homeRow(v, type) {
    var sec = el("section", "section");
    sec.style.display = "none";
    var head = el("h2", "sec");
    head.appendChild(el("span", "", tr(type === "tv" ? "title" : "movies")));
    if (type === "tv") {
      var go = button("sec-go", null, openCalendar);
      go.setAttribute("aria-label", tr("title"));
      go.appendChild(arrow());
      head.appendChild(go);
    }
    sec.appendChild(head);
    v.appendChild(sec);
    load(type === "tv" ? 14 : 365, type).then(function (items) {
      if (!items || !items.length) return;
      var row = el("div", "hscroll");
      items.forEach(function (it) {
        var card = FX.posterCard(it);
        var box = card.querySelector(".pimg");
        if (box) {
          var n = dayDiff(it.air);
          box.appendChild(el("span", "up-chip" + (n <= 1 ? " hot" : ""), label(it.air)));
        }
        if (type === "tv") {
          var sub = card.querySelector(".psub");
          if (sub) sub.textContent = epText(it) || sub.textContent;
        }
        row.appendChild(card);
      });
      sec.appendChild(row);
      sec.style.display = "";
    });
  }

  FX.hooks.homeUpcoming = function (v) {
    homeRow(v, "tv");
    homeRow(v, "movie");
  };
})();
