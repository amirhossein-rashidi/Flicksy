# Flicksy – HANDOFF (read this first in a new chat)

Flicksy = Telegram Mini App, a cinema community (TV Time-like). Bot: @flicksyrobot.
Live app: https://flicksy.rashidi-a96.workers.dev/
Repo: https://github.com/amirhossein-rashidi/Flicksy (branch `main`)

## 1. The person and the standing rules (MUST follow)
- The owner is NOT a programmer. He uses only the GitHub web UI and the Cloudflare dashboard. Nothing is installed on his computer.
- Always reply in Persian, short, plain text. (He often types English because his keyboard is on English.)
- ALWAYS give COMPLETE files (never diffs or snippets) and state the line count and the required last line:
  - frontend `public/*.js` ends with `})();`
  - backend `src/*.js` ends with `}` or `};` (`src/index.js` ends with `};`)
- ALWAYS give ready-to-click links (never make him assemble them):
  - edit a file: `https://github.com/amirhossein-rashidi/Flicksy/edit/main/<path>`
  - new file: `https://github.com/amirhossein-rashidi/Flicksy/new/main/<folder>`
  - D1 console: `https://dash.cloudflare.com/?to=/:account/workers/d1`
  - app: `https://flicksy.rashidi-a96.workers.dev/` (+ path, e.g. `/api/health`)
- ONE step at a time. Wait for "انجام شد" / "Done" / "بعدی" before the next step.
- After he commits: `git pull` the repo clone and verify every file with `cmp` against what was sent.
- Bump `?v=` for every changed file in `public/index.html`; send the full `index.html` LAST.
- SQL goes in ONE block for the D1 Console. Migrations run once. Update `db/schema.sql` (append the migration + `schema_version` insert). Run SQL before committing code that depends on it.
- Show a clickable HTML mock before building any new UI. Keep the clean minimal style; do not change the look without permission.
- Note mid-work corrections openly. Ignore Stop-hook "uncommitted changes" messages (the session cannot push).
- The sandbox cannot reach the live site (proxy 403). Verify with `node --check`, Playwright stubs and fake-DB tests, then `cmp` after he commits.

## 2. Architecture
- Backend: Cloudflare Worker. `src/index.js` is the router; one file per feature. D1 database is `env.DB` (binding in `wrangler.jsonc`, database `flicksy-db`). Static files are served from `public/`.
- Frontend: plain JS (no build). Each file is an IIFE and talks through `window.FX` (`FX.api`, `FX.openPage`, `FX.openSheet`, `FX.toast`, `FX.settingsItems`, `FX.share`, `FX.cards`, `FX.badgeAttach`, ...). Translations in `public/i18n*.js` plus per-file TXT tables (8 languages: en, fa, ar, tr, ru, es, fr, de).
- Telegram WebApp APIs used: `shareMessage` (prepared message via backend `savePreparedInlineMessage`), `shareToStory`, `downloadFile`, `openTelegramLink`, `BackButton`.

### Backend files (src/)
activity (feed + leaderboard), auth, backup, badges, bot (inline queries), botlinks (link messages + status keyboard), cardimg (card jpg store), comments, discover, episodes, followlist, health, index (router), library, listfollows, lists, notify, person, ratelimit, recap, search, share, shareimg, social (profile, follow, privacy), title, titlecard, tmdb, util.

### Frontend files (public/)
app.js (core: tabs, title page, layers, settings pages), social.js (profiles, follow, privacy, header picker, bell), lists.js, comments.js, activity.js, badges.js, backup.js, notifs.js, inline.js, cards.js (canvas card renderer), sharesheet.js (share sheet), sharecard.js, i18n.js / i18n-more.js / i18n-redesign.js, CSS: app.css, extras.css, sheets.css, lists.css, comments.css, activity.css.

## 3. Database migrations (db/schema.sql)
Applied up to **17**. Notable: 13–15 badges; 16 privacy columns `username_visible` (default 0) and `follows_visible` (default 1); 17 resets `inline_hidden = 0` for everyone (the "find lists by ID" switch was removed).
Privacy columns on `users`: `is_private`, `activity_visible`, `inline_hidden`, `username_visible`, `follows_visible`.

## 4. What exists now (all committed and verified)
- Titles (movies/series), library, lists (public/followers/private), comments, ratings, episodes progress, person (actor) pages, discover, search.
- Social: profiles, follow / follow requests, notifications bell, activity feed, leaderboard (movies / episodes / lists; EVERYONE appears, private profiles too – tapping opens the profile page, a private one asks for a follow request).
- Badges (migrations 13–15). Done: first categories only. Not yet: hours, streaks, genre masters, leaderboard, behavior, seasonal.
- Share flow: one simple share sheet (send in chat, story, save picker with sizes, copy link). Share for profile, title, list and recap (month / year-to-date; Jalali dates for fa/ar). Cards are drawn on canvas (`FX.cards.render(type, data, fmt)`; types list/profile/title/recap; formats chat 1200×630, story 1080×1920, tw 1200×675). Long text shrinks the font first (`shrink`), ellipsis only as a last resort. Backend: `POST /api/card-upload` (random id, `/card/<id>.jpg`, keeps 30 per user / 3 days), `POST /api/card-share`, `POST /api/list-share-image`, `GET /api/recap`.
- Settings are full pages with back buttons, order: privacy, notifications, language, backup, about (`FX.openPage`, `FX.settingsItems`).
- Privacy page (now): Private profile, Show my activity to followers, Show my Telegram @username (off by default; people can still find by searching @username), and under "Advanced": Let people see who follows me / I follow (counts stay visible, only the lists hide). A toast explains what "private" means.
- Inline bot: `@flicksyrobot <8-digit Flicksy ID>` shows that person's Public lists (not for private profiles). Words show movie/series cards and your own lists.
- "Watching" status removed for movies (Library chips, status sheet, bot keyboard). Series keep it.
- Layer stack in `app.js` (`layers`, `layerZ`, `closePerson`) so person pages and detail pages go back correctly.

## 5. Known gotchas
- nowrap titles inside a `1fr` grid column expand the track: always use `minmax(0,1fr)` and `min-width:0`.
- `overflow-y:auto` containers also scroll sideways when a child is wider: keep `overflow-x:hidden`, and do not use negative margins inside `.page-scroll` (the profile page cover had this bug).
- `.spage` (other person's profile page) uses `z-index:28`; `.bkpage` is 29; detail is 40 when a `.spage` exists.
- Test stub `I18N.t` returns the key, so "undefined" strings in stub screenshots are harness-only.
- Old bot messages keep their old keyboard; only new messages change. The bulk bot button "All → Watching" still applies to mixed lists.

## 6. Next ideas (nothing here is decided yet; ask which first)
1. Badge next to names in rows (leaderboard, comments, people search).
2. Remaining badge categories (hours, streak, genre, leaderboard, behavior, seasonal).
3. Replace the brand mark next to the name on profile cards with the user's real primary badge.
4. A dedicated `recap-USERNAME-PERIOD` deep link (recap currently shares a profile link).
