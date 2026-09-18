"use client";

import { toggleSaved, useSavedPieces } from "@/components/inventory/saved-store";

function Bookmark({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M6 3.75h12a1 1 0 0 1 1 1V21l-7-4.2L5 21V4.75a1 1 0 0 1 1-1Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Keeps a piece on the visitor's shortlist. On a card it is the round button
 * in the corner; `inline` gives the wider pill used on a piece page.
 */
export function SaveButton({
  id,
  title,
  inline = false,
}: {
  id: string;
  title: string;
  inline?: boolean;
}) {
  const saved = useSavedPieces();
  const on = saved.includes(id);
  const label = on ? `Remove ${title} from saved pieces` : `Save ${title} for enquiry`;

  return (
    <button
      type="button"
      className={`save-btn${inline ? " save-btn-inline" : ""}`}
      aria-pressed={on}
      aria-label={label}
      title={on ? "Saved — click to remove" : "Save for enquiry"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSaved(id);
      }}
    >
      <Bookmark filled={on} />
      {inline ? <span>{on ? "Saved" : "Save for enquiry"}</span> : null}
    </button>
  );
}
