# insight-report Specification

## Purpose
TBD - created by archiving change build-browser-memory-atlas. Update Purpose after archive.
## Requirements
### Requirement: Show deterministic insights first

The system SHALL produce an insight report before semantic inference completes.

#### Scenario: Parsing completes
- **WHEN** compatible conversations have been normalized
- **THEN** the system shows totals, time range, activity, depth, model mix, lexical repeats, and recurring terms

#### Scenario: Semantic model fails
- **WHEN** the embedding model cannot download or run
- **THEN** the deterministic report remains usable and the failure is explained

### Requirement: Trace insights to source conversations

The system SHALL provide representative supporting conversations for recurrence
and topic claims.

#### Scenario: Visitor opens an insight
- **WHEN** a visitor expands a repeated question or recurring topic
- **THEN** the system shows representative conversation titles and dates that contributed to it

### Requirement: Explain bounded analysis

The system SHALL disclose when semantic analysis samples an export.

#### Scenario: Candidate cap is exceeded
- **WHEN** the export contains more candidates than the semantic-analysis cap
- **THEN** the report states the analyzed and total candidate counts and the sampling strategy

