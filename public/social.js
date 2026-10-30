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
      sx_people_hint: "Type a name, a Flicksy ID (at least 3 digits) or a Telegram username.",
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
      sx_n_request: "{name} wants to follow you",
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
      sx_people_hint: "یک اسم، آیدی Flicksy (حداقل ۳ رقم) یا یوزرنیم تلگرام را بنویس.",
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
      sx_n_request: "{name} می‌خواهد تو را دنبال کند",
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
      sx_people_hint: "اكتب اسماً أو معرّف Flicksy (3 أرقام على الأقل) أو اسم مستخدم تيليجرام.",
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
      sx_n_request: "يريد {name} متابعتك",
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
      sx_people_hint: "Bir isim, Flicksy kimliği (en az 3 rakam) veya Telegram kullanıcı adı yaz.",
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
      sx_n_request: "{name} seni takip etmek istiyor",
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
      sx_people_hint: "Введи имя, Flicksy ID (минимум 3 цифры) или имя пользователя Telegram.",
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
      sx_n_request: "{name} хочет подписаться на тебя",
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
      sx_people_hint: "Escribe un nombre, un ID de Flicksy (mínimo 3 dígitos) o un usuario de Telegram.",
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
      sx_n_request: "{name} quiere seguirte",
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
      sx_people_hint: "Saisis un nom, un ID Flicksy (3 chiffres minimum) ou un nom d’utilisateur Telegram.",
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
      sx_n_request: "{name} veut te suivre",
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
      sx_people_hint: "Gib einen Namen, eine Flicksy-ID (mind. 3 Ziffern) oder einen Telegram-Benutzernamen ein.",
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
      sx_n_request: "{name} möchte dir folgen",
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
      ".sp-nrow { position: relative; display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,.07); font-size: 14px; line-height: 1.55; }" +
      ".sp-nrow .sp-av { width: 40px; height: 40px; font-size: 16px; flex: none; cursor: pointer; }" +
      ".sp-nrow .sp-ntext { flex: 1; min-width: 0; text-align: start; }" +
      ".sp-nrow .sp-ntext b { font-weight: 800; }" +
      ".sp-nrow .sp-ntext small { display: block; margin-top: 1px; font-size: 12px; color: var(--muted); }" +
      ".sp-nrow.unread::after { content: ''; flex: none; width: 9px; height: 9px; border-radius: 50%; background: #ff5b8a; }" +
      ".sp-nbtns { display: flex; gap: 8px; margin-top: 8px; }" +
      ".fbtn { flex: none; padding: 7px 16px; border-radius: 99px; font-size: 12px; font-weight: 800; background: var(--grad); color: #fff; }" +
      ".fbtn.on { background: none; color: var(--muted); box-shadow: inset 0 0 0 1px rgba(255,255,255,.22); }" +
      ".sp-nposter { width: 36px; flex: none; aspect-ratio: 2 / 3; border-radius: 7px; overflow: hidden; background: #15152f; border: 1px solid var(--line); }" +
      ".sp-nposter img { width: 100%; height: 100%; object-fit: cover; }" +
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
      /* profile: the cover fades into the page and the avatar overlaps it */
      ".sp-idline { display: inline-flex; align-items: center; gap: 8px; margin-top: 8px; padding: 5px 13px; border-radius: 999px; font-size: 12.5px; color: #cfc2ff; background: rgba(139,92,246,.16); border: 1px solid rgba(168,85,247,.28); direction: ltr; }" +
      ".pf-head { position: relative; }" +
      "#view-profile { padding-top: 0; }" +
      ".pf-cover { position: relative; margin: 0 -16px; height: 250px; -webkit-mask-image: linear-gradient(#000 62%, transparent); mask-image: linear-gradient(#000 62%, transparent); }" +
      ".pf-cover .sp-banner, .spage .pf-cover .sp-banner { height: 100%; margin: 0; border: none; border-radius: 0; box-shadow: none; filter: saturate(1.35) contrast(1.1) brightness(1.06); }" +
      ".pf-cover .sp-banner::after, .spage .pf-cover .sp-banner::after { background: linear-gradient(180deg, rgba(7,7,26,.28), rgba(7,7,26,0) 40%); }" +
      ".pf-more { position: absolute; top: 16px; right: 0; z-index: 3; width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; background: rgba(7,7,26,.45); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,.14); color: #fff; }" +
      ".pf-more .ic { stroke-width: 3.4; }" +
      ".pf-mov { position: fixed; inset: 0; z-index: 35; }" +
      ".pf-menu { position: absolute; z-index: 36; top: 66px; right: 0; min-width: 215px; padding: 6px; border-radius: 18px; background: rgba(26,26,58,.96); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid var(--line); box-shadow: 0 20px 40px -10px #000; animation: rise .18s ease both; }" +
      ".pf-menu button { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 14px; border-radius: 12px; font-size: 14.5px; font-weight: 600; }" +
      ".pf-menu button:active { background: var(--surface-2); }" +
      ".pf-menu .ic { width: 19px; height: 19px; color: #b794ff; }" +
      ".pf-fg { position: relative; margin-top: -70px; }" +
      ".spage .sbody { margin-top: -70px; }" +
      ".pf-av { width: 92px; height: 92px; font-size: 36px; border: none; box-shadow: 0 0 0 4px var(--bg), 0 0 0 6px rgba(168,85,247,.85); }" +
      ".pf-name { margin-top: 14px; font-size: 30px; font-weight: 900; letter-spacing: -.8px; line-height: 1.15; }" +
      ".pf-soc { display: flex; gap: 18px; margin-top: 10px; font-size: 13px; color: #cfcfe6; }" +
      ".pf-soc b { color: #fff; }" +
      ".pf-stats { display: flex; direction: ltr; margin: 20px 0 2px; }" +
      ".pf-stat { flex: 1; text-align: center; }" +
      ".pf-stat + .pf-stat { border-inline-start: 1px solid var(--line); }" +
      ".pf-stat b { display: block; font-size: 28px; font-weight: 900; letter-spacing: -1px; }" +
      ".pf-stat span { font-size: 12px; color: var(--muted); }" +
      ".pf-tabline { display: flex; gap: 22px; border-bottom: 1px solid var(--line); margin: 24px 0 4px; }" +
      ".pf-tabline button { padding: 10px 2px; font-size: 15px; font-weight: 800; position: relative; }" +
      ".pf-tabline button::after { content: ''; position: absolute; inset-inline: 0; bottom: -1px; height: 3px; border-radius: 3px; background: var(--grad); }" +
      ".ar { display: flex; width: 100%; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,.07); text-align: start; }" +
      ".ar-po { position: relative; width: 42px; flex: none; aspect-ratio: 2 / 3; border-radius: 8px; overflow: hidden; background: #15152f; border: 1px solid var(--line); }" +
      ".ar-po .poster { width: 100%; height: 100%; object-fit: cover; }" +
      ".ar-tx { flex: 1; min-width: 0; }" +
      ".ar-tx b { display: block; font-size: 14.5px; font-weight: 800; line-height: 1.45; }" +
      ".ar-tx small { font-size: 12px; color: var(--muted); }" +
      ".ar-sc { display: flex; gap: 3px; align-items: center; color: var(--star); font-weight: 800; font-size: 14px; }" +
      ".pf-showmore { display: block; width: 100%; padding: 16px 0 6px; text-align: center; font-size: 14px; font-weight: 700; color: #c9b6ff; }" +
      ".pf-empty { margin: 30px 10px; text-align: center; color: var(--muted); line-height: 1.9; font-size: 14px; }" +
      ".sheet .settings { margin-top: 0; }" +
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
    var valid = digits ? raw.length >= 3 && raw.length <= 8 : (Array.from(raw).length >= 2 && raw.length <= 40);
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

  // ---------- profile pieces shared by your profile and other people's ----------
  function pfStat(label, value) {
    var d = el("div", "pf-stat");
    d.appendChild(el("b", "", String(value)));
    d.appendChild(el("span", "", label));
    return d;
  }

  function socLine(stats) {
    var soc = el("div", "pf-soc");
    function part(n, label) {
      var sp = el("span");
      sp.appendChild(el("b", "", String(n || 0)));
      sp.appendChild(document.createTextNode(" " + label));
      return sp;
    }
    soc.appendChild(part(stats && stats.followers, lt("sx_followers")));
    soc.appendChild(part(stats && stats.following, lt("sx_following_n")));
    return soc;
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
    var cover = el("div", "pf-cover");
    cover.appendChild(banner(pr.header, pr.public_id));
    scroller.appendChild(cover);
    root.appendChild(back);

    var body = el("div", "sbody");
    scroller.appendChild(body);

    body.appendChild(avatar(pr, "pf-av"));
    body.appendChild(el("div", "pf-name", pr.display_name || ""));
    var sub = [];
    if (pr.username) sub.push("@" + pr.username);
    sub.push(pr.public_id);
    body.appendChild(el("div", "sp-idline", sub.join(" · ")));
    if (pr.is_private) {
      var ptag = el("div");
      ptag.appendChild(el("span", "tag sp-priv-tag", lt("sx_private_badge")));
      ptag.style.marginTop = "8px";
      body.appendChild(ptag);
    }
    body.appendChild(socLine(d.stats));

    if (d.relation !== "self") {
      var act = el("div", "sp-act");
      var st = { public_id: pr.public_id, display_name: pr.display_name, relation: d.relation, is_private: pr.is_private };
      var btn = relButton(st, function () { loadProfile(p, true); });
      btn.classList.add("block");
      act.appendChild(btn);
      body.appendChild(act);
    }

    var vstats = el("div", "pf-stats");
    vstats.appendChild(pfStat(lt("sx_movies"), (d.stats && d.stats.movies) || 0));
    vstats.appendChild(pfStat(lt("sx_episodes"), (d.stats && d.stats.episodes) || 0));
    vstats.appendChild(pfStat(I18N.t("pf_lists"), d.lists_locked ? "–" : d.lists.length));
    body.appendChild(vstats);

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
  // "2 hours ago" in the app language (the server sends UTC times like 2026-10-30 09:09:36)
  function ago(at) {
    if (!at) return "";
    var d = new Date(String(at).replace(" ", "T") + "Z");
    if (isNaN(d.getTime())) return "";
    var sec = Math.round((d.getTime() - Date.now()) / 1000);
    if (sec > 0) sec = 0; // a slightly fast phone clock must never say "in 2 seconds"
    var abs = Math.abs(sec);
    var unit = "second", val = sec;
    if (abs >= 86400) { unit = "day"; val = Math.round(sec / 86400); }
    else if (abs >= 3600) { unit = "hour"; val = Math.round(sec / 3600); }
    else if (abs >= 60) { unit = "minute"; val = Math.round(sec / 60); }
    try { return new Intl.RelativeTimeFormat(I18N.lang, { numeric: "auto" }).format(val, unit); } catch (e) { return d.toLocaleDateString(); }
  }

  // Puts the person's name in bold inside a translated sentence like "{name} started following you".
  function nameText(text, name) {
    var node = el("div", "sp-ntext");
    var parts = text.split("\u0000");
    node.appendChild(document.createTextNode(parts[0]));
    if (parts.length > 1) {
      var b = el("b");
      var bd = el("bdi", "", name || "");
      b.appendChild(bd);
      node.appendChild(b);
      node.appendChild(document.createTextNode(parts.slice(1).join("")));
    }
    return node;
  }

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

          reqs.forEach(function (r) {
            var row = el("div", "sp-nrow");
            var av = avatar(r);
            av.addEventListener("click", function () { goProfile(r.public_id); });
            row.appendChild(av);
            var text = nameText(lt("sx_n_request", { name: "\u0000" }), r.display_name);
            var ts = ago(r.at);
            if (ts) text.appendChild(el("small", "", ts));
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
            btns.appendChild(button("fbtn", lt("sx_accept"), function () { answer("accept"); }));
            btns.appendChild(button("fbtn on", lt("sx_decline"), function () { answer("decline"); }));
            text.appendChild(btns);
            row.appendChild(text);
            box.appendChild(row);
          });

          items.forEach(function (n) {
            var row = el("div", "sp-nrow" + (n.read ? "" : " unread"));
            row.style.cursor = "pointer";
            var text;
            if (FX.features && FX.features.reminders && n.type === "ep" && n.title) {
              // new-episode alert: a small poster instead of an avatar (switched on together with the backend)
              var po = el("div", "sp-nposter");
              if (n.poster) { var pi = el("img"); pi.src = n.poster; pi.alt = ""; po.appendChild(pi); }
              row.appendChild(po);
              text = el("div", "sp-ntext");
              text.innerHTML = "";
              text.appendChild(document.createTextNode(lt("ep_n", { name: n.title, ep: "S" + (n.season || 1) + "E" + (n.episode || 1) })));
              row.addEventListener("click", function () {
                FX.closeSheet();
                if (FX.openDetail) FX.openDetail({ tmdb_id: n.tmdb_id, media_type: "tv", title: n.title, poster: n.poster || null });
              });
            } else {
              var av = avatar(n.person);
              row.appendChild(av);
              var key = n.type === "request_accepted" ? "sx_n_accepted" : "sx_n_follow";
              text = nameText(lt(key, { name: "\u0000" }), n.person.display_name);
              row.addEventListener("click", function () { goProfile(n.person.public_id); });
            }
            var ts2 = ago(n.at);
            if (ts2) text.appendChild(el("small", "", ts2));
            row.appendChild(text);
            box.appendChild(row);
          });
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

  // ---------- plug into the Home tab ----------
  // Top right of Home: the notification bell (it used to live at the top of the Profile tab).
  FX.hooks.homeTop = function (slot, me) {
    if (!me) return;
    var bell = button("hbell", null, null);
    bell.setAttribute("aria-label", lt("sx_bell"));
    bell.appendChild(svg(BELL, 22));
    var dot = el("i", "dot-new hidden");
    bell.appendChild(dot);
    function setBadge(n) { dot.classList.toggle("hidden", !(n > 0)); }
    bell.addEventListener("click", function () { openBellSheet(me, setBadge); });
    slot.appendChild(bell);

    FX.api("/api/notifications").then(function (res) {
      if (res.status === 200 && bell.isConnected) setBadge(res.data.badge || 0);
    }).catch(function () {});
  };

  // ---------- plug into the Profile tab ----------
  var MORE = ["M12 5h.01", "M12 12h.01", "M12 19h.01"];
  var SHARE = ["M12 3v12", "M7 8l5-5 5 5", "M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"];
  var SPARK = ["M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"];

  function shareProfile(me) {
    var link = "https://t.me/flicksyrobot?startapp=user-" + me.public_id;
    var text = I18N.t("pf_share_text", { name: me.display_name || "Flicksy" });
    var url = "https://t.me/share/url?url=" + encodeURIComponent(link) + "&text=" + encodeURIComponent(text);
    try {
      var tg = window.Telegram && Telegram.WebApp;
      if (tg && tg.openTelegramLink) { tg.openTelegramLink(url); return; }
    } catch (e) {}
    window.open(url, "_blank");
  }

  function openMenu(head, me) {
    var ov = el("div", "pf-mov");
    var menu = el("div", "pf-menu");
    function close() { ov.remove(); menu.remove(); }
    function item(path, label, fn) {
      var b = button("", null, function () { close(); fn(); });
      b.appendChild(svg(path, 19));
      b.appendChild(document.createTextNode(label));
      menu.appendChild(b);
    }
    item(SHARE, I18N.t("pf_share"), function () { shareProfile(me); });
    item(PEN, lt("sx_header_change"), function () { openHeaderPicker(me); });
    item(SPARK, I18N.t("pf_yir"), function () { FX.toast(I18N.t("pf_soon")); });
    item(["M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"], I18N.t("settings"), function () { if (FX.openSettings) FX.openSettings(); });
    ov.addEventListener("click", close);
    head.appendChild(ov);
    head.appendChild(menu);
  }

  // Top of the profile: cover, avatar, name, counts, the three-dot menu and the numbers.
  FX.hooks.profileHead = function (view, me) {
    if (!me) return;
    var head = el("div", "pf-head");
    var cover = el("div", "pf-cover");
    cover.appendChild(banner(me.header, me.public_id));
    head.appendChild(cover);

    var more = button("pf-more", null, function () { openMenu(head, me); });
    more.setAttribute("aria-label", I18N.t("settings"));
    more.appendChild(svg(MORE, 22));
    head.appendChild(more);

    var fg = el("div", "pf-fg");
    fg.appendChild(avatar(me, "pf-av"));
    fg.appendChild(el("div", "pf-name", me.display_name || ""));
    if (me.public_id) {
      var idParts = [];
      if (me.username) idParts.push("@" + me.username);
      idParts.push(me.public_id);
      fg.appendChild(el("div", "sp-idline", idParts.join(" · ")));
    }
    var socHolder = el("div");
    fg.appendChild(socHolder);
    head.appendChild(fg);
    view.appendChild(head);

    var sMovies = pfStat(lt("sx_movies"), "–");
    var sEps = pfStat(lt("sx_episodes"), "–");
    var sLists = pfStat(I18N.t("pf_lists"), "–");
    var stats = el("div", "pf-stats");
    stats.appendChild(sMovies);
    stats.appendChild(sEps);
    stats.appendChild(sLists);
    view.appendChild(stats);

    if (!me.public_id) return;
    FX.api("/api/profile?id=" + encodeURIComponent(me.public_id)).then(function (res) {
      if (res.status !== 200 || !head.isConnected) return;
      var st = res.data.stats || {};
      sMovies.firstChild.textContent = String(st.movies || 0);
      sEps.firstChild.textContent = String(st.episodes || 0);
      clear(socHolder);
      socHolder.appendChild(socLine(st));
    }).catch(function () {});
    FX.api("/api/lists").then(function (res) {
      if (res.status !== 200 || !head.isConnected) return;
      sLists.firstChild.textContent = String((res.data.lists || []).length);
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
