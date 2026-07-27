import { forgetSnapshot, loadSnapshot, saveSnapshot } from "../lib/storage";
import {
  buildThreadStrands,
  classifyTrend,
  confidencePreset,
  confidenceThreshold,
  normalizeSettings,
} from "../lib/analysis";
import type {
  AnalysisSettings,
  EmotionBucket,
  FactGroup,
  FullReport,
  MemorySnapshot,
  ModelProfile,
  SearchResult,
  SourceRef,
  ThreadSegmentation,
  TopicNode,
  TrendState,
  WorkerRequest,
  WorkerResponse,
} from "../lib/types";

const $ = <T extends Element = HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
};

const svgElement = <K extends keyof SVGElementTagNameMap>(tag: K) =>
  document.createElementNS("http://www.w3.org/2000/svg", tag);

const importView = $("#import-view");
const progressView = $("#progress-view");
const errorView = $("#error-view");
const reportView = $("#report-view");
const reportNav = $("#report-nav");
const archiveInput = $<HTMLInputElement>("#archive-input");
const dropZone = $("#drop-zone");
const progressStatus = $("#progress-status");
const progressPhase = $("#progress-phase");
const progressFill = $<HTMLElement>("#progress-line-fill");
const errorMessage = $("#error-message");
const appStatus = $("#app-status");
const graph = $<SVGSVGElement>("#topic-graph");
const evidencePanel = $("#evidence-panel");
const evidenceContent = $("#evidence-content");
const appShell = $<HTMLElement>(".app-shell");
const searchResults = $("#search-results");
const searchInput = $<HTMLInputElement>("#search-query");
const saveButton = $<HTMLButtonElement>("#save-memory");
const forgetButton = $<HTMLButtonElement>("#forget-memory");
const confidenceInput = $<HTMLInputElement>("#confidence-input");
const confidenceOutput = $<HTMLOutputElement>("#confidence-output");
const reportConfidenceInput = $<HTMLInputElement>("#report-confidence-input");
const reportConfidenceOutput = $<HTMLOutputElement>("#report-confidence-output");

let worker = createWorker();
let currentReport: FullReport | null = null;
let currentSnapshot: MemorySnapshot | null = null;
let ledgerStatus: FactGroup["status"] = "current";
let activeConfidence = 65;
let evolutionKind: "topics" | "domains" | "language" = "topics";
let evidenceReturnFocus: HTMLElement | SVGElement | null = null;

function createWorker() {
  const nextWorker = new Worker(new URL("../workers/analyze.worker.ts", import.meta.url), {
    type: "module",
  });
  nextWorker.addEventListener("message", onWorkerMessage);
  nextWorker.addEventListener("error", () => {
    showError("The analysis worker stopped unexpectedly. Choose the archive again.");
  });
  return nextWorker;
}

function send(request: WorkerRequest) {
  worker.postMessage(request);
}

function showOnly(view: HTMLElement) {
  for (const candidate of [importView, progressView, errorView, reportView]) {
    candidate.hidden = candidate !== view;
  }
  reportNav.hidden = view !== reportView;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

function formatDate(timestamp: number): string {
  if (!timestamp) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp * 1_000));
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 1 }).format(
    value,
  );
}

function truncate(value: string, length: number): string {
  const singleLine = value.replace(/\s+/g, " ").trim();
  return singleLine.length > length ? `${singleLine.slice(0, length - 1).trimEnd()}…` : singleLine;
}

function text(tag: keyof HTMLElementTagNameMap, value: string, className?: string) {
  const element = document.createElement(tag);
  element.textContent = value;
  if (className) element.className = className;
  return element;
}

function readAnalysisSettings(): AnalysisSettings {
  const profile =
    document.querySelector<HTMLInputElement>('input[name="model-profile"]:checked')?.value ??
    "auto";
  return normalizeSettings({
    modelProfile: profile as ModelProfile,
    confidence: Number(confidenceInput.value),
  });
}

function setConfidence(value: number, rerender = true) {
  activeConfidence = normalizeSettings({ confidence: value }).confidence;
  const display = `${activeConfidence}%`;
  confidenceInput.value = String(activeConfidence);
  reportConfidenceInput.value = String(activeConfidence);
  confidenceOutput.value = display;
  confidenceOutput.textContent = display;
  reportConfidenceOutput.value = display;
  reportConfidenceOutput.textContent = display;
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-confidence]")) {
    button.setAttribute(
      "aria-pressed",
      String(Number(button.dataset.confidence) === activeConfidence),
    );
  }
  if (rerender && currentReport) {
    renderReport(currentReport);
    appStatus.textContent = `Showing ${confidencePreset(activeConfidence)} evidence at ${display} confidence.`;
  }
}

function clearsConfidence(score: number): boolean {
  return score >= confidenceThreshold(activeConfidence);
}

function resetWorker() {
  worker.terminate();
  worker = createWorker();
}

function resetApp() {
  resetWorker();
  currentReport = null;
  currentSnapshot = null;
  archiveInput.value = "";
  searchResults.hidden = true;
  evidencePanel.hidden = true;
  appShell.inert = false;
  evidenceReturnFocus = null;
  showOnly(importView);
}

function openEvidencePanel() {
  evidenceReturnFocus =
    document.activeElement instanceof HTMLElement || document.activeElement instanceof SVGElement
      ? document.activeElement
      : null;
  evidencePanel.hidden = false;
  appShell.inert = true;
  $<HTMLButtonElement>("#close-evidence").focus();
}

