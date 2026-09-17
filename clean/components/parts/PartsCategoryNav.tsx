import Link from "next/link";
import { PART_CATEGORIES, type PartCategory } from "@/lib/parts/types";
import { PartPlate } from "@/components/parts/PartPlate";

export function PartsCategoryGrid({
  counts,
}: {
  counts: Partial<Record<PartCategory, number>>;
}) {
  return (
    <div className="parts-cat-grid">
      {PART_CATEGORIES.map((c) => {
        const n = counts[c.value] ?? 0;
        return (
          <Link key={c.value} href={`/parts/${c.value}`} className="parts-cat-tile">
            <PartPlate category={c.value} size="sm" />
            <div className="parts-cat-copy">
              <h3>{c.label}</h3>
              <p>{c.blurb}</p>
              <span className="parts-cat-count">{n ? `${n} in catalogue` : "Ask for stock"}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function PartsCategoryRail({
  active,
  counts,
}: {
  active?: PartCategory;
  counts?: Partial<Record<PartCategory, number>>;
}) {
  return (
    <nav className="parts-rail" aria-label="Parts categories">
      <Link href="/parts" className={!active ? "is-active" : undefined}>
        All
      </Link>
      {PART_CATEGORIES.map((c) => (
        <Link
          key={c.value}
          href={`/parts/${c.value}`}
          className={active === c.value ? "is-active" : undefined}
        >
          {c.label}
          {counts?.[c.value] != null ? (
            <span className="parts-rail-n">{counts[c.value]}</span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
