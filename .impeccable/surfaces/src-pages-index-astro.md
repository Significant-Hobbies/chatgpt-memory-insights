---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: ["src/scripts/app.ts","src/scripts/visual-atlas.ts","src/scripts/story.ts","src/styles/global.css","src/lib/types.ts","src/lib/insights.ts"]
---

# Scope and mode

- Surface: `src/pages/index.astro`
- Mode: Operate
- Scope: The post-ingestion report, including overview, visual atlas, semantic
  workbench, evidence-led insights, search, and persistence controls.

# Audience, job, action, proof, constraints

- Audience: People who have imported a ChatGPT export and want to understand a
  long, messy conversation history without reading every thread.
- Job: See the strongest patterns quickly, compare them over time, and inspect
  the exact conversations behind any conclusion.
- Primary action: Move from a visual pattern to its source evidence.
- Proof: Six coordinated visual maps backed by the normalized report, with
  readable values and the existing source drawer.
- Constraints: Browser-only processing; no diagnosis, invented precision,
  generative summary, upload, analytics, or loss of existing report routes.
  Keep deterministic views useful when embeddings are unavailable and limit
  charting to the one reviewed, framework-independent Observable Plot dependency.

# Direction and memorable moment

Preserve the existing Memory Transit Atlas. The memorable moment is a compact
visual departure board directly below overview: a recent activity calendar
anchors five different views of query mix, wording signals, repetition,
topic momentum, and conversation shape. It should feel like one information
system built from ink, ruled structure, station labels, signal color, and
evidence—not a dashboard assembled from rounded cards.

# Unresolved decisions

None. The owner asked for substantially more charts and additional website
polish, and delegated implementation judgment.
