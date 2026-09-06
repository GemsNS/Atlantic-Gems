import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { InventoryBrowser } from "@/components/InventoryBrowser";
import { listItems } from "@/lib/inventory/store";
import { isVisibleToTrade } from "@/lib/inventory/types";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Trade Access",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function WholesalePage() {
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";
  const items = (await listItems()).filter((i) => isVisibleToTrade(i) && i.status !== "sold");

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
            Trade
          </p>
          <h1>Current stock and parcels</h1>
          <p className="lede">
            Jewellery, watches and loose stones available to the trade. Each entry lists only the
            facts we can stand behind; ask for anything not stated.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          {items.length === 0 ? (
            <div className="empty">
              <p>No trade stock is published at the moment.</p>
              <p>Current availability and trade pricing are shared directly. Tell us what you are sourcing.</p>
              <Link href="/contact?type=wholesale" className="btn btn-primary">
                Request current availability
              </Link>
            </div>
          ) : (
            <InventoryBrowser items={items} hrefBase="/wholesale/item" />
          )}

          <div className="aside-card" style={{ marginTop: 40, maxWidth: 640 }}>
            <h3>Trade terms</h3>
            <p>
              Pricing is quoted in Canadian dollars, exclusive of taxes and shipping. Quotations are
              valid for 7 days and subject to prior sale.
            </p>
            <p>
              <Link href="/policies/wholesale-terms" className="link">
                Wholesale &amp; Trade Terms
              </Link>{" "}
              ·{" "}
              <Link href="/policies/disclosure" className="link">
                Certification &amp; Disclosure Policy
              </Link>
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
