import { distinctiveTerms, distinctiveTitleTerms, lexicalSimilarity } from "./insights";
import type {
  ConversationRecord,
  FactCandidate,
  FactGroup,
  LexicalSearchEntry,
  SearchEntry,
  SemanticRepeat,
  SemanticReport,
  SourceRef,
  TopicEdge,
  TopicNode,
  UserPrompt,
} from "./types";

export const MODEL_ID = "Xenova/all-MiniLM-L6-v2";
export const MODEL_REVISION = "751bff37182d3f1213fa05d7196b954e230abad9";
const CONVERSATION_CAP = 600;
const QUESTION_CAP = 800;
const FACT_CAP = 1_500;
const COLORS = ["#2157d5", "#e44b33", "#168579", "#d69a17", "#7554c8", "#2f7aa3"];
const TOPIC_ANCHORS = [
  ["Software engineering", "programming software engineering code frontend backend database bugs"],
  ["AI & machine learning", "artificial intelligence machine learning language models agents embeddings"],
  ["Product & startups", "startup product strategy saas business ideas customers growth"],
  ["Investing & markets", "stocks investing market portfolio companies earnings valuation"],
  ["Personal finance", "money budgeting taxes savings debt insurance personal finance"],
  ["Health & nutrition", "health nutrition protein calories sleep symptoms medicine food"],
  ["Fitness & training", "exercise gym strength running training workout mobility"],
  ["Learning & education", "learning studying courses education explanations skills practice"],
  ["Career & work", "career jobs interviews work workplace management professional growth"],
  ["Productivity & planning", "productivity planning focus habits tasks time management"],
  ["Design & creativity", "design user interface visual creativity art writing"],
  ["Books & writing", "books reading writing stories essays literature"],
  ["Entertainment & anime", "anime manga films television games entertainment characters"],
  ["Travel & places", "travel cities countries transport hotels itineraries"],
  ["Relationships & communication", "relationships friends family communication dating conflict"],
  ["Philosophy & reflection", "philosophy values meaning identity self reflection beliefs"],
  ["News & current affairs", "news politics policy current affairs society events"],
  ["Research & analysis", "research evidence papers analysis comparison evaluation data"],
  ["Food & cooking", "food cooking recipes meals ingredients restaurants"],
  ["Home & lifestyle", "home shopping clothes devices lifestyle routines"],
] as const;

type Progress = (label: string, current: number, total: number) => void;

type TensorLike = {
  data: Float32Array | number[];
  dims: number[];
};

type Extractor = {
  (input: string | string[], options: { pooling: "mean"; normalize: true }): Promise<TensorLike>;
  dispose(): Promise<void>;
};

let extractorPromise: Promise<Extractor> | null = null;

function sourceOf(value: ConversationRecord | UserPrompt | FactCandidate): SourceRef {
  return {
    conversationId: value.conversationId,
    title: value.title,
    date: value.date,
  };
}