function closeEvidencePanel(restoreFocus = true) {
  if (evidencePanel.hidden) return;
  evidencePanel.hidden = true;
  appShell.inert = false;
  if (restoreFocus && evidenceReturnFocus?.isConnected) evidenceReturnFocus.focus();
  evidenceReturnFocus = null;
}

function analyzeFile(file: File) {
  if (!file.name.toLocaleLowerCase().endsWith(".zip")) {
    showError("Choose the original .zip file from your ChatGPT data export.");
    return;
  }
  currentReport = null;
  currentSnapshot = null;
  progressFill.style.transform = "scaleX(0.02)";
  progressPhase.textContent = "Reading archive";
  progressStatus.textContent = `Opening ${file.name}…`;
  showOnly(progressView);
  send({ type: "analyze", file, settings: readAnalysisSettings() });
}

function showError(message: string, keepReport = false) {
  errorMessage.textContent = message;
  appStatus.textContent = message;
  if (!keepReport) showOnly(errorView);
}

function onWorkerMessage(event: MessageEvent<WorkerResponse>) {
  const message = event.data;
  if (message.type === "progress") {
    const percent = message.total > 0 ? Math.min(100, (message.current / message.total) * 100) : 4;
    progressPhase.textContent = message.phase === "embed" ? "Semantic analysis" : message.phase;
    progressStatus.textContent = message.label;
    progressFill.style.transform = `scaleX(${Math.max(4, percent) / 100})`;
    appStatus.textContent = `${message.label} ${Math.round(percent)}%`;
    if (currentReport && !currentReport.semantic && ["model", "embed"].includes(message.phase)) {
      $("#sampling-note").textContent =
        `${message.label} · ${Math.round(percent)}%. Deterministic insights remain available while this finishes.`;
    }
    return;
  }
  if (message.type === "deterministic") {
    currentReport = message.report;
    setConfidence(message.report.analysis.confidence, false);
    renderReport(message.report);
    showOnly(reportView);
    appStatus.textContent = "Initial statistics are ready. Semantic analysis is still running.";
    return;
  }
  if (message.type === "complete") {
    currentReport = message.report;
    currentSnapshot = message.snapshot;
    setConfidence(message.report.analysis.confidence, false);
    renderReport(message.report);
    appStatus.textContent = "Your semantic memory map is ready.";
    return;
  }
  if (message.type === "restored") {
    currentReport = message.report;
    setConfidence(message.report.analysis.confidence, false);
    renderReport(message.report);
    forgetButton.hidden = false;
    saveButton.textContent = "Saved on this device";
    saveButton.disabled = true;
    showOnly(reportView);
    return;
  }
  if (message.type === "search-results") {
    renderSearchResults(message.results);
    return;
  }
  showError(message.message, message.recoverable && Boolean(currentReport));
}

function renderReport(report: FullReport) {
  const deterministic = report.deterministic;
  const model = report.semantic?.model;
  $("#model-profile-note").textContent = model
    ? `${report.analysis.modelProfile === "auto" ? "Automatic" : "Selected"} → ${model.resolvedProfile}. ${model.id}@${model.revision.slice(0, 8)} · ≈${model.approximateDownloadMb} MB. ${model.profileReason}`
    : `${report.analysis.modelProfile === "auto" ? `Automatic → ${report.analysis.resolvedModelProfile}.` : `${report.analysis.modelProfile} profile selected.`} ${report.analysis.profileReason}`;
  $("#report-meta").textContent =
    `${report.fileName} · ${formatDate(deterministic.dateRange.start)} to ${formatDate(
      deterministic.dateRange.end,
    )} · analyzed ${new Date(report.generatedAt).toLocaleString()}`;

  const stats = [
    ["Conversations", deterministic.totals.conversations],
    ["Messages", deterministic.totals.messages],
    ["Your prompts", deterministic.totals.userPrompts],
    ["Approx. words", deterministic.totals.words],
    ["Active days", deterministic.totals.activeDays],
    ["Longest streak", deterministic.totals.longestStreak],
  ] as const;
  const statsList = $("#overview-stats");
  statsList.replaceChildren(
    ...stats.map(([label, value]) => {
      const wrapper = document.createElement("div");
      wrapper.append(text("dt", label), text("dd", formatNumber(value)));
      return wrapper;
    }),
  );

  $("#date-range").textContent = `${formatDate(deterministic.dateRange.start)} — ${formatDate(
    deterministic.dateRange.end,
  )}`;
  $("#tone-method").textContent = deterministic.tone.method;
  $("#emotion-method").textContent = deterministic.emotions.method;
  renderTone(report);
  renderReflections(report);
  renderActivity(report);
  renderRepeats(report);
  renderQuestionLenses(report);
  renderEvolution(report);
  renderConfidenceImpact(report);

  if (report.semantic) {
    const model = report.semantic.model;
    $("#sampling-note").textContent =
      `Embedded ${formatNumber(model.embeddedConversations)} of ${formatNumber(
        model.totalConversations,
      )} conversations, ${formatNumber(model.embeddedQuestions)} of ${formatNumber(
        model.totalQuestions,
      )} prompts, and ${formatNumber(model.embeddedFacts)} of ${formatNumber(
        model.totalFacts,
      )} fact candidates, and ${formatNumber(model.embeddedThreadPrompts)} of ${formatNumber(
        model.totalThreadPrompts,
      )} candidate thread prompts.`;
    renderGraph(report.semantic.topics, report.semantic.edges);
    renderLedger(report);
  } else {
    $("#sampling-note").textContent = "Full totals are ready. Embeddings are still being built.";
    $("#graph-loading").hidden = false;
    graph.classList.add("is-hidden");
  }
}

