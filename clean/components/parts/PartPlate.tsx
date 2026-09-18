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
 * Each tray has three drawn variants so a shelf of five Bergeon tools does not
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

    // ---- Clock movements: pendulum, gong, winding key --------------------
    case "pendulum":
      if (variant === 1)
        return (
          <g {...c}>
            <path d="M28 70 Q50 20 72 70" />
            <circle cx="28" cy="70" r="4" {...solid} />
            <circle cx="72" cy="70" r="4" {...solid} />
            <path d="M50 24v-6" />
          </g>
        );
      if (variant === 2)
        return (
          <g {...c}>
            <circle cx="50" cy="32" r="11" />
            <rect x="44" y="43" width="12" height="30" rx="2" />
            <path d="M38 78h24" strokeWidth="2.4" />
          </g>
        );
      return (
        <g {...c}>
          <line x1="50" y1="18" x2="50" y2="62" />
          <circle cx="50" cy="74" r="12" />
          <line x1="36" y1="18" x2="64" y2="18" />
        </g>
      );

    // ---- Findings: jump rings, lobster clasp, pins -----------------------
    case "ring":
      if (variant === 1)
        return (
          <g {...c}>
            <path d="M36 32 Q26 46 34 60 Q44 74 58 66 Q68 58 62 46" />
            <path d="M38 44 H58" opacity="0.7" />
            <circle cx="66" cy="34" r="7" />
          </g>
        );
      if (variant === 2)
        return (
          <g {...c}>
            <circle cx="34" cy="34" r="7" />
            <line x1="39" y1="39" x2="72" y2="72" strokeWidth="2.2" />
            <path d="M66 72 h10" opacity="0.6" />
          </g>
        );
      return (
        <g {...c}>
          <circle cx="42" cy="50" r="14" />
          <circle cx="58" cy="50" r="14" />
          <circle cx="50" cy="38" r="10" />
        </g>
      );

    // ---- Tools: driver, pliers, loupe ------------------------------------
    case "tool":
      if (variant === 1)
        return (
          <g {...c}>
            <path d="M30 76 L52 48 M70 76 L48 48" strokeWidth="2.2" />
            <path d="M52 48 Q50 34 42 24" />
            <path d="M48 48 Q50 34 58 24" />
            <circle cx="50" cy="50" r="2.6" {...solid} />
          </g>
        );
      if (variant === 2)
        return (
          <g {...c}>
            <circle cx="44" cy="44" r="17" />
            <circle cx="44" cy="44" r="11" opacity="0.5" />
            <path d="M56 56 L76 76" strokeWidth="2.6" />
          </g>
        );
      return (
        <g {...c}>
          <line x1="28" y1="72" x2="72" y2="28" />
          <path d="M68 24 L78 22 L76 32 Z" {...solid} />
          <rect x="22" y="68" width="14" height="8" rx="2" transform="rotate(-45 29 72)" />
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

    // ---- Packaging: tag, box, envelope -----------------------------------
    case "tag":
      if (variant === 1)
        return (
          <g {...c}>
            <path d="M26 42 L50 30 L74 42 L50 54 Z" />
            <path d="M26 42v22l24 12 24-12V42" />
            <path d="M50 54v22" opacity="0.5" />
          </g>
        );
      if (variant === 2)
        return (
          <g {...c}>
            <rect x="24" y="34" width="52" height="32" rx="2" />
            <path d="M24 34 L50 54 L76 34" />
          </g>
        );
      return (
        <g {...c}>
          <path d="M30 28 H62 L78 50 L62 72 H30 Z" />
          <circle cx="38" cy="50" r="4" />
        </g>
      );

    // ---- Cleaners: drop, oiler, bottle ------------------------------------
    case "drop":
      if (variant === 1)
        return (
          <g {...c}>
            <path d="M44 22h12v10l-4 6v34a4 4 0 0 1-4 4 4 4 0 0 1-4-4V38l-4-6V22" />
            <path d="M40 60h20" opacity="0.5" />
          </g>
        );
      if (variant === 2)
        return (
          <g {...c}>
            <rect x="36" y="34" width="28" height="42" rx="4" />
            <path d="M44 34V24h12v10" />
            <path d="M36 50h28" opacity="0.5" />
          </g>
        );
      return (
        <g {...c}>
          <path d="M50 22 C50 22 28 48 28 60 A22 22 0 0 0 72 60 C72 48 50 22 50 22 Z" />
          <path d="M42 58 Q50 48 58 58" opacity="0.5" />
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
