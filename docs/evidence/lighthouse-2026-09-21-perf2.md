# Performance follow-up 2, 2026-09-21 (plan item U11)

Budget from `docs/100000x-systems-ux.md`: on mobile, LCP under 2.5 s, CLS under 0.05, interactions
under 200 ms. Round 1 is `lighthouse-2026-09-21-perf.md`; it left LCP at 3.00 s on `/`, 2.88 s on
`/parts` and 2.76 s on `/cart`, and the slowest `/parts` interaction at a median of 280 ms.

**Result: LCP still fails on all three pages. It is 0.08 s lower on `/` (2.96 s) and 0.13 s lower on
`/cart` (2.60 s); `/parts` did not move (2.86 s, within the run-to-run spread). CLS still passes.
The early `/parts` interactions lost their slow tail (the worst run went from 696 ms to 264 ms) but
the median is 236 ms and still over budget; once hydration has settled, `/parts` passes at a median
of 144 ms. `/` and `/cart` pass in both passes.**

## Setup

- As in round 1: `next start` on `localhost`, production build, scratch `DATA_DIR` with the seeded
  demo parts, `SESSION_SECRET` set. `npm run perf:lighthouse` (Lighthouse 13.5.0, default mobile
  form factor, simulated throttling, headless Chrome 153) and `npm run perf:interactions`
  (Playwright's Chromium, CPU 4x slower). Windows 11, Intel i5-12500H, same machine as the browser.
- Before: the tree exactly as round 1 left it (the source was compared file by file), built in a
  scratch copy and served on port 3101. After: this tree on port 3100. Every round alternated between
  the two. The runs in rounds 1 to 3 also alternated with two earlier cuts of these changes (see
  "Rounds 1 to 3" below); rounds 4 to 6 were the final tree against the before tree only.
- `/cart` was measured with one line in the tray, as before.
- The machine was in ordinary use, and other review sessions were reading the repository at the same
  time. Total Blocking Time moved by up to 2 s between identical runs, so it is reported but not
  relied on.

## Lighthouse, rounds 4 to 6 (final tree against the before tree, alternating, 9 runs per page each)

| Page | LCP before | LCP after | After, range | LCP budget | CLS, worst run | TBT before | TBT after | Score |
|---|---|---|---|---|---|---|---|---|
| `/` | 3.04 s | 2.96 s | 2.82 to 3.01 s | **fail** | 0.002 | 198 ms | 174 ms | 90 → 92 |
| `/parts` | 2.89 s | 2.86 s | 2.71 to 3.01 s | **fail** | 0.003 | 390 ms | 419 ms | 86 → 84 |
| `/cart` | 2.73 s | 2.60 s | 2.48 to 2.83 s | **fail** | 0.001 | 286 ms | 214 ms | 89 → 91 |

Medians over all runs. The before tree measured 3.04, 2.90 and 2.76 s over all 18 of its runs in
rounds 1 to 6, close to round 1's 3.00, 2.88 and 2.76 s.

Reports: `lighthouse-2026-09-21-perf2/{home,parts,cart}-median.json` are the median runs of round 6
on the final tree (LCP 2.98, 2.81 and 2.66 s), with that round's `summary.json`. `rounds.json` has
every run of every round, `interactions.json` every interaction run. The cookie header recorded in
the cart report is redacted.

### Rounds 1 to 3

The same before tree, alternating with two earlier cuts: "all but the containment line" is the
final tree without the `contain` declaration on the first four cards (change 5), and "without the
`/parts` change" leaves out change 5 altogether (it also still rounded the compass numerals; see
change 4).

| Page | Before (9 runs) | All but the containment line (9 runs) | Without the `/parts` change (6 runs) |
|---|---|---|---|
| `/` | 3.04 s | 2.97 s | 2.93 s |
| `/parts` | 2.91 s | 2.97 s | 2.94 s |
| `/cart` | 2.81 s | 2.72 s | 2.70 s |

The `/parts` figure went up by 0.06 s here and down by 0.03 s in rounds 4 to 6: no change that this
lab can see.

