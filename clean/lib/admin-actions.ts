import "server-only";
import { NextResponse } from "next/server";
import { csrfValid } from "@/lib/security/csrf";

/** Redirect back into the admin UI with a short status message. */
export function adminRedirect(req: Request, path: string, msg?: string, error?: string) {
  const url = new URL(path, req.url);
  if (msg) url.searchParams.set("msg", msg);
  if (error) url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}

/** Reads the form and validates CSRF; returns null when the request must be rejected. */
export async function readAdminForm(req: Request): Promise<FormData | null> {
  const form = await req.formData().catch(() => null);
  if (!form) return null;
  const csrf = String(form.get("csrf") ?? "");
  if (!csrfValid(req, csrf)) return null;
  return form;
}
