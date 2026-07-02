/**
 * Hazard-Pattern Combat — balance simulator (HP model).
 *
 * Drives full encounters through the pure engine with scripted policies so
 * balance can be asserted in hermetic tests and tuned with evidence. The win
 * condition is enemy HP → 0; status effects do the heavy lifting (DoT erodes
 * HP; control hinders the enemy's turn), strikes are the weak baseline. Every
 * run is reproducible from its seed.
 *
 * The default `greedy` policy models a read-playing human: each turn it rolls
 * 2 dice, drafts the one that wins the hidden-stance read (preferring a
 * color-match), powers the best STATUS card (favouring a NEW distinct status
 * for the combo refresh), rides the combo loop, banks Conviction and spends it
 * on damaging Signatures, and Befriends a low-HP foe to take the mercy/spare
 * path. The full roster (dot-weaver, control-lock, aggro-brute, turtle, chaos,
 * mercy-seeker) lives in `combat.sim-policies.ts`; `greedy`/`blind` keep
 * bit-identical behavior to the pre-roster sim.
 */

import type { Character } from '../Character/types';
import type { Enemy } from '../Enemy/types';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard,
    resolveThreatPhase, startTurn, draftStanceDie, endTurn, chooseDraft, revealedCurrentStance,
    playSignatureSkill, getDraftedDie, handCards, selectMercyChoice, getSignatureSkill,
} from './combat.engine';
import { getRng } from '../Utils/rng';
import type { CombatCard, CombatEncounterState, CombatOutcome } from './combat.encounter.types';
import { COMBAT_SIM_POLICIES, type CombatSimPolicy, type CombatSimPolicyId } from './combat.sim-policies';

/**
 * `greedy` — a competent omniscient witness: drafts using the enemy's hidden
 * stance for the sharpest balance signal. `blind` — a realistic-player witness:
 * drafts using ONLY player-visible info (the stance is unknown until revealed via
 * the read or a Scout), so it can't pre-seek advantage. Tune player-facing
 * difficulty against `blind`; tune ceilings against `greedy`. The wider roster
 * (dot-weaver, control-lock, aggro-brute, turtle, chaos, mercy-seeker) is
 * defined in `combat.sim-policies.ts`; the id type is re-exported here so
 * existing importers keep working.
 */
export type { CombatSimPolicyId } from './combat.sim-policies';

export interface CombatSimStats {
    runs: number;
    victories: number;       // enemy HP → 0
    mercies: number;         // spared a low-HP foe via Befriend
    defeats: number;
    retreats: number;
    /** Win rate = (victories + mercies) / runs. */
    winRate: number;
    avgRounds: number;
    /** Average share of plays that landed a status effect on the enemy (engagement witness). */
    statusEngagement: number;
    /** Average Conviction spent on Signature Skills per run. */
    avgConvictionSpent: number;
    /** Fraction of total enemy HP loss delivered by DoT ticks (0–1).
     *  Doctrine witness: DoT should be the primary damage source in status builds. */
    dotHpFraction: number;
    /** Fraction of total enemy HP loss from direct strikes (excl. mechanic bursts) (0–1). */
    strikeFraction: number;
    /** Fraction of total enemy HP loss from mechanic bursts (rupture/execute/compound/conclude) (0–1). */
    mechanicBurstFraction: number;
    /** Guard availability ratio: total guard present when an enemy threat fired /
     *  (that guard + total player HP damage taken). A proxy for how often GUARD was relevant. */
    guardMitigatedFraction: number;
    /** Mean count of active effects on the enemy at the start of each threat phase.
     *  Doctrine witness: a loaded status board = the engine working as intended. */
    avgActiveEffectsPerPhase: number;
}

/** Per-card telemetry for one run (or aggregated over many), keyed by the
 *  card/skill id — NOT the hand-entry uid. `statusLands` counts powered plays
 *  that landed at least one status on the enemy (the doctrine witness). */
export interface CombatCardUsage {
    cardId: string;
    plays: number;
    bottomPlays: number;
    topPlays: number;
    statusLands: number;
    discards: number;
}

