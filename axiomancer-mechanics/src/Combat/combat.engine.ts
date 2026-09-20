/**
 * Spec 25 — Hazard-Pattern Combat: the engine (§4, §9).
 *
 * `resolveCombatPhase` drives the HP-model combat: the enemy's SOLE bar is HP,
 * and the player drops it to 0. Every verb is a combat card (projected from a
 * learned card); the player rolls stance dice and plays cards. Combat is
 * STATUS-FIRST — the strike is dead (spec 32 §12): every point of enemy HP
 * falls through a printed status or its payoff (DoT ticks, affliction bursts
 * like RUPTURE/REAP, ratified enchant-gated drips, reflect), never because a
 * spell "hit". Control hinders the enemy's turn instead. The legacy resolver,
 * the effects engine, the card engine, and all effects are UNCHANGED — this
 * engine *drives* `executeCard` / `applyEffect` differently.
 *
 * Card bottom actions execute through the unchanged `executeCard`: the drafted
 * stance die is the card's whole cost — combat cards carry no resource cost.
 * Landed `effect-applied` events drive the post-combat attribution and the
 * self-reinforcing die loop (§4.7).
 *
 * Randomness flows through the seedable global RNG singleton; pass `seed` to
 * `initializeCombatEncounter` for a reproducible encounter (hermetic tests +
 * Monte-Carlo sim).
 */

import { deepClone } from '../Utils';
import { getRng, setSeed } from '../Utils/rng';
import { isLoggingEnabled, forwardCombatEventsToLog } from '../Log';
import { MAX_EFFECT_INTENSITY, FREE_ENCHANT_ROUNDS } from '../Game/game-mechanics.constants';
import { lookupEffect, applyEffect } from '../Effects';
import type { Effect, ActiveEffect } from '../Effects/types';
import type { Character } from '../Character/types';
import type { Enemy } from '../Enemy/types';
import { findEnemyKeyword, hasEnemyKeyword, enemyKeywordText } from '../Enemy/enemy-keywords';
import { getCardById } from '../Cards/cards.library';
import { baseCardId } from '../Cards/card-upgrades';
import { executeCard } from '../Cards/card.engine';
import { checkStatePredicate } from '../Cards/synergy-predicates';
import type { Card, CardRider, CardSpecialMechanic } from '../Cards/types';
import type { CombatState, Combatant, Stance } from './types';
import { applyDamage, heal, isDefeated, erodeMaxHealth } from './health';
import {
    processRoundStartEffects, processRoundEndEffects, getActiveRollModifier,
    getThornsReflect, getDamageTakenMultiplier, getPendingDotTotal,
    getDistinctDebuffCount, getDistinctControlCount,
    getHealingReceivedMult, getOutgoingDamageMult, getOutgoingThreatDamageMult, decayDotsOnHeal, consumeEffect,
    hasPayloadFlag, getStanceVulnMult, computeRoundsToKill,
    fireDotTrigger, growPerEnemyActionDots,
    consumeAfflictions, consumeOneAffliction, getBackfirePerRung, consumeMarks,
    applyCleanse,
    RUPTURE_PER_AFFLICTION_STACK, DISRUPT_DENY_AT,
    ruptureBurstCap,
    REAP_EROSION_PER_SOUL,
    AKRASIA_DEBT_TIER_GUARD, akrasiaDebtTiersCrossed,
    PREMISE_MILESTONE_RUNGS, premiseMilestonesCrossed,
    THREAT_RUNGS, THREAT_RUNGS_BOSS, BOSS_RUNG_REGROWTH, bossRungGrowthCap,
    concedeFloorFor,
    capitulateThreshold,
    SWAY_WAVERING_RAPPORT, SWAY_FALTERING_BONUS, swayResolveMilestoneThresholds,
} from './effects';
import {
    TURN_DICE_COUNT, rollTurnDice, dieHasStance,
    combatDieCanPower, availableDiceFor, spendDice, availableDieCount,
    hasRerollableDice, rerollSpentDice, rollPermanentBonusDice,
    RESERVE_MAX, ripenReserve, FLOATING_DICE_CAP, materializeFloatingDice,
    overheatReserve,
} from './combat.dice';
import {
    isUpgradeableDiceEnabled, rollUpgradeableDice, rollGoldLeadPair,
    crackedColorsForTurn, expireCrackedDice, advanceMomentumV2, resolveStanceCheck,
    isChainStance, activeDieGear, tableHasRoom,
    UPGRADEABLE_TABLE_CEILING, KINDLE_CONCURRENT_CAP, PRESS_FATE_COST,
    OVERHEAT_CRACK_CHANCE, SPECIAL_FIRES_ON_USE, SURGE_DIE_PREFIX, COVETED_DIE_PREFIX,
} from './combat.upgradeable-dice';
import {
    COMBAT_HAND_SIZE, buildCombatDeck, drawCombatCards, shuffleCombatDeck,
} from './combat.deck';
import {
    toCombatCard, cardStanceColor, effectImpact, riderText, statePredicateText,
} from './combat.cards';
import { recordAttribution } from './combat.attribution';
import { canAct, getActiveEffectModifiers, getActiveDotTotal, dotRoundClockPhase } from './effect-modifiers';
import { getThreatSequence, commitThreatBranch } from './combat.threat';
import { getSignatureSkill, applySignatureSkill, playerArchetype } from './combat.signature';
import { getSignaturesForLoadout } from '../Items/relic.library';
import type {
    CombatCard, CombatDieColor, CombatEncounterState, CombatEvent, CardPlay,
    CombatManaDie, CombatPhaseResult, CombatTransition, LandedEffect, CombatReadResult,
    CombatThreatEffect, CombatThreatPhase, WheelStance, GlyphInstance, GlyphPayload,
    CombatAdd,
} from './combat.encounter.types';

// ── Tunable constants (HP model) ─────────────────────────────────────────────

/** Safety cap on total phases processed — prevents a degenerate stalemate loop. */
const MAX_PHASES = 60;

// ── Read & color-match tuning (scales STATUS payoffs, guard, and riposte) ────
// Status-first combat (spec 32 §12): these knobs never price a raw hit — the
// read multiplier scales the printed status payoffs (RUPTURE fuel, REAP bursts)
// and the defensive setups (guard/barrier/riposte magnitudes).

/** Read multipliers by stance-read result (drafted die vs hidden enemy
 *  stance). Winning the read makes payoffs/setups bite harder; losing it
 *  glances. */
export const READ_DAMAGE_MULT: Record<CombatReadResult, number> = {
    advantage: 1.5, neutral: 1.0, disadvantage: 0.5, none: 1.0,
};
/** Conviction granted by EACH unpicked colored die at draft (dice-law 2026-07-09:
 *  every unused rolled die is a token; X faces bank nothing). */
export const CONVICTION_PER_UNPICKED_DIE = 1;
/** A WILD (gold) die left unused banks double — the payday for not spending it. */
export const CONVICTION_PER_UNPICKED_WILD = 2;
/** Bonus Conviction for winning the stance read (§1 — reading fuels power). */
export const CONVICTION_READ_WIN_BONUS = 1;
/**
 * THE BIG NUMBERS REWRITE (2026-09-02) — the colour-match reward is now a
 * PERCENTAGE, not a flat +3. A flat bonus that mattered on a GUARD 6 card is
 * noise on a GUARD 40 one; a percentage keeps "power the card with its own
 * colour" worth doing at every rank. The floor keeps it felt on the smallest
 * Ash lines. Use {@link colorMatchBonus} — never the raw constants.
 */
export const COLOR_MATCH_BONUS_PCT = 0.25;
export const COLOR_MATCH_BONUS_MIN = 2;

/**
 * The bonus a colour-matched (or Wild) die adds to a printed damage / guard /
 * barrier magnitude: 25% of the base, at least +2, rounded. Returns 0 for a
 * non-positive base so a zero-magnitude line never invents power.
 */
export function colorMatchBonus(base: number): number {
    if (base <= 0) return 0;
    return Math.max(COLOR_MATCH_BONUS_MIN, Math.round(base * COLOR_MATCH_BONUS_PCT));
}

/**
 * Legacy alias, retained so the flat-bonus call sites keep compiling while the
 * library migrates to {@link colorMatchBonus}. Deprecated: prefer the function.
 */
export const COLOR_MATCH_DAMAGE_BONUS = 3;
/**
 * THE BIG NUMBERS REWRITE (2026-09-02) — RETIRED. The global threat fudge
 * factor was folded into `threatDamageBudget` (`combat.threat.ts`), so a
 * telegraph's printed number IS the number the engine applies. Kept at 1 and
 * exported only so external callers that still import it stay honest; delete
 * once nothing references it.
 */
export const THREAT_DAMAGE_SCALE = 1;
/**
 * Soft control "weakens" the enemy's telegraphed attack. Each point of NEGATIVE
 * roll modifier on the enemy — the universal marker of the soft-control /
 * accuracy / attack-down bucket (confusion -5, fear -4, daze -3, slow -2,
 * blind -5, accuracy/attack-down …) — shaves THREAT_WEAKEN_PER_ROLL off the
 * incoming hit. Once the enemy's cumulative roll penalty reaches THREAT_DENY_AT
 * it loses the turn outright — reached by a VARIETY of soft-controls
 * (e.g. confusion + fear = 9), NOT by stacking one (the roll penalty is flat per
 * effect), which keeps hard control (stun/sleep/petrify — a guaranteed skipTurn)
 * distinct. THREAT_WEAKEN_FLOOR is a safety clamp: a weakened-but-not-denied
 * enemy still lands at least this fraction (it does not bind at the current
 * tunables — deny triggers first — but guards against future deep stacks).
 * Tuned by /combat-tuning. Exported so the mobile presenter can state the honest
 * "-X% enemy attack" a control card actually delivers. (Until 0.33.0 the HP
 * engine never read these mods, so ~24 control/stat debuffs were inert.)
 */
export const THREAT_WEAKEN_PER_ROLL = 0.06;
export const THREAT_DENY_AT = 8;
export const THREAT_WEAKEN_FLOOR = 0.4;
/** Conviction is capped so a long grind can't bank a Signature spam. */
export const CONVICTION_CAP = 12;
/** WI-10 — how many scraps per turn PAY +1 Conviction. The hand refills to 6, so
 *  an ungated scrap paid +6◆/turn against the 12 cap (scrap-the-hand). Beyond
 *  this many, a scrap still cycles the dead card but pays nothing. Tunable under
 *  EA-2's baseline. */
export const SCRAP_CONVICTION_CAP_PER_TURN = 2;
// Spec 32 v3 §1 — DIRECT_DAMAGE_WEIGHT is DEAD: the strike was purged from the
// schema (`basePower` no longer exists), so there is no immediate-strike path
// to weight. Every HP source is DoT ticks, status payoffs, engine-gated drips,
// or reflect.

/** Spec 32 v3 T8 — PLEA decays this much at every turn boundary (the
 *  tension knob, ratified A2). Tunable. */
export const SWAY_DECAY_PER_TURN = 1;

// ── Depth epic (combat-depth-epic) ───────────────────────────────────────────

/**
 * THE CLOCK. The enemy's telegraphed hit ESCALATES the longer a fight runs: each
 * round past THREAT_ESCALATION_GRACE multiplies the incoming threat damage by
 * (1 + THREAT_ESCALATION_PER_ROUND × roundsPastGrace). A drawn-out fight turns
 * lethal — so a careless or over-cautious line loses where before combat was
 * unloseable. The counters are on-vision: race the foe down (DoT) before the ramp
 * bites, OR deny its turns (control) to skip the escalated hits. This is also what
 * finally gives the threat ledger teeth — every round the clock advances is a round
 * the 'overwhelmed' marks were paid for. Tuned by /combat-tuning.
 */
export const THREAT_ESCALATION_PER_ROUND = 0.22;
/** Rounds of grace before the clock starts — a fast clean kill is unpunished. */
export const THREAT_ESCALATION_GRACE = 1;
/** Cap on the escalation multiplier so a long grind ramps but never runs away into a
 *  one-shot — keeps the clock tense, not a hard wall. Calibrated conservatively: the
 *  optimal witness bot still wins (combat stays fair, not broken) while human-paced
 *  play feels real pressure. Sharpening the bands further is a /combat-tuning job that
 *  hinges on the denial/kill-speed economy (the optimal bot kills in ~2-4 rounds and
 *  barely feels the clock). */
export const THREAT_ESCALATION_MAX = 2.0;
/**
 * Boss/unique enemies escalate FASTER than normal foes — the per-round rate is
 * multiplied by this factor for `difficulty === 'boss' | 'unique'`. Implements
 * the "steeper curve for bosses" doctrine: a boss fight that drags becomes
 * qualitatively more lethal than a normal fight dragging just as long. The
 * counters (finish fast via DoT, deny turns via control) are unchanged — they
 * are simply more urgent facing a boss. Tuned by /combat-tuning.
 */
export const THREAT_ESCALATION_BOSS_MULT = 1.6;
/**
 * THE CLOCK also intensifies enemy-inflicted STATUS effects, not just raw
 * damage: every THREAT_EFFECT_ESCALATION_STEP of escalation growth
 * (`escalation - 1`, the SAME clock as THREAT_ESCALATION_*, already boss-
 * scaled and already capped at THREAT_ESCALATION_MAX) adds +1 intensity to
 * whatever status the enemy's telegraphed hit applies this phase. Reuses the
 * damage clock's numbers instead of a second independent tuning knob, so it
 * ramps and caps on exactly the same schedule. Tuned by /combat-tuning.
 */
export const THREAT_EFFECT_ESCALATION_STEP = 0.34;
/**
 * Every THREAT_ENCHANT_CURSE_EVERY_ROUNDS rounds a fight runs, the enemy
 * either grows a new passive strength (the non-card buff `buff_all_stats_up`
 * — "Sorites Ascension") or lays a fresh curse on the player (the non-card
 * debuff `debuff_curse` — "Grelling's Malediction"), chosen 50/50 by the
 * seeded rng. A long grind doesn't just get more dangerous on the continuous
 * clock — every five rounds it also gets a genuinely NEW threat on the board.
 * Tuned by /combat-tuning.
 */
export const THREAT_ENCHANT_CURSE_EVERY_ROUNDS = 5;
/**
 * P0-truth READ RULE (replaces the old `READ_STATUS_MULT` ×1.34/×0.75 post-hoc
 * intensity rewrite, which was a provable no-op below intensity 3 and made the
 * printed status numbers wrong): the stance read bites a landed status in REAL,
 * displayable units —
 *   ▲ advantage    → the status lands at +READ_ADVANTAGE_INTENSITY_BONUS intensity
 *   ▼ disadvantage → the status fades READ_DISADVANTAGE_DURATION_PENALTY turn(s)
 *                    sooner (floor 1 — it always lands)
 *   — neutral/none → EXACTLY the printed intensity/duration.
 * Deterministic and previewable: the card face can show the exact triplet.
 * Tuned by /combat-tuning.
 */
export const READ_ADVANTAGE_INTENSITY_BONUS = 1;
export const READ_DISADVANTAGE_DURATION_PENALTY = 1;

// ── Fate Engine P1 (spec 31 §1) — the dice get a second read ─────────────────

/** R2 — each pip on a spent Reserve die adds this much intensity to the status
 *  the play lands (the ripened die hits harder). Tuned by /combat-tuning. */
export const PIP_INTENSITY_BONUS = 2;
/** R2 — each pip on a spent Reserve die adds this much Guard on a defend card.
 *  THE BIG NUMBERS REWRITE — raised 2 → 5 so a ripened die is worth banking
 *  against GUARD lines that now open at 8 and reach 60. */
export const PIP_GUARD_BONUS = 5;
/** R7 — a color-matched (or Wild) die on a STATUS card extends the landed
 *  status by this many turns. Strike/defend keep the flat +3 damage bonus. */
export const COLOR_MATCH_STATUS_DURATION_BONUS = 1;
/** R4 — the universal once-per-turn FATE TAP's Conviction payout. */
export const FATE_TAP_CONVICTION = 1;

// ── THE BIG NUMBERS REWRITE (2026-09-02) — the damage-scaler constants ───────

/**
 * WOUNDING's payload — the curse card a hard unguarded blow shoves into the
 * player's deck. Authored in the curse pool of `cards.library.ts`; an absent
 * id makes the keyword a silent no-op (the resolve-filter law).
 */
export const WOUND_CARD_ID = 'the-wound';

/** BRUTAL — the multiplier on whatever a foe's threat gets past your soak. */
export const BRUTAL_DAMAGE_MULT = 1.5;

// ── Phase 102 (SUMMON) — the brood's constants ──────────────────────────────

/** Waves a single combat may ever spawn. Adds NEVER respawn on emptiness:
 *  clearing a wave is progress the player keeps, because a respawn that the
 *  player's own clear CAUSES is a tax, not a decision. Prior art runs the same
 *  way on both sides — Aeon's End minions come from a finite nemesis deck
 *  (kb:aeons-end/rules/scoring-endgame), STS-BG summons from a finite per-Act
 *  Summon deck (kb:slay-the-spire-the-board-game/rules/setup, src-002). Every
 *  add fight players tolerate has FINITE adds. */
export const ADD_WAVE_CAP = 2;
/** A spawned add's FLAT per-phase bite, as a fraction of the foe's level and
 *  snapshotted at spawn (floor 2). Sized so a full wave lands well under the
 *  foe's OWN printed telegraph — an L22 elite telegraphs ~31 per phase
 *  (`combat.threat.ts`), against which 2 adds x 4 = 8 is ~26%. Adds must read
 *  as a modifier on the wall, never as a second wall. The add term sits
 *  OUTSIDE the escalation stack (THREAT_ESCALATION_MAX), so a long fight does
 *  not double it. */
export const ADD_BITE_PER_LEVEL = 0.2;
/** `strikeAdd`'s Conviction price. CONVICTION_CAP is 12 and signatures run
 *  1-9 (`combat.signature.ts`), so clearing a full 2-add wave costs 4 — one
 *  Press Fate, a third of the cap. Real opportunity cost, never a lockout.
 *  Deliberately NOT free like `crackGlyph`: a free, mandatory, repeating tap
 *  is the canonical resented add shape. */
export const STRIKE_ADD_COST = 2;

/** The most every STAGE a foe has entered can add to its later phases,
 *  combined. Stage bonuses stack on top of the escalation clock, so this is
 *  what keeps a staged boss escalating instead of detonating. */
export const STAGE_THREAT_BONUS_CAP = 0.5;

/** FLAY — the multiplier one spent stack applies to a single hit. */
export const FLAY_DAMAGE_MULT = 1.5;
/** EXECUTE — the multiplier while the foe sits at or below the card's
 *  printed threshold. A double, not an instant kill: a boss's STAGE
 *  thresholds stay the dramatic beats rather than being skipped over. */
export const EXECUTE_DAMAGE_MULT = 2;

// ── Phase 31 (EA-6) — the combat MOMENTUM wheel ──────────────────────────────

/** Wheel succession order — ported 1:1 from the mobile host's pre-existing
 *  truth table (`axiomancer-mobile/state/combat/momentum.ts`). */
const WHEEL_ORDER: readonly WheelStance[] = ['heart', 'body', 'mind'];

function nextWheelStance(s: WheelStance): WheelStance {
    return WHEEL_ORDER[(WHEEL_ORDER.indexOf(s) + 1) % WHEEL_ORDER.length];
}

function isWheelStance(s: CombatDieColor): s is WheelStance {
    return s === 'heart' || s === 'body' || s === 'mind';
}

/** Momentum wheel step: a right stance (the wheel-successor of the last lit
 *  node) lights the next node; a wrong OR repeated stance resets the wheel to
 *  just that stance. Lighting the third node completes the cycle and empties
 *  the wheel in the same call. */
function advanceWheel(lit: readonly WheelStance[], played: WheelStance): { lit: WheelStance[]; completed: boolean } {
    const last = lit[lit.length - 1];
    const next = last === undefined || played !== nextWheelStance(last) ? [played] : [...lit, played];
    if (next.length >= WHEEL_ORDER.length) return { lit: [], completed: true };
    return { lit: next, completed: false };
}

/** The engine-native wheel-granted die's id prefix — used to identify it at
 *  the "charged" gate and to exclude it from cross-combat float persistence
 *  (see {@link getFloatingDiceColors}). */
const MOMENTUM_DIE_PREFIX = 'momentum-';

export function isMomentumDieId(id: string): boolean {
    return id.startsWith(MOMENTUM_DIE_PREFIX);
}

/**
 * Advances the momentum wheel after a card play that actually LANDED (a
 * `card-played` event fired — a fizzled attempt never reaches here, which
 * corrects the mobile host's pre-port behavior where the wheel advanced
 * before the engine confirmed the play landed). Both FREE (top) and PAID
 * (bottom) plays advance the wheel — the wheel tracks the card's printed
 * stance, not its power source. `preState` is the state BEFORE this play
 * dispatched — the "charged" gate reads it, not the post-play state, so the
 * very play that SPENDS the momentum die (drafted while charged) still
 * counts as "was charged" and doesn't also advance the wheel (mirrors the
 * host's `chargedRef`, which reflects the pre-play render). No-op for
 * non-wheel stances (wild/x FREE-line synthetics).
 */
function advanceMomentumWheel(
    preState: CombatEncounterState,
    transition: CombatTransition,
    stance: CombatDieColor,
): CombatTransition {
    if (!isWheelStance(stance)) return transition;
    if (!transition.events.some(e => e.kind === 'card-played')) return transition;
    const state = transition.state;
    if (state.phase === 'complete') return transition;
    if ((preState.floatingDice ?? []).some(d => isMomentumDieId(d.id))) return transition;

    const result = advanceWheel(state.momentumWheel ?? [], stance);
    const wheelEvents: CombatEvent[] = [{ kind: 'wheel-lit', lit: result.lit }];
    let dice = state.dice;
    let floatingDice = state.floatingDice ?? [];
    if (result.completed) {
        const dieId = `${MOMENTUM_DIE_PREFIX}${state.turn}-${state.log.length}`;
        const die: CombatManaDie = { id: dieId, color: 'wild', state: 'available', temporary: true, floating: true };
        dice = [...dice, die];
        floatingDice = [...floatingDice, die];
        wheelEvents.push({ kind: 'wheel-completed', dieId });
    }
    const nextState = withLog({ ...state, momentumWheel: result.lit, dice, floatingDice }, wheelEvents);
    return { state: nextState, events: [...transition.events, ...wheelEvents] };
}

const defaultRng = (): number => getRng().random();

// ── Card / lookup adapters ──────────────────────────────────────────────────

const lookupCard = (id: string): Card | undefined => getCardById(id);
const lookupEffectDef = (id: string): Effect | undefined => lookupEffect(id);

/** Projects a card id into its card view (card or synthetic). */
export function getCard(cardId: string): CombatCard | null {
    return toCombatCard(cardId, lookupCard, lookupEffectDef);
}

// ── RPS advantage — legacy die-cost classifier + the live read (§4.8) ────────

/** Heart > Body > Mind > Heart. True if stance `a` beats stance `b`. */
export function stanceBeats(a: Stance, b: Stance): boolean {
    return (a === 'heart' && b === 'body')
        || (a === 'body' && b === 'mind')
        || (a === 'mind' && b === 'heart');
}

export interface CardDieCost {
    cost: number;
    advantage: 'advantage' | 'neutral' | 'disadvantage';
}

/**
 * LEGACY die-cost classifier (spec 25 §4.8 — RPS advantage). Maps a card color
 * against the enemy's phase stance onto the historical 0/1/2-die price
 * (advantage → 0, neutral → 1, disadvantage → 2; Wild/X → neutral). NO play
 * path charges this price any more: play legality and the actual die COST are
 * owned by THE COLOR LAW inside `playCombatCard` (~:1150 — a die powers only a
 * card of its color; WILD is the sole exception), and the read's power scaling
 * lives in `READ_DAMAGE_MULT`. This function survives ONLY as the
 * advantage-read classifier behind `cardDieCostPreview` (the UI/CLI RPS
 * indicator): consumers should read `advantage` and ignore `cost`.
 * Deprecated on the public barrels (`src/Combat/index.ts`, `src/index.ts`);
 * kept because barrel removal is a semver-major phase.
 */
export function resolveCardDieCost(cardColor: CombatDieColor, enemyPhaseStance: Stance): CardDieCost {
    if (cardColor === 'wild' || cardColor === 'x') return { cost: 1, advantage: 'neutral' };
    const stance = cardColor as Stance;
    if (stanceBeats(stance, enemyPhaseStance)) return { cost: 0, advantage: 'advantage' };
    if (stanceBeats(enemyPhaseStance, stance)) return { cost: 2, advantage: 'disadvantage' };
    return { cost: 1, advantage: 'neutral' };
}

/**
 * Spec 26b §1 — the hidden-stance READ. The drafted die's stance contests the
 * enemy's hidden phase stance (Heart > Body > Mind > Heart). A Wild/X die has no
 * stance → `none` (no contest, no bonus). Winning the read amplifies the powered
 * card and grants bonus Conviction.
 */
export function resolveRead(dieColor: CombatDieColor, enemyPhaseStance: Stance): CombatReadResult {
    if (!dieHasStance(dieColor)) return 'none';
    const stance = dieColor as Stance;
    if (stanceBeats(stance, enemyPhaseStance)) return 'advantage';
    if (stanceBeats(enemyPhaseStance, stance)) return 'disadvantage';
    return 'neutral';
}

/** Maps a read result to the legacy advantage label used in card-played events. */
function readToAdvantage(read: CombatReadResult): 'advantage' | 'neutral' | 'disadvantage' {
    return read === 'advantage' ? 'advantage' : read === 'disadvantage' ? 'disadvantage' : 'neutral';
}

// ── Internal helpers ─────────────────────────────────────────────────────────

/** Builds the legacy `CombatState` shim `executeCard` needs. */
function cardShim(enc: CombatEncounterState): CombatState {
    return {
        active: true,
        phase: 'resolving',
        round: enc.round,
        friendshipCounter: 0,
        player: enc.player,
        enemy: enc.enemy,
        playerChoice: {},
        enemyChoice: {},
    };
}

/** Snapshot of enemy effect intensities (for the meaningful-land / refresh check). */
function intensityMap(effects: readonly ActiveEffect[]): Record<string, number> {
    const m: Record<string, number> = {};
    for (const e of effects) m[e.effectId] = Math.max(m[e.effectId] ?? 0, e.intensity);
    return m;
}

const currentPhaseStance = (enc: CombatEncounterState): Stance => {
    // CHARM (P0-truth `forcedStance` fix): a forced stance on the enemy REPLACES
    // its hidden phase stance — the charm names the stance it must fight from,
    // so the player can draft the counter with certainty. Previously
    // `canAct().resolvedStance` was computed and discarded.
    const forced = getActiveEffectModifiers(enc.enemy.effects as ActiveEffect[]).forcedStance;
    if (forced) return forced;
    const phase = enc.threatPhases[Math.min(enc.currentPhaseIndex, enc.threatPhases.length - 1)];
    return phase?.enemyStance ?? 'heart';
};

// ── Initialization (§9) ──────────────────────────────────────────────────────

/**
 * Builds a fresh `CombatEncounterState`. Combatants are deep-cloned (mutations
 * stay inside the encounter). Dice are NOT rolled yet — the state opens in the
 * `reveal` phase with an opening hand drawn, mirroring Hazard's route-select →
 * rolling → playing flow. Call `rollEncounterDice` to advance.
 *
 * `flags` is `GameState.flags` (Phase 169's curated-loadout codec, see
 * `combat.loadout.ts`) — forwarded to `buildCombatDeck` only when `playerDeck`
 * is omitted; an explicit `playerDeck` always wins. Omitted/empty `flags`
 * falls back to `player.knownCards`, unchanged from before this parameter
 * existed (audit: "the Phase-169 loadout path is dead in the shipped
 * runtime" — this closes the reachability gap, not a behavior change for
 * callers that don't pass flags).
 */
export function initializeCombatEncounter(
    player: Character,
    enemy: Enemy,
    playerDeck?: string[],
    seed?: number,
    flags?: readonly string[],
): CombatEncounterState {
    if (seed !== undefined) setSeed(seed);

    const clonedPlayer = deepClone(player);
    const clonedEnemy = deepClone(enemy);
    const deck = playerDeck && playerDeck.length > 0 ? playerDeck.slice() : buildCombatDeck(clonedPlayer, flags);

    let threatPhases = getThreatSequence(clonedEnemy);
    // WS9 (spec 32 §12 #7) — a branch on the OPENING phase commits at combat
    // start (its phase START); no threat has resolved yet, so the full-block
    // ledger reads false.
    const openingBranch = commitThreatBranch(threatPhases, 0, clonedEnemy, false);
    if (openingBranch) threatPhases = openingBranch.phases;

    // Draw the opening hand (5) from a shuffled deck.
    const shuffled = shuffleCombatDeck(deck);
    const draw = drawCombatCards(shuffled, [], deck, COMBAT_HAND_SIZE);

    let uid = 0;
    const hand = draw.drawn.map(cardId => ({ uid: `c${++uid}`, cardId }));

    // Spec 32 v3 §5 — the character's persistent GHOST dice arrive in the
    // opening tray (they were forged in earlier combats and never spent).
    const floatingDice = materializeFloatingDice(clonedPlayer.floatingDice ?? []);

    return {
        phase: 'reveal',
        enemy: clonedEnemy,
        player: clonedPlayer,
        dice: [],
        draftedDieId: null,
        turn: 0,
        // Gate 0 (round-turn law) — no tray rolled yet this phase.
        turnTakenThisPhase: false,
        conviction: 0,
        revealedStances: [],
        lastRead: 'none',
        // `archetype` is kept for the mobile portrait flavour only — it no
        // longer selects signatures (Phase 19). Signatures come from the worn
        // signet-relic loadout.
        archetype: playerArchetype(clonedPlayer),
        signatures: getSignaturesForLoadout(clonedPlayer.equipment),
        deck,
        drawPile: draw.drawPile,
        discard: draw.discard,
        hand,
        persistentZone: [],
        enemyAttachments: [],
        // Spec 32 v4 §2.1 — timed zones fed by the FREE (dieless) enchant line.
        tempZone: [],
        enemyTempAttachments: [],
        // Spec 32 v3 §10 — enemy persistent passives, authored on the bestiary
        // record (optional field; absent = none).
        enemyEnchantments: ((clonedEnemy as Enemy & { enchantments?: string[] }).enchantments ?? []).slice(),
        playerAttachments: [],
        floatingDice,
        premises: 0,
        // Phase 32 part 4b (Oratory — milestone drip): per-COMBAT lifetime
        // Premise total, like `souls`/`akrasiaDebt` — never resets when
        // `premises` itself resets on a Peroration payoff or CONDEMN.
        premiseMilestoneTotal: 0,
        peroration: null,
        souls: 0,
        sway: 0,
        // Phase 32 part 4e (Charm — Resolve milestones): per-COMBAT, like
        // `souls`/`akrasiaDebt` — a milestone already paid never un-fires,
        // even if the enemy's live resolve later shrinks below it.
        swayMilestoneWaveringFired: false,
        swayMilestoneFalteringFired: false,
        omenHits: 0,
        pendingOmens: [],
        spellsPlayedThisTurn: 0,
        lastSpellCardId: null,
        // Spec 32 §12 #4 — the combat ledgers start empty.
        recoilPaidThisTurn: 0,
        enemyDamageThisTurn: 0,
        enemyDamageLastRound: 0,
        // Phase 32 part 3 (Akrasia — DEBT ledger): per-COMBAT, like `souls` —
        // does NOT reset at `startTurn` (unlike `recoilPaidThisTurn` above).
        akrasiaDebt: 0,
        // Phase 32 part 4a (Control — TURNABOUT ledger): per-COMBAT, like
        // `souls`/`akrasiaDebt` — accrues every threat phase regardless of
        // FALLEN/etc gating, consumed (zeroed) only by a `turnabout` play.
        rungsDeniedTotal: 0,
        lastThreatFullyBlocked: false,
        conjuredUids: [],
        threatPhases,
        threatMarks: threatPhases.map(() => 'pending'),
        currentPhaseIndex: 0,
        phaseResults: [],
        round: 1,
        attribution: {},
        chainEffectIds: [],
        guard: 0,
        carriedDie: null,
        directDamageDealt: 0,
        log: [],
        finalOutcome: null,
        // Master Spec §4 — wild-die permanent-growth pool. Starts empty; grown
        // for the rest of the encounter by `grant_permanent_wild_die` cards.
        permanentWildDice: 0,
        permanentDeadDice: 0,
        // Spec 33 §6 (Phase D5) — the character's persisted die-gear rail drives
        // the four dice's face tables + special payloads. Absent on a fresh/
        // pre-D5 player → `activeDieGear` falls back to `DEFAULT_DIE_GEAR` per
        // color. This is the SOLE engine wiring point for the rail; every roll
        // and every fired special reads it via `activeDieGear`.
        dieGear: clonedPlayer.dieGear,
        // THE PATH (owner ruling 2026-09-02) — the two dice progression axes:
        // act-reward dice grow the tray, die upgrades grow the share of live
        // faces in it. Both seeded once, here, from the character.
        bonusTurnDice: clonedPlayer.bonusTurnDice ?? 0,
        dieUpgradeLevel: clonedPlayer.dieUpgradeLevel ?? 0,
        seed,
        // Phase 33c (spec 33 §1) — no coveted die claimed yet this combat.
        covetedDiceClaimed: [],
    };
}

/**
 * Back-compat shim (Spec 25 public API): opens phase-play and starts the first
 * turn. The new granular path is `startTurn` → `draftStanceDie` → play → `endTurn`.
 */
export function rollEncounterDice(
    state: CombatEncounterState,
    rng: () => number = defaultRng,
): CombatTransition {
    if (state.phase !== 'reveal' && state.phase !== 'dice-roll') {
        // Already in play — just ensure the current turn has dice.
        if (state.phase === 'phase-play' && state.dice.length === 0) return startTurn(state, rng);
        return { state, events: [] };
    }
    const opened: CombatEncounterState = { ...state, phase: 'phase-play' };
    return startTurn(opened, rng);
}

/**
 * Spec 26b §1 — starts a turn: rolls THIS turn's 2-die draft pool. Clears any
 * prior draft. No-op unless in phase-play with no live dice/draft.
 */
export function startTurn(
    state: CombatEncounterState,
    rng: () => number = defaultRng,
): CombatTransition {
    if (state.phase !== 'phase-play') return { state, events: [] };
    if (state.draftedDieId !== null) return { state, events: [] }; // already drafted this turn
    // Gate 0 (2026-07-10) — the ROUND-TURN LAW: ONE tray roll per threat
    // phase. A second roll in the same phase is refused outright (state
    // untouched) with a `turn-law-blocked` event so callers and telemetry can
    // see the attempt. The law caps TRAY ROLLS, not card plays — Reserve dice
    // and floating dice still power extra plays WITHIN the one turn (the
    // multi-float turn is owner-locked: ALL floats may be spent in one round).
    if (state.turnTakenThisPhase) {
        const blocked: CombatEvent[] = [
            { kind: 'turn-law-blocked', turn: state.turn, phaseIndex: state.currentPhaseIndex },
        ];
        // The tray/draft/turn are untouched — only the log records the attempt
        // (auditor transcripts must show illegal rolls being refused).
        return { state: withLog(state, blocked), events: blocked };
    }
    // ── Spec 33 (Upgradeable Dice, flag-gated) — the four-die roll law. Rolls
    //    one die per fixed color from its gear's face table; no draft, no
    //    face bag. OVERHEAT cracks bite here (all-miss, then consumed). The
    //    gold+lead pair (flag-on reading of `permanentWildDice`, cap 1 pair)
    //    and floating dice (surge) join; the 7-object table ceiling converts
    //    the overflow to +1◆ by materialization priority (permanent pool →
    //    Reserve → KINDLE → surge/floating).
    if (isUpgradeableDiceEnabled()) {
        const turn = state.turn + 1;
        const cracked = crackedColorsForTurn(state, turn);
        let dice = rollUpgradeableDice(turn, state, cracked, rng);
        if ((state.permanentWildDice ?? 0) > 0) {
            dice = [...dice, ...rollGoldLeadPair(turn, state, rng)];
        }
        if ((state.floatingDice ?? []).length > 0) {
            dice = [...dice, ...(state.floatingDice ?? []).map(d => ({ ...d, state: 'available' as const }))];
        }
        const events: CombatEvent[] = [];
        let conviction = state.conviction;
        let reserve = state.reserve ?? [];
        let floatingDice = state.floatingDice ?? [];
        // Ceiling — refuse lowest-priority objects first: floating (surge),
        // then kindled (temporary) Reserve dice, then the newest banked die.
        while (dice.length + reserve.length > UPGRADEABLE_TABLE_CEILING) {
            const floatIdx = [...dice].reverse().findIndex(d => d.floating);
            if (floatIdx >= 0) {
                const victim = dice[dice.length - 1 - floatIdx];
                dice = dice.filter(d => d.id !== victim.id);
                floatingDice = floatingDice.filter(d => d.id !== victim.id);
            } else {
                const kindled = [...reserve].reverse().find(d => d.temporary) ?? reserve[reserve.length - 1];
                if (!kindled) break;
                reserve = reserve.filter(d => d.id !== kindled.id);
            }
            conviction = Math.min(CONVICTION_CAP, conviction + 1);
            events.push({ kind: 'die-overflowed', source: 'materialize', total: conviction });
            events.push({ kind: 'conviction-gained', amount: 1, total: conviction, reason: 'effect' });
        }
        const chainCarry = settleChainAtTurnBoundary(state, events);
        const next: CombatEncounterState = {
            ...state, dice, reserve, floatingDice, conviction,
            draftedDieId: null, turn, lastRead: 'none', carriedDie: null,
            crackedDice: expireCrackedDice(state.crackedDice, turn),
            spellsPlayedThisTurn: 0, echoNextSpell: false,
            recoilPaidThisTurn: 0, enemyDotDamageThisRound: 0, scrapsThisTurn: 0,
            turnTakenThisPhase: true,
            // THE BIG NUMBERS REWRITE — CHAIN fades unless the closing turn fed
            // it; TWIN never survives the turn that armed it.
            ...chainCarry,
        };
        events.push({ kind: 'turn-dice-rolled', turn, dice });
        events.push({ kind: 'dice-rolled', dice });
        return { state: withLog(next, events), events };
    }
    const turn = state.turn + 1;
    // THE PATH — the tray is TURN_DICE_COUNT plus every act-reward die the
    // player has banked, each rolled from their upgraded face bag.
    let dice = rollTurnDice(
        turn,
        TURN_DICE_COUNT + Math.max(0, state.bonusTurnDice ?? 0),
        rng,
        state.dieUpgradeLevel ?? 0,
    );
    // CLARITY (P0-truth `forceWildOnNextDie` wiring): the bearer's next roll
    // guarantees one WILD die, then the clarity is consumed (`consumedOnUse`).
    let player = state.player;
    const clarityId = hasPayloadFlag(player, 'forceWildOnNextDie');
    if (clarityId) {
        dice = dice.slice();
        dice[0] = { ...dice[0], color: 'wild', state: 'available' };
        player = consumeEffect(player, clarityId);
    }
    // Fate Engine P1 — the invisible `carriedDie` slot-steal is gone; an
    // unspent die now BANKS to the visible Reserve at `endTurn` (R2). A stale
    // carriedDie from an old state literal still honors the legacy behavior.
    let carriedDie = state.carriedDie;
    if (carriedDie) {
        dice = dice.slice();
        dice[0] = { id: `t${turn}-d0`, color: carriedDie, state: carriedDie === 'x' ? 'locked' : 'available', temporary: false };
        carriedDie = null;
    }
    // Master Spec §4 — permanent wild-die pool growth appends bonus dice to
    // EVERY turn's draft pool from here on (not a one-turn trick). No-op while
    // the pool is empty (the common case pre-growth).
    if (state.permanentWildDice || state.permanentDeadDice) {
        dice = [...dice, ...rollPermanentBonusDice(turn, state.permanentWildDice ?? 0, state.permanentDeadDice ?? 0)];
    }
    // Spec 32 v3 §5 — GHOST dice join every turn's tray. They are the same
    // persistent objects each turn (stable ids), never reroll, and are only
    // removed from the pool when SPENT.
    if ((state.floatingDice ?? []).length > 0) {
        dice = [...dice, ...(state.floatingDice ?? []).map(d => ({ ...d, state: 'available' as const }))];
    }
    const events: CombatEvent[] = [
        { kind: 'turn-dice-rolled', turn, dice },
        // Mirror the legacy event so existing presenters keep working.
        { kind: 'dice-rolled', dice },
    ];
    const chainCarry = settleChainAtTurnBoundary(state, events);
    const next: CombatEncounterState = {
        ...state, player, dice, draftedDieId: null, turn, lastRead: 'none', carriedDie,
        // THE BIG NUMBERS REWRITE — CHAIN fades unless the closing turn fed it;
        // TWIN never survives the turn that armed it.
        ...chainCarry,
        spellsPlayedThisTurn: 0, echoNextSpell: false,
        // Spec 32 §12 #4 — the per-turn RECOIL ledger resets with the turn.
        recoilPaidThisTurn: 0,
        // WI-1 — the enemy-DoT accumulator is per-round; a fresh turn zeroes it
        // so `suppurating-curse` only doubles THIS round's real DoT total.
        enemyDotDamageThisRound: 0,
        // WI-10 — the per-turn scrap-pay counter resets with the turn.
        scrapsThisTurn: 0,
        // Gate 0 — this phase's one legal tray roll is now taken.
        turnTakenThisPhase: true,
    };
    return { state: withLog(next, events), events };
}

