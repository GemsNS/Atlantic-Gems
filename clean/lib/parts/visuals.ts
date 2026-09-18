import type { PartCategory } from "./types";

/** Visual tokens for the catalogue — tray colours + motif keys. */
export const PART_VISUALS: Record<
  PartCategory,
  { motif: string; wash: string; ink: string; label: string }
> = {
  "rough-gems": {
    motif: "rough",
    wash: "linear-gradient(145deg, #f4eefb 0%, #ded0f1 48%, #c6b4e4 100%)",
    ink: "#4a2f86",
    label: "Rough crystal",
  },
  "loose-diamonds": {
    motif: "brilliant",
    wash: "linear-gradient(150deg, #f8fbff 0%, #e6eefa 46%, #d0ddf1 100%)",
    ink: "#12407e",
    label: "Loose stone",
  },
  "watch-parts": {
    motif: "stem",
    wash: "linear-gradient(145deg, #e8f0fb 0%, #d4e4f7 48%, #c5d9f0 100%)",
    ink: "#0b3f8f",
    label: "Case and movement parts",
  },
  movements: {
    motif: "balance",
    wash: "linear-gradient(145deg, #eef6f2 0%, #d7ebe2 50%, #c5e0d4 100%)",
    ink: "#0b6a4c",
    label: "Calibre",
  },
  crystals: {
    motif: "crystal",
    wash: "linear-gradient(160deg, #f7fbff 0%, #e3eefc 45%, #cfe0f5 100%)",
    ink: "#1055b8",
    label: "Glass",
  },
  batteries: {
    motif: "cell",
    wash: "linear-gradient(145deg, #f3f6fb 0%, #e0e8f3 50%, #cdd8e8 100%)",
    ink: "#1055b8",
    label: "Power cell",
  },
  straps: {
    motif: "strap",
    wash: "linear-gradient(145deg, #f5ebe3 0%, #e8d5c4 50%, #d9c0a8 100%)",
    ink: "#6b4423",
    label: "Strap",
  },
};

export function stockTone(qty: number, reorder: number): "ok" | "low" | "out" {
  if (qty <= 0) return "out";
  if (qty <= reorder) return "low";
  return "ok";
}

/** Five-segment bench gauge: how full the shelf is against its reorder point. */
export function stockSegments(qty: number, reorder: number): number {
  if (qty <= 0) return 0;
  const full = Math.max(reorder, 1) * 3;
  return Math.min(5, Math.max(1, Math.ceil((qty / full) * 5)));
}

/** A line a counter hand would actually say about the shelf. */
export function stockNote(qty: number, reorder: number): string {
  const t = stockTone(qty, reorder);
  if (t === "out") return "Out of stock — ask for the lead time";
  if (t === "low") return `Only ${qty} left at the counter`;
  return `${qty} on the shelf`;
}
