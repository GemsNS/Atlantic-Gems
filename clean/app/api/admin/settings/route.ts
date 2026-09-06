import { adminRedirect, readAdminForm } from "@/lib/admin-actions";
import { updateSettings } from "@/lib/inventory/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await readAdminForm(req);
  if (!form) return adminRedirect(req, "/admin", undefined, "Request rejected. Please try again.");
  const shopOpen = form.get("shopOpen") === "open";
  await updateSettings({ shopOpen });
  return adminRedirect(
    req,
    "/admin",
    shopOpen ? "Shop is now OPEN: public items are visible." : "Shop is now CLOSED: collection hidden.",
  );
}