/**
 * SENSORY NULL on the PLAYER (P0-truth `blocksAdvantage` wiring): the bearer
 * cannot benefit from a won read — advantage clamps to neutral. Losing reads
 * still hurt (the null blinds, it does not protect).
 */
function clampPlayerRead(
    player: Character,
    read: CombatReadResult,
    dieColor: CombatDieColor,
): CombatReadResult {
    let effective = read;
    // buff_haste (and the re-themed precision buffs buff_accuracy_up /
    // buff_critical_rate_up / buff_critical_damage_up) grant GUARANTEED advantage
    // on the drafted stance via `advantageModifier.grantAdvantage`. This is the
    // one player-offense surface the stance-read model can read, so it is where
    // those consumable buffs finally bite. A Wild/X die has no stance ('none'
    // read) and never benefits.
    if (effective !== 'none' && dieHasStance(dieColor)) {
        const grants = getActiveEffectModifiers(player.effects as ActiveEffect[]).advantageGrants;
        if (grants.has(dieColor as Stance)) effective = 'advantage';
    }
    // blocksAdvantage (anti-control) still cancels a granted OR matchup advantage.
    if (effective === 'advantage' && hasPayloadFlag(player, 'blocksAdvantage')) return 'neutral';
    return effective;
}

/**
 * Spec 26b §1 + Fate Engine P1 — drafts one of this turn's dice as the STANCE.
 * The unpicked die is the OMEN (R5): if its color stance-beats the enemy's
 * CURRENT hidden stance, it scouts forward — the NEXT phase's stance is
 * revealed. Then it either BURNS for +1 Conviction (default) or BANKS to the
 * Reserve at 0 pips (R2/R3, `opts.bankUnpicked`, when a slot is free) where it
 * ripens +1 pip per threat phase survived. Winning the hidden-stance read
 * grants a bonus Conviction and reveals the current phase stance.
 */
export function draftStanceDie(
    state: CombatEncounterState,
    dieId: string,
    opts: { bankUnpicked?: boolean } = {},
): CombatTransition {
    // Spec 33 — the draft is retired under the flag: every usable die is a
    // power source; stance comes from cards (§2), not a drafted die.
    if (isUpgradeableDiceEnabled()) return { state, events: [] };
    if (state.phase !== 'phase-play') return { state, events: [] };
    if (state.draftedDieId !== null) return { state, events: [] };
    // Spec 32 v3 §5 — a GHOST die cannot be drafted as the stance: it is an
    // extra power source beyond the turn's 2-die draft (the "bigger turns"
    // intent), spent directly on PAID plays like a Reserve die.
    const drafted = state.dice.find(d => d.id === dieId && !d.floating);
    if (!drafted) return { state, events: [] };

    const events: CombatEvent[] = [];
    const enemyStance = currentPhaseStance(state);
    const read = clampPlayerRead(state.player, resolveRead(drafted.color, enemyStance), drafted.color);

    // Floating dice are exempt from the draft economy entirely: they are not
    // omens, cannot be banked/burned, feed no draft-time resonance.
    const unpicked = state.dice.filter(d => d.id !== dieId && !d.floating);
    let reserve = (state.reserve ?? []).slice();
    let resonance = { heart: 0, body: 0, mind: 0, ...(state.resonance ?? {}) };
    let revealedStances = state.revealedStances;

    // R5 — THE OMEN: an unpicked colored die that beats the CURRENT stance
    // scouts the NEXT phase. Fogged while the player is sensory-nulled.
    const idx = Math.min(state.currentPhaseIndex, state.threatPhases.length - 1);
    const nextIdx = Math.min(idx + 1, state.threatPhases.length - 1);
    const omen = unpicked.find(d => dieHasStance(d.color) && stanceBeats(d.color as Stance, enemyStance));
    if (omen && nextIdx !== idx && !revealedStances.includes(nextIdx)
        && !hasPayloadFlag(state.player, 'blocksAdvantage')) {
        revealedStances = [...revealedStances, nextIdx];
        events.push({
            kind: 'omen-revealed', dieColor: omen.color,
            phaseIndex: nextIdx, stance: state.threatPhases[nextIdx].enemyStance,
        });
    }

    // R2/R3 — BANK-OR-BURN the unpicked die. Banking takes the first colored/
    // wild unpicked die into the Reserve (0 pips) INSTEAD of the +1 Conviction;
    // burning (default) keeps the Spec 26b Conviction economy byte-identical.
    // Either way, every colored unpicked die feeds the Resonance tally (R1).
    let banked: CombatManaDie | null = null;
    if (opts.bankUnpicked && reserve.length < RESERVE_MAX) {
        const candidate = unpicked.find(d => d.color !== 'x');
        if (candidate) {
            banked = { ...candidate, state: 'available', pips: 0 };
            reserve = [...reserve, banked];
            events.push({ kind: 'die-banked', dieId: banked.id, color: banked.color, pips: 0 });
        }
    }
    for (const d of unpicked) {
        if (dieHasStance(d.color)) {
            const color = d.color as 'heart' | 'body' | 'mind';
            resonance = { ...resonance, [color]: resonance[color] + 1 };
            events.push({ kind: 'resonance-gained', color, total: resonance[color] });
        }
    }

    // The drafted die becomes the single tray power source; an X draft stays
    // locked (can't power a card, but CAN be fate-tapped — R4). Banked die
    // leaves the tray; unpicked COLORED dice are consumed; unpicked X dice stay
    // LOCKED — dead faces remain on the table for fate cards + the universal tap.
    const dice = state.dice
        .filter(d => d.id !== banked?.id)
        .map(d => {
            if (d.id === dieId) return { ...d, state: drafted.color === 'x' ? ('locked' as const) : ('available' as const) };
            if (d.floating) return d;   // floating dice stay live in the tray
            if (d.color === 'x') return d;
            return { ...d, state: 'spent' as const };
        });

    let conviction = state.conviction;
    events.push({ kind: 'die-drafted', dieId, color: drafted.color, read });
    // Dice-law rework (2026-07-09): EVERY unused rolled die converts to tokens —
    // +1 Conviction per colored die, +2 for a WILD (gold) die, +0 for a dead X.
    // A banked die is saved, not unused: it earns no token.
    for (const d of unpicked) {
        if (d.id === banked?.id) continue;
        const gain = d.color === 'wild' ? CONVICTION_PER_UNPICKED_WILD
            : d.color === 'x' ? 0 : CONVICTION_PER_UNPICKED_DIE;
        if (gain > 0) {
            conviction = Math.min(CONVICTION_CAP, conviction + gain);
            events.push({ kind: 'conviction-gained', amount: gain, total: conviction, reason: 'unpicked-die' });
        }
    }
    if (read === 'advantage') {
        conviction = Math.min(CONVICTION_CAP, conviction + CONVICTION_READ_WIN_BONUS);
        events.push({ kind: 'conviction-gained', amount: CONVICTION_READ_WIN_BONUS, total: conviction, reason: 'read-win' });
    }

    // Reveal the phase's hidden stance on first contest.
    if (!revealedStances.includes(idx)) {
        revealedStances = [...revealedStances, idx];
        events.push({ kind: 'stance-revealed', phaseIndex: idx, stance: enemyStance });
    }
    events.push({ kind: 'read-result', stance: drafted.color, enemyStance, result: read });

    const next: CombatEncounterState = {
        ...state, dice, reserve, resonance, draftedDieId: dieId, conviction, revealedStances, lastRead: read,
        // A fresh draft starts a fresh combo chain (Spec 26b tuning §3).
        chainEffectIds: [],
    };
    return { state: withLog(next, events), events };
}

/** Spec 26b §1 + Fate Engine P1 — ends the turn: clears the draft so the next
 *  turn can roll. An unspent (still-available, non-X) drafted die BANKS to the
 *  Reserve when a slot is free (R2 — the visible successor of the invisible
 *  `carriedDie`), else it burns for +1 Conviction. */
export function endTurn(state: CombatEncounterState): CombatTransition {
    if (state.phase !== 'phase-play') return { state, events: [] };
    // Spec 33 §6 (flag-gated) — the Reserve's flag-on form: at end of round,
    // ONE unspent mana/special tray die banks (cap RESERVE_MAX), best face
    // first (special > mana — a banked special still fires its payload when
    // spent from the Reserve, use-triggered). Unbanked dice simply expire —
    // misses were always worth 0◆ and unspent mana earns nothing (§1: income
    // is specials + yield bonuses only, never leftovers).
    if (isUpgradeableDiceEnabled()) {
        const events: CombatEvent[] = [];
        let reserve = state.reserve ?? [];
        if (reserve.length < RESERVE_MAX) {
            const candidates = state.dice.filter(d => !d.floating && d.state === 'available' && d.face !== 'miss');
            const best = candidates.find(d => d.face === 'special') ?? candidates[0];
            if (best) {
                reserve = [...reserve, { ...best, pips: 0 }];
                events.push({ kind: 'die-banked', dieId: best.id, color: best.color, pips: 0 });
            }
        }
        const next: CombatEncounterState = {
            ...state, dice: [], reserve, draftedDieId: null, lastRead: 'none', carriedDie: null,
        };
        return { state: withLog(next, events), events };
    }
    const events: CombatEvent[] = [];
    const d = draftedDie(state);
    let reserve = state.reserve ?? [];
    let conviction = state.conviction;
    if (d && !d.floating && d.state === 'available' && d.color !== 'x') {
        if (reserve.length < RESERVE_MAX) {
            reserve = [...reserve, { ...d, pips: 0 }];
            events.push({ kind: 'die-banked', dieId: d.id, color: d.color, pips: 0 });
        } else {
            const gain = d.color === 'wild' ? CONVICTION_PER_UNPICKED_WILD : CONVICTION_PER_UNPICKED_DIE;
            conviction = Math.min(CONVICTION_CAP, conviction + gain);
            events.push({ kind: 'conviction-gained', amount: gain, total: conviction, reason: 'unpicked-die' });
        }
    }
    const next: CombatEncounterState = {
        ...state, dice: [], reserve, conviction, draftedDieId: null, lastRead: 'none', carriedDie: null,
    };
    return { state: withLog(next, events), events };
}

/**
 * Phase 31 (EA-7) — THE STAKE: places a pre-play wager on the enemy's hidden
 * stance for the CURRENT threat phase. Settles at the top of
 * `resolveThreatPhase` (see `settleStake`) against the phase's actual
 * `enemyStance` — win pays out a floating die (2◆ colored, 4◆ colored +1
 * pip, 6◆ wild); loss burns the wager and adds a round-equivalent to the
 * escalation clock. Post-draft only (WI-3's fuller spec, chosen over the
 * looser "before the draft" summary-doc phrasing — see the phase 31 brief's
 * scoping note): the player has already committed this turn's stance die
 * before staking. A no-op (state unchanged, mirrors `startTurn`'s silent-
 * guard convention) when a stake is already live, the phase isn't
 * phase-play, no die has been drafted yet, or Conviction can't cover the
 * amount — the mobile UI only offers the stake chip when the wager is legal.
 */
export function placeStake(
    state: CombatEncounterState,
    color: WheelStance,
    amount: 2 | 4 | 6,
): CombatTransition {
    // Spec 33 [owner-locked, D1] — STAKE is RETIRED under the flag (the wager
    // retires with the read; not rewired onto stance checks). Silent no-op,
    // mirroring this function's other guards.
    if (isUpgradeableDiceEnabled()) return { state, events: [] };
    if (state.phase !== 'phase-play') return { state, events: [] };
    if (state.stake) return { state, events: [] };
    if (state.draftedDieId === null) return { state, events: [] };
    if (state.conviction < amount) return { state, events: [] };

    const conviction = state.conviction - amount;
    const events: CombatEvent[] = [{ kind: 'stake-placed', color, amount }];
    const next: CombatEncounterState = { ...state, conviction, stake: { color, amount } };
    return { state: withLog(next, events), events };
}

/**
 * Fate Engine P1 R4 — the universal FATE TAP: once per turn, tap a dead X die
 * for "+1 tick on one enemy DoT" (the strongest — even dead fate erodes) or
 * +1 Conviction. The tapped die is consumed. No-op outside phase-play, when
 * already tapped this turn, or when the id is not a live X die.
 */
export function tapFateDie(
    state: CombatEncounterState,
    dieId: string,
    choice: 'dot-tick' | 'conviction',
): CombatTransition {
    if (state.phase !== 'phase-play' || state.finalOutcome) return { state, events: [] };
    if (state.fateTappedTurn === state.turn) return { state, events: [] };
    const die = state.dice.find(d => d.id === dieId && d.color === 'x' && d.state !== 'spent');
    if (!die) return { state, events: [] };

    const events: CombatEvent[] = [];
    let enemy = state.enemy;
    let conviction = state.conviction;
    let souls = state.souls ?? 0;
    if (choice === 'conviction') {
        conviction = Math.min(CONVICTION_CAP, conviction + FATE_TAP_CONVICTION);
        events.push({ kind: 'fate-tapped', dieId, choice, amount: FATE_TAP_CONVICTION });
        events.push({ kind: 'conviction-gained', amount: FATE_TAP_CONVICTION, total: conviction, reason: 'effect' });
    } else {
        const ticks = getActiveDotTotal(enemy.effects, state.round).perEffect;
        const strongest = ticks.reduce<typeof ticks[number] | null>(
            (best, t) => (best === null || t.amount > best.amount ? t : best), null);
        if (!strongest) {
            const fizzle: CombatEvent[] = [{ kind: 'effect-fizzled', cardId: '', effectId: '', message: 'no DoT on the enemy to advance' }];
            return { state: withLog(state, fizzle), events: fizzle };
        }
        enemy = applyDamage(enemy, strongest.amount);
        events.push({ kind: 'fate-tapped', dieId, choice, amount: strongest.amount });
        events.push({ kind: 'dot-tick', effectId: strongest.effectId, label: strongest.label, amount: strongest.amount, target: 'enemy' });
        // Same tick body as the clocks: a decaysPerTick DoT pays a stack for
        // this manual tick, washes out at 0, and a soul-worthy washout still
        // yields its expiry Soul.
        const decayed = decayManuallyTickedDots(enemy, [strongest.effectId]);
        enemy = decayed.bearer;
        const washSouls = soulWorthyWashouts(decayed.washedOut);
        if (washSouls > 0) {
            souls += washSouls;
            events.push({ kind: 'soul-gained', amount: washSouls, total: souls, reason: 'expiry' });
        }
    }
    const next: CombatEncounterState = {
        ...state, enemy, conviction, souls,
        dice: state.dice.map(d => (d.id === dieId ? { ...d, state: 'spent' as const } : d)),
        fateTappedTurn: state.turn,
    };
    return checkImmediateOutcome(withLog(next, events), events);
}

/**
 * Spec 33 §6 (flag-gated) — OVERHEAT, reinterpreted: push an already-SPENT
 * tray die back to `available` so it can power a SECOND card this round. The
 * push always succeeds; the RISK is the crack — `OVERHEAT_CRACK_CHANCE` that
 * the die is all-miss NEXT round (and excluded from that round's Press Fate).
 * The second play is a normal paid play: it moves stance and momentum. Any
 * die may be overheated, gold included. Cards carry this verb from D4; the
 * engine primitive ships here so D3's policies can exercise it.
 */
export function overheatSpentDie(
    state: CombatEncounterState,
    dieId: string,
    rng: () => number = defaultRng,
): CombatTransition {
    if (!isUpgradeableDiceEnabled()) return { state, events: [] };
    if (state.phase !== 'phase-play' || state.finalOutcome) return { state, events: [] };
    const die = state.dice.find(d => d.id === dieId && !d.floating && d.state === 'spent');
    if (!die || die.face === 'miss' || die.color === 'x') return { state, events: [] };

    const events: CombatEvent[] = [{ kind: 'die-refreshed', dieId: die.id, color: die.color }];
    let crackedDice = state.crackedDice ?? [];
    if (rng() < OVERHEAT_CRACK_CHANCE) {
        crackedDice = [...crackedDice, { color: die.color as 'heart' | 'body' | 'mind' | 'wild', turn: state.turn + 1 }];
        events.push({ kind: 'die-cracked', dieId: die.id, color: die.color });
    }
    const next: CombatEncounterState = {
        ...state, crackedDice,
        dice: state.dice.map(d => (d.id === dieId ? { ...d, state: 'available' as const } : d)),
    };
    return { state: withLog(next, events), events };
}

/** The drafted stance die for this turn (or null). */
function draftedDie(state: CombatEncounterState): CombatManaDie | null {
    if (!state.draftedDieId) return null;
    return state.dice.find(d => d.id === state.draftedDieId) ?? null;
}

function withLog(state: CombatEncounterState, events: CombatEvent[]): CombatEncounterState {
    if (!events.length) return state;
    // AXM Log tap: `withLog` is the single choke point every emission site
    // routes through, so one guarded forward here mirrors the whole combat
    // event stream. One boolean read when logging is off (the sim default).
    if (isLoggingEnabled()) forwardCombatEventsToLog(events);
    // WI-1 — accumulate the REAL DoT damage the enemy takes this round as its
    // ticks are logged. `withLog` is the single choke point every emission site
    // routes through, so folding here catches all enemy `dot-tick` families
    // (card-played / damage-instance / fate-tap / TICK) without threading an
    // accumulator through each. Reset at `startTurn`; consumed by
    // `suppurating-curse` in `processBetweenPhases`.
    let enemyDot = state.enemyDotDamageThisRound ?? 0;
    for (const e of events) {
        if (e.kind === 'dot-tick' && e.target === 'enemy') enemyDot += e.amount;
    }
    return { ...state, log: [...state.log, ...events], enemyDotDamageThisRound: enemyDot };
}

// ── Card play (§9 playCombatCard) ────────────────────────────────────────────

/**
 * Plays one card from hand. `useBottom` powers the full effect (costs dice via
 * RPS scaling, executes the card, drives impact + the die-refresh loop); the
 * free top action contributes a weak flat impact with no die.
 *
 * `play.chosenX` (WS7.2, spec 32 §12 item 5) — the player-chosen X for a
 * chosen-X mechanic (`recoil_x`); the engine clamps it to [min, affordable].
 * Absent, the mechanic resolves at its printed minimum.
 *
 * `play.omenClaim` (phase 32 part 4d — OMEN v2) — the player-chosen
 * stance/window claim for an `omen` mechanic; the engine clamps `window` to
 * [1, the card's printed `maxWindow`]. Absent, the mechanic falls back to
 * `window: 1` and the pre-v2 die-derived stance (see `playBottomAction`).
 */
export function playCombatCard(
    state: CombatEncounterState,
    cardRef: { uid?: string; cardId?: string },
    useBottom: boolean,
    dieId?: string,
    rng: () => number = defaultRng,
    /** Per-play choices. `chosenX` — WS7.2 chosen-X recoil. `reprisalCardId`
     *  — REPRISE songbook choice (phase 28), see `playBottomAction`.
     *  `omenClaim` — phase 32 part 4d OMEN v2 stance/window claim. All
     *  optional and additive; omitted callers keep the pre-existing
     *  defaults. */
    play?: { chosenX?: number; reprisalCardId?: string; omenClaim?: { stance: Stance; window: number } },
): CombatTransition {
    if (state.phase !== 'phase-play') return { state, events: [] };

    const entry = cardRef.uid
        ? state.hand.find(h => h.uid === cardRef.uid)
        : state.hand.find(h => h.cardId === cardRef.cardId);
    if (!entry) return { state, events: [] };

    const card = getCard(entry.cardId);
    if (!card) return { state, events: [] };

    const transition = useBottom
        ? playBottomAction(state, entry.uid, card, dieId, rng, play?.chosenX, play?.reprisalCardId, play?.omenClaim)
        : playTopAction(state, entry.uid, card, rng);
    // Spec 33 (flag-gated) — stance-from-cards + the null-reset momentum chain
    // replace the v1 wheel entirely; FREE plays never touch either (§3 rule 5).
    if (isUpgradeableDiceEnabled()) return applyStanceAndMomentumV2(state, transition, card.stance, useBottom);
    return advanceMomentumWheel(state, transition, card.stance);
}

/**
 * Spec 33 §2/§3 (flag-gated) — post-play bookkeeping for a LANDED PAID play:
 * 1. BOON payload (§1, owner-ratified use-triggered rule): the powering die's
 *    special face fires its gear payload (+◆) because it was USED.
 * 2. Stance-from-cards: the player's stance becomes this card's stance.
 * 3. Momentum: start / advance / break-to-NULL (owner-locked D1); a completed
 *    3-chain SURGES — a temporary gold die (until spent, this combat) joins
 *    the tray, ceiling permitting (overflow → +1◆) — then momentum resets.
 * FREE (top) plays and fizzles return untouched.
 */
function applyStanceAndMomentumV2(
    preState: CombatEncounterState,
    transition: CombatTransition,
    stance: CombatDieColor,
    useBottom: boolean,
): CombatTransition {
    if (!useBottom) return transition;
    const played = transition.events.find(e => e.kind === 'card-played');
    if (!played || played.kind !== 'card-played') return transition;
    let state = transition.state;
    if (state.phase === 'complete') return transition;
    const events: CombatEvent[] = [];

    // 1. BOON fires on USE (the single ratified switch).
    if (SPECIAL_FIRES_ON_USE && played.dieId) {
        const preDie = preState.dice.find(d => d.id === played.dieId)
            ?? (preState.reserve ?? []).find(d => d.id === played.dieId);
        if (preDie?.face === 'special' && preDie.color !== 'x') {
            const gear = activeDieGear(preState, preDie.color as 'heart' | 'body' | 'mind' | 'wild');
            const granted = gear.specialConviction;
            const conviction = Math.min(CONVICTION_CAP, state.conviction + granted);
            if (conviction > state.conviction) {
                state = { ...state, conviction };
                events.push({ kind: 'special-fired', dieId: preDie.id, conviction: granted, total: conviction });
                events.push({ kind: 'conviction-gained', amount: conviction - transition.state.conviction, total: conviction, reason: 'effect' });
            }
        }
    }

    // 2 + 3. Stance + momentum — chain stances only (wild/x synthetics touch
    // neither: "wilds don't shift it").
    if (isChainStance(stance)) {
        if (state.playerStance !== stance) {
            state = { ...state, playerStance: stance };
            events.push({ kind: 'stance-shifted', stance });
        }
        const result = advanceMomentumV2(state.momentumV2 ?? null, stance);
        state = { ...state, momentumV2: result.momentum };
        if (result.broke) {
            events.push({ kind: 'momentum-broken', by: stance });
        } else if (result.surged) {
            if (tableHasRoom(state)) {
                const dieId = `${SURGE_DIE_PREFIX}${state.turn}-${state.log.length}`;
                const die: CombatManaDie = {
                    id: dieId, color: 'wild', face: 'mana', state: 'available',
                    temporary: true, floating: true,
                };
                state = { ...state, dice: [...state.dice, die], floatingDice: [...(state.floatingDice ?? []), die] };
                events.push({ kind: 'momentum-surged', dieId });
            } else {
                const conviction = Math.min(CONVICTION_CAP, state.conviction + 1);
                state = { ...state, conviction };
                events.push({ kind: 'die-overflowed', source: 'surge', total: conviction });
                events.push({ kind: 'conviction-gained', amount: 1, total: conviction, reason: 'effect' });
            }
        } else {
            events.push({ kind: 'momentum-advanced', color: stance, length: result.momentum?.length ?? 1 });
        }
    }

    if (events.length === 0) return transition;
    return { state: withLog(state, events), events: [...transition.events, ...events] };
}

/**
 * Spec 26b — scrap a hand card for +1 Conviction. Turns a dead draw into resolve
 * toward a Signature Skill (the agency lever through a bad hand). Phase-play only.
 *
 * WI-10 (2026-07-12): only the first {@link SCRAP_CONVICTION_CAP_PER_TURN} scraps
 * per turn PAY. The hand refills to 6, so an ungated scrap-the-hand banked
 * +6◆/turn against the 12 cap; beyond the cap a scrap still cycles the dead card
 * (agency preserved) but pays nothing. The `conviction-gained` event carries
 * `reason: 'scrap'` so the gate is testable and telemetry can see it.
 */
export function discardCombatCard(state: CombatEncounterState, uid: string): CombatTransition {
    if (state.phase !== 'phase-play') return { state, events: [] };
    const entry = state.hand.find(h => h.uid === uid);
    if (!entry) return { state, events: [] };
    const scrapsThisTurn = state.scrapsThisTurn ?? 0;
    const pays = scrapsThisTurn < SCRAP_CONVICTION_CAP_PER_TURN;
    const conviction = pays ? Math.min(CONVICTION_CAP, state.conviction + 1) : state.conviction;
    // WS2.1: scrapping a conjured Haunt (when it pays) still earns its +1
    // Conviction, but the one-use token leaves the combat — it never joins the
    // discard cycle (where a reshuffle would resurrect it as a permanent card).
    const conjured = (state.conjuredUids ?? []).includes(uid);
    const next: CombatEncounterState = {
        ...state,
        hand: state.hand.filter(h => h.uid !== uid),
        discard: conjured ? state.discard : [...state.discard, entry.cardId],
        conjuredUids: conjured
            ? (state.conjuredUids ?? []).filter(u => u !== uid)
            : state.conjuredUids,
        conviction,
        scrapsThisTurn: scrapsThisTurn + 1,
    };
    const events: CombatEvent[] = pays
        ? [{ kind: 'conviction-gained', amount: 1, total: conviction, reason: 'scrap' }]
        : [];
    return { state: withLog(next, events), events };
}

/** Removes a hand entry to the discard. */
function discardEntry(state: CombatEncounterState, uid: string): CombatEncounterState {
    const entry = state.hand.find(h => h.uid === uid);
    if (!entry) return state;
    return {
        ...state,
        hand: state.hand.filter(h => h.uid !== uid),
        discard: [...state.discard, entry.cardId],
    };
}

/**
 * Removes a played hand entry honoring the CONJURE one-use law (spec 32 v3,
 * WS2.1): a conjured Haunt leaves the combat ENTIRELY — it never enters
 * the discard pile, so it can never reshuffle back into the deck cycle.
 * Anything else discards normally.
 */
function removePlayedEntry(state: CombatEncounterState, uid: string): CombatEncounterState {
    if (!(state.conjuredUids ?? []).includes(uid)) return discardEntry(state, uid);
    return {
        ...state,
        hand: state.hand.filter(h => h.uid !== uid),
        conjuredUids: (state.conjuredUids ?? []).filter(u => u !== uid),
    };
}

// ── Spec 32 v3 — shared rider/state helpers ──────────────────────────────────

/** True when any zone — permanent or temporary — carries a given card id (player
 *  enchantment or enemy-attached disenchant). The zone IS the hook registry: each
 *  persistent card's passive is implemented at its trigger site, gated by this
 *  check. Spec 32 v4 — a FREE-line TIMED instance (`tempZone` / `enemyTempAttachments`)
 *  lights up the exact same hook while its `roundsLeft` holds, so the weak and the
 *  permanent versions differ only in duration, never in effect. */
function zoneHas(state: CombatEncounterState, cardId: string): boolean {
    // THE PATH — card upgrades. An oath/hex passive is hooked by LITERAL card
    // id (`zoneHas(state, 'every-stone-an-oath')`), so an upgraded copy sitting
    // in the zone as `every-stone-an-oath+` would match nothing and the card
    // would silently lose the only thing it does — a strict DOWNGRADE wearing a
    // `+`. Compare on the BASE id so `x` and `x+` are the same oath.
    const want = baseCardId(cardId);
    const sameCard = (id: string): boolean => baseCardId(id) === want;
    return state.persistentZone.some(sameCard)
        || (state.enemyAttachments ?? []).some(sameCard)
        || (state.enemyEnchantments ?? []).some(sameCard)
        || (state.tempZone ?? []).some(t => sameCard(t.cardId))
        || (state.enemyTempAttachments ?? []).some(t => sameCard(t.cardId));
}

/** Phase 33d (GLYPHS pilot) — the live glyphs of a given payload kind, array
 *  order preserved (deterministic — `crackGlyph`/`glyphShatter` both pick a
 *  target off this order rather than any RNG). */
function glyphsOfKind(state: CombatEncounterState, kind: GlyphPayload['kind']): GlyphInstance[] {
    return (state.glyphs ?? []).filter(g => g.payload.kind === kind);
}

/** WS3.2 'damage-instance' clock — the shared enemy-damage funnel: applies the
 *  hit, then advances every damage-instance-clocked DoT on the enemy (BLEED's
 *  ratified shape). DoT-clock ticks themselves never route through here
 *  (clocks must not cascade), and the trigger's own tick damage lands via the
 *  plain `applyDamage` inside `fireDotTrigger`, so a damage-instance DoT can
 *  never re-trigger itself. Emits the clock's `dot-tick` events; callers fold
 *  `clockDamage` into their direct-damage tally and — where a Soul channel is
 *  in scope — count `washedOut` via `soulWorthyWashouts`.
 *
 *  `erode` (phase 32 part 1 — Harvest REAP attacks MAXIMUM HP): when true,
 *  the initial hit is applied via `erodeMaxHealth` instead of `applyDamage`
 *  — same current-HP subtraction, plus an identical `maxHealth` reduction in
 *  the SAME call, so the damage-instance clock still fires exactly once,
 *  sourced off the already-eroded enemy (no double subtraction, no second
 *  damage instance). */
function applyEnemyDamage(
    enemy: Enemy,
    amount: number,
    round: number,
    events: CombatEvent[],
    erode = false,
): { enemy: Enemy; clockDamage: number; washedOut: ActiveEffect[] } {
    if (amount <= 0) return { enemy, clockDamage: 0, washedOut: [] };
    let next = erode ? erodeMaxHealth(enemy, amount) : applyDamage(enemy, amount);
    const clock = fireDotTrigger(next, 'damage-instance', round);
    if (clock.damage > 0) {
        next = clock.target;
        for (const t of clock.perEffect) {
            events.push({ kind: 'dot-tick', effectId: t.effectId, label: t.label, amount: t.amount, target: 'enemy' });
        }
    }
    return { enemy: next, clockDamage: clock.damage, washedOut: clock.washedOut };
}

/**
 * THE BIG NUMBERS REWRITE (2026-09-02) — the foe's effective HIDE.
 *
 * HIDE N subtracts N from every hit, to a floor of 1 (Mage Knight's armour
 * floor: a hit always scratches). ELUSIVE doubles it until the player has
 * landed a rung of STAGGER on the foe this round — the control answer to the
 * armour answer. PIERCE skips this call entirely.
 */
export function effectiveHide(enemy: Enemy, staggeredThisRound: boolean): number {
    const hide = findEnemyKeyword(enemy.keywords, 'hide')?.n ?? 0;
    if (hide <= 0) return 0;
    const elusive = hasEnemyKeyword(enemy.keywords, 'elusive') && !staggeredThisRound;
    return elusive ? hide * 2 : hide;
}

/**
 * THE BIG NUMBERS REWRITE (2026-09-02) — the scalers a single player hit picks
 * up on its way to the foe, folded in one place so every damage source (the
 * `deal` mechanic, a rider's `damage`, a payoff burst) reads the same rules.
 *
 * Order matters and is authored, not incidental:
 *   1. the READ multiplier (winning the read makes the hit bite)
 *   2. the colour-match bonus, as a percentage of what the read left
 *   3. WRATH — flat, every hit, all combat
 *   4. CHAIN — flat, the next hit only (the caller spends it)
 *   5. FLAY — +50%, consuming one stack (the caller spends it)
 *   6. EXECUTE — doubled while the foe is at or below the printed threshold
 *   7. HIDE — subtracted last, floor 1, unless the hit PIERCEs
 *
 * Multiplicative steps run before the flat armour subtraction so HIDE is a
 * genuine floor on small hits rather than a percentage tax on big ones.
 */
export interface PlayerHitParams {
    base: number;
    readMult: number;
    colorMatch: boolean;
    wrath: number;
    chain: number;
    flay: boolean;
    execute: boolean;
    hide: number;
    pierce: boolean;
}

export function scalePlayerHit(params: PlayerHitParams): number {
    return scalePlayerHitDetailed(params).dmg;
}

/**
 * `scalePlayerHit` plus the receipt: how much of the hit HIDE actually soaked
 * (bounded by the floor-1 rule, so it can be less than the printed N on a
 * small hit). Callers emit it as an `enemy-keyword-fired` HIDE popup — the
 * only enemy keyword that changed the arithmetic silently until the
 * 2026-09-04 playtest (a 5-VITAE swing per hit with no on-screen witness).
 */
export function scalePlayerHitDetailed(params: PlayerHitParams): { dmg: number; hideSoaked: number } {
    if (params.base <= 0) return { dmg: 0, hideSoaked: 0 };
    let dmg = Math.round(params.base * params.readMult);
    if (params.colorMatch) dmg += colorMatchBonus(dmg);
    dmg += params.wrath;
    dmg += params.chain;
    if (params.flay) dmg = Math.round(dmg * FLAY_DAMAGE_MULT);
    if (params.execute) dmg = Math.round(dmg * EXECUTE_DAMAGE_MULT);
    let hideSoaked = 0;
    if (!params.pierce && params.hide > 0) {
        const armoured = Math.max(1, dmg - params.hide);
        hideSoaked = Math.max(0, dmg - armoured);
        dmg = armoured;
    }
    return { dmg: Math.max(0, dmg), hideSoaked };
}

/**
 * THE BIG NUMBERS REWRITE (2026-09-02) — settle the per-turn damage-scaler
 * ledgers at a turn boundary.
 *
 * CHAIN fades to nothing unless a play in the turn just ended fed it — the
 * Dawncaster rule that makes CHAIN belong to the deck that keeps swinging
 * rather than to the deck that banked one stack and sat on it. TWIN never
 * outlives the turn that armed it. WRATH and FLAY are untouched: WRATH is
 * combat-long by design, and FLAY sits on the foe until the hits spend it.
 */
function settleChainAtTurnBoundary(
    state: CombatEncounterState,
    events: CombatEvent[],
): Pick<CombatEncounterState, 'chain' | 'chainFedThisTurn' | 'twinArmed'> {
    const held = state.chain ?? 0;
    const fed = state.chainFedThisTurn === true;
    if (held > 0 && !fed) events.push({ kind: 'chain-faded', from: held });
    return {
        chain: fed ? held : 0,
        chainFedThisTurn: false,
        twinArmed: false,
    };
}

/** WS3.2 Soul economy — decay-consumed instances of NO-CALENDAR debuffs
 *  (`calendarExpiry === false`) expire BY decay: they owe the same Soul a
 *  calendar expiry would (Harvest must not starve when calendars disappear).
 *  Legacy calendar-carrying effects keep today's behavior (washout ≠ expiry). */
function soulWorthyWashouts(washedOut: readonly ActiveEffect[]): number {
    return washedOut.filter(ae => {
        const def = lookupEffectDef(ae.effectId);
        return def?.type === 'debuff' && def.payload.dotModifiers?.calendarExpiry === false;
    }).length;
}

/** Manual TICK verbs (fate-tap 'dot-tick', the `tickOne` / `tickAllDots`
 *  riders) share the clock-owned tick body's decay rule: a `decaysPerTick`
 *  DoT loses 1 intensity each time it ticks and washes out at 0 — exactly
 *  what `processDamageOverTime` / `fireDotTrigger` enforce. Front-loaded
 *  fuel (BLEED) must pay its stacks on manual ticks too, and the washouts
 *  are reported so the Soul economy sees expiry-by-decay on these paths. */
function decayManuallyTickedDots<T extends Combatant>(
    bearer: T,
    tickedEffectIds: readonly string[],
): { bearer: T; washedOut: ActiveEffect[] } {
    if (tickedEffectIds.length === 0) return { bearer, washedOut: [] };
    const washedOut: ActiveEffect[] = [];
    let changed = false;
    const effects = bearer.effects.reduce<ActiveEffect[]>((acc, ae) => {
        const p = lookupEffectDef(ae.effectId)?.payload;
        if (tickedEffectIds.includes(ae.effectId) && p?.dotModifiers?.decaysPerTick) {
            changed = true;
            if (ae.intensity > 1) acc.push({ ...ae, intensity: ae.intensity - 1 });
            else washedOut.push(ae); // intensity 1 → the instance is spent
        } else {
            acc.push(ae);
        }
        return acc;
    }, []);
    return changed ? { bearer: { ...bearer, effects }, washedOut } : { bearer, washedOut };
}

/** SOUL gain (Harvest): bumps the bank (spec 32 v3 §1 source 3). */
function gainSouls(
    state: CombatEncounterState,
    amount: number,
    reason: 'expiry' | 'consumed' | 'granted',
    events: CombatEvent[],
): CombatEncounterState {
    if (amount <= 0) return state;
    let souls = (state.souls ?? 0) + amount;
    events.push({ kind: 'soul-gained', amount, total: souls, reason });
    // `choirbone-reliquary` (E): the box counts every ending — each
    // affliction that expires or is consumed yields +1 SOUL and PLEA 4 on
    // top of the base law. Gated on reason so its OWN grants never recurse.
    // Card face, THE BIG NUMBERS REWRITE 2026-09-02: "gain 1 SOUL and PLEA
    // 4" — this hook predates the rewrite's text and was left granting PLEA
    // 1:1 with the SOUL bonus; fixed to match the printed PLEA number,
    // card-face-honesty.
    let next: CombatEncounterState = { ...state, souls };
    if (reason !== 'granted' && zoneHas(state, 'choirbone-reliquary')) {
        souls += amount;
        events.push({ kind: 'soul-gained', amount, total: souls, reason: 'granted' });
        next = gainSway({ ...next, souls }, amount * 4, events);
    }
    return next;
}

