/**
 * HMAC-signed, expiring session token for the trade area.
 * Edge-runtime compatible (Web Crypto only). Format: <expiresMs>.<hexSig>
 */
const enc = new TextEncoder();

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) return null;
  const out = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export const WHOLESALE_COOKIE = "ag_trade";

export function sessionHours(): number {
  const n = Number(process.env.WHOLESALE_SESSION_HOURS ?? "12");
  return Number.isFinite(n) && n > 0 && n <= 168 ? n : 12;
}

export async function createSessionToken(secret: string): Promise<string> {
  const expires = Date.now() + sessionHours() * 3600 * 1000;
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(String(expires)));
  return `${expires}.${toHex(sig)}`;
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string | undefined,
): Promise<boolean> {
  if (!token || !secret) return false;
  const [expStr, sigHex] = token.split(".");
  if (!expStr || !sigHex) return false;
  const expires = Number(expStr);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;
  const sig = fromHex(sigHex);
  if (!sig) return false;
  const key = await hmacKey(secret);
  return crypto.subtle.verify("HMAC", key, sig, enc.encode(expStr));
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return toHex(digest);
}

/** Constant-time comparison for equal-length strings. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
