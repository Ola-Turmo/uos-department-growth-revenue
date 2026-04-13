# ADR-002: ML Model Registry

**Status**: Accepted  
**Date**: 2026-04-13  
**Deciders**: Growth Revenue Department

## Context

Multiple ML models are required for the Growth Revenue Department: forecasting (SMA, exponential smoothing), clustering (K-means), lead scoring, and churn prediction. We needed a way to track, version, and manage these models consistently.

## Decision

We implemented a `ModelRegistry` class with the following capabilities:
1. Register models with metadata (name, version, trainedAt, accuracy, features, modelType)
2. Retrieve models by name
3. List all registered models
4. Track latest version per model

### Model Instances

Pre-configured singleton instances are exported for common use cases:
- `smaModel`: SimpleMovingAverageModel with window=3
- `expSmoothModel`: ExponentialSmoothingModel with alpha=0.3
- `leadScoringModel`: LeadScoringModel with default weights
- `churnPredictionModel`: ChurnPredictionModel
- `kmeans`: KMeansClustering with k=5

## Consequences

### Positive
- Centralized model management
- Consistent metadata across all models
- Easy to extend with new model types

### Negative
- In-memory storage may not persist across restarts
- No model serialization/deserialization yet

## Alternatives Considered

1. **MLflow integration**: More features but heavier dependency
2. **Database-backed registry**: Better persistence but adds infrastructure
3. **No registry**: Would lead to inconsistent model tracking
