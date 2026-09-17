import { NextResponse } from "next/server";
import { csrfValid } from "@/lib/security/csrf";
import { clearCart } from "@/lib/cart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form || !csrfValid(req, String(form.get("csrf") ?? ""))) {
    return NextResponse.redirect(new URL("/cart", req.url), 303);
  }
  await clearCart();
  return NextResponse.redirect(new URL("/cart", req.url), 303);
}
