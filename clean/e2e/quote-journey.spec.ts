import { expect, test, type Page } from "@playwright/test";

/**
 * The browser half of the quote journey (plan item U12). `npm run smoke`
 * covers the server contract over plain HTTP; this covers what only a browser
 * does: focus moves, the per-tab draft, the forms' token retry, and the plain
 * POST a browser sends when the enhanced handler does not run.
 */

const CHECKOUT = "/api/cart/checkout";
const DRAFT_KEY = "ag_quote_draft";

/** Adds the first part on the counter with quick add and lands on the tray. */
async function addFirstPart(page: Page) {
  await page.goto("/parts");
  await page.locator('form[action="/api/cart/add"]').first().locator('button[type="submit"]').click();
  await page.waitForURL((url) => url.pathname === "/cart");
  await expect(page.locator("article.cart-line")).toHaveCount(1);
  // The form has hydrated (its mount effect sets noValidate), so a click runs
  // the enhanced handler rather than a native POST.
  await expect(quoteForm(page)).toHaveAttribute("novalidate", "");
}

const quoteForm = (page: Page) => page.locator('form[action="/api/cart/checkout"]');
const sendButton = (page: Page) => quoteForm(page).getByRole("button", { name: "Send the tray for quotation" });

/** Steps the first line up by one and posts the line edit, which reloads the page. */
async function bumpFirstLine(page: Page) {
  const line = page.locator("article.cart-line").first();
  const qty = line.locator('input[name="qty"]');
  const before = Number(await qty.inputValue());
  await line.getByRole("button", { name: "Increase quantity" }).click();
  await expect(qty).toHaveValue(String(before + 1));
  await Promise.all([
    page.waitForEvent("load"),
    line.getByRole("button", { name: "Update" }).click(),
  ]);
  await expect(page.locator("article.cart-line").first().locator('input[name="qty"]')).toHaveValue(
    String(before + 1),
  );
}

test("add, change the quantity, send the tray, and land focused on the confirmation", async ({ page }) => {
  await addFirstPart(page);
  await bumpFirstLine(page);

  const form = quoteForm(page);
  await form.getByLabel("Name").fill("Playwright Smoke");
  await form.getByLabel("Email").fill("e2e@example.com");
  await form.getByLabel("Notes").fill("Automated browser smoke test");
  await expect(form.locator('input[name="hp_note"]')).toHaveValue("");
  await sendButton(page).click();

  await page.waitForURL(/\/cart\?sent=Q-[A-Z0-9]{6}$/);
  const reference = new URL(page.url()).searchParams.get("sent") ?? "";
  const confirmation = page.getByRole("status").filter({ hasText: "Tray received" });
  await expect(confirmation).toContainText(reference);
  await expect(confirmation).toBeFocused();
  await expect(page.getByRole("heading", { name: "The tray is empty" })).toBeVisible();
  expect(await page.evaluate((k) => sessionStorage.getItem(k), DRAFT_KEY)).toBeNull();
});

test("a bad email keeps what was typed and moves focus to the field", async ({ page }) => {
  await addFirstPart(page);
  const form = quoteForm(page);
  await form.getByLabel("Name").fill("Playwright Smoke");
  await form.getByLabel("Email").fill("not-an-email");
  await form.getByLabel("Notes").fill("Keep me");
  await sendButton(page).click();

  const email = form.getByLabel("Email");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toBeFocused();
  await expect(form.locator("#quote-email-error")).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/cart");
  await expect(form.getByLabel("Name")).toHaveValue("Playwright Smoke");
  await expect(form.getByLabel("Notes")).toHaveValue("Keep me");
});

test("the draft survives a line edit that reloads the page", async ({ page }) => {
  await addFirstPart(page);
  const form = quoteForm(page);
  await form.getByLabel("Name").fill("Draft Keeper");
  await form.getByLabel("Email").fill("draft@example.com");
  await form.getByLabel("Company (optional)").fill("Bench Co");
  await form.getByLabel("Notes").fill("Two of these, please");

  await bumpFirstLine(page);

  const after = quoteForm(page);
  await expect(after.getByLabel("Name")).toHaveValue("Draft Keeper");
  await expect(after.getByLabel("Email")).toHaveValue("draft@example.com");
  await expect(after.getByLabel("Company (optional)")).toHaveValue("Bench Co");
  await expect(after.getByLabel("Notes")).toHaveValue("Two of these, please");
  // The honeypot and the token are never stored.
  const stored = await page.evaluate((k) => sessionStorage.getItem(k), DRAFT_KEY);
  expect(Object.keys(JSON.parse(stored ?? "{}")).sort()).toEqual(["company", "email", "name", "notes"]);
});

