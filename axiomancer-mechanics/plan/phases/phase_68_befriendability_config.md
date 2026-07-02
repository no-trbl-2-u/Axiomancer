# Phase 68 — Befriending mechanic v2: per-enemy `BefriendabilityConfig`

> User design-pass at oversight-11 (2026-05-20) locked design path (a)
> per-enemy `BefriendabilityConfig` — the other four directions
> ((b) HP reverse-gate, (c) skill-driven, (d) multi-stage, (e) resource-cost)
> were rejected at the same pass. This brief picks the exact predicate
> semantics, the AND-composition rule, and the Coastal Tyrant config.

## Outcome

`Enemy.befriendabilityConfig?: BefriendabilityConfig` optional field shipped.
When absent, the Phase 36 mechanic (`friendshipCounter >= FRIENDSHIP_COUNTER_MAX`
→ friendship outcome) remains unchanged. When present, all named predicates
AND-compose: friendship eligibility requires the per-enemy `roundsThreshold`
(or the global default), the `hpGate`, the `requiredStances` and
`requiredSkillUse` lists to ALL pass. Coastal Tyrant is the first authored
config (the boss-tier validation case). Hermetic e2e covers all four
predicate axes plus the AND-composition contract.

## Engine primitive — `BefriendabilityConfig` shape (D1)

```typescript
import { Stance } from '../Combat/types';

/**
 * Phase 68 — per-enemy override on the Phase 36 friendship-eligibility
 * predicate. ALL present predicates AND-compose; eligibility requires
 * every named predicate to pass simultaneously. When the field is
 * absent, the Phase 36 mechanic stays unchanged
 * (`friendshipCounter >= FRIENDSHIP_COUNTER_MAX` -> friendship).
 *
 * Authors leave predicates undefined when they don't apply (e.g. low-tier
 * enemies that only need the rounds threshold drop the other three fields).
 */
export interface BefriendabilityConfig {
    /**
     * Override for the both-defend round count required. Defaults to the
     * global `FRIENDSHIP_COUNTER_MAX` (Phase 36) when absent.
     */
    roundsThreshold?: number;
    /**
     * Friendship eligibility requires `enemy.health / enemy.maxHealth`
     * to be at or below `belowPct` at the eligibility check. Pure
     * snapshot — does NOT require the player to be the one who dealt
     * the damage. Range [0, 1].
     */
    hpGate?: { belowPct: number };
    /**
     * Friendship eligibility requires the player to have used AT LEAST
     * ONE of the named stances during combat (existential, not universal).
     * Derived by scanning `state.log[].playerAction.stance`.
     * Empty array is treated as "no requirement" (same as undefined).
     */
    requiredStances?: Stance[];
    /**
     * Friendship eligibility requires the player to have cast AT LEAST
     * ONE of the named skill IDs during combat (existential, not universal).
     * Derived by scanning `state.log[].playerAction` for
     * `action === 'skill'` with matching `skillId`.
     * Empty array is treated as "no requirement" (same as undefined).
     */
    requiredSkillUse?: string[];
    /**
     * Explicit "fall through to Phase 36 mechanic". When set, the engine
     * treats this config as if the field were absent — useful for authoring
     * clarity ("this enemy was explicitly considered and uses defaults").
     * Other fields on the same config are ignored when this is set.
     */
    defaultFallback?: 'both-defend-cap';
}
```

## Engine semantics (D2 — AND-composition + late-resolution)

- New helper `isFriendshipEligible(state: CombatState): boolean` in
  `src/Combat/index.ts` (canonical home for combat-end predicates,
  alongside `determineCombatEnd` + `isCombatOngoing`).
- `isFriendshipEligible` reads `state.enemy.befriendabilityConfig`
  and runs the predicate set:
  - `defaultFallback === 'both-defend-cap'` OR config undefined →
    `friendshipCounter >= FRIENDSHIP_COUNTER_MAX` (Phase 36 mechanic
    unchanged).
  - Otherwise: AND-compose `roundsThreshold`, `hpGate`, `requiredStances`,
    `requiredSkillUse` per the field semantics in D1. `roundsThreshold`
    falls back to `FRIENDSHIP_COUNTER_MAX` when absent on a config that
    sets other fields (so an `hpGate`-only config still requires the
    global counter cap).
