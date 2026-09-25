# Axiomancer — Mechanics Engine

Turn-based RPG engine with a Heart / Body / Mind combat system. Status effects, skills, and enemies are themed around logical fallacies and philosophical paradoxes.

This package is the **non-UI engine** only — a workspace package in the Axiomancer monorepo, consumed as local source via the `@mechanics` alias by `axiomancer-mobile` and `axiomancer-card-editor`. All logic is exposed through the package barrel at [`src/index.ts`](./src/index.ts).

**Looking for a tour?** See [`docs/quickstart.md`](./docs/quickstart.md) —
a single-page entry point covering what's shipped, how to drive
the CLI through every major surface, the walkthrough catalog, key
in-game flows (combat / friendship path / map exploration / save-load),
verify gates, and pointers to deeper docs.

See [`VISION.md`](./VISION.md) for T's current game vision and doctrine guardrail before major mechanics, combat, friendship, or balance work.

See `CHANGELOG.md` (and the archived `plan/archive/2026-09-25-trim-t1/axiomancer-mechanics/RELEASES.md`) for short-form per-version
summaries (at-a-glance "what shipped in 0.X.Y?"),
[`CHANGELOG.md`](./CHANGELOG.md) for the full per-phase detail per
release (both historical logs from the pre-monorepo npm era),
[`docs/source-of-truth-hierarchy.md`](./docs/source-of-truth-hierarchy.md)
for the documentation hierarchy, and [`docs/adr/`](./docs/adr/) for durable
architecture and product decisions that govern mechanics work.

---

## Install

The package is **not published to npm** — it lives in the Axiomancer
monorepo and is consumed as local source via the `@mechanics` alias by
`axiomancer-mobile` and `axiomancer-card-editor`.

For local engine development (from the repo root):

```bash
npm install
npm run build --workspace axiomancer-mechanics   # compiles to ./dist
```

## Quick start

```ts
import {
  createCharacter, createEnemy,
  initializeCombatEncounter, rollEncounterDice,
  playCombatCard, resolveThreatPhase, processBetweenPhases,
} from 'axiomancer-mechanics';

const player = createCharacter({
  name: 'Hero',
  level: 1,
  baseStats: { heart: 4, body: 3, mind: 2 },
});

const enemy = createEnemy({
  id: 'goblin-1',
  name: 'Goblin',
  description: '',
  level: 1,
  baseStats: { heart: 1, body: 2, mind: 1 },
  mapName: 'fishing-village',
  logic: 'random',
});

let state = initializeCombatEncounter(player, enemy);
({ state } = rollEncounterDice(state));

while (state.phase !== 'complete') {
  // ...draft a stance die, play cards (playCombatCard), then
  // resolveThreatPhase + processBetweenPhases per turn...
  break;
}
```

See [`docs/quickstart-combat.md`](./docs/quickstart-combat.md) for the full
turn loop.

## Public API

The barrel exports are organised by domain:

> **Superseded (2026-09-23):** the Enemy, Items and Skills rows below name retired exports (`decideEnemyAction` and the AI presets, `executeSkill` / `canUseSkill` / `calculateSkillDamage` / `learnSkill` / `getAvailableSkills`, the procedural template and set-item helpers) — live truth: src/index.ts (the barrel), src/Enemy/enemy.library.ts, src/Cards/card.engine.ts, src/Items/. Body kept as a historical record pending rewrite (plan/AUDIT.md).

