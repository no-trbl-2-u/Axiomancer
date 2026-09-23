# Character

## Overview

Characters are player-controlled entities with base stats, derived stats, resources, and progression. Created via `createCharacter()` in `Character/index.ts`.

## Base Stats

Three core stats. All derived stats and resources scale from these.

| Stat | Role |
|------|------|
| `body` | Physical strength. Governs HP, physical combat and cards, body-type advantage. |
| `mind` | Intelligence and reflexes. Governs mental combat and cards, mind-type advantage. |
| `heart` | Willpower and emotion. Governs HP (shared with body), emotional combat and cards, heart-type advantage. |

## Derived Stats (`DerivedStats` — shared with Enemies)

Each base stat produces three combat-derived values plus a global `luck`. Multipliers
are defined in `Game/game-mechanics.constants.ts`.

| Derived Stat | Formula | Purpose |
|--------------|---------|---------|
| `physicalAttack` | `body × ATTACK (1)` | Combat roll modifier for body-type attacks |
| `physicalDefense` | `body × DEFENSE (3)` | Defense against body-type attacks |
| `mentalAttack` | `mind × ATTACK (1)` | Combat roll modifier for mind-type attacks |
| `mentalDefense` | `mind × DEFENSE (3)` | Defense against mind-type attacks |
| `emotionalAttack` | `heart × ATTACK (1)` | Combat roll modifier for heart-type attacks |
| `emotionalDefense` | `heart × DEFENSE (3)` | Defense against heart-type attacks |
| `luck` | `average(body, heart, mind)` | Crits, random events |

## Non-Combat Stats (`NonCombatStats` — Character only)

Saving throws and ability tests live on `character.nonCombatStats`. Enemies do not have
these fields and fall back to their defense stats when a save is requested via
`getSaveStat()`.

| Non-Combat Stat | Formula | Purpose |
|-----------------|---------|---------|
| `physicalSave` | `body × SAVE (2)` | Saving throw vs body-type effects |
| `physicalTest` | `body × TEST (4)` | General body ability tests |
| `mentalSave` | `mind × SAVE (2)` | Saving throw vs mind-type effects |
| `mentalTest` | `mind × TEST (4)` | General mind ability tests |
| `emotionalSave` | `heart × SAVE (2)` | Saving throw vs heart-type effects |
| `emotionalTest` | `heart × TEST (4)` | General heart ability tests |

## Resources

```
maxHealth = PLAYER_VITAE_BASE (50) + (body + heart + mind) × HEALTH_PER_STAT (8)
```

Health starts at max on character creation. Cards run on the resonance
economy (`heart`/`body`/`mind`) described in `docs/cards.md`, tracked on
`CombatEncounterState.resonance` rather than the character itself.

## Cards

Characters track learned/unlocked cards as ID arrays:

```ts
knownCards: string[]      // every card ever learned/unlocked
```

Canonical design has no separate card equipment/loadout gate. Once a card is
learned, it is part of the character's combat-accessible catalogue; combat
selection filters `knownCards` by current affordability. The legacy
`equippedSkills` field was fully removed in Phase 159 (ADR-0002): there is no
equipped-card field on `Character`, no preset field, and no CLI loadout
wiring. Legacy v7 saves still fold their old `equippedSkills` rotation into
`knownCards` via the v7→v8 save migration.

## Experience

```
experience            = (level - 1) × EXPERIENCE_PER_LEVEL (1000)
experienceToNextLevel = level × EXPERIENCE_PER_LEVEL       (1000)
```

## Stat allocation

`character.availableStatPoints: number` holds unspent points awaiting
allocation. `applyLevelUps` (in `Game/game.reducer.ts`) grants
`STAT_POINTS_PER_LEVEL = 3` on every level-up. The player spends them one
at a time via:

```ts
allocateStatPoint(character, stat)   // 'body' | 'mind' | 'heart'
previewStatAllocation(baseStats, level, allocation)  // mobile preview helper
```

`allocateStatPoint` raises the chosen base stat by 1, decrements
`availableStatPoints`, and re-derives `derivedStats`, `nonCombatStats`, and
`maxHealth` so the change is immediately visible. The Game reducer exposes
this as the `ALLOCATE_STAT_POINT` action; the Character tab in
`npm run game` walks the player through allocation while points are
available.

