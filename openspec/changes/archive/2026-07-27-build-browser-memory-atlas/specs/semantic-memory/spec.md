## ADDED Requirements

### Requirement: Group repeated questions

The system SHALL identify exact and semantically similar recurring user
questions with an embedding model.

#### Scenario: Exact repetition
- **WHEN** normalized user questions match
- **THEN** the system places them in the same repeated-question group without requiring inference

#### Scenario: Semantic repetition
- **WHEN** distinct questions clear the semantic and lexical grouping thresholds
- **THEN** the system suggests them as a semantic repeat group and shows its members

### Requirement: Build a topic graph

The system SHALL organize conversation fingerprints into topic clusters and
relationships.

#### Scenario: Semantic analysis completes
- **WHEN** at least two conversation fingerprints are embedded
- **THEN** the system renders cluster nodes, similarity edges, labels, sizes, and representative sources

#### Scenario: Graph is not usable
- **WHEN** a visitor uses a keyboard, screen reader, or reduced visual layout
- **THEN** the same cluster and relationship data is available in a navigable list

### Requirement: Search the derived memory

The system SHALL compare a visitor's query embedding with the current derived
memory index, including topics, repeated questions, and fact candidates.

#### Scenario: Search query
- **WHEN** a visitor submits a non-empty query after semantic analysis
- **THEN** the system ranks relevant topics, repeated questions, fact candidates, and representative conversations by similarity

### Requirement: Bound model work

The system SHALL cap and prioritize embedding candidates for large exports.

#### Scenario: Large candidate set
- **WHEN** the number of questions or conversations exceeds the configured cap
- **THEN** the system preserves recent, recurrent, and time-distributed candidates and reports the sample

### Requirement: Build a fact-version ledger

The system SHALL detect explicit first-person fact candidates from visitor
messages and preserve likely updates and refutations as version history.

#### Scenario: Current fact candidate
- **WHEN** a visitor-authored first-person statement has no later correction or refutation
- **THEN** the system lists it as current with its date and source conversation

#### Scenario: Updated fact candidate
- **WHEN** a later semantically related statement changes the earlier stated value
- **THEN** the system marks the earlier version as superseded and shows both versions chronologically

#### Scenario: Refuted fact candidate
- **WHEN** a later visitor-authored statement explicitly rejects an earlier candidate
- **THEN** the system marks the earlier candidate as refuted and links the refuting source

#### Scenario: Ambiguous statement
- **WHEN** the system cannot establish a first-person assertion or change cue
- **THEN** the system excludes the message from the ledger rather than presenting it as fact

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
