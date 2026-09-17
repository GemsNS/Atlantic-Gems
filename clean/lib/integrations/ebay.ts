import "server-only";
import { listItems, upsertMany, updateSettings, getSettings } from "@/lib/inventory/store";
import { newId, type Category, type InventoryItem, type Visibility } from "@/lib/inventory/types";
import type { IntegrationResult } from "./types";

/**
 * Public eBay store connector. Pulls the seller's active jewellery & watch
 * listings via the Browse API and upserts them into jewellery inventory.
 * Parts catalog is never touched.
 */
export function ebayEnvConfigured(): boolean {
  return Boolean(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET);
}

export async function ebayConnectionStatus(): Promise<IntegrationResult<{ seller: string }>> {
  const settings = await getSettings();
  const seller =
    settings.ebay.sellerUsername.trim() || process.env.EBAY_SELLER_USERNAME?.trim() || "";
  if (!ebayEnvConfigured()) {
    return {
      status: "unconfigured",
      message:
        "Add EBAY_CLIENT_ID and EBAY_CLIENT_SECRET to the server environment to connect a public eBay store.",
    };
  }
  if (!seller) {
    return {
      status: "unconfigured",
      message: "Set the eBay seller username in Connect settings (or EBAY_SELLER_USERNAME).",
    };
  }
  return {
    status: "connected",
    message: settings.ebay.syncEnabled
      ? `Ready to sync from ${seller}.`
      : `Credentials present for ${seller}. Enable sync to import.`,
    data: { seller },
  };
}

/** True when Browse API credentials exist (seller may still be set in settings). */
export function ebayConfigured(): boolean {
  return ebayEnvConfigured();
}

const API_BASE =
  process.env.EBAY_ENV === "sandbox" ? "https://api.sandbox.ebay.com" : "https://api.ebay.com";
const MARKETPLACE = process.env.EBAY_MARKETPLACE_ID ?? "EBAY_CA";
const JEWELRY_AND_WATCHES_CATEGORY = "281";

interface TokenResponse {
  access_token: string;
  expires_in: number;
}
let tokenCache: { token: string; expires: number } | null = null;

