/**
 * Lab timing of real interactions on the three journey pages, as a stand-in
 * for INP, which only field data can give (plan item U11). Uses the Event
 * Timing API in Playwright's Chromium on a phone-sized viewport with the CPU
 * slowed 4x, and reports the slowest interaction per page against the 200 ms
 * budget. Event Timing only reports events of 16 ms or more, rounded to 8 ms,
 * so "under 16 ms" means nothing crossed that line.
 *
 * Every page is timed twice:
 *
 *  - "early": the first action starts at network idle, as in the earlier
 *    rounds. On a slowed phone the page can still be hydrating then, and
 *    Playwright scrolls a control into view and taps it in the same frame, so
 *    the tap also pays for any off-screen section that the scroll reveals.
 *  - "settled": the script first waits until the main thread has been free of
 *    long tasks for a second (hydration done), scrolls the first control into
 *    view as a visitor would, lets two frames pass, and then acts.
 *
 * The budget applies to both. INP is the slowest interaction of a whole visit,
 * early taps included, so the early pass is the one that decides the budget;
 * the settled pass shows the cost of the interactions themselves.
 *
 *   LH_BASE_URL=http://localhost:3100 npm run perf:interactions
 *
 * Adds one line to the tray over the page itself, so point it at a server
 * with a scratch DATA_DIR. Exit code 1 if any page is over budget in either
 * pass, or if the inputs did not land: an empty Event Timing record reads as
 * "under 16 ms" whether everything was fast or nothing was measured, so each
 * pass also counts the pointer and key presses the page received, and needs
 * the browser's first-input entry, which is reported whatever its duration.
 */
import { chromium } from "@playwright/test";

const BASE = (process.env.LH_BASE_URL ?? "http://localhost:3100").replace(/\/$/, "");
const BUDGET_MS = 200;
const CPU_SLOWDOWN = 4;
/** "Settled" means this long without a long task on the main thread. */
const QUIET_MS = 1000;
const QUIET_TIMEOUT_MS = 15000;

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 412, height: 823 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
await context.addInitScript(() => {
  window.__slowest = new Map();
  window.__lastLongTask = 0;
  window.__inputs = 0;
  window.__firstInput = false;
  const landed = () => {
    window.__inputs += 1;
  };
  addEventListener("pointerdown", landed, true);
  addEventListener("keydown", landed, true);
  new PerformanceObserver((list) => {
    if (list.getEntries().length) window.__firstInput = true;
  }).observe({ type: "first-input", buffered: true });
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (!e.interactionId) continue;
      const prev = window.__slowest.get(e.interactionId) ?? 0;
      window.__slowest.set(e.interactionId, Math.max(prev, e.duration));
    }
  }).observe({ type: "event", buffered: true, durationThreshold: 16 });
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) window.__lastLongTask = Math.max(window.__lastLongTask, e.startTime + e.duration);
  }).observe({ type: "longtask", buffered: true });
});

const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_SLOWDOWN });

/** Waits until the main thread has had no long task for QUIET_MS; returns the wait in ms. */
async function settle() {
  const started = Date.now();
  while (Date.now() - started < QUIET_TIMEOUT_MS) {
    const quietFor = await page.evaluate(() => performance.now() - window.__lastLongTask);
    if (quietFor >= QUIET_MS) break;
    await page.waitForTimeout(200);
  }
  return Date.now() - started;
}

/** Scrolls a control into view the way a visitor would, before the first tap. */
async function bringIntoView(locator) {
  await locator.scrollIntoViewIfNeeded();
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForTimeout(300);
  // The scroll and any section it revealed are not interactions; start clean.
  await page.evaluate(() => {
    window.__slowest.clear();
    window.__inputs = 0;
  });
}

async function measure(pass, name, path, first, act) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  let waited = 0;
  if (pass === "settled") {
    waited = await settle();
    await bringIntoView(first());
  }
  const planned = await act();
  await page.waitForTimeout(500);
  const seen = await page.evaluate(() => ({
    durations: [...window.__slowest.values()],
    inputs: window.__inputs,
    firstInput: window.__firstInput,
  }));
  const worst = seen.durations.length ? Math.max(...seen.durations) : 0;
  // Every planned press must have reached the page, and the browser must have
  // reported its first input; otherwise the timing says nothing.
  const landed = seen.firstInput && seen.inputs >= planned;
  const ok = landed && worst < BUDGET_MS;
  console.log(
    `${pass.padEnd(7)} ${path.padEnd(7)} ${seen.inputs}/${planned} inputs landed, ${seen.durations.length} of 16 ms or more  ` +
      `slowest ${worst ? `${worst} ms` : "under 16 ms"}  ${ok ? "pass" : landed ? "FAIL" : "FAIL (inputs not recorded)"}  ` +
      `(${name}${pass === "settled" ? `; settled after ${waited} ms` : ""})`,
  );
  return {
    pass,
    page: path,
    name,
    plannedInputs: planned,
    inputsLanded: seen.inputs,
    firstInputSeen: seen.firstInput,
    measuredInteractions: seen.durations.length,
    slowestMs: worst,
    ok,
  };
}

const menu = () => page.locator(".nav-toggle");
const search = () => page.getByPlaceholder("Search part, SKU or brand");
const plus = () => page.locator("article.cart-line").first().getByRole("button", { name: "Increase quantity" });

const results = [];
for (const pass of ["early", "settled"]) {
  results.push(
    await measure(pass, "open the menu, close it with Escape", "/", menu, async () => {
      // While open, the backdrop covers the toggle; Escape is the keyboard close.
      await menu().click();
      await page.keyboard.press("Escape");
      return 2;
    }),
  );
  results.push(
    await measure(pass, "type a search, switch to the price list and back", "/parts", search, async () => {
      await search().click();
      await search().pressSequentially("strap", { delay: 120 });
      await page.getByRole("button", { name: "Price list" }).click();
      await page.getByRole("button", { name: "Tray", exact: true }).click();
      return 1 + 5 + 2;
    }),
  );
  if (pass === "early") {
    // Put one line in the tray through the page, then time the cart's stepper.
    await page.goto(`${BASE}/parts`, { waitUntil: "networkidle" });
    await Promise.all([
      page.waitForURL((url) => url.pathname === "/cart"),
      page.locator('form[action="/api/cart/add"]').first().locator('button[type="submit"]').click(),
    ]);
  }
  results.push(
    await measure(pass, "step a quantity up three times and type in the form", "/cart", plus, async () => {
      for (let i = 0; i < 3; i += 1) await plus().click();
      const name = page.locator('form[action="/api/cart/checkout"]').getByLabel("Name");
      await name.click();
      await name.pressSequentially("Bench", { delay: 120 });
      return 3 + 1 + 5;
    }),
  );
}

await browser.close();
console.log(JSON.stringify({ base: BASE, cpuSlowdown: CPU_SLOWDOWN, budgetMs: BUDGET_MS, quietMs: QUIET_MS, results }, null, 2));
if (results.some((r) => !r.ok)) process.exit(1);
