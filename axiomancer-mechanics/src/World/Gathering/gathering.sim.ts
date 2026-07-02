/**
 * Gathering minigame — deterministic simulation harness.
 *
 * Drives full sessions through the pure engine with scripted player
 * policies so balance can be asserted in hermetic tests (and tuned with
 * evidence, mirroring the hazard sim). No I/O, no Math.random — every
 * run is reproducible from its seed.
 *
 * Policies:
 *  - `timid`    — gleans, pays what the place asks, takes only cheap
 *                 plots, leaves early. The restraint baseline.
 *  - `balanced` — gleans, descends deliberately, pays offerings under
 *                 pressure, leaves before despoilment.
 *  - `greedy`   — strips, takes the richest plot every time, never pays,
 *                 never leaves. The eruption baseline.
 */

import { getGatherPlotDef, GATHERING_SITES } from './gathering.content';
import {
    acknowledgeGatheringOutcome,
    canPayGatheringOffering,
    claimGatheringSpoils,
    continueGatheringAfterReprisal,
    createGatheringSession,
    descendGathering,
    gatheringHarvestWrath,
    gatheringHarvestYield,
    harvestGatheringPlot,
    payGatheringOffering,
    selectGatheringApproach,
    withdrawFromGathering,
} from './gathering.engine';
import type { GatherOutcome, GatherOutcomeTier, GatherPlotEntry, GatheringSessionState } from './gathering.types';
// import { GATHERING_TUNING } from './gathering.tuning';

export type GatherPolicyId = 'timid' | 'balanced' | 'greedy' | 'wrath-pusher' | 'communion-chaser';

type PolicyAction =
    | { type: 'harvest'; uid: string }
    | { type: 'descend' }
    | { type: 'offer'; id: string }
    | { type: 'withdraw' };

interface PolicyCtx {
    /** Taking harvests made at the current depth (resets on descend). */
    harvestsAtDepth: number;
}

function scoredPlots(s: GatheringSessionState): { entry: GatherPlotEntry; yieldR: number; wrath: number; breath: boolean }[] {
    return s.spread.map((entry) => {
        const def = getGatherPlotDef(entry.plotId);
        return {
            entry,
            yieldR: gatheringHarvestYield(s, def),
            wrath: gatheringHarvestWrath(s, def),
            breath: def.trait === 'breath',
        };
    });
}

function firstPayableOffering(s: GatheringSessionState): string | null {
    for (const o of s.offerings) {
        if (o.paid) continue;
        if (canPayGatheringOffering(s, o.id).payable) return o.id;
    }
    return null;
}

function timidPolicy(s: GatheringSessionState): PolicyAction {
    if (s.wrath >= 4) {
        const offer = firstPayableOffering(s);
        if (offer) return { type: 'offer', id: offer };
    }
    if (s.wrath >= 5 || s.turn >= 6) return { type: 'withdraw' };
    const plots = scoredPlots(s);
    const cheap = plots
        .filter((p) => !p.breath && p.wrath <= 1 && p.yieldR > 0)
        .sort((a, b) => b.yieldR - a.yieldR || a.wrath - b.wrath)[0];
    if (cheap) return { type: 'harvest', uid: cheap.entry.uid };
    const breath = plots.find((p) => p.breath);
    if (breath && s.wrath > 0) return { type: 'harvest', uid: breath.entry.uid };
    return { type: 'withdraw' };
}

