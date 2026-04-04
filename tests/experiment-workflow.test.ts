/**
 * Experiment Workflow Tests
 * VAL-DEPT-GR-001: Experiment workflow yields structured decisions rather than dashboard-only reporting
 */

import { describe, expect, it, beforeEach } from "vitest";
import { ExperimentWorkflowService } from "../src/experiment-workflow-service.js";
import type {
  CreateExperimentParams,
  DesignExperimentParams,
  RecordExperimentResultsParams,
  CreateReadoutParams,
  CreatePlaybookParams,
} from "../src/types.js";

describe("ExperimentWorkflowService", () => {
  let service: ExperimentWorkflowService;

  beforeEach(() => {
    service = new ExperimentWorkflowService();
  });

  describe("createExperiment", () => {
    it("creates a new experiment with hypothesis status", () => {
      const params: CreateExperimentParams = {
        experimentKey: "gr-test-001",
        title: "CTA Button Color Test",
        description: "Testing green vs blue CTA button",
        ownerRoleKey: "growth-demand-specialist",
        tags: ["cta", "conversion"],
      };

      const experiment = service.createExperiment(params);

      expect(experiment).toBeDefined();
      expect(experiment.experimentKey).toBe("gr-test-001");
      expect(experiment.status).toBe("hypothesis");
      expect(experiment.ownerRoleKey).toBe("growth-demand-specialist");
      expect(experiment.tags).toContain("cta");
    });
  });

  describe("designExperiment", () => {
    it("designs an experiment and moves to designed status", () => {
      const exp = service.createExperiment({
        experimentKey: "gr-test-002",
        title: "Landing Page Test",
        description: "Testing new landing page layout",
        ownerRoleKey: "growth-revops-lead",
      });

      const designParams: DesignExperimentParams = {
        experimentId: exp.id,
        hypothesis: {
          hypothesis: "New landing page layout will increase conversions by 15%",
          assumption: "Users prefer cleaner design with less clutter",
          targetMetric: "conversion_rate",
          targetChange: 0.15,
          controlDescription: "Current landing page with sidebar",
          treatmentDescription: "New landing page without sidebar",
          confidenceLevel: "medium",
          riskLevel: "low",
        },
        targetSegment: "new-visitors",
        segmentCriteria: { source: ["organic"], location: ["US"] },
        trafficAllocation: 50,
        minimumSampleSize: 1000,
        expectedDurationDays: 14,
        minimumDurationDays: 7,
      };

      const designed = service.designExperiment(designParams);

      expect(designed).toBeDefined();
      expect(designed?.status).toBe("designed");
      expect(designed?.design).toBeDefined();
      expect(designed?.design?.hypothesis.targetChange).toBe(0.15);
    });

    it("returns undefined for non-existent experiment", () => {
      const result = service.designExperiment({
        experimentId: "non-existent",
        hypothesis: {
          hypothesis: "Test",
          assumption: "Test assumption",
          targetMetric: "test",
          targetChange: 0.1,
          controlDescription: "Control",
          treatmentDescription: "Treatment",
          confidenceLevel: "low",
          riskLevel: "low",
        },
        targetSegment: "test",
        segmentCriteria: {},
        trafficAllocation: 50,
        minimumSampleSize: 100,
        expectedDurationDays: 7,
        minimumDurationDays: 3,
      });

      expect(result).toBeUndefined();
    });
  });

  describe("experiment lifecycle", () => {
    it("moves experiment through full lifecycle", () => {
      // Create
      const exp = service.createExperiment({
        experimentKey: "gr-lifecycle-001",
        title: "Email Subject Line Test",
        description: "Testing emoji vs no emoji in subject lines",
        ownerRoleKey: "growth-demand-specialist",
      });
      expect(exp.status).toBe("hypothesis");

      // Design
      service.designExperiment({
        experimentId: exp.id,
        hypothesis: {
          hypothesis: "Emoji in subject lines will increase open rate by 10%",
          assumption: "Emojis catch attention",
          targetMetric: "open_rate",
          targetChange: 0.1,
          controlDescription: "No emoji in subject",
          treatmentDescription: "Emoji in subject",
          confidenceLevel: "high",
          riskLevel: "low",
        },
        targetSegment: "email-subscribers",
        segmentCriteria: { subscription_age_days: ["30+"] },
        trafficAllocation: 40,
        minimumSampleSize: 500,
        expectedDurationDays: 10,
        minimumDurationDays: 5,
      });

      let updated = service.getExperiment(exp.id);
      expect(updated?.status).toBe("designed");

      // Submit for approval
      service.submitForApproval({ experimentId: exp.id, submitterRoleKey: "growth-demand-specialist" });
      updated = service.getExperiment(exp.id);
      expect(updated?.status).toBe("approved");
      expect(updated?.approvedAt).toBeDefined();

      // Start
      service.startExperiment({ experimentId: exp.id, startedByRoleKey: "growth-revops-lead" });
      updated = service.getExperiment(exp.id);
      expect(updated?.status).toBe("running");
      expect(updated?.startedAt).toBeDefined();

      // Pause
      service.pauseExperiment(exp.id);
      updated = service.getExperiment(exp.id);
      expect(updated?.status).toBe("paused");

      // Resume
      service.resumeExperiment(exp.id);
      updated = service.getExperiment(exp.id);
      expect(updated?.status).toBe("running");
    });
  });

  describe("recordResults", () => {
    it("records results and generates readout with decision", () => {
      const exp = service.createExperiment({
        experimentKey: "gr-results-001",
        title: "Checkout Flow Test",
        description: "Testing simplified checkout",
        ownerRoleKey: "growth-revops-lead",
      });

      service.designExperiment({
        experimentId: exp.id,
        hypothesis: {
          hypothesis: "Simplified checkout will increase completion by 20%",
          assumption: "Fewer steps reduces friction",
          targetMetric: "checkout_completion_rate",
          targetChange: 0.2,
          controlDescription: "5-step checkout",
          treatmentDescription: "3-step checkout",
          confidenceLevel: "medium",
          riskLevel: "medium",
        },
        targetSegment: "cart-users",
        segmentCriteria: { cart_value: ["50+"] },
        trafficAllocation: 50,
        minimumSampleSize: 1000,
        expectedDurationDays: 21,
        minimumDurationDays: 14,
      });

      service.submitForApproval({ experimentId: exp.id, submitterRoleKey: "growth-demand-specialist" });
      service.startExperiment({ experimentId: exp.id, startedByRoleKey: "growth-revops-lead" });

      const resultsParams: RecordExperimentResultsParams = {
        experimentId: exp.id,
        sampleSize: {
          control: 5000,
          treatment: 5000,
          total: 10000,
        },
        results: [
          {
            metric: "checkout_completion_rate",
            controlValue: 500, // 10% baseline
            treatmentValue: 650, // 13% treatment - 30% lift
            absoluteChange: 0.03,
            percentChange: 0.3,
            isSignificant: true,
            isPositive: true,
          },
        ],
      };

      const withResults = service.recordResults(resultsParams);
      expect(withResults).toBeDefined();
      expect(withResults?.status).toBe("completed");
      expect(withResults?.readout).toBeDefined();
      expect(withResults?.readout?.recommendation).toBeDefined();
      expect(withResults?.readout?.recommendationRationale).toBeTruthy();
    });
  });

  describe("createPlaybook", () => {
    it("creates playbook from experiment learnings", () => {
      // First create and run an experiment
      const exp = service.createExperiment({
        experimentKey: "gr-playbook-001",
        title: "Free Trial CTA Test",
        description: "Testing different free trial offers",
        ownerRoleKey: "growth-demand-specialist",
      });

      service.designExperiment({
        experimentId: exp.id,
        hypothesis: {
          hypothesis: "Extended trial will increase conversions",
          assumption: "More time to evaluate increases commitment",
          targetMetric: "trial_to_paid_conversion",
          targetChange: 0.25,
          controlDescription: "14-day trial",
          treatmentDescription: "30-day trial",
          confidenceLevel: "high",
          riskLevel: "low",
        },
        targetSegment: "new-signups",
        segmentCriteria: {},
        trafficAllocation: 50,
        minimumSampleSize: 500,
        expectedDurationDays: 30,
        minimumDurationDays: 21,
      });

      service.submitForApproval({ experimentId: exp.id, submitterRoleKey: "growth-demand-specialist" });
      service.startExperiment({ experimentId: exp.id, startedByRoleKey: "growth-revops-lead" });

      service.recordResults({
        experimentId: exp.id,
        sampleSize: { control: 1000, treatment: 1000, total: 2000 },
        results: [
          {
            metric: "trial_to_paid_conversion",
            controlValue: 100,
            treatmentValue: 130,
            absoluteChange: 0.03,
            percentChange: 0.3,
            isSignificant: true,
            isPositive: true,
          },
        ],
      });

      const playbookParams: CreatePlaybookParams = {
        playbookKey: "extended-trial-conversion",
        title: "Extended Free Trial Playbook",
        description: "Use extended trial periods to improve trial-to-paid conversion",
        patternType: "conversion",
        sourceExperimentIds: [exp.id],
        recommendedFor: {
          segments: ["new-signups"],
          channels: ["email", "in-app"],
          productAreas: ["acquisition", "conversion"],
        },
        steps: [
          {
            action: "Offer 30-day trial instead of 14-day",
            rationale: "Longer evaluation period increases user commitment",
            expectedOutcome: "20-30% increase in trial-to-paid conversion",
          },
        ],
      };

      const playbook = service.createPlaybook(playbookParams);

      expect(playbook).toBeDefined();
      expect(playbook?.playbookKey).toBe("extended-trial-conversion");
      expect(playbook?.status).toBe("draft");
      expect(playbook?.confidence).toBeDefined();
      expect(playbook?.supportingMetrics.length).toBeGreaterThan(0);
    });
  });

  describe("generateSummary", () => {
    it("generates accurate summary statistics", () => {
      // Create multiple experiments in different states
      service.createExperiment({
        experimentKey: "gr-summary-1",
        title: "Test 1",
        description: "Test",
        ownerRoleKey: "growth-demand-specialist",
      });

      const exp2 = service.createExperiment({
        experimentKey: "gr-summary-2",
        title: "Test 2",
        description: "Test",
        ownerRoleKey: "growth-revops-lead",
      });

      service.designExperiment({
        experimentId: exp2.id,
        hypothesis: {
          hypothesis: "Test",
          assumption: "Test",
          targetMetric: "test",
          targetChange: 0.1,
          controlDescription: "Control",
          treatmentDescription: "Treatment",
          confidenceLevel: "medium",
          riskLevel: "low",
        },
        targetSegment: "test",
        segmentCriteria: {},
        trafficAllocation: 50,
        minimumSampleSize: 100,
        expectedDurationDays: 7,
        minimumDurationDays: 3,
      });

      service.submitForApproval({ experimentId: exp2.id, submitterRoleKey: "growth-demand-specialist" });
      service.startExperiment({ experimentId: exp2.id, startedByRoleKey: "growth-revops-lead" });

      const summary = service.generateSummary();

      expect(summary.totalExperiments).toBe(2);
      expect(summary.activeExperiments).toBe(1);
      expect(summary.byStatus.hypothesis).toBe(1);
      expect(summary.byStatus.running).toBe(1);
    });
  });
});
