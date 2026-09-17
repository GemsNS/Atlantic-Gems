import Image from "next/image";
import Link from "next/link";
import { CompassHero } from "@/components/CompassHero";
import type { SiteCopy } from "@/lib/site-copy";
import wordmark from "@/public/brand/wordmark.jpg";

export function Hero({ copy }: { copy: SiteCopy }) {
  const idleCaption =
    copy.services.length === 0
      ? "Parts and tools for the bench. Browse the catalogue or request a part."
      : copy.services.length === 1
        ? `${copy.services[0]!.title}. Follow the needle.`
        : `${copy.services.length} disciplines, one bench. Follow the needle to any point.`;

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-grid" aria-hidden="true" />
      <div className="caustic caustic-a" aria-hidden="true" />
      <div className="caustic caustic-b" aria-hidden="true" />
      <div className="caustic caustic-c" aria-hidden="true" />
      <div className="hero-metal" aria-hidden="true" />

      <div className="wrap hero-inner">
        <div className="hero-copy">
          <h1 id="hero-title" className="hero-wordmark">
            <Image
              src={wordmark}
              alt="Atlantic Gems. Rough and faceted gemstones."
              priority
              sizes="(max-width: 900px) 86vw, 560px"
            />
          </h1>
          <p className="hero-head">{copy.heroHead}</p>
          <p className="hero-sub lede">{copy.heroSub}</p>
          <div className="hero-ctas">
            <Link href={copy.primaryCta.href} className="btn btn-primary">
              {copy.primaryCta.label}
            </Link>
            <Link href={copy.secondaryCta.href} className="btn btn-ghost">
              {copy.secondaryCta.label}
            </Link>
          </div>
        </div>

        <div className="hero-art">
          <CompassHero items={copy.services} idleCaption={idleCaption} />
        </div>
      </div>
    </section>
  );
}
