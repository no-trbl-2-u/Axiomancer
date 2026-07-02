# Phase 45 — Enemies-by-alignment AI tuning

> Phase 42 follow-up #3 (final of the promoted-multiple sequence
> 43 → 44 → 45). Makes the `bearings.md` tonal commitment
> ("Enemies are embodiments of logical fallacies. Effect names
> reference philosophical paradoxes.") mechanically real: every
> authored enemy gets pinned to a cell in the 27-cell library,
> and `decideEnemyAction` biases the basic-action choice by the
> enemy's outlook bucket. The cube now reads from the enemy side
> too — Phase 43 wired it to the player; Phase 44 gave the player
> philosophical payloads; Phase 45 closes the loop.

## Outcome

- `Enemy.philosophicalAlignment?: PhilosophicalAlignment` exists.
  Optional — legacy enemies without a pin still work.
- Every authored entry in `src/Enemy/enemy.library.ts` (the 16 in
  `ENEMY_REGISTRY` today) carries a `philosophicalAlignment` value
  set to thematically-appropriate axis triples. Cell coverage spans
  several quadrants of the cube; not every cell is filled (16 enemies
  vs 27 cells), but the existing roster lands at cells consistent
  with each enemy's flavour.
- `decideEnemyAction` accepts the enemy's alignment implicitly via
  the `enemy` parameter and applies an outlook-based bias to the
  basic-action choice AFTER the per-logic dispatch returns. The bias
  is RNG-driven (one `getRng().random()` call), pure, and a no-op
  when alignment is unset or outlook is in the `mid` bucket.
- Hermetic e2e pins the bias direction against `mockSequentialRng`:
  pessimistic enemies who would attack sometimes defend; optimistic
  enemies who would defend sometimes attack; mid-bucket enemies
  never flip.
- `docs/enemy.md` gains an "Alignment-driven AI tuning (Phase 45)"
  subsection covering the field, the bias rule, and the cell pins
  per authored enemy.
- Phase 45 row in the build plan flips to `[x]`.

## Source spec

- Build-plan row Phase 45 (`plan/steps/01_build_plan.md:67`).
- Promoted via `/oversight` 2026-05-16 (commit `6966461`) as the
  third Phase 42 follow-up.
- `plan/phases/phase_42_philosophical_alignment.md` Follow-ups —
  "Enemies-by-alignment AI tuning" item names the scope.
- `plan/bearings.md` Visual & tonal defaults — "Enemies are
  embodiments of logical fallacies" tonal commitment. Phase 45
  makes it mechanically real.
- Mirrors the existing per-strategy logic functions in
  `src/Enemy/enemy.logic.ts` — the bias hooks AFTER the per-logic
  decision rather than replacing it, so all 6 existing strategies
  keep their semantics.

## Implementation units

### Unit 1 — `Enemy.philosophicalAlignment` field + library backfill

**Files (edited):**
- `src/Enemy/types.d.ts` — add `philosophicalAlignment?: PhilosophicalAlignment`
  on `Enemy`.
- `src/Enemy/enemy.library.ts` — set `philosophicalAlignment` on every
  authored entry in `ENEMY_REGISTRY`.

**Cell-pin table (16 authored enemies):**

| Enemy | Cell id | PDF # | Rationale |
|---|---|---|---|
| `TidepoolCrab` | `mid-mid-individual` | 13 (Montaigne / Ishmael) | Skeptical observer, instinctive self-preservation; thinks little, exists nakedly. |
| `SeaMistWisp` | `mid-mid-transcendent` | 15 (Lao Tzu / Siddhartha) | Drifting form-without-form; nothing-and-everything. Taoist by accident. |
| `LullabyMoth` | `faith-optimistic-individual` | 19 (Kierkegaard / Alyosha) | Trusts the lullaby; sings what it believes is true. |
| `Disatree_01` | `mid-pessimistic-relational` | 17 (Zapffe / Ahab) | Friendship-counter exit demo; pessimistic but reaches outward. |
| `WetHound` | `logic-pessimistic-individual` | 7 (Schopenhauer / Underground Man) | Snarling Will-to-live; suffering as fact. |
| `MournfulGull` | `mid-pessimistic-individual` | 16 (Cioran / Hamlet) | Despair through observation; antinatalist plumage. |
| `ForestSprite` | `mid-optimistic-individual` | 10 (Rorty / Huck Finn) | Skeptical of dogma, hopeful in mischief. |
| `HollowEyedBeggar` | `faith-pessimistic-relational` | 26 (Mainländer / Ferreira) | Faith-rooted suffering in community; apostatising. |
| `ArgumentativeCrow` | `logic-optimistic-individual` | 1 (Nietzsche / Prometheus) | The strong belief; the corvid that always wins the debate. |
| `TideflukeReaver` | `logic-pessimistic-relational` | 8 (Ligotti / Rust Cohle) | Hardened nihilist who fights alongside its pack. |
| `HushWraith` | `mid-pessimistic-transcendent` | 18 (Lovecraft / Burroughs) | Cosmic indifference made visible; the silent gap. |
| `HollowSaint` | `faith-mid-transcendent` | 24 (St. John of the Cross / Rodrigues) | Dark night of the soul wearing a halo. |
| `CoastalTyrant` | `faith-pessimistic-transcendent` | 27 (Marcion / Grand Inquisitor) | Demiurge tyranny over coastal flesh; the boss. |
| `TheDisagreement` | `logic-neutral-individual` | 4 (Camus / Meursault) | Argument that refuses synthesis; rebellion against meaning. |
| `EchoOfPyrrhonia` | `mid-mid-individual` | 13 (Montaigne / Ishmael) | Skeptic-by-name; suspends every claim. |
| `Sandbag_01` | `mid-mid-relational` | 14 (Buber / Carraway) | Testing dummy at dead-centre neutral; the witness. |

Two pairs share a cell (TidepoolCrab + EchoOfPyrrhonia at `mid-mid-individual`; this is intentional — both express the same archetype at different tiers). 13 distinct cells used out of 27; the remaining cells are headroom for future enemies.

**Tests (Unit 1):**

Extend `src/Enemy/e2e/enemy.engine.test.ts` (or add a sibling file
`src/Enemy/e2e/alignment.engine.test.ts`) with 2 cases:

1. Every entry in `ENEMY_REGISTRY` has a `philosophicalAlignment`
   field set and each axis is an integer in `[-100, +100]`.
2. Every authored enemy's `(epistemology, outlook, scope)` triple
   resolves to a real cell via `getAlignmentCell` — the cell pins
   round-trip through `philosophicalAlignmentLibrary`.

Commit: `feat(enemy): Phase 45 unit 1 — philosophicalAlignment + library backfill`.

### Unit 2 — `decideEnemyAction` outlook bias + docs + plan tick

**Files (edited):**
- `src/Enemy/enemy.logic.ts` — add `applyOutlookBias(action, enemy)`
  helper; call it from the dispatcher AFTER the per-strategy decision.
- `docs/enemy.md` — add "Alignment-driven AI tuning (Phase 45)"
  subsection.
- `plan/steps/01_build_plan.md` — flip Phase 45 `[ ]` → `[x]` with
  the two commit hashes.

**Bias rule:**

```ts
function applyOutlookBias(
    action: CombatAction,
    enemy: Enemy | undefined,
): CombatAction {
    if (!enemy?.philosophicalAlignment) return action;
    const outlook = bucketAxis(enemy.philosophicalAlignment.outlook);
    if (outlook === 'mid') return action;
    // 25% chance per round to flip the basic-action choice in the
    // direction the outlook implies. Stance is untouched — that's the
    // per-strategy logic's call. The flip only ever fires on
    // `attack` <-> `defend`; skill / item / flee are passed through.
    if (action.action !== 'attack' && action.action !== 'defend') return action;
    const FLIP_CHANCE = 0.25;
    if (getRng().random() >= FLIP_CHANCE) return action;
    if (outlook === 'low' && action.action === 'attack') {
        return { ...action, action: 'defend' };
    }
    if (outlook === 'high' && action.action === 'defend') {
        return { ...action, action: 'attack' };
    }
    return action;
}
```

Called from the dispatcher's existing return paths via a single
post-pass that wraps the returned `CombatAction`:

```ts
const decided = /* per-strategy decision as today */;
return applyOutlookBias(decided, enemy);
```

The legacy single-arg `decideEnemyAction(logic)` path can't bias
(no enemy → no alignment) — calling `applyOutlookBias(decided, undefined)`
short-circuits at the first guard. Existing tests stay green.

**Tests (Unit 2):**

Extend `src/Enemy/e2e/enemy.engine.test.ts` (or the alignment sibling
from Unit 1) with 3 hermetic cases:

1. Pessimistic enemy + attacking strategy: with
   `mockSequentialRng(0.1)` (below the 0.25 flip chance), an
   `aggressive` enemy with `outlook: -80` flips its `attack` decision
   to `defend`. Without the flip RNG (`mockSequentialRng(0.5)`),
   the same setup returns `attack`.
2. Optimistic enemy + defensive strategy: with `mockSequentialRng(0.1)`,
   a `defensive` enemy with `outlook: 80` whose strategy returned
   `defend` flips to `attack`. Stance preserved.
3. Mid-bucket enemy: `outlook: 0` produces no flip regardless of RNG
   (same action returned with `mockSequentialRng(0.1)` as without).

**Docs:**

`docs/enemy.md` "Alignment-driven AI tuning (Phase 45)" subsection
explains the optional field, the bias rule, the 25% flip chance, and
cross-links to `docs/philosophy.md`. Includes the cell-pin table for
the current 16 authored enemies.

Commit: `feat(enemy): Phase 45 unit 2 — outlook bias + docs + plan tick`.

## Decisions made upfront — DO NOT ASK

- **Optional field, not required.** `philosophicalAlignment?` keeps
  legacy enemies (and test fixtures spinning up bare `Enemy` objects
  with `createEnemy(...)`) working. The bias short-circuits when
  unset.
- **Bias hooks AFTER per-strategy logic, not inside each strategy.**
  Keeps the existing 6 strategies (`random`, `aggressive`, ...) pure
  and untouched. The post-bias pass is one optional override layer.
- **Outlook only — not epistemology or scope.** The PDF's three axes
  are orthogonal; outlook maps most cleanly onto "fight harder vs
  hold back" behaviour. Future phases can layer epistemology (e.g.
  Faith enemies favour stance-defend-then-pray) or scope (e.g.
  Transcendent enemies skip basic actions for skill rotations) — out
  of scope here.
