"use client";

import Link from "next/link";
import { useState } from "react";
import { Seg, ToolFrame, briefLink } from "./ToolFrame";

const CASES = [34, 36, 38, 40, 42, 44] as const;

export function WristSizer() {
  const [wrist, setWrist] = useState(170); // circumference, mm
  const [caseMm, setCaseMm] = useState<(typeof CASES)[number]>(40);

  // Wrist top width is roughly a third of circumference for a typical cross-section.
  const wristWidth = wrist / 2.9;
  const coverage = Math.round((caseMm / wristWidth) * 100);
  const lugToLug = Math.round(caseMm * 1.18);
  const verdict =
    coverage < 60
      ? "sits small and understated"
      : coverage <= 78
        ? "sits in proportion"
        : coverage <= 90
          ? "wears large"
          : "will overhang the wrist";

  // Drawing scale: 1 mm = 2.6 px in a 300-wide box.
  const px = (mm: number) => mm * 2.6;
  const cx = 150;
  return (
    <ToolFrame
      title="Find the case size that suits you."
      intro="Measure your wrist with a strip of paper, set it here, and compare case diameters at scale before you ask us to source a reference."
    >
      <div className="tool-grid">
        <div className="tool-controls">
          <div className="tool-field">
            <label className="tool-label" htmlFor="wrist">
              Wrist circumference: <strong>{wrist} mm</strong> ({(wrist / 25.4).toFixed(1)} in)
            </label>
            <input
              id="wrist"
              className="range"
              type="range"
              min={140}
              max={220}
              step={1}
              value={wrist}
              onChange={(e) => setWrist(Number(e.target.value))}
            />
          </div>
          <Seg label="Case diameter" options={CASES.map((c) => ({ value: c, label: `${c} mm` }))} value={caseMm} onChange={setCaseMm} />
          <p className="tool-out" style={{ fontSize: "1rem" }}>
            A <strong>{caseMm} mm</strong> case covers about <strong>{coverage}%</strong> of a{" "}
            {wrist} mm wrist, so it <strong>{verdict}</strong>. Typical lug-to-lug for this size is
            around {lugToLug} mm; keep that under your wrist width of about {Math.round(wristWidth)} mm.
          </p>
        </div>
        <div className="tool-preview">
          <svg viewBox="0 0 300 200" className="ring-svg" aria-hidden="true">
            {/* wrist, top-down */}
            <rect x={cx - px(wristWidth) / 2} y="20" width={px(wristWidth)} height="160" rx={px(wristWidth) / 2.6} fill="#f1e2d3" stroke="#d9c2ad" />
            {/* strap */}
            <rect x={cx - px(caseMm) * 0.28} y="20" width={px(caseMm) * 0.56} height="160" fill="#2b3a52" opacity="0.9" />
            {/* case */}
            <circle cx={cx} cy="100" r={px(caseMm) / 2} fill="#e9eef4" stroke="#8fa1b8" strokeWidth="3" />
            <circle cx={cx} cy="100" r={px(caseMm) / 2 - 7} fill="#0e1c33" />
            <circle cx={cx} cy="100" r="2.5" fill="#c8a55a" />
            <line x1={cx} y1="100" x2={cx} y2={100 - px(caseMm) / 2 + 14} stroke="#fff" strokeWidth="2" />
            <line x1={cx} y1="100" x2={cx + px(caseMm) / 2 - 18} y2="100" stroke="#fff" strokeWidth="1.5" />
            {/* lugs */}
            <rect x={cx - px(caseMm) * 0.3} y={100 - px(lugToLug) / 2} width={px(caseMm) * 0.6} height="8" fill="#8fa1b8" />
            <rect x={cx - px(caseMm) * 0.3} y={100 + px(lugToLug) / 2 - 8} width={px(caseMm) * 0.6} height="8" fill="#8fa1b8" />
          </svg>
          <p className="muted" style={{ fontSize: "0.85rem" }}>
            To scale with each other; a guide, not a fitting.
          </p>
          <Link href={briefLink("watches", `Watch enquiry: sourcing a reference around ${caseMm} mm for a ${wrist} mm wrist.\n\nBrand, model or style, budget, new or pre-owned:\n`)} className="btn btn-primary">
            Source a watch in this size
          </Link>
        </div>
      </div>
    </ToolFrame>
  );
}
