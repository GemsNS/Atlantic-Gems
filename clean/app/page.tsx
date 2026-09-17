import Link from "next/link";
import { Hero } from "@/components/Hero";
import { Reveal } from "@/components/Reveal";
import { GemExplorer } from "@/components/GemExplorer";
import { AtelierBoard } from "@/components/AtelierBoard";
import { JewelleryPaths } from "@/components/interactive/JewelleryPaths";
import { PART_CATEGORIES } from "@/lib/parts/types";
import { collectionIsPublic } from "@/lib/inventory/types";
import { getSettings } from "@/lib/inventory/store";
import { composeSiteCopy } from "@/lib/site-copy";
import { site } from "@/lib/site";

export default async function HomePage() {
  const settings = await getSettings();
  const copy = composeSiteCopy(settings.siteMode, settings.pages, collectionIsPublic(settings));
  const show = (s: (typeof copy.sections)[number]) => copy.sections.includes(s);

  return (
    <>
      <Hero copy={copy} />

      {show("parts") ? (
        <section className="section" aria-labelledby="parts-title">
          <div className="wrap">
            <div className="section-head">
              <h2 id="parts-title" className="section-title">
                {copy.partsTitle}
              </h2>
              <p className="lede">{copy.partsLede}</p>
            </div>
            <Reveal>
              <div className="house">
                {PART_CATEGORIES.map((c) => (
                  <Link key={c.value} href={`/parts/${c.value}`}>
                    <h3>{c.label}</h3>
                    <p>{c.blurb}</p>
                    <span className="house-more" aria-hidden="true">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </Reveal>
            <div className="hero-ctas" style={{ marginTop: 28 }}>
              <Link href="/parts" className="btn btn-primary">
                View all parts
              </Link>
              <Link
                href={process.env.NEXT_PUBLIC_STATIC_EXPORT === "1" ? "/contact" : "/cart"}
                className="btn btn-ghost"
              >
                {process.env.NEXT_PUBLIC_STATIC_EXPORT === "1" ? "Request a quote" : "Cart / request quote"}
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {show("jewelleryPaths") ? (
        <section className="section" aria-labelledby="jewellery-title">
          <div className="wrap">
            <div className="section-head">
              <h2 id="jewellery-title" className="section-title">
                {copy.jewelleryTitle}
              </h2>
              <p className="lede">{copy.jewelleryLede}</p>
            </div>
            <Reveal>
              <JewelleryPaths />
            </Reveal>
          </div>
        </section>
      ) : null}

      {show("house") && copy.services.length > 0 ? (
        <section className="section section-alt" aria-labelledby="house-title">
          <div className="wrap">
            <div className="section-head">
              <h2 id="house-title" className="section-title">
                {copy.houseTitle}
              </h2>
              <p className="lede">{copy.houseLede}</p>
            </div>
            <Reveal>
              <div className="house">
                {copy.services.map((s) => (
                  <Link key={s.key} href={s.href}>
                    <h3>{s.title}</h3>
                    <p>{s.short}</p>
                    <span className="house-more" aria-hidden="true">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      {show("atelier") ? (
        <section className="section" aria-labelledby="atelier-title">
          <div className="wrap">
            <div className="section-head">
              <h2 id="atelier-title" className="section-title">
                {copy.atelierTitle}
              </h2>
              <p className="lede">{copy.atelierLede}</p>
            </div>
            <Reveal delay={1}>
              <AtelierBoard services={copy.services} />
            </Reveal>
          </div>
        </section>
      ) : null}

      {show("gemstones") ? (
        <section className="section section-alt" aria-labelledby="stones-title">
          <div className="wrap">
            <div className="section-head">
              <h2 id="stones-title" className="section-title">
                {copy.stonesTitle}
              </h2>
              <p className="lede">{copy.stonesLede}</p>
            </div>
            <Reveal delay={1}>
              <GemExplorer />
            </Reveal>
          </div>
        </section>
      ) : null}

      <section className="section" aria-labelledby="visit-title">
        <div className="wrap two-col">
          <div>
            <h2 id="visit-title" className="section-title">
              {copy.visitTitle}
            </h2>
            <p className="lede" style={{ marginTop: 18 }}>
              {copy.visitLede}
            </p>
            <div className="hero-ctas">
              <Link href="/contact" className="btn btn-primary">
                Contact us
              </Link>
              {settings.pages.wholesale ? (
                <Link href="/wholesale" className="btn btn-ghost">
                  Trade access
                </Link>
              ) : null}
            </div>
          </div>
          <div className="aside-card">
            <h3>Reach us</h3>
            <p>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </p>
            <p>
              Instagram{" "}
              <a href={site.social.instagram.url} rel="noopener noreferrer" target="_blank">
                {site.social.instagram.handle}
              </a>
            </p>
            <p>{site.locationNote}</p>
          </div>
        </div>
      </section>
    </>
  );
}
