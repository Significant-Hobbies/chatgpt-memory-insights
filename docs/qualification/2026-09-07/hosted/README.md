# Hosted synthetic qualification — 2026-09-07

Production release [c02a7506](https://c02a7506.chatgpt-memory-insights.pages.dev)
deployed checked source `3417cca5a1eb13e9e666ed29dda7a2857bd3f741` through the
repository's guarded `pnpm run deploy` command. The complete check passed again.
The [release receipt](release.json) includes the exact source CI and prior
production rollback ID. These documentation additions were not redeployed.

The first public-domain run still received old app/worker assets and failed.
After ordinary-domain HTML revalidation returned `EXPIRED`, its references
matched the new immutable deployment. Only then was the model journey repeated.
No cache-busted URL, cache purge or second deployment was used for acceptance.

The actual [public URL](https://chatgpt.significanthobbies.com) completed the
synthetic ZIP journey in an isolated Chromium browser:

- Real compact model embeddings completed in 5.971 seconds: WASM q8, batch 32,
  all 12 conversations, 12 questions, two fact candidates and 20 topic anchors.
- The herb query returned relevant semantic results. The 390px evidence drawer
  showed readable topic attribution and source titles/dates, with a working close
  control and no horizontal overflow. It is not a full-transcript viewer.
- No snapshot existed before opt-in. Save persisted derived memory; reload
  restored it and a TypeScript query worked. Confirmed forget removed the snapshot,
  and the next reload returned to import.
- Served app, analysis-worker and Transformers assets matched the local deployed
  build byte for byte. The [machine receipt](receipt.json) retains hashes,
  model revision, search output, request metadata and observed errors.

[Desktop output](report-desktop.png) · [Phone-width attribution](evidence-phone.png)

This qualifies the browser-local synthetic experiment, not every capability.
No personal archive, optional generator or POST upload was used. Model/runtime
GET downloads and shared page scripts were allowed; telemetry requests were
blocked. An existing `t.posthog.init is not a function` exception was observed
on page loads and is retained honestly as a separate initialization defect.
Large/split archives, multilingual/cross-browser behavior, physical devices and
failures after GPU initialization remain unqualified under issue #37.

## Analytics follow-up release

Source `0120fdbd70e7457c6b07b150981d33b3f8a457af` was released separately as
production deployment `c9571467-d553-4a15-b801-e2f93f9266d7`, with `c02a7506` as
the retained rollback target. The ordinary custom-domain page served the repaired
bootstrap byte for byte and loaded the real PostHog SDK with no page exception.
Autocapture and automatic pageview remained disabled; the existing API host and
person-profile configuration were unchanged. SDK configuration/event requests
were intercepted, and a synthetic archive sentinel did not appear in captured
request bodies. This does not claim provider event delivery.

[Analytics receipt](analytics-receipt.json) · [390px landing](analytics-landing-phone.png)

The embedding model and archive journey were not rerun for this analytics-only
change. Issue #38 is complete on the actual hosted console acceptance. Issue #37
retains the broader product cases listed above. These documentation changes were
not redeployed.
