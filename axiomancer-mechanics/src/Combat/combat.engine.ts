/**
 * Spec 25 — Hazard-Pattern Combat: the engine (§4, §9).
 *
 * `resolveCombatPhase` drives the HP-model combat: the enemy's SOLE bar is HP,
 * and the player drops it to 0. Every verb is a combat card (projected from a
 * learned card); the player rolls stance dice and plays cards. Combat is
 * STATUS-FIRST — the auto-derived strike is dead (spec 32 §12): enemy HP
 * falls through a printed status or its payoff (DoT ticks, affliction bursts
 * like RUPTURE/REAP, ratified enchant-gated drips, reflect) or, since THE
 * BIG NUMBERS REWRITE (2026-09-02), the authored `deal` damage family.
 * Control hinders the enemy's turn instead. The legacy resolver,
 * the effects engine, the card engine, and all effects are UNCHANGED — this
 * engine *drives* `executeCard` / `applyEffect` differently.
 *
 * Card bottom actions execute through the unchanged `executeCard`: one live die
 * from the spec-33 tray (or the Reserve / a GHOST die) is the card's whole
 * cost — combat cards carry no resource cost.
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
import { MAX_EFFECT_INTENSITY } from '../Game/game-mechanics.constants';
import { lookupEffect, applyEffect } from '../Effects';
import type { Effect, ActiveEffect } from '../Effects/types';
import type { Character } from '../Character/types';
import type { Enemy } from '../Enemy/types';
import { getCardById } from '../Cards/cards.library';
import { executeCard } from '../Cards/card.engine';
import type { Card, CardAspect, CardRider } from '../Cards/types';
import type { CombatState, Stance } from './types';
import { applyDamage, heal, isDefeated, erodeMaxHealth } from './health';
import {
    processRoundStartEffects, processRoundEndEffects, getActiveRollModifier,
    getThornsReflect, getDamageTakenMultiplier, getPendingDotTotal,
    getDistinctControlCount,
    getHealingReceivedMult, getOutgoingDamageMult, getOutgoingThreatDamageMult, decayDotsOnHeal, consumeEffect,
    hasPayloadFlag, getStanceVulnMult, computeRoundsToKill,
    fireDotTrigger, growPerEnemyActionDots,
    applyCleanse,
    DISRUPT_DENY_AT,
} from './effects';
import {
    dieHasStance,
    combatDieCanPower, availableDiceFor, spendDice, availableDieCount,
    RESERVE_MAX, ripenReserve, materializeFloatingDice,
} from './combat.dice';
import {
    rollUpgradeableDice, rollGoldLeadPair,
    crackedColorsForTurn, expireCrackedDice, advanceMomentumV2, resolveStanceCheck,
    isChainStance, activeDieGear, tableHasRoom,
    UPGRADEABLE_TABLE_CEILING,
    OVERHEAT_CRACK_CHANCE, SPECIAL_FIRES_ON_USE, SURGE_DIE_PREFIX, COVETED_DIE_PREFIX,
} from './combat.upgradeable-dice';
import {
    COMBAT_HAND_SIZE, buildCombatDeck, drawCombatCards, shuffleCombatDeck,
} from './combat.deck';
import {
    toCombatCard, cardStanceColor, effectImpact, riderText,
} from './combat.cards';
import { recordAttribution } from './combat.attribution';
import { scaleFor, scaleEffectIntensity, scaleCardForStats } from './stat-scaling';
import { canAct, getActiveEffectModifiers, getActiveDotTotal, dotRoundClockPhase } from './effect-modifiers';
import { getThreatSequence, commitThreatBranch } from './combat.threat';
import { getSignatureSkill, applySignatureSkill, signatureCastBlock, playerArchetype } from './combat.signature';
import { getSignaturesForLoadout } from '../Items/relic.library';
import type {
    CombatCard, CombatDieColor, CombatEncounterState, CombatEvent, CardPlay,
    CombatManaDie, CombatPhaseResult, CombatTransition, LandedEffect, CombatReadResult,
    CombatThreatEffect,
} from './combat.encounter.types';

// ── Tunable constants (HP model) ─────────────────────────────────────────────

/** Safety cap on total phases processed — prevents a degenerate stalemate loop. */
const MAX_PHASES = 60;

// ── Stance-check rails & color-match tuning ──────────────────────────────────

/** The advantage / disadvantage rails. Spec 33 retired the hidden-stance read
 *  (every play lands at its printed numbers); the rails now price the open
 *  stance checks at phase end — `punishes` lands the telegraphed hit at
 *  `advantage` (x1.5), `yields` blunts it to `disadvantage` (x0.5). */
export const READ_DAMAGE_MULT: Record<CombatReadResult, number> = {
    advantage: 1.5, neutral: 1.0, disadvantage: 0.5, none: 1.0,
};
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
 * Tuned by /combat-playtest (engine constants) and /deck-tuning. Exported so the mobile presenter can state the honest
 * "-X% enemy attack" a control card actually delivers. (Until 0.33.0 the HP
 * engine never read these mods, so ~24 control/stat debuffs were inert.)
 */
export const THREAT_WEAKEN_PER_ROLL = 0.06;
export const THREAT_DENY_AT = 8;
export const THREAT_WEAKEN_FLOOR = 0.4;
/** Conviction is capped so a long grind can't bank a Signature spam. */
export const CONVICTION_CAP = 12;
/** WI-10 — how many scraps per turn PAY +1 Conviction. The hand refills to
 *  COMBAT_HAND_SIZE (then 6, now 5), so an ungated scrap paid a full hand of ◆
 *  per turn against the 12 cap (scrap-the-hand). Beyond
 *  this many, a scrap still cycles the dead card but pays nothing. Tunable under
 *  EA-2's baseline. */
export const SCRAP_CONVICTION_CAP_PER_TURN = 2;
// Spec 32 v3 §1 — DIRECT_DAMAGE_WEIGHT is DEAD: the strike was purged from the
// schema (`basePower` no longer exists), so there is no auto-derived strike
// path to weight. Direct damage exists only as the authored `deal` family
// (THE BIG NUMBERS REWRITE), scaled by `scalePlayerHit`.

// ── Depth epic (combat-depth-epic) ───────────────────────────────────────────