/** PLEA gain (spec 32 v3 §9, reworked by plan/tuning/
 *  2026-07-08-win-path-scaling.md item 1a to a Dawncaster Charmed-style
 *  `resolve` threshold — see `capitulateThreshold`): PLEA ≥ the enemy's
 *  resolve opens an explicit ACCEPT / CONTINUE choice. It never resolves the
 *  outcome by itself. Eligibility is checked after gains and at boundaries.
 *
 *  Phase 32 part 4e (Charm — Resolve milestones): the SINGLE insertion point
 *  every PLEA source funnels through (mirrors `gainPremises` being Oratory's
 *  one insertion point in Part 4b) — so the Wavering/Faltering dividends
 *  below are universal across every PLEA source, not scoped to a single
 *  card. Checked AFTER the scaled gain lands, against the LIVE
 *  `capitulateThreshold` (resolve can itself shrink as the enemy's HP
 *  falls) — see `swayResolveMilestoneThresholds`. */
function gainSway(
    state: CombatEncounterState,
    amount: number,
    events: CombatEvent[],
): CombatEncounterState {
    if (amount <= 0) return state;
    // Grace late-stage rebalance (2026-07-08): buff_grace_momentum multiplies
    // every PLEA gain by its payload's outgoingSwayGainMulPct per stack — a
    // genuinely compounding payoff, not just a flat bonus.
    const momentum = state.player.effects.find(e => e.effectId === 'buff_grace_momentum');
    let scaledAmount = amount;
    if (momentum) {
        const momentumDef = lookupEffectDef('buff_grace_momentum');
        const pct = momentumDef?.payload.outgoingSwayGainMulPct ?? 0;
        scaledAmount = Math.round(amount * (1 + (pct / 100) * momentum.intensity));
    }
    let sway = (state.sway ?? 0) + scaledAmount;
    events.push({ kind: 'sway-gained', amount: scaledAmount, total: sway });

    // Resolve milestones: each waypoint fires AT MOST ONCE this combat — a
    // milestone already paid stays paid even if a later call's LIVE resolve
    // (recomputed every time, since the enemy's HP can fall between gains)
    // shrinks back below the threshold that was crossed.
    let enemy = state.enemy;
    let waveringFired = state.swayMilestoneWaveringFired ?? false;
    let falteringFired = state.swayMilestoneFalteringFired ?? false;
    const resolve = capitulateThreshold(state.enemy);
    const { wavering, faltering } = swayResolveMilestoneThresholds(resolve);
    if (!waveringFired && sway >= wavering) {
        waveringFired = true;
        // Wavering — one stack of QUARTER on the enemy, Charm's own
        // rapport-building idiom (soft-word / disarming-smile /
        // common-ground / the-olive-branch's exact payload).
        const def = lookupEffectDef('debuff_quarter');
        let landedIntensity = SWAY_WAVERING_RAPPORT;
        if (def) {
            const applied = applyEffect(enemy.effects, def, state.round, {
                intensityDelta: SWAY_WAVERING_RAPPORT,
                sourceId: 'sway-resolve-milestone',
            });
            enemy = { ...enemy, effects: applied.activeEffects };
            landedIntensity = applied.result.activeEffect?.intensity ?? SWAY_WAVERING_RAPPORT;
        }
        events.push({
            kind: 'sway-milestone', milestone: 'wavering', threshold: wavering, total: sway,
            effectId: 'debuff_quarter', intensity: landedIntensity,
        });
    }
    if (!falteringFired && sway >= faltering) {
        falteringFired = true;
        // Faltering — a small bonus PLEA nudge (unscaled by momentum; see
        // SWAY_FALTERING_BONUS's own doc comment for why GUARD/heal were
        // rejected in favor of PLEA at this call site).
        sway += SWAY_FALTERING_BONUS;
        events.push({ kind: 'sway-milestone', milestone: 'faltering', threshold: faltering, total: sway, bonus: SWAY_FALTERING_BONUS });
    }

    return {
        ...state,
        sway,
        enemy,
        swayMilestoneWaveringFired: waveringFired,
        swayMilestoneFalteringFired: falteringFired,
    };
}

function swayOffersCapitulation(state: CombatEncounterState): boolean {
    // A DEFEATED enemy cannot yield — HP 0 is victory. A rejected yield is a
    // permanent player decision for this encounter; do not ambush them with the
    // same modal after every later play.
    return !state.capitulationDeclined
        && !state.capitulationChoiceActive
        && (state.sway ?? 0) > 0
        && !isDefeated(state.enemy)
        && (state.sway ?? 0) >= capitulateThreshold(state.enemy);
}

function offerCapitulation(state: CombatEncounterState, events: CombatEvent[]): CombatTransition {
    const offered: CombatEvent = {
        kind: 'capitulation-offered',
        threshold: capitulateThreshold(state.enemy),
    };
    const choosing: CombatEncounterState = {
        ...state,
        phase: 'mercy-choice',
        capitulationChoiceActive: true,
    };
    return { state: withLog(choosing, [offered]), events: [...events, offered] };
}

/** CHARGE gain + the SENTENCE trigger (spec 32 v3 T2). When the declared
 *  conclusion's threshold is met the rider fires FREE and the tally resets;
 *  reaching `concedeAt` first wins the argument outright (CONDEMN). */
function gainPremises(
    state: CombatEncounterState,
    amount: number,
    events: CombatEvent[],
    rng: () => number,
): { state: CombatEncounterState; concede: boolean } {
    if (amount <= 0) return { state, concede: false };
    const milestoneBefore = state.premiseMilestoneTotal ?? 0;
    const milestoneAfter = milestoneBefore + amount;
    let next: CombatEncounterState = {
        ...state,
        premises: (state.premises ?? 0) + amount,
        premiseMilestoneTotal: milestoneAfter,
    };
    events.push({ kind: 'premise-gained', amount, total: next.premises ?? 0 });
    // Phase 32 part 4b (Oratory — milestone drip): the lifetime counter never
    // resets, so a milestone already paid stays paid even after a Peroration
    // zeroes the spendable `premises` tally below.
    const milestoneTiersCrossed = premiseMilestonesCrossed(milestoneBefore, milestoneAfter);
    if (milestoneTiersCrossed > 0) {
        const milestoneRungs = milestoneTiersCrossed * PREMISE_MILESTONE_RUNGS;
        next = { ...next, staggerRungs: (next.staggerRungs ?? 0) + milestoneRungs };
        events.push({
            kind: 'premise-milestone',
            tiersCrossed: milestoneTiersCrossed,
            rungs: milestoneRungs,
            total: milestoneAfter,
        });
    }
    const decl = next.peroration;
    if (!decl) return { state: next, concede: false };
    const total = next.premises ?? 0;
    // Win-path scaling (plan/tuning/2026-07-08-win-path-scaling.md item 1a):
    // the-closing-word's flat concedeAt (8) let Oratory land CONDEMN
    // identically against a 100 HP early wolf and a 1,500+ HP late boss —
    // Battle Lab round 2 clocked it at 100% win rate on EVERY stage. The
    // required Premise count now floors at the enemy's own `difficulty`
    // classification (a real bestiary field, not stage-id string-matching):
    // simple/normal enemies keep the card-authored concedeAt; elite/boss/
    // unique enemies raise the bar to CONCEDE_PREMISES_ELITE/_BOSS. Replaces
    // the narrower per-level bump that only ever fired against the
    // Impossible-tier ceiling probe.
    const concedeTierFloor = concedeFloorFor(next.enemy.difficulty);
    const effectiveConcedeAt = decl.concedeAt !== undefined ? Math.max(decl.concedeAt, concedeTierFloor) : undefined;
    if (effectiveConcedeAt !== undefined && total >= effectiveConcedeAt) {
        events.push({ kind: 'peroration-fired', cardId: decl.cardId, premisesSpent: total });
        return { state: { ...next, premises: 0, peroration: null }, concede: true };
    }
    if (total >= decl.at) {
        const declCard = lookupCard(decl.cardId);
        const mech = (declCard?.specialMechanics ?? []).find(m => m.kind === 'peroration') as
            Extract<CardSpecialMechanic, { kind: 'peroration' }> | undefined;
        events.push({ kind: 'peroration-fired', cardId: decl.cardId, premisesSpent: total });
        next = { ...next, premises: 0 };
        if (mech) next = applyRiderToState(next, decl.cardId, mech.rider, events, rng);
    }
    return { state: next, concede: false };
}

/** FORETELL (spec 32 v3 T6): glimpse the enemy's next telegraph + reorder the
 *  top N of the deck — the engine deterministically floats the highest-rank
 *  card to the top (the "you chose the best future" read, no picker needed). */
function applyForetell(
    state: CombatEncounterState,
    count: number,
    events: CombatEvent[],
): CombatEncounterState {
    let revealedStances = state.revealedStances;
    const nIdx = Math.min(state.currentPhaseIndex + 1, state.threatPhases.length - 1);
    if (!revealedStances.includes(nIdx)) {
        revealedStances = [...revealedStances, nIdx];
        events.push({ kind: 'stance-revealed', phaseIndex: nIdx, stance: state.threatPhases[nIdx].enemyStance });
    }
    let drawPile = state.drawPile;
    if (drawPile.length > 1 && count > 1) {
        const top = drawPile.slice(0, count);
        const rest = drawPile.slice(count);
        const rankOf = (id: string): number => lookupCard(id)?.rank ?? 0;
        const bestIdx = top.reduce((best, id, i) => (rankOf(id) > rankOf(top[best]) ? i : best), 0);
        const reordered = [top[bestIdx], ...top.filter((_, i) => i !== bestIdx)];
        drawPile = [...reordered, ...rest];
    }
    events.push({ kind: 'foretold', count, topCardId: drawPile[0] ?? null });
    return { ...state, revealedStances, drawPile };
}

/**
 * Applies a `CardRider` against the encounter state — the shared executor for
 * FREE lines, threshold/dieBonus/fate riders, omen payoffs, and Peroration
 * conclusions. Every field is a real engine unit. (Play-scoped fields —
 * bonusIntensity / bonusDuration / refreshDie / intensityPerPip — are handled
 * inside `playBottomAction`, which owns the powering die and the landed-status
 * delta; they no-op here. `pips` — the RIPEN rider — is board-scoped and IS
 * handled here since WS2.2: the Phase 30 forge conversions put it on FREE
 * lines, which resolve through this executor.)
 */
function applyRiderToState(
    state: CombatEncounterState,
    cardId: string,
    r: CardRider,
    events: CombatEvent[],
    rng: () => number,
): CombatEncounterState {
    let next = state;
    let player = next.player;
    let enemy = next.enemy;
    let directDamage = next.directDamageDealt;
    let conviction = next.conviction;
    let guard = next.guard ?? 0;
    let souls = next.souls ?? 0;
    // Phase 32 part 3 (Akrasia — DEBT ledger): per-combat running total; see
    // the `r.recoil` block below for the accrual + tiered payoff.
    let akrasiaDebt = next.akrasiaDebt ?? 0;
    // Manual-tick washouts (decaysPerTick instances spent by tickOne /
    // tickAllDots) — soul-worthy ones yield their expiry Soul below.
    const washedOutHere: ActiveEffect[] = [];

    if (r.guard) guard += r.guard;
    let barrier = next.barrier ?? 0;
    if (r.barrier) barrier += r.barrier;
    // ── THE BIG NUMBERS REWRITE — the damage family on a rider ───────────────
    // A rider fires on the FREE line and from condition payoffs, both OUTSIDE
    // the PAID line's read/colour-match scaling, so a rider hit takes WRATH,
    // CHAIN, FLAY, HIDE and PIERCE but no read multiplier: `readMult: 1`,
    // `colorMatch: false`. The printed number is the number, plus the scalers
    // the player has visibly banked.
    let wrath = next.wrath ?? 0;
    let chain = next.chain ?? 0;
    let chainFedThisTurn = next.chainFedThisTurn ?? false;
    let flayStacks = next.flay ?? 0;
    // Attribution ledger (playtest fix 2026-09-04): the FREE line never
    // recorded provenance, so every free-line DoT tick and free-line hit fell
    // into the "Lingering afflictions" bucket and the defeat screen named the
    // bucket as the best card. Same `recordAttribution` calls as the PAID path.
    let attribution = next.attribution;
    const cardName = lookupCard(cardId)?.name ?? cardId;
    if (r.damage) {
        const hideBefore = effectiveHide(enemy, (next.staggerRungs ?? 0) > 0);
        const hit0 = scalePlayerHitDetailed({
            base: r.damage,
            readMult: 1,
            colorMatch: false,
            wrath,
            chain,
            flay: flayStacks > 0,
            execute: false,
            hide: hideBefore,
            pierce: r.pierce === true,
        });
        const dmg = hit0.dmg;
        if (hit0.hideSoaked > 0) {
            events.push({ kind: 'enemy-keyword-fired', enemyId: enemy.id, keyword: 'HIDE', amount: hit0.hideSoaked });
        }
        if (chain > 0) chain = 0;
        if (flayStacks > 0) flayStacks -= 1;
        if (dmg > 0) {
            const hpBefore = enemy.health;
            const hit = applyEnemyDamage(enemy, dmg, next.round, events);
            enemy = hit.enemy;
            directDamage += dmg + hit.clockDamage;
            washedOutHere.push(...hit.washedOut);
            attribution = recordAttribution(attribution, cardId, cardName, null, dmg, hpBefore);
            events.push({ kind: 'damage-dealt', cardId, target: 'enemy', amount: dmg });
        }
    }
    if (r.wrath) {
        wrath += r.wrath;
        events.push({ kind: 'wrath-gained', cardId, amount: r.wrath, total: wrath });
    }
    if (r.chain) {
        chain += r.chain;
        chainFedThisTurn = true;
        events.push({ kind: 'chain-gained', cardId, amount: r.chain, total: chain });
    }
    if (r.flay) {
        flayStacks += r.flay;
        events.push({ kind: 'flay-applied', cardId, amount: r.flay, total: flayStacks });
    }
    if (r.conviction) conviction = Math.min(CONVICTION_CAP, conviction + r.conviction);
    if (r.healHp) {
        const healAmt = Math.round(r.healHp * getHealingReceivedMult(player));
        if (healAmt > 0) {
            player = heal(player, healAmt);
            events.push({ kind: 'damage-dealt', cardId, target: 'self', amount: -healAmt });
        }
    }
    if (r.recoil) {
        // AKRASIA — the printed blood price (unpreventable, mirrors the PAID 'recoil' mechanic).
        player = applyDamage(player, r.recoil);
        events.push({ kind: 'recoil-paid', cardId, amount: r.recoil });
        // Phase 32 part 3 — this blood price posts to the per-combat DEBT
        // ledger (covers the FREE-line recoil, e.g. `pact-of-akrasia`, and any
        // fired rider carrying `recoil`). Tiers pay GUARD only while FALLEN —
        // gated on the player's debuffs BEFORE this rider's own effects (none
        // of `r`'s other fields land a debuff), matching the FALLEN check
        // `playBottomAction` already uses for `sourceCard.fallen`.
        const debtBefore = akrasiaDebt;
        akrasiaDebt += r.recoil;
        events.push({ kind: 'debt-paid', amount: r.recoil, total: akrasiaDebt });
        const tiersCrossed = akrasiaDebtTiersCrossed(debtBefore, akrasiaDebt);
        if (tiersCrossed > 0 && getDistinctDebuffCount(player) >= 2) {
            const tierGuard = tiersCrossed * AKRASIA_DEBT_TIER_GUARD;
            guard += tierGuard;
            events.push({ kind: 'debt-tier-payoff', tiersCrossed, guard: tierGuard, total: akrasiaDebt });
        }
        // `the-red-ledger` (E) — the debt-payoff pair fires on FREE-line
        // recoil too (the ledger forwards every drop, whoever signed it).
        // Card face, THE BIG NUMBERS REWRITE 2026-09-02: "Whenever you pay
        // RECOIL, gain WRATH 1 and deal 6 to the foe" — this hook predates
        // the rewrite's text (which replaced a BLEED-billing effect with a
        // WRATH+damage payoff) and was left applying the old BLEED; fixed to
        // match the printed effect, card-face-honesty.
        if (zoneHas(next, 'the-red-ledger') && !isDefeated(enemy)) {
            wrath += 1;
            events.push({ kind: 'wrath-gained', cardId: 'the-red-ledger', amount: 1, total: wrath });
            const hit = applyEnemyDamage(enemy, 6, next.round, events);
            enemy = hit.enemy;
            directDamage += 6 + hit.clockDamage;
            washedOutHere.push(...hit.washedOut);
            events.push({ kind: 'damage-dealt', cardId: 'the-red-ledger', target: 'enemy', amount: 6 });
        }
        // `joint-and-several` (D): liability is shared — the foe loses TWICE
        // the RECOIL paid. Card face, THE BIG NUMBERS REWRITE 2026-09-02:
        // "the foe loses twice that much VITAE" — this hook predates the
        // rewrite's text and was left at a flat 1x; fixed to match the
        // printed multiplier, card-face-honesty.
        if (zoneHas(next, 'joint-and-several') && !isDefeated(enemy)) {
            const liable = Math.min(r.recoil * 2, enemy.health);
            enemy = applyDamage(enemy, liable);
            directDamage += liable;
            events.push({ kind: 'damage-dealt', cardId: 'joint-and-several', target: 'enemy', amount: liable });
        }
    }
    if (r.cleanse) {
        let remaining = r.cleanse;
        player = {
            ...player,
            effects: player.effects.filter(ae => {
                if (remaining > 0 && lookupEffectDef(ae.effectId)?.type === 'debuff') {
                    remaining -= 1;
                    return false;
                }
                return true;
            }),
        };
    }
    if (r.tickOne) {
        // TICK — the strongest enemy DoT deals its per-turn damage now.
        const ticks = getActiveDotTotal(enemy.effects, next.round).perEffect;
        const strongest = ticks.reduce<typeof ticks[number] | null>(
            (best, t) => (best === null || t.amount > best.amount ? t : best), null);
        if (strongest) {
            enemy = applyDamage(enemy, strongest.amount);
            directDamage += strongest.amount;
            events.push({ kind: 'dot-tick', effectId: strongest.effectId, label: strongest.label, amount: strongest.amount, target: 'enemy' });
            const decayed = decayManuallyTickedDots(enemy, [strongest.effectId]);
            enemy = decayed.bearer;
            washedOutHere.push(...decayed.washedOut);
        }
    }
    if (r.tickAllDots) {
        const ticks = getActiveDotTotal(enemy.effects, next.round);
        if (ticks.total > 0) {
            enemy = applyDamage(enemy, ticks.total);
            directDamage += ticks.total;
            for (const t of ticks.perEffect) {
                events.push({ kind: 'dot-tick', effectId: t.effectId, label: t.label, amount: t.amount, target: 'enemy' });
            }
            const decayed = decayManuallyTickedDots(enemy, ticks.perEffect.map(t => t.effectId));
            enemy = decayed.bearer;
            washedOutHere.push(...decayed.washedOut);
        }
    }
    if (r.ruptureMarks) {
        // The conclusion lands: consume all marks, burst per stack (payoff class).
        const consumed = consumeMarks(enemy);
        if (consumed.stacks > 0) {
            enemy = consumed.combatant;
            const burst = Math.min(ruptureBurstCap(enemy.maxHealth), r.ruptureMarks * consumed.stacks);
            const hpBefore = enemy.health;
            const hit = applyEnemyDamage(enemy, burst, next.round, events);
            enemy = hit.enemy;
            directDamage += burst + hit.clockDamage;
            attribution = recordAttribution(attribution, cardId, cardName, null, burst, hpBefore);
            events.push({ kind: 'damage-dealt', cardId, target: 'enemy', amount: burst });
        }
    }
    if (r.applyEffect) {
        const def = lookupEffectDef(r.applyEffect.effectId);
        if (def) {
            const toSelf = r.applyEffect.to === 'self';
            const bearer = toSelf ? player : enemy;
            const applied = applyEffect(bearer.effects, def, next.round, {
                intensityDelta: r.applyEffect.intensity ?? 1,
                ...(r.applyEffect.duration !== undefined
                    ? { durationMode: 'additive' as const, durationDelta: r.applyEffect.duration }
                    : {}),
                sourceId: cardId,
            });
            if (toSelf) player = { ...player, effects: applied.activeEffects };
            else enemy = { ...enemy, effects: applied.activeEffects };
            const active = applied.result.activeEffect;
            if (active) {
                events.push({
                    kind: 'effect-landed', cardId, effectId: def.id, target: toSelf ? 'self' : 'enemy',
                    effectKind: def.payload.damageOverTime ? 'dot' : 'control',
                    intensity: active.intensity, effect: def,
                });
                if (!toSelf) {
                    const landed: LandedEffect = { effectId: def.id, effect: def, active, target: 'enemy' };
                    attribution = recordAttribution(attribution, cardId, cardName, landed, 0, enemy.health);
                }
            }
        }
    }
    if (r.revealStance) {
        const nIdx = Math.min(next.currentPhaseIndex + 1, next.threatPhases.length - 1);
        if (!next.revealedStances.includes(nIdx)) {
            next = { ...next, revealedStances: [...next.revealedStances, nIdx] };
            events.push({ kind: 'stance-revealed', phaseIndex: nIdx, stance: next.threatPhases[nIdx].enemyStance });
        }
    }

    const washSouls = soulWorthyWashouts(washedOutHere);
    if (washSouls > 0) {
        souls += washSouls;
        events.push({ kind: 'soul-gained', amount: washSouls, total: souls, reason: 'expiry' });
    }
    next = {
        ...next, player, enemy, directDamageDealt: directDamage, conviction, guard, barrier, souls, akrasiaDebt, attribution,
        // THE BIG NUMBERS REWRITE — the damage-scaler ledgers this rider fed
        // or spent (a FREE line can both land a hit and bank WRATH).
        wrath, chain, chainFedThisTurn, flay: flayStacks,
    };

    if (r.foretell) next = applyForetell(next, r.foretell, events);
    if (r.drawCards) {
        const room = Math.max(0, COMBAT_HAND_SIZE - next.hand.length);
        const n = Math.min(r.drawCards, room);
        if (n > 0) {
            const draw = drawCombatCards(next.drawPile, next.discard, next.deck, n, rng);
            next = {
                ...next,
                drawPile: draw.drawPile,
                discard: draw.discard,
                hand: [...next.hand, ...draw.drawn.map((cid, i) => ({ uid: `cr${next.log.length + i}-${cardId}`, cardId: cid }))],
            };
            events.push({ kind: 'hand-drawn', cards: draw.drawn });
        }
    }
    if (r.millCards) {
        // ECHO — advance the loop: cards go straight to discard, never to hand.
        const mill = drawCombatCards(next.drawPile, next.discard, next.deck, r.millCards, rng);
        next = { ...next, drawPile: mill.drawPile, discard: [...mill.discard, ...mill.drawn] };
        events.push({ kind: 'cards-milled', cards: mill.drawn });
    }
    if (r.souls) next = gainSouls(next, r.souls, 'granted', events);
    if (r.sway) next = gainSway(next, r.sway, events);
    if (r.premises) {
        const res = gainPremises(next, r.premises, events, rng);
        next = res.state;
        if (res.concede) next = { ...next, phase: 'complete', finalOutcome: 'concede' };
    }
    if (r.stagger) {
        const total = (next.staggerRungs ?? 0) + r.stagger;
        next = { ...next, staggerRungs: total };
        events.push({ kind: 'staggered', rungs: r.stagger, total });
    }
    if (r.pips) {
        // RIPEN — +1 pip per point to every Reserve die (WS2.2: the forge
        // FREE-line currency; same walk as the PAID-path rider at
        // `playBottomAction` §4).
        let reserve = next.reserve ?? [];
        if (reserve.length > 0) {
            for (let i = 0; i < r.pips; i++) {
                const rp = ripenReserve(reserve);
                reserve = rp.reserve;
                for (const id of rp.ripenedIds) {
                    events.push({ kind: 'die-ripened', dieId: id, pips: reserve.find(d => d.id === id)?.pips ?? 0 });
                }
            }
            next = { ...next, reserve };
        }
    }
    if (r.glyphCharge) {
        // GLYPH CHARGE (Phase 33d pilot) — an inscriber card (carries its own
        // `card.glyph`) charges only its own payload kind; a pump card (no
        // `card.glyph` of its own) charges ANY glyph the player controls.
        // First match in array order (deterministic — mirrors glyphShatter's
        // own tie-break). No matching glyph → the printed fallback deposit,
        // never a silent no-op (the FREE-currency lint law).
        const sourceCard = lookupCard(cardId);
        const matchKind = sourceCard?.glyph?.payload.kind;
        const candidates = matchKind ? glyphsOfKind(next, matchKind) : (next.glyphs ?? []);
        const target = candidates[0];
        if (target) {
            const charges = Math.min(target.cap, target.charges + r.glyphCharge);
            next = {
                ...next,
                glyphs: (next.glyphs ?? []).map(g => (g.id === target.id ? { ...g, charges } : g)),
            };
            events.push({ kind: 'glyph-charged', glyphId: target.id, charges, cap: target.cap });
        } else if (r.glyphChargeFallback) {
            next = applyRiderToState(next, cardId, r.glyphChargeFallback, events, rng);
        } else {
            events.push({ kind: 'effect-fizzled', cardId, effectId: '', message: 'no glyph to charge' });
        }
    }
    return next;
}

/**
 * Spec 32 v4 §2.1 — the FREE (dieless) enchant/disenchant line. Drops a TIMED
 * instance of the card's passive into its temp zone: `tempZone` for an enchantment
 * (player-side), `enemyTempAttachments` for a disenchant (enemy-side). The hook
 * fires identically to the permanent version for {@link FREE_ENCHANT_ROUNDS} rounds,
 * then ticks out in `processBetweenPhases`. The card is discarded (it recycles into
 * the deck), so the FREE line is replayable and a later PAID play promotes it to
 * permanent. Fizzles only when the PERMANENT version is already standing.
 */
function playFreeEnchant(
    state: CombatEncounterState,
    uid: string,
    card: CombatCard,
    sourceCard: Card,
): CombatTransition {
    const isEnchant = sourceCard.cardType === 'oath';
    const permanentZone = isEnchant ? state.persistentZone : (state.enemyAttachments ?? []);
    if (permanentZone.includes(sourceCard.id)) {
        const fizzle: CombatEvent[] = [{
            kind: 'effect-fizzled', cardId: card.id, effectId: '',
            message: `${card.name} is already in play (permanent)`,
        }];
        return { state: withLog(state, fizzle), events: fizzle };
    }

    const events: CombatEvent[] = [
        { kind: 'card-played', cardId: card.id, useBottom: false, dieId: null, advantage: 'neutral' },
    ];
    // Refresh-or-add the timed entry (a re-cast resets the countdown to full).
    const bumpTimed = (zone: { cardId: string; roundsLeft: number }[]) =>
        [...zone.filter(t => t.cardId !== sourceCard.id), { cardId: sourceCard.id, roundsLeft: FREE_ENCHANT_ROUNDS }];
    let next: CombatEncounterState = isEnchant
        ? { ...state, tempZone: bumpTimed(state.tempZone ?? []) }
        : { ...state, enemyTempAttachments: bumpTimed(state.enemyTempAttachments ?? []) };
    next = discardEntry(next, uid);
    events.push(isEnchant
        ? { kind: 'enchant-played', cardId: card.id, name: card.name, temporary: true, roundsLeft: FREE_ENCHANT_ROUNDS }
        : { kind: 'disenchant-attached', cardId: card.id, name: card.name, temporary: true, roundsLeft: FREE_ENCHANT_ROUNDS });
    next = withLog(next, events);
    return checkImmediateOutcome(next, events);
}

/**
 * WS3.2 'card-played' clock on the FREE line (playtest fix 2026-09-04).
 *
 * The clock is "once per PLAYER-side spell play", but only `playBottomAction`
 * ever fired it — a deck that leaned on FREE lines (the doctrine's own
 * "every card has a FREE line") watched POISON sit at 3 stacks for a whole
 * fight while the projection billed `EXPECTED_TRIGGERS_PER_ROUND` ticks for
 * it. Same rules as the PAID site: the pre-play intensity map caps
 * eligibility (fresh stacks never self-tick), enemy-borne washouts earn
 * expiry Souls, player-borne ones do not. Enchant/disenchant plays (either
 * face) stay off the clock, matching their PAID route.
 */
function fireFreePlayClock(
    state: CombatEncounterState,
    enemyPrePlay: Record<string, number>,
    playerPrePlay: Record<string, number>,
    events: CombatEvent[],
): CombatEncounterState {
    let next = state;
    const clock = fireDotTrigger(next.enemy, 'card-played', next.round,
        ae => Math.min(ae.intensity ?? 1, enemyPrePlay[ae.effectId] ?? 0));
    if (clock.damage > 0) {
        for (const t of clock.perEffect) {
            events.push({ kind: 'dot-tick', effectId: t.effectId, label: t.label, amount: t.amount, target: 'enemy' });
        }
        next = { ...next, enemy: clock.target, directDamageDealt: next.directDamageDealt + clock.damage };
    }
    next = gainSouls(next, soulWorthyWashouts(clock.washedOut), 'expiry', events);
    const selfClock = fireDotTrigger(next.player, 'card-played', next.round,
        ae => Math.min(ae.intensity ?? 1, playerPrePlay[ae.effectId] ?? 0));
    if (selfClock.damage > 0) {
        for (const t of selfClock.perEffect) {
            events.push({ kind: 'dot-tick', effectId: t.effectId, label: t.label, amount: t.amount, target: 'self' });
        }
        next = { ...next, player: selfClock.target };
    }
    return next;
}

/**
 * Spec 32 v3 §2.2 — the FREE (top) action executes the card's AUTHORED free
 * rider: dieless, small, always available. There is no chip, no auto-derived
 * weak effect — what is printed is what fires.
 *
 * Spec 32 v4 §2.1 — persistent cards (enchant / disenchant) DO carry a FREE line:
 * it grants a WEAK, TIMED instance of the same passive (the card's hook, active
 * for {@link FREE_ENCHANT_ROUNDS} rounds) then ticks out. The die-costed PAID line
 * is the identical effect made permanent (rest of combat). The card is discarded
 * and recycles, so the FREE line can be replayed — or upgraded by a later PAID play.
 * A FREE play fizzles only when the PERMANENT version is already in play.
 */
function playTopAction(
    state: CombatEncounterState,
    uid: string,
    card: CombatCard,
    rng: () => number,
): CombatTransition {
    const sourceCard = lookupCard(card.id);
    if (sourceCard && sourceCard.cardType !== 'spell') {
        return playFreeEnchant(state, uid, card, sourceCard);
    }
    const events: CombatEvent[] = [
        { kind: 'card-played', cardId: card.id, useBottom: false, dieId: null, advantage: 'neutral' },
    ];
    // Discard the played card BEFORE the free rider fires so a printed
    // "draw N" is never blocked by the card's own hand slot (P0-truth).
    // WS2.1: a conjured Haunt is one-use on EITHER face — a FREE play
    // removes it from the combat instead of feeding the discard cycle.
    let next = removePlayedEntry(state, uid);
    // WS3.3 pre-play stack snapshot: only stacks that existed BEFORE this
    // play are on the 'card-played' clock (a FREE line's own fresh POISON
    // never ticks itself). Taken before the rider so a free-line apply is
    // "fresh" exactly as a PAID apply is.
    const enemyPrePlay = intensityMap(state.enemy.effects);
    const playerPrePlay = intensityMap(state.player.effects);
    if (sourceCard?.free) {
        next = applyRiderToState(next, card.id, sourceCard.free, events, rng);
    }
    next = fireFreePlayClock(next, enemyPrePlay, playerPrePlay, events);
    if (next.finalOutcome === 'concede') {
        return endCombat({ ...withLog(next, events), phase: 'phase-play', finalOutcome: null }, 'concede', events);
    }
    next = withLog(next, events);
    if (swayOffersCapitulation(next)) return offerCapitulation(next, events);
    return checkImmediateOutcome(next, events);
}

/**
 * Powered bottom action (§4.3, §4.7, §4.8): pays dice via RPS scaling, runs the
 * full card through `executeCard`, folds landed effects into the impact
 * tracks + attribution, and refreshes a matching die when a status effect
 * meaningfully lands.
 */
