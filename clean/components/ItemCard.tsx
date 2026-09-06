import Link from "next/link";
import type { InventoryItem } from "@/lib/inventory/types";
import { categoryLabel, conditionLabel, formatPrice } from "@/lib/format";

export function ItemCard({ item, hrefBase = "/inventory" }: { item: InventoryItem; hrefBase?: string }) {
  const img = item.images[0];
  return (
    <article className="inv-card">
      <Link href={`${hrefBase}/${item.id}`} className="inv-link">
        <div className="inv-img">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={item.title} loading="lazy" />
          ) : (
            <span className="inv-noimg">Photograph to follow</span>
          )}
          {item.status === "reserved" ? <span className="badge badge-reserved inv-badge">Reserved</span> : null}
          <span className="badge inv-badge-cond">{conditionLabel(item.condition)}</span>
        </div>
        <div className="inv-body">
          <p className="inv-cat">{categoryLabel(item.category)}</p>
          <h3>{item.title}</h3>
          <p className="inv-price">{formatPrice(item)}</p>
        </div>
      </Link>
    </article>
  );
}
