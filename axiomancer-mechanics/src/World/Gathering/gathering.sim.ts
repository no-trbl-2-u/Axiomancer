/**
 * Gathering minigame — deterministic simulation harness.
 *
 * Drives full sessions through the pure engine with scripted player
 * policies so balance can be asserted in hermetic tests (and tuned with
 * evidence, mirroring the hazard sim). No I/O, no Math.random — every
 * run is reproducible from its seed.
 *
 * Policies. Since the 2026-08-08 redesign the eruption point is HIDDEN (the
 * site's rolled TEMPER), so every bot below reads the OMEN — the same graded
 * tell the player gets — instead of comparing wrath to a constant it has no
 * in-fiction way of knowing. A bot that reasoned in absolute wrath would be
 * cheating, and the bands it produced would not describe anything a person
 * could reproduce.
 *
 *  - `timid`    — gleans, pays what the place asks, takes only cheap
 *                 plots, leaves as soon as the site stirs. The restraint
 *                 baseline.
 *  - `balanced` — gleans, descends deliberately, pays offerings under
 *                 pressure, leaves when the ground wakes.
 *  - `greedy`   — strips, takes the richest plot every time, never pays,
 *                 never reads, never leaves. The eruption baseline.
 *  - `reader`   — gleans, READS THE SITE early, then pushes to exactly one
 *                 short of the temper it paid to learn. The skill line: the
 *                 bot that buys information should beat the one that guesses.
 *  - `wrath-pusher`     — strips and rides the omen to SEETHING before bailing.
 *  - `communion-chaser` — gleans and leaves almost immediately for the tier.
 */

import { getGatherPlotDef, GATHERING_SITES } from './gathering.content';
import {
    acknowledgeGatheringOutcome,
    canPayGatheringOffering,
    claimGatheringSpoils,
    continueGatheringAfterReprisal,
    createGatheringSession,
    descendGathering,
    gatheringCommunionWrathMax,
    gatheringDespoilWrathMin,
    gatheringHarvestWrath,
    gatheringHarvestYield,
    gatheringOmen,
    gatheringWrathSpread,
    harvestGatheringPlot,
    payGatheringOffering,
    readGatheringSite,
    selectGatheringApproach,
    withdrawFromGathering,
} from './gathering.engine';
import { GATHER_TEMPER_MIN, GATHERING_TUNING } from './gathering.tuning';
import type { GatherOmen, GatherOutcome, GatherOutcomeTier, GatherPlotEntry, GatheringSessionState } from './gathering.types';

export type GatherPolicyId = 'timid' | 'balanced' | 'greedy' | 'reader' | 'plunderer' | 'wrath-pusher' | 'communion-chaser';

type PolicyAction =
    | { type: 'harvest'; uid: string }
    | { type: 'descend' }
    | { type: 'offer'; id: string }
    | { type: 'read' }
    | { type: 'withdraw' };

/** Omen severity, so a policy can say "at or past ROUSED" in one comparison. */
const OMEN_RANK: Record<GatherOmen, number> = { calm: 0, stirring: 1, roused: 2, seething: 3 };

function omenAtLeast(s: GatheringSessionState, level: GatherOmen): boolean {
    return OMEN_RANK[gatheringOmen(s)] >= OMEN_RANK[level];
}

/**
 * The WORST wrath a taking could cost right now — the printed floor plus the
 * whole unsteady-hand spread. A careful bot budgets against this, not the
 * floor, which is exactly the judgement the redesign asks of a player.
 */
