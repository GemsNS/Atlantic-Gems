"use client";

import Link from "next/link";
import { useState } from "react";
import { Seg, ToolFrame, briefLink } from "./ToolFrame";

const ITEM = [
  { value: "ring", label: "Ring" },
  { value: "chain or necklace", label: "Chain or necklace" },
  { value: "bracelet", label: "Bracelet" },
  { value: "earrings", label: "Earrings" },
  { value: "watch", label: "Watch" },
  { value: "other piece", label: "Other" },
] as const;

const ISSUE = [
  {
    value: "resize",
    label: "Needs resizing",
    next: "We measure the piece and your finger, check the setting can take the change, and quote in writing.",
    bring: "The ring, and any certificate or appraisal you have for its stones.",
  },
  {
    value: "polish",
    label: "Dull or scratched",
    next: "We assess how much metal a polish would remove and whether refinishing suits the piece before quoting.",
    bring: "The piece as it is. Do not clean it with anything abrasive first.",
  },
  {
    value: "broken",
    label: "Broken or damaged",
    next: "We examine the break under magnification, identify the metal and quote the repair, or tell you if repair is not worthwhile.",
    bring: "Every piece, including any fragments that came away.",
  },
  {
    value: "stone",
    label: "Stone loose or missing",
    next: "We check every setting on the piece, not just the one that failed, and quote for tightening or replacement.",
    bring: "The piece and the loose stone if you have it, in a sealed bag.",
  },
  {
    value: "restoration",
    label: "Older piece to restore",
    next: "We document the piece, advise what should be conserved rather than replaced, and quote the work in stages.",
    bring: "The piece and anything you know about its history.",
  },
  {
    value: "unsure",
    label: "Not sure",
    next: "We look at it together at the bench and tell you plainly what it needs, in writing.",
    bring: "The piece. That is all.",
  },
] as const;

export function RepairTriage() {
  const [item, setItem] = useState<(typeof ITEM)[number]["value"]>("ring");
  const [issue, setIssue] = useState<(typeof ISSUE)[number]["value"]>("resize");
  const found = ISSUE.find((i) => i.value === issue) ?? ISSUE[0];

  const brief = `Repair enquiry: ${item}, ${found.label.toLowerCase()}.\n\nWhat happened and when you need it back:\n`;

  return (
    <ToolFrame
      title="What does it need?"
      intro="Pick the piece and the problem. We show you what happens at intake and what to bring, so there are no surprises."
    >
      <div className="tool-grid">
        <div className="tool-controls">
          <Seg label="Piece" options={[...ITEM]} value={item} onChange={setItem} />
          <Seg label="Problem" options={ISSUE.map((i) => ({ value: i.value, label: i.label }))} value={issue} onChange={setIssue} />
        </div>
        <div className="tool-preview">
          <ol className="steps">
            <li>
              <strong>Intake.</strong> Your {item} is described and photographed, and you leave with a copy.
            </li>
            <li>
              <strong>Assessment.</strong> {found.next}
            </li>
            <li>
              <strong>Your say.</strong> Nothing proceeds until you approve the written estimate.
            </li>
          </ol>
          <p className="tool-out" style={{ fontSize: "1rem" }}>
            <strong>Bring:</strong> {found.bring}
          </p>
          <Link href={briefLink("repair", brief)} className="btn btn-primary">
            Book this repair
          </Link>
        </div>
      </div>
    </ToolFrame>
  );
}
