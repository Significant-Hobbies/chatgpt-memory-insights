## MODIFIED Requirements

### Requirement: Build a topic graph

The system SHALL organize conversation fingerprints into topic clusters and
relationships, and SHALL distinguish that final semantic topology from any
deterministic graph sketch shown during ingestion.

#### Scenario: Ingestion is still running
- **WHEN** semantic topic assignments are not yet available
- **THEN** the system may show conversation stops connected to disclosed deterministic question-domain routes only when it labels that view as preliminary

#### Scenario: Semantic analysis completes
- **WHEN** at least two conversation fingerprints are embedded
- **THEN** the system replaces the preliminary sketch with cluster nodes, similarity edges, labels, sizes, and representative sources

#### Scenario: Graph is not usable
- **WHEN** a visitor uses a keyboard, screen reader, or reduced visual layout
- **THEN** the same cluster and relationship data is available in a navigable list
