# Phase 86 — Equipment generation audit under new effect-resolution model

> Walks modifiers, set bonuses, and unique items against the
> post-Phase-80 always-land contract. Finds one dead-code block
> and removes it.

## Outcome

Audit confirms: no modifier, set bonus, or unique template
references resist-DR, resist rolls, or the removed rebound
mechanics. One dead-code block found in `combat-effects.ts`
(proc-based rebound path, unreachable post-Phase-80) — removed.

## Source

`plan/PHASE_CANDIDATES.md` Promoted section, Phase 86 row —
promoted at oversight-20 2026-05-24.

## Audit findings

### Modifiers (`modifier.catalogue.ts`)

| Modifier ID | Effect | Type/Tier | Post-Phase-80 impact |
|---|---|---|---|
| wm-lifesteal | `buff_life_steal` | buff/T2 onHit | Buff fumble/crit still applies (unchanged) |
| wm-armour-pen | `debuff_vulnerability_body` | debuff/T2 onHit | Now always lands (player buff) |
| am-fortify | `buff_max_hp_up` | buff/T2 passive | Applied via `applyEffect` directly (no resolve roll) |
| am-extend | `buff_buff_duration_up` | buff/T2 passive | Same — direct apply |
| hm-reflect | `buff_reflect` | buff/T2 passive | Same — direct apply |
| hm-on-defend | `buff_damage_reduction` | buff/T2 onDefend | Buff fumble/crit applies |
| rm-regen | `buff_regeneration` | buff/T2 passive | Same — direct apply |
| um-paradox-edge | `debuff_vulnerability_body` + `debuff_confusion` | debuff/T2+T3 onHit | Both always land (player buff) |

**Verdict:** No drift. Tier 2 debuffs applied by equipment `onHitEffects`
now always land — this is an intentional buff to those items under the
Phase 80 contract (equipment procs are more reliable). No rebalancing
needed at this stage.

### Set bonuses (`set.library.ts`)

| Set | Bonus shape | Post-Phase-80 impact |
|---|---|---|
| Wanderer's Road (2) | `combatStartTokens: { heart: 2 }` | No effect interaction |
| Iron Discipline (2) | `statModifiers: [physicalDefense +3]` | No effect interaction |
| Iron Discipline (3) | `generationBonus: body +1 on any` | No effect interaction |
| Scholar's Circle (2) | `combatStartTokens: { mind: 2 }` + `passiveEffects: ['buff_critical_rate_up']` | Passive applied directly; no resolve roll |

**Verdict:** No drift. Set bonuses either grant tokens/stats (no effect
pipeline) or apply passives directly (bypass `resolveEffectApplication`).

### Unique templates (`unique.templates.ts`)

| Unique | Fixed mods | Post-Phase-80 impact |
|---|---|---|
| Axiom's Edge | wm-flat-damage, wm-body-gen, um-paradox-edge | um-paradox-edge's onHit debuffs now always land |
| Paradox Loop | am-stance-res, am-proc-boost, um-resonance-prime | No effect-tier interactions |

**Verdict:** No drift. Axiom's Edge benefits from always-land debuffs
(player-positive change; no rebalance needed).

### Dead code found

`src/Combat/combat-effects.ts:361-391` — the rebound block in
`applyProcOutcome` checks `resolveResult.rebounded` and applies the
rebounded effect to the opposite side. Post-Phase-80,
`resolveEffectApplication` never returns `rebounded: true`. This is
dead code identical in shape to the block Phase 84 removed from
`skill.engine.ts:applySkillEffect`.

**Fix:** Remove the dead rebound block. Update the comment from
"Resist or rebound" to "Fumble: revert staged effect."

## Implementation units

### Unit 1 — Remove dead rebound block in combat-effects.ts

Remove lines 364-391 (the `if (resolveResult.rebounded ...)` block).
Update comment at line 361. The fallthrough path (lines 393-396)
stays — it handles the Tier 2 buff fumble case where `resolveResult.success`
is false and the staged effect needs to be reverted.

### Unit 2 — Plan-row flip + docs

Flip Phase 86 `[ ]` → `[x]`. No CHANGELOG entry needed (dead-code
removal with no behavior change; no public-surface impact).

## Decisions made upfront — DO NOT ASK

- **D1 — Dead rebound block removed (same rationale as Phase 84 D2).**
  Zero code path reaches it; keeping it adds confusion about the
  post-Phase-80 contract.

- **D2 — No CRITIQUE rows filed.** The audit found zero
  inconsistencies between equipment and the effect model. The
  always-land behavior for Tier 2 debuff equipment procs is
  intentional (player-positive).

- **D3 — No rebalance needed.** Equipment with Tier 2 debuff
  procs is buffed by Phase 80 (procs always land). This is the
  intended direction — no numeric adjustment.

- **D4 — Single commit.** Dead-code removal + plan-row flip.

## Verify gate

`npm run verify`. Expected: 738 tests unchanged. The dead rebound
block has no test exercising it (confirmed — no test seeds
`rebounded: true` from the proc path).

## Definition of Done

- [ ] Dead rebound block removed from `combat-effects.ts`.
- [ ] `plan/steps/01_build_plan.md` Phase 86 row flipped.
- [ ] `npm run verify` passes.
- [ ] `npm run deploy:check` passes.
