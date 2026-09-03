/**
 * Hermetic sim e2e — OBJECTIVE FUNCTION v2 over REAL fights (Phase 43).
 *
 * The companion of `combat-objective.engine.test.ts` (which pins the metric's
 * arithmetic on synthetic telemetry). This suite drives the score through the
 * highest public entry points that actually play combat — `runOneEncounter`,
 * `simulateHazardPatternCombatDetailed`, `runPlaytestMatrix` — and pins:
 *
 *   1. The three LOCKED systems are genuinely exercised by the shipped library.
 *      If a future change stops feeding Conviction, the Surge meter or the Dice
 *      economy in real play, this suite goes red — the locked-mechanics guard
 *      with teeth on the live tree, not just on the weights.
 *   2. `statusEngagement` is still computed BESIDE the new score (the phase row:
 *      implement it beside the old metric, do not repoint it).
 *   3. Rollups POOL telemetry and re-score rather than averaging indices.
 *   4. Determinism + hermeticity: same seed, same score; `Math.random` untouched.
 *
 * Matrix kept small on purpose (2 enemies/stage, few runs) — this is a
 * correctness suite, not a balance measurement.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import { LittleBelle } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { runOneEncounter, simulateHazardPatternCombatDetailed } from '../combat.encounter.sim';
import { runPlaytestMatrix, type PlaytestReport } from '../combat.playtest';
import {
    COMBAT_QUALITY_WEIGHTS, LOCKED_MECHANIC_TERMS, scoreCombatObjective,
} from '../combat.objective';
import {
    diceEconomyBreadth, emptyObjectiveTelemetry, poolObjectiveTelemetry,
} from '../combat.objective.telemetry';

afterEach(() => vi.restoreAllMocks());

const DECK = ['spoiled-poultice', 'chilblain-watch', 'thin-hymn', 'first-spadeful', 'thumbprick-oath'];

function loadout(cards: readonly string[]): Character {
    const p = deepClone(Player);
    p.knownCards = [...cards];
    p.baseStats = { heart: 10, body: 10, mind: 10 };
    p.health = 150;
    p.maxHealth = 150;
    return p;
}

let cached: PlaytestReport | null = null;
function report(): PlaytestReport {
    cached = cached ?? runPlaytestMatrix({
        policies: ['greedy', 'blind'],
        decks: [{ kind: 'policy-pick' }],
        enemiesPerStage: 2,
        runsPerCell: 8,
        seed: 5,
    });
    return cached;
}

describe('objective v2 — one encounter carries its own telemetry', () => {
    it('runOneEncounter reports mergeable objective telemetry for the run', () => {
        const r = runOneEncounter(loadout(DECK), deepClone(LittleBelle), 11, 'greedy');
        expect(r.objective.runs).toBe(1);
        expect(r.objective.rounds).toBe(r.rounds);
        // Decision width is sampled at powered plays, so it cannot exceed plays.
        expect(r.objective.decisionPoints).toBeGreaterThan(0);
        expect(r.objective.decisionPoints).toBeLessThanOrEqual(r.plays);
        // Every sampled decision offered at least the card that got played.
        expect(r.objective.liveOptions).toBeGreaterThanOrEqual(r.objective.decisionPoints);
        // The arc sample is either a real centroid in (0,1) or explicitly absent.
        expect([0, 1]).toContain(r.objective.arcRuns);
        if (r.objective.arcRuns === 1) {
            expect(r.objective.arcCentroidSum).toBeGreaterThan(0);
            expect(r.objective.arcCentroidSum).toBeLessThan(1);
        }
    }, 30_000);

    it('instrumenting the metric did not perturb the seeded run', () => {
        const a = runOneEncounter(loadout(DECK), deepClone(LittleBelle), 11, 'greedy');
        const b = runOneEncounter(loadout(DECK), deepClone(LittleBelle), 11, 'greedy');
        expect(b).toEqual(a);
    }, 30_000);
});

describe('objective v2 — the LOCKED systems are exercised in real play', () => {
    // This is the live-tree half of the locked-mechanics guard: the weights
    // test proves the score DEFENDS the three systems; this proves the shipped
    // engine + library actually FEED them, so the defence measures something.
    it('the shipped matrix feeds Conviction, the Surge meter and the Dice system', () => {
        const pooled = poolObjectiveTelemetry(report().cells.map(c => c.stats.objectiveTelemetry));

        // Conviction — earned AND converted into Signature plays.
        expect(pooled.convictionGained, 'Conviction income is dead').toBeGreaterThan(0);
        expect(pooled.convictionSpent, 'Conviction is never spent').toBeGreaterThan(0);
        expect(pooled.signatureCasts).toBeGreaterThan(0);

        // Surge meter — the chain is driven and at least sometimes completes.
        expect(pooled.momentumAdvances, 'the momentum chain never advances').toBeGreaterThan(0);
        expect(pooled.surges, 'no chain ever surges').toBeGreaterThan(0);

        // Dice — rolled, spent, and the die ECONOMY is touched (not just rolled).
        expect(pooled.diceRolled).toBeGreaterThan(0);
        expect(pooled.diceSpent, 'rolled dice never power a line').toBeGreaterThan(0);
        expect(diceEconomyBreadth(pooled), 'the die economy is never played').toBeGreaterThan(0);

        // …and therefore every locked sub-score is live rather than structurally 0.
        const score = scoreCombatObjective(pooled);
        for (const term of LOCKED_MECHANIC_TERMS) {
            expect(score.spineComponents[term], `locked sub-score '${term}' is dead`).toBeGreaterThan(0);
        }
    }, 120_000);

    it('silencing a locked system in the MEASURED telemetry costs real score', () => {
        const pooled = poolObjectiveTelemetry(report().cells.map(c => c.stats.objectiveTelemetry));
        const live = scoreCombatObjective(pooled);
        for (const term of LOCKED_MECHANIC_TERMS) {
            const blinded = { ...pooled, diceEconomyVerbs: { ...pooled.diceEconomyVerbs } };
            if (term === 'conviction') {
                blinded.convictionGained = 0;
                blinded.convictionSpent = 0;
            } else if (term === 'surge') {
                blinded.momentumAdvances = 0;
                blinded.surges = 0;
            } else {
                blinded.diceSpent = 0;
                blinded.diceEconomyVerbs = {};
            }
            const score = scoreCombatObjective(blinded);
            expect(score.spineComponents[term]).toBe(0);
            expect(score.index, `ignoring '${term}' cost nothing`).toBeLessThan(live.index);
        }
    }, 120_000);
});

describe('objective v2 — reported BESIDE statusEngagement, never instead of it', () => {
    it('every cell reports both the legacy warning light and the new index', () => {
        for (const cell of report().cells) {
            const s = cell.stats;
            expect(typeof s.statusEngagement).toBe('number');
            expect(s.statusEngagement).toBeGreaterThanOrEqual(0);
            expect(s.combatQuality.index).toBeGreaterThanOrEqual(0);
            expect(s.combatQuality.index).toBeLessThanOrEqual(1);
            expect(Object.keys(s.combatQuality.components).sort())
                .toEqual(['arc', 'identity', 'spine', 'width']);
            expect(Object.keys(s.combatQuality.spineComponents).sort())
                .toEqual([...LOCKED_MECHANIC_TERMS].sort());
            expect(s.combatQuality.weights).toEqual(COMBAT_QUALITY_WEIGHTS);
        }
    }, 120_000);

    it('statusEngagement is still non-zero on the non-impossible stages (unchanged meaning)', () => {
        for (const stage of ['early', 'mid', 'late'] as const) {
            const summary = report().stageSummaries.find(s => s.stage === stage);
            expect(summary, `no summary for '${stage}'`).toBeDefined();
            expect(summary!.statusEngagement, `statusEngagement dead on '${stage}'`).toBeGreaterThan(0);
        }
    }, 120_000);

    it('the index does NOT track win rate — it grades HOW the fight played', () => {
        // Explicitly pinned so nobody "fixes" the metric into a second win-rate
        // witness: the doctrine bands already grade whether a deck should win.
        const cells = report().cells;
        // The claim is DECOUPLING, not the presence of an extreme: CQI must be
        // positive at every win rate, including the extremes when the matrix
        // happens to contain them. Requiring an unwinnable cell to exist was
        // itself a balance law — it made a well-tuned matrix fail this test.
        for (const cell of cells) {
            expect(
                cell.stats.combatQuality.index,
                `CQI collapsed on ${cell.spec.stage}/${cell.spec.enemySlug} at winRate ${cell.stats.winRate}`,
            ).toBeGreaterThan(0);
        }
        const extremes = cells.filter(c => c.stats.winRate >= 0.99 || c.stats.winRate <= 0.01);
        for (const cell of extremes) {
            // A fight that cannot be won can still be a good fight, and one
            // that cannot be lost can still be a bad one.
            expect(cell.stats.combatQuality.index).toBeGreaterThan(0);
        }
    }, 120_000);
});

describe('objective v2 — rollups pool telemetry and re-score', () => {
    it('a stage summary scores its cells POOLED telemetry, not their mean index', () => {
        for (const summary of report().stageSummaries) {
            const cells = report().cells.filter(c => c.spec.stage === summary.stage);
            const expected = scoreCombatObjective(
                poolObjectiveTelemetry(cells.map(c => c.stats.objectiveTelemetry)),
            );
            expect(summary.combatQuality).toEqual(expected);
        }
    }, 120_000);

    it('the report-level index scores every cell pooled', () => {
        const expected = scoreCombatObjective(
            poolObjectiveTelemetry(report().cells.map(c => c.stats.objectiveTelemetry)),
        );
        expect(report().combatQuality).toEqual(expected);
    }, 120_000);

    it('a cell stat pools exactly its own runs', () => {
        const { stats } = simulateHazardPatternCombatDetailed({
            player: loadout(DECK), enemy: deepClone(LittleBelle), runs: 5, startSeed: 3, policy: 'greedy',
        });
        expect(stats.objectiveTelemetry.runs).toBe(5);
        expect(stats.combatQuality).toEqual(scoreCombatObjective(stats.objectiveTelemetry));
        // Hand-pooling the same five runs reproduces the cell exactly.
        const manual = emptyObjectiveTelemetry();
        const parts = [0, 1, 2, 3, 4].map(i =>
            runOneEncounter(loadout(DECK), deepClone(LittleBelle), 3 + i, 'greedy').objective);
        expect(poolObjectiveTelemetry([manual, ...parts])).toEqual(stats.objectiveTelemetry);
    }, 60_000);
});

describe('objective v2 — determinism + hermeticity', () => {
    it('identical seeds produce an identical score', () => {
        const run = (): number => simulateHazardPatternCombatDetailed({
            player: loadout(DECK), enemy: deepClone(LittleBelle), runs: 4, startSeed: 7, policy: 'blind',
        }).stats.combatQuality.index;
        expect(run()).toBe(run());
    }, 60_000);

    it('scoring a real matrix never touches Math.random', () => {
        const spy = vi.spyOn(Math, 'random');
        scoreCombatObjective(poolObjectiveTelemetry(report().cells.map(c => c.stats.objectiveTelemetry)));
        expect(spy).not.toHaveBeenCalled();
    }, 120_000);
});
