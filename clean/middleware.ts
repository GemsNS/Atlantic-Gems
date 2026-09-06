import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_COOKIE,
  WHOLESALE_COOKIE,
  verifySessionToken,
} from "@/lib/security/session";
import { CSRF_COOKIE, randomToken } from "@/lib/security/csrf";

function buildCsp(nonce: string, https: boolean): string {
  const isDev = process.env.NODE_ENV !== "production";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    // Inventory images: our media route, plus eBay's image CDN for imports.
    "img-src 'self' data: blob: https://i.ebayimg.com",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    ...(https ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

function redirectToLogin(req: NextRequest, loginPath: string, csp: string) {
  const url = req.nextUrl.clone();
  url.pathname = loginPath;
  url.search = "";
  url.searchParams.set("next", req.nextUrl.pathname);
  const res = NextResponse.redirect(url);
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const nonce = randomToken(16);
  const https =
    req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
  const csp = buildCsp(nonce, https);
  const secret = process.env.SESSION_SECRET;

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  // Admin area and admin API: admin session required.
  const isAdminPage = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isAdminApi =
    pathname.startsWith("/api/admin") &&
    !pathname.startsWith("/api/admin/login") &&
    !pathname.startsWith("/api/admin/logout");
  if (isAdminPage || isAdminApi) {
    const ok = await verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value, secret, "admin");
    if (!ok) {
      if (isAdminApi) {
        return NextResponse.json({ ok: false, message: "Sign in required." }, { status: 401 });
      }
      return redirectToLogin(req, "/admin/login", csp);
    }
  }

  // Trade area: trade session (or admin session) required.
  if (pathname.startsWith("/wholesale") && !pathname.startsWith("/wholesale/login")) {
    const trade = await verifySessionToken(req.cookies.get(WHOLESALE_COOKIE)?.value, secret, "trade");
    const admin = await verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value, secret, "admin");
    if (!trade && !admin) return redirectToLogin(req, "/wholesale/login", csp);
  }

  const existing = req.cookies.get(CSRF_COOKIE)?.value;
  const csrfToken = existing && /^[0-9a-f]{64}$/.test(existing) ? existing : randomToken(32);
  requestHeaders.set("x-csrf-token", csrfToken);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);

  if (csrfToken !== existing) {
    res.cookies.set(CSRF_COOKIE, csrfToken, {
      httpOnly: false,
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
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|icon.jpg|.*\\.(?:png|jpg|jpeg|webp|avif|svg|woff2?)$).*)",
  ],
};
