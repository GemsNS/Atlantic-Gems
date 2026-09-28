# 100000x systems and customer experience plan

Owner: lead programmer. Scope: the production Next.js app in `clean/`. Facts discipline follows
`docs/FACTS-REGISTER.md`: nothing in this plan adds prices, stock, certifications, origins, hours or
a phone number to customer-facing copy.

The bar is that no customer action on the public site should fail silently, lose what the customer
typed, or rely on someone remembering to check a JSON file. Every path a customer touches must
either succeed, or say plainly what went wrong and give a route that works, usually the support
email address.

## Journey audited (2026-09-20)

| Surface | Files | State |
|---|---|---|
| Home | `app/page.tsx` | Server-rendered, driven by site mode; links to parts, cart, contact and trade |
| Parts counter | `app/parts/**`, `components/parts/*` | Search, facets, quick add; the cart uses signed-cookie POST forms (no JS needed) |
| Quote cart / checkout | `app/cart/page.tsx`, `app/api/cart/*`, `lib/cart.ts` | Weakest path, see S1 to S4 |
| Collection | `app/inventory/**`, `components/InventoryBrowser.tsx` | Private by default; has a skeleton loading state |
| Gemstones, jewellery, services | `app/gemstones`, `app/jewellery`, `components/ServicePage.tsx` | Static copy from `lib/site.ts`, gated per page by settings |
| Trade | `app/wholesale/**`, `app/api/wholesale/*`, `middleware.ts` | Password-gated through signed session cookies; rate-limited login |
| Contact | `app/contact`, `components/ContactForm.tsx`, `app/api/contact` | Zod, CSRF, honeypot, rate limit; CRM first, then email |
| Admin surfaces that affect the journey | `app/admin/quotes`, `lib/crm/store.ts`, `lib/integrations/*` | Quote requests appear in the admin area. Payments and shipping are stubs |

## Ranked systems reliability gaps

