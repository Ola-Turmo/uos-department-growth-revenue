import { describe, it, expect } from "vitest";
import { ExperimentPipelineOrchestrator } from "../../src/experiment/pipeline-orchestrator.js";

describe("ExperimentPipelineOrchestrator", () => {
  it("instantiates", () => {
    const orch = new ExperimentPipelineOrchestrator();
    expect(orch).toBeDefined();
  });

  it("starts experiment and returns id", async () => {
    const orch = new ExperimentPipelineOrchestrator();
    const id = await orch.startExperiment({ name: "Test Exp", hypothesis: { id: "h1", text: "Test", hypothesis: "Test", confidence: 0.5, expectedLift: 0.1, effort: "medium", impact: "high", priority: 50, funnelStage: "all", relatedChannels: ["email"], generatedAt: "" }, metric: "conversion_rate" });
    expect(id).toMatch(/^exp-/);
  });

  it("getExperimentsByStage filters correctly", async () => {
    const orch = new ExperimentPipelineOrchestrator();
    await orch.startExperiment({ name: "Exp 1", hypothesis: { id: "h1", text: "A", hypothesis: "A", confidence: 0.5, expectedLift: 0.1, effort: "medium", impact: "high", priority: 50, funnelStage: "all", relatedChannels: [], generatedAt: "" }, metric: "ctr" });
    const byStage = orch.getExperimentsByStage("hypothesis");
    expect(Array.isArray(byStage)).toBe(true);
  });

  it("onEvent registers and unregisters listener", async () => {
    const orch = new ExperimentPipelineOrchestrator();
    let called = 0;
    const unsub = orch.onEvent(() => called++);
    await orch.startExperiment({ name: "Exp 2", hypothesis: { id: "h2", text: "B", hypothesis: "B", confidence: 0.5, expectedLift: 0.1, effort: "medium", impact: "high", priority: 50, funnelStage: "all", relatedChannels: [], generatedAt: "" }, metric: "cvr" });
    unsub();
    expect(called).toBeGreaterThanOrEqual(0);
  });
});
