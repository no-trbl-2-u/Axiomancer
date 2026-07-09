# Phase 18 — 5-slot equipment model (weapon / armor / accessory ×3)

> Agent-facing brief. Concise, opinionated, decisive. Ship without
> asking; document any judgment calls in the commit body. **This is
> the opening phase of the equipment-signature epic (phases 18-21 + 23) and
> it defines the slot contract every later phase builds on** — phase 19
> equips the signet relics *into* this model, phases 20-22 decouple and
> delete around it. Spend extra care on the shapes.

## Outcome / Why

Today a character has **7 independent equipment slots**, one item each:
`EquipmentSlot = 'weapon' | 'armor' | 'accessory' | 'head' | 'body' |
'hands' | 'feet'` (`axiomancer-mechanics/src/Items/types.ts:43`) worn
via `Character.equipment: Partial<Record<EquipmentSlot, Equipment>>`
(`src/Character/types.ts:100`).

This phase collapses that to **exactly 5 worn pieces across 3 slot
kinds**:

| Slot kind | Capacity | Accepts |
|---|---|---|
| `weapon` | 1 | weapons |
| `armor` | 1 | armor (incl. anything worn on the torso) |
| `accessory` | 3 | any accessory **kind**: head, hands, feet, amulet, ring, charm (extensible list) |

The three accessory positions are interchangeable (no `accessory1/2/3`
identity — an accessory occupies *an* accessory position, order is
cosmetic). What counts as an accessory is an explicit, extensible
taxonomy — `AccessoryKind = 'head' | 'hands' | 'feet' | 'amulet' |
'ring' | 'charm'` for now (T-directed 2026-07-09; more kinds may be
added later without a slot change). **`body` is NOT an accessory** —
torso wear is armor. Of the old slots, `head`/`hands`/`feet` fold into
`accessory` (as kinds), `body` folds into `armor`.

**Why now, why first:** the epic's end state (phase 19+) is 8 signet
relics worn 5-at-a-time as the player's whole loadout. The wear-cap of
5 is not a bolt-on counter — it *is* the slot model: 1 weapon + 1 armor
+ 3 accessories. Establishing the model first means the relics land as
ordinary equipment in ordinary slots, with no parallel "relic loadout"
domain to build and later merge.

**Success state:** `EquipmentSlot` has 3 members. A character wears at
most 5 pieces (1/1/3). Equipping a 4th accessory with all 3 positions
full is a guarded no-op (caller-surfaced message), not a throw and not
a silent replace. Old saves migrate: worn legacy gear re-slots
deterministically, overflow accessories return to inventory. Mobile
character screen shows 5 slot rows (Weapon, Armor, Accessory ×3). All
three workspace gates green.

## Locked decisions from planning (2026-07-09) — DO NOT ASK

1. **`EquipmentSlot = 'weapon' | 'armor' | 'accessory'`.** The legacy
   `head`/`body`/`hands`/`feet` literals are deleted from the union in
   this phase (this is the rare non-additive barrel change the epic
   makes early — it cannot be deferred because the loadout shape depends
   on it; fix consumer type breaks in the same commit). Alongside it,
   add `AccessoryKind = 'head' | 'hands' | 'feet' | 'amulet' | 'ring' |
   'charm'` and `accessoryKind?: AccessoryKind` on `Equipment`
   (required-by-invariant when `slot === 'accessory'`, absent
   otherwise; the union is deliberately extensible — adding a kind
   later is additive).
2. **Legacy slot mapping is fixed:** `weapon→weapon`, `armor→armor`,
   **`body→armor`** (torso wear is armor, not an accessory), and
   `accessory`/`head`/`hands`/`feet` → `accessory` (with
   `accessoryKind` `head`/`hands`/`feet` carried over from the old slot
   name; generic legacy `accessory` items default to kind `charm`).
   Encode it once as `LEGACY_SLOT_MAP` in the migration module (it must
   survive into the future for old-save upgrades even after phase 23
   deletes the rest of the legacy machinery).
3. **New loadout shape replaces the slot record:**
   `Character.equipment: EquipmentLoadout` with
   `{ weapon: Equipment | null; armor: Equipment | null; accessories: Equipment[] /* ≤3 */ }`.
   Do NOT model accessories as `accessory1|accessory2|accessory3` keys —
   capacity lives in one place (`SLOT_CAPACITY`), not in key names.
