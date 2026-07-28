import type {
  EmotionBucket,
  FullReport,
  SourceRef,
  TrendState,
} from "../lib/types";
import {
  dot,
  plot,
  rectY,
  ruleX,
  ruleY,
  text as plotText,
} from "@observablehq/plot";

type AtlasContext = {
  clearsConfidence: (score: number) => boolean;
  showEvidence: (title: string, sources: SourceRef[], notes?: string[]) => void;
  periodMonths: number | null;
};

type RepeatPoint = {
  id: string;
  label: string;
  kind: "Exact wording" | "Meaning match";
  count: number;
  spanDays: number;
  confidence: number | null;
  sources: SourceRef[];
  latestDate: number;
};

const ROUTE_COLORS = ["#2157d5", "#008b7a", "#ef4b3e", "#8652c7", "#dc8700"];

const EMOTION_META: Record<EmotionBucket, { label: string; color: string }> = {
  curiosity: { label: "Curiosity", color: "#2157d5" },
  frustration: { label: "Frustration", color: "#ef4b3e" },
  urgency: { label: "Urgency", color: "#dc8700" },
  uncertainty: { label: "Uncertainty", color: "#8652c7" },
  excitement: { label: "Excitement", color: "#cf3fa0" },
  appreciation: { label: "Appreciation", color: "#008b7a" },
  neutral: { label: "Neutral / direct", color: "#66767d" },
};

const TREND_COLORS: Record<TrendState, string> = {
  emerging: "#008b7a",
  fading: "#ef4b3e",
  resurfacing: "#8652c7",
  steady: "#2157d5",
  insufficient: "#66767d",
};

const TREND_LABELS: Record<TrendState, string> = {
  emerging: "Emerging",
  fading: "Fading",
  resurfacing: "Resurfacing",
  steady: "Steady",
  insufficient: "Not enough history",
};

const numberFormat = new Intl.NumberFormat();
const shortMonthFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  timeZone: "UTC",
});
const fullDateFormat = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function $(selector: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Missing visual atlas element: ${selector}`);
  return element;
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  value?: string,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (value !== undefined) node.textContent = value;
  if (className) node.className = className;
  return node;
}

function formatNumber(value: number): string {
  return numberFormat.format(value);
}

function formatMonth(label: string): string {
  const date = new Date(`${label}-01T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? label : shortMonthFormat.format(date);
}

