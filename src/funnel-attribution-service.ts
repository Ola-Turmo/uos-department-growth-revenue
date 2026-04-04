/**
 * Funnel & Attribution Service
 * VAL-DEPT-GR-002: Funnel and attribution diagnostics support segment-aware lifecycle action
 * 
 * Analyzes funnel drop-offs, labels attribution confidence, and triggers
 * lifecycle or revenue actions based on meaningful segment-aware signals.
 */

import type {
  FunnelDiagnostic,
  FunnelStageMetrics,
  FunnelStage,
  AttributionDiagnostic,
  AttributionModel,
  LifecycleTrigger,
  LifecycleAction,
  RevenueAction,
  FunnelAttributionState,
  CreateFunnelDiagnosticParams,
  CreateAttributionDiagnosticParams,
  TriggerLifecycleActionParams,
  ProposeRevenueActionParams,
  UpdateActionStatusParams,
  DiagnosticConfidence,
  ConfidenceLevel,
  ActionConfidence,
  ActionPriority,
  ActionStatus,
  LifecycleTriggerType,
  RevenueActionType,
  FunnelAttributionSummary,
} from "./types.js";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Assess benchmark comparison for a stage
 */
function assessBenchmark(
  conversionRate: number,
  benchmarkRate?: number
): FunnelStageMetrics["benchmarkComparison"] {
  if (!benchmarkRate) return "at";
  
  const threshold = 0.1; // 10% tolerance
  const ratio = conversionRate / benchmarkRate;
  
  if (ratio > 1 + threshold) return "above";
  if (ratio < 1 - threshold) return "below";
  return "at";
}

/**
 * Detect anomalies in funnel stage
 */
function detectAnomaly(stage: Omit<FunnelStageMetrics, "benchmarkComparison" | "anomalyDetected">): {
  detected: boolean;
  description?: string;
} {
  // Sudden drop detection
  if (stage.dropoffRate > 0.8) {
    return {
      detected: true,
      description: `Severe drop-off detected: ${(stage.dropoffRate * 100).toFixed(0)}% of users leaving at ${stage.stage} stage`,
    };
  }
  
  // Segment variance detection
  if (stage.segmentBreakdown.length > 1) {
    const rates = stage.segmentBreakdown.map((s) => s.conversionRate);
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    const variance = rates.some((r) => Math.abs(r - avg) / avg > 0.5);
    
    if (variance) {
      return {
        detected: true,
        description: `High variance across segments at ${stage.stage}: some segments converting ${(avg * 100).toFixed(0)}% while others much lower`,
      };
    }
  }
  
  // Time anomaly
  if (stage.averageTimeInStage > 14) {
    return {
      detected: true,
      description: `Extended time at ${stage.stage}: average ${stage.averageTimeInStage.toFixed(0)} days suggests friction`,
    };
  }
  
  return { detected: false };
}

/**
 * Calculate overall attribution confidence
 */
function calculateAttributionConfidence(
  factors: AttributionDiagnostic["confidenceFactors"]
): ConfidenceLevel {
  const avgScore = factors.reduce((sum, f) => sum + f.score, 0) / factors.length;
  
  if (avgScore >= 75) return "high";
  if (avgScore >= 50) return "medium";
  return "low";
}

/**
 * Generate funnel recommendations based on analysis
 */
function generateRecommendations(
  stages: FunnelStageMetrics[]
): FunnelDiagnostic["recommendations"] {
  const recommendations: FunnelDiagnostic["recommendations"] = [];

  // Find weakest stage
  const sorted = [...stages].sort((a, b) => a.conversionRate - b.conversionRate);
  const weakest = sorted[0];
  
  if (weakest && weakest.conversionRate < 0.5) {
    recommendations.push({
      priority: weakest.conversionRate < 0.2 ? "critical" : "high",
      stage: weakest.stage,
      action: `Investigate ${weakest.stage} stage - only ${(weakest.conversionRate * 100).toFixed(1)}% conversion`,
      expectedImpact: `Could recover ${Math.round((1 - weakest.conversionRate) * 100)}% of lost users`,
      effortLevel: "medium",
    });
  }

  // Find stages with anomalies
  for (const stage of stages) {
    if (stage.anomalyDetected && stage.anomalyDescription) {
      recommendations.push({
        priority: "high",
        stage: stage.stage,
        action: stage.anomalyDescription,
        expectedImpact: "Reduce user friction and improve conversion",
        effortLevel: "low",
      });
    }
  }

  // Time-based recommendations
  const slowStages = stages.filter((s) => s.averageTimeInStage > 7);
  for (const stage of slowStages) {
    recommendations.push({
      priority: "medium",
      stage: stage.stage,
      action: `Optimize ${stage.stage} stage flow - users spending average ${stage.averageTimeInStage.toFixed(0)} days`,
      expectedImpact: "Reduce friction and speed up progression",
      effortLevel: "medium",
    });
  }

  return recommendations;
}

