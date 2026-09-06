import { adminRedirect, readAdminForm } from "@/lib/admin-actions";
import { deleteItem } from "@/lib/inventory/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await readAdminForm(req);
  if (!form) return adminRedirect(req, "/admin", undefined, "Request rejected. Please try again.");
  const id = String(form.get("id") ?? "");
  if (!/^[a-z0-9-]{4,40}$/.test(id)) return adminRedirect(req, "/admin", undefined, "Invalid item.");
  const ok = await deleteItem(id);
  return adminRedirect(req, "/admin", ok ? "Item deleted." : undefined, ok ? undefined : "Item not found.");
}
