## Why

The current report contains rich evidence but asks ledgers and prose to carry
most of the interpretation. A dedicated visual atlas will let visitors see
when, what, how often, and how their conversation patterns changed before they
drill into source evidence.

## What Changes

- Add a post-ingestion visual atlas with six coordinated chart families:
  activity calendar, question mix, language signals, repeat landscape, topic
  momentum, and conversation shape.
- Add a source-backed daily activity aggregate while keeping older saved
  snapshots readable.
- Make deterministic charts available before embeddings finish and clearly mark
  semantic charts while they are still forming.
- Connect chart summaries to readable data alternatives and the existing
  evidence drawer.
- Add a report-period control for all history or the recent 3, 6, 12, or 24
  months, applied to chronological charts and query-language summaries without
  re-reading the ZIP.
- Polish the report hierarchy, chart density, responsive layout, and interaction
  states without changing routes, labels, privacy boundaries, or the existing
  transit-atlas visual identity.
- Add a browser-only presentation-style Story mode after the report polish:
  animated, period-aware slides for scale, activity, query routes, repeats,
  language signals, and topic movement, with keyboard/touch controls and
  reduced-motion support.
- Use a pinned, browser-local visualization library for expressive SVG marks
  and scales; send no conversation data off-device.

## Capabilities

### New Capabilities

- `visual-insight-atlas`: Coordinated, accessible, evidence-linked data
  visualizations for activity, query mix, language, repetition, topic momentum,
  and conversation shape.

### Modified Capabilities

- `insight-report`: The report becomes visually scannable before semantic
  inference completes and keeps chart summaries usable at narrow widths.

## Impact

- Affects deterministic aggregation and report snapshot types in
  `src/lib/insights.ts` and `src/lib/types.ts`.
- Adds report markup, rendering, and styles in `src/pages/index.astro`,
  `src/scripts/app.ts`, and `src/styles/global.css`.
- Adds a derived Story mode using the same in-memory report and evidence drawer;
  it does not create a second analysis or persistence format.
- Extends the existing deterministic insight tests.
- Adds pinned `@observablehq/plot` as a browser visualization dependency. It
  fits vanilla TypeScript without adding React, shadcn, or a new design stack.
- Preserves the static Astro deployment, browser-only processing, current
  embedding models, confidence controls, search, evidence drawer, and
  IndexedDB snapshot boundary.
- Adds no runtime service, external API, or production package.
