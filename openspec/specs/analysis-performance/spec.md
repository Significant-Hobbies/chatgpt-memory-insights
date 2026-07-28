# analysis-performance Specification

## Purpose
TBD - created by archiving change accelerate-browser-analysis. Update Purpose after archive.
## Requirements
### Requirement: Show staged analysis timing

The system SHALL show elapsed and estimated remaining time for archive
discovery, parsing, deterministic statistics, model preparation, embedding,
and semantic assembly while analysis runs.

#### Scenario: Stage begins
- **WHEN** analysis enters a new stage
- **THEN** the interface names the stage, starts its elapsed timer, and marks earlier stages complete with their measured durations

#### Scenario: Remaining time is not yet stable
- **WHEN** the current stage has insufficient progress to estimate throughput
- **THEN** the interface says it is estimating rather than displaying invented precision

#### Scenario: Remaining time is measurable
- **WHEN** the current stage has processed enough byte or candidate units
- **THEN** the interface shows a rounded remaining-time estimate derived from observed throughput

### Requirement: Distinguish first insight from complete analysis

The system SHALL keep the deterministic report usable during semantic work and
SHALL show when initial insight became available separately from total
completion.

#### Scenario: Deterministic report is ready
- **WHEN** parsing and deterministic statistics complete
- **THEN** the report appears with an “Initial insights ready in” duration while semantic timing continues

#### Scenario: Semantic report completes
- **WHEN** embedding, clustering, indexing, and final report assembly finish
- **THEN** the report shows one distinct end-to-end total that includes model loading and downloading

### Requirement: Preserve analysis coverage while accelerating inference

The system SHALL preserve the same ordered semantic input set, pinned model,
pooling, normalization, and downstream algorithms when changing inference
device or batch size.

#### Scenario: Accelerated runtime succeeds
- **WHEN** WebGPU is available and the pinned feature-extraction pipeline completes its first batch
- **THEN** the system processes every selected semantic candidate on WebGPU and records the runtime and batch size

#### Scenario: Accelerated runtime fails
- **WHEN** WebGPU initialization or first inference fails
- **THEN** the system automatically retries the complete ordered input set through WASM without reducing candidate coverage

#### Scenario: Batch memory pressure
- **WHEN** a selected batch cannot be allocated
- **THEN** the system retries with a smaller bounded batch without skipping inputs

### Requirement: Report measured performance honestly

The system SHALL label performance using measurements from the current run and
SHALL NOT claim a universal speed multiplier.

#### Scenario: Final timing summary
- **WHEN** analysis completes
- **THEN** the interface shows total time, first-insight time, model time, semantic time, runtime, batch size, and embedded-versus-total candidate coverage

#### Scenario: Restored report
- **WHEN** a saved report with performance metadata is restored
- **THEN** the interface labels those durations as the original analysis run

