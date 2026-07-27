## MODIFIED Requirements

### Requirement: Save a derived memory snapshot

The system SHALL offer an explicit action that saves a versioned derived
snapshot, including its model profile, confidence policy, timelines, and
conversation strands, to browser storage without saving the source ZIP.

#### Scenario: Visitor chooses keep
- **WHEN** the visitor confirms “Keep on this device”
- **THEN** the system stores the derived report, semantic index, model metadata, confidence settings, timelines, and strands in IndexedDB and shows its saved state

### Requirement: Reject incompatible snapshots

The system SHALL fail closed when saved data uses an unsupported schema or
lacks the model metadata required to search its semantic index safely.

#### Scenario: Snapshot version mismatch
- **WHEN** a stored snapshot cannot be read by the current application version
- **THEN** the system removes the incompatible snapshot and asks for a fresh import without attempting an implicit migration

#### Scenario: Snapshot model metadata is incomplete
- **WHEN** a stored semantic index does not identify the pinned model profile and revision that created it
- **THEN** the system rejects semantic restore rather than embedding searches with an incompatible model
