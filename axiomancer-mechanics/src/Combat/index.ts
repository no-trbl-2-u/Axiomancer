/**
 * Combat barrel.
 *
 * Combat-specific logic is split across focused modules:
 *   advantage.ts        — type-advantage relationships and modifiers
 *   stats.ts            — stat lookups for combatants
 *   dice.ts             — skill checks and crit detection
 *   damage.ts           — final damage and attack outcome
 *   health.ts           — applyDamage / heal / status checks
 *   effects.ts          — combatant-side effect manipulations
 *   resist.ts           — tier 2/3 effect application resolver
 *   combat.reducer.ts   — small state-shape mutations on CombatState
 *
 * Round-resolution pure helpers also live here.
 */

import { BefriendabilityConfig } from '../Enemy/types';
import { FRIENDSHIP_COUNTER_MAX } from '../Game/game-mechanics.constants';
import { CombatState, Stance } from './types';

export type {
    Stance, Action, Advantage, CritStyle, CombatAction, PlayerCombatAction,
    CombatPhase, BattleLogEntry, CombatState, Combatant,
} from './types';

export { determineAdvantage, hasAdvantage, getAdvantageModifier, resolveEffectiveAdvantage } from './advantage';
export { getBaseStat, getAttackStat, getDefenseStat, getSaveStat } from './stats';
export { rollSkillCheck, isCriticalHit, isCriticalMiss } from './dice';
export { applyCriticalMultiplier, calculateFinalDamage, selectCritDamage, isAttackSuccessful } from './damage';
export { applyDamage, heal, isAlive, isDefeated, getHealthPercentage } from './health';
export {
    MIND_MARK_ID,
    getStudyMarkIntensity, getActiveRollModifier, getThornsReflect,
    updateEffectDuration, tickAllEffects,
    removeRandomBuff, extendRandomBuffDuration, applyRegen, applyDrain,
    processDamageOverTime, processRoundStartEffects, processRoundEndEffects,
    applyCleanse, applyDispel,
    // 0.34.0 status-depth epic — HP-model selectors + tunable scalars
    getDamageTakenMultiplier, getPendingDotTotal, consumeDotEffects,
    getDistinctDebuffCount, getDistinctControlCount,
    VULNERABLE_MAX_MULT, RUPTURE_BURST_CAP, COMPOUND_COUNT_CAP,
    DISRUPT_DENY_AT, EXECUTE_DAMAGE_FRACTION,
    AMPLIFY_DEFAULT_MULTIPLIER, AMPLIFY_BURST_CAP,
} from './effects';
export type { PendingDotEntry } from './effects';
export {
    getActiveEffectModifiers, getEffectiveStats, canAct,
    // 0.34.0 — surfaced DoT amplification (Hemorrhage / Dissolution / Corrosive Fire)
    getDotAmplificationByEffect, getActiveDotTotal, getActiveDotAmplifications,
} from './effect-modifiers';
export type {
    AggregatedEffectModifiers, EffectiveStats,
    ActiveDotEntry, ActiveDotAmplification,
} from './effect-modifiers';
export { resolveEffectApplication } from './resist';
export { calculateDamageResistance, getSkillDamageType } from './damage-resist';
export type { DamageType } from './damage-resist';
export {
    rollForCombatEffects, applyProcOutcome, applyFumbleOutcome,
    getEligibleTriggers, calculateProcChance, combatEffectsLibrary,
} from './combat-effects';
export type {
    CombatEffectTrigger, ProcUnlocks, ProcOverrides,
    ProcRollOutcome, FumbleOutcome, RollForCombatEffectsParams,
} from './combat-effects';
export { calculateEnemyStatMultiplier, applyMoralMeterScaling } from './difficulty';

// `CombatState` constructor — shared by the skill / effects / equipment engines
// (and the Hazard-Pattern shim builds the same shape inline). The legacy
// turn-based driver verbs that lived alongside it were removed.
export { initializeCombat } from './combat.reducer';

