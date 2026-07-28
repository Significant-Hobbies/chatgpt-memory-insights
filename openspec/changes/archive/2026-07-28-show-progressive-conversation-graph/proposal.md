## Why

Archive ingestion currently shows timing and text progress, but the semantic
graph remains an empty loading state until all embeddings and clustering
finish. The visitor cannot see their conversations becoming a memory structure,
which hides the product's most important transformation during the wait.

## What Changes

- Add a progressive route sketch that begins as normalized conversations arrive
  from the ZIP worker.
- Represent every parsed conversation as one visible stop connected to its
  matching deterministic question-domain routes.
- Show the cumulative conversation count and the latest added conversation
  while the sketch forms.
- Carry the same sketch from the initial progress view into the report's topic
  map loading state while semantic analysis continues.
- Replace the sketch with the final embedding-backed topic graph when semantic
  clustering completes.
- Frame-batch drawing for large archives, pause naturally in background tabs,
  and render accumulated state immediately for reduced-motion visitors.

## Capabilities

### New Capabilities

- `progressive-conversation-graph`: Shows each parsed conversation contributing
  to a transparent deterministic route sketch before the semantic map is ready.

### Modified Capabilities

- `analysis-performance`: The staged wait experience includes a live graph
  formation surface without delaying deterministic or semantic completion.
- `semantic-memory`: The final semantic topic graph explicitly supersedes the
  deterministic ingestion sketch.

## Impact

- `src/workers/analyze.worker.ts` emits bounded graph-formation batches.
- `src/lib/insights.ts` exposes the existing question-lens classifier for
  per-conversation route attribution.
- `src/lib/types.ts` gains the graph-formation worker protocol.
- `src/lib/graph-formation.ts` owns deterministic layout helpers.
- `src/pages/index.astro`, `src/scripts/app.ts`, and `src/styles/global.css`
  gain the progressive canvas, state handoff, motion, and responsive behavior.
- No server, model, dependency, persistence schema, or production deployment is
  introduced.