- `determineCombatEnd` returns `'friendship'` when both alive AND
  `isFriendshipEligible(state)` returns true. The old check
  `friendshipCounter >= FRIENDSHIP_COUNTER_MAX` is replaced by this call.
- `isCombatOngoing` returns false when `isFriendshipEligible(state)` is
  true (so the loop exits) — using the same helper keeps the two
  predicates in lockstep. **No silent contradictions where counter
  caps but friendship doesn't trigger.**
- `friendshipCounter` itself still increments freely on both-defend
  rounds (per Phase 36); the increment is unchanged in
  `src/Combat/phases/scenario.ts`. Late-resolution means a player can
  "bank" defends, but friendship doesn't trigger until ALL predicates
  pass. This matches the design intent: "show your strength, then offer
  peace" is one valid path (`hpGate` pulls a damage-dealer arc into
  range), but per-enemy authoring can also gate on stance use or skill
  use without requiring damage progression.

## Coastal Tyrant config (D3 — boss-tier validation case)

```typescript
befriendabilityConfig: {
    hpGate: { belowPct: 0.4 },
    requiredStances: ['heart'],
    roundsThreshold: 5,
},
```

- `hpGate: { belowPct: 0.4 }` — the magistrate-fallen-priest's
  friendship arc opens only after he's been brought low. Maps to
  "the priest who lost his god" reading of his alignment
  (`faith-pessimistic-transcendent`).
- `requiredStances: ['heart']` — heart is the empathetic stance; the
  player must have shown empathy at least once. Note: real `Stance`
  type is `'heart' | 'body' | 'mind'`; the oversight commit's preview
  used `'mercy'` as illustrative shorthand — actual config uses
  `'heart'`.
- `roundsThreshold: 5` — same as `FRIENDSHIP_COUNTER_MAX` today
  (defined in Phase 36); kept explicit on the config for authoring
  legibility. Increases to a higher value can land in a follow-up
  balance pass.

`Enemy.friendshipReward` is intentionally left unset on Coastal Tyrant
in Phase 68 — the reward-content side ships in the Boss-tier
befriendable enemy candidate's phase (currently blocked-by this one).
Phase 68 ships the mechanism + one authored config; the boss-tier
content phase ships the reward.

## Implementation units

### Unit 1 — Engine primitive + wire-in

**Files:**
- `src/Enemy/types.ts` — new `BefriendabilityConfig` interface
  (above) + optional `Enemy.befriendabilityConfig?: BefriendabilityConfig`
  field on the `Enemy` interface.
- `src/Enemy/index.ts` — `BefriendabilityConfig` re-exported.
- `src/index.ts` — `BefriendabilityConfig` re-exported under the
  Enemy block.
- `src/Combat/index.ts` — new `isFriendshipEligible(state)` helper;
  `determineCombatEnd` and `isCombatOngoing` updated to call it.
- `src/Combat/index.ts` (or co-located helper file under
  `src/Enemy/`) — small `getPlayerStancesUsed(state)` /
  `getPlayerSkillsCast(state)` derivation helpers if a clean unit
  surface helps test isolation. Keep them internal unless a test or
  another module needs them.
- `scripts/public-surface.expected.json` — regenerate (+1 type:
  161 -> 162). No new runtime exports.

**Hermetic coverage** lands with Unit 1 — colocated at
`src/Enemy/e2e/befriendability-config.engine.test.ts`. Cases:

1. **Field absent → Phase 36 mechanic intact.** Build a `CombatState`
   with `friendshipCounter === FRIENDSHIP_COUNTER_MAX` and no
   `befriendabilityConfig`; assert `isFriendshipEligible` returns
   true and `determineCombatEnd` returns `'friendship'`.
2. **`defaultFallback: 'both-defend-cap'` → Phase 36 mechanic intact**,
   other predicates ignored (so a config with `hpGate` AND
   `defaultFallback` set behaves as if `hpGate` is not present).
3. **`hpGate` enforcement.** Config = `{ hpGate: { belowPct: 0.4 } }`.
   Two sub-cases: enemy at 50% HP + counter capped → ineligible;
   enemy at 30% HP + counter capped → eligible.
4. **`requiredStances` enforcement.** Config =
   `{ requiredStances: ['heart'] }`. Log without any heart-stance
   `playerAction` → ineligible. Log with at least one heart-stance
   round → eligible.
