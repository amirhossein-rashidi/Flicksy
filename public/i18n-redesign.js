// Texts for the new look (Activity tab, home greeting). Loaded after i18n.js and i18n-more.js: it adds these keys to I18N.t.
(function () {
  if (!window.I18N) return;

  var EXTRA = {
    en: {
      nav_activity: "Activity",
      home_sub: "What shall we watch tonight?",
      act_title: "Activity",
      act_following: "Following",
      act_board: "Leaderboard",
      act_empty: "Activity from people you follow, and the leaderboard, are coming soon."
    },
    fa: {
      nav_activity: "فعالیت",
      home_sub: "امشب چی ببینیم؟",
      act_title: "فعالیت",
      act_following: "دنبال‌شده‌ها",
      act_board: "لیدربرد",
      act_empty: "فعالیت کسانی که دنبال می‌کنی و لیدربرد به‌زودی اینجا می‌آید."
    },
    ar: {
      nav_activity: "النشاط",
      home_sub: "ماذا سنشاهد الليلة؟",
      act_title: "النشاط",
      act_following: "المتابَعون",
      act_board: "المتصدرون",
      act_empty: "نشاط من تتابعهم ولوحة المتصدرين قريباً هنا."
    },
    tr: {
      nav_activity: "Etkinlik",
      home_sub: "Bu akşam ne izleyelim?",
      act_title: "Etkinlik",
      act_following: "Takip ettiklerin",
      act_board: "Liderlik tablosu",
      act_empty: "Takip ettiklerinin etkinliği ve liderlik tablosu çok yakında burada."
    },
    ru: {
      nav_activity: "Активность",
      home_sub: "Что посмотрим сегодня вечером?",
      act_title: "Активность",
      act_following: "Подписки",
      act_board: "Рейтинг",
      act_empty: "Активность тех, на кого вы подписаны, и рейтинг скоро появятся здесь."
    },
    es: {
      nav_activity: "Actividad",
      home_sub: "¿Qué vemos esta noche?",
      act_title: "Actividad",
      act_following: "Siguiendo",
      act_board: "Clasificación",
      act_empty: "La actividad de quienes sigues y la clasificación llegarán pronto."
    },
    fr: {
      nav_activity: "Activité",
      home_sub: "On regarde quoi ce soir ?",
      act_title: "Activité",
      act_following: "Abonnements",
      act_board: "Classement",
      act_empty: "L’activité de tes abonnements et le classement arrivent bientôt."
    },
    de: {
      nav_activity: "Aktivität",
      home_sub: "Was schauen wir heute Abend?",
      act_title: "Aktivität",
      act_following: "Folge ich",
      act_board: "Rangliste",
      act_empty: "Aktivitäten der Personen, denen du folgst, und die Rangliste kommen bald."
    }
  };

  var base = window.I18N.t;
  window.I18N.t = function (key, params) {
    var table = EXTRA[window.I18N.lang];
    var text = table ? table[key] : undefined;
    if (text === undefined) text = EXTRA.en[key];
    if (text === undefined) return base.call(window.I18N, key, params);
    if (params) {
      Object.keys(params).forEach(function (k) {
        text = text.split("{" + k + "}").join(String(params[k]));
      });
    }
    return text;
  };
})();
