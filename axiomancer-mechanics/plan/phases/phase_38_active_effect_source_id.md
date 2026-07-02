# Phase 38 — `ActiveEffect.sourceId` wiring for player-applied effects

> Thread `sourceId` through every `applyEffect` call on the combat /
> skill path so a debuff on the player from the enemy's proc carries
> `sourceId === enemy.id`, a buff the player puts on themselves carries
> `sourceId === player.id`, and every save / load round-trips the
> attribution faithfully. Closes the Phase 35 follow-up.

## Outcome

- `ApplyEffectOptions` gains `sourceId?: string`.
- `applyEffect` writes the `sourceId` onto the new ActiveEffect (and
  preserves an existing one when stacking).
- Six combat / skill call sites supply a real sourceId:
  - `src/Skills/skill.engine.ts` × 3 (rebound, main, buff-convert) —
    all set `sourceId = player.id` since the caster is always the
    player on the skill path.
  - `src/Combat/combat-effects.ts` × 3 (proc primary, proc rebound,
    fumble) — set `sourceId = actor.id` (`Character | Enemy`), the
    side whose action triggered the proc.
- `src/World/MapEvents/handlers.ts` hazard application leaves
  `sourceId` undefined (environmental — no combatant). Decision
  captured below.
- `src/Combat/resist.ts` is NOT a call site — its three `ActiveEffect`
  constructions (`critEffect`, `reboundEffect`, `overwhelmedEffect`)
  are `{ ...activeEffect, … }` spreads that preserve any existing
  `sourceId`. The brief's mention of `resist.ts:57/82/94` is recorded
  here as "already conformant; spreads forward the field."
- Hermetic e2e pins three invariants:
  1. A player-applied DoT carries `sourceId === player.id` after the
     skill resolves.
  2. The same DoT round-trips through `SAVE_GAME` → `LOAD_GAME` with
     `sourceId` preserved.
  3. An enemy-proc-applied debuff on the player carries
     `sourceId === enemy.id`.

## Source spec

- Build-plan row Phase 38 (`plan/steps/01_build_plan.md:61`).
- Knowledge-Gaps Q12 (closed by Phase 35) named the prerequisite —
  `Character.id` — and explicitly punted the attribution wiring.
- The Phase 35 build-plan row notes the audit: "no player-applied-
  effect sites currently set sourceId, so wiring those is a future
  task."
- `plan/PHASE_CANDIDATES.md` Promoted block for Phase 38 (2026-05-16
  oversight) lists the audited call sites — note that the brief
  there mentioned `src/Combat/resist.ts:57/82/94` and
  `src/Combat/effects.ts:113`; both turn out to be non-call-sites
  on re-audit (resist.ts spreads only; `Combat/effects.ts` has no
  `applyEffect` call — the actual sites live in
  `Combat/combat-effects.ts`).

## Implementation units

### Unit 1 — Extend `ApplyEffectOptions` + thread through `applyEffect`

**File:** `src/Effects/index.ts`.

Add `sourceId?: string` to the `ApplyEffectOptions` interface (with a
JSDoc line). In `applyEffect`, in three branches:

1. **First-application** (`if (!existing)`): set
   `newEffect.sourceId = options?.sourceId`.
2. **`intensity`-stacking** (`case 'intensity'`): preserve
   `existing.sourceId` by default; **override** when `options.sourceId`
   is supplied (so a fresh proc replaces the attribution — last writer
   wins, matches the way intensity replaces).
3. **`duration`-stacking** (`case 'duration'`): same preserve-then-
   override policy.
4. **`refresh`** (if present): same.

Co-located test `src/Effects/effects.engine.test.ts` (existing file)
gains four cases: first-application stores sourceId; intensity-stack
override; duration-stack override; absent option leaves field as
existing-or-undefined.

Commit: `feat(effects): Phase 38 unit 1 — thread sourceId through applyEffect`.

### Unit 2 — Wire call sites

