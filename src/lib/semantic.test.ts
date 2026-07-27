import { describe, expect, it } from "vitest";
import { classifyFactHistory, cosine, MODEL_PROFILES } from "./semantic";
import type { FactCandidate } from "./types";

describe("cosine", () => {
  it("compares normalized embedding vectors", () => {
    expect(cosine(new Float32Array([1, 0]), new Float32Array([1, 0]))).toBe(1);
    expect(cosine(new Float32Array([1, 0]), new Float32Array([0, 1]))).toBe(0);
  });
});

describe("browser model profiles", () => {
  it("pins both compact and multilingual model revisions", () => {
    expect(MODEL_PROFILES.compact).toEqual({
      id: "Xenova/all-MiniLM-L6-v2",
      revision: "751bff37182d3f1213fa05d7196b954e230abad9",
      approximateDownloadMb: 24,
    });
    expect(MODEL_PROFILES.multilingual).toEqual({
      id: "Xenova/paraphrase-multilingual-MiniLM-L12-v2",
      revision: "2c4055b12046f11709e9df2c122e59ffbdc2f900",
      approximateDownloadMb: 135,
    });
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