## Interaction timing

`npm run perf:interactions` now times every page twice (change 6): "early" is round 1's script
unchanged, starting at network idle; "settled" waits until the main thread has been free of long
tasks for a second and the first control is on screen. Slowest interaction per page, median and range:

| Page | What was done | Pass | Before, 14 runs | After, 6 runs | Under 200 ms, before and after |
|---|---|---|---|---|---|
| `/` | open the menu, close it with Escape | early | 108 ms (88 to 144) | 128 ms (88 to 152) | 14 of 14, 6 of 6 |
| `/parts` | type "strap" into search, switch to the price list and back | early | 284 ms (168 to 696) | 236 ms (208 to 264) | 2 of 14, 0 of 6 |
| `/cart` | step a quantity up three times, type five letters into Name | early | 80 ms (40 to 208) | 108 ms (48 to 232) | 13 of 14, 5 of 6 |
| `/` | as above | settled | 156 ms (72 to 224) | 164 ms (136 to 176) | 10 of 14, 6 of 6 |
| `/parts` | as above | settled | 148 ms (104 to 224) | 144 ms (104 to 192) | 13 of 14, 6 of 6 |
| `/cart` | as above | settled | 68 ms (56 to 88) | 80 ms (48 to 88) | 14 of 14, 6 of 6 |

- The before runs are all 14 of that build; the 6 of them that alternated with the final tree gave
  360 ms (208 to 696) for early `/parts`. "All but the containment line" (8 runs, alternating with
  the before tree in the first session) gave 252 ms (208 to 272) for early `/parts`, and "without the
  `/parts` change" (4 runs) 256 ms (168 to 448).
- Nothing on `/` or `/cart` that these interactions touch changed; their differences are within the
  spread of the runs.
- Which number the budget refers to: the plan's target is INP, the slowest interaction of a whole
  visit, early taps included. So the early pass is the one that decides the budget, and `/parts`
  still fails it. The settled pass shows what the interactions cost once the page has hydrated.

## Bytes

| | `/` before | `/` after | `/parts` before | `/parts` after | `/cart` before | `/cart` after |
|---|---|---|---|---|---|---|
| First Load JS (`next build` output) | 116 kB | 110 kB | 121 kB | 116 kB | 115 kB | 111 kB |
| JavaScript transferred, files | 124.8 KB, 10 | 118.5 KB, 9 | 129.2 KB, 11 | 124.0 KB, 10 | 123.9 KB, 10 | 119.1 KB, 9 |
| HTML transferred (raw) | 17.3 KB (66.4 KB) | 16.0 KB (54.8 KB) | 22.0 KB (126 KB) | 22.0 KB (126 KB) | 9.5 KB (24.7 KB) | 9.5 KB (24.8 KB) |
| Favicon | 7.5 KB | 1.8 KB | 7.5 KB | 1.8 KB | 7.5 KB | 1.8 KB |
| Everything in a Lighthouse run (median) | 267 KB | 254 KB | 269 KB | 261 KB | 237 KB | 227 KB |

JavaScript and HTML were fetched with `Accept-Encoding: gzip` from the two servers; the JavaScript
row counts the `<script src>` files of each page except the `noModule` polyfills. The shared first
load (102 kB: React and the Next runtime) is unchanged.

## What changed and why

1. **Favicon** (`app/icon.jpg`, new `app/apple-icon.jpg`). The browser fetches the favicon at high
   priority during the first load, and it finished before the late observed paint, so the lab counted
   it towards LCP. Removing it from a saved run (see the what-if table below) saved 109 ms on `/` and
   80 ms on `/cart`. It was a 192 × 192 copy of the mark, 7.5 KB; it is now 64 × 64, 1.8 KB, still
   sharp at the 16 and 32 px a tab draws. The 192 px copy was also what a phone used for a home-screen
   shortcut, so a 180 × 180 `apple-icon.jpg` (6.9 KB) takes over that job; browsers fetch it only when
   a visitor saves the site to the home screen. Both are the brand mark, resized from
   `public/brand/mark.jpg`.
