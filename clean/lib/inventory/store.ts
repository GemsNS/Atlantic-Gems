import "server-only";
import path from "node:path";
import {
  DATA_DIR,
  isListFile,
  quarantine,
  readJson,
  serialize,
  StoreReadError,
  writeJsonAtomic,
} from "@/lib/json-store";
import { detectMode, modePages, PAGE_KEYS, type PageKey, type SiteMode } from "@/lib/site-pages";
import {
  itemSchema,
  settingsSchema,
  type InventoryItem,
  type Settings,
} from "./types";

export const ITEMS_FILE = path.join(DATA_DIR, "inventory.json");
export const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

/** Read errors that mean settings.json itself is unusable. */
const QUARANTINE_CODES = new Set(["EJSON", "ESHAPE", "EISDIR"]);

/** No file means the defaults; one that fails the schema is unreadable. */
async function readSettings(): Promise<Settings> {
  const raw = await readJson<unknown>(
    SETTINGS_FILE,
    {},
    (value) => settingsSchema.safeParse(value).success,
  );
  return settingsSchema.parse(raw);
}

/**
 * Read on nearly every page, so an unreadable settings.json (logged by
 * readJson) gives the defaults rather than taking the site down. The file is
 * left alone until an admin saves settings.
 */
export async function getSettings(): Promise<Settings> {
  try {
    return await readSettings();
  } catch (err) {
    if (err instanceof StoreReadError) return settingsSchema.parse({});
    throw err;
  }
}

export async function updateSettings(patch: Partial<{
  shopOpen: boolean;
  siteMode: SiteMode;
  pages: Partial<Record<PageKey, boolean>>;
  ebay: Partial<Settings["ebay"]>;
}>): Promise<Settings> {
  return serialize(async () => {
    let current: Settings;
    try {
      current = await readSettings();
    } catch (err) {
      // Only a file that is itself wrong is moved aside: not JSON, the wrong
      // shape, or a directory in its place. Any other code (EBUSY while a
      // scanner or backup holds it, EMFILE, EIO, a permission error) says
      // nothing about its content, so the save is refused and the admin tries
      // again, rather than a good file being replaced by the defaults.
      if (!(err instanceof StoreReadError) || !QUARANTINE_CODES.has(err.code)) throw err;
      // The site has run on the defaults since the file became unreadable, and
      // the defaults are what the admin saw. Keep the file as evidence and
      // apply this change to them.
      await quarantine(SETTINGS_FILE);
      current = settingsSchema.parse({});
    }
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

/**
 * An unreadable inventory.json throws StoreReadError: pages show the error
 * page, and writes, which read through here inside `serialize`, are refused
 * with the file kept as it is.
 */
export async function listItems(): Promise<InventoryItem[]> {
  const raw = await readJson<{ items?: unknown[] }>(ITEMS_FILE, { items: [] }, isListFile);
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
