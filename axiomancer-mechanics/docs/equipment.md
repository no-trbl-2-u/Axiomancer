# Equipment — the worn-slot model

What a character wears and what wearing it does. The rules of play are in
[`docs/game-model.md`](../../docs/game-model.md); this page covers the
engine's equipment code.

## What Act 1 holds

One piece of equipment exists: the **Suppliant's Ring**
(`relic-disarming-plea`, [`src/Items/relic.library.ts`](../src/Items/relic.library.ts)),
an accessory of kind `ring`. It has no stat line and grants one signature,
The Open Hand (`sig-disarming-plea`). Nothing else in Act 1 grants
equipment: caches never yield it (`src/Items/cache-reward.ts` rolls
consumables only) and Act 1 has no shops.

## The slots

A character wears up to five pieces across three slot kinds
(`SLOT_CAPACITY`, [`src/Items/types.ts`](../src/Items/types.ts)): one
`weapon`, one `armor` and three interchangeable `accessory` positions. The
worn set is `Character.equipment: EquipmentLoadout`
(`{ weapon, armor, accessories[] }`, [`src/Character/types.ts`](../src/Character/types.ts));
`emptyLoadout()` is the empty one.

## The `Equipment` shape

```ts
interface Equipment extends BaseItem {
    category: 'equipment';
    slot: 'weapon' | 'armor' | 'accessory';
    accessoryKind?: 'head' | 'hands' | 'feet' | 'amulet' | 'ring' | 'charm'; // iff accessory
    statModifiers?: StatModifier[];     // only { stat: 'maxHp', value }
    grantsSignature?: SignatureSkillId; // the signature it grants while worn
}
```

A relic is an `Equipment` with `grantsSignature` set.

## What wearing does

Equipment has two channels and no others: it applies no effects and rolls
no procs.

- **Max VITAE.** `wornMaxHpBonus(loadout)` sums the worn `maxHp` lines;
  equipping or unequipping folds the change onto `Character.maxHealth`,
  growing or clamping current `health` by the same amount. Stat allocation
  and level-up add it back when they rebuild `maxHealth`. The ring has no
  `maxHp` line, so today this is always 0.
- **Signatures.** Combat start sets `CombatEncounterState.signatures` from
  `getSignaturesForLoadout(loadout)` (weapon, then armor, then accessories,
  de-duplicated). An empty loadout means no signature.

## Equipping

[`src/Character/equipment.reducer.ts`](../src/Character/equipment.reducer.ts),
all pure:

| Function | What it does |
|---|---|
| `equipItem(character, item, { replaceIndex }?)` | Weapon and armor replace in place. An accessory fills the first free position; with all three full it swaps `replaceIndex`, or without one returns the same character unchanged. |
| `unequipItem(character, slot, index?)` | Frees the slot (for an accessory, the position at `index`); the rest compact forward. A no-op on an empty slot. |
| `getEquippedItems(loadout)` | Every worn piece, weapon then armor then accessories. |
| `wornMaxHpBonus(loadout)` | The summed worn `maxHp` bonus. |

[`src/Items/item-grant.ts`](../src/Items/item-grant.ts)'s `grantItem` adds
an item to the inventory and, with `{ equip: true }`, first moves any
displaced piece back to the inventory and then wears the new one, so a grant
never destroys a worn piece or hits the full-row no-op.

## Worn state in the inventory

Worn pieces also sit in `inventory`. The convention
([`src/Items/equipped.ts`](../src/Items/equipped.ts)) is order: the first
`SLOT_CAPACITY[slot]` equipment items of each slot are the worn ones.

| Helper | Purpose |
|---|---|
| `wornPerSlot(inventory)` | The worn items per slot. The canonical worn read. |
| `isEquippedFirstOfSlot(inventory, item)` | Whether `item` is inside its slot's worn window. |
| `findEquippedInSlot(inventory, candidate)` | The piece a candidate would displace when its slot is full, else `null`. |

## The first-node grant

`createNewGameState()` starts the player with nothing worn. The ring is
handed over at the run's first node
([`src/Character/first-node-grant.ts`](../src/Character/first-node-grant.ts)):
`grantFirstNodeRelic` adds it to the inventory and equips it, giving up the
last worn accessory to the satchel if the row is full, and stamps
`FIRST_NODE_RELIC_FLAG` in `GameState.flags`. It is idempotent. The mobile
app calls it at the first node to show the hand-over; the game reducer
settles it on `PROCESS_NODE`, and on `START_COMBAT` as a floor so no fight
starts without The Open Hand. `withholdFirstNodeRelic` is its inverse, for
callers that seed relics themselves (`createCharacter({ seedStartingRelics })`,
`cloneStartingRelics()`). Pinned by
`src/Game/e2e/fresh-start.engine.test.ts`.

## Saves

[`src/Game/game.migrate.ts`](../src/Game/game.migrate.ts) upgrades older
saves to this shape; `LEGACY_SLOT_MAP`
([`src/Game/legacy-slots.ts`](../src/Game/legacy-slots.ts)) maps the old
seven slots (`head`, `body`, `hands`, `feet` and the rest) onto the three
slot kinds.