function formatIsoDate(label: string): string {
  const date = new Date(`${label}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? label : fullDateFormat.format(date);
}

function truncate(value: string, length: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > length
    ? `${normalized.slice(0, length - 1).trimEnd()}…`
    : normalized;
}

function emptyState(message: string): HTMLElement {
  return element("p", message, "atlas-empty");
}

function evidenceButton(
  label: string,
  meta: string,
  sources: SourceRef[],
  context: AtlasContext,
  notes: string[],
): HTMLButtonElement {
  const button = element("button", undefined, "chart-data-row");
  button.type = "button";
  button.append(element("strong", label), element("span", meta));
  button.addEventListener("click", () => context.showEvidence(label, sources, notes));
  return button;
}

function monthWindow(report: FullReport, periodMonths: number | null): string[] {
  const months = report.deterministic.activityByMonth
    .map((datum) => datum.label)
    .filter((label) => /^\d{4}-\d{2}$/.test(label));
  return periodMonths === null ? months : months.slice(-periodMonths);
}

function renderAtlasHighlight(report: FullReport, context: AtlasContext) {
  const button = document.querySelector<HTMLButtonElement>("#atlas-highlight");
  if (!button) return;
  const months = new Set(monthWindow(report, context.periodMonths));
  const ranked = report.deterministic.lenses.categories
    .map((lens) => ({
      lens,
      count: lens.byMonth
        .filter((datum) => months.has(datum.label))
        .reduce((sum, datum) => sum + datum.value, 0),
    }))
    .filter((entry) => entry.count > 0)
    .sort((left, right) => right.count - left.count);
  const strongest = ranked[0];
  if (!strongest) {
    button.hidden = true;
    button.onclick = null;
    return;
  }
  const periodLabel =
    context.periodMonths === null ? "across all history" : `in the recent ${context.periodMonths} months`;
  $("#atlas-highlight-title").textContent = `${strongest.lens.label} was your busiest question route.`;
  $("#atlas-highlight-detail").textContent =
    `${formatNumber(strongest.count)} matched queries ${periodLabel}. Categories overlap, so this is a route into the evidence—not a personality label.`;
  const periodSources = strongest.lens.sources.filter((source) => {
    const date = new Date(source.date);
    if (Number.isNaN(date.getTime())) return false;
    return months.has(date.toISOString().slice(0, 7));
  });
  const sources = periodSources.length ? periodSources : strongest.lens.sources;
  button.onclick = () =>
    context.showEvidence(`${strongest.lens.label} questions`, sources, [
      `${formatNumber(strongest.count)} matched queries ${periodLabel}.`,
      strongest.lens.description,
      "Question categories can overlap.",
    ]);
  button.hidden = false;
}

function ditherPatternMark(colors: string[]) {
  return () => {
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    colors.forEach((color, index) => {
      const pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
      pattern.setAttribute("id", `atlas-dither-${index}`);
      pattern.setAttribute("width", "6");
      pattern.setAttribute("height", "6");
      pattern.setAttribute("patternUnits", "userSpaceOnUse");
      const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      background.setAttribute("width", "6");
      background.setAttribute("height", "6");
      background.setAttribute("fill", color);
      background.setAttribute("fill-opacity", "0.82");
      const dotMark = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dotMark.setAttribute("cx", "1.5");
      dotMark.setAttribute("cy", "1.5");
      dotMark.setAttribute("r", "0.8");
      dotMark.setAttribute("fill", "#f3f5f2");
      dotMark.setAttribute("fill-opacity", "0.72");
      const secondDot = dotMark.cloneNode() as SVGCircleElement;
      secondDot.setAttribute("cx", "4.5");
      secondDot.setAttribute("cy", "4.5");
      pattern.append(background, dotMark, secondDot);
      defs.append(pattern);
    });
    return defs;
  };
}

function attachPlotActions(
  chart: HTMLElement,
  selector: string,
  actions: Array<() => void>,
  labels: string[],
) {
  const marks = [...chart.querySelectorAll<SVGElement>(selector)];
  if (marks.length !== actions.length) return;
  marks.forEach((mark, index) => {
    mark.setAttribute("tabindex", "0");
    mark.setAttribute("role", "button");
    mark.setAttribute("aria-label", labels[index]);
    const activate = () => actions[index]();
    mark.addEventListener("click", activate);
    mark.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
  });
}

function renderActivityCalendar(report: FullReport, context: AtlasContext) {
  const chart = $("#activity-calendar");
  const data = $("#activity-calendar-data");
  const activity = report.deterministic.activityByDay;
  if (!activity) {
    chart.replaceChildren(
      emptyState("Daily detail was not stored in this older snapshot. Re-import the ZIP to add it."),
    );
    data.replaceChildren(
      element(
        "p",
        "Monthly activity is still available below in Rhythms. Re-import the original ZIP for daily values.",
      ),
    );
    return;
  }
  if (activity.length === 0 || !report.deterministic.dateRange.end) {
    chart.replaceChildren(emptyState("No dated conversations were available for a calendar."));
    data.replaceChildren(element("p", "No dated daily activity."));
    return;
  }

  const end = new Date(report.deterministic.dateRange.end * 1_000);
  end.setUTCHours(0, 0, 0, 0);
  const endSundayOffset = 6 - end.getUTCDay();
  end.setUTCDate(end.getUTCDate() + endSundayOffset);
  const requestedWeeks =
    context.periodMonths === null ? 52 : Math.max(13, Math.ceil(context.periodMonths * 4.35));
  const visibleWeeks = Math.min(52, requestedWeeks);
  $("#activity-window-label").textContent =
    context.periodMonths === null || requestedWeeks > 52
      ? "Conversation starts · recent 52 weeks within the selected period"
      : `Conversation starts · recent ${visibleWeeks} weeks`;
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - visibleWeeks * 7 + 1);
  const byDay = new Map(activity.map((datum) => [datum.label, datum]));
  const visibleDays = Array.from({ length: visibleWeeks * 7 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const label = date.toISOString().slice(0, 10);
    return { date, label, datum: byDay.get(label) };
  });
  const max = Math.max(1, ...visibleDays.map(({ datum }) => datum?.value ?? 0));

  const monthLine = element("div", undefined, "calendar-months");
  const seenMonths = new Set<string>();
  monthLine.style.setProperty("--week-count", String(visibleWeeks));
  for (let week = 0; week < visibleWeeks; week += 1) {
    const date = visibleDays[week * 7]?.date;
    const month = date?.toISOString().slice(0, 7) ?? "";
    const label = month && !seenMonths.has(month) ? formatMonth(month) : "";
    if (month) seenMonths.add(month);
    monthLine.append(element("span", label));
  }

  const dayLabels = element("div", undefined, "calendar-day-labels");
  for (const label of ["S", "M", "T", "W", "T", "F", "S"]) {
    dayLabels.append(element("span", label));
  }
  const cells = element("div", undefined, "calendar-cells");
  cells.style.setProperty("--week-count", String(visibleWeeks));
  for (const { label, datum } of visibleDays) {
    const value = datum?.value ?? 0;
    if (value === 0) {
      const cell = element("i");
      cell.setAttribute("aria-hidden", "true");
      cells.append(cell);
      continue;
    }
    const mark = element("span");
    mark.className = "calendar-day";
    mark.style.setProperty("--level", String(Math.max(0.12, value / max)));
    mark.setAttribute("aria-hidden", "true");
    mark.title = `${formatIsoDate(label)} · ${formatNumber(value)} conversation${value === 1 ? "" : "s"}`;
    cells.append(mark);
  }

  const calendarBody = element("div", undefined, "calendar-body");
  calendarBody.append(dayLabels, cells);
  const scale = element("div", undefined, "calendar-scale");
  scale.append(
    element("span", "Quiet"),
    ...[0.18, 0.38, 0.62, 0.88].map((level) => {
      const mark = element("i");
      mark.style.setProperty("--level", String(level));
      return mark;
    }),
    element("span", "Busy"),
  );
  chart.replaceChildren(monthLine, calendarBody, scale);

  const active = visibleDays.filter(({ datum }) => (datum?.value ?? 0) > 0).reverse();
  data.replaceChildren(
    ...(active.length
      ? active.map(({ label, datum }) =>
          evidenceButton(
            formatIsoDate(label),
            `${formatNumber(datum?.value ?? 0)} conversation${datum?.value === 1 ? "" : "s"}`,
            datum?.sources ?? [],
            context,
            [`Daily activity in the visible ${visibleWeeks}-week window.`],
          ),
        )
      : [element("p", `No active days in the visible ${visibleWeeks}-week window.`)]),
  );
}

function renderQuestionMix(report: FullReport, context: AtlasContext) {
  const chart = $("#question-mix-chart");
  const legend = $("#question-mix-legend");
  const data = $("#question-mix-data");
  chart.replaceChildren();
  const months = monthWindow(report, context.periodMonths);
  $("#question-window-label").textContent =
    `Top five overlapping query routes · ${context.periodMonths === null ? "all history" : `recent ${context.periodMonths} months`}`;
  const lenses = report.deterministic.lenses.categories
    .slice()
    .sort((left, right) => right.queryCount - left.queryCount)
    .slice(0, 5);
  if (months.length === 0 || lenses.length === 0) {
    legend.replaceChildren();
    data.replaceChildren(element("p", "No chronological question-lens data."));
    chart.append(emptyState("No chronological question-lens data."));
    return;
  }

  const stacked: Array<{
    month: string;
    label: string;
    value: number;
    y1: number;
    y2: number;
    fill: string;
  }> = [];
  for (const month of months) {
    let total = 0;
    lenses.forEach((lens, index) => {
      const value = lens.byMonth.find((datum) => datum.label === month)?.value ?? 0;
      stacked.push({
        month,
        label: lens.label,
        value,
        y1: total,
        y2: total + value,
        fill: `url(#atlas-dither-${index})`,
      });
      total += value;
    });
  }
  const plotElement = plot({
    className: "atlas-observable-plot",
    width: 720,
    height: 320,
    marginTop: 16,
    marginRight: 12,
    marginBottom: 44,
    marginLeft: 48,
    ariaLabel: "Stacked monthly activity for the five most frequent overlapping question routes",
    ariaDescription:
      "Each prompt may belong to more than one route, so the stacked height is not a share of a whole.",
    style: {
      background: "transparent",
      color: "#627178",
      fontFamily: 'ui-monospace, "SFMono-Regular", Consolas, monospace',
      fontSize: "11px",
    },
    x: {
      domain: months,
      label: null,
      tickFormat: (value) => formatMonth(String(value)),
      tickRotate: 0,
    },
    y: { grid: true, label: "overlapping queries", nice: true },
    color: { type: "identity" },
    marks: [
      ditherPatternMark(ROUTE_COLORS),
      rectY(stacked, {
        x: "month",
        y1: "y1",
        y2: "y2",
        fill: "fill",
        inset: 1,
        title: (datum) =>
          `${datum.label}\n${formatMonth(datum.month)} · ${formatNumber(datum.value)} queries`,
      }),
      ruleY([0], { stroke: "#26353c" }),
    ],
  });
  chart.append(plotElement);

  legend.replaceChildren(
    ...lenses.map((lens, index) => {
      const button = element("button");
      button.type = "button";
      const marker = element("i");
      marker.style.background = ROUTE_COLORS[index];
      const selectedCount = lens.byMonth
        .filter((datum) => months.includes(datum.label))
        .reduce((sum, datum) => sum + datum.value, 0);
      button.append(marker, element("span", lens.label), element("b", formatNumber(selectedCount)));
      button.addEventListener("click", () =>
        context.showEvidence(lens.label, lens.sources, [
          lens.description,
          `${formatNumber(selectedCount)} matching queries in the selected period. Question routes overlap.`,
        ]),
      );
      return button;
    }),
  );
  data.replaceChildren(
    ...lenses.map((lens) =>
      evidenceButton(
        lens.label,
        months
          .map(
            (month) =>
              `${formatMonth(month)} ${formatNumber(lens.byMonth.find((datum) => datum.label === month)?.value ?? 0)}`,
          )
          .join(" · "),
        lens.sources.filter((source) =>
          months.includes(new Date(source.date * 1_000).toISOString().slice(0, 7)),
        ),
        context,
        [lens.description, "A query can count in more than one route."],
      ),
    ),
  );
}

