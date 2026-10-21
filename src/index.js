// Flicksy backend (Cloudflare Worker) - the router.
// Each feature lives in its own file in this folder.

import { json } from "./util.js";
import { allow } from "./ratelimit.js";
import { authenticate, getOrCreateUser } from "./auth.js";
import { handleHealth } from "./health.js";
import { handleSearch } from "./search.js";
import { handleLibraryList, handleLibrarySet, handleLibraryDelete } from "./library.js";

function tooMany() {
  return json({ error: "rate_limited" }, 429, { "retry-after": "30" });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      if (path === "/api/health") {
        const ip = request.headers.get("CF-Connecting-IP") || "unknown";
        if (!(await allow(env, "health", ip))) return tooMany();
        return await handleHealth(env);
      }

      if (path.startsWith("/api/")) {
        const auth = await authenticate(request, env);
        if (auth.error) return json({ error: auth.error }, auth.status);

        let kind = "read";
        if (path === "/api/search") kind = "search";
        else if (method !== "GET") kind = "write";
        if (!(await allow(env, kind, auth.user.id))) return tooMany();

        const user = await getOrCreateUser(env, auth.user, path === "/api/me");

        if (path === "/api/me") {
          return json({ user: user });
        }
        if (path === "/api/search" && method === "GET") {
          return await handleSearch(url, env, user);
        }
        if (path === "/api/library") {
          if (method === "GET") return await handleLibraryList(url, env, user);
          if (method === "PUT") return await handleLibrarySet(request, env, user);
          if (method === "DELETE") return await handleLibraryDelete(url, env, user);
          return json({ error: "method_not_allowed" }, 405);
        }
        return json({ error: "not_found" }, 404);
      }

      return env.ASSETS.fetch(request);
    } catch (e) {
      return json({ error: "server_error" }, 500);
    }
  },
};
