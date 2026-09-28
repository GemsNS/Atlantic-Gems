# Performance follow-up, 2026-09-21 (plan item U11)

Budget from `docs/100000x-systems-ux.md`: on mobile, LCP under 2.5 s, CLS under 0.05, interactions
under 200 ms. The first measurement, before any of this work, is `lighthouse-2026-09-21.md`.

**Result: LCP is 0.2 to 0.4 s lower on all three pages and still fails the 2.5 s budget on all
three (3.00 s on `/`, 2.88 s on `/parts`, 2.76 s on `/cart`). CLS still passes. Total Blocking Time
is 25 to 45 % lower. The slowest interaction on `/parts` is down from a median of 360 ms to 280 ms
and still fails; `/` and `/cart` pass.**

## Setup

- As in the first measurement: `next start` on `localhost`, production build, scratch `DATA_DIR`
  with the seeded demo parts, `SESSION_SECRET` set. `npm run perf:lighthouse` (Lighthouse 13.5.0,
  default mobile form factor, simulated throttling, headless Chrome 153) and
  `npm run perf:interactions`. Windows 11, Intel i5-12500H, same machine as the browser.
- Before and after were measured side by side, because single runs on this machine vary by 150 to
  300 ms. The wave 3 tree (everything before these changes) was rebuilt in a scratch copy and served
  on port 3101; the changed tree was served on 3100; the runs alternated between the two. Before:
  3 rounds of `perf:lighthouse`, 9 runs per page. After: 2 rounds, 6 runs per page. Interactions:
  8 runs per build, alternating.
- `/cart` was measured with one line in the tray, as before.
- The machine was in ordinary desktop use during the runs.

## Lighthouse, all runs

| Page | LCP before | LCP after | After, range | LCP budget | CLS, worst run | TBT before | TBT after | Score |
|---|---|---|---|---|---|---|---|---|
| `/` | 3.36 s | 3.00 s | 2.73 to 3.06 s | **fail** | 0.002 | 271 ms | 148 ms | 85 → 91 |
| `/parts` | 3.28 s | 2.88 s | 2.80 to 3.04 s | **fail** | 0.003 | 527 ms | 308 ms | 78 → 88 |
| `/cart` | 2.97 s | 2.76 s | 2.72 to 2.84 s | **fail** | 0.001 | 389 ms | 287 ms | 85 → 89 |

Medians over all runs. The first measurement this morning had LCP 3.40, 3.35 and 3.04 s.

Reports: `lighthouse-2026-09-21-perf/{home,parts,cart}-median.json` are the median runs of the last
round on the changed build (LCP 2.96, 2.90 and 2.82 s), with that round's `summary.json`.
`rounds.json` has every run of every round in this file. The cookie header recorded in the cart
report is redacted.

## Interaction timing, 8 alternating runs per build

| Page | What was done | Slowest, before (median, range) | Slowest, after (median, range) | Under 200 ms, before and after |
|---|---|---|---|---|
| `/` | open the menu, close it with Escape | 100 ms (96 to 128) | 120 ms (88 to 160) | 8 of 8, 8 of 8 |
| `/parts` | type "strap" into search, switch to the price list and back | 360 ms (240 to 432) | 280 ms (224 to 536) | 0 of 8, 0 of 8 |
| `/cart` | step a quantity up three times, type five letters into Name | 76 ms (56 to 240) | 80 ms (56 to 168) | 7 of 8, 8 of 8 |

The difference on `/` is within the spread; nothing on the home page's menu changed.

## What the LCP number is made of

The LCP that Lighthouse reports in this setup is not the paint the browser saw. It is a simulation
(Lantern): every request that finished before the observed paint is replayed at 150 ms round trip
and about 1.6 Mbps, with the main-thread tasks that matter slowed 4x, and the estimate is the time the
last of them would finish.

- The observed paint is late in this lab. Headless Chrome records the first paint at about 300 ms
  but presents it at 0.4 to 1.5 s; in a trace of `/privacy` with the scripts stripped, the paint was
  recorded at 327 ms and presented at 815 ms, with the GPU process busy in between. Playwright's
  Chromium paints the same pages in about 150 to 300 ms. By the time of the late paint all of the
  JavaScript (about 128 KB transferred: React, the Next runtime and the page chunks) has downloaded
  and run, so it is part of the estimate.
