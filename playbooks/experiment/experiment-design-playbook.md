# Experiment Design Playbook

## Purpose
Guide experiment design from hypothesis to launch

## Trigger Conditions
- New growth opportunity identified
- Funnel bottleneck detected
- Attribution reveals channel opportunity

## Prerequisites
- [ ] Attribution analysis completed
- [ ] Funnel diagnosis available
- [ ] Historical experiment data reviewed

## Step-by-Step Procedure

### 1. Hypothesis Formation
1. Review attribution data for top-performing channels
2. Identify funnel gaps vs. industry benchmarks
3. Generate 3-5 testable hypotheses using LLM Gateway
4. Score hypotheses by confidence and expected impact

### 2. Experiment Design
1. Define primary metric (e.g., conversion rate)
2. Define secondary metrics (e.g., revenue per user)
3. Calculate required sample size
4. Determine experiment duration
5. Define success criteria (statistical significance threshold)

### 3. Pre-Launch Checklist
- [ ] Sample size calculated and documented
- [ ] Success criteria defined (p < 0.05, minimum effect size)
- [ ] Variant descriptions finalized
- [ ] Randomization strategy confirmed
- [ ] Tracking implemented and verified

### 4. Launch & Monitoring
1. Launch experiment with proper documentation
2. Monitor daily for sufficient traffic allocation
3. Check for sample ratio mismatch (SRM)
4. Avoid early stopping unless safety trigger hit

### 5. Analysis & Decision
1. Wait for required sample size reached
2. Calculate statistical significance
3. Assess practical significance (revenue impact)
4. Make decision: ship, iterate, or kill
5. Document learnings and update playbook catalog

## Success Criteria
- Experiment has pre-defined success criteria
- Sample size reached before concluding
- Decision made within 2 weeks of conclusion
- Learnings captured in playbook catalog

## Escalation Points
- Sample ratio mismatch detected → Pause and investigate
- External factors affecting results → Document and extend
- Positive results but low confidence → Re-run or deprioritize
