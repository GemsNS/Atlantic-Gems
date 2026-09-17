import "server-only";
import type { IntegrationResult } from "./types";

export function shippingConfigured(): boolean {
  return Boolean(process.env.SHIPPING_API_KEY);
}

export async function getShippingRates(_input: {
  postalCode: string;
  weightGrams?: number;
}): Promise<IntegrationResult<{ rates: { service: string; amount: number; currency: string }[] }>> {
  if (!shippingConfigured()) {
    return {
      status: "unconfigured",
      message: "Shipping rates are not connected yet.",
      data: { rates: [] },
    };
  }
  return {
    status: "unconfigured",
    message: "Shipping adapter is wired but no carrier is enabled in this build.",
    data: { rates: [] },
  };
}
