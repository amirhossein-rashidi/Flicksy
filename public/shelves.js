// Movies and series shelves on a profile (your own and other people's).
// Each shelf is a row of posters with a round arrow at the end of the title line that opens
// the full list. Data comes from /api/profile-titles.
(function () {
  "use strict";
  var FX = window.FX, el = FX.el, clear = FX.clear, button = FX.button;

  var T = {
    en: { series: "Series", movies: "Movies", all_series: "All series", all_movies: "All movies", more: "Load more", err: "Could not load. Try again." },
    fa: { series: "سریال‌ها", movies: "فیلم‌ها", all_series: "همه‌ی سریال‌ها", all_movies: "همه‌ی فیلم‌ها", more: "نمایش بیشتر", err: "بارگذاری نشد. دوباره امتحان کن." },
    ar: { series: "المسلسلات", movies: "الأفلام", all_series: "كل المسلسلات", all_movies: "كل الأفلام", more: "عرض المزيد", err: "تعذّر التحميل. حاول مجدداً." },
    tr: { series: "Diziler", movies: "Filmler", all_series: "Tüm diziler", all_movies: "Tüm filmler", more: "Daha fazla yükle", err: "Yüklenemedi. Tekrar dene." },
    ru: { series: "Сериалы", movies: "Фильмы", all_series: "Все сериалы", all_movies: "Все фильмы", more: "Загрузить ещё", err: "Не удалось загрузить. Попробуй ещё раз." },
    es: { series: "Series", movies: "Películas", all_series: "Todas las series", all_movies: "Todas las películas", more: "Cargar más", err: "No se pudo cargar. Inténtalo de nuevo." },
    fr: { series: "Séries", movies: "Films", all_series: "Toutes les séries", all_movies: "Tous les films", more: "Charger plus", err: "Impossible de charger. Réessaie." },
    de: { series: "Serien", movies: "Filme", all_series: "Alle Serien", all_movies: "Alle Filme", more: "Mehr laden", err: "Laden fehlgeschlagen. Versuch es nochmal." }
  };
  function tr(k) { return (T[I18N.lang] && T[I18N.lang][k]) || T.en[k]; }

  var NS = "http://www.w3.org/2000/svg";
  function arrow() {
    var s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("width", "16");
    s.setAttribute("height", "16");
    s.setAttribute("fill", "none");
    s.setAttribute("stroke", "currentColor");
    s.setAttribute("stroke-width", "2.6");
    s.setAttribute("stroke-linecap", "round");
    s.setAttribute("stroke-linejoin", "round");
    var p = document.createElementNS(NS, "path");
    p.setAttribute("d", "M9 6l6 6-6 6");
    s.appendChild(p);
    return s;
  }

  var current = null; // the shelves on screen: their count labels

  function fetchPage(pid, kind, limit, offset) {
    return FX.api("/api/profile-titles?id=" + encodeURIComponent(pid) + "&kind=" + kind + "&limit=" + limit + "&offset=" + offset)
      .then(function (res) { return res.status === 200 ? res.data : null; })
      .catch(function () { return null; });
  }

  function openAll(pid, kind) {
    FX.openPage(tr("all_" + kind), function (body) {
      var grid = el("div", "grid");
      body.appendChild(grid);
      var foot = el("div", "sh-foot");
      body.appendChild(foot);
      var offset = 0, busy = false;
      function load() {
        if (busy) return;
        busy = true;
        clear(foot);
        fetchPage(pid, kind, 60, offset).then(function (d) {
          busy = false;
          if (!d) {
            var retry = button("btn glass", tr("err"), load);
            foot.appendChild(retry);
            return;
          }
          d.items.forEach(function (it) { grid.appendChild(FX.posterCard(it)); });
          offset += d.items.length;
          if (d.more) foot.appendChild(button("btn glass", tr("more"), load));
        });
      }
      load();
    });
  }

  function shelf(pid, kind) {
    var sec = el("section", "section sh-sec");
    var head = el("h2", "sec");
    head.appendChild(el("span", "", tr(kind)));
    var cnt = el("span", "sh-cnt");
    head.appendChild(cnt);
    var go = button("sec-go", null, function () { openAll(pid, kind); });
    go.setAttribute("aria-label", tr("all_" + kind));
    go.appendChild(arrow());
    go.style.display = "none";
    head.appendChild(go);
    sec.appendChild(head);
    sec.style.display = "none"; // appears once there is something to show
    fetchPage(pid, kind, 10, 0).then(function (d) {
      if (!sec.isConnected || !d || d.locked || !d.items.length) return;
      var row = el("div", "hscroll");
      d.items.forEach(function (it) { row.appendChild(FX.posterCard(it)); });
      sec.appendChild(row);
      go.style.display = d.more ? "" : "none";
      sec.style.display = "";
    });
    return { sec: sec, cnt: cnt };
  }

  // Adds the series and movies shelves to `container`. `stats` (optional) gives the numbers.
  FX.shelves = function (container, pid, stats) {
    var s = shelf(pid, "series"), m = shelf(pid, "movies");
    container.appendChild(s.sec);
    container.appendChild(m.sec);
    current = { series: s.cnt, movies: m.cnt };
    if (stats) FX.shelvesCounts(stats);
  };

  FX.shelvesCounts = function (stats) {
    if (!current || !stats) return;
    if (stats.series) current.series.textContent = "· " + stats.series;
    if (stats.movies) current.movies.textContent = "· " + stats.movies;
  };

  // your own profile
  FX.hooks.profileShelves = function (container, me) {
    if (me && me.public_id) FX.shelves(container, me.public_id);
  };
})();