- **25% flip chance.** A round can flip at most once. Higher chances
  (50%) felt mechanically dominant in design playtest; lower (10%)
  felt invisible. The constant is colocated in the helper for an
  easy future tweak.
- **No flip on `skill` / `item` / `flee` actions.** The bias is a
  basic-action nudge. Skill / item / flee decisions are deliberate
  enough that the alignment bias shouldn't override them. (Today's
  enemies don't pick skill / item anyway — that's Phase 46+ territory.)
- **Stance untouched by the bias.** The bias flips action only. Stance
  is the strategy's call.
- **Two enemies share `mid-mid-individual`** (TidepoolCrab + EchoOfPyrrhonia).
  Intentional — both express the same skeptical-individual archetype
  at different difficulty tiers. The test pins the cell-id round-trip,
  not uniqueness.
- **Cell-pin authoring is per-enemy thematic.** No mechanical balance
  check this phase — the cell expresses flavour; the mechanical
  effect is the outlook flip only. Future calibration if a
  particular cell's enemies feel disproportionately strong / weak.
- **No new exports.** `Enemy` type gains a field; the helper
  `applyOutlookBias` is private (file-local). The bias is observable
  only through `decideEnemyAction`'s output.

## Verify gate

`npm run type-check && npm run lint && npm test && npm run build`.
Then `npm run deploy:check`.