function renderLanguageMatrix(report: FullReport, context: AtlasContext) {
  const chart = $("#language-matrix");
  const data = $("#language-matrix-data");
  const months = monthWindow(report, context.periodMonths);
  $("#language-window-label").textContent =
    `Dominant vocabulary cue per query · ${context.periodMonths === null ? "all history" : `recent ${context.periodMonths} months`}`;
  const emotions = report.deterministic.emotions;
  const buckets = Object.keys(EMOTION_META) as EmotionBucket[];
  if (months.length === 0) {
    chart.replaceChildren(emptyState("No chronological language-signal data."));
    data.replaceChildren(element("p", "No chronological language-signal data."));
    return;
  }

  const grid = element("div", undefined, "language-grid");
  grid.style.setProperty("--month-count", String(months.length));
  grid.append(element("span", "Signal", "matrix-corner"));
  for (const month of months) grid.append(element("span", formatMonth(month), "matrix-month"));
  for (const bucket of buckets) {
    const meta = EMOTION_META[bucket];
    const rowButton = element("button");
    rowButton.type = "button";
    rowButton.className = "matrix-row-label";
    rowButton.style.setProperty("--signal-color", meta.color);
    rowButton.append(element("i"), element("span", meta.label));
    rowButton.addEventListener("click", () =>
      context.showEvidence(
        `${meta.label} wording`,
        emotions.sources[bucket].filter((source) =>
          months.includes(new Date(source.date * 1_000).toISOString().slice(0, 7)),
        ),
        [
        `${formatNumber(
          emotions.byMonth
            .filter((datum) => months.includes(datum.month))
            .reduce((sum, datum) => sum + datum.counts[bucket], 0),
        )} queries matched this dominant vocabulary signal in the selected period.`,
        "This describes query wording, not how you felt.",
        ],
      ),
    );
    grid.append(rowButton);
    const monthlyValues = months.map(
      (month) => emotions.byMonth.find((datum) => datum.month === month)?.counts[bucket] ?? 0,
    );
    const max = Math.max(1, ...monthlyValues);
    monthlyValues.forEach((value, monthIndex) => {
      const cell = element("span", undefined, "matrix-cell");
      cell.style.setProperty("--signal-color", meta.color);
      cell.style.setProperty("--level", String(value / max));
      cell.title = `${meta.label} · ${months[monthIndex]} · ${formatNumber(value)} queries`;
      cell.setAttribute(
        "aria-label",
        `${meta.label}, ${formatMonth(months[monthIndex])}: ${formatNumber(value)} queries`,
      );
      grid.append(cell);
    });
  }
  chart.replaceChildren(grid);
  data.replaceChildren(
    ...buckets.map((bucket) => {
      const meta = EMOTION_META[bucket];
      return evidenceButton(
        meta.label,
        months
          .map((month) => {
            const value =
              emotions.byMonth.find((datum) => datum.month === month)?.counts[bucket] ?? 0;
            return `${formatMonth(month)} ${formatNumber(value)}`;
          })
          .join(" · "),
        emotions.sources[bucket].filter((source) =>
          months.includes(new Date(source.date * 1_000).toISOString().slice(0, 7)),
        ),
        context,
        [
          `${formatNumber(emotions.counts[bucket])} total queries matched this dominant vocabulary signal.`,
          "This describes query wording, not how you felt.",
        ],
      );
    }),
  );
}

