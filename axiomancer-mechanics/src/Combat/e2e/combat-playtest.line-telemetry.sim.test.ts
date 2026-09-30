/**
 * WS1.3 — FREE/PAID line-telemetry shape (sim e2e, telemetry-first).
 *
 * The 85%/15% FREE/PAID dominance-flag bands were repealed 2026-09-02
 * (big-numbers overhaul §3/§10) along with every other balance band — the
 * library is being rewritten wholesale, so no old line-share number
 * survives as a law. What remains is a bug detector: the matrix runs on
 * the grey deck and the report carries the WS1.2 per-card line-telemetry columns
 * (`free%`), so a future rebalance pass has real data to look at.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { runPlaytestMatrix, formatPlaytestReport } from '../combat.playtest';

afterEach(() => vi.restoreAllMocks());

const RUNS_PER_CELL = 30;
const SEED = 1;

describe('line telemetry — the report carries per-card FREE/PAID columns', () => {
    it(
        'the grey deck: the matrix runs and the report renders per-card line telemetry',
        () => {
            const report = runPlaytestMatrix({
                policies: ['greedy', 'blind'],
                decks: [{ kind: 'grey' }],
                enemiesPerStage: 1,
                runsPerCell: RUNS_PER_CELL,
                seed: SEED,
            });

            const rendered = formatPlaytestReport(report, { perCard: true });
            expect(rendered).toContain('Per-card usage (all cells):');
            expect(rendered).toContain('free%');
        },
        360_000,
    );
});
