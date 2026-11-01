// Comments screen: list (top / newest / friends), write, reply (one level), like, spoiler, edit (5 minutes),
// delete, report and share (link or card). Opens for a title or for one episode.
(function () {
  "use strict";

  var FX = window.FX;
  if (!FX || !window.I18N) return;

  var el = FX.el, clear = FX.clear, button = FX.button;
  var EDIT_MS = 5 * 60 * 1000;
  var BOT_LINK = "https://t.me/flicksyrobot?startapp=";

  var STR = {
    en: {
      cm_title: "Comments", cm_top: "Top", cm_new: "Newest", cm_friends: "Friends",
      cm_ph: "Write a comment…", cm_ph_reply: "Write a reply…", cm_spoiler: "Contains spoilers", cm_send: "Send",
      cm_replying: "Replying to {name}", cm_editing: "Editing your comment", cm_reveal: "Spoiler · tap to reveal",
      cm_like: "Like", cm_reply: "Reply", cm_share: "Share", cm_more: "View {n} more replies", cm_edited: "edited",
      cm_empty: "No comments yet. Be the first!", cm_empty_friends: "None of your friends has commented yet.",
      cm_edit: "Edit", cm_delete: "Delete", cm_report: "Report", cm_delete_ask: "Delete this comment?",
      cm_delete_yes: "Yes, delete", cm_cancel: "Cancel", cm_deleted: "This comment was deleted",
      cm_late: "5 minutes have passed, you can't edit this comment anymore.",
      cm_reported: "Thanks, we'll look into it.", cm_done_deleted: "Comment deleted", cm_saved: "Saved",
      cm_share_link: "Share link", cm_share_card: "Share as card", cm_copy: "Copy link", cm_copied: "Link copied",
      cm_preparing: "Preparing the card…", cm_load_more: "Load more", cm_you: "You",
      cm_fail: "Couldn't do that. Try again.", cm_unavail: "Comments aren't available yet.", cm_not_found: "This comment doesn't exist anymore.",
      cm_share_text: "A comment on {name} · Flicksy"
    },
    fa: {
      cm_title: "نظرات", cm_top: "برترین", cm_new: "جدیدترین", cm_friends: "دوستان",
      cm_ph: "نظرت را بنویس…", cm_ph_reply: "پاسخت را بنویس…", cm_spoiler: "حاوی اسپویلر", cm_send: "ارسال",
      cm_replying: "پاسخ به {name}", cm_editing: "ویرایش نظر", cm_reveal: "اسپویلر · برای دیدن بزن",
      cm_like: "پسندیدن", cm_reply: "پاسخ", cm_share: "اشتراک", cm_more: "دیدن {n} پاسخ دیگر", cm_edited: "ویرایش‌شده",
      cm_empty: "هنوز نظری نیست. اولین نفر باش!", cm_empty_friends: "هنوز هیچ‌کدام از دوستانت نظری ننوشته‌اند.",
      cm_edit: "ویرایش", cm_delete: "حذف", cm_report: "گزارش", cm_delete_ask: "این نظر حذف شود؟",
      cm_delete_yes: "بله، حذف شود", cm_cancel: "انصراف", cm_deleted: "این نظر حذف شده است",
      cm_late: "۵ دقیقه گذشته و دیگر نمی‌توانی این نظر را ویرایش کنی.",
      cm_reported: "ممنون، بررسی می‌کنیم.", cm_done_deleted: "نظر حذف شد", cm_saved: "ذخیره شد",
      cm_share_link: "اشتراک لینک", cm_share_card: "اشتراک به‌صورت کارت", cm_copy: "کپی لینک", cm_copied: "لینک کپی شد",
      cm_preparing: "در حال ساخت کارت…", cm_load_more: "نمایش بیشتر", cm_you: "تو",
      cm_fail: "انجام نشد. دوباره تلاش کن.", cm_unavail: "نظرات هنوز فعال نشده‌اند.", cm_not_found: "این نظر دیگر وجود ندارد.",
      cm_share_text: "یک نظر درباره‌ی {name} · Flicksy"
    }
  };

  function ct(key, params) {
    var table = STR[I18N.lang] || STR.en;
    var text = table[key];
    if (text === undefined) text = STR.en[key];
    if (text === undefined) return key;
    if (params) {
      Object.keys(params).forEach(function (k) { text = text.split("{" + k + "}").join(String(params[k])); });
    }
    return text;
  }

  // ---------- small icons ----------
  var SVG = {
    heart: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
    heartFill: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
    reply: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    share: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M8 7h9v9"/></svg>',
    dots: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
    flag: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22V4M4 4h13l-2 4 2 4H4"/></svg>',
    link: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
    card: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 9h10M7 13h6"/></svg>',
    copy: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>',
    warn: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l10 18H2zM12 10v5M12 18h.01"/></svg>',
    send: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>'
  };

  function svgNode(name, cls) {
    var s = el("span", cls || "cm-i");
    s.innerHTML = SVG[name];
    return s;
  }

  function nf(n) {
    try { return Number(n).toLocaleString(I18N.lang === "fa" ? "fa-IR" : undefined); } catch (e) { return String(n); }
  }

  function ago(at) {
    if (!at) return "";
    var d = new Date(String(at).replace(" ", "T") + "Z");
    if (isNaN(d.getTime())) return "";
    var sec = Math.round((d.getTime() - Date.now()) / 1000);
    if (sec > 0) sec = 0;
    var abs = Math.abs(sec), unit = "second", val = sec;
    if (abs >= 86400) { unit = "day"; val = Math.round(sec / 86400); }
    else if (abs >= 3600) { unit = "hour"; val = Math.round(sec / 3600); }
    else if (abs >= 60) { unit = "minute"; val = Math.round(sec / 60); }
    try { return new Intl.RelativeTimeFormat(I18N.lang, { numeric: "auto" }).format(val, unit); } catch (e) { return d.toLocaleDateString(); }
  }

  function msAge(at) {
    var d = new Date(String(at).replace(" ", "T") + "Z");
    return isNaN(d.getTime()) ? Infinity : Date.now() - d.getTime();
  }

  function avatar(u, cls) {
    if (u.photo_url) {
      var img = el("img", "avatar " + cls);
      img.src = u.photo_url;
      img.alt = "";
      return img;
    }
    return el("div", "avatar " + cls, (u.display_name || "?").charAt(0).toUpperCase());
  }

  function stars(n) {
    var s = "";
    for (var i = 0; i < n; i++) s += "★";
    return s;
  }

  // ---------- the screen ----------
  var page = null;

  function close() {
    if (!page) return;
    var p = page;
    page = null;
    p.root.remove();
    FX.popBack(p.back);
  }

  function scopeQuery(p) {
    var q = "tmdb_id=" + p.ref.tmdb_id + "&type=" + p.ref.media_type;
    if (p.ref.season) q += "&season=" + p.ref.season + "&episode=" + p.ref.episode;
    return q;
  }

  function problemText(res) {
    var e = res && res.data && res.data.error;
    if (e === "comments_unavailable") return ct("cm_unavail");
    if (e === "not_found") return ct("cm_not_found");
    return ct("cm_fail");
  }

  // ref: { tmdb_id, media_type, season?, episode?, title?, focus? }
  function open(ref) {
    if (page) close();
    var root = el("div", "page cpage");
    var p = {
      ref: ref, root: root, back: close, sort: "top", items: [], count: null, more: false, offset: 0,
      status: "loading", pinned: null, reply: null, editing: null, spoiler: false, busy: false
    };
    page = p;
    document.body.appendChild(root);
    FX.pushBack(p.back);
    build(p);
    load(p, false);
    if (ref.focus) loadFocus(p, ref.focus);
  }

  function build(p) {
    var root = p.root;
    clear(root);

    var head = el("div", "cm-head");
    var back = FX.iconButton("round-btn", "back", I18N.t("btn_close"), close);
    back.firstChild.classList.add("flip");
    head.appendChild(back);
    var tt = el("div", "cm-ht");
    p.els = {};
    p.els.title = el("b", "", ct("cm_title"));
    tt.appendChild(p.els.title);
    var sub = p.ref.title || "";
    if (p.ref.season) sub += (sub ? " · " : "") + "S" + p.ref.season + " E" + p.ref.episode;
    if (sub) tt.appendChild(el("small", "", sub));
    head.appendChild(tt);
    root.appendChild(head);

    var tabs = el("div", "cm-tabs");
    p.els.tabs = tabs;
    root.appendChild(tabs);

    p.els.scroll = el("div", "cm-scroll");
    root.appendChild(p.els.scroll);

    buildComposer(p);
    drawTabs(p);
    draw(p);
  }

  function drawTabs(p) {
    clear(p.els.tabs);
    [["top", "cm_top"], ["new", "cm_new"], ["friends", "cm_friends"]].forEach(function (pair) {
      p.els.tabs.appendChild(button("cm-tab" + (p.sort === pair[0] ? " on" : ""), ct(pair[1]), function () {
        if (p.sort === pair[0]) return;
        p.sort = pair[0];
        drawTabs(p);
        load(p, false);
      }));
    });
  }

  function updateCount(p) {
    p.els.title.textContent = ct("cm_title") + (p.count !== null ? " · " + nf(p.count) : "");
  }

  function load(p, append) {
    if (!append) { p.offset = 0; p.status = "loading"; p.items = []; draw(p); }
    var seq = (p.seq = (p.seq || 0) + 1);
    FX.api("/api/comments?" + scopeQuery(p) + "&sort=" + p.sort + "&offset=" + p.offset).then(function (res) {
      if (page !== p || p.seq !== seq) return;
      if (res.status !== 200) { p.status = "error"; p.error = problemText(res); draw(p); return; }
      var list = res.data.comments || [];
      p.items = append ? p.items.concat(list) : list;
      p.offset = p.items.length;
      p.count = res.data.count;
      p.more = !!res.data.more;
      p.status = "ok";
      updateCount(p);
      draw(p);
    }).catch(function () {
      if (page !== p || p.seq !== seq) return;
      p.status = "error";
      p.error = ct("cm_fail");
      draw(p);
    });
  }

  // a shared link: show that one comment (with all its replies) at the top
  function loadFocus(p, id) {
    FX.api("/api/comments?id=" + id).then(function (res) {
      if (page !== p) return;
      if (res.status !== 200 || !res.data.comment) { FX.toast(ct("cm_not_found"), true); return; }
      var c = res.data.comment;
      if (c.parent_id) {
        FX.api("/api/comments?id=" + c.parent_id).then(function (r2) {
          if (page !== p || r2.status !== 200) return;
          pin(p, r2.data.comment, id);
        });
      } else {
        pin(p, c, id);
      }
    }).catch(function () {});
  }

  function pin(p, c, focusId) {
    FX.api("/api/comments?parent=" + c.id).then(function (res) {
      if (page !== p) return;
      c.replies = res.status === 200 ? res.data.comments || [] : [];
      p.pinned = c;
      p.focusId = focusId;
      draw(p);
      setTimeout(function () {
        var n = p.els.scroll.querySelector(".cm-focus");
        if (n && n.scrollIntoView) n.scrollIntoView({ block: "center" });
      }, 60);
    });
  }

  // ---------- drawing ----------
  function draw(p) {
    var box = p.els.scroll;
    clear(box);
    if (p.pinned) {
      var pn = renderComment(p, p.pinned, false);
      pn.classList.add("cm-pin");
      box.appendChild(pn);
    }
    if (p.status === "loading") { box.appendChild(FX.msg(I18N.t("loading"))); return; }
    if (p.status === "error") { box.appendChild(FX.msg(p.error || ct("cm_fail"), true)); return; }
    var shown = 0;
    p.items.forEach(function (c) {
      if (p.pinned && p.pinned.id === c.id) return;
      box.appendChild(renderComment(p, c, false));
      shown++;
    });
    if (!shown && !p.pinned) {
      box.appendChild(el("p", "cm-empty", ct(p.sort === "friends" ? "cm_empty_friends" : "cm_empty")));
    }
    if (p.more) {
      box.appendChild(button("cm-loadmore", ct("cm_load_more"), function () { load(p, true); }));
    }
  }

  function renderComment(p, c, isReply) {
    var row = el("div", "cm" + (isReply ? " cm-r" : "") + (p.focusId === c.id ? " cm-focus" : ""));
    row.appendChild(avatar(c.user, isReply ? "cm-av sm" : "cm-av"));
    var cb = el("div", "cm-b");

    var top = el("div", "cm-top");
    var nm = el("div", "cm-nm");
    var bdi = el("bdi", "", c.mine ? c.user.display_name + " (" + ct("cm_you") + ")" : c.user.display_name);
    nm.appendChild(bdi);
    if (c.rating) nm.appendChild(el("span", "cm-st", stars(c.rating)));
    nm.appendChild(el("small", "", ago(c.created_at) + (c.edited ? " · " + ct("cm_edited") : "")));
    top.appendChild(nm);
    if (!c.deleted) {
      var dots = button("cm-dots", null, function () { openMenu(p, c); });
      dots.setAttribute("aria-label", "menu");
      dots.appendChild(svgNode("dots", "cm-i"));
      top.appendChild(dots);
    }
    cb.appendChild(top);

    if (c.deleted) {
      cb.appendChild(el("p", "cm-tx cm-del", ct("cm_deleted")));
    } else if (c.spoiler && !c.shown) {
      var sp = button("cm-sp", null, function () { c.shown = true; draw(p); });
      sp.appendChild(svgNode("warn", "cm-i"));
      sp.appendChild(el("span", "", ct("cm_reveal")));
      cb.appendChild(sp);
    } else {
      var tx = el("p", "cm-tx", c.body);
      tx.setAttribute("dir", "auto");
      cb.appendChild(tx);
    }

    if (!c.deleted) {
      var ac = el("div", "cm-ac");
      var like = button("cm-act" + (c.liked ? " liked" : ""), null, function () { toggleLike(p, c); });
      like.appendChild(svgNode(c.liked ? "heartFill" : "heart", "cm-i"));
      like.appendChild(el("span", "", nf(c.likes || 0)));
      ac.appendChild(like);
      var rep = button("cm-act", null, function () { startReply(p, c, isReply ? c : c); });
      rep.appendChild(svgNode("reply", "cm-i"));
      rep.appendChild(el("span", "", isReply ? ct("cm_reply") : (c.reply_count ? nf(c.reply_count) : ct("cm_reply"))));
      ac.appendChild(rep);
      var sh = button("cm-act", null, function () { openShare(p, c); });
      sh.appendChild(svgNode("share", "cm-i"));
      sh.appendChild(el("span", "", ct("cm_share")));
      ac.appendChild(sh);
      cb.appendChild(ac);
    }

    if (!isReply && c.replies && c.replies.length) {
      var rp = el("div", "cm-rp");
      c.replies.forEach(function (r) { rp.appendChild(renderComment(p, r, true)); });
      cb.appendChild(rp);
    }
    if (!isReply && c.reply_count > (c.replies ? c.replies.length : 0)) {
      cb.appendChild(button("cm-more", ct("cm_more", { n: nf(c.reply_count - (c.replies ? c.replies.length : 0)) }), function () {
        FX.api("/api/comments?parent=" + c.id).then(function (res) {
          if (page !== p || res.status !== 200) return;
          c.replies = res.data.comments || [];
          draw(p);
        });
      }));
    }

    row.appendChild(cb);
    return row;
  }

  // ---------- actions ----------
  function toggleLike(p, c) {
    c.liked = !c.liked;
    c.likes = Math.max(0, (c.likes || 0) + (c.liked ? 1 : -1));
    FX.haptic();
    draw(p);
    FX.api("/api/comment-like", { method: "PUT", body: { id: c.id, liked: c.liked } }).then(function (res) {
      if (res.status !== 200 && page === p) {
        c.liked = !c.liked;
        c.likes = Math.max(0, c.likes + (c.liked ? 1 : -1));
        draw(p);
        FX.toast(problemText(res), true);
      } else if (res.status === 200) {
        c.likes = res.data.likes;
      }
    }).catch(function () {});
  }

  function startReply(p, c) {
    p.editing = null;
    p.reply = c;
    syncComposer(p);
    p.els.input.focus();
  }

  function sheetRow(sh, cls, iconName, label, handler) {
    var r = button("mi " + cls, null, handler);
    var ic = svgNode(iconName, "cm-mi");
    r.appendChild(ic);
    r.appendChild(el("span", "", label));
    sh.appendChild(r);
  }

  function openMenu(p, c) {
    FX.openSheet(function (sh) {
      if (c.mine) {
        var late = msAge(c.created_at) >= EDIT_MS;
        sheetRow(sh, late ? "cm-off" : "", "pencil", ct("cm_edit"), function () {
          if (msAge(c.created_at) >= EDIT_MS) { FX.toast(ct("cm_late"), true); return; }
          FX.closeSheet();
          startEdit(p, c);
        });
        sheetRow(sh, "", "trash", ct("cm_delete"), function () { confirmDelete(p, c); });
      } else {
        sheetRow(sh, "cm-bad", "flag", ct("cm_report"), function () {
          FX.closeSheet();
          FX.api("/api/comment-report", { method: "POST", body: { id: c.id } }).then(function (res) {
            FX.toast(res.status === 200 ? ct("cm_reported") : problemText(res), res.status !== 200);
          }).catch(function () { FX.toast(ct("cm_fail"), true); });
        });
      }
    });
  }

  function confirmDelete(p, c) {
    FX.openSheet(function (sh) {
      sh.appendChild(el("h3", "sheet-title", ct("cm_delete_ask")));
      sheetRow(sh, "cm-bad", "trash", ct("cm_delete_yes"), function () {
        FX.closeSheet();
        FX.api("/api/comments?id=" + c.id, { method: "DELETE" }).then(function (res) {
          if (res.status !== 200) { FX.toast(problemText(res), true); return; }
          removeLocal(p, c);
          FX.toast(ct("cm_done_deleted"));
        }).catch(function () { FX.toast(ct("cm_fail"), true); });
      });
      sheetRow(sh, "", "copy", ct("cm_cancel"), function () { FX.closeSheet(); });
    });
  }

  function removeLocal(p, c) {
    function strip(list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === c.id) {
          if (list[i].reply_count > 0 && !list[i].parent_id) { list[i].deleted = true; list[i].body = ""; }
          else { list.splice(i, 1); }
          return true;
        }
        if (list[i].replies && strip(list[i].replies)) {
          list[i].reply_count = Math.max(0, (list[i].reply_count || 1) - 1);
          return true;
        }
      }
      return false;
    }
    strip(p.items);
    if (p.pinned) {
      if (p.pinned.id === c.id) p.pinned = null; else strip([p.pinned]);
    }
    if (p.count !== null) p.count = Math.max(0, p.count - 1);
    updateCount(p);
    draw(p);
  }

  function startEdit(p, c) {
    p.reply = null;
    p.editing = c;
    p.spoiler = !!c.spoiler;
    p.els.input.value = c.body;
    syncComposer(p);
    p.els.input.focus();
  }

  // ---------- share ----------
  function linkOf(c) { return BOT_LINK + "comment-" + c.id; }

  function copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      }
    } catch (e) {}
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand("copy");
        ta.remove();
        if (ok) resolve(); else reject();
      } catch (e) { reject(e); }
    });
  }

  function shareLink(p, c) {
    var link = linkOf(c);
    var url = "https://t.me/share/url?url=" + encodeURIComponent(link) + "&text=" + encodeURIComponent(ct("cm_share_text", { name: p.ref.title || "Flicksy" }));
    try {
      var tg = window.Telegram && Telegram.WebApp;
      if (tg && tg.openTelegramLink) { tg.openTelegramLink(url); return; }
    } catch (e) {}
    window.open(url, "_blank");
  }

  function shareCard(p, c) {
    var tg = window.Telegram && Telegram.WebApp;
    var can = false;
    try { can = !!(tg && tg.shareMessage && tg.isVersionAtLeast && tg.isVersionAtLeast("8.0")); } catch (e) {}
    if (!can) { shareLink(p, c); return; }
    FX.toast(ct("cm_preparing"));
    FX.api("/api/comment-share", { method: "POST", body: { id: c.id, lang: I18N.lang } }).then(function (res) {
      if (res.status === 200 && res.data && res.data.id) {
        try { tg.shareMessage(res.data.id); return; } catch (e) {}
      }
      shareLink(p, c);
    }).catch(function () { shareLink(p, c); });
  }

  function openShare(p, c) {
    FX.openSheet(function (sh) {
      sheetRow(sh, "", "link", ct("cm_share_link"), function () { FX.closeSheet(); shareLink(p, c); });
      sheetRow(sh, "", "card", ct("cm_share_card"), function () { FX.closeSheet(); shareCard(p, c); });
      sheetRow(sh, "", "copy", ct("cm_copy"), function () {
        FX.closeSheet();
        copyText(linkOf(c)).then(function () { FX.haptic(); FX.toast(ct("cm_copied")); }, function () { FX.toast(linkOf(c)); });
      });
    });
  }

  // ---------- composer ----------
  function buildComposer(p) {
    var comp = el("div", "cm-comp");
    p.els.ctx = el("div", "cm-ctx hidden");
    comp.appendChild(p.els.ctx);

    var input = document.createElement("textarea");
    input.className = "cm-in";
    input.rows = 1;
    input.maxLength = 1000;
    input.setAttribute("dir", "auto");
    input.placeholder = ct("cm_ph");
    input.addEventListener("input", function () {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
    });
    p.els.input = input;
    comp.appendChild(input);

    var bar = el("div", "cm-cr");
    var tg = button("cm-tg", null, function () {
      p.spoiler = !p.spoiler;
      syncComposer(p);
    });
    tg.appendChild(el("span", "cm-sw"));
    tg.appendChild(el("span", "", ct("cm_spoiler")));
    p.els.tg = tg;
    bar.appendChild(tg);
    var send = button("cm-send", null, function () { submit(p); });
    send.appendChild(el("span", "", ct("cm_send")));
    send.appendChild(svgNode("send", "cm-i"));
    p.els.send = send;
    bar.appendChild(send);
    comp.appendChild(bar);

    p.root.appendChild(comp);
    syncComposer(p);
  }

  function syncComposer(p) {
    var ctx = p.els.ctx;
    clear(ctx);
    if (p.reply || p.editing) {
      ctx.classList.remove("hidden");
      var label = p.editing ? ct("cm_editing") : ct("cm_replying", { name: p.reply.user.display_name });
      ctx.appendChild(el("span", "", label));
      ctx.appendChild(button("cm-x", "✕", function () {
        p.reply = null;
        if (p.editing) { p.editing = null; p.els.input.value = ""; p.els.input.style.height = "auto"; p.spoiler = false; }
        syncComposer(p);
      }));
    } else {
      ctx.classList.add("hidden");
    }
    p.els.input.placeholder = ct(p.reply ? "cm_ph_reply" : "cm_ph");
    p.els.tg.classList.toggle("on", !!p.spoiler);
  }

  function submit(p) {
    if (p.busy) return;
    var text = p.els.input.value.trim();
    if (!text) return;
    p.busy = true;
    p.els.send.classList.add("busy");

    function done() { p.busy = false; p.els.send.classList.remove("busy"); }
    function reset() {
      p.els.input.value = "";
      p.els.input.style.height = "auto";
      p.reply = null;
      p.editing = null;
      p.spoiler = false;
      syncComposer(p);
    }

    if (p.editing) {
      var ed = p.editing;
      FX.api("/api/comments", { method: "PUT", body: { id: ed.id, body: text, spoiler: p.spoiler } }).then(function (res) {
        done();
        if (res.status === 403 && res.data && res.data.error === "edit_expired") { FX.toast(ct("cm_late"), true); reset(); return; }
        if (res.status !== 200 || !res.data.comment) { FX.toast(problemText(res), true); return; }
        var n = res.data.comment;
        ed.body = n.body; ed.spoiler = n.spoiler; ed.edited = true; ed.shown = false;
        reset();
        FX.toast(ct("cm_saved"));
        draw(p);
      }).catch(function () { done(); FX.toast(ct("cm_fail"), true); });
      return;
    }

    var body = { body: text, spoiler: p.spoiler };
    if (p.reply) body.parent_id = p.reply.parent_id || p.reply.id;
    else {
      body.tmdb_id = p.ref.tmdb_id;
      body.type = p.ref.media_type;
      if (p.ref.season) { body.season = p.ref.season; body.episode = p.ref.episode; }
    }
    var target = p.reply;
    FX.api("/api/comments", { method: "POST", body: body }).then(function (res) {
      done();
      if (res.status !== 200 || !res.data.comment) {
        FX.toast(res.status === 429 ? I18N.t("err_rate") : problemText(res), true);
        return;
      }
      var c = res.data.comment;
      c.shown = true;
      if (target) {
        var rootId = target.parent_id || target.id;
        var root = findRoot(p, rootId);
        if (root) {
          // make sure all earlier replies are there first
          if (!root.replies) root.replies = [];
          root.replies.push(c);
          root.reply_count = (root.reply_count || 0) + 1;
        }
      } else {
        p.items.unshift(c);
      }
      if (p.count !== null) p.count += 1;
      updateCount(p);
      reset();
      draw(p);
      if (!target) p.els.scroll.scrollTop = 0;
    }).catch(function () { done(); FX.toast(ct("cm_fail"), true); });
  }

  function findRoot(p, id) {
    if (p.pinned && p.pinned.id === id) return p.pinned;
    for (var i = 0; i < p.items.length; i++) if (p.items[i].id === id) return p.items[i];
    return null;
  }

  // ---------- public ----------
  FX.openComments = open;
  FX.openCommentById = function (id) {
    FX.api("/api/comments?id=" + id).then(function (res) {
      if (res.status !== 200 || !res.data.comment || !res.data.title) { FX.toast(ct("cm_not_found"), true); return; }
      var c = res.data.comment, t = res.data.title;
      open({
        tmdb_id: t.tmdb_id, media_type: t.media_type, title: t.title,
        season: c.season || null, episode: c.episode || null, focus: id
      });
    }).catch(function () { FX.toast(ct("cm_fail"), true); });
  };
})();
