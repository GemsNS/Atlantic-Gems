import { randomBytes } from "node:crypto";
import { lstat, mkdir, readdir, readFile, readlink, rename, rm, rmdir, stat, unlink, writeFile } from "node:fs/promises";
import { hostname } from "node:os";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

/**
 * A lock shared by every process on one host that uses the same directory,
 * built only from atomic filesystem calls, so it needs no native module and
 * behaves the same on Windows and Linux. Kept free of the "@/" alias and of
 * "server-only" so a plain Node script can import it too.
 *
 * The lock at `lockPath` is held by token T exactly while the file
 * `lockPath/owner.T.json` exists.
 * - To take it, a process fills a private directory with its owner file and
 *   renames that directory to `lockPath`. The owner file arrives with it, so
 *   a held lock is never an empty directory, and the rename fails while one
 *   is there. (Linux lets the rename replace an empty directory, which is a
 *   free lock; Windows refuses any existing directory.)
 * - Release and stale recovery delete the owner file by name. The name is
 *   unique to one holder, so a waiter acting on an out-of-date view of an old
 *   owner can only delete that owner's file, never the current holder's.
 *   Windows can let two waiters both delete the same file; that is harmless
 *   for the same reason, because the rename alone decides who holds the lock.
 * - The emptied directory is then removed with rmdir, which refuses a
 *   directory that a new holder has already moved into place.
 * - A waiter killed while waiting leaves its private directory behind. Each
 *   acquire may sweep those up; see sweepPending.
 */

export type FileLockOptions = {
  /** How long to wait for the lock before giving up. */
  timeoutMs?: number;
  /** A lock held longer than this is treated as abandoned and removed. */
  staleMs?: number;
};

type Identity = { hostname: string; pidNamespace: string };

type Owner = Identity & { token: string; pid: number; acquiredAt: string };

const TIMEOUT_MS = 10_000;
const STALE_MS = 30_000;
const MIN_DELAY_MS = 4;
const MAX_DELAY_MS = 100;
const RESTAMP_MS = 1_000;
const INSPECT_MS = 100;
const SWEEP_MAX = 16;

function errorCode(err: unknown): string | undefined {
  return (err as NodeJS.ErrnoException | null)?.code;
}

let identity: Promise<Identity> | undefined;

// A pid only identifies a process on the machine, and in the PID namespace,
// that recorded it: two containers can share a hostname but not a namespace.
function localIdentity(): Promise<Identity> {
  identity ??= readlink("/proc/self/ns/pid").then(
    (ns) => ({ hostname: hostname(), pidNamespace: ns }),
    () => ({ hostname: hostname(), pidNamespace: "" }),
  );
  return identity;
}

function pidAlive(pid: number): boolean {
  // 0 and negative numbers address process groups, so they prove nothing.
  if (!Number.isInteger(pid) || pid <= 0) return true;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    // EPERM: the process exists but belongs to another user.
    return errorCode(err) === "EPERM";
  }
}

/** The owner record, or null when the file has gone. */
async function readOwner(file: string): Promise<Partial<Owner> | null> {
  try {
    const owner = JSON.parse(await readFile(file, "utf8")) as Partial<Owner> | null;
    if (owner && Number.isFinite(Date.parse(owner.acquiredAt ?? ""))) return owner;
  } catch (err) {
    if (errorCode(err) === "ENOENT") return null;
  }
  // Unreadable or incomplete: judge its age by the file's own timestamp.
  try {
    return { acquiredAt: (await stat(file)).mtime.toISOString() };
  } catch {
    return null;
  }
}

function abandoned(owner: Partial<Owner>, staleMs: number, self: Identity): boolean {
  // Either way round, so a clock set back cannot leave a lock stamped in the
  // future stuck.
  if (Math.abs(Date.now() - Date.parse(owner.acquiredAt ?? "")) > staleMs) return true;
  const local = owner.hostname === self.hostname && owner.pidNamespace === self.pidNamespace;
  return local && typeof owner.pid === "number" && !pidAlive(owner.pid);
}

/**
 * Looks at the current lock and removes it if nobody holds it any more.
 * `cleared` means it is worth trying again straight away.
 */
