# Bearings — axiomancer-mechanics

> Standing context for every command invocation. Read this
> alongside the relevant skill file (`skills/<name>.md`) and
> the matching phase brief. If anything here changes, update in
> the same commit.

## What we're building

`spec.md` at the repo root is the product spec. TL;DR:

> A TypeScript turn-based RPG combat engine with philosophical themes,
> consumed as an npm library by a React Native app.

The engine covers characters, enemies, combat (Heart/Body/Mind stances),
status effects (Tiers 1–3), skills, equipment, world navigation, quests, and
a full game loop. The React Native UI is out of scope for this repo.

**Package name is lowercase, always: `axiomancer-mechanics`.**

**Live at:** not applicable — npm library, not hosted.

## Design doctrine (load-bearing)

**Status effects are the MAIN fun and the most engaging aspect of combat encounters.**
(Set 2026-06; see `VISION.md` → Combat vision.) Balance, tuning, and content
work optimise first for status-effect-centric play — applying and exploiting
effects should be the dominant winning path, not basic-attack trading. Both
balance loops treat low status-effect engagement as a balance failure even when
win/loss rates look healthy: `legacy-combat-tuning` (turn-based combat) and
`combat-tuning` (Spec 25 Hazard-Pattern Combat, where status-as-win-path is
structural — `simulateHazardPatternCombat` is its witness).

## Surface

**Surface:** `library`

No web UI; asset capability disabled. Critique skill runs a
code-quality audit, not a live-site observer pass.

## Auth

**Auth:** `none` — no web UI, no auth surface to walk.

## Stack (locked — do not re-litigate)

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript strict | Existing codebase, type safety for game state |
| Package manager | npm | Existing; do not switch to pnpm |
| Build | `tsc && tsc-alias` | Path-alias resolution for clean module imports |
| Type-check | `tsc --noEmit` | Reliable static analysis |
| Test runner | Vitest | Fast, ESM-compatible, hermetic e2e pattern established |
| Lint | ESLint flat config + `@typescript-eslint` plugin | Repaired in Phase 13 |
| Structured data | `none` | Pure library — no records, no DB |
| Hosting | none | Library; no deployment target yet |
| State management | Zustand vanilla store | Consumer-facing store for the React Native app |

## CLI / API contract (locked)

The barrel at `src/index.ts` is the public contract. These groups are
**locked** — do not remove or rename exports:

