/** Simple faceted-octagon mark used in header, footer and favicon. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="bm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e6c986" />
          <stop offset="1" stopColor="#9a7b3c" />
        </linearGradient>
      </defs>
      <polygon
        points="10,3 22,3 29,10 29,22 22,29 10,29 3,22 3,10"
        fill="none"
        stroke="url(#bm)"
        strokeWidth="1.5"
      />
      <polygon
        points="13,10 19,10 22,13 22,19 19,22 13,22 10,19 10,13"
        fill="url(#bm)"
        opacity="0.9"
      />
      <path
        d="M10 3 13 10M22 3 19 10M29 10 22 13M29 22 22 19M22 29 19 22M10 29 13 22M3 22 10 19M3 10 10 13"
        stroke="url(#bm)"
        strokeWidth="1"
        opacity="0.7"
      />
    </svg>
  );
}
