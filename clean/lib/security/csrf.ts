/**
 * CSRF defence for state-changing routes:
 *  1. Origin / Referer must match the configured site origin or request host.
 *  2. Double-submit token: cookie value must equal the submitted token.
 */
export const CSRF_COOKIE = "ag_csrf";

export function randomToken(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function originAllowed(req: Request): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const configured = process.env.NEXT_PUBLIC_SITE_URL;

  const candidates = new Set<string>();
  if (configured) {
    try {
      candidates.add(new URL(configured).host);
    } catch {
      /* ignore malformed config */
    }
  }
  if (host) candidates.add(host);

  const source = origin ?? referer;
  if (!source) return false;
  try {
    return candidates.has(new URL(source).host);
  } catch {
    return false;
  }
}

export function readCookie(req: Request, name: string): string | undefined {
  const raw = req.headers.get("cookie");
  if (!raw) return undefined;
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

export function csrfValid(req: Request, submitted: string | undefined): boolean {
  if (!originAllowed(req)) return false;
  const cookie = readCookie(req, CSRF_COOKIE);
  if (!cookie || !submitted) return false;
  if (cookie.length !== submitted.length) return false;
  let diff = 0;
  for (let i = 0; i < cookie.length; i++) {
    diff |= cookie.charCodeAt(i) ^ submitted.charCodeAt(i);
  }
  return diff === 0;
}
