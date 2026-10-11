/**
 * The seeded engine RNG.
 *
 * The contract this file pins:
 *   · nearby seeds open on unrelated draws, so a seeded shuffle does not
 *     deal the same card last for every small seed (the bias a raw
 *     Park-Miller step from seeds 1..N had: a first draw of ~seed × 2.2e-5);
 *   · `setState` restores a saved state verbatim, so a reload resumes the
 *     exact stream (it never scrambles);
 *   · the same seed always gives the same stream.
 */

import { describe, it, expect } from 'vitest';

import { getRng, scrambleSeed, setSeed } from './rng';
import { shuffleCombatDeck } from '../Combat/combat.deck';

describe('seeding', () => {
    it('opens nearby seeds on spread-out first draws', () => {
        const firsts = Array.from({ length: 200 }, (_, i) => {
            setSeed(i + 1);
            return getRng().random();
        });
        expect(Math.max(...firsts)).toBeGreaterThan(0.9);
        expect(firsts.filter(x => x < 0.01).length).toBeLessThan(10);
    });

    it('does not deal the first deck card last for every small seed', () => {
        const positions = Array.from({ length: 200 }, (_, i) => {
            setSeed(i + 1);
            const deck = Array.from({ length: 30 }, (_, k) => k);
            return shuffleCombatDeck(deck, () => getRng().random()).indexOf(0);
        });
        // Uniform would put ~7 of 200 at the last slot; the old bias put all 200.
        expect(positions.filter(p => p === 29).length).toBeLessThan(25);
        expect(new Set(positions).size).toBeGreaterThan(20);
    });

    it('is deterministic per seed', () => {
        setSeed(42);
        const a = [getRng().random(), getRng().random(), getRng().random()];
        setSeed(42);
        const b = [getRng().random(), getRng().random(), getRng().random()];
        expect(b).toEqual(a);
    });

    it('scrambles to distinct non-negative 32-bit values', () => {
        const values = [1, 2, 3, 4, 5].map(scrambleSeed);
        expect(new Set(values).size).toBe(5);
        for (const v of values) expect(v).toBeGreaterThanOrEqual(0);
    });
});

describe('save and resume', () => {
    it('setState resumes the exact stream from a saved state', () => {
        setSeed(7);
        getRng().random();
        const saved = getRng().getState();
        const expected = [getRng().random(), getRng().random()];
        getRng().setState(saved);
        expect([getRng().random(), getRng().random()]).toEqual(expected);
    });
});
