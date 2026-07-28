# semantic-memory Specification

## Purpose
TBD - created by archiving change build-browser-memory-atlas. Update Purpose after archive.
## Requirements
### Requirement: Group repeated questions

The system SHALL identify exact and semantically similar recurring user
questions with an embedding model and retain a confidence score for each
semantic group.

#### Scenario: Exact repetition
- **WHEN** normalized user questions match
- **THEN** the system places them in the same repeated-question group without requiring inference

#### Scenario: Semantic repetition
- **WHEN** distinct questions clear the exploratory semantic and lexical grouping floors
- **THEN** the system stores them as a semantic repeat candidate with its members, similarity, and confidence

#### Scenario: Active confidence filters repetition
- **WHEN** a semantic repeat candidate does not clear the visitor's active confidence threshold
- **THEN** the system hides it from the repeated-question report without deleting its evidence

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

### Requirement: Search the derived memory

The system SHALL compare a visitor's query embedding with the current derived
memory index, including topics, repeated questions, fact candidates, and
conversation strands, using the same resolved model profile that built the
index. Each ranked result SHALL retain a bounded answer context, source, and
topic route when one can be attributed without changing rank.

#### Scenario: Search query
- **WHEN** a visitor submits a non-empty query after semantic analysis
- **THEN** the system ranks relevant topics, repeated questions, fact candidates, strands, and representative conversations by hybrid semantic and lexical similarity

#### Scenario: Result has a direct topic
- **WHEN** a ranked result is a topic or sampled conversation
- **THEN** the result retains that topic id and a bounded visitor-authored or descriptive context excerpt

#### Scenario: Result inherits a source topic
- **WHEN** a ranked question, fact, or strand belongs to a conversation that has a sampled topic assignment
- **THEN** the result inherits that conversation topic for traversal without changing its similarity score

#### Scenario: Restored multilingual index
- **WHEN** a visitor searches a restored snapshot built with the multilingual profile
- **THEN** the system loads that snapshot's pinned multilingual model before embedding the query

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

### Requirement: Build a fact-version ledger

The system SHALL detect explicit first-person fact candidates from visitor
messages, preserve likely updates and refutations as version history, and
retain confidence evidence for every inferred transition.

#### Scenario: Current fact candidate
- **WHEN** a visitor-authored first-person statement has no qualified later correction, refutation, or contradiction
- **THEN** the system lists it as current with its date and source conversation

#### Scenario: Updated fact candidate
- **WHEN** a later semantically related statement changes the earlier stated value and the transition clears the active confidence threshold
- **THEN** the system marks the earlier version as superseded and shows both versions chronologically

#### Scenario: Refuted fact candidate
- **WHEN** a later visitor-authored statement explicitly rejects an earlier candidate and the transition clears the active confidence threshold
- **THEN** the system marks the earlier candidate as refuted and links the refuting source

#### Scenario: Possible contradiction
- **WHEN** related first-person statements differ without an explicit update or refutation cue
- **THEN** the system retains a qualified possible-contradiction transition with its similarity, lexical evidence, and sources

#### Scenario: Ambiguous statement
- **WHEN** the system cannot establish a first-person assertion or sufficiently supported change cue
- **THEN** the system excludes the message or transition from conclusions rather than presenting it as fact

### Requirement: Estimate query tone

The system SHALL summarize positive, neutral/direct, and negative wording in
visitor queries using a disclosed local method.

#### Scenario: Tone report
- **WHEN** deterministic analysis completes
- **THEN** the system shows aggregate query-tone counts, proportions, and change over time

#### Scenario: Tone interpretation
- **WHEN** the visitor views query-tone results
- **THEN** the system explains that wording tone is not a personality, mood, or mental-health assessment

### Requirement: Show broader query language signals

The system SHALL classify each visitor query into one dominant, disclosed
language signal: curiosity, frustration, urgency, uncertainty, excitement,
appreciation, or neutral/direct.

#### Scenario: Language-signal report
- **WHEN** deterministic analysis completes
- **THEN** the system shows counts and proportions for each language signal and defines the vocabulary cue it represents

#### Scenario: Overlapping language cues
- **WHEN** a query contains vocabulary from more than one signal
- **THEN** the system applies a stable documented priority rather than counting the query multiple times

#### Scenario: Language-signal interpretation
- **WHEN** the visitor views a language-signal result
- **THEN** the system explains that the result describes wording and does not infer feelings, mood, personality, or mental state

### Requirement: Ask evidence-linked reflection questions

The system SHALL turn bounded, high-confidence history patterns into open
questions that help the visitor review their memory.

#### Scenario: Reflection prompt appears
- **WHEN** a repeated question, memory change, stale memory, qualified wording spike, dormant topic, recurring term, or activity peak crosses its disclosed threshold
- **THEN** the system asks an open question, explains the triggering pattern, and links representative source conversations

#### Scenario: No qualified pattern
- **WHEN** no supported pattern crosses a reflection threshold
- **THEN** the system shows an empty state instead of inventing a reflection prompt

#### Scenario: Visitor opens a reflection
- **WHEN** the visitor activates a reflection card
- **THEN** the system shows the question, trigger, and supporting conversations without presenting the prompt as a conclusion about the visitor

### Requirement: Provide overlapping question-domain lenses

The system SHALL count visitor queries across disclosed math, health,
software, money, career, learning, creative, relationship, travel, and
planning lenses.

#### Scenario: Query matches a lens
- **WHEN** a visitor query matches a disclosed lens pattern
- **THEN** the system includes it in that lens's query count and its conversation in the deduplicated conversation count

#### Scenario: Query spans domains
- **WHEN** a visitor query matches more than one lens
- **THEN** the system includes it in every matching lens rather than forcing an exclusive category

#### Scenario: Visitor opens a lens
- **WHEN** the visitor activates a question-domain lens
- **THEN** the system explains the lens boundary, its counts, and representative source conversations

### Requirement: Surface conservative writing and thread candidates

The system SHALL show likely typo signals and likely multi-thread
conversations using disclosed deterministic rules.

#### Scenario: Likely typo signal
- **WHEN** a query contains a token from the small local misspelling map or an immediately repeated word
- **THEN** the system shows the token, possible correction, count, method, and representative sources without producing a writing-quality score

#### Scenario: Likely thread changes
- **WHEN** an eligible conversation contains several low-overlap changes between substantial adjacent visitor prompts above the disclosed rate threshold
- **THEN** the system shows the conversation, prompt count, likely change count, rough thread estimate, method, and source

#### Scenario: Short follow-up
- **WHEN** an adjacent prompt is too short to establish a subject
- **THEN** the system excludes that transition from the thread-change calculation

