/**
 * Trade lookbook entries. Populated ONLY from client-supplied parcel facts.
 * Empty until the client provides stock lists; the UI renders an honest
 * "no parcels published" state rather than sample inventory.
 */
export interface LookbookEntry {
  id: string;
  title: string;
  category: "ruby" | "sapphire" | "emerald" | "diamond" | "other";
  form: "rough" | "faceted";
  /** Client-stated facts only, e.g. weight, dimensions, cut. */
  facts: { label: string; value: string }[];
  /** Path under /public supplied by the client. */
  image?: string;
  note?: string;
}

export const lookbook: LookbookEntry[] = [];
