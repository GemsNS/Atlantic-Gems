import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { requirePage } from "@/lib/require-page";
import { getCart } from "@/lib/cart";
import { getPart } from "@/lib/parts/store";
import { formatMoney } from "@/lib/format";
import { createPaymentIntent } from "@/lib/integrations/payments";
import { getShippingRates } from "@/lib/integrations/shipping";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CartPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePage("parts");
  const params = searchParams ? await searchParams : {};
  const msg = Array.isArray(params.msg) ? params.msg[0] : params.msg;
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";
  const lines = await getCart();
  const rows = (
    await Promise.all(
      lines.map(async (l) => {
        const part = await getPart(l.partId);
        return part ? { line: l, part } : null;
      }),
    )
  ).filter((r): r is NonNullable<typeof r> => Boolean(r));

  const subtotal = rows.reduce((sum, r) => sum + (r.part.price ?? 0) * r.line.qty, 0);
  const pay = await createPaymentIntent({
    amountCents: Math.round(subtotal * 100),
    currency: "CAD",
    quoteId: "preview",
  });
  const ship = await getShippingRates({ postalCode: "" });

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">Parts</p>
          <h1>Cart</h1>
          <p className="lede">
            Review lines and request a written quote.{" "}
            {pay.status === "unconfigured"
              ? "Card payment and live shipping rates will appear here when connected."
              : null}
          </p>
          {msg ? (
            <div className="form-status ok" role="status" style={{ marginTop: 16 }}>
              {msg}
            </div>
          ) : null}
        </div>
      </section>
      <section className="section">
        <div className="wrap two-col">
          <div>
            {rows.length === 0 ? (
              <div className="empty">
                <p>Your cart is empty.</p>
                <Link href="/parts" className="btn btn-primary">
                  Browse parts
                </Link>
              </div>
            ) : (
              <div className="admin-tablewrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ line, part }) => (
                      <tr key={part.id}>
                        <td>
                          <Link href={`/parts/item/${part.id}`}>{part.title}</Link>
                          <div className="muted" style={{ fontSize: "0.85rem" }}>
                            {part.sku}
                          </div>
                        </td>
                        <td>{line.qty}</td>
                        <td>{formatMoney(part.price, part.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ marginTop: 16 }}>
                  <strong>Estimated subtotal:</strong> {formatMoney(subtotal, "CAD")}
                </p>
                <form action="/api/cart/clear" method="post" style={{ marginTop: 12 }}>
                  <input type="hidden" name="csrf" value={csrf} />
                  <button className="btn btn-ghost btn-small" type="submit">
                    Clear cart
                  </button>
                </form>
              </div>
            )}
          </div>
          <div className="aside-card">
            <h3>Request a quote</h3>
            <p>
              We will create a CRM quote and reply by email.{" "}
              {ship.status === "unconfigured" ? "Shipping rates: not connected yet." : null}
            </p>
            <form action="/api/cart/checkout" method="post" className="admin-form">
              <input type="hidden" name="csrf" value={csrf} />
              <label>
                Name
                <input name="name" required maxLength={120} />
              </label>
              <label>
                Email
                <input name="email" type="email" required maxLength={200} />
              </label>
              <label>
                Company (optional)
                <input name="company" maxLength={120} />
              </label>
              <label>
                Notes
                <textarea name="notes" rows={4} maxLength={2000} />
              </label>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={rows.length === 0}
              >
                Submit quote request
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
