/**
 * Experiment Evaluation Suite
 * Validates hypothesis generation and experiment design
 */

import { HypothesisGenerator } from "../../src/experiment/hypothesis-generator.js";
import { SampleSizeCalculator } from "../../src/experiment/sample-size-calculator.js";
import type { Channel } from "../../src/types/types.js";

const generator = new HypothesisGenerator();
const calculator = new SampleSizeCalculator();

export const experimentEval = {
  name: "experiment-design",
  
  run(): { passed: boolean; message: string }[] {
    const results: { passed: boolean; message: string }[] = [];
    
    // Test hypothesis generation
    const hypotheses = generator.generate({
      businessContext: "SaaS product with freemium model",
      topChannels: ["organic_search", "paid_search", "email"] as Channel[],
    });
    
    results.push({
      passed: hypotheses.length > 0,
      message: `Generated ${hypotheses.length} hypotheses (expected > 0)`,
    });
    
    results.push({
      passed: hypotheses.every(h => h.confidence >= 0 && h.confidence <= 1),
      message: `All hypotheses have valid confidence (0-1)`,
    });

    results.push({
      passed: hypotheses.every(h => h.expectedLift > 0),
      message: `All hypotheses have positive expected lift`,
    });

    // Test sample size calculation
    const sampleSize = calculator.calculate({
      controlConversionRate: 0.05,
      treatmentConversionRate: 0.075,
    });
    
    results.push({
      passed: sampleSize.requiredSampleSizePerVariant > 0,
      message: `Sample size calculated: ${sampleSize.requiredSampleSizePerVariant}`,
    });

    results.push({
      passed: sampleSize.detectableEffectSize > 0,
      message: `Detectable effect size: ${(sampleSize.detectableEffectSize * 100).toFixed(1)}%`,
    });

    // Test significance detection
    const significance = calculator.isSignificant({
      controlConversions: 50,
      controlSample: 1000,
      treatmentConversions: 75,
      treatmentSample: 1000,
    });
    
    results.push({
      passed: significance.pValue < 0.05,
      message: `Detected significance (p=${significance.pValue.toFixed(4)})`,
    });

    return results;
  },
};
