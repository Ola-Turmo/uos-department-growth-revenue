import { describe, it, expect } from "vitest";
import { LLMHypothesisGenerator } from "../../src/experiment/llm-hypothesis-generator.js";

describe("LLMHypothesisGenerator", () => {
  it("generates hypotheses from funnel gaps", async () => {
    const gen = new LLMHypothesisGenerator();
    const result = await gen.generate({
      funnelGaps: [{ stageName: "trial_to_paid", currentConversionRate: 0.05, industryBenchmark: 0.15, gapPercent: 0.10 }],
      channelData: [{ channel: "email", currentROI: 2.5, saturation: "undersaturated" as const }],
      topChannels: ["email", "organic_search"],
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].text).toBeDefined();
    expect(result[0].priority).toBeGreaterThan(0);
    expect(result[0].funnelStage).toBe("trial_to_paid");
  });

  it("falls back to template on LLM failure", async () => {
    const gen = new LLMHypothesisGenerator();
    // templateFallback requires funnelGaps with gapPercent > 0.05 to generate hypotheses
    const result = await gen.generate({
      funnelGaps: [{ stageName: "signup_to_activation", currentConversionRate: 0.1, industryBenchmark: 0.3, gapPercent: 0.2 }],
      channelData: [],
      topChannels: [],
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].id).toContain("hyp-tpl-");
  });
});