**`src/Skills/skill.engine.ts`** — three call sites:

```ts
// Line ~447 (rebound)
applyEffect(player.effects, effect, round, {
    ...buildApplyOptions(reboundIntensity, reboundDuration),
    sourceId: player.id,
});

// Line ~473 (main application)
applyEffect(target.effects, effect, round, {
    ...buildApplyOptions(appliedIntensity, appliedDuration),
    sourceId: player.id,
});

// Line ~574 (buff-convert onto player)
applyEffect(player.effects, effect, round, {
    intensityDelta: removed.intensity ?? 1,
    durationDelta:  removed.remainingDuration,
    sourceId:       player.id,
});
```

The skill caster is always the player in this codebase — there is no
enemy-skill path today. If that ever changes, the call sites would
take a `caster: Combatant` argument; for now `player.id` is the
correct attribution.

**`src/Combat/combat-effects.ts`** — three call sites:

```ts
// applyProcOutcome, primary application (~line 320)
applyEffect(targetEffects, effect, round, {
    intensityDelta, durationMode: 'additive', durationDelta,
    sourceId: actor.id,
});

// applyProcOutcome, rebound application (~line 367)
applyEffect(reboundEffects, effect, round, {
    intensityDelta: resolveResult.activeEffect.intensity ?? intensityDelta,
    durationMode: 'additive', durationDelta,
    sourceId: actor.id,
});

// applyFumbleOutcome (~line 407) — needs the actor param threaded in.
applyEffect(actorEffects, fumble.effect, round, { sourceId: actor.id });
```

`applyFumbleOutcome` currently has signature
`(fumble, actorEffects, round)` — it does not know who the actor is.
**Decision:** extend the signature to
`(fumble, actorEffects, round, actorId?)`. Callers pass it through; if
absent, no sourceId is written (back-compat). Audit + update callers
of `applyFumbleOutcome` in the same commit.

**`src/World/MapEvents/handlers.ts`** — hazard:

Hazards are environmental. **Decision:** leave `sourceId` undefined.
The semantic of "who applied this DoT?" is "the world", not a
combatant. Document this in the handler with an inline comment so a
future reader knows the omission is deliberate, not an oversight.

Commit: `feat(combat,skills): Phase 38 unit 2 — wire sourceId at applyEffect call sites`.

### Unit 3 — Hermetic e2e + docs + DoD

**New file:** `src/Effects/e2e/source-id.engine.test.ts` (or extend an
existing file — `effects.engine.test.ts` has no save/load coverage, so
a new file is cleaner).

Cases:
1. Player applies a Tier 1 DoT to an enemy via a skill →
   `enemy.effects[0].sourceId === player.id`.
2. Same flow on a self-buff → `player.effects[…].sourceId === player.id`.
3. Enemy-proc applies a debuff onto the player →
   `player.effects[…].sourceId === enemy.id`.
4. SAVE_GAME → LOAD_GAME round-trips the field unchanged (serialise
   via `JSON.stringify` then re-hydrate the relevant ActiveEffect; the
   field is plain-string so persistence is automatic — the test exists
   to PIN that JSON-round-trip behaviour against future schema drift).
5. Equipment-applied passive (existing `src/Character/equipment.reducer.ts`
   path) still carries `sourceId === item.id` — regression guard for
   the only pre-Phase-38 setter.

**Docs:**
- `docs/effects.md` (or `docs/effects/README.md`) — short
  "Attribution" subsection naming the `sourceId` field, the convention
  (player.id on skill path, actor.id on proc path, item.id on
  equipment passives, undefined on environmental hazards), and a
  cross-link to `ActiveEffect` in `src/Effects/types.d.ts`.
- `docs/character.md` — mention that `Character.id` now flows into
  effect attribution.
- Knowledge-Gaps.md — mark Q12 fully closed (was "mechanically resolved"
  in Phase 35; Phase 38 closes the attribution half).

