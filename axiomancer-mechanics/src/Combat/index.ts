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
 *   combat.reducer.ts   — small state-shape mutations on CombatState
 *
 * Round-resolution pure helpers also live here.
 */

import { BefriendabilityConfig } from '../Enemy/types';
import { FRIENDSHIP_COUNTER_MAX } from '../Game/game-mechanics.constants';
import { CombatState } from './types';

export type {
    Stance,
} from './types';

export { applyDamage, heal, isAlive, isDefeated, getHealthPercentage } from './health';
export {
    getStudyMarkIntensity, getActiveRollModifier, getThornsReflect,
    updateEffectDuration, tickAllEffects,
    removeRandomBuff, extendRandomBuffDuration,
    // 0.34.0 status-depth epic — HP-model selectors + tunable scalars
    VULNERABLE_MAX_MULT, RUPTURE_CAP_FRACTION,
    DISRUPT_DENY_AT,
    CONCEDE_PREMISES_BASE, CONCEDE_PREMISES_ELITE, CONCEDE_PREMISES_BOSS,
    // CONDEMN Premise floor per enemy difficulty — the single source the engine
    // AND every presenter/catalog surface share (WI-6 concede ladder).
    concedeFloorFor,
    // RELENT (PLEA) resolve threshold — presenters read the live target off
    // this instead of duplicating the rule (WI-5 sway meter).
    capitulateThreshold,
} from './effects';

export {
    getActiveEffectModifiers, canAct,
} from './effect-modifiers';
export type {
    AggregatedEffectModifiers,
} from './effect-modifiers';

// `CombatState` constructor — shared by the card / effects / equipment engines
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
 * card engine consults via `executeCard`. (The legacy combat-end predicates
 * that also consumed it — `determineCombatEnd` / `isCombatOngoing` /
 * `isFriendshipEligible` — were removed with the legacy turn-based driver.)
 *
 * Remaining predicates are the passive both-defend counter, `roundsThreshold`,
 * and `hpGate`. The former per-round history predicates (`requiredStances` /
 * `requiredCardUse`) were removed with the legacy `CombatState.log`: the
 * Hazard-Pattern engine never populated that log, so they were inert.
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
    return true;
}

/**
 * Phase 112 — returns true when the enemy is vulnerable to an explicit
 * Befriend attempt. HP gates and the `roundsThreshold` still matter, but
 * passive both-defend counter pressure is not, by itself, a combat end or a
 * mercy decision.
 */
export function isBefriendAttemptEligible(state: CombatState): boolean {
    return befriendabilityPredicatesPass(state, { requirePassiveCounter: false });
}

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
    // Phase 33d — GLYPHS pilot (sandbox-only): the charge-and-crack seal zone
    GlyphInstance, GlyphPayload,
    // Phase 102 — SUMMON's brood: one member of an add wave
    CombatAdd,
} from './combat.encounter.types';
export {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    resolveThreatPhase, processBetweenPhases,
    selectMercyChoice as selectEncounterMercyChoice, selectCapitulationChoice, getCard,
    handCards, buildCombatSummary,
    // Spec 26b / spec 33 — turn lifecycle + Conviction + Signature Skills
    startTurn, endTurn, discardCombatCard,
    playSignatureSkill, isPhaseStanceRevealed,
    // Phase 33d — GLYPHS pilot: the dieless crack action
    crackGlyph,
    // Phase 102 — SUMMON: the dieless-but-priced add clear, and its constants
    strikeAdd, ADD_WAVE_CAP, STRIKE_ADD_COST,
    getSignatureSkill,
    READ_DAMAGE_MULT,
    // THE BIG NUMBERS REWRITE — the LIVE colour-match rule. Mobile's presenter
    // must consume this, or the card face prints a bonus the engine does not
    // apply.
    colorMatchBonus,
    // Fate Engine P1 (spec 31) — the dice get a second read
    riderText,
    // 0.34.0 status-depth epic — honesty selectors
    projectRuptureBurst,
    // phase 28 — legibility sweep
    projectIncomingThreat,
    // WS7.2 — chosen X-cost clamp range (`recoil_x`), engine-owned
    recoilXRange,
    // Phase 2 — projected-lethality readout (spec 30); heal-aware since 2026-09-04
    projectCombatOutcome,
    // Spec 32 v3 — floating dice save-back + sway decay knob
    getFloatingDiceColors, SWAY_DECAY_PER_TURN,
} from './combat.engine';
// Spec 33 — the Upgradeable-Dice model: THE combat dice model (the flag was
// collapsed in D7, 2026-09-25).
export {
    PRESS_FATE_COST,
    SPECIAL_CONVICTION_DEFAULT, MOMENTUM_CHAIN_ORDER, MOMENTUM_SURGE_LENGTH,
    DEFAULT_DIE_GEAR, activeDieGear,
} from './combat.upgradeable-dice';

export {
    combatDieCanPower,
    RESERVE_MAX,
} from './combat.dice';
export { COMBAT_HAND_SIZE, buildCombatDeck } from './combat.deck';
export {
    COMBAT_DECK_PRESETS, COMBAT_DECK_PRESET_ORDER,
    // aspect-thirds recipe color law (spec 32 §12 item 9) — the documented borrow map
    PRESET_LINEAGE,
    listDeckPresets, getDeckPreset,
} from './combat.starter-deck-presets';

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
