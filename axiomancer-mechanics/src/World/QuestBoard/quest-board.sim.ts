/**
 * Quest Board balance simulator — deterministic simulation harness.
 *
 * Drives full sessions through the pure engine with scripted player
 * policies so balance can be asserted in hermetic tests (and tuned with
 * evidence, mirroring the hazard/gathering sims). No I/O, no Math.random —
 * every run is reproducible from its seed.
 *
 * Policies:
 *  - `safe`      — takes lowest-risk verbs, avoids press-your-luck, prefers
 *                  bribe/detour options, leaves markets quickly
 *  - `gambler`   — always press-your-luck at gather spots, fights duels
 *                  instead of bribes, takes risky snag crossings
 *  - `economist` — optimizes fish yield per turn, balances risk vs. reward
 *                  based on fish reserves and expected returns
 */

import {
    acknowledgeQuestDusk,
    beginQuestBoard,
    claimQuestBoardCompletion,
    continueQuestSpace,
    createQuestBoardSession,
    useQuestCharm,
    castQuestBones,
    takeQuestStep,
    chooseQuestSpaceOption,
} from './quest-board.engine';
import { getQuestBoardDef } from './quest-board.content';
import { QUEST_BOARD_TUNING } from './quest-board.tuning';
import type {
    QuestBoardOutcome,
    QuestBoardSession,
    QuestOutcomeTier,
    QuestSpaceKind,
    QuestBoardMetrics,
    QuestCharmId,
} from './quest-board.types';

export type QuestBoardPolicyId = 'safe' | 'gambler' | 'economist';

type PolicyAction =
    | { type: 'cast' }
    | { type: 'step'; boneIndex: number }
    | { type: 'charm'; charmId: QuestCharmId }
    | { type: 'option'; optionId: string };

/**
 * How much a policy WANTS to land on a given space, higher is better.
 *
 * This is the whole reason the 2026-08-08 two-bone redesign matters to the
 * sim: before it, movement was a die roll and no bot had an opinion about
 * where it went. Now each policy has a route preference, and the bands below
 * measure whether having one is worth anything.
 */
function spaceAppetite(
    s: QuestBoardSession,
    kind: QuestSpaceKind,
    policy: QuestBoardPolicyId,
): number {
    const risk = _evaluateSpaceRisk(s, kind);
    if (policy === 'gambler') {
        // Chases the spaces that pay: duels and the press-your-luck wade.
        if (kind === 'duel') return 5;
        if (kind === 'gather') return 4;
        if (kind === 'cache') return 3;
        if (kind === 'market') return 2;
        return 1;
    }
    if (policy === 'economist') {
        // Wants stalls, finds, and cheap ground; treats vigor as capital.
        if (kind === 'market') return 5;
        if (kind === 'cache') return 4;
        if (kind === 'gather') return 3;
        if (kind === 'hearth') return s.vigor <= 3 ? 5 : 1;
        if (kind === 'duel' || kind === 'snag') return 0;
        return 2;
    }
    // safe — avoids the two spaces that can BITE (duel, snag) but still
    // works the board: GATHER is press-your-luck the player can stop on the
    // first press, so a cautious plan still routes through it. A bot that
    // avoided every productive space would just be slow, not safe.
    if (kind === 'hearth') return s.vigor <= 4 ? 5 : 2;
    if (kind === 'duel' || kind === 'snag') return risk === 'high' ? 0 : 1;
    if (kind === 'gather') return 4;
    if (kind === 'market') return 4;
    if (kind === 'cache') return 4;
    return 3;
}

/**
 * Choose between the two cast bones. Ties break toward the SHORTER step,
 * because the bone left behind banks its pips as wind — when the
 * destinations are equally good, tempo is free.
 */
