# Phase 84 — Skill "fizzle" event + UX scrub post-Phase-80

> Prunes dead-code event variants and reframes docs language to
> match the post-Phase-80 always-land contract.

## Outcome

The `effect-rebounded` SkillEvent variant (dead code since Phase 80
removed Tier 2 debuff rebound) is removed from the discriminated
union. The `effect-resisted` variant — still live on the Tier 2 buff
fumble path — is renamed to `buff-fumbled` to reflect its actual
semantics. Docs and walkthroughs reframed.

## Source

`plan/PHASE_CANDIDATES.md` Promoted section, Phase 84 row — promoted
at oversight-20 2026-05-24. Original candidate filed at expand-23
(`8400ecc`).

## Sibling brief

`plan/phases/phase_80_skills_always_land_pure_split.md` — the mechanic
shift this phase cleans up after.

## Implementation units

### Unit 1 — Event surface scrub

**Files:** `src/Skills/skill.engine.ts`, `src/Combat/combat.resolver.ts`,
`src/Combat/phases/scenario.ts`, `src/index.ts` (if SkillEvent is
re-exported as a type — verify).

1. **Remove `effect-rebounded` variant** from:
   - `SkillEvent` union at `src/Skills/skill.engine.ts:281-284`
   - `SkillPhaseEvent` union at `src/Combat/combat.resolver.ts:137-138`
   - The emit site in `applySkillEffect` at `skill.engine.ts:606-621`
     (entire `if (result.rebounded && result.activeEffect)` block —
     this is dead code post-Phase-80; `resolveEffectApplication` never
     returns `rebounded: true` under the current contract).
   - The mapping case in `scenario.ts:730-731`
     (`case 'effect-rebounded': ...`).

2. **Rename `effect-resisted` → `buff-fumbled`** across:
   - `SkillEvent` union at `src/Skills/skill.engine.ts:276-280`
   - `SkillPhaseEvent` union at `src/Combat/combat.resolver.ts:134-136`
   - The emit site in `applySkillEffect` at `skill.engine.ts:624-630`
     (change `kind: 'effect-resisted'` → `kind: 'buff-fumbled'`).
   - The mapping case in `scenario.ts:727-729`
     (`case 'effect-resisted':` → `case 'buff-fumbled':`).

3. **Public barrel check**: `SkillEvent` is exported as a type from
   `src/index.ts`. The rename changes the discriminated-union shape —
   this is a **breaking change** for consumers pattern-matching on
   `'effect-resisted'`. Add to `CHANGELOG.md [unreleased] ### Changed`.

### Unit 2 — Docs + content scrub

**Files:** `docs/skills.md`, `docs/combat.md`, `docs/gameloop.md`,
`docs/effects.md`.

1. Walk each doc for references to:
   - "effect-resisted" → replace with "buff-fumbled"
   - "effect-rebounded" → remove (dead variant)
   - "fizzle" language describing effect-application miss on
     debuffs/Tier 3 → reframe: debuffs/Tier 3 always land; only
     Tier 2 buff fumble exists
   - Any "miss-on-effect-application" phrasing that implies debuff
     resistance → reframe

2. `docs/effects.md:75` already mentions `effect-resisted` /
   `effect-rebounded` as dead-code; update to reflect the rename +
   removal.

3. `CHANGELOG.md [unreleased] ### Changed` entry documenting the
   rename + removal.

### Unit 3 — Walkthrough update

**File:** `automation/scripts/walkthroughs/tier2-skill-chain.goal.md`

Lines 79-81 reference `effect-resisted` as a failure signal. Reframe:
the goal criterion should reference `buff-fumbled` (if it fires on the
Tier 2 buff path) or remove the criterion if it was only about the
now-dead debuff-resist path.

## Decisions made upfront — DO NOT ASK

- **D1 — Rename to `buff-fumbled` (not `effect-failed` or
  `skill-fumbled`).** The event fires specifically when a Tier 2 buff
  application fumbles on a Nat 1 caster roll. "buff-fumbled" captures
  both the scope (buff only) and the mechanic (fumble). Matches the
  existing `Fumble!` message string in resist.ts.

