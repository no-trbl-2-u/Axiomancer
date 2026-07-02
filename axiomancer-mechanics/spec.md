# Spec — axiomancer-mechanics

## Product

`axiomancer-mechanics` is a TypeScript game-engine library for a turn-based
RPG with philosophical and logical-fallacy themes. It is consumed as an npm
package by clients (React Native app, test CLIs, future web UI). All public
logic is exposed through a single barrel at `src/index.ts`.

The engine covers: character creation and stat derivation, turn-based combat
with a Heart/Body/Mind system, stance-and-action-driven effect procs (Tiers
1–3), skills, equipment (weapons/armour/accessories with modifiers), items
and consumables, enemy AI, world map navigation and quest management, and an
event-observable game loop.

## Audience

- **Primary consumer:** the Axiomancer React Native app (separate repo,
  separate team — currently the same developer).
- **Secondary consumer:** the in-repo demo CLI (`src/CLI/game.cli.ts`,
  invoked via `npm run game`) used for hands-on testing during
  development. Supports scripted / JSON-event / stdin-driven modes
  via the Phase 20 flags (`--script`, `--json-events`, `--stdin`)
  for external agents.
- **Tertiary:** future potential open-sourcing as an indie-RPG engine library.

## V1 scope (in-scope)

The shipped library will expose a complete, self-contained game engine that
a React Native UI can wrap without pulling in any additional game-logic:

1. Character creation, stat derivation, non-combat stats.
2. Turn-based combat: advantage, attack/defense stats, damage, healing,
   effect ticks, stance-action mechanics.
3. Tier 1–3 status effects: DoTs, stat mods, action restrictions, procs.
4. Skills library (12 early-game skills, typed, integrated with combat).
5. Equipment engine: stat-mod aggregation, set bonuses, rarity.
6. Character progression: XP, levelling, skill learning, stat gains.
7. Enemy library and AI (random, scripted, conditional logic).
8. World map: nodes, continents, hazards, dialogue, quests.
9. Full game loop (`gameReducer` / Zustand store) with save/load migration.
10. Moral/difficulty meter tied to player choices.
11. RNG seeding for deterministic tests.
12. Package architecture: clean `src/index.ts` barrel, event surface for UI
    consumers, documented React Native adapter interface.

## 6-month horizon (queued but not blocking v1)

- Story content: named NPCs with moral dialogue trees. *(Partial —
  Spec 14 + Phase 42-46/58 shipped the philosophical-alignment cube
  + alignment-gated dialogue; Phase 63 added reactive observers.
  More named NPCs still queued.)*
- Second+ enemy class families.
- ~~Additional skill tiers (Tier 2+).~~ **Shipped — Tier 2 carries
  8 skills (Phase 66 added 5 to the original 3); Tier 3 carries 7
  (Phase 44 added 4 fallacies-as-spells to the original 3). Total
  shipped library: 21 skills across all three tiers.** See
  `specs/04b-skills-library-and-e2e.md` for the canonical inventory.
- Additional world content (biomes, continent 2+). *(Partial — Phase
  65 expanded the fishing-village starting map from 10 → 25 nodes
  with three sub-areas. Continent 2 still a candidate.)*
- ~~Published npm release.~~ **Shipped 2026-05-08 (`0.2.0`).** First
  release under the autonomous-loop era was `0.10.0` (2026-05-19);
  current is `0.10.3` (2026-05-20). See `CHANGELOG.md` + `RELEASING.md`
  for the per-tag history and the manual publish flow.
