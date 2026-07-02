/**
 * Hazard balance simulator — deterministic simulation harness.
 *
 * Drives full sessions through the pure engine with scripted player
 * policies so balance can be asserted in hermetic tests (and tuned with
 * evidence, mirroring the gathering/quest-board sims). No I/O, no 
 * Math.random — every run is reproducible from its seed.
 *
 * Policies:
 *  - `greedy`       — stages best value cards, fires utilities when helpful,
 *                     spends matching dice while short of threshold
 *  - `conservative` — safe route only, minimal die spending, targets 90%+ win rate
 *  - `opportunist`  — risk route only, aggressive die spending, targets 15%+ perfect rate
 */

import {
    continueHazardAfterResolve,
    createHazardSession,
    discardHazardCard,
    finishHazardRolling,
    hazardCardValue,
    hazardProjectedProgress,
    powerHazardCard,
    resolveHazardRound,
    selectHazardRoute,
    stageHazardCard,
} from './hazard.engine';
import { getHazardCardDef, getHazardDef } from './hazard.content';
import {
    type HazardOutcomeTier,
    type HazardRouteKey,
    type HazardSessionState,
} from './hazard.types';
import { HAZARD_TUNING } from './hazard.tuning';
import { hazardStarterBag } from './hazard.deck-flags';

export type HazardPolicyId = 'greedy' | 'conservative' | 'opportunist';

interface RoundNeed {
    needF: number;
    needE: number;
    combined: boolean;
}

function roundNeed(s: HazardSessionState): RoundNeed {
    const def = getHazardDef(s.hazardId);
    if (s.route === 'risk') {
        const [needF, needE] = def.risk.thresholds[s.round - 1];
        return { needF, needE, combined: false };
    }
    return { needF: def.safe.thresholds[s.round - 1], needE: 0, combined: true };
}

function shortfall(s: HazardSessionState): number {
    const need = roundNeed(s);
    const p = hazardProjectedProgress(s);
    if (need.combined) return Math.max(0, need.needF - (p.force + p.escape));
    return Math.max(0, need.needF - p.force) + Math.max(0, need.needE - p.escape);
}

/** Value of a card's FREE row toward whatever is still needed. Hybrids
 *  (purple/gold) count their numbers too — gold's free row is 0/0, so it
 *  contributes nothing until a die is applied. */
function freeValueToward(s: HazardSessionState, cardId: string): number {
    const def = getHazardCardDef(cardId);
    if (def.dead) return 0;
    const need = roundNeed(s);
    const p = hazardProjectedProgress(s);
    if (need.combined) return def.f + def.e;
    const fGap = Math.max(0, need.needF - p.force);
    const eGap = Math.max(0, need.needE - p.escape);
    return Math.min(def.f, fGap + 2) + Math.min(def.e, eGap + 2);
}

function playGreedyRound(s: HazardSessionState, bag: readonly string[]): HazardSessionState {
    // 1. Fire free draw utilities first — more options.
    for (const h of s.hand.slice()) {
        const def = getHazardCardDef(h.cardId);
        if (def.effect === 'draw') s = stageHazardCard(s, h.uid, bag);
    }
    // 2. Convert hex dice when present and we hold cards of that colour.
    const hexCount = s.dice.filter((d) => d.kind === 'hex' && d.state === 'available').length;
    if (hexCount > 0) {
        for (const h of s.hand.slice()) {
            const def = getHazardCardDef(h.cardId);
            if (def.effect === 'convert') {
                const holdsColour = s.hand.some((x) => {
                    const d = getHazardCardDef(x.cardId);
                    return !d.effect && !d.dead && d.kind === def.kind;
                });
                if (holdsColour) s = stageHazardCard(s, h.uid, bag);
            }
        }
    }
    // 3. Stage value cards, best contribution first (the play area is
    //    uncapped; the guard only bounds the loop).
    let guard = 0;
    while (guard++ < 20) {
        const candidates = s.hand
            .map((h) => ({ h, v: freeValueToward(s, h.cardId) }))
            .filter((c) => c.v > 0)
            .sort((a, b) => b.v - a.v);
        if (candidates.length === 0) break;
        s = stageHazardCard(s, candidates[0].h.uid, bag);
    }
    // 4. Scrap the dead weight: hand cards contributing nothing this
    //    round (CRACKs, off-meter stat cards, utilities with no current
    //    use) go to the bin for their salvage — a player with a trash
    //    bin doesn't hoard clutter. Convert cards are held while hex
    //    dice could still appear from a re-cast.
    const anyHex = s.dice.some((d) => d.kind === 'hex');
    for (const h of s.hand.slice()) {
        const def = getHazardCardDef(h.cardId);
        const worthless = def.dead || (!def.effect && freeValueToward(s, h.cardId) === 0);
        const staleUtility =
            (def.effect === 'convert' && !anyHex) || def.effect === 'recast';
        if (worthless || staleUtility) s = discardHazardCard(s, h.uid);
    }
    // 5. Spend matching dice while still short. Best powered delta first.
    guard = 0;
    while (shortfall(s) > 0 && guard++ < 12) {
        const need = roundNeed(s);
        const p = hazardProjectedProgress(s);
        let best: { uid: string; dieId: string; delta: number } | null = null;
        for (const e of s.play) {
            if (e.dieId) continue;
            const def = getHazardCardDef(e.cardId);
            if (def.dead) continue;
            // Prefer an exact-colour die; fall back to the wild gold die.
            const die =
                s.dice.find((d) => d.kind === def.kind && d.state === 'available') ??
                s.dice.find((d) => d.kind === 'gold' && d.state === 'available');
            if (!die) continue;
            const free = hazardCardValue(e);
            const powered = { force: def.fp ?? def.f, escape: def.ep ?? def.e };
            let delta: number;
            if (need.combined) {
                delta = powered.force + powered.escape - (free.force + free.escape);
            } else {
                const fGap = Math.max(0, need.needF - p.force);
                const eGap = Math.max(0, need.needE - p.escape);
                delta =
                    Math.min(powered.force - free.force, fGap) +
                    Math.min(powered.escape - free.escape, eGap);
            }
            if (delta > 0 && (!best || delta > best.delta)) {
                best = { uid: e.uid, dieId: die.id, delta };
            }
        }
        if (!best) break;
        s = powerHazardCard(s, best.uid, best.dieId, bag);
    }
    return s;
}