| # | Gap | Evidence | Acceptance criterion | Status |
|---|---|---|---|---|
| S1 | Nobody is told when a customer sends a quote tray. The page says "we reply by email", but checkout only writes JSON | `app/api/cart/checkout/route.ts` (no mail call); `lib/mail.ts` only had `deliverEnquiry` | Checkout sends the request, with every line, to the Resend or webhook destination that enquiries use. If no email or webhook is set up, the quote is still saved in the admin area, and the customer is not told it was emailed to anyone | **Done** (`deliverQuoteRequest`) |
| S2 | Checkout can return a 500 error page: a repeat customer's notes are concatenated past the 4000-character schema cap, and emails that pass `includes("@")` then fail `z.email()` inside `contactSchema.parse` | `lib/crm/store.ts` `findOrCreateContactByEmail`; checkout validated with `email.includes("@")` | Input is validated with zod before any write. Merged CRM notes stay within 4000 characters: existing notes (which may be staff's own) are never cut, the new text is trimmed to the room left, and the full message is always kept on its deal or quote. A failed write comes back as an error message, never a crash | **Done** |
| S3 | Checkout has no rate limit, no check that the parts page is switched on, no honeypot, and quotes parts that were hidden or deleted without saying so. The contact honeypot also never fired: `z.string().max(0)` rejected a filled trap with a 422 that named the field | `app/api/cart/checkout/route.ts`, `lib/validation.ts` | Checkout has the same rate limit, page check and honeypot as contact. A filled honeypot gets a fake success in both routes. Only public parts are quoted. Lines that were dropped are counted and shown to the customer | **Done** |
| S4 | A contact enquiry is lost without warning when the CRM write fails and no email is set up: the route still returns `ok: true` | `app/api/contact/route.ts` | When neither CRM nor email delivery succeeds, the customer sees an error with the support email address | **Done** |
| S5 | No error boundaries. Every page is `force-dynamic` and reads from disk, so an exception shows Next's bare error screen outside the site layout | no `app/error.tsx` / `global-error.tsx` | Styled `error.tsx` and `global-error.tsx` offer a retry, a way home and the support email | **Done** |
| S6 | When the security token on "Add to quote" has expired, the customer is sent to `/parts?error=csrf`, but that page never reads the error | `app/api/cart/add/route.ts`, `app/parts/page.tsx` | The customer lands on the cart with the "request expired" message | **Done** |
| S7 | The cart page calls `createPaymentIntent({quoteId:"preview"})` on every render just to read a status | `app/cart/page.tsx` | Use `paymentsConfigured()` / `shippingConfigured()` instead | **Done** |
| S8 | Titles of private parts and collection items leak through `generateMetadata`, even when the page itself returns a 404 | `app/parts/item/[id]/page.tsx`, `app/inventory/[id]/page.tsx` | Metadata uses the same visibility rules as the page | **Done** |
| S9 | Rate limiting falls back to one shared bucket (`contact:local`) unless `TRUST_PROXY=true`. That allows 5 enquiries per 10 minutes across the whole site | `lib/security/rate-limit.ts` | Deploy checklist: set `TRUST_PROXY=true` behind the proxy and confirm per-IP buckets in staging | **Done (docs)**: `docs/DEPLOY.md` has a rate-limit checklist, including a staging test that spoofed left-hand entries share one bucket. Setting the variable on the real host is still a launch step |
| S10 | If `SESSION_SECRET` is unset, the cart cookie is signed with a hard-coded development secret | `lib/cart.ts` `secret()` | In production, refuse to sign with the fallback and log once | **Done**: in production with no `SESSION_SECRET`, the tray is switched off. Add, update, clear and checkout redirect to `/cart?error=unavailable` (checkout JSON returns 503 `unavailable`), and the page shows the support email. The missing secret is logged once. Development keeps the fixed key |
| S11 | The JSON-file store is single-process: the `serialize` queue and the in-memory rate limit do not work across multiple instances | `lib/json-store.ts`, `lib/security/rate-limit.ts` | Stay on one instance, or move to SQLite or Postgres plus Redis before scaling out | **Done for one host** (wave 4): `serialize` also takes a cross-process lock (`lib/file-lock.ts`, a `DATA_DIR/.lock` directory with dead-pid and 30 s stale recovery, a 10 s timeout, a swept pending directory, and symlink guards). 4 processes × 200 read-increment-write cycles gave 800/800, and 8 × 200 gave 1600/1600; without the lock, 261/800. Rate limits stay per process, so with N processes they are N times looser (DEPLOY.md). **Open for several hosts**: that still needs a database and a shared rate-limit store |
| S13 | The client IP behind the rate limit can be faked: with `TRUST_PROXY=true` the limiter uses the *first* `X-Forwarded-For` entry, which the client controls, and without it `x-real-ip` is trusted as sent. A rotating header removes the limit on trade and admin sign-in. This predates wave 1 | `lib/security/rate-limit.ts` `clientKey` | Use the right-most entry the proxy appended; read `x-real-ip` only when the proxy is trusted; correct `DEPLOY.md` | **Done**: `clientIp()` uses the right-most `X-Forwarded-For` entry (`TRUST_PROXY_HOPS` sets how many trusted proxies there are, default 1), then `X-Real-IP`, and only when `TRUST_PROXY=true`. Without it, no header is read. Values that are not IP-shaped are ignored. `DEPLOY.md` and `.env.example` are corrected |
| S14 | The quote total adds CAD and USD lines together and labels the sum CAD. The seed has no USD lines yet | `app/api/cart/checkout/route.ts`, `app/cart/page.tsx` | Totals are kept per currency, or USD lines are shown as priced on request | **Done**: `totalsByCurrency()` keeps one total per currency on the cart page, in the house email, and on the admin list and detail pages. Quote lines store their currency. A mixed tray saves its deal with no value, rather than a sum that mixes currencies. Seed data is unchanged, with no USD lines |
| S12 | There is no health endpoint for the proxy or uptime monitor | none | `GET /api/health` returns 200 or 503 with `{ok}` publicly, depending on whether `DATA_DIR` is writable. The per-check breakdown (storage, mail, session secret) needs an admin session, so the endpoint never advertises a missing secret | **Done**. Wave 6 adds `GET /api/health?deep=1` (`lib/data-health.ts`, cached for 30 s). It reads parts, inventory and the CRM files with the stores' own checks and answers 503 `{"ok":false}` when one is unreadable, because streamed pages still answer 200 when a data section fails. Point the uptime monitor at `?deep=1`. Admins see per-file codes, never paths |
| S15 | A data file that exists but is corrupt or unreadable was read as empty, and the next write replaced it: one enquiry after a corrupt `contacts.json` left a one-contact file, and a corrupt `parts.json` was reseeded with the demo catalogue. This predates wave 1 | `lib/json-store.ts` `readJson` | Only a missing file reads as empty. List stores (CRM, inventory, parts) refuse to write over an unreadable file. Settings pages fall back to the defaults, and a settings save moves a corrupt file aside first | **Done** (wave 4, hardened in waves 6 and 7). `StoreReadError` codes are EJSON, ESHAPE or fs codes, and the logs carry no file content. A quote is saved with one `recordQuoteRequest` step, with the quote as the commit point. Settings are moved aside only for EJSON, ESHAPE or EISDIR, never for a transient OS error. Verified: a corrupt `contacts.json` and an array `parts.json` keep their bytes, and a corrupt `settings.json` still renders the site |
| S16 | The demo catalogue could not be retired: deleting every line reseeded it, and demo prices went into real quotes unmarked | `lib/parts/store.ts`, checkout | A seeded, empty catalogue stays empty. Demo lines are marked wherever a price is shown or quoted, and can be retired from the admin area | **Done** (waves 4 and 5). Quote lines carry `demo`. The house email, the webhook, Admin → Quotes, the cart, the price-list view and the part pages mark demo prices. `/admin/parts` has a confirmed "Retire demo lines" control (admin session and CSRF). The demo copy on public pages shows only while demo lines exist. Category blurbs no longer make grading or brand claims. **Client decision open**: when to retire the demo lines |