| Group           | Highlights                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| Character       | `createCharacter` (auto-generates `Character.id` via `getRng()` when not supplied — Phase 35), `equipItem`/`unequipItem`, `getEquipmentModifiers`, `allocateStatPoint` + `STAT_POINTS_PER_LEVEL` + `availableStatPoints` field on `Character` (Phase 29), presets API (`characterPresets`, `getPresetById`, `buildCharacterFromPreset`), types (`Character`, `BaseStats`, `DerivedStats`, `NonCombatStats`, `CharacterPreset`) |
| Enemy           | `createEnemy`, `decideEnemyAction`, AI presets (`aggressive`/`defensive`/`balanced`/`strategic`/`bossLogic`), `rollLoot`/`rollLootMany`, `EnemyLibrary`, `EnemiesByMap`, `ENEMY_REGISTRY`, `DEFAULT_XP_BY_DIFFICULTY`; `Enemy.philosophicalAlignment?: PhilosophicalAlignment` + outlook-driven basic-action bias since Phase 45; per-enemy `friendshipReward?: FriendshipReward` (`{ items?, xpBonus?, narrative?, flagSet?, alignmentDelta? }`) drives Phase 60 befriendable-enemy content (MournfulGull + HollowEyedBeggar authored today). Phase 62 added `flagSet?: string` — appends a world flag to `state.flags` on friendship outcome, consumed by `DialogueChoice.requires.flag`. Phase 68 added `BefriendabilityConfig` + `Enemy.befriendabilityConfig?: BefriendabilityConfig` — per-enemy override of the Phase 36 friendship-eligibility check (`roundsThreshold` / `hpGate` / `requiredStances` / `requiredSkillUse` AND-composed; `defaultFallback` escape hatch). First boss-tier authored config: CoastalTyrant (`hpGate { belowPct: 0.4 }`, `requiredStances: ['heart']`, `roundsThreshold: 5`). Phase 69 added `alignmentDelta?: Partial<PhilosophicalAlignment>` — applied to `state.philosophicalAlignment` via `applyAlignmentDelta` on friendship outcome; the post-clamp value surfaces on `CombatEndReport.friendshipReward.alignmentShift`. Closes Spec 14 Q4. First authored deltas: MournfulGull `{ outlook: +3 }`, HollowEyedBeggar `{ scope: -3 }`. Phase 71 added `FinalBlowLines` / `PactLines` / `CauseLines` types + per-foe `finalBlowLines?` / `pactLines?` / `causeLines?` — chronicle-voice prose on the Enemy type for the post-combat aftermath panel (3 variants per group; consumer picks based on outcome shape). Closes GH#65 ask 1. Initial author coverage: MournfulGull, HollowEyedBeggar, CoastalTyrant. Phase 73 added `CodexEntry { id, title, body }` type + per-foe `journalEntry?: CodexEntry` — auto-unlocks on `outcome === 'friendship'` (appends to `state.codex.unlockedEntries`; surfaces `{ id, title }` on `CombatEndReport.friendshipReward.codexEntryUnlocked`). Initial entries: `codex-mournful-gull`, `codex-hollow-eyed-beggar`, `codex-coastal-tyrant`. Closes GH#65 ask 3. |
| Combat          | `determineAdvantage`, stat accessors (`getBaseStat`/`getAttackStat`/`getDefenseStat`/`getSaveStat`), `applyDamage`/`heal`/`healCharacter`, `tickAllEffects`/`applyRegen`, `getActiveRollModifier`/`getThornsReflect`, `resolveEffectApplication` (Phase 80 — Tier 2 debuff + Tier 3 **always land**; target-resist roll removed), `Stance`/`Action`/`CombatState`/`Combatant` |
| Combat reducer  | `initializeCombat` (the `CombatState` constructor shared by the skill / effects / equipment engines), `incrementFriendship`. The legacy per-round reducer verbs (`setPhase`/`setPlayerStance`/`setPlayerAction`/`appendLog`/`endCombat`) were removed with the legacy turn-based resolver |
| Hazard-Pattern Combat (Spec 25) | Card-and-dice combat engine — **the only combat engine** (the legacy turn-based `resolveCombatRound` was removed) — every verb is a combat card (projected from a learned skill), and HP is the **sole win condition** (enemy HP drops to 0 via DoT erosion + strikes; basic-attack trading is the weak baseline). Drive a fight with `initializeCombatEncounter`, `rollEncounterDice`, `playCombatCard`, `resolveCombatPhase`/`resolveThreatPhase`/`processBetweenPhases`, `buildCombatSummary`; preview helpers `getCard`/`handCards`/`cardDieCostPreview`/`availableDice`; dice/deck/card/threat sub-modules (`rollCombatDice`, `buildCombatDeck`, `toCombatCard`, `getThreatSequence`); Monte-Carlo greedy bot `simulateHazardPatternCombat`. Types: `CombatEncounterState`, `CombatCard`, `CombatThreatPhase`, `CombatOutcome`, `CombatSummary`, `CombatSimStats`. See [`docs/combat.md`](./docs/combat.md) → Hazard-Pattern Combat. |
| Effects         | `applyEffect`, `applyTier1CombatEffect`, `clearTier1EffectsForStance`/`ForType`, `lookupEffect`/`getEffectByName`/`getEffectsByType`, `effectsLibrary`, `processWorldEffectTick`/`getActiveHazards`, types (`Effect`, `ActiveEffect`, `EffectTier`, `StatModifier`, `DamageOverTime`, `RegenerationConfig`, `ActiveHazard`). Phase 80 always-land contract: Tier 2 debuffs + Tier 3 always land (no resist roll); only Tier 2 buff caster fumble/crit survives. See [`docs/effects.md`](./docs/effects.md). |
| Items           | `addItem`/`removeItem`/`stackItem`, `useConsumable`/`useConsumableEffect`, equipment helpers (`aggregateCombatStartTokens`, `applyEquipmentGenerationBonus`, `getEquipmentProcTriggers`), `equipmentTemplates`/`uniqueTemplates`, `consumableLibrary`, type guards; shop economy (`buyItem`/`sellItem`/`defaultSellPrice`, types `ShopWare`/`ShopInventory` — Phase 37 + iterate `3ba5319`); set items (`getActiveSetBonuses` + 5 siblings: `getActiveSetBonusesForCharacter`/`aggregateSetStartTokens`/`applySetGenerationBonus`/`getActiveSetPassiveEffectIds`/`getEquippedItemSets`, library `itemSetLibrary`/`getItemSetById`, types `SetBonus`/`ItemSet` — Phase 54); base types (`Item`, `Equipment`, `Consumable`, `Material`, `QuestItem`, `EquipmentTemplate`, `UniqueItemTemplate`); Phase 75 added `previewTemplateAtRarity(templateId, rarity, playerLevel, rng?): Equipment \| undefined` — UI-tier wrapper around `dropItem` for mobile item-library mod-visibility (closes the user-jot at `b5c8165`). Phase 76 added `previewTemplateAtAllRarities(templateId, playerLevel, rng?): Record<ItemRarity, Equipment \| undefined>` — batch wrapper around the Phase 75 single-cell helper for UI tooltip / item-detail views rendering the full rarity strip in one call. Phase 152 added the affix-naming layer: `dropItemWithAffixes(templateId, playerLevel, rng?, opts?: DropWithAffixesOptions)` (drop + prefix/suffix roll), `composeItemName`, the `prefixes`/`suffixes`/`allAffixes` libraries with `getAffixById`/`affixesForSlot` lookups, `AFFIX_RARITY_WEIGHTS` draw scale, and types (`DropWithAffixesOptions`, `AffixControl`, `Affix`, `AffixRole`). |
| Skills          | `executeSkill`, `canUseSkill`/`spendResources`/`calculateSkillDamage`, `generateBasicActionResources`/`generatePhilosophicalResource`, runtime learning (`learnSkill`, `getAvailableSkills`, `meetsLearningRequirement` — Phase 30; `learningRequirement` field on every Tier 2 / Tier 3 entry — Phase 33), top-level skill library (`skillLibrary`/`getSkillById` — Phase 50 unit 1 engine-handoff fix), types (`Skill`, `CombatResources`, `SkillTier`, `SkillResolution`, `SkillEvent`, `SkillLookup`); Tier 2 synergy primitive (`SkillSynergy` + `SynergyPredicate` types; 5 authored skills — `resonance-bleed`/`intensity-feedback`/`bat-swarm-thoughtform`/`resonance-burst`/`resonance-detonation` — Phase 66) |
| Game            | `createGameStore`/`createNewGameState`, `gameReducer`/`migrate`, `createEventEmitter`, selectors (`selectPlayer`, `selectIsInCombat`, `selectInventory`, `selectMoralMeter`, `selectVersion`), `nullAdapter` (Node adapter `createNodeAdapter` lives on `'axiomancer-mechanics/node'` since Phase 21), mechanic constants (`FRIENDSHIP_COUNTER_MAX`, `MAX_EFFECT_DURATION`, `PASSIVE_DEFENSE_MULTIPLIER`, `STAT_POINTS_PER_LEVEL`, …), GameAction union extended with `ALLOCATE_STAT_POINT` (Phase 29) and `LEARN_SKILL` (Phase 30), typed event surface (`EnginePayload` with optional `unlockedCards` on `character:levelup` per Phase 30 unit 2; the `combat:round` topic and its `combatEvents` field were removed with the legacy resolver; `TypedGameEvent` + 9 per-topic aliases, 9 `is*Event` guards), types (`GameState`, `GameStore`, `GameAction`, `GameEvent`/`GameEventEmitter`, `PersistenceAdapter`); `GameState.lastSeenAlignmentCells?: Record<string, string>` (Phase 63 — Beta; per-tree observer cache); Phase 72 added run-loop semantics — `store.resetRun({ keepCharacter: bool })` + required `GameState.runId: string` (16-char hex; bumped per reset) + `generateRunId` helper + `STARTING_REGION` constant; `GAME_STATE_VERSION` bumped 5 → 6 with `migrateV5toV6` defaulting `runId` for legacy saves. Closes GH#65 ask 2. Phase 73 added `CodexState` + required `GameState.codex: CodexState` slice + `store.unlockCodexEntry(entryId)` + `UNLOCK_CODEX_ENTRY` action + auto-firing wire on friendship outcomes; `GAME_STATE_VERSION` bumped 6 → 7 with `migrateV6toV7` defaulting `codex` for legacy saves. Closes GH#65 ask 3. |
| World           | `createStartingWorld`, world reducer (`changeMap`/`completeMap`/`unlockMap`/`completeNode`/`unlockNode`/`changeContinent`, plus Phase-23 `revealAdjacent`/`markNodeConsumed` and Phase-31 `unlockAdjacent`), map registry (`MAP_REGISTRY`, `getMapDefinition`, `createMapState`), node traversal (`moveToNode`, `completeCurrentNode`, `applyDialogueChoice`), MapEvents engine (`resolveMapEvent`, `registerMapEventPool`, `setDefaultMapEventPool`, `setNodeEventPoolOverride`, types: `MapEventKind`, `MapEventPool`, `ResolvedEvent`, etc.; the legacy `processNode` + `MapEvent` / `MapEventType` surface was removed in Phase 25), quests (`emptyQuestLog`, `startQuest`/`progressQuest`/`completeQuest`/`discoverQuest`; reach-objective auto-advance restored at iterate `8611881`), encounters (`generateEncounter`, `scaleEnemyToLevel`, `DIFFICULTY_LEVEL_BANDS`), types (`WorldState`, `MapState`, `MapDefinition`, `MapNode`, `Quest`, `Encounter`) |
| NPCs            | `getDialogueNode`, `visibleChoices`, `isLeafNode`, types (`NPC`, `DialogueMap`, `DialogueTree`, `DialogueNode`, `DialogueChoice`, `DialogueContext`); `DialogueChoice.effect.alignmentDelta?: Partial<PhilosophicalAlignment>` since Phase 43. Phase 63 added the alignment-observer machinery: `DialogueTree.id?: string` (opts a tree into the cache), `DialogueChoice.requires.playerAlignmentCellChangedSince?: boolean` (reactive gate), `DialogueContext.lastSeenAlignmentCellId?: string` (caller-sourced input) |
| The Oaths       | 3-axis alignment cube + 27-cell content registry (Phase 42; re-skinned Phase 44h per spec 34 §6). Engine: `bucketAxis`/`getAlignmentCell`/`applyAlignmentDelta`/`defaultAlignment`, constants (`AXIS_HIGH_THRESHOLD`, `AXIS_LOW_THRESHOLD`), library (`philosophicalAlignmentLibrary` — 27 entries, each carrying a damned exemplar + cautionary tale + 3 besetting sins). Types (`PhilosophicalAlignment`, `AxisBucket`, `BesettingSin`, `PhilosophicalAlignmentCell`). Display names: CREED/AUGURY/TROTH (engine fields `epistemology`/`outlook`/`scope`, unchanged). State: `GameState.philosophicalAlignment` (Phase 42, `GAME_STATE_VERSION` 5 with `migrateV4toV5`), `SHIFT_PHILOSOPHICAL_ALIGNMENT` action + store action. Authoring surfaces: `DialogueChoice.effect.alignmentDelta` + `MapEventPoolEntry.alignmentDelta` (Phase 43). Enemy alignment + outlook AI bias (Phase 45). Alignment gates: `AlignmentGate` type (`{ axis, op: 'gte'\|'lte', value }`), `DialogueChoice.requires.requiresAlignment?` + `SkillLearningRequirement.requiresAlignment?`, optional `alignment` param on `meetsLearningRequirement` / `getAvailableSkills` / `learnSkill`, `DialogueContext.alignment?` (Phase 46). See [`docs/oaths.md`](./docs/oaths.md). |
| Utils           | `clamp`/`inRange`/`average`/`sum`/`max`/`min`, `randomInt`, `deepClone`, `capitalize`/`formatPercent`, `createDie`/`createDieRoll`/`determineRollAdvantageModifier`, `deriveStats`/`deriveNonCombatStats`/`calculateMaxHealth`, type guards (`isCharacter`, `isEnemy`, `isCombatActive`) |
| Utils — RNG     | `getRng`/`setRng`/`setSeed`, `Rng` interface (seedable LCG; Phase 11 routed all gameplay rolls through this singleton so saves are reproducible) |

