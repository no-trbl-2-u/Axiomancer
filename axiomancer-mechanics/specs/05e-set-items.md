# Spec 05e — Set Items

## Goal

Define a set-item system where equipping multiple items from the same named set
grants incremental bonuses. Set bonuses use the same `ResourceInteraction`,
`passiveEffects`, and `statModifiers` shapes the equipment engine already reads,
so no new resolver machinery is needed — only new aggregation logic. Ship with
2–3 initial sets using the base templates from Spec 05c.

**Success state:** Equipping the `leather-cap` and `sandals` (both members of the
"Wanderer's Road" set) grants a 2-piece bonus of +2 `heart` combat-start tokens
on top of each item's individual stats. Equipping a third set piece adds the
3-piece bonus. Unequipping any piece immediately removes the bonus it contributed
(at the start of the next combat — mid-combat equipping remains locked per Spec 05b
Q1). A hermetic test confirms the stacked `combatResources` matches the expected
sum of item-level and set-level token grants.

## Why now / dependencies

- **Depends on:** Spec 05c (`ItemInstance` with `rarity`; `EquipmentTemplate`
  IDs used as set member references), Spec 05d (set bonuses may reference
  effect IDs and mod-pool terms in their `passiveEffects`).
- **Unblocks:** Spec 07 (enemy loot can be tied to set completion as a drop
  incentive), Spec 08 (shops can surface "you're 1 piece away from a set bonus"
  UI cues).

## Current state (after Spec 05d)

- `Equipment` has `rarity`, `requiredLevel`, and `rolledMods`. All existing
  resolver paths (`initializeCombat`, `getEquipmentModifiers`) work on the
  instance shape.
- No `setId`, `ItemSet`, `SetBonus`, or `getActiveSetBonuses` concepts exist.

## Open questions

1. **Set membership source.** Sets reference items by `templateId` (base item
   IDs from `src/Items/equipment.templates.ts`). Should a Unique item's
   `setMembership` field also be checked here?
   > Yes — `getActiveSetBonuses` checks both template IDs and
   > `UniqueItemTemplate.setMembership`. For the initial spec, no Unique item
   > belongs to a set; the field is read but will always be undefined. Late-game
   > Unique set membership is explicitly a Spec 07+ extension.

2. **Bonus stacking order.** Set bonuses stack additively with individual item
   `resourceInteraction` (matching Spec 05b Q2). Should a hard cap apply?
   > No cap — same decision as Spec 05b Q2. Balance via playtesting.

3. **When are set bonuses applied?** Should set bonuses computed once at equip
   time (cached on character state) or on-demand at combat start?
   > On-demand — `getActiveSetBonuses` is called inside `initializeCombat` and
   > the generation bonus path, not at equip time. This avoids cache invalidation
   > complexity and matches how individual item `resourceInteraction` is already
   > read at combat start.

4. **Set bonus `passiveEffects` lifecycle.** Individual item `passiveEffects` are
   permanent `ActiveEffect`s removed on unequip (Spec 05 Q5). Should set bonus
   passive effects follow the same pattern?
   > No — set bonus passives are applied at `initializeCombat` (not at equip time)
   > and are removed when the combat ends, the same as any combat-duration effect.
   > This avoids the need to track "which set bonus applied this effect" across
   > equip/unequip events. If a set requires persistent out-of-combat passives,
   > that design is deferred.

5. **Set size range.** Sets may be 2–4 pieces. Must every set define every
   threshold (2, 3, 4), or can a set only define a subset?
   > Sparse — `bonuses` is `Partial<Record<2 | 3 | 4, SetBonus>>`. A 2-piece set
   > only defines `{ 2: … }`. A 3-piece set defines `{ 2: …, 3: … }`. No padding
   > required.

## Proposed approach