/**
 * Default attribution confidence factors
 */
const DEFAULT_ATTRIBUTION_CONFIDENCE_FACTORS: AttributionDiagnostic["confidenceFactors"] = [
  {
    factor: "Data completeness",
    assessment: "positive",
    score: 85,
  },
  {
    factor: "Touchpoint variety",
    assessment: "positive",
    score: 70,
  },
  {
    factor: "Conversion volume",
    assessment: "neutral",
    score: 65,
  },
  {
    factor: "Model fit for business",
    assessment: "positive",
    score: 75,
  },
];

export class FunnelAttributionService {
  private state: FunnelAttributionState;

  constructor(initialState?: FunnelAttributionState) {
    this.state = initialState ?? {
      diagnostics: {},
      attributionDiagnostics: {},
      triggers: {},
      lifecycleActions: {},
      revenueActions: {},
      lastUpdated: new Date().toISOString(),
    };
  }

  // ============================================
  // Funnel Diagnostics (VAL-DEPT-GR-002)
  // ============================================

  /**
   * Create a funnel diagnostic
   * VAL-DEPT-GR-002
   */
  createFunnelDiagnostic(params: CreateFunnelDiagnosticParams): FunnelDiagnostic {
    const now = new Date().toISOString();

    // Process stages with benchmark comparison and anomaly detection
    const processedStages: FunnelStageMetrics[] = params.stages.map((stage) => {
      const benchmarkComparison = assessBenchmark(
        stage.conversionRate,
        stage.benchmarkConversionRate
      );
      const anomaly = detectAnomaly(stage);
      
      return {
        ...stage,
        benchmarkComparison,
        anomalyDetected: anomaly.detected,
        anomalyDescription: anomaly.description,
      };
    });

    // Find weakest and strongest stages
    const sorted = [...processedStages].sort((a, b) => a.conversionRate - b.conversionRate);
    const weakestStage = sorted[0];
    const strongestStage = sorted[sorted.length - 1];

    // Calculate overall metrics
    const overallConversionRate = processedStages.reduce(
      (prod, s) => prod * s.conversionRate, 1
    );
    const overallDropoffRate = 1 - overallConversionRate;

    // Segment analysis
    const segmentAnalysis = params.segmentAnalysis ?? [];

    // Attribution analysis (simplified)
    const topAttributionChannels: FunnelDiagnostic["topAttributionChannels"] = [];

    // Generate recommendations
    const recommendations = generateRecommendations(processedStages);

    // Assess confidence
    const diagnosticConfidence: DiagnosticConfidence = processedStages.every(
      (s) => !s.anomalyDetected
    )
      ? "high"
      : processedStages.filter((s) => s.anomalyDetected).length <= 1
      ? "medium"
      : "low";

    const diagnostic: FunnelDiagnostic = {
      id: generateId(),
      diagnosticKey: params.diagnosticKey,
      funnelName: params.funnelName,
      funnelDescription: params.funnelDescription,
      analyzedStages: params.analyzedStages,
      stages: processedStages,
      overallConversionRate,
      overallDropoffRate,
      weakestStage: {
        stage: weakestStage?.stage ?? ("awareness" as FunnelStage),
        conversionRate: weakestStage?.conversionRate ?? 0,
        severity: weakestStage && weakestStage.conversionRate < 0.2
          ? "critical"
          : weakestStage && weakestStage.conversionRate < 0.4
          ? "high"
          : weakestStage && weakestStage.conversionRate < 0.6
          ? "medium"
          : "low",
      },
      strongestStage: {
        stage: strongestStage?.stage ?? ("purchase" as FunnelStage),
        conversionRate: strongestStage?.conversionRate ?? 0,
      },
      segmentAnalysis,
      attributionModel: params.attributionModel,
      attributionConfidence: calculateAttributionConfidence(
        DEFAULT_ATTRIBUTION_CONFIDENCE_FACTORS
      ),
      topAttributionChannels,
      recommendations,
      diagnosticConfidence,
      confidenceRationale: `Analysis based on ${processedStages.length} funnel stages with ${
        processedStages.filter((s) => !s.anomalyDetected).length
      }/${
        processedStages.length
      } stages showing normal behavior.`,
      linkedExperimentIds: params.linkedExperimentIds ?? [],
      triggeredLifecycleActionIds: [],
      createdAt: now,
      updatedAt: now,
    };

    this.state.diagnostics[diagnostic.id] = diagnostic;
    this.state.lastUpdated = now;
    return diagnostic;
  }

