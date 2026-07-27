## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Keep complex history scannable

The system SHALL add longitudinal and strand views to the existing transit-atlas
workbench without removing the graph, search, fact ledger, or accessible lists.

#### Scenario: Wide report
- **WHEN** the report is viewed at desktop width
- **THEN** the evolution rail and evidence field remain jointly scannable without covering core navigation

#### Scenario: Narrow report
- **WHEN** the report is viewed at mobile width
- **THEN** evolution periods, confidence controls, timelines, and strands become labelled vertical rows without horizontal-scroll traps
