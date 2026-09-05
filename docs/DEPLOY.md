# Deploying the Atlantic Gems site

The app is a Next.js 15 application in `clean/` built with `output: "standalone"`. It runs on any Node 20+ host behind a TLS-terminating reverse proxy, or on Vercel without changes.

## Environment variables

Copy `clean/.env.example` and set:

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | yes | Public origin, e.g. `https://atlanticgems.ca`. Used for CSRF origin checks and sitemap. |
| `SESSION_SECRET` | yes (trade area) | 64 hex chars. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `WHOLESALE_PASSWORD_SHA256` | yes (trade area) | SHA-256 hex of the trade passphrase. `node -e "console.log(require('crypto').createHash('sha256').update('PHRASE').digest('hex'))"` |
| `WHOLESALE_SESSION_HOURS` | no | Default 12. |
| `RESEND_API_KEY`, `CONTACT_FROM`, `CONTACT_TO` | one delivery option | Email delivery for enquiries. |
| `CONTACT_WEBHOOK_URL` | one delivery option | Alternative: HTTPS JSON webhook (CRM, automation). |
| `TRUST_PROXY` | when behind a proxy | Set `true` only if the proxy sets `X-Forwarded-For`. Enables per-IP rate limits. |

If neither delivery option is set the contact form returns a friendly error and shows the support email. Nothing is silently dropped.

Rotate `SESSION_SECRET` and the trade passphrase if either is ever pasted into chat, logs or a ticket.

## Node server (PM2 + nginx or Caddy)

```bash
# on the server, first time
git clone https://github.com/GemsNS/Atlantic-Gems.git /var/www/atlantic-gems
cd /var/www/atlantic-gems/clean
cp .env.example .env.local && nano .env.local

# each deploy
cd /var/www/atlantic-gems && git pull --ff-only origin main
cd clean
npm ci
npm run build
# standalone output needs static assets and public/ alongside it
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
pm2 startOrRestart ecosystem.config.cjs --env production || \
  pm2 start .next/standalone/server.js --name atlantic-gems --update-env
pm2 save
```

Run the process with `PORT=3000 HOSTNAME=127.0.0.1` and proxy `https://atlanticgems.ca` to it. The proxy must terminate TLS and forward `Host` and `X-Forwarded-For`; then set `TRUST_PROXY=true`.

Minimal nginx location block:

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Vercel

Set the root directory to `clean/`, add the environment variables above, and deploy from `main`. Rate limiting is per serverless instance on Vercel; move the limiter store to a shared store (Redis/KV) if abuse becomes a concern.

## Post-deploy checks

```bash
curl -sI https://atlanticgems.ca | grep -iE "content-security-policy|strict-transport|x-frame|x-content-type"
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://atlanticgems.ca/wholesale   # expect 307 to /wholesale/login
SCAN_BASE_URL=https://atlanticgems.ca npm run scan                                            # from clean/
```

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
