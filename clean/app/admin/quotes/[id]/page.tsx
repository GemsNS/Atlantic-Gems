import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getContact, getQuote } from "@/lib/crm/store";
import {
  QUOTE_STATUSES,
  notificationLabel,
  quoteReference,
  totalsByCurrency,
} from "@/lib/crm/types";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Quote", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

const when = (iso: string) => new Date(iso).toLocaleString("en-CA");

export default async function AdminQuoteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const quote = await getQuote(id);
  if (!quote) notFound();
  const contact = quote.contactId ? await getContact(quote.contactId) : null;
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";
  const reference = quoteReference(quote.id);
  const totals = totalsByCurrency(quote.lines, quote.currency);
  const onRequest = quote.lines.filter((l) => l.unitPrice == null).length;
  // Lines quoted from demo listings: their unit prices are seed placeholders.
  const demoLines = quote.lines.filter((l) => l.demo).length;
  const n = quote.notification;
  const replySubject = `Your quote request ${reference}`;

  return (
    <AdminShell
      csrf={csrf}
      title={`Quote ${reference}`}
      msg={one(sp.msg)}
      error={one(sp.error)}
    >
      <p style={{ marginBottom: 20 }}>
        <Link href="/admin/quotes" className="link">
          All quotes
        </Link>
      </p>

      <div className="admin-panels">
        <div className="aside-card">
          <h3>Customer</h3>
          <p>
            <strong>{quote.customerName || contact?.name || "—"}</strong>
            {contact?.company ? (
              <>
                <br />
                {contact.company}
              </>
            ) : null}
            <br />
            {quote.customerEmail ? (
              <a href={`mailto:${quote.customerEmail}?subject=${encodeURIComponent(replySubject)}`}>
                {quote.customerEmail}
              </a>
            ) : (
              <span className="muted">No email on file</span>
            )}
          </p>
          {contact ? (
            <p className="muted">
              {contact.kind === "trade" ? "Trade" : contact.kind === "retail" ? "Retail" : "Other"}{" "}
              contact since {new Date(contact.createdAt).toLocaleDateString("en-CA")}
            </p>
          ) : null}
        </div>

        <div className="aside-card">
          <h3>Status</h3>
          <form action="/api/admin/crm/quote-status" method="post">
            <input type="hidden" name="csrf" value={csrf} />
            <input type="hidden" name="quoteId" value={quote.id} />
            <label className="sr-only" htmlFor="quote-status">
              Quote status
            </label>
            <select id="quote-status" name="status" defaultValue={quote.status}>
              {QUOTE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>{" "}
            <button className="btn btn-ghost btn-small" type="submit">
              Update
            </button>
          </form>
          <p className="muted" style={{ marginTop: 10 }}>
            Received {when(quote.createdAt)}
            <br />
            Updated {when(quote.updatedAt)}
          </p>
        </div>

        <div className="aside-card">
          <h3>House notification</h3>
          <p>
            <strong>{notificationLabel(n)}</strong>
            {n ? <> · {when(n.at)}</> : null}
          </p>
          <p className="muted">
            {!n
              ? "This quote was saved before notifications were recorded."
              : n.status === "pending"
                ? "The notification result was not recorded, so nobody may have been told. Check the server log for [quote] lines and reply from here."
                : n.status === "sent"
                  ? "The request was emailed or posted to the webhook."
                  : n.status === "failed"
                    ? "The mail provider or webhook refused it. Nobody was told; reply from here."
                    : "No email or webhook is configured, so this page is the only record."}
          </p>
        </div>
      </div>

      <h2 style={{ fontSize: "1.3rem", margin: "8px 0 12px" }}>Lines</h2>
      {demoLines > 0 ? (
        <p style={{ margin: "0 0 12px", maxWidth: "60rem" }}>
          <span className="flag flag-demo">Demo prices</span>{" "}
          {demoLines === quote.lines.length
            ? quote.lines.length === 1
              ? "The line comes from a demo listing."
              : "Every line comes from a demo listing."
            : demoLines === 1
              ? `1 of ${quote.lines.length} lines comes from a demo listing.`
              : `${demoLines} of ${quote.lines.length} lines come from demo listings.`}{" "}
          Marked unit prices are placeholders, not confirmed prices. Set the real price of each
          marked line before you quote.
        </p>
      ) : null}
      <div className="admin-tablewrap">
        {quote.lines.length === 0 ? (
          <div className="empty">
            <p>This quote has no lines.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Line</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {quote.lines.map((l, i) => {
                const currency = l.currency ?? quote.currency;
                return (
                  <tr key={`${l.sku}-${i}`}>
                    <td className="sku">{l.sku || "—"}</td>
                    <td>
                      {l.partId ? <Link href={`/parts/item/${l.partId}`}>{l.title}</Link> : l.title}
                    </td>
                    <td>{l.qty}</td>
                    <td>
                      {formatMoney(l.unitPrice, currency)}
                      {l.demo ? (
                        <div>
                          <span className="flag flag-demo">Demo price</span>
                        </div>
                      ) : null}
                    </td>
                    <td>{formatMoney(l.unitPrice == null ? null : l.unitPrice * l.qty, currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <p style={{ margin: "14px 0 28px" }}>
        <strong>Estimated from listed prices: </strong>
        {totals.length === 0
          ? "every line is priced on request"
          : totals.map((t) => formatMoney(t.amount, t.currency)).join(" + ")}
        {totals.length > 0 && onRequest > 0 ? (
          <span className="muted">
            {" "}
            (plus {onRequest} {onRequest === 1 ? "line" : "lines"} priced on request)
          </span>
        ) : null}
        {quote.lines.some((l) => l.demo && l.unitPrice != null) ? (
          <span className="muted"> Includes demo placeholder prices.</span>
        ) : null}
      </p>

      <h2 style={{ fontSize: "1.3rem", margin: "8px 0 12px" }}>Customer notes</h2>
      {quote.notes ? (
        <p style={{ whiteSpace: "pre-wrap", maxWidth: "60rem" }}>{quote.notes}</p>
      ) : (
        <p className="muted">No notes.</p>
      )}
    </AdminShell>
  );
}
