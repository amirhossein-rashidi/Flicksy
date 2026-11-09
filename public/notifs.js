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
    },
    ar: {
      nf_title: "الإشعارات",
      nf_app: "في التطبيق",
      nf_bot: "البوت",
      nf_reply: "الردود",
      nf_reply_s: "عندما يردّ أحد على تعليقك",
      nf_like: "الإعجابات",
      nf_like_s: "عندما يعجبه أحد تعليقك",
      nf_follow: "متابعون جدد",
      nf_follow_s: "المتابعات وطلبات المتابعة",
      nf_list_follow: "متابعو القوائم",
      nf_list_follow_s: "عندما يتابع أحد قائمتك",
      nf_bot_h: "رسائل البوت",
      nf_bot_all: "أرسل الإشعارات إلى محادثة البوت",
      nf_bot_all_s: "أوقفه لإيقاف كل رسائل البوت",
      nf_fail: "تعذّر الحفظ. حاول مجدداً.",
      nf_unavail: "إعدادات الإشعارات غير متاحة بعد."
    },
    tr: {
      nf_title: "Bildirimler",
      nf_app: "Uygulamada",
      nf_bot: "Bot",
      nf_reply: "Yanıtlar",
      nf_reply_s: "Biri yorumuna yanıt verince",
      nf_like: "Beğeniler",
      nf_like_s: "Biri yorumunu beğenince",
      nf_follow: "Yeni takipçiler",
      nf_follow_s: "Takipler ve takip istekleri",
      nf_list_follow: "Liste takipçileri",
      nf_list_follow_s: "Biri listeni takip edince",
      nf_bot_h: "Bot mesajları",
      nf_bot_all: "Bildirimleri bot sohbetine gönder",
      nf_bot_all_s: "Tüm bot mesajlarını durdurmak için kapat",
      nf_fail: "Kaydedilemedi. Tekrar dene.",
      nf_unavail: "Bildirim ayarları henüz kullanılamıyor."
    },
    ru: {
      nf_title: "Уведомления",
      nf_app: "В приложении",
      nf_bot: "Бот",
      nf_reply: "Ответы",
      nf_reply_s: "Кто-то отвечает на твой комментарий",
      nf_like: "Лайки",
      nf_like_s: "Кому-то нравится твой комментарий",
      nf_follow: "Новые подписчики",
      nf_follow_s: "Подписки и запросы на подписку",
      nf_list_follow: "Подписчики списков",
      nf_list_follow_s: "Кто-то подписался на твой список",
      nf_bot_h: "Сообщения бота",
      nf_bot_all: "Присылать уведомления в чат с ботом",
      nf_bot_all_s: "Выключи, чтобы бот ничего не присылал",
      nf_fail: "Не удалось сохранить. Попробуй ещё раз.",
      nf_unavail: "Настройки уведомлений пока недоступны."
    },
    es: {
      nf_title: "Notificaciones",
      nf_app: "En la app",
      nf_bot: "Bot",
      nf_reply: "Respuestas",
      nf_reply_s: "Alguien responde a tu comentario",
      nf_like: "Me gusta",
      nf_like_s: "A alguien le gusta tu comentario",
      nf_follow: "Nuevos seguidores",
      nf_follow_s: "Seguidores y solicitudes de seguimiento",
      nf_list_follow: "Seguidores de listas",
      nf_list_follow_s: "Alguien sigue tu lista",
      nf_bot_h: "Mensajes del bot",
      nf_bot_all: "Enviar notificaciones al chat del bot",
      nf_bot_all_s: "Desactívalo para parar todos los mensajes del bot",
      nf_fail: "No se pudo guardar. Inténtalo de nuevo.",
      nf_unavail: "Los ajustes de notificaciones aún no están disponibles."
    },
    fr: {
      nf_title: "Notifications",
      nf_app: "Dans l'appli",
      nf_bot: "Bot",
      nf_reply: "Réponses",
      nf_reply_s: "Quelqu'un répond à ton commentaire",
      nf_like: "J'aime",
      nf_like_s: "Quelqu'un aime ton commentaire",
      nf_follow: "Nouveaux abonnés",
      nf_follow_s: "Abonnements et demandes d'abonnement",
      nf_list_follow: "Abonnés aux listes",
      nf_list_follow_s: "Quelqu'un suit ta liste",
      nf_bot_h: "Messages du bot",
      nf_bot_all: "Envoyer les notifications dans le chat du bot",
      nf_bot_all_s: "Désactive pour arrêter tous les messages du bot",
      nf_fail: "Impossible d'enregistrer. Réessaie.",
      nf_unavail: "Les réglages de notifications ne sont pas encore disponibles."
    },
    de: {
      nf_title: "Benachrichtigungen",
      nf_app: "In der App",
      nf_bot: "Bot",
      nf_reply: "Antworten",
      nf_reply_s: "Jemand antwortet auf deinen Kommentar",
      nf_like: "Likes",
      nf_like_s: "Jemandem gefällt dein Kommentar",
      nf_follow: "Neue Follower",
      nf_follow_s: "Follower und Folgeanfragen",
      nf_list_follow: "Listen-Follower",
      nf_list_follow_s: "Jemand folgt deiner Liste",
      nf_bot_h: "Bot-Nachrichten",
      nf_bot_all: "Benachrichtigungen an den Bot-Chat senden",
      nf_bot_all_s: "Ausschalten, um alle Bot-Nachrichten zu stoppen",
      nf_fail: "Speichern fehlgeschlagen. Versuch es nochmal.",
      nf_unavail: "Die Benachrichtigungseinstellungen sind noch nicht verfügbar."
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