2. **No image component in the browser** (`lib/image-props.ts`, `SiteHeader`, `SiteFooter`, `Hero`,
   `parts/PartMedia`). Every public page shipped next/image's client component (13.5 KB raw, 5.2 KB
   compressed, one request) for the header mark, the footer mark, the home wordmark and the part
   drawings. None of them needs it in the browser: the drawings are unoptimised SVGs, and the JPGs
   need only a `srcset`. They are now plain `<img>` elements with the attributes next/image produced.
   `PartMedia` writes out the drawings' markup, and the JPGs get theirs from `imageProps()`, which
   calls next/image's own `getImgProps` with the same config. The `priority` preloads of the mark and
   the wordmark are kept with React's `preload()`. `getImageProps` from `next/image` was tried first
   and did not help: importing `next/image` in a server component registers the client component, so
   the chunk still loaded on every page. The only markup change is that the unused `data-nimg="1"`
   attribute is gone.
3. **Home sections load only when shown** (`components/HomeSections.tsx`, `app/page.tsx`). The gem
   explorer, the jewellery paths and the atelier board are switched on by the site mode. None of them
   is shown on `/` in the current mode, but their code was in the home page's first-load JavaScript.
   They now go through `next/dynamic`: still rendered on the server when shown, with their code in a
   separate chunk that is fetched only then. The home page chunk went from 6.1 to 4.6 KB compressed.
4. **Compass** (`components/CompassHero.tsx`). The dial, bezel and rose are built once as constants,
   so a needle move re-renders only the needle, and the stroke and type settings sit on three groups
   instead of on each of the 120 ticks and 12 numerals. The tick ends are rounded to 0.01 of a unit on
   the 600-unit dial (they were printed as, for example, `299.99999999999994`). The numerals keep full
   precision, because rounding their centres moved the anti-aliasing of two of them by a pixel. The
   compass markup went from 25.1 to 11.9 KB raw (3.8 to 2.4 KB compressed).
5. **`/parts`: the counter is laid out with the page** (`app/parts/page.tsx`, `app/globals.css`).
   Round 1 put the counter's section and every card behind `content-visibility: auto`. That made the
   load cheaper, but the section was then laid out the first time it came near the viewport, and in
   the interaction script that is the first tap: Playwright scrolls the search box into view and taps
   it in the same frame. The counter's section is no longer deferred, and the first four cards (the
   first two rows on a phone, the first row and one more on a desktop) are laid out with the page; the
   other 26 cards and the price-list rows stay deferred. The four cards keep `contain: layout style
   paint`, the containment `content-visibility: auto` gives a card on screen, so they stack and clip
   as before. This is what took away the slow tail of the early `/parts` runs (table below).
6. **`npm run perf:interactions` measures twice** (`scripts/interaction-latency.mjs`, `docs/CI.md`).
   The early pass is the old script. The settled pass waits until the main thread has gone a second
   without a long task, scrolls the first control into view, lets two frames pass, and then runs the
   same steps. The script fails if either pass is over 200 ms.

## The four levers in the brief

1. **Font preloads.** Nothing to change. Both regular faces are painted in the first screen of all
   three pages (the header name and the headings in Cormorant Garamond, the text in Manrope), and the
   Cormorant italic, used once far down the home page, already has `preload: false`. The fallbacks are
   size-adjusted: `Cormorant Garamond Fallback` is Times New Roman with `size-adjust: 96.98%`,
   `ascent-override: 95.27%` and `descent-override: 29.59%`; `Manrope Fallback` is Arial with
   `size-adjust: 103.19%`, `ascent-override: 103.31%` and `descent-override: 29.07%`. This Windows
   build still emits no font preload tags (round 1). Marking both font files as preloaded in a saved
   run changed the simulated LCP by −5 ms on `/`, 0 on `/parts` and +41 ms on `/cart`: they start
   earlier but share the same bandwidth. Asking Google Fonts for a weight range instead of a list
   returns the same two files (24,836 and 37,640 bytes), so there is nothing to trim there either.
