/**
 * Hermetic E2E — Sandbox card registry (the deck-forge experimentation surface).
 *
 * Covers:
 *   - register / lookup / clear lifecycle, `hasSandboxContent`
 *   - collision safety (library ids and duplicate sandbox ids throw; atomic)
 *   - library-card overrides: shallow merge visible through `getCardById`
 *   - the post-v3 EMPTY set registry (`SANDBOX_CARD_SETS = {}` — the pre-v3
 *     experiment sets referenced retired cards/effects and the deleted
 *     `basePower` field, so the reset cleared them; `/deck-tuning` authors
 *     fresh v3 sets here)
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
        category: 'fallacy',
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
        expect(getSandboxCard('slippery-slope')).toBeUndefined();
        // Library lookups are untouched when the sandbox is empty.
        expect(getCardById('slippery-slope')?.name).toBe('Slippery Slope');
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
        registerSandboxOverride('slippery-slope', { tier: 3 });
        expect(hasSandboxContent()).toBe(true);
        expect(listSandboxCards()).toHaveLength(2);

        clearSandboxCards();
        expect(hasSandboxContent()).toBe(false);
        expect(getCardById('sandbox-test-rot')).toBeUndefined();
        expect(getCardById('slippery-slope')?.tier).toBe(2); // library literal (spec 32 v3)
    });
});

// ── Collision safety ─────────────────────────────────────────────────────────

describe('sandbox registry — collisions and validation', () => {
    it('registering an id that exists in the card library throws', () => {
        expect(() => registerSandboxCards([testDotCard('slippery-slope')]))
            .toThrow(/collides with the card library/);
    });

    it('registering the same sandbox id twice throws', () => {
        registerSandboxCards([testDotCard()]);
        expect(() => registerSandboxCards([testDotCard()]))
            .toThrow(/already registered/);
    });

    it('registration is atomic — a colliding batch registers nothing', () => {
        expect(() => registerSandboxCards([testDotCard('sandbox-ok'), testDotCard('brace-for-impact')]))
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
    it('a shallow patch is merged over the library card and visible via getCardById', () => {
        const base = getCardById('straw-mans-jab');
        expect(base?.combatEffects?.[0]?.intensity).toBe(2); // library literal (spec 32 v3)

        registerSandboxOverride('straw-mans-jab', {
            combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 3, duration: 2 }],
        });
        const merged = getCardById('straw-mans-jab');
        expect(merged?.combatEffects?.[0]?.intensity).toBe(3);
        // Untouched fields survive the merge; the id is immutable.
        expect(merged?.id).toBe('straw-mans-jab');
        expect(merged?.name).toBe(base?.name);
        expect(merged?.dieBonus).toEqual(base?.dieBonus);
        expect(merged?.rank).toBe(base?.rank);
    });

    it('repeated overrides of the same card accumulate (shallow-merge order)', () => {
        registerSandboxOverride('straw-mans-jab', { rank: 3 });
        registerSandboxOverride('straw-mans-jab', { tier: 2 });
        const merged = getCardById('straw-mans-jab');
        expect(merged?.rank).toBe(3);
        expect(merged?.tier).toBe(2);
        expect(listSandboxCards().map(c => c.id)).toEqual(['straw-mans-jab']);
    });
});

// ── Set registry (post-v3 reset) ─────────────────────────────────────────────

describe('sandbox sets — the registry after the post-v3 reset', () => {
    it('carries the WS7.2 chooseX + WS3.4 doom + WS2.1 conjure + WS4 theme-role + WS5.2 sequencing + WS6.2 bridge + WS2.2 free-line sets (pre-v3 experiment sets stayed retired)', () => {
        const expected = [
            'chooseX-vein', 'doom-species', 'conjure-exercise',
            'roles-forge', 'roles-bulwark', 'roles-charm', 'roles-harvest',
            'sequencing-microset', 'bridge-rewards', 'free-line-conversions',
        ];
        expect(Object.keys(SANDBOX_CARD_SETS)).toEqual(expected);
        expect(listSandboxSets().map(s => s.id)).toEqual(expected);
        expect(SANDBOX_CARD_SETS['chooseX-vein'].cards.map(c => c.id)).toEqual(['the-open-vein']);
        expect(SANDBOX_CARD_SETS['doom-species'].cards.map(c => c.id)).toEqual(['debt-of-days']);
        expect(SANDBOX_CARD_SETS['conjure-exercise'].cards.map(c => c.id)).toEqual(['foundry-sprite', 'corollary']);
        // WS4.1-4.4 — the theme-role passes (deep coverage in
        // roles-themes.engine.test.ts).
        expect(SANDBOX_CARD_SETS['roles-forge'].cards.map(c => c.id)).toEqual(['slag-runoff', 'ingot-of-ruin']);
        expect(SANDBOX_CARD_SETS['roles-bulwark'].cards.map(c => c.id)).toEqual(['grit-between-stones', 'the-unmoved-mover']);
        expect(SANDBOX_CARD_SETS['roles-charm'].cards.map(c => c.id)).toEqual(['a-sweeter-poison']);
        expect(SANDBOX_CARD_SETS['roles-harvest'].cards.map(c => c.id)).toEqual(['the-long-ledger', 'seedcorn-sacrifice']);
        // WS5.2 — the sequencing-grammar microset (deep coverage in
        // sequencing-grammar.engine.test.ts).
        expect(SANDBOX_CARD_SETS['sequencing-microset'].cards.map(c => c.id)).toEqual([
            'captatio-benevolentiae', 'in-medias-res', 'coda',
            'dying-echo', 'wages-of-weakness', 'answered-in-kind',
        ]);
        // WS6.2 — the cross-theme bridge rewards (deep coverage in
        // bridge-rewards.engine.test.ts).
        expect(SANDBOX_CARD_SETS['bridge-rewards'].cards.map(c => c.id)).toEqual([
            'barbed-compliment', 'the-poured-rampart', 'interest-on-the-flesh',
            'entered-into-evidence', 'stolen-cadence', 'unbroken-countenance',
        ]);
        // WS2.2: overrides only — the FREE-line conversions mint no new cards.
        expect(SANDBOX_CARD_SETS['free-line-conversions'].cards).toHaveLength(0);
        expect((SANDBOX_CARD_SETS['free-line-conversions'].overrides ?? []).length).toBe(8);
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