## Ranked UX gaps

| # | Gap | Evidence | Acceptance criterion | Status |
|---|---|---|---|---|
| U1 | The quote form loses everything the customer typed on any error, because of a full-page redirect | `app/cart/page.tsx` form posted to `/api/cart/checkout` | With JS: submits in place, shows errors next to each field, and keeps the input. Without JS: the plain POST still works | **Done** (`CartQuoteForm`). Wave 6: the contact form also works without JS: it POSTs to `/api/contact` and gets a 303 back to `/contact?sent=1` or `?error=<code>`, keeping the chosen type. Browser validation stays on until the page hydrates. `/parts`, `/cart` and `/inventory` still need JavaScript to show their streamed data sections; a `<noscript>` note there gives the support email |
| U2 | `/cart?msg=` prints whatever text is in the URL inside the green success box, so anyone can craft a link with made-up copy | `app/cart/page.tsx` | Messages are fixed codes. On success the customer sees a quote reference | **Done** |
| U3 | Contact and quote forms are not accessible: no `aria-invalid` or `aria-describedby`, and focus does not move to the first error or to the confirmation | `components/ContactForm.tsx` | Invalid fields are marked and linked to their error text; focus moves to the first invalid field, or to the status message on success | **Done**. Wave 2: the `/cart?sent=` confirmation and `/cart?error=` messages now get focus when the page loads (`FocusOnArrival`). Wave 3: browser-tested by `npm run test:e2e` |
| U4 | Parts filters live only in component state: the back button loses them and filtered views cannot be shared | `components/parts/PartsBrowser.tsx` | Search, tray, brand, stock, sort and view are kept in the query string with `history.replaceState`; no `useSearchParams`, so the static export is unaffected | **Done** |
| U5 | The cart silently includes parts that were later hidden and silently drops deleted ones | `app/cart/page.tsx` | Unavailable lines are listed as unavailable, left out of the subtotal, and the customer is offered a way to remove them | **Done** |
| U6 | No loading states outside `/inventory`, so dynamic pages paint blank while the store is read | `app/**/loading.tsx` | Skeletons on `/parts` and `/cart` that keep real 404 status codes | **Done** (wave 3). Wave 1's route `loading.tsx` was removed because streaming turned `notFound()` into soft 404s with status 200. Now `/parts` and `/cart` run the visibility check (`requirePage`) in the page function, then stream each data section behind its own skeleton (`components/SectionSkeleton.tsx`) in a section-level `<Suspense>`. Verified on `next start`: the HTML streams 5 skeleton boundaries on `/parts` and 1 on `/cart`; a missing part, a private part, and `/parts` and `/cart` with the page switched off all return 404. `npm run smoke` now fails if a missing part stops returning 404 |
| U7 | On the trade sign-in page, an expired session shows "access phrase not recognised" | `app/api/wholesale/login/route.ts` | CSRF failure shows its own "reload and try again" message | **Done** |
| U8 | The header cart count includes lines that are no longer available | `components/SiteHeader.tsx` | The count covers public parts only | **Done** |
| U13 | Staff cannot act on a quote from the admin area: `/admin/quotes` shows only the name, status, line count and total. There is no reference, no SKUs or quantities, and no notes, yet the customer is told to quote `Q-XXXXXX` | `app/admin/quotes/page.tsx` | Each quote shows its reference and can be opened to see lines, quantities, notes, and whether the notification was sent | **Done**: `/admin/quotes` shows the reference, per-currency totals and notification status, and has a lookup that accepts `Q-7KX2MP`, `q-7kx2mp` or `7KX2MP`. One match opens the quote; several are listed. `/admin/quotes/[id]` shows the customer and company, lines with SKU, quantity, unit and amount, notes, received and updated times, whether the house was notified and when, and a status control (`/api/admin/crm/quote-status`, admin session and CSRF required) |
| U14 | Changing a quantity, removing a line or emptying the tray is a full-page POST, which wipes anything typed into the quote form | `app/cart/page.tsx` | Form drafts survive line edits (session storage), or line edits happen in place | **Done**: name, email, company and notes are saved to `sessionStorage` for the current tab as the customer types. They are restored after a line edit reloads the page, but never over a field that is already filled, and cleared once the quote is sent. The honeypot and token are never stored. Wave 3: browser-tested by `npm run test:e2e` |
| U15 | The CSRF cookie lasts 6 hours; after that the JS quote form says "reload", which clears the fields | `middleware.ts`, `CartQuoteForm` | On a 403 `csrf` response, the form reads the new `ag_csrf` cookie and retries once | **Done**: on a 403 `csrf` response, the form reads the fresh `ag_csrf` cookie that middleware set on that response. It retries once, and updates the tokens in the page's line-edit forms. The server side is verified by `npm run smoke`. Wave 3: the browser retry is tested by `npm run test:e2e` |
| U9 | No confirmation email to the customer after a quote or enquiry | `lib/mail.ts` | Send an acknowledgement once the client approves the wording | **Built, off** (wave 4): `deliverQuoteAcknowledgement` and `deliverEnquiryAcknowledgement` send through Resend only when `CUSTOMER_ACK_EMAIL=true`. The quote acknowledgement lists the reference and lines with no prices and says nothing has been charged. Neither echoes the customer's name. Each address is capped at one acknowledgement per 24 hours, with a site-wide cap of 50 an hour. **Client decision open**: approve the wording in `lib/mail.ts`, then set the flag |
| U10 | Card payment and live shipping are still stubs | `lib/integrations/payments.ts`, `shipping.ts` | Stripe Checkout is launched from an accepted quote, and shipping rates are shown at quote time | **Blocked, not built on purpose.** It needs the client to decide to take card payments, a Stripe account and keys, a shipping carrier, and the HST registration number, which FACTS-REGISTER lists as UNKNOWN. Charging without the tax posture settled is not something code should decide. The adapters still return `unconfigured`, and the cart says card payment is not connected |
| U11 | Performance budget: the static export and dynamic server pages have not been measured | none | Lighthouse on `/`, `/parts`, `/cart` on mobile: LCP under 2.5 s, CLS under 0.05, INP under 200 ms, recorded in `docs/evidence` | **Partial** (wave 3): measured; the budget is not met. Lighthouse 13.5.0 mobile, median of 3 runs, `next start` on localhost (`docs/evidence/lighthouse-2026-09-21.md`). CLS is 0.001 to 0.003 and passes on all three pages. LCP is 3.40 s on `/`, 3.35 s on `/parts` and 3.04 s on `/cart`, so it fails on all three. The LCP element is server-rendered hero text, held back by style and layout work and render-blocking CSS. INP cannot be measured in the lab. Timed interactions with the CPU slowed 4x (`npm run perf:interactions`) take 176 ms on `/` and 80 ms on `/cart` (pass), and 368 ms on `/parts`, where the layout switch and search keystrokes re-render the whole list (fail). Open: CSS and `/parts` render work, then measure again; field data after launch.
**Waves 4 and 6, two performance rounds** (`docs/evidence/lighthouse-2026-09-21-perf.md`, `-perf2.md`), measured against the unchanged tree alternately on this machine.
- LCP: 3.36 s → **2.96 s** on `/`, 3.28 s → **2.86 s** on `/parts`, 2.97 s → **2.60 s** on `/cart`. It still fails the 2.5 s budget.
- CLS: at most 0.003 (pass).
- First Load JS: 116 / 121 / 115 kB → 110 / 116 / 111 kB.
- `/parts` slowest interaction: 144 ms once the page has settled (pass), 236 ms when tapped during hydration (fail).
- Changes: zod removed from the client bundle, deferred list values, containment, the ticker started after the first paint, a smaller favicon, plain `<img>` through `lib/image-props.ts` (built against Next 15.5 internals; re-check on upgrade), home sections through `next/dynamic`, and a lighter compass SVG.
- The remaining gap is about 100 KB of React and Next runtime and 62 KB of brand fonts. Further moves need a decision (`font-display: optional` or finer font subsetting, both ruled out here to keep the brand type) or the deploy (HTTP/2 and Brotli at the proxy, see DEPLOY.md). Measure again on the production host |
| U12 | No automated end-to-end test of the add → cart → quote journey | none | Playwright smoke test in CI that covers add to cart, a quantity change, and a quote request (with the honeypot empty) | **Done** (wave 3; CI workflow open). `npm run test:e2e` (Playwright 1.63.0, `e2e/quote-journey.spec.ts`) starts its own `next start` and runs 5 browser tests: add, quantity change and a quote with the honeypot empty, then focus on the `/cart?sent=` confirmation; a bad email gets focus and keeps what was typed; the draft is restored after a line edit; the 403 `csrf` retry (the test requires a 403 followed by a 200); parts filters restored from the URL. `npm run smoke` stays (now 15 HTTP checks).
**Wave 4:** `.github/workflows/ci.yml` runs on every push to main and every pull request. The `check` job runs `npm run check` and `npm run build:static`. The `journey` job runs Playwright, the HTTP smoke test and the live string scan.
**Waves 6 and 7:** the suite has grown to 10 browser tests (no-JS quote POST, contact token retry, brand-in-URL guard, focus after a server refusal) and 20 smoke steps (on-site redirects, the no-JS bad-email path, 404s for switched-off pages).
**Open:** the workflow has not run on GitHub yet, because nothing is pushed. Its first Linux run is the real test |

