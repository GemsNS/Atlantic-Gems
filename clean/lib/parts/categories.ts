/**
 * The seven trays and their labels, kept apart from the zod schema in
 * `./types` so client components (the parts browser, the part card) can use
 * them without shipping zod to the browser. `./types` re-exports all of this,
 * so server code can keep importing from there.
 */
export const PART_CATEGORIES = [
  {
    value: "rough-gems",
    label: "Rough Gems",
    blurb: "Uncut crystals and mine-run parcels for cutters, setters and collectors.",
  },
  {
    value: "loose-diamonds",
    label: "Loose Diamonds",
    blurb: "Loose brilliants and step cuts, each quoted individually.",
  },
  { value: "watch-parts", label: "Watch Parts", blurb: "Hands, stems, crowns, springs and case parts." },
  { value: "movements", label: "Watch Movements", blurb: "Mechanical and quartz calibres for repair and build." },
  { value: "crystals", label: "Watch Crystals", blurb: "Mineral, acrylic and sapphire crystals." },
  { value: "batteries", label: "Batteries", blurb: "Watch batteries and cells." },
  { value: "straps", label: "Straps", blurb: "Leather and specialty straps." },
] as const;

export type PartCategory = (typeof PART_CATEGORIES)[number]["value"];

export function partCategoryLabel(value: string): string {
  return PART_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
