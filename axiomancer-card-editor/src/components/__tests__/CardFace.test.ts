/**
 * `projectFace`'s `specialMechanics[0]` → keyword-glyph mapping.
 *
 * Regression for the gap `/adjust-keywords` pass 5 (2026-09-10) found: five
 * `CardSpecialMechanic` kinds (`deal`, `recoil`, `recoil_x`, `immolate`,
 * `purge_self`) had no case in `primaryKeyword`'s switch, so any card whose
 * FIRST special mechanic was one of them fell through to the generic
 * CONTROL clock glyph with no value — silently, because the switch's
 * `default:` arm swallows an unmatched kind rather than failing loud.
 * `deal` alone was `specialMechanics[0]` on 50/128 live cards (39% of the
 * library, verified via a throwaway script over the real `cardLibrary`
 * during the pass) — every DEAL-led card in the editor's own CREATE/EDIT
 * preview showed the wrong glyph and no printed amount.
 *
 * This only covers the PROJECTION (`glyphKw`/`paidKw`), not the printed
 * sentence: `paidSentence` in `CardFace.tsx` always composes its prose
 * through the real engine (`toCombatCard`), so the bug was glyph-only, never
 * a wrong-number bug — `paid-summary-honesty.engine.test.ts` (mechanics)
 * would not have caught it.
 */
import { describe, expect, it } from 'vitest';

import { blankCard } from '../../types';
import { projectFace } from '../CardFace';

const cardWith = (specialMechanics: ReturnType<typeof blankCard>['specialMechanics']) => ({
    ...blankCard(),
    id: 'test-card',
    name: 'Test Card',
    specialMechanics,
});

describe('projectFace — specialMechanics[0] keyword projection', () => {
    it('projects DEAL to the damage keyword with its amount', () => {
        const face = projectFace(cardWith([{ kind: 'deal', amount: 12, hits: 1 }]));
        expect(face.glyphKw).toBe('damage');
        expect(face.paidKw).toBe('damage');
        expect(face.paidVal).toBe(12);
    });

    it('projects the audit-retired kinds (RECOIL, RECOIL_X, IMMOLATE, PURGE_SELF) to the generic control glyph', () => {
        // The keyword audit (2026-09-27, after the card purge) removed the
        // recoil / immolate / purge display rows with the cards that printed
        // them. The kinds stay in the engine union, so they must still project
        // to a live keyword rather than an id the vocabulary no longer has.
        const kinds = [
            { kind: 'recoil', hp: 6 },
            { kind: 'recoil_x', min: 4, poisonPerX: 2 },
            { kind: 'immolate', count: 2, rider: {} },
            { kind: 'purge_self' },
        ] as ReturnType<typeof blankCard>['specialMechanics'];
        for (const sm of kinds) {
            const face = projectFace(cardWith([sm]));
            expect(face.paidKw, sm.kind).toBe('control');
            expect(face.paidVal, sm.kind).toBe(0);
        }
    });

    it('projects BARRIER to the guard keyword (BARRIER merged into GUARD)', () => {
        const face = projectFace(cardWith([{ kind: 'barrier', amount: 7 }]));
        expect(face.paidKw).toBe('guard');
        expect(face.paidVal).toBe(7);
    });

    it("projects A Plain Word's VULNERABLE (paid and free) to the vulnerable keyword", () => {
        // S3 (D43): debuff_vulnerable is a `stat` debuff, which used to read as
        // soft CONTROL on the editor face.
        const face = projectFace({
            ...cardWith([]),
            combatEffects: [{ effectId: 'debuff_vulnerable', appliedTo: 'opponent', intensity: 25, duration: 2 }],
            free: { applyEffect: { effectId: 'debuff_vulnerable', intensity: 10, duration: 1 } },
        });
        expect(face.paidKw).toBe('vulnerable');
        expect(face.paidVal).toBe(25);
        expect(face.freeKw).toBe('vulnerable');
        expect(face.freeVal).toBe(10);
    });

    it('still falls through to the generic control glyph for the documented residual kinds (rider)', () => {
        // Deliberately unfixed this pass (needs field-by-field dispatch, not a
        // one-line mapping) — asserted so a future fix updates this test
        // instead of silently drifting.
        const face = projectFace(cardWith([{ kind: 'rider', rider: {} }]));
        expect(face.paidKw).toBe('control');
    });
});
