/**
 * Spec 25 — Hazard-Pattern Combat: the engine (§4, §9).
 *
 * `resolveCombatPhase` drives the HP-model combat: the enemy's SOLE bar is HP,
 * and the player drops it to 0. Every verb is a combat card (projected from a learned skill); the player rolls
 * stance dice and plays cards, where STATUS effects are the efficient damage
 * (DoT erodes HP; control hinders the enemy's turn) and a raw strike is the weak
 * baseline. The legacy resolver, the effects engine, the skill engine, and all
 * effects are UNCHANGED — this engine *drives* `executeSkill` / `applyEffect`
 * differently.
 *
 * Card bottom actions execute through the unchanged `executeSkill`: the drafted
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
import { lookupEffect, applyEffect } from '../Effects';
import type { Effect, ActiveEffect } from '../Effects/types';
import type { Character } from '../Character/types';
import type { Enemy } from '../Enemy/types';
import { getCardById } from '../Cards/cards.library';
import { executeSkill, calculateSkillDamage } from '../Cards/skill.engine';
import type { Card, CombatResources } from '../Cards/types';
import type { CombatState, Stance } from './types';
import { applyDamage, heal, isDefeated } from './health';
import {
    processRoundStartEffects, processRoundEndEffects, getActiveRollModifier,
    getThornsReflect, getDamageTakenMultiplier, getPendingDotTotal, consumeDotEffects,
    getDistinctDebuffCount, getDistinctControlCount,
    RUPTURE_BURST_CAP, COMPOUND_COUNT_CAP, DISRUPT_DENY_AT, EXECUTE_DAMAGE_FRACTION,
    AMPLIFY_BURST_CAP,
} from './effects';
import {
    TURN_DICE_COUNT, rollTurnDice, dieHasStance,
    combatDieCanPower, availableDiceFor, spendDice, refreshOneDie, availableDieCount,
    hasRerollableDice,
} from './combat.dice';
import {
    COMBAT_HAND_SIZE, buildCombatDeck, drawCombatCards, shuffleCombatDeck,
} from './combat.deck';
import {
    toCombatCard, cardStanceColor, effectImpact,
} from './combat.cards';
import { recordAttribution } from './combat.attribution';
import { canAct, getActiveEffectModifiers, getActiveDotTotal } from './effect-modifiers';
import { getThreatSequence } from './combat.threat';
import { getSignatureSkill, applySignatureSkill, playerArchetype, SIGNATURE_KITS } from './combat.signature';
import type {
    CombatCard, CombatDieColor, CombatEncounterState, CombatEvent, CardPlay,
    CombatManaDie, CombatPhaseResult, CombatTransition, LandedEffect, CombatReadResult,
    CombatThreatEffect,
} from './combat.encounter.types';

// ── Tunable constants (HP model) ─────────────────────────────────────────────

/** HP a free (top) action chips off the enemy — a die-free, weak contribution. */
export const TOP_ACTION_CHIP = 2;
/** Safety cap on total phases processed — prevents a degenerate stalemate loop. */
const MAX_PHASES = 60;

// ── Read & color-match tuning (now scale the strike's HP damage) ─────────────

/** Strike-damage multipliers by stance-read result (drafted die vs hidden enemy
 *  stance). Winning the read hits harder; losing it glances. */
export const READ_DAMAGE_MULT: Record<CombatReadResult, number> = {
    advantage: 1.5, neutral: 1.0, disadvantage: 0.5, none: 1.0,
};
/** Conviction granted by the unpicked die each draft (§1). */
export const CONVICTION_PER_UNPICKED_DIE = 1;
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
/**
 * Fraction of a POWER action's IMMEDIATE strike (basePower) HP damage that lands.
 * <1 because the engaging, efficient damage is STATUS (DoT erosion ticking the
 * enemy down) — a raw strike is the weak "basic" baseline the doctrine de-emphasises
 * (and the owner explicitly OK'd weaker basic cards). DoT erosion is untouched, so
 * status loadouts out-damage a strike-only line. The strike is then scaled by the
 * read (advantage/disadvantage) and a color-match bonus, so the read still matters.
 */
export const DIRECT_DAMAGE_WEIGHT = 0.25;

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
 * The stance-read also scales a landed STATUS's magnitude (DoT / control / debuff
 * intensity), not only the weak strike chip — so "read the stance, draft the right
 * color" matters for the STATUS play that is the heart of the game, not just the
 * vestigial strike. Gentler than the strike's READ_DAMAGE_MULT (1.5/0.5) so it adds
 * texture without swinging fights wildly: winning the read makes a status BITE,
 * losing it softens the bite. neutral/none = 1.0 → an un-read play is byte-identical.
 * Tuned by /combat-tuning.
 */
export const READ_STATUS_MULT: Record<CombatReadResult, number> = {
    advantage: 1.34, neutral: 1.0, disadvantage: 0.75, none: 1.0,
};

const EMPTY_RESOURCES: CombatResources = { heart: 0, body: 0, mind: 0, fallacy: 0, paradox: 0 };
const defaultRng = (): number => getRng().random();

// ── Card / lookup adapters ──────────────────────────────────────────────────

const lookupSkill = (id: string): Card | undefined => getCardById(id);
const lookupEffectDef = (id: string): Effect | undefined => lookupEffect(id);