  /**
   * Get funnel diagnostic by ID
   */
  getFunnelDiagnostic(diagnosticId: string): FunnelDiagnostic | undefined {
    return this.state.diagnostics[diagnosticId];
  }

  /**
   * Get all funnel diagnostics
   */
  getAllFunnelDiagnostics(): FunnelDiagnostic[] {
    return Object.values(this.state.diagnostics);
  }

  /**
   * Get diagnostics by stage
   */
  getDiagnosticsByStage(stage: FunnelStage): FunnelDiagnostic[] {
    return Object.values(this.state.diagnostics).filter((d) =>
      d.analyzedStages.includes(stage)
    );
  }

  /**
   * Get recent diagnostics
   */
  getRecentDiagnostics(days: number = 7): FunnelDiagnostic[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return Object.values(this.state.diagnostics).filter(
      (d) => new Date(d.createdAt) >= cutoff
    );
  }

  // ============================================
  // Attribution Diagnostics (VAL-DEPT-GR-002)
  // ============================================

  /**
   * Create an attribution diagnostic
   * VAL-DEPT-GR-002
   */
  createAttributionDiagnostic(
    params: CreateAttributionDiagnosticParams
  ): AttributionDiagnostic {
    const now = new Date().toISOString();

    // Assess model-specific confidence factors
    const confidenceFactors: AttributionDiagnostic["confidenceFactors"] = [
      ...DEFAULT_ATTRIBUTION_CONFIDENCE_FACTORS,
    ];

    // Model-specific adjustments
    if (params.attributionModel === "data-driven") {
      confidenceFactors.push({
        factor: "Algorithm transparency",
        assessment: "negative",
        score: 50,
      });
    } else if (params.attributionModel === "first-touch") {
      confidenceFactors.push({
        factor: "Last-touch awareness",
        assessment: "negative",
        score: 45,
      });
    } else if (params.attributionModel === "last-touch") {
      confidenceFactors.push({
        factor: "First-touch credit",
        assessment: "negative",
        score: 45,
      });
    }

    // Identify issues
    const issues: AttributionDiagnostic["issues"] = [];

    // Check for data gaps
    const channelsWithZeroAttribution = params.channelAttribution.filter(
      (c) => c.attributedConversions === 0 && c.touchpointsToConversion > 0
    );
    if (channelsWithZeroAttribution.length > 0) {
      issues.push({
        type: "data-gap",
        description: `${channelsWithZeroAttribution.length} channels show touchpoints but no conversions attributed`,
        impactAssessment: "May indicate tracking gaps or measurement issues",
        suggestedModel: "time-decay",
      });
    }

    // Check for cross-channel conflicts
    const totalPercentage = params.channelAttribution.reduce(
      (sum, c) => sum + c.contributionPercentage,
      0
    );
    if (Math.abs(totalPercentage - 100) > 5) {
      issues.push({
        type: "cross-channel-conflict",
        description: `Attribution percentages sum to ${totalPercentage.toFixed(0)}%, expected 100%`,
        impactAssessment: "Model calibration issue or rounding errors",
      });
    }

    // Generate recommendations
    const recommendations: AttributionDiagnostic["recommendations"] = [];

    if (params.attributionModel === "first-touch" || params.attributionModel === "last-touch") {
      recommendations.push({
        action: "Consider multi-touch attribution model",
        rationale: "Single-touch models may misallocate credit across the customer journey",
        expectedImprovement: "More accurate channel value representation",
      });
    }

    const lowContributionChannels = params.channelAttribution.filter(
      (c) => c.contributionPercentage < 5
    );
    if (lowContributionChannels.length > 3) {
      recommendations.push({
        action: "Audit low-performing channels",
        rationale: `${lowContributionChannels.length} channels contributing less than 5% each`,
        expectedImprovement: "Identify wasted spend or tracking issues",
      });
    }

    const diagnostic: AttributionDiagnostic = {
      id: generateId(),
      diagnosticKey: params.diagnosticKey,
      attributionModel: params.attributionModel,
      confidence: calculateAttributionConfidence(confidenceFactors),
      confidenceFactors,
      channelAttribution: params.channelAttribution,
      commonPaths: params.commonPaths ?? [],
      issues,
      recommendations,
      createdAt: now,
      updatedAt: now,
    };

    this.state.attributionDiagnostics[diagnostic.id] = diagnostic;
    this.state.lastUpdated = now;
    return diagnostic;
  }

