/**
 * Integration Evaluation Suite
 * Validates cross-module integration and data flow
 */

import { AttributionEngine } from "../../src/attribution/models.js";
import { ExperimentDesigner } from "../../src/experiment/experiment-designer.js";
import { LLMGateway } from "../../src/llm/llm-gateway.js";
import type { Channel } from "../../src/types/types.js";

const engine = new AttributionEngine();
const designer = new ExperimentDesigner();
const llmGateway = new LLMGateway();

export const integrationEval = {
  name: "integration-full-workflow",
  
  run(): { passed: boolean; message: string }[] {
    const results: { passed: boolean; message: string }[] = [];
    
    // Test: Attribution → Experiment Designer workflow
    const touchpoints = [
      { userId: "u1", channel: "organic_search" as Channel, timestamp: "2024-01-01T10:00:00Z", sessionId: "s1", event: "engagement" as const, value: 1 },
      { userId: "u1", channel: "paid_search" as Channel, timestamp: "2024-01-01T11:00:00Z", sessionId: "s2", event: "engagement" as const, value: 1 },
      { userId: "u1", channel: "email" as Channel, timestamp: "2024-01-01T12:00:00Z", sessionId: "s3", event: "conversion" as const, value: 100 },
    ];
    
    const attribution = engine.computeAttribution({
      touchpoints: touchpoints as any,
      conversions: [{ userId: "u1", revenue: 100, conversionDate: "2024-01-01T12:00:00Z" }],
      config: { model: "linear", lookbackWindowDays: 30 },
    });
    
    results.push({
      passed: attribution.length > 0,
      message: `Attribution computed for ${attribution.length} conversion(s)`,
    });
    
    // Test: LLM Gateway → Experiment Designer workflow
    const topChannels = Object.entries(attribution[0].channelAttribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([ch]) => ch as Channel);
    
    results.push({
      passed: topChannels.length > 0,
      message: `Top channels identified: ${topChannels.join(", ")}`,
    });
    
    // Test: LLM Gateway hypothesis generation
    const hypotheses = llmGateway.generateHypothesis({
      topChannels,
      funnelStage: "Conversion",
      historicalData: "Organic search has historically underperformed",
    });
    
    results.push({
      passed: hypotheses.length > 0,
      message: `LLM generated ${hypotheses.length} hypotheses`,
    });
    
    // Test: Experiment designer with attribution data
    const experiment = designer.createExperiment({
      name: "Attribution-Driven Test",
      hypothesis: hypotheses[0] || undefined,
      metric: "conversion_rate",
      variants: ["control", "treatment_a"],
    });
    
    results.push({
      passed: experiment.id.length > 0,
      message: `Experiment created: ${experiment.id}`,
    });

    return results;
  },
};
