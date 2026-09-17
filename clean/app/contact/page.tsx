import type { Metadata } from "next";
import { headers } from "next/headers";
import { ContactForm } from "@/components/ContactForm";
import { getSettings } from "@/lib/inventory/store";
import { composeSiteCopy } from "@/lib/site-copy";
import { site, type EnquiryType } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & Appointments",
  description:
    "Book a private appointment or send an enquiry to Atlantic Gems in Halifax, Nova Scotia.",
};

export const dynamic = "force-dynamic";

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
  const defaultMessage = (briefRaw ?? "").slice(0, 2000);

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
