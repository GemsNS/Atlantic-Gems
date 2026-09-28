# Performance budget measurement, 2026-09-21 (plan item U11)

Budget from `docs/100000x-systems-ux.md`: on mobile, LCP under 2.5 s, CLS under 0.05, INP under
200 ms.

**Result: CLS passes on all three pages. LCP fails on all three. INP cannot be measured in the lab;
the interaction timing that stands in for it passes on `/` and `/cart` and fails on `/parts`.**

## Setup

- Server: `next start` on `http://localhost:3100`, production build of the wave 3 working tree
  (after the U6 Suspense change), scratch `DATA_DIR` with the seeded demo parts, `SESSION_SECRET`
  set. Same machine as the browser, so there is no real network; this is not production hosting.
- Lighthouse 13.5.0 through `npm run perf:lighthouse` (`scripts/lighthouse-budget.mjs`): default
  mobile form factor, simulated throttling (150 ms RTT, about 1.6 Mbps, 4x CPU slowdown), headless
  Chrome 153, performance category only. Three runs per page; the median run by score is reported
  and kept.
- `/cart` was measured with one line in the tray (added over HTTP before the runs), not the empty
  state.
- On Windows every Lighthouse run exits 1 with `EPERM` while deleting its temporary Chrome profile,
  after the report is written. The script accepts a run only when a fresh report exists and has no
  `runtimeError`.

## Lighthouse, median of 3

| Page | Score | FCP | LCP | LCP budget | CLS | CLS budget | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 86 | 1.54 s | 3.40 s | **fail** | 0.002 | pass | 259 ms |
| `/parts` | 75 | 1.53 s | 3.35 s | **fail** | 0.003 | pass | 652 ms |
| `/cart` | 87 | 1.39 s | 3.04 s | **fail** | 0.001 | pass | 302 ms |

All runs (score / LCP / CLS / TBT):

- `/`: 76 / 3.43 s / 0.002 / 536 ms; 86 / 3.40 s / 0.002 / 259 ms; 87 / 3.33 s / 0.002 / 237 ms
- `/parts`: 68 / 3.58 s / 0 / 743 ms; 80 / 3.39 s / 0.003 / 418 ms; 75 / 3.35 s / 0.003 / 652 ms
- `/cart`: 81 / 3.02 s / 0.001 / 387 ms; 87 / 3.04 s / 0.001 / 302 ms; 88 / 2.87 s / 0.001 / 292 ms

Reports: `lighthouse-2026-09-21/{home,parts,cart}-median.json` (open in the Lighthouse viewer) and
`summary.json`. The request headers recorded in the cart report are redacted.

### Why LCP misses

From the median reports' LCP breakdown:

| Page | LCP element | Time to first byte | Element render delay |
|---|---|---|---|
| `/` | text in the hero compass SVG (`div.compass > svg > g.compass-bezel > text`) | 32 ms | 1,250 ms |
| `/parts` | hero lede paragraph (`section.shop-hero p.lede`) | 20 ms | 1,171 ms |
| `/cart` | hero lede paragraph (`section.shop-hero p.lede`) | 16 ms | 1,477 ms |

- The LCP element is server-rendered text on every page. On `/parts` and `/cart` it is outside the
  new Suspense boundaries, so the U6 change does not delay it.
- The main thread is dominated by style and layout: 1.3 s on `/`, 1.8 s on `/parts` and 1.6 s on
  `/cart` (4x slowdown), ahead of script evaluation (0.65 to 0.97 s).
- Two render-blocking stylesheets; Lighthouse estimates 200 ms (`/`), 220 ms (`/parts`) and 40 ms
  (`/cart`) of savings.
- Total transfer is 280 to 332 KiB, so page weight is not the cause.

Not tried in this wave: splitting or trimming `globals.css`, inlining the critical CSS, and
reducing hero animations that run at first paint. Each needs a before and after run with this
script.

## Interaction timing (stand-in for INP)

INP is a field metric; a Lighthouse navigation run does not measure it. `npm run perf:interactions`
(`scripts/interaction-latency.mjs`) drives Playwright's Chromium at 412 x 823, mobile, with the CPU
slowed 4x, and records the slowest interaction with the Event Timing API (it reports events of 16 ms
or more, rounded to 8 ms).

| Page | What was done | Interactions | Slowest | 200 ms budget |
|---|---|---|---|---|
| `/` | open the menu, close it with Escape | 2 | 176 ms | pass |
| `/parts` | type "strap" into search, switch to the price list and back | 8 | 368 ms | **fail** |
| `/cart` | step a quantity up three times, type five letters into Name | 9 | 80 ms | pass |

A second probe of `/parts` (two passes, same settings) showed where the time goes: switching the
layout took 232 to 488 ms, and each search keystroke 56 to 320 ms. Both rebuild the parts grid:
the search filters it, and the layout switch remounts it through `key={settleKey}`. Possible fixes, not made in this wave: `useDeferredValue` for the search term, and not
remounting the grid (`key={settleKey}`) when only the layout changes.

## How to re-run

See `docs/CI.md`, "Performance budget". Numbers on a shared CI runner will differ from these.