function playBottomAction(
    state: CombatEncounterState,
    uid: string,
    card: CombatCard,
    dieId: string | undefined,
    _rng: () => number,
    chosenX?: number,
    /** REPRISE songbook choice (phase 28) — the FIRST card a `reprise`
     *  mechanic returns, when given and still present in `state.discard`.
     *  Any additional returns (a `count > 1` reprise) still auto-pick by
     *  rank — mobile ships the picker for every `reprise` card (both
     *  `second-thoughts` and `circular-reasoning`), gated on
     *  `needsReprisalChoice`, not hardcoded to one card id. Omitted/invalid
     *  falls back to the pre-existing highest-rank auto-pick, so every
     *  non-mobile caller is unaffected. */
    reprisalCardId?: string,
    /** Phase 32 part 4d (Oracle — OMEN v2) — the player's chosen stance/
     *  window claim for an `omen` mechanic. Absent (or an invalid stance)
     *  falls back to `window: 1` and the pre-v2 die-derived stance — see the
     *  `'omen'` case below. */
    omenClaim?: { stance: Stance; window: number },
): CombatTransition {
    const sourceCard = lookupCard(card.id);
    if (!sourceCard) return { state, events: [] };

    // 1. Resolve the POWERING die — Fate Engine P1 R8: the dieId the player
    //    dragged is HONORED. It may name the drafted die (default when absent),
    //    a banked Reserve die (R2), a GHOST die in the tray (spec 32 v3 §5),
    //    or — for `fate` cards only — a locked X die in the tray (R4). Anything
    //    else is an explicit fizzle.
    const drafted = draftedDie(state);
    const reserveIn = state.reserve ?? [];
    let powering: CombatManaDie | null = null;
    let poweringSource: 'drafted' | 'reserve' | 'floating' | 'fate-x' | 'tray-v2' = 'drafted';
    if (isUpgradeableDiceEnabled()) {
        // Spec 33 §1 — no draft, no single-die law: ANY available die (tray
        // mana/special face, Reserve, or floating) may power a paid line; the
        // color law below still gates it. The dieId is REQUIRED — v2 has no
        // implicit default die.
        if (dieId === undefined) {
            const events: CombatEvent[] = [{ kind: 'effect-fizzled', cardId: card.id, effectId: '', message: 'choose a die to power this card' }];
            return { state: withLog(state, events), events };
        }
        const banked = reserveIn.find(d => d.id === dieId);
        const floating = state.dice.find(d => d.id === dieId && d.floating && d.state === 'available');
        const tray = state.dice.find(d => d.id === dieId && !d.floating);
        if (banked) {
            powering = banked;
            poweringSource = 'reserve';
        } else if (floating) {
            powering = floating;
            poweringSource = 'floating';
        } else if (tray && tray.state === 'available') {
            powering = tray;
            poweringSource = 'tray-v2';
        } else {
            const events: CombatEvent[] = [{
                kind: 'effect-fizzled', cardId: card.id, effectId: '',
                message: tray?.face === 'miss'
                    ? 'a miss face is dead — Press Fate or a card can revive it'
                    : 'that die cannot power this card',
            }];
            return { state: withLog(state, events), events };
        }
    } else if (dieId === undefined || dieId === drafted?.id) {
        if (!drafted) {
            const events: CombatEvent[] = [{ kind: 'effect-fizzled', cardId: card.id, effectId: '', message: 'draft a stance die first' }];
            return { state: withLog(state, events), events };
        }
        if (drafted.state !== 'available' || drafted.color === 'x') {
            const events: CombatEvent[] = [{ kind: 'effect-fizzled', cardId: card.id, effectId: '', message: 'the drafted die is spent or blocked — end the turn' }];
            return { state: withLog(state, events), events };
        }
        powering = drafted;
    } else {
        const banked = reserveIn.find(d => d.id === dieId);
        const floating = state.dice.find(d => d.id === dieId && d.floating && d.state === 'available');
        const trayX = state.dice.find(d => d.id === dieId && d.color === 'x');
        if (banked) {
            powering = banked;
            poweringSource = 'reserve';
        } else if (floating) {
            powering = floating;
            poweringSource = 'floating';
        } else if (trayX && sourceCard.fate && trayX.state !== 'spent') {
            powering = trayX;
            poweringSource = 'fate-x';
        } else {
            const events: CombatEvent[] = [{ kind: 'effect-fizzled', cardId: card.id, effectId: '', message: 'that die cannot power this card' }];
            return { state: withLog(state, events), events };
        }
    }

    // 1b. THE COLOR LAW (dice-law rework 2026-07-09): a die can only power a
    //     card of ITS color. WILD (gold) is the sole exception — it matches
    //     every card. A fate-X play acts wild by definition. Applies to every
    //     power source: drafted, Reserve, and floating alike.
    if (poweringSource !== 'fate-x' && powering.color !== 'wild' && powering.color !== card.stance) {
        const events: CombatEvent[] = [{
            kind: 'effect-fizzled', cardId: card.id, effectId: '',
            message: `a ${powering.color} die cannot power a ${card.stance} card — colors must match`,
        }];
        return { state: withLog(state, events), events };
    }

    // 2. The read + color-match. The read belongs to the TURN's draft contest
    //    (state.lastRead); a WILD powering die re-reads by adopting the card's
    //    stance; a fate-X play has no stance → none.
    const enemyStance = currentPhaseStance(state);
    // Spec 33 §2 — the hidden-stance read is RETIRED under the flag: every
    // play lands printed (mult 1.0); the 1.5/0.5 rails now belong to the open
    // stance checks at phase end (`resolveThreatPhase`).
    const read: CombatReadResult = isUpgradeableDiceEnabled() || poweringSource === 'fate-x'
        ? 'none'
        : powering.color === 'wild'
            ? clampPlayerRead(state.player, resolveRead(card.stance as CombatDieColor, enemyStance), card.stance as CombatDieColor)
            : state.lastRead;
    const mult = READ_DAMAGE_MULT[read];
    const colorMatch = powering.color === 'wild' || powering.color === card.stance;
    const advantage = readToAdvantage(read);
    const poweringPips = powering.pips ?? 0;
    // Tracks blood-price HP taken THIS play (recoil mechanic + fate.recoilHp)
    // for the Akrasia DEBT ledger below (Phase 32 part 3).
    let recoilTaken = 0;

    const events: CombatEvent[] = [{ kind: 'card-played', cardId: card.id, useBottom: true, dieId: powering.id, advantage, colorMatch }];

    // ── Spec 32 v3 §2.1 — ENCHANT / DISENCHANT routing. Persistent cards skip
    //    the spell pipeline entirely: the die is spent, the card leaves the deck
    //    cycle into its zone, and its passive lives at the engine's hook sites.
    if (sourceCard.cardType === 'oath' || sourceCard.cardType === 'hex') {
        const zone = sourceCard.cardType === 'oath' ? state.persistentZone : (state.enemyAttachments ?? []);
        if (zone.includes(sourceCard.id)) {
            const fizzle: CombatEvent[] = [{ kind: 'effect-fizzled', cardId: card.id, effectId: '', message: `${card.name} is already in play (unique)` }];
            return { state: withLog(state, fizzle), events: fizzle };
        }
        let dice = state.dice;
        let reserve = reserveIn;
        let floatingDice = state.floatingDice ?? [];
        if (poweringSource === 'reserve') {
            reserve = reserve.filter(d => d.id !== powering!.id);
        } else if (poweringSource === 'floating') {
            dice = dice.filter(d => d.id !== powering!.id);
            floatingDice = floatingDice.filter(d => d.id !== powering!.id);
            events.push({ kind: 'floating-die-spent', dieId: powering.id, color: powering.color, poolSize: floatingDice.length });
        } else {
            dice = spendDice(dice, [powering.id]);
        }
        events.push({ kind: 'die-spent', dieId: powering.id, color: powering.color });
        events.push(sourceCard.cardType === 'oath'
            ? { kind: 'enchant-played', cardId: card.id, name: card.name }
            : { kind: 'disenchant-attached', cardId: card.id, name: card.name });
        // Spec 32 v4 — a PAID play makes the passive PERMANENT; if a FREE-line timed
        // instance of this card is still ticking, it is promoted (dropped from the
        // temp zone so the same id is not counted twice).
        let next: CombatEncounterState = {
            ...state, dice, reserve, floatingDice,
            persistentZone: sourceCard.cardType === 'oath'
                ? [...state.persistentZone, sourceCard.id] : state.persistentZone,
            enemyAttachments: sourceCard.cardType === 'hex'
                ? [...(state.enemyAttachments ?? []), sourceCard.id] : state.enemyAttachments,
            tempZone: (state.tempZone ?? []).filter(t => t.cardId !== sourceCard.id),
            enemyTempAttachments: (state.enemyTempAttachments ?? []).filter(t => t.cardId !== sourceCard.id),
        };
        // The card leaves the deck cycle: pulled from hand WITHOUT entering the
        // discard (it will not reshuffle back).
        next = { ...next, hand: next.hand.filter(h => h.uid !== uid), deck: next.deck.filter(id => id !== sourceCard.id) };
        next = withLog(next, events);
        return checkImmediateOutcome(next, events);
    }

    // 3. Execute the card (unchanged effect machinery) against a shim.
    //    ECHO (spec 32 v3 T10): the PAID payload fires twice when the card
    //    carries ECHO or an `echo_next_spell` charge is pending.
    const mechsAll = sourceCard.specialMechanics ?? [];
    const echoCharge = state.echoNextSpell === true;
    // THE BIG NUMBERS REWRITE — TWIN is the armed sibling of ECHO: a prior
    // play in this turn armed it, and THIS spell resolves twice. It is consumed
    // here (the local `twinArmed` is reset below), so a twinned spell that
    // itself arms TWIN cannot re-arm from its own second resolution.
    const twinCharge = state.twinArmed === true;
    const echoed = mechsAll.some(m => m.kind === 'echo') || echoCharge || twinCharge;
    if (twinCharge) events.push({ kind: 'twin-fired', cardId: sourceCard.id });

    const before = intensityMap(state.enemy.effects);
    let shimState: CombatState = cardShim(state);
    let res = executeCard(shimState, sourceCard.id, lookupCard, 'player');
    let allCardEvents = [...res.events];
    if (echoed) {
        // Second pass re-applies the card's status payloads (stacking rules
        // apply). Runs against the folded state so intensities accumulate.
        shimState = {
            ...shimState,
            player: res.state.player, enemy: res.state.enemy,
        };
        res = executeCard(shimState, sourceCard.id, lookupCard, 'player');
        allCardEvents = [...allCardEvents, ...res.events];
        events.push({ kind: 'echoed', cardId: card.id });
    }

    let player = res.state.player as Character;
    // VULNERABLE — the foe's incoming-damage multiplier, read from state.enemy
    // BEFORE this card's own debuff lands. Scales payoff bursts (there is no
    // strike any more). Composed with the STANCE-KEYED vulnerability (P1 #17).
    const vulnMult = getDamageTakenMultiplier(state.enemy)
        * getStanceVulnMult(state.enemy, powering.color);
    let enemy = res.state.enemy as Enemy;
    // THE READ BITES STATUS in real units (P0-truth): a won read lands THIS card's
    // statuses at +1 intensity; a lost read shortens them by 1 turn (floor 1).
    // Deterministic — the card face previews the exact triplet; a neutral/none read
    // leaves the printed numbers byte-identical. Only this card's fresh delta is
    // touched, so prior stacks are preserved.
    if (read === 'advantage' || read === 'disadvantage') {
        enemy = {
            ...enemy,
            effects: enemy.effects.map(a => {
                const prior = before[a.effectId] ?? 0;
                if (a.intensity - prior <= 0) return a;
                if (read === 'advantage') {
                    const intensity = Math.min(MAX_EFFECT_INTENSITY, a.intensity + READ_ADVANTAGE_INTENSITY_BONUS);
                    return intensity === a.intensity ? a : { ...a, intensity };
                }
                // disadvantage — permanent (-1) and single-turn effects keep the floor.
                if (a.remainingDuration <= 1) return a;
                return { ...a, remainingDuration: a.remainingDuration - READ_DISADVANTAGE_DURATION_PENALTY };
            }),
        };
    }
    let attribution = state.attribution;
    let directDamage = state.directDamageDealt;
    let landedOnEnemy = false;
    let mercyOpened = res.activateMercyChoice === true;

    // ── Fate Engine P1 — resonance, thresholds, die riders, pips (spec 31 §1) ──
    // Spending the powering die feeds the TOLL tally (R1): its own color,
    // or the card's stance for a Wild; a fate-X feeds nothing.
    let resonance = { heart: 0, body: 0, mind: 0, ...(state.resonance ?? {}) };
    let conviction = state.conviction;
    const resonanceColor: 'heart' | 'body' | 'mind' | null =
        dieHasStance(powering.color) ? (powering.color as 'heart' | 'body' | 'mind')
            : powering.color === 'wild' && dieHasStance(card.stance) ? (card.stance as 'heart' | 'body' | 'mind')
                : null;
    if (resonanceColor) {
        resonance = { ...resonance, [resonanceColor]: resonance[resonanceColor] + 1 };
        events.push({ kind: 'resonance-gained', color: resonanceColor, total: resonance[resonanceColor] });
    }
    // Collect this play's fired riders: THRESHOLD (tally ≥ count — checked with
    // this spend already counted: one spend, two payoffs), DIE BONUS (powering
    // color matches the card's line), and FATE (powered by an X die).
    const firedRiders: CardRider[] = [];
    if (sourceCard.threshold && resonance[sourceCard.threshold.color] >= sourceCard.threshold.count) {
        firedRiders.push(sourceCard.threshold.rider);
        events.push({
            kind: 'threshold-fired', cardId: card.id, color: sourceCard.threshold.color,
            count: sourceCard.threshold.count, riderText: riderText(sourceCard.threshold.rider),
        });
    }
    if (sourceCard.dieBonus) {
        const on = sourceCard.dieBonus.onColor;
        const hit = on === 'match' ? colorMatch
            : on === 'off' ? (dieHasStance(powering.color) && powering.color !== card.stance)
                : powering.color === on;
        if (hit) {
            firedRiders.push(sourceCard.dieBonus.rider);
            events.push({ kind: 'die-bonus-fired', cardId: card.id, riderText: riderText(sourceCard.dieBonus.rider) });
        }
    }
    if (sourceCard.fate && poweringSource === 'fate-x') {
        firedRiders.push(sourceCard.fate.rider);
        const recoil = sourceCard.fate.recoilHp ?? 0;
        if (recoil > 0) { player = applyDamage(player, recoil); recoilTaken += recoil; }
        events.push({ kind: 'fate-powered', cardId: card.id, dieId: powering.id, recoil, riderText: riderText(sourceCard.fate.rider) });
    }
    // FALLEN (spec 32 v3 T4) — the theme-state condition line: fires free while
    // the player carries >= 2 distinct self-debuffs at play time.
    const wasFallen = getDistinctDebuffCount(state.player) >= 2;
    if (sourceCard.fallen && wasFallen) {
        firedRiders.push(sourceCard.fallen.rider);
        events.push({ kind: 'die-bonus-fired', cardId: card.id, riderText: `FALLEN: ${riderText(sourceCard.fallen.rider)}` });
    }
    // WS4.2 (spec 32 §12 item 4) — CardSynergy combat-STATE predicate: reads
    // the ratified encounter ledgers (enemyDamageLastRound et al.) at play
    // time; when it holds, the synergy rider fires FREE — same firedRiders
    // path as threshold/dieBonus/fate/fallen (ONE conditional gate, extended).
    if (sourceCard.synergy?.statePredicate && sourceCard.synergy.rider
        && checkStatePredicate(sourceCard.synergy.statePredicate, state)) {
        firedRiders.push(sourceCard.synergy.rider);
        events.push({
            kind: 'die-bonus-fired', cardId: card.id,
            riderText: `${statePredicateText(sourceCard.synergy.statePredicate)}: ${riderText(sourceCard.synergy.rider)}`,
        });
    }
    // Landed-status adjustments in one pass, all REAL units: rider intensity /
    // duration bonuses, RIPENED pips (+1 intensity per pip on a non-defend play,
    // R2), and the color-match +1 duration on status cards (R7). Spec 32 v3 §7.
    const isDefendPlay = card.verbClass === 'defend';
    const bonusIntensity = firedRiders.reduce((n, r) => n + (r.bonusIntensity ?? 0), 0)
        + (isDefendPlay ? 0 : poweringPips * PIP_INTENSITY_BONUS);
    const bonusDuration = firedRiders.reduce((n, r) => n + (r.bonusDuration ?? 0), 0)
        + (colorMatch && card.effectKind !== 'none' ? COLOR_MATCH_STATUS_DURATION_BONUS : 0);
    if (bonusIntensity > 0 || bonusDuration > 0) {
        let touched = false;
        enemy = {
            ...enemy,
            effects: enemy.effects.map(a => {
                if ((before[a.effectId] ?? 0) >= a.intensity) return a;
                touched = true;
                return {
                    ...a,
                    intensity: Math.min(MAX_EFFECT_INTENSITY, a.intensity + bonusIntensity),
                    remainingDuration: a.remainingDuration === -1 ? -1 : a.remainingDuration + bonusDuration,
                };
            }),
        };
        if (touched && poweringPips > 0 && !isDefendPlay) {
            events.push({ kind: 'pips-cashed', cardId: card.id, pips: poweringPips, bonus: 'intensity', amount: poweringPips * PIP_INTENSITY_BONUS });
        }
    }

    // ── Spec 32 v3 — the themed-deck mechanic chain ───────────────────────────
    // HP behavior owned here (the card engine no-ops every mechanic kind).
    // Payoff verbs read state.enemy (pre-card) so a card's own fresh status
    // never self-counts. Every HP source below is affliction- or engine-gated.
    const mechs = sourceCard.specialMechanics ?? [];
    const echoFactor = echoed ? 2 : 1;
    let mechanicDamage = 0;
    // ── THE BIG NUMBERS REWRITE — the damage-scaler ledgers, read here so this
    //    play both CONSUMES (chain/flay/twin) and FEEDS (wrath/chain) them. ──
    let wrath = state.wrath ?? 0;
    let chain = state.chain ?? 0;
    let chainFedThisTurn = state.chainFedThisTurn ?? false;
    let flayStacks = state.flay ?? 0;
    // A pending TWIN charge is consumed by THIS play (mirrors `echoNextSpell`);
    // a `twin` mechanic below re-arms it for the NEXT one.
    let twinArmed = false;
    /** VITAE this play drove past the foe's last point, for an OVERKILL clause. */
    let overkillExcess = 0;
    /** the-sextons-count's RECALL/REPLAY sites set this so the generic TWIN
     *  toll below never double-tolls a card that is both a reprise/replay
     *  carrier and resolving under an armed TWIN charge (phase 86). */
    let sextonsTolled = false;
    /** EXECUTE is evaluated ONCE, before this card's hits land, so a multi-hit
     *  card cannot flip its own threshold partway through the swing. */
    const executeArmed = (sourceCard.specialMechanics ?? []).some(
        m => m.kind === 'execute' && enemy.maxHealth > 0
            && enemy.health <= m.atPct * enemy.maxHealth,
    );
    /** ELUSIVE lifts once the foe has been staggered this round. */
    const staggeredThisRound = (state.staggerRungs ?? 0) > 0;
    let reserve = reserveIn;
    let floatingDice = (state.floatingDice ?? []).slice();
    let souls = state.souls ?? 0;
    // Phase 32 part 4a (Control — TURNABOUT ledger): read here so a
    // `turnabout` play can CONSUME (zero) it in this same execution — the
    // ledger itself is accrued in `resolveThreatPhase`, not here.
    let rungsDeniedTotal = state.rungsDeniedTotal ?? 0;
    let staggerRungs = state.staggerRungs ?? 0;
    let stanceLockedNext = state.stanceLockedNext ?? false;
    let pendingOmens = (state.pendingOmens ?? []).slice();
    let echoNextSpell = false; // a pending charge is consumed by THIS play
    let premisesGained = 0;
    let swayGained = 0;
    let foretellCount = 0;
    let perorationDecl = state.peroration ?? null;
    let spendPremisesMech: Extract<CardSpecialMechanic, { kind: 'spend_premises' }> | null = null;
    let hand = state.hand;
    let drawPile = state.drawPile;
    let discard = state.discard;
    let conjuredUids = (state.conjuredUids ?? []).slice();
    let pipsSpentThisPlay = 0;
    let pipGuardExtra = 0;
    const reprisedFreeRiders: CardRider[] = [];
    // IMMOLATE (profane-canon rework): card ids burned from hand this play —
    // they leave the combat entirely (hand now, deck cycle at assembly).
    const immolatedIds: string[] = [];
    // PURGE (profane-canon rework): this play exiles ITSELF from the combat
    // (the curse-card self-removal law; honored at the discard-routing site).
    let purgeSelf = false;
    // FORGE (spec 32 v3 §5): a freshly forged floating die joins the TRAY NOW —
    // collected here and merged into `dice` after the powering-die spend.
    const forgedFloating: CombatManaDie[] = [];
    // TRANSMUTE (dice-law 2026-07-09): X dice consumed by `float_x_die` this
    // play — removed from the tray after the powering-die spend.
    const transmutedXIds: string[] = [];

    // Local SOUL gain. `choirbone-reliquary` (E, profane canon): every
    // affliction that expires or is consumed mid-play also yields +1 SOUL and
    // PLEA 1 (gated on reason so its own grants never recurse).
    const gainSoulsLocal = (n: number, reason: 'expiry' | 'consumed' | 'granted'): void => {
        if (n <= 0) return;
        souls += n;
        events.push({ kind: 'soul-gained', amount: n, total: souls, reason });
        if (reason !== 'granted' && zoneHas(state, 'choirbone-reliquary')) {
            souls += n;
            events.push({ kind: 'soul-gained', amount: n, total: souls, reason: 'granted' });
            swayGained += n;
        }
    };

    // WS3.2 event clocks (spec 32 §12 #3): 'card-played' fires once per
    // PLAYER-side card play (ratified — enemy actions never advance it);
    // 'payoff' fires inside the payoff verbs (rupture / consume_affliction /
    // reap_all). The tick is DoT-clock damage — direct-damage tally only,
    // never `mechanicDamage` (SIPHON heals off payoff bursts, not clocks).
    // WS3.3 eligibility: only STACKS that existed BEFORE this play are on
    // the clock — a play's own fresh stacks never tick themselves (doctrine
    // witness: a PAID line must not chip a clean enemy). With 'intensity'
    // merge-stacking a re-application raises the ONE existing instance, so
    // the gate is an intensity CAP (the pre-play stack count), not a boolean;
    // the cap is re-clamped to the LIVE intensity before each clock fire so
    // stacks consumed mid-play (RUPTURE / cleanse / decay) leave the clock
    // and a consumed-then-reapplied instance counts as genuinely fresh.
    const clockCap: Record<string, number> = { ...before };
    const fireClock = (trigger: 'card-played' | 'payoff'): void => {
        for (const id of Object.keys(clockCap)) {
            const live = enemy.effects.find(e => e.effectId === id)?.intensity ?? 0;
            clockCap[id] = Math.min(clockCap[id], live);
        }
        const clock = fireDotTrigger(enemy, trigger, state.round,
            ae => Math.min(ae.intensity ?? 1, clockCap[ae.effectId] ?? 0));
        if (clock.damage <= 0) return;
        enemy = clock.target;
        directDamage += clock.damage;
        for (const t of clock.perEffect) {
            events.push({ kind: 'dot-tick', effectId: t.effectId, label: t.label, amount: t.amount, target: 'enemy' });
        }
        gainSoulsLocal(soulWorthyWashouts(clock.washedOut), 'expiry');
    };

    /**
     * THE BIG NUMBERS REWRITE — land one player hit on the foe, folding every
     * scaler through `scalePlayerHit` and spending the one-shot ledgers (CHAIN
     * on the first hit, one FLAY stack per hit). Returns the excess damage
     * beyond lethal so an OVERKILL clause can convert it.
     */
    const landHit = (base: number, pierce: boolean, label: string): number => {
        const healthBefore = enemy.health;
        const scaled = scalePlayerHitDetailed({
            base,
            readMult: mult,
            colorMatch,
            wrath,
            chain,
            flay: flayStacks > 0,
            execute: executeArmed,
            hide: effectiveHide(enemy, staggeredThisRound),
            pierce,
        });
        const dmg = scaled.dmg;
        if (scaled.hideSoaked > 0) {
            events.push({ kind: 'enemy-keyword-fired', enemyId: enemy.id, keyword: 'HIDE', amount: scaled.hideSoaked });
        }
        if (chain > 0) { chain = 0; }
        if (flayStacks > 0) { flayStacks -= 1; }
        if (dmg <= 0) return 0;
        const hit = applyEnemyDamage(enemy, dmg, state.round, events);
        enemy = hit.enemy;
        mechanicDamage += dmg;
        directDamage += dmg + hit.clockDamage;
        // Credit the CARD. Without this the DEAL verb was invisible to the
        // attribution ledger, so every report — the per-card telemetry, the
        // dominance reading, the deck-tuning tables — credited the damage to
        // whatever last attributed, which was the player's signature skill.
        // Every stage read `dom=100%(signature)` while the library did the work.
        attribution = recordAttribution(attribution, card.id, card.name, null, dmg, healthBefore);
        gainSoulsLocal(soulWorthyWashouts(hit.washedOut), 'expiry');
        events.push({ kind: 'damage-dealt', cardId: label, target: 'enemy', amount: dmg });
        return Math.max(0, dmg - healthBefore);
    };

    for (const mech of mechs) {
        switch (mech.kind) {
            // ── THE BIG NUMBERS REWRITE — direct damage and its family ──────
            case 'deal': {
                // Each hit is its own damage instance: BLEED-class DoTs fire
                // once per hit and HIDE is subtracted from each, which is the
                // whole reason `7 x 4` and `28 x 1` play differently.
                //
                // ECHO/TWIN multiply the HIT COUNT, not the per-hit magnitude:
                // an echoed `7 x 4` is eight instances of 7, so HIDE is paid
                // eight times and a BLEED clock fires eight times. Doubling the
                // amount instead would have made ECHO strictly better against
                // armour than the card says. (The second `executeCard` pass
                // only re-applies `combatEffects`, so without this DEAL was a
                // printed keyword with zero effect — caught 2026-09-02.)
                const hits = Math.max(1, mech.hits ?? 1) * echoFactor;
                for (let i = 0; i < hits; i++) {
                    if (isDefeated(enemy)) break;
                    overkillExcess += landHit(mech.amount, mech.pierce === true, card.id);
                }
                break;
            }
            case 'wrath': {
                wrath += mech.amount * echoFactor;
                events.push({ kind: 'wrath-gained', cardId: card.id, amount: mech.amount, total: wrath });
                break;
            }
            case 'flay': {
                flayStacks += mech.stacks * echoFactor;
                events.push({ kind: 'flay-applied', cardId: card.id, amount: mech.stacks, total: flayStacks });
                break;
            }
            case 'chain': {
                chain += mech.amount * echoFactor;
                chainFedThisTurn = true;
                events.push({ kind: 'chain-gained', cardId: card.id, amount: mech.amount, total: chain });
                break;
            }
            case 'twin': {
                twinArmed = true;
                events.push({ kind: 'twin-armed', cardId: card.id });
                break;
            }

            case 'execute':
                // Read at the top of this play into `executeArmed`; the clause
                // itself lands no effect of its own.
                break;
            case 'overkill': {
                // Conversion of damage that was going to be wasted anyway. The
                // excess is whatever THIS card's hits drove past 0 VITAE.
                if (overkillExcess > 0 && mech.per > 0) {
                    const units = Math.floor(overkillExcess / mech.per);
                    if (mech.conviction && units > 0) {
                        conviction = Math.min(CONVICTION_CAP, conviction + units * mech.conviction);
                    }
                    if (mech.souls && units > 0) gainSoulsLocal(units * mech.souls, 'granted');
                    if (mech.healPct) {
                        const healed = Math.round(overkillExcess * mech.healPct);
                        if (healed > 0) player = heal(player, healed);
                    }
                    events.push({ kind: 'overkill-cashed', cardId: card.id, excess: overkillExcess });
                }
                break;
            }
            case 'rider': {
                // The generic unconditional PAID verb carrier (draw/heal/…).
                firedRiders.push(mech.rider);
                break;
            }
            case 'immolate': {
                // IMMOLATE (profane-canon rework) — burn the `count` lowest-
                // rank OTHER cards in hand as a printed cost; each burned card
                // leaves the combat entirely (never reshuffles back). The
                // rider fires only if at least one card burned — the pyre must
                // be fed. CONJURED tokens burn like anything else (they were
                // leaving anyway); a curse is usually the cheapest fuel.
                const rankOf = (id: string): number => lookupCard(id)?.rank ?? 0;
                const burned: string[] = [];
                for (let i = 0; i < mech.count; i++) {
                    const candidates = hand.filter(h => h.uid !== uid);
                    if (candidates.length === 0) break;
                    const lowest = candidates.reduce((best, h) =>
                        (rankOf(h.cardId) < rankOf(best.cardId) ? h : best), candidates[0]);
                    hand = hand.filter(h => h.uid !== lowest.uid);
                    conjuredUids = conjuredUids.filter(u => u !== lowest.uid);
                    immolatedIds.push(lowest.cardId);
                    burned.push(lowest.cardId);
                }
                if (burned.length > 0) {
                    events.push({ kind: 'immolated', cardId: card.id, burned });
                    firedRiders.push(mech.rider);
                } else {
                    events.push({ kind: 'effect-fizzled', cardId: card.id, effectId: '', message: 'nothing in hand to burn' });
                }
                break;
            }
            case 'purge_self': {
                // PURGE (profane-canon rework) — the played card exiles itself
                // from the combat (curse self-removal). Routed at the discard
                // site below, mirroring the CONJURE one-use law.
                purgeSelf = true;
                events.push({ kind: 'purged', cardId: card.id });
                break;
            }
            case 'recoil': {
                // AKRASIA — the printed blood price (unpreventable).
                player = applyDamage(player, mech.hp);
                recoilTaken += mech.hp;
                events.push({ kind: 'recoil-paid', cardId: card.id, amount: mech.hp });
                break;
            }
            case 'recoil_x': {
                // RECOIL X (WS7.2, spec 32 §12 item 5 — the first chosen
                // X-cost): pay X VITAE of the player's choosing, clamped to
                // [min, affordable] (affordable = live HP − 1: the printed
                // minimum is the floor even at death's door, matching plain
                // RECOIL's unpreventable printed price), then land POISON at
                // ceil(X × poisonPerX) intensity — the same blood-price +
                // affliction pattern as `recoil` + a landed DoT application.
                const affordable = Math.max(mech.min, player.health - 1);
                const x = Math.min(Math.max(chosenX ?? mech.min, mech.min), affordable);
                player = applyDamage(player, x);
                recoilTaken += x;
                events.push({ kind: 'recoil-paid', cardId: card.id, amount: x });
                const stacks = Math.ceil(x * mech.poisonPerX);
                const def = lookupEffectDef('debuff_poison');
                if (def && stacks > 0) {
                    const applied = applyEffect(enemy.effects, def, state.round, { intensityDelta: stacks, sourceId: card.id });
                    enemy = { ...enemy, effects: applied.activeEffects };
                    events.push({
                        kind: 'effect-landed', cardId: card.id, effectId: def.id, target: 'enemy',
                        effectKind: 'dot',
                        intensity: applied.result.activeEffect?.intensity ?? stacks, effect: def,
                    });
                }
                break;
            }
            case 'stagger': {
                staggerRungs += mech.rungs;
                events.push({ kind: 'staggered', rungs: mech.rungs, total: staggerRungs });
                break;
            }
            case 'lock_stance': {
                stanceLockedNext = true;
                const nIdx = Math.min(state.currentPhaseIndex + 1, state.threatPhases.length - 1);
                events.push({ kind: 'stance-locked', phaseIndex: nIdx, stance: currentPhaseStance(state) });
                break;
            }
            case 'foretell': foretellCount += mech.count; break;
            case 'omen': {
                // Phase 32 part 4d — OMEN v2: the player STAKES a claim
                // instead of the engine silently deriving one. `omenClaim`
                // absent (no mobile picker yet, or a caller that hasn't
                // opted in) falls back to the pre-v2 die-derived stance at
                // `window: 1` — byte-compatible with every pre-existing
                // caller/test that never supplies the new option.
                const maxWindow = Math.max(1, mech.maxWindow);
                const legacyStance: Stance = dieHasStance(powering.color)
                    ? (powering.color as Stance)
                    : dieHasStance(card.stance) ? (card.stance as Stance) : 'heart';
                const stance: Stance = omenClaim && dieHasStance(omenClaim.stance)
                    ? omenClaim.stance
                    : legacyStance;
                const window = Math.min(Math.max(1, Math.round(omenClaim?.window ?? 1)), maxWindow);
                // Bigger (bolder) claims narrow the window and pay MORE: the
                // claimScale is 1/window — window 1 (the boldest, single-
                // boundary bet) pays the full printed rider; a wider hedge
                // pays (and costs) a fraction of it, in exchange for more
                // tries at the phase boundary. `Math.ceil` on the ante keeps
                // even a maximally-hedged claim a real (nonzero) wager.
                const claimScale = 1 / window;
                const rawAnte = mech.anteConviction * claimScale;
                const ante = Math.max(0, Math.min(Math.ceil(rawAnte), conviction));
                conviction -= ante;
                const nIdx = Math.min(state.currentPhaseIndex + 1, state.threatPhases.length - 1);
                pendingOmens.push({ cardId: card.id, stance, windowRemaining: window, claimScale });
                events.push({ kind: 'omen-declared', cardId: card.id, stance, phaseIndex: nIdx, window, ante });
                break;
            }
            case 'premise': premisesGained += mech.count * echoFactor; break;
            case 'peroration': {
                perorationDecl = { cardId: card.id, at: mech.at, concedeAt: mech.concedeAt };
                events.push({ kind: 'peroration-declared', cardId: card.id, at: mech.at });
                break;
            }
            case 'spend_premises': spendPremisesMech = mech; break;
            case 'spend_all_pips': {
                // Zero every pip (powering die + Reserve + floating bank); each
                // grants Guard and feeds a paired RUPTURE via `fuelPerPip`.
                let pips = poweringPips;
                reserve = reserve.map(d => {
                    pips += d.pips ?? 0;
                    return (d.pips ?? 0) > 0 ? { ...d, pips: 0 } : d;
                });
                // Foundry engagement fix (2026-07-08): a persistent GHOST die
                // (forged by Ex Nihilo) sitting in the tray previously never
                // counted toward this spend — only Reserve pips did, decoupling
                // the deck's two signature mechanics from each other. Floating
                // dice that are NOT this cast's own powering die (already
                // folded into poweringPips above) now also contribute their
                // pips, zeroed the same way Reserve pips are.
                floatingDice = floatingDice.map(d => {
                    if (d.id === powering.id) return d;
                    pips += d.pips ?? 0;
                    return (d.pips ?? 0) > 0 ? { ...d, pips: 0 } : d;
                });
                if (pips > 0 && mech.guardPerPip) {
                    pipGuardExtra += pips * mech.guardPerPip;
                    events.push({ kind: 'pips-cashed', cardId: card.id, pips, bonus: 'guard', amount: pips * mech.guardPerPip });
                }
                // WS4.1 (Ingot of Ruin class) — +1 MARK stack per `markPer`
                // pips spent, UNCAPPED (spec 32 §12 item 5: the ALL-spender's
                // price is emptying the bank, not a ceiling).
                if (pips > 0 && mech.markPer) {
                    const markStacks = Math.floor(pips / mech.markPer);
                    const markDef = markStacks > 0 ? lookupEffectDef('debuff_mark') : undefined;
                    if (markDef) {
                        const applied = applyEffect(enemy.effects, markDef, state.round, { intensityDelta: markStacks, sourceId: card.id });
                        enemy = { ...enemy, effects: applied.activeEffects };
                        events.push({ kind: 'pips-cashed', cardId: card.id, pips, bonus: 'mark', amount: markStacks });
                    }
                }
                pipsSpentThisPlay += pips;
                break;
            }
            case 'rupture': {
                // Overtake 2-pip gate (phase 28, CONFIRMED in
                // plan/tuning/2026-07-10-theme-identity.md — "the Overtake
                // fires for 18 on turn 1 because nothing marks a CHARGED
                // Overtake"). Scoped to fuelPerPip-paired rupture only (only
                // `the-overtake` carries fuelPerPip today) — a plain rupture
                // card (resonance-detonation, peroratio-interrupta,
                // prophecy-fulfilled) is untouched. Below 2 spent pips the
                // whole payoff no-ops (a gate, not a taper) — mirrors the
                // existing effect-fizzled convention used for empty-discard
                // REPRISE / no-Premises spend elsewhere in this switch.
                if (mech.fuelPerPip && pipsSpentThisPlay < 2) {
                    events.push({ kind: 'effect-fizzled', cardId: card.id, effectId: '', message: 'needs 2+ spent pips to detonate' });
                    break;
                }
                // WS3.2 'payoff' clock — payoff-clocked DoTs tick as the verb
                // fires, BEFORE the consume strips them.
                fireClock('payoff');
                // RUPTURE v3 — consume ALL afflictions: 1.5x... no — burst =
                // (pending DoT fuel + flat per non-DoT stack + pip/omen fuel),
                // read + vulnerable scaled, capped. Consumed instances feed SOULS.
                // Fuel is priced off the LIVE enemy (same as WINNOWING's
                // consumeOneAffliction), not the play-start snapshot — fuel
                // that already ticked out or washed out earlier in this play
                // (e.g. the payoff tick above) was paid once and must not be
                // re-paid by the burst.
                const pending = getPendingDotTotal(enemy, state.round).total;
                const consumedRes = consumeAfflictions(enemy);
                enemy = consumedRes.combatant;
                const fuel = pending
                    + RUPTURE_PER_AFFLICTION_STACK * consumedRes.nonDotStacks
                    + (mech.fuelPerPip ?? 0) * pipsSpentThisPlay
                    + (mech.fuelPerOmenHit ?? 0) * (state.omenHits ?? 0);
                const burst = Math.min(
                    ruptureBurstCap(enemy.maxHealth),
                    Math.round(fuel * mult * (1 + (mech.bonusPct ?? 0)) * vulnMult),
                );
                if (burst > 0) {
                    const hpBefore = enemy.health;
                    const hit = applyEnemyDamage(enemy, burst, state.round, events);
                    enemy = hit.enemy;
                    mechanicDamage += burst;
                    directDamage += burst + hit.clockDamage;
                    gainSoulsLocal(soulWorthyWashouts(hit.washedOut), 'expiry');
                    attribution = recordAttribution(attribution, card.id, card.name, null, burst, hpBefore);
                }
                events.push({ kind: 'rupture-detonated', amount: burst, consumed: consumedRes.consumed });
                gainSoulsLocal(consumedRes.consumed.length, 'consumed');
                break;
            }
            case 'consume_affliction': {
                // WS3.2 'payoff' clock — ticks before the scythe consumes.
                fireClock('payoff');
                // WINNOWING — the scythe: one affliction's remaining fuel ticks NOW.
                const res2 = consumeOneAffliction(enemy, state.round);
                if (res2.consumed) {
                    enemy = res2.combatant;
                    if (res2.fuel > 0) {
                        const dmg = Math.round(res2.fuel * vulnMult);
                        const hpBefore = enemy.health;
                        const hit = applyEnemyDamage(enemy, dmg, state.round, events);
                        enemy = hit.enemy;
                        mechanicDamage += dmg;
                        directDamage += dmg + hit.clockDamage;
                        gainSoulsLocal(soulWorthyWashouts(hit.washedOut), 'expiry');
                        attribution = recordAttribution(attribution, card.id, card.name, null, dmg, hpBefore);
                    }
                    events.push({ kind: 'affliction-consumed', effectId: res2.consumed, fuel: res2.fuel });
                    gainSoulsLocal(mech.souls, 'consumed');
                } else {
                    events.push({ kind: 'effect-fizzled', cardId: card.id, effectId: '', message: 'no affliction to consume' });
                }
                break;
            }
            case 'soul_gain': gainSoulsLocal(mech.count * echoFactor, 'granted'); break;
            case 'reap': {
                if (souls < mech.cost) {
                    events.push({ kind: 'effect-fizzled', cardId: card.id, effectId: '', message: `need ${mech.cost} Souls (have ${souls})` });
                    break;
                }
                souls -= mech.cost;
                // Phase 32 part 1 (Harvest — REAP attacks MAXIMUM HP): every
                // REAP that spends Souls also erodes the enemy's ceiling a
                // little, before the existing kindle/rider logic. This card
                // deals no current-HP damage otherwise — the erosion is a
                // NEW effect, not a modification of an existing burst.
                const erosion = Math.round(mech.cost * REAP_EROSION_PER_SOUL);
                if (erosion > 0) {
                    enemy = erodeMaxHealth(enemy, erosion);
                    events.push({ kind: 'max-hp-eroded', cardId: card.id, amount: erosion, newMax: enemy.maxHealth });
                }
                if (mech.rider) firedRiders.push(mech.rider);
                if (mech.kindle) {
                    const forged: CombatManaDie = {
                        id: `forge-${state.turn}-${state.log.length + events.length}`, color: mech.kindle,
                        state: 'available', temporary: true,
                        pips: 0,
                    };
                    if (reserve.length < RESERVE_MAX) {
                        reserve = [...reserve, forged];
                        events.push({ kind: 'die-forged', dieId: forged.id, color: forged.color, destination: 'reserve' });
                    } else {
                        conviction = Math.min(CONVICTION_CAP, conviction + 1);
                        events.push({ kind: 'die-forged', dieId: forged.id, color: forged.color, destination: 'conviction' });
                    }
                }
                events.push({ kind: 'reaped', cardId: card.id, soulsSpent: mech.cost, amount: 0 });
                break;
            }
            case 'reap_all': {
                // WS3.2 'payoff' clock — the capstone is a payoff verb too.
                fireClock('payoff');
                // THE REAPING — spend every Soul: a payoff burst per Soul.
                // UNCAPPED (spec 32 §12 item 5): an ALL-spender's input
                // opportunity cost — emptying the whole bank — IS its price.
                const spent = souls;
                const burst = Math.round(mech.burstPerSoul * spent * mult * vulnMult);
                souls = 0;
                if (burst > 0) {
                    const hpBefore = enemy.health;
                    // Phase 32 part 1: erode == true sources the SAME
                    // current-HP subtraction (unchanged output) through
                    // erodeMaxHealth instead of applyDamage, so `maxHealth`
                    // drops by the identical `burst` amount in this ONE
                    // call — no second damage instance, clock unmoved.
                    const hit = applyEnemyDamage(enemy, burst, state.round, events, true);
                    enemy = hit.enemy;
                    mechanicDamage += burst;
                    directDamage += burst + hit.clockDamage;
                    gainSoulsLocal(soulWorthyWashouts(hit.washedOut), 'expiry');
                    attribution = recordAttribution(attribution, card.id, card.name, null, burst, hpBefore);
                    events.push({ kind: 'max-hp-eroded', cardId: card.id, amount: burst, newMax: enemy.maxHealth });
                }
                events.push({ kind: 'reaped', cardId: card.id, soulsSpent: spent, amount: burst });
                break;
            }
            case 'turnabout': {
                // TURNABOUT (Control capstone) — cash the WHOLE denial ledger:
                // burstPerRung HP per rung STAGGER/BACKFIRE have EVER denied
                // this combat. Mirrors reap_all's shape (compute from the
                // live bank, apply as direct damage, zero the bank) but
                // CONSUMES rather than reads a still-growing counter — the
                // burst is computed BEFORE the ledger resets, in this one
                // call, so there is no double-count / stale-read risk.
                const rungsSpent = rungsDeniedTotal;
                const burst = Math.round(mech.burstPerRung * rungsSpent * mult * vulnMult);
                rungsDeniedTotal = 0;
                if (burst > 0) {
                    const hpBefore = enemy.health;
                    const hit = applyEnemyDamage(enemy, burst, state.round, events);
                    enemy = hit.enemy;
                    mechanicDamage += burst;
                    directDamage += burst + hit.clockDamage;
                    gainSoulsLocal(soulWorthyWashouts(hit.washedOut), 'expiry');
                    attribution = recordAttribution(attribution, card.id, card.name, null, burst, hpBefore);
                }
                // Always fires (mirrors reap_all): a 0-rung bank is a legal,
                // non-fizzling play that simply banks nothing — matches
                // reap_all's "amount: burst" (0 allowed) precedent exactly.
                events.push({ kind: 'turnabout-fired', cardId: card.id, rungsSpent, amount: burst });
                break;
            }
            case 'sway': swayGained += mech.amount * echoFactor; break;
            case 'extend_dots': {
                const affected: string[] = [];
                enemy = {
                    ...enemy,
                    effects: enemy.effects.map(ae => {
                        const def = lookupEffectDef(ae.effectId);
                        if (def?.type === 'debuff' && def.payload.damageOverTime && ae.remainingDuration !== -1) {
                            affected.push(ae.effectId);
                            return { ...ae, remainingDuration: ae.remainingDuration + mech.turns };
                        }
                        return ae;
                    }),
                };
                events.push({ kind: 'dots-extended', turns: mech.turns, affected });
                break;
            }
            case 'convert_dots': {
                // CURRY'S CONVERSION — the wound becomes the argument: every enemy
                // bleed becomes poison and vice versa, +N intensity each.
                let converted = false;
                enemy = {
                    ...enemy,
                    effects: enemy.effects.map(ae => {
                        const to = ae.effectId === 'debuff_bleed' ? 'debuff_poison'
                            : ae.effectId === 'debuff_poison' ? 'debuff_bleed' : null;
                        if (!to) return ae;
                        converted = true;
                        events.push({ kind: 'dots-converted', from: ae.effectId, to, intensity: ae.intensity + mech.bonusIntensity });
                        return {
                            ...ae, effectId: to,
                            intensity: Math.min(MAX_EFFECT_INTENSITY, ae.intensity + mech.bonusIntensity),
                            appliedAt: state.round,
                        };
                    }),
                };
                if (!converted) events.push({ kind: 'effect-fizzled', cardId: card.id, effectId: '', message: 'no bleed or poison to convert' });
                break;
            }
            case 'boost_all_dots': {
                const affected: string[] = [];
                enemy = {
                    ...enemy,
                    effects: enemy.effects.map(ae => {
                        const def = lookupEffectDef(ae.effectId);
                        if (def?.type === 'debuff' && def.payload.damageOverTime) {
                            affected.push(ae.effectId);
                            return { ...ae, intensity: Math.min(MAX_EFFECT_INTENSITY, ae.intensity + mech.intensity) };
                        }
                        return ae;
                    }),
                };
                events.push({ kind: 'dots-boosted', intensity: mech.intensity, affected });
                break;
            }
            case 'echo_next_spell': echoNextSpell = true; break;
            case 'reprise': {
                // Return the discard(s) to hand — the player's songbook choice
                // (phase 28) for the first return if given and still in the
                // discard pile, else the pre-existing highest-rank auto-pick
                // for every subsequent return (and for callers that never pass
                // a choice). Optionally fires the reprised card's FREE line
                // immediately.
                const returned: string[] = [];
                for (let i = 0; i < mech.count * echoFactor && discard.length > 0; i++) {
                    const rankOf = (id: string): number => lookupCard(id)?.rank ?? 0;
                    const chosenIdx = i === 0 && reprisalCardId ? discard.indexOf(reprisalCardId) : -1;
                    const bestIdx = chosenIdx >= 0 ? chosenIdx
                        : discard.reduce((best, id, j) => (rankOf(id) > rankOf(discard[best]) ? j : best), 0);
                    const cid = discard[bestIdx];
                    discard = discard.filter((_, j) => j !== bestIdx);
                    hand = [...hand, { uid: `rp${state.log.length + events.length}-${i}`, cardId: cid }];
                    returned.push(cid);
                    const freeRider = lookupCard(cid)?.free;
                    if (mech.fireFree && freeRider) reprisedFreeRiders.push(freeRider);
                }
                if (returned.length > 0) {
                    events.push({ kind: 'reprised', cardId: card.id, returned });
                    // `the-sextons-count` (E): he rings once for every body
                    // raised — a RECALL costs the foe 8 VITAE and mills you
                    // 1. Card face, THE BIG NUMBERS REWRITE 2026-09-02:
                    // "the foe loses 8 VITAE and you MILL 1" — this hook
                    // predates the rewrite's text (which replaced a DOOM tick
                    // with direct damage + MILL) and was left applying the
                    // old DOOM 1; fixed to match the printed effect,
                    // card-face-honesty.
                    if (zoneHas(state, 'the-sextons-count')) {
                        sextonsTolled = true;
                        const hit = applyEnemyDamage(enemy, 8, state.round, events);
                        enemy = hit.enemy;
                        directDamage += 8 + hit.clockDamage;
                        events.push({ kind: 'damage-dealt', cardId: 'the-sextons-count', target: 'enemy', amount: 8 });
                        const tolled = drawCombatCards(drawPile, discard, state.deck, 1, _rng);
                        drawPile = tolled.drawPile;
                        discard = [...tolled.discard, ...tolled.drawn];
                        events.push({ kind: 'cards-milled', cards: tolled.drawn });
                    }
                } else {
                    events.push({ kind: 'effect-fizzled', cardId: card.id, effectId: '', message: 'the discard pile is empty' });
                }
                break;
            }
            case 'replay_last': {
                // OUROBOROS — the argument repeats: the last spell that LANDED A
                // STATUS on the enemy (phase 32 part 4f — `lastSpellCardId` skips
                // over any no-status play in between) says itself again, `times`
                // times. Never chains into another replay.
                // Phase 39 (2026-08-08) precondition-width retune: `lastSpellCardId`
                // never reset across turns, so once ANY spell had landed a status
                // this whole combat, ouroboros essentially never fizzled again
                // (measured 3-10% — far under the ~25% doctrine target). Narrowed
                // via `lastSpellRound` to "the argument you just made THIS TURN"
                // (round is the turn counter) — the FIRST spell of a turn, with
                // nothing said yet THIS turn to repeat, is now a real fizzle.
                const lastId = state.lastSpellCardId;
                const lastCard = lastId && lastId !== sourceCard.id ? lookupCard(lastId) : undefined;
                const replayable = lastCard
                    && lastCard.cardType === 'spell'
                    && state.lastSpellRound === state.round
                    && !(lastCard.specialMechanics ?? []).some(m2 => m2.kind === 'replay_last');
                if (replayable && lastCard) {
                    for (let i = 0; i < mech.times; i++) {
                        const shim2: CombatState = { ...cardShim(state), player, enemy };
                        try {
                            const replay = executeCard(shim2, lastCard.id, lookupCard, 'player');
                            player = replay.state.player as Character;
                            enemy = replay.state.enemy as Enemy;
                            allCardEvents = [...allCardEvents, ...replay.events];
                        } catch { break; }
                    }
                    events.push({ kind: 'echoed', cardId: lastCard.id });
                    // `the-sextons-count` (E): a REPLAY is a body raised —
                    // the bell costs the foe 8 VITAE and mills you 1. Card
                    // face, THE BIG NUMBERS REWRITE 2026-09-02 (see the
                    // RECALL site above — same fix, same reason).
                    if (zoneHas(state, 'the-sextons-count')) {
                        sextonsTolled = true;
                        const hit = applyEnemyDamage(enemy, 8, state.round, events);
                        enemy = hit.enemy;
                        directDamage += 8 + hit.clockDamage;
                        events.push({ kind: 'damage-dealt', cardId: 'the-sextons-count', target: 'enemy', amount: 8 });
                        const tolled = drawCombatCards(drawPile, discard, state.deck, 1, _rng);
                        drawPile = tolled.drawPile;
                        discard = [...tolled.discard, ...tolled.drawn];
                        events.push({ kind: 'cards-milled', cards: tolled.drawn });
                    }
                } else {
                    events.push({ kind: 'effect-fizzled', cardId: card.id, effectId: '', message: 'no prior spell to replay' });
                }
                break;
            }
            case 'conjure_card': {
                const cj = { uid: `cj${state.log.length + events.length}`, cardId: mech.cardId };
                hand = [...hand, cj];
                conjuredUids = [...conjuredUids, cj.uid];
                events.push({ kind: 'hand-drawn', cards: [mech.cardId] });
                break;
            }
            case 'forge_floating_die': {
                // FORGE (spec 32 v3 §5) — the floating die joins the tray NOW.
                const color: 'heart' | 'body' | 'mind' | 'wild' = mech.color === 'wild'
                    ? 'wild'
                    : dieHasStance(powering.color)
                        ? (powering.color as 'heart' | 'body' | 'mind')
                        : dieHasStance(card.stance) ? (card.stance as 'heart' | 'body' | 'mind') : 'wild';
                if (floatingDice.length >= FLOATING_DICE_CAP) {
                    conviction = Math.min(CONVICTION_CAP, conviction + 1);
                    events.push({ kind: 'conviction-gained', amount: 1, total: conviction, reason: 'effect' });
                } else {
                    const die: CombatManaDie = {
                        id: `float-${state.turn}-${state.log.length + events.length}`,
                        color, state: 'available', temporary: false, floating: true,
                        pips: 0,
                    };
                    floatingDice = [...floatingDice, die];
                    forgedFloating.push(die);
                    events.push({ kind: 'die-floated', dieId: die.id, color, poolSize: floatingDice.length });
                }
                break;
            }
            case 'float_x_die': {
                // TRANSMUTE (dice-law 2026-07-09) — a dead X face in the tray
                // becomes a GHOST WILD die: dead fate turned live. Falls back
                // to +1 Conviction (printed) with no X or at the floating cap.
                const xDie = state.dice.find(d =>
                    d.color === 'x' && d.state !== 'spent' && !d.floating && !transmutedXIds.includes(d.id));
                if (!xDie || floatingDice.length >= FLOATING_DICE_CAP) {
                    conviction = Math.min(CONVICTION_CAP, conviction + 1);
                    events.push({ kind: 'conviction-gained', amount: 1, total: conviction, reason: 'effect' });
                } else {
                    transmutedXIds.push(xDie.id);
                    const die: CombatManaDie = {
                        id: `float-${state.turn}-${state.log.length + events.length}`,
                        color: 'wild', state: 'available', temporary: false, floating: true,
                        pips: 0,
                    };
                    floatingDice = [...floatingDice, die];
                    forgedFloating.push(die);
                    events.push({ kind: 'die-floated', dieId: die.id, color: 'wild', poolSize: floatingDice.length });
                }
                break;
            }
            case 'create_temporary_die': {
                // KINDLE — a temporary die (this combat only) joins the Reserve.
                // Spec 33 §1/§6 (flag-gated): cap ONE kindled die concurrent,
                // and the 7-object table ceiling applies — either refusal
                // converts the grant to +1◆ (nothing silently dropped).
                const forged: CombatManaDie = {
                    id: `forge-${state.turn}-${state.log.length + events.length}`, color: mech.color,
                    state: 'available', temporary: true,
                    ...(isUpgradeableDiceEnabled() ? { face: 'mana' as const } : {}),
                    pips: 0,
                };
                const kindleBlocked = isUpgradeableDiceEnabled()
                    && (reserve.filter(d => d.temporary).length >= KINDLE_CONCURRENT_CAP
                        || state.dice.length + reserve.length >= UPGRADEABLE_TABLE_CEILING);
                if (!kindleBlocked && reserve.length < RESERVE_MAX) {
                    reserve = [...reserve, forged];
                    events.push({ kind: 'die-forged', dieId: forged.id, color: forged.color, destination: 'reserve' });
                } else {
                    conviction = Math.min(CONVICTION_CAP, conviction + 1);
                    if (kindleBlocked) events.push({ kind: 'die-overflowed', source: 'kindle', total: conviction });
                    events.push({ kind: 'die-forged', dieId: forged.id, color: forged.color, destination: 'conviction' });
                }
                break;
            }
            case 'grant_pip': {
                // WS4.1 — pip OVERFLOW (Slag Runoff class): each granted pip
                // that finds no room (Reserve empty, or a die already at
                // RESERVE_PIP_CAP when its wave arrives) fires the printed
                // overflow rider once instead of vanishing. Without an
                // `overflow` rider the wasted pips are simply lost (legacy).
                let overflowPips = 0;
                if (reserve.length === 0) {
                    // No die to hold ANY wave: the full grant overflows.
                    overflowPips = mech.count;
                } else {
                    for (let i = 0; i < mech.count; i++) {
                        const r = ripenReserve(reserve);
                        reserve = r.reserve;
                        overflowPips += reserve.length - r.ripenedIds.length;
                        for (const id of r.ripenedIds) {
                            events.push({ kind: 'die-ripened', dieId: id, pips: reserve.find(d => d.id === id)?.pips ?? 0 });
                        }
                    }
                }
                if (overflowPips > 0 && mech.overflow) {
                    for (let i = 0; i < overflowPips; i++) firedRiders.push(mech.overflow);
                    events.push({
                        kind: 'pips-overflowed', cardId: card.id,
                        pips: overflowPips, riderText: riderText(mech.overflow),
                    });
                }
                break;
            }
            case 'overheat': {
                // Phase 32 part 4c — the press-your-luck knob: push past
                // RESERVE_PIP_CAP, one wave per printed pip, each wave risking
                // OVERHEAT_BUST_CHANCE per die already at/above the cap. A die
                // still below the cap ripens for free (no risk) exactly like
                // `ripenReserve` — OVERHEAT only prices the overage.
                for (let i = 0; i < mech.pips; i++) {
                    const r = overheatReserve(reserve, _rng);
                    reserve = r.reserve;
                    for (const id of r.ripenedIds) {
                        events.push({ kind: 'die-ripened', dieId: id, pips: reserve.find(d => d.id === id)?.pips ?? 0 });
                    }
                    for (const id of r.bustedIds) {
                        events.push({ kind: 'overheat-bust', dieId: id, cardId: card.id, pips: reserve.find(d => d.id === id)?.pips ?? 0 });
                    }
                }
                break;
            }
            case 'reroll_spent': {
                if (hasRerollableDice(state.dice)) {
                    const rerolled = rerollSpentDice(state.dice, _rng);
                    state = { ...state, dice: rerolled.dice };
                    events.push({ kind: 'dice-rolled', dice: rerolled.dice });
                }
                break;
            }
            case 'siphon': {
                // SIPHON — heal a fraction of the HP this card's payoffs eroded.
                const healAmt = Math.round(mechanicDamage * mech.pct * getHealingReceivedMult(state.player));
                if (healAmt > 0) {
                    player = heal(player, healAmt);
                    events.push({ kind: 'damage-dealt', cardId: card.id, target: 'self', amount: -healAmt });
                }
                break;
            }
            default: break; // guard/barrier/riposte/echo/befriend etc. handled elsewhere
        }
    }
    // `the-sextons-count` (E): TWIN is the third body raised — a play that
    // resolved twice via the general TWIN mechanism tolls the bell exactly
    // like RECALL/REPLAY (see the two sites above in the mechs loop), unless
    // one of those sites already tolled it this play — a card that is BOTH
    // a reprise/replay carrier AND resolving under an armed TWIN charge
    // would otherwise pay the toll twice for one doubling (phase 86; the
    // reason TWIN was trimmed from the printed text 2026-09-04 pending this
    // exact scoping).
    if (twinCharge && !sextonsTolled && zoneHas(state, 'the-sextons-count')) {
        const hit = applyEnemyDamage(enemy, 8, state.round, events);
        enemy = hit.enemy;
        directDamage += 8 + hit.clockDamage;
        events.push({ kind: 'damage-dealt', cardId: 'the-sextons-count', target: 'enemy', amount: 8 });
        const tolled = drawCombatCards(drawPile, discard, state.deck, 1, _rng);
        drawPile = tolled.drawPile;
        discard = [...tolled.discard, ...tolled.drawn];
        events.push({ kind: 'cards-milled', cards: tolled.drawn });
    }
    const reactFired = false;
    const permanentWildDice = state.permanentWildDice ?? 0;
    const permanentDeadDice = state.permanentDeadDice ?? 0;

    // Offensive status ids this card landed on the enemy — gates the combo loop on
    // VARIETY (a status new to this chain refreshes the die; a repeat spends it).
    const landedOffensiveIds: string[] = [];

    // 4. Fold the card's effect-applications: DoT + control LAND on the enemy.
    //    DoT will tick real HP each phase (the status damage engine); control gates
    //    the enemy's turn via `canAct`. Attribute projected DoT for the summary.
    for (const ev of allCardEvents) {
        if (ev.kind === 'effect-applied') {
            const def = ev.effect;
            const target: 'self' | 'enemy' = ev.appliedTo;
            const sideEffects = target === 'enemy' ? enemy.effects : player.effects;
            const active = sideEffects.find(a => a.effectId === def.id);
            if (active && target === 'enemy') {
                const landed: LandedEffect = { effectId: def.id, effect: def, active, target };
                const cls = effectImpact(def, active.intensity, active.remainingDuration).track;
                attribution = recordAttribution(attribution, card.id, card.name, landed, 0, enemy.health);
                events.push({ kind: 'effect-landed', cardId: card.id, effectId: def.id, target: 'enemy', effectKind: cls, intensity: active.intensity, effect: def });
                if (cls === 'dot' || cls === 'control') landedOffensiveIds.push(def.id);
                // Meaningful land = intensity increased over the snapshot (or new).
                if ((before[def.id] ?? 0) < active.intensity) landedOnEnemy = true;
            } else if (active) {
                events.push({ kind: 'effect-landed', cardId: card.id, effectId: def.id, target, effectKind: 'none', intensity: active.intensity, effect: def });
            }
        } else if (ev.kind === 'buff-fumbled') {
            events.push({ kind: 'effect-fizzled', cardId: card.id, effectId: ev.effect.id, message: ev.message });
        } else if (ev.kind === 'buff-stripped') {
            events.push({
                kind: 'buff-stripped', cardId: card.id, target: ev.target,
                effectId: ev.effect?.id ?? null, effectName: ev.effect?.name ?? null,
            });
        } else if (ev.kind === 'befriend-attempted' && ev.successful) {
            mercyOpened = true;
        }
    }

    // WS3.2 'card-played' clock (spec 32 §12 #3) — a PLAYER-side card play
    // advances every card-played-clocked DoT on the enemy. Enemy actions
    // never fire this (ratified: player plays only), and — WS3.3 — this
    // play's own fresh stacks are NOT on the clock (`preExisting` gate): they
    // start paying from the NEXT play (doctrine witness).
    fireClock('card-played');

    // WS3.3 — the same clock advances card-played-clocked DoTs the PLAYER
    // bears (enemy threat riders land `debuff_poison` on the player): the
    // clock is the player's own play, wherever the DoT sits. Same
    // pre-existing STACK cap (a self-applied fresh debuff — or fresh stacks
    // merged onto an existing one — never self-ticks), and player-borne
    // washouts never earn Souls (SOUL counts ENEMY afflictions only).
    const playerPrePlay = intensityMap(state.player.effects);
    const selfClock = fireDotTrigger(player, 'card-played', state.round,
        ae => Math.min(ae.intensity ?? 1, playerPrePlay[ae.effectId] ?? 0));
    if (selfClock.damage > 0) {
        player = selfClock.target as Character;
        for (const t of selfClock.perEffect) {
            events.push({ kind: 'dot-tick', effectId: t.effectId, label: t.label, amount: t.amount, target: 'self' });
        }
    }

    // ── Rider payloads (threshold / dieBonus / fate / fallen / reap), exact units ──
    let revealedStances = state.revealedStances;
    let riderGuard = 0;
    let riderRefresh = false;
    for (const r of firedRiders) {
        // ── THE BIG NUMBERS REWRITE — the damage family on a PAID-line rider.
        // There are TWO rider executors: `applyRiderToState` (the FREE line and
        // the state path) and this one (the PAID line's `firedRiders`). Teaching
        // only the first meant every condition payoff that printed a number —
        // IMMOLATE's rider, a FALLEN clause, a FATE line, a dieBonus, a synergy,
        // a pip overflow, 20 cards in all — showed the player a figure the
        // engine never applied. Caught 2026-09-02 by the effectiveness pass.
        if (r.damage) {
            const scaled = scalePlayerHitDetailed({
                base: r.damage,
                readMult: mult,
                colorMatch,
                wrath, chain,
                flay: flayStacks > 0,
                execute: executeArmed,
                hide: effectiveHide(enemy, staggeredThisRound),
                pierce: r.pierce === true,
            });
            const dmg = scaled.dmg;
            if (scaled.hideSoaked > 0) {
                events.push({ kind: 'enemy-keyword-fired', enemyId: enemy.id, keyword: 'HIDE', amount: scaled.hideSoaked });
            }
            if (chain > 0) chain = 0;
            if (flayStacks > 0) flayStacks -= 1;
            if (dmg > 0) {
                const hpBeforeRider = enemy.health;
                const hit = applyEnemyDamage(enemy, dmg, state.round, events);
                enemy = hit.enemy;
                mechanicDamage += dmg;
                directDamage += dmg + hit.clockDamage;
                attribution = recordAttribution(attribution, card.id, card.name, null, dmg, hpBeforeRider);
                gainSoulsLocal(soulWorthyWashouts(hit.washedOut), 'expiry');
                events.push({ kind: 'damage-dealt', cardId: card.id, target: 'enemy', amount: dmg });
            }
        }
        if (r.wrath) {
            wrath += r.wrath;
            events.push({ kind: 'wrath-gained', cardId: card.id, amount: r.wrath, total: wrath });
        }
        if (r.chain) {
            chain += r.chain;
            chainFedThisTurn = true;
            events.push({ kind: 'chain-gained', cardId: card.id, amount: r.chain, total: chain });
        }
        if (r.flay) {
            flayStacks += r.flay;
            events.push({ kind: 'flay-applied', cardId: card.id, amount: r.flay, total: flayStacks });
        }
        if (r.guard) riderGuard += r.guard;
        if (r.conviction) conviction = Math.min(CONVICTION_CAP, conviction + r.conviction);
        if (r.refreshDie) riderRefresh = true;
        if (r.revealStance) {
            const nIdx = Math.min(state.currentPhaseIndex + 1, state.threatPhases.length - 1);
            if (!revealedStances.includes(nIdx)) {
                revealedStances = [...revealedStances, nIdx];
                events.push({ kind: 'stance-revealed', phaseIndex: nIdx, stance: state.threatPhases[nIdx].enemyStance });
            }
        }
        if (r.tickAllDots) {
            const ticks = getActiveDotTotal(enemy.effects, state.round);
            if (ticks.total > 0) {
                const hpBefore = enemy.health;
                enemy = applyDamage(enemy, ticks.total);
                directDamage += ticks.total;
                attribution = recordAttribution(attribution, card.id, card.name, null, ticks.total, hpBefore);
                for (const t of ticks.perEffect) {
                    events.push({ kind: 'dot-tick', effectId: t.effectId, label: t.label, amount: t.amount, target: 'enemy' });
                }
                const decayed = decayManuallyTickedDots(enemy, ticks.perEffect.map(t => t.effectId));
                enemy = decayed.bearer;
                gainSoulsLocal(soulWorthyWashouts(decayed.washedOut), 'expiry');
            }
        }
        if (r.tickOne) {
            const ticks = getActiveDotTotal(enemy.effects, state.round).perEffect;
            const strongest = ticks.reduce<typeof ticks[number] | null>(
                (best, t) => (best === null || t.amount > best.amount ? t : best), null);
            if (strongest) {
                const hpBefore = enemy.health;
                enemy = applyDamage(enemy, strongest.amount);
                directDamage += strongest.amount;
                attribution = recordAttribution(attribution, card.id, card.name, null, strongest.amount, hpBefore);
                events.push({ kind: 'dot-tick', effectId: strongest.effectId, label: strongest.label, amount: strongest.amount, target: 'enemy' });
                const decayed = decayManuallyTickedDots(enemy, [strongest.effectId]);
                enemy = decayed.bearer;
                gainSoulsLocal(soulWorthyWashouts(decayed.washedOut), 'expiry');
            }
        }
        if (r.ruptureMarks) {
            // WS3.2 — the mark-conclusion is a payoff verb (rider-carried).
            fireClock('payoff');
            const consumed = consumeMarks(enemy);
            if (consumed.stacks > 0) {
                enemy = consumed.combatant;
                const burst = Math.min(ruptureBurstCap(enemy.maxHealth), Math.round(r.ruptureMarks * consumed.stacks * vulnMult));
                const hpBefore = enemy.health;
                const hit = applyEnemyDamage(enemy, burst, state.round, events);
                enemy = hit.enemy;
                mechanicDamage += burst;
                directDamage += burst + hit.clockDamage;
                gainSoulsLocal(soulWorthyWashouts(hit.washedOut), 'expiry');
                attribution = recordAttribution(attribution, card.id, card.name, null, burst, hpBefore);
                events.push({ kind: 'damage-dealt', cardId: card.id, target: 'enemy', amount: burst });
            }
        }
        if (r.intensityPerPip && pipsSpentThisPlay > 0) {
            // +1 intensity to ONE enemy DoT per pip spent (the-overtake class).
            const dotAe = enemy.effects.find(ae => lookupEffectDef(ae.effectId)?.payload.damageOverTime);
            if (dotAe) {
                enemy = {
                    ...enemy,
                    effects: enemy.effects.map(ae => ae === dotAe
                        ? { ...ae, intensity: Math.min(MAX_EFFECT_INTENSITY, ae.intensity + r.intensityPerPip! * pipsSpentThisPlay) }
                        : ae),
                };
                events.push({ kind: 'pips-cashed', cardId: card.id, pips: pipsSpentThisPlay, bonus: 'intensity', amount: r.intensityPerPip * pipsSpentThisPlay });
            }
        }
        if (r.applyEffect) {
            const def = lookupEffectDef(r.applyEffect.effectId);
            if (def) {
                const toSelf = r.applyEffect.to === 'self';
                const bearer = toSelf ? player : enemy;
                const applied = applyEffect(bearer.effects, def, state.round, {
                    intensityDelta: r.applyEffect.intensity ?? 1,
                    ...(r.applyEffect.duration !== undefined
                        ? { durationMode: 'additive' as const, durationDelta: r.applyEffect.duration }
                        : {}),
                    sourceId: card.id,
                });
                if (toSelf) player = { ...player, effects: applied.activeEffects };
                else enemy = { ...enemy, effects: applied.activeEffects };
            }
        }
        if (r.cleanse) {
            let remaining = r.cleanse;
            player = {
                ...player,
                effects: player.effects.filter(ae => {
                    if (remaining > 0 && lookupEffectDef(ae.effectId)?.type === 'debuff') {
                        remaining -= 1;
                        return false;
                    }
                    return true;
                }),
            };
        }
        if (r.healHp) {
            const healAmt = Math.round(r.healHp * getHealingReceivedMult(state.player));
            if (healAmt > 0) {
                player = heal(player, healAmt);
                events.push({ kind: 'damage-dealt', cardId: card.id, target: 'self', amount: -healAmt });
            }
        }
        if (r.drawCards) {
            // The PLAYED card leaves the hand right after this play resolves —
            // it must not occupy draw room, or a printed "draw N" under-delivers
            // whenever the hand is full (P0-truth: printed == applied).
            const room = Math.max(0, COMBAT_HAND_SIZE - (hand.length - 1));
            const n = Math.min(r.drawCards, room);
            if (n > 0) {
                const draw = drawCombatCards(drawPile, discard, state.deck, n, _rng);
                drawPile = draw.drawPile;
                discard = draw.discard;
                hand = [...hand, ...draw.drawn.map((cardId, i) => ({ uid: `cr${state.log.length + i}-${uid}`, cardId }))];
                events.push({ kind: 'hand-drawn', cards: draw.drawn });
            }
        }
        if (r.millCards) {
            // MILL — the cards go straight to the discard, never to hand (the
            // grave's own draw). The profane canon prints MILL on PAID riders
            // (first-spadeful, spadework), so the in-play applier has to
            // deliver it too — printed == applied.
            const mill = drawCombatCards(drawPile, discard, state.deck, r.millCards, _rng);
            drawPile = mill.drawPile;
            discard = [...mill.discard, ...mill.drawn];
            events.push({ kind: 'cards-milled', cards: mill.drawn });
        }
        if (r.premises) premisesGained += r.premises;
        if (r.sway) swayGained += r.sway;
        if (r.souls) gainSoulsLocal(r.souls, 'granted');
        if (r.foretell) foretellCount += r.foretell;
        if (r.stagger) {
            staggerRungs += r.stagger;
            events.push({ kind: 'staggered', rungs: r.stagger, total: staggerRungs });
        }
        if (r.pips && reserve.length > 0) {
            for (let i = 0; i < r.pips; i++) {
                const rp = ripenReserve(reserve);
                reserve = rp.reserve;
                for (const id of rp.ripenedIds) {
                    events.push({ kind: 'die-ripened', dieId: id, pips: reserve.find(d => d.id === id)?.pips ?? 0 });
                }
            }
        }
    }

    // 5. Die spend / refresh — the powering die's fate. The variety chain keeps
    //    the turn alive on a NEW status (unchanged, R9); a refresh rider/mechanic
    //    always refreshes; CONVERT returns it as WILD; BANK_SPENT_DIE parks it in
    //    the Reserve. A GHOST die is GONE FOREVER when spent (spec 32 v3 §5) —
    //    refresh effects cannot save it.
    const chainBefore = state.chainEffectIds ?? [];
    const newChainIds = landedOffensiveIds.filter(id => !chainBefore.includes(id));
    const landedNewDistinct = newChainIds.length > 0;
    const convertMech = mechs.some(m => m.kind === 'convert_die_color');
    const bankSpentMech = mechs.some(m => m.kind === 'bank_spent_die');
    // Spec 33 (flag-gated): the VARIETY-CHAIN auto-refresh dies with the
    // single-die law it compensated — under the four-die model every usable
    // die already powers its own play, so a free refresh would inflate the
    // action economy past the §1 baseline (~1.83 paid plays/round). Explicit
    // refresh riders/mechanics (cards that PRINT the refresh) still work.
    const chainRefresh = !isUpgradeableDiceEnabled() && landedOnEnemy && landedNewDistinct;
    const refreshed = chainRefresh || reactFired || riderRefresh
        || mechs.some(m => m.kind === 'refresh_die') || convertMech;
    // TRANSMUTE — X dice consumed by `float_x_die` leave the tray (their wild
    // floating successors join it below via `forgedFloating`).
    let dice = transmutedXIds.length > 0
        ? state.dice.filter(d => !transmutedXIds.includes(d.id))
        : state.dice;
    if (poweringSource === 'floating') {
        dice = dice.filter(d => d.id !== powering.id);
        floatingDice = floatingDice.filter(d => d.id !== powering.id);
        events.push({ kind: 'floating-die-spent', dieId: powering.id, color: powering.color, poolSize: floatingDice.length });
        events.push({ kind: 'die-spent', dieId: powering.id, color: powering.color });
    } else if (poweringSource === 'reserve') {
        if (refreshed || bankSpentMech) {
            // Refreshed (rider/mechanic) OR BANK_SPENT_DIE: the die stays in the
            // Reserve, its pips cashed by this play. `bank_spent_die` on a
            // Reserve-powered play ("the hand that struck it goes back in the
            // tray, unspent") was previously ignored here — the die was spent.
            reserve = reserve.map(d => (d.id === powering.id ? { ...d, pips: 0 } : d));
            events.push(refreshed
                ? { kind: 'die-refreshed', dieId: powering.id, color: powering.color }
                : { kind: 'die-banked', dieId: powering.id, color: powering.color, pips: 0 });
        } else {
            reserve = reserve.filter(d => d.id !== powering.id);
            events.push({ kind: 'die-spent', dieId: powering.id, color: powering.color });
        }
    } else if (poweringSource === 'fate-x') {
        dice = dice.map(d => (d.id === powering.id ? { ...d, state: 'spent' as const } : d));
        events.push({ kind: 'die-spent', dieId: powering.id, color: powering.color });
    } else if (convertMech) {
        // "Still your die?" — the spent die returns refreshed as WILD.
        dice = dice.map(d => (d.id === powering.id ? { ...d, color: 'wild' as const, state: 'available' as const } : d));
        events.push({ kind: 'die-converted', dieId: powering.id, color: 'wild' });
    } else if (bankSpentMech && reserve.length < RESERVE_MAX) {
        dice = spendDice(dice, [powering.id]);
        reserve = [...reserve, { ...powering, state: 'available', pips: 0 }];
        events.push({ kind: 'die-banked', dieId: powering.id, color: powering.color, pips: 0 });
    } else if (refreshed) {
        events.push({ kind: 'die-refreshed', dieId: powering.id, color: powering.color });
    } else {
        dice = spendDice(dice, [powering.id]);
        events.push({ kind: 'die-spent', dieId: powering.id, color: powering.color });
    }
    // FORGE (spec 32 v3 §5) — the forged floating die joins the tray NOW, so it
    // can power a play THIS turn (the "bigger turns" intent).
    if (forgedFloating.length > 0) dice = [...dice, ...forgedFloating];

    // Defense card → GUARD (read-scaled + color-match + pips). Absorbed in
    // `resolveThreatPhase`.
    const guardMech = (sourceCard.specialMechanics ?? []).find(m => m.kind === 'guard') as { amount: number } | undefined;
    const pipGuard = isDefendPlay ? poweringPips * PIP_GUARD_BONUS : 0;
    if (pipGuard > 0) {
        events.push({ kind: 'pips-cashed', cardId: card.id, pips: poweringPips, bonus: 'guard', amount: pipGuard });
    }
    const guardGain = (guardMech
        ? (() => { const b = Math.max(1, Math.round(guardMech.amount * mult)); return b + (colorMatch ? colorMatchBonus(b) : 0); })()
        : 0) + riderGuard + pipGuard + pipGuardExtra;
    // BARRIER — a STACKING, persistent soak (distinct from one-shot guard); read-scaled.
    const barrierMech = mechs.find(m => m.kind === 'barrier') as { kind: 'barrier'; amount: number } | undefined;
    const barrierGain = barrierMech
        ? (() => { const b = Math.max(1, Math.round(barrierMech.amount * mult)); return b + (colorMatch ? colorMatchBonus(b) : 0); })()
        : 0;
    // RIPOSTE — arm the counter-stance (spec 32 v3: fires only on a FULL block —
    // see `resolveThreatPhase`); a prior arming this phase survives.
    const riposteMech = mechs.find(m => m.kind === 'riposte') as { kind: 'riposte'; damage: number; reduce: number } | undefined;
    const riposteArmed = riposteMech
        ? {
            damage: Math.max(1, Math.round(riposteMech.damage * mult)),
            reduce: Math.max(0, Math.round(riposteMech.reduce * mult)),
          }
        : state.riposte;

    // Phase 32 part 3 (Akrasia — DEBT ledger): `recoilTaken` already sums this
    // play's PAID-line blood price (the `recoil`/`recoil_x` mechanics and
    // `fate.recoilHp` — see its declaration above); post it to the per-combat
    // ledger the same way `recoilPaidThisTurn` folds it in below. The FREE-line
    // `CardRider.recoil` path (`pact-of-akrasia`) posts separately inside
    // `applyRiderToState`, so this is additive, not a duplicate of that site.
    const akrasiaDebtBefore = state.akrasiaDebt ?? 0;
    const akrasiaDebt = akrasiaDebtBefore + recoilTaken;
    let tierGuardBonus = 0;
    if (recoilTaken > 0) {
        events.push({ kind: 'debt-paid', amount: recoilTaken, total: akrasiaDebt });
        const tiersCrossed = akrasiaDebtTiersCrossed(akrasiaDebtBefore, akrasiaDebt);
        if (tiersCrossed > 0 && wasFallen) {
            tierGuardBonus = tiersCrossed * AKRASIA_DEBT_TIER_GUARD;
            events.push({ kind: 'debt-tier-payoff', tiersCrossed, guard: tierGuardBonus, total: akrasiaDebt });
        }
        // `the-red-ledger` (E): every RECOIL paid this play is billed again —
        // WRATH 1 and 6 to the foe, once per play. Card face, THE BIG NUMBERS
        // REWRITE 2026-09-02: "gain WRATH 1 and deal 6 to the foe" — this
        // hook predates the rewrite's text (which replaced a BLEED-billing
        // effect with a WRATH+damage payoff) and was left applying the old
        // BLEED; fixed to match the printed effect, card-face-honesty.
        if (zoneHas(state, 'the-red-ledger') && !isDefeated(enemy)) {
            wrath += 1;
            events.push({ kind: 'wrath-gained', cardId: 'the-red-ledger', amount: 1, total: wrath });
            const hpBefore = enemy.health;
            const hit = applyEnemyDamage(enemy, 6, state.round, events);
            enemy = hit.enemy;
            directDamage += 6 + hit.clockDamage;
            attribution = recordAttribution(attribution, 'the-red-ledger', 'The Red Ledger', null, 6, hpBefore);
            events.push({ kind: 'damage-dealt', cardId: 'the-red-ledger', target: 'enemy', amount: 6 });
        }
        // `joint-and-several` (D): liability is shared — the foe loses TWICE
        // every RECOIL paid this play (engine-drip channel; the strike stays
        // dead). Card face, THE BIG NUMBERS REWRITE 2026-09-02: "the foe
        // loses twice that much VITAE" — this hook predates the rewrite's
        // text and was left at a flat 1x; fixed to match the printed
        // multiplier, card-face-honesty.
        if (zoneHas(state, 'joint-and-several') && !isDefeated(enemy)) {
            const liable = Math.min(recoilTaken * 2, enemy.health);
            const hpBefore = enemy.health;
            enemy = applyDamage(enemy, liable);
            directDamage += liable;
            attribution = recordAttribution(attribution, 'joint-and-several', 'Joint and Several', null, liable, hpBefore);
            events.push({ kind: 'damage-dealt', cardId: 'joint-and-several', target: 'enemy', amount: liable });
        }
    }

    // IMMOLATE / PURGE (profane-canon rework) — burned cards leave the deck
    // cycle: one instance per burned id is struck from the persistent deck
    // list so no reshuffle resurrects them this combat.
    let deckAfterBurn = state.deck;
    if (immolatedIds.length > 0 || purgeSelf) {
        deckAfterBurn = [...state.deck];
        const strike = purgeSelf ? [...immolatedIds, sourceCard.id] : immolatedIds;
        for (const id of strike) {
            const at = deckAfterBurn.indexOf(id);
            if (at >= 0) deckAfterBurn.splice(at, 1);
        }
    }

    let next: CombatEncounterState = {
        ...state, player, enemy, dice, reserve, resonance, conviction,
        deck: deckAfterBurn,
        revealedStances, hand, drawPile, discard, attribution,
        chainEffectIds: [...chainBefore, ...newChainIds],
        guard: (state.guard ?? 0) + guardGain + tierGuardBonus,
        barrier: (state.barrier ?? 0) + barrierGain,
        akrasiaDebt,
        // Phase 32 part 4a (Control — TURNABOUT ledger): rolls forward
        // unchanged from every OTHER mechanic's play; a `turnabout` case
        // above already zeroed the local var before this assembly reads it.
        rungsDeniedTotal,
        riposte: riposteArmed,
        directDamageDealt: directDamage,
        permanentWildDice,
        permanentDeadDice,
        floatingDice,
        souls,
        staggerRungs,
        stanceLockedNext,
        pendingOmens,
        peroration: perorationDecl,
        echoNextSpell,
        conjuredUids,
        // THE BIG NUMBERS REWRITE — the damage-scaler ledgers.
        wrath,
        chain,
        chainFedThisTurn,
        flay: flayStacks,
        twinArmed,
        spellsPlayedThisTurn: (state.spellsPlayedThisTurn ?? 0) + 1,
        // Phase 32 part 4f — only a spell that actually landed/deepened a
        // status on the enemy (`landedOnEnemy`, computed above from the
        // merged `allCardEvents`, which already includes any replay's own
        // events) becomes ouroboros's replay target. A no-status play
        // (fizzle, pure-mechanic burst like TURNABOUT/RUPTURE, a dieless
        // no-op) leaves the prior status-landing spell in place instead of
        // overwriting it with a card that has nothing to re-land.
        lastSpellCardId: landedOnEnemy ? sourceCard.id : state.lastSpellCardId,
        // Phase 39 (2026-08-08) — the round-stamp ouroboros's precondition-
        // width retune reads (see `replay_last` below): only set alongside
        // `lastSpellCardId`, on the SAME condition.
        lastSpellRound: landedOnEnemy ? state.round : state.lastSpellRound,
        // Spec 32 §12 #4 — both blood-price sites (the `recoil` mech case and
        // the fate-recoil pay) accumulate into `recoilTaken` above.
        recoilPaidThisTurn: (state.recoilPaidThisTurn ?? 0) + recoilTaken,
    };
    // Discard the played card — a CONJURED Haunt is one-use: it leaves
    // the combat entirely instead of entering the discard pile. A PURGED card
    // (profane-canon rework: the curse buying itself out) leaves the same way
    // — its deck-cycle instance was already struck above.
    if (purgeSelf || conjuredUids.includes(uid)) {
        next = {
            ...next,
            hand: next.hand.filter(h => h.uid !== uid),
            conjuredUids: conjuredUids.filter(u => u !== uid),
        };
    } else {
        next = discardEntry(next, uid);
    }

    // ── Post-payload state verbs (foretell / premises / sway / spend) ─────────
    if (foretellCount > 0) next = applyForetell(next, foretellCount, events);
    if (spendPremisesMech) {
        const spent = next.premises ?? 0;
        if (spent > 0) {
            const markStacks = Math.floor(spent / spendPremisesMech.markPer);
            const draws = Math.floor(spent / spendPremisesMech.drawPer);
            if (markStacks > 0) {
                const markDef = lookupEffectDef('debuff_mark');
                if (markDef) {
                    const applied = applyEffect(next.enemy.effects, markDef, next.round, { intensityDelta: markStacks, sourceId: card.id });
                    next = { ...next, enemy: { ...next.enemy, effects: applied.activeEffects } };
                }
            }
            events.push({ kind: 'premises-spent', spent, marks: markStacks, drawn: draws });
            next = { ...next, premises: 0 };
            if (draws > 0) next = applyRiderToState(next, card.id, { drawCards: draws }, events, _rng);
        } else {
            events.push({ kind: 'effect-fizzled', cardId: card.id, effectId: '', message: 'no Premises to spend' });
        }
    }
    if (premisesGained > 0) {
        const resP = gainPremises(next, premisesGained, events, _rng);
        next = resP.state;
        if (resP.concede) {
            next = withLog(next, events);
            return endCombat(next, 'concede', events);
        }
    }
    if (swayGained > 0) next = gainSway(next, swayGained, events);
    for (const fr of reprisedFreeRiders) {
        next = applyRiderToState(next, card.id, fr, events, _rng);
    }

    if (mercyOpened) {
        next = { ...next, mercyChoiceActive: true };
        events.push({ kind: 'mercy-opened', message: `${enemy.name} falters — spare or exploit?` });
    }
    // Phase 33d (GLYPHS pilot) — inscribing is a side effect appended AFTER
    // the card's own combatEffects/paidSummary PAID line resolves (same play,
    // same card) — the card is never dead if its glyph is never cracked.
    if (sourceCard.glyph) {
        const glyph: GlyphInstance = {
            id: `${sourceCard.id}-${(next.glyphs ?? []).length}`,
            cardId: sourceCard.id,
            payload: sourceCard.glyph.payload,
            charges: 0,
            cap: sourceCard.glyph.cap,
        };
        next = { ...next, glyphs: [...(next.glyphs ?? []), glyph] };
        events.push({ kind: 'glyph-inscribed', glyphId: glyph.id, cardId: sourceCard.id });
    }
    next = withLog(next, events);
    if (swayOffersCapitulation(next)) return offerCapitulation(next, events);
    return checkImmediateOutcome(next, events);
}


