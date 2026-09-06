import { NextResponse } from "next/server";
import { csrfValid } from "@/lib/security/csrf";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { verifyPassword } from "@/lib/security/admin";
import { ADMIN_COOKIE, createSessionToken, sessionHours } from "@/lib/security/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function back(req: Request, error: string) {
  const url = new URL("/admin/login", req.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}

function safeNext(input: string | undefined): string {
  if (!input || !input.startsWith("/admin") || input.startsWith("//") || input.includes("://")) {
    return "/admin";
  }
  return input;
}

export async function POST(req: Request) {
  const rl = rateLimit(clientKey(req, "admin-login"), 5, 15 * 60 * 1000);
  if (!rl.ok) return back(req, "rate");

  const form = await req.formData().catch(() => null);
  if (!form) return back(req, "1");
  const password = String(form.get("password") ?? "");
  const csrf = String(form.get("csrf") ?? "");
  const next = form.get("next");
  if (!csrfValid(req, csrf) || password.length === 0 || password.length > 256) return back(req, "1");

  const secret = process.env.SESSION_SECRET;
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!secret || secret.length < 32 || !stored) return back(req, "config");
  if (!verifyPassword(password, stored)) return back(req, "1");

  const token = await createSessionToken(secret, "admin");
  const res = NextResponse.redirect(new URL(safeNext(typeof next === "string" ? next : undefined), req.url), 303);
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: sessionHours("admin") * 3600,
  });
  return res;
}
