//! Packing options shared by both readers.

#[derive(Clone, Debug)]
pub struct Options {
    /// Include the transcripts of subagents the main session spawned.
    pub include_subagents: bool,
    /// Include assistant prose. Prompts are always included.
    pub include_assistant: bool,
    /// Mask credential-shaped tokens before anything is written.
    pub redact: bool,
    /// Optional per-message character cap.
    pub max_message_chars: Option<usize>,
    /// Drop sessions whose last message predates this epoch second.
    pub since: Option<f64>,
    /// Merge the prompt histories both CLIs keep outside their transcripts.
    pub include_history: bool,
}

impl Default for Options {
    fn default() -> Self {
        Self {
            include_subagents: false,
            include_assistant: true,
            redact: true,
            max_message_chars: None,
            since: None,
            include_history: true,
        }
    }
}
