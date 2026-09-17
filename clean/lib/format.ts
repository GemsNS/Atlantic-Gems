import { CATEGORIES, CONDITIONS, STATUSES, type InventoryItem } from "@/lib/inventory/types";

const formatters: Record<string, Intl.NumberFormat> = {};
const moneyFormatters: Record<string, Intl.NumberFormat> = {};

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

/** Parts and quotes often need cents. */
export function formatMoney(
  price: number | null | undefined,
  currency: "CAD" | "USD" = "CAD",
): string {
  if (price == null) return "Price on request";
  moneyFormatters[currency] ??= new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return moneyFormatters[currency].format(price);
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
