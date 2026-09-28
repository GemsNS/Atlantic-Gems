# Continuous integration checks

GitHub Actions runs these checks from `.github/workflows/ci.yml` on every push to `main`, on every
pull request, and when started by hand (Actions → CI → Run workflow). The steps below are the same
ones, in order, from `clean/`, for a person to run before a release or to reproduce a red run. Each
one exits non-zero on failure.

## Every change

```sh
npm ci
npm run check            # typecheck, lint, string scan, next build
npm run build:static     # the GitHub Pages export still builds
```

`npm run typecheck` runs `next typegen` before `tsc`. `next-env.d.ts` is in `.gitignore`, and
without it `tsc` cannot type the image imports (`Cannot find module '@/public/…'`), so the typegen
step is what lets a fresh clone pass. On a working copy that has built before, it only refreshes
`.next/types/`.

## Journey tests (after `npm run check`, which leaves a production build in `.next/`)

```sh
npx playwright install --with-deps chromium   # once per runner image
npm run test:e2e
```

`npm run test:e2e` (`playwright.config.ts`, `e2e/`) starts its own `next start` on port 3100 with a
scratch `DATA_DIR` in the system temp folder and a test-only `SESSION_SECRET`, then drives Chromium
through the quote journey:

1. Add a part from `/parts`, raise the quantity on `/cart`, send the tray (honeypot empty), and check
   that focus lands on the "Tray received" confirmation and the draft is cleared.
2. A bad email is marked `aria-invalid`, gets focus, and nothing typed is lost.
3. The form draft is restored after a line edit reloads the page, and only the four customer fields
   are stored.
4. With the token cookie removed, the form gets a 403 `csrf`, reads the fresh cookie and retries
   once; the test requires the 403 followed by a 200.
5. `/parts?q=…&view=ledger` restores the search and layout.
6. A `?brand=` that is not on the counter is ignored, so no made-up text shows in the filter pill.
7. The quote form's plain POST (sent with `form.submit()`, which skips the enhanced handler, as a
   browser does without JavaScript) follows the redirect to the focused "Tray received" box.
8. A server refusal with no field errors (a 429, stubbed) moves focus to the status box, five times
   in a row.
9. The contact form, with its token cookie removed, retries once (403 then 200) and lands focused on
   the thank-you box.
10. The contact form's plain POST lands on `/contact?sent=1` with nothing typed in the URL.

The suite sends three quotes and two enquiries. Checkout allows five per ten minutes, and without
`TRUST_PROXY` all local requests share one bucket, so it runs on one worker with no retries, and
starts a fresh server every run (`reuseExistingServer: false`). Port 3100 must be free, or set
`E2E_PORT`. Its server gets empty `RESEND_API_KEY` and `CONTACT_WEBHOOK_URL`, `CUSTOMER_ACK_EMAIL=false`
and `TRUST_PROXY=false`: `next start` also loads `clean/.env.local`, `.env.production` and `.env`,
but never over a variable that is already set, so a developer's mail settings there cannot send the
test quotes to the house inbox or to a customer.

The HTTP smoke test and the live string scan need a server you start yourself, with the same blanks:

```sh
DATA_DIR=$(mktemp -d) SESSION_SECRET=ci-only-secret RESEND_API_KEY= CONTACT_WEBHOOK_URL= \
  CUSTOMER_ACK_EMAIL=false TRUST_PROXY=false npx next start -p 3000 &
until curl -sf http://127.0.0.1:3000/api/health >/dev/null; do sleep 1; done
SMOKE_BASE_URL=http://127.0.0.1:3000 npm run smoke
SCAN_BASE_URL=http://127.0.0.1:3000 npm run scan
```

The smoke test expects the default settings of a scratch `DATA_DIR`. It checks that a missing part,
the switched-off collection and a missing collection piece return 404, which fails if a route-level
`loading.tsx` is added to the parts or collection pages again (plan item U6). It checks that every
redirect it follows is relative or on its own origin, that emptying the tray with a bad token says
so, and the quote form's plain (no-JS) POST. Its token-retry step stops at validation, so a run uses
one of the five quote requests allowed per ten minutes and can be repeated against the same server.

Every page renders per request, so `next build` writes no HTML and the `npm run scan` inside
`npm run check` only reads the source (`app`, `components`, `lib`, `public` and `static-overlay`).
The draft-copy list in `scripts/scan-strings.mjs` (placeholder text and unfinished-work markers) is
checked only when `SCAN_BASE_URL` points at a running server. The live scan checks each page's
status: the pages on in every site mode must answer 200, and so must every page `/sitemap.xml`
lists (the scan fails if `/sitemap.xml` itself does not answer 200 or lists nothing, which would
otherwise make every switchable page optional); the pages a site mode switches off are scanned when they answer 200 and listed as skipped
when they answer 404; anything else fails. With `/parts` on, it also scans `/cart`, one tray and one
part page found from `/parts`, and `/nope-404` must answer 404. A 404 is never counted as scanned.

