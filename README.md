# Atlantic Gems

Public website for Atlantic Gems, a fine jewellery house, gem wholesaler and atelier in Halifax, Nova Scotia, with a password-gated trade area.

## Layout

| Path | Purpose |
|---|---|
| `clean/` | The production Next.js application (customer-facing). |
| `source/` | Client originals: logos, photos, price lists, drawings. Archive only, never served. |
| `package/` | Downloadable deliverables: contracts, intake forms, catalogs, brand kit. |
| `docs/` | Internal working documents: facts register, deploy notes, evidence screenshots. |

Only `clean/` is built and typechecked. `source/` and `package/` are excluded from the app's TypeScript configuration.

## Working on the app

```bash
cd clean
npm ci
cp .env.example .env.local   # fill in values, never commit
npm run dev
```

Before merging:

```bash
npm run typecheck
npm run lint
npm run build
npm start &                                   # in a second terminal
SCAN_BASE_URL=http://localhost:3000 npm run scan
```

## Facts discipline

Every customer-visible fact lives in `clean/lib/site.ts`. Fields set to `null` there have not been supplied by the client and are not rendered. Provenance and status for every claim is tracked in `docs/FACTS-REGISTER.md`. Do not add prices, inventory, certifications, origins, watch brands or service claims that are not in the register.

## Deployment

See `docs/DEPLOY.md`.
