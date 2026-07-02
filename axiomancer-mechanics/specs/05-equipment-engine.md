# Spec 05 — Equipment & Consumables Engine

## Goal

Make equipping and using items meaningful. Equipment must contribute to derived
stats; consumables must reference real effects from the library; both must show
up in combat math. Equipment also carries an optional `ResourceInteraction`
payload that the combat resolver reads to seed token counters at battle start
and amplify generation from basic actions.

**Success state:** A player can equip a `weapon` that adds `+2 body` and
`+1 physicalAttack`; the bonus shows in `derivedStats` and on attack rolls.
A `Healing Potion` consumable applies the right effect from the library and
restores HP. The CLI item action works. A `Berserker Band` (accessory tier 2)
grants 3 Body tokens at the start of combat; the combat resolver reads the
equipped item and seeds `combatResources.body = 3` in `initializeCombat`.
Library content (50 equipment pieces + 12 consumables) lives in **Spec 05b**,
which depends on this spec.

## Why now / dependencies

- **Unblocks:** Spec 05b (equipment library + resource interaction content),
  Phase 5 level-up flow (Spec 06), shop NPCs (Spec 08), enemy loot drops
  (Spec 07).
- **Depends on:** Spec 01 for stat-modifier aggregation (so equipment can
  share the same machinery as effects); Spec 02 for the action pipeline so
  the `item` action runs through the resolver; Spec 04 for `CombatResources` /
  `ResourceCost` types reused here.

## Current state

- Item type union exists (`Equipment`, `Consumable`, `Material`, `QuestItem`)
  in `src/Items/types.ts`.
- `src/Items/item.reducer.ts` covers `addItem`, `removeItem`, `useConsumable`,
  `stackItem`. The Zustand store now delegates to these reducers rather than
  inlining the logic (`src/Game/store.ts`).
- `Equipment` has only `slot: EquipmentSlot` — no stat modifiers, passive
  effects, tiers, or resource interactions yet.
- `Consumable.effect: string` is a free-text field; nothing reads it.
- `Character` has no equipment slot field — currently equipment is just
  inventory.
- Library files: `src/Items/consumable.library.json`,
  `src/Items/equipment.library.json` (e.g. Healing Potion).

## Open questions

1. **Slot model.** The type allows `weapon | armor | accessory | head | body
   | hands | feet`. Are all 7 slots simultaneously equippable, or do
   `weapon/armor/accessory` and `head/body/hands/feet` represent two
   different layouts (e.g. early vs late game)?
   > Your answer: All 7 are simultaneously equippable.

2. **Stat modifier shape.** Reuse `StatModifier` from `Effects/types`
   (`stat`, `value`, `isMultiplier`)? That gives flat + multiplier support
   for free.
   > Your answer: Yes, reuse that. If enough reuse is happening, we should consider lifting the type to a higher level of abstraction.

3. **Aggregation site.** Equipment modifiers are persistent. Should they:
   - (A) Be folded into `derivedStats` at equip-time (so the character's
     `derivedStats` is "post-equipment"), or
   - (B) Be aggregated on-demand per roll (`getEffectiveStats(character)`),
     mirroring the temporary effects in Spec 01.
   > Your answer:A

4. **Stance alignment.** Should equipment carry a `stance?: Stance`
   so e.g. a "Body weapon" gives the wearer a tier-1-style passive when
   attacking with body? If yes, what's the bonus shape?
   > Your answer: No

5. **Passive effects.** `passiveEffects: string[]` references effect IDs.
   When does a passive tick down — never (effectively permanent), or per
   round like normal? And does removing the equipment remove the effect?
   > Your answer: never and yes, removing the equipment removes the effect

6. **`onHitEffects` vs Spec 03 procs.** Equipment-based on-hit effects could
   either share the Spec 03 proc machinery or run separately:
   - (A) Share — equipment adds entries to the proc roll.
   - (B) Separate — equipment procs roll on every hit independently.
   > Your answer: A

7. **CritStyle mapping.** The `CritStyle` type (`'double' | 'pierce'`)
   exists. Tie it to:
   - (A) The equipped weapon (`Equipment.critStyle?: CritStyle`).
   - (B) The chosen stance (heart/body/mind each prefer one).
   - (C) Per-skill (Spec 04 extends `Skill` with `critStyle`).
   > Your answer: A but is overridden by C

8. **Consumable → effect link.** Replace `Consumable.effect: string` with:
   - (A) `effectId: string` referencing the effects library.
   - (B) Option (A) plus `durationOverride?` and `intensityOverride?` for
     per-instance tuning.
   - (C) Option (B) plus an inline `Effect` if the consumable wants a
     bespoke one-off effect not in the library.
   > Your answer: C

9. **Healing potion shape.** Healing Potion currently restores HP. Should
   the engine model healing as:
   - (A) An immediate `heal(amount)` action (no effect entry).
   - (B) A `regeneration` effect that applies for 1 round (uses the same
     machinery as `Vital Empathy`).
   - (C) Both, depending on the consumable.
   > Your answer: C

10. **Resource interaction interface.** Equipment in Spec 05b will carry
    combat-start token grants and per-action generation bonuses. What is the
    right type shape for the `ResourceInteraction` payload on `Equipment`?
    - (A) Two flat optional fields directly on `Equipment`:
      `combatStartTokens?: Partial<CombatResources>` and
      `generationBonus?: Array<{ trigger: 'hit' | 'miss' | 'defend' | 'any'; resourceType: keyof CombatResources; bonus: number }>`.
    - (B) Same as (A), but `trigger` also accepts a `Stance` key
      (`'body' | 'mind' | 'heart'`) so a bonus can be limited to one stance
      (e.g., "only triggers on a body-stance hit").
    - (C) Wrap both fields in a `resourceInteraction?: ResourceInteraction`
      sub-object to keep the top-level `Equipment` shape flat and enable
      complete omission when the item has no resource interactions.
    > Your answer: C

