# Public API Reference

## Stability Levels

- **Stable**: Committed to semver for breaking changes.
- **Beta**: May change in minor versions with deprecation notice.
- **Experimental**: May change without notice.

The library is `0.x.y` (pre-1.0); breaking changes can land in minor
bumps. Items marked Stable below carry the strongest intent to remain
unchanged, but the absolute semver guarantee starts at 1.0.

## Core Exports (from `'axiomancer-mechanics'`)

### Character

- `createCharacter()` — Stable.
- `Character`, `BaseStats`, `DerivedStats`, `NonCombatStats`,
  `CreateCharacterOptions`, `AggregatedEquipmentModifiers` types — Stable.
- Equipment functions (`equipItem`, `unequipItem`,
  `getEquipmentModifiers`) — Stable.
- **Character presets (Phase 18):** `characterPresets`,
  `getPresetById`, `buildCharacterFromPreset` — Stable.
  `CharacterPreset`, `CharacterPresetEquipmentEntry` types — Stable.
- **Stat allocation (Phase 29):** `allocateStatPoint(character, stat)`,
  `previewStatAllocation(baseStats, level, allocation)` — Stable. 
  `allocateStatPoint` spends one `availableStatPoints` to raise the chosen base
  stat by 1 and re-derive `derivedStats` / `nonCombatStats` /
  `maxHealth`. `previewStatAllocation` computes exact derived stats for
  mobile's level-up allocation preview without mutating character data.
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

- `resolveCombatRound()` — Stable. The orchestrator delegates to per-phase
  helpers under `src/Combat/phases/` (round-start / action-restriction /
  advantage / stance-effects / scenario / round-end). Public contract
  unchanged from Phase 02; internal split landed in Phase 15.
- `determineAdvantage()`, advantage and damage / healing functions — Stable.
- Combat state management (`initializeCombat`, `endCombat`, etc.) — Stable.
- Combat types (`CombatState`, `Action`, `Stance`, `RoundEvent`,
  `RoundResolution`, etc.) — Stable.
- **Phase 80 always-land contract:** `resolveEffectApplication` rewritten —
  Tier 2 debuffs + Tier 3 always land (no target-resist roll); only Tier 2
  buff caster fumble/crit survives. `EffectApplicationResult.rebounded`
  removed; `getResistStat` removed at v0.13.0 (use `getSaveStat`). See [`effects.md`](./effects.md).
- **Effect aggregators (iterate `7ee0745`):** `getActiveEffectModifiers`,
  `getEffectiveStats`, `canAct`, `resolveEffectiveAdvantage` — Stable.
  The four Combat-tier aggregators `docs/effects.md` "API at a glance"
  names; previously reachable only via `src/Combat/index.ts`, now
  re-exported through the top-level barrel. Types
  `AggregatedEffectModifiers`, `EffectiveStats` ride alongside.
  Power-user RN consumers composing custom UI may want to read these
  directly rather than going through one stance/stat at a time via
  the wrapper accessors (`getAttackStat` / `getDefenseStat` / etc.).

### Game Store and State

- `createGameStore()` — Stable.
- `gameReducer()` — Stable.
- `GameState`, `GameAction`, `GameActions` types — Stable.
- Event emitter (`createEventEmitter`) — Stable.
- Selectors (`selectPlayer`, `selectCombat`, `selectInventory`,
  `selectMoralMeter`, etc.) — Stable.
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
  time — mirrors Phase 69 `alignmentShift` pattern).
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
  preserves the character ledger (player + philosophicalAlignment +
  moralMeter + rngState) and refills HP to maxHealth; world /
  combat / quests / flags / observer cache reset.
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
- `STARTING_REGION: MapName = 'fishing-village'` — canonical
  starting region for `resetRun`; the hearth concept reuses
  `MapDefinition.startingNode` (no new "hearth" type primitive).
- `GAME_STATE_VERSION` bumped 5 → 6; `migrateV5toV6` defaults `runId`
  on legacy v5 saves.

See `docs/gameloop.md` § "Run-loop reset (Phase 72)" for the
preserve / reset matrix and lifecycle.

**CLI consumer surfaces (Phase 82).** `game.cli.ts` extended with
Codex tab (renders `state.codex.unlockedEntries` via enemy library
lookup) and Begin Again tab (`store.resetRun({ keepCharacter })`).
Agent-graded walkthrough at `automation/scripts/walkthroughs/codex-unlock.*`.

