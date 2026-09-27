/**
 * Enemy data-model coverage — 2026-07-06 art-driven roster.
 *
 * The Spec 07 turn-based AI strategy tests were removed with the legacy
 * turn-based combat driver — the Hazard-Pattern engine drives enemies via
 * authored threat sequences, not these strategies. What remains here is the
 * enemy registry shape. (The authored card rotations and the anchor card
 * guards went with the vestigial `Enemy.cards` lists in the card purge,
 * P1, 2026-09-27.)
 */

import { describe, it, expect } from 'vitest';
import { ENEMY_REGISTRY } from '../enemy.library';

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
