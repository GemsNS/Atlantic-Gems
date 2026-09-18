import Link from "next/link";
import type { Part } from "@/lib/parts/types";
import { partCategoryLabel } from "@/lib/parts/types";
import { formatMoney } from "@/lib/format";
import { stockNote, stockTone } from "@/lib/parts/visuals";
import { PartPlate } from "@/components/parts/PartPlate";
import { StockGauge } from "@/components/parts/StockGauge";
import { QtyStepper } from "@/components/parts/QtyStepper";

export function PartCard({
  part,
  csrf,
  showQuickAdd = false,
  /** "admin" swaps the customer footer for stock and visibility. */
  variant = "shop",
}: {
  part: Part;
  csrf?: string;
  showQuickAdd?: boolean;
  variant?: "shop" | "admin";
}) {
  const tone = stockTone(part.stockQty, part.reorderPoint);
  const out = tone === "out";

  return (
    <article className={`part-card${out ? " is-out" : ""}`}>
      <Link href={`/parts/item/${part.id}`} className="part-card-link">
        <div className="part-card-media">
          <PartPlate category={part.category} size="md" seed={part.sku} />
          {part.demo ? <span className="part-chip part-chip-demo">Demo</span> : null}
          {out ? <span className="part-chip part-chip-stock is-out">Out</span> : null}
        </div>
        <div className="part-card-body">
          <p className="part-card-meta">
            <span>{part.brand || partCategoryLabel(part.category)}</span>
            <span className="part-card-sku">{part.sku}</span>
          </p>
          <h3 className="part-card-title">{part.title}</h3>
          <StockGauge
            qty={part.stockQty}
            reorder={part.reorderPoint}
            label={
              variant === "admin"
                ? `${part.stockQty} on hand · reorder at ${part.reorderPoint}`
                : stockNote(part.stockQty, part.reorderPoint)
            }
          />
          <div className="part-card-foot">
            <p className="part-card-price">{formatMoney(part.price, part.currency)}</p>
            <span className="part-card-pack">
              {variant === "admin" ? part.visibility : `Pack ${part.packSize}`}
            </span>
          </div>
        </div>
      </Link>
      {showQuickAdd && csrf && !out ? (
        <form action="/api/cart/add" method="post" className="part-card-add">
          <input type="hidden" name="csrf" value={csrf} />
          <input type="hidden" name="partId" value={part.id} />
          <QtyStepper label={`Quantity of ${part.title}`} />
          <button type="submit" className="btn btn-ghost btn-small">
            Add to quote
          </button>
        </form>
      ) : showQuickAdd && out ? (
        <div className="part-card-add">
          <Link
            href={`/contact?brief=${encodeURIComponent(`Lead time for ${part.sku} — ${part.title}`)}`}
            className="btn btn-ghost btn-small"
          >
            Ask lead time
          </Link>
        </div>
      ) : null}
    </article>
  );
}
