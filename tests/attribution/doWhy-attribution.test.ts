import { describe, it, expect } from "vitest";
import { DoWhyAttributionAnalyzer } from "../../src/attribution/doWhy-attribution.js";

describe("DoWhyAttributionAnalyzer", () => {
  it("analyzes channel attribution", async () => {
    const analyzer = new DoWhyAttributionAnalyzer();
    const data = [
      { period: "2024-01", email: 1000, youtube: 2000, revenue: 50000 },
      { period: "2024-02", email: 1200, youtube: 2100, revenue: 55000 },
      { period: "2024-03", email: 1100, youtube: 2200, revenue: 52000 },
    ];
    const result = await analyzer.analyze({ channelData: data, channels: ["email", "youtube"], outcomeVar: "revenue" });
    expect(result.narrative).toBeDefined();
    expect(result.topChannel).toBeDefined();
  });

  it("falls back on Python unavailable", async () => {
    const analyzer = new DoWhyAttributionAnalyzer();
    const data = [{ period: "2024-01", x: 10, y: 20, z: 30 }];
    const result = await analyzer.analyze({ channelData: data as any, channels: ["x", "y"], outcomeVar: "z" });
    expect(result.method).toBe("correlation_fallback");
    expect(result.channelEffects).toBeDefined();
  });
});
