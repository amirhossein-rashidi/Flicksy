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
      act_empty: "Activity from people you follow, and the leaderboard, are coming soon.",
      pf_share: "Share profile",
      pf_yir: "Year in review",
      pf_soon: "Coming soon",
      pf_lists: "Lists",
      pf_myact: "My activity",
      pf_act_empty: "Titles you mark as watched, watching or rated will show up here.",
      pf_share_text: "{name} on Flicksy — follow me to see what I watch",
      pf_more: "Tap to show more",
      pf_less: "Tap to show less",
      ep_n: "New episode of {name} is out · {ep}",
      disc_start: "Start typing to search titles and people"
    },
    fa: {
      nav_activity: "فعالیت",
      home_sub: "امشب چی ببینیم؟",
      act_title: "فعالیت",
      act_following: "دنبال‌شده‌ها",
      act_board: "لیدربرد",
      act_empty: "فعالیت کسانی که دنبال می‌کنی و لیدربرد به‌زودی اینجا می‌آید.",
      pf_share: "اشتراک‌گذاری پروفایل",
      pf_yir: "خلاصهٔ سال",
      pf_soon: "به‌زودی",
      pf_lists: "لیست‌ها",
      pf_myact: "فعالیت من",
      pf_act_empty: "فیلم‌ها و سریال‌هایی که دیده‌ای، در حال دیدنشان هستی یا امتیاز داده‌ای اینجا می‌آیند.",
      pf_share_text: "{name} در Flicksy — دنبالم کن تا ببینی چی می‌بینم",
      pf_more: "برای دیدن بیشتر بزن",
      pf_less: "برای دیدن کمتر بزن",
      ep_n: "قسمت جدید {name} منتشر شد · {ep}",
      disc_start: "برای جستجوی فیلم، سریال و افراد شروع به نوشتن کن"
    },
    ar: {
      nav_activity: "النشاط",
      home_sub: "ماذا سنشاهد الليلة؟",
      act_title: "النشاط",
      act_following: "المتابَعون",
      act_board: "المتصدرون",
      act_empty: "نشاط من تتابعهم ولوحة المتصدرين قريباً هنا.",
      pf_share: "مشاركة الملف الشخصي",
      pf_yir: "ملخص العام",
      pf_soon: "قريباً",
      pf_lists: "القوائم",
      pf_myact: "نشاطي",
      pf_act_empty: "الأفلام والمسلسلات التي تشاهدها أو قيّمتها ستظهر هنا.",
      pf_share_text: "{name} على Flicksy — تابعني لتعرف ما أشاهده",
      pf_more: "اضغط لعرض المزيد",
      pf_less: "اضغط لعرض أقل",
      ep_n: "صدرت حلقة جديدة من {name} · {ep}",
      disc_start: "ابدأ الكتابة للبحث عن الأفلام والمسلسلات والأشخاص"
    },
    tr: {
      nav_activity: "Etkinlik",
      home_sub: "Bu akşam ne izleyelim?",
      act_title: "Etkinlik",
      act_following: "Takip ettiklerin",
      act_board: "Liderlik tablosu",
      act_empty: "Takip ettiklerinin etkinliği ve liderlik tablosu çok yakında burada.",
      pf_share: "Profili paylaş",
      pf_yir: "Yılın özeti",
      pf_soon: "Yakında",
      pf_lists: "Listeler",
      pf_myact: "Etkinliğim",
      pf_act_empty: "İzlediğin, izlemekte olduğun veya puanladığın yapımlar burada görünür.",
      pf_share_text: "{name} Flicksy'de — ne izlediğimi görmek için beni takip et",
      pf_more: "Daha fazlasını göstermek için dokun",
      pf_less: "Daha azını göstermek için dokun",
      ep_n: "{name} dizisinin yeni bölümü yayında · {ep}",
      disc_start: "Yapımları ve kişileri aramak için yazmaya başla"
    },
    ru: {
      nav_activity: "Активность",
      home_sub: "Что посмотрим сегодня вечером?",
      act_title: "Активность",
      act_following: "Подписки",
      act_board: "Рейтинг",
      act_empty: "Активность тех, на кого вы подписаны, и рейтинг скоро появятся здесь.",
      pf_share: "Поделиться профилем",
      pf_yir: "Итоги года",
      pf_soon: "Скоро",
      pf_lists: "Списки",
      pf_myact: "Моя активность",
      pf_act_empty: "Здесь появятся фильмы и сериалы, которые ты смотришь, посмотрел или оценил.",
      pf_share_text: "{name} в Flicksy — подписывайся, чтобы видеть, что я смотрю",
      pf_more: "Нажми, чтобы показать ещё",
      pf_less: "Нажми, чтобы свернуть",
      ep_n: "Вышла новая серия «{name}» · {ep}",
      disc_start: "Начни вводить, чтобы искать фильмы, сериалы и людей"
    },
    es: {
      nav_activity: "Actividad",
      home_sub: "¿Qué vemos esta noche?",
      act_title: "Actividad",
      act_following: "Siguiendo",
      act_board: "Clasificación",
      act_empty: "La actividad de quienes sigues y la clasificación llegarán pronto.",
      pf_share: "Compartir perfil",
      pf_yir: "Resumen del año",
      pf_soon: "Próximamente",
      pf_lists: "Listas",
      pf_myact: "Mi actividad",
      pf_act_empty: "Aquí aparecerán los títulos que veas, estés viendo o puntúes.",
      pf_share_text: "{name} en Flicksy — sígueme para ver lo que veo",
      pf_more: "Toca para ver más",
      pf_less: "Toca para ver menos",
      ep_n: "Ya está disponible un nuevo episodio de {name} · {ep}",
      disc_start: "Empieza a escribir para buscar títulos y personas"
    },
    fr: {
      nav_activity: "Activité",
      home_sub: "On regarde quoi ce soir ?",
      act_title: "Activité",
      act_following: "Abonnements",
      act_board: "Classement",
      act_empty: "L’activité de tes abonnements et le classement arrivent bientôt.",
      pf_share: "Partager le profil",
      pf_yir: "Bilan de l’année",
      pf_soon: "Bientôt disponible",
      pf_lists: "Listes",
      pf_myact: "Mon activité",
      pf_act_empty: "Les titres que tu regardes, as vus ou notés apparaîtront ici.",
      pf_share_text: "{name} sur Flicksy — suis-moi pour voir ce que je regarde",
      pf_more: "Touche pour en voir plus",
      pf_less: "Touche pour en voir moins",
      ep_n: "Un nouvel épisode de {name} est disponible · {ep}",
      disc_start: "Commence à taper pour chercher des titres et des personnes"
    },
    de: {
      nav_activity: "Aktivität",
      home_sub: "Was schauen wir heute Abend?",
      act_title: "Aktivität",
      act_following: "Folge ich",
      act_board: "Rangliste",
      act_empty: "Aktivitäten der Personen, denen du folgst, und die Rangliste kommen bald.",
      pf_share: "Profil teilen",
      pf_yir: "Jahresrückblick",
      pf_soon: "Demnächst",
      pf_lists: "Listen",
      pf_myact: "Meine Aktivität",
      pf_act_empty: "Filme und Serien, die du schaust, gesehen oder bewertet hast, erscheinen hier.",
      pf_share_text: "{name} auf Flicksy — folge mir, um zu sehen, was ich schaue",
      pf_more: "Tippe, um mehr zu sehen",
      pf_less: "Tippe, um weniger zu sehen",
      ep_n: "Neue Folge von {name} ist da · {ep}",
      disc_start: "Tippe los, um Titel und Personen zu suchen"
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