**Per-module quickstart pages (Phase 87).** Five focused guides with
runnable code samples: [`quickstart-character.md`](./quickstart-character.md),
[`quickstart-combat.md`](./quickstart-combat.md),
[`quickstart-items.md`](./quickstart-items.md),
[`quickstart-skills.md`](./quickstart-skills.md),
[`quickstart-world.md`](./quickstart-world.md).

### Events (Beta)

The engine emits a single uniform envelope on every `GameEvent`:

```ts
interface EnginePayload {
    action: GameAction;                  // what triggered the event
    state: GameState;                    // the post-reducer state
    report?: CombatEndReport;            // only on combat:ended
    unlockedSkills?: string[];           // only on character:levelup (Phase 30)
    combatEvents?: readonly RoundEvent[]; // only on combat:round (iterate 5ac6caa)
}
```

`unlockedSkills` (Phase 30 unit 2) lists skill ids newly eligible to
learn after a level promotion crossed a tier-eligibility threshold. An
empty array means the levelup didn't unlock anything new; the field is
absent on every other topic.

`combatEvents` (iterate `5ac6caa`) carries the full `RoundEvent[]` stream
that `resolveCombatRound` produced (attack-roll, damage-applied,
effect-application, skill phases, item-used, friendship-counter ticks,
etc.). Populated only on `combat:round` when the CLI / driver threads
the array through `store.updateCombat(combat, combatEvents)`; absent
otherwise.

`CombatEndReport.outcome` is `'victory' | 'defeat' | 'friendship' |
'flee'`. Phase 36 added `'friendship'` for the friendship-counter exit
— half XP grant + full loot + `+1` moral meter.

**Befriendable-enemy content (Phase 60 + Phase 62 + Phase 69) — Beta.**
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

Phase 69 extended `FriendshipReward` with
`alignmentDelta?: Partial<PhilosophicalAlignment>` — when present,
the END_COMBAT reducer applies the delta to
`state.philosophicalAlignment` via the Phase 42 `applyAlignmentDelta`
clamp helper (each axis clamps to `[-100, +100]`; missing axes pass
through). The post-clamp `PhilosophicalAlignment` surfaces on
`CombatEndReport.friendshipReward.alignmentShift?: PhilosophicalAlignment`
for consumers to render (mirrors `applyDialogueChoice`'s
`effects.philosophicalShift`). Phase 36's +1 `moralMeter` shift stays
unchanged on top — friendship resolutions now optionally shift BOTH
axes per encounter. Closes Spec 14 Q4. Authoring band: ±1..±5 per axis
(matches Phase 43's dialogue / map-event delta convention). First
authored deltas: MournfulGull `{ outlook: +3 }` (wistful empathy);
HollowEyedBeggar `{ scope: -3 }` (re-grounds toward the relational
individual).

See `docs/combat.md` § "Friendship Path" + § "Befriendable-enemy
content (Phase 60)" and `docs/enemy.md` § "Befriendable enemies
(Phase 60)".

**Per-enemy befriend predicate (Phase 68) — Beta.** Optional
`Enemy.befriendabilityConfig?: BefriendabilityConfig` overrides the
Phase 36 friendship-eligibility check on a per-enemy basis. When
absent, the Phase 36 mechanic (`friendshipCounter >=
FRIENDSHIP_COUNTER_MAX`) is unchanged; when present, ALL named
predicates AND-compose:

- `roundsThreshold?: number` — per-enemy override of the global
  counter cap (default `FRIENDSHIP_COUNTER_MAX`).
- `hpGate?: { belowPct: number }` — enemy HP fraction must be at or
  below `belowPct` at the eligibility check (snapshot; healing back
  above the threshold un-qualifies).
- `requiredStances?: Stance[]` — player must have used at least one
  of the named stances during combat (existential; derived from
  `state.log[].playerAction.stance`).
- `requiredSkillUse?: string[]` — player must have cast at least one
  of the named skill IDs during combat (existential; derived from
  `state.log[].playerAction` entries with `action === 'skill'`).
- `defaultFallback?: 'both-defend-cap'` — explicit escape hatch that
  treats other fields as no-ops and uses the global counter cap.

Counter still increments freely on both-defend rounds (Phase 36
unchanged); friendship triggers only when all predicates pass
together — late-resolution semantics. The new internal helper
`isFriendshipEligible(state)` is the single decision point;
`determineCombatEnd` and `isCombatOngoing` both call it so the two
predicates stay in lockstep. Helper is **not** on the public barrel
per Phase 68 D11 — engine consumers read combat-end state through
`determineCombatEnd`. First boss-tier authored config:
`CoastalTyrant` ships `{ hpGate: { belowPct: 0.4 }, requiredStances:
['heart'], roundsThreshold: 5 }`. See `docs/combat.md` § "Per-enemy
predicate (Phase 68 — `BefriendabilityConfig`)" for the full schema
and authoring guidance.

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

**Reactive NPCs — alignment observers (Phase 63).** Tree-level
observer machinery — Beta:

- `DialogueTree.id?: string` — optional tree identifier opting the
  tree into the observer cache.
- `GameState.lastSeenAlignmentCells?: Record<string, string>` —
  additive optional cache keyed by `tree.id`, value is the alignment
  cell id at the last `applyDialogueChoice` against the tree.
  Defaults to `undefined` (cold-start); no `GAME_STATE_VERSION`
  bump.
- `DialogueChoice.requires.playerAlignmentCellChangedSince?: boolean`
  — reactive gate visible only when the player's CURRENT cell
  differs from the cached one.
- `DialogueContext.lastSeenAlignmentCellId?: string` — caller
  sources this from `state.lastSeenAlignmentCells?.[tree.id]` when
  invoking `visibleChoices`.

First authored use: Old Marrow's tree (`id: 'old-marrow'`) surfaces
a reactive `(Stand quietly. He looks up and sees who you have
become.)` branch on re-conversation after the player's alignment
cell has shifted. See `docs/npcs.md` § "Reactive NPCs — alignment
observers (Phase 63)" for the consumer-side API.

`TypedGameEvent<T>` narrows the event by topic; `payload` is always
the engine envelope above. Per-topic aliases ship for all 10
`GameEventType` values:

- `TypedCombatStartedEvent`, `TypedCombatRoundEvent`,
  `TypedCombatEndedEvent`
- `TypedWorldMovedEvent`, `TypedWorldProcessedEvent`
- `TypedLevelUpEvent`, `TypedInventoryChangedEvent`
- `TypedDialogueAppliedEvent`, `TypedGameSavedEvent`,
  `TypedGameLoadedEvent`

And 10 type guards for filter / find style narrowing:

- `isCombatStartedEvent`, `isCombatRoundEvent`, `isCombatEndedEvent`
- `isWorldMovedEvent`, `isWorldProcessedEvent`
- `isLevelUpEvent`, `isInventoryChangedEvent`
- `isDialogueAppliedEvent`, `isGameSavedEvent`, `isGameLoadedEvent`

Phase 21 removed the seven pre-existing `Typed*Payload` interfaces
(`CombatStartedPayload`, etc.) and `create*Event` factories — the
engine never produced the per-topic payloads, and consumer-side
fabrication had no use case. If you need rich per-topic payloads on
a future spec, the path is to rewrite the engine's emit sites; see
`specs/23-map-events.md` for the precedent that aligned types with
reality.

### Items, Equipment & Inventory

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
  `docs/items.md` § "Previewing rolled mods (library / catalog
  views — Phase 75)".
