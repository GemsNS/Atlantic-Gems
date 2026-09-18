import Image from "next/image";
import type { PartCategory } from "@/lib/parts/types";
import { partArt } from "@/lib/parts/art";
import { PartPlate } from "@/components/parts/PartPlate";

/**
 * A listing's picture.
 *
 * Where a line has demo artwork committed under public/demo/catalogue/ we show
 * the drawing; where it has none we fall back to the drawn tray plate, so the
 * counter never renders an empty frame.
 */
export function PartMedia({
  category,
  artKey = "",
  seed,
  size = "md",
  alt = "",
  className = "",
}: {
  category: PartCategory;
  /** Part.art, or a CATEGORY_ART key for a tray tile. */
  artKey?: string;
  /** Usually a SKU — picks the drawn plate variant when there is no artwork. */
  seed?: string;
  size?: "sm" | "md" | "lg" | "hero";
  /** Left empty for decorative tiles whose heading already names the subject. */
  alt?: string;
  className?: string;
}) {
  const art = partArt(artKey);
  if (!art) {
    return <PartPlate category={category} size={size} seed={seed} className={className} />;
  }

  return (
    <div className={`part-media part-media-${size} ${className}`.trim()}>
      <Image
        src={art.src}
        width={art.width}
        height={art.height}
        alt={alt ? `${alt} — ${art.alt}` : ""}
        aria-hidden={alt ? undefined : true}
        unoptimized
        sizes={
          size === "hero"
            ? "(max-width: 900px) 92vw, 520px"
            : size === "sm"
              ? "160px"
              : "(max-width: 700px) 46vw, 320px"
        }
      />
    </div>
  );
}
