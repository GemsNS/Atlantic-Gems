import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

/**
 * Browser smoke of the quote journey against `next start` (run `npm run build`
 * first). The server gets a scratch DATA_DIR, because the tests write real
 * quotes, and a fixed SESSION_SECRET, because `next start` is production and
 * switches the tray off without one (plan item S10).
 *
 * One worker, no retries and a fresh server every run: quote checkout is
 * rate-limited to 5 per 10 minutes, and without TRUST_PROXY every request
 * shares one bucket. The suite sends 3 quotes and 2 enquiries.
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);
// Set once in the main process; workers inherit it and reuse the same folder.
process.env.E2E_DATA_DIR ??= mkdtempSync(path.join(tmpdir(), "ag-e2e-"));

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    // localhost, not 127.0.0.1: production cookies are Secure, and Chrome
    // accepts them over plain http on the localhost name.
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 60_000,
    // `next start` also loads clean/.env.local, .env.production and .env, but
    // never over a variable that is already set, even to "". These blanks keep
    // a developer's mail settings from those files out of the test server, so
    // the test quotes never reach the house inbox or a customer.
    env: {
      DATA_DIR: process.env.E2E_DATA_DIR,
      SESSION_SECRET: "e2e-only-session-secret-not-for-production-use-0123456789",
      RESEND_API_KEY: "",
      CONTACT_WEBHOOK_URL: "",
      CUSTOMER_ACK_EMAIL: "false",
      TRUST_PROXY: "false",
    },
  },
});
