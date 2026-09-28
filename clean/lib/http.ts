import { NextResponse } from "next/server";

/**
 * A 303 to a path on this site, with a relative Location.
 *
 * Never build the target from `req.url`: behind the proxy in docs/DEPLOY.md,
 * Next resolves a route handler's `req.url` against the server's own address
 * (`https://localhost:3000`), and the proxy does not rewrite that Location, so
 * the customer's browser would be sent to their own machine. The path and
 * query are taken from a parsed URL, which resolves dot segments: a path such
 * as `/admin/..//evil.example` comes out as `//evil.example`, which a browser
 * reads as another host. Callers check a caller-supplied path after resolving
 * it (safeAdminNext, safeNextPath); as a backstop, leading slashes are
 * collapsed to one here, so the Location always stays on this site. Cookies
 * can still be set on the response with `res.cookies.set`.
 */
export function seeOther(path: string, params?: Record<string, string | undefined>): NextResponse {
  const url = new URL(path, "http://n");
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) url.searchParams.set(key, value);
  }
  let p = url.pathname;
  if (p.startsWith("//")) p = `/${p.replace(/^\/+/, "")}`;
  return new NextResponse(null, { status: 303, headers: { Location: p + url.search } });
}