function repeatPoints(report: FullReport, context: AtlasContext): RepeatPoint[] {
  const visibleMonths = new Set(monthWindow(report, context.periodMonths));
  const exact: RepeatPoint[] = report.deterministic.exactRepeats.map((repeat) => ({
    id: repeat.id,
    label: repeat.representative,
    kind: "Exact wording",
    count: repeat.count,
    spanDays: Math.max(0, Math.round((repeat.lastAsked - repeat.firstAsked) / 86_400)),
    confidence: null,
    sources: repeat.sources,
    latestDate: repeat.lastAsked,
  }));
  const semantic: RepeatPoint[] = (report.semantic?.repeats ?? [])
    .filter((repeat) => context.clearsConfidence(repeat.confidence))
    .map((repeat) => {
      const dates = repeat.sources.map((source) => source.date).filter(Boolean);
      return {
        id: repeat.id,
        label: repeat.representative,
        kind: "Meaning match",
        count: repeat.count,
        spanDays:
          dates.length > 1
            ? Math.max(0, Math.round((Math.max(...dates) - Math.min(...dates)) / 86_400))
            : 0,
        confidence: repeat.confidence,
        sources: repeat.sources,
        latestDate: dates.length ? Math.max(...dates) : 0,
      };
    });
  return [...exact, ...semantic]
    .filter(
      (point) =>
        context.periodMonths === null ||
        visibleMonths.has(new Date(point.latestDate * 1_000).toISOString().slice(0, 7)),
    )
    .sort((left, right) => right.count - left.count || right.spanDays - left.spanDays)
    .slice(0, 22);
}

