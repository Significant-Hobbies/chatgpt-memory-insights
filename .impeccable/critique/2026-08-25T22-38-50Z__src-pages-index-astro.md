---
score: 21
p0: 1
p1: 3
p2: 1
status: fixed
timestamp: 2026-08-25T22-38-50Z
slug: src-pages-index-astro
---
# Historical shifts critique

Resolved target: `src/pages/index.astro`

## Assessment A — design review

- P0: The seventh atlas figure omitted a grid-column span and collapsed to about 90.6px at 390, 768, and 1440px, making the chart unreadable.
- P1: The chart did not name the early and recent comparison windows, so its relationship to the atlas period selector was ambiguous.
- P1: Only the recent value was visible; the early value needed to be found in a tooltip or disclosure.
- P1: “Share of attention” was inaccurate for the cadence row, which uses conversations per month rather than a monthly share.
- P2: The atlas count and the topic-momentum fallback copy still described the six-view layout.

## Assessment B — detector and implementation evidence

- The Impeccable detector returned `[]`; the failure was a CSS integration defect outside its rules.
- `.historical-shifts-figure` was absent from the 12-column span rules.
- The 620px SVG was scaled into the one-column card, shrinking labels below a usable size.
- The surrounding copy and DESIGN.md still described six atlas views, corroborating an incomplete seventh-view integration.

## Actions applied

- Made the historical comparison a full-width atlas figure.
- Added intentional horizontal containment and a visible scroll cue below 1050px without causing page-level overflow.
- Named the actual earliest-third and recent-third month windows.
- Placed the before-to-after values on every row and described cadence versus share units in the readable-data disclosure.
- Reconciled page copy, DESIGN.md, and PROJECT_STATUS.md.

## Run notes

Questions skipped: the repository surface brief delegates implementation judgment and the owner explicitly prioritized historical changes over Claude import work. Visual proof uses a synthetic eight-month export, not private user data. The final three-width pass shows a 365px card at 390, 671px at 768, and 1087px at 1440, with no page-level horizontal overflow.