## Proposed approach

1. **Type updates** — `Equipment.statModifiers`, `passiveEffects`,
   `onHitEffects`, `onDefendEffects`, `tier`, optionally `stance`, optionally
   `critStyle` per Q4/Q7, and a `resourceInteraction?` field per Q10.
2. **`ResourceInteraction` type** — new interface in `src/Items/types.ts`
   with fields resolved in Q10. Reuses `CombatResources` imported from
   `src/Skills/types.d.ts` (already a public export via `src/index.ts`).
3. **`Character.equipment: Partial<Record<EquipmentSlot, Equipment>>`** plus
   `equipItem(character, item)` / `unequipItem(character, slot)` reducers.
4. **`getEquipmentModifiers(character): AggregatedModifiers`** — same shape
   Spec 01 produces for active effects; gets merged into the same site so
   `getAttackStat`/`getDefenseStat` etc. transparently pick up equipment.
5. **Combat-start token seeding** — `initializeCombat` reads
   `character.equipment`, sums `combatStartTokens` across all occupied slots,
   and adds them to the initial `combatResources` instead of zeroing all five
   counters unconditionally.
6. **Generation bonus wiring** — `generateBasicActionResources` (in
   `src/Skills/skill.engine.ts`) accepts an optional `equippedItems` array
   and applies applicable `generationBonus` entries on top of the base
   table from Spec 04.
7. **Consumables: rename `effect` → `effectId`** (keep a back-compat type
   alias for one release). Wire `useConsumable` to call `applyEffect`
   against the player and tick the inventory.
8. **Store integration** — `store.equipItem`, `store.unequipItem`,
   `store.useConsumable` calls the new reducer functions.
9. **CLI** — `'item'` action lists usable consumables, applies the chosen
   one, decrements the stack.
10. **Library** — content (50 equipment pieces + 12 consumables) lives in
    Spec 05b. This spec ships only the types, reducers, and engine wiring.
11. **Tests:** equip/unequip stat math, consumable application, combat-start
    token seeding, generation bonus, CLI smoke test.

## Acceptance checklist

- [x] All 10 questions answered.
- [x] `Equipment` type has `statModifiers`, `passiveEffects`, `onHitEffects`,
      `onDefendEffects`, `tier`, and `resourceInteraction?: ResourceInteraction`.
- [x] `ResourceInteraction` type exported from `src/Items/`.
- [x] `initializeCombat` seeds `combatResources` from equipped items'
      `combatStartTokens` (items with no `resourceInteraction` contribute 0
      to each counter).
- [x] `generateBasicActionResources` applies `generationBonus` entries from
      equipped items on top of the base generation table.
- [x] Equipping a stat-mod weapon visibly changes the player's
      `derivedStats` in the CLI display.
- [x] Using a Healing Potion in the CLI restores HP and decrements the stack.
- [x] An equipment with `onHitEffects` lands the effect at the right time.
- [x] `docs/equipment.md` updated with the final type shape, formulas, and
      `ResourceInteraction` interface.

## Implementation notes (post-implementation)

- Equipment statModifiers are aggregated by `getEquipmentModifiers` and
  recomputed into `derivedStats` inside `equipItem` / `unequipItem` so
  `derivedStats` is always "post-equipment" (Q3 option A). `baseStats` are
  never mutated by equipment.
- Passive effects are pushed into `Character.effects` as permanent
  `ActiveEffect`s with `remainingDuration: -1` and `sourceId = item.id` so
  `unequipItem` can remove exactly those entries (Q5).
- `onHitEffects` / `onDefendEffects` are surfaced to the combat resolver
  via `getEquipmentProcTriggers` and folded into `getEligibleTriggers`
  (alongside the JSON table and any per-cell overrides) so the existing
  Spec 03 `rollForCombatEffects` / `applyProcOutcome` machinery handles
  them transparently (Q6 option A).
- `Consumable.effect: string` was renamed to `effectId` and a new
  `inlineEffect?: Effect` + `healAmount?: number` pair was added so a
  consumable can apply an immediate heal AND/OR a referenced/inline effect
  (Q8 option C, Q9 option C). `intensityOverride` / `durationOverride`
  retune the applied effect on a per-instance basis.
- `resolveCombatRound` routes `action: 'item'` through
  `useConsumableEffect`, decrements the inventory stack via the existing
  `useConsumable` inventory reducer, and lets the enemy's basic action
  still resolve (mirrors skip-vs-attack semantics so a phantom contest
  still rolls — same convention as pre-Spec 05). The new
  `ItemPhaseEvent` is emitted to the combat event stream.
- Library content (50 equipment pieces, 12 consumables) is intentionally
  deferred to Spec 05b. This spec ships the types, reducers, engine
  wiring, store actions, CLI prompt, and a hermetic e2e suite under
  `src/Items/e2e/equipment.engine.test.ts`.

## Out of scope

- Library content (50 pieces of equipment + 12 consumables) — Spec 05b.
- Which specific items carry `combatStartTokens` / `generationBonus` and at
  what amounts — Spec 05b.
- Crafting from `Material` items.
- Shop economy / pricing — Spec 08.
- Equipment as quest rewards — Spec 08.
