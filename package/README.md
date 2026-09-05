# /package — downloadable deliverables

Customer- or client-facing deliverables: contracts, quote templates, repair-intake forms, catalogs, brand kit, service menus.

`policies/` is generated from `clean/lib/policies.json` by `node scripts/export-policies.mjs` (run from `clean/`). Edit the JSON, not the Markdown.
Every file here must be production-clean (no tool attribution, no draft banners).
