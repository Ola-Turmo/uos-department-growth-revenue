# Research Note: Attribution Confidence Gaps

**Date**: 2026-04-13  
**Confidence Level**: Medium  
**Status**: In Progress  

## Problem Statement

Attribution models often show high confidence scores even when the underlying data is sparse or noisy. This can lead to overconfident decisions.

## Initial Findings

1. **Single-touch models** (first_touch, last_touch) show artificially high confidence when:
   - User journey has few touchpoints
   - Conversion happens quickly after a single channel interaction

2. **Multi-touch models** provide more balanced confidence but:
   - Still struggle with sparse data
   - May underweight channels with few interactions

## Research Questions

1. How should we adjust confidence when touchpoint count is low?
2. Should we have minimum touchpoint thresholds for attribution?
3. How do we communicate uncertainty to non-technical stakeholders?

## Next Steps

- [ ] Define confidence adjustment formula based on touchpoint count
- [ ] Add minimum touchpoint thresholds
- [ ] Create uncertainty visualization for reports

## Related ADRs

- ADR-003: Attribution Engine Design
- ADR-004: Real-Time Attribution (proposed)
