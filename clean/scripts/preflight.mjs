/**
 * Launch preflight: checks the environment a production launch needs and
 * prints a PASS / WARN / FAIL table. Exit code 1 when any check FAILs.
 * Secret values are never printed, only whether each is set and well formed.
 * No dependencies; Node 20+.
 *
 * Run it as the user the server runs as, with the environment the server
 * process gets:
 *
 *   npm run preflight                                      variables already exported (PM2, systemd, host dashboard)
 *   node --env-file=.env.production scripts/preflight.mjs  values kept in a file (Node 20.6+)
 *
 * --env-file is Node's own option, so it goes before the script name, and
 * `npm run preflight -- --env-file=...` does not work. This script never reads
 * .env files itself; Node loads the file and the checks see the result.
 *
 * Two traps the table explains when they apply:
 *  - Next.js expands $NAME inside the .env files it reads (.env, .env.local,
 *    .env.production and .env.production.local in clean/, or the copies next
 *    build puts in .next/standalone), which strips the separators out of an
 *    ADMIN_PASSWORD_HASH pasted as printed. In those files write each $ as \$.
 *    Every other file, such as /etc/atlantic-gems/production.env loaded with
 *    Node's --env-file (PM2), passes backslashes through, so there \$ breaks
 *    every admin sign-in (systemd's EnvironmentFile would strip them from an
 *    unquoted value, but this check reads the file as --env-file does): write
 *    plain $. Node's --env-file keeps the backslashes for this script too, so
 *    it sees the value as written and judges it by the file it came from.
 *  - The standalone server (.next/standalone/server.js) sets NODE_ENV itself,
 *    changes into its own folder, and reads only the .env and .env.production
 *    that next build copied there. clean/.env.local never reaches it, and a
 *    relative or missing DATA_DIR lands inside .next/standalone.
 */