async function clearIfAbandoned(
  lockPath: string,
  staleMs: number,
  self: Identity,
): Promise<{ cleared: boolean; owner?: Partial<Owner> }> {
  // Everything below reads and deletes inside lockPath, so it must be a real
  // directory. A symlink or junction there would lead the cleanup into
  // whatever it points at (Node reports a Windows junction as a symlink).
  let info;
  try {
    info = await lstat(lockPath);
  } catch (err) {
    if (errorCode(err) === "ENOENT") return { cleared: true };
    throw err;
  }
  if (info.isSymbolicLink() || !info.isDirectory()) {
    throw new Error(`${lockPath} is not a plain directory, so it is not a lock this process made; remove it by hand.`);
  }

  let names: string[];
  try {
    names = await readdir(lockPath);
  } catch (err) {
    return { cleared: errorCode(err) === "ENOENT" };
  }

  const ownerName = names.find((n) => n.startsWith("owner.") && n.endsWith(".json"));
  if (!ownerName) {
    // No owner: a release or recovery stopped between its two steps, or
    // something else wrote into the directory. A live lock never holds
    // these names, so removing them by name cannot touch one. Only plain
    // files are removed; anything else stays, and so does the lock, until
    // someone looks.
    await Promise.all(
      names.map(async (n) => {
        const entry = path.join(lockPath, n);
        const kind = await lstat(entry).catch(() => null);
        if (kind?.isFile()) await unlink(entry).catch(() => undefined);
        else if (kind) console.error(`[lock] left ${entry} in place: it is not a plain file`);
      }),
    );
    return { cleared: await rmdir(lockPath).then(() => true, () => false) };
  }

  const ownerFile = path.join(lockPath, ownerName);
  const owner = await readOwner(ownerFile);
  if (!owner) return { cleared: true };
  if (!abandoned(owner, staleMs, self)) return { cleared: false, owner };

  try {
    await unlink(ownerFile);
  } catch (err) {
    // ENOENT: the holder released it, or another waiter recovered it first.
    return { cleared: errorCode(err) === "ENOENT", owner };
  }
  console.error(
    `[lock] removed an abandoned lock at ${lockPath} (pid ${owner.pid ?? "unknown"} on ${owner.hostname ?? "unknown host"}, taken ${owner.acquiredAt})`,
  );
  await rmdir(lockPath).catch(() => undefined);
  return { cleared: true };
}

/** When this process last swept beside each lock. */
const sweptAt = new Map<string, number>();

/** The latest modification time of a directory or anything directly in it. */
async function lastChanged(dir: string): Promise<number> {
  let newest = (await stat(dir)).mtimeMs;
  for (const name of await readdir(dir)) {
    const info = await stat(path.join(dir, name)).catch(() => null);
    if (info) newest = Math.max(newest, info.mtimeMs);
  }
  return newest;
}

/**
 * Removes pending directories left by waiters that were killed (a SIGKILL
 * during a reload, say). Bounded: at most once per staleMs for each lock in a
 * process, and SWEEP_MAX directories a pass. Best effort; it never throws.
 * - A live waiter rewrites its owner file every RESTAMP_MS and gives up after
 *   timeoutMs, so a directory with nothing changed for staleMs has no live
 *   waiter. The directory's own time is not enough: rewriting a file inside
 *   it does not change it. A time in the future is left alone.
 * - Each one is renamed to a private `.swept` name before it is deleted. Had
 *   its waiter been alive after all, the waiter's own rename to `lockPath`
 *   either happens first or fails with ENOENT and rebuilds, so it can never
 *   move a half-emptied directory into place as the lock.
 */
async function sweepPending(lockPath: string, staleMs: number, ownToken: string) {
  const now = Date.now();
  if (now - (sweptAt.get(lockPath) ?? 0) < staleMs) return;
  sweptAt.set(lockPath, now);

  const dir = path.dirname(lockPath);
  const prefix = `${path.basename(lockPath)}.`;
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return;
  }
  let seen = 0;
  for (const name of names) {
    if (!name.startsWith(prefix)) continue;
    const match = /^([0-9a-f]{16})\.(pending|swept)$/.exec(name.slice(prefix.length));
    if (!match || match[1] === ownToken) continue;
    if (++seen > SWEEP_MAX) break;
    const found = path.join(dir, name);
    const swept = `${lockPath}.${match[1]}.swept`;
    try {
      // Only a real directory is ours to remove; a symlink or junction with a
      // matching name is left alone rather than followed.
      const kind = await lstat(found);
      if (kind.isSymbolicLink() || !kind.isDirectory()) continue;
      // A .swept directory is already private: its sweeper stopped before
      // deleting it.
      if (match[2] === "pending") {
        if (now - (await lastChanged(found)) <= staleMs) continue;
        await rename(found, swept);
      }
      await rm(swept, { recursive: true, force: true });
      console.error(`[lock] removed ${found}, left behind by a process that stopped`);
    } catch {
      // Gone already, taken by its waiter, or held open on Windows.
    }
  }
}

