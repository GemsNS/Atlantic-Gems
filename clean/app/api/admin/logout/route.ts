import { NextResponse } from "next/server";
import { csrfValid } from "@/lib/security/csrf";
import { ADMIN_COOKIE } from "@/lib/security/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const csrf = form ? String(form.get("csrf") ?? "") : "";
  const res = NextResponse.redirect(new URL("/admin/login", req.url), 303);
  if (csrfValid(req, csrf)) {
    res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  }
  return res;
}
