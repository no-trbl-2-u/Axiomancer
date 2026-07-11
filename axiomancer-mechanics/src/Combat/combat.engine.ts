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
import { MAX_EFFECT_INTENSITY, FREE_ENCHANT_ROUNDS } from '../Game/game-mechanics.constants';
import { lookupEffect, applyEffect } from '../Effects';
import type { Effect, ActiveEffect } from '../Effects/types';
import type { Character } from '../Character/types';
import type { Enemy } from '../Enemy/types';
import { getCardById } from '../Cards/cards.library';
import { executeCard } from '../Cards/card.engine';
import type { Card, CardRider, CardSpecialMechanic, CombatResources } from '../Cards/types';
import type { CombatState, Stance } from './types';
import { applyDamage, heal, isDefeated } from './health';
import {
    processRoundStartEffects, processRoundEndEffects, getActiveRollModifier,
    getThornsReflect, getDamageTakenMultiplier, getPendingDotTotal,
    getDistinctDebuffCount, getDistinctControlCount,
    getHealingReceivedMult, getOutgoingDamageMult, decayDotsOnHeal, consumeEffect,
    hasPayloadFlag, getStanceVulnMult, computeRoundsToKill,
    consumeAfflictions, consumeOneAffliction, getBackfirePerRung, consumeMarks, getMarkStacks,
    RUPTURE_PER_AFFLICTION_STACK, DISRUPT_DENY_AT,
    ruptureBurstCap, reapAllBurstCap,
    THREAT_RUNGS, THREAT_RUNGS_BOSS, BOSS_RUNG_REGROWTH, bossRungGrowthCap,
    CONCEDE_PREMISES_BASE, CONCEDE_PREMISES_ELITE, CONCEDE_PREMISES_BOSS,
    capitulateThreshold,
} from './effects';
import {
    TURN_DICE_COUNT, rollTurnDice, dieHasStance,
    combatDieCanPower, availableDiceFor, spendDice, availableDieCount,
    hasRerollableDice, rerollSpentDice, rollPermanentBonusDice,
    RESERVE_MAX, ripenReserve, FLOATING_DICE_CAP, materializeFloatingDice,
} from './combat.dice';
import {
    COMBAT_HAND_SIZE, buildCombatDeck, drawCombatCards, shuffleCombatDeck,
} from './combat.deck';
import {
    toCombatCard, cardStanceColor, effectImpact, riderText,
} from './combat.cards';
import { recordAttribution } from './combat.attribution';
import { canAct, getActiveEffectModifiers, getActiveDotTotal } from './effect-modifiers';
import { getThreatSequence } from './combat.threat';
import { getSignatureSkill, applySignatureSkill, playerArchetype } from './combat.signature';
import { getSignaturesForLoadout } from '../Items/relic.library';
import type {
    CombatCard, CombatDieColor, CombatEncounterState, CombatEvent, CardPlay,
    CombatManaDie, CombatPhaseResult, CombatTransition, LandedEffect, CombatReadResult,
    CombatThreatEffect,
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
/** Flat bonus HP damage when the drafted die color matches the card's stance (§3). */
export const COLOR_MATCH_DAMAGE_BONUS = 3;
/** An enemy threat action's damage is scaled by this so a fight stays threatening
 *  over its full length (the enemy attacks every phase in the HP model). HARD:
 *  bosses/elites can drop a careless player. */
export const THREAT_DAMAGE_SCALE = 1.7;
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
// Spec 32 v3 §1 — DIRECT_DAMAGE_WEIGHT is DEAD: the strike was purged from the
// schema (`basePower` no longer exists), so there is no immediate-strike path
// to weight. Every HP source is DoT ticks, status payoffs, engine-gated drips,
// or reflect.

/** Spec 32 v3 T8 — SWAY decays this much at every turn boundary (the tension
 *  knob, ratified A2; `irresistible-grace` removes the decay). Tunable. */
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
export const PIP_INTENSITY_BONUS = 1;
/** R2 — each pip on a spent Reserve die adds this much Guard on a defend card. */
export const PIP_GUARD_BONUS = 2;
/** R7 — a color-matched (or Wild) die on a STATUS card extends the landed
 *  status by this many turns. Strike/defend keep the flat +3 damage bonus. */
export const COLOR_MATCH_STATUS_DURATION_BONUS = 1;
/** R4 — the universal once-per-turn FATE TAP's Conviction payout. */
export const FATE_TAP_CONVICTION = 1;

const EMPTY_RESOURCES: CombatResources = { heart: 0, body: 0, mind: 0, fallacy: 0, paradox: 0 };
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
        combatResources: enc.combatResources,
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
 */
export function initializeCombatEncounter(
    player: Character,
    enemy: Enemy,
    playerDeck?: string[],
    seed?: number,
): CombatEncounterState {
    if (seed !== undefined) setSeed(seed);

    const clonedPlayer = deepClone(player);
    const clonedEnemy = deepClone(enemy);
    const deck = playerDeck && playerDeck.length > 0 ? playerDeck.slice() : buildCombatDeck(clonedPlayer);

    const threatPhases = getThreatSequence(clonedEnemy);

    // Draw the opening hand (5) from a shuffled deck.
    const shuffled = shuffleCombatDeck(deck);
    const draw = drawCombatCards(shuffled, [], deck, COMBAT_HAND_SIZE);

    let uid = 0;
    const hand = draw.drawn.map(cardId => ({ uid: `c${++uid}`, cardId }));

    // Spec 32 v3 §5 — the character's persistent FLOATING dice arrive in the
    // opening tray (they were forged in earlier combats and never spent).
    const floatingDice = materializeFloatingDice(clonedPlayer.floatingDice ?? []);

    return {
        phase: 'reveal',
        enemy: clonedEnemy,
        player: clonedPlayer,
        dice: [],
        draftedDieId: null,
        turn: 0,
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
        peroration: null,
        souls: 0,
        sway: 0,
        omenHits: 0,
        pendingOmens: [],
        spellsPlayedThisTurn: 0,
        lastSpellCardId: null,
        conjuredUids: [],
        threatPhases,
        threatMarks: threatPhases.map(() => 'pending'),
        currentPhaseIndex: 0,
        phaseResults: [],
        combatResources: { ...EMPTY_RESOURCES },
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
        seed,
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
    const turn = state.turn + 1;
    let dice = rollTurnDice(turn, TURN_DICE_COUNT, rng);
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
    // Spec 32 v3 §5 — FLOATING dice join every turn's tray. They are the same
    // persistent objects each turn (stable ids), never reroll, and are only
    // removed from the pool when SPENT.
    if ((state.floatingDice ?? []).length > 0) {
        dice = [...dice, ...(state.floatingDice ?? []).map(d => ({ ...d, state: 'available' as const }))];
    }
    const next: CombatEncounterState = {
        ...state, player, dice, draftedDieId: null, turn, lastRead: 'none', carriedDie,
        spellsPlayedThisTurn: 0, echoNextSpell: false,
    };
    const events: CombatEvent[] = [
        { kind: 'turn-dice-rolled', turn, dice },
        // Mirror the legacy event so existing presenters keep working.
        { kind: 'dice-rolled', dice },
    ];
    return { state: withLog(next, events), events };
}

/**
 * SENSORY NULL on the PLAYER (P0-truth `blocksAdvantage` wiring): the bearer
 * cannot benefit from a won read — advantage clamps to neutral. Losing reads
 * still hurt (the null blinds, it does not protect).
 */
function clampPlayerRead(player: Character, read: CombatReadResult): CombatReadResult {
    if (read !== 'advantage') return read;
    return hasPayloadFlag(player, 'blocksAdvantage') ? 'neutral' : read;
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
    if (state.phase !== 'phase-play') return { state, events: [] };
    if (state.draftedDieId !== null) return { state, events: [] };
    // Spec 32 v3 §5 — a FLOATING die cannot be drafted as the stance: it is an
    // extra power source beyond the turn's 2-die draft (the "bigger turns"
    // intent), spent directly on PAID plays like a Reserve die.
    const drafted = state.dice.find(d => d.id === dieId && !d.floating);
    if (!drafted) return { state, events: [] };

    const events: CombatEvent[] = [];
    const enemyStance = currentPhaseStance(state);
    const read = clampPlayerRead(state.player, resolveRead(drafted.color, enemyStance));

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
    }
    const next: CombatEncounterState = {
        ...state, enemy, conviction,
        dice: state.dice.map(d => (d.id === dieId ? { ...d, state: 'spent' as const } : d)),
        fateTappedTurn: state.turn,
    };
    return checkImmediateOutcome(withLog(next, events), events);
}

/** The drafted stance die for this turn (or null). */
function draftedDie(state: CombatEncounterState): CombatManaDie | null {
    if (!state.draftedDieId) return null;
    return state.dice.find(d => d.id === state.draftedDieId) ?? null;
}

function withLog(state: CombatEncounterState, events: CombatEvent[]): CombatEncounterState {
    return events.length ? { ...state, log: [...state.log, ...events] } : state;
}

// ── Card play (§9 playCombatCard) ────────────────────────────────────────────

/**
 * Plays one card from hand. `useBottom` powers the full effect (costs dice via
 * RPS scaling, executes the card, drives impact + the die-refresh loop); the
 * free top action contributes a weak flat impact with no die.
 */
export function playCombatCard(
    state: CombatEncounterState,
    cardRef: { uid?: string; cardId?: string },
    useBottom: boolean,
    dieId?: string,
    rng: () => number = defaultRng,
): CombatTransition {
    if (state.phase !== 'phase-play') return { state, events: [] };

    const entry = cardRef.uid
        ? state.hand.find(h => h.uid === cardRef.uid)
        : state.hand.find(h => h.cardId === cardRef.cardId);
    if (!entry) return { state, events: [] };

    const card = getCard(entry.cardId);
    if (!card) return { state, events: [] };

    return useBottom
        ? playBottomAction(state, entry.uid, card, dieId, rng)
        : playTopAction(state, entry.uid, card, rng);
}

/**
 * Spec 26b — scrap a hand card for +1 Conviction. Turns a dead draw into resolve
 * toward a Signature Skill (the agency lever through a bad hand). Phase-play only.
 */
export function discardCombatCard(state: CombatEncounterState, uid: string): CombatTransition {
    if (state.phase !== 'phase-play') return { state, events: [] };
    const entry = state.hand.find(h => h.uid === uid);
    if (!entry) return { state, events: [] };
    const conviction = Math.min(CONVICTION_CAP, state.conviction + 1);
    const next: CombatEncounterState = {
        ...state,
        hand: state.hand.filter(h => h.uid !== uid),
        discard: [...state.discard, entry.cardId],
        conviction,
    };
    const events: CombatEvent[] = [{ kind: 'conviction-gained', amount: 1, total: conviction, reason: 'effect' }];
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

// ── Spec 32 v3 — shared rider/state helpers ──────────────────────────────────

/** True when any zone — permanent or temporary — carries a given card id (player
 *  enchantment or enemy-attached disenchant). The zone IS the hook registry: each
 *  persistent card's passive is implemented at its trigger site, gated by this
 *  check. Spec 32 v4 — a FREE-line TIMED instance (`tempZone` / `enemyTempAttachments`)
 *  lights up the exact same hook while its `roundsLeft` holds, so the weak and the
 *  permanent versions differ only in duration, never in effect. */
function zoneHas(state: CombatEncounterState, cardId: string): boolean {
    return state.persistentZone.includes(cardId)
        || (state.enemyAttachments ?? []).includes(cardId)
        || (state.enemyEnchantments ?? []).includes(cardId)
        || (state.tempZone ?? []).some(t => t.cardId === cardId)
        || (state.enemyTempAttachments ?? []).some(t => t.cardId === cardId);
}

/** SOUL gain (Harvest): bumps the bank; `bone-orchard` (E) drips 1 HP per Soul
 *  gained — a soul-gated payoff (spec 32 v3 §1 source 3). */
function gainSouls(
    state: CombatEncounterState,
    amount: number,
    reason: 'expiry' | 'consumed' | 'granted',
    events: CombatEvent[],
): CombatEncounterState {
    if (amount <= 0) return state;
    const souls = (state.souls ?? 0) + amount;
    let enemy = state.enemy;
    let directDamage = state.directDamageDealt;
    events.push({ kind: 'soul-gained', amount, total: souls, reason });
    if (zoneHas(state, 'bone-orchard') && !isDefeated(enemy)) {
        enemy = applyDamage(enemy, amount);
        directDamage += amount;
        events.push({ kind: 'damage-dealt', cardId: 'bone-orchard', target: 'enemy', amount });
    }
    return { ...state, souls, enemy, directDamageDealt: directDamage };
}

/** SWAY gain + the CAPITULATE check (spec 32 v3 §9, reworked by plan/tuning/
 *  2026-07-08-win-path-scaling.md item 1a to a Dawncaster Charmed-style
 *  `resolve` threshold — see `capitulateThreshold`): SWAY ≥ the enemy's
 *  resolve → the enemy yields. Checked eagerly on every gain and at turn
 *  boundaries. */
function gainSway(
    state: CombatEncounterState,
    amount: number,
    events: CombatEvent[],
): CombatEncounterState {
    if (amount <= 0) return state;
    // Grace late-stage rebalance (2026-07-08): buff_grace_momentum (stacked
    // at the turn boundary while irresistible-grace holds SWAY from decaying
    // — see processBetweenPhases) multiplies every SWAY gain by its payload's
    // outgoingSwayGainMulPct per stack. "Protect the stack" becomes a
    // genuinely compounding payoff instead of just a decay-proof floor.
    const momentum = state.player.effects.find(e => e.effectId === 'buff_grace_momentum');
    let scaledAmount = amount;
    if (momentum) {
        const momentumDef = lookupEffectDef('buff_grace_momentum');
        const pct = (momentumDef?.payload as { outgoingSwayGainMulPct?: number } | undefined)?.outgoingSwayGainMulPct ?? 0;
        scaledAmount = Math.round(amount * (1 + (pct / 100) * momentum.intensity));
    }
    const sway = (state.sway ?? 0) + scaledAmount;
    events.push({ kind: 'sway-gained', amount: scaledAmount, total: sway });
    return { ...state, sway };
}

function swayCapitulates(state: CombatEncounterState): boolean {
    // A DEFEATED enemy cannot capitulate — HP 0 is a victory, not a yield
    // (otherwise any 1 SWAY would relabel every DoT kill 'capitulate').
    return (state.sway ?? 0) > 0
        && !isDefeated(state.enemy)
        && (state.sway ?? 0) >= capitulateThreshold(state.enemy);
}

/** PREMISE gain + the PERORATION trigger (spec 32 v3 T2). When the declared
 *  conclusion's threshold is met the rider fires FREE and the tally resets;
 *  reaching `concedeAt` first wins the argument outright (CONCEDE). */
function gainPremises(
    state: CombatEncounterState,
    amount: number,
    events: CombatEvent[],
    rng: () => number,
): { state: CombatEncounterState; concede: boolean } {
    if (amount <= 0) return { state, concede: false };
    let next: CombatEncounterState = { ...state, premises: (state.premises ?? 0) + amount };
    events.push({ kind: 'premise-gained', amount, total: next.premises ?? 0 });
    const decl = next.peroration;
    if (!decl) return { state: next, concede: false };
    const total = next.premises ?? 0;
    // Win-path scaling (plan/tuning/2026-07-08-win-path-scaling.md item 1a):
    // the-closing-word's flat concedeAt (8) let Oratory land CONCEDE
    // identically against a 100 HP early wolf and a 1,500+ HP late boss —
    // Battle Lab round 2 clocked it at 100% win rate on EVERY stage. The
    // required Premise count now floors at the enemy's own `difficulty`
    // classification (a real bestiary field, not stage-id string-matching):
    // simple/normal enemies keep the card-authored concedeAt; elite/boss/
    // unique enemies raise the bar to CONCEDE_PREMISES_ELITE/_BOSS. Replaces
    // the narrower per-level bump that only ever fired against the
    // Impossible-tier ceiling probe.
    const concedeTierFloor = next.enemy.difficulty === 'boss' || next.enemy.difficulty === 'unique'
        ? CONCEDE_PREMISES_BOSS
        : next.enemy.difficulty === 'elite'
            ? CONCEDE_PREMISES_ELITE
            : CONCEDE_PREMISES_BASE;
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
 * delta; they no-op here.)
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

    if (r.guard) guard += r.guard;
    if (r.conviction) conviction = Math.min(CONVICTION_CAP, conviction + r.conviction);
    if (r.healHp) {
        const healAmt = Math.round(r.healHp * getHealingReceivedMult(player));
        if (healAmt > 0) {
            player = heal(player, healAmt);
            events.push({ kind: 'damage-dealt', cardId, target: 'self', amount: -healAmt });
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
        }
    }
    if (r.ruptureMarks) {
        // The conclusion lands: consume all marks, burst per stack (payoff class).
        const consumed = consumeMarks(enemy);
        if (consumed.stacks > 0) {
            enemy = consumed.combatant;
            const burst = Math.min(ruptureBurstCap(enemy.maxHealth), r.ruptureMarks * consumed.stacks);
            enemy = applyDamage(enemy, burst);
            directDamage += burst;
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
            if (applied.result.activeEffect) {
                events.push({
                    kind: 'effect-landed', cardId, effectId: def.id, target: toSelf ? 'self' : 'enemy',
                    effectKind: def.payload.damageOverTime ? 'dot' : 'control',
                    intensity: applied.result.activeEffect.intensity, effect: def,
                });
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

    next = { ...next, player, enemy, directDamageDealt: directDamage, conviction, guard };

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
    if (r.souls) next = gainSouls(next, r.souls, 'granted', events);
    if (r.sway) next = gainSway(next, r.sway, events);
    if (r.premises) {
        const res = gainPremises(next, r.premises, events, rng);
        next = res.state;
        if (res.concede) next = { ...next, phase: 'complete', finalOutcome: 'concede' };
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
    const isEnchant = sourceCard.cardType === 'enchantment';
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
    let next = discardEntry(state, uid);
    if (sourceCard?.free) {
        next = applyRiderToState(next, card.id, sourceCard.free, events, rng);
    }
    if (next.finalOutcome === 'concede') {
        return endCombat({ ...withLog(next, events), phase: 'phase-play', finalOutcome: null }, 'concede', events);
    }
    next = withLog(next, events);
    if (swayCapitulates(next)) return endCombat(next, 'capitulate', events);
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
): CombatTransition {
    const sourceCard = lookupCard(card.id);
    if (!sourceCard) return { state, events: [] };

    // 1. Resolve the POWERING die — Fate Engine P1 R8: the dieId the player
    //    dragged is HONORED. It may name the drafted die (default when absent),
    //    a banked Reserve die (R2), a FLOATING die in the tray (spec 32 v3 §5),
    //    or — for `fate` cards only — a locked X die in the tray (R4). Anything
    //    else is an explicit fizzle.
    const drafted = draftedDie(state);
    const reserveIn = state.reserve ?? [];
    let powering: CombatManaDie | null = null;
    let poweringSource: 'drafted' | 'reserve' | 'floating' | 'fate-x' = 'drafted';
    if (dieId === undefined || dieId === drafted?.id) {
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
    const read: CombatReadResult = poweringSource === 'fate-x'
        ? 'none'
        : powering.color === 'wild'
            ? clampPlayerRead(state.player, resolveRead(card.stance as CombatDieColor, enemyStance))
            : state.lastRead;
    const mult = READ_DAMAGE_MULT[read];
    const colorMatch = powering.color === 'wild' || powering.color === card.stance;
    const advantage = readToAdvantage(read);
    const poweringPips = powering.pips ?? 0;
    // Penitent rebalance (2026-07-08): tracks blood-price HP taken THIS play
    // (recoil mechanic + fate.recoilHp) so `mirror-of-guilt` can convert raw
    // recoil, not just landed self-debuff applications, into reflection —
    // see the mirror-of-guilt block below.
    let recoilTaken = 0;

    const events: CombatEvent[] = [{ kind: 'card-played', cardId: card.id, useBottom: true, dieId: powering.id, advantage, colorMatch }];

    // ── Spec 32 v3 §2.1 — ENCHANT / DISENCHANT routing. Persistent cards skip
    //    the spell pipeline entirely: the die is spent, the card leaves the deck
    //    cycle into its zone, and its passive lives at the engine's hook sites.
    if (sourceCard.cardType === 'enchantment' || sourceCard.cardType === 'disenchant') {
        const zone = sourceCard.cardType === 'enchantment' ? state.persistentZone : (state.enemyAttachments ?? []);
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
        events.push(sourceCard.cardType === 'enchantment'
            ? { kind: 'enchant-played', cardId: card.id, name: card.name }
            : { kind: 'disenchant-attached', cardId: card.id, name: card.name });
        // Spec 32 v4 — a PAID play makes the passive PERMANENT; if a FREE-line timed
        // instance of this card is still ticking, it is promoted (dropped from the
        // temp zone so the same id is not counted twice).
        let next: CombatEncounterState = {
            ...state, dice, reserve, floatingDice,
            persistentZone: sourceCard.cardType === 'enchantment'
                ? [...state.persistentZone, sourceCard.id] : state.persistentZone,
            enemyAttachments: sourceCard.cardType === 'disenchant'
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
    //    carries ECHO, an `echo_next_spell` charge is pending, or the
    //    `resonant-chamber` enchantment blesses the first spell of the turn.
    const mechsAll = sourceCard.specialMechanics ?? [];
    const echoCharge = state.echoNextSpell === true;
    const chamberEcho = zoneHas(state, 'resonant-chamber') && (state.spellsPlayedThisTurn ?? 0) === 0;
    const echoed = mechsAll.some(m => m.kind === 'echo') || echoCharge || chamberEcho;

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
            combatResources: res.state.combatResources,
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
    const combatResources = res.state.combatResources;
    let attribution = state.attribution;
    let directDamage = state.directDamageDealt;
    let landedOnEnemy = false;
    let mercyOpened = res.activateMercyChoice === true;

    // ── Fate Engine P1 — resonance, thresholds, die riders, pips (spec 31 §1) ──
    // Spending the powering die feeds the RESONANCE tally (R1): its own color,
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
    // Landed-status adjustments in one pass, all REAL units: rider intensity /
    // duration bonuses, RIPENED pips (+1 intensity per pip on a non-defend play,
    // R2), the color-match +1 duration on status cards (R7), and the persistent
    // zone's blessings — `venom-and-vein` (+1 on bleed/poison) and
    // `crown-of-thorns` (+1 on everything while FALLEN). Spec 32 v3 §7.
    const isDefendPlay = card.verbClass === 'defend';
    const landsDot = (sourceCard.combatEffects ?? []).some(ce =>
        ce.appliedTo === 'opponent' && lookupEffectDef(ce.effectId)?.payload.damageOverTime);
    // Penitent rebalance (2026-07-08): crown-of-thorns used to grant a flat
    // +1 regardless of how deep into Fallen the player had gone. It now
    // scales with debt DEPTH — +1 at the 2-debuff Fallen minimum (unchanged
    // from before), +1 more per self-debuff carried beyond that, capped at
    // +4 — the "bigger, scarier Fallen state that compounds faster once
    // triggered" the theme promises, instead of capping out the same
    // whether the player carries 2 self-afflictions or 5.
    const debtDepth = getDistinctDebuffCount(state.player);
    const crownBonus = zoneHas(state, 'crown-of-thorns') && wasFallen
        ? Math.min(4, Math.max(1, debtDepth - 1))
        : 0;
    const zoneIntensity =
        (zoneHas(state, 'venom-and-vein') && landsDot ? 1 : 0)
        + crownBonus;
    // Erosion late-stage rebalance (2026-07-08): venom-and-vein now also
    // stretches every bleed/poison it deepens by 1 turn (not just +1
    // intensity), so its "deeper roots" payoff compounds specifically across
    // the long fights it was printed for, rather than adding a flat power
    // token that hits every fight equally hard regardless of length.
    const zoneDuration = zoneHas(state, 'venom-and-vein') && landsDot ? 1 : 0;
    const bonusIntensity = firedRiders.reduce((n, r) => n + (r.bonusIntensity ?? 0), 0)
        + zoneIntensity
        + (isDefendPlay ? 0 : poweringPips * PIP_INTENSITY_BONUS);
    const bonusDuration = firedRiders.reduce((n, r) => n + (r.bonusDuration ?? 0), 0)
        + zoneDuration
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
    let reserve = reserveIn;
    let floatingDice = (state.floatingDice ?? []).slice();
    let souls = state.souls ?? 0;
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
    // FORGE (spec 32 v3 §5): a freshly forged floating die joins the TRAY NOW —
    // collected here and merged into `dice` after the powering-die spend.
    const forgedFloating: CombatManaDie[] = [];
    // TRANSMUTE (dice-law 2026-07-09): X dice consumed by `float_x_die` this
    // play — removed from the tray after the powering-die spend.
    const transmutedXIds: string[] = [];

    // Local SOUL gain (bone-orchard drips 1 HP per Soul gained — soul-gated).
    const gainSoulsLocal = (n: number, reason: 'expiry' | 'consumed' | 'granted'): void => {
        if (n <= 0) return;
        souls += n;
        events.push({ kind: 'soul-gained', amount: n, total: souls, reason });
        if (zoneHas(state, 'bone-orchard')) {
            enemy = applyDamage(enemy, n);
            mechanicDamage += n;
            directDamage += n;
            events.push({ kind: 'damage-dealt', cardId: 'bone-orchard', target: 'enemy', amount: n });
        }
    };

    // `stuck-in-their-head` (D): every ECHO / REPRISE drips damage, engine-
    // gated. Refrain rebalance (2026-07-08): the flat 2 HP was a rounding
    // error against late-stage HP pools no matter how many times the deck
    // echoed Mark onto the enemy — it now scales with getMarkStacks(enemy),
    // floor 2 (unchanged worst case) / cap 16 (~8 stacks), so "the tune gets
    // louder each time" is a real mechanical fact, not just flavor text.
    const stuckDrip = (): void => {
        if (!zoneHas(state, 'stuck-in-their-head')) return;
        const drip = Math.max(2, Math.min(16, getMarkStacks(enemy)));
        enemy = applyDamage(enemy, drip);
        mechanicDamage += drip;
        directDamage += drip;
        events.push({ kind: 'damage-dealt', cardId: 'stuck-in-their-head', target: 'enemy', amount: drip });
    };
    if (echoed) stuckDrip();

    for (const mech of mechs) {
        switch (mech.kind) {
            case 'rider': {
                // The generic unconditional PAID verb carrier (draw/heal/…).
                firedRiders.push(mech.rider);
                break;
            }
            case 'recoil': {
                // AKRASIA — the printed blood price (unpreventable).
                player = applyDamage(player, mech.hp);
                recoilTaken += mech.hp;
                events.push({ kind: 'recoil-paid', cardId: card.id, amount: mech.hp });
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
                const stance: 'heart' | 'body' | 'mind' = dieHasStance(powering.color)
                    ? (powering.color as 'heart' | 'body' | 'mind')
                    : dieHasStance(card.stance) ? (card.stance as 'heart' | 'body' | 'mind') : 'heart';
                const nIdx = Math.min(state.currentPhaseIndex + 1, state.threatPhases.length - 1);
                pendingOmens.push({ cardId: card.id, stance, phaseIndex: nIdx });
                events.push({ kind: 'omen-declared', cardId: card.id, stance, phaseIndex: nIdx });
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
                // Foundry engagement fix (2026-07-08): a persistent FLOATING die
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
                pipsSpentThisPlay += pips;
                break;
            }
            case 'rupture': {
                // RUPTURE v3 — consume ALL afflictions: 1.5x... no — burst =
                // (pending DoT fuel + flat per non-DoT stack + pip/omen fuel),
                // read + vulnerable scaled, capped. Consumed instances feed SOULS.
                const pending = getPendingDotTotal(state.enemy, state.round).total;
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
                    enemy = applyDamage(enemy, burst);
                    mechanicDamage += burst;
                    directDamage += burst;
                    attribution = recordAttribution(attribution, card.id, card.name, null, burst);
                }
                events.push({ kind: 'rupture-detonated', amount: burst, consumed: consumedRes.consumed });
                gainSoulsLocal(consumedRes.consumed.length, 'consumed');
                break;
            }
            case 'consume_affliction': {
                // WINNOWING — the scythe: one affliction's remaining fuel ticks NOW.
                const res2 = consumeOneAffliction(enemy, state.round);
                if (res2.consumed) {
                    enemy = res2.combatant;
                    if (res2.fuel > 0) {
                        const dmg = Math.round(res2.fuel * vulnMult);
                        enemy = applyDamage(enemy, dmg);
                        mechanicDamage += dmg;
                        directDamage += dmg;
                        attribution = recordAttribution(attribution, card.id, card.name, null, dmg);
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
                if (mech.rider) firedRiders.push(mech.rider);
                if (mech.kindle) {
                    const forged: CombatManaDie = {
                        id: `forge-${state.turn}-${state.log.length + events.length}`, color: mech.kindle,
                        state: 'available', temporary: true,
                        pips: zoneHas(state, 'anvil-of-form') ? 1 : 0,
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
                // THE REAPING — spend every Soul: a payoff burst per Soul. Uses
                // the higher REAP_ALL_BURST_CAP (not the shared RUPTURE cap) so a
                // full Soul bank actually pays off ("every soul, swung at once").
                const spent = souls;
                const burst = Math.min(reapAllBurstCap(enemy.maxHealth), Math.round(mech.burstPerSoul * spent * mult * vulnMult));
                souls = 0;
                if (burst > 0) {
                    enemy = applyDamage(enemy, burst);
                    mechanicDamage += burst;
                    directDamage += burst;
                    attribution = recordAttribution(attribution, card.id, card.name, null, burst);
                }
                events.push({ kind: 'reaped', cardId: card.id, soulsSpent: spent, amount: burst });
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
                // Return the highest-rank discard(s) to hand; optionally fire the
                // reprised card's FREE line immediately.
                const returned: string[] = [];
                for (let i = 0; i < mech.count * echoFactor && discard.length > 0; i++) {
                    const rankOf = (id: string): number => lookupCard(id)?.rank ?? 0;
                    const bestIdx = discard.reduce((best, id, j) => (rankOf(id) > rankOf(discard[best]) ? j : best), 0);
                    const cid = discard[bestIdx];
                    discard = discard.filter((_, j) => j !== bestIdx);
                    hand = [...hand, { uid: `rp${state.log.length + events.length}-${i}`, cardId: cid }];
                    returned.push(cid);
                    const freeRider = lookupCard(cid)?.free;
                    if (mech.fireFree && freeRider) reprisedFreeRiders.push(freeRider);
                }
                if (returned.length > 0) {
                    events.push({ kind: 'reprised', cardId: card.id, returned });
                    stuckDrip();
                } else {
                    events.push({ kind: 'effect-fizzled', cardId: card.id, effectId: '', message: 'the discard pile is empty' });
                }
                break;
            }
            case 'replay_last': {
                // OUROBOROS — the argument repeats: the last spell's statuses land
                // again, `times` times. Never chains into another replay.
                const lastId = state.lastSpellCardId;
                const lastCard = lastId && lastId !== sourceCard.id ? lookupCard(lastId) : undefined;
                const replayable = lastCard
                    && lastCard.cardType === 'spell'
                    && !(lastCard.specialMechanics ?? []).some(m2 => m2.kind === 'replay_last');
                if (replayable && lastCard) {
                    for (let i = 0; i < mech.times; i++) {
                        const shim2: CombatState = { ...cardShim(state), player, enemy, combatResources: res.state.combatResources };
                        try {
                            const replay = executeCard(shim2, lastCard.id, lookupCard, 'player');
                            player = replay.state.player as Character;
                            enemy = replay.state.enemy as Enemy;
                            allCardEvents = [...allCardEvents, ...replay.events];
                        } catch { break; }
                    }
                    events.push({ kind: 'echoed', cardId: lastCard.id });
                    stuckDrip();
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
                        pips: zoneHas(state, 'anvil-of-form') ? 1 : 0,
                    };
                    floatingDice = [...floatingDice, die];
                    forgedFloating.push(die);
                    events.push({ kind: 'die-floated', dieId: die.id, color, poolSize: floatingDice.length });
                }
                break;
            }
            case 'float_x_die': {
                // TRANSMUTE (dice-law 2026-07-09) — a dead X face in the tray
                // becomes a FLOATING WILD die: dead fate turned live. Falls back
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
                        pips: zoneHas(state, 'anvil-of-form') ? 1 : 0,
                    };
                    floatingDice = [...floatingDice, die];
                    forgedFloating.push(die);
                    events.push({ kind: 'die-floated', dieId: die.id, color: 'wild', poolSize: floatingDice.length });
                }
                break;
            }
            case 'create_temporary_die': {
                // KINDLE — a temporary die (this combat only) joins the Reserve.
                const forged: CombatManaDie = {
                    id: `forge-${state.turn}-${state.log.length + events.length}`, color: mech.color,
                    state: 'available', temporary: true,
                    pips: zoneHas(state, 'anvil-of-form') ? 1 : 0,
                };
                if (reserve.length < RESERVE_MAX) {
                    reserve = [...reserve, forged];
                    events.push({ kind: 'die-forged', dieId: forged.id, color: forged.color, destination: 'reserve' });
                } else {
                    conviction = Math.min(CONVICTION_CAP, conviction + 1);
                    events.push({ kind: 'die-forged', dieId: forged.id, color: forged.color, destination: 'conviction' });
                }
                break;
            }
            case 'grant_pip': {
                if (reserve.length === 0) break;
                for (let i = 0; i < mech.count; i++) {
                    const r = ripenReserve(reserve);
                    reserve = r.reserve;
                    for (const id of r.ripenedIds) {
                        events.push({ kind: 'die-ripened', dieId: id, pips: reserve.find(d => d.id === id)?.pips ?? 0 });
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
    // `practiced-cadence` (E): the first card each turn grants +1 Premise.
    if (zoneHas(state, 'practiced-cadence') && (state.spellsPlayedThisTurn ?? 0) === 0) {
        premisesGained += 1;
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
    const selfDebuffsLanded: { effectId: string; intensity: number; duration: number }[] = [];
    for (const ev of allCardEvents) {
        if (ev.kind === 'effect-applied') {
            const def = ev.effect;
            const target: 'self' | 'enemy' = ev.appliedTo;
            const sideEffects = target === 'enemy' ? enemy.effects : player.effects;
            const active = sideEffects.find(a => a.effectId === def.id);
            if (active && target === 'enemy') {
                const landed: LandedEffect = { effectId: def.id, effect: def, active, target };
                const cls = effectImpact(def, active.intensity, active.remainingDuration).track;
                attribution = recordAttribution(attribution, card.id, card.name, landed, 0);
                events.push({ kind: 'effect-landed', cardId: card.id, effectId: def.id, target: 'enemy', effectKind: cls, intensity: active.intensity, effect: def });
                if (cls === 'dot' || cls === 'control') landedOffensiveIds.push(def.id);
                // Meaningful land = intensity increased over the snapshot (or new).
                if ((before[def.id] ?? 0) < active.intensity) landedOnEnemy = true;
            } else if (active) {
                events.push({ kind: 'effect-landed', cardId: card.id, effectId: def.id, target, effectKind: 'none', intensity: active.intensity, effect: def });
                if (target === 'self' && def.type === 'debuff') {
                    selfDebuffsLanded.push({ effectId: def.id, intensity: active.intensity, duration: active.remainingDuration });
                }
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
    // `mirror-of-guilt` (D): every self-debuff the player takes lands 1 stack of
    // the same affliction on the enemy — the debt argues for you (spec 32 v3 T4).
    if (zoneHas(state, 'mirror-of-guilt')) {
        for (const sd of selfDebuffsLanded) {
            const def = lookupEffectDef(sd.effectId);
            if (!def) continue;
            const applied = applyEffect(enemy.effects, def, state.round, { intensityDelta: 1, sourceId: 'mirror-of-guilt' });
            enemy = { ...enemy, effects: applied.activeEffects };
            events.push({
                kind: 'effect-landed', cardId: 'mirror-of-guilt', effectId: def.id, target: 'enemy',
                effectKind: def.payload.damageOverTime ? 'dot' : 'control',
                intensity: applied.result.activeEffect?.intensity ?? 1, effect: def,
            });
        }
        // Penitent rebalance (2026-07-08): raw recoil (Self-Flagellant, Pact
        // of Akrasia's fate cost) previously earned NO reflection at all —
        // only a self-debuff APPLICATION did. Every MIRROR_RECOIL_HP_PER_STACK
        // HP of recoil taken this play now also lands stacks of the player's
        // most recently self-inflicted debuff (or a standing debuff_mark if
        // this play took recoil with no self-debuff application of its own)
        // onto the enemy — the debt argues for you even when it's paid in
        // pure HP, not just in applied afflictions.
        const MIRROR_RECOIL_HP_PER_STACK = 3;
        const recoilStacks = Math.floor(recoilTaken / MIRROR_RECOIL_HP_PER_STACK);
        if (recoilStacks > 0) {
            const mirrorEffectId = selfDebuffsLanded.length > 0
                ? selfDebuffsLanded[selfDebuffsLanded.length - 1].effectId
                : 'debuff_mark';
            const def = lookupEffectDef(mirrorEffectId);
            if (def) {
                const applied = applyEffect(enemy.effects, def, state.round, { intensityDelta: recoilStacks, sourceId: 'mirror-of-guilt-recoil' });
                enemy = { ...enemy, effects: applied.activeEffects };
                events.push({
                    kind: 'effect-landed', cardId: 'mirror-of-guilt', effectId: def.id, target: 'enemy',
                    effectKind: def.payload.damageOverTime ? 'dot' : 'control',
                    intensity: applied.result.activeEffect?.intensity ?? recoilStacks, effect: def,
                });
            }
        }
    }

    // ── Rider payloads (threshold / dieBonus / fate / fallen / reap), exact units ──
    let revealedStances = state.revealedStances;
    let riderGuard = 0;
    let riderRefresh = false;
    for (const r of firedRiders) {
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
                enemy = applyDamage(enemy, ticks.total);
                directDamage += ticks.total;
                attribution = recordAttribution(attribution, card.id, card.name, null, ticks.total);
                for (const t of ticks.perEffect) {
                    events.push({ kind: 'dot-tick', effectId: t.effectId, label: t.label, amount: t.amount, target: 'enemy' });
                }
            }
        }
        if (r.tickOne) {
            const ticks = getActiveDotTotal(enemy.effects, state.round).perEffect;
            const strongest = ticks.reduce<typeof ticks[number] | null>(
                (best, t) => (best === null || t.amount > best.amount ? t : best), null);
            if (strongest) {
                enemy = applyDamage(enemy, strongest.amount);
                directDamage += strongest.amount;
                attribution = recordAttribution(attribution, card.id, card.name, null, strongest.amount);
                events.push({ kind: 'dot-tick', effectId: strongest.effectId, label: strongest.label, amount: strongest.amount, target: 'enemy' });
            }
        }
        if (r.ruptureMarks) {
            const consumed = consumeMarks(enemy);
            if (consumed.stacks > 0) {
                enemy = consumed.combatant;
                const burst = Math.min(ruptureBurstCap(enemy.maxHealth), Math.round(r.ruptureMarks * consumed.stacks * vulnMult));
                enemy = applyDamage(enemy, burst);
                mechanicDamage += burst;
                directDamage += burst;
                attribution = recordAttribution(attribution, card.id, card.name, null, burst);
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
    //    the Reserve. A FLOATING die is GONE FOREVER when spent (spec 32 v3 §5) —
    //    refresh effects cannot save it.
    const chainBefore = state.chainEffectIds ?? [];
    const newChainIds = landedOffensiveIds.filter(id => !chainBefore.includes(id));
    const landedNewDistinct = newChainIds.length > 0;
    const convertMech = mechs.some(m => m.kind === 'convert_die_color');
    const bankSpentMech = mechs.some(m => m.kind === 'bank_spent_die');
    const refreshed = (landedOnEnemy && landedNewDistinct) || reactFired || riderRefresh
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
    // `entropy-tax` (D): spending a KINDLED (temporary) or FLOATING die marks
    // the enemy — the manufactured resource has a price (spec 32 v3 T3).
    if (zoneHas(state, 'entropy-tax')
        && (poweringSource === 'floating' || (poweringSource === 'reserve' && powering.temporary))) {
        const markDef = lookupEffectDef('debuff_mark');
        if (markDef) {
            const applied = applyEffect(enemy.effects, markDef, state.round, { intensityDelta: 1, sourceId: 'entropy-tax' });
            enemy = { ...enemy, effects: applied.activeEffects };
            events.push({
                kind: 'effect-landed', cardId: 'entropy-tax', effectId: markDef.id, target: 'enemy',
                effectKind: 'control', intensity: applied.result.activeEffect?.intensity ?? 1, effect: markDef,
            });
        }
    }

    // Defense card → GUARD (read-scaled + color-match + pips). Absorbed in
    // `resolveThreatPhase`.
    const guardMech = (sourceCard.specialMechanics ?? []).find(m => m.kind === 'guard') as { amount: number } | undefined;
    const pipGuard = isDefendPlay ? poweringPips * PIP_GUARD_BONUS : 0;
    if (pipGuard > 0) {
        events.push({ kind: 'pips-cashed', cardId: card.id, pips: poweringPips, bonus: 'guard', amount: pipGuard });
    }
    const guardGain = (guardMech
        ? Math.max(1, Math.round(guardMech.amount * mult)) + (colorMatch ? COLOR_MATCH_DAMAGE_BONUS : 0)
        : 0) + riderGuard + pipGuard + pipGuardExtra;
    // BARRIER — a STACKING, persistent soak (distinct from one-shot guard); read-scaled.
    const barrierMech = mechs.find(m => m.kind === 'barrier') as { kind: 'barrier'; amount: number } | undefined;
    const barrierGain = barrierMech
        ? Math.max(1, Math.round(barrierMech.amount * mult)) + (colorMatch ? COLOR_MATCH_DAMAGE_BONUS : 0)
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

    let next: CombatEncounterState = {
        ...state, player, enemy, dice, reserve, resonance, conviction,
        revealedStances, hand, drawPile, discard, combatResources, attribution,
        chainEffectIds: [...chainBefore, ...newChainIds],
        guard: (state.guard ?? 0) + guardGain,
        barrier: (state.barrier ?? 0) + barrierGain,
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
        spellsPlayedThisTurn: (state.spellsPlayedThisTurn ?? 0) + 1,
        lastSpellCardId: sourceCard.id,
    };
    // Discard the played card — a CONJURED Thoughtform is one-use: it leaves
    // the combat entirely instead of entering the discard pile.
    if (conjuredUids.includes(uid)) {
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
    next = withLog(next, events);
    if (swayCapitulates(next)) return endCombat(next, 'capitulate', events);
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
    // THREAT_RUNGS rungs (bosses one more); accumulated STAGGER plus the
    // `quagmire-of-doubt` disenchant (-1 standing) remove rungs. At 0 the turn
    // is DENIED; partial removal weakens the hit proportionally, and each rung
    // lost feeds BACKFIRE.
    const naturalRungsTotal = isBossTier ? THREAT_RUNGS_BOSS : THREAT_RUNGS;
    // Boss/unique rung REGROWTH (plan/tuning/2026-07-08-win-path-scaling.md
    // item 1c, anti-permalock): accrued resilience from prior rounds where
    // this boss's telegraph was denied/weakened — see the `bossRungGrowth`
    // write-back below. Normal/elite enemies never accrue it (isBossTier
    // gates the write-back too), so their rungsTotal is byte-identical to
    // before.
    const rungGrowth = isBossTier ? Math.min(state.bossRungGrowth ?? 0, bossRungGrowthCap(naturalRungsTotal)) : 0;
    const rungsTotal = naturalRungsTotal + rungGrowth;
    const quagmire = zoneHas(state, 'quagmire-of-doubt') ? 1 : 0;
    const rungsLost = Math.min(rungsTotal, (state.staggerRungs ?? 0) + quagmire);
    const rungDenied = rungsLost >= rungsTotal;
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
            1 + escalationRate * Math.max(0, state.round - THREAT_ESCALATION_GRACE),
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
    const overextendedId = hasPayloadFlag(state.enemy, 'forcesWeakTierNextPlay');
    // DOUBT on the enemy (P0-truth `restrictsSurgeAccess` re-spec): its next fired
    // threat loses its RIDERS (status application + self-heal), then the doubt is
    // consumed — prevention the player can schedule.
    const doubtId = hasPayloadFlag(state.enemy, 'restrictsSurgeAccess');
    const hindered = !act.canAct || denied;
    if (disruptDenied) events.push({ kind: 'disrupt-denied', pips: controlPips });

    let player = state.player;
    let enemy = state.enemy;
    // GUARD (one-shot, per-phase) absorbs first; BARRIER (persistent, stacking)
    // soaks the remainder; RIPOSTE parries and — spec 32 v3 — counters ONLY when
    // the attack was FULLY blocked (reflect class). All no-op when unset.
    let guard = state.guard ?? 0;
    let barrier = state.barrier ?? 0;
    const riposte = state.riposte ?? null;
    let riposteFired = false;
    let attacksLanded = 0;
    let attacksFullyBlocked = 0;
    let damagePrevented = 0;
    let directDamage = state.directDamageDealt;
    const penaltiesApplied: CombatThreatEffect[] = [];

    // BACKFIRE (spec 32 v3 T5, engine-gated drip): the enemy takes its
    // backfire-per-rung total × the rungs its action lost this phase (a fully
    // denied action counts every rung).
    const backfirePer = getBackfirePerRung(state.enemy);
    const rungsForBackfire = hindered ? rungsTotal : rungsLost;
    if (backfirePer > 0 && rungsForBackfire > 0) {
        const drip = backfirePer * rungsForBackfire;
        enemy = applyDamage(enemy, drip);
        directDamage += drip;
        events.push({ kind: 'backfired', amount: drip, rungs: rungsForBackfire });
    }

    if (!hindered) {
        // The enemy attacks: its telegraphed threat action fires on the player.
        const playerTakenMult = getDamageTakenMultiplier(state.player);
        for (const eff of phase.threatAction.effects) {
            if (eff.damage && eff.damage > 0) {
                attacksLanded += 1;
                // weakenMult folds soft-control AND partial rung loss.
                let dmg = Math.round(
                    eff.damage * THREAT_DAMAGE_SCALE * weakenMult * escalation
                    * enemyOutgoingMult * (overextendedId ? 0.5 : 1) * playerTakenMult,
                );
                // RIPOSTE parry reduces the incoming hit once this phase.
                if (riposte && !riposteFired && riposte.reduce > 0) {
                    const parried = Math.min(dmg, riposte.reduce);
                    dmg -= parried;
                    damagePrevented += parried;
                    riposteFired = true;
                }
                // GUARD soaks first (one-shot, clamped), then BARRIER (persistent).
                const guardAbsorbed = Math.min(guard, dmg);
                guard -= guardAbsorbed;
                dmg -= guardAbsorbed;
                damagePrevented += guardAbsorbed;
                const barrierAbsorbed = Math.min(barrier, dmg);
                if (barrierAbsorbed > 0) {
                    barrier -= barrierAbsorbed;
                    dmg -= barrierAbsorbed;
                    damagePrevented += barrierAbsorbed;
                    events.push({ kind: 'barrier-absorbed', amount: barrierAbsorbed });
                }
                if (dmg > 0) player = applyDamage(player, dmg);
                else attacksFullyBlocked += 1;
            }
            if (eff.effectId && !doubtId) {
                const def = lookupEffectDef(eff.effectId);
                if (def) {
                    const res = applyEffect(player.effects, def, state.round, {
                        intensityDelta: (eff.intensity ?? 1) + effectIntensityBonus,
                        durationMode: eff.duration ? 'additive' : 'reset',
                        durationDelta: eff.duration,
                        sourceId: enemy.id,
                    });
                    player = { ...player, effects: res.activeEffects };
                    // `mirror-of-guilt` (D): an enemy-inflicted debuff reflects
                    // 1 stack of itself back onto the enemy.
                    if (zoneHas(state, 'mirror-of-guilt') && def.type === 'debuff') {
                        const mirrored = applyEffect(enemy.effects, def, state.round, { intensityDelta: 1, sourceId: 'mirror-of-guilt' });
                        enemy = { ...enemy, effects: mirrored.activeEffects };
                    }
                }
            }
            if (eff.enemyHeal && eff.enemyHeal > 0 && !doubtId) {
                const healAmt = Math.round(eff.enemyHeal * getHealingReceivedMult(enemy));
                if (healAmt > 0) {
                    enemy = decayDotsOnHeal(heal(enemy, healAmt)).combatant;
                }
            }
            penaltiesApplied.push(eff);
        }
        // A fired DOUBT / OVEREXTENDED is spent on the phase it bent (consumedOnUse).
        if (doubtId) enemy = consumeEffect(enemy, doubtId);
        if (overextendedId) enemy = consumeEffect(enemy, overextendedId);
        // RIPOSTE counter — spec 32 v3: fires only when your Guard/Barrier FULLY
        // blocked an attack this phase (reflect class, §1 source 4).
        if (riposte && attacksLanded > 0 && attacksFullyBlocked > 0) {
            const counter = Math.round(riposte.damage * getDamageTakenMultiplier(enemy));
            if (counter > 0) {
                enemy = applyDamage(enemy, counter);
                directDamage += counter;
                events.push({ kind: 'riposte-fired', amount: counter });
            }
        }
        // THORNS reflect — punishes the swing whenever the enemy attacked.
        const reflect = getThornsReflect(state.player);
        if (reflect > 0 && attacksLanded > 0) {
            const amount = Math.round(reflect * getDamageTakenMultiplier(enemy));
            enemy = applyDamage(enemy, amount);
            directDamage += amount;
            events.push({ kind: 'thorns-reflected', amount, target: 'enemy' });
            // `hedgehogs-dilemma` (E): every THORNS trigger also marks the enemy.
            if (zoneHas(state, 'hedgehogs-dilemma')) {
                const markDef = lookupEffectDef('debuff_mark');
                if (markDef) {
                    const applied = applyEffect(enemy.effects, markDef, state.round, { intensityDelta: 1, sourceId: 'hedgehogs-dilemma' });
                    enemy = { ...enemy, effects: applied.activeEffects };
                }
            }
        }
        events.push({ kind: 'threat-fired', phaseIndex: phase.index, description: phase.threatAction.description, effects: phase.threatAction.effects });
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

    // `mirror-of-longing` (D): the damage your defenses prevented converts to
    // SWAY — their aggression argues your case (spec 32 v3 T8).
    let sway = state.sway ?? 0;
    if (zoneHas(state, 'mirror-of-longing') && damagePrevented > 0) {
        // Routed through gainSway (not a bare `sway += amount`) so
        // buff_grace_momentum's per-stack multiplier applies here too, not
        // just to card-driven SWAY gains (2026-07-08 Grace rebalance).
        sway = gainSway({ ...state, player, sway }, damagePrevented, events).sway ?? sway;
    }
    // `crumbling-resolve` (D): an attack that failed to break your Guard costs
    // the enemy a rung on its NEXT telegraph.
    const crumbleRungs = zoneHas(state, 'crumbling-resolve') && attacksFullyBlocked > 0 ? 1 : 0;
    // Bastion engagement fix (2026-07-08): the deck's whole kit (guard/thorns/
    // riposte) previously did NOTHING if the enemy never physically attacked
    // — "guard held, thorns had nothing to punish" against heart/mind casters
    // was a dead hand. crumbling-resolve now ALSO drips direct damage every
    // phase, unconditionally, off whatever guard+barrier is standing — the
    // wall doesn't need to be struck to collect. Reads `guard`/`barrier`
    // BEFORE the `guard: 0` reset below, so this fires the same phase the
    // soak pool was built, whether or not the enemy ever swung into it.
    if (zoneHas(state, 'crumbling-resolve') && guard + barrier > 0 && !isDefeated(enemy)) {
        const upkeepDrip = Math.max(4, Math.round(0.2 * (guard + barrier)));
        enemy = applyDamage(enemy, upkeepDrip);
        directDamage += upkeepDrip;
        events.push({ kind: 'dot-tick', effectId: 'crumbling-resolve', label: 'Wall Upkeep', amount: upkeepDrip, target: 'enemy' });
    }
    // `achilles-and-the-tortoise` (E): a denied turn feeds your next draw.
    const bonusDraw = zoneHas(state, 'achilles-and-the-tortoise') && hindered ? 1 : 0;

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

    let next: CombatEncounterState = {
        ...state,
        player,
        enemy,
        sway,
        directDamageDealt: directDamage,
        guard: 0,                       // brace is spent on this phase's threat; resets each phase
        barrier,                        // persistent soak — carries the unspent remainder across phases
        riposte: undefined,             // cleared each phase (like guard)
        staggerRungs: crumbleRungs,     // consumed this phase; crumbling-resolve seeds the next
        bossRungGrowth: nextBossRungGrowth,
        phase: 'phase-resolve',
        threatMarks,
        phaseResults: [...state.phaseResults, result],
    };
    next = withLog(next, events);

    // Outcome checks after the threat action (HP + capitulation).
    if (swayCapitulates(next)) return endCombat(next, 'capitulate', events);
    const outcome = pendingOutcome(next);
    if (outcome) return endCombat(next, outcome, events);

    // Otherwise advance to between-phases.
    return processBetweenPhases(next, rng, events, bonusDraw);
}

/** Returns a terminal outcome if one is pending, else null (HP model). */
function pendingOutcome(state: CombatEncounterState): CombatEncounterState['finalOutcome'] {
    if (isDefeated(state.player)) return 'defeat';
    if (isDefeated(state.enemy)) return 'victory';
    return null;
}

/**
 * Between-phases processing (§4.5): DoT ticks erode HP (start+end phase) on both
 * sides, effect durations tick, and a fresh hand of 5 is drawn. Advances the
 * phase pointer (looping the final phase so the enemy keeps attacking).
 */
export function processBetweenPhases(
    state: CombatEncounterState,
    rng: () => number = defaultRng,
    priorEvents: CombatEvent[] = [],
    bonusDraw: number = 0,
): CombatTransition {
    const events: CombatEvent[] = [];

    // 1. Per-effect DoT ticks (labeled, §7.5) — computed before processing.
    //    Round-threaded so escalating DoTs (POISON ramp) tick their real value.
    const enemyDotTicks = dotTickBreakdown(state.enemy.effects, state.round);
    const playerDotTicks = dotTickBreakdown(state.player.effects, state.round);

    // 2. Process a full round of effects on the enemy — DoT ERODES real enemy HP
    //    (the status damage engine; no track, the HP loss is the win progress).
    const enemyStart = processRoundStartEffects(state.enemy, state.round);
    // `the-tithe` (D): enemy afflictions expire 1 turn sooner — an EXTRA
    // duration decrement before the normal end-of-round tick (faster churn →
    // faster Souls). Spec 32 v3 T7.
    let tithedTarget = enemyStart.target;
    const tithedExpired: ActiveEffect[] = [];
    if (zoneHas(state, 'the-tithe')) {
        const remaining: ActiveEffect[] = [];
        for (const ae of tithedTarget.effects) {
            if (ae.remainingDuration === -1 || lookupEffectDef(ae.effectId)?.type !== 'debuff') {
                remaining.push(ae);
                continue;
            }
            const ticked = { ...ae, remainingDuration: ae.remainingDuration - 1 };
            if (ticked.remainingDuration <= 0) tithedExpired.push(ticked);
            else remaining.push(ticked);
        }
        tithedTarget = { ...tithedTarget, effects: remaining };
    }
    const enemyEnd = processRoundEndEffects(tithedTarget, state.round);
    let enemy = enemyEnd.target as Enemy;

    // SOUL economy (spec 32 v3 T7): every enemy affliction instance that
    // EXPIRES yields 1 Soul (consumption-side Souls are granted at the verbs).
    const expiredAfflictions = [...enemyEnd.expired, ...tithedExpired]
        .filter(ae => lookupEffectDef(ae.effectId)?.type === 'debuff').length;

    // `suppurating-curse` (D): the enemy takes bonus HP loss equal to the
    // REAL DAMAGE its DoTs ticked for this round (Erosion late-stage
    // rebalance, 2026-07-08 — was a flat +1 HP per distinct tick regardless
    // of that tick's size, which undersold the printed text "every tick...
    // costs one more" against four-digit late-stage HP pools; now it
    // genuinely doubles the deck's total DoT throughput for the rest of
    // combat, matching a tick-DAMAGE reading instead of a tick-COUNT one).
    if (zoneHas(state, 'suppurating-curse') && enemyDotTicks.length > 0 && !isDefeated(enemy)) {
        const drip = enemyDotTicks.reduce((sum, t) => sum + t.amount, 0);
        enemy = applyDamage(enemy, drip);
        events.push({ kind: 'dot-tick', effectId: 'suppurating-curse', label: 'Suppuration', amount: drip, target: 'enemy' });
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
        vulnSurcharge = Math.round(naturalDot * (enemyVulnMult - 1));
        if (vulnSurcharge > 0) enemy = applyDamage(enemy, vulnSurcharge);
    }

    // 3. Process a full round of effects on the player (DoT / regen / drain).
    const playerStart = processRoundStartEffects(state.player, state.round);
    const playerEnd = processRoundEndEffects(playerStart.target, state.round);
    let player = playerEnd.target as Character;

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

    const candidateIndex = Math.min(state.currentPhaseIndex + 1, state.threatPhases.length - 1);
    const candidatePhase = state.threatPhases[candidateIndex];
    const rageGated = candidatePhase.unlockAfterRound !== undefined && resolvedRound < candidatePhase.unlockAfterRound;
    const nextIndex = rageGated ? state.currentPhaseIndex : candidateIndex;

    // ARROW PARADOX (spec 32 v3 T5, `lock_stance`) — the next phase keeps the
    // CURRENT stance: motion frozen mid-flight. The lock is revealed and spent.
    let threatPhases = state.threatPhases;
    let revealedStances = state.revealedStances;
    if (state.stanceLockedNext && nextIndex !== state.currentPhaseIndex) {
        const lockedStance = currentPhaseStance(state);
        threatPhases = threatPhases.map((p, i) => (i === nextIndex ? { ...p, enemyStance: lockedStance } : p));
        if (!revealedStances.includes(nextIndex)) revealedStances = [...revealedStances, nextIndex];
        events.push({ kind: 'stance-locked', phaseIndex: nextIndex, stance: lockedStance });
    }

    // OMENS resolve at the phase boundary (spec 32 v3 T6): a prediction that
    // matches the INCOMING phase's stance HITS — its rider fires free
    // (`the-oracles-eye` amplifies; `fated-course` marks the foe on a hit).
    let omenHits = state.omenHits ?? 0;
    let omenState: CombatEncounterState = {
        ...state, player, enemy, threatPhases, revealedStances,
    };
    // Cards an omen rider draws must survive the fresh-hand redraw below —
    // fold them into the draw count instead of drawing into the doomed hand.
    let omenBonusDraw = 0;
    const pendingOmens = state.pendingOmens ?? [];
    if (pendingOmens.length > 0) {
        // `fated-course` (D): a "curse of inevitability" — while it is attached,
        // the enemy's next telegraph is FORCED to the stance a pending omen named
        // for that phase, so the prophecy cannot miss (its mark is guaranteed and
        // the named future is the only one left to them).
        let phasesForOmen = threatPhases;
        if (zoneHas(state, 'fated-course')) {
            const forcing = pendingOmens.find(o => o.phaseIndex === nextIndex);
            if (forcing && phasesForOmen[nextIndex]) {
                phasesForOmen = phasesForOmen.map((p, i) =>
                    i === nextIndex ? { ...p, enemyStance: forcing.stance } : p);
                omenState = { ...omenState, threatPhases: phasesForOmen };
            }
        }
        const incomingStance = phasesForOmen[nextIndex]?.enemyStance;
        const remaining: typeof pendingOmens = [];
        for (const omen of pendingOmens) {
            if (omen.phaseIndex !== nextIndex) {
                // A stale omen (phase looped past it) simply misses.
                events.push({ kind: 'omen-missed', cardId: omen.cardId, phaseIndex: omen.phaseIndex });
                continue;
            }
            if (omen.stance === incomingStance) {
                omenHits += 1;
                const omenCard = lookupCard(omen.cardId);
                const omenMech = (omenCard?.specialMechanics ?? []).find(m => m.kind === 'omen') as
                    Extract<CardSpecialMechanic, { kind: 'omen' }> | undefined;
                if (omenMech) {
                    // `the-oracles-eye` (E): omen riders land +50% (rounded up)
                    // on their numeric fields.
                    const eye = zoneHas(state, 'the-oracles-eye');
                    const amp = (n: number | undefined): number | undefined =>
                        n === undefined ? undefined : (eye ? Math.ceil(n * 1.5) : n);
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
                    // drawCards rides the fresh hand (drawn below) — drawing
                    // into the current hand would be wiped by the redraw.
                    omenBonusDraw += rider.drawCards ?? 0;
                    omenState = applyRiderToState(
                        omenState, omen.cardId, { ...rider, drawCards: undefined }, events, rng,
                    );
                }
                if (zoneHas(state, 'fated-course')) {
                    const markDef = lookupEffectDef('debuff_mark');
                    if (markDef) {
                        const applied = applyEffect(omenState.enemy.effects, markDef, state.round, { intensityDelta: 1, sourceId: 'fated-course' });
                        omenState = { ...omenState, enemy: { ...omenState.enemy, effects: applied.activeEffects } };
                    }
                }
            } else {
                events.push({ kind: 'omen-missed', cardId: omen.cardId, phaseIndex: nextIndex });
            }
        }
        omenState = { ...omenState, pendingOmens: remaining };
        // An omen-granted Premise may complete a CONCEDE-grade Peroration.
        if (omenState.finalOutcome === 'concede') {
            return { state: withLog(omenState, events), events: [...priorEvents, ...events] };
        }
    }

    // SOULS from expiry (base law: 1 per expired enemy affliction instance).
    if (expiredAfflictions > 0) {
        omenState = gainSouls(omenState, expiredAfflictions, 'expiry', events);
    }

    // SWAY decays at the turn boundary (ratified A2) unless `irresistible-grace`
    // holds it; `captive-audience` (D) keeps the enemy marked while you hold
    // 4+ Premises.
    let sway = omenState.sway ?? 0;
    if (sway > 0 && !zoneHas(state, 'irresistible-grace')) {
        sway = Math.max(0, sway - SWAY_DECAY_PER_TURN);
        events.push({ kind: 'sway-decayed', total: sway });
    } else if (sway > 0 && zoneHas(state, 'irresistible-grace')) {
        // Grace late-stage rebalance (2026-07-08): every turn boundary the
        // player holds SWAY continuously under Irresistible Grace's decay
        // immunity, buff_grace_momentum stacks one further (capped at
        // GRACE_MOMENTUM_MAX_STACKS) — "protect the stack" becomes a real,
        // compounding payoff (read by gainSway) instead of just a floor.
        const momentumDef = lookupEffectDef('buff_grace_momentum');
        if (momentumDef) {
            const current = omenState.player.effects.find(e => e.effectId === 'buff_grace_momentum');
            const GRACE_MOMENTUM_MAX_STACKS = 9;
            if (!current || current.intensity < GRACE_MOMENTUM_MAX_STACKS) {
                const applied = applyEffect(omenState.player.effects, momentumDef, state.round, {
                    intensityDelta: 1, sourceId: 'grace-momentum',
                });
                omenState = { ...omenState, player: { ...omenState.player, effects: applied.activeEffects } };
                events.push({
                    kind: 'effect-landed', cardId: 'irresistible-grace', effectId: 'buff_grace_momentum', target: 'self',
                    effectKind: 'none', intensity: applied.result.activeEffect?.intensity ?? 1, effect: momentumDef,
                });
            }
        }
    }
    omenState = { ...omenState, sway };
    if (zoneHas(state, 'captive-audience') && (omenState.premises ?? 0) >= 4) {
        const markDef = lookupEffectDef('debuff_mark');
        if (markDef) {
            const applied = applyEffect(omenState.enemy.effects, markDef, state.round, { intensityDelta: 1, sourceId: 'captive-audience' });
            omenState = { ...omenState, enemy: { ...omenState.enemy, effects: applied.activeEffects } };
        }
    }

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

    // 5. Draw a fresh hand (discard the old hand — Hazard's "draw fresh").
    //    `achilles-and-the-tortoise` adds +1 to the draw after a denied turn.
    const discardedHand = omenState.hand.map(h => h.cardId);
    const draw = drawCombatCards(
        omenState.drawPile, [...omenState.discard, ...discardedHand], omenState.deck,
        COMBAT_HAND_SIZE + bonusDraw + omenBonusDraw, rng,
    );
    let uid = state.round * 100;
    const hand = draw.drawn.map(cardId => ({ uid: `c${++uid}`, cardId }));
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

    let next: CombatEncounterState = {
        ...omenState,
        reserve,
        omenHits,
        stanceLockedNext: false,
        currentPhaseIndex: nextIndex,
        drawPile: draw.drawPile,
        discard: draw.discard,
        hand,
        phase: 'phase-play',
        round: state.round + 1,
        tempZone: tickedTempZone,
        enemyTempAttachments: tickedEnemyTemp,
        // New phase → fresh turn; clear the draft so the next startTurn rolls.
        dice: [],
        draftedDieId: null,
        lastRead: 'none',
        carriedDie: null,
    };
    next = withLog(next, events);

    // 6. Outcome checks after ticks (HP + capitulation).
    if (swayCapitulates(next)) return endCombat(next, 'capitulate', [...priorEvents, ...events]);
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
    return getActiveDotTotal(effects as ActiveEffect[], currentRound).perEffect.map(
        e => ({ effectId: e.effectId, label: e.label, amount: e.amount }),
    );
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
    if (working.draftedDieId !== null) working = endTurn(working).state;
    const started = startTurn(working, rng);
    working = started.state; events.push(...started.events);
    const enemyStance = currentPhaseStance(working);
    const pick = chooseDraft(working.dice, cardStance, enemyStance);
    if (pick) {
        const drafted = draftStanceDie(working, pick);
        working = drafted.state; events.push(...drafted.events);
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
        if (play.useBottom) {
            const card = getCard(play.cardId);
            const drafted = ensureDraftForCard(working, card?.stance ?? 'wild', rng);
            working = drafted.state; allEvents.push(...drafted.events);
        }
        const res = playCombatCard(working, { uid: play.uid, cardId: play.cardId }, play.useBottom, play.dieId, rng);
        working = res.state;
        allEvents.push(...res.events);
        if (working.finalOutcome) return { state: working, events: allEvents };
    }
    if (working.phase !== 'phase-play') return { state: working, events: allEvents };
    const resolved = resolveThreatPhase(working, rng);
    return { state: resolved.state, events: [...allEvents, ...resolved.events] };
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
 * immediate outcome (e.g. Overwhelming Argument saturating the control track).
 */
export function playSignatureSkill(
    state: CombatEncounterState,
    signatureId: string,
    rng: () => number = defaultRng,
): CombatTransition {
    if (state.phase !== 'phase-play') return { state, events: [] };
    const skill = getSignatureSkill(signatureId);
    if (!skill) return { state, events: [] };
    if (state.conviction < skill.cost) {
        const events: CombatEvent[] = [{ kind: 'effect-fizzled', cardId: skill.id, effectId: '', message: `need ${skill.cost} ◆ Conviction (have ${state.conviction})` }];
        return { state: withLog(state, events), events };
    }
    // Press Fate with no used/blocked dice to re-roll is a no-op — don't burn ◆.
    if (skill.kind === 'reroll' && !hasRerollableDice(state.dice)) {
        const events: CombatEvent[] = [{ kind: 'effect-fizzled', cardId: skill.id, effectId: '', message: 'no spent or blocked (X) dice to re-roll' }];
        return { state: withLog(state, events), events };
    }

    const spent: CombatEncounterState = { ...state, conviction: state.conviction - skill.cost };
    const applied = applySignatureSkill(spent, skill, rng);
    const events: CombatEvent[] = [
        { kind: 'signature-cast', signatureId: skill.id, name: skill.name, cost: skill.cost },
        ...applied.events,
    ];
    const next = withLog(applied.state, events);
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

/** True when the player has revealed a given phase's hidden enemy stance (§2).
 *  A MARKED foe (`revealsStance` payload — Fate Engine P1) is public on EVERY
 *  phase while the mark holds. */
export function isPhaseStanceRevealed(state: CombatEncounterState, phaseIndex: number): boolean {
    return state.revealedStances.includes(phaseIndex)
        || hasPayloadFlag(state.enemy, 'revealsStance') !== null
        // `the-oracles-eye` (E): the enemy's next stance is ALWAYS revealed.
        || (zoneHas(state, 'the-oracles-eye')
            && phaseIndex === Math.min(state.currentPhaseIndex + 1, state.threatPhases.length - 1));
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
 * at combat end (they persist across combats until spent).
 */
export function getFloatingDiceColors(
    state: CombatEncounterState,
): ('heart' | 'body' | 'mind' | 'wild')[] {
    return (state.floatingDice ?? [])
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
 * resolved phase mark === 'clear': hard skip, legacy roll-penalty deny, OR the
 * additive distinct-control deny).
 */
export function getDisruptMeter(state: CombatEncounterState): {
    pips: number; threshold: number; rollPenalty: number; willDeny: boolean;
} {
    const enemy = state.enemy;
    const pips = getDistinctControlCount(enemy);
    const rollPenalty = Math.max(0, -getActiveRollModifier(enemy));
    const act = canAct(enemy.effects as ActiveEffect[], currentPhaseStance(state));
    const willDeny = !act.canAct || rollPenalty >= THREAT_DENY_AT || pips >= DISRUPT_DENY_AT;
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
    const amount = Math.min(
        reapAllBurstCap(state.enemy.maxHealth),
        Math.round(mech.burstPerSoul * (state.souls ?? 0) * READ_DAMAGE_MULT[read] * getDamageTakenMultiplier(state.enemy)),
    );
    return { ready: amount > 0, amount };
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
}

export function projectCombatOutcome(state: CombatEncounterState): CombatOutcomeProjection {
    const pendingDot = getPendingDotTotal(state.enemy, state.round).total;
    const roundsToKill = computeRoundsToKill(state.enemy, state.round);
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
    return { pendingDot, roundsToKill, isLethalInFlight: roundsToKill !== null, finishers };
}

/** Re-export for presenters that need to check die affordability directly. */
export { combatDieCanPower, availableDiceFor, effectImpact, cardStanceColor, riderText };
