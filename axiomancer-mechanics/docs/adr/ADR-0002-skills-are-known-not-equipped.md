# ADR-0002 — Skills are known, not equipped

Status: Accepted  
Date: 2026-06-01  
Scope: axiomancer-mechanics

## Decision

Skills are learned/unlocked through `knownSkills`; they are not player-equipped loadout slots. Combat surfaces should show only currently affordable unlocked skills.

## Context

T corrected the old model after manual playthrough evidence showed learned skills blocked by equipped-skill assumptions. The intended doctrine is learned access plus resource affordability.

## Consequences

- `knownSkills` is the learned catalogue.
- `equippedSkills` was legacy implementation debt; it was removed entirely from the `Character` type, presets, the Tuning loadout builder, and the CLI dev-tools in Phase 159. It is no longer a field on any live shape.
- Combat policies and UI consumers filter known skills by affordability through engine resource checks.
- Legacy v7 saves merge old equipped-skill values into `knownSkills` during the v7→v8 save migration; the legacy field is read off the raw payload and dropped — never written back onto the migrated player.

## Links

- Phase 99 — Unlocked skill access, no equipped-skill gate
- Phase 159 — `equippedSkills` field removed (gate-to-field cleanup)
