/**
 * Minigame Harness — unified cross-minigame testing orchestrator.
 *
 * Orchestrates balance testing, A/B testing, and playstyle divergence
 * measurement across Hazard, Gathering, and Quest Board minigames.
 * Provides a single entry point for comprehensive minigame validation
 * with unified reporting.
 */

import { branchMinigameSeed } from './seed';
import { generateHazardBalanceReport, runHazardAB } from './Hazard/hazard.sim';
import { generateGatheringBalanceReport, runGatheringABTest } from './Gathering/gathering.sim';
import { generateQuestBoardBalanceReport, runQuestBoardAB } from './QuestBoard/quest-board.sim';
import { HAZARD_TUNING } from './Hazard/hazard.tuning';
import { QUEST_BOARD_TUNING } from './QuestBoard/quest-board.tuning';
import type {
    MinigameHarnessConfig,
    MinigameHarnessReport,
    MinigameHarnessSummary,
    MinigameId,
} from './minigame-harness.types';
import type { HazardBalanceReport, HazardABResult, HazardBalanceBands } from './Hazard/hazard.sim';
import type { GatheringBalanceReport, GatheringABResult, GatheringTuning } from './Gathering/gathering.sim';
import type { QuestBoardBalanceReport, QuestBoardABResult, QuestBoardBalanceBands } from './QuestBoard/quest-board.sim';

/**
 * Execute the complete minigame harness with optional A/B testing.
 * 
 * Orchestrates execution of enabled minigames, runs A/B tests if variants
 * are provided, and aggregates results into a unified report with pass/fail
 * evaluation based on each minigame's balance bands.
 */
export function runMinigameHarness(config: MinigameHarnessConfig): MinigameHarnessReport {
    const { minigames, runs, seed = 'harness-default', abTestVariants } = config;
    
    const report: MinigameHarnessReport = {
        timestamp: new Date().toISOString(),
        totalMinigames: minigames.length,
        results: {},
        abTests: {},
        passFail: {
            hazard: true,
            gathering: true,
            questBoard: true,
            overall: true,
        },
    };

    // Execute each enabled minigame
    for (const minigameId of minigames) {
        // Use numeric salt for each minigame to derive independent seeds
        const minigameSalts = { 'hazard': 1, 'gathering': 2, 'quest-board': 3 };
        const minigameSeed = branchMinigameSeed(seed, minigameSalts[minigameId]);
        
        switch (minigameId) {
            case 'hazard': {
                const { report: hazardReport, abTest } = runHazardHarness(
                    runs, 
                    minigameSeed, 
                    abTestVariants?.hazard
                );
                report.results.hazard = hazardReport;
                if (abTest) report.abTests!.hazard = abTest;
                report.passFail.hazard = evaluateHazardBalance(hazardReport);
                break;
            }
            case 'gathering': {
                const { report: gatheringReport, abTest } = runGatheringHarness(
                    runs, 
                    minigameSeed, 
                    abTestVariants?.gathering
                );
                report.results.gathering = gatheringReport;
                if (abTest) report.abTests!.gathering = abTest;
                report.passFail.gathering = evaluateGatheringBalance(gatheringReport);
                break;
            }
            case 'quest-board': {
                const { report: questBoardReport, abTest } = runQuestBoardHarness(
                    runs, 
                    minigameSeed, 
                    abTestVariants?.questBoard
                );
                report.results.questBoard = questBoardReport;
                if (abTest) report.abTests!.questBoard = abTest;
                report.passFail.questBoard = evaluateQuestBoardBalance(questBoardReport);
                break;
            }
        }
    }

    // Evaluate overall pass/fail based on enabled minigames
    report.passFail.overall = evaluateOverallBalance(report, minigames);

    return report;
}

/**
 * Generate a concise summary from a full harness report.
 */
export function summarizeHarnessReport(report: MinigameHarnessReport): MinigameHarnessSummary {
    const minigamesRun = Object.keys(report.results);
    const totalRuns = calculateTotalRuns(report);
    
    // Aggregate recommendations from all minigame reports
    const recommendations: string[] = [];
    if (report.results.gathering?.recommendations) {
        recommendations.push(...report.results.gathering.recommendations.map((r: string) => `[Gathering] ${r}`));
    }
    
    // Hazard and Quest Board reports don't have recommendations field
    // Generate generic recommendations based on health status
    if (report.results.hazard && !report.passFail.hazard) {
        recommendations.push('[Hazard] Balance bands need tuning - check policy performance');
    }
    if (report.results.questBoard && !report.passFail.questBoard) {
        recommendations.push('[Quest Board] Balance bands need tuning - check policy performance');
    }

    return {
        minigamesRun,
        totalRuns,
        overallPass: report.passFail.overall,
        recommendations,
    };
}

