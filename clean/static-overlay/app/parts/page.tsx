import type { Metadata } from "next";
import Link from "next/link";
import { requirePage } from "@/lib/require-page";
import { PART_CATEGORIES } from "@/lib/parts/types";
import { listParts, isPublicPart } from "@/lib/parts/store";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = {
  title: "Parts and Tools",
  description:
    "Watch, clock and jewellery parts, tools, batteries, straps and packaging from Atlantic Gems.",
};

export const dynamic = "force-static";

export default async function PartsIndexStaticPage() {
  await requirePage("parts");
  const parts = (await listParts()).filter(isPublicPart);

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">Parts counter</p>
          <h1>Shop parts and tools</h1>
          <p className="lede">
            Movements, crystals, straps, batteries, findings and bench tools. Demo catalogue —
            request a quote via contact on this static preview. Unlisted parts: use the contact form.
          </p>
          <div className="hero-ctas">
            <Link href="/contact" className="btn btn-primary">
              Request a quote
            </Link>
            <Link href="/contact" className="btn btn-ghost">
              Request an unlisted part
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="house">
            {PART_CATEGORIES.map((c) => {
              const count = parts.filter((p) => p.category === c.value).length;
              return (
                <Link key={c.value} href={`/parts/${c.value}`}>
                  <h3>{c.label}</h3>
                  <p>
                    {c.blurb} {count ? `${count} in catalogue.` : ""}
                  </p>
                  <span className="house-more" aria-hidden="true">
                    →
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="wrap">
          <div className="section-head">
            <h2 className="section-title">Featured stock</h2>
            <p className="lede">A sample of public catalogue lines. Prices are demo placeholders.</p>
          </div>
          <div className="admin-tablewrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Title</th>
                  <th>Brand</th>
                  <th>Price</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {parts.slice(0, 12).map((p) => (
                  <tr key={p.id}>
                    <td>{p.sku}</td>
                    <td>
                      <Link href={`/parts/item/${p.id}`}>{p.title}</Link>
                    </td>
                    <td>{p.brand || "—"}</td>
                    <td>{formatMoney(p.price, p.currency)}</td>
                    <td>
                      <Link href={`/parts/item/${p.id}`} className="link">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
