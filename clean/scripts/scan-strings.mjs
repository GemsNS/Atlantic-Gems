/**
 * Customer-facing string scan.
 *  - Attribution terms must not appear anywhere in app source or built output.
 *  - Draft/placeholder copy must not appear in built HTML.
 * Exit code 1 on any hit.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const SOURCE_DIRS = ["app", "components", "lib", "public"];
const BUILT_DIR = join(ROOT, ".next", "server", "app");

const ATTRIBUTION = [
  /claude/i,
  /anthropic/i,
  /openai/i,
  /chatgpt/i,
  /generated (by|with) ai/i,
  /built with ai/i,
  /powered by (next|vercel|shopify)/i,
];

const DRAFT_COPY = [
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
const ROUTES = [
  "/",
  "/gemstones",
  "/custom-jewellery",
  "/repair-restoration",
  "/stone-setting",
  "/watches",
  "/contact",
  "/privacy",
  "/wholesale/login",
  "/nope-404",
];

let livePages = 0;
const base = process.env.SCAN_BASE_URL;
if (base) {
  for (const route of ROUTES) {
    const res = await fetch(new URL(route, base));
    const html = await res.text();
    livePages++;
    scanText(html, `attribution/live ${route}`, ATTRIBUTION);
    scanText(html, `draft-copy/live ${route}`, DRAFT_COPY);
    if (/x-powered-by/i.test([...res.headers.keys()].join(","))) {
      failures++;
      console.error(`[header/live ${route}]: X-Powered-By present`);
    }
  }
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
  `String scan clean. Source dirs: ${SOURCE_DIRS.join(", ")}; live pages scanned: ${livePages}.`,
);
