import type { Metadata } from "next";
import { ContactFormStatic } from "@/components/ContactFormStatic";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & Appointments",
  description:
    "Book a private appointment or send a trade, custom, repair, setting, appraisal or watch enquiry to Atlantic Gems in Halifax, Nova Scotia.",
};

/** STATIC EXPORT variant: no server, so the form composes an email. */
export default function ContactPage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">Contact</p>
          <h1>Appointments and enquiries</h1>
          <p className="lede">
            Private clients are seen by appointment in {site.city}. Trade buyers, commissions,
            repairs, setting, appraisals and watch enquiries all start here.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap contact-grid">
          <ContactFormStatic />
          <aside className="contact-side">
            <div>
              <h3>Email</h3>
              <p>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </p>
            </div>
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
                For repairs, setting, appraisals or watch service, please describe the item in
                your message. We confirm an appointment before you bring anything in.
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