/**
 * THE CLOCK. The enemy's telegraphed hit ESCALATES the longer a fight runs: each
 * round past THREAT_ESCALATION_GRACE multiplies the incoming threat damage by
 * (1 + THREAT_ESCALATION_PER_ROUND × roundsPastGrace). A drawn-out fight turns
 * lethal — so a careless or over-cautious line loses where before combat was
 * unloseable. The counters are on-vision: race the foe down (DoT) before the ramp
 * bites, OR deny its turns (control) to skip the escalated hits. This is also what
 * finally gives the threat ledger teeth — every round the clock advances is a round
 * the 'overwhelmed' marks were paid for. Tuned by /combat-playtest (engine constants) and /deck-tuning.
 */
export const THREAT_ESCALATION_PER_ROUND = 0.22;
/** Rounds of grace before the clock starts — a fast clean kill is unpunished. */
export const THREAT_ESCALATION_GRACE = 1;
/** Cap on the escalation multiplier so a long grind ramps but never runs away into a
 *  one-shot — keeps the clock tense, not a hard wall. Calibrated conservatively: the
 *  optimal witness bot still wins (combat stays fair, not broken) while human-paced
 *  play feels real pressure. Sharpening the bands further is a /combat-playtest (engine constants) and /deck-tuning job that
 *  hinges on the denial/kill-speed economy (the optimal bot kills in ~2-4 rounds and
 *  barely feels the clock). */
export const THREAT_ESCALATION_MAX = 2.0;
/**
 * Boss/unique enemies escalate FASTER than normal foes — the per-round rate is
 * multiplied by this factor for `difficulty === 'boss' | 'unique'`. Implements
 * the "steeper curve for bosses" doctrine: a boss fight that drags becomes
 * qualitatively more lethal than a normal fight dragging just as long. The
 * counters (finish fast via DoT, deny turns via control) are unchanged — they
 * are simply more urgent facing a boss. Tuned by /combat-playtest (engine constants) and /deck-tuning.
 */
export const THREAT_ESCALATION_BOSS_MULT = 1.6;
/**
 * THE CLOCK also intensifies enemy-inflicted STATUS effects, not just raw
 * damage: every THREAT_EFFECT_ESCALATION_STEP of escalation growth
 * (`escalation - 1`, the SAME clock as THREAT_ESCALATION_*, already boss-
 * scaled and already capped at THREAT_ESCALATION_MAX) adds +1 intensity to
 * whatever status the enemy's telegraphed hit applies this phase. Reuses the
 * damage clock's numbers instead of a second independent tuning knob, so it
 * ramps and caps on exactly the same schedule. Tuned by /combat-playtest (engine constants) and /deck-tuning.
 */
export const THREAT_EFFECT_ESCALATION_STEP = 0.34;
// ── Fate Engine P1 (spec 31 §1) — the dice get a second read ─────────────────

/** R2 — each pip on a spent Reserve die adds this much intensity to the status
 *  the play lands (the ripened die hits harder). Tuned by /combat-playtest (engine constants) and /deck-tuning. */
export const PIP_INTENSITY_BONUS = 2;
/** R2 — each pip on a spent Reserve die adds this much Guard on a defend card.
 *  THE BIG NUMBERS REWRITE — raised 2 → 5 so a ripened die is worth banking
 *  against GUARD lines that now open at 8 and reach 60. */
export const PIP_GUARD_BONUS = 5;
/** R7 — a color-matched (or Wild) die on a STATUS card extends the landed
 *  status by this many turns. Strike/defend keep the flat +3 damage bonus. */
export const COLOR_MATCH_STATUS_DURATION_BONUS = 1;

// ── THE BIG NUMBERS REWRITE (2026-09-02) — the damage-scaler constants ───────

/** The most every STAGE a foe has entered can add to its later phases,
 *  combined. Stage bonuses stack on top of the escalation clock, so this is
 *  what keeps a staged boss escalating instead of detonating. */
export const STAGE_THREAT_BONUS_CAP = 0.5;


const defaultRng = (): number => getRng().random();

// ── Card / lookup adapters ──────────────────────────────────────────────────

const lookupCard = (id: string): Card | undefined => getCardById(id);
const lookupEffectDef = (id: string): Effect | undefined => lookupEffect(id);

/** Projects a card id into its card view (card or synthetic). */
export function getCard(cardId: string): CombatCard | null {
    return toCombatCard(cardId, lookupCard, lookupEffectDef);
}

// ── Internal helpers ─────────────────────────────────────────────────────────

/** Builds the legacy `CombatState` shim `executeCard` needs. */
function cardShim(enc: CombatEncounterState): CombatState {
    return {
        active: true,
        phase: 'resolving',
        round: enc.round,
        player: enc.player,
        enemy: enc.enemy,
        playerChoice: {},
        enemyChoice: {},
    };
}

/** THE COLOR LAW (dice-law rework 2026-07-09): a die powers only a card of ITS
 *  color; WILD (gold) matches every card, and a grey 'any' card (Phase 104)
 *  accepts every die colour. The single definition `playBottomAction` and
 *  `firstLegalPoweringDie` share. */
