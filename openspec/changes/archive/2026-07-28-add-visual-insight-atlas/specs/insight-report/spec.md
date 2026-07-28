## MODIFIED Requirements

### Requirement: Show deterministic insights first

The system SHALL produce a visually scannable insight report before semantic
inference completes.

#### Scenario: Parsing completes
- **WHEN** compatible conversations have been normalized
- **THEN** the system shows totals, time range, activity, depth, model mix, lexical repeats, recurring terms, and deterministic visual-atlas views

#### Scenario: Semantic model fails
- **WHEN** the embedding model cannot download or run
- **THEN** the deterministic report and its visual summaries remain usable and the failure is explained

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