test("an expired token is retried once with the fresh cookie", async ({ page, context }) => {
  await addFirstPart(page);
  const form = quoteForm(page);
  await form.getByLabel("Name").fill("Token Retry");
  await form.getByLabel("Email").fill("retry@example.com");

  // What an expired cookie looks like to the server: the form still carries
  // the old token, but the cookie is gone.
  const stale = await form.locator('input[name="csrf"]').inputValue();
  await context.clearCookies({ name: "ag_csrf" });

  const statuses: number[] = [];
  page.on("response", (res) => {
    if (new URL(res.url()).pathname === CHECKOUT && res.request().method() === "POST") {
      statuses.push(res.status());
    }
  });
  await sendButton(page).click();
  await page.waitForURL(/\/cart\?sent=Q-[A-Z0-9]{6}$/);

  // The retry path really ran: one refusal, then one success.
  expect(statuses).toEqual([403, 200]);
  const fresh = (await context.cookies()).find((c) => c.name === "ag_csrf")?.value;
  expect(fresh).toMatch(/^[0-9a-f]{64}$/);
  expect(fresh).not.toBe(stale);
  await expect(page.getByRole("status").filter({ hasText: "Tray received" })).toBeFocused();
});

test("parts filters are restored from the URL", async ({ page }) => {
  await page.goto("/parts?q=strap&view=ledger");
  await expect(page.getByPlaceholder("Search part, SKU or brand")).toHaveValue("strap");
  await expect(page.getByRole("button", { name: "Price list", pressed: true })).toBeVisible();
});

test("a brand in the URL is used only when it is on the counter", async ({ page }) => {
  await page.goto("/parts?brand=Call%20555-0100%20for%2050%25%20off");
  await expect(page.getByPlaceholder("Search part, SKU or brand")).toBeVisible();
  // The mount effect ran and turned the brand down: the URL write that
  // follows it drops the parameter. The made-up text must never show.
  await expect(page).toHaveURL((u) => !u.searchParams.has("brand"));
  await expect(page.locator(".applied")).toHaveCount(0);
  await expect(page.getByText("Call 555-0100")).toHaveCount(0);
});

test("the form's plain POST, as sent without JavaScript, lands on the confirmation", async ({ page }) => {
  await addFirstPart(page);
  const form = quoteForm(page);
  await form.getByLabel("Name").fill("Plain Post");
  await form.getByLabel("Email").fill("plain@example.com");
  // HTMLFormElement.submit() skips the enhanced handler, so the browser posts
  // the form itself and follows the redirect, exactly as with JS switched off.
  await Promise.all([
    page.waitForURL(/\/cart\?sent=Q-[A-Z0-9]{6}$/),
    form.evaluate((f: HTMLFormElement) => f.submit()),
  ]);
  const confirmation = page.getByRole("status").filter({ hasText: "Tray received" });
  await expect(confirmation).toBeFocused();
  await expect(page.getByRole("heading", { name: "The tray is empty" })).toBeVisible();
});

test("a refusal from the server moves focus to the status box every time", async ({ page }) => {
  await addFirstPart(page);
  // A 429 without field errors: focus must land on the status box, which the
  // "sending" render has just removed.
  await page.route(CHECKOUT, (route) =>
    route.fulfill({
      status: 429,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, code: "rate", message: "Several requests have come from here." }),
    }),
  );
  const form = quoteForm(page);
  await form.getByLabel("Name").fill("Focus Check");
  await form.getByLabel("Email").fill("focus@example.com");
  const box = form.getByRole("alert");
  for (let i = 0; i < 5; i += 1) {
    await sendButton(page).click();
    await expect(box).toContainText("Several requests");
    await expect(box).toBeFocused();
    await sendButton(page).focus();
  }
});

test("the contact form retries once with a fresh token and keeps the message", async ({ page, context }) => {
  await page.goto("/contact");
  const form = page.locator('form[action="/api/contact"]');
  await expect(form).toHaveAttribute("novalidate", "");
  await form.getByLabel("Name").fill("Token Retry");
  await form.getByLabel("Email").fill("contact-retry@example.com");
  await form.getByLabel("Message").fill("Checking the token retry on the enquiry form.");
  await form.getByRole("checkbox", { name: /I consent/ }).check();
  await context.clearCookies({ name: "ag_csrf" });

  const statuses: number[] = [];
  page.on("response", (res) => {
    if (new URL(res.url()).pathname === "/api/contact" && res.request().method() === "POST") {
      statuses.push(res.status());
    }
  });
  await form.getByRole("button", { name: "Send enquiry" }).click();
  const thanks = page.getByRole("status").filter({ hasText: "Your enquiry has been received" });
  await expect(thanks).toBeFocused();
  expect(statuses).toEqual([403, 200]);
});

test("the contact form's plain POST, as sent without JavaScript, is received", async ({ page }) => {
  await page.goto("/contact");
  const form = page.locator('form[action="/api/contact"]');
  await expect(form).toHaveAttribute("novalidate", "");
  await form.getByLabel("Name").fill("Plain Post");
  await form.getByLabel("Email").fill("contact-plain@example.com");
  await form.getByLabel("Message").fill("Sent as a plain form post, as without JavaScript.");
  await form.getByRole("checkbox", { name: /I consent/ }).check();
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/contact" && url.searchParams.get("sent") === "1"),
    form.evaluate((f: HTMLFormElement) => f.submit()),
  ]);
  // Nothing the customer typed is in the URL.
  expect(page.url()).not.toContain("example.com");
  await expect(page.getByRole("status").filter({ hasText: "Your enquiry has been received" })).toBeFocused();
});