```
Character:  createCharacter, Character, BaseStats, DerivedStats, NonCombatStats
            (+ computeEquipDelta + EquipDelta / EquipDeltaMode / EquipDeltaSide
            types — Phase 154 equip-change delta model absorbed from the mobile
            app; simulates an equip/unequip through the reducers and diffs the
            resulting stats so a client shows only what changes),
            (+ levelLadderPresets + ladderL1Preset / ladderL15Preset /
            ladderL30Preset / ladderL50Preset — level-explicit evidence ladder
            (L1/L15/L30/L50), separate from characterPresets)
Enemy:      createEnemy, Enemy, EnemyLogic, decideEnemyAction, randomLogic,
            enemyStatBudget,
            FriendshipReward (+ Enemy.friendshipReward? — Phase 60;
            + flagSet? extension — Phase 62;
            + alignmentDelta? extension — Phase 69 closes Spec 14 Q4),
            BefriendabilityConfig (+ Enemy.befriendabilityConfig? — Phase 68),
            FinalBlowLines / PactLines / CauseLines (+ Enemy.{finalBlowLines,
            pactLines, causeLines}? — Phase 71 closes GH#65 ask 1),
            CodexEntry (+ Enemy.journalEntry? — Phase 73 closes GH#65
            ask 3; auto-unlocks on friendship outcome)
            (+ named logic constructors — aggressiveLogic, defensiveLogic,
            balancedLogic, strategicLogic, bossLogic; stance helpers —
            counterStanceOf (returns the counter-stance for RPS advantage),
            weakestStanceOf (returns the weakest stance given a target stance);
            loot/XP helpers — rollLootMany (multi-roll variant of rollLoot),
            DEFAULT_XP_BY_DIFFICULTY (constant map: difficulty → base XP reward))
Combat:     determineAdvantage, getBaseStat, getAttackStat, getDefenseStat, getSaveStat,
            applyDamage, heal, healCharacter, isAlive, isDefeated, getHealthPercentage,
            getStudyMarkIntensity, tickAllEffects, updateEffectDuration,
            removeRandomBuff, extendRandomBuffDuration,
            applyRegen, getActiveRollModifier, getThornsReflect,
            getActiveEffectModifiers, getEffectiveStats, canAct,
            resolveEffectApplication, calculateDamageResistance, getSkillDamageType,
            determineEnemyAction, isCombatOngoing, determineCombatEnd,
            calculateEnemyStatMultiplier, applyMoralMeterScaling,
            isValidCombatAction, Stance, Action, CombatState, Combatant,
            Advantage, CritStyle, CombatAction, CombatPhase,
            BattleLogEntry, AggregatedEffectModifiers, EffectiveStats, DamageType
            (+ Phase 80 always-land: Tier 2 debuff + Tier 3 always land;
            target-resist roll removed; only Tier 2 buff caster fumble/crit
            survives. SkillEvent `effect-resisted` renamed `buff-fumbled`,
            `effect-rebounded` removed — Phase 84)
            (+ Phase 82 CLI consumer: codexTab + resetTab in game.cli.ts;
            Phase 85 combat-tuning audit confirmed Q1/Q2/Q4/Q6/Q26 canonical)
            (+ Spec 25 Hazard-Pattern Combat engine — card-and-dice driver that
            ships ALONGSIDE resolveCombatRound: initializeCombatEncounter,
            playCombatCard, resolveCombatPhase, processBetweenPhases,
            simulateHazardPatternCombat + the CombatEncounterState / CombatCard
            type family. HP is the SOLE win condition (Spec 26/26b, 2026-06-22):
            DoT erodes HP far faster than the weak basic strike; control hinders
            the enemy's turn. CombatPressureTracks / the two pressure tracks were
            REMOVED. Doctrine-central.)
            (+ Spec 26/26b depth layer on the Hazard engine — per-turn 2-die
            stance DRAFT + hidden-stance READ (startTurn, draftStanceDie, endTurn,
            resolveRead, chooseDraft, discardCombatCard, getDraftedDie,
            isPhaseStanceRevealed, revealedCurrentStance, cardReadPreview,
            projectCardImpact; tuning READ_DAMAGE_MULT,
            CONVICTION_PER_UNPICKED_DIE, CONVICTION_READ_WIN_BONUS,
            COLOR_MATCH_DAMAGE_BONUS, TURN_DICE_COUNT, rollTurnDice, dieHasStance,
            deriveIntentType); authored threat-sequence read API (getThreatSequence,
            generateDefaultThreatSequence, AUTHORED_THREAT_ENEMY_IDS — read-only
            array of 61 enemy slugs with authored threat sequences); always-available CONVICTION-funded Signature Skills
            (playSignatureSkill, getSignatureSkill, SIGNATURE_SKILLS,
            SIGNATURE_SKILL_LIST, SIGNATURE_KITS, signaturesForArchetype,
            playerArchetype); deckbuilder card rewards (COMBAT_REWARD_POOL,
            STARTING_SKILL_ID, STARTING_SKILL_IDS, rollCombatCardRewards, addRewardCard,
            unlockSkillViaDilemma) + types CombatIntentType / CombatReadResult /
            SignatureSkill / SignatureSkillId / SignatureSkillKind / PlayerArchetype.
            Reading the hidden stance boosts card damage + earns Conviction — the
            read IS the efficiency lever for status play. Note "Spec 26b" is in-flight scaffolding with
            no spec file yet (distinct from specs/26-catalyst-multiplicative-scaling.md).)
            (+ PR #190 partial Press Fate re-roll (2026-06-23) — rerollSpentDice,
            hasRerollableDice, dieIsRerollable (combat.dice); preset combat decks —
            COMBAT_DECK_PRESETS, COMBAT_DECK_PRESET_ORDER, listDeckPresets,
            getDeckPreset, buildPresetDeck (combat.deck-presets) + types
            CombatDeckPreset / CombatDeckFocus.)
            (+ synthetic card ids — SYNTHETIC_CARD_IDS (readonly string[], currently
            ['card-retreat']), isSyntheticCard (combat.cards) — built-in non-deck
            cards injected by the deck builder; filtered out of reward drafts.)
            (+ gold (rare) cards / GUARD mechanic — GOLD_CARD_IDS (ReadonlySet<string>
            of the three rare card ids: 'pyrrhic-victory', 'the-final-word',
            'unmoved-mover'); isGoldCard(cardId) — boolean predicate; CardEffectKind
            ('dot' | 'control' | 'none') — the status-payload classification used by
            classifyVerbClass and CombatCard.effectKind. A WILD die on a gold card
            always reads advantage; 'brace-for-impact' is the baseline GUARD defense
            card included in STARTING_SKILL_IDS.)
            (+ die-cost helpers — resolveCardDieCost(cardColor, enemyPhaseStance)
            → CardDieCost { cost, advantage } (RPS-based die cost for playing a card);
            cardDieCostPreview — read-only preview variant for UI rendering;
            CardDieCost — named type export (importable as
            `import type { CardDieCost } from 'axiomancer-mechanics'`).)
            (+ Spec 25 engine/deck-build helpers — COMBAT_DICE_COUNT / COMBAT_HAND_SIZE /
            COMBAT_DIE_FACES (tuning constants); rollCombatDice (rolls the initial die pool);
            combatDieCanPower (die-affordance check); refreshOneDie (refresh a single spent
            die); toCombatCard (skill → CombatCard converter); projectDeck (hand-projection
            read); classifyVerbClass (card intent classifier); buildCombatDeck (deck assembly).)
            (+ Spec 25 encounter/UI helpers — rollEncounterDice (rolls colored mana dice at
            phase start); resolveThreatPhase (resolves enemy threat phase — Clear/Overwhelmed
            ledger); selectEncounterMercyChoice (opens Befriend mercy choice, Phase 112 logic
            intact); getCard / handCards / availableDice (read-only UI previews for hand and
            die affordances — mobile calls these to render the combat UI); buildCombatSummary
            (end-of-fight CombatSummary with per-effect CombatAttributionRow / LandedEffect
            attribution rows); CombatSummary / CombatAttributionRow / LandedEffect — named
            type exports for the attribution view (importable as
            `import type { CombatSummary } from 'axiomancer-mechanics'`).)
            (+ soft-control / stat-debuff threat tunables — THREAT_WEAKEN_PER_ROLL (number,
            default 0.06 — fraction of incoming hit reduced per point of enemy roll penalty);
            THREAT_DENY_AT (number, default 8 — cumulative roll penalty at which the enemy
            turn is fully denied); THREAT_WEAKEN_FLOOR (number, default 0.4 — minimum damage
            multiplier when weakened but not denied). Used by resolveThreatPhase; consumers
            can read these to display soft-control thresholds in the UI.)
            (+ 0.34.0 status-depth epic — HP-model selectors + tunable scalars:
            getDamageTakenMultiplier (incoming-damage multiplier for a combatant given
            active vulnerability effects); getPendingDotTotal (sums pending DoT across all
            active effects — basis for AMPLIFY burst); consumeDotEffects (removes DoT effects
            and returns total consumed — used by RUPTURE); getDistinctDebuffCount (counts
            distinct active debuff types — drives COMPOUND); getDistinctControlCount (counts
            distinct active control effects — drives DISRUPT); VULNERABLE_MAX_MULT,
            RUPTURE_BURST_CAP, COMPOUND_COUNT_CAP, DISRUPT_DENY_AT, EXECUTE_DAMAGE_FRACTION
            (tunable scalars capping each status mechanic); honesty-preview helpers:
            getEnemyIncomingDamageMultiplier, getDisruptMeter, projectRupture, isExecuteReady,
            projectExecute, projectSiphonHeal; DoT amplification helpers: getDotAmplificationByEffect,
            getActiveDotTotal, getActiveDotAmplifications; types: PendingDotEntry, ActiveDotEntry,
            ActiveDotAmplification.)
            (+ Phase 168 AMPLIFY card mechanic — reads enemy pending DoT × multiplier,
            fires as HP burst WITHOUT consuming effects (DoT keeps ticking; distinct from
            RUPTURE which consumes). AMPLIFY_DEFAULT_MULTIPLIER=1.5, AMPLIFY_BURST_CAP=60.
            amplify-detonated event credited in mechanicBurstFraction. combat.amplifyMultiplier
            + combat.amplifyBurstCap tunables. Cards: crescendo-of-suffering (heart, ×1.5, lv6),
            the-inevitable (mind, ×2.0, lv10).)
            (+ Phase 169 curated loadout codec — COMBAT_LOADOUT_FLAG_PREFIX,
            COMBAT_LOADOUT_MAX (20), getCombatLoadout(flags), decodeCombatLoadout(flags),
            addToLoadout(flags, cardId), removeFromLoadout(flags, cardId). Loadout persisted
            in GameState.flags; buildCombatDeck(player, flags?) prefers loadout when present,
            falls back to knownSkills. createNewGameState() seeds STARTING_SKILL_IDS.
            isCombatSynergySatisfied(card, enemyEffects) — pure combo-live helper for mobile
            UI; true when card's target-side CardSynergy.predicate is satisfied by enemy
            ActiveEffect[]; false for caster-side predicates and synthetic cards.)
            (+ 0.35.0 depth-epic tunables — READ_STATUS_MULT (Record<CombatReadResult,number>:
            advantage 1.34, neutral/none 1.0, disadvantage 0.75 — stance-read scales landed
            status magnitude, gentler than READ_DAMAGE_MULT; tuned by /combat-tuning),
            THREAT_ESCALATION_PER_ROUND (default 0.22 — per-round escalation step after grace),
            THREAT_ESCALATION_GRACE (default 1 — grace rounds before clock starts),
            THREAT_ESCALATION_MAX (default 2.0 — cap on escalation multiplier),
            THREAT_ESCALATION_BOSS_MULT (default 1.6 — boss/unique enemies escalate at
            THREAT_ESCALATION_PER_ROUND × this factor; makes long boss fights qualitatively
            more lethal to incentivise finishing fast via DoT/control). Used by
            resolveCombatPhase; consumers can read to surface the escalation clock in the UI.)
Combat reducer: initializeCombat, setPhase, setPlayerStance, setPlayerAction,
                appendLog, incrementFriendship, endCombat
Effects:    applyEffect, applyTier1CombatEffect, clearTier1EffectsForStance,
            lookupEffect, Effect, ActiveEffect, EffectTier
            (+ Phase 80 always-land contract on resolveEffectApplication;
            EffectApplicationResult.rebounded removed; roll field only
            surfaces on Tier 2 buff path)
            (+ Phase 83 test sweep: 25 per-skill + tier-2-debuff cases;
            Phase 86 equipment audit: zero drift confirmed;
            Phase 88 effect coverage sweep: 86 new hermetic cases across
            stat-band / advantage / control / damage-variant / fallacy)
            (+ Phase 142 status effect interaction engine: EFFECT_INTERACTIONS
            registry, evaluateInteractions, checkInteractionTrigger,
            applyInteractionResult, getInteractionsForEffect, getAllInteractionIds,
            getInteractionById, validateInteractions, INTERACTION_AMPLIFICATION,
            INTERACTION_PRIORITY; and Phase 125/142 resolution constants:
            STATUS_RESOLUTION_DEBUFF_THRESHOLD, STATUS_RESOLUTION_DOT_THRESHOLD,
            STATUS_RESOLUTION_DOT_MAX_ROUNDS, STATUS_ENGAGEMENT_FLOOR_PERCENT)
Skills:     executeSkill, canUseSkill, learnSkill, getAvailableSkills,
            cardLibrary, getCardById, Card, CardEvent, CardCategory,
            CardTier, CardTarget, CardSynergy, CardLookup, CardResolution,
            StatType, CardSpecialMechanic (union: 'amplify'|'rupture'|
            'compound'|'siphon'|'barrier'|'riposte'|'execute')
            (canonical names since 0.35.0 de-conflation —
            skillLibrary / getSkillById / Skill / SkillEvent / SkillCategory /
            SkillSpecialMechanic are @deprecated aliases kept for
            axiomancer-mobile migration; prefer Card-prefixed names)
            (+ CardSynergy, SynergyPredicate types + Card.synergy?
            field driving 5 authored Tier 2 synergy skills — Phase 66)
            (+ carryPhilosophicalResources — cross-combat carry of unspent
            fallacy/paradox into the next combat's seed (floor(FRACTION ×
            unspent), capped); stance tokens never carry, so it rewards
            skill-casting/status-effect play over basic-attack token-banking
            (STRATEGIST path); defaults live in the Game RESOURCE_CARRY const)
            (+ Phase 142 extended synergy predicate helpers:
            evaluateExtendedSynergyPredicate, checkSinglePredicate,
            checkAnyCountPredicate, checkAllRequiredPredicate,
            checkBuffDebuffCombo, checkTotalIntensityPredicate,
            ExtendedSynergyPredicate type — richer multi-condition synergy
            check supporting per-effect-type filtering, buff/debuff combos,
            and total-intensity gates; used via Skill.synergy? field)
            (+ resource helpers: generateBasicActionResources (adds stance
            tokens per generation table given stance + outcome: 'hit'|'miss'|
            'defend'), generatePhilosophicalResource (adds 1 Fallacy or
            Paradox token after skill use), spendResources (deducts resource
            cost; guard with canUseSkill first), calculateSkillDamage (applies
            the damage formula for a skill + advantage))
Items:      addItem, removeItem, useConsumable, stackItem, Item (and variants)
            (+ buyItem / sellItem / defaultSellPrice + ShopWare /
            ShopInventory types — Phase 37 shop economy),
            (+ rarityWeightTable + dropItem / rollModifiers /
            resolveModifiers — Spec 05c/d/e rolled-items pipeline,
            re-exported through public-surface fixture at Phase 53),
            (+ getActiveSetBonuses + 5 siblings + itemSetLibrary /
            getItemSetById + SetBonus / ItemSet types — Phase 54 set
            items),
            (+ previewTemplateAtRarity — Phase 75 UI-tier wrapper
            around dropItem with soft-error semantics; closes the
            user-jot at b5c8165 for mobile item-library
            mod-visibility),
            (+ previewTemplateAtAllRarities — Phase 76 batch wrapper
            returning Record<ItemRarity, Equipment | undefined> for
            UI tooltip / item-detail rarity-strip views),
            (+ dropItemWithAffixes + prefixes / suffixes / allAffixes /
            getAffixById / composeItemName / affixesForSlot +
            AFFIX_RARITY_WEIGHTS, with DropWithAffixesOptions /
            AffixControl / Affix / AffixRole types — Phase 152 affix
            naming layer over the modifier catalogue; rolls a prefix/
            suffix word pair onto dropped gear and composes the display
            name),
            (+ equipmentFromTemplate + generateRarityDrop +
            GenerateRarityDropOptions / GenerateRarityDropResult types
            (loot.generation); dropItemAtRarity (single item at explicit
            rarity), countNamedAffixes (prefix+suffix count on an
            Equipment), hasBakedAffix (curated-variant guard),
            AFFIXES_PER_RARITY (target prefix+suffix count per rarity);
            and firstEquippedPerSlot / isEquippedFirstOfSlot /
            findEquippedInSlot (equipped helpers) — Phase 154
            loot-generation + equipped-slot read APIs)
Game:       createGameStore, GameState, nullAdapter, persistence adapters
            (+ GameState.lastSeenAlignmentCells? — Phase 63 alignment-observer
            cache, additive optional, no GAME_STATE_VERSION bump),
            (+ store.resetRun({ keepCharacter }) + GameState.runId
            (required string) + generateRunId + STARTING_REGION
            constant — Phase 72 closes GH#65 ask 2;
            GAME_STATE_VERSION bumped 5 → 6 with migrateV5toV6),
            (+ CodexState + required GameState.codex slice +
            store.unlockCodexEntry + UNLOCK_CODEX_ENTRY action +
            CombatEndReport.friendshipReward.codexEntryUnlocked? —
            Phase 73 closes GH#65 ask 3; GAME_STATE_VERSION bumped
            6 → 7 with migrateV6toV7),
            (+ RESOURCE_CARRY const (FRACTION/CAP) — defaults for the Skills
            carryPhilosophicalResources cross-combat carry)
            (+ DEFENSE_MULTIPLIERS { advantage/neutral/disadvantage } + PASSIVE_DEFENSE_MULTIPLIER —
            active/passive defense stance bonuses;
            MAX_EFFECT_INTENSITY (10) + MAX_EFFECT_DURATION (99) — effect stack caps;
            FRIENDSHIP_COUNTER_MAX (3) — befriend attempts before success)
World:      createStartingWorld, world reducer, WorldState, MapState, MapDefinition
            (+ getNodeEventPool / getNodeEventKinds / getNodePrimaryEventKind —
            node-event-kind read API over the registered MapEventPools; lets a
            client preview which MapEventKinds a given continent/map/node fires
            without resolving an event)
            (+ runMinigameHarness — Phase 148 harness runner for minigame
            simulation/replay; NarrationPayload — Phase 83 type for 'narration'
            MapEventKind payload; getShadowedNodeOverrideKeys — Phase 161
            no-shadow parity guard: returns keys overridden in both the default
            pool and the override map for a given map)
Hazard (re-exported via World/*): wildcard surface; key combat-bridge predicates:
            dieCanPower(dieKind, cardKind) — whether a die kind can power a card
            of a given Hazard color; dieCanPowerCard(dieKind, cardDef) — same
            check against a full HazardCardDef; hazardCardPowerColors(def) —
            returns the set of die colors that can power a given card (sibling
            predicate to dieCanPower/dieCanPowerCard, used for UI die-drop hints).
            Referenced by combat.dice.ts die-affordance logic. Key state-machine entry point:
            confirmHazardForetell(session, orderedIds) — resolves the
            foretell-pending state after a FORETELL card play (restores captured
            dice, applies SCOUR discard if scour mode active, awards drawCount
            bonus if foretellDrawCount set). Key engagement-layer state-machine
            functions: generateSubquestDraft(subquests, rng, count) — generates
            draft subquest candidates from the authored pool before a session
            begins; chooseSubquest(draft, id) — picks one candidate from the
            draft, returning an updated HazardSubquestDraft (standalone, no
            session state); selectSubquestFromDraft(session, id) — applies the
            chosen subquest to a live HazardSessionState (session-level API).
            Subquest query helpers: getHazardSubquestDef(id) — looks up a
            subquest definition by id from HAZARD_SUBQUESTS;
            hazardSubquestStatus(session, subquest) — returns objective
            completion status for a live session;
            hazardSubquestResults(session, final) — returns subquest outcome
            results for display after a session ends.
Utils:      clamp, randomInt, deepClone, deriveStats, calculateMaxHealth,
            createDieRoll, isCharacter, isEnemy
Philosophy: bucketAxis, getAlignmentCell, applyAlignmentDelta, defaultAlignment,
            AXIS_HIGH_THRESHOLD, AXIS_LOW_THRESHOLD,
            philosophicalAlignmentLibrary,
            PhilosophicalAlignment, AxisBucket, AlignmentFallacy,
            PhilosophicalAlignmentCell
            (+ GameState.philosophicalAlignment field, SHIFT_PHILOSOPHICAL_ALIGNMENT
            action, alignmentDelta? on DialogueChoice.effect + MapEventPoolEntry,
            sourcedFromCell? on Skill + Effect, Enemy.philosophicalAlignment?,
            AlignmentGate type + requiresAlignment? on DialogueChoice.requires +
            SkillLearningRequirement, optional alignment param on
            meetsLearningRequirement / getAvailableSkills / learnSkill,
            DialogueContext.alignment? — Phases 42-46)
```

