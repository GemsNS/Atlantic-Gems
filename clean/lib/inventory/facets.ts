import type { InventoryItem } from "@/lib/inventory/types";

/**
 * Facets derived from the items themselves, so the collection filters stay
 * honest: a band or a metal family is only offered when something matches it.
 */

/** Pieces listed inside this window carry a "just in" flag. */
const NEW_DAYS = 28;

export function isNewArrival(item: InventoryItem, now = Date.now()): boolean {
  const t = Date.parse(item.createdAt);
  if (Number.isNaN(t)) return false;
  return now - t <= NEW_DAYS * 24 * 60 * 60 * 1000;
}

export type PriceBand = {
  value: string;
  label: string;
  /** Inclusive lower bound, exclusive upper bound. */
  min: number;
  max: number;
};

export const PRICE_BANDS: PriceBand[] = [
  { value: "under-1000", label: "Under 1,000", min: 0, max: 1000 },
  { value: "1000-3000", label: "1,000 to 3,000", min: 1000, max: 3000 },
  { value: "3000-8000", label: "3,000 to 8,000", min: 3000, max: 8000 },
  { value: "8000-up", label: "8,000 and above", min: 8000, max: Number.POSITIVE_INFINITY },
  { value: "on-request", label: "Price on request", min: -1, max: -1 },
];

export function inBand(item: InventoryItem, band: PriceBand): boolean {
  if (band.value === "on-request") return item.price === null;
  if (item.price === null) return false;
  return item.price >= band.min && item.price < band.max;
}

export type MetalFamily = { value: string; label: string };

/** Ordered: the first pattern that matches wins, so "white gold" beats "gold". */
const METAL_PATTERNS: { value: string; label: string; test: RegExp }[] = [
  { value: "platinum", label: "Platinum", test: /platinum|\bplat\b|\bpt\s?9\d\d/i },
  { value: "white-gold", label: "White gold", test: /white\s?gold|\bwg\b/i },
  { value: "rose-gold", label: "Rose gold", test: /rose\s?gold|red\s?gold|pink\s?gold|\brg\b/i },
  { value: "yellow-gold", label: "Yellow gold", test: /yellow\s?gold|\byg\b/i },
  { value: "gold", label: "Gold", test: /gold|\b\d{1,2}\s?k\b|\b(?:375|416|585|750|916)\b/i },
  { value: "silver", label: "Silver", test: /silver|sterling|\b925\b/i },
  { value: "steel", label: "Steel and titanium", test: /steel|titanium|\bpvd\b/i },
];

export function metalFamily(item: InventoryItem): string | null {
  const text = item.metal.trim();
  if (!text) return null;
  for (const m of METAL_PATTERNS) if (m.test.test(text)) return m.value;
  return "other";
}

/** Families present in a set, in the display order above. */
export function metalFamilies(items: InventoryItem[]): MetalFamily[] {
  const present = new Set<string>();
  for (const i of items) {
    const f = metalFamily(i);
    if (f) present.add(f);
  }
  const list: MetalFamily[] = METAL_PATTERNS.filter((m) => present.has(m.value)).map((m) => ({
    value: m.value,
    label: m.label,
  }));
  if (present.has("other")) list.push({ value: "other", label: "Other metals" });
  return list;
}

/** Everything a search box should look through for one piece. */
export function searchText(item: InventoryItem): string {
  return [item.title, item.metal, item.stones, item.size, item.sku, item.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** Prefilled enquiry text for a set of saved pieces. */
export function savedBrief(items: InventoryItem[]): string {
  const lines = items.map((i) => `· ${i.title}${i.sku ? ` (ref ${i.sku})` : ""}`);
  return `Enquiry about ${items.length} ${items.length === 1 ? "piece" : "pieces"}:\n${lines.join("\n")}`;
}
