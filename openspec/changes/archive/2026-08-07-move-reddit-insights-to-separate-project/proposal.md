# Proposal: Move Reddit memory tooling into a standalone "Reddit Insights" project

## Why

The Reddit memory pipeline (`reddit-memory-*` scripts, `reddit-proxy` worker, and generated reports) grew inside `chatgpt-memory-insights` as an experiment. It is now a distinct product surface with its own data sources, analysis lenses, and UI concerns. Keeping it in the ChatGPT repo:

- Couples two unrelated product directions in one codebase.
- Forces the Astro/Tailwind/Transformers.js web-app stack to carry Node analysis scripts that do not share its browser-only constraints.
- Makes it harder to iterate on Reddit-specific features (multi-subreddit support, scheduled ingest, API proxy, dashboard) without affecting the ChatGPT app.

A standalone project lets Reddit Insights ship its own pipeline, reports, and deployment lifecycle.

## What

Create a new project called **Reddit Insights** that owns the Reddit-specific ingestion, analysis, dashboard, and proxy code currently living in `chatgpt-memory-insights`.

### In scope

- Move the following artifacts from `chatgpt-memory-insights` to `reddit-insights`:
  - `scripts/reddit-memory-ingest.mjs`
  - `scripts/reddit-memory-analyze.mjs`
  - `scripts/reddit-memory-ui.mjs`
  - `scripts/reddit-memory-run.mjs`
  - `scripts/reddit-proxy/` (Cloudflare Worker)
  - `scripts/reddit-experiment*.mjs`
  - `scripts/reddit-e2e-test.mjs`
  - `data/reddit-memory/` directory and its contents
  - `topic-anchors.json`
- Establish a minimal project structure for `reddit-insights`:
  - `package.json` with only the Reddit pipeline dependencies.
  - `README.md` with setup and usage.
  - `AGENTS.md` if it becomes a fleet-managed repo.
  - `.gitignore` for cache, data, and report outputs.
- Update `chatgpt-memory-insights` to remove the moved files and leave the ChatGPT app clean.
- Preserve working behavior: the pipeline must still ingest → analyze → serve UI end-to-end.

### Out of scope

- Rewriting the analysis or UI code (the move is structural, not behavioral).
- Changing deployment targets for either project.
- Merging with any other Fleet product.

## What Changes

- New project `reddit-insights` is created with the moved scripts, proxy worker, config, and sample data.
- `chatgpt-memory-insights` no longer contains any `reddit-*` scripts, `reddit-proxy`, or `data/reddit-memory/`.
- Internal paths in `reddit-memory-analyze.mjs` are updated to load default topic anchors from `config/topic-anchors.json`.

## How

1. Create `reddit-insights` at the chosen location.
2. Copy Reddit scripts, worker, data, and config into a clear directory layout.
3. Create `package.json`, `README.md`, and `.gitignore`.
4. Update internal paths in the moved scripts (cache dir, data dir, report dir).
5. Delete the Reddit artifacts from `chatgpt-memory-insights`.
6. Verify the pipeline still runs: `node scripts/reddit-memory-run.mjs LocalLLaMA`.

## Destination question

The Fleet convention places maintained products as sibling repos under `/Users/sarthak/Desktop/fleet/`. The proposed destination is:

```
/Users/sarthak/Desktop/fleet/reddit-insights/
```

If you prefer a personal-namespace repo or a different path, say so and the design/tasks will be updated.