function renderGraph(
  topics: NonNullable<FullReport["semantic"]>["topics"],
  edges: NonNullable<FullReport["semantic"]>["edges"],
) {
  $("#graph-loading").hidden = true;
  graph.classList.remove("is-hidden");
  graph.setAttribute(
    "viewBox",
    window.matchMedia("(max-width: 600px)").matches ? "250 135 500 350" : "0 0 1000 620",
  );
  graph.replaceChildren();

  const orderedTopics = [...topics].sort((left, right) => right.count - left.count);
  const displayPositions = new Map<string, { x: number; y: number }>();
  orderedTopics.forEach((topic, index) => {
    if (index === 0) {
      displayPositions.set(topic.id, { x: 0.5, y: 0.48 });
      return;
    }
    const outerCount = Math.max(1, orderedTopics.length - 1);
    const angle = -Math.PI / 2 + ((index - 1) * Math.PI * 2) / outerCount;
    displayPositions.set(topic.id, {
      x: 0.5 + Math.cos(angle) * 0.39,
      y: 0.5 + Math.sin(angle) * 0.39,
    });
  });
  const displayTopics = topics.map((topic) => ({
    ...topic,
    ...(displayPositions.get(topic.id) ?? { x: topic.x, y: topic.y }),
  }));
  const topicMap = new Map(displayTopics.map((topic) => [topic.id, topic]));
  for (const edge of edges) {
    const source = topicMap.get(edge.source);
    const target = topicMap.get(edge.target);
    if (!source || !target) continue;
    const path = svgElement("path");
    const sourceX = source.x * 1_000;
    const sourceY = source.y * 620;
    const targetX = target.x * 1_000;
    const targetY = target.y * 620;
    const bendX = (sourceX + targetX) / 2;
    const bendY = (sourceY + targetY) / 2 - Math.min(45, Math.abs(targetX - sourceX) * 0.08);
    path.setAttribute(
      "d",
      `M ${sourceX} ${sourceY} Q ${bendX} ${bendY} ${targetX} ${targetY}`,
    );
    path.setAttribute("class", "graph-edge");
    path.setAttribute("data-source", edge.source);
    path.setAttribute("data-target", edge.target);
    path.style.opacity = String(Math.max(0.35, edge.similarity));
    graph.append(path);
  }

  for (const topic of displayTopics) {
    const group = svgElement("g");
    group.setAttribute("class", "graph-node");
    group.setAttribute("data-id", topic.id);
    group.setAttribute("tabindex", "0");
    group.setAttribute("role", "button");
    group.setAttribute(
      "aria-label",
      `${topic.label}, ${topic.count} conversations. Show supporting conversations.`,
    );
    group.setAttribute("transform", `translate(${topic.x * 1_000} ${topic.y * 620})`);

    const radius = Math.min(64, 28 + Math.sqrt(topic.count) * 2.2);
    const circle = svgElement("circle");
    circle.setAttribute("r", String(radius));
    circle.style.stroke = topic.color;

    const label = svgElement("text");
    label.setAttribute("y", "-2");
    label.textContent = truncate(topic.label.split(" · ")[0], 22);

    const count = svgElement("text");
    count.setAttribute("class", "graph-count");
    count.setAttribute("y", "20");
    count.textContent = `${formatNumber(topic.count)} conversations`;
    group.append(circle, label, count);
    const activate = () => selectTopic(topic);
    group.addEventListener("click", activate);
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
    graph.append(group);
  }

  const topicList = $("#topic-list");
  topicList.replaceChildren(
    ...displayTopics
      .slice()
      .sort((left, right) => right.count - left.count)
      .map((topic) => {
        const button = document.createElement("button");
        button.type = "button";
        const marker = document.createElement("i");
        marker.style.color = topic.color;
        button.append(marker, text("span", topic.label), text("small", formatNumber(topic.count)));
        button.addEventListener("click", () => selectTopic(topic));
        return button;
      }),
  );
}

function selectTopic(topic: TopicNode) {
  for (const node of graph.querySelectorAll(".graph-node")) {
    node.classList.toggle("is-selected", node.getAttribute("data-id") === topic.id);
  }
  for (const edge of graph.querySelectorAll<SVGPathElement>(".graph-edge")) {
    const connected =
      edge.getAttribute("data-source") === topic.id || edge.getAttribute("data-target") === topic.id;
    edge.style.opacity = connected ? "1" : "0.16";
    edge.style.strokeWidth = connected ? "4" : "2";
  }
  showEvidence(topic.label, topic.sources, [
    `${formatNumber(topic.count)} conversations`,
    topic.terms.length ? `Distinctive terms: ${topic.terms.join(", ")}` : "",
  ]);
}

function showEvidence(title: string, sources: SourceRef[], notes: string[] = []) {
  $("#evidence-heading").textContent = title;
  const fragments: HTMLElement[] = [];
  for (const note of notes.filter(Boolean)) fragments.push(text("p", note, "evidence-note"));
  for (const source of sources) {
    const item = document.createElement("div");
    item.className = "evidence-source";
    item.append(text("strong", source.title), text("small", formatDate(source.date)));
    fragments.push(item);
  }
  evidenceContent.replaceChildren(...fragments);
  openEvidencePanel();
}