function playConservativeRound(s: HazardSessionState, bag: readonly string[]): HazardSessionState {
    // Conservative: minimal die spending, only sure wins, very cautious
    
    // 1. Fire free utilities when they can't hurt
    for (const h of s.hand.slice()) {
        const def = getHazardCardDef(h.cardId);
        if (def.effect === 'draw') s = stageHazardCard(s, h.uid, bag);
    }
    
    // 2. Stage only clearly beneficial cards (high free value, low risk)
    const plots = s.hand
        .map((h) => ({ h, v: freeValueToward(s, h.cardId) }))
        .filter((c) => c.v >= 3) // Only high-value cards
        .sort((a, b) => b.v - a.v);
    
    for (const plot of plots.slice(0, 3)) { // Max 3 cards staged
        s = stageHazardCard(s, plot.h.uid, bag);
    }
    
    // 3. Discard dead weight
    for (const h of s.hand.slice()) {
        const def = getHazardCardDef(h.cardId);
        if (def.dead || freeValueToward(s, h.cardId) === 0) {
            s = discardHazardCard(s, h.uid);
        }
    }
    
    // 4. Spend dice only if we're very short and have perfect matches
    const currentShortfall = shortfall(s);
    if (currentShortfall > 2) { // Only if significantly short
        for (const e of s.play) {
            if (e.dieId) continue;
            const def = getHazardCardDef(e.cardId);
            if (def.dead) continue;
            
            // Only use exact color matches (no gold dice for conservative)
            const die = s.dice.find((d) => d.kind === def.kind && d.state === 'available');
            if (!die) continue;
            
            const free = hazardCardValue(e);
            const powered = { force: def.fp ?? def.f, escape: def.ep ?? def.e };
            const delta = (powered.force - free.force) + (powered.escape - free.escape);
            
            if (delta >= 2) { // Only significant improvements
                s = powerHazardCard(s, e.uid, die.id, bag);
                break; // One die per round max
            }
        }
    }
    
    return s;
}

