/**
 * Revenue Evaluation Suite
 * Validates LTV modeling, lead scoring, and forecasting
 */

import { LTVModeler } from "../../src/revenue/ltv-model.js";
import { LeadScorer } from "../../src/revenue/lead-score.js";
import { smaModel, expSmoothModel } from "../../src/ml/models.js";

const ltvModeler = new LTVModeler();
const leadScorer = new LeadScorer();

export const revenueEval = {
  name: "revenue-intelligence",
  
  run(): { passed: boolean; message: string }[] {
    const results: { passed: boolean; message: string }[] = [];
    
    // Test LTV prediction
    const ltv = ltvModeler.predictLTV({
      customerId: "c1",
      revenueHistory: [100, 150, 200, 180, 220],
    });
    
    results.push({
      passed: ltv.predictedLTV > 0,
      message: `LTV predicted: $${ltv.predictedLTV.toFixed(2)}`,
    });
    
    results.push({
      passed: ltv.confidence >= 0 && ltv.confidence <= 1,
      message: `LTV confidence: ${(ltv.confidence * 100).toFixed(0)}%`,
    });

    // Test LTV segmentation
    const customers = [
      { customerId: "c1", predictedLTV: 5000 },
      { customerId: "c2", predictedLTV: 2500 },
      { customerId: "c3", predictedLTV: 1000 },
      { customerId: "c4", predictedLTV: 500 },
    ];
    const segments = ltvModeler.segmentByLTV(customers);
    
    results.push({
      passed: segments.tierS.length === 1 && segments.tierA.length === 1,
      message: `LTV segments: S=${segments.tierS.length}, A=${segments.tierA.length}`,
    });

    // Test lead scoring
    const leads = leadScorer.scoreLeads([
      {
        leadId: "l1",
        companySize: "enterprise",
        industry: "tech",
        signals: {
          hasDemo: true,
          hasTrial: true,
          pricingPageVisits: 5,
          pageViews: 20,
          contentDownloads: 5,
          emailOpenRate: 0.8,
          webinarAttendances: 2,
          daysSinceLastActive: 2,
        },
      },
    ]);
    
    results.push({
      passed: leads[0].grade === "hot",
      message: `Lead graded as: ${leads[0].grade}`,
    });
    
    results.push({
      passed: leads[0].score >= 50,
      message: `Lead score: ${leads[0].score}`,
    });

    // Test revenue forecasting
    const historicalData = [100, 120, 115, 140, 150, 160];
    const smaForecast = smaModel.forecast(historicalData, 3);
    
    results.push({
      passed: smaForecast.length === 3,
      message: `SMA forecast periods: ${smaForecast.length}`,
    });
    
    results.push({
      passed: smaForecast.every(f => f.predictedRevenue > 0),
      message: `All forecast values positive`,
    });

    const expForecast = expSmoothModel.forecast(historicalData, 3);
    
    results.push({
      passed: expForecast.length === 3,
      message: `Exp smoothing forecast periods: ${expForecast.length}`,
    });

    return results;
  },
};
