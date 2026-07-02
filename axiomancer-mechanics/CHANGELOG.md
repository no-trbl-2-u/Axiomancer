# Changelog

All notable changes to `axiomancer-mechanics` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Pre-1.0.0 status: minor bumps may carry breaking public-API changes
(deprecation lifecycle per `RELEASING.md`). The `package.json` `exports`
map exposes `.` (top-level barrel) and `./node` (Node.js adapter); no
deep imports are part of the supported surface.

## [Unreleased]

## [0.37.0] — 2026-06-30

Finishes the legacy turn-based combat removal that 0.36.0 began: decouples the
game store / `GameState` from combat, prunes the remaining legacy scaffolding
(the Pressure-Track resolution, the combat-end predicates, the turn-based enemy
AI), and rips the last legacy references out of the CLI. Hazard-Pattern combat
is the only combat system, and it now owns the encounter end-to-end — the store
merely stages the encounter and grants rewards on the reported outcome. Pre-1.0
minor bump carrying breaking public-API removals.

### Changed

- **Combat decoupled from the store** — `GameState` no longer carries a
  `combat` field. The Hazard-Pattern engine drives the fight outside the store;
  `START_COMBAT` only stages `currentEncounter` (still applying moral-meter and
  region-mercy "open-minded" scaling to the lead enemy), and `END_COMBAT`
  consumes `currentEncounter` to grant loot / XP / quest progress / friendship
  rewards.
- **`store.endCombat(outcome, finalPlayer?)`** — now takes the outcome
  (`'victory' | 'defeat' | 'friendship' | 'flee'`) reported by the combat
  driver and an optional post-fight player snapshot, instead of deriving the
  outcome from a legacy combat snapshot. The returned `CombatEndReport` and all
  reward semantics are unchanged.
- **`selectIsInCombat` / `isCombatActive`** now narrow on `currentEncounter`.

### Removed

- **Store combat wiring** — the `GameState.combat` field, `store.updateCombat`,
  the `combat:round` event (`TypedCombatRoundEvent`, `isCombatRoundEvent`), and
  the `selectCombat` / `selectCombatState` selectors.
- **Legacy combat-end model** — `determineCombatEnd`, `isCombatOngoing`,
  `isFriendshipEligible`, `getEffectsResolutionOutcome`, `isValidCombatAction`,
  the `effect-resolution` module (the removed two-Pressure-Track resolution),
  and the now-dead `STATUS_RESOLUTION_*` / `STATUS_ENGAGEMENT_FLOOR_PERCENT` /
  `INTERACTION_PRIORITY` constants.
- **Legacy turn-based enemy AI** — `decideEnemyAction` / `determineEnemyAction`
  and the `randomLogic` / `aggressiveLogic` / `defensiveLogic` / `balancedLogic`
  / `strategicLogic` / `bossLogic` / `counterStanceOf` / `weakestStanceOf`
  strategy exports (`src/Enemy/enemy.logic.ts`). Enemies still declare a
  `logic` / `EnemyLogic` tag as data; the Hazard engine drives them via authored
  threat sequences.
- **Legacy combat-reducer driver verbs** — `setPhase`, `setPlayerStance`,
  `setPlayerAction`, `appendLog`, the legacy `endCombat`, and the legacy
  `selectMercyChoice`. The Hazard `selectEncounterMercyChoice` is unaffected.
- **CLI** — the residual legacy-combat references in `game.cli.ts` (the staged
  `combat` save field, the unused `canFight` tab gate). `combat.cli.ts` was
  already solely the Hazard-Pattern driver.

### Retained (shared infrastructure, not legacy)

- `CombatState` and its member types stay — the Hazard-Pattern engine builds a
  `CombatState` shim to drive the unchanged `executeSkill`. `initializeCombat`
  remains as the shared `CombatState` constructor and `incrementFriendship` as
  the Befriend bump the skill engine applies. The effects / skill / equipment
  engines and `INTERACTION_AMPLIFICATION` are untouched.

## [0.36.0] — 2026-06-30

Removes the legacy turn-based combat system and its balance tooling, de-tokenizes
the card resource model, and cuts the cross-combat resource carry. Pre-1.0 minor
bump carrying breaking public-API removals (the `Skill*` deprecation aliases from
0.35.x remain).

### Removed

- **Legacy turn-based combat** — `resolveCombatRound`, `src/Combat/phases/`, the
  `RoundEvent` union and `BasicActionOutcome` type, the `COMBAT_ROUND` reducer
  path, and the CLI legacy-combat routes. Hazard-Pattern combat is now the sole
  combat system.
- **Legacy balance harness** — the entire `src/Tuning/` and `src/Playtest/`
  modules (the `/legacy-combat-tuning` STRATEGIST harness) and the `tune` script.
  The live hazard `/combat-tuning` (`simulateHazardPatternCombat` / `combat-sim`)
  is unaffected.
- **De-tokenized cards** — the per-card `resourceCost` gate was a net-zero,
  non-gating ritual in hazard combat. Removed the `resourceCost` field, the
  `ResourceCost` type, `grantStanceCost`, `canUseSkill`, `spendResources`, and the
  `resources-spent` event. The live economy is untouched: unpicked dice →
  Conviction, card execute → +1 philosophical (`generatePhilosophicalResource`),
  Signatures spend Conviction.
- **Cross-combat resource carry** — removed `carryPhilosophicalResources`, the
  `Character.carriedResources` field, and the `END_COMBAT` carry writer
  (deliberate design choice). Within-combat resource banking is unchanged.
- `bypass_defense` (a no-op special mechanic) and the card-level `sourcedFromCell`
  authoring field (the identically-named `Effect` field is retained).

### Changed

- `strip_random_buff` now surfaces a `buff-stripped` `CombatEvent` on the live
  hazard path so the strip is visible to clients (previously dropped silently).

Removed public exports: `ResourceCost`, `canUseSkill`, `spendResources`,
`carryPhilosophicalResources`, `RoundEvent`, `BasicActionOutcome`, and the entire
`Tuning` / `Playtest` surface.

## [0.35.1] — 2026-06-29

### Deprecated

- Completed the `@deprecated` backward-compat alias set for the cards/skills
  de-conflation. In addition to `skillLibrary`/`getSkillById`/`Skill`, the full
  renamed public type family is now re-exported under its legacy names:
  `SkillCategory`, `SkillsStatType`, `SkillTier`, `SkillTarget`,
  `SkillLearningRequirement`, `SkillCombatEffects`, `SkillSpecialMechanic`,
  `SkillSynergy`, `SkillLookup`, `SkillEvent`, `SkillResolution` (aliases of the
  `Card*` / `StatType` names). Restores the pre-0.35.0 public surface so
  consumers (axiomancer-mobile) compile unchanged. Migrate to the `Card*` names.

## [0.35.0] — 2026-06-29

Finalizes the 0.35.0 line (combat depth, previously `0.35.0-beta.0`) and lands a
cards-vs-skills naming de-conflation. Non-breaking: legacy public names remain as
`@deprecated` aliases.

### Changed

- **De-conflation — the card (combat action) data layer is renamed off the legacy
  "skill" naming.** Cards (the actions played in combat) were historically stored
  under a "skill" name; genuine Skills are the token-activated abilities (Second
  Wind, signatures) and are a separate concept. Renamed: `src/Skills/` →
  `src/Cards/`, `skill.library.ts` → `cards.library.ts`; type `Skill` → `Card`
  (and the `Skill*` type family → `Card*`: `CardCategory`, `CardTier`,
  `CardTarget`, `CardCombatEffects`, `CardSpecialMechanic`, `CardLearningRequirement`,
  `CardSynergy`, `CardLookup`, `CardEvent`, `CardResolution`); `skillLibrary` →
  `cardLibrary`; `getSkillById` → `getCardById`; `SkillsStatType` → `StatType`.
  The `SignatureSkill` family (genuine token abilities), `CombatResources`, and
  `ResourceCost` are intentionally unchanged.

### Deprecated

- `skillLibrary`, `getSkillById`, and the `Skill` type remain exported as
  `@deprecated` aliases of `cardLibrary` / `getCardById` / `Card` for backward
  compatibility. Migrate to the `card*` names; the aliases will be removed in a
  future minor.

(Combat-depth additions from `0.35.0-beta.0`, below, are carried forward into 0.35.0.)

## [0.35.0-beta.0] — 2026-06-29

Combat depth (prerelease, `combat-depth-epic`). Two on-vision levers that make the marquee decisions matter and combat genuinely loseable, without de-centering status (status engagement is unchanged in simulation).

### Added

- **THE READ NOW BITES STATUS.** The stance-read scales a landed DoT / control / debuff's magnitude (`READ_STATUS_MULT`, gentler than the strike's read at 1.34 / 1.0 / 0.75), so "read the stance, draft the right color" finally matters for the *status* play that is the heart of the game — not just the vestigial strike chip. Only the card's own contribution is scaled; prior stacks are preserved, and a neutral/none read is byte-identical.
- **THE CLOCK.** The enemy's telegraphed hit escalates each round past a grace window, capped (`THREAT_ESCALATION_PER_ROUND` 0.22 / `THREAT_ESCALATION_GRACE` 1 / `THREAT_ESCALATION_MAX` 2.0), so a drawn-out or over-cautious fight turns lethal — racing the foe down (DoT) or denying its turns (control) are the on-vision counters, and the threat ledger finally has teeth. Round ≤ grace is byte-identical (a fast clean kill is unpunished).
- Four new public exports (`READ_STATUS_MULT`, `THREAT_ESCALATION_PER_ROUND`, `THREAT_ESCALATION_GRACE`, `THREAT_ESCALATION_MAX`) so mobile can read the read-scaled status honestly and surface the clock.

Calibrated conservatively: the optimal witness bot still wins every tier (combat stays *fair*, not broken) while human-paced play feels real pressure. Sharpening the per-tier win bands to spec (boss 30–55%) is a `/combat-tuning` follow-up that hinges on the denial / kill-speed economy — the optimal bot kills in ~2–4 rounds and barely feels the clock. Additive-only; +4 tests; full suite (2197) green.

## [0.34.0] — 2026-06-28

Status-Depth: makes the status board the payoff, not just the setup. Ten keywords are now mechanically live in the HP combat engine and honestly readable by mobile — VULNERABLE (Breach marks a foe to take +50% from your hits), AMPLIFICATION (DoT Hemorrhage/Dissolution/Corrosive-Fire now report the HP that actually lands), RUPTURE (consume a foe's DoT and detonate the remaining total at once), COMPOUND (damage scaling with the number of distinct debuffs), DISRUPT (an additive control-deny path), plus THORNS, SIPHON, stacking BARRIER, one-shot RIPOSTE, and an EXECUTE finisher. Ships seven new build-around cards (Resonance Rupture, Mounting Contradictions, Breach, Brazen Rebuttal, Gabriel's Bulwark, Briar Riposte, Leeching Syllogism) and re-points Pyrrhic Victory as an execute, all draftable from the reward pool. Adds 24 additive public exports (HP-model selectors, projection helpers, five tunable scalars, three result types) for mobile to read combat honestly, widens the CombatEvent union with seven new variants, and lands 49 new tests. Status engagement stays central or rises in simulation (Breach drives it to ~70 percent); the pure-DoT doctrine baseline is byte-unchanged. Additive-only; no pressure vocabulary.

## [0.33.0] — 2026-06-27

Combat truthfulness: the HP engine now reads the enemy's roll penalty, so soft-control / stat debuffs finally weaken (and a committed variety denies) the enemy's telegraphed turn — ~24 previously inert effects now do what their cards promise.

### Added

- **Preset combat decks.** A roster of focused, ready-to-play decks — Erosion (DoT), Saturation (control), Bulwark (utility/defense + Befriend), Onslaught (damage), and Generalist (balanced) — each a curated card list with a single design focus and a built-in GUARD. `COMBAT_DECK_PRESETS`, `COMBAT_DECK_PRESET_ORDER`, `listDeckPresets`, `getDeckPreset`, `buildPresetDeck`; `CombatDeckPreset` / `CombatDeckFocus`. Feed `buildPresetDeck(id)` straight into `initializeCombatEncounter(player, enemy, deck)`.

### Changed

- **Soft control & stat debuffs now affect the enemy (de-inert).** `resolveThreatPhase` now reads the enemy's aggregated roll penalty: each point of negative roll modifier (confusion, fear, daze, slow, blind, accuracy/attack-down, …) weakens the enemy's telegraphed hit by `THREAT_WEAKEN_PER_ROLL`, and a committed VARIETY of soft-controls (cumulative penalty ≥ `THREAT_DENY_AT`) denies the turn outright. Previously the aggregators computed these mods but the HP engine never consulted them, so ~24 control/stat effects were inert. New exported tunables `THREAT_WEAKEN_PER_ROLL` / `THREAT_DENY_AT` / `THREAT_WEAKEN_FLOOR`. Hard control (stun/sleep/petrify — a guaranteed skipTurn) is unchanged, and an enemy carrying no roll penalty behaves exactly as before.
- **Press Fate is now a PARTIAL re-roll.** The `sig-press-the-point` (reroll) Signature re-rolls only the dice you have USED (spent/exhausted) plus any dead `x` faces, and LEAVES every still-usable die in play (previously it re-rolled BOTH dice, discarding good ones). A still-usable drafted die keeps its read; casting it with nothing to re-roll is a no-op that refunds the Conviction. `rerollSpentDice` / `hasRerollableDice` / `dieIsRerollable` (`combat.dice`).

- **Skills vs Cards terminology boundary enforced (Phase 166).** Source comments, doc-strings, and the test suite now consistently distinguish *skills* (always-available token-spending actions in `knownSkills`) from *cards* (Hazard-style deck/hand/reward objects). A `CombatCard` projected from a skill is a "projected card" or "skill-sourced card" — never a "skill". `CombatCard.skillId` is the accepted field for the backing skill id; `toCombatCard` is the accepted projection entry-point. A regression guard (`terminology-boundary.engine.test.ts`) asserts that banned conflation identifiers (`skillCard` / `skill_card` / `SkillCard`) are absent from the guarded Combat source files. No public API change; no new exports.