async function getToken(): Promise<string> {
  if (tokenCache && tokenCache.expires > Date.now() + 60_000) return tokenCache.token;
  const basic = Buffer.from(
    `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`,
  ).toString("base64");
  const res = await fetch(`${API_BASE}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`eBay token request failed (${res.status})`);
  const data = (await res.json()) as TokenResponse;
  tokenCache = { token: data.access_token, expires: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

interface ItemSummary {
  itemId: string;
  title: string;
  price?: { value: string; currency: string };
  image?: { imageUrl: string };
  additionalImages?: { imageUrl: string }[];
  condition?: string;
  itemWebUrl?: string;
  categories?: { categoryName: string }[];
  itemEndDate?: string;
}

interface SearchResponse {
  itemSummaries?: ItemSummary[];
  next?: string;
}

function guessCategory(title: string, categories: string[]): Category {
  const hay = `${title} ${categories.join(" ")}`.toLowerCase();
  if (/\bwatch|wristwatch|chronograph\b/.test(hay)) return "watch";
  if (/\bring\b/.test(hay)) return "ring";
  if (/\bnecklace|pendant|chain\b/.test(hay)) return "necklace";
  if (/\bbracelet|bangle\b/.test(hay)) return "bracelet";
  if (/\bearring/.test(hay)) return "earrings";
  if (/\bbrooch|\bpin\b/.test(hay)) return "brooch";
  if (/\bloose\b|\bfaceted\b|\brough\b|\bcarat\b.*\b(sapphire|ruby|emerald|diamond)\b/.test(hay)) {
    return "loose-stone";
  }
  return "other";
}

function allowedByFilter(
  category: Category,
  filters: { jewellery: boolean; watches: boolean; looseStones: boolean },
): boolean {
  if (category === "watch") return filters.watches;
  if (category === "loose-stone") return filters.looseStones;
  if (category === "other") return filters.jewellery || filters.watches;
  return filters.jewellery;
}

function mapSummary(
  s: ItemSummary,
  existing: InventoryItem | undefined,
  visibility: Visibility,
): InventoryItem {
  const now = new Date().toISOString();
  const images = [s.image?.imageUrl, ...(s.additionalImages ?? []).map((i) => i.imageUrl)].filter(
    (u): u is string => Boolean(u && u.startsWith("https://")),
  );
  const price = s.price ? Number(s.price.value) : null;
  const currency = s.price?.currency === "USD" ? "USD" : "CAD";
  return {
    id: existing?.id ?? newId(),
    sku: existing?.sku ?? "",
    title: s.title.slice(0, 140),
    category:
      existing?.category ?? guessCategory(s.title, (s.categories ?? []).map((c) => c.categoryName)),
    condition: /new/i.test(s.condition ?? "") ? "new" : "pre-owned",
    status: "available",
    visibility: existing?.visibility ?? visibility,
    metal: existing?.metal ?? "",
    stones: existing?.stones ?? "",
    size: existing?.size ?? "",
    price: Number.isFinite(price) ? price : null,
    currency,
    description: existing?.description ?? "",
    disclosure: existing?.disclosure ?? "",
    images: images.slice(0, 12),
    source: "ebay",
    ebayItemId: s.itemId,
    ebayUrl: s.itemWebUrl,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export async function importFromEbay(): Promise<{ imported: number; ended: number; skipped: number }> {
  const settings = await getSettings();
  const status = await ebayConnectionStatus();
  if (status.status !== "connected" || !status.data?.seller) {
    throw new Error(status.message);
  }
  const seller = encodeURIComponent(status.data.seller);
  const token = await getToken();
  let url: string | undefined =
    `${API_BASE}/buy/browse/v1/item_summary/search?category_ids=${JEWELRY_AND_WATCHES_CATEGORY}` +
    `&filter=sellers:%7B${seller}%7D&limit=200`;

  const summaries: ItemSummary[] = [];
  for (let page = 0; url && page < 10; page++) {
    const res: Response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": MARKETPLACE,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`eBay search failed (${res.status})`);
    const data = (await res.json()) as SearchResponse;
    summaries.push(...(data.itemSummaries ?? []));
    url = data.next;
  }

  const existing = await listItems();
  const byEbayId = new Map(existing.filter((i) => i.ebayItemId).map((i) => [i.ebayItemId!, i]));
  const activeIds = new Set(summaries.map((s) => s.itemId));
  const visibility = settings.ebay.importToVisibility;
  const filters = settings.ebay.categories;

  let skipped = 0;
  const mapped: InventoryItem[] = [];
  for (const s of summaries) {
    const existingItem = byEbayId.get(s.itemId);
    const category =
      existingItem?.category ??
      guessCategory(s.title, (s.categories ?? []).map((c) => c.categoryName));
    if (!allowedByFilter(category, filters)) {
      skipped++;
      continue;
    }
    mapped.push(mapSummary(s, existingItem, visibility));
  }

  const ended = existing
    .filter(
      (i) =>
        i.source === "ebay" && i.ebayItemId && !activeIds.has(i.ebayItemId) && i.status !== "sold",
    )
    .map((i) => ({ ...i, status: "sold" as const, updatedAt: new Date().toISOString() }));

  await upsertMany([...mapped, ...ended]);
  const result = `${mapped.length} active listing(s) imported, ${ended.length} marked sold, ${skipped} skipped by category filter`;
  await updateSettings({
    ebay: {
      ...settings.ebay,
      lastImport: new Date().toISOString(),
      lastResult: result,
    },
  });
  return { imported: mapped.length, ended: ended.length, skipped };
}

// Re-export name used by older admin import route.
export { importFromEbay as syncEbayStore };