- `previewTemplateAtAllRarities(templateId, playerLevel, rng?)` —
  Beta (Phase 76). Batch wrapper around `previewTemplateAtRarity`
  returning `Record<ItemRarity, Equipment | undefined>` for UI
  tooltip / item-detail views rendering the full rarity strip in
  one call. Same soft-error + deterministic-rng convention as the
  single-cell helper.
- Inventory management (`addItem`, `removeItem`, `useConsumable`,
  `stackItem`, `addItemToInventory`, `removeItemFromInventory`) — Stable.
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
  and the resolved village event's `shop?` field. See `docs/items.md`
  "Shop economy" for the schema and the authored shop tables.

- **Set Items (Phase 54 / Spec 05e):** Beta. Equipping multiple
  members of a named `ItemSet` grants threshold-keyed `SetBonus`
  payloads on top of per-item `statModifiers` /
  `resourceInteraction` / `passiveEffects`. Set bonuses are computed
  on-demand at `initializeCombat` + `generateBasicActionResources` —
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

### Skills

- Skill execution (`executeSkill`, `canUseSkill`,
  `generateBasicActionResources`, `generatePhilosophicalResource`,
  `calculateSkillDamage`, `spendResources`) — Stable.
- Skill types (`Skill`, `SkillCategory`, `SkillsStatType`,
  `SkillTier`, `SkillTarget`, `ResourceCost`, `CombatResources`,
  `SkillResolution`, etc.) — Stable.
