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

describe('balance bands (loose) — every themed preset can win on the easy profile', () => {
    // The deck axis (spec 32 v3 §8): stage × policy × PRESET. One easy-stage
    // cell per preset; the loose gate is "wins at least once" — a preset that
    // cannot beat the easiest roster at all is dead on arrival.
    it.each(COMBAT_DECK_PRESET_ORDER.map(id => [id] as const))(
        "preset '%s' wins at least sometimes on the early stage",
        (presetId) => {
            const report = runPlaytestMatrix({
                stages: ['early'],
                policies: ['greedy'],
                decks: [{ kind: 'preset', presetId }],
                enemiesPerStage: 2,
                runsPerCell: RUNS_PER_CELL,
                seed: SEED,
            });
            const wins = report.cells.reduce((n, c) => n + c.stats.victories + c.stats.mercies, 0);
            const runs = report.cells.reduce((n, c) => n + c.stats.runs, 0);
            expect(runs).toBeGreaterThan(0);
            expect(wins, `preset '${presetId}' never won a single early-stage run`).toBeGreaterThan(0);
        },
        120_000,
    );
});

// spec 32 v3: bands re-pinned loose; /deck-tuning + /combat-playtest recalibrate.
