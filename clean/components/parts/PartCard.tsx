import Link from "next/link";
import type { Part } from "@/lib/parts/types";
import { partCategoryLabel } from "@/lib/parts/types";
import { formatMoney } from "@/lib/format";
import { stockLabel, stockTone } from "@/lib/parts/visuals";
import { PartPlate } from "@/components/parts/PartPlate";

export function PartCard({
  part,
  csrf,
  showQuickAdd = false,
}: {
  part: Part;
  csrf?: string;
  showQuickAdd?: boolean;
}) {
  const tone = stockTone(part.stockQty, part.reorderPoint);

  return (
    <article className="part-card">
      <Link href={`/parts/item/${part.id}`} className="part-card-link">
        <div className="part-card-media">
          <PartPlate category={part.category} size="md" />
          {part.demo ? <span className="part-chip part-chip-demo">Demo</span> : null}
          <span className={`part-chip part-chip-stock is-${tone}`}>
            {stockLabel(part.stockQty, part.reorderPoint)}
          </span>
        </div>
        <div className="part-card-body">
          <p className="part-card-meta">
            <span>{part.brand || partCategoryLabel(part.category)}</span>
            <span className="part-card-sku">{part.sku}</span>
          </p>
          <h3 className="part-card-title">{part.title}</h3>
          <div className="part-card-foot">
            <p className="part-card-price">{formatMoney(part.price, part.currency)}</p>
            <span className="part-card-pack">Pack {part.packSize}</span>
          </div>
        </div>
      </Link>
      {showQuickAdd && csrf && tone !== "out" ? (
        <form action="/api/cart/add" method="post" className="part-card-add">
          <input type="hidden" name="csrf" value={csrf} />
          <input type="hidden" name="partId" value={part.id} />
          <input type="hidden" name="qty" value="1" />
          <button type="submit" className="btn btn-ghost btn-small">
            Add to quote
          </button>
        </form>
      ) : null}
    </article>
  );
}
