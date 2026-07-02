# ADR-0004 — Combat terminology prefers player language

Status: Accepted  
Date: 2026-06-01  
Scope: axiomancer-mobile

## Decision

Combat UI should use player-comprehensible language while preserving engine truth through presenters and logs.

## Context

Phase 96 designed combat UX terminology improvements; Phase 98 implemented them. The goal is to reduce interface decoding without hiding tactical information.

## Consequences

- Engine jargon should be translated at the presenter/UI layer.
- Battle logs should use natural language while retaining evidence value.
- Accessibility labels and visual hierarchy should prioritize player comprehension.
- Terminology changes must not alter combat mechanics.

## Links

- Phase 96 — combat UX legibility overhaul
- Phase 98 — combat terminology implementation
