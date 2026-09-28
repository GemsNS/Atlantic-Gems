import { NextResponse } from "next/server";
import { enquirySchema } from "@/lib/validation";
import { csrfValid } from "@/lib/security/csrf";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { deliverEnquiry, deliverEnquiryAcknowledgement, type DeliveryResult } from "@/lib/mail";
import { seeOther } from "@/lib/http";
import { enquiryTypes } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

type Failure = {
  code: "csrf" | "fields" | "rate" | "unsent";
  status: number;
  message: string;
  errors?: Record<string, string>;
  fallback?: boolean;
  retryAfterSec?: number;
};

/** The no-JS form's fields, in the shape the enhanced form sends as JSON. */
function fromForm(form: FormData): Record<string, unknown> {
  const text = (key: string) => String(form.get(key) ?? "");
  return {
    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    type: text("type"),
    message: text("message"),
    consent: form.get("consent") === "on",
    updates: form.get("updates") === "on",
    company_website: text("hp_note"),
    csrf: text("csrf"),
  };
}

/**
 * Takes an enquiry. The enhanced form posts JSON and gets JSON back, so the
 * customer keeps what they typed. Without JavaScript (or before the page has
 * hydrated) the form posts natively and gets a 303 back to /contact with
 * `?sent=1` or a fixed `?error=` code the page words (with the chosen
 * `?type=`, one of the fixed enquiry types); nothing typed goes in the URL.
 */
export async function POST(req: Request) {
  const native = !(req.headers.get("content-type") ?? "").includes("application/json");

  let raw: unknown;
  try {
    raw = native ? fromForm(await req.formData()) : await req.json();
  } catch {
    return native
      ? seeOther("/contact", { error: "fields" })
      : NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  // The enquiry type goes back with a plain POST's failure, so the resent form
  // keeps the category; only a known value, so the URL never carries free text.
  const submittedType =
    typeof raw === "object" && raw !== null && typeof (raw as { type?: unknown }).type === "string"
      ? (raw as { type: string }).type
      : "";
  const keptType = enquiryTypes.some((t) => t.value === submittedType) ? submittedType : undefined;
  const fail = (f: Failure) =>
    native
      ? seeOther("/contact", { error: f.code, type: keptType })
      : NextResponse.json(
          { ok: false, code: f.code, message: f.message, errors: f.errors, fallback: f.fallback },
          {
            status: f.status,
            headers: f.retryAfterSec ? { "Retry-After": String(f.retryAfterSec) } : undefined,
          },
        );
  const ok = (body: Record<string, unknown>) =>
    native ? seeOther("/contact", { sent: "1" }) : NextResponse.json({ ok: true, ...body });

  const submittedCsrf =
    typeof raw === "object" && raw !== null && "csrf" in raw
      ? String((raw as { csrf?: unknown }).csrf ?? "")
      : "";
  if (!csrfValid(req, submittedCsrf)) {
    // Middleware set a fresh token cookie on this response; the enhanced form
    // retries once with it before showing this.
    return fail({
      code: "csrf",
      status: 403,
      message:
        "Your session expired, so the enquiry was not sent. Copy your message, reload the page and send it again.",
      fallback: true,
    });
  }

  const parsed = enquirySchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!errors[key]) errors[key] = issue.message;
    }
    return fail({ code: "fields", status: 422, message: "Please check the highlighted fields.", errors });
  }

  // Honeypot filled: pretend success, deliver nothing. Before the rate limit,
  // so a trap hit costs nothing and never uses up the budget real customers
  // share without TRUST_PROXY.
  if (parsed.data.company_website) return ok({});

  // Counted only once the request is genuine and well-formed, so stray,
  // malformed or trapped posts cannot use up the budget for real customers.
  const rl = rateLimit(clientKey(req, "contact"), LIMIT, WINDOW_MS);
  if (!rl.ok) {
    return fail({
      code: "rate",
      status: 429,
      message: "Too many enquiries in a short time. Please try again in a few minutes.",
      fallback: true,
      retryAfterSec: rl.retryAfterSec,
    });
  }

  const { csrf: _csrf, company_website: _hp, ...data } = parsed.data;
  void _csrf;
  void _hp;

  // The enquiry counts as received once it is held somewhere a person will
  // see it: the CRM (Admin → Pipeline) or the house inbox. Only when both
  // fail does the customer get an error, with the address to write to.
  let saved = false;
  try {
    const { createEnquiryLead } = await import("@/lib/crm/store");
    await createEnquiryLead({
      name: data.name,
      email: data.email,
      type: data.type,
      message: data.message,
    });
    saved = true;
  } catch {
    console.error("[contact] CRM write failed");
  }

  const result = await deliverEnquiry(data, { receivedAt: new Date().toISOString() });
  if (!result.ok && result.reason === "provider_error") console.error("[contact] notification failed");
  if (!result.ok && !saved) {
    return fail({
      code: "unsent",
      status: 502,
      message: "We could not deliver your enquiry just now.",
      fallback: true,
    });
  }

  // Held somewhere, so the customer can be told it arrived. Off unless
  // CUSTOMER_ACK_EMAIL=true; however it fares, the answer below is the same.
  const ack = await deliverEnquiryAcknowledgement({ email: data.email }).catch(
    (): DeliveryResult => ({ ok: false, reason: "provider_error" }),
  );
  if (!ack.ok && ack.reason === "provider_error") console.error("[contact] acknowledgement failed");

  return ok(result.ok ? {} : { crmOnly: true });
}
