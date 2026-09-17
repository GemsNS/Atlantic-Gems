import type { Metadata } from "next";
import { headers } from "next/headers";
import { AdminShell } from "@/components/admin/AdminShell";
import { listQuotes } from "@/lib/crm/store";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Quotes", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";
  const quotes = await listQuotes();

  return (
    <AdminShell csrf={csrf} title="Quotes" msg={one(params.msg)} error={one(params.error)}>
      <div className="admin-tablewrap">
        {quotes.length === 0 ? (
          <div className="empty">
            <p>No quotes yet. Cart checkout creates quote requests here.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Status</th>
                <th>Lines</th>
                <th>Est. total</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => {
                const total = q.lines.reduce((s, l) => s + (l.unitPrice ?? 0) * l.qty, 0);
                return (
                  <tr key={q.id}>
                    <td>
                      {q.customerName || "—"}
                      <div className="muted" style={{ fontSize: "0.85rem" }}>
                        {q.customerEmail}
                      </div>
                    </td>
                    <td>{q.status}</td>
                    <td>{q.lines.length}</td>
                    <td>{formatMoney(total, q.currency)}</td>
                    <td>{new Date(q.updatedAt).toLocaleString("en-CA")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AdminShell>
  );
}
