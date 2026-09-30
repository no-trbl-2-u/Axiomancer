/**
 * Combat barrel.
 *
 * Combat-specific logic is split across focused modules:
 *   advantage.ts        — type-advantage relationships and modifiers
 *   stats.ts            — stat lookups for combatants
 *   dice.ts             — crit detection
 *   damage.ts           — final damage and attack outcome
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
    getStudyMarkIntensity, getActiveRollModifier, getThornsReflect,
    updateEffectDuration, tickAllEffects,
    removeRandomBuff, extendRandomBuffDuration,
    // 0.34.0 status-depth epic — HP-model selectors + tunable scalars
    DISRUPT_DENY_AT,
} from './effects';

export {
    getActiveEffectModifiers, canAct,
} from './effect-modifiers';
export type {
    AggregatedEffectModifiers,
} from './effect-modifiers';

// Legacy export name retained for backward compatibility with any older code
// that imported `applyDamage` and `healCharacter` separately.
export { heal as healCharacter } from './health';

// ─── Spec 25 — Hazard-Pattern Combat ──────────────────────────────────────────
// The card-and-dice combat driver; the
// effects + card engines are unchanged (Spec 25 §12 Q4 recommendation (b)).
export type {
    CombatEncounterState,
    CombatManaDie, CombatDieColor,
    CombatCard, CombatVerbClass, CardEffectKind,
    CombatThreatPhase, CombatThreatAction, CombatThreatEffect,
    CombatOutcome, CombatEvent,
    CombatSummary,
    // Spec 26 / 26b additions
    CombatIntentType, CombatReadResult,
    SignatureSkill,
    // The three chain/stance colours (spec 33 momentum chain + stance checks)
    WheelStance,
    // Spec 33 (Phase D2) — the die-gear interface (D5 makes it a real rail)
    UpgradeableDieGear,
} from './combat.encounter.types';
export {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    resolveThreatPhase, processBetweenPhases,
    selectMercyChoice as selectEncounterMercyChoice, getCard,
    handCards, buildCombatSummary,
    // Spec 26b / spec 33 — turn lifecycle + Conviction + Signature Skills
    startTurn, endTurn, discardCombatCard,
    playSignatureSkill, isPhaseStanceRevealed,
    getSignatureSkill, signatureCastBlock, signatureGuardAmount, SIGNATURE_COST, SIGNATURE_GUARD,
    READ_DAMAGE_MULT,
    // THE BIG NUMBERS REWRITE — the LIVE colour-match rule. Mobile's presenter
    // must consume this, or the card face prints a bonus the engine does not
    // apply.
    colorMatchBonus,
    // Fate Engine P1 (spec 31) — the dice get a second read
    riderText,
    // phase 28 — legibility sweep
    projectIncomingThreat,
    // Phase 2 — projected-lethality readout (spec 30); heal-aware since 2026-09-04
    projectCombatOutcome,
    // Spec 32 v3 — floating dice save-back
    getFloatingDiceColors,
} from './combat.engine';
// S3 — stat scaling (D40–D43): the formula, the keyword families, and the
// display-only stat-scaled card the hand prints.
export {
    scaleAmount, scaleFor, statFor, scaleRider, scaleCardForStats,
    scaleEffectIntensity, effectScaling, effectFamily,
    MECHANIC_SCALING, RIDER_SCALING, PAYLOAD_SCALING, NEUTRAL_STAT,
} from './stat-scaling';
export type { StatFamily, ScalingKind, KeywordScaling } from './stat-scaling';
// Spec 33 — the Upgradeable-Dice model: THE combat dice model (the flag was
// collapsed in D7, 2026-09-25).
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
