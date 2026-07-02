# Phase 18 — Preset character roster

> Brief for `/ship-a-phase`. All decisions pre-resolved.
> DO NOT ASK the user during implementation — decide and ship.

## Outcome

The Character module ships a curated set of `CharacterPreset`s spanning
the level-1 / mid-game / late-game progression bands. `npm run game`
prompts the player to pick a preset at boot rather than always seeding
the hardcoded `Player` mock with every skill in the library. The preset
recipe (level, stats, equipment templates, skills known/equipped,
consumables, currency) is deterministic — building the same preset twice
produces an equal `Character`. Three presets ship today; the public
surface (`buildCharacterFromPreset`, `characterPresets`,
`getPresetById`) is the extension point for adding more.

## Source spec

No dedicated `specs/18-*.md` file — this is a CLI/demo-ergonomics phase
tracked in `plan/steps/01_build_plan.md`:

> Phase 18 — Preset character roster (curated progression tiers selectable at boot)

Resolved questions:

1. **How many presets?**
   Three: Apprentice (level 1, 3/2/2), Wanderer (level 8, 5/4/4),
   Sage (level 15, 7/6/6). Cover the three equipment tiers (lvl-1 /
   lvl-10 / lvl-20-but-required-15-here) and the three skill tiers
   (Tier 1 / Tier 2 / Tier 3). Three is enough to make the picker
   meaningful and short enough to maintain.
2. **Preset shape — record vs. function?**
   Plain record (`CharacterPreset`). A factory function
   `buildCharacterFromPreset(preset, rng?)` lifts the record into a
   real `Character`. Keeping the preset declarative makes it
   testable, serialisable, and easy to extend.
3. **Equipment in presets — pre-rolled instances or template IDs?**
   Template IDs + a rarity. `buildCharacterFromPreset` calls
   `dropItem(templateId, level, 'common', rng)` so the equipment is
   constructed through the canonical factory. Common rarity returns
   an empty rolled-modifier list (deterministic). Rarity is fixed to
   `'common'` for every preset slot to keep the recipe reproducible.
4. **Deterministic build?**
   Yes. `buildCharacterFromPreset(preset, rng = Math.random)` accepts
   an RNG so tests can pin it; the default lets demo CLI invocations
   stay unseeded. Common rarity makes the RNG argument moot for the
   shipped presets, but the parameter stays for forward-compat when
   future presets carry Uncommon+ equipment.
5. **Where does the preset list live?**
   `src/Character/presets.ts`. Co-located with the rest of the
   Character module; re-exported via `src/Character/index.ts` and the
   public barrel.
6. **CLI bootstrap behavior?**
   `src/CLI/game.cli.ts` `bootstrapStore` becomes async (it already
   awaits inquirer elsewhere). It prompts the user to pick a preset
   from the list, builds the character via `buildCharacterFromPreset`,
   and uses that as the store seed instead of the
   `Player`-plus-every-skill hardcoded shape. The skill / consumable
   seeding logic moves into the preset records themselves.
7. **What about `src/Character/characters.mock.ts`?**
   Keep it — it's used by tests and existing code (grep:
   `src/CLI/game.cli.ts` was the only direct consumer; after Phase 18
   the CLI uses presets, but tests still seed the mock for known
   `Character` shapes). No deletion.
8. **Test coverage?**
   `src/Character/e2e/presets.engine.test.ts` — verifies (a) every
   preset builds without throwing, (b) shipped fields match the
   declarative recipe (level / baseStats / known + equipped skills /
   equipped slot ids / consumable ids in inventory), (c) two builds of
   the same preset with the same seeded RNG produce equal Characters.

## Implementation units (commit per unit)

### Unit 1 — Author the preset types + library + builder

File: `src/Character/presets.ts` (new)

