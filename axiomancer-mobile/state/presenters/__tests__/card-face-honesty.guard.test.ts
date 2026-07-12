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
            const payload = d.keywords.filter(k => k.name !== 'ENCHANTMENT' && k.name !== 'DISENCHANT');
            if (payload.length === 0) offenders.push(`${id} → no payload keyword chip resolved from its passive`);
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
