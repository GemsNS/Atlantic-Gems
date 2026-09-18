import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { AdminShell } from "@/components/admin/AdminShell";
import { listParts } from "@/lib/parts/store";
import { PART_CATEGORIES } from "@/lib/parts/types";
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
  const value = parts.reduce((sum, p) => sum + (p.price ?? 0) * p.stockQty, 0);
  const trays = new Set(parts.map((p) => p.category)).size;

  return (
    <AdminShell csrf={csrf} title="Parts inventory" msg={one(params.msg)} error={one(params.error)}>
      <p className="lede">
        Demo seed catalogue behind the parts storefront. Lines at or below their reorder point create
        follow-up tasks.
      </p>

      <ul className="shop-stats" aria-label="Parts inventory at a glance">
        <li>
          <b>{parts.length}</b>
          <span>lines</span>
        </li>
        <li>
          <b>{low.length}</b>
          <span>at reorder</span>
        </li>
        <li>
          <b>{trays}</b>
          <span>of {PART_CATEGORIES.length} trays</span>
        </li>
        <li>
          <b>{formatMoney(value, "CAD")}</b>
          <span>stock at list</span>
        </li>
      </ul>

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
      <div className="part-grid">
        {parts.map((p) => (
          <PartCard key={p.id} part={p} variant="admin" />
        ))}
      </div>
    </AdminShell>
  );
}
