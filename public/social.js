(function () {
  "use strict";

  var FX = window.FX;
  if (!FX || !window.I18N) return;

  var el = FX.el, clear = FX.clear, button = FX.button;

  // ---------- texts (8 languages; English is the fallback) ----------
  // Keys start with "sx_". They are also added to I18N.t, so app.js can use them too.
  var STR = {
    en: {
      sx_search_ph: "Search titles and people…",
      sx_tab_titles: "Titles", sx_tab_people: "People",
      sx_people_hint: "Type a Flicksy ID (at least 3 digits) or a Telegram username.",
      sx_people_none: "Nobody found.",
      sx_follow: "Follow", sx_request: "Request", sx_following: "Following", sx_requested: "Requested",
      sx_unfollow: "Unfollow", sx_cancel_req: "Cancel request", sx_cancel: "Cancel",
      sx_following_n: "Following",
      sx_movies: "Movies", sx_episodes: "Episodes", sx_followers: "Followers",
      sx_lists: "Public lists", sx_lists_empty: "No public lists yet.",
      sx_lists_locked: "This profile is private. Public lists can still be opened from their share links.",
      sx_private_badge: "Private profile", sx_list_count: "{n} titles",
      sx_not_found: "Profile not found.",
      sx_bell: "Notifications", sx_requests: "Follow requests", sx_accept: "Accept", sx_decline: "Decline",
      sx_n_follow: "{name} started following you",
      sx_n_accepted: "{name} accepted your follow request",
      sx_n_empty: "Nothing new.",
      sx_privacy: "Privacy",
      sx_priv_private: "Private profile",
      sx_priv_private_hint: "People must send a request to follow you. Your Public lists stay open through their links.",
      sx_priv_activity: "Show my activity to followers",
      sx_priv_activity_hint: "What you watch, rate and add to lists can appear to people who follow you.",
      sx_priv_id: "Let people find my Public lists by ID",
      sx_priv_id_hint: "Used by @flicksyrobot with your Flicksy ID in chats.",
      sx_header_change: "Change header",
      sx_header_pick: "Pick a title you watched",
      sx_header_scene: "Pick a scene",
      sx_header_colors: "Colors",
      sx_header_reset: "Reset to default",
      sx_header_empty: "Mark a movie or series as Watched or Watching to pick a scene from it.",
      sx_header_noimg: "No scenes found for this title.",
      sx_header_saved: "Header updated",
      sx_back: "Back"
    },
    fa: {
      sx_search_ph: "جست‌وجوی فیلم، سریال و افراد…",
      sx_tab_titles: "فیلم و سریال", sx_tab_people: "افراد",
      sx_people_hint: "آیدی Flicksy (حداقل ۳ رقم) یا یوزرنیم تلگرام را بنویس.",
      sx_people_none: "کسی پیدا نشد.",
      sx_follow: "دنبال کردن", sx_request: "درخواست", sx_following: "دنبال می‌کنی", sx_requested: "درخواست داده‌ای",
      sx_unfollow: "لغو دنبال کردن", sx_cancel_req: "لغو درخواست", sx_cancel: "انصراف",
      sx_following_n: "دنبال‌شونده",
      sx_movies: "فیلم", sx_episodes: "اپیزود", sx_followers: "دنبال‌کننده",
      sx_lists: "لیست‌های عمومی", sx_lists_empty: "هنوز لیست عمومی ندارد.",
      sx_lists_locked: "این پروفایل خصوصی است. لیست‌های عمومی را هنوز می‌شود با لینک اشتراک‌شان باز کرد.",
      sx_private_badge: "پروفایل خصوصی", sx_list_count: "{n} عنوان",
      sx_not_found: "پروفایل پیدا نشد.",
      sx_bell: "اعلان‌ها", sx_requests: "درخواست‌های دنبال کردن", sx_accept: "قبول", sx_decline: "رد",
      sx_n_follow: "{name} شروع به دنبال کردن تو کرد",
      sx_n_accepted: "{name} درخواست دنبال کردنت را قبول کرد",
      sx_n_empty: "خبر تازه‌ای نیست.",
      sx_privacy: "حریم خصوصی",
      sx_priv_private: "پروفایل خصوصی",
      sx_priv_private_hint: "دیگران باید درخواست بدهند تا تو را دنبال کنند. لیست‌های عمومی‌ات با لینکشان باز می‌مانند.",
      sx_priv_activity: "نمایش فعالیت‌هایم به دنبال‌کننده‌ها",
      sx_priv_activity_hint: "آنچه می‌بینی، امتیاز می‌دهی و به لیست‌ها اضافه می‌کنی ممکن است به دنبال‌کننده‌هایت نشان داده شود.",
      sx_priv_id: "پیدا شدن لیست‌های عمومی من با آیدی",
      sx_priv_id_hint: "برای @flicksyrobot همراه با آیدی Flicksy تو در چت‌ها.",
      sx_header_change: "تغییر هدر",
      sx_header_pick: "یک فیلم یا سریالِ دیده‌شده را انتخاب کن",
      sx_header_scene: "یک صحنه انتخاب کن",
      sx_header_colors: "رنگ‌ها",
      sx_header_reset: "بازگشت به پیش‌فرض",
      sx_header_empty: "یک فیلم یا سریال را «دیده‌ام» یا «در حال دیدن» کن تا بتوانی از آن صحنه انتخاب کنی.",
      sx_header_noimg: "برای این عنوان صحنه‌ای پیدا نشد.",
      sx_header_saved: "هدر تغییر کرد",
      sx_back: "برگشت"
    },
    ar: {
      sx_search_ph: "ابحث عن أفلام ومسلسلات وأشخاص…",
      sx_tab_titles: "الأعمال", sx_tab_people: "الأشخاص",
      sx_people_hint: "اكتب معرّف Flicksy (3 أرقام على الأقل) أو اسم مستخدم تيليجرام.",
      sx_people_none: "لم يتم العثور على أحد.",
      sx_follow: "متابعة", sx_request: "طلب", sx_following: "تتابعه", sx_requested: "تم الطلب",
      sx_unfollow: "إلغاء المتابعة", sx_cancel_req: "إلغاء الطلب", sx_cancel: "إلغاء",
      sx_following_n: "يتابع",
      sx_movies: "أفلام", sx_episodes: "حلقات", sx_followers: "متابعون",
      sx_lists: "القوائم العامة", sx_lists_empty: "لا توجد قوائم عامة بعد.",
      sx_lists_locked: "هذا الملف خاص. ما زال يمكن فتح القوائم العامة من روابط مشاركتها.",
      sx_private_badge: "ملف خاص", sx_list_count: "{n} عنوان",
      sx_not_found: "الملف غير موجود.",
      sx_bell: "الإشعارات", sx_requests: "طلبات المتابعة", sx_accept: "قبول", sx_decline: "رفض",
      sx_n_follow: "بدأ {name} بمتابعتك",
      sx_n_accepted: "قبل {name} طلب متابعتك",
      sx_n_empty: "لا جديد.",
      sx_privacy: "الخصوصية",
      sx_priv_private: "ملف خاص",
      sx_priv_private_hint: "على الآخرين إرسال طلب لمتابعتك. تبقى قوائمك العامة مفتوحة عبر روابطها.",
      sx_priv_activity: "عرض نشاطي للمتابعين",
      sx_priv_activity_hint: "قد يظهر لمتابعيك ما تشاهده وتقيّمه وتضيفه إلى القوائم.",
      sx_priv_id: "السماح بالعثور على قوائمي العامة عبر المعرّف",
      sx_priv_id_hint: "يستخدمه @flicksyrobot مع معرّف Flicksy الخاص بك في المحادثات.",
      sx_header_change: "تغيير الغلاف",
      sx_header_pick: "اختر عملًا شاهدته",
      sx_header_scene: "اختر مشهدًا",
      sx_header_colors: "الألوان",
      sx_header_reset: "العودة إلى الافتراضي",
      sx_header_empty: "ضع فيلمًا أو مسلسلًا في «شاهدته» أو «أشاهده» لتختار مشهدًا منه.",
      sx_header_noimg: "لا توجد مشاهد لهذا العمل.",
      sx_header_saved: "تم تحديث الغلاف",
      sx_back: "رجوع"
    },
    tr: {
      sx_search_ph: "Film, dizi ve kişi ara…",
      sx_tab_titles: "Yapımlar", sx_tab_people: "Kişiler",
      sx_people_hint: "Bir Flicksy kimliği (en az 3 rakam) veya Telegram kullanıcı adı yaz.",
      sx_people_none: "Kimse bulunamadı.",
      sx_follow: "Takip et", sx_request: "İstek gönder", sx_following: "Takiptesin", sx_requested: "İstek gönderildi",
      sx_unfollow: "Takibi bırak", sx_cancel_req: "İsteği geri çek", sx_cancel: "Vazgeç",
      sx_following_n: "Takip",
      sx_movies: "Film", sx_episodes: "Bölüm", sx_followers: "Takipçi",
      sx_lists: "Herkese açık listeler", sx_lists_empty: "Henüz herkese açık liste yok.",
      sx_lists_locked: "Bu profil gizli. Herkese açık listeler paylaşım bağlantılarıyla yine açılabilir.",
      sx_private_badge: "Gizli profil", sx_list_count: "{n} yapım",
      sx_not_found: "Profil bulunamadı.",
      sx_bell: "Bildirimler", sx_requests: "Takip istekleri", sx_accept: "Kabul et", sx_decline: "Reddet",
      sx_n_follow: "{name} seni takip etmeye başladı",
      sx_n_accepted: "{name} takip isteğini kabul etti",
      sx_n_empty: "Yeni bir şey yok.",
      sx_privacy: "Gizlilik",
      sx_priv_private: "Gizli profil",
      sx_priv_private_hint: "Seni takip etmek için istek göndermeleri gerekir. Herkese açık listelerin bağlantılarıyla açık kalır.",
      sx_priv_activity: "Etkinliklerimi takipçilere göster",
      sx_priv_activity_hint: "İzlediklerin, puanladıkların ve listelere eklediklerin takipçilerine görünebilir.",
      sx_priv_id: "Herkese açık listelerim kimlikle bulunabilsin",
      sx_priv_id_hint: "Sohbetlerde @flicksyrobot ile Flicksy kimliğin için kullanılır.",
      sx_header_change: "Kapağı değiştir",
      sx_header_pick: "İzlediğin bir yapım seç",
      sx_header_scene: "Bir sahne seç",
      sx_header_colors: "Renkler",
      sx_header_reset: "Varsayılana dön",
      sx_header_empty: "Sahne seçebilmek için bir film veya diziyi İzledim ya da İzliyorum olarak işaretle.",
      sx_header_noimg: "Bu yapım için sahne bulunamadı.",
      sx_header_saved: "Kapak güncellendi",
      sx_back: "Geri"
    },
    ru: {
      sx_search_ph: "Поиск фильмов, сериалов и людей…",
      sx_tab_titles: "Фильмы и сериалы", sx_tab_people: "Люди",
      sx_people_hint: "Введи Flicksy ID (минимум 3 цифры) или имя пользователя Telegram.",
      sx_people_none: "Никого не найдено.",
      sx_follow: "Подписаться", sx_request: "Запрос", sx_following: "Вы подписаны", sx_requested: "Запрос отправлен",
      sx_unfollow: "Отписаться", sx_cancel_req: "Отменить запрос", sx_cancel: "Отмена",
      sx_following_n: "Подписки",
      sx_movies: "Фильмы", sx_episodes: "Серии", sx_followers: "Подписчики",
      sx_lists: "Публичные списки", sx_lists_empty: "Публичных списков пока нет.",
      sx_lists_locked: "Профиль закрыт. Публичные списки всё равно открываются по ссылкам.",
      sx_private_badge: "Закрытый профиль", sx_list_count: "{n} шт.",
      sx_not_found: "Профиль не найден.",
      sx_bell: "Уведомления", sx_requests: "Запросы на подписку", sx_accept: "Принять", sx_decline: "Отклонить",
      sx_n_follow: "{name} подписался на тебя",
      sx_n_accepted: "{name} принял твой запрос на подписку",
      sx_n_empty: "Ничего нового.",
      sx_privacy: "Приватность",
      sx_priv_private: "Закрытый профиль",
      sx_priv_private_hint: "Чтобы подписаться на тебя, нужно отправить запрос. Публичные списки остаются доступными по ссылкам.",
      sx_priv_activity: "Показывать мою активность подписчикам",
      sx_priv_activity_hint: "То, что ты смотришь, оцениваешь и добавляешь в списки, может быть видно подписчикам.",
      sx_priv_id: "Находить мои публичные списки по ID",
      sx_priv_id_hint: "Используется в @flicksyrobot вместе с твоим Flicksy ID в чатах.",
      sx_header_change: "Сменить обложку",
      sx_header_pick: "Выбери просмотренный фильм или сериал",
      sx_header_scene: "Выбери кадр",
      sx_header_colors: "Цвета",
      sx_header_reset: "Сбросить по умолчанию",
      sx_header_empty: "Отметь фильм или сериал как «Просмотрено» или «Смотрю», чтобы выбрать кадр из него.",
      sx_header_noimg: "Для этого названия нет кадров.",
      sx_header_saved: "Обложка обновлена",
      sx_back: "Назад"
    },
    es: {
      sx_search_ph: "Buscar títulos y personas…",
      sx_tab_titles: "Títulos", sx_tab_people: "Personas",
      sx_people_hint: "Escribe un ID de Flicksy (mínimo 3 dígitos) o un usuario de Telegram.",
      sx_people_none: "No se encontró a nadie.",
      sx_follow: "Seguir", sx_request: "Solicitar", sx_following: "Siguiendo", sx_requested: "Solicitado",
      sx_unfollow: "Dejar de seguir", sx_cancel_req: "Cancelar solicitud", sx_cancel: "Cancelar",
      sx_following_n: "Siguiendo",
      sx_movies: "Películas", sx_episodes: "Episodios", sx_followers: "Seguidores",
      sx_lists: "Listas públicas", sx_lists_empty: "Aún no hay listas públicas.",
      sx_lists_locked: "Este perfil es privado. Las listas públicas aún se abren con sus enlaces.",
      sx_private_badge: "Perfil privado", sx_list_count: "{n} títulos",
      sx_not_found: "Perfil no encontrado.",
      sx_bell: "Notificaciones", sx_requests: "Solicitudes de seguimiento", sx_accept: "Aceptar", sx_decline: "Rechazar",
      sx_n_follow: "{name} empezó a seguirte",
      sx_n_accepted: "{name} aceptó tu solicitud",
      sx_n_empty: "Nada nuevo.",
      sx_privacy: "Privacidad",
      sx_priv_private: "Perfil privado",
      sx_priv_private_hint: "Hay que enviar una solicitud para seguirte. Tus listas públicas siguen abiertas con sus enlaces.",
      sx_priv_activity: "Mostrar mi actividad a mis seguidores",
      sx_priv_activity_hint: "Lo que ves, puntúas y añades a listas puede mostrarse a quienes te siguen.",
      sx_priv_id: "Permitir encontrar mis listas públicas por ID",
      sx_priv_id_hint: "Lo usa @flicksyrobot con tu ID de Flicksy en los chats.",
      sx_header_change: "Cambiar portada",
      sx_header_pick: "Elige un título que viste",
      sx_header_scene: "Elige una escena",
      sx_header_colors: "Colores",
      sx_header_reset: "Restablecer",
      sx_header_empty: "Marca una película o serie como Vista o Viendo para elegir una escena.",
      sx_header_noimg: "No hay escenas para este título.",
      sx_header_saved: "Portada actualizada",
      sx_back: "Atrás"
    },
    fr: {
      sx_search_ph: "Rechercher titres et personnes…",
      sx_tab_titles: "Titres", sx_tab_people: "Personnes",
      sx_people_hint: "Saisis un ID Flicksy (3 chiffres minimum) ou un nom d’utilisateur Telegram.",
      sx_people_none: "Personne trouvé.",
      sx_follow: "Suivre", sx_request: "Demander", sx_following: "Suivi", sx_requested: "Demandé",
      sx_unfollow: "Ne plus suivre", sx_cancel_req: "Annuler la demande", sx_cancel: "Annuler",
      sx_following_n: "Abonnements",
      sx_movies: "Films", sx_episodes: "Épisodes", sx_followers: "Abonnés",
      sx_lists: "Listes publiques", sx_lists_empty: "Pas encore de liste publique.",
      sx_lists_locked: "Ce profil est privé. Les listes publiques restent accessibles par leurs liens.",
      sx_private_badge: "Profil privé", sx_list_count: "{n} titres",
      sx_not_found: "Profil introuvable.",
      sx_bell: "Notifications", sx_requests: "Demandes d’abonnement", sx_accept: "Accepter", sx_decline: "Refuser",
      sx_n_follow: "{name} te suit maintenant",
      sx_n_accepted: "{name} a accepté ta demande",
      sx_n_empty: "Rien de nouveau.",
      sx_privacy: "Confidentialité",
      sx_priv_private: "Profil privé",
      sx_priv_private_hint: "Il faut envoyer une demande pour te suivre. Tes listes publiques restent ouvertes via leurs liens.",
      sx_priv_activity: "Montrer mon activité à mes abonnés",
      sx_priv_activity_hint: "Ce que tu regardes, notes et ajoutes aux listes peut apparaître chez tes abonnés.",
      sx_priv_id: "Permettre de trouver mes listes publiques par ID",
      sx_priv_id_hint: "Utilisé par @flicksyrobot avec ton ID Flicksy dans les discussions.",
      sx_header_change: "Changer la bannière",
      sx_header_pick: "Choisis un titre que tu as vu",
      sx_header_scene: "Choisis une scène",
      sx_header_colors: "Couleurs",
      sx_header_reset: "Rétablir par défaut",
      sx_header_empty: "Marque un film ou une série comme Vu ou En cours pour choisir une scène.",
      sx_header_noimg: "Aucune scène pour ce titre.",
      sx_header_saved: "Bannière mise à jour",
      sx_back: "Retour"
    },
    de: {
      sx_search_ph: "Titel und Personen suchen…",
      sx_tab_titles: "Titel", sx_tab_people: "Personen",
      sx_people_hint: "Gib eine Flicksy-ID (mind. 3 Ziffern) oder einen Telegram-Benutzernamen ein.",
      sx_people_none: "Niemand gefunden.",
      sx_follow: "Folgen", sx_request: "Anfragen", sx_following: "Folgst du", sx_requested: "Angefragt",
      sx_unfollow: "Nicht mehr folgen", sx_cancel_req: "Anfrage zurückziehen", sx_cancel: "Abbrechen",
      sx_following_n: "Folge ich",
      sx_movies: "Filme", sx_episodes: "Folgen", sx_followers: "Follower",
      sx_lists: "Öffentliche Listen", sx_lists_empty: "Noch keine öffentlichen Listen.",
      sx_lists_locked: "Dieses Profil ist privat. Öffentliche Listen lassen sich weiter über ihre Links öffnen.",
      sx_private_badge: "Privates Profil", sx_list_count: "{n} Titel",
      sx_not_found: "Profil nicht gefunden.",
      sx_bell: "Mitteilungen", sx_requests: "Folgeanfragen", sx_accept: "Annehmen", sx_decline: "Ablehnen",
      sx_n_follow: "{name} folgt dir jetzt",
      sx_n_accepted: "{name} hat deine Anfrage angenommen",
      sx_n_empty: "Nichts Neues.",
      sx_privacy: "Datenschutz",
      sx_priv_private: "Privates Profil",
      sx_priv_private_hint: "Wer dir folgen will, muss eine Anfrage senden. Deine öffentlichen Listen bleiben über ihre Links offen.",
      sx_priv_activity: "Meine Aktivität für Follower zeigen",
      sx_priv_activity_hint: "Was du ansiehst, bewertest und zu Listen hinzufügst, kann deinen Followern angezeigt werden.",
      sx_priv_id: "Meine öffentlichen Listen per ID auffindbar machen",
      sx_priv_id_hint: "Wird von @flicksyrobot mit deiner Flicksy-ID in Chats verwendet.",
      sx_header_change: "Titelbild ändern",
      sx_header_pick: "Wähle einen gesehenen Titel",
      sx_header_scene: "Wähle eine Szene",
      sx_header_colors: "Farben",
      sx_header_reset: "Auf Standard zurücksetzen",
      sx_header_empty: "Markiere einen Film oder eine Serie als Gesehen oder Läuft, um eine Szene zu wählen.",
      sx_header_noimg: "Keine Szenen für diesen Titel.",
      sx_header_saved: "Titelbild aktualisiert",
      sx_back: "Zurück"
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

  // Let app.js ask for "sx_..." texts through the normal I18N.t.
  (function () {
    var base = I18N.t;
    I18N.t = function (key, params) {
      if (typeof key === "string" && key.indexOf("sx_") === 0 && STR.en[key] !== undefined) return lt(key, params);
      return base.call(I18N, key, params);
    };
  })();

  // ---------- styles ----------
  try {
    var css = document.createElement("style");
    css.textContent =
      ".sw { position: relative; flex: none; width: 46px; height: 28px; border-radius: 14px; background: rgba(255,255,255,.16); transition: background .2s; }" +
      ".sw::after { content: ''; position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; transition: transform .2s; }" +
      ".sw.on { background: var(--accent); }" +
      ".sw.on::after { transform: translateX(18px); }" +
      /* headers */
      ".sp-banner { position: relative; height: 150px; border-radius: 22px; overflow: hidden; background: #15152f; border: 1px solid var(--line); margin-bottom: 12px; }" +
      ".sp-banner img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }" +
      ".sp-banner::after { content: ''; position: absolute; inset: 0; background: linear-gradient(0deg, rgba(7,7,26,.55), rgba(7,7,26,0) 60%); }" +
      ".sp-g1 { background: linear-gradient(135deg, #7c3aed, #2563eb); }" +
      ".sp-g2 { background: linear-gradient(135deg, #db2777, #7c3aed); }" +
      ".sp-g3 { background: linear-gradient(135deg, #0ea5e9, #6366f1); }" +
      ".sp-g4 { background: linear-gradient(135deg, #f59e0b, #ef4444); }" +
      ".sp-g5 { background: linear-gradient(135deg, #10b981, #0ea5e9); }" +
      ".sp-g6 { background: linear-gradient(135deg, #334155, #7c3aed); }" +
      ".sp-edit { position: absolute; z-index: 2; top: 10px; inset-inline-end: 10px; display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 12px; font-size: 12px; font-weight: 700; color: #fff; background: rgba(7,7,26,.55); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,.16); }" +
      /* bell */
      ".sp-bell { position: relative; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--surface); border: 1px solid var(--line); color: #e6e6f5; }" +
      ".sp-badge { position: absolute; top: -3px; inset-inline-end: -3px; min-width: 19px; height: 19px; padding: 0 5px; border-radius: 10px; background: #ef4444; color: #fff; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; border: 2px solid var(--bg); }" +
      /* people */
      ".sp-tabs { margin-top: 12px; }" +
      ".sp-list { display: grid; gap: 10px; margin-top: 14px; }" +
      ".sp-row { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 14px; border-radius: 18px; background: var(--surface); border: 1px solid var(--line); text-align: start; }" +
      ".sp-av { width: 46px; height: 46px; border-radius: 50%; object-fit: cover; flex: none; background: var(--grad); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; color: #fff; }" +
      ".sp-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }" +
      ".sp-name { font-size: 15px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }" +
      ".sp-sub { font-size: 12px; color: var(--muted); direction: ltr; text-align: start; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }" +
      ".btn.rel { padding: 9px 14px; font-size: 13px; flex: none; }" +
      /* notifications */
      ".sp-nrow { display: flex; align-items: center; gap: 12px; padding: 10px 2px; border-top: 1px solid var(--line); font-size: 14px; line-height: 1.5; }" +
      ".sp-nrow:first-child { border-top: none; }" +
      ".sp-nrow .sp-av { width: 40px; height: 40px; font-size: 16px; }" +
      ".sp-nrow .sp-ntext { flex: 1; min-width: 0; text-align: start; }" +
      ".sp-nrow.unread .sp-ntext { font-weight: 700; }" +
      ".sp-nbtns { display: flex; gap: 8px; flex: none; }" +
      ".sp-nbtns .btn { padding: 8px 12px; font-size: 12px; }" +
      ".sp-sub-title { font-size: 13px; font-weight: 800; color: var(--muted); margin: 16px 2px 6px; }" +
      /* privacy */
      ".sp-prow { margin-top: 10px; }" +
      ".sp-prow .setting-left span { text-align: start; }" +
      ".sp-phint { margin: 8px 4px 0; font-size: 12.5px; line-height: 1.7; color: var(--muted); }" +
      /* profile page */
      ".spage { z-index: 28; }" +
      ".spage .sp-banner { height: 190px; border-radius: 0; border: none; margin: 0; }" +
      ".spage .sp-banner::after { background: linear-gradient(0deg, var(--bg) 0%, rgba(7,7,26,0) 75%); }" +
      ".sbody { position: relative; max-width: 560px; margin: -44px auto 0; padding: 0 16px; }" +
      ".sp-head { display: flex; align-items: flex-end; gap: 14px; }" +
      ".sp-head .sp-av { width: 88px; height: 88px; font-size: 32px; border: 3px solid var(--bg); box-shadow: 0 0 0 2px rgba(168,85,247,.5); }" +
      ".sp-head .sp-info { padding-bottom: 6px; }" +
      ".sp-head .sp-name { font-size: 21px; font-weight: 800; white-space: normal; }" +
      ".sp-priv-tag { align-self: flex-start; margin-top: 4px; }" +
      ".sp-act { margin-top: 16px; }" +
      ".sp-act .btn { width: 100%; padding: 13px 16px; font-size: 15px; }" +
      ".sp-stats .stat b { font-size: 20px; }" +
      ".sp-stats-card { display: flex; margin-top: 18px; padding: 16px 4px; border-radius: 20px; background: var(--surface); border: 1px solid var(--line); }" +
      ".sp-own-stats { margin-top: 0; padding-top: 0; border-top: none; }" +
      ".sp-locked { margin-top: 12px; padding: 14px; border-radius: 16px; background: var(--surface); border: 1px dashed var(--line); font-size: 13px; line-height: 1.8; color: var(--muted); }" +
      /* modern profile tab */
      "#view-profile .sp-banner { height: 168px; margin-bottom: 0; border: none; border-radius: 30px; box-shadow: 0 26px 50px -26px rgba(99,60,220,.8); }" +
      "#view-profile .sp-banner::after { background: linear-gradient(180deg, rgba(7,7,26,.25) 0%, rgba(7,7,26,0) 35%, rgba(7,7,26,.55) 100%); }" +
      "#view-profile .sp-edit { top: 12px; bottom: auto; inset-inline-end: 12px; padding: 8px 13px; border-radius: 999px; }" +
      "#view-profile .profile-card { position: relative; margin-top: -58px; padding: 0 2px; background: none; border: none; border-radius: 0; }" +
      "#view-profile .avatar-lg { width: 96px; height: 96px; font-size: 34px; border: 4px solid var(--bg); box-shadow: 0 0 0 3px rgba(168,85,247,.65), 0 14px 40px rgba(139,92,246,.55); }" +
      "#view-profile .profile-name { margin-top: 12px; font-size: 23px; letter-spacing: -.3px; }" +
      ".sp-idline { display: inline-flex; align-items: center; gap: 8px; margin-top: 8px; padding: 5px 13px; border-radius: 999px; font-size: 12.5px; color: #cfc2ff; background: rgba(139,92,246,.16); border: 1px solid rgba(168,85,247,.28); direction: ltr; }" +
      "#view-profile .stats { gap: 10px; margin-top: 20px; padding-top: 0; border-top: none; }" +
      "#view-profile .stat { padding: 14px 4px 12px; border-radius: 20px; background: linear-gradient(160deg, rgba(255,255,255,.09), rgba(255,255,255,.03)); border: 1px solid var(--line); }" +
      "#view-profile .stat b { font-size: 24px; background: var(--grad); -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; }" +
      "#view-profile .sp-own-stats { margin-top: 10px; }" +
      "#view-profile .sp-own-stats .stat b { font-size: 21px; }" +
      "#view-profile .settings { margin-top: 30px; gap: 10px; }" +
      "#view-profile .settings .sec-title { font-size: 13px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); margin: 0 4px 2px; }" +
      "#view-profile .setting { padding: 12px 14px; border-radius: 20px; background: linear-gradient(160deg, rgba(255,255,255,.08), rgba(255,255,255,.03)); }" +
      "#view-profile .setting-left { gap: 14px; }" +
      "#view-profile .setting-left .ic { box-sizing: content-box; padding: 8px; border-radius: 13px; background: rgba(139,92,246,.2); color: #d4c6ff; }" +
      "#view-profile .topbar .sp-bell { width: 44px; height: 44px; background: linear-gradient(160deg, rgba(255,255,255,.12), rgba(255,255,255,.04)); box-shadow: 0 8px 22px -10px rgba(0,0,0,.8); }" +
      /* header picker */
      ".sp-presets { display: flex; gap: 10px; flex-wrap: wrap; }" +
      ".sp-preset { width: 54px; height: 38px; border-radius: 12px; border: 2px solid transparent; }" +
      ".sp-preset.sel { border-color: #fff; }" +
      ".sp-pgrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 10px; }" +
      ".sp-igrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px; }" +
      ".sp-img { position: relative; aspect-ratio: 16 / 9; border-radius: 12px; overflow: hidden; background: #15152f; border: 1px solid var(--line); }" +
      ".sp-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }" +
      ".sp-back { display: inline-flex; align-items: center; gap: 6px; padding: 6px 2px; margin-bottom: 6px; font-size: 14px; font-weight: 700; color: #c9b6ff; }";
    document.head.appendChild(css);
  } catch (e) {}

  // ---------- small helpers ----------
  var NS = "http://www.w3.org/2000/svg";
  function svg(paths, size) {
    var s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("width", size || 20);
    s.setAttribute("height", size || 20);
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("class", "ic");
    paths.forEach(function (d) {
      var p = document.createElementNS(NS, "path");
      p.setAttribute("d", d);
      s.appendChild(p);
    });
    return s;
  }
  var BELL = ["M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z", "M10 20a2 2 0 0 0 4 0"];
  var LOCK = ["M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z", "M8 11V8a4 4 0 0 1 8 0v3"];
  var PEN = ["M4 20h4L19 9l-4-4L4 16z"];

  function avatar(person, extra) {
    if (person && person.photo_url) {
      var img = el("img", "sp-av" + (extra ? " " + extra : ""));
      img.src = person.photo_url;
      img.alt = "";
      img.addEventListener("error", function () { img.replaceWith(initial(person, extra)); });
      return img;
    }
    return initial(person, extra);
  }
  function initial(person, extra) {
    var name = (person && person.display_name) || "F";
    return el("div", "sp-av" + (extra ? " " + extra : ""), name.charAt(0).toUpperCase());
  }

  function presetFor(pid) {
    var sum = 0;
    String(pid || "").split("").forEach(function (c) { sum += parseInt(c, 10) || 0; });
    return "g" + ((sum % 6) + 1);
  }

  // The picture / colors at the top of a profile.
  function banner(header, pid) {
    var box = el("div", "sp-banner");
    if (typeof header === "string" && /^img:[A-Za-z0-9_-]{5,80}\.jpg$/.test(header)) {
      var img = el("img");
      img.src = "/tmdb-img/w780/" + header.slice(4);
      img.alt = "";
      box.appendChild(img);
      box.classList.add("sp-g" + presetFor(pid).slice(1));
    } else if (typeof header === "string" && /^g[1-6]$/.test(header)) {
      box.classList.add("sp-" + header);
    } else {
      box.classList.add("sp-" + presetFor(pid));
    }
    return box;
  }

  function statNode(value, label) {
    var s = el("div", "stat");
    s.appendChild(el("b", "", String(value)));
    s.appendChild(el("span", "", label));
    return s;
  }

  function statsRow(stats, className) {
    var row = el("div", className || "stats");
    row.appendChild(statNode(stats.movies || 0, lt("sx_movies")));
    row.appendChild(statNode(stats.episodes || 0, lt("sx_episodes")));
    row.appendChild(statNode(stats.followers || 0, lt("sx_followers")));
    row.appendChild(statNode(stats.following || 0, lt("sx_following_n")));
    return row;
  }

  function netError(res) {
    return FX.problem(res, "err_generic");
  }

  // ---------- follow button ----------
  // st = { public_id, display_name, relation: "none"|"following"|"requested"|"self", is_private }
  function relButton(st, onChange) {
    var busy = false;
    var b = button("btn rel", null, null);

    function paint() {
      clear(b);
      var rel = st.relation;
      b.className = "btn rel " + (rel === "none" ? "primary" : "glass");
      if (rel === "following") b.appendChild(FX.icon("check", 14));
      var key = rel === "following" ? "sx_following" : rel === "requested" ? "sx_requested" : st.is_private ? "sx_request" : "sx_follow";
      b.appendChild(document.createTextNode((rel === "following" ? " " : "") + lt(key)));
    }

    function done(res, ok) {
      busy = false;
      if (!ok) { FX.toast(netError(res), true); return; }
      st.relation = res.data.relation;
      FX.haptic();
      paint();
      if (onChange) onChange();
    }

    function send(method, path, body) {
      busy = true;
      var opts = { method: method };
      if (body) opts.body = body;
      FX.api(path, opts).then(function (res) {
        done(res, res.status === 200);
      }).catch(function () {
        busy = false;
        FX.toast(I18N.t("err_network"), true);
      });
    }

    b.addEventListener("click", function (e) {
      e.stopPropagation();
      if (busy) return;
      if (st.relation === "none") {
        send("POST", "/api/follow", { id: st.public_id });
        return;
      }
      var requested = st.relation === "requested";
      FX.openSheet(function (sh) {
        sh.appendChild(el("h3", "sheet-title", st.display_name || ""));
        sh.appendChild(button("btn danger block", lt(requested ? "sx_cancel_req" : "sx_unfollow"), function () {
          FX.closeSheet();
          send("DELETE", "/api/follow?id=" + encodeURIComponent(st.public_id));
        }));
        sh.appendChild(button("btn glass block", lt("sx_cancel"), FX.closeSheet));
      });
    });
    paint();
    return b;
  }

  // ---------- people search (Discover > People) ----------
  var peopleToken = 0;

  function personRow(person) {
    var row = el("div", "sp-row");
    row.style.cursor = "pointer";
    row.appendChild(avatar(person));
    var info = el("div", "sp-info");
    info.appendChild(el("div", "sp-name", person.display_name || ""));
    var sub = [];
    if (person.username) sub.push("@" + person.username);
    sub.push(person.public_id);
    info.appendChild(el("div", "sp-sub", sub.join(" · ")));
    row.appendChild(info);
    row.appendChild(relButton(person));
    row.addEventListener("click", function () { openProfile(person.public_id); });
    return row;
  }

  FX.hooks.people = function (container, q) {
    var my = ++peopleToken;
    clear(container);
    var raw = String(q || "").trim().replace(/^@/, "");
    var digits = /^\d+$/.test(raw);
    var valid = digits ? raw.length >= 3 && raw.length <= 8 : /^[A-Za-z0-9_]{3,32}$/.test(raw);
    if (!valid) { container.appendChild(FX.msg(lt("sx_people_hint"))); return; }

    container.appendChild(FX.msg(I18N.t("searching")));
    FX.api("/api/people-search?q=" + encodeURIComponent(raw)).then(function (res) {
      if (my !== peopleToken || !container.isConnected) return;
      clear(container);
      if (res.status !== 200) { container.appendChild(FX.msg(netError(res), true)); return; }
      var people = res.data.people || [];
      if (!people.length) { container.appendChild(FX.msg(lt("sx_people_none"))); return; }
      var list = el("div", "sp-list");
      people.forEach(function (p) { list.appendChild(personRow(p)); });
      container.appendChild(list);
    }).catch(function () {
      if (my !== peopleToken || !container.isConnected) return;
      clear(container);
      container.appendChild(FX.msg(I18N.t("err_network"), true));
    });
  };

  // ---------- someone's profile page ----------
  var page = null;

  function closeProfile() {
    if (!page) return;
    page.root.remove();
    FX.popBack(page.back);
    page = null;
  }

  function miniMosaic(posters) {
    var box = el("div", "lmosaic");
    for (var i = 0; i < 4; i++) {
      var cell = el("div", "lcell");
      if (posters[i]) {
        var img = el("img");
        img.src = posters[i];
        img.alt = "";
        img.loading = "lazy";
        cell.appendChild(img);
      }
      box.appendChild(cell);
    }
    return box;
  }

  function drawProfile(p) {
    var root = p.root;
    clear(root);

    var back = FX.iconButton("round-btn", "back", I18N.t("btn_close"), closeProfile);
    back.firstChild.classList.add("flip");

    var scroller = el("div", "page-scroll");
    root.appendChild(scroller);

    if (p.error || !p.data) {
      root.appendChild(back);
      var holder = el("div", "sbody");
      holder.style.paddingTop = "80px";
      holder.appendChild(FX.msg(p.error || I18N.t("loading"), !!p.error));
      scroller.appendChild(holder);
      return;
    }

    var d = p.data;
    var pr = d.profile;
    scroller.appendChild(banner(pr.header, pr.public_id));
    root.appendChild(back);

    var body = el("div", "sbody");
    scroller.appendChild(body);

    var head = el("div", "sp-head");
    head.appendChild(avatar(pr));
    var info = el("div", "sp-info");
    info.appendChild(el("div", "sp-name", pr.display_name || ""));
    var sub = [];
    if (pr.username) sub.push("@" + pr.username);
    sub.push(pr.public_id);
    info.appendChild(el("div", "sp-sub", sub.join(" · ")));
    if (pr.is_private) info.appendChild(el("span", "tag sp-priv-tag", lt("sx_private_badge")));
    head.appendChild(info);
    body.appendChild(head);

    if (d.relation !== "self") {
      var act = el("div", "sp-act");
      var st = { public_id: pr.public_id, display_name: pr.display_name, relation: d.relation, is_private: pr.is_private };
      var btn = relButton(st, function () { loadProfile(p, true); });
      btn.classList.add("block");
      act.appendChild(btn);
      body.appendChild(act);
    }

    var card = el("div", "sp-stats-card");
    card.appendChild(statsRow(d.stats, "stats sp-stats"));
    var inner = card.firstChild;
    inner.style.margin = "0";
    inner.style.padding = "0";
    inner.style.border = "none";
    body.appendChild(card);

    var sec = el("section", "section");
    sec.appendChild(el("h2", "sec-title", lt("sx_lists")));
    if (d.lists_locked) {
      sec.appendChild(el("div", "sp-locked", lt("sx_lists_locked")));
    } else if (!d.lists.length) {
      sec.appendChild(FX.msg(lt("sx_lists_empty")));
    } else {
      var row = el("div", "hscroll");
      d.lists.forEach(function (l) {
        var c = button("lcard", null, function () { if (FX.openListByCode) FX.openListByCode(l.share_code); });
        c.appendChild(miniMosaic(l.posters || []));
        c.appendChild(el("div", "ptitle", l.title));
        c.appendChild(el("div", "psub", lt("sx_list_count", { n: l.count })));
        row.appendChild(c);
      });
      sec.appendChild(row);
    }
    body.appendChild(sec);
  }

  function loadProfile(p, quiet) {
    FX.api("/api/profile?id=" + encodeURIComponent(p.pid)).then(function (res) {
      if (page !== p) return;
      if (res.status !== 200) {
        if (!quiet) p.error = res.status === 404 ? lt("sx_not_found") : netError(res);
      } else {
        p.data = res.data;
        p.error = "";
      }
      drawProfile(p);
    }).catch(function () {
      if (page !== p) return;
      if (!quiet) p.error = I18N.t("err_network");
      drawProfile(p);
    });
  }

  function openProfile(pid) {
    if (page) closeProfile();
    var p = { pid: String(pid), data: null, error: "", root: el("div", "page spage"), back: closeProfile };
    page = p;
    document.body.appendChild(p.root);
    FX.pushBack(p.back);
    drawProfile(p);
    loadProfile(p, false);
  }
  FX.openProfile = openProfile;

  // ---------- notification bell (top of the Profile tab) ----------
  function openBellSheet(state, bellBadge) {
    FX.openSheet(function (sh) {
      sh.appendChild(el("h3", "sheet-title", lt("sx_bell")));
      var box = el("div");
      sh.appendChild(box);
      box.appendChild(FX.msg(I18N.t("loading")));

      FX.api("/api/notifications").then(function (res) {
        clear(box);
        if (res.status !== 200) { box.appendChild(FX.msg(netError(res), true)); return; }
        var reqs = res.data.requests || [];
        var items = res.data.items || [];

        function setBadge() {
          var n = reqs.length;
          bellBadge(n);
        }

        function goProfile(pid) { FX.closeSheet(); openProfile(pid); }

        function drawAll() {
          clear(box);
          if (!reqs.length && !items.length) { box.appendChild(FX.msg(lt("sx_n_empty"))); return; }

          if (reqs.length) {
            box.appendChild(el("div", "sp-sub-title", lt("sx_requests")));
            reqs.forEach(function (r) {
              var row = el("div", "sp-nrow");
              var av = avatar(r);
              av.style.cursor = "pointer";
              av.addEventListener("click", function () { goProfile(r.public_id); });
              row.appendChild(av);
              var text = el("div", "sp-ntext", r.display_name || "");
              row.appendChild(text);
              var btns = el("div", "sp-nbtns");
              function answer(action) {
                FX.api("/api/follow-requests", { method: "POST", body: { id: r.public_id, action: action } }).then(function (res2) {
                  if (res2.status !== 200 && res2.status !== 404) { FX.toast(netError(res2), true); return; }
                  FX.haptic();
                  reqs = reqs.filter(function (x) { return x !== r; });
                  setBadge();
                  drawAll();
                }).catch(function () { FX.toast(I18N.t("err_network"), true); });
              }
              btns.appendChild(button("btn primary", lt("sx_accept"), function () { answer("accept"); }));
              btns.appendChild(button("btn glass", lt("sx_decline"), function () { answer("decline"); }));
              row.appendChild(btns);
              box.appendChild(row);
            });
          }

          if (items.length) {
            box.appendChild(el("div", "sp-sub-title", lt("sx_bell")));
            items.forEach(function (n) {
              var row = el("div", "sp-nrow" + (n.read ? "" : " unread"));
              row.style.cursor = "pointer";
              row.appendChild(avatar(n.person));
              var key = n.type === "request_accepted" ? "sx_n_accepted" : "sx_n_follow";
              row.appendChild(el("div", "sp-ntext", lt(key, { name: n.person.display_name || "" })));
              row.addEventListener("click", function () { goProfile(n.person.public_id); });
              box.appendChild(row);
            });
          }
        }

        drawAll();
        var unread = items.some(function (n) { return !n.read; });
        if (unread) {
          FX.api("/api/notifications-read", { method: "POST", body: {} }).then(function () { setBadge(); });
        }
      }).catch(function () {
        clear(box);
        box.appendChild(FX.msg(I18N.t("err_network"), true));
      });
    });
  }

  // ---------- header picker ----------
  var libCache = null;

  function loadLibrary() {
    if (libCache) return Promise.resolve(libCache);
    return FX.api("/api/library").then(function (res) {
      if (res.status !== 200) return [];
      libCache = (res.data.items || []).filter(function (i) { return i.status === "watched" || i.status === "watching"; });
      return libCache;
    }).catch(function () { return []; });
  }

  function saveHeader(me, value) {
    return FX.api("/api/profile-header", { method: "PUT", body: { header: value } }).then(function (res) {
      if (res.status !== 200) { FX.toast(netError(res), true); return false; }
      me.header = res.data.header;
      FX.closeSheet();
      FX.haptic();
      FX.toast(lt("sx_header_saved"));
      FX.rerender();
      return true;
    }).catch(function () { FX.toast(I18N.t("err_network"), true); return false; });
  }

  function openHeaderPicker(me) {
    FX.openSheet(function (sh) {
      sh.classList.add("tall");
      var box = el("div");
      sh.appendChild(box);

      function showTitles() {
        clear(box);
        box.appendChild(el("h3", "sheet-title", lt("sx_header_change")));

        box.appendChild(el("div", "label", lt("sx_header_colors")));
        var pre = el("div", "sp-presets");
        ["g1", "g2", "g3", "g4", "g5", "g6"].forEach(function (g) {
          var b = button("sp-preset sp-" + g + (me.header === g ? " sel" : ""), null, function () { saveHeader(me, g); });
          b.setAttribute("aria-label", g);
          pre.appendChild(b);
        });
        box.appendChild(pre);

        box.appendChild(el("div", "label", lt("sx_header_pick")));
        var holder = el("div");
        box.appendChild(holder);
        holder.appendChild(FX.msg(I18N.t("loading")));
        loadLibrary().then(function (items) {
          if (!holder.isConnected) return;
          clear(holder);
          if (!items.length) { holder.appendChild(FX.msg(lt("sx_header_empty"))); return; }
          var grid = el("div", "sp-pgrid");
          items.slice(0, 60).forEach(function (it) {
            var c = button("pcard", null, function () { showScenes(it); });
            var im = el("div", "pimg");
            im.appendChild(FX.posterNode(it));
            c.appendChild(im);
            c.appendChild(el("div", "ptitle", FX.displayTitle(it)));
            grid.appendChild(c);
          });
          holder.appendChild(grid);
        });

        if (me.header) {
          box.appendChild(button("btn glass block", lt("sx_header_reset"), function () { saveHeader(me, null); }));
        }
      }

      function showScenes(it) {
        clear(box);
        var back = button("sp-back", null, showTitles);
        var ic = FX.icon("back", 16);
        ic.classList.add("flip");
        back.appendChild(ic);
        back.appendChild(document.createTextNode(lt("sx_back")));
        box.appendChild(back);
        box.appendChild(el("h3", "sheet-title", FX.displayTitle(it)));
        box.appendChild(el("div", "label", lt("sx_header_scene")));
        var holder = el("div");
        box.appendChild(holder);
        holder.appendChild(FX.msg(I18N.t("loading")));
        FX.api("/api/header-options?tmdb_id=" + it.tmdb_id + "&media_type=" + it.media_type).then(function (res) {
          if (!holder.isConnected) return;
          clear(holder);
          if (res.status !== 200) { holder.appendChild(FX.msg(netError(res), true)); return; }
          var files = res.data.images || [];
          if (!files.length) { holder.appendChild(FX.msg(lt("sx_header_noimg"))); return; }
          var grid = el("div", "sp-igrid");
          files.forEach(function (f) {
            var b = button("sp-img", null, function () { saveHeader(me, "img:" + f); });
            var im = el("img");
            im.src = "/tmdb-img/w342/" + f;
            im.alt = "";
            im.loading = "lazy";
            b.appendChild(im);
            grid.appendChild(b);
          });
          holder.appendChild(grid);
        }).catch(function () {
          if (!holder.isConnected) return;
          clear(holder);
          holder.appendChild(FX.msg(I18N.t("err_network"), true));
        });
      }

      showTitles();
    });
  }

  // ---------- privacy sheet ----------
  function openPrivacySheet(me) {
    FX.openSheet(function (sh) {
      sh.appendChild(el("h3", "sheet-title", lt("sx_privacy")));
      var box = el("div");
      sh.appendChild(box);
      box.appendChild(FX.msg(I18N.t("loading")));

      FX.api("/api/privacy").then(function (res) {
        clear(box);
        if (res.status !== 200) { box.appendChild(FX.msg(netError(res), true)); return; }
        var state = res.data;
        var saving = false;

        // Each switch: label, hint, how to read it from state, and what to send when it flips.
        var rows = [
          { label: "sx_priv_private", hint: "sx_priv_private_hint",
            get: function () { return !!state.is_private; },
            body: function (next) { return { is_private: next }; } },
          { label: "sx_priv_activity", hint: "sx_priv_activity_hint",
            get: function () { return !!state.activity_visible; },
            body: function (next) { return { activity_visible: next }; } },
          { label: "sx_priv_id", hint: "sx_priv_id_hint",
            get: function () { return !state.inline_hidden; },
            body: function (next) { return { inline_hidden: !next }; } }
        ];

        function draw() {
          clear(box);
          rows.forEach(function (r) {
            var on = r.get();
            var wrap = el("div", "sp-prow");
            var row = button("setting", null, function () {
              if (saving) return;
              saving = true;
              FX.api("/api/privacy", { method: "PUT", body: r.body(!on) }).then(function (res2) {
                saving = false;
                if (res2.status !== 200) { FX.toast(netError(res2), true); return; }
                state = res2.data;
                me.is_private = state.is_private ? 1 : 0;
                me.activity_visible = state.activity_visible ? 1 : 0;
                me.inline_hidden = state.inline_hidden ? 1 : 0;
                FX.haptic();
                draw();
              }).catch(function () {
                saving = false;
                FX.toast(I18N.t("err_network"), true);
              });
            });
            var left = el("span", "setting-left");
            left.appendChild(el("span", "", lt(r.label)));
            row.appendChild(left);
            row.appendChild(el("span", "sw" + (on ? " on" : "")));
            wrap.appendChild(row);
            wrap.appendChild(el("p", "sp-phint", lt(r.hint)));
            box.appendChild(wrap);
          });
        }
        draw();
      }).catch(function () {
        clear(box);
        box.appendChild(FX.msg(I18N.t("err_network"), true));
      });
    });
  }

  // ---------- plug into the Profile tab ----------
  // Top of the profile: header picture + the bell.
  FX.hooks.profileTop = function (view, me) {
    if (!me) return;
    var bar = view.querySelector(".topbar");
    if (!bar) return;

    var bell = button("sp-bell", null, null);
    bell.setAttribute("aria-label", lt("sx_bell"));
    bell.appendChild(svg(BELL, 22));
    var badge = el("span", "sp-badge hidden", "0");
    bell.appendChild(badge);
    function setBadge(n) {
      badge.textContent = n > 99 ? "99+" : String(n);
      badge.classList.toggle("hidden", !(n > 0));
    }
    bell.addEventListener("click", function () { openBellSheet(me, setBadge); });
    bar.appendChild(bell);

    FX.api("/api/notifications").then(function (res) {
      if (res.status === 200 && bell.isConnected) setBadge(res.data.badge || 0);
    }).catch(function () {});

    var ban = banner(me.header, me.public_id);
    var edit = button("sp-edit", null, function () { openHeaderPicker(me); });
    edit.appendChild(svg(PEN, 14));
    edit.appendChild(document.createTextNode(lt("sx_header_change")));
    ban.appendChild(edit);
    bar.insertAdjacentElement("afterend", ban);
  };

  // Inside the profile card: the same numbers other people see.
  FX.hooks.profileCard = function (card, me) {
    if (!me || !me.public_id) return;
    var nameNode = card.querySelector(".profile-name");
    if (nameNode) {
      var idParts = [];
      if (me.username) idParts.push("@" + me.username);
      idParts.push(me.public_id);
      nameNode.insertAdjacentElement("afterend", el("div", "sp-idline", idParts.join(" · ")));
    }
    FX.api("/api/profile?id=" + encodeURIComponent(me.public_id)).then(function (res) {
      if (res.status !== 200 || !card.isConnected) return;
      var row = statsRow(res.data.stats, "stats sp-own-stats");
      card.appendChild(row);
    }).catch(function () {});
  };

  // Settings: a Privacy row at the top of the list.
  FX.hooks.settings = function (list, me) {
    var row = button("setting", null, function () { openPrivacySheet(me || {}); });
    var left = el("span", "setting-left");
    left.appendChild(svg(LOCK, 20));
    left.appendChild(el("span", "", lt("sx_privacy")));
    row.appendChild(left);
    var right = el("span", "setting-right");
    var chev = FX.icon("chevron", 18);
    chev.classList.add("flip");
    right.appendChild(chev);
    row.appendChild(right);
    var title = list.firstChild;
    if (title && title.nextSibling) list.insertBefore(row, title.nextSibling);
    else list.appendChild(row);
  };
})();
