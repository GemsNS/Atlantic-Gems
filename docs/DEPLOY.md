# Deploying the Atlantic Gems site

The app is a Next.js 15 application in `clean/` built with `output: "standalone"`. It runs on any Node 20+ host behind a TLS-terminating reverse proxy. Vercel can build it, but see the note there about the data store.

## Environment variables

`clean/.env.example` lists every variable with comments. On the server, keep the values in one file outside the repository and have the process manager load it (see "Node server" below). For local development, copy it to `clean/.env.local` and delete its `DATA_DIR` line, so the app uses `clean/data/`.

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | yes | Public origin with no path and no trailing slash, e.g. `https://atlanticgems.ca`. Used for CSRF origin checks, metadata and the sitemap. `NEXT_PUBLIC_` values are fixed into the build, so it must also be set when `npm run build` runs. |
| `SESSION_SECRET` | yes | At least 32 characters; this prints 64 hex characters: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Signs the quote tray and the admin and trade sessions. In production without it the quote tray is switched off, and admin and trade sign-in answer with a configuration error. |
| `ADMIN_PASSWORD_HASH` | yes (admin) | From `node scripts/hash-password.mjs`; see "The admin password hash" below. |
| `ADMIN_SESSION_HOURS` | no | Default 8. |
| `WHOLESALE_PASSWORD_SHA256` | yes (trade area) | SHA-256 hex of the trade passphrase. `node -e "console.log(require('crypto').createHash('sha256').update('PHRASE').digest('hex'))"`. Needed whenever the trade page is on, which every site-mode preset does. |
| `WHOLESALE_SESSION_HOURS` | no | Default 12. |
| `DATA_DIR` | yes | Absolute path to a persistent, backed-up folder outside the deploy directory, e.g. `/var/lib/atlantic-gems`. See "Data directory". |
| `RESEND_API_KEY`, `CONTACT_FROM`, `CONTACT_TO` | one delivery option | Email delivery for enquiries and quote requests. The `CONTACT_FROM` domain must be verified in Resend. |
| `CONTACT_WEBHOOK_URL` | one delivery option | Alternative: HTTPS JSON webhook (CRM, automation). Not used while `RESEND_API_KEY` is set. |
| `CUSTOMER_ACK_EMAIL` | no | Default `false`. Keep it off until the client approves the wording; see "Customer acknowledgements" below. |
| `TRUST_PROXY` | when behind a proxy | Set `true` only if the app is reachable solely through a proxy that *appends* the connecting address to `X-Forwarded-For` (nginx `$proxy_add_x_forwarded_for`, Caddy, Vercel). The app uses only the right-most entry; everything to its left is written by the client. Enables per-IP rate limits. |
| `TRUST_PROXY_HOPS` | no | Default 1. The number of trusted proxies that each append an entry, for example 2 for Cloudflare in front of nginx. More than 1 is safe only while the origin (nginx) accepts connections solely from the outer proxy's published address ranges: a client that reaches nginx directly writes the entry the app reads, and is never limited. Otherwise keep 1 and have nginx take the client address from the outer proxy (`set_real_ip_from` with the outer proxy's ranges and `real_ip_header`, for Cloudflare `CF-Connecting-IP`). With more than 1 the app ignores `X-Real-IP`. The preflight WARNs for any value above 1. |
| `PORT`, `HOSTNAME` | yes (Node server) | `3000` and `127.0.0.1`. `server.js` reads them before any `.env` file is loaded, so the process manager must set them. |

If neither delivery option is set, quote requests are still saved under Admin → Quotes and enquiries under Admin → Pipeline, but nobody is emailed about them, and the launch preflight fails. A customer sees an error with the support email only when an enquiry could not be saved or sent anywhere, or a quote request could not be saved.

**The admin password hash.** Run `node scripts/hash-password.mjs` in `clean/`. It asks for the password (12 to 256 characters; `/admin/login` refuses longer ones). Nothing is shown as you type; Backspace works, Ctrl+C cancels, and an arrow, Home, Delete or function key stops it (run it again and type only the password). Without a terminal (piped input, `ssh` without `-t`, `docker exec` without `-t`) it prompts on stderr, shows what you type, and reads the first line. It prints two lines:

