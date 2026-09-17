"use client";

import { useState } from "react";
import Link from "next/link";
import type { Service, ServiceKey } from "@/lib/site";

const BOARD_ORDER: ServiceKey[] = ["custom", "repair", "setting", "appraisals", "watches"];

export function AtelierBoard({ services: available }: { services: Service[] }) {
  const items = BOARD_ORDER.map((k) => available.find((s) => s.key === k)).filter(
    (s): s is Service => Boolean(s),
  );
  const [active, setActive] = useState<ServiceKey>(items[0]?.key ?? "custom");
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
        <h3>{current.title}</h3>
        <p>{current.summary}</p>
        <ul>
          {current.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <Link href={current.href} className="btn btn-primary">
          {current.cta}
        </Link>
      </div>
    </div>
  );
}