function renderLedger(report: FullReport) {
  const facts = report.semantic?.facts ?? [];
  const visibleFacts = facts.filter(
    (fact) => fact.status === "current" || clearsConfidence(fact.confidence),
  );
  for (const tab of document.querySelectorAll<HTMLButtonElement>("#ledger-tabs button")) {
    const status = tab.dataset.status as FactGroup["status"];
    tab.querySelector("span")!.textContent = formatNumber(
      visibleFacts.filter((fact) => fact.status === status).length,
    );
    tab.setAttribute("aria-selected", String(status === ledgerStatus));
  }

  const visible = visibleFacts.filter((fact) => fact.status === ledgerStatus);
  const list = $("#ledger-list");
  if (visible.length === 0) {
    list.replaceChildren(
      text("p", `No ${ledgerStatus} fact candidates were detected in the semantic sample.`, "empty-note"),
    );
    return;
  }
  list.replaceChildren(
    ...visible.map((fact) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ledger-item";
      const label = text("span", fact.status, `status-label ${fact.status}`);
      const meta = document.createElement("span");
      meta.className = "ledger-meta";
      meta.append(label, text("span", formatDate(fact.lastSeen)), text("span", `${fact.history.length} source${fact.history.length === 1 ? "" : "s"}`));
      button.append(
        text("strong", truncate(fact.statement, 320)),
        meta,
        fact.status === "current"
          ? document.createDocumentFragment()
          : text("small", `${formatPercent(fact.confidence)} evidence confidence`),
      );
      button.addEventListener("click", () => showFactEvidence(fact));
      return button;
    }),
  );
}

function showFactEvidence(fact: FactGroup) {
  $("#evidence-heading").textContent = fact.statement;
  const history = document.createElement("div");
  history.className = "fact-history";
  history.append(
    text("p", fact.reason, "evidence-note"),
    text(
      "p",
      `${formatPercent(fact.confidence)} evidence confidence · ${formatPercent(
        fact.similarity,
      )} semantic similarity · ${formatPercent(fact.lexicalSimilarity)} lexical overlap`,
      "evidence-note",
    ),
  );
  for (const item of fact.history) {
    const paragraph = document.createElement("p");
    paragraph.append(
      text("strong", `${formatDate(item.date)} · ${item.cue}`),
      document.createElement("br"),
      document.createTextNode(item.text),
    );
    history.append(paragraph);
  }
  const sources = fact.sources.map((source) => {
    const item = document.createElement("div");
    item.className = "evidence-source";
    item.append(text("strong", source.title), text("small", formatDate(source.date)));
    return item;
  });
  evidenceContent.replaceChildren(history, ...sources);
  openEvidencePanel();
}

function renderRepeats(report: FullReport) {
  const exact = report.deterministic.exactRepeats;
  const semantic = (report.semantic?.repeats ?? []).filter((repeat) =>
    clearsConfidence(repeat.confidence),
  );
  const summary = $("#repeat-summary");
  summary.replaceChildren(
    text("span", `${formatNumber(exact.length)} exact groups`),
    text("span", `${formatNumber(semantic.length)} semantic groups`),
  );

  const rows = [
    ...exact.map((repeat) => ({
      id: repeat.id,
      question: repeat.representative,
      count: repeat.count,
      kind: "Exact wording",
      date: repeat.lastAsked,
      sources: repeat.sources,
      notes: [`First asked ${formatDate(repeat.firstAsked)}`, `Asked ${repeat.count} times`],
    })),
    ...semantic.map((repeat) => ({
      id: repeat.id,
      question: repeat.representative,
      count: repeat.count,
      kind: `Semantic · ${formatPercent(repeat.similarity)}`,
      date: Math.max(...repeat.sources.map((source) => source.date)),
      sources: repeat.sources,
      notes: [
        `${formatPercent(repeat.confidence)} evidence confidence`,
        ...repeat.questions.slice(0, 5),
      ],
    })),
  ]
    .sort((left, right) => right.count - left.count)
    .slice(0, 80);

  const list = $("#repeat-list");
  if (rows.length === 0) {
    list.replaceChildren(text("p", "No repeated question groups were detected.", "empty-note"));
    return;
  }
  list.replaceChildren(
    ...rows.map((row) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "repeat-item";
      button.append(
        text("span", String(row.count), "interchange"),
        text("strong", truncate(row.question, 320), "repeat-question"),
        text("span", row.kind, "repeat-kind"),
        text("span", formatDate(row.date), "repeat-date"),
      );
      button.addEventListener("click", () => showEvidence(row.question, row.sources, row.notes));
      return button;
    }),
  );
}

function showThreadEvidence(
  segmentation: ThreadSegmentation,
  strands: ReturnType<typeof buildThreadStrands>,
) {
  $("#evidence-heading").textContent = segmentation.title;
  const summary = text(
    "p",
    `${segmentation.analyzedPrompts} of ${segmentation.promptCount} prompts analyzed · ${strands.length} visible strands at ${activeConfidence}% confidence.`,
    "evidence-note",
  );
  const timeline = document.createElement("ol");
  timeline.className = "strand-timeline";
  for (const strand of strands) {
    const item = document.createElement("li");
    item.append(
      text("strong", strand.label),
      text("small", `${strand.promptCount} prompt${strand.promptCount === 1 ? "" : "s"}`),
      ...strand.snippets.map((snippet) => text("p", truncate(snippet, 220))),
    );
    timeline.append(item);
  }
  const boundaryNotes = segmentation.boundaries
    .filter((boundary) => clearsConfidence(boundary.confidence))
    .map(
      (boundary) =>
        `${formatPercent(boundary.confidence)} boundary confidence · ${formatPercent(
          boundary.semanticSimilarity,
        )} semantic continuity`,
    );
  evidenceContent.replaceChildren(
    summary,
    timeline,
    ...boundaryNotes.map((note) => text("p", note, "evidence-note")),
  );
  openEvidencePanel();
}

