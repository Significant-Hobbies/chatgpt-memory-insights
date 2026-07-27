## Why

Memory Map already reveals recurring themes and candidate facts, but a large
conversation history is more useful when it shows how ideas changed, separates
the strands inside long conversations, and lets the visitor control how much
uncertain evidence is admitted. The next phase deepens the report without
adding a server or a generative model.

## What Changes

- Turn fact updates and explicit rejections into evidence-linked chronological
  timelines, including possible contradictions that remain visibly qualified.
- Segment eligible conversations into coherent topic strands using prompt
  boundaries, lexical overlap, and semantic similarity instead of reporting
  only a rough thread-change count.
- Add longitudinal views for topics, query domains, wording signals, and memory
  changes so visitors can see emerging, fading, recurring, and resurfacing
  interests over time.
- Add an automatic/compact-English/multilingual embedding profile. The
  multilingual profile uses a pinned browser-compatible model and clearly
  discloses its larger download.
- Add exploratory, balanced, and conservative confidence controls that filter
  semantic repeats, fact-change candidates, thread splits, and reflection
  prompts while preserving the underlying evidence.
- Preserve deterministic fallbacks, bounded model work, local-only archive
  processing, accessible evidence views, and the existing Memory Transit Atlas
  visual language.

## Capabilities

### New Capabilities

- `longitudinal-insights`: Evidence-backed timelines for evolving memories,
  topics, domains, and language signals.
- `thread-segmentation`: Inspectable topic strands and boundaries within
  eligible conversations.
- `analysis-controls`: Visitor-selected model profile and confidence policy,
  with explicit trade-offs and persistence behavior.

### Modified Capabilities

- `semantic-memory`: Semantic analysis supports a pinned multilingual embedding
  model and retains enough confidence evidence for post-analysis filtering.
- `insight-report`: The report gains evolution, contradiction, strand, and
  confidence-filtered views while keeping accessible source evidence.
- `private-persistence`: Saved derived memory records the selected model profile,
  confidence policy, and the new derived timelines and strands.

## Impact

- Affects the browser analysis worker, semantic and deterministic insight
  utilities, persisted report schema, main Astro surface, app controller,
  styles, tests, product/design documentation, and deployment metadata.
- Reuses the existing `@huggingface/transformers` dependency. No server,
  account, application API, or new production package is introduced.
- Adds an optional larger model download from Hugging Face for multilingual
  semantic analysis; archive contents and derived text remain on-device.
