import { csrfValid } from "@/lib/security/csrf";
import { cartAvailable, clearCart } from "@/lib/cart";
import { seeOther } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!cartAvailable()) {
    return seeOther("/cart?error=unavailable");
  }
  const form = await req.formData().catch(() => null);
  if (!form || !csrfValid(req, String(form.get("csrf") ?? ""))) {
    // Said out loud, as add and update do: the tray was not emptied.
    return seeOther("/cart?error=csrf");
  }
  await clearCart();
  return seeOther("/cart");
}