- To see which parts count, one saved run per page was re-audited (`lighthouse -A`) with one thing
  changed in its network log or trace each time:

| Changed in the saved run (changed build) | `/` | `/parts` | `/cart` |
|---|---|---|---|
| nothing (as measured) | 3.00 s | 3.04 s | 2.75 s |
| JavaScript cut to 5 % of its bytes | 2.12 s | 2.05 s | 1.83 s |
| no JavaScript | 1.82 s | 1.74 s | 1.52 s |
| no web fonts | 2.59 s | 2.69 s | 2.43 s |
| font files half their size | 2.74 s | 2.97 s | 2.61 s |
| first layout task cut to 2 % (`/`) or half (`/parts`) of its time | 3.00 s | 3.04 s | not run |

- On the before build the same method gave: the 55 KB favicon removed, −0.30 s on `/` and on
  `/cart`; the `/api/rates` request removed, −0.18 s on `/`; the router's RSC prefetch requests
  removed, no change.
- So the first file's explanation, that style and layout hold the LCP back, does not hold for this
  number. Shortening the first layout changes nothing, because the critical path is network bytes,
  not the main thread. The main thread does matter for Total Blocking Time and for interactions.

## What changed and why

1. **Favicon.** `app/icon.jpg` was the 1000 × 1000 brand mark, 55 KB, which the browser fetched at
   high priority before the simulated paint. It is now a 192 × 192 copy of the same mark, 7.5 KB.
   The full-size file is still `public/brand/mark.jpg`. About −0.3 s on `/` and `/cart`.
2. **Spot-rate ticker** (`components/RatesTicker.tsx`). The first `/api/rates` request now waits for
   the first largest-contentful-paint entry (the `load` event where the browser does not report LCP;
   4 s at most), so it no longer competes with the first paint. In the after runs it lands after the
   paint. About −0.18 s on `/`. "Loading spot rates…" shows for a moment longer.
3. **zod out of the browser.** `PartsBrowser`, `PartCard` and `lib/format` took their labels from
   `lib/parts/types` and `lib/inventory/types`, which import zod, so zod (13 KB transferred, 56 KB
   raw) shipped on `/parts`, `/parts/[category]`, `/inventory` and `/wholesale`. The labels now live
   in `lib/parts/categories.ts` and `lib/inventory/labels.ts`, re-exported from the old modules so
   server code is unchanged. First-load JS on `/parts` went from 137 KB to 121 KB. zod is still sent
   to the two admin item forms, which validate with it.
4. **`/parts` interactions** (`components/parts/PartsBrowser.tsx`).
   - The search term, the filters, the sort and the layout reach the list through
     `useDeferredValue`, so a keystroke or a toggle paints before the list re-renders.
   - The list is a memoised component in its own `<Suspense>` boundary. The search and the toggles
     hydrate first, and a tap on them no longer makes React hydrate the thirty cards on the spot.
   - The facet counts are one pass over the parts, not one pass per chip on every render, and each
     part's search text is built once, not on every test.
   - Cards and price-list rows are memoised. The grid is remounted, with its settle animation, only
     when a filter or the sort changes; the layout key no longer includes the view.
5. **`content-visibility: auto`** with `contain-intrinsic-size: auto …` on the below-the-fold
   sections of `/` and `/parts` (`.section-defer`), the footer, the part cards and the price-list
   rows. Loading `/parts` at 4x CPU (median of 5 traces, with the same CSS injected through a proxy):
   layout 644 → 361 ms, paint 183 → 66 ms, long tasks 1,259 → 901 ms. No effect on the simulated LCP.
6. **No viewport prefetch on catalogue links** (part cards, price-list rows, tray tiles and tabs).
   These pages render per request and have no loading boundary, so Next's automatic prefetch fetched
   only the route tree (221 bytes for a part page). During the first interactions on `/parts` it sent
   15 of these requests, 13 of them from these links. Navigation fetches the page on click either
   way.
