# private-persistence Specification

## Purpose
TBD - created by archiving change build-browser-memory-atlas. Update Purpose after archive.
## Requirements
### Requirement: Persist nothing by default

The system SHALL keep imported and derived data in transient browser memory
unless the visitor explicitly saves it.

#### Scenario: Visitor closes an unsaved report
- **WHEN** the visitor has not chosen to keep the memory
- **THEN** no application snapshot is available on the next visit

### Requirement: Save a derived memory snapshot

The system SHALL offer an explicit action that saves a versioned derived
snapshot to browser storage without saving the source ZIP.

#### Scenario: Visitor chooses keep
- **WHEN** the visitor confirms “Keep on this device”
- **THEN** the system stores the derived report and semantic index in IndexedDB and shows its saved state

### Requirement: Forget saved memory

The system SHALL provide a prominent action to delete the local snapshot.

#### Scenario: Visitor chooses forget
- **WHEN** the visitor confirms the forget action
- **THEN** the system deletes the product's IndexedDB data and returns to the import state

### Requirement: Reject incompatible snapshots

The system SHALL fail closed when saved data uses an unsupported schema.

#### Scenario: Snapshot version mismatch
- **WHEN** a stored snapshot cannot be read by the current application version
- **THEN** the system asks for a fresh import without attempting an implicit migration