import { scryptSync } from "node:crypto";
import {
  accessSync,
  constants,
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/** The .env files Next.js reads at build or start, and expands $NAME in. */
const NEXT_ENV_FILES = new Set([".env", ".env.local", ".env.production", ".env.production.local"]);
const USAGE = "Usage (from clean/): npm run preflight\n       node --env-file=<file> scripts/preflight.mjs";

const args = process.argv.slice(2);
if (args.includes("-h") || args.includes("--help")) {
  console.log(USAGE);
  process.exit(0);
}
const misplaced = args.find((a) => a.startsWith("--env-file"));
if (misplaced) {
  const flag = misplaced.includes("=") ? misplaced : `${misplaced}=<file>`;
  console.error(
    `${misplaced} is an option for Node itself, so it goes before the script name:\n` +
      `  node ${flag} scripts/preflight.mjs\n` +
      "This script does not read .env files; Node loads the file and the checks see the result.",
  );
  process.exit(2);
}
if (args.length) {
  console.error(`Unknown argument: ${args[0]}\n${USAGE}`);
  process.exit(2);
}

/** Files Node loaded with --env-file or --env-file-if-exists, in order. */
function envFilesFromNode() {
  const files = [];
  const argv = process.execArgv;
  for (let i = 0; i < argv.length; i++) {
    const m = /^--env-file(?:-if-exists)?(?:=(.*))?$/.exec(argv[i]);
    if (!m) continue;
    const file = m[1] ?? argv[++i];
    if (file) files.push(file);
  }
  return files;
}

const ENV_FILES = envFilesFromNode();
/**
 * A folder with symlinks and junctions resolved, as Node resolves this script
 * (so APP_ROOT) to its real path; one that does not exist is left as it is.
 */
const real = (p) => {
  try {
    return realpathSync(p);
  } catch {
    return path.resolve(p);
  }
};
/** Folders Next.js reads .env files from: clean/ (build, next start) and the standalone copy. */
const NEXT_ENV_DIRS = [APP_ROOT, path.join(APP_ROOT, ".next", "standalone")].map(real);
const sameDir = (a, b) => (process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b);
/**
 * True when a loaded file is one Next.js itself reads: by its name and by its
 * folder, reached directly or through a symlinked folder (a current ->
 * releases/N deploy). Only the folder is resolved: a .env file in clean/ that
 * is itself a symlink to elsewhere is still one Next.js reads.
 */
const FROM_NEXT_FILE = ENV_FILES.some(
  (f) =>
    NEXT_ENV_FILES.has(path.basename(f)) &&
    NEXT_ENV_DIRS.some((d) => sameDir(d, real(path.dirname(path.resolve(f))))),
);

const rows = [];
const pass = (check, detail) => rows.push({ status: "PASS", check, detail });
const warn = (check, detail) => rows.push({ status: "WARN", check, detail });
const fail = (check, detail) => rows.push({ status: "FAIL", check, detail });

/** A non-secret value, quoted so stray spaces show, and kept short. */
function show(value) {
  return JSON.stringify(value.length > 60 ? `${value.slice(0, 57)}...` : value);
}

const SESSION_SECRET_HOWTO =
  "Generate one: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"";

function checkNode() {
  const major = Number(process.versions.node.split(".")[0]);
  if (major >= 20) pass("Node.js", `${process.version}.`);
  else warn("Node.js", `${process.version}. docs/DEPLOY.md expects Node 20 or later.`);
}

/** A .local file passes here but never reaches the standalone server. */
function checkEnvFiles() {
  const local = ENV_FILES.map((f) => path.basename(f)).filter((f) => f.endsWith(".local"));
  if (!local.length) return;
  warn(
    "Environment file",
    `${local.join(", ")}: only next start, run from clean/, reads this. The standalone server.js reads ` +
      ".env files from .next/standalone, where next build copies just .env and .env.production. For that " +
      "server, give these values to the process manager or put them in .env.production.",
  );
}

function checkNodeEnv() {
  const v = process.env.NODE_ENV;
  if (v === "production") return pass("NODE_ENV", "production.");
  warn(
    "NODE_ENV",
    `${v ? show(v) : "Not set"} in this shell. next start and the standalone server.js set production ` +
      "themselves, so this matters only if the site is started some other way: outside production, " +
      "cookies lose the Secure flag, the CSP allows eval, and a missing SESSION_SECRET falls back to a " +
      "development key. Run the preflight with NODE_ENV=production to match the server.",
  );
}

function checkSessionSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    return fail(
      "SESSION_SECRET",
      `Not set. The quote tray is switched off, and trade and admin sign-in answer with a configuration error. ${SESSION_SECRET_HOWTO}`,
    );
  }
  if (s.length < 32) {
    return fail(
      "SESSION_SECRET",
      `Set, but shorter than 32 characters, so trade and admin sign-in refuse it. ${SESSION_SECRET_HOWTO}`,
    );
  }
  pass("SESSION_SECRET", "Set, 32 characters or more.");
}

const HEX = /^[0-9a-f]+$/i;

