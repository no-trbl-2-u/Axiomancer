# Phase 80 — Skills always-land effects + separate damage roll (direction (a) pure split)

> **Mechanic shift.** User-attended direction pick at oversight-19
> 2026-05-24 locked direction **(a) pure split** with a
> **revisit-if-unbalanced** caveat. The fallback paths (b) intensity
> scaling and (c) split-resistance stay documented on the candidate
> body for a future re-author if direction (a) feels off after
> playtesting.

## Outcome

`src/Combat/resist.ts:resolveEffectApplication` is rewritten so:

- **Tier 1** — no change. Auto-applies, no roll.
- **Tier 2 buff** — no change. Caster d20 fumble/crit (Nat 1 fails;
  Nat 20 double intensity). Per Phase 79 D8: caster-side variance is
  NOT load-bearing target-resist; stays.
- **Tier 2 debuff** — **CHANGED.** Always lands. No target-resist
  roll. No Nat-20 rebound. No Nat-1 double-duration. Effect applies
  unconditionally at the requested intensity + duration.
- **Tier 3** — **CHANGED.** Always lands. No Nat-20 miraculous escape.
  Effect applies unconditionally.

Direction (a)'s damage-side ("damage rolls separately + applies
resistance") is **deferred to a follow-up phase** per D1 below — the
damage-resist primitive doesn't exist today; introducing it would
expand Phase 80 scope materially. Phase 80 ships the **effect-side
shift only**; the damage-half stays deterministic via
`calculateSkillDamage` (unchanged).

## Source

`plan/PHASE_CANDIDATES.md` Promoted section, Phase 80 row — promoted
at oversight-19 2026-05-24 (commit `7419142`). Direction (a) locked
at the same oversight. Audit pre-work shipped at Phase 78 (skills,
`44d3827`) + Phase 79 (effects, `3d213bd`).

## Sibling brief

`plan/phases/phase_79_general_effects_audit.md` (commit `8870128`)
captures the Phase 80 baseline:
- 12 Tier 1 effects (auto-apply) — no engine change
- 30 Tier 2 buffs — caster fumble/crit stays per D8
- 43 Tier 2 debuffs (load-bearing surface) — target-resist removed
- 3 Tier 3 effects — Nat-20 escape removed

Phase 79's audit also surfaced that **no existing hermetic test pins
the resist-roll outcome directly**. The 32 covered effects (out of 88)
exercise the apply / tick / stack paths, not the roll-success-or-fail
decision. Phase 80 verify gate should stay green automatically; the
risk surface is narrower than the candidate body suggested.

## Implementation units

### Unit 1 — Engine change (single file: `src/Combat/resist.ts`)

Rewrite `resolveEffectApplication`:

```typescript
export function resolveEffectApplication(
    target: Combatant,
    activeEffect: ActiveEffect,
    effectType: EffectType,
    attackerHeartBonus = 0,
    equipmentBonus = 0,
): EffectApplicationResult {
    const tier = activeEffect.tier;

    if (tier === 1) {
        return { success: true, activeEffect, message: `Effect applied automatically.` };
    }

    if (tier === 2 && effectType === 'buff') {
        // Caster-side variance kept per Phase 79 D8 + Phase 80 direction (a) interpretation.
        // The fumble/crit is caster-side, not target-resist; direction (a) only removes
        // target-resist rolls on Tier 2 debuffs + Tier 3.
        const roll = createDieRoll('neutral')();
        if (roll === 1) { /* fumble — unchanged */ }
        if (roll === 20) { /* crit — unchanged */ }
        return { /* normal — unchanged */ };
    }

    if (tier === 2 && effectType === 'debuff') {
        // Phase 80 direction (a) pure split — effect always lands; damage rolls
        // separately + applies resistance (damage-side deferred to a follow-up
        // phase per D1). Target-resist roll removed; Nat-20 rebound removed;
        // Nat-1 overwhelmed-double-duration removed.
        return {
            success: true,
            activeEffect,
            message: `Effect lands.`,
        };
    }

    if (tier === 3) {
        // Phase 80 — Tier 3 always lands (was: Nat-20 escape). Direction (a) treats
        // "always-land" uniformly across debuff tiers; Tier 3 was already the
        // closest-to-uniform (only Nat-20 escaped); the escape clause is removed
        // for consistency.
        return {
            success: true,
            activeEffect,
            message: `Inescapable. The Tier 3 effect takes hold.`,
        };
    }

    return { success: false, message: `Unknown effect tier — effect not applied.` };
}
```

The Tier 2 buff branch keeps `createDieRoll('neutral')()` per D8;
unused imports (`getResistStat`) drop. The function signature stays
identical so all callers (`src/Skills/skill.engine.ts:581`,
`src/Combat/combat-effects.ts:346`) work without modification — the
caller branches that handle `result.rebounded` or `!result.success`
on Tier 2 debuff / Tier 3 simply never fire after Phase 80. Those
branches become dead-code; Phase 84 (skill "fizzle" event + UX scrub)
prunes them.

