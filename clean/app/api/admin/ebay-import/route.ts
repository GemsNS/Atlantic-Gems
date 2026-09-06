import { adminRedirect, readAdminForm } from "@/lib/admin-actions";
import { ebayConfigured, importFromEbay } from "@/lib/inventory/ebay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await readAdminForm(req);
  if (!form) return adminRedirect(req, "/admin", undefined, "Request rejected. Please try again.");
  if (!ebayConfigured()) {
    return adminRedirect(req, "/admin", undefined, "eBay is not configured on this server.");
  }
  try {
    const r = await importFromEbay();
    return adminRedirect(req, "/admin", `eBay import complete: ${r.imported} active, ${r.ended} marked sold.`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return adminRedirect(req, "/admin", undefined, `eBay import failed: ${msg}`);
  }
}
