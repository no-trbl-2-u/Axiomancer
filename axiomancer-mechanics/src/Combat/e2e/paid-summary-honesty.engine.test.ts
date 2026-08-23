/**
 * GUARD — authored PAID summaries stay honest (2026-07-16, SIDE RAIL follow-up;
 * tightened to the card-text grammar's 130-char cap + punctuation ban, phase 40
 * 2026-08-23).
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
 *   3. BUDGET — ≤ 130 characters (the card-text grammar's hard cap — tightened
 *      down from 200 by phase 40 now that the sentence lives on the INSPECT
 *      OVERLAY, not the glance face, per #193's face/overlay split; still a
 *      single dense read, not a paragraph), ends in terminal punctuation (the
 *      face appends "Costs 1 die." after it), and never restates the
 *      "PAID —" scaffold.
 *   4. GRAMMAR — no em dash (—) and no semicolon (;) anywhere in the authored
 *      text (phase 40's templating grammar): a clause break is a new sentence
 *      (". "), a trigger/consequence label is a colon, and a parenthetical
 *      carries the honesty-required trigger/clock note. "The enemy" is
 *      retired in favor of "the foe" (the fixed player-facing noun).
 *   5. SPELLS ONLY — enchant/disenchant prose lives in `persistentEffect`;
 *      a persistent card carrying `paidSummary` is a wiring mistake.
 *
 * `persistentEffect` (oath/hex passives) is prose on the same overlay and
 * carries the same grammar ban (no em dash / semicolon, "the foe" not "the
 * enemy") — checked below alongside `paidSummary`, though it has no fixed
 * char budget (a trigger + payoff clause legitimately runs longer than a
 * spell's single payoff).
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
    'SIPHON', 'PROLONG', 'CURDLE', 'POISON', 'BLEED', 'DOOM', 'CHARGE',
    'CHARGES', 'KINDLE', 'PIP', 'PIPS', 'RECOIL', 'FALLEN', 'STAGGER',
    'BACKFIRE', 'FORETELL', 'OMEN', 'SOUL', 'SOULS', 'REAP', 'PLEA',
    'QUARTER', 'THORNS', 'RIPOSTE', 'ECHO', 'RECALL', 'MILL',
    // profane canon (2026-08-08) — the rework's new vocabulary
    'REPLAY', 'REQUIEM', 'FESTER', 'IMMOLATE', 'PURGE',
    // structural / system words the faces already print in caps
    'FREE', 'ALL', 'WILD', 'VITAE', 'CONDEMN', 'SENTENCE', 'OPENING',
    'DOT', 'DOTS', 'HP',
]);

const summaried = cardLibrary.filter(c => c.paidSummary !== undefined);
const passived = cardLibrary.filter(c => c.persistentEffect !== undefined);

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
            if (s.length > 130) offenders.push(`${card.id} → ${s.length} chars (max 130)`);
            if (!/[.!?]$/.test(s.trim())) offenders.push(`${card.id} → no terminal punctuation`);
            if (/^\s*PAID\b/i.test(s)) offenders.push(`${card.id} → restates the PAID scaffold`);
        }
        expect(offenders).toEqual([]);
    });

    it('phase 40 — no authored paidSummary carries an em dash or a semicolon', () => {
        const offenders: string[] = [];
        for (const card of summaried) {
            const s = card.paidSummary as string;
            if (s.includes('—')) offenders.push(`${card.id} → em dash`);
            if (s.includes(';')) offenders.push(`${card.id} → semicolon`);
        }
        expect(offenders).toEqual([]);
    });

    it('phase 40 — no authored paidSummary says "the enemy" (fixed vocabulary: "the foe")', () => {
        const offenders = summaried
            .filter(c => /\benemy\b/i.test(c.paidSummary as string))
            .map(c => c.id);
        expect(offenders).toEqual([]);
    });

    it('phase 40 — no card face prints a raw decimal (every printed number is a whole unit)', () => {
        const offenders: string[] = [];
        for (const card of [...summaried, ...passived]) {
            const s = (card.paidSummary ?? card.persistentEffect) as string;
            if (/\d+\.\d+/.test(s)) offenders.push(card.id);
        }
        expect(offenders).toEqual([]);
    });
});

describe('authored persistentEffect (oath/hex passive) grammar', () => {
    it('no persistentEffect carries an em dash or a semicolon', () => {
        const offenders: string[] = [];
        for (const card of passived) {
            const s = card.persistentEffect as string;
            if (s.includes('—')) offenders.push(`${card.id} → em dash`);
            if (s.includes(';')) offenders.push(`${card.id} → semicolon`);
        }
        expect(offenders).toEqual([]);
    });

    it('no persistentEffect says "the enemy" (fixed vocabulary: "the foe")', () => {
        const offenders = passived
            .filter(c => /\benemy\b/i.test(c.persistentEffect as string))
            .map(c => c.id);
        expect(offenders).toEqual([]);
    });
});
