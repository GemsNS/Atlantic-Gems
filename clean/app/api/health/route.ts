import { NextResponse } from "next/server";
import { access, constants, mkdir } from "node:fs/promises";
import { DATA_DIR } from "@/lib/json-store";
import { checkDataFiles } from "@/lib/data-health";
import { mailConfigured } from "@/lib/mail";
import { readCookie } from "@/lib/security/csrf";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/security/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Readiness for the proxy or an uptime monitor. The public answer is only
 * ok/503; the per-check breakdown (which would advertise missing secrets) is
 * returned to a signed-in admin only.
 *
 * - Plain /api/health: DATA_DIR can be read and written. This is readiness,
 *   so a single broken data file never takes the only instance out of a
 *   proxy's rotation (CI and the e2e server wait on it too).
 * - /api/health?deep=1: also that parts.json, inventory.json and the CRM
 *   files read and parse. /parts and /cart stream their data, so a broken
 *   file shows the error page with status 200; point the uptime monitor here
 *   to notice it. A missing file is an empty store and passes.
 */
export async function GET(req: Request) {
  let storage = false;
  try {
    // A fresh deploy has no data directory until the first write; create it so
    // readiness reflects permissions, not install order.
    await mkdir(DATA_DIR, { recursive: true });
    await access(DATA_DIR, constants.R_OK | constants.W_OK);
    storage = true;
  } catch {
    storage = false;
  }

  const deep = new URL(req.url).searchParams.get("deep") === "1";
  const secret = process.env.SESSION_SECRET;
  const admin = await verifySessionToken(readCookie(req, ADMIN_COOKIE), secret, "admin");
  const data = deep || admin ? await checkDataFiles() : null;
  const ok = storage && (!deep || Boolean(data?.ok));
  const body = admin
    ? {
        ok,
        checks: {
          storage,
          data: data?.ok ?? false,
          mail: mailConfigured(),
          sessionSecret: (secret ?? "").length >= 32,
        },
        // File names inside DATA_DIR and a code each: "ok", "missing", or the
        // read error (EJSON, ESHAPE, EACCES and so on).
        files: data?.files ?? {},
      }
    : { ok };
  return NextResponse.json(body, {
    status: ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
