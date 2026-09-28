import "server-only";
import path from "node:path";
import { DATA_DIR, isListFile, readJson, serialize, writeJsonAtomic } from "@/lib/json-store";
import { newId } from "@/lib/inventory/types";
import {
  quoteReference,
  contactSchema,
  dealSchema,
  quoteSchema,
  taskSchema,
  type Contact,
  type Deal,
  type Quote,
  type Task,
} from "./types";

const CRM_DIR = path.join(DATA_DIR, "crm");
const CONTACTS = path.join(CRM_DIR, "contacts.json");
const DEALS = path.join(CRM_DIR, "deals.json");
const QUOTES = path.join(CRM_DIR, "quotes.json");
const TASKS = path.join(CRM_DIR, "tasks.json");

/** Every CRM list file, for the data check behind /api/health?deep=1. */
export const CRM_FILES = [CONTACTS, DEALS, QUOTES, TASKS] as const;

/**
 * A file that is there but unreadable, or not a list, throws StoreReadError
 * rather than reading as empty. Every write below reads through here inside
 * `serialize`, so it is refused and the file kept as it is: contacts, deals
 * and quotes cannot be regenerated. Checkout answers 503 with the support
 * address and the contact form falls back to email.
 */
async function listParsed<T>(
  file: string,
  schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false } },
): Promise<T[]> {
  const raw = await readJson<{ items?: unknown[] }>(file, { items: [] }, isListFile);
  const out: T[] = [];
  for (const entry of raw.items ?? []) {
    const parsed = schema.safeParse(entry);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

async function writeItems(file: string, items: unknown[]) {
  await writeJsonAtomic(file, { items });
}

export async function listContacts(): Promise<Contact[]> {
  const items = await listParsed(CONTACTS, contactSchema);
  return items.sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
}

export async function getContact(id: string): Promise<Contact | null> {
  return (await listContacts()).find((c) => c.id === id) ?? null;
}

export async function upsertContact(contact: Contact): Promise<Contact> {
  return serialize(async () => {
    const items = await listParsed(CONTACTS, contactSchema);
    const clean = contactSchema.parse(contact);
    const idx = items.findIndex((i) => i.id === clean.id);
    if (idx >= 0) items[idx] = clean;
    else items.push(clean);
    await writeItems(CONTACTS, items);
    return clean;
  });
}

const NOTES_MAX = 4000;

/**
 * Appends to a running notes field inside the schema cap. Existing notes (which
 * may be staff's own) are never cut; the new text is trimmed to the room left.
 * The full message is always kept on the deal or quote it arrived with.
 */
function appendNotes(existing: string, extra: string | undefined): string {
  if (!extra) return existing;
  const room = NOTES_MAX - existing.length - 1;
  if (room <= 0) return existing;
  return `${existing}\n${extra.slice(0, room)}`.trim();
}

type ContactInput = {
  name: string;
  email: string;
  company?: string;
  kind?: Contact["kind"];
  notes?: string;
};

/**
 * Finds the contact for an email address in `items` and updates it, or adds
 * a new one, in memory. Every field is clamped so a repeat customer can never
 * push the record past the schema limits (which used to throw mid-checkout).
 */
function mergeContact(items: Contact[], input: ContactInput, now: string): Contact {
  const email = input.email.trim();
  const key = email.toLowerCase();
  const name = input.name.trim().slice(0, 120);
  const company = (input.company ?? "").trim().slice(0, 120);
  const notes = input.notes?.slice(0, NOTES_MAX);
  const idx = key ? items.findIndex((c) => c.email.toLowerCase() === key) : -1;
  const existing = idx >= 0 ? items[idx] : undefined;
  const clean = contactSchema.parse(
    existing
      ? {
          ...existing,
          name: name || existing.name,
          company: company || existing.company,
          notes: appendNotes(existing.notes, notes),
          lastActivityAt: now,
          updatedAt: now,
        }
      : {
          id: newId(),
          name,
          email,
          phone: "",
          company,
          kind: input.kind ?? "retail",
          tags: [],
          notes: notes ?? "",
          lastActivityAt: now,
          createdAt: now,
          updatedAt: now,
        },
  );
  if (idx >= 0) items[idx] = clean;
  else items.push(clean);
  return clean;
}

/** Replaces the entry with the same id, or adds it. */
function put<T extends { id: string }>(items: T[], item: T) {
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) items[idx] = item;
  else items.push(item);
}

/**
 * Finds a contact by email or creates one. Lookup and write run as one
 * serialised step so two quick submissions cannot create duplicate contacts.
 */
export async function findOrCreateContactByEmail(input: ContactInput): Promise<Contact> {
  const now = new Date().toISOString();
  return serialize(async () => {
    const items = await listParsed(CONTACTS, contactSchema);
    const clean = mergeContact(items, input, now);
    await writeItems(CONTACTS, items);
    return clean;
  });
}

/**
 * Records a customer's quote request: the contact, an RFQ deal and the quote,
 * as one step under one lock. All three files are read before anything is
 * written, so an unreadable one (StoreReadError) or a lock timeout leaves
 * none of them changed and reaches the caller, and a retry cannot pile up
 * orphan deals or contact notes. The quote, which staff act on, is written
 * first and is the commit point: once it is saved the request counts as
 * received, so the customer is not told to send it again (which would save a
 * second quote). A deal or contact write that fails after it (a full disk,
 * a permission error) is logged and the quote keeps ids that point at nothing;
 * the order still means a deal or a note is never left without its quote.
 */
export async function recordQuoteRequest(input: {
  contact: ContactInput;
  deal: Omit<Deal, "contactId">;
  quote: Omit<Quote, "contactId" | "dealId">;
}): Promise<{ contact: Contact; deal: Deal; quote: Quote }> {
  const now = new Date().toISOString();
  return serialize(async () => {
    const contacts = await listParsed(CONTACTS, contactSchema);
    const deals = await listParsed(DEALS, dealSchema);
    const quotes = await listParsed(QUOTES, quoteSchema);
    const contact = mergeContact(contacts, input.contact, now);
    const deal = dealSchema.parse({ ...input.deal, contactId: contact.id });
    const quote = quoteSchema.parse({ ...input.quote, contactId: contact.id, dealId: deal.id });
    put(quotes, quote);
    put(deals, deal);
    await writeItems(QUOTES, quotes);
    let file = DEALS;
    try {
      await writeItems(DEALS, deals);
      file = CONTACTS;
      await writeItems(CONTACTS, contacts);
    } catch (err) {
      // No customer details in the log, only the file and the filesystem
      // code (ENOSPC, EACCES, EISDIR) so the cause can be fixed; the quote
      // itself is saved.
      const code = (err as NodeJS.ErrnoException | null)?.code ?? "unknown";
      console.error(`[quote] deal/contact write failed for ${quote.id}: ${path.basename(file)} (${code})`);
    }
    return { contact, deal, quote };
  });
}

export async function listDeals(): Promise<Deal[]> {
  const items = await listParsed(DEALS, dealSchema);
  return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function upsertDeal(deal: Deal): Promise<Deal> {
  return serialize(async () => {
    const items = await listParsed(DEALS, dealSchema);
    const clean = dealSchema.parse(deal);
    const idx = items.findIndex((i) => i.id === clean.id);
    if (idx >= 0) items[idx] = clean;
    else items.push(clean);
    await writeItems(DEALS, items);
    return clean;
  });
}

export async function listQuotes(): Promise<Quote[]> {
  const items = await listParsed(QUOTES, quoteSchema);
  return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getQuote(id: string): Promise<Quote | null> {
  return (await listQuotes()).find((q) => q.id === id) ?? null;
}

/** Quotes whose customer reference matches. Six characters are not guaranteed unique. */
export async function findQuotesByReference(reference: string): Promise<Quote[]> {
  return (await listQuotes()).filter((q) => quoteReference(q.id) === reference);
}

/**
 * Read-modify-write of one quote inside the write queue, so a late field
 * (such as the notification result) cannot overwrite a staff edit made in
 * between. Returns null when the quote no longer exists.
 */
export async function patchQuote(
  id: string,
  change: (quote: Quote) => Quote,
): Promise<Quote | null> {
  return serialize(async () => {
    const items = await listParsed(QUOTES, quoteSchema);
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return null;
    const clean = quoteSchema.parse(change(items[idx]!));
    items[idx] = clean;
    await writeItems(QUOTES, items);
    return clean;
  });
}

export async function upsertQuote(quote: Quote): Promise<Quote> {
  return serialize(async () => {
    const items = await listParsed(QUOTES, quoteSchema);
    const clean = quoteSchema.parse(quote);
    const idx = items.findIndex((i) => i.id === clean.id);
    if (idx >= 0) items[idx] = clean;
    else items.push(clean);
    await writeItems(QUOTES, items);
    return clean;
  });
}

export async function listTasks(): Promise<Task[]> {
  const items = await listParsed(TASKS, taskSchema);
  return items.sort((a, b) => (a.dueAt ?? a.createdAt).localeCompare(b.dueAt ?? b.createdAt));
}

export async function upsertTask(task: Task): Promise<Task> {
  return serialize(async () => {
    const items = await listParsed(TASKS, taskSchema);
    const clean = taskSchema.parse(task);
    const idx = items.findIndex((i) => i.id === clean.id);
    if (idx >= 0) items[idx] = clean;
    else items.push(clean);
    await writeItems(TASKS, items);
    return clean;
  });
}

export async function createEnquiryLead(input: {
  name: string;
  email: string;
  type: string;
  message: string;
}): Promise<{ contact: Contact; deal: Deal }> {
  const now = new Date().toISOString();
  const contact = await findOrCreateContactByEmail({
    name: input.name,
    email: input.email,
    notes: `[${input.type}] ${input.message}`.slice(0, 4000),
  });
  const deal = await upsertDeal({
    id: newId(),
    contactId: contact.id,
    title: `Enquiry: ${input.type}`,
    stage: "lead",
    value: null,
    currency: "CAD",
    source: "contact-form",
    notes: input.message.slice(0, 4000),
    createdAt: now,
    updatedAt: now,
  });
  return { contact, deal };
}
