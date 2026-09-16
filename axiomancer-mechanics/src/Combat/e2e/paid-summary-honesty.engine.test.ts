/**
 * GUARD — authored PAID summaries stay honest (2026-07-16, SIDE RAIL follow-up).
 *
 * A spell may carry an authored `paidSummary`: human prose that REPLACES the
 * generated telegraphese on the card face. Two bug detectors survive the
 * 2026-09-02 repeal (big-numbers overhaul §3 L22, §10) — the ≤130-char
 * budget, the em-dash/semicolon ban, the terminal-punctuation rule, and the
 * "the foe" not "the enemy" rule were style clauses (a law, not a bug
 * detector) and are deleted:
 *
 *   1. NUMBER PARITY — every number the generated `paidText` prints (the
 *      engine-applied units) must appear verbatim in the authored text. A
 *      summary that rounds, drops, or invents a number is a lie on the face.
 *   2. KEYWORD DISCIPLINE — every UPPERCASE run in the authored text must be
 *      a registry keyword (or a whitelisted structural word). The mobile
 *      keyword scanner turns printed UPPERCASE runs into glossary chips; an
 *      unknown word would render an undefined chip or bold garbage.
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
    // THE BIG NUMBERS REWRITE (2026-09-02) — direct damage and its family,
    // plus the turn-shape conditions promoted to face terms.
    'DEAL', 'PIERCE', 'WRATH', 'FLAY', 'TWIN', 'CHAIN', 'EXECUTE', 'OVERKILL',
    'AMBUSH', 'FLOW', 'FINALE', 'BARRIER', 'TOLL',
    // `/adjust-keywords` pass 11 — EVENTIDE, the Chaos-family parity drill.
    'EVENTIDE',
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
            // DOOM's generated text carries an explanatory parenthetical
            // ("grows +1 each time the foe acts") whose 1 is a RULE, not a
            // number this card applies — strip it before extracting, or every
            // DOOM carrier is forced to print a meaningless 1 on its face.
            const generated = paidText(card, lookupEffect)
                .replace(/\(grows \+1 each time the foe acts\)/g, '');
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

    it('phase 40 — no card face prints a raw decimal (every printed number is a whole unit)', () => {
        const offenders: string[] = [];
        for (const card of [...summaried, ...passived]) {
            const s = (card.paidSummary ?? card.persistentEffect) as string;
            if (/\d+\.\d+/.test(s)) offenders.push(card.id);
        }
        expect(offenders).toEqual([]);
    });
});
