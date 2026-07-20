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
import { getCard, getCardById, cardLibrary, lookupEffect } from '@mechanics';
import { faceStats, detailStats } from '@/state/presenters/combat-encounter.engine';
import { keywordsInPersistentText, keywordForEffect, keywordGloss, SYSTEM_GLOSSARY } from '@/state/combat/keywords';
import { CARD_ART_FILE_BY_ID } from '@/assets/images/cards';
import { CARD_GLYPH_FILE_BY_KEY } from '@/assets/images/cards/glyphs';

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

    it("no persistent card lies about its FREE line — 'PAID only' is dead (spec 32 v4)", () => {
        // The engine prints BOTH lines on enchant/disenchant cards: the FREE
        // play is a TIMED instance ('FREE (3 rounds) — <passive>'), the PAID
        // play is permanent. A presenter surface that claims 'PAID only' (the
        // 2026-07-11 playtest report) or drops the timed truth is the lie this
        // guard exists to catch. It also enforces the chip doctrine: the
        // keyword-explainer slot must resolve at least one PAYLOAD keyword
        // beyond the card-type label (via combatEffects or the persistentEffect
        // summary — KW-5 guarantees the words are there to find).
        const offenders: string[] = [];
        for (const { id } of cardLibrary) {
            const card = getCard(id);
            if (!card || (card.cardType !== 'enchantment' && card.cardType !== 'disenchant')) continue;
            const f = faceStats(card, getCardById(id));
            const d = detailStats(card, getCardById(id));
            const surfaces = [f.freeHeroText, f.freeValue ?? '', d.freeLine, d.freePill, d.outcomeLine, d.readNote];
            if (surfaces.some(s => /paid only/i.test(s))) offenders.push(`${id} → still claims 'PAID only'`);
            const rounds = card.topActionText.match(/^FREE \((\d+ rounds?)\)/)?.[1];
            if (!rounds || !f.freeHeroText.includes(rounds) || f.freeValue !== rounds) {
                offenders.push(`${id} → FREE surface missing the engine's timed '${rounds ?? '(n rounds)'}' truth`);
            }
            // 2026-07-12 (owner directive, REVERSING the earlier type-chip-first
            // order) — the inspect panel is PAYLOAD keywords ONLY: the type
            // already reads on the frame's type strip, so a type chip in the
            // panel is the regression this guard now blocks.
            const typeChips = d.keywords.filter(k => k.name === 'ENCHANTMENT' || k.name === 'DISENCHANT');
            if (typeChips.length > 0) offenders.push(`${id} → type chip '${typeChips[0].name}' rendered in the keyword panel`);
            const payload = d.keywords.filter(k => k.name !== 'ENCHANTMENT' && k.name !== 'DISENCHANT');
            if (payload.length === 0) offenders.push(`${id} → no payload keyword chip resolved from its passive`);
            // The face's verb slot must lead with a PAYLOAD keyword (what the
            // card DOES), never the bare type word, whenever a payload resolves.
            if (payload.length > 0 && (f.keyword === 'ENCHANTMENT' || f.keyword === 'DISENCHANT')) {
                offenders.push(`${id} → verb slot shows the bare type word despite payload '${payload[0].name}'`);
            }
        }
        expect(offenders).toEqual([]);
    });

    it('every explainer term renders at most once per overlay (no dump, no double-gloss)', () => {
        // 2026-07-12 (owner playtest) — the inspect overlay may explain each
        // term at most once: keyword chips are deduped, and the per-card
        // systems slice may not restate a chip (e.g. FLOATING beside FORGE) or
        // repeat a term. Also pins the dump eviction: a card whose printed
        // lines reference no system token gets NO systems entries at all.
        const offenders: string[] = [];
        for (const { id } of cardLibrary) {
            const card = getCard(id);
            if (!card) continue;
            const d = detailStats(card, getCardById(id));
            const names = [...d.keywords.map(k => k.name), ...d.systemTerms.map(s => s.term)];
            const seen = new Set<string>();
            for (const n of names) {
                if (seen.has(n)) offenders.push(`${id} → '${n}' explained twice`);
                seen.add(n);
            }
            // 2026-07-12 (card-wording audit) — the presenter scans the printed
            // lines PLUS the overlay's own free/stacks lines (INTENSITY/FREE
            // live there); this reference check mirrors that scan basis.
            const printed = [card.topActionText, card.bottomActionText, ...(card.dieLines ?? []), d.freeLine, d.stacksText ?? ''].join(' ');
            if (d.systemTerms.length === SYSTEM_GLOSSARY.length) offenders.push(`${id} → full systems dump rendered`);
            if (d.systemTerms.length > 0 && !/conviction|⬡|resonance|reserve|pip|floating|rung|wild|X die|peroration|concede|free|intensit|×\d|\bi\d\b/i.test(printed)) {
                offenders.push(`${id} → systems entries without any printed reference`);
            }
        }
        expect(offenders).toEqual([]);
    });

    it('WI-2 — every event-triggered DoT face names its trigger, never the round-clock lifetime', () => {
        // Post trigger-migration, poison ticks per card-played and bleed per
        // damage-instance — passive round-clock play deals literally 0. A face
        // that still prints "◆ POISON 10 over 4t" is the exact lie that shipped
        // the migration half-done (the old guard checked keyword glosses, not
        // the math line). This sweep fails any event DoT whose face still prints
        // a round-clock lifetime OR fails to name its real trigger.
        const offenders: string[] = [];
        for (const { id } of cardLibrary) {
            const card = getCard(id);
            const src = getCardById(id);
            if (!card || !src) continue;
            const f = faceStats(card, src);
            if (f.kind !== 'dot') continue;
            const dotCe = (src.combatEffects ?? []).find(
                ce => ce.appliedTo === 'opponent'
                    && (lookupEffect(ce.effectId)?.payload as { damageOverTime?: unknown } | undefined)?.damageOverTime,
            );
            const trigger = dotCe
                ? (lookupEffect(dotCe.effectId)?.payload as { damageOverTime?: { trigger?: string } } | undefined)?.damageOverTime?.trigger
                : undefined;
            const isEvent = trigger === 'card-played' || trigger === 'damage-instance' || trigger === 'payoff';
            if (!isEvent) continue;

            const d = detailStats(card, src);
            const faceText = `${f.heroText} ${f.heroSub ?? ''} ${f.verbLine}`;
            // 1. No round-clock "over Nt / over N turns" lifetime on the face.
            if (/over\s+\d+\s*(t\b|turns?)/i.test(faceText)) {
                offenders.push(`${id} face still prints round-clock 'over Nt' (trigger=${trigger})`);
            }
            // 2. The detail table must not headline a round-clock TOTAL/TURNS.
            const detailLabels = d.outcomeStats.map(s => s.label);
            if (detailLabels.includes('TOTAL') || detailLabels.includes('TURNS') || /over\s+\d+\s+turns/i.test(d.outcomeLine)) {
                offenders.push(`${id} detail still headlines round-clock TOTAL/TURNS (trigger=${trigger})`);
            }
            // 3. The face DOES name the real trigger.
            if (!/each card you play|each time it is struck|each payoff|per card|per hit|per payoff/i.test(faceText)) {
                offenders.push(`${id} face does not name the '${trigger}' trigger`);
            }
            // 4. HP→VITAE: no stray 'HP' copy on the DoT face.
            if (/\bHP\b/.test(faceText)) offenders.push(`${id} face still says HP (use VITAE)`);
        }
        expect(offenders).toEqual([]);
    });

    it('P2 HP→VITAE sweep — no card face or detail string says "HP" (player-facing term is VITAE)', () => {
        const offenders: string[] = [];
        const hp = /\bHP\b/;
        for (const { id } of cardLibrary) {
            const card = getCard(id);
            const src = getCardById(id);
            if (!card || !src) continue;
            const f = faceStats(card, src);
            const d = detailStats(card, src);
            const faceStrings = [f.heroText, f.heroSub ?? '', f.verbLine, f.powerRail, f.freeHeroText];
            const detailStrings = [
                d.subtitle, d.outcomeLine, d.powerLine, d.readNote, d.mathLine, d.freeLine,
                ...d.outcomeStats.map(s => `${s.label} ${s.value}`),
            ];
            for (const s of [...faceStrings, ...detailStrings]) {
                if (hp.test(s)) { offenders.push(`${id}: "${s}"`); break; }
            }
        }
        expect(offenders).toEqual([]);
    });

    it('every keyword/effect a card prints has a popup (keyword chip or system entry) — nothing unexplained', () => {
        // 2026-07-12 (owner directive): the inspect overlay is the popup layer.
        // Every UPPERCASE registry word on the printed lines must render a
        // keyword chip WITH a gloss; every authored status effect must resolve
        // its keyword chip; the card-local Peroration words (PERORATION /
        // CONCEDE) must surface their system-glossary entry.
        const offenders: string[] = [];
        for (const { id } of cardLibrary) {
            const card = getCard(id);
            const src = getCardById(id);
            if (!card || !src) continue;
            const d = detailStats(card, src);
            const chips = new Set(d.keywords.filter(k => k.def).map(k => k.name));
            const sys = new Set(d.systemTerms.map(s => s.term));
            const printed = [card.topActionText, card.bottomActionText, ...(card.dieLines ?? [])].join(' ');
            for (const kw of keywordsInPersistentText(printed)) {
                if (!chips.has(kw.toUpperCase())) offenders.push(`${id} → prints ${kw.toUpperCase()} but renders no defined chip`);
            }
            for (const ce of src.combatEffects ?? []) {
                const kw = keywordForEffect(ce.effectId);
                if (kw && !chips.has(kw.toUpperCase())) offenders.push(`${id} → applies ${ce.effectId} but renders no ${kw.toUpperCase()} chip`);
            }
            if (/\bPERORATION\b/.test(printed) && !sys.has('PERORATION')) offenders.push(`${id} → prints PERORATION with no popup`);
            if (/\bCONCEDE\b/.test(printed) && !sys.has('CONCEDE')) offenders.push(`${id} → prints CONCEDE with no popup`);
        }
        expect(offenders).toEqual([]);
    });

    it('every live card has its own main icon', () => {
        const files = cardLibrary.map(({ id }) => CARD_ART_FILE_BY_ID[id]);
        expect(files.filter(Boolean)).toHaveLength(cardLibrary.length);
        expect(new Set(files).size).toBe(cardLibrary.length);
    });

    it('every FREE effect draws its supplied keyword icon — no text-rune fallback on a live card', () => {
        // The giant top-left glyph must be the SHAPE of the effect it causes
        // (flame=burn, flask=poison, crosshair=mark, …). A card whose free
        // rider resolves no shape falls back to an abstract text rune — the
        // exact "generic concentric circles" read this guard exists to block.
        // When it fires, select one supplied source icon for the keyword and
        // add it to the card-glyph registry.
        const offenders: string[] = [];
        for (const { id } of cardLibrary) {
            const card = getCard(id);
            const src = getCardById(id);
            if (!card || !src) continue;
            const f = faceStats(card, src);
            if (!f.freeGlyph) continue; // no free line → no glyph at all
            if (!f.freeGlyphKey || !CARD_GLYPH_FILE_BY_KEY[f.freeGlyphKey]) {
                offenders.push(`${id} → freeGlyphKey=${f.freeGlyphKey ?? 'null'} (text rune '${f.freeGlyph}')`);
            }
        }
        expect(offenders).toEqual([]);
    });

    it('spec 33 die-gear keywords (SPECIAL/HONE/TEMPER) resolve a gloss — a gear card can never fall through', () => {
        // D4 (spec 33 §6, 2026-07-17): the blacksmith/die-gear vocabulary is
        // registered ahead of its card carriers (die gear + blacksmith land in
        // D5). Pinning the glosses here means the first card face that prints
        // SPECIAL, HONE, or TEMPER resolves a keyword chip instead of the
        // ambiguous PAID fallback the rest of this file guards against.
        const missing = ['Special', 'Hone', 'Temper'].filter(kw => !keywordGloss(kw));
        expect(missing).toEqual([]);
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