function normalizedKey(text: string): string {
  return text
    .toLocaleLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stableSample<T extends { date: number }>(items: T[], cap: number): T[] {
  if (items.length <= cap) return [...items];
  const sorted = [...items].sort((left, right) => left.date - right.date);
  const recentCount = Math.min(Math.floor(cap * 0.35), sorted.length);
  const selected = new Set<T>(sorted.slice(-recentCount));
  const remaining = cap - selected.size;
  const stride = (sorted.length - recentCount) / Math.max(1, remaining);
  for (let index = 0; index < remaining; index += 1) {
    selected.add(sorted[Math.min(sorted.length - recentCount - 1, Math.floor(index * stride))]);
  }
  return [...selected].sort((left, right) => left.date - right.date).slice(0, cap);
}

function sampleQuestions(prompts: UserPrompt[]): UserPrompt[] {
  const unique = new Map<string, UserPrompt>();
  const frequency = new Map<string, number>();
  for (const prompt of prompts) {
    const key = normalizedKey(prompt.text);
    if (key.length < 12 || key.length > 800) continue;
    frequency.set(key, (frequency.get(key) ?? 0) + 1);
    const current = unique.get(key);
    if (!current || prompt.date > current.date) unique.set(key, prompt);
  }
  const ranked = [...unique.values()].sort((left, right) => {
    const countDifference =
      (frequency.get(normalizedKey(right.text)) ?? 0) -
      (frequency.get(normalizedKey(left.text)) ?? 0);
    return countDifference || right.date - left.date;
  });
  if (ranked.length <= QUESTION_CAP) return ranked;
  const repeated = ranked.filter((prompt) => (frequency.get(normalizedKey(prompt.text)) ?? 0) > 1);
  const keep = repeated.slice(0, Math.floor(QUESTION_CAP * 0.35));
  const rest = stableSample(
    ranked.filter((prompt) => !keep.includes(prompt)),
    QUESTION_CAP - keep.length,
  );
  return [...keep, ...rest];
}

async function getExtractor(progress: Progress): Promise<Extractor> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { env, pipeline } = await import("@huggingface/transformers");
      env.allowLocalModels = false;
      env.allowRemoteModels = true;
      env.useBrowserCache = true;
      return (await pipeline("feature-extraction", MODEL_ID, {
        revision: MODEL_REVISION,
        dtype: "q8",
        progress_callback: (event: {
          status: string;
          file?: string;
          progress?: number;
          loaded?: number;
          total?: number;
        }) => {
          if (event.status === "progress") {
            progress(
              event.file ? `Downloading ${event.file}` : "Downloading embedding model",
              event.loaded ?? event.progress ?? 0,
              event.total ?? 100,
            );
          }
        },
      })) as unknown as Extractor;
    })();
  }
  return extractorPromise;
}

export async function disposeExtractor(): Promise<void> {
  if (!extractorPromise) return;
  const extractor = await extractorPromise;
  await extractor.dispose();
  extractorPromise = null;
}

async function embedTexts(texts: string[], progress: Progress): Promise<Float32Array[]> {
  if (texts.length === 0) return [];
  const extractor = await getExtractor(progress);
  const embeddings: Float32Array[] = [];
  const batchSize = 24;

  for (let start = 0; start < texts.length; start += batchSize) {
    const batch = texts.slice(start, start + batchSize);
    const output = await extractor(batch, { pooling: "mean", normalize: true });
    const dimensions = output.dims.at(-1) ?? 384;
    const data = output.data instanceof Float32Array ? output.data : Float32Array.from(output.data);
    for (let index = 0; index < batch.length; index += 1) {
      embeddings.push(data.slice(index * dimensions, (index + 1) * dimensions));
    }
    progress("Embedding memory candidates", Math.min(start + batch.length, texts.length), texts.length);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return embeddings;
}

export function cosine(left: Float32Array, right: Float32Array): number {
  let value = 0;
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) value += left[index] * right[index];
  return value;
}

function average(vectors: Float32Array[]): Float32Array {
  if (vectors.length === 0) return new Float32Array();
  const output = new Float32Array(vectors[0].length);
  for (const vector of vectors) {
    for (let index = 0; index < vector.length; index += 1) output[index] += vector[index];
  }
  let magnitude = 0;
  for (let index = 0; index < output.length; index += 1) {
    output[index] /= vectors.length;
    magnitude += output[index] ** 2;
  }
  magnitude = Math.sqrt(magnitude) || 1;
  for (let index = 0; index < output.length; index += 1) output[index] /= magnitude;
  return output;
}

class UnionFind {
  private parent: number[];

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, index) => index);
  }

  find(value: number): number {
    if (this.parent[value] !== value) this.parent[value] = this.find(this.parent[value]);
    return this.parent[value];
  }

  union(left: number, right: number) {
    const leftRoot = this.find(left);
    const rightRoot = this.find(right);
    if (leftRoot !== rightRoot) this.parent[rightRoot] = leftRoot;
  }

  groups(): number[][] {
    const groups = new Map<number, number[]>();
    for (let index = 0; index < this.parent.length; index += 1) {
      const root = this.find(index);
      const group = groups.get(root) ?? [];
      group.push(index);
      groups.set(root, group);
    }
    return [...groups.values()];
  }
}

