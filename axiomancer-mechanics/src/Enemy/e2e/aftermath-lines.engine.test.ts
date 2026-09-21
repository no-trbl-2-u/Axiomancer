/**
 * Per-foe aftermath narrative lines (GH#65 ask 1) — 2026-07-06 roster.
 *
 * Pins the registration shape (`finalBlowLines` + `causeLines` on the
 * authored set; `pactLines` only on befriendable enemies that carry a
 * `friendshipReward`); voice signatures spot-checked on the early trio;
 * the Sandbag_01 regression pins that the fields stay strictly undefined
 * for the un-authored test sandbox so the consumer-side fallback path
 * stays intact.
 *
 * `adjust-enemies` pass 15 (2026-09-21) backfilled the last 31 enemies
 * still missing `finalBlowLines`/`causeLines` (the standing 32-enemy
 * backlog re-cited-not-fixed across passes 1-14, `TheSophist` needing
 * only the two fields since it already carried `pactLines`). The
 * 'every roster entry carries finalBlowLines + causeLines' test below is
 * the regression guard this backlog never had: it sweeps the full
 * `EnemyLibrary` (not a hand-picked subset) so a future enemy landing
 * without aftermath prose fails CI immediately instead of sitting
 * unflagged for another dozen passes.
 */
import { describe, it, expect } from 'vitest';
import { EnemyLibrary } from '../enemy.library';
import {
    // Befriendable — full line set incl. pactLines.
    LittleBelle,
    WaterHolger,
    KingOfRevenge,
    BrineHag,
    TheFerryman,
    HasshakuSama,
    FateSpinner,
    LadyGabriella,
    Rangda,
    // Sweep — finalBlowLines + causeLines (no pactLines).
    FloatEye,
    Kudan,
    Mirac,
    RawheadRex,
    RaAminKa,
    ZomaAscendant,
    ElderFireGiant,
    Tezcatlipoca,
    ArchDemon,
    Beelzebub,
    Death,
    TheAbortive,
    // Un-authored regression — test sandbox per Phase 74 D1.
    Sandbag_01,
} from '../enemy.library';

