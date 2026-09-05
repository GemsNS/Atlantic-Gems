/**
 * In-memory sliding-window rate limiter.
 * Suitable for a single Node process. For multi-instance deployments swap the
 * store for Redis or an equivalent shared store. Never trusts X-Forwarded-For
 * unless TRUST_PROXY=true.
 */
interface Bucket {
  hits: number[];
}

const store = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

function prune(now: number, windowMs: number) {
  if (store.size < MAX_KEYS) return;
  for (const [key, bucket] of store) {
    bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
    if (bucket.hits.length === 0) store.delete(key);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  prune(now, windowMs);
  const bucket = store.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0] ?? now;
    store.set(key, bucket);
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }
  bucket.hits.push(now);
  store.set(key, bucket);
  return { ok: true, remaining: limit - bucket.hits.length, retryAfterSec: 0 };
}

export function clientKey(req: Request, scope: string): string {
  const trust = process.env.TRUST_PROXY === "true";
  let ip = "local";
  if (trust) {
    const xff = req.headers.get("x-forwarded-for");
    const first = xff?.split(",")[0]?.trim();
    if (first) ip = first;
  } else {
    // Without a trusted proxy the client IP is unknown; use a coarse key so
    // limits still apply per scope.
    ip = req.headers.get("x-real-ip") ?? "local";
  }
  return `${scope}:${ip}`;
}