/** Mirrors verifyPassword in lib/security/admin.ts, but stricter about hex. */
function checkAdminHash() {
  const NAME = "ADMIN_PASSWORD_HASH";
  const HOWTO = "Generate it with node scripts/hash-password.mjs.";
  const raw = process.env.ADMIN_PASSWORD_HASH;
  if (!raw) {
    return fail(NAME, `Not set. /admin/login says admin access is not configured and nobody can sign in. ${HOWTO}`);
  }
  const escaped = raw.includes("\\$");
  if (escaped && !FROM_NEXT_FILE) {
    return fail(
      NAME,
      ENV_FILES.length
        ? `Contains \\$, loaded from ${ENV_FILES.join(", ")}, which Next.js does not read. Node --env-file ` +
            "(which PM2 uses, and so does this preflight) keeps the backslashes, so under PM2 they reach the " +
            "app and every admin sign-in fails. Write plain $ in this file, as docs/DEPLOY.md says; it works " +
            "under PM2 and systemd alike, and the \\$ form is only for the .env files in clean/ that Next.js reads."
        : "Contains \\$. That escape belongs only in a .env file Next.js reads; in the process environment " +
            "the backslashes reach the app and every admin sign-in fails. Use plain $ here.",
    );
  }
  if (FROM_NEXT_FILE && /(^|[^\\])\$/.test(raw)) {
    return fail(
      NAME,
      `Loaded from ${ENV_FILES.map((f) => path.basename(f)).join(", ")}, which Next.js also reads and expands ` +
        "$NAME in: the hash would reach the app without its $ separators and every admin sign-in would fail. " +
        "Write each $ as \\$ in that file.",
    );
  }
  const value = escaped ? raw.replaceAll("\\$", "$") : raw;
  const parts = value.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") {
    return fail(
      NAME,
      value.startsWith("scrypt") && parts.length < 6
        ? "Not in the scrypt$N$r$p$salt$hash format: $ separators are missing. Shells and Next's .env " +
            "loader both expand $: single-quote the value in a shell, and write each $ as \\$ in a .env file."
        : `Not in the scrypt$N$r$p$salt$hash format that /admin/login expects. ${HOWTO}`,
    );
  }
  const [, nRaw, rRaw, pRaw, saltHex, hashHex] = parts;
  const n = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (![n, r, p].every((x) => Number.isInteger(x) && x > 0)) {
    return fail(NAME, `The N, r and p fields must be whole numbers above 0. ${HOWTO}`);
  }
  if (!HEX.test(saltHex) || saltHex.length % 2 || saltHex.length < 16) {
    return fail(NAME, `The salt must be at least 16 hex characters. ${HOWTO}`);
  }
  if (!HEX.test(hashHex) || hashHex.length % 2) {
    return fail(NAME, `The hash field must be hex characters. ${HOWTO}`);
  }
  try {
    // The same call verifyPassword makes, on a throwaway password.
    scryptSync("preflight", Buffer.from(saltHex, "hex"), hashHex.length / 2, { N: n, r, p });
  } catch {
    return fail(
      NAME,
      `Node rejects these scrypt parameters (N must be a power of two and the memory needed under 32 MB), so no sign-in can succeed. ${HOWTO}`,
    );
  }
  const notes = [];
  if (n < 16384 || saltHex.length < 32 || hashHex.length < 64) {
    notes.push(`Weaker than node scripts/hash-password.mjs makes; generate it again.`);
  }
  if (notes.length) return warn(NAME, `Set, scrypt format. ${notes.join(" ")}`);
  pass(NAME, `Set, in the scrypt format /admin/login accepts${escaped ? " (with \\$ escapes for Next's .env loader)" : ""}.`);
}

const PAGE_KEYS = [
  "jewellery",
  "custom",
  "repair",
  "setting",
  "appraisals",
  "watches",
  "gemstones",
  "collection",
  "parts",
  "wholesale",
];
const SITE_MODES = ["parts-supplier", "atelier", "full-house", "custom"];
const isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const optional = (v, test) => v === undefined || test(v);
const isBool = (v) => typeof v === "boolean";
const isStamp = (v) => v === null || typeof v === "string";
const isText = (max) => (v) => typeof v === "string" && v.trim().length <= max;

/** Mirrors settingsSchema in lib/inventory/types.ts. When it fails, getSettings uses the defaults. */
function settingsValid(s) {
  return (
    isObject(s) &&
    optional(s.shopOpen, isBool) &&
    optional(s.siteMode, (v) => SITE_MODES.includes(v)) &&
    optional(s.pages, (p) => isObject(p) && PAGE_KEYS.every((k) => isBool(p[k]))) &&
    optional(s.ebayLastImport, isStamp) &&
    optional(s.ebayLastResult, isStamp) &&
    optional(
      s.ebay,
      (e) =>
        isObject(e) &&
        optional(e.sellerUsername, isText(80)) &&
        optional(e.storeUrl, isText(500)) &&
        optional(e.syncEnabled, isBool) &&
        optional(e.importToVisibility, (v) => ["public", "trade", "private"].includes(v)) &&
        optional(
          e.categories,
          (c) => isObject(c) && ["jewellery", "watches", "looseStones"].every((k) => optional(c[k], isBool)),
        ) &&
        optional(e.lastImport, isStamp) &&
        optional(e.lastResult, isStamp),
    )
  );
}

