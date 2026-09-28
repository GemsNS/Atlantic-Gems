import { adminRedirect, readAdminForm } from "@/lib/admin-actions";
import { patchQuote } from "@/lib/crm/store";
import { QUOTE_STATUSES } from "@/lib/crm/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await readAdminForm(req);
  if (!form) return adminRedirect("/admin/quotes", { error: "rejected" });
  const quoteId = String(form.get("quoteId") ?? "");
  const status = String(form.get("status") ?? "");
  // Ids come from newId(); anything else never reaches the redirect path.
  if (!/^[a-z0-9]{1,40}$/.test(quoteId)) {
    return adminRedirect("/admin/quotes", { error: "quote-not-found" });
  }
  const back = `/admin/quotes/${quoteId}`;
  const next = QUOTE_STATUSES.find((s) => s.value === status);
  if (!next) return adminRedirect(back, { error: "invalid-status" });
  let saved;
  try {
    saved = await patchQuote(quoteId, (q) => ({
      ...q,
      status: next.value,
      updatedAt: new Date().toISOString(),
    }));
  } catch (err) {
    // An unreadable quotes.json or a lock timeout: nothing was written.
    console.error("[quote] status change failed:", err instanceof Error ? err.message : "unknown error");
    return adminRedirect(back, { error: "quotes-store" });
  }
  if (!saved) return adminRedirect("/admin/quotes", { error: "quote-not-found" });
  return adminRedirect(back, { msg: `status-set:${next.value}` });
}
