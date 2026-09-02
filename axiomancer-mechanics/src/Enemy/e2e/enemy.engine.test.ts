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

// Profane Canon (2026-08-08): rotations re-fixtured onto the 57-card library —
// old→new by mechanical role: red-herring→scolds-bridle, soft-word→thin-hymn,
// festering-argument→the-long-lent, glimpse→shallow-grave,
// slippery-slope→spoiled-poultice, sweet-poison-era poison→unction-of-boils.
describe('authored card rotations (art-driven roster)', () => {
    // Fodder (Grave Larva, Chattering Skull, Float-Eye, Foot-Stealer…)
    // intentionally stays card-less for early-game pacing; normals carry one
    // rotation card, elites 1-2, bosses/uniques 2-3.

    it('Ghast carries the scolds-bridle rotation', () => {
        expect(Ghast.cards).toBeDefined();
        expect(Ghast.cards?.length).toBe(1);
        expect(Ghast.cards?.[0].id).toBe('scolds-bridle');
    });

    it('The King of Revenge carries the scolds-bridle rotation (Easy anchor kit)', () => {
        expect(KingOfRevenge.cards).toBeDefined();
        expect(KingOfRevenge.cards?.length).toBe(3);
        const cardIds = KingOfRevenge.cards?.map(s => s.id) || [];
        expect(cardIds).toContain('scolds-bridle');
    });

    it('The Butcher carries the unction-of-boils rotation', () => {
        expect(TheButcher.cards?.[0].id).toBe('unction-of-boils');
    });

    it('The Ferryman carries the long-lent rotation', () => {
        expect(TheFerryman.cards?.[0].id).toBe('the-long-lent');
    });

    it('Hasshaku-sama carries the thin-hymn rotation', () => {
        expect(HasshakuSama.cards?.[0].id).toBe('thin-hymn');
    });

    it('The Fate-Spinner carries the shallow-grave rotation', () => {
        expect(FateSpinner.cards?.[0].id).toBe('shallow-grave');
    });

    it('Kudan carries the spoiled-poultice rotation', () => {
        expect(Kudan.cards?.[0].id).toBe('spoiled-poultice');
    });

    it('Little Belle carries the thin-hymn rotation', () => {
        expect(LittleBelle.cards?.[0].id).toBe('thin-hymn');
    });

    it('Water-Holger carries the thin-hymn rotation', () => {
        expect(WaterHolger.cards?.[0].id).toBe('thin-hymn');
    });
});

describe('stat law compliance for playtest balance anchors', () => {
    // The 5×level total-stat law was repealed 2026-09-02 (big-numbers
    // overhaul §3 L15, §10) — enemy stats no longer drive a pinned formula.
    it('The King of Revenge has cards for Easy anchor testing', () => {
        expect(KingOfRevenge.cards).toBeDefined();
        expect(KingOfRevenge.cards?.length).toBeGreaterThanOrEqual(3);
        const cardIds = KingOfRevenge.cards?.map(s => s.id) || [];
        expect(cardIds).toContain('scolds-bridle');
    });

    it('Tri-Eyes has 1-2 low-tier cards for Normal anchor', () => {
        const TriEyes = ENEMY_REGISTRY['tri-eyes'];
        expect(TriEyes.cards).toBeDefined();
        expect(TriEyes.cards?.length).toBeGreaterThanOrEqual(1);
        expect(TriEyes.cards?.length).toBeLessThanOrEqual(2);
    });

    it('Mirac has several devastating cards for Difficult anchor', () => {
        const Mirac = ENEMY_REGISTRY['mirac'];
        expect(Mirac.cards).toBeDefined();
        expect(Mirac.cards?.length).toBeGreaterThanOrEqual(3);
        const cardIds = Mirac.cards?.map(s => s.id) || [];
        expect(cardIds).toContain('ossuary-drawer'); // the grave engine piece (bootstrap-loop's Forge retired with the Profane Canon)
    });
});