/**
 * Is the trade page on? Read from DATA_DIR/settings.json the way
 * lib/inventory/store.ts reads it. Every site mode but "custom" takes its
 * pages from a preset in lib/site-pages.ts, and every preset turns the trade
 * page on, so only a custom mode with pages.wholesale false turns it off. A
 * missing file, or one the schema refuses, leaves the app on its defaults
 * (parts-supplier mode, trade page on).
 */
function tradePage() {
  const raw = process.env.DATA_DIR;
  if (raw === "") return { state: "unreadable", why: "DATA_DIR is set but empty" };
  const file = path.join(path.resolve(raw ?? "data"), "settings.json");
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch (err) {
    if (err?.code === "ENOENT") return { state: "missing", file };
    return { state: "unreadable", why: `${file} could not be read (${fsReason(err)})` };
  }
  let settings;
  try {
    // As lib/json-store.ts does: some Windows editors save a byte order mark.
    settings = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    return { state: "unreadable", why: `${file} is not valid JSON` };
  }
  if (!settingsValid(settings)) return { state: "refused", file };
  const mode = settings.siteMode ?? "parts-supplier";
  if (mode !== "custom") return { state: "on", why: `site mode ${mode}, whose preset switches it on` };
  const pages = settings.pages;
  if (!pages) return { state: "on", why: "custom site mode with no page list, so the parts-supplier pages apply" };
  if (!pages.wholesale) return { state: "off", file };
  return { state: "on", why: "custom site mode, with Trade / wholesale switched on" };
}

function checkWholesale() {
  const NAME = "WHOLESALE_PASSWORD_SHA256";
  const raw = process.env.WHOLESALE_PASSWORD_SHA256;
  const HOWTO =
    "Generate it: node -e \"console.log(require('crypto').createHash('sha256').update('PHRASE').digest('hex'))\"";
  const BROKEN = "/wholesale/login answers every sign-in with a configuration error";
  const EITHER = "Set this, or switch Trade / wholesale off at /admin/site.";
  if (!raw) {
    const trade = tradePage();
    switch (trade.state) {
      case "off":
        return pass(
          NAME,
          `Not set, and not needed yet: Trade / wholesale is switched off in ${trade.file}. Set it before switching the trade page on at /admin/site.`,
        );
      case "on":
        return fail(NAME, `Not set, but the trade page is on (${trade.why}), so ${BROKEN}. ${EITHER} ${HOWTO}`);
      case "missing":
        return warn(
          NAME,
          `Not set, and ${trade.file} does not exist yet, so the app starts on its defaults, which switch the ` +
            `trade page on, and ${BROKEN}. ${EITHER} ${HOWTO}`,
        );
      case "refused":
        return warn(
          NAME,
          `Not set, and ${trade.file} is not in the shape the app expects (lib/inventory/types.ts), so the app ` +
            `ignores it and uses its defaults, which switch the trade page on; then ${BROKEN}. ${EITHER} ` +
            `Saving at /admin/site writes the file again. ${HOWTO}`,
        );
      default:
        return warn(
          NAME,
          `Not set. ${trade.why}, so this check cannot see whether the trade page is on. When the app cannot ` +
            `read settings.json either, it uses its defaults, which switch the trade page on, and ${BROKEN}. ` +
            `${EITHER} ${HOWTO}`,
        );
    }
  }
  if (!/^[0-9a-f]{64}$/.test(raw.toLowerCase())) {
    return fail(
      NAME,
      `Set, but not 64 hex characters, so /wholesale/login answers every sign-in with a configuration error. ${HOWTO}`,
    );
  }
  pass(NAME, "Set, 64 hex characters.");
}

const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

/** "a@b.ca" or "Name <a@b.ca>", the forms Resend takes. */
function isAddress(value) {
  const named = /^[^<>]*<([^<>]+)>$/.exec(value);
  return EMAIL.test(named ? named[1] : value);
}

