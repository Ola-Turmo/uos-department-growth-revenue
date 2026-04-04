/**
 * Funnel & Attribution Service Tests
 * VAL-DEPT-GR-002: Funnel and attribution diagnostics support segment-aware lifecycle action
 */

import { describe, expect, it, beforeEach } from "vitest";
import { FunnelAttributionService } from "../src/funnel-attribution-service.js";
import type {
  CreateFunnelDiagnosticParams,
  CreateAttributionDiagnosticParams,
  TriggerLifecycleActionParams,
  ProposeRevenueActionParams,
  FunnelStage,
} from "../src/types.js";

describe("FunnelAttributionService", () => {
  let service: FunnelAttributionService;

  beforeEach(() => {
    service = new FunnelAttributionService();
  });

  describe("createFunnelDiagnostic", () => {
    it("creates a funnel diagnostic with stage analysis", () => {
      const params: CreateFunnelDiagnosticParams = {
        diagnosticKey: "funnel-q1-2024",
        funnelName: "Lead to Close",
        funnelDescription: "Full B2B lead to close funnel",
        analyzedStages: ["awareness", "interest", "consideration", "intent", "purchase"],
        stages: [
          {
            stage: "awareness",
            enteringCount: 10000,
            exitingCount: 10000,
            conversionRate: 0.6,
            dropoffRate: 0.4,
            dropoffCount: 4000,
            segmentBreakdown: [
              { segment: "enterprise", enteringCount: 3000, conversionRate: 0.65, averageTimeInStage: 3 },
              { segment: "smb", enteringCount: 7000, conversionRate: 0.55, averageTimeInStage: 5 },
            ],
            averageTimeInStage: 4,
            medianTimeInStage: 3,
          },
          {
            stage: "interest",
            enteringCount: 6000,
            exitingCount: 6000,
            conversionRate: 0.4,
            dropoffRate: 0.6,
            dropoffCount: 3600,
            segmentBreakdown: [
              { segment: "enterprise", enteringCount: 1950, conversionRate: 0.45, averageTimeInStage: 7 },
              { segment: "smb", enteringCount: 4050, conversionRate: 0.35, averageTimeInStage: 10 },
            ],
            averageTimeInStage: 8,
            medianTimeInStage: 7,
          },
          {
            stage: "consideration",
            enteringCount: 2400,
            exitingCount: 2400,
            conversionRate: 0.35,
            dropoffRate: 0.65,
            dropoffCount: 1560,
            segmentBreakdown: [],
            averageTimeInStage: 14,
            medianTimeInStage: 12,
          },
          {
            stage: "intent",
            enteringCount: 840,
            exitingCount: 840,
            conversionRate: 0.5,
            dropoffRate: 0.5,
            dropoffCount: 420,
            segmentBreakdown: [],
            averageTimeInStage: 21,
            medianTimeInStage: 18,
          },
          {
            stage: "purchase",
            enteringCount: 420,
            exitingCount: 420,
            conversionRate: 0.8,
            dropoffRate: 0.2,
            dropoffCount: 84,
            segmentBreakdown: [],
            averageTimeInStage: 5,
            medianTimeInStage: 3,
          },
        ],
        segmentAnalysis: [
          {
            segment: "enterprise",
            overallConversionRate: 0.065,
            topOfFunnelVolume: 3000,
            notablePatterns: ["Higher conversion at awareness", "Longer consideration time"],
          },
          {
            segment: "smb",
            overallConversionRate: 0.035,
            topOfFunnelVolume: 7000,
            notablePatterns: ["Higher dropoff at interest", "Faster progression but lower conversion"],
          },
        ],
        attributionModel: "last-touch",
      };

      const diagnostic = service.createFunnelDiagnostic(params);

      expect(diagnostic).toBeDefined();
      expect(diagnostic.diagnosticKey).toBe("funnel-q1-2024");
      expect(diagnostic.stages.length).toBe(5);
      expect(diagnostic.weakestStage).toBeDefined();
      expect(diagnostic.weakestStage.stage).toBe("consideration"); // Lowest conversion rate (0.35)
      expect(diagnostic.strongestStage).toBeDefined();
      expect(diagnostic.strongestStage.stage).toBe("purchase"); // Highest conversion rate
      expect(diagnostic.recommendations.length).toBeGreaterThan(0);
      expect(diagnostic.diagnosticConfidence).toBeDefined();
    });

    it("detects anomalies in funnel stages", () => {
      const params: CreateFunnelDiagnosticParams = {
        diagnosticKey: "funnel-anomaly-test",
        funnelName: "Test Funnel",
        funnelDescription: "Testing anomaly detection",
        analyzedStages: ["awareness", "interest", "purchase"],
        stages: [
          {
            stage: "awareness",
            enteringCount: 1000,
            exitingCount: 1000,
            conversionRate: 0.7,
            dropoffRate: 0.3,
            dropoffCount: 300,
            segmentBreakdown: [],
            averageTimeInStage: 2,
            medianTimeInStage: 1,
          },
          {
            stage: "interest",
            enteringCount: 700,
            exitingCount: 700,
            conversionRate: 0.1, // Very low - anomaly
            dropoffRate: 0.9,
            dropoffCount: 630,
            segmentBreakdown: [],
            averageTimeInStage: 3,
            medianTimeInStage: 2,
          },
          {
            stage: "purchase",
            enteringCount: 70,
            exitingCount: 70,
            conversionRate: 0.85,
            dropoffRate: 0.15,
            dropoffCount: 10.5,
            segmentBreakdown: [],
            averageTimeInStage: 3,
            medianTimeInStage: 2,
          },
        ],
        attributionModel: "last-touch",
      };

      const diagnostic = service.createFunnelDiagnostic(params);

      expect(diagnostic.diagnosticConfidence).toBe("medium");
      expect(diagnostic.weakestStage.severity).toBe("critical");
    });
  });

  describe("createAttributionDiagnostic", () => {
    it("creates attribution diagnostic with channel analysis", () => {
      const params: CreateAttributionDiagnosticParams = {
        diagnosticKey: "attr-q1-2024",
        attributionModel: "time-decay",
        channelAttribution: [
          {
            channel: "organic_search",
            attributedRevenue: 150000,
            attributedConversions: 150,
            contributionPercentage: 35,
            touchpointsToConversion: 2.5,
          },
          {
            channel: "paid_search",
            attributedRevenue: 100000,
            attributedConversions: 100,
            contributionPercentage: 25,
            touchpointsToConversion: 1.8,
          },
          {
            channel: "email",
            attributedRevenue: 80000,
            attributedConversions: 80,
            contributionPercentage: 20,
            touchpointsToConversion: 3.2,
          },
          {
            channel: "direct",
            attributedRevenue: 60000,
            attributedConversions: 55,
            contributionPercentage: 15,
            touchpointsToConversion: 1.2,
          },
          {
            channel: "social",
            attributedRevenue: 20000,
            attributedConversions: 20,
            contributionPercentage: 5,
            touchpointsToConversion: 4.1,
          },
        ],
        commonPaths: [
          {
            path: "organic_search -> email -> direct",
            frequency: 45,
            conversionRate: 0.12,
            averageValue: 1200,
          },
          {
            path: "paid_search -> direct",
            frequency: 30,
            conversionRate: 0.08,
            averageValue: 1000,
          },
        ],
      };

      const diagnostic = service.createAttributionDiagnostic(params);

      expect(diagnostic).toBeDefined();
      expect(diagnostic.attributionModel).toBe("time-decay");
      expect(diagnostic.channelAttribution.length).toBe(5);
      expect(diagnostic.confidence).toBeDefined();
      expect(diagnostic.issues.length).toBe(0); // No issues in this case
      // Recommendations depend on model and data - time-decay with balanced channels may not trigger recommendations
    });
  });

  describe("lifecycle triggers and actions", () => {
    it("creates and triggers lifecycle actions", () => {
      // Create a trigger
      const trigger = service.createTrigger(
        "High-Intent Engagement",
        "Trigger action when user shows high engagement signals",
        "engagement-threshold",
        "retention-offer",
        {
          behavioralConditions: [
            { metric: "feature_usage_score", threshold: 80, comparison: "above", windowDays: 14 },
          ],
          confidenceLevel: "high",
          enabled: true,
        }
      );

      expect(trigger).toBeDefined();
      expect(trigger.enabled).toBe(true);
      expect(trigger.confidenceLevel).toBe("high");

      // Create funnel diagnostic to link
      const funnelDiag = service.createFunnelDiagnostic({
        diagnosticKey: "funnel-trigger-test",
        funnelName: "Test Funnel",
        funnelDescription: "Test",
        analyzedStages: ["awareness", "purchase"],
        stages: [
          {
            stage: "awareness",
            enteringCount: 1000,
            exitingCount: 1000,
            conversionRate: 0.5,
            dropoffRate: 0.5,
            dropoffCount: 500,
            segmentBreakdown: [],
            averageTimeInStage: 2,
            medianTimeInStage: 1,
          },
          {
            stage: "purchase",
            enteringCount: 500,
            exitingCount: 500,
            conversionRate: 0.8,
            dropoffRate: 0.2,
            dropoffCount: 100,
            segmentBreakdown: [],
            averageTimeInStage: 3,
            medianTimeInStage: 2,
          },
        ],
        attributionModel: "last-touch",
      });

      // Trigger lifecycle action
      const triggerParams: TriggerLifecycleActionParams = {
        triggerId: trigger.id,
        targetSegment: "high-engagement-users",
        targetEntityIds: ["user-1", "user-2", "user-3"],
        confidence: "high",
        confidenceRationale: "Based on verified behavioral threshold signals",
        priority: "high",
        expectedOutcome: [
          { metric: "retention_rate", targetChange: 0.15, confidence: "high" },
          { metric: "lifetime_value", targetChange: 0.1, confidence: "medium" },
        ],
        sourceDiagnosticId: funnelDiag.id,
      };

      const action = service.triggerLifecycleAction(triggerParams);

      expect(action).toBeDefined();
      // Action type is the trigger's suggestedActionType ("retention-offer"), not the trigger type
      expect(action.type).toBe("retention-offer");
      expect(action.targetSegment).toBe("high-engagement-users");
      expect(action.targetEntityIds.length).toBe(3);
      expect(action.confidence).toBe("high");
      expect(action.priority).toBe("high");
      expect(action.status).toBe("proposed");
      expect(action.expectedOutcome?.length).toBe(2);
    });

    it("updates lifecycle action status through workflow", () => {
      const trigger = service.createTrigger(
        "Dormancy Alert",
        "Trigger when user becomes dormant",
        "dormancy",
        "re-engagement"
      );

      const action = service.triggerLifecycleAction({
        triggerId: trigger.id,
        targetSegment: "dormant-users",
        targetEntityIds: ["user-10"],
        confidence: "medium",
        confidenceRationale: "Based on 30-day inactivity signal",
        priority: "medium",
      });

      // Approve
      let updated = service.updateLifecycleActionStatus({
        actionId: action.id,
        status: "approved",
      });
      expect(updated?.status).toBe("approved");
      expect(updated?.approvedAt).toBeDefined();

      // Execute
      updated = service.updateLifecycleActionStatus({
        actionId: action.id,
        status: "executed",
        notes: ["Sent re-engagement email sequence"],
        executedAt: new Date().toISOString(),
      });
      expect(updated?.status).toBe("executed");
      expect(updated?.executedAt).toBeDefined();

      // Complete with results
      updated = service.updateLifecycleActionStatus({
        actionId: action.id,
        status: "completed",
        actualResults: [
          { metric: "reactivation_rate", actualChange: 0.12, success: true },
        ],
        completedAt: new Date().toISOString(),
      });
      expect(updated?.status).toBe("completed");
      expect(updated?.completedAt).toBeDefined();
      expect(updated?.actualResults?.length).toBe(1);
    });
  });

  describe("revenue actions", () => {
    it("proposes and manages revenue actions", () => {
      const params: ProposeRevenueActionParams = {
        actionKey: "upsell-premium-q2",
        type: "upsell",
        name: "Premium Tier Upsell Campaign",
        description: "Upsell high-value customers to premium tier",
        segment: "high-value-basic",
        segmentSize: 500,
        segmentCriteria: { plan_type: ["basic"], tenure_months: ["6+"], engagement_score: ["80+"] },
        estimatedImpact: {
          revenue: 75000,
          marginImpact: 50000,
          customerCount: 50,
        },
        confidence: "high",
        confidenceRationale: "Based on historical upsell conversion rates",
        priority: "high",
      };

      const action = service.proposeRevenueAction(params);

      expect(action).toBeDefined();
      expect(action.type).toBe("upsell");
      expect(action.segmentSize).toBe(500);
      expect(action.estimatedImpact?.revenue).toBe(75000);
      expect(action.status).toBe("proposed");

      // Get active actions
      const activeActions = service.getActiveRevenueActions();
      expect(activeActions.length).toBe(1);

      // Update status
      const updated = service.updateRevenueActionStatus({
        actionId: action.id,
        status: "executed",
        executedAt: new Date().toISOString(),
      });
      expect(updated?.status).toBe("executed");
    });
  });

  describe("generateSummary", () => {
    it("generates comprehensive summary statistics", () => {
      // Create funnel diagnostic
      service.createFunnelDiagnostic({
        diagnosticKey: "summary-test-1",
        funnelName: "Test Funnel",
        funnelDescription: "Test",
        analyzedStages: ["awareness", "interest", "purchase"],
        stages: [
          { stage: "awareness", enteringCount: 1000, exitingCount: 1000, conversionRate: 0.5, dropoffRate: 0.5, dropoffCount: 500, segmentBreakdown: [], averageTimeInStage: 2, medianTimeInStage: 1 },
          { stage: "interest", enteringCount: 500, exitingCount: 500, conversionRate: 0.4, dropoffRate: 0.6, dropoffCount: 300, segmentBreakdown: [], averageTimeInStage: 5, medianTimeInStage: 4 },
          { stage: "purchase", enteringCount: 200, exitingCount: 200, conversionRate: 0.7, dropoffRate: 0.3, dropoffCount: 60, segmentBreakdown: [], averageTimeInStage: 3, medianTimeInStage: 2 },
        ],
        attributionModel: "last-touch",
      });

      // Create trigger and action
      const trigger = service.createTrigger(
        "Test Trigger",
        "Test description",
        "segment-entry",
        "engagement-threshold"
      );

      service.triggerLifecycleAction({
        triggerId: trigger.id,
        targetSegment: "test-segment",
        targetEntityIds: ["u1", "u2"],
        confidence: "high",
        confidenceRationale: "Test",
        priority: "high",
      });

      // Create revenue action
      service.proposeRevenueAction({
        actionKey: "summary-rev-1",
        type: "cross-sell",
        name: "Test Revenue Action",
        description: "Test",
        segment: "test",
        segmentSize: 100,
        segmentCriteria: {},
        confidence: "medium",
        confidenceRationale: "Test",
        priority: "medium",
      });

      const summary = service.generateSummary();

      expect(summary.totalDiagnostics).toBe(1);
      expect(summary.totalLifecycleActions).toBe(1);
      expect(summary.activeLifecycleActions).toBe(1);
      expect(summary.totalRevenueActions).toBe(1);
      expect(summary.funnelDiagnosticsByStage["awareness"]).toBe(1);
      expect(summary.funnelDiagnosticsByStage["purchase"]).toBe(1);
    });
  });
});
