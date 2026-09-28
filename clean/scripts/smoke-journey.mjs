/**
 * End-to-end smoke test of the parts journey over HTTP: add to the tray,
 * change a quantity, send the tray for a quote (and the form's plain no-JS
 * POST), see the confirmation, and recover from an expired security token.
 * Every redirect must stay on the site. No browser and no dependencies, so it
 * runs anywhere Node 20+ does, including CI against `next start`. It uses one
 * of the five quote requests allowed per ten minutes, so it can be re-run.
 *
 *   SMOKE_BASE_URL=http://127.0.0.1:3000 npm run smoke
 *
 * Point it at a server with a scratch DATA_DIR: it writes a real quote, and
 * expects the default settings (parts page on, collection off) and at least
 * one public part.
 * Exit code 1 on the first failed step.
 */
const BASE = (process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const jar = new Map();
let step = 0;

function check(ok, label, detail = "") {
  step += 1;
  if (!ok) {
    console.error(`FAIL ${step}. ${label}${detail ? ` — ${detail}` : ""}`);
    process.exit(1);
  }
  console.log(`ok   ${step}. ${label}`);
}

function keep(res) {
  for (const raw of res.headers.getSetCookie?.() ?? []) {
    const [pair] = raw.split(";");
    const i = pair.indexOf("=");
    jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
  }
}

function cookieHeader(omit = []) {
  return [...jar]
    .filter(([k]) => !omit.includes(k))
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

async function get(path) {
  const res = await fetch(BASE + path, { headers: { Cookie: cookieHeader() }, redirect: "manual" });
  keep(res);
  return { res, text: await res.text() };
}

async function post(path, fields, { json = false, omitCookies = [] } = {}) {
  const body = new URLSearchParams(fields);
  const res = await fetch(BASE + path, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: BASE,
      Cookie: cookieHeader(omitCookies),
      ...(json ? { Accept: "application/json" } : {}),
    },
    body,
  });
  keep(res);
  const data = json ? await res.json().catch(() => ({})) : null;
  return { res, data };
}

const csrf = () => decodeURIComponent(jar.get("ag_csrf") ?? "");

/**
 * A redirect must stay on this site as the visitor sees it: a relative
 * Location, or one on BASE's own origin. Behind the proxy in docs/DEPLOY.md an
 * absolute Location built from the app's own address would send the browser
 * to the visitor's own machine.
 */
function onSite(location) {
  if (!location) return false;
  if (location.startsWith("/") && !location.startsWith("//")) return true;
  try {
    return new URL(location).origin === new URL(BASE).origin;
  } catch {
    return false;
  }
}

/** The path and query a redirect points at, resolved the way a browser would. */
const target = (res) => {
  const url = new URL(res.headers.get("location") ?? "", BASE);
  return url.pathname + url.search;
};

// 1. The counter lists at least one part and hands out a token.
const counter = await get("/parts");
check(counter.res.status === 200, "GET /parts is 200", String(counter.res.status));
const partId = /\/parts\/item\/([a-z0-9]+)/.exec(counter.text)?.[1];
check(Boolean(partId), "the counter links at least one part");
check(/^[0-9a-f]{64}$/.test(csrf()), "a security token cookie is set");

// A part that does not exist is a real 404, not a 200 page that says so. A
// route-level loading.tsx would stream the shell first and lose the status
// (plan item U6), so this guards the Suspense boundaries staying below it.
const missing = await get("/parts/item/doesnotexist00");
check(missing.res.status === 404, "a missing part returns 404", String(missing.res.status));

// The same for the collection, which had a route-level loading.tsx of its own.
// With the default settings (a scratch DATA_DIR) the collection is off.
const collection = await get("/inventory");
check(collection.res.status === 404, "the collection, switched off, returns 404", String(collection.res.status));
const missingPiece = await get("/inventory/doesnotexist00");
check(missingPiece.res.status === 404, "a missing collection piece returns 404", String(missingPiece.res.status));

