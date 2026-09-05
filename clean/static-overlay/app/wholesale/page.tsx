import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Trade Access",
  robots: { index: false, follow: false },
};

/**
 * STATIC EXPORT variant. The passphrase-gated trade area needs a server, so
 * on static hosting nothing confidential is published; buyers are directed
 * to request access instead.
 */
export default function WholesaleStaticPage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">Wholesale</p>
          <h1>Trade access</h1>
          <p className="lede">
            Rough and faceted rubies, sapphires, emeralds, diamonds and related stones for the
            trade. Current parcels and trade pricing are confidential and are shared directly
            with approved buyers.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <div className="empty">
            <p>Tell us what you are sourcing and we will reply with what we have.</p>
            <Link href="/contact?type=wholesale" className="btn btn-primary">
              Request trade access
            </Link>
            <p className="muted" style={{ fontSize: "0.9rem" }}>
              Purchases are subject to our{" "}
              <Link href="/policies/wholesale-terms" className="link">
                Wholesale &amp; Trade Terms
              </Link>{" "}
              and{" "}
              <Link href="/policies/disclosure" className="link">
                Certification &amp; Disclosure Policy
              </Link>
              . Questions: <a href={`mailto:${site.email}`}>{site.email}</a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
