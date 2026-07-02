# Phase 79 — General effects audit (40 buffs + 48 debuffs = 88 effects)

> Audit-first phase. Pre-work for Phase 80 (skills-always-land mechanic
> shift, direction (a) pure split) alongside Phase 78 (skills audit).
> Surfaces per-effect resolution shape + spec/doc/behaviour drift across
> the 88 effects before the engine shift lands.

## Outcome

A per-tier / per-category audit verdict is recorded in `docs/effects.md`
(new "Audit summary (Phase 79)" subsection) + an audit verdict written
into the build-plan ship-row body. Aggregate findings (not per-effect
rows — there are 88) filed as `plan/CRITIQUE.md` Pending rows where
drift is real. Phase 80 baseline snapshot captured.

## Source

`plan/PHASE_CANDIDATES.md` Promoted section, Phase 79 row — promoted at
oversight-19 2026-05-24 (commit `7419142`). Original candidate filed at
oversight-18 2026-05-23 with the same user-flagged framing as Phase 78
(general audit pass — sniff for spec/doc/behaviour drift; possible
balance issues; possible orphan exports; possible test gaps).

## Sibling brief

`plan/phases/phase_78_general_skills_audit.md` (commit `5e7cd78`,
shipped at `44d3827` today) — same audit-first shape, same
single-commit ship convention, same MED/LOW finding classification.

## The audit (run at brief-generation time, 2026-05-24)

Walk every effect across `src/Effects/buffs.library.json` (40 entries)
+ `src/Effects/debuffs.library.json` (48 entries) — total 88 — against
four axes:

1. **Per-effect test coverage** — does any `*.test.ts` reference the
   effect id directly?
2. **Doc coverage** — does `docs/effects.md` name the effect in its
   Complete Effects Table (Buffs 40 / Debuffs 48)?
3. **Spec acceptance alignment** — does `specs/01-effects-engine-completion.md`
   acceptance match the live library shape?
4. **Engine resolution shape** — current application behaviour per tier
   (Phase 80 baseline).

### Verdict — distribution

| Axis | Result |
|---|---|
| Total effects | 88 (40 buffs + 48 debuffs) ✓ matches docs/effects.md headings |
| By tier | Tier 1: 12 (8 buffs + 4 debuffs); Tier 2: 73 (30 buffs + 43 debuffs); Tier 3: 3 (2 buffs + 1 debuff) |
| By category | stat: 25; defense: 19; advantage: 14; control: 17; damage: 10; regeneration: 3 |
| Test-file direct refs | **32 of 88 (36%) covered; 56 of 88 (64%) uncovered** |
| Doc coverage | Clean — all 88 IDs appear in Complete Effects Tables (lines 19-20 cite "Buffs (40)" + "Debuffs (48)"; tables list every entry) |
| Spec 01 acceptance | `grep -E "^- \[ \]" specs/01-effects-engine-completion.md` returns 0; all rows ticked |

### Coverage gap by category (test-file direct refs only)

| Category | Total | Covered | Uncovered | Notes |
|---|---|---|---|---|
| stat | 25 | 5 | 20 | Tier 1 attack/defend buffs covered (4 of 4); buff_critical_rate/damage_up covered; mind/heart attack-up/defense-up bands + 3 resistance bands + all_stats_up + cleanse uncovered |
| defense | 19 | 5 | 14 | buff_haste + buff_barrier + buff_reflect + debuff_evasion_down + accuracy_down covered; damage_reduction / invincibility / taunt / stealth / counter / cleanse / status_chance_up / life_steal / etc. uncovered |
| advantage | 14 | 1 | 13 | buff_advantage_body covered (Phase 66 synergy `intensity-feedback` pin); advantage_mind / advantage_heart + 11 others uncovered |
| control | 17 | 7 | 10 | stun / petrify / charm / confusion / silence / slow / mark covered; sleep / daze / fear / blind / berserk / fatigue / exhaustion / root / knockdown / vulnerability_mind/heart / dispel / hex uncovered |
| damage | 10 | 7 | 3 | poison / bleed / curse / disease + hp_decay + straw_man_echo + post_hoc_tremor covered; strong_poison / burn / frostbite / shock / wound uncovered |
| regeneration | 3 | 3 | 0 | buff_regeneration + max_hp_up + reflect all covered |

