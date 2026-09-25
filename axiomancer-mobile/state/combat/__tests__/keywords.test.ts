/**
 * Keyword-registry honesty lints (phase 29, `plan/archive/2026-09-25-trim-t4/plan/phases/phase_29_keyword_registry.md`).
 *
 * Mirrors the "no-strike"/pricing lint shape in
 * `axiomancer-mechanics/src/Cards/e2e/curated-library.engine.test.ts`: a
 * source-string / runtime sweep that turns a known failure mode into a
 * permanent regression gate instead of a one-time fix.
 */
import { describe, expect, it } from '@jest/globals';
import { cardLibrary, CARD_SPECIAL_MECHANIC_KINDS, THEME_KEYWORDS } from '@mechanics';

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
        // Combat-engine verbs the face prints as their own word in the paid
        // summary (GUARD 4, RUPTURE, REAP ALL...), so the badge would double it.
        'guard', 'barrier', 'rupture', 'reap', 'reap_all', 'riposte',
        // Die-gear verbs: the face prints FORGE / KINDLE / PIP / OVERHEAT and
        // the SYSTEM_GLOSSARY explains the dice system behind them.
        'forge_floating_die', 'float_x_die', 'create_temporary_die', 'grant_pip',
        'overheat', 'reroll_spent', 'refresh_die', 'convert_die_color',
        'bank_spent_die', 'spend_all_pips',
        // Card-local one-offs with no repeated vocabulary to register (the
        // atlas's own "≥2 cards or ≥2 enemies" discipline).
        'strip_random_buff', 'befriend_attempt', 'conjure_card', 'peroration',
        // CURDLE demoted 2026-09-05 (/adjust-keywords pass 1): its sole
        // carrier (The Lazar's Kiss) never earned a second, so the badge
        // retires per the atlas's own "one-card mechanic stays as plain
        // rules text" escape hatch. `convert_dots` still functions; it just
        // no longer prints a keyword word.
        'convert_dots',
        // A carrier, not a mechanic: `rider` executes an ordinary card rider.
        'rider',
        // THE BIG NUMBERS REWRITE (2026-09-02) — DEAL is the one verb that
        // needs no explaining: "Deal 24" is plain English, and the face prints
        // the number in its hero slot rather than badging the word (see
        // `MECHANIC_KEYWORD`'s own note, and `mechanicHeadline`'s `deal` case,
        // which returns a keyword-less headline on purpose). Its FAMILY —
        // WRATH, FLAY, TWIN, CHAIN, EXECUTE, OVERKILL — all carry real rows.
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
        // every assertion above pass vacuously.
        expect(CARD_SPECIAL_MECHANIC_KINDS.length).toBeGreaterThan(40);
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
