import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getItem, getSettings } from "@/lib/inventory/store";
import { isVisibleToPublic } from "@/lib/inventory/types";
import { categoryLabel, conditionLabel, formatPrice, statusLabel } from "@/lib/format";
import { ItemGallery } from "@/components/ItemGallery";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = await getItem(id);
  return { title: item ? item.title : "Item", robots: { index: false, follow: false } };
}

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [settings, item] = await Promise.all([getSettings(), getItem(id)]);
  if (!settings.shopOpen || !item || !isVisibleToPublic(item)) notFound();

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
          <Link href="/inventory" className="link">
            ← Back to the collection
          </Link>
        </p>
        <div className="item-grid">
          <ItemGallery images={item.images} title={item.title} />
          <div className="item-body">
            <p className="eyebrow">{categoryLabel(item.category)} · {conditionLabel(item.condition)}</p>
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
              <Link href={`/contact?type=jewellery&brief=${encodeURIComponent(`Enquiry about: ${item.title}${item.sku ? ` (ref ${item.sku})` : ""}`)}`} className="btn btn-primary">
                Enquire about this piece
              </Link>
              {item.ebayUrl ? (
                <a href={item.ebayUrl} className="btn btn-ghost" rel="noopener noreferrer" target="_blank">
                  View on eBay
                </a>
              ) : null}
            </div>
            <p className="muted" style={{ marginTop: 18, fontSize: "0.9rem" }}>
              Viewing by appointment in Halifax. Purchases are confirmed by written quotation; we do not
              take card payments online.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