/** Projects a card id into its card view (skill or synthetic). */
export function getCard(cardId: string): CombatCard | null {
    return toCombatCard(cardId, lookupSkill, lookupEffectDef);
}

// ── RPS advantage — per-phase die-cost scaling (§4.8) ────────────────────────

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
 * Resolves the die cost of a card's bottom action against the current enemy
 * phase stance (§4.8). Advantage → free (0 dice). Neutral → 1 die. Disadvantage
 * → 2 dice. Wild cards are always neutral.
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

/** Builds the legacy `CombatState` shim `executeSkill` needs. */
function skillShim(enc: CombatEncounterState): CombatState {
    return {
        active: true,
        phase: 'resolving',
        round: enc.round,
        friendshipCounter: 0,
        player: enc.player,
        enemy: enc.enemy,
        playerChoice: {},
        enemyChoice: {},
        log: [],
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
        archetype: playerArchetype(clonedPlayer),
        signatures: SIGNATURE_KITS[playerArchetype(clonedPlayer)],
        deck,
        drawPile: draw.drawPile,
        discard: draw.discard,
        hand,
        persistentZone: [],
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
    // Spec 26b tuning §3 — a carried (unspent) die from last turn isn't wasted:
    // it takes one slot in the new pool so a good die persists.
    let carriedDie = state.carriedDie;
    if (carriedDie) {
        dice = dice.slice();
        dice[0] = { id: `t${turn}-d0`, color: carriedDie, state: carriedDie === 'x' ? 'locked' : 'available', temporary: false };
        carriedDie = null;
    }
    const next: CombatEncounterState = { ...state, dice, draftedDieId: null, turn, lastRead: 'none', carriedDie };
    const events: CombatEvent[] = [
        { kind: 'turn-dice-rolled', turn, dice },
        // Mirror the legacy event so existing presenters keep working.
        { kind: 'dice-rolled', dice },
    ];
    return { state: withLog(next, events), events };
}

/**
 * Spec 26b §1 — drafts one of this turn's two dice as the STANCE. The unpicked
 * die converts to +1 Conviction; winning the hidden-stance read grants a bonus
 * Conviction and reveals the phase stance.
 */
export function draftStanceDie(state: CombatEncounterState, dieId: string): CombatTransition {
    if (state.phase !== 'phase-play') return { state, events: [] };
    if (state.draftedDieId !== null) return { state, events: [] };
    const drafted = state.dice.find(d => d.id === dieId);
    if (!drafted) return { state, events: [] };

    const events: CombatEvent[] = [];
    const enemyStance = currentPhaseStance(state);
    const read = resolveRead(drafted.color, enemyStance);

    // The drafted die becomes the single available power source; an X draft stays
    // locked (can't power). The unpicked die converts to Conviction.
    const dice = state.dice.map(d => {
        if (d.id === dieId) return { ...d, state: drafted.color === 'x' ? ('locked' as const) : ('available' as const) };
        return { ...d, state: 'spent' as const }; // unpicked → consumed for Conviction
    });

    let conviction = Math.min(CONVICTION_CAP, state.conviction + CONVICTION_PER_UNPICKED_DIE);
    events.push({ kind: 'die-drafted', dieId, color: drafted.color, read });
    events.push({ kind: 'conviction-gained', amount: CONVICTION_PER_UNPICKED_DIE, total: conviction, reason: 'unpicked-die' });
    if (read === 'advantage') {
        conviction = Math.min(CONVICTION_CAP, conviction + CONVICTION_READ_WIN_BONUS);
        events.push({ kind: 'conviction-gained', amount: CONVICTION_READ_WIN_BONUS, total: conviction, reason: 'read-win' });
    }

    // Reveal the phase's hidden stance on first contest.
    const idx = Math.min(state.currentPhaseIndex, state.threatPhases.length - 1);
    const revealedStances = state.revealedStances.includes(idx) ? state.revealedStances : [...state.revealedStances, idx];
    if (!state.revealedStances.includes(idx)) {
        events.push({ kind: 'stance-revealed', phaseIndex: idx, stance: enemyStance });
    }
    events.push({ kind: 'read-result', stance: drafted.color, enemyStance, result: read });

    const next: CombatEncounterState = {
        ...state, dice, draftedDieId: dieId, conviction, revealedStances, lastRead: read,
        // A fresh draft starts a fresh combo chain (Spec 26b tuning §3).
        chainEffectIds: [],
    };
    return { state: withLog(next, events), events };
}

/** Spec 26b §1 — ends the turn: clears the draft so the next turn can roll. An
 *  unspent (still-available, non-X) drafted die is carried into the next roll. */
export function endTurn(state: CombatEncounterState): CombatTransition {
    if (state.phase !== 'phase-play') return { state, events: [] };
    const d = draftedDie(state);
    const carriedDie = d && d.state === 'available' && d.color !== 'x' ? d.color : null;
    const next: CombatEncounterState = { ...state, dice: [], draftedDieId: null, lastRead: 'none', carriedDie };
    return { state: next, events: [] };
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
 * RPS scaling, executes the skill, drives impact + the die-refresh loop); the
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

    // Retreat is synthetic — handled before the skill path.
    if (card.verbClass === 'retreat') {
        return playRetreat(state, entry.uid, useBottom);
    }

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

function playRetreat(state: CombatEncounterState, uid: string, useBottom: boolean): CombatTransition {
    if (useBottom) {
        // Flee: spend all available dice, end combat as retreat (§12 Q2).
        const dice = state.dice.map(d => (d.state === 'available' ? { ...d, state: 'spent' as const } : d));
        const ended: CombatEncounterState = {
            ...discardEntry({ ...state, dice }, uid),
            phase: 'complete',
            finalOutcome: 'retreat',
        };
        const events: CombatEvent[] = [{ kind: 'combat-ended', outcome: 'retreat' }];
        return { state: withLog(ended, events), events };
    }
    // Brace (top): refresh one spent die.
    const { dice, refreshedId } = refreshOneDie(state.dice, 'wild');
    const next = discardEntry({ ...state, dice }, uid);
    const events: CombatEvent[] = refreshedId
        ? [{ kind: 'die-refreshed', dieId: refreshedId, color: 'wild' }]
        : [];
    return { state: withLog(next, events), events };
}

/**
 * Free top action: a weak, die-free contribution. Buff cards apply the buff to
 * self at intensity 1 (or a small heal); every offensive card chips a sliver of
 * enemy HP — the real status damage needs a powered (die) play, which is the
 * design tension.
 */
function playTopAction(
    state: CombatEncounterState,
    uid: string,
    card: CombatCard,
    _rng: () => number,
): CombatTransition {
    const events: CombatEvent[] = [];
    let player = state.player;
    let enemy = state.enemy;
    let directDamage = state.directDamageDealt;
    let guardGain = 0;
    const skill = card.skillId ? lookupSkill(card.skillId) : undefined;

    events.push({ kind: 'card-played', cardId: card.id, useBottom: false, dieId: null, advantage: 'neutral' });

    if (card.verbClass === 'buff-self' && skill) {
        // Apply the weak self-buff at intensity 1 (or a small heal when none).
        const selfEffect = (skill.combatEffects ?? []).find(e => e.appliedTo === 'self')
            ?? (skill.synergy?.applyEffectOnFire?.appliedTo === 'self' ? skill.synergy.applyEffectOnFire : undefined);
        if (selfEffect) {
            const def = lookupEffectDef(selfEffect.effectId);
            if (def) {
                const res = applyEffect(player.effects, def, state.round, { intensityDelta: 1, sourceId: player.id });
                player = { ...player, effects: res.activeEffects };
                if (res.result.activeEffect) {
                    events.push({
                        kind: 'effect-landed', cardId: card.id, effectId: def.id, target: 'self',
                        effectKind: 'none', intensity: res.result.activeEffect.intensity, effect: def,
                    });
                }
            }
        } else {
            const amount = Math.max(1, Math.floor(skill.basePower * 0.15));
            player = heal(player, amount);
            events.push({ kind: 'damage-dealt', cardId: card.id, target: 'self', amount: -amount });
        }
    } else if (card.verbClass === 'defend' && skill) {
        // Free brace — a small Guard (half the base), no die, no read scaling.
        const gm = (skill.specialMechanics ?? []).find(m => m.kind === 'guard') as { amount: number } | undefined;
        guardGain = Math.max(1, Math.round((gm?.amount ?? 2) * 0.5));
    } else if (skill) {
        // Offensive free action — chip a sliver of enemy HP (die-free, weak). A
        // pure-damage card scales off its damage; a status card chips a flat bit.
        // VULNERABLE scales even this chip (×1 when the foe carries no marker, so
        // every pre-0.34.0 case is byte-identical).
        const base = card.verbClass === 'direct-damage'
            ? Math.max(1, Math.floor(calculateSkillDamage(player, skill) * 0.15))
            : TOP_ACTION_CHIP;
        const amount = Math.round(base * getDamageTakenMultiplier(enemy));
        enemy = applyDamage(enemy, amount);
        directDamage += amount;
        events.push({ kind: 'damage-dealt', cardId: card.id, target: 'enemy', amount });
    }

    let next: CombatEncounterState = {
        ...state, player, enemy, directDamageDealt: directDamage,
        guard: (state.guard ?? 0) + guardGain,
    };
    next = discardEntry(next, uid);
    next = withLog(next, events);
    return checkImmediateOutcome(next, events);
}

/**
 * Powered bottom action (§4.3, §4.7, §4.8): pays dice via RPS scaling, runs the
 * full skill through `executeSkill`, folds landed effects into the impact
 * tracks + attribution, and refreshes a matching die when a status effect
 * meaningfully lands.
 */
function playBottomAction(
    state: CombatEncounterState,
    uid: string,
    card: CombatCard,
    _dieId: string | undefined,
    _rng: () => number,
): CombatTransition {
    const skill = card.skillId ? lookupSkill(card.skillId) : undefined;
    if (!skill) return { state, events: [] };

    // 1. A die must be drafted this turn, and it must be able to power a card.
    const drafted = draftedDie(state);
    if (!drafted) {
        const events: CombatEvent[] = [{ kind: 'effect-fizzled', cardId: card.id, effectId: '', message: 'draft a stance die first' }];
        return { state: withLog(state, events), events };
    }
    if (drafted.state !== 'available' || drafted.color === 'x') {
        const events: CombatEvent[] = [{ kind: 'effect-fizzled', cardId: card.id, effectId: '', message: 'the drafted die is spent or blocked — end the turn' }];
        return { state: withLog(state, events), events };
    }

    // 2. The read (drafted die vs hidden enemy stance) + color-match bonus (§1, §3).
    //    A WILD die has no stance of its own, so it ADOPTS the powered card's
    //    stance for the read (contesting the enemy like a colored die); on a GOLD
    //    (rare) card the wild die always reads advantage.
    const enemyStance = currentPhaseStance(state);
    const read: CombatReadResult = drafted.color === 'wild'
        ? (card.rarity === 'gold' ? 'advantage' : resolveRead(card.stance as CombatDieColor, enemyStance))
        : state.lastRead;
    const mult = READ_DAMAGE_MULT[read];
    const colorMatch = drafted.color === 'wild' || drafted.color === card.stance;
    const advantage = readToAdvantage(read);

    const events: CombatEvent[] = [{ kind: 'card-played', cardId: card.id, useBottom: true, dieId: drafted.id, advantage, colorMatch }];

    // 3. Execute the skill (unchanged engine) against a shim.
    const before = intensityMap(state.enemy.effects);
    const shim: CombatState = skillShim(state);
    const res = executeSkill(shim, skill.id, lookupSkill, 'player');

    let player = res.state.player as Character;
    // VULNERABLE — the foe's outgoing-damage multiplier, read from state.enemy
    // BEFORE this card's own debuff lands (the set-up-then-swing beat). Exactly 1
    // when the foe carries no marker, so every pre-0.34.0 strike is byte-identical.
    const vulnMult = getDamageTakenMultiplier(state.enemy);
    // The skill's IMMEDIATE strike (basePower HP damage) — the WEAK basic baseline,
    // scaled by DIRECT_DAMAGE_WEIGHT, the read (advantage/disadvantage), VULNERABLE,
    // and a color-match bonus. The engaging damage is STATUS: the DoT this skill also
    // applies (below) ticks the enemy down each phase, untouched by this scaling.
    const rawStrike = Math.max(0, state.enemy.health - (res.state.enemy as Enemy).health);
    const scaledStrike = rawStrike > 0
        ? Math.max(1, Math.round(rawStrike * DIRECT_DAMAGE_WEIGHT * mult * vulnMult) + (colorMatch ? COLOR_MATCH_DAMAGE_BONUS : 0))
        : 0;
    let enemy = { ...(res.state.enemy as Enemy), health: Math.max(0, state.enemy.health - scaledStrike) };
    // THE READ NOW BITES STATUS (depth epic): scale THIS card's status contribution
    // (the delta over the pre-card intensity) by the read, so winning the read makes
    // a landed DoT/control/debuff hit harder and losing it softens — the marquee
    // "read the stance, draft the right color" decision finally matters for the status
    // play that IS the game, not just the vestigial strike. neutral/none = 1.0 → an
    // un-read play leaves intensities byte-identical. Only this card's delta is scaled,
    // so prior stacks are preserved.
    const statusMult = READ_STATUS_MULT[read];
    if (statusMult !== 1) {
        enemy = {
            ...enemy,
            effects: enemy.effects.map(a => {
                const prior = before[a.effectId] ?? 0;
                const delta = a.intensity - prior;
                if (delta <= 0) return a;
                const scaled = Math.max(1, Math.round(prior + delta * statusMult));
                return scaled === a.intensity ? a : { ...a, intensity: scaled };
            }),
        };
    }
    const combatResources = res.state.combatResources;
    let attribution = state.attribution;
    let directDamage = state.directDamageDealt + scaledStrike;
    let landedOnEnemy = false;
    let mercyOpened = res.activateMercyChoice === true;
    if (scaledStrike > 0) {
        attribution = recordAttribution(attribution, card.id, card.name, null, scaledStrike);
        events.push({ kind: 'damage-dealt', cardId: card.id, target: 'enemy', amount: scaledStrike });
    }

    // ── 0.34.0 card mechanics — RUPTURE / COMPOUND / EXECUTE / SIPHON ─────────
    // HP behavior owned here (the skill engine no-ops these kinds). RUPTURE/COMPOUND
    // read state.enemy (pre-card) so the foe's own fresh debuff never self-counts.
    const mechs = skill.specialMechanics ?? [];
    let mechanicDamage = 0;
    const ruptureMech = mechs.find(m => m.kind === 'rupture') as { kind: 'rupture'; bonusPct?: number } | undefined;
    if (ruptureMech) {
        const pending = getPendingDotTotal(state.enemy).total;
        const consumedRes = consumeDotEffects(enemy);
        enemy = consumedRes.combatant;
        const burst = Math.min(
            RUPTURE_BURST_CAP,
            Math.round(pending * mult * (1 + (ruptureMech.bonusPct ?? 0)) * vulnMult),
        );
        if (burst > 0) {
            enemy = applyDamage(enemy, burst);
            mechanicDamage += burst;
            directDamage += burst;
            attribution = recordAttribution(attribution, card.id, card.name, null, burst);
        }
        events.push({ kind: 'rupture-detonated', amount: burst, consumed: consumedRes.consumed });
    }
    const amplifyMech = mechs.find(m => m.kind === 'amplify') as { kind: 'amplify'; multiplier: number } | undefined;
    if (amplifyMech) {
        const pending = getPendingDotTotal(state.enemy).total;
        const amplifyBurst = Math.min(
            AMPLIFY_BURST_CAP,
            Math.round(pending * amplifyMech.multiplier * mult * vulnMult),
        );
        if (amplifyBurst > 0) {
            enemy = applyDamage(enemy, amplifyBurst);
            mechanicDamage += amplifyBurst;
            directDamage += amplifyBurst;
            attribution = recordAttribution(attribution, card.id, card.name, null, amplifyBurst);
        }
        events.push({ kind: 'amplify-detonated', amount: amplifyBurst, pendingDot: pending });
    }
    const compoundMech = mechs.find(m => m.kind === 'compound') as { kind: 'compound'; perDebuff: number } | undefined;
    if (compoundMech) {
        const count = Math.min(getDistinctDebuffCount(state.enemy), COMPOUND_COUNT_CAP);
        const dmg = Math.round(compoundMech.perDebuff * count * mult * vulnMult);
        if (dmg > 0) {
            enemy = applyDamage(enemy, dmg);
            mechanicDamage += dmg;
            directDamage += dmg;
            attribution = recordAttribution(attribution, card.id, card.name, null, dmg);
        }
        events.push({ kind: 'compound-hit', amount: dmg, debuffs: count });
    }
    const executeMech = mechs.find(m => m.kind === 'execute') as
        { kind: 'execute'; hpPct: number; dotStacks: number; recoilPct?: number } | undefined;
    if (executeMech) {
        const ready = state.enemy.health <= state.enemy.maxHealth * executeMech.hpPct
            || getPendingDotTotal(state.enemy).perEffect.length >= executeMech.dotStacks;
        if (ready) {
            const large = Math.round(state.enemy.maxHealth * EXECUTE_DAMAGE_FRACTION);
            const dmg = Math.min(enemy.health, Math.round(large * vulnMult));
            if (dmg > 0) {
                enemy = applyDamage(enemy, dmg);
                mechanicDamage += dmg;
                directDamage += dmg;
                attribution = recordAttribution(attribution, card.id, card.name, null, dmg);
            }
            const recoil = Math.round(player.maxHealth * (executeMech.recoilPct ?? 0));
            if (recoil > 0) player = applyDamage(player, recoil);
            events.push({ kind: 'execute-fired', amount: dmg, recoil });
        }
    }
    // SIPHON — heal for a fraction of all HP this card eroded (strike + bursts).
    const siphonMech = mechs.find(m => m.kind === 'siphon') as { kind: 'siphon'; pct: number } | undefined;
    if (siphonMech) {
        const healAmt = Math.round((scaledStrike + mechanicDamage) * siphonMech.pct);
        if (healAmt > 0) {
            player = heal(player, healAmt);
            events.push({ kind: 'damage-dealt', cardId: card.id, target: 'self', amount: -healAmt });
        }
    }
    // Offensive status ids this card landed on the enemy — gates the combo loop on
    // VARIETY (a status new to this chain refreshes the die; a repeat spends it).
    const landedOffensiveIds: string[] = [];

    // 4. Fold the skill's effect-applications: DoT + control LAND on the enemy.
    //    DoT will tick real HP each phase (the status damage engine); control gates
    //    the enemy's turn via `canAct`. Attribute projected DoT for the summary.
    for (const ev of res.events) {
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
            }
        } else if (ev.kind === 'buff-fumbled') {
            events.push({ kind: 'effect-fizzled', cardId: card.id, effectId: ev.effect.id, message: ev.message });
        } else if (ev.kind === 'buff-stripped') {
            // strip_random_buff (e.g. Ad Hominem Strike): the skill engine already
            // removed the buff from the live snapshot (folded via res.state); surface
            // the event so the hazard combat log/UI can show it. `effect` is null
            // when there was no buff to strip.
            events.push({
                kind: 'buff-stripped', cardId: card.id, target: ev.target,
                effectId: ev.effect?.id ?? null, effectName: ev.effect?.name ?? null,
            });
        } else if (ev.kind === 'befriend-attempted' && ev.successful) {
            mercyOpened = true;
        }
    }

    // 5. Status-combo loop: the drafted die REFRESHES (chain another card) ONLY
    //    when this card landed a status NEW to the current chain — a long "big
    //    turn" comes from playing DIFFERENT statuses. Re-applying one (or landing
    //    nothing) spends the die and ends the turn.
    const chainBefore = state.chainEffectIds ?? [];
    const newChainIds = landedOffensiveIds.filter(id => !chainBefore.includes(id));
    const landedNewDistinct = newChainIds.length > 0;
    let dice = state.dice;
    if (landedOnEnemy && landedNewDistinct) {
        events.push({ kind: 'die-refreshed', dieId: drafted.id, color: drafted.color });
    } else {
        dice = spendDice(state.dice, [drafted.id]);
        events.push({ kind: 'die-spent', dieId: drafted.id, color: drafted.color });
    }

    // Defense card → GUARD: a shield vs the enemy's NEXT telegraphed threat,
    // read-scaled (advantage powers a bigger brace) + the color-match bonus, so it
    // scales like the immediate strike. Absorbed in `resolveThreatPhase`.
    const guardMech = (skill.specialMechanics ?? []).find(m => m.kind === 'guard') as { amount: number } | undefined;
    const guardGain = guardMech
        ? Math.max(1, Math.round(guardMech.amount * mult)) + (colorMatch ? COLOR_MATCH_DAMAGE_BONUS : 0)
        : 0;
    // BARRIER — a STACKING, persistent soak (distinct from one-shot guard); read-scaled.
    const barrierMech = mechs.find(m => m.kind === 'barrier') as { kind: 'barrier'; amount: number } | undefined;
    const barrierGain = barrierMech
        ? Math.max(1, Math.round(barrierMech.amount * mult)) + (colorMatch ? COLOR_MATCH_DAMAGE_BONUS : 0)
        : 0;
    // RIPOSTE — arm a one-shot parry (read-scaled); a prior arming this phase survives.
    const riposteMech = mechs.find(m => m.kind === 'riposte') as { kind: 'riposte'; damage: number; reduce: number } | undefined;
    const riposteArmed = riposteMech
        ? {
            damage: Math.max(1, Math.round(riposteMech.damage * mult)) + (colorMatch ? COLOR_MATCH_DAMAGE_BONUS : 0),
            reduce: Math.max(0, Math.round(riposteMech.reduce * mult)),
          }
        : state.riposte;

    let next: CombatEncounterState = {
        ...state, player, enemy, dice, combatResources, attribution,
        chainEffectIds: [...chainBefore, ...newChainIds],
        guard: (state.guard ?? 0) + guardGain,
        barrier: (state.barrier ?? 0) + barrierGain,
        riposte: riposteArmed,
        directDamageDealt: directDamage,
    };
    next = discardEntry(next, uid);
    if (mercyOpened) {
        next = { ...next, mercyChoiceActive: true };
        events.push({ kind: 'mercy-opened', message: `${enemy.name} falters — spare or exploit?` });
    }
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
    // even before the cumulative penalty reaches THREAT_DENY_AT. Only denies MORE
    // often, never less; fires at >=3 distinct controls (new content), so existing
    // 1-2-control fights are byte-identical.
    const controlPips = getDistinctControlCount(state.enemy);
    const disruptDenied = controlPips >= DISRUPT_DENY_AT;
    const denied = rollPenalty >= THREAT_DENY_AT || disruptDenied;
    const weakenMult = Math.max(THREAT_WEAKEN_FLOOR, Math.min(1, 1 - rollPenalty * THREAT_WEAKEN_PER_ROLL));
    // THE CLOCK (depth epic): the telegraphed hit escalates each round past the grace
    // window, so a drawn-out fight turns lethal. 1.0 on round ≤ grace (a fast kill is
    // unpunished → those fights are byte-identical to pre-epic).
    // Boss/unique enemies escalate FASTER: their per-round rate is multiplied by
    // THREAT_ESCALATION_BOSS_MULT so a dragging boss fight becomes more lethal than a
    // dragging normal fight — makes finishing bosses quickly (DoT/control) the clear
    // efficient path.
    const isBossTier = state.enemy.difficulty === 'boss' || state.enemy.difficulty === 'unique';
    const escalationRate = THREAT_ESCALATION_PER_ROUND * (isBossTier ? THREAT_ESCALATION_BOSS_MULT : 1);
    const escalation = Math.min(
        THREAT_ESCALATION_MAX,
        1 + escalationRate * Math.max(0, state.round - THREAT_ESCALATION_GRACE),
    );
    const hindered = !act.canAct || denied;
    if (disruptDenied) events.push({ kind: 'disrupt-denied', pips: controlPips });

    let player = state.player;
    let enemy = state.enemy;
    // GUARD (one-shot, per-phase) absorbs first; BARRIER (persistent, stacking)
    // soaks the remainder; RIPOSTE parries + counters once. All no-op when unset
    // (guard 0 / barrier 0 / riposte null / no player thorns) → byte-identical.
    let guard = state.guard ?? 0;
    let barrier = state.barrier ?? 0;
    const riposte = state.riposte ?? null;
    let riposteFired = false;
    const penaltiesApplied: CombatThreatEffect[] = [];

    if (!hindered) {
        // The enemy attacks: its telegraphed threat action fires on the player.
        for (const eff of phase.threatAction.effects) {
            if (eff.damage && eff.damage > 0) {
                // weakenMult (<1) is the soft-control reduction; 1 when the enemy
                // carries no roll penalty (every pre-0.33.0 case → byte-identical).
                let dmg = Math.round(eff.damage * THREAT_DAMAGE_SCALE * weakenMult * escalation);
                // RIPOSTE reduces the incoming hit once this phase.
                if (riposte && !riposteFired) { dmg = Math.max(0, dmg - riposte.reduce); riposteFired = true; }
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
                if (dmg > 0) player = applyDamage(player, dmg);
            }
            if (eff.effectId) {
                const def = lookupEffectDef(eff.effectId);
                if (def) {
                    const res = applyEffect(player.effects, def, state.round, {
                        intensityDelta: eff.intensity ?? 1,
                        durationMode: eff.duration ? 'additive' : 'reset',
                        durationDelta: eff.duration,
                        sourceId: enemy.id,
                    });
                    player = { ...player, effects: res.activeEffects };
                }
            }
            if (eff.enemyHeal && eff.enemyHeal > 0) {
                enemy = heal(enemy, eff.enemyHeal);
            }
            penaltiesApplied.push(eff);
        }
        // RIPOSTE counter + THORNS reflect — both punish the telegraphed swing,
        // scaled by the foe's own VULNERABLE multiplier (×1 when unmarked).
        if (riposte) {
            const counter = Math.round(riposte.damage * getDamageTakenMultiplier(enemy));
            if (counter > 0) {
                enemy = applyDamage(enemy, counter);
                events.push({ kind: 'riposte-fired', amount: counter });
            }
        }
        const reflect = getThornsReflect(state.player);
        if (reflect > 0) {
            const amount = Math.round(reflect * getDamageTakenMultiplier(enemy));
            enemy = applyDamage(enemy, amount);
            events.push({ kind: 'thorns-reflected', amount, target: 'enemy' });
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

    let next: CombatEncounterState = {
        ...state,
        player,
        enemy,
        guard: 0,                       // brace is spent on this phase's threat; resets each phase
        barrier,                        // persistent soak — carries the unspent remainder across phases
        riposte: undefined,             // one-shot parry — cleared each phase (like guard)
        phase: 'phase-resolve',
        threatMarks,
        phaseResults: [...state.phaseResults, result],
    };
    next = withLog(next, events);

    // Outcome checks after the threat action (HP).
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
 * sides, effect durations tick, and a fresh hand of 5 is drawn. Advances the
 * phase pointer (looping the final phase so the enemy keeps attacking).
 */
export function processBetweenPhases(
    state: CombatEncounterState,
    rng: () => number = defaultRng,
    priorEvents: CombatEvent[] = [],
): CombatTransition {
    const events: CombatEvent[] = [];

    // 1. Per-effect DoT ticks (labeled, §7.5) — computed before processing.
    const enemyDotTicks = dotTickBreakdown(state.enemy.effects);
    const playerDotTicks = dotTickBreakdown(state.player.effects);

    // 2. Process a full round of effects on the enemy — DoT ERODES real enemy HP
    //    (the status damage engine; no track, the HP loss is the win progress).
    const enemyStart = processRoundStartEffects(state.enemy);
    const enemyEnd = processRoundEndEffects(enemyStart.target);
    let enemy = enemyEnd.target as Enemy;

    // VULNERABLE DoT surcharge: the natural tick above lands at ×1 (already
    // combo-amplified). Apply the EXTRA (mult-1) fraction the foe's vulnerability
    // adds to its DoT, as one labeled tick so the emitted dot-tick events still
    // sum to the HP that actually left the bar. No-op (and no event) when unmarked.
    const enemyVulnMult = getDamageTakenMultiplier(state.enemy);
    let vulnSurcharge = 0;
    if (enemyVulnMult > 1) {
        const mods = getActiveEffectModifiers(state.enemy.effects);
        const naturalDot = mods.dotStart + mods.dotEnd;
        vulnSurcharge = Math.round(naturalDot * (enemyVulnMult - 1));
        if (vulnSurcharge > 0) enemy = applyDamage(enemy, vulnSurcharge);
    }

    // 3. Process a full round of effects on the player (DoT / regen / drain).
    const playerStart = processRoundStartEffects(state.player);
    const playerEnd = processRoundEndEffects(playerStart.target);
    const player = playerEnd.target as Character;

    for (const t of enemyDotTicks) events.push({ kind: 'dot-tick', effectId: t.effectId, label: t.label, amount: t.amount, target: 'enemy' });
    if (vulnSurcharge > 0) events.push({ kind: 'dot-tick', effectId: 'vulnerable-surcharge', label: 'Vulnerable', amount: vulnSurcharge, target: 'enemy' });
    for (const t of playerDotTicks) events.push({ kind: 'dot-tick', effectId: t.effectId, label: t.label, amount: t.amount, target: 'self' });

    // 4. Advance the phase pointer — loop the final phase so the enemy keeps acting.
    const nextIndex = Math.min(state.currentPhaseIndex + 1, state.threatPhases.length - 1);

    // 5. Draw a fresh hand of 5 (discard the old hand — Hazard's "draw fresh").
    const discardedHand = state.hand.map(h => h.cardId);
    const draw = drawCombatCards(state.drawPile, [...state.discard, ...discardedHand], state.deck, COMBAT_HAND_SIZE, rng);
    let uid = state.round * 100;
    const hand = draw.drawn.map(cardId => ({ uid: `c${++uid}`, cardId }));
    events.push({ kind: 'hand-drawn', cards: draw.drawn });

    let next: CombatEncounterState = {
        ...state,
        player,
        enemy,
        currentPhaseIndex: nextIndex,
        drawPile: draw.drawPile,
        discard: draw.discard,
        hand,
        phase: 'phase-play',
        round: state.round + 1,
        // New phase → fresh turn; clear the draft so the next startTurn rolls.
        dice: [],
        draftedDieId: null,
        lastRead: 'none',
        carriedDie: null,
    };
    next = withLog(next, events);

    // 6. Outcome checks after ticks (HP).
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
function dotTickBreakdown(effects: readonly ActiveEffect[]): DotTick[] {
    return getActiveDotTotal(effects as ActiveEffect[]).perEffect.map(
        e => ({ effectId: e.effectId, label: e.label, amount: e.amount }),
    );
}

// ── Batch entry point (§9 resolveCombatPhase) ────────────────────────────────

/**
 * Picks the best die to draft from this turn's pool for a card of `cardStance`
 * against `enemyStance`: prefer a die that wins the read (advantage), then a
 * color-match, then any usable die, else the first (an X draft just banks the
 * token). Used by the batch entry + sim to auto-play.
 */
export function chooseDraft(
    dice: readonly CombatManaDie[],
    cardStance: CombatDieColor,
    enemyStance: Stance | null,
): string | null {
    if (dice.length === 0) return null;
    const usable = dice.filter(d => d.state === 'available' && d.color !== 'x');
    if (usable.length === 0) return dice[0]?.id ?? null; // forced X — bank the token
    // `enemyStance === null` ⇒ the player can't see the stance yet (blind play):
    // skip the advantage seek and draft for a color-match instead.
    const advantage = enemyStance !== null
        ? usable.find(d => dieHasStance(d.color) && stanceBeats(d.color as Stance, enemyStance))
        : undefined;
    if (advantage) return advantage.id;
    const match = usable.find(d => d.color === 'wild' || d.color === cardStance);
    if (match) return match.id;
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
    skillId: string,
    rng: () => number = defaultRng,
): CombatTransition {
    if (state.phase !== 'phase-play') return { state, events: [] };
    const skill = getSignatureSkill(skillId);
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
        { kind: 'signature-cast', skillId: skill.id, name: skill.name, cost: skill.cost },
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

/** Die-cost preview for a card against the current phase (RPS indicator, §7.3). */
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

/** True when the player has revealed a given phase's hidden enemy stance (§2). */
export function isPhaseStanceRevealed(state: CombatEncounterState, phaseIndex: number): boolean {
    return state.revealedStances.includes(phaseIndex);
}

/** The current phase's enemy stance IF revealed, else null (drives the "?" UI). */
export function revealedCurrentStance(state: CombatEncounterState): Stance | null {
    const idx = Math.min(state.currentPhaseIndex, state.threatPhases.length - 1);
    return state.revealedStances.includes(idx) ? currentPhaseStance(state) : null;
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
 * UI preview (HP model): projects the IMMEDIATE strike HP damage a card would
 * deal if POWERed RIGHT NOW with the currently drafted die — read multiplier +
 * color-match bonus + the strike weight. (Status DoT damage is over-time, shown
 * separately.) `track` is the card's classification, for flavor. Neutral read
 * when no die is drafted.
 */
export function projectCardImpact(
    state: CombatEncounterState,
    card: CombatCard,
): { track: 'dot' | 'control' | 'none'; amount: number } {
    const d = draftedDie(state);
    const read: CombatReadResult = d ? state.lastRead : 'neutral';
    const mult = READ_DAMAGE_MULT[read];
    const colorMatch = !!d && (d.color === 'wild' || d.color === card.stance);
    const skill = card.skillId ? lookupSkill(card.skillId) : undefined;
    const base = skill ? calculateSkillDamage(state.player, skill) : 0;
    const amount = base > 0
        ? Math.max(1, Math.round(base * DIRECT_DAMAGE_WEIGHT * mult) + (colorMatch ? COLOR_MATCH_DAMAGE_BONUS : 0))
        : 0;
    return { track: card.effectKind, amount };
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
    const pending = getPendingDotTotal(state.enemy).total;
    return Math.min(
        RUPTURE_BURST_CAP,
        Math.round(pending * READ_DAMAGE_MULT[read] * getDamageTakenMultiplier(state.enemy)),
    );
}

/** EXECUTE readiness — true when the foe is at/below `hpPct` of max HP OR carries
 *  at least `dotStacks` distinct DoT effects. The finisher's gate (mobile lights
 *  the card off this). */
export function isExecuteReady(state: CombatEncounterState, hpPct: number, dotStacks: number): boolean {
    return state.enemy.health <= state.enemy.maxHealth * hpPct
        || getPendingDotTotal(state.enemy).perEffect.length >= dotStacks;
}

/** EXECUTE projection for a card carrying the execute mechanic: whether it is
 *  ready and the HP it would deal (clamped to the foe's remaining HP). */
export function projectExecute(
    state: CombatEncounterState,
    card: CombatCard,
): { ready: boolean; amount: number } {
    const skill = card.skillId ? lookupSkill(card.skillId) : undefined;
    const mech = (skill?.specialMechanics ?? []).find(m => m.kind === 'execute') as
        { kind: 'execute'; hpPct: number; dotStacks: number; recoilPct?: number } | undefined;
    if (!mech) return { ready: false, amount: 0 };
    const ready = isExecuteReady(state, mech.hpPct, mech.dotStacks);
    if (!ready) return { ready: false, amount: 0 };
    const large = Math.round(state.enemy.maxHealth * EXECUTE_DAMAGE_FRACTION);
    return { ready, amount: Math.min(state.enemy.health, Math.round(large * getDamageTakenMultiplier(state.enemy))) };
}

/** SIPHON projection — the heal a siphon card would grant if powered now (off the
 *  projected strike). Convenience; the live heal in `playBottomAction` also scales
 *  off any rupture/compound/execute burst the same card deals. */
export function projectSiphonHeal(state: CombatEncounterState, card: CombatCard): number {
    const skill = card.skillId ? lookupSkill(card.skillId) : undefined;
    const mech = (skill?.specialMechanics ?? []).find(m => m.kind === 'siphon') as
        { kind: 'siphon'; pct: number } | undefined;
    if (!mech) return 0;
    return Math.round(projectCardImpact(state, card).amount * mech.pct);
}

/** Re-export for presenters that need to check die affordability directly. */
export { combatDieCanPower, availableDiceFor, effectImpact, cardStanceColor };
