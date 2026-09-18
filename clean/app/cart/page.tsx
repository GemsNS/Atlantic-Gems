import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { requirePage } from "@/lib/require-page";
import { getCart } from "@/lib/cart";
import { listParts } from "@/lib/parts/store";
import { formatMoney } from "@/lib/format";
import { createPaymentIntent } from "@/lib/integrations/payments";
import { getShippingRates } from "@/lib/integrations/shipping";
import { PartPlate } from "@/components/parts/PartPlate";
import { QtyStepper } from "@/components/parts/QtyStepper";
import { NoResultIcon, TrashIcon } from "@/components/shop/Icons";
import { partCategoryLabel } from "@/lib/parts/types";

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
  const err = Array.isArray(params.error) ? params.error[0] : params.error;
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";
  const lines = await getCart();
  const parts = await listParts();
  const rows = lines
    .map((line) => {
      const part = parts.find((p) => p.id === line.partId);
      return part ? { line, part } : null;
    })
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  const subtotal = rows.reduce((sum, r) => sum + (r.part.price ?? 0) * r.line.qty, 0);
  const units = rows.reduce((sum, r) => sum + r.line.qty, 0);
  const unpriced = rows.filter((r) => r.part.price === null).length;
  const pay = await createPaymentIntent({
    amountCents: Math.round(subtotal * 100),
    currency: "CAD",
    quoteId: "preview",
  });
  const ship = await getShippingRates({ postalCode: "" });

  return (
    <>
      <section className="shop-hero">
        <div className="wrap">
          <p className="eyebrow">Parts counter</p>
          <h1>Quote tray</h1>
          <p className="lede">
            Check the lines and the quantities, then send the tray over. We reply with a written
            quotation — nothing is charged here.
            {pay.status === "unconfigured"
              ? " Card payment and live shipping rates appear on this page once they are connected."
              : ""}
          </p>
          {msg ? (
            <div className="form-status ok" role="status" style={{ marginTop: 18, maxWidth: "38rem" }}>
              {msg}
            </div>
          ) : null}
          {err ? (
            <div className="form-status err" role="alert" style={{ marginTop: 18, maxWidth: "38rem" }}>
              {err === "csrf"
                ? "That request expired. Reload the page and try again."
                : "Check the name and email address and try again."}
            </div>
          ) : null}
        </div>
      </section>

      <section className="section" style={{ borderTop: 0 }}>
        <div className="wrap cart-layout">
          <div>
            {rows.length === 0 ? (
              <div className="empty-state">
                <NoResultIcon />
                <h3>The tray is empty</h3>
                <p>
                  Add lines from any tray on the counter. Quantities can be changed here before you
                  send the request.
                </p>
                <div className="empty-actions">
                  <Link href="/parts" className="btn btn-primary">
                    Browse the counter
                  </Link>
                  <Link href="/contact" className="btn btn-ghost">
                    Ask for an unlisted part
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="cart-sheet">
                  <div className="cart-sheet-head" aria-hidden="true">
                    <span />
                    <span>Line</span>
                    <span>Quantity</span>
                    <span>Amount</span>
                    <span />
                  </div>
                  {rows.map(({ line, part }) => (
                    <article key={part.id} className="cart-line">
                      <PartPlate category={part.category} size="sm" seed={part.sku} />
                      <div>
                        <h2 className="cart-line-title">
                          <Link href={`/parts/item/${part.id}`}>{part.title}</Link>
                        </h2>
                        <p className="cart-line-meta">
                          <span className="sku">{part.sku}</span>
                          <span>{partCategoryLabel(part.category)}</span>
                          <span>Pack {part.packSize}</span>
                          {part.demo ? <span>Demo price</span> : null}
                        </p>
                      </div>
                      <form action="/api/cart/update" method="post" className="cart-qty-form">
                        <input type="hidden" name="csrf" value={csrf} />
                        <input type="hidden" name="partId" value={part.id} />
                        <input type="hidden" name="intent" value="set" />
                        <QtyStepper label={`Quantity of ${part.title}`} initial={line.qty} />
                        <button type="submit" className="btn-link">
                          Update
                        </button>
                      </form>
                      <p className="cart-line-price">
                        {formatMoney(part.price === null ? null : part.price * line.qty, part.currency)}
                        {part.price !== null ? (
                          <small>{formatMoney(part.price, part.currency)} each</small>
                        ) : null}
                      </p>
                      <form action="/api/cart/update" method="post">
                        <input type="hidden" name="csrf" value={csrf} />
                        <input type="hidden" name="partId" value={part.id} />
                        <input type="hidden" name="intent" value="remove" />
                        <button
                          type="submit"
                          className="cart-line-remove"
                          aria-label={`Remove ${part.title} from the tray`}
                        >
                          <TrashIcon />
                        </button>
                      </form>
                    </article>
                  ))}

                  <div className="cart-totals">
                    <p className="cart-total-row">
                      <span>
                        {rows.length} {rows.length === 1 ? "line" : "lines"} · {units}{" "}
                        {units === 1 ? "unit" : "units"}
                      </span>
                      <span>{formatMoney(subtotal, "CAD")}</span>
                    </p>
                    <p className="cart-total-row">
                      <span>Shipping</span>
                      <span>{ship.status === "unconfigured" ? "Quoted with the reply" : "Calculated"}</span>
                    </p>
                    {unpriced > 0 ? (
                      <p className="cart-total-row">
                        <span>
                          {unpriced} {unpriced === 1 ? "line is" : "lines are"} priced on request
                        </span>
                        <span>—</span>
                      </p>
                    ) : null}
                    <p className="cart-total-row is-sum">
                      <span>Estimated subtotal</span>
                      <strong>{formatMoney(subtotal, "CAD")}</strong>
                    </p>
                  </div>
                </div>

                <div className="cart-foot">
                  <form action="/api/cart/clear" method="post">
                    <input type="hidden" name="csrf" value={csrf} />
                    <button className="btn btn-ghost btn-small" type="submit">
                      Empty the tray
                    </button>
                  </form>
                  <Link href="/parts" className="link">
                    Keep adding from the counter
                  </Link>
                </div>
              </>
            )}
          </div>

          <aside className="cart-quote">
            <h2>Request a quote</h2>
            <p>
              We open a quote against your details and reply by email.
              {ship.status === "unconfigured" ? " Shipping is quoted with the reply." : ""}
            </p>
            <form action="/api/cart/checkout" method="post" className="admin-form">
              <input type="hidden" name="csrf" value={csrf} />
              <label>
                Name
                <input name="name" required maxLength={120} autoComplete="name" />
              </label>
              <label>
                Email
                <input name="email" type="email" required maxLength={200} autoComplete="email" />
              </label>
              <label>
                Company (optional)
                <input name="company" maxLength={120} autoComplete="organization" />
              </label>
              <label>
                Notes
                <textarea name="notes" rows={4} maxLength={2000} placeholder="Job numbers, sizes, urgency…" />
              </label>
              <button className="btn btn-primary" type="submit" disabled={rows.length === 0}>
                Send the tray for quotation
              </button>
            </form>
            <ol className="cart-steps">
              <li>You send the tray with your details.</li>
              <li>We confirm stock, lead times and trade pricing.</li>
              <li>A written quotation comes back by email, valid 7 days.</li>
            </ol>
          </aside>
        </div>
      </section>
    </>
  );
}
