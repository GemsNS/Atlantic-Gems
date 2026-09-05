import type { Metadata } from "next";
import { headers } from "next/headers";
import { ContactForm } from "@/components/ContactForm";
import { enquiryTypes, site, type EnquiryType } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & Appointments",
  description:
    "Book a private appointment or send a trade, custom, repair, setting or watch enquiry to Atlantic Gems in Halifax, Nova Scotia.",
};

export const dynamic = "force-dynamic";

function pickType(value: string | string[] | undefined): EnquiryType {
  const v = Array.isArray(value) ? value[0] : value;
  const match = enquiryTypes.find((t) => t.value === v);
  return match ? match.value : "gemstones";
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";
  const defaultType = pickType(params.type);

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">Contact</p>
          <h1>Appointments and enquiries</h1>
          <p className="lede">
            Private clients are seen by appointment in {site.city}. Trade buyers, commissions,
            repairs, setting and watch enquiries all start here.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap contact-grid">
          <ContactForm csrf={csrf} defaultType={defaultType} />
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
              <h3>Bringing an item</h3>
              <p>
                For repairs, setting or watch service, please describe the item in your message.
                We confirm an appointment before you bring anything in.
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
