## Repository operating rules

This repository is independently operable. Its tracked instructions and
commands are authoritative; no sibling Fleet checkout is required. Protect
production stability, keep changes scoped, verify work with repo-local checks,
and record durable follow-up in this repository's GitHub Issues.

## Project

- **Stack**: Astro + TypeScript + Tailwind CSS + Transformers.js + Cloudflare Pages
- **Local dev**: `pnpm install && pnpm run dev`
- **Check**: `pnpm run check`
- **Deploy**: `pnpm run deploy` from clean, synced `main`

The check is the complete Fleet quality boundary. Use its narrower
`format:check`, `lint`, `typecheck`, `test:coverage`, `quality:*`, or `build`
scripts while iterating. Existing ratcheted debt is tracked in GitHub issue
#12; improve its checked-in ceilings and floors in the same change that reduces
them, and do not add inline suppression directives.

## Work tracking

- GitHub Issues is the sole operational work queue.
- An open issue is a to-do; a linked pull request is in progress; a merged
  pull request plus a closed issue is done.
- Use `PROJECT_STATUS.md` only for durable current/shipped product truth and
  its GitHub Issues pointer. Do not duplicate planned, deferred, or blocked
  work there.

## Visual work

For meaningful visual work, classify preserve or overhaul before code; keep
`PROJECT_STATUS.md` authoritative for product scope, `PRODUCT.md` limited to
design context, and `DESIGN.md` authoritative for visual direction. Validate
the result at the project's required browser widths before claiming completion.
