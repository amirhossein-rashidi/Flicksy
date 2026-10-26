// Flicksy backend (Cloudflare Worker) - the router.
// Each feature lives in its own file in this folder.

import { json } from "./util.js";
import { allow } from "./ratelimit.js";
import { authenticate, getOrCreateUser } from "./auth.js";
import { handleHealth } from "./health.js";
import { handleSearch } from "./search.js";
import { handleLibraryList, handleLibrarySet, handleLibraryDelete } from "./library.js";
import { handleDiscover } from "./discover.js";
import { handleTitle } from "./title.js";
import { handleTvInfo, handleSeasonEpisodes, handleEpisodesSet } from "./episodes.js";
import {
  handleListsGet,
  handleListCreate,
  handleListUpdate,
  handleListDelete,
  handleListView,
  handleListItemSet,
} from "./lists.js";
import { handleListShare } from "./share.js";
import { handleBotSetup, handleBotWebhook, handleInlineSettings } from "./bot.js";
import { handleShareImageSet, handleShareImageGet, handleImageProxy } from "./shareimg.js";
import {
  handlePeopleSearch,
  handleProfile,
  handleFollow,
  handleUnfollow,
  handleFollowRequest,
  handleNotifications,
  handleNotificationsRead,
  handlePrivacyGet,
  handlePrivacySet,
  handleHeaderSet,
  handleHeaderOptions,
} from "./social.js";

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

      if (path === "/bot/setup" && method === "GET") {
        return await handleBotSetup(request, env);
      }
      if (path === "/bot/webhook" && method === "POST") {
        return await handleBotWebhook(request, env);
      }

      if (path.startsWith("/tmdb-img/") && method === "GET") {
        return await handleImageProxy(url);
      }

      if (path.startsWith("/share/") && method === "GET") {
        return await handleShareImageGet(url, env);
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
        if (path === "/api/discover" && method === "GET") {
          return await handleDiscover(url, env, user);
        }
        if (path === "/api/title" && method === "GET") {
          return await handleTitle(url, env, user);
        }
        if (path === "/api/tv" && method === "GET") {
          return await handleTvInfo(url, env, user);
        }
        if (path === "/api/episodes") {
          if (method === "GET") return await handleSeasonEpisodes(url, env, user);
          if (method === "PUT") return await handleEpisodesSet(request, env, user);
          return json({ error: "method_not_allowed" }, 405);
        }
        if (path === "/api/lists") {
          if (method === "GET") return await handleListsGet(url, env, user);
          if (method === "POST") return await handleListCreate(request, env, user);
          if (method === "PUT") return await handleListUpdate(request, env, user);
          if (method === "DELETE") return await handleListDelete(url, env, user);
          return json({ error: "method_not_allowed" }, 405);
        }
        if (path === "/api/list" && method === "GET") {
          return await handleListView(url, env, user);
        }
        if (path === "/api/list-items" && method === "PUT") {
          return await handleListItemSet(request, env, user);
        }
        if (path === "/api/inline-settings" && method === "PUT") {
          return await handleInlineSettings(request, env, user);
        }
        if (path === "/api/list-share-image" && method === "POST") {
          return await handleShareImageSet(request, env, user);
        }
        if (path === "/api/list-share" && method === "POST") {
          return await handleListShare(request, env, user);
        }
        if (path === "/api/people-search" && method === "GET") {
          return await handlePeopleSearch(url, env, user);
        }
        if (path === "/api/profile" && method === "GET") {
          return await handleProfile(url, env, user);
        }
        if (path === "/api/follow") {
          if (method === "POST") return await handleFollow(request, env, user);
          if (method === "DELETE") return await handleUnfollow(url, env, user);
          return json({ error: "method_not_allowed" }, 405);
        }
        if (path === "/api/follow-requests" && method === "POST") {
          return await handleFollowRequest(request, env, user);
        }
        if (path === "/api/notifications" && method === "GET") {
          return await handleNotifications(url, env, user);
        }
        if (path === "/api/notifications-read" && method === "POST") {
          return await handleNotificationsRead(request, env, user);
        }
        if (path === "/api/privacy") {
          if (method === "GET") return await handlePrivacyGet(url, env, user);
          if (method === "PUT") return await handlePrivacySet(request, env, user);
          return json({ error: "method_not_allowed" }, 405);
        }
        if (path === "/api/profile-header" && method === "PUT") {
          return await handleHeaderSet(request, env, user);
        }
        if (path === "/api/header-options" && method === "GET") {
          return await handleHeaderOptions(url, env, user);
        }
        return json({ error: "not_found" }, 404);
      }

      return env.ASSETS.fetch(request);
    } catch (e) {
      return json({ error: "server_error" }, 500);
    }
  },
};