Adding new exports is allowed. Renaming or removing existing ones requires
a semver major and is a deliberate phase, not an iterate finding.

`src/CLI/` is **not** part of the public API and is excluded from the build.

## Repository shape

```
axiomancer-mechanics/
├── spec.md
├── README.md
├── agents.md
├── AGENTS.md               # Cursor-specific rule book (keep; don't delete)
├── package.json
├── src/
│   ├── index.ts            # public barrel
│   ├── Character/          # createCharacter + types
│   ├── Combat/             # advantage, stats, dice, damage, effects, resolver
│   ├── Effects/            # applyEffect, Tier1 stance effects, library
│   ├── Enemy/              # createEnemy + AI logic + library
│   ├── Game/               # store + persistence + constants + actions + reducer
│   ├── Items/              # inventory reducers + item types
│   ├── Skills/             # types + engine
│   ├── World/              # world state, reducers, map and quest libraries
│   ├── NPCs/               # NPC types
│   └── Utils/              # math, dice, stat derivation, type guards
├── src/CLI/                # interactive CLIs (not exported)
├── src/test-utils/         # rng stubs, mock helpers
├── specs/                  # implementation specs (conversation-loop format)
│   ├── story/              # authored via `/story-spec` (S-NN-*.md)
│   ├── world/              # authored via `/world-spec` (W-NN-*.md)
│   └── characters/         # authored via `/character-spec` (C-NN-*.md)
├── content/                # author's notebook (not loaded by engine)
│   ├── characters/         # per-character bios + visuals + vo (when needed)
│   ├── locations/          # per-location atmosphere + mechanics + lore
│   └── story/              # high-level story-overview prose
├── docs/                   # per-system reference docs
├── braindump/              # unorganised idea backlog
├── plan/                   # build plan, phase briefs, audit findings
├── skills/                 # nexus skill files invoked by slash commands
├── .claude/
│   ├── commands/           # terse slash-command pointers
│   ├── agents/             # sub-agent definitions
│   └── skills/             # project-specific skills (brainstorm-mechanics, story-spec, world-spec, character-spec)
└── scripts/                # deploy-check.mjs + loop-issue.mjs (best-effort)
```

