# Equipment & Items

> **Status:** Spec 05 + Spec 05c landed. Equipment is now an *instance* shape
> with per-instance `rarity` + `requiredLevel` (PoE2-style); the legacy
> `Equipment.tier` field is removed. The Spec 05b 50-item library is archived
> at `src/Items/_archive/` and replaced by 21 `EquipmentTemplate`s and 2
> `UniqueItemTemplate`s, dropped at runtime through the new `dropItem` factory.
> Outstanding work — modifier catalogue content (Spec 05d), set bonuses
> (Spec 05e), loot drops (Spec 07), shop pricing (Spec 08).

## Item Categories

Defined in [`src/Items/types.ts`](../src/Items/types.ts).

| Category | Discriminator | Notes |
|----------|---------------|-------|
| Equipment | `category: 'equipment'` | Has `slot`, `rarity`, `requiredLevel`, optional `rolledMods`, `statModifiers`, `passiveEffects`, `onHitEffects`, `onDefendEffects`, `critStyle`, `resourceInteraction`. |
| Consumable | `category: 'consumable'` | Has `quantity` and any combination of `healAmount`, `effectId`, `inlineEffect`, `resourceGrant`, `intensityOverride`, `durationOverride`. |
| Material | `category: 'material'` | Has `quantity`. Crafting is pending. |
| Quest Item | `category: 'quest-item'` | Has `questId`. |

The `Item` type is a discriminated union; `isEquipment` / `isConsumable` /
`isMaterial` / `isQuestItem` are exported type guards.

## Equipment Slots

`'weapon' | 'armor' | 'accessory' | 'head' | 'body' | 'hands' | 'feet'`

All seven slots may be simultaneously equipped (Spec 05 Q1). A
`Character.equipment: Partial<Record<EquipmentSlot, Equipment>>` map carries
the wearer's current loadout.

## Equipment Type (instance shape — Spec 05c)

```ts
interface Equipment extends BaseItem {
    category: 'equipment';
    slot: EquipmentSlot;
    rarity: ItemRarity;                             // 'common' | 'uncommon' | 'rare' | 'unique'
    requiredLevel: number;                          // gates drop / equip; scales mod ranges
    rolledMods?:          RolledModifier[];         // present on Uncommon / Rare / Unique drops
    statModifiers?:       StatModifier[];           // folded into derivedStats at equip-time
    passiveEffects?:      string[];                 // effect IDs applied as permanent ActiveEffects
    onHitEffects?:        EquipmentProcTrigger[];   // surfaced into the Spec 03 proc roll on attack
    onDefendEffects?:     EquipmentProcTrigger[];   // surfaced into the Spec 03 proc roll on defend
    critStyle?:           'double' | 'pierce';      // default crit style (per-skill override wins)
    resourceInteraction?: ResourceInteraction;      // optional combat-start tokens + generation bonuses
}

type ItemRarity = 'common' | 'uncommon' | 'rare' | 'unique';

interface RolledModifier {
    modId: string;   // catalogue entry id (Spec 05d)
    value: number;   // rolled at drop time, within the catalogue's level-banded range
}
```

Per Spec 05c the legacy `Equipment.tier: 1 | 2 | 3` field is **removed**.
Rarity is the instance-level grade (every drop carries one); `requiredLevel`
controls when a template can drop and scales rolled-modifier value bands.
Manually-constructed Equipment (test fixtures, hand-curated starting gear)
may omit `rolledMods`; procedural drops always carry it on Uncommon+.

### `EquipmentTemplate` / `UniqueItemTemplate` (definition shape)

```ts
interface EquipmentTemplate {
    id: string;
    name: string;
    description: string;
    slot: EquipmentSlot;
    requiredLevel: number;
    baseStatModifiers?: StatModifier[];   // stats on a 0-mod (Common) instance
}

interface UniqueItemTemplate extends EquipmentTemplate {
    fixedModIds: [string, string, string];  // exactly 3 catalogue IDs
    setMembership?: string;                  // reserved for Spec 05e
}
```

