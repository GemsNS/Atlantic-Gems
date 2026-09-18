import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getItem, getSettings, listItems } from "@/lib/inventory/store";
import { collectionIsPublic, isVisibleToPublic, type InventoryItem } from "@/lib/inventory/types";
import { categoryLabel, conditionLabel, formatPrice, statusLabel } from "@/lib/format";
import { isNewArrival } from "@/lib/inventory/facets";
import { ItemGallery } from "@/components/ItemGallery";
import { ItemCard } from "@/components/ItemCard";
import { SaveButton } from "@/components/inventory/SaveButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = await getItem(id);
  return { title: item ? item.title : "Item", robots: { index: false, follow: false } };
}

function facts(item: InventoryItem): [string, string][] {
  return [
    ["Category", categoryLabel(item.category)],
    ["Condition", conditionLabel(item.condition)],
    ...(item.metal ? ([["Metal", item.metal]] as [string, string][]) : []),
    ...(item.stones ? ([["Stones", item.stones]] as [string, string][]) : []),
    ...(item.size ? ([["Size", item.size]] as [string, string][]) : []),
    ...(item.sku ? ([["Reference", item.sku]] as [string, string][]) : []),
    ["Availability", statusLabel(item.status)],
  ];
}

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [settings, item] = await Promise.all([getSettings(), getItem(id)]);
  if (!collectionIsPublic(settings) || !item || !isVisibleToPublic(item)) notFound();

  const related = (await listItems())
    .filter(
      (i) =>
        isVisibleToPublic(i) &&
        i.status !== "sold" &&
        i.id !== item.id &&
        (i.category === item.category || (item.metal && i.metal === item.metal)),
    )
    .slice(0, 4);

  const brief = `Enquiry about: ${item.title}${item.sku ? ` (ref ${item.sku})` : ""}`;

  return (
    <>
      <section className="section" style={{ borderTop: 0, paddingTop: "clamp(28px, 4vw, 48px)" }}>
        <div className="wrap">
          <p className="crumb">
            <Link href="/inventory">The collection</Link>
            <span aria-hidden="true">/</span>
            <span>{categoryLabel(item.category)}</span>
          </p>

          <div className="piece">
            <div className="piece-stage">
              <ItemGallery images={item.images} title={item.title} />
            </div>

            <div className="piece-body">
              <p className="piece-eyebrow">
                {categoryLabel(item.category)}
                <span aria-hidden="true">·</span>
                {conditionLabel(item.condition)}
                {item.status === "reserved" ? <span className="flag flag-reserved">Reserved</span> : null}
                {isNewArrival(item) && item.status !== "reserved" ? (
                  <span className="flag flag-new">Just in</span>
                ) : null}
              </p>
              <h1>{item.title}</h1>

              <div className="piece-price-row">
                <span className="piece-price">{formatPrice(item)}</span>
                {item.price !== null ? (
                  <span className="gallery-hint">{item.currency} · taxes extra</span>
                ) : null}
              </div>

              {item.description ? <p className="piece-lede">{item.description}</p> : null}

              <ul className="spec-ledger">
                {facts(item).map(([k, v]) => (
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
                  href={`/contact?type=jewellery&brief=${encodeURIComponent(brief)}`}
                  className="btn btn-primary"
                >
                  Enquire about this piece
                </Link>
                <SaveButton id={item.id} title={item.title} inline />
                {item.ebayUrl ? (
                  <a href={item.ebayUrl} className="btn btn-ghost" rel="noopener noreferrer" target="_blank">
                    View on eBay
                  </a>
                ) : null}
              </div>

              <p className="piece-fine">
                Viewing by appointment in Halifax. Purchases are confirmed by written quotation; we do
                not take card payments online. Read our{" "}
                <Link href="/policies/disclosure" className="link">
                  certification and disclosure policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="section section-alt">
          <div className="wrap">
            <div className="shop-head">
              <div>
                <span className="shop-head-n">Alongside this</span>
                <h2>Others in the case</h2>
                <p>Pieces close to this one in category or metal.</p>
              </div>
              <Link href="/inventory" className="btn btn-ghost btn-small">
                All of the collection
              </Link>
            </div>
            <div className="inv-grid">
              {related.map((i) => (
                <ItemCard key={i.id} item={i} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
