export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      let db = "not-connected";
      try {
        const row = await env.DB.prepare("SELECT 1 AS ok").first();
        db = row && row.ok === 1 ? "ok" : "error";
      } catch (e) {
        db = "error";
      }
      return json({ app: "flicksy", status: "ok", db: db, time: new Date().toISOString() });
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "not_found" }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