/** Checks for a global threshold crossing mid-phase (immediate outcome, §7.1). */
function checkImmediateOutcome(state: CombatEncounterState, events: CombatEvent[]): CombatTransition {
    if (state.finalOutcome) return { state, events };
    // HP model: the enemy's only bar is HP. A successful Befriend opens the
    // spare/exploit mercy choice (handled via `mercyChoiceActive`), not here.
    if (isDefeated(state.enemy)) return endCombat(state, 'victory', events);
    return { state, events };
}

function endCombat(state: CombatEncounterState, outcome: CombatEncounterState['finalOutcome'], events: CombatEvent[]): CombatTransition {
    const ev: CombatEvent = { kind: 'combat-ended', outcome: outcome! };
    const ended: CombatEncounterState = { ...state, phase: 'complete', finalOutcome: outcome };
    return { state: withLog(ended, [ev]), events: [...events, ev] };
}

// ── Phase resolution + between-phases (§4.4, §4.5, §9) ───────────────────────

/**
 * STAGGER-rung denial (spec 32 v3 T5), extracted so `resolveThreatPhase` and
 * `getDisruptMeter` read the exact same math instead of drifting — the two
 * used to disagree (`getDisruptMeter.willDeny` never saw a pure-rung deny;
 * phase 28 fixed that by sharing this helper instead of patching the symptom
 * in two places). Boss/unique rung REGROWTH
 * (plan/tuning/2026-07-08-win-path-scaling.md item 1c, anti-permalock):
 * accrued resilience from prior rounds where this boss's telegraph was
 * denied/weakened.
 */
