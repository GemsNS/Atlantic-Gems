import "server-only";
import path from "node:path";
import { DATA_DIR, readJson, serialize, writeJsonAtomic } from "@/lib/json-store";
import { newId } from "@/lib/inventory/types";
import {
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

async function listParsed<T>(
  file: string,
  schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false } },
): Promise<T[]> {
  const raw = await readJson<{ items?: unknown[] }>(file, { items: [] });
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

export async function findOrCreateContactByEmail(input: {
  name: string;
  email: string;
  company?: string;
  kind?: Contact["kind"];
  notes?: string;
}): Promise<Contact> {
  const now = new Date().toISOString();
  const email = input.email.trim().toLowerCase();
  const existing = (await listContacts()).find((c) => c.email.toLowerCase() === email && email);
  if (existing) {
    return upsertContact({
      ...existing,
      name: input.name || existing.name,
      company: input.company || existing.company,
      notes: input.notes ? `${existing.notes}\n${input.notes}`.trim() : existing.notes,
      lastActivityAt: now,
      updatedAt: now,
    });
  }
  return upsertContact({
    id: newId(),
    name: input.name,
    email: input.email,
    phone: "",
    company: input.company ?? "",
    kind: input.kind ?? "retail",
    tags: [],
    notes: input.notes ?? "",
    lastActivityAt: now,
    createdAt: now,
    updatedAt: now,
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