function semanticRepeats(prompts: UserPrompt[], vectors: Float32Array[]): SemanticRepeat[] {
  const union = new UnionFind(prompts.length);
  for (let left = 0; left < prompts.length; left += 1) {
    let best = -1;
    let bestScore = 0;
    for (let right = left + 1; right < prompts.length; right += 1) {
      const score = cosine(vectors[left], vectors[right]);
      if (score > bestScore) {
        best = right;
        bestScore = score;
      }
    }
    if (
      best >= 0 &&
      bestScore >= 0.72 &&
      (lexicalSimilarity(prompts[left].text, prompts[best].text) >= 0.18 || bestScore >= 0.82)
    ) {
      union.union(left, best);
    }
  }

  return union
    .groups()
    .filter((group) => group.length > 1)
    .map((group, index) => {
      const ordered = group.map((item) => prompts[item]).sort((left, right) => right.date - left.date);
      const centroid = average(group.map((item) => vectors[item]));
      const representativeIndex = group
        .map((item) => ({ item, score: cosine(vectors[item], centroid) }))
        .sort((left, right) => right.score - left.score)[0].item;
      const similarity =
        group.reduce((sum, item) => sum + cosine(vectors[item], centroid), 0) / group.length;
      return {
        id: `semantic-repeat-${index}`,
        representative: prompts[representativeIndex].text,
        count: group.length,
        similarity,
        questions: ordered.slice(0, 10).map((prompt) => prompt.text),
        sources: ordered.slice(0, 12).map(sourceOf),
      };
    })
    .sort((left, right) => right.count - left.count || right.similarity - left.similarity)
    .slice(0, 80);
}

export function classifyFactHistory(history: FactCandidate[]): FactGroup["status"] {
  if (history.length < 2) return "current";
  const ordered = [...history].sort((left, right) => left.date - right.date);
  const latest = ordered.at(-1)!;
  const distinct = new Set(ordered.map((fact) => normalizedKey(fact.text))).size;
  if (latest.cue === "refutation" && distinct > 1) return "refuted";
  if (distinct > 1 && ordered.some((fact) => fact.cue === "update")) return "updated";
  return "current";
}

function groupFacts(facts: FactCandidate[], vectors: Float32Array[]): FactGroup[] {
  const union = new UnionFind(facts.length);
  for (let left = 0; left < facts.length; left += 1) {
    let best = -1;
    let bestScore = 0;
    for (let right = left + 1; right < facts.length; right += 1) {
      const score = cosine(vectors[left], vectors[right]);
      if (score > bestScore) {
        best = right;
        bestScore = score;
      }
    }
    if (
      best >= 0 &&
      (bestScore >= 0.86 || (bestScore >= 0.74 && lexicalSimilarity(facts[left].text, facts[best].text) >= 0.16))
    ) {
      union.union(left, best);
    }
  }

  return union
    .groups()
    .map((group, index) => {
      const history = group.map((item) => facts[item]).sort((left, right) => left.date - right.date);
      const latest = history.at(-1)!;
      const status = classifyFactHistory(history);
      return {
        id: `fact-${index}`,
        status,
        statement: latest.text,
        firstSeen: history[0].date,
        lastSeen: latest.date,
        history,
        sources: history.slice(-10).reverse().map(sourceOf),
      } satisfies FactGroup;
    })
    .sort((left, right) => right.lastSeen - left.lastSeen)
    .slice(0, 180);
}

