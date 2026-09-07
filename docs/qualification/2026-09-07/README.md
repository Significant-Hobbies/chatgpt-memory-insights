# Local model-backed qualification — 2026-09-07

The actual built application imported the [synthetic ZIP](synthetic.zip) in an
isolated Playwright Chromium browser with no GPU flags. It contains twelve
invented user questions: six about balcony herbs and six about TypeScript
unit testing. No private archive or hosted upload was used.

Before repair, `navigator.gpu` existed but `requestAdapter` returned no adapter.
The first WebGPU model initialization rejected. Pinned Transformers.js 3.8.1
retains that rejected session promise in its module-level `wasmInitPromise`,
so the subsequent WASM attempt failed with the original WebGPU error. The app
now requests an actual high-performance adapter before choosing WebGPU; null,
missing, and rejected adapter requests choose WASM before model initialization.
This does not repair every initialization or mid-session GPU failure.

## Actual results

- The pinned `Xenova/all-MiniLM-L6-v2` revision
  `751bff37182d3f1213fa05d7196b954e230abad9` completed in approximately four
  seconds using WASM, q8, batch size 32. The model artifact is 22,972,370 bytes.
- All 12 conversations, 12 questions, two fact candidates and 20 topic anchors
  were embedded. Topic labels included Food & cooking / Balcony and
  Research & analysis / Testing; labels remain inferences.
- Searching “watering herbs in containers” returned the basil watering question
  at 53.7% similarity. [Search screenshot](search.png) records the actual output.
- Before opt-in, the snapshot key was absent. Clicking “Keep on this device”
  wrote a version-3 snapshot containing `report`, `searchIndex`, and
  `lexicalIndex`; the original ZIP was not a snapshot field. Reload restored
  the report and a TypeScript query returned matching results.
- Confirming forget removed the snapshot. A subsequent reload returned to
  import and the snapshot key was absent.
- [Desktop report](report-top.png) shows completion and exact candidate coverage.
  [Phone-width evidence drawer](evidence-phone.png) shows readable source titles
  and dates; close worked and no horizontal overflow was observed. This extra
  drawer inspection restored the previously produced real snapshot into an
  isolated browser with all external requests blocked, avoiding another model
  download. It is attribution, not full-transcript inspection.

The [machine receipt](receipt.json) records runtime, search output, persistence,
input/output hashes and network request metadata. Only public model/runtime GET
requests were allowed. Shared promotional scripts and existing telemetry POST
attempts were blocked; no archive text was uploaded. The optional chat generator
was never loaded. Temporary browser contexts, servers and full scratch outputs
were removed after retaining these compact artifacts.

## Checks and remaining acceptance

`pnpm run check` passed all repository quality gates and 66 tests; the unchanged
`pnpm run test:import` passed at 390/1280 pixels. Adapter tests cover missing,
null, rejected and available adapters. Existing build-tool advisories remain
within the repository's accepted dependency baseline.

Issue [#37](https://github.com/Significant-Hobbies/chatgpt-memory-insights/issues/37)
remains open for hosted verification after authorized deployment, large/split
archives, multilingual and cross-browser behavior, and post-initialization GPU
failure recovery. No deployment, physical-phone test, optional generator run or
whole-product sharing qualification is claimed.