2. **JavaScript on first load.** Changes 2 and 3; First Load JS is 4 to 6 kB lower on each page and
   one request fewer. What is left is React and the Next runtime (about 100 KB transferred), the link
   component, the layout's two client components, the error boundaries and the page's own code.
3. **`/parts`.** Change 5, measured in both passes. The list's first screen is eager and the rest is
   deferred through `content-visibility`. Rendering fewer cards up front did not help (below), and
   the quick-add controls were not the cost.
4. **Other findings.** The HTML streaming, the request count and the text layout cost, below.

## What the LCP number is made of

As in round 1, the LCP here is Lantern's simulation, and every request that finished before the
headless browser's late observed paint counts. One saved run per page of the before tree was
re-audited (`lighthouse -A`) with one thing changed in its network log each time:

| Changed in the saved run (before tree) | `/` | `/parts` | `/cart` |
|---|---|---|---|
| nothing (as measured) | 2.97 s | 3.03 s | 2.74 s |
| HTML shrunk to 14 KB transferred | 2.82 s | 2.88 s | (already 12 KB) |
| favicon removed | 2.86 s | 3.03 s | 2.66 s |
| the part drawings removed (7 SVG files on `/` and `/parts`, 1 on `/cart`) | 2.81 s | 2.92 s | 2.74 s |
| the home page chunk removed | 2.86 s | – | – |
| the two error-boundary chunks removed | 2.86 s | 3.02 s | 2.74 s |
| the link and image chunks removed | 2.86 s | 3.02 s | 2.69 s |
| both font files preloaded | 2.97 s | 3.03 s | 2.78 s |
| web fonts removed | 2.56 s | 2.73 s | 2.44 s |
| all JavaScript removed | 1.94 s | 1.83 s | 1.68 s |
| changes 1 and 2 as byte counts: favicon at 30 % of its transfer, image chunk removed | 2.86 s | 3.03 s | 2.69 s |
| the same, plus the smaller home page chunk and HTML of changes 3 and 4 | 2.86 s | – | – |

- **The HTML and TCP's first window.** Lantern gives a new connection a first window of 14.6 KB
  (10 packets); a document larger than that takes one more 150 ms round trip. With headers, `/` is
  17.5 KB and `/parts` 23.5 KB, so both pay it; `/cart` (11.2 KB) does not. Getting under the line
  saved 150 ms on `/` and `/parts` in the table above. Most of the excess is how `next start`
  compresses a streamed page: it flushes gzip after every piece of the stream, and the RSC payload
  arrives in pieces of about 2 KB. The home page, 54.8 KB raw, compresses to 9.1 KB in one piece but
  goes out as 16.0 KB in about 24 pieces. Changes 2 and 4 took 1.3 KB off it, not enough to cross the
  line; the rest needs fewer or larger flushes, which Next does not expose, or less markup that the
  server renders twice (as HTML and again in the RSC payload).
- **Request count.** Over HTTP/1.1 with six connections per host, removing the home page chunk
  alone, the two error-boundary chunks or the link and image chunks (3 to 7 KB each) each saved about
  110 ms on `/`, as much as the favicon. That is why dropping the image chunk and shrinking the
  favicon moved `/` and `/cart`. On `/parts` none of these requests is on the critical path: its
  document and the 55 KB React chunk are, and neither changed.
- **What is left** is the same as after round 1: the framework JavaScript (about 100 KB of the
  119 to 124 KB), the two brand font files (62 KB) and the stylesheet (16 KB), which all finish before
  the late observed paint.

## `/parts` interactions: what the traces show

