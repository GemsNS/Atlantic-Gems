import { adminRedirect, readAdminForm } from "@/lib/admin-actions";
import { deletePart, listParts } from "@/lib/parts/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACK = "/admin/parts";

/**
 * Deletes every part marked demo. The file stays `seeded: true`, so the seed
 * catalogue is not written back, even when nothing is left.
 */
export async function POST(req: Request) {
  // readAdminForm checks the token with csrfValid; middleware has already
  // required an admin session for /api/admin.
  const form = await readAdminForm(req);
  if (!form) return adminRedirect(BACK, { error: "rejected" });
  // There is no undo, so the removal has to be confirmed on the form.
  if (form.get("confirm") !== "on") {
    return adminRedirect(BACK, { error: "confirm-retire" });
  }
  let removed = 0;
  try {
    const demo = (await listParts()).filter((p) => p.demo);
    if (demo.length === 0) return adminRedirect(BACK, { msg: "no-demo" });
    for (const part of demo) {
      if (await deletePart(part.id)) removed += 1;
    }
  } catch (err) {
    console.error("[parts] retiring demo lines failed:", err instanceof Error ? err.message : "unknown error");
    return adminRedirect(BACK, { error: removed > 0 ? `retire-partial:${removed}` : "retire-failed" });
  }
  return adminRedirect(BACK, { msg: `retired:${removed}` });
}
