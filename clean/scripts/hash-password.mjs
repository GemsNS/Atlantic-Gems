/**
 * Produces an ADMIN_PASSWORD_HASH value for .env.local / the server environment.
 * Usage: node scripts/hash-password.mjs
 * The password is read from stdin so it never appears in shell history.
 */
import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline";

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
rl.question("Admin password: ", (password) => {
  rl.close();
  if (!password || password.length < 12) {
    console.error("\nUse at least 12 characters.");
    process.exit(1);
  }
  const N = 16384, r = 8, p = 1;
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, { N, r, p });
  console.log(`\nADMIN_PASSWORD_HASH=scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${hash.toString("hex")}`);
});
