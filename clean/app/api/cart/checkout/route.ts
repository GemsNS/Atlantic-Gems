import { NextResponse } from "next/server";
import { csrfValid } from "@/lib/security/csrf";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { cartAvailable, clearCart, getCart, resolveCart } from "@/lib/cart";
import { listParts } from "@/lib/parts/store";
import { getSettings } from "@/lib/inventory/store";
import { newId } from "@/lib/inventory/types";
import { fieldErrors, quoteRequestSchema } from "@/lib/validation";
import { patchQuote, recordQuoteRequest } from "@/lib/crm/store";
import { quoteReference, totalsByCurrency } from "@/lib/crm/types";
import { deliverQuoteAcknowledgement, deliverQuoteRequest, type DeliveryResult } from "@/lib/mail";
import { site } from "@/lib/site";
import { seeOther } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

type Failure = {
  code: "csrf" | "fields" | "empty" | "rate" | "store" | "unavailable";
  status: number;
  message: string;
  errors?: Record<string, string>;
  retryAfterSec?: number;
};

/**
 * Sends the quote tray. Works as a plain form POST (redirects back to /cart
 * with a fixed status code) and as a fetch from the enhanced form (JSON, so
 * the customer keeps what they typed when something needs fixing).
 */
export async function POST(req: Request) {
  const wantsJson = (req.headers.get("accept") ?? "").includes("application/json");

  const fail = (f: Failure) => {
    if (wantsJson) {
      return NextResponse.json(
        { ok: false, code: f.code, message: f.message, errors: f.errors },
        {
          status: f.status,
          headers: f.retryAfterSec ? { "Retry-After": String(f.retryAfterSec) } : undefined,
        },
      );
    }
    return seeOther("/cart", { error: f.code });
  };

  const settings = await getSettings();
  if (!settings.pages.parts) {
    return wantsJson
      ? NextResponse.json({ ok: false, code: "closed", message: "The parts counter is closed." }, { status: 404 })
      : seeOther("/");
  }

  if (!cartAvailable()) {
    return fail({
      code: "unavailable",
      status: 503,
      message: `The quote tray is not available right now. Please email the list to ${site.email}.`,
    });
  }

  const form = await req.formData().catch(() => null);
  if (!form || !csrfValid(req, String(form.get("csrf") ?? ""))) {
    return fail({
      code: "csrf",
      status: 403,
      message: "That request expired. Reload the page and send the tray again.",
    });
  }

  const parsed = quoteRequestSchema.safeParse({
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    company: String(form.get("company") ?? ""),
    notes: String(form.get("notes") ?? ""),
    csrf: String(form.get("csrf") ?? ""),
    // Trap field is named so no browser autofill profile matches it.
    company_website: String(form.get("hp_note") ?? ""),
  });
  if (!parsed.success) {
    return fail({
      code: "fields",
      status: 422,
      message: "Please check the highlighted fields.",
      errors: fieldErrors(parsed.error),
    });
  }
  const { name, email, company, notes, company_website } = parsed.data;

  const quoteId = newId();
  const reference = quoteReference(quoteId);
  const done = () =>
    wantsJson ? NextResponse.json({ ok: true, reference }) : seeOther("/cart", { sent: reference });

  // Honeypot filled: answer like success, record and send nothing, and leave
  // the tray alone in case a real customer's browser filled it. Before the
  // rate limit and any file read, so a trap hit costs nothing and never uses
  // up the budget real customers share without TRUST_PROXY.
  if (company_website) return done();

  // Counted only once the request is genuine and well-formed, so stray,
  // malformed or trapped posts cannot use up the budget for real customers.
  const rl = rateLimit(clientKey(req, "quote"), LIMIT, WINDOW_MS);
  if (!rl.ok) {
    return fail({
      code: "rate",
      status: 429,
      message: `Several requests have come from here in a short time. Please wait a few minutes and try again, or email ${site.email}.`,
      retryAfterSec: rl.retryAfterSec,
    });
  }

  const storeFailure: Failure = {
    code: "store",
    status: 503,
    message: `We could not save your request just now. Your tray is still here — try again in a moment, or email ${site.email}.`,
  };

  let rows: ReturnType<typeof resolveCart>["rows"];
  try {
    ({ rows } = resolveCart(await getCart(), await listParts()));
  } catch {
    // An unreadable parts.json (logged by readJson).
    return fail(storeFailure);
  }
  if (rows.length === 0) {
    return fail({
      code: "empty",
      status: 409,
      message: "There is nothing in the tray that can be quoted. Add lines from the counter first.",
    });
  }

  const lines = rows.map(({ line, part }) => ({
    sku: part.sku,
    title: part.title,
    qty: line.qty,
    unitPrice: part.price,
    partId: part.id,
    currency: part.currency,
    // Seed listings carry placeholder prices; staff see each one marked.
    demo: part.demo,
  }));
  // Kept per currency: a CAD line and a USD line are never summed.
  const totals = totalsByCurrency(lines);
  const currencies = [...new Set(lines.map((l) => l.currency))];
  const quoteCurrency = currencies.length === 1 ? currencies[0]! : "CAD";
  // A deal holds one amount, so a mixed tray records no value rather than a wrong one.
  const dealValue =
    currencies.length === 1 && totals.length === 1 ? totals[0]!.amount : null;
  const now = new Date().toISOString();

  try {
    // One step: an unreadable CRM file or a lock timeout leaves nothing behind.
    await recordQuoteRequest({
      contact: {
        name,
        email,
        company,
        kind: company ? "trade" : "retail",
        notes: notes ? `[quote ${reference}] ${notes}` : undefined,
      },
      deal: {
        id: newId(),
        title: `Parts quote ${reference} — ${name}`.slice(0, 160),
        stage: "rfq",
        value: dealValue || null,
        currency: quoteCurrency,
        source: "cart",
        notes,
        createdAt: now,
        updatedAt: now,
      },
      quote: {
        id: quoteId,
        // A customer request waiting to be priced, not a quotation we have sent.
        status: "draft",
        lines,
        notes,
        customerName: name,
        customerEmail: email,
        currency: quoteCurrency,
        // Replaced below once the notification has been tried.
        notification: { status: "pending", at: now },
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch {
    // Nothing was confirmed to the customer and the tray is kept intact.
    return fail(storeFailure);
  }

  // The house notification and the customer's acknowledgement go out side by
  // side. The acknowledgement is off unless CUSTOMER_ACK_EMAIL=true, and
  // whatever happens to it, the customer's answer below stays the same.
  const [delivery, ack] = await Promise.all([
    deliverQuoteRequest({
      reference,
      name,
      email,
      company,
      notes,
      lines,
      estimatedTotals: totals,
      receivedAt: now,
    }),
    deliverQuoteAcknowledgement({ reference, email, lines }).catch(
      (): DeliveryResult => ({ ok: false, reason: "provider_error" }),
    ),
  ]);
  if (!delivery.ok && delivery.reason === "provider_error") {
    // The quote is saved under Admin → Quotes; flag the missed notification
    // without logging any customer details.
    console.error(`[quote] notification failed for ${reference}`);
  }
  if (!ack.ok && ack.reason === "provider_error") {
    console.error(`[quote] acknowledgement failed for ${reference}`);
  }
  // Staff see on the quote whether anyone was told. The customer is past the
  // point of failure here, so a problem recording it is only logged.
  try {
    await patchQuote(quoteId, (q) => ({
      ...q,
      notification: {
        status: delivery.ok ? "sent" : delivery.reason === "unconfigured" ? "unconfigured" : "failed",
        at: new Date().toISOString(),
      },
    }));
  } catch {
    console.error(`[quote] could not record notification status for ${reference}`);
  }

  await clearCart();
  return done();
}