/** Takes the lock and returns the owner file that proves it. */
async function acquire(lockPath: string, timeoutMs: number, staleMs: number): Promise<string> {
  const self = await localIdentity();
  const token = randomBytes(8).toString("hex");
  const ownerName = `owner.${token}.json`;
  const pending = `${lockPath}.${token}.pending`;
  await sweepPending(lockPath, staleMs, token).catch(() => undefined);
  const deadline = Date.now() + timeoutMs;
  let stampedAt = 0;
  let inspectedAt = 0;
  let delay = MIN_DELAY_MS;
  let holder: Partial<Owner> | undefined;

  try {
    for (;;) {
      if (Date.now() - stampedAt > RESTAMP_MS) {
        // Restamped while waiting, so acquiredAt records when the lock was
        // taken rather than when the wait began. Also creates the parent.
        stampedAt = Date.now();
        const owner: Owner = { token, pid: process.pid, ...self, acquiredAt: new Date(stampedAt).toISOString() };
        try {
          await mkdir(pending, { recursive: true });
          await writeFile(path.join(pending, ownerName), JSON.stringify(owner), "utf8");
        } catch (err) {
          // ENOENT: swept away between the two calls (this process was paused
          // for longer than staleMs). The rename below fails the same way, and
          // the next pass rebuilds it.
          if (errorCode(err) !== "ENOENT") throw err;
          stampedAt = 0;
        }
      }

      try {
        await rename(pending, lockPath);
        return path.join(lockPath, ownerName);
      } catch (err) {
        // ENOENT: the pending directory or its parent was removed, so rebuild
        // it. Any other code means a lock directory is in the way (EPERM on
        // Windows, EEXIST or ENOTEMPTY elsewhere) or Windows briefly has it open.
        if (errorCode(err) === "ENOENT") stampedAt = 0;
      }

      // Looking at the holder costs two more filesystem calls, so a waiter
      // retries the rename on every pass but inspects less often.
      let cleared = false;
      if (Date.now() - inspectedAt >= INSPECT_MS) {
        inspectedAt = Date.now();
        const seen = await clearIfAbandoned(lockPath, staleMs, self);
        holder = seen.owner ?? holder;
        cleared = seen.cleared;
      }
      if (Date.now() >= deadline) {
        const who = holder?.pid
          ? ` It is held by pid ${holder.pid} on ${holder.hostname}, taken ${holder.acquiredAt}.`
          : "";
        throw new Error(`Timed out after ${timeoutMs} ms waiting for the lock at ${lockPath}.${who}`);
      }
      delay = cleared ? MIN_DELAY_MS : Math.min(delay * 2, MAX_DELAY_MS);
      await sleep(delay / 2 + Math.random() * (delay / 2));
    }
  } finally {
    // Nothing is left here after a successful rename.
    await rm(pending, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function release(ownerFile: string) {
  const lockPath = path.dirname(ownerFile);
  for (let attempt = 0; ; attempt++) {
    try {
      await unlink(ownerFile);
      break;
    } catch (err) {
      if (errorCode(err) === "ENOENT") {
        // Held past staleMs and recovered by another process. The current
        // holder's lock is left alone.
        console.error(`[lock] the lock at ${lockPath} was removed as abandoned before this process released it`);
        return;
      }
      if (attempt >= 4) {
        // It will be recovered once it is older than staleMs.
        console.error(`[lock] could not release the lock at ${lockPath}`);
        return;
      }
      await sleep(10 * 2 ** attempt);
    }
  }
  // Fails harmlessly if a new holder has already moved its directory in.
  await rmdir(lockPath).catch(() => undefined);
}

/**
 * Runs `fn` while holding the lock at `lockPath`, waiting with backoff for up
 * to `timeoutMs`. The lock is always released, and a failed release never
 * replaces the result or error of `fn`.
 */
export async function withFileLock<T>(
  lockPath: string,
  fn: () => Promise<T>,
  options: FileLockOptions = {},
): Promise<T> {
  const ownerFile = await acquire(lockPath, options.timeoutMs ?? TIMEOUT_MS, options.staleMs ?? STALE_MS);
  try {
    return await fn();
  } finally {
    await release(ownerFile);
  }
}
