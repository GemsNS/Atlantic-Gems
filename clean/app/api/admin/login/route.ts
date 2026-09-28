import { csrfValid } from "@/lib/security/csrf";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { verifyPasswordLimited } from "@/lib/security/admin";
import { ADMIN_COOKIE, createSessionToken, sessionHours } from "@/lib/security/session";
import { seeOther } from "@/lib/http";
import { safeAdminNext } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function back(error: string) {
  return seeOther("/admin/login", { error });
}

export async function POST(req: Request) {
  const rl = rateLimit(clientKey(req, "admin-login"), 5, 15 * 60 * 1000);
  if (!rl.ok) return back("rate");

  const form = await req.formData().catch(() => null);
  if (!form) return back("1");
  const password = String(form.get("password") ?? "");
  const csrf = String(form.get("csrf") ?? "");
  const next = form.get("next");
  if (!csrfValid(req, csrf) || password.length === 0 || password.length > 256) return back("1");

  const secret = process.env.SESSION_SECRET;
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!secret || secret.length < 32 || !stored) return back("config");
  const ok = await verifyPasswordLimited(password, stored);
  // Two checks already running: answered like the rate limit.
  if (ok === null) return back("rate");
  if (!ok) return back("1");

  const token = await createSessionToken(secret, "admin");
  const res = seeOther(safeAdminNext(typeof next === "string" ? next : undefined));
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: sessionHours("admin") * 3600,
  });
  return res;
}
