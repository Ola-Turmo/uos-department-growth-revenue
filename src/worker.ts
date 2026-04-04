import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";
import { ExperimentWorkflowService } from "./experiment-workflow-service.js";
import { FunnelAttributionService } from "./funnel-attribution-service.js";
import type {
  CreateExperimentParams,
  DesignExperimentParams,
  SubmitExperimentParams,
  ApproveExperimentParams,
  StartExperimentParams,
  RecordExperimentResultsParams,
  CreateReadoutParams,
  CreatePlaybookParams,
  CreateFunnelDiagnosticParams,
  CreateAttributionDiagnosticParams,
  TriggerLifecycleActionParams,
  ProposeRevenueActionParams,
  UpdateActionStatusParams,
  RevenueActionType,
} from "./types.js";

// Initialize services
const experimentService = new ExperimentWorkflowService();
const funnelAttributionService = new FunnelAttributionService();

const plugin = definePlugin({
  async setup(ctx) {
    ctx.events.on("issue.created", async (event) => {
      const issueId = event.entityId ?? "unknown";
      await ctx.state.set({ scopeKind: "issue", scopeId: issueId, stateKey: "seen" }, true);
      ctx.logger.info("Observed issue.created", { issueId });
    });

    ctx.data.register("health", async () => {
      return { status: "ok", checkedAt: new Date().toISOString() };
    });

    // ============================================
    // Experiment Workflow Actions (VAL-DEPT-GR-001)
    // ============================================

    ctx.actions.register("experiment.create", async (params: Record<string, unknown>) => {
      const p = params as unknown as CreateExperimentParams;
      ctx.logger.info("Creating experiment", { experimentKey: p.experimentKey });
      const experiment = experimentService.createExperiment(p);
      return { experiment, success: true };
    });

    ctx.actions.register("experiment.get", async (params: Record<string, unknown>) => {
      const p = params as { experimentId: string };
      const experiment = experimentService.getExperiment(p.experimentId);
      return { experiment: experiment ?? null, success: !!experiment };
    });

    ctx.actions.register("experiment.getAll", async () => {
      const experiments = experimentService.getAllExperiments();
      return { experiments, count: experiments.length };
    });

    ctx.actions.register("experiment.getActive", async () => {
      const experiments = experimentService.getActiveExperiments();
      return { experiments, count: experiments.length };
    });

    ctx.actions.register("experiment.design", async (params: Record<string, unknown>) => {
      const p = params as unknown as DesignExperimentParams;
      ctx.logger.info("Designing experiment", { experimentId: p.experimentId });
      const experiment = experimentService.designExperiment(p);
      return { experiment, success: !!experiment };
    });

    ctx.actions.register("experiment.submitForApproval", async (params: Record<string, unknown>) => {
      const p = params as unknown as SubmitExperimentParams;
      ctx.logger.info("Submitting experiment for approval", { experimentId: p.experimentId });
      const experiment = experimentService.submitForApproval(p);
      return { experiment, success: !!experiment };
    });

    ctx.actions.register("experiment.approve", async (params: Record<string, unknown>) => {
      const p = params as unknown as ApproveExperimentParams;
      ctx.logger.info("Approving experiment", { experimentId: p.experimentId });
      const experiment = experimentService.approveExperiment(p);
      return { experiment, success: !!experiment };
    });

    ctx.actions.register("experiment.start", async (params: Record<string, unknown>) => {
      const p = params as unknown as StartExperimentParams;
      ctx.logger.info("Starting experiment", { experimentId: p.experimentId });
      const experiment = experimentService.startExperiment(p);
      return { experiment, success: !!experiment };
    });

    ctx.actions.register("experiment.pause", async (params: Record<string, unknown>) => {
      const p = params as { experimentId: string };
      ctx.logger.info("Pausing experiment", { experimentId: p.experimentId });
      const experiment = experimentService.pauseExperiment(p.experimentId);
      return { experiment, success: !!experiment };
    });

    ctx.actions.register("experiment.resume", async (params: Record<string, unknown>) => {
      const p = params as { experimentId: string };
      ctx.logger.info("Resuming experiment", { experimentId: p.experimentId });
      const experiment = experimentService.resumeExperiment(p.experimentId);
      return { experiment, success: !!experiment };
    });

    ctx.actions.register("experiment.cancel", async (params: Record<string, unknown>) => {
      const p = params as { experimentId: string; reason: string };
      ctx.logger.info("Cancelling experiment", { experimentId: p.experimentId });
      const experiment = experimentService.cancelExperiment(p.experimentId, p.reason);
      return { experiment, success: !!experiment };
    });

    ctx.actions.register("experiment.recordResults", async (params: Record<string, unknown>) => {
      const p = params as unknown as RecordExperimentResultsParams;
      ctx.logger.info("Recording experiment results", { experimentId: p.experimentId });
      const experiment = experimentService.recordResults(p);
      return { experiment, success: !!experiment };
    });

    ctx.actions.register("experiment.createReadout", async (params: Record<string, unknown>) => {
      const p = params as unknown as CreateReadoutParams;
      ctx.logger.info("Creating experiment readout", { experimentId: p.experimentId, recommendation: p.recommendation });
      const experiment = experimentService.createReadout(p);
      return { experiment, success: !!experiment };
    });

    ctx.actions.register("experiment.getReadout", async (params: Record<string, unknown>) => {
      const p = params as { experimentId: string };
      const readout = experimentService.getReadout(p.experimentId);
      return { readout: readout ?? null, success: !!readout };
    });

    // Playbook Actions (VAL-DEPT-GR-001)
    ctx.actions.register("experiment.createPlaybook", async (params: Record<string, unknown>) => {
      const p = params as unknown as CreatePlaybookParams;
      ctx.logger.info("Creating playbook", { playbookKey: p.playbookKey });
      const playbook = experimentService.createPlaybook(p);
      return { playbook, success: !!playbook };
    });

    ctx.actions.register("experiment.getPlaybook", async (params: Record<string, unknown>) => {
      const p = params as { playbookId: string };
      const playbook = experimentService.getPlaybook(p.playbookId);
      return { playbook: playbook ?? null, success: !!playbook };
    });

    ctx.actions.register("experiment.getPlaybooks", async () => {
      const playbooks = experimentService.getAllPlaybooks();
      return { playbooks, count: playbooks.length };
    });

    ctx.actions.register("experiment.getValidatedPlaybooks", async (params?: Record<string, unknown>) => {
      const p = params as { segment?: string; channel?: string } | undefined;
      const playbooks = experimentService.getValidatedPlaybooks(p?.segment, p?.channel);
      return { playbooks, count: playbooks.length };
    });

    ctx.actions.register("experiment.validatePlaybook", async (params: Record<string, unknown>) => {
      const p = params as { playbookId: string };
      ctx.logger.info("Validating playbook", { playbookId: p.playbookId });
      const playbook = experimentService.validatePlaybook(p.playbookId);
      return { playbook, success: !!playbook };
    });

    ctx.actions.register("experiment.getSummary", async () => {
      const summary = experimentService.generateSummary();
      return { summary };
    });

    // ============================================
    // Funnel & Attribution Actions (VAL-DEPT-GR-002)
    // ============================================

    ctx.actions.register("funnel.createDiagnostic", async (params: Record<string, unknown>) => {
      const p = params as unknown as CreateFunnelDiagnosticParams;
      ctx.logger.info("Creating funnel diagnostic", { funnelName: p.funnelName });
      const diagnostic = funnelAttributionService.createFunnelDiagnostic(p);
      return { diagnostic, success: true };
    });

    ctx.actions.register("funnel.getDiagnostic", async (params: Record<string, unknown>) => {
      const p = params as { diagnosticId: string };
      const diagnostic = funnelAttributionService.getFunnelDiagnostic(p.diagnosticId);
      return { diagnostic: diagnostic ?? null, success: !!diagnostic };
    });

    ctx.actions.register("funnel.getDiagnostics", async () => {
      const diagnostics = funnelAttributionService.getAllFunnelDiagnostics();
      return { diagnostics, count: diagnostics.length };
    });

    ctx.actions.register("funnel.getRecentDiagnostics", async (params?: Record<string, unknown>) => {
      const p = params as { days?: number } | undefined;
      const diagnostics = funnelAttributionService.getRecentDiagnostics(p?.days);
      return { diagnostics, count: diagnostics.length };
    });

    // Attribution Actions (VAL-DEPT-GR-002)
    ctx.actions.register("attribution.createDiagnostic", async (params: Record<string, unknown>) => {
      const p = params as unknown as CreateAttributionDiagnosticParams;
      ctx.logger.info("Creating attribution diagnostic", { attributionModel: p.attributionModel });
      const diagnostic = funnelAttributionService.createAttributionDiagnostic(p);
      return { diagnostic, success: true };
    });

    ctx.actions.register("attribution.getDiagnostic", async (params: Record<string, unknown>) => {
      const p = params as { diagnosticId: string };
      const diagnostic = funnelAttributionService.getAttributionDiagnostic(p.diagnosticId);
      return { diagnostic: diagnostic ?? null, success: !!diagnostic };
    });

    ctx.actions.register("attribution.getDiagnostics", async () => {
      const diagnostics = funnelAttributionService.getAllAttributionDiagnostics();
      return { diagnostics, count: diagnostics.length };
    });

    // Lifecycle Action Triggers (VAL-DEPT-GR-002)
    ctx.actions.register("lifecycle.triggerAction", async (params: Record<string, unknown>) => {
      const p = params as unknown as TriggerLifecycleActionParams;
      ctx.logger.info("Triggering lifecycle action", { 
        triggerId: p.triggerId, 
        segment: p.targetSegment,
        priority: p.priority 
      });
      const action = funnelAttributionService.triggerLifecycleAction(p);
      return { action, success: true };
    });

    ctx.actions.register("lifecycle.getAction", async (params: Record<string, unknown>) => {
      const p = params as { actionId: string };
      const action = funnelAttributionService.getLifecycleAction(p.actionId);
      return { action: action ?? null, success: !!action };
    });

    ctx.actions.register("lifecycle.getActiveActions", async () => {
      const actions = funnelAttributionService.getActiveLifecycleActions();
      return { actions, count: actions.length };
    });

    ctx.actions.register("lifecycle.updateActionStatus", async (params: Record<string, unknown>) => {
      const p = params as unknown as UpdateActionStatusParams;
      ctx.logger.info("Updating lifecycle action status", { actionId: p.actionId, status: p.status });
      const action = funnelAttributionService.updateLifecycleActionStatus(p);
      return { action, success: !!action };
    });

    // Revenue Actions (VAL-DEPT-GR-002)
    ctx.actions.register("revenue.proposeAction", async (params: Record<string, unknown>) => {
      const p = params as unknown as ProposeRevenueActionParams;
      ctx.logger.info("Proposing revenue action", { actionKey: p.actionKey, type: p.type });
      const action = funnelAttributionService.proposeRevenueAction(p);
      return { action, success: true };
    });

    ctx.actions.register("revenue.getAction", async (params: Record<string, unknown>) => {
      const p = params as { actionId: string };
      const action = funnelAttributionService.getRevenueAction(p.actionId);
      return { action: action ?? null, success: !!action };
    });

    ctx.actions.register("revenue.getActiveActions", async () => {
      const actions = funnelAttributionService.getActiveRevenueActions();
      return { actions, count: actions.length };
    });

    ctx.actions.register("revenue.updateActionStatus", async (params: Record<string, unknown>) => {
      const p = params as unknown as UpdateActionStatusParams;
      ctx.logger.info("Updating revenue action status", { actionId: p.actionId, status: p.status });
      const action = funnelAttributionService.updateRevenueActionStatus(p);
      return { action, success: !!action };
    });

    // Summary action
    ctx.actions.register("ping", async () => {
      ctx.logger.info("Ping action invoked");
      return { pong: true, at: new Date().toISOString() };
    });

    ctx.actions.register("experimentWorkflow.summary", async () => {
      return { summary: experimentService.generateSummary() };
    });

    ctx.actions.register("funnelAttribution.summary", async () => {
      return { summary: funnelAttributionService.generateSummary() };
    });
  },

  async onHealth() {
    return { status: "ok", message: "Plugin worker is running" };
  }
});

export default plugin;
runWorker(plugin, import.meta.url);