/** Optional per-run knobs threaded through `runOneEncounter`. */
export interface CombatSimRunOptions {
    /** Explicit deck (card ids) passed to `initializeCombatEncounter`; omitted →
     *  the engine builds the deck from the player's known skills. */
    deck?: readonly string[];
    /** Card ids boosted to the FRONT of every policy's ranking — used by the
     *  card-coverage e2e to guarantee a specific card gets exercised. */
    focusCardIds?: readonly string[];
}

const currentPhase = (s: CombatEncounterState) =>
    s.threatPhases[Math.min(s.currentPhaseIndex, s.threatPhases.length - 1)];

/** Dominates every policy score band so a focused card always ranks first. */
const FOCUS_CARD_BOOST = 1e18;

/**
 * The best card in hand to POWER now, per the active policy's `rankCard`
 * (highest score wins; ties resolve to the earliest card in hand order, which
 * matches the legacy stable sort). Token-gated cards that fizzle are skipped
 * via `notUids`; `focusIds` (card-coverage harness) trump every band.
 */
function selectCard(
    s: CombatEncounterState,
    policy: CombatSimPolicy,
    rng: () => number,
    notUids?: Set<string>,
    focusIds?: ReadonlySet<string>,
): { uid: string; card: CombatCard } | null {
    const cards = handCards(s)
        .filter(c => c.card.verbClass !== 'retreat' && !(notUids && notUids.has(c.uid)));
    let best: { uid: string; card: CombatCard } | null = null;
    let bestScore = -Infinity;
    for (const c of cards) {
        let score = policy.rankCard(s, c.card, rng);
        if (focusIds && (focusIds.has(c.card.id) || (c.card.skillId !== null && focusIds.has(c.card.skillId)))) {
            score += FOCUS_CARD_BOOST;
        }
        if (score > bestScore) { bestScore = score; best = c; }
    }
    return best;
}

/** An affordable Signature (kind allowed by the policy) to spend banked
 *  Conviction on. Without a policy `rankSignature`, the FIRST affordable match
 *  in `state.signatures` order wins — the legacy `greedy`/`blind` behavior. */
function bestSignature(s: CombatEncounterState, policy: CombatSimPolicy, rng: () => number): string | null {
    let best: string | null = null;
    let bestScore = -Infinity;
    for (const id of s.signatures) {
        const sig = getSignatureSkill(id);
        if (!sig || s.conviction < sig.cost) continue;
        if (!policy.signatureKinds.includes(sig.kind)) continue;
        if (!policy.rankSignature) return id;
        const score = policy.rankSignature(s, sig, rng);
        if (score > bestScore) { bestScore = score; best = id; }
    }
    return best;
}

/** Records one play against the card's usage row (keyed by skill/card id). */
function bumpUsage(
    usage: Record<string, CombatCardUsage>,
    card: CombatCard,
    kind: 'top' | 'bottom',
    landedStatus = false,
): void {
    const key = card.skillId ?? card.id;
    const row = usage[key] ?? (usage[key] = {
        cardId: key, plays: 0, bottomPlays: 0, topPlays: 0, statusLands: 0, discards: 0,
    });
    row.plays++;
    if (kind === 'top') row.topPlays++;
    else row.bottomPlays++;
    if (landedStatus) row.statusLands++;
}