function checkAddress(name, whenUnset, whenSet = "") {
  const v = process.env[name];
  if (v === undefined) return warn(name, whenUnset);
  if (v.trim() === "") {
    return fail(name, "Set but empty, so Resend is given an empty address and refuses every message. Fill it in or remove the line.");
  }
  if (!isAddress(v)) return fail(name, `${show(v)} is not an email address or "Name <address>".`);
  pass(name, `${v}.${whenSet}`);
}

function checkMail() {
  const NAME = "Mail route";
  const key = process.env.RESEND_API_KEY;
  const hook = process.env.CONTACT_WEBHOOK_URL;
  if (key) {
    const also = hook ? " CONTACT_WEBHOOK_URL is also set and is not used while RESEND_API_KEY is set." : "";
    if (key.startsWith("re_")) pass(NAME, `Resend: RESEND_API_KEY is set.${also}`);
    else warn(NAME, `Resend: RESEND_API_KEY is set but does not start with re_ as Resend keys do; check it was copied whole.${also}`);
    checkAddress(
      "CONTACT_FROM",
      "Not set: mail is sent from \"Atlantic Gems <no-reply@atlanticgems.ca>\", which Resend refuses unless atlanticgems.ca is a verified domain in the account.",
      " Its domain must be verified in Resend.",
    );
    checkAddress(
      "CONTACT_TO",
      "Not set: notifications go to the support address in lib/site.ts (site.email). Confirm that mailbox is read before launch.",
    );
    return;
  }
  if (hook) {
    let url = null;
    try {
      url = new URL(hook);
    } catch {
      /* reported below */
    }
    if (!url) return fail(NAME, "Webhook: CONTACT_WEBHOOK_URL is not a valid URL, so every notification fails.");
    if (url.protocol !== "https:") {
      return fail(NAME, "Webhook: CONTACT_WEBHOOK_URL must use https; it carries customers' names, email addresses and messages.");
    }
    return pass(NAME, `Webhook: JSON POST to https://${url.host}.`);
  }
  fail(
    NAME,
    "None set. Quote requests (Admin, Quotes) and enquiries (Admin, Pipeline) are only saved in the admin " +
      "area, and nobody is emailed about them. Set RESEND_API_KEY with CONTACT_FROM and CONTACT_TO, or an " +
      "https CONTACT_WEBHOOK_URL.",
  );
}

function checkCustomerAck() {
  const NAME = "CUSTOMER_ACK_EMAIL";
  const v = process.env.CUSTOMER_ACK_EMAIL;
  if (v === undefined || v === "" || v === "false") {
    return pass(NAME, "Off: customers are not sent an acknowledgement.");
  }
  if (v !== "true") {
    return warn(NAME, `${show(v)}: only the exact value true turns acknowledgements on, so they are off.`);
  }
  warn(
    NAME,
    "true: customers are emailed an acknowledgement of each enquiry and quote request. The client must " +
      "approve that wording (lib/mail.ts) before launch." +
      (process.env.RESEND_API_KEY ? "" : " RESEND_API_KEY is not set, so none are sent: acknowledgements go through Resend only."),
  );
}

function checkSiteUrl() {
  const NAME = "NEXT_PUBLIC_SITE_URL";
  const BUILD = " NEXT_PUBLIC_ values are also fixed into the build, so set it before npm run build too.";
  const v = process.env.NEXT_PUBLIC_SITE_URL;
  if (v === undefined) {
    return warn(
      NAME,
      "Not set: canonical links and the sitemap use https://atlanticgems.ca, and the CSRF check relies on " +
        `the Host header the proxy forwards. Set it to this site's origin.${BUILD}`,
    );
  }
  let url = null;
  try {
    url = new URL(v);
  } catch {
    /* reported below */
  }
  if (!url) return fail(NAME, `${show(v)} is not a URL; the root layout builds new URL() from it, so every page fails.`);
  if (url.protocol !== "https:") return fail(NAME, `${show(v)} must use https.`);
  if (url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
    return fail(NAME, `${show(v)} must be the bare origin, like https://atlanticgems.ca: the sitemap and canonical links add paths to it.`);
  }
  if (v.endsWith("/")) {
    return warn(NAME, `${show(v)}: drop the trailing slash, or sitemap links come out as ${url.origin}//contact.`);
  }
  pass(NAME, `${v}.${BUILD}`);
}

