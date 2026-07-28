## MODIFIED Requirements

### Requirement: Show staged analysis timing

The system SHALL show elapsed and estimated remaining time for archive
discovery, parsing, deterministic statistics, model preparation, embedding,
and semantic assembly while analysis runs, and SHALL pair those stages with a
progressive conversation-graph sketch that does not delay completion.

#### Scenario: Stage begins
- **WHEN** analysis enters a new stage
- **THEN** the interface names the stage, starts its elapsed timer, and marks earlier stages complete with their measured durations

#### Scenario: Remaining time is not yet stable
- **WHEN** the current stage has insufficient progress to estimate throughput
- **THEN** the interface says it is estimating rather than displaying invented precision

#### Scenario: Remaining time is measurable
- **WHEN** the current stage has processed enough byte or candidate units
- **THEN** the interface shows a rounded remaining-time estimate derived from observed throughput

#### Scenario: Graph formation runs beside timing
- **WHEN** normalized conversations become available during parsing
- **THEN** the interface advances the graph sketch while timing and worker analysis continue independently

#### Scenario: Formation animation is incomplete at analysis completion
- **WHEN** the final semantic report becomes ready before every queued visual transition has played
- **THEN** the system completes the report immediately and replaces the sketch without waiting for the remaining animation
