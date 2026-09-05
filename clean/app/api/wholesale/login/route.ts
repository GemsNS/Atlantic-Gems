import { NextResponse } from "next/server";
import { loginSchema, safeNextPath } from "@/lib/validation";
import { csrfValid } from "@/lib/security/csrf";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import {
  WHOLESALE_COOKIE,
  createSessionToken,
  safeEqual,
  sessionHours,
  sha256Hex,
} from "@/lib/security/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

function back(req: Request, error: string) {
  const url = new URL("/wholesale/login", req.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}

export async function POST(req: Request) {
  const rl = rateLimit(clientKey(req, "trade-login"), LIMIT, WINDOW_MS);
  if (!rl.ok) return back(req, "rate");

  const form = await req.formData().catch(() => null);
  if (!form) return back(req, "1");

  const parsed = loginSchema.safeParse({
    passphrase: form.get("passphrase"),
    csrf: form.get("csrf"),
    next: form.get("next") ?? undefined,
  });
  if (!parsed.success) return back(req, "1");
  if (!csrfValid(req, parsed.data.csrf)) return back(req, "1");

  const expected = process.env.WHOLESALE_PASSWORD_SHA256?.toLowerCase();
  const secret = process.env.SESSION_SECRET;
  if (!expected || !/^[0-9a-f]{64}$/.test(expected) || !secret || secret.length < 32) {
    return back(req, "config");
  }

  const actual = await sha256Hex(parsed.data.passphrase);
  if (!safeEqual(actual, expected)) return back(req, "1");

  const token = await createSessionToken(secret);
  const dest = new URL(safeNextPath(parsed.data.next), req.url);
  const res = NextResponse.redirect(dest, 303);
  res.cookies.set(WHOLESALE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/wholesale",
    maxAge: sessionHours() * 3600,
  });
  return res;
}
