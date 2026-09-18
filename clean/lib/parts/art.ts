import type { PartCategory } from "./types";

import roughSapphireParcel from "@/public/demo/catalogue/rough-sapphire-parcel.svg";
import roughRubyCrystal from "@/public/demo/catalogue/rough-ruby-crystal.svg";
import roughEmeraldPrism from "@/public/demo/catalogue/rough-emerald-prism.svg";
import roughGarnetParcel from "@/public/demo/catalogue/rough-garnet-parcel.svg";
import roughAmethystCluster from "@/public/demo/catalogue/rough-amethyst-cluster.svg";
import diamondRoundBrilliant from "@/public/demo/catalogue/diamond-round-brilliant.svg";
import diamondRoundLarge from "@/public/demo/catalogue/diamond-round-large.svg";
import diamondEmeraldCut from "@/public/demo/catalogue/diamond-emerald-cut.svg";
import diamondOval from "@/public/demo/catalogue/diamond-oval.svg";
import diamondPrincess from "@/public/demo/catalogue/diamond-princess.svg";
import diamondPearChampagne from "@/public/demo/catalogue/diamond-pear-champagne.svg";
import watchHandsSet from "@/public/demo/catalogue/watch-hands-set.svg";
import watchCrowns from "@/public/demo/catalogue/watch-crowns.svg";
import watchStems from "@/public/demo/catalogue/watch-stems.svg";
import watchGaskets from "@/public/demo/catalogue/watch-gaskets.svg";
import movementAutomatic from "@/public/demo/catalogue/movement-automatic.svg";
import movementQuartz from "@/public/demo/catalogue/movement-quartz.svg";
import movementHandWind from "@/public/demo/catalogue/movement-hand-wind.svg";
import crystalMineralFlat from "@/public/demo/catalogue/crystal-mineral-flat.svg";
import crystalSapphireDomed from "@/public/demo/catalogue/crystal-sapphire-domed.svg";
import crystalAcrylicHigh from "@/public/demo/catalogue/crystal-acrylic-high.svg";
import crystalMineralLarge from "@/public/demo/catalogue/crystal-mineral-large.svg";
import batteryCellSmall from "@/public/demo/catalogue/battery-cell-small.svg";
import batteryCellMid from "@/public/demo/catalogue/battery-cell-mid.svg";
import batteryCellWide from "@/public/demo/catalogue/battery-cell-wide.svg";
import batteryCellTall from "@/public/demo/catalogue/battery-cell-tall.svg";
import strapBlackGrain from "@/public/demo/catalogue/strap-black-grain.svg";
import strapBrownGrain from "@/public/demo/catalogue/strap-brown-grain.svg";
import strapCrocBlack from "@/public/demo/catalogue/strap-croc-black.svg";
import strapTanPlain from "@/public/demo/catalogue/strap-tan-plain.svg";
import strapRubberNavy from "@/public/demo/catalogue/strap-rubber-navy.svg";

/**
 * The demo catalogue's pictures.
 *
 * Every plate under public/demo/catalogue/ is drawn by scripts/make-demo-art.mjs
 * — no photographs, nothing taken from anyone else, and nothing that stands for a
 * real piece of client stock. Alt text says so.
 *
 * Importing the files here rather than writing "/demo/catalogue/x.svg" at the call
 * site is deliberate: webpack rewrites the URL, so the GitHub Pages export picks up
 * its basePath for free.
 */
export type PartArt = { src: string; width: number; height: number; alt: string };

/** A static SVG import is typed `any` by next/image-types/global. */
type Imported = { src: string; width: number; height: number };

const plate = (file: unknown, alt: string): PartArt => {
  const img = file as Imported;
  return { src: img.src, width: img.width, height: img.height, alt };
};

