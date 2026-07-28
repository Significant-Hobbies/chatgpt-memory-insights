## Context

The report currently provides a strong evidence graph, ledgers, trend rows, and
small bar summaries, but most patterns require reading. Its normalized
deterministic report already contains monthly activity, weekday activity, model
usage, depth, question-lens timelines, language-signal timelines, and repeat
history. Its semantic report adds topic momentum and semantic repeats.

The site is a static Astro application. All archive parsing and model inference
happen inside the browser. The existing design is a dense transit atlas with
ink, signal colors, ruled structure, and source evidence; the new work is a
preserve-lane extension of that identity.

## Goals / Non-Goals

**Goals:**

- Make the report visually useful within seconds of deterministic ingestion.
- Show six distinct, honest views of time, mix, language, recurrence, momentum,
  and conversation shape.
- Let visitors move from a chart summary to its readable values and source
  conversations.
- Improve report hierarchy, spacing, responsiveness, and interaction finish.
- Add a concise presentation mode that makes the selected period enjoyable to
  review without weakening the evidence-led report.
- Keep the implementation typed, bounded, and compatible with older saved
  snapshots.

**Non-Goals:**

- Inferring diagnoses, causes, personality traits, or emotional states.
- Adding a server, upload path, account, analytics, or generative summary.
- Replacing the existing graph, ledgers, search, evolution views, or evidence
  drawer.
- Adding a charting framework or embedding more prompts than the existing
  bounded pipeline.

## Decisions

### Use one coordinated visual-atlas section

The atlas sits after overview and before the detailed workbench. A full-width
activity calendar leads, followed by asymmetric ruled chart fields for question
mix, language signals, repeats, topic momentum, and conversation shape.

This creates a strong visual reading order while keeping the existing evidence
views below as the detailed layer. Scattering charts through every current
section was rejected because it would make the long report less predictable.

### Use Observable Plot for primary graphs

Question mix, repeat landscape, and topic momentum use pinned
`@observablehq/plot@0.6.17`, which returns detached SVG in vanilla TypeScript.
The dataset is bounded before rendering: selected months and a small number of
top categories or candidates. Calendar, matrix, and compact shape rows remain
semantic DOM/CSS because they are clearer without a general plotting grammar.

Dither Kit inspired the plotted texture and tactile mark direction, but its
React, Tailwind, shadcn, and copy-in requirements do not fit this Astro
application. Pulling in that stack was rejected. Observable Plot adds typed,
framework-independent layered marks, scales, axes, and accessible SVG. Custom
SVG pattern definitions and restrained halftone fills bring the relevant
Dither Kit character into the existing transit-atlas identity.

The library's advisory compressed size is about 125 KiB with three runtime
dependencies. This is accepted for the new multi-chart exploration surface and
must be checked against the actual production build.

### Apply one explicit report period

The atlas offers all history or recent 3, 6, 12, and 24 month windows.
Chronological views and the existing query-tone and language-signal summaries
derive their visible counts from stored monthly aggregates. Repeat points filter
by their latest evidence date. Topic marks filter their stored monthly activity
but retain the model's original topic grouping and local trend label. Lifetime
overview totals and conversation-shape distributions stay clearly all-time
because the current snapshot does not contain enough monthly detail to
recompute them honestly.

### Add only a daily deterministic aggregate

`activityByDay` stores sorted ISO-day labels, counts, and bounded source
references. All other charts consume existing report fields. The field is
optional in the TypeScript snapshot shape so version-3 snapshots created before
this change still restore; those snapshots show a precise re-import prompt only
for the daily calendar.

Reconstructing days from monthly totals was rejected because it would invent
precision. Bumping the whole snapshot version was rejected because this is an
additive field.

### Separate deterministic and semantic readiness

Activity, question mix, language signals, and conversation shape render as soon
as deterministic analysis completes. Repeat landscape can show exact repeats
immediately and add qualified semantic repeats later. Topic momentum displays a
forming state until embeddings finish.

Confidence changes refilter semantic repeat marks without re-reading the ZIP.
Deterministic marks do not imply model confidence.

### Pair every chart with a readable alternative

Every chart has an explicit title, unit, method note, and native disclosure with
readable values. Relevant rows and marks open the existing evidence drawer.
Color is always paired with text, position, symbol, or trend wording.

Dense decorative tooltips were rejected as the sole explanation because they
exclude touch and keyboard users.

### Preserve the visual identity while polishing the report

The atlas extends the current ink, route, signal-color, grid, and station-label
vocabulary. Polish focuses on clearer section hierarchy, fewer competing
containers, consistent numeric typography, responsive chart labels, visible
focus, and purposeful hover states. Existing routes, anchor IDs, navigation
labels, wordmark, controls, legal copy, and privacy language remain unchanged
except for the addition of the new Visual atlas anchor.

### Build Story mode from the report, not a second pipeline

After the report UI pass, a full-screen modal presentation derives a bounded
slide array from the current `FullReport` and active period. Slides cover scale,
activity, question routes, repeats, language signals, and model-backed topic
movement when available. The story reuses existing values, caveats, and source
actions; it never calls a model or stores a separate result.

The presentation uses a progress rail, previous/next controls, arrow keys,
Escape, and direct slide buttons. Motion is limited to route drawing, mark
stagger, and slide transitions. `prefers-reduced-motion` removes nonessential
movement. Autoplay was rejected because the archive may be emotionally or
personally sensitive and visitors should control pacing.

## Risks / Trade-offs

- **Dense charts can become illegible on narrow screens** → Bound visible
  periods, wrap labels below the visualization, and provide a readable data
  disclosure without page-level horizontal scrolling.
- **Overlapping question lenses can look like a partition** → Label the chart
  “overlapping query signals” and state that one prompt may count in multiple
  routes.
- **Language heuristics can be mistaken for mental-state analysis** → Use
  “language signal” wording, disclose the lexical method, and avoid causal or
  diagnostic claims.
- **Sparse archives can make scatterplots meaningless** → Show a useful empty
  state and keep exact values in the readable alternative.
- **Source arrays can enlarge snapshots** → Bound daily source references and
  reuse the existing compact source type.
- **The visualization library increases the app bundle** → Pin one library,
  use it only for the three graphs that benefit from its grammar, and compare
  the real production bundle in verification.
- **Custom SVG requires manual responsive testing** → Capture and inspect the
  complete report at 390, 768, and 1440 pixels before completion.
- **A Wrapped format can overclaim or trivialize personal history** → Keep
  labels descriptive, repeat all relevant method caveats, avoid ranking the
  person, and make every source-backed slide optional to inspect.

## Migration Plan

1. Add the optional daily aggregate and deterministic tests.
2. Add atlas markup, renderers, evidence actions, and responsive styles.
3. Validate older snapshot fallback behavior and semantic loading states.
4. Run the project check and browser review at required widths.
5. Archive the OpenSpec change and update `PROJECT_STATUS.md`.

Rollback is a normal code revert. The additive optional snapshot field does not
require a storage migration.

## Open Questions

None. The user explicitly requested more charts and broader website polish, and
delegated implementation judgment.
