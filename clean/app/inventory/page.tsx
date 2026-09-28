import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import { InventoryBrowser } from "@/components/InventoryBrowser";
import { NoResultIcon } from "@/components/shop/Icons";
import { GridSkeleton, StatsSkeleton } from "@/components/SectionSkeleton";
import { getSettings, listItems } from "@/lib/inventory/store";
import { collectionIsPublic, isVisibleToPublic, type InventoryItem } from "@/lib/inventory/types";
import { isNewArrival } from "@/lib/inventory/facets";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const open = collectionIsPublic(settings);
  return {
    title: "The Collection",
    description: "New and pre-owned fine jewellery and watches available from Atlantic Gems in Halifax.",
    robots: open ? { index: true, follow: true } : { index: false, follow: false },
  };
}

/** Lowest quoted price in the set, for the "from" figure in the hero. */
function lowestPrice(items: InventoryItem[]): number | null {
  const prices = items.map((i) => i.price).filter((p): p is number => p !== null);
  return prices.length ? Math.min(...prices) : null;
}

/** One read of the store per request, shared by the sections below. */
const loadCollection = cache(async () =>
  (await listItems()).filter((i) => isVisibleToPublic(i) && i.status !== "sold"),
);

/**
 * The visibility checks run first and the items stream behind skeletons.
 * `notFound()` must stay above the `<Suspense>` boundaries, and there must be
 * no route `loading.tsx` here: either would start the stream before it runs
 * and turn a real 404 into a 200 (plan item U6).
 */
export default async function InventoryPage() {
  const settings = await getSettings();
  if (!settings.pages.collection) notFound();

  if (!collectionIsPublic(settings)) {
    return (
      <>
        <section className="shop-hero">
          <div className="wrap">
            <p className="eyebrow">The collection</p>
            <h1>Being prepared</h1>
            <p className="lede">
              The online collection is not open yet. Pieces are shown by appointment in Halifax, and
              we source to your brief in the meantime.
            </p>
          </div>
        </section>
        <section className="section">
          <div className="wrap">
            <div className="empty-state">
              <NoResultIcon />
              <h3>Tell us what you are looking for</h3>
              <p>
                Describe the piece — stone, metal, size, budget — and we will reply with what we hold
                or what we can find.
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

  return (
    <>
      <section className="shop-hero">
        <div className="wrap shop-hero-inner">
          <div>
            <p className="eyebrow">The collection</p>
            <h1>New and pre-owned.</h1>
            <p className="lede">
              Every piece is described under our disclosure policy: metal as stamped or tested,
              stones as measured, treatments and reports stated. Prices in Canadian dollars unless
              marked otherwise.
            </p>
            <Suspense fallback={<StatsSkeleton />}>
              <CollectionStats />
            </Suspense>
            <p className="shop-hero-note">
              Viewing is by appointment. Save pieces as you browse and send them to us as one
              enquiry — nothing leaves your browser until you do.
            </p>
          </div>
        </div>
      </section>

      <section className="section" style={{ borderTop: 0 }}>
        <div className="wrap">
          <Suspense fallback={<GridSkeleton cards={8} label="Loading the collection" />}>
            <CollectionBrowser />
          </Suspense>
        </div>
      </section>
    </>
  );
}

async function CollectionStats() {
  const items = await loadCollection();
  const categories = new Set(items.map((i) => i.category)).size;
  const justIn = items.filter((i) => isNewArrival(i)).length;
  const from = lowestPrice(items);
  return (
    <ul className="shop-stats" aria-label="Collection at a glance">
      <li>
        <b>{items.length}</b>
        <span>{items.length === 1 ? "piece" : "pieces"}</span>
      </li>
      <li>
        <b>{categories || "—"}</b>
        <span>categories</span>
      </li>
      {justIn > 0 ? (
        <li>
          <b>{justIn}</b>
          <span>just in</span>
        </li>
      ) : null}
      {from !== null ? (
        <li>
          <b>{`$${from.toLocaleString("en-CA", { maximumFractionDigits: 0 })}`}</b>
          <span>from</span>
        </li>
      ) : null}
    </ul>
  );
}

async function CollectionBrowser() {
  return <InventoryBrowser items={await loadCollection()} />;
}
