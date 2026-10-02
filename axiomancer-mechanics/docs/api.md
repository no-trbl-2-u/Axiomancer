# Public API Reference

## Stability Levels

- **Stable**: Committed to semver for breaking changes.
- **Beta**: May change in minor versions with deprecation notice.
- **Experimental**: May change without notice.

The library is `0.x.y` (pre-1.0); breaking changes can land in minor
bumps. Items marked Stable below carry the strongest intent to remain
unchanged, but the absolute semver guarantee starts at 1.0.

## Core Exports (from `'axiomancer-mechanics'`)

> **Barrel pruned 2026-09-25 (TRIM THE FAT).** `src/index.ts` now carries only
> the names a consumer outside the engine imports (axiomancer-mobile, root
> scripts; the card editor was deleted in R1). Names listed below that are no
> longer on the barrel are still exported from their defining module under `src/`;
> import them from there. Symbols that had no consumer at all were deleted and
> are struck from this page.

### Character

- `createCharacter()` — Stable.
- `Character`, `BaseStats`, `EquipmentLoadout`,
  `CreateCharacterOptions` types — Stable.
- Equipment functions (`equipItem`, `unequipItem`,
  `getEquippedItems`) — Stable.
- **Character presets (Phase 18):** `characterPresets`,
  `getPresetById`, `buildCharacterFromPreset` — Stable.
  `CharacterPreset`, `CharacterPresetEquipmentEntry` types — Stable.
- **Stat allocation (Phase 29):** `allocateStatPoint(character, stat)`,
  `previewStatAllocation(baseStats, level, allocation)` — Stable. 
  `allocateStatPoint` spends one `availableStatPoints` to raise the chosen base
  stat by 1 and re-derive `maxHealth`. `previewStatAllocation` computes
  the resulting max VITAE for mobile's level-up allocation preview
  without mutating character data.
  Pairs with `STAT_POINTS_PER_LEVEL = 3` (granted on level-up via the
  game reducer) and the `ALLOCATE_STAT_POINT` action.
  `Character.availableStatPoints: number` is on the public type. Closes
  Spec 06 Q3 + Q8.
- **Stable identity (Phase 35):** `Character.id: string` is now a
  required field on the public type. `createCharacter()` auto-generates
  a `char-<base36>` id from `getRng()` when the caller doesn't supply
  one (RN-bundler-safe — no Node `crypto` import). Pass
  `CreateCharacterOptions.id` explicitly to pin a deterministic id for
  fixtures or `ActiveEffect.sourceId` attribution. Closes
  Knowledge-Gaps Q12.

### Combat

- Hazard-Pattern Combat engine (`initializeCombatEncounter`,
  `playCombatCard`, `resolveThreatPhase`, `processBetweenPhases`,
  `simulateHazardPatternCombat`, etc.) — Stable. The ONLY combat engine;
  the legacy turn-based `resolveCombatRound` (and its `RoundEvent` /
  `RoundResolution` surface) was removed.
- Healing (`healCharacter`) — Stable.
- Combat types (`CombatState`, `Action`, `Stance`,
  `CombatEncounterState`, `CombatEvent`, etc.) — Stable.
- **Phase 80 always-land contract:** `resolveEffectApplication` rewritten —
  Tier 2 debuffs + Tier 3 always land (no target-resist roll); only Tier 2
  buff caster fumble/crit survives. `EffectApplicationResult.rebounded`
  removed. See [`effects.md`](./effects.md).
- **Effect aggregators (iterate `7ee0745`):** `getActiveEffectModifiers`,
  `canAct` — Stable. Previously reachable only via `src/Combat/index.ts`,
  now re-exported through the top-level barrel. Type
  `AggregatedEffectModifiers` rides alongside.

### Game Store and State

- `createGameStore()` — Stable.
- `gameReducer()` — Stable.
- `GameState`, `GameAction`, `GameActions` types — Stable.
- Event emitter (`createEventEmitter`) — Stable.
- Selectors (`selectPlayer`, `selectIsInCombat`,
  `selectVersion`, etc.) — Stable.
