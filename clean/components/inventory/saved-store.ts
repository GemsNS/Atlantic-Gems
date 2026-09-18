"use client";

import { useSyncExternalStore } from "react";

/**
 * Saved pieces ("save for enquiry") live in this browser only — nothing is
 * sent anywhere until the visitor asks us for a quote. A tiny external store
 * keeps every save button on a page in step without a provider.
 */

const KEY = "ag.saved-pieces";
const LIMIT = 200;
const EMPTY: readonly string[] = [];

let snapshot: readonly string[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function read(): readonly string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const ids = parsed.filter((x): x is string => typeof x === "string").slice(0, LIMIT);
    return ids.length ? ids : EMPTY;
  } catch {
    return EMPTY;
  }
}

function write(next: readonly string[]) {
  snapshot = next.length ? next : EMPTY;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    // Private browsing or a full quota: the list still works for this visit.
  }
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  if (!loaded) {
    loaded = true;
    snapshot = read();
  }
  listeners.add(listener);
  const sync = (e: StorageEvent) => {
    if (e.key !== null && e.key !== KEY) return;
    snapshot = read();
    for (const l of listeners) l();
  };
  window.addEventListener("storage", sync);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", sync);
  };
}

function getSnapshot(): readonly string[] {
  return snapshot;
}

/** The server and the first client paint agree on "nothing saved yet". */
function getServerSnapshot(): readonly string[] {
  return EMPTY;
}

export function useSavedPieces(): readonly string[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function toggleSaved(id: string): void {
  write(snapshot.includes(id) ? snapshot.filter((x) => x !== id) : [...snapshot, id].slice(-LIMIT));
}

export function clearSaved(): void {
  write(EMPTY);
}
