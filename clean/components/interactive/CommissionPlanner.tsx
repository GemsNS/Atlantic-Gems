"use client";

import Link from "next/link";
import { useState } from "react";
import { Seg, ToolFrame, briefLink } from "./ToolFrame";

const STYLE = [
  { value: "solitaire", label: "Solitaire" },
  { value: "bezel", label: "Bezel" },
  { value: "three-stone", label: "Three stone" },
  { value: "halo", label: "Halo" },
] as const;
const METAL = [
  { value: "yellow gold", label: "Yellow gold", a: "#f0d68a", b: "#b8892e" },
  { value: "white gold", label: "White gold", a: "#f4f6f8", b: "#a9b2bd" },
  { value: "rose gold", label: "Rose gold", a: "#f2c9b0", b: "#b8785a" },
  { value: "platinum", label: "Platinum", a: "#eef1f4", b: "#98a1ab" },
] as const;
const STONE = [
  { value: "diamond", label: "Diamond", c: "#dfe9f3", h: "#ffffff" },
  { value: "sapphire", label: "Sapphire", c: "#1055b8", h: "#8fbfff" },
  { value: "ruby", label: "Ruby", c: "#a6152f", h: "#ff7a90" },
  { value: "emerald", label: "Emerald", c: "#0b6a4c", h: "#7fe6b8" },
] as const;
const SOURCE = [
  { value: "my own stone", label: "My own stone" },
  { value: "a stone from Atlantic Gems", label: "A stone from you" },
] as const;

function Ring({
  style,
  metal,
  stone,
}: {
  style: (typeof STYLE)[number]["value"];
  metal: (typeof METAL)[number];
  stone: (typeof STONE)[number];
}) {
  const cx = 150;
  const cy = 78;
  return (
    <svg viewBox="0 0 300 230" className="ring-svg" aria-hidden="true">
      <defs>
        <linearGradient id="pm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={metal.a} />
          <stop offset="0.55" stopColor={metal.b} />
          <stop offset="1" stopColor={metal.a} />
        </linearGradient>
        <radialGradient id="ps" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={stone.h} />
          <stop offset="0.5" stopColor={stone.c} />
          <stop offset="1" stopColor="#0a0f18" />
        </radialGradient>
      </defs>
      {/* band */}
      <path d="M 52 96 C 52 200, 248 200, 248 96" fill="none" stroke="url(#pm)" strokeWidth="14" strokeLinecap="round" />
      <path d="M 52 96 C 52 200, 248 200, 248 96" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" transform="translate(0,-4)" />
      {/* shoulders */}
      <path d="M 52 96 L 118 82 M 248 96 L 182 82" stroke="url(#pm)" strokeWidth="14" strokeLinecap="round" />
      {style === "three-stone" ? (
        <>
          <circle cx={cx - 40} cy={cy + 6} r="16" fill="url(#ps)" stroke={metal.b} strokeWidth="2" />
          <circle cx={cx + 40} cy={cy + 6} r="16" fill="url(#ps)" stroke={metal.b} strokeWidth="2" />
          <circle cx={cx} cy={cy} r="24" fill="url(#ps)" stroke={metal.b} strokeWidth="2" />
          {[cx - 40, cx, cx + 40].map((x, i) => (
            <g key={i}>
              <circle cx={x - (i === 1 ? 17 : 11)} cy={(i === 1 ? cy : cy + 6) - (i === 1 ? 17 : 11)} r="3.2" fill="url(#pm)" />
              <circle cx={x + (i === 1 ? 17 : 11)} cy={(i === 1 ? cy : cy + 6) - (i === 1 ? 17 : 11)} r="3.2" fill="url(#pm)" />
            </g>
          ))}
        </>
      ) : style === "halo" ? (
        <>
          <circle cx={cx} cy={cy} r="38" fill="url(#pm)" />
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2;
            return <circle key={i} cx={cx + Math.cos(a) * 32} cy={cy + Math.sin(a) * 32} r="4.5" fill="url(#ps)" />;
          })}
          <circle cx={cx} cy={cy} r="24" fill="url(#ps)" />
        </>
      ) : style === "bezel" ? (
        <>
          <circle cx={cx} cy={cy} r="32" fill="url(#pm)" />
          <circle cx={cx} cy={cy} r="25" fill="url(#ps)" />
        </>
      ) : (
        <>
          <circle cx={cx} cy={cy} r="26" fill="url(#ps)" />
          {[45, 135, 225, 315].map((deg) => {
            const a = (deg * Math.PI) / 180;
            return <circle key={deg} cx={cx + Math.cos(a) * 24} cy={cy + Math.sin(a) * 24} r="4" fill="url(#pm)" />;
          })}
        </>
      )}
    </svg>
  );
}

export function CommissionPlanner() {
  const [style, setStyle] = useState<(typeof STYLE)[number]["value"]>("solitaire");
  const [metalV, setMetalV] = useState<(typeof METAL)[number]["value"]>("yellow gold");
  const [stoneV, setStoneV] = useState<(typeof STONE)[number]["value"]>("sapphire");
  const [source, setSource] = useState<(typeof SOURCE)[number]["value"]>("a stone from Atlantic Gems");
  const metal = METAL.find((m) => m.value === metalV) ?? METAL[0];
  const stone = STONE.find((s) => s.value === stoneV) ?? STONE[0];

  const brief = `Commission brief: a ${style} ring in ${metal.value} with a ${stone.value}, using ${source}.\n\nAbout the piece (finger size, stone details, budget, timing):\n`;

  return (
    <ToolFrame
      title="Rough out the piece."
      intro="Choose a setting style, metal and stone to see the shape of the commission. The drawing is a starting point for the conversation, not the final design."
    >
      <div className="tool-grid">
        <div className="tool-controls">
          <Seg label="Setting" options={[...STYLE]} value={style} onChange={setStyle} />
          <Seg label="Metal" options={METAL.map((m) => ({ value: m.value, label: m.label }))} value={metalV} onChange={setMetalV} />
          <Seg label="Centre stone" options={STONE.map((s) => ({ value: s.value, label: s.label }))} value={stoneV} onChange={setStoneV} />
          <Seg label="Stone source" options={[...SOURCE]} value={source} onChange={setSource} />
        </div>
        <div className="tool-preview">
          <Ring style={style} metal={metal} stone={stone} />
          <p className="tool-out">
            A <strong>{style}</strong> ring in <strong>{metal.value}</strong> with a <strong>{stone.value}</strong>,{" "}
            {source}.
          </p>
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            Drawings and a written quote follow the consultation. Nothing is made until you approve both.
          </p>
          <Link href={briefLink("custom", brief)} className="btn btn-primary">
            Start this commission
          </Link>
        </div>
      </div>
    </ToolFrame>
  );
}
