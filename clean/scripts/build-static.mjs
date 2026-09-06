/**
 * Builds a static export of the public site for GitHub Pages.
 *
 * The server build (middleware, API routes, gated trade area, nonce CSP) is
 * left untouched. This script assembles a copy of the app in .static-build/,
 * applies static-overlay/ on top, removes server-only files, and runs
 * `next build` with STATIC_EXPORT=1. Output lands in .static-build/out.
 *
 * Usage (from clean/):
 *   node scripts/build-static.mjs            # basePath /Atlantic-Gems (project pages)
 *   STATIC_BASE_PATH= node scripts/build-static.mjs   # custom domain, no basePath
 */
import { cpSync, existsSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const build = join(root, ".static-build");
const basePath = process.env.STATIC_BASE_PATH ?? "/Atlantic-Gems";

rmSync(build, { recursive: true, force: true });
mkdirSync(build);

for (const dir of ["app", "components", "lib", "public"]) {
  cpSync(join(root, dir), join(build, dir), { recursive: true });
}
for (const file of ["package.json", "tsconfig.json", "next.config.ts", "eslint.config.mjs"]) {
  cpSync(join(root, file), join(build, file));
}
if (existsSync(join(root, "next-env.d.ts"))) {
  cpSync(join(root, "next-env.d.ts"), join(build, "next-env.d.ts"));
}
symlinkSync(join(root, "node_modules"), join(build, "node_modules"), "junction");

// Static-only variants replace their server counterparts.
cpSync(join(root, "static-overlay"), build, { recursive: true });

// Server-only files cannot exist in a static export.
for (const p of ["middleware.ts", "app/api", "app/admin", "app/wholesale/login", "app/wholesale/item", "app/inventory/[id]"]) {
  rmSync(join(build, p), { recursive: true, force: true });
}

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(npx, ["next", "build"], {
  cwd: build,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, STATIC_EXPORT: "1", STATIC_BASE_PATH: basePath },
});
if (result.status !== 0) process.exit(result.status ?? 1);

// GitHub Pages must serve the _next/ directory as-is.
writeFileSync(join(build, "out", ".nojekyll"), "");
console.log(`\nStatic export ready: ${join(build, "out")} (basePath "${basePath}")`);
