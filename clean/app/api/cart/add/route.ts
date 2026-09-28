import { csrfValid } from "@/lib/security/csrf";
import { addToCart, cartAvailable } from "@/lib/cart";
import { getPart, isPublicPart } from "@/lib/parts/store";
import { getSettings } from "@/lib/inventory/store";
import { seeOther } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const settings = await getSettings();
  if (!settings.pages.parts) {
    return seeOther("/");
  }
  if (!cartAvailable()) {
    return seeOther("/cart?error=unavailable");
  }
  const form = await req.formData().catch(() => null);
  if (!form || !csrfValid(req, String(form.get("csrf") ?? ""))) {
    return seeOther("/cart?error=csrf");
  }
  const partId = String(form.get("partId") ?? "");
  const qty = Math.max(1, Math.min(999, Number(form.get("qty") ?? 1) || 1));
  let part;
  try {
    part = await getPart(partId);
  } catch {
    // An unreadable parts.json (logged by readJson): the tray is left as it is.
    return seeOther("/cart?error=store");
  }
  if (!part || !isPublicPart(part)) {
    return seeOther("/parts");
  }
  await addToCart(partId, qty);
  return seeOther("/cart");
}
