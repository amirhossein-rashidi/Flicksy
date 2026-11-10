// "Popular actors" row on Discover: round photos, tap opens the person page.
(function () {
  "use strict";
  var FX = window.FX, el = FX.el;

  var T = {
    en: "Popular actors", fa: "بازیگران محبوب", ar: "الممثلون الأكثر شعبية", tr: "Popüler oyuncular",
    ru: "Популярные актёры", es: "Actores populares", fr: "Acteurs populaires", de: "Beliebte Schauspieler"
  };
  var COLORS = ["7f1d1d", "1e3a8a", "14532d", "581c87", "7c2d12", "134e4a"];

  function label() {
    return T[I18N.lang] || T.en;
  }

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
})();
