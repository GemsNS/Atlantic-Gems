import type { EnquiryInput } from "@/lib/validation";
import { site } from "@/lib/site";

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

/**
 * Delivers an enquiry via Resend or a generic webhook. Message bodies are
 * never written to logs. Returns `unconfigured` when neither provider is set.
 */
export async function deliverEnquiry(
  data: Omit<EnquiryInput, "csrf" | "company_website">,
  meta: { receivedAt: string },
): Promise<DeliveryResult> {
  const resendKey = process.env.RESEND_API_KEY;
  const webhook = process.env.CONTACT_WEBHOOK_URL;

  const payload = {
    source: `${site.name} website`,
    receivedAt: meta.receivedAt,
    type: data.type,
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    message: data.message,
    consent: data.consent,
    marketingUpdates: data.updates ?? false,
  };

  try {
    if (resendKey) {
      const to = process.env.CONTACT_TO ?? site.email;
      const from = process.env.CONTACT_FROM ?? `${site.name} <no-reply@atlanticgems.ca>`;
      const html = `
        <p><strong>New enquiry</strong> (${escapeHtml(data.type)})</p>
        <p><strong>Name:</strong> ${escapeHtml(data.name)}<br/>
           <strong>Email:</strong> ${escapeHtml(data.email)}<br/>
           <strong>Phone:</strong> ${escapeHtml(data.phone || "not given")}<br/>
           <strong>Marketing updates:</strong> ${payload.marketingUpdates ? "yes (express consent)" : "no"}</p>
        <p style="white-space:pre-wrap">${escapeHtml(data.message)}</p>
        <p style="color:#666">Received ${escapeHtml(meta.receivedAt)}</p>`;
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          reply_to: data.email,
          subject: `Enquiry: ${data.type} from ${data.name}`,
          html,
        }),
      });
      return res.ok ? { ok: true } : { ok: false, reason: "provider_error" };
    }

    if (webhook) {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.ok ? { ok: true } : { ok: false, reason: "provider_error" };
    }
  } catch {
    return { ok: false, reason: "provider_error" };
  }

  return { ok: false, reason: "unconfigured" };
}
