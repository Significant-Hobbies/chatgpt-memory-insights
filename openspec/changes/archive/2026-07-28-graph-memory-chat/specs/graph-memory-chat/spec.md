## ADDED Requirements

### Requirement: Ask the derived memory conversationally

The system SHALL let a visitor ask a conversational question after semantic
analysis and SHALL ground the answer in a bounded retrieval pack from the
derived memory index.

#### Scenario: Supported memory question
- **WHEN** the visitor submits a question after enabling local chat
- **THEN** the system retrieves at most six ranked evidence excerpts and asks the local model to answer only from those labelled excerpts

#### Scenario: Evidence is insufficient
- **WHEN** the retrieved pack does not support an answer
- **THEN** the system presents the available matches and directs the local model to say that the memory evidence is insufficient

#### Scenario: Follow-up question
- **WHEN** the visitor asks a follow-up in the same panel
- **THEN** the system includes at most four recent conversational turns while retrieving fresh evidence for the new question

### Requirement: Show graph traversal before the answer

The system SHALL show how a question routes through the semantic graph and
source evidence before displaying generated synthesis.

#### Scenario: Topic-backed results
- **WHEN** retrieved evidence maps to semantic topics
- **THEN** the graph shows a temporary query interchange, highlights at most four traversed topic nodes, and lists the matched source stops in rank order

#### Scenario: Evidence has no topic
- **WHEN** a retrieved result cannot be attributed to a sampled topic
- **THEN** the traversal ledger labels it as an evidence-only stop rather than inventing a graph edge

#### Scenario: Reduced motion
- **WHEN** the visitor prefers reduced motion
- **THEN** the final traversed route appears without animated path drawing or pulsing

### Requirement: Keep generated answers inspectable

The system SHALL present local-model prose as synthesis and SHALL preserve the
retrieval evidence separately.

#### Scenario: Answer completes
- **WHEN** local generation succeeds
- **THEN** the answer remains labelled as local synthesis, includes bracketed evidence references when produced, and keeps every retrieved source available for inspection

#### Scenario: Generation fails
- **WHEN** the small model cannot load or generate
- **THEN** the system keeps the traversal and evidence pack visible and reports the generation failure without discarding the searchable map

#### Scenario: Generated claim
- **WHEN** the local model produces an answer
- **THEN** the system does not add that answer to facts, graph edges, saved memory, or confidence calculations

### Requirement: Bound browser model resources

The system SHALL load the small generative model only after explicit visitor
activation and SHALL provide deterministic resource cleanup.

#### Scenario: Visitor enables Memory Chat
- **WHEN** the visitor activates the disclosed model control
- **THEN** the system shows the pinned model, approximate download, loading progress, runtime, and limitations before enabling questions

#### Scenario: Visitor unloads the model
- **WHEN** the visitor activates “Unload model,” resets the report, or leaves the page
- **THEN** the dedicated generation worker terminates and releases its model and inference buffers

#### Scenario: Another tab owns analysis
- **WHEN** a second tab attempts to analyze while another tab retains the model lease
- **THEN** the second tab does not parse the archive or load a model and explains how to release the active tab

### Requirement: Make comparisons evidence-based

The system SHALL describe Memory Chat as an evidence-first prototype and SHALL
not claim superiority over undisclosed current ChatGPT internals.

#### Scenario: Visitor opens the architecture comparison
- **WHEN** the visitor reviews why the prototype differs
- **THEN** the system compares visible routes, citations, change history, local execution, and resource controls, and qualifies any legacy-memory statement with an official source
