/**
 * Enemy data-model coverage — 2026-07-06 art-driven roster.
 *
 * The Spec 07 turn-based AI strategy tests were removed with the legacy
 * turn-based combat driver — the Hazard-Pattern engine drives enemies via
 * authored threat sequences, not these strategies. What remains here is the
 * enemy registry shape, the authored skill rotations, and the stat-law
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

describe('authored skill rotations (art-driven roster)', () => {
    // Fodder (Grave Larva, Chattering Skull, Float-Eye, Foot-Stealer…)
    // intentionally stays skill-less for early-game pacing; normals carry one
    // rotation skill, elites 1-2, bosses/uniques 2-3.

    it('Ghast carries the red-herring rotation', () => {
        expect(Ghast.skills).toBeDefined();
        expect(Ghast.skills?.length).toBe(1);
        expect(Ghast.skills?.[0].id).toBe('red-herring');
    });

    it('The King of Revenge carries the straw-mans-jab rotation (Easy anchor kit)', () => {
        expect(KingOfRevenge.skills).toBeDefined();
        expect(KingOfRevenge.skills?.length).toBe(3);
        const skillIds = KingOfRevenge.skills?.map(s => s.id) || [];
        expect(skillIds).toContain('straw-mans-jab');
    });

    it('The Butcher carries the sweet-poison rotation', () => {
        expect(TheButcher.skills?.[0].id).toBe('sweet-poison');
    });

    it('The Ferryman carries the festering-argument rotation', () => {
        expect(TheFerryman.skills?.[0].id).toBe('festering-argument');
    });

    it('Hasshaku-sama carries the soft-word rotation', () => {
        expect(HasshakuSama.skills?.[0].id).toBe('soft-word');
    });

    it('The Fate-Spinner carries the glimpse rotation', () => {
        expect(FateSpinner.skills?.[0].id).toBe('glimpse');
    });

    it('Kudan carries the slippery-slope rotation', () => {
        expect(Kudan.skills?.[0].id).toBe('slippery-slope');
    });

    it('Little Belle carries the soft-word rotation', () => {
        expect(LittleBelle.skills?.[0].id).toBe('soft-word');
    });

    it('Water-Holger carries the soft-word rotation', () => {
        expect(WaterHolger.skills?.[0].id).toBe('soft-word');
    });
});

describe('stat law compliance for playtest balance anchors', () => {
    it('The King of Revenge level 6 has exactly 30 total stats (5 × level)', () => {
        const { body, mind, heart } = KingOfRevenge.baseStats;
        const total = body + mind + heart;
        expect(total).toBe(30);
    });

    it('The King of Revenge has skills for Easy anchor testing', () => {
        expect(KingOfRevenge.skills).toBeDefined();
        expect(KingOfRevenge.skills?.length).toBeGreaterThanOrEqual(3);
        const skillIds = KingOfRevenge.skills?.map(s => s.id) || [];
        expect(skillIds).toContain('straw-mans-jab');
    });

    it('Tri-Eyes level 15 has exactly 75 total stats (5 × level)', () => {
        const TriEyes = ENEMY_REGISTRY['tri-eyes'];
        const { body, mind, heart } = TriEyes.baseStats;
        const total = body + mind + heart;
        expect(total).toBe(75);
    });

    it('Tri-Eyes has 1-2 low-tier skills for Normal anchor', () => {
        const TriEyes = ENEMY_REGISTRY['tri-eyes'];
        expect(TriEyes.skills).toBeDefined();
        expect(TriEyes.skills?.length).toBeGreaterThanOrEqual(1);
        expect(TriEyes.skills?.length).toBeLessThanOrEqual(2);
    });

    it('Mirac level 18 has exactly 90 total stats (5 × level)', () => {
        const Mirac = ENEMY_REGISTRY['mirac'];
        const { body, mind, heart } = Mirac.baseStats;
        const total = body + mind + heart;
        expect(total).toBe(90);
    });

    it('Mirac has several devastating skills for Difficult anchor', () => {
        const Mirac = ENEMY_REGISTRY['mirac'];
        expect(Mirac.skills).toBeDefined();
        expect(Mirac.skills?.length).toBeGreaterThanOrEqual(3);
        const skillIds = Mirac.skills?.map(s => s.id) || [];
        expect(skillIds).toContain('bootstrap-loop'); // the Forge engine piece
    });
});