```ts
import { Character, BaseStats } from './types';
import { createCharacter } from './index';
import { dropItem } from '../Items/item.factory';
import { consumableLibrary } from '../Items/consumable.library';
import type { EquipmentSlot, Item, Consumable } from '../Items/types';

export interface CharacterPresetEquipmentEntry {
    /** EquipmentTemplate id (e.g. 'iron-blade'). */
    templateId: string;
    slot: EquipmentSlot;
}

export interface CharacterPreset {
    id: string;
    name: string;
    /** Short blurb shown in the picker. */
    summary: string;
    level: number;
    baseStats: BaseStats;
    /** Equipment to drop and equip. Each slot is filled at 'common' rarity. */
    equipment: CharacterPresetEquipmentEntry[];
    /** Skill IDs the character knows. */
    knownSkills: string[];
    /** Skill IDs in active rotation (must be subset of knownSkills, ≤4). */
    equippedSkills: string[];
    /** Consumable IDs (and counts) to seed the inventory. */
    consumables: { id: string; quantity: number }[];
    currency: number;
}

export const apprenticePreset: CharacterPreset = { ... };
export const wandererPreset:   CharacterPreset = { ... };
export const sagePreset:       CharacterPreset = { ... };

export const characterPresets: CharacterPreset[] = [
    apprenticePreset, wandererPreset, sagePreset,
];

export function getPresetById(id: string): CharacterPreset | undefined {
    return characterPresets.find(p => p.id === id);
}

export function buildCharacterFromPreset(
    preset: CharacterPreset,
    rng: () => number = Math.random,
): Character { ... }
```

`buildCharacterFromPreset` workflow:
1. Look up each consumable by id from `consumableLibrary`, clone with
   the preset's `quantity` so the canonical library is never mutated.
2. Build the equipment instances via
   `dropItem(entry.templateId, preset.level, 'common', rng)` for each
   `equipment` entry, then assemble into the
   `Partial<Record<EquipmentSlot, Equipment>>` `createCharacter` takes.
3. Call `createCharacter({ name, level, baseStats, currency,
   inventory: consumables, equipment, knownSkills, equippedSkills })`.
4. Return.

Preset specifics:
- **Apprentice** (`apprentice`): level 1, 3/2/2, no equipment,
  6 tier-1 skills known, 4 equipped, 3 minor potions, 0 currency.
- **Wanderer** (`wanderer`): level 8, 5/4/4, `iron-blade` + `hide-vest`
  + `leather-cap`, 9 skills known (6 tier-1 + 3 tier-2), 4 equipped
  (mixed tier 1/2), 5 healing potions + 2 antidotes, 25 currency.
- **Sage** (`sage`): level 15, 7/6/6, `steel-blade` + `chain-mail` +
  `chain-coif`, all 12 skills known, 4 equipped (one tier-3,
  one tier-2, two tier-1 anchors), 6 healing potions + 2 clarity-serums
  + 2 focus-vials, 75 currency.

Verify the chosen template IDs and consumable IDs against
`src/Items/equipment.templates.ts` and `src/Items/consumable.library.ts`
before locking literals.

Commit: `feat(character): preset roster — apprentice/wanderer/sage with build helper`

### Unit 2 — Re-export the new public API

File: `src/Character/index.ts` + `src/index.ts`

Add re-exports:
```ts
// src/Character/index.ts
export {
    characterPresets, apprenticePreset, wandererPreset, sagePreset,
    getPresetById, buildCharacterFromPreset,
} from './presets';
export type { CharacterPreset, CharacterPresetEquipmentEntry } from './presets';
```

```ts
// src/index.ts (Character section)
export {
    characterPresets, getPresetById, buildCharacterFromPreset,
} from './Character';
export type { CharacterPreset, CharacterPresetEquipmentEntry } from './Character';
```

Commit: `feat(character): re-export preset roster through public barrel`

### Unit 3 — Hermetic engine test

File: `src/Character/e2e/presets.engine.test.ts` (new)

Three describes:
- `every preset builds without throwing` — iterate `characterPresets`,
  call `buildCharacterFromPreset(preset, mockFixedRng(0))`, assert
  truthy and level/stat fields match the recipe.
- `equipped slots populate from the templates` — assert each preset's
  built character has the declared slots filled and that the equipment
  ids match the template ids.
- `deterministic` — build the same preset twice with the same
  `mockSequentialRng([0.1, 0.2, 0.3])` and `expect(a).toEqual(b)`.

Use `src/test-utils/rng.ts` helpers. No `vi.spyOn(Math, 'random')`.

Commit: `test(character): hermetic e2e for preset roster`

### Unit 4 — Wire the CLI bootstrap to the preset picker

File: `src/CLI/game.cli.ts`

