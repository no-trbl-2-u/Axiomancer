/**
 * Combat barrel.
 *
 * Combat-specific logic is split across focused modules:
 *   health.ts           — applyDamage / heal / status checks
 *   effects.ts          — combatant-side effect manipulations
 *   resist.ts           — tier 2/3 effect application resolver
 *
 * Round-resolution pure helpers also live here.
 */

export type {
    Stance,
} from './types';

export { applyDamage, heal, isAlive, isDefeated, getHealthPercentage } from './health';
export {
    updateEffectDuration, tickAllEffects,
} from './effects';

export {
    getActiveEffectModifiers, canAct,
} from './effect-modifiers';
export type {
    AggregatedEffectModifiers,
} from './effect-modifiers';

// `heal`, also exported under the name `healCharacter`.
export { heal as healCharacter } from './health';

// ─── Hazard-pattern combat ───────────────────────────────────────────────────
// The card-and-dice combat driver, built on the effects + card engines.
export type {
    CombatEncounterState,
    CombatManaDie, CombatDieColor,
    CombatCard, CombatVerbClass, CardEffectKind,
    CombatThreatPhase, CombatThreatAction, CombatThreatEffect,
    CombatOutcome, CombatEvent,
    CombatSummary,
    // Intents and signature skills
    CombatIntentType,
    SignatureSkill,
    // The three chain colours (the momentum chain)
    WheelStance,
    // The die-gear interface
    UpgradeableDieGear,
} from './combat.encounter.types';
export {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    resolveThreatPhase, processBetweenPhases,
    selectMercyChoice as selectEncounterMercyChoice, getCard,
    handCards, buildCombatSummary,
    // Turn lifecycle + Conviction + Signature Skills
    startTurn, endTurn, discardCombatCard,
    playSignatureSkill,
    getSignatureSkill, signatureCastBlock, SIGNATURE_COST,
    // The LIVE colour-match rule. Mobile's presenter
    // must consume this, or the card face prints a bonus the engine does not
    // apply.
    colorMatchBonus,
    // The dice get a second read
    riderText,
    // Legibility: the incoming-threat projection
    projectIncomingThreat,
    // Projected-lethality readout (heal-aware)
    projectCombatOutcome,
    // Floating dice save-back
    getFloatingDiceColors,
} from './combat.engine';
// Stat scaling: the formula, the keyword families, and the
// display-only stat-scaled card the hand prints.
export {
    scaleAmount, scaleFor, statFor, scaleRider, scaleCardForStats,
    scaleEffectIntensity, effectScaling, effectFamily,
    MECHANIC_SCALING, RIDER_SCALING, PAYLOAD_SCALING, NEUTRAL_STAT,
} from './stat-scaling';
export type { StatFamily, ScalingKind, KeywordScaling } from './stat-scaling';
// The Upgradeable-Dice model: THE combat dice model.
export {
    SPECIAL_CONVICTION_DEFAULT, MOMENTUM_CHAIN_ORDER, MOMENTUM_SURGE_LENGTH,
    DEFAULT_DIE_GEAR, activeDieGear,
} from './combat.upgradeable-dice';

export {
    combatDieCanPower,
    RESERVE_MAX,
} from './combat.dice';
export { COMBAT_HAND_SIZE, buildCombatDeck } from './combat.deck';

export {
    toCombatCard,

    mechanicText,
} from './combat.cards';
export {
    getThreatSequence,
} from './combat.threat';

export {
    COMBAT_REWARD_POOL, STARTING_CARD_IDS, rollCombatCardRewards, addRewardCard,
    unlockCardViaDilemma,
} from './combat.rewards';

export {
    getCombatLoadout, addToLoadout,
} from './combat.loadout';
