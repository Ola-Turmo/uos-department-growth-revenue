# ADR-001: LLM Gateway Architecture

**Status**: Accepted  
**Date**: 2026-04-13  
**Deciders**: Growth Revenue Department

## Context

The Growth Revenue Department needs to integrate LLM-powered capabilities for hypothesis generation, attribution analysis, and experiment insights. We evaluated several approaches for providing AI-driven analysis without coupling to a specific LLM provider.

## Decision

We adopted a modular LLM Gateway architecture that:
1. Provides a unified interface (`LLMGateway` class) for all LLM interactions
2. Supports multiple providers (OpenAI, Anthropic, local, mock) via configuration
3. Uses Zod schemas for input/output validation
4. Falls back to intelligent mocks when LLM is unavailable

### Key Design Decisions

- **Provider abstraction**: `LLMProvider` type supports "openai" | "anthropic" | "local" | "mock"
- **Configuration-driven**: `LLMConfig` interface allows runtime provider selection
- **Mock mode by default**: Enables development without API costs
- **Confidence scoring**: Every AI-generated insight includes confidence metadata

## Consequences

### Positive
- Easy to swap LLM providers without changing calling code
- Validated inputs/outputs via Zod prevent downstream errors
- Mock mode enables offline development and testing

### Negative
- Additional abstraction layer adds complexity
- Mock implementations may drift from real LLM behavior

## Alternatives Considered

1. **Direct OpenAI integration**: Simpler but couples to one provider
2. **LangChain**: More features but heavier dependency
3. **No LLM layer**: Would require rewriting AI features per-provider