function renderQuestionLenses(report: FullReport) {
  const lenses = report.deterministic.lenses;
  $("#domain-lenses").replaceChildren(
    ...lenses.categories.map((lens) => {
      const button = document.createElement("button");
      button.type = "button";
      const header = document.createElement("span");
      header.append(text("strong", lens.label), text("output", formatNumber(lens.queryCount)));
      button.append(
        header,
        text("small", lens.description),
        text(
          "span",
          `${formatNumber(lens.conversationCount)} conversation${lens.conversationCount === 1 ? "" : "s"}`,
          "lens-conversation-count",
        ),
      );
      button.addEventListener("click", () =>
        showEvidence(lens.label, lens.sources, [
          lens.description,
          `${formatNumber(lens.queryCount)} matching queries across ${formatNumber(lens.conversationCount)} conversations.`,
          "A query can match more than one lens.",
        ]),
      );
      return button;
    }),
  );

  const typo = lenses.typos;
  $("#typo-total").textContent = formatNumber(typo.totalSignals);
  $("#typo-method").textContent = typo.method;
  const typoList = $("#typo-list");
  if (typo.signals.length === 0) {
    typoList.replaceChildren(
      text("p", "No high-confidence typo signals matched the small local list.", "empty-note"),
    );
  } else {
    typoList.replaceChildren(
      ...typo.signals.map((signal) => {
        const button = document.createElement("button");
        button.type = "button";
        button.append(
          text("strong", signal.token),
          text("span", `→ ${signal.suggestion}`),
          text("output", formatNumber(signal.count)),
        );
        button.addEventListener("click", () =>
          showEvidence(`Likely typo: ${signal.token}`, signal.sources, [
            `Possible correction: ${signal.suggestion}`,
            `${formatNumber(signal.count)} matching quer${signal.count === 1 ? "y" : "ies"}.`,
            "This is a conservative spelling signal, not a writing-quality score.",
          ]),
        );
        return button;
      }),
    );
  }

  const threads = lenses.threads;
  const semanticThreads = (report.semantic?.threads ?? [])
    .map((segmentation) => ({
      segmentation,
      strands: buildThreadStrands(
        segmentation.prompts,
        segmentation.boundaries,
        confidenceThreshold(activeConfidence),
      ),
    }))
    .filter(({ strands }) => strands.length > 1);
  $("#thread-total").textContent = report.semantic
    ? `${formatNumber(semanticThreads.length)} / ${formatNumber(threads.eligibleConversations)}`
    : `${formatNumber(threads.likelyMultiThreaded)} / ${formatNumber(threads.eligibleConversations)}`;
  $("#thread-method").textContent = report.semantic
    ? "Likely candidates are refined with bounded adjacent-prompt embeddings. Raise confidence to merge weaker boundaries; short follow-ups stay with their surrounding strand."
    : threads.method;
  const threadList = $("#thread-list");
  if (report.semantic && semanticThreads.length > 0) {
    threadList.replaceChildren(
      ...semanticThreads.slice(0, 16).map(({ segmentation, strands }) => {
        const button = document.createElement("button");
        button.type = "button";
        button.append(
          text("strong", truncate(segmentation.title, 90)),
          text(
            "span",
            `${segmentation.promptCount} prompts · ${strands.length} visible strands · ${formatPercent(segmentation.confidence)} strongest boundary`,
          ),
        );
        button.addEventListener("click", () => showThreadEvidence(segmentation, strands));
        return button;
      }),
    );
  } else if (report.semantic) {
    threadList.replaceChildren(
      text(
        "p",
        "No semantic strand boundaries clear the active confidence threshold.",
        "empty-note",
      ),
    );
  } else if (threads.candidates.length === 0) {
    threadList.replaceChildren(
      text("p", "No conversations crossed the likely multi-thread threshold.", "empty-note"),
    );
  } else {
    threadList.replaceChildren(
      ...threads.candidates.slice(0, 16).map((candidate) => {
        const button = document.createElement("button");
        button.type = "button";
        button.append(
          text("strong", truncate(candidate.title, 90)),
          text(
            "span",
            `${candidate.promptCount} prompts · ${candidate.shiftCount} likely changes · ≈${candidate.estimatedThreads} threads`,
          ),
        );
        button.addEventListener("click", () =>
          showEvidence(candidate.title, candidate.sources, [
            `${candidate.promptCount} prompts contained ${candidate.shiftCount} low-overlap adjacent changes.`,
            `Roughly ${candidate.estimatedThreads} threads by this heuristic.`,
            "Short follow-ups were ignored. A subject change is not necessarily a derailment.",
          ]),
        );
        return button;
      }),
    );
  }
}

const TREND_LABELS: Record<TrendState, string> = {
  emerging: "Emerging",
  fading: "Fading",
  resurfacing: "Resurfacing",
  steady: "Steady",
  insufficient: "Not enough history",
};