**Recent infrastructure (Phases 81-88):** 13 agent-graded walkthroughs
in `automation/scripts/walkthroughs/` (Phase 81); CLI codex + reset tabs
(Phase 82); 824 hermetic tests (Phase 83 skill coverage + Phase 88
effect coverage sweep); 5 per-module quickstart pages at
[`docs/quickstart-*.md`](./docs/) (Phase 87).

### Hazard public API

> **Superseded (2026-09-23):** the standalone Hazard minigame exports below (`initializeHazard`, `drawOpeningHand`, `HAZARD_CARD_LIBRARY`, `HazardMinigameState`, …) no longer exist; combat is Hazard-Pattern Combat driven from `src/Combat` (`initializeCombatEncounter`, `resolveCombatPhase`) — live truth: src/Combat/, src/index.ts. Body kept as a historical record pending rewrite (plan/AUDIT.md).

`axiomancer-mechanics@0.16.0` ships the Hazard minigame through the top-level barrel. Consumers can import `initializeHazard`, `drawOpeningHand`, `selectRoute`, `rollDiceAndStartRound`, `playCardInRound`, `resolveRound`, `advanceToNextRound`, `computeFinalScore`, `HAZARD_CARD_LIBRARY`, `ACTION_CARD_LIBRARY`, `STARTER_DECK_CARD_IDS`, and Hazard types such as `HazardMinigameState`, `HazardCard`, `HazardActionCard`, `HazardManaDie`, and `HazardRoundResult`. See [`docs/hazard-minigame-api.md`](./docs/hazard-minigame-api.md).

