/**
 * Hermetic E2E tests — Phase 131 dev evidence presets.
 *
 * Drives the two new dev actions end-to-end through the engine store:
 *   - `applyPlayerTierPreset` (L1/L15/L30/L50 ladder)
 *   - `addItemById` (equipment / unique / consumable resolution)
 *
 * Hermetic = self-contained + deterministic + isolated.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { getEquippedItems } from '@mechanics';

import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { createAppActions } from '@/state/actions';
import { createAppStore } from '@/state/store';
import { PLAYER_TIER_PRESETS } from '@/state/dev/player-presets';

afterEach(() => {
    jest.restoreAllMocks();
});

function makeStore() {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    const actions = createAppActions(store);
    return { store, actions };
}

describe('applyPlayerTierPreset: L1/L15/L30/L50 ladder', () => {
    it.each(PLAYER_TIER_PRESETS.map((p) => [p.id, p.label, p.preset.level]))(
        'apply "%s" → player rebuilt at level %i',
        (presetId, label, level) => {
            const { store, actions } = makeStore();

            const result = actions.applyPlayerTierPreset(presetId as string);

            expect(result.applied).toBe(true);
            expect(result.presetId).toBe(presetId);
            expect(result.label).toBe(label);
            expect(result.level).toBe(level);

            const player = store.getState().player;
            expect(player.level).toBe(level);
            expect(player.maxHealth).toBeGreaterThan(0);
            expect(player.health).toBe(player.maxHealth);
            // Every tier seeds known cards (the full combat catalogue per
            // ADR-0002 — there is no separate equipped rotation).
            expect(player.knownCards?.length ?? 0).toBeGreaterThan(0);
        },
    );

    it('seeds level-relevant equipment for the higher tiers', () => {
        const { store, actions } = makeStore();

        actions.applyPlayerTierPreset('kid-l50');
        const player = store.getState().player;
        // L50 declares seven equipment pieces; Phase 18's 5-slot loadout
        // wears the first weapon, first armor, and three accessories
        // (capacity-capped), benching the overflow into inventory. So the
        // build arrives with the full five worn pieces.
        const worn = getEquippedItems(player.equipment);
        expect(worn).toHaveLength(5);
    });

    it('L1 is a leaner build than L50 (ladder escalates)', () => {
        const { store, actions } = makeStore();

        actions.applyPlayerTierPreset('kid-l1');
        const l1Health = store.getState().player.maxHealth;

        actions.applyPlayerTierPreset('kid-l50');
        const l50Health = store.getState().player.maxHealth;

        expect(l50Health).toBeGreaterThan(l1Health);
    });

    it('subsequent apply replaces — L15 state does not leak into L30', () => {
        const { store, actions } = makeStore();

        actions.applyPlayerTierPreset('kid-l15');
        const l15Level = store.getState().player.level;

        actions.applyPlayerTierPreset('kid-l30');
        const l30Level = store.getState().player.level;

        expect(l15Level).toBe(15);
        expect(l30Level).toBe(30);
    });

    it('unknown id is a no-op (applied=false, player untouched)', () => {
        const { store, actions } = makeStore();
        const before = store.getState().player;

        const result = actions.applyPlayerTierPreset('kid-l999');

        expect(result.applied).toBe(false);
        expect(result.presetId).toBeNull();
        expect(result.level).toBeNull();
        expect(store.getState().player).toBe(before);
    });
});

describe('addItemById: registry resolution', () => {
    it('adds a signet relic by id (Phase 21 — relics are the only equipment)', () => {
        const { store, actions } = makeStore();
        const before = store.getState().player.inventory?.length ?? 0;

        const result = actions.addItemById('relic-read');

        expect(result.added).toBe(true);
        expect(result.kind).toBe('equipment');
        expect(result.name).toBeTruthy();
        expect((store.getState().player.inventory?.length ?? 0)).toBe(before + 1);
    });

    it('adds a consumable by id', () => {
        const { store, actions } = makeStore();

        const result = actions.addItemById('healing-potion');

        expect(result.added).toBe(true);
        expect(result.kind).toBe('consumable');
    });

    it('trims surrounding whitespace before lookup', () => {
        const { store, actions } = makeStore();

        const result = actions.addItemById('  relic-read  ');

        expect(result.added).toBe(true);
        expect(result.id).toBe('relic-read');
        expect(result.kind).toBe('equipment');
    });

    it('returns a graceful failure for an empty id', () => {
        const { actions } = makeStore();

        const result = actions.addItemById('   ');

        expect(result.added).toBe(false);
        expect(result.kind).toBeNull();
        expect(result.reason).toBeTruthy();
    });

    it('returns a graceful failure for an unknown id', () => {
        const { store, actions } = makeStore();
        const before = store.getState().player.inventory?.length ?? 0;

        const result = actions.addItemById('not-a-real-item');

        expect(result.added).toBe(false);
        expect(result.kind).toBeNull();
        expect(result.reason).toContain('not-a-real-item');
        expect((store.getState().player.inventory?.length ?? 0)).toBe(before);
    });
});
