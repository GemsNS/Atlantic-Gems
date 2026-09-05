import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { lookbook } from "@/lib/lookbook";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Trade Access",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function WholesalePage() {
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <div className="trade-bar">
            <span>Trade area. Pricing and parcels shared here are confidential to the buyer.</span>
            <form action="/api/wholesale/logout" method="post">
              <input type="hidden" name="csrf" value={csrf} />
              <button className="btn btn-ghost btn-small" type="submit">
                Sign out
              </button>
            </form>
          </div>
          <p className="eyebrow" style={{ marginTop: 40 }}>
            Wholesale
          </p>
          <h1>Current parcels</h1>
          <p className="lede">
            Rough and faceted rubies, sapphires, emeralds, diamonds and related stones for the
            trade. Each parcel lists only the facts we can stand behind.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          {lookbook.length === 0 ? (
            <div className="empty">
              <p>No parcels are published at the moment.</p>
              <p>
                Current availability and trade pricing are shared directly. Tell us what you are
                sourcing and we will reply with what we have.
              </p>
              <Link href="/contact?type=wholesale" className="btn btn-primary">
                Request current availability
              </Link>
            </div>
          ) : (
            <div className="lookbook">
              {lookbook.map((item) => (
                <article key={item.id} className="lookbook-card">
                  <p className="eyebrow">
                    {item.category} · {item.form}
                  </p>
                  <h3>{item.title}</h3>
                  <ul className="facts">
                    {item.facts.map((f) => (
                      <li key={f.label}>
                        <span className="k">{f.label}</span>
                        <span className="v">{f.value}</span>
                      </li>
                    ))}
                  </ul>
                  {item.note ? <p className="muted">{item.note}</p> : null}
                </article>
              ))}
            </div>
          )}

          <div className="aside-card" style={{ marginTop: 40, maxWidth: 640 }}>
            <h3>Trade terms</h3>
            <p>
              Pricing is quoted in Canadian dollars. Applicable taxes, minimums and payment terms
              are confirmed on each quotation. Treatment, origin and any report are stated in
              writing for every stone we sell.
            </p>
            <p>
              Questions: <a href={`mailto:${site.email}`}>{site.email}</a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