## Sub-agents

| Agent | When to spawn | Returns |
|---|---|---|
| `scout` | External research: TTRPG specs, game mechanics, design patterns | Structured findings with citations |
| `mechanics-expert` | Review or propose game-mechanic decisions; audit for balance, spec alignment | Structured analysis report |

## Visual & tonal defaults

Not applicable — library, no UI. The _game's_ tone: philosophical, dark,
literary. Enemies are embodiments of logical fallacies. Effect names reference
philosophical paradoxes (Zeno's paralysis, Buridan's indecision, etc.).
Maintain this vocabulary in code comments, effect descriptions, and docs.

## Plan expansion posture

**Mode: bold** — `/expand` fires at standard cadence and files candidates to
`plan/PHASE_CANDIDATES.md`. `/oversight` promotes them to the build plan.

## Decisions standing for the autonomous loop

- **Package manager:** npm. Never pnpm. All commands use `npm run`.
- **Verify gate:** `npm run type-check && npm run lint && npm test && npm run build`.
- **Deploy gate:** `npm run deploy:check` → `npm pack --dry-run`
  (confirms the package is publishable; no actual publish).
- **ESLint state:** flat-config (`eslint.config.mts`) with the
  `@typescript-eslint` plugin registered and a deliberately narrow rule set
  (`no-unused-vars` via the TS plugin, `no-redeclare` via the TS plugin to
  respect function overloads, `no-explicit-any` at `warn`). `src/CLI/`,
  `automation/`, and `scripts/` are ignored. Warnings are advisory; only
  errors fail the verify gate. Was broken until Phase 13.