Replace the hardcoded `bootstrapStore` body with an async flow that
prompts the user to pick a preset, then calls
`buildCharacterFromPreset(...)`. The skill / consumable seeding logic
moves out of `bootstrapStore` and into the preset records, so the
function shrinks:

```ts
async function bootstrapStore(): Promise<ReturnType<typeof createGameStore>> {
    const events = createEventEmitter();
    events.onAny(ev => console.log(`  [event] ${ev.type}`));

    const { presetId } = await inquirer.prompt<{ presetId: string }>([{
        type: 'rawlist', name: 'presetId',
        message: 'Pick a character preset:',
        choices: characterPresets.map(p => ({
            name: `${p.name} (lvl ${p.level}) — ${p.summary}`,
            value: p.id,
        })),
    }]);

    const preset = getPresetById(presetId);
    if (!preset) throw new Error(`Unknown preset: ${presetId}`);

    const player = buildCharacterFromPreset(preset);
    return createGameStore(nullAdapter, { player }, events);
}
```

Drop the imports for `Player`, `skillLibrary`, `consumableLibrary`,
`getSkillById` if they're now unused (grep first; `skillLookup` calls
`getSkillById` and stays).

Update the call site in `main()` to `await bootstrapStore()`.

Run `npm run type-check` + a manual `npm run game` invocation is NOT
in scope (UI / TTY); type-check + tests are the gate.

Commit: `feat(cli): prompt for a character preset at boot`

### Unit 5 — Docs + DoD

- Append a "Character presets" section to `docs/character.md` if the
  doc exists; otherwise add a paragraph to `README.md` near the
  `npm run game` row.
- Flip Phase 18 in `plan/steps/01_build_plan.md` to `[x]` with the
  final commit hash.

Commit: `plan: phase 18 shipped — preset character roster + CLI picker`

## Decisions made upfront — DO NOT ASK

- Three presets only. Adding more is a follow-up.
- Common-rarity equipment in every preset. Deterministic; modifier
  rolling stays out of preset scope.
- Preset records are declarative; the builder calls `createCharacter`
  through the canonical path so equipment-stat folding and skill seed
  go through the same code combat uses.
- `characters.mock.ts` stays as a test fixture.
- No new fields on `Character` — presets ride on the existing
  `CreateCharacterOptions`.
- Preset IDs are kebab-case (`apprentice`, `wanderer`, `sage`).

## Verify gate

```bash
npm run type-check
npm test
npm run verify
npm run deploy:check
```

## Commit body template (summary if units coalesce)

```
feat(character): phase 18 — preset roster + CLI boot picker

- Add src/Character/presets.ts: CharacterPreset type, three presets
  (apprentice / wanderer / sage), getPresetById, buildCharacterFromPreset
- Re-export through Character/index.ts and the public barrel
- Hermetic e2e tests cover build + determinism
- src/CLI/game.cli.ts bootstrap now prompts the player to pick a preset

Decisions:
- Three tiers cover lvl-1 / lvl-10 / lvl-15+ equipment bands and the
  Tier-1 / Tier-2 / Tier-3 skill rotations without bloating the picker.
- Common rarity keeps preset builds deterministic; future presets can
  layer Uncommon+ once the RNG seed plumbing is plumbed.

Closes #<phase-issue if captured>
```

## Definition of Done

- [ ] `src/Character/presets.ts` exists with `CharacterPreset` type,
      three preset records, `characterPresets`, `getPresetById`, and
      `buildCharacterFromPreset`
- [ ] Public barrel (`src/index.ts`) re-exports the new API
- [ ] `src/Character/e2e/presets.engine.test.ts` exists with ≥3 cases;
      all pass
- [ ] `src/CLI/game.cli.ts` prompts for a preset at boot
- [ ] `npm run verify` exits 0
- [ ] `npm run deploy:check` exits 0
- [ ] `plan/steps/01_build_plan.md` Phase 18 row flipped to `[x]` with hash

## Follow-ups (out of scope)

- More presets (e.g. specialists by stance: Heartbound, Bodyforged,
  Mindbound) — track as a Z-LOW candidate.
- Equipment rarity above Common in presets — needs RNG seed plumbing
  through the CLI bootstrap; track if requested.
- Persist last-picked preset in a config file — out of scope; CLI
  state is ephemeral by design.
