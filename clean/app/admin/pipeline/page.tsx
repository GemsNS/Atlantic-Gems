import type { Metadata } from "next";
import { headers } from "next/headers";
import { AdminShell } from "@/components/admin/AdminShell";
import { listContacts, listDeals } from "@/lib/crm/store";
import { DEAL_STAGES } from "@/lib/crm/types";

export const metadata: Metadata = { title: "Pipeline", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminPipelinePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";
  const [deals, contacts] = await Promise.all([listDeals(), listContacts()]);
  const byId = new Map(contacts.map((c) => [c.id, c]));

  return (
    <AdminShell csrf={csrf} title="Pipeline" msg={one(params.msg)} error={one(params.error)}>
      <div className="admin-panels">
        {DEAL_STAGES.map((stage) => {
          const column = deals.filter((d) => d.stage === stage.value);
          return (
            <div key={stage.value} className="aside-card">
              <h3>
                {stage.label} ({column.length})
              </h3>
              {column.length === 0 ? (
                <p className="muted">None</p>
              ) : (
                <ul className="points">
                  {column.map((d) => (
                    <li key={d.id}>
                      <strong>{d.title}</strong>
                      <br />
                      <span className="muted">
                        {d.contactId ? byId.get(d.contactId)?.name ?? "Contact" : "No contact"} ·{" "}
                        {d.source}
                      </span>
                      <form action="/api/admin/crm/deal-stage" method="post" style={{ marginTop: 8 }}>
                        <input type="hidden" name="csrf" value={csrf} />
                        <input type="hidden" name="dealId" value={d.id} />
                        <select name="stage" defaultValue={d.stage}>
                          {DEAL_STAGES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <button className="btn btn-ghost btn-small" type="submit">
                          Update
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
