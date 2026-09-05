import Image from "next/image";
import Link from "next/link";
import { FacetedStone, OUTER } from "@/components/GemGeometry";
import { services, site } from "@/lib/site";
import wordmark from "@/public/brand/wordmark.jpg";

/**
 * Hero composition: one faceted stone held in a four-prong setting on a ring
 * shank, framed by a watch bezel minute track. Gem materiality, setting craft
 * and watch detail in a single emblem. Line art, not product photography, so
 * nothing is misrepresented. Colours follow the client's locked brand.
 */
function HouseEmblem() {
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  const cx = 300;
  const cy = 300;
  const rOuter = 262;
  return (
    <svg viewBox="0 0 600 600" role="img" aria-labelledby="emblem-title emblem-desc">
      <title id="emblem-title">Atlantic Gems house emblem</title>
      <desc id="emblem-desc">
        A faceted blue stone held by four prongs on a ring, framed by a watch bezel.
      </desc>
      <defs>
        <linearGradient id="metalGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1dfae" />
          <stop offset="0.35" stopColor="#c8a55a" />
          <stop offset="0.6" stopColor="#7d6230" />
          <stop offset="1" stopColor="#e6c986" />
        </linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.45" r="0.5">
          <stop offset="0" stopColor="#1055b8" stopOpacity="0.16" />
          <stop offset="1" stopColor="#1055b8" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx={cx} cy={cy - 40} r="190" fill="url(#glow)" />

      {/* Watch bezel: minute track and indices */}
      <g className="bezel-ring">
        <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="#1055b8" strokeOpacity="0.4" />
        <circle cx={cx} cy={cy} r={rOuter - 26} fill="none" stroke="#1055b8" strokeOpacity="0.15" />
        {ticks.map((i) => {
          const a = (i / 60) * Math.PI * 2;
          const long = i % 5 === 0;
          const r1 = rOuter - 4;
          const r2 = rOuter - (long ? 20 : 11);
          return (
            <line
              key={i}
              className="bezel-tick"
              x1={cx + Math.cos(a) * r1}
              y1={cy + Math.sin(a) * r1}
              x2={cx + Math.cos(a) * r2}
              y2={cy + Math.sin(a) * r2}
              strokeWidth={long ? 2 : 1}
            />
          );
        })}
      </g>

      {/* Ring band, seen from above and in front; the stone hides the far side */}
      <ellipse
        className="ring-metal"
        cx="300"
        cy="345"
        rx="182"
        ry="100"
        fill="none"
        strokeWidth="18"
      />
      <ellipse
        cx="300"
        cy="341"
        rx="182"
        ry="100"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.45"
        strokeWidth="2"
      />

      {/* Seat beneath the stone */}
      <polygon
        points="200,330 400,330 380,362 220,362"
        fill="#3d3116"
        stroke="url(#metalGrad)"
        strokeWidth="2"
      />

      <FacetedStone id="hero" base="#1055b8" highlight="#9cc4ff" />

      {/* Four prongs */}
      {[OUTER[0], OUTER[1], OUTER[4], OUTER[5]].map((p, i) =>
        p ? (
          <g key={i}>
            <line
              x1={p[0]}
              y1={p[1]}
              x2={p[0] + (p[0] < 300 ? -14 : 14)}
              y2={p[1] + (p[1] < 260 ? -18 : 18)}
              stroke="url(#metalGrad)"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <circle
              cx={p[0] + (p[0] < 300 ? -14 : 14)}
              cy={p[1] + (p[1] < 260 ? -18 : 18)}
              r="6"
              fill="url(#metalGrad)"
            />
          </g>
        ) : null,
      )}
    </svg>
  );
}

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
          <p className="eyebrow">
            {site.city}, {site.region}
          </p>
          <h1 id="hero-title" className="hero-wordmark">
            <Image
              src={wordmark}
              alt="Atlantic Gems. Rough and faceted gemstones."
              priority
              sizes="(max-width: 900px) 90vw, 560px"
            />
          </h1>
          <p className="hero-head">
            Gemstones, custom jewellery, repair and stone setting under one roof.
          </p>
          <p className="hero-sub lede">
            A fine jewellery house and gem wholesaler serving private clients and the trade
            from Halifax, with high-end watch sales and service enquiries welcome.
          </p>
          <div className="hero-ctas">
            <Link href="/contact" className="btn btn-primary">
              Book a private appointment
            </Link>
            <Link href="/gemstones" className="btn btn-ghost">
              Explore the stones
            </Link>
          </div>
          <div className="hero-house" aria-label="House services">
            {services.map((s) => (
              <span key={s.key}>{s.title}</span>
            ))}
          </div>
        </div>

        <div className="hero-art">
          <HouseEmblem />
          <div className="hero-sweep" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
