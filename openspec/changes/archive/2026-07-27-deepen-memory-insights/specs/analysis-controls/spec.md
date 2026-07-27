## ADDED Requirements

### Requirement: Choose an embedding language profile

The system SHALL offer automatic, compact-English, and multilingual semantic
model profiles before import.

#### Scenario: Automatic profile with non-Latin script
- **WHEN** automatic mode detects a material share of supported non-Latin-script text in the parsed prompts
- **THEN** the system selects the pinned multilingual model and explains the choice before model loading

#### Scenario: Automatic profile with Latin-script history
- **WHEN** automatic mode does not detect a material non-Latin-script share
- **THEN** the system selects the compact English model and explains that visitors with non-English Latin-script histories can choose multilingual explicitly

#### Scenario: Visitor selects multilingual
- **WHEN** the visitor chooses the multilingual profile
- **THEN** the system uses the pinned browser-compatible multilingual embedding model and discloses its approximate download size

#### Scenario: Model profile fails
- **WHEN** the selected model cannot download or run
- **THEN** deterministic insights remain available and the report explains which model profile failed

### Requirement: Tune evidence confidence

The system SHALL provide exploratory, balanced, and conservative confidence
presets backed by a visible numeric threshold.

#### Scenario: Visitor changes confidence before import
- **WHEN** the visitor selects a preset or adjusts the threshold
- **THEN** the system uses that policy for the initial presentation of semantic repeats, memory changes, strand boundaries, and reflection prompts

#### Scenario: Visitor changes confidence after analysis
- **WHEN** the visitor changes the confidence policy on a completed report
- **THEN** the system refilters stored candidates immediately without re-embedding or changing deterministic totals

#### Scenario: Confidence is interpreted
- **WHEN** the visitor views the control
- **THEN** the system explains that higher confidence shows fewer, stronger candidates and does not make the underlying method certain

### Requirement: Keep analysis settings inspectable

The system SHALL show the requested model profile, resolved model, revision,
confidence threshold, and sampling bounds in the completed report.

#### Scenario: Analysis completes
- **WHEN** semantic processing succeeds
- **THEN** the methodology summary names the selected and resolved profiles, exact model revision, active confidence, and analyzed candidate counts
