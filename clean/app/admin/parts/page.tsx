import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { AdminShell } from "@/components/admin/AdminShell";
import { listParts } from "@/lib/parts/store";
import { partCategoryLabel } from "@/lib/parts/types";
import { formatMoney } from "@/lib/format";

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
        Demo seed catalogue ships with the parts storefront. Low-stock lines create follow-up tasks.
      </p>
      <div className="admin-tablewrap" style={{ marginTop: 24 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Title</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Price</th>
              <th>Visibility</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p) => (
              <tr key={p.id} style={p.stockQty <= p.reorderPoint ? { background: "rgba(166,21,47,0.06)" } : undefined}>
                <td>{p.sku}</td>
                <td>
                  {p.title}
                  {p.demo ? (
                    <span className="muted" style={{ marginLeft: 6, fontSize: "0.8rem" }}>
                      demo
                    </span>
                  ) : null}
                </td>
                <td>{partCategoryLabel(p.category)}</td>
                <td>
                  {p.stockQty}
                  {p.stockQty <= p.reorderPoint ? " ⚠" : ""}
                </td>
                <td>{formatMoney(p.price, p.currency)}</td>
                <td>{p.visibility}</td>
                <td>
                  <Link href={`/parts/item/${p.id}`} target="_blank" rel="noopener">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
