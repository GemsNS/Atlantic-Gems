/**
 * Shared octagonal step-cut facet geometry (600x600 viewBox, centred at 300,260).
 * Used by the hero composition and the gem explorer so the house visual
 * language stays consistent.
 */
export const OUTER: [number, number][] = [
  [225, 170],
  [375, 170],
  [410, 205],
  [410, 315],
  [375, 350],
  [225, 350],
  [190, 315],
  [190, 205],
];

export const TABLE: [number, number][] = [
  [259, 211],
  [341, 211],
  [361, 230],
  [361, 290],
  [341, 310],
  [259, 310],
  [240, 290],
  [240, 230],
];

export const MID: [number, number][] = OUTER.map(([x, y], i) => {
  const [tx, ty] = TABLE[i] ?? [x, y];
  return [(x + tx) / 2, (y + ty) / 2];
});

const pts = (p: [number, number][]) => p.map(([x, y]) => `${x},${y}`).join(" ");

interface FacetedStoneProps {
  /** Gradient id prefix so several stones can co-exist on one page. */
  id: string;
  base: string;
  highlight: string;
  /** Extra class applied to each facet polygon (hover shimmer). */
  facetClass?: string;
  opacity?: number;
}

/** Renders crown facets (outer→mid), a step (mid→table) and the table. */
export function FacetedStone({
  id,
  base,
  highlight,
  facetClass = "facet",
  opacity = 1,
}: FacetedStoneProps) {
  const ring = (a: [number, number][], b: [number, number][], key: string, alphaBase: number) =>
    a.map((_, i) => {
      const n = (i + 1) % a.length;
      const a0 = a[i];
      const a1 = a[n];
      const b0 = b[i];
      const b1 = b[n];
      if (!a0 || !a1 || !b0 || !b1) return null;
      // Alternate light/dark facets to suggest refraction.
      const alpha = alphaBase + (i % 2 === 0 ? 0.18 : 0) + (i % 3 === 0 ? 0.08 : 0);
      return (
        <polygon
          key={`${key}-${i}`}
          className={facetClass}
          points={pts([a0, a1, b1, b0])}
          fill={`url(#${id}-g${i % 4})`}
          opacity={Math.min(1, alpha)}
          stroke={highlight}
          strokeOpacity="0.35"
          strokeWidth="0.75"
        />
      );
    });

  return (
    <g opacity={opacity}>
      <defs>
        {[0, 1, 2, 3].map((k) => (
          <linearGradient
            key={k}
            id={`${id}-g${k}`}
            x1={k % 2 ? "1" : "0"}
            y1={k < 2 ? "0" : "1"}
            x2={k % 2 ? "0" : "1"}
            y2={k < 2 ? "1" : "0"}
          >
            <stop offset="0" stopColor={highlight} stopOpacity="0.95" />
            <stop offset="0.45" stopColor={base} />
            <stop offset="1" stopColor="#05080b" />
          </linearGradient>
        ))}
        <radialGradient id={`${id}-table`} cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor={highlight} stopOpacity="0.9" />
          <stop offset="0.5" stopColor={base} />
          <stop offset="1" stopColor="#05080b" />
        </radialGradient>
      </defs>
      {ring(OUTER, MID, "crown", 0.62)}
      {ring(MID, TABLE, "step", 0.78)}
      <polygon
        className={facetClass}
        points={pts(TABLE)}
        fill={`url(#${id}-table)`}
        stroke={highlight}
        strokeOpacity="0.5"
        strokeWidth="0.75"
      />
      <polygon points={pts(OUTER)} fill="none" stroke={highlight} strokeOpacity="0.6" strokeWidth="1" />
    </g>
  );
}
