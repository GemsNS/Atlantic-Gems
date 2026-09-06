import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { itemSchema, settingsSchema, type InventoryItem, type Settings } from "./types";

/**
 * File-backed inventory store. Small jewellery inventories fit comfortably in
 * a JSON document; writes are atomic (temp file + rename) and serialised
 * through an in-process queue. Set DATA_DIR to a persistent path in
 * production (outside the deploy directory, backed up).
 */
const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const ITEMS_FILE = path.join(DATA_DIR, "inventory.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

let queue: Promise<unknown> = Promise.resolve();
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const next = queue.then(fn, fn);
  queue = next.catch(() => undefined);
  return next;
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonAtomic(file: string, data: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await rename(tmp, file);
}

export async function getSettings(): Promise<Settings> {
  const raw = await readJson<unknown>(SETTINGS_FILE, {});
  const parsed = settingsSchema.safeParse(raw);
  return parsed.success ? parsed.data : settingsSchema.parse({});
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  return serialize(async () => {
    const current = await getSettings();
    const next = settingsSchema.parse({ ...current, ...patch });
    await writeJsonAtomic(SETTINGS_FILE, next);
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
