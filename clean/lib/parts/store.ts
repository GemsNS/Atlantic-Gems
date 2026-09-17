import "server-only";
import path from "node:path";
import { DATA_DIR, readJson, serialize, writeJsonAtomic } from "@/lib/json-store";
import { newId } from "@/lib/inventory/types";
import { partSchema, type Part, type PartCategory } from "./types";
import { SEED_PARTS } from "./seed";

const PARTS_FILE = path.join(DATA_DIR, "parts.json");

async function ensureSeeded(): Promise<Part[]> {
  const raw = await readJson<{ items?: unknown[]; seeded?: boolean }>(PARTS_FILE, {});
  if (raw.seeded && Array.isArray(raw.items) && raw.items.length > 0) {
    const items: Part[] = [];
    for (const entry of raw.items) {
      const parsed = partSchema.safeParse(entry);
      if (parsed.success) items.push(parsed.data);
    }
    return items;
  }
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

export async function listParts(): Promise<Part[]> {
  return serialize(async () => {
    const items = await ensureSeeded();
    return items.sort((a, b) => a.title.localeCompare(b.title));
  });
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
