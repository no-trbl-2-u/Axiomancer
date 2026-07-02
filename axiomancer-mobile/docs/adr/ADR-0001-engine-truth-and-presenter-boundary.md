# ADR-0001 — Engine truth and presenter boundary

Status: Accepted  
Date: 2026-06-01  
Scope: axiomancer-mobile

## Decision

Axiomancer Mobile is a presentation layer over `axiomancer-mechanics`. Game rules, state shape, randomness, combat outcomes, resource truth, and progression logic belong in the engine. Mobile presenters translate engine state into UI view models.

## Context

Manual playthrough and audit work repeatedly found UI assumptions diverging from engine truth. The client must not become a parallel rules engine.

## Consequences

- Screens should read presenter view models, not invent mechanics in component state.
- New gameplay semantics require engine support first.
- Mobile fixes should identify whether the bug is presentation, presenter mapping, store integration, or engine logic.
- Hermetic tests should pin the presenter boundary.

## Links

- README — presentation-layer statement
- Mechanics ADR-0001 — Combat resources live on CombatState
- Mechanics ADR-0002 — Skills are known, not equipped
