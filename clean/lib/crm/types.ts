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
