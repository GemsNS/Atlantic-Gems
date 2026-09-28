import { CSRF_COOKIE } from "@/lib/security/csrf";

/**
 * The token cookie as the browser holds it now (not HttpOnly by design: it is
 * double-submitted). When a post is refused for an expired token, middleware
 * has already set a fresh one on that response, so a form can read it here
 * and retry once instead of asking the customer to reload. Browser only.
 */
export function currentCsrfCookie(): string | null {
  for (const part of document.cookie.split(";")) {
    const [k, v] = part.trim().split("=");
    if (k === CSRF_COOKIE && v && /^[0-9a-f]{64}$/.test(v)) return v;
  }
  return null;
}