const EMOTION_LABELS: Record<EmotionBucket, string> = {
  curiosity: "Curiosity",
  frustration: "Frustration",
  urgency: "Urgency",
  uncertainty: "Uncertainty",
  excitement: "Excitement",
  appreciation: "Appreciation",
  neutral: "Neutral / direct",
};

type EvolutionRow = {
  id: string;
  label: string;
  trend: TrendState;
  momentum: number;
  periods: Array<{ label: string; value: number }>;
  sources: SourceRef[];
  note: string;
};

function evolutionRows(report: FullReport): EvolutionRow[] {
  const monthlyQueryTotals = new Map(
    report.deterministic.emotions.byMonth.map(({ month, counts }) => [
      month,
      Object.values(counts).reduce((sum, value) => sum + value, 0),
    ]),
  );
  if (evolutionKind === "topics") {
    return (report.semantic?.topics ?? []).map((topic) => ({
      id: topic.id,
      label: topic.label,
      trend: topic.trend,
      momentum: topic.momentum,
      periods: topic.activityByMonth,
      sources: topic.sources,
      note: `${topic.count} sampled conversations assigned to this topic.`,
    }));
  }
  if (evolutionKind === "domains") {
    return report.deterministic.lenses.categories.map((lens) => {
      const trend = classifyTrend(lens.byMonth, monthlyQueryTotals);
      return {
        id: lens.id,
        label: lens.label,
        trend: trend.trend,
        momentum: trend.momentum,
        periods: lens.byMonth,
        sources: lens.sources,
        note: `${lens.queryCount} matching queries; categories can overlap.`,
      };
    });
  }
  const emotions = report.deterministic.emotions;
  return (Object.keys(emotions.counts) as EmotionBucket[]).map((bucket) => {
    const periods = emotions.byMonth.map(({ month, counts }) => ({
      label: month,
      value: counts[bucket],
    }));
    const trend = classifyTrend(periods, monthlyQueryTotals);
    return {
      id: bucket,
      label: EMOTION_LABELS[bucket],
      trend: trend.trend,
      momentum: trend.momentum,
      periods,
      sources: emotions.sources[bucket],
      note: `${emotions.counts[bucket]} queries matched this dominant vocabulary signal.`,
    };
  });
}

function renderEvolution(report: FullReport) {
  for (const tab of document.querySelectorAll<HTMLButtonElement>("[data-evolution]")) {
    tab.setAttribute("aria-selected", String(tab.dataset.evolution === evolutionKind));
  }
  const ordered = evolutionRows(report)
    .filter((row) => row.periods.some((period) => period.value > 0))
    .sort((left, right) => {
      const trendOrder: Record<TrendState, number> = {
        resurfacing: 0,
        emerging: 1,
        fading: 2,
        steady: 3,
        insufficient: 4,
      };
      return (
        trendOrder[left.trend] - trendOrder[right.trend] ||
        Math.abs(right.momentum) - Math.abs(left.momentum) ||
        right.periods.reduce((sum, period) => sum + period.value, 0) -
          left.periods.reduce((sum, period) => sum + period.value, 0)
      );
    })
    .slice(0, 12);
  const list = $("#evolution-list");
  if (ordered.length === 0) {
    list.replaceChildren(
      text(
        "p",
        evolutionKind === "topics"
          ? "Topic evolution appears after semantic analysis."
          : "Not enough chronological evidence was found.",
        "empty-note",
      ),
    );
  } else {
    list.replaceChildren(
      ...ordered.map((row) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `evolution-item ${row.trend}`;
        const heading = document.createElement("span");
        heading.append(
          text("strong", row.label),
          text("span", TREND_LABELS[row.trend], "trend-label"),
        );
        const route = document.createElement("span");
        route.className = "evolution-route";
        const max = Math.max(1, ...row.periods.map((period) => period.value));
        for (const period of row.periods) {
          const stop = document.createElement("i");
          stop.style.setProperty("--level", String(period.value / max));
          stop.title = `${period.label}: ${period.value}`;
          route.append(stop);
        }
        button.append(
          heading,
          route,
          text(
            "small",
            `${row.periods[0]?.label ?? "Unknown"} → ${row.periods.at(-1)?.label ?? "Unknown"} · ${row.note}`,
          ),
        );
        button.addEventListener("click", () =>
          showEvidence(row.label, row.sources, [
            `${TREND_LABELS[row.trend]} by the disclosed local time-series rule.`,
            row.note,
            ...row.periods
              .filter((period) => period.value > 0)
              .slice(-8)
              .map((period) => `${period.label}: ${period.value}`),
          ]),
        );
        return button;
      }),
    );
  }

  const changes = (report.semantic?.facts ?? [])
    .filter((fact) => fact.status !== "current" && clearsConfidence(fact.confidence))
    .sort((left, right) => right.lastSeen - left.lastSeen);
  $("#memory-change-total").textContent = formatNumber(changes.length);
  const changeList = $("#memory-change-list");
  if (changes.length === 0) {
    changeList.replaceChildren(
      text("p", "No memory changes clear the active confidence threshold.", "empty-note"),
    );
  } else {
    changeList.replaceChildren(
      ...changes.slice(0, 12).map((fact) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `memory-change-item ${fact.status}`;
        button.append(
          text("span", fact.status === "contradicted" ? "possible contradiction" : fact.status),
          text("strong", truncate(fact.statement, 150)),
          text(
            "small",
            `${formatDate(fact.firstSeen)} → ${formatDate(fact.lastSeen)} · ${formatPercent(fact.confidence)} confidence`,
          ),
        );
        button.addEventListener("click", () => showFactEvidence(fact));
        return button;
      }),
    );
  }
}

