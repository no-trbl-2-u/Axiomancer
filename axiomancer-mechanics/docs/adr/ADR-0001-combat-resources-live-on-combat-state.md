# ADR-0001 — Combat resources live on CombatState

Status: Superseded (Phase 37, 2026-07-20 — `combatResources` fully retired, see below)  
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
- Phase 37 (2026-07-20) — `combatResources` was a write-only pool nothing
  read (the live stance economy is `resonance` on `CombatEncounterState`);
  fully torn down along with `Card.category`/`CardCategory`. This ADR's
  decision no longer describes the codebase; kept for history.