- ~~Mobile aftermath + codex surfaces.~~ **Shipped across Phases
  71/72/73 (closes GH#65).** Per-foe narrative prose
  (`finalBlowLines` / `pactLines` / `causeLines` on Enemy — Phase 71);
  run-loop semantics (`store.resetRun({ keepCharacter })` + required
  `GameState.runId` + `STARTING_REGION` + `GAME_STATE_VERSION` bumped
  5 → 6 with `migrateV5toV6` — Phase 72); Codex / journal-entry
  surface (`GameState.codex: CodexState` slice + per-foe
  `Enemy.journalEntry?: CodexEntry` + `store.unlockCodexEntry` +
  auto-firing wire on friendship outcomes + `GAME_STATE_VERSION`
  bumped 6 → 7 with `migrateV6toV7` — Phase 73). Mobile consumer
  callsite cleanup (drop `derive*Phrase` fallback helpers; replace
  BEGIN AGAIN full-heal band-aid; mount NEW ENTRY card) is
  post-engine-release and lives in `axiomancer-mobile`.

## Stack

TypeScript strict, Vitest, tsc + tsc-alias, ESLint, npm.
No database, no server, no web UI.

## Contracts (public API)

The barrel at `src/index.ts` is the contract surface. Groups:

| Group | Key exports |
|---|---|
| Character | `createCharacter`, `allocateStatPoint`, `previewStatAllocation`, `computeEquipDelta`, `levelLadderPresets`, `Character`, `BaseStats`, `DerivedStats`, `CharacterPreset`, `EquipDelta` |
| Enemy | `createEnemy`, `Enemy`, `EnemyLogic`, `decideEnemyAction`, `enemyStatBudget`, `randomLogic`, `rollLoot`, `FriendshipReward`, `BefriendabilityConfig`; named logic constructors — `aggressiveLogic`, `defensiveLogic`, `balancedLogic`, `strategicLogic`, `bossLogic`; stance helpers — `counterStanceOf`, `weakestStanceOf`; loot/XP helpers — `rollLootMany`, `DEFAULT_XP_BY_DIFFICULTY` |
| Combat | `determineAdvantage`, `getBaseStat`, `getAttackStat`, `getDefenseStat`, `getSaveStat`, `applyDamage`, `heal`, `healCharacter`, `isAlive`, `isDefeated`, `getHealthPercentage`, `getStudyMarkIntensity`, `getActiveRollModifier`, `getThornsReflect`, `updateEffectDuration`, `tickAllEffects`, `removeRandomBuff`, `extendRandomBuffDuration`, `applyRegen`, `getActiveEffectModifiers`, `getEffectiveStats`, `canAct`, `resolveEffectApplication`, `calculateDamageResistance`, `getSkillDamageType`, `determineEnemyAction`, `isCombatOngoing`, `determineCombatEnd`, `calculateEnemyStatMultiplier`, `applyMoralMeterScaling`, `Stance`, `Action`, `Advantage`, `CritStyle`, `CombatAction`, `CombatPhase`, `CombatState`, `Combatant`, `BattleLogEntry`, `AggregatedEffectModifiers`, `EffectiveStats`, `DamageType`, `getEffectsResolutionOutcome`, `resolveCombatRound`; Spec 25 Hazard-Pattern Combat engine (HP-only, 2026-06-22) — `initializeCombatEncounter`, `playCombatCard`, `resolveCombatPhase`, `processBetweenPhases`, `simulateHazardPatternCombat`, `CombatEncounterState`, `CombatCard` (`CombatPressureTracks` REMOVED); defense cards / GUARD mechanic — `GOLD_CARD_IDS`, `isGoldCard`, `CardEffectKind`; synthetic card ids — `SYNTHETIC_CARD_IDS` (readonly string[] of built-in non-deck cards, currently `['card-retreat']`), `isSyntheticCard`; Spec 26/26b depth layer — stance draft + hidden-stance read (`startTurn`, `draftStanceDie`, `endTurn`, `resolveRead`, `chooseDraft`, `discardCombatCard`, `getDraftedDie`, `isPhaseStanceRevealed`, `revealedCurrentStance`, `cardReadPreview`, `projectCardImpact`), Conviction-funded Signature Skills (`playSignatureSkill`, `getSignatureSkill`, `SIGNATURE_SKILLS`, `SIGNATURE_SKILL_LIST`, `SIGNATURE_KITS`, `signaturesForArchetype`, `playerArchetype`), deckbuilder card rewards (`rollCombatCardRewards`, `addRewardCard`, `COMBAT_REWARD_POOL`, `unlockSkillViaDilemma`, `STARTING_SKILL_ID`, `STARTING_SKILL_IDS`), intent classification (`deriveIntentType`), threat-sequence read API (`getThreatSequence`, `generateDefaultThreatSequence`, `AUTHORED_THREAT_ENEMY_IDS`), `SignatureSkill`, `SignatureSkillId`, `SignatureSkillKind`, `CombatReadResult`, `CombatIntentType`, `PlayerArchetype`; PR #190 (2026-06-23) — partial Press Fate re-roll dice helpers (`rerollSpentDice`, `hasRerollableDice`, `dieIsRerollable`) + preset deck system (`COMBAT_DECK_PRESETS`, `COMBAT_DECK_PRESET_ORDER`, `listDeckPresets`, `getDeckPreset`, `buildPresetDeck`, `CombatDeckPreset`, `CombatDeckFocus`); die-cost helpers — `resolveCardDieCost` (returns `CardDieCost { cost, advantage }` for a card stance vs. enemy phase stance, RPS-based), `cardDieCostPreview` (read-only preview variant), `CardDieCost` (named type export — importable as `import type { CardDieCost } from 'axiomancer-mechanics'`); Spec 25 engine/deck-build helpers — `COMBAT_DICE_COUNT`, `COMBAT_HAND_SIZE`, `COMBAT_DIE_FACES` (tuning constants), `rollCombatDice` (rolls the initial die pool), `combatDieCanPower` (die-affordance check), `refreshOneDie` (refresh a single spent die), `toCombatCard` (skill → CombatCard converter), `projectDeck` (hand-projection read), `classifyVerbClass` (card intent classifier), `buildCombatDeck` (deck assembly); Spec 25 encounter/UI helpers — `rollEncounterDice` (rolls colored mana dice at phase start), `resolveThreatPhase` (resolves enemy threat phase — Clear/Overwhelmed ledger), `selectEncounterMercyChoice` (opens Befriend mercy choice), `getCard` / `handCards` / `availableDice` (read-only UI previews for hand and die affordances), `buildCombatSummary` (end-of-fight `CombatSummary` with per-effect attribution rows), `CombatSummary` / `CombatAttributionRow` / `LandedEffect` (named type exports for attribution view); soft-control / stat-debuff threat tunables — `THREAT_WEAKEN_PER_ROLL` (fraction of incoming hit reduced per point of enemy roll penalty, default 0.06), `THREAT_DENY_AT` (cumulative roll penalty at which the enemy turn is fully denied, default 8), `THREAT_WEAKEN_FLOOR` (minimum damage multiplier when weakened but not denied, default 0.4); used by `resolveThreatPhase`; consumers can read to display soft-control thresholds in the UI; 0.34.0 status-depth epic — HP-model selectors + tunable scalars: `getDamageTakenMultiplier` (incoming-damage multiplier for a combatant given active vulnerability effects), `getPendingDotTotal` (sums pending DoT across all active effects — basis for AMPLIFY burst), `consumeDotEffects` (removes DoT effects and returns the total consumed — used by RUPTURE), `getDistinctDebuffCount` (counts distinct active debuff types — drives COMPOUND), `getDistinctControlCount` (counts distinct active control effects — drives DISRUPT); scalars: `VULNERABLE_MAX_MULT` (damage multiplier cap under Vulnerable), `RUPTURE_BURST_CAP` (max HP burst when Rupture consumes DoTs), `COMPOUND_COUNT_CAP` (cap on distinct debuffs counted by COMPOUND), `DISRUPT_DENY_AT` (debuff-count threshold at which enemy turn is denied), `EXECUTE_DAMAGE_FRACTION` (fraction of enemy max HP dealt by Execute); honesty-preview helpers: `getEnemyIncomingDamageMultiplier` (combined incoming-damage multiplier for mobile to show hit preview), `getDisruptMeter` (returns current vs. threshold debuff count for UI progress display), `projectRupture` (preview burst from consuming current DoTs), `isExecuteReady` (whether enemy HP ≤ Execute threshold), `projectExecute` (preview Execute damage), `projectSiphonHeal` (preview Siphon heal amount); DoT amplification helpers: `getDotAmplificationByEffect` (per-effect amplification from active combos), `getActiveDotTotal` (total active DoT damage per round), `getActiveDotAmplifications` (list of active amplification entries for UI); types: `PendingDotEntry`, `ActiveDotEntry`, `ActiveDotAmplification` (selector result types for the above helpers); 0.35.0 depth-epic tunables — `READ_STATUS_MULT` (`Record<CombatReadResult, number>` — stance-read scales landed status magnitude: advantage 1.34, neutral/none 1.0, disadvantage 0.75; gentler than `READ_DAMAGE_MULT` so reads add texture without swinging fights; tuned by `/combat-tuning`), `THREAT_ESCALATION_PER_ROUND` (per-round escalation step applied to incoming threat damage after grace rounds, default 0.22), `THREAT_ESCALATION_GRACE` (rounds of grace before the clock starts — a fast kill is unpunished, default 1), `THREAT_ESCALATION_MAX` (cap on the escalation multiplier, default 2.0), `THREAT_ESCALATION_BOSS_MULT` (boss/unique enemy escalation rate multiplier applied to `THREAT_ESCALATION_PER_ROUND`, default 1.6 — makes dragging boss fights more lethal); used by `resolveCombatPhase`; consumers can read to surface the escalation clock and boss-tier urgency in the UI; Phase 169 curated loadout codec — `COMBAT_LOADOUT_FLAG_PREFIX`, `COMBAT_LOADOUT_MAX`, `getCombatLoadout(flags)`, `decodeCombatLoadout(flags)`, `addToLoadout(flags, cardId)`, `removeFromLoadout(flags, cardId)` (loadout persisted in `GameState.flags`; `buildCombatDeck(player, flags?)` uses the curated list when present, falls back to `knownSkills`; `createNewGameState()` seeds `STARTING_SKILL_IDS`); synergy live-check — `isCombatSynergySatisfied(card, enemyEffects)` (pure helper — true when card's target-side `CardSynergy.predicate` is satisfied by enemy `ActiveEffect[]`; false for caster-side predicates and synthetic cards); Phase 167/168 sim metrics + AMPLIFY + Conclusion — `CombatSimPolicyId` (type: `'greedy' | 'blind'` — policy passed to `simulateHazardPatternCombat`); five extended `CombatSimStats` fields: `dotHpFraction` (fraction of enemy HP lost to DoT — doctrine witness), `strikeFraction` (fraction lost to direct strikes), `mechanicBurstFraction` (fraction lost to mechanic bursts — rupture/execute/compound/conclude), `guardMitigatedFraction` (guard availability ratio), `avgActiveEffectsPerPhase` (mean active effects on enemy per threat phase — status-board density witness); AMPLIFY card mechanic constants: `AMPLIFY_DEFAULT_MULTIPLIER` (default burst multiplier 1.5 — reads pending DoT × multiplier without consuming DoT), `AMPLIFY_BURST_CAP` (max HP burst per play, default 60); Conclusion sig constant: `CONCLUDE_DMG_PER_STACK` (damage per stack of enemy effects for the BODY Conclusion finisher, default 2) |
| Effects | `applyEffect`, `applyTier1CombatEffect`, `lookupEffect`, `Effect`, `ActiveEffect`, `EffectInteraction`, `evaluateInteractions`; Phase 142 interaction engine — `checkInteractionTrigger`, `applyInteractionResult`, `EFFECT_INTERACTIONS`, `getInteractionsForEffect`, `getAllInteractionIds`, `getInteractionById`, `validateInteractions`, `INTERACTION_AMPLIFICATION`, `INTERACTION_PRIORITY`; Phase 142 / 125 resolution constants — `STATUS_RESOLUTION_DEBUFF_THRESHOLD`, `STATUS_RESOLUTION_DOT_THRESHOLD`, `STATUS_RESOLUTION_DOT_MAX_ROUNDS`, `STATUS_ENGAGEMENT_FLOOR_PERCENT` |
| Items | `addItem`, `removeItem`, `useConsumable`, `Item`, `Equipment`, `dropItem`, `dropItemWithAffixes`, `composeItemName`, `getActiveSetBonuses`, `ItemSet`, `previewTemplateAtRarity`, `equipmentFromTemplate`, `generateRarityDrop`, `firstEquippedPerSlot`; Phase 154 loot-gen helpers — `dropItemAtRarity` (single item at explicit rarity), `countNamedAffixes` (prefix+suffix count on an Equipment), `hasBakedAffix` (curated variant guard), `AFFIXES_PER_RARITY` (target prefix+suffix count per rarity tier) |
| Skills | `canUseSkill`, `executeSkill`, `learnSkill`, `carryPhilosophicalResources`, `evaluateExtendedSynergyPredicate`; canonical card-library types (0.35.0 de-conflation) — `Card` (primary card type), `cardLibrary` (id→Card map), `getCardById(id)` (lookup helper), `CardCategory`, `CardTier`, `CardTarget`, `CardSynergy`, `CardLookup`, `CardEvent`, `CardResolution`, `StatType`, `CardSpecialMechanic` (union of card mechanic verbs: `'amplify' | 'rupture' | 'compound' | 'siphon' | 'barrier' | 'riposte' | 'execute'`) (canonical names; `Skill` / `skillLibrary` / `getSkillById` / `SkillCategory` / `SkillEvent` / `SkillSpecialMechanic` etc. are `@deprecated` aliases kept for `axiomancer-mobile` migration — prefer `Card`-prefixed names for new consumers); Phase 142 extended synergy predicate helpers — `checkSinglePredicate`, `checkAnyCountPredicate`, `checkAllRequiredPredicate`, `checkBuffDebuffCombo`, `checkTotalIntensityPredicate`, `ExtendedSynergyPredicate`; resource helpers — `generateBasicActionResources` (adds stance tokens per generation table given stance + outcome), `generatePhilosophicalResource` (adds 1 Fallacy or Paradox token after skill use), `spendResources` (deducts resource cost; guard with `canUseSkill` first), `calculateSkillDamage` (applies the damage formula for a skill + advantage) |
| Game | `createGameStore`, `GameState`, `gameReducer`, `createEventEmitter`, `nullAdapter`, `CodexEntry`, `RESOURCE_CARRY`, `DEFENSE_MULTIPLIERS`, `PASSIVE_DEFENSE_MULTIPLIER`, `MAX_EFFECT_INTENSITY`, `MAX_EFFECT_DURATION`, `FRIENDSHIP_COUNTER_MAX` |
| World | `createStartingWorld`, `WorldState`, `moveToNode`, `resolveMapEvent`, `getNodeEventPool`, `getNodeEventKinds`, `getNodePrimaryEventKind`, `runMinigameHarness`, `getShadowedNodeOverrideKeys`, `MapDefinition`, `NarrationPayload` |
| Hazard | `*` (wildcard export from `./World/Hazard`; key helpers: `dieCanPower(dieKind, cardKind)` / `dieCanPowerCard(dieKind, cardDef)` — boolean predicates used by combat to check die affordance against Hazard color contracts; `hazardCardPowerColors(def)` — returns the set of die colors that can power a given card (sibling to `dieCanPower`/`dieCanPowerCard`); `confirmHazardForetell(session, orderedIds)` — resolves the foretell-pending state after a FORETELL card play, restoring captured dice and optionally applying SCOUR discard; engagement-layer state-machine: `generateSubquestDraft(subquests, rng, count)` — drafts subquest candidates before a session, `chooseSubquest(draft, id)` — selects one candidate from the draft (returns updated HazardSubquestDraft), `selectSubquestFromDraft(session, id)` — applies chosen subquest to a live HazardSessionState; subquest query helpers: `getHazardSubquestDef(id)` — looks up a subquest definition by id from HAZARD_SUBQUESTS, `hazardSubquestStatus(session, subquest)` — returns the current objective completion status for a live session, `hazardSubquestResults(session, final)` — returns the subquest outcome results for display) |
| Gathering | `*` (wildcard export from `./World/Gathering`) |
| QuestBoard | `*` (wildcard export from `./World/QuestBoard`) |
| Rest | `*` (wildcard export from `./World/Rest`) |
| LootCache | `*` (wildcard export from `./World/LootCache`) |
| Philosophy | `getAlignmentCell`, `applyAlignmentDelta`, `PhilosophicalAlignment`, `bucketAxis`, `philosophicalAlignmentLibrary` |
| Faction | `FACTION_REPUTATION_MIN`, `FACTION_REPUTATION_MAX`, `DEFAULT_FACTION_REPUTATION`, `clampFactionReputation`, `createDefaultFactionReputations`, `applyFactionReputationDeltas`, `getFactionReputation`, `factionLibrary`, `getFactionInfo`, `getAllFactions`, `FactionReputation`, `FactionReputations`, `FactionReputationDelta`, `FactionInfo` |
| NPCs | `getDialogueNode`, `visibleChoices`, `isLeafNode`, `NPC`, `DialogueMap`, `DialogueTree`, `DialogueNode`, `DialogueChoice`, `DialogueContext`, `AlignmentGate` |
| Playtest | `runPlaytestScenario`, `aggregateMetrics`, `selectPolicyAction`, `renderPlaytestMarkdown`, `earlyGameFixture`, `earlyGameWispFixture`, `endgameFixture`, `endgameDisagreementFixture`, `PlaytestScenario`, `PlaytestReport`, `PlaytestMetrics`, `PlaytestRunSummary`, `PlaytestPolicy`, `PlaytestOutcome`, `PlaytestPolicySummary` |
| Events | `EnginePayload`, `TypedGameEvent`, `isCombatStartedEvent`, `isWorldMovedEvent`, type guards |
| Utils | `clamp`, `randomInt`, `deepClone`, `average`, `sum`, `max`, `min`, `inRange`, `capitalize`, `formatPercent`, `createDie`, `createDieRoll`, `determineRollAdvantageModifier`, `deriveStats`, `deriveNonCombatStats`, `calculateMaxHealth`, `setRng`, `getRng`, `setSeed`, `isCharacter`, `isEnemy`, `isCombatActive`, `Rng`, `Image` |

Breaking changes to these exports require a semver major. The CLIs
(`src/CLI/`) are **not** part of the public API and are excluded from the
build.

## Non-goals (explicit)

- Web or React Native UI components — not in this repo.
- Database or server — none.
- Network play or cloud sync.
- Multiple save slots (deferred).
- **v1.0.0 stable-API stamp before the spec contracts settle.** Pre-1.0
  minor bumps may carry breaking public-API changes (deprecation
  lifecycle per `RELEASING.md`); `1.0.0` graduates the contract surface
  to semver-strict only once the spec coverage matches the shipped
  engine. Until then, downstream consumers (e.g. `axiomancer-mobile`)
  pin exact versions and bump deliberately per release.
