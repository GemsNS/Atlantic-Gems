"use client";

import Link from "next/link";
import { useState } from "react";
import { Seg, ToolFrame, briefLink } from "./ToolFrame";

const KIND = [
  { value: "ring", label: "Ring" },
  { value: "necklace", label: "Necklace or pendant" },
  { value: "bracelet", label: "Bracelet" },
  { value: "earrings", label: "Earrings" },
  { value: "watch", label: "Watch" },
  { value: "other", label: "Something else" },
] as const;
const COND = [
  { value: "either", label: "New or pre-owned" },
  { value: "new", label: "New only" },
  { value: "pre-owned", label: "Pre-owned only" },
] as const;
const METAL = [
  { value: "any", label: "Any metal" },
  { value: "yellow gold", label: "Yellow gold" },
  { value: "white gold", label: "White gold" },
  { value: "rose gold", label: "Rose gold" },
  { value: "platinum", label: "Platinum" },
  { value: "silver", label: "Silver" },
] as const;
const BUDGET = [
  { value: "under CAD 1,000", label: "Under 1,000" },
  { value: "CAD 1,000 to 2,500", label: "1,000 to 2,500" },
  { value: "CAD 2,500 to 5,000", label: "2,500 to 5,000" },
  { value: "CAD 5,000 to 10,000", label: "5,000 to 10,000" },
  { value: "over CAD 10,000", label: "Over 10,000" },
  { value: "to be discussed", label: "Prefer to discuss" },
] as const;

export function SourcingBrief() {
  const [kind, setKind] = useState<(typeof KIND)[number]["value"]>("ring");
  const [cond, setCond] = useState<(typeof COND)[number]["value"]>("either");
  const [metal, setMetal] = useState<(typeof METAL)[number]["value"]>("any");
  const [budget, setBudget] = useState<(typeof BUDGET)[number]["value"]>("to be discussed");
  const [tradeIn, setTradeIn] = useState(false);

  const kindLabel = KIND.find((k) => k.value === kind)?.label.toLowerCase() ?? kind;
  const condText = cond === "either" ? "new or pre-owned" : cond;
  const brief =
    `Sourcing brief: a ${condText} ${kindLabel}` +
    (metal === "any" ? "" : ` in ${metal}`) +
    `. Budget ${budget}.` +
    (tradeIn ? " I also have a piece to sell or trade in." : "") +
    "\n\nDetails (stones, style, occasion, timing):\n";

  return (
    <ToolFrame
      title="Tell us what you are looking for."
      intro="Set the brief and we will reply with what is in the collection now and what we can source. Nothing is committed until you see a written quotation."
    >
      <div className="tool-grid">
        <div className="tool-controls">
          <Seg label="Piece" options={[...KIND]} value={kind} onChange={setKind} />
          <Seg label="Condition" options={[...COND]} value={cond} onChange={setCond} />
          <Seg label="Metal" options={[...METAL]} value={metal} onChange={setMetal} />
          <Seg label="Budget (CAD)" options={[...BUDGET]} value={budget} onChange={setBudget} />
          <label className="check" style={{ marginTop: 6 }}>
            <input type="checkbox" checked={tradeIn} onChange={(e) => setTradeIn(e.target.checked)} />
            <span>I have a piece to sell or trade in against this purchase.</span>
          </label>
        </div>
        <div className="tool-preview">
          <p className="tool-label">Your brief</p>
          <p className="tool-out">
            A <strong>{condText}</strong> <strong>{kindLabel}</strong>
            {metal === "any" ? "" : <> in <strong>{metal}</strong></>}, budget <strong>{budget}</strong>
            {tradeIn ? ", with a trade-in" : ""}.
          </p>
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            Pre-owned pieces are described with their condition and any wear noted. New pieces are
            supplied with the maker&apos;s documentation where it exists.
          </p>
          <Link href={briefLink(tradeIn ? "sell" : "sourcing", brief)} className="btn btn-primary">
            Send this brief
          </Link>
        </div>
      </div>
    </ToolFrame>
  );
}