- **Hermetic e2e tests:** located at `src/<Module>/e2e/<feature>.engine.test.ts`.
  They run as part of `npm test`. No Playwright; e2e is vitest-based.
  Every module with public engine logic ships one. Additional sibling
  `src/<Module>/*.test.ts` files are permitted for unit-level coverage
  of internal helpers — they run in the same vitest pass.
- **RNG stubs:** always use `mockAlternatingRng`, `mockFixedRng`,
  `mockSequentialRng` from `src/test-utils/rng.ts`. Never re-roll custom
  `vi.spyOn(Math, 'random')`.
- **Commit style:** `<type>(<scope>): <short description>`. Types: feat, fix,
  refactor, chore, docs, test. E.g. `feat(game): add gameReducer dispatch`.
- **Incremental commits:** one commit per logical unit of work; only when
  `npm test` and `npm run type-check` are green for that increment.
- **CLI files:** CLIs (`src/CLI/`) are excluded from the build. They are
  UI-only; all logic goes in resolver/reducer modules with colocated tests.
- **Phase issue mirroring:** best-effort via `scripts/loop-issue.mjs`. If
  script fails, the phase still ships; log stderr and continue.
- **Spec alignment:** each phase corresponds to a spec in `specs/`. Read
  the relevant spec file as the first input for any phase brief.