## Wave 1 verification (2026-09-20)

- In `clean/`, `npm run typecheck`, `npm run lint`, `npm run scan` and `npm run build` pass on the final revision. `npm run build:static` passed on the revision before the end-to-end review and was not re-run after the review fixes.
- Smoke test against `next start`, with `DATA_DIR` pointed at a scratch directory:
  - Add to cart returns 303 to `/cart`, and the header shows `Cart (3)`.
  - Checkout with a bad email returns 422 with the `email` field error.
  - An expired CSRF token redirects to `/cart?error=csrf`.
  - A JSON checkout returns `{ok, reference: "Q-XXXXXX"}` and saves a quote with status `draft`.
  - Repeat checkouts from the same email address, each with 1,900 characters of notes, leave one contact with notes capped at 4000 characters and no 500 error. Before this wave the same sequence threw.
  - The third checkout in quick succession gets 429 (the shared bucket, S9).
  - A hidden part in the cart is listed as unavailable and left out of the header count.
  - A hidden part's `<title>` shows "Part".
  - An expired trade sign-in redirects to `?error=expired`.
  - The public `/api/health` returned `{ok:true, ...}`. The check breakdown was later restricted to admin sessions.
- Not verified in a browser this wave: restoring filters from the URL in `PartsBrowser`, and the focus moves in the contact and quote forms. Both are code-reviewed only; U12 covers them.