5. **`requiredSkillUse` enforcement.** Config =
   `{ requiredSkillUse: ['palm-strike'] }`. Log without the skill
   cast → ineligible. Log with one `palm-strike` cast → eligible.
6. **AND-composition.** Config combining `hpGate` + `requiredStances`
   + `requiredSkillUse` + custom `roundsThreshold`. Test the matrix:
   passing all → eligible; failing exactly one (each axis tested) →
   ineligible.
7. **`roundsThreshold` override on its own.** Config =
   `{ roundsThreshold: 3 }`. Counter = 3 → eligible; counter = 2 →
   ineligible. (Lower threshold than `FRIENDSHIP_COUNTER_MAX` so the
   override actually flips the eligibility.)
8. **`isCombatOngoing` and `determineCombatEnd` agree.** Pin them at
   the same eligibility frontier for a config that defers friendship
   past the global counter cap.

### Unit 2 — Author Coastal Tyrant config + befriend-engine integration test

**Files:**
- `src/Enemy/enemy.library.ts` — `CoastalTyrant` gains the
  `befriendabilityConfig` per D3 (above). No `friendshipReward` is
  authored yet (that's the boss-tier follow-up).
- `src/Game/e2e/befriend.engine.test.ts` — extends the existing
  describe block with a Phase 68 case driving combat through the
  Coastal Tyrant path: log built with at least one heart-stance
  round, enemy HP scripted below 40%, counter capped at 5 →
  `outcome === 'friendship'`. Also one negative case: enemy at full
  HP, counter capped → friendship does NOT trigger (combat
  continues). Use existing test scaffolding patterns from the file.

### Unit 3 — Docs + CHANGELOG + plan tick

**Files:**
- `docs/combat.md` — Friendship Path subsection gains a "Per-enemy
  predicate (Phase 68 — `BefriendabilityConfig`)" block: the four
  predicate axes, the AND-composition rule, the `defaultFallback`
  escape hatch, and a code-fenced Coastal Tyrant authoring example.
- `docs/enemy.md` — "Befriendable enemies (Phase 60)" table gains a
  "BefriendabilityConfig (Phase 68)" column noting Coastal Tyrant's
  new entry; MournfulGull + HollowEyedBeggar rows note "default
  Phase 36 mechanic" in the new column (no config authored — they
  stay on the simple both-defend cap).
- `plan/bearings.md` — Enemy public-API block gains
  `BefriendabilityConfig (Phase 68)` on the same line as the
  Phase 60 `FriendshipReward` entry.
- `CHANGELOG.md` `[unreleased]` `### Added` — Phase 68 bullet:
  `BefriendabilityConfig` type + `Enemy.befriendabilityConfig?` +
  `isFriendshipEligible` helper. `### Changed` — Coastal Tyrant
  gains a befriend predicate (boss-tier validation example).

## Decisions made upfront — DO NOT ASK

- **D1** — Unified `BefriendabilityConfig` shape above; single
  optional field on `Enemy`. Smallest engine touch; the predicate
  evaluation is a pure function of `CombatState`.
- **D2** — Eligibility check is **late-resolution**: counter
  increments freely; friendship triggers when ALL predicates pass.
  `isFriendshipEligible` is the single decision point; both
  `determineCombatEnd` and `isCombatOngoing` call it.
- **D3** — Coastal Tyrant config locked at `{ hpGate: { belowPct: 0.4 },
  requiredStances: ['heart'], roundsThreshold: 5 }`. Real `Stance`
  type is `'heart' | 'body' | 'mind'`; oversight's `'mercy'` preview
  was illustrative shorthand.
- **D4** — Predicates compose with **logical AND** (universal across
  axes); within a single axis the list-valued predicates
  (`requiredStances`, `requiredSkillUse`) use **existential** match
  (at least one). Documented in the type's JSDoc.
- **D5** — `requiredStances` and `requiredSkillUse` derive from
  `state.log[].playerAction` — no new tracking state on `CombatState`.
  The log already captures stance per round and `skillId` for
  `action === 'skill'`.
- **D6** — Empty list (`requiredStances: []`) is treated as "no
  requirement" (same as `undefined`). Authoring clarity: prefer
  `undefined` for "doesn't apply"; an empty array is a valid no-op
  but typically points to a stale config that should drop the field.
