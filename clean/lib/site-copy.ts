import { enquiryTypes, site, type EnquiryType, type Service } from "@/lib/site";
import {
  enabledServices,
  type PagesMap,
  type SiteMode,
} from "@/lib/site-pages";

export type HomeSection =
  | "jewelleryPaths"
  | "house"
  | "atelier"
  | "gemstones"
  | "parts"
  | "visit";

export interface SiteCopy {
  mode: SiteMode;
  tagline: string;
  heroHead: string;
  heroSub: string;
  primaryCta: { href: string; label: string };
  secondaryCta: { href: string; label: string };
  sections: HomeSection[];
  houseTitle: string;
  houseLede: string;
  jewelleryTitle: string;
  jewelleryLede: string;
  atelierTitle: string;
  atelierLede: string;
  stonesTitle: string;
  stonesLede: string;
  partsTitle: string;
  partsLede: string;
  visitTitle: string;
  visitLede: string;
  services: Service[];
  enquiryTypes: { value: EnquiryType; label: string }[];
  footerBlurb: string;
}

function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function lower(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

const PRESETS: Record<Exclude<SiteMode, "custom">, Omit<SiteCopy, "mode" | "services" | "enquiryTypes">> = {
  "parts-supplier": {
    tagline:
      "Rough gems, loose diamonds and watchmaking parts for benches, cutters and collectors in Halifax, Nova Scotia.",
    heroHead: "Stones for the setting. Parts for the bench.",
    heroSub:
      "Rough gems and loose diamonds, alongside movements, crystals, straps and cells — held for trade and for serious hobbyists. Ask if you need a stone or a part that is not listed.",
    primaryCta: { href: "/parts", label: "Shop stones and parts" },
    secondaryCta: { href: "/contact", label: "Request a stone or a part" },
    sections: ["parts", "visit"],
    houseTitle: "",
    houseLede: "",
    jewelleryTitle: "",
    jewelleryLede: "",
    atelierTitle: "",
    atelierLede: "",
    stonesTitle: "",
    stonesLede: "",
    partsTitle: "Shop stones and parts",
    partsLede:
      "Browse rough gems, loose diamonds, watch parts, movements, crystals, batteries, and straps.",
    visitTitle: "Trade supply from Halifax.",
    visitLede:
      "Trade accounts can request stock and pricing through the trade area. Everyone else can enquire about availability of unlisted parts.",
    footerBlurb:
      "Rough gems, loose diamonds and watchmaking parts for benches and repair in Halifax, Nova Scotia.",
  },
  atelier: {
    tagline: site.tagline,
    heroHead: "Fine jewellery, new and pre-owned. Bought, sold and sourced.",
    heroSub:
      "A Halifax house for jewellery and watches: pieces from our collection, pieces found to your brief, and pieces you want to sell. Behind them, our own bench for custom work, repair, setting, appraisals and loose stones.",
    primaryCta: { href: "/jewellery", label: "Find a piece" },
    secondaryCta: { href: "/contact", label: "Book a private appointment" },
    sections: ["jewelleryPaths", "house", "atelier", "gemstones", "visit"],
    houseTitle: "Seven disciplines. One bench.",
    houseLede:
      "Most jewellers send work out. Here, sourcing, manufacturing, repair, setting, appraisal and stones are handled by the same people you speak to.",
    jewelleryTitle: "Buy, sell, or have it found.",
    jewelleryLede:
      "New and pre-owned fine jewellery is the heart of the house. Choose how you want to work with us.",
    atelierTitle: "Every job starts with a written estimate.",
    atelierLede:
      "Commissions, repairs, setting, appraisals and watch work are assessed first and quoted in writing. Nothing is touched until you say so.",
    stonesTitle: "And the stones themselves.",
    stonesLede:
      "Loose rough and faceted stones for the trade and for commissions. Choose a category to see how we describe it and what we disclose.",
    partsTitle: "",
    partsLede: "",
    visitTitle: "By appointment in Halifax.",
    visitLede:
      "Private clients are seen by appointment. Trade buyers can request current stock and pricing through the trade area.",
    footerBlurb: site.tagline,
  },
  "full-house": {
    tagline:
      "Fine jewellery, gemstones, atelier services, and watchmaking parts from Halifax, Nova Scotia.",
    heroHead: "Jewellery house. Stone counter. One bench.",
    heroSub:
      "New and pre-owned jewellery, custom work and repair — plus rough gems, loose diamonds and watchmaking parts for trade benches.",
    primaryCta: { href: "/parts", label: "Shop the counter" },
    secondaryCta: { href: "/jewellery", label: "Find jewellery" },
    sections: ["parts", "jewelleryPaths", "house", "atelier", "gemstones", "visit"],
    houseTitle: "The house and the counter.",
    houseLede:
      "Atelier services and a trade counter under one roof — jewellery, stones, watches, and the parts to keep them running.",
    jewelleryTitle: "Buy, sell, or have it found.",
    jewelleryLede:
      "New and pre-owned fine jewellery from the collection or sourced to your brief.",
    atelierTitle: "Every job starts with a written estimate.",
    atelierLede:
      "Commissions, repairs, setting, appraisals and watch work are assessed first and quoted in writing.",
    stonesTitle: "And the stones themselves.",
    stonesLede: "Loose rough and faceted stones for the trade and for commissions.",
    partsTitle: "Stones and parts",
    partsLede:
      "Rough gems and loose diamonds, plus watch parts, movements, crystals, batteries and straps for makers and repair.",
    visitTitle: "By appointment in Halifax.",
    visitLede:
      "Private clients are seen by appointment. Trade buyers use the trade area for stock and pricing.",
    footerBlurb:
      "Fine jewellery, gemstones, atelier services, and watchmaking parts from Halifax, Nova Scotia.",
  },
};

const ENQUIRY_BY_PAGE: Partial<Record<keyof PagesMap, EnquiryType[]>> = {
  jewellery: ["jewellery", "sell", "sourcing"],
  gemstones: ["gemstones", "wholesale"],
  custom: ["custom"],
  repair: ["repair"],
  setting: ["setting"],
  appraisals: ["appraisal", "consignment"],
  watches: ["watches"],
  parts: ["other"],
  wholesale: ["wholesale"],
};

function composeCustom(pages: PagesMap): Omit<SiteCopy, "mode" | "services" | "enquiryTypes"> {
  const active = enabledServices(pages);
  const titles = active.map((s) => s.title);
  const shorts = active.map((s) => lower(s.short));
  const sections: HomeSection[] = [];
  if (pages.parts) sections.push("parts");
  if (pages.jewellery) sections.push("jewelleryPaths");
  if (active.length > 0) sections.push("house");
  if (active.some((s) => ["custom", "repair", "setting", "appraisals", "watches"].includes(s.key))) {
    sections.push("atelier");
  }
  if (pages.gemstones) sections.push("gemstones");
  sections.push("visit");

  let heroHead: string;
  let heroSub: string;
  let primaryCta: { href: string; label: string };

  if (pages.parts && active.length === 0) {
    return { ...PRESETS["parts-supplier"] };
  }
  if (pages.parts && active.length > 0) {
    heroHead = `${joinList(titles)}. Plus parts and tools.`;
    heroSub = `A Halifax house for ${joinList(shorts)}, with a parts counter for watchmakers and jewellers.`;
    primaryCta = { href: "/parts", label: "Shop parts" };
  } else if (active.length === 0) {
    heroHead = "Enquiries welcome.";
    heroSub = "Reach us for current availability and written quotations.";
    primaryCta = { href: "/contact", label: "Contact us" };
  } else if (active.length === 1) {
    const s = active[0]!;
    heroHead = s.title;
    heroSub = s.summary;
    primaryCta = { href: s.href, label: s.cta };
  } else {
    heroHead = joinList(titles) + ".";
    heroSub = `A Halifax house for ${joinList(shorts)}.`;
    primaryCta = pages.collection
      ? { href: "/inventory", label: "Browse the collection" }
      : { href: active[0]!.href, label: active[0]!.cta };
  }

  const count = active.length;
  const houseTitle =
    count === 0
      ? ""
      : count === 1
        ? `${active[0]!.title}.`
        : `${count} disciplines. One bench.`;
  const houseLede =
    count === 0
      ? ""
      : count === 1
        ? active[0]!.summary
        : `Here, ${joinList(shorts)} are handled by the same people you speak to.`;

  return {
    tagline:
      pages.parts && active.length
        ? `${joinList(titles)}, and parts supply from Halifax, Nova Scotia.`
        : active.length
          ? `${joinList(titles)} in Halifax, Nova Scotia.`
          : PRESETS["parts-supplier"].tagline,
    heroHead,
    heroSub,
    primaryCta,
    secondaryCta: { href: "/contact", label: "Get in touch" },
    sections,
    houseTitle,
    houseLede,
    jewelleryTitle: pages.jewellery ? "Buy, sell, or have it found." : "",
    jewelleryLede: pages.jewellery
      ? "New and pre-owned fine jewellery from the collection or sourced to your brief."
      : "",
    atelierTitle: sections.includes("atelier") ? "Every job starts with a written estimate." : "",
    atelierLede: sections.includes("atelier")
      ? `${joinList(
          active
            .filter((s) => ["custom", "repair", "setting", "appraisals", "watches"].includes(s.key))
            .map((s) => s.title),
        )} are assessed first and quoted in writing.`
      : "",
    stonesTitle: pages.gemstones ? "And the stones themselves." : "",
    stonesLede: pages.gemstones
      ? "Loose rough and faceted stones for the trade and for commissions."
      : "",
    partsTitle: pages.parts ? "Stones and parts" : "",
    partsLede: pages.parts
      ? "Rough gems, loose diamonds, watch parts, movements, crystals, batteries and straps."
      : "",
    visitTitle: "From Halifax.",
    visitLede: pages.wholesale
      ? "Enquiries by message. Trade buyers can request stock through the trade area."
      : "Enquiries by message. We reply with availability and a written quotation.",
    footerBlurb:
      pages.parts && !active.length
        ? PRESETS["parts-supplier"].footerBlurb
        : `${joinList(titles.length ? titles : ["Atlantic Gems"])} in Halifax, Nova Scotia.`,
  };
}

function filterEnquiries(pages: PagesMap) {
  const allowed = new Set<EnquiryType>(["other"]);
  for (const key of Object.keys(pages) as (keyof PagesMap)[]) {
    if (!pages[key]) continue;
    for (const t of ENQUIRY_BY_PAGE[key] ?? []) allowed.add(t);
  }
  return enquiryTypes.filter((e) => allowed.has(e.value));
}

export function composeSiteCopy(mode: SiteMode, pages: PagesMap, collectionOpen = false): SiteCopy {
  const base =
    mode === "custom" || !PRESETS[mode as Exclude<SiteMode, "custom">]
      ? composeCustom(pages)
      : { ...PRESETS[mode as Exclude<SiteMode, "custom">] };

  // Collection open overrides primary CTA when collection page is enabled.
  if (pages.collection && collectionOpen && mode !== "parts-supplier") {
    base.primaryCta = { href: "/inventory", label: "Browse the collection" };
  }
  if (mode === "atelier" && pages.collection && collectionOpen) {
    base.primaryCta = { href: "/inventory", label: "Browse the collection" };
  }

  return {
    mode,
    ...base,
    services: enabledServices(pages),
    enquiryTypes: filterEnquiries(pages),
  };
}
