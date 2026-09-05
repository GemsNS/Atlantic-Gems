import Link from "next/link";
import { Hero } from "@/components/Hero";
import { Reveal } from "@/components/Reveal";
import { GemExplorer } from "@/components/GemExplorer";
import { AtelierBoard } from "@/components/AtelierBoard";
import { services, site } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <Hero />

      <section className="section" aria-labelledby="house-title">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">The house</p>
            <h2 id="house-title" className="section-title">
              One address for the stone, the piece and its care.
            </h2>
            <p className="lede">
              Loose gemstones for the trade and for private clients, custom work made to your
              brief, repair and restoration of what you already own, professional setting, and
              enquiries for fine watches.
            </p>
          </div>
          <Reveal>
            <div className="house">
              {services.map((s, i) => (
                <Link key={s.key} href={s.href}>
                  <span className="idx">0{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.short}</p>
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section section-alt" aria-labelledby="stones-title">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Gemstones</p>
            <h2 id="stones-title" className="section-title">
              Rough and faceted. Quoted stone by stone.
            </h2>
            <p className="lede">
              Rubies, sapphires, emeralds, diamonds and related stones. Select a category to see
              how we describe it, then ask for what you need.
            </p>
          </div>
          <Reveal delay={1}>
            <GemExplorer />
          </Reveal>
        </div>
      </section>

      <section className="section" aria-labelledby="atelier-title">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Atelier</p>
            <h2 id="atelier-title" className="section-title">
              Bench work, in writing, before anything is touched.
            </h2>
            <p className="lede">
              Custom commissions, repair and restoration, stone setting and watch enquiries all
              begin with an assessment and a written estimate.
            </p>
          </div>
          <Reveal delay={1}>
            <AtelierBoard />
          </Reveal>
        </div>
      </section>

      <section className="section section-alt" aria-labelledby="visit-title">
        <div className="wrap two-col">
          <div>
            <p className="eyebrow">
              {site.city}, {site.region}
            </p>
            <h2 id="visit-title" className="section-title" style={{ marginTop: 12 }}>
              Private appointments and trade enquiries.
            </h2>
            <p className="lede" style={{ marginTop: 18 }}>
              Private clients are seen by appointment. Trade buyers can request access to current
              parcels and pricing through the trade area.
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
            <p>
              {site.city}, {site.region}, {site.country}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
