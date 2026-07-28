## ADDED Requirements

### Requirement: Visitor can understand the product before import
The system SHALL provide a public explanation route whose first viewport
states the product outcome, its intended input, its browser-only processing
boundary, and a single primary action leading to the analysis app.

#### Scenario: First-time visitor opens the explanation route
- **WHEN** a visitor opens `/about`
- **THEN** the page identifies ChatGPT export ZIPs as the input, describes a private searchable memory map as the outcome, and offers a link to analyze the ZIP

### Requirement: Visitor can inspect the complete shipped capability set
The system SHALL present an implementation-backed inventory covering
deterministic statistics, question lenses, wording signals, semantic topics,
repeated questions, fact history states, conversation strands, longitudinal
trends, reflection questions, search, evidence, confidence controls, model
profiles, persistence, accessibility, progress, and recovery behavior.

#### Scenario: Visitor evaluates feature breadth
- **WHEN** a visitor scans the capability inventory
- **THEN** every shipped feature family is named in plain language without claiming unsupported diagnosis, accuracy, attachment analysis, or generative summarization

### Requirement: Visitor can understand privacy and computation boundaries
The system SHALL explain that archive text is processed in the browser, model
files are downloaded separately, deterministic totals cover the parsed export,
semantic work is bounded for large histories, and persistence is opt-in and
device-local.

#### Scenario: Privacy-conscious visitor evaluates the product
- **WHEN** a visitor reads the privacy explanation
- **THEN** the page distinguishes archive processing, model download, semantic sampling, and optional IndexedDB persistence

### Requirement: Visitor can obtain the required ChatGPT export
The system SHALL provide concise export steps, link to official OpenAI
instructions and the Privacy Portal, state that the ZIP should remain intact,
and disclose delivery and link-expiry timing.

#### Scenario: Visitor does not yet have an export
- **WHEN** a visitor reaches the export guide
- **THEN** the page explains the ChatGPT settings path, links to official resources, and tells the visitor to return with the original ZIP

### Requirement: Visitor can self-qualify
The system SHALL state the intended user and current poor-fit cases, including
unsupported attachments, cross-device sync, server-side collaboration, and
medical, emotional, or personality diagnosis.

#### Scenario: Visitor needs an unsupported workflow
- **WHEN** a visitor reviews the fit and limits section
- **THEN** the page makes the relevant unsupported capability explicit before the visitor imports data

### Requirement: Explanation and app routes are mutually discoverable
The system SHALL provide an ordinary link from the app to the explanation
route and from the explanation route to the app.

#### Scenario: Visitor moves between product context and operation
- **WHEN** a visitor follows the explanatory or analysis navigation
- **THEN** the browser loads the corresponding static route without requiring an account or client-side router