- The first is for PM2, systemd or the `/etc/atlantic-gems/production.env` file below. Use it exactly as printed; on a shell command line, single-quote it. Never use the `\$` form in that file: Node's `--env-file` (PM2) keeps the backslashes and every admin sign-in fails; systemd's `EnvironmentFile` removes them from an unquoted value, but the preflight reads the file with `--env-file` and FAILs it either way.
- The second is for a `.env` file Next.js reads (`.env`, `.env.local`, `.env.production` in `clean/`, or the copies `next build` puts in `.next/standalone/`), with each `$` written `\$`. Next expands `$NAME` in those files and turns `\$` back into `$`. Pasted there in the first form, the hash arrives as `scrypt6384` and every admin sign-in fails. A file with one of those names anywhere else is not read by Next, so it takes the first form.

Set `ADMIN_PASSWORD_HASH` in one place only. If the process manager sets it and a `.env` file Next reads also names it, Next expands the process manager's value too, and the hash arrives broken in the same way.

**Customer acknowledgements.** `CUSTOMER_ACK_EMAIL=true` emails the customer after a quote request or an enquiry. The code is built and off by default: keep it `false` until the client approves the wording in `clean/lib/mail.ts` (`deliverQuoteAcknowledgement`, `deliverEnquiryAcknowledgement`). Only the exact value `true` turns it on. It sends through Resend only, so it also needs `RESEND_API_KEY`; with only a webhook set, no acknowledgement is sent. It goes out once the quote is saved, or once the enquiry is held in the CRM or the house inbox, and never for a honeypot hit. It is sent from `CONTACT_FROM`, and replies go to `CONTACT_TO` (or the support address in `lib/site.ts`). A failure is logged and does not change what the customer sees. Anyone who loads the site can make it send an acknowledgement to any address, so the message echoes nothing the sender typed (the greeting is a fixed "Hello,"; the quote version lists the catalogue lines), each address gets at most one acknowledgement a day, and the site sends at most 50 an hour in all. These limits live in the server's memory (`lib/mail.ts`), apply on top of the per-client form limits, and reset on a restart; over them the acknowledgement is skipped without telling the customer.

Rotate `SESSION_SECRET` and the trade passphrase if either is ever pasted into chat, logs or a ticket.

## Node server (PM2 or systemd, behind nginx or Caddy)

How the standalone server gets its settings: `.next/standalone/server.js` sets `NODE_ENV=production`, changes into `.next/standalone`, and reads `PORT` and `HOSTNAME` from the process environment. Only after that does Next load `.env` files, and only from `.next/standalone`, where `next build` copies `clean/.env` and `clean/.env.production` and nothing else. So `clean/.env.local` and `clean/.env.production.local` never reach this server. `next build` and `next start`, run from `clean/`, do read both (`next dev` reads `.env.local`), so a `NEXT_PUBLIC_SITE_URL` in either is still fixed into the build. The repository has no PM2 ecosystem file.

The dependable way is to keep every value in one file outside the repository, `/etc/atlantic-gems/production.env` below, readable only by root and the user the server runs as (`<app user>` below), and have the process manager load it. Write plain `KEY=value` lines, starting from `.env.example`, with `ADMIN_PASSWORD_HASH` in the first form `hash-password.mjs` prints (plain `$`).

Deploy a commit whose CI run is green: `.github/workflows/ci.yml` runs the checks in `docs/CI.md` on every push to `main` and every pull request. The live `PRIVATE_STRINGS` scan and the performance budget are still run by hand. CI tests `next start`, not `.next/standalone/server.js`, and does not copy `public/` or `.next/static` as the steps below do, so after deploying run the post-deploy checks against the standalone server.

