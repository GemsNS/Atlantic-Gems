import "server-only";
import type { IntegrationResult } from "./types";

export function accountingConfigured(): boolean {
  return Boolean(process.env.ACCOUNTING_API_KEY);
}

export async function syncInvoice(_input: {
  quoteId: string;
}): Promise<IntegrationResult> {
  if (!accountingConfigured()) {
    return {
      status: "unconfigured",
      message: "Accounting sync is not connected yet.",
    };
  }
  return {
    status: "unconfigured",
    message: "Accounting adapter is wired but sync is not enabled in this build.",
  };
}
