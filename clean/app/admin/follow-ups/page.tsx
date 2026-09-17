import type { Metadata } from "next";
import { headers } from "next/headers";
import { AdminShell } from "@/components/admin/AdminShell";
import { listTasks } from "@/lib/crm/store";
import { refreshFollowUps } from "@/lib/crm/followups";

export const metadata: Metadata = { title: "Follow-ups", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminFollowUpsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";
  await refreshFollowUps();
  const tasks = await listTasks();

  return (
    <AdminShell csrf={csrf} title="Follow-ups" msg={one(params.msg)} error={one(params.error)}>
      <p className="lede">
        Deterministic tasks from stale quotes (7+ days) and parts below reorder point. No auto-email
        until mail delivery is configured.
      </p>
      <form action="/api/admin/crm/refresh-followups" method="post" style={{ margin: "16px 0" }}>
        <input type="hidden" name="csrf" value={csrf} />
        <button className="btn btn-ghost btn-small" type="submit">
          Refresh now
        </button>
      </form>
      <div className="admin-tablewrap">
        {tasks.length === 0 ? (
          <div className="empty">
            <p>No tasks.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Due</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{t.status}</td>
                  <td>{t.dueAt ? new Date(t.dueAt).toLocaleString("en-CA") : "—"}</td>
                  <td>
                    {t.status === "open" ? (
                      <form action="/api/admin/crm/task-done" method="post">
                        <input type="hidden" name="csrf" value={csrf} />
                        <input type="hidden" name="taskId" value={t.id} />
                        <button className="btn btn-ghost btn-small" type="submit">
                          Mark done
                        </button>
                      </form>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminShell>
  );
}