## CLIs

The repo also ships a hands-on demo CLI. It is NOT part of the published package surface (`src/CLI` is excluded from the build):

| Command          | What it does                                                                  |
| ---------------- | ----------------------------------------------------------------------------- |
| `npm run game`   | Interactive demo — tabbed map / journal / cards / codex / inventory / character / dev loop. |

### Agent-driven CLI mode

`npm run game` accepts three flags so the demo loop can be driven without a
human at the keyboard:

| Flag | What it does |
| ---- | ------------ |
| `--script <path>` | Loads a JSON array of answer objects and feeds them to subsequent prompts in order. Each object matches the shape `inquirer.prompt` returns (e.g. `{"presetId": "apprentice"}`, `{"tab": "debug"}`). Exhaustion throws. |
| `--stdin` | Reads one JSON object per line from stdin and uses each as the next answer. EOF before all prompts complete throws. |
| `--json-events` | Replaces the human event log with one `JSON.stringify(event)` line per emitted GameEvent on stdout. Human prose is routed to stderr so stdout stays machine-clean. A final `{"type":"cli:exit",...}` line marks the end. |
| `--state-log <path>` | Appends one JSON-line record per state mutation (`{ tick, action, before, after, event? }`). Used by the agent-graded harness below. (Phase 26) |
| `--fixture <id\|path.json\|list>` | Boots the store from a declarative **state fixture** instead of the blank L1 character — a registry id (`--fixture list` prints them) or a path to a JSON fixture document. A fixture's `arrive` sets `--resolve-start`. See `docs/state-fixtures.md` at the monorepo root. (2026-09-07) |

