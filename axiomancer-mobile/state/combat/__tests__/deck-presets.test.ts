import { describe, expect, it } from '@jest/globals';
import { COMBAT_REWARD_POOL, PRESET_COLOR_BORROWS, STARTING_CARD_IDS, getCard, listDeckPresets } from '@mechanics';

import {
    applyCombatDeckPresetAction,
    COMBAT_DECK_PRESETS,
    randomizeCombatDeckAction,
} from '@/state/combat/store-actions';
import { createAppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

// Spec 32 v3 §8 — the starter baseline plus the ten themed preset decks.
const expectedPresetIds = [
    'starter-baseline',
    'erosion',
    'oratory',
    'foundry',
    'penitent',
    'standstill',
    'augury',
    'tithe',
    'grace',
    'bastion',
    'refrain',
];

const FULL_POOL = new Set([...STARTING_CARD_IDS, ...COMBAT_REWARD_POOL]);

function makeStore() {
    return createAppStore({ adapter: createMemoryAdapter() });
}

describe('Combat deck presets', () => {
    it('exposes the starter baseline + the ten themed presets in stable order', () => {
        expect(COMBAT_DECK_PRESETS.map((preset) => preset.id)).toEqual(expectedPresetIds);
    });

    it('every preset is a non-empty selection drawn only from engine card ids', () => {
        for (const preset of COMBAT_DECK_PRESETS) {
            expect(preset.cardIds.length).toBeGreaterThan(0);
            for (const id of preset.cardIds) {
                expect(FULL_POOL.has(id)).toBe(true);
            }
        }
    });

    it('themed presets mirror the engine recipe verbatim (4/4/2/2/1/1/1 — 15 cards)', () => {
        const engine = Object.fromEntries(listDeckPresets().map((p) => [p.id, p]));
        for (const preset of COMBAT_DECK_PRESETS) {
            if (preset.id === 'starter-baseline') continue;
            expect(preset.cardIds).toEqual([...engine[preset.id]!.cardIds]);
            expect(preset.cardIds.length).toBe(15);
            // 7 uniques per theme: 2 commons ×4, 2 uncommons ×2, 3 rares ×1.
            const counts = new Map<string, number>();
            for (const id of preset.cardIds) counts.set(id, (counts.get(id) ?? 0) + 1);
            expect(counts.size).toBe(7);
            expect([...counts.values()].sort((a, b) => b - a)).toEqual([4, 4, 2, 2, 1, 1, 1]);
        }
    });

    it('applying a preset replaces knownCards with the deck and clears reward cards', () => {
        const store = makeStore();
        store.setState({
            player: {
                ...store.getState().player,
                knownCards: ['some-old-card'],
                combatRewardCards: ['some-reward'],
            },
        } as never);

        const result = applyCombatDeckPresetAction(store, 'erosion');

        expect(result.presetId).toBe('erosion');
        expect(result.cardIds.length).toBeGreaterThan(0);
        expect(store.getState().player.knownCards).toEqual(result.cardIds);
        expect(store.getState().player.combatRewardCards).toEqual([]);
    });

    it('is deterministic — the same preset yields the same deck every time', () => {
        const first = applyCombatDeckPresetAction(makeStore(), 'grace');
        const second = applyCombatDeckPresetAction(makeStore(), 'grace');
        expect(first.cardIds).toEqual(second.cardIds);
    });

    it('starter-baseline restores the engine starting deck (spec 32 v3 §7)', () => {
        const result = applyCombatDeckPresetAction(makeStore(), 'starter-baseline');
        expect(result.cardIds).toEqual([...STARTING_CARD_IDS]);
        expect(result.cardIds).toContain('slippery-slope');
        expect(result.cardIds).toContain('brace-for-impact');
    });

    it('cross-deck overlap exists only through the documented 5/5/5 color-law borrows', () => {
        // Spec 32 §12 item 9 (ratified 2026-07-12): every recipe is exactly
        // 5 body / 5 mind / 5 heart, so presets borrow cross-theme cards of a
        // missing color. The engine pins the borrow map (PRESET_COLOR_BORROWS);
        // any other overlap is still a bug.
        const borrowable = new Set(Object.values(PRESET_COLOR_BORROWS).flat());
        const seen = new Map<string, string>();
        for (const preset of COMBAT_DECK_PRESETS) {
            if (preset.id === 'starter-baseline') continue;
            for (const id of new Set(preset.cardIds)) {
                const owner = seen.get(id);
                expect(owner === undefined || owner === preset.id || borrowable.has(id)).toBe(true);
                seen.set(id, preset.id);
            }
        }
    });

    it('every themed deck carries exactly 5 body / 5 mind / 5 heart cards (the recipe color law)', () => {
        const engine = Object.fromEntries(listDeckPresets().map((p) => [p.id, p]));
        for (const preset of COMBAT_DECK_PRESETS) {
            if (preset.id === 'starter-baseline') continue;
            expect(engine[preset.id]).toBeDefined();
            const counts = { body: 0, mind: 0, heart: 0 };
            for (const id of preset.cardIds) {
                const card = getCard(id);
                expect(card).toBeTruthy();
                // `stance` is the projected cardStanceColor = philosophicalAspect.
                counts[card!.stance as 'body' | 'mind' | 'heart'] += 1;
            }
            expect(counts).toEqual({ body: 5, mind: 5, heart: 5 });
        }
    });

    it('every preset card resolves through the engine card projection', () => {
        for (const preset of COMBAT_DECK_PRESETS) {
            for (const id of new Set(preset.cardIds)) {
                const card = getCard(id);
                expect(card).toBeTruthy();
                expect(card!.rarity).toMatch(/^(common|uncommon|rare)$/);
                expect(card!.cardType).toMatch(/^(spell|enchantment|disenchant)$/);
            }
        }
    });

    it('randomizer deals unique cards from the full pool into knownCards', () => {
        const store = makeStore();
        store.setState({
            player: { ...store.getState().player, combatRewardCards: ['stale'] },
        } as never);

        const granted = randomizeCombatDeckAction(store);

        expect(granted.length).toBeGreaterThan(0);
        expect(new Set(granted).size).toBe(granted.length); // no duplicates
        expect(granted.every((id) => FULL_POOL.has(id))).toBe(true);
        expect(store.getState().player.knownCards).toEqual(granted);
        expect(store.getState().player.combatRewardCards).toEqual([]);
    });
});
