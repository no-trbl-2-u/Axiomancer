/**
 * Minigame Harness — unified cross-minigame testing types.
 *
 * Defines the common interface for orchestrating balance testing across
 * live minigames. Enables A/B testing, playstyle divergence measurement,
 * and unified reporting for use as a standard verification gate in
 * balance phases.
 */

import type { HazardABResult, HazardBalanceReport } from './Hazard/hazard.sim';
import type { HAZARD_TUNING } from './Hazard/hazard.tuning';

export type MinigameId = 'hazard';

export interface MinigameHarnessConfig {
    /** Which minigames to run. */
    minigames: MinigameId[];
    /** Number of simulation runs per minigame. */
    runs: number;
    /** RNG seed for deterministic results. */
    seed?: string;
    /** Optional A/B test configuration variants per minigame. */
    abTestVariants?: {
        hazard?: [typeof HAZARD_TUNING, typeof HAZARD_TUNING];
    };
}

export interface MinigameHarnessReport {
    /** Timestamp when the harness was executed. */
    timestamp: string;
    /** Total number of minigames tested. */
    totalMinigames: number;
    /** Individual minigame balance reports. */
    results: {
        hazard?: HazardBalanceReport;
    };
    /** A/B test results if variants were provided. */
    abTests?: {
        hazard?: HazardABResult;
    };
    /** Pass/fail evaluation per minigame and overall. */
    passFail: {
        hazard: boolean;
        overall: boolean;
    };
}

export interface MinigameHarnessSummary {
    /** Names of minigames that were executed. */
    minigamesRun: string[];
    /** Total simulation runs across all minigames. */
    totalRuns: number;
    /** Whether all enabled minigames passed their balance criteria. */
    overallPass: boolean;
    /** Aggregated recommendations from all minigame reports. */
    recommendations: string[];
}