// 2. Add to the tray.
const add = await post("/api/cart/add", { csrf: csrf(), partId, qty: "2" });
check(
  add.res.status === 303 && new URL(add.res.headers.get("location"), BASE).pathname === "/cart",
  "add to tray redirects to /cart",
  `${add.res.status} ${add.res.headers.get("location")}`,
);
check(
  onSite(add.res.headers.get("location")),
  "the redirect stays on this site (relative, or BASE's origin)",
  String(add.res.headers.get("location")),
);
check(jar.has("ag_cart"), "the tray cookie is set");

// Emptying the tray with a bad token says so, as add and update do.
const staleClear = await post("/api/cart/clear", { csrf: "0".repeat(64) });
check(
  staleClear.res.status === 303 &&
    target(staleClear.res) === "/cart?error=csrf" &&
    onSite(staleClear.res.headers.get("location")),
  "emptying the tray with a bad token redirects to /cart?error=csrf",
  `${staleClear.res.status} ${staleClear.res.headers.get("location")}`,
);

// 3. The tray shows the line.
const tray = await get("/cart");
check(tray.res.status === 200 && tray.text.includes(`/parts/item/${partId}`), "the tray lists the part");

// 4. Change the quantity.
const qty = await post("/api/cart/update", { csrf: csrf(), partId, intent: "set", qty: "3" });
check(
  qty.res.status === 303 && target(qty.res) === "/cart" && onSite(qty.res.headers.get("location")),
  "quantity change redirects back to /cart on this site",
  `${qty.res.status} ${qty.res.headers.get("location")}`,
);
const tray2 = await get("/cart");
check(/value="3"/.test(tray2.text), "the tray shows the new quantity");

// The form's plain POST, as sent without JavaScript: a bad email comes back
// as a redirect with a fixed code. Validation runs before the rate limit, so
// this uses none of the five quote requests allowed per ten minutes.
const noJs = await post("/api/cart/checkout", { csrf: csrf(), name: "Smoke Test", email: "x", hp_note: "" });
check(
  noJs.res.status === 303 && target(noJs.res) === "/cart?error=fields" && onSite(noJs.res.headers.get("location")),
  "a plain (no-JS) quote post with a bad email redirects to /cart?error=fields",
  `${noJs.res.status} ${noJs.res.headers.get("location")}`,
);

// 5. Send the tray, honeypot empty.
const quote = await post(
  "/api/cart/checkout",
  { csrf: csrf(), name: "Smoke Test", email: "smoke@example.com", company: "", notes: "Automated smoke test", hp_note: "" },
  { json: true },
);
const reference = quote.data?.reference ?? "";
check(
  quote.res.status === 200 && quote.data?.ok === true && /^Q-[A-Z0-9]{6}$/.test(reference),
  "the quote request returns a reference",
  `${quote.res.status} ${JSON.stringify(quote.data)}`,
);

// 6. The confirmation page names the reference and the tray is empty.
const sent = await get(`/cart?sent=${reference}`);
check(sent.text.includes(reference) && sent.text.includes("Tray received"), "the confirmation shows the reference");
check(sent.text.includes("The tray is empty"), "the tray is emptied after sending");

// 7. An expired token: the server answers 403 and sets a fresh cookie; one
// retry with that cookie gets past the check. The retry carries a bad email,
// so it stops at validation (422) before the rate limit: a run uses one of the
// five quote requests allowed per ten minutes, and can be repeated.
const stale = csrf();
const expired = await post(
  "/api/cart/checkout",
  { csrf: stale, name: "Smoke Test", email: "smoke@example.com" },
  { json: true, omitCookies: ["ag_csrf"] },
);
check(expired.res.status === 403 && expired.data?.code === "csrf", "a missing token cookie gets 403 csrf");
check(/^[0-9a-f]{64}$/.test(csrf()) && csrf() !== stale, "the 403 response sets a fresh token");
const retry = await post("/api/cart/checkout", { csrf: csrf(), name: "Smoke Test", email: "x" }, { json: true });
check(
  retry.res.status === 422 && retry.data?.code === "fields",
  "the retry with the fresh token passes the check",
  `${retry.res.status} ${retry.data?.code}`,
);

console.log(`\nJourney smoke passed against ${BASE} (quote ${reference}).`);