/** Plays a single threat phase to a stop (enemy dead, mercy opened, or hand/dice out). */
function policyPlayPhase(
    state: CombatEncounterState,
    policy: CombatSimPolicy,
    rng: () => number,
    usage: Record<string, CombatCardUsage>,
    focusIds?: ReadonlySet<string>,
): { state: CombatEncounterState; plays: number; statusPlays: number } {
    let working = state;
    let plays = 0;
    let statusPlays = 0;
    let guard = 0;
    const fizzledUids = new Set<string>();

    while (working.phase === 'phase-play' && guard < 60) {
        guard++;
        if (working.finalOutcome || working.mercyChoiceActive) break;

        // Spend banked Conviction on a damaging Signature when flush.
        if (working.conviction >= policy.convictionThreshold) {
            const sigId = bestSignature(working, policy, rng);
            if (sigId) {
                const cast = playSignatureSkill(working, sigId);
                if (cast.state !== working) { working = cast.state; if (working.finalOutcome) break; continue; }
            }
        }

        // Ensure a usable drafted die for this turn.
        let drafted = getDraftedDie(working);
        if (!drafted || drafted.state !== 'available' || drafted.color === 'x') {
            if (working.draftedDieId !== null) working = endTurn(working).state;
            if (working.dice.length === 0) {
                working = startTurn(working).state;
                if (working.phase !== 'phase-play') break;
            }
            const want = selectCard(working, policy, rng, fizzledUids, focusIds);
            // Blind play drafts off only what the player can see: the stance is
            // `null` until revealed (via the read or a Scout), so chooseDraft can't
            // pre-seek advantage — it color-matches like a real player on turn one.
            const enemyStance = policy.blind ? revealedCurrentStance(working) : currentPhase(working).enemyStance;
            const pick = chooseDraft(working.dice, want?.card.stance ?? 'wild', enemyStance);
            if (!pick) break;
            working = draftStanceDie(working, pick).state;
            drafted = getDraftedDie(working);
            if (!drafted || drafted.state !== 'available' || drafted.color === 'x') {
                // Forced X — chip with a free top, then end the turn.
                const top = handCards(working)[0];
                if (top) {
                    working = playCombatCard(working, { uid: top.uid }, false).state;
                    plays++;
                    bumpUsage(usage, top.card, 'top');
                }
                working = endTurn(working).state;
                if (handCards(working).length === 0 && working.dice.length === 0) break;
                continue;
            }
        }

        const want = selectCard(working, policy, rng, fizzledUids, focusIds);
        if (!want) {
            const top = handCards(working)[0];
            if (top) {
                working = playCombatCard(working, { uid: top.uid }, false).state;
                plays++;
                bumpUsage(usage, top.card, 'top');
            }
            working = endTurn(working).state;
            if (handCards(working).length === 0 && working.dice.length === 0) break;
            continue;
        }

        const res = playCombatCard(working, { uid: want.uid }, true);
        if (res.events.some(e => e.kind === 'effect-fizzled')) {
            // Token-gated with no banked token — drain via the free top and skip it.
            fizzledUids.add(want.uid);
            working = playCombatCard(working, { uid: want.uid }, false).state;
            plays++;
            bumpUsage(usage, want.card, 'top');
            continue;
        }
        working = res.state;
        plays++;
        const landed = res.events.some(e => e.kind === 'effect-landed' && e.target === 'enemy');
        if (landed) statusPlays++;
        bumpUsage(usage, want.card, 'bottom', landed);
        if (working.finalOutcome || working.mercyChoiceActive) break;

        const after = getDraftedDie(working);
        if (!after || after.state !== 'available') working = endTurn(working).state;
    }

    return { state: working, plays, statusPlays };
}