function chooseBone(s: QuestBoardSession, policy: QuestBoardPolicyId): PolicyAction {
    const bones = s.bones;
    if (!bones || bones.length === 0) return { type: 'cast' };
    let bestIndex = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < bones.length; i++) {
        const bone = bones[i]!;
        let score = spaceAppetite(s, bone.targetKind, policy);
        // Fitting parts onto the hull is progress toward the only win
        // condition there is — worth more than any single space.
        if (bone.fitsAtSlipway && (s.parts.plank + s.parts.pitch + s.parts.cloth + s.parts.nail) > 0) {
            score += 6;
        }
        const other = bones[i === 0 ? 1 : 0]!;
        if (bone.die < other.die) score += 0.5;
        if (score > bestScore) {
            bestScore = score;
            bestIndex = i;
        }
    }
    return { type: 'step', boneIndex: bestIndex };
}

interface PolicyCtx {
    /** Fish spent this session (for economist calculations). */
    fishSpent: number;
    /** Days elapsed (for time pressure decisions). */
    daysPassed: number;
}

function _evaluateSpaceRisk(
    s: QuestBoardSession,
    spaceKind: QuestSpaceKind,
): 'low' | 'medium' | 'high' {
    // Simple heuristic based on space type and current resources
    switch (spaceKind) {
        case 'slipway':
        case 'hearth':
        case 'cache':
        case 'omen':
            return 'low';
        case 'market':
        case 'parley':
            return s.fish >= 3 ? 'low' : 'medium';
        case 'gather':
            return s.vigor >= 3 ? 'medium' : 'high';
        case 'duel':
            return s.vigor >= 4 && s.fish >= 2 ? 'medium' : 'high';
        case 'snag':
            return s.fish >= 2 || s.wind >= 1 ? 'medium' : 'high';
        default:
            return 'medium';
    }
}

function safePolicy(s: QuestBoardSession, _ctx: PolicyCtx): PolicyAction {
    // Always prefer safe options, avoid risk
    if (s.phase === 'idle') {
        return { type: 'cast' };
    }
    if (s.phase === 'choosing') {
        return chooseBone(s, 'safe');
    }

    if (s.phase === 'space' && s.pending) {
        return naivePolicy(s.pending);
    }
    
    return { type: 'cast' };
}

/** Improved naive policy - still safe but more efficient */
function naivePolicy(pending: NonNullable<QuestBoardSession['pending']>): PolicyAction {
    const enabled = pending.options.filter(o => !o.disabledReason);
    if (enabled.length === 0) return { type: 'cast' }; // No valid options
    
    // Market: buy one item if affordable, especially nail deals
    if (pending.kind === 'market') {
        // Look for nail deals first (good value)
        const nailOffer = enabled.find(o => o.id === 'buy-nail');
        if (nailOffer) return { type: 'option', optionId: nailOffer.id };
        
        // Then any other affordable option
        const buyOptions = enabled.filter(o => o.id.startsWith('buy-'));
        if (buyOptions.length > 0) return { type: 'option', optionId: buyOptions[0].id };
        
        const leave = enabled.find(o => o.id === 'leave');
        if (leave) return { type: 'option', optionId: leave.id };
    }
    
    // Gather: press twice for better yield, then stop
    if (pending.kind === 'gather') {
        const pressCount = pending.presses ?? 0;
        const wants = pressCount >= 2 ? 'stop' : 'press';
        const preferred = enabled.find(o => o.id === wants);
        if (preferred) return { type: 'option', optionId: preferred.id };
    }
    
    // For all others: pick first enabled option
    return { type: 'option', optionId: enabled[0].id };
}

function gamblerPolicy(s: QuestBoardSession, _ctx: PolicyCtx): PolicyAction {
    // Always take risks, maximize rewards
    if (s.phase === 'idle') {
        return { type: 'cast' };
    }
    if (s.phase === 'choosing') {
        return chooseBone(s, 'gambler');
    }
    
    if (s.phase === 'space' && s.pending) {
        const enabled = s.pending.options.filter(o => !o.disabledReason);
        if (enabled.length === 0) return { type: 'cast' };
        
        // Market: aggressive buying (gambler loves spending)
        if (s.pending.kind === 'market') {
            const buyOptions = enabled.filter(o => o.id.startsWith('buy-'));
            if (buyOptions.length > 0 && s.fish >= 2) {
                return { type: 'option', optionId: buyOptions[0].id };
            }
            const leave = enabled.find(o => o.id === 'leave');
            if (leave) return { type: 'option', optionId: leave.id };
        }
        
        // Gather: keep pressing aggressively
        if (s.pending.kind === 'gather') {
            const press = enabled.find(o => o.id === 'press');
            if (press) return { type: 'option', optionId: press.id };
            const stop = enabled.find(o => o.id === 'stop');
            if (stop) return { type: 'option', optionId: stop.id };
        }
        
        // For all others: pick first enabled option (risky default)
        return { type: 'option', optionId: enabled[0].id };
    }
    
    return { type: 'cast' };
}

