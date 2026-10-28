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
