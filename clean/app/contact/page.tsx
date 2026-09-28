import type { Metadata } from "next";
import { headers } from "next/headers";
import { ContactForm } from "@/components/ContactForm";
import { FocusOnArrival } from "@/components/FocusOnArrival";
import { getSettings } from "@/lib/inventory/store";
import { composeSiteCopy } from "@/lib/site-copy";
import { site, type EnquiryType } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & Appointments",
  description:
    "Book a private appointment or send an enquiry to Atlantic Gems in Halifax, Nova Scotia.",
};

export const dynamic = "force-dynamic";

/**
 * Longest ?brief= prefill kept. Single-piece links reach 222 at the title and
 * SKU caps, and savedBrief (lib/inventory/facets.ts, which keeps its own copy
 * of this number) fits the collection's saved-pieces list under it, so only a
 * hand-written link is cut.
 */
const BRIEF_MAX = 300;

/**
 * Fixed copy for what /api/contact sends back to the form's plain POST
 * (JavaScript off, or not loaded yet); the URL never supplies text. Nothing
 * the customer typed survives that redirect, so each failure says so.
 */
const ERRORS: Record<string, string> = {
  csrf: `The form had been open a long time, so the enquiry was not sent. The page is ready now: write it again, or email ${site.email}.`,
  fields: `The enquiry was not sent. Check your name, email address, phone (digits, spaces and + ( ) - . only) and message (at least 10 characters), tick the consent box, and send it again, or email ${site.email}.`,
  rate: `Several enquiries have come from here in a short time. Please wait a few minutes and try again, or email ${site.email}.`,
  unsent: `We could not deliver your enquiry just now. Please email it to ${site.email}.`,
};

/**
 * Links start an enquiry with ?brief= ("Lead time for <SKU> — <title>"), but
 * anyone can write that URL, so only short plain text reaches the message box:
 * line breaks normalised, control and text-direction characters removed, blank
 * runs collapsed to one blank line, trimmed, and capped by characters (not
 * UTF-16 units, so an emoji is never split). An uncut brief keeps one closing
 * line break, as tool briefs end on a prompt answered on the next line. A cut
 * ends on a whole line or word where it can and is marked, so the customer
 * sees the text was shortened.
 */
function normaliseBrief(raw: string | undefined): string {
  if (!raw) return "";
  const flat = raw
    .replace(/\r\n?|[\u2028\u2029]/g, "\n")
    .replace(/\t/g, " ")
    .replace(/(?!\n)[\p{Cc}\p{Bidi_Control}]/gu, "")
    .replace(/[^\S\n]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n");
  const text = flat.trim();
  const chars = Array.from(text);
  if (chars.length <= BRIEF_MAX) {
    return text && flat.endsWith("\n") && chars.length < BRIEF_MAX ? `${text}\n` : text;
  }
  const cut = chars.slice(0, BRIEF_MAX - 2).join("");
  const line = cut.lastIndexOf("\n");
  if (line > cut.length / 2) return `${cut.slice(0, line).trimEnd()}\n…`;
  const word = cut.lastIndexOf(" ");
  return `${(word > cut.length / 2 ? cut.slice(0, word) : cut).trimEnd()}…`;
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";
  const settings = await getSettings();
  const copy = composeSiteCopy(settings.siteMode, settings.pages, false);
  const types = copy.enquiryTypes;
  const typeParam = Array.isArray(params.type) ? params.type[0] : params.type;
  const match = types.find((t) => t.value === typeParam);
  const defaultType: EnquiryType = match ? match.value : (types[0]?.value ?? "other");
  const briefRaw = Array.isArray(params.brief) ? params.brief[0] : params.brief;
  const defaultMessage = normaliseBrief(briefRaw);
  const sent = (Array.isArray(params.sent) ? params.sent[0] : params.sent) === "1";
  const errRaw = Array.isArray(params.error) ? params.error[0] : params.error;
  // Own keys only: `__proto__` or `constructor` would otherwise reach
  // Object.prototype and break the page.
  const err = !sent && errRaw && Object.hasOwn(ERRORS, errRaw) ? ERRORS[errRaw]! : null;

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">Contact</p>
          <h1>Enquiries</h1>
          <p className="lede">
            {settings.pages.parts && copy.services.length === 0
              ? `Parts availability, trade accounts and unlisted SKUs — write to us in ${site.city}.`
              : `Private clients, trade buyers and service enquiries start here in ${site.city}.`}
          </p>
          {sent ? (
            <FocusOnArrival className="form-status ok" role="status" style={{ marginTop: 18, maxWidth: "38rem" }}>
              <strong>Thank you.</strong> Your enquiry has been received and we will reply by email.
            </FocusOnArrival>
          ) : null}
          {err ? (
            <FocusOnArrival className="form-status err" role="alert" style={{ marginTop: 18, maxWidth: "38rem" }}>
              {err}
            </FocusOnArrival>
          ) : null}
        </div>
      </section>

      <section className="section">
        <div className="wrap contact-grid">
          <ContactForm
            csrf={csrf}
            defaultType={defaultType}
            defaultMessage={defaultMessage}
            types={types}
          />
          <aside className="contact-side">
            <div>
              <h3>Email</h3>
              <p>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </p>
            </div>
            {site.phone ? (
              <div>
                <h3>Phone</h3>
                <p>
                  <a href={`tel:${site.phone}`}>{site.phone}</a>
                </p>
              </div>
            ) : null}
            <div>
              <h3>Location</h3>
              <p>
                {site.city}, {site.region}, {site.country}
                <br />
                {site.locationNote}
              </p>
            </div>
            <div>
              <h3>Follow</h3>
              <p>
                <a href={site.social.instagram.url} rel="noopener noreferrer" target="_blank">
                  Instagram {site.social.instagram.handle}
                </a>
                <br />
                <a href={site.social.facebook.url} rel="noopener noreferrer" target="_blank">
                  {site.social.facebook.label}
                </a>
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
