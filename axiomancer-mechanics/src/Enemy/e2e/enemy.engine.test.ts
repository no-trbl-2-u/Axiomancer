/**
 * Enemy data-model coverage — 2026-07-06 art-driven roster.
 *
 * The Spec 07 turn-based AI strategy tests were removed with the legacy
 * turn-based combat driver — the Hazard-Pattern engine drives enemies via
 * authored threat sequences, not these strategies. What remains here is the
 * enemy registry shape, the authored card rotations, and the stat-law
 * compliance guards used by the balance anchors.
 */

import { describe, it, expect } from 'vitest';
import {
    ENEMY_REGISTRY, Ghast, KingOfRevenge,
    TheButcher, TheFerryman, HasshakuSama, FateSpinner, Kudan,
    LittleBelle, WaterHolger,
} from '../enemy.library';

describe('ENEMY_REGISTRY', () => {
    it('contains every published enemy with a stable shape', () => {
        const entries = Object.entries(ENEMY_REGISTRY);
        expect(entries.length).toBeGreaterThan(0);
        for (const [slug, enemy] of entries) {
            expect(enemy.id).toBeTruthy();
            expect(enemy.name).toBeTruthy();
            expect(enemy.maxHealth).toBeGreaterThan(0);
            expect(enemy.health).toBe(enemy.maxHealth);
            expect(enemy.baseStats).toBeDefined();
            // Slug stability: the slug must round-trip back to the same fixture.
            expect(ENEMY_REGISTRY[slug as keyof typeof ENEMY_REGISTRY]).toBe(enemy);
        }
    });
});

describe('authored card rotations (art-driven roster)', () => {
    // Fodder (Grave Larva, Chattering Skull, Float-Eye, Foot-Stealer…)
    // intentionally stays card-less for early-game pacing; normals carry one
    // rotation card, elites 1-2, bosses/uniques 2-3.

    it('Ghast carries the red-herring rotation', () => {
        expect(Ghast.cards).toBeDefined();
        expect(Ghast.cards?.length).toBe(1);
        expect(Ghast.cards?.[0].id).toBe('red-herring');
    });

    it('The King of Revenge carries the straw-mans-jab rotation (Easy anchor kit)', () => {
        expect(KingOfRevenge.cards).toBeDefined();
        expect(KingOfRevenge.cards?.length).toBe(3);
        const cardIds = KingOfRevenge.cards?.map(s => s.id) || [];
        expect(cardIds).toContain('straw-mans-jab');
    });

    it('The Butcher carries the sweet-poison rotation', () => {
        expect(TheButcher.cards?.[0].id).toBe('sweet-poison');
    });

    it('The Ferryman carries the festering-argument rotation', () => {
        expect(TheFerryman.cards?.[0].id).toBe('festering-argument');
    });

    it('Hasshaku-sama carries the soft-word rotation', () => {
        expect(HasshakuSama.cards?.[0].id).toBe('soft-word');
    });

    it('The Fate-Spinner carries the glimpse rotation', () => {
        expect(FateSpinner.cards?.[0].id).toBe('glimpse');
    });

    it('Kudan carries the slippery-slope rotation', () => {
        expect(Kudan.cards?.[0].id).toBe('slippery-slope');
    });

    it('Little Belle carries the soft-word rotation', () => {
        expect(LittleBelle.cards?.[0].id).toBe('soft-word');
    });

    it('Water-Holger carries the soft-word rotation', () => {
        expect(WaterHolger.cards?.[0].id).toBe('soft-word');
    });
});

describe('stat law compliance for playtest balance anchors', () => {
    it('The King of Revenge level 6 has exactly 30 total stats (5 × level)', () => {
        const { body, mind, heart } = KingOfRevenge.baseStats;
        const total = body + mind + heart;
        expect(total).toBe(30);
    });

    it('The King of Revenge has cards for Easy anchor testing', () => {
        expect(KingOfRevenge.cards).toBeDefined();
        expect(KingOfRevenge.cards?.length).toBeGreaterThanOrEqual(3);
        const cardIds = KingOfRevenge.cards?.map(s => s.id) || [];
        expect(cardIds).toContain('straw-mans-jab');
    });

    it('Tri-Eyes level 15 has exactly 75 total stats (5 × level)', () => {
        const TriEyes = ENEMY_REGISTRY['tri-eyes'];
        const { body, mind, heart } = TriEyes.baseStats;
        const total = body + mind + heart;
        expect(total).toBe(75);
    });

    it('Tri-Eyes has 1-2 low-tier cards for Normal anchor', () => {
        const TriEyes = ENEMY_REGISTRY['tri-eyes'];
        expect(TriEyes.cards).toBeDefined();
        expect(TriEyes.cards?.length).toBeGreaterThanOrEqual(1);
        expect(TriEyes.cards?.length).toBeLessThanOrEqual(2);
    });

    it('Mirac level 18 has exactly 90 total stats (5 × level)', () => {
        const Mirac = ENEMY_REGISTRY['mirac'];
        const { body, mind, heart } = Mirac.baseStats;
        const total = body + mind + heart;
        expect(total).toBe(90);
    });

    it('Mirac has several devastating cards for Difficult anchor', () => {
        const Mirac = ENEMY_REGISTRY['mirac'];
        expect(Mirac.cards).toBeDefined();
        expect(Mirac.cards?.length).toBeGreaterThanOrEqual(3);
        const cardIds = Mirac.cards?.map(s => s.id) || [];
        expect(cardIds).toContain('bootstrap-loop'); // the Forge engine piece
    });
});
