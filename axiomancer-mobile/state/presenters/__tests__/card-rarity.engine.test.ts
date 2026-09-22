/**
 * Hermetic pin for the D4 rarity contract (wave 0 of the rarity work).
 *
 * Three things are pinned here:
 *  1. `rarityFor` NEVER re-implements the banding — it agrees with the
 *     engine's `rankToRarity` for every rank, and for every card in the
 *     shipped library. If a future edit inlines `rank <= 2 ? …` mobile-side,
 *     the library sweep is what catches it.
 *  2. Rank beats a drifted projected `rarity`, and the loose-input paths
 *     (absent rank, off-ladder rank, junk rarity, nullish card) all resolve
 *     to something sane rather than throwing.
 *  3. D4's "never colour alone": the label and the pip count are distinct
 *     per band, so the signal survives greyscale and colour blindness with
 *     `RARITY_COLOR` switched off entirely.
 */

import { describe, expect, it } from '@jest/globals';

import { cardLibrary, rankToRarity, type CardRank, type CardRarity } from '@mechanics';

import {
    RARITY_COLOR,
    RARITY_LABEL,
    RARITY_PIPS,
    rarityFor,
} from '@/state/presenters/card-rarity.engine';

const RANKS: readonly CardRank[] = [1, 2, 3, 4, 5, 6];
const BANDS: readonly CardRarity[] = ['common', 'uncommon', 'rare'];

describe('card-rarity.engine — rarityFor derives, never decides', () => {
    it('agrees with the engine rankToRarity for every rank on the ladder', () => {
        for (const rank of RANKS) {
            expect(rarityFor({ rank })).toBe(rankToRarity(rank));
        }
    });

    it('bands the ladder exactly as Spec 32 v3 §4 does (1-2 / 3-4 / 5-6)', () => {
        expect(RANKS.map((rank) => rarityFor({ rank }))).toEqual([
            'common', 'common', 'uncommon', 'uncommon', 'rare', 'rare',
        ]);
    });

    it('agrees with rankToRarity for every card in the shipped library', () => {
        expect(cardLibrary.length).toBeGreaterThan(0);
        const drifted = cardLibrary.filter((card) => rarityFor(card) !== rankToRarity(card.rank));
        expect(drifted.map((card) => card.id)).toEqual([]);
    });

    it('prefers the authored rank over a drifted projected rarity', () => {
        // A VM whose `rarity` disagrees with its own `rank`: the rank wins.
        expect(rarityFor({ rank: 6, rarity: 'common' })).toBe('rare');
        expect(rarityFor({ rank: 1, rarity: 'rare' })).toBe('common');
    });

    it('falls back to a projected rarity only when no usable rank came along', () => {
        expect(rarityFor({ rarity: 'uncommon' })).toBe('uncommon');
        expect(rarityFor({ rank: null, rarity: 'rare' })).toBe('rare');
    });

    it('clamps an off-ladder rank instead of discarding the ordering', () => {
        expect(rarityFor({ rank: 0 })).toBe('common');
        expect(rarityFor({ rank: 9 })).toBe('rare');
        expect(rarityFor({ rank: 3.4 })).toBe('uncommon');
    });

    it('resolves to common for junk, nullish, and empty input rather than throwing', () => {
        expect(rarityFor(null)).toBe('common');
        expect(rarityFor(undefined)).toBe('common');
        expect(rarityFor({})).toBe('common');
        expect(rarityFor({ rank: Number.NaN })).toBe('common');
        // A save round-trip can surface a string that is not a real band.
        expect(rarityFor({ rarity: 'legendary' as unknown as CardRarity })).toBe('common');
    });
});

describe('card-rarity.engine — D4: never colour alone', () => {
    it('covers all three bands in every affordance table', () => {
        for (const band of BANDS) {
            expect(RARITY_LABEL[band]).toBeTruthy();
            expect(RARITY_COLOR[band]).toMatch(/^#[0-9a-f]{6}$/);
            expect(RARITY_PIPS[band]).toBeGreaterThan(0);
        }
    });

    it('carries a distinct label and a distinct pip count per band', () => {
        expect(new Set(BANDS.map((b) => RARITY_LABEL[b])).size).toBe(BANDS.length);
        expect(new Set(BANDS.map((b) => RARITY_PIPS[b])).size).toBe(BANDS.length);
        expect(new Set(BANDS.map((b) => RARITY_COLOR[b])).size).toBe(BANDS.length);
    });

    it('climbs the pip count with the band so the row reads as a scale', () => {
        expect(RARITY_PIPS.common).toBeLessThan(RARITY_PIPS.uncommon);
        expect(RARITY_PIPS.uncommon).toBeLessThan(RARITY_PIPS.rare);
    });

    it('keeps the shipped wax-pip hues, so adopting the module is a no-diff refactor', () => {
        // The literals currently inlined in CombatBoard.tsx (L1964) and
        // CombatRewardsOverlay.tsx (L38-42).
        expect(RARITY_COLOR).toEqual({ common: '#8a8273', uncommon: '#6b8eb0', rare: '#9a6ad6' });
    });

    it('exposes frozen tables, so no screen can mutate the shared signal', () => {
        expect(Object.isFrozen(RARITY_LABEL)).toBe(true);
        expect(Object.isFrozen(RARITY_PIPS)).toBe(true);
        expect(Object.isFrozen(RARITY_COLOR)).toBe(true);
    });
});