- **D2 — Remove `effect-rebounded` entirely (not deprecate).**
  Post-Phase-80 there is zero code path that returns
  `rebounded: true` from `resolveEffectApplication`. The variant is
  dead code. Keeping it as deprecated adds type-union noise for a
  discriminant that can never match. Clean removal.

- **D3 — Breaking change is acceptable.** The public-surface
  `SkillEvent` type union is consumed by `axiomancer-mobile` as a
  read-only pattern-match. A variant rename + removal in the minor
  0.11.x pre-1.0.0 line is acceptable per RELEASING.md deprecation
  policy. The CHANGELOG entry documents the change.

- **D4 — Dead rebound emit block removal scope.** The entire
  `if (result.rebounded && result.activeEffect)` block in
  `applySkillEffect` (including the `applyEffect` call on the
  rebound path + the `buff-rebounded` → `effect-rebounded` event
  push) is removed. The rebound stacking semantics no longer exist.

- **D5 — "fizzle" language in docs is fine for the buff-fumble path.**
  The word "fizzle" accurately describes a Tier 2 buff failing to
  apply due to caster fumble. Docs that use "fizzle" specifically
  about buffs are correct and stay. Docs that use "fizzle" or "miss"
  about debuffs/Tier 3 are stale and get reframed.

- **D6 — Single commit for all 3 units.** The rename + removal +
  docs + walkthrough are tightly coupled; splitting would leave
  intermediate states where docs reference non-existent event names.

## Verify gate

`npm run verify`. Expected: test count unchanged (738) since the
only consumer of these event kinds is the emit site (tests don't
pattern-match on `effect-resisted` or `effect-rebounded` — confirmed
via grep). tsc + tsc-alias clean. Public-surface fixture unchanged
(these are type-union members, not individually exported names).

## Commit body template

```
feat(events): Phase 84 shipped — fizzle event + UX scrub post-Phase-80

- Removed dead-code `effect-rebounded` SkillEvent variant (no emit
  path post-Phase-80; Tier 2 debuff rebound semantics removed)
- Renamed `effect-resisted` → `buff-fumbled` (Tier 2 buff fumble is
  the only surviving non-success path — name now reflects actual
  semantics)
- Docs reframed: docs/skills.md + docs/combat.md + docs/effects.md
  references to effect-resisted / effect-rebounded / debuff-fizzle
  updated to match post-Phase-80 always-land contract
- tier2-skill-chain.goal.md walkthrough criterion updated

Decisions:
- D1: renamed to buff-fumbled (not effect-failed or skill-fumbled)
- D2: removed effect-rebounded entirely (zero emit path post-Phase-80)
- D3: breaking change acceptable in pre-1.0.0 0.11.x line
- D4: dead rebound emit block + applyEffect call removed
- D5: "fizzle" language stays for buff-fumble context only
- D6: single commit for all units (tightly coupled)

BREAKING: SkillEvent union changes — `effect-resisted` renamed to
`buff-fumbled`; `effect-rebounded` removed. Consumers pattern-matching
on these discriminants must update.

Closes #<phase-issue-number>. Verify + deploy:check clean. 738/738 tests.
```

## Definition of Done

- [ ] `effect-rebounded` variant removed from SkillEvent + SkillPhaseEvent.
- [ ] Dead rebound emit block removed from `applySkillEffect`.
- [ ] Dead rebound mapping case removed from `scenario.ts`.
- [ ] `effect-resisted` renamed to `buff-fumbled` across emit + type + mapping.
- [ ] Docs reframed (skills, combat, effects).
- [ ] Walkthrough updated.
- [ ] `CHANGELOG.md [unreleased] ### Changed` entry.
- [ ] `npm run verify` passes (738 tests unchanged).
- [ ] `npm run deploy:check` passes.

## Follow-ups (out of scope)

- The `docs/effects/buffs/*.md` individual effect docs use "fizzle"
  language correctly (buff context) — no change needed.
- Mobile consumer (`axiomancer-mobile`) will need to update any
  pattern-match on `SkillEvent.kind` after bumping the engine
  dependency past this commit.
- The `Effect` type's `resistedBy` / `resistDR` fields are now
  only load-bearing for the Tier 2 buff caster roll DR (which
  doesn't actually use them — it's a flat d20). Removing those
  fields is a separate candidate (broader schema cleanup).