## Wave 1 end-to-end review (2026-09-21)

An independent end-to-end audit ran after the first verification. Fable was requested, but the account was at its Fable usage limit, so the audit ran on Opus. Regressions it found in wave 1 code were fixed straight away:

- **Quote rate limit order.** The limit is now counted only after CSRF and validation pass, so stray or bad posts cannot lock quotes site-wide. The 429 message now includes the support email. Verified: six bad-token posts followed by a valid request still succeed.
- **Honeypot.** The trap field is renamed `hp_note`, so autofill for "company" never fills it. The schema now accepts it, so the route's fake-success branch actually runs; before, it was dead code and a filled trap returned a 422 naming the field. The quote route no longer empties the tray on a trap hit. Verified: a trap hit returns `ok`, the tray is kept, and nothing is written.
- **Parts reads.** Parts are no longer read through the global write queue (`lib/parts/store.ts`). The header no longer waits behind CRM or inventory writes.
- **Error retry.** `app/error.tsx` "Try again" now calls `router.refresh()` before `reset()`, so it fetches the page again.
- **No-JS quote form.** `noValidate` is set only after hydration, so without JS the browser still checks the required fields and the email format.
- **Contact notes.** Merged notes never cut existing notes, which may be staff's own; new text is trimmed to the space left. The full message always stays on the deal or quote.
- **Soft 404s.** `loading.tsx` was removed from `/parts` and `/cart` (see U6). Verified: a missing part returns 404.

