/**
 * Experiment Workflow Service
 * VAL-DEPT-GR-001: Experiment workflow yields structured decisions rather than dashboard-only reporting
 * 
 * Designs and prioritizes experiments, captures funnel context, and produces
 * structured win or loss readouts with explicit decisions and reusable
 * playbook knowledge.
 */

import type {
  GrowthExperiment,
  ExperimentDesign,
  ExperimentReadout,
  ExperimentPlaybook,
  ExperimentWorkflowState,
  ExperimentStatus,
  ExperimentDecision,
  ExperimentHypothesis,
  CreateExperimentParams,
  DesignExperimentParams,
  SubmitExperimentParams,
  ApproveExperimentParams,
  StartExperimentParams,
  RecordExperimentResultsParams,
  CreateReadoutParams,
  CreatePlaybookParams,
  ExperimentSummary,
} from "./types.js";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Calculate statistical significance
 * Returns p-value (lower = more significant)
 */
function calculatePValue(
  controlValue: number,
  treatmentValue: number,
  controlSize: number,
  treatmentSize: number,
  baselineVariance: number = 0.01
): number {
  if (controlSize === 0 || treatmentSize === 0) return 1;
  
  const pooledVariance = baselineVariance * (1/controlSize + 1/treatmentSize);
  const zScore = (treatmentValue - controlValue) / Math.sqrt(pooledVariance);
  
  // Standard normal CDF approximation
  const absZ = Math.abs(zScore);
  const t = 1 / (1 + 0.2316419 * absZ);
  const d = 0.3989423 * Math.exp(-absZ * absZ / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  
  return zScore > 0 ? p : p;
}

/**
 * Assess guardrail metrics
 */
function assessGuardrails(
  results: ExperimentReadout["results"],
  guardrails: ExperimentDesign["guardrailMetrics"]
): ExperimentReadout["guardrailAssessment"] {
  if (!guardrails) return [];
  
  return guardrails.map((g) => {
    const result = results.find((r) => r.metric === g.metric);
    if (!result) {
      return {
        metric: g.metric,
        passed: true, // Can't fail if not measured
        actualChange: 0,
        acceptableRange: g.acceptableRange,
      };
    }
    
    const inRange = 
      result.percentChange >= g.acceptableRange[0] * 100 &&
      result.percentChange <= g.acceptableRange[1] * 100;
    
    return {
      metric: g.metric,
      passed: inRange,
      actualChange: result.percentChange,
      acceptableRange: g.acceptableRange,
    };
  });
}

/**
 * Make recommendation based on results
 */
function makeRecommendation(
  results: ExperimentReadout["results"],
  guardrailAssessment: ExperimentReadout["guardrailAssessment"],
  targetMetric: string,
  targetChange: number
): { recommendation: ExperimentDecision; rationale: string } {
  const primaryResult = results.find((r) => r.metric === targetMetric);
  
  // Check guardrails first
  const guardrailsPassed = guardrailAssessment.every((g) => g.passed);
  if (!guardrailsPassed) {
    return {
      recommendation: "stop",
      rationale: "Guardrail metrics were violated. Experiment poses unacceptable risk.",
    };
  }
  
  if (!primaryResult) {
    return {
      recommendation: "stop",
      rationale: "Primary metric was not measured. Insufficient data for decision.",
    };
  }
  
  if (!primaryResult.isSignificant) {
    return {
      recommendation: "iterate",
      rationale: `Results are not statistically significant (p=${primaryResult.statisticalSignificance.toFixed(3)}). More data needed or hypothesis needs refinement.`,
    };
  }
  
  if (!primaryResult.isPositive) {
    return {
      recommendation: "stop",
      rationale: `Treatment showed negative impact (${primaryResult.percentChange.toFixed(1)}%). Hypothesis did not hold.`,
    };
  }
  
  if (primaryResult.percentChange >= targetChange) {
    return {
      recommendation: "scale",
      rationale: `Target exceeded: ${primaryResult.percentChange.toFixed(1)}% vs ${(targetChange * 100).toFixed(0)}% target.`,
    };
  }
  
  return {
    recommendation: "implement",
    rationale: `Positive significant result (${primaryResult.percentChange.toFixed(1)}%), below target but still valuable.`,
  };
}

export class ExperimentWorkflowService {
  private state: ExperimentWorkflowState;

  constructor(initialState?: ExperimentWorkflowState) {
    this.state = initialState ?? {
      experiments: {},
      playbooks: {},
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Create a new experiment
   * VAL-DEPT-GR-001
   */
  createExperiment(params: CreateExperimentParams): GrowthExperiment {
    const now = new Date().toISOString();
    
    const experiment: GrowthExperiment = {
      id: generateId(),
      experimentKey: params.experimentKey,
      title: params.title,
      description: params.description,
      status: "hypothesis",
      linkedCampaignIds: [],
      linkedFunnelDiagnostics: [],
      ownerRoleKey: params.ownerRoleKey,
      teamMembers: [params.ownerRoleKey],
      createdAt: now,
      updatedAt: now,
      createdPlaybookIds: [],
      contributedToPlaybookIds: [],
      tags: params.tags ?? [],
    };

    this.state.experiments[experiment.id] = experiment;
    this.state.lastUpdated = now;
    return experiment;
  }

  /**
   * Get experiment by ID
   */
  getExperiment(experimentId: string): GrowthExperiment | undefined {
    return this.state.experiments[experimentId];
  }

  /**
   * Get all experiments
   */
  getAllExperiments(): GrowthExperiment[] {
    return Object.values(this.state.experiments);
  }

  /**
   * Get experiments by status
   */
  getExperimentsByStatus(status: ExperimentStatus): GrowthExperiment[] {
    return Object.values(this.state.experiments).filter((e) => e.status === status);
  }

  /**
   * Get active experiments
   */
  getActiveExperiments(): GrowthExperiment[] {
    return Object.values(this.state.experiments).filter((e) =>
      ["running", "paused", "approved"].includes(e.status)
    );
  }

  /**
   * Design an experiment
   * VAL-DEPT-GR-001
   */
  designExperiment(params: DesignExperimentParams): GrowthExperiment | undefined {
    const experiment = this.state.experiments[params.experimentId];
    if (!experiment) return undefined;
    
    // Can only design experiments in hypothesis status
    if (experiment.status !== "hypothesis") return undefined;

    const now = new Date().toISOString();
    
    const hypothesis: ExperimentHypothesis = {
      id: generateId(),
      ...params.hypothesis,
    };

    const design: ExperimentDesign = {
      id: generateId(),
      experimentId: params.experimentId,
      hypothesis,
      targetSegment: params.targetSegment,
      segmentCriteria: params.segmentCriteria,
      trafficAllocation: params.trafficAllocation,
      minimumSampleSize: params.minimumSampleSize,
      expectedDurationDays: params.expectedDurationDays,
      minimumDurationDays: params.minimumDurationDays,
      guardrailMetrics: params.guardrailMetrics ?? [],
      implementationNotes: params.implementationNotes ?? "",
      requiredChanges: params.requiredChanges ?? [],
      createdAt: now,
      updatedAt: now,
    };

    experiment.design = design;
    experiment.status = "designed";
    experiment.updatedAt = now;
    this.state.lastUpdated = now;

    return experiment;
  }

  /**
   * Submit experiment for approval
   * VAL-DEPT-GR-001
   */
  submitForApproval(params: SubmitExperimentParams): GrowthExperiment | undefined {
    const experiment = this.state.experiments[params.experimentId];
    if (!experiment) return undefined;
    
    if (experiment.status !== "designed") return undefined;
    
    experiment.status = "approved";
    experiment.approvedAt = new Date().toISOString();
    experiment.updatedAt = new Date().toISOString();
    this.state.lastUpdated = new Date().toISOString();
    
    return experiment;
  }

  /**
   * Approve experiment
   * VAL-DEPT-GR-001
   */
  approveExperiment(params: ApproveExperimentParams): GrowthExperiment | undefined {
    const experiment = this.state.experiments[params.experimentId];
    if (!experiment) return undefined;
    
    if (experiment.status !== "designed" && experiment.status !== "hypothesis") {
      return undefined;
    }

    experiment.status = "approved";
    experiment.approvedAt = new Date().toISOString();
    experiment.updatedAt = new Date().toISOString();
    this.state.lastUpdated = new Date().toISOString();
    
    return experiment;
  }

  /**
   * Start running an experiment
   * VAL-DEPT-GR-001
   */
  startExperiment(params: StartExperimentParams): GrowthExperiment | undefined {
    const experiment = this.state.experiments[params.experimentId];
    if (!experiment) return undefined;
    
    if (experiment.status !== "approved") return undefined;
    
    experiment.status = "running";
    experiment.startedAt = new Date().toISOString();
    experiment.updatedAt = new Date().toISOString();
    this.state.lastUpdated = new Date().toISOString();
    
    return experiment;
  }

  /**
   * Pause an experiment
   * VAL-DEPT-GR-001
   */
  pauseExperiment(experimentId: string): GrowthExperiment | undefined {
    const experiment = this.state.experiments[experimentId];
    if (!experiment) return undefined;
    
    if (experiment.status !== "running") return undefined;
    
    experiment.status = "paused";
    experiment.pausedAt = new Date().toISOString();
    experiment.updatedAt = new Date().toISOString();
    this.state.lastUpdated = new Date().toISOString();
    
    return experiment;
  }

  /**
   * Resume a paused experiment
   * VAL-DEPT-GR-001
   */
  resumeExperiment(experimentId: string): GrowthExperiment | undefined {
    const experiment = this.state.experiments[experimentId];
    if (!experiment) return undefined;
    
    if (experiment.status !== "paused") return undefined;
    
    experiment.status = "running";
    experiment.startedAt = new Date().toISOString(); // Update startedAt to resume point
    experiment.updatedAt = new Date().toISOString();
    this.state.lastUpdated = new Date().toISOString();
    
    return experiment;
  }

  /**
   * Cancel an experiment
   * VAL-DEPT-GR-001
   */
  cancelExperiment(experimentId: string, reason: string): GrowthExperiment | undefined {
    const experiment = this.state.experiments[experimentId];
    if (!experiment) return undefined;
    
    if (["hypothesis", "designed", "approved", "paused"].includes(experiment.status)) {
      experiment.status = "cancelled";
      experiment.updatedAt = new Date().toISOString();
      
      // Add note to readout if exists
      if (experiment.readout) {
        experiment.readout.decisionNotes += `\nCancellation reason: ${reason}`;
      }
      
      this.state.lastUpdated = new Date().toISOString();
      return experiment;
    }
    
    return undefined;
  }

  /**
   * Complete an experiment and record results
   * VAL-DEPT-GR-001
   */
  recordResults(params: RecordExperimentResultsParams): GrowthExperiment | undefined {
    const experiment = this.state.experiments[params.experimentId];
    if (!experiment) return undefined;
    
    if (experiment.status !== "running" && experiment.status !== "paused") return undefined;
    if (!experiment.design) return undefined;

    // Calculate full results with statistical significance
    const results = params.results.map((r) => {
      const controlEntry = params.sampleSize.control > 0 
        ? r.controlValue / params.sampleSize.control 
        : 0;
      const treatmentEntry = params.sampleSize.treatment > 0 
        ? r.treatmentValue / params.sampleSize.treatment 
        : 0;
      
      const absoluteChange = treatmentEntry - controlEntry;
      const percentChange = controlEntry > 0 ? absoluteChange / controlEntry : 0;
      
      const pValue = calculatePValue(
        controlEntry,
        treatmentEntry,
        params.sampleSize.control,
        params.sampleSize.treatment
      );
      
      // 95% confidence interval approximation
      const marginOfError = Math.abs(percentChange) * 0.1;
      const confidenceInterval: [number, number] = [
        (percentChange - marginOfError) * 100,
        (percentChange + marginOfError) * 100,
      ];
      
      return {
        metric: r.metric,
        controlValue: r.controlValue,
        treatmentValue: r.treatmentValue,
        absoluteChange,
        percentChange: percentChange * 100,
        statisticalSignificance: pValue,
        confidenceInterval,
        isSignificant: pValue < 0.05,
        isPositive: absoluteChange > 0,
      };
    });

    // Create readout
    const targetMetric = experiment.design.hypothesis.targetMetric;
    const targetChange = experiment.design.hypothesis.targetChange;
    const guardrailAssessment = assessGuardrails(results, experiment.design.guardrailMetrics);
    const { recommendation, rationale } = makeRecommendation(
      results,
      guardrailAssessment,
      targetMetric,
      targetChange
    );

    const readout: ExperimentReadout = {
      id: generateId(),
      experimentId: params.experimentId,
      status: "final",
      sampleSize: params.sampleSize,
      results,
      guardrailAssessment,
      recommendation,
      recommendationRationale: rationale,
      decisionMakerRoleKey: experiment.ownerRoleKey,
      decidedAt: new Date().toISOString(),
      decisionNotes: "",
      keyLearnings: [],
      playbookInsights: [],
      followUpExperiments: [],
      createdAt: new Date().toISOString(),
    };

    experiment.readout = readout;
    experiment.status = "completed";
    experiment.completedAt = new Date().toISOString();
    experiment.updatedAt = new Date().toISOString();
    this.state.lastUpdated = new Date().toISOString();

    return experiment;
  }

  /**
   * Create or update readout with explicit decision
   * VAL-DEPT-GR-001
   */
  createReadout(params: CreateReadoutParams): GrowthExperiment | undefined {
    const experiment = this.state.experiments[params.experimentId];
    if (!experiment) return undefined;
    
    if (!experiment.readout) return undefined;

    experiment.readout.status = params.status;
    experiment.readout.recommendation = params.recommendation;
    experiment.readout.recommendationRationale = params.recommendationRationale;
    experiment.readout.decisionMakerRoleKey = params.decisionMakerRoleKey;
    experiment.readout.decidedAt = new Date().toISOString();
    experiment.readout.decisionNotes = params.decisionNotes;
    experiment.readout.keyLearnings = params.keyLearnings ?? [];
    experiment.readout.playbookInsights = params.playbookInsights ?? [];
    experiment.readout.followUpExperiments = params.followUpExperiments ?? [];

    experiment.updatedAt = new Date().toISOString();
    this.state.lastUpdated = new Date().toISOString();

    return experiment;
  }

  /**
   * Get readout for an experiment
   */
  getReadout(experimentId: string): ExperimentReadout | undefined {
    return this.state.experiments[experimentId]?.readout;
  }

  /**
   * Link experiment to funnel diagnostic
   */
  linkFunnelDiagnostic(experimentId: string, diagnosticId: string): GrowthExperiment | undefined {
    const experiment = this.state.experiments[experimentId];
    if (!experiment) return undefined;

    if (!experiment.linkedFunnelDiagnostics.includes(diagnosticId)) {
      experiment.linkedFunnelDiagnostics.push(diagnosticId);
      experiment.updatedAt = new Date().toISOString();
      this.state.lastUpdated = new Date().toISOString();
    }

    return experiment;
  }

  /**
   * Create playbook from experiment learnings
   * VAL-DEPT-GR-001
   */
  createPlaybook(params: CreatePlaybookParams): ExperimentPlaybook | undefined {
    const now = new Date().toISOString();

    // Collect supporting metrics from source experiments
    const supportingMetrics: ExperimentPlaybook["supportingMetrics"] = [];
    const experiments = params.sourceExperimentIds
      .map((id) => this.state.experiments[id])
      .filter(Boolean);

    for (const exp of experiments) {
      if (exp.readout) {
        for (const result of exp.readout.results) {
          const existing = supportingMetrics.find((m) => m.metric === result.metric);
          if (existing) {
            existing.averageLift = (existing.averageLift * existing.sampleSize + result.percentChange) /
              (existing.sampleSize + 1);
            existing.sampleSize++;
          } else {
            supportingMetrics.push({
              metric: result.metric,
              averageLift: result.percentChange,
              sampleSize: 1,
            });
          }
        }
      }
    }

    const playbook: ExperimentPlaybook = {
      id: generateId(),
      playbookKey: params.playbookKey,
      title: params.title,
      description: params.description,
      patternType: params.patternType,
      confidence: supportingMetrics.length >= 3 ? "high" : supportingMetrics.length >= 1 ? "medium" : "low",
      successRate: experiments.filter((e) => e.readout?.recommendation === "implement" || e.readout?.recommendation === "scale").length /
        Math.max(experiments.length, 1) * 100,
      sourceExperimentIds: params.sourceExperimentIds,
      supportingMetrics,
      recommendedFor: params.recommendedFor,
      steps: params.steps.map((s, i) => ({ ...s, order: i + 1 })),
      status: "draft",
      validatedCount: 0,
      lastValidatedAt: now,
      createdAt: now,
    };

    this.state.playbooks[playbook.id] = playbook;

    // Link playbook to experiments
    for (const expId of params.sourceExperimentIds) {
      const exp = this.state.experiments[expId];
      if (exp && !exp.contributedToPlaybookIds.includes(playbook.id)) {
        exp.contributedToPlaybookIds.push(playbook.id);
      }
    }

    this.state.lastUpdated = now;
    return playbook;
  }

  /**
   * Get playbook by ID
   */
  getPlaybook(playbookId: string): ExperimentPlaybook | undefined {
    return this.state.playbooks[playbookId];
  }

  /**
   * Get all playbooks
   */
  getAllPlaybooks(): ExperimentPlaybook[] {
    return Object.values(this.state.playbooks);
  }

  /**
   * Get playbooks by status
   */
  getPlaybooksByStatus(status: ExperimentPlaybook["status"]): ExperimentPlaybook[] {
    return Object.values(this.state.playbooks).filter((p) => p.status === status);
  }

  /**
   * Get validated playbooks for a segment or channel
   */
  getValidatedPlaybooks(
    segment?: string,
    channel?: string
  ): ExperimentPlaybook[] {
    return Object.values(this.state.playbooks)
      .filter((p) => {
        if (p.status !== "validated") return false;
        if (segment && !p.recommendedFor.segments.includes(segment)) return false;
        if (channel && !p.recommendedFor.channels.includes(channel)) return false;
        return true;
      });
  }

  /**
   * Validate a playbook
   * VAL-DEPT-GR-001
   */
  validatePlaybook(playbookId: string): ExperimentPlaybook | undefined {
    const playbook = this.state.playbooks[playbookId];
    if (!playbook) return undefined;

    playbook.status = "validated";
    playbook.validatedCount++;
    playbook.lastValidatedAt = new Date().toISOString();
    this.state.lastUpdated = new Date().toISOString();

    return playbook;
  }

  /**
   * Archive a playbook
   */
  archivePlaybook(playbookId: string): ExperimentPlaybook | undefined {
    const playbook = this.state.playbooks[playbookId];
    if (!playbook) return undefined;

    playbook.status = "archived";
    this.state.lastUpdated = new Date().toISOString();

    return playbook;
  }

  /**
   * Generate experiment summary
   */
  generateSummary(): ExperimentSummary {
    const experiments = Object.values(this.state.experiments);
    const playbooks = Object.values(this.state.playbooks);

    const byStatus: Record<ExperimentStatus, number> = {
      hypothesis: 0,
      designed: 0,
      approved: 0,
      running: 0,
      paused: 0,
      completed: 0,
      cancelled: 0,
      archived: 0,
    };

    let totalDecisionTime = 0;
    let completedWithDecision = 0;

    for (const exp of experiments) {
      byStatus[exp.status]++;

      if (exp.status === "completed" && exp.completedAt && exp.startedAt) {
        completedWithDecision++;
        const days = (new Date(exp.completedAt).getTime() - new Date(exp.startedAt).getTime()) /
          (1000 * 60 * 60 * 24);
        totalDecisionTime += days;
      }
    }

    return {
      totalExperiments: experiments.length,
      byStatus,
      activeExperiments: experiments.filter((e) => e.status === "running" || e.status === "paused").length,
      completedWithDecision,
      playbooksCreated: playbooks.length,
      validatedPlaybooks: playbooks.filter((p) => p.status === "validated").length,
      averageDecisionTimeDays: completedWithDecision > 0
        ? Math.round(totalDecisionTime / completedWithDecision)
        : 0,
    };
  }

  /**
   * Get current state for persistence
   */
  getState(): ExperimentWorkflowState {
    return this.state;
  }

  /**
   * Load state from persistence
   */
  loadState(state: ExperimentWorkflowState): void {
    this.state = state;
  }
}