- `PersistenceAdapter` interface — Stable. (The concrete
  `createNodeAdapter` lives on the `./node` subpath only — see Node.js
  Exports below.)
- `nullAdapter` — Stable.

**Codex slice (Phase 73 — closes GH#65 ask 3).** New state slice +
per-foe content surface + auto-firing wire for the post-parley
"NEW ENTRY" card on the mobile aftermath panel.

- `GameState.codex: CodexState` — required state slice
  (`CodexState = { unlockedEntries: string[] }`). Append-only;
  de-duped. Defaults to `{ unlockedEntries: [] }` on new games.
- `Enemy.journalEntry?: CodexEntry` — optional per-foe metadata
  (`CodexEntry = { id: string; title: string; body: string }`).
- `store.endCombat()` auto-fires the unlock on
  `outcome === 'friendship'` when the befriended enemy carries a
  `journalEntry`: the id is appended to
  `state.codex.unlockedEntries` (de-duped) and surfaced as
  `report.friendshipReward.codexEntryUnlocked: { id, title }`
  (body recovered via content-registry lookup at consumer render
  time).
- `store.unlockCodexEntry(entryId)` — dispatchable surface so
  future dialogue / map-event content can grant codex entries
  outside combat.
- `GAME_STATE_VERSION` bumped 6 → 7; `migrateV6toV7` defaults
  `codex = { unlockedEntries: [] }` on legacy v6 saves.

Initial author coverage: MournfulGull (`codex-mournful-gull` —
"The Catalogue of Slights"), HollowEyedBeggar
(`codex-hollow-eyed-beggar` — "They Carry What You Set Down"),
CoastalTyrant (`codex-coastal-tyrant` — "The Magistrate Who Set
Down the Circlet"). Bodies extend the chronicle voices from
Phase 71. The remaining 13 enemies leave `journalEntry`
undefined and don't unlock anything on friendship; future content
sweeps author entries on additional enemies.

**Run-loop semantics (Phase 72 — closes GH#65 ask 2).** New store
method + supporting exports:

- `store.resetRun({ keepCharacter: boolean }): GameState` — rewinds the
  playthrough back to the starting hearth. `keepCharacter: true`
  preserves the character (player + rngState) and refills HP to
  maxHealth; world / combat / quests / flags reset.
  `keepCharacter: false` performs a full new-game reset carrying only
  `rngState`. Every call assigns a fresh `runId`. Dispatches
  `RESET_RUN`; persists via the standard `DURABLE_ACTIONS` pipeline.
- `GameState.runId: string` — required field (16-char hex; matches
  `/^[0-9a-f]{16}$/`). Generated at `createNewGameState()` time AND
  bumped on every `resetRun()` call.
- `generateRunId(rng: () => number): string` — 16-char hex id helper;
  Phase 35 character-id generation pattern. Supply your own rng for
  deterministic tests, or pass `() => getRng().random()` for the
  global seeded source.
- `STARTING_REGION: MapName` — canonical starting region (`STARTING_MAP`,
  the Breakwater since map revamp M3a; it was fishing-village until then) for `resetRun`; the hearth concept reuses
  `MapDefinition.startingNode` (no new "hearth" type primitive).
- `GAME_STATE_VERSION` bumped 5 → 6; `migrateV5toV6` defaults `runId`
  on legacy v5 saves.

See `docs/gameloop.md` § "Run-loop reset (Phase 72)" for the
preserve / reset matrix and lifecycle.

**CLI consumer surfaces (Phase 82).** `game.cli.ts` extended with
Codex tab (renders `state.codex.unlockedEntries` via enemy library
lookup) and Begin Again tab (`store.resetRun({ keepCharacter })`).
Its agent-graded walkthrough (`codex-unlock`) was deleted in R3c with its
subject, the retired Mournful Gull.

**Per-module quickstart pages (Phase 87).** Four focused guides with
runnable code samples: [`quickstart-character.md`](./quickstart-character.md),
[`quickstart-combat.md`](./quickstart-combat.md),
and the archived `quickstart-items.md` / `quickstart-world.md`
(`plan/archive/2026-09-25-trim-t1/axiomancer-mechanics/docs/`, 2026-09-25).

### Events (Beta)

The engine emits a single uniform envelope on every `GameEvent`:

```ts
interface EnginePayload {
    action: GameAction;                  // what triggered the event
    state: GameState;                    // the post-reducer state
    report?: CombatEndReport;            // only on combat:ended
    unlockedCards?: string[];            // only on character:levelup (Phase 30)
}
```

`unlockedCards` (Phase 30 unit 2) lists card ids newly eligible to
learn after a level promotion crossed a tier-eligibility threshold. An
empty array means the levelup didn't unlock anything new; the field is
absent on every other topic.

(The legacy `combatEvents?: readonly RoundEvent[]` field was removed
with the legacy turn-based resolver; Hazard-Pattern Combat consumers
read the typed `CombatEvent[]` stream directly from the engine's
`CombatTransition` returns instead.)

`CombatEndReport.outcome` is `'victory' | 'defeat' | 'friendship' |
'flee'`. Phase 36 added `'friendship'` for the friendship-counter exit
— half XP grant + full loot.

**Befriendable-enemy content (Phase 60 + Phase 62) — Beta.**
Phase 60 added `CombatEndReport.friendshipReward?: { narrative?: string }`
— present only on `outcome === 'friendship'` when the befriended enemy
carries an authored `Enemy.friendshipReward?: FriendshipReward`.
Per-enemy `items` and `xpBonus` are already applied to `report.loot` /
`report.xpGained` by the time this surfaces; `narrative` is the field
consumers render for the after-action UI.

Phase 62 extended `FriendshipReward` with `flagSet?: string` — when
present, the END_COMBAT reducer appends the flag to `state.flags`
on friendship outcome (de-duped). Reuses the existing
`DialogueChoice.requires.flag` / `visibleChoices` machinery; no new
gate primitive. Convention: `befriended-<enemy-id-stem>`. First
authored use: `MournfulGull.friendshipReward.flagSet:
'befriended-mournful-gull'` unlocks a flag-gated branch on the
Coastal Beggar's `greet` node.

See `docs/combat.md` § "Friendship Path" + § "Befriendable-enemy
content (Phase 60)" and `docs/enemy.md` § "Befriendable enemies
(Phase 60)".

**Per-enemy befriend gate — Beta.** Optional
`Enemy.befriendabilityConfig?: BefriendabilityConfig` carries one field,
`hpGate?: { belowPct: number }`: The Open Hand's befriend is shut until the
foe's VITAE fraction is at or below `belowPct` (`befriendHpGateOpen`,
`Enemy/befriend.ts`; a snapshot, so healing back above it shuts the gate
again). The friendship counter, `roundsThreshold` and `defaultFallback` went
in revamp phase R7c2.

**Aftermath narrative prose (Phase 71 — GH#65 ask 1).** Three
optional per-foe line sets carry chronicle-voice prose for the
post-combat aftermath panel. Pure data; engine performs no variant
selection or interpolation — consumer (mobile presenter, CLI, etc.)
picks which variant to render based on outcome shape.

- `FinalBlowLines { brutal: string; quiet: string; ironic: string }`
  — victory final-blow chronicle, picked by damage-tier shape.
- `PactLines { quiet: string; setDown: string; heavy: string }` —
  friendship-pact chronicle, picked by parley posture. Only
  meaningful when the enemy also carries a `friendshipReward`.
  Naming note: GH#65 source text used `set-down`; field is
  `setDown` (TS-identifier convention).
- `CauseLines { brutal: string; broken: string; quiet: string }` —
  defeat / cause-of-loss chronicle, picked by KO shape.

`Enemy.finalBlowLines?` / `Enemy.pactLines?` / `Enemy.causeLines?`
are all additive-optional; undefined falls through to consumer
defaults. Initial author coverage at Phase 71: MournfulGull,
HollowEyedBeggar, CoastalTyrant. See `docs/enemy.md` § "Aftermath
narrative (Phase 71)" for variant semantics + voice guidance.

**Reactive NPCs — alignment observers (Phase 63).** Removed
2026-09-27 (T6, D39). `DialogueTree.id?: string` survives as an
optional stable tree identifier.

`TypedGameEvent<T>` narrows the event by topic; `payload` is always
the engine envelope above. Per-topic aliases ship for all 9
`GameEventType` values:

- `TypedCombatStartedEvent`, `TypedCombatEndedEvent`
- `TypedWorldMovedEvent`, `TypedWorldProcessedEvent`
- `TypedLevelUpEvent`, `TypedInventoryChangedEvent`
- `TypedDialogueAppliedEvent`, `TypedGameSavedEvent`,
  `TypedGameLoadedEvent`

And 6 type guards for filter / find style narrowing (the unused
`isWorldProcessedEvent` / `isGameSavedEvent` / `isGameLoadedEvent` were
deleted 2026-09-25):

- `isCombatStartedEvent`, `isCombatEndedEvent`
- `isWorldMovedEvent`
- `isLevelUpEvent`, `isInventoryChangedEvent`
- `isDialogueAppliedEvent`

Phase 21 removed the seven pre-existing `Typed*Payload` interfaces
(`CombatStartedPayload`, etc.) and `create*Event` factories — the
engine never produced the per-topic payloads, and consumer-side
fabrication had no use case. If you need rich per-topic payloads on
a future spec, the path is to rewrite the engine's emit sites; see
`plan/archive/2026-09-25-trim-t5/axiomancer-mechanics/specs/23-map-events.md` (archived) for the precedent that aligned types with
reality.

### Items, Equipment & Inventory

> **Superseded (phases 18-21 + 23):** the procedural template / generation /
> rarity entries below were retired. `equipmentTemplates`,
> `getEquipmentTemplate`, `getTemplatesBySlot`, `uniqueTemplates`,
> `getUniqueTemplate`, `dropItem`, `rollModifiers`, `resolveModifiers`,
> `rarityWeightTable`, `previewTemplateAtRarity`, and the set-bonus/item-set
> APIs no longer exist. The live equipment surface is the 11 signet relics
> (`relicLibrary`, `getRelicById`, `getSignaturesForLoadout`) plus the equip
> reducers and `wornPerSlot`. A fresh run seeds none of them (2026-09-23):
> the ring arrives at the first node and the rest are village-market wares. See [`equipment.md`](./equipment.md).

- Item creation and manipulation functions — Stable.
- Equipment templates and generation (`equipmentTemplates`,
  `getEquipmentTemplate`, `getTemplatesBySlot`, `uniqueTemplates`,
  `getUniqueTemplate`) — Stable.
- `dropItem`, `rollModifiers`, `resolveModifiers`,
  `rarityWeightTable` — Stable.
- `previewTemplateAtRarity(templateId, rarity, playerLevel, rng?)` —
  Beta (Phase 75). Wraps `dropItem` with rng + rarity pinned; soft-
  errors to `undefined` for UI-tier consumption (unknown templateId,
  level-too-low, unique-rarity on regular template). Default rng =
  `() => 0.5` for deterministic per-tuple previews. See
  the archived `docs/items.md` § "Previewing rolled mods (library / catalog
  views — Phase 75)".
- `previewTemplateAtAllRarities(templateId, playerLevel, rng?)` —
  Beta (Phase 76). Batch wrapper around `previewTemplateAtRarity`
  returning `Record<ItemRarity, Equipment | undefined>` for UI
  tooltip / item-detail views rendering the full rarity strip in
  one call. Same soft-error + deterministic-rng convention as the
  single-cell helper.
- Inventory management (`addItem`, `removeItem`, `useConsumable`,
  `stackItem`) — Stable.
- Item types (`Item`, `Equipment`, `Consumable`, `Material`,
  `QuestItem`, `ItemCategory`, `EquipmentSlot`, `ItemRarity`,
  `RolledModifier`, etc.) — Stable.
- `consumableLibrary`, `getConsumableById` — Stable.
- **Shop economy (Phase 37 + iterate `3ba5319`):**
  `buyItem(character, item, price)`,
  `sellItem(character, itemId, price)`,
  `defaultSellPrice(ware: ShopWare): number` (engine-tier helper —
  halves and floors the ware's buy price; always strictly less than
  the buy price for any positive integer, so buy → sell round-trips
  are net-negative for the player). All three Stable. Pure
  `Character → Character` reducers; bad input (negative price,
  insufficient funds, missing item) returns the input unchanged.
  `ShopWare` and `ShopInventory` types ride on `VillagePayload.shop?`
  and the resolved village event's `shop?` field. See the archived `docs/items.md`
  "Shop economy" for the schema and the authored shop tables.

- **Set Items (Phase 54 / Spec 05e):** Beta. Equipping multiple
  members of a named `ItemSet` grants threshold-keyed `SetBonus`
  payloads on top of per-item `statModifiers` /
  `resourceInteraction` / `passiveEffects`. Set bonuses are computed
  on-demand at combat start —
  no cached per-character state. Engine helpers + library:
  - `getActiveSetBonuses(equipment): SetBonus[]` — primary lookup
    against an equipped-slots snapshot.
  - `getActiveSetBonusesForCharacter(character)` — convenience
    wrapper.
  - `aggregateSetStartTokens(equipment)` /
    `applySetGenerationBonus(resources, equipment, outcome)` /
    `getActiveSetPassiveEffectIds(equipment)` — siblings of the
    per-item aggregators, additive on top.
  - `getEquippedItemSets(equipment)` — `Array<{ set, equipped }>`
    including partial counts (1/3 of Iron Discipline), for UI
    summaries.
  - `itemSetLibrary` + `getItemSetById(id)` — frozen 3-entry roster
    (Wanderer's Road, Iron Discipline, Scholar's Circle); members
    overlap on `leather-cap`.
  - Types: `SetBonus`, `ItemSet`.
  See [`docs/equipment.md`](./equipment.md) "Set Items (Spec 05e /
  Phase 54)" for runtime application notes + the "Adding a new set"
  steps.

### Cards

> **Superseded (2026-09-23):** `canUseSkill`, `SkillTier` and the "21-card library" below are retired; the live library is `cardLibrary` (129 cards assembled from `src/Cards/library/*.cards.ts`) and learning is ungated — live truth: src/Cards/cards.library.ts, src/Cards/card.engine.ts, src/index.ts. Body kept as a historical record pending rewrite (plan/AUDIT.md).

- Card execution (`executeCard`, `canUseSkill`) — Stable.
- Card types (`Card`, `SkillsStatType`,
  `SkillTier`, `SkillTarget`, `ResourceCost`,
  `SkillResolution`, etc.) — Stable. Phase 37 (2026-07-20) retired
  `Card.category`/`CardCategory` and the `combatResources` pool
  (`CombatResources`) — nothing read it; the live stance economy is
  `resonance` on `CombatEncounterState`.
- **Top-level card library (Phase 50):** `cardLibrary: Card[]` +
  `getCardById(id: string): Card | undefined` re-exported on the
  top-level barrel (Phase 50 unit 1 — `19f2015`, engine-handoff fix
  for `axiomancer-mobile`). Consumers no longer need to import from a
  deep path; the canonical 21-card library (6 Tier 1 + 8 Tier 2 +
  7 Tier 3 as of Phase 66 + Phase 44) is reachable directly from
  `import { cardLibrary, getCardById } from 'axiomancer-mechanics'`.
- **Runtime learning (Phase 30):** `learnCard(character, skillId)`,
  `getAvailableCards(character)`, `meetsLearningRequirement(character,
  card)` — Stable. The `LEARN_CARD` action wires this through the
  game reducer; the Character tab in `npm run game` exposes it. Closes
  Spec 06 Q7.
- **Phase 84 SkillEvent cleanup:** `effect-resisted` renamed to
  `buff-fumbled` (only fires on Tier 2 buff caster fumble); dead-code
  `effect-rebounded` variant removed. **BREAKING** for consumers
  pattern-matching on `SkillEvent.kind`.

### World & Quests

- World creation (`createStartingWorld`) — Stable.
- Map registry (`MAP_REGISTRY`, `getMapDefinition`, `createMapState`,
  `MapNotFoundError`) — Stable.
- Navigation (`moveToNode`, `completeCurrentNode`,
  `IllegalMoveError`) — Stable.
- World reducer (`changeMap`, `completeMap`, `unlockMap`,
  `completeNode`, `unlockNode`, `changeContinent`,
  `completeUniqueEvent`) — Stable.
- Quest system (`emptyQuestLog`, `isQuestComplete`,
  `findActiveQuest`, `findQuest`, `startQuest`, `progressQuest`,
  `completeQuest`, `discoverQuest`, `reachableObjectives`,
  `killObjectives`) — Stable.
- Encounter generation (`generateEncounter`, `scaleEnemyToLevel`,
  `scaledEncounterLevel`, `DIFFICULTY_LEVEL_BANDS`) — Stable.

### MapEvents (Phase 23 / 24) — Beta

The MapEvents engine resolves what happens when the player enters a
node. Eleven event kinds (`encounter`, `interaction`, `gathering`,
`rest`, `village`, `cutscene`, `hazard`, `loot-cache`, `narration`,
`blacksmith`, `travel`) plus a fog-of-war discovery / one-shot
consumption model.

- `resolveMapEvent(state, rng?)` — Beta. Single-entry dispatcher.
- Pool registration helpers — Beta:
  - `registerMapEventPool(pool)`
  - `setDefaultMapEventPool(continent, mapName, poolId)`
  - `setNodeEventPoolOverride(continent, mapName, nodeId, poolId)`
- Discovery / consumption reducers — Beta:
  - `revealAdjacent(state, nodeId)`
  - `markNodeConsumed(state, nodeId)`
- Types — Beta: `MapEventKind`, `MapEventPayload`, `MapEventPool`,
  `MapEventPoolEntry`, `ResolvedEvent`, `ResolveMapEventResult`,
  plus per-kind payload aliases (`EncounterPayload`, etc.).

See `plan/archive/2026-09-25-trim-t5/axiomancer-mechanics/specs/23-map-events.md` (archived) for the spec and
`src/World/MapEvents/e2e/map-events.engine.test.ts` for the
hermetic walkthrough.

### Effects

- Effect application (`applyEffect`,
  `lookupEffect`, `effectsLibrary`) — Stable.
- Effect types (`Effect`, `EffectType`, `EffectTier`,
  `EffectStacking`, `EffectCategory`, `EffectPayload`,
  `ActiveEffect`, `StatModifier`, `DamageOverTime`,
  `RegenerationConfig`, `ActionRestriction`, etc.) — Stable.

### The Oaths — removed

The alignment cube, GRACE (`moralMeter`), and every alignment gate
and delta were removed 2026-09-27 (T6, D39). A card's former
`philosophicalAspect` is now `color`.

### NPCs & Dialogue

- NPC types (`NPC`, `DialogueMap`, `DialogueTree`, `DialogueNode`,
  `DialogueChoice`, `DialogueContext`) — Stable.
- Dialogue helpers (`getDialogueNode`, `visibleChoices`,
  `isLeafNode`) — Stable.

### Utilities

- Math + random (`clamp`, `randomInt`, `deepClone`, `average`,
  `sum`, `max`, `min`, `inRange`, `capitalize`, `formatPercent`,
  `createDie`, `createDieRoll`,
  `determineRollAdvantageModifier`) — Stable.
- Max VITAE derivation (`calculateMaxHealth`) — Stable.
- RNG (`setRng`, `getRng`, `setSeed`, `Rng`) — Stable.

## Node.js Exports (from `'axiomancer-mechanics/node'`)

### Persistence

- `createNodeAdapter()` — Stable. The fs-backed save adapter.
- `PersistenceAdapter` interface — Stable (also re-exported from
  the core barrel for RN consumers).

The Node subpath exists so React Native bundlers don't tree-shake
`fs` into a mobile bundle. Server-side / CLI consumers can import
from either path.

## React Native Usage

The core package exports work in React Native without modification.
For persistence, implement the `PersistenceAdapter` interface with
AsyncStorage:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistenceAdapter, GameState } from 'axiomancer-mechanics';