export const PART_ART: Record<string, PartArt> = {
  "rough-sapphire-parcel": plate(
    roughSapphireParcel,
    "Drawn illustration of a blue sapphire crystal in the rough. Demo artwork.",
  ),
  "rough-ruby-crystal": plate(
    roughRubyCrystal,
    "Drawn illustration of a tabular ruby crystal in the rough. Demo artwork.",
  ),
  "rough-emerald-prism": plate(
    roughEmeraldPrism,
    "Drawn illustration of a hexagonal emerald prism in the rough. Demo artwork.",
  ),
  "rough-garnet-parcel": plate(
    roughGarnetParcel,
    "Drawn illustration of a parcel of rough garnet pebbles. Demo artwork.",
  ),
  "rough-amethyst-cluster": plate(
    roughAmethystCluster,
    "Drawn illustration of an amethyst crystal cluster on matrix. Demo artwork.",
  ),
  "diamond-round-brilliant": plate(
    diamondRoundBrilliant,
    "Drawn illustration of a round brilliant cut diamond seen from above. Demo artwork.",
  ),
  "diamond-round-large": plate(
    diamondRoundLarge,
    "Drawn illustration of a large round brilliant cut diamond seen from above. Demo artwork.",
  ),
  "diamond-emerald-cut": plate(
    diamondEmeraldCut,
    "Drawn illustration of an emerald cut diamond seen from above. Demo artwork.",
  ),
  "diamond-oval": plate(
    diamondOval,
    "Drawn illustration of an oval brilliant cut diamond seen from above. Demo artwork.",
  ),
  "diamond-princess": plate(
    diamondPrincess,
    "Drawn illustration of a princess cut diamond seen from above. Demo artwork.",
  ),
  "diamond-pear-champagne": plate(
    diamondPearChampagne,
    "Drawn illustration of a pear cut champagne diamond seen from above. Demo artwork.",
  ),
  "watch-hands-set": plate(watchHandsSet, "Drawn illustration of a set of watch hands. Demo artwork."),
  "watch-crowns": plate(watchCrowns, "Drawn illustration of three stainless watch crowns. Demo artwork."),
  "watch-stems": plate(watchStems, "Drawn illustration of three winding stems. Demo artwork."),
  "watch-gaskets": plate(watchGaskets, "Drawn illustration of case back gaskets. Demo artwork."),
  "movement-automatic": plate(
    movementAutomatic,
    "Drawn illustration of a mechanical watch movement. Demo artwork.",
  ),
  "movement-quartz": plate(
    movementQuartz,
    "Drawn illustration of a quartz watch movement module. Demo artwork.",
  ),
  "movement-hand-wind": plate(
    movementHandWind,
    "Drawn illustration of a hand wound watch movement. Demo artwork.",
  ),
  "crystal-mineral-flat": plate(
    crystalMineralFlat,
    "Drawn illustration of a flat mineral watch crystal. Demo artwork.",
  ),
  "crystal-sapphire-domed": plate(
    crystalSapphireDomed,
    "Drawn illustration of a domed sapphire watch crystal. Demo artwork.",
  ),
  "crystal-acrylic-high": plate(
    crystalAcrylicHigh,
    "Drawn illustration of a high domed acrylic watch crystal. Demo artwork.",
  ),
  "crystal-mineral-large": plate(
    crystalMineralLarge,
    "Drawn illustration of a large flat mineral watch crystal. Demo artwork.",
  ),
  "battery-cell-small": plate(
    batteryCellSmall,
    "Drawn illustration of a small silver oxide watch cell. Demo artwork.",
  ),
  "battery-cell-mid": plate(
    batteryCellMid,
    "Drawn illustration of a silver oxide watch cell. Demo artwork.",
  ),
  "battery-cell-wide": plate(
    batteryCellWide,
    "Drawn illustration of a wide silver oxide watch cell. Demo artwork.",
  ),
  "battery-cell-tall": plate(
    batteryCellTall,
    "Drawn illustration of a tall silver oxide watch cell. Demo artwork.",
  ),
  "strap-black-grain": plate(
    strapBlackGrain,
    "Drawn illustration of a black grained leather watch strap. Demo artwork.",
  ),
  "strap-brown-grain": plate(
    strapBrownGrain,
    "Drawn illustration of a brown grained leather watch strap. Demo artwork.",
  ),
  "strap-croc-black": plate(
    strapCrocBlack,
    "Drawn illustration of a black crocodile grain leather watch strap. Demo artwork.",
  ),
  "strap-tan-plain": plate(strapTanPlain, "Drawn illustration of a tan leather watch strap. Demo artwork."),
  "strap-rubber-navy": plate(
    strapRubberNavy,
    "Drawn illustration of a ribbed rubber watch strap. Demo artwork.",
  ),
};

export function partArt(key: string): PartArt | null {
  if (!key) return null;
  return PART_ART[key] ?? null;
}

/** The plate that fronts each tray on the index and the category hero. */
export const CATEGORY_ART: Record<PartCategory, string> = {
  "rough-gems": "rough-amethyst-cluster",
  "loose-diamonds": "diamond-round-brilliant",
  "watch-parts": "watch-crowns",
  movements: "movement-automatic",
  crystals: "crystal-sapphire-domed",
  batteries: "battery-cell-mid",
  straps: "strap-brown-grain",
};
