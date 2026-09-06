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
    <section className="section" style={{ borderTop: 0 }}>
      <div className="wrap">
        <p style={{ marginBottom: 24 }}>
          <Link href="/wholesale" className="link">
            ← Back to trade stock
          </Link>
        </p>
        <div className="item-grid">
          <ItemGallery images={item.images} title={item.title} />
          <div className="item-body">
            <p className="eyebrow">Trade · {categoryLabel(item.category)}</p>
            <h1 style={{ fontSize: "clamp(2rem, 3.6vw, 3rem)", marginTop: 10 }}>{item.title}</h1>
            <p className="item-price">{formatPrice(item)}</p>
            {item.description ? <p className="lede" style={{ marginTop: 18 }}>{item.description}</p> : null}
            <ul className="facts">
              {facts.map(([k, v]) => (
                <li key={k}>
                  <span className="k">{k}</span>
                  <span className="v">{v}</span>
                </li>
              ))}
            </ul>
            {item.disclosure ? (
              <div className="explorer-note" style={{ marginTop: 24 }}>
                <strong style={{ color: "var(--ink)" }}>Disclosure.</strong> {item.disclosure}
              </div>
            ) : null}
            <div className="hero-ctas">
              <Link href={`/contact?type=wholesale&brief=${encodeURIComponent(`Trade enquiry: ${item.title}${item.sku ? ` (ref ${item.sku})` : ""}`)}`} className="btn btn-primary">
                Request this item
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