`previewStatAllocation` computes exact derived stats for mobile's
level-up allocation preview without mutating character data. Takes current
base stats, character level, and allocation delta; returns computed stats
using the same derivation formulas as `allocateStatPoint`. Pure function
for mobile's "what-if" preview. Added by Phase 97. `allocateStatPoint`
shipped by Phase 29 (`9f2e3f6` + `121aea8` + `db7c26f`); closes
`specs/06-character-progression.md` Q3 + Q8.

## Active Effects

`effects: ActiveEffect[]` — effects currently applied to this character. Managed by the effect engine (`Effects/index.ts`). Never mutate directly; use `applyEffect`.

## Resist Stat Lookup

When resisting an effect, the target's **base stat** for the resisting stance is used
via `getEffectiveStats(target).baseStats[stance]` in `Combat/effect-modifiers.ts`:

| `resistedBy` | Stat used |
|-------------|-----------|
| `body` | `baseStats.body` |
| `mind` | `baseStats.mind` |
| `heart` | `baseStats.heart` |

## API

| Function | Description |
|----------|-------------|
| `createCharacter(options)` | Factory — creates a fully derived Character from name, level, and base stats |
| `getEffectiveStats(target).baseStats[resistedBy]` | Base stat value for the resisting stance (lives in `Combat/effect-modifiers.ts`) |
| `characterPresets` / `getPresetById` / `buildCharacterFromPreset` | Curated progression-tier roster (apprentice / wanderer / sage). The builder lifts a declarative `CharacterPreset` into a `Character` via the canonical `createCharacter` + `dropItem` paths. Presets express card progression as unlocked `knownCards`; the legacy `equippedSkills` preset field was removed in Phase 159. `npm run game` prompts the player to pick one at boot. |
| `levelLadderPresets` / `ladderL1Preset` / `ladderL15Preset` / `ladderL30Preset` / `ladderL50Preset` | Level-explicit evidence ladder (L1 / L15 / L30 / L50), kept **separate** from `characterPresets`. Used for tuning/evidence runs that need a clean per-level baseline. `getPresetById` resolves ladder ids (`kid-l1` … `kid-l50`) as well as the curated roster. |
| `computeEquipDelta(candidate, worn, player?)` | Equip-change delta model (Phase 154). Simulates equipping/unequipping `candidate` against the worn sibling in the same slot through the `equipItem` / `unequipItem` reducers and diffs the resulting `Character` stats, returning an `EquipDelta` (`mode`: `equip` / `unequip` / `swap`; `stats`; `gained` / `lost` sides; `isEmpty`). Lets a client show **only what changes** without rendering the full sheet. Pure — no string formatting beyond engine effect/affix labels. |

## Character presets

`src/Character/presets.ts` ships three curated progression tiers:

| Preset       | Level | Base Stats | Equipment                            | Cards                |
|--------------|-------|------------|--------------------------------------|-----------------------|
| `apprentice` | 1     | 5 / 5 / 5  | —                                    | 7 Tier-1 known        |
| `wanderer`   | 8     | 5 / 4 / 4  | iron-blade, hide-vest, leather-cap   | 7 T1 + 3 T2 + 1 synergy known |
| `sage`       | 15    | 20 / 30 / 25 | steel-blade, chain-mail, chain-coif | all 14 cards known   |

All preset equipment is rolled at `'common'` rarity so the build is
deterministic (Common returns an empty rolled-modifier list). Add more
presets by exporting further `CharacterPreset` records and registering
them in `characterPresets`.

## Recent Updates

Phase 99 / Phase 159 complete: the legacy card loadout GATE is gone and the
`equippedSkills` field was removed entirely — all learned/unlocked cards are
available in combat, and the combat UI shows only currently affordable cards.
Legacy v7 saves fold their old rotation into `knownCards` at load. The `id`
field shipped at
Phase 35 (Knowledge-Gaps Q12); see the `id` JSDoc on `Character` in
`src/Character/types.ts` and the auto-gen path in `createCharacter`.