**Plan tick:** flip Phase 38 `[ ]` → `[x]` with summary + commit hash
in `plan/steps/01_build_plan.md`.

Commit: `test(effects): Phase 38 unit 3 — hermetic source-id coverage + docs`.

## Decisions made upfront — DO NOT ASK

- **Skill path: `sourceId = player.id` everywhere.** The caster is
  always the player in this codebase (`skill.engine.ts` takes a
  `player: Character` param; there is no `executeSkill(caster: …)`).
  Future enemy-skill work would change this, but it's not a Phase 38
  concern.
- **Proc rebound `sourceId = actor.id`, not `target.id`.** The
  rebound is a consequence of the actor's action; the attribution
  follows the agent who triggered the chain, not the reflector. This
  matches the "who caused this effect" semantics consumers care about
  (UI question: "why did I just get poisoned?" — answer is "the
  enemy attacked you," not "you reflected their attack").
- **Stacking override policy: last-writer-wins.** When an existing
  effect stacks (`intensity` / `duration`), the new `sourceId` from
  the fresh `applyEffect` call replaces the existing one. Rationale:
  if the player gets stunned by enemy A, then re-stunned by enemy B
  before the stun expires, the live attribution should be B (the most
  recent applier). Preserves the existing field when the new call
  doesn't supply one.
- **Hazard / environmental application: `sourceId` left undefined.**
  Hazards are not combatants and don't have a stable id; the spec
  doesn't define a synthetic id schema (e.g. `hazard:<node-id>`). A
  future iterate row can introduce one if a consumer needs to
  distinguish hazards. Inline comment documents the omission.
- **`applyFumbleOutcome` signature extended with an optional
  `actorId?` parameter** rather than refactoring the function to
  take a full `Combatant` actor. Less invasive; the function only
  needs the id; back-compat with any existing call site that doesn't
  pass it.
- **No barrel changes.** `applyEffect` / `ApplyEffectOptions` already
  on the public surface; adding a field is additive (Hard Rule 9
  honoured).
- **`resist.ts` is NOT touched.** Its three ActiveEffect spreads
  preserve `sourceId` because the field is plain data. No bug; the
  Phase candidate's mention was a re-audit miss.

## Verify gate

`npm run verify` — type-check + lint + test + build. The verify gate
must pass between each unit commit.

## Commit body template

```
feat(<scope>): Phase 38 unit <N> — <one-line>

- <bullet 1>
- <bullet 2>

Decisions:
- <design call>
```

## Definition of Done

- [ ] `ApplyEffectOptions` carries an optional `sourceId: string` field.
- [ ] `applyEffect` writes `sourceId` onto new effects and preserves
  (or overrides on supply) on stacking.
- [ ] All three `skill.engine.ts` applyEffect call sites pass
  `sourceId: player.id`.
- [ ] All three `combat-effects.ts` applyEffect call sites pass
  `sourceId: actor.id` (the new `applyFumbleOutcome.actorId?` arg
  threads through).
- [ ] Hazard handler in `MapEvents/handlers.ts` documents the
  environmental sourceId omission inline.
- [ ] `src/Effects/e2e/source-id.engine.test.ts` covers the five
  cases listed in Unit 3.
- [ ] `docs/effects.md` (or `docs/effects/README.md`) names the
  attribution convention.
- [ ] `Knowledge-Gaps.md` Q12 marked fully closed (attribution half).
- [ ] Phase 38 row in `plan/steps/01_build_plan.md` flipped to `[x]`.

## Follow-ups (out of scope)

- Enemy-skill path (when / if it lands) — the skill engine grows a
  `caster: Combatant` arg and the three call sites read `caster.id`.
- Environmental hazard `sourceId` schema (e.g. `hazard:<node-id>`) —
  file as iterate row if a consumer needs the distinction.
- UI affordance reading `sourceId` (e.g. "Stunned by Coastal Tyrant"
  in the CLI Effects render) — not engine work.
