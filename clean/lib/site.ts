/**
 * Locked client facts. Every customer-visible fact must come from here.
 * Fields set to `null` have not been supplied by the client and must NOT be
 * rendered. See /docs/FACTS-REGISTER.md for provenance and status.
 */
export const site = {
  name: "Atlantic Gems",
  legalName: null as string | null, // not yet supplied; required before contracts
  tagline: "Fine jewellery house, gem wholesaler and atelier in Halifax, Nova Scotia.",
  city: "Halifax",
  region: "Nova Scotia",
  regionShort: "NS",
  country: "Canada",
  address: null as string | null, // not yet supplied; by appointment until then
  phone: null as string | null, // not yet supplied
  email: "support@atlanticgems.ca",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://atlanticgems.ca",
  hstNumber: null as string | null, // not yet supplied; never invent
  social: {
    instagram: { handle: "@atlanticgemsca", url: "https://www.instagram.com/atlanticgemsca/" },
    facebook: { label: "Facebook", url: "https://www.facebook.com/61574878435021" },
  },
} as const;

export type ServiceKey = "gemstones" | "custom" | "repair" | "setting" | "watches";

export interface Service {
  key: ServiceKey;
  href: string;
  title: string;
  short: string;
  /** Plain statements the client has confirmed. Nothing speculative. */
  summary: string;
  points: string[];
  cta: string;
}

/**
 * Service menu limited to what the client brief confirms.
 * Appraisals, remounts, resizing, polishing and chain repair are NOT listed
 * until confirmed (see facts register).
 */
export const services: Service[] = [
  {
    key: "gemstones",
    href: "/gemstones",
    title: "Gemstones",
    short: "Rough and faceted stones, private and trade",
    summary:
      "Loose rough and faceted gemstones: rubies, sapphires, emeralds, diamonds and related stones, for the trade and for private clients.",
    points: [
      "Rough and faceted material",
      "Rubies, sapphires, emeralds and diamonds",
      "Trade enquiries and private selection by appointment",
      "Treatment, origin and certification details available on request for any stone we quote",
    ],
    cta: "Request stones",
  },
  {
    key: "custom",
    href: "/custom-jewellery",
    title: "Custom Jewellery",
    short: "Design and fabrication",
    summary:
      "Custom jewellery designed and fabricated to your brief, from a single stone you already own to a complete new piece.",
    points: [
      "Design consultation and drawings",
      "Fabrication in precious metals",
      "Work with your own stones or ours",
      "Quoted in writing before work begins",
    ],
    cta: "Start a commission",
  },
  {
    key: "repair",
    href: "/repair-restoration",
    title: "Repair & Restoration",
    short: "Care for pieces you already own",
    summary:
      "Repair and restoration of fine jewellery, with each item documented at intake and returned in the condition agreed.",
    points: [
      "Assessment and written estimate",
      "Documented intake and custody",
      "Restoration of worn or damaged pieces",
      "Your authorization before work proceeds",
    ],
    cta: "Book a repair",
  },
  {
    key: "setting",
    href: "/stone-setting",
    title: "Stone Setting",
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
  },
  {
    key: "watches",
    href: "/watches",
    title: "High-End Watches",
    short: "Sales and service enquiries",
    summary:
      "Enquiries for high-end watch sales and servicing. Brand coverage and scope are confirmed for each request.",
    points: [
      "Sales enquiries for fine timepieces",
      "Service enquiries assessed individually",
      "Brand coverage confirmed per request",
      "Written quotation before any work",
    ],
    cta: "Enquire about watches",
  },
];

export const enquiryTypes = [
  { value: "gemstones", label: "Gemstones (private)" },
  { value: "wholesale", label: "Gemstones (trade / wholesale)" },
  { value: "custom", label: "Custom jewellery" },
  { value: "repair", label: "Repair or restoration" },
  { value: "setting", label: "Stone setting" },
  { value: "watches", label: "High-end watches" },
  { value: "other", label: "Something else" },
] as const;

export type EnquiryType = (typeof enquiryTypes)[number]["value"];
