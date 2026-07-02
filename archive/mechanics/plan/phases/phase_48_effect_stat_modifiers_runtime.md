# Phase 48 — Effect runtime: verify + document `statModifiers` + intensity scaling (KG Q8 / Q9)

> Re-scoped at /march dispatch time (2026-05-16). The Phase 48 candidate
> was promoted on the premise that `statModifiers` payloads were NOT
> applied at runtime (per KG Q8 / Q9). Investigation during brief
> generation found the opposite: `src/Combat/effect-modifiers.ts`
> already implements `getActiveEffectModifiers` (intensity-scaled
> aggregation) and `getEffectiveStats` (folds the aggregation into
> `derivedStats` + `nonCombatStats` + `defenseDelta`); `src/Combat/stats.ts`
> routes every `getAttackStat` / `getDefenseStat` / `getResistStat` /
> `getBaseStat` / `getSaveStat` call through `getEffectiveStats`.
> Intensity scaling is unconditional — every numeric modifier
> contributes `value × intensity`. The KG Q8 / Q9 wording is stale.
>
> This phase is therefore an **audit-honesty + coverage** phase, not
> net-new engine work. We pin the existing shipping behaviour with
> dedicated hermetic e2e cases (currently it's only tested
> indirectly via combat.engine.test.ts), update `docs/effects.md`
> Payload Field Reference to explicitly call out the runtime
> aggregation, and flip KG Q8 + Q9 from "Queued for Phase 48" to
> "Resolved (pre-loop)" with the same shipping references the
> Phase 47 sweep would have written had the codebase audit not
> stopped at the KG entry text.

## Outcome

- New hermetic e2e file `src/Combat/e2e/effect-stat-modifiers.engine.test.ts`
  pinning:
  - A `statModifiers: [{ stat: 'physicalAttack', value: 2 }]` buff bumps
    `getAttackStat(combatant, 'body')` by 2.
  - A `statModifiers: [{ stat: 'physicalDefense', value: -2 }]` debuff
    drops `getDefenseStat(combatant, 'body')` by 2.
  - A base-stat-targeted `statModifiers: [{ stat: 'body', value: 1 }]`
    buff re-derives every body-dependent derived stat.
  - Intensity scaling: the same `physicalAttack +2` buff at intensity 3
    bumps the attack stat by 6 (`value × intensity`).
  - A `defenseModifier` payload stacks with `statModifiers.physicalDefense`
    on `getDefenseStat` (the `defenseDelta` + derived split).
  - A multiplier-shaped `statModifiers: [{ stat: 'body', value: 1.5, isMultiplier: true }]`
    composes additively per Q3 (`final = base × (1 + (m - 1) × intensity)`).
- `docs/effects.md` Payload Field Reference gains an explicit
  "Runtime aggregation (pre-loop)" subsection naming the
  `getEffectiveStats` pipeline, the intensity-scaling rule, and the
  call-site list that consumes effective stats.
- `Knowledge-Gaps.md` Q8 + Q9 flip from "Queued for Phase 48" to
  "Resolved at Spec 01 / pre-loop. See `src/Combat/effect-modifiers.ts`."
- `plan/steps/01_build_plan.md` Phase 48 row flipped to `[x]` with a
  note about the re-scope.

## Source spec

- Build-plan row Phase 48 (`plan/steps/01_build_plan.md`).
- Promoted via `/oversight` 2026-05-16 (commit `c8cb53a`) as the
  third of the promote-multiple sequence 46 → 47 → 48.
- Expand pass 7 candidate (filed at `5b37528`) — premise was that
  `statModifiers` didn't apply at runtime. Investigation in this
  brief found otherwise (`src/Combat/effect-modifiers.ts` + `stats.ts`).
- Re-scoped at dispatch time. The audit-honesty path is the right
  Phase 48 because (1) the engine work is already shipped and (2)
  the KG entries needed flipping from "queued" to "resolved"
  anyway.

## Implementation units

### Unit 1 — Hermetic e2e + verify pin

**Files (new):**
- `src/Combat/e2e/effect-stat-modifiers.engine.test.ts` — 6 cases
  pinning the existing aggregation behaviour (see Outcome).

**Files (edited):**
- (none) — engine code is correct; tests just verify.

The cases follow the existing pattern in `src/Combat/effect-modifiers.test.ts`
but route through the higher-level `getAttackStat` / `getDefenseStat`
public surface (the existing file tests the internal helpers
directly). This gives the public stat-accessor path its own pinned
coverage and protects against future regressions if `stats.ts` is
refactored.