```bash
# on the server, first time (as root)
git clone https://github.com/GemsNS/Atlantic-Gems.git /var/www/atlantic-gems
mkdir -p /var/lib/atlantic-gems /etc/atlantic-gems
chown <app user> /var/lib/atlantic-gems                         # DATA_DIR: the server writes here
cp /var/www/atlantic-gems/clean/.env.example /etc/atlantic-gems/production.env
nano /etc/atlantic-gems/production.env                          # fill in; add PORT=3000 and HOSTNAME=127.0.0.1
chown root:<app user> /etc/atlantic-gems/production.env && chmod 640 /etc/atlantic-gems/production.env

# each deploy
cd /var/www/atlantic-gems && git pull --ff-only origin main
cd clean
npm ci
NEXT_PUBLIC_SITE_URL=https://atlanticgems.ca npm run build      # NEXT_PUBLIC_ values are fixed at build time
# standalone output needs static assets and public/ alongside it
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
pm2 restart atlantic-gems                                       # as <app user>; or: systemctl restart atlantic-gems
```

With PM2, start the server once as `<app user>` and save the process list. PM2 keeps a separate process list for each user, so run every `pm2` command, including the restart above, as `<app user>`:

```bash
cd /var/www/atlantic-gems/clean
pm2 start .next/standalone/server.js --name atlantic-gems \
  --node-args="--env-file=/etc/atlantic-gems/production.env"
pm2 save
pm2 startup                                                     # prints a command to run as root so PM2 starts at boot
```

Node (20.6 or later) loads the file each time the process starts, so `pm2 restart` picks up an edit. Node never replaces a variable that is already set, so run `pm2 start` from a shell that does not export any of these names. `HOSTNAME` is the usual one: some login shells export the machine's name, and the server would then listen on that address instead of `127.0.0.1`. A PM2 ecosystem file with the values in an `env` block also works, but the preflight cannot load that file, so the same values would have to be exported by hand to check them. With `--env-file`, the server and the preflight read the same file.

With systemd, which starts the service with a clean environment:

```ini
# /etc/systemd/system/atlantic-gems.service
[Unit]
Description=Atlantic Gems site
After=network.target

[Service]
User=<app user>
EnvironmentFile=/etc/atlantic-gems/production.env
WorkingDirectory=/var/www/atlantic-gems/clean/.next/standalone
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then `systemctl daemon-reload && systemctl enable --now atlantic-gems`. Use the path `command -v node` prints in `ExecStart`.

The alternative is `clean/.env.production` (the root `.gitignore` ignores `.env` and `.env.*`). `next build` reads it, so it also gives the build `NEXT_PUBLIC_SITE_URL`, and copies it next to `server.js`. In that file write each `$` of the admin hash as `\$`. An edit takes effect only after the next build, or after copying the file into `.next/standalone/` again, and a restart. `PORT` and `HOSTNAME` still have to come from the process manager.

Set each variable in one place only: the process manager's file, or `clean/.env.production`, not both.

Proxy `https://atlanticgems.ca` to `127.0.0.1:3000`. The proxy must terminate TLS, forward `Host`, and append the client address to `X-Forwarded-For`; then set `TRUST_PROXY=true`. Bind the app to `127.0.0.1` (`HOSTNAME` above) so nothing can reach it without going through the proxy: a client talking to port 3000 directly could write its own header. `ss -ltnp | grep 3000` should show it listening on `127.0.0.1:3000` only.

