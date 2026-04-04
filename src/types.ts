/**
 * Growth Revenue Department Types
 * VAL-DEPT-GR-001: Experiment workflow yields structured decisions rather than dashboard-only reporting
 * VAL-DEPT-GR-002: Funnel and attribution diagnostics support segment-aware lifecycle action
 */

// ============================================
// Experiment Workflow Types (VAL-DEPT-GR-001)
// ============================================

export type ExperimentStatus = 
  | "hypothesis"
  | "designed"
  | "approved"
  | "running"
  | "paused"
  | "completed"
  | "cancelled"
  | "archived";

export type ExperimentDecision = 
  | "implement"
  | "iterate"
  | "pause"
  | "stop"
  | "scale"
  | "revert";

export type ExperimentPriority = "critical" | "high" | "medium" | "low";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface ExperimentHypothesis {
  id: string;
  hypothesis: string; // e.g., "Changing the CTA button color from blue to green will increase conversions by 15%"
  assumption: string; // Core assumption being tested
  targetMetric: string; // Primary success metric
  targetChange: number; // Expected change (e.g., 0.15 for 15% improvement)
  controlDescription: string; // Description of control group
  treatmentDescription: string; // Description of treatment group
  confidenceLevel: ConfidenceLevel;
  riskLevel: "high" | "medium" | "low";
}

export interface ExperimentDesign {
  id: string;
  experimentId: string;
  hypothesis: ExperimentHypothesis;
  
  // Segmentation
  targetSegment: string;
  segmentCriteria: Record<string, string[]>;
  
  // Traffic allocation
  trafficAllocation: number; // percentage going to experiment
  minimumSampleSize: number;
  
  // Duration
  expectedDurationDays: number;
  minimumDurationDays: number;
  
  // Guardrails
  guardrailMetrics: {
    metric: string;
    acceptableRange: [number, number]; // [min, max] as percentage change
  }[];
  
  // Technical implementation
  implementationNotes: string;
  requiredChanges: string[];
  
  createdAt: string;
  updatedAt: string;
}

export interface ExperimentReadout {
  id: string;
  experimentId: string;
  status: "preliminary" | "final";
  
  // Results
  sampleSize: {
    control: number;
    treatment: number;
    total: number;
  };
  
  results: {
    metric: string;
    controlValue: number;
    treatmentValue: number;
    absoluteChange: number;
    percentChange: number;
    statisticalSignificance: number; // p-value
    confidenceInterval: [number, number];
    isSignificant: boolean;
    isPositive: boolean;
  }[];
  
  guardrailAssessment: {
    metric: string;
    passed: boolean;
    actualChange: number;
    acceptableRange: [number, number];
  }[];
  
  // Decision
  recommendation: ExperimentDecision;
  recommendationRationale: string;
  decisionMakerRoleKey: string;
  decidedAt: string;
  decisionNotes: string;
  
  // Learnings
  keyLearnings: string[];
  playbookInsights: string[];
  followUpExperiments: string[];
  
  createdAt: string;
}

export interface ExperimentPlaybook {
  id: string;
  playbookKey: string; // e.g., "cta-color-conversion-boost"
  title: string;
  description: string;
  
  // Pattern classification
  patternType: "conversion" | "engagement" | "retention" | "acquisition" | "revenue" | "cost-efficiency";
  confidence: ConfidenceLevel;
  successRate: number; // percentage of experiments that succeeded
  
  // Evidence
  sourceExperimentIds: string[];
  supportingMetrics: {
    metric: string;
    averageLift: number;
    sampleSize: number;
  }[];
  
  // Applicability
  recommendedFor: {
    segments: string[];
    channels: string[];
    productAreas: string[];
  };
  
  // Playbook content
  steps: {
    order: number;
    action: string;
    rationale: string;
    expectedOutcome: string;
  }[];
  
  // Status
  status: "draft" | "validated" | "archived";
  validatedCount: number;
  lastValidatedAt: string;
  createdAt: string;
}

export interface GrowthExperiment {
  id: string;
  experimentKey: string; // e.g., "gr-2024-q1-cta-color-test"
  title: string;
  description: string;
  
  // Status
  status: ExperimentStatus;
  
  // Design
  design?: ExperimentDesign;
  
  // Execution
  linkedCampaignIds: string[];
  linkedFunnelDiagnostics: string[];
  ownerRoleKey: string;
  teamMembers: string[];
  
