// Home rows about you and your friends: "Recommended for you", "Shows friends watched",
// "Movies friends watched". Data comes from /api/home-rows. A row with nothing to show stays hidden.
(function () {
  "use strict";
  var FX = window.FX, el = FX.el;

  var T = {
    en: { rec: "Recommended for you", fshows: "Shows friends watched", fmovies: "Movies friends watched" },
    fa: { rec: "پیشنهاد برای تو", fshows: "سریال‌هایی که دوستانت دیدند", fmovies: "فیلم‌هایی که دوستانت دیدند" },
    ar: { rec: "مقترحات لك", fshows: "مسلسلات شاهدها أصدقاؤك", fmovies: "أفلام شاهدها أصدقاؤك" },
    tr: { rec: "Senin için öneriler", fshows: "Arkadaşlarının izlediği diziler", fmovies: "Arkadaşlarının izlediği filmler" },
    ru: { rec: "Рекомендуем тебе", fshows: "Сериалы, которые смотрели друзья", fmovies: "Фильмы, которые смотрели друзья" },
    es: { rec: "Recomendado para ti", fshows: "Series que vieron tus amigos", fmovies: "Películas que vieron tus amigos" },
    fr: { rec: "Recommandé pour toi", fshows: "Séries vues par tes amis", fmovies: "Films vus par tes amis" },
    de: { rec: "Für dich empfohlen", fshows: "Serien, die deine Freunde gesehen haben", fmovies: "Filme, die deine Freunde gesehen haben" }
  };
  function tr(k) { return (T[I18N.lang] && T[I18N.lang][k]) || T.en[k]; }

  function mini(p, first) {
    var s = "width:20px;height:20px;border-radius:50%;border:2px solid #07071a;box-sizing:content-box;flex:none;object-fit:cover;" +
      "display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;background:var(--grad);color:#fff;" +
      (first ? "" : "margin-inline-start:-6px;");
    var n;
    if (p.photo_url) {
      n = el("img", "");
      n.src = p.photo_url;
      n.alt = "";
      n.loading = "lazy";
      n.addEventListener("error", function () { n.replaceWith(initial(p, s)); });
      n.style.cssText = s;
    } else {
      n = initial(p, s);
    }
    return n;
  }
  function initial(p, s) {
    var d = el("span", "", (p.display_name || "?").charAt(0).toUpperCase());
    d.style.cssText = s;
    return d;
  }

  function friendsStrip(f) {
    var box = el("div", "");
    box.style.cssText = "display:flex;align-items:center;margin-top:6px;padding-inline-start:2px";
    (f.sample || []).forEach(function (p, i) { box.appendChild(mini(p, i === 0)); });
    var more = f.count - (f.sample || []).length;
    if (more > 0) {
      var m = el("span", "", "+" + more);
      m.setAttribute("dir", "ltr");
      m.style.cssText = "font-size:11px;font-weight:700;color:var(--muted);margin-inline-start:6px";
      box.appendChild(m);
    }
    return box;
  }

  function buildRow(v, kind, withFriends) {
    var sec = el("section", "section hidden");
    sec.appendChild(FX.sectionHeader(tr(kind)));
    v.appendChild(sec);
    FX.api(FX.L("/api/home-rows?kind=" + kind)).then(function (res) {
      var list = (res && res.status === 200 && res.data && res.data.results) || [];
      if (!list.length) return;
      FX.ingest(list);
      var row = el("div", "hscroll");
      list.forEach(function (it) {
        var card = FX.posterCard(it);
        if (withFriends && it.friends) card.appendChild(friendsStrip(it.friends));
        row.appendChild(card);
      });
      sec.appendChild(row);
      sec.classList.remove("hidden");
    }).catch(function () {});
  }

  FX.hooks.homeRows = function (v) {
    buildRow(v, "rec", false);
    buildRow(v, "fshows", true);
    buildRow(v, "fmovies", true);
  };
})();
