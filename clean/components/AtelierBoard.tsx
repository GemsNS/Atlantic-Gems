"use client";

import { useState } from "react";
import Link from "next/link";
import { services, type ServiceKey } from "@/lib/site";

const BOARD: ServiceKey[] = ["custom", "repair", "setting", "watches"];

export function AtelierBoard() {
  const [active, setActive] = useState<ServiceKey>("custom");
  const items = BOARD.map((k) => services.find((s) => s.key === k)).filter(
    (s): s is NonNullable<typeof s> => Boolean(s),
  );
  const current = items.find((s) => s.key === active) ?? items[0];
  if (!current) return null;

  return (
    <div className="atelier">
      <div className="atelier-list" role="tablist" aria-label="Atelier services">
        {items.map((s, i) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            id={`atelier-tab-${s.key}`}
            aria-selected={s.key === active}
            aria-controls="atelier-panel"
            onClick={() => setActive(s.key)}
          >
            <span>{s.title}</span>
            <small>0{i + 1}</small>
          </button>
        ))}
      </div>
      <div
        className="atelier-panel"
        role="tabpanel"
        id="atelier-panel"
        aria-labelledby={`atelier-tab-${current.key}`}
      >
        <p className="eyebrow">{current.short}</p>
        <h3>{current.title}</h3>
        <p className="lede">{current.summary}</p>
        <ul>
          {current.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <Link href={`/contact?type=${current.key}`} className="btn btn-primary">
          {current.cta}
        </Link>
      </div>
    </div>
  );
}