describe('per-foe aftermath narrative lines (art-driven roster)', () => {
    const befriendable = [
        LittleBelle, WaterHolger, KingOfRevenge,
        BrineHag, TheFerryman, HasshakuSama, FateSpinner, LadyGabriella, Rangda,
    ];
    const sweepOnly = [
        FloatEye, Kudan, Mirac, RawheadRex, RaAminKa,
        ZomaAscendant, ElderFireGiant, Tezcatlipoca, ArchDemon, Beelzebub,
        Death, TheAbortive,
    ];
    const authored = [...befriendable, ...sweepOnly];

    it('all authored enemies carry finalBlowLines + causeLines shape', () => {
        for (const enemy of authored) {
            expect(enemy.finalBlowLines, `${enemy.id} finalBlowLines`).toBeDefined();
            expect(enemy.finalBlowLines!.brutal).toMatch(/\S/);
            expect(enemy.finalBlowLines!.quiet).toMatch(/\S/);
            expect(enemy.finalBlowLines!.ironic).toMatch(/\S/);

            expect(enemy.causeLines, `${enemy.id} causeLines`).toBeDefined();
            expect(enemy.causeLines!.brutal).toMatch(/\S/);
            expect(enemy.causeLines!.broken).toMatch(/\S/);
            expect(enemy.causeLines!.quiet).toMatch(/\S/);
        }
    });

    it('every EnemyLibrary entry carries finalBlowLines + causeLines (full-roster regression guard)', () => {
        for (const enemy of EnemyLibrary) {
            expect(enemy.finalBlowLines, `${enemy.id} finalBlowLines`).toBeDefined();
            expect(enemy.finalBlowLines!.brutal).toMatch(/\S/);
            expect(enemy.finalBlowLines!.quiet).toMatch(/\S/);
            expect(enemy.finalBlowLines!.ironic).toMatch(/\S/);

            expect(enemy.causeLines, `${enemy.id} causeLines`).toBeDefined();
            expect(enemy.causeLines!.brutal).toMatch(/\S/);
            expect(enemy.causeLines!.broken).toMatch(/\S/);
            expect(enemy.causeLines!.quiet).toMatch(/\S/);

            // pactLines is only meaningful alongside a friendshipReward — assert
            // presence/shape when carried, but don't require it (most enemies
            // are not befriendable).
            if (enemy.friendshipReward) {
                expect(enemy.pactLines, `${enemy.id} pactLines (has friendshipReward)`).toBeDefined();
                expect(enemy.pactLines!.quiet).toMatch(/\S/);
                expect(enemy.pactLines!.setDown).toMatch(/\S/);
                expect(enemy.pactLines!.heavy).toMatch(/\S/);
            }
        }
    });

    it('no roster aftermath line uses the archaic thee/thou/thy/thine/ye register (spec 34 §2.5)', () => {
        const archaic = /\b(thee|thou|thy|thine|ye)\b/i;
        for (const enemy of EnemyLibrary) {
            const lines = [
                ...(enemy.finalBlowLines ? Object.values(enemy.finalBlowLines) : []),
                ...(enemy.causeLines ? Object.values(enemy.causeLines) : []),
                ...(enemy.pactLines ? Object.values(enemy.pactLines) : []),
            ];
            for (const line of lines) {
                expect(line, `${enemy.id}: "${line}"`).not.toMatch(archaic);
            }
        }
    });

    it('pactLines only on the befriendable enemies', () => {
        for (const enemy of befriendable) {
            expect(enemy.pactLines, `${enemy.id} pactLines`).toBeDefined();
            expect(enemy.pactLines!.quiet).toMatch(/\S/);
            expect(enemy.pactLines!.setDown).toMatch(/\S/);
            expect(enemy.pactLines!.heavy).toMatch(/\S/);
        }
        for (const enemy of sweepOnly) {
            expect(enemy.pactLines, `${enemy.id} pactLines should be absent`).toBeUndefined();
        }
    });

    it('voice signatures pin per enemy', () => {
        expect(LittleBelle.pactLines!.quiet).toMatch(/bell/);
        expect(WaterHolger.pactLines!.heavy).toMatch(/Carried these/);
        expect(KingOfRevenge.pactLines!.heavy).toMatch(/grievance without a crown/);
    });

    it('befriendable enemies carry pactLines + journalEntry voice pairs', () => {
        expect(BrineHag.pactLines!.heavy).toMatch(/sold my face/);
        expect(BrineHag.journalEntry!.title).toMatch(/Face Broker/);

        expect(TheFerryman.pactLines!.heavy).toMatch(/toll/i);
        expect(TheFerryman.journalEntry!.title).toMatch(/Crossing Nobody Ordered/);

        expect(HasshakuSama.pactLines!.heavy).toMatch(/chose you/);
        expect(HasshakuSama.journalEntry!.title).toMatch(/Offer Made Too Tall/);

        expect(FateSpinner.pactLines!.heavy).toMatch(/not knowing/);
        expect(FateSpinner.journalEntry!.title).toMatch(/Loose Thread/);
    });

    it('un-authored enemies (Sandbag_01 — test sandbox per Phase 74 D1) have all three fields undefined', () => {
        expect(Sandbag_01.finalBlowLines).toBeUndefined();
        expect(Sandbag_01.pactLines).toBeUndefined();
        expect(Sandbag_01.causeLines).toBeUndefined();
    });

    // Engine does NO variant selection between the three slots. The variant
    // pick lives entirely on the consumer (mobile presenter, CLI, etc.) based
    // on the outcome shape. This case documents the intended consumption
    // pattern with an inline mock-consumer helper.
    it('consumer-side variant selection — mock pickFinalBlowVariant pattern', () => {
        const pickFinalBlowVariant = (report: {
            overkillRatio?: number;
            sourceIsSelf?: boolean;
        }): 'brutal' | 'quiet' | 'ironic' => {
            if (report.sourceIsSelf) return 'ironic';
            if (report.overkillRatio !== undefined && report.overkillRatio >= 2) return 'brutal';
            return 'quiet';
        };

        // Drive each variant against Little Belle's authored lines.
        expect(LittleBelle.finalBlowLines![pickFinalBlowVariant({ overkillRatio: 3 })])
            .toMatch(/rings again/);     // brutal
        expect(LittleBelle.finalBlowLines![pickFinalBlowVariant({ overkillRatio: 1 })])
            .toMatch(/finished grief/);  // quiet
        expect(LittleBelle.finalBlowLines![pickFinalBlowVariant({ sourceIsSelf: true })])
            .toMatch(/summoned/);        // ironic
    });
});
