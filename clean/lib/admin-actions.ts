import "server-only";
import type { AdminError, AdminMsg } from "@/lib/admin-messages";
import { seeOther } from "@/lib/http";
import { csrfValid } from "@/lib/security/csrf";

/**
 * Redirect back into the admin UI with a status or alert code. Only codes
 * travel in the URL; lib/admin-messages.ts turns them into words.
 */
export function adminRedirect(path: string, flash: { msg?: AdminMsg; error?: AdminError } = {}) {
  return seeOther(path, { msg: flash.msg, error: flash.error });
}

/** Reads the form and validates CSRF; returns null when the request must be rejected. */
export async function readAdminForm(req: Request): Promise<FormData | null> {
  const form = await req.formData().catch(() => null);
  if (!form) return null;
  const csrf = String(form.get("csrf") ?? "");
  if (!csrfValid(req, csrf)) return null;
  return form;
}
