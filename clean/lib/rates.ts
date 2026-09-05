/**
 * Precious metal spot rates in Canadian dollars.
 *
 * Sources (both public, CORS-enabled):
 *  - Spot prices in USD per troy ounce: https://api.gold-api.com
 *  - USD/CAD daily average: Bank of Canada Valet API
 *
 * Rates are indicative only and are labelled as such wherever shown.
 */
export const METALS = [
  { symbol: "XAU", name: "Gold" },
  { symbol: "XAG", name: "Silver" },
  { symbol: "XPT", name: "Platinum" },
  { symbol: "XPD", name: "Palladium" },
] as const;

export type MetalSymbol = (typeof METALS)[number]["symbol"];

export interface MetalRate {
  symbol: MetalSymbol;
  name: string;
  usdPerOz: number;
  cadPerOz: number;
  cadPerGram: number;
  updatedAt: string;
  /** Fractional change vs the previous snapshot, when one exists. */
  change?: number;
}

export interface RatesSnapshot {
  metals: MetalRate[];
  fx: { usdCad: number; date: string; source: string };
  fetchedAt: string;
  source: string;
}

const TROY_OUNCE_GRAMS = 31.1034768;
const SPOT_URL = "https://api.gold-api.com/price/";
const FX_URL = "https://www.bankofcanada.ca/valet/observations/FXUSDCAD/json?recent=1";

interface SpotResponse {
  price: number;
  symbol: string;
  updatedAt: string;
}

interface FxResponse {
  observations: { d: string; FXUSDCAD: { v: string } }[];
}

async function getJson<T>(url: string, init?: RequestInit, attempts = 2): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: { Accept: "application/json" },
      }).finally(() => clearTimeout(timer));
      if (!res.ok) throw new Error(`${res.status}`);
      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("fetch failed");
}

/**
 * Fetches all sources. The FX rate is required; an individual metal that
 * fails is omitted rather than failing the whole snapshot.
 */
export async function fetchRates(init?: RequestInit): Promise<RatesSnapshot> {
  const [fx, ...spots] = await Promise.all([
    getJson<FxResponse>(FX_URL, init),
    ...METALS.map((m) =>
      getJson<SpotResponse>(`${SPOT_URL}${m.symbol}`, init).catch(() => null),
    ),
  ]);

  const obs = fx.observations[0];
  const usdCad = Number(obs?.FXUSDCAD.v);
  if (!obs || !Number.isFinite(usdCad) || usdCad <= 0) {
    throw new Error("Bank of Canada rate unavailable");
  }

  const metals: MetalRate[] = [];
  METALS.forEach((m, i) => {
    const spot = spots[i];
    if (!spot || !Number.isFinite(spot.price) || spot.price <= 0) return;
    const cadPerOz = spot.price * usdCad;
    metals.push({
      symbol: m.symbol,
      name: m.name,
      usdPerOz: spot.price,
      cadPerOz,
      cadPerGram: cadPerOz / TROY_OUNCE_GRAMS,
      updatedAt: spot.updatedAt,
    });
  });
  if (metals.length === 0) throw new Error("No spot prices available");

  return {
    metals,
    fx: { usdCad, date: obs.d, source: "Bank of Canada" },
    fetchedAt: new Date().toISOString(),
    source: "gold-api.com",
  };
}

/** Attach fractional change against a previous snapshot. */
export function withChange(current: RatesSnapshot, previous: RatesSnapshot | null): RatesSnapshot {
  if (!previous) return current;
  return {
    ...current,
    metals: current.metals.map((m) => {
      const prev = previous.metals.find((p) => p.symbol === m.symbol);
      if (!prev || prev.cadPerOz <= 0) return m;
      return { ...m, change: (m.cadPerOz - prev.cadPerOz) / prev.cadPerOz };
    }),
  };
}
