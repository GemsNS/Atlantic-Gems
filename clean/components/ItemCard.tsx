import Link from "next/link";
import type { InventoryItem } from "@/lib/inventory/types";
import { categoryLabel, conditionLabel, formatPrice } from "@/lib/format";
import { isNewArrival } from "@/lib/inventory/facets";
import { SaveButton } from "@/components/inventory/SaveButton";
import { ArrowRight, GemOutline } from "@/components/shop/Icons";

/** One-line summary under the title: what it is made of, what is set in it. */
function specLine(item: InventoryItem): string {
  const parts = [item.metal, item.stones, item.size].filter(Boolean);
  return parts.length ? parts.join(" · ") : item.description;
}

export function ItemCard({
  item,
  hrefBase = "/inventory",
}: {
  item: InventoryItem;
  hrefBase?: string;
}) {
  const img = item.images[0];
  const isNew = isNewArrival(item);
  const spec = specLine(item);

  return (
    <article className="inv-card">
      <Link href={`${hrefBase}/${item.id}`} className="inv-link">
        <div className="inv-frame">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={item.title} loading="lazy" />
          ) : (
            <span className="inv-noimg">
              <GemOutline />
              Photograph to follow
            </span>
          )}
          <span className="flags">
            {item.status === "reserved" ? (
              <span className="flag flag-reserved">
                <i className="flag-dot" />
                Reserved
              </span>
            ) : null}
            {isNew && item.status !== "reserved" ? <span className="flag flag-new">Just in</span> : null}
          </span>
          <span className="inv-cta">
            View piece
            <ArrowRight />
          </span>
        </div>
        <div className="inv-body">
          <p className="inv-eyebrow">
            {categoryLabel(item.category)}
            <em>{conditionLabel(item.condition)}</em>
          </p>
          <h3>{item.title}</h3>
          {spec ? <p className="inv-spec">{spec}</p> : null}
          <div className="inv-foot">
            <span className={`inv-price${item.price === null ? " is-poa" : ""}`}>
              {formatPrice(item)}
            </span>
            {item.sku ? <span className="inv-ref">{item.sku}</span> : null}
          </div>
        </div>
      </Link>
      <SaveButton id={item.id} title={item.title} />
    </article>
  );
}
