import { csrfValid } from "@/lib/security/csrf";
import { cartAvailable, removeFromCart, setCartQty } from "@/lib/cart";
import { getSettings } from "@/lib/inventory/store";
import { seeOther } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Edits one line of the quote tray: a new quantity, or take it out. */
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
  if (!partId) {
    return seeOther("/cart");
  }
  if (String(form.get("intent") ?? "") === "remove") {
    await removeFromCart(partId);
  } else {
    await setCartQty(partId, Number(form.get("qty") ?? 1));
  }
  return seeOther("/cart");
}
