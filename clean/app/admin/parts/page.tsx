import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { AdminShell } from "@/components/admin/AdminShell";
import { listParts } from "@/lib/parts/store";
import { partCategoryLabel } from "@/lib/parts/types";
import { formatMoney } from "@/lib/format";
import { PartPlate } from "@/components/parts/PartPlate";
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

  return (
    <AdminShell csrf={csrf} title="Parts inventory" msg={one(params.msg)} error={one(params.error)}>
      <p className="lede">
        Demo seed catalogue for the parts storefront. Low-stock lines create follow-up tasks.
      </p>
      <div className="part-grid" style={{ marginTop: 28 }}>
        {parts.map((p) => {
          const tone = stockTone(p.stockQty, p.reorderPoint);
          return (
            <article key={p.id} className="part-card" style={tone === "low" || tone === "out" ? { borderColor: "rgba(166,21,47,0.35)" } : undefined}>
              <div className="part-card-media">
                <PartPlate category={p.category} size="md" />
                <span className={`part-chip part-chip-stock is-${tone}`}>{p.stockQty} on hand</span>
              </div>
              <div className="part-card-body">
                <p className="part-card-meta">
                  <span>{partCategoryLabel(p.category)}</span>
                  <span className="part-card-sku">{p.sku}</span>
                </p>
                <h3 className="part-card-title">{p.title}</h3>
                <div className="part-card-foot">
                  <p className="part-card-price">{formatMoney(p.price, p.currency)}</p>
                  <span className="part-card-pack">{p.visibility}</span>
                </div>
                <Link href={`/parts/item/${p.id}`} target="_blank" rel="noopener" className="link" style={{ marginTop: 8 }}>
                  View public page
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </AdminShell>
  );
}
