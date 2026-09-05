import Image from "next/image";
import Link from "next/link";
import { CompassHero } from "@/components/CompassHero";
import wordmark from "@/public/brand/wordmark.jpg";

export function Hero() {
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
          <p className="hero-head">
            The stone, the piece, and everything that happens to it afterwards.
          </p>
          <p className="hero-sub lede">
            Loose rough and faceted gemstones for the trade and for private clients. Custom
            manufacturing, repair, stone setting, appraisals, consignment and fine watch sourcing,
            all at one bench in Halifax.
          </p>
          <div className="hero-ctas">
            <Link href="/contact" className="btn btn-primary">
              Book a private appointment
            </Link>
            <Link href="/contact?type=wholesale" className="btn btn-ghost">
              Trade enquiries
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
