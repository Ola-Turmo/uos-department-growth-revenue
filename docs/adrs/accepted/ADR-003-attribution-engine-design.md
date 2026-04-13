# ADR-003: Attribution Engine Design

**Status**: Accepted  
**Date**: 2026-04-13  
**Deciders**: Growth Revenue Department

## Context

Multi-touch attribution is core to the Growth Revenue Department's mission. We needed an attribution engine that supports multiple models, provides confidence scores, and explains attribution decisions.

## Decision

The `AttributionEngine` class supports the following attribution models:
- `first_touch`: Credits first touchpoint
- `last_touch`: Credits last touchpoint
- `linear`: Equal credit across all touchpoints
- `time_decay`: More credit to recent touchpoints
- `u_shaped`: 40% first, 20% middle, 40% last
- `position_based`: Configurable first/last weights
- `data_driven`: Placeholder for ML-based attribution

### Key Design Decisions

1. **Model-agnostic interface**: All models return `AttributionResult` with same shape
2. **Configurable lookback window**: Filters touchpoints by recency
3. **Confidence scoring**: Each result includes confidence estimate
4. **Explanations**: Each channel attribution includes human-readable explanation

## Consequences

### Positive
- Consistent interface enables model comparison
- Extensible for new attribution models
- Built-in confidence prevents overconfidence

### Negative
- Data-driven model is currently a placeholder
- No support for cross-device tracking

## Alternatives Considered

1. **Single-model approach**: Would not enable model comparison
2. **External attribution tool**: Adds external dependency
