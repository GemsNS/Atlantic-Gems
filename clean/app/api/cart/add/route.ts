import { NextResponse } from "next/server";
import { csrfValid } from "@/lib/security/csrf";
import { addToCart } from "@/lib/cart";
import { getPart, isPublicPart } from "@/lib/parts/store";
import { getSettings } from "@/lib/inventory/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const settings = await getSettings();
  if (!settings.pages.parts) {
    return NextResponse.redirect(new URL("/", req.url), 303);
  }
  const form = await req.formData().catch(() => null);
  if (!form || !csrfValid(req, String(form.get("csrf") ?? ""))) {
    return NextResponse.redirect(new URL("/parts?error=csrf", req.url), 303);
  }
  const partId = String(form.get("partId") ?? "");
  const qty = Math.max(1, Math.min(999, Number(form.get("qty") ?? 1) || 1));
  const part = await getPart(partId);
  if (!part || !isPublicPart(part)) {
    return NextResponse.redirect(new URL("/parts", req.url), 303);
  }
  await addToCart(partId, qty);
  return NextResponse.redirect(new URL("/cart", req.url), 303);
}
