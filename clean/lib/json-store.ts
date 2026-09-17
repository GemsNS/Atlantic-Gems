import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Shared atomic JSON file helpers. Writes are serialised through an
 * in-process queue so concurrent updates do not clobber each other.
 */
export const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");

let queue: Promise<unknown> = Promise.resolve();

export function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const next = queue.then(fn, fn);
  queue = next.catch(() => undefined);
  return next;
}

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonAtomic(file: string, data: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await rename(tmp, file);
}