- **Round 1's `content-visibility` moved the work into the first tap.** With the counter deferred,
  scrolling the search box into view laid out the section and the cards near it in one task. Timed
  on the before tree at 4x CPU, with CSS injected before the first paint (2 runs each):

  | `/parts` variant | Layout during load | Longest task after scrolling to the search box |
  |---|---|---|
  | as round 1 left it | 345 to 354 ms | 185 to 387 ms |
  | counter section not deferred | 345 to 375 ms | 167 to 222 ms |
  | counter section and first four cards not deferred (kept) | 462 to 514 ms | 76 to 126 ms |
  | nothing deferred on the page | 568 to 612 ms | 59 to 68 ms |
  | every card not deferred, section still deferred | not timed | 659 to 844 ms |
  | nothing deferred, page set in Arial | 318 to 380 ms | 61 to 107 ms |

  Showing only the first six cards instead of thirty made no difference to that task, because cards
  far below the screen were already skipped. The kept variant costs about 140 ms more layout at load
  (4x CPU), which is why only the first four cards are eager. These variants predate the `contain`
  line on the four cards.
- **Text layout in the brand fonts is most of the layout time.** With nothing deferred, the load's
  layout took about 590 ms at 4x in the brand font stacks and about 350 ms with the page set in
  Arial. That comes with the fonts, which stay.
- **What the early pass still pays.** The script opens `/` first, so `/parts` loads from a warm cache
  and reaches network idle while it is still hydrating. On the final tree the slowest event is then
  usually the first keystroke. Its task takes about 130 ms at 4x, most of it a layout forced while the
  letter is inserted (about 90 ms, although only 28 layout objects were dirty). The list's deferred
  re-render and its layout (up to about 140 ms) then run between keystrokes, and a key press or release
  that lands on them waits. In a fresh browser context, where the page is idle by network idle, every
  interaction of the same sequence stayed under 110 ms in 4 diagnostic runs. After hydration it is
  about 145 ms, the settled pass.
- Tried in the lab and not kept: `contain: layout` on the search box, the filter bar, the list
  column or every card. None changed the keystroke's layout time beyond the noise.

## Visual check

Screenshots with Playwright at 412 × 823 and 1280 × 900 of `/`, `/parts` and `/cart` (first screen
and full page, fonts loaded, reduced motion), before tree against final tree, compared pixel by pixel:

- `/` and `/cart`: the only differing pixels are in the spot-rate ticker, whose live prices change
  between captures (1,408 pixels at 412 px, 6,791 at 1280 px, the same on every page; two captures
  of the unchanged before tree differ in the same place).
- `/parts`: a full-page capture draws deferred cards as blank frames, so there the final tree shows
  four drawn cards where the before tree showed blanks. Captured instead screen by screen while
  scrolling, as a visitor sees the page, the two trees differ only by a 1 px vertical shift below the
  first rows: the before tree sizes the first cards from `content-visibility`'s remembered size once
  they scroll away, the final tree keeps them laid out. Shifted by that pixel, the screens are
  identical.
- Page heights are the same (with every section drawn: 4,045, 10,320 and 2,507 px at 412 px wide;
  2,741, 7,402 and 1,735 px at 1280 px).

## Not measured here

- A Linux build (CI or the deploy host) emits the font preloads that this Windows build does not.
- HTTP/2 through the TLS proxy in `docs/DEPLOY.md`, which would also change the request-count effect
  above.
- Field data: INP and LCP from real phones on real networks.

## What still misses the budget

- **LCP on all three pages**, by 0.10 s (`/cart`) to 0.46 s (`/`). What is left is bytes that finish
  before the late observed paint: the framework JavaScript, the brand fonts and the stylesheet. Each
  remaining step needs a decision: `font-display: optional` or later font loading (ruled out for this
  round), subsetting the fonts, serving through the proxy with HTTP/2, or cutting the markup that is
  rendered twice so the home and `/parts` documents fit in the first TCP window.
- **`/parts` interactions in the early pass**, at 236 ms. Next steps: make the first keystroke's
  list update cheaper (hide filtered cards instead of unmounting them, or update the list after a
  short pause in typing), or a card layout with fewer nested grids so a list change lays out faster.

## How to re-run

See `docs/CI.md`, "Performance budget". For the what-if table, save a run with
`npx lighthouse@13.5.0 <url> --only-categories=performance -GA=<dir>`, edit the saved network log,
and re-audit it with `-A=<dir>` and the same flags (for `/cart`, the same `--extra-headers` file).
