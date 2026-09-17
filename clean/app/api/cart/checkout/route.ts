import { NextResponse } from "next/server";
import { csrfValid } from "@/lib/security/csrf";
import { clearCart, getCart } from "@/lib/cart";
import { getPart } from "@/lib/parts/store";
import { newId } from "@/lib/inventory/types";
import {
  findOrCreateContactByEmail,
  upsertDeal,
  upsertQuote,
} from "@/lib/crm/store";
import { createPaymentIntent } from "@/lib/integrations/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form || !csrfValid(req, String(form.get("csrf") ?? ""))) {
    return NextResponse.redirect(new URL("/cart?error=csrf", req.url), 303);
  }
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const company = String(form.get("company") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();
  if (name.length < 2 || !email.includes("@")) {
    return NextResponse.redirect(new URL("/cart?error=fields", req.url), 303);
  }

  const lines = await getCart();
  if (lines.length === 0) {
    return NextResponse.redirect(new URL("/cart", req.url), 303);
  }

  const quoteLines = [];
  let total = 0;
  for (const l of lines) {
    const part = await getPart(l.partId);
    if (!part) continue;
    const unit = part.price;
    if (unit != null) total += unit * l.qty;
    quoteLines.push({
      sku: part.sku,
      title: part.title,
      qty: l.qty,
      unitPrice: unit,
      partId: part.id,
    });
  }

  const now = new Date().toISOString();
  const contact = await findOrCreateContactByEmail({
    name,
    email,
    company,
    kind: company ? "trade" : "retail",
    notes: notes || undefined,
  });
  const deal = await upsertDeal({
    id: newId(),
    contactId: contact.id,
    title: `Parts quote — ${name}`,
    stage: "rfq",
    value: total || null,
    currency: "CAD",
    source: "cart",
    notes,
    createdAt: now,
    updatedAt: now,
  });
  const quote = await upsertQuote({
    id: newId(),
    contactId: contact.id,
    dealId: deal.id,
    status: "sent",
    lines: quoteLines,
    notes,
    customerName: name,
    customerEmail: email,
    currency: "CAD",
    createdAt: now,
    updatedAt: now,
  });

  await createPaymentIntent({
    amountCents: Math.round(total * 100),
    currency: "CAD",
    quoteId: quote.id,
  });

  await clearCart();
  return NextResponse.redirect(
    new URL(`/cart?msg=${encodeURIComponent("Quote request received. We will reply by email.")}`, req.url),
    303,
  );
}
