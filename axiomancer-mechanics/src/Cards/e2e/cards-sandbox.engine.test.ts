/**
 * Hermetic E2E — Sandbox card registry (the deck-forge experimentation surface).
 *
 * Covers:
 *   - register / lookup / clear lifecycle, `hasSandboxContent`
 *   - collision safety (library ids and duplicate sandbox ids throw; atomic)
 *   - library-card overrides: shallow merge visible through `getCardById`
 *   - the set registry (empty: the pre-v3 experiment sets were cleared by
 *     the reset, and the GLYPHS_51_PILOT set went with the GLYPHS cut, trim
 *     T5 2026-09-25)
 *   - a registered sandbox card speaks the v3 vocabulary: its effect ids
 *     resolve in the Effects library and it projects through `toCombatCard`
 *
 * The sandbox is wiped after every test so no experimental card leaks into
 * other suites.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { lookupEffect } from '../../Effects';
import type { Card } from '../types';
import { getCardById } from '../cards.library';
import {
    registerSandboxCards, registerSandboxOverride, clearSandboxCards,
    getSandboxCard, listSandboxCards, hasSandboxContent,
} from '../cards.sandbox';
import { SANDBOX_CARD_SETS, listSandboxSets, applySandboxSet } from '../cards.sandbox-sets';
import { toCombatCard } from '../../Combat/combat.cards';

afterEach(() => {
    clearSandboxCards();
    vi.restoreAllMocks();
});

// ── Fixtures ─────────────────────────────────────────────────────────────────

/** Minimal well-formed v3 experimental DoT card (real effect id: debuff_bleed). */
function testDotCard(id = 'sandbox-test-rot'): Card {
    return {
        id,
        name: 'Test Rot',
        philosophicalAspect: 'body',
        description: 'A test argument that decays on contact.',
        tier: 1,
        rank: 1,
        cardType: 'spell',
        targetType: 'enemy',
        free: { tickOne: true },
        combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 3 }],
    };
}

// ── Registry lifecycle ───────────────────────────────────────────────────────

describe('sandbox registry — register / lookup / clear', () => {
    it('starts empty and stays invisible to getCardById', () => {
        expect(hasSandboxContent()).toBe(false);
        expect(listSandboxCards()).toEqual([]);
        expect(getSandboxCard('spoiled-poultice')).toBeUndefined();
        // Library lookups are untouched when the sandbox is empty.
        expect(getCardById('spoiled-poultice')?.name).toBe('Spoiled Poultice');
        expect(getCardById('no-such-card')).toBeUndefined();
    });

    it('a registered new card resolves via getSandboxCard AND getCardById', () => {
        registerSandboxCards([testDotCard()]);
        expect(hasSandboxContent()).toBe(true);
        expect(getSandboxCard('sandbox-test-rot')?.name).toBe('Test Rot');
        expect(getCardById('sandbox-test-rot')?.rank).toBe(1);
        expect(listSandboxCards().map(c => c.id)).toEqual(['sandbox-test-rot']);
    });

    it('clearSandboxCards wipes both new cards and overrides', () => {
        registerSandboxCards([testDotCard()]);
        registerSandboxOverride('spoiled-poultice', { tier: 3 });
        expect(hasSandboxContent()).toBe(true);
        expect(listSandboxCards()).toHaveLength(2);

        clearSandboxCards();
        expect(hasSandboxContent()).toBe(false);
        expect(getCardById('sandbox-test-rot')).toBeUndefined();
        expect(getCardById('spoiled-poultice')?.tier).toBe(1); // library literal (profane canon)
    });
});

// ── Collision safety ─────────────────────────────────────────────────────────