Minimal nginx location block:

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-Real-IP $remote_addr;
}
```

`X-Real-IP` is set here so a client can never pass its own through. The app's redirects after a form post (add to tray, sign-in, every admin action) carry a relative `Location` such as `/cart`, so no proxy rewriting is needed; the post-deploy checks below confirm it.

Performance: serve HTTP/2 to visitors. The performance lab measured plain `next start`, which speaks HTTP/1.1, and lists HTTP/2 through the proxy as a step that has not been measured yet (`docs/evidence/lighthouse-2026-09-21-perf.md`). In nginx that is `http2 on;` in the TLS `server` block (nginx 1.25.1 and later; older versions use `listen 443 ssl http2;`). Caddy serves HTTP/2 over HTTPS by default. The app already gzips its own responses (Next's `compress` option is on by default, and `next.config.ts` leaves it on), so the proxy does not need to add compression for them. If the brand mark is replaced, keep `app/icon.jpg` small: it is a 64 px copy of `public/brand/mark.jpg` (1.8 KB), because the browser fetches the favicon during the first load and the lab counts it towards LCP (the 1000 px file added about 0.3 s). The home-screen icon is `app/apple-icon.jpg`, a 180 px copy, which browsers fetch only when a visitor saves the site to a phone's home screen.

## Vercel

Set the root directory to `clean/`, add the environment variables above, and deploy from `main`. Rate limiting is per serverless instance on Vercel; move the limiter store to a shared store (Redis/KV) if abuse becomes a concern. The data store is the larger problem: it writes JSON files to `DATA_DIR` on local disk, and Vercel functions have no persistent, shared disk, so quotes, enquiries, settings and admin edits would not be kept. Use a Node host until storage moves to a database (see "Data directory").

## Rate-limit checklist (S9)

Without `TRUST_PROXY=true`, every visitor shares one rate-limit bucket per form. Five quote requests in ten minutes from anyone then block quotes for everyone, and five trade sign-in attempts in fifteen minutes lock out every trade customer. Before launch:

1. Confirm that the proxy appends to `X-Forwarded-For` rather than passing the client value through untouched. The nginx block above does this.
2. Set `TRUST_PROXY=true`, plus `TRUST_PROXY_HOPS` if there is more than one proxy, and restart. With more than one (Cloudflare in front of nginx, say), first make the origin accept connections only from the outer proxy's published address ranges; see `TRUST_PROXY_HOPS` above.
3. On staging, send six valid contact enquiries from one machine with a different made-up left-hand entry each time, for example `-H "X-Forwarded-For: 198.51.100.$i"`. The sixth must get 429: the made-up entry is ignored and the real address is limited.
4. From a second machine or network, one enquiry must still succeed. That shows the buckets are per address, not shared.
5. Confirm that port 3000 is not reachable from outside the host.
6. With an outer proxy, repeat step 3 against the origin's own address (bypassing the outer proxy, with `--resolve` and the origin IP). The request must be refused, or the sixth must still get 429.

An IPv6 client is limited by its /64 network, not its full address, because one host or line is usually given a whole /64 and could otherwise take a new address for every request. IPv4-mapped IPv6 addresses count as the IPv4 address. Admin sign-in also runs at most two password checks at a time in each process; a third at the same moment is answered like the rate limit.

## Launch preflight

Run the preflight before launch and after any change to the server's environment. Run it from `clean/`, as the user the server runs as, with the environment the server gets:

```bash
cd /var/www/atlantic-gems/clean
NODE_ENV=production node --env-file=/etc/atlantic-gems/production.env scripts/preflight.mjs   # the file the server loads
NODE_ENV=production node --env-file=.env.production scripts/preflight.mjs                    # values in clean/.env.production
NODE_ENV=production npm run preflight                                                        # values exported in this shell
```

`--env-file` is Node's own option (Node 20.6 or later), so it goes before the script name; `npm run preflight -- --env-file=…` does not work, and the script says so. `NODE_ENV=production` matches the server, which sets it itself.

The preflight prints PASS, WARN or FAIL for each setting the launch depends on. It never prints a secret value.

- `SESSION_SECRET`: set, and at least 32 characters.
- `ADMIN_PASSWORD_HASH`: in the format `/admin/login` accepts, with scrypt parameters Node takes, and with its `$` signs written the right way for where it came from (see "The admin password hash"). A FAIL for `\$` anywhere but a `.env` file Next.js reads (by name, in `clean/` or `.next/standalone/`), including `/etc/atlantic-gems/production.env`; a FAIL for plain `$` in a file Next.js reads.
- `WHOLESALE_PASSWORD_SHA256`: 64 hex characters. When it is not set, the preflight reads `DATA_DIR/settings.json`. It FAILs if the trade page is on (every site-mode preset, or custom mode with Trade / wholesale on), PASSes if custom mode has it off, and WARNs if the file is missing or cannot be used, because the app then runs on its defaults, which turn the trade page on. A fresh install has no `settings.json` until the first settings save, so that WARN still means `/wholesale/login` will not work: set the hash, or switch Trade / wholesale off at `/admin/site`.
- The mail route: Resend, with `CONTACT_FROM` and `CONTACT_TO` checked separately, or an `https` webhook. If neither is set, the check FAILs: quote requests and enquiries are then only saved in the admin area, and nobody is emailed.
- `CUSTOMER_ACK_EMAIL`: a WARN when it is `true`, as a reminder that the client must approve the wording, and a WARN for any value other than `true` or `false`, which leaves it off.
- `NEXT_PUBLIC_SITE_URL`: a bare `https` origin.
- `TRUST_PROXY`: a FAIL when unset or anything other than `true` or `false`, a WARN when `false`. With `true`, `TRUST_PROXY_HOPS` must be 1 to 5, and a value above 1 is a WARN, as a reminder that the origin must accept only the outer proxy.
- `DATA_DIR`: it writes and removes a test file, creating the folder if needed and removing only folders it created. A FAIL when it cannot write there, or when `DATA_DIR` is set but empty; a WARN when it is unset, relative, or inside the app folder or `.next`.
- `NODE_ENV`, the Node version (20 or later), and a WARN when a `.local` file was loaded, since the standalone server never reads one.

Exit codes: 0 when nothing FAILs (WARNs allowed), 1 when anything FAILs, 2 for a usage error (an `--env-file` after the script name, or an unknown argument). If the file named by `--env-file` does not exist, Node stops with its own error (exit 9 on Node 24) before the script runs. Fix every FAIL, then read each WARN and confirm it is intended.

## Post-deploy checks

```bash
curl -sI https://atlanticgems.ca | grep -iE "content-security-policy|strict-transport|x-frame|x-content-type"
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://atlanticgems.ca/wholesale   # expect 307 to /wholesale/login
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" -X POST https://atlanticgems.ca/api/cart/clear
                                    # expect 303 to https://atlanticgems.ca/cart?error=...; never localhost, 127.0.0.1 or :3000
