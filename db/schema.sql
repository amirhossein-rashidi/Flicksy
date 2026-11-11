CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER NOT NULL UNIQUE,
  username TEXT UNIQUE,
  display_name TEXT NOT NULL,
  photo_url TEXT,
  language_code TEXT,
  is_private INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT
);

CREATE TABLE IF NOT EXISTS titles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  imdb_id TEXT,
  title TEXT NOT NULL,
  original_title TEXT,
  title_fa TEXT,
  year INTEGER,
  overview TEXT,
  poster_path TEXT,
  backdrop_path TEXT,
  genres TEXT,
  runtime INTEGER,
  tmdb_rating REAL,
  fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (tmdb_id, media_type)
);

CREATE TABLE IF NOT EXISTS user_titles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title_id INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('want', 'watching', 'watched', 'paused', 'dropped')),
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 10)),
  note TEXT,
  started_at TEXT,
  finished_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, title_id)
);

CREATE TABLE IF NOT EXISTS lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  share_code TEXT NOT NULL UNIQUE,
  is_ranked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS list_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  title_id INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (list_id, title_id)
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followed_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'pending')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (follower_id, followed_id),
  CHECK (follower_id != followed_id)
);

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('status', 'rating', 'list_create', 'list_add')),
  title_id INTEGER REFERENCES titles(id) ON DELETE CASCADE,
  list_id INTEGER REFERENCES lists(id) ON DELETE CASCADE,
  value TEXT,
  visibility TEXT NOT NULL DEFAULT 'followers' CHECK (visibility IN ('public', 'followers', 'private')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_titles_imdb ON titles (imdb_id);
CREATE INDEX IF NOT EXISTS idx_user_titles_user_status ON user_titles (user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_titles_title ON user_titles (title_id);
CREATE INDEX IF NOT EXISTS idx_lists_owner ON lists (owner_id);
CREATE INDEX IF NOT EXISTS idx_list_items_list ON list_items (list_id, position);
CREATE INDEX IF NOT EXISTS idx_follows_followed ON follows (followed_id);
CREATE INDEX IF NOT EXISTS idx_activities_actor ON activities (actor_id, id DESC);

INSERT INTO schema_version (version) SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM schema_version);

-- ===== Migration 2: episode tracking (step 12) =====
CREATE TABLE IF NOT EXISTS episode_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title_id INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  watched_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, title_id, season_number, episode_number)
);

CREATE INDEX IF NOT EXISTS idx_episode_progress_user_title ON episode_progress (user_id, title_id);

INSERT INTO schema_version (version) SELECT 2 WHERE NOT EXISTS (SELECT 1 FROM schema_version WHERE version = 2);

-- ===== Migration 3: mood, favorite actor (rate-after-seen) =====
-- توجه: این مایگریشن قبلاً در D1 اجرا شده است. فقط یک بار اجرا شود
-- (ALTER TABLE دوباره‌اجرا خطا می‌دهد).
ALTER TABLE user_titles ADD COLUMN mood TEXT;
ALTER TABLE user_titles ADD COLUMN fav_actor_id INTEGER;
ALTER TABLE user_titles ADD COLUMN fav_actor_name TEXT;
ALTER TABLE user_titles ADD COLUMN fav_actor_photo TEXT;

INSERT INTO schema_version (version) SELECT 3 WHERE NOT EXISTS (SELECT 1 FROM schema_version WHERE version = 3);

-- ===== Migration 4: share-card pictures =====
-- تصویر کارت اشتراک هر لیست (JPEG به‌صورت base64)؛ با حذف لیست، خودکار پاک می‌شود.
CREATE TABLE IF NOT EXISTS share_images (
  list_id INTEGER PRIMARY KEY REFERENCES lists(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO schema_version (version) SELECT 4 WHERE NOT EXISTS (SELECT 1 FROM schema_version WHERE version = 4);

-- ===== Migration 5: Flicksy ID + inline mode =====
-- توجه: این مایگریشن قبلاً در D1 اجرا شده است. فقط یک بار اجرا شود.
-- public_id = آیدی تصادفی ۸ رقمی کاربر (جدا از آیدی تلگرام)؛ inline_hidden = پنهان بودن از جست‌وجوی اینلاین.
ALTER TABLE users ADD COLUMN public_id TEXT;
ALTER TABLE users ADD COLUMN inline_hidden INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_public_id ON users (public_id);

INSERT INTO schema_version (version) SELECT 5 WHERE NOT EXISTS (SELECT 1 FROM schema_version WHERE version = 5);

-- ===== Migration 6: social (header, activity visibility, notifications) =====
-- توجه: این مایگریشن قبلاً در D1 اجرا شده است. فقط یک بار اجرا شود.
-- header = هدر پروفایل (مثلاً مسیر تصویر پس‌زمینهٔ یک فیلم/سریال یا شناسهٔ هدر پیش‌فرض)؛
-- activity_visible = نمایش فعالیت‌ها به دنبال‌کننده‌ها (پیش‌فرض روشن).
ALTER TABLE users ADD COLUMN header TEXT;
ALTER TABLE users ADD COLUMN activity_visible INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('follow', 'follow_request', 'request_accepted')),
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, is_read, id DESC);