Findings that predate wave 1 or widen its scope are logged above as S13, S14, U13, U14 and U15, and below:

- **Support mailbox not confirmed.** `support@atlanticgems.ca` is the fallback on every error path. The facts register still says "confirm before publishing". Get the client to confirm the mailbox is live and update the register.
- **Demo catalogue in live quotes.** `ensureSeeded` reseeds demo parts whenever `parts.json` is empty, so demo lines cannot be retired by deleting them. Checkout also takes real quote requests at demo prices, which the facts register marks DEMO ONLY. This needs a product decision before launch.
- **`/contact?brief=` prefill.** The contact message is still pre-filled from the URL. Low risk, because it is only shown as editable text in the customer's own form.
- **S1 depends on configuration.** With no Resend key or webhook set, a quote is only saved under Admin → Quotes and nobody is notified. `/api/health` shows `mail:false` to an admin; setting a delivery route is a launch requirement.

## Wave 2 verification (2026-09-21)

- In `clean/`, `npm run check` (typecheck, lint, scan, build) passes, and so does `npm run build:static`.
- `npm run smoke` against `next start` with a scratch `DATA_DIR` and `TRUST_PROXY=true`: all 14 steps pass. The saved quote has lines with `currency: "CAD"` and `notification: {status: "unconfigured"}`, because no mail route was set.
- **S13**, on the same server. Six admin sign-in posts with `X-Forwarded-For: 198.51.100.<n>, 203.0.113.5`, where only the made-up left-hand entry changes: the sixth is rate-limited (`?error=rate`). A different right-hand address still gets through. A rotated `X-Real-IP` alongside the proxy entry is ignored. Unit checks of `clientKey` on Node 24: untrusted gives `local` even with both headers set; garbage gives `local`; `ip:port` and `[v6]:port` are normalised; `TRUST_PROXY_HOPS=2` picks the second entry from the right.
- **S14 and U13**, with one scratch part switched to USD (seed data unchanged). The cart shows "Estimated subtotal, CAD lines CAD 420.00" and "…, USD lines USD 1,360.00" and the note that they are totalled separately. Checkout returns a reference. The deal is saved with `value: null`, and the quote lines keep CAD and USD. With an admin session:
  - The list shows the reference and "No delivery route set up".
  - The lookup with a lowercase bare reference redirects (307) to the detail page. The detail page shows "CAD … + USD …", the multi-line notes and the notification explanation.
  - A malformed reference and an unknown reference each show their message.
  - A status change redirects with "Status set to Sent" and is saved.
  - An unknown id returns 404, and the detail page without a session redirects to `/admin/login`.
