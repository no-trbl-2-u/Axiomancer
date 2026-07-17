/**
 * GUARD — authored PAID summaries stay honest (2026-07-16, SIDE RAIL follow-up).
 *
 * A spell may carry an authored `paidSummary`: human prose that REPLACES the
 * generated telegraphese on the card face. The P0-truth law does not bend for
 * prose, so every authored summary is pinned to its card's real payload:
 *
 *   1. NUMBER PARITY — every number the generated `paidText` prints (the
 *      engine-applied units) must appear verbatim in the authored text. A
 *      summary that rounds, drops, or invents a number is a lie on the face.
 *   2. KEYWORD DISCIPLINE — every UPPERCASE run in the authored text must be
 *      a registry keyword (or a whitelisted structural word). The mobile
 *      keyword scanner turns printed UPPERCASE runs into glossary chips; an
 *      unknown word would render an undefined chip or bold garbage.
 *   3. BUDGET — ≤ 200 characters (≈5 lines on the large face; the 5-line cap
 *      is reserved for genuinely complex effects), ends in terminal
 *      punctuation (the face appends "Costs 1 die." after it), and never
 *      restates the "PAID —" scaffold.
 *   4. SPELLS ONLY — enchant/disenchant prose lives in `persistentEffect`;
 *      a persistent card carrying `paidSummary` is a wiring mistake.
 *
 * When this guard fires, fix the summary (or the payload), never the guard.
 */

import { describe, expect, it } from 'vitest';
import { cardLibrary } from '../../Cards/cards.library';
import { lookupEffect } from '../../Effects';
import { paidText } from '../combat.cards';

/** The spec 32 §3 keyword registry (mirrors the mobile KEYWORD_GLOSS keys)
 *  plus the structural words a paid sentence may legitimately print in caps. */
const KNOWN_UPPER = new Set([
    // registry keywords
    'DRAW', 'FORGE', 'GUARD', 'TICK', 'MARK', 'CLEANSE', 'HEAL', 'RUPTURE',
    'SIPHON', 'PROLONG', 'REARGUE', 'POISON', 'BLEED', 'DOOM', 'PREMISE',
    'PREMISES', 'KINDLE', 'PIP', 'PIPS', 'RECOIL', 'FALLEN', 'STAGGER',
    'BACKFIRE', 'FORETELL', 'OMEN', 'SOUL', 'SOULS', 'REAP', 'SWAY',
    'RAPPORT', 'THORNS', 'RIPOSTE', 'ECHO', 'RECALL', 'MILL',
    // structural / system words the faces already print in caps
    'FREE', 'ALL', 'WILD', 'VITAE', 'CONCEDE', 'PERORATION', 'OPENING',
    'DOT', 'DOTS', 'HP',
]);

const summaried = cardLibrary.filter(c => c.paidSummary !== undefined);

describe('authored paidSummary honesty', () => {
    it('only spells carry an authored paidSummary', () => {
        const offenders = summaried
            .filter(c => c.cardType !== 'spell')
            .map(c => `${c.id} (${c.cardType})`);
        expect(offenders).toEqual([]);
    });

    it('every number the engine applies appears verbatim in the authored text', () => {
        const offenders: string[] = [];
        for (const card of summaried) {
            const generated = paidText(card, lookupEffect);
            const applied = [...new Set(generated.match(/\d+(?:\.\d+)?/g) ?? [])];
            const missing = applied.filter(n => !(card.paidSummary as string).includes(n));
            if (missing.length) {
                offenders.push(`${card.id} → missing [${missing.join(', ')}] (engine: "${generated}")`);
            }
        }
        expect(offenders).toEqual([]);
    });

    it('every UPPERCASE run is a registry keyword or structural word', () => {
        const offenders: string[] = [];
        for (const card of summaried) {
            const runs = (card.paidSummary as string).match(/[A-Z]{2,}/g) ?? [];
            const unknown = [...new Set(runs.filter(r => !KNOWN_UPPER.has(r)))];
            if (unknown.length) offenders.push(`${card.id} → unknown caps [${unknown.join(', ')}]`);
        }
        expect(offenders).toEqual([]);
    });

    it('stays inside the face budget and carries its own terminal punctuation', () => {
        const offenders: string[] = [];
        for (const card of summaried) {
            const s = card.paidSummary as string;
            if (s.length > 200) offenders.push(`${card.id} → ${s.length} chars (max 200)`);
            if (!/[.!?]$/.test(s.trim())) offenders.push(`${card.id} → no terminal punctuation`);
            if (/^\s*PAID\b/i.test(s)) offenders.push(`${card.id} → restates the PAID scaffold`);
        }
        expect(offenders).toEqual([]);
    });
});
