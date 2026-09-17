import type { Metadata } from "next";
import { headers } from "next/headers";
import { AdminShell } from "@/components/admin/AdminShell";
import { listContacts } from "@/lib/crm/store";

export const metadata: Metadata = { title: "Accounts", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminAccountsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";
  const contacts = await listContacts();

  return (
    <AdminShell csrf={csrf} title="Accounts & contacts" msg={one(params.msg)} error={one(params.error)}>
      <p className="lede">Trade shops and retail leads. Contact-form and cart quotes create contacts here.</p>
      <div className="admin-tablewrap" style={{ marginTop: 24 }}>
        {contacts.length === 0 ? (
          <div className="empty">
            <p>No contacts yet.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Company</th>
                <th>Kind</th>
                <th>Last activity</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.email || "—"}</td>
                  <td>{c.company || "—"}</td>
                  <td>{c.kind}</td>
                  <td>{new Date(c.lastActivityAt).toLocaleString("en-CA")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminShell>
  );
}
