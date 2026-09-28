/**
 * Customer-facing string scan.
 *  - Attribution terms must not appear anywhere in app source (static-overlay/
 *    included) or built output.
 *  - Draft/placeholder copy must not appear in built HTML or on live pages.
 * With SCAN_BASE_URL it also checks each live page's status. Exit code 1 on
 * any hit or unexpected status.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
// static-overlay/ holds the customer-facing GitHub Pages variants of some pages.
const SOURCE_DIRS = ["app", "components", "lib", "public", "static-overlay"];
const BUILT_DIR = join(ROOT, ".next", "server", "app");

const ATTRIBUTION = [
  /claude/i,
  /anthropic/i,
  /openai/i,
  /chatgpt/i,
  /generated (by|with) ai/i,
  /built with ai/i,
  /powered by (next|vercel|shopify)/i,
  // Copy tics that read as machine-written.
  /\bdelve\b/i,
  /\belevate your\b/i,
  /\bunlock(ing)? the\b/i,
  /\bseamless(ly)?\b/i,
  /\bcurated\b/i,
  /\bbespoke\b/i,
];

// Private strings (e.g. the client's street address) must never reach a page.
// Supplied at scan time so nothing private is stored in the repository:
//   PRIVATE_STRINGS="street name,postal code" SCAN_BASE_URL=... npm run scan
const PRIVATE = (process.env.PRIVATE_STRINGS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));

const DRAFT_COPY = [
  ...PRIVATE,
  /lorem ipsum/i,
  /\bipsum\b/i,
  /\btodo\b/i,
  /\bfixme\b/i,
  /\[insert/i,
  /coming soon/i,
  /under construction/i,
  /sample (inventory|product|stone|parcel)/i,
  /\bxxx+\b/i,
  /shopify/i,
];

const SOURCE_EXT = new Set([".ts", ".tsx", ".css", ".svg", ".txt", ".mjs", ".json"]);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

let failures = 0;

function scan(file, patterns, label) {
  const text = readFileSync(file, "utf8");
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      failures++;
      console.error(`[${label}] ${file}: "${m[0]}"`);
    }
  }
}

for (const dir of SOURCE_DIRS) {
  for (const f of walk(join(ROOT, dir))) {
    if (SOURCE_EXT.has(extname(f))) scan(f, ATTRIBUTION, "attribution/source");
  }
}

function scanText(text, label, patterns) {
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      failures++;
      console.error(`[${label}]: "${m[0]}"`);
    }
  }
}

// Pages render per request, so the authoritative scan runs against a live
// server: SCAN_BASE_URL=http://localhost:3000 npm run scan
//
// Every page checks its status, and a 404 is never counted as scanned: a page
// the site mode has switched off renders the not-found page, which would
// otherwise pass as the page itself.
/** On in every site mode; each must answer 200. */
const ALWAYS = ["/", "/contact", "/privacy", "/policies/disclosure", "/policies/wholesale-terms", "/admin/login"];
/** Switched on or off by the site mode: scanned when 200, skipped when 404, anything else fails. */
const GATED = [
  "/parts",
  "/cart",
  "/wholesale/login",
  "/inventory",
  "/jewellery",
  "/gemstones",
  "/custom-jewellery",
  "/repair-restoration",
  "/stone-setting",
  "/watches",
  "/appraisals-consignment",
];
const NOT_FOUND = "/nope-404";

let livePages = 0;
const skipped = [];
const base = process.env.SCAN_BASE_URL;

async function scanLive(route, expect) {
  const res = await fetch(new URL(route, base), { redirect: "manual" });
  const html = await res.text();
  if (expect === "gated" && res.status === 404) {
    skipped.push(route);
    return null;
  }
  const want = expect === "404" ? 404 : 200;
  if (res.status !== want) {
    failures++;
    console.error(`[status/live ${route}]: ${res.status}, expected ${want}`);
    return null;
  }
  livePages++;
  scanText(html, `attribution/live ${route}`, ATTRIBUTION);
  scanText(html, `draft-copy/live ${route}`, DRAFT_COPY);
  if (/x-powered-by/i.test([...res.headers.keys()].join(","))) {
    failures++;
    console.error(`[header/live ${route}]: X-Powered-By present`);
  }
  return html;
}

if (base) {
  // Pages the sitemap lists are switched on, so they must answer 200.
  const sm = await fetch(new URL("/sitemap.xml", base));
  const sitemap = sm.ok ? await sm.text() : "";
  const listed = new Set(
    [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1].trim()).pathname),
  );
  // A broken sitemap would quietly make every switchable page optional.
  if (sm.status !== 200 || listed.size === 0) {
    failures++;
    console.error(`[status/live /sitemap.xml]: ${sm.status}, ${listed.size} entries`);
  }
  for (const route of ALWAYS) await scanLive(route, "200");
  for (const route of GATED) {
    const on = listed.has(route) || (route === "/cart" && listed.has("/parts"));
    const html = await scanLive(route, on ? "200" : "gated");
    if (route === "/parts" && html) {
      // The counter's own pages: one tray and one part, found the way a visitor would.
      const tray = /href="\/parts\/((?!item\b)[a-z-]+)"/.exec(html)?.[1];
      const item = /\/parts\/item\/([a-z0-9-]+)/.exec(html)?.[1];
      if (!tray || !item) {
        failures++;
        console.error("[live /parts]: no tray or part link found to scan");
      }
      if (tray) await scanLive(`/parts/${tray}`, "200");
      if (item) await scanLive(`/parts/item/${item}`, "200");
    }
  }
  await scanLive(NOT_FOUND, "404");
} else {
  const built = walk(BUILT_DIR).filter((f) => f.endsWith(".html"));
  if (built.length === 0) {
    console.warn("No live server given (SCAN_BASE_URL) and no built HTML found; source scan only.");
  }
  for (const f of built) {
    scan(f, ATTRIBUTION, "attribution/built");
    scan(f, DRAFT_COPY, "draft-copy/built");
  }
}

if (failures > 0) {
  console.error(`\nString scan failed with ${failures} hit(s).`);
  process.exit(1);
}
console.log(
  `String scan clean. Source dirs: ${SOURCE_DIRS.join(", ")}; live pages scanned: ${livePages}` +
    (skipped.length ? `; switched off (404, not scanned): ${skipped.join(", ")}.` : "."),
);
