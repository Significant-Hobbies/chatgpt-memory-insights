# chatgpt-export-import Specification

## Purpose
TBD - created by archiving change build-browser-memory-atlas. Update Purpose after archive.
## Requirements
### Requirement: Select a ChatGPT export

The system SHALL accept a visitor-selected ZIP without uploading it.

#### Scenario: Compatible split export
- **WHEN** a ZIP contains one or more files named `conversations*.json`
- **THEN** the system discovers and processes the files in deterministic order

#### Scenario: Unsupported export
- **WHEN** no compatible conversation JSON file exists
- **THEN** the system explains which files it expected without persisting the ZIP

### Requirement: Parse conversations incrementally

The system SHALL process compatible JSON entries one at a time in a background
worker and report progress.

#### Scenario: Large multi-part export
- **WHEN** a ZIP contains multiple large conversation chunks
- **THEN** the system releases each parsed chunk before reading the next and keeps the interface responsive

#### Scenario: Conversation branch
- **WHEN** a conversation mapping contains abandoned branches
- **THEN** the system counts messages on the active path without double-counting abandoned branch content

### Requirement: Ignore unrelated export data

The system SHALL avoid reading attachment bodies and unrelated export files.

#### Scenario: Export includes attachments
- **WHEN** the ZIP contains binary attachments, rendered HTML, or other JSON files
- **THEN** the system analyzes only compatible conversation JSON entries

