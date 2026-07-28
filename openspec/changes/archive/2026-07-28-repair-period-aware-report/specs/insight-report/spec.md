## ADDED Requirements

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
