/**
 * Locked client facts. Every customer-visible fact must come from here.
 * See /docs/FACTS-REGISTER.md for provenance and status.
 *
 * The street address was supplied by the client with the instruction to keep
 * it private. It is deliberately NOT stored in this repository. Public copy
 * says "by appointment only" and the location is shared when an appointment
 * is confirmed.
 */
export const site = {
  name: "Atlantic Gems",
  legalName: "ATLANTIC GEMS",
  registrationNumber: "4699451",
  tagline: "Fine jewellery house, gem wholesaler and atelier in Halifax, Nova Scotia.",
  city: "Halifax",
  region: "Nova Scotia",
  regionShort: "NS",
  country: "Canada",
  appointmentOnly: true,
  locationNote: "By appointment only. The location is shared when your appointment is confirmed.",
  phone: null as string | null, // not supplied
  email: "support@atlanticgems.ca",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://atlanticgems.ca",
  hstNumber: null as string | null, // not supplied; never invent
  social: {
    instagram: { handle: "@atlanticgemsca", url: "https://www.instagram.com/atlanticgemsca/" },
    facebook: { label: "Facebook", url: "https://www.facebook.com/61574878435021" },
  },
  policiesEffective: "5 September 2026",
} as const;

export const enquiryTypes = [
  { value: "gemstones", label: "Gemstones (private)" },
  { value: "wholesale", label: "Gemstones (trade / wholesale)" },
  { value: "procurement", label: "Procurement of a specific stone or piece" },
  { value: "custom", label: "Custom jewellery or manufacturing" },
  { value: "repair", label: "Repair, resizing or polishing" },
  { value: "setting", label: "Stone setting" },
  { value: "appraisal", label: "Appraisal" },
  { value: "consignment", label: "Consignment sale" },
  { value: "watches", label: "High-end watches" },
  { value: "other", label: "Something else" },
] as const;

export type EnquiryType = (typeof enquiryTypes)[number]["value"];

export type ServiceKey =
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
  /** Plain statements the client has confirmed. Nothing speculative. */
  summary: string;
  points: string[];
  cta: string;
  enquiryType: EnquiryType;
}

/** Service menu. Every line is confirmed by the client (2026-09-05). */
export const services: Service[] = [
  {
    key: "gemstones",
    href: "/gemstones",
    title: "Gemstones",
    navLabel: "Gemstones",
    short: "Rough and faceted stones, private and trade",
    summary:
      "Loose rough and faceted gemstones: rubies, sapphires, emeralds, diamonds and related stones, for the trade and for private clients, with procurement of specific stones to order.",
    points: [
      "Rough and faceted material",
      "Rubies, sapphires, emeralds and diamonds",
      "Procurement of specific stones to your requirement",
      "Treatment, origin and certification details stated in writing on every quote",
    ],
    cta: "Request stones",
    enquiryType: "gemstones",
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
    title: "High-End Watches",
    navLabel: "Watches",
    short: "Sales, procurement and service enquiries",
    summary:
      "Sales, procurement and servicing enquiries for high-end watches. Brands and models available are subject to current stock, and specific pieces can be sourced on request.",
    points: [
      "Availability subject to current stock",
      "Procurement of specific references on request",
      "Service enquiries assessed individually",
      "Written quotation before any work or sale",
    ],
    cta: "Enquire about watches",
    enquiryType: "watches",
  },
];