Examples:

```bash
npm run game -- --script replay.json --json-events
echo '{"presetId":"apprentice"}' | npm run game -- --stdin --json-events
npm run game -- --script walkthrough.json --json-events --state-log run.jsonl
```

`--script` and `--stdin` are mutually exclusive; if both are passed, `--script` wins.

### State fixtures (2026-09-07)

`src/Game/fixtures` compiles a small declarative document (preset, map,
node, flags, seed, …) into a current-version `GameState` through the
engine's own builders. The committed registry (`STATE_FIXTURES`) is shared
with the mobile app (`?fixture=<id>` / `__AXM_FIXTURE__`) and its Jest +
Playwright harnesses, so one fixture proves a feature on every surface.

```bash
npm run game -- --fixture sage-fv-boss-gate --route fv-24 --auto-combat --json-events
npm run game -- --fixture ./my-fixture.json --route-audit fishing-village
```

Full guide: [`../docs/state-fixtures.md`](../docs/state-fixtures.md).

### Agent-graded e2e (Phase 26)

`automation/agent-e2e.mjs` runs a scripted walkthrough against the CLI, captures the state log + event stream + stderr, and asks the Claude API to decide whether the test goal was achieved. Useful when the UI isn't built yet and you want to verify a CLI surface end-to-end.

