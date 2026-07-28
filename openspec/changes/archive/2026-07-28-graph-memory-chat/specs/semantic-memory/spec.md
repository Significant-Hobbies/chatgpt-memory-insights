## MODIFIED Requirements

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
