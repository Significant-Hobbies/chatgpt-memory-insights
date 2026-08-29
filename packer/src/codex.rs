//! Reads Codex rollouts from `~/.codex/sessions/YYYY/MM/DD`.
//!
//! A rollout records the whole turn stream. Only `response_item` messages
//! carry conversation text; the `event_msg` envelopes restate items already
//! recorded, and the user channel additionally carries injected context the
//! person never typed.

use std::collections::{HashMap, HashSet};
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::Path;

use serde_json::Value;
use walkdir::WalkDir;

use crate::options::Options;
use crate::session::{Message, Role, Session, Source};
use crate::text;

/// Wrappers Codex injects into the user channel.
const INJECTED_TAGS: &[&str] = &[
    "environment_context",
    "recommended_plugins",
    "turn_aborted",
    "subagent_notification",
    "user_instructions",
    "INSTRUCTIONS",
    "app-context",
];

/// The instruction preamble Codex prepends to the first user turn.
const INSTRUCTION_PREFIXES: &[&str] = &["# AGENTS.md", "# Global agent instructions"];

fn string_field<'a>(value: &'a Value, key: &str) -> Option<&'a str> {
    value.get(key)?.as_str()
}

/// Joins the readable blocks of a Codex content array. `encrypted_content` and
/// other opaque blocks carry no text and are skipped.
fn block_text(content: &Value) -> String {
    let Some(blocks) = content.as_array() else {
        return String::new();
    };
    blocks
        .iter()
        .filter(|block| {
            matches!(
                block.get("type").and_then(Value::as_str),
                Some("input_text" | "output_text" | "text" | "summary_text")
            )
        })
        .filter_map(|block| block.get("text").and_then(Value::as_str))
        .collect::<Vec<_>>()
        .join("\n")
}

/// Removes the `<image …>` block the CLI wraps around a pasted image. It
/// carries a clipboard temp path rather than anything the person wrote, and
/// left in place that path becomes part of the analysed prompt text.
fn strip_image_blocks(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    let mut rest = text;
    while let Some(start) = rest.find("<image ") {
        let Some(end) = rest[start..].find("</image>") else {
            break;
        };
        out.push_str(&rest[..start]);
        rest = &rest[start + end + "</image>".len()..];
    }
    out.push_str(rest);
    out
}

/// When the person attaches files, the CLI prefixes their prompt with a
/// manifest of paths and marks the prompt itself with `## My request:`.
fn unwrap_file_manifest(text: &str) -> &str {
    const MANIFEST: &str = "# Files mentioned by the user:";
    const REQUEST: &str = "## My request:";
    if !text.trim_start().starts_with(MANIFEST) {
        return text;
    }
    match text.find(REQUEST) {
        Some(start) => text[start + REQUEST.len()..].trim_start(),
        None => text,
    }
}

/// Reduces a user turn to the words the person actually wrote.
fn clean_prompt(raw: &str) -> String {
    strip_image_blocks(unwrap_file_manifest(raw))
        .trim()
        .to_string()
}

fn is_injected(candidate: &str) -> bool {
    let trimmed = candidate.trim();
    trimmed.is_empty()
        || text::opens_with_tag(trimmed, INJECTED_TAGS)
        || INSTRUCTION_PREFIXES
            .iter()
            .any(|prefix| trimmed.starts_with(prefix))
}

#[derive(Default)]
struct Draft {
    identified: bool,
    id: Option<String>,
    session_id: Option<String>,
    project: Option<String>,
    model: Option<String>,
    is_subagent: bool,
    messages: Vec<Message>,
    /// Prompts found only inside a compaction record. Compaction rewrites the
    /// turn history, and when a thread resumes from an earlier rollout the
    /// original turns are not in this file at all.
    compacted: Vec<Message>,
}

/// Applies the rollout's own `session_meta`. A resumed thread writes further
/// meta rows that omit `thread_source`, so only the first row identifies it.
fn read_meta(payload: &Value, draft: &mut Draft) {
    if draft.identified {
        return;
    }
    draft.identified = true;
    draft.id = string_field(payload, "id").map(str::to_string);
    draft.session_id = string_field(payload, "session_id").map(str::to_string);
    draft.project = string_field(payload, "cwd").map(str::to_string);
    draft.is_subagent = string_field(payload, "thread_source") == Some("subagent");
}