const asyncStorageAdapter: PersistenceAdapter = {
  async load(): Promise<GameState | null> {
    const data = await AsyncStorage.getItem('game-state');
    return data ? JSON.parse(data) : null;
  },

  async save(state: GameState): Promise<void> {
    await AsyncStorage.setItem('game-state', JSON.stringify(state));
  },
};
```

### Event System

Subscribe to typed game events. The engine emits a uniform
`EnginePayload` envelope; consumers use the `is*Event` guards (or
the bare `event.type === '...'` check) to narrow:

```typescript
import {
  createGameStore,
  createEventEmitter,
  isCombatStartedEvent,
  isWorldMovedEvent,
} from 'axiomancer-mechanics';

const emitter = createEventEmitter();
const store = createGameStore(adapter, undefined, emitter);

emitter.on('combat:started', (event) => {
  if (isCombatStartedEvent(event)) {
    // event.payload is { action, state, report? }.
    const enemyName = event.payload.state.combat?.enemy.name;
    console.log(`Combat started against ${enemyName}.`);
  }
});

emitter.onAny((event) => {
  console.log('Game event:', event.type);
});
```

### Character Presets

Pick a curated progression tier at boot instead of hand-building a
character:

```typescript
import {
  characterPresets,
  buildCharacterFromPreset,
} from 'axiomancer-mechanics';

