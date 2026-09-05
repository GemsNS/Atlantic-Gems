"use client";

import { useState } from "react";
import Link from "next/link";
import { FacetedStone } from "@/components/GemGeometry";

/**
 * Category copy is general gemmology only. No provenance, origin, treatment
 * or pricing claims are made about Atlantic Gems stock.
 */
const STONES = [
  {
    key: "ruby",
    name: "Ruby",
    family: "Corundum, red variety",
    base: "#a6152f",
    hi: "#ff7a90",
    copy:
      "Red corundum. Colour saturation and tone drive value more than any other factor, so each stone is quoted individually.",
    facts: [
      ["Mineral", "Corundum (Al₂O₃)"],
      ["Hardness", "9 on the Mohs scale"],
      ["Forms offered", "Rough and faceted"],
      ["Disclosure", "Treatment, origin and certificate on request"],
    ],
  },
  {
    key: "sapphire",
    name: "Sapphire",
    family: "Corundum, blue and fancy colours",
    base: "#1e4f9c",
    hi: "#8fbfff",
    copy:
      "Corundum in every colour other than red. Blue is the classic, with fancy colours enquired for by name.",
    facts: [
      ["Mineral", "Corundum (Al₂O₃)"],
      ["Hardness", "9 on the Mohs scale"],
      ["Forms offered", "Rough and faceted"],
      ["Disclosure", "Treatment, origin and certificate on request"],
    ],
  },
  {
    key: "emerald",
    name: "Emerald",
    family: "Beryl, green variety",
    base: "#0f7a55",
    hi: "#7fe6b8",
    copy:
      "Green beryl. Most emeralds on the market are clarity-enhanced, so ask for the treatment status of any stone we quote.",
    facts: [
      ["Mineral", "Beryl (Be₃Al₂Si₆O₁₈)"],
      ["Hardness", "7.5 to 8 on the Mohs scale"],
      ["Forms offered", "Rough and faceted"],
      ["Disclosure", "Treatment, origin and certificate on request"],
    ],
  },
  {
    key: "diamond",
    name: "Diamond",
    family: "Crystalline carbon",
    base: "#9fb6c8",
    hi: "#ffffff",
    copy:
      "Tell us whether you require natural or laboratory-grown material and the grading you expect; we confirm what is available before quoting.",
    facts: [
      ["Mineral", "Carbon (C)"],
      ["Hardness", "10 on the Mohs scale"],
      ["Forms offered", "Rough and faceted"],
      ["Disclosure", "Natural or lab-grown stated in writing on every quote"],
    ],
  },
] as const;

type StoneKey = (typeof STONES)[number]["key"];

export function GemExplorer() {
  const [active, setActive] = useState<StoneKey>("sapphire");
  const stone = STONES.find((s) => s.key === active) ?? STONES[1];

  return (
    <div className="explorer">
      <div className="explorer-stage" aria-hidden="true">
        <svg viewBox="0 0 600 600">
          <FacetedStone
            key={stone.key}
            id={`ex-${stone.key}`}
            base={stone.base}
            highlight={stone.hi}
          />
        </svg>
      </div>

      <div className="explorer-panel">
        <div role="tablist" aria-label="Gemstone categories" className="stone-tabs">
          {STONES.map((s) => (
            <button
              key={s.key}
              role="tab"
              type="button"
              className="stone-tab"
              aria-selected={s.key === active}
              aria-controls={`stone-panel-${s.key}`}
              id={`stone-tab-${s.key}`}
              onClick={() => setActive(s.key)}
              style={{ ["--stone" as string]: s.base, ["--stone-hi" as string]: s.hi }}
            >
              <span className="dot" aria-hidden="true" />
              {s.name}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`stone-panel-${stone.key}`}
          aria-labelledby={`stone-tab-${stone.key}`}
        >
          <h3>{stone.name}</h3>
          <div className="family">{stone.family}</div>
          <p>{stone.copy}</p>
          <ul className="facts">
            {stone.facts.map(([k, v]) => (
              <li key={k}>
                <span className="k">{k}</span>
                <span className="v">{v}</span>
              </li>
            ))}
          </ul>
          <p className="explorer-note">
            Every stone is quoted individually. Current parcels are shown by appointment or
            through trade access.
          </p>
          <Link href="/contact?type=gemstones" className="btn btn-ghost">
            Request {stone.name.toLowerCase()} stones
          </Link>
        </div>
      </div>
    </div>
  );
}
