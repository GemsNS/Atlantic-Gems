import "server-only";
import { randomBytes, scrypt, scryptSync, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * Admin password hashing with scrypt (Node built-in, no dependency).
 * Stored format: scrypt$N$r$p$saltHex$hashHex
 * Generate with: node scripts/hash-password.mjs
 */
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

function scryptAsync(password: string, salt: Buffer, keylen: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

/**
 * Checks a password against the stored hash. The scrypt work (tens of
 * milliseconds) runs on libuv's thread pool, so a burst of sign-in attempts
 * does not stall page renders on the event loop.
 */
export async function verifyPassword(password: string, stored: string | undefined): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = Buffer.from(parts[4] ?? "", "hex");
  const expected = Buffer.from(parts[5] ?? "", "hex");
  if (!n || !r || !p || salt.length < 8 || expected.length === 0) return false;
  try {
    const actual = await scryptAsync(password, salt, expected.length, { N: n, r, p });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** Password checks allowed at once in this process; the rest are turned away. */
const MAX_CHECKS = 2;
let checking = 0;

/**
 * verifyPassword with a cap on how many run at once, so rotating client
 * addresses past the per-address limit cannot queue unbounded scrypt work.
 * Returns null when the cap is reached; the caller answers "try later".
 */
export async function verifyPasswordLimited(password: string, stored: string | undefined): Promise<boolean | null> {
  if (checking >= MAX_CHECKS) return null;
  checking += 1;
  try {
    return await verifyPassword(password, stored);
  } finally {
    checking -= 1;
  }
}
