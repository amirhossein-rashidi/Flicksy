// Settings > Notifications: for each kind (replies, likes, new followers) one switch for the bell in the app
// and one for messages in the bot chat, plus one master switch for the bot.
(function () {
  "use strict";

  var FX = window.FX;
  if (!FX || !window.I18N) return;
  var el = FX.el, clear = FX.clear, button = FX.button;

  var STR = {
    en: {
      nf_title: "Notifications", nf_app: "In app", nf_bot: "Bot",
      nf_reply: "Replies", nf_reply_s: "Someone answers your comment",
      nf_like: "Likes", nf_like_s: "Someone likes your comment",
      nf_follow: "New followers", nf_follow_s: "Follows and follow requests",
      nf_list_follow: "List followers", nf_list_follow_s: "Someone follows your list",
      nf_bot_h: "Bot messages", nf_bot_all: "Send notifications to the bot chat", nf_bot_all_s: "Turn off to stop all bot messages",
      nf_fail: "Couldn't save. Try again.", nf_unavail: "Notification settings aren't available yet."
    },
    fa: {
      nf_title: "اعلان‌ها", nf_app: "در اپ", nf_bot: "ربات",
      nf_reply: "پاسخ‌ها", nf_reply_s: "کسی به نظرت پاسخ می‌دهد",
      nf_like: "لایک‌ها", nf_like_s: "کسی نظرت را می‌پسندد",
      nf_follow: "دنبال‌کننده‌ی جدید", nf_follow_s: "دنبال‌کردن و درخواست دنبال‌کردن",
      nf_list_follow: "دنبال‌کننده‌ی لیست", nf_list_follow_s: "کسی لیستت را دنبال می‌کند",
      nf_bot_h: "پیام‌های ربات", nf_bot_all: "ارسال اعلان‌ها به چت ربات", nf_bot_all_s: "خاموش کنی هیچ پیامی به ربات نمی‌آید",
      nf_fail: "ذخیره نشد. دوباره تلاش کن.", nf_unavail: "تنظیمات اعلان هنوز فعال نشده است."
    }
  };

  function nt(key) {
    var table = STR[I18N.lang] || STR.en;
    var text = table[key];
    if (text === undefined) text = STR.en[key];
    return text === undefined ? key : text;
  }

  var ROWS = [["reply", "nf_reply", "nf_reply_s"], ["like", "nf_like", "nf_like_s"], ["follow", "nf_follow", "nf_follow_s"], ["list_follow", "nf_list_follow", "nf_list_follow_s"]];

  function sw(on, handler) {
    var b = button("nf-sw" + (on ? " on" : ""), null, function () {
      var next = !b.classList.contains("on");
      b.classList.toggle("on", next);
      handler(next, function () { b.classList.toggle("on", !next); });
    });
    b.setAttribute("role", "switch");
    b.setAttribute("aria-checked", on ? "true" : "false");
    b.appendChild(el("i"));
    return b;
  }

  function save(patch, undo) {
    FX.api("/api/notif-prefs", { method: "PUT", body: patch }).then(function (res) {
      if (res.status !== 200) {
        undo();
        FX.toast(res.status === 503 ? nt("nf_unavail") : nt("nf_fail"), true);
      }
    }).catch(function () { undo(); FX.toast(nt("nf_fail"), true); });
  }

  function openPrefs() {
    FX.openPage(nt("nf_title"), function (sh) {
      var box = el("div", "nf");
      box.style.marginTop = "14px";
      sh.appendChild(box);
      box.appendChild(FX.msg(I18N.t("loading")));
      FX.api("/api/notif-prefs").then(function (res) {
        clear(box);
        if (res.status !== 200) { box.appendChild(FX.msg(nt("nf_fail"), true)); return; }
        var p = res.data;
        var head = el("div", "nf-row nf-head");
        head.appendChild(el("span", "nf-t"));
        head.appendChild(el("span", "nf-c", nt("nf_app")));
        head.appendChild(el("span", "nf-c", nt("nf_bot")));
        box.appendChild(head);
        ROWS.forEach(function (r) {
          var row = el("div", "nf-row");
          var t = el("div", "nf-t");
          t.appendChild(el("b", "", nt(r[1])));
          t.appendChild(el("small", "", nt(r[2])));
          row.appendChild(t);
          ["app", "bot"].forEach(function (kind) {
            var key = r[0] + "_" + kind;
            var cell = el("span", "nf-c");
            cell.appendChild(sw(!!p[key], function (v, undo) { var o = {}; o[key] = v; p[key] = v; save(o, undo); }));
            row.appendChild(cell);
          });
          box.appendChild(row);
        });
        box.appendChild(el("div", "nf-sec", nt("nf_bot_h")));
        var all = el("div", "nf-row");
        var at = el("div", "nf-t");
        at.appendChild(el("b", "", nt("nf_bot_all")));
        at.appendChild(el("small", "", nt("nf_bot_all_s")));
        all.appendChild(at);
        var ac = el("span", "nf-c");
        ac.appendChild(sw(!!p.bot_all, function (v, undo) { p.bot_all = v; save({ bot_all: v }, undo); }));
        all.appendChild(ac);
        box.appendChild(all);
      }).catch(function () { clear(box); box.appendChild(FX.msg(nt("nf_fail"), true)); });
    });
  }

  FX.settingsItems.notifs = {
    iconNode: function () { return FX.icon("bell", 20); },
    label: function () { return nt("nf_title"); },
    open: function () { openPrefs(); }
  };
})();
