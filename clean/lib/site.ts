/**
 * Locked client facts. Every customer-visible fact must come from here.
 * See /docs/FACTS-REGISTER.md for provenance and status.
 *
 * The street address was supplied by the client with the instruction to keep
 * it private. It is deliberately NOT stored in this repository.
 */
export const site = {
  name: "Atlantic Gems",
  legalName: "ATLANTIC GEMS",
  registrationNumber: "4699451",
  tagline:
    "New and pre-owned fine jewellery, sourcing, gemstones and atelier services in Halifax, Nova Scotia.",
  city: "Halifax",
  region: "Nova Scotia",
  regionShort: "NS",
  country: "Canada",
  appointmentOnly: true,
  locationNote: "By appointment only. The location is shared when your appointment is confirmed.",
  phone: null as string | null,
  email: "support@atlanticgems.ca",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://atlanticgems.ca",
  hstNumber: null as string | null,
  social: {
    instagram: { handle: "@atlanticgemsca", url: "https://www.instagram.com/atlanticgemsca/" },
    facebook: { label: "Facebook", url: "https://www.facebook.com/61574878435021" },
  },
  policiesEffective: "5 September 2026",
} as const;

export const enquiryTypes = [
  { value: "jewellery", label: "Buying jewellery (new or pre-owned)" },
  { value: "sell", label: "Selling or trading in jewellery" },
  { value: "sourcing", label: "Sourcing a specific piece" },
  { value: "gemstones", label: "Gemstones (private)" },
  { value: "wholesale", label: "Gemstones (trade / wholesale)" },
  { value: "custom", label: "Custom jewellery or manufacturing" },
  { value: "repair", label: "Repair, resizing or polishing" },
  { value: "setting", label: "Stone setting" },
  { value: "appraisal", label: "Appraisal" },
  { value: "consignment", label: "Consignment sale" },
  { value: "watches", label: "Watches" },
  { value: "other", label: "Something else" },
] as const;

export type EnquiryType = (typeof enquiryTypes)[number]["value"];

export type ServiceKey =
  | "jewellery"
  | "gemstones"
  | "custom"
  | "repair"
  | "setting"
  | "appraisals"
  | "watches";

export interface Service {
  key: ServiceKey;
  href: string;
  title: string;
  navLabel: string;
  short: string;
  summary: string;
  points: string[];
  cta: string;
  enquiryType: EnquiryType;
}

/** Service menu in order of emphasis. Every line is confirmed by the client. */
export const services: Service[] = [
  {
    key: "jewellery",
    href: "/jewellery",
    title: "Jewellery",
    navLabel: "Jewellery",
    short: "New and pre-owned, bought, sold and sourced",
    summary:
      "Brand-new and pre-owned fine jewellery, sold from our collection or sourced to your brief. We also buy and take pieces in trade.",
    points: [
      "New and pre-owned pieces, each described under our disclosure policy",
      "Sourcing of specific pieces to your brief and budget",
      "Purchase and trade-in of jewellery you no longer wear",
      "Viewing by appointment in Halifax",
    ],
    cta: "Enquire about a piece",
    enquiryType: "jewellery",
  },
  {
    key: "custom",
    href: "/custom-jewellery",
    title: "Custom Jewellery",
    navLabel: "Custom",
    short: "Design, manufacturing and fabrication",
    summary:
      "Custom jewellery designed and manufactured to your brief, from a single stone you already own to a complete new piece or a small production run.",
    points: [
      "Design consultation and drawings",
      "Manufacturing and fabrication in precious metals",
      "Work with your own stones or ours",
      "Quoted in writing before work begins",
    ],
    cta: "Start a commission",
    enquiryType: "custom",
  },
  {
    key: "repair",
    href: "/repair-restoration",
    title: "Repair & Restoration",
    navLabel: "Repair",
    short: "Repair, resizing and polishing",
    summary:
      "Repair, resizing, polishing and restoration of fine jewellery, with each item documented at intake and returned in the condition agreed.",
    points: [
      "Assessment and written estimate",
      "Ring resizing and polishing",
      "Documented intake and custody",
      "Your authorization before work proceeds",
    ],
    cta: "Book a repair",
    enquiryType: "repair",
  },
  {
    key: "setting",
    href: "/stone-setting",
    title: "Stone Setting",
    navLabel: "Setting",
    short: "Professional setting and resetting",
    summary:
      "Professional stone setting for new work and for stones being moved into an existing or new mount.",
    points: [
      "Setting of faceted and cabochon stones",
      "Resetting into existing mounts",
      "Bench work carried out by hand",
      "Stones inspected before and after setting",
    ],
    cta: "Ask about setting",
    enquiryType: "setting",
  },
  {
    key: "appraisals",
    href: "/appraisals-consignment",
    title: "Appraisals & Consignment",
    navLabel: "Appraisals",
    short: "Written appraisals and consignment sale",
    summary:
      "Written appraisals of jewellery, gemstones and watches, and consignment sale of pieces you wish to part with, under a written agreement.",
    points: [
      "Written appraisals with the purpose stated",
      "Consignment sale under a written agreement",
      "Agreed reserve price before any listing",
      "Settlement terms set out in writing",
    ],
    cta: "Ask about appraisals",
    enquiryType: "appraisal",
  },
  {
    key: "watches",
    href: "/watches",
    title: "Watches",
    navLabel: "Watches",
    short: "Sales, sourcing and service enquiries",
    summary:
      "Sales, sourcing and servicing enquiries for fine watches. Brands and models available are subject to current stock, and specific references can be sourced on request.",
    points: [
      "Availability subject to current stock",
      "Sourcing of specific references on request",
      "Service enquiries assessed individually",
      "Written quotation before any work or sale",
    ],
    cta: "Enquire about watches",
    enquiryType: "watches",
  },
  {
    key: "gemstones",
    href: "/gemstones",
    title: "Gemstones",
    navLabel: "Gemstones",
    short: "Rough and faceted stones for the trade and for setting",
    summary:
      "Loose rough and faceted gemstones: rubies, sapphires, emeralds, diamonds and related stones, supplied to the trade and selected for commissions, with procurement to order.",
    points: [
      "Rough and faceted material",
      "Rubies, sapphires, emeralds and diamonds",
      "Procurement of specific stones to your requirement",
      "Treatment, origin and certification stated in writing on every quote",
    ],
    cta: "Request stones",
    enquiryType: "gemstones",
  },
];
