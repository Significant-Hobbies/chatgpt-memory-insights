# progressive-conversation-graph Specification

## Purpose
Show how every parsed conversation contributes to the browser-built memory map
before the final embedding-backed topology is ready.
## Requirements
### Requirement: Show conversations forming a graph during ingestion

The system SHALL show a progressive deterministic route sketch while
conversations are normalized and semantic analysis is incomplete.

#### Scenario: Conversation batch is parsed
- **WHEN** the worker normalizes one or more conversations from an export chunk
- **THEN** the interface queues one distinct visual stop for every conversation and connects it to each matching disclosed question-domain route

#### Scenario: Conversation has no matching route
- **WHEN** no disclosed question-domain rule matches a conversation's visitor prompts
- **THEN** the interface adds that conversation to a labelled other route instead of omitting it

#### Scenario: Sketch is visible
- **WHEN** the formation canvas is shown
- **THEN** the interface labels it as a deterministic ingestion sketch, shows the cumulative conversation count and latest added title, and explains that semantic topology is still being computed

### Requirement: Preserve formation continuity

The system SHALL keep the same formation state visible as analysis moves from
initial parsing to the deterministic report.

#### Scenario: Initial insights become ready
- **WHEN** deterministic analysis completes while semantic analysis continues
- **THEN** the interface moves the existing formation surface into the topic-map loading region without clearing its accumulated stops or restarting its queue

#### Scenario: Semantic graph completes
- **WHEN** semantic topics and edges are ready
- **THEN** the interface replaces the preliminary sketch with the final embedding-backed graph and does not delay report completion for animation

### Requirement: Bound and adapt formation rendering

The system SHALL render graph formation without materially expanding analysis
work or browser memory.

#### Scenario: Large formation queue
- **WHEN** received conversations exceed what can be shown one per animation frame within the bounded formation window
- **THEN** the renderer processes multiple ordered conversations per frame while retaining one distinct point per conversation

#### Scenario: Reduced motion is requested
- **WHEN** the visitor prefers reduced motion
- **THEN** the renderer displays each received batch in its accumulated state without stagger or crossfade

#### Scenario: Analysis is reset or cancelled
- **WHEN** the visitor resets or cancels analysis
- **THEN** the renderer cancels its animation frame, clears transient graph state, and releases retained conversation metadata

#### Scenario: Saved report is restored
- **WHEN** a completed version-3 snapshot is restored
- **THEN** the system skips graph formation and renders the saved semantic graph directly
