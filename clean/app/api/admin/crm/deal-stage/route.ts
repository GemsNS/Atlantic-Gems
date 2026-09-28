import { adminRedirect, readAdminForm } from "@/lib/admin-actions";
import { listDeals, upsertDeal } from "@/lib/crm/store";
import { DEAL_STAGES } from "@/lib/crm/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await readAdminForm(req);
  if (!form) return adminRedirect("/admin/pipeline", { error: "rejected" });
  const dealId = String(form.get("dealId") ?? "");
  const stage = String(form.get("stage") ?? "");
  if (!DEAL_STAGES.some((s) => s.value === stage)) {
    return adminRedirect("/admin/pipeline", { error: "invalid-stage" });
  }
  const deals = await listDeals();
  const deal = deals.find((d) => d.id === dealId);
  if (!deal) return adminRedirect("/admin/pipeline", { error: "deal-not-found" });
  await upsertDeal({
    ...deal,
    stage: stage as (typeof DEAL_STAGES)[number]["value"],
    updatedAt: new Date().toISOString(),
  });
  return adminRedirect("/admin/pipeline", { msg: "stage-updated" });
}
