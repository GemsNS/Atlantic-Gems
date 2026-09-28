import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { withFileLock } from "./file-lock";

/**
 * Shared atomic JSON file helpers. Writes are serialised in two layers: an
 * in-process queue, so a process never contends with itself, and a lock in
 * DATA_DIR, so another process on the same host (a PM2 cluster, the old and
 * new server overlapping during a deploy, a script run beside the server)
 * cannot interleave its read-modify-write with ours. Reads take neither:
 * writes are atomic renames, so a read sees the old file or the new one.
 *
 * A missing file is an empty store. A file that is there but unusable is an
 * error (StoreReadError), never an empty store: list stores refuse to write
 * until someone looks at it, and small regenerable settings are moved aside
 * with `quarantine` before being written afresh.
 */
export const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");

const LOCK_PATH = path.join(DATA_DIR, ".lock");

let queue: Promise<unknown> = Promise.resolve();

export function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const run = () => withFileLock(LOCK_PATH, fn);
  const next = queue.then(run, run);
  queue = next.catch(() => undefined);
  return next;
}

/**
 * A data file that exists but cannot be used: unreadable (EACCES, EISDIR and
 * the like, code as given), not JSON ("EJSON"), or JSON of the wrong shape
 * ("ESHAPE"). It is never taken for an empty store, because the next write
 * would then replace whatever it holds. It carries only the path and code,
 * never the underlying error: a JSON.parse error quotes the file's text
 * around the fault, which for a CRM file is customer data, and Next logs the
 * whole error (cause included) whenever one escapes a page render.
 */
export class StoreReadError extends Error {
  readonly file: string;
  readonly code: string;

  constructor(file: string, code: string) {
    super(`Could not read ${file} (${code})`);
    this.name = "StoreReadError";
    this.file = file;
    this.code = code;
  }
}

const REPORT_EVERY_MS = 60_000;

// Settings are read several times per page, so a broken file is logged once a
// minute per file and code, not on every read, until it reads cleanly again.
const reported = new Map<string, { code: string; at: number }>();

function unreadable(file: string, code: string): StoreReadError {
  const last = reported.get(file);
  const now = Date.now();
  if (!last || last.code !== code || now - last.at >= REPORT_EVERY_MS) {
    reported.set(file, { code, at: now });
    console.error(`[store] could not read ${file} (${code})`);
  }
  return new StoreReadError(file, code);
}

/**
 * Reads a JSON data file. Only a missing file gives `fallback`. A file that is
 * there but cannot be read or parsed, or whose value fails `accept`, throws a
 * StoreReadError, so a caller inside `serialize` never writes over it.
 */
export async function readJson<T>(
  file: string,
  fallback: T,
  accept?: (value: unknown) => boolean,
): Promise<T> {
  let text: string;
  try {
    text = await readFile(file, "utf8");
  } catch (err) {
    const code = (err as NodeJS.ErrnoException | null)?.code;
    if (code === "ENOENT") {
      reported.delete(file);
      return fallback;
    }
    throw unreadable(file, code ?? "EUNKNOWN");
  }
  let value: unknown;
  try {
    // A file saved by hand in some Windows editors starts with a byte order mark.
    value = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    throw unreadable(file, "EJSON");
  }
  if (accept && !accept(value)) throw unreadable(file, "ESHAPE");
  reported.delete(file);
  return value as T;
}

/**
 * The shape of every `{ items: [...] }` list file. `{}` holds nothing, so it
 * reads as empty; any other object without an items array (an array body, a
 * misspelt key) would be lost by the next write, so it is unreadable.
 */
export function isListFile(value: unknown): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  return Array.isArray((value as { items?: unknown }).items) || Object.keys(value).length === 0;
}

/**
 * Moves an unreadable data file aside as `<file>.corrupt-<time>`, so a write
 * can start afresh without destroying it. A rename rather than a copy: it
 * needs no read access, also moves a directory standing in the file's place,
 * and keeps the original bytes, owner and mode. If the move fails the error
 * propagates and the caller's write is refused. Callers hold the write queue.
 */
export async function quarantine(file: string): Promise<string | null> {
  // No colons: Windows does not allow them in file names.
  const aside = `${file}.corrupt-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  try {
    await rename(file, aside);
  } catch (err) {
    // Removed by hand in the meantime: nothing is left to keep.
    if ((err as NodeJS.ErrnoException | null)?.code === "ENOENT") return null;
    throw err;
  }
  console.error(`[store] moved unreadable ${file} aside to ${aside}`);
  return aside;
}

export async function writeJsonAtomic(file: string, data: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  // pid and time alone can repeat (a reused pid, two copies of this module in
  // one process), so random bytes keep every writer's temp file its own.
  const tmp = `${file}.${process.pid}.${Date.now()}.${randomBytes(4).toString("hex")}.tmp`;
  try {
    await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await rename(tmp, file);
  } catch (err) {
    await rm(tmp, { force: true }).catch(() => undefined);
    throw err;
  }
}
