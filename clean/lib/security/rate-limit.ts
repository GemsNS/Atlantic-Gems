/**
 * In-memory sliding-window rate limiter.
 * Suitable for a single Node process. For multi-instance deployments swap the
 * store for Redis or an equivalent shared store. Proxy headers are read only
 * when TRUST_PROXY=true, and then only the entry our proxy wrote; see clientIp.
 */
interface Bucket {
  hits: number[];
  /** Each bucket expires on its own window, not the caller's. */
  windowMs: number;
}

const store = new Map<string, Bucket>();
const MAX_KEYS = 10_000;
const PRUNE_EVERY_MS = 1_000;
let prunedAt = 0;

/** Drops expired hits once the store is full, at most once a second. */
function prune(now: number) {
  if (store.size < MAX_KEYS || now - prunedAt < PRUNE_EVERY_MS) return;
  prunedAt = now;
  for (const [key, bucket] of store) {
    bucket.hits = bucket.hits.filter((t) => now - t < bucket.windowMs);
    if (bucket.hits.length === 0) store.delete(key);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  prune(now);
  if (!store.has(key) && store.size >= MAX_KEYS) {
    // Still full after pruning: clients are arriving faster than their
    // windows expire. New ones share one overflow bucket per scope, so every
    // limit still applies and memory stays bounded.
    const colon = key.indexOf(":");
    key = `${colon < 0 ? key : key.slice(0, colon)}:overflow`;
  }
  const bucket = store.get(key) ?? { hits: [], windowMs };
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

const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/;

/**
 * The rate-limit key for an IPv6 address: its /64 network, the block one
 * host or customer line is usually given. Keying each full address would let
 * anyone with a routed /64 take a fresh bucket for every request. IPv4-mapped
 * addresses fold to plain IPv4. Null when it is not an IPv6 address.
 */
function v6Key(raw: string): string | null {
  // A zone ("fe80::1%eth0") names the local interface, not the client.
  const ip = raw.split("%")[0]!;
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(ip);
  if (mapped) return mapped[1]!;
  // A trailing dotted quad ("64:ff9b::192.0.2.1") is the last two groups.
  let text = ip;
  const tail = /(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (tail) {
    const [a, b, c, d] = tail.slice(1).map(Number) as [number, number, number, number];
    if ([a, b, c, d].some((n) => n > 255)) return null;
    text = `${ip.slice(0, tail.index)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const halves = text.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const gap = 8 - left.length - right.length;
  if (halves.length === 2 ? gap < 1 : gap !== 0) return null;
  const groups = [...left, ...Array<string>(halves.length === 2 ? gap : 0).fill("0"), ...right];
  if (!groups.every((g) => /^[0-9a-f]{1,4}$/.test(g))) return null;
  const n = groups.map((g) => parseInt(g, 16));
  // ::ffff:c000:0201 is IPv4 written in hex.
  if (n.slice(0, 5).every((x) => x === 0) && n[5] === 0xffff) {
    return [n[6]! >> 8, n[6]! & 255, n[7]! >> 8, n[7]! & 255].join(".");
  }
  return `v6:${n.slice(0, 4).map((x) => x.toString(16)).join(":")}::/64`;
}

/** The key for one client address: IPv4 as written, IPv6 by its /64. */
function normaliseIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let ip = raw.trim().toLowerCase();
  if (ip.length > 64) return null;
  // "[2001:db8::1]:443" and "203.0.113.5:51234" carry a port some proxies add.
  const bracketed = /^\[([^\]]+)\](?::\d+)?$/.exec(ip);
  if (bracketed) ip = bracketed[1]!;
  else if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(ip)) ip = ip.slice(0, ip.lastIndexOf(":"));
  if (IPV4.test(ip)) return ip.split(".").every((o) => Number(o) <= 255) ? ip : null;
  return ip.includes(":") ? v6Key(ip) : null;
}

/**
 * Number of trusted proxies in front of the app (TRUST_PROXY_HOPS, default 1).
 * Each one appends the address it received the connection from, so the
 * client's real address sits that many entries from the right.
 */
function trustedHops(): number {
  const n = Number(process.env.TRUST_PROXY_HOPS ?? 1);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : 1;
}

/**
 * The address a rate limit is counted against, or null when it cannot be
 * known safely.
 *
 * Everything left of what our own proxy appended to X-Forwarded-For was sent
 * by the client and can be anything, so only the right-most trusted entry is
 * used. Without TRUST_PROXY no header is believed at all, X-Real-IP included:
 * a client reaching the app directly could otherwise rotate the header and
 * never be limited. X-Real-IP is a fallback for a single proxy only: with
 * more than one, a client that reaches the inner proxy directly could send
 * its own, which that proxy may pass through.
 */
export function clientIp(req: Request): string | null {
  if (process.env.TRUST_PROXY !== "true") return null;
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const entries = xff.split(",").map((e) => e.trim()).filter(Boolean);
    // Fewer entries than hops means a proxy did not append; the left-most is
    // then the one the nearest proxy wrote.
    const ip = normaliseIp(entries[Math.max(0, entries.length - trustedHops())]);
    if (ip) return ip;
  }
  if (trustedHops() > 1) return null;
  return normaliseIp(req.headers.get("x-real-ip"));
}

export function clientKey(req: Request, scope: string): string {
  // Unknown clients share one bucket per scope, so limits still apply.
  return `${scope}:${clientIp(req) ?? "local"}`;
}
