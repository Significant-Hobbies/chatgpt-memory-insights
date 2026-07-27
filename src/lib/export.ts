import type { ConversationRecord, UserPrompt } from "./types";

type RawMessage = {
  id?: string;
  author?: { role?: string };
  create_time?: number | null;
  content?: { content_type?: string; parts?: unknown[] };
  metadata?: { model_slug?: string };
};

type RawNode = {
  id?: string;
  parent?: string | null;
  message?: RawMessage | null;
};

export type RawConversation = {
  id?: string;
  conversation_id?: string;
  title?: string;
  create_time?: number;
  update_time?: number;
  current_node?: string;
  default_model_slug?: string;
  mapping?: Record<string, RawNode>;
};

function textFromPart(part: unknown): string {
  if (typeof part === "string") return part;
  if (!part || typeof part !== "object") return "";
  if ("text" in part && typeof part.text === "string") return part.text;
  return "";
}

function messageText(message: RawMessage): string {
  const parts = message.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts.map(textFromPart).filter(Boolean).join("\n").trim();
}

function activeNodes(conversation: RawConversation): RawNode[] {
  const mapping = conversation.mapping ?? {};
  const path: RawNode[] = [];
  const seen = new Set<string>();
  let nodeId = conversation.current_node;

  while (nodeId && mapping[nodeId] && !seen.has(nodeId)) {
    seen.add(nodeId);
    const node = mapping[nodeId];
    path.push(node);
    nodeId = node.parent ?? undefined;
  }

  if (path.length > 0) return path.reverse();

  return Object.values(mapping).sort(
    (left, right) =>
      (left.message?.create_time ?? Number.MAX_SAFE_INTEGER) -
      (right.message?.create_time ?? Number.MAX_SAFE_INTEGER),
  );
}

function countWords(text: string): number {
  return text.match(/\p{L}[\p{L}\p{N}'’-]*/gu)?.length ?? 0;
}

export function normalizeConversation(raw: RawConversation): ConversationRecord | null {
  const conversationId = raw.id ?? raw.conversation_id;
  if (!conversationId) return null;

  const nodes = activeNodes(raw);
  const prompts: UserPrompt[] = [];
  let userMessageCount = 0;
  let assistantMessageCount = 0;
  let messageCount = 0;
  let wordCount = 0;
  let detectedModel = raw.default_model_slug ?? "unknown";

  for (const node of nodes) {
    const message = node.message;
    if (!message) continue;
    const role = message.author?.role;
    if (role !== "user" && role !== "assistant") continue;
    const text = messageText(message);
    if (!text) continue;

    messageCount += 1;
    wordCount += countWords(text);
    if (message.metadata?.model_slug) detectedModel = message.metadata.model_slug;

    if (role === "user") {
      userMessageCount += 1;
      prompts.push({
        id: message.id ?? `${conversationId}:user:${userMessageCount}`,
        conversationId,
        title: raw.title?.trim() || "Untitled conversation",
        date: message.create_time ?? raw.create_time ?? 0,
        text: text.slice(0, 2_400),
      });
    } else {
      assistantMessageCount += 1;
    }
  }

  if (messageCount === 0) return null;

  return {
    conversationId,
    title: raw.title?.trim() || "Untitled conversation",
    date: raw.create_time ?? prompts[0]?.date ?? 0,
    updatedAt: raw.update_time ?? prompts.at(-1)?.date ?? raw.create_time ?? 0,
    model: detectedModel,
    messageCount,
    userMessageCount,
    assistantMessageCount,
    wordCount,
    prompts,
  };
}

export function normalizeConversationChunk(value: unknown): ConversationRecord[] {
  if (!Array.isArray(value)) {
    throw new Error("Conversation JSON must contain an array.");
  }

  const normalized: ConversationRecord[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const conversation = normalizeConversation(item as RawConversation);
    if (conversation) normalized.push(conversation);
  }
  return normalized;
}