function kMeans(vectors: Float32Array[], requestedClusters: number) {
  const clusterCount = Math.max(1, Math.min(requestedClusters, vectors.length));
  const centroids: Float32Array[] = [vectors[0].slice()];
  while (centroids.length < clusterCount) {
    let candidate = 0;
    let farthest = -1;
    for (let index = 0; index < vectors.length; index += 1) {
      const nearest = Math.max(...centroids.map((centroid) => cosine(vectors[index], centroid)));
      const distance = 1 - nearest;
      if (distance > farthest) {
        farthest = distance;
        candidate = index;
      }
    }
    centroids.push(vectors[candidate].slice());
  }

  const assignments = new Array(vectors.length).fill(0);
  for (let iteration = 0; iteration < 12; iteration += 1) {
    let changed = false;
    for (let index = 0; index < vectors.length; index += 1) {
      let bestCluster = 0;
      let bestScore = -Infinity;
      for (let cluster = 0; cluster < centroids.length; cluster += 1) {
        const score = cosine(vectors[index], centroids[cluster]);
        if (score > bestScore) {
          bestScore = score;
          bestCluster = cluster;
        }
      }
      if (assignments[index] !== bestCluster) changed = true;
      assignments[index] = bestCluster;
    }
    for (let cluster = 0; cluster < centroids.length; cluster += 1) {
      const members = vectors.filter((_, index) => assignments[index] === cluster);
      if (members.length) centroids[cluster] = average(members);
    }
    if (!changed && iteration > 0) break;
  }
  return { assignments, centroids };
}

function topicGraph(
  conversations: ConversationRecord[],
  vectors: Float32Array[],
  anchorVectors: Float32Array[],
): {
  topics: TopicNode[];
  edges: TopicEdge[];
  centroids: Float32Array[];
  assignments: number[];
} {
  if (conversations.length === 0) {
    return { topics: [], edges: [], centroids: [], assignments: [] };
  }
  const requested = Math.min(12, Math.max(2, Math.round(Math.sqrt(conversations.length / 2))));
  const { assignments, centroids } = kMeans(vectors, requested);
  const groups = centroids.map((_, cluster) =>
    conversations.filter((__, index) => assignments[index] === cluster),
  );
  const order = groups
    .map((group, cluster) => ({ cluster, count: group.length }))
    .sort((left, right) => right.count - left.count);

  const anchorAssignments = new Map<number, string>();
  const usedAnchors = new Set<number>();
  for (const { cluster } of order) {
    const candidates = anchorVectors
      .map((vector, anchor) => ({
        anchor,
        similarity: cosine(centroids[cluster], vector),
      }))
      .sort((left, right) => right.similarity - left.similarity);
    const selected = candidates.find((candidate) => !usedAnchors.has(candidate.anchor)) ?? candidates[0];
    if (selected) {
      usedAnchors.add(selected.anchor);
      anchorAssignments.set(cluster, TOPIC_ANCHORS[selected.anchor][0]);
    }
  }

  const position = new Map<number, { x: number; y: number }>();
  order.forEach(({ cluster }, orderIndex) => {
    if (orderIndex === 0) {
      position.set(cluster, { x: 0.5, y: 0.48 });
      return;
    }
    const outerCount = Math.max(1, order.length - 1);
    const angle = -Math.PI / 2 + ((orderIndex - 1) * Math.PI * 2) / outerCount;
    position.set(cluster, {
      x: 0.5 + Math.cos(angle) * 0.39,
      y: 0.5 + Math.sin(angle) * 0.39,
    });
  });

  const topics = groups.map((group, cluster) => {
    const titleTerms = distinctiveTitleTerms(group);
    const terms = titleTerms.length >= 2 ? titleTerms : distinctiveTerms(group);
    const fallback = group
      .map((conversation) => conversation.title)
      .find((title) => title && title !== "Untitled conversation");
    const anchor = anchorAssignments.get(cluster);
    const specific = terms.find(
      (term) => !anchor?.toLocaleLowerCase().includes(term.toLocaleLowerCase()),
    );
    const label =
      [anchor, specific ? specific.replace(/\b\w/g, (character) => character.toLocaleUpperCase()) : null]
        .filter(Boolean)
        .join(" · ") ||
      fallback?.slice(0, 34) ||
      `Topic ${cluster + 1}`;
    const point = position.get(cluster) ?? { x: 0.5, y: 0.5 };
    return {
      id: `topic-${cluster}`,
      label,
      count: group.length,
      x: point.x,
      y: point.y,
      color: COLORS[cluster % COLORS.length],
      terms,
      sources: [...group]
        .sort((left, right) => right.updatedAt - left.updatedAt)
        .slice(0, 8)
        .map(sourceOf),
    } satisfies TopicNode;
  });

  const edgeMap = new Map<string, TopicEdge>();
  for (let source = 0; source < centroids.length; source += 1) {
    const neighbors = centroids
      .map((centroid, target) => ({ target, similarity: cosine(centroids[source], centroid) }))
      .filter(({ target }) => target !== source)
      .sort((left, right) => right.similarity - left.similarity)
      .slice(0, 2);
    for (const neighbor of neighbors) {
      const [left, right] = [source, neighbor.target].sort((a, b) => a - b);
      const key = `${left}:${right}`;
      const existing = edgeMap.get(key);
      if (!existing || neighbor.similarity > existing.similarity) {
        edgeMap.set(key, {
          source: `topic-${left}`,
          target: `topic-${right}`,
          similarity: neighbor.similarity,
        });
      }
    }
  }
  return { topics, edges: [...edgeMap.values()], centroids, assignments };
}

