/**
 * Keyword-registry honesty lints (phase 29, `plan/archive/2026-09-25-trim-t4/plan/phases/phase_29_keyword_registry.md`).
 *
 * Mirrors the "no-strike"/pricing lint shape in
 * `axiomancer-mechanics/src/Cards/e2e/curated-library.engine.test.ts`: a
 * source-string / runtime sweep that turns a known failure mode into a
 * permanent regression gate instead of a one-time fix.
 */
import { describe, expect, it } from '@jest/globals';
import { cardLibrary, CARD_SPECIAL_MECHANIC_KINDS } from '@mechanics';

import {
    allRegistryKeywords, keywordForEffect, keywordForMechanic, keywordGloss,
    mechanicKeywordKeys, SYSTEM_GLOSSARY,
} from '@/state/combat/keywords';

describe('keyword registry — KW-1 (no unmapped effect id renders a blank face)', () => {
    it('every effect id any library card applies resolves to a live keyword', () => {
        const unmapped = new Set<string>();
        for (const card of cardLibrary) {
            for (const ce of card.combatEffects ?? []) {
                if (!keywordForEffect(ce.effectId)) unmapped.add(ce.effectId);
            }
        }
        expect([...unmapped].sort()).toEqual([]);
    });
});

describe('keyword registry — KW-3 (no dead references)', () => {
    // KW-2 (the pinned exact registry count) was repealed 2026-09-02
    // (big-numbers overhaul §3 L21, §10) — no count pin survives; the
    // keyword vocabulary is growable.

    /**
     * Kinds that deliberately carry NO `MECHANIC_KEYWORD` row (phase 68).
     *
     * A kind earns a row when the card FACE badges it as a keyword. These
     * speak through the printed paid/free lines instead, so mapping them
     * would badge text the face already says. Grouped by why.
     *
     * This list is half of the KW-2 gate: the union is walked in full, so a
     * NEW mechanic kind fails the test until it is either mapped to a glossed
     * keyword or added here with its reason. That is the drift the
     * content-pipelines audit (2026-08-22) found open — the old KW-2 walked a
     * hardcoded 17 while `MECHANIC_KEYWORD` already held 22.
     */
    const KINDS_WITHOUT_MECHANIC_KEYWORD: readonly string[] = [
        // GUARD prints as its own word in the paid summary (GUARD 4), so the
        // badge would double it.
        'guard',
        // DEAL is the one verb that needs no explaining: "Deal 24" is plain
        // English, and the face prints the number in its hero slot rather than
        // badging the word (see `MECHANIC_KEYWORD`'s own note, and
        // `mechanicHeadline`'s `deal` case, which returns a keyword-less
        // headline on purpose).
        'deal',
    ];

    it('every mechanic kind either maps to a glossed keyword or is classified', () => {
        const unresolved: string[] = [];
        const classified = new Set(KINDS_WITHOUT_MECHANIC_KEYWORD);
        for (const kind of CARD_SPECIAL_MECHANIC_KINDS) {
            if (classified.has(kind)) continue;
            const kw = keywordForMechanic(kind);
            if (!kw || !keywordGloss(kw)) unresolved.push(`${kind} → ${kw}`);
        }
        expect(unresolved).toEqual([]);
    });

    it('the classification list holds no kind that left the union', () => {
        const live = new Set<string>(CARD_SPECIAL_MECHANIC_KINDS);
        expect(KINDS_WITHOUT_MECHANIC_KEYWORD.filter((k) => !live.has(k))).toEqual([]);
    });

    it('no mechanic mapping points at a kind the engine does not have', () => {
        // The reverse drift: a keyword row outliving the kind it described.
        const live = new Set<string>(CARD_SPECIAL_MECHANIC_KINDS);
        expect(mechanicKeywordKeys().filter((k) => !live.has(k))).toEqual([]);
    });

    it('the union is walked, not a copy of it', () => {
        // Guards the gate itself: an empty or truncated enumeration would make
        // every assertion above pass vacuously. Revamp R7a (D50) cut the union
        // to the verbs a live card prints.
        expect([...CARD_SPECIAL_MECHANIC_KINDS].sort()).toEqual(['deal', 'guard']);
    });

    it('the 2026-09-28 purge removed PIERCE, RIPOSTE and FORETELL from the glossary', () => {
        // T, 2026-09-28: purge the remaining unused keywords. None of the three
        // had a live carrier; their engine mechanics stay (the P1 brief's rule).
        const stillPresent = ['Pierce', 'Riposte', 'Foretell'].filter((k) => keywordGloss(k) !== null);
        expect(stillPresent).toEqual([]);
        expect(keywordForMechanic('foretell')).toBeNull();
        expect(keywordForEffect('buff_accuracy_up')).toBeNull();
    });

    it('retired keywords (BARRIER, CONJURE, PERORATION, TRANSMUTE, REPRISE) are gone', () => {
        // FESTER left this list on 2026-08-08: the Profane Canon promoted it
        // back to a printed keyword (gangrene-gospel, The Untended Garden), so
        // it needs a gloss again.
        const stillPresent = ['Barrier', 'Conjure', 'Peroration', 'Transmute', 'Reprise']
            .filter(retired => keywordGloss(retired) !== null);
        expect(stillPresent).toEqual([]);
    });
});

