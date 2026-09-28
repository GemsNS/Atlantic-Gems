import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { AdminShell } from "@/components/admin/AdminShell";
import { listParts } from "@/lib/parts/store";
import { PART_CATEGORIES } from "@/lib/parts/types";
import { totalsByCurrency } from "@/lib/crm/types";
import { formatMoney } from "@/lib/format";
import { PartCard } from "@/components/parts/PartCard";
import { stockTone } from "@/lib/parts/visuals";

export const metadata: Metadata = { title: "Parts inventory", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminPartsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";
  const parts = await listParts();
  const low = parts.filter((p) => stockTone(p.stockQty, p.reorderPoint) !== "ok");
  // Stock value per currency; CAD and USD lines are never added together.
  const priced = totalsByCurrency(
    parts.map((p) => ({ qty: p.stockQty, unitPrice: p.price, currency: p.currency })),
  );
  const values = priced.length > 0 ? priced : [{ currency: "CAD" as const, amount: 0 }];
  const trays = new Set(parts.map((p) => p.category)).size;
  const demoLines = parts.filter((p) => p.demo).length;

  return (
    <AdminShell csrf={csrf} title="Parts inventory" msg={one(params.msg)} error={one(params.error)}>
      <p className="lede">
        The catalogue behind the parts storefront. Lines at or below their reorder point create
        follow-up tasks.
      </p>

      <ul className="shop-stats" aria-label="Parts inventory at a glance">
        <li>
          <b>{parts.length}</b>
          <span>lines</span>
        </li>
        <li>
          <b>{demoLines}</b>
          <span>demo lines</span>
        </li>
        <li>
          <b>{low.length}</b>
          <span>at reorder</span>
        </li>
        <li>
          <b>{trays}</b>
          <span>of {PART_CATEGORIES.length} trays</span>
        </li>
        {values.map((v) => (
          <li key={v.currency}>
            <b>{formatMoney(v.amount, v.currency)}</b>
            <span>stock at list</span>
          </li>
        ))}
      </ul>

      <div className="admin-panels">
        <div className="aside-card" style={{ gridColumn: "1 / -1" }}>
          <h3>Demo catalogue</h3>
          {demoLines > 0 ? (
            <>
              <p>
                {demoLines === parts.length
                  ? "Every line here is a demo listing"
                  : `${demoLines} of ${parts.length} lines are demo listings`}{" "}
                from the seed catalogue: placeholder SKUs, brands and prices, marked “Demo” on the
                public counter. A line counts as demo unless it is saved with <code>demo</code> set
                to false.
              </p>
              <p>
                Retiring deletes every demo line. The seed catalogue is not written back afterwards,
                so a tray with nothing left asks customers to send a reference or a photograph
                instead. Quotes already received keep their lines, and a customer&apos;s tray lists
                a retired line as no longer on the counter. This cannot be undone from here.
              </p>
              <form
                action="/api/admin/parts/retire-demo"
                method="post"
                style={{ display: "grid", gap: 12, justifyItems: "start" }}
              >
                <input type="hidden" name="csrf" value={csrf} />
                <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input type="checkbox" name="confirm" value="on" required />
                  I understand the demo lines will be removed from the public counter
                </label>
                <button className="btn btn-primary" type="submit">
                  Retire {demoLines === 1 ? "1 demo line" : `${demoLines} demo lines`}
                </button>
              </form>
            </>
          ) : (
            <p>
              No demo lines are left. The seed catalogue is written only when there is no parts
              file yet, so it does not come back on its own.
            </p>
          )}
        </div>
      </div>

      {low.length > 0 ? (
        <div className="shop-head" style={{ marginTop: 34 }}>
          <div>
            <span className="shop-head-n">Attention</span>
            <h2>At or below reorder point</h2>
            <p>These lines need ordering before the next job hits the bench.</p>
          </div>
        </div>
      ) : null}
      {low.length > 0 ? (
        <div className="part-grid">
          {low.map((p) => (
            <PartCard key={p.id} part={p} variant="admin" />
          ))}
        </div>
      ) : null}

      <div className="shop-head" style={{ marginTop: 40 }}>
        <div>
          <span className="shop-head-n">Catalogue</span>
          <h2>All lines</h2>
          <p>Card links open the public page in a new tab.</p>
        </div>
        <Link href="/parts" target="_blank" rel="noopener" className="btn btn-ghost btn-small">
          Open the storefront
        </Link>
      </div>
      {parts.length === 0 ? (
        <p className="muted">
          The catalogue is empty. The public counter asks customers to send a reference or a
          photograph instead.
        </p>
      ) : (
        <div className="part-grid">
          {parts.map((p) => (
            <PartCard key={p.id} part={p} variant="admin" />
          ))}
        </div>
      )}
    </AdminShell>
  );
}