### Unit 2 — Hermetic test pin for the new contract

Add a small hermetic case to `src/Combat/e2e/effects.engine.test.ts`
(or `src/Skills/e2e/skill.engine.test.ts`) pinning the Phase 80
contract:

- Tier 2 debuff always lands at requested intensity + duration
  (drive a couple of Tier 2 debuff effects through with intentionally
  high-resistStat targets; assert the effect lands).
- Tier 3 always lands (drive a Tier 3 debuff; assert it lands even
  when the legacy roll would have surfaced a Nat-20 escape).
- Tier 2 buff caster fumble/crit still fires (assert the existing
  caster-roll variance survives).

Single test file, ~3 `it()` blocks.

### Unit 3 — Docs + CHANGELOG + plan-row flip

- `docs/effects.md` "Audit summary (Phase 79)" subsection extended
  with a "Phase 80 status (shipped)" trailing paragraph: the Tier 2
  debuff target-resist + Tier 3 Nat-20 escape removed per direction
  (a); damage-resist deferred to follow-up per D1.
- `docs/combat.md` resist-resolver section (if any) — same update.
- `CHANGELOG.md [unreleased] ### Changed` entry naming the mechanic
  shift with the revisit-if-unbalanced caveat preserved.
- `plan/steps/01_build_plan.md` Phase 80 row flipped `[ ]` → `[x]`.

## Decisions made upfront — DO NOT ASK

- **D1 — Defer damage-side change to a follow-up phase.** The
  candidate body's direction (a) text says "damage rolls separately
  + applies its own resistance." That requires defining (a) what
  "damage rolls" means for skills (today `calculateSkillDamage` is
  deterministic — no damage die), and (b) what resistance applies to
  the damage half (today there's no damage-resist primitive — the
  `resistStat` band is used by the effect-resist roll only). Adding
  both primitives at Phase 80 expands scope significantly + risks
  failure-mode 6 (type errors cascading >5 modules). Phase 80 ships
  the effect-side change in isolation; a new candidate is filed at
  ship-time for the damage-resist follow-up. Per the
  revisit-if-unbalanced caveat — if direction (a) feels off
  post-Phase-80 *because* the damage half is unchanged, that signal
  drives the damage-resist follow-up phase's design.

- **D2 — Tier 2 buff caster fumble/crit KEPT.** Per Phase 79 D8.
  Caster-side variance ≠ target-resist; direction (a) only removes
  target-resist.

- **D3 — Tier 3 Nat-20 escape REMOVED.** Per direction (a) "effect
  always lands" uniform read. Tier 3 was already the closest to
  uniform (only Nat-20 escaped); the clause is removed for
  consistency. Authored Tier 3 effects (3 of them — 2 buffs + 1
  debuff) all become unconditional. If this feels too lethal in
  playtest, the revisit-if-unbalanced caveat brings it back.

- **D4 — `EffectApplicationResult` shape unchanged.** The
  `roll` / `rebounded` fields stay on the type (still set for Tier 2
  buff caster rolls; never set for Tier 2 debuff / Tier 3 after
  Phase 80). Removing them now would cascade into the public surface
  (Spec 12 public-surface fixture) + every caller. Phase 84 (UX
  scrub) is the right phase for the type-shape cleanup.

- **D5 — `effect-resisted` and `effect-rebounded` SkillEvent variants
  stay in the union.** No emitter after Phase 80 (Tier 2 debuff
  always-success → no `effect-resisted` path fires; rebound branch
  unreachable). The variants stay as dead-code in `SkillEvent` +
  scenario.ts mapping until Phase 84. Discriminated-union variant
  removal is API-surface work; Phase 84 owns it.

- **D6 — `combat-effects.ts:applyProcOutcome` left as-is.** The proc
  system calls `resolveEffectApplication` the same way; the
  Tier-1 / 2 / 3 branches inside `applyProcOutcome` still gate on
  `effect.tier`. The Tier 2 debuff branch + Tier 3 branch both now
  receive a success result every time, so the rebound / resist
  cleanup paths inside `applyProcOutcome` become unreachable —
  same dead-code framing as D5. Phase 84 cleans.

- **D7 — Hermetic regression: no existing test breaks.** Per Phase
  79 audit verification, no test pins the Tier 2 debuff resist-roll
  outcome OR the Tier 3 Nat-20 escape outcome by behaviour assertion.
  `mockSequentialRng(0.05)` (the common stub) yields d20=2 →
  legacy-resist would have produced "effect lands" outcome for most
  Tier 2 debuffs anyway. The verify gate should stay green
  automatically. If a test surfaces a regression: patch the test
  assertion to the new always-land contract (per Phase 83's broader
  scope).