function renderRepeatLandscape(report: FullReport, context: AtlasContext) {
  const chart = $("#repeat-landscape");
  const data = $("#repeat-landscape-data");
  chart.replaceChildren();
  const points = repeatPoints(report, context);
  if (points.length === 0) {
    chart.append(
      emptyState(
        report.semantic ? "No repeat groups cleared this lens." : "No exact repeat groups yet.",
      ),
    );
    data.replaceChildren(element("p", "No repeat groups available for this view."));
    return;
  }
  const plotPoints = points.map((point, index) => ({
    ...point,
    x: point.spanDays + 1,
    fill: `url(#atlas-dither-${point.kind === "Exact wording" ? 0 : 1})`,
    symbol: point.kind === "Exact wording" ? "circle" : "diamond",
    shortLabel: index < 5 ? truncate(point.label, 22) : "",
  }));
  const plotElement = plot({
    className: "atlas-observable-plot",
    width: 620,
    height: 350,
    marginTop: 26,
    marginRight: 20,
    marginBottom: 54,
    marginLeft: 54,
    ariaLabel: "Repeated questions by frequency and elapsed time",
    ariaDescription:
      "Circles are exact wording groups. Diamonds are meaning-match groups that clear the active confidence threshold.",
    style: {
      background: "transparent",
      color: "#627178",
      fontFamily: 'ui-monospace, "SFMono-Regular", Consolas, monospace',
      fontSize: "11px",
    },
    x: {
      type: "log",
      label: "days between first and latest ask",
      tickFormat: (value) => formatNumber(Math.max(0, Number(value) - 1)),
    },
    y: { grid: true, label: "times asked", nice: true },
    r: { range: [5, 13] },
    symbol: { domain: ["circle", "diamond"], range: ["circle", "diamond"] },
    color: { type: "identity" },
    marks: [
      ditherPatternMark(["#ef4b3e", "#8652c7"]),
      ruleY([1], { stroke: "#26353c" }),
      dot(plotPoints, {
        x: "x",
        y: "count",
        r: "count",
        symbol: "symbol",
        fill: "fill",
        stroke: "#26353c",
        strokeWidth: 1.2,
        title: (point) =>
          `${point.kind}\n${point.count} asks · ${point.spanDays} days\n${truncate(point.label, 120)}`,
      }),
      plotText(
        plotPoints.filter((point) => point.shortLabel),
        {
          x: "x",
          y: "count",
          text: "shortLabel",
          dx: 9,
          dy: -9,
          textAnchor: "start",
          fontSize: 10,
          fill: "#26353c",
        },
      ),
    ],
  });
  chart.append(plotElement);
  attachPlotActions(
    chart,
    'g[aria-label="dot"] > circle, g[aria-label="dot"] > path',
    points.map(
      (point) => () =>
        context.showEvidence(point.label, point.sources, [
          `${formatNumber(point.count)} asks across ${formatNumber(point.spanDays)} days.`,
          point.kind === "Meaning match" && point.confidence !== null
            ? `${Math.round(point.confidence * 100)}% semantic evidence confidence.`
            : point.kind,
        ]),
    ),
    points.map(
      (point) =>
        `${truncate(point.label, 90)}. ${point.count} asks across ${point.spanDays} days. ${point.kind}. Open sources.`,
    ),
  );
  data.replaceChildren(
    ...points.map((point) =>
      evidenceButton(
        truncate(point.label, 110),
        `${formatNumber(point.count)} asks · ${formatNumber(point.spanDays)} days · ${point.kind}`,
        point.sources,
        context,
        [
          `${formatNumber(point.count)} asks across ${formatNumber(point.spanDays)} days.`,
          point.kind,
        ],
      ),
    ),
  );
}