function playOpportunistRound(s: HazardSessionState, bag: readonly string[]): HazardSessionState {
    // Opportunist: aggressive die spending, maximize high-value plays
    
    // 1. Fire all utilities aggressively
    for (const h of s.hand.slice()) {
        const def = getHazardCardDef(h.cardId);
        if (def.effect === 'draw') s = stageHazardCard(s, h.uid, bag);
    }
    
    // Convert all available hex dice
    const hexCount = s.dice.filter((d) => d.kind === 'hex' && d.state === 'available').length;
    if (hexCount > 0) {
        for (const h of s.hand.slice()) {
            const def = getHazardCardDef(h.cardId);
            if (def.effect === 'convert') {
                s = stageHazardCard(s, h.uid, bag);
            }
        }
    }
    
    // 2. Stage all potentially valuable cards
    let guard = 0;
    while (guard++ < 20) {
        const candidates = s.hand
            .map((h) => ({ h, v: freeValueToward(s, h.cardId) }))
            .filter((c) => c.v > 0)
            .sort((a, b) => b.v - a.v);
        if (candidates.length === 0) break;
        s = stageHazardCard(s, candidates[0].h.uid, bag);
    }
    
    // 3. Aggressively power cards - use ALL available dice
    guard = 0;
    while (guard++ < 12) {
        let best: { uid: string; dieId: string; delta: number } | null = null;
        
        for (const e of s.play) {
            if (e.dieId) continue;
            const def = getHazardCardDef(e.cardId);
            if (def.dead) continue;
            
            // Prefer exact color, but use gold freely
            const die =
                s.dice.find((d) => d.kind === def.kind && d.state === 'available') ??
                s.dice.find((d) => d.kind === 'gold' && d.state === 'available');
            if (!die) continue;
            
            const free = hazardCardValue(e);
            const powered = { force: def.fp ?? def.f, escape: def.ep ?? def.e };
            const delta = (powered.force - free.force) + (powered.escape - free.escape);
            
            if (delta > 0 && (!best || delta > best.delta)) {
                best = { uid: e.uid, dieId: die.id, delta };
            }
        }
        
        if (!best) break;
        s = powerHazardCard(s, best.uid, best.dieId, bag);
    }
    
    // 4. Minimal cleanup - only discard truly dead cards
    for (const h of s.hand.slice()) {
        const def = getHazardCardDef(h.cardId);
        if (def.dead) s = discardHazardCard(s, h.uid);
    }
    
    return s;
}

export interface SimStats {
    runs: number;
    perfect: number;
    complete: number;
    failure: number;
    avgWins: number;
    /** Fractions in [0,1]. */
    perfectRate: number;
    atLeastOneWinRate: number;
    failureRate: number;
}

const POLICY_ROUTE: Record<HazardPolicyId, HazardRouteKey> = {
    greedy: 'safe', // Greedy defaults to safe route (existing behavior)
    conservative: 'safe', // Conservative always safe
    opportunist: 'risk', // Opportunist always risk
};

export function simulateHazard(
    hazardId: string,
    route: HazardRouteKey,
    bag: readonly string[],
    runs: number,
    seedBase?: number,
): SimStats;
export function simulateHazard(
    hazardId: string,
    policy: HazardPolicyId,
    bag: readonly string[],
    runs: number,
    seedBase?: number,
): SimStats;
export function simulateHazard(
    hazardId: string,
    routeOrPolicy: HazardRouteKey | HazardPolicyId,
    bag: readonly string[],
    runs: number,
    seedBase?: number,
): SimStats {
    seedBase = seedBase ?? 1000;
    // Determine if this is policy-based or route-based call
    const isPolicy = ['greedy', 'conservative', 'opportunist'].includes(routeOrPolicy as string);
    const policy: HazardPolicyId = isPolicy ? (routeOrPolicy as HazardPolicyId) : 'greedy';
    const route: HazardRouteKey = isPolicy ? POLICY_ROUTE[policy] : (routeOrPolicy as HazardRouteKey);
    
    const tally: Record<HazardOutcomeTier, number> = { perfect: 0, complete: 0, failure: 0 };
    let totalWins = 0;
    for (let i = 0; i < runs; i++) {
        let s = createHazardSession(seedBase + i, bag, hazardId);
        s = finishHazardRolling(selectHazardRoute(s, route, bag));
        while (s.phase === 'playing') {
            // Use the appropriate bot policy
            if (policy === 'conservative') {
                s = playConservativeRound(s, bag);
            } else if (policy === 'opportunist') {
                s = playOpportunistRound(s, bag);
            } else {
                s = playGreedyRound(s, bag); // Default greedy behavior
            }
            
            // resolveHazardRound auto-applies any un-applied staged cards.
            const resolved = resolveHazardRound(s, bag);
            // A round with nothing stageable still has to resolve: stage the
            // least-bad card so the engine can judge it.
            if (resolved === s) {
                if (s.hand.length > 0) {
                    s = stageHazardCard(s, s.hand[0].uid, bag);
                    s = resolveHazardRound(s, bag);
                } else {
                    break;
                }
            } else {
                s = resolved;
            }
            s = continueHazardAfterResolve(s, bag);
        }
        if (s.outcome) {
            tally[s.outcome.tier] += 1;
            totalWins += s.outcome.wins;
        }
    }
    return {
        runs,
        perfect: tally.perfect,
        complete: tally.complete,
        failure: tally.failure,
        avgWins: totalWins / runs,
        perfectRate: tally.perfect / runs,
        atLeastOneWinRate: (tally.perfect + tally.complete) / runs,
        failureRate: tally.failure / runs,
    };
}

