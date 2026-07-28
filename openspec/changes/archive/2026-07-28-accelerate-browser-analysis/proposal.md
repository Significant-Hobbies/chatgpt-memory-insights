## Why

The owner-supplied archive produces deterministic insight in about two seconds,
but the complete semantic map took about 188 seconds on the current browser
path. The early result is useful, yet the unexplained multi-minute tail weakens
the product's aha moment and gives the visitor no trustworthy sense of elapsed
or remaining work.

## What Changes

- Measure every analysis stage from archive open through parse, statistics,
  model load/download, embedding, clustering, and final render.
- Show the current-stage elapsed time, completed-stage timings, a calibrated
  remaining-time estimate, and the fact that deterministic insight is already
  usable while semantic work continues.
- Show a distinct final end-to-end execution time after the complete semantic
  map becomes available.
- Prefer supported browser GPU inference when it is available, with a reliable
  WASM fallback and an explicit runtime label.
- Increase inference throughput with device-aware adaptive batching while
  preserving the exact existing set and order of semantic candidates.
- Benchmark the owner-supplied archive before and after. Treat 4–5× as a target
  on an accelerated warm-model path, not an unconditional claim across devices
  or first-download network conditions.

## Capabilities

### New Capabilities

- `analysis-performance`: Covers staged timing, remaining-time estimates,
  execution summaries, acceleration selection, coverage preservation, and
  benchmark disclosure.

### Modified Capabilities

- `semantic-memory`: Semantic analysis reports its selected runtime and
  preserves the existing bounded candidate coverage when changing inference
  device or batch size.

## Impact

- Worker protocol and report types gain timing and runtime metadata.
- The analysis worker and semantic pipeline gain instrumentation, WebGPU
  selection with fallback, and adaptive batch sizing.
- Import progress and completed-report surfaces gain a compact timing route.
- Tests cover timing math, protocol metadata, fallback, and coverage
  invariants.
- No server, production binding, account, analytics, or new dependency is
  introduced. Production deployment remains out of scope unless separately
  requested.