function renderTopicMomentum(report: FullReport, context: AtlasContext) {
  const chart = $("#topic-momentum");
  const state = $("#topic-momentum-state");
  const data = $("#topic-momentum-data");
  chart.replaceChildren();
  if (!report.semantic) {
    state.hidden = false;
    chart.classList.add("is-hidden");
    data.replaceChildren(element("p", "Topic momentum appears after semantic analysis."));
    return;
  }
  const selectedMonths = monthWindow(report, context.periodMonths);
  const topics = report.semantic.topics
    .map((topic) => ({
      ...topic,
      selectedCount: topic.activityByMonth
        .filter((datum) => selectedMonths.includes(datum.label))
        .reduce((sum, datum) => sum + datum.value, 0),
    }))
    .filter((topic) => topic.selectedCount > 0)
    .slice()
    .sort((left, right) => right.selectedCount - left.selectedCount)
    .slice(0, 18);
  if (topics.length === 0) {
    state.hidden = false;
    state.replaceChildren(
      element("strong", "No sampled topics were available."),
      element("small", "The deterministic atlas remains usable."),
    );
    chart.classList.add("is-hidden");
    data.replaceChildren(element("p", "No sampled topics."));
    return;
  }
  state.hidden = true;
  chart.classList.remove("is-hidden");
  const maxMomentum = Math.max(0.2, ...topics.map((topic) => Math.abs(topic.momentum)));
  const plotTopics = topics.map((topic, index) => ({
    ...topic,
    normalizedMomentum: topic.momentum / maxMomentum,
    shortLabel: index < 8 ? truncate(topic.label.split(" · ")[0], 21) : "",
    fill: `url(#atlas-dither-${Object.keys(TREND_COLORS).indexOf(topic.trend)})`,
  }));
  const trendColors = Object.keys(TREND_COLORS).map(
    (trend) => TREND_COLORS[trend as TrendState],
  );
  const plotElement = plot({
    className: "atlas-observable-plot",
    width: 620,
    height: 350,
    marginTop: 28,
    marginRight: 32,
    marginBottom: 52,
    marginLeft: 56,
    ariaLabel: "Semantic topics by local momentum and selected-period conversation count",
    ariaDescription:
      "Marks left of zero are fading locally, marks right of zero are emerging locally, and mark size reflects sampled conversation count in the selected period.",
    style: {
      background: "transparent",
      color: "#627178",
      fontFamily: 'ui-monospace, "SFMono-Regular", Consolas, monospace',
      fontSize: "11px",
    },
    x: {
      domain: [-1, 1],
      label: "fading ← local movement → emerging",
      tickFormat: (value) => (Number(value) === 0 ? "steady" : ""),
    },
    y: { grid: true, label: "sampled conversations", nice: true },
    r: { range: [6, 18] },
    color: { type: "identity" },
    marks: [
      ditherPatternMark(trendColors),
      ruleX([0], { stroke: "#26353c", strokeDasharray: "4,4" }),
      dot(plotTopics, {
        x: "normalizedMomentum",
        y: "selectedCount",
        r: "selectedCount",
        fill: "fill",
        stroke: "#26353c",
        strokeWidth: 1.2,
        title: (topic) =>
          `${topic.label}\n${topic.selectedCount} selected-period conversations · ${TREND_LABELS[topic.trend as TrendState]}`,
      }),
      plotText(
        plotTopics.filter((topic) => topic.shortLabel),
        {
          x: "normalizedMomentum",
          y: "selectedCount",
          text: "shortLabel",
          dx: 9,
          dy: -9,
          textAnchor: "start",
          fontSize: 10,
          fill: "#26353c",
        },
      ),
    ],
  });
  chart.append(plotElement);
  attachPlotActions(
    chart,
    'g[aria-label="dot"] > circle, g[aria-label="dot"] > path',
    topics.map(
      (topic) => () =>
        context.showEvidence(topic.label, topic.sources, [
          `${formatNumber(topic.selectedCount)} sampled conversations in the selected period.`,
          `${TREND_LABELS[topic.trend]} by the disclosed all-history local time-series rule.`,
          `Momentum score ${topic.momentum.toFixed(2)}.`,
        ]),
    ),
    topics.map(
      (topic) =>
        `${topic.label}. ${topic.selectedCount} selected-period conversations. ${TREND_LABELS[topic.trend]}. Open sources.`,
    ),
  );
  data.replaceChildren(
    ...topics.map((topic) =>
      evidenceButton(
        topic.label,
        `${formatNumber(topic.selectedCount)} selected-period conversations · ${TREND_LABELS[topic.trend]} · momentum ${topic.momentum.toFixed(2)}`,
        topic.sources,
        context,
        [
          `${formatNumber(topic.selectedCount)} sampled conversations in the selected period.`,
          `${TREND_LABELS[topic.trend]} by the disclosed local time-series rule.`,
        ],
      ),
    ),
  );
}