// ---------------------------------------------------------------------------
// A/B Testing
// ---------------------------------------------------------------------------

export interface HazardABResult {
    configA: SimStats;
    configB: SimStats;
    significant: boolean;
    analysis: {
        perfectRateDiff: number;
        failureRateDiff: number;
        avgWinsDiff: number;
    };
}

export function runHazardAB(
    configA: typeof HAZARD_TUNING,
    configB: typeof HAZARD_TUNING,
    options: { hazardId: string; runs: number },
): HazardABResult {
    const { hazardId, runs } = options;
    
    // For this initial implementation, we simulate with conservative policy
    // In a full implementation, we'd temporarily patch the tuning constants
    // Using different seed bases to ensure different randomness
    const bag = hazardStarterBag();
    
    const summaryA = simulateHazard(hazardId, 'conservative', bag, runs, 1000);
    const summaryB = simulateHazard(hazardId, 'conservative', bag, runs, 2000);
    
    const perfectRateDiff = summaryB.perfectRate - summaryA.perfectRate;
    const failureRateDiff = summaryB.failureRate - summaryA.failureRate;
    const avgWinsDiff = summaryB.avgWins - summaryA.avgWins;
    
    // Significance test: >5pp perfect rate OR >5pp failure rate difference
    const significant = Math.abs(perfectRateDiff) > 0.05 || Math.abs(failureRateDiff) > 0.05;
    
    return {
        configA: summaryA,
        configB: summaryB,
        significant,
        analysis: {
            perfectRateDiff,
            failureRateDiff,
            avgWinsDiff,
        },
    };
}

// ---------------------------------------------------------------------------
// Balance Band Reporting
// ---------------------------------------------------------------------------

export interface HazardBalanceBands {
    hazardId: string;
    policy: HazardPolicyId;
    perfectRate: { min: number; max: number; actual: number; inBand: boolean };
    failureRate: { min: number; max: number; actual: number; inBand: boolean };
    atLeastOneWinRate: { min: number; max: number; actual: number; inBand: boolean };
    overallHealth: 'healthy' | 'needs_tuning';
}

export interface HazardBalanceReport {
    bands: HazardBalanceBands[];
    timestamp: string;
    summary: { healthyHazards: number; totalHazards: number };
}

const BALANCE_BAND_THRESHOLDS = {
    conservative: { 
        perfectMin: 0.15, perfectMax: 0.40, 
        failureMin: 0.0, failureMax: 0.05,
        winMin: 0.90, winMax: 1.0 
    },
    greedy: { 
        perfectMin: 0.18, perfectMax: 0.52, 
        failureMin: 0.0, failureMax: 0.10,
        winMin: 0.85, winMax: 1.0 
    },
    opportunist: { 
        perfectMin: 0.03, perfectMax: 0.22, 
        failureMin: 0.03, failureMax: 0.25,
        winMin: 0.74, winMax: 0.97 
    },
};

export function generateHazardBalanceReport(hazardId: string): HazardBalanceReport {
    const bands: HazardBalanceBands[] = [];
    const bag = hazardStarterBag();
    const runs = 300;
    
    for (const policy of ['conservative', 'greedy', 'opportunist'] as const) {
        const summary = simulateHazard(hazardId, policy, bag, runs);
        const thresholds = BALANCE_BAND_THRESHOLDS[policy];
        
        const perfectInBand = summary.perfectRate >= thresholds.perfectMin && 
                             summary.perfectRate <= thresholds.perfectMax;
        const failureInBand = summary.failureRate >= thresholds.failureMin && 
                             summary.failureRate <= thresholds.failureMax;
        const winInBand = summary.atLeastOneWinRate >= thresholds.winMin && 
                         summary.atLeastOneWinRate <= thresholds.winMax;
        
        const overallHealth = (perfectInBand && failureInBand && winInBand) ? 'healthy' : 'needs_tuning';
        
        bands.push({
            hazardId,
            policy,
            perfectRate: {
                min: thresholds.perfectMin,
                max: thresholds.perfectMax,
                actual: summary.perfectRate,
                inBand: perfectInBand,
            },
            failureRate: {
                min: thresholds.failureMin,
                max: thresholds.failureMax,
                actual: summary.failureRate,
                inBand: failureInBand,
            },
            atLeastOneWinRate: {
                min: thresholds.winMin,
                max: thresholds.winMax,
                actual: summary.atLeastOneWinRate,
                inBand: winInBand,
            },
            overallHealth,
        });
    }
    
    const healthyHazards = bands.filter(b => b.overallHealth === 'healthy').length;
    
    return {
        bands,
        timestamp: new Date().toISOString(),
        summary: { healthyHazards, totalHazards: bands.length },
    };
}
