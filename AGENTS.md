## Shared Fleet Standard

Also read and follow the shared fleet-level agent standard at `../AGENTS.md`. Treat this repository as owned product code: protect production stability, keep changes scoped, verify work, and record durable follow-up tasks when something remains incomplete or blocked.

## Project

- **Stack**: Astro + TypeScript + Tailwind CSS + Transformers.js + Cloudflare Pages
- **Local dev**: `npm install && npm run dev`
- **Check**: `npm run check`
- **Deploy**: `npm run deploy` from clean, synced `main`

## Work tracking

- GitHub Issues is the sole operational work queue.
- An open issue is a to-do; a linked pull request is in progress; a merged
  pull request plus a closed issue is done.
- Use `PROJECT_STATUS.md` only for durable current/shipped product truth and
  its GitHub Issues pointer. Do not duplicate planned, deferred, or blocked
  work there.

## Visual work

For meaningful visual work, use the Fleet-local `$design-workflow` skill and
the shared `../LANDING_STANDARD.md` where applicable. Classify preserve or
overhaul before code; keep `PROJECT_STATUS.md` authoritative for product
scope, `PRODUCT.md` limited to design context, and `DESIGN.md` authoritative
for visual direction. Do not claim completion until the Fleet design-review
receipt passes.
