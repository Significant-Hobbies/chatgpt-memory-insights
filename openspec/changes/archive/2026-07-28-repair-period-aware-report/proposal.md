## Why

The current report has three visible trust and usability failures on the
owner's real archive:

- the daily activity calendar does not visibly honor longer period selections;
- the Rhythms section can collapse into a blank bar field, while the topic
  momentum plot clips and overlaps labels;
- the completed report permanently spends its first viewport on a duplicate
  search field, execution receipt, and full analysis controls.

The evidence drawer is also too tight for long explanations and source titles,
and the route rail does not clearly communicate the reader's current location.
Together these defects make a rich report feel less reliable than its data.

## What Changes

- Make the daily calendar represent the exact selected month window, including
  24 months and all history, using a horizontally scrollable daily grid when
  necessary.
- Replace the fragile monthly bars in Rhythms with a filterable Observable Plot
  series for conversation count or approximate words.
- Let the Rhythms series filter to all conversations or one disclosed
  question-domain route.
- Keep one search field and place it with the topic-map workbench.
- Collapse completed timing, model, and confidence details into an accessible
  disclosure; keep it open while semantic analysis is still running.
- Add breathing room and clearer grouping to the evidence drawer.
- Refine the existing route rail and mark the section currently in view.
- Repair topic-momentum label clipping without hiding the readable-data
  alternative.

## Capabilities

### Modified Capabilities

- `visual-insight-atlas`: Period selection updates the full daily window and a
  new route-filtered activity rhythm plot.
- `insight-report`: The persistent report prioritizes insight content while
  one-time analysis details remain available on demand, search lives beside
  the map, and navigation/evidence surfaces remain legible.

## Impact

- `src/lib/insights.ts` and `src/lib/types.ts` gain backward-compatible monthly
  activity rhythm aggregates.
- `src/scripts/visual-atlas.ts` owns exact daily period windows and the
  filterable Rhythms plot.
- `src/pages/index.astro`, `src/scripts/app.ts`, and `src/styles/global.css`
  change report composition, controls, navigation state, and drawer spacing.
- Tests cover deterministic route/month aggregation.
- No model, server, dependency, upload, persistence version, or production
  deployment is introduced.