INSERT INTO schema_version (version) SELECT 6 WHERE NOT EXISTS (SELECT 1 FROM schema_version WHERE version = 6);

-- ===== Migration 7: the app's language, so the bot answers in the same language =====
ALTER TABLE users ADD COLUMN app_lang TEXT;

INSERT INTO schema_version (version) SELECT 7 WHERE NOT EXISTS (SELECT 1 FROM schema_version WHERE version = 7);

-- ===== Migration 8: watch log (dates of watching, rewatches) =====
-- توجه: این مایگریشن قبلاً در D1 اجرا شده است.
CREATE TABLE IF NOT EXISTS watch_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title_id INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  watched_on TEXT NOT NULL,
  is_rewatch INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_watch_log_user_title ON watch_log (user_id, title_id, id);

INSERT INTO schema_version (version) SELECT 8 WHERE NOT EXISTS (SELECT 1 FROM schema_version WHERE version = 8);

-- ===== Migration 9: per-episode rating, mood, favorite actor =====
-- توجه: این مایگریشن قبلاً در D1 اجرا شده است.
CREATE TABLE IF NOT EXISTS episode_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title_id INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  rating INTEGER,
  mood TEXT,
  fav_actor_id INTEGER,
  fav_actor_name TEXT,
  fav_actor_photo TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, title_id, season_number, episode_number)
);

CREATE INDEX IF NOT EXISTS idx_episode_notes_user_title ON episode_notes (user_id, title_id);

INSERT INTO schema_version (version) SELECT 9 WHERE NOT EXISTS (SELECT 1 FROM schema_version WHERE version = 9);

