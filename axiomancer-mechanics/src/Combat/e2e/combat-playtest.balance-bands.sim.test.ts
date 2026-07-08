/**
 * Hermetic sim e2e — per-stage balance bands over the playtest matrix.
 *
 * spec 32 v3: bands re-pinned loose; /deck-tuning + /combat-playtest
 * recalibrate. The 70-card themed library replaced the tuned pool wholesale,
 * so the old calibrated bands are void. Win ratio is explicitly NOT a
 * constraint (spec §8) — what this suite pins now:
 *
 *   1. The matrix RUNS across every stage without crashing, and every cell's
 *      outcome accounting is exact.
 *   2. Status engagement is nonzero on every non-impossible stage (doctrine:
 *      status effects are the MAIN fun).
 *   3. Every one of the ten themed presets can WIN at least sometimes on the
 *      easy (early) profile — no preset is dead on arrival.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { runPlaytestMatrix, type PlaytestReport } from '../combat.playtest';
import { COMBAT_DECK_PRESET_ORDER } from '../combat.deck-presets';
import type { CombatStageId } from '../combat.stage-profiles';

afterEach(() => vi.restoreAllMocks());

/** Matrix kept small on purpose: 2 enemies per stage, 30 runs per cell. */
const RUNS_PER_CELL = 30;
const SEED = 1;

let cachedMain: PlaytestReport | null = null;
/** greedy + blind over all four stages (the tuned balance witnesses). */
function mainReport(): PlaytestReport {
    cachedMain = cachedMain ?? runPlaytestMatrix({
        policies: ['greedy', 'blind'],
        decks: [{ kind: 'policy-pick' }],
        enemiesPerStage: 2,
        runsPerCell: RUNS_PER_CELL,
        seed: SEED,
    });
    return cachedMain;
}

const STAGES: readonly CombatStageId[] = ['early', 'mid', 'late', 'impossible'];
const NON_IMPOSSIBLE: readonly CombatStageId[] = ['early', 'mid', 'late'];

describe('balance bands (loose) — the matrix runs and accounts exactly', () => {
    it('every stage produces cells; every cell terminates all its runs', () => {
        const report = mainReport();
        for (const stage of STAGES) {
            const cells = report.cells.filter(c => c.spec.stage === stage);
            expect(cells.length, `no cells ran for stage '${stage}'`).toBeGreaterThan(0);
        }
        for (const cell of report.cells) {
            const s = cell.stats;
            expect(s.runs).toBe(RUNS_PER_CELL);
            expect(s.victories + s.mercies + s.defeats + s.retreats).toBe(s.runs);
            expect(s.winRate).toBeGreaterThanOrEqual(0);
            expect(s.winRate).toBeLessThanOrEqual(1);
            expect(s.avgRounds).toBeGreaterThan(0);
        }
    }, 120_000);
});

describe('balance bands (loose) — doctrine witnesses', () => {
    it('statusEngagement is nonzero on every non-impossible stage', () => {
        const report = mainReport();
        for (const stage of NON_IMPOSSIBLE) {
            const summary = report.stageSummaries.find(s => s.stage === stage);
            expect(summary, `missing stage summary for '${stage}'`).toBeDefined();
            expect(
                summary!.statusEngagement,
                `statusEngagement dead on '${stage}'`,
            ).toBeGreaterThan(0);
        }
    }, 120_000);

    it('DoT erosion contributes on at least one stage (the HP bar falls to status)', () => {
        const report = mainReport();
        const anyDot = report.stageSummaries.some(s => s.dotHpFraction > 0);
        expect(anyDot, 'no stage shows any DoT HP erosion').toBe(true);
    }, 120_000);
});

// Per-deck floors/ceiling (plan/tuning/2026-07-08-win-path-scaling.md item 4):
// stage AVERAGES hide a bimodal distribution (presets at ~100% next to
// presets at ~0%), so the objective function is per-preset, not per-stage.
// PLAYTEST-CALIBRATION — current values are the loosest that pass on main;
// /deck-tuning ratchets them toward the targets as forge items land:
//   floors  — early 0.40 · mid 0.25 · late 0.10
//   ceiling — 0.98 on every stage (a 100% preset is a DOMINANCE finding,
//             not a success; see Oratory/Standstill in Battle Lab round 2)
const PRESET_FLOORS: Readonly<Record<'early' | 'mid' | 'late', number>> = {
    early: 0.2, // ratchet target 0.40
    mid: 0,     // ratchet target 0.25 — Foundry/Augury/Bastion/Tithe near 0 today
    late: 0,    // ratchet target 0.10 — only 3 of 10 presets win late at all
};
const PRESET_CEILING = 1.0; // ratchet target 0.98 — Oratory/Standstill sit at 1.0 today

describe('balance bands (loose) — per-preset floors and dominance ceiling', () => {
    // The deck axis (spec 32 v3 §8): stage × policy × PRESET. A preset that
    // cannot clear its stage floor is dead on arrival; a preset pinned at
    // 100% has escaped the stage curve (alt-win scaling, plan item 1).
    it.each(COMBAT_DECK_PRESET_ORDER.map(id => [id] as const))(
        "preset '%s' respects the per-stage floors and ceiling",
        (presetId) => {
            const spread: string[] = [];
            for (const stage of ['early', 'mid', 'late'] as const) {
                const report = runPlaytestMatrix({
                    stages: [stage],
                    policies: ['greedy'],
                    decks: [{ kind: 'preset', presetId }],
                    enemiesPerStage: 2,
                    runsPerCell: RUNS_PER_CELL,
                    seed: SEED,
                });
                const wins = report.cells.reduce((n, c) => n + c.stats.victories + c.stats.mercies, 0);
                const runs = report.cells.reduce((n, c) => n + c.stats.runs, 0);
                expect(runs).toBeGreaterThan(0);
                const rate = wins / runs;
                spread.push(`${stage}=${rate.toFixed(2)}`);
                expect(
                    rate,
                    `preset '${presetId}' below the ${stage} floor (${PRESET_FLOORS[stage]})`,
                ).toBeGreaterThanOrEqual(PRESET_FLOORS[stage]);
                expect(
                    rate,
                    `preset '${presetId}' above the ${stage} ceiling (${PRESET_CEILING}) — dominance finding`,
                ).toBeLessThanOrEqual(PRESET_CEILING);
            }
            console.info(`[preset-spread] ${presetId}: ${spread.join(' ')}`);
        },
        360_000,
    );
});

// spec 32 v3: bands re-pinned loose; /deck-tuning + /combat-playtest recalibrate.
