import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requirePage } from "@/lib/require-page";
import { PART_CATEGORIES, type PartCategory } from "@/lib/parts/types";
import { listParts, listPartsByCategory, isPublicPart } from "@/lib/parts/store";
import { PartCard } from "@/components/parts/PartCard";
import { PartsCategoryRail } from "@/components/parts/PartsCategoryNav";
import { PartPlate } from "@/components/parts/PartPlate";
import { PART_VISUALS } from "@/lib/parts/visuals";
import { Reveal } from "@/components/Reveal";

export const dynamic = "force-dynamic";

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

export default async function PartsCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  await requirePage("parts");
  const { category } = await params;
  const meta = PART_CATEGORIES.find((c) => c.value === category);
  if (!meta) notFound();
  const cat = category as PartCategory;
  const h = await headers();
  const csrf = h.get("x-csrf-token") ?? "";
  const all = (await listParts()).filter(isPublicPart);
  const parts = (await listPartsByCategory(cat)).filter(isPublicPart);
  const counts = Object.fromEntries(
    PART_CATEGORIES.map((c) => [c.value, all.filter((p) => p.category === c.value).length]),
  ) as Partial<Record<PartCategory, number>>;
  const visual = PART_VISUALS[cat];

  return (
    <>
      <section className="parts-hero">
        <div className="wrap parts-hero-inner">
          <div>
            <p className="part-detail-crumb">
              <Link href="/parts">Parts</Link>
              <span aria-hidden="true">/</span>
              <span>{meta.label}</span>
            </p>
            <h1>{meta.label}</h1>
            <p className="lede">{meta.blurb}</p>
            <p className="lede" style={{ marginTop: 8, fontSize: "0.95rem" }}>
              {parts.length} public {parts.length === 1 ? "line" : "lines"} · {visual.label}
            </p>
          </div>
          <div className="parts-hero-aside">
            <PartPlate category={cat} size="hero" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <PartsCategoryRail active={cat} counts={counts} />
          {parts.length === 0 ? (
            <div className="cart-empty">
              <PartPlate category={cat} size="sm" />
              <p>No public items in this tray yet.</p>
              <Link href="/contact" className="btn btn-primary">
                Ask about availability
              </Link>
            </div>
          ) : (
            <Reveal>
              <div className="part-grid">
                {parts.map((p) => (
                  <PartCard key={p.id} part={p} csrf={csrf} showQuickAdd />
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </section>
    </>
  );
}