function conversationFingerprint(conversation: ConversationRecord): string {
  const prompts = conversation.prompts;
  const selected = [prompts[0], prompts.at(-1)]
    .filter((prompt): prompt is UserPrompt => Boolean(prompt))
    .map((prompt) => prompt.text.slice(0, 700));
  return `${conversation.title}\n${selected.join("\n")}`.slice(0, 1_600);
}

export async function buildSemanticMemory(
  allConversations: ConversationRecord[],
  allPrompts: UserPrompt[],
  allFacts: FactCandidate[],
  progress: Progress,
): Promise<{ report: SemanticReport; searchIndex: SearchEntry[] }> {
  const conversations = stableSample(allConversations, CONVERSATION_CAP);
  const prompts = sampleQuestions(allPrompts);
  const facts = stableSample(allFacts, FACT_CAP);
  const texts = [
    ...conversations.map(conversationFingerprint),
    ...prompts.map((prompt) => prompt.text),
    ...facts.map((fact) => fact.text),
    ...TOPIC_ANCHORS.map(([, description]) => description),
  ];
  const vectors = await embedTexts(texts, progress);
  const conversationVectors = vectors.slice(0, conversations.length);
  const promptVectors = vectors.slice(conversations.length, conversations.length + prompts.length);
  const factVectors = vectors.slice(conversations.length + prompts.length);
  const anchorVectors = factVectors.slice(facts.length);
  const boundedFactVectors = factVectors.slice(0, facts.length);

  progress("Grouping repeated questions", 0, 3);
  const repeats = semanticRepeats(prompts, promptVectors);
  progress("Building fact history", 1, 3);
  const groupedFacts = groupFacts(facts, boundedFactVectors);
  progress("Laying out topic graph", 2, 3);
  const graph = topicGraph(conversations, conversationVectors, anchorVectors);

  const searchIndex: SearchEntry[] = [
    ...conversations.map((conversation, index) => ({
      id: `conversation:${conversation.conversationId}`,
      type: "conversation" as const,
      title: conversation.title,
      detail: `${conversation.messageCount} messages`,
      source: sourceOf(conversation),
      topicId: `topic-${graph.assignments[index]}`,
      embedding: conversationVectors[index],
    })),
    ...prompts.map((prompt, index) => ({
      id: `question:${prompt.id}`,
      type: "question" as const,
      title: prompt.text,
      detail: prompt.title,
      source: sourceOf(prompt),
      topicId: null,
      embedding: promptVectors[index],
    })),
    ...facts.map((fact, index) => ({
      id: `fact:${fact.id}`,
      type: "fact" as const,
      title: fact.text,
      detail: fact.cue === "statement" ? "Detected statement" : `Detected ${fact.cue}`,
      source: sourceOf(fact),
      topicId: null,
      embedding: factVectors[index],
    })),
    ...graph.topics.map((topic, index) => ({
      id: `topic:${topic.id}`,
      type: "topic" as const,
      title: topic.label,
      detail: `${topic.count} conversations · ${topic.terms.join(", ")}`,
      source: topic.sources[0] ?? null,
      topicId: topic.id,
      embedding: graph.centroids[index],
    })),
  ];

  progress("Semantic memory ready", 3, 3);
  return {
    report: {
      model: {
        id: MODEL_ID,
        revision: MODEL_REVISION,
        embeddedConversations: conversations.length,
        totalConversations: allConversations.length,
        embeddedQuestions: prompts.length,
        totalQuestions: allPrompts.length,
        embeddedFacts: facts.length,
        totalFacts: allFacts.length,
      },
      repeats,
      facts: groupedFacts,
      topics: graph.topics,
      edges: graph.edges,
    },
    searchIndex,
  };
}

