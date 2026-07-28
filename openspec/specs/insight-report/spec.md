# insight-report Specification

## Purpose
TBD - created by archiving change build-browser-memory-atlas. Update Purpose after archive.
## Requirements
### Requirement: Show deterministic insights first

The system SHALL produce a visually scannable insight report before semantic
inference completes.

#### Scenario: Parsing completes
- **WHEN** compatible conversations have been normalized
- **THEN** the system shows totals, time range, activity, depth, model mix, lexical repeats, recurring terms, and deterministic visual-atlas views

#### Scenario: Semantic model fails
- **WHEN** the embedding model cannot download or run
- **THEN** the deterministic report and its visual summaries remain usable and the failure is explained

### Requirement: Trace insights to source conversations

The system SHALL provide representative supporting conversations and ordered
evidence for recurrence, topic, evolution, memory-change, and strand claims.

#### Scenario: Visitor opens an insight
- **WHEN** a visitor expands a repeated question, evolving topic, memory timeline, or conversation strand
- **THEN** the system shows representative conversation titles, dates, confidence evidence, and relevant prompt excerpts where available

### Requirement: Explain bounded analysis

The system SHALL disclose semantic sampling, selected and resolved model
profiles, approximate model download, and the active confidence policy.

#### Scenario: Candidate cap is exceeded
- **WHEN** the export contains more candidates than any semantic-analysis cap
- **THEN** the report states analyzed and total candidate counts and the sampling strategy

#### Scenario: Visitor changes confidence
- **WHEN** the visitor changes the confidence policy after analysis
- **THEN** the report updates visible candidate counts and preserves a methodology note explaining that evidence was refiltered rather than recomputed

### Requirement: Keep complex history scannable

The system SHALL add longitudinal, strand, and visual-atlas views to the
existing transit-atlas workbench without removing the graph, search, fact
ledger, or accessible lists.

#### Scenario: Wide report
- **WHEN** the report is viewed at desktop width
- **THEN** the visual atlas, evolution rail, and evidence field maintain a clear hierarchy without covering core navigation

#### Scenario: Narrow report
- **WHEN** the report is viewed at mobile width
- **THEN** charts, evolution periods, confidence controls, timelines, and strands become labelled vertical or compact views without page-level horizontal-scroll traps

#### Scenario: Existing saved snapshot has no daily aggregate
- **WHEN** a compatible version-3 snapshot created before the visual atlas is restored
- **THEN** all available report views render and only the daily calendar asks the visitor to re-import for that added detail

### Requirement: Prioritize durable report content

The system SHALL keep one-time operational details available without
permanently placing them ahead of the report's durable insights.

#### Scenario: Semantic analysis is still running
- **WHEN** the deterministic report is visible while semantic work continues
- **THEN** the analysis-details disclosure remains open and reports live timing

#### Scenario: Analysis completes
- **WHEN** the full report is ready
- **THEN** timing, model, and confidence controls remain available in a closed analysis-details disclosure whose summary states the current execution time and confidence

#### Scenario: Visitor searches memory
- **WHEN** the visitor reaches the semantic topic-map workbench
- **THEN** one memory search form appears with the map and no duplicate sticky search form remains above the overview

### Requirement: Keep navigation and evidence readable

The system SHALL keep the report route rail and evidence drawer legible across
long reports and long source content.

#### Scenario: Visitor moves through report sections
- **WHEN** a report section becomes the active reading region
- **THEN** the matching route-rail link receives a visible current-location state and `aria-current="location"`

#### Scenario: Visitor opens evidence
- **WHEN** a chart, lens, memory, repeat, or search result opens source evidence
- **THEN** explanatory notes and source rows are visibly grouped with sufficient spacing while focus is trapped in the modal drawer

#### Scenario: Narrow viewport
- **WHEN** the report is viewed at mobile width
- **THEN** the route rail becomes the existing horizontal route strip and the evidence drawer remains full-width without page overflow

