/**
 * Hermetic sim e2e — the playtest matrix harness (`combat.playtest`).
 *
 * Verifies the matrix is fully seed-deterministic (identical options →
 * deeply-equal reports), every cell's outcome accounting is exact
 * (V+M+D+R === runs, fractions in [0,1]), 'policy-pick' decks resolve
 * per-policy (a dot-weaver cell drafts a different deck than an aggro-brute
 * cell under the same seed — status play gets its own tools), and per-card
 * usage never names a card outside the resolved deck. Doctrine: the matrix is
 * the instrument that proves status play stays the efficient path at every
 * campaign stage.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import {
    runPlaytestCell, runPlaytestMatrix, formatPlaytestReport,
    type PlaytestMatrixOptions, type PlaytestReport,
} from '../combat.playtest';

afterEach(() => vi.restoreAllMocks());

/** Small matrix reused across assertions: 1 enemy per stage, 8 runs per cell. */
const SMALL: PlaytestMatrixOptions = {
    stages: ['early', 'impossible'],
    policies: ['greedy', 'chaos'],
    enemiesPerStage: 1,
    runsPerCell: 8,
    seed: 3,
};

let cachedSmall: PlaytestReport | null = null;
function smallReport(): PlaytestReport {
    cachedSmall = cachedSmall ?? runPlaytestMatrix(SMALL);
    return cachedSmall;
}

const FRACTION_KEYS = [
    'winRate', 'statusEngagement', 'dotHpFraction', 'strikeFraction',
    'mechanicBurstFraction', 'guardMitigatedFraction',
] as const;

describe('playtest matrix — determinism', () => {
    it('two runs with identical options produce deeply-equal reports', () => {
        const again = runPlaytestMatrix(SMALL);
        expect(again).toEqual(smallReport());
    }, 60_000);

    it('runPlaytestCell is deterministic for an identical spec', () => {
        const spec = {
            stage: 'early' as const,
            enemySlug: 'tidepool-crab',
            policyId: 'dot-weaver' as const,
            deck: { kind: 'policy-pick' as const },
            runs: 6,
            seed: 11,
        };
        expect(runPlaytestCell(spec)).toEqual(runPlaytestCell(spec));
    }, 30_000);
});

describe('playtest matrix — cell invariants', () => {
    it('every cell: victories + mercies + defeats + retreats === runs; winRate consistent', () => {
        const report = smallReport();
        expect(report.cells.length).toBe(4); // 2 stages x 1 enemy x 2 policies x 1 deck
        for (const cell of report.cells) {
            const s = cell.stats;
            expect(s.runs).toBe(SMALL.runsPerCell);
            expect(s.victories + s.mercies + s.defeats + s.retreats).toBe(s.runs);
            expect(s.winRate).toBeCloseTo((s.victories + s.mercies) / s.runs, 10);
            for (const key of FRACTION_KEYS) {
                expect(s[key], `${key} out of [0,1]`).toBeGreaterThanOrEqual(0);
                expect(s[key], `${key} out of [0,1]`).toBeLessThanOrEqual(1);
            }
        }
    }, 60_000);

    it('cardUsage keys are a subset of the resolved deck (never-drawn cards simply absent)', () => {
        const report = smallReport();
        for (const cell of report.cells) {
            expect(cell.deckCardIds.length).toBeGreaterThan(0);
            expect(cell.deckCardIds).toContain('card-retreat');
            const allowed = new Set(cell.deckCardIds);
            for (const key of Object.keys(cell.cardUsage)) {
                expect(allowed.has(key), `cell played '${key}' outside its deck`).toBe(true);
            }
        }
    }, 60_000);

    it('stage summaries cover exactly the stages run, weighted over their cells', () => {
        const report = smallReport();
        expect(report.stageSummaries.map(s => s.stage)).toEqual(['early', 'impossible']);
        for (const summary of report.stageSummaries) {
            expect(summary.cells).toBe(2);
            expect(summary.winRate).toBeGreaterThanOrEqual(0);
            expect(summary.winRate).toBeLessThanOrEqual(1);
            expect(summary.avgRounds).toBeGreaterThan(0);
        }
        // Coverage universe is the union of eligible pools; disjoint partition.
        const { exercised, neverPlayed } = report.cardCoverage;
        expect(exercised.length + neverPlayed.length).toBeGreaterThan(0);
        expect(exercised.filter(id => neverPlayed.includes(id))).toEqual([]);
    }, 60_000);
});

describe('playtest matrix — policy-pick decks resolve per-policy', () => {
    it('dot-weaver and aggro-brute cells draft different decks under the same seed', () => {
        const report = runPlaytestMatrix({
            stages: ['early'],
            policies: ['dot-weaver', 'aggro-brute'],
            enemiesPerStage: 1,
            runsPerCell: 4,
            seed: 1,
        });
        expect(report.cells.length).toBe(2);
        const [weaver, brute] = report.cells;
        expect(weaver.spec.policyId).toBe('dot-weaver');
        expect(brute.spec.policyId).toBe('aggro-brute');
        expect(weaver.deckCardIds).not.toEqual(brute.deckCardIds);
    }, 30_000);
});

describe('playtest report formatting', () => {
    it('renders aligned tables with cells, stage summaries, and card coverage', () => {
        const text = formatPlaytestReport(smallReport());
        expect(text).toContain('Hazard combat playtest matrix');
        expect(text).toContain('Stage summaries');
        expect(text).toContain('Card coverage:');
        expect(text).toContain('early');
        expect(text).toContain('impossible');
        expect(text).not.toContain('Per-card usage');
    }, 60_000);

    it('perCard option appends the per-card usage table', () => {
        const text = formatPlaytestReport(smallReport(), { perCard: true });
        expect(text).toContain('Per-card usage');
        expect(text).toContain('statusLands');
    }, 60_000);
});

describe('playtest harness — honest failures', () => {
    it('throws on an unknown enemy slug', () => {
        expect(() => runPlaytestCell({
            stage: 'early', enemySlug: 'no-such-foe', policyId: 'greedy',
            deck: { kind: 'policy-pick' }, runs: 1, seed: 1,
        })).toThrow(/Unknown enemy slug/);
    });

    it('grants the stage player knowledge of explicit deck cards (a preset above the stage gate still runs)', () => {
        // The dot-erosion preset carries tier-3 cards the early-stage player has
        // not learned; the harness grants deck knowledge so the cell still runs
        // (the maturity gate lives in DRAFTING, not the engine knownSkills check).
        const cell = runPlaytestCell({
            stage: 'early', enemySlug: 'tidepool-crab', policyId: 'greedy',
            deck: { kind: 'preset', presetId: 'dot-erosion' }, runs: 2, seed: 1,
        });
        expect(cell.deckCardIds).toContain('the-final-word');
        expect(cell.stats.runs).toBe(2);
    }, 30_000);
});
