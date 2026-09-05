import { NextResponse } from "next/server";
import { fetchRates, withChange, type RatesSnapshot } from "@/lib/rates";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Server-side cache so upstream sources are hit at most once per interval. */
const TTL_MS = 5 * 60 * 1000;
let cached: RatesSnapshot | null = null;
let previous: RatesSnapshot | null = null;
let inflight: Promise<RatesSnapshot> | null = null;

async function getSnapshot(): Promise<RatesSnapshot> {
  if (cached && Date.now() - Date.parse(cached.fetchedAt) < TTL_MS) return cached;
  if (!inflight) {
    inflight = fetchRates({ cache: "no-store" })
      .then((fresh) => {
        previous = cached;
        cached = withChange(fresh, previous);
        return cached;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export async function GET(req: Request) {
  const rl = rateLimit(clientKey(req, "rates"), 60, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false }, { status: 429, headers: { "Retry-After": "60" } });
  }
  try {
    const snapshot = await getSnapshot();
    return NextResponse.json(
      { ok: true, ...snapshot },
      { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } },
    );
  } catch (err) {
    // Serve the last good snapshot if upstream is briefly unavailable.
    if (cached) return NextResponse.json({ ok: true, ...cached, stale: true });
    console.error("rates unavailable:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
