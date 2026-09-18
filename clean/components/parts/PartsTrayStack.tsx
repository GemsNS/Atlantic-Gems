import { PartMedia } from "@/components/parts/PartMedia";
import { CATEGORY_ART } from "@/lib/parts/art";
import type { PartCategory } from "@/lib/parts/types";

/**
 * Three plates fanned like trays pulled part-way out of a cabinet. Used as
 * the hero figure so the counter reads as a drawer, not a product shot.
 */
export function PartsTrayStack({ categories }: { categories: PartCategory[] }) {
  const [a, b, c] = categories;
  return (
    <div className="tray-stack" aria-hidden="true">
      {c ? (
        <span className="tray-stack-plate is-back">
          <PartMedia category={c} artKey={CATEGORY_ART[c]} size="sm" seed={`${c}-back`} />
        </span>
      ) : null}
      {b ? (
        <span className="tray-stack-plate is-mid">
          <PartMedia category={b} artKey={CATEGORY_ART[b]} size="sm" seed={`${b}-mid`} />
        </span>
      ) : null}
      {a ? (
        <span className="tray-stack-plate is-front">
          <PartMedia category={a} artKey={CATEGORY_ART[a]} size="sm" seed={a} />
        </span>
      ) : null}
    </div>
  );
}
