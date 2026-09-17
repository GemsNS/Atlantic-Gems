import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requirePage } from "@/lib/require-page";
import { getPart, isPublicPart, listParts } from "@/lib/parts/store";
import { partCategoryLabel } from "@/lib/parts/types";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const parts = await listParts();
  return parts.filter(isPublicPart).map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const part = await getPart(id);
  return { title: part?.title ?? "Part" };
}

export default async function PartDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePage("parts");
  const { id } = await params;
  const part = await getPart(id);
  if (!part || !isPublicPart(part)) notFound();
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">
            <Link href="/parts" className="link">
              Parts
            </Link>
            {" / "}
            <Link href={`/parts/${part.category}`} className="link">
              {partCategoryLabel(part.category)}
            </Link>
          </p>
          <h1>{part.title}</h1>
          <p className="lede">
            {part.brand ? `${part.brand} · ` : ""}
            SKU {part.sku}
            {part.demo ? " · Demo listing" : ""}
          </p>
        </div>
      </section>
      <section className="section">
        <div className="wrap two-col">
          <div>
            <h2>Details</h2>
            <p>{part.description || "No further description."}</p>
            <ul className="facts" style={{ marginTop: 24 }}>
              <li>
                <span className="k">Pack</span>
                <span className="v">{part.packSize}</span>
              </li>
              <li>
                <span className="k">Stock</span>
                <span className="v">{part.stockQty}</span>
              </li>
              <li>
                <span className="k">Price</span>
                <span className="v">{formatMoney(part.price, part.currency)}</span>
              </li>
            </ul>
          </div>
          <div className="aside-card">
            <h3>Add to quote cart</h3>
            <p>Card checkout is wired but not live yet. Submit your cart as a quote request.</p>
            <form action="/api/cart/add" method="post">
              <input type="hidden" name="csrf" value={csrf} />
              <input type="hidden" name="partId" value={part.id} />
              <label>
                Qty
                <input type="number" name="qty" min={1} max={999} defaultValue={1} />
              </label>
              <button className="btn btn-primary" type="submit" style={{ marginTop: 12 }}>
                Add to cart
              </button>
            </form>
            <Link href="/cart" className="btn btn-ghost" style={{ marginTop: 10 }}>
              Go to cart
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
