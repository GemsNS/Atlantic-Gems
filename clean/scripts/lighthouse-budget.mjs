/**
 * Lighthouse mobile runs of the three journey pages against a running server,
 * checked against the plan's budget (U11): LCP under 2.5 s, CLS under 0.05.
 * INP is a field metric that a navigation run cannot measure; Total Blocking
 * Time is reported as its lab stand-in and `scripts/interaction-latency.mjs`
 * times real interactions.
 *
 *   LH_BASE_URL=http://localhost:3100 LH_OUT=/tmp/lh npm run perf:lighthouse
 *
 * Runs `npx lighthouse@13.5.0` (not a project dependency) with its default
 * mobile emulation and simulated throttling, LH_RUNS times per page (default
 * 3). The budget is checked against the median LCP and the median CLS of the
 * runs, each taken on its own; the run with the median performance score is
 * kept as the page's representative report. /cart is measured with one line
 * in the tray, added over HTTP first, so the page is not the empty state.
 * Writes every run's JSON and a summary.json to LH_OUT (default: a folder in
 * the system temp directory; the /cart reports hold the test tray's cookies,
 * so keep them out of the repository). Exit code 1 if the median LCP or the
 * median CLS of any page misses the budget.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const BASE = (process.env.LH_BASE_URL ?? "http://localhost:3100").replace(/\/$/, "");
const OUT = resolve(process.env.LH_OUT ?? join(tmpdir(), "ag-lighthouse"));
const RUNS = Number(process.env.LH_RUNS ?? 3);
const LIGHTHOUSE = "lighthouse@13.5.0";
const BUDGET = { lcpMs: 2500, cls: 0.05 };
mkdirSync(OUT, { recursive: true });

/** A tray cookie with one part in it, the same way `npm run smoke` gets one. */
async function trayCookie() {
  const jar = new Map();
  const keep = (res) => {
    for (const raw of res.headers.getSetCookie?.() ?? []) {
      const [pair] = raw.split(";");
      const i = pair.indexOf("=");
      jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
    }
  };
  const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
  const counter = await fetch(`${BASE}/parts`, { redirect: "manual" });
  keep(counter);
  const partId = /\/parts\/item\/([a-z0-9]+)/.exec(await counter.text())?.[1];
  if (!partId) throw new Error("no public part on /parts");
  const add = await fetch(`${BASE}/api/cart/add`, {
    method: "POST",
    redirect: "manual",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: BASE, Cookie: cookie() },
    body: new URLSearchParams({ csrf: decodeURIComponent(jar.get("ag_csrf") ?? ""), partId, qty: "1" }),
  });
  keep(add);
  if (!jar.has("ag_cart")) throw new Error(`add to tray failed (${add.status})`);
  return cookie();
}

function run(page, n, extraHeaders) {
  const file = join(OUT, `${page.name}-run${n}.json`);
  const args = [
    "-y",
    LIGHTHOUSE,
    `${BASE}${page.path}`,
    "--only-categories=performance",
    "--output=json",
    `--output-path=${file}`,
    "--chrome-flags=--headless=new",
    "--quiet",
  ];
  if (extraHeaders) {
    // A file, not inline JSON, so no shell mangles the quotes.
    const headersFile = join(OUT, `${page.name}-headers.json`);
    writeFileSync(headersFile, JSON.stringify(extraHeaders));
    args.push(`--extra-headers=${headersFile}`);
  }
  rmSync(file, { force: true });
  // Windows needs a shell to find npx.cmd; the shell splits unquoted paths at spaces.
  const win = process.platform === "win32";
  const argv = win ? args.map((x) => (x.includes(" ") ? `"${x}"` : x)) : args;
  const r = spawnSync("npx", argv, { stdio: "inherit", shell: win });
  // On Windows, chrome-launcher can exit 1 with EPERM while deleting its temp
  // profile *after* the report is written. A fresh report is the real signal.
  if (r.status !== 0 && !existsSync(file)) throw new Error(`lighthouse failed on ${page.path} (run ${n})`);
  const lhr = JSON.parse(readFileSync(file, "utf8"));
  if (lhr.runtimeError) throw new Error(`lighthouse error on ${page.path}: ${lhr.runtimeError.code}`);
  const a = lhr.audits;
  return {
    run: n,
    file,
    score: Math.round((lhr.categories.performance.score ?? 0) * 100),
    fcpMs: Math.round(a["first-contentful-paint"].numericValue),
    lcpMs: Math.round(a["largest-contentful-paint"].numericValue),
    cls: Number(a["cumulative-layout-shift"].numericValue.toFixed(3)),
    tbtMs: Math.round(a["total-blocking-time"].numericValue),
    siMs: Math.round(a["speed-index"].numericValue),
    lighthouse: lhr.lighthouseVersion,
    userAgent: lhr.environment?.hostUserAgent ?? "",
    finalUrl: lhr.finalDisplayedUrl ?? lhr.finalUrl,
  };
}

const cartCookie = await trayCookie();
const pages = [
  { name: "home", path: "/" },
  { name: "parts", path: "/parts" },
  { name: "cart", path: "/cart", headers: { Cookie: cartCookie } },
];

/** The middle value (the upper middle for an even count). */
const med = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

const summary = [];
for (const page of pages) {
  const runs = [];
  for (let n = 1; n <= RUNS; n += 1) runs.push(run(page, n, page.headers));
  // Each metric's own median: the run with the median score can have a
  // better LCP than most runs, which would pass a page whose median fails.
  const medians = {
    score: med(runs.map((r) => r.score)),
    lcpMs: med(runs.map((r) => r.lcpMs)),
    cls: med(runs.map((r) => r.cls)),
    tbtMs: med(runs.map((r) => r.tbtMs)),
  };
  const representative = [...runs].sort((x, y) => x.score - y.score)[Math.floor(runs.length / 2)];
  const pass = { lcp: medians.lcpMs < BUDGET.lcpMs, cls: medians.cls < BUDGET.cls };
  summary.push({ page: page.path, medians, pass, representative, runs });
  console.log(
    `${page.path.padEnd(7)} score ${medians.score}  LCP ${medians.lcpMs} ms ${pass.lcp ? "pass" : "FAIL"}  ` +
      `CLS ${medians.cls} ${pass.cls ? "pass" : "FAIL"}  TBT ${medians.tbtMs} ms  (medians of ${runs.length} runs)`,
  );
}
writeFileSync(join(OUT, "summary.json"), JSON.stringify({ base: BASE, budget: BUDGET, summary }, null, 2));
console.log(`\nReports in ${OUT}`);
if (summary.some((s) => !s.pass.lcp || !s.pass.cls)) process.exit(1);