4. **Accessory-full is a caller-visible no-op.** `equipItem` on a full
   accessory row returns the character unchanged unless an explicit
   `replaceIndex` (0-2) is passed. Weapon/armor keep today's
   replace-in-place semantics (`equipment.reducer.ts:169-193`, incl.
   the existing "caller chains `unequipItem`+`addItem` to recover the
   displaced piece" convention — keep it).
5. **Legacy procedural content is re-slotted mechanically, not
   rebalanced.** The 56 templates / 7 uniques / mod pools / affix slot
   maps are dead content walking (deleted in phases 21-22). Re-slot them
   only so far as needed to compile and stay green. Accepted side
   effects (note in commit body, do not fix): the merged accessory mod
   pool is larger, so accessory drops roll from a wider pool; the
   `head`/`hands`/`feet` template families become accessory kinds and
   the `body` family becomes armor by fiat (16 armor templates then
   compete for 1 slot — irrelevant, they die in phase 21).
6. **Save migration bumps `GAME_STATE_VERSION` 11 → 12**
   (`src/Game/game.reducer.ts:59`). Worn-record migration is
   deterministic: if both legacy `armor` and `body` are worn, the
   `armor` occupant keeps the armor slot and the `body` occupant goes
   to `inventory`; accessory fill order is fixed `[accessory, head,
   hands, feet]` — first 3 stay worn, the rest append to `inventory`.
   Persisted `Equipment` instances (inventory items carry slot strings
   in saves) are re-slotted (+ given `accessoryKind`) via
   `LEGACY_SLOT_MAP`. Recompute `derivedStats` after migrating.
7. **The inventory-order worn convention becomes capacity-aware, not
   deleted.** `src/Items/equipped.ts` (`firstEquippedPerSlot`) encodes
   "first equipment per slot in inventory order = worn" and mobile
   presenters lean on it (`character.engine.ts:286`,
   `inventory.engine.ts:387`). Generalize: worn = first
   `SLOT_CAPACITY[slot]` items per slot. Ship `wornPerSlot(inventory):
   Map<EquipmentSlot, Equipment[]>` and migrate the mobile call sites;
   keep `firstEquippedPerSlot` as a thin deprecated wrapper (first entry
   of each list) for phase 23 to remove.

## Routes / endpoints / CLI surface

- **Mechanics CLI** (`src/CLI/game.cli.ts`): equip/loadout prompts
  enumerate the 3 slot kinds; accessory prompt shows `n/3` occupancy.
  No new sub-commands.
- **`@mechanics` barrel** (`src/index.ts`): changed exports —
  `EquipmentSlot` (shrunk union), `Character` (loadout shape),
  `equipItem`/`unequipItem` (new signatures), `getEquipmentModifiers`
  / `getEquippedItems` (loadout param). New exports — `EquipmentLoadout`,
  `AccessoryKind`, `SLOT_CAPACITY`, `wornPerSlot`. This is the epic's
  one deliberately breaking barrel change (decision 1); mobile +
  card-editor gates run in the same commit.
- **Mobile routes:** no new route. The character tab's equipment panel
  re-renders as 5 rows; the inventory equip flow gains the
  accessory-full guard.

## Content / data reads

| Surface | Change |
|---|---|
| `src/Items/types.ts:43` | 3-member `EquipmentSlot`; add `AccessoryKind` + `accessoryKind?` field; add `SLOT_CAPACITY: Record<EquipmentSlot, number>` |
| `src/Items/equipment.templates.ts` (56) | re-slot the `head/hands/feet` template families to `'accessory'` (with matching `accessoryKind`) and the `body` family to `'armor'`; existing `accessory` family gets kind `charm` (mechanical; decision 5) |
| `src/Items/unique.templates.ts` (7) | same mechanical re-slot |
| `src/Items/modifier.catalogue.ts` | `MOD_POOLS` keyed by slot: merge the `head/hands/feet` pools into the accessory pool and the `body` pool into the armor pool (dedupe by mod id); weapon pool untouched |
| `src/Items/affix.library.ts` | `affixesForSlot` slot-keying merged the same way |
| `src/Items/set.library.ts` | member pieces inherit their re-slotted slots; compile-only change |
| `src/Character/presets.ts:267-269` | preset `equipment` entries build the new loadout; if a preset maps to >3 accessories, first 3 (declaration order) are worn, the rest seed `inventory` |

## Components / handlers

**Mechanics (engine):**

- `src/Character/types.ts` — `EquipmentLoadout` interface;
  `Character.equipment: EquipmentLoadout`.
- `src/Character/equipment.reducer.ts` —
  - `getEquipmentModifiers(loadout)` iterates
    `[weapon, armor, ...accessories]` (replaces the record walk at
    `:58-74`).
  - `equipItem(character, item, opts?: { replaceIndex?: number })` —
    weapon/armor replace in place; accessory fills the first free
    position, honors `replaceIndex` when full, no-ops otherwise
    (decision 4).
  - `unequipItem(character, slot, index?)` — `index` required for
    `'accessory'` (which of the ≤3), ignored for weapon/armor.
  - `getEquippedItems(loadout)` — order: weapon, armor, accessories by
    index (replaces the 7-slot `SLOT_ORDER` at `:226-228`).
  - Passive-effect application (`applyPassiveEffects` at `:127`) keeps
    working over the new shape — it is *phase 20's* job to remove it,
    not this phase's.
- `src/Items/equipped.ts` — `wornPerSlot` (capacity-aware, decision 7);
  re-point `isEquippedFirstOfSlot` / `findEquippedInSlot` at it
  (`findEquippedInSlot` for a full accessory row returns the piece the
  new item *would displace* = the last worn accessory; empty-position
  case returns `null` as today).
- `src/Game/game.migrate.ts` + `game.reducer.ts` — version 12 migration
  per decision 6 (`LEGACY_SLOT_MAP` lives here).

**Mobile:**

- `state/presenters/character.engine.ts` — `SLOT_ORDER`/`SLOT_LABELS`
  (`:210-214`) become the 5 display rows (`Weapon`, `Armor`,
  `Accessory` ×3); `EquipmentRow.slotKey` union (`:110`) shrinks to the
  3 literals + an `accessoryIndex?: 0|1|2` for the three rows; worn
  lookup via `wornPerSlot`.
- `state/presenters/tooltip.engine.ts` — slot-tooltip content keys
  follow the new union (delete the 4 legacy slot entries).
- `state/actions.ts` — equip/unequip actions route through the new
  reducer signatures; accessory-full surfaces as a no-op + toast
  ("Accessory slots full — remove one first."), mirroring existing
  guard patterns.
- `state/presenters/inventory.engine.ts` / `inventory.modal.engine.ts`
  — `equippedBySlot` (`inventory.engine.ts:387`) via `wornPerSlot`;
  `computeEquipDelta` comparisons for an accessory candidate compare
  against the would-be-displaced accessory (or none when a position is
  free).

## Cross-links

**In** (existing, reused): `recomputeDerivedStats` pipeline;
`computeEquipDelta`; the equip/unequip action + toast patterns.

**Out** (this phase ships, later phases consume): `EquipmentLoadout` +
`SLOT_CAPACITY` + slot semantics (phase 19 relics equip into them);
`wornPerSlot` (phase 19 signature derivation reads worn pieces);
`LEGACY_SLOT_MAP` (stays in the migration module permanently).

**Retro-fit:** every test that builds a `Character.equipment` record or
uses a legacy slot literal (`src/Items/e2e/equipment.engine.test.ts`,
`sets/affixes/modifier.catalogue/item.factory` e2e suites,
`src/Character/e2e/equip-delta.engine.test.ts`, mobile
`inventory`/`tooltip`/`debug-seed` tests) updates to the 3-slot model.

## Output schema / contracts

```ts
// Items/types.ts
type EquipmentSlot = 'weapon' | 'armor' | 'accessory';
type AccessoryKind = 'head' | 'hands' | 'feet' | 'amulet' | 'ring' | 'charm'; // extensible
interface Equipment { /* ...existing... */ accessoryKind?: AccessoryKind; } // set iff slot === 'accessory'
const SLOT_CAPACITY: Record<EquipmentSlot, number>; // { weapon:1, armor:1, accessory:3 }

// Character/types.ts
interface EquipmentLoadout {
  weapon: Equipment | null;
  armor: Equipment | null;
  accessories: Equipment[];   // length ≤ SLOT_CAPACITY.accessory
}
interface Character { /* ... */ equipment: EquipmentLoadout; }

// Character/equipment.reducer.ts
function equipItem(c: Character, item: Equipment,
                   opts?: { replaceIndex?: number }): Character;
function unequipItem(c: Character, slot: EquipmentSlot,
                     index?: number): Character;
function getEquippedItems(loadout: EquipmentLoadout): Equipment[];

// Items/equipped.ts
function wornPerSlot(inventory: readonly Item[]): Map<EquipmentSlot, Equipment[]>;
```

`GAME_STATE_VERSION` 11 → 12 with the decision-6 migration.

## Composition

```
CharacterScreen › Equipment panel
  Row: Weapon    — <item or empty>
  Row: Armor     — <item or empty>
  Row: Accessory — <item or empty>   (×3, interchangeable; show the
                                      item's kind, e.g. "Ring", as a
                                      sub-label when occupied)
```

## Empty / loading / error states

- **Accessory row full:** equip is a no-op + "Accessory slots full —
  remove one first." No throw.
- **Empty slots:** legal everywhere (a fresh pre-phase-19 character may
  wear nothing); render em-dash/empty per existing slot-row pattern.
- **Old save:** decision-6 migration; a save wearing all 4 legacy
  accessory-family slots (`accessory`/`head`/`hands`/`feet`) keeps 3
  worn (fixed order) and finds 1 back in inventory; a save wearing both
  `armor` and `body` keeps the `armor` piece worn and finds the `body`
  piece in inventory.

## Pages × tests matrix

| Surface | Unit / engine tests | E2E |
|---|---|---|
| `EquipmentSlot`/`AccessoryKind`/`SLOT_CAPACITY` | slot union is 3 members; capacities 1/1/3; every `slot:'accessory'` item in libraries/templates carries an `accessoryKind` from the 6-kind union, non-accessories carry none | — |
| `equipItem`/`unequipItem` | weapon/armor replace; accessory fills first-free; full+no-index no-ops; full+`replaceIndex` swaps; `unequipItem('accessory', i)` frees exactly position i; stat recompute correct in every case | equip flows in `src/Items/e2e/equipment.engine.test.ts` reworked |
| `wornPerSlot` | first-3-accessories convention; stable under non-equipment permutation; `firstEquippedPerSlot` wrapper agrees on weapon/armor | — |
| migration v12 | 7-slot save → loadout; `body` occupant loses to `armor` occupant (→ inventory); fixed accessory order; overflow → inventory; item slot strings re-mapped + `accessoryKind` assigned; derivedStats recomputed | version-bump migration test |
| presets | every preset builds a legal loadout (≤3 accessories worn) | — |
| mobile character screen | 5 rows render; accessory rows independent | cross-screen harness: equip/unequip accessory round-trip |
| mobile equip actions | accessory-full toast path; delta preview vs displaced accessory | — |

## Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
npm run verify --workspace axiomancer-mobile
npm run type-check --workspace axiomancer-card-editor
```

All legs green before commit (the barrel change couples all three).

## Commit body template

```
refactor(mechanics): 5-slot equipment model — phase 18

- EquipmentSlot collapses 7 → 3 (weapon | armor | accessory); an
  accessory is one of an explicit extensible kind list (AccessoryKind:
  head | hands | feet | amulet | ring | charm — body is armor, not an
  accessory). Worn capacity is 5: weapon 1, armor 1, accessory 3
  (SLOT_CAPACITY).
- Character.equipment becomes EquipmentLoadout { weapon, armor,
  accessories[≤3] }; equipItem/unequipItem gain accessory-position
  semantics (fill-first-free, replaceIndex, guarded no-op when full).
- Legacy head/hands/feet fold into accessory kinds and body folds into
  armor (LEGACY_SLOT_MAP); templates/mod-pools/affix maps re-slotted
  mechanically (dead content walking — deleted in phases 21-22; no
  rebalance).
- wornPerSlot capacity-aware inventory convention; firstEquippedPerSlot
  deprecated wrapper (phase 23 removes).
- GAME_STATE_VERSION 11→12: worn gear re-slots deterministically,
  accessory overflow returns to inventory.
- Mobile: character screen renders Weapon/Armor/Accessory×3; equip
  actions gain the accessory-full guard.

Decisions:
- Slot model ships first so phase 19's relics land as ordinary
  equipment in ordinary slots (no parallel relic domain).
- Accessory positions are interchangeable (array, not accessory1..3 keys).

Closes #<phase-issue-number>
```

## DoD

Flip Phase 18's `[ ]` → `[x]` in `plan/steps/01_build_plan.md`, append
commit hash, add to "Phase log". Confirm CI-green.

## Confirm deploy

```bash
npm run deploy:check
```

## Follow-ups (out of scope this phase)

- Signet relics + signature gating — phase 19 (consumes this model).
- Removing `firstEquippedPerSlot` wrapper + any lingering legacy-slot
  vestiges — phase 23.
- Accessory drag-reorder / richer slot UX — post-epic candidate.
