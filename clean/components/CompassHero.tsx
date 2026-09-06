"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { services, type Service } from "@/lib/site";

/**
 * The house compass. A slowly turning bezel with a compass rose whose needle
 * follows the visitor's pointer. The six disciplines sit at the compass
 * points; pointing at one swings the needle to it and names it. Line art
 * only, so nothing is misrepresented as product photography.
 */

const RADIUS_PCT = 47; // marker ring radius as % of the art box
const MARKER_ANGLES = services.map((_, i) => i * (360 / services.length));

function polar(angleDeg: number, r: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) };
}

function shortestTurn(from: number, to: number) {
  let d = ((to - from) % 360 + 540) % 360 - 180;
  if (d === -180) d = 180;
  return from + d;
}

export function CompassHero() {
  const box = useRef<HTMLDivElement | null>(null);
  const [angle, setAngle] = useState(0);
  const [active, setActive] = useState<Service | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const pointTo = useCallback((target: number) => {
    setAngle((prev) => shortestTurn(prev, target));
  }, []);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (active || !box.current) return;
    const r = box.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    pointTo(deg);
  };

  const onLeave = () => {
    if (!active) pointTo(0);
  };

  const activate = (s: Service, i: number) => {
    setActive(s);
    pointTo(MARKER_ANGLES[i] ?? 0);
  };
  const deactivate = () => {
    setActive(null);
    pointTo(0);
  };

  const ticks = Array.from({ length: 120 }, (_, i) => i);
  const numerals = Array.from({ length: 12 }, (_, i) => i * 30);

  return (
    <div className="compass-wrap">
      <div
        ref={box}
        className={`compass${reduced ? " is-reduced" : ""}`}
        onPointerMove={onPointerMove}
        onPointerLeave={onLeave}
      >
        <svg viewBox="0 0 600 600" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="cBrass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f1dfae" />
              <stop offset="0.5" stopColor="#c8a55a" />
              <stop offset="1" stopColor="#8a6d33" />
            </linearGradient>
            <radialGradient id="cDial" cx="0.5" cy="0.45" r="0.6">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.7" stopColor="#f4f7fb" />
              <stop offset="1" stopColor="#e3eaf4" />
            </radialGradient>
            <linearGradient id="cNeedleN" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3b7be0" />
              <stop offset="1" stopColor="#0b3f8f" />
            </linearGradient>
            <linearGradient id="cNeedleS" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#dfe7f1" />
              <stop offset="1" stopColor="#aebccf" />
            </linearGradient>
          </defs>

          {/* Dial */}
          <circle cx="300" cy="300" r="262" fill="url(#cDial)" stroke="#1055b8" strokeOpacity="0.25" />

          {/* Turning bezel */}
          <g className="compass-bezel">
            <circle cx="300" cy="300" r="292" fill="none" stroke="#1055b8" strokeOpacity="0.35" strokeWidth="1.5" />
            <circle cx="300" cy="300" r="268" fill="none" stroke="#1055b8" strokeOpacity="0.15" />
            {ticks.map((i) => {
              const a = (i / 120) * Math.PI * 2;
              const major = i % 10 === 0;
              const mid = i % 5 === 0;
              const r1 = 290;
              const r2 = 290 - (major ? 18 : mid ? 12 : 7);
              return (
                <line
                  key={i}
                  x1={300 + Math.cos(a) * r1}
                  y1={300 + Math.sin(a) * r1}
                  x2={300 + Math.cos(a) * r2}
                  y2={300 + Math.sin(a) * r2}
                  stroke="#1055b8"
                  strokeOpacity={major ? 0.75 : 0.4}
                  strokeWidth={major ? 2 : 1}
                />
              );
            })}
            {numerals.map((n) => {
              const a = ((n - 90) * Math.PI) / 180;
              const r = 236;
              return (
                <text
                  key={n}
                  x={300 + Math.cos(a) * r}
                  y={300 + Math.sin(a) * r}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="13"
                  fontFamily="var(--font-body)"
                  fontWeight="600"
                  fill="#1055b8"
                  fillOpacity="0.7"
                  transform={`rotate(${n} ${300 + Math.cos(a) * r} ${300 + Math.sin(a) * r})`}
                >
                  {n === 0 ? "N" : n}
                </text>
              );
            })}
          </g>

          {/* Compass rose: four long points, four short */}
          <g className="compass-rose">
            {[0, 90, 180, 270].map((deg) => (
              <g key={`L${deg}`} transform={`rotate(${deg} 300 300)`}>
                <polygon points="300,120 318,300 300,300" fill="#1055b8" />
                <polygon points="300,120 282,300 300,300" fill="#3b7be0" />
              </g>
            ))}
            {[45, 135, 225, 315].map((deg) => (
              <g key={`S${deg}`} transform={`rotate(${deg} 300 300)`}>
                <polygon points="300,190 313,300 300,300" fill="#0b6a4c" />
                <polygon points="300,190 287,300 300,300" fill="#1f9a72" />
              </g>
            ))}
            <circle cx="300" cy="300" r="118" fill="none" stroke="#1055b8" strokeOpacity="0.2" />
          </g>

          {/* Needle */}
          <g className="compass-needle" style={{ transform: `rotate(${angle}deg)` }}>
            <polygon points="300,92 311,300 289,300" fill="url(#cNeedleN)" />
            <polygon points="300,508 311,300 289,300" fill="url(#cNeedleS)" />
            <line x1="300" y1="92" x2="300" y2="508" stroke="#fff" strokeOpacity="0.5" strokeWidth="1" />
          </g>

          {/* Pivot with cap jewel */}
          <circle cx="300" cy="300" r="16" fill="url(#cBrass)" />
          <circle cx="300" cy="300" r="6" fill="#7a1024" />
          <circle cx="298" cy="298" r="2" fill="#ff8aa0" fillOpacity="0.8" />
        </svg>

        {/* Service markers at the compass points */}
        <ul className="compass-markers" aria-label="What we do">
          {services.map((s, i) => {
            const p = polar(MARKER_ANGLES[i] ?? 0, RADIUS_PCT);
            const isActive = active?.key === s.key;
            return (
              <li
                key={s.key}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                className={isActive ? "is-active" : undefined}
              >
                <Link
                  href={s.href}
                  onPointerEnter={() => activate(s, i)}
                  onPointerLeave={deactivate}
                  onFocus={() => activate(s, i)}
                  onBlur={deactivate}
                  aria-label={s.title}
                >
                  <span className="marker-dot" aria-hidden="true" />
                  <span className="marker-label">{s.navLabel}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hero-sweep" aria-hidden="true" />
      </div>

      <p className="compass-caption" aria-live="polite">
        {active ? (
          <>
            <strong>{active.title}.</strong> {active.short}.
          </>
        ) : (
          <>Seven disciplines, one bench. Follow the needle to any point.</>
        )}
      </p>
    </div>
  );
}
