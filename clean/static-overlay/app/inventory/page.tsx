import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "The Collection",
  robots: { index: false, follow: false },
};

/** STATIC EXPORT variant: the live collection needs the server build. */
export default function InventoryStaticPage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">The collection</p>
          <h1>Being prepared</h1>
          <p className="lede">
            Our online collection is not open yet. Pieces are shown by appointment, and we source to
            your brief in the meantime.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <div className="empty">
            <p>Tell us what you are looking for and we will reply with what we have or can source.</p>
            <Link href="/contact?type=jewellery" className="btn btn-primary">
              Ask about current pieces
            </Link>
            <p className="muted" style={{ fontSize: "0.9rem" }}>
              Or email <a href={`mailto:${site.email}`} className="link">{site.email}</a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
