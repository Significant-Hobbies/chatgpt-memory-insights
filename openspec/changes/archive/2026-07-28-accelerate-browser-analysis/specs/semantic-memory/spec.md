## MODIFIED Requirements

### Requirement: Bound model work

The system SHALL cap and prioritize conversation, question, fact, and strand
embedding candidates for large exports, and SHALL preserve that selected
candidate coverage across supported inference runtimes and batch sizes.

#### Scenario: Large candidate set
- **WHEN** any semantic candidate class exceeds its configured cap
- **THEN** the system preserves recent, recurrent, time-distributed, or strongest deterministic candidates as appropriate and reports analyzed versus total counts

#### Scenario: Runtime or batch changes
- **WHEN** the system selects WebGPU, falls back to WASM, or changes batch size after memory pressure
- **THEN** it embeds the same selected candidates in the same order and reports unchanged analyzed-versus-total counts