## Performance budget (release checks, not every push)

Against a production server with a scratch `DATA_DIR` (as above, port 3100, `localhost`):

```sh
LH_BASE_URL=http://localhost:3100 npm run perf:lighthouse
LH_BASE_URL=http://localhost:3100 npm run perf:interactions
```

`perf:lighthouse` runs `npx lighthouse@13.5.0` in mobile mode three times on `/`, `/parts` and
`/cart` (with one line in the tray) and fails if the median LCP misses 2.5 s or the median CLS
misses 0.05, each metric's median taken on its own; the run with the median performance score is
kept as the representative report. Its reports go to a folder in the system temp directory unless
`LH_OUT` names another. The `/cart` reports carry the test tray's cookies in their headers, so keep
them out of the repository: `clean/lighthouse-out/` is git-ignored, and evidence files are redacted
by hand. `perf:interactions` times real clicks and typing with the CPU slowed 4x, twice per page:
"early", from network idle as in the first rounds (the page may still be hydrating, and Playwright
scrolls a control into view and taps it in the same frame), and "settled", after the main thread has
gone a second without a long task and the control has been scrolled into view. It fails if either
pass is over 200 ms; INP counts early taps too, so the early pass is the one that decides the budget.
It also fails if the presses did not land: each pass counts the pointer and key presses the page
received against the ones it made, and needs the browser's first-input entry, because an empty
timing record reads "under 16 ms" whether everything was fast or nothing was measured. Both
need Chrome; Lighthouse uses the system Chrome. Results from a shared CI runner vary more than from a
quiet machine, so treat a single failure as a reason to re-run and look, not as proof of a
regression. That is why neither is in the workflow.

Each measured round is written up in `docs/evidence/` as a `lighthouse-<date>….md` file, usually
with its saved reports in a folder of the same name. `lighthouse-2026-09-21.md` is the first
measurement, `lighthouse-2026-09-21-perf.md` the first follow-up and `lighthouse-2026-09-21-perf2.md`
the second; later rounds add their own files. Read the newest one for the current results and what
is still over budget.

- Compare two builds by alternating runs between them, not by single runs: on a desktop machine one
  run can differ from the next by a few hundred milliseconds.
- A Windows build emits no `next/font` preload tags (its `.next/server/next-font-manifest.json` is
  empty). A Linux build, such as the CI runner or the deploy host, is expected to emit them, so its
  lab numbers will differ from a Windows machine's.
- The lab measures plain `next start` over HTTP/1.1; production serves through the TLS proxy in
  `docs/DEPLOY.md`.

## The workflow

`.github/workflows/ci.yml` runs on `ubuntu-latest` with Node 22 (`clean/package.json` has no
`engines` field) and caches npm downloads against `clean/package-lock.json`. It needs no secrets and
can only read the repository (`permissions: contents: read`). A newer push to the same branch or pull
request cancels the run it replaces. On a private repository the runs count against the account's
Actions minutes.

- **check**: `npm ci`, `npm run check`, `npm run build:static`. `npm run typecheck`, inside
  `npm run check`, runs `next typegen` first, so there is no separate typegen step.
- **journey**, which starts only after **check** passes, so a type or lint error is reported once
  and no time goes on a browser install for a change that does not build: `npm ci`, `npm run build`
  (jobs do not share `.next/`), `npx playwright install --with-deps chromium`, `npm run test:e2e`.
  Then it starts `next start` on port 3000 with a scratch `DATA_DIR` from `mktemp` and a CI-only
  `SESSION_SECRET`, waits up to 60 seconds for `/api/health`, runs `npm run smoke` and the live
  `npm run scan`, and stops the server. These run `next start`, not the standalone
  `.next/standalone/server.js` that production runs, so the post-deploy checks in `docs/DEPLOY.md`
  still apply after a deploy. When a step fails, the job prints the server log and
  uploads `clean/playwright-report/` and `clean/test-results/` as the `playwright-report` artifact
  (kept 14 days).

Still manual:

- The performance budget above.
- `PRIVATE_STRINGS` in the string scan. The private strings are kept out of the repository and the
  workflow has no secrets, so run `PRIVATE_STRINGS=… SCAN_BASE_URL=… npm run scan` by hand.
- Deploys. The workflow builds the Pages export to prove it still builds, but publishes nothing; the
  server deploy and the `gh-pages` publish are in `docs/DEPLOY.md`.
