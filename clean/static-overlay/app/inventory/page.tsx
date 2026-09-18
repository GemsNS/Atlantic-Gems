import type { Metadata } from "next";
import Link from "next/link";
import { NoResultIcon } from "@/components/shop/Icons";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "The Collection",
  robots: { index: false, follow: false },
};

/** STATIC EXPORT variant: the live collection needs the server build. */
export default function InventoryStaticPage() {
  return (
    <>
      <section className="shop-hero">
        <div className="wrap">
          <p className="eyebrow">The collection</p>
          <h1>Being prepared</h1>
          <p className="lede">
            The online collection is not open yet. Pieces are shown by appointment in Halifax, and we
            source to your brief in the meantime.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <div className="empty-state">
            <NoResultIcon />
            <h3>Tell us what you are looking for</h3>
            <p>
              Describe the piece — stone, metal, size, budget — and we will reply with what we hold or
              what we can find.
            </p>
            <div className="empty-actions">
              <Link href="/contact?type=jewellery" className="btn btn-primary">
                Ask about current pieces
              </Link>
              <a href={`mailto:${site.email}`} className="btn btn-ghost">
                {site.email}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
