import { adminRedirect, readAdminForm } from "@/lib/admin-actions";
import { getItem, upsertItem } from "@/lib/inventory/store";
import { itemSchema, newId } from "@/lib/inventory/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
}

export async function POST(req: Request) {
  const form = await readAdminForm(req);
  if (!form) return adminRedirect("/admin", { error: "rejected" });

  const id = str(form, "id").trim();
  const existing = id ? await getItem(id) : null;
  if (id && !existing) return adminRedirect("/admin", { error: "item-not-found" });

  const priceRaw = str(form, "price").replace(/[,\s]/g, "");
  const price = priceRaw === "" ? null : Number(priceRaw);
  if (price !== null && !Number.isFinite(price)) {
    return adminRedirect(id ? `/admin/items/${id}` : "/admin/items/new", { error: "price-nan" });
  }

  const images = form
    .getAll("images")
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);

  const now = new Date().toISOString();
  const candidate = {
    id: existing?.id ?? newId(),
    sku: str(form, "sku"),
    title: str(form, "title"),
    category: str(form, "category"),
    condition: str(form, "condition"),
    status: str(form, "status"),
    visibility: str(form, "visibility"),
    metal: str(form, "metal"),
    stones: str(form, "stones"),
    size: str(form, "size"),
    price,
    currency: str(form, "currency") || "CAD",
    description: str(form, "description"),
    disclosure: str(form, "disclosure"),
    images,
    source: existing?.source ?? "manual",
    ebayItemId: existing?.ebayItemId,
    ebayUrl: existing?.ebayUrl,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const parsed = itemSchema.safeParse(candidate);
  if (!parsed.success) {
    // Only the field name travels in the URL; lib/admin-messages.ts words the alert.
    const field = parsed.error.issues[0]?.path[0];
    return adminRedirect(id ? `/admin/items/${id}` : "/admin/items/new", {
      error: typeof field === "string" ? `item-invalid:${field}` : "invalid-item",
    });
  }

  await upsertItem(parsed.data);
  return adminRedirect("/admin", { msg: existing ? "item-updated" : "item-added" });
}
