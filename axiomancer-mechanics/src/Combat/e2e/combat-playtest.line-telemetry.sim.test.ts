/**
 * WS1.3 — soft FREE/PAID line-dominance lint (sim e2e, telemetry-first).
 *
 * For every common/uncommon in its HOME preset, across all stages × the two
 * tuned witnesses (greedy + blind), this flags — `console.info`, NEVER a
 * failure — any card whose FREE (top) or PAID (bottom) line takes more than
 * `DOMINANT_SHARE` (or less than `STARVED_SHARE`) of its plays: both tails
 * say one of the card's two printed lines is dead weight. Cards tagged
 * `intentionallyAsymmetric` (`Card`, `src/Cards/types.ts`) are exempt by
 * design declaration.
 *
 * Kept OUTSIDE balance-bands on purpose (different calibration cadence).
 * Soft = the only assertions are that the matrix ran and the report (with
 * the WS1.2 line-telemetry columns) generated, so CI exercises the path.
 * Numbers here are PROVISIONAL until the Phase 26/27 re-baseline lands
 * (plan/tuning/2026-07-11 §0.2) — the official offender list is cut there.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { runPlaytestMatrix, formatPlaytestReport } from '../combat.playtest';
import { COMBAT_DECK_PRESET_ORDER, getDeckPreset } from '../combat.starter-deck-presets';
import type { CombatCardUsage } from '../combat.encounter.sim';
import { getCardById } from '../../Cards/cards.library';
import { rankToRarity } from '../../Cards/types';

afterEach(() => vi.restoreAllMocks());

// PLAYTEST-CALIBRATION — WS1.3 soft line-dominance bands. A line above
// DOMINANT_SHARE (or below STARVED_SHARE) of the card's plays is flagged,
// never failed; MIN_PLAYS gates out noise-level samples. Matrix kept small
// for CI: 1 enemy per stage, 30 runs per cell (all stages × greedy + blind).
const DOMINANT_SHARE = 0.85;
const STARVED_SHARE = 0.15;
const MIN_PLAYS = 20;
const RUNS_PER_CELL = 30;
const SEED = 1;

/** Aggregates per-card usage over every cell of a report. */
function aggregateUsage(cells: readonly { cardUsage: Record<string, CombatCardUsage> }[]): Map<string, CombatCardUsage> {
    const totals = new Map<string, CombatCardUsage>();
    for (const cell of cells) {
        for (const usage of Object.values(cell.cardUsage)) {
            const agg = totals.get(usage.cardId) ?? {
                cardId: usage.cardId, plays: 0, bottomPlays: 0, topPlays: 0, statusLands: 0, discards: 0,
                fizzles: 0, lineContribution: { free: 0, paid: 0 }, unplayedAtPhaseEnd: 0,
            };
            agg.plays += usage.plays;
            agg.bottomPlays += usage.bottomPlays;
            agg.topPlays += usage.topPlays;
            agg.statusLands += usage.statusLands;
            agg.discards += usage.discards;
            agg.fizzles = (agg.fizzles ?? 0) + (usage.fizzles ?? 0);
            agg.unplayedAtPhaseEnd = (agg.unplayedAtPhaseEnd ?? 0) + (usage.unplayedAtPhaseEnd ?? 0);
            agg.lineContribution!.free += usage.lineContribution?.free ?? 0;
            agg.lineContribution!.paid += usage.lineContribution?.paid ?? 0;
            totals.set(usage.cardId, agg);
        }
    }
    return totals;
}

describe('line telemetry (soft) — FREE/PAID dominance flags per home preset', () => {
    it.each(COMBAT_DECK_PRESET_ORDER.map(id => [id] as const))(
        "preset '%s': commons/uncommons play both printed lines",
        (presetId) => {
            const preset = getDeckPreset(presetId);
            expect(preset, `unknown preset '${presetId}'`).toBeDefined();

            const report = runPlaytestMatrix({
                policies: ['greedy', 'blind'],
                decks: [{ kind: 'preset', presetId }],
                enemiesPerStage: 1,
                runsPerCell: RUNS_PER_CELL,
                seed: SEED,
            });
            const totals = aggregateUsage(report.cells);

            // The lint universe: the preset's distinct commons/uncommons (the
            // 4x/2x workhorses — rares are single copies, too thin to band).
            const lintIds = [...new Set(preset!.cardIds)].filter(id => {
                const card = getCardById(id);
                return card !== undefined && rankToRarity(card.rank) !== 'rare';
            });

            for (const cardId of lintIds) {
                const card = getCardById(cardId)!;
                if (card.intentionallyAsymmetric) {
                    console.info(`[line-telemetry] ${presetId}/${cardId}: exempt (intentionallyAsymmetric)`);
                    continue;
                }
                const row = totals.get(cardId);
                const plays = row?.plays ?? 0;
                if (plays < MIN_PLAYS) {
                    console.info(`[line-telemetry] ${presetId}/${cardId}: only ${plays} plays (< ${MIN_PLAYS}) — no line signal`);
                    continue;
                }
                const freeShare = row!.topPlays / plays;
                const paidShare = row!.bottomPlays / plays;
                const fizzles = row!.fizzles ?? 0;
                const unplayed = row!.unplayedAtPhaseEnd ?? 0;
                const detail = `free=${(freeShare * 100).toFixed(0)}% paid=${(paidShare * 100).toFixed(0)}%`
                    + ` plays=${plays} fizzles=${fizzles} unplayed=${unplayed}`
                    + ` hpF=${Math.round(row!.lineContribution?.free ?? 0)} hpP=${Math.round(row!.lineContribution?.paid ?? 0)}`;
                // FREE + PAID shares sum to 1 (every play is one line), so one
                // band check covers both tails of both lines.
                if (freeShare > DOMINANT_SHARE || freeShare < STARVED_SHARE) {
                    const starved = freeShare < STARVED_SHARE ? 'FREE' : 'PAID';
                    console.info(`[line-telemetry] FLAG ${presetId}/${cardId}: ${starved} line starved — ${detail}`);
                } else {
                    console.info(`[line-telemetry] ${presetId}/${cardId}: ok — ${detail}`);
                }
            }

            // Soft gate: the matrix ran and the report (with the WS1.2
            // line-telemetry columns) generated.
            const rendered = formatPlaytestReport(report, { perCard: true });
            expect(rendered).toContain('Per-card usage (all cells):');
            expect(rendered).toContain('free%');
        },
        360_000,
    );
});
