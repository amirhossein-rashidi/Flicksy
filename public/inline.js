(function () {
  "use strict";

  var FX = window.FX;
  if (!FX || !window.I18N) return;

  var el = FX.el, clear = FX.clear, button = FX.button;

  // ---------- texts (8 languages; English is the fallback) ----------
  var STR = {
    en: {
      id_title: "Your Flicksy ID",
      id_hint: "Friends can type @flicksyrobot {id} in any chat to send your Public lists. Typing just @flicksyrobot lets you send any of your own lists.",
      id_copy: "Copy", id_copied: "Copied",
      id_visible: "Let people find my Public lists by ID",
      id_visible_off: "Hidden: nobody can find your lists with your ID."
    },
    fa: {
      id_title: "آیدی Flicksy تو",
      id_hint: "دوستانت می‌توانند در هر چت بنویسند @flicksyrobot {id} تا لیست‌های عمومی تو را بفرستند. اگر فقط @flicksyrobot را بنویسی، هر کدام از لیست‌های خودت را می‌توانی بفرستی.",
      id_copy: "کپی", id_copied: "کپی شد",
      id_visible: "پیدا شدن لیست‌های عمومی من با آیدی",
      id_visible_off: "مخفی است: هیچ‌کس با آیدی تو لیست‌هایت را پیدا نمی‌کند."
    },
    ar: {
      id_title: "معرّف Flicksy الخاص بك",
      id_hint: "يمكن لأصدقائك كتابة @flicksyrobot {id} في أي محادثة لإرسال قوائمك العامة. وإذا كتبت @flicksyrobot فقط يمكنك إرسال أي قائمة من قوائمك.",
      id_copy: "نسخ", id_copied: "تم النسخ",
      id_visible: "السماح بالعثور على قوائمي العامة عبر المعرّف",
      id_visible_off: "مخفية: لا يمكن لأحد العثور على قوائمك بمعرّفك."
    },
    tr: {
      id_title: "Flicksy kimliğin",
      id_hint: "Arkadaşların herhangi bir sohbette @flicksyrobot {id} yazarak herkese açık listelerini gönderebilir. Sadece @flicksyrobot yazarsan kendi listelerinden birini gönderebilirsin.",
      id_copy: "Kopyala", id_copied: "Kopyalandı",
      id_visible: "Herkese açık listelerim kimlikle bulunabilsin",
      id_visible_off: "Gizli: kimliğinle kimse listelerini bulamaz."
    },
    ru: {
      id_title: "Твой Flicksy ID",
      id_hint: "Друзья могут написать в любом чате @flicksyrobot {id}, чтобы отправить твои публичные списки. Если написать только @flicksyrobot, можно отправить любой из своих списков.",
      id_copy: "Копировать", id_copied: "Скопировано",
      id_visible: "Находить мои публичные списки по ID",
      id_visible_off: "Скрыто: по твоему ID никто не найдёт списки."
    },
    es: {
      id_title: "Tu ID de Flicksy",
      id_hint: "Tus amigos pueden escribir @flicksyrobot {id} en cualquier chat para enviar tus listas públicas. Si escribes solo @flicksyrobot, puedes enviar cualquiera de tus listas.",
      id_copy: "Copiar", id_copied: "Copiado",
      id_visible: "Permitir encontrar mis listas públicas por ID",
      id_visible_off: "Oculto: nadie puede encontrar tus listas con tu ID."
    },
    fr: {
      id_title: "Ton ID Flicksy",
      id_hint: "Tes amis peuvent écrire @flicksyrobot {id} dans n’importe quelle discussion pour envoyer tes listes publiques. En écrivant seulement @flicksyrobot, tu peux envoyer n’importe laquelle de tes listes.",
      id_copy: "Copier", id_copied: "Copié",
      id_visible: "Permettre de trouver mes listes publiques par ID",
      id_visible_off: "Masqué : personne ne peut trouver tes listes avec ton ID."
    },
    de: {
      id_title: "Deine Flicksy-ID",
      id_hint: "Freunde können in jedem Chat @flicksyrobot {id} schreiben, um deine öffentlichen Listen zu senden. Mit nur @flicksyrobot kannst du jede deiner eigenen Listen senden.",
      id_copy: "Kopieren", id_copied: "Kopiert",
      id_visible: "Meine öffentlichen Listen per ID auffindbar machen",
      id_visible_off: "Versteckt: Niemand findet deine Listen mit deiner ID."
    }
  };

  function lt(key, params) {
    var table = STR[I18N.lang] || STR.en;
    var text = table[key];
    if (text === undefined) text = STR.en[key];
    if (text === undefined) return I18N.t(key, params);
    if (params) {
      Object.keys(params).forEach(function (k) {
        text = text.split("{" + k + "}").join(String(params[k]));
      });
    }
    return text;
  }

  // ---------- small styles ----------
  try {
    var css = document.createElement("style");
    css.textContent =
      ".idsec { margin-top: 26px; }" +
      ".idcard { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border-radius: 16px; background: var(--surface); border: 1px solid var(--line); }" +
      ".idnum { direction: ltr; font-size: 26px; font-weight: 800; letter-spacing: 3px; background: var(--grad); -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; }" +
      ".idhint { margin: 10px 4px 0; font-size: 13px; line-height: 1.6; color: var(--muted); }" +
      ".idrow { margin-top: 10px; }" +
      ".idrow .setting-left span { text-align: start; }" +
      ".sw { position: relative; flex: none; width: 46px; height: 28px; border-radius: 14px; background: rgba(255,255,255,.16); transition: background .2s; }" +
      ".sw::after { content: ''; position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; transition: transform .2s; }" +
      ".sw.on { background: var(--accent); }" +
      ".sw.on::after { transform: translateX(18px); }";
    document.head.appendChild(css);
  } catch (e) {}

  function copyText(text) {
    return new Promise(function (resolve, reject) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(resolve, function () { fallback(); });
          return;
        }
      } catch (e) {}
      fallback();
      function fallback() {
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
      }
    });
  }

  // ---------- profile section ----------
  FX.hooks.profile = function (holder, me) {
    if (!me || !me.public_id) return;

    var sec = el("section", "idsec");
    sec.appendChild(el("h2", "sec-title", lt("id_title")));

    var card = el("div", "idcard");
    card.appendChild(el("span", "idnum", String(me.public_id)));
    card.appendChild(button("btn glass", lt("id_copy"), function () {
      copyText(String(me.public_id)).then(function () {
        FX.haptic();
        FX.toast(lt("id_copied"));
      }, function () {
        FX.toast(String(me.public_id));
      });
    }));
    sec.appendChild(card);
    sec.appendChild(el("p", "idhint", lt("id_hint", { id: me.public_id })));

    holder.appendChild(sec);
  };
})();