function shapeGroup(
  title: string,
  subtitle: string,
  values: Array<{ label: string; value: number }>,
): HTMLElement {
  const group = element("section", undefined, "shape-group");
  const heading = element("header");
  heading.append(element("strong", title), element("small", subtitle));
  group.append(heading);
  const max = Math.max(1, ...values.map((datum) => datum.value));
  for (const datum of values) {
    const row = element("div", undefined, "shape-row");
    const track = element("span", undefined, "shape-track");
    const fill = element("i");
    fill.style.width = `${(datum.value / max) * 100}%`;
    track.append(fill);
    row.append(element("span", datum.label), track, element("b", formatNumber(datum.value)));
    group.append(row);
  }
  return group;
}

function renderConversationShape(report: FullReport) {
  const chart = $("#conversation-shape");
  const data = $("#conversation-shape-data");
  const deterministic = report.deterministic;
  const depth = [
    { label: "Short · 1–4 messages", value: deterministic.depth.short },
    { label: "Medium · 5–14", value: deterministic.depth.medium },
    { label: "Deep · 15+", value: deterministic.depth.deep },
  ];
  const weekday = deterministic.activityByWeekday;
  const models = deterministic.modelUsage.slice(0, 5);
  chart.replaceChildren(
    shapeGroup("Depth", `Median ${formatNumber(deterministic.depth.medianMessages)} messages`, depth),
    shapeGroup("Weekday rhythm", "Conversation starts", weekday),
    shapeGroup("Model mix", "Top five exported model labels", models),
  );
  data.replaceChildren(
    element(
      "p",
      `Depth — ${depth.map((datum) => `${datum.label}: ${formatNumber(datum.value)}`).join(" · ")}`,
    ),
    element(
      "p",
      `Weekdays — ${weekday.map((datum) => `${datum.label}: ${formatNumber(datum.value)}`).join(" · ")}`,
    ),
    element(
      "p",
      `Models — ${models.map((datum) => `${datum.label}: ${formatNumber(datum.value)}`).join(" · ") || "No model labels"}`,
    ),
  );
}

export function renderVisualAtlas(report: FullReport, context: AtlasContext) {
  $("#atlas-period-note").textContent =
    context.periodMonths === null
      ? "All stored months shown where exact period filtering is supported. Shape and overview remain all-time."
      : `Recent ${context.periodMonths} months applied to chronological charts, query tone, and language signals. Shape and overview remain all-time.`;
  renderAtlasHighlight(report, context);
  renderActivityCalendar(report, context);
  renderQuestionMix(report, context);
  renderLanguageMatrix(report, context);
  renderRepeatLandscape(report, context);
  renderTopicMomentum(report, context);
  renderConversationShape(report);
}
