import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { listQuotes } from "@/lib/crm/store";
import {
  QUOTE_STATUSES,
  normaliseQuoteReference,
  quoteReference,
  notificationLabel,
  totalsByCurrency,
} from "@/lib/crm/types";
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
  const all = await listQuotes();

  // Reference lookup: what the customer quotes back to us by email.
  const refRaw = (one(params.ref) ?? "").trim();
  const ref = refRaw ? normaliseQuoteReference(refRaw) : null;
  const quotes = ref ? all.filter((q) => quoteReference(q.id) === ref) : all;
  if (ref && quotes.length === 1) redirect(`/admin/quotes/${quotes[0]!.id}`);
  const lookupError = refRaw && !ref ? "A reference is Q- followed by six letters or digits." : undefined;

  return (
    <AdminShell
      csrf={csrf}
      title="Quotes"
      msg={one(params.msg)}
      error={one(params.error)}
      problem={lookupError}
    >
      <form action="/admin/quotes" method="get" className="admin-lookup" role="search">
        <label>
          Find by reference
          <input
            name="ref"
            defaultValue={refRaw}
            placeholder="Q-7KX2MP"
            maxLength={12}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <button className="btn btn-ghost btn-small" type="submit">
          Find
        </button>
        {refRaw ? (
          <Link href="/admin/quotes" className="link">
            Show all
          </Link>
        ) : null}
      </form>

      <div className="admin-tablewrap">
        {quotes.length === 0 ? (
          <div className="empty">
            <p>
              {ref
                ? `No quote has the reference ${ref}. Check the characters with the customer.`
                : "No quotes yet. Cart checkout creates quote requests here."}
            </p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Lines</th>
                <th>Est. total</th>
                <th>Notified</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => {
                const totals = totalsByCurrency(q.lines, q.currency);
                // Demo listings carry placeholder prices, so the estimate is not one to quote.
                const demoLines = q.lines.filter((l) => l.demo).length;
                return (
                  <tr key={q.id}>
                    <td>
                      <Link href={`/admin/quotes/${q.id}`} className="sku">
                        {quoteReference(q.id)}
                      </Link>
                    </td>
                    <td>
                      {q.customerName || "—"}
                      <div className="muted" style={{ fontSize: "0.85rem" }}>
                        {q.customerEmail}
                      </div>
                    </td>
                    <td>{QUOTE_STATUSES.find((s) => s.value === q.status)?.label ?? q.status}</td>
                    <td>
                      {q.lines.length}
                      {demoLines > 0 ? (
                        <div className="muted" style={{ fontSize: "0.85rem" }}>
                          {demoLines === q.lines.length ? "all demo" : `${demoLines} demo`}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      {totals.length === 0
                        ? "On request"
                        : totals.map((t) => (
                            <div key={t.currency}>{formatMoney(t.amount, t.currency)}</div>
                          ))}
                      {demoLines > 0 ? <span className="flag flag-demo">Demo prices</span> : null}
                    </td>
                    <td>{notificationLabel(q.notification)}</td>
                    <td>{new Date(q.createdAt).toLocaleString("en-CA")}</td>
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
