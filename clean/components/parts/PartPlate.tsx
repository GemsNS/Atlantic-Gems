import type { PartCategory } from "@/lib/parts/types";
import { PART_VISUALS } from "@/lib/parts/visuals";

function Motif({ kind, ink }: { kind: string; ink: string }) {
  const common = {
    fill: "none",
    stroke: ink,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (kind) {
    case "stem":
      return (
        <g {...common}>
          <circle cx="50" cy="32" r="10" />
          <line x1="50" y1="42" x2="50" y2="78" />
          <line x1="42" y1="52" x2="58" y2="52" />
          <line x1="44" y1="62" x2="56" y2="62" />
          <rect x="46" y="76" width="8" height="10" rx="1" />
        </g>
      );
    case "balance":
      return (
        <g {...common}>
          <circle cx="50" cy="50" r="28" />
          <circle cx="50" cy="50" r="8" />
          <line x1="50" y1="22" x2="50" y2="42" />
          <line x1="50" y1="58" x2="50" y2="78" />
          <line x1="22" y1="50" x2="42" y2="50" />
          <line x1="58" y1="50" x2="78" y2="50" />
          <circle cx="50" cy="22" r="3" fill={ink} stroke="none" />
        </g>
      );
    case "crystal":
      return (
        <g {...common}>
          <ellipse cx="50" cy="50" rx="30" ry="18" />
          <path d="M28 46 Q50 28 72 46" />
          <path d="M34 54 L50 38 L66 54" opacity="0.55" />
        </g>
      );
    case "pendulum":
      return (
        <g {...common}>
          <line x1="50" y1="18" x2="50" y2="62" />
          <circle cx="50" cy="74" r="12" />
          <line x1="36" y1="18" x2="64" y2="18" />
        </g>
      );
    case "ring":
      return (
        <g {...common}>
          <circle cx="42" cy="50" r="14" />
          <circle cx="58" cy="50" r="14" />
          <circle cx="50" cy="38" r="10" />
        </g>
      );
    case "tool":
      return (
        <g {...common}>
          <line x1="28" y1="72" x2="72" y2="28" />
          <path d="M68 24 L78 22 L76 32 Z" fill={ink} stroke="none" />
          <rect x="22" y="68" width="14" height="8" rx="2" transform="rotate(-45 29 72)" />
        </g>
      );
    case "cell":
      return (
        <g {...common}>
          <circle cx="50" cy="50" r="26" />
          <circle cx="50" cy="50" r="16" />
          <text
            x="50"
            y="54"
            textAnchor="middle"
            fontSize="11"
            fontFamily="var(--font-body), sans-serif"
            fontWeight="700"
            fill={ink}
            stroke="none"
          >
            +
          </text>
        </g>
      );
    case "strap":
      return (
        <g {...common}>
          <path d="M22 42 H78 V58 H22 Z" />
          <line x1="34" y1="42" x2="34" y2="58" />
          <line x1="66" y1="42" x2="66" y2="58" />
          <circle cx="28" cy="50" r="3" fill={ink} stroke="none" />
          <circle cx="72" cy="50" r="3" fill={ink} stroke="none" />
        </g>
      );
    case "tag":
      return (
        <g {...common}>
          <path d="M30 28 H62 L78 50 L62 72 H30 Z" />
          <circle cx="38" cy="50" r="4" />
        </g>
      );
    case "drop":
      return (
        <g {...common}>
          <path d="M50 22 C50 22 28 48 28 60 A22 22 0 0 0 72 60 C72 48 50 22 50 22 Z" />
          <path d="M42 58 Q50 48 58 58" opacity="0.5" />
        </g>
      );
    default:
      return (
        <g {...common}>
          <circle cx="50" cy="50" r="24" />
        </g>
      );
  }
}

export function PartPlate({
  category,
  size = "md",
  className = "",
}: {
  category: PartCategory;
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
}) {
  const v = PART_VISUALS[category];
  return (
    <div
      className={`part-plate part-plate-${size} ${className}`.trim()}
      style={{ background: v.wash }}
      aria-hidden="true"
    >
      <div className="part-plate-grid" />
      <svg className="part-plate-svg" viewBox="0 0 100 100" focusable="false">
        <Motif kind={v.motif} ink={v.ink} />
      </svg>
      <span className="part-plate-cap" style={{ color: v.ink }}>
        {v.label}
      </span>
    </div>
  );
}
