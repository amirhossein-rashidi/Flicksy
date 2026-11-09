// One-time repair: older titles were saved with the Persian poster as the main one.
// This makes poster_path the default (English) poster and moves the Persian one to poster_fa.
// Open /bot/fix-posters once; the page reloads itself until every title is done. Safe to open again:
// a title is only handled once (poster_fa is filled in afterwards), and nothing is deleted.

import { tmdbGet } from "./tmdb.js";

const STEP = 20;

function page(text, nextFrom) {
  const refresh = nextFrom === null ? "" : '<meta http-equiv="refresh" content="1;url=/bot/fix-posters?from=' + nextFrom + '">';
  return new Response(
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      refresh +
      "<title>Flicksy posters</title></head><body style=\"font-family:sans-serif;padding:24px;font-size:18px\">" +
      text +
      "</body></html>",
    { headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

export async function handleFixPosters(request, env) {
  if (!env.TMDB_TOKEN) return page("TMDB_TOKEN is not set.", null);
  const url = new URL(request.url);
  const from = Math.max(parseInt(url.searchParams.get("from") || "0", 10) || 0, 0);

  const rows = (
    await env.DB.prepare(
      "SELECT id, tmdb_id, media_type, poster_path FROM titles WHERE poster_fa IS NULL AND id > ?1 ORDER BY id LIMIT " + STEP
    )
      .bind(from)
      .all()
  ).results || [];

  if (!rows.length) {
    const left = await env.DB.prepare("SELECT COUNT(*) AS n FROM titles WHERE poster_fa IS NULL").first();
    const n = (left && left.n) || 0;
    return page(n ? n + " titles were skipped (TMDB did not answer). Open <a href=\"/bot/fix-posters\">this link</a> again." : "Done. All posters are fixed.", null);
  }

  const statements = [];
  await Promise.all(
    rows.map(async (r) => {
      let en = null;
      try {
        const res = await tmdbGet(env, "/" + r.media_type + "/" + r.tmdb_id + "?language=en-US", 86400);
        en = res.status === 200 && res.data ? res.data.poster_path || null : "";
      } catch (e) {
        return; // TMDB did not answer: leave it for the next round
      }
      if (en && en !== r.poster_path) {
        statements.push(
          env.DB.prepare("UPDATE titles SET poster_path = ?1, poster_fa = ?2 WHERE id = ?3 AND poster_fa IS NULL").bind(en, r.poster_path || "", r.id)
        );
      } else {
        statements.push(env.DB.prepare("UPDATE titles SET poster_fa = '' WHERE id = ?1 AND poster_fa IS NULL").bind(r.id));
      }
    })
  );
  if (statements.length) await env.DB.batch(statements);

  const last = rows[rows.length - 1].id;
  return page("Working… up to title " + last + ". Keep this page open.", last);
}
