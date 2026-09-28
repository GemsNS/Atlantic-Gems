/**
 * Category, condition and status labels for collection pieces, kept apart
 * from the zod schemas in `./types` so `lib/format` and the client browsers
 * can use them without shipping zod to the browser. `./types` re-exports all
 * of this, so server code can keep importing from there.
 */
export const CATEGORIES = [
  { value: "ring", label: "Ring" },
  { value: "necklace", label: "Necklace or pendant" },
  { value: "bracelet", label: "Bracelet" },
  { value: "earrings", label: "Earrings" },
  { value: "brooch", label: "Brooch or pin" },
  { value: "watch", label: "Watch" },
  { value: "loose-stone", label: "Loose stone" },
  { value: "other", label: "Other" },
] as const;
export type Category = (typeof CATEGORIES)[number]["value"];

export const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "pre-owned", label: "Pre-owned" },
] as const;
export type Condition = (typeof CONDITIONS)[number]["value"];

export const STATUSES = [
  { value: "available", label: "Available" },
  { value: "reserved", label: "Reserved" },
  { value: "sold", label: "Sold" },
] as const;
export type Status = (typeof STATUSES)[number]["value"];