/**
 * Phase 68 — friendship-eligibility predicate. Returns true when the
 * current `CombatState` satisfies the active enemy's `BefriendabilityConfig`
 * (all named predicates AND-compose). When the enemy has no config OR the
 * config sets `defaultFallback: 'both-defend-cap'`, falls through to the
 * Phase 36 mechanic (`friendshipCounter >= FRIENDSHIP_COUNTER_MAX`).
 *
 * Not exported from the public barrel — internal helper for
 * `isBefriendAttemptEligible`, the explicit Befriend-attempt check the shared
 * skill engine consults via `executeSkill`. (The legacy combat-end predicates
 * that also consumed it — `determineCombatEnd` / `isCombatOngoing` /
 * `isFriendshipEligible` — were removed with the legacy turn-based driver.)
 *
 * D5: `requiredStances` / `requiredSkillUse` derive from `state.log` rather
 * than separate tracking state on `CombatState`. The log already captures
 * `playerAction.stance` and (when `action === 'skill'`) `playerAction.skillId`
 * per resolved round.
 */
function befriendabilityPredicatesPass(
    state: CombatState,
    options: { requirePassiveCounter: boolean },
): boolean {
    const config: BefriendabilityConfig | undefined = state.enemy.befriendabilityConfig;
    if (!config || config.defaultFallback === 'both-defend-cap') {
        return options.requirePassiveCounter
            ? state.friendshipCounter >= FRIENDSHIP_COUNTER_MAX
            : true;
    }
    const threshold = config.roundsThreshold ?? FRIENDSHIP_COUNTER_MAX;
    if (options.requirePassiveCounter && state.friendshipCounter < threshold) return false;
    if (config.hpGate) {
        const maxHp = state.enemy.maxHealth;
        if (maxHp <= 0) return false;
        const hpFraction = state.enemy.health / maxHp;
        if (hpFraction > config.hpGate.belowPct) return false;
    }
    if (config.requiredStances && config.requiredStances.length > 0) {
        const usedStances = new Set<Stance>(
            state.log.map(entry => entry.playerAction.stance),
        );
        if (!config.requiredStances.some(stance => usedStances.has(stance))) {
            return false;
        }
    }
    if (config.requiredSkillUse && config.requiredSkillUse.length > 0) {
        const castSkills = new Set<string>(
            state.log
                .filter(entry => entry.playerAction.action === 'skill' && entry.playerAction.skillId !== undefined)
                .map(entry => entry.playerAction.skillId as string),
        );
        if (!config.requiredSkillUse.some(skillId => castSkills.has(skillId))) {
            return false;
        }
    }
    return true;
}

/**
 * Phase 112 — returns true when the enemy is vulnerable to an explicit
 * Befriend skill attempt. HP gates and authored stance/skill predicates still
 * matter, but passive both-defend counter pressure is not, by itself, a combat
 * end or a mercy decision.
 */
export function isBefriendAttemptEligible(state: CombatState): boolean {
    return befriendabilityPredicatesPass(state, { requirePassiveCounter: false });
}

// Legacy export name retained for backward compatibility with any older code
// that imported `applyDamage` and `healCharacter` separately.
export { heal as healCharacter } from './health';

// Phase 142 — effect-interaction amplification bounds (shared infrastructure).
export { INTERACTION_AMPLIFICATION } from './resolution.constants';