curl -s -w " %{http_code}\n" https://atlanticgems.ca/api/health             # {"ok":true} 200
curl -s -w " %{http_code}\n" "https://atlanticgems.ca/api/health?deep=1"    # {"ok":true} 200
SCAN_BASE_URL=https://atlanticgems.ca npm run scan                                            # from clean/
```

**Health endpoint.** `GET /api/health` answers `{"ok":true}` with 200, or `{"ok":false}` with 503, and nothing else unless the request carries an admin session.

- Plain `/api/health` is readiness: `DATA_DIR` can be created, read and written. Point a proxy or a process health check here. A single broken data file does not fail it, so it never takes the only instance out of rotation.
- `/api/health?deep=1` also reads `parts.json`, `inventory.json` and the four CRM files the way the site does, and answers 503 if any of them is there but unusable (not JSON, the wrong shape, unreadable). A missing file is an empty store and passes. Point the uptime monitor here: `/parts`, `/cart` and the collection stream their data, so a broken file shows the error page with status 200, and only this check turns it into a 503. The result is cached for 30 seconds.
- Signed in as an admin, either form also returns `checks` (storage, data, mail, session secret) and `files`, each data file by its name in `DATA_DIR` with `ok`, `missing` or the read error code. A broken `settings.json` shows there but does not fail the deep check, because the site keeps running on the default settings.

## Domain

`atlanticgems.ca` currently points at a placeholder holding page. Repoint DNS (A/AAAA or CNAME) to the new host once the post-deploy checks pass on a staging hostname.

## GitHub Pages (static preview)

GitHub Pages is static hosting. It cannot run middleware, API routes, the
passphrase-gated trade area or the per-request CSP nonce. The static build
therefore ships the public site only, with these substitutions:

| Server build | Static (Pages) build |
|---|---|
| Contact form posts to `/api/contact` with CSRF and rate limiting | Form composes an email in the visitor's mail app (`ContactFormStatic`) |
| `/wholesale` gated by passphrase, `/wholesale/login` | `/wholesale` is a "request trade access" page; login route removed |
| Nonce CSP and security headers from middleware | Meta CSP (`'unsafe-inline'` scripts); Pages sets no custom headers |
| Indexable, sitemap listed | `noindex` and `robots.txt` disallow all until the real domain is used |

Static variants live in `clean/static-overlay/` and replace their server
counterparts only inside the static build. Build and publish:

```bash
cd clean
npm run build:static                 # writes clean/.static-build/out (basePath /Atlantic-Gems)
# publish the out/ folder to the gh-pages branch
cd ..
git worktree add --detach .gh-pages-wt
cd .gh-pages-wt
git checkout --orphan gh-pages 2>/dev/null || git checkout gh-pages
git rm -rfq . 2>/dev/null; rm -rf ./*
cp -r ../clean/.static-build/out/. .
git add -A && git commit -m "Static preview build" && git push -f origin gh-pages
cd .. && git worktree remove --force .gh-pages-wt
```

Then in GitHub: Settings → Pages → Source "Deploy from a branch" → `gh-pages` / `/ (root)`.
The preview URL is `https://gemsns.github.io/Atlantic-Gems/`.

Notes:
- The repository is private. GitHub Pages on a private repository requires a paid GitHub plan; on a free plan the repository must be public for Pages to publish. The repository contains no private client data (the address is deliberately excluded), so making it public is safe, but it is the client's decision.
- For a custom domain on Pages, rebuild with `STATIC_BASE_PATH= npm run build:static` and add a `CNAME` file to `out/`.
- Force-pushing `gh-pages` is expected: it is a generated artifact branch, not source. `main` is never force-pushed.

## Inventory system

Items live in `DATA_DIR/inventory.json`; settings (site mode, pages, shop open/closed, eBay) in
`DATA_DIR/settings.json`; uploaded photographs in `DATA_DIR/uploads/`. See "Data directory" for
where `DATA_DIR` must live. The default shop state is **closed**: the public collection page shows
a "being prepared" notice and the Collection link is hidden until an admin opens the shop.

Admin area: `/admin` (sign in at `/admin/login`). Set `ADMIN_PASSWORD_HASH` with the command
below; it prints two forms, described under "The admin password hash".

```bash
cd clean && node scripts/hash-password.mjs
```

Admin sessions are HMAC-signed HttpOnly cookies (8 hours by default). Admin sessions also grant
access to the trade area. Trade sessions never grant admin access.

Item visibility: `public` (collection page when open), `trade` (gated trade area), `private`
(admin only). New manual items default to private.

eBay: create an application at developer.ebay.com and set `EBAY_CLIENT_ID`,
`EBAY_CLIENT_SECRET`, `EBAY_SELLER_USERNAME` (and `EBAY_MARKETPLACE_ID`, default `EBAY_CA`).
"Import from eBay now" on the admin dashboard pulls the seller's active listings in the Jewelry &
Watches category, upserts them as `source: ebay` items, and marks ended listings sold. Category,
metal, stones, description, disclosure and visibility set by hand are preserved across imports.

GitHub Pages build: the admin area, API routes and item pages are excluded; the collection page
shows the "being prepared" notice.

## Data directory

Everything the site saves lives in `DATA_DIR`: `inventory.json`, `settings.json`, `parts.json`,
the CRM files in `crm/` (`contacts.json`, `deals.json`, `quotes.json`, `tasks.json`) and uploaded
photographs in `uploads/`.

Use an absolute path to a persistent folder outside the deploy directory, such as
`/var/lib/atlantic-gems`, owned by the user the server runs as, and include it in backups. Without
`DATA_DIR` the app uses `data/` in its working directory, and a relative path is resolved against
that directory. The standalone server's working directory is `.next/standalone`, and `next build`
deletes everything in `.next` except `cache`, so data kept there goes with the next build.

**Writes and the lock.** Writes are serialised across processes on one host by a lock directory,
`DATA_DIR/.lock` (`lib/file-lock.ts`), on top of the in-process queue. A PM2 cluster, or the old and
new server overlapping during a deploy, can therefore share one `DATA_DIR` without losing writes,
as long as `DATA_DIR` is on that host's local disk. Reads take no lock: every write is an atomic
rename, so a read sees the old file or the new one.

- `.lock` exists only while a write is in progress. A lock left by a process that crashed on the
  same host is recovered at once, because its pid has gone. Otherwise (another host or container,
  or a reused pid) it is recovered once it is 30 s old.
- A process waiting for the lock keeps a `.lock.<token>.pending` directory. One killed while
  waiting leaves it behind, and a later write removes it once nothing in it has changed for 30 s
  (each process looks at most once every 30 s). `.lock.<token>.swept` is one caught mid-removal.
  These, and a stray `.lock` in a backup taken mid-write, are safe to delete when no server is
  running, for example when restoring to another host.
- A write that waits more than 10 s for the lock fails. Checkout then answers 503 with its usual
  message and the support email, and keeps the tray; it records the contact, the deal and the
  quote as one step under one lock, so a failure leaves none of them behind. The contact form logs
  `[contact] CRM write failed` and still emails the house.
- The quote is written first and is the commit point. If it is saved but the deal or the contact
  write after it fails (a full disk, a permission error on one file), the customer is told the
  request arrived and the house is emailed as usual, and the log has
  `[quote] deal/contact write failed for <quote id>: <file> (<code>)`, naming `deals.json` or
  `contacts.json` and the filesystem error (such as `ENOSPC` or `EACCES`); that quote's deal and
  contact links then point at nothing. Fix the cause; the quote itself is complete under
  Admin → Quotes.
- `.lock` must be a plain directory. If a symlink or junction, or a plain file, is ever found there,
  every write fails with an error naming it rather than following it; remove it by hand. Recovery
  of an abandoned lock deletes only plain files inside it, and a directory left inside keeps the
  lock stuck (writes time out) until someone removes it.
- Rate limits (`lib/security/rate-limit.ts`) are kept in each process's memory, not in `DATA_DIR`.
  With N processes every limit is N times higher: the contact limit of 5 enquiries per 10 minutes
  per client becomes 5N. Keep one instance unless that is acceptable.
- More than one host (two servers, or `DATA_DIR` on NFS or SMB) is not covered: the pid check only
  works on one host, and network filesystems do not guarantee an atomic rename. Move storage to
  SQLite or Postgres, and the rate limiter to a shared store (Redis or KV), before running on more
  than one host.

**Unreadable data files.** A missing file is an empty store, and a missing `settings.json` means the
default settings. A file that is there but cannot be read, is not JSON, or has the wrong shape (for
example `parts.json` holding `[]` or `null`, or a list file whose body is not `{ "items": [...] }`;
an empty `{}` reads as empty) is never taken as empty, and never overwritten. The server log has
one line, `[store] could not read <path> (<code>)`, at most once a minute for each file while it
stays broken. The code is the filesystem error (such as `EACCES` or `EISDIR`), `EJSON` or `ESHAPE`.
Each page render that fails on the file also logs the error itself: `StoreReadError` with the
path, the code, a stack trace and a digest (the number the error page shows). Neither line ever
quotes the file's contents.

The pages that stream their data (`/parts`, `/cart` and `/inventory`) still answer 200 when a
file is broken, because the status is sent before the data is read; the customer sees the error
page in place of the data. Pages that read before rendering (a tray or part page) answer 500. Monitor `/api/health?deep=1` (see "Post-deploy
checks") to catch it.

- Contacts, deals, quotes, tasks, inventory and parts refuse every write until the file is fixed.
  - A CRM file: checkout answers 503 with the support email and keeps the tray. The contact form
    still emails the house; if that email cannot go either (no mail route set, or the provider
    fails), the customer gets the error with the support email.
  - `inventory.json`: the collection pages show the error page, which offers a retry and the
    support email.
  - `parts.json`: `/parts`, the part pages and `/cart` show the error page. From a page loaded
    before the file broke, adding a line or sending the tray answers with the store message and
    the support email (`/cart?error=store`, or 503 `store` to the enhanced form), and the tray is
    kept. The header shows the Cart link with no count rather than failing.
  - In the admin area, pages that read the file show the error page. That includes the page you
    land on after changing a quote's status with a broken `quotes.json`, or retiring the demo
    lines with a broken `parts.json`, because both pages read the same file; nothing was changed.
    (When the file can be read but a write fails, such as a lock timeout or a full disk, the quote
    page says "The quotes file could not be updated", and `/admin/parts` says that none, or how
    many, were retired.) An eBay import says the sync failed, and the server log has the reason.
    Other admin saves to a broken file (a pipeline stage, a follow-up task, refreshing follow-ups,
    adding, editing or deleting a collection item) fail with a bare server error.
- An unreadable `settings.json` makes the site run on the default settings (parts-supplier mode,
  shop closed). When the file itself is wrong (not JSON, the wrong shape, or a directory in its
  place), the next settings save (an admin setting, or an eBay import) moves it aside as
  `settings.json.corrupt-<time>` and writes a new one from the defaults plus that change. Inspect
  the moved file, then delete it. Any other read error (a permission error, or a busy or
  temporarily unreadable file) says nothing about its contents, so the save is refused with a
  server error and the file is left as it is: fix the cause, then save again.
- An eBay import writes back only its own two fields (`lastImport`, `lastResult`), so an admin
  change to the eBay settings made while an import runs is kept.
- Restore a file from backup, or fix its permissions or its JSON, and the site picks it up on the
  next request; no restart is needed.

## Parts catalogue and the demo lines

On first run the app writes the demo catalogue from `lib/parts/seed.ts` to `DATA_DIR/parts.json`:
placeholder SKUs, brands and prices, each line saved with `"demo": true` and marked "Demo" on the
public counter. Demo lines are flagged wherever a quote carries them. Each quote line stores
`demo`; the house email marks each demo line and adds a sentence saying the marked prices are
placeholders; the webhook payload carries `lines[].demo`; and Admin → Quotes marks them on the list
and the detail page. `/cart` adds a note under the subtotal when the tray holds a priced demo line.

To retire the demo catalogue, sign in, open `/admin/parts`, tick "I understand the demo lines will
be removed from the public counter" and press the Retire button, which shows the number of demo
lines. The form posts to `/api/admin/parts/retire-demo`, which needs an admin session and the CSRF
token, and refuses the request unless the box was ticked. It deletes every part with
`"demo": true`, one write per line; if a write fails partway, the message says how many were
retired, and pressing the button again retires the rest. The file keeps `"seeded": true`, so the
seed catalogue is not written back, even when nothing is left: `/parts` then says nothing is listed
and links to `/contact`. Quotes already received keep their lines, and a customer's tray lists a
retired line as no longer on the counter.

A line counts as demo unless it is saved with `"demo": false` (the schema default is `true`), so a
line added to `parts.json` by hand without that field is deleted by the Retire button.

By hand, when nobody is using the admin area (the lock does not cover an editor), set
`DATA_DIR/parts.json` to `{ "seeded": true, "items": [] }`, or delete only the demo lines and keep
`"seeded": true`. The change shows on the next request. A file saved with a byte order mark
(Windows Notepad) is read normally. A line that fails validation is not shown, and is dropped the
next time the file is written, so check that a hand-edited line appears on `/admin/parts`. How the
file is read:

- No `parts.json`: a first run; the demo lines are written with new ids.
- `"seeded": true`: the catalogue as it stands, empty or not.
- No flag and no lines (`{}` or `{ "items": [] }`): also a first run, so it is reseeded.
- No flag but still some lines: refused as unreadable (see "Data directory") rather than
  overwritten by the demo seed. Keep `"seeded": true` when editing by hand.

`npm run smoke` needs at least one public part on the server it is pointed at, and writes a real
quote, so point it at a server with a scratch `DATA_DIR`, which seeds the demo lines, not at the
live data. `npm run test:e2e` starts its own server on a fresh scratch `DATA_DIR` (unless
`E2E_DATA_DIR` is set), so retiring the live demo lines does not affect it.