describe('keyword registry — terse glosses (owner directive 2026-07-12)', () => {
    // The Dawncaster register: ONE short sentence per gloss ("Cards with
    // Lifedrain restore health equal to the damage they deal."), with a second
    // short one only where a rule genuinely needs it. This lint pins the cut —
    // a third sentence or a prose wall is a regression, not a style choice.
    const sentenceCount = (s: string) => s.split(/[.!?](?:\s+|$)/).filter(t => t.trim().length > 0).length;

    it('every keyword gloss is at most two short sentences', () => {
        const offenders: string[] = [];
        for (const kw of allRegistryKeywords()) {
            const gloss = keywordGloss(kw) ?? '';
            if (sentenceCount(gloss) > 2 || gloss.length > 190) {
                offenders.push(`${kw}: ${sentenceCount(gloss)} sentences / ${gloss.length} chars`);
            }
        }
        expect(offenders).toEqual([]);
    });

    it('every systems-glossary def is at most two short sentences', () => {
        const offenders: string[] = [];
        for (const { term, def } of SYSTEM_GLOSSARY) {
            if (sentenceCount(def) > 2 || def.length > 160) {
                offenders.push(`${term}: ${sentenceCount(def)} sentences / ${def.length} chars`);
            }
        }
        expect(offenders).toEqual([]);
    });
});

describe('keyword registry — card-text grammar (phase 40, 2026-08-23)', () => {
    // The templating grammar adopted for the card-text copy pass bans the em
    // dash and the semicolon from every authored player-facing string: a
    // clause break is a new sentence, a trigger/consequence label is a colon.
    // Mirrors the mechanics-side lint in
    // `paid-summary-honesty.engine.test.ts` — this is the mobile half of the
    // "add an em-dash/semicolon lint" requirement.
    it('no keyword gloss carries an em dash or a semicolon', () => {
        const offenders: string[] = [];
        for (const kw of allRegistryKeywords()) {
            const gloss = keywordGloss(kw) ?? '';
            if (gloss.includes('—')) offenders.push(`${kw} → em dash`);
            if (gloss.includes(';')) offenders.push(`${kw} → semicolon`);
        }
        expect(offenders).toEqual([]);
    });

    it('no systems-glossary def carries an em dash or a semicolon', () => {
        const offenders: string[] = [];
        for (const { term, def } of SYSTEM_GLOSSARY) {
            if (def.includes('—')) offenders.push(`${term} → em dash`);
            if (def.includes(';')) offenders.push(`${term} → semicolon`);
        }
        expect(offenders).toEqual([]);
    });

    it('no keyword gloss or systems-glossary def says "the enemy" (fixed vocabulary: "the foe")', () => {
        const offenders: string[] = [];
        for (const kw of allRegistryKeywords()) {
            if (/\benemy\b/i.test(keywordGloss(kw) ?? '')) offenders.push(`gloss:${kw}`);
        }
        for (const { term, def } of SYSTEM_GLOSSARY) {
            if (/\benemy\b/i.test(def)) offenders.push(`system:${term}`);
        }
        expect(offenders).toEqual([]);
    });
});
