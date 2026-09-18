import { stockSegments, stockTone } from "@/lib/parts/visuals";

/**
 * Five segments over a short line of text — the shelf read-out you would get
 * by looking in the drawer, rather than a generic "in stock" pill.
 */
export function StockGauge({
  qty,
  reorder,
  label,
  inline = false,
}: {
  qty: number;
  reorder: number;
  label: string;
  inline?: boolean;
}) {
  const tone = stockTone(qty, reorder);
  const filled = stockSegments(qty, reorder);
  return (
    <span className={`stock is-${tone}${inline ? " stock-inline" : ""}`}>
      <span className="stock-bar" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((n) => (
          <i key={n} className={n < filled ? "on" : undefined} />
        ))}
      </span>
      <span className="stock-label">{label}</span>
    </span>
  );
}
