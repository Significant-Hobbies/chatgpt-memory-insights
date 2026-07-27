# thread-segmentation Specification

## Purpose
TBD - created by archiving change deepen-memory-insights. Update Purpose after archive.
## Requirements
### Requirement: Segment eligible conversations into strands

The system SHALL use chronological prompt boundaries, lexical overlap, and
bounded semantic similarity to split eligible conversations into inspectable
topic strands.

#### Scenario: Strong subject boundary
- **WHEN** two substantial adjacent prompts have low lexical continuity and low semantic similarity above the active boundary-confidence threshold
- **THEN** the system starts a new strand and records the boundary score and both prompt snippets

#### Scenario: Short contextual follow-up
- **WHEN** an adjacent prompt is too short to establish a subject independently
- **THEN** the system keeps it with the surrounding strand and does not create a boundary

#### Scenario: Semantic analysis is unavailable
- **WHEN** the embedding model fails or the conversation is outside the semantic cap
- **THEN** the deterministic likely-thread candidate remains available without claiming a semantic segmentation

### Requirement: Explain every strand

The system SHALL label each strand with deterministic distinctive terms and
show its prompt range and source evidence.

#### Scenario: Visitor opens a segmented conversation
- **WHEN** the visitor activates a thread candidate
- **THEN** the system shows ordered strand labels, prompt counts, date range, representative prompt snippets, and boundary confidence

#### Scenario: Confidence setting changes
- **WHEN** the visitor raises or lowers the confidence threshold after analysis
- **THEN** the system merges or reveals stored boundaries without downloading a model or re-reading the ZIP

### Requirement: Bound thread embedding work

The system SHALL prioritize likely multi-thread candidates and cap the number
of prompts embedded for strand analysis.

#### Scenario: Thread candidates exceed the cap
- **WHEN** eligible candidate prompts exceed the configured thread-analysis cap
- **THEN** the system preserves the strongest deterministic candidates, samples long conversations in order, and discloses analyzed versus total prompts

