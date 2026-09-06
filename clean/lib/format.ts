import { CATEGORIES, CONDITIONS, STATUSES, type InventoryItem } from "@/lib/inventory/types";

const formatters: Record<string, Intl.NumberFormat> = {};

export function formatPrice(item: Pick<InventoryItem, "price" | "currency">): string {
  if (item.price === null) return "Price on request";
  const key = item.currency;
  formatters[key] ??= new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: key,
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  });
  return formatters[key].format(item.price);
}

export function categoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
export function conditionLabel(value: string): string {
  return CONDITIONS.find((c) => c.value === value)?.label ?? value;
}
export function statusLabel(value: string): string {
  return STATUSES.find((c) => c.value === value)?.label ?? value;
}
