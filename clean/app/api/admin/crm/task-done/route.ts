import { adminRedirect, readAdminForm } from "@/lib/admin-actions";
import { listTasks, upsertTask } from "@/lib/crm/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await readAdminForm(req);
  if (!form) return adminRedirect(req, "/admin/follow-ups", undefined, "Request rejected.");
  const taskId = String(form.get("taskId") ?? "");
  const tasks = await listTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return adminRedirect(req, "/admin/follow-ups", undefined, "Task not found.");
  await upsertTask({ ...task, status: "done", updatedAt: new Date().toISOString() });
  return adminRedirect(req, "/admin/follow-ups", "Task marked done.");
}