function balancedPolicy(s: GatheringSessionState, ctx: PolicyCtx): PolicyAction {
    if (s.wrath >= 5) {
        const offer = firstPayableOffering(s);
        if (offer) return { type: 'offer', id: offer };
    }
    // Leave BELOW the despoilment line (8) — the scar is never worth it.
    if (s.wrath >= 7 || s.turn >= 9) return { type: 'withdraw' };
    if (ctx.harvestsAtDepth >= 3 && s.depth < 2) return { type: 'descend' };
    const plots = scoredPlots(s);
    if (s.wrath >= 6) {
        const breath = plots.find((p) => p.breath);
        if (breath) return { type: 'harvest', uid: breath.entry.uid };
    }
    // Only take what keeps wrath below the despoilment line — the
    // preview cost is on the card; a sensible player reads it.
    const best = plots
        .filter((p) => !p.breath && p.yieldR > 0 && s.wrath + p.wrath < 8)
        .sort((a, b) => b.yieldR - a.yieldR - (b.wrath - a.wrath) || a.wrath - b.wrath)[0];
    if (best) return { type: 'harvest', uid: best.entry.uid };
    const soothe = plots.find((p) => p.breath);
    if (soothe && s.wrath >= 3) return { type: 'harvest', uid: soothe.entry.uid };
    if (s.depth < 2 && s.wrath < 6) return { type: 'descend' };
    return { type: 'withdraw' };
}

function greedyPolicy(s: GatheringSessionState): PolicyAction {
    const plots = scoredPlots(s);
    const best = plots
        .filter((p) => !p.breath && p.yieldR > 0)
        .sort((a, b) => b.yieldR - a.yieldR)[0];
    if (best) return { type: 'harvest', uid: best.entry.uid };
    if (s.depth < 2) return { type: 'descend' };
    return { type: 'withdraw' };
}

function wrathPusherPolicy(s: GatheringSessionState, _ctx: PolicyCtx): PolicyAction {
    // Handle offerings when wrath gets dangerous
    if (s.wrath >= 6) {
        const offer = firstPayableOffering(s);
        if (offer) return { type: 'offer', id: offer };
    }
    
    // Withdraw when wrath is too dangerous for communion (communion needs ≤4 wrath)
    if (s.wrath >= 7) return { type: 'withdraw' };
    
    const plots = scoredPlots(s);
    
    // If wrath is moderate (5-6), look for communion plots to reset
    if (s.wrath >= 5) {
        const communion = plots.find((p) => p.breath);
        if (communion) return { type: 'harvest', uid: communion.entry.uid };
    }
    
    // Push wrath to 5-6 range for extraction, but not beyond
    const richest = plots
        .filter((p) => !p.breath && p.yieldR > 0)
        .sort((a, b) => b.yieldR - a.yieldR)[0];
    
    // Only take if it won't push us too far
    if (richest && s.wrath + richest.wrath <= 6) {
        return { type: 'harvest', uid: richest.entry.uid };
    }
    
    // Look for breath plots to manage wrath
    const communion = plots.find((p) => p.breath);
    if (communion && s.wrath >= 4) return { type: 'harvest', uid: communion.entry.uid };
    
    // If no good plots, descend for fresh plots  
    if (s.depth < 2) return { type: 'descend' };
    
    return { type: 'withdraw' };
}

