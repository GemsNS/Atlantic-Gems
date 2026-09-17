import { z } from "zod";
import {
  detectMode,
  modePages,
  PAGE_KEYS,
  type PagesMap,
  type SiteMode,
} from "@/lib/site-pages";

export const CATEGORIES = [
  { value: "ring", label: "Ring" },
  { value: "necklace", label: "Necklace or pendant" },
  { value: "bracelet", label: "Bracelet" },
  { value: "earrings", label: "Earrings" },
  { value: "brooch", label: "Brooch or pin" },
  { value: "watch", label: "Watch" },
  { value: "loose-stone", label: "Loose stone" },
  { value: "other", label: "Other" },
] as const;
export type Category = (typeof CATEGORIES)[number]["value"];

export const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "pre-owned", label: "Pre-owned" },
] as const;
export type Condition = (typeof CONDITIONS)[number]["value"];

export const STATUSES = [
  { value: "available", label: "Available" },
  { value: "reserved", label: "Reserved" },
  { value: "sold", label: "Sold" },
] as const;
export type Status = (typeof STATUSES)[number]["value"];

export const VISIBILITIES = [
  { value: "public", label: "Public (shown in the collection when the shop is open)" },
  { value: "trade", label: "Trade only (shown in the gated trade area)" },
  { value: "private", label: "Private (admin only)" },
] as const;
export type Visibility = (typeof VISIBILITIES)[number]["value"];

const enumValues = <T extends readonly { value: string }[]>(list: T) =>
  list.map((x) => x.value) as [T[number]["value"], ...T[number]["value"][]];

/** Image sources allowed: our own media route, or https URLs (eBay CDN etc). */
const imageUrl = z
  .string()
  .trim()
  .max(500)
  .refine((u) => u.startsWith("/api/media/") || /^https:\/\/[^\s]+$/i.test(u), {
    message: "Images must be uploaded here or be https URLs.",
  });

export const itemSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{4,40}$/),
  sku: z.string().trim().max(60).default(""),
  title: z.string().trim().min(3, "Title is required.").max(140),
  category: z.enum(enumValues(CATEGORIES)),
  condition: z.enum(enumValues(CONDITIONS)),
  status: z.enum(enumValues(STATUSES)).default("available"),
  visibility: z.enum(enumValues(VISIBILITIES)).default("private"),
  metal: z.string().trim().max(80).default(""),
  stones: z.string().trim().max(200).default(""),
  size: z.string().trim().max(60).default(""),
  /** Price in the stated currency; null means price on request. */
  price: z.number().nonnegative().max(100_000_000).nullable().default(null),
  currency: z.enum(["CAD", "USD"]).default("CAD"),
  description: z.string().trim().max(4000).default(""),
  /** Disclosure lines: treatment, origin, report, authenticity. */
  disclosure: z.string().trim().max(2000).default(""),
  images: z.array(imageUrl).max(12).default([]),
  source: z.enum(["manual", "ebay"]).default("manual"),
  ebayItemId: z.string().trim().max(80).optional(),
  ebayUrl: z.string().url().max(500).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type InventoryItem = z.infer<typeof itemSchema>;

const pagesSchema = z
  .object({
    jewellery: z.boolean(),
    custom: z.boolean(),
    repair: z.boolean(),
    setting: z.boolean(),
    appraisals: z.boolean(),
    watches: z.boolean(),
    gemstones: z.boolean(),
    collection: z.boolean(),
    parts: z.boolean(),
    wholesale: z.boolean(),
  })
  .default(modePages("parts-supplier"));

const ebaySettingsSchema = z
  .object({
    sellerUsername: z.string().trim().max(80).default(""),
    storeUrl: z.string().trim().max(500).default(""),
    syncEnabled: z.boolean().default(false),
    importToVisibility: z.enum(["public", "trade", "private"]).default("public"),
    categories: z
      .object({
        jewellery: z.boolean().default(true),
        watches: z.boolean().default(true),
        looseStones: z.boolean().default(true),
      })
      .default({ jewellery: true, watches: true, looseStones: true }),
    lastImport: z.string().nullable().default(null),
    lastResult: z.string().nullable().default(null),
  })
  .default({});

export const settingsSchema = z
  .object({
    /** When false the public collection is hidden. Also gated by pages.collection. */
    shopOpen: z.boolean().default(false),
    siteMode: z.enum(["parts-supplier", "atelier", "full-house", "custom"]).default("parts-supplier"),
    pages: pagesSchema,
    ebay: ebaySettingsSchema,
    /** Legacy flat fields — migrated into ebay.* on parse. */
    ebayLastImport: z.string().nullable().optional(),
    ebayLastResult: z.string().nullable().optional(),
  })
  .transform((raw) => {
    const pages = { ...raw.pages } as PagesMap;
    let siteMode = raw.siteMode as SiteMode;
    if (siteMode !== "custom") {
      const preset = modePages(siteMode);
      for (const k of PAGE_KEYS) pages[k] = preset[k];
    } else {
      siteMode = detectMode(pages);
    }
    const ebay = {
      ...raw.ebay,
      lastImport: raw.ebay.lastImport ?? raw.ebayLastImport ?? null,
      lastResult: raw.ebay.lastResult ?? raw.ebayLastResult ?? null,
    };
    // Collection visibility still requires shopOpen for public browse.
    if (!pages.collection) {
      // keep shopOpen as stored; public gating uses both
    }
    return {
      shopOpen: raw.shopOpen,
      siteMode,
      pages,
      ebay,
    };
  });

export type Settings = z.output<typeof settingsSchema>;
export type EbaySettings = Settings["ebay"];

export function newId(): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export function isVisibleToPublic(item: InventoryItem): boolean {
  return item.visibility === "public";
}

export function isVisibleToTrade(item: InventoryItem): boolean {
  return item.visibility === "public" || item.visibility === "trade";
}

/** Collection is publicly browseable only when the page is on and the shop is open. */
export function collectionIsPublic(settings: Settings): boolean {
  return settings.pages.collection && settings.shopOpen;
}
