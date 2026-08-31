//! memory-pack — turn local Claude Code and Codex sessions into one archive
//! that Memory Map can read.

mod archive;
mod claude;
mod codex;
mod efficiency;
mod history;
mod options;
mod session;
mod text;
mod time;

use std::collections::HashMap;
use std::path::PathBuf;
use std::process::ExitCode;

use clap::{Parser, ValueEnum};

use options::Options;
use session::{Session, Source};

#[derive(Clone, Copy, PartialEq, Eq, ValueEnum)]
enum SourceArg {
    All,
    Claude,
    Codex,
}

#[derive(Parser)]
#[command(
    name = "memory-pack",
    version,
    about = "Pack local Claude Code and Codex sessions into a Memory Map archive",
    long_about = "Reads the transcripts Claude Code and Codex already keep on this machine and \
writes one ZIP holding your prompts and the assistant's replies. Tool calls, tool output, \
reasoning traces, and file contents are left behind. Upload the ZIP to Memory Map without \
unzipping it."
)]
struct Cli {
    /// Where to write the archive.
    #[arg(short, long, value_name = "PATH")]
    output: Option<PathBuf>,

    /// Which agent's sessions to read.
    #[arg(long, value_enum, default_value_t = SourceArg::All)]
    source: SourceArg,

    /// Claude Code home directory.
    #[arg(long, value_name = "PATH")]
    claude_dir: Option<PathBuf>,

    /// Codex home directory.
    #[arg(long, value_name = "PATH")]
    codex_dir: Option<PathBuf>,

    /// Only pack sessions last active on or after this date (YYYY-MM-DD).
    #[arg(long, value_name = "DATE")]
    since: Option<String>,

    /// Pack only your prompts, leaving out the assistant's replies.
    #[arg(long)]
    no_assistant: bool,

    /// Leave credential-shaped tokens unmasked.
    #[arg(long)]
    no_redact: bool,

    /// Also pack transcripts of subagents your sessions spawned.
    #[arg(long)]
    include_subagents: bool,

    /// Truncate any single message longer than this many characters.
    #[arg(long, value_name = "N")]
    max_message_chars: Option<usize>,

    /// Report what would be packed without writing the archive.
    #[arg(long)]
    dry_run: bool,

    /// Print one line per session.
    #[arg(long)]
    list: bool,

    /// Pack only sessions with a surviving transcript, ignoring the prompt
    /// history both CLIs keep for sessions they have since pruned.
    #[arg(long)]
    no_history: bool,

    /// Leave out the token and tool accounting that explains why sessions were
    /// expensive. The report's efficiency findings need it.
    #[arg(long)]
    no_usage: bool,
}

fn home_dir() -> Option<PathBuf> {
    std::env::var_os("HOME")
        .or_else(|| std::env::var_os("USERPROFILE"))
        .filter(|value| !value.is_empty())
        .map(PathBuf::from)
}

/// Parses `YYYY-MM-DD` into the epoch second its day begins.
fn parse_since(date: &str) -> Result<f64, String> {
    time::epoch_seconds(&format!("{date}T00:00:00Z"))
        .ok_or_else(|| format!("--since expects a YYYY-MM-DD date, got `{date}`"))
}

fn plural(count: usize, singular: &str) -> String {
    if count == 1 {
        format!("{count} {singular}")
    } else {
        format!("{count} {singular}s")
    }
}

fn describe_size(bytes: u64) -> String {
    const MEGABYTE: f64 = 1_048_576.0;
    let megabytes = bytes as f64 / MEGABYTE;
    if megabytes < 0.1 {
        format!("{:.0} KB", bytes as f64 / 1024.0)
    } else {
        format!("{megabytes:.1} MB")
    }
}

fn default_output(sessions: &[Session]) -> PathBuf {
    let latest = archive::totals(sessions).latest;
    PathBuf::from(format!("memory-pack-{}.zip", time::date_stamp(latest)))
}

fn report_sources(sessions: &[Session]) {
    for source in [Source::ClaudeCode, Source::Codex] {
        let counts = archive::totals_for(sessions, source);
        if counts.sessions == 0 {
            continue;
        }
        println!(
            "  {:<12} {:>4} sessions  {:>6} prompts  {:>6} messages",
            source.label(),
            counts.sessions,
            counts.prompts,
            counts.messages
        );
    }
}

fn report_sessions(sessions: &[Session]) {
    for session in sessions {
        println!(
            "  {}  {:<11} {:>3}p  {}",
            time::date_stamp(session.updated_at()),
            session.source.slug(),
            session.user_message_count(),
            session.display_title()
        );
    }
}

