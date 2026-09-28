import "server-only";
import path from "node:path";
import { DATA_DIR, readJson, serialize, writeJsonAtomic } from "@/lib/json-store";
import { newId } from "@/lib/inventory/types";
import { partSchema, type Part, type PartCategory } from "./types";
import { SEED_PARTS } from "./seed";

export const PARTS_FILE = path.join(DATA_DIR, "parts.json");

/**
 * `{ seeded: true, items }` is the catalogue, empty or not. An unflagged file
 * with no lines (`{}`, `{ items: [] }`) is a first run. Anything else (an
 * array or null, items that are not a list, unflagged lines) would be lost to
 * the demo seed, so it is unreadable rather than unseeded.
 */
export function isPartsFile(value: unknown): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const { seeded, items } = value as { seeded?: unknown; items?: unknown };
  if (items !== undefined && !Array.isArray(items)) return false;
  if (seeded === true) return true;
  const noLines = items === undefined || (Array.isArray(items) && items.length === 0);
  return noLines && Object.keys(value).every((k) => k === "seeded" || k === "items");
}

/**
 * The lines in a file that has been seeded, or null when it never has been.
 * `seeded: true` with no items is a catalogue staff emptied on purpose (the
 * demo lines retired), not a first run, so it stays empty. A file that is
 * there but unreadable throws StoreReadError: pages show the error page, and
 * seeding and every write, which read through here, are refused.
 */
async function readSeeded(): Promise<Part[] | null> {
  const raw = await readJson<{ items?: unknown[]; seeded?: unknown } | null>(
    PARTS_FILE,
    null,
    isPartsFile,
  );
  if (raw?.seeded !== true) return null;
  const entries = raw.items ?? [];
  return entries.flatMap((entry) => {
    const parsed = partSchema.safeParse(entry);
    return parsed.success ? [parsed.data] : [];
  });
}

/**
 * Writes the demo catalogue on first run only: no file yet, or an unflagged
 * one with no lines. Callers hold the write queue.
 */
async function ensureSeeded(): Promise<Part[]> {
  const existing = await readSeeded();
  if (existing) return existing;
  const now = new Date().toISOString();
  const items = SEED_PARTS.map((p) =>
    partSchema.parse({
      ...p,
      id: newId(),
      createdAt: now,
      updatedAt: now,
    }),
  );
  await writeJsonAtomic(PARTS_FILE, { seeded: true, items });
  return items;
}

/**
 * Reads skip the write queue: writes are atomic renames, so a read sees the
 * old file or the new one, never half of either. Only first-run seeding goes
 * through the queue, and an empty seeded catalogue is read like any other.
 * This keeps page renders (the header reads parts whenever the tray has
 * lines) from waiting behind CRM or inventory writes.
 */
export async function listParts(): Promise<Part[]> {
  const items = (await readSeeded()) ?? (await serialize(ensureSeeded));
  return items.sort((a, b) => a.title.localeCompare(b.title));
}

export async function listPartsByCategory(category: PartCategory): Promise<Part[]> {
  const items = await listParts();
  return items.filter((p) => p.category === category);
}

export async function getPart(id: string): Promise<Part | null> {
  const items = await listParts();
  return items.find((p) => p.id === id) ?? null;
}

export async function upsertPart(part: Part): Promise<Part> {
  return serialize(async () => {
    const items = await ensureSeeded();
    const clean = partSchema.parse(part);
    const idx = items.findIndex((i) => i.id === clean.id);
    if (idx >= 0) items[idx] = clean;
    else items.push(clean);
    await writeJsonAtomic(PARTS_FILE, { seeded: true, items });
    return clean;
  });
}

export async function deletePart(id: string): Promise<boolean> {
  return serialize(async () => {
    const items = await ensureSeeded();
    const next = items.filter((i) => i.id !== id);
    if (next.length === items.length) return false;
    await writeJsonAtomic(PARTS_FILE, { seeded: true, items: next });
    return true;
  });
}

export function isPublicPart(p: Part): boolean {
  return p.visibility === "public";
}

export function isTradePart(p: Part): boolean {
  return p.visibility === "public" || p.visibility === "trade";
}
