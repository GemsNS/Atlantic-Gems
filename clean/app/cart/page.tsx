import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Suspense } from "react";
import { requirePage } from "@/lib/require-page";
import { cartAvailable, getCart, resolveCart } from "@/lib/cart";
import { listParts } from "@/lib/parts/store";
import { formatMoney } from "@/lib/format";
import { paymentsConfigured } from "@/lib/integrations/payments";
import { shippingConfigured } from "@/lib/integrations/shipping";
import { QUOTE_REFERENCE_PATTERN, totalsByCurrency } from "@/lib/crm/types";
import { site } from "@/lib/site";
import { PartMedia } from "@/components/parts/PartMedia";
import { QtyStepper } from "@/components/parts/QtyStepper";
import { CartQuoteForm } from "@/components/parts/CartQuoteForm";
import { FocusOnArrival } from "@/components/FocusOnArrival";
import { CartSkeleton } from "@/components/SectionSkeleton";
import { NoResultIcon, TrashIcon } from "@/components/shop/Icons";
import { partCategoryLabel } from "@/lib/parts/types";

export const metadata: Metadata = {
  title: "Quote cart",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Fixed copy for every status the cart routes can send back; the URL never supplies text. */
const ERRORS: Record<string, string> = {
  // The route that refused the post set a fresh token, so this page already works.
  csrf: "That did not go through because the page had been open a long time. The page is ready now: add the part, change the line or send the tray again.",
  fields: "Check the name and email address and send the tray again.",
  empty: "There is nothing in the tray that can be quoted yet.",
  rate: `Several requests have come from here in a short time. Please wait a few minutes and try again, or email ${site.email}.`,
  store: `We could not save your request just now. Your tray is still here — try again in a moment, or email ${site.email}.`,
  unavailable: `The quote tray is not available right now. Please email the parts you need to ${site.email}.`,
};

/**
 * Visibility and status checks run first; the tray itself streams behind a
 * skeleton. `notFound()` must stay above the `<Suspense>` boundary so a
 * switched-off counter is a real 404, not a 200 (plan item U6).
 */
export default async function CartPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePage("parts");
  const params = searchParams ? await searchParams : {};
  const sentRaw = Array.isArray(params.sent) ? params.sent[0] : params.sent;
  const sent = sentRaw && QUOTE_REFERENCE_PATTERN.test(sentRaw) ? sentRaw : null;
  const errRaw = Array.isArray(params.error) ? params.error[0] : params.error;
  const trayOff = !cartAvailable();
  // Own keys only: `__proto__` or `constructor` would otherwise reach
  // Object.prototype and break the page.
  const err = trayOff
    ? ERRORS.unavailable!
    : errRaw && Object.hasOwn(ERRORS, errRaw)
      ? ERRORS[errRaw]!
      : null;
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";
  const payLive = paymentsConfigured();

  return (
    <>
      <section className="shop-hero">
        <div className="wrap">
          <p className="eyebrow">Parts counter</p>
          <h1>Quote tray</h1>
          <p className="lede">
            Check the lines and the quantities, then send the tray over. We reply with a written
            quotation — nothing is charged here.
            {!payLive
              ? " Card payment and live shipping rates appear on this page once they are connected."
              : ""}
          </p>
          {sent ? (
            <FocusOnArrival className="form-status ok" role="status" style={{ marginTop: 18, maxWidth: "38rem" }}>
              <strong>Tray received — reference {sent}.</strong> We will reply by email with a
              written quotation. Quote the reference if you write to us about it.
            </FocusOnArrival>
          ) : null}
          {err && !sent ? (
            <FocusOnArrival className="form-status err" role="alert" style={{ marginTop: 18, maxWidth: "38rem" }}>
              {err}
            </FocusOnArrival>
          ) : null}
        </div>
      </section>

      <section className="section" style={{ borderTop: 0 }}>
        <Suspense fallback={<CartSkeleton />}>
          <CartBody csrf={csrf} trayOff={trayOff} />
        </Suspense>
      </section>
    </>
  );
}

