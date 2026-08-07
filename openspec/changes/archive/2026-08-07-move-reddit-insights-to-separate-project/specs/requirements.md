# Requirements: Reddit Insights extraction

## R1 — Standalone project
The Reddit tooling must live in its own top-level project directory/repository, not inside `chatgpt-memory-insights`.

## R2 — Preserved functionality
After the move, the following command must still produce a working dashboard:

```bash
node scripts/reddit-memory-run.mjs LocalLLaMA
```

## R3 — Clean source project
`chatgpt-memory-insights` must no longer contain `reddit-*` scripts, `reddit-memory` data, or the `reddit-proxy` worker.

## R4 — Self-contained dependencies
`reddit-insights` must have its own `package.json` listing only the dependencies required by the moved scripts.

## R5 — Documentation
A `README.md` in `reddit-insights` must explain setup, the pipeline steps, and how to run ingest/analyze/UI.

## R6 — No secrets or credentials moved
Only code, config, and sample data move. No API keys, tokens, or environment files from the original project are copied.
