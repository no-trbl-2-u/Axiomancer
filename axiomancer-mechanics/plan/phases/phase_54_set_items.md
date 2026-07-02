# Phase 54 — Spec 05e (Set items) implementation

> Promoted via `/oversight` 2026-05-19 (fourth oversight of the day,
> commit `7978a89`) from the AUDIT `[needs-user-call]` row that
> corrective-drain iterate `eb807a0` surfaced. Brief authored
> 2026-05-19 at commit `2650267`.

## Source

- `specs/05e-set-items.md` (spec authored pre-loop; 5 open questions all answered in the spec body; acceptance checklist 0/8).
- `plan/PHASE_CANDIDATES.md` Promoted entry "Phase 54 — Spec 05e (Set items) implementation".
- `plan/steps/01_build_plan.md` line 26 — Spec 05e `[skipped]` row supersedes-when this phase ships.

## Goal — one-line outcome

Implement the set-item system per Spec 05e: types (`SetBonus` / `ItemSet`), engine helper (`getActiveSetBonuses`), wiring into `initializeCombat` (set `combatStartTokens` + `passiveEffects`) + `generateBasicActionResources` (set `generationBonus`), 3 initial sets in `src/Items/set.library.ts`, hermetic e2e, docs.

## Decisions (made upfront)

### D1 — `getActiveSetBonuses` accepts `Partial<Record<EquipmentSlot, Equipment>>`, not `Equipment[]`

Spec proposes `Equipment[]` for ergonomic reasons; existing aggregators (`aggregateCombatStartTokens`, `applyEquipmentGenerationBonus`) take the slot map. Match the slot-map signature to compose cleanly inside `initializeCombat` and avoid a redundant `Object.values()` conversion at every call site. Internal logic uses the existing `getEquippedItems` helper.

### D2 — Match by `equipment.id` only for the initial implementation

Spec Q1 said also check `UniqueItemTemplate.setMembership`, but Q1 also confirmed "no Unique item belongs to a set [in the initial spec]; the field is read but will always be undefined." Implementation handles the template-id path; the setMembership fallback is wired but never fires until a Unique is authored into a set in a later phase. Simpler initial implementation; no acceptance impact.

### D3 — Scholar's Circle uses a real effect ID, not the spec's placeholder

Spec lists `'duration-extend-buff-id'` for Scholar's Circle 2-piece `passiveEffects` — that's a placeholder name that doesn't exist in the effects library. Pick `buff_critical_rate_up` instead (thematic fit: a scholar's focused preparation maps to crit-rate). The other 2 sets don't reference passive effects; this is a one-spot substitution.

### D4 — Set passive effects are combat-scoped via the existing effect cleanup path

Per Spec Q4: set bonus passives are applied at `initializeCombat` and removed at combat end. The existing `endCombat` reducer + the per-round `tickAllEffects` already handle effect cleanup. New set passives are applied through `applyEffect` with a long-but-finite `duration` (use 999 — well past any plausible combat); they tick down per round but won't expire mid-combat in practice; combat end removes them along with all other active effects.

Alternative considered: a new `sourceTag: 'set-bonus'` field on ActiveEffect for targeted cleanup at combat end. Rejected — adds engine surface for no behavioural difference vs the long-duration approach.

### D5 — Item set library exports through Items barrel + top-level barrel

`itemSetLibrary` + `getItemSetById` mirror the `equipmentTemplates` / `getEquipmentTemplate` pattern (Phase 04b convention). Both exported through `src/Items/index.ts` + `src/index.ts`.

## Commit units

### Unit 1 — Types

Files:
- `src/Items/set.types.ts` — `SetBonus` + `ItemSet` interfaces per Spec proposed approach §1-2.
- `src/Items/index.ts` — barrel exports.
- `src/index.ts` — top-level Items block adds `SetBonus`, `ItemSet`.

Verify: `npm run verify`.

Commit: `feat(items): Phase 54 unit 1 — SetBonus + ItemSet types`.

### Unit 2 — Engine + wiring

