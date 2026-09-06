"use client";

import Link from "next/link";
import { useState } from "react";

const PATHS = [
  {
    key: "buy",
    label: "Buying",
    title: "New and pre-owned pieces, described honestly.",
    body: "Pieces from our collection are shown by appointment and, when the shop is open, online. Every one is described under our disclosure policy: metal as stamped or tested, stones as measured, condition as found.",
    cta: { label: "Ask about a piece", href: "/contact?type=jewellery" },
  },
  {
    key: "sell",
    label: "Selling",
    title: "Sell outright, trade in, or consign.",
    body: "Bring what you no longer wear. We can make a purchase offer, take it in trade against something new, or sell it for you on consignment under a written agreement with an agreed reserve.",
    cta: { label: "Ask about selling", href: "/contact?type=sell" },
  },
  {
    key: "source",
    label: "Sourcing",
    title: "A specific piece, found for you.",
    body: "Tell us the piece, the metal, the budget and whether new or pre-owned will do. We search the trade and report back with what exists and what it would cost, before you commit to anything.",
    cta: { label: "Send a sourcing brief", href: "/jewellery#tool-tell-us-what-you-are-looking-for-" },
  },
] as const;

export function JewelleryPaths() {
  const [key, setKey] = useState<(typeof PATHS)[number]["key"]>("buy");
  const p = PATHS.find((x) => x.key === key) ?? PATHS[0];
  return (
    <div className="paths">
      <div className="seg seg-large" role="tablist" aria-label="Jewellery services">
        {PATHS.map((x) => (
          <button
            key={x.key}
            type="button"
            role="tab"
            className="seg-btn"
            aria-selected={x.key === key}
            onClick={() => setKey(x.key)}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div className="paths-panel" role="tabpanel">
        <h3>{p.title}</h3>
        <p className="lede">{p.body}</p>
        <Link href={p.cta.href} className="btn btn-primary">
          {p.cta.label}
        </Link>
      </div>
    </div>
  );
}