function checkTrustProxy() {
  const NAME = "TRUST_PROXY";
  const SHARED =
    "No proxy header is trusted, so all visitors share one rate-limit bucket per form: five enquiries or " +
    "quote requests in ten minutes from anyone block them for everyone, and five trade or admin sign-in " +
    "attempts in fifteen minutes lock everyone out.";
  const DOCS = "See the rate-limit checklist in docs/DEPLOY.md.";
  const v = process.env.TRUST_PROXY;
  if (v === "true") {
    pass(
      NAME,
      "true: each visitor is limited by the address the proxy appended to X-Forwarded-For. Safe only " +
        "while the app is reachable solely through that proxy (bind it to 127.0.0.1).",
    );
    return checkProxyHops();
  }
  if (v === "false") return warn(NAME, `false. ${SHARED} Set true behind a proxy that appends to X-Forwarded-For. ${DOCS}`);
  if (v === undefined || v === "") return fail(NAME, `Not set, which behaves as false. ${SHARED} Set true or false on purpose. ${DOCS}`);
  fail(NAME, `${show(v)}: only the exact value true is honoured, so this behaves as false. ${SHARED} ${DOCS}`);
}

/** Mirrors trustedHops in lib/security/rate-limit.ts: 1 to 5, anything else means 1. */
function checkProxyHops() {
  const NAME = "TRUST_PROXY_HOPS";
  const v = process.env.TRUST_PROXY_HOPS;
  if (v === undefined || v === "") return pass(NAME, "Not set: one trusted proxy (the default).");
  const n = Number(v);
  if (n === 1) return pass(NAME, "1: the client address is the right-most X-Forwarded-For entry.");
  if (Number.isInteger(n) && n > 1 && n <= 5) {
    return warn(
      NAME,
      `${n}: the client address is entry ${n} counting from the right of X-Forwarded-For. Safe only while ` +
        "the origin (nginx) accepts connections solely from the outer proxy's published address ranges: a " +
        "client that reaches nginx directly writes that entry itself and is never limited. Otherwise use 1, " +
        "with nginx taking the client address from the outer proxy (see the rate-limit checklist in docs/DEPLOY.md).",
    );
  }
  fail(NAME, `${show(v)}: must be a whole number from 1 to 5. The app ignores anything else and assumes 1.`);
}