- **Top-level skill library (Phase 50):** `skillLibrary: Skill[]` +
  `getSkillById(id: string): Skill | undefined` re-exported on the
  top-level barrel (Phase 50 unit 1 — `19f2015`, engine-handoff fix
  for `axiomancer-mobile`). Consumers no longer need to import from a
  deep path; the canonical 21-skill library (6 Tier 1 + 8 Tier 2 +
  7 Tier 3 as of Phase 66 + Phase 44) is reachable directly from
  `import { skillLibrary, getSkillById } from 'axiomancer-mechanics'`.
- **Runtime learning (Phase 30):** `learnSkill(character, skillId)`,
  `getAvailableSkills(character)`, `meetsLearningRequirement(character,
  skill)` — Stable. The `LEARN_SKILL` action wires this through the
  game reducer; the Character tab in `npm run game` exposes it. Closes
  Spec 06 Q7.
- **Tier 2 synergy (Phase 66):** Beta. Optional
  `Skill.synergy?: SkillSynergy` clause + matching `SynergyPredicate`
  shape lets a skill condition bonus damage / effect consumption /
  type-swap / detonation on the presence of an `ActiveEffect` already
  on the field. `executeSkill` evaluates synergy after
  `calculateSkillDamage` but before `combatEffects` apply. A new
  `synergy-fired` `SkillEvent` (and matching `SkillPhaseEvent`
  variant) surfaces the bonus damage, consumed effect ids,
  consumed-token count, and clear/consume flags for UI / agent
  rendering. Five Tier 2 skills ship as the first authored batch:
  `resonance-bleed` (heart, cross-stance duration amp),
  `intensity-feedback` (mind, cross-stance intensity amp),
  `bat-swarm-thoughtform` (heart, buff type-swap consuming
  `tier1_body_defend`), `resonance-burst` (mind, consume opposing
  debuff for damage), `resonance-detonation` (heart, no predicate;
  apex burn — consume full combat-resource pool + clear all effects
  + damage proportional to consumed tokens). See `docs/skills.md` §
  "Tier 2 synergy (Phase 66)" for the schema + the per-skill table.
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
node. Eight event kinds (`encounter`, `interaction`, `gathering`,
`rest`, `village`, `cutscene`, `hazard`, `loot-cache`) plus a
fog-of-war discovery / one-shot consumption model.

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

See `specs/23-map-events.md` for the spec and
`src/World/MapEvents/e2e/map-events.engine.test.ts` for the
hermetic walkthrough.

### Effects

- Effect application (`applyEffect`, `applyTier1CombatEffect`,
  `clearTier1EffectsForStance`,
  `lookupEffect`, `getEffectByName`, `getEffectsByType`,
  `effectsLibrary`) — Stable.
- World-effect tick (`processWorldEffectTick`,
  `getActiveHazards`) — Stable.
- Effect types (`Effect`, `EffectType`, `EffectTier`,
  `EffectStacking`, `EffectCategory`, `EffectPayload`,
  `ActiveEffect`, `StatModifier`, `DamageOverTime`,
  `RegenerationConfig`, `ActionRestriction`, etc.) — Stable.

### Philosophy (Phase 42, Phase 43, Phase 44, Phase 46) — Beta

3-axis alignment cube indexing a 27-cell content registry. See
[docs/philosophy.md](./philosophy.md) for the full table.

- Types (`PhilosophicalAlignment`, `AxisBucket`, `AlignmentFallacy`,
  `PhilosophicalAlignmentCell`) — Beta.
- Engine (`bucketAxis`, `getAlignmentCell`, `applyAlignmentDelta`,
  `defaultAlignment`) — Beta.
- Constants (`AXIS_HIGH_THRESHOLD`, `AXIS_LOW_THRESHOLD`) — Beta.
- Library (`philosophicalAlignmentLibrary`) — Beta. Frozen array
  of 27 cells; each carries philosopher, literary character + work,
  and 3 signature fallacies.
- State field `GameState.philosophicalAlignment` — Beta. Persists
  across save/load (`GAME_STATE_VERSION` is now `5`; v4 saves
  migrate cleanly via `migrateV4toV5`).
- Action `SHIFT_PHILOSOPHICAL_ALIGNMENT` + store action
  `shiftPhilosophicalAlignment(delta: Partial<PhilosophicalAlignment>)` — Beta.

Orthogonal to `moralMeter` — both fields persist independently. The
three fallacies per cell are content fuel for skill/effect/spell
authoring; the first batch is live as of Phase 44.

**Phase 43 — content authoring surfaces:**
- `DialogueChoice.effect.alignmentDelta?: Partial<PhilosophicalAlignment>` — Beta. Applied by `applyDialogueChoice` and surfaced on `effects.philosophicalShift`.
- `MapEventPoolEntry.alignmentDelta?: Partial<PhilosophicalAlignment>` — Beta. Applied by `resolveMapEvent` after the matching handler runs.

