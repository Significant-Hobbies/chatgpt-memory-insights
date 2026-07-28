## MODIFIED Requirements

### Requirement: Filter chronological insights by period

The system SHALL let the visitor select all available history or the recent 3,
6, 12, or 24 months and SHALL refilter chronological visual-atlas values, query
tone, language-signal summaries, the daily calendar, and activity rhythms
without re-reading the ZIP.

#### Scenario: Visitor selects a bounded period
- **WHEN** the visitor chooses a recent-month window
- **THEN** activity, question mix, language signals, query tone, repeats, topic activity, and rhythms use only stored evidence within that window where exact filtering is supported

#### Scenario: Daily period is longer than one year
- **WHEN** the visitor chooses 24 months or all history
- **THEN** the daily calendar represents that selected window inside its own horizontal scroller instead of silently remaining capped at 52 weeks

#### Scenario: Metric cannot be recomputed for a bounded period
- **WHEN** a lifetime metric lacks sufficient monthly detail in the derived report
- **THEN** the interface keeps the metric unchanged and labels it all-time instead of implying that it was filtered

#### Scenario: Visitor returns to all history
- **WHEN** the visitor chooses all history
- **THEN** every period-aware view returns to its full stored evidence

## ADDED Requirements

### Requirement: Compare activity scale over time

The system SHALL show a monthly activity rhythm visualization that can compare
conversation count or approximate words for all conversations or a disclosed
question-domain route.

#### Scenario: Visitor changes the measure
- **WHEN** the visitor selects conversations or approximate words
- **THEN** the plot, selected-period total, peak month, labels, and readable data update from the stored monthly aggregate

#### Scenario: Visitor filters by question route
- **WHEN** the visitor chooses a disclosed question-domain route
- **THEN** the plot uses conversations matching that route and explains that routes overlap and route word totals cover complete matched conversations

#### Scenario: Older snapshot has no rhythm aggregate
- **WHEN** a compatible version-3 snapshot lacks the optional monthly rhythm field
- **THEN** the report shows all-conversation monthly counts and explains that route and word filtering require re-import

#### Scenario: Visitor reads the chart without visual interpretation
- **WHEN** the visitor opens the rhythm chart's readable-data disclosure
- **THEN** the interface lists every visible month and value in text
