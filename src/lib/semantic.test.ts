import { describe, expect, it } from "vitest";
import {
  classifyFactHistory,
  cosine,
  INFERENCE_BATCH_SIZE,
  isMemoryPressure,
  MODEL_PROFILES,
  preferredRuntime,
  prepareEmbeddingWork,
  supportsWebGpu,
} from "./semantic";
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

  it("prefers bounded GPU batches and keeps a portable fallback", () => {
    expect(supportsWebGpu({ navigator: { gpu: {} } })).toBe(true);
    expect(supportsWebGpu({ navigator: {} })).toBe(false);
    expect(preferredRuntime(true)).toEqual({
      device: "webgpu",
      dtype: "fp32",
      batchSize: INFERENCE_BATCH_SIZE.webgpu,
    });
    expect(preferredRuntime(false)).toEqual({
      device: "wasm",
      dtype: "q8",
      batchSize: INFERENCE_BATCH_SIZE.wasm,
    });
    expect(preferredRuntime(true, "multilingual")).toEqual({
      device: "wasm",
      dtype: "q8",
      batchSize: INFERENCE_BATCH_SIZE.wasm,
    });
  });

  it("recognizes allocation failures without masking unrelated errors", () => {
    expect(isMemoryPressure(new Error("out of memory allocating tensor"))).toBe(true);
    expect(isMemoryPressure(new Error("network request failed"))).toBe(false);
  });

  it("deduplicates exact texts, sorts work by length, and retains original indexes", () => {
    expect(prepareEmbeddingWork(["longer text", "a", "longer text", "mid"])).toEqual([
      { text: "a", indexes: [1] },
      { text: "mid", indexes: [3] },
      { text: "longer text", indexes: [0, 2] },
    ]);
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