function computeRungDenial(state: CombatEncounterState): {
    rungsTotal: number; rungsLost: number; rungDenied: boolean; naturalRungsTotal: number; rungGrowth: number;
} {
    const isBossTier = state.enemy.difficulty === 'boss' || state.enemy.difficulty === 'unique';
    // Phase 33b — variable-rung telegraphs: the current phase may author its
    // own rung count (1-4, `CombatThreatPhase.rungs`), overriding the flat
    // difficulty-derived default so STAGGER reads as a sized answer to a
    // sized threat. Unauthored phases fall back to the original flat
    // behavior byte-identical.
    const idx = Math.min(state.currentPhaseIndex, state.threatPhases.length - 1);
    const authoredRungs = state.threatPhases[idx]?.rungs;
    const naturalRungsTotal = authoredRungs !== undefined
        ? Math.max(1, Math.min(4, authoredRungs))
        : (isBossTier ? THREAT_RUNGS_BOSS : THREAT_RUNGS);
    const rungGrowth = isBossTier ? Math.min(state.bossRungGrowth ?? 0, bossRungGrowthCap(naturalRungsTotal)) : 0;
    const rungsTotal = naturalRungsTotal + rungGrowth;
    // UNSHAKEN (THE BIG NUMBERS REWRITE) — some things were never going to
    // flinch: no rung of this foe's telegraph can be denied, whatever STAGGER
    // and BACKFIRE have banked. The ledger still accrues (TURNABOUT can cash
    // it); it simply buys nothing against THIS foe's ladder.
    const unshaken = hasEnemyKeyword(state.enemy.keywords, 'unshaken');
    const rungsLost = unshaken ? 0 : Math.min(rungsTotal, (state.staggerRungs ?? 0));
    const rungDenied = !unshaken && rungsLost >= rungsTotal;
    return { rungsTotal, rungsLost, rungDenied, naturalRungsTotal, rungGrowth };
}

/**
 * Phase 31 (EA-7) — THE STAKE settlement. Called at the top of
 * `resolveThreatPhase`, before the escalation clock reads its round basis (a
 * LOST stake raises the basis THIS same phase, not just future ones). A
 * no-op when no stake is placed. Win payouts route through the same
 * `forge_floating_die` mint shape and `FLOATING_DICE_CAP` overflow ->
 * +1 Conviction fallback every other float mint uses.
 */
function settleStake(
    state: CombatEncounterState,
    phase: CombatThreatPhase,
    events: CombatEvent[],
): { conviction: number; floatingDice: CombatManaDie[]; stakeEscalationBonus: number } {
    const conviction = state.conviction;
    const floatingDice = state.floatingDice ?? [];
    const bonus = state.stakeEscalationBonus ?? 0;
    if (!state.stake) return { conviction, floatingDice, stakeEscalationBonus: bonus };
    const { color, amount } = state.stake;

    if (color !== phase.enemyStance) {
        events.push({ kind: 'stake-lost', amount });
        return { conviction, floatingDice, stakeEscalationBonus: bonus + 1 };
    }

    const payout: 'colored' | 'colored-pip' | 'wild' = amount === 6 ? 'wild' : amount === 4 ? 'colored-pip' : 'colored';
    if (floatingDice.length >= FLOATING_DICE_CAP) {
        const nextConviction = Math.min(CONVICTION_CAP, conviction + 1);
        events.push({ kind: 'conviction-gained', amount: 1, total: nextConviction, reason: 'effect' });
        events.push({ kind: 'stake-won', color, payout });
        return { conviction: nextConviction, floatingDice, stakeEscalationBonus: bonus };
    }
    const dieColor: CombatDieColor = amount === 6 ? 'wild' : color;
    const die: CombatManaDie = {
        id: `stake-${state.turn}-${state.log.length}`,
        color: dieColor, state: 'available', temporary: false, floating: true,
        pips: amount === 4 ? 1 : 0,
    };
    const nextFloating = [...floatingDice, die];
    events.push({ kind: 'die-floated', dieId: die.id, color: dieColor, poolSize: nextFloating.length });
    events.push({ kind: 'stake-won', color, payout });
    return { conviction, floatingDice: nextFloating, stakeEscalationBonus: bonus };
}

/**
 * FLURRY's split: `total` divided into `hits` same-sum pieces, remainder
 * spread across the first pieces (so a 31-damage FLURRY-3 lands 11/10/10, not
 * a dropped point). Never zero-length and never a 0-damage piece for a
 * positive total.
 */
function splitFlurryDamage(total: number, hits: number): number[] {
    const base = Math.floor(total / hits);
    const remainder = total - base * hits;
    return Array.from({ length: hits }, (_, i) => base + (i < remainder ? 1 : 0));
}

/**
 * Phase 102 (SUMMON) — the soak arithmetic for a FLAT hit that is NOT part of
 * the foe's telegraph: armor, then GUARD, then BARRIER, with SWIFT's half
 * divisor (the wall absorbs half its face value and is consumed at the full
 * rate, exactly as in the telegraph loop).
 *
 * This is the SINGLE definition of the wall arithmetic shared by
 * `resolveThreatPhase`'s add block and BOTH of `projectIncomingThreat`'s terms
 * — the foe's own telegraphed hit as well as the add term — so the on-screen
 * wall math cannot drift from what the engine actually does. The design panel
 * named that drift the worst class of lie a telegraph can tell, and audit 3.2
 * is how it happened anyway: the projection kept a third, divergent inline copy
 * for its own telegraph soak, missing this helper's SWIFT divisor and armor
 * subtraction, and the add term inherited the bad leftover wall. If you need
 * this arithmetic anywhere, call this function.
 *
 * Deliberately EXCLUDES riposte (a parry on the foe's own swing, one-shot per
 * phase) and BRUTAL (a property of the foe's blow), and it
 * never touches `attacksLanded`/`attacksFullyBlocked`: an add's bite is not an
 * "attack" for any ledger that the authored telegraph reads.
 */
function soakFlatHit(
    raw: number,
    o: { armor: number; guard: number; barrier: number; swift: boolean },
): { dealt: number; guard: number; barrier: number } {
    let dmg = Math.max(0, raw - o.armor);
    const div = o.swift ? 2 : 1;
    let guard = o.guard;
    let barrier = o.barrier;
    const g = Math.min(Math.floor(guard / div), dmg);
    guard -= g * div;
    dmg -= g;
    const b = Math.min(Math.floor(barrier / div), dmg);
    barrier -= b * div;
    dmg -= b;
    return { dealt: dmg, guard, barrier };
}

/**
 * Phase 102 — a wave of SUMMON adds, snapshotted off the foe's level at spawn
 * time so a later STAGE cannot silently re-price a body already on the board.
 *
 * DETERMINISTIC BY CONSTRUCTION: no `rng()` call. `rng` is consumed by THE
 * CLOCK and the hand refill inside the same `processBetweenPhases` pass, so a
 * single stray draw here would shift every downstream seeded result — the
 * whole e2e suite and the combat-playtest matrix move at once. Keep it pure.
 */
function spawnAddWave(enemy: Enemy, n: number, wave: number, name: string): CombatAdd[] {
    const bite = Math.max(2, Math.round(enemy.level * ADD_BITE_PER_LEVEL));
    return Array.from({ length: n }, (_, i) => ({
        id: `add-${enemy.id}-${wave}-${i}`,
        name,
        vitae: 1,
        maxVitae: 1,
        bite,
    }));
}

/**
 * Resolves the current threat phase (HP model): the enemy executes its
 * telegraphed threat action on the player UNLESS a control status hinders it
 * (`canAct` → skipTurn). This is how control "hinders the enemy" — it loses its
 * attack this phase. Then between-phases processing runs (DoT ticks, draw, advance).
 */
export function resolveThreatPhase(state: CombatEncounterState, rng: () => number = defaultRng): CombatTransition {
    if (state.phase === 'complete' || state.finalOutcome) return { state, events: [] };

    const idx = Math.min(state.currentPhaseIndex, state.threatPhases.length - 1);
    const phase = state.threatPhases[idx];
    const events: CombatEvent[] = [];

    // Phase 31 (EA-7) — THE STAKE settles here, before the escalation clock
    // reads its round basis below, so a LOST stake's +1 round-equivalent
    // already bites THIS phase's incoming hit, not just future ones.
    // Spec 33 [owner-locked, D1]: STAKE is retired under the flag — nothing to
    // settle (placeStake refuses all flag-on wagers).
    const stakeResult = isUpgradeableDiceEnabled()
        ? { conviction: state.conviction, floatingDice: state.floatingDice ?? [], stakeEscalationBonus: state.stakeEscalationBonus ?? 0 }
        : settleStake(state, phase, events);

    // Spec 33 §2 (flag-gated) — the phase's OPEN stance check resolves against
    // the player's stance-from-cards NOW (phase end): `punishes` lands the hit
    // at the advantage rail (x1.5); `yields` blunts it to the disadvantage
    // rail (x0.5) and pays +1◆ below. Stance-less players fire nothing.
    const stanceCheck = isUpgradeableDiceEnabled()
        ? resolveStanceCheck(phase.stanceCheck, state.playerStance ?? null,
            READ_DAMAGE_MULT.advantage, READ_DAMAGE_MULT.disadvantage)
        : { mult: 1, yielded: false, outcome: 'none' as const };
    if (isUpgradeableDiceEnabled() && phase.stanceCheck) {
        events.push({
            kind: 'stance-check-resolved', phaseIndex: phase.index,
            outcome: stanceCheck.outcome, stance: state.playerStance ?? null,
        });
    }

    // Control on the enemy hinders its turn. HARD control (skipTurn) denies it
    // outright via canAct; SOFT control (confusion/fear/daze/slow/blind/accuracy-
    // & attack-down) carries a negative roll modifier that WEAKENS the telegraphed
    // hit, and a committed VARIETY of soft-controls (cumulative penalty ≥
    // THREAT_DENY_AT) denies the turn too. This is what finally makes the
    // soft-control / stat-debuff bucket DO something — the aggregators always
    // computed the penalty; the HP engine just never read it (pre-0.33.0).
    const act = canAct(state.enemy.effects as ActiveEffect[], phase.enemyStance);
    const rollPenalty = Math.max(0, -getActiveRollModifier(state.enemy));
    // DISRUPT — an ADDITIVE deny path on top of the legacy roll-penalty deny: a
    // VARIETY of >= DISRUPT_DENY_AT DISTINCT controls cancels the telegraphed turn
    // even before the cumulative penalty reaches THREAT_DENY_AT.
    const controlPips = getDistinctControlCount(state.enemy);
    const disruptDenied = controlPips >= DISRUPT_DENY_AT;
    const isBossTier = state.enemy.difficulty === 'boss' || state.enemy.difficulty === 'unique';
    // STAGGER RUNGS (spec 32 v3 T5) — the telegraphed action carries
    // THREAT_RUNGS rungs (bosses one more); accumulated STAGGER removes
    // rungs. At 0 the turn is DENIED; partial removal weakens the hit
    // proportionally, and each rung lost feeds BACKFIRE.
    const { rungsTotal, rungsLost, rungDenied, naturalRungsTotal, rungGrowth } = computeRungDenial(state);
    const denied = rollPenalty >= THREAT_DENY_AT || disruptDenied || rungDenied;
    const rungMult = rungDenied ? 0 : (rungsTotal - rungsLost) / rungsTotal;
    const weakenMult = Math.max(THREAT_WEAKEN_FLOOR, Math.min(1, 1 - rollPenalty * THREAT_WEAKEN_PER_ROLL))
        * (rungsLost > 0 && !rungDenied ? rungMult : 1);
    // THE CLOCK (depth epic): the telegraphed hit escalates each round past the grace
    // window, so a drawn-out fight turns lethal. 1.0 on round ≤ grace (a fast kill is
    // unpunished → those fights are byte-identical to pre-epic).
    // Boss/unique enemies escalate FASTER: their per-round rate is multiplied by
    // THREAT_ESCALATION_BOSS_MULT so a dragging boss fight becomes more lethal than a
    // dragging normal fight — makes finishing bosses quickly (DoT/control) the clear
    // efficient path.
    const escalationRate = THREAT_ESCALATION_PER_ROUND * (isBossTier ? THREAT_ESCALATION_BOSS_MULT : 1);
    // SENSORY NULL on the enemy (P0-truth `blocksAdvantage` wiring): its
    // escalation clock is FROZEN — the null blinds it to the fight's momentum.
    const escalation = hasPayloadFlag(state.enemy, 'blocksAdvantage')
        ? 1
        : Math.min(
            THREAT_ESCALATION_MAX,
            1 + escalationRate * Math.max(0, state.round - THREAT_ESCALATION_GRACE + stakeResult.stakeEscalationBonus),
        );
    // Same clock, applied to STATUS intensity instead of raw damage: the
    // longer the fight drags, the harder the enemy's telegraphed status lands
    // too. Derived from `escalation` so it shares its boss-speedup and its
    // cap — no separate ramp to keep in sync.
    const effectIntensityBonus = Math.floor((escalation - 1) / THREAT_EFFECT_ESCALATION_STEP);
    // Enemy-borne outgoing-damage statuses (SEPTIC / REGRESS FATIGUE) dampen its
    // telegraphed hit; OVEREXTENDED halves its next fired phase outright, then is
    // consumed (interim rung of the P2 threat-downgrade ladder).
    const enemyOutgoingMult = getOutgoingDamageMult(state.enemy);
    // WS8.2 telegraph-DAMAGE surface (spec 32 §12 #6): EXHAUSTION's
    // `outgoingThreatDamageMulPct` softens the budgeted hit for its duration.
    const enemyThreatMult = getOutgoingThreatDamageMult(state.enemy);
    const overextendedId = hasPayloadFlag(state.enemy, 'forcesWeakTierNextPlay');
    // DOUBT on the enemy (P0-truth `restrictsSurgeAccess` re-spec): its next fired
    // threat loses its RIDERS (status application + self-heal), then the doubt is
    // consumed — prevention the player can schedule.
    const doubtId = hasPayloadFlag(state.enemy, 'restrictsSurgeAccess');
    // WS8.2 RIDER surface: BLIND's `suppressesThreatRiders` erases the phase's
    // `threatEffectId` for as long as it holds (damage + self-heal still land —
    // narrower than DOUBT, but persistent rather than consumed).
    const riderSuppressId = hasPayloadFlag(state.enemy, 'suppressesThreatRiders');
    const hindered = !act.canAct || denied;
    if (disruptDenied) events.push({ kind: 'disrupt-denied', pips: controlPips });

    let player = state.player;
    let enemy = state.enemy;
    // Phase 33a — hoisted above the effect loop so the loop's swayCleanse
    // hook can mutate the same locals PLEA reads/writes further down.
    let sway = state.sway ?? 0;
    let swayMilestoneWaveringFired = state.swayMilestoneWaveringFired;
    let swayMilestoneFalteringFired = state.swayMilestoneFalteringFired;
    let premises = state.premises ?? 0;
    // Phase 33d (GLYPHS pilot) — hoisted the same way for the same reason:
    // the loop's glyphShatter hook mutates this local.
    let glyphs = state.glyphs ?? [];
    // Profane-canon rework — curse cards this phase's threat shuffles into the
    // player's combat deck cycle (the deck-contamination vector).
    const injectedCurses: string[] = [];
    // GUARD (one-shot, per-phase) absorbs first; BARRIER (persistent, stacking)
    // soaks the remainder; RIPOSTE parries and — spec 32 v3 — counters ONLY when
    // the attack was FULLY blocked (reflect class). All no-op when unset.
    let guard = state.guard ?? 0;
    let barrier = state.barrier ?? 0;
    const riposte = state.riposte ?? null;
    let riposteFired = false;
    let attacksLanded = 0;
    let attacksFullyBlocked = 0;
    // Spec 32 §2 PA-3 — the raw (pre-soak) size of every attack the wall
    // (parry + guard + barrier, combined) brought all the way to 0 this
    // phase. RIPOSTE's counter scales off this, not a flat printed number —
    // "the wall IS the weapon."
    let blockedBlowTotal = 0;
    // Spec 32 §12 #4 — post-soak HP the enemy's threat lands on the player
    // this phase (the `enemyDamageThisTurn` ledger's write site).
    let enemyDamageDealt = 0;
    let directDamage = state.directDamageDealt;
    const penaltiesApplied: CombatThreatEffect[] = [];

    // BACKFIRE (spec 32 v3 T5, engine-gated drip): the enemy takes its
    // backfire-per-rung total × the rungs its action lost this phase (a fully
    // denied action counts every rung).
    const backfirePer = getBackfirePerRung(state.enemy);
    const rungsForBackfire = hindered ? rungsTotal : rungsLost;
    // Phase 32 part 4a (Control — TURNABOUT ledger): accrue the SAME
    // rungs-denied-this-phase quantity BACKFIRE reads above, whether or not
    // BACKFIRE itself is live this combat (a phase with nothing denied
    // contributes 0, so plain accumulation is safe with no extra gating).
    // `turnabout` consumes this later; it only ever grows here.
    const rungsDeniedTotal = (state.rungsDeniedTotal ?? 0) + rungsForBackfire;
    if (backfirePer > 0 && rungsForBackfire > 0) {
        const drip = backfirePer * rungsForBackfire;
        const hit = applyEnemyDamage(enemy, drip, state.round, events);
        enemy = hit.enemy;
        directDamage += drip + hit.clockDamage;
        events.push({ kind: 'backfired', amount: drip, rungs: rungsForBackfire });
    }
    // `the-assize-bell` (E): one bronze syllable per objection sustained —
    // every rung this phase's telegraph lost becomes 2 CHARGES and 4 direct
    // damage. Raw tally add (the CONDEMN check runs on the next
    // `gainPremises`). Card face, THE BIG NUMBERS REWRITE 2026-09-02: "gain
    // 2 CHARGES and deal 4 to the foe" — this hook predates the rewrite's
    // text and was left granting 1 CHARGE with no damage at all; fixed to
    // match the printed numbers, card-face-honesty.
    if (zoneHas(state, 'the-assize-bell') && rungsForBackfire > 0) {
        const bellCharges = rungsForBackfire * 2;
        premises += bellCharges;
        events.push({ kind: 'premise-gained', amount: bellCharges, total: premises });
        const bellDmg = rungsForBackfire * 4;
        const bellHit = applyEnemyDamage(enemy, bellDmg, state.round, events);
        enemy = bellHit.enemy;
        directDamage += bellDmg + bellHit.clockDamage;
        events.push({ kind: 'damage-dealt', cardId: 'the-assize-bell', target: 'enemy', amount: bellDmg });
    }

    // ARMOR (defenseModifier) — flat per-hit reduction of the incoming telegraph,
    // the live home for buff_damage_reduction (Iron Skin), buff_invincibility
    // (Revive Crystal) and buff_phoenix_vigor's guard. Inert until now under the
    // HP model (the aggregator computed `defenseDelta` but no combat path read
    // it). Player-only and clamped ≥0, so no enemy-borne or negative payload can
    // amplify the hit. Applied before parry/guard/barrier soak, like armor.
    const playerArmor = Math.max(0, getActiveEffectModifiers(state.player.effects as ActiveEffect[]).defenseDelta);

    // A lethal BACKFIRE drip (above) can drop the enemy to 0 before it swings —
    // guard the telegraph so an already-defeated enemy does not still hit the
    // player this phase (the victory check runs after this block).
    // ── THE BIG NUMBERS REWRITE — the foe's keywords change this phase's maths ──
    // SWIFT halves what a wall is worth, BRUTAL doubles what gets through,
    // VENOM poisons on contact, RAVENOUS feeds on what it lands, and WOUNDING
    // shoves a curse into the deck when a single blow lands hard enough.
    const foeSwift = hasEnemyKeyword(enemy.keywords, 'swift');
    const foeBrutal = hasEnemyKeyword(enemy.keywords, 'brutal');
    const foeVenom = findEnemyKeyword(enemy.keywords, 'venom')?.n ?? 0;
    const foeRavenous = hasEnemyKeyword(enemy.keywords, 'ravenous');
    const foeWounding = findEnemyKeyword(enemy.keywords, 'wounding')?.n ?? 0;
    // FLURRY N — splits each damage effect into N same-total-budget strikes,
    // each its own damage instance (RIPOSTE's one-shot parry only blunts the
    // first; VENOM/RAVENOUS/WOUNDING riders fire once per landed strike).
    // Non-damage effects (debuffs, heals, riders) are untouched and still
    // fire once. Same doctrine as the player-side DEAL family ("each hit is
    // its own damage instance"), applied to the enemy's own telegraph.
    const foeFlurry = findEnemyKeyword(enemy.keywords, 'flurry')?.n ?? 0;
    const threatEffects = foeFlurry > 1
        ? phase.threatAction.effects.flatMap((eff) => (
            eff.damage && eff.damage > 0 ? splitFlurryDamage(eff.damage, foeFlurry).map((damage) => ({ damage })) : [eff]
        ))
        : phase.threatAction.effects;

    if (!hindered && !isDefeated(enemy)) {
        // The enemy attacks: its telegraphed threat action fires on the player.
        const playerTakenMult = getDamageTakenMultiplier(state.player);
        for (const eff of threatEffects) {
            if (eff.damage && eff.damage > 0) {
                attacksLanded += 1;
                // weakenMult folds soft-control AND partial rung loss.
                let dmg = Math.round(
                    eff.damage * THREAT_DAMAGE_SCALE * weakenMult * escalation
                    * enemyOutgoingMult * enemyThreatMult
                    // THE BIG NUMBERS REWRITE — every STAGE this foe has
                    // entered adds its printed weight to every later phase,
                    // CLAMPED: stage bonuses multiply on top of the escalation
                    // clock (itself up to x2, x1.6 for a boss), and unbounded
                    // they turned a four-stage unique into a one-shot by round
                    // six. A stage should change the shape of a fight, not end
                    // it before the deck can answer.
                    * (1 + Math.min(STAGE_THREAT_BONUS_CAP, state.stageThreatBonus ?? 0))
                    * (overextendedId ? 0.5 : 1) * playerTakenMult
                    // Spec 33 §2 — the open stance check's rail (1 when flag-off,
                    // no check authored, or the player is stance-less).
                    * stanceCheck.mult,
                );
                // Flat armor soak (defenseModifier). buff_invincibility's 99 zeroes
                // any realistic hit; Iron Skin's 5 / phoenix's 1 shave it.
                dmg = Math.max(0, dmg - playerArmor);
                const preSoakDmg = dmg;
                // RIPOSTE parry reduces the incoming hit once this phase.
                if (riposte && !riposteFired && riposte.reduce > 0) {
                    const parried = Math.min(dmg, riposte.reduce);
                    dmg -= parried;
                    riposteFired = true;
                }
                // GUARD soaks first (one-shot, clamped), then BARRIER (persistent).
                // SWIFT (THE BIG NUMBERS REWRITE): a wall counts for HALF against
                // this foe — it absorbs half its face value and is consumed at
                // the full rate, so the wall still helps but stops being the
                // whole answer.
                const soakDivisor = foeSwift ? 2 : 1;
                const guardAbsorbed = Math.min(Math.floor(guard / soakDivisor), dmg);
                guard -= guardAbsorbed * soakDivisor;
                dmg -= guardAbsorbed;
                const barrierAbsorbed = Math.min(Math.floor(barrier / soakDivisor), dmg);
                if (barrierAbsorbed > 0) {
                    barrier -= barrierAbsorbed * soakDivisor;
                    dmg -= barrierAbsorbed;
                    events.push({ kind: 'barrier-absorbed', amount: barrierAbsorbed });
                }
                if (foeSwift && guardAbsorbed + barrierAbsorbed > 0) {
                    events.push({ kind: 'enemy-keyword-fired', enemyId: enemy.id, keyword: 'SWIFT' });
                }
                // BRUTAL: whatever gets past the wall hits harder. Mage Knight's
                // reading is "take it TWICE", which is right at Mage Knight's
                // numbers — doubling a 6 is a lesson. Doubling a late-campaign
                // 150 against walls that top out near 60 is a one-shot the
                // player has no legal answer to, so it lands at +50% here.
                if (foeBrutal && dmg > 0) {
                    dmg = Math.round(dmg * BRUTAL_DAMAGE_MULT);
                    events.push({ kind: 'enemy-keyword-fired', enemyId: enemy.id, keyword: 'BRUTAL', amount: dmg });
                }
                if (dmg > 0) {
                    player = applyDamage(player, dmg);
                    enemyDamageDealt += dmg;
                    // RAVENOUS: it heals for what it lands on you.
                    if (foeRavenous) {
                        const hpBefore = enemy.health;
                        enemy = heal(enemy, dmg);
                        const healed = enemy.health - hpBefore;
                        events.push({ kind: 'enemy-keyword-fired', enemyId: enemy.id, keyword: 'RAVENOUS', amount: healed });
                        if (healed > 0) events.push({ kind: 'enemy-healed', enemyId: enemy.id, source: 'RAVENOUS', amount: healed });
                    }
                    // VENOM: contact poisons. Routed through the same
                    // `applyEffect` path as an authored threat rider, so the
                    // stacking and duration rules are identical.
                    if (foeVenom > 0) {
                        const venomDef = lookupEffectDef('debuff_poison');
                        if (venomDef) {
                            const res = applyEffect(player.effects, venomDef, state.round, {
                                intensityDelta: foeVenom, sourceId: enemy.id,
                            });
                            player = { ...player, effects: res.activeEffects };
                            events.push({ kind: 'enemy-keyword-fired', enemyId: enemy.id, keyword: 'VENOM', amount: foeVenom });
                        }
                    }
                    // WOUNDING: a single blow of N or more puts a WOUND in the
                    // deck (Mage Knight's wounds). Reuses the curse-injection
                    // channel — an unknown id is a silent no-op, per the
                    // resolve-filter law.
                    if (foeWounding > 0 && dmg >= foeWounding && getCard(WOUND_CARD_ID)) {
                        injectedCurses.push(WOUND_CARD_ID);
                        events.push({ kind: 'curse-injected', phaseIndex: phase.index, cardId: WOUND_CARD_ID });
                        events.push({ kind: 'enemy-keyword-fired', enemyId: enemy.id, keyword: 'WOUNDING', amount: dmg });
                    }
                    // WS3.3 'damage-instance' clock, player bearer — a threat
                    // hit that LANDS advances every damage-instance-clocked
                    // DoT the player carries (enemy threat riders land
                    // `debuff_bleed` on the player). Self-costs (RECOIL)
                    // deliberately never advance it — the blood price must
                    // not self-combo with enemy-applied BLEED.
                    const selfClock = fireDotTrigger(player, 'damage-instance', state.round);
                    if (selfClock.damage > 0) {
                        player = selfClock.target;
                        for (const t of selfClock.perEffect) {
                            events.push({ kind: 'dot-tick', effectId: t.effectId, label: t.label, amount: t.amount, target: 'self' });
                        }
                    }
                    // `caltrops-under-the-snow` (D): whatever reaches you
                    // walked the field to do it — every damaging hit the
                    // enemy lands seeds BLEED 8 on the striker. Card face,
                    // THE BIG NUMBERS REWRITE 2026-09-02: "Whenever the foe
                    // deals you damage it gains BLEED 8" — this hook
                    // predates the rewrite's text and was left at BLEED 2;
                    // fixed to match the printed number, card-face-honesty.
                    if (zoneHas(state, 'caltrops-under-the-snow')) {
                        const bleedDef = lookupEffectDef('debuff_bleed');
                        if (bleedDef) {
                            const seeded = applyEffect(enemy.effects, bleedDef, state.round, {
                                intensityDelta: 8, sourceId: 'caltrops-under-the-snow',
                            });
                            enemy = { ...enemy, effects: seeded.activeEffects };
                            events.push({
                                kind: 'effect-landed', cardId: 'caltrops-under-the-snow',
                                effectId: 'debuff_bleed', target: 'enemy', effectKind: 'dot',
                                intensity: seeded.result.activeEffect?.intensity ?? 8, effect: bleedDef,
                            });
                        }
                    }
                }
                else {
                    attacksFullyBlocked += 1;
                    blockedBlowTotal += preSoakDmg;
                    // `caltrops-under-the-snow` (D): the second clause — a
                    // fully blocked attack costs the foe 15. Card face, THE
                    // BIG NUMBERS REWRITE 2026-09-02: "Whenever your GUARD
                    // fully blocks its attack it takes 15 damage" — this
                    // clause had NO engine hook at all until this fix
                    // (card-face-honesty: half the printed card did nothing).
                    if (zoneHas(state, 'caltrops-under-the-snow') && !isDefeated(enemy)) {
                        const hit = applyEnemyDamage(enemy, 15, state.round, events);
                        enemy = hit.enemy;
                        directDamage += 15 + hit.clockDamage;
                        events.push({ kind: 'damage-dealt', cardId: 'caltrops-under-the-snow', target: 'enemy', amount: 15 });
                    }
                }
            }
            if (eff.effectId && !doubtId && riderSuppressId) {
                // WS8.2: the rider is ERASED, honestly logged — the phase still
                // fired, but its `threatEffectId` cannot land while BLIND holds.
                events.push({
                    kind: 'effect-fizzled', cardId: riderSuppressId, effectId: eff.effectId,
                    message: 'threat rider suppressed — information erased',
                });
            }
            if (eff.effectId && !doubtId && !riderSuppressId) {
                const def = lookupEffectDef(eff.effectId);
                if (def) {
                    const res = applyEffect(player.effects, def, state.round, {
                        intensityDelta: (eff.intensity ?? 1) + effectIntensityBonus,
                        durationMode: eff.duration ? 'additive' : 'reset',
                        durationDelta: eff.duration,
                        sourceId: enemy.id,
                    });
                    player = { ...player, effects: res.activeEffects };
                    // `mirror-of-guilt` deliberately does NOT reflect here:
                    // enemy-inflicted debuffs are not "self-debuffs your own
                    // cards land" (owner ruling 2026-07-12, detail-cleanup
                    // follow-up Bucket B #16 — the face is the contract).
                }
            }
            if (eff.enemyHeal && eff.enemyHeal > 0 && !doubtId) {
                // `edict-of-the-open-wound` (D, profane canon): the salve is
                // confiscated — the enemy's healing fails while the writ stands.
                const edicted = zoneHas(state, 'edict-of-the-open-wound');
                const healAmt = edicted ? 0 : Math.round(eff.enemyHeal * getHealingReceivedMult(enemy));
                if (edicted) {
                    events.push({
                        kind: 'effect-fizzled', cardId: 'edict-of-the-open-wound', effectId: '',
                        message: 'the wound stays open — its healing fails',
                    });
                }
                if (healAmt > 0) {
                    const hpBefore = enemy.health;
                    enemy = decayDotsOnHeal(heal(enemy, healAmt)).combatant;
                    const healed = enemy.health - hpBefore;
                    if (healed > 0) events.push({ kind: 'enemy-healed', enemyId: enemy.id, source: 'THREAT', amount: healed });
                }
            }
            if (eff.enemyCleanse && eff.enemyCleanse > 0 && !doubtId) {
                // WS9 reactive cleanse — spec 29 guardrail: telegraphed, and it
                // sheds a FRACTION, never the last affliction. `applyCleanse`
                // names the cleansable set; only the first `enemyCleanse` of it
                // (minus the guaranteed survivor) actually leave the bearer.
                const cleansable = applyCleanse(enemy, 3).removed;
                const strip = Math.min(eff.enemyCleanse, Math.max(0, cleansable.length - 1));
                if (strip > 0) {
                    const gone = new Set(cleansable.slice(0, strip));
                    enemy = { ...enemy, effects: enemy.effects.filter(ae => !gone.has(ae)) };
                    events.push({
                        kind: 'threat-cleansed', phaseIndex: phase.index,
                        effectIds: cleansable.slice(0, strip).map(ae => ae.effectId),
                    });
                }
            }
            // Phase 33a — enemy counterplay against the two alt-win tracks.
            // Flat amount, floored at 0 (never negative, never more-gone-
            // than-exists); milestone flags / premiseMilestoneTotal untouched —
            // only the live counters move.
            if (eff.swayCleanse && eff.swayCleanse > 0 && !doubtId) {
                const before = sway;
                sway = Math.max(0, sway - eff.swayCleanse);
                if (sway < before) {
                    events.push({ kind: 'threat-sway-cleansed', phaseIndex: phase.index, amount: before - sway });
                }
            }
            if (eff.premiseShed && eff.premiseShed > 0 && !doubtId) {
                const before = premises;
                premises = Math.max(0, premises - eff.premiseShed);
                if (premises < before) {
                    events.push({ kind: 'threat-premise-shed', phaseIndex: phase.index, amount: before - premises });
                }
            }
            // Phase 33d (GLYPHS pilot) — enemy counterplay against the
            // GLYPHS zone: destroys the LOWEST-charge glyph (stable
            // first-on-tie, no RNG), mirrors swayCleanse/premiseShed exactly.
            if (eff.glyphShatter && !doubtId && glyphs.length > 0) {
                let lowestIdx = 0;
                for (let i = 1; i < glyphs.length; i++) {
                    if (glyphs[i].charges < glyphs[lowestIdx].charges) lowestIdx = i;
                }
                glyphs = glyphs.filter((_, i) => i !== lowestIdx);
                events.push({ kind: 'glyph-shattered', phaseIndex: phase.index });
            }
            // Profane-canon rework — CURSE INJECTION: the curse joins the
            // player's combat deck cycle (collected here; shuffled into the
            // draw pile at assembly below). Persistent collection untouched;
            // an unknown id is a silent no-op (the resolve-filter law).
            if (eff.curseCardId && !doubtId && getCard(eff.curseCardId)) {
                injectedCurses.push(eff.curseCardId);
                events.push({ kind: 'curse-injected', phaseIndex: phase.index, cardId: eff.curseCardId });
            }
            penaltiesApplied.push(eff);
        }
        // A fired DOUBT / OVEREXTENDED is spent on the phase it bent (consumedOnUse).
        if (doubtId) enemy = consumeEffect(enemy, doubtId);
        if (overextendedId) enemy = consumeEffect(enemy, overextendedId);
        // RIPOSTE counter — spec 32 v3: fires only when your Guard/Barrier FULLY
        // blocked an attack this phase (reflect class, §1 source 4). Spec 32
        // §2 PA-3: the counter reflects the prevented blow's actual size, not
        // a flat printed number — floored at the card's printed `damage` so a
        // card never counters for less than it did before this rework (the
        // wall IS the weapon; bigger threats become bigger paydays).
        if (riposte && attacksLanded > 0 && attacksFullyBlocked > 0) {
            const counter = Math.round(Math.max(riposte.damage, blockedBlowTotal) * getDamageTakenMultiplier(enemy));
            if (counter > 0) {
                const hit = applyEnemyDamage(enemy, counter, state.round, events);
                enemy = hit.enemy;
                directDamage += counter + hit.clockDamage;
                events.push({ kind: 'riposte-fired', amount: counter });
            }
        }
        // THORNS reflect — punishes the swing whenever the enemy attacked.
        const reflect = getThornsReflect(state.player);
        if (reflect > 0 && attacksLanded > 0) {
            const amount = Math.round(reflect * getDamageTakenMultiplier(enemy));
            const hit = applyEnemyDamage(enemy, amount, state.round, events);
            enemy = hit.enemy;
            directDamage += amount + hit.clockDamage;
            events.push({ kind: 'thorns-reflected', amount, target: 'enemy' });
        }
        // The log gets the RESOLVED effects (post-FLURRY-split), not the
        // authored single-number telegraph — a flurry foe's combat log
        // reads as three separate strikes, not one combined number.
        events.push({ kind: 'threat-fired', phaseIndex: phase.index, description: phase.threatAction.description, effects: threatEffects });
        // WS3.2 Doom growth (spec 32 §12 #3, card-local species): enemy-borne
        // `growth: 'per-enemy-action'` DoTs deepen by 1 each time the enemy
        // actually acts — a hindered (denied) turn never feeds the Doom.
        const doomGrowth = growPerEnemyActionDots(enemy);
        if (doomGrowth.grown.length > 0) {
            enemy = doomGrowth.combatant;
            events.push({ kind: 'dots-boosted', intensity: 1, affected: doomGrowth.grown });
        }
    }

    // ── Phase 102 (SUMMON) — the brood bites. DELIBERATELY OUTSIDE the
    // telegraph loop above, and outside its `!hindered` gate:
    //  · bodies act, so staggering or denying the FOE does not silence them;
    //  · the printed bite is the bite — none of the loop's multiplier terms
    //    (escalation, weaken, stage bonus, outgoing/taken mults, the stance
    //    check) touches it, so the number on the chip cannot lie;
    //  · `attacksLanded` / `attacksFullyBlocked` / `blockedBlowTotal` are NOT
    //    incremented, so `lastThreatFullyBlocked`, the authored
    //    'prior-threat-fully-blocked' branch condition, THE COVETED DIE's
    //    'block' payout and RIPOSTE's counter gate all read exactly what they
    //    would read with no brood on the board. The rejected design — a
    //    synthetic entry appended to `threatEffects` — corrupts all four, and
    //    no existing fixture fails when it does;
    //  · `threat-fired` and `penaltiesApplied` keep reporting ONLY the foe's
    //    authored telegraph; the brood gets its own `add-bit` event;
    //  · no RAVENOUS, VENOM, WOUNDING, BRUTAL or RIPOSTE rides on it: the
    //    foe's one protected bar never climbs off a body the player did not
    //    clear, and no curse arrives from a hit the telegraph never printed.
    // The wall DOES answer it (armor -> GUARD -> BARRIER, SWIFT's divisor),
    // which is the second honest line of the design: eat it behind a wall you
    // re-buy every phase, or pay STRIKE_ADD_COST once and be done with it.
    const livingAdds = state.adds ?? [];
    if (livingAdds.length > 0 && !isDefeated(enemy)) {
        const rawBite = livingAdds.reduce((s, a) => s + a.bite, 0);
        if (rawBite > 0) {
            const soaked = soakFlatHit(rawBite, { armor: playerArmor, guard, barrier, swift: foeSwift });
            guard = soaked.guard;
            barrier = soaked.barrier;
            if (soaked.dealt > 0) {
                player = applyDamage(player, soaked.dealt);
                // The ledger DOES count it: the player really took it from the
                // foe's side of the table, and `enemyDamageThisTurn` has to
                // reconcile against actual VITAE lost. This is the one ledger
                // the brood is allowed to touch, and it is a decision on
                // record rather than an omission.
                enemyDamageDealt += soaked.dealt;
            }
            events.push({ kind: 'add-bit', addIds: livingAdds.map(a => a.id), raw: rawBite, dealt: soaked.dealt });
        }
    }

    // Mark: enemy hindered (control worked) → 'clear'; enemy acted → 'overwhelmed'.
    const mark: 'clear' | 'overwhelmed' = hindered ? 'clear' : 'overwhelmed';
    events.push({ kind: 'phase-resolved', phaseIndex: phase.index, mark });

    const result: CombatPhaseResult = {
        phaseIndex: phase.index,
        mark,
        enemyActionFired: hindered ? '' : phase.threatAction.description,
        penaltiesApplied,
    };

    const threatMarks = state.threatMarks.slice();
    if (idx < threatMarks.length) threatMarks[idx] = mark;


    // Boss/unique rung REGROWTH write-back (item 1c): this turn's telegraph
    // lost at least one rung (partial weaken or full denial) → the boss
    // regrows BOSS_RUNG_REGROWTH rungs of resilience for future phases,
    // capped so it can never more than double its natural rung count.
    // Normal/elite enemies (isBossTier false) never accrue this.
    const nextBossRungGrowth = isBossTier && rungsLost > 0
        ? Math.min(bossRungGrowthCap(naturalRungsTotal), rungGrowth + BOSS_RUNG_REGROWTH)
        : rungGrowth;
    if (nextBossRungGrowth > rungGrowth) {
        events.push({ kind: 'rung-regrown', rungs: BOSS_RUNG_REGROWTH, total: nextBossRungGrowth });
    }

    // Profane-canon rework — CURSE INJECTION lands in the deck cycle: each
    // injected curse joins the persistent combat deck list AND the draw pile
    // at an rng-chosen depth (seeded-deterministic; never the persistent
    // collection — the contamination dies with the encounter).
    let contaminatedDeck = state.deck;
    let contaminatedDrawPile = state.drawPile;
    if (injectedCurses.length > 0) {
        contaminatedDeck = [...state.deck, ...injectedCurses];
        contaminatedDrawPile = [...state.drawPile];
        for (const curseId of injectedCurses) {
            const at = Math.floor(rng() * (contaminatedDrawPile.length + 1));
            contaminatedDrawPile.splice(at, 0, curseId);
        }
    }

    let next: CombatEncounterState = {
        ...state,
        player,
        enemy,
        sway,
        swayMilestoneWaveringFired,
        swayMilestoneFalteringFired,
        premises,
        glyphs,
        deck: contaminatedDeck,
        drawPile: contaminatedDrawPile,
        directDamageDealt: directDamage,
        guard: 0,                       // brace is spent on this phase's threat; resets each phase
        barrier,                        // persistent soak — carries the unspent remainder across phases
        riposte: undefined,             // cleared each phase (like guard)
        staggerRungs: 0,                // consumed this phase
        bossRungGrowth: nextBossRungGrowth,
        // Phase 32 part 4a (Control — TURNABOUT ledger): rolled forward every
        // phase; a `turnabout` play zeroes it in the SAME call it reads it.
        rungsDeniedTotal,
        // Spec 32 §12 #4 — the enemy-damage ledger (rolled over between phases)
        // and the full-block verdict (persists until the NEXT threat resolves;
        // a hindered/denied threat was never blocked).
        enemyDamageThisTurn: (state.enemyDamageThisTurn ?? 0) + enemyDamageDealt,
        lastThreatFullyBlocked: !hindered && attacksLanded > 0 && attacksFullyBlocked === attacksLanded,
        phase: 'phase-resolve',
        threatMarks,
        phaseResults: [...state.phaseResults, result],
        // Phase 31 (EA-7) — THE STAKE settlement's payout/penalty + the
        // wager itself clears regardless of outcome. Spec 33 §2: answering a
        // `yields` check pays +1◆ (the read-win bonus, reinterpreted).
        conviction: stanceCheck.yielded
            ? Math.min(CONVICTION_CAP, stakeResult.conviction + 1)
            : stakeResult.conviction,
        floatingDice: stakeResult.floatingDice,
        stake: undefined,
        stakeEscalationBonus: stakeResult.stakeEscalationBonus,
    };
    if (stanceCheck.yielded && next.conviction > stakeResult.conviction) {
        events.push({ kind: 'conviction-gained', amount: 1, total: next.conviction, reason: 'effect' });
    }

    // Phase 33c (spec 33 §1) — THE COVETED DIE: a boss/unique phase authored
    // `stake: true` converts to a temp gold die the moment its telegraph is
    // denied (STAGGER-to-0), fully blocked, or its open stance check is
    // answered with a yield. Resolved AFTER `next` above so the yield's own
    // +1◆ payout composes first. One-time per phase index this combat
    // (`covetedDiceClaimed`) — a repeating/locked final phase can't be farmed
    // on every loop. Priority when more than one condition holds: stagger >
    // block > yield (a single event, never a double-payout for one phase).
    if (isUpgradeableDiceEnabled() && phase.stake && !(state.covetedDiceClaimed ?? []).includes(phase.index)) {
        const method: 'stagger' | 'block' | 'yield' | null =
            rungDenied ? 'stagger'
                : (attacksLanded > 0 && attacksFullyBlocked === attacksLanded) ? 'block'
                    : stanceCheck.yielded ? 'yield'
                        : null;
        if (method) {
            next = { ...next, covetedDiceClaimed: [...(next.covetedDiceClaimed ?? []), phase.index] };
            if (tableHasRoom(next)) {
                const dieId = `${COVETED_DIE_PREFIX}${next.turn}-${next.log.length}`;
                const die: CombatManaDie = {
                    id: dieId, color: 'wild', face: 'mana', state: 'available',
                    temporary: true, floating: true,
                };
                next = { ...next, dice: [...next.dice, die], floatingDice: [...(next.floatingDice ?? []), die] };
                events.push({ kind: 'coveted-die-stolen', phaseIndex: phase.index, method, dieId });
            } else {
                const conviction = Math.min(CONVICTION_CAP, next.conviction + 1);
                next = { ...next, conviction };
                events.push({ kind: 'die-overflowed', source: 'coveted', total: conviction });
                events.push({ kind: 'conviction-gained', amount: 1, total: conviction, reason: 'effect' });
                events.push({ kind: 'coveted-die-stolen', phaseIndex: phase.index, method });
            }
        }
    }

    next = withLog(next, events);

    // Outcome checks after the threat action (HP + capitulation).
    if (swayOffersCapitulation(next)) return offerCapitulation(next, events);
    const outcome = pendingOutcome(next);
    if (outcome) return endCombat(next, outcome, events);

    // Otherwise advance to between-phases.
    return processBetweenPhases(next, rng, events);
}

