# Phase 164 — Engine-gated combat content backlog

Filed 2026-06-28 (T direct steering). **OWNER: mechanics-first, then mobile surfacing.**

## Context
The critic rounds surfaced strong content ideas that need NEW engine behavior before mobile can show them honestly. Authoring them mobile-only would mint more number-less "minor" cards — the exact disease the 0.34.0 status-depth epic just cured. So each item is engine-first.

## Backlog (each = engine behavior + card(s) + mobile honesty surfacing)
- **INVERT** — flip the foe's telegraphed intent for one phase (ATTACK → WAITS). Cards: False Dilemma / Equivocation / Grandfather Paradox.
- **VOLATILE** — a card STRONGER on a disadvantage / off-color read (dice decisions beyond color-matching).
- **Oracle's Read** — FREE peek the hidden enemy stance; POWER lock it to ADVANTAGE (the hidden-read is engine-owned).
- **Overcharge** — spend BOTH drawn dice on one card for a doubled effect (gives the 2nd/X die a purpose).
- **Dice-shaping:** TEMPER (recolor) / BANK (carry-over; a `carriedDie` field already exists on CombatEncounterState) / SPLIT — turn dice RNG into a planning puzzle.
- **ESCALATE** — a DoT whose per-turn value self-increments each turn it persists.
- **DOOM** — a telegraphed delayed bomb on the foe (symmetric with enemy intents; counterplay = cleanse).
- **Conviction sink / Echo** — spend all Conviction for a scaling burst; reuse the paradox-named cards.

## Process
Prioritize per `/combat-tuning` value. Each item: engine `SkillSpecialMechanic` / die-op + tests + sim → publish → mobile consume (`engineHonestKind` + keyword presentation). Do NOT author any of these mobile-only.