function isInside(child, parent) {
  const rel = path.relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

function fsReason(err) {
  switch (err?.code) {
    case "EACCES":
    case "EPERM":
      return "permission denied for this user";
    case "EROFS":
      return "the file system is read-only";
    case "ENOTDIR":
      return "part of the path is a file, not a folder";
    default:
      return err?.code ?? String(err?.message ?? err);
  }
}

/** Can the app keep its JSON files here? Leaves nothing behind. */
function probeDir(dir) {
  let created;
  try {
    if (existsSync(dir)) {
      if (!statSync(dir).isDirectory()) return { ok: false, why: "exists but is not a folder" };
    } else {
      created = mkdirSync(dir, { recursive: true });
    }
    accessSync(dir, constants.R_OK | constants.W_OK);
    const file = path.join(dir, `.preflight-${process.pid}-${Date.now()}.tmp`);
    writeFileSync(file, "preflight write test\n", { flag: "wx" });
    unlinkSync(file);
    return { ok: true, created: Boolean(created) };
  } catch (err) {
    return { ok: false, why: fsReason(err) };
  } finally {
    // Remove only the folders this check made, deepest first; rmdir refuses
    // anything that is not empty.
    if (created) {
      for (let d = dir; ; d = path.dirname(d)) {
        try {
          rmdirSync(d);
        } catch {
          break;
        }
        if (d === created || path.dirname(d) === d) break;
      }
    }
  }
}

/** Mirrors lib/json-store.ts: DATA_DIR ?? <working directory>/data. */
function checkDataDir() {
  const NAME = "DATA_DIR";
  const raw = process.env.DATA_DIR;
  if (raw === "") {
    return fail(NAME, "Set but empty: data files would be written straight into the server's working directory. Set an absolute path.");
  }
  const dir = path.resolve(raw ?? "data");
  const probe = probeDir(dir);
  if (!probe.ok) return fail(NAME, `${dir}: ${probe.why}. The app could not save quotes, enquiries or settings there.`);
  const state = probe.created
    ? "does not exist yet, can be created (the app creates it on first write) and is writable"
    : "exists and is writable";
  const notes = [];
  if (raw === undefined) {
    notes.push(
      "Not set, so the app uses ./data in its working directory; the standalone server.js runs from " +
        ".next/standalone, which next build replaces. Set an absolute, backed-up path outside the app folder.",
    );
  } else if (!path.isAbsolute(raw)) {
    notes.push(
      `Relative: resolved here against ${process.cwd()}, but the standalone server.js resolves it against ` +
        ".next/standalone, inside the build output. Use an absolute path.",
    );
  }
  if (dir.split(path.sep).includes(".next")) {
    notes.push("It is inside the .next build output, which next build replaces, and the data would go with it.");
  } else if (!notes.length && isInside(dir, APP_ROOT)) {
    notes.push(`It is inside the app folder (${APP_ROOT}). Use a persistent, backed-up path outside the deploy directory.`);
  }
  const detail = `${dir} ${state}.${notes.length ? ` ${notes.join(" ")}` : ""}`;
  if (notes.length) warn(NAME, detail);
  else pass(NAME, detail);
}

checkNode();
checkEnvFiles();
checkNodeEnv();
checkSessionSecret();
checkAdminHash();
checkWholesale();
checkMail();
checkCustomerAck();
checkSiteUrl();
checkTrustProxy();
checkDataDir();

function wrap(text, width) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (!word) continue;
    if (line && line.length + 1 + word.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

const ESC = String.fromCharCode(27);
const colour = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
const TONE = { PASS: "32", WARN: "33", FAIL: "31" };
const paint = (text, status) => (colour ? `${ESC}[${TONE[status]}m${text}${ESC}[0m` : text);

const STATUS_W = 8;
const CHECK_W = Math.max(...rows.map((r) => r.check.length)) + 2;
const total = Math.min(Math.max(process.stdout.columns || 100, 80), 120);
const DETAIL_W = Math.max(40, total - STATUS_W - CHECK_W);

console.log("Atlantic Gems launch preflight");
console.log(
  ENV_FILES.length
    ? `Environment: this process, plus ${ENV_FILES.join(", ")} loaded by node --env-file.`
    : "Environment: this process only (no node --env-file).",
);
console.log("");
console.log(`${"STATUS".padEnd(STATUS_W)}${"CHECK".padEnd(CHECK_W)}DETAIL`);
for (const row of rows) {
  const [first, ...rest] = wrap(row.detail, DETAIL_W);
  console.log(`${paint(row.status.padEnd(STATUS_W), row.status)}${row.check.padEnd(CHECK_W)}${first}`);
  for (const line of rest) console.log(`${" ".repeat(STATUS_W + CHECK_W)}${line}`);
}

const count = (status) => rows.filter((r) => r.status === status).length;
const fails = count("FAIL");
const warns = count("WARN");
console.log("");
console.log(`${fails} FAIL, ${warns} WARN, ${count("PASS")} PASS.`);
if (fails) console.log("Not ready: fix every FAIL, then run the preflight again.");
else if (warns) console.log("No FAIL. Read each WARN and confirm it is intended before launch.");
else console.log("Ready: every check passed.");
process.exitCode = fails ? 1 : 0;
