/** Line icons for the collection and parts counter. 24×24, 1.6 stroke. */

type P = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false as const,
};

export function SearchIcon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export function GridIcon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
    </svg>
  );
}

export function ListIcon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
    </svg>
  );
}

export function SlidersIcon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </svg>
  );
}

export function ArrowRight({ className }: P) {
  return (
    <svg {...base} className={className} width="16" height="16">
      <path d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5" />
    </svg>
  );
}

export function ChevronLeft({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}

export function ChevronRight({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function TrashIcon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M4 7h16M10 7V4.5h4V7M6.5 7l1 12.5h9l1-12.5M10.5 10.5v6M13.5 10.5v6" />
    </svg>
  );
}

/** Placeholder mark for a piece whose photograph is not on file yet. */
export function GemOutline({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M7 4h10l4 5-9 11L3 9l4-5Z" />
      <path d="M3 9h18M7 4l2 5-2 11M17 4l-2 5 2 11M9 9h6" opacity="0.55" />
    </svg>
  );
}

/** Empty-result mark: a loupe over a tray. */
export function NoResultIcon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <rect x="2.5" y="6.5" width="19" height="13" rx="2" />
      <path d="M2.5 11h19" opacity="0.5" />
      <circle cx="11" cy="15" r="3" />
      <path d="m13.4 17.4 2.6 2.6" />
    </svg>
  );
}
