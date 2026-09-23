# Equipment — the 5-slot signet model

> **Superseded history:** the procedural equipment library, rarity model, affix
> (prefix/suffix) system, item sets, modifier catalogue, and all equipment→combat
> effect channels were retired across the equipment-signature epic (phases
> 18-21 + 23). Specs `05`/`05b`/`05c`/`05d`/`05e` describe that retired system and
> carry a superseded banner. This doc describes the shipped model.

## The model

A character wears **exactly 5 pieces across 3 slot kinds** — 1 weapon, 1 armor,
3 interchangeable accessories (`SLOT_CAPACITY = { weapon: 1, armor: 1,
accessory: 3 }`). The worn loadout is `Character.equipment: EquipmentLoadout`
(`{ weapon, armor, accessories[] }`).

The **only equipment content is the 11 fixed "signet" relics**
([`src/Items/relic.library.ts`](../src/Items/relic.library.ts)) — 2 weapons, 2
armor, 7 accessories (Phase 85 filled the `head`/`hands`/`feet` kinds that
shipped empty in Phase 19). Each grants **one signature skill**
(`grantsSignature`) plus a single **static stat bump** (`statModifiers`). The
player owns all 11 and wears 1 weapon + 1 armor + 3 of the 7 accessories =
**140 possible loadouts** (2 × 2 × C(7,3)).

## The `Equipment` shape (lean)

```ts
interface Equipment extends BaseItem {
    category: 'equipment';
    slot: 'weapon' | 'armor' | 'accessory';
    accessoryKind?: 'head' | 'hands' | 'feet' | 'amulet' | 'ring' | 'charm'; // iff accessory
    statModifiers?: StatModifier[];   // the SOLE mechanical channel (incl. 'maxHp')
    grantsSignature?: SignatureSkillId; // one signature while worn (relics only)
}
```

There is no rarity, `requiredLevel`, `rolledMods`, affix, `passiveEffects`,
`onHitEffects`/`onDefendEffects`, `resourceInteraction`, or `critStyle`.

## Mechanical channels

- **Stats** — `equipItem`/`unequipItem`
  ([`src/Character/equipment.reducer.ts`](../src/Character/equipment.reducer.ts))
  fold each worn piece's `statModifiers` into `derivedStats` at equip-time. The
  first-class `'maxHp'` target folds onto `Character.maxHealth` (growing/clamping
  current `health`); it is NOT a `DerivedStats` field.
- **Signatures** — combat-init derives `CombatEncounterState.signatures` from the
  worn loadout via `getSignaturesForLoadout(loadout)` (weapon → armor →
  accessories, de-duplicated). Archetype no longer selects signatures
  (`playerArchetype` survives only to flavour the mobile portrait).
- **Nothing else** — equipment applies no effects, seeds no combat tokens, and
  rolls no procs.

## Worn-state helpers ([`src/Items/equipped.ts`](../src/Items/equipped.ts))

| Helper | Purpose |
|---|---|
| `wornPerSlot(inventory)` | Capacity-aware map of the worn items per slot (first `SLOT_CAPACITY[slot]` per slot). The canonical worn read. |
| `isEquippedFirstOfSlot(inventory, item)` | Whether `item` is within its slot's worn window. |
| `findEquippedInSlot(inventory, candidate)` | The piece a candidate would displace when its slot row is full, else `null`. |

## The very start (owner call 2026-09-23)

`createNewGameState()` seeds **nothing**: an empty inventory, an empty
loadout, zero coin, zero XP, level 1 at the 5/5/5 apprentice baseline. The
Phase-19 kit (`cloneStartingRelics`, `defaultWorn`) is still what presets,
fixtures, mocks and every sim build on — only the real-player origination
point changed, so the measured baselines are untouched.

Two things make the empty start a game:

1. **The Suppliant's Ring is handed over at the run's first node**
   (`src/Character/first-node-grant.ts`; `START_COMBAT` / `PROCESS_NODE`
   settle it as a floor). With an empty accessory row it fills the first
   seat and displaces nothing. The ring is the one relic with **no stat
   bump** — it grants The Open Hand and nothing else (`statModifiers: []`).
2. **The other ten relics are village-market wares** — see below.

Pinned by `src/Game/e2e/fresh-start.engine.test.ts`.

## Loot & shops

Relics are **sold, not dropped**. Every non-ring relic is a `shop.wares`
entry (by fixed id, resolved through `getRelicById`) on at least one of the
six authored village markets in `src/World/MapEvents/content.ts` — the
first market on the road (Glen Market, northern forest) stocks the
Phase-19 starter kit's weapon, armor and charm. Loot surfaces (The
Reliquary, enemy drops) still yield consumables / currency only (phase 21).

## Save migrations

The v11→current chain keeps working: v11→v12 (re-slot to the 5-slot model),
v12→v13 (seed the signet relics), v13→v14 (purge non-relic equipment),
v21→v22 (seed the Phase 85 head/hands/feet relics). See
[`src/Game/game.migrate.ts`](../src/Game/game.migrate.ts). `LEGACY_SLOT_MAP`
stays for old-save upgrades.
