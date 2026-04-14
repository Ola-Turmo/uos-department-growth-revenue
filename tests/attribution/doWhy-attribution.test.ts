import { describe, it, expect, vi } from "vitest";
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

  it("falls back to correlation when Python subprocess fails", async () => {
    // Mock spawn to simulate Python being unavailable
    vi.mock("child_process", () => ({
      spawn: vi.fn(() => ({
        stdout: { on: (event: string, cb: (d: { toString: () => string }) => void) => { if (event === "data") cb({ toString: () => "" }); } },
        stderr: { on: (event: string, cb: (d: { toString: () => string }) => void) => { if (event === "data") cb({ toString: () => "module not found" }); } },
        on: (event: string, cb: (code: number) => void) => { if (event === "close") cb(127); },
        kill: vi.fn(),
      })),
    }));

    // Re-import after mocking
    const { DoWhyAttributionAnalyzer: MockedAnalyzer } = await import("../../src/attribution/doWhy-attribution.js");
    const analyzer = new MockedAnalyzer();
    const data = [{ period: "2024-01", x: 10, y: 20, z: 30 }];
    const result = await analyzer.analyze({ channelData: data as any, channels: ["x", "y"], outcomeVar: "z" });
    expect(result.method).toBe("correlation_fallback");
    expect(result.channelEffects).toBeDefined();

    vi.restoreAllMocks();
  });
});
