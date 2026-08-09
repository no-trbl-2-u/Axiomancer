/**
 * Keyword-registry honesty lints (phase 29, `plan/phases/phase_29_keyword_registry.md`).
 *
 * Mirrors the "no-strike"/pricing lint shape in
 * `axiomancer-mechanics/src/Cards/e2e/curated-library.engine.test.ts`: a
 * source-string / runtime sweep that turns a known failure mode into a
 * permanent regression gate instead of a one-time fix.
 */
import { describe, expect, it } from '@jest/globals';
import { cardLibrary, THEME_KEYWORDS } from '@mechanics';

import {
    allRegistryKeywords, keywordForEffect, keywordForMechanic, keywordGloss,
    SYSTEM_GLOSSARY,
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

describe('keyword registry — KW-2/KW-3 (count pinned, no dead references)', () => {
    it('the glossary holds exactly 42 entries (37 + the five profane-canon words)', () => {
        // Pins the count so a future add/retire is a deliberate, visible diff —
        // see the module doc in keywords.ts for the phase-29 ledger. The 33rd
        // entry is DOOM (WS3.4): a ratified CARD-LOCAL species gloss, not a
        // registry row — it still needs a glossary definition for its face.
        // The 34th is MILL (card-wording audit 2026-07-12): printed on three
        // echo cards with no gloss anywhere — three carriers clears the bar.
        // 35-37 are BOON / HONE / TEMPER (spec 33 §6, D4 2026-07-17): the
        // die-gear face payload + the two blacksmith upgrade verbs.
        // 38-42 are the Profane Canon's rework vocabulary (2026-08-08):
        // FESTER, REPLAY, REQUIEM, IMMOLATE, PURGE.
        expect(allRegistryKeywords().length).toBe(42);
    });

    it('every mechanic-kind mapping resolves to a glossed keyword', () => {
        const kinds = [
            'stagger', 'lock_stance', 'foretell', 'omen', 'premise', 'spend_premises',
            'recoil', 'soul_gain', 'consume_affliction', 'siphon', 'sway', 'echo',
            'echo_next_spell', 'reprise', 'extend_dots', 'convert_dots', 'boost_all_dots',
        ];
        const unresolved: string[] = [];
        for (const kind of kinds) {
            const kw = keywordForMechanic(kind);
            if (!kw || !keywordGloss(kw)) unresolved.push(`${kind} → ${kw}`);
        }
        expect(unresolved).toEqual([]);
    });

    it('retired keywords (BARRIER, CONJURE, SENTENCE, TRANSMUTE, REPRISE) are gone', () => {
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

describe('keyword registry — KW-6 (card-themes.ts family parity)', () => {
    it('every keyword a theme family claims resolves in the mobile glossary', () => {
        const broken: string[] = [];
        for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
            for (const kw of keywords) {
                // THEME_KEYWORDS is upper-case; the glossary is Title-Case.
                const titleCase = kw.charAt(0) + kw.slice(1).toLowerCase();
                if (!keywordGloss(titleCase)) broken.push(`${theme}: ${kw}`);
            }
        }
        expect(broken).toEqual([]);
    });
});

describe('keyword registry — KW-5 (persistent-card keyword reach)', () => {
    it('every enchantment/disenchant persistentEffect names a live registry keyword in caps', () => {
        const registry = allRegistryKeywords();
        const silent: string[] = [];
        for (const card of cardLibrary.filter(c => c.cardType !== 'spell')) {
            const text = card.persistentEffect ?? '';
            const hit = registry.some(kw => text.includes(kw.toUpperCase()));
            if (!hit) silent.push(card.id);
        }
        expect(silent).toEqual([]);
    });
});