/** Runs a single seeded encounter and returns its outcome (+ per-card telemetry). */
export function runOneEncounter(
    player: Character,
    enemy: Enemy,
    seed: number,
    policy: CombatSimPolicyId = 'greedy',
    options?: CombatSimRunOptions,
): {
    outcome: CombatOutcome; rounds: number; plays: number; statusPlays: number; convictionSpent: number;
    dotHpDamage: number; mechanicBurstDamage: number; directHpDamage: number;
    guardOnAttack: number; playerHpTaken: number;
    activeEffectSamples: number[];
    cardUsage: Record<string, CombatCardUsage>;
} {
    const policyObj = COMBAT_SIM_POLICIES[policy];
    if (!policyObj) throw new Error(`Unknown combat sim policy '${String(policy)}'`);
    const focusIds = options?.focusCardIds ? new Set(options.focusCardIds) : undefined;
    const deck = options?.deck ? [...options.deck] : undefined;
    let state = initializeCombatEncounter(player, enemy, deck, seed);
    state = rollEncounterDice(state).state;
    // Policy randomness (chaos ranking) rides the same seeded global stream the
    // engine uses — never Math.random. greedy/blind never consume it, keeping
    // their engine stream (and therefore behavior) bit-identical to the
    // pre-roster sim.
    const rng = (): number => getRng().random();

    let plays = 0;
    let statusPlays = 0;
    let loopGuard = 0;
    let guardOnAttack = 0;
    let playerHpTaken = 0;
    const activeEffectSamples: number[] = [];
    const cardUsage: Record<string, CombatCardUsage> = {};

    while (state.phase !== 'complete' && loopGuard < 200) {
        loopGuard++;
        if (state.mercyChoiceActive) {
            state = selectMercyChoice(state, policyObj.mercyChoice).state;
            if (state.phase === 'complete' || state.finalOutcome) break;
            continue;
        }
        if (state.phase === 'phase-play') {
            const r = policyPlayPhase(state, policyObj, rng, cardUsage, focusIds);
            state = r.state;
            plays += r.plays;
            statusPlays += r.statusPlays;
            if (state.finalOutcome) break;
            if (state.mercyChoiceActive) {
                state = selectMercyChoice(state, policyObj.mercyChoice).state;
                if (state.phase === 'complete' || state.finalOutcome) break;
                continue;
            }
            if (state.phase === 'phase-play') {
                // Sample active effects and guard BEFORE the threat resolves.
                activeEffectSamples.push(state.enemy.effects.length);
                const guardBefore = state.guard ?? 0;
                const playerHpBefore = state.player.health;
                const result = resolveThreatPhase(state);
                state = result.state;
                // If the threat actually fired, attribute guard availability + HP taken.
                if (result.events.some(e => e.kind === 'threat-fired')) {
                    guardOnAttack += guardBefore;
                    playerHpTaken += Math.max(0, playerHpBefore - state.player.health);
                }
            }
        } else {
            break;
        }
    }

    const convictionSpent = Math.max(0, state.turn - state.conviction);

    // Derive HP-damage breakdown from the accumulated event log.
    let dotHpDamage = 0;
    let mechanicBurstDamage = 0;
    for (const ev of state.log) {
        if (ev.kind === 'dot-tick' && ev.target === 'enemy') dotHpDamage += ev.amount;
        if (ev.kind === 'rupture-detonated') mechanicBurstDamage += ev.amount;
        if (ev.kind === 'amplify-detonated') mechanicBurstDamage += ev.amount;
        if (ev.kind === 'execute-fired') mechanicBurstDamage += ev.amount;
        if (ev.kind === 'compound-hit') mechanicBurstDamage += ev.amount;
        if (ev.kind === 'conclude-hit') mechanicBurstDamage += ev.amount;
    }
    // directDamageDealt includes mechanic bursts; subtract them to get pure strikes.
    const directHpDamage = Math.max(0, state.directDamageDealt - mechanicBurstDamage);

    return {
        outcome: state.finalOutcome ?? 'defeat',
        rounds: state.round,
        plays,
        statusPlays,
        convictionSpent,
        dotHpDamage,
        mechanicBurstDamage,
        directHpDamage,
        guardOnAttack,
        playerHpTaken,
        activeEffectSamples,
        cardUsage,
    };
}

/** Options for `simulateHazardPatternCombatDetailed`. */
export interface CombatSimDetailedOptions {
    player: Character;
    enemy: Enemy;
    /** Number of seeded runs (default 300). */
    runs?: number;
    /** Per-run seed = startSeed + runIndex (default 1). */
    startSeed?: number;
    /** Scripted witness (default 'greedy'). */
    policy?: CombatSimPolicyId;
    /** Explicit deck threaded to every run. */
    deck?: readonly string[];
    /** Cards boosted to the front of ranking in every run (coverage harness). */
    focusCardIds?: readonly string[];
}