function renderConfidenceImpact(report: FullReport) {
  const semantic = report.semantic;
  if (!semantic) {
    $("#confidence-impact").textContent =
      "Deterministic totals are unchanged. Semantic candidates will appear as the model finishes.";
    return;
  }
  const repeats = semantic.repeats.filter((repeat) => clearsConfidence(repeat.confidence)).length;
  const changes = semantic.facts.filter(
    (fact) => fact.status !== "current" && clearsConfidence(fact.confidence),
  ).length;
  const boundaries = semantic.threads.reduce(
    (sum, thread) =>
      sum + thread.boundaries.filter((boundary) => clearsConfidence(boundary.confidence)).length,
    0,
  );
  $("#confidence-impact").textContent =
    `${activeConfidence}% shows ${repeats} semantic repeat groups, ${changes} memory changes, and ${boundaries} strand boundaries. Deterministic totals do not change.`;
}

function renderTone(report: FullReport) {
  const counts = report.deterministic.tone.counts;
  const total = counts.positive + counts.neutral + counts.negative;
  const labels = [
    ["positive", "Positive wording"],
    ["neutral", "Neutral / direct"],
    ["negative", "Negative wording"],
  ] as const;
  $("#tone-bars").replaceChildren(
    ...labels.map(([bucket, label]) => {
      const row = document.createElement("div");
      row.className = `tone-row ${bucket}`;
      const track = document.createElement("span");
      track.className = "tone-track";
      const fill = document.createElement("i");
      const proportion = total ? counts[bucket] / total : 0;
      fill.style.width = `${proportion * 100}%`;
      track.append(fill);
      const output = document.createElement("output");
      output.textContent = `${formatNumber(counts[bucket])} · ${formatPercent(proportion)}`;
      row.append(text("strong", label), track, output);
      return row;
    }),
  );

  const emotionCounts = report.deterministic.emotions.counts;
  const emotionTotal = Object.values(emotionCounts).reduce((sum, value) => sum + value, 0);
  const emotionLabels = [
    ["curiosity", "Curiosity", "Questions seeking explanation, understanding, or discovery"],
    ["frustration", "Frustration", "Wording about errors, being stuck, failure, or something not working"],
    ["urgency", "Urgency", "Time-pressure wording such as urgent, immediately, or deadline"],
    ["uncertainty", "Uncertainty", "Tentative wording such as unsure, maybe, or not sure"],
    ["excitement", "Excitement", "Enthusiastic wording such as excited, amazing, or can’t wait"],
    ["appreciation", "Appreciation", "Thanks, gratitude, and explicit appreciation"],
    ["neutral", "Neutral / direct", "No vocabulary cue from the disclosed groups"],
  ] as const;
  $("#emotion-bars").replaceChildren(
    ...emotionLabels.map(([bucket, label, description]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `emotion-row ${bucket}`;
      const marker = document.createElement("i");
      marker.setAttribute("aria-hidden", "true");
      const copy = document.createElement("span");
      copy.append(text("strong", label), text("small", description));
      const proportion = emotionTotal ? emotionCounts[bucket] / emotionTotal : 0;
      button.append(
        marker,
        copy,
        text("output", `${formatNumber(emotionCounts[bucket])} · ${formatPercent(proportion)}`),
      );
      button.addEventListener("click", () => {
        showEvidence(`${label} wording`, report.deterministic.emotions.sources[bucket], [
          description,
          `${formatNumber(emotionCounts[bucket])} queries matched this dominant language signal.`,
          "This is a vocabulary cue, not an inference about how you felt.",
        ]);
      });
      return button;
    }),
  );
}

function renderReflections(report: FullReport) {
  const list = $("#reflection-list");
  const visibleReflections = report.reflections.filter((reflection) =>
    clearsConfidence(reflection.confidence),
  );
  if (visibleReflections.length === 0) {
    list.replaceChildren(
      text(
        "p",
        report.semantic
          ? "No evidence-backed reflection prompts crossed the current thresholds."
          : "Reflection prompts will appear as repeat and memory patterns become available.",
        "empty-note",
      ),
    );
    return;
  }
  list.replaceChildren(
    ...visibleReflections.map((reflection, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `reflection-card ${reflection.kind}`;
      button.append(
        text("span", String(index + 1).padStart(2, "0"), "reflection-index"),
        text("span", reflection.eyebrow, "reflection-eyebrow"),
        text("strong", reflection.question),
        text("small", `${formatPercent(reflection.confidence)} confidence · ${reflection.reason} · Open ${reflection.sources.length} source${reflection.sources.length === 1 ? "" : "s"}`),
      );
      button.addEventListener("click", () =>
        showEvidence(reflection.eyebrow, reflection.sources, [
          reflection.question,
          reflection.reason,
        ]),
      );
      return button;
    }),
  );
}

function renderActivity(report: FullReport) {
  const activity = report.deterministic.activityByMonth;
  const max = Math.max(1, ...activity.map((datum) => datum.value));
  const chart = $("#activity-chart");
  chart.replaceChildren(
    ...activity.map((datum) => {
      const bar = document.createElement("button");
      bar.type = "button";
      bar.className = "activity-bar";
      bar.style.height = `${Math.max(3, (datum.value / max) * 100)}%`;
      bar.dataset.label = `${datum.label}: ${formatNumber(datum.value)} conversations`;
      bar.setAttribute("aria-label", bar.dataset.label);
      return bar;
    }),
  );
}