  // Timeline
  createdAt: string;
  approvedAt?: string;
  startedAt?: string;
  pausedAt?: string;
  completedAt?: string;
  
  // Results
  readout?: ExperimentReadout;
  
  // Playbook linkage
  createdPlaybookIds: string[];
  contributedToPlaybookIds: string[];
  
  // Tags
  tags: string[];
  
  updatedAt: string;
}

// ============================================
// Funnel & Attribution Types (VAL-DEPT-GR-002)
// ============================================

export type FunnelStage = 
  | "awareness"
  | "interest"
  | "consideration"
  | "intent"
  | "purchase"
  | "retention"
  | "advocacy";

export type AttributionModel = 
  | "first-touch"
  | "last-touch"
  | "linear"
  | "time-decay"
  | "position-based"
  | "data-driven";

export type DiagnosticConfidence = "high" | "medium" | "low";

export interface FunnelStageMetrics {
  stage: FunnelStage;
  
  // Volume
  enteringCount: number;
  exitingCount: number;
  conversionRate: number; // percentage that progressed
  
  // Drop-off analysis
  dropoffRate: number;
  dropoffCount: number;
  
  // Segment breakdown
  segmentBreakdown: {
    segment: string;
    enteringCount: number;
    conversionRate: number;
    averageTimeInStage: number;
  }[];
  
  // Time metrics
  averageTimeInStage: number; // days
  medianTimeInStage: number;
  
  // Benchmark comparison
  benchmarkConversionRate?: number;
  benchmarkComparison: "above" | "at" | "below";
  
  // Diagnostics
  anomalyDetected: boolean;
  anomalyDescription?: string;
}

export interface FunnelDiagnostic {
  id: string;
  diagnosticKey: string;
  
  // Funnel context
  funnelName: string;
  funnelDescription: string;
  analyzedStages: FunnelStage[];
  
  // Stage analysis
  stages: FunnelStageMetrics[];
  
  // Overall assessment
  overallConversionRate: number;
  overallDropoffRate: number;
  weakestStage: {
    stage: FunnelStage;
    conversionRate: number;
    severity: "critical" | "high" | "medium" | "low";
  };
  strongestStage: {
    stage: FunnelStage;
    conversionRate: number;
  };
  
  // Segment analysis
  segmentAnalysis: {
    segment: string;
    overallConversionRate: number;
    topOfFunnelVolume: number;
    notablePatterns: string[];
  }[];
  
  // Attribution analysis
  attributionModel: AttributionModel;
  attributionConfidence: ConfidenceLevel;
  topAttributionChannels: {
    channel: string;
    attributedConversions: number;
    contributionPercentage: number;
  }[];
  
  // Recommendations
  recommendations: {
    priority: "critical" | "high" | "medium" | "low";
    stage: FunnelStage;
    action: string;
    expectedImpact: string;
    effortLevel: "high" | "medium" | "low";
  }[];
  
  // Confidence
  diagnosticConfidence: DiagnosticConfidence;
  confidenceRationale: string;
  
  // Links
  linkedExperimentIds: string[];
  triggeredLifecycleActionIds: string[];
  
  createdAt: string;
  updatedAt: string;
}

export interface AttributionDiagnostic {
  id: string;
  diagnosticKey: string;
  
  // Model being analyzed
  attributionModel: AttributionModel;
  
  // Quality assessment
  confidence: ConfidenceLevel;
  confidenceFactors: {
    factor: string;
    assessment: "positive" | "neutral" | "negative";
    score: number; // 0-100
  }[];
  
  // Channel contribution
  channelAttribution: {
    channel: string;
    attributedRevenue: number;
    attributedConversions: number;
    contributionPercentage: number;
    touchpointsToConversion: number;
  }[];
  
  // Path analysis
  commonPaths: {
    path: string; // e.g., "Google -> Email -> Direct"
    frequency: number;
    conversionRate: number;
    averageValue: number;
  }[];
  
  // Issues
  issues: {
    type: "data-gap" | "model-limitation" | "cross-channel-conflict" | "multi-touch-bias";
    description: string;
    impactAssessment: string;
    suggestedModel?: AttributionModel;
  }[];
  
