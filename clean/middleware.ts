import { NextResponse, type NextRequest } from "next/server";
import { WHOLESALE_COOKIE, verifySessionToken } from "@/lib/security/session";
import { CSRF_COOKIE, randomToken } from "@/lib/security/csrf";

function buildCsp(nonce: string, https: boolean): string {
  const isDev = process.env.NODE_ENV !== "production";
  return [
    "default-src 'self'",
    // Next.js inline runtime scripts receive the nonce automatically.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Inline style attributes are used for per-stone CSS variables.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    // Only meaningful once the site is served over TLS; on plain HTTP it
    // would upgrade same-origin fetches to https and break them.
    ...(https ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const nonce = randomToken(16);
  const https =
    req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
  const csp = buildCsp(nonce, https);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  // Gate the trade area. The login page itself stays reachable.
  if (pathname.startsWith("/wholesale") && !pathname.startsWith("/wholesale/login")) {
    const token = req.cookies.get(WHOLESALE_COOKIE)?.value;
    const ok = await verifySessionToken(token, process.env.SESSION_SECRET);
    if (!ok) {
      const url = req.nextUrl.clone();
      url.pathname = "/wholesale/login";
      url.search = "";
      url.searchParams.set("next", pathname);
      const redirect = NextResponse.redirect(url);
      redirect.headers.set("Content-Security-Policy", csp);
      return redirect;
    }
  }

  // Issue a CSRF token for forms. Pages read it from the request header so it
  // is available on the very first visit before the cookie round-trips.
  const existing = req.cookies.get(CSRF_COOKIE)?.value;
  const csrfToken = existing && /^[0-9a-f]{64}$/.test(existing) ? existing : randomToken(32);
  requestHeaders.set("x-csrf-token", csrfToken);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);

  if (csrfToken !== existing) {
    res.cookies.set(CSRF_COOKIE, csrfToken, {
      httpOnly: false, // read by the form to double-submit
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 6,
    });
  }
  return res;
}

export const config = {
  matcher: [
    // Skip static assets and Next internals.
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|icon.svg|.*\\.(?:png|jpg|jpeg|webp|avif|svg|woff2?)$).*)",
  ],
};