describe('sandbox registry — collisions and validation', () => {
    it('registering an id that exists in the card library throws', () => {
        expect(() => registerSandboxCards([testDotCard('spoiled-poultice')]))
            .toThrow(/collides with the card library/);
    });

    it('registering the same sandbox id twice throws', () => {
        registerSandboxCards([testDotCard()]);
        expect(() => registerSandboxCards([testDotCard()]))
            .toThrow(/already registered/);
    });

    it('registration is atomic — a colliding batch registers nothing', () => {
        expect(() => registerSandboxCards([testDotCard('sandbox-ok'), testDotCard('chilblain-watch')]))
            .toThrow();
        expect(getSandboxCard('sandbox-ok')).toBeUndefined();
        expect(hasSandboxContent()).toBe(false);
    });

    it('overriding a card that is not in the library throws', () => {
        expect(() => registerSandboxOverride('no-such-card', { tier: 3 }))
            .toThrow(/no such card in the library/);
    });
});

// ── Overrides ────────────────────────────────────────────────────────────────

describe('sandbox registry — library-card overrides', () => {
    // (Override target was straw-mans-jab until its D8 retirement — re-targeted
    //  to slippery-slope, a surviving library card with a combatEffects payload.)
    it('a shallow patch is merged over the library card and visible via getCardById', () => {
        const base = getCardById('spoiled-poultice');
        expect(base?.combatEffects?.[0]?.intensity).toBe(4); // library literal (profane canon)

        registerSandboxOverride('spoiled-poultice', {
            combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 3, duration: 2 }],
        });
        const merged = getCardById('spoiled-poultice');
        expect(merged?.combatEffects?.[0]?.intensity).toBe(3);
        // Untouched fields survive the merge; the id is immutable.
        expect(merged?.id).toBe('spoiled-poultice');
        expect(merged?.name).toBe(base?.name);
        expect(merged?.dieBonus).toEqual(base?.dieBonus);
        expect(merged?.rank).toBe(base?.rank);
    });

    it('repeated overrides of the same card accumulate (shallow-merge order)', () => {
        // slippery-slope's library literals are rank 1 / tier 2 — both patches
        // must move the merged value away from the base.
        registerSandboxOverride('spoiled-poultice', { rank: 3 });
        registerSandboxOverride('spoiled-poultice', { tier: 3 });
        const merged = getCardById('spoiled-poultice');
        expect(merged?.rank).toBe(3);
        expect(merged?.tier).toBe(3);
        expect(listSandboxCards().map(c => c.id)).toEqual(['spoiled-poultice']);
    });
});

// ── Set registry (post-v3 reset) ─────────────────────────────────────────────

describe('sandbox sets — the registry after the post-v3 reset', () => {
    // PROFANE CANON (2026-08-08): the wholesale card rework retired the
    // 86-card themed library, so every experiment set and swap pool that
    // referenced it was cleared (same clean-reset rule spec 32 v3 applied
    // to ITS predecessors; the retired sets live in git history).
    // The GLYPHS cut (trim T5, 2026-09-25) removed the only post-reset set.
    it('is empty', () => {
        expect(Object.keys(SANDBOX_CARD_SETS)).toEqual([]);
        expect(listSandboxSets()).toEqual([]);
    });

    it('applySandboxSet returns undefined for an unknown id and registers nothing', () => {
        expect(applySandboxSet('forge-example')).toBeUndefined();
        expect(applySandboxSet('no-such-set')).toBeUndefined();
        expect(hasSandboxContent()).toBe(false);
    });
});

// ── v3 vocabulary + projection ───────────────────────────────────────────────

describe('sandbox cards — v3 vocabulary and combat projection', () => {
    it('every effect id on a registered sandbox card resolves in the Effects library', () => {
        const card = testDotCard();
        registerSandboxCards([card]);
        for (const ce of card.combatEffects ?? []) {
            expect(lookupEffect(ce.effectId), `${card.id} -> ${ce.effectId}`).toBeDefined();
        }
    });

    it('a registered sandbox card projects through toCombatCard as a status card', () => {
        registerSandboxCards([testDotCard()]);
        const projected = toCombatCard('sandbox-test-rot', getCardById, lookupEffect);
        expect(projected).not.toBeNull();
        expect(projected!.id).toBe('sandbox-test-rot');
        expect(projected!.primaryEffectId).toBe('debuff_bleed');
        expect(projected!.effectKind).toBe('dot');
    });
});
