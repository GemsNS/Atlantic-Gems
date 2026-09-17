import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePage } from "@/lib/require-page";
import { getPart, isPublicPart, listParts } from "@/lib/parts/store";
import { partCategoryLabel } from "@/lib/parts/types";
import { formatMoney } from "@/lib/format";
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

  const subject = encodeURIComponent(`Parts enquiry: ${part.sku} ${part.title}`);
  const body = encodeURIComponent(
    `Hello,\n\nI would like a quote for:\n${part.sku} — ${part.title}\nQty: \n\nThanks.`,
  );

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
                <span className="k">Price</span>
                <span className="v">{formatMoney(part.price, part.currency)}</span>
              </li>
            </ul>
          </div>
          <div className="aside-card">
            <h3>Request a quote</h3>
            <p>
              This static preview has no cart. Email us for availability, or use the contact form
              on the live site.
            </p>
            <a href={`mailto:${site.email}?subject=${subject}&body=${body}`} className="btn btn-primary">
              Email about this part
            </a>
            <Link href="/contact" className="btn btn-ghost" style={{ marginTop: 10 }}>
              Contact form
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
