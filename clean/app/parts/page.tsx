import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { requirePage } from "@/lib/require-page";
import { PART_CATEGORIES, type PartCategory } from "@/lib/parts/types";
import { listParts, isPublicPart } from "@/lib/parts/store";
import { getCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import { PartsBrowser } from "@/components/parts/PartsBrowser";
import { PartsCategoryGrid, PartsCategoryRail } from "@/components/parts/PartsCategoryNav";
import { PartsTrayStack } from "@/components/parts/PartsTrayStack";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Parts and Tools",
  description:
    "Rough gems, loose diamonds, watch parts, movements, crystals, batteries and straps from Atlantic Gems.",
};

export const dynamic = "force-dynamic";

export default async function PartsIndexPage() {
  await requirePage("parts");
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";
  const allParts = await listParts();
  const parts = allParts.filter(isPublicPart);
  const counts = Object.fromEntries(
    PART_CATEGORIES.map((c) => [c.value, parts.filter((p) => p.category === c.value).length]),
  ) as Partial<Record<PartCategory, number>>;
  const brands = new Set(parts.map((p) => p.brand).filter(Boolean)).size;
  const inStock = parts.filter((p) => p.stockQty > 0).length;

  // A running total of the quote tray, so the counter always shows the order.
  const lines = await getCart();
  let trayQty = 0;
  let traySubtotal = 0;
  for (const l of lines) {
    const part = allParts.find((p) => p.id === l.partId);
    if (!part) continue;
    trayQty += l.qty;
    traySubtotal += (part.price ?? 0) * l.qty;
  }

  const stackTop = (
    [...PART_CATEGORIES]
      .map((c) => c.value)
      .filter((v) => (counts[v] ?? 0) > 0)
      .slice(0, 3) as PartCategory[]
  );
  const stack: PartCategory[] = stackTop.length === 3 ? stackTop : ["loose-diamonds", "rough-gems", "straps"];

  return (
    <>
      <section className="shop-hero">
        <div className="wrap shop-hero-inner">
          <div>
            <p className="eyebrow">Parts counter</p>
            <h1>Everything for the bench.</h1>
            <p className="lede">
              Rough gems and loose diamonds, then the watch trays — movements, crystals, straps and
              cells — laid out on the counter. Build a tray, then send it over for a written
              quotation. If a stone or a reference is not listed, ask: most of what we hold is
              sourced to the job.
            </p>
            <ul className="shop-stats" aria-label="Catalogue at a glance">
              <li>
                <b>{parts.length}</b>
                <span>public lines</span>
              </li>
              <li>
                <b>{inStock}</b>
                <span>on the shelf</span>
              </li>
              <li>
                <b>{brands || "—"}</b>
                <span>brands</span>
              </li>
              <li>
                <b>{PART_CATEGORIES.length}</b>
                <span>trays</span>
              </li>
            </ul>
          </div>
          <div className="shop-hero-aside">
            <PartsTrayStack categories={stack} />
          </div>
        </div>
      </section>

      <section className="section" id="catalogue" style={{ borderTop: 0 }}>
        <div className="wrap">
          {trayQty > 0 ? (
            <div className="quote-strip">
              <span>
                Quote tray: <strong>{trayQty}</strong> {trayQty === 1 ? "item" : "items"} ·{" "}
                <strong>{formatMoney(traySubtotal, "CAD")}</strong> estimated
              </span>
              <Link href="/cart" className="btn btn-ghost btn-small">
                Review and send
              </Link>
            </div>
          ) : null}

          <div className="shop-head">
            <div>
              <span className="shop-head-n">Index</span>
              <h2>Shop by tray</h2>
              <p>Seven trays, from rough gems and loose diamonds to straps and cells. Open one, or search the whole counter below.</p>
            </div>
            <Link href="/contact" className="btn btn-ghost btn-small">
              Need an unlisted part?
            </Link>
          </div>
          <PartsCategoryRail counts={counts} />
          <Reveal>
            <PartsCategoryGrid counts={counts} />
          </Reveal>
        </div>
      </section>

      <section className="section section-alt">
        <div className="wrap">
          <div className="shop-head">
            <div>
              <span className="shop-head-n">The whole counter</span>
              <h2>Search every line</h2>
              <p>
                Filter by tray, brand and shelf stock. Demo prices stand in until the live list is
                confirmed.
              </p>
            </div>
          </div>
          <PartsBrowser parts={parts} csrf={csrf} />
        </div>
      </section>
    </>
  );
}