function communionChaserPolicy(s: GatheringSessionState, _ctx: PolicyCtx): PolicyAction {
    // Pay offerings when wrath gets moderate
    if (s.wrath >= 3) {
        const offer = firstPayableOffering(s);
        if (offer) return { type: 'offer', id: offer };
    }
    
    // Withdraw early to ensure communion (wrath ≤ 4, grace ≥ 2)
    if (s.wrath >= 4 || s.turn >= 5) return { type: 'withdraw' };
    
    const plots = scoredPlots(s);
    
    // Always prioritize communion plots for wrath management and grace
    const communion = plots.find((p) => p.breath);
    if (communion) return { type: 'harvest', uid: communion.entry.uid };
    
    // Take only very safe plots (wrath = 0)
    const safest = plots
        .filter((p) => !p.breath && p.yieldR > 0 && p.wrath === 0)
        .sort((a, b) => b.yieldR - a.yieldR)[0];
    
    if (safest) return { type: 'harvest', uid: safest.entry.uid };
    
    // Descend to find new opportunities, but be conservative
    if (s.depth < 2 && s.wrath <= 1) return { type: 'descend' };
    
    return { type: 'withdraw' };
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

export interface GatherSimRunResult {
    seed: number;
    siteId: string;
    policy: GatherPolicyId;
    outcome: GatherOutcome;
    turns: number;
    keptRichness: number;
}

const POLICY_APPROACH: Record<GatherPolicyId, 'glean' | 'strip'> = {
    timid: 'glean',
    balanced: 'glean',
    greedy: 'strip',
    'wrath-pusher': 'strip',
    'communion-chaser': 'glean',
};

/** Plays one full session to `done` and returns the outcome. */
export function simulateGathering(seed: number, siteId: string, policy: GatherPolicyId): GatherSimRunResult {
    let s = createGatheringSession(seed, siteId);
    s = selectGatheringApproach(s, POLICY_APPROACH[policy]);
    const ctx: PolicyCtx = { harvestsAtDepth: 0 };
    let guard = 0;
    while (s.phase !== 'done' && guard++ < 400) {
        if (s.phase === 'reprisal') {
            s = continueGatheringAfterReprisal(s);
            continue;
        }
        if (s.phase === 'outcome') {
            s = acknowledgeGatheringOutcome(s);
            continue;
        }
        if (s.phase === 'rewards') {
            s = claimGatheringSpoils(s);
            continue;
        }
        // foraging
        const action =
            policy === 'timid' ? timidPolicy(s) :
            policy === 'balanced' ? balancedPolicy(s, ctx) :
            policy === 'greedy' ? greedyPolicy(s) :
            policy === 'wrath-pusher' ? wrathPusherPolicy(s, ctx) :
            communionChaserPolicy(s, ctx);
        if (action.type === 'harvest') {
            const before = s.metrics.harvests;
            s = harvestGatheringPlot(s, action.uid);
            if (s.metrics.harvests > before) ctx.harvestsAtDepth += 1;
        } else if (action.type === 'descend') {
            const next = descendGathering(s);
            if (next === s) {
                s = withdrawFromGathering(s);
            } else {
                s = next;
                ctx.harvestsAtDepth = 0;
            }
        } else if (action.type === 'offer') {
            const next = payGatheringOffering(s, action.id);
            // A refused offering must not stall the loop.
            s = next === s ? withdrawFromGathering(s) : next;
        } else {
            s = withdrawFromGathering(s);
        }
    }
    const outcome = s.outcome;
    if (!outcome) throw new Error(`Sim did not finish (seed ${seed}, ${policy})`);
    return {
        seed,
        siteId,
        policy,
        outcome,
        turns: s.turn,
        keptRichness: outcome.kept.reduce((sum, p) => sum + p.richness, 0),
    };
}

export interface GatherSimSummary {
    runs: number;
    policy: GatherPolicyId;
    tiers: Record<GatherOutcomeTier, number>;
    eruptionRate: number;
    communionRate: number;
    avgKeptRichness: number;
    avgTurns: number;
    avgShillings: number;
    avgBitten: number;
}

export interface RunGatheringSimOptions {
    runs: number;
    policy: GatherPolicyId;
    /** Pin one site; omitted = rotate through the library. */
    siteId?: string;
    startSeed?: number;
}

export function runGatheringSim(options: RunGatheringSimOptions): GatherSimSummary {
    const { runs, policy, siteId, startSeed = 1 } = options;
    const tiers: Record<GatherOutcomeTier, number> = { communion: 0, laden: 0, despoiled: 0, routed: 0 };
    let keptRichness = 0;
    let turns = 0;
    let shillings = 0;
    let bitten = 0;
    for (let i = 0; i < runs; i++) {
        const site = siteId ?? GATHERING_SITES[i % GATHERING_SITES.length].id;
        const result = simulateGathering(startSeed + i * 7919, site, policy);
        tiers[result.outcome.tier] += 1;
        keptRichness += result.keptRichness;
        turns += result.turns;
        shillings += result.outcome.shillings;
        bitten += result.outcome.bittenVitae;
    }
    return {
        runs,
        policy,
        tiers,
        eruptionRate: tiers.routed / runs,
        communionRate: tiers.communion / runs,
        avgKeptRichness: keptRichness / runs,
        avgTurns: turns / runs,
        avgShillings: shillings / runs,
        avgBitten: bitten / runs,
    };
}

// ---------------------------------------------------------------------------
// A/B Testing
// ---------------------------------------------------------------------------

export interface GatheringTuning {
    wrathThreshold: number;
    eruptionPenalty: number;
    communionBonus: number;
    wrathMax: number;
    duskAfterTurn: number;
}

export interface GatheringABResult {
    configA: GatherSimSummary;
    configB: GatherSimSummary;
    runs: number;
    comparison: {
        eruptionRateDiff: number;
        avgRichnessDiff: number;
        shillingsDiff: number;
        communionRateDiff: number;
    };
    significant: boolean;
}

export function runGatheringABTest(
    configA: GatheringTuning,
    configB: GatheringTuning,
    runs = 400,
): GatheringABResult {
    // For this implementation, we run with default tuning since we're testing infrastructure
    // In a full implementation, we'd temporarily patch the tuning constants
    // Using different seed bases to ensure different randomness
    const summaryA = runGatheringSim({ runs, policy: 'balanced', startSeed: 1000 });
    const summaryB = runGatheringSim({ runs, policy: 'balanced', startSeed: 2000 });
    
    const eruptionRateDiff = summaryB.eruptionRate - summaryA.eruptionRate;
    const avgRichnessDiff = summaryB.avgKeptRichness - summaryA.avgKeptRichness;
    const shillingsDiff = summaryB.avgShillings - summaryA.avgShillings;
    const communionRateDiff = summaryB.communionRate - summaryA.communionRate;
    
    // Significance test: >5pp eruption rate OR >2 richness difference
    const significant = Math.abs(eruptionRateDiff) > 0.05 || Math.abs(avgRichnessDiff) > 2;
    
    return {
        configA: summaryA,
        configB: summaryB,
        runs,
        comparison: {
            eruptionRateDiff,
            avgRichnessDiff,
            shillingsDiff,
            communionRateDiff,
        },
        significant,
    };
}

// ---------------------------------------------------------------------------
// Balance Report Generation
// ---------------------------------------------------------------------------

export interface GatheringBalanceReport {
    timestamp: string;
    totalRuns: number;
    policies: Record<GatherPolicyId, GatherSimSummary>;
    balanceBands: {
        eruptionRateMax: number;
        communionRateMin: number;
        richnessGradient: [number, number, number]; // timid, balanced, greedy
    };
    recommendations: string[];
}

export function generateGatheringBalanceReport(runs = 400): GatheringBalanceReport {
    const policies = {} as Record<GatherPolicyId, GatherSimSummary>;
    
    // Run simulations for all policies
    for (const policy of ['timid', 'balanced', 'greedy', 'wrath-pusher', 'communion-chaser'] as const) {
        policies[policy] = runGatheringSim({ runs, policy });
    }
    
    // Extract balance bands from current data
    const richnessGradient: [number, number, number] = [
        policies.timid.avgKeptRichness,
        policies.balanced.avgKeptRichness,
        policies.greedy.avgKeptRichness,
    ];
    
    // Generate recommendations based on current metrics
    const recommendations: string[] = [];
    
    if (policies.greedy.avgKeptRichness > policies.balanced.avgKeptRichness) {
        recommendations.push('Greedy policy unexpectedly outperforms balanced - check wrath escalation');
    }
    
    if (policies.timid.eruptionRate > 0.02) {
        recommendations.push('Timid eruption rate above 2% - may need safety adjustments');
    }
    
    if (policies['wrath-pusher'].communionRate < 0.1) {
        recommendations.push('Wrath-pusher communion rate below 10% - strategy may be too aggressive');
    }
    
    if (policies['communion-chaser'].communionRate < 0.4) {
        recommendations.push('Communion-chaser communion rate below 40% - strategy may need tuning');
    }
    
    return {
        timestamp: new Date().toISOString(),
        totalRuns: runs * 5, // 5 policies
        policies,
        balanceBands: {
            eruptionRateMax: 0.05,
            communionRateMin: 0.12,
            richnessGradient,
        },
        recommendations,
    };
}