### Fixed

- **Overwhelming Argument (heart capstone Signature) now matches its text.** It applied `debuff_confusion` — which (until this release's de-inert) did nothing and never denied the enemy's turn despite the "it loses its turn" description. Re-pointed to `debuff_petrify` (a guaranteed skipTurn), so the marquee 8-Conviction play actually makes the enemy lose its turns.

## [0.32.0] — 2026-06-22

Combat content + cleanup: defense cards, a Gold rare tier, Press Fate, de-token-gated cards, the "pressure" purge, and a starting-map rebalance + narration encounters.

### Added

- **Defense cards (GUARD).** Brace for Impact / Suspend Judgment / Stoic Reserve grant GUARD — a one-shot shield that absorbs the next enemy threat hit (then resets). Brace is in the starting set (`STARTING_SKILL_IDS`); the rest drop from rewards.
- **Gold (rare) cards.** A new top rarity — Pyrrhic Victory / The Final Word / The Unmoved Mover: unpowered = utility, powered = a major status + damage. Rare-weighted in the reward roll. `CombatCard.rarity:'gold'`, `GOLD_CARD_IDS`/`isGoldCard`.
- **`narration` map-event kind** — a walkable monologue/dialogue node (no minigame) that reuses the dialogue tree and auto-consumes one-shot. `NarrationPayload`.

### Changed

- **Press Fate.** The `sig-press-the-point` Signature is now "Press Fate": a die REROLL (re-rolls the turn's dice for a fresh draft) for its Conviction cost.
- **Cards are no longer token-gated** — a combat card plays on its drafted die alone; the Fallacy/Paradox pre-bank gate is gone (Skills keep their costs; combat grants them).
- **Wild die read** — a Wild (gold) die adopts the powered card's stance for the hidden-stance read; on a Gold card the read is always advantage.
- **Starting-map rebalance** (fishing-village) — was ~15 encounters; now a balanced mix (8 encounter / 4 rest / 4 gather / 3 hazard / 3 loot-cache / 1 narration / 1 interaction), keeping exactly 1 quest + 1 boss.

### Removed

- **"Pressure" terminology** (the tracks were removed in the HP model): `combat.pressure.ts`→`combat.attribution.ts`; `READ_PRESSURE_MULT`→`READ_DAMAGE_MULT`, `COLOR_MATCH_PRESSURE_BONUS`→`COLOR_MATCH_DAMAGE_BONUS`, `effectPressure`→`effectImpact`, `projectCardPressure`→`projectCardImpact`, `CombatCard.track`→`.effectKind`, `bottomPressurePreview`→`bottomDamagePreview`; dead `pressure-updated`/`momentum-carried` events removed.

## [0.31.0] — 2026-06-22

Boss difficulty + the blind playtest witness.

### Added

- **`blind` sim policy** (`CombatSimPolicyId = 'greedy' | 'blind'`) — the witness
  bot drafts using ONLY player-visible info (the enemy stance is unknown until
  revealed via the read or a Scout) instead of peeking the hidden stance: a
  realistic-player proxy alongside the omniscient `greedy` bot. `chooseDraft` now
  accepts `enemyStance: Stance | null` (null ⇒ no advantage seek).
- **`npm run combat-sim`** CLI — quick win-rate playthroughs across the difficulty
  tiers (`--blind`, `--enemy=`, `--loadout=`, `--runs=`, `--seed=`).

### Changed

- **Boss threat +50%** (`DIFFICULTY_MULT` boss 1.25→1.5, unique 1.2→1.45) — bosses
  now hit meaningfully harder. (A precise ~80% win rate isn't reachable via this
  one lever: the boss fights are near-deterministic races, so the sim is bimodal
  ~100%/~10%; per-boss tuning or fight variance is the path to a smooth 80%.)
- Combat doctrine docs (`VISION.md`, `CLAUDE.md`) updated to the HP-only model.

## [0.30.0] — 2026-06-22

HP-only combat (Hazard-Pattern): the enemy's SOLE bar is now HP. Removed the two
abstract Pressure Tracks (DoT Erosion + Control Saturation), their per-phase
thresholds, and the Control-Saturation mercy. Combat is won by dropping the
enemy's HP to 0 — DoT erodes it (the engaging, efficient damage); the immediate
strike is the weak basic baseline. Control status now genuinely HINDERS the enemy
(it skips its telegraphed turn via `canAct`); the Befriend path still opens the
spare/exploit choice on a low-HP foe. The dice / hidden-read / Conviction /
Signature tactical layer is unchanged.

### Removed (public surface)

- Type `CombatPressureTracks`; functions `dotErosionReached`,
  `controlSaturationReached`, `momentumCarry`, `MOMENTUM_CAP`,
  `pressureForLanded`, `deriveGlobalThresholds`; constants `TOP_ACTION_PRESSURE`,
  `BEFRIEND_THRESHOLD_REDUCTION`.
- `CombatThreatPhase` no longer carries `dotPressureRequired` /
  `controlPressureRequired`; `CombatSummary` drops `controlPeak` /
  `controlThreshold`; `CombatAttributionRow.pressureContributed` → `damageDealt`.

### Changed

- The stance-read multiplier + color-match bonus now scale a card's immediate
  STRIKE HP damage; the enemy executes its threat action every phase (gated by
  control). Signatures deal real HP / apply DoT / hinder via control.

## [0.29.0] — 2026-06-22

Combat-redesign release. Consolidates everything that shipped after the
0.23.0 equipment-ownership work through the 0.24.x additive-surface patches
up to the Spec 25 / 26 / 26b combat overhaul. Intermediate `chore(release)`
bumps (0.24.1, 0.24.2, 0.25.0) were published from `package.json` without
their own CHANGELOG headings; their content is folded in here. (The combat
engagement tuning — escalating diversity synergy, variety-gated combo loop,
diminishing returns, intensity cap — shipped here and is superseded by the
0.30.0 HP-only rework above.)

### Added

- **Hazard-Pattern Combat (Spec 25).** `resolveCombatPhase` is a
  card-and-dice driver where every verb is a skill card and two Pressure
  Tracks (DoT Erosion + Control Saturation) are the only practical win
  condition — basic-attack trading is structurally gone. New barrel surface:
  `initializeCombatEncounter`, `playCombatCard`, `resolveCombatPhase`,
  `processBetweenPhases`, `simulateHazardPatternCombat`, the Pressure-Track
  predicates `dotErosionReached` / `controlSaturationReached`, dice/deck/card
  helpers, and the `CombatEncounterState` / `CombatCard` /
  `CombatPressureTracks` types. Directly serves the status-effects-are-the-
  main-fun doctrine.
- **Spec 26 / 26b combat redesign.** Stance-draft turn lifecycle
  (`startTurn` / `draftStanceDie` / `resolveRead` / `endTurn`), the Conviction
  economy and hidden-stance read mechanics, Signature Skills
  (`SIGNATURE_SKILLS`, `signaturesForArchetype`, `playSignatureSkill`),
  deckbuilder card rewards (`COMBAT_REWARD_POOL`, `rollCombatCardRewards`,
  `unlockSkillViaDilemma`), and player archetypes — plus the variety/anti-spam
  balance tuning (Spec 26b §3) that rewards status variety and curbs
  single-card spam.
- **Additive engine surface (0.24.x).** Node event-kind read API,
  level-ladder presets, philosophical-resource carry, and the rebalanced
  fishing-village new-player gauntlet. Patch bumps so consumers picked up the
  new exports without a dependency change — all additive/non-breaking.
- **Rest + LootCache balance sims (Phase 160).** `simulateRest`,
  `simulateLootCache`, and their balance-report helpers.

## [0.23.0] — 2026-06-20

Equipment-ownership release (Phase 154): the engine becomes the single
source of truth for equipment logic, absorbing generation, equipped-state,
and equip-delta from the mobile app so mobile is left with presentation
only. Also folds in the dead-code cleanup and tuning-skill reorganisation
that landed after v0.22.0.

### Added

- **Procedural loot generation** (`Items/loot.generation`):
  `generateRarityDrop`, `dropItemAtRarity`, and `equipmentFromTemplate`,
  drawing rarity-correct affixes from the full 132-entry affix library
  (66 prefixes + 66 suffixes). Rarity → affix-count contract: common 0,
  uncommon 1, rare 2, unique 3 fixed modifiers.
- **Equipped-state helpers** (`Items/equipped`): `firstEquippedPerSlot`
  (+ `findEquippedInSlot` / `isEquippedFirstOfSlot`).
- **Equip-delta** (`Character/equip-delta`): `computeEquipDelta` and the
  `EquipDelta` family of types — moved out of the mobile presenters.

### Removed

- **`COMBAT_ACTION` / `CombatActionName`** (`Game/actions.constants`) —
  legacy combat-action constants with zero consumers in the engine, CLI,
  tests, or mobile. (Minor breaking: anything importing them moves to the
  `Action` type.)
- **`Character.equippedSkills` (Phase 159).** The legacy equipped-skill
  loadout field — deprecated in Phase 99 — is gone from `Character`,
  `CreateCharacterOptions`, `CharacterPreset`, the Tuning loadout builder,
  and the CLI dev-tools (`devEquipSkills` deleted). Skills are known, not
  equipped (ADR-0002); `knownSkills` filtered by affordability is the combat
  catalogue. Legacy v7 saves still fold their old rotation into `knownSkills`
  via the v7→v8 save migration, which now reads the legacy field off the raw
  payload and drops it rather than writing it back. (Minor breaking for any
  consumer reading `player.equippedSkills`.)

### Changed

- **Status-centered affix draws (Phase 157).** Affix rolls now bias toward
  offensive status-applying affixes (`STATUS_AFFIX_DRAW_BIAS`, default 3),
  so weapon/hands drops surface poison/burn/bleed/stun/etc. prefixes the
  majority of the time instead of being mathematically swamped by common
  flat-stat affixes. Discriminator `isOffensiveStatusAffix` (status-tagged,
  status-applying slot, non-defensive) gates the bias so cleanse/resist
  affixes are not boosted. Exposed as the `loot.statusAffixDrawBias`
  tunable; flat-stat variety is preserved, not removed.
- **Status-centered equipment sets (Phase 158).** Every named set in
  `Items/set.library` now anchors its defining payoff on a status-effect
  passive instead of flat stats: aggressive sets (Iron Discipline,
  Scholar's Circle, Skirmisher's Kit) grant `buff_status_chance_up`
  (your statuses land more often); defensive sets (Wanderer's Road,
  Veteran's Plate, Sage's Regalia) grant `buff_resistance_body/_mind/_heart`
  (resist enemy statuses). Existing flat-stat + resource-token bonuses are
  preserved as a secondary floor — the status passive is layered on, not
  swapped in. Pure data retuning over the Phase 54 combat-scoped
  `passiveEffects` path; no engine, type, or public-API changes.
- **Character presets un-deprecated.** The "scheduled for removal at
  v0.13.0" notices were stale — presets are load-bearing (mobile DEV
  preset picker, Playtest runner, Tuning difficulty bands) and are a
  supported surface until those consumers migrate.
- **`mechanics-tuning` skill renamed `combat-tuning`** everywhere
  (skills/, .claude/commands/, agents.md, CLAUDE.md, VISION.md,
  plan/bearings.md, Tuning CLI comments).
- Docs trued up to the nine-kind MapEvents taxonomy (`docs/world.md`,
  `docs/quickstart.md`, Spec 23 addendum) and the actual `equippedSkills`
  deprecation state (`docs/character.md`).

### Added

- **Three new tuning skills** for the Phase 137 encounters:
  `quest-board-tuning`, `rest-tuning`, `loot-cache-tuning` — each with
  locked design contracts, numeric-only guardrails, seeded policy-probe
  evidence matrices, and single-PR delivery, mirroring
  `gathering-tuning`.
- **`NEEDS_ATTENTION.md`** — repo-level audit ledger of known debt and
  half-finished migrations.

## [0.22.0] — 2026-06-17

Item-modifier and combat-response release.

### Added

- **Phase 152 — unified affix factory + curated affixed-gear library.** A
  single affix factory backs both procedural rolls and authored gear.
- **Phase 151 — item modifier catalogue audit and expansion.** Broadened
  the modifier catalogue (status-family prefixes/suffixes) and trued the
  docs to it.
- **Phase 150 — reactive enemies.** An enemy answers a player's hostile
  skill with a skill of its own.
- **Manual npm publish workflow** (`.github/workflows/publish.yml`).

### Changed

- Status-effects doctrine scoped explicitly to combat encounters.
- Documentation corrections: enemy registry roster count (26 → 63),
  equipment unique-template count (2 → 7), feet-modifier catalogue, and
  the Phase 151 modifier tables.

## [0.21.0] — 2026-06-14

Skills, status-effect depth, and dependency-modernization release.

### Added

- **Phase 142 — status-effect depth via interaction breadth.**
- **Phase 141 — unlocked skill access.**
- **Quest-board distinct micro-games.**

### Changed

- **Phase 143 — dependency modernization** (major dependency bumps;
  `@types/node` to ^25).
- Character-preset `@deprecated` notices trued up (stale version
  references corrected).

## [0.20.0] — 2026-06-12

Encounter release: the story-quest board game lands, and rest / loot-cache
graduate from silent grants to full encounters.

### Added

- **Quest Board minigame** (`World/QuestBoard`, "The Boy's Almanac") — the
  story-quest encounter: each main-story beat from
  `content/story/story-overview.md` plays as an authored tabletop board
  inside the fiction. First board: `build-the-boat` (Fishing Village main
  quest) — a 16-space loop, a carved bone die, boat parts fitted at the
  slipway, charms, vows, and dusk. Spaces echo every other encounter kind
  (gather / duel / snag / hearth / market / parley / cache / omen) without
  launching them. Fully sandboxed: the session reads nothing from
  `GameState`; only the completion record (board id + outcome tier) flows
  back. Can't fail — vigor collapse ends the day, never the quest; play
  quality decides the cosmetic tier (masterwork / seaworthy / driftwood).
- **Quest Board micro-games** — the board's repeated binary space decisions
  now split into distinct quick verbs: GATHER press-your-luck wet haul, DUEL
  pre-roll grit allocation, SNAG resource bracing/insurance, MARKET
  escalating repeat-buy prices, PARLEY carried-resource gates, and lighter
  HEARTH rest/linger choices. Expanded hermetic QuestBoard e2e coverage locks
  the new flow.
- **`'quest'` MapEvent kind** — the ninth kind. `QuestEventPayload`
  (`boardId`) resolves to `{ kind: 'quest', boardId }`; the handler
  validates the board id and hands the launch to the host (same contract
  as the hazard/gathering minigames).
- **Rest encounter** (`World/Rest`, "The Night Watch") — one night at camp
  in three watches: posture (deep / doze / watch), the fire's warmth
  against a small store of wood, authored dreams (hold the keepsake or
  take the comfort), stirs, still hours. Dawn outcome carries
  `healFraction` / `cleansed` / keepsakes for the host to apply. A night
  can be meagre but never lethal.
- **Loot-cache encounter** (`World/LootCache`, "The Reliquary") — three
  layers (the lid, the false bottom, the keeper's tithe), trap fates
  sealed at creation, one probe to read the next seam, push-your-luck.
  The engine deals in item refs; the host maps kept uids back to real
  items and settles the bite at claim.

### Changed

- **`ResolvedEvent` rest payload** now carries `healFraction` alongside
  `healed`, so hosts replacing the passive heal with the Night Watch keep
  the authored baseline. (Breaking for literal `{ kind: 'rest' }`
  fixtures — add the new field.)

### Mobile migration notes

- Update `axiomancer-mobile` to `axiomancer-mechanics@0.21.0`.
- Treat Quest Board, Rest, and Loot-cache as engine-owned encounter
  procedures. Mobile should present their state and route player choices; it
  must not locally simulate the board-space verbs, rest watches, loot-cache
  layers, rewards, or outcome tiers.
- For Quest Board specifically, surface the new space verbs clearly: wet-haul
  press/bank/bust, grit spend, bracing resources, marked-up market prices,
  gated parley choices, and hearth linger.
- Run mobile typecheck, verify, visual smoke, and focused encounter/playthrough
  evidence after the dependency bump.

## [0.18.0] — 2026-06-13

Codex release: the hazard card library grows to a full 150 and the gleaning
gets a CLI and its own balance loop.

### Added

- **Hazard codex library** — 108 new cards bring the full library to exactly
  150 (starter bag untouched; the balance-sim bands hold). Six new engine
  mechanics, all additive: PURGE (cut CRACK dead weight), TRANSMUTE (recolor
  dice to the card's colour), MEND (vitae restored at claim), BOUNTY
  (shillings banked at claim), WARD (blunts the route penalty), ANCHOR (a
  momentum floor that pays even off a failed round). Magnitudes in
  `HAZARD_TUNING.cards.codex`; session/outcome carry `vitaeRestore`,
  `bountyShillings`, `wardPenaltyReduction`, `carryFloor` (additive fields).
- **Gathering CLI** — `npm run gathering` (game.cli subcommand): seeded
  deterministic runs, manual or `--auto` (the balance sim's balanced bot),
  JSON events + JSONL state logs, illegal-action records. Hermetic CLI e2e.
- **gathering-tuning skill** — the gleaning balance loop
  (`skills/gathering-tuning.md`, `/gathering-tuning`): policy-sim bands as
  the objective function (greed < restraint < skill), guarded tuning surface,
  single-PR delivery.

### Mobile migration notes

- Update `axiomancer-mobile` to `axiomancer-mechanics@0.18.0`.
- The hazard presenter needs labels + keyword glossary entries for the six
  new effects (purge/transmute/mend/bounty/ward/anchor) and rewards-ledger
  notes for `vitaeRestore` / `bountyShillings`; claim-time application adds
  the two new ledger lines.
- The gathering engine may now be consumed from the package root (the copy
  is at parity); delete `state/gathering/`'s rule files the way hazard did.

## [0.17.1] — 2026-06-12

### Fixed

- Restored the deprecated character-preset exports (`characterPresets`,
  `getPresetById`, `buildCharacterFromPreset`, `CharacterPreset` types)
  that 0.17.0 dropped. Standing rule 9 locks the public barrel — removals
  require a semver major phase — and `axiomancer-mobile` actively consumes
  this surface (preset dev tooling). The `@deprecated` tags remain; removal
  is re-queued behind a major bump plus a mobile migration.

## [0.17.0] — 2026-06-12

Minigame ownership release. The package becomes the source of truth for BOTH
encounter minigames: the Hazard v2 rules (formerly mobile's local engine) and
the new Gathering minigame ("The Gleaning"). Mobile keeps only UI.

### Added

- **Hazard v2 engine** — `src/World/Hazard/` now carries a byte-faithful port
  of the mobile living rules source (design handoff 2026-06-10): no-re-cast
  dice doctrine, momentum carry, reserves, salvage, enchant auras, gold vows,
  sub-quests, and the full card library. The exported surface matches the
  mobile engine exactly so mobile can delete `state/hazard/`'s rule files and
  import these instead. Parity is guarded by
  `src/World/Hazard/audit/e2e/parity.audit.test.ts`.
- **Gathering minigame ("The Gleaning")** — `src/World/Gathering/`, the
  Forage-archetype push-your-luck harvest: GLEAN/STRIP stances, three one-way
  strata, the WRATH meter with reprisal thresholds and eruption, offerings and
  GRACE, one-use field tools, rolled boons, family-set refinements, and a
  deterministic policy sim guarding the incentive gradient
  (greed < restraint < skill). Exported from the package root; seeded-RNG
  helpers aliased (`gathering*`) to avoid clashing with the Hazard RNG exports.
- **Tuning pipeline** — combat resource economy analysis (Phase 139),
  friendship-route tuning for three-anchor enemies (Phase 138), and a matrix
  builder aligned with the Phase 136 contract: seed-dependent enemy
  assignment, multiplicative focus weights (playstyle / difficulty / level
  band), per-cell difficulty bands, and focus parsing for playstyle and
  difficulty keywords.
- **Test gates** — test files are now type-checked (`npm run
  type-check:tests`, fifth hard gate in `verify`), and a hermeticity guard
  suite enforces the testing standard mechanically.

### Removed

- Dead export `isValidCombatAction` (never consumed; pre-1.0 minor per the
  deprecation policy).

### Mobile migration notes

- Update `axiomancer-mobile` to `axiomancer-mechanics@0.17.0`.
- Delete the local hazard rule files (`state/hazard/engine.ts`, `types.ts`,
  `content.ts`, `tuning.ts`, `rng.ts`, `sim.ts`, `deck-flags.ts`) and import
  the same names from the package root. `store-actions.ts` (host glue) stays.
- The gathering engine may be migrated the same way at leisure
  (`state/gathering/` ⇄ package-root exports; `store-actions.ts` stays).

## [0.16.0] — 2026-06-10

Hazard minigame documentation and mobile-consumer release. This bump packages the
Hazard design doctrine and a new API guide alongside the existing public Hazard
barrel exports, so downstream clients can consume the card/dice crisis loop without
reading implementation files or inventing local rules.

### Added

- **Hazard consumer docs** — `docs/hazard-minigame-api.md` documents top-level
  package imports, legal state-machine sequence, route-choice flow, card and dice
  display contracts, score handling, presenter guidance, and current v0 caveats.
- **Published Hazard docs** — package `files` now includes the Hazard docs,
  `CHANGELOG.md`, `RELEASES.md`, and `RELEASING.md` so npm consumers receive the
  relevant release and integration material.

### Changed

- README install guidance now reflects that `axiomancer-mechanics` is published
  on npm and names the Hazard public API surface available to mobile.

### Mobile migration notes

- Update `axiomancer-mobile` from `axiomancer-mechanics@0.15.1` to
  `0.16.0`.
- Use only top-level package imports for Hazard. Do not deep-import
  `World/Hazard` implementation files.
- Treat the mechanics package as owner of Hazard state transitions, card effects,
  dice state, route thresholds, round marks, and final `O - X` score. Mobile owns
  presentation and player affordances.
- Current v0 caveats remain: map-state benefit/penalty mutation and full penalty
  application are typed but not yet complete live world integration surfaces.
- Run mobile `npm run typecheck`, `npm run verify`, and focused presenter tests
  for route choice, dice board, card affordance, round ledger, and final score.

### Security

## [0.15.1] — 2026-06-08

Balance and resolution hardening release. Phases 122–126 close the mid/late-game
timeout problem: enemies can no longer tank indefinitely against a saturated/debuffed
player. Status effects are now the dominant path to resolution — DoT erosion drives
victory, saturation-yield drives friendship — and their potency is meaningfully higher
across the board. Alongside these fixes, a content expansion ships ~20 new skills and
a larger equipment/item library (internal content only; no new public-barrel exports
for those surfaces). Status effects are the main fun in combat encounters; this release makes them feel it.

### Added

- **Phase 123** — `enemyStatBudget(level, difficulty)` is now a public export.
  Returns the HP/stat budget used for enemy stat generation. Useful for debugging
  and documentation overlays; also exposes `ENEMY_GEAR_TIER_EASY/NORMAL/HARD/BOSS`
  constants that feed the gear-tier counterweight (see Changed below).
- **Phase 125** — `getEffectsResolutionOutcome(combatState)` is now a public export.
  Returns the engine-computed resolution outcome when status effects alone would end
  the encounter (`'friendship'` via saturation-yield or `'victory'` via DoT erosion),
  or `null` when effects have not crossed any threshold. Engine-owned truth — mobile
  must surface this rather than computing thresholds locally.

### Changed

- **Phase 122** — Level-1 enemy outlier rebalance: `reef-barnacle-colony` (17%
  resolution, 55% defeat) and `tolltaker-of-the-ford` (91% defeat at L1 mixed-hard)
  stat splits adjusted. Both now fall within the 65–75% resolution-success target
  band without cutting the global `enemy.statPerLevel` slope.
- **Phase 123** — Enemy gear-tier counterweight: `ENEMY_GEAR_TIER_*` constants wired
  into `enemyStatBudget` as a `gearTierBonus` (≈0 at L1, scales at higher levels).
  Counterbalances the player's off-budget gear/skill advantage that caused late-game
  trivialization. Registered as a tight-bounded registry tunable so the balance loop
  can A/B the magnitude.
- **Phase 124** — Status effects and skills stronger: base intensity and duration
  raised across the core debuff/buff/DoT kit (per-effect lever approach, no formula
  rewrites). Exposed as loop-owned registry tunables. Engagement-floor confirmed
  in-band (no basic-attack-trade regression).
- **Phase 125** — Effects contribute to resolution: a saturated/debuffed enemy now
  yields (routed through the existing `'friendship'` outcome) and DoT erosion can
  drive `'victory'` — without a larger `maxRounds` cap and without a new `outcome`
  union member. Resolution thresholds exposed as registry tunables. `src/index.ts`
  now exports `getEffectsResolutionOutcome`.
- **Phase 126** — Status effects/skills stronger (follow-up, T human override on
  threshold values): `effect.resolutionDotDamageThreshold` 5→3 and
  `effect.resolutionDebuffIntensityThreshold` 8→6 (analyst-proposed values, overrides
  prior auto-applied zero changes). DoT damage-per-round, debuff/buff intensity and
  duration, and key skill proc magnitudes raised further. Mid/late-game timeout cells
  (`l15-mixed-easy`, `l15-strategist-normal`, `l30-mixed-normal`) confirmed moving
  toward in-band resolution.
- **PR #120 content expansion** — ~20 new skills across Tiers 1–3 registered in the
  skill library; equipment template library expanded to ~43 templates spanning L1–50
  (24 new modifier types, new uniques, sets, consumables); affix naming layer added
  internally (`dropItemWithAffixes` factory path, not yet on the public barrel). All
  content carries `addedIn`/`tags` provenance metadata for the tuning workflow's
  `--focus` filter.

### Removed

- **`clearTier1EffectsForType`** — dead legacy alias removed from the public barrel
  (commit `aca1b1a`, iterate finding). The canonical export is `clearTier1EffectsForStance`,
  which has identical behaviour and has always been the in-repo callers' target. No
  known external consumers; removed without a formal deprecation window per the
  pre-1.0.0 dead-code exception.

### Mobile migration notes

- Update `axiomancer-mobile` from `axiomancer-mechanics@0.15.0` to `0.15.1`.
- **Status effects are now the main path to resolution.** Mobile should ensure
  active-effect displays are prominent and legible. The STRATEGIST playstyle is the
  witness: if status-effect play does not feel decisive, something is wrong. Do not
  suppress or abbreviate effect stacks.
- **Engine owns saturation-yield and DoT-victory.** Use `getEffectsResolutionOutcome`
  to read the engine's resolution determination; do not approximate the thresholds
  locally. Both the `'friendship'` and `'victory'` branches are in the existing
  `CombatEndReport.outcome` union — no new rendering path required.
- **`enemyStatBudget`** is available for debug overlays or encounter-preview screens.
- **Remove any import of `clearTier1EffectsForType`** — replace with
  `clearTier1EffectsForStance` (identical signature and behaviour).
- New skills and equipment content are now in the respective libraries. Run mobile
  `npm run typecheck`, focused Jest around combat/effects/items presenters, and
  `npm run verify` after bumping.

### Security

## [0.15.0] — 2026-06-06

Balance/content release for the post-0.14 mobile line. This bump ships Stance
and Vitae authority hardening, reproducible Stance/Vitae and mid-game playtest evidence,
northern-forest content expansion, story NPC dialogue, Tier 3 description polish,
synergy walkthrough coverage, and the Phase 121 three-anchor Sage balance
scaffold/tuning pass.

### Added

- **Phase 113** — Stance/Vitae playtest evidence and STRATEGIST witness reports for
  resource-and-stance routing. Adds stronger evidence around stance choice, Vitae
  spending/generation, and patience-control play.
- **Phase 114** — Second enemy class family for `northern-forest`, expanding enemy
  variety beyond the initial coastal roster with additional AI/content patterns.
- **Phase 115** — Story-content NPC dialogue expansion with authored branches and
  alignment-facing narrative surfaces.
- **Phase 119** — Mid-game reference playtest probe: level-6 Wanderer vs
  northern-forest elite-tier enemies. Adds `automation/playtest/mid-game-reference-probe.mjs`
  and `wanderer-level-6` preset support.
- **Phase 120** — Phase 66 synergy walkthrough coverage: extends Wanderer access to
  selected synergy skills and adds the `synergy-skills-chain` walkthrough.
- **Phase 121** — Three-anchor playtest balance scaffold for level-6 Sage against
  easy/normal/difficult anchors, with per-policy 25-run evidence and balance
  reports.

### Changed

- **Phase 112** — Stance and Vitae authority doctrine hardening: mechanics owns
  stance state, Vitae/resource generation and spending, action affordability, and
  report output; consumers should not simulate this flow locally.
- **Phase 116** — Difficulty-curve doctrine spec: codifies target bands for
  difficulty, resolution success, rounds-to-resolve, and balance evidence.
- **Phase 117** — Northern-forest map expansion: grows `northern-forest` from 10 to
  25 nodes with three sub-areas, additional MapEventPool coverage, dead-ends, and a
  small loop.
- **Phase 118** — Tier 3 fallacy skill descriptions enriched; no mechanical change.
- **Phase 121 tuning close-out** — Sage anchor enemies, policy evidence, and health
  formula/tuning were adjusted so the three-anchor balance class behaves as intended.

### Mobile migration notes

- Update `axiomancer-mobile` from `axiomancer-mechanics@0.14.0` to `0.15.0`.
- Treat Stance and Vitae as engine-owned: surface mechanics-emitted stance,
  resource, action-affordability, and report state; do not restore local
  stance/resource or resolution simulation.
- Refresh any exploration assumptions around `northern-forest`; the map and event
  pools are broader than the prior 10-node shape.
- Review new enemy/NPC/story content for presentation fallbacks, codex/memoir copy,
  encounter rendering, and visual-smoke route coverage.
- Run mobile `npm run typecheck`, focused Jest around combat/exploration/story
  presenters, `npm run verify`, and visual smoke/playtest evidence after bumping.

### Security

## [0.14.0] — 2026-06-03

Post-`0.13.0` mechanics release for mobile catch-up. This bump ships the
combat-contract repair work, unlocked-skill access, reference playtest fixtures,
balance evidence, Befriend-as-skill mercy flow, anti-exploit region consequences,
and boss-Befriend faction reputation consequences. It also removes the
v0.13.0-deprecated combat aliases and `getResistStat` surface.

### Added

- **BattleLogEntry contract validation** (Phase 96): `resolveCombatRound` and
  `buildBattleLogEntry` now reject missing player/enemy action fields before a
  malformed `BattleLogEntry` can reach mobile. This protects boss-skill killing
  blows from producing undefined action labels.
- **`previewStatAllocation` character API** (Phase 97): Pure stat-allocation
  preview helper for level-up UI. Mobile should use this rather than approximating
  derived stat deltas locally.
- **Unlocked-skill access model** (Phase 99): Learned skills are available by
  `Character.knownSkills` plus combat-resource affordability; `equippedSkills`
  no longer gates combat casting. Mobile skill lists should read unlocked +
  affordable engine state, not equipment slots.
- **Reference playtest fixtures and exports** (Phase 104): Early-game and
  endgame playtest fixtures surfaced for deterministic balance/consumer checks.
- **Befriendable-enemy Tier-2 expansion** (Phase 102): Expanded befriendable
  roster from 3 → 7 enemies. Added full befriendability stack (config + rewards +
  narrative + journal entries) to TideflukeReaver, HushWraith, HollowSaint, and
  TheDisagreement. Elite-tier enemies require specific stance combinations and
  patience; boss-tier TheDisagreement requires full stance spectrum and an
  8-round patience threshold.
- **Befriend is a Heart skill with mercy choice** (Phase 108): Befriend is now a
  starting Heart skill with a 5-heart-token attempt cost. Successful openings
  present a consequential spare/befriend versus exploit-for-critical choice.
- **Region consequence state** (Phase 109): Elite/miniboss Befriend spare/exploit
  outcomes can affect the later region boss through `RegionConsequences`.
- **Faction reputation system** (Phase 110): Added `FactionReputations`,
  `FactionReputationDelta`, `FactionInfo`, faction library/helpers, and
  boss-Befriend reputation deltas. Boss spare outcomes can now lose reputation
  with one faction and gain with another; combat-end output exposes
  `factionReputationShift` for mobile rendering.
- **Damage resistance primitive** (Phase 93): Skills now apply damage resistance
  based on target stats: physical by body, mental by mind, emotional by heart.
  Linear model: 1 stat point = 1 damage reduction, minimum 1 damage.

### Changed

- **Combat difficulty made playable**: Defense multipliers were reduced so level-1
  combat no longer collapses into zero-damage exchanges against the weakest foes.
- **Coastal Tyrant mercy-route tuning + balance doctrine** (Phases 101 / 107):
  Playtest evidence now judges each playstyle against T's 65–75% resolution
  success band (`victory + friendship/mercy`). Current evidence shows Aggressive
  and Mixed in-band, while Defensive/Strategist need targeted pressure.
- **Befriend anti-exploit rules** (Phase 109): Sparing versus exploiting
  elite/miniboss Befriend openings now carries delayed boss-consequence meaning;
  mobile should preserve that choice as a visible player decision, not hide it in
  automatic resolution.
- **Glanton Nexus guardrail** (Phase 105): Repo-local Nexus state reconciliation
  is documented so `/march`, `/oversight`, and phase files do not drift from
  current doctrine.

### Removed

- **`getResistStat(combatant, stance)`** — replaced by
  `getEffectiveStats(combatant).baseStats[stance]`. Removed after the v0.13.0
  deprecation window.
- **`endCombatPlayerVictory` / `endCombatPlayerDefeat` /
  `endCombatWithFriendship` aliases** — replaced by `endCombat()`. Outcomes are
  computed by `determineCombatEnd(state)`, not by function name.

### Fixed

- **Combat re-trigger lock cleared for all outcomes** (Phase 103): Fixed a bug
  where players could not trigger new combat encounters after victory or
  friendship outcomes. All terminal combat outcomes now clear encounter state.
- **Skill/resource truth repaired for mobile consumption**: combat resources live
  on `CombatState.combatResources`; skill affordability and token spend should be
  driven from that state, not from character-level mana/equipment assumptions.
- **Test/dependency stability**: TypeScript ESLint, zustand, and vitest patch/minor
  updates shipped; vitest pool isolation now prevents cross-file RNG/state bleed.

### Mobile migration notes

- Update `axiomancer-mobile` from `axiomancer-mechanics@0.13.0` to `0.14.0`.
- Replace any local stat-preview math with `previewStatAllocation`.
- Remove any dependency on `equippedSkills` as the combat skill gate; use
  `knownSkills` + `getAvailableSkills` / `canUseSkill` / `combatResources`.
- Treat Befriend as a Heart skill attempt that costs 5 heart tokens and can open a
  spare-versus-exploit choice. The combat UI needs a real choice modal for that
  opening.
- Render new end-report consequences when present: `regionConsequences`,
  `factionReputationShift`, and existing friendship reward/alignment fields.
- Replace `getResistStat` and the three legacy `endCombat*` aliases if mobile
  still imports them.

### Security

## [0.12.0] — 2026-05-26

Post-`0.11.0` content sweep closing the Phase 71 / 73 follow-up +
the mobile item-library mod-visibility helpers (single-cell at
Phase 75 + batch at Phase 76) + the **skills-always-land mechanic
shift** (Phase 80 direction (a) pure split, with Phase 78 + 79
audit pre-work) + Phase 88 effect coverage sweep + Phase 89
front-door docs fold-in.

### Changed
- **`EffectApplicationResult.rebounded` removed; `getResistStat` deprecated.**
  The `rebounded?: boolean` field on `EffectApplicationResult` is removed
  (dead since Phase 80 — never set to `true`). The `roll` field JSDoc
  corrected to "Tier 2 buff effects only." `getResistStat` marked
  `@deprecated` (zero in-repo callers post-Phase-80; removal at next minor).
  **BREAKING:** consumers reading `result.rebounded` must remove that access.

- **Phase 84 — Skill "fizzle" event + UX scrub post-Phase-80.**
  `SkillEvent` discriminated union cleaned up: dead-code
  `effect-rebounded` variant removed (zero emit path post-Phase-80);
  `effect-resisted` renamed to `buff-fumbled` (only fires on Tier 2
  buff caster fumble). `SkillPhaseEvent` mirror updated. Dead rebound
  emit block removed from `applySkillEffect`. Docs reframed
  (combat.md Effect Resistance Rules rewritten, effects.md Tier 2/3
  tables updated). **BREAKING:** consumers pattern-matching on
  `SkillEvent.kind === 'effect-resisted'` or `'effect-rebounded'`
  must update.

- **Phase 80 — Skills always-land effects (direction (a) pure split).**
  `src/Combat/resist.ts:resolveEffectApplication` rewritten so Tier 2
  debuffs + Tier 3 effects **always land**. Target-resist roll
  removed on Tier 2 debuffs (no Nat-20 rebound; no Nat-1 overwhelmed
  double-duration). Tier 3 Nat-20 miraculous escape removed. Tier 1
  unchanged (was already auto-apply). Tier 2 buff caster d20
  fumble/crit KEPT per Phase 79 D8 (caster-side variance is not
  target-resist; direction (a) only removes target-resist). The
  damage-side of direction (a) — "damage rolls separately + applies
  resistance" — is **deferred to a follow-up phase** per D1: the
  damage-resist primitive doesn't exist today; introducing it would
  expand scope. Filed as a new Pending candidate at ship-time. No
  public-surface change (fixture stays 237 runtime + 167 types);
  `GAME_STATE_VERSION` unchanged. `effect-resisted` renamed to
  `buff-fumbled` and `effect-rebounded` removed at Phase 84. Hermetic
  contract pinned at `src/Combat/e2e/phase80-always-land.engine.test.ts`
  (+6 tests: 713 net). **Revisit-if-unbalanced caveat preserved** per
  oversight-19 user note: if direction (a) feels off in playtest,
  the candidate body retains the (b) intensity-scaling and (c)
  split-resistance variants as fallback paths for a future re-author.
  Audit pre-work shipped at Phase 78 (skills, `44d3827`) + Phase 79
  (effects, `3d213bd`).

### Added
- **Phase 89 — Front-door docs fold-in for Phases 81-87.**
  README gains a "Recent infrastructure (Phases 81-88)" paragraph
  (walkthroughs, CLI codex/reset, 824 tests, per-module quickstart
  pages). `docs/api.md` gains Phase 82 CLI consumer surfaces note
  (codex + reset tabs) and Phase 87 per-module quickstart page links.
  `plan/bearings.md` extended with Phase 82/83/85/86/88 fold-ins.
  Pure docs; no engine changes.

- **Phase 88 — Effect coverage sweep (5 Phase 79 LOWs drained).**
  Five new hermetic test files expanding post-Phase-80 effect coverage:
  `src/Effects/e2e/stat-band-effects.engine.test.ts` (~12 cases),
  `src/Effects/e2e/advantage-effects.engine.test.ts` (~13 cases),
  `src/Effects/e2e/control-effects.engine.test.ts` (~10 cases),
  `src/Effects/e2e/damage-variants.engine.test.ts` (~5 cases), and
  `src/Skills/e2e/fallacy-skills.engine.test.ts` (~8 cases). Drains
  the 5 remaining Phase 79 LOW CRITIQUE rows. 824 tests total.

- **Phase 83 — Post-Phase-80 effect-application test sweep.**
  Two new hermetic test files covering the post-Phase-80 always-land
  contract: `src/Skills/e2e/phase83-skill-coverage.engine.test.ts`
  (10 cases across 8 skills + 3 primitives) and
  `src/Combat/e2e/phase83-tier2-debuff-categories.engine.test.ts`
  (15 parameterized cases: 5 Tier 2 debuff categories x 3 d20 rolls).
  Drains 12 CRITIQUE Pending rows (3 MED + 8 LOW from Phase 78 audit
  + 1 MED from Phase 79 audit).

- **Phase 82 — CLI run-loop + Codex integration (Phase 72 + 73
  consumer surfaces).** `src/CLI/game.cli.ts` Tab union extended
  with `'codex'` + `'reset'`:
  - **Codex tab** — `codexTab(store)` renders
    `state.codex.unlockedEntries` (Phase 73). Looks up each entry
    id via a one-time `codexLookup: Map<string, CodexEntry>` built
    from `EnemyLibrary` at module load (per brief D2 — no new
    public-barrel export needed since the only authored codex
    entries today live on `Enemy.journalEntry?`). Empty-state copy:
    "Your codex is empty — befriend a foe with a journal entry to
    start filling it." (verbatim from the candidate).
  - **Begin again** — `resetTab(store)` prompts full reset / keep
    character / cancel; dispatches `store.resetRun({ keepCharacter })`
    (Phase 72); surfaces the post-reset `runId` + hearth node id.
    `logState('resetRun', ...)` for walkthrough visibility per D6.

  New agent-graded walkthrough at
  `automation/scripts/walkthroughs/codex-unlock.{json,goal.md}`:
  Apprentice → fv-11 → fv-14 → fv-15 (MournfulGull) → 5 heart-defends
  → Codex tab → quit. Grades on either friendship-fires-and-codex-renders
  OR script-exhausted-with-empty-codex (per brief D3 — MournfulGull's
  AI is non-deterministic on the both-defend pattern). README inventory
  + docs/gameloop.md § "game.cli.ts" extended. No public-surface change
  (fixture stays 237 runtime + 167 types per D8).

- **Phase 81 — Walkthrough catalog expansion (Phase 65 / 80 / 68
  coverage).** Three new walkthrough pairs ship under
  `automation/scripts/walkthroughs/`:
  - `fishing-village-exploration.{json,goal.md}` — Apprentice
    exploring the Phase 65 25-node grid via the Harbor District
    sub-area (fv-1 → fv-11 → fv-14 → fv-15) to the guaranteed
    MournfulGull encounter at fv-15 (Phase 60 befriendable
    placement via the weight-1 `fvGullCrag` pool).
  - `tier2-skill-chain.{json,goal.md}` — Wanderer casts Tier 2
    `eternal-regress` in a debug-spawned combat, exercising the
    two-effect compound application (`debuff_confusion` +
    `debuff_slow`) under the **Phase 80 always-land contract**.
    Closes one of Phase 78's MED zero-coverage primitives at the
    player-experience tier. Originally scoped for Phase 66 synergy
    skills per the candidate body; pivoted per brief D2 (none of
    the 5 synergy skills ship in any preset's `knownSkills`).
  - `coastal-tyrant-befriend.{json,goal.md}` — Sage attempts the
    Phase 68 `BefriendabilityConfig` AND-composition (`hpGate:
    { belowPct: 0.4 } + requiredStances: ['heart'] + roundsThreshold:
    5`) via 9 heart-stance defends. Grades on predicate-attempt
    visibility per brief D3 (the `hpGate` axis is RNG-dependent;
    `requiredStances` + `roundsThreshold` axes are exercised
    deterministically).

  `automation/scripts/walkthroughs/README.md` inventory grew three
  rows; `docs/testing.md` § "Agent-graded walkthroughs (Phase 26)"
  gained a Phase 81 fold-in note. A new Pending candidate
  (`Phase 66 synergy walkthrough (requires preset extension)`) is
  filed at ship-time per brief D6 to close the original synergy
  scope once the preset gap is addressed.

- **Phase 76 — `previewTemplateAtAllRarities` batch helper (Phase
  75 follow-up).** Convenience wrapper around `previewTemplateAtRarity`
  for UI tooltip / item-detail views that render every-rarity-for-
  this-template comparison strips. New `previewTemplateAtAllRarities(templateId: string, playerLevel: number, rng?: () => number): Record<ItemRarity, Equipment | undefined>`
  in `src/Items/item.factory.ts`. Calls `previewTemplateAtRarity`
  four times internally and zips into a record; each rarity-cell
  uses the same `rng` so mod values across the rarity strip are
  stable per seed. Same soft-error + deterministic-rng convention
  as the Phase 75 single-cell helper (default `rng = () => 0.5`).
  Unique templates return the unique-rolled Equipment in every cell
  (Phase 75 D4 soft-coerce — caller may not know the template is
  unique). Re-exported through `src/Items/index.ts` + top-level
  barrel (+1 runtime export; fixture 236 → 237; types unchanged at
  167). Hermetic e2e at `src/Items/e2e/preview-template.engine.test.ts`
  extended (3 new cases — regular-template happy path; level-too-low
  yields all-undefined; unique template populates every cell with
  unique-rolled Equipment). Phase 76 commits: `4c6d54e` (Unit 1 —
  engine + e2e + barrels + fixture) + Unit 2 (this commit —
  docs/items + docs/api + README + bearings + CHANGELOG).

- **Phase 75 — `previewTemplateAtRarity` helper (mobile item-library
  mod-visibility).** Closes the user-jot at `b5c8165` (refined at
  oversight-15 `077979e`): mobile UI rendering `equipmentTemplates`
  shows zero modifiers per entry because templates carry only
  `baseStatModifiers` by design — rolled mods only exist on runtime
  `Equipment` from `dropItem`. New
  `previewTemplateAtRarity(templateId: string, rarity: ItemRarity, playerLevel: number, rng?: () => number): Equipment | undefined`
  helper on `src/Items/item.factory.ts` wraps `dropItem` with rng +
  rarity pinned + UI-tier soft-error semantics (returns `undefined`
  for unknown templateId / level-too-low / unique-rarity-on-regular-
  template, instead of throwing — UI code looping templates ×
  rarities cannot wrap every call in try/catch per D1). Default
  `rng = () => 0.5` (Phase 70 Coastal Tyrant deterministic-drop
  pattern) so previews are reproducible per (template, rarity,
  playerLevel) tuple — same cell across re-renders returns identical
  Equipment per D2. Unique templates soft-coerce rarity to
  `'unique'` regardless of caller input per D4. Re-exported through
  `src/Items/index.ts` + top-level barrel; fixture +1 runtime export
  (235 → 236; types unchanged at 167 per D7). Hermetic e2e at
  `src/Items/e2e/preview-template.engine.test.ts` (5 cases per D3 —
  rolled-mod count matches rarity tier; determinism per default
  rng; the three soft-error paths). Mobile UI callsite post-engine-
  release: replace the zero-mod render in the item-library matrix
  view with
  `equipmentTemplates.flatMap(tpl => itemRarities.map(r => previewTemplateAtRarity(tpl.id, r, playerLevel)))`.
  Phase 75 commits: `6e04b50` (Unit 1 — engine helper + e2e +
  barrel re-exports + fixture refresh) + Unit 2 (this commit —
  docs/items.md "Previewing rolled mods" subsection + docs/api.md
  Items block + README.md Items row + CHANGELOG bullet).

- **Phase 74 — Post-GH#65 per-foe content sweep.** Authored
  `finalBlowLines` + `causeLines` chronicle prose on the 12
  non-sandbox enemies that Phase 71 + 73 had left to a follow-up
  sweep: TidepoolCrab, SeaMistWisp, LullabyMoth, Disatree_01,
  WetHound, ForestSprite, ArgumentativeCrow, TideflukeReaver,
  HushWraith, HollowSaint, TheDisagreement, EchoOfPyrrhonia.
  6 strings per enemy × 12 enemies = **72 new chronicle lines**;
  each enemy's voice extends its existing `description` + Phase 45
  alignment archetype + Phase 49 skill rotation where present.
  Total authored coverage: **15 of 16** enemies (only `Sandbag_01`
  remains un-authored per Phase 74 D1 — test sandbox with no
  narrative weight). Per D2, no new befriendable enemies promoted
  this phase (breadth-before-depth; Tier-2 befriendable promotion
  is a separate candidate); per D3, `pactLines` not authored on
  non-befriendable enemies (only meaningful when the enemy carries
  a `friendshipReward`). Pure content; no engine touch; no
  public-surface change (fixture stays 235 + 167). Hermetic e2e at
  `src/Enemy/e2e/aftermath-lines.engine.test.ts` extended:
  registration shape pin now covers all 15 authored enemies (split
  into separate `finalBlowLines + causeLines` shape case + a
  `pactLines befriendable-only` case); regression case re-keyed
  from TidepoolCrab (now authored) to Sandbag_01 (the new
  un-authored control). Mobile presenter's `derive*Phrase`
  fallback now only fires on Sandbag_01 — the player-visible
  roster all renders engine-authored prose. Phase 74 commits:
  `fae92ff` (Unit 1 — content authoring on 12 enemies) + Unit 2
  (this commit — e2e regression case shift + docs/enemy.md sweep
  paragraph + CHANGELOG bullet).

## [0.11.0] — 2026-05-23

Six engine extensions across two arcs: the friendship-mechanic
expansion (Phases 68/69/70 — per-enemy `BefriendabilityConfig`
predicate + `FriendshipReward.alignmentDelta` closing Spec 14 Q4 +
boss-tier `friendshipReward` content on CoastalTyrant) and the
GH#65 mobile aftermath trio (Phases 71/72/73 — per-foe narrative
prose + run-loop semantics + Codex / journal-entry surface).
`GAME_STATE_VERSION` bumped twice in the cycle (5 → 6 at Phase 72;
6 → 7 at Phase 73) — both required-field additions with matching
migrators. Per-phase detail in the `### Added` section below.

### Added
- **Codex / journal-entry surface (Phase 73 — closes GH#65 ask 3).**
  Unblocks the mobile `<CombatFriendshipPanel>` "A NEW ENTRY" card
  which previously never mounted because the engine didn't expose
  any codex surface. New required state slice
  `GameState.codex: CodexState` (`{ unlockedEntries: string[] }`;
  wrapper around the array so future per-entry metadata —
  unlock-timestamp, read-status — can land additive-optionally;
  same pattern as `QuestLog`). New optional per-foe metadata
  `Enemy.journalEntry?: CodexEntry` (`{ id: string; title: string;
  body: string }`). `store.endCombat()` auto-fires the unlock on
  `outcome === 'friendship'` when the befriended enemy carries a
  `journalEntry`: the END_COMBAT reducer appends the entry's id to
  `state.codex.unlockedEntries` (de-duped via `includes()`) and the
  store surfaces `{ id, title }` as
  `CombatEndReport.friendshipReward.codexEntryUnlocked` only when
  the entry wasn't already unlocked (mirrors the Phase 69
  `alignmentShift` surfacing pattern; body is recovered at
  consumer render time via lookup against the source `Enemy`).
  New action variant `{ type: 'UNLOCK_CODEX_ENTRY'; payload: {
  entryId } }` + store method `store.unlockCodexEntry(entryId)` so
  future dialogue / map-event content can grant codex entries
  outside combat; added to `DURABLE_ACTIONS` so unlocks persist
  immediately. Phase 72 `RESET_RUN` reducer extended to preserve
  `state.codex` on `keepCharacter: true` (codex unlocks are
  character knowledge — carry across runs alongside
  `philosophicalAlignment` + `moralMeter`). `GAME_STATE_VERSION`
  bumped 6 → 7; `migrateV6toV7` defaults `codex = { unlockedEntries:
  [] }` on legacy v6 saves. Initial author coverage:
  MournfulGull (`codex-mournful-gull` — "The Catalogue of Slights";
  extends the Phase 71 list / catalogue thread), HollowEyedBeggar
  (`codex-hollow-eyed-beggar` — "They Carry What You Set Down";
  reversal-of-begging chronicle), CoastalTyrant
  (`codex-coastal-tyrant` — "The Magistrate Who Set Down the
  Circlet"; magistrate-fallen-priest chronicle). The remaining 13
  enemies in the library leave `journalEntry` undefined and don't
  unlock anything on friendship; future content sweeps author
  entries on additional enemies. Fixture bump: +2 type exports
  (`CodexEntry` + `CodexState`); 165 → 167; runtime unchanged at
  235. Hermetic e2e at `src/Game/e2e/codex.engine.test.ts` (6
  cases: empty default + friendship unlocks + de-dupe +
  no-journalEntry no-op + victory-outcome no-op + migration).
  Mobile callsite cleanup (`<CombatFriendshipPanel>` reads
  `report.friendshipReward.codexEntryUnlocked` and mounts the NEW
  ENTRY card) is consumer-side and ships post-engine-release.
  Phase 73 commits: `0dea5f5` (Unit 1 — Codex slice + journalEntry
  type + reducer + action + store + barrels + fixture + Phase 72
  RESET_RUN cross-phase update) + `3492a15` (Unit 2 — 3 authored
  journal entries on the befriendable trio) + Unit 3 (this commit
  — 6-case hermetic e2e + docs/api + docs/combat Friendship Path
  + docs/enemy Codex section + README + bearings + CHANGELOG).

- **Run-loop semantics (Phase 72 — closes GH#65 ask 2).** New
  store surface for "begin again at the hearth" flows. Mobile
  BEGIN AGAIN's full-heal + dismiss band-aid drops in favour of
  a proper engine primitive. New
  `store.resetRun({ keepCharacter: boolean }): GameState` method.
  `keepCharacter: true` preserves the character ledger (player +
  philosophicalAlignment + moralMeter + rngState), refills HP to
  maxHealth, clears `player.effects` defensively, and resets
  run-scoped state (world via `createStartingWorld()` → fishing-
  village starting node; combat null; quests empty; flags empty;
  `lastSeenAlignmentCells` undefined — observer cache resets).
  `keepCharacter: false` performs a full new-game reset carrying
  only `rngState` (don't reset the seed mid-session — that breaks
  deterministic replay). Every call assigns a fresh `runId`.
  Dispatches `RESET_RUN` through the standard
  `gameReducer → set → emit → autosave` pipeline; `RESET_RUN`
  added to `DURABLE_ACTIONS` so the new state persists
  immediately. New required `GameState.runId: string` field
  (16-char hex, matches `/^[0-9a-f]{16}$/`; Phase 35 character-id
  generation pattern; no `crypto` dependency for React Native
  compatibility). New helpers on the public surface:
  `generateRunId(rng: () => number): string` (consumers can
  supply their own rng for deterministic tests) and
  `STARTING_REGION: MapName = 'fishing-village'` (canonical
  run-start region; reuses `MapDefinition.startingNode` — no new
  "hearth" type primitive). `GAME_STATE_VERSION` bumped 5 → 6;
  `migrateV5toV6` defaults `runId` via
  `generateRunId(() => getRng().random())` on legacy v5 saves.
  Fixture bump: +2 runtime exports (`generateRunId` +
  `STARTING_REGION`); types unchanged at 165. Hermetic e2e at
  `src/Game/e2e/run-loop.engine.test.ts` (8 cases pinning the
  preserve / reset matrix + migration). Mobile callsite cleanup
  (drop the band-aid in `state/combat-mode.tsx`) is consumer-side
  and ships post-engine-release. Phase 72 commits: `013c0af`
  (Unit 1 — types + reducer + migration + action + store method
  + run-loop.ts + barrels + fixture; two pre-existing tests
  updated to expect version 6) + `66c8822` (Unit 2 — 8-case
  hermetic e2e) + Unit 3 (this commit — docs/api + docs/gameloop
  Run-loop reset section + README + bearings + CHANGELOG).

- **Per-foe aftermath narrative prose (Phase 71 — closes GH#65 ask
  1).** Three new optional type interfaces on the public surface:
  `FinalBlowLines` (`{ brutal, quiet, ironic }`) — victory final-blow
  chronicle, picked by damage-tier shape; `PactLines` (`{ quiet,
  setDown, heavy }`) — friendship-pact chronicle, picked by parley
  posture (only meaningful when the enemy also carries a
  `friendshipReward`); `CauseLines` (`{ brutal, broken, quiet }`)
  — defeat / cause-of-loss chronicle. Three new additive-optional
  fields on `Enemy`: `finalBlowLines?` / `pactLines?` / `causeLines?`.
  Engine performs no variant selection or interpolation — fields
  are pure data; consumer (mobile presenter, CLI, future UI tabs)
  picks which variant to render based on outcome shape. Naming
  note: GH#65 source text used hyphenated `set-down`; field is
  `pactLines.setDown` (TS-identifier convention). Initial author
  coverage: MournfulGull (heart-aspected wistful — "slights" / "list"
  / "catalogue" thread), HollowEyedBeggar
  (faith-pessimistic-relational — "carrying" / "rags" / "phials"
  reversal thread), CoastalTyrant (magistrate-fallen-priest —
  "verdict" / "regalia" / "magistrate" thread). The remaining 13
  enemies in the library leave the three fields undefined and fall
  through to consumer-side defaults (e.g. mobile's `derive*Phrase`
  helpers); a future content-sweep phase will author them. Fixture
  bump: 162 → 165 type exports; runtime exports unchanged at 233.
  Hermetic e2e at `src/Enemy/e2e/aftermath-lines.engine.test.ts`
  (3 cases: registration shape + voice signatures + TidepoolCrab
  un-authored regression). Phase 71 commits: `61aa06c` (Unit 1 —
  types + barrels + fixture refresh) + `9365bb6` (Unit 2 —
  content authoring on the befriendable trio) + Unit 3 (this
  commit — hermetic e2e + docs/enemy + docs/api + README + bearings
  + CHANGELOG).

- **`FriendshipReward.alignmentDelta` extension (Phase 69 — closes Spec
  14 Q4).** New optional `alignmentDelta?: Partial<PhilosophicalAlignment>`
  field on the existing `FriendshipReward` type. When present, the
  END_COMBAT reducer applies the delta to `state.philosophicalAlignment`
  via the Phase 42 `applyAlignmentDelta` clamp helper (each axis
  clamps to `[-100, +100]`; missing axes pass through). The post-clamp
  `PhilosophicalAlignment` surfaces on
  `CombatEndReport.friendshipReward.alignmentShift?: PhilosophicalAlignment`
  for consumers to render (mirrors how `applyDialogueChoice` returns
  `effects.philosophicalShift`). Phase 36's +1 `moralMeter` shift remains
  unchanged on top — friendship resolutions now optionally shift BOTH
  axes per encounter. Authoring band: ±1..±5 per axis (matches Phase
  43's dialogue / map-event delta convention). First authored deltas:
  MournfulGull `{ outlook: +3 }` (wistful empathy); HollowEyedBeggar
  `{ scope: -3 }` (re-grounds toward the relational individual). No
  public-surface fixture change (additive optional field; no new
  exported type). Phase 69 commits: `a42709f` (Unit 1 — engine
  primitive + MournfulGull authoring + 4-case hermetic e2e) +
  Unit 2 (this commit — HollowEyedBeggar authoring + docs/combat +
  docs/enemy + Spec 14 Q4 flip + bearings + CHANGELOG).

- **Per-enemy befriend predicate (Phase 68 — `BefriendabilityConfig`).**
  New public type `BefriendabilityConfig` (`{ roundsThreshold?,
  hpGate?, requiredStances?, requiredSkillUse?, defaultFallback? }`)
  + optional `Enemy.befriendabilityConfig?: BefriendabilityConfig`
  field. When absent the Phase 36 mechanic
  (`friendshipCounter >= FRIENDSHIP_COUNTER_MAX`) is unchanged; when
  present, all named predicates AND-compose to gate the friendship
  outcome. Within a list-valued predicate (`requiredStances`,
  `requiredSkillUse`) the match is existential — at least one element
  must appear in the player's combat log. New internal helper
  `isFriendshipEligible` in `src/Combat/index.ts` is the single
  decision point; `determineCombatEnd` and `isCombatOngoing` both call
  it so the two predicates stay in lockstep (per Phase 68 D11 the
  helper is NOT on the public barrel — engine consumers read
  combat-end state through `determineCombatEnd`). Counter still
  increments freely on both-defend rounds; friendship triggers only
  when all predicates pass together, so a player can "bank" defends
  past `roundsThreshold` and have friendship trigger later (e.g. once
  `hpGate` clears via damage progress). See
  [`docs/combat.md` § "Per-enemy predicate (Phase 68 — `BefriendabilityConfig`)"](docs/combat.md#per-enemy-predicate-phase-68--befriendabilityconfig)
  for the override semantics. Phase 68 commits: `99a0cc9` (Unit 1 —
  engine primitive + hermetic e2e) + `73105dc` (Unit 2 — Coastal
  Tyrant boss-tier config + befriend.engine integration cases) +
  Unit 3 (this commit — docs + bearings + CHANGELOG).
  `scripts/public-surface.expected.json` grows from 161 → 162 types
  (runtime exports unchanged at 233).

### Changed
- **Apprentice preset `baseStats` buffed 3/2/2 → 5/5/5 (`ff53ea0`).** User-attended
  balance tuning ("just for now") — fishing-village early encounters were
  tuning out too punishing for the default starter. Lifts the baseline so the
  first map is approachable without a full enemy-side rebalance. Affects only
  `apprenticePreset` in `src/Character/presets.ts`; Wanderer (5/4/4) and Sage
  (7/6/6) unchanged. Revisit when enemy-side tuning is reconsidered.
- **CoastalTyrant gains a Phase 70 boss-tier `friendshipReward`.**
  First boss-tier authored reward; demonstrates the full
  Phase 60+62+68+69 stack on a single high-stakes encounter. `items`:
  Paradox Loop (unique circlet, `requiredLevel: 15` — endgame-aspirational
  reward the player can hold from this encounter onward) + healing-potion
  + heart-draught. `xpBonus: +75` (boss-tier weight vs the normal-tier
  +10/+15). Multi-paragraph narrative — the magistrate-fallen-priest's
  recognition + release ("you have made me a man with nothing to be king
  of"). `alignmentDelta: { outlook: +3, scope: -2 }` — recognition +
  release shift matching the archetype, inside the Phase 43 ±1..±5
  authoring band. `flagSet: 'befriended-coastal-tyrant'` (Phase 62
  convention; downstream dialogue / quest content can gate on this flag).
  The unique-item spawn uses a fixed-RNG `dropItem('paradox-loop', 15,
  'unique', () => 0.5)` so the reward is deterministic across reloads.
  Phase 70 commit: this commit. Closes the Boss-tier befriendable enemy
  candidate (Phase 60's most-named follow-up).

- **CoastalTyrant gains a Phase 68 befriend predicate.** First boss-tier
  authored `BefriendabilityConfig` (`hpGate: { belowPct: 0.4 }`,
  `requiredStances: ['heart']`, `roundsThreshold: 5`) — the
  magistrate-fallen-priest's friendship arc opens only after he's been
  brought low, the player has shown empathy at least once, and 5
  both-defend rounds have passed. Existing CoastalTyrant content
  (`philosophicalAlignment`, `procUnlocks`, `loot`, `skills`) is
  unchanged; the new field is purely additive. The matching
  `friendshipReward` content (multi-paragraph narrative + items + maybe
  `alignmentDelta`) is deferred to the boss-tier befriendable-enemy
  follow-up phase.

## [0.10.3] — 2026-05-20

Phase 58 (Spec 14 retroactive conversation-loop spec), Phase 59
(zero-residual docs gap audit), Phase 60 (befriendable-enemy content
arc — the only public-surface addition), Phase 66 (Tier 2 synergy
skills — second public-surface addition), Phase 67 (CLI quickstart
doc), plus iterate fixes addressing critique passes 24-29. Includes a
canonical **re-grounding migration guide** for consumers (e.g.
`axiomancer-mobile`) hitting "type X has no property Y" errors after
a bump — see the Migration notes below.

### Added
- **Tier 2 synergy skills (Phase 66).** New optional `Skill.synergy?:
  SkillSynergy` clause + matching `SynergyPredicate` interface (both
  on the public barrel; fixture grew 159 → 161 types). Synergy is
  evaluated by `executeSkill` after damage and before `combatEffects`;
  payload supports `bonusDamage` + `durationDamageMul` +
  `intensityDamageMul` + `resourceTokenDamageMul` (damage scaling),
  `consumeMatched` / `consumeAllResources` / `clearAllEffectsBothSides`
  (side effects), and `applyEffectOnFire` (effect type-swap). A new
  `SkillEvent` / `SkillPhaseEvent` variant `synergy-fired` surfaces
  the bonus damage, consumed effect ids, consumed-token count, and
  flag set for UI / agent rendering. **Five Tier 2 skills authored
  in the first batch**:
  - `resonance-bleed` (heart) — cross-stance duration amp keyed on
    `debuff_bleed` on target.
  - `intensity-feedback` (mind) — cross-stance intensity amp keyed
    on `buff_critical_rate_up` on caster.
  - `bat-swarm-thoughtform` (heart) — buff type-swap: consume
    `tier1_body_defend` on caster (≥5 duration) + apply
    `buff_max_hp_up`.
  - `resonance-burst` (mind) — consume `debuff_confusion` on target
    for damage proportional to intensity × duration.
  - `resonance-detonation` (heart) — apex burn; no predicate;
    consume the full combat-resource pool + clear all `ActiveEffect`s
    on both sides + deal damage proportional to consumed tokens.
  All five carry `learningRequirement: { level: 5 }`. See
  [`docs/skills.md` § "Tier 2 synergy (Phase 66)"](docs/skills.md#tier-2-synergy-phase-66)
  for the schema + per-skill table. Phase 66 commits: `25e3c28`
  (Unit 1 — engine primitive + executeSkill wiring) + `2f75ba0`
  (Unit 2 — 5 authored skills) + Unit 3 (this commit — e2e + docs).

- **Befriendable-enemy content arc (Phase 60 + Phase 62).** New
  public type `FriendshipReward` (`{ items?: Item[]; xpBonus?:
  number; narrative?: string; flagSet?: string }` — `flagSet?`
  added at Phase 62 unit 1 `adf4403`); optional
  `Enemy.friendshipReward?: FriendshipReward` field on the canonical
  Enemy shape; optional `CombatEndReport.friendshipReward?: {
  narrative? }` field on the combat report. Engine wiring: `store.endCombat()` threads the
  per-enemy reward through the `outcome === 'friendship'` branch —
  items append to `report.loot`, `xpBonus` adds to `report.xpGained`,
  `narrative` surfaces on the report for the CLI / UI. Two enemies
  ship authored rewards (MournfulGull + HollowEyedBeggar; Phase 60
  D2 — boss-tier deferred to follow-up). All additive + optional;
  existing consumers destructuring `{ outcome, xpGained, loot }`
  continue to work. Phase 60 commits: `7724c96` (Unit 1 — type +
  engine) + `6e03871` (Unit 2 — content) + `b13348b` (Unit 3 —
  hermetic e2e + docs + Knowledge-Gaps Q5 close).
  `scripts/public-surface.expected.json` grows from 158 → 159 types
  (runtime exports unchanged at 233).

- **NPC alignment observers (Phase 63).** Tree-level observation
  pattern for reactive dialogue: `DialogueTree.id?: string`
  (optional tree identifier) +
  `GameState.lastSeenAlignmentCells?: Record<string, string>`
  (additive optional cache, no `GAME_STATE_VERSION` bump per
  Phase 63 D2) + `DialogueChoice.requires.playerAlignmentCellChangedSince?:
  boolean` (reactive gate) + `DialogueContext.lastSeenAlignmentCellId?:
  string` (visibleChoices input).
  `applyDialogueChoice` writes the current alignment cell id to
  `state.lastSeenAlignmentCells[tree.id]` after each choice on
  identified trees; the gate surfaces a choice only when the
  player's CURRENT cell differs from the cached one. First
  authored use: Old Marrow's tree (`id: 'old-marrow'`) gains a
  reactive "Stand quietly. He looks up and sees who you have
  become." branch. Closes Spec 14 Q2 deferral. Phase 63 commits:
  `aa11262` (Unit 1 — engine primitive) + `664a5d0` (Unit 2 — Old
  Marrow content) + Unit 3 (this commit — e2e + docs). No fixture
  change (additive optional fields on existing exported types).

- **Quest-branch wire-in on `outcome === 'friendship'` (Phase 62).**
  `FriendshipReward.flagSet?: string` extension: when the befriended
  enemy carries the field, the END_COMBAT reducer appends the flag
  to `state.flags` (de-duped). Reuses the existing
  `DialogueChoice.requires.flag` / `visibleChoices` machinery —
  downstream dialogue branches + quest objectives gate on the flag
  with no new gate primitive. First authored use: MournfulGull's
  `friendshipReward.flagSet: 'befriended-mournful-gull'` unlocks a
  new dialogue branch on the Coastal Beggar's `greet` node
  ("I've been hearing the gulls quieter, lately."). Convention:
  `befriended-<enemy-id-stem>`. Phase 62 commits: `adf4403`
  (Unit 1 — type + reducer) + `c32e9fe` (Unit 2 — content) +
  Unit 3 (this commit — e2e + docs). Closes the Phase 60 D3 deferral.
  No fixture change (the field is on an existing exported type).

### Changed
- **Fishing-village starting map expanded (Phase 65).** The canonical
  starting map grew from a linear 10-node chain along the dockside to
  a 25-node branching grid with three sub-areas — Harbor District
  (`fv-11..fv-15`, dead-end at gull crag), Inland Streets
  (`fv-16..fv-20`, small loop `fv-17 ↔ fv-19`), and Cliff Path
  Headlands (`fv-21..fv-25`, dead-end at gull's nest). The original
  10-node spine `fv-1` → `fv-10` is preserved verbatim so all
  existing Phase 23/24 MapEventPool overrides, Phase 43
  `alignmentDelta` authoring, Phase 62 flag-gated dialogue, and
  Phase 63 observer wiring continue to function without modification
  (only `connectedNodes` extended, never replaced). 15 new
  `MapEventPool` consts registered in `FISHING_VILLAGE_POOLS`. All 8
  `MapEventKind` values now appear multiple times across the 25
  nodes. Phase 60 befriendable enemies (MournfulGull at `fv-15`
  gull crag; HollowEyedBeggar at `fv-18` back alley) are now
  discoverable in the world. No new public-API exports; pure content
  scale. See `docs/world.md` § "Demo Content (fishing-village)" for
  the layout. Phase 65 commits: `4f3b9ec` (Unit 1 — node structure +
  connections) + `e8d3b90` (Unit 2 — 15 MapEventPool authoring) +
  Unit 3 (this commit — e2e + docs).

- **`pickEnemySkill` no longer exported from
  `src/Enemy/enemy.logic.ts`** (iterate `c15d3fa`). Internal AI
  helper, never on the Enemy barrel or top-level barrel; mirrors the
  iterate-17e76b9 treatment of `applyOutlookBias`. No
  consumer-visible API change; the public path is
  `decideEnemyAction` which continues to consult `pickEnemySkill`
  internally. Phase 49 introduced both helpers; this drain closes
  the export-hygiene gap critique-25 flagged.
- **`src/Combat/e2e/combat.resolver.test.ts` renamed to
  `combat.resolver.engine.test.ts`** (iterate `7bf8115`). Aligns with
  the `.engine.test.ts` convention codified in
  `docs/testing.md:188-189`. All 33 e2e files under
  `src/**/e2e/*.engine.test.ts` now follow the canonical marker.
  Not a public-surface change; test entry-point only.

### Docs
- **`docs/quickstart.md` (Phase 67).** New single-page entry-point
  doc for someone landing on the repo without context. Covers
  module-by-module what's shipped (with Phase numbers), how to drive
  the CLI (tabs + scripted mode + walkthroughs), key in-game flows
  (combat / friendship path / map exploration / save-load /
  alignment gates), verify + deploy gates, and a "where to look when
  you want depth" table cross-linking to `docs/api.md`,
  `docs/testing.md`, `RELEASING.md`, the per-phase briefs, and
  `CHANGELOG.md` `[unreleased]` Migration notes for stale-consumer
  re-grounding. `README.md` adds a top-level cross-link. Pure docs
  assembly; no engine touch. Phase 67 single-commit.
- **Phase 64 endgame-loadout walkthrough** —
  `automation/scripts/walkthroughs/endgame-loadout.{json,goal.md}`.
  Demonstration-grade agent-graded script driving the Sage preset
  (level 15, Tier 1+2+3 skills) through a `bootstrap-paradox` Tier 3
  skill use against the Coastal Tyrant, exercising the interactions
  between Tier 3 skill content (Phase 33/44), equipped-skill rotation
  (Phase 18+30), enemy alignment AI bias (Phase 45), enemy-skill
  caster path (Phase 49), and boss combat resolution (Phase 15
  phases). NO new engine surface — pure walkthrough authoring;
  `automation/` is dev-only and doesn't ship in the published
  package per `package.json` `files`. Walkthrough README inventory +
  `docs/testing.md` agent-graded subsection updated.
- **`specs/14-philosophical-alignment.md`** — retroactive
  conversation-loop spec for the Phase 42-46 alignment system
  (Phase 58, `f103a8d`). All four open questions answered inline
  with shipped-code references; `specs/README.md` Recommended order
  gains row 14.
- **Phase 59 zero-residual docs gap audit** (`916cef8`) — single
  audit-summary commit confirming the older Docs-sweep candidate's
  9 row-groups all drained via /iterate ticks across May 19-20.
- **`docs/testing.md` "Continuous integration (Phase 56)"
  subsection** (iterate `b7a3fa6`) — names
  `.github/workflows/verify.yml`, the on-triggers, the assertion
  chain, the concurrency-group behaviour, and the
  no-publish-step-by-design caveat.
- **`spec.md` "Published npm release" Non-goal flipped to shipped**
  (iterate `0931ce8`) — 6-month-horizon entry annotated as shipped
  at v0.2.0 (2026-05-08); Non-goals replaced with the real current
  non-goal (v1.0.0 stable-API stamp before spec contracts settle).
- **Front-door currency refreshes** — `README.md` Items row gains
  Phase 37 shop economy + Phase 54 set items + Phase 60
  FriendshipReward (iterates `650f2b2` + `59a0439`);
  `plan/bearings.md` Enemy public-api block gains FriendshipReward
  (iterate `59a0439`); `scripts/README.md` Fixture section
  freshened ("HEAD, post-Phase-60: 233 runtime + 159 types" per
  iterate `9bed952`); `docs/api.md` `CombatEndReport.friendshipReward`
  surfaced (Phase 60 Unit 3 `b13348b`).
- **`src/Game/e2e/befriend.engine.test.ts` simplification** (iterate
  `e5d1799`) — Phase 60 victory-regression compound assertion
  dropped (−3 LOC; no coverage loss).

### Migration notes

**From `0.10.2` to `[unreleased]`:** none required. All additions are
optional; existing consumers continue to compile.

**Re-grounding consumer-side types.** If a consumer (e.g. mobile,
or any external TypeScript client) is hitting "Property X does not
exist on type Y" errors after a bump, the issue is almost always
**stale local type definitions drifting against the engine's
canonical shipped shape**, not a fresh regression. The table below
gives the canonical replacement for every removed / renamed symbol
the `axiomancer-mobile` consumer surfaced at issue #93:

| Symbol (consumer expected) | Canonical replacement | When removed |
|---|---|---|
| `getCoastalMap()` | `getMapDefinition('coastal-continent', mapName)` + `createMapState(definition)` | iterate `b85f509` (post-v0.10.0) |
| `WorldMap` type alias | `MapDefinition` (authored shape) + `MapState` (runtime instance) — Phase 23 split | iterate `a707316` (post-v0.9.0) |
| `Encounter.enemy` single-enemy field | `Encounter.enemies: Enemy[]` (length 1 today; designed for multi-enemy fights) | Pre-v0.7.0 — v0.7.0 already shipped the array shape |
| `DialogueChoice.id` / `.label` | Track by **index** in `DialogueNode.choices[]`; `DialogueChoice.text` is the human-readable label | Pre-v0.7.0 — current shape has `text` + `effect?` + `requires?` only |
| `DialogueNode.speaker` | Source from the parent `NPC.name` (the dialogue tree is owned by an NPC) | Pre-v0.7.0 — current `DialogueNode` carries `text`, `choices?`, `flag?` |
| `Character.mana` / `.maxMana` | `CombatState.combatResources` (per-stance Spec 04 tokens); the player's combat resource pool lives on the active `CombatState`, not `Character`. Out-of-combat there is no mana — the engine doesn't track resource carry-over between encounters. | Pre-v0.7.0 — `mana` was never on the canonical `Character` shape per Spec 06 |
| `ActiveEffect.id` / `.name` | `activeEffect.effectId: string` references back to `lookupEffect(effectId).name` (the library entry carries the display name) | Pre-v0.7.0 — current `ActiveEffect` is the runtime instance; library lookup is the canonical name source |
| `EffectStatTarget` accepting arbitrary strings | Use the canonical literal-union members (`'body'` / `'mind'` / `'heart'` / `'maxHealth'` / `'physicalDefense'` / `'magicalDefense'` / etc. — see `src/Effects/types.ts` for the exhaustive list) | Pre-v0.7.0 — tightened to a literal union per Spec 01 |
| `GameState` accessed via string index (`state[key]`) | Read explicit fields from the documented shape: `version`, `player`, `world`, `combat`, `quests`, `flags`, `moralMeter`, `rngState`, `philosophicalAlignment`. Only `flags: Record<string, boolean>` is a string-indexed slot. | Pre-v0.7.0 — explicit-fields shape since Spec 09 |

**Authoritative shape pointers.** When in doubt about what the
engine's public surface actually looks like, consult in order:

1. `src/index.ts` — the top-level barrel; this is what `import {
   X } from 'axiomancer-mechanics'` resolves to.
2. `dist/index.d.ts` (after `npm run build`) — the consumer-facing
   `.d.ts` view of the barrel.
3. `scripts/public-surface.expected.json` — the deploy-gate fixture
   (Phase 53); canonical truth from 0.10.1 forward.
4. `node scripts/diff-public-surface.mjs <ref-A> <ref-B>` — emits
   per-tag deltas in markdown form. Both refs must contain the
   fixture (Phase 53 introduced it).

For the `v0.10.2` → `v0.10.3` delta, the public-surface changes
were the Phase 60 `FriendshipReward` type addition (158 → 159) plus
the Phase 66 `SkillSynergy` + `SynergyPredicate` type additions
(159 → 161). `v0.10.3` shipped with 233 runtime exports + 161 type
exports. Phase 68's `BefriendabilityConfig` (+1 type, 161 → 162)
ships with the next bump and belongs in `[unreleased]` only.

## [0.10.2] — 2026-05-20

Phases 55, 56, 57 — PersistenceAdapter docs/contract, CI verify
workflow, enemy skill-rotation content. No new public-API names; the
public-surface fixture is unchanged (still 233 runtime values + 158
types). Consumers see this as a behaviour bump only (enemy combat
depth + a CI gate).

### Added
- **PersistenceAdapter extension pattern docs (Phase 55).**
  `src/Game/persistence/types.ts` JSDoc extended with the recommended
  pattern for async backends (preload / flush / clear lifecycle
  helpers), citing `axiomancer-mobile`'s `AsyncStorageAdapter` as the
  reference implementation. `docs/gameloop.md` persistence subsection
  gains an "Extending PersistenceAdapter for async backends" block.
- **Compile-time PersistenceAdapter contract test (Phase 55).**
  `src/test-utils/e2e/public-barrel.engine.test.ts` gains a Phase 55
  describe block asserting `nullAdapter` is value-exported with the
  canonical two-method shape, plus a `FakeAsyncAdapter extends
  PersistenceAdapter` compile-check that breaks at type-check if the
  interface shape ever drifts.
- **CI verify workflow (Phase 56).** `.github/workflows/verify.yml`
  runs `npm run verify` + `npm run deploy:check` on every pull
  request against `main` and every push to `main`. Node 20, `npm
  ci`, setup-node cache. Concurrency group cancels in-progress runs
  on the same ref. No auto-publish step (manual + attended per
  `RELEASING.md`).
- **Enemy skill rotations (Phase 57).** 7 of 16 registry enemies now
  carry a skill rotation read by `pickEnemySkill` (Phase 49) —
  Tidefluke Reaver → `straw-giant`, Hush-Wraith →
  `sorites-cascade`, Hollow Saint → `pascals-wager`, The
  Disagreement → `liars-echo`, Echo of Pyrrhonia → `eternal-regress`,
  Mournful Gull → `appeal-to-pity`, Hollow-Eyed Beggar →
  `pascals-wager`. Tidepool Crab / Sea-Mist Wisp / Lullaby Moth
  intentionally stay skill-less for early-game pacing. `docs/enemy.md`
  Skill-use table grows from 2 → 9 rows.

### Notes
- No new public-API exports vs `0.10.1`; the
  `scripts/public-surface.expected.json` fixture is unchanged (still
  233 runtime values + 158 types). Consumers see this as a behaviour
  bump only (enemy combat depth + a CI gate).
- Migration: none.

## [0.10.1] — 2026-05-20

Engine handoff to `axiomancer-mobile`, autosave throttling, release-process
artefacts, public-surface contract enforcement, Set items engine. The first
published version under the CHANGELOG-tracked release process.

### Added
- Top-level barrel re-exports `skillLibrary` + `getSkillById` from
  `./Skills` (Phase 50 unit 1). External consumers
  (`import { skillLibrary } from 'axiomancer-mechanics'`) now resolve to
  the live skill library instead of `undefined`.
- Top-level barrel re-exports the 4 Combat aggregators
  `getActiveEffectModifiers`, `getEffectiveStats`, `canAct`,
  `resolveEffectiveAdvantage` + types `AggregatedEffectModifiers`,
  `EffectiveStats` (iterate `7ee0745`). `docs/effects.md` "API at a
  glance" is now reachable from the public barrel.
- `defaultSellPrice(ware: ShopWare): number = Math.floor(ware.price / 2)`
  engine helper in the Items barrel (iterate `3ba5319`). Replaces the
  CLI-side `Math.max(1, ...)` floor that enabled a buy/sell exploit on
  price-≤-2 wares.
- `dist/<Module>/types.d.ts` now emits for all 11 modules (Phase 50 unit
  2). Pre-fix only `Items` emitted; the other 10 modules' `types.d.ts`
  files were authored as `.d.ts` and tsc silently skipped them. Rename
  to `types.ts` was the fix.
- **Set items engine (Phase 54).** New top-level barrel exports:
  - Types: `SetBonus`, `ItemSet`.
  - Engine helpers: `getActiveSetBonuses`,
    `getActiveSetBonusesForCharacter`, `aggregateSetStartTokens`,
    `applySetGenerationBonus`, `getActiveSetPassiveEffectIds`,
    `getEquippedItemSets`.
  - Library: `itemSetLibrary` + `getItemSetById`.
  - Authored sets in `itemSetLibrary`: Wanderer's Road (2-piece
    sandals + leather-cap → `+2 heart` start tokens); Iron Discipline
    (3-piece leather-cap + cloth-wrap + cloth-gloves → `+3
    physicalDefense` at 2, `+1 body/any` at 3); Scholar's Circle
    (2-piece copper-ring + leather-cap → `+2 mind` start tokens +
    `buff_critical_rate_up` passive).
  - Set bonuses are computed on-demand at `initializeCombat` +
    `generateBasicActionResources`; set `passiveEffects` apply as
    combat-lifetime `ActiveEffect`s with `remainingDuration: -1` and
    `sourceId: 'set-bonus'` (`tickAllEffects` skips the tick).
- **CHANGELOG.md + RELEASING.md** (Phase 52 — this document, plus the
  bump-and-publish flow doc at the repo root with deprecation
  lifecycle policy).
- `scripts/deploy-check.mjs` gains three new assertions across this
  release:
  - `dist/<Module>/types.d.ts` count guard (Phase 50 unit 2 — fails the
    gate if the count drops below the source-side `types.ts` count).
  - Tag / CHANGELOG agreement (Phase 52 unit 2 — fails the gate if
    `git describe --tags --abbrev=0` doesn't match the top tagged
    `## [X.Y.Z]` heading in `CHANGELOG.md`; `(unreleased)` headings are
    skipped).
  - Public-surface fixture drift (Phase 53 unit 2 — fails the gate if
    the snapshot of `dist/index.d.ts` diverges from the committed
    fixture at `scripts/public-surface.expected.json`).
- **Public-surface tooling (Phase 53).**
  `scripts/snapshot-public-surface.mjs` reads `dist/index.d.ts` and
  emits the deterministic-sorted JSON contract.
  `scripts/diff-public-surface.mjs <ref-A> <ref-B>` pretty-prints
  Added / Removed / Changed-kind in markdown form for direct paste
  into a CHANGELOG entry. The committed fixture
  `scripts/public-surface.expected.json` captures the current public
  barrel (233 values + 158 types as of this release).

### Changed
- **Autosave policy** (Phase 51) — `src/Game/store.ts` restricts
  write-through to a curated `DURABLE_ACTIONS` allowlist
  (`COMBAT_ROUND`, `LEVEL_UP`, `END_COMBAT`, `MOVE_TO_NODE`,
  `APPLY_DIALOGUE`, `SAVE_GAME`). UI-tier actions (`USE_ITEM`,
  `EQUIP_ITEM`, `ALLOCATE_STAT_POINT`, `LEARN_SKILL`,
  `SHIFT_MORAL_METER`, `SHIFT_PHILOSOPHICAL_ALIGNMENT`,
  `START_COMBAT`, `PROCESS_NODE`, `LOAD_GAME`) no longer trigger
  autosave. The constant is internal to `src/Game/store.ts` (not on
  the public barrel); consumers see fewer writes, not a different
  payload. `store.save()` and `updateCombat()` keep their
  unconditional writes per the Phase 51 brief D2 / D3.
- **`scripts/deploy-check.mjs`** is now a meaningful gate, not just an
  `npm pack` wrapper — it runs three structural assertions before the
  pack dry-run (types.d.ts count, tag/CHANGELOG match, public-surface
  drift).
- `src/Items/e2e/equipment.engine.test.ts` "Game store lifecycle"
  assertion flipped: `equipItem` / `unequipItem` no longer call
  `adapter.save` under the Phase 51 DURABLE_ACTIONS policy. (Test
  assertion correction, not an API change.)

### Fixed
- **Phase 54 Scholar's Circle set passive expiry** (iterate
  `f250ce4`). The initial Phase 54 ship applied set-bonus
  `passiveEffects` via `applyEffect` with no duration override, which
  let the passive (`buff_critical_rate_up`, default duration 4) expire
  mid-combat at round 5 — violating Spec 05e Q4. The fix constructs
  the ActiveEffect directly with `remainingDuration: -1` (the engine's
  infinite-duration sentinel that `tickAllEffects` skips), so set
  passives survive arbitrary combat lengths. Combat-end cleanup
  discards the cloned player, so persistence stays naturally
  combat-scoped.

### Migration notes
- **Consumers using `import { skillLibrary } from 'axiomancer-mechanics'`**
  can drop any local stop-gap re-declarations (e.g. mobile's
  `state/mocks/combat.skills.fixture.ts`). The import resolves to the
  live library as of 0.10.1.
- **Consumers persisting saves through `adapter.save`** see no schema
  change; the savings come from fewer write calls, not from a different
  payload. Any UI relying on "every action writes to disk" should
  invoke `store.save()` explicitly when it needs a checkpoint.
- **Consumers building custom equipment-screen UIs** may want to import
  the new Phase 54 surface (`getEquippedItemSets` for an "active sets"
  summary, including partial counts).
- **Future release authors**: `node scripts/diff-public-surface.mjs
  <prior-tag> HEAD` (once the fixture exists at both refs) emits the
  Added / Removed bullets in markdown ready to paste here. The
  `v0.10.0` predecessor doesn't carry the fixture, so this release's
  bullets were authored from the per-phase briefs; from `0.10.1`
  forward, the diff tool is the canonical source.

## [0.10.0] — 2026-05-19

The Philosophy bundle (Phases 42-49). Adds the 3-axis alignment cube +
content authoring surfaces + enemy-skill caster path. Breaking removals
for `WorldMap` and `getCoastalMap`.

### Added
- **Philosophy module (Phases 42-46).** New top-level barrel exports:
  - Engine: `bucketAxis`, `getAlignmentCell`, `applyAlignmentDelta`,
    `defaultAlignment`.
  - Constants: `AXIS_HIGH_THRESHOLD`, `AXIS_LOW_THRESHOLD`.
  - Library: `philosophicalAlignmentLibrary` (27 cells, each with
    philosopher + literary character + 3 signature fallacies).
  - Types: `PhilosophicalAlignment`, `AxisBucket`, `AlignmentFallacy`,
    `PhilosophicalAlignmentCell`, `AlignmentGate`.
- `GameState.philosophicalAlignment: PhilosophicalAlignment` field
  (Phase 42). `GAME_STATE_VERSION` bumped 4 → 5;
  `migrateV4toV5` defaults legacy v4 saves to
  `{ epistemology: 0, outlook: 0, scope: 0 }`.
- `SHIFT_PHILOSOPHICAL_ALIGNMENT` action + store action
  `shiftPhilosophicalAlignment(delta)` mirroring `shiftMoralMeter`.
- **Authoring surfaces (Phase 43).**
  `DialogueChoice.effect.alignmentDelta?: Partial<PhilosophicalAlignment>`
  +
  `MapEventPoolEntry.alignmentDelta?: Partial<PhilosophicalAlignment>`.
  Surfaced on `ApplyDialogueChoiceResult.effects.philosophicalShift`
  and `ResolveMapEventResult.effects.philosophicalShift`.
- **Fallacies-as-spells (Phase 44).** `Skill.sourcedFromCell?: string`
  + `Effect.sourcedFromCell?: string` cross-link. 4 new Tier 3 fallacy
  skills (`appeal-to-consequences`, `nirvana-fallacy`, `pascals-wager`,
  `appeal-to-fear`); 3 new fallacy status effects
  (`debuff_no_true_scotsman`, `buff_special_pleading`,
  `debuff_category_error`).
- **Enemy alignment + outlook AI bias (Phase 45).**
  `Enemy.philosophicalAlignment?: PhilosophicalAlignment` field;
  outlook-driven flip between `attack` ↔ `defend` per
  `applyOutlookBias` (internal helper; not on the public barrel).
- **Alignment-gated content (Phase 46).**
  `DialogueChoice.requires.requiresAlignment?: AlignmentGate` +
  `SkillLearningRequirement.requiresAlignment?: AlignmentGate`.
  Optional `alignment` parameter on `meetsLearningRequirement`,
  `getAvailableSkills`, `learnSkill`. Optional
  `DialogueContext.alignment?` field on `visibleChoices`.
- **Enemy-skill caster path (Phase 49).** `executeSkill` 4th argument
  `casterSide: 'player' | 'enemy'` (default `'player'`).
  `decideEnemyAction` now consults `pickEnemySkill(enemy)` before
  per-strategy dispatch. 2 authored enemy rotations (Argumentative
  Crow → `false-dilemma`, Coastal Tyrant → `achilles-gambit`).
- `ActiveEffect.sourceId?: string` (Phase 38). Last-writer-wins
  stacking on intensity / duration; tracks which item / skill /
  passive applied the effect.
- `selectCritDamage(base, reduction, bonus)` Combat helper for crit
  damage preview UIs (Phase 32 era; re-exported for power-user
  consumers).
- `buyItem` / `sellItem` shop reducers + types `ShopWare` /
  `ShopInventory` (Phase 37).
- `unlockAdjacent` world reducer (Phase 31). Discovery shifts the
  fog; unlocking lets the CLI / UI actually offer the next ring as
  navigable.
- Spec 23 (map-events) acceptance fully ticked through Phase 41 unit 3
  + Phase 43 `alignmentDelta`.

### Changed
- `executeSkill` signature gained optional `casterSide` (Phase 49 D1).
  Default `'player'` — backwards-compatible for all pre-0.10.0
  callers.
- `ApplyEffectOptions` gained optional `sourceId` (Phase 38). Additive;
  the field is `undefined` when callers omit it.

### Removed
- **`WorldMap` type** (commit `a707316`). Replacement is
  `MapDefinition` + `MapState`, the canonical split since Phase 23. No
  in-repo consumers; mobile didn't import it.
- **`getCoastalMap()` registry helper** (iterate `b85f509`,
  post-tag oversight authorization). Replacement is
  `getMapDefinition('coastal-continent', mapName)` +
  `createMapState(definition)`. Mobile call sites at
  `axiomancer-mobile/state/actions.ts:29,759` +
  `state/e2e/exploration.engine.test.ts:11` need the replacement at
  bump time (flagged in the b85f509 commit body). See the
  `[unreleased]` Migration notes for the canonical re-grounding
  table.

### Migration notes
- **Persisted `GameState`** gains `philosophicalAlignment`.
  `migrateV4toV5` runs automatically on `load()`; v4 envelopes default
  to `{ epistemology: 0, outlook: 0, scope: 0 }`. Consumers persisting
  via `adapter.save` see the new field on every save going forward.
- **`WorldMap` removal** is a public-barrel deletion. Replace with
  `MapDefinition` + `MapState`.

## [0.9.0] — 2026-05-16

Phases 26 → 38 surface. CLI consolidation, RN-targeted event
emitter, ActiveEffect.sourceId wiring, agent-graded test harness.

### Added
- Phase 26: `src/CLI/game.cli.ts` consolidated CLI driver with
  tabbed interface (Map / Combat / Character / Inventory / Save / Load
  / Debug). Replaces the per-feature CLIs.
- Phase 27: `--save-file <path>` flag + Save / Load tabs surface the
  persistence layer as a user-facing save slot.
- Phase 28-29: Character progression (Phase 28 levelling math, Phase
  29 stat-allocation prompt).
- Phase 30: `LEARN_SKILL` action + `learnSkill(character, skillId)`
  pure reducer + `meetsLearningRequirement` + `getAvailableSkills`.
- Phase 31: `unlockAdjacent` reducer (precursor to the 0.10.0 surface
  re-export).
- Phase 32: Crit damage formula + `isCriticalHit` / `isCriticalMiss`
  helpers.
- Phase 33-34: Docs sweep (per-module `docs/*.md` rationalisation).
- Phase 35: `Character.id` auto-generation for save-load identity
  tracking.
- Phase 36: Friendship-victory mechanics (`combat:befriended` outcome
  + +1 moral meter + half-XP / full-loot).
- Phase 37: Shop economy — `buyItem` / `sellItem` reducers, village
  MapEvent shop payload, CLI `shopLoop`.
- Phase 38: `ActiveEffect.sourceId` field on `applyEffect`.
- Phase 39: `automation/agent-vitest-reporter.mjs` custom Vitest
  reporter + `npm run verify:agent` + structured
  `automation/last-verify-report.json`.

### Changed
- Phase 26 CLI consolidation removed several per-feature CLI files
  (`combat.cli.ts`, etc.).

## [0.8.0] — 2026-05-16

Phases 09 → 25 surface. Game loop orchestration, RNG seeding, package
architecture, story content, MapEvents engine.

### Added
- Phase 09: `gameReducer` dispatch spine + `createGameStore` Zustand
  wrapper + `game.cli.ts` end-to-end demo (Spec 09).
- Phase 10: Moral meter (`moralMeter` field, `shiftMoralMeter` action,
  per-clause clamping, Spec 10 acceptance).
- Phase 11: RNG seeding (`setRng`, `getRng`, `mockFixedRng`,
  `mockAlternatingRng`, `mockSequentialRng`) + `rngState` field on
  `GameState`. Deterministic test harness (Spec 11).
- Phase 12: Package architecture cleanup (`src/index.ts` barrel
  rationalised, event surface documented for RN consumers per Spec 12).
- Phase 13: ESLint fix (`eslint.config.mts` + `@typescript-eslint`
  plugin wiring).
- Phase 14: Story content — first named NPC (Old Marrow) with moral
  dialogue tree.
- Phase 15: Combat resolver split into per-phase helpers
  (round-start, action-restriction, advantage, stance-effects,
  scenario, round-end).
- Phase 17: Removed legacy Python `combat-test.py` pexpect harness.
- Phase 21: Event emitter (`createEventEmitter`,
  `GameEventEmitter`) + typed event stream.
- Phase 22: Authoring helper skills for content / character / world.
- Phase 23-25: MapEvents engine (`resolveMapEvent`,
  `MapEventPool`, `registerMapEventPool`, 8 event kinds: `encounter`,
  `interaction`, `gathering`, `rest`, `village`, `cutscene`, `hazard`,
  `loot-cache`). Phase 25 retired the legacy `processNode` surface.

### Removed
- Legacy `processNode` and `MapEvent` / `MapEventType` types (Phase
  25). Replacement is the MapEvents engine.

## [0.7.0] — 2026-05-15

Pre-loop final point. Last major bundle before the autonomous-loop
era began. Mobile's current pin (as of 2026-05-19).

### Added
- Pre-loop Specs 04 (Skills engine), 04b (Skills library), 05
  (Equipment engine), 05b (Equipment library), 05c (Item rarity),
  05d (Modifier catalogue), 06 (Character progression), 07 (Enemy
  library + AI), 08 (World content + hazards) all live.
- `Equipment.setMembership?: string` stub for the deferred Spec 05e.

### Changed
- (Pre-loop history — see `git log v0.6.0..v0.7.0` for the full
  surface delta.)

## [0.6.0] — 2026-05-15

Pre-loop. Equipment engine + library + item rarity + modifier
catalogue (Specs 05 / 05b / 05c / 05d).

## [0.5.0] — 2026-05-13

Pre-loop. Skills engine + library (Specs 04 / 04b).

## [0.2.0] — 2026-05-08

Initial published surface. Effects engine (Spec 01), Combat round
resolver (Spec 02), Tier 2/3 effect procs (Spec 03).

---

For the publish flow + deprecation lifecycle policy, see
[`RELEASING.md`](./RELEASING.md).
