# Revamp — items (consumables, shops, caches)

> Part plan of [THE REVAMP](README.md). Phase **R5** (loop). Decision D49.
> Status: PROPOSED. Relics have their own plan ([relics.md](relics.md)).

## Where things stand

`Items/consumable.library.ts` holds 22 consumables:

- **11 no-ops**, unobtainable, kept only so old saves load: focus-vial,
  hunters-elixir, heart-draught, berserker-brew, quicksilver-vial,
  war-horn-draught, philosopher-tea, void-essence, whetstone-oil,
  resonance-crystal, greater-resonance-crystal (player `rollModifier` is
  never read; `advantageGrants` only under the retired dice-flag OFF path).
- **Antidote, Clarity Serum** — cure statuses that, after R2, no foe applies.
  Three shops sell them (`World/MapEvents/content.ts:137, 364-365, 1727-1728`).
- Healing potions (minor, normal, greater, supreme), regeneration tonic,
  revive crystal, phoenix tear, iron-skin draught, body elixir.
- Consumables are usable only from the inventory tab, never in combat.
- Item copy says "HP" where the game says VITAE (`consumable.library.ts:45, 195`).

## R5 — Items reset (loop)

T, 2026-09-28: healing potions only.

1. Keep **minor, normal and greater healing potions** (supreme at the
   phase's judgement if the ladder needs a top rung). Retire the other 19.
2. **Save migration** (`Game/game.migrate.ts`): strip retired consumable ids
   from inventories; refund nothing (they were no-ops or have no target).
   Test it.
3. Re-point every shop, loot cache (`Items/cache-reward.ts`), hazard reward
   and dialogue grant that hands out a retired item. Parked maps' shops are
   left alone (unreachable) unless they break a test.
4. Delete the buff effects that existed only for the retired items (the
   advantage/roll-modifier buffs; `debuff_curse`, `buff_critical_damage_up`
   have zero appliers) and `effect-modifiers.ts:232-236`'s unread collection.
5. Copy: "Heal N HP" → VITAE (`consumable.library.ts`, mobile
   `inventory.modal.engine.ts:180-197, 332`, `equipment-detail.engine.ts:114-115`).
6. Stale comment: `cache-reward.ts` says relics are "never loot" — true
   again only if B1 keeps it so; fix to match the tree.
7. Carrier sweep (D45): CLEANSE (and HEAL if no potion prints it) leave the
   atlas and glossary.

Requires R3 (so only Act 1's shops and caches need re-pointing).

## Later

Consumables usable in combat were considered and deferred (T chose to
strip afflictions instead, D48). If B2 brings afflictions back, their
answer (a cleanse card or a combat item surface) comes with them.
