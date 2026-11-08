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
activity (feed + leaderboard), auth, backup, badges, bot (inline queries + webhook + /bot/setup), botlinks (link messages + status keyboard, hands commands/buttons to botmenu), botmenu (the bot's own menu), cardimg (card jpg store), comments, discover, episodes, followlist, health, index (router), library, listfollows, lists, notify, person, ratelimit, recap, search, share, shareimg, social (profile, follow, privacy), title, titlecard, tmdb, util.

### Frontend files (public/)
app.js (core: tabs, title page, layers, settings pages), social.js (profiles, follow, privacy, header picker, bell), lists.js, comments.js, activity.js, badges.js, backup.js, notifs.js, inline.js, cards.js (canvas card renderer), sharesheet.js (share sheet), sharecard.js, i18n.js / i18n-more.js / i18n-redesign.js, CSS: app.css, extras.css, sheets.css, lists.css, comments.css, activity.css.

## 3. Database migrations (db/schema.sql)
Applied up to **17**. Notable: 13–15 badges; 16 privacy columns `username_visible` (default 0) and `follows_visible` (default 1); 17 resets `inline_hidden = 0` for everyone (the "find lists by ID" switch was removed).
Privacy columns on `users`: `is_private`, `activity_visible`, `inline_hidden`, `username_visible`, `follows_visible`.

## 4. What exists now (all committed and verified)
- Titles (movies/series), library, lists (public/followers/private), comments, ratings, episodes progress, person (actor) pages, discover, search.
- Social: profiles, follow / follow requests, notifications bell, activity feed, leaderboard (movies / episodes / lists; EVERYONE appears, private profiles too – tapping opens the profile page, a private one asks for a follow request).
- Badges (migrations 13–15). Done: ladders (movies, episodes, lists, followers, comments, hours, streak), list-followers badges, founder / early / hand-given (team, verified, beta, supporter), 8 genre masters (20 titles), rewatcher (5), spoiler-safe (10 spoiler comments), series finisher (3 series). Hours, streak, genre, behavior badges can be earned and pinned but are never the automatic main badge (too heavy for list rows). Not yet: leaderboard rank, marathon, night owl, seasonal (they need new data: user local time, per-day episode count, a permanent rank record, trusted event dates).
- Main badge (`primary`) is shown as a small picture next to the name in leaderboard, comments and people search (`FX.badgeMini`, backend `primaryBadgesFor` batch in `src/badges.js`; the backend adds `badge` to person / comment user objects). The same badge replaces the Flicksy mark next to the name on profile and recap share cards (`FX.badgeImageUrl` + `badgeImg` in card data); no badge = Flicksy mark.
- Share flow: one simple share sheet (send in chat, story, save picker with sizes, copy link). Share for profile, title, list and recap (month / year-to-date; Jalali dates for fa/ar). Cards are drawn on canvas (`FX.cards.render(type, data, fmt)`; types list/profile/title/recap; formats chat 1200×630, story 1080×1920, tw 1200×675). Long text shrinks the font first (`shrink`), ellipsis only as a last resort. Backend: `POST /api/card-upload` (random id, `/card/<id>.jpg`, keeps 30 per user / 3 days), `POST /api/card-share`, `POST /api/list-share-image`, `GET /api/recap`.
- Recap link: `https://t.me/flicksyrobot?startapp=recap-<8-digit Flicksy ID>-<FROM yyyymmdd>-<TO yyyymmdd>` opens a sheet (`FX.share.openRecapLink`) with that person's numbers for that period. `GET /api/recap?from&to&lang&id=<Flicksy ID>`: same privacy as a profile (private profile: only owner and accepted followers; others get `{locked:true, person}`). Own recap still uses no `id`. Share param is validated by `validParam` in `src/cardimg.js`.
- Settings are full pages with back buttons, order: privacy, notifications, language, backup, about (`FX.openPage`, `FX.settingsItems`).
- Privacy page (now): Private profile, Show my activity to followers, Show my Telegram @username (off by default; people can still find by searching @username), and under "Advanced": Let people see who follows me / I follow (counts stay visible, only the lists hide). A toast explains what "private" means.
- Inline bot: `@flicksyrobot <8-digit Flicksy ID>` shows that person's Public lists (not for private profiles). Words show movie/series cards and your own lists.
- "Watching" status removed for movies (Library chips, status sheet, bot keyboard). Series keep it.
- Bot menu (`src/botmenu.js`, hooked from `src/botlinks.js`; commands registered by `GET /bot/setup` via `setupBotMenu`, which also sets the chat Menu button to "commands"):
  - `/start`, `/menu`, `/help` show the home screen: 🔎 Search (opens inline mode in the same chat), 📚 Lists, 🎲 Surprise me, ⚙️ Settings, 🌐 Open Flicksy (a real `web_app` button). Other commands: `/search`, `/lists`, `/settings`, `/app`.
  - Lists: "My lists" (inline, same chat) and "Share lists with my friend" (`switch_inline_query`: pick a chat/group first, then the bot opens there). Someone else's public lists: type bot name + 8-digit Flicksy ID in any chat.
  - Surprise me: random movie or series from the user's own watchlist (status `want`); buttons "Try again" (edits the message, avoids the same title) and "Explore on Flicksy" (`startapp=title-<movie|tv>-<tmdbId>`). It shows the TMDB poster + info card, NOT the app's canvas poster (those are drawn in the browser; a server-side renderer would be a big new job).
  - Settings: language (8 languages, writes `users.app_lang`) and backup buttons: "Export backup" sends the JSON file to the chat (calls `handleBackupSend`), "Import backup" explains and has a button to `https://t.me/flicksyrobot?startapp=backup`, which opens the Mini App straight on the backup page (`FX.openBackup`, handled in `openStartParam`). Importing a file INSIDE the chat was designed but NOT built: the owner is on the Cloudflare Free plan (10 ms CPU per request), too small for parsing big ZIP/CSV files. If the plan is ever upgraded to Paid: port the parsers (`public/backup.js` lines ~119-545) to a server module, store the file as chunks in new D1 tables, process one chunk per invocation (self service binding or cron), and edit a progress message. The `inline_hidden` switch was deliberately NOT added to the bot (the app removed it in migration 17).
  - Language sync: the Mini App no longer sends its language on open (it used to overwrite the bot's choice with English). `/api/me` returns `app_lang` and `adoptServerLanguage()` in `app.js` follows it; changing language inside the app still pushes it to the server. An already-open Mini App only updates after it is reopened.
  - Plain words typed to the bot (no link, no command) search titles and show results as buttons; then the card with status buttons. IMDb/TMDB links still work as before.
  - Callback data prefixes: `menu:`, `v:` (view card), `set:`, `sur:`; old `a:` and `all:` belong to `botlinks.js`. Bot menu texts, About, Description and command names live in `src/bottext.js` (8 languages; add new keys to ALL languages). Tone rule from the owner: simple, friendly, NOT bookish (Persian uses casual forms like می‌خوام / رو / میان). Mini App Persian was softened in i18n.js, i18n-more.js, i18n-redesign.js and backup.js; other languages' tone was not reviewed.
  - Removed on purpose: bot watchlist and "next episode" screens (the user did not want them). `/help` (and the ❓ Help button) is a Telegram Rich Message built in `src/botrich.js` (`sendRichMessage` with `rich_message.html`): heading, bordered table, `<details>` sections, `<pre><code>` with copy, and `<tg-button type="web_app" url=...>` which opens the Mini App. Tested by the owner on a real phone. If Telegram rejects it, a plain-text copy with a web_app button is sent. Not verified: `reply_markup` together with a rich message; the exact Bot API docs for rich messages could not be read in full (the doc page is too long for the fetch tool).
  - `/bot/setup` also sets the bot name (Flicksy), About (short description) and Description in en and fa. The description picture/GIF can only be set in BotFather (`/setdescriptionpic`, 640x360); a ready image was made but the owner has not uploaded it yet.
- Layer stack in `app.js` (`layers`, `layerZ`, `closePerson`) so person pages and detail pages go back correctly.

## 5. Known gotchas
- nowrap titles inside a `1fr` grid column expand the track: always use `minmax(0,1fr)` and `min-width:0`.
- `overflow-y:auto` containers also scroll sideways when a child is wider: keep `overflow-x:hidden`, and do not use negative margins inside `.page-scroll` (the profile page cover had this bug).
- `.spage` (other person's profile page) uses `z-index:28`; `.bkpage` is 29; detail is 40 when a `.spage` exists.
- Test stub `I18N.t` returns the key, so "undefined" strings in stub screenshots are harness-only.
- Old bot messages keep their old keyboard; only new messages change. The bulk bot button "All → Watching" still applies to mixed lists.

## 6. Next ideas (nothing here is decided yet; ask which first)
0. Bot menu follow-ups: maybe add more bot settings; welcome picture/GIF still to be uploaded via BotFather (`flicksy-welcome` image was made in the session scratchpad, not in the repo) (e.g. private profile).
1. Remaining badge categories: leaderboard rank (needs a permanent record when reached), marathon (10 episodes in a day; marking a whole season at once could cheat), night owl (needs the user's local time), seasonal (Yalda, Nowruz, Oscar night, Halloween; needs trusted dates, watch date can be edited). In the badge sheet these show "coming soon".
2. Hours are an estimate (movie 100 min and episode 40 min when TMDB runtime is missing).
3. Decided: My lists stays ordered by last edit (most recently changed first). Still skipped for now: his own rating style and Android-style emoji.