### Aggregate verdict

**Coverage gap surfaced — much larger than Phase 78.** 56 of 88 (64%)
have **zero direct test-file references** by effect id. Compared to
Phase 78 (8 of 21 = 38% gap), Phase 79 surfaces a structurally
different kind of gap:

- **Phase 78's gap was per-skill** — each of the 8 uncovered skills
  has unique engine logic (combatEffects payload, specialMechanics
  primitive) that warrants a per-skill case.
- **Phase 79's gap is per-effect-id** — many of the 56 uncovered
  effects share the same engine resolution path (`applyEffect` +
  `tickAllEffects` + tier-keyed `resolveEffectApplication` dispatch).
  A debuff_burn case would exercise the same path as debuff_poison
  (already covered). The gap is real but the test cost per case is
  lower (often a single `applyEffect` + assertion).

**Filing strategy:** aggregate findings by category, not per-id.
Phase 80 (mechanic shift) + Phase 83 (post-Phase-80 effect-application
test sweep) will need broad coverage on the Tier 2 debuff resolution
path anyway — that's the surface most affected by direction (a) pure
split. The 6 aggregate findings below are the minimum scaffold for
that re-authoring work.

### Engine resolution shape snapshot (Phase 80 baseline)

Per `src/Combat/resist.ts:32` `resolveEffectApplication(target,
activeEffect, effectType, attackerHeartBonus, equipmentBonus)`:

- **Tier 1 (12 effects)** — auto-applies, no roll. **Phase 80 no-op
  on Tier 1** — already always-lands.
- **Tier 2 buff (30 effects)** — caster rolls d20. Nat 1 fumble (buff
  fails). Nat 20 crit (double intensity). **Phase 80 direction (a)
  ambiguity** — direction (a) says "effect always lands" but Tier 2
  buffs aren't a target-resist question; the fumble/crit is
  caster-side. Brief at Phase 80 dispatch should explicitly decide:
  keep the Tier 2 buff fumble/crit (likely default — it's
  flavour/RNG variance, not the load-bearing resist contract) or
  remove it (uniform always-land semantics across all tiers). **D8
  recommendation: keep Tier 2 buff caster-side fumble/crit**;
  direction (a) only removes the target-resist roll, not all RNG
  from the engine.
- **Tier 2 debuff (43 effects)** — target rolls to resist. `DR =
  effect.resistDR + attackerHeartBonus + equipmentBonus`. Nat 20
  crit-resist (rebounds onto attacker at double intensity). Nat 1
  fumble-resist (effect lands at double duration). roll + resistStat
  < DR → effect lands; ≥ DR → resisted. **Phase 80 direction (a)
  removes this entire branch.** Effect lands unconditionally; the
  damage-half rolls separately + applies resistance independently.
  **This is the load-bearing surface for Phase 80.**
- **Tier 3 (3 effects)** — only Nat 20 on resist roll repels.
  **Phase 80 direction (a) likely removes the Nat 20 escape**
  (uniform always-land); brief at dispatch should explicitly decide.

The 43 Tier 2 debuffs are the primary surface Phase 80 will need
new hermetic coverage on (Phase 83 follow-up); of those, 28 are
currently uncovered by direct id reference.

### Doc / spec alignment

- **`docs/effects.md` count headings:** "Buffs (40)" + "Debuffs
  (48)" — match live library counts. No drift.
- **Complete Effects Tables:** all 88 IDs appear. No drift.
- **Spec 01 acceptance:** all rows ticked. No drift.
- **`getActiveEffectModifiers` / `getEffectiveStats` runtime
  aggregation** (docs/effects.md:179) — Phase 48 verification still
  current; no audit signal here.