Templates live in [`src/Items/equipment.templates.ts`](../src/Items/equipment.templates.ts)
(56 entries — 3 **base** templates + 5 curated **affixed variants** per slot,
across 7 slots) and
[`src/Items/unique.templates.ts`](../src/Items/unique.templates.ts) (7 entries).
A template is the authored data — `dropItem` turns it into a runtime
`Equipment` instance with rolled modifiers. The base templates span three
progression tiers by `requiredLevel` (1 / 10 / 20); the affixed variants are
authored prefixed/suffixed items (see **[Affixed variants](#affixed-variants-phase-152)**).

### `dropItem` factory

```ts
function dropItem(
    templateId: string,
    playerLevel: number,
    rarity?: ItemRarity,         // omit to draw from the weighted table
    rng?: () => number,          // defaults to Math.random
    affix?: AffixControl,        // omit for classic affix-free drops
): Equipment;
```

Pipeline (per [`src/Items/item.factory.ts`](../src/Items/item.factory.ts)):

1. Look up the template (regular first, then Unique).
2. Resolve rarity. Unique templates always drop at `'unique'` rarity. A
   regular template's rarity is the caller-supplied value, otherwise drawn
   from the weighted table below. Passing `rarity: 'unique'` for a regular
   template throws — `unique` is reserved for `UniqueItemTemplate`.
3. Assert `playerLevel >= template.requiredLevel`.
4. Call `rollModifiers(template, rarity, playerLevel, rng)` to produce the
   `RolledModifier[]` payload.
5. If the `affix` control is enabled (or the template is a curated affixed
   variant), layer prefix/suffix affixes on top per the rarity defaults
   (see below), folding each affix's `modIds` into the rolled-mod set.
6. Call `resolveModifiers(template, rolledMods)` to merge base stats and
   rolled-mod payloads into the final `statModifiers`.
7. Return the fully-formed `Equipment` instance, stamped with affix
   provenance (`prefixId` / `suffixId` / `prefixName` / `suffixName`) and a
   composed `name` when affixes were applied.

**Determinism:** every random draw inside the factory consumes from the
caller-supplied `rng`. Two calls with the same seeded `rng` return identical
Equipment.

#### `loot.generation` + `equipped` helpers (Phase 154)

Two thin read-side helpers were absorbed from the mobile app
([`src/Items/loot.generation.ts`](../src/Items/loot.generation.ts) +
[`src/Items/equipped.ts`](../src/Items/equipped.ts)):

| Export | Description |
|--------|-------------|
| `equipmentFromTemplate(template)` | Materialise a bare `Equipment` instance from an `EquipmentTemplate` with no rarity roll — base stats only, no rolled mods. The deterministic floor under `dropItem`. |
| `generateRarityDrop(rarity, opts)` | Roll an affixed drop **at a target rarity** (rather than from the weighted table), returning a `GenerateRarityDropResult`. `opts` carries `playerLevel`, an optional seeded `rng`, and `maxAttempts` (default 16) for the affix-count retry loop. |
| `dropItemAtRarity(templateId, playerLevel, rarity, rng?)` | Roll one equipment drop carrying exactly the rarity's named-affix count (`AFFIXES_PER_RARITY[rarity]`), with the display rarity stamped on the instance. Passes an optional seeded `rng` for deterministic drops; used by the loot-cache reward table. |
| `countNamedAffixes(item)` | Count the *named* affixes (prefix + suffix) on an `Equipment` instance — the visible affix count that drives the rarity contract. Distinct from `rolledMods.length` since one affix can carry several modifier ids. |
| `hasBakedAffix(template)` | True when a base template pins a `prefixId` or `suffixId` (a curated library variant). Such templates are skipped by procedural rarity drops because their baked affix prevents meeting an exact rolled-affix count. |
| `AFFIXES_PER_RARITY` | `Record<ItemRarity, number>` — the canonical named-affix count per rarity tier: `common` 0 / `uncommon` 1 / `rare` 2 / `unique` 3. |
| `firstEquippedPerSlot(inventory)` | Map each occupied `Equipment['slot']` to the first worn item in that slot — the canonical "what's currently equipped" read. |
| `isEquippedFirstOfSlot(inventory, target)` | True when `target` is the slot's first-worn item. |
| `findEquippedInSlot(inventory, target)` | The worn sibling occupying `target`'s slot, or `null`. Pairs with `computeEquipDelta` (see [character.md](character.md#api)) to compute equip-change deltas. |

#### Rarity weight table (Spec 05c §9)

| Rarity   | Weight | Notes                                                  |
|----------|--------|--------------------------------------------------------|
| common   | 60     | Majority of drops; no rolled mods.                     |
| uncommon | 30     | One rolled procedural mod.                             |
| rare     |  9     | Two distinct rolled procedural mods.                   |
| unique   |  1     | UniqueItemTemplate only — exactly 3 `fixedModIds`.     |

For regular templates the unique row is excluded from the random draw —
the spec's "unique: 1" is the table-level weight, but uniqueness is
template-gated (specific templates only).

#### Mod count by rarity

| Rarity   | Mod count | Source                                       |
|----------|-----------|----------------------------------------------|
| common   | 0         | —                                            |
| uncommon | 1         | Procedural pool, slot-scoped                 |
| rare     | 2         | Procedural pool, slot-scoped, non-duplicate  |
| unique   | 3         | `UniqueItemTemplate.fixedModIds` (ordered)   |

Spec 05d replaces the Spec 05c stub catalogue with a slot-keyed catalogue of
98 procedural mods + 6 unique-only signature mods (Phase 153 status-family
expansion — was 72 + 6 after Phase 151, and 22 + 3 at the initial Spec 05d
ship). See **[Modifiers](#modifiers-spec-05d)**
below for the full catalogue, the substitution contract, and the
hidden-rarity weight table.

### Base template list (Spec 05c §6)

| Slot      | lvl 1 ID         | lvl 10 ID         | lvl 20 ID          |
|-----------|------------------|-------------------|--------------------|
| weapon    | `iron-blade`     | `steel-blade`     | `mithril-blade`    |
| armor     | `hide-vest`      | `chain-mail`      | `plate-mail`       |
| head      | `leather-cap`    | `chain-coif`      | `full-helm`        |
| body      | `cloth-wrap`     | `leather-coat`    | `scaled-coat`      |
| hands     | `cloth-gloves`   | `chain-gauntlets` | `plate-gauntlets`  |
| feet      | `sandals`        | `leather-boots`   | `iron-greaves`     |
| accessory | `copper-ring`    | `silver-ring`     | `gold-ring`        |

### Unique templates (Spec 05c §7 / Spec 05d §8)

Seven curated Uniques — the 2 originals plus 5 from the 2026-06-07 mid/late-game
content pass. `phoenix-mantle` and `titans-girdle` carry `setMembership:
'embers-of-rebirth'` (Spec 05e).

| ID                  | Slot      | requiredLevel | fixedModIds (canonical Spec 05d catalogue IDs)            |
|---------------------|-----------|---------------|-----------------------------------------------------------|
| `axioms-edge`       | weapon    | 5             | `wm-flat-damage`, `wm-body-gen`, `um-paradox-edge`        |
| `paradox-loop`      | accessory | 15            | `am-stance-res`, `am-proc-boost`, `um-resonance-prime`    |
| `prometheus-brand`  | weapon    | 25            | `wm-flat-damage`, `wm-bleeding-edge`, `um-promethean-spark` |
| `gorgon-fang`       | weapon    | 30            | `wm-mind-rend`, `wm-crit-damage`, `um-gorgon-stare`       |
| `phoenix-mantle`    | armor     | 35            | `armm-regen`, `armm-aegis`, `um-phoenix-heart`            |
| `oracle-eye`        | accessory | 40            | `am-all-attunement`, `am-regen`, `um-resonance-prime`     |
| `titans-girdle`     | body      | 45            | `bm-vitality`, `bm-damage-reduction`, `bm-thorns-proc`    |

### Affixed variants (Phase 152)

Each slot ships **5 curated affixed variants** alongside its 3 base templates.
An affixed variant is an `EquipmentTemplate` that names a source affix from
[`src/Items/affix.library.ts`](../src/Items/affix.library.ts) via `prefixId`
and/or `suffixId`. At drop time the factory always applies these pinned
affixes — folding the affix's `modIds` into the rolled-mod set and composing
the player-visible name via `composeItemName` (e.g. the `keen-iron-blade`
variant drops as **"Keen Iron Blade"**, `venomous-mithril-blade-of-frost` as
**"Venomous Mithril Blade of Frost"**). The dropped instance records the
affix provenance in `prefixId` / `suffixId` / `prefixName` / `suffixName`.

#### Procedural affixes via the `AffixControl`

`dropItem`'s optional `affix?: AffixControl` parameter (and the convenience
`dropItemWithAffixes` wrapper) layer **procedural** affixes on a base template.
When enabled, the number of affixes follows the rarity defaults:

| Rarity   | Procedural affixes                                      |
|----------|--------------------------------------------------------|
| common   | none                                                   |
| uncommon | exactly one — prefix **or** suffix (rng coin flip)     |
| rare     | both — one prefix **and** one suffix                   |
| unique   | none (a unique's identity is its three fixed mods)     |

`AffixControl` also exposes `maxPrefixes` / `maxSuffixes` caps (which bypass
the uncommon coin flip) and `pinPrefixId` / `pinSuffixId` to force a specific
affix. Omitting the `affix` parameter entirely keeps the classic affix-free
`dropItem` behaviour. Curated affixed variants always apply their pinned
affixes regardless of the `affix` argument.

#### Affix library inventory

The naming layer is data in [`src/Items/affix.library.ts`](../src/Items/affix.library.ts),
exported through the package barrel as `prefixes`, `suffixes`, `allAffixes`,
`getAffixById`, `affixesForSlot`, `composeItemName`, and `AFFIX_RARITY_WEIGHTS`.
Each `Affix` couples a display `word` to one or more existing catalogue
`modIds` (see [Modifiers](#modifiers-spec-05d)); it never introduces new
stats. `affixesForSlot(slot, level, role)` returns the declaration-ordered
candidates whose `validSlots` include the slot and whose `minLevel <= level`.
Affix draws reuse the hidden-mod rarity scale (`AFFIX_RARITY_WEIGHTS`:
`common_mod` 10 / `uncommon_mod` 3 / `rare_mod` 1). Offensive status affixes
on `weapon`/`hands` slots (those classified by `isOffensiveStatusAffix` — tagged
`status`, on an offensive slot, and not defensive/sustain/cleanse) receive an
additional draw-weight multiplier from `STATUS_AFFIX_DRAW_BIAS` (default `3`,
registered as `loot.statusAffixDrawBias` in the tunable registry). This raises
their effective weights to `common_mod` 30 / `uncommon_mod` 9 / `rare_mod` 3,
making an uncommon status affix competitive with a common flat-stat prefix and
ensuring status-effect play is the expected affix outcome on these slots.

**Prefixes (66)** — lead the item name (`"<word> <base>"`):

| Affix id | Word | Slots | Mod ids | Rarity | Min lvl |
|----------|------|-------|---------|--------|---------|
| `pfx-keen` | Keen | weapon | `wm-flat-damage` | common | 1 |
| `pfx-honed` | Honed | weapon | `wm-skill-edge` | common | 1 |
| `pfx-vicious` | Vicious | weapon | `wm-flat-damage`, `wm-crit-rate` | uncommon | 10 |
| `pfx-savage` | Savage | weapon | `wm-crit-damage` | rare | 20 |
| `pfx-vampiric` | Vampiric | weapon | `wm-lifesteal` | uncommon | 1 |
| `pfx-crushing` | Crushing | hands | `hndm-strength` | common | 1 |
| `pfx-fortified` | Fortified | body | `bm-armor` | common | 1 |
| `pfx-hardened` | Hardened | armor | `armm-defense` | common | 1 |
| `pfx-stalwart` | Stalwart | body | `bm-vitality` | common | 1 |
| `pfx-swift` | Swift | feet | `fm-evasion` | common | 1 |
| `pfx-phantom` | Phantom | feet | `fm-evasion-proc` | uncommon | 10 |
| `pfx-warded` | Warded | head | `hm-mental-defense` | common | 1 |
| `pfx-sage` | Sage | head | `hm-insight` | uncommon | 5 |
| `pfx-balanced` | Balanced | accessory | `am-cross-stat` | common | 1 |
| `pfx-resonant` | Resonant | accessory | `am-stance-res` | uncommon | 1 |
| `pfx-blazing` | Blazing | weapon | `wm-bleeding-edge` | uncommon | 10 |
| `pfx-venomous` | Venomous | weapon | `wm-venom-coat` | uncommon | 1 |
| `pfx-frostbitten` | Frostbitten | weapon | `wm-frost-brand` | uncommon | 10 |
| `pfx-storming` | Storming | weapon | `wm-storm-edge` | rare | 15 |
| `pfx-stunning` | Stunning | weapon | `wm-dazing-pommel` | uncommon | 5 |
| `pfx-baleful` | Baleful | weapon | `wm-status-amp` | rare | 10 |
| `pfx-channeling` | Channeling | weapon | `wm-mind-gen` | common | 1 |
| `pfx-calculating` | Calculating | hands | `hndm-mind-gen` | common | 1 |
| `pfx-resolved` | Resolved | body | `bm-heart-start` | uncommon | 1 |
| `pfx-vanguard` | Vanguard | feet | `fm-initiative-tokens` | uncommon | 1 |
| `pfx-shadowed` | Shadowed | feet | `fm-stealth` | rare | 10 |
| `pfx-lucky` | Lucky | feet | `fm-luck` | uncommon | 1 |
| `pfx-provoking` | Provoking | body | `bm-taunt-proc` | uncommon | 5 |
| `pfx-warding` | Warding | body | `bm-barrier-proc` | rare | 10 |
| `pfx-adamant` | Adamant | armor | `armm-body-resist` | common | 1 |
| `pfx-sanguine` | Sanguine | armor | `armm-heart-resist` | common | 1 |
| `pfx-reinforced` | Reinforced | armor | `armm-mhp` | uncommon | 5 |
| `pfx-stoic` | Stoic | head | `hm-mind-resist` | common | 1 |
| `pfx-disarming` | Disarming | hands | `hndm-disarm` | rare | 10 |
| `pfx-dazzling` | Dazzling | hands | `hndm-blinding` | uncommon | 5 |
| `pfx-empathic` | Empathic | head | `hm-heart-focus` | uncommon | 1 |
| `pfx-slowing` | Slowing | weapon | `wm-slowing` | common | 1 |
| `pfx-hunters` | Hunter's | weapon | `wm-marking` | common | 1 |
| `pfx-immolating` | Immolating | weapon | `wm-immolate` | uncommon | 5 |
| `pfx-rending` | Rending | weapon | `wm-rending` | uncommon | 10 |
| `pfx-plague` | Plague | weapon | `wm-plague-edge` | uncommon | 10 |
| `pfx-withering` | Withering | weapon | `wm-withering` | uncommon | 15 |
| `pfx-heartrending` | Heartrending | weapon | `wm-heartbreak` | uncommon | 10 |
| `pfx-toxic` | Toxic | weapon | `wm-toxic-edge` | rare | 20 |
| `pfx-concussive` | Concussive | weapon | `wm-concussive` | rare | 15 |
| `pfx-petrifying` | Petrifying | weapon | `wm-petrifying` | rare | 25 |
| `pfx-terrifying` | Terrifying | weapon | `wm-terrorize` | rare | 15 |
| `pfx-cursed` | Cursed | weapon | `wm-cursed-edge` | rare | 20 |
| `pfx-slumbering` | Slumbering | weapon | `wm-soporific` | rare | 15 |
| `pfx-hexing` | Hexing | weapon | `wm-hexing` | rare | 20 |
| `pfx-sapping` | Sapping | hands | `hndm-sap` | common | 1 |
| `pfx-ensnaring` | Ensnaring | hands | `hndm-hobbling` | uncommon | 10 |
| `pfx-toppling` | Toppling | hands | `hndm-toppling` | uncommon | 10 |
| `pfx-enfeebling` | Enfeebling | hands | `hndm-enfeeble` | uncommon | 15 |
| `pfx-enthralling` | Enthralling | hands | `hndm-enthrall` | rare | 20 |
| `pfx-cruel` | Cruel | weapon | `wm-flat-damage`, `wm-rending` | uncommon | 10 |
| `pfx-malefic` | Malefic | weapon | `wm-status-amp`, `wm-cursed-edge` | rare | 20 |
| `pfx-pestilent` | Pestilent | weapon | `wm-plague-edge`, `wm-venom-coat` | rare | 15 |
| `pfx-oracular` | Oracular | head | `hm-oracle` | rare | 20 |
| `pfx-openminded` | Open | head | `hm-open-mind` | uncommon | 5 |
| `pfx-bracing` | Bracing | body | `bm-defend-up` | common | 1 |
| `pfx-clearheaded` | Clearheaded | armor | `armm-mind-resist` | common | 1 |
| `pfx-unbreakable` | Unbreakable | armor | `armm-stoic-bulwark` | rare | 15 |
| `pfx-attuned` | Attuned | accessory | `am-advantage-mind` | rare | 20 |
| `pfx-paragon` | Paragon | accessory | `am-all-stats` | rare | 25 |
| `pfx-fleeting` | Fleeting | feet | `fm-evasion-proc` | uncommon | 10 |

**Suffixes (66)** — trail the item name (`"<base> <word>"`):

| Affix id | Word | Slots | Mod ids | Rarity | Min lvl |
|----------|------|-------|---------|--------|---------|
| `sfx-of-the-bear` | of the Bear | armor | `armm-vitality` | common | 1 |
| `sfx-of-the-ox` | of the Ox | body | `bm-vitality` | common | 1 |
| `sfx-of-clarity` | of Clarity | head | `hm-mind-gen` | uncommon | 1 |
| `sfx-of-insight` | of Insight | head | `hm-insight` | uncommon | 5 |
| `sfx-of-warding` | of Warding | armor | `armm-stoic` | uncommon | 10 |
| `sfx-of-the-fortress` | of the Fortress | body | `bm-damage-reduction` | rare | 15 |
| `sfx-of-thorns` | of Thorns | body | `bm-reflect` | rare | 10 |
| `sfx-of-the-fox` | of the Fox | feet | `fm-physical-save` | common | 1 |
| `sfx-of-the-wind` | of the Wind | feet | `fm-haste` | rare | 20 |
| `sfx-of-precision` | of Precision | hands | `hndm-crit-rate` | uncommon | 10 |
| `sfx-of-the-duelist` | of the Duelist | hands | `hndm-counter` | rare | 20 |
| `sfx-of-the-leech` | of the Leech | weapon | `wm-lifesteal` | uncommon | 1 |
| `sfx-of-ruin` | of Ruin | weapon | `wm-exploit` | rare | 10 |
| `sfx-of-mending` | of Mending | accessory | `am-regen` | uncommon | 10 |
| `sfx-of-the-heart` | of the Heart | accessory | `am-heart-focus` | common | 1 |
| `sfx-of-the-triune` | of the Triune | accessory | `am-all-attunement` | rare | 25 |
| `sfx-of-venom` | of Venom | weapon | `wm-venom-coat` | uncommon | 1 |
| `sfx-of-frost` | of Frost | weapon | `wm-frost-brand` | uncommon | 10 |
| `sfx-of-the-tempest` | of the Tempest | weapon | `wm-storm-edge` | rare | 15 |
| `sfx-of-malice` | of Malice | weapon | `wm-status-amp` | rare | 10 |
| `sfx-of-the-serpent` | of the Serpent | weapon | `wm-mind-rend` | rare | 20 |
| `sfx-of-focus` | of Focus | weapon | `wm-mind-gen` | common | 1 |
| `sfx-of-momentum` | of Momentum | feet | `fm-initiative-tokens` | uncommon | 1 |
| `sfx-of-resolve` | of Resolve | body | `bm-heart-start` | uncommon | 1 |
| `sfx-of-the-bulwark` | of the Bulwark | body | `bm-barrier-proc` | rare | 10 |
| `sfx-of-provocation` | of Provocation | body | `bm-taunt-proc` | uncommon | 5 |
| `sfx-of-stone` | of Stone | armor | `armm-body-resist` | common | 1 |
| `sfx-of-the-stalwart` | of the Stalwart | armor | `armm-mhp` | uncommon | 5 |
| `sfx-of-the-sentinel` | of the Sentinel | head | `hm-mind-resist` | common | 1 |
| `sfx-of-purity` | of Purity | accessory | `am-cleanse` | uncommon | 5 |
| `sfx-of-fortune` | of Fortune | accessory | `am-luck` | common | 1 |
| `sfx-of-the-hex` | of the Hex | accessory | `am-status-amp` | rare | 10 |
| `sfx-of-resilience` | of Resilience | accessory | `am-fortitude` | uncommon | 5 |
| `sfx-of-shadows` | of Shadows | feet | `fm-stealth` | rare | 10 |
| `sfx-of-the-gambler` | of the Gambler | feet | `fm-luck` | uncommon | 1 |
| `sfx-of-silence` | of Silence | hands | `hndm-disarm` | rare | 10 |
| `sfx-of-torpor` | of Torpor | weapon | `wm-slowing` | common | 1 |
| `sfx-of-the-hunt` | of the Hunt | weapon | `wm-marking` | common | 1 |
| `sfx-of-cinders` | of Cinders | weapon | `wm-immolate` | uncommon | 5 |
| `sfx-of-rending` | of Rending | weapon | `wm-rending` | uncommon | 10 |
| `sfx-of-pestilence` | of Pestilence | weapon | `wm-plague-edge` | uncommon | 10 |
| `sfx-of-decay` | of Decay | weapon | `wm-withering` | uncommon | 15 |
| `sfx-of-heartache` | of Heartache | weapon | `wm-heartbreak` | uncommon | 10 |
| `sfx-of-blight` | of Blight | weapon | `wm-toxic-edge` | rare | 20 |
| `sfx-of-concussion` | of Concussion | weapon | `wm-concussive` | rare | 15 |
| `sfx-of-petrifaction` | of Petrifaction | weapon | `wm-petrifying` | rare | 25 |
| `sfx-of-dread` | of Dread | weapon | `wm-terrorize` | rare | 15 |
| `sfx-of-the-curse` | of the Curse | weapon | `wm-cursed-edge` | rare | 20 |
| `sfx-of-slumber` | of Slumber | weapon | `wm-soporific` | rare | 15 |
| `sfx-of-hexes` | of Hexes | weapon | `wm-hexing` | rare | 20 |
| `sfx-of-sapping` | of Sapping | hands | `hndm-sap` | common | 1 |
| `sfx-of-snares` | of Snares | hands | `hndm-hobbling` | uncommon | 10 |
| `sfx-of-the-avalanche` | of the Avalanche | hands | `hndm-toppling` | uncommon | 10 |
| `sfx-of-weariness` | of Weariness | hands | `hndm-enfeeble` | uncommon | 15 |
| `sfx-of-enthrallment` | of Enthrallment | hands | `hndm-enthrall` | rare | 20 |
| `sfx-of-cruelty` | of Cruelty | weapon | `wm-flat-damage`, `wm-rending` | uncommon | 10 |
| `sfx-of-affliction` | of Affliction | weapon | `wm-status-amp`, `wm-plague-edge` | rare | 15 |
| `sfx-of-the-plaguebearer` | of the Plaguebearer | weapon | `wm-plague-edge`, `wm-venom-coat` | rare | 15 |
| `sfx-of-prophecy` | of Prophecy | head | `hm-oracle` | rare | 20 |
| `sfx-of-the-open-mind` | of the Open Mind | head | `hm-open-mind` | uncommon | 5 |
| `sfx-of-the-bastion` | of the Bastion | body | `bm-defend-up` | common | 1 |
| `sfx-of-lucidity` | of Lucidity | armor | `armm-mind-resist` | common | 1 |
| `sfx-of-the-immovable` | of the Immovable | armor | `armm-stoic-bulwark` | rare | 15 |
| `sfx-of-attunement` | of Attunement | accessory | `am-advantage-mind` | rare | 20 |
| `sfx-of-the-paragon` | of the Paragon | accessory | `am-all-stats` | rare | 25 |
| `sfx-of-quickening` | of Quickening | feet | `fm-evasion-proc` | uncommon | 10 |

### `EquipmentProcTrigger`

```ts
interface EquipmentProcTrigger {
    effectId: string;
    target: 'self' | 'opponent';
    baseChance: number;        // 0–1, fed into the same final chance formula as JSON triggers
    tier: 1 | 2 | 3;           // respects the wearer's per-cell ProcUnlocks cap
    intensityOverride?: number;
    durationOverride?: number;
    fumbleEffectId?: string;
}
```

Per Spec 05 Q6 (option A), equipment triggers SHARE the Spec 03 proc roll
machinery instead of running a separate roll. `rollForCombatEffects` accepts
an `equipmentTriggers` parameter that is concatenated onto the cell's
eligible list (with the same tier-cap filtering).

### `ResourceInteraction`

```ts
interface ResourceInteraction {
    combatStartTokens?: Partial<CombatResources>;
    generationBonus?:   ResourceGenerationBonus[];
}

interface ResourceGenerationBonus {
    trigger:      'hit' | 'miss' | 'defend' | 'any';
    resourceType: keyof CombatResources; // heart / body / mind / fallacy / paradox
    bonus:        number;
}
```

`aggregateCombatStartTokens(equipment)` sums every equipped item's
`combatStartTokens` into a flat `CombatResources` snapshot. The combat
reducer's `initializeCombat` calls this once at battle start, so a Berserker
Band-style accessory can begin the fight with `combatResources.body = 3`.

`applyEquipmentGenerationBonus(resources, equipment, outcome)` folds the
applicable bonuses on top of the base generation table from
`generateBasicActionResources` (Spec 04). `'any'` matches every outcome;
specific triggers match only the matching outcome. Negative bonuses are
clamped at zero per counter.

## Modifiers (Spec 05d)

Modifiers are the data layer behind `rollModifiers` / `resolveModifiers`. A
`Modifier` carries an ID, a hidden rarity, eligible slots, level-banded value
tiers, and a `payload` template that the factory substitutes at resolve time
into the wearer's `Equipment` shape (`statModifiers`, `passiveEffects`,
`onHitEffects`, `onDefendEffects`, `resourceInteraction`).

```ts
type HiddenModRarity = 'common_mod' | 'uncommon_mod' | 'rare_mod';

interface ModValueTier {
    levelReq: number;
    range: [number, number]; // inclusive uniform integer roll
}

type ModifierPayload = Partial<Pick<Equipment,
    | 'statModifiers'
    | 'passiveEffects'
    | 'onHitEffects'
    | 'onDefendEffects'
    | 'resourceInteraction'
>>;

interface Modifier {
    id: string;
    name: string;
    hiddenRarity: HiddenModRarity;
    validSlots: EquipmentSlot[];
    levelTiers: ModValueTier[]; // ascending by levelReq; pickValueTier picks the highest <= playerLevel
    payload: ModifierPayload;
}
```

### Hidden rarity weights

`rollModifiers` weighted-samples without replacement using these per-mod
weights:

| HiddenModRarity | Weight |
|-----------------|--------|
| `common_mod`    | 10     |
| `uncommon_mod`  | 3      |
| `rare_mod`      | 1      |

### Substitution contract

`resolveModifiers` walks each `RolledModifier`, looks up the catalogue entry,
and merges the `payload` into the resulting Equipment instance:

| Payload field                              | Substitution rule                                                                              |
|--------------------------------------------|------------------------------------------------------------------------------------------------|
| `statModifiers[].value`                    | `value: 0` sentinel → rolled value. Non-zero values are kept as authored.                       |
| `resourceInteraction.generationBonus[].bonus` | `bonus: 0` sentinel → rolled value.                                                          |
| `resourceInteraction.combatStartTokens[k]` | A `0` value → rolled value. Same key across mods is summed (additive — Spec 05b Q2).            |
| `passiveEffects: string[]`                 | Concatenated as-is. Rolled value is a presence marker (no substitution).                        |
| `onHitEffects` / `onDefendEffects`         | Concatenated as-is. Proc triggers ride the existing Spec 03 proc-roll machinery.                |

### Procedural pools

Each pool ships at least 3 mods (one per hidden rarity) so an Uncommon roll
always has at least one `uncommon_mod` candidate and a Rare roll always has
at least one `rare_mod` candidate when level requirements allow. Phase 151
expanded the original 25-mod catalogue to 78 entries (72 procedural + 6
unique-only) and extended the top-end value tiers to levelReq 30/40/50 on the
flat-stat mods so endgame drops keep scaling. `modifier.catalogue.ts` is
canonical; the tables below mirror it.

#### `weaponModPool` (31)
| ID | Name | hiddenRarity | Level tiers (levelReq → range) |
|----|------|--------------|--------------------------------|
| `wm-flat-damage` | Keen Edge | `common_mod` | 1 → [1,3], 10 → [4,8], 20 → [9,15], 30 → [16,24], 40 → [25,35], 50 → [36,50] |
| `wm-lifesteal` | Vampiric Strike | `uncommon_mod` | 1 → [1,2], 10 → [2,3], 20 → [3,5] |
| `wm-body-gen` | Body Resonance | `uncommon_mod` | 1 → [1,1], 10 → [1,2], 20 → [2,3] |
| `wm-exploit` | Exploit Weakness | `rare_mod` | 10 → [2,4], 20 → [5,8] |
| `wm-skill-edge` | Honed Technique | `common_mod` | 1 → [1,2], 10 → [3,5], 20 → [6,10], 30 → [11,16], 40 → [17,24], 50 → [25,34] |
| `wm-crit-rate` | Cruel Point | `uncommon_mod` | 10 → [1,1], 30 → [1,1] |
| `wm-crit-damage` | Savage Bite | `rare_mod` | 20 → [1,1], 40 → [1,1] |
| `wm-mind-rend` | Mind Render | `rare_mod` | 20 → [3,6], 30 → [7,11], 40 → [12,18], 50 → [19,27] |
| `wm-heart-rend` | Heart Cleaver | `rare_mod` | 15 → [2,5], 30 → [6,10], 40 → [11,16], 50 → [17,24] |
| `wm-bleeding-edge` | Bleeding Edge | `uncommon_mod` | 10 → [1,1], 30 → [1,1], 50 → [1,1] |
| `wm-accuracy` | True Aim | `common_mod` | 1 → [1,1], 20 → [1,1], 40 → [1,1] |
| `wm-venom-coat` | Venomous Coating | `uncommon_mod` | 1 → [1,1], 20 → [1,1], 40 → [1,1] |
| `wm-frost-brand` | Frostbrand | `uncommon_mod` | 10 → [1,1], 30 → [1,1] |
| `wm-storm-edge` | Storm Edge | `rare_mod` | 15 → [1,1], 35 → [1,1] |
| `wm-dazing-pommel` | Dazing Pommel | `uncommon_mod` | 5 → [1,1], 25 → [1,1] |
| `wm-mind-gen` | Insightful Hilt | `common_mod` | 1 → [1,1], 10 → [1,2], 20 → [2,3] |
| `wm-status-amp` | Catalytic Edge | `rare_mod` | 10 → [1,1], 30 → [1,1] |
| `wm-slowing` | Hobbling Edge | `common_mod` | 1 → [1,1], 20 → [1,1] |
| `wm-marking` | Hunter's Notch | `common_mod` | 1 → [1,1], 20 → [1,1] |
| `wm-immolate` | Immolating Brand | `uncommon_mod` | 5 → [1,1], 25 → [1,1] |
| `wm-rending` | Rending Edge | `uncommon_mod` | 10 → [1,1], 30 → [1,1] |
| `wm-plague-edge` | Plague Edge | `uncommon_mod` | 10 → [1,1], 30 → [1,1] |
| `wm-withering` | Withering Edge | `uncommon_mod` | 15 → [1,1], 35 → [1,1] |
| `wm-heartbreak` | Heartbreak Edge | `uncommon_mod` | 10 → [1,1], 30 → [1,1] |
| `wm-toxic-edge` | Toxic Edge | `rare_mod` | 20 → [1,1], 40 → [1,1] |
| `wm-concussive` | Concussive Edge | `rare_mod` | 15 → [1,1], 35 → [1,1] |
| `wm-petrifying` | Petrifying Edge | `rare_mod` | 25 → [1,1], 45 → [1,1] |
| `wm-terrorize` | Terrorizing Edge | `rare_mod` | 15 → [1,1], 35 → [1,1] |
| `wm-cursed-edge` | Cursed Edge | `rare_mod` | 20 → [1,1], 40 → [1,1] |
| `wm-soporific` | Soporific Edge | `rare_mod` | 15 → [1,1], 35 → [1,1] |
| `wm-hexing` | Hexing Edge | `rare_mod` | 20 → [1,1], 40 → [1,1] |

#### `headModPool` (11)
| ID | Name | hiddenRarity | Level tiers |
|----|------|--------------|-------------|
| `hm-max-hp` | Resilient Mind | `common_mod` | 1 → [5,15], 10 → [16,35], 20 → [36,60], 30 → [61,90], 40 → [91,130], 50 → [131,180] |
| `hm-mind-gen` | Clear Thought | `uncommon_mod` | 1 → [1,1], 10 → [1,2], 20 → [2,3] |
| `hm-effect-dur` | Focused Channel | `rare_mod` | 10 → [1,1] |
| `hm-mental-defense` | Warded Crown | `common_mod` | 1 → [2,5], 10 → [6,12], 20 → [13,22], 30 → [23,34], 40 → [35,48], 50 → [49,64] |
| `hm-insight` | Insightful | `uncommon_mod` | 5 → [1,2], 20 → [3,5], 35 → [6,9], 50 → [10,14] |
| `hm-foresight` | Oracle Sight | `rare_mod` | 20 → [1,1], 40 → [1,1] |
| `hm-effect-duration` | Lingering Sigil | `rare_mod` | 5 → [1,1], 25 → [1,1] |
| `hm-mind-resist` | Stoic Mind | `common_mod` | 1 → [1,1], 20 → [1,1] |
| `hm-heart-focus` | Empathic Crown | `uncommon_mod` | 1 → [1,2], 15 → [3,5], 30 → [6,9], 45 → [10,14] |
| `hm-oracle` | Oracle's Eye | `rare_mod` | 20 → [1,1], 40 → [1,1] |
| `hm-open-mind` | Open Mind | `uncommon_mod` | 5 → [1,1], 25 → [1,1] |

#### `bodyModPool` (10)
| ID | Name | hiddenRarity | Level tiers |
|----|------|--------------|-------------|
| `bm-armor` | Fortified | `common_mod` | 1 → [2,5], 10 → [6,12], 20 → [13,22], 30 → [23,34], 40 → [35,48], 50 → [49,64] |
| `bm-heart-gen` | Steady Heart | `uncommon_mod` | 1 → [1,1], 10 → [1,2], 20 → [2,3] |
| `bm-reflect` | Thorned | `rare_mod` | 10 → [1,3], 20 → [4,7] |
| `bm-vitality` | Stalwart | `common_mod` | 1 → [1,2], 10 → [3,5], 20 → [6,9], 30 → [10,14], 40 → [15,20], 50 → [21,28] |
| `bm-damage-reduction` | Bulwark | `rare_mod` | 15 → [1,1], 35 → [1,1] |
| `bm-thorns-proc` | Brazen Thorns | `uncommon_mod` | 10 → [1,1], 30 → [1,1], 50 → [1,1] |
| `bm-taunt-proc` | Provoking Plate | `uncommon_mod` | 5 → [1,1], 25 → [1,1] |
| `bm-barrier-proc` | Wardweave | `rare_mod` | 10 → [1,1], 30 → [1,1] |
| `bm-heart-start` | Resolute Bearing | `uncommon_mod` | 1 → [1,2], 20 → [2,4] |
| `bm-defend-up` | Bracing Plate | `common_mod` | 1 → [1,1], 20 → [1,1] |

#### `handsModPool` (14)
| ID | Name | hiddenRarity | Level tiers |
|----|------|--------------|-------------|
| `hndm-body-gen` | Iron Grip | `common_mod` | 1 → [1,1], 10 → [1,2], 20 → [2,2] |
| `hndm-crit` | Precise Hands | `uncommon_mod` | 1 → [1,2], 10 → [3,5], 20 → [6,9] |
| `hndm-block` | Shield Training | `rare_mod` | 5 → [1,1] |
| `hndm-strength` | Crushing Grasp | `common_mod` | 1 → [1,3], 10 → [4,7], 20 → [8,13], 30 → [14,20], 40 → [21,29], 50 → [30,40] |
| `hndm-crit-rate` | Deft Fingers | `uncommon_mod` | 10 → [1,1], 30 → [1,1], 50 → [1,1] |
| `hndm-counter` | Riposte Form | `rare_mod` | 20 → [1,1], 40 → [1,1] |
| `hndm-disarm` | Disarming Grip | `rare_mod` | 10 → [1,1], 30 → [1,1] |
| `hndm-blinding` | Blinding Flurry | `uncommon_mod` | 5 → [1,1], 25 → [1,1] |
| `hndm-mind-gen` | Calculating Hands | `common_mod` | 1 → [1,1], 10 → [1,2], 20 → [2,3] |
| `hndm-sap` | Sapping Grip | `common_mod` | 1 → [1,1], 20 → [1,1] |
| `hndm-hobbling` | Ensnaring Grip | `uncommon_mod` | 10 → [1,1], 30 → [1,1] |
| `hndm-toppling` | Toppling Strike | `uncommon_mod` | 10 → [1,1], 30 → [1,1] |
| `hndm-enfeeble` | Enfeebling Grip | `uncommon_mod` | 15 → [1,1], 35 → [1,1] |
| `hndm-enthrall` | Enthralling Touch | `rare_mod` | 20 → [1,1], 40 → [1,1] |

#### `feetModPool` (9)
| ID | Name | hiddenRarity | Level tiers |
|----|------|--------------|-------------|
| `fm-evasion` | Swift Feet | `common_mod` | 1 → [1,3], 10 → [4,7], 20 → [8,12], 30 → [13,18], 40 → [19,26], 50 → [27,36] |
| `fm-cs-tokens` | Ready Stride | `uncommon_mod` | 1 → [1,1], 10 → [1,2], 20 → [2,3] |
| `fm-initiative` | First Step | `rare_mod` | 5 → [1,3], 20 → [4,7] |
| `fm-evasion-proc` | Phantom Step | `uncommon_mod` | 10 → [1,1], 30 → [1,1], 50 → [1,1] |
| `fm-physical-save` | Sure Footing | `common_mod` | 1 → [2,4], 15 → [5,9], 30 → [10,16], 45 → [17,25], 50 → [26,34] |
| `fm-haste` | Fleetfoot | `rare_mod` | 20 → [1,1], 40 → [1,1] |
| `fm-stealth` | Shadowstep | `rare_mod` | 10 → [1,1], 30 → [1,1] |
| `fm-initiative-tokens` | Vanguard Stride | `uncommon_mod` | 1 → [1,1], 20 → [1,2] |
| `fm-luck` | Fortune's Tread | `uncommon_mod` | 1 → [1,2], 20 → [3,5], 40 → [6,9] |

#### `accessoryModPool` (12)
| ID | Name | hiddenRarity | Level tiers |
|----|------|--------------|-------------|
| `am-cross-stat` | Balanced Focus | `common_mod` | 1 → [1,2], 10 → [2,4], 20 → [4,7], 30 → [8,11], 40 → [12,16], 50 → [17,22] |
| `am-stance-res` | Resonant Stone | `uncommon_mod` | 1 → [1,2], 10 → [2,3], 20 → [3,4] |
| `am-proc-boost` | Catalyst Charm | `rare_mod` | 10 → [5,10], 20 → [11,20] |
| `am-heart-focus` | Heartstone | `common_mod` | 1 → [1,2], 15 → [3,5], 30 → [6,9], 45 → [10,14], 50 → [15,20] |
| `am-regen` | Mending Charm | `uncommon_mod` | 10 → [1,1], 30 → [1,1], 50 → [1,1] |
| `am-all-attunement` | Triune Sigil | `rare_mod` | 25 → [2,4], 40 → [5,8], 50 → [9,13] |
| `am-status-amp` | Hex Focus | `rare_mod` | 10 → [1,1], 30 → [1,1] |
| `am-cleanse` | Purifying Charm | `uncommon_mod` | 5 → [1,1], 25 → [1,1] |
| `am-luck` | Lucky Trinket | `common_mod` | 1 → [1,2], 15 → [3,5], 30 → [6,9], 45 → [10,14] |
| `am-fortitude` | Bulwark Bauble | `uncommon_mod` | 5 → [1,1], 25 → [1,1] |
| `am-advantage-mind` | Attuned Sigil | `rare_mod` | 20 → [1,1], 40 → [1,1] |
| `am-all-stats` | Paragon Charm | `rare_mod` | 25 → [1,1], 45 → [1,1] |

#### `armorModPool` (11)
| ID | Name | hiddenRarity | Level tiers |
|----|------|--------------|-------------|
| `armm-defense` | Hardened | `common_mod` | 1 → [3,7], 10 → [8,16], 20 → [17,28], 30 → [29,42], 40 → [43,58], 50 → [59,78] |
| `armm-heart-start` | Brave Bearing | `uncommon_mod` | 1 → [1,2], 10 → [2,3], 20 → [3,5], 30 → [5,7], 40 → [7,9], 50 → [9,12] |
| `armm-regen` | Enduring | `rare_mod` | 5 → [1,1], 30 → [1,1], 50 → [1,1] |
| `armm-vitality` | Ironhide | `common_mod` | 1 → [1,2], 10 → [3,5], 20 → [6,10], 30 → [11,16], 40 → [17,23], 50 → [24,32] |
| `armm-aegis` | Aegis Weave | `rare_mod` | 15 → [1,1], 35 → [1,1] |
| `armm-stoic` | Stoic Plating | `uncommon_mod` | 10 → [1,1], 30 → [1,1], 50 → [1,1] |
| `armm-body-resist` | Adamant Weave | `common_mod` | 1 → [1,1], 20 → [1,1] |
| `armm-heart-resist` | Sanguine Lining | `common_mod` | 1 → [1,1], 20 → [1,1] |
| `armm-mhp` | Reinforced Hide | `uncommon_mod` | 5 → [1,1], 25 → [1,1] |
| `armm-mind-resist` | Lucid Lining | `common_mod` | 1 → [1,1], 20 → [1,1] |
| `armm-stoic-bulwark` | Immovable Plating | `rare_mod` | 15 → [1,1], 35 → [1,1] |

### `uniqueModPool` (6 — Unique-only)

Per Spec 05d Q4 these mods are **never** drawn by the procedural roll path.
They only resolve when a `UniqueItemTemplate.fixedModIds` entry references
them.

| ID | Name | hiddenRarity | Level tiers |
|----|------|--------------|-------------|
| `um-stance-echo` | Stance Echo | `rare_mod` | 5 → [1,1], 15 → [1,2] |
| `um-paradox-edge` | Paradox Edge | `rare_mod` | 10 → [1,1] |
| `um-resonance-prime` | Resonance Prime | `rare_mod` | 15 → [1,2], 20 → [2,3] |
| `um-phoenix-heart` | Phoenix Heart | `rare_mod` | 25 → [1,1], 45 → [1,1] |
| `um-gorgon-stare` | Gorgon Stare | `rare_mod` | 30 → [4,8], 50 → [9,16] |
| `um-promethean-spark` | Promethean Spark | `rare_mod` | 20 → [1,1], 40 → [1,1] |

### Where the catalogue compromises with existing primitives

A few spec-suggested payloads have no direct primitive in the engine yet.
The catalogue maps to the closest existing effect and documents the trade
in a per-mod comment in [`modifier.catalogue.ts`](../src/Items/modifier.catalogue.ts):

- `hm-max-hp` — `EffectStatTarget` has no `maxHp`; the mod surfaces the
  `buff_max_hp_up` passive instead. Rolled value is a presence marker until
  the engine supports per-mod intensity overrides.
- `bm-reflect` — no `reflectDamage` stat; the mod attaches the `buff_reflect`
  passive.
- `am-proc-boost` — Spec 05d's "increase baseChance of existing onHitEffects
  by N%" is a meta-mod that isn't expressible as a data-only payload (Q1).
  The catalogue boosts `luck` (the proc-adjacent stat) by the rolled value
  until a meta-mod resolver lands.

## Consumable Type

```ts
interface Consumable extends BaseItem {
    category: 'consumable';
    quantity: number;
    effectId?:          string;                  // library lookup key
    inlineEffect?:      Effect;                  // bespoke one-off effect (Q8 option C)
    healAmount?:        number;                  // immediate flat HP heal (Q9 option C)
    resourceGrant?:     Partial<CombatResources>;// in-combat token delta (Spec 05b Q6)
    intensityOverride?: number;
    durationOverride?:  number;
}
```

`useConsumableEffect(player, consumable, round, lookupEffectFn)` applies the
payload onto a player snapshot:

1. If `healAmount` is set, restores that many HP (clamped via `heal`).
2. If `inlineEffect` is present, applies it via `applyEffect`.
3. If `effectId` resolves into the library, applies that effect via
   `applyEffect`.
4. The `resourceGrant` field (if any) is normalised into a full
   `CombatResources` delta and returned on `ConsumableUseResult.resourceGrant`.
   The combat resolver folds this into the live `combatResources` snapshot
   when the consumable is used inside a fight via `action: 'item'`.

Both inline and referenced effects may be present simultaneously. The caller
is responsible for decrementing the inventory stack via the existing
`useConsumable` inventory reducer.

Per Spec 05b Q3 (option B) philosophical tokens (`fallacy` / `paradox`) remain
skill-only. Library authors should restrict `resourceGrant` to `heart` /
`body` / `mind` keys even though the type permits the full union.

## Reducers

Pure functions in [`src/Character/equipment.reducer.ts`](../src/Character/equipment.reducer.ts):

| Function | Description |
|----------|-------------|
| `equipItem(character, item)` | Folds stat mods into `derivedStats`, pushes passive effects as permanent `ActiveEffect`s, replaces any prior slot occupant. |
| `unequipItem(character, slot)` | Removes the slot occupant, recomputes `derivedStats` from base stats + remaining equipment, prunes that item's passive effects (filtered by `sourceId`). |
| `getEquipmentModifiers(equipment)` | Aggregated `StatModifier` bundle keyed by stat name. Same shape as `getActiveEffectModifiers`. |

`equipItem` and `unequipItem` are pure — neither mutates the input character.

### Derived stat pipeline

Equipment modifiers and effects share the same `StatModifier` shape:

```
effectiveBase     = baseStat + Σ flatMod  ×  (1 + Σ (multMod - 1))
derived (initial) = deriveStats(effectiveBase)
derived (final)   = derived (initial) per-stat patches for flat + mult mods
```

Per Spec 05 Q3 option A, equipment modifiers are baked into `derivedStats`
at equip-time, so `character.derivedStats` is always "post-equipment". The
active-effects pipeline in `getEffectiveStats` re-derives further on top of
this post-equipment baseline.

## Inventory Reducer

Pure functions in [`src/Items/item.reducer.ts`](../src/Items/item.reducer.ts):

| Function | Description |
|----------|-------------|
| `addItem(inventory, item)` | Append. |
| `removeItem(inventory, itemId)` | Remove by ID. |
| `useConsumable(inventory, itemId)` | Decrement quantity; remove if 0. |
| `stackItem(inventory, itemId, amount)` | Merge stackables (consumables, materials). |

The Zustand store (`Game/store.ts`) wraps these alongside `equipItem` /
`unequipItem` / `useConsumable`, which additionally applies the
consumable's effect via `useConsumableEffect`.

## Combat resolver integration

- `initializeCombat` calls `aggregateCombatStartTokens(player.equipment)`
  instead of zero-seeding `combatResources`.
- `generateBasicActionResources(resources, stance, outcome, equipment?)`
  appends `applyEquipmentGenerationBonus(...)` onto the base-table token
  whenever an `equipment` map is passed (the combat resolver passes
  `player.equipment`).
- `runActionProcs` in `combat.resolver.ts` calls `getEquipmentProcTriggers`
  for the actor and forwards them as `equipmentTriggers` to
  `rollForCombatEffects`. Per Spec 05 Q6 these triggers participate in the
  same chance / crit / fumble math as the JSON-defined Stance × action
  table.
- A new `action: 'item'` branch in `resolveCombatRound` looks up
  `playerAction.itemId` in `player.inventory`, applies the consumable via
  `useConsumableEffect`, decrements the stack, and emits an
  `ItemPhaseEvent` (`used` or `blocked`) on the combat event stream. The
  enemy's basic action still resolves at passive defense.

## Library

Sources: [`src/Items/equipment.templates.ts`](../src/Items/equipment.templates.ts),
[`src/Items/unique.templates.ts`](../src/Items/unique.templates.ts), and
[`src/Items/consumable.library.ts`](../src/Items/consumable.library.ts).

> The previous 50-item Spec 05b library lives at
> [`src/Items/_archive/equipment.library.ts`](../src/Items/_archive/equipment.library.ts)
> for reference and migration auditing. It is no longer wired into the engine.

### Notation (consumables)

- `cs:` — `combatStartTokens` granted by `initializeCombat`. Format
  `cs: heart+N body+N mind+N` (omitted keys are 0). Per Q3 only the three
  stance keys are allowed.
- `gb:` — `generationBonus` entry, format
  `gb: <resourceType>/<trigger>/+<bonus>`. Trigger is one of
  `'hit' | 'miss' | 'defend' | 'any'` (Q10 option B — outcome-only, no stance
  filter).
- Stacking rule: all `combatStartTokens` from equipped items add together
  with no per-resource cap (Q2). Generation bonuses fire per applicable
  basic action and stack additively on top of the base table from Spec 04.

### Equipment templates (Spec 05c)

See the [Base template list](#base-template-list-spec-05c-§6),
[Affixed variants](#affixed-variants-phase-152), and
[Unique templates](#unique-templates-spec-05c-§7) above for the active
56 + 7 template set (3 base + 5 affixed variants per slot, plus 7 uniques).
Templates carry only base identity and a `baseStatModifiers`
floor; rarity, rolled mods, and the rest of the instance shape are decided
by `dropItem` at drop time. Spec 05d will layer themed mod pools and proc
triggers onto the rolled-mod catalogue.

### Consumables (12)

| ID | Effect | Resource Grant |
|----|--------|----------------|
| `healing-potion` | `healAmount: 20` | — |
| `minor-healing-potion` | `healAmount: 10` | — |
| `antidote` | `effectId: buff_cleanse` | — |
| `clarity-serum` | `effectId: buff_cleanse` | — |
| `focus-vial` | — | mind: 3 |
| `heart-draught` | — | heart: 3 |
| `body-elixir` | — | body: 3 |
| `berserker-brew` | `effectId: buff_haste` | body: 5 |
| `philosopher-tea` | `effectId: buff_critical_damage_up` | mind: 2 |
| `resonance-crystal` | — | body: 2, mind: 2, heart: 2 |
| `revive-crystal` | `effectId: buff_invincibility` (1 round) | — |
| `void-essence` | `effectId: buff_critical_damage_up` | heart: 2 |

Per Spec 05b Q3 the philosophical-token grants originally sketched for
`philosopher-tea` and `void-essence` were rewritten to stance tokens so the
Tier-1 → Tier-3 generation chain isn't short-circuited by an item.

`revive-crystal` substitutes `buff_invincibility` for the speculative
`prevent_ko` effect (which is not yet in the global effects library); revisit
when a dedicated "negate next lethal hit" effect lands.

## Set Items (Spec 05e / Phase 54)

Equipment can belong to named **sets**. Equipping multiple members of a
set grants threshold-keyed `SetBonus` payloads on top of the per-item
`statModifiers` / `resourceInteraction` / `passiveEffects`. Sets are
computed on-demand at every `initializeCombat` and
`generateBasicActionResources` call — there is no cached per-character
"active sets" state, which keeps equip/unequip side-effect-free.

### Type shape

```ts
interface SetBonus {
    resourceInteraction?: Partial<ResourceInteraction>;
    passiveEffects?: string[];        // effect-library IDs
    statModifiers?: StatModifier[];
}

interface ItemSet {
    id: string;
    name: string;
    description: string;
    memberTemplateIds: string[];      // EquipmentTemplate.id matches
    bonuses: Partial<Record<2 | 3 | 4, SetBonus>>;
}
```

Bonuses are sparse — a 2-piece set defines only `{ 2 }`, a 3-piece set
defines `{ 2, 3 }`. `getActiveSetBonuses` returns every threshold whose
piece count is met (so a 3-of-3 wearer gets BOTH the 2-piece and 3-piece
bonuses).

### Runtime application

- **Combat start tokens.** `initializeCombat` sums per-item
  `combatStartTokens` (existing `aggregateCombatStartTokens`) AND per-set
  `combatStartTokens` (new `aggregateSetStartTokens`) additively. Spec
  05e Q2 — no cap.
- **Basic action generation.**  `generateBasicActionResources` chains
  per-set `applySetGenerationBonus` after the per-item
  `applyEquipmentGenerationBonus`. Same `trigger: 'hit' | 'miss' |
  'defend' | 'any'` semantics; counters clamped to ≥ 0.
- **Passive effects.** Set `passiveEffects` are applied as combat-scoped
  `ActiveEffect`s on `combatState.player.effects` at the combat-start
  step, sourced as `'set-bonus'`. They live through the normal
  combat-end cleanup — they are NOT persisted on `character.effects`
  between combats (Spec 05e Q4).
- **Stat modifiers.** Set `statModifiers` fold through the same
  pipeline as equipment `statModifiers` (`getEquipmentModifiers` +
  derived-stat aggregation).

### Set library

The library (`src/Items/set.library.ts`) ships 7 sets. **Phase 158 —
status-centering:** per the load-bearing doctrine (status effects are the
MAIN fun; flat-stat-stacking gear is a balance failure), every set's
defining payoff now anchors on a status-effect passive. Aggressive sets
grant `buff_status_chance_up` (your statuses land more often);
defensive sets grant `buff_resistance_body/_mind/_heart` (resist enemy
statuses). The pre-existing flat-stat + resource-token bonuses are
preserved as a secondary floor — the status passive is layered on, not
swapped in. (Embers of Rebirth is already status-rich and unchanged.)

| Set | Pieces | Members | Status identity (passive) | Floor bonuses |
| --- | --- | --- | --- | --- |
| **Wanderer's Road** | 2 | `sandals` + `leather-cap` | DEFENSE — `buff_resistance_heart` (2pc) | `combatStartTokens: { heart: 2 }` |
| **Iron Discipline** | 3 | `leather-cap` + `cloth-wrap` + `cloth-gloves` | OFFENSE — `buff_status_chance_up` (3pc) | 2pc `+3 physicalDefense`; 3pc `+1 body/any` gen |
| **Scholar's Circle** | 2 | `copper-ring` + `leather-cap` | OFFENSE — `buff_status_chance_up` (2pc) | `combatStartTokens: { mind: 2 }` + `buff_critical_rate_up` |
| **Veteran's Plate** | 4 | `plate-mail` + `full-helm` + `plate-gauntlets` + `iron-greaves` | DEFENSE — `buff_resistance_body` (4pc) | 2pc `+4 physicalDefense`; 3pc `+2 body` tokens; 4pc `buff_damage_reduction` |
| **Sage's Regalia** | 3 | `full-helm` + `scaled-coat` + `gold-ring` | DEFENSE — `buff_resistance_mind` (3pc) | 2pc `+3 mind/+3 mentalDefense`; 3pc `+3 mind` tokens + `buff_buff_duration_up` |
| **Embers of Rebirth** | 2 | `phoenix-mantle` + `titans-girdle` | (already status-rich) | `buff_regeneration` + `buff_phoenix_vigor` + `+3 heart` |
| **Skirmisher's Kit** | 3 | `iron-greaves` + `leather-coat` + `chain-gauntlets` | OFFENSE — `buff_status_chance_up` (3pc) | 2pc `+2 luck/+3 physicalSave`; 3pc `buff_evasion_up` |

Sets intentionally overlap on `leather-cap`. A player wearing
`sandals` + `leather-cap` + `copper-ring` activates BOTH the
Wanderer's Road 2-piece and the Scholar's Circle 2-piece bonuses
simultaneously.

### Public API

Engine helpers re-exported through the package barrel:

```ts
import {
    getActiveSetBonuses,           // (equipment) → SetBonus[]
    getActiveSetBonusesForCharacter,
    aggregateSetStartTokens,       // (equipment) → CombatResources
    applySetGenerationBonus,       // (resources, equipment, outcome) → CombatResources
    getActiveSetPassiveEffectIds,  // (equipment) → string[]
    getEquippedItemSets,           // (equipment) → Array<{ set, equipped }>
    itemSetLibrary,
    getItemSetById,
} from 'axiomancer-mechanics';

import type { SetBonus, ItemSet } from 'axiomancer-mechanics';
```

### Adding a new set

1. Append the `ItemSet` literal to `itemSetLibrary` in
   `src/Items/set.library.ts`.
2. Add a hermetic case to `src/Items/e2e/sets.engine.test.ts` if the
   bonus shape introduces a new pattern (e.g. a 4-piece set, or a
   `passiveEffects` ID not yet covered).
3. Update the **Set library** subsection above with the new entry.

More sets is iterate-tier content authoring, not a phase. Unique-item
membership (`UniqueItemTemplate.setMembership`) is reserved for a
future phase per Spec 05e Q1.

## Rarity Distribution & Progression

The equipment rarity system balances meaningful loot discovery against steady progression. Current distribution weights from `RARITY_WEIGHTS` in `src/Items/item.factory.ts`:

| Rarity | Weight | Percentage | Modifier Count | Description |
|--------|--------|------------|----------------|-------------|
| Common | 50 | 50% | 0 | Baseline progression items with template stats only |
| Uncommon | 35 | 35% | 1 | Single procedural modifier for specialization |
| Rare | 14 | 14% | 2 | Two distinct procedural modifiers for build-enabling combinations |
| Unique | 1 | 1% | 3 | Three fixed modifiers with authored identity and power |

### Progression Philosophy

**Early Game (Levels 1-15)**: Common items provide steady stat progression while uncommon/rare drops offer build experimentation. Rarity feels meaningful because base power levels are low.

**Mid Game (Levels 16-35)**: Rare items become more significant for build optimization. Set items (Phase 54) start competing with procedural rarity for equipment slots. Unique items are extremely special finds.

**Late Game (Levels 36-50)**: High-level modifier tiers make rare items substantially more powerful. Set bonus completion becomes a primary progression driver alongside rarity. Unique items represent pinnacle equipment choices.

### Set Item Integration

Since Phase 54, set items use the same rarity system but add set bonus considerations:
- Set items can roll at any rarity, with bonus completion providing additional power scaling
- Players balance individual item rarity vs. set completion for optimal builds  
- Set item rarity affects the procedural modifiers while set membership provides the themed bonuses

This creates a progression matrix where both rarity and set membership matter for equipment decisions.

## Out of scope / future work

- Modifier catalogue content (Spec 05d) — the in-factory mod catalogue
  shipped with Spec 05c is intentionally minimal.
- Unique-item set membership (`UniqueItemTemplate.setMembership`) —
  field is wired but not honored in initial Phase 54 implementation.
- Loot drops (Spec 07), shop pricing (Spec 08), equipment as quest rewards
  (Spec 08).
- A bespoke `prevent_ko` / "negates next lethal hit" effect.
