import { adminRedirect, readAdminForm } from "@/lib/admin-actions";
import { listDeals, upsertDeal } from "@/lib/crm/store";
import { DEAL_STAGES } from "@/lib/crm/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await readAdminForm(req);
  if (!form) return adminRedirect(req, "/admin/pipeline", undefined, "Request rejected.");
  const dealId = String(form.get("dealId") ?? "");
  const stage = String(form.get("stage") ?? "");
  if (!DEAL_STAGES.some((s) => s.value === stage)) {
    return adminRedirect(req, "/admin/pipeline", undefined, "Invalid stage.");
  }
  const deals = await listDeals();
  const deal = deals.find((d) => d.id === dealId);
  if (!deal) return adminRedirect(req, "/admin/pipeline", undefined, "Deal not found.");
  await upsertDeal({
    ...deal,
    stage: stage as (typeof DEAL_STAGES)[number]["value"],
    updatedAt: new Date().toISOString(),
  });
  return adminRedirect(req, "/admin/pipeline", "Stage updated.");
}