- **D7** — `roundsThreshold` falls back to the global
  `FRIENDSHIP_COUNTER_MAX` when absent on a config that sets other
  fields. So an `hpGate`-only config still requires the global counter
  cap; this preserves the Phase 36 baseline.
- **D8** — `defaultFallback: 'both-defend-cap'` makes other fields a
  no-op for THIS enemy. Useful for authoring intent ("explicitly
  considered, uses defaults"). The string-singleton type leaves room
  for future fallback values without breaking the field.
- **D9** — `hpGate` is a snapshot at the eligibility check, not a
  "must have crossed" gate. Healing back above the threshold un-
  qualifies eligibility. Simpler semantics; matches the design pass
  preview literally.
- **D10** — No `friendshipReward` is authored on Coastal Tyrant in
  Phase 68. The reward-content side ships in the Boss-tier befriendable
  enemy candidate's phase (currently blocked-by Phase 68 per the
  oversight-11 framing).
- **D11** — `isFriendshipEligible` is **not** exported on the public
  barrel. The engine surface stays at `determineCombatEnd` +
  `isCombatOngoing`; the new helper is an internal predicate. Avoids
  growing the public-API for an internal-only check.
- **D12** — Three commits per the unit split + a fourth ship-row flip
  commit. Phase mirror via `loop-issue.mjs` is best-effort per the
  ship-a-phase contract.

## Verify gate

- `npm run type-check` — clean (Stance type re-import from
  `../Combat/types` in `src/Enemy/types.ts`; minor; no cycles).
- `npm test` — must stay green + new cases land.
- `npm run build` — clean.
- `npm run deploy:check` — fixture refreshed in Unit 1 (161 → 162
  types).

## Definition of Done

- [ ] `BefriendabilityConfig` interface shipped on `src/Enemy/types.ts`
      with all five fields documented.
- [ ] `Enemy.befriendabilityConfig?: BefriendabilityConfig` optional
      field added.
- [ ] `isFriendshipEligible` helper implemented in `src/Combat/index.ts`
      (internal; not on the barrel).
- [ ] `determineCombatEnd` + `isCombatOngoing` updated to call it.
- [ ] Coastal Tyrant authored with the locked config (D3).
- [ ] Hermetic e2e at `src/Enemy/e2e/befriendability-config.engine.test.ts`
      covers all 8 cases above.
- [ ] `src/Game/e2e/befriend.engine.test.ts` extended with Phase 68
      Coastal Tyrant integration cases (positive + negative).
- [ ] Fixture regenerated (+1 type; values unchanged).
- [ ] `docs/combat.md` Friendship Path Phase 68 block.
- [ ] `docs/enemy.md` befriendable-enemies table grows the
      `BefriendabilityConfig (Phase 68)` column.
- [ ] `plan/bearings.md` Enemy line gains the Phase 68 surface.
- [ ] `CHANGELOG.md [unreleased]` ### Added + ### Changed Phase 68
      entries.
- [ ] `npm run verify` + `npm run deploy:check` green.
- [ ] Build plan Phase 68 row flips `[ ]` → `[x]`.

## Follow-ups (out of scope)

- Boss-tier befriendable enemy reward-content phase (currently a
  Pending candidate; blocked-by THIS phase). When Phase 68 lands,
  that follow-up authors Coastal Tyrant's `friendshipReward` (multi-
  paragraph narrative + 2-3 guaranteed items + maybe `alignmentDelta`
  on the `FriendshipReward` shape).
- Per-skill `incrementsFriendship?: number` payload extension (option
  (c) from the original candidate; rejected at oversight-11). Still
  authorable as a future skill-payload extension if a downstream
  content arc wants it.
- Crossed-threshold semantics on `hpGate` (instead of D9 snapshot —
  e.g. "must have been below X% at some point"). Would need new
  tracking state on `CombatState`; defer until a content arc needs
  the distinction.
- Universal-match (`requiredStances` all-of, not at-least-one). Defer
  until a config needs it; existential matches the design intent
  for now.

## Canonical sibling

Phase 60 (`7724c96 + 6e03871 + b13348b`) — added
`Enemy.friendshipReward?: FriendshipReward` + per-enemy authoring
+ docs + CHANGELOG. Phase 68 follows the same shape: a single
additive optional field on `Enemy` + an engine-side reader + one
authored example to validate the shape. The Phase 60 commits are
the closest model for the docs + bearings + fixture-bump pattern.
