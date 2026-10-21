// Per-user request limits.
//
// Layer 1 (works everywhere, no setup): a counter kept in memory. It is approximate,
// because Cloudflare may run several copies of the Worker, each with its own counter.
// Layer 2 (optional): if Cloudflare's own rate-limit bindings named RL_READ, RL_SEARCH,
// RL_WRITE or RL_HEALTH are configured in wrangler.jsonc, they are used instead.

const WINDOW_MS = 60 * 1000;

const LIMITS = {
  read: 120, // opening screens, library list
  search: 30, // title search (each one costs a TMDB call)
  write: 40, // saving / removing library items
  health: 10, // the public /api/health page (per IP address)
};

const buckets = new Map();

function prune(now) {
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

// Returns true if this request is allowed, false if the limit is exceeded.
export async function allow(env, kind, who) {
  const limit = LIMITS[kind];
  if (!limit) return true;

  const binding = env["RL_" + kind.toUpperCase()];
  if (binding && typeof binding.limit === "function") {
    try {
      const result = await binding.limit({ key: kind + ":" + who });
      return result.success;
    } catch (e) {
      // fall through to the in-memory counter
    }
  }

  const now = Date.now();
  const key = kind + ":" + who;
  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, bucket);
  }
  bucket.count++;

  if (buckets.size > 5000) prune(now);
  return bucket.count <= limit;
}
