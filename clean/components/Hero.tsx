import Image from "next/image";
import Link from "next/link";
import { CompassHero } from "@/components/CompassHero";
import wordmark from "@/public/brand/wordmark.jpg";

export function Hero({ shopOpen = false }: { shopOpen?: boolean }) {
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
          <p className="hero-head">Fine jewellery, new and pre-owned. Bought, sold and sourced.</p>
          <p className="hero-sub lede">
            A Halifax house for jewellery and watches: pieces from our collection, pieces found to
            your brief, and pieces you want to sell. Behind them, our own bench for custom work,
            repair, setting, appraisals and loose stones.
          </p>
          <div className="hero-ctas">
            {shopOpen ? (
              <Link href="/inventory" className="btn btn-primary">
                Browse the collection
              </Link>
            ) : (
              <Link href="/jewellery" className="btn btn-primary">
                Find a piece
              </Link>
            )}
            <Link href="/contact" className="btn btn-ghost">
              Book a private appointment
            </Link>
          </div>
        </div>

        <div className="hero-art">
          <CompassHero />
        </div>
      </div>
    </section>
  );
}
