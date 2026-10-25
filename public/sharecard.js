(function () {
  "use strict";

  var FX = window.FX;
  if (!FX) return;

  var W = 1280, H = 720;
  var FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans Arabic', 'Noto Sans', Arial, sans-serif";

  // TMDB pictures are loaded through our own server (/tmdb-img/...) so the browser lets us draw them.
  function viaOurServer(url) {
    var m = /^https:\/\/image\.tmdb\.org\/t\/p\/(w\d{3})\/([A-Za-z0-9_-]+\.jpg)$/.exec(String(url));
    return m ? "/tmdb-img/" + m[1] + "/" + m[2] : url;
  }

  // Loads a picture; gives null if it fails or takes too long (so one bad poster never breaks the card).
  function loadImage(url) {
    url = viaOurServer(url);
    return new Promise(function (resolve) {
      var done = false;
      function finish(v) { if (!done) { done = true; resolve(v); } }
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () { finish(img); };
      img.onerror = function () { finish(null); };
      setTimeout(function () { finish(null); }, 8000);
      img.src = url;
    });
  }

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.lineTo(x + w - r, y);
    g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r);
    g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h);
    g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r);
    g.quadraticCurveTo(x, y, x + r, y);
    g.closePath();
  }

  // Shrinks the text until it fits, then cuts it with "…" if it still doesn't.
  function fitText(g, text, weight, size, minSize, maxWidth) {
    var s = size;
    g.font = weight + " " + s + "px " + FONT;
    while (g.measureText(text).width > maxWidth && s > minSize) {
      s -= 2;
      g.font = weight + " " + s + "px " + FONT;
    }
    var out = text;
    while (g.measureText(out).width > maxWidth && out.length > 1) {
      out = out.slice(0, -1);
      text = out + "…";
      if (g.measureText(text).width <= maxWidth) return text;
    }
    return text;
  }

  // opts: { title, line, tagline, posters: [url, ...] }  ->  Promise of a JPEG data URL
  FX.makeShareImage = function (opts) {
    var urls = (opts.posters || []).slice(0, 5);
    return Promise.all(urls.map(loadImage)).then(function (loaded) {
      var imgs = loaded.filter(function (x) { return !!x; });

      var c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      var g = c.getContext("2d");
      var rtl = /[֐-ࣿ]/.test(String(opts.title || ""));
      g.textAlign = "center";
      g.textBaseline = "alphabetic";

      // background
      var bg = g.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#0d0b2b");
      bg.addColorStop(0.55, "#171040");
      bg.addColorStop(1, "#070718");
      g.fillStyle = bg;
      g.fillRect(0, 0, W, H);

      var glow1 = g.createRadialGradient(240, 120, 10, 240, 120, 520);
      glow1.addColorStop(0, "rgba(139,92,246,0.45)");
      glow1.addColorStop(1, "rgba(139,92,246,0)");
      g.fillStyle = glow1;
      g.fillRect(0, 0, W, H);

      var glow2 = g.createRadialGradient(1060, 560, 10, 1060, 560, 520);
      glow2.addColorStop(0, "rgba(59,130,246,0.40)");
      glow2.addColorStop(1, "rgba(59,130,246,0)");
      g.fillStyle = glow2;
      g.fillRect(0, 0, W, H);

      // posters in a fan
      var n = imgs.length;
      var pw = n >= 4 ? 224 : 250, ph = Math.round(pw * 1.5);
      var step = n >= 4 ? 218 : 260;
      var mid = (n - 1) / 2;
      var order = [];
      for (var i = 0; i < n; i++) order.push(i);
      order.sort(function (a, b) { return Math.abs(b - mid) - Math.abs(a - mid); });
      order.forEach(function (i) {
        var d = i - mid;
        var cx = W / 2 + d * step;
        var cy = 40 + ph / 2 + d * d * 14;
        g.save();
        g.translate(cx, cy);
        g.rotate(d * 0.1);
        g.shadowColor = "rgba(0,0,0,0.65)";
        g.shadowBlur = 36;
        g.shadowOffsetY = 14;
        roundRect(g, -pw / 2, -ph / 2, pw, ph, 18);
        g.fillStyle = "#111";
        g.fill();
        g.shadowColor = "transparent";
        g.save();
        roundRect(g, -pw / 2, -ph / 2, pw, ph, 18);
        g.clip();
        g.drawImage(imgs[i], -pw / 2, -ph / 2, pw, ph);
        g.restore();
        roundRect(g, -pw / 2, -ph / 2, pw, ph, 18);
        g.lineWidth = 2;
        g.strokeStyle = "rgba(255,255,255,0.22)";
        g.stroke();
        g.restore();
      });

      // fade the bottom of the posters into the dark background
      var fade = g.createLinearGradient(0, 300, 0, 470);
      fade.addColorStop(0, "rgba(7,7,24,0)");
      fade.addColorStop(1, "rgba(7,7,24,0.97)");
      g.fillStyle = fade;
      g.fillRect(0, 300, W, H - 300);
      g.fillStyle = "rgba(7,7,24,0.97)";
      g.fillRect(0, 470, W, H - 470);

      g.direction = rtl ? "rtl" : "ltr";

      // list title
      g.fillStyle = "#ffffff";
      var title = fitText(g, String(opts.title || ""), "800", 58, 34, 1100);
      g.fillText(title, W / 2, 520);

      // "12 titles · by Name"
      g.fillStyle = "#b9b4e8";
      var line = fitText(g, String(opts.line || ""), "500", 28, 20, 1000);
      g.fillText(line, W / 2, 568);

      // thin divider
      var dv = g.createLinearGradient(W / 2 - 160, 0, W / 2 + 160, 0);
      dv.addColorStop(0, "rgba(139,92,246,0)");
      dv.addColorStop(0.5, "rgba(139,92,246,0.9)");
      dv.addColorStop(1, "rgba(59,130,246,0)");
      g.fillStyle = dv;
      g.fillRect(W / 2 - 160, 592, 320, 2);

      // Flicksy wordmark
      g.direction = "ltr";
      g.font = "italic 800 54px " + FONT;
      var word = "Flicksy";
      var ww = g.measureText(word).width;
      var wg = g.createLinearGradient(W / 2 - ww / 2, 0, W / 2 + ww / 2, 0);
      wg.addColorStop(0, "#a78bfa");
      wg.addColorStop(1, "#60a5fa");
      g.fillStyle = wg;
      g.fillText(word, W / 2, 648);

      // tagline + bot name
      g.direction = /[֐-ࣿ]/.test(String(opts.tagline || "")) ? "rtl" : "ltr";
      g.fillStyle = "#9d98d0";
      var tag = fitText(g, String(opts.tagline || ""), "500", 24, 16, 1100);
      g.fillText(tag, W / 2, 690);

      return c.toDataURL("image/jpeg", 0.82);
    });
  };
})();
