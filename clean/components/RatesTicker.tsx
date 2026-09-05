"use client";

import { useEffect, useState } from "react";
import { fetchRates, withChange, type RatesSnapshot } from "@/lib/rates";

const IS_STATIC = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";
const REFRESH_MS = 5 * 60 * 1000;
const STORAGE_KEY = "ag_rates_prev";

const cad = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  currencyDisplay: "code",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const fx = new Intl.NumberFormat("en-CA", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const pct = new Intl.NumberFormat("en-CA", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});
const clock = new Intl.DateTimeFormat("en-CA", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Halifax",
});

function readPrevious(): RatesSnapshot | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RatesSnapshot) : null;
  } catch {
    return null;
  }
}

async function load(): Promise<RatesSnapshot> {
  if (IS_STATIC) {
    // No server on static hosting: query the public sources directly.
    const fresh = await fetchRates();
    const snap = withChange(fresh, readPrevious());
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      /* storage unavailable */
    }
    return snap;
  }
  const res = await fetch("/api/rates", { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(String(res.status));
  const data = (await res.json()) as RatesSnapshot & { ok: boolean };
  if (!data.ok) throw new Error("rates unavailable");
  return data;
}

function Items({ snap }: { snap: RatesSnapshot }) {
  const latest = snap.metals.reduce(
    (t, m) => Math.max(t, Date.parse(m.updatedAt) || 0),
    0,
  );
  return (
    <>
      {snap.metals.map((m) => (
        <span className="tick" key={m.symbol}>
          <span className="tick-sym">{m.name}</span>
          <span className="tick-val">{cad.format(m.cadPerOz)}</span>
          <span className="tick-unit">/oz</span>
          {typeof m.change === "number" && m.change !== 0 ? (
            <span className={`tick-chg ${m.change > 0 ? "up" : "down"}`}>
              {m.change > 0 ? "▲" : "▼"} {pct.format(m.change)}
            </span>
          ) : null}
        </span>
      ))}
      <span className="tick">
        <span className="tick-sym">USD/CAD</span>
        <span className="tick-val">{fx.format(snap.fx.usdCad)}</span>
        <span className="tick-unit">{snap.fx.source}</span>
      </span>
      <span className="tick tick-note">
        Indicative spot, CAD per troy ounce. Not a quotation.
        {latest ? ` Updated ${clock.format(new Date(latest))} Halifax.` : ""}
      </span>
    </>
  );
}

export function RatesTicker() {
  const [snap, setSnap] = useState<RatesSnapshot | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    let timer = 0;
    const schedule = (ms: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(run, ms);
    };
    const run = () =>
      load()
        .then((s) => {
          if (!alive) return;
          setSnap(s);
          setFailed(false);
          schedule(REFRESH_MS);
        })
        .catch(() => {
          if (!alive) return;
          setFailed(true);
          schedule(45_000); // retry sooner after a failure
        });
    run();
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="ticker" role="region" aria-label="Precious metal spot rates">
      {snap ? (
        <div className="ticker-track" aria-live="off">
          <div className="ticker-group">
            <Items snap={snap} />
          </div>
          <div className="ticker-group" aria-hidden="true">
            <Items snap={snap} />
          </div>
        </div>
      ) : (
        <div className="ticker-static">
          <span className="tick tick-note">
            {failed ? "Precious metal spot rates are unavailable right now." : "Loading spot rates…"}
          </span>
        </div>
      )}
    </div>
  );
}
