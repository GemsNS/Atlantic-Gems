import { adminRedirect, readAdminForm } from "@/lib/admin-actions";
import { deleteItem } from "@/lib/inventory/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await readAdminForm(req);
  if (!form) return adminRedirect("/admin", { error: "rejected" });
  const id = String(form.get("id") ?? "");
  if (!/^[a-z0-9-]{4,40}$/.test(id)) return adminRedirect("/admin", { error: "invalid-item" });
  const ok = await deleteItem(id);
  return adminRedirect("/admin", ok ? { msg: "item-deleted" } : { error: "item-not-found" });
}
