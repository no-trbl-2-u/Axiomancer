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

    it('projects RECOIL (paid) to the recoil keyword with its hp cost', () => {
        const face = projectFace(cardWith([{ kind: 'recoil', hp: 6 }]));
        expect(face.paidKw).toBe('recoil');
        expect(face.paidVal).toBe(6);
    });

    it('projects RECOIL_X to the recoil keyword with its min cost', () => {
        const face = projectFace(cardWith([{ kind: 'recoil_x', min: 4, poisonPerX: 2 }]));
        expect(face.paidKw).toBe('recoil');
        expect(face.paidVal).toBe(4);
    });

    it('projects IMMOLATE to the immolate keyword with its card count', () => {
        const face = projectFace(
            cardWith([{ kind: 'immolate', count: 2, rider: {} }]),
        );
        expect(face.paidKw).toBe('immolate');
        expect(face.paidVal).toBe(2);
    });

    it('projects PURGE_SELF to the purge keyword', () => {
        const face = projectFace(cardWith([{ kind: 'purge_self' }]));
        expect(face.paidKw).toBe('purge');
    });

    it('still falls through to the generic control glyph for the documented residual kinds (rider)', () => {
        // Deliberately unfixed this pass (needs field-by-field dispatch, not a
        // one-line mapping) — asserted so a future fix updates this test
        // instead of silently drifting.
        const face = projectFace(cardWith([{ kind: 'rider', rider: {} }]));
        expect(face.paidKw).toBe('control');
    });
});
