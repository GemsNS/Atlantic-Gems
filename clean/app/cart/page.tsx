import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { requirePage } from "@/lib/require-page";
import { getCart } from "@/lib/cart";
import { getPart } from "@/lib/parts/store";
import { formatMoney } from "@/lib/format";
import { createPaymentIntent } from "@/lib/integrations/payments";
import { getShippingRates } from "@/lib/integrations/shipping";
import { PartPlate } from "@/components/parts/PartPlate";

export const metadata: Metadata = {
  title: "Quote cart",
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
      <section className="parts-hero" style={{ paddingBottom: 40 }}>
        <div className="wrap">
          <p className="eyebrow">Parts</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.4rem, 5vw, 3.6rem)", fontWeight: 500, margin: "8px 0 12px" }}>
            Quote cart
          </h1>
          <p className="lede" style={{ maxWidth: "36rem" }}>
            Review the tray, then send a quote request.{" "}
            {pay.status === "unconfigured"
              ? "Card payment and live shipping rates appear here when connected."
              : null}
          </p>
          {msg ? (
            <div className="form-status ok" role="status" style={{ marginTop: 16, maxWidth: "36rem" }}>
              {msg}
            </div>
          ) : null}
        </div>
      </section>

      <section className="section">
        <div className="wrap cart-layout">
          <div>
            {rows.length === 0 ? (
              <div className="cart-empty">
                <PartPlate category="tools" size="sm" />
                <p>Your cart is empty.</p>
                <Link href="/parts" className="btn btn-primary">
                  Browse parts
                </Link>
              </div>
            ) : (
              <>
                <div className="cart-lines">
                  {rows.map(({ line, part }) => (
                    <article key={part.id} className="cart-line">
                      <PartPlate category={part.category} size="sm" />
                      <div>
                        <h3 className="cart-line-title">
                          <Link href={`/parts/item/${part.id}`}>{part.title}</Link>
                        </h3>
                        <p className="cart-line-meta">
                          {part.sku} · Qty {line.qty} · Pack {part.packSize}
                        </p>
                      </div>
                      <p className="cart-line-price">
                        {formatMoney(
                          part.price == null ? null : part.price * line.qty,
                          part.currency,
                        )}
                      </p>
                    </article>
                  ))}
                </div>
                <div className="cart-subtotal">
                  <span>Estimated subtotal</span>
                  <strong>{formatMoney(subtotal, "CAD")}</strong>
                </div>
                <form action="/api/cart/clear" method="post" style={{ marginTop: 14 }}>
                  <input type="hidden" name="csrf" value={csrf} />
                  <button className="btn btn-ghost btn-small" type="submit">
                    Clear cart
                  </button>
                </form>
              </>
            )}
          </div>

          <aside className="cart-quote">
            <h2>Request a quote</h2>
            <p>
              We create a CRM quote and reply by email.
              {ship.status === "unconfigured" ? " Shipping rates are not connected yet." : ""}
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
                <textarea name="notes" rows={4} maxLength={2000} placeholder="Job numbers, sizes, urgency…" />
              </label>
              <button className="btn btn-primary" type="submit" disabled={rows.length === 0}>
                Submit quote request
              </button>
            </form>
          </aside>
        </div>
      </section>
    </>
  );
}