- **S10**: `next start` with no `SESSION_SECRET`. Add to cart gives 303 to `/cart?error=unavailable` and sets no tray cookie. The cart shows the unavailable message and the send button is disabled. JSON checkout returns 503 `unavailable` with the support email. The server log has one `[cart] SESSION_SECRET is not set` line.
- Not verified in a browser: the U3 focus on arrival, the U14 draft restore, and the U15 client retry. The server contract they rely on is covered by the smoke test; the browser half is U12.
- Change to the webhook payload: quote notifications now send `estimatedTotals: [{currency, amount}]` in place of `estimatedTotal`. No consumer is configured yet.

## Wave 3 verification (2026-09-21)

- In `clean/`, `npm run typecheck`, `npm run lint`, `npm run scan` and `npm run build` pass. `npm run build:static` passes on the final revision (the static overlay replaces `/parts` and removes `/cart`, so the Suspense change does not reach the export).
- `npm run test:e2e`: all 5 Playwright tests pass against `next start` with a scratch `DATA_DIR`. A control run that blocked `sessionStorage` writes left the Name field empty after the line edit, so the draft test depends on the stored draft and not on the browser restoring form fields.
- `npm run smoke` against `next start` (scratch `DATA_DIR`, `SESSION_SECRET` set, no `TRUST_PROXY`): all 15 steps pass, including the new 404 check for a missing part.
- U6 by hand on the same server: `/parts/item/<missing>` and a part set to `private` return 404; with `pages.parts` off in `settings.json`, `/parts` and `/cart` return 404; with it back on, both return 200 and their HTML contains the skeleton fallbacks and the streamed content.
- U11: see `docs/evidence/lighthouse-2026-09-21.md`. CLS passes, LCP fails on all three pages, and interaction timing fails on `/parts`.
- New scripts in `clean/`: `test:e2e`, `perf:lighthouse`, `perf:interactions`. `@playwright/test` 1.63.0 is a dev dependency; Lighthouse runs through `npx` and is not installed. Playwright output folders are git-ignored.
- `npm run test:e2e` needs port 3100 free and a production build in `.next/`. Its server is started with a test-only `SESSION_SECRET` written in `playwright.config.ts`; that value is never used outside the test run.

## Waves 4 to 7 (2026-09-21 and 22)

The lead asked for every open item to be fixed. Waves 2 and 3 were already in the working tree and current, not stale, so they were kept as the baseline: `npm run check`, 15/15 smoke and 5/5 e2e passed on them before any new change.

