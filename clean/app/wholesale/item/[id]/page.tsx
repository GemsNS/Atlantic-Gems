import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getItem } from "@/lib/inventory/store";
import { isVisibleToTrade } from "@/lib/inventory/types";
import { categoryLabel, conditionLabel, formatPrice, statusLabel } from "@/lib/format";
import { ItemGallery } from "@/components/ItemGallery";

export const metadata: Metadata = { title: "Trade item", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function TradeItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item || !isVisibleToTrade(item)) notFound();

  const facts: [string, string][] = [
    ["Category", categoryLabel(item.category)],
    ["Condition", conditionLabel(item.condition)],
    ...(item.metal ? ([["Metal", item.metal]] as [string, string][]) : []),
    ...(item.stones ? ([["Stones", item.stones]] as [string, string][]) : []),
    ...(item.size ? ([["Size", item.size]] as [string, string][]) : []),
    ...(item.sku ? ([["Reference", item.sku]] as [string, string][]) : []),
    ["Availability", statusLabel(item.status)],
  ];

  return (
    <section className="section" style={{ borderTop: 0, paddingTop: "clamp(28px, 4vw, 48px)" }}>
      <div className="wrap">
        <p className="crumb">
          <Link href="/wholesale">Trade stock</Link>
          <span aria-hidden="true">/</span>
          <span>{categoryLabel(item.category)}</span>
        </p>

        <div className="piece">
          <div className="piece-stage">
            <ItemGallery images={item.images} title={item.title} />
          </div>
          <div className="piece-body">
            <p className="piece-eyebrow">
              Trade
              <span aria-hidden="true">·</span>
              {categoryLabel(item.category)}
            </p>
            <h1>{item.title}</h1>
            <div className="piece-price-row">
              <span className="piece-price">{formatPrice(item)}</span>
              <span className="gallery-hint">Trade pricing, taxes and shipping extra</span>
            </div>
            {item.description ? <p className="piece-lede">{item.description}</p> : null}
            <ul className="spec-ledger">
              {facts.map(([k, v]) => (
                <li key={k}>
                  <span className="k">{k}</span>
                  <span className="v">{v}</span>
                </li>
              ))}
            </ul>
            {item.disclosure ? (
              <div className="house-note">
                <strong>Disclosure</strong>
                {item.disclosure}
              </div>
            ) : null}
            <div className="piece-actions">
              <Link
                href={`/contact?type=wholesale&brief=${encodeURIComponent(`Trade enquiry: ${item.title}${item.sku ? ` (ref ${item.sku})` : ""}`)}`}
                className="btn btn-primary"
              >
                Request this item
              </Link>
              <Link href="/policies/wholesale-terms" className="btn btn-ghost">
                Trade terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
