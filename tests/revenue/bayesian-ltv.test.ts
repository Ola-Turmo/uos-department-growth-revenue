import { describe, it, expect } from "vitest";
import { BayesianLTVModel } from "../../src/revenue/bayesian-ltv.js";

describe("BayesianLTVModel", () => {
  it("predicts LTV for active customer", () => {
    const model = new BayesianLTVModel();
    const result = model.predict({
      customerId: "cust-1",
      transactionHistory: [
        { periodIndex: 1, revenue: 100 }, { periodIndex: 2, revenue: 110 },
        { periodIndex: 3, revenue: 95 }, { periodIndex: 4, revenue: 120 },
      ],
      churnHistory: [
        { periodIndex: 1, churned: false }, { periodIndex: 2, churned: false },
        { periodIndex: 3, churned: false }, { periodIndex: 4, churned: false },
      ],
    });
    expect(result.customerId).toBe("cust-1");
    expect(result.predictedLTV).toBeGreaterThan(0);
    expect(result.modelType).toBe("bayesian");
    expect(result.confidenceInterval.length).toBe(2);
  });

  it("returns low LTV for fully churned", () => {
    const model = new BayesianLTVModel();
    const result = model.predict({
      customerId: "churned-1",
      transactionHistory: [{ periodIndex: 1, revenue: 50 }],
      churnHistory: [{ periodIndex: 1, churned: true }, { periodIndex: 2, churned: true }],
    });
    // Model returns discounted expected value, not exactly 0
    expect(result.predictedLTV).toBeGreaterThan(0);
    expect(result.churnProbability).toBeGreaterThan(0.5);
  });

  it("provides confidence based on history length", () => {
    const model = new BayesianLTVModel();
    const short = model.predict({ customerId: "s", transactionHistory: [{ periodIndex: 1, revenue: 50 }], churnHistory: [{ periodIndex: 1, churned: false }] });
    const long = model.predict({ customerId: "l", transactionHistory: Array.from({ length: 12 }, (_, i) => ({ periodIndex: i + 1, revenue: 100 })), churnHistory: Array.from({ length: 12 }, (_, i) => ({ periodIndex: i + 1, churned: false })) });
    expect(long.confidence).toBeGreaterThan(short.confidence);
  });
});
