# @uos/department-growth-revenue

@uos/department-growth-revenue turns acquisition, lifecycle, pipeline, monetization, and performance experimentation into a measurable operating overlay. It should help the team find durable growth drivers instead of noisy wins.

Built as part of the UOS split workspace on top of [Paperclip](https://github.com/paperclipai/paperclip), which remains the upstream control-plane substrate.

## What This Repo Owns

- Experiment planning and performance synthesis.
- Segmentation, lifecycle, and funnel intelligence workflows.
- Attribution quality checks and diagnostics.
- Growth/revenue playbooks and decision memory.
- Signal routing between top-of-funnel and monetization outcomes.

## Runtime Form

- Split repo with package code as the source of truth and a Paperclip plugin scaffold available for worker, manifest, UI, and validation surfaces when the repo needs runtime or operator-facing behavior.

## Phase 1+2 Features

### DoWhy Causal Attribution (`src/attribution/doWhy-attribution.ts`)
Formal causal inference for marketing channels using the DoWhy framework's backdoor criterion with linear regression estimation. Falls back to correlation analysis when Python runtime is unavailable.

### CausalNex Channel Discovery (`src/attribution/causalnex-discovery.ts`)
Discovers causal structure between channels using CausalNex NOTEARS structure learning. Input time-series channel spend + outcomes, output directed acyclic graph of causal relationships.

### Bayesian LTV Model (`src/revenue/bayesian-ltv.ts`)
Survival analysis with Beta-Binomial prior updating for customer lifetime value prediction. More principled than simple cohort arithmetic with explicit confidence intervals and churn probability.

### LLM Hypothesis Generator (`src/experiment/llm-hypothesis-generator.ts`)
MiniMax LLM-powered hypothesis generator that replaces static templates. Produces creative, data-driven experiment hypotheses from funnel gaps and channel performance data. Falls back to template-based generation on LLM failure.

### Causal Impact Analyzer (`src/attribution/causal-impact.ts`)
Interrupted time-series analysis for marketing attribution. Estimates true causal revenue effect of a channel by comparing counterfactual (predicted) vs actual outcomes with probability-of-causality scoring.

### Experiment Pipeline Orchestrator (`src/experiment/pipeline-orchestrator.ts`)
Multi-agent pipeline coordinating: Hypothesis → Design → Run → Monitor → Analyze → Report. Built on SupportOrchestrator patterns with event-driven architecture.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Growth Revenue Architecture                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │ Acquisition  │    │  Lifecycle   │    │   Monetization       │   │
│  │              │    │              │    │                      │   │
│  │ • Channels   │───▶│ • Lead Score │───▶│ • LTV Model         │   │
│  │ • Spend      │    │ • Churn Pred │    │ • Bayesian LTV      │   │
│  │ • ROI        │    │              │    │                      │   │
│  └──────┬───────┘    └──────┬───────┘    └──────────┬───────────┘   │
│         │                   │                       │               │
│         ▼                   ▼                       ▼               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │               Attribution Engine                             │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │    │
│  │  │ DoWhy       │  │ CausalNex   │  │ Causal Impact       │ │    │
│  │  │ Formal      │  │ Structure   │  │ Interrupted         │ │    │
│  │  │ Causal      │  │ Discovery   │  │ Time-Series         │ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              Experiment Pipeline Orchestrator                │    │
│  │                                                             │    │
│  │  Hypothesis → Design → Run → Monitor → Analyze → Report    │    │
│  │                                                             │    │
│  │  ┌──────────────────┐   ┌──────────────────────────────┐   │    │
│  │  │ LLM Hypothesis   │   │ Experiment Designer           │   │    │
│  │  │ Generator         │   │ Sample Size Calculator        │   │    │
│  │  └──────────────────┘   └──────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   Playbook Layer                            │    │
│  │            (Reusable growth decision memory)                │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Highest-Value Workflows

- Designing and prioritizing growth experiments.
- Analyzing funnel drop-offs and segment-specific opportunities.
- Auditing attribution logic and confidence.
- Triggering lifecycle actions based on meaningful signals.
- Converting performance findings into reusable playbooks.

## Key Connections and Operating Surfaces

- CRM and revops systems such as HubSpot or Salesforce, marketing automation, ad platforms, web/product analytics, billing systems such as Stripe, attribution tools, experimentation tools, and pipeline systems needed to run commercial workflows to completion.
- Email systems, landing-page builders, CMS/content systems, spreadsheets, docs, dashboards, call-recording or sales-engagement tools, and browser-admin flows when campaign execution or analysis spans multiple tools.
- Revenue operations surfaces for segmentation, lifecycle actions, forecasting, lead routing, deal hygiene, and customer expansion whenever growth work touches actual revenue mechanics.
- Any adjacent system required to connect acquisition, lifecycle, pipeline, monetization, attribution, and learning into one measurable operating loop.

## KPI Targets

- 100% of launched experiments receive a structured win/loss readout with an explicit decision.
- Funnel diagnosis turnaround stays <= 2 business days for benchmark growth questions.
- Lifecycle trigger accuracy reaches >= 85% on maintained benchmark segments.
- Attribution confidence is labeled on 100% of major growth and revenue reports.

## Implementation Backlog

### Now
- Standardize experiment design, attribution review, and lifecycle trigger definitions.
- Build the first wave of funnel and segment diagnostics tied to real business decisions.
- Make growth findings portable by capturing them as reusable playbooks and not just campaign notes.

### Next
- Improve confidence labeling and causal reasoning in performance reporting.
- Integrate CRM, billing, and analytics surfaces more tightly for end-to-end revenue visibility.
- Reduce experiment noise by enforcing stronger stop/go rules and post-test discipline.

### Later
- Support semi-autonomous campaign and lifecycle execution bounded by explicit business rules.
- Expand from channel and funnel optimization into full revenue-system orchestration.

## Local Plugin Use

```bash
curl -X POST http://127.0.0.1:3100/api/plugins/install \
  -H "Content-Type: application/json" \
  -d '{"packageName":"<absolute-path-to-this-repo>","isLocalPath":true}'
```

## Validation

```bash
npm install
npm run check
npm run plugin:typecheck
npm run plugin:test
```
