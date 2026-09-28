import "server-only";
import path from "node:path";
import { DATA_DIR, isListFile, readJson, StoreReadError } from "@/lib/json-store";
import { PARTS_FILE, isPartsFile } from "@/lib/parts/store";
import { ITEMS_FILE, SETTINGS_FILE } from "@/lib/inventory/store";
import { settingsSchema } from "@/lib/inventory/types";
import { CRM_FILES } from "@/lib/crm/store";

/** "ok", "missing" (an empty store, which is fine), or the StoreReadError code. */
export type FileState = string;

export type DataCheck = {
  /** False when a file the site cannot run without is there but unusable. */
  ok: boolean;
  /** Each file by its name inside DATA_DIR, never an absolute path. */
  files: Record<string, FileState>;
};

const CACHE_MS = 30_000;
const MISSING = Symbol("missing");

let cached: { at: number; result: Promise<DataCheck> } | undefined;

async function state(file: string, accept: (value: unknown) => boolean): Promise<FileState> {
  try {
    return (await readJson<unknown>(file, MISSING, accept)) === MISSING ? "missing" : "ok";
  } catch (err) {
    return err instanceof StoreReadError ? err.code : "EUNKNOWN";
  }
}

const name = (file: string) => path.relative(DATA_DIR, file).split(path.sep).join("/");

async function run(): Promise<DataCheck> {
  // The files every write refuses while they are broken, read the way the
  // stores read them. listParts is not used: on a fresh deploy it would seed.
  const critical: [string, (value: unknown) => boolean][] = [
    [PARTS_FILE, isPartsFile],
    [ITEMS_FILE, isListFile],
    ...CRM_FILES.map((f): [string, (value: unknown) => boolean] => [f, isListFile]),
  ];
  const files: Record<string, FileState> = {};
  let ok = true;
  for (const [file, accept] of critical) {
    const s = await state(file, accept);
    files[name(file)] = s;
    if (s !== "ok" && s !== "missing") ok = false;
  }
  // A broken settings.json is reported but does not fail the check: the site
  // keeps running on the default settings until an admin saves.
  files[name(SETTINGS_FILE)] = await state(SETTINGS_FILE, (v) => settingsSchema.safeParse(v).success);
  return { ok, files };
}

/**
 * Whether the data files read and parse. Cached for 30 s, so a caller cannot
 * make the server parse every CRM file on each request; readJson's own log
 * line for a broken file is already limited to once a minute.
 */
export function checkDataFiles(): Promise<DataCheck> {
  const now = Date.now();
  if (!cached || now - cached.at >= CACHE_MS) cached = { at: now, result: run() };
  return cached.result;
}
