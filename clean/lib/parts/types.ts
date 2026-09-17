import { z } from "zod";

export const PART_CATEGORIES = [
  { value: "watch-parts", label: "Watch Parts", blurb: "Hands, stems, crowns, springs and case parts." },
  { value: "movements", label: "Watch Movements", blurb: "Mechanical and quartz calibres for repair and build." },
  { value: "crystals", label: "Watch Crystals", blurb: "Mineral, acrylic and sapphire crystals." },
  { value: "clock-movements", label: "Clock Movements", blurb: "Movements and accessories for clockmakers." },
  { value: "findings", label: "Jewellery Findings", blurb: "Jump rings, clasps, pins and bench findings." },
  { value: "tools", label: "Tools", blurb: "Swiss and trade tools for the bench." },
  { value: "batteries", label: "Batteries", blurb: "Watch batteries including Renata cells." },
  { value: "straps", label: "Straps", blurb: "Leather and specialty straps." },
  { value: "packaging", label: "Packaging", blurb: "Tags, bags, envelopes and labels." },
  { value: "cleaners", label: "Cleaners and Lubricants", blurb: "Cleaners, oils and lubricants for makers." },
] as const;

export type PartCategory = (typeof PART_CATEGORIES)[number]["value"];

const enumValues = <T extends readonly { value: string }[]>(list: T) =>
  list.map((x) => x.value) as [T[number]["value"], ...T[number]["value"][]];

export const partSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{4,40}$/),
  sku: z.string().trim().min(1).max(60),
  title: z.string().trim().min(3).max(140),
  brand: z.string().trim().max(80).default(""),
  category: z.enum(enumValues(PART_CATEGORIES)),
  description: z.string().trim().max(4000).default(""),
  packSize: z.string().trim().max(40).default("1"),
  stockQty: z.number().int().min(0).default(0),
  reorderPoint: z.number().int().min(0).default(5),
  price: z.number().nonnegative().max(1_000_000).nullable().default(null),
  currency: z.enum(["CAD", "USD"]).default("CAD"),
  visibility: z.enum(["public", "trade", "private"]).default("public"),
  demo: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Part = z.infer<typeof partSchema>;

export function partCategoryLabel(value: string): string {
  return PART_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
