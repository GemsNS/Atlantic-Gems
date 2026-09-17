import type { ServiceKey } from "@/lib/site";
import { services } from "@/lib/site";

/** Toggleable public surfaces (contact/privacy/policies stay always on). */
export const PAGE_KEYS = [
  "jewellery",
  "custom",
  "repair",
  "setting",
  "appraisals",
  "watches",
  "gemstones",
  "collection",
  "parts",
  "wholesale",
] as const;

export type PageKey = (typeof PAGE_KEYS)[number];
export type SiteMode = "parts-supplier" | "atelier" | "full-house" | "custom";

export type PagesMap = Record<PageKey, boolean>;

export const PAGE_LABELS: Record<PageKey, string> = {
  jewellery: "Jewellery",
  custom: "Custom jewellery",
  repair: "Repair & restoration",
  setting: "Stone setting",
  appraisals: "Appraisals & consignment",
  watches: "Watches",
  gemstones: "Gemstones",
  collection: "Public collection",
  parts: "Parts shop",
  wholesale: "Trade / wholesale",
};

/** Service keys that map 1:1 to page toggles. */
export const SERVICE_PAGE_KEYS: ServiceKey[] = [
  "jewellery",
  "custom",
  "repair",
  "setting",
  "appraisals",
  "watches",
  "gemstones",
];

export const SERVICE_HREF: Record<ServiceKey, string> = Object.fromEntries(
  services.map((s) => [s.key, s.href]),
) as Record<ServiceKey, string>;

export const HREF_TO_PAGE: Record<string, PageKey> = {
  "/jewellery": "jewellery",
  "/custom-jewellery": "custom",
  "/repair-restoration": "repair",
  "/stone-setting": "setting",
  "/appraisals-consignment": "appraisals",
  "/watches": "watches",
  "/gemstones": "gemstones",
  "/inventory": "collection",
  "/parts": "parts",
  "/wholesale": "wholesale",
  "/cart": "parts",
};

export function allOff(): PagesMap {
  return Object.fromEntries(PAGE_KEYS.map((k) => [k, false])) as PagesMap;
}

export function modePages(mode: Exclude<SiteMode, "custom">): PagesMap {
  const pages = allOff();
  if (mode === "parts-supplier") {
    pages.parts = true;
    pages.wholesale = true;
    return pages;
  }
  if (mode === "atelier") {
    for (const k of SERVICE_PAGE_KEYS) pages[k] = true;
    pages.wholesale = true;
    return pages;
  }
  // full-house
  for (const k of PAGE_KEYS) pages[k] = true;
  return pages;
}

export function pagesEqual(a: PagesMap, b: PagesMap): boolean {
  return PAGE_KEYS.every((k) => a[k] === b[k]);
}

export function detectMode(pages: PagesMap): SiteMode {
  if (pagesEqual(pages, modePages("parts-supplier"))) return "parts-supplier";
  if (pagesEqual(pages, modePages("atelier"))) return "atelier";
  if (pagesEqual(pages, modePages("full-house"))) return "full-house";
  return "custom";
}

export function isPageEnabled(pages: PagesMap, key: PageKey): boolean {
  return Boolean(pages[key]);
}

export function enabledServices(pages: PagesMap) {
  return services.filter((s) => pages[s.key]);
}

export function pageKeyForPath(pathname: string): PageKey | null {
  if (pathname.startsWith("/parts")) return "parts";
  if (pathname.startsWith("/inventory")) return "collection";
  if (pathname.startsWith("/wholesale")) return "wholesale";
  if (pathname.startsWith("/cart")) return "parts";
  return HREF_TO_PAGE[pathname] ?? null;
}
