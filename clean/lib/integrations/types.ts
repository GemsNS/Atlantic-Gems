import { z } from "zod";

export type IntegrationStatus = "connected" | "unconfigured" | "error";

export interface IntegrationResult<T = unknown> {
  status: IntegrationStatus;
  message: string;
  data?: T;
}

export const cartLineSchema = z.object({
  partId: z.string(),
  qty: z.number().int().positive().max(999),
});

export type CartLine = z.infer<typeof cartLineSchema>;
