import { NextResponse } from "next/server";
import { csrfValid } from "@/lib/security/csrf";
import { WHOLESALE_COOKIE } from "@/lib/security/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const csrf = form ? String(form.get("csrf") ?? "") : "";
  const res = NextResponse.redirect(new URL("/", req.url), 303);
  // Even without a valid CSRF token, clearing a session is harmless; but we
  // only honour it when the request is same-origin to avoid forced logouts.
  if (csrfValid(req, csrf)) {
    res.cookies.set(WHOLESALE_COOKIE, "", { path: "/wholesale", maxAge: 0 });
  }
  return res;
}
