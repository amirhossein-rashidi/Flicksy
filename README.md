# Flicksy

A cinema community inside Telegram. Track the movies and series you watch, rate them, build lists, follow friends and earn badges. It runs as a Telegram Mini App with a companion bot.

- Bot: [@flicksyrobot](https://t.me/flicksyrobot)
- Live app: https://flicksy.rashidi-a96.workers.dev/

Movie and series data comes from [TMDB](https://www.themoviedb.org/). This product uses the TMDB API but is not endorsed or certified by TMDB.

## Features

- **Library:** want, watching, watched, paused and dropped statuses, ratings, moods, episode progress for series, rewatches.
- **Discover and search:** top rated and popular rows, popular actors, search for titles and people, actor pages.
- **Lists:** public, followers-only or private lists you can share and follow.
- **Social:** profiles, follow requests, activity feed, notifications, comments, leaderboards, profile shelves of watched movies and series.
- **Badges:** progress ladders (movies, episodes, hours, streaks, lists, followers, comments) and seasonal badges.
- **Sharing and recap:** share cards for titles, lists and profiles, plus monthly and yearly recaps.
- **Telegram bot:** inline search, menu, surprise me, language and backup settings.
- **Backup:** export and import your data as JSON.
- **8 languages:** English, Persian, Arabic, Turkish, Russian, Spanish, French and German.

## Tech stack

| Part | Technology |
| --- | --- |
| Backend | Cloudflare Worker (`src/index.js` is the router, one file per feature) |
| Database | Cloudflare D1 (SQLite), binding `DB` |
| Frontend | Plain JavaScript, no build step. Files share a `window.FX` object |
| Data | TMDB API |
| Platform | Telegram Mini App and Bot API |

## Project layout

```
src/          Worker code (API routes, bot, TMDB access, badges, sharing)
public/       Static frontend served by the Worker (app.js, feature files, CSS, fonts)
db/schema.sql Database schema and numbered migrations
wrangler.jsonc Worker configuration
HANDOFF.md    Working notes for continuing development
```

## Configuration

The Worker needs a D1 database bound as `DB` (see `wrangler.jsonc`) and two secrets:

| Secret | Purpose |
| --- | --- |
| `BOT_TOKEN` | Telegram bot token, also used to verify Mini App sign-ins |
| `TMDB_TOKEN` | TMDB API read access token |

After deploying, open `/bot/setup` once to register the webhook, bot menu and command lists.

## Database

`db/schema.sql` holds the full schema. Changes are numbered migrations appended to that file, each ending with an insert into `schema_version`. Run a new migration once in the D1 console before deploying code that depends on it.

## Frontend notes

- Each `public/*.js` file is an IIFE and talks to the others through `window.FX`.
- When you change a frontend file, bump its `?v=` number in `public/index.html` so Telegram does not serve a cached copy.

## Credits

Fonts: Manrope and Vazirmatn (SIL Open Font License, see `public/fonts`).
