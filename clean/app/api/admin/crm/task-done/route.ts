import { adminRedirect, readAdminForm } from "@/lib/admin-actions";
import { listTasks, upsertTask } from "@/lib/crm/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await readAdminForm(req);
  if (!form) return adminRedirect("/admin/follow-ups", { error: "rejected" });
  const taskId = String(form.get("taskId") ?? "");
  const tasks = await listTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return adminRedirect("/admin/follow-ups", { error: "task-not-found" });
  await upsertTask({ ...task, status: "done", updatedAt: new Date().toISOString() });
  return adminRedirect("/admin/follow-ups", { msg: "task-done" });
}