/** Returns a terminal outcome if one is pending, else null (HP model). */
function pendingOutcome(state: CombatEncounterState): CombatEncounterState['finalOutcome'] {
    if (isDefeated(state.player)) return 'defeat';
    if (isDefeated(state.enemy)) return 'victory';
    return null;
}

/**
 * Between-phases processing (§4.5): DoT ticks erode HP (start+end phase) on both
 * sides, effect durations tick, and the hand refills up to COMBAT_HAND_SIZE
 * (unplayed cards are KEPT — keep-hand rule). Advances the phase pointer
 * (looping the final phase so the enemy keeps attacking).
 */
export function processBetweenPhases(
    state: CombatEncounterState,
    rng: () => number = defaultRng,
    priorEvents: CombatEvent[] = [],
    bonusDraw: number = 0,
): CombatTransition {
    const events: CombatEvent[] = [];
    /** Curses a STAGE shoves into the deck as it opens (THE BIG NUMBERS
     *  REWRITE); shuffled into the draw pile with the rest at assembly. */
    const injectedCursesFromStage: string[] = [];

    // 1. Per-effect DoT ticks (labeled, §7.5) — computed before processing.
    //    Round-threaded so escalating DoTs (POISON ramp) tick their real value.
    const projectedEnemyDotTicks = dotTickBreakdown(state.enemy.effects, state.round);
    const projectedPlayerDotTicks = dotTickBreakdown(state.player.effects, state.round);

    // 2. Process a full round of effects on the enemy — DoT ERODES real enemy HP
    //    (the status damage engine; no track, the HP loss is the win progress).
    const enemyStart = processRoundStartEffects(state.enemy, state.round);
    // `edict-of-the-open-wound` (D, profane canon): the enemy's wounds refuse
    // to close — an EXTRA +1 duration on every calendar-clocked enemy debuff
    // BEFORE the normal end-of-round decrement, so the net calendar movement
    // is zero: DoTs no longer expire while the writ stands. No-calendar
    // effects (DOOM, MARK) need no freezing; BLEED's per-trigger intensity
    // decay survives untouched (decay is not calendar). Side effect kept
    // deliberately: frozen wounds never EXPIRE, so the expiry Soul law goes
    // quiet under the edict — the parish takes its fee.
    let edictTarget = enemyStart.target;
    const tithedExpired: ActiveEffect[] = [];
    if (zoneHas(state, 'edict-of-the-open-wound')) {
        edictTarget = {
            ...edictTarget,
            effects: edictTarget.effects.map(ae => {
                const def = lookupEffectDef(ae.effectId);
                if (ae.remainingDuration === -1 || def?.type !== 'debuff'
                    || def.payload.dotModifiers?.calendarExpiry === false) {
                    return ae;
                }
                return { ...ae, remainingDuration: ae.remainingDuration + 1 };
            }),
        };
    }
    const enemyEnd = processRoundEndEffects(edictTarget, state.round);
    let enemy = enemyEnd.target as Enemy;
    const enemyDotTicks = clampDotTickBreakdown(
        projectedEnemyDotTicks,
        enemyStart.dotDamage + enemyEnd.dotDamage,
    );

    // SOUL economy (spec 32 v3 T7): every enemy affliction instance that
    // EXPIRES yields 1 Soul (consumption-side Souls are granted at the verbs).
    // WS3.2: decay-consumed instances of NO-CALENDAR effects expire BY decay —
    // they owe the same Soul, so Harvest never starves when calendars go.
    const expiredAfflictions = [...enemyEnd.expired, ...tithedExpired]
        .filter(ae => lookupEffectDef(ae.effectId)?.type === 'debuff').length
        + soulWorthyWashouts([...enemyStart.dotWashedOut, ...enemyEnd.washedOut]);

    // `suppurating-curse` (D): the enemy takes bonus HP loss equal to the REAL
    // DAMAGE its DoTs ticked for this round — doubling the deck's total DoT
    // throughput (Erosion late-stage rebalance, 2026-07-08).
    //
    // WI-1 (2026-07-12): post trigger-migration the round-clock pool
    // (`enemyDotTicks`) is empty for POISON (`card-played`) and BLEED
    // (`damage-instance`) — the exact families the curse names — so the old
    // `enemyDotTicks.length > 0` gate made it structurally inert in its own
    // EROSION deck. It now rides the event ticks accumulated across the turn
    // (`enemyDotDamageThisRound`, folded in `withLog`) PLUS any round-clock
    // ticks this round, so the drip equals the round's true DoT total.
    // ── The profane canon's round-end persistent battery (enchant/disenchant
    //    hooks; each is one sentence of engine text, gated by its zone card).
    // `the-untended-garden` (E): end-of-round FESTER 2 — every enemy DoT
    // gains +2 intensity (card face, THE BIG NUMBERS REWRITE 2026-09-02:
    // "FESTER 2: every affliction on the foe gains 2 intensity" — this hook
    // predates the rewrite's text and was left at the old +1; fixed to match
    // the printed number, card-face-honesty).
    if (zoneHas(state, 'the-untended-garden') && !isDefeated(enemy)) {
        const affected: string[] = [];
        enemy = {
            ...enemy,
            effects: enemy.effects.map(ae => {
                const def = lookupEffectDef(ae.effectId);
                if (def?.type === 'debuff' && def.payload.damageOverTime) {
                    affected.push(ae.effectId);
                    return { ...ae, intensity: Math.min(MAX_EFFECT_INTENSITY, ae.intensity + 2) };
                }
                return ae;
            }),
        };
        if (affected.length > 0) events.push({ kind: 'dots-boosted', intensity: 2, affected });
    }
    // `writ-of-attainder` (D): the sentence compounds — a fresh DOOM 3 lands
    // at each round's end onto a stack that already grows as the foe acts
    // (card face, THE BIG NUMBERS REWRITE 2026-09-02: "inflict DOOM 3 on the
    // foe and gain 2 CHARGES" — this hook predates the rewrite's text and was
    // left at the old DOOM 1 with no CHARGES at all; DOOM fixed here, the
    // CHARGES half is added below alongside the other round-end oaths).
    if (zoneHas(state, 'writ-of-attainder') && !isDefeated(enemy)) {
        const doomDef = lookupEffectDef('debuff_creeping_doom');
        if (doomDef) {
            const applied = applyEffect(enemy.effects, doomDef, state.round, {
                intensityDelta: 3, sourceId: 'writ-of-attainder',
            });
            enemy = { ...enemy, effects: applied.activeEffects };
            events.push({
                kind: 'effect-landed', cardId: 'writ-of-attainder', effectId: 'debuff_creeping_doom',
                target: 'enemy', effectKind: 'dot',
                intensity: applied.result.activeEffect?.intensity ?? 3, effect: doomDef,
            });
        }
    }
    // `the-congregation-below` (D): at the close of each round the dead read
    // the minutes into the record — 1 VITAE per 2 cards in the discard pile
    // (card face, THE BIG NUMBERS REWRITE 2026-09-02: "the foe loses 1 VITAE
    // for every 2 cards in your discard pile" — this hook predates the
    // rewrite's text and was left at the old divisor of 3; fixed to match
    // the printed number, card-face-honesty).
    if (zoneHas(state, 'the-congregation-below') && !isDefeated(enemy)) {
        const testimony = Math.min(Math.floor(state.discard.length / 2), enemy.health);
        if (testimony > 0) {
            enemy = applyDamage(enemy, testimony);
            events.push({ kind: 'dot-tick', effectId: 'the-congregation-below', label: 'The Congregation Below', amount: testimony, target: 'enemy' });
        }
    }

    // VULNERABLE DoT surcharge: the natural tick above lands at ×1 (already
    // combo-amplified). Apply the EXTRA (mult-1) fraction the foe's vulnerability
    // adds to its DoT, as one labeled tick so the emitted dot-tick events still
    // sum to the HP that actually left the bar. No-op (and no event) when unmarked.
    const enemyVulnMult = getDamageTakenMultiplier(state.enemy);
    let vulnSurcharge = 0;
    if (enemyVulnMult > 1) {
        const mods = getActiveEffectModifiers(state.enemy.effects, state.round);
        const naturalDot = mods.dotStart + mods.dotEnd;
        vulnSurcharge = Math.min(
            Math.round(naturalDot * (enemyVulnMult - 1)),
            enemy.health,
        );
        if (vulnSurcharge > 0) enemy = applyDamage(enemy, vulnSurcharge);
    }

    // 3. Process a full round of effects on the player (DoT / regen / drain).
    const playerStart = processRoundStartEffects(state.player, state.round);
    const playerEnd = processRoundEndEffects(playerStart.target, state.round, 'player');
    let player = playerEnd.target as Character;
    const playerDotTicks = clampDotTickBreakdown(
        projectedPlayerDotTicks,
        playerStart.dotDamage + playerEnd.dotDamage,
    );

    for (const t of enemyDotTicks) events.push({ kind: 'dot-tick', effectId: t.effectId, label: t.label, amount: t.amount, target: 'enemy' });
    if (vulnSurcharge > 0) events.push({ kind: 'dot-tick', effectId: 'vulnerable-surcharge', label: 'Vulnerable', amount: vulnSurcharge, target: 'enemy' });
    for (const t of playerDotTicks) events.push({ kind: 'dot-tick', effectId: t.effectId, label: t.label, amount: t.amount, target: 'self' });

    // 4. Advance the phase pointer — loop the final phase so the enemy keeps acting.
    //    Phase 3 (rage mode): a candidate phase gated by `unlockAfterRound`
    //    isn't entered until the resolving round reaches it — the pointer
    //    holds at the current (last reachable) phase instead of advancing
    //    past it. Undefined `unlockAfterRound` (every phase before this
    //    epic) is always reachable — byte-identical to the old one-liner.
    const resolvedRound = state.round + 1;

    // THE CLOCK, discrete tier — every THREAT_ENCHANT_CURSE_EVERY_ROUNDS the
    // fight runs, the enemy gains a new passive strength or lays a fresh
    // curse on the player (50/50, seeded). Skipped once the encounter is
    // already over (defeat/victory this round) so a finished fight can't
    // still grant one on its way out.
    if (
        resolvedRound > 0
        && resolvedRound % THREAT_ENCHANT_CURSE_EVERY_ROUNDS === 0
        && !isDefeated(enemy) && !isDefeated(player)
    ) {
        if (rng() < 0.5) {
            const empower = lookupEffectDef('buff_all_stats_up');
            if (empower) {
                const applied = applyEffect(enemy.effects, empower, resolvedRound, {
                    intensityDelta: 1, sourceId: 'threat-clock-empower',
                });
                enemy = { ...enemy, effects: applied.activeEffects };
                events.push({ kind: 'threat-clock-enchant', target: 'enemy', effectId: 'buff_all_stats_up', round: resolvedRound });
            }
        } else {
            const curse = lookupEffectDef('debuff_curse');
            if (curse) {
                const applied = applyEffect(player.effects, curse, resolvedRound, {
                    intensityDelta: 1, sourceId: 'threat-clock-curse',
                });
                player = { ...player, effects: applied.activeEffects };
                events.push({ kind: 'threat-clock-enchant', target: 'player', effectId: 'debuff_curse', round: resolvedRound });
            }
        }
    }

    // ── THE BIG NUMBERS REWRITE — REGROW and STAGES resolve at the boundary ──
    // REGROW: a printed healing floor the player has to out-pace. Applied
    // before the stage check so a stage's own threshold reads the post-heal
    // pool (a foe that heals back over the line does not trip its stage).
    const regrow = findEnemyKeyword(enemy.keywords, 'regrow')?.n ?? 0;
    if (regrow > 0 && !isDefeated(enemy)) {
        const hpBefore = enemy.health;
        enemy = heal(enemy, regrow);
        const healed = enemy.health - hpBefore;
        events.push({ kind: 'enemy-keyword-fired', enemyId: enemy.id, keyword: 'REGROW', amount: healed });
        if (healed > 0) events.push({ kind: 'enemy-healed', enemyId: enemy.id, source: 'REGROW', amount: healed });
    }
    // STAGES: the moment a fight becomes a different fight. Each stage fires at
    // most once; `stagesEntered` is the per-combat ledger. Authored order wins
    // ties, so a boss that crosses two thresholds in one blow enters the first
    // it authored and the second at the next boundary — the beats stay
    // legible instead of collapsing into one line of log.
    const stagesEntered = [...(state.stagesEntered ?? [])];
    let stageThreatBonus = state.stageThreatBonus ?? 0;
    if (!isDefeated(enemy)) {
        const pending = (enemy.stages ?? []).find((stage, i) => {
            if (stagesEntered.includes(i)) return false;
            const byVitae = stage.at.vitaePct !== undefined
                && enemy.maxHealth > 0
                && enemy.health <= stage.at.vitaePct * enemy.maxHealth;
            const byRound = stage.at.round !== undefined && resolvedRound >= stage.at.round;
            return byVitae || byRound;
        });
        if (pending) {
            stagesEntered.push((enemy.stages ?? []).indexOf(pending));
            events.push({ kind: 'stage-entered', enemyId: enemy.id, name: pending.name, text: pending.text });
            if (pending.gain?.length) {
                enemy = { ...enemy, keywords: [...(enemy.keywords ?? []), ...pending.gain] };
                for (const k of pending.gain) {
                    events.push({ kind: 'enemy-keyword-fired', enemyId: enemy.id, keyword: enemyKeywordText(k) });
                }
            }
            if (pending.cleanse) {
                // Everything the player invested in afflicting it is gone. The
                // cruellest stage effect, and the reason a DoT deck needs a
                // payoff before the threshold rather than after it.
                enemy = { ...enemy, effects: [] };
            }
            if (pending.heal !== undefined) {
                const amount = typeof pending.heal === 'number'
                    ? pending.heal
                    : Math.round(pending.heal.pct * enemy.maxHealth);
                if (amount > 0) {
                    const hpBefore = enemy.health;
                    enemy = heal(enemy, amount);
                    const healed = enemy.health - hpBefore;
                    // The stage's heal was invisible: no event, so the bar
                    // jumped and the ledger's "HP lost" silently understated.
                    if (healed > 0) events.push({ kind: 'enemy-healed', enemyId: enemy.id, source: 'STAGE', amount: healed });
                }
            }
            if (pending.threatBonus) stageThreatBonus += pending.threatBonus;
            if (pending.curseCardId && getCard(pending.curseCardId)) {
                injectedCursesFromStage.push(pending.curseCardId);
                events.push({ kind: 'curse-injected', phaseIndex: state.currentPhaseIndex, cardId: pending.curseCardId });
            }
        }
    }

    // ── Phase 102 (SUMMON) — the brood spawns AFTER the stage block, so a
    // stage whose `gain` grants SUMMON fires its own first wave on the very
    // boundary it is entered rather than a phase late. Wave 1 at the FIRST
    // boundary of the combat; every later wave needs a STAGE to fire. NEVER on
    // emptiness: an emptiness check makes the player's own clear cause the
    // respawn, which is a tax rather than a decision — the shape every add
    // fight players resent has in common. A stage's `cleanse` (above) wipes
    // `enemy.effects` and leaves the brood standing: bodies are not
    // afflictions. `spawnAddWave` consumes no RNG, so inserting this between
    // THE CLOCK and the hand refill shifts no seeded draw.
    const summon = findEnemyKeyword(enemy.keywords, 'summon');
    let adds = state.adds ?? [];
    let addWavesSpawned = state.addWavesSpawned ?? 0;
    if (summon && summon.n > 0 && !isDefeated(enemy) && addWavesSpawned < ADD_WAVE_CAP) {
        const stageFiredNow = stagesEntered.length > (state.stagesEntered ?? []).length;
        if (addWavesSpawned === 0 || stageFiredNow) {
            const wave = spawnAddWave(enemy, summon.n, addWavesSpawned, summon.addName ?? `${enemy.name} Brood`);
            adds = [...adds, ...wave];
            addWavesSpawned += 1;
            events.push({
                kind: 'add-spawned',
                enemyId: enemy.id,
                wave: addWavesSpawned,
                addIds: wave.map(a => a.id),
                bite: wave[0].bite,
            });
        }
    }

    const candidateIndex = Math.min(state.currentPhaseIndex + 1, state.threatPhases.length - 1);
    const candidatePhase = state.threatPhases[candidateIndex];
    const rageGated = candidatePhase.unlockAfterRound !== undefined && resolvedRound < candidatePhase.unlockAfterRound;
    const nextIndex = rageGated ? state.currentPhaseIndex : candidateIndex;

    // ARROW PARADOX (spec 32 v3 T5, `lock_stance`) — the next phase keeps the
    // CURRENT stance: motion frozen mid-flight. The lock is revealed and spent.
    // WS8.2 STANCE surface (spec 32 §12 #6): ROOT's `lockedStance` payload is
    // the status twin — while the enemy carries it, every phase advance keeps
    // the current (revealed) stance. Read off the PRE-tick enemy: the lock
    // held when this phase resolved, so it still binds this advance.
    const statusLockId = hasPayloadFlag(state.enemy, 'lockedStance');
    let threatPhases = state.threatPhases;
    let revealedStances = state.revealedStances;
    // WS9 (spec 32 §12 #7) — a branch phase commits its fork at phase START,
    // read from LIVE state (the post-tick enemy + the full-block ledger just
    // written by `resolveThreatPhase`), so the telegraph shows the taken fork
    // alongside the condition. Zero RNG. A looping final phase re-evaluates on
    // every re-entry; the stance-lock / forced-omen overrides below still win
    // over the committed stance.
    const branchCommit = commitThreatBranch(
        threatPhases, nextIndex, enemy, state.lastThreatFullyBlocked ?? false,
    );
    if (branchCommit) {
        threatPhases = branchCommit.phases;
        events.push({
            kind: 'threat-branch', phaseIndex: nextIndex,
            conditionText: branchCommit.conditionText, taken: branchCommit.taken,
        });
    }
    if ((state.stanceLockedNext || statusLockId !== null) && nextIndex !== state.currentPhaseIndex) {
        const lockedStance = currentPhaseStance(state);
        threatPhases = threatPhases.map((p, i) => (i === nextIndex ? { ...p, enemyStance: lockedStance } : p));
        if (!revealedStances.includes(nextIndex)) revealedStances = [...revealedStances, nextIndex];
        events.push({ kind: 'stance-locked', phaseIndex: nextIndex, stance: lockedStance });
    }

    // OMENS resolve at the phase boundary (spec 32 v3 T6, phase 32 part 4d
    // — OMEN v2): a claim that matches the INCOMING phase's stance HITS —
    // its rider fires free, scaled by the claim's `claimScale`. A wider
    // claim (`windowRemaining` > 1) that does NOT match is still pending —
    // it stays in `pendingOmens` with one fewer try, and gets re-checked at
    // every subsequent boundary until it hits or the window reaches 0 (a
    // final MISS — its ante was already spent at cast, never refunded).
    let omenHits = state.omenHits ?? 0;
    let omenState: CombatEncounterState = {
        ...state, player, enemy, threatPhases, revealedStances,
    };
    // Cards an omen rider draws are folded into the boundary refill below —
    // they raise the refill target, so an omen hit nets EXTRA cards on top of
    // the kept hand instead of being capped by pre-refill hand room.
    let omenBonusDraw = 0;
    const pendingOmens = state.pendingOmens ?? [];
    if (pendingOmens.length > 0) {
        const incomingStance = threatPhases[nextIndex]?.enemyStance;
        const remaining: typeof pendingOmens = [];
        for (const omen of pendingOmens) {
            if (incomingStance !== undefined && omen.stance === incomingStance) {
                omenHits += 1;
                const omenCard = lookupCard(omen.cardId);
                const omenMech = (omenCard?.specialMechanics ?? []).find(m => m.kind === 'omen') as
                    Extract<CardSpecialMechanic, { kind: 'omen' }> | undefined;
                if (omenMech) {
                    // A scaled-down hedge rider never rounds all the way to 0
                    // on a REAL hit — the smallest legal payoff is 1 of
                    // whatever unit it prints.
                    const amp = (n: number | undefined): number | undefined =>
                        n === undefined ? undefined : Math.max(1, Math.ceil(n * omen.claimScale));
                    const rider: CardRider = {
                        ...omenMech.rider,
                        guard: amp(omenMech.rider.guard),
                        healHp: amp(omenMech.rider.healHp),
                        drawCards: amp(omenMech.rider.drawCards),
                        sway: amp(omenMech.rider.sway),
                        souls: amp(omenMech.rider.souls),
                        premises: amp(omenMech.rider.premises),
                        applyEffect: omenMech.rider.applyEffect
                            ? { ...omenMech.rider.applyEffect, intensity: amp(omenMech.rider.applyEffect.intensity) }
                            : undefined,
                    };
                    events.push({ kind: 'omen-hit', cardId: omen.cardId, phaseIndex: nextIndex, riderText: riderText(rider) });
                    // drawCards rides the boundary refill (below) — raising
                    // the refill target guarantees the omen's cards land on
                    // top of the kept hand, uncapped by hand room.
                    omenBonusDraw += rider.drawCards ?? 0;
                    omenState = applyRiderToState(
                        omenState, omen.cardId, { ...rider, drawCards: undefined }, events, rng,
                    );
                }
            } else {
                const windowRemaining = omen.windowRemaining - 1;
                events.push({ kind: 'omen-missed', cardId: omen.cardId, phaseIndex: nextIndex, expired: windowRemaining <= 0 });
                if (windowRemaining > 0) remaining.push({ ...omen, windowRemaining });
            }
        }
        omenState = { ...omenState, pendingOmens: remaining };
        // An omen-granted Premise may complete a CONDEMN-grade Peroration.
        if (omenState.finalOutcome === 'concede') {
            return { state: withLog(omenState, events), events: [...priorEvents, ...events] };
        }
    }

    // SOULS from expiry (base law: 1 per expired enemy affliction instance).
    // `choirbone-reliquary`'s per-ending bonus rides inside `gainSouls`.
    if (expiredAfflictions > 0) {
        omenState = gainSouls(omenState, expiredAfflictions, 'expiry', events);
    }
    // `every-stone-an-oath` (E): a bloodless round lays a new course — +12
    // BARRIER and THORNS 4 (2 turns) when the enemy dealt no damage this
    // round (card face, THE BIG NUMBERS REWRITE 2026-09-02: "gain BARRIER 12
    // and THORNS 4 for 2 turns" — this hook predates the rewrite's text and
    // was left at the old +3 BARRIER with no THORNS at all; fixed to match
    // the printed numbers, card-face-honesty).
    if (zoneHas(state, 'every-stone-an-oath') && (state.enemyDamageThisTurn ?? 0) === 0
        && !isDefeated(omenState.player) && !isDefeated(omenState.enemy)) {
        // Silent like the between-phases glyph tick — the growing barrier
        // total is its own visible surface on the combat HUD.
        omenState = { ...omenState, barrier: (omenState.barrier ?? 0) + 12 };
        const thornsDef = lookupEffectDef('buff_thorns');
        if (thornsDef) {
            const applied = applyEffect(omenState.player.effects, thornsDef, state.round, {
                intensityDelta: 4, durationMode: 'additive', durationDelta: 2,
                sourceId: 'every-stone-an-oath',
            });
            omenState = { ...omenState, player: { ...omenState.player, effects: applied.activeEffects } };
            events.push({
                kind: 'effect-landed', cardId: 'every-stone-an-oath', effectId: 'buff_thorns', target: 'self',
                effectKind: 'none', intensity: applied.result.activeEffect?.intensity ?? 4, effect: thornsDef,
            });
        }
    }
    // `writ-of-attainder` (D): the CHARGES half of the round-end tick — DOOM
    // was applied earlier (while `enemy` was still local, above); CHARGES
    // lives here alongside the other round-end oaths so it can bump
    // `omenState.premises` (card face: "inflict DOOM 3 on the foe and gain 2
    // CHARGES" — the CHARGES half never existed until this fix).
    if (zoneHas(state, 'writ-of-attainder') && !isDefeated(omenState.enemy)) {
        omenState = { ...omenState, premises: (omenState.premises ?? 0) + 2 };
        events.push({ kind: 'premise-gained', amount: 2, total: omenState.premises ?? 0 });
    }
    // `the-sworn-second` (Ally, Phase 62 — cards.allies.ts): a recruited
    // retainer answers a blow every round, capped at 3 THORNS stacks so a
    // long fight's standing reflect never runs away (mirrors the
    // grace-momentum cap's shape, below).
    if (zoneHas(state, 'the-sworn-second') && !isDefeated(omenState.player) && !isDefeated(omenState.enemy)) {
        const thornsDef = lookupEffectDef('buff_thorns');
        if (thornsDef) {
            const ALLY_THORNS_CAP = 3;
            const current = omenState.player.effects.find(e => e.effectId === 'buff_thorns');
            if (!current || current.intensity < ALLY_THORNS_CAP) {
                const applied = applyEffect(omenState.player.effects, thornsDef, state.round, {
                    intensityDelta: 1, sourceId: 'the-sworn-second',
                });
                omenState = { ...omenState, player: { ...omenState.player, effects: applied.activeEffects } };
                events.push({
                    kind: 'effect-landed', cardId: 'the-sworn-second', effectId: 'buff_thorns', target: 'self',
                    effectKind: 'none', intensity: applied.result.activeEffect?.intensity ?? 1, effect: thornsDef,
                });
            }
        }
    }
    // `the-long-amen` (D): the held word accrues — the enemy gains PLEA equal
    // to 3 times the Souls you hold, every round's end. Reads the bank, never
    // spends it (the deliberate hold-or-spend tension). Card face, THE BIG
    // NUMBERS REWRITE 2026-09-02: "the foe gains PLEA equal to 3 times the
    // number of Souls you hold" — this hook predates the rewrite's text and
    // was left at a flat 1x; fixed to match the printed multiplier,
    // card-face-honesty.
    if (zoneHas(state, 'the-long-amen') && (omenState.souls ?? 0) > 0 && !isDefeated(omenState.enemy)) {
        omenState = gainSway(omenState, (omenState.souls ?? 0) * 3, events);
    }

    // PLEA decays at the turn boundary (ratified A2).
    let sway = omenState.sway ?? 0;
    if (sway > 0) {
        sway = Math.max(0, sway - SWAY_DECAY_PER_TURN);
        events.push({ kind: 'sway-decayed', total: sway });
    }
    omenState = { ...omenState, sway };

    // Fate Engine P1 R2 — RESERVE dice RIPEN: +1 pip per threat phase survived
    // (cap RESERVE_PIP_CAP). Holding a die through a telegraph is the gamble.
    let reserve = omenState.reserve ?? [];
    if (reserve.length > 0) {
        const ripened = ripenReserve(reserve);
        reserve = ripened.reserve;
        for (const id of ripened.ripenedIds) {
            events.push({ kind: 'die-ripened', dieId: id, pips: reserve.find(d => d.id === id)?.pips ?? 0 });
        }
    }

    // 5. Refill the hand up to COMBAT_HAND_SIZE (keep-hand rule, 2026-07-13):
    //    unplayed cards STAY in hand and occupy draw room, so holding a card
    //    is a real cost — a dead card clogs the hand until it is played or
    //    scrapped. `bonusDraw` lets a caller raise the refill target (no
    //    live caller does today); omen-hit draws raise it too (see
    //    omenBonusDraw). WS2.1 one-use law still holds: an unplayed CONJURED Haunt
    //    leaves the combat ENTIRELY at the boundary — it never enters the
    //    hand-carryover (or the discard pile, where a reshuffle would
    //    resurrect it as a permanent deck card) and its uid is released from
    //    the one-use ledger.
    const conjuredLedger = omenState.conjuredUids ?? [];
    const sweptConjuredUids = omenState.hand
        .filter(h => conjuredLedger.includes(h.uid))
        .map(h => h.uid);
    const keptHand = omenState.hand.filter(h => !conjuredLedger.includes(h.uid));
    const refillTarget = COMBAT_HAND_SIZE + bonusDraw + omenBonusDraw;
    const draw = drawCombatCards(
        omenState.drawPile, omenState.discard, omenState.deck,
        Math.max(0, refillTarget - keptHand.length), rng,
    );
    let uid = state.round * 100;
    const hand = [...keptHand, ...draw.drawn.map(cardId => ({ uid: `c${++uid}`, cardId }))];
    events.push({ kind: 'hand-drawn', cards: draw.drawn });

    // Spec 32 v4 §2.1 — tick the FREE-line TIMED enchant/disenchant zones. Each
    // round the passive was active this round (its hooks fired above via `state`),
    // now `roundsLeft` decrements; an entry that hits 0 ticks out of play. A PAID
    // promotion has already removed the id, so only genuinely temporary instances
    // expire here.
    const tickTimed = (
        zone: { cardId: string; roundsLeft: number }[] | undefined,
        side: 'player' | 'enemy',
    ): { cardId: string; roundsLeft: number }[] => {
        const kept: { cardId: string; roundsLeft: number }[] = [];
        for (const t of zone ?? []) {
            const roundsLeft = t.roundsLeft - 1;
            if (roundsLeft > 0) {
                kept.push({ cardId: t.cardId, roundsLeft });
            } else {
                events.push({ kind: 'enchant-expired', cardId: t.cardId, name: getCardById(t.cardId)?.name ?? t.cardId, side });
            }
        }
        return kept;
    };
    const tickedTempZone = tickTimed(omenState.tempZone, 'player');
    const tickedEnemyTemp = tickTimed(omenState.enemyTempAttachments, 'enemy');
    // Phase 33d (GLYPHS pilot) — every glyph charges +1/round, capped at its
    // own `cap` (a glyph already at cap is a silent no-op — the `ripenReserve`
    // grammar: no event per tick, only crack/shatter/charge-from-a-play log).
    const tickedGlyphs = (omenState.glyphs ?? []).map(g =>
        (g.charges < g.cap ? { ...g, charges: g.charges + 1 } : g));

    let next: CombatEncounterState = {
        ...omenState,
        reserve,
        omenHits,
        stanceLockedNext: false,
        currentPhaseIndex: nextIndex,
        drawPile: draw.drawPile,
        discard: draw.discard,
        hand,
        conjuredUids: conjuredLedger.filter(u => !sweptConjuredUids.includes(u)),
        phase: 'phase-play',
        round: state.round + 1,
        tempZone: tickedTempZone,
        enemyTempAttachments: tickedEnemyTemp,
        glyphs: tickedGlyphs,
        // Spec 32 §12 #4 — the enemy-damage ledger rolls over at the turn
        // boundary: this turn's value becomes last-round's, then resets.
        enemyDamageLastRound: omenState.enemyDamageThisTurn ?? 0,
        enemyDamageThisTurn: 0,
        // New phase → fresh turn; clear the draft so the next startTurn rolls.
        dice: [],
        draftedDieId: null,
        lastRead: 'none',
        carriedDie: null,
        // Gate 0 (round-turn law) — the phase boundary re-arms the one legal
        // tray roll for the incoming phase.
        turnTakenThisPhase: false,
        // THE BIG NUMBERS REWRITE — the STAGE ledgers, and any curse a stage
        // opened with (shuffled into the draw pile alongside the threat's own).
        stagesEntered,
        stageThreatBonus,
        // Phase 102 (SUMMON) — the brood ledgers. Bare function-level locals,
        // exactly like `stagesEntered`: `...omenState` does NOT carry them, and
        // they survive the later `next` rebuilds by spread.
        adds,
        addWavesSpawned,
        ...(injectedCursesFromStage.length > 0
            ? { drawPile: [...draw.drawPile, ...injectedCursesFromStage] }
            : {}),
    };
    next = withLog(next, events);
    // WI-1 — the round is closed: zero the enemy-DoT accumulator AFTER logging
    // (so this round's round-clock/suppuration ticks don't leak into the next
    // round's suppuration read). `startTurn` also resets it in the live game;
    // this covers back-to-back `processBetweenPhases` calls in tests.
    next = { ...next, enemyDotDamageThisRound: 0 };

    // 6. Outcome checks after ticks (HP + capitulation).
    if (swayOffersCapitulation(next)) return offerCapitulation(next, [...priorEvents, ...events]);
    const outcome = pendingOutcome(next);
    if (outcome) return endCombat(next, outcome, [...priorEvents, ...events]);

    // 9. Safety cap — a degenerate stalemate resolves as defeat (couldn't close).
    if (next.round > MAX_PHASES) return endCombat(next, 'defeat', [...priorEvents, ...events]);

    return { state: next, events: [...priorEvents, ...events] };
}

