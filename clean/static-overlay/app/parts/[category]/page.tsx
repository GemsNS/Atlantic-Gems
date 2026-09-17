import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePage } from "@/lib/require-page";
import { PART_CATEGORIES, type PartCategory } from "@/lib/parts/types";
import { listPartsByCategory, isPublicPart } from "@/lib/parts/store";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-static";

export function generateStaticParams() {
  return PART_CATEGORIES.map((c) => ({ category: c.value }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const meta = PART_CATEGORIES.find((c) => c.value === category);
  return {
    title: meta?.label ?? "Parts",
    description: meta?.blurb,
  };
}

export default async function PartsCategoryStaticPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  await requirePage("parts");
  const { category } = await params;
  const meta = PART_CATEGORIES.find((c) => c.value === category);
  if (!meta) notFound();
  const parts = (await listPartsByCategory(category as PartCategory)).filter(isPublicPart);

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">
            <Link href="/parts" className="link">
              Parts
            </Link>
          </p>
          <h1>{meta.label}</h1>
          <p className="lede">{meta.blurb}</p>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          {parts.length === 0 ? (
            <div className="empty">
              <p>No public items in this category yet.</p>
              <Link href="/contact" className="btn btn-primary">
                Ask about availability
              </Link>
            </div>
          ) : (
            <div className="admin-tablewrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Title</th>
                    <th>Pack</th>
                    <th>Price</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {parts.map((p) => (
                    <tr key={p.id}>
                      <td>{p.sku}</td>
                      <td>
                        <Link href={`/parts/item/${p.id}`}>{p.title}</Link>
                        {p.demo ? (
                          <span className="muted" style={{ marginLeft: 8, fontSize: "0.85rem" }}>
                            demo
                          </span>
                        ) : null}
                      </td>
                      <td>{p.packSize}</td>
                      <td>{formatMoney(p.price, p.currency)}</td>
                      <td>
                        <Link href={`/parts/item/${p.id}`} className="btn btn-ghost btn-small">
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
