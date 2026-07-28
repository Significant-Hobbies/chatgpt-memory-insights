## Why

Memory Map already exposes a semantic graph and evidence-backed search, but the
visitor must interpret those surfaces separately. A conversational workbench
can make the architecture tangible by showing the exact graph route and source
pack used before a small browser-loaded model synthesizes an answer.

## What Changes

- Add a right-side Memory Chat panel beside the semantic graph.
- Let a question visibly traverse matched topics and source evidence before an
  answer appears.
- Build a bounded, cited retrieval pack from the existing hybrid search index;
  the generative model never receives the original ZIP or unselected history.
- Load an opt-in pinned small instruction model in a dedicated browser worker,
  disclose its download and limitations, and provide an explicit unload
  control.
- Keep chat generation unavailable until semantic analysis completes and
  enforce one heavyweight analysis owner across tabs.
- Compare the evidence-first prototype only with documented legacy saved-memory
  limitations, not with undisclosed or current ChatGPT internals.

## Capabilities

### New Capabilities

- `graph-memory-chat`: Covers opt-in local generation, cited retrieval packs,
  visible graph traversal, conversational history, resource controls, and
  evidence-first comparison language.

### Modified Capabilities

- `semantic-memory`: Hybrid search results gain a bounded answer context and a
  topic route so graph traversal can remain inspectable for questions, facts,
  conversations, topics, and strands.

## Impact

- The report workbench gains a conversational sidecar and transient graph-route
  states.
- Search entries and worker messages gain optional retrieval context and topic
  attribution.
- A dedicated text-generation worker uses the existing
  `@huggingface/transformers` dependency with pinned
  `Xenova/LaMini-Flan-T5-77M` q8 weights.
- The model is approximately 105 MB plus tokenizer files, loads only after
  explicit consent, and can be terminated independently.
- No server, API key, account, analytics payload, new dependency, or production
  deployment is introduced.
