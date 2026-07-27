import { describe, expect, it } from "vitest";
import { classifyFactHistory, cosine } from "./semantic";
import type { FactCandidate } from "./types";

describe("cosine", () => {
  it("compares normalized embedding vectors", () => {
    expect(cosine(new Float32Array([1, 0]), new Float32Array([1, 0]))).toBe(1);
    expect(cosine(new Float32Array([1, 0]), new Float32Array([0, 1]))).toBe(0);
  });
});

describe("fact history classification", () => {
  const fact = (
    id: string,
    text: string,
    cue: FactCandidate["cue"],
    date: number,
  ): FactCandidate => ({
    id,
    text,
    cue,
    date,
    conversationId: id,
    title: id,
  });

  it("requires linked history before calling a statement updated or refuted", () => {
    expect(classifyFactHistory([fact("one", "I don't have an answer.", "refutation", 1)])).toBe(
      "current",
    );
    expect(
      classifyFactHistory([
        fact("one", "I use paper notes.", "statement", 1),
        fact("two", "I no longer use paper notes.", "refutation", 2),
      ]),
    ).toBe("refuted");
    expect(
      classifyFactHistory([
        fact("one", "I work remotely.", "statement", 1),
        fact("two", "Actually, I work from an office now.", "update", 2),
      ]),
    ).toBe("updated");
  });
});