Files:
- `src/Items/set.engine.ts` — `getActiveSetBonuses(equipment: Partial<Record<EquipmentSlot, Equipment>>): SetBonus[]`. Logic per Spec §3.
- `src/Items/equipment.engine.ts` — extend `aggregateCombatStartTokens` and `applyEquipmentGenerationBonus` to ALSO read set bonuses (composed via `getActiveSetBonuses`). Alternative: keep those aggregators item-only and add sibling `aggregateSetStartTokens` + `applySetGenerationBonus` helpers, called explicitly from `initializeCombat` + `generateBasicActionResources`. Pick the sibling approach so the existing aggregator semantics stay untouched (D5 elsewhere in the codebase: minimize blast radius).
- `src/Combat/combat.reducer.ts` — `initializeCombat` calls `getActiveSetBonuses(player.equipment)` after the existing token aggregation; adds set `combatStartTokens` to `combatResources`; applies each set bonus's `passiveEffects` via `applyEffect` with `duration: 999` (D4).
- `src/Skills/skill.engine.ts` — `generateBasicActionResources` calls the new set-generation-bonus helper after the equipment-side one.

Verify: `npm run verify` + new e2e cases in Unit 4 will exercise.

Commit: `feat(items): Phase 54 unit 2 — getActiveSetBonuses + initializeCombat / generation wiring`.

### Unit 3 — Library

Files:
- `src/Items/set.library.ts` — 3 sets per Spec §7:
  - **Wanderer's Road** (2-piece): `sandals` + `leather-cap`. 2-piece bonus: `combatStartTokens: { heart: 2 }`.
  - **Iron Discipline** (3-piece): `leather-cap` + `cloth-wrap` + `cloth-gloves`. 2-piece: `statModifiers: [{ stat: 'physicalDefense', value: 3 }]`. 3-piece: `generationBonus: [{ trigger: 'any', resourceType: 'body', bonus: 1 }]`.
  - **Scholar's Circle** (2-piece): `copper-ring` + `leather-cap`. 2-piece: `combatStartTokens: { mind: 2 }` + `passiveEffects: ['buff_critical_rate_up']` (D3 substitution).
- `src/Items/index.ts` — export `itemSetLibrary` + `getItemSetById`.
- `src/index.ts` — top-level Items block adds the same.

Verify: `npm run verify`.

Commit: `feat(items): Phase 54 unit 3 — initial 3-set library (Wanderer's Road / Iron Discipline / Scholar's Circle)`.

### Unit 4 — Tests + docs + acceptance ticks

Files:
- `src/Items/e2e/sets.engine.test.ts` — hermetic cases covering Spec §8:
  1. `sandals` + `leather-cap` equipped → `getActiveSetBonuses` returns 1 SetBonus matching Wanderer's Road 2-piece.
  2. Only `sandals` equipped → empty.
  3. `initializeCombat` with 2-piece Wanderer's Road + item with `cs: heart+1` → `combatResources.heart === 3` (1 item + 2 set).
  4. 3-piece Iron Discipline equipped → both 2-piece + 3-piece bonuses active simultaneously.
  5. `leather-cap` + items from 2 different sets equipped → partial bonuses from both sets activate independently.
  6. Set bonus `passiveEffects` are present in `combatState.player.effects` during combat (Scholar's Circle 2-piece) and absent in `character.effects` between combats (combat-scoped, D4).
- `docs/equipment.md` — new "Set Items (Spec 05e / Phase 54)" section: types overview, library reference, runtime application notes.
- `specs/05e-set-items.md` — flip all 8 acceptance checkboxes to `[x]` with shipping references.
- `plan/steps/01_build_plan.md` line 26 — clarify the Spec 05e `[skipped]` row now reads "superseded by Phase 54" (or move the row's content into a Done-style historical note).

Verify: `npm run verify` + `npm run deploy:check` (new exports must pass the Phase 53 public-surface assertion — the snapshot fixture needs refreshing in this commit too).

Commit: `feat(items): Phase 54 unit 4 — hermetic e2e + docs + acceptance ticks + surface fixture refresh`.

## Verify gate

`npm run verify` + `npm run deploy:check` — both green. The public-surface fixture at `scripts/public-surface.expected.json` must be refreshed at Unit 4 to include the new exports (`SetBonus`, `ItemSet`, `getActiveSetBonuses`, `itemSetLibrary`, `getItemSetById`).

## DoD

- Phase 54 row in `plan/steps/01_build_plan.md` flips `[ ]` → `[x]`.
- All 8 acceptance boxes in `specs/05e-set-items.md` ticked.
- `Equipment.setMembership` stub note can stay (still relevant for the deferred Unique-set extension).
- Public-surface fixture refreshed; deploy-check green.

## Out of scope

- Unique items as set members — D2 leaves the path wired but unused.
- Set bonus authoring UI in the CLI — out of scope; not a CLI feature.
- More than 3 initial sets — Spec says 2-3; we ship 3. More sets can land as iterate-tier content authoring later.
