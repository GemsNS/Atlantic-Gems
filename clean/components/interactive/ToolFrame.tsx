import type { ReactNode } from "react";

/** Shared chrome for the per-page interactive tools. */
export function ToolFrame({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <section className="section section-alt" aria-labelledby={`tool-${title.replace(/\W+/g, "-").toLowerCase()}`}>
      <div className="wrap">
        <div className="section-head">
          <h2 id={`tool-${title.replace(/\W+/g, "-").toLowerCase()}`} className="section-title">
            {title}
          </h2>
          <p className="lede">{intro}</p>
        </div>
        <div className="tool">{children}</div>
      </div>
    </section>
  );
}

export function Seg<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="tool-field">
      <span className="tool-label">{label}</span>
      <div className="seg" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className="seg-btn"
            aria-pressed={o.value === value}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function briefLink(type: string, brief: string): string {
  return `/contact?type=${encodeURIComponent(type)}&brief=${encodeURIComponent(brief)}`;
}