  // Recommendations
  recommendations: {
    action: string;
    rationale: string;
    expectedImprovement: string;
  }[];
  
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Lifecycle & Revenue Action Types (VAL-DEPT-GR-002)
// ============================================

export type LifecycleTriggerType =
  | "segment-entry"
  | "segment-exit"
  | "behavioral"
  | "engagement-threshold"
  | "dormancy"
  | "re-engagement"
  | "funnel-stage-change"
  | "attribution-change";

export type RevenueActionType =
  | "upsell"
  | "cross-sell"
  | "retention-offer"
  | "win-back"
  | "price-optimization"
  | "billing-change";

export type ActionConfidence = "high" | "medium" | "low";
export type ActionPriority = "critical" | "high" | "medium" | "low";
export type ActionStatus = "proposed" | "approved" | "executed" | "completed" | "failed" | "cancelled";

export interface LifecycleTrigger {
  id: string;
  triggerKey: string;
  
  // Trigger definition
  type: LifecycleTriggerType;
  name: string;
  description: string;
  
  // Conditions
  segmentCriteria?: {
    segment: string;
    operator: "equals" | "not-equals" | "contains" | "greater-than" | "less-than";
    value: string | number;
  }[];
  
  behavioralConditions?: {
    metric: string;
    threshold: number;
    comparison: "above" | "below" | "equals";
    windowDays?: number;
  }[];
  
  // Configuration
  enabled: boolean;
  evaluationFrequency: "realtime" | "daily" | "weekly";
  
  // Action mapping
  suggestedActionType: LifecycleTriggerType | RevenueActionType;
  confidenceLevel: ActionConfidence;
  
  createdAt: string;
  updatedAt: string;
}

export interface LifecycleAction {
  id: string;
  actionKey: string;
  
  // Action definition
  type: LifecycleTriggerType | RevenueActionType;
  name: string;
  description: string;
  
  // Source
  sourceDiagnosticId?: string;
  sourceExperimentId?: string;
  sourceTriggerId?: string;
  
  // Target
  targetSegment: string;
  targetEntityIds: string[]; // customer/user IDs
  
  // Confidence and priority
  confidence: ActionConfidence;
  confidenceRationale: string;
  priority: ActionPriority;
  
  // Expected outcomes
  expectedOutcome: {
    metric: string;
    targetChange: number;
    confidence: ActionConfidence;
  }[];
  
  // Execution
  status: ActionStatus;
  ownerRoleKey?: string;
  assignedToTeam?: string;
  
  // Timeline
  proposedAt: string;
  approvedAt?: string;
  executedAt?: string;
  completedAt?: string;
  
  // Results
  actualResults?: {
    metric: string;
    actualChange: number;
    success: boolean;
  }[];
  
  // Evidence
  evidenceIds: string[];
  
  // Notes
  notes: string[];
}

export interface RevenueAction {
  id: string;
  actionKey: string;
  
  // Action definition
  type: RevenueActionType;
  name: string;
  description: string;
  
  // Segment context
  segment: string;
  segmentSize: number;
  segmentCriteria: Record<string, string[]>;
  
  // Financial impact
  estimatedImpact?: {
    revenue: number;
    marginImpact: number;
    customerCount: number;
  };
  
  // Confidence
  confidence: ActionConfidence;
  confidenceRationale: string;
  priority: ActionPriority;
  
  // Execution
  status: ActionStatus;
  ownerRoleKey?: string;
  
  // Timeline
  proposedAt: string;
  approvedAt?: string;
  executedAt?: string;
  
  // Results
  actualResults?: {
    metric: string;
    actualChange: number;
    actualValue: number;
    success: boolean;
  }[];
  
