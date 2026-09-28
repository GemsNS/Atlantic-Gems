import { adminRedirect, readAdminForm } from "@/lib/admin-actions";
import { refreshFollowUps } from "@/lib/crm/followups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await readAdminForm(req);
  if (!form) return adminRedirect("/admin/follow-ups", { error: "rejected" });
  const created = await refreshFollowUps();
  return adminRedirect("/admin/follow-ups", {
    msg: created.length ? `tasks-created:${created.length}` : "no-tasks",
  });
}
