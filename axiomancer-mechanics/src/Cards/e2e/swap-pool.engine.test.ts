/**
 * Swap-pool witness — the ten per-theme `/deck-tuning` candidate sets
 * (`swap-<theme>`, 30 sandbox spells each; owner-ratified fan-out 2026-07-18).
 *
 * These sets are measurement-seat candidates for the preset recipe — never
 * player-facing. This suite pins the pool's contract so a drive-by edit can't
 * silently rot it:
 *  - exactly ten sets, one per theme, 30 cards each, spells only, on-theme;
 *  - the 10/12/8 rank quota (commons for the x4 seats, uncommons for the x2
 *    seats, rares for the finisher seat) and the <=3 tier-3 late-gate cap;
 *  - pricing honesty via the REAL scorer (`scoreCard` in the rank band — the
 *    same bands as `pricing.engine.test.ts`; keep in sync);
 *  - every referenced effect id resolves in the effects library;
 *  - global id uniqueness: all ten sets register together on top of the
 *    library without collision (the doctrine sweep relies on this).
 */

import { describe, it, expect } from 'vitest';

import { SANDBOX_CARD_SETS, applySandboxSet } from '../cards.sandbox-sets';
import { clearSandboxCards } from '../cards.sandbox';
import { CARD_THEMES } from '../card-themes';
import { scoreCard, scoreRider } from '../cards.pricing';
import { rankToRarity } from '../types';
import type { Card } from '../types';
import { lookupEffect } from '../../Effects';

const SWAP_SET_IDS = CARD_THEMES.map(t => `swap-${t}`);

/** Mirrors `pricing.engine.test.ts` RANK_BANDS — keep in sync. */
const RANK_BANDS: Record<'common' | 'uncommon' | 'rare', [number, number]> = {
    common: [1.5, 7.5], uncommon: [4.5, 13], rare: [7, 19],
};

/** The seat-coverage quota every theme pool ships with. */
const QUOTA = { common: 10, uncommon: 12, rare: 8 } as const;

/** Deep-collects every `effectId` string anywhere on a card literal. */
function collectEffectIds(node: unknown, out: string[] = []): string[] {
    if (Array.isArray(node)) { for (const v of node) collectEffectIds(v, out); return out; }
    if (node && typeof node === 'object') {
        for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
            if (k === 'effectId' && typeof v === 'string') out.push(v);
            else collectEffectIds(v, out);
        }
    }
    return out;
}

describe('swap-pool sets — registry shape', () => {
    it('ships exactly one swap set per theme', () => {
        for (const id of SWAP_SET_IDS) {
            expect(SANDBOX_CARD_SETS[id], `missing set '${id}'`).toBeDefined();
        }
    });

    it('all ten sets register together without id collisions (library + cross-set)', () => {
        clearSandboxCards();
        let total = 0;
        for (const id of SWAP_SET_IDS) {
            const set = applySandboxSet(id);
            expect(set, `applySandboxSet('${id}') returned undefined`).toBeDefined();
            total += set!.cards.length;
        }
        expect(total).toBe(300);
        clearSandboxCards();
    });
});

describe.each(SWAP_SET_IDS.map(id => [id] as const))('swap-pool set %s', (setId) => {
    const theme = setId.slice('swap-'.length);
    const set = SANDBOX_CARD_SETS[setId];
    const cards: readonly Card[] = set?.cards ?? [];

    it('carries exactly 30 spells, all on-theme, all with a FREE line', () => {
        expect(set).toBeDefined();
        expect(cards.length).toBe(30);
        for (const c of cards) {
            expect(c.cardType, `${c.id} must be a spell (enchant/disenchant passives are engine hooks)`).toBe('spell');
            expect(c.theme, `${c.id} theme`).toBe(theme);
            expect(c.free, `${c.id} FREE line missing`).toBeDefined();
        }
    });

    it('meets the 10/12/8 rank quota and the tier-3 late-gate cap', () => {
        const counts = { common: 0, uncommon: 0, rare: 0 };
        for (const c of cards) counts[rankToRarity(c.rank)] += 1;
        expect(counts).toEqual(QUOTA);
        const tier3 = cards.filter(c => c.tier === 3).length;
        expect(tier3, 'tier 3 is late-stage-gated — keep the pool exercisable').toBeLessThanOrEqual(3);
    });

    it.each(cards.map(c => [c.id, c] as const))('%s scores inside its rank band (scoreCard, not the comment)', (_id, card) => {
        const [lo, hi] = RANK_BANDS[rankToRarity(card.rank)];
        const score = scoreCard(card);
        expect(score, `${card.id} rank ${card.rank}`).toBeGreaterThanOrEqual(lo);
        expect(score, `${card.id} rank ${card.rank}`).toBeLessThanOrEqual(hi);
    });

    it.each(cards.map(c => [c.id, c] as const))('%s FREE share stays a real deposit (sanity rail)', (_id, card) => {
        if (card.intentionallyAsymmetric) return;
        const share = scoreRider(card.free) / scoreCard(card);
        // Design window is 25-35%; this is the loose rail that catches a dead
        // or dominant FREE line, not the design target itself.
        expect(share, `${card.id} free share`).toBeGreaterThanOrEqual(0.15);
        expect(share, `${card.id} free share`).toBeLessThanOrEqual(0.45);
    });

    it('declares intentionallyAsymmetric sparingly (max 3)', () => {
        expect(cards.filter(c => c.intentionallyAsymmetric).length).toBeLessThanOrEqual(3);
    });

    it.each(cards.map(c => [c.id, c] as const))('%s references only real effect ids', (_id, card) => {
        for (const effectId of collectEffectIds(card)) {
            expect(lookupEffect(effectId), `${card.id} references unknown effect '${effectId}'`).toBeDefined();
        }
    });
});
