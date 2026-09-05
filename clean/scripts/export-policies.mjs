/**
 * Exports the policy documents in lib/policies.json to /package/policies as
 * customer-facing Markdown, so the website and the packaged documents never
 * drift apart. Run from clean/: node scripts/export-policies.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const policies = JSON.parse(readFileSync(join(here, "..", "lib", "policies.json"), "utf8"));
const outDir = join(here, "..", "..", "package", "policies");
mkdirSync(outDir, { recursive: true });

const LEGAL = "ATLANTIC GEMS (Registration No. 4699451)";
const EFFECTIVE = "5 September 2026";

for (const policy of Object.values(policies)) {
  const lines = [
    `# ${policy.title}`,
    "",
    `**Atlantic Gems** · ${LEGAL} · Effective ${EFFECTIVE}`,
    "",
    policy.summary,
    "",
  ];
  for (const s of policy.sections) {
    lines.push(`## ${s.heading}`, "");
    for (const p of s.paragraphs) lines.push(p, "");
  }
  lines.push("---", "", "Atlantic Gems · Halifax, Nova Scotia · support@atlanticgems.ca", "");
  const file = join(outDir, `${policy.slug}.md`);
  writeFileSync(file, lines.join("\n"), "utf8");
  console.log("wrote", file);
}
