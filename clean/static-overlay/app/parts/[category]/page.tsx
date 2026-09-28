import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePage } from "@/lib/require-page";
import { PART_CATEGORIES, type PartCategory } from "@/lib/parts/types";
import { listParts, isPublicPart } from "@/lib/parts/store";
import { formatMoney } from "@/lib/format";
import { PartsBrowser } from "@/components/parts/PartsBrowser";
import { PartsCategoryRail } from "@/components/parts/PartsCategoryNav";
import { PartMedia } from "@/components/parts/PartMedia";
import { CATEGORY_ART } from "@/lib/parts/art";
import { PART_VISUALS } from "@/lib/parts/visuals";
import { CURRENCY_NAMES, priceSummary } from "@/lib/parts/price-summary";

export const dynamic = "force-static";

export function generateStaticParams() {
  return PART_CATEGORIES.map((c) => ({ category: c.value }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const meta = PART_CATEGORIES.find((c) => c.value === category);
  return {
    title: meta?.label ?? "Parts",
    description: meta?.blurb,
  };
}

export default async function PartsCategoryStaticPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  await requirePage("parts");
  const { category } = await params;
  const meta = PART_CATEGORIES.find((c) => c.value === category);
  if (!meta) notFound();
  const cat = category as PartCategory;
  const all = (await listParts()).filter(isPublicPart);
  const parts = all.filter((p) => p.category === cat);
  const counts = Object.fromEntries(
    PART_CATEGORIES.map((c) => [c.value, all.filter((p) => p.category === c.value).length]),
  ) as Partial<Record<PartCategory, number>>;
  const visual = PART_VISUALS[cat];
  const onShelf = parts.filter((p) => p.stockQty > 0).length;
  // As on the server page: one lowest price per currency, never compared.
  const { from, only } = priceSummary(parts);
  const brands = new Set(parts.map((p) => p.brand).filter(Boolean)).size;

  return (
    <>
      <section className="shop-hero">
        <div className="wrap shop-hero-inner">
          <div>
            <p className="crumb">
              <Link href="/parts">Parts counter</Link>
              <span aria-hidden="true">/</span>
              <span>{meta.label}</span>
            </p>
            <h1>{meta.label}</h1>
            <p className="lede">{meta.blurb}</p>
            <ul className="shop-stats" aria-label={`${meta.label} at a glance`}>
              <li>
                <b>{parts.length}</b>
                <span>{parts.length === 1 ? "line" : "lines"}</span>
              </li>
              <li>
                <b>{onShelf}</b>
                <span>on the shelf</span>
              </li>
              {brands > 0 ? (
                <li>
                  <b>{brands}</b>
                  <span>{brands === 1 ? "brand" : "brands"}</span>
                </li>
              ) : null}
              {from.map(([currency, amount]) => {
                // The code is left off when the note below already names the currency.
                const price = formatMoney(amount, currency);
                return (
                  <li key={currency}>
                    <b>{only ? price.replace(currency, "").trim() : price}</b>
                    <span>from</span>
                  </li>
                );
              })}
            </ul>
            {only ? (
              <p className="shop-hero-note">
                {visual.label} · quoted in {CURRENCY_NAMES[only]}, taxes extra.
              </p>
            ) : parts.length > 0 ? (
              <p className="shop-hero-note">
                {visual.label} · each price is marked with its currency, taxes extra.
              </p>
            ) : null}
          </div>
          <div className="shop-hero-aside">
            <PartMedia category={cat} artKey={CATEGORY_ART[cat]} size="hero" />
          </div>
        </div>
      </section>

      <section className="section" style={{ borderTop: 0 }}>
        <div className="wrap">
          <PartsCategoryRail active={cat} counts={counts} />
          {parts.length === 0 ? (
            <div className="empty-state">
              <h3>Nothing public on this tray yet</h3>
              <p>
                We still order this tray to the job. Send the reference, calibre or a photograph and
                we will price it.
              </p>
              <div className="empty-actions">
                <Link href="/contact" className="btn btn-primary">
                  Ask about availability
                </Link>
                <Link href="/parts" className="btn btn-ghost">
                  Back to all trays
                </Link>
              </div>
            </div>
          ) : (
            <PartsBrowser parts={parts} fixedCategory={cat} canQuote={false} />
          )}
        </div>
      </section>
    </>
  );
}
