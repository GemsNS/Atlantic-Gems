import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePage } from "@/lib/require-page";
import { getPart, isPublicPart, listParts } from "@/lib/parts/store";
import { partCategoryLabel } from "@/lib/parts/types";
import { formatMoney } from "@/lib/format";
import { PartPlate } from "@/components/parts/PartPlate";
import { PartCard } from "@/components/parts/PartCard";
import { stockLabel, stockTone } from "@/lib/parts/visuals";
import { site } from "@/lib/site";

export const dynamic = "force-static";

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

export default async function PartDetailStaticPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePage("parts");
  const { id } = await params;
  const part = await getPart(id);
  if (!part || !isPublicPart(part)) notFound();
  const tone = stockTone(part.stockQty, part.reorderPoint);
  const related = (await listParts())
    .filter((p) => isPublicPart(p) && p.category === part.category && p.id !== part.id)
    .slice(0, 4);

  const subject = encodeURIComponent(`Parts enquiry: ${part.sku} ${part.title}`);
  const body = encodeURIComponent(
    `Hello,\n\nI would like a quote for:\n${part.sku} — ${part.title}\nQty: \n\nThanks.`,
  );

  return (
    <section className="section" style={{ borderTop: 0, paddingTop: "clamp(32px, 5vw, 56px)" }}>
      <div className="wrap part-detail">
        <div className="part-detail-stage">
          <PartPlate category={part.category} size="hero" />
        </div>
        <div>
          <p className="part-detail-crumb">
            <Link href="/parts">Parts</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/parts/${part.category}`}>{partCategoryLabel(part.category)}</Link>
          </p>
          <h1>{part.title}</h1>
          <p className="part-detail-brand">
            {part.brand ? `${part.brand} · ` : ""}
            SKU {part.sku}
            {part.demo ? " · Demo listing" : ""}
          </p>
          <p className="part-detail-price">{formatMoney(part.price, part.currency)}</p>
          <p className={`part-chip part-chip-stock is-${tone}`} style={{ position: "static" }}>
            {stockLabel(part.stockQty, part.reorderPoint)}
          </p>
          <p className="part-detail-desc">{part.description || "No further description on file."}</p>
          <ul className="part-spec">
            <li>
              <span className="k">Pack size</span>
              <span className="v">{part.packSize}</span>
            </li>
            <li>
              <span className="k">On hand</span>
              <span className="v">{part.stockQty}</span>
            </li>
            <li>
              <span className="k">Category</span>
              <span className="v">{partCategoryLabel(part.category)}</span>
            </li>
            <li>
              <span className="k">Visibility</span>
              <span className="v">{part.visibility}</span>
            </li>
          </ul>
          <div className="part-buy-panel">
            <h2>Request a quote</h2>
            <p>This static preview has no cart. Email us, or use the contact form on the live site.</p>
            <a href={`mailto:${site.email}?subject=${subject}&body=${body}`} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Email about this part
            </a>
            <Link href="/contact" className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginTop: 10 }}>
              Contact form
            </Link>
          </div>
        </div>
      </div>
      {related.length > 0 ? (
        <div className="wrap" style={{ marginTop: 64 }}>
          <div className="parts-toolbar">
            <div>
              <h2>More in this tray</h2>
              <p>Related lines from {partCategoryLabel(part.category)}.</p>
            </div>
          </div>
          <div className="part-grid">
            {related.map((p) => (
              <PartCard key={p.id} part={p} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
