// Flicksy share cards, drawn with canvas so they use the same fonts as the app and Persian letters join correctly.
// The look follows the approved designs.
//   FX.cards.render(type, data, fmt)  ->  Promise of a canvas
//   type: "list" | "profile" | "title" | "recap"      fmt: "chat" (1200x630) | "story" (1080x1920) | "tw" (1200x675)
//   (list has chat and story; profile, title and recap have all three)
//   FX.cards.toBlob(canvas, type, quality) -> Promise of a JPEG blob
// poster images can be <img> elements (same-origin), or { h: hue, letter: "D" } as a placeholder.
(function () {
  "use strict";

  var FX = (window.FX = window.FX || {});
  var STACK = "Manrope, Vazirmatn, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
  var BG = "#07071a";

  // ---------- paths copied from the design ----------
  var LEAF = "M8 42V38C8 20 20 8 38 8H86C86 28 73 38 54 38H32C18 38 8 42 8 42Z";
  var BUB = "M8 90V65C8 54 17 46 28 46H70C81 46 90 54 90 65C90 76 81 84 70 84H34V90C34 93 32 95 29 95H13C10 95 8 93 8 90Z";
  var TICKET = "M10 0H90Q100 0 100 10V22A10 10 0 0 0 100 42V54Q100 64 90 64H10Q0 64 0 54V42A10 10 0 0 0 0 22V10Q0 0 10 0Z";
  var ICON = {
    list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
    film: "M4 5h16v14H4zM8 5v14M16 5v14M4 9h4M4 15h4M16 9h4M16 15h4",
    users: "M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21c0-4 4-6 8-6s8 2 8 6",
    tv: "M3 7h18v12H3zM8 3l4 4 4-4",
    cal: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
    star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"
  };

  // ---------- small helpers ----------
  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  function rrPath(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  function hsl(h, s, l, a) {
    return "hsla(" + (((h % 360) + 360) % 360) + "," + s + "%," + l + "%," + (a === undefined ? 1 : a) + ")";
  }

  function hslHex(h, s, l) {
    s /= 100; l /= 100;
    var k = function (n) { return (n + h / 30) % 12; }, a = s * Math.min(l, 1 - l);
    var f = function (n) { var v = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return ("0" + Math.round(v * 255).toString(16)).slice(-2); };
    return "#" + f(0) + f(8) + f(4);
  }
  function isFa(s) { return /[؀-ۿ]/.test(String(s || "")); }

  // A blurred disc, as a radial gradient (canvas has no reliable blur filter on every phone).
  var glowCache = {};
  function discProfile(R, sigma) {
    var key = R + "_" + sigma;
    if (glowCache[key]) return glowCache[key];
    var rMax = R + sigma * 2.6, out = [], N = 14, cell = (2 * R) / N;
    for (var i = 0; i <= 16; i++) {
      var d = (rMax * i) / 16, sum = 0;
      for (var a = 0; a < N; a++) for (var b = 0; b < N; b++) {
        var x = -R + (a + 0.5) * cell, y = -R + (b + 0.5) * cell;
        if (x * x + y * y > R * R) continue;
        var dx = d - x, dy = -y;
        sum += Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
      }
      out.push([i / 16, (sum * cell * cell) / (2 * Math.PI * sigma * sigma)]);
    }
    return (glowCache[key] = { rMax: rMax, stops: out });
  }

  function glow(g, x, y, size, color, alpha, sigma) {
    var R = size / 2, p = discProfile(R, sigma || 110), cx = x + R, cy = y + R;
    var gr = g.createRadialGradient(cx, cy, 0, cx, cy, p.rMax);
    p.stops.forEach(function (s) { gr.addColorStop(s[0], rgba(color, Math.max(0, Math.min(1, s[1] * alpha)))); });
    g.fillStyle = gr;
    g.fillRect(cx - p.rMax, cy - p.rMax, p.rMax * 2, p.rMax * 2);
  }

  function dotGrid(g, W, H) {
    for (var j = 0; j * 26 < H; j++) {
      var y = j * 26 + 1, a = 0.045 * Math.max(0, 1 - y / (H * 0.85));
      if (a <= 0) break;
      g.fillStyle = "rgba(255,255,255," + a + ")";
      g.beginPath();
      for (var i = 0; i * 26 < W; i++) { g.moveTo(i * 26 + 2, y); g.arc(i * 26 + 1, y, 1, 0, 6.2832); }
      g.fill();
    }
  }

  // ---------- text ----------
  var metricsCache = {};
  // line box of a font in CSS ("normal" line height): the tallest of the fonts that can be used
  function fontBox(g, weight, size, fa) {
    var key = weight + "_" + size + "_" + fa;
    if (metricsCache[key]) return metricsCache[key];
    var asc = 0, desc = 0;
    (fa ? ["Manrope", "Vazirmatn"] : ["Manrope"]).forEach(function (f) {
      g.font = weight + " " + size + "px " + f;
      var m = g.measureText("Hg");
      var a = m.fontBoundingBoxAscent, d = m.fontBoundingBoxDescent;
      if (typeof a !== "number") { a = size * 0.95; d = size * 0.3; }
      if (a > asc) asc = a;
      if (d > desc) desc = d;
    });
    return (metricsCache[key] = { asc: asc, desc: desc });
  }

  // draws text so that it sits centred in a box (like CSS flex centring); returns the width
  function text(g, str, x, boxTop, boxH, o) {
    var fa = isFa(str);
    g.font = o.weight + " " + o.size + "px " + STACK;
    g.direction = o.dir || (fa ? "rtl" : "ltr");
    if ("letterSpacing" in g) g.letterSpacing = o.ls || "0px";
    g.textAlign = o.align;
    g.textBaseline = "alphabetic";
    var fb = fontBox(g, o.weight, o.size, o.fixed ? false : (fa || o.fa));
    g.font = o.weight + " " + o.size + "px " + STACK;   // fontBox changed the font while measuring
    var base = o.baseAt !== undefined ? o.baseAt : boxTop + boxH / 2 + (fb.asc - fb.desc) / 2;
    base += o.dy || 0;
    g.__base = base;
    g.fillStyle = o.fill;
    var w = g.measureText(str).width;
    if (o.measureOnly) return w;
    g.fillText(str, x, base);
    return w;
  }
  function textWidth(g, str, weight, size, ls) {
    g.font = weight + " " + size + "px " + STACK;
    g.direction = isFa(str) ? "rtl" : "ltr";
    if ("letterSpacing" in g) g.letterSpacing = ls || "0px";
    return g.measureText(str).width;
  }

  function wrap(g, str, weight, size, maxW, maxLines) {
    var words = String(str).split(/\s+/), lines = [], cur = "";
    for (var i = 0; i < words.length; i++) {
      var t = cur ? cur + " " + words[i] : words[i];
      if (textWidth(g, t, weight, size) <= maxW || !cur) cur = t;
      else { lines.push(cur); cur = words[i]; }
    }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) {
      var keep = lines.slice(0, maxLines), last = keep[maxLines - 1];
      while (last.length > 1 && textWidth(g, last + "…", weight, size) > maxW) last = last.slice(0, -1);
      keep[maxLines - 1] = last + "…";
      return keep;
    }
    return lines;
  }

  // ---------- pieces of the design ----------
  function markGradient(g, x, y, s) {
    var gr = g.createLinearGradient(x + 10 * s, y, x + 40 * s, y + 100 * s);
    gr.addColorStop(0, "#c084fc"); gr.addColorStop(0.5, "#8b5cf6"); gr.addColorStop(1, "#5b3bff");
    return gr;
  }

  // the bubble-F mark, size = height in px
  function drawMark(g, x, y, size, shadow) {
    var s = size / 100;
    g.save();
    if (shadow) { g.shadowColor = "rgba(139,92,246,.55)"; g.shadowBlur = shadow.blur || 16; g.shadowOffsetY = shadow.dy || 6; }
    g.translate(x, y); g.scale(s, s);
    var gr = g.createLinearGradient(10, 0, 40, 100);
    gr.addColorStop(0, "#c084fc"); gr.addColorStop(0.5, "#8b5cf6"); gr.addColorStop(1, "#5b3bff");
    g.fillStyle = gr;
    g.fill(new Path2D(LEAF));
    g.fill(new Path2D(BUB));
    g.shadowColor = "transparent";
    g.fillStyle = BG;
    [46, 60, 74].forEach(function (cx) { g.beginPath(); g.arc(cx, 65, 4.6, 0, 6.2832); g.fill(); });
    g.restore();
  }

  // the ticket tag on a poster corner, height h
  function drawTicket(g, x, y, h) {
    var s = h / 64;
    g.save();
    g.shadowColor = "rgba(0,0,0,.55)"; g.shadowBlur = 6; g.shadowOffsetY = 3;
    g.translate(x, y); g.scale(s, s);
    var gr = g.createLinearGradient(0, 0, 100, 64);
    gr.addColorStop(0, "#a855f7"); gr.addColorStop(1, "#6366f1");
    g.fillStyle = gr;
    g.fill(new Path2D(TICKET));
    g.shadowColor = "transparent";
    g.save();
    g.translate(16.4, 11.6); g.scale(0.4, 0.4);
    g.fillStyle = "#fff";
    g.fill(new Path2D(LEAF)); g.fill(new Path2D(BUB));
    g.fillStyle = "#7050f0";
    [46, 60, 74].forEach(function (cx) { g.beginPath(); g.arc(cx, 65, 4.6, 0, 6.2832); g.fill(); });
    g.restore();
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 2; g.setLineDash([3, 4]);
    g.beginPath(); g.moveTo(74, 10); g.lineTo(74, 54); g.stroke();
    g.setLineDash([]);
    g.fillStyle = "#fff";
    g.beginPath(); g.moveTo(84, 25); g.lineTo(84, 39); g.lineTo(95, 32); g.closePath(); g.fill();
    g.restore();
  }

  // a line icon (24 x 24 design) of the given size
  function drawIcon(g, name, x, y, size, color, width) {
    g.save();
    g.translate(x, y); g.scale(size / 24, size / 24);
    g.strokeStyle = color; g.lineWidth = width || 2.2; g.lineCap = "round"; g.lineJoin = "round";
    g.stroke(new Path2D(ICON[name]));
    g.restore();
  }

  // one poster of the fan. spec = <img> | { h, letter } | null
  function drawPoster(g, spec, cx, cy, w, h, rot, scale, rtl, radius, po) {
    po = po || {};
    var off = 100000, shadows = po.shadows || [{ dy: 30, blur: 60, spread: -20, color: "rgba(0,0,0,.85)" }];
    for (var si = shadows.length - 1; si >= 0; si--) {
      var sh = shadows[si], ins = -sh.spread;
      g.save();
      g.translate(cx - off, cy); g.rotate(rot); g.scale(scale, scale);
      g.shadowColor = sh.color;
      g.shadowBlur = sh.blur * scale;
      g.shadowOffsetX = off - Math.sin(rot) * sh.dy * scale;
      g.shadowOffsetY = Math.cos(rot) * sh.dy * scale;
      rrPath(g, -w / 2 + ins, -h / 2 + ins, w - 2 * ins, h - 2 * ins, Math.max(0, radius - ins));
      g.fillStyle = "#000"; g.fill();
      g.restore();
    }
    g.save();
    g.translate(cx, cy); g.rotate(rot); g.scale(scale, scale);
    var x = -w / 2, y = -h / 2;
    // picture
    g.save();
    rrPath(g, x, y, w, h, radius);
    g.clip();
    if (spec && spec.naturalWidth) {
      var ir = spec.naturalWidth / spec.naturalHeight, br = w / h, dw = w, dh = h, dx = x, dy = y;
      if (ir > br) { dw = h * ir; dx = x - (dw - w) / 2; } else { dh = w / ir; dy = y - (dh - h) / 2; }
      g.drawImage(spec, dx, dy, dw, dh);
    } else {
      var hue = spec && spec.h !== undefined ? spec.h : 250;
      // linear-gradient(165deg, hsl(h 62% 46%), hsl(h+50 55% 13%))
      var ang = (165 * Math.PI) / 180, len = Math.abs(w * Math.sin(ang)) + Math.abs(h * Math.cos(ang));
      var dxv = Math.sin(ang) * len / 2, dyv = -Math.cos(ang) * len / 2;
      var lg = g.createLinearGradient(-dxv, -dyv, dxv, dyv);
      lg.addColorStop(0, hsl(hue, 62, 46)); lg.addColorStop(1, hsl(hue + 50, 55, 13));
      g.fillStyle = lg; g.fillRect(x, y, w, h);
      // soft light at 72% 18%
      var rg = g.createRadialGradient(x + w * 0.72, y + h * 0.18, 0, x + w * 0.72, y + h * 0.18, Math.hypot(w, h) * 0.55 * 0.78);
      rg.addColorStop(0, "rgba(255,255,255,.3)"); rg.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = rg; g.fillRect(x, y, w, h);
      var ang2 = (115 * Math.PI) / 180, len2 = Math.abs(w * Math.sin(ang2)) + Math.abs(h * Math.cos(ang2));
      var ex = Math.sin(ang2) * len2 / 2, ey = -Math.cos(ang2) * len2 / 2;
      var g2 = g.createLinearGradient(-ex, -ey, ex, ey);
      g2.addColorStop(0, "rgba(255,255,255,.14)"); g2.addColorStop(0.35, "rgba(255,255,255,0)");
      g.fillStyle = g2; g.fillRect(x, y, w, h);
      if (spec && spec.letter) {
        var lfs = po.letter || Math.round(w * 0.4);
        g.font = "900 " + lfs + "px " + STACK;
        g.direction = "ltr"; g.textAlign = "center"; g.textBaseline = "middle";
        g.fillStyle = "rgba(255,255,255,.3)";
        g.fillText(spec.letter, 0, 4 * (lfs / 76));
      }
    }
    g.restore();
    // 1px border
    rrPath(g, x + 0.5, y + 0.5, w - 1, h - 1, radius - 0.5);
    g.strokeStyle = "rgba(255,255,255," + (po.borderA || 0.18) + ")"; g.lineWidth = 1; g.stroke();
    // ticket tag, bottom corner at the start side
    var th = po.tkH || 30, ins = po.tkInset || 10, tw = th * (100 / 64);
    drawTicket(g, rtl ? x + w - ins - tw : x + ins, y + h - ins - th, th);
    g.restore();
  }

  // ---------- the list card, chat size 1200 x 630 ----------
  var BOX = {
    fa: { chip: 50, small: 27, b: 35, own: 67, pill: 54, bOff: 3 },
    en: { chip: 46, small: 23, b: 35, own: 58, pill: 49, bOff: 0 }
  };

  function listChat(g, d) {
    var W = 1200, H = 630, fa = d.lang === "fa", rtl = fa, box = BOX[fa ? "fa" : "en"];
    var sign = rtl ? -1 : 1;
    var startX = rtl ? W - 64 : 64;          // inline-start edge of the text column
    var align = rtl ? "right" : "left";

    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    // glows (violet top, blue bottom)
    glow(g, rtl ? -120 : W + 120 - 520, -180, 520, "#6d28d9", 0.6);
    glow(g, rtl ? W + 100 - 420 : -100, H + 200 - 420, 420, "#2563eb", 0.38);
    dotGrid(g, W, H);

    // posters, centre one on top
    var fanL = rtl ? 56 : 570, fanT = 104, step = 96, drop = 14, pw = 190, ph = 285;
    var specs = (d.posters || []).slice(0, 5);
    var n = specs.length, mid = (n - 1) / 2, order = [];
    for (var i = 0; i < n; i++) order.push(i);
    order.sort(function (a, b) { return Math.abs(b - mid) - Math.abs(a - mid); });
    order.forEach(function (i) {
      var dd = i - 2 + (2 - mid), a = Math.abs(dd);
      var left = fanL + i * step, top = fanT + a * a * drop;
      drawPoster(g, specs[i], left + pw / 2, top + ph / 2, pw, ph, (dd * 7 * Math.PI) / 180, 1 - a * 0.06, rtl, 18);
    });

    // text column
    var colW = 500, titleSize = 68, lines = wrap(g, d.title, 800, titleSize, colW, 2);
    while (lines.length > 2 && titleSize > 44) { titleSize -= 4; lines = wrap(g, d.title, 800, titleSize, colW, 2); }
    var tl = titleSize * 1.22, tH = lines.length * tl;
    var total = box.chip + 24 + tH + 24 + box.own + 24 + box.pill;
    var y = (H - total) / 2;

    // chip
    var chipW = 18 + 20 + 10 + textWidth(g, d.kind, 800, 19, fa ? "0px" : "0.76px") + 18 + 2;
    var chipX = rtl ? startX - chipW : startX;
    rrPath(g, chipX + 0.5, y + 0.5, chipW - 1, box.chip - 1, (box.chip - 1) / 2);
    g.fillStyle = "rgba(168,85,247,.2)"; g.fill();
    g.strokeStyle = "rgba(168,85,247,.45)"; g.lineWidth = 1; g.stroke();
    var iconX = rtl ? chipX + chipW - 19 - 20 : chipX + 19;
    drawIcon(g, "list", iconX, y + (box.chip - 20) / 2, 20, "#e4d9ff", 2.2);
    var tx = rtl ? iconX - 10 : iconX + 20 + 10;
    text(g, d.kind, tx, y, box.chip, { weight: 800, size: 19, fill: "#e4d9ff", align: rtl ? "right" : "left", ls: fa ? "0px" : "0.76px" });
    y += box.chip + 24;

    // title
    lines.forEach(function (ln, k) {
      text(g, ln, startX, y + k * tl - 1, tl, { weight: 800, size: titleSize, fill: "#f1f1fb", align: align, fixed: true });
    });
    y += tH + 24;

    // owner
    var avD = 56, avX = rtl ? startX - avD : startX, avY = y + (box.own - avD) / 2, avC = [avX + avD / 2, avY + avD / 2];
    g.beginPath(); g.arc(avC[0], avC[1], 33, 0, 6.2832); g.fillStyle = "hsl(340,80%,65%)"; g.fill();
    g.beginPath(); g.arc(avC[0], avC[1], 31, 0, 6.2832); g.fillStyle = BG; g.fill();
    var ag = g.createLinearGradient(avC[0] - 28, avC[1] - 28, avC[0] + 28, avC[1] + 28);
    ag.addColorStop(0, "hsl(340,70%,55%)"); ag.addColorStop(1, "hsl(20,60%,33%)");
    g.beginPath(); g.arc(avC[0], avC[1], 28, 0, 6.2832); g.fillStyle = ag; g.fill();
    text(g, (d.owner || "?").charAt(0), avC[0], avY, avD, { weight: 800, size: 24, fill: "#fff", align: "center", dir: "ltr" });
    var ox = rtl ? avX - 16 : avX + avD + 16;
    text(g, d.by, ox, y, box.small, { weight: 600, size: 17, fill: "#a3a3c4", align: align });
    text(g, d.owner, ox, y + box.small + box.bOff, box.b, { weight: 800, size: 25, fill: "#f1f1fb", align: align });
    y += box.own + 24;

    // stat pills
    var px = startX;
    [["film", d.items], ["users", d.followers]].forEach(function (p) {
      var tw = textWidth(g, p[1], 700, 20), pwid = 2 + 18 + 20 + 8 + tw + 18;
      var x0 = rtl ? px - pwid : px;
      rrPath(g, x0 + 0.5, y + 0.5, pwid - 1, box.pill - 1, (box.pill - 1) / 2);
      g.fillStyle = "rgba(255,255,255,.07)"; g.fill();
      g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = 1; g.stroke();
      var ix = rtl ? x0 + pwid - 19 - 20 : x0 + 19;
      drawIcon(g, p[0], ix, y + (box.pill - 20) / 2, 20, "#b794ff", 2.2);
      text(g, p[1], rtl ? ix - 8 : ix + 28, y, box.pill, { weight: 700, size: 20, fill: "#dcdcf3", align: rtl ? "right" : "left" });
      px += sign * (pwid + 12);
    });

    // brand row
    var by = 542, bh = 44;
    var wmW = textWidth(g, "Flicksy", 800, 32, "-0.5px") + 0.1 * 32;
    var mx = rtl ? startX - 40 : startX;
    drawMark(g, mx, by + 2, 40, true);
    var wx = rtl ? mx - 14 - wmW : mx + 40 + 14;
    var wg = g.createLinearGradient(wx, by, wx + wmW, by + bh);
    wg.addColorStop(0, "#a855f7"); wg.addColorStop(1, "#6366f1");
    g.font = "800 32px Manrope, sans-serif";
    text(g, "Flicksy", rtl ? wx + wmW : wx, by, bh, { weight: 800, size: 32, fill: wg, align: rtl ? "right" : "left", ls: "-0.5px", dir: "ltr" });
    var tgx = rtl ? wx - 14 - 10 : wx + wmW + 14 + 10;
    text(g, d.tagline, tgx, by, bh, { weight: 500, size: 17, fill: "#a3a3c4", align: rtl ? "right" : "left" });
  }


  // ---------- the list card, story size 1080 x 1920 ----------
  var SBOX = {
    fa: { chip: 71, ttl: 117.12, own: 96, pill: 75, avOff: 6, smallTop: 0, small: 39, bTop: 43, b: 49 },
    en: { chip: 64, ttl: 117.12, own: 84, pill: 68, avOff: 0, smallTop: 1, small: 33, bTop: 34, b: 49 }
  };

  function listStory(g, d) {
    var W = 1080, H = 1920, fa = d.lang === "fa", rtl = fa, box = SBOX[fa ? "fa" : "en"];
    var sign = rtl ? -1 : 1, cx = W / 2;

    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    glow(g, -250, -250, 900, "#6d28d9", 0.6);
    glow(g, W + 300 - 800, H + 250 - 800, 800, "#2563eb", 0.38);
    dotGrid(g, W, H);

    // brand on top
    var wmW = textWidth(g, "Flicksy", 800, 48, "-0.5px") + 0.1 * 48;
    var totalW = 60 + 14 + wmW, bTop = 268, bH = 65;
    var mx = rtl ? cx + totalW / 2 - 60 : cx - totalW / 2;
    drawMark(g, mx, bTop + 2.5, 60, true);
    var wx = rtl ? mx - 14 - wmW : mx + 60 + 14;
    var wg = g.createLinearGradient(wx, bTop, wx + wmW, bTop + bH);
    wg.addColorStop(0, "#a855f7"); wg.addColorStop(1, "#6366f1");
    text(g, "Flicksy", rtl ? wx + wmW : wx, bTop, bH, { weight: 800, size: 48, fill: wg, align: rtl ? "right" : "left", ls: "-0.5px", dir: "ltr" });

    // fan of posters
    var specs = (d.posters || []).slice(0, 5);
    var n = specs.length, mid = (n - 1) / 2, order = [];
    for (var i = 0; i < n; i++) order.push(i);
    order.sort(function (a, b) { return Math.abs(b - mid) - Math.abs(a - mid); });
    order.forEach(function (i) {
      var dd = i - 2 + (2 - mid), a = Math.abs(dd);
      var left = 90 + i * 150, top = 340 + a * a * 26;
      drawPoster(g, specs[i], left + 150, top + 225, 300, 450, (dd * 7 * Math.PI) / 180, 1 - a * 0.06, rtl, 26, { tkH: 46, tkInset: 16 });
    });

    var y = 980, align = rtl ? "right" : "left", gap = 26;

    // chip
    var cls = fa ? "0px" : "1.12px";
    var chipW = 2 + 52 + 28 + 10 + textWidth(g, d.kind, 800, 28, cls);
    var chipX = cx - chipW / 2;
    rrPath(g, chipX + 0.5, y + 0.5, chipW - 1, box.chip - 1, (box.chip - 1) / 2);
    g.fillStyle = "rgba(168,85,247,.2)"; g.fill();
    g.strokeStyle = "rgba(168,85,247,.45)"; g.lineWidth = 1; g.stroke();
    var iconX = rtl ? chipX + chipW - 27 - 28 : chipX + 27;
    drawIcon(g, "list", iconX, y + (box.chip - 28) / 2, 28, "#e4d9ff", 2.2);
    text(g, d.kind, rtl ? iconX - 10 : iconX + 28 + 10, y, box.chip, { weight: 800, size: 28, fill: "#e4d9ff", align: align, ls: cls });
    y += box.chip + gap;

    // title (centred, up to 2 lines)
    var titleSize = 96, lines = wrap(g, d.title, 800, titleSize, 900, 2);
    while (lines.length > 2 && titleSize > 56) { titleSize -= 4; lines = wrap(g, d.title, 800, titleSize, 900, 2); }
    var tl = titleSize * 1.22;
    lines.forEach(function (ln, k) {
      text(g, ln, cx, y + k * tl, tl, { weight: 800, size: titleSize, fill: "#f1f1fb", align: "center", fixed: true });
    });
    y += lines.length * tl + gap;

    // owner row
    var avD = 84, tw1 = textWidth(g, d.by, 600, 24), tw2 = textWidth(g, d.owner, 800, 36);
    var ownW = avD + 22 + Math.max(tw1, tw2), x0 = cx - ownW / 2;
    var avX = rtl ? x0 + ownW - avD : x0, avY = y + box.avOff, c = [avX + avD / 2, avY + avD / 2];
    g.beginPath(); g.arc(c[0], c[1], avD / 2 + 5, 0, 6.2832); g.fillStyle = "hsl(340,80%,65%)"; g.fill();
    g.beginPath(); g.arc(c[0], c[1], avD / 2 + 3, 0, 6.2832); g.fillStyle = BG; g.fill();
    var ag = g.createLinearGradient(c[0] - avD / 2, c[1] - avD / 2, c[0] + avD / 2, c[1] + avD / 2);
    ag.addColorStop(0, "hsl(340,70%,55%)"); ag.addColorStop(1, "hsl(20,60%,33%)");
    g.beginPath(); g.arc(c[0], c[1], avD / 2, 0, 6.2832); g.fillStyle = ag; g.fill();
    text(g, (d.owner || "?").charAt(0), c[0], avY, avD, { weight: 800, size: 36, fill: "#fff", align: "center", dir: "ltr" });
    var ox = rtl ? avX - 22 : avX + avD + 22;
    text(g, d.by, ox, y + box.smallTop, box.small, { weight: 600, size: 24, fill: "#a3a3c4", align: align });
    text(g, d.owner, ox, y + box.bTop, box.b, { weight: 800, size: 36, fill: "#f1f1fb", align: align });
    y += box.own + gap;

    // stat pills, centred as a group
    var pl = [["film", d.items], ["users", d.followers]].map(function (p) {
      return { ic: p[0], t: p[1], tw: textWidth(g, p[1], 700, 28) };
    });
    pl.forEach(function (p) { p.w = 2 + 52 + 28 + 8 + p.tw; });
    var groupW = pl[0].w + 16 + pl[1].w, px = rtl ? cx + groupW / 2 : cx - groupW / 2;
    pl.forEach(function (p) {
      var x1 = rtl ? px - p.w : px;
      rrPath(g, x1 + 0.5, y + 0.5, p.w - 1, box.pill - 1, (box.pill - 1) / 2);
      g.fillStyle = "rgba(255,255,255,.07)"; g.fill();
      g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = 1; g.stroke();
      var ix = rtl ? x1 + p.w - 27 - 28 : x1 + 27;
      drawIcon(g, p.ic, ix, y + (box.pill - 28) / 2, 28, "#b794ff", 2.2);
      text(g, p.t, rtl ? ix - 8 : ix + 28 + 8, y, box.pill, { weight: 700, size: 28, fill: "#dcdcf3", align: align });
      px += sign * (p.w + 16);
    });
  }


  // ---------- profile card (chat 1200x630, story 1080x1920, twitter 1200x675) ----------
  function lineH(g, weight, size, fa) {
    var fb = fontBox(g, weight, size, fa);
    return Math.round(fb.asc) + Math.round(fb.desc);
  }

  // big avatar with pink ring and soft pink glow. r = gap ring width
  function avatarBig(g, cx, cy, d, r, ch, fs, noGlow) {
    var off = 100000;
    if (!noGlow) {
    g.save();
    g.shadowColor = "rgba(219,39,119,.35)"; g.shadowBlur = 60; g.shadowOffsetX = off; g.shadowOffsetY = 0;
    g.beginPath(); g.arc(cx - off, cy, d / 2 + 8, 0, 6.2832); g.fillStyle = "#000"; g.fill();
    g.restore();
    }
    g.beginPath(); g.arc(cx, cy, d / 2 + r * 1.7, 0, 6.2832); g.fillStyle = "hsl(340,80%,65%)"; g.fill();
    g.beginPath(); g.arc(cx, cy, d / 2 + r, 0, 6.2832); g.fillStyle = BG; g.fill();
    var ag = g.createLinearGradient(cx - d / 2, cy - d / 2, cx + d / 2, cy + d / 2);
    ag.addColorStop(0, "hsl(340,70%,55%)"); ag.addColorStop(1, "hsl(20,60%,33%)");
    g.beginPath(); g.arc(cx, cy, d / 2, 0, 6.2832); g.fillStyle = ag; g.fill();
    text(g, ch, cx, cy - d / 2, d, { weight: 800, size: fs, fill: "#fff", align: "center", dir: "ltr" });
  }

  // name followed by the mark; startEdge = inline-start edge (physical x). returns total width
  function nameRow(g, name, startEdge, top, h, size, gap, mk, rtl, dy) {
    var nw = textWidth(g, name, 800, size);
    var tx = startEdge;
    text(g, name, tx, top, h, { weight: 800, size: size, fill: "#f1f1fb", align: rtl ? "right" : "left", fixed: true, dy: dy || 0 });
    var mx = rtl ? startEdge - nw - gap - mk : startEdge + nw + gap;
    drawMark(g, mx, top + (h - mk) / 2, mk, { blur: 10, dy: 4 });
    return nw + gap + mk;
  }

  function lines(g, str, weight, size, maxW) {
    return wrap(g, str, weight, size, maxW, 4);
  }

  // one stat (number [+ small unit] and label) centred at cx
  function statText(g, st, cx, bTop, bH, bSize, sTop, sH, sSize, labelFill, rtl) {
    if (st.u) {
      var ut = " " + st.u, w1 = textWidth(g, st.v, 800, bSize), w2 = textWidth(g, ut, 700, bSize * 0.5), tot = w1 + w2;
      var left = cx - tot / 2;
      if (rtl) {
        text(g, st.v, left + tot, bTop, bH, { weight: 800, size: bSize, fill: "#f1f1fb", align: "right", fixed: true });
        text(g, ut, left + w2, bTop, bH, { weight: 700, size: bSize * 0.5, fill: "#cfcfe8", align: "right", baseAt: g.__base });
      } else {
        text(g, st.v, left, bTop, bH, { weight: 800, size: bSize, fill: "#f1f1fb", align: "left", fixed: true });
        text(g, ut, left + w1, bTop, bH, { weight: 700, size: bSize * 0.5, fill: "#cfcfe8", align: "left", baseAt: g.__base });
      }
    } else {
      text(g, st.v, cx, bTop, bH, { weight: 800, size: bSize, fill: "#f1f1fb", align: "center", fixed: true });
    }
    text(g, st.l, cx, sTop, sH, { weight: 600, size: sSize, fill: labelFill, align: "center" });
  }

  // the 3-cell stats bar. returns its height
  function statsBar(g, stats, x, y, w, rtl, pad, radius, bSize, sSize, mt, fa) {
    var bH = bSize * 1.1, sH = lineH(g, 600, sSize, fa);
    var h = 2 + pad * 2 + bH + mt + sH;
    rrPath(g, x + 0.5, y + 0.5, w - 1, h - 1, radius - 0.5);
    g.fillStyle = "rgba(255,255,255,.06)"; g.fill();
    g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = 1; g.stroke();
    var n = stats.length, inner = w - 2, cw = (inner - (n - 1)) / n;
    stats.forEach(function (st, k) {
      var start = k * cw + Math.max(0, k - 1) * 0 + (k > 0 ? (k - 1 + 0) : 0);
      // outer width of cell j: cw + (j>0 ? 1 : 0); start of cell k = k*cw + max(0,k-1)
      start = k * cw + Math.max(0, k - 1);
      var off = start + (k > 0 ? 1 : 0) + cw / 2;
      var cx = rtl ? x + w - 1 - off : x + 1 + off;
      statText(g, st, cx, y + 1 + pad, bH, bSize, y + 1 + pad + bH + mt, sH, sSize, "#a3a3c4", rtl);
      if (k > 0) {
        var lx = rtl ? x + w - 1 - start - 1 : x + 1 + start;
        g.fillStyle = "rgba(255,255,255,.1)"; g.fillRect(lx, y + 1 + pad, 1, bH + mt + sH);
      }
    });
    return h;
  }

  function brandProfile(g, x0, top, bh, markH, wmSize, rtl, tag, tagSize, centerIn, tagMargin) {
    var wmW = textWidth(g, "Flicksy", 800, wmSize, "-0.5px");
    var tm = tagMargin || 10;
    var markTop = top + (bh - markH) / 2;
    var wx, mx;
    if (centerIn) {
      var tot = markH + 14 + wmW;
      mx = rtl ? centerIn + tot / 2 - markH : centerIn - tot / 2;
    } else mx = rtl ? x0 - markH : x0;
    drawMark(g, mx, markTop, markH, true);
    wx = rtl ? mx - 14 - wmW : mx + markH + 14;
    var wg = g.createLinearGradient(wx, top, wx + wmW, top + bh);
    wg.addColorStop(0, "#a855f7"); wg.addColorStop(1, "#6366f1");
    text(g, "Flicksy", rtl ? wx + wmW : wx, top, bh, { weight: 800, size: wmSize, fill: wg, align: rtl ? "right" : "left", ls: "-0.5px", dir: "ltr" });
    if (tag) {
      var tx = rtl ? wx - 14 - tm : wx + wmW + 14 + tm;
      text(g, tag, tx, top, bh, { weight: 500, size: tagSize, fill: "#a3a3c4", align: rtl ? "right" : "left" });
    }
  }

  function bgGlowsS(g, W, H, list) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    list.forEach(function (a) { glow(g, a[0], a[1], a[2], a[3], a[4], 120); });
    dotGrid(g, W, H);
  }
  function bgGlows(g, W, H, list) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    list.forEach(function (a) { glow(g, a[0], a[1], a[2], a[3], a[4]); });
    dotGrid(g, W, H);
  }

  function profChat(g, d) {
    var W = 1200, H = 630, fa = d.lang === "fa", rtl = fa;
    bgGlows(g, W, H, [
      [rtl ? -120 : W + 120 - 520, -180, 520, "#6d28d9", 0.6],
      [rtl ? W + 100 - 420 : -100, H + 200 - 420, 420, "#2563eb", 0.38],
      [rtl ? W - 120 - 380 : 120, -120, 380, "#db2777", 0.22]
    ]);
    // 3 posters
    var fanL = rtl ? 60 : W - 60 - 470, specs = (d.posters || []).slice(0, 3);
    var order = [0, 2, 1];
    specs.length < 3 && (order = [0, 1, 2].slice(0, specs.length));
    order.forEach(function (i) {
      var dd = i - 1, a = Math.abs(dd);
      drawPoster(g, specs[i], fanL + i * 135 + 100, 110 + a * 26 + 150, 200, 300, (dd * 8 * Math.PI) / 180, 1 - a * 0.07, rtl, 18, { letter: 76 });
    });
    var edge = rtl ? W - 64 : 64, y = 70;
    // head
    var avD = 126, avX = rtl ? edge - avD : edge;
    avatarBig(g, avX + avD / 2, y + avD / 2, avD, 5, d.ini, 54);
    var textEdge = rtl ? avX - 30 : avX + avD + 30;
    var nmH = 50 * 1.15, unH = lineH(g, 600, 24, false), blockH = nmH + 6 + unH;
    var nTop = y + (avD - blockH) / 2;
    var rowW = nameRow(g, d.name, textEdge, nTop, nmH, 50, 12, 40, rtl, -1);
    var unW = textWidth(g, d.un, 600, 24), blockW = Math.max(rowW, unW);
    text(g, d.un, rtl ? textEdge - blockW : textEdge, nTop + nmH + 6, unH, { weight: 600, size: 24, fill: "#a3a3c4", align: "left", dir: "ltr" });
    y += avD + 26;
    // bio
    var bl = lines(g, d.bio, 500, 25, 600), tl = 25 * 1.55;
    bl.forEach(function (ln, k) {
      text(g, ln, edge, y + k * tl, tl, { weight: 500, size: 25, fill: "#d6d6ee", align: rtl ? "right" : "left", fixed: true, dy: -1 });
    });
    y += bl.length * tl + 26;
    var stX = rtl ? edge - 600 : edge;
    statsBar(g, d.stats.slice(0, 3), stX, y, 600, rtl, 20, 24, 40, 18, 6, fa);
    brandProfile(g, edge, 542, 44, 38, 32, rtl, d.tagline, 17);
  }

  function profStory(g, d) {
    var W = 1080, H = 1920, fa = d.lang === "fa", rtl = fa, cx = W / 2;
    bgGlows(g, W, H, [
      [-250, -250, 900, "#6d28d9", 0.6],
      [W + 300 - 800, H + 250 - 800, 800, "#2563eb", 0.38],
      [W + 300 - 700, 300, 700, "#db2777", 0.22]
    ]);
    brandProfile(g, 0, 268, 65, 60, 48, rtl, null, 0, cx);
    var y = 370;
    avatarBig(g, cx, y + 120, 240, 8, d.ini, 104);
    y += 240 + 34;
    var nmH = 80 * 1.15, nw = textWidth(g, d.name, 800, 80), rowW = nw + 18 + 62;
    nameRow(g, d.name, rtl ? cx + rowW / 2 : cx - rowW / 2, y, nmH, 80, 18, 62, rtl, -1);
    y += nmH + 12;
    var unH = lineH(g, 600, 34, false);
    text(g, d.un, cx, y, unH, { weight: 600, size: 34, fill: "#a3a3c4", align: "center", dir: "ltr" });
    y += unH + 14;
    var bl = lines(g, d.bio, 500, 32, 820), tl = 32 * 1.55;
    bl.forEach(function (ln, k) {
      text(g, ln, cx, y + k * tl, tl, { weight: 500, size: 32, fill: "#d6d6ee", align: "center", fixed: true, dy: -1 });
    });
    y += bl.length * tl + 42;
    var h = statsBar(g, d.stats.slice(0, 3), 90, y, 900, rtl, 30, 36, 60, 26, 8, fa);
    y += h + 42;
    var specs = (d.posters || []).slice(0, 4);
    specs.forEach(function (sp, i) {
      var dd = i - 1.5;
      drawPoster(g, sp, 220 + i * 163 + 75, y + Math.abs(dd) * 8 + 112.5, 150, 225, (dd * 5 * Math.PI) / 180, 1, rtl, 20, { letter: 60, tkH: 28, tkInset: 8 });
    });
  }

  function profTw(g, d) {
    var W = 1200, H = 675, fa = d.lang === "fa", rtl = fa;
    bgGlows(g, W, H, [
      [rtl ? -100 : W + 100 - 560, -200, 560, "#6d28d9", 0.6],
      [rtl ? W + 120 - 460 : -120, H + 220 - 460, 460, "#2563eb", 0.38],
      [rtl ? W - 200 - 360 : 200, -100, 360, "#db2777", 0.22]
    ]);
    var edge = rtl ? W - 72 : 72, colL = rtl ? W - 72 - 560 : 72;
    var nmH = 60 * 1.15, unH = lineH(g, 600, 27, false), tl = 27 * 1.55;
    var bl = lines(g, d.bio, 500, 27, 560);
    var total = 150 + 10 + 22 + nmH + 22 + unH + 22 + bl.length * tl;
    var y = (H - total) / 2;
    avatarBig(g, rtl ? edge - 75 : edge + 75, y + 75, 150, 6, d.ini, 64);
    y += 150 + 10 + 22;
    nameRow(g, d.name, edge, y, nmH, 60, 14, 48, rtl);
    y += nmH + 22;
    text(g, d.un, colL, y, unH, { weight: 600, size: 27, fill: "#a3a3c4", align: "left", dir: "ltr" });
    y += unH + 22;
    bl.forEach(function (ln, k) {
      text(g, ln, edge, y + k * tl, tl, { weight: 500, size: 27, fill: "#d6d6ee", align: rtl ? "right" : "left", fixed: true });
    });
    // 2 x 2 grid
    var gl = rtl ? 72 : W - 72 - 430, sH = lineH(g, 600, 22, fa), bH = 56 * 1.1, ch = 2 + 56 + bH + 8 + sH;
    d.stats.slice(0, 4).forEach(function (st, k) {
      var col = k % 2, row = Math.floor(k / 2);
      var x = rtl ? gl + 430 - 206 - col * (206 + 18) : gl + col * (206 + 18);
      var yy = 90 + row * (ch + 18);
      rrPath(g, x + 0.5, yy + 0.5, 205, ch - 1, 27.5);
      if (k === 0) {
        var lg = g.createLinearGradient(x, yy, x + 206, yy + ch);
        // 135deg on a non-square box
        var len = (206 + ch) * Math.SQRT1_2, mx = x + 103, my = yy + ch / 2, dx = 0.7071 * len / 2;
        lg = g.createLinearGradient(mx - dx, my - dx, mx + dx, my + dx);
        lg.addColorStop(0, "rgba(168,85,247,.45)"); lg.addColorStop(1, "rgba(99,102,241,.3)");
        g.fillStyle = lg;
      } else g.fillStyle = "rgba(255,255,255,.06)";
      g.fill();
      g.strokeStyle = k === 0 ? "rgba(168,85,247,.5)" : "rgba(255,255,255,.1)"; g.lineWidth = 1; g.stroke();
      statText(g, st, x + 103, yy + 29, bH, 56, yy + 29 + bH + 8, sH, 22, "#cfcfe8", rtl);
    });
    // brand centred under the grid, url at the start edge
    brandProfile(g, 0, 570, 49, 44, 36, rtl, null, 0, rtl ? 72 + 215 : W - 72 - 215);
    text(g, "t.me/flicksyrobot", rtl ? W - 72 - textWidth(g, "t.me/flicksyrobot", 600, 22) : 72, 591, 30, { weight: 600, size: 22, fill: "#a3a3c4", align: "left", dir: "ltr" });
  }


  // ---------- movie / series card ----------
  function dominantHue(img) {
    try {
      var c = document.createElement("canvas"); c.width = c.height = 16;
      var x = c.getContext("2d"); x.drawImage(img, 0, 0, 16, 16);
      var px = x.getImageData(0, 0, 16, 16).data, sr = 0, sg = 0, sb = 0, sw = 0;
      for (var i = 0; i < px.length; i += 4) {
        var r = px[i], g2 = px[i + 1], b = px[i + 2], mx = Math.max(r, g2, b), mn = Math.min(r, g2, b), w = (mx - mn) + 1;
        sr += r * w; sg += g2 * w; sb += b * w; sw += w;
      }
      var R = sr / sw / 255, G = sg / sw / 255, B = sb / sw / 255, mx2 = Math.max(R, G, B), mn2 = Math.min(R, G, B), d = mx2 - mn2, h = 0;
      if (d > 0.02) {
        if (mx2 === R) h = ((G - B) / d) % 6; else if (mx2 === G) h = (B - R) / d + 2; else h = (R - G) / d + 4;
        h *= 60; if (h < 0) h += 360;
        return h;
      }
    } catch (e) {}
    return 265;
  }

  function fillIcon(g, name, x, y, size, color) {
    g.save(); g.translate(x, y); g.scale(size / 24, size / 24);
    g.fillStyle = color; g.fill(new Path2D(ICON[name])); g.restore();
  }

  // the rating pill and the "who rated" pill. cfg: { size, padX, padY, mini, miniFs, svg }
  // pos: { edge } start edge, or { cx } to centre the row. returns row height
  function titleRow(g, d, y, cfg, pos, rtl, fa) {
    var size = cfg.size, emSize = size * 0.7, gapP = cfg.gap, pills = [];
    var tlh = lineH(g, 700, size, fa);
    if (d.rating) {
      var vW = textWidth(g, d.rating, 700, size), eW = textWidth(g, d.outOf, 600, emSize);
      pills.push({ k: "rt", w: 2 + 2 * cfg.padX + cfg.svg + 10 + vW + 10 + eW, h: 2 + 2 * cfg.padY + Math.max(cfg.svg, tlh), vW: vW, eW: eW });
    }
    if (d.who) {
      var wt = d.who + " " + d.rated, tW = textWidth(g, wt, 700, size);
      pills.push({ k: "who", w: 2 + 2 * cfg.padX + cfg.mini + 10 + tW, h: 2 + 2 * cfg.padY + Math.max(cfg.mini, tlh), tW: tW, t: wt });
    }
    if (!pills.length) return 0;
    var rowH = 0, tot = 0;
    pills.forEach(function (p, i) { rowH = Math.max(rowH, p.h); tot += p.w + (i ? gapP : 0); });
    var cur = pos.cx !== undefined ? (rtl ? pos.cx + tot / 2 : pos.cx - tot / 2) : pos.edge;
    pills.forEach(function (p) {
      var x0 = rtl ? cur - p.w : cur, py = y + (rowH - p.h) / 2, inL = x0 + 1 + cfg.padX, inR = x0 + p.w - 1 - cfg.padX;
      rrPath(g, x0 + 0.5, py + 0.5, p.w - 1, p.h - 1, (p.h - 1) / 2);
      g.fillStyle = p.k === "rt" ? "rgba(251,191,36,.14)" : "rgba(255,255,255,.07)"; g.fill();
      g.strokeStyle = p.k === "rt" ? "rgba(251,191,36,.45)" : "rgba(255,255,255,.1)"; g.lineWidth = 1; g.stroke();
      var al = rtl ? "right" : "left";
      if (p.k === "rt") {
        var sx = rtl ? inR - cfg.svg : inL;
        fillIcon(g, "star", sx, py + (p.h - cfg.svg) / 2, cfg.svg, "#fbbf24");
        var vx = rtl ? sx - 10 : sx + cfg.svg + 10;
        text(g, d.rating, vx, py, p.h, { weight: 700, size: size, fill: "#ffffff", align: al });
        var ex = rtl ? vx - p.vW - 10 : vx + p.vW + 10;
        text(g, d.outOf, ex, py, p.h, { weight: 600, size: emSize, fill: "#a3a3c4", align: al });
      } else {
        var mxp = rtl ? inR - cfg.mini : inL, mc = [mxp + cfg.mini / 2, py + p.h / 2];
        var mg = g.createLinearGradient(mc[0] - cfg.mini / 2, mc[1] - cfg.mini / 2, mc[0] + cfg.mini / 2, mc[1] + cfg.mini / 2);
        mg.addColorStop(0, "hsl(340,70%,55%)"); mg.addColorStop(1, "hsl(20,60%,33%)");
        g.beginPath(); g.arc(mc[0], mc[1], cfg.mini / 2, 0, 6.2832); g.fillStyle = mg; g.fill();
        text(g, (d.who || "?").charAt(0), mc[0], mc[1] - cfg.mini / 2, cfg.mini, { weight: 800, size: cfg.miniFs, fill: "#fff", align: "center", dir: "ltr" });
        text(g, p.t, rtl ? mxp - 10 : mxp + cfg.mini + 10, py, p.h, { weight: 700, size: size, fill: "#e6e6f8", align: al });
      }
      cur += (rtl ? -1 : 1) * (p.w + gapP);
    });
    return rowH;
  }

  function titleChip(g, d, edge, y, rtl, fa, pad, fs, icon, chipH) {
    var ls = fa ? "0px" : (fs * 0.04) + "px";
    var cw = 2 + 2 * pad + icon + 10 + textWidth(g, d.kind, 800, fs, ls), cx0 = rtl ? edge - cw : edge;
    rrPath(g, cx0 + 0.5, y + 0.5, cw - 1, chipH - 1, (chipH - 1) / 2);
    g.fillStyle = "rgba(168,85,247,.2)"; g.fill();
    g.strokeStyle = "rgba(168,85,247,.45)"; g.lineWidth = 1; g.stroke();
    var ix = rtl ? cx0 + cw - 1 - pad - icon : cx0 + 1 + pad;
    drawIcon(g, d.type === "series" ? "tv" : "film", ix, y + (chipH - icon) / 2, icon, "#e4d9ff", 2.2);
    text(g, d.kind, rtl ? ix - 10 : ix + icon + 10, y, chipH, { weight: 800, size: fs, fill: "#e4d9ff", align: rtl ? "right" : "left", ls: ls });
    return cw;
  }

  function posterSpec(d) {
    var sp = d.poster, hue = 265;
    if (sp && sp.naturalWidth) hue = dominantHue(sp); else if (sp && sp.h !== undefined) hue = sp.h;
    return { sp: sp, hue: hue, col: hslHex(hue, 80, 50) };
  }
  function titlePoShadows(hue, dy, blur, spread) {
    return [{ dy: dy, blur: blur, spread: spread, color: "rgba(0,0,0,.9)" }, { dy: 0, blur: 90, spread: -20, color: hsl(hue, 80, 50, 0.55) }];
  }

  // title text lines: titleBlock returns the y after the block (without trailing gap)
  function titleText(g, d, o) {
    // o: { x, align, maxW, size, lh, y, gap, origMt, origSize, metaSize, metaStr, centerX, rtl, fa, noWrap }
    var y = o.y, lines;
    if (o.noWrap) {
      var t = d.title;
      while (t.length > 1 && textWidth(g, t, 800, o.size) > o.maxW) t = t.slice(0, -1);
      lines = [t === d.title ? t : t.replace(/\s+$/, "") + "…"];
    } else lines = wrap(g, d.title, 800, o.size, o.maxW, 2);
    var lh = o.size * 1.2;
    lines.forEach(function (ln, k) {
      text(g, ln, o.x, y + k * lh, lh, { weight: 800, size: o.size, fill: "#f1f1fb", align: o.align, fixed: true, dy: o.tdy || 0 });
    });
    y += lines.length * lh;
    if (d.orig) {
      var oh = lineH(g, 600, o.origSize, false);
      y += o.gap + o.origMt;
      text(g, d.orig, o.origX, y, oh, { weight: 600, size: o.origSize, fill: "#a3a3c4", align: o.origAlign, dir: "ltr" });
      y += oh;
    }
    var mh = lineH(g, 600, o.metaSize, o.fa);
    y += o.metaGap;
    var ml = wrap(g, o.metaStr, 600, o.metaSize, o.maxW, 2);
    ml.forEach(function (ln, k) {
      text(g, ln, o.x, y + k * mh, mh, { weight: 600, size: o.metaSize, fill: "#cfcfe8", align: o.align });
    });
    y += ml.length * mh;
    return y;
  }

  function titleChat(g, d) {
    var W = 1200, H = 630, fa = d.lang === "fa", rtl = fa, P = posterSpec(d);
    bgGlowsS(g, W, H, [
      [rtl ? W + 140 - 560 : -140, -160, 560, P.col, 0.5],
      [rtl ? -80 : W + 80 - 420, H + 220 - 420, 420, "#2563eb", 0.35]
    ]);
    var pw = 290, ph = 435, left = rtl ? W - 76 - pw : 76;
    drawPoster(g, P.sp || { h: P.hue }, left + pw / 2, 98 + ph / 2, pw, ph, (-4 * Math.PI) / 180, 1, rtl, 24,
      { letter: 120, tkH: 34, tkInset: 14, borderA: 0.2, shadows: titlePoShadows(P.hue, 40, 80, -24) });
    var edge = rtl ? W - 440 : 440, colL = rtl ? W - 440 - 690 : 440, y = 70;
    var chipH = fa ? 50 : 46;
    titleChip(g, d, edge, y, rtl, fa, 18, 19, 20, chipH);
    y += chipH + 18;
    var metaStr = d.meta;
    var yy = titleText(g, d, { x: edge, align: rtl ? "right" : "left", maxW: 690, size: 64, y: y, gap: 18, origMt: -6, origSize: 24, origX: colL, origAlign: "left", metaSize: 25, metaGap: 18, metaStr: metaStr, fa: fa, tdy: 0 });
    y = yy + 18 + 6;
    titleRow(g, d, y, { size: 24, padX: 20, padY: 11, mini: 34, miniFs: 16, svg: 24, gap: 14 }, { edge: edge }, rtl, fa);
    brandProfile(g, edge, 542, 44, 38, 32, rtl, d.tagline, 17);
  }

  function titleStory(g, d) {
    var W = 1080, H = 1920, fa = d.lang === "fa", rtl = fa, cx = W / 2, P = posterSpec(d);
    bgGlowsS(g, W, H, [[90, -100, 900, P.col, 0.5], [W + 300 - 800, H + 250 - 800, 800, "#2563eb", 0.35]]);
    brandProfile(g, 0, 262, 63, 56, 46, rtl, null, 0, cx);
    drawPoster(g, P.sp || { h: P.hue }, cx, 350 + 345, 460, 690, 0, 1, rtl, 34,
      { letter: 190, tkH: 50, tkInset: 20, borderA: 0.2, shadows: titlePoShadows(P.hue, 40, 80, -24) });
    var y = 350 + 690 + 40;
    var metaStr = d.kind + " · " + d.meta;
    var yy = titleText(g, d, { x: cx, align: "center", maxW: 920, size: 84, y: y, gap: 0, origMt: 6, origSize: 32, origX: cx, origAlign: "center", metaSize: 32, metaGap: 14, metaStr: metaStr, fa: fa, noWrap: true });
    y = yy + 30;
    titleRow(g, d, y, { size: 34, padX: 30, padY: 16, mini: 46, miniFs: 22, svg: 34, gap: 18 }, { cx: cx }, rtl, fa);
  }

  function titleTw(g, d) {
    var W = 1200, H = 675, fa = d.lang === "fa", rtl = fa, P = posterSpec(d);
    bgGlowsS(g, W, H, [
      [rtl ? -120 : W + 120 - 620, -200, 620, P.col, 0.5],
      [rtl ? W + 120 - 460 : -120, H + 240 - 460, 460, "#2563eb", 0.35]
    ]);
    var pw = 300, ph = 450, left = rtl ? 90 : W - 90 - pw;
    drawPoster(g, P.sp || { h: P.hue }, left + pw / 2, 112 + ph / 2, pw, ph, (4 * Math.PI) / 180, 1, rtl, 26,
      { letter: 124, tkH: 36, tkInset: 14, borderA: 0.2, shadows: titlePoShadows(P.hue, 40, 80, -24) });
    var edge = rtl ? W - 76 : 76, colL = rtl ? W - 76 - 680 : 76, y = 70;
    var chipH = fa ? 55 : 50;
    titleChip(g, d, edge, y, rtl, fa, 20, 21, 22, chipH);
    y += chipH + 20;
    var yy = titleText(g, d, { x: edge, align: rtl ? "right" : "left", maxW: 680, size: 74, y: y, gap: 20, origMt: -6, origSize: 26, origX: colL, origAlign: "left", metaSize: 27, metaGap: 20, metaStr: d.meta, fa: fa });
    y = yy + 20 + 8;
    titleRow(g, d, y, { size: 27, padX: 24, padY: 13, mini: 38, miniFs: 18, svg: 27, gap: 16 }, { edge: edge }, rtl, fa);
    // brand with url
    brandProfile(g, edge, 579, 46, 42, 34, rtl, "t.me/flicksyrobot", 20, null, 12);
  }


  // ---------- recap card ----------
  function chipLabel(g, label, iconName, edge, y, rtl, fa, padX, padY, fs, icon, pos) {
    var chipH = 2 + 2 * padY + Math.max(icon, lineH(g, 800, fs, fa));
    var cw = 2 + 2 * padX + icon + 10 + textWidth(g, label, 800, fs);
    var cx0 = pos ? (pos.cx !== undefined ? pos.cx - cw / 2 : (pos.left !== undefined ? pos.left : pos.right - cw)) : (rtl ? edge - cw : edge);
    rrPath(g, cx0 + 0.5, y + 0.5, cw - 1, chipH - 1, (chipH - 1) / 2);
    g.fillStyle = "rgba(168,85,247,.2)"; g.fill();
    g.strokeStyle = "rgba(168,85,247,.45)"; g.lineWidth = 1; g.stroke();
    var ix = rtl ? cx0 + cw - 1 - padX - icon : cx0 + 1 + padX;
    drawIcon(g, iconName, ix, y + (chipH - icon) / 2, icon, "#e4d9ff", 2.2);
    text(g, label, rtl ? ix - 10 : ix + icon + 10, y, chipH, { weight: 800, size: fs, fill: "#e4d9ff", align: rtl ? "right" : "left" });
    return chipH;
  }

  // avatar + name (with mark) + @username. pos: {edge} or {cx}. returns row height
  function whoRow(g, d, y, c, pos, rtl) {
    var nmH = c.nm * 1.15, unH = lineH(g, 600, c.un, false), blockH = nmH + c.unMt + unH;
    var nameW = textWidth(g, d.name, 800, c.nm) + c.nmGap + c.mk, unW = textWidth(g, d.un, 600, c.un);
    var blockW = Math.max(nameW, unW), rowW = c.av + c.gap + blockW, rowH = Math.max(c.av, blockH);
    var edge = pos.cx !== undefined ? (rtl ? pos.cx + rowW / 2 : pos.cx - rowW / 2) : pos.edge;
    var avX = rtl ? edge - c.av : edge;
    avatarBig(g, avX + c.av / 2, y + rowH / 2, c.av, c.r, d.ini, c.avFs, true);
    var tEdge = rtl ? avX - c.gap : avX + c.av + c.gap, top = y + (rowH - blockH) / 2;
    nameRow(g, d.name, tEdge, top, nmH, c.nm, c.nmGap, c.mk, rtl, c.dy || 0);
    text(g, d.un, rtl ? tEdge - blockW : tEdge, top + nmH + c.unMt, unH, { weight: 600, size: c.un, fill: "#a3a3c4", align: "left", dir: "ltr" });
    return rowH;
  }

  // the big number with its small unit; box = gradient box (x, y, w) or centred with cx
  function heroDraw(g, d, y, size, rtl, pos) {
    var uSize = size * 0.3, gapU = uSize * 0.25;
    var nW = textWidth(g, d.hours, 900, size), uW = textWidth(g, d.unit, 800, uSize), tot = nW + gapU + uW;
    var bx, bw;
    if (pos.cx !== undefined) { bx = pos.cx - tot / 2; bw = tot; } else { bx = pos.x; bw = pos.w; }
    var len = (bw + size) * Math.SQRT1_2 * 1, mx = bx + bw / 2, my = y + size / 2, dd = 0.70710678 * len / 2;
    var gr = g.createLinearGradient(mx - dd, my - dd, mx + dd, my + dd);
    gr.addColorStop(0, "#f3e8ff"); gr.addColorStop(0.38, "#c4a1ff"); gr.addColorStop(1, "#7c7bff");
    g.save();
    g.shadowColor = "rgba(139,92,246,.45)"; g.shadowBlur = 40; g.shadowOffsetY = 10;
    var numX, unitX;
    if (rtl) {
      var right = pos.cx !== undefined ? bx + tot : bx + bw;
      numX = right; unitX = right - nW - gapU;
      text(g, d.hours, numX, y, size, { weight: 900, size: size, fill: gr, align: "right", fixed: true, dy: d.heroDy || 0 });
      text(g, d.unit, unitX, y, size, { weight: 800, size: uSize, fill: gr, align: "right", baseAt: g.__base });
    } else {
      numX = bx; unitX = bx + nW + gapU;
      text(g, d.hours, numX, y, size, { weight: 900, size: size, fill: gr, align: "left", fixed: true, dy: d.heroDy || 0 });
      text(g, d.unit, unitX, y, size, { weight: 800, size: uSize, fill: gr, align: "left", baseAt: g.__base });
    }
    g.restore();
  }

  // a stat box: number (b) over label (small). returns height
  function cellBox(g, v, l, x, y, w, padY, radius, bSize, bLH, sSize, mt, labelFill, fa) {
    var bH = bSize * bLH, sH = lineH(g, 600, sSize, fa), h = 2 + 2 * padY + bH + mt + sH;
    rrPath(g, x + 0.5, y + 0.5, w - 1, h - 1, radius - 0.5);
    g.fillStyle = "rgba(255,255,255,.06)"; g.fill();
    g.strokeStyle = "rgba(255,255,255,.1)"; g.lineWidth = 1; g.stroke();
    text(g, v, x + w / 2, y + 1 + padY, bH, { weight: 800, size: bSize, fill: "#f1f1fb", align: "center", fixed: true });
    text(g, l, x + w / 2, y + 1 + padY + bH + mt, sH, { weight: 600, size: sSize, fill: labelFill, align: "center" });
    return h;
  }

  function tilesRow(g, tiles, x, y, w, gap, rtl, padY, radius, bSize, sSize, mt, fa) {
    var n = tiles.length, cw = (w - (n - 1) * gap) / n, h = 0;
    tiles.forEach(function (t, k) {
      var tx = rtl ? x + w - cw - k * (cw + gap) : x + k * (cw + gap);
      h = cellBox(g, t.v, t.l, tx, y, cw, padY, radius, bSize, 1.1, sSize, mt, "#a3a3c4", fa);
    });
    return h;
  }

  function recapGlows(g, W, H, list) { bgGlows(g, W, H, list); }

  function recapChat(g, d) {
    var W = 1200, H = 630, fa = d.lang === "fa", rtl = fa;
    recapGlows(g, W, H, [
      [rtl ? -120 : W + 120 - 520, -180, 520, "#6d28d9", 0.6],
      [rtl ? W + 100 - 420 : -100, H + 200 - 420, 420, "#2563eb", 0.38],
      [rtl ? W - 200 - 380 : 200, -120, 380, "#db2777", 0.2]
    ]);
    var edge = rtl ? W - 64 : 64, y = 60;
    // period chip at the end side
    chipLabel(g, d.period, "cal", 0, y, rtl, fa, 20, 10, 21, 22, rtl ? { left: 64 } : { right: W - 64 });
    // poster
    var pw = 230, ph = 345, left = rtl ? 96 : W - 96 - pw;
    drawPoster(g, (d.posters || [])[0] || { h: 265 }, left + pw / 2, 132 + ph / 2, pw, ph, (5 * Math.PI) / 180, 1, rtl, 20, { letter: 92, tkH: 28, tkInset: 10 });
    text(g, d.cap, rtl ? 78 + 133 : W - 78 - 133, 500, lineH(g, 700, 19, fa), { weight: 700, size: 19, fill: "#cfcfe8", align: "center" });
    // text column
    var rowH = whoRow(g, d, y, { av: 80, r: 4, avFs: 34, nm: 36, nmGap: 10, mk: 30, un: 20, unMt: 4, gap: 20, dy: 0 }, { edge: edge }, rtl);
    y += rowH + 30;
    heroDraw(g, d, y, 150, rtl, { x: rtl ? edge - 640 : edge, w: 640 });
    y += 150 + 6;
    var lh = lineH(g, 600, 28, fa);
    text(g, d.lbl, edge, y, lh, { weight: 600, size: 28, fill: "#cfcfe8", align: rtl ? "right" : "left" });
    y += lh + 26;
    tilesRow(g, d.tiles.slice(0, 3), rtl ? edge - 640 : edge, y, 640, 14, rtl, 16, 22, 40, 18, 6, fa);
    brandProfile(g, edge, 547, 41, 36, 30, rtl, d.tagline, 16);
  }

  function recapStory(g, d) {
    var W = 1080, H = 1920, fa = d.lang === "fa", rtl = fa, cx = W / 2;
    recapGlows(g, W, H, [
      [-250, -250, 900, "#6d28d9", 0.6],
      [W + 300 - 800, H + 250 - 800, 800, "#2563eb", 0.38],
      [W + 300 - 700, 500, 700, "#db2777", 0.2]
    ]);
    brandProfile(g, 0, 262, 63, 56, 46, rtl, null, 0, cx);
    var y = 336;
    y += chipLabel(g, d.period, "cal", 0, y, rtl, fa, 28, 12, 28, 28, { cx: cx }) + 22;
    y += whoRow(g, d, y, { av: 92, r: 6, avFs: 40, nm: 44, nmGap: 12, mk: 36, un: 26, unMt: 4, gap: 24, dy: 0 }, { cx: cx }, rtl) + 24;
    heroDraw(g, d, y, 196, rtl, { cx: cx });
    y += 196 + 8;
    var lh = lineH(g, 600, 32, fa);
    text(g, d.lbl, cx, y, lh, { weight: 600, size: 32, fill: "#cfcfe8", align: "center" });
    y += lh + 30;
    y += tilesRow(g, d.tiles.slice(0, 3), 80, y, 920, 18, rtl, 22, 30, 62, 24, 8, fa) + 30;
    var ch = lineH(g, 700, 28, fa);
    text(g, d.capStory, cx, y, ch, { weight: 700, size: 28, fill: "#cfcfe8", align: "center" });
    y += ch + 14;
    var ps = d.posters || [], order = [1, 0, 2];
    [0, 1, 2].forEach(function (i) {
      var dd = i - 1, sp = ps[order[i]] || { h: 265 };
      drawPoster(g, sp, 220 + i * 238 + 82.5, y + Math.abs(dd) * 14 + 123.75, 165, 247.5, (dd * 6 * Math.PI) / 180, 1, rtl, 20, { letter: 66, tkH: 30, tkInset: 8 });
    });
  }

  function recapTw(g, d) {
    var W = 1200, H = 675, fa = d.lang === "fa", rtl = fa;
    recapGlows(g, W, H, [
      [rtl ? -100 : W + 100 - 560, -200, 560, "#6d28d9", 0.6],
      [rtl ? W + 120 - 460 : -120, H + 220 - 460, 460, "#2563eb", 0.38],
      [rtl ? W - 200 - 360 : 200, -100, 360, "#db2777", 0.2]
    ]);
    var edge = rtl ? W - 76 : 76;
    var chipH = 2 + 20 + Math.max(22, lineH(g, 800, 22, fa)), whoH = 84, lblH = lineH(g, 600, 30, fa);
    var total = chipH + 24 + whoH + 26 + 190 + 8 + lblH, y = (H - total) / 2;
    chipLabel(g, d.period, "cal", edge, y, rtl, fa, 22, 10, 22, 22);
    y += chipH + 24;
    whoRow(g, d, y, { av: 84, r: 5, avFs: 36, nm: 40, nmGap: 12, mk: 32, un: 22, unMt: 4, gap: 20, dy: 0 }, { edge: edge }, rtl);
    y += 84 + 26;
    heroDraw(g, d, y, 190, rtl, { x: rtl ? edge - 560 : edge, w: 560 });
    y += 190 + 8;
    text(g, d.lbl, edge, y, lblH, { weight: 600, size: 30, fill: "#cfcfe8", align: rtl ? "right" : "left" });
    // grid 2x2
    var gl = rtl ? 72 : W - 72 - 430, cells = d.tiles.slice(0, 3).concat([d.genre]), yy = 90, rowH = 0;
    cells.forEach(function (c, k) {
      var col = k % 2, row = Math.floor(k / 2);
      var x = rtl ? gl + 430 - 206 - col * 224 : gl + col * 224;
      var bSize = k === 3 ? 38 : 56, bLH = k === 3 ? 1.6 : 1.1;
      var h = cellBox(g, c.v, c.l, x, row ? 90 + rowH + 18 : 90, 206, 30, 28, bSize, bLH, 22, 8, "#cfcfe8", fa);
      if (k === 1) rowH = Math.max(rowH, h);
      if (k === 0 || k === 1) rowH = Math.max(rowH, h);
    });
    brandProfile(g, edge, 585, 44, 40, 32, rtl, "t.me/flicksyrobot", 19, null, 12);
  }

  // ---------- public ----------
  function fontsReady(d) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var sample = d.lang === "fa" ? "ذهن‌پیچ‌ها ۱۲۳" : "Abc 123";
    var loads = [];
    [500, 600, 700, 800, 900].forEach(function (w) {
      loads.push(document.fonts.load(w + " 20px Manrope", "Abc 123"));
      loads.push(document.fonts.load(w + " 20px Vazirmatn", sample));
    });
    return Promise.all(loads).catch(function () {});
  }

  FX.cards = {
    toBlob: function (canvas, type, q) {
      return new Promise(function (res) { canvas.toBlob(function (b) { res(b); }, type || "image/jpeg", q || 0.92); });
    },
    render: function (type, data, fmt) {
      return fontsReady(data).then(function () {
        var c = document.createElement("canvas");
        var size = { chat: [1200, 630], story: [1080, 1920], tw: [1200, 675] }[fmt || "chat"];
        c.width = size[0]; c.height = size[1];
        var g = c.getContext("2d");
        if (type === "list" && (fmt || "chat") === "chat") listChat(g, data);
        else if (type === "list" && fmt === "story") listStory(g, data);
        else if (type === "profile" && (fmt || "chat") === "chat") profChat(g, data);
        else if (type === "profile" && fmt === "story") profStory(g, data);
        else if (type === "profile" && fmt === "tw") profTw(g, data);
        else if (type === "title" && (fmt || "chat") === "chat") titleChat(g, data);
        else if (type === "title" && fmt === "story") titleStory(g, data);
        else if (type === "title" && fmt === "tw") titleTw(g, data);
        else if (type === "recap" && (fmt || "chat") === "chat") recapChat(g, data);
        else if (type === "recap" && fmt === "story") recapStory(g, data);
        else if (type === "recap" && fmt === "tw") recapTw(g, data);
        else throw new Error("card not built yet: " + type + "/" + fmt);
        return c;
      });
    }
  };
})();
