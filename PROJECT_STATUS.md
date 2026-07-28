# chatgpt-memory-insights — PROJECT STATUS

Last updated: 2026-07-28

## Why / What

A browser-only insight report and semantic memory for ChatGPT export ZIPs.

**Users:** People who want to understand recurring questions, themes, stated
facts, corrections, writing patterns, and activity across their ChatGPT
history without uploading it to an application server.

**IN scope:** Static Astro app; split `conversations*.json` ZIP parsing;
deterministic and embedding-backed insight lenses; graph and source evidence;
semantic/lexical search; optional device-local derived-memory persistence.

**OUT of scope:** Attachments, assistant-authored facts, generative summaries,
accounts, server uploads, cross-device sync, and verified medical, emotional,
or personality claims.

## Dependencies

### External

- Cloudflare Pages for static hosting.
- Hugging Face model files for the browser-loaded pinned
  `Xenova/all-MiniLM-L6-v2` embedding model.
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
- Interactive SVG topic map with a complete keyboard-accessible topic list.
- Evidence-linked reflection questions for repeats, memory changes, wording
  spikes, recurring terms, dormant topics, and activity peaks.
- Explicit opt-in IndexedDB save, restore, version rejection, and forget flow.
- Responsive import, progress, report, evidence, empty, and recovery states.
- Native, accessible export guidance with current official OpenAI routes,
  delivery timing, ZIP handling, and account-availability caveats.

## Todo / Planned / Deferred / Blocked

1. Deferred: attachment and exported-memory-file analysis until those schemas
   are validated independently.
2. Deferred: cross-device sync and server-side analysis; both would change the
   product's private static-site boundary.
3. Owner confirmation needed before adding the optional Fleet
   `docs/learning/new-things.md` study queue for the browser ML stack.
