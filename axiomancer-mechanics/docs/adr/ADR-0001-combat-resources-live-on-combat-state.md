# ADR-0001 — Combat resources live on CombatState

Status: Accepted  
Date: 2026-06-01  
Scope: axiomancer-mechanics

## Decision

The canonical player casting pool is `CombatState.combatResources`. It is not stored on `Character` and not on `CombatState.player.combatResources`.

## Context

Skill availability and casting depend on per-combat resource generation. Stale docs and UI assumptions previously confused character state with combat state.

## Consequences

- Combat initialization, basic actions, skills, consumables, equipment, and set bonuses must read/write the combat-resource pool.
- Consumers should use engine helpers such as `canUseSkill`, `spendResources`, and resource-generation functions rather than inventing UI state.
- Documentation and mobile presenters must treat `CombatState.combatResources` as the source of truth.

## Links

- Phase 98 — Items + skill-resource integration audit
- Phase 99 — Unlocked skill access
