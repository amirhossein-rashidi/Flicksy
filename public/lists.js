(function () {
  "use strict";

  var FX = window.FX;
  if (!FX || !window.I18N) return;

  var el = FX.el, clear = FX.clear, button = FX.button, icon = FX.icon;

  // ---------- texts (8 languages; English is the fallback) ----------
  var STR = {
    en: {
      lists_title: "My lists", list_new: "New list", list_add: "Add to list",
      list_name: "List name", list_name_ph: "e.g. Best of the year", list_desc: "Description (optional)",
      list_vis: "Who can see it", vis_private: "Only me", vis_unlisted: "Anyone with the link", vis_public: "Public",
      list_create: "Create list", list_edit: "Edit list", list_delete: "Delete list", list_delete_confirm: "Tap again to confirm",
      list_empty: "This list is empty. Open a movie or series and tap the list button to add it.",
      list_none: "No lists yet. Create one to group your favorites.",
      list_count: "Titles: {n}", list_by: "by {name}", list_remove_mode: "Remove titles", list_done: "Done",
      list_added: "Added to “{name}”", list_removed: "Removed from “{name}”",
      list_created: "List created", list_saved: "Saved", list_deleted: "List deleted",
      list_full: "This list is full (200 titles).", list_too_many: "You've reached the limit of 50 lists.",
      list_name_required: "Give your list a name.", list_not_found: "This list doesn't exist or it is private."
    },
    fa: {
      lists_title: "لیست‌های من", list_new: "لیست جدید", list_add: "افزودن به لیست",
      list_name: "نام لیست", list_name_ph: "مثلاً بهترین‌های امسال", list_desc: "توضیح (اختیاری)",
      list_vis: "چه کسی می‌تواند ببیند", vis_private: "فقط خودم", vis_unlisted: "هر کسی که لینک را دارد", vis_public: "عمومی",
      list_create: "ساخت لیست", list_edit: "ویرایش لیست", list_delete: "حذف لیست", list_delete_confirm: "برای تأیید دوباره بزن",
      list_empty: "این لیست خالی است. یک فیلم یا سریال را باز کن و دکمهٔ لیست را بزن.",
      list_none: "هنوز لیستی نساخته‌ای. یکی بساز و مورد علاقه‌هایت را دسته‌بندی کن.",
      list_count: "{n} عنوان", list_by: "از {name}", list_remove_mode: "حذف عنوان‌ها", list_done: "تمام",
      list_added: "به «{name}» اضافه شد", list_removed: "از «{name}» حذف شد",
      list_created: "لیست ساخته شد", list_saved: "ذخیره شد", list_deleted: "لیست حذف شد",
      list_full: "این لیست پر است (۲۰۰ عنوان).", list_too_many: "به سقف ۵۰ لیست رسیده‌ای.",
      list_name_required: "برای لیست یک نام بنویس.", list_not_found: "این لیست وجود ندارد یا خصوصی است."
    },
    ar: {
      lists_title: "قوائمي", list_new: "قائمة جديدة", list_add: "أضف إلى قائمة",
      list_name: "اسم القائمة", list_name_ph: "مثلاً: أفضل أفلام العام", list_desc: "الوصف (اختياري)",
      list_vis: "من يمكنه الاطلاع", vis_private: "أنا فقط", vis_unlisted: "كل من لديه الرابط", vis_public: "عامة",
      list_create: "إنشاء القائمة", list_edit: "تعديل القائمة", list_delete: "حذف القائمة", list_delete_confirm: "اضغط مرة أخرى للتأكيد",
      list_empty: "هذه القائمة فارغة. افتح فيلماً أو مسلسلاً واضغط زر القائمة لإضافته.",
      list_none: "لم تنشئ أي قائمة بعد. أنشئ واحدة لتجمع فيها مفضلاتك.",
      list_count: "{n} عنوان", list_by: "بواسطة {name}", list_remove_mode: "إزالة عناوين", list_done: "تم",
      list_added: "تمت الإضافة إلى «{name}»", list_removed: "تمت الإزالة من «{name}»",
      list_created: "تم إنشاء القائمة", list_saved: "تم الحفظ", list_deleted: "تم حذف القائمة",
      list_full: "القائمة ممتلئة (200 عنوان).", list_too_many: "وصلت إلى الحد الأقصى: 50 قائمة.",
      list_name_required: "اكتب اسماً للقائمة.", list_not_found: "هذه القائمة غير موجودة أو خاصة."
    },
    tr: {
      lists_title: "Listelerim", list_new: "Yeni liste", list_add: "Listeye ekle",
      list_name: "Liste adı", list_name_ph: "örn. Yılın en iyileri", list_desc: "Açıklama (isteğe bağlı)",
      list_vis: "Kimler görebilir", vis_private: "Sadece ben", vis_unlisted: "Bağlantıya sahip herkes", vis_public: "Herkese açık",
      list_create: "Listeyi oluştur", list_edit: "Listeyi düzenle", list_delete: "Listeyi sil", list_delete_confirm: "Onaylamak için tekrar dokun",
      list_empty: "Bu liste boş. Bir film veya dizi açıp liste düğmesine dokun.",
      list_none: "Henüz liste oluşturmadın. Favorilerini gruplamak için bir tane oluştur.",
      list_count: "{n} yapım", list_by: "{name} tarafından", list_remove_mode: "Yapım çıkar", list_done: "Bitti",
      list_added: "“{name}” listesine eklendi", list_removed: "“{name}” listesinden çıkarıldı",
      list_created: "Liste oluşturuldu", list_saved: "Kaydedildi", list_deleted: "Liste silindi",
      list_full: "Bu liste dolu (200 yapım).", list_too_many: "50 liste sınırına ulaştın.",
      list_name_required: "Listene bir ad ver.", list_not_found: "Bu liste yok ya da gizli."
    },
    ru: {
      lists_title: "Мои списки", list_new: "Новый список", list_add: "Добавить в список",
      list_name: "Название списка", list_name_ph: "например, Лучшее за год", list_desc: "Описание (необязательно)",
      list_vis: "Кто может видеть", vis_private: "Только я", vis_unlisted: "Все, у кого есть ссылка", vis_public: "Публичный",
      list_create: "Создать список", list_edit: "Изменить список", list_delete: "Удалить список", list_delete_confirm: "Нажмите ещё раз для подтверждения",
      list_empty: "Список пуст. Откройте фильм или сериал и нажмите кнопку списка.",
      list_none: "Списков пока нет. Создайте первый, чтобы собрать любимое.",
      list_count: "Тайтлов: {n}", list_by: "автор: {name}", list_remove_mode: "Убрать тайтлы", list_done: "Готово",
      list_added: "Добавлено в «{name}»", list_removed: "Убрано из «{name}»",
      list_created: "Список создан", list_saved: "Сохранено", list_deleted: "Список удалён",
      list_full: "Список заполнен (200 тайтлов).", list_too_many: "Достигнут лимит в 50 списков.",
      list_name_required: "Укажите название списка.", list_not_found: "Такого списка нет, или он приватный."
    },
    es: {
      lists_title: "Mis listas", list_new: "Nueva lista", list_add: "Añadir a una lista",
      list_name: "Nombre de la lista", list_name_ph: "p. ej. Lo mejor del año", list_desc: "Descripción (opcional)",
      list_vis: "Quién puede verla", vis_private: "Solo yo", vis_unlisted: "Cualquiera con el enlace", vis_public: "Pública",
      list_create: "Crear lista", list_edit: "Editar lista", list_delete: "Eliminar lista", list_delete_confirm: "Toca otra vez para confirmar",
      list_empty: "Esta lista está vacía. Abre una película o serie y toca el botón de listas.",
      list_none: "Aún no tienes listas. Crea una para agrupar tus favoritas.",
      list_count: "{n} títulos", list_by: "por {name}", list_remove_mode: "Quitar títulos", list_done: "Listo",
      list_added: "Añadido a «{name}»", list_removed: "Quitado de «{name}»",
      list_created: "Lista creada", list_saved: "Guardado", list_deleted: "Lista eliminada",
      list_full: "Esta lista está llena (200 títulos).", list_too_many: "Has llegado al límite de 50 listas.",
      list_name_required: "Ponle un nombre a tu lista.", list_not_found: "Esta lista no existe o es privada."
    },
    fr: {
      lists_title: "Mes listes", list_new: "Nouvelle liste", list_add: "Ajouter à une liste",
      list_name: "Nom de la liste", list_name_ph: "p. ex. Le meilleur de l'année", list_desc: "Description (facultatif)",
      list_vis: "Qui peut la voir", vis_private: "Moi seul", vis_unlisted: "Toute personne avec le lien", vis_public: "Publique",
      list_create: "Créer la liste", list_edit: "Modifier la liste", list_delete: "Supprimer la liste", list_delete_confirm: "Touche encore pour confirmer",
      list_empty: "Cette liste est vide. Ouvre un film ou une série et touche le bouton des listes.",
      list_none: "Tu n'as pas encore de liste. Crées-en une pour regrouper tes favoris.",
      list_count: "{n} titres", list_by: "par {name}", list_remove_mode: "Retirer des titres", list_done: "Terminé",
      list_added: "Ajouté à « {name} »", list_removed: "Retiré de « {name} »",
      list_created: "Liste créée", list_saved: "Enregistré", list_deleted: "Liste supprimée",
      list_full: "Cette liste est pleine (200 titres).", list_too_many: "Tu as atteint la limite de 50 listes.",
      list_name_required: "Donne un nom à ta liste.", list_not_found: "Cette liste n'existe pas ou elle est privée."
    },
    de: {
      lists_title: "Meine Listen", list_new: "Neue Liste", list_add: "Zu Liste hinzufügen",
      list_name: "Name der Liste", list_name_ph:
