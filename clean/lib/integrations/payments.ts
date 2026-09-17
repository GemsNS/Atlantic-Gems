import "server-only";
import type { IntegrationResult } from "./types";

export function paymentsConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export async function createPaymentIntent(input: {
  amountCents: number;
  currency: string;
  quoteId: string;
}): Promise<IntegrationResult<{ clientSecret?: string }>> {
  void input;
  if (!paymentsConfigured()) {
    return {
      status: "unconfigured",
      message: "Card payments are not connected yet. Quotes can still be requested.",
    };
  }
  return {
    status: "unconfigured",
    message: "Stripe adapter is wired but live capture is not enabled in this build.",
  };
}