1. **`SetBonus` type** in `src/Items/set.types.ts`:
   ```typescript
   export interface SetBonus {
     resourceInteraction?: Partial<ResourceInteraction>;
     passiveEffects?: string[]; // effect library IDs, applied at combat start
     statModifiers?: StatModifier[];
   }
   ```

2. **`ItemSet` type** in `src/Items/set.types.ts`:
   ```typescript
   export interface ItemSet {
     id: string;
     name: string;
     description: string;
     memberTemplateIds: string[]; // EquipmentTemplate or UniqueItemTemplate IDs
     bonuses: Partial<Record<2 | 3 | 4, SetBonus>>;
   }
   ```

3. **`getActiveSetBonuses` function** in `src/Items/set.engine.ts`:
   ```
   getActiveSetBonuses(equippedItems: Equipment[]): SetBonus[]
   ```
   Logic:
   1. For each `ItemSet` in the library, count how many `memberTemplateIds`
      appear in `equippedItems` (matched by `item.id` for templates, or by
      `UniqueItemTemplate.setMembership` for Uniques).
   2. For each threshold in `set.bonuses` where `threshold <= count`, include
      that `SetBonus`.
   3. Return all active `SetBonus` objects (may be multiple from the same set
      if e.g. 3 pieces are worn and the set has both 2-piece and 3-piece bonuses).

4. **Wire into `initializeCombat`** in `src/Combat/combat.resolver.ts`:
   After summing individual item `combatStartTokens`, call
   `getActiveSetBonuses(equippedItems)` and additively stack each bonus's
   `resourceInteraction.combatStartTokens` into `combatResources`.

5. **Wire into `generateBasicActionResources`** in `src/Skills/skill.engine.ts`:
   After applying individual item `generationBonus` entries, apply each active
   set bonus's `resourceInteraction.generationBonus` entries.

6. **Wire `passiveEffects`** — in `initializeCombat`, after applying individual
   item passive effects, apply effect IDs from active set bonuses as combat-
   duration `ActiveEffect`s (`remainingDuration: -1` is NOT used; a fixed
   large combat duration or a flag marks them as set-sourced so they are
   purged at combat end by the existing effect cleanup path).

