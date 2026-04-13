// src/experiment/pipeline-orchestrator.ts
/**
 * Multi-agent experiment pipeline orchestrator.
 * Coordinates: Hypothesis → Design → Run → Monitor → Analyze → Report
 * Built on SupportOrchestrator patterns from Customer Service.
 */

import type { ExperimentHypothesis } from "../types/types.js";
import { LLMHypothesisGenerator } from "./llm-hypothesis-generator.js";
import type { SampleSizeResult } from "./sample-size-calculator.js";

export type ExperimentStage = 
  | "hypothesis" | "design" | "running" | "monitoring" 
  | "analyzing" | "reporting" | "complete" | "failed";

export interface Experiment {
  id: string;
  name: string;
  hypothesis: ExperimentHypothesis;
  stage: ExperimentStage;
  variant: "A" | "B";
  metric: string;
  targetSampleSize?: number;
  currentSampleSize?: number;
  results?: ExperimentResults;
  error?: string;
  createdAt: string;
  updatedAt: string;
  reportUrl?: string;
}

export interface ExperimentResults {
  variantA: { visits: number; conversions: number; conversionRate: number };
  variantB: { visits: number; conversions: number; conversionRate: number };
  statisticalSignificance: number;  // 0-1
  pValue?: number;
  effectSize: number;  // relative lift
  recommendation: "deploy_B" | "keep_A" | "inconclusive";
  confidence: "high" | "medium" | "low";
  causalAttribution?: Record<string, number>;
}

export interface PipelineEvent {
  experimentId: string;
  stage: ExperimentStage;
  timestamp: string;
  message: string;
}

// ── Stage Node Functions ──────────────────────────────────────────────────────

type StageNode = (exp: Experiment) => Promise<Partial<Experiment>>;

async function stageHypothesis(exp: Experiment): Promise<Partial<Experiment>> {
  try {
    const gen = new LLMHypothesisGenerator();
    const { funnelGaps, channelData, topChannels } = exp.hypothesis as any;
    const hypotheses = await gen.generate({ funnelGaps, channelData, topChannels });
    return {
      hypothesis: hypotheses[0] ?? exp.hypothesis,
      stage: "design" as ExperimentStage,
      updatedAt: new Date().toISOString(),
    };
  } catch (e) {
    return { error: `hypothesis: ${e}`, stage: "failed" as ExperimentStage };
  }
}

async function stageDesign(exp: Experiment): Promise<Partial<Experiment>> {
  // Placeholder: would call sample-size-calculator.ts
  return {
    stage: "running" as ExperimentStage,
    targetSampleSize: 1000,
    currentSampleSize: 0,
    updatedAt: new Date().toISOString(),
  };
}

function normalCDF(z: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const az = Math.abs(z), t = 1 / (1 + p * az);
  return z > 0 ? 1 - (0.5 * Math.exp(-az * az / 2) * (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1)) : 0.5 * Math.exp(-az * az / 2) * (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1);
}

async function stageAnalyze(exp: Experiment): Promise<Partial<Experiment>> {
  if (!exp.results) return { stage: "failed" as ExperimentStage, error: "no results to analyze" };
  const r = exp.results;
  const z = r.effectSize / Math.sqrt(1 / r.variantA.visits + 1 / r.variantB.visits);
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));
  const sig = 1 - pValue;
  const rec: ExperimentResults["recommendation"] =
    sig > 0.95 && r.effectSize > 0 ? "deploy_B" :
    sig > 0.95 && r.effectSize < 0 ? "keep_A" : "inconclusive";
  return {
    results: { ...r, pValue, statisticalSignificance: sig, recommendation: rec, confidence: sig > 0.95 ? "high" : sig > 0.8 ? "medium" : "low" },
    stage: "reporting" as ExperimentStage,
    updatedAt: new Date().toISOString(),
  };
}

async function stageReport(exp: Experiment): Promise<Partial<Experiment>> {
  return {
    stage: "complete" as ExperimentStage,
    reportUrl: `/experiments/${exp.id}/report`,
    updatedAt: new Date().toISOString(),
  };
}

// ── Pipeline Orchestrator ─────────────────────────────────────────────────────

export class ExperimentPipelineOrchestrator {
  private experiments: Map<string, Experiment> = new Map();
  private listeners: Array<(event: PipelineEvent) => void> = [];

  /**
   * Start a new experiment pipeline.
   * Returns immediately — runs async.
   */
  async startExperiment(params: {
    name: string;
    hypothesis: ExperimentHypothesis;
    metric: string;
  }): Promise<string> {
    const id = `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const exp: Experiment = {
      id,
      name: params.name,
      hypothesis: params.hypothesis,
      stage: "hypothesis",
      variant: "A",
      metric: params.metric,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.experiments.set(id, exp);
    this.emit({ experimentId: id, stage: "hypothesis", timestamp: new Date().toISOString(), message: "Pipeline started" });
    
    // Run pipeline asynchronously
    this.runPipeline(id);
    return id;
  }

  private async runPipeline(expId: string): Promise<void> {
    const stageOrder: ExperimentStage[] = ["hypothesis", "design", "running", "analyzing", "reporting"];
    const stageNodes: Record<ExperimentStage, StageNode> = {
      hypothesis: stageHypothesis,
      design: stageDesign,
      running: async (e) => { /* Simulated — would watch real experiment */ return { stage: "analyzing" as ExperimentStage, currentSampleSize: e.targetSampleSize }; },
      analyzing: stageAnalyze,
      reporting: stageReport,
      monitoring: async () => ({}),
      complete: async () => ({}),
      failed: async () => ({}),
    };

    let exp = this.experiments.get(expId)!;
    while (stageOrder.includes(exp.stage)) {
      const node = stageNodes[exp.stage];
      if (!node) break;
      const partial = await node(exp);
      exp = { ...exp, ...partial };
      this.experiments.set(expId, exp);
      this.emit({ experimentId: expId, stage: exp.stage, timestamp: new Date().toISOString(), message: `Stage: ${exp.stage}` });
      if (exp.stage === "failed" || exp.stage === "complete") break;
    }
  }

  getExperiment(id: string): Experiment | undefined {
    return this.experiments.get(id);
  }

  getAllExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  getExperimentsByStage(stage: ExperimentStage): Experiment[] {
    return this.getAllExperiments().filter(e => e.stage === stage);
  }

  onEvent(fn: (event: PipelineEvent) => void): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private emit(event: PipelineEvent): void {
    for (const l of this.listeners) l(event);
  }
}