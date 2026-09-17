import type { Metadata } from "next";
import Link from "next/link";
import { requirePage } from "@/lib/require-page";
import { PART_CATEGORIES, type PartCategory } from "@/lib/parts/types";
import { listParts, isPublicPart } from "@/lib/parts/store";
import { PartCard } from "@/components/parts/PartCard";
import { PartsCategoryGrid, PartsCategoryRail } from "@/components/parts/PartsCategoryNav";
import { PartPlate } from "@/components/parts/PartPlate";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Parts and Tools",
  description:
    "Watch, clock and jewellery parts, tools, batteries, straps and packaging from Atlantic Gems.",
};

export const dynamic = "force-static";

/** Static Pages preview — no cart; quote via contact. */
export default async function PartsIndexStaticPage() {
  await requirePage("parts");
  const parts = (await listParts()).filter(isPublicPart);
  const featured = [...parts].sort((a, b) => (b.stockQty || 0) - (a.stockQty || 0)).slice(0, 8);
  const counts = Object.fromEntries(
    PART_CATEGORIES.map((c) => [c.value, parts.filter((p) => p.category === c.value).length]),
  ) as Partial<Record<PartCategory, number>>;
  const brands = new Set(parts.map((p) => p.brand).filter(Boolean)).size;
  const inStock = parts.filter((p) => p.stockQty > 0).length;

  return (
    <>
      <section className="parts-hero">
        <div className="wrap parts-hero-inner">
          <div>
            <p className="eyebrow">Parts counter</p>
            <h1>Everything for the bench.</h1>
            <p className="lede">
              Movements, crystals, straps, batteries, findings and Swiss tools. This static preview
              has no cart — request a quote by email or contact form.
            </p>
            <div className="hero-ctas">
              <Link href="#catalogue" className="btn btn-primary">
                Browse catalogue
              </Link>
              <Link href="/contact" className="btn btn-ghost">
                Request a quote
              </Link>
            </div>
            <div className="parts-hero-stats">
              <div>
                <strong>{parts.length}</strong>
                <span>public lines</span>
              </div>
              <div>
                <strong>{inStock}</strong>
                <span>in stock</span>
              </div>
              <div>
                <strong>{brands || "—"}</strong>
                <span>brands</span>
              </div>
            </div>
          </div>
          <div className="parts-hero-aside">
            <PartPlate category="tools" size="hero" />
          </div>
        </div>
      </section>

      <section className="section" id="catalogue">
        <div className="wrap">
          <div className="parts-toolbar">
            <div>
              <h2>Shop by tray</h2>
              <p>Open a category, or jump from the rail below.</p>
            </div>
          </div>
          <PartsCategoryRail counts={counts} />
          <Reveal>
            <PartsCategoryGrid counts={counts} />
          </Reveal>
        </div>
      </section>

      <section className="section section-alt">
        <div className="wrap">
          <div className="parts-toolbar">
            <div>
              <h2>On the counter now</h2>
              <p>Demo prices until the live list is confirmed.</p>
            </div>
          </div>
          <Reveal>
            <div className="part-grid">
              {featured.map((p) => (
                <PartCard key={p.id} part={p} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