7. **Set library** — `src/Items/set.library.ts`, initial sets:

   ### Wanderer's Road (2-piece)
   **Members:** `sandals` + `leather-cap`
   **2-piece bonus:** `resourceInteraction.combatStartTokens: { heart: 2 }`
   *Thematic fit: a traveller's lightness of foot and clarity of eye.*

   ### Iron Discipline (3-piece)
   **Members:** `leather-cap` + `cloth-wrap` + `cloth-gloves`
   **2-piece bonus:** `statModifiers: [{ stat: 'physicalDefense', value: 3 }]`
   **3-piece bonus:** `resourceInteraction.generationBonus: [{ trigger: 'any', resourceType: 'body', bonus: 1 }]`
   *Thematic fit: the disciplined training of body over comfort.*

   ### Scholar's Circle (2-piece)
   **Members:** `copper-ring` + `leather-cap`
   **2-piece bonus:** `resourceInteraction.combatStartTokens: { mind: 2 }` +
   `passiveEffects: ['duration-extend-buff-id']`
   *Thematic fit: a scholar's focused preparation.*

   Note: set members intentionally overlap across sets (e.g., `leather-cap`
   appears in both Iron Discipline and Scholar's Circle). The engine handles
   multiple active sets simultaneously; a player wearing `leather-cap` +
   `cloth-wrap` + `copper-ring` + `sandals` could activate partial bonuses
   from all three sets at once.

8. **Tests:**
   - Equipping `sandals` + `leather-cap`: `getActiveSetBonuses` returns 1
     `SetBonus` with `combatStartTokens: { heart: 2 }`.
   - Equipping only `sandals`: no set bonuses.
   - `initializeCombat` with 2-piece Wanderer's Road equipped and an item with
     `cs: heart+1` gives `combatResources.heart = 3` (1 item + 2 set).
   - Equipping 3-piece Iron Discipline: both the 2-piece and 3-piece bonuses
     are active simultaneously.
   - Wearing `leather-cap` + items from two different sets: both partial bonuses
     activate independently.
   - Set bonus `passiveEffects` are not present in `character.effects` between
     combats (they are combat-scoped).

## Acceptance checklist

- [x] `SetBonus` and `ItemSet` types exported from `src/Items/`. Shipped at Phase 54 unit 1 (`0cb4b2a`): `src/Items/set.types.ts` authors both interfaces; barrel re-exports through `src/Items/index.ts` + `src/index.ts` Items block.
- [x] `getActiveSetBonuses` implemented in `src/Items/set.engine.ts`. Phase 54 unit 2 — accepts `Partial<Record<EquipmentSlot, Equipment>>` (D1 — match existing aggregator signatures); returns every threshold whose piece count is met; iteration order is library-deterministic. Sibling helpers `aggregateSetStartTokens` / `applySetGenerationBonus` / `getActiveSetPassiveEffectIds` / `getEquippedItemSets` also exported.
- [x] `initializeCombat` stacks set `combatStartTokens` additively. Phase 54 unit 2 — `src/Combat/combat.reducer.ts` sums per-item + per-set start tokens (Spec Q2 no cap); zero-set baseline unchanged.
- [x] `generateBasicActionResources` applies set `generationBonus` entries. Phase 54 unit 2 — `src/Skills/skill.engine.ts` chains `applySetGenerationBonus` after the existing per-item `applyEquipmentGenerationBonus` call. Same trigger semantics; counters clamped ≥ 0.
- [x] Set `passiveEffects` applied at combat start and cleaned up at combat end. Phase 54 unit 2 — `initializeCombat` applies each set-bonus effect ID via `applyEffect` with `sourceId: 'set-bonus'`; effects land on `combatState.player.effects` (NOT `character.effects`); combat-end cleanup discards the cloned player so set passives are combat-scoped per Spec Q4.
- [x] 3 initial sets defined in `src/Items/set.library.ts`. Phase 54 unit 2 — Wanderer's Road (2-piece, sandals + leather-cap, `+2 heart` start tokens); Iron Discipline (3-piece, leather-cap + cloth-wrap + cloth-gloves, `+3 physicalDefense` at 2 pieces / `+1 body/any` at 3 pieces); Scholar's Circle (2-piece, copper-ring + leather-cap, `+2 mind` start tokens + `buff_critical_rate_up` passive). Per D3, Scholar's Circle uses a real effect ID (`buff_critical_rate_up`) instead of the spec's placeholder `duration-extend-buff-id`.
- [x] Hermetic tests covering all scenarios above. Phase 54 unit 3 — `src/Items/e2e/sets.engine.test.ts` ships 13 cases across set-library inventory, getActiveSetBonuses (4 cases — Wanderer's-Road 2-piece active, sub-threshold no-op, Iron-Discipline 2+3-piece simultaneous, overlapping-membership independent activation), aggregator helpers (3 cases), initializeCombat seeding (2 cases), set passive lifecycle (2 cases — present in combatState, absent in character), and `generateBasicActionResources` chaining. 615/615 tests (+15 net from Phase 53's 600).
- [x] `docs/equipment.md` updated with a "Set Items" section. Phase 54 unit 3 — new "Set Items (Spec 05e / Phase 54)" section between "Library" and "Out of scope" lists the type shape, the runtime application (combat start tokens / basic action generation / passive effects / stat modifiers), the set library, the public API, and the "Adding a new set" instructions.

## Out of scope

- Unique items as set members — Spec 07+ extension; field is wired but unused.
- Set bonus display in the CLI — Spec 08.
- More than 3 initial sets — extend post-playtesting.
- Set-completion incentives in the shop ("1 piece away" prompt) — Spec 08.
- Crafting or targeted set-piece farming.