```bash
ANTHROPIC_API_KEY=sk-ant-... \
npm run agent-e2e -- automation/scripts/walkthroughs/character-sheet.json \
                     automation/scripts/walkthroughs/character-sheet.goal.md
```

The harness exits 0 on `pass`, 1 on `fail`. The default grading model is `claude-sonnet-4-6`; override with `AGENT_MODEL`. This layer is deliberately non-hermetic — it phones the Anthropic API. The hermetic vitest suite stays in `src/**/e2e/*.engine.test.ts` and never makes network calls.

Each walkthrough under `automation/scripts/walkthroughs/` has a paired `*.goal.md` describing what success looks like in human terms.

## Project layout

```
src/
  index.ts                 # public barrel
  Character/               # createCharacter + Character types
  Combat/                  # advantage, stats, dice, damage, health, effects, resist, reducer
  Effects/                 # applyEffect, Tier 1 stance effects, library lookup
  Enemy/                   # createEnemy + AI logic + library
  Game/                    # store + persistence + constants + actions + reducer
  Items/                   # inventory reducers + item types
  Cards/                   # card engine + library (the former Skills module; Spec 04 / 04b)
  World/                   # world state, reducers, map and quest libraries
  NPCs/                    # NPC types
  Utils/                   # math, dice, stat derivation, type guards
  CLI/                     # interactive CLIs (not exported by the package)
docs/                      # design notes per system
docs/references/           # source material (Mörk Borg)
specs/                     # implementation specs (numbered 01–35, with story/world/character subdirs from Phase 22)
content/                   # author's notebook: characters / locations / story (not loaded by engine)
../plan/                   # build plan, phase briefs, AUDIT.md, CRITIQUE.md, PHASE_CANDIDATES.md (monorepo root)
automation/                # standalone walkthrough script + replay fixtures
```

## Documentation

