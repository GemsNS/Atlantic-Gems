import { NextResponse } from "next/server";
import { enquirySchema } from "@/lib/validation";
import { csrfValid } from "@/lib/security/csrf";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { deliverEnquiry } from "@/lib/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(req: Request) {
  const rl = rateLimit(clientKey(req, "contact"), LIMIT, WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, message: "Too many enquiries in a short time. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const submittedCsrf =
    typeof raw === "object" && raw !== null && "csrf" in raw
      ? String((raw as { csrf?: unknown }).csrf ?? "")
      : "";
  if (!csrfValid(req, submittedCsrf)) {
    return NextResponse.json(
      { ok: false, message: "Your session expired. Please reload the page and try again." },
      { status: 403 },
    );
  }

  const parsed = enquirySchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!errors[key]) errors[key] = issue.message;
    }
    return NextResponse.json(
      { ok: false, message: "Please check the highlighted fields.", errors },
      { status: 422 },
    );
  }

  // Honeypot filled: pretend success, deliver nothing.
  if (parsed.data.company_website) {
    return NextResponse.json({ ok: true });
  }

  const { csrf: _csrf, company_website: _hp, ...data } = parsed.data;
  void _csrf;
  void _hp;

  const result = await deliverEnquiry(data, { receivedAt: new Date().toISOString() });
  if (result.ok) return NextResponse.json({ ok: true });

  if (result.reason === "unconfigured") {
    return NextResponse.json(
      {
        ok: false,
        fallback: true,
        message: "Online enquiries are temporarily unavailable.",
      },
      { status: 503 },
    );
  }
  return NextResponse.json(
    {
      ok: false,
      fallback: true,
      message: "We could not deliver your enquiry just now.",
    },
    { status: 502 },
  );
}
