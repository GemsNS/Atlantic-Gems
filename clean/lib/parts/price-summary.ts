import type { Part } from "./types";

export const CURRENCY_NAMES: Record<Part["currency"], string> = {
  CAD: "Canadian dollars",
  USD: "US dollars",
};

/**
 * The "from" figures for a tray: the lowest listed price in each currency,
 * CAD first, since CAD and USD are never compared. `only` is the currency
 * every line shares, or null for a mixed or empty tray, so a note names a
 * currency only when it is true of every line. Used by the server category
 * page and its static-export twin, so the two cannot drift.
 */
export function priceSummary(parts: Part[]): {
  from: [Part["currency"], number][];
  only: Part["currency"] | null;
} {
  const lowest = new Map<Part["currency"], number>();
  for (const p of parts) {
    if (p.price !== null && p.price < (lowest.get(p.currency) ?? Number.POSITIVE_INFINITY)) {
      lowest.set(p.currency, p.price);
    }
  }
  const from = [...lowest].sort(([a], [b]) => (a === b ? 0 : a === "CAD" ? -1 : 1));
  const currencies = new Set(parts.map((p) => p.currency));
  const only = currencies.size === 1 ? parts[0]!.currency : null;
  return { from, only };
}