- [`docs/narrative/STYLE_CONSTITUTION.md`](./docs/narrative/STYLE_CONSTITUTION.md) — narrative constitution, with linked voice registers, lexicon, anti-imitation safeguards, evaluation rubric, and encounter pilot
- [`../plan/steps/01_build_plan.md`](../plan/steps/01_build_plan.md) — phased development plan with progress tracking
- [`docs/source-of-truth-hierarchy.md`](./docs/source-of-truth-hierarchy.md) — Nexus hierarchy for resolving T decisions, CDRs/ADRs, central ledger, build plans, candidates, critique/audit, and reports
- [`../plan/AUDIT.md`](../plan/AUDIT.md) — code audit and quality findings (drained by `/iterate`)
- [`../plan/CRITIQUE.md`](../plan/CRITIQUE.md) — architecture / quality findings filed by `/critique`
- [`../plan/PHASE_CANDIDATES.md`](../plan/PHASE_CANDIDATES.md) — open design and intent questions (with [`../plan/AUDIT.md`](../plan/AUDIT.md))
- [`braindump/BRAINDUMP.md`](./braindump/BRAINDUMP.md) — unorganised idea backlog
- [`docs/testing.md`](./docs/testing.md) — **hermetic e2e testing standard (required for every implementation)**
- [`docs/playtest.md`](./docs/playtest.md) — Hazard-Pattern Combat playtest reference: stage profiles, sim-policy roster, deck-selection grammar, sandbox card workflow, CLI cookbook
- [`docs/hazard-minigame.md`](./docs/hazard-minigame.md) — accepted v0 doctrine for the Mage Knight-like Hazard minigame: route choice, 4 dice, 5-card hand, card/enchantment lifecycle, `O - X` scoring, 30 action cards (Common/Uncommon/Rare), and 15 hazard cards
- [`docs/hazard-minigame-api.md`](./docs/hazard-minigame-api.md) — Hazard minigame package-consumer guide: public exports, legal state-machine sequence, mobile presenter boundary, and v0 caveats
- [`docs/hazard-minigame-prd.md`](./docs/hazard-minigame-prd.md) — Hazard minigame PRD: user stories, functional requirements, and success metrics
- [`docs/hazard-minigame-tdd.md`](./docs/hazard-minigame-tdd.md) — Hazard minigame TDD: module layout, types, state machine, engine functions, and integration points
- [`docs/hazard-minigame-bdd.md`](./docs/hazard-minigame-bdd.md) — Hazard minigame BDD: Gherkin scenarios mapping directly to hermetic e2e test cases
- [`automation/playtest/BALANCE_LEDGER.md`](./automation/playtest/BALANCE_LEDGER.md) — Phase 107 marker ledger and final sound-mechanics summary stats
- [`specs/`](./specs) — implementation specs (`00-how-to-use-specs.md` is the template; `story/` / `world/` / `characters/` hold the Phase 22 narrative specs)
- [`docs/`](./docs) — per-system references (combat, effects, character, world, etc.)
- [`docs/api.md`](./docs/api.md) — Public API reference (stability levels + RN integration recipe)
- [`docs/references/`](./docs/references) — source material (Mörk Borg; fallacies/paradoxes/pantheon archived 2026-09-25)

## Scripts

| Script                  | What it does                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `npm run build`         | Type-check and compile to `dist/`                                                                     |
| `npm run type-check`    | Type-check only                                                                                       |
| `npm test`              | Run the vitest suite                                                                                  |
| `npm run test:watch`    | Vitest in watch mode                                                                                  |
| `npm run lint`          | Run ESLint                                                                                            |
| `npm run check`         | Lint + type-check                                                                                     |
| **`npm run verify`**    | **Hard gate** — `type-check && type-check:tests && type-check:cli && lint && test && build` chained; runs before every commit |
| **`npm run deploy:check`** | **Hard gate** — lives at the monorepo ROOT (run `npm run deploy:check` from the repo root, not this package); runs after every push |
| `npm run verify:agent`  | Agent-friendly verify report (Phase 39 + 40); writes `automation/last-verify-report.json` + markdown summary on stdout |
| `npm run game`          | Interactive demo CLI (tabbed loop)                                                                    |
