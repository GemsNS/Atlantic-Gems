import { adminRedirect, readAdminForm } from "@/lib/admin-actions";
import { ebayConfigured, importFromEbay } from "@/lib/inventory/ebay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await readAdminForm(req);
  if (!form) return adminRedirect("/admin/connect", { error: "rejected" });
  if (!ebayConfigured()) {
    return adminRedirect("/admin/connect", { error: "ebay-unconfigured" });
  }
  try {
    const r = await importFromEbay();
    return adminRedirect("/admin/connect", { msg: `ebay-synced:${r.imported}.${r.ended}.${r.skipped}` });
  } catch (err) {
    // The reason goes to the server log, not into the URL.
    console.error("[ebay] sync failed:", err instanceof Error ? err.message : "unknown error");
    return adminRedirect("/admin/connect", { error: "ebay-failed" });
  }
}