- **Zustand vs reducers:** The store (`Game/store.ts`) is the consumer-facing
  entry point. Pure reducers exist per module for non-Zustand consumers and
  testing. The game loop (Spec 09) switches to Zustand as the primary
  dispatch surface; `gameReducer` is the secondary.

## Hard rules

1. **Commit and push as a single atomic act.**
2. **No `Co-Authored-By:` trailers, no emojis.**
3. **No `--no-verify`, no force-push, no destructive resets.**
4. **The verify gate is non-negotiable:**
   `npm run type-check && npm run lint && npm test && npm run build`
5. **Tests alongside code — never "add tests later".**
   Every implementation lands with at least one hermetic e2e test
   driving the change through the module's highest-level public entry.
6. **Never skip lint by removing it from verify** — fix the underlying
   ESLint config issue instead.
7. **`src/index.ts` contract is locked** — no removals or renames without
   a semver major phase.
8. **CLI files (`src/CLI/`) contain UI only** — logic goes in resolver/
   reducer modules that are independently testable.
9. **State file (`game-state.json`) is gitignored and ephemeral.**

## Verify gate (hermetic, mandatory) + deploy gate

### Pre-commit: `npm run verify`

```
npm run type-check     # tsc --noEmit
npm run lint           # eslint "**/*.ts" (warnings advisory; errors fail)
npm test               # vitest run (includes hermetic e2e)
npm run build          # tsc && tsc-alias → dist/
```

All four are hard gates. Iterate up to 3 times on the same root cause
before stopping per skill failure modes. **Hermetic e2e is the unit tests
at `src/**/*.engine.test.ts`** — they exercise the full module through its
public entry point with stubbed RNG. A red `npm test` is a blocked push.

### Post-push: `npm run deploy:check`

```
npm pack --dry-run
```

After every push, confirms the package is correctly packable (exports, types,
package.json `files` field). Exit 0 = packable; exit 1 = not packable.
This is the "deploy gate" equivalent for a library — the package doesn't
go to a hosting provider, but it must be publishable.

**Note:** `dist/` must exist when `deploy:check` runs. The verify gate
(`npm run build`) creates it. Always run `verify` before `deploy:check`.

## Useful commands

```bash
npm run type-check         # tsc --noEmit
npm test                   # vitest run
npm run build              # tsc && tsc-alias → dist/
npm run verify             # full gate: type-check + test + build
npm run deploy:check       # npm pack --dry-run
npm run combat             # interactive combat CLI
npm run character          # interactive character builder
COMBAT_NO_DELAY=1 npm run combat   # combat without animation delays
npm run auto:combat        # python pexpect harness (requires pexpect)
```