function dieSatisfiesColorLaw(die: CombatManaDie, cardStance: CombatDieColor | CardAspect): boolean {
    return cardStance === 'any' || die.color === 'wild' || die.color === cardStance;
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
    // so the player can answer it with certainty. Previously
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
        turn: 0,
        // Gate 0 (round-turn law) — no tray rolled yet this phase.
        turnTakenThisPhase: false,
        conviction: 0,
        revealedStances: [],
        // `archetype` is kept for the mobile portrait flavour only — it no
        // longer selects signatures (Phase 19). Signatures come from the worn
        // signet-relic loadout.
        archetype: playerArchetype(clonedPlayer),
        signatures: getSignaturesForLoadout(clonedPlayer.equipment),
        deck,
        drawPile: draw.drawPile,
        discard: draw.discard,
        hand,
        floatingDice,
        souls: 0,
        spellsPlayedThisTurn: 0,
        // Spec 32 §12 #4 — the combat ledgers start empty.
        enemyDamageThisTurn: 0,
        enemyDamageLastRound: 0,
        lastThreatFullyBlocked: false,
        threatPhases,
        threatMarks: threatPhases.map(() => 'pending'),
        currentPhaseIndex: 0,
        phaseResults: [],
        round: 1,
        attribution: {},
        guard: 0,
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
 * turn. The granular path is `startTurn` → play → `endTurn`.
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
 * Spec 33 §1 — starts a round: rolls the four fixed dice (one per colour, from
 * each die's gear face table), plus any act-reward dice, the gold+lead pair
 * (the spec-33 reading of `permanentWildDice`, cap 1 pair) and the floating
 * (GHOST / surge) dice. OVERHEAT cracks bite here (all-miss, then consumed).
 * The 7-object table ceiling converts the overflow to +1◆ by materialization
 * priority (permanent pool → Reserve → KINDLE → surge/floating). No-op outside
 * phase-play.
 */
export function startTurn(
    state: CombatEncounterState,
    rng: () => number = defaultRng,
): CombatTransition {
    if (state.phase !== 'phase-play') return { state, events: [] };
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
        // The tray/turn are untouched — only the log records the attempt
        // (auditor transcripts must show illegal rolls being refused).
        return { state: withLog(state, blocked), events: blocked };
    }
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
    const next: CombatEncounterState = {
        ...state, dice, reserve, floatingDice, conviction, turn,
        crackedDice: expireCrackedDice(state.crackedDice, turn),
        spellsPlayedThisTurn: 0,
        // WI-1 — the enemy-DoT accumulator is per-round; a fresh turn zeroes it
        // so `suppurating-curse` only doubles THIS round's real DoT total.
        // WI-10 — the per-turn scrap-pay counter resets with the turn.
        enemyDotDamageThisRound: 0, scrapsThisTurn: 0,
        // Gate 0 — this phase's one legal tray roll is now taken.
        turnTakenThisPhase: true,
    };
    events.push({ kind: 'turn-dice-rolled', turn, dice });
    events.push({ kind: 'dice-rolled', dice });
    return { state: withLog(next, events), events };
}

/** Spec 33 §6 — ends the turn: at end of round, ONE unspent mana/special tray
 *  die banks to the Reserve (cap RESERVE_MAX), best face first (special >
 *  mana — a banked special still fires its payload when spent from the
 *  Reserve, use-triggered). Unbanked dice simply expire — misses were always
 *  worth 0◆ and unspent mana earns nothing (§1: income is specials + yield
 *  bonuses only, never leftovers). */
export function endTurn(state: CombatEncounterState): CombatTransition {
    if (state.phase !== 'phase-play') return { state, events: [] };
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
    const next: CombatEncounterState = { ...state, dice: [], reserve };
    return { state: withLog(next, events), events };
}

/**
 * Spec 33 §6 — OVERHEAT, reinterpreted: push an already-SPENT
 * tray die back to `available` so it can power a SECOND card this round. The
 * push always succeeds; the RISK is the crack — `OVERHEAT_CRACK_CHANCE` that
 * the die is all-miss NEXT round.
 * The second play is a normal paid play: it moves stance and momentum. Any
 * die may be overheated, gold included. Cards carry this verb from D4; the
 * engine primitive ships here so D3's policies can exercise it.
 */
export function overheatSpentDie(
    state: CombatEncounterState,
    dieId: string,
    rng: () => number = defaultRng,
): CombatTransition {
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
 * Plays one card from hand. `useBottom` powers the full effect (costs the named
 * die, executes the card, drives impact + the die-refresh loop); the free top
 * action fires the card's authored FREE rider with no die.
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

    const transition = useBottom
        ? playBottomAction(state, entry.uid, card, dieId, rng)
        : playTopAction(state, entry.uid, card, rng);
    // Spec 33 — stance-from-cards + the null-reset momentum chain; FREE plays
    // never touch either (§3 rule 5).
    return applyStanceAndMomentumV2(state, transition, card.stance, useBottom);
}

/**
 * Spec 33 §2/§3 — post-play bookkeeping for a LANDED PAID play:
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
    stance: CombatDieColor | CardAspect,
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
 * per turn PAY. The hand refills to COMBAT_HAND_SIZE (then 6, now 5), so an
 * ungated scrap-the-hand banked a full hand of ◆ per turn against the 12 cap; beyond the cap a scrap still cycles the dead card
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
    const next: CombatEncounterState = {
        ...state,
        hand: state.hand.filter(h => h.uid !== uid),
        discard: [...state.discard, entry.cardId],
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

// ── Spec 32 v3 — shared rider/state helpers ──────────────────────────────────

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
 * The scalers a single player hit picks up on its way to the foe, folded in
 * one place so every damage source (the `deal` mechanic, a FREE-line
 * `damage`) reads the same rules. Order is authored:
 *   1. the READ multiplier
 *   2. the colour-match bonus, as a percentage of what the read left
 *   3. VULNERABLE — the foe's incoming-damage multiplier (S3, D41: last of
 *      the multipliers, uncapped). The caller scales `base` by body first.
 */
export interface PlayerHitParams {
    base: number;
    readMult: number;
    colorMatch: boolean;
    /** VULNERABLE on the foe (`getDamageTakenMultiplier`); 1 when absent. */
    vulnMult?: number;
}

export function scalePlayerHit(params: PlayerHitParams): number {
    if (params.base <= 0) return 0;
    let dmg = Math.round(params.base * params.readMult);
    if (params.colorMatch) dmg += colorMatchBonus(dmg);
    if (params.vulnMult !== undefined && params.vulnMult !== 1) dmg = Math.round(dmg * params.vulnMult);
    return Math.max(0, dmg);
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

/** SOUL gain (Harvest): bumps the bank (spec 32 v3 §1 source 3). */
function gainSouls(
    state: CombatEncounterState,
    amount: number,
    reason: 'expiry' | 'consumed' | 'granted',
    events: CombatEvent[],
): CombatEncounterState {
    if (amount <= 0) return state;
    const souls = (state.souls ?? 0) + amount;
    events.push({ kind: 'soul-gained', amount, total: souls, reason });
    return { ...state, souls };
}

/**
 * Applies a `CardRider` against the encounter state — the executor for FREE
 * lines. Every field is a real engine unit.
 */
function applyRiderToState(
    state: CombatEncounterState,
    cardId: string,
    r: CardRider,
    events: CombatEvent[],
): CombatEncounterState {
    let player = state.player;
    let enemy = state.enemy;
    let directDamage = state.directDamageDealt;
    let guard = state.guard ?? 0;
    let souls = state.souls ?? 0;
    const washedOutHere: ActiveEffect[] = [];
    // S3 (D40–D41) — every number a rider prints scales by the stat of where
    // it lands: damage by body, guard by mind, a status by heart (on the foe)
    // or mind (on you). See `stat-scaling.ts`.
    const stats = player.baseStats;

    if (r.guard) guard += scaleFor(r.guard, stats, 'mind', 'one-shot');
    // Attribution ledger (playtest fix 2026-09-04): the FREE line records
    // provenance with the same `recordAttribution` calls as the PAID path.
    let attribution = state.attribution;
    const cardName = lookupCard(cardId)?.name ?? cardId;
    if (r.damage) {
        // A FREE-line hit takes no colour match: the printed number is the
        // number, scaled by body and VULNERABLE.
        const dmg = scalePlayerHit({
            base: scaleFor(r.damage, stats, 'body', 'one-shot'),
            readMult: 1,
            colorMatch: false,
            vulnMult: getDamageTakenMultiplier(enemy),
        });
        if (dmg > 0) {
            const hpBefore = enemy.health;
            const hit = applyEnemyDamage(enemy, dmg, state.round, events);
            enemy = hit.enemy;
            directDamage += dmg + hit.clockDamage;
            washedOutHere.push(...hit.washedOut);
            attribution = recordAttribution(attribution, cardId, cardName, null, dmg, hpBefore);
            events.push({ kind: 'damage-dealt', cardId, target: 'enemy', amount: dmg });
        }
    }
    if (r.applyEffect) {
        const def = lookupEffectDef(r.applyEffect.effectId);
        if (def) {
            const toSelf = r.applyEffect.to === 'self';
            const bearer = toSelf ? player : enemy;
            const applied = applyEffect(bearer.effects, def, state.round, {
                intensityDelta: scaleEffectIntensity(def, r.applyEffect.intensity ?? 1, toSelf, stats),
                uncapped: true,
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

    const washSouls = soulWorthyWashouts(washedOutHere);
    if (washSouls > 0) {
        souls += washSouls;
        events.push({ kind: 'soul-gained', amount: washSouls, total: souls, reason: 'expiry' });
    }
    return { ...state, player, enemy, directDamageDealt: directDamage, guard, souls, attribution };
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
 * expiry Souls, player-borne ones do not.
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
 */
function playTopAction(
    state: CombatEncounterState,
    uid: string,
    card: CombatCard,
    _rng: () => number,
): CombatTransition {
    const sourceCard = lookupCard(card.id);
    const events: CombatEvent[] = [
        { kind: 'card-played', cardId: card.id, useBottom: false, dieId: null, advantage: 'neutral' },
    ];
    let next = discardEntry(state, uid);
    // WS3.3 pre-play stack snapshot: only stacks that existed BEFORE this
    // play are on the 'card-played' clock (a FREE line's own fresh POISON
    // never ticks itself). Taken before the rider so a free-line apply is
    // "fresh" exactly as a PAID apply is.
    const enemyPrePlay = intensityMap(state.enemy.effects);
    const playerPrePlay = intensityMap(state.player.effects);
    if (sourceCard?.free) {
        next = applyRiderToState(next, card.id, sourceCard.free, events);
    }
    next = fireFreePlayClock(next, enemyPrePlay, playerPrePlay, events);
    next = withLog(next, events);
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

    // 1. Resolve the POWERING die — spec 33 §1: no draft, no single-die law.
    //    ANY available die (tray mana/special face, Reserve, or floating) may
    //    power a paid line; the color law below still gates it. The dieId is
    //    REQUIRED — there is no implicit default die.
    const reserveIn = state.reserve ?? [];
    let powering: CombatManaDie;
    let poweringSource: 'reserve' | 'floating' | 'tray';
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
        poweringSource = 'tray';
    } else {
        const events: CombatEvent[] = [{
            kind: 'effect-fizzled', cardId: card.id, effectId: '',
            message: tray?.face === 'miss'
                ? 'a miss face is dead — it powers nothing this round'
                : 'that die cannot power this card',
        }];
        return { state: withLog(state, events), events };
    }

    // 1b. THE COLOR LAW (dice-law rework 2026-07-09): a die can only power a
    //     card of ITS color. WILD (gold) is the sole exception — it matches
    //     every card. Applies to every power source: tray, Reserve, and
    //     floating alike. Phase 104 — a card of aspect 'any' (the grey office)
    //     has no colour to mismatch: every die colour powers it.
    if (!dieSatisfiesColorLaw(powering, card.stance)) {
        const events: CombatEvent[] = [{
            kind: 'effect-fizzled', cardId: card.id, effectId: '',
            message: `a ${powering.color} die cannot power a ${card.stance} card — colors must match`,
        }];
        return { state: withLog(state, events), events };
    }

    // 2. Color-match. Spec 33 §2 retired the hidden-stance read: every play
    //    lands at its printed numbers (the 1.5/0.5 rails belong to the open
    //    stance checks at phase end, `resolveThreatPhase`).
    // Phase 104 — a grey card's colour-match bonus is NEUTRAL: never on-colour
    // (even powered by wild), never off-colour.
    const colorMatch = card.stance !== 'any' && (powering.color === 'wild' || powering.color === card.stance);
    const poweringPips = powering.pips ?? 0;
    // S3 (D40–D41) — the player's stats scale this play's printed numbers
    // (`stat-scaling.ts`): DEAL by body, GUARD by mind, statuses by where
    // they land. Colour match and VULNERABLE stack on top.
    const stats = state.player.baseStats;

    const events: CombatEvent[] = [{ kind: 'card-played', cardId: card.id, useBottom: true, dieId: powering.id, advantage: 'neutral', colorMatch }];

    // 3. Execute the card (unchanged effect machinery) against a shim.
    const before = intensityMap(state.enemy.effects);
    const res = executeCard(cardShim(state), sourceCard.id, lookupCard);

    let player = res.state.player as Character;
    // VULNERABLE — the foe's incoming-damage multiplier, read from state.enemy
    // BEFORE this card's own debuff lands. Composed with the STANCE-KEYED
    // vulnerability (P1 #17).
    const vulnMult = getDamageTakenMultiplier(state.enemy)
        * getStanceVulnMult(state.enemy, powering.color);
    let enemy = res.state.enemy as Enemy;
    let attribution = state.attribution;
    let directDamage = state.directDamageDealt;

    // ── Fate Engine P1 — resonance and pips (spec 31 §1) ──
    // Spending the powering die feeds the TOLL tally (R1): its own color,
    // or the card's stance for a Wild.
    let resonance = { heart: 0, body: 0, mind: 0, ...(state.resonance ?? {}) };
    const resonanceColor: 'heart' | 'body' | 'mind' | null =
        dieHasStance(powering.color) ? (powering.color as 'heart' | 'body' | 'mind')
            : powering.color === 'wild' && card.stance !== 'any' && dieHasStance(card.stance) ? (card.stance as 'heart' | 'body' | 'mind')
                : null;
    if (resonanceColor) {
        resonance = { ...resonance, [resonanceColor]: resonance[resonanceColor] + 1 };
        events.push({ kind: 'resonance-gained', color: resonanceColor, total: resonance[resonanceColor] });
    }
    // Landed-status adjustments in one pass, all REAL units: RIPENED pips (+1
    // intensity per pip on a non-defend play, R2), and the color-match +1
    // duration on status cards (R7). Spec 32 v3 §7.
    const isDefendPlay = card.verbClass === 'defend';
    const bonusIntensity = isDefendPlay ? 0 : poweringPips * PIP_INTENSITY_BONUS;
    const bonusDuration = colorMatch && card.effectKind !== 'none' ? COLOR_MATCH_STATUS_DURATION_BONUS : 0;
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

    const mechs = sourceCard.specialMechanics ?? [];
    let souls = state.souls ?? 0;
    const gainSoulsLocal = (n: number): void => {
        if (n <= 0) return;
        souls += n;
        events.push({ kind: 'soul-gained', amount: n, total: souls, reason: 'expiry' });
    };

    // DEAL — each hit folds the scalers through `scalePlayerHit`.
    for (const mech of mechs) {
        if (mech.kind !== 'deal') continue;
        if (isDefeated(enemy)) break;
        const healthBefore = enemy.health;
        const dmg = scalePlayerHit({
            base: scaleFor(mech.amount, stats, 'body', 'one-shot'),
            readMult: 1,
            colorMatch,
            vulnMult,
        });
        if (dmg <= 0) continue;
        const hit = applyEnemyDamage(enemy, dmg, state.round, events);
        enemy = hit.enemy;
        directDamage += dmg + hit.clockDamage;
        // Credit the CARD, so per-card telemetry sees the DEAL verb.
        attribution = recordAttribution(attribution, card.id, card.name, null, dmg, healthBefore);
        gainSoulsLocal(soulWorthyWashouts(hit.washedOut));
        events.push({ kind: 'damage-dealt', cardId: card.id, target: 'enemy', amount: dmg });
    }

    // 4. Fold the card's effect-applications: DoT + control LAND on the enemy.
    //    DoT will tick real HP each phase (the status damage engine); control gates
    //    the enemy's turn via `canAct`. Attribute projected DoT for the summary.
    for (const ev of res.events) {
        if (ev.kind !== 'effect-applied') continue;
        const def = ev.effect;
        const target: 'self' | 'enemy' = ev.appliedTo;
        const sideEffects = target === 'enemy' ? enemy.effects : player.effects;
        const active = sideEffects.find(a => a.effectId === def.id);
        if (active && target === 'enemy') {
            const landed: LandedEffect = { effectId: def.id, effect: def, active, target };
            const cls = effectImpact(def, active.intensity, active.remainingDuration).track;
            attribution = recordAttribution(attribution, card.id, card.name, landed, 0, enemy.health);
            events.push({ kind: 'effect-landed', cardId: card.id, effectId: def.id, target: 'enemy', effectKind: cls, intensity: active.intensity, effect: def });
        } else if (active) {
            events.push({ kind: 'effect-landed', cardId: card.id, effectId: def.id, target, effectKind: 'none', intensity: active.intensity, effect: def });
        }
    }

    // WS3.2 'card-played' clock (spec 32 §12 #3) — a PLAYER-side card play
    // advances every card-played-clocked DoT on the enemy. Enemy actions
    // never fire this, and — WS3.3 — only STACKS that existed BEFORE this
    // play are on the clock: a play's own fresh stacks never tick themselves.
    const clock = fireDotTrigger(enemy, 'card-played', state.round,
        ae => Math.min(ae.intensity ?? 1, Math.min(before[ae.effectId] ?? 0, ae.intensity ?? 1)));
    if (clock.damage > 0) {
        enemy = clock.target;
        directDamage += clock.damage;
        for (const t of clock.perEffect) {
            events.push({ kind: 'dot-tick', effectId: t.effectId, label: t.label, amount: t.amount, target: 'enemy' });
        }
        gainSoulsLocal(soulWorthyWashouts(clock.washedOut));
    }

    // WS3.3 — the same clock advances card-played-clocked DoTs the PLAYER
    // bears: the clock is the player's own play, wherever the DoT sits. Same
    // pre-existing STACK cap, and player-borne washouts never earn Souls.
    const playerPrePlay = intensityMap(state.player.effects);
    const selfClock = fireDotTrigger(player, 'card-played', state.round,
        ae => Math.min(ae.intensity ?? 1, playerPrePlay[ae.effectId] ?? 0));
    if (selfClock.damage > 0) {
        player = selfClock.target as Character;
        for (const t of selfClock.perEffect) {
            events.push({ kind: 'dot-tick', effectId: t.effectId, label: t.label, amount: t.amount, target: 'self' });
        }
    }

    // 5. Die spend — the powering die's fate. A GHOST die is GONE FOREVER when
    //    spent (spec 32 v3 §5).
    let dice = state.dice;
    let reserve = reserveIn;
    let floatingDice = state.floatingDice ?? [];
    if (poweringSource === 'floating') {
        dice = dice.filter(d => d.id !== powering.id);
        floatingDice = floatingDice.filter(d => d.id !== powering.id);
        events.push({ kind: 'floating-die-spent', dieId: powering.id, color: powering.color, poolSize: floatingDice.length });
    } else if (poweringSource === 'reserve') {
        reserve = reserve.filter(d => d.id !== powering.id);
    } else {
        dice = spendDice(dice, [powering.id]);
    }
    events.push({ kind: 'die-spent', dieId: powering.id, color: powering.color });

    // Defense card → GUARD (printed + color-match + pips). Absorbed in
    // `resolveThreatPhase`.
    const guardMech = mechs.find(m => m.kind === 'guard');
    const pipGuard = isDefendPlay ? poweringPips * PIP_GUARD_BONUS : 0;
    if (pipGuard > 0) {
        events.push({ kind: 'pips-cashed', cardId: card.id, pips: poweringPips, bonus: 'guard', amount: pipGuard });
    }
    const guardBase = guardMech ? scaleFor(Math.max(1, Math.round(guardMech.amount)), stats, 'mind', 'one-shot') : 0;
    const guardGain = guardBase + (guardMech && colorMatch ? colorMatchBonus(guardBase) : 0) + pipGuard;

    let next: CombatEncounterState = {
        ...state, player, enemy, dice, reserve, resonance, attribution,
        guard: (state.guard ?? 0) + guardGain,
        directDamageDealt: directDamage,
        floatingDice,
        souls,
        spellsPlayedThisTurn: (state.spellsPlayedThisTurn ?? 0) + 1,
    };
    next = discardEntry(next, uid);
    next = withLog(next, events);
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
 * The soak arithmetic for one flat hit: armor, then GUARD, then BARRIER. The
 * SINGLE definition of the wall arithmetic `projectIncomingThreat` shares with
 * the engine, so the on-screen wall math cannot drift from what the engine
 * actually does. Deliberately EXCLUDES riposte (a parry on the foe's own
 * swing, one-shot per phase).
 */
function soakFlatHit(
    raw: number,
    o: { armor: number; guard: number; barrier: number },
): { dealt: number; guard: number; barrier: number } {
    let dmg = Math.max(0, raw - o.armor);
    let guard = o.guard;
    let barrier = o.barrier;
    const g = Math.min(guard, dmg);
    guard -= g;
    dmg -= g;
    const b = Math.min(barrier, dmg);
    barrier -= b;
    dmg -= b;
    return { dealt: dmg, guard, barrier };
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

    // Spec 33 §2 — the phase's OPEN stance check resolves against the
    // player's stance-from-cards NOW (phase end): `punishes` lands the hit at
    // the advantage rail (x1.5); `yields` blunts it to the disadvantage rail
    // (x0.5) and pays +1◆ below. Stance-less players fire nothing.
    const stanceCheck = resolveStanceCheck(phase.stanceCheck, state.playerStance ?? null,
        READ_DAMAGE_MULT.advantage, READ_DAMAGE_MULT.disadvantage);
    if (phase.stanceCheck) {
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
    const denied = rollPenalty >= THREAT_DENY_AT || disruptDenied;
    const weakenMult = Math.max(THREAT_WEAKEN_FLOOR, Math.min(1, 1 - rollPenalty * THREAT_WEAKEN_PER_ROLL));
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

    // ARMOR (defenseModifier) — flat per-hit reduction of the incoming telegraph.
    // No effect in the library carries a defenseModifier since R5 retired the
    // armor consumables; R7a removes the soak. Player-only and clamped ≥0, so
    // no enemy-borne or negative payload can amplify the hit. Applied before
    // parry/guard/barrier soak, like armor.
    const playerArmor = Math.max(0, getActiveEffectModifiers(state.player.effects as ActiveEffect[]).defenseDelta);

    // An already-defeated enemy does not still hit the player this phase (the
    // victory check runs after this block).
    if (!hindered && !isDefeated(enemy)) {
        // The enemy attacks: its telegraphed threat action fires on the player.
        const playerTakenMult = getDamageTakenMultiplier(state.player);
        for (const eff of phase.threatAction.effects) {
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
                    // Spec 33 §2 — the open stance check's rail (1 when no check
                    // is authored or the player is stance-less).
                    * stanceCheck.mult,
                );
                // Flat armor soak (defenseModifier).
                dmg = Math.max(0, dmg - playerArmor);
                const preSoakDmg = dmg;
                // RIPOSTE parry reduces the incoming hit once this phase.
                if (riposte && !riposteFired && riposte.reduce > 0) {
                    const parried = Math.min(dmg, riposte.reduce);
                    dmg -= parried;
                    riposteFired = true;
                }
                // GUARD soaks first (one-shot, clamped), then BARRIER (persistent).
                const guardAbsorbed = Math.min(guard, dmg);
                guard -= guardAbsorbed;
                dmg -= guardAbsorbed;
                const barrierAbsorbed = Math.min(barrier, dmg);
                if (barrierAbsorbed > 0) {
                    barrier -= barrierAbsorbed;
                    dmg -= barrierAbsorbed;
                    events.push({ kind: 'barrier-absorbed', amount: barrierAbsorbed });
                }
                if (dmg > 0) {
                    player = applyDamage(player, dmg);
                    enemyDamageDealt += dmg;
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
                }
                else {
                    attacksFullyBlocked += 1;
                    blockedBlowTotal += preSoakDmg;
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
                const healAmt = Math.round(eff.enemyHeal * getHealingReceivedMult(enemy));
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
        events.push({ kind: 'threat-fired', phaseIndex: phase.index, description: phase.threatAction.description, effects: phase.threatAction.effects });
        // WS3.2 Doom growth (spec 32 §12 #3, card-local species): enemy-borne
        // `growth: 'per-enemy-action'` DoTs deepen by 1 each time the enemy
        // actually acts — a hindered (denied) turn never feeds the Doom.
        const doomGrowth = growPerEnemyActionDots(enemy);
        if (doomGrowth.grown.length > 0) {
            enemy = doomGrowth.combatant;
            events.push({ kind: 'dots-boosted', intensity: 1, affected: doomGrowth.grown });
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

    let next: CombatEncounterState = {
        ...state,
        player,
        enemy,
        directDamageDealt: directDamage,
        guard: 0,                       // brace is spent on this phase's threat; resets each phase
        barrier,                        // persistent soak — carries the unspent remainder across phases
        riposte: undefined,             // cleared each phase (like guard)
        // Spec 32 §12 #4 — the enemy-damage ledger (rolled over between phases)
        // and the full-block verdict (persists until the NEXT threat resolves;
        // a hindered/denied threat was never blocked).
        enemyDamageThisTurn: (state.enemyDamageThisTurn ?? 0) + enemyDamageDealt,
        lastThreatFullyBlocked: !hindered && attacksLanded > 0 && attacksFullyBlocked === attacksLanded,
        phase: 'phase-resolve',
        threatMarks,
        phaseResults: [...state.phaseResults, result],
        // Spec 33 §2: answering a `yields` check pays +1◆.
        conviction: stanceCheck.yielded
            ? Math.min(CONVICTION_CAP, state.conviction + 1)
            : state.conviction,
    };
    if (stanceCheck.yielded && next.conviction > state.conviction) {
        events.push({ kind: 'conviction-gained', amount: 1, total: next.conviction, reason: 'effect' });
    }

    // Phase 33c (spec 33 §1) — THE COVETED DIE: a boss/unique phase authored
    // `stake: true` converts to a temp gold die the moment its telegraph is
    // fully blocked or its open stance check is answered with a yield. Resolved AFTER `next` above so the yield's own
    // +1◆ payout composes first. One-time per phase index this combat
    // (`covetedDiceClaimed`) — a repeating/locked final phase can't be farmed
    // on every loop. Priority when more than one condition holds: block >
    // yield (a single event, never a double-payout for one phase).
    if (phase.stake && !(state.covetedDiceClaimed ?? []).includes(phase.index)) {
        const method: 'block' | 'yield' | null =
            (attacksLanded > 0 && attacksFullyBlocked === attacksLanded) ? 'block'
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

    // Outcome checks after the threat action.
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

    // 1. Per-effect DoT ticks (labeled, §7.5) — computed before processing.
    //    Round-threaded so escalating DoTs (POISON ramp) tick their real value.
    const projectedEnemyDotTicks = dotTickBreakdown(state.enemy.effects, state.round);
    const projectedPlayerDotTicks = dotTickBreakdown(state.player.effects, state.round);

    // 2. Process a full round of effects on the enemy — DoT ERODES real enemy HP
    //    (the status damage engine; no track, the HP loss is the win progress).
    const enemyStart = processRoundStartEffects(state.enemy, state.round);
    const tithedExpired: ActiveEffect[] = [];
    const enemyEnd = processRoundEndEffects(enemyStart.target, state.round);
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

    // ── THE BIG NUMBERS REWRITE — STAGES resolve at the boundary ──
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
        }
    }

    const candidateIndex = Math.min(state.currentPhaseIndex + 1, state.threatPhases.length - 1);
    const candidatePhase = state.threatPhases[candidateIndex];
    const rageGated = candidatePhase.unlockAfterRound !== undefined && resolvedRound < candidatePhase.unlockAfterRound;
    const nextIndex = rageGated ? state.currentPhaseIndex : candidateIndex;

    // WS8.2 STANCE surface (spec 32 §12 #6): while the enemy carries ROOT's
    // `lockedStance` payload, every phase advance keeps the current
    // (revealed) stance. Read off the PRE-tick enemy: the lock
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
    if (statusLockId !== null && nextIndex !== state.currentPhaseIndex) {
        const lockedStance = currentPhaseStance(state);
        threatPhases = threatPhases.map((p, i) => (i === nextIndex ? { ...p, enemyStance: lockedStance } : p));
        if (!revealedStances.includes(nextIndex)) revealedStances = [...revealedStances, nextIndex];
        events.push({ kind: 'stance-locked', phaseIndex: nextIndex, stance: lockedStance });
    }

    let omenState: CombatEncounterState = {
        ...state, player, enemy, threatPhases, revealedStances,
    };

    // SOULS from expiry (base law: 1 per expired enemy affliction instance).
    if (expiredAfflictions > 0) {
        omenState = gainSouls(omenState, expiredAfflictions, 'expiry', events);
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

    // 5. Refill the hand up to COMBAT_HAND_SIZE (keep-hand rule, 2026-07-13):
    //    unplayed cards STAY in hand and occupy draw room, so holding a card
    //    is a real cost — a dead card clogs the hand until it is played or
    //    scrapped. `bonusDraw` lets a caller raise the refill target (no
    //    live caller does today).
    const keptHand = omenState.hand;
    const refillTarget = COMBAT_HAND_SIZE + bonusDraw;
    const draw = drawCombatCards(
        omenState.drawPile, omenState.discard, omenState.deck,
        Math.max(0, refillTarget - keptHand.length), rng,
    );
    let uid = state.round * 100;
    const hand = [...keptHand, ...draw.drawn.map(cardId => ({ uid: `c${++uid}`, cardId }))];
    events.push({ kind: 'hand-drawn', cards: draw.drawn });

    let next: CombatEncounterState = {
        ...omenState,
        reserve,
        currentPhaseIndex: nextIndex,
        drawPile: draw.drawPile,
        discard: draw.discard,
        hand,
        phase: 'phase-play',
        round: state.round + 1,
        // Spec 32 §12 #4 — the enemy-damage ledger rolls over at the turn
        // boundary: this turn's value becomes last-round's, then resets.
        enemyDamageLastRound: omenState.enemyDamageThisTurn ?? 0,
        enemyDamageThisTurn: 0,
        // New phase → fresh turn; clear the tray so the next startTurn rolls.
        dice: [],
        // Gate 0 (round-turn law) — the phase boundary re-arms the one legal
        // tray roll for the incoming phase.
        turnTakenThisPhase: false,
        // THE BIG NUMBERS REWRITE — the STAGE ledgers.
        stagesEntered,
        stageThreatBonus,
    };
    next = withLog(next, events);
    // WI-1 — the round is closed: zero the enemy-DoT accumulator AFTER logging
    // (so this round's round-clock/suppuration ticks don't leak into the next
    // round's suppuration read). `startTurn` also resets it in the live game;
    // this covers back-to-back `processBetweenPhases` calls in tests.
    next = { ...next, enemyDotDamageThisRound: 0 };

    // 6. Outcome checks after ticks.
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
 * The first die that can LEGALLY power `card`'s paid line right now, in the
 * order a player reaches for them: a live tray die (available, not a miss
 * face, colour-law legal), then a Reserve die, then a floating (GHOST /
 * surge) die. Null when no die can power it. Used by `resolveCombatPhase`
 * for plays submitted without a `dieId`, and by the CLI auto-player.
 */
export function firstLegalPoweringDie(
    state: CombatEncounterState,
    card: Pick<CombatCard, 'stance'>,
): CombatManaDie | null {
    const tray = state.dice.find(d =>
        !d.floating && d.state === 'available' && d.face !== 'miss' && dieSatisfiesColorLaw(d, card.stance));
    if (tray) return tray;
    const banked = (state.reserve ?? []).find(d => dieSatisfiesColorLaw(d, card.stance));
    if (banked) return banked;
    return state.dice.find(d =>
        d.floating && d.state === 'available' && dieSatisfiesColorLaw(d, card.stance)) ?? null;
}

/**
 * Applies a batch of card plays then resolves the current threat phase — the
 * top-level entry point. The phase's one tray roll happens on entry (when not
 * yet taken); a bottom play submitted without a `dieId` is powered by
 * `firstLegalPoweringDie` (a colour-legal live tray die, then Reserve, then
 * floating), so callers can express a plan as a card list. Plays stop early
 * if an outcome fires mid-batch.
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
            // Gate 0 (round-turn law) — roll the phase's ONE tray only if it
            // hasn't been rolled yet; a re-roll is illegal.
            if (!working.turnTakenThisPhase) {
                const started = startTurn(working, rng);
                working = started.state; allEvents.push(...started.events);
            }
            if (dieId === undefined) {
                const card = getCard(play.cardId);
                if (card) dieId = firstLegalPoweringDie(working, card)?.id;
            }
        }
        const res = playCombatCard(
            working, { uid: play.uid, cardId: play.cardId }, play.useBottom, dieId, rng,
        );
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
 * Resolves the spare/exploit mercy choice opened by a successful Befriend
 * (`checkImmediateOutcome`). `spare` confirms the friendship (mercy) end; `exploit`
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
 * of the hand. Refused (no-op + a fizzle event, nothing spent) when
 * `signatureCastBlock` names a reason: too little Conviction, or The Open Hand
 * on a foe that can't be befriended yet.
 */
export function playSignatureSkill(
    state: CombatEncounterState,
    signatureId: string,
): CombatTransition {
    if (state.phase !== 'phase-play') return { state, events: [] };
    const skill = getSignatureSkill(signatureId);
    if (!skill) return { state, events: [] };
    const block = signatureCastBlock(state, skill);
    if (block) {
        const events: CombatEvent[] = [{ kind: 'effect-fizzled', cardId: skill.id, effectId: '', message: block }];
        return { state: withLog(state, events), events };
    }

    const spent: CombatEncounterState = { ...state, conviction: state.conviction - skill.cost };
    const applied = applySignatureSkill(spent, skill);
    const events: CombatEvent[] = [
        { kind: 'signature-cast', signatureId: skill.id, name: skill.name, cost: skill.cost },
        ...applied.events,
    ];
    const next = withLog(applied.state, events);
    return checkImmediateOutcome(next, events);
}

/** The baseline signature kit (for the presenter / UI bar). */
export {
    SIGNATURE_SKILLS, SIGNATURE_SKILL_LIST, getSignatureSkill,
    signatureCastBlock, signatureGuardAmount, SIGNATURE_COST, SIGNATURE_GUARD,
} from './combat.signature';

// ── Summary (§7.7) ───────────────────────────────────────────────────────────

export { buildCombatSummary } from './combat.attribution';

// ── Convenience selectors for the presenter ──────────────────────────────────

/** Cards in hand, projected to their views (for the UI hand display, §7.3). */
export function handCards(state: CombatEncounterState): Array<{ uid: string; card: CombatCard }> {
    // S3 — the hand prints FINAL numbers: each card is built from its
    // stat-scaled copy (display only; play always executes the library card).
    const stats = state.player.baseStats;
    const scaledLookup = (id: string) => {
        const c = lookupCard(id);
        return c ? scaleCardForStats(c, stats) : c;
    };
    return state.hand
        .map(h => ({ uid: h.uid, card: toCombatCard(h.cardId, scaledLookup, lookupEffectDef) }))
        .filter((x): x is { uid: string; card: CombatCard } => x.card !== null);
}

/** Count of available (non-X) dice — surfaced for the dice board (§7.4). */
export function availableDice(state: CombatEncounterState): number {
    return availableDieCount(state.dice);
}

// ── Spec 26b — presenter selectors (the engine owns truth; the UI hides) ─────

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
 * at combat end (they persist across combats until spent). Excludes
 * `temporary` floats (the momentum surge die, the coveted die): momentum
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
 * or the additive distinct-control deny).
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
 * Wall-math projection (phase 28 / Gate 1 §4) — what the CURRENTLY
 * telegraphed hit would actually deal right now, netted against live
 * guard/barrier. `IntentIcon` today shows only the raw, unscaled
 * `phase.threatAction.effects` damage sum; this selector runs that same raw
 * total through the live `weakenMult` / escalation / outgoing-damage
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
 * `state.stageThreatBonus`, and — while the Upgradeable-Dice flag is
 * on — an authored phase's `stanceCheck.mult`, so against a staged or
 * stance-punished foe it UNDERSTATES.
 *
 * Audit 3.2: the flat `playerArmor` soak runs through the same `soakFlatHit`
 * the engine applies.
 */
export function projectIncomingThreat(state: CombatEncounterState): {
    rawDamage: number; projectedDamage: number; willDeny: boolean; guard: number; barrier: number; netDamage: number;
} {
    const idx = Math.min(state.currentPhaseIndex, state.threatPhases.length - 1);
    const phase = state.threatPhases[idx];
    const rawDamage = phase.threatAction.effects.reduce((s, e) => s + (e.damage ?? 0), 0);

    const act = canAct(state.enemy.effects as ActiveEffect[], phase.enemyStance);
    const rollPenalty = Math.max(0, -getActiveRollModifier(state.enemy));
    const controlPips = getDistinctControlCount(state.enemy);
    const disruptDenied = controlPips >= DISRUPT_DENY_AT;
    const isBossTier = state.enemy.difficulty === 'boss' || state.enemy.difficulty === 'unique';
    const denied = rollPenalty >= THREAT_DENY_AT || disruptDenied;
    const willDeny = !act.canAct || denied;

    const weakenMult = Math.max(THREAT_WEAKEN_FLOOR, Math.min(1, 1 - rollPenalty * THREAT_WEAKEN_PER_ROLL));
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
    let remaining = projectedDamage;
    if (riposte && riposte.reduce > 0) remaining = Math.max(0, remaining - riposte.reduce);
    // Audit 3.2 — the foe's hit goes through the SAME `soakFlatHit` the engine
    // applies. RIPOSTE stays outside the helper (a one-shot parry on the foe's
    // own swing); applying it before armor is arithmetically identical to the
    // engine's armor-then-riposte order, since both reduce to
    // `max(0, d - armor - reduce)` over non-negative terms.
    remaining = soakFlatHit(remaining, { armor: playerArmor, guard, barrier }).dealt;

    return {
        rawDamage, projectedDamage, willDeny, guard, barrier, netDamage: remaining,
    };
}

/** The consolidated status kill-path readout (spec 30, build-plan phase 2):
 *  pending DoT, and whether it alone kills the foe and in how many rounds.
 *  Pure selector — no `CombatEvent`, no state mutation; call it on demand
 *  from a presenter. */
export interface CombatOutcomeProjection {
    pendingDot: number;
    roundsToKill: number | null;
    isLethalInFlight: boolean;
}

export function projectCombatOutcome(state: CombatEncounterState): CombatOutcomeProjection {
    const pendingDot = getPendingDotTotal(state.enemy, state.round).total;
    const roundsToKill = computeRoundsToKill(state.enemy, state.round);
    return { pendingDot, roundsToKill, isLethalInFlight: roundsToKill !== null };
}

/** Re-export for presenters that need to check die affordability directly. */
export { combatDieCanPower, availableDiceFor, effectImpact, cardStanceColor, riderText };