interface DotTick { effectId: string; label: string; amount: number; }
/**
 * Per-effect DoT amounts for the labeled `dot-tick` events. Routes through
 * `getActiveDotTotal` so each emitted amount is the COMBO-AMPLIFIED HP that
 * actually leaves the bar (poison+bleed → Hemorrhage etc.) — the latent honesty
 * bug was recomputing the raw `damagePerRound × intensity` and understating the
 * tick. Byte-identical for un-amplified integer DoTs (floor(x×1) === x).
 */
function dotTickBreakdown(effects: readonly ActiveEffect[], currentRound?: number): DotTick[] {
    // WS3: event-clocked DoTs never tick at the round boundary — drop their
    // ENTRIES (after the full-array amp/MARK pass, matching the aggregator's
    // math exactly) so the emitted round `dot-tick` events sum to the HP that
    // actually left the bar (projection-truth law).
    return getActiveDotTotal(effects as ActiveEffect[], currentRound).perEffect
        .filter(e => {
            const dot = lookupEffectDef(e.effectId)?.payload.damageOverTime;
            return !dot || dotRoundClockPhase(dot) !== null;
        })
        .map(e => ({ effectId: e.effectId, label: e.label, amount: e.amount }));
}

/** Allocate actual HP loss across labeled receipts in stable effect order. */
function clampDotTickBreakdown(ticks: readonly DotTick[], actualDamage: number): DotTick[] {
    let remaining = Math.max(0, actualDamage);
    return ticks.flatMap(tick => {
        const amount = Math.min(tick.amount, remaining);
        remaining -= amount;
        return amount > 0 ? [{ ...tick, amount }] : [];
    });
}

// ── Batch entry point (§9 resolveCombatPhase) ────────────────────────────────

/**
 * Picks the best die to draft from this turn's pool for a card of `cardStance`
 * against `enemyStance`. Under the color law (2026-07-09) only a MATCHING die
 * (exact color or wild) can power the card at all, so matching is the hard
 * requirement: prefer a matching die that also wins the read, then any
 * matching die, then — when nothing matches — a read-winning or first usable
 * die (the turn plays free tops and cashes the rest for tokens). Used by the
 * batch entry + sim to auto-play.
 */
export function chooseDraft(
    dice: readonly CombatManaDie[],
    cardStance: CombatDieColor,
    enemyStance: Stance | null,
): string | null {
    if (dice.length === 0) return null;
    const usable = dice.filter(d => d.state === 'available' && d.color !== 'x' && !d.floating);
    if (usable.length === 0) return dice.find(d => !d.floating)?.id ?? null; // forced X — bank the token
    const matches = usable.filter(d => d.color === 'wild' || d.color === cardStance);
    // `enemyStance === null` ⇒ the player can't see the stance yet (blind play):
    // skip the advantage seek and draft for a color-match instead.
    const winsRead = (d: CombatManaDie): boolean => enemyStance !== null
        && dieHasStance(d.color) && stanceBeats(d.color as Stance, enemyStance);
    const matchAdvantage = matches.find(winsRead);
    if (matchAdvantage) return matchAdvantage.id;
    if (matches.length > 0) return matches[0].id;
    const advantage = usable.find(winsRead);
    if (advantage) return advantage.id;
    return usable[0].id;
}

/** Ensures a usable drafted die exists for a card (starts a turn + drafts if not). */
function ensureDraftForCard(
    state: CombatEncounterState,
    cardStance: CombatDieColor,
    rng: () => number,
): CombatTransition {
    const cur = draftedDie(state);
    if (cur && cur.state === 'available' && cur.color !== 'x') return { state, events: [] };
    let working = state;
    const events: CombatEvent[] = [];
    // Gate 0 (round-turn law) — roll the phase's ONE tray only if it hasn't
    // been rolled yet. Once it has, keep the live tray as-is: a re-roll is
    // illegal, and ending the turn here would wipe floating dice mid-turn
    // (the caller falls back to Reserve/floating power instead).
    if (!working.turnTakenThisPhase) {
        if (working.draftedDieId !== null) working = endTurn(working).state;
        const started = startTurn(working, rng);
        working = started.state; events.push(...started.events);
    }
    if (working.draftedDieId === null) {
        const enemyStance = currentPhaseStance(working);
        const pick = chooseDraft(working.dice, cardStance, enemyStance);
        if (pick) {
            const drafted = draftStanceDie(working, pick);
            working = drafted.state; events.push(...drafted.events);
        }
    }
    return { state: working, events };
}

/**
 * Applies a batch of card plays then resolves the current threat phase — the
 * top-level entry point. Bottom plays auto-manage turns (roll 2, draft the best
 * die) so callers can express a plan as a card list. Plays stop early if an
 * outcome fires mid-batch.
 */
export function resolveCombatPhase(
    state: CombatEncounterState,
    cardsPlayed: CardPlay[],
    rng: () => number = defaultRng,
): CombatTransition {
    let working = state;
    if (working.phase === 'reveal' || working.phase === 'dice-roll') {
        working = rollEncounterDice(working, rng).state;
    }
    const allEvents: CombatEvent[] = [];
    for (const play of cardsPlayed) {
        if (working.phase !== 'phase-play') break;
        let dieId = play.dieId;
        if (play.useBottom) {
            const card = getCard(play.cardId);
            const drafted = ensureDraftForCard(working, card?.stance ?? 'wild', rng);
            working = drafted.state; allEvents.push(...drafted.events);
            // Gate 0 (round-turn law) — the phase's one tray roll may already
            // be spent; a fresh draft cannot be conjured. Fall back to a
            // color-legal Reserve or GHOST die (legal extra power WITHIN
            // the turn — the law caps tray rolls, not card plays).
            if (dieId === undefined) {
                const cur = getDraftedDie(working);
                const stance = card?.stance ?? 'wild';
                const curUsable = cur && cur.state === 'available' && cur.color !== 'x'
                    && (cur.color === 'wild' || cur.color === stance);
                if (!curUsable) {
                    const alt = [
                        ...(working.reserve ?? []),
                        ...working.dice.filter(d => d.floating && d.state === 'available'),
                    ].find(d => d.color === 'wild' || d.color === stance);
                    if (alt) dieId = alt.id;
                }
            }
        }
        const res = playCombatCard(
            working, { uid: play.uid, cardId: play.cardId }, play.useBottom, dieId, rng,
            play.chosenX !== undefined ? { chosenX: play.chosenX } : undefined,
        );
        working = res.state;
        allEvents.push(...res.events);
        if (working.finalOutcome) return { state: working, events: allEvents };
    }
    if (working.phase !== 'phase-play') return { state: working, events: allEvents };
    const resolved = resolveThreatPhase(working, rng);
    return { state: resolved.state, events: [...allEvents, ...resolved.events] };
}

// ── Capitulation + mercy choices ──────────────────────────────────────────────

/** PLEA makes the foe's yield available; only the player can author the end. */
export function selectCapitulationChoice(
    state: CombatEncounterState,
    choice: 'accept' | 'continue',
): CombatTransition {
    if (!state.capitulationChoiceActive) return { state, events: [] };
    const resumed: CombatEncounterState = {
        ...state,
        phase: 'phase-play',
        capitulationChoiceActive: false,
    };
    if (choice === 'accept') return endCombat(resumed, 'capitulate', []);

    const declined: CombatEncounterState = { ...resumed, capitulationDeclined: true };
    const event: CombatEvent = { kind: 'capitulation-declined' };
    return { state: withLog(declined, [event]), events: [event] };
}

// ── Mercy choice (Phase 112 / §3) ────────────────────────────────────────────

/**
 * Resolves the spare/exploit mercy choice opened by Control Saturation or a
 * successful Befriend. `spare` confirms the friendship (mercy) end; `exploit`
 * trades the opening for a heavy strike that may finish the enemy.
 */
export function selectMercyChoice(
    state: CombatEncounterState,
    choice: 'spare' | 'exploit',
): CombatTransition {
    if (!state.mercyChoiceActive) return { state, events: [] };
    if (choice === 'spare') {
        const ended: CombatEncounterState = { ...state, phase: 'complete', finalOutcome: 'mercy', mercyChoiceActive: false };
        const ev: CombatEvent = { kind: 'combat-ended', outcome: 'mercy' };
        return { state: withLog(ended, [ev]), events: [ev] };
    }
    // Exploit — a free heavy strike (Phase 108). Resolve to victory if it kills.
    const strike = Math.max(10, Math.round(state.enemy.maxHealth * 0.5));
    const enemy = applyDamage(state.enemy, strike);
    const events: CombatEvent[] = [
        { kind: 'damage-dealt', cardId: 'mercy-exploit', target: 'enemy', amount: strike },
    ];
    let next: CombatEncounterState = { ...state, enemy, mercyChoiceActive: false, phase: 'phase-play' };
    if (isDefeated(enemy)) {
        return endCombat(withLog(next, events), 'victory', events);
    }
    // Survived the exploit — combat continues from phase-play.
    next = withLog(next, events);
    return { state: next, events };
}

// ── Signature Skills (Spec 26b §4) ───────────────────────────────────────────

/**
 * Casts a signature skill, spending Conviction (◆). Always available regardless
 * of the hand. Fizzles (no-op + event) when underfunded. Can trigger an
 * immediate outcome (e.g. The Stilling saturating the control track).
 */
export function playSignatureSkill(
    state: CombatEncounterState,
    signatureId: string,
    rng: () => number = defaultRng,
): CombatTransition {
    if (state.phase !== 'phase-play') return { state, events: [] };
    const skill = getSignatureSkill(signatureId);
    if (!skill) return { state, events: [] };
    // Spec 33 §4 [owner-locked] — Press Fate's flag-on price is spec-fixed at
    // PRESS_FATE_COST (1◆): the recurring sink of the leaner economy. Every
    // other signature keeps its data cost until D3 derives the new table.
    const v2Reroll = isUpgradeableDiceEnabled() && skill.kind === 'reroll';
    const cost = v2Reroll ? PRESS_FATE_COST : skill.cost;
    if (state.conviction < cost) {
        const events: CombatEvent[] = [{ kind: 'effect-fizzled', cardId: skill.id, effectId: '', message: `need ${cost} ◆ Conviction (have ${state.conviction})` }];
        return { state: withLog(state, events), events };
    }
    if (v2Reroll) {
        // Once per round (§4), and only when a live miss face exists to revive
        // (cracked dice are excluded — their miss is a stated consequence).
        if (state.pressFateRound === state.round) {
            const events: CombatEvent[] = [{ kind: 'effect-fizzled', cardId: skill.id, effectId: '', message: 'fate already pressed this round' }];
            return { state: withLog(state, events), events };
        }
        const cracked = crackedColorsForTurn(state, state.turn);
        if (!state.dice.some(d => d.face === 'miss' && !d.floating && !cracked.has(d.color))) {
            const events: CombatEvent[] = [{ kind: 'effect-fizzled', cardId: skill.id, effectId: '', message: 'no miss faces to re-roll' }];
            return { state: withLog(state, events), events };
        }
    }
    // Press Fate with no used/blocked dice to re-roll is a no-op — don't burn ◆.
    if (!v2Reroll && skill.kind === 'reroll' && !hasRerollableDice(state.dice)) {
        const events: CombatEvent[] = [{ kind: 'effect-fizzled', cardId: skill.id, effectId: '', message: 'no spent or blocked (X) dice to re-roll' }];
        return { state: withLog(state, events), events };
    }

    const spent: CombatEncounterState = { ...state, conviction: state.conviction - cost };
    const applied = applySignatureSkill(spent, skill, rng);
    const events: CombatEvent[] = [
        { kind: 'signature-cast', signatureId: skill.id, name: skill.name, cost },
        ...applied.events,
    ];
    const next = withLog(applied.state, events);
    return checkImmediateOutcome(next, events);
}

/**
 * Phase 33d (GLYPHS pilot) — crack a live glyph: resolves its payload at its
 * current `charges` (poison → `applyEffect`, the same executor
 * `CardRider.applyEffect`/a card's `combatEffects` already call; barrier →
 * the same direct `state.barrier` addition `CardRider.barrier`/the `barrier`
 * mechanic already use — no new damage/status math), removes the glyph, and
 * emits `glyph-cracked`. Dieless (the die was paid at inscription) — legal
 * only in `phase-play`, mirroring `playSignatureSkill`'s guard shape. A
 * nonexistent `glyphId`, or a call outside `phase-play`, is a silent no-op
 * (no state change, no events) — the same no-op shape `playSignatureSkill`
 * uses for an unrecognized signature id.
 */
export function crackGlyph(
    state: CombatEncounterState,
    glyphId: string,
    _rng: () => number = defaultRng,
): CombatTransition {
    if (state.phase !== 'phase-play') return { state, events: [] };
    const glyph = (state.glyphs ?? []).find(g => g.id === glyphId);
    if (!glyph) return { state, events: [] };

    const events: CombatEvent[] = [];
    let enemy = state.enemy;
    let barrier = state.barrier ?? 0;

    if (glyph.payload.kind === 'poison') {
        const def = lookupEffectDef('debuff_poison');
        if (def) {
            const intensity = glyph.payload.baseIntensity + glyph.charges;
            const applied = applyEffect(enemy.effects, def, state.round, {
                intensityDelta: intensity,
                durationMode: 'additive',
                durationDelta: glyph.payload.duration,
                sourceId: glyph.cardId,
            });
            enemy = { ...enemy, effects: applied.activeEffects };
            if (applied.result.activeEffect) {
                events.push({
                    kind: 'effect-landed', cardId: glyph.cardId, effectId: def.id, target: 'enemy',
                    effectKind: 'dot', intensity: applied.result.activeEffect.intensity, effect: def,
                });
            }
        }
    } else {
        barrier += glyph.payload.baseAmount + glyph.charges;
    }

    let next: CombatEncounterState = {
        ...state,
        enemy,
        barrier,
        glyphs: (state.glyphs ?? []).filter(g => g.id !== glyphId),
    };
    events.push({ kind: 'glyph-cracked', glyphId, cardId: glyph.cardId, charges: glyph.charges });
    next = withLog(next, events);
    return checkImmediateOutcome(next, events);
}

/**
 * Phase 102 (SUMMON) — strike one add off the board. Dieless and PRICED: the
 * phase gate and the Conviction debit are `playSignatureSkill`'s shape, NOT
 * `crackGlyph`'s — `crackGlyph` deliberately spends nothing because its die
 * was already paid at inscription, whereas a free, mandatory, repeating tap is
 * the canonical resented add shape. The no-op / `withLog` /
 * `checkImmediateOutcome` tail IS `crackGlyph`'s.
 *
 * Three outcomes, deliberately distinct:
 *  · wrong phase, or an id that names no living add → a SILENT identity no-op
 *    returning the SAME object reference (asserted with `toBe`, the Seal
 *    convention), so a stale tap from the UI can never churn the log;
 *  · a Conviction shortfall → one `effect-fizzled` event that DOES reach the
 *    log, so the player's refused action stays attributable rather than
 *    reading as a dead chip;
 *  · success → exactly one add removed and `add-struck` emitted.
 *
 * It can never end a fight: `checkImmediateOutcome` reads `state.enemy` alone,
 * so clearing the whole brood is progress with no win attached. No
 * `swayOffersCapitulation` check either — the verb pushes no SWAY, matching
 * `crackGlyph`'s tail rather than `playCombatCard`'s.
 */
export function strikeAdd(
    state: CombatEncounterState,
    addId: string,
    _rng: () => number = defaultRng,
): CombatTransition {
    if (state.phase !== 'phase-play') return { state, events: [] };
    const add = (state.adds ?? []).find(a => a.id === addId);
    if (!add) return { state, events: [] };
    if (state.conviction < STRIKE_ADD_COST) {
        const events: CombatEvent[] = [{
            kind: 'effect-fizzled',
            cardId: add.id,
            effectId: '',
            message: `need ${STRIKE_ADD_COST} ◆ Conviction (have ${state.conviction})`,
        }];
        return { state: withLog(state, events), events };
    }
    const events: CombatEvent[] = [
        { kind: 'add-struck', addId: add.id, name: add.name, cost: STRIKE_ADD_COST },
    ];
    let next: CombatEncounterState = {
        ...state,
        conviction: state.conviction - STRIKE_ADD_COST,
        adds: (state.adds ?? []).filter(a => a.id !== addId),
    };
    next = withLog(next, events);
    return checkImmediateOutcome(next, events);
}

/** The baseline signature kit (for the presenter / UI bar). */
export { SIGNATURE_SKILLS, SIGNATURE_SKILL_LIST, getSignatureSkill } from './combat.signature';

// ── Summary (§7.7) ───────────────────────────────────────────────────────────

export { buildCombatSummary } from './combat.attribution';

// ── Convenience selectors for the presenter ──────────────────────────────────

/** Cards in hand, projected to their views (for the UI hand display, §7.3). */
export function handCards(state: CombatEncounterState): Array<{ uid: string; card: CombatCard }> {
    return state.hand
        .map(h => ({ uid: h.uid, card: getCard(h.cardId) }))
        .filter((x): x is { uid: string; card: CombatCard } => x.card !== null);
}

/**
 * Advantage-read preview for a card against the current phase (RPS indicator,
 * spec 25 §4.8 / §7.3) — the state-curried wrapper over the legacy classifier
 * `resolveCardDieCost`. It owns the READ surface only: the `advantage` label
 * for a hand renderer (today's sole consumer is the mechanics CLI). The `cost`
 * field is historical — play legality and the real die COST are owned by
 * THE COLOR LAW inside `playCombatCard`. Deprecated on the public barrels
 * alongside `resolveCardDieCost`.
 */
export function cardDieCostPreview(state: CombatEncounterState, card: CombatCard): CardDieCost {
    return resolveCardDieCost(card.stance, currentPhaseStance(state));
}

/** Count of available (non-X) dice — surfaced for the dice board (§7.4). */
export function availableDice(state: CombatEncounterState): number {
    return availableDieCount(state.dice);
}

// ── Spec 26b — presenter selectors (the engine owns truth; the UI hides) ─────

/** The drafted stance die this turn (or null before a draft / between turns). */
export function getDraftedDie(state: CombatEncounterState): CombatManaDie | null {
    return draftedDie(state);
}

/**
 * WS8.2 STANCE surface (spec 32 §12 #6) — true while the PLAYER carries a
 * `blursStanceHints` effect (enemy-inflicted CONFUSION): stance certainty is
 * fogged, so every revealed stance reads as hidden again for the blur's
 * duration (the underlying `revealedStances` knowledge survives and returns
 * when it expires). The readout layer consumes this directly — mobile should
 * render the stance panel / threat tells blurred while it is true.
 */
export function isStanceReadoutBlurred(state: CombatEncounterState): boolean {
    return hasPayloadFlag(state.player, 'blursStanceHints') !== null;
}

/** True when the player has revealed a given phase's hidden enemy stance (§2).
 *  A MARKED foe (`revealsStance` payload — Fate Engine P1) is public on EVERY
 *  phase while the mark holds. WS8.2: a stance BLUR on the player fogs every
 *  reveal (including the mark's) while it lasts. */
export function isPhaseStanceRevealed(state: CombatEncounterState, phaseIndex: number): boolean {
    if (isStanceReadoutBlurred(state)) return false;
    return state.revealedStances.includes(phaseIndex)
        || hasPayloadFlag(state.enemy, 'revealsStance') !== null;
}

/** The current phase's enemy stance IF revealed, else null (drives the "?" UI). */
export function revealedCurrentStance(state: CombatEncounterState): Stance | null {
    const idx = Math.min(state.currentPhaseIndex, state.threatPhases.length - 1);
    return isPhaseStanceRevealed(state, idx) ? currentPhaseStance(state) : null;
}

/**
 * Read preview for a card if the player powers it with the currently drafted die
 * (advantage/neutral/disadvantage/none + whether the colors match). Null when no
 * die is drafted yet.
 */
export function cardReadPreview(state: CombatEncounterState, card: CombatCard): { read: CombatReadResult; colorMatch: boolean } | null {
    const d = draftedDie(state);
    if (!d) return null;
    return { read: state.lastRead, colorMatch: d.color === 'wild' || d.color === card.stance };
}

/**
 * UI preview (spec 32 v3): there is NO immediate-strike number any more — the
 * strike is dead. `amount` is always 0; the card's honest numbers live in its
 * printed FREE/PAID text and the DoT lifetime preview. Kept for the mobile
 * presenter contract.
 */
export function projectCardImpact(
    _state: CombatEncounterState,
    card: CombatCard,
): { track: 'dot' | 'control' | 'none'; amount: number } {
    return { track: card.effectKind, amount: 0 };
}

/**
 * Spec 32 v3 §5 — the floating-die colors to WRITE BACK to the character save
 * at combat end (they persist across combats until spent). Phase 31 —
 * excludes `temporary` floats (the momentum wheel's granted die): momentum
 * never survives past the fight it was earned in, owner-ratified 2026-07-10.
 */
export function getFloatingDiceColors(
    state: CombatEncounterState,
): ('heart' | 'body' | 'mind' | 'wild')[] {
    return (state.floatingDice ?? [])
        .filter(d => !d.temporary)
        .map(d => d.color)
        .filter((c): c is 'heart' | 'body' | 'mind' | 'wild' => c !== 'x');
}

// ── 0.34.0 status-depth epic — honesty selectors (the engine owns the rule) ──

/** VULNERABLE — the foe's live incoming-damage multiplier (×1 when unmarked).
 *  Mobile reads the real "+X% damage" off this; never hard-codes it. */
export function getEnemyIncomingDamageMultiplier(state: CombatEncounterState): number {
    return getDamageTakenMultiplier(state.enemy);
}

/**
 * DISRUPT meter (the engine owns the threshold; mobile must NOT hard-code it):
 * the live DISTINCT-control pip count, the deny threshold, the cumulative roll
 * penalty, and whether the next telegraphed turn WILL be denied (matching the
 * resolved phase mark === 'clear': hard skip, legacy roll-penalty deny, the
 * additive distinct-control deny, OR a STAGGER-rung deny — phase 28 fix: this
 * used to omit the rung path entirely, so a turn denied purely by accumulated
 * STAGGER reported `willDeny: false`).
 */
export function getDisruptMeter(state: CombatEncounterState): {
    pips: number; threshold: number; rollPenalty: number; willDeny: boolean;
} {
    const enemy = state.enemy;
    const pips = getDistinctControlCount(enemy);
    const rollPenalty = Math.max(0, -getActiveRollModifier(enemy));
    const act = canAct(enemy.effects as ActiveEffect[], currentPhaseStance(state));
    const { rungDenied } = computeRungDenial(state);
    const willDeny = !act.canAct || rollPenalty >= THREAT_DENY_AT || pips >= DISRUPT_DENY_AT || rungDenied;
    return { pips, threshold: DISRUPT_DENY_AT, rollPenalty, willDeny };
}

/**
 * RUPTURE projection — the live amplified detonate total a rupture card would
 * deal RIGHT NOW (pending DoT × read × vulnerable, capped). For the card glow.
 * Uses bonusPct 0 (the per-card bonus is added on top in `playBottomAction`).
 */
export function projectRupture(state: CombatEncounterState): number {
    const d = draftedDie(state);
    const read: CombatReadResult = d ? state.lastRead : 'neutral';
    const pending = getPendingDotTotal(state.enemy, state.round).total;
    return Math.min(
        ruptureBurstCap(state.enemy.maxHealth),
        Math.round(pending * READ_DAMAGE_MULT[read] * getDamageTakenMultiplier(state.enemy)),
    );
}

/**
 * Chosen-X range for a card carrying a `recoil_x` mechanic (WS7.2): the engine
 * owns the clamp rule — X ∈ [min, affordable] where affordable = the player's
 * live HP − 1, floored at min (the printed minimum is unavoidable, like plain
 * RECOIL). Null when the card carries no chosen-X mechanic. Presenters and sim
 * policies read this instead of hard-coding the rule.
 */
export function recoilXRange(
    state: CombatEncounterState,
    card: Pick<CombatCard, 'id'>,
): { min: number; max: number } | null {
    const sourceCard = lookupCard(card.id);
    const mech = (sourceCard?.specialMechanics ?? []).find(m => m.kind === 'recoil_x') as
        Extract<CardSpecialMechanic, { kind: 'recoil_x' }> | undefined;
    if (!mech) return null;
    return { min: mech.min, max: Math.max(mech.min, state.player.health - 1) };
}

/**
 * Per-card RUPTURE projection (phase 28) — `projectRupture` above uses
 * `bonusPct 0` (the per-card bonus is applied separately in
 * `playBottomAction`), which undershoots any card with its own `bonusPct` or
 * `fuelPerPip` (`resonance-detonation`, `the-overtake`, others). Mirrors the
 * `projectSiphonHeal` convention: look up the card's own mechanic and scale
 * accordingly. `fuelPerPip` fuel is approximated off *currently banked*
 * Reserve + floating pips (a preview can't know a not-yet-drafted die's
 * hypothetical spend) — the "if you cashed in everything banked right now"
 * reading. Falls back to the flat `projectRupture(state)` for cards with no
 * card-specific rupture mechanic.
 */
export function projectRuptureBurst(state: CombatEncounterState, card: CombatCard): number {
    const sourceCard = lookupCard(card.id);
    const mech = (sourceCard?.specialMechanics ?? []).find(m => m.kind === 'rupture') as
        Extract<CardSpecialMechanic, { kind: 'rupture' }> | undefined;
    if (!mech) return projectRupture(state);
    const d = draftedDie(state);
    const read: CombatReadResult = d ? state.lastRead : 'neutral';
    const pending = getPendingDotTotal(state.enemy, state.round).total;
    const nonDotStacks = consumeAfflictions(state.enemy).nonDotStacks;
    const bankedPips = (state.reserve ?? []).reduce((n, die) => n + (die.pips ?? 0), 0)
        + (state.floatingDice ?? []).reduce((n, die) => n + (die.pips ?? 0), 0);
    const fuel = pending
        + RUPTURE_PER_AFFLICTION_STACK * nonDotStacks
        + (mech.fuelPerPip ?? 0) * bankedPips
        + (mech.fuelPerOmenHit ?? 0) * (state.omenHits ?? 0);
    return Math.min(
        ruptureBurstCap(state.enemy.maxHealth),
        Math.round(fuel * READ_DAMAGE_MULT[read] * (1 + (mech.bonusPct ?? 0)) * getDamageTakenMultiplier(state.enemy)),
    );
}

/** SIPHON projection — the heal a siphon card would grant if powered now (off
 *  the projected payoff burst). */
export function projectSiphonHeal(state: CombatEncounterState, card: CombatCard): number {
    const sourceCard = lookupCard(card.id);
    const mech = (sourceCard?.specialMechanics ?? []).find(m => m.kind === 'siphon') as
        { kind: 'siphon'; pct: number } | undefined;
    if (!mech) return 0;
    return Math.round(projectRupture(state) * mech.pct * getHealingReceivedMult(state.player));
}

/** REAP-ALL projection — the burst the Harvest capstone would deal right now. */
export function projectReapAll(state: CombatEncounterState, card: CombatCard): { ready: boolean; amount: number } {
    const sourceCard = lookupCard(card.id);
    const mech = (sourceCard?.specialMechanics ?? []).find(m => m.kind === 'reap_all') as
        Extract<CardSpecialMechanic, { kind: 'reap_all' }> | undefined;
    if (!mech) return { ready: false, amount: 0 };
    const d = draftedDie(state);
    const read: CombatReadResult = d ? state.lastRead : 'neutral';
    // UNCAPPED (spec 32 §12 item 5) — the ALL-spender's price is its emptied bank.
    const amount = Math.round(mech.burstPerSoul * (state.souls ?? 0) * READ_DAMAGE_MULT[read] * getDamageTakenMultiplier(state.enemy));
    return { ready: amount > 0, amount };
}

/**
 * Wall-math projection (phase 28 / Gate 1 §4) — what the CURRENTLY
 * telegraphed hit would actually deal right now, netted against live
 * guard/barrier. `IntentIcon` today shows only the raw, unscaled
 * `phase.threatAction.effects` damage sum; this selector runs that same raw
 * total through the live `weakenMult` / rung / escalation / outgoing-damage
 * multiplier stack `resolveThreatPhase` applies, then nets guard/barrier —
 * the actual number the player is about to take, or 0 if the turn will be
 * denied outright. Approximates a phase's damage as a single hit (matching
 * `intentVM`'s existing raw-sum granularity) — a phase with more than one
 * damaging effect is summed before scaling, not scaled per-effect like the
 * real resolution; a known, documented simplification (see phase 28 brief).
 *
 * KNOWN DIVERGENCES from `resolveThreatPhase`, documented rather than closed —
 * closing them moves the on-screen number for every existing foe and is its own
 * tuning change, not a side effect of adding a keyword. The boss term here
 * omits `enemyThreatMult` (`getOutgoingThreatDamageMult`),
 * `state.stageThreatBonus`, BRUTAL, and — while the Upgradeable-Dice flag is
 * on — an authored phase's `stanceCheck.mult`, so against a staged, BRUTAL or
 * stance-punished foe it UNDERSTATES, and the wall it reports as left over
 * after the telegraph is correspondingly optimistic.
 *
 * Audit 3.2: the flat `playerArmor` soak and the SWIFT soak divisor were on
 * that list and are no longer — both terms now run through the same
 * `soakFlatHit` the engine applies. So the leftover wall handed to the Phase
 * 102 add term, and therefore `addNetDamage` and `totalNetDamage`, are EXACT
 * for a single-damaging-effect telegraph from an unstaged foe with no
 * outgoing-threat-damage rider and no firing stance check. They remain
 * APPROXIMATE — strictly closer than before, not closed — for a staged foe,
 * a foe carrying `getOutgoingThreatDamageMult !== 1`, a multi-effect or FLURRY
 * phase (the engine soaks per effect, this projection soaks the sum once), and
 * a flag-on `stanceCheck`. `summon.engine.test.ts`'s wall matrix pins the exact
 * case and names those preconditions as its construction.
 */
export function projectIncomingThreat(state: CombatEncounterState): {
    rawDamage: number; projectedDamage: number; willDeny: boolean; guard: number; barrier: number; netDamage: number;
    /** Phase 33b — the current phase's live STAGGER-rung total/lost, so the
     *  presenter can show rung magnitude (1-4) instead of leaving it
     *  invisible. `rungsTotal` reflects any authored `phase.rungs` override. */
    rungsTotal: number; rungsLost: number;
    /** Phase 102 (SUMMON) — the brood's printed bite total, and what survives
     *  the SAME `soakFlatHit` the engine applies, against the wall that is left
     *  after the foe's own telegraph has eaten its share. `netDamage`
     *  deliberately EXCLUDES the add term so `projectEnemyHealPerRound`'s
     *  RAVENOUS estimate keeps reading the foe's own telegraph alone (a
     *  RAVENOUS summoner's bar must never appear to climb off its brood); the
     *  HUD wall-math readout reads `totalNetDamage`. */
    addDamage: number; addNetDamage: number; totalNetDamage: number;
} {
    const idx = Math.min(state.currentPhaseIndex, state.threatPhases.length - 1);
    const phase = state.threatPhases[idx];
    const rawDamage = phase.threatAction.effects.reduce((s, e) => s + (e.damage ?? 0), 0);

    const act = canAct(state.enemy.effects as ActiveEffect[], phase.enemyStance);
    const rollPenalty = Math.max(0, -getActiveRollModifier(state.enemy));
    const controlPips = getDistinctControlCount(state.enemy);
    const disruptDenied = controlPips >= DISRUPT_DENY_AT;
    const isBossTier = state.enemy.difficulty === 'boss' || state.enemy.difficulty === 'unique';
    const { rungsTotal, rungsLost, rungDenied } = computeRungDenial(state);
    const denied = rollPenalty >= THREAT_DENY_AT || disruptDenied || rungDenied;
    const willDeny = !act.canAct || denied;

    const rungMult = rungDenied ? 0 : (rungsTotal - rungsLost) / rungsTotal;
    const weakenMult = Math.max(THREAT_WEAKEN_FLOOR, Math.min(1, 1 - rollPenalty * THREAT_WEAKEN_PER_ROLL))
        * (rungsLost > 0 && !rungDenied ? rungMult : 1);
    const escalationRate = THREAT_ESCALATION_PER_ROUND * (isBossTier ? THREAT_ESCALATION_BOSS_MULT : 1);
    const escalation = hasPayloadFlag(state.enemy, 'blocksAdvantage')
        ? 1
        : Math.min(THREAT_ESCALATION_MAX, 1 + escalationRate * Math.max(0, state.round - THREAT_ESCALATION_GRACE));
    const enemyOutgoingMult = getOutgoingDamageMult(state.enemy);
    const overextendedId = hasPayloadFlag(state.enemy, 'forcesWeakTierNextPlay');
    const playerTakenMult = getDamageTakenMultiplier(state.player);

    const projectedDamage = willDeny ? 0 : Math.round(
        rawDamage * THREAT_DAMAGE_SCALE * weakenMult * escalation
        * enemyOutgoingMult * (overextendedId ? 0.5 : 1) * playerTakenMult,
    );

    const guard = state.guard ?? 0;
    const barrier = state.barrier ?? 0;
    const riposte = state.riposte ?? null;
    const playerArmor = Math.max(0, getActiveEffectModifiers(state.player.effects as ActiveEffect[]).defenseDelta);
    const foeSwift = hasEnemyKeyword(state.enemy.keywords, 'swift');
    let remaining = projectedDamage;
    if (riposte && riposte.reduce > 0) remaining = Math.max(0, remaining - riposte.reduce);
    // Audit 3.2 — the foe's own hit goes through the SAME `soakFlatHit` the
    // engine applies, so this function no longer keeps a second, divergent
    // inline copy of the wall arithmetic. The copy that stood here dropped both
    // the SWIFT divisor and the flat armor soak, which OVERSTATED the leftover
    // wall handed to the add term below and so UNDER-reported `addNetDamage` —
    // measured wrong in 35 of 324 wall cells, and the printed HUD total wrong
    // in 112. RIPOSTE stays outside the helper (a one-shot parry on the foe's
    // own swing, deliberately excluded there); applying it before armor is
    // arithmetically identical to the engine's armor-then-riposte order, since
    // both reduce to `max(0, d - armor - reduce)` over non-negative terms.
    //
    // The absorption stays an explicit soak rather than `Math.max(0, remaining
    // - x)` because Phase 102's add term needs the wall that SURVIVES the foe's
    // own hit, and deriving it from `projectedDamage - remaining` would wrongly
    // charge riposte's parry and barrier's share against GUARD.
    const soaked = soakFlatHit(remaining, { armor: playerArmor, guard, barrier, swift: foeSwift });
    remaining = soaked.dealt;

    // Phase 102 (SUMMON) — the brood, through the same helper
    // `resolveThreatPhase` uses, so the printed wall math and the applied wall
    // math are one definition. NOT zeroed by `willDeny`: denying the FOE does
    // not deny its brood, and a telegraph reading 0 while the adds bit would be
    // the worst class of lie this selector can tell.
    const addDamage = (state.adds ?? []).reduce((s, a) => s + a.bite, 0);
    const addNetDamage = addDamage > 0
        ? soakFlatHit(addDamage, {
            armor: playerArmor,
            guard: soaked.guard,
            barrier: soaked.barrier,
            swift: foeSwift,
        }).dealt
        : 0;

    return {
        rawDamage, projectedDamage, willDeny, guard, barrier, netDamage: remaining, rungsTotal, rungsLost,
        addDamage, addNetDamage, totalNetDamage: remaining + addNetDamage,
    };
}

/** One hand card's finisher (rupture / reap) readiness, for
 *  `projectCombatOutcome`. */
export interface FinisherProjection {
    uid: string;
    cardId: string;
    mechanic: 'rupture' | 'reap';
    ready: boolean;
    amount: number;
}

/** The consolidated status kill-path readout (spec 30, build-plan phase 2):
 *  pending DoT, whether it alone kills the foe and in how many rounds, and
 *  which hand cards are ready to detonate the stack right now. Pure selector
 *  no `CombatEvent`, no state mutation; call it on demand from a presenter. */
export interface CombatOutcomeProjection {
    pendingDot: number;
    roundsToKill: number | null;
    isLethalInFlight: boolean;
    finishers: FinisherProjection[];
    /** The VITAE the foe is expected to recover per round boundary (REGROW's
     *  printed floor plus a RAVENOUS foe's projected drain off the current
     *  telegraph). `roundsToKill` is already netted against it; surfaced so
     *  the meter can say WHY the stack is not lethal. */
    healPerRound: number;
}

/**
 * Playtest fix 2026-09-04 — the projection used to be blind to healing: a
 * RAVENOUS Brine Hag read "LETHAL IN 3" every round while its bar climbed.
 * REGROW is the printed number; RAVENOUS is estimated as what the CURRENT
 * telegraph would net through the player's live GUARD/BARRIER (the same
 * figure the intent icon shows), which is exactly what it will heal for if
 * nothing changes. A projection, not a promise: guarding harder shrinks it.
 */
export function projectEnemyHealPerRound(state: CombatEncounterState): number {
    const regrow = findEnemyKeyword(state.enemy.keywords, 'regrow')?.n ?? 0;
    const ravenous = hasEnemyKeyword(state.enemy.keywords, 'ravenous')
        ? projectIncomingThreat(state).netDamage
        : 0;
    return regrow + ravenous;
}

export function projectCombatOutcome(state: CombatEncounterState): CombatOutcomeProjection {
    const pendingDot = getPendingDotTotal(state.enemy, state.round).total;
    const healPerRound = projectEnemyHealPerRound(state);
    const roundsToKill = computeRoundsToKill(state.enemy, state.round, healPerRound);
    const finishers: FinisherProjection[] = [];
    for (const { uid, card } of handCards(state)) {
        const sourceCard = lookupCard(card.id);
        const mech = (sourceCard?.specialMechanics ?? []).find(
            m => m.kind === 'rupture' || m.kind === 'reap_all',
        );
        if (!mech) continue;
        if (mech.kind === 'rupture') {
            const amount = projectRupture(state);
            finishers.push({ uid, cardId: card.id, mechanic: 'rupture', ready: amount > 0, amount });
        } else {
            const { ready, amount } = projectReapAll(state, card);
            finishers.push({ uid, cardId: card.id, mechanic: 'reap', ready, amount });
        }
    }
    return { pendingDot, roundsToKill, isLethalInFlight: roundsToKill !== null, finishers, healPerRound };
}

/** Re-export for presenters that need to check die affordability directly. */
export { combatDieCanPower, availableDiceFor, effectImpact, cardStanceColor, riderText };
