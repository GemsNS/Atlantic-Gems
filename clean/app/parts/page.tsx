import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { cache, Fragment, Suspense } from "react";
import { requirePage } from "@/lib/require-page";
import { PART_CATEGORIES, type PartCategory } from "@/lib/parts/types";
import { listParts, isPublicPart } from "@/lib/parts/store";
import { getCart, resolveCart } from "@/lib/cart";
import { totalsByCurrency } from "@/lib/crm/types";
import { formatMoney } from "@/lib/format";
import { PartsBrowser } from "@/components/parts/PartsBrowser";
import { PartsCategoryGrid, PartsCategoryRail } from "@/components/parts/PartsCategoryNav";
import { PartsTrayStack } from "@/components/parts/PartsTrayStack";
import { Reveal } from "@/components/Reveal";
import { GridSkeleton, StatsSkeleton } from "@/components/SectionSkeleton";

export const metadata: Metadata = {
  title: "Parts and Tools",
  description:
    "Rough gems, loose diamonds, watch parts, movements, crystals, batteries and straps from Atlantic Gems.",
};

export const dynamic = "force-dynamic";

/** One read of the store per request, shared by every section below. */
const loadCounter = cache(async () => {
  const allParts = await listParts();
  const parts = allParts.filter(isPublicPart);
  const counts = Object.fromEntries(
    PART_CATEGORIES.map((c) => [c.value, parts.filter((p) => p.category === c.value).length]),
  ) as Partial<Record<PartCategory, number>>;
  return { allParts, parts, counts };
});

/**
 * The page checks that the counter is switched on before anything renders,
 * then streams each data section behind its own skeleton. `notFound()` must
 * stay above the `<Suspense>` boundaries so a switched-off page is a real 404.
 */
export default async function PartsIndexPage() {
  await requirePage("parts");
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";

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
            <Suspense fallback={<StatsSkeleton />}>
              <CounterStats />
            </Suspense>
          </div>
          <div className="shop-hero-aside">
            <Suspense fallback={<div className="tray-stack" aria-hidden="true" />}>
              <CounterStack />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Not deferred either: on a phone its 1000px placeholder is far from its
          real height, so coming Back from a part page restored the scroll
          against the placeholder and landed thousands of pixels off. */}
      <section className="section" id="catalogue" style={{ borderTop: 0 }}>
        <div className="wrap">
          <Suspense fallback={null}>
            <QuoteStrip />
          </Suspense>

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
          <Suspense fallback={<GridSkeleton cards={PART_CATEGORIES.length} label="Loading the trays" />}>
            <CounterIndex />
          </Suspense>
        </div>
      </section>

      {/* Not deferred: this is the counter itself. With content-visibility it was
          laid out only when a visitor scrolled to it, so the work landed on the
          first tap in the search box (plan item U11). */}
      <section className="section section-alt">
        <div className="wrap">
          <div className="shop-head">
            <div>
              <span className="shop-head-n">The whole counter</span>
              <h2>Search every line</h2>
              <Suspense fallback={<p>Filter by tray, brand and shelf stock.</p>}>
                <CounterIntro />
              </Suspense>
            </div>
          </div>
          <Suspense fallback={<GridSkeleton cards={8} label="Loading the counter" />}>
            <CounterBrowser csrf={csrf} />
          </Suspense>
        </div>
      </section>
    </>
  );
}

async function CounterStats() {
  const { parts } = await loadCounter();
  const brands = new Set(parts.map((p) => p.brand).filter(Boolean)).size;
  const inStock = parts.filter((p) => p.stockQty > 0).length;
  return (
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
        <span>{brands === 1 ? "brand" : "brands"}</span>
      </li>
      <li>
        <b>{PART_CATEGORIES.length}</b>
        <span>trays</span>
      </li>
    </ul>
  );
}

async function CounterStack() {
  const { counts } = await loadCounter();
  const stackTop = [...PART_CATEGORIES]
    .map((c) => c.value)
    .filter((v) => (counts[v] ?? 0) > 0)
    .slice(0, 3) as PartCategory[];
  const stack: PartCategory[] = stackTop.length === 3 ? stackTop : ["loose-diamonds", "rough-gems", "straps"];
  return <PartsTrayStack categories={stack} />;
}

/** A running total of the quote tray, so the counter always shows the order. */
async function QuoteStrip() {
  const { allParts } = await loadCounter();
  const { rows } = resolveCart(await getCart(), allParts);
  const trayQty = rows.reduce((sum, r) => sum + r.line.qty, 0);
  if (trayQty === 0) return null;
  // CAD and USD lines are never added together; one estimate per currency, as on /cart.
  const totals = totalsByCurrency(
    rows.map((r) => ({ qty: r.line.qty, unitPrice: r.part.price, currency: r.part.currency })),
  );
  return (
    <div className="quote-strip">
      <span>
        Quote tray: <strong>{trayQty}</strong> {trayQty === 1 ? "item" : "items"} ·{" "}
        {totals.length === 0 ? (
          "priced on request"
        ) : (
          <>
            {totals.map((t, i) => (
              <Fragment key={t.currency}>
                {i > 0 ? " and " : null}
                <strong>{formatMoney(t.amount, t.currency)}</strong>
              </Fragment>
            ))}{" "}
            estimated
          </>
        )}
      </span>
      <Link href="/cart" className="btn btn-ghost btn-small">
        Review and send
      </Link>
    </div>
  );
}

async function CounterIndex() {
  const { counts } = await loadCounter();
  return (
    <>
      <PartsCategoryRail counts={counts} />
      <Reveal>
        <PartsCategoryGrid counts={counts} />
      </Reveal>
    </>
  );
}

/** The demo sentence shows only while a public line is still a demo listing. */
async function CounterIntro() {
  const { parts } = await loadCounter();
  return (
    <p>
      Filter by tray, brand and shelf stock.
      {parts.some((p) => p.demo) ? " Demo prices stand in until the live list is confirmed." : null}
    </p>
  );
}

async function CounterBrowser({ csrf }: { csrf: string }) {
  const { parts } = await loadCounter();
  return <PartsBrowser parts={parts} csrf={csrf} />;
}