**Phase 44 — fallacies-as-spells / abilities:**
- `Skill.sourcedFromCell?: string` — Beta. Cross-link to the originating cell id for fallacy-themed skills.
- `Effect.sourcedFromCell?: string` — Beta. Same for fallacy-themed status effects.
- 4 new Tier 3 fallacy skills (`appeal-to-consequences`, `nirvana-fallacy`, `pascals-wager`, `appeal-to-fear`) in `skillLibrary`.
- 3 new fallacy status effects (`debuff_no_true_scotsman`, `buff_special_pleading`, `debuff_category_error`) in `effectsLibrary`.

**Phase 46 — alignment-gated content:**
- `AlignmentGate` type (`{ axis: 'epistemology' | 'outlook' | 'scope', op: 'gte' | 'lte', value: number }`) — Beta. Predicate shape for gating content on the player's current alignment cube position.
- `DialogueChoice.requires.requiresAlignment?: AlignmentGate` — Beta. Applied by `visibleChoices` (gated choices are hidden when the gate misses).
- `SkillLearningRequirement.requiresAlignment?: AlignmentGate` — Beta. Applied by `meetsLearningRequirement` / `getAvailableSkills` / `learnSkill` (each accepts an optional `alignment` argument; the `LEARN_SKILL` reducer reads `state.philosophicalAlignment` automatically).
- `DialogueContext.alignment?: PhilosophicalAlignment` — Beta. Optional context field threaded through `visibleChoices` so callers can preview gates without committing dispatch.
- 2 live gates authored on `nirvana-fallacy` (`outlook ≤ -34`) + `appeal-to-fear` (`scope ≥ 34`); 2 dialogue branches gated on Old Marrow + Coastal Beggar. See [docs/philosophy.md "Authoring gates (Phase 46)"](./philosophy.md) for operator semantics + authoring guidance.

### Faction (Phase 110) — Beta

Reputation system for boss befriend consequences. See
[docs/faction.md](./faction.md) for authoring guidelines.

- Types (`FactionReputation`, `FactionReputations`, 
  `FactionReputationDelta`, `FactionInfo`) — Beta.
- Engine (`clampFactionReputation`, `createDefaultFactionReputations`,
  `applyFactionReputationDeltas`, `getFactionReputation`) — Beta.
- Constants (`FACTION_REPUTATION_MIN`, `FACTION_REPUTATION_MAX`,
  `DEFAULT_FACTION_REPUTATION`) — Beta.
- Library (`factionLibrary`, `getFactionInfo`, `getAllFactions`) — Beta.
  Registry of known factions with metadata (name, description).
- State field `GameState.factionReputations` — Beta. Persists
  across save/load and run resets when `keepCharacter: true`.

**Boss befriend integration:**
- `FriendshipReward.factionDeltas?: FactionReputationDelta` — Beta. Applied
  by the `END_COMBAT` reducer on friendship outcomes via 
  `applyFactionReputationDeltas`.
- `CombatEndReport.friendshipReward.factionReputationShift?: { [factionId: string]: number }` — Beta. Surfaces post-clamp reputation values for changed factions.

Boss befriend outcomes can demonstrate lose-with-one / gain-with-another
tradeoffs (±10..±15 per faction for boss-tier encounters). The system makes
mercy decisions consequential rather than reward-only.

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
- Stat derivation (`deriveStats`, `deriveNonCombatStats`,
  `calculateMaxHealth`) — Stable.
- RNG (`setRng`, `getRng`, `setSeed`, `Rng`) — Stable.
- Type guards (`isCharacter`, `isEnemy`, `isCombatActive`) — Stable.

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
Stability Levels above indicate intent — and since Phase 53 the
contract is **enforced** by a public-surface snapshot at
[`scripts/public-surface.expected.json`](../scripts/public-surface.expected.json):

- Every additive symbol on the top-level barrel must land with a
  matching fixture refresh (`node scripts/snapshot-public-surface.mjs
  --write`).
- `npm run deploy:check` compares the live `dist/index.d.ts` against
  the fixture and exits non-zero on drift; the deploy gate is wired
  into CI (`.github/workflows/verify.yml`).
- Per-tag deltas are emitted by `node scripts/diff-public-surface.mjs
  <ref-A> <ref-B>` (markdown-shaped Added / Removed / Changed lists);
  the CHANGELOG `[unreleased]` block carries the per-bump prose.

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