const apprentice = characterPresets.find(p => p.id === 'apprentice')!;
const player = buildCharacterFromPreset(apprentice);
const store = createGameStore(adapter, { player });
```

Three presets ship today: `apprentice` (level 1), `wanderer`
(level 8), `sage` (level 15).

### MapEvents

Pools register automatically when you import from the package
barrel. Use `resolveMapEvent` to advance a node:

```typescript
import { resolveMapEvent } from 'axiomancer-mechanics';

const result = resolveMapEvent(store.getState());
if (result.event.kind === 'encounter') {
  store.getState().startCombat(result.event.encounter);
}
```

## Versioning

This package follows semver post-1.0; pre-1.0 minor bumps may carry
breaking changes (typed event surface in 0.6.0, for example). The
Stability Levels above indicate intent. The former package-level
public-surface snapshot layer (Phase 53) was retired at the monorepo
merge — the package is consumed as local source via the `@mechanics`
workspace alias, not published to npm. The deploy gate
(`npm run deploy:check`) now lives at the monorepo ROOT and is run
from the repo root, not from this package.

Semver tier definitions:

- **Major (post-1.0)**: Breaking changes to stable APIs.
- **Minor**: New features; pre-1.0, may also break Beta APIs.
- **Patch**: Bug fixes and internal improvements.

Beta APIs are marked above and may change in minor releases with
migration guides in `plan/phases/`.

## Package Architecture

- **Core package**: React Native compatible, excludes Node.js
  dependencies.
- **Node subpath**: Server-side utilities requiring Node.js APIs
  (`createNodeAdapter`).
- **Barrel exports**: All public APIs available from the main entry
  point.
- **Type safety**: Full TypeScript support with strict typing.

For questions about API stability or usage, refer to the individual
module documentation in the `docs/` directory.
