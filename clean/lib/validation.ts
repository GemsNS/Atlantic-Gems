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
  // Honeypot field: must stay empty.
  company_website: z.string().max(0).optional().or(z.literal("")),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

export const loginSchema = z.object({
  passphrase: z.string().min(1).max(256),
  csrf: z.string().min(16).max(128),
  next: z.string().max(200).optional(),
});

/** Only allow same-site relative paths under /wholesale to prevent open redirects. */
export function safeNextPath(input: string | undefined): string {
  if (!input) return "/wholesale";
  if (!input.startsWith("/wholesale")) return "/wholesale";
  if (input.startsWith("//") || input.includes("\\") || input.includes("://")) {
    return "/wholesale";
  }
  return input;
}
