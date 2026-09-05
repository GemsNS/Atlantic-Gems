import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} collects, uses and protects personal information.`,
};

export default function PrivacyPage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">Privacy</p>
          <h1>Privacy Policy</h1>
          <p className="lede">
            How {site.name} handles personal information, in line with Canadian privacy law
            (PIPEDA) and anti-spam law (CASL).
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="prose">
          <h2>Who we are</h2>
          <p>
            {site.name} (registered name {site.legalName}, Registration No.{" "}
            {site.registrationNumber}) is a fine jewellery house, gem wholesaler and atelier
            operating by appointment in {site.city}, {site.region}, {site.country}. Questions
            about this policy or about your information can be sent to{" "}
            <a href={`mailto:${site.email}`}>{site.email}</a>.
          </p>

          <h2>What we collect</h2>
          <ul>
            <li>
              <strong>Enquiries and appointments:</strong> your name, email address, phone
              number if you give it, and the content of your message.
            </li>
            <li>
              <strong>Repairs, setting, appraisals, consignment and custom work:</strong> a
              description of the item,
              photographs taken at intake, serial or reference numbers where relevant, and the
              details needed to quote, carry out and return the work.
            </li>
            <li>
              <strong>Trade access:</strong> the business details you provide when requesting
              access to trade pricing and parcels.
            </li>
            <li>
              <strong>Website operation:</strong> technical information such as IP address and
              browser type, used only to keep the site secure and working. We do not use
              advertising trackers.
            </li>
          </ul>

          <h2>Why we collect it</h2>
          <p>
            To respond to you, to quote and carry out work you have asked for, to keep an
            accurate record of items in our care, to meet legal and accounting obligations, and,
            only where you have expressly opted in, to send occasional updates about the house.
          </p>

          <h2>Consent</h2>
          <p>
            We collect information with your knowledge and consent. Enquiry forms ask you to
            confirm you agree to be contacted about your request. Marketing updates are sent only
            if you tick the separate opt-in, and every message includes a working unsubscribe.
            You can withdraw consent at any time by emailing us.
          </p>

          <h2>Sharing</h2>
          <p>
            We do not sell personal information. We share it only with service providers who help
            us run the business (for example email delivery or secure storage), who are bound to
            protect it, or where the law requires.
          </p>

          <h2>Retention</h2>
          <p>
            We keep enquiry details for as long as needed to deal with your request. Records of
            work carried out, including intake descriptions and photographs, are kept for the
            period required for warranty, accounting and legal purposes, then securely deleted.
          </p>

          <h2>Security</h2>
          <p>
            Information is transmitted over encrypted connections and stored with access limited
            to the people who need it. Trade pricing and repair records are kept separate from
            public website content.
          </p>

          <h2>Your rights</h2>
          <p>
            You may ask what personal information we hold about you, request a correction, or ask
            us to delete it where we are not required to keep it. Write to{" "}
            <a href={`mailto:${site.email}`}>{site.email}</a> and we will respond within a
            reasonable time. If you are not satisfied with our response you may contact the
            Office of the Privacy Commissioner of Canada.
          </p>

          <h2>Changes</h2>
          <p>
            We may update this policy as the business or the law changes. The current version is
            always published on this page.
          </p>
          </div>
        </div>
      </section>
    </>
  );
}
