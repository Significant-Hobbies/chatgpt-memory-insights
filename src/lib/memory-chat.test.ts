import { describe, expect, it } from "vitest";
import {
  buildMemoryChatEvidence,
  buildMemoryChatMessages,
  buildMemoryChatPrompt,
  buildGroundedFallback,
  extractGeneratedAnswer,
  MEMORY_CHAT_MODEL,
  planMemoryChatResults,
  validateGroundedAnswer,
} from "./memory-chat";
import type { FullReport, SearchResult } from "./types";

function result(index: number): SearchResult {
  return {
    id: `question:${index}`,
    type: "question",
    title: `Question ${index}`,
    detail: `Conversation ${index}`,
    context: `Evidence excerpt ${index}`,
    source: {
      conversationId: `conversation-${index}`,
      title: `Conversation ${index}`,
      date: index,
    },
    topicId: `topic-${index % 2}`,
    similarity: 0.9 - index * 0.01,
  };
}

describe("memory chat context", () => {
  it("bounds and labels the retrieval pack without changing result order", () => {
    const evidence = buildMemoryChatEvidence(
      Array.from({ length: 9 }, (_, index) => result(index))
    );
    expect(evidence).toHaveLength(MEMORY_CHAT_MODEL.maxEvidence);
    expect(evidence.map((item) => item.reference)).toEqual(["S1", "S2", "S3", "S4", "S5", "S6"]);
    expect(evidence[0]).toMatchObject({
      id: "question:0",
      excerpt: "Evidence excerpt 0",
      topicId: "topic-0",
    });
  });

  it("keeps only recent chat turns and includes labelled evidence", () => {
    const evidence = buildMemoryChatEvidence([result(0)]);
    const history = Array.from({ length: 8 }, (_, index) => ({
      role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `turn ${index}`,
    }));
    const messages = buildMemoryChatMessages("What changed?", evidence, history);
    expect(messages).toHaveLength(MEMORY_CHAT_MODEL.maxHistoryTurns + 2);
    expect(messages.at(-1)?.content).toContain("[S1]");
    expect(messages.at(-1)?.content).toContain("What changed?");
    expect(messages[1].content).toBe("turn 4");
    expect(buildMemoryChatPrompt(messages)).toContain("Answer with evidence citations:");
  });

  it("extracts string and message-style generation results", () => {
    expect(extractGeneratedAnswer([{ generated_text: "  Grounded answer [S1]. " }])).toBe(
      "Grounded answer [S1]."
    );
    expect(
      extractGeneratedAnswer([
        {
          generated_text: [
            { role: "user", content: "Question" },
            { role: "assistant", content: "Answer [S2]." },
          ],
        },
      ])
    ).toBe("Answer [S2].");
  });

  it("prioritizes structured changed-memory evidence for change questions", () => {
    const report = {
      semantic: {
        facts: [
          {
            id: "changed",
            status: "updated",
            statement: "I work from an office now.",
            firstSeen: 1,
            lastSeen: 2,
            confidence: 0.91,
            similarity: 0.9,
            lexicalSimilarity: 0.5,
            reason: "A later statement uses explicit update wording.",
            history: [
              {
                id: "old",
                text: "I work remotely.",
                cue: "statement",
                conversationId: "conversation-1",
                title: "Work",
                date: 1,
              },
              {
                id: "new",
                text: "I work from an office now.",
                cue: "update",
                conversationId: "conversation-1",
                title: "Work",
                date: 2,
              },
            ],
            sources: [{ conversationId: "conversation-1", title: "Work", date: 2 }],
          },
        ],
        repeats: [],
      },
    } as unknown as FullReport;
    const planned = planMemoryChatResults("What changed my mind?", [result(0)], report);
    expect(planned).toHaveLength(1);
    expect(planned[0]).toMatchObject({
      id: "memory-change:changed",
      detail: "updated memory · 2 linked statements",
    });
    expect(planned[0].context).toContain("I work remotely.");
  });

  it("rejects uncited drafts and retains an evidence-only fallback", () => {
    const evidence = buildMemoryChatEvidence([result(0)]);
    expect(validateGroundedAnswer("An unsupported draft.", evidence)).toMatchObject({
      valid: false,
    });
    expect(validateGroundedAnswer("A supported answer [S1].", evidence)).toMatchObject({
      valid: true,
      citations: ["S1"],
    });
    expect(buildGroundedFallback(evidence)).toContain("[S1]");
  });
});