// ─── Spec 25 — Hazard-Pattern Combat ──────────────────────────────────────────
// The card-and-dice combat driver. Ships alongside `resolveCombatRound`; the
// effects + skill engines are unchanged (Spec 25 §12 Q4 recommendation (b)).
export type {
    CombatEncounterState, CombatEncounterPhase, CombatTransition,
    CombatManaDie, CombatDieColor, CombatDieState,
    CombatCard, CombatHandEntry, CardPlay, CombatVerbClass, CardEffectKind,
    CombatThreatPhase, CombatThreatAction, CombatThreatEffect,
    CombatThreatMark, CombatPhaseResult, CombatOutcome, CombatEvent,
    CombatSummary, CombatAttributionRow, LandedEffect,
    // Spec 26 / 26b additions
    CombatIntentType, CombatReadResult,
    SignatureSkill, SignatureSkillId, SignatureSkillKind,
} from './combat.encounter.types';
export {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    resolveCombatPhase, resolveThreatPhase, processBetweenPhases,
    selectMercyChoice as selectEncounterMercyChoice, resolveCardDieCost, getCard,
    handCards, cardDieCostPreview, availableDice, buildCombatSummary,
    // Spec 26b — turn lifecycle + read + Conviction + Signature Skills
    startTurn, draftStanceDie, endTurn, resolveRead, chooseDraft, discardCombatCard,
    playSignatureSkill, getDraftedDie, isPhaseStanceRevealed, revealedCurrentStance,
    cardReadPreview, projectCardImpact, getSignatureSkill, SIGNATURE_SKILLS, SIGNATURE_SKILL_LIST,
    READ_DAMAGE_MULT, CONVICTION_PER_UNPICKED_DIE, CONVICTION_READ_WIN_BONUS,
    COLOR_MATCH_DAMAGE_BONUS,
    THREAT_WEAKEN_PER_ROLL, THREAT_DENY_AT, THREAT_WEAKEN_FLOOR,
    // depth epic — the read now scales status; the clock escalates threat
    READ_STATUS_MULT, THREAT_ESCALATION_PER_ROUND, THREAT_ESCALATION_GRACE, THREAT_ESCALATION_MAX,
    THREAT_ESCALATION_BOSS_MULT,
    // 0.34.0 status-depth epic — honesty selectors
    getEnemyIncomingDamageMultiplier, getDisruptMeter,
    projectRupture, isExecuteReady, projectExecute, projectSiphonHeal,
} from './combat.engine';
export type { CardDieCost } from './combat.engine';
export {
    COMBAT_DICE_COUNT, TURN_DICE_COUNT, COMBAT_DIE_FACES, rollCombatDice, rollTurnDice,
    rollCombatDieColor, dieHasStance,
    combatDieCanPower, refreshOneDie,
    dieIsRerollable, hasRerollableDice, rerollSpentDice,
} from './combat.dice';
export { COMBAT_HAND_SIZE, buildCombatDeck, drawCombatCards, shuffleCombatDeck } from './combat.deck';
export {
    COMBAT_DECK_PRESETS, COMBAT_DECK_PRESET_ORDER,
    listDeckPresets, getDeckPreset, buildPresetDeck,
} from './combat.deck-presets';
export type { CombatDeckPreset, CombatDeckFocus } from './combat.deck-presets';
export {
    toCombatCard, projectDeck, classifyVerbClass,
    isSyntheticCard, SYNTHETIC_CARD_IDS,
    GOLD_CARD_IDS, isGoldCard,
    isCombatSynergySatisfied,
} from './combat.cards';
export {
    getThreatSequence, generateDefaultThreatSequence,
    deriveIntentType, AUTHORED_THREAT_ENEMY_IDS,
} from './combat.threat';
export {
    simulateHazardPatternCombat, simulateHazardPatternCombatDetailed, runOneEncounter,
} from './combat.encounter.sim';
export type {
    CombatSimStats, CombatSimPolicyId,
    CombatSimRunOptions, CombatSimDetailedOptions, CombatCardUsage,
} from './combat.encounter.sim';
// ─── Playtest supercharge — stage profiles, deck drafting, policy roster, matrix ──
export {
    COMBAT_STAGE_ORDER, COMBAT_STAGE_PROFILES,
    getStageProfile, isCombatStageId, stageEligibleCardIds, buildStagePlayer,
} from './combat.stage-profiles';
export type { CombatStageId, CombatStageProfile } from './combat.stage-profiles';
export { draftCombatDeck, resolveDeckSelection } from './combat.deck-draft';
export type { DeckDraftOptions, CombatDeckSelection } from './combat.deck-draft';
export {
    COMBAT_SIM_POLICIES, COMBAT_SIM_POLICY_ORDER, getSimPolicy, listSimPolicies,
} from './combat.sim-policies';
export type { CombatSimPolicy } from './combat.sim-policies';
export { runPlaytestCell, runPlaytestMatrix, formatPlaytestReport } from './combat.playtest';
export type {
    PlaytestCellSpec, PlaytestCellResult, PlaytestMatrixOptions,
    PlaytestStageSummary, PlaytestReport,
} from './combat.playtest';
export { runHazardCombatAutoEncounter } from './combat.autoplay';
export type { HazardAutoPolicyId, HazardCombatAutoOptions, HazardCombatAutoResult } from './combat.autoplay';
// Spec 26b tuning §B/§C/§D — archetype signatures, deckbuilder rewards, unlock hook
export { SIGNATURE_KITS, signaturesForArchetype, playerArchetype, CONCLUDE_DMG_PER_STACK } from './combat.signature';
export {
    COMBAT_REWARD_POOL, STARTING_SKILL_ID, STARTING_SKILL_IDS, rollCombatCardRewards, addRewardCard,
    unlockSkillViaDilemma,
} from './combat.rewards';
export type { PlayerArchetype } from './combat.encounter.types';
export {
    COMBAT_LOADOUT_FLAG_PREFIX, COMBAT_LOADOUT_MAX,
    decodeCombatLoadout, getCombatLoadout, addToLoadout, removeFromLoadout,
} from './combat.loadout';
