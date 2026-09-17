import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
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

export const dynamic = "force-dynamic";

export default async function PartsIndexPage() {
  await requirePage("parts");
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";
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
              Movements, crystals, straps, batteries, findings and Swiss tools — laid out like a
              tray on the counter. Request a written quote from your cart; ask if a part is not listed.
            </p>
            <div className="hero-ctas">
              <Link href="#catalogue" className="btn btn-primary">
                Browse catalogue
              </Link>
              <Link href="/cart" className="btn btn-ghost">
                Quote cart
              </Link>
            </div>
            <div className="parts-hero-stats" aria-label="Catalogue snapshot">
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
            <Link href="/contact" className="btn btn-ghost btn-small">
              Need an unlisted part?
            </Link>
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
              <p>A selection of stocked lines. Demo prices until the live list is confirmed.</p>
            </div>
          </div>
          <Reveal>
            <div className="part-grid">
              {featured.map((p) => (
                <PartCard key={p.id} part={p} csrf={csrf} showQuickAdd />
              ))}
            </div>
          </Reveal>
          <div className="hero-ctas" style={{ marginTop: 32 }}>
            <Link href={`/parts/${PART_CATEGORIES[0]!.value}`} className="btn btn-primary">
              Start with watch parts
            </Link>
            <Link href="/contact" className="btn btn-ghost">
              Trade account enquiry
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
