// Public status page: /api/health (never shows secret values, only set/missing/ok).

import { json } from "./util.js";
import { TMDB_BASE } from "./tmdb.js";

export async function handleHealth(env) {
  let db = "not-connected";
  try {
    const row = await env.DB.prepare("SELECT 1 AS ok").first();
    db = row && row.ok === 1 ? "ok" : "error";
  } catch (e) {
    db = "error";
  }

  let tmdb = "missing";
  if (env.TMDB_TOKEN) {
    try {
      const r = await fetch(TMDB_BASE + "/authentication", {
        headers: { Authorization: "Bearer " + env.TMDB_TOKEN, Accept: "application/json" },
      });
      tmdb = r.ok ? "ok" : "http_" + r.status;
    } catch (e) {
      tmdb = "unreachable";
    }
  }

  return json({
    app: "flicksy",
    status: "ok",
    db: db,
    bot_token: env.BOT_TOKEN ? "set" : "missing",
    tmdb: tmdb,
    time: new Date().toISOString(),
  });
}
