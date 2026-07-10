/**
 * GUARD — no library card may render the ambiguous PAID fallback.
 *
 * The card face prints its PAID side as `KEYWORD · value`. A card whose driving
 * `specialMechanics` verb (or rider) was never wired into the presenter used to
 * fall through to a contradictory placeholder: keyword "DEBUFF" with the body
 * "buff yourself" (owner report, 2026-07-10 — "Curry's Conversion"). The
 * generic mechanic-led face (`kind: 'mechanic'`) closes that gap.
 *
 * This guard sweeps the ENTIRE live library through the real presenter and
 * fails if any card is still ambiguous — so a new card or a new mechanic kind
 * that lacks a headline can never ship the placeholder again. When it fires,
 * the fix is to add the mechanic to `MECHANIC_KEYWORD` (keywords.ts) +
 * `mechanicHeadline` (combat-encounter.engine.ts), not to silence this test.
 */

import { describe, it, expect } from '@jest/globals';
import { getCard, getCardById, cardLibrary } from '@mechanics';
import { faceStats, detailStats } from '@/state/presenters/combat-encounter.engine';

describe('card-face honesty guard', () => {
    it('no library card renders the ambiguous PAID fallback', () => {
        const offenders: string[] = [];
        for (const { id } of cardLibrary) {
            const card = getCard(id);
            if (!card) continue;
            const f = faceStats(card, getCardById(id));
            const ambiguous =
                f.inert
                || f.keyword === 'DEBUFF'
                || f.heroSub === 'buff yourself'
                || f.heroSub === 'weakens the foe';
            if (ambiguous) {
                const mechs = (getCardById(id)?.specialMechanics ?? []).map(m => m.kind).join(',') || 'none';
                offenders.push(`${id} (verbClass=${card.verbClass}, mechs=${mechs})`);
            }
        }
        expect(offenders).toEqual([]);
    });

    it('every headlined PAID keyword has a glossary definition (the "description above the card")', () => {
        const missing: string[] = [];
        for (const { id } of cardLibrary) {
            const card = getCard(id);
            if (!card) continue;
            const kw = faceStats(card, getCardById(id)).keyword;
            if (!kw) continue; // guard/befriend etc. legitimately headline without a keyword word
            const defs = detailStats(card, getCardById(id)).keywords;
            const hit = defs.find(k => k.name === kw);
            if (!hit || !hit.def) missing.push(`${id} → ${kw}`);
        }
        expect(missing).toEqual([]);
    });
});