- **Stacking modes (docs/effects.md:89):** independent / refresh /
  stack-intensity / stack-duration / extend — all documented; no
  per-effect stacking-mode test pin requested.

## Implementation units

### Unit 1 — Audit-summary commit (this file + docs/effects.md subsection + plan ship-row)

Single commit per the Phase 59 / Phase 78 audit-phase sibling
pattern. Four actions:

1. This brief file (`plan/phases/phase_79_general_effects_audit.md`)
   ships the verdict tables inline.
2. `docs/effects.md` gains a new "Audit summary (Phase 79)"
   subsection right after the table of contents (matches Phase 78's
   `docs/skills.md` placement) — short paragraph naming the
   56-of-88 gap broken down by category + the Phase 80 Tier 2 debuff
   focus.
3. `plan/CRITIQUE.md` gains 6 aggregate Pending rows (1 MED + 5
   LOW) — see Unit 2 below.
4. `plan/steps/01_build_plan.md` Phase 79 row flipped `[ ]` → `[x]`
   with audit-summary body inline.

### Unit 2 — File CRITIQUE rows (bundled into Unit 1's commit)

Per the Phase 78 D2 precedent ("file findings rather than drain
inline"), the audit's job is to surface the gap; drain happens via
/iterate or folds into Phase 83. Six aggregate findings:

1. **MED — Tier 2 debuff resolution path: 28 of 43 effects uncovered
   by direct id reference.** Phase 80's load-bearing surface; needs
   hermetic per-effect coverage before the shift lands.
2. **LOW — Stat-band buffs (mind/heart attack-up + body/mind/heart
   defense-up + 3 resistance bands) uncovered.** Shared path via
   `applyStatModifiers`; one parameterised test could cover the
   whole band.
3. **LOW — Advantage-category effects (13 of 14 uncovered).**
   buff_advantage_body has a pin via Phase 66; advantage_mind /
   advantage_heart + 11 others have none. Shared advantage-roll
   path.
4. **LOW — Control-category effects (10 of 17 uncovered).** Each
   has unique action-restriction semantics (sleep / fear / blind /
   etc.) — needs per-effect pins, not parameterised.
5. **LOW — Damage-category variants (5 of 10 uncovered).**
   strong_poison / burn / frostbite / shock / wound likely share the
   DoT path with poison/bleed (covered) but flavour-distinct effect
   payloads warrant individual pins.
6. **LOW — Fallacy-thread buffs (`buff_petitio_pulse`,
   `buff_gettiters_flicker`, `buff_ad_hoc_patch`,
   `debuff_moral_learning`, `debuff_transformative`,
   `debuff_rational_disagreement`, `debuff_affirming_consequent`,
   `debuff_causal_emergence`) uncovered.** Phase 44 fallacy-thread
   effects — these are content extensions of the standard payload
   shapes; quick pins via existing skill-thread tests.

## Decisions made upfront — DO NOT ASK

- **D1 — Single-commit ship.** Matches Phase 78 / Phase 59 sibling
  pattern (audit-only; no engine touch).

- **D2 — Aggregate findings, not per-id.** Filing 56 individual
  CRITIQUE rows would explode the queue. Six aggregate rows
  (1 MED + 5 LOW) cover the surface; iterate ticks fold them in as
  bundled commits per-category.

- **D3 — Phase 80 baseline snapshot is the load-bearing deliverable.**
  The per-tier resolution shape (Tier 1 auto / Tier 2 buff fumble-crit
  / Tier 2 debuff target-resist / Tier 3 Nat-20 escape) is the
  ground-truth for Phase 80's direction (a) interpretation. D8 below
  pre-resolves one ambiguity.

- **D4 — Audit lives in the brief file + docs/effects.md subsection.**
  Same as Phase 78 D4.

- **D5 — No coverage backfill in this phase.** Same as Phase 78 D5.

- **D6 — Treat transitive coverage as insufficient.** Same as Phase
  78 D6. The 56 uncovered effects may have transitive coverage via
  `applyEffect` round-trip tests, but per-effect behaviour
  assertions are missing.

- **D7 — No Knowledge-Gaps cross-link.** Same as Phase 78 D7.

- **D8 — Phase 80 direction (a) keeps Tier 2 buff caster-side
  fumble/crit; removes Tier 2 debuff target-resist only.** Phase 80
  is "skills always-land effects + separate damage roll" per the
  candidate body — the load-bearing semantics are about
  effect-application from the **target's** perspective (does this
  debuff land on me?), not about caster-side variance on
  self-buffing. Removing Tier 2 buff fumble/crit too would be an
  expanded scope; the candidate body doesn't ask for it. Tier 3
  Nat-20 escape similarly stays unless Phase 80 brief at dispatch
  explicitly removes it. **Final say lives with Phase 80's brief
  drafter** — this recommendation steers the default.

