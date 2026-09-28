import { z } from "zod";
import { PART_CATEGORIES } from "./categories";

// Labels live in a zod-free module so client components can import them cheaply.
export { PART_CATEGORIES, partCategoryLabel, type PartCategory } from "./categories";

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
  /**
   * Key into PART_ART (lib/parts/art.ts) — a drawn illustration committed under
   * public/demo/catalogue/. Empty falls back to the drawn tray plate. Never a
   * photograph of a client's piece.
   */
  art: z.string().trim().max(60).default(""),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Part = z.infer<typeof partSchema>;
