"use client";

import Link from "next/link";
import { useState } from "react";
import { Seg, ToolFrame, briefLink } from "./ToolFrame";

const STYLES = [
  {
    value: "prong",
    label: "Prong",
    holds: "Four or six claws grip the stone above the band, so light reaches it from every side.",
    suits: "Faceted stones that are meant to be seen in full. Prongs wear over years and are re-tipped.",
  },
  {
    value: "bezel",
    label: "Bezel",
    holds: "A continuous collar of metal is pressed over the stone's edge, protecting the girdle all the way round.",
    suits: "Cabochons, softer stones and pieces worn every day. The most secure of the common styles.",
  },
  {
    value: "channel",
    label: "Channel",
    holds: "A row of stones sits in a groove, held between two walls of metal with no prongs between them.",
    suits: "Bands and eternity rings. The stones must be closely matched in size.",
  },
  {
    value: "flush",
    label: "Flush",
    holds: "Each stone is set into a drilled seat so its table sits level with the metal surface.",
    suits: "Clean, low profiles that catch on nothing. Suits smaller accent stones.",
  },
] as const;

function Section({ style }: { style: (typeof STYLES)[number]["value"] }) {
  // Cross-section: stone profile (crown + pavilion) in a metal seat.
  const stone = (
    <g>
      <polygon points="110,70 190,70 175,88 125,88" fill="#8fbfff" stroke="#1055b8" strokeWidth="1.5" />
      <polygon points="125,88 175,88 150,130" fill="#1055b8" stroke="#0b3f8f" strokeWidth="1.5" />
      <line x1="118" y1="70" x2="182" y2="70" stroke="#fff" strokeOpacity="0.7" />
    </g>
  );
  const metal = "#c8a55a";
  const metalDark = "#8a6d33";
  return (
    <svg viewBox="0 0 300 170" className="ring-svg" aria-hidden="true">
      <defs>
        <linearGradient id="sm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1dfae" />
          <stop offset="1" stopColor={metalDark} />
        </linearGradient>
      </defs>
      {style === "prong" ? (
        <>
          <rect x="40" y="120" width="220" height="22" rx="4" fill="url(#sm)" />
          <path d="M 118 120 L 108 66 Q 106 58 114 62 L 122 72 Z" fill={metal} stroke={metalDark} />
          <path d="M 182 120 L 192 66 Q 194 58 186 62 L 178 72 Z" fill={metal} stroke={metalDark} />
          {stone}
        </>
      ) : style === "bezel" ? (
        <>
          <rect x="40" y="120" width="220" height="22" rx="4" fill="url(#sm)" />
          <path d="M 100 120 L 100 66 L 116 66 L 116 74 L 108 78 L 108 120 Z" fill={metal} stroke={metalDark} />
          <path d="M 200 120 L 200 66 L 184 66 L 184 74 L 192 78 L 192 120 Z" fill={metal} stroke={metalDark} />
          {stone}
        </>
      ) : style === "channel" ? (
        <>
          <rect x="40" y="120" width="220" height="22" rx="4" fill="url(#sm)" />
          <rect x="60" y="62" width="14" height="60" fill={metal} stroke={metalDark} />
          <rect x="226" y="62" width="14" height="60" fill={metal} stroke={metalDark} />
          {[92, 150, 208].map((x) => (
            <g key={x} transform={`translate(${x - 150} 0) scale(0.7) translate(64 30)`}>
              {stone}
            </g>
          ))}
        </>
      ) : (
        <>
          <rect x="40" y="70" width="220" height="72" rx="4" fill="url(#sm)" />
          <path d="M 122 70 L 178 70 L 160 104 L 140 104 Z" fill="#6f5a28" />
          <g transform="translate(0 2) scale(0.9) translate(17 8)">{stone}</g>
        </>
      )}
    </svg>
  );
}

export function SettingStyles() {
  const [style, setStyle] = useState<(typeof STYLES)[number]["value"]>("prong");
  const s = STYLES.find((x) => x.value === style) ?? STYLES[0];
  const brief = `Setting enquiry: ${s.label} setting.\n\nAbout the stone and the mount (or whether a new mount is needed):\n`;

  return (
    <ToolFrame
      title="How a stone is held."
      intro="Cut through the mount and the difference between styles is plain. Choose one to see how it grips the stone and what it suits. We will tell you which is right for your stone."
    >
      <div className="tool-grid">
        <div className="tool-controls">
          <Seg label="Setting style" options={STYLES.map((x) => ({ value: x.value, label: x.label }))} value={style} onChange={setStyle} />
          <p className="tool-out" style={{ fontSize: "1rem" }}>
            <strong>How it holds.</strong> {s.holds}
          </p>
          <p className="tool-out" style={{ fontSize: "1rem" }}>
            <strong>What it suits.</strong> {s.suits}
          </p>
        </div>
        <div className="tool-preview">
          <Section style={style} />
          <p className="muted" style={{ fontSize: "0.85rem" }}>
            Cross-section, not to scale.
          </p>
          <Link href={briefLink("setting", brief)} className="btn btn-primary">
            Ask about a {s.label.toLowerCase()} setting
          </Link>
        </div>
      </div>
    </ToolFrame>
  );
}
