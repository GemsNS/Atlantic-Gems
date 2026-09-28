import { z } from "zod";

export const DEAL_STAGES = [
  { value: "lead", label: "Lead" },
  { value: "rfq", label: "RFQ" },
  { value: "quoted", label: "Quoted" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const;

export const QUOTE_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "expired", label: "Expired" },
] as const;

export const TASK_STATUSES = [
  { value: "open", label: "Open" },
  { value: "done", label: "Done" },
] as const;

const enumValues = <T extends readonly { value: string }[]>(list: T) =>
  list.map((x) => x.value) as [T[number]["value"], ...T[number]["value"][]];

export const contactSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200).or(z.literal("")).default(""),
  phone: z.string().trim().max(40).default(""),
  company: z.string().trim().max(120).default(""),
  kind: z.enum(["retail", "trade", "other"]).default("retail"),
  tags: z.array(z.string().max(40)).max(20).default([]),
  notes: z.string().trim().max(4000).default(""),
  lastActivityAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const dealSchema = z.object({
  id: z.string(),
  contactId: z.string().nullable().default(null),
  title: z.string().trim().min(1).max(160),
  stage: z.enum(enumValues(DEAL_STAGES)).default("lead"),
  value: z.number().nonnegative().nullable().default(null),
  currency: z.enum(["CAD", "USD"]).default("CAD"),
  source: z.enum(["contact-form", "cart", "manual", "other"]).default("manual"),
  notes: z.string().trim().max(4000).default(""),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const quoteLineSchema = z.object({
  sku: z.string().max(60).default(""),
  title: z.string().min(1).max(160),
  qty: z.number().int().positive().max(10_000),
  unitPrice: z.number().nonnegative().nullable().default(null),
  partId: z.string().optional(),
  inventoryId: z.string().optional(),
  // Older quotes predate per-line currency; they were all CAD.
  currency: z.enum(["CAD", "USD"]).optional(),
  // Quoted from a demo listing, so unitPrice is a placeholder, not a price.
  // Defaults to false (unlike Part.demo) because quotes saved before the flag
  // cannot be told apart.
  demo: z.boolean().default(false),
});

/**
 * Whether the house was told about a customer quote request, and when.
 * "pending" is saved with the quote and replaced once the notification has
 * been tried; a quote still pending after that means the result was never
 * recorded (a crash, or the update failed), so nobody may have been told.
 */
export const quoteNotificationSchema = z.object({
  status: z.enum(["pending", "sent", "failed", "unconfigured"]),
  at: z.string(),
});

export const quoteSchema = z.object({
  id: z.string(),
  contactId: z.string().nullable().default(null),
  dealId: z.string().nullable().default(null),
  status: z.enum(enumValues(QUOTE_STATUSES)).default("draft"),
  lines: z.array(quoteLineSchema).max(200).default([]),
  notes: z.string().trim().max(4000).default(""),
  customerName: z.string().trim().max(120).default(""),
  customerEmail: z.string().trim().max(200).default(""),
  currency: z.enum(["CAD", "USD"]).default("CAD"),
  // Optional so quotes saved before it existed still parse (and still list).
  notification: quoteNotificationSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const taskSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1).max(200),
  status: z.enum(enumValues(TASK_STATUSES)).default("open"),
  dueAt: z.string().nullable().default(null),
  relatedQuoteId: z.string().nullable().default(null),
  relatedDealId: z.string().nullable().default(null),
  relatedContactId: z.string().nullable().default(null),
  reason: z.string().trim().max(400).default(""),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Contact = z.infer<typeof contactSchema>;
export type Deal = z.infer<typeof dealSchema>;
export type Quote = z.infer<typeof quoteSchema>;
export type QuoteLine = z.infer<typeof quoteLineSchema>;
export type Task = z.infer<typeof taskSchema>;

/** Short, customer-facing reference for a quote request (e.g. Q-7KX2MP). */
export function quoteReference(id: string): string {
  return `Q-${id.slice(0, 6).toUpperCase()}`;
}

export const QUOTE_REFERENCE_PATTERN = /^Q-[A-Z0-9]{6}$/;

/**
 * Reads what staff type into the reference lookup: "q-7kx2mp", "7KX2MP" and
 * " Q-7KX2MP " all give "Q-7KX2MP". Returns null for anything else.
 */
export function normaliseQuoteReference(raw: string): string | null {
  let bare = raw.trim().toUpperCase();
  // Ids can start with Q themselves, so a bare Q is only a prefix at 7 chars.
  if (bare.startsWith("Q-")) bare = bare.slice(2);
  else if (bare.length === 7 && bare.startsWith("Q")) bare = bare.slice(1);
  const ref = `Q-${bare}`;
  return QUOTE_REFERENCE_PATTERN.test(ref) ? ref : null;
}

export type Currency = "CAD" | "USD";

/**
 * Priced totals kept apart per currency: a CAD line and a USD line are never
 * added together. Lines priced on request are left out. Ordered CAD first.
 */
export function totalsByCurrency(
  lines: { qty: number; unitPrice: number | null; currency?: Currency }[],
  fallback: Currency = "CAD",
): { currency: Currency; amount: number }[] {
  const sums = new Map<Currency, number>();
  for (const l of lines) {
    if (l.unitPrice == null) continue;
    const c = l.currency ?? fallback;
    sums.set(c, (sums.get(c) ?? 0) + l.unitPrice * l.qty);
  }
  return [...sums]
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => (a.currency === b.currency ? 0 : a.currency === "CAD" ? -1 : 1));
}

/** Staff-facing wording for whether the house was told about a quote request. */
export function notificationLabel(n: Quote["notification"]): string {
  if (!n) return "Not recorded";
  if (n.status === "pending") return "Not confirmed";
  if (n.status === "sent") return "Sent";
  if (n.status === "failed") return "Failed";
  return "No delivery route set up";
}
