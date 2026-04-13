/**
 * Funnel Evaluation Suite
 * Validates funnel analysis and conversion calculations
 */

import { FunnelVizEngine } from "../../src/dashboard/funnel-viz.js";
import type { FunnelAnalysis } from "../../src/types/types.js";

const funnelEngine = new FunnelVizEngine();

export const funnelEval = {
  name: "funnel-intelligence",
  
  run(): { passed: boolean; message: string }[] {
    const results: { passed: boolean; message: string }[] = [];
    
    // Test funnel analysis
    const funnel: FunnelAnalysis = {
      funnelId: "test-funnel",
      stages: [
        { name: "Awareness", usersEntering: 1000, usersExiting: 400, conversionRate: 0.6, dropOffRate: 0.4 },
        { name: "Interest", usersEntering: 600, usersExiting: 300, conversionRate: 0.5, dropOffRate: 0.5 },
        { name: "Consideration", usersEntering: 300, usersExiting: 150, conversionRate: 0.5, dropOffRate: 0.5 },
        { name: "Intent", usersEntering: 150, usersExiting: 75, conversionRate: 0.5, dropOffRate: 0.5 },
        { name: "Purchase", usersEntering: 75, usersExiting: 0, conversionRate: 1.0, dropOffRate: 0 },
      ],
      overallConversionRate: 0.075,
      revenueAtEachStage: [0, 0, 0, 0, 75000],
      periodStart: "2024-01-01",
      periodEnd: "2024-01-31",
      totalUsers: 1000,
      convertedUsers: 75,
    };
    
    const analysis = funnelEngine.analyze(funnel);
    
    results.push({
      passed: analysis.length > 0,
      message: `Generated ${analysis.length} insights`,
    });
    
    results.push({
      passed: analysis.some(i => i.type === "bottleneck"),
      message: `Identified bottleneck: ${analysis.filter(i => i.type === "bottleneck").length}`,
    });

    results.push({
      passed: analysis.every(i => i.confidence >= 0 && i.confidence <= 1),
      message: `All insights have valid confidence scores`,
    });

    // Test conversion rate calculation
    const conversionRates = funnel.stages.map(s => s.conversionRate);
    const avgConversion = conversionRates.reduce((a, b) => a * b, 1) ** (1 / conversionRates.length);
    
    results.push({
      passed: Math.abs(funnel.overallConversionRate - avgConversion) < 0.01,
      message: `Overall conversion rate: ${(funnel.overallConversionRate * 100).toFixed(1)}%`,
    });

    return results;
  },
};