- **D8 — No public-surface change.** `resolveEffectApplication` is
  not on the public barrel (`src/index.ts` doesn't export it). The
  fixture stays at 237 runtime + 167 types. `GAME_STATE_VERSION` is
  unchanged.

- **D9 — Single-commit ship.** Engine change + hermetic pin + docs
  + plan-row flip in one commit. Per ship-a-phase Step 10's
  "one summary commit if the brief doesn't specify units" — the
  three sub-units are tightly coupled (engine change without the
  hermetic pin is incomplete; the docs update describes the engine
  change). Brief itself ships in a separate commit per §3.

- **D10 — File the damage-resist follow-up as a Pending candidate
  at ship-time.** Per D1 — direction (a)'s damage-side is genuinely
  out of scope here, but the candidate should be filed so the loop
  picks it up later. Score: ~3.0 (medium impact, medium ease — it's
  a defined surface with clear callers).

## Verify gate

`npm run verify` (type-check + test + build). Per D7, no existing
test should break. If a test fails: assess whether it's pinning the
legacy resist behavior (update assertion) or a real regression
(diagnose). Up to 3 same-root-cause iterations per §10.5.

## Commit body template

```
feat(combat): Phase 80 shipped — skills always-land effects (direction (a) pure split)

- resolveEffectApplication rewrite:
  - Tier 1: unchanged (auto-applies)
  - Tier 2 buff: unchanged (caster d20 fumble/crit per Phase 79 D8)
  - Tier 2 debuff: CHANGED — always lands; target-resist + Nat-20
    rebound + Nat-1 overwhelmed removed
  - Tier 3: CHANGED — always lands; Nat-20 escape removed
- Damage-side change (direction (a)'s "damage rolls separately +
  applies resistance") DEFERRED to a follow-up phase per D1 — the
  damage-resist primitive doesn't exist today; introducing it expands
  scope. Filed as Pending candidate for the loop to pick up.
- Hermetic pin added in src/Combat/e2e/effects.engine.test.ts:
  Tier 2 debuff always-lands + Tier 3 always-lands + Tier 2 buff
  fumble/crit still fires
- effect-resisted + effect-rebounded SkillEvent variants left in the
  union as dead-code — Phase 84 (UX scrub) prunes them
- applyProcOutcome left as-is; resist/rebound branches become
  unreachable but stay for Phase 84
- No public-surface change; fixture stays 237 runtime + 167 types
- GAME_STATE_VERSION unchanged
- CHANGELOG.md [unreleased] ### Changed entry with revisit-if-unbalanced
  caveat preserved per oversight-19's "let's note somewhere this
  decision so if it's unbalanced, we can come back to it"

Decisions:
- D1: defer damage-side change to follow-up phase (filed as candidate)
- D2: Tier 2 buff caster fumble/crit KEPT (Phase 79 D8)
- D3: Tier 3 Nat-20 escape REMOVED (uniform always-land)
- D4: EffectApplicationResult shape unchanged (Phase 84 cleans)
- D5: effect-resisted + effect-rebounded variants stay (Phase 84)
- D6: applyProcOutcome unchanged (dead branches; Phase 84)
- D7: no existing test breaks per Phase 79 audit verification
- D8: no public-surface change
- D9: single-commit ship
- D10: damage-resist follow-up filed as Pending candidate

Closes phase 80 promoted at oversight-19 2026-05-24.
```

## Definition of Done

- [ ] `src/Combat/resist.ts` rewritten per Unit 1.
- [ ] Hermetic pin added per Unit 2 (3 `it()` blocks).
- [ ] `docs/effects.md` "Audit summary (Phase 79)" subsection
      extended with the Phase 80 status paragraph.
- [ ] `CHANGELOG.md [unreleased] ### Changed` entry.
- [ ] `plan/steps/01_build_plan.md` Phase 80 row flipped `[ ]` → `[x]`.
- [ ] `plan/PHASE_CANDIDATES.md` Pending gains a new candidate for the
      damage-resist follow-up (D10).
- [ ] `npm run verify` passes.
- [ ] `npm run deploy:check` passes.

## Follow-ups (out of scope)

- **Damage-resist primitive** — D10 candidate. Subtract target's
  relevant resistStat from `calculateSkillDamage` output; introduce
  a `damageResist` primitive on Combatant or per-stance.
- **Phase 83** — post-Phase-80 effect-application test sweep absorbs
  any per-effect coverage gaps the audit surfaced (28 of 43 Tier 2
  debuffs uncovered).
- **Phase 84** — `effect-resisted` / `effect-rebounded` variant
  removal from the SkillEvent union; `EffectApplicationResult.roll`
  + `.rebounded` field pruning where dead; `applyProcOutcome` rebound
  branch cleanup.
- **Phase 85 (combat-tuning audit)** — revisits the broader combat
  math under the new effect-resolution model.
- **Phase 86 (equipment generation audit)** — revisits equipment
  modifier chains under the new effect-resolution model.
- **Revisit-if-unbalanced** — if direction (a) feels off in playtest,
  the candidate body's (b) intensity-scaling and (c) split-resistance
  paths remain documented for a future re-author.