fn read_lines<R: BufRead>(reader: R, options: &Options) -> Draft {
    let mut draft = Draft::default();
    // A resumed thread can re-record earlier items; ids keep them unique.
    let mut seen = HashSet::new();

    for line in reader.lines().map_while(Result::ok) {
        let Ok(entry) = serde_json::from_str::<Value>(&line) else {
            continue;
        };
        let Some(payload) = entry.get("payload") else {
            continue;
        };

        match string_field(&entry, "type").unwrap_or_default() {
            "session_meta" => {
                read_meta(payload, &mut draft);
                continue;
            }
            "turn_context" => {
                if let Some(model) = string_field(payload, "model") {
                    draft.model = Some(model.to_string());
                }
                continue;
            }
            "compacted" => {
                let at = string_field(&entry, "timestamp").and_then(crate::time::epoch_seconds);
                let history = payload.get("replacement_history").and_then(Value::as_array);
                if let (Some(at), Some(history)) = (at, history) {
                    for item in history {
                        if string_field(item, "type") != Some("message")
                            || string_field(item, "role") != Some("user")
                        {
                            continue;
                        }
                        let Some(content) = item.get("content") else {
                            continue;
                        };
                        let raw = clean_prompt(&block_text(content));
                        if is_injected(&raw) {
                            continue;
                        }
                        if let Some(body) = prepare(&raw, options) {
                            // The original turn time is not recorded here, so
                            // the compaction's own time is the honest stamp.
                            draft.compacted.push(Message {
                                role: Role::User,
                                text: body,
                                at,
                                model: None,
                            });
                        }
                    }
                }
                continue;
            }
            "response_item" => {}
            _ => continue,
        }

        if string_field(payload, "type") != Some("message") {
            continue;
        }
        let role = match string_field(payload, "role") {
            Some("user") => Role::User,
            Some("assistant") => Role::Assistant,
            // `developer` carries harness instructions, not conversation.
            _ => continue,
        };
        if role == Role::Assistant && !options.include_assistant {
            continue;
        }
        if let Some(id) = string_field(payload, "id") {
            if !seen.insert(id.to_string()) {
                continue;
            }
        }

        let Some(content) = payload.get("content") else {
            continue;
        };
        let raw = if role == Role::User {
            clean_prompt(&block_text(content))
        } else {
            block_text(content)
        };
        if role == Role::User && is_injected(&raw) {
            continue;
        }
        let Some(at) = string_field(&entry, "timestamp").and_then(crate::time::epoch_seconds)
        else {
            continue;
        };

        let Some(body) = prepare(&raw, options) else {
            continue;
        };
        draft.messages.push(Message {
            role,
            text: body,
            at,
            model: if role == Role::Assistant {
                draft.model.clone()
            } else {
                None
            },
        });
    }

    let present: HashSet<&str> = draft
        .messages
        .iter()
        .filter(|message| message.role == Role::User)
        .map(|message| message.text.as_str())
        .collect();
    let recovered: Vec<Message> = draft
        .compacted
        .iter()
        .filter(|candidate| !present.contains(candidate.text.as_str()))
        .cloned()
        .collect();
    drop(present);
    let mut deduped: Vec<Message> = Vec::new();
    for message in recovered {
        // Every compaction window restates the same turns.
        if !deduped.iter().any(|kept| kept.text == message.text) {
            deduped.push(message);
        }
    }
    draft.messages.extend(deduped);
    draft.compacted.clear();

    draft
}

/// Applies redaction and truncation, returning `None` for empty text.
fn prepare(raw: &str, options: &Options) -> Option<String> {
    let body = if options.redact {
        text::redact(raw)
    } else {
        raw.to_string()
    };
    let body = text::normalize(&body, options.max_message_chars);
    (!body.is_empty()).then_some(body)
}

/// Reads `~/.codex/session_index.jsonl`, which names threads the CLI titled.
/// It outlives the rollouts, so it can still name a pruned thread.
pub fn read_titles(codex_dir: &Path) -> HashMap<String, String> {
    let mut titles = HashMap::new();
    let Ok(file) = File::open(codex_dir.join("session_index.jsonl")) else {
        return titles;
    };
    for line in BufReader::new(file).lines().map_while(Result::ok) {
        let Ok(entry) = serde_json::from_str::<Value>(&line) else {
            continue;
        };
        if let (Some(id), Some(name)) = (
            string_field(&entry, "id"),
            string_field(&entry, "thread_name"),
        ) {
            titles.insert(id.to_string(), name.to_string());
        }
    }
    titles
}

