import "server-only";
import { newId } from "@/lib/inventory/types";
import { listParts } from "@/lib/parts/store";
import { listQuotes, listTasks, upsertTask } from "./store";
import type { Task } from "./types";

const STALE_QUOTE_DAYS = 7;

/** Deterministic follow-up suggestions — no external AI. */
export async function refreshFollowUps(): Promise<Task[]> {
  const [quotes, tasks, parts] = await Promise.all([listQuotes(), listTasks(), listParts()]);
  const now = Date.now();
  const openTasks = tasks.filter((t) => t.status === "open");
  const created: Task[] = [];

  for (const q of quotes) {
    if (q.status !== "sent" && q.status !== "draft") continue;
    const ageDays = (now - new Date(q.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays < STALE_QUOTE_DAYS) continue;
    const key = `stale-quote:${q.id}`;
    if (openTasks.some((t) => t.reason === key)) continue;
    const task = await upsertTask({
      id: newId(),
      title: `Follow up quote ${q.id} (${q.customerName || q.customerEmail || "customer"})`,
      status: "open",
      dueAt: new Date().toISOString(),
      relatedQuoteId: q.id,
      relatedDealId: q.dealId,
      relatedContactId: q.contactId,
      reason: key,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    created.push(task);
  }

  for (const p of parts) {
    if (p.stockQty > p.reorderPoint) continue;
    const key = `reorder:${p.id}`;
    if (openTasks.some((t) => t.reason === key)) continue;
    const task = await upsertTask({
      id: newId(),
      title: `Reorder ${p.sku} — ${p.title} (stock ${p.stockQty})`,
      status: "open",
      dueAt: new Date().toISOString(),
      relatedQuoteId: null,
      relatedDealId: null,
      relatedContactId: null,
      reason: key,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    created.push(task);
  }

  return created;
}
