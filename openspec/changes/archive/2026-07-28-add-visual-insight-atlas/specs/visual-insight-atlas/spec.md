## ADDED Requirements

### Requirement: Show a coordinated visual atlas
The system SHALL render distinct visual summaries for recent activity, question
mix, query-language signals, repeated questions, topic momentum, and
conversation shape after a compatible export is ingested.

#### Scenario: Deterministic analysis completes
- **WHEN** compatible conversations have been normalized
- **THEN** the activity, question-mix, language-signal, and conversation-shape visualizations appear before semantic inference completes

#### Scenario: Semantic analysis completes
- **WHEN** embeddings and semantic analysis finish
- **THEN** the repeat landscape adds qualified semantic repeats and the topic-momentum visualization replaces its forming state

#### Scenario: Archive has sparse evidence
- **WHEN** a chart does not have enough qualifying values
- **THEN** the chart shows an honest empty state instead of inventing a pattern

### Requirement: Keep charts interpretable
The system SHALL label each visualization with its metric, time window, method,
and any overlap or inference caveat required to interpret it correctly.

#### Scenario: Question belongs to multiple lenses
- **WHEN** a prompt is counted in more than one question category
- **THEN** the question-mix visualization states that its routes overlap and are not shares of a whole

#### Scenario: Language signal is shown
- **WHEN** lexical language-signal counts are visualized
- **THEN** the interface describes them as query wording signals and does not present them as diagnoses or causes

### Requirement: Filter chronological insights by period
The system SHALL let the visitor select all available history or the recent 3,
6, 12, or 24 months and SHALL refilter chronological visual-atlas values, query
tone, and language-signal summaries without re-reading the ZIP.

#### Scenario: Visitor selects a bounded period
- **WHEN** the visitor chooses a recent-month window
- **THEN** activity, question mix, language signals, query tone, repeats, and topic activity use only stored evidence within that window where exact filtering is supported

#### Scenario: Metric cannot be recomputed for a bounded period
- **WHEN** a lifetime metric lacks sufficient monthly detail in the derived report
- **THEN** the interface keeps the metric unchanged and labels it all-time instead of implying that it was filtered

#### Scenario: Visitor returns to all history
- **WHEN** the visitor chooses all history
- **THEN** every period-aware view returns to its full stored evidence

### Requirement: Link visual summaries to evidence
The system SHALL pair every visualization with a readable data alternative and
provide source access for values that retain source references.

#### Scenario: Visitor uses a chart without visual interpretation
- **WHEN** the visitor opens a chart's readable-data disclosure
- **THEN** the system presents labelled values in text or tabular form

#### Scenario: Visitor opens an evidence-bearing value
- **WHEN** the visitor activates a question lens, language signal, repeat, or topic value
- **THEN** the existing evidence drawer opens with representative source conversations

### Requirement: Preserve browser-only processing
The system SHALL derive and render every visual-atlas value inside the browser
without sending conversation text to an application server.

#### Scenario: Visual atlas renders
- **WHEN** any chart is constructed or filtered
- **THEN** it uses the in-memory or explicitly saved derived report and introduces no new upload or analytics request

### Requirement: Remain usable across report widths
The system SHALL keep chart titles, values, controls, and readable alternatives
usable at narrow, tablet, and wide report widths without page-level horizontal
overflow.

#### Scenario: Narrow viewport
- **WHEN** the report is viewed at 390 CSS pixels
- **THEN** charts reflow or reduce visible periods while their labels and readable alternatives remain available

#### Scenario: Keyboard navigation
- **WHEN** a visitor navigates interactive chart values by keyboard
- **THEN** every action has a visible focus state and an accessible name

### Requirement: Present a period-aware insight story
The system SHALL provide an optional full-screen presentation that derives
descriptive highlights from the current report and selected period.

#### Scenario: Visitor opens Story mode
- **WHEN** the visitor activates the presentation from a completed deterministic report
- **THEN** the system shows a bounded sequence covering scale, activity, query routes, repeats, and language signals, plus topic movement when semantic evidence is available

#### Scenario: Visitor navigates the story
- **WHEN** the visitor uses visible controls, direct slide controls, arrow keys, or Escape
- **THEN** the presentation moves predictably, reports its current position, and returns focus to its launcher when closed

#### Scenario: Reduced motion is preferred
- **WHEN** the visitor's browser requests reduced motion
- **THEN** the presentation removes nonessential transitions and mark animation while preserving every value and control

#### Scenario: Story highlight is inferred
- **WHEN** a slide uses a semantic topic or repeat candidate
- **THEN** it remains subject to the active confidence threshold and offers the same source evidence as the report