## Commit body template (final commit / Unit 2)

```
feat(enemy): Phase 45 — enemies-by-alignment AI tuning

Closes Phase 45 and the Phase 42 follow-up sequence (43 → 44 → 45).

- Enemy.philosophicalAlignment?: PhilosophicalAlignment
- Every authored enemy in ENEMY_REGISTRY (16) pinned to a cell in
  the 27-cell library.
- decideEnemyAction post-passes the per-strategy decision through
  applyOutlookBias: pessimistic enemies sometimes defend when they
  would attack; optimistic enemies sometimes attack when they would
  defend. Mid-bucket enemies pass through unchanged. 25% flip chance
  per round, RNG-driven.
- Hermetic e2e pins each direction against mockSequentialRng.
- docs/enemy.md "Alignment-driven AI tuning (Phase 45)" subsection
  documents the field + bias + cell-pin table.

Refs: content/philosophy/PhilosAxiosDoc.pdf, plan/phases/phase_45_enemies_by_alignment.md,
Phases 42 (bdfda00) + 43 (c62702e) + 44 (0af3b26).
```

## Definition of Done

- [ ] `Enemy.philosophicalAlignment?: PhilosophicalAlignment` exists in `src/Enemy/types.d.ts`.
- [ ] All 16 entries in `ENEMY_REGISTRY` carry a `philosophicalAlignment` value with axes in `[-100, +100]`.
- [ ] `applyOutlookBias` helper exists in `src/Enemy/enemy.logic.ts` and is called from `decideEnemyAction`'s dispatch path.
- [ ] Hermetic e2e covers: every enemy's cell-pin round-trips through `philosophicalAlignmentLibrary`, pessimistic-flip, optimistic-flip, mid-bucket-no-flip.
- [ ] `docs/enemy.md` "Alignment-driven AI tuning (Phase 45)" subsection lists the field, the bias rule (25% flip chance), and the cell-pin table.
- [ ] Phase 45 row in `plan/steps/01_build_plan.md` flipped to `[x]` with both commit hashes.
- [ ] `npm run verify` + `npm run deploy:check` green.

## Follow-ups (out of scope)

- **Epistemology / scope biases.** Phase 45 only wires outlook. Future phases can layer epistemology (Faith → pray, Logic → analyse) or scope (Individual → focus, Transcendent → distant skills) into the bias.
- **Skill-action bias.** Today's enemies don't pick skills; Phase 46+ "enemy skill caster path" candidate would unlock that. Alignment-driven skill picks land then.
- **Per-cell signature behaviours.** Specific cells (e.g. Faith-Pessimistic-Transcendent / Grand Inquisitor) deserve unique multi-round patterns. Out of scope; a future "boss-by-cell" phase would author these.
- **Cell-pinned loot / dialogue.** Enemies could carry alignment-themed friendship rewards. Pairs with the existing Befriendable-enemy content arc candidate.
- **Player alignment vs enemy alignment interactions.** A future content arc could have certain cells "befriend more easily" for player alignments close to theirs. Pre-emptive; wait for concrete content need.
