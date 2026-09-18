import type { PartCategory } from "@/lib/parts/types";
import { PART_VISUALS } from "@/lib/parts/visuals";

type Common = {
  fill: "none";
  stroke: string;
  strokeWidth: number;
  strokeLinecap: "round";
  strokeLinejoin: "round";
};

/**
 * Each tray has three drawn variants so a shelf of five like lines does not
 * read as five copies of the same picture. The variant is chosen from the SKU,
 * so a given line always shows the same plate.
 */
function Motif({ kind, variant, ink }: { kind: string; variant: number; ink: string }) {
  const c: Common = {
    fill: "none",
    stroke: ink,
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  const solid = { fill: ink, stroke: "none" };

  switch (kind) {
    // ---- Rough gems: faceted lump, upright point, twinned pair ----------
    case "rough":
      if (variant === 1)
        return (
          <g {...c}>
            <path d="M50 16 L66 40 L60 78 H40 L34 40 Z" />
            <path d="M34 40 H66M50 16 V78" opacity="0.45" />
            <path d="M40 78 L50 52 L60 78" opacity="0.3" />
          </g>
        );
      if (variant === 2)
        return (
          <g {...c}>
            <path d="M24 56 L34 30 L48 40 L44 70 Z" />
            <path d="M48 40 L62 22 L76 48 L64 74 L44 70 Z" />
            <path d="M62 22 L64 74M48 40 L76 48" opacity="0.4" />
          </g>
        );
      return (
        <g {...c}>
          <path d="M30 34 L52 22 L74 38 L68 66 L44 74 L26 58 Z" />
          <path d="M52 22 L48 50 L74 38M48 50 L44 74M48 50 L26 58" opacity="0.42" />
        </g>
      );

    // ---- Loose diamonds: round brilliant, step cut, pear -----------------
    case "brilliant":
      if (variant === 1)
        return (
          <g {...c}>
            <path d="M30 40 H70 L50 76 Z" />
            <path d="M30 40 L38 28 H62 L70 40" />
            <path d="M38 28 L44 40 L50 28M62 28 L56 40 L50 28" opacity="0.5" />
            <path d="M44 40 L50 76 L56 40" opacity="0.35" />
          </g>
        );
      if (variant === 2)
        return (
          <g {...c}>
            <rect x="28" y="30" width="44" height="40" rx="3" />
            <rect x="36" y="38" width="28" height="24" rx="2" opacity="0.6" />
            <path d="M28 30 L36 38M72 30 L64 38M28 70 L36 62M72 70 L64 62" opacity="0.45" />
          </g>
        );
      return (
        <g {...c}>
          <path d="M50 20 C62 38 70 50 70 60 A20 20 0 0 1 30 60 C30 50 38 38 50 20 Z" />
          <path d="M50 20 V80M34 54 H66" opacity="0.38" />
          <circle cx="50" cy="60" r="12" opacity="0.28" />
        </g>
      );

    // ---- Watch parts: crown and stem, hands, case screws -----------------
    case "stem":
      if (variant === 1)
        return (
          <g {...c}>
            <circle cx="50" cy="50" r="3" {...solid} />
            <path d="M50 50 L50 20" strokeWidth="2.6" />
            <path d="M50 50 L74 62" strokeWidth="2" />
            <path d="M50 50 L34 66" strokeWidth="1.2" />
            <circle cx="50" cy="50" r="26" opacity="0.28" />
          </g>
        );
      if (variant === 2)
        return (
          <g {...c}>
            <circle cx="50" cy="50" r="27" />
            <circle cx="50" cy="50" r="13" />
            {[0, 60, 120, 180, 240, 300].map((a) => {
              const r = (a * Math.PI) / 180;
              return (
                <circle
                  key={a}
                  cx={50 + Math.cos(r) * 21}
                  cy={50 + Math.sin(r) * 21}
                  r="3.2"
                />
              );
            })}
          </g>
        );
      return (
        <g {...c}>
          <circle cx="50" cy="32" r="10" />
          <line x1="50" y1="42" x2="50" y2="78" />
          <line x1="42" y1="52" x2="58" y2="52" />
          <line x1="44" y1="62" x2="56" y2="62" />
          <rect x="46" y="76" width="8" height="10" rx="1" />
        </g>
      );

    // ---- Movements: balance, gear train, barrel --------------------------
    case "balance":
      if (variant === 1)
        return (
          <g {...c}>
            <circle cx="38" cy="42" r="16" />
            <circle cx="38" cy="42" r="4" />
            <circle cx="64" cy="60" r="12" />
            <circle cx="64" cy="60" r="3" />
            <path d="M38 26v-5M38 58v5M22 42h-5M54 42h5" opacity="0.6" />
            <path d="M64 48v-4M64 72v4M52 60h-4M76 60h4" opacity="0.6" />
          </g>
        );
      if (variant === 2)
        return (
          <g {...c}>
            <circle cx="50" cy="50" r="26" />
            <path d="M50 24c-9 6-9 14 0 20s9 14 0 20" opacity="0.7" />
            <path d="M50 24c9 6 9 14 0 20s-9 14 0 20" opacity="0.4" />
            <circle cx="50" cy="50" r="4" {...solid} />
          </g>
        );
      return (
        <g {...c}>
          <circle cx="50" cy="50" r="28" />
          <circle cx="50" cy="50" r="8" />
          <line x1="50" y1="22" x2="50" y2="42" />
          <line x1="50" y1="58" x2="50" y2="78" />
          <line x1="22" y1="50" x2="42" y2="50" />
          <line x1="58" y1="50" x2="78" y2="50" />
          <circle cx="50" cy="22" r="3" {...solid} />
        </g>
      );

    // ---- Crystals: domed, flat with bevel, faceted sapphire --------------
    case "crystal":
      if (variant === 1)
        return (
          <g {...c}>
            <circle cx="50" cy="50" r="28" />
            <circle cx="50" cy="50" r="22" opacity="0.6" />
            <path d="M32 38 L68 62" opacity="0.3" />
          </g>
        );
      if (variant === 2)
        return (
          <g {...c}>
            <path d="M28 44 L50 26 L72 44 L62 72 H38 Z" />
            <path d="M28 44 H72M38 72 L50 26 L62 72" opacity="0.45" />
          </g>
        );
      return (
        <g {...c}>
          <ellipse cx="50" cy="50" rx="30" ry="18" />
          <path d="M28 46 Q50 28 72 46" />
          <path d="M34 54 L50 38 L66 54" opacity="0.55" />
        </g>
      );

    // ---- Batteries: cell face, stacked cells, polarity -------------------
    case "cell":
      if (variant === 1)
        return (
          <g {...c}>
            <ellipse cx="50" cy="38" rx="24" ry="8" />
            <path d="M26 38v16a24 8 0 0 0 48 0V38" />
            <path d="M26 54v6a24 8 0 0 0 48 0v-6" opacity="0.45" />
          </g>
        );
      if (variant === 2)
        return (
          <g {...c}>
            <circle cx="50" cy="50" r="25" />
            <path d="M40 50h-8M36 46v8" opacity="0.8" />
            <path d="M60 50h8" opacity="0.8" />
            <path d="M50 28a22 22 0 0 1 0 44" opacity="0.35" />
          </g>
        );
      return (
        <g {...c}>
          <circle cx="50" cy="50" r="26" />
          <circle cx="50" cy="50" r="16" />
          <path d="M50 44v12M44 50h12" strokeWidth="2" />
        </g>
      );

    // ---- Straps: strap bar, buckle, curved strap -------------------------
    case "strap":
      if (variant === 1)
        return (
          <g {...c}>
            <rect x="32" y="30" width="36" height="26" rx="4" />
            <path d="M32 43h36" opacity="0.5" />
            <path d="M44 56v18M56 56v18" />
            <path d="M44 74h12" />
          </g>
        );
      if (variant === 2)
        return (
          <g {...c}>
            <path d="M26 34 Q50 46 74 34" />
            <path d="M26 34 V60 Q50 72 74 60 V34" />
            <circle cx="42" cy="48" r="2.4" {...solid} />
            <circle cx="50" cy="50" r="2.4" {...solid} />
            <circle cx="58" cy="48" r="2.4" {...solid} />
          </g>
        );
      return (
        <g {...c}>
          <path d="M22 42 H78 V58 H22 Z" />
          <line x1="34" y1="42" x2="34" y2="58" />
          <line x1="66" y1="42" x2="66" y2="58" />
          <circle cx="28" cy="50" r="3" {...solid} />
          <circle cx="72" cy="50" r="3" {...solid} />
        </g>
      );

    default:
      return (
        <g {...c}>
          <circle cx="50" cy="50" r="24" />
        </g>
      );
  }
}

/** Stable small hash so the same SKU always draws the same plate. */
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function PartPlate({
  category,
  size = "md",
  seed,
  className = "",
}: {
  category: PartCategory;
  size?: "sm" | "md" | "lg" | "hero";
  /** Usually a SKU: picks the drawn variant and tilts the wash. */
  seed?: string;
  className?: string;
}) {
  const v = PART_VISUALS[category];
  const n = seed ? hash(seed) : 0;
  const variant = n % 3;
  const wash = v.wash.replace(/^linear-gradient\((\d+)deg/, (_m, deg: string) =>
    `linear-gradient(${(Number(deg) + variant * 24) % 360}deg`,
  );

  return (
    <div
      className={`part-plate part-plate-${size} ${className}`.trim()}
      style={{ background: wash }}
      aria-hidden="true"
    >
      <div className="part-plate-grid" />
      <div
        className="part-plate-ring"
        style={{ color: v.ink, inset: `${11 + variant * 3}%` }}
      />
      <svg className="part-plate-svg" viewBox="0 0 100 100" focusable={false}>
        <Motif kind={v.motif} variant={variant} ink={v.ink} />
      </svg>
      <span className="part-plate-cap" style={{ color: v.ink }}>
        {v.label}
      </span>
    </div>
  );
}
