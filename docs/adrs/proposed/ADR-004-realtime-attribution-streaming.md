# ADR-004: Real-Time Attribution with Streaming Data

**Status**: Proposed  
**Date**: 2026-04-13  
**Deciders**: Growth Revenue Department

## Context

Current attribution is computed batch-wise on historical data. Real-time attribution would enable immediate insights and faster iteration on experiments.

## Decision

**Proposed**: Implement streaming attribution using WebSocket connections for real-time touchpoint ingestion and incremental attribution updates.

### Implementation Approach

1. Add `StreamingAttributionEngine` class
2. Support WebSocket-based touchpoint ingestion
3. Implement incremental attribution recalculation
4. Add real-time confidence monitoring

## Consequences

### Positive
- Faster insight generation
- Ability to detect attribution shifts in real-time
- Better experiment monitoring

### Negative
- Increased infrastructure complexity
- Higher computational costs
- Potential for over-reaction to short-term fluctuations

## Alternatives Considered

1. **Polling-based real-time**: Simpler but higher latency
2. **Batch with shorter windows**: Less real-time but simpler