export async function searchMemory(
  query: string,
  index: SearchEntry[],
  lexicalIndex: LexicalSearchEntry[],
  progress: Progress,
): Promise<Array<Omit<SearchEntry, "embedding"> & { similarity: number }>> {
  const [queryVector] = await embedTexts([query], progress);
  const semanticResults = index
    .map(({ embedding, ...entry }) => ({ ...entry, semanticScore: cosine(queryVector, embedding) }))
    .filter((entry) => entry.semanticScore > 0.18)
    .sort((left, right) => right.semanticScore - left.semanticScore)
    .slice(0, 64);
  const queryTerms = new Set(
    normalizedKey(query)
      .split(" ")
      .filter((term) => term.length > 2),
  );
  const lexicalResults = lexicalIndex
    .map((entry) => {
      const haystack = normalizedKey(`${entry.title} ${entry.detail}`);
      const terms = new Set(haystack.split(" "));
      const overlap = [...queryTerms].filter((term) => terms.has(term)).length;
      const phraseBonus = haystack.includes(normalizedKey(query)) ? 0.3 : 0;
      return {
        ...entry,
        lexicalScore: Math.min(
          0.99,
          (overlap / Math.max(1, queryTerms.size)) * 0.68 + phraseBonus,
        ),
      };
    })
    .filter((entry) => entry.lexicalScore > 0)
    .sort((left, right) => right.lexicalScore - left.lexicalScore)
    .slice(0, 64);

  const candidates = new Map<
    string,
    Omit<SearchEntry, "embedding"> & {
      semanticScore: number;
      lexicalScore: number;
    }
  >();
  for (const { semanticScore, ...result } of semanticResults) {
    candidates.set(result.id, { ...result, semanticScore, lexicalScore: 0 });
  }
  for (const { lexicalScore, ...result } of lexicalResults) {
    const existing = candidates.get(result.id);
    candidates.set(result.id, {
      ...result,
      semanticScore: existing?.semanticScore ?? 0,
      lexicalScore,
    });
  }

  return [...candidates.values()]
    .map(({ semanticScore, lexicalScore, ...entry }) => {
      const combined =
        semanticScore > 0 && lexicalScore > 0
          ? semanticScore * 0.65 + lexicalScore * 0.55
          : semanticScore > 0
            ? semanticScore * 0.82
            : lexicalScore * 0.9;
      return { ...entry, similarity: Math.min(0.99, combined) };
    })
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, 16);
}

export function buildLexicalIndex(
  conversations: ConversationRecord[],
  prompts: UserPrompt[],
  facts: FactCandidate[],
): LexicalSearchEntry[] {
  return [
    ...conversations.map((conversation) => ({
      id: `conversation:${conversation.conversationId}`,
      type: "conversation" as const,
      title: conversation.title,
      detail: `${conversation.messageCount} messages`,
      source: sourceOf(conversation),
      topicId: null,
    })),
    ...prompts.map((prompt) => ({
      id: `question:${prompt.id}`,
      type: "question" as const,
      title: prompt.text,
      detail: prompt.title,
      source: sourceOf(prompt),
      topicId: null,
    })),
    ...facts.map((fact) => ({
      id: `fact:${fact.id}`,
      type: "fact" as const,
      title: fact.text,
      detail: fact.cue === "statement" ? "Detected statement" : `Detected ${fact.cue}`,
      source: sourceOf(fact),
      topicId: null,
    })),
  ];
}
