import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requirePage } from "@/lib/require-page";
import { getPart, isPublicPart, listParts } from "@/lib/parts/store";
import { partCategoryLabel } from "@/lib/parts/types";
import { formatMoney } from "@/lib/format";
import { PartPlate } from "@/components/parts/PartPlate";
import { PartCard } from "@/components/parts/PartCard";
import { AddToCartPanel } from "@/components/parts/AddToCartPanel";
import { StockGauge } from "@/components/parts/StockGauge";
import { PART_VISUALS, stockNote, stockTone } from "@/lib/parts/visuals";

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
  const all = await listParts();
  const part = all.find((p) => p.id === id) ?? null;
  if (!part || !isPublicPart(part)) notFound();
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";
  const tone = stockTone(part.stockQty, part.reorderPoint);
  const visual = PART_VISUALS[part.category];

  const sameTray = all.filter((p) => isPublicPart(p) && p.category === part.category && p.id !== part.id);
  const related = sameTray.slice(0, 4);
  const sameBrand = part.brand
    ? all
        .filter((p) => isPublicPart(p) && p.brand === part.brand && p.id !== part.id && p.category !== part.category)
        .slice(0, 4)
    : [];

  return (
    <>
      <section className="section" style={{ borderTop: 0, paddingTop: "clamp(28px, 4vw, 48px)" }}>
        <div className="wrap">
          <p className="crumb">
            <Link href="/parts">Parts counter</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/parts/${part.category}`}>{partCategoryLabel(part.category)}</Link>
            <span aria-hidden="true">/</span>
            <span>{part.sku}</span>
          </p>

          <div className="part-detail">
            <div className="part-detail-stage">
              <PartPlate category={part.category} size="hero" seed={part.sku} />
              <p className="gallery-hint">
                Illustrated plate — {visual.label.toLowerCase()}. Photographs follow as lines are
                confirmed.
              </p>
            </div>

            <div>
              <h1>{part.title}</h1>
              <p className="part-detail-brand">
                {part.brand ? <span>{part.brand}</span> : null}
                <span className="sku">{part.sku}</span>
                {part.demo ? <span>Demo listing</span> : null}
              </p>

              <div className="part-detail-price-row">
                <span className="part-detail-price">{formatMoney(part.price, part.currency)}</span>
                <StockGauge
                  qty={part.stockQty}
                  reorder={part.reorderPoint}
                  label={stockNote(part.stockQty, part.reorderPoint)}
                />
              </div>

              <p className="part-detail-desc">
                {part.description || "No further description on file — ask and we will check the tin."}
              </p>

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
                  <span className="k">Reorder at</span>
                  <span className="v">{part.reorderPoint}</span>
                </li>
                <li>
                  <span className="k">Tray</span>
                  <span className="v">{partCategoryLabel(part.category)}</span>
                </li>
                <li>
                  <span className="k">Quoted in</span>
                  <span className="v">{part.currency}</span>
                </li>
              </ul>

              <div className="part-buy-panel">
                <h2>{tone === "out" ? "Out at the counter" : "Add to quote"}</h2>
                <p>
                  {tone === "out"
                    ? "This line is off the shelf. Tell us the job and we will come back with a lead time and a price."
                    : "Card checkout is wired but not switched on. Lines go to your tray; send the tray and we reply with a written quotation."}
                </p>
                <AddToCartPanel
                  csrf={csrf}
                  partId={part.id}
                  title={part.title}
                  disabled={tone === "out"}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="section section-alt">
          <div className="wrap">
            <div className="shop-head">
              <div>
                <span className="shop-head-n">Same tray</span>
                <h2>More {partCategoryLabel(part.category).toLowerCase()}</h2>
                <p>{sameTray.length} public lines on this tray.</p>
              </div>
              <Link href={`/parts/${part.category}`} className="btn btn-ghost btn-small">
                Open the tray
              </Link>
            </div>
            <div className="part-grid">
              {related.map((p) => (
                <PartCard key={p.id} part={p} csrf={csrf} showQuickAdd />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {sameBrand.length > 0 ? (
        <section className="section">
          <div className="wrap">
            <div className="shop-head">
              <div>
                <span className="shop-head-n">Same maker</span>
                <h2>Also from {part.brand}</h2>
                <p>Lines from the same maker on other trays.</p>
              </div>
            </div>
            <div className="part-grid">
              {sameBrand.map((p) => (
                <PartCard key={p.id} part={p} csrf={csrf} showQuickAdd />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
