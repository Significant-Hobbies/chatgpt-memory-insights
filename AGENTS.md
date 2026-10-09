## Repository operating rules

This repository is independently operable. Its tracked instructions and
commands are authoritative. Protect stability, keep changes scoped, verify work
with repo-local checks, and record durable follow-up in this repository's
GitHub Issues.

## What lives here

- `mcp/`: the DaddyRad MCP server, the single local read-only stdio server
  across the four DaddyRad native cores. Build it with SwiftPM from sibling
  engine checkouts (`../../performancedaddy`, `../../contextdaddy`,
  `../../storagedaddy`, `../../browserdaddy`); see `mcp/README.md`. It exposes
  no network endpoint and does not access the GUI apps' live state. Keep file
  access startup-selected, resource use bounded and process identities opt-in.
- History only: Memory Map's design receipts (`artifacts/design`, referenced by
  the live site's social images, so keep them), qualification evidence
  (`docs/qualification`) and agent metadata.

Memory Map (the app) and `memory-pack` moved to `sass-maker/saas-maker`
`apps/memory-map`; do not re-add them here. Its deploys and releases come from
SaaS Maker.

## Check

CI (`.github/workflows/ci.yml`, macOS) validates `mcp/engine-revisions.json`,
checks out the four engines at those exact revisions, then runs:

```sh
cd mcp
swift test --filter DiagnosticsTests
swift build -c release --product daddyrad-mcp
python3 scripts/verify-mcp.py "$(swift build -c release --show-bin-path)/daddyrad-mcp"
```

## Work tracking

- GitHub Issues is the sole operational work queue.
- Use `PROJECT_STATUS.md` only for durable current truth.