7. **Fonts** (`app/layout.tsx`). Weight 300 was never used and is dropped from both families. The
   Cormorant italic, used once (the stone family line in the gem explorer), is its own `next/font`
   call with `preload: false`. Both families are variable fonts, so the weight trim shrinks the
   @font-face sheet (20.7 KB → 13.4 KB raw) and not the downloads. The italic change matters on Linux
   builds; see "Not measured here".

## Tried and not kept

- **`experimental.inlineCss`** (supported in Next 15.5.2; it merges both sheets into one `<style>`,
  and the CSP already allows inline styles). No gain. Median LCP with and without it, same code,
  alternating rounds: `/` 3.03 and 3.02 s, `/parts` 3.00 and 2.81 s, `/cart` 3.00 and 2.81 s. It
  would also put 14 KB of compressed CSS into every HTML response, where the browser cannot cache it
  across pages. Not adopted, so the static export was not built with it.
- **Hero effects** (the blurred caustics, the compass drop shadow, the sweep, the turning bezel, the
  header's backdrop blur). Switching them off, and in another run every filter, shadow, gradient and
  animation on the page, moved the simulated LCP by less than the run-to-run spread. They stay.
- **Fewer @font-face rules** (latin only, or one rule per weight range): no measurable change.

## Why there are two stylesheets

`globals.css` (69 KB, 14 KB transferred) and the sheet `next/font` generates (the @font-face rules
and the font-variable classes; 13 KB, under 2 KB transferred). `next/font` emits its CSS as its own
module, so it lands in its own chunk. Both block rendering; Lighthouse estimates 0.31 and 0.16 s of
savings from inlining them, but inlining did not move the simulated LCP (above).

## The LCP element

Unchanged. On `/parts` and `/cart` it is the hero lede paragraph. On `/` it is a numeral in the
compass bezel (`div.compass > svg > g.compass-bezel > text`): Chrome reports its size as about
67,000 px² although it is drawn at about 16 × 16 px, so it outranks the hero copy. The compass is
server-rendered, starts visible and has no start state that hides it; it paints in the first frame
with everything else.

## Not measured here

- **Font preloads.** This Windows build emits no font preload tags, and its
  `.next/server/next-font-manifest.json` is empty. The likely cause: `next/font` 15.5.2 finds the
  files to preload by matching `/next-font-loader/index.js?` in module paths, and on Windows those
  paths use backslashes. A Linux build (CI, the deploy host) should emit the preloads. Simulated on
  the changed build by adding the Linux preload tags through a proxy, 3 runs each: preloading
  Manrope, Cormorant and the Cormorant italic, LCP 3.05 s on `/` and 3.30 s on `/parts`; preloading
  only Manrope and Cormorant, 2.83 and 3.04 s; no preloads (this build), 3.04 and 3.04 s. That is
  why the italic now has `preload: false`. A Linux runner will give different numbers from these.
- Field data: INP and LCP from real phones on real networks.

## What still misses the budget

- **LCP on all three pages**, by 0.26 to 0.50 s. What is left is bytes: the JavaScript that has run
  by the late observed paint (about 0.9 s in the what-if), most of it the React and Next runtime,
  and the two font files (62 KB, 0.3 to 0.4 s). Not done here, and each needs a decision:
  `font-display: optional` (no swap, but first visits on slow connections would often keep the
  fallback fonts), subsetting the fonts below Google's latin subset, and serving over HTTP/2 through
  the reverse proxy in `docs/DEPLOY.md` (plain `next start` is HTTP/1.1, which the lab measures).
  The delay between paint and presentation in headless Chrome is part of the number and is not in
  the page.
- **`/parts` interactions**, at 280 ms. The script starts at `networkidle`, which on this page comes
  before hydration has finished at 4x CPU, so the first tap often makes React hydrate the counter's
  controls on the spot (up to 200 ms in the traces), and the fonts and card images that arrive in
  the same second relayout the page. Next steps: render one screen of cards first with a "Show all"
  control, or move the price and quantity controls out of client components so the cards need less
  hydration.

## How to re-run

See `docs/CI.md`, "Performance budget". For the what-if tables, save a run with
`npx lighthouse@13.5.0 <url> --only-categories=performance -G=<dir>`, edit the saved network log or
trace, and re-audit it with `-A=<dir>` and the same flags.