async function CartBody({ csrf, trayOff }: { csrf: string; trayOff: boolean }) {
  const lines = await getCart();
  const parts = await listParts();
  const { rows, unavailable } = resolveCart(lines, parts);

  // CAD and USD lines are never added together; one subtotal per currency.
  const priced = totalsByCurrency(
    rows.map((r) => ({ qty: r.line.qty, unitPrice: r.part.price, currency: r.part.currency })),
  );
  // Every line priced on request: no figure at all, never "CAD 0.00".
  const onRequestOnly = priced.length === 0;
  const totals = priced;
  const mixed = totals.length > 1;
  const units = rows.reduce((sum, r) => sum + r.line.qty, 0);
  const unpriced = rows.filter((r) => r.part.price === null).length;
  // Demo listings are priced from seed data, so the subtotal says so.
  const demoPriced = rows.filter((r) => r.part.demo && r.part.price !== null).length;
  const shipLive = shippingConfigured();

  return (
    <div className="wrap cart-layout">
      <div>
        {unavailable.length > 0 ? (
          <div className="form-status err cart-unavailable" role="status">
            <p>
              {unavailable.length === 1 ? "One line is" : `${unavailable.length} lines are`} no
              longer on the counter and will not be quoted:
            </p>
            <ul>
              {unavailable.map(({ line, title }) => (
                <li key={line.partId}>
                  <span>{title ?? "A line that has been withdrawn"}</span>
                  <form action="/api/cart/update" method="post">
                    <input type="hidden" name="csrf" value={csrf} />
                    <input type="hidden" name="partId" value={line.partId} />
                    <input type="hidden" name="intent" value="remove" />
                    <button
                      type="submit"
                      className="btn-link"
                      aria-label={`Remove ${title ?? "the withdrawn line"} from the tray`}
                    >
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
            <p>
              <Link href={`/contact?brief=${encodeURIComponent("Replacement for a withdrawn line")}`}>
                Ask us about a replacement
              </Link>
            </p>
          </div>
        ) : null}
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
                  <PartMedia category={part.category} artKey={part.art} seed={part.sku} size="sm" alt={part.title} />
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
                  <span>
                    {onRequestOnly
                      ? "Priced on request"
                      : mixed
                        ? ""
                        : formatMoney(totals[0]!.amount, totals[0]!.currency)}
                  </span>
                </p>
                <p className="cart-total-row">
                  <span>Shipping</span>
                  <span>{shipLive ? "Calculated" : "Quoted with the reply"}</span>
                </p>
                {unpriced > 0 ? (
                  <p className="cart-total-row">
                    <span>
                      {unpriced} {unpriced === 1 ? "line is" : "lines are"} priced on request
                    </span>
                    <span>—</span>
                  </p>
                ) : null}
                {onRequestOnly ? (
                  <p className="cart-total-row is-sum">
                    <span>Estimated subtotal</span>
                    <strong>Priced on request</strong>
                  </p>
                ) : null}
                {totals.map((t) => (
                  <p key={t.currency} className="cart-total-row is-sum">
                    <span>
                      Estimated subtotal{mixed ? `, ${t.currency} lines` : ""}
                    </span>
                    <strong>{formatMoney(t.amount, t.currency)}</strong>
                  </p>
                ))}
                {mixed ? (
                  <p className="cart-total-row">
                    <span>CAD and USD lines are totalled separately.</span>
                    <span />
                  </p>
                ) : null}
                {demoPriced > 0 ? (
                  <p className="cart-total-row">
                    <span>
                      {demoPriced === 1
                        ? "The line marked “Demo price” carries a placeholder price."
                        : "Lines marked “Demo price” carry placeholder prices."}{" "}
                      The written quotation confirms the real price.
                    </span>
                    <span />
                  </p>
                ) : null}
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
          {shipLive ? "" : " Shipping is quoted with the reply."}
        </p>
        <CartQuoteForm csrf={csrf} disabled={rows.length === 0 || trayOff} />
        <ol className="cart-steps">
          <li>You send the tray with your details.</li>
          <li>We confirm stock, lead times and trade pricing.</li>
          <li>A written quotation comes back by email, valid 7 days.</li>
        </ol>
      </aside>
    </div>
  );
}