  /**
   * Get attribution diagnostic by ID
   */
  getAttributionDiagnostic(diagnosticId: string): AttributionDiagnostic | undefined {
    return this.state.attributionDiagnostics[diagnosticId];
  }

  /**
   * Get all attribution diagnostics
   */
  getAllAttributionDiagnostics(): AttributionDiagnostic[] {
    return Object.values(this.state.attributionDiagnostics);
  }

  // ============================================
  // Lifecycle Triggers (VAL-DEPT-GR-002)
  // ============================================

  /**
   * Create a lifecycle trigger
   * VAL-DEPT-GR-002
   */
  createTrigger(
    name: string,
    description: string,
    type: LifecycleTriggerType,
    suggestedActionType: LifecycleTriggerType | RevenueActionType,
    options?: {
      segmentCriteria?: LifecycleTrigger["segmentCriteria"];
      behavioralConditions?: LifecycleTrigger["behavioralConditions"];
      enabled?: boolean;
      evaluationFrequency?: LifecycleTrigger["evaluationFrequency"];
      confidenceLevel?: ActionConfidence;
    }
  ): LifecycleTrigger {
    const now = new Date().toISOString();

    const trigger: LifecycleTrigger = {
      id: generateId(),
      triggerKey: `trigger-${Date.now()}`,
      type,
      name,
      description,
      segmentCriteria: options?.segmentCriteria,
      behavioralConditions: options?.behavioralConditions,
      enabled: options?.enabled ?? true,
      evaluationFrequency: options?.evaluationFrequency ?? "daily",
      suggestedActionType,
      confidenceLevel: options?.confidenceLevel ?? "medium",
      createdAt: now,
      updatedAt: now,
    };

    this.state.triggers[trigger.id] = trigger;
    this.state.lastUpdated = now;
    return trigger;
  }

  /**
   * Get trigger by ID
   */
  getTrigger(triggerId: string): LifecycleTrigger | undefined {
    return this.state.triggers[triggerId];
  }

  /**
   * Get all triggers
   */
  getAllTriggers(): LifecycleTrigger[] {
    return Object.values(this.state.triggers);
  }

  /**
   * Get enabled triggers
   */
  getEnabledTriggers(): LifecycleTrigger[] {
    return Object.values(this.state.triggers).filter((t) => t.enabled);
  }

  /**
   * Enable/disable trigger
   */
  setTriggerEnabled(triggerId: string, enabled: boolean): LifecycleTrigger | undefined {
    const trigger = this.state.triggers[triggerId];
    if (!trigger) return undefined;

    trigger.enabled = enabled;
    trigger.updatedAt = new Date().toISOString();
    this.state.lastUpdated = new Date().toISOString();
    return trigger;
  }

  // ============================================
  // Lifecycle Actions (VAL-DEPT-GR-002)
  // ============================================

