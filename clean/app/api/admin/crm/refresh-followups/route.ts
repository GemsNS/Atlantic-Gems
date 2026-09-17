import { adminRedirect, readAdminForm } from "@/lib/admin-actions";
import { refreshFollowUps } from "@/lib/crm/followups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await readAdminForm(req);
  if (!form) return adminRedirect(req, "/admin/follow-ups", undefined, "Request rejected.");
  const created = await refreshFollowUps();
  return adminRedirect(
    req,
    "/admin/follow-ups",
    created.length ? `Created ${created.length} new task(s).` : "No new tasks.",
  );
}
