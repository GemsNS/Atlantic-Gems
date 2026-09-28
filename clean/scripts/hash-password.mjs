/**
 * Produces an ADMIN_PASSWORD_HASH value for the server environment.
 * Usage: node scripts/hash-password.mjs
 * The password is read from stdin so it never appears in shell history, and
 * in a terminal it is not echoed, so it never sits in scrollback, a tmux or
 * screen log, or a session recording. Without a terminal (piped input, SSH
 * without -t, docker exec without -t) it shows what is typed and reads the
 * first line. Either way the prompt goes to stderr and stdout carries only
 * the two ADMIN_PASSWORD_HASH blocks, so output redirected to a file still
 * shows the prompt on screen and holds nothing else.
 *
 * Two forms are printed. A process manager (PM2, systemd) passes the value
 * through as printed. The .env files Next.js reads expand $NAME, which would
 * strip the $ separators out of the hash, so there each $ is written \$ and
 * Next's loader turns it back into $. Set it in one place only: when one of
 * those files also names ADMIN_PASSWORD_HASH, Next expands the process
 * manager's value as well and the hash arrives broken.
 */
import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline";

/** /admin/login refuses anything longer (app/api/admin/login/route.ts). */
const MAX_LENGTH = 256;
const MIN_LENGTH = 12;

/**
 * Reads one line from a terminal with echo off; Backspace edits, Ctrl+C quits.
 * Arrow, Home, Delete and function keys arrive as escape sequences that would
 * end up in the password unseen, so the first one stops the script instead.
 */
function readHidden(prompt) {
  return new Promise((resolve) => {
    const { stdin, stderr } = process;
    stderr.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const done = (result) => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      stdin.removeListener("end", onEnd);
      stderr.write("\n");
      resolve(result);
    };
    // The terminal closed mid-entry: settle with what was typed.
    const onEnd = () => done(value);
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n" || ch === "\u0004") return done(value);
        if (ch === "\u0003") {
          stdin.setRawMode(false);
          stderr.write("\n");
          process.exit(130);
        }
        if (ch === "\u001b") {
          stdin.setRawMode(false);
          stderr.write("\n");
          console.error("Arrow and function keys are not supported here; run again and type only the password.");
          process.exit(1);
        }
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1);
        else if (ch >= " ") value += ch;
      }
    };
    stdin.on("data", onData);
    stdin.once("end", onEnd);
  });
}

/**
 * No terminal (a pipe, or SSH without -t): the first line, without its line
 * ending, returned as soon as it arrives, so an open pipe does not hang.
 */
function readPiped() {
  process.stderr.write("Admin password (input is visible): ");
  const rl = createInterface({ input: process.stdin, terminal: false });
  return new Promise((resolve) => {
    rl.once("line", (line) => {
      // Before close(), which emits "close" at once.
      resolve(line);
      rl.close();
      // A pipe left open would otherwise keep the script running after it prints.
      process.stdin.destroy();
    });
    rl.once("close", () => resolve(""));
  });
}

const password = process.stdin.isTTY ? await readHidden("Admin password: ") : await readPiped();
if (!password || password.length < MIN_LENGTH) {
  console.error(`Use at least ${MIN_LENGTH} characters.`);
  process.exit(1);
}
if (password.length > MAX_LENGTH) {
  console.error(`Use ${MAX_LENGTH} characters or fewer; /admin/login refuses longer passwords.`);
  process.exit(1);
}
const N = 16384, r = 8, p = 1;
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64, { N, r, p });
const value = `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${hash.toString("hex")}`;
console.log("\nFor PM2 or systemd, exactly as printed (single-quote it in a shell):");
console.log(`ADMIN_PASSWORD_HASH=${value}`);
console.log("\nFor a .env file Next.js reads (.env, .env.local, .env.production), with each $ written \\$:");
console.log(`ADMIN_PASSWORD_HASH=${value.replaceAll("$", "\\$")}`);
