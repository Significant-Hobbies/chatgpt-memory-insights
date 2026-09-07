# Memory Map

Memory Map turns a ChatGPT data-export ZIP into a private, searchable memory
atlas in the browser. It shows topic relationships, repeated questions,
question-domain lenses, likely typo and thread-change candidates, first-person
fact candidates and changes, query-language signals, activity rhythms, and
evidence-linked questions worth revisiting. Longitudinal views show which
topics, question domains, and language signals are emerging, fading, steady, or
resurfacing, while confidence controls let the visitor decide how much inferred
evidence to show.

The archive is parsed in a web worker. Conversation text is never sent to an
application server, nothing is persisted by default, and the original ZIP is
never stored. Semantic grouping and search use a pinned browser-loaded
embedding model. Automatic mode uses compact English-focused
`Xenova/all-MiniLM-L6-v2` for predominantly Latin-script histories and can
select `Xenova/paraphrase-multilingual-MiniLM-L12-v2` for multilingual
histories. The visitor can override that choice before import.

Production: <https://chatgpt.significanthobbies.com>

The public `/about` capability atlas explains all 51 current product
capabilities, the browser-only data path, intended and unsupported use cases,
and the complete path from ChatGPT export to searchable memory.

Analysis is progressive: deterministic insights appear first, while a six-stage
route shows elapsed time and an estimated wait for semantic mapping. The
completed report collapses its one-time timing, model, and confidence controls
into an analysis receipt instead of leaving setup chrome in the reading path.
The receipt includes archive parsing, model download and preparation,
embeddings, and report assembly. Supported compact-model runs use WebGPU
acceleration after checking that an adapter is available, or WebAssembly
compatibility mode. A failure after GPU initialization is not yet a qualified
recovery path.

The report period controls exact calendar windows, including inactive months.
It updates the daily activity calendar, topic movement, query tone, language
signals, and a filterable monthly cadence graph that can compare conversation
count or approximate word count for all conversations or one overlapping
question route. Search lives with the semantic topic map where its results are
explained by graph and source evidence.

During ingestion, every parsed conversation becomes a distinct stop in a live
deterministic route sketch. The same canvas moves into the report while
embeddings finish, then yields to the final semantic topic graph without
delaying analysis.

After analysis, Memory Chat can optionally load the pinned
`Xenova/LaMini-Flan-T5-77M` q8 model in a dedicated browser worker. Every
question visibly traverses the semantic graph, the model receives at most six
labelled evidence excerpts, and the app withholds drafts that do not cite those
retrieved stops. The generator can be unloaded independently and its prose is
never promoted into saved memory.

## Get your ChatGPT export

In ChatGPT, open your profile menu and choose **Settings → Data controls →
Export data → Export**, then confirm the request. OpenAI sends an email or SMS
when the export is ready; download the ZIP and import it without unzipping it.
Exports can take up to seven days, and the download link expires after 24
hours. See OpenAI's
[official export instructions](https://help.openai.com/en/articles/7260999-how-do-i-export-my-chatgpt-history-and-data)
or use the [Privacy Portal](https://privacy.openai.com/).

## Pack your Claude Code and Codex sessions

`memory-pack` turns the transcripts Claude Code and Codex already keep in
`~/.claude` and `~/.codex` into an archive Memory Map reads through the same
path as a ChatGPT export. It packs your prompts and the assistant's replies and
leaves tool calls, tool output, reasoning traces, and file contents behind, so
gigabytes of transcripts become an archive of a few megabytes. It also reads
the prompt history both CLIs keep for sessions they have already pruned, which
reaches back much further than the transcripts do. It makes no network calls
and masks credential-shaped tokens before writing.

```bash
curl -fsSL https://chatgpt.significanthobbies.com/install.sh | sh

memory-pack --dry-run --list   # see what would be packed
memory-pack                    # write memory-pack-<date>.zip
```

Source, options, and the full account of what is kept and dropped are in
[`packer/`](packer/README.md).

## Develop

```bash
pnpm install
pnpm run dev
```

## Verify

```bash
pnpm run check
```

This runs the repository's full Fleet quality boundary: formatting and lint,
Astro/TypeScript checks, 66 tests with coverage floors, Knip unused-code and
cycle checks, complexity, exact duplication, dependency advisories,
suppression and repository hygiene checks, and the production build. Existing
debt is regression-gated by the checked-in quality scripts; historical context
is in [issue #12](https://github.com/Significant-Hobbies/chatgpt-memory-insights/issues/12).

`pnpm run test:import` additionally tests the built app in isolated Chromium
(install with `pnpm exec playwright install chromium` if needed). It constructs
a synthetic ZIP and blocks external requests. The actual worker produces one
conversation's statistics; a model download failure now remains visible, stops
the running-state copy, disables unavailable search/save controls, and allows
retry without discarding the readable statistics. Checks run at 390 px and
1280 px and are included in CI. Playwright is a development-only dependency.

## Task reconciliation (2026-09-07)

This audit began with zero open issues and PRs; none were closed. Remaining
qualification is [#37](https://github.com/Significant-Hobbies/chatgpt-memory-insights/issues/37):
large/split archives,
multilingual/cross-browser behavior, and failures after GPU initialization.
[Local synthetic qualification](docs/qualification/2026-09-07/README.md) now
proves real compact-model import/search, explicit save, reload/restore, and
forget. [Hosted synthetic verification](docs/qualification/2026-09-07/hosted/README.md)
now passes on deployed source `3417cca`; the initial stale-asset failure and
separate PostHog initialization exception are retained in that receipt. The
offline import regression remains a separate failure-path check.
[PostHog bootstrap repair #38](https://github.com/Significant-Hobbies/chatgpt-memory-insights/issues/38)
is now deployed as `0120fdb` / `c9571467`. The ordinary public page loads the
real SDK without initialization exceptions, and its bootstrap matches source.
[Hosted analytics receipt](docs/qualification/2026-09-07/hosted/analytics-receipt.json)
records unchanged analytics configuration and intercepted telemetry; provider
event delivery is not claimed. Issue #38 is complete; #37 remains open.

No private archive or hosted archive upload was used; the approved production
release is recorded separately from the earlier local repair.

## Deploy

Production deployment is intentionally manual and guarded:

```bash
pnpm run deploy
```

The deploy command only runs from a clean `main` branch that matches
`origin/main`.