- **Wave 4.** Demo catalogue retirement and demo marking (S16). U9 built and off. The cross-process write lock (S11). The CI workflow (U12). The `/contact?brief=` cap at 300 characters. `npm run preflight` for launch settings. Performance round 1 (U11).
- **Wave 5.** Store integrity (S15). The per-currency parts pages. The "Retire demo lines" control. Contact rate limit counted after CSRF and validation. The hash-password `.env` form. Preflight reads `settings.json` for the trade page. `typecheck` runs `next typegen` first. Docs corrections (PM2 and systemd env, an absolute `DATA_DIR`).
- **Wave 6.** Performance round 2. An adversarial review of the whole diff: four reviewers, each followed by a refuting verifier. Of 51 findings, 50 were confirmed and 47 fixed in code. The other 3 were plan-doc corrections, applied here. Fixes included:
  - Redirects that stay on site behind the proxy (`lib/http.ts`), and typed admin message codes instead of free text.
  - One-step quote saves, and IPv6 rate-limit keys by /64.
  - File-lock symlink guards, and no parse fragments in logs.
  - Acknowledgements that echo no name and are capped per address.
  - The no-JS contact form, the contact token retry, and focus fixes.
  - Soft 404s removed from `/inventory`, and `?deep=1` health.
  - Tooling: smoke, scan, Lighthouse medians per metric, and interaction input counting.
- **Wave 7.** A second adversarial review, of the 80 files wave 6 changed. It caught a real regression: `/admin/login?next=/admin/..//evil.example` redirected off site after sign-in. `safeNextUnder` now checks the resolved path, and `seeOther` refuses a leading `//`. Also fixed:
  - `?error=__proto__` crashing `/contact` and `/cart`.
  - `hash-password` hanging on piped input.
  - Duplicate quotes on retry.
  - The GitHub Pages no-JS reveal.
  - A phone pattern on the contact form.
  - Focus on trade sign-in errors.
  - Five doc inaccuracies.

  17 findings were fixed in round 1. A round-2 review of those fixes found 4 small issues, all fixed.

**Final verification (wave 7)**, from `clean/`:
- `npm run typecheck`, `lint`, `scan`, `build` and `build:static` all pass.
- `npm run test:e2e` passes 10/10.
- `npm run smoke` passes 20/20, and the live string scan is clean on 12 pages.
- The targeted checks pass 16/16: retire demo lines, corrupt contacts, parts and settings files, the contact rate-limit order, the brief cap and newline, and admin gating.
- `GET /api/health?deep=1` with a corrupt `parts.json` returns 503 with the body `{"ok":false}`.
- A no-JS contact enquiry gets a 303 to `/contact?sent=1`. With a broken CRM and no mail route it goes to `?error=unsent`, and the page names the support email.
- The redirect guard, probed directly: every `..//`, `%2e%2e//` and tab variant falls back to `/admin` or `/wholesale`.

## Still open

Nothing below can be closed by code alone.

1. **Client decisions.**
   - Confirm that `support@atlanticgems.ca` is live. Every error path names it, and FACTS-REGISTER still says "confirm before publishing".
   - Approve the U9 acknowledgement wording, then set `CUSTOMER_ACK_EMAIL=true`.
   - Decide when to retire the demo lines (`/admin/parts`).
   - Supply any grading or brand wording for the tray blurbs.
2. **U10 payments and shipping.** Needs the client's decision, Stripe and carrier keys, and the HST registration number.
3. **Launch configuration** on the real host: `SESSION_SECRET`, `ADMIN_PASSWORD_HASH`, `WHOLESALE_PASSWORD_SHA256`, a mail route, `TRUST_PROXY` and an absolute `DATA_DIR`. `npm run preflight` must exit 0 on the host. Point the uptime monitor at `/api/health?deep=1`, and run the DEPLOY.md rate-limit checklist on staging.
4. **U11.** LCP is 2.60 to 2.96 s on this machine's lab runs, against a 2.5 s budget. `/parts` taps during hydration take 236 ms. Measure again on the production host with HTTP/2 and Brotli at the proxy, before deciding on font subsetting. Collect field data after launch.
5. **CI's first Linux run.** The workflow exists but has not run, because nothing is committed or pushed.
6. **S11 across several hosts.** One host is covered by the lock. More than one needs a database and a shared rate-limit store.
7. **Next upgrades.** Re-check `lib/image-props.ts` on any Next upgrade: it imports Next 15.5 internals. `next` is pinned to 15.5.2.
