export type SourceRef = {
  conversationId: string;
  title: string;
  date: number;
};

export type UserPrompt = SourceRef & {
  id: string;
  text: string;
};

export type ConversationRecord = SourceRef & {
  updatedAt: number;
  model: string;
  messageCount: number;
  userMessageCount: number;
  assistantMessageCount: number;
  wordCount: number;
  prompts: UserPrompt[];
};

export type CountDatum = {
  label: string;
  value: number;
};

export type ExactRepeat = {
  id: string;
  representative: string;
  count: number;
  firstAsked: number;
  lastAsked: number;
  sources: SourceRef[];
};

export type ToneBucket = "positive" | "neutral" | "negative";

export type ToneReport = {
  counts: Record<ToneBucket, number>;
  byMonth: Array<{ month: string; positive: number; neutral: number; negative: number }>;
  negativeRate: number;
  method: string;
};

export type EmotionBucket =
  | "curiosity"
  | "frustration"
  | "urgency"
  | "uncertainty"
  | "excitement"
  | "appreciation"
  | "neutral";

export type EmotionReport = {
  counts: Record<EmotionBucket, number>;
  byMonth: Array<{ month: string; counts: Record<EmotionBucket, number> }>;
  method: string;
};

export type QuestionLens = {
  id:
    | "math"
    | "health"
    | "software"
    | "money"
    | "career"
    | "learning"
    | "creative"
    | "relationships"
    | "travel"
    | "planning";
  label: string;
  description: string;
  queryCount: number;
  conversationCount: number;
  sources: SourceRef[];
};

export type TypoSignal = {
  token: string;
  suggestion: string;
  count: number;
  sources: SourceRef[];
};

export type ThreadShiftCandidate = {
  id: string;
  title: string;
  date: number;
  promptCount: number;
  shiftCount: number;
  estimatedThreads: number;
  sources: SourceRef[];
};

export type QuestionLensReport = {
  categories: QuestionLens[];
  typos: {
    totalSignals: number;
    affectedQueries: number;
    signals: TypoSignal[];
    method: string;
  };
  threads: {
    eligibleConversations: number;
    likelyMultiThreaded: number;
    candidates: ThreadShiftCandidate[];
    method: string;
  };
};

export type DeterministicReport = {
  totals: {
    conversations: number;
    messages: number;
    userPrompts: number;
    words: number;
    activeDays: number;
    longestStreak: number;
  };
  dateRange: { start: number; end: number };
  activityByMonth: CountDatum[];
  activityByWeekday: CountDatum[];
  modelUsage: CountDatum[];
  depth: {
    medianMessages: number;
    short: number;
    medium: number;
    deep: number;
  };
  recurringTerms: CountDatum[];
  exactRepeats: ExactRepeat[];
  tone: ToneReport;
  emotions: EmotionReport;
  lenses: QuestionLensReport;
};

export type SemanticRepeat = {
  id: string;
  representative: string;
  count: number;
  similarity: number;
  questions: string[];
  sources: SourceRef[];
};

export type FactCandidate = SourceRef & {
  id: string;
  text: string;
  cue: "statement" | "update" | "refutation";
};

export type FactGroup = {
  id: string;
  status: "current" | "updated" | "refuted";
  statement: string;
  firstSeen: number;
  lastSeen: number;
  history: FactCandidate[];
  sources: SourceRef[];
};

export type TopicNode = {
  id: string;
  label: string;
  count: number;
  x: number;
  y: number;
  color: string;
  terms: string[];
  sources: SourceRef[];
};

export type TopicEdge = {
  source: string;
  target: string;
  similarity: number;
};

export type SemanticReport = {
  model: {
    id: string;
    revision: string;
    embeddedConversations: number;
    totalConversations: number;
    embeddedQuestions: number;
    totalQuestions: number;
    embeddedFacts: number;
    totalFacts: number;
  };
  repeats: SemanticRepeat[];
  facts: FactGroup[];
  topics: TopicNode[];
  edges: TopicEdge[];
};

export type ReflectionQuestion = {
  id: string;
  kind:
    | "repeat"
    | "changed-memory"
    | "refuted-memory"
    | "wording-spike"
    | "stale-memory"
    | "dormant-theme"
    | "recurring-term"
    | "activity-peak";
  eyebrow: string;
  question: string;
  reason: string;
  sources: SourceRef[];
};

export type FullReport = {
  generatedAt: number;
  fileName: string;
  deterministic: DeterministicReport;
  semantic: SemanticReport | null;
  reflections: ReflectionQuestion[];
};

export type SearchEntry = {
  id: string;
  type: "conversation" | "question" | "fact" | "topic";
  title: string;
  detail: string;
  source: SourceRef | null;
  topicId: string | null;
  embedding: Float32Array;
};

export type LexicalSearchEntry = Omit<SearchEntry, "embedding">;

export type MemorySnapshot = {
  version: 2;
  report: FullReport;
  searchIndex: SearchEntry[];
  lexicalIndex: LexicalSearchEntry[];
};

export type SearchResult = Omit<SearchEntry, "embedding"> & {
  similarity: number;
};

export type WorkerRequest =
  | { type: "analyze"; file: File }
  | { type: "search"; query: string }
  | { type: "restore"; snapshot: MemorySnapshot }
  | { type: "reset" };

export type WorkerResponse =
  | {
      type: "progress";
      phase: "discover" | "parse" | "statistics" | "model" | "embed" | "cluster";
      label: string;
      current: number;
      total: number;
    }
  | { type: "deterministic"; report: FullReport }
  | { type: "complete"; report: FullReport; snapshot: MemorySnapshot }
  | { type: "restored"; report: FullReport }
  | { type: "search-results"; query: string; results: SearchResult[] }
  | { type: "error"; message: string; recoverable: boolean };