  /**
   * Trigger a lifecycle action based on diagnostic
   * VAL-DEPT-GR-002
   */
  triggerLifecycleAction(params: TriggerLifecycleActionParams): LifecycleAction {
    const now = new Date().toISOString();
    const trigger = this.state.triggers[params.triggerId];
    const actionType = trigger?.suggestedActionType ?? "engagement-threshold";

    const action: LifecycleAction = {
      id: generateId(),
      actionKey: `lifecycle-${Date.now()}`,
      type: actionType,
      name: `Lifecycle action triggered by ${params.triggerId}`,
      description: `Action triggered for segment: ${params.targetSegment}`,
      sourceTriggerId: params.triggerId,
      sourceDiagnosticId: params.sourceDiagnosticId,
      sourceExperimentId: params.sourceExperimentId,
      targetSegment: params.targetSegment,
      targetEntityIds: params.targetEntityIds,
      confidence: params.confidence,
      confidenceRationale: params.confidenceRationale,
      priority: params.priority,
      expectedOutcome: params.expectedOutcome ?? [],
      status: "proposed",
      proposedAt: now,
      evidenceIds: [],
      notes: [],
    };

    this.state.lifecycleActions[action.id] = action;

    // Link to diagnostic if provided
    if (params.sourceDiagnosticId) {
      const diagnostic = this.state.diagnostics[params.sourceDiagnosticId];
      if (diagnostic && !diagnostic.triggeredLifecycleActionIds.includes(action.id)) {
        diagnostic.triggeredLifecycleActionIds.push(action.id);
      }
    }

    this.state.lastUpdated = now;
    return action;
  }

  /**
   * Get lifecycle action by ID
   */
  getLifecycleAction(actionId: string): LifecycleAction | undefined {
    return this.state.lifecycleActions[actionId];
  }

  /**
   * Get all lifecycle actions
   */
  getAllLifecycleActions(): LifecycleAction[] {
    return Object.values(this.state.lifecycleActions);
  }

  /**
   * Get lifecycle actions by status
   */
  getLifecycleActionsByStatus(status: ActionStatus): LifecycleAction[] {
    return Object.values(this.state.lifecycleActions).filter((a) => a.status === status);
  }

  /**
   * Get lifecycle actions by priority
   */
  getLifecycleActionsByPriority(priority: ActionPriority): LifecycleAction[] {
    return Object.values(this.state.lifecycleActions).filter((a) => a.priority === priority);
  }

  /**
   * Get active lifecycle actions
   */
  getActiveLifecycleActions(): LifecycleAction[] {
    return Object.values(this.state.lifecycleActions).filter(
      (a) => !["completed", "failed", "cancelled"].includes(a.status)
    );
  }

  /**
   * Update lifecycle action status
   * VAL-DEPT-GR-002
   */
  updateLifecycleActionStatus(
    params: UpdateActionStatusParams
  ): LifecycleAction | undefined {
    const action = this.state.lifecycleActions[params.actionId];
    if (!action) return undefined;

    const now = new Date().toISOString();
    action.status = params.status;

    if (params.status === "approved") {
      action.approvedAt = now;
    } else if (params.status === "executed") {
      action.executedAt = params.executedAt ?? now;
    } else if (params.status === "completed") {
      action.completedAt = params.completedAt ?? now;
    }

    if (params.notes && params.notes.length > 0) {
      action.notes.push(...params.notes);
    }

    if (params.actualResults) {
      action.actualResults = params.actualResults as LifecycleAction["actualResults"];
    }

    this.state.lastUpdated = now;
    return action;
  }

  /**
   * Assign lifecycle action
   */
  assignLifecycleAction(
    actionId: string,
    roleKey: string,
    team?: string
  ): LifecycleAction | undefined {
    const action = this.state.lifecycleActions[actionId];
    if (!action) return undefined;

    action.ownerRoleKey = roleKey;
    action.assignedToTeam = team;
    this.state.lastUpdated = new Date().toISOString();
    return action;
  }

  // ============================================
  // Revenue Actions (VAL-DEPT-GR-002)
  // ============================================

  /**
   * Propose a revenue action
   * VAL-DEPT-GR-002
   */
  proposeRevenueAction(params: ProposeRevenueActionParams): RevenueAction {
    const now = new Date().toISOString();

    const action: RevenueAction = {
      id: generateId(),
      actionKey: params.actionKey,
      type: params.type,
      name: params.name,
      description: params.description,
      segment: params.segment,
      segmentSize: params.segmentSize,
      segmentCriteria: params.segmentCriteria,
      estimatedImpact: params.estimatedImpact,
      confidence: params.confidence,
      confidenceRationale: params.confidenceRationale,
      priority: params.priority,
      status: "proposed",
      proposedAt: now,
      createdAt: now,
    };

    this.state.revenueActions[action.id] = action;
    this.state.lastUpdated = now;
    return action;
  }