-- ===== Migration 10: comments (replies, likes, reports) =====
-- توجه: این مایگریشن قبلاً در D1 اجرا شده است.
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title_id INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  season_number INTEGER,
  episode_number INTEGER,
  parent_id INTEGER,
  body TEXT NOT NULL,
  spoiler INTEGER NOT NULL DEFAULT 0,
  deleted INTEGER NOT NULL DEFAULT 0,
  edited_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_comments_scope ON comments (title_id, season_number, episode_number, parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments (parent_id);

CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS comment_reports (
  comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (comment_id, user_id)
);

INSERT INTO schema_version (version) SELECT 10 WHERE NOT EXISTS (SELECT 1 FROM schema_version WHERE version = 10);

-- ===== Migration 11: comment notifications + notification settings =====
-- توجه: این مایگریشن قبلاً در D1 اجرا شده است.
CREATE TABLE IF NOT EXISTS comment_notifs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (comment_id, actor_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_comment_notifs_user ON comment_notifs (user_id, is_read, id DESC);

CREATE TABLE IF NOT EXISTS notif_prefs (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  reply_app INTEGER,
  reply_bot INTEGER,
  like_app INTEGER,
  like_bot INTEGER,
  follow_app INTEGER,
  follow_bot INTEGER,
  bot_all INTEGER
);

INSERT INTO schema_version (version) SELECT 11 WHERE NOT EXISTS (SELECT 1 FROM schema_version WHERE version = 11);

-- ===== Migration 12: list follows (+ notifications for the list owner) =====
-- توجه: این مایگریشن قبلاً در D1 اجرا شده است. فقط یک بار اجرا شود (ALTER TABLE دوباره‌اجرا خطا می‌دهد).
-- فالوها با private/unlisted شدن لیست پاک نمی‌شوند؛ فقط تا وقتی لیست public نیست نمایش داده نمی‌شوند.
CREATE TABLE IF NOT EXISTS list_follows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (list_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_list_follows_list ON list_follows (list_id, created_at);
CREATE INDEX IF NOT EXISTS idx_list_follows_user ON list_follows (user_id, created_at);

ALTER TABLE notif_prefs ADD COLUMN list_follow_app INTEGER;
ALTER TABLE notif_prefs ADD COLUMN list_follow_bot INTEGER;

CREATE TABLE IF NOT EXISTS list_follow_notifs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (list_id, actor_id)
);

CREATE INDEX IF NOT EXISTS idx_list_follow_notifs_user ON list_follow_notifs (user_id, is_read, id DESC);

INSERT INTO schema_version (version) SELECT 12 WHERE NOT EXISTS (SELECT 1 FROM schema_version WHERE version = 12);

-- Migration 13: badges given by hand (team, verified, beta, supporter)
CREATE TABLE IF NOT EXISTS user_badges (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, badge_id)
);

INSERT INTO schema_version (version) SELECT 13 WHERE NOT EXISTS (SELECT 1 FROM schema_version WHERE version = 13);

-- Migration 14: the badge a person pinned next to their name (empty = automatic)
ALTER TABLE users ADD COLUMN primary_badge TEXT;

INSERT INTO schema_version (version) SELECT 14 WHERE NOT EXISTS (SELECT 1 FROM schema_version WHERE version = 14);

-- Migration 15: share-card pictures for stories and Twitter (random address, cleaned up automatically)
CREATE TABLE IF NOT EXISTS card_images (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_card_images_user ON card_images (user_id, created_at DESC);

INSERT INTO schema_version (version) SELECT 15 WHERE NOT EXISTS (SELECT 1 FROM schema_version WHERE version = 15);

-- Migration 16: privacy. username_visible = show my @username to other people (default off);
-- follows_visible = let other people open my followers / following lists (default on).
ALTER TABLE users ADD COLUMN username_visible INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN follows_visible INTEGER NOT NULL DEFAULT 1;

INSERT INTO schema_version (version) SELECT 16 WHERE NOT EXISTS (SELECT 1 FROM schema_version WHERE version = 16);

-- 17: the "find my Public lists by ID" switch was removed from Privacy. Everyone is visible again;
-- a private profile still keeps its lists out of the bot.
UPDATE users SET inline_hidden = 0;

INSERT INTO schema_version (version) SELECT 17 WHERE NOT EXISTS (SELECT 1 FROM schema_version WHERE version = 17);

-- ===== Migration 18: fast library order (performance) =====
-- user_titles.last_activity_at = the same value the library used to work out on every request:
-- latest episode watched_at, else latest watch_log date, else finished_at, started_at, created_at.
-- Triggers keep it in step with every change to episode_progress, watch_log and user_titles, so no
-- code path can forget to update it. Run PART 1, then PART 2 (run each once; ALTER TABLE fails if repeated).

-- PART 1: column, fill existing rows, indexes
ALTER TABLE user_titles ADD COLUMN last_activity_at TEXT;

UPDATE user_titles SET last_activity_at = COALESCE(
  (SELECT MAX(ep.watched_at) FROM episode_progress ep WHERE ep.user_id = user_titles.user_id AND ep.title_id = user_titles.title_id),
  (SELECT MAX(wl.watched_on) FROM watch_log wl WHERE wl.user_id = user_titles.user_id AND wl.title_id = user_titles.title_id),
  finished_at, started_at, created_at);

CREATE INDEX IF NOT EXISTS idx_user_titles_user_activity ON user_titles (user_id, last_activity_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_user_titles_user_status_activity ON user_titles (user_id, status, last_activity_at DESC, id DESC);

-- PART 2: triggers (one statement each)
CREATE TRIGGER IF NOT EXISTS trg_ut_activity_ins AFTER INSERT ON user_titles BEGIN UPDATE user_titles SET last_activity_at = COALESCE((SELECT MAX(ep.watched_at) FROM episode_progress ep WHERE ep.user_id = NEW.user_id AND ep.title_id = NEW.title_id), (SELECT MAX(wl.watched_on) FROM watch_log wl WHERE wl.user_id = NEW.user_id AND wl.title_id = NEW.title_id), NEW.finished_at, NEW.started_at, NEW.created_at) WHERE id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS trg_ut_activity_upd AFTER UPDATE OF finished_at, started_at, created_at ON user_titles BEGIN UPDATE user_titles SET last_activity_at = COALESCE((SELECT MAX(ep.watched_at) FROM episode_progress ep WHERE ep.user_id = NEW.user_id AND ep.title_id = NEW.title_id), (SELECT MAX(wl.watched_on) FROM watch_log wl WHERE wl.user_id = NEW.user_id AND wl.title_id = NEW.title_id), NEW.finished_at, NEW.started_at, NEW.created_at) WHERE id = NEW.id AND last_activity_at IS NOT COALESCE((SELECT MAX(ep.watched_at) FROM episode_progress ep WHERE ep.user_id = NEW.user_id AND ep.title_id = NEW.title_id), (SELECT MAX(wl.watched_on) FROM watch_log wl WHERE wl.user_id = NEW.user_id AND wl.title_id = NEW.title_id), NEW.finished_at, NEW.started_at, NEW.created_at); END;
CREATE TRIGGER IF NOT EXISTS trg_ep_activity_ins AFTER INSERT ON episode_progress BEGIN UPDATE user_titles SET last_activity_at = COALESCE((SELECT MAX(ep.watched_at) FROM episode_progress ep WHERE ep.user_id = user_titles.user_id AND ep.title_id = user_titles.title_id), (SELECT MAX(wl.watched_on) FROM watch_log wl WHERE wl.user_id = user_titles.user_id AND wl.title_id = user_titles.title_id), user_titles.finished_at, user_titles.started_at, user_titles.created_at) WHERE user_id = NEW.user_id AND title_id = NEW.title_id AND last_activity_at IS NOT COALESCE((SELECT MAX(ep.watched_at) FROM episode_progress ep WHERE ep.user_id = user_titles.user_id AND ep.title_id = user_titles.title_id), (SELECT MAX(wl.watched_on) FROM watch_log wl WHERE wl.user_id = user_titles.user_id AND wl.title_id = user_titles.title_id), user_titles.finished_at, user_titles.started_at, user_titles.created_at); END;
CREATE TRIGGER IF NOT EXISTS trg_ep_activity_upd AFTER UPDATE OF watched_at ON episode_progress BEGIN UPDATE user_titles SET last_activity_at = COALESCE((SELECT MAX(ep.watched_at) FROM episode_progress ep WHERE ep.user_id = user_titles.user_id AND ep.title_id = user_titles.title_id), (SELECT MAX(wl.watched_on) FROM watch_log wl WHERE wl.user_id = user_titles.user_id AND wl.title_id = user_titles.title_id), user_titles.finished_at, user_titles.started_at, user_titles.created_at) WHERE user_id = NEW.user_id AND title_id = NEW.title_id AND last_activity_at IS NOT COALESCE((SELECT MAX(ep.watched_at) FROM episode_progress ep WHERE ep.user_id = user_titles.user_id AND ep.title_id = user_titles.title_id), (SELECT MAX(wl.watched_on) FROM watch_log wl WHERE wl.user_id = user_titles.user_id AND wl.title_id = user_titles.title_id), user_titles.finished_at, user_titles.started_at, user_titles.created_at); END;
CREATE TRIGGER IF NOT EXISTS trg_ep_activity_del AFTER DELETE ON episode_progress BEGIN UPDATE user_titles SET last_activity_at = COALESCE((SELECT MAX(ep.watched_at) FROM episode_progress ep WHERE ep.user_id = user_titles.user_id AND ep.title_id = user_titles.title_id), (SELECT MAX(wl.watched_on) FROM watch_log wl WHERE wl.user_id = user_titles.user_id AND wl.title_id = user_titles.title_id), user_titles.finished_at, user_titles.started_at, user_titles.created_at) WHERE user_id = OLD.user_id AND title_id = OLD.title_id AND last_activity_at IS NOT COALESCE((SELECT MAX(ep.watched_at) FROM episode_progress ep WHERE ep.user_id = user_titles.user_id AND ep.title_id = user_titles.title_id), (SELECT MAX(wl.watched_on) FROM watch_log wl WHERE wl.user_id = user_titles.user_id AND wl.title_id = user_titles.title_id), user_titles.finished_at, user_titles.started_at, user_titles.created_at); END;
CREATE TRIGGER IF NOT EXISTS trg_wl_activity_ins AFTER INSERT ON watch_log BEGIN UPDATE user_titles SET last_activity_at = COALESCE((SELECT MAX(ep.watched_at) FROM episode_progress ep WHERE ep.user_id = user_titles.user_id AND ep.title_id = user_titles.title_id), (SELECT MAX(wl.watched_on) FROM watch_log wl WHERE wl.user_id = user_titles.user_id AND wl.title_id = user_titles.title_id), user_titles.finished_at, user_titles.started_at, user_titles.created_at) WHERE user_id = NEW.user_id AND title_id = NEW.title_id AND last_activity_at IS NOT COALESCE((SELECT MAX(ep.watched_at) FROM episode_progress ep WHERE ep.user_id = user_titles.user_id AND ep.title_id = user_titles.title_id), (SELECT MAX(wl.watched_on) FROM watch_log wl WHERE wl.user_id = user_titles.user_id AND wl.title_id = user_titles.title_id), user_titles.finished_at, user_titles.started_at, user_titles.created_at); END;
CREATE TRIGGER IF NOT EXISTS trg_wl_activity_upd AFTER UPDATE OF watched_on ON watch_log BEGIN UPDATE user_titles SET last_activity_at = COALESCE((SELECT MAX(ep.watched_at) FROM episode_progress ep WHERE ep.user_id = user_titles.user_id AND ep.title_id = user_titles.title_id), (SELECT MAX(wl.watched_on) FROM watch_log wl WHERE wl.user_id = user_titles.user_id AND wl.title_id = user_titles.title_id), user_titles.finished_at, user_titles.started_at, user_titles.created_at) WHERE user_id = NEW.user_id AND title_id = NEW.title_id AND last_activity_at IS NOT COALESCE((SELECT MAX(ep.watched_at) FROM episode_progress ep WHERE ep.user_id = user_titles.user_id AND ep.title_id = user_titles.title_id), (SELECT MAX(wl.watched_on) FROM watch_log wl WHERE wl.user_id = user_titles.user_id AND wl.title_id = user_titles.title_id), user_titles.finished_at, user_titles.started_at, user_titles.created_at); END;
CREATE TRIGGER IF NOT EXISTS trg_wl_activity_del AFTER DELETE ON watch_log BEGIN UPDATE user_titles SET last_activity_at = COALESCE((SELECT MAX(ep.watched_at) FROM episode_progress ep WHERE ep.user_id = user_titles.user_id AND ep.title_id = user_titles.title_id), (SELECT MAX(wl.watched_on) FROM watch_log wl WHERE wl.user_id = user_titles.user_id AND wl.title_id = user_titles.title_id), user_titles.finished_at, user_titles.started_at, user_titles.created_at) WHERE user_id = OLD.user_id AND title_id = OLD.title_id AND last_activity_at IS NOT COALESCE((SELECT MAX(ep.watched_at) FROM episode_progress ep WHERE ep.user_id = user_titles.user_id AND ep.title_id = user_titles.title_id), (SELECT MAX(wl.watched_on) FROM watch_log wl WHERE wl.user_id = user_titles.user_id AND wl.title_id = user_titles.title_id), user_titles.finished_at, user_titles.started_at, user_titles.created_at); END;

INSERT INTO schema_version (version) SELECT 18 WHERE NOT EXISTS (SELECT 1 FROM schema_version WHERE version = 18);

-- Check (read-only, should return 0): rows whose stored value differs from the original calculation
-- SELECT COUNT(*) FROM user_titles ut WHERE ut.last_activity_at IS NOT COALESCE(
--   (SELECT MAX(ep.watched_at) FROM episode_progress ep WHERE ep.user_id = ut.user_id AND ep.title_id = ut.title_id),
--   (SELECT MAX(wl.watched_on) FROM watch_log wl WHERE wl.user_id = ut.user_id AND wl.title_id = ut.title_id),
--   ut.finished_at, ut.started_at, ut.created_at);

-- ===== Migration 19: posters per language =====
-- poster_path = default (English) poster, poster_fa = Persian poster ('' = there is none).
-- NULL means "not checked yet"; open /bot/fix-posters once to fix the older titles.
ALTER TABLE titles ADD COLUMN poster_fa TEXT;

INSERT INTO schema_version (version) SELECT 19 WHERE NOT EXISTS (SELECT 1 FROM schema_version WHERE version = 19);

-- Migration 20: next episode to air, cached on the title (filled in by /api/upcoming, refreshed when old).
-- next_air_date is YYYY-MM-DD, '' = no episode announced, NULL = never checked.
ALTER TABLE titles ADD COLUMN next_air_date TEXT;
ALTER TABLE titles ADD COLUMN next_season INTEGER;
ALTER TABLE titles ADD COLUMN next_episode INTEGER;
ALTER TABLE titles ADD COLUMN next_checked_at TEXT;

INSERT INTO schema_version (version) SELECT 20 WHERE NOT EXISTS (SELECT 1 FROM schema_version WHERE version = 20);
