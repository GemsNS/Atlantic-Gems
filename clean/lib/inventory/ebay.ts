import "server-only";
import { listItems, upsertMany, updateSettings } from "./store";
import { newId, type Category, type InventoryItem } from "./types";

/**
 * eBay Browse API import. Pulls the client's active listings by seller
 * username and upserts them as inventory items with source "ebay".
 *
 * Requires an eBay developer application (client id + secret). Uses the
 * client-credentials grant, which needs no user login. Listings that have
 * ended are marked sold on the next import. Manual items are never touched.
 */
export function ebayConfigured(): boolean {
  return Boolean(
    process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET && process.env.EBAY_SELLER_USERNAME,
  );
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

function mapSummary(s: ItemSummary, existing: InventoryItem | undefined): InventoryItem {
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
    category: existing?.category ?? guessCategory(s.title, (s.categories ?? []).map((c) => c.categoryName)),
    condition: /new/i.test(s.condition ?? "") ? "new" : "pre-owned",
    status: "available",
    visibility: existing?.visibility ?? "public",
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

export async function importFromEbay(): Promise<{ imported: number; ended: number }> {
  if (!ebayConfigured()) throw new Error("eBay is not configured");
  const token = await getToken();
  const seller = encodeURIComponent(process.env.EBAY_SELLER_USERNAME ?? "");
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

  const mapped = summaries.map((s) => mapSummary(s, byEbayId.get(s.itemId)));
  const ended = existing
    .filter((i) => i.source === "ebay" && i.ebayItemId && !activeIds.has(i.ebayItemId) && i.status !== "sold")
    .map((i) => ({ ...i, status: "sold" as const, updatedAt: new Date().toISOString() }));

  await upsertMany([...mapped, ...ended]);
  const result = `${mapped.length} active listing(s) imported, ${ended.length} marked sold`;
  await updateSettings({ ebayLastImport: new Date().toISOString(), ebayLastResult: result });
  return { imported: mapped.length, ended: ended.length };
}
