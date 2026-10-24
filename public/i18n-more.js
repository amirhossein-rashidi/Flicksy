// Extra texts (rating sheet). Loaded after i18n.js: it adds these keys to I18N.t without touching i18n.js.
(function () {
  if (!window.I18N) return;

  var EXTRA = {
    en: {
      rate_title: "How was it?",
      rate_locked: "You can rate it after you've watched it.",
      rate_feel: "How did it feel?",
      rate_actor: "Favorite actor",
      rate_actor_hint: "Tap an actor to pick your favorite."
    },
    fa: {
      rate_title: "چطور بود؟",
      rate_locked: "بعد از دیدن می‌توانی امتیاز بدهی.",
      rate_feel: "چه حسی داشت؟",
      rate_actor: "بازیگر مورد علاقه",
      rate_actor_hint: "روی یک بازیگر بزن تا انتخابش کنی."
    },
    ar: {
      rate_title: "كيف كان؟",
      rate_locked: "يمكنك التقييم بعد المشاهدة.",
      rate_feel: "ما شعورك تجاهه؟",
      rate_actor: "الممثل المفضل",
      rate_actor_hint: "اضغط على ممثل لاختياره."
    },
    tr: {
      rate_title: "Nasıldı?",
      rate_locked: "İzledikten sonra puan verebilirsin.",
      rate_feel: "Nasıl hissettirdi?",
      rate_actor: "Favori oyuncu",
      rate_actor_hint: "Favorini seçmek için bir oyuncuya dokun."
    },
    ru: {
      rate_title: "Как вам?",
      rate_locked: "Оценить можно после просмотра.",
      rate_feel: "Какие эмоции?",
      rate_actor: "Любимый актёр",
      rate_actor_hint: "Нажмите на актёра, чтобы выбрать."
    },
    es: {
      rate_title: "¿Qué tal estuvo?",
      rate_locked: "Podrás puntuarla después de verla.",
      rate_feel: "¿Qué sentiste?",
      rate_actor: "Actor favorito",
      rate_actor_hint: "Toca un actor para elegir a tu favorito."
    },
    fr: {
      rate_title: "Alors, c'était comment ?",
      rate_locked: "Tu pourras la noter après l'avoir vue.",
      rate_feel: "Quelle émotion ?",
      rate_actor: "Acteur préféré",
      rate_actor_hint: "Touche un acteur pour choisir ton préféré."
    },
    de: {
      rate_title: "Wie war's?",
      rate_locked: "Bewerten kannst du nach dem Anschauen.",
      rate_feel: "Wie hat es sich angefühlt?",
      rate_actor: "Lieblingsdarsteller",
      rate_actor_hint: "Tippe auf einen Darsteller, um ihn auszuwählen."
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
