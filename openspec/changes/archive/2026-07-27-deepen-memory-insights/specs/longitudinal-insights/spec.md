## ADDED Requirements

### Requirement: Show how topics evolve

The system SHALL aggregate sampled topic assignments into chronological periods
and label substantial topic movement as emerging, fading, resurfacing, or
steady using disclosed local rules.

#### Scenario: Topic gains recent activity
- **WHEN** a topic has enough evidence and its recent share materially exceeds its earlier share
- **THEN** the system labels it emerging and shows the periods and source conversations supporting the change

#### Scenario: Topic disappears and returns
- **WHEN** a topic has qualified activity, a substantial quiet period, and qualified later activity
- **THEN** the system labels it resurfacing and shows the gap without claiming why it returned

#### Scenario: Topic evidence is sparse
- **WHEN** a topic does not have enough time-distributed evidence
- **THEN** the system labels it steady or insufficient rather than inventing a trend

### Requirement: Show how question domains and wording change

The system SHALL provide chronological counts for question-domain lenses and
visitor-query language signals.

#### Scenario: Visitor selects an evolving lens
- **WHEN** the visitor opens a domain or language-signal trend
- **THEN** the system shows period counts, a plain-language change description, and representative source conversations

#### Scenario: Overlapping domain query
- **WHEN** one query belongs to multiple domain lenses
- **THEN** the system preserves the existing overlapping counts in every period

### Requirement: Show memory-change timelines

The system SHALL present qualified fact updates, explicit rejections, and
possible contradictions as chronological evidence chains.

#### Scenario: Qualified memory change
- **WHEN** a fact group contains a later update or explicit rejection above the active confidence threshold
- **THEN** the system shows every retained version in order with cue, date, confidence, and source

#### Scenario: Possible contradiction
- **WHEN** semantically related statements differ but do not contain an explicit update or rejection cue
- **THEN** the system may show a possible-contradiction event with lower confidence and wording that asks the visitor to decide which statement is current

#### Scenario: Confidence threshold hides a transition
- **WHEN** a memory transition does not clear the active threshold
- **THEN** the report excludes that transition from conclusions while retaining the underlying source evidence in the derived snapshot
