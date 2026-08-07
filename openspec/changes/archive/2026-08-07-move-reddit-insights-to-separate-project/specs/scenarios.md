# Scenarios: Reddit Insights extraction

## S1 — End-to-end pipeline after move

Given the moved `reddit-insights` project, when a developer runs:

```bash
node scripts/reddit-memory-run.mjs LocalLLaMA
```

then the script ingests posts, analyzes them, and serves the dashboard at `http://localhost:7424` without errors.

## S2 — No Reddit code in ChatGPT project

After the move, searching `chatgpt-memory-insights` for `reddit-memory` or `reddit-proxy` returns no source files.

## S3 — Dependency install in new project

Given a fresh clone of `reddit-insights`, when a developer runs `npm install`, then all pipeline scripts can run without missing-package errors.

## S4 — Cache and data paths resolve

Given the moved project, when the analyze script runs, it writes cache and reports to paths relative to the new project root, not the old `chatgpt-memory-insights` root.
