"use client";

import Link from "next/link";
import { useState } from "react";
import { Seg, ToolFrame, briefLink } from "./ToolFrame";

const PURPOSE = [
  {
    value: "insurance",
    label: "Insurance",
    states: [
      "A full description of the item: metal, stones, measurements, marks and condition",
      "The basis of value: replacement with a new item of like kind and quality",
      "The date, the purpose, and the appraiser's signature",
    ],
    note: "Insurers usually ask for an updated appraisal every few years. Check your policy's wording.",
  },
  {
    value: "estate",
    label: "Estate or probate",
    states: [
      "The same full description of each item",
      "The basis of value: fair market value on the stated date",
      "Itemised values so pieces can be divided or settled",
    ],
    note: "Bring any earlier appraisals or receipts; they help establish provenance.",
  },
  {
    value: "resale",
    label: "Resale",
    states: [
      "The full description and condition notes",
      "The basis of value: what a willing buyer would pay today in the relevant market",
      "Any factors that affect saleability, stated plainly",
    ],
    note: "An appraisal is an opinion of value, not an offer to buy. If you want to sell, ask about consignment or a purchase offer as well.",
  },
  {
    value: "record",
    label: "Personal record",
    states: [
      "The full description and photographs",
      "The basis of value you choose, stated on the document",
      "A record you can hand on with the piece",
    ],
    note: "Useful for gifts and inheritances where no paperwork exists.",
  },
] as const;

const STAGES = [
  ["Intake", "Your piece is described, photographed and given a reference. You keep a copy."],
  ["Agreement", "We agree the reserve price, our commission, the consignment period and who insures the piece, all in writing."],
  ["Offered for sale", "The piece is described under our disclosure policy and shown to clients and, where agreed, online."],
  ["Sale", "We sell at or above the reserve. Below it, only with your written say-so."],
  ["Settlement", "You are paid within the period in the agreement once the buyer's payment clears. Unsold pieces come back as recorded."],
] as const;

export function AppraisalGuide() {
  const [tab, setTab] = useState<"appraisal" | "consignment">("appraisal");
  const [purpose, setPurpose] = useState<(typeof PURPOSE)[number]["value"]>("insurance");
  const [stage, setStage] = useState(0);
  const p = PURPOSE.find((x) => x.value === purpose) ?? PURPOSE[0];
  const current = STAGES[stage] ?? STAGES[0];

  return (
    <ToolFrame
      title="Know what you will receive."
      intro="An appraisal changes with its purpose, and a consignment runs to a fixed sequence. Pick one and see exactly what is involved before you bring anything in."
    >
      <div className="tool-grid">
        <div className="tool-controls">
          <Seg
            label="I want to"
            options={[
              { value: "appraisal", label: "Have a piece appraised" },
              { value: "consignment", label: "Sell a piece on consignment" },
            ]}
            value={tab}
            onChange={setTab}
          />
          {tab === "appraisal" ? (
            <Seg label="Purpose" options={PURPOSE.map((x) => ({ value: x.value, label: x.label }))} value={purpose} onChange={setPurpose} />
          ) : (
            <div className="tool-field">
              <span className="tool-label">Stage</span>
              <ol className="stage-list">
                {STAGES.map(([name], i) => (
                  <li key={name}>
                    <button type="button" className="seg-btn" aria-pressed={i === stage} onClick={() => setStage(i)}>
                      <span className="stage-num">{i + 1}</span> {name}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
        <div className="tool-preview">
          {tab === "appraisal" ? (
            <>
              <p className="tool-label">The document states</p>
              <ul className="steps">
                {p.states.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <p className="muted" style={{ fontSize: "0.9rem" }}>
                {p.note}
              </p>
              <Link href={briefLink("appraisal", `Appraisal enquiry: for ${p.label.toLowerCase()} purposes.\n\nThe piece(s):\n`)} className="btn btn-primary">
                Book an appraisal
              </Link>
            </>
          ) : (
            <>
              <p className="tool-label">
                Stage {stage + 1} of {STAGES.length}
              </p>
              <p className="tool-out">
                <strong>{current[0]}.</strong> {current[1]}
              </p>
              <div className="stage-bar" aria-hidden="true">
                {STAGES.map((_, i) => (
                  <span key={i} className={i <= stage ? "on" : undefined} />
                ))}
              </div>
              <Link href={briefLink("consignment", "Consignment enquiry.\n\nThe piece, what you know about it, and the price you have in mind:\n")} className="btn btn-primary">
                Ask about consignment
              </Link>
            </>
          )}
        </div>
      </div>
    </ToolFrame>
  );
}