function economistPolicy(s: QuestBoardSession, _ctx: PolicyCtx): PolicyAction {
    // Balance risk vs reward - simpler version
    if (s.phase === 'idle') {
        return { type: 'cast' };
    }
    if (s.phase === 'choosing') {
        return chooseBone(s, 'economist');
    }
    
    if (s.phase === 'space' && s.pending) {
        const enabled = s.pending.options.filter(o => !o.disabledReason);
        if (enabled.length === 0) return { type: 'cast' };
        
        const fishRatio = s.fish / Math.max(1, getQuestBoardDef(s.boardId).startFish);
        
        // Market: buy efficiently based on parts needed
        if (s.pending.kind === 'market') {
            const buyOptions = enabled.filter(o => o.id.startsWith('buy-'));
            // Prioritize nail purchases (best value: 2 nails for 2 fish)
            const nailOffer = buyOptions.find(o => o.id === 'buy-nail');
            if (nailOffer && s.fish >= 2) return { type: 'option', optionId: nailOffer.id };
            
            // Then other items if we have enough fish
            if (buyOptions.length > 0 && s.fish >= 3) {
                return { type: 'option', optionId: buyOptions[0].id };
            }
            const leave = enabled.find(o => o.id === 'leave');
            if (leave) return { type: 'option', optionId: leave.id };
        }
        
        // Gather: balanced approach - press 2-3 times depending on resources
        if (s.pending.kind === 'gather') {
            const pressCount = s.pending.presses ?? 0;
            const maxPresses = fishRatio > 0.6 ? 3 : 2; // More presses if wealthy
            const wants = pressCount >= maxPresses ? 'stop' : 'press';
            const preferred = enabled.find(o => o.id === wants);
            if (preferred) return { type: 'option', optionId: preferred.id };
        }
        
        // For all others: pick first enabled option
        return { type: 'option', optionId: enabled[0].id };
    }
    
    return { type: 'cast' };
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

export interface QuestBoardSimRunResult {
    seed: number;
    boardId: string;
    policy: QuestBoardPolicyId;
    outcome: QuestBoardOutcome;
    daysTaken: number;
    fishLeft: number;
    vigorLeft: number;
    vowsKept: number;
    metrics: QuestBoardMetrics;
}

/** Plays one full session to 'done' and returns the outcome. */
export function simulateQuestBoard(
    seed: number,
    boardId: string,
    policy: QuestBoardPolicyId,
): QuestBoardSimRunResult {
    let s = createQuestBoardSession(seed, boardId);
    s = beginQuestBoard(s);
    const ctx: PolicyCtx = { fishSpent: 0, daysPassed: 0 };
    let guard = 0;

    while (s.phase !== 'done' && guard++ < 1000) {
        if (s.phase === 'dusk') {
            s = acknowledgeQuestDusk(s);
            ctx.daysPassed = s.day - 1;
            continue;
        }
        
        if (s.phase === 'outcome') {
            s = claimQuestBoardCompletion(s);
            continue;
        }

        // Get policy decision
        const action = 
            policy === 'safe' ? safePolicy(s, ctx) :
            policy === 'gambler' ? gamblerPolicy(s, ctx) :
            economistPolicy(s, ctx);

        if (action.type === 'cast') {
            s = castQuestBones(s);
        } else if (action.type === 'step') {
            s = takeQuestStep(s, action.boneIndex);
        } else if (action.type === 'charm') {
            s = useQuestCharm(s, action.charmId);
        } else if (action.type === 'option') {
            s = chooseQuestSpaceOption(s, action.optionId);
        }
        
        // Handle space resolution properly - choose options until resolved
        while (s.phase === 'space' && s.pending !== null && s.pending.result === null) {
            const nextAction = 
                policy === 'safe' ? safePolicy(s, ctx) :
                policy === 'gambler' ? gamblerPolicy(s, ctx) :
                economistPolicy(s, ctx);
            
            if (nextAction.type === 'option') {
                const next = chooseQuestSpaceOption(s, nextAction.optionId);
                if (next === s) {
                    // Option didn't resolve, try fallback
                    const available = s.pending.options.find(o => !o.disabledReason);
                    if (available) {
                        s = chooseQuestSpaceOption(s, available.id);
                    } else {
                        break; // No valid options
                    }
                } else {
                    s = next;
                }
            } else {
                break; // No option action available
            }
        }
        
        // Continue after space is resolved
        if (s.phase === 'space' && s.pending && s.pending.result) {
            s = continueQuestSpace(s);
        }
    }

    const outcome = s.outcome;
    if (!outcome) {
        throw new Error(`Sim did not finish (seed ${seed}, ${policy})`);
    }

    return {
        seed,
        boardId,
        policy,
        outcome,
        daysTaken: outcome.daysTaken,
        fishLeft: outcome.fishLeft,
        vigorLeft: outcome.vigorLeft,
        vowsKept: outcome.vowsKept,
        metrics: outcome.metrics,
    };
}

export interface QuestBoardSimSummary {
    runs: number;
    policy: QuestBoardPolicyId;
    tiers: Record<QuestOutcomeTier, number>;
    avgDaysTaken: number;
    avgFishLeft: number;
    avgVigorLeft: number;
    avgVowsKept: number;
    masterworkRate: number;
    seaworthyRate: number;
    driftwoodRate: number;
}

export interface RunQuestBoardSimOptions {
    runs: number;
    policy: QuestBoardPolicyId;
    /** Pin one board; omitted = use 'build-the-boat'. */
    boardId?: string;
    startSeed?: number;
}

export function runQuestBoardSim(options: RunQuestBoardSimOptions): QuestBoardSimSummary {
    const { runs, policy, boardId = 'build-the-boat', startSeed = 1 } = options;
    const tiers: Record<QuestOutcomeTier, number> = { masterwork: 0, seaworthy: 0, driftwood: 0 };
    let daysTaken = 0;
    let fishLeft = 0;
    let vigorLeft = 0;
    let vowsKept = 0;

    for (let i = 0; i < runs; i++) {
        const result = simulateQuestBoard(startSeed + i * 7919, boardId, policy);
        tiers[result.outcome.tier] += 1;
        daysTaken += result.daysTaken;
        fishLeft += result.fishLeft;
        vigorLeft += result.vigorLeft;
        vowsKept += result.vowsKept;
    }

    return {
        runs,
        policy,
        tiers,
        avgDaysTaken: daysTaken / runs,
        avgFishLeft: fishLeft / runs,
        avgVigorLeft: vigorLeft / runs,
        avgVowsKept: vowsKept / runs,
        masterworkRate: tiers.masterwork / runs,
        seaworthyRate: tiers.seaworthy / runs,
        driftwoodRate: tiers.driftwood / runs,
    };
}

// ---------------------------------------------------------------------------
// A/B Testing
// ---------------------------------------------------------------------------

export interface QuestBoardABResult {
    configA: QuestBoardSimSummary;
    configB: QuestBoardSimSummary;
    significant: boolean;
    analysis: {
        masterworkDiff: number;
        daysTakenDiff: number;
        vowsKeptDiff: number;
    };
}

export function runQuestBoardAB(
    configA: typeof QUEST_BOARD_TUNING,
    configB: typeof QUEST_BOARD_TUNING,
    options: { runs: number; boardId?: string },
): QuestBoardABResult {
    const { runs, boardId = 'build-the-boat' } = options;
    
    // For this initial implementation, we'll simulate with the economist policy
    // In a full implementation, we'd temporarily patch the tuning constants
    const summaryA = runQuestBoardSim({ runs, policy: 'economist', boardId, startSeed: 1000 });
    const summaryB = runQuestBoardSim({ runs, policy: 'economist', boardId, startSeed: 2000 });
    
    const masterworkDiff = summaryB.masterworkRate - summaryA.masterworkRate;
    const daysTakenDiff = summaryB.avgDaysTaken - summaryA.avgDaysTaken;
    const vowsKeptDiff = summaryB.avgVowsKept - summaryA.avgVowsKept;
    
    // Significance test: >10pp masterwork rate OR >0.5 days difference
    const significant = Math.abs(masterworkDiff) > 0.1 || Math.abs(daysTakenDiff) > 0.5;
    
    return {
        configA: summaryA,
        configB: summaryB,
        significant,
        analysis: {
            masterworkDiff,
            daysTakenDiff,
            vowsKeptDiff,
        },
    };
}

// ---------------------------------------------------------------------------
// Balance Band Reporting
// ---------------------------------------------------------------------------

export interface QuestBoardBalanceBands {
    boardId: string;
    policy: QuestBoardPolicyId;
    masterworkRate: { min: number; max: number; actual: number; inBand: boolean };
    avgDaysTaken: { min: number; max: number; actual: number; inBand: boolean };
    avgVowsKept: { min: number; max: number; actual: number; inBand: boolean };
    overallHealth: 'healthy' | 'needs_tuning';
}

export interface QuestBoardBalanceReport {
    bands: QuestBoardBalanceBands[];
    timestamp: string;
    summary: { healthyBoards: number; totalBoards: number };
}

const BALANCE_BAND_THRESHOLDS = {
    safe: { masterworkMin: 0.15, masterworkMax: 0.35, daysMin: 3, daysMax: 6, vowsMin: 1.2, vowsMax: 2.0 },
    economist: { masterworkMin: 0.25, masterworkMax: 0.45, daysMin: 3.5, daysMax: 5.5, vowsMin: 1.4, vowsMax: 2.0 },
    gambler: { masterworkMin: 0.05, masterworkMax: 0.25, daysMin: 2.5, daysMax: 5.0, vowsMin: 0.8, vowsMax: 1.6 },
};

export function generateQuestBoardBalanceReport(): QuestBoardBalanceReport {
    const bands: QuestBoardBalanceBands[] = [];
    const boardId = 'build-the-boat';
    const runs = 300;
    
    for (const policy of ['safe', 'economist', 'gambler'] as const) {
        const summary = runQuestBoardSim({ runs, policy, boardId });
        const thresholds = BALANCE_BAND_THRESHOLDS[policy];
        
        const masterworkInBand = summary.masterworkRate >= thresholds.masterworkMin && 
                                summary.masterworkRate <= thresholds.masterworkMax;
        const daysInBand = summary.avgDaysTaken >= thresholds.daysMin && 
                          summary.avgDaysTaken <= thresholds.daysMax;
        const vowsInBand = summary.avgVowsKept >= thresholds.vowsMin && 
                          summary.avgVowsKept <= thresholds.vowsMax;
        
        const overallHealth = (masterworkInBand && daysInBand && vowsInBand) ? 'healthy' : 'needs_tuning';
        
        bands.push({
            boardId,
            policy,
            masterworkRate: {
                min: thresholds.masterworkMin,
                max: thresholds.masterworkMax,
                actual: summary.masterworkRate,
                inBand: masterworkInBand,
            },
            avgDaysTaken: {
                min: thresholds.daysMin,
                max: thresholds.daysMax,
                actual: summary.avgDaysTaken,
                inBand: daysInBand,
            },
            avgVowsKept: {
                min: thresholds.vowsMin,
                max: thresholds.vowsMax,
                actual: summary.avgVowsKept,
                inBand: vowsInBand,
            },
            overallHealth,
        });
    }
    
    const healthyBoards = bands.filter(b => b.overallHealth === 'healthy').length;
    
    return {
        bands,
        timestamp: new Date().toISOString(),
        summary: { healthyBoards, totalBoards: bands.length },
    };
}