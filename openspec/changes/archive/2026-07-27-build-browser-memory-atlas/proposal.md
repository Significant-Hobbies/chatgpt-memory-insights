## Why

A ChatGPT export is a large archive, not a useful memory. This change turns it
into a private, explorable report that reveals repeated questions, recurring
themes, and semantic relationships without uploading conversation contents.

## What Changes

- Add a static Astro experience for selecting and parsing ChatGPT export ZIPs.
- Show deterministic activity, model, conversation-depth, and recurrence
  insights as soon as parsing completes.
- Load a browser embedding model to group semantically repeated questions,
  build topic clusters, and power a searchable relationship graph.
- Detect first-person fact candidates and organize later updates and explicit
  refutations into a traceable memory ledger.
- Estimate basic sentiment and a broader set of query language signals as
  aggregate, disclosed wording cues.
- Ask evidence-linked reflection questions about repeats, changed or stale
  memories, wording spikes, and dormant themes.
- Add overlapping question-domain lenses plus conservative likely-typo and
  multi-thread conversation candidates.
- Add an opt-in browser memory snapshot with an explicit forget action.
- Provide clear progress, recovery, unsupported-export, and no-model fallbacks.
- Ignore attachments and non-conversation export files in the first release.

## Capabilities

### New Capabilities

- `chatgpt-export-import`: Browser-only ZIP discovery, incremental conversation
  parsing, validation, normalization, and progress reporting.
- `insight-report`: Deterministic activity, recurrence, depth, and model-usage
  reporting with source traceability.
- `semantic-memory`: Bounded embedding, repeated-question grouping, topic
  clustering, semantic search, an accessible relationship graph, fact-version
  chains, and query-tone analysis.
- `private-persistence`: Explicit browser-only saving, restoration, and deletion
  of a derived memory snapshot.

### Modified Capabilities

None.

## Impact

- Adds an Astro/TypeScript static web application and Cloudflare Pages config.
- Adds `@zip.js/zip.js` for incremental ZIP reading and
  `@huggingface/transformers` for lazy browser embeddings.
- Downloads an Apache-2.0 MiniLM embedding model from Hugging Face when semantic
  analysis starts; model files use the browser cache.
- Adds no application server, database, authentication, or production secret.
