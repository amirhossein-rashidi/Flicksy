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
      list_empty: "This list is empty. Tap “Add titles” to fill it.",
      list_add_titles: "Add titles", pick_search: "Search", pick_mine: "My titles",
      pick_hint: "Tap a title to add it or remove it.",
      list_none: "No lists yet. Create one to group your favorites.",
      list_count: "Titles: {n}", list_by: "by {name}", list_remove_mode: "Remove titles", list_done: "Done",
      list_added: "Added to “{name}”", list_removed: "Removed from “{name}”",
      list_created: "List created", list_saved: "Saved", list_deleted: "List deleted",
      list_full: "This list is full (200 titles).", list_too_many: "You've reached the limit of 50 lists.",
      list_name_required: "Give your list a name.", list_not_found: "This list doesn't exist or it is private.",
      list_share: "Share", share_text: "“{name}” — a list on Flicksy",
      share_private: "This list is private. Edit it and choose “{vis}” to share it.", link_copied: "Link copied",
      share_tagline: "Track movies & series with friends in Telegram", share_preparing: "Preparing the card…"
    },
    fa: {
      lists_title: "لیست‌های من", list_new: "لیست جدید", list_add: "افزودن به لیست",
      list_name: "نام لیست", list_name_ph: "مثلاً بهترین‌های امسال", list_desc: "توضیح (اختیاری)",
      list_vis: "چه کسی می‌تواند ببیند", vis_private: "فقط خودم", vis_unlisted: "هر کسی که لینک را دارد", vis_public: "عمومی",
      list_create: "ساخت لیست", list_edit: "ویرایش لیست", list_delete: "حذف لیست", list_delete_confirm: "برای تأیید دوباره بزن",
      list_empty: "این لیست خالی است. روی «افزودن عنوان» بزن.",
      list_add_titles: "افزودن عنوان", pick_search: "جست‌وجو", pick_mine: "عنوان‌های من",
      pick_hint: "روی عنوان بزن تا اضافه یا حذف شود.",
      list_none: "هنوز لیستی نساخته‌ای. یکی بساز و مورد علاقه‌هایت را دسته‌بندی کن.",
      list_count: "{n} عنوان", list_by: "از {name}", list_remove_mode: "حذف عنوان‌ها", list_done: "تمام",
      list_added: "به «{name}» اضافه شد", list_removed: "از «{name}» حذف شد",
      list_created: "لیست ساخته شد", list_saved: "ذخیره شد", list_deleted: "لیست حذف شد",
      list_full: "این لیست پر است (۲۰۰ عنوان).", list_too_many: "به سقف ۵۰ لیست رسیده‌ای.",
      list_name_required: "برای لیست یک نام بنویس.", list_not_found: "این لیست وجود ندارد یا خصوصی است.",
      list_share: "اشتراک‌گذاری", share_text: "«{name}» — یک لیست در Flicksy",
      share_private: "این لیست خصوصی است. ویرایشش کن و «{vis}» را انتخاب کن.", link_copied: "لینک کپی شد",
      share_tagline: "ردیابی فیلم و سریال با دوستان در تلگرام", share_preparing: "در حال ساخت کارت…"
    },
    ar: {
      lists_title: "قوائمي", list_new: "قائمة جديدة", list_add: "أضف إلى قائمة",
      list_name: "اسم القائمة", list_name_ph: "مثلاً: أفضل أفلام العام", list_desc: "الوصف (اختياري)",
      list_vis: "من يمكنه الاطلاع", vis_private: "أنا فقط", vis_unlisted: "كل من لديه الرابط", vis_public: "عامة",
      list_create: "إنشاء القائمة", list_edit: "تعديل القائمة", list_delete: "حذف القائمة", list_delete_confirm: "اضغط مرة أخرى للتأكيد",
      list_empty: "هذه القائمة فارغة. اضغط «إضافة عناوين» لملئها.",
      list_add_titles: "إضافة عناوين", pick_search: "بحث", pick_mine: "عناويني",
      pick_hint: "اضغط على عنوان لإضافته أو إزالته.",
      list_none: "لم تنشئ أي قائمة بعد. أنشئ واحدة لتجمع فيها مفضلاتك.",
      list_count: "{n} عنوان", list_by: "بواسطة {name}", list_remove_mode: "إزالة عناوين", list_done: "تم",
      list_added: "تمت الإضافة إلى «{name}»", list_removed: "تمت الإزالة من «{name}»",
      list_created: "تم إنشاء القائمة", list_saved: "تم الحفظ", list_deleted: "تم حذف القائمة",
      list_full: "القائمة ممتلئة (200 عنوان).", list_too_many: "وصلت إلى الحد الأقصى: 50 قائمة.",
      list_name_required: "اكتب اسماً للقائمة.", list_not_found: "هذه القائمة غير موجودة أو خاصة.",
      list_share: "مشاركة", share_text: "«{name}» — قائمة على Flicksy",
      share_private: "هذه القائمة خاصة. عدّلها واختر «{vis}» لمشاركتها.", link_copied: "تم نسخ الرابط",
      share_tagline: "تابع الأفلام والمسلسلات مع أصدقائك في تيليجرام", share_preparing: "جارٍ إعداد البطاقة…"
    },
    tr: {
      lists_title: "Listelerim", list_new: "Yeni liste", list_add: "Listeye ekle",
      list_name: "Liste adı", list_name_ph: "örn. Yılın en iyileri", list_desc: "Açıklama (isteğe bağlı)",
      list_vis: "Kimler görebilir", vis_private: "Sadece ben", vis_unlisted: "Bağlantıya sahip herkes", vis_public: "Herkese açık",
      list_create: "Listeyi oluştur", list_edit: "Listeyi düzenle", list_delete: "Listeyi sil", list_delete_confirm: "Onaylamak için tekrar dokun",
      list_empty: "Bu liste boş. Doldurmak için “Yapım ekle”ye dokun.",
      list_add_titles: "Yapım ekle", pick_search: "Ara", pick_mine: "Yapımlarım",
      pick_hint: "Eklemek veya çıkarmak için bir yapıma dokun.",
      list_none: "Henüz liste oluşturmadın. Favorilerini gruplamak için bir tane oluştur.",
      list_count: "{n} yapım", list_by: "{name} tarafından", list_remove_mode: "Yapım çıkar", list_done: "Bitti",
      list_added: "“{name}” listesine eklendi", list_removed: "“{name}” listesinden çıkarıldı",
      list_created: "Liste oluşturuldu", list_saved: "Kaydedildi", list_deleted: "Liste silindi",
      list_full: "Bu liste dolu (200 yapım).", list_too_many: "50 liste sınırına ulaştın.",
      list_name_required: "Listene bir ad ver.", list_not_found: "Bu liste yok ya da gizli.",
      list_share: "Paylaş", share_text: "“{name}” — Flicksy’de bir liste",
      share_private: "Bu liste özel. Düzenleyip “{vis}” seçeneğini seç.", link_copied: "Bağlantı kopyalandı",
      share_tagline: "Telegram’da arkadaşlarınla film ve dizi takibi yap", share_preparing: "Kart hazırlanıyor…"
    },
    ru: {
      lists_title: "Мои списки", list_new: "Новый список", list_add: "Добавить в список",
      list_name: "Название списка", list_name_ph: "например, Лучшее за год", list_desc: "Описание (необязательно)",
      list_vis: "Кто может видеть", vis_private: "Только я", vis_unlisted: "Все, у кого есть ссылка", vis_public: "Публичный",
      list_create: "Создать список", list_edit: "Изменить список", list_delete: "Удалить список", list_delete_confirm: "Нажмите ещё раз для подтверждения",
      list_empty: "Список пуст. Нажмите «Добавить тайтлы».",
      list_add_titles: "Добавить тайтлы", pick_search: "Поиск", pick_mine: "Мои тайтлы",
      pick_hint: "Нажмите на тайтл, чтобы добавить или убрать.",
      list_none: "Списков пока нет. Создайте первый, чтобы собрать любимое.",
      list_count: "Тайтлов: {n}", list_by: "автор: {name}", list_remove_mode: "Убрать тайтлы", list_done: "Готово",
      list_added: "Добавлено в «{name}»", list_removed: "Убрано из «{name}»",
      list_created: "Список создан", list_saved: "Сохранено", list_deleted: "Список удалён",
      list_full: "Список заполнен (200 тайтлов).", list_too_many: "Достигнут лимит в 50 списков.",
      list_name_required: "Укажите название списка.", list_not_found: "Такого списка нет, или он приватный.",
      list_share: "Поделиться", share_text: "«{name}» — список во Flicksy",
      share_private: "Этот список приватный. Измени его и выбери «{vis}».", link_copied: "Ссылка скопирована",
      share_tagline: "Следи за фильмами и сериалами вместе с друзьями в Telegram", share_preparing: "Готовлю карточку…"
    },
    es: {
      lists_title: "Mis listas", list_new: "Nueva lista", list_add: "Añadir a una lista",
      list_name: "Nombre de la lista", list_name_ph: "p. ej. Lo mejor del año", list_desc: "Descripción (opcional)",
      list_vis: "Quién puede verla", vis_private: "Solo yo", vis_unlisted: "Cualquiera con el enlace", vis_public: "Pública",
      list_create: "Crear lista", list_edit: "Editar lista", list_delete: "Eliminar lista", list_delete_confirm: "Toca otra vez para confirmar",
      list_empty: "Esta lista está vacía. Toca «Añadir títulos» para llenarla.",
      list_add_titles: "Añadir títulos", pick_search: "Buscar", pick_mine: "Mis títulos",
      pick_hint: "Toca un título para añadirlo o quitarlo.",
      list_none: "Aún no tienes listas. Crea una para agrupar tus favoritas.",
      list_count: "{n} títulos", list_by: "por {name}", list_remove_mode: "Quitar títulos", list_done: "Listo",
      list_added: "Añadido a «{name}»", list_removed: "Quitado de «{name}»",
      list_created: "Lista creada", list_saved: "Guardado", list_deleted: "Lista eliminada",
      list_full: "Esta lista está llena (200 títulos).", list_too_many: "Has llegado al límite de 50 listas.",
      list_name_required: "Ponle un nombre a tu lista.", list_not_found: "Esta lista no existe o es privada.",
      list_share: "Compartir", share_text: "«{name}» — una lista en Flicksy",
      share_private: "Esta lista es privada. Edítala y elige «{vis}» para compartirla.", link_copied: "Enlace copiado",
      share_tagline: "Sigue películas y series con tus amigos en Telegram", share_preparing: "Preparando la tarjeta…"
    },
    fr: {
      lists_title: "Mes listes", list_new: "Nouvelle liste", list_add: "Ajouter à une liste",
      list_name: "Nom de la liste", list_name_ph: "p. ex. Le meilleur de l'année", list_desc: "Description (facultatif)",
      list_vis: "Qui peut la voir", vis_private: "Moi seul", vis_unlisted: "Toute personne avec le lien", vis_public: "Publique",
      list_create: "Créer la liste", list_edit: "Modifier la liste", list_delete: "Supprimer la liste", list_delete_confirm: "Touche encore pour confirmer",
      list_empty: "Cette liste est vide. Touche « Ajouter des titres » pour la remplir.",
      list_add_titles: "Ajouter des titres", pick_search: "Recherche", pick_mine: "Mes titres",
      pick_hint: "Touche un titre pour l'ajouter ou le retirer.",
      list_none: "Tu n'as pas encore de liste. Crées-en une pour regrouper tes favoris.",
      list_count: "{n} titres", list_by: "par {name}", list_remove_mode: "Retirer des titres", list_done: "Terminé",
      list_added: "Ajouté à « {name} »", list_removed: "Retiré de « {name} »",
      list_created: "Liste créée", list_saved: "Enregistré", list_deleted: "Liste supprimée",
      list_full: "Cette liste est pleine (200 titres).", list_too_many: "Tu as atteint la limite de 50 listes.",
      list_name_required: "Donne un nom à ta liste.", list_not_found: "Cette liste n'existe pas ou elle est privée.",
      list_share: "Partager", share_text: "« {name} » — une liste sur Flicksy",
      share_private: "Cette liste est privée. Modifie-la et choisis « {vis} » pour la partager.", link_copied: "Lien copié",
      share_tagline: "Suis tes films et séries avec tes amis sur Telegram", share_preparing: "Préparation de la carte…"
    },
    de: {
      lists_title: "Meine Listen", list_new: "Neue Liste", list_add: "Zu Liste hinzufügen",
      list_name: "Name der Liste", list_name_ph: "z. B. Beste des Jahres", list_desc: "Beschreibung (optional)",
      list_vis: "Wer darf sie sehen", vis_private: "Nur ich", vis_unlisted: "Jeder mit dem Link", vis_public: "Öffentlich",
      list_create: "Liste erstellen", list_edit: "Liste bearbeiten", list_delete: "Liste löschen", list_delete_confirm: "Zum Bestätigen nochmal tippen",
      list_empty: "Diese Liste ist leer. Tippe auf „Titel hinzufügen“, um sie zu füllen.",
      list_add_titles: "Titel hinzufügen", pick_search: "Suche", pick_mine: "Meine Titel",
      pick_hint: "Tippe auf einen Titel, um ihn hinzuzufügen oder zu entfernen.",
      list_none: "Du hast noch keine Listen. Erstelle eine, um deine Favoriten zu sammeln.",
      list_count: "{n} Titel", list_by: "von {name}", list_remove_mode: "Titel entfernen", list_done: "Fertig",
      list_added: "Zu „{name}“ hinzugefügt", list_removed: "Aus „{name}“ entfernt",
      list_created: "Liste erstellt", list_saved: "Gespeichert", list_deleted: "Liste gelöscht",
      list_full: "Diese Liste ist voll (200 Titel).", list_too_many: "Du hast das Limit von 50 Listen erreicht.",
      list_name_required: "Gib deiner Liste einen Namen.", list_not_found: "Diese Liste gibt es nicht oder sie ist privat.",
      list_share: "Teilen", share_text: "„{name}“ — eine Liste auf Flicksy",
      share_private: "Diese Liste ist privat. Bearbeite sie und wähle „{vis}“ zum Teilen.", link_copied: "Link kopiert",
      share_tagline: "Verfolge Filme und Serien mit Freunden in Telegram", share_preparing: "Karte wird erstellt…"
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

  // ---------- helpers ----------
  var cache = { lists: null };
  var page = null;     // the list page that is open right now (or null)

  function visLabel(v) { return lt("vis_" + v); }

  function offline() { FX.toast(I18N.t("err_network"), true); }

  function fail(res) {
    var e = res && res.data && res.data.error;
    if (e === "list_full") FX.toast(lt("list_full"), true);
    else if (e === "too_many_lists") FX.toast(lt("list_too_many"), true);
    else if (e === "bad_title") FX.toast(lt("list_name_required"), true);
    else FX.toast(FX.problem(res, "err_save"), true);
  }

  // Loads the user's lists. With an item, each list also says whether it has that title.
  function fetchLists(item) {
    var path = "/api/lists";
    if (item) path += "?tmdb_id=" + item.tmdb_id + "&media_type=" + item.media_type;
    return FX.api(path).then(function (res) {
      if (res.status !== 200) return null;
      var lists = res.data.lists || [];
      if (!item) cache.lists = lists;
      return lists;
    }).catch(function () { return null; });
  }

  function mosaic(posters) {
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

  function listCard(l) {
    var card = button("lcard", null, function () { openListPage({ id: l.id }); });
    card.appendChild(mosaic(l.posters || []));
    card.appendChild(el("div", "ptitle", l.title));
    card.appendChild(el("div", "psub", lt("list_count", { n: l.count })));
    return card;
  }

  function newCard(handler) {
    var card = button("lcard", null, handler);
    var box = el("div", "lnew-box");
    box.appendChild(icon("plus", 26));
    card.appendChild(box);
    card.appendChild(el("div", "ptitle", lt("list_new")));
    return card;
  }

  // ---------- create / edit form ----------
  function openForm(opts) {
    var list = opts.list || null;
    var vis = list ? list.visibility : "unlisted";
    var busy = false;
    var confirming = false;

    FX.openSheet(function (sh) {
      sh.appendChild(el("h3", "sheet-title", lt(list ? "list_edit" : "list_new")));

      sh.appendChild(el("div", "label", lt("list_name")));
      var name = el("input", "field");
      name.type = "text";
      name.maxLength = 60;
      name.placeholder = lt("list_name_ph");
      name.value = list ? list.title : "";
      sh.appendChild(name);

      sh.appendChild(el("div", "label", lt("list_desc")));
      var desc = el("textarea", "field");
      desc.rows = 3;
      desc.maxLength = 300;
      desc.value = list ? (list.description || "") : "";
      sh.appendChild(desc);

      sh.appendChild(el("div", "label", lt("list_vis")));
      var pills = el("div", "pills");
      sh.appendChild(pills);
      function drawPills() {
        clear(pills);
        ["private", "unlisted", "public"].forEach(function (v) {
          pills.appendChild(button("pill" + (vis === v ? " sel" : ""), visLabel(v), function () { vis = v; drawPills(); }));
        });
      }
      drawPills();

      var actions = el("div", "sheet-actions");
      var save = button("btn primary", list ? I18N.t("btn_save") : lt("list_create"));
      actions.appendChild(save);
      var del = null;
      if (list) {
        del = button("btn danger", lt("list_delete"));
        actions.appendChild(del);
      }
      actions.appendChild(button("btn glass", I18N.t("btn_close"), FX.closeSheet));
      sh.appendChild(actions);

      save.addEventListener("click", function () {
        if (busy) return;
        var title = name.value.trim();
        if (!title) { FX.toast(lt("list_name_required"), true); return; }
        busy = true;
        save.disabled = true;
        var body = { title: title, description: desc.value.trim(), visibility: vis };
        if (list) body.id = list.id;
        FX.api("/api/lists", { method: list ? "PUT" : "POST", body: body }).then(function (res) {
          busy = false;
          save.disabled = false;
          if (res.status !== 200) { fail(res); return; }
          cache.lists = null;
          FX.haptic();
          FX.closeSheet();
          FX.toast(lt(list ? "list_saved" : "list_created"));
          if (opts.onSaved) opts.onSaved(res.data.list);
        }).catch(function () { busy = false; save.disabled = false; offline(); });
      });

      if (del) {
        del.addEventListener("click", function () {
          if (busy) return;
          if (!confirming) { confirming = true; del.textContent = lt("list_delete_confirm"); return; }
          busy = true;
          FX.api("/api/lists?id=" + list.id, { method: "DELETE" }).then(function (res) {
            busy = false;
            if (res.status !== 200) { fail(res); return; }
            cache.lists = null;
            FX.haptic();
            FX.closeSheet();
            FX.toast(lt("list_deleted"));
            if (opts.onDeleted) opts.onDeleted();
          }).catch(function () { busy = false; offline(); });
        });
      }
    });
  }

  // ---------- "add to list" sheet (opened from a title page) ----------
  function putItem(listId, item, add) {
    return FX.api("/api/list-items", {
      method: "PUT",
      body: { list_id: listId, tmdb_id: item.tmdb_id, media_type: item.media_type, add: add }
    });
  }

  function openAddSheet(item) {
    var lists = null;   // null = loading, false = failed, array = ready
    var busy = false;

    FX.openSheet(function (sh) {
      sh.appendChild(el("h3", "sheet-title", lt("list_add")));
      var body = el("div");
      sh.appendChild(body);

      function toggle(l) {
        if (busy) return;
        busy = true;
        putItem(l.id, item, !l.has).then(function (res) {
          busy = false;
          if (res.status !== 200) { fail(res); return; }
          l.has = res.data.has;
          cache.lists = null;
          FX.haptic();
          FX.toast(lt(l.has ? "list_added" : "list_removed", { name: l.title }));
          draw();
        }).catch(function () { busy = false; offline(); });
      }

      function draw() {
        clear(body);
        if (lists === null) { body.appendChild(FX.msg(I18N.t("loading"))); return; }
        if (lists === false) { body.appendChild(FX.msg(I18N.t("err_load"), true)); return; }
        if (!lists.length) {
          body.appendChild(FX.msg(lt("list_none")));
        } else {
          var wrap = el("div", "lang-list");
          lists.forEach(function (l) {
            var row = button("lang-row" + (l.has ? " active" : ""), null, function () { toggle(l); });
            row.appendChild(el("span", "", l.title));
            if (l.has) row.appendChild(icon("check", 18));
            wrap.appendChild(row);
          });
          body.appendChild(wrap);
        }
        body.appendChild(button("btn primary block", "+ " + lt("list_new"), function () {
          openForm({
            onSaved: function (created) {
              putItem(created.id, item, true).then(function (res) {
                if (res.status !== 200) { fail(res); return; }
                FX.toast(lt("list_added", { name: created.title }));
              }).catch(offline);
            }
          });
        }));
      }

      draw();
      fetchLists(item).then(function (result) {
        lists = result === null ? false : result;
        draw();
      });
    });
  }

  // ---------- title picker: add titles from inside a list ----------
  function itemKey(it) { return it.media_type + ":" + it.tmdb_id; }

  function openPicker(p) {
    var inList = {};
    p.list.items.forEach(function (it) { inList[itemKey(it)] = true; });
    var mode = "search";          // "search" or "mine"
    var query = "";
    var searchTimer = null;
    var searchCtl = null;
    var libItems = null;          // null = not loaded yet, false = failed
    var libFilter = "watched";    // "watched" or "all"
    var busy = false;

    FX.openSheet(function (sh) {
      sh.classList.add("tall");
      sh.appendChild(el("h3", "sheet-title", lt("list_add_titles")));

      var seg = el("div", "segment");
      sh.appendChild(seg);
      var controls = el("div");
      sh.appendChild(controls);
      sh.appendChild(el("p", "pick-hint", lt("pick_hint")));
      var results = el("div");
      sh.appendChild(results);

      function pickCard(it) {
        var card = button("pcard" + (inList[itemKey(it)] ? " inlist" : ""), null, function () {
          if (busy) return;
          busy = true;
          var has = !!inList[itemKey(it)];
          putItem(p.list.id, it, !has).then(function (res) {
            busy = false;
            if (res.status !== 200) { fail(res); return; }
            if (has) {
              delete inList[itemKey(it)];
              p.list.items = p.list.items.filter(function (x) { return itemKey(x) !== itemKey(it); });
            } else {
              inList[itemKey(it)] = true;
              p.list.items.push(it);
            }
            card.classList.toggle("inlist", !has);
            FX.haptic();
            cache.lists = null;
            if (page === p) draw(p);
          }).catch(function () { busy = false; offline(); });
        });
        var box = el("div", "pimg");
        box.appendChild(FX.posterNode(it));
        var chk = el("span", "lchk");
        chk.appendChild(icon("check", 28));
        box.appendChild(chk);
        card.appendChild(box);
        card.appendChild(el("div", "ptitle", FX.displayTitle(it)));
        var sub = [];
        if (it.year) sub.push(String(it.year));
        sub.push(FX.typeLabel(it));
        card.appendChild(el("div", "psub", sub.join(" · ")));
        return card;
      }

      function showCards(list) {
        clear(results);
        if (!list.length) { results.appendChild(FX.msg(I18N.t("no_results"))); return; }
        var grid = el("div", "pick-grid");
        list.forEach(function (it) { grid.appendChild(pickCard(it)); });
        results.appendChild(grid);
      }

      function runSearch(q) {
        if (searchCtl) searchCtl.abort();
        searchCtl = new AbortController();
        clear(results);
        results.appendChild(FX.msg(I18N.t("searching")));
        FX.api(FX.L("/api/search?q=" + encodeURIComponent(q)), { signal: searchCtl.signal }).then(function (res) {
          if (mode !== "search" || query.trim() !== q) return;
          if (res.status !== 200) { clear(results); results.appendChild(FX.msg(FX.problem(res, "err_search"), true)); return; }
          showCards(res.data.results || []);
        }).catch(function (e) {
          if (e && e.name === "AbortError") return;
          clear(results);
          results.appendChild(FX.msg(I18N.t("err_network"), true));
        });
      }

      function drawMine() {
        clear(results);
        if (libItems === null) { results.appendChild(FX.msg(I18N.t("loading"))); return; }
        if (libItems === false) { results.appendChild(FX.msg(I18N.t("err_load"), true)); return; }
        showCards(libItems.filter(function (i) { return libFilter === "all" || i.status === "watched"; }));
      }

      function drawControls() {
        clear(controls);
        if (mode === "search") {
          var input = el("input", "field pick-search");
          input.type = "search";
          input.setAttribute("autocomplete", "off");
          input.placeholder = I18N.t("search_placeholder");
          input.value = query;
          input.addEventListener("input", function () {
            query = input.value;
            clearTimeout(searchTimer);
            if (searchCtl) searchCtl.abort();
            var q = query.trim();
            if (q.length < 2) { clear(results); return; }
            searchTimer = setTimeout(function () { runSearch(q); }, 400);
          });
          controls.appendChild(input);
        } else {
          var chips = el("div", "chips");
          [["watched", I18N.t("status_watched")], ["all", I18N.t("library_all")]].forEach(function (pair) {
            chips.appendChild(button("chip" + (libFilter === pair[0] ? " active" : ""), pair[1], function () {
              libFilter = pair[0];
              drawControls();
              drawMine();
            }));
          });
          controls.appendChild(chips);
        }
      }

      function drawSeg() {
        clear(seg);
        [["search", "pick_search"], ["mine", "pick_mine"]].forEach(function (pair) {
          seg.appendChild(button("seg-btn" + (mode === pair[0] ? " active" : ""), lt(pair[1]), function () {
            if (mode === pair[0]) return;
            mode = pair[0];
            drawSeg();
            drawControls();
            if (mode === "mine") {
              drawMine();
              if (libItems === null || libItems === false) {
                libItems = null;
                drawMine();
                FX.api("/api/library").then(function (res) {
                  libItems = res.status === 200 ? (res.data.items || []) : false;
                  if (mode === "mine") drawMine();
                }).catch(function () { libItems = false; if (mode === "mine") drawMine(); });
              }
            } else {
              clear(results);
              if (query.trim().length >= 2) runSearch(query.trim());
            }
          }));
        });
      }

      drawSeg();
      drawControls();
    });
  }

  // ---------- list page ----------
  function closeListPage() {
    if (!page) return;
    var p = page;
    page = null;
    p.root.remove();
    FX.popBack(p.back);
    cache.lists = null;
    FX.rerender();
  }

  function removeItem(p, it) {
    putItem(p.list.id, it, false).then(function (res) {
      if (res.status !== 200) { fail(res); return; }
      p.list.items = p.list.items.filter(function (x) {
        return !(x.tmdb_id === it.tmdb_id && x.media_type === it.media_type);
      });
      if (!p.list.items.length) p.editing = false;
      FX.haptic();
      if (page === p) draw(p);
    }).catch(offline);
  }

  function itemCard(p, it) {
    var card = FX.posterCard(it);
    if (p.editing) {
      var x = el("span", "lx");
      x.setAttribute("role", "button");
      x.appendChild(icon("x", 14));
      x.addEventListener("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        removeItem(p, it);
      });
      var box = card.querySelector(".pimg");
      if (box) box.appendChild(x);
    }
    return card;
  }

  // ---------- sharing ----------
  var BOT_LINK = "https://t.me/flicksyrobot?startapp=";

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

  // Plain link share: Telegram's chat picker with the link, or copy the link.
  function shareByLink(l) {
    var link = BOT_LINK + "list-" + l.share_code;
    var text = lt("share_text", { name: l.title });
    try {
      var tg = window.Telegram && Telegram.WebApp;
      if (tg && tg.openTelegramLink) {
        tg.openTelegramLink("https://t.me/share/url?url=" + encodeURIComponent(link) + "&text=" + encodeURIComponent(text));
        return;
      }
    } catch (e) {}
    copyText(link).then(function () {
      FX.haptic();
      FX.toast(lt("link_copied"));
    }, function () {
      FX.toast(link);
    });
  }

  var sharing = false;

  function sharePosters(l) {
    var out = [];
    for (var i = 0; i < l.items.length && out.length < 5; i++) {
      if (l.items[i].poster) out.push(l.items[i].poster);
    }
    return out;
  }

  // Owner only: draws the promo picture (posters + title + Flicksy) and uploads it.
  // It never blocks sharing: if anything fails, the server falls back to a TMDB picture.
  function uploadCard(l) {
    if (!l.is_owner || !FX.makeShareImage || !sharePosters(l).length) return Promise.resolve(false);
    var line = lt("list_count", { n: l.items.length }) + " · " + lt("list_by", { name: l.owner_name || "" });
    return FX.makeShareImage({
      title: l.title,
      line: line,
      tagline: lt("share_tagline"),
      posters: sharePosters(l)
    }).then(function (dataUrl) {
      return FX.api("/api/list-share-image", { method: "POST", body: { code: l.share_code, image: dataUrl } });
    }).then(function (res) {
      return !!res && res.status === 200;
    }).catch(function () { return false; });
  }

  // Keeps the list's promo picture up to date by itself (so @flicksyrobot cards and shared links
  // always show the posters). Runs in the background, only for the owner, and only when something changed.
  function scheduleCard(p) {
    var l = p.list;
    if (!l || !l.is_owner || l.visibility === "private" || !sharePosters(l).length) return;
    var ids = l.items.slice(0, 5).map(function (it) { return it.tmdb_id; });
    var sig = [I18N.lang, l.title, l.items.length].concat(ids).join("|");
    if (p.cardSig === sig) return;
    p.cardSig = sig;
    var key = "flicksy_card_" + l.share_code;
    try { if (localStorage.getItem(key) === sig) return; } catch (e) {}
    clearTimeout(p.cardTimer);
    p.cardTimer = setTimeout(function () {
      uploadCard(l).then(function (ok) {
        if (ok) { try { localStorage.setItem(key, sig); } catch (e) {} }
      });
    }, 1500);
  }

  // Rich card (promo picture + titles + Open button) when Telegram supports it; otherwise the plain link.
  function shareList(l) {
    if (l.visibility === "private") {
      FX.toast(lt("share_private", { vis: lt("vis_unlisted") }), true);
      return;
    }
    var tg = window.Telegram && Telegram.WebApp;
    var canCard = false;
    try { canCard = !!(tg && tg.shareMessage && tg.isVersionAtLeast && tg.isVersionAtLeast("8.0")); } catch (e) {}
    if (!canCard) { shareByLink(l); return; }
    if (sharing) return;
    sharing = true;
    FX.toast(lt("share_preparing"));
    uploadCard(l).then(function () {
      return FX.api("/api/list-share", { method: "POST", body: { code: l.share_code, lang: I18N.lang } });
    }).then(function (res) {
      sharing = false;
      if (res.status === 200 && res.data && res.data.id) {
        try { tg.shareMessage(res.data.id); return; } catch (e) {}
      }
      shareByLink(l);
    }).catch(function () {
      sharing = false;
      shareByLink(l);
    });
  }

  function draw(p) {
    var root = p.root;
    clear(root);

    var back = FX.iconButton("round-btn", "back", I18N.t("btn_close"), closeListPage);
    back.firstChild.classList.add("flip");
    root.appendChild(back);

    var scroller = el("div", "page-scroll");
    root.appendChild(scroller);
    var body = el("div", "lbody");
    scroller.appendChild(body);

    if (p.error) { body.appendChild(FX.msg(p.error, true)); return; }
    if (!p.list) { body.appendChild(FX.msg(I18N.t("loading"))); return; }

    var l = p.list;
    scheduleCard(p);
    body.appendChild(el("h1", "l-title", l.title));
    if (l.description) body.appendChild(el("p", "l-desc", l.description));

    var meta = el("div", "l-meta");
    meta.appendChild(el("span", "tag", visLabel(l.visibility)));
    meta.appendChild(el("span", "", lt("list_count", { n: l.items.length })));
    if (!l.is_owner && l.owner_name) meta.appendChild(el("span", "", lt("list_by", { name: l.owner_name })));
    body.appendChild(meta);

    if (l.is_owner) {
      var acts = el("div", "l-actions");
      acts.appendChild(button("btn primary", "+ " + lt("list_add_titles"), function () { openPicker(p); }));
      acts.appendChild(button("btn glass", lt("list_share"), function () { shareList(l); }));
      acts.appendChild(button("btn glass", lt("list_edit"), function () {
        openForm({
          list: l,
          onSaved: function (nl) {
            l.title = nl.title;
            l.description = nl.description;
            l.visibility = nl.visibility;
            if (page === p) draw(p);
          },
          onDeleted: closeListPage
        });
      }));
      if (l.items.length) {
        acts.appendChild(button("btn glass", lt(p.editing ? "list_done" : "list_remove_mode"), function () {
          p.editing = !p.editing;
          draw(p);
        }));
      }
      body.appendChild(acts);
    } else {
      var sacts = el("div", "l-actions");
      sacts.appendChild(button("btn primary", lt("list_share"), function () { shareList(l); }));
      body.appendChild(sacts);
    }

    if (!l.items.length) {
      body.appendChild(FX.msg(lt("list_empty")));
      return;
    }
    var grid = el("div", "grid");
    l.items.forEach(function (it) { grid.appendChild(itemCard(p, it)); });
    body.appendChild(grid);
  }

  // ref is { id: 12 } for your own list, or { code: "abcd2345" } for a shared one.
  function openListPage(ref) {
    if (page) {
      page.root.remove();
      FX.popBack(page.back);
      page = null;
    }
    var p = { ref: ref, list: null, editing: false, error: "", root: el("div", "page lpage"), back: closeListPage };
    page = p;
    document.body.appendChild(p.root);
    FX.pushBack(p.back);
    draw(p);

    var path = ref.code ? "/api/list?code=" + encodeURIComponent(ref.code) : "/api/list?id=" + ref.id;
    FX.api(path).then(function (res) {
      if (page !== p) return;
      if (res.status !== 200) p.error = res.status === 404 ? lt("list_not_found") : FX.problem(res, "err_load");
      else { p.list = res.data.list; FX.ingest(p.list.items); }
      draw(p);
    }).catch(function () {
      if (page !== p) return;
      p.error = I18N.t("err_network");
      draw(p);
    });
  }

  // ---------- plug into the app ----------
  FX.hooks.library = function (holder) {
    var sec = el("section", "lists-sec");
    sec.appendChild(el("div", "sec", lt("lists_title")));
    var body = el("div");
    sec.appendChild(body);
    holder.appendChild(sec);

    function drawGrid(lists) {
      clear(body);
      var grid = el("div", "lgrid");
      (lists || []).forEach(function (l) { grid.appendChild(listCard(l)); });
      grid.appendChild(newCard(function () {
        openForm({ onSaved: function (created) { openListPage({ id: created.id }); } });
      }));
      body.appendChild(grid);
    }

    drawGrid(cache.lists);
    fetchLists().then(function (lists) {
      if (lists && sec.isConnected) drawGrid(lists);
    });
  };

  FX.hooks.detailAction = function (d, box) {
    box.appendChild(FX.iconButton("abtn icon-only", "listplus", lt("list_add"), function () { openAddSheet(d.item); }));
  };

  FX.openListByCode = function (code) { openListPage({ code: code }); };
})();