Commit: `test(combat): Phase 48 unit 1 — pin getEffectiveStats statModifiers + intensity aggregation`.

### Unit 2 — Docs + KG honesty + plan tick

**Files (edited):**
- `docs/effects.md` — append a "Runtime aggregation (pre-loop)"
  subsection to the Payload Field Reference. Cite the pipeline:
  `applyEffect` (rolls intensity / duration / resist) →
  `getActiveEffectModifiers` (one-pass aggregation) →
  `getEffectiveStats` (folds into effective stats) →
  `getAttackStat` / `getDefenseStat` / `getResistStat` /
  `getBaseStat` / `getSaveStat` (the call sites every combat-math
  read goes through). Note the unconditional intensity scaling
  and the additive multiplier composition (Q3).
- `Knowledge-Gaps.md` Q8 + Q9 — flip the "Queued for Phase 48"
  annotation to "**Resolved at Spec 01 (pre-loop). Verified at
  Phase 48 (`<hash>`).**" with the shipping reference.
- `plan/steps/01_build_plan.md` — flip Phase 48 `[ ]` → `[x]`
  with a note about the re-scope.

Commit: `docs(effects): Phase 48 unit 2 — Runtime aggregation subsection + KG Q8/Q9 honesty + plan tick`.

## Decisions made upfront — DO NOT ASK

- **Audit-honesty re-scope is the right call.** The engine work the
  candidate proposed is already shipped (`src/Combat/effect-modifiers.ts`
  is well-documented, well-tested via `effect-modifiers.test.ts`).
  Adding net-new code on top would either duplicate existing work or
  introduce churn for no gain. The KG entries needed correction
  anyway; doing it under a phase preserves the build-plan / KG /
  docs trail consistency.
- **No engine code changes.** `getEffectiveStats` stays exactly as
  it is. No new `intensityScalesStatModifiers?: boolean` toggle is
  added — the current "always-scaled" behaviour is the right
  default and the brief's proposed toggle was over-engineering for
  a problem that doesn't exist.
- **Tests routed through `stats.ts` accessors, not direct
  `getEffectiveStats` calls.** The internal helpers already have
  coverage in `effect-modifiers.test.ts`; what's missing is the
  consumer-facing accessor coverage. Phase 48 pins that surface.
- **No new exports.** The Phase 48 outcome is purely audit-and-pin;
  the public barrel surface stays unchanged.
- **KG entries flip to "Resolved (pre-loop)" with a Phase 48
  verification cite.** Mirrors the Phase 47 wording style: original
  question prose stays; resolution block appended.

## Verify gate

`npm run type-check && npm run lint && npm test && npm run build`.
Then `npm run deploy:check`.

## Definition of Done

- [ ] `src/Combat/e2e/effect-stat-modifiers.engine.test.ts` exists with at least 6 hermetic cases covering: derived-stat flat buff, derived-stat flat debuff, base-stat re-derivation, intensity scaling, `defenseModifier` + `statModifiers.physicalDefense` stack, multiplier composition.
- [ ] All 6 cases pass against the unchanged engine.
- [ ] `docs/effects.md` Payload Field Reference has a "Runtime aggregation (pre-loop)" subsection naming the pipeline and the call-site list.
- [ ] `Knowledge-Gaps.md` Q8 + Q9 annotations flipped from "Queued for Phase 48" to "Resolved at Spec 01 (pre-loop). Verified at Phase 48 (`<hash>`)."
- [ ] Phase 48 row in `plan/steps/01_build_plan.md` flipped to `[x]` with the re-scope note.
- [ ] `npm run verify` + `npm run deploy:check` green.

## Follow-ups (out of scope)

- **`docs/effects.md` count drift** (critique-19 LOW): the Buffs/Debuffs counts are still stale at 39/46 post-Phase-44. Separate iterate row.
- **Per-effect `intensityScalesStatModifiers` opt-out toggle** — currently every numeric modifier scales by intensity. If a future content author wants a binary "flat at any intensity" effect, file an iterate row to add the toggle. Today no live content needs it.
- **Negative regen path** (`healthDrain` aggregation, see Q10 resolution in Phase 47): partially shipped via `world-tick.ts`; in-combat negative regen is also threaded via `agg.healthDrain` here.
