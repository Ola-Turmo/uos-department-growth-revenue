import { describe, it, expect } from "vitest";
import { CausalImpactAnalyzer } from "../../src/attribution/causal-impact.js";

describe("CausalImpactAnalyzer", () => {
  it("analyzes positive causal impact", () => {
    const analyzer = new CausalImpactAnalyzer();
    const result = analyzer.analyze({
      channel: "email",
      prePeriod: [{ period: "2024-01", revenue: 100 }, { period: "2024-02", revenue: 102 }, { period: "2024-03", revenue: 99 }, { period: "2024-04", revenue: 101 }],
      postPeriod: [{ period: "2024-05", revenue: 180 }, { period: "2024-06", revenue: 190 }],
    });
    expect(result.channel).toBe("email");
    expect(result.causalEffect).toBeDefined();
    expect(result.relativeEffect).toBeDefined();
    expect(result.probabilityOfCausality).toBeGreaterThanOrEqual(0);
  });

  it("returns insufficient data for short series", () => {
    const analyzer = new CausalImpactAnalyzer();
    const result = analyzer.analyze({ channel: "youtube", prePeriod: [{ period: "2024-01", revenue: 100 }], postPeriod: [{ period: "2024-02", revenue: 110 }] });
    expect(result.interpretation).toContain("Insufficient");
    expect(result.probabilityOfCausality).toBe(0);
  });

  it("calculates weekly effects", () => {
    const analyzer = new CausalImpactAnalyzer();
    const result = analyzer.analyze({
      channel: "search",
      prePeriod: Array.from({ length: 10 }, (_, i) => ({ period: `2024-0${i+1}`, revenue: 100 })),
      postPeriod: [{ period: "2024-11", revenue: 150 }, { period: "2024-12", revenue: 160 }],
    });
    expect(result.weeklyEffects.length).toBeGreaterThan(0);
  });
});
