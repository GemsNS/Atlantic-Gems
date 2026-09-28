import { csrfValid } from "@/lib/security/csrf";
import { ADMIN_COOKIE } from "@/lib/security/session";
import { seeOther } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const csrf = form ? String(form.get("csrf") ?? "") : "";
  const res = seeOther("/admin/login");
  if (csrfValid(req, csrf)) {
    res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  }
  return res;
}