  /**
   * Get revenue action by ID
   */
  getRevenueAction(actionId: string): RevenueAction | undefined {
    return this.state.revenueActions[actionId];
  }

  /**
   * Get all revenue actions
   */
  getAllRevenueActions(): RevenueAction[] {
    return Object.values(this.state.revenueActions);
  }

  /**
   * Get revenue actions by status
   */
  getRevenueActionsByStatus(status: ActionStatus): RevenueAction[] {
    return Object.values(this.state.revenueActions).filter((a) => a.status === status);
  }

  /**
   * Get revenue actions by priority
   */
  getRevenueActionsByPriority(priority: ActionPriority): RevenueAction[] {
    return Object.values(this.state.revenueActions).filter((a) => a.priority === priority);
  }

  /**
   * Get active revenue actions
   */
  getActiveRevenueActions(): RevenueAction[] {
    return Object.values(this.state.revenueActions).filter(
      (a) => !["completed", "failed", "cancelled"].includes(a.status)
    );
  }

  /**
   * Update revenue action status
   * VAL-DEPT-GR-002
   */
  updateRevenueActionStatus(
    params: UpdateActionStatusParams
  ): RevenueAction | undefined {
    const action = this.state.revenueActions[params.actionId];
    if (!action) return undefined;

    const now = new Date().toISOString();
    action.status = params.status;

    if (params.status === "approved") {
      action.approvedAt = now;
    } else if (params.status === "executed") {
      action.executedAt = params.executedAt ?? now;
    }

    if (params.actualResults) {
      action.actualResults = params.actualResults as RevenueAction["actualResults"];
    }

    this.state.lastUpdated = now;
    return action;
  }

  /**
   * Assign revenue action
   */
  assignRevenueAction(actionId: string, roleKey: string): RevenueAction | undefined {
    const action = this.state.revenueActions[actionId];
    if (!action) return undefined;

    action.ownerRoleKey = roleKey;
    this.state.lastUpdated = new Date().toISOString();
    return action;
  }

  // ============================================
  // Summary and Reporting
  // ============================================

  /**
   * Generate funnel attribution summary
   */
  generateSummary(): FunnelAttributionSummary {
    const diagnostics = Object.values(this.state.diagnostics);
    const lifecycleActions = Object.values(this.state.lifecycleActions);
    const revenueActions = Object.values(this.state.revenueActions);

    // Funnel diagnostics by stage
    const funnelDiagnosticsByStage: Record<FunnelStage, number> = {
      awareness: 0,
      interest: 0,
      consideration: 0,
      intent: 0,
      purchase: 0,
      retention: 0,
      advocacy: 0,
    };

    for (const diag of diagnostics) {
      for (const stage of diag.analyzedStages) {
        funnelDiagnosticsByStage[stage]++;
      }
    }

    // Average confidence
    const confidences = [
      ...lifecycleActions.map((a) => a.confidence),
      ...revenueActions.map((a) => a.confidence),
    ];
    const confidenceScore = {
      high: 1,
      medium: 0.6,
      low: 0.3,
    };
    const avgConfidence =
      confidences.length > 0
        ? confidences.reduce((sum, c) => sum + confidenceScore[c], 0) / confidences.length
        : 0;

    return {
      totalDiagnostics: diagnostics.length,
      totalLifecycleActions: lifecycleActions.length,
      activeLifecycleActions: lifecycleActions.filter(
        (a) => !["completed", "failed", "cancelled"].includes(a.status)
      ).length,
      completedLifecycleActions: lifecycleActions.filter((a) => a.status === "completed")
        .length,
      totalRevenueActions: revenueActions.length,
      activeRevenueActions: revenueActions.filter(
        (a) => !["completed", "failed", "cancelled"].includes(a.status)
      ).length,
      averageActionConfidence: Math.round(avgConfidence * 100),
      funnelDiagnosticsByStage,
    };
  }

  /**
   * Get current state for persistence
   */
  getState(): FunnelAttributionState {
    return this.state;
  }

  /**
   * Load state from persistence
   */
  loadState(state: FunnelAttributionState): void {
    this.state = state;
  }
}