fn run(cli: Cli) -> Result<(), String> {
    let home = home_dir();
    let options = Options {
        include_subagents: cli.include_subagents,
        include_assistant: !cli.no_assistant,
        redact: !cli.no_redact,
        max_message_chars: cli.max_message_chars,
        since: cli.since.as_deref().map(parse_since).transpose()?,
        include_history: !cli.no_history,
        include_usage: !cli.no_usage,
    };

    let claude_dir = cli
        .claude_dir
        .or_else(|| home.as_ref().map(|home| home.join(".claude")))
        .ok_or("Could not find a home directory. Pass --claude-dir and --codex-dir.")?;
    let codex_dir = cli
        .codex_dir
        .or_else(|| home.as_ref().map(|home| home.join(".codex")))
        .ok_or("Could not find a home directory. Pass --claude-dir and --codex-dir.")?;

    let mut sessions = Vec::new();
    if cli.source != SourceArg::Codex {
        eprintln!("Reading Claude Code sessions from {}", claude_dir.display());
        sessions.extend(claude::collect(&claude_dir, &options));
    }
    if cli.source != SourceArg::Claude {
        eprintln!("Reading Codex sessions from {}", codex_dir.display());
        sessions.extend(codex::collect(&codex_dir, &options));
    }

    if options.include_history {
        let mut recovered = (0usize, 0usize);
        if cli.source != SourceArg::Codex {
            let counts = history::merge(
                &mut sessions,
                &claude_dir,
                Source::ClaudeCode,
                &HashMap::new(),
                &options,
            );
            recovered = (recovered.0 + counts.0, recovered.1 + counts.1);
        }
        if cli.source != SourceArg::Claude {
            // The thread index outlives the rollouts, so it can still name a
            // session whose transcript is gone.
            let titles = codex::read_titles(&codex_dir);
            let counts =
                history::merge(&mut sessions, &codex_dir, Source::Codex, &titles, &options);
            recovered = (recovered.0 + counts.0, recovered.1 + counts.1);
        }
        if recovered.0 > 0 {
            eprintln!(
                "Recovered {} from prompt history, rebuilding {}",
                plural(recovered.0, "prompt"),
                plural(recovered.1, "pruned session")
            );
        }
    }

    if let Some(since) = options.since {
        sessions.retain(|session| session.updated_at() >= since);
    }
    sessions.sort_by(|left, right| left.started_at.total_cmp(&right.started_at));

    if sessions.is_empty() {
        return Err(
            "No sessions were found. Check --claude-dir and --codex-dir, or widen --since.".into(),
        );
    }

    let totals = archive::totals(&sessions);
    println!(
        "\nFound {} spanning {} to {}",
        plural(totals.sessions, "session"),
        time::date_stamp(totals.earliest),
        time::date_stamp(totals.latest)
    );
    report_sources(&sessions);
    if cli.list {
        report_sessions(&sessions);
    }

    if cli.dry_run {
        println!("\nDry run: nothing was written.");
        return Ok(());
    }

    let output = cli.output.unwrap_or_else(|| default_output(&sessions));
    let size = archive::write(&output, &sessions, &options)
        .map_err(|error| format!("Could not write {}: {error}", output.display()))?;

    println!(
        "\nWrote {} ({}, {})",
        output.display(),
        describe_size(size),
        plural(archive::prompt_count(&sessions), "prompt")
    );
    if !options.redact {
        println!("Secrets were not masked: this archive was built with --no-redact.");
    }
    println!("Upload it to Memory Map without unzipping it.");
    Ok(())
}

fn main() -> ExitCode {
    match run(Cli::parse()) {
        Ok(()) => ExitCode::SUCCESS,
        Err(message) => {
            eprintln!("memory-pack: {message}");
            ExitCode::FAILURE
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn verifies_the_command_line_definition() {
        use clap::CommandFactory;
        Cli::command().debug_assert();
    }

    #[test]
    fn reads_a_since_date() {
        assert_eq!(
            parse_since("2026-08-29").unwrap(),
            time::epoch_seconds("2026-08-29T00:00:00Z").unwrap()
        );
        assert!(parse_since("last tuesday").is_err());
        assert!(parse_since("2026-13-01").is_err());
    }

    #[test]
    fn describes_counts_and_sizes_for_humans() {
        assert_eq!(plural(1, "session"), "1 session");
        assert_eq!(plural(2, "session"), "2 sessions");
        assert_eq!(describe_size(2048), "2 KB");
        assert_eq!(describe_size(5_242_880), "5.0 MB");
    }

    #[test]
    fn names_the_archive_after_the_newest_session() {
        let sessions = vec![Session {
            id: "claude-a".into(),
            source: Source::ClaudeCode,
            title: None,
            project: None,
            started_at: 1_788_019_427.0,
            messages: vec![session::Message {
                role: session::Role::User,
                text: "hi".into(),
                at: 1_788_019_427.0,
                model: None,
            }],
            stats: crate::efficiency::SessionStats::default(),
        }];
        assert_eq!(
            default_output(&sessions),
            PathBuf::from("memory-pack-2026-08-29.zip")
        );
    }
}