function renderSearchResults(results: SearchResult[]) {
  searchResults.hidden = false;
  if (results.length === 0) {
    searchResults.replaceChildren(
      text("p", "No semantic results yet. Wait for the topic map to finish.", "empty-note"),
    );
    return;
  }
  searchResults.replaceChildren(
    ...results.map((result) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "search-result";
      const body = document.createElement("span");
      body.append(
        text("strong", truncate(result.title, 240)),
        text("small", truncate(result.detail, 140)),
      );
      button.append(
        text("span", result.type, "search-result-type"),
        body,
        text("span", formatPercent(result.similarity), "search-result-score"),
      );
      button.addEventListener("click", () => {
        searchResults.hidden = true;
        if (result.topicId && currentReport?.semantic) {
          const topic = currentReport.semantic.topics.find((candidate) => candidate.id === result.topicId);
          if (topic) selectTopic(topic);
        } else if (result.source) {
          showEvidence(result.title, [result.source], [result.detail]);
        }
      });
      return button;
    }),
  );
}

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-confidence]")) {
  button.addEventListener("click", () => {
    setConfidence(Number(button.dataset.confidence));
  });
}

confidenceInput.addEventListener("input", () => setConfidence(Number(confidenceInput.value)));
reportConfidenceInput.addEventListener("input", () =>
  setConfidence(Number(reportConfidenceInput.value)),
);

for (const tab of document.querySelectorAll<HTMLButtonElement>("[data-evolution]")) {
  tab.addEventListener("click", () => {
    evolutionKind = tab.dataset.evolution as typeof evolutionKind;
    if (currentReport) renderEvolution(currentReport);
  });
}

for (const radio of document.querySelectorAll<HTMLInputElement>('input[name="model-profile"]')) {
  radio.addEventListener("change", () => {
    if (!radio.checked) return;
    appStatus.textContent =
      radio.value === "multilingual"
        ? "Multilingual model selected. Its larger download begins only after you choose a ZIP."
        : radio.value === "compact"
          ? "Compact English model selected."
          : "Automatic model selection enabled.";
  });
}

setConfidence(65, false);

archiveInput.addEventListener("change", () => {
  const file = archiveInput.files?.[0];
  if (file) analyzeFile(file);
});

for (const eventName of ["dragenter", "dragover"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("is-dragging");
  });
}

for (const eventName of ["dragleave", "drop"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("is-dragging");
  });
}

dropZone.addEventListener("drop", (event) => {
  const file = (event as DragEvent).dataTransfer?.files[0];
  if (file) analyzeFile(file);
});

$("#cancel-analysis").addEventListener("click", resetApp);
$("#error-reset").addEventListener("click", resetApp);
$("#reset-report").addEventListener("click", resetApp);
$("#close-evidence").addEventListener("click", () => closeEvidencePanel());

$("#memory-search").addEventListener("submit", (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;
  searchResults.hidden = false;
  searchResults.replaceChildren(text("p", "Searching the semantic index…", "empty-note"));
  send({ type: "search", query });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeEvidencePanel();
    searchResults.hidden = true;
  }
  if (event.key === "Tab" && !evidencePanel.hidden) {
    event.preventDefault();
    $<HTMLButtonElement>("#close-evidence").focus();
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k" && !reportView.hidden) {
    event.preventDefault();
    searchInput.focus();
  }
});

for (const tab of document.querySelectorAll<HTMLButtonElement>("#ledger-tabs button")) {
  tab.addEventListener("click", () => {
    ledgerStatus = tab.dataset.status as FactGroup["status"];
    if (currentReport) renderLedger(currentReport);
  });
}

saveButton.addEventListener("click", async () => {
  if (!currentSnapshot) {
    appStatus.textContent = "Wait for semantic analysis to finish before saving.";
    return;
  }
  await saveSnapshot(currentSnapshot);
  saveButton.textContent = "Saved on this device";
  saveButton.disabled = true;
  forgetButton.hidden = false;
  appStatus.textContent = "Derived memory saved in this browser.";
});

forgetButton.addEventListener("click", async () => {
  if (!window.confirm("Forget the saved memory map on this device?")) return;
  await forgetSnapshot();
  forgetButton.hidden = true;
  saveButton.hidden = false;
  saveButton.disabled = false;
  saveButton.textContent = "Keep on this device";
  appStatus.textContent = "Saved memory forgotten.";
});

void loadSnapshot()
  .then(async (snapshot) => {
    if (!snapshot) return;
    if ((snapshot as { version: number }).version !== 3) {
      await forgetSnapshot();
      showError(
        "An older saved memory was removed. Import the ZIP again to build evolution, confidence, and strand evidence.",
      );
      return;
    }
    currentSnapshot = snapshot;
    send({ type: "restore", snapshot });
  })
  .catch(() => {
    appStatus.textContent = "A saved memory could not be opened. Import the ZIP again.";
  });

if (import.meta.env.DEV) {
  const developmentSampleUrl = new URLSearchParams(window.location.search).get("sample");
  if (developmentSampleUrl) {
    void fetch(developmentSampleUrl)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Sample server returned ${response.status}.`);
        const blob = await response.blob();
        analyzeFile(new File([blob], "development-sample.zip", { type: "application/zip" }));
      })
      .catch((error) => {
        showError(error instanceof Error ? error.message : "The development sample could not load.");
      });
  }
}