/**
 * Monte-Carlo simulation with per-card telemetry: runs `runs` seeded
 * encounters and reports the win/mercy/defeat distribution + engagement
 * witnesses, plus a per-card usage table aggregated over all runs.
 */
export function simulateHazardPatternCombatDetailed(
    options: CombatSimDetailedOptions,
): { stats: CombatSimStats; cardUsage: Record<string, CombatCardUsage> } {
    const count = options.runs ?? 300;
    const startSeed = options.startSeed ?? 1;
    const policy = options.policy ?? 'greedy';

    let victories = 0, mercies = 0, defeats = 0, retreats = 0;
    let totalRounds = 0, totalPlays = 0, totalStatusPlays = 0, totalConviction = 0;
    let totalDotHp = 0, totalMechanicBurst = 0, totalDirectHp = 0;
    let totalGuardOnAttack = 0, totalPlayerHpTaken = 0;
    let totalActiveEffectSamples = 0, totalPhaseSamples = 0;
    const cardUsage: Record<string, CombatCardUsage> = {};

    for (let i = 0; i < count; i++) {
        const r = runOneEncounter(options.player, options.enemy, startSeed + i, policy, {
            deck: options.deck,
            focusCardIds: options.focusCardIds,
        });
        if (r.outcome === 'victory') victories++;
        else if (r.outcome === 'mercy') mercies++;
        else if (r.outcome === 'retreat') retreats++;
        else defeats++;
        totalRounds += r.rounds;
        totalPlays += r.plays;
        totalStatusPlays += r.statusPlays;
        totalConviction += r.convictionSpent;
        totalDotHp += r.dotHpDamage;
        totalMechanicBurst += r.mechanicBurstDamage;
        totalDirectHp += r.directHpDamage;
        totalGuardOnAttack += r.guardOnAttack;
        totalPlayerHpTaken += r.playerHpTaken;
        for (const s of r.activeEffectSamples) totalActiveEffectSamples += s;
        totalPhaseSamples += r.activeEffectSamples.length;
        for (const row of Object.values(r.cardUsage)) {
            const agg = cardUsage[row.cardId] ?? (cardUsage[row.cardId] = {
                cardId: row.cardId, plays: 0, bottomPlays: 0, topPlays: 0, statusLands: 0, discards: 0,
            });
            agg.plays += row.plays;
            agg.bottomPlays += row.bottomPlays;
            agg.topPlays += row.topPlays;
            agg.statusLands += row.statusLands;
            agg.discards += row.discards;
        }
    }

    const totalEnemyHpLost = Math.max(1, totalDotHp + totalMechanicBurst + totalDirectHp);
    const guardDenom = Math.max(1, totalGuardOnAttack + totalPlayerHpTaken);

    const stats: CombatSimStats = {
        runs: count,
        victories,
        mercies,
        defeats,
        retreats,
        winRate: (victories + mercies) / count,
        avgRounds: totalRounds / count,
        statusEngagement: totalPlays > 0 ? totalStatusPlays / totalPlays : 0,
        avgConvictionSpent: totalConviction / count,
        dotHpFraction: totalDotHp / totalEnemyHpLost,
        strikeFraction: totalDirectHp / totalEnemyHpLost,
        mechanicBurstFraction: totalMechanicBurst / totalEnemyHpLost,
        guardMitigatedFraction: totalGuardOnAttack / guardDenom,
        avgActiveEffectsPerPhase: totalPhaseSamples > 0 ? totalActiveEffectSamples / totalPhaseSamples : 0,
    };
    return { stats, cardUsage };
}

/**
 * Monte-Carlo simulation: runs `count` seeded encounters and reports the
 * win/mercy/defeat distribution + engagement witnesses.
 */
export function simulateHazardPatternCombat(
    player: Character,
    enemy: Enemy,
    count = 300,
    startSeed = 1,
    policy: CombatSimPolicyId = 'greedy',
): CombatSimStats {
    return simulateHazardPatternCombatDetailed({ player, enemy, runs: count, startSeed, policy }).stats;
}
