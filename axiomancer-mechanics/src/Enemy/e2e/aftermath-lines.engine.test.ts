/**
 * Phase 71 — per-foe aftermath narrative lines (GH#65 ask 1).
 * Phase 74 — sweep extended to 15 of 16 enemies (Sandbag_01 stays
 * un-authored as the test sandbox + the regression case).
 *
 * Pins the registration shape (`finalBlowLines` + `causeLines` on
 * all 15 authored enemies; `pactLines` only on the 3 befriendable
 * enemies that carry a `friendshipReward`); voice signatures spot-
 * checked on the original Phase 71 trio; the Sandbag_01 regression
 * pins that the fields stay strictly undefined for the un-authored
 * test sandbox so the consumer-side fallback path stays intact.
 */
import { describe, it, expect } from 'vitest';
import {
    // Phase 71 originals — full line set incl. pactLines.
    MournfulGull,
    HollowEyedBeggar,
    CoastalTyrant,
    // Phase 74 sweep — finalBlowLines + causeLines (no pactLines).
    TidepoolCrab,
    SeaMistWisp,
    LullabyMoth,
    Disatree_01,
    WetHound,
    ForestSprite,
    ArgumentativeCrow,
    TideflukeReaver,
    HushWraith,
    HollowSaint,
    TheDisagreement,
    EchoOfPyrrhonia,
    // Un-authored regression — test sandbox per Phase 74 D1.
    Sandbag_01,
} from '../enemy.library';

describe('Phase 71 + 74 + 102 — per-foe aftermath narrative lines', () => {
    // Phase 102 expands befriendable roster from 3 → 7
    const befriendable = [
        MournfulGull, HollowEyedBeggar, CoastalTyrant,
        TideflukeReaver, HushWraith, HollowSaint, TheDisagreement
    ];
    const sweepOnly = [
        TidepoolCrab, SeaMistWisp, LullabyMoth, Disatree_01, WetHound,
        ForestSprite, ArgumentativeCrow, EchoOfPyrrhonia,
    ];
    const authored = [...befriendable, ...sweepOnly];

    it('all 15 authored enemies carry finalBlowLines + causeLines shape', () => {
        for (const enemy of authored) {
            expect(enemy.finalBlowLines).toBeDefined();
            expect(enemy.finalBlowLines!.brutal).toMatch(/\S/);
            expect(enemy.finalBlowLines!.quiet).toMatch(/\S/);
            expect(enemy.finalBlowLines!.ironic).toMatch(/\S/);

            expect(enemy.causeLines).toBeDefined();
            expect(enemy.causeLines!.brutal).toMatch(/\S/);
            expect(enemy.causeLines!.broken).toMatch(/\S/);
            expect(enemy.causeLines!.quiet).toMatch(/\S/);
        }
    });

    it('pactLines only on the 7 befriendable enemies (Phase 71 D2 + Phase 74 D3 + Phase 102)', () => {
        for (const enemy of befriendable) {
            expect(enemy.pactLines).toBeDefined();
            expect(enemy.pactLines!.quiet).toMatch(/\S/);
            expect(enemy.pactLines!.setDown).toMatch(/\S/);
            expect(enemy.pactLines!.heavy).toMatch(/\S/);
        }
        for (const enemy of sweepOnly) {
            expect(enemy.pactLines).toBeUndefined();
        }
    });

    it('voice signatures pin per enemy', () => {
        expect(MournfulGull.pactLines!.quiet).toMatch(/slights/);
        expect(HollowEyedBeggar.pactLines!.heavy).toMatch(/carrying these/);
        expect(CoastalTyrant.pactLines!.heavy).toMatch(/king of nothing/);
    });

    it('Phase 102 — new befriendable enemies carry pactLines + journalEntry', () => {
        // TideflukeReaver voice signatures
        expect(TideflukeReaver.pactLines!.heavy).toMatch(/shore cursed me/);
        expect(TideflukeReaver.journalEntry!.title).toMatch(/Salt-Bound Oath/);
        
        // HushWraith voice signatures
        expect(HushWraith.pactLines!.quiet).toMatch(/silence feels like rest/);
        expect(HushWraith.journalEntry!.title).toMatch(/Question After Silence/);
        
        // HollowSaint voice signatures  
        expect(HollowSaint.pactLines!.heavy).toMatch(/martyrdom was the only honest witness/);
        expect(HollowSaint.journalEntry!.title).toMatch(/Witness Who Chose to Stay/);
        
        // TheDisagreement voice signatures
        expect(TheDisagreement.pactLines!.heavy).toMatch(/argue in good faith/);
        expect(TheDisagreement.journalEntry!.title).toMatch(/Art of Arguing in Good Faith/);
    });

    it('un-authored enemies (Sandbag_01 — test sandbox per Phase 74 D1) have all three fields undefined', () => {
        expect(Sandbag_01.finalBlowLines).toBeUndefined();
        expect(Sandbag_01.pactLines).toBeUndefined();
        expect(Sandbag_01.causeLines).toBeUndefined();
    });

    // Phase 71 D4 — engine does NO variant selection between the three
    // slots. The variant pick lives entirely on the consumer (mobile
    // presenter, CLI, etc.) based on the outcome shape. This case
    // documents the intended consumption pattern with an inline
    // mock-consumer helper so future engine-side helper proposals have
    // a concrete sketch to lean on (e.g. if multiple consumers converge
    // on the same selection heuristic, the engine could ship a
    // `pickFinalBlowVariant(report, enemy)` helper — see Phase 71
    // brief Follow-ups).
    it('consumer-side variant selection — mock pickFinalBlowVariant pattern', () => {
        // Toy consumer-side selection heuristic: damage-tier shape →
        // variant key. Brutal = overkill burst (damage ≥ 2× cap);
        // ironic = mirror / self-inflicted (sourceId === enemy.id);
        // quiet = exact-cap default.
        const pickFinalBlowVariant = (report: {
            overkillRatio?: number;
            sourceIsSelf?: boolean;
        }): 'brutal' | 'quiet' | 'ironic' => {
            if (report.sourceIsSelf) return 'ironic';
            if (report.overkillRatio !== undefined && report.overkillRatio >= 2) return 'brutal';
            return 'quiet';
        };

        // Drive each variant against MournfulGull's authored lines.
        expect(MournfulGull.finalBlowLines![pickFinalBlowVariant({ overkillRatio: 3 })])
            .toMatch(/half-syllable/); // brutal
        expect(MournfulGull.finalBlowLines![pickFinalBlowVariant({ overkillRatio: 1 })])
            .toMatch(/lands once/);    // quiet
        expect(MournfulGull.finalBlowLines![pickFinalBlowVariant({ sourceIsSelf: true })])
            .toMatch(/listener/);      // ironic
    });
});