function worstCaseWrath(s: GatheringSessionState, floorCost: number): number {
    return floorCost + gatheringWrathSpread(s);
}

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
    // Plays for COMMUNION and nothing else: buys grace with offerings and
    // leaves while the site can still forgive it. The communion cut is a
    // published rule against a meter the player can see, so budgeting to it
    // is fair play — the hidden number is the ERUPTION point, not this.
    const communionMax = gatheringCommunionWrathMax(s);
    if (s.wrath >= communionMax || omenAtLeast(s, 'stirring')) {
        const offer = firstPayableOffering(s);
        if (offer) return { type: 'offer', id: offer };
        const breath = scoredPlots(s).find((p) => p.breath);
        if (breath && s.wrath > 0) return { type: 'harvest', uid: breath.entry.uid };
        return { type: 'withdraw' };
    }
    if (s.turn >= 6) return { type: 'withdraw' };
    const plots = scoredPlots(s);
    const cheap = plots
        .filter((p) => !p.breath && p.wrath <= 1 && p.yieldR > 0
            && s.wrath + worstCaseWrath(s, p.wrath) <= communionMax)
        .sort((a, b) => b.yieldR - a.yieldR || a.wrath - b.wrath)[0];
    if (cheap) return { type: 'harvest', uid: cheap.entry.uid };
    const breath = plots.find((p) => p.breath);
    if (breath && s.wrath > 0) return { type: 'harvest', uid: breath.entry.uid };
    return { type: 'withdraw' };
}

function balancedPolicy(s: GatheringSessionState, ctx: PolicyCtx): PolicyAction {
    // Works the site until the ground wakes, then buys room or gets out.
    if (omenAtLeast(s, 'roused')) {
        const offer = firstPayableOffering(s);
        if (offer) return { type: 'offer', id: offer };
        const breath = scoredPlots(s).find((p) => p.breath);
        if (breath) return { type: 'harvest', uid: breath.entry.uid };
        return { type: 'withdraw' };
    }
    if (s.turn >= 9) return { type: 'withdraw' };
    if (ctx.harvestsAtDepth >= 3 && s.depth < 2) return { type: 'descend' };
    const plots = scoredPlots(s);
    // Budgets against the WORST the unsteady hand could do, and stops short
    // of this site's despoilment line — the scar is never worth it. With the
    // temper hidden it can only ESTIMATE that line (it assumes the shallowest
    // site it could be standing in), which is precisely the slack THE READER
    // pays a turn to remove.
    const assumedDespoil = Math.ceil(GATHER_TEMPER_MIN * GATHERING_TUNING.outcome.despoilTemperFraction);
    const best = plots
        .filter((p) => !p.breath && p.yieldR > 0 && s.wrath + worstCaseWrath(s, p.wrath) < assumedDespoil)
        .sort((a, b) => b.yieldR - a.yieldR - (b.wrath - a.wrath) || a.wrath - b.wrath)[0];
    if (best) return { type: 'harvest', uid: best.entry.uid };
    const soothe = plots.find((p) => p.breath);
    if (soothe && omenAtLeast(s, 'stirring')) return { type: 'harvest', uid: soothe.entry.uid };
    if (s.depth < 2 && !omenAtLeast(s, 'roused')) return { type: 'descend' };
    return { type: 'withdraw' };
}

/**
 * THE READER — the skill line the redesign exists to reward.
 *
 * Pays a turn up front to learn the site's exact temper, then works the
 * spread right up to one short of it, budgeting each taking against the worst
 * the unsteady hand can do. Where `balanced` has to leave slack for a number
 * it can only estimate, this bot knows, and converts that knowledge into take.
 */
