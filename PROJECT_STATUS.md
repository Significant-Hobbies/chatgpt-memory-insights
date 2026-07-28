# chatgpt-memory-insights — PROJECT STATUS

Last updated: 2026-07-28

## Why / What

A browser-only insight report and semantic memory for ChatGPT export ZIPs.

**Users:** People who want to understand recurring questions, themes, stated
facts, corrections, writing patterns, and activity across their ChatGPT
history without uploading it to an application server.

**IN scope:** Static Astro app; split `conversations*.json` ZIP parsing;
deterministic and embedding-backed insight lenses; graph and source evidence;
semantic/lexical search; opt-in graph-routed local memory chat; optional
device-local derived-memory persistence.

**OUT of scope:** Attachments, assistant-authored facts, hosted generation,
general-purpose assistant behavior, accounts, server uploads, cross-device
sync, and verified medical, emotional, or personality claims.

## Dependencies

### External

- Cloudflare Pages for static hosting.
- Hugging Face model files for the browser-loaded pinned
  `Xenova/all-MiniLM-L6-v2` embedding model and opt-in
  `Xenova/LaMini-Flan-T5-77M` local generator.
- Observable Plot for typed, framework-independent SVG charts in the visual
  atlas.
- npm packages listed in `package.json`; the runtime has no application API.

### Internal

- No Fleet runtime dependency or shared binding.
- Fleet development, design-review, cleanup, CI, and deploy standards.

## Timeline

- 2026-07-28 — project scaffolded
- 2026-07-28 — browser ZIP pipeline, semantic memory, evidence-led report,
  query lenses, and responsive product surface implemented and validated
  against the owner-supplied export
- 2026-07-28 — first production release deployed to
  `https://chatgpt-memory-insights.pages.dev`
- 2026-07-28 — multilingual model selection, tunable confidence, richer memory
  change trails, semantic conversation strands, and longitudinal evolution
  views implemented
- 2026-07-28 — custom production domain configured at
  `https://chatgpt.significanthobbies.com`
- 2026-07-28 — expanded insight release deployed and smoke-tested on the custom
  production domain
- 2026-07-28 — official ChatGPT export instructions and Privacy Portal fallback
  added to the import onboarding
- 2026-07-28 — public value proposition and exhaustive 42-capability atlas
  added at `/about`
- 2026-07-28 — period-aware six-chart visual atlas, evidence-linked starting
  insight, and seven-slide Story mode completed; production deployment was not
  performed in this change
- 2026-07-28 — staged elapsed/remaining-time route, distinct end-to-end
  execution receipt, WebGPU acceleration, portable fallback, and
  order-preserving semantic batching completed and benchmarked on the
  owner-supplied archive; production deployment was not performed
- 2026-07-28 — graph-routed Memory Chat, bounded cited evidence packs,
  structured change/repeat retrieval, grounding validation, independent model
  unload, and single-tab analysis ownership completed; production deployment
  was not performed
- 2026-07-28 — visual atlas, execution timing, and graph-routed Memory Chat
  release deployed and smoke-tested at
  `https://chatgpt.significanthobbies.com`
- 2026-07-28 — progressive conversation-by-conversation graph formation added
  to ingestion and verified against all 1,061 conversations in the owner
  archive; production deployment was not performed

## Products

- **Memory Map web app** — production static Astro app at
  `https://chatgpt.significanthobbies.com`, deployed directly to the
  `chatgpt-memory-insights` Cloudflare Pages project. The
  `https://chatgpt-memory-insights.pages.dev` URL remains the provider route.

## Features (shipped)

- Sequential in-worker parsing for current split ChatGPT conversation exports.
- Progressive deterministic totals, activity, streak, depth, model, recurring
  term, exact-repeat, tone, and language-signal insights.
- Overlapping math, health, software, money, career, learning, creative,
  relationship, travel, and planning question lenses.
- Conservative likely-typo and likely multi-thread conversation candidates.
- Compact and multilingual browser-loaded MiniLM profiles with automatic
  script-aware selection, pinned revisions, and visible download disclosure.
- Browser-loaded topic clustering, semantic repeat detection, source-backed
  fact history, and hybrid semantic/lexical search.
- Confidence presets and a custom threshold for inferred evidence.
- Explicit current, updated, refuted, and possible-contradiction memory states
  with dated evidence and transparent matching metrics.
- Semantic conversation strands with ordered prompt timelines and visible
  boundary evidence.
- Longitudinal topic, question-domain, and language-signal views with emerging,
  fading, resurfacing, steady, and insufficient-evidence labels.
- Period-aware visual atlas with daily activity, question mix, language
  signals, repeat landscape, topic movement, and conversation-shape views.
- Full-screen seven-slide Story mode with keyboard, swipe, touch, direct-slide,
  evidence-detour, and reduced-motion support.
- Interactive SVG topic map with a complete keyboard-accessible topic list.
- Evidence-linked reflection questions for repeats, memory changes, wording
  spikes, recurring terms, dormant topics, and activity peaks.
- Explicit opt-in IndexedDB save, restore, version rejection, and forget flow.
- Responsive import, progress, report, evidence, empty, and recovery states.
- Native, accessible export guidance with current official OpenAI routes,
  delivery timing, ZIP handling, and account-availability caveats.
- Static public `/about` route with an illustrative memory-map mechanism,
  exhaustive shipped capability routes, privacy architecture, fit and limit
  guidance, export onboarding, and a direct path into analysis.
- Six-stage live timing with elapsed time, estimated wait, initial-insight
  arrival, and the resolved browser compute route.
- A completed end-to-end execution receipt that includes model download and
  preparation, semantic work, report assembly, runtime, batch size, and exact
  embedded-candidate coverage.
- Compact-model WebGPU acceleration with bounded device-aware batches and a
  complete order-preserving WebAssembly compatibility fallback.
- Opt-in 77M q8 local Memory Chat in a dedicated worker, with a disclosed
  approximately 105 MB cached download and explicit unload control.
- Visible question-to-topic-to-evidence graph traversal with a temporary query
  node, a five-step text route, and direct source inspection.
- Bounded six-stop evidence packs, four-turn conversational continuity,
  structured changed/refuted/repeated-memory retrieval, and citation
  validation that withholds unsupported drafts.
- Single-tab heavyweight-analysis ownership plus worker termination and lock
  release on error, reset, unload, and page exit.
- Progressive ingestion sketch with one distinct stop per parsed conversation,
  deterministic multi-route attribution, continuous parsing-to-report state,
  reduced-motion behavior, and automatic handoff to the final semantic graph.

## Todo / Planned / Deferred / Blocked

1. Deferred: attachment and exported-memory-file analysis until those schemas
   are validated independently.
2. Deferred: cross-device sync and server-side analysis; both would change the
   product's private static-site boundary.
3. Owner confirmation needed before adding the optional Fleet
   `docs/learning/new-things.md` study queue for the browser ML stack.
