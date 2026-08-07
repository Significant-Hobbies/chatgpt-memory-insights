# Design: Reddit Insights extraction

## Target layout

```
reddit-insights/
├── AGENTS.md (optional, if fleet-managed)
├── README.md
├── package.json
├── .gitignore
├── scripts/
│   ├── reddit-memory-analyze.mjs
│   ├── reddit-memory-ingest.mjs
│   ├── reddit-memory-run.mjs
│   ├── reddit-memory-ui.mjs
│   ├── reddit-e2e-test.mjs
│   ├── reddit-experiment.mjs
│   ├── reddit-experiment-cached.mjs
│   ├── reddit-experiment-server.mjs
│   ├── reddit-experiment-static.mjs
│   └── reddit-proxy/
│       ├── worker.js
│       └── wrangler.jsonc
├── config/
│   └── topic-anchors.json
└── data/
    └── reddit-memory/
        └── LocalLLaMA.json (sample / generated)
        └── cache/
```

## Path changes

Scripts currently use `process.cwd()` to resolve `data/reddit-memory/` and `data/reddit-memory/cache/`. After the move, these paths stay the same relative to the new project root, so the only required change is ensuring scripts are run from `reddit-insights/` root.

## Dependency audit

We will inspect imports in the moved scripts to produce a minimal `package.json`. Expected dependencies:

- `@huggingface/transformers` (analyze embeddings)
- Any fetch/HTTP packages used by ingest/proxy

## Verification

Run the pipeline against the existing `LocalLLaMA.json` data and confirm:

1. Ingest/analyze/UI commands exit 0.
2. HTML report is generated in `data/reddit-memory/`.
3. UI server starts on `:7424`.

## Removal from source project

Delete from `chatgpt-memory-insights`:

- `scripts/reddit-*`
- `data/reddit-memory/`
- Any references in `package.json` that were added only for Reddit tooling.