/**
 * Calculate total runs across all executed minigames.
 */
function calculateTotalRuns(report: MinigameHarnessReport): number {
    let total = 0;
    if (report.results.gathering?.totalRuns) {
        total += report.results.gathering.totalRuns;
    }
    // Hazard and quest board reports don't expose run count directly
    // Estimate based on number of minigames executed (default is 300 runs each)
    const estimatedRuns = 300;
    if (report.results.hazard) total += estimatedRuns;
    if (report.results.questBoard) total += estimatedRuns;
    
    return total;
}

// ---------------------------------------------------------------------------
// Helper functions for individual minigame execution
// ---------------------------------------------------------------------------

function runHazardHarness(
    runs: number, 
    seed: number, 
    abVariants?: [typeof HAZARD_TUNING, typeof HAZARD_TUNING]
): { report: HazardBalanceReport; abTest?: HazardABResult } {
    // For hazard, we use a fixed hazardId for balance testing
    const hazardId = 'cracked-cliff'; // Standard test hazard
    const report = generateHazardBalanceReport(hazardId);
    
    let abTest: HazardABResult | undefined;
    if (abVariants) {
        abTest = runHazardAB(abVariants[0], abVariants[1], { hazardId, runs });
    }
    
    return { report, abTest };
}

function runGatheringHarness(
    runs: number, 
    seed: number, 
    abVariants?: [GatheringTuning, GatheringTuning]
): { report: GatheringBalanceReport; abTest?: GatheringABResult } {
    const report = generateGatheringBalanceReport(runs);
    
    let abTest: GatheringABResult | undefined;
    if (abVariants) {
        abTest = runGatheringABTest(abVariants[0], abVariants[1], runs);
    }
    
    return { report, abTest };
}

function runQuestBoardHarness(
    runs: number, 
    seed: number, 
    abVariants?: [typeof QUEST_BOARD_TUNING, typeof QUEST_BOARD_TUNING]
): { report: QuestBoardBalanceReport; abTest?: QuestBoardABResult } {
    const report = generateQuestBoardBalanceReport();
    
    let abTest: QuestBoardABResult | undefined;
    if (abVariants) {
        abTest = runQuestBoardAB(abVariants[0], abVariants[1], { runs });
    }
    
    return { report, abTest };
}

// ---------------------------------------------------------------------------
// Balance evaluation functions
// ---------------------------------------------------------------------------

function evaluateHazardBalance(report: HazardBalanceReport): boolean {
    // A hazard passes if all policy bands have 'healthy' status
    return report.bands.every((band: HazardBalanceBands) => band.overallHealth === 'healthy');
}

function evaluateGatheringBalance(report: GatheringBalanceReport): boolean {
    // Gathering passes if eruption rate is within bounds and communion rate meets minimum
    const { eruptionRateMax, communionRateMin } = report.balanceBands;
    
    // Check if current metrics are within acceptable bounds
    // Using greedy policy eruption rate as the high-water mark
    const greedyPolicy = report.policies.greedy;
    const communionPolicy = report.policies['communion-chaser'];
    
    if (!greedyPolicy || !communionPolicy) return false;
    
    return greedyPolicy.eruptionRate <= eruptionRateMax &&
           communionPolicy.communionRate >= communionRateMin;
}

function evaluateQuestBoardBalance(report: QuestBoardBalanceReport): boolean {
    // Quest board passes if all policy bands have 'healthy' status
    return report.bands.every((band: QuestBoardBalanceBands) => band.overallHealth === 'healthy');
}

function evaluateOverallBalance(report: MinigameHarnessReport, enabledMinigames: MinigameId[]): boolean {
    // Overall passes only if all enabled minigames pass
    return enabledMinigames.every(minigameId => {
        switch (minigameId) {
            case 'hazard': return report.passFail.hazard;
            case 'gathering': return report.passFail.gathering;
            case 'quest-board': return report.passFail.questBoard;
            default: return false;
        }
    });
}