  createdAt: string;
}

// ============================================
// Workflow State Types
// ============================================

export interface ExperimentWorkflowState {
  experiments: Record<string, GrowthExperiment>;
  playbooks: Record<string, ExperimentPlaybook>;
  lastUpdated: string;
}

export interface FunnelAttributionState {
  diagnostics: Record<string, FunnelDiagnostic>;
  attributionDiagnostics: Record<string, AttributionDiagnostic>;
  triggers: Record<string, LifecycleTrigger>;
  lifecycleActions: Record<string, LifecycleAction>;
  revenueActions: Record<string, RevenueAction>;
  lastUpdated: string;
}

// ============================================
// Action Parameters - Experiment Workflow
// ============================================

export interface CreateExperimentParams {
  experimentKey: string;
  title: string;
  description: string;
  ownerRoleKey: string;
  tags?: string[];
}

export interface DesignExperimentParams {
  experimentId: string;
  hypothesis: Omit<ExperimentHypothesis, "id">;
  targetSegment: string;
  segmentCriteria: Record<string, string[]>;
  trafficAllocation: number;
  minimumSampleSize: number;
  expectedDurationDays: number;
  minimumDurationDays: number;
  guardrailMetrics?: ExperimentDesign["guardrailMetrics"];
  implementationNotes?: string;
  requiredChanges?: string[];
}

export interface SubmitExperimentParams {
  experimentId: string;
  submitterRoleKey: string;
}

export interface ApproveExperimentParams {
  experimentId: string;
  approverRoleKey: string;
  conditions?: string[];
}

export interface StartExperimentParams {
  experimentId: string;
  startedByRoleKey: string;
}

export interface RecordExperimentResultsParams {
  experimentId: string;
  sampleSize: ExperimentReadout["sampleSize"];
  results: Omit<ExperimentReadout["results"][0], "confidenceInterval" | "isSignificant">[];
}

export interface CreateReadoutParams {
  experimentId: string;
  status: ExperimentReadout["status"];
  recommendation: ExperimentDecision;
  recommendationRationale: string;
  decisionMakerRoleKey: string;
  decisionNotes: string;
  keyLearnings?: string[];
  playbookInsights?: string[];
  followUpExperiments?: string[];
}

export interface CreatePlaybookParams {
  playbookKey: string;
  title: string;
  description: string;
  patternType: ExperimentPlaybook["patternType"];
  sourceExperimentIds: string[];
  recommendedFor: ExperimentPlaybook["recommendedFor"];
  steps: Omit<ExperimentPlaybook["steps"][0], "order">[];
}

// ============================================
// Action Parameters - Funnel & Attribution
// ============================================

export interface CreateFunnelDiagnosticParams {
  diagnosticKey: string;
  funnelName: string;
  funnelDescription: string;
  analyzedStages: FunnelStage[];
  stages: Omit<FunnelStageMetrics, "benchmarkComparison" | "anomalyDetected">[];
  segmentAnalysis?: FunnelDiagnostic["segmentAnalysis"];
  attributionModel: AttributionModel;
  linkedExperimentIds?: string[];
}

export interface CreateAttributionDiagnosticParams {
  diagnosticKey: string;
  attributionModel: AttributionModel;
  channelAttribution: AttributionDiagnostic["channelAttribution"];
  commonPaths?: AttributionDiagnostic["commonPaths"];
  issues?: AttributionDiagnostic["issues"];
}

export interface TriggerLifecycleActionParams {
  triggerId: string;
  targetSegment: string;
  targetEntityIds: string[];
  confidence: ActionConfidence;
  confidenceRationale: string;
  priority: ActionPriority;
  expectedOutcome?: LifecycleAction["expectedOutcome"];
  sourceDiagnosticId?: string;
  sourceExperimentId?: string;
}

export interface ProposeRevenueActionParams {
  actionKey: string;
  type: RevenueActionType;
  name: string;
  description: string;
  segment: string;
  segmentSize: number;
  segmentCriteria: Record<string, string[]>;
  estimatedImpact?: RevenueAction["estimatedImpact"];
  confidence: ActionConfidence;
  confidenceRationale: string;
  priority: ActionPriority;
}

export interface UpdateActionStatusParams {
  actionId: string;
  status: ActionStatus;
  notes?: string[];
  actualResults?: LifecycleAction["actualResults"] | RevenueAction["actualResults"];
  executedAt?: string;
  completedAt?: string;
}

// ============================================
// Summary Types
// ============================================

export interface ExperimentSummary {
  totalExperiments: number;
  byStatus: Record<ExperimentStatus, number>;
  activeExperiments: number;
  completedWithDecision: number;
  playbooksCreated: number;
  validatedPlaybooks: number;
  averageDecisionTimeDays: number;
}

export interface FunnelAttributionSummary {
  totalDiagnostics: number;
  totalLifecycleActions: number;
  activeLifecycleActions: number;
  completedLifecycleActions: number;
  totalRevenueActions: number;
  activeRevenueActions: number;
  averageActionConfidence: number;
  funnelDiagnosticsByStage: Record<FunnelStage, number>;
}
