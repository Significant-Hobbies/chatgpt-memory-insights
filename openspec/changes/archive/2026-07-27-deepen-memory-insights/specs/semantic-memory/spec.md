## MODIFIED Requirements

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

### Requirement: Search the derived memory

The system SHALL compare a visitor's query embedding with the current derived
memory index, including topics, repeated questions, fact candidates, and
conversation strands, using the same resolved model profile that built the
index.

#### Scenario: Search query
- **WHEN** a visitor submits a non-empty query after semantic analysis
- **THEN** the system ranks relevant topics, repeated questions, fact candidates, strands, and representative conversations by hybrid semantic and lexical similarity

#### Scenario: Restored multilingual index
- **WHEN** a visitor searches a restored snapshot built with the multilingual profile
- **THEN** the system loads that snapshot's pinned multilingual model before embedding the query

### Requirement: Bound model work

The system SHALL cap and prioritize conversation, question, fact, and strand
embedding candidates for large exports.

#### Scenario: Large candidate set
- **WHEN** any semantic candidate class exceeds its configured cap
- **THEN** the system preserves recent, recurrent, time-distributed, or strongest deterministic candidates as appropriate and reports analyzed versus total counts

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
