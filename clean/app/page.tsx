import Link from "next/link";
import { Hero } from "@/components/Hero";
import { Reveal } from "@/components/Reveal";
import { GemExplorer } from "@/components/GemExplorer";
import { AtelierBoard } from "@/components/AtelierBoard";
import { JewelleryPaths } from "@/components/interactive/JewelleryPaths";
import { getSettings } from "@/lib/inventory/store";
import { services, site } from "@/lib/site";

export default async function HomePage() {
  const settings = await getSettings();
  return (
    <>
      <Hero shopOpen={settings.shopOpen} />

      <section className="section" aria-labelledby="jewellery-title">
        <div className="wrap">
          <div className="section-head">
            <h2 id="jewellery-title" className="section-title">
              Buy, sell, or have it found.
            </h2>
            <p className="lede">
              New and pre-owned fine jewellery is the heart of the house. Choose how you want to work
              with us.
            </p>
          </div>
          <Reveal>
            <JewelleryPaths />
          </Reveal>
        </div>
      </section>

      <section className="section section-alt" aria-labelledby="house-title">
        <div className="wrap">
          <div className="section-head">
            <h2 id="house-title" className="section-title">
              Seven disciplines. One bench.
            </h2>
            <p className="lede">
              Most jewellers send work out. Here, sourcing, manufacturing, repair, setting, appraisal
              and stones are handled by the same people you speak to.
            </p>
          </div>
          <Reveal>
            <div className="house">
              {services.map((s) => (
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

      <section className="section" aria-labelledby="atelier-title">
        <div className="wrap">
          <div className="section-head">
            <h2 id="atelier-title" className="section-title">
              Every job starts with a written estimate.
            </h2>
            <p className="lede">
              Commissions, repairs, setting, appraisals and watch work are assessed first and quoted
              in writing. Nothing is touched until you say so.
            </p>
          </div>
          <Reveal delay={1}>
            <AtelierBoard />
          </Reveal>
        </div>
      </section>

      <section className="section section-alt" aria-labelledby="stones-title">
        <div className="wrap">
          <div className="section-head">
            <h2 id="stones-title" className="section-title">
              And the stones themselves.
            </h2>
            <p className="lede">
              Loose rough and faceted stones for the trade and for commissions. Choose a category to
              see how we describe it and what we disclose.
            </p>
          </div>
          <Reveal delay={1}>
            <GemExplorer />
          </Reveal>
        </div>
      </section>

      <section className="section" aria-labelledby="visit-title">
        <div className="wrap two-col">
          <div>
            <h2 id="visit-title" className="section-title">
              By appointment in Halifax.
            </h2>
            <p className="lede" style={{ marginTop: 18 }}>
              Private clients are seen by appointment. Trade buyers can request current stock and
              pricing through the trade area.
            </p>
            <div className="hero-ctas">
              <Link href="/contact" className="btn btn-primary">
                Book an appointment
              </Link>
              <Link href="/wholesale" className="btn btn-ghost">
                Trade access
              </Link>
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
