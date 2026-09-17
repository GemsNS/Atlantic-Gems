import type { PartCategory } from "./types";

/** Visual tokens for the parts counter — bench-tray colours + motif keys. */
export const PART_VISUALS: Record<
  PartCategory,
  { motif: string; wash: string; ink: string; label: string }
> = {
  "watch-parts": {
    motif: "stem",
    wash: "linear-gradient(145deg, #e8f0fb 0%, #d4e4f7 48%, #c5d9f0 100%)",
    ink: "#0b3f8f",
    label: "Case & movement parts",
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
  "clock-movements": {
    motif: "pendulum",
    wash: "linear-gradient(145deg, #f4f0e8 0%, #e8dfc8 55%, #d9cdb0 100%)",
    ink: "#6b5428",
    label: "Clockwork",
  },
  findings: {
    motif: "ring",
    wash: "linear-gradient(145deg, #fbf6e8 0%, #f0e4c0 50%, #e6d5a0 100%)",
    ink: "#8a6d33",
    label: "Findings",
  },
  tools: {
    motif: "tool",
    wash: "linear-gradient(145deg, #eef2f7 0%, #d9e2ee 50%, #c5d2e3 100%)",
    ink: "#2b3a52",
    label: "Bench tool",
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
  packaging: {
    motif: "tag",
    wash: "linear-gradient(145deg, #f7f9fc 0%, #e8eef6 50%, #d6e0ec 100%)",
    ink: "#3b5478",
    label: "Packaging",
  },
  cleaners: {
    motif: "drop",
    wash: "linear-gradient(145deg, #eaf7f2 0%, #d0ebe1 50%, #b8dfd0 100%)",
    ink: "#0b6a4c",
    label: "Fluid",
  },
};

export function stockTone(qty: number, reorder: number): "ok" | "low" | "out" {
  if (qty <= 0) return "out";
  if (qty <= reorder) return "low";
  return "ok";
}

export function stockLabel(qty: number, reorder: number): string {
  const t = stockTone(qty, reorder);
  if (t === "out") return "Out of stock";
  if (t === "low") return `${qty} left`;
  return "In stock";
}
