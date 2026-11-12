// Actors on Discover: the "Popular actors" row, and the "Actors" tab in search (type a name, see the actors, tap one to open the person page with the full filmography).
(function () {
  "use strict";
  var FX = window.FX, el = FX.el;

  var T = {
    en: "Popular actors", fa: "بازیگران محبوب", ar: "الممثلون الأكثر شعبية", tr: "Popüler oyuncular",
    ru: "Популярные актёры", es: "Actores populares", fr: "Acteurs populaires", de: "Beliebte Schauspieler"
  };
  var TAB = {
    en: "Actors", fa: "بازیگران", ar: "الممثلون", tr: "Oyuncular",
    ru: "Актёры", es: "Actores", fr: "Acteurs", de: "Schauspieler"
  };
  var HINT = {
    en: "Type an actor's name", fa: "اسم بازیگر را بنویس", ar: "اكتب اسم الممثل", tr: "Bir oyuncunun adını yaz",
    ru: "Введите имя актёра", es: "Escribe el nombre de un actor", fr: "Tape le nom d'un acteur", de: "Gib den Namen eines Schauspielers ein"
  };
  var NONE = {
    en: "No actors found", fa: "بازیگری پیدا نشد", ar: "لم يتم العثور على ممثلين", tr: "Oyuncu bulunamadı",
    ru: "Актёры не найдены", es: "No se encontraron actores", fr: "Aucun acteur trouvé", de: "Keine Schauspieler gefunden"
  };
  var COLORS = ["7f1d1d", "1e3a8a", "14532d", "581c87", "7c2d12", "134e4a"];

  function label() {
    return T[I18N.lang] || T.en;
  }
  function pick(table) {
    return table[I18N.lang] || table.en;
  }

  FX.actorsLabel = function () { return pick(TAB); };

  FX.hooks.discoverActors = function (body) {
    var wrap = el("div", "");
    wrap.style.display = "none";
    body.appendChild(wrap);
    FX.api(FX.L("/api/discover?kind=actors")).then(function (res) {
      var list = (res && res.status === 200 && res.data && res.data.results) || [];
      if (!list.length) return;
      wrap.appendChild(el("h2", "sec", label()));
      var row = el("div", "hscroll cast-row");
      list.forEach(function (a, i) {
        var b = el("button", "cast");
        b.type = "button";
        var ph = el("div", "cast-photo");
        ph.style.cssText = "overflow:hidden;position:relative;background:linear-gradient(150deg,#" + COLORS[i % COLORS.length] + ",#14143a)";
        ph.textContent = (a.name || "?").charAt(0).toUpperCase();
        var im = el("img", "");
        im.src = a.photo; im.alt = ""; im.loading = "lazy";
        im.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover";
        im.addEventListener("error", function () { im.remove(); });
        ph.appendChild(im);
        b.appendChild(ph);
        var nm = el("div", "cast-name", a.name);
        nm.style.cssText = "white-space:nowrap;overflow:hidden;text-overflow:ellipsis";
        nm.title = a.name;
        b.appendChild(nm);
        b.addEventListener("click", function () { FX.openPerson({ id: a.id, name: a.name, photo: a.photo }); });
        row.appendChild(b);
      });
      wrap.appendChild(row);
      wrap.style.display = "";
    }).catch(function () {});
  };

  // ---------- search: the "Actors" tab ----------
  var token = 0;

  function actorRow(a, i) {
    var row = el("div", "sp-row");
    row.style.cursor = "pointer";
    row.style.minWidth = "0";
    var av = el("div", "sp-av");
    av.style.cssText = "position:relative;overflow:hidden;background:linear-gradient(150deg,#" + COLORS[i % COLORS.length] + ",#14143a)";
    av.textContent = (a.name || "?").charAt(0).toUpperCase();
    if (a.photo) {
      var im = el("img", "");
      im.src = a.photo; im.alt = ""; im.loading = "lazy";
      im.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover";
      im.addEventListener("error", function () { im.remove(); });
      av.appendChild(im);
    }
    row.appendChild(av);
    var info = el("div", "sp-info");
    info.appendChild(el("div", "sp-name", a.name || ""));
    if (a.known_for && a.known_for.length) info.appendChild(el("div", "sp-sub", a.known_for.join(" · ")));
    row.appendChild(info);
    row.addEventListener("click", function () { FX.openPerson({ id: a.id, name: a.name, photo: a.photo }); });
    return row;
  }

  FX.hooks.actorsSearch = function (container, q) {
    var my = ++token;
    while (container.firstChild) container.removeChild(container.firstChild);
    var text = String(q || "").trim();
    if (Array.from(text).length < 2) {
      container.appendChild(FX.msg(pick(HINT)));
      return;
    }
    container.appendChild(FX.msg(I18N.t("searching")));
    FX.api(FX.L("/api/search?kind=actors&q=" + encodeURIComponent(text))).then(function (res) {
      if (my !== token || !container.isConnected) return;
      while (container.firstChild) container.removeChild(container.firstChild);
      if (res.status !== 200) { container.appendChild(FX.msg(I18N.t("err_search"), true)); return; }
      var list = (res.data && res.data.results) || [];
      if (!list.length) { container.appendChild(FX.msg(pick(NONE))); return; }
      var box = el("div", "sp-list");
      box.style.gridTemplateColumns = "minmax(0, 1fr)"; // long "known for" lines must not widen the column
      list.forEach(function (a, i) { box.appendChild(actorRow(a, i)); });
      container.appendChild(box);
    }).catch(function () {
      if (my !== token || !container.isConnected) return;
      while (container.firstChild) container.removeChild(container.firstChild);
      container.appendChild(FX.msg(I18N.t("err_network"), true));
    });
  };
})();