pub fn collect(codex_dir: &Path, options: &Options) -> Vec<Session> {
    let root = codex_dir.join("sessions");
    if !root.is_dir() {
        return Vec::new();
    }
    let titles = read_titles(codex_dir);

    let mut collected = Vec::new();
    for entry in WalkDir::new(&root).into_iter().filter_map(Result::ok) {
        let path = entry.path();
        if !path.is_file() || path.extension().is_some_and(|ext| ext != "jsonl") {
            continue;
        }
        let Ok(file) = File::open(path) else { continue };
        let mut draft = read_lines(BufReader::new(file), options);
        if draft.messages.is_empty() || (draft.is_subagent && !options.include_subagents) {
            continue;
        }

        let stem = path
            .file_stem()
            .and_then(|stem| stem.to_str())
            .unwrap_or_default();
        let id = draft
            .id
            .clone()
            .or_else(|| draft.session_id.clone())
            .unwrap_or_else(|| stem.to_string());
        let title = draft
            .id
            .as_ref()
            .and_then(|key| titles.get(key))
            .or_else(|| draft.session_id.as_ref().and_then(|key| titles.get(key)))
            .cloned();

        draft
            .messages
            .sort_by(|left, right| left.at.total_cmp(&right.at));
        collected.push(Session {
            id: format!("{}-{id}", Source::Codex.id_prefix()),
            source: Source::Codex,
            title,
            project: draft.project.clone(),
            started_at: draft.messages[0].at,
            messages: draft.messages,
        });
    }
    collected
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;

    fn parse(lines: &str) -> Draft {
        read_lines(Cursor::new(lines.to_string()), &Options::default())
    }

    const STAMP: &str = r#""timestamp":"2026-08-25T07:57:31.000Z""#;

    fn message_line(role: &str, text: &str, id: &str) -> String {
        format!(
            r#"{{{STAMP},"type":"response_item","payload":{{"type":"message","id":"{id}","role":"{role}","content":[{{"type":"input_text","text":{}}}]}}}}"#,
            serde_json::to_string(text).unwrap()
        )
    }

    #[test]
    fn keeps_conversation_and_records_metadata() {
        let transcript = [
            format!(
                r#"{{{STAMP},"type":"session_meta","payload":{{"id":"thread-1","session_id":"sess-1","cwd":"/repo","thread_source":"main"}}}}"#
            ),
            format!(r#"{{{STAMP},"type":"turn_context","payload":{{"model":"gpt-5.6-sol"}}}}"#),
            message_line("user", "pack my sessions", "m1"),
            message_line("assistant", "on it", "m2"),
        ]
        .join("\n");
        let draft = parse(&transcript);

        assert_eq!(draft.id.as_deref(), Some("thread-1"));
        assert_eq!(draft.project.as_deref(), Some("/repo"));
        assert!(!draft.is_subagent);
        assert_eq!(draft.messages.len(), 2);
        assert_eq!(draft.messages[0].text, "pack my sessions");
        assert_eq!(draft.messages[1].model.as_deref(), Some("gpt-5.6-sol"));
    }

    #[test]
    fn drops_injected_context_and_non_conversation_rows() {
        let transcript = [
            message_line("user", "<environment_context>cwd=/repo</environment_context>", "m1"),
            message_line("user", "# AGENTS.md instructions\n<INSTRUCTIONS>do things</INSTRUCTIONS>", "m2"),
            message_line("user", "<recommended_plugins>x</recommended_plugins>", "m3"),
            message_line("developer", "harness rules", "m4"),
            format!(
                r#"{{{STAMP},"type":"event_msg","payload":{{"type":"item_completed","item":{{"type":"Reasoning"}}}}}}"#
            ),
            format!(
                r#"{{{STAMP},"type":"response_item","payload":{{"type":"agent_message","id":"a1","content":[{{"type":"input_text","text":"NEW_TASK"}}]}}}}"#
            ),
        ]
        .join("\n");
        assert!(parse(&transcript).messages.is_empty());
    }

    #[test]
    fn deduplicates_items_a_resumed_thread_re_records() {
        let transcript = [
            message_line("user", "first ask", "m1"),
            message_line("user", "first ask", "m1"),
            message_line("user", "second ask", "m2"),
        ]
        .join("\n");
        assert_eq!(parse(&transcript).messages.len(), 2);
    }

    #[test]
    fn reduces_a_prompt_to_what_the_person_wrote() {
        let wrapped = "<image name=[Image #1] path=\"/var/folders/T/codex-clipboard-x.png\">\n</image>\nfix the header";
        assert_eq!(clean_prompt(wrapped), "fix the header");

        let manifest = "# Files mentioned by the user:\n\n## prd.md: /Users/me/prd.md\n\n## My request:\nbuild this";
        assert_eq!(clean_prompt(manifest), "build this");

        assert_eq!(clean_prompt("just a prompt"), "just a prompt");
        // An unterminated wrapper must not swallow the prompt.
        assert_eq!(
            clean_prompt("<image src=x\nkeep me"),
            "<image src=x\nkeep me"
        );
    }

    #[test]
    fn strips_the_clipboard_path_from_a_kept_prompt() {
        let transcript = message_line(
            "user",
            "<image name=[Image #1] path=\"/var/folders/T/codex-clipboard-x.png\">\n</image>\ncentre the cross",
            "m1",
        );
        let draft = parse(&transcript);
        assert_eq!(draft.messages[0].text, "centre the cross");
        assert!(!draft.messages[0].text.contains("codex-clipboard"));
    }

    #[test]
    fn recovers_a_prompt_that_survives_only_in_compaction() {
        let compaction = |window: &str| {
            format!(
                r#"{{{STAMP},"type":"compacted","payload":{{"window_id":"{window}","replacement_history":[{{"type":"message","role":"user","content":[{{"type":"input_text","text":"lost to compaction"}}]}},{{"type":"message","role":"user","content":[{{"type":"input_text","text":"still here"}}]}},{{"type":"message","role":"developer","content":[{{"type":"input_text","text":"harness rules"}}]}}]}}}}"#
            )
        };
        let transcript = [
            message_line("user", "still here", "m1"),
            compaction("w1"),
            // A second window restates the same turns.
            compaction("w2"),
        ]
        .join("\n");

        let texts: Vec<String> = parse(&transcript)
            .messages
            .iter()
            .map(|m| m.text.clone())
            .collect();
        assert_eq!(texts, vec!["still here", "lost to compaction"]);
    }

    #[test]
    fn flags_a_subagent_rollout() {
        let transcript = [
            format!(
                r#"{{{STAMP},"type":"session_meta","payload":{{"id":"t","thread_source":"subagent"}}}}"#
            ),
            message_line("user", "delegated work", "m1"),
        ]
        .join("\n");
        assert!(parse(&transcript).is_subagent);
    }

    #[test]
    fn a_later_meta_row_cannot_un_flag_a_subagent() {
        let transcript = [
            format!(
                r#"{{{STAMP},"type":"session_meta","payload":{{"id":"t","thread_source":"subagent"}}}}"#
            ),
            message_line("user", "delegated work", "m1"),
            format!(r#"{{{STAMP},"type":"session_meta","payload":{{"id":"t","cwd":"/repo"}}}}"#),
        ]
        .join("\n");
        let draft = parse(&transcript);
        assert!(draft.is_subagent);
        assert_eq!(draft.id.as_deref(), Some("t"));
    }

    #[test]
    fn skips_opaque_blocks_and_honours_options() {
        let transcript = format!(
            r#"{{{STAMP},"type":"response_item","payload":{{"type":"message","id":"m1","role":"user","content":[{{"type":"encrypted_content","encrypted_content":"gAAA"}},{{"type":"input_text","text":"key sk-abcdefghijklmnopqrstuvwxyz012345"}}]}}}}"#
        );
        let draft = parse(&transcript);
        assert_eq!(draft.messages.len(), 1);
        assert!(!draft.messages[0].text.contains("gAAA"));
        assert!(draft.messages[0].text.contains("[redacted-secret]"));

        let options = Options {
            redact: false,
            ..Options::default()
        };
        let raw = read_lines(Cursor::new(transcript), &options);
        assert!(raw.messages[0]
            .text
            .contains("sk-abcdefghijklmnopqrstuvwxyz012345"));
    }
}