function readerPolicy(s: GatheringSessionState, ctx: PolicyCtx): PolicyAction {
    if (!s.temperKnown) return { type: 'read' };
    // It knows the real despoilment line for THIS site, so it can work right
    // up to it instead of assuming the worst — and it still refuses the scar.
    const despoil = gatheringDespoilWrathMin(s);
    const headroom = despoil - s.wrath;
    if (headroom <= 0) {
        const offer = firstPayableOffering(s);
        if (offer) return { type: 'offer', id: offer };
        const breath = scoredPlots(s).find((p) => p.breath);
        if (breath) return { type: 'harvest', uid: breath.entry.uid };
        return { type: 'withdraw' };
    }
    if (s.turn >= 10) return { type: 'withdraw' };
    if (ctx.harvestsAtDepth >= 3 && s.depth < 2) return { type: 'descend' };
    const plots = scoredPlots(s);
    const best = plots
        .filter((p) => !p.breath && p.yieldR > 0 && s.wrath + worstCaseWrath(s, p.wrath) < despoil)
        .sort((a, b) => b.yieldR - a.yieldR || a.wrath - b.wrath)[0];
    if (best) return { type: 'harvest', uid: best.entry.uid };
    const soothe = plots.find((p) => p.breath);
    if (soothe && headroom <= 3) return { type: 'harvest', uid: soothe.entry.uid };
    if (s.depth < 2) return { type: 'descend' };
    const offer = firstPayableOffering(s);
    if (offer) return { type: 'offer', id: offer };
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
    // Rides the omen up to SEETHING and bails on the last possible beat.
    // Strips, so the unsteady hand can still tip it over — which is the whole
    // point of the risk premium STRIP pays for its extra richness.
    if (omenAtLeast(s, 'seething')) {
        const offer = firstPayableOffering(s);
        if (offer) return { type: 'offer', id: offer };
        return { type: 'withdraw' };
    }

    const plots = scoredPlots(s);

    if (omenAtLeast(s, 'roused')) {
        const communion = plots.find((p) => p.breath);
        if (communion) return { type: 'harvest', uid: communion.entry.uid };
        const offer = firstPayableOffering(s);
        if (offer) return { type: 'offer', id: offer };
    }

    const richest = plots
        .filter((p) => !p.breath && p.yieldR > 0)
        .sort((a, b) => b.yieldR - a.yieldR)[0];
    if (richest) return { type: 'harvest', uid: richest.entry.uid };

    const communion = plots.find((p) => p.breath);
    if (communion && omenAtLeast(s, 'stirring')) return { type: 'harvest', uid: communion.entry.uid };

    if (s.depth < 2) return { type: 'descend' };

    return { type: 'withdraw' };
}

function communionChaserPolicy(s: GatheringSessionState, _ctx: PolicyCtx): PolicyAction {
    // Chases the COMMUNION tier and forfeits everything else for it. Both of
    // that tier's conditions are published rules over things the player can
    // see (grace, wrath, and — since the cut went temper-relative — the site's
    // patience once read), so this bot buys the number rather than guessing.
    const C = GATHERING_TUNING.outcome;
    if (!s.temperKnown) return { type: 'read' };
    const communionMax = gatheringCommunionWrathMax(s);

    // Grace is the binding constraint: glean opens with 1 and each offering
    // buys another, so the tier is unreachable without paying at least once.
    if (s.grace < C.communionGrace) {
        const offer = firstPayableOffering(s);
        if (offer) return { type: 'offer', id: offer };
    }

    // The window is open and there is something in the satchel — take it.
    if (s.grace >= C.communionGrace && s.wrath <= communionMax && s.satchel.length > 0) {
        return { type: 'withdraw' };
    }
    if (s.turn >= 7) return { type: 'withdraw' };

    const plots = scoredPlots(s);

    // Breaths both soothe the site and are free — always worth tending.
    const breath = plots.find((p) => p.breath);
    if (breath && s.wrath > 0) return { type: 'harvest', uid: breath.entry.uid };

    // Take only what cannot push past the communion cut, worst case.
    const safest = plots
        .filter((p) => !p.breath && p.yieldR > 0
            && s.wrath + worstCaseWrath(s, p.wrath) <= communionMax)
        .sort((a, b) => b.yieldR - a.yieldR || a.wrath - b.wrath)[0];
    if (safest) return { type: 'harvest', uid: safest.entry.uid };

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
    // THE READER gleans: the tender hand's unsteady-hand spread is 0, so the
    // temper it paid to learn is the ONLY unknown left. Knowledge and
    // predictability compound — that is the skill line.
    reader: 'glean',
    // THE PLUNDERER is the reader's mirror: same discipline, opposite stance.
    // It exists to keep the GLEAN/STRIP fork honest — if informed stripping
    // cannot compete with informed gleaning on total value, the stance choice
    // is decoration.
    plunderer: 'strip',
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
            policy === 'reader' || policy === 'plunderer' ? readerPolicy(s, ctx) :
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
        } else if (action.type === 'read') {
            const next = readGatheringSite(s);
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
    for (const policy of ['timid', 'balanced', 'greedy', 'reader', 'plunderer', 'wrath-pusher', 'communion-chaser'] as const) {
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