## Verify gate

Pure docs / plan-file change. `npm run verify` should be a no-op pass
(707/707 stay green). `npm run deploy:check` is unaffected.

## Commit body template

```
audit(effects): Phase 79 shipped — general effects audit (56 of 88 effects have no direct test pin)

- Walk all 88 effects (40 buffs + 48 debuffs) across 4 axes:
  test coverage / doc coverage / spec acceptance / engine resolution shape
- Verdict: 32 of 88 (36%) covered; 56 of 88 (64%) uncovered by direct
  test-file id reference — larger gap than Phase 78's 8/21 (38%)
- Coverage gap concentrates in stat / defense / advantage / control
  categories; regeneration is 100% covered; damage/control partial
- Phase 80 baseline snapshot captured: Tier 1 (12) auto-applies;
  Tier 2 buff (30) caster-side fumble/crit; Tier 2 debuff (43)
  target-resist + Nat-20 rebound + Nat-1 double-duration; Tier 3 (3)
  Nat-20 escape
- 28 of 43 Tier 2 debuffs uncovered — primary Phase 80 surface
- D8 recommendation: Phase 80 direction (a) keeps Tier 2 buff
  caster-side fumble/crit + removes Tier 2 debuff target-resist only
- Doc + spec clean: docs/effects.md counts match; Spec 01 acceptance
  ticks all rows
- 1 MED + 5 LOW aggregate findings filed in plan/CRITIQUE.md Pending
- docs/effects.md gained "Audit summary (Phase 79)" subsection
- plan/steps/01_build_plan.md Phase 79 row flipped [ ] → [x]

Decisions:
- D1: single-commit ship (audit-only)
- D2: aggregate findings by category, not per-id (56 individual rows
      would explode the queue)
- D3: Phase 80 baseline snapshot is load-bearing deliverable
- D4: audit lives in brief + docs/effects.md
- D5: no coverage backfill this phase
- D6: transitive coverage insufficient
- D7: no Knowledge-Gaps cross-link
- D8: Phase 80 keeps Tier 2 buff fumble/crit; removes only target-resist

Closes phase 79 promoted at oversight-19 2026-05-24.
```

## Definition of Done

- [ ] Brief file at `plan/phases/phase_79_general_effects_audit.md`
      committed with verdict tables inline.
- [ ] `docs/effects.md` gains "Audit summary (Phase 79)" subsection.
- [ ] `plan/CRITIQUE.md` gains 1 MED + 5 LOW aggregate Pending rows.
- [ ] `plan/steps/01_build_plan.md` Phase 79 row flipped `[ ]` → `[x]`
      with audit body inline.
- [ ] `npm run verify` passes.
- [ ] `npm run deploy:check` passes.

## Follow-ups (out of scope)

- Phase 80 (mechanic shift direction (a) pure split) ships next per
  the bundle order. D8 pre-resolves one ambiguity at brief drafting.
- Phase 83 (post-Phase-80 effect-application test sweep) absorbs the
  Tier 2 debuff coverage as its primary re-authoring scope.
- Phase 86 (equipment generation audit) closes the items-side of the
  mechanic-shift audit trio.
- /iterate drains the 5 LOW aggregate rows tick-by-tick (one category
  per commit). 5 commits, no risk to verify gate.
