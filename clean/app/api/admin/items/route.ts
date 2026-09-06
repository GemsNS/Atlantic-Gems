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
  if (!form) return adminRedirect(req, "/admin", undefined, "Request rejected. Please try again.");

  const id = str(form, "id").trim();
  const existing = id ? await getItem(id) : null;
  if (id && !existing) return adminRedirect(req, "/admin", undefined, "Item not found.");

  const priceRaw = str(form, "price").replace(/[,\s]/g, "");
  const price = priceRaw === "" ? null : Number(priceRaw);
  if (price !== null && !Number.isFinite(price)) {
    return adminRedirect(req, id ? `/admin/items/${id}` : "/admin/items/new", undefined, "Price must be a number.");
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
    const first = parsed.error.issues[0];
    const where = first ? `${String(first.path[0] ?? "form")}: ${first.message}` : "Invalid item.";
    return adminRedirect(req, id ? `/admin/items/${id}` : "/admin/items/new", undefined, where);
  }

  await upsertItem(parsed.data);
  return adminRedirect(req, "/admin", existing ? "Item updated." : "Item added.");
}
