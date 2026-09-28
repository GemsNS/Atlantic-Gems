import { z } from "zod";
import { enquiryTypes } from "@/lib/site";

const typeValues = enquiryTypes.map((t) => t.value) as [string, ...string[]];

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(120),
  email: z.string().trim().email("Please enter a valid email address.").max(200),
  phone: z
    .string()
    .trim()
    .max(40)
    .regex(/^[0-9+()\-\s.]*$/, "Phone may only contain digits, spaces and + ( ) - .")
    .optional()
    .or(z.literal("")),
  type: z.enum(typeValues),
  message: z
    .string()
    .trim()
    .min(10, "Please tell us a little more (at least 10 characters).")
    .max(4000, "Please keep your message under 4000 characters."),
  consent: z.literal(true, {
    errorMap: () => ({
      message: "Please confirm you consent to be contacted about this enquiry.",
    }),
  }),
  updates: z.boolean().optional().default(false),
  csrf: z.string().min(16).max(128),
  // Honeypot: accepted here so the route can fake success when a bot fills it.
  company_website: z.string().max(200).optional().default(""),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

/** The quote-tray form on /cart. Limits match the CRM schemas it writes into. */
export const quoteRequestSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(120, "Please shorten your name."),
  email: z.string().trim().email("Please enter a valid email address.").max(200),
  company: z.string().trim().max(120, "Please shorten the company name.").optional().default(""),
  notes: z
    .string()
    .trim()
    .max(2000, "Please keep notes under 2000 characters.")
    .optional()
    .default(""),
  csrf: z.string().min(16).max(128),
  // Honeypot: accepted here so the route can fake success when a bot fills it.
  company_website: z.string().max(200).optional().default(""),
});

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;

/** First message per field, keyed by field name, for inline form errors. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export const loginSchema = z.object({
  passphrase: z.string().min(1).max(256),
  csrf: z.string().min(16).max(128),
  next: z.string().max(200).optional(),
});

/**
 * A sign-in's `next` target: a path on this site under `prefix`, or `prefix`
 * itself. The check runs on the path as a browser would resolve it, because
 * dot segments resolve: `/admin/..//evil.example` (or `%2e%2e`, a tab, a
 * backslash) becomes `//evil.example`, a protocol-relative redirect off the
 * site, although the raw string starts with `/admin`.
 */
function safeNextUnder(prefix: string, input: string | undefined): string {
  if (!input || !input.startsWith(prefix)) return prefix;
  if (input.startsWith("//") || input.includes("\\") || input.includes("://")) return prefix;
  try {
    const url = new URL(input, "http://n");
    const p = url.pathname;
    if (url.origin !== "http://n" || (p !== prefix && !p.startsWith(`${prefix}/`))) return prefix;
    return p + url.search;
  } catch {
    return prefix;
  }
}

/** Only allow same-site relative paths under /wholesale to prevent open redirects. */
export function safeNextPath(input: string | undefined): string {
  return safeNextUnder("/wholesale", input);
}

/** Only allow same-site relative paths under /admin to prevent open redirects. */
export function safeAdminNext(input: string | undefined): string {
  return safeNextUnder("/admin", input);
}
