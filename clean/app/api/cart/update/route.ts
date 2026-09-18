import { NextResponse } from "next/server";
import { csrfValid } from "@/lib/security/csrf";
import { removeFromCart, setCartQty } from "@/lib/cart";
import { getSettings } from "@/lib/inventory/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Edits one line of the quote tray: a new quantity, or take it out. */
export async function POST(req: Request) {
  const settings = await getSettings();
  if (!settings.pages.parts) {
    return NextResponse.redirect(new URL("/", req.url), 303);
  }
  const form = await req.formData().catch(() => null);
  if (!form || !csrfValid(req, String(form.get("csrf") ?? ""))) {
    return NextResponse.redirect(new URL("/cart?error=csrf", req.url), 303);
  }
  const partId = String(form.get("partId") ?? "");
  if (!partId) {
    return NextResponse.redirect(new URL("/cart", req.url), 303);
  }
  if (String(form.get("intent") ?? "") === "remove") {
    await removeFromCart(partId);
  } else {
    await setCartQty(partId, Number(form.get("qty") ?? 1));
  }
  return NextResponse.redirect(new URL("/cart", req.url), 303);
}
