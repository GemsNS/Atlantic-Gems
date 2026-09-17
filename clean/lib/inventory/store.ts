import "server-only";
import path from "node:path";
import { DATA_DIR, readJson, serialize, writeJsonAtomic } from "@/lib/json-store";
import { detectMode, modePages, PAGE_KEYS, type PageKey, type SiteMode } from "@/lib/site-pages";
import {
  itemSchema,
  settingsSchema,
  type InventoryItem,
  type Settings,
} from "./types";

const ITEMS_FILE = path.join(DATA_DIR, "inventory.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

export async function getSettings(): Promise<Settings> {
  const raw = await readJson<unknown>(SETTINGS_FILE, {});
  const parsed = settingsSchema.safeParse(raw);
  return parsed.success ? parsed.data : settingsSchema.parse({});
}

export async function updateSettings(patch: Partial<{
  shopOpen: boolean;
  siteMode: SiteMode;
  pages: Partial<Record<PageKey, boolean>>;
  ebay: Partial<Settings["ebay"]>;
}>): Promise<Settings> {
  return serialize(async () => {
    const current = await getSettings();
    let siteMode = patch.siteMode ?? current.siteMode;
    let pages = { ...current.pages };

    if (patch.siteMode && patch.siteMode !== "custom") {
      pages = modePages(patch.siteMode);
      siteMode = patch.siteMode;
    } else if (patch.pages) {
      pages = { ...pages, ...patch.pages };
      siteMode = detectMode(pages);
    }

    const ebay = patch.ebay ? { ...current.ebay, ...patch.ebay, categories: {
      ...current.ebay.categories,
      ...(patch.ebay.categories ?? {}),
    } } : current.ebay;

    const next = settingsSchema.parse({
      shopOpen: patch.shopOpen ?? current.shopOpen,
      siteMode,
      pages,
      ebay,
    });
    // Force custom detection after parse when pages were patched.
    if (patch.pages && !patch.siteMode) {
      const forced = { ...next, siteMode: detectMode(next.pages) as SiteMode };
      await writeJsonAtomic(SETTINGS_FILE, {
        shopOpen: forced.shopOpen,
        siteMode: forced.siteMode,
        pages: forced.pages,
        ebay: forced.ebay,
      });
      return forced;
    }
    await writeJsonAtomic(SETTINGS_FILE, {
      shopOpen: next.shopOpen,
      siteMode: next.siteMode,
      pages: next.pages,
      ebay: next.ebay,
    });
    return next;
  });
}

export async function listItems(): Promise<InventoryItem[]> {
  const raw = await readJson<{ items?: unknown[] }>(ITEMS_FILE, { items: [] });
  const items: InventoryItem[] = [];
  for (const entry of raw.items ?? []) {
    const parsed = itemSchema.safeParse(entry);
    if (parsed.success) items.push(parsed.data);
  }
  return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getItem(id: string): Promise<InventoryItem | null> {
  const items = await listItems();
  return items.find((i) => i.id === id) ?? null;
}

export async function upsertItem(item: InventoryItem): Promise<InventoryItem> {
  return serialize(async () => {
    const items = await listItems();
    const idx = items.findIndex((i) => i.id === item.id);
    const clean = itemSchema.parse(item);
    if (idx >= 0) items[idx] = clean;
    else items.push(clean);
    await writeJsonAtomic(ITEMS_FILE, { items });
    return clean;
  });
}

export async function upsertMany(incoming: InventoryItem[]): Promise<number> {
  return serialize(async () => {
    const items = await listItems();
    let changed = 0;
    for (const item of incoming) {
      const clean = itemSchema.parse(item);
      const idx = items.findIndex((i) => i.id === clean.id);
      if (idx >= 0) items[idx] = clean;
      else items.push(clean);
      changed++;
    }
    await writeJsonAtomic(ITEMS_FILE, { items });
    return changed;
  });
}

export async function deleteItem(id: string): Promise<boolean> {
  return serialize(async () => {
    const items = await listItems();
    const next = items.filter((i) => i.id !== id);
    if (next.length === items.length) return false;
    await writeJsonAtomic(ITEMS_FILE, { items: next });
    return true;
  });
}

export { PAGE_KEYS };
