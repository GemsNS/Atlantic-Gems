import type { EnquiryInput } from "@/lib/validation";
import { site } from "@/lib/site";
import { rateLimit } from "@/lib/security/rate-limit";

export type DeliveryResult =
  | { ok: true }
  | { ok: false; reason: "unconfigured" | "provider_error" };

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** True when either delivery route (Resend or webhook) is configured. */
export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY || process.env.CONTACT_WEBHOOK_URL);
}

/** The house inbox: where notifications go and where customer replies land. */
function houseAddress(): string {
  return process.env.CONTACT_TO ?? site.email;
}

/** One message through Resend. Throws on a network error or timeout. */
async function sendViaResend(
  resendKey: string,
  message: { to: string; replyTo: string; subject: string; html: string },
): Promise<DeliveryResult> {
  const from = process.env.CONTACT_FROM ?? `${site.name} <no-reply@atlanticgems.ca>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      reply_to: message.replyTo,
      subject: message.subject,
      html: message.html,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  return res.ok ? { ok: true } : { ok: false, reason: "provider_error" };
}

/**
 * One delivery path for everything the site sends to the house: Resend when
 * a key is set, otherwise the JSON webhook. Bodies are never logged.
 */
async function deliver(message: {
  subject: string;
  html: string;
  replyTo: string;
  payload: Record<string, unknown>;
}): Promise<DeliveryResult> {
  const resendKey = process.env.RESEND_API_KEY;
  const webhook = process.env.CONTACT_WEBHOOK_URL;
  try {
    if (resendKey) {
      return await sendViaResend(resendKey, {
        to: houseAddress(),
        replyTo: message.replyTo,
        subject: message.subject,
        html: message.html,
      });
    }

    if (webhook) {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message.payload),
        signal: AbortSignal.timeout(10_000),
      });
      return res.ok ? { ok: true } : { ok: false, reason: "provider_error" };
    }
  } catch {
    return { ok: false, reason: "provider_error" };
  }
  return { ok: false, reason: "unconfigured" };
}

/**
 * Delivers an enquiry via Resend or a generic webhook. Returns `unconfigured`
 * when neither provider is set.
 */
export async function deliverEnquiry(
  data: Omit<EnquiryInput, "csrf" | "company_website">,
  meta: { receivedAt: string },
): Promise<DeliveryResult> {
  const marketingUpdates = data.updates ?? false;
  const html = `
        <p><strong>New enquiry</strong> (${escapeHtml(data.type)})</p>
        <p><strong>Name:</strong> ${escapeHtml(data.name)}<br/>
           <strong>Email:</strong> ${escapeHtml(data.email)}<br/>
           <strong>Phone:</strong> ${escapeHtml(data.phone || "not given")}<br/>
           <strong>Marketing updates:</strong> ${marketingUpdates ? "yes (express consent)" : "no"}</p>
        <p style="white-space:pre-wrap">${escapeHtml(data.message)}</p>
        <p style="color:#666">Received ${escapeHtml(meta.receivedAt)}</p>`;
  return deliver({
    subject: `Enquiry: ${data.type} from ${data.name}`,
    html,
    replyTo: data.email,
    payload: {
      source: `${site.name} website`,
      kind: "enquiry",
      receivedAt: meta.receivedAt,
      type: data.type,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      message: data.message,
      consent: data.consent,
      marketingUpdates,
    },
  });
}

export interface QuoteRequestLine {
  sku: string;
  title: string;
  qty: number;
  unitPrice: number | null;
  currency: string;
  /** From a demo listing: unitPrice is a placeholder, not a price to quote. */
  demo: boolean;
}

/**
 * Tells the house a quote tray has arrived. The quote itself is already saved
 * in the admin area; this is the notification that someone has to act on it.
 */
export async function deliverQuoteRequest(input: {
  reference: string;
  name: string;
  email: string;
  company: string;
  notes: string;
  lines: QuoteRequestLine[];
  /** One entry per currency; CAD and USD are never added together. */
  estimatedTotals: { currency: string; amount: number }[];
  receivedAt: string;
}): Promise<DeliveryResult> {
  const money = (n: number, currency: string) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency, currencyDisplay: "code" }).format(n);
  const rows = input.lines
    .map(
      (l) => `<tr>
          <td style="padding:4px 8px;font-family:monospace">${escapeHtml(l.sku)}</td>
          <td style="padding:4px 8px">${escapeHtml(l.title)}</td>
          <td style="padding:4px 8px;text-align:right">${l.qty}</td>
          <td style="padding:4px 8px;text-align:right">${
            l.unitPrice == null ? "on request" : escapeHtml(money(l.unitPrice, l.currency))
          }${l.demo ? `<br/><em style="color:#8a4b12">demo listing, price not confirmed</em>` : ""}</td>
        </tr>`,
    )
    .join("");
  // Demo listings carry seed prices (docs/FACTS-REGISTER.md: DEMO ONLY), so
  // staff must not quote them back as they stand.
  const demoCount = input.lines.filter((l) => l.demo).length;
  const lineCount = input.lines.length;
  const demoNote = demoCount
    ? `<p style="color:#8a4b12"><strong>${
        demoCount === lineCount
          ? lineCount === 1
            ? "The line is a demo listing"
            : "Every line is a demo listing"
          : demoCount === 1
            ? `1 of ${lineCount} lines is a demo listing`
            : `${demoCount} of ${lineCount} lines are demo listings`
      }</strong>, so marked prices, and any estimate built from them, are placeholders; confirm the real price of each marked line before you quote.</p>`
    : "";
  const html = `
        <p><strong>New parts quote request</strong> — ref ${escapeHtml(input.reference)}</p>
        <p><strong>Name:</strong> ${escapeHtml(input.name)}<br/>
           <strong>Email:</strong> ${escapeHtml(input.email)}<br/>
           <strong>Company:</strong> ${escapeHtml(input.company || "not given")}</p>
        <table style="border-collapse:collapse">
          <thead><tr><th align="left">SKU</th><th align="left">Line</th><th>Qty</th><th>Unit</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p><strong>Estimated from listed prices:</strong> ${
          input.estimatedTotals.length
            ? input.estimatedTotals.map((t) => escapeHtml(money(t.amount, t.currency))).join(" + ")
            : "every line is priced on request"
        }</p>
        ${demoNote}
        ${input.notes ? `<p style="white-space:pre-wrap">${escapeHtml(input.notes)}</p>` : ""}
        <p style="color:#666">Received ${escapeHtml(input.receivedAt)}. Saved under Admin → Quotes.</p>`;
  return deliver({
    subject: `Quote request ${input.reference} from ${input.name}`,
    html,
    replyTo: input.email,
    payload: {
      source: `${site.name} website`,
      kind: "quote-request",
      ...input,
    },
  });
}

/** Acknowledgements to one address, and in all, per window. */
const ACK_PER_ADDRESS = { limit: 1, windowMs: 24 * 60 * 60 * 1000 };
const ACK_OVERALL = { limit: 50, windowMs: 60 * 60 * 1000 };

/**
 * Customer acknowledgements. OFF until the client approves the wording below:
 * they send only when CUSTOMER_ACK_EMAIL=true and a Resend key is set. The
 * webhook route cannot email a customer, so it gets nothing. Replies go to
 * the house inbox. Returns `unconfigured` while switched off.
 *
 * Anyone who loads the site can make the form post to any address, so each
 * address gets at most one acknowledgement a day and the site at most 50 an
 * hour, whatever the per-client limits allow. The address is checked first,
 * so repeated sends to one address never use up the overall budget. Over
 * either limit the message is skipped quietly; the customer's answer is the
 * same either way.
 */
async function deliverToCustomer(message: {
  to: string;
  subject: string;
  html: string;
}): Promise<DeliveryResult> {
  const resendKey = process.env.RESEND_API_KEY;
  if (process.env.CUSTOMER_ACK_EMAIL !== "true" || !resendKey) {
    return { ok: false, reason: "unconfigured" };
  }
  const to = message.to.trim().toLowerCase();
  if (
    !rateLimit(`ack:${to}`, ACK_PER_ADDRESS.limit, ACK_PER_ADDRESS.windowMs).ok ||
    !rateLimit("ack:all", ACK_OVERALL.limit, ACK_OVERALL.windowMs).ok
  ) {
    return { ok: false, reason: "unconfigured" };
  }
  try {
    return await sendViaResend(resendKey, { ...message, replyTo: houseAddress() });
  } catch {
    return { ok: false, reason: "provider_error" };
  }
}

const signOff = `<p>${escapeHtml(site.name)}<br/>${escapeHtml(`${site.city}, ${site.region}`)}</p>`;

/**
 * Tells the customer their quote tray arrived. Lines and quantities only, no
 * prices: a listed price may be a demo placeholder, and the written quotation
 * is where the price is confirmed. The lines come from the catalogue, and the
 * name the customer typed is not echoed: the greeting is fixed, so the form
 * cannot be used to mail anyone text of the sender's own.
 */
export async function deliverQuoteAcknowledgement(input: {
  reference: string;
  email: string;
  lines: Pick<QuoteRequestLine, "sku" | "title" | "qty">[];
}): Promise<DeliveryResult> {
  const rows = input.lines
    .map(
      (l) => `<tr>
          <td style="padding:4px 8px;font-family:monospace">${escapeHtml(l.sku)}</td>
          <td style="padding:4px 8px">${escapeHtml(l.title)}</td>
          <td style="padding:4px 8px;text-align:right">${l.qty}</td>
        </tr>`,
    )
    .join("");
  const html = `
        <p>Hello,</p>
        <p>We have your quote request ${escapeHtml(input.reference)} for these lines:</p>
        <table style="border-collapse:collapse">
          <thead><tr><th align="left">SKU</th><th align="left">Line</th><th>Qty</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p>We will reply by email with a written quotation. Nothing has been charged.</p>
        <p>Quote the reference ${escapeHtml(input.reference)} if you write to us about it.</p>
        ${signOff}`;
  return deliverToCustomer({
    to: input.email,
    // Same subject staff use to reply from Admin → Quotes, so the thread holds together.
    subject: `Your quote request ${input.reference}`,
    html,
  });
}

/**
 * Tells the customer their enquiry arrived. Nothing the sender typed is
 * echoed back, not even the name, so the form cannot be used to mail someone
 * else text of the sender's own.
 */
export async function deliverEnquiryAcknowledgement(input: { email: string }): Promise<DeliveryResult> {
  const html = `
        <p>Hello,</p>
        <p>We have your enquiry and will reply by email.</p>
        ${signOff}`;
  return deliverToCustomer({ to: input.email, subject: `Your enquiry to ${site.name}`, html });
}
