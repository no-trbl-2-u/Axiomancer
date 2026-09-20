import { describe, expect, it } from '@jest/globals';
import { COMBAT_REWARD_POOL, STARTING_CARD_IDS, getCard, listDeckPresets } from '@mechanics';

import {
    applyCombatDeckPresetAction,
    COMBAT_DECK_PRESETS,
    randomizeCombatDeckAction,
} from '@/state/combat/store-actions';
import { createAppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

// Profane Canon (2026-08-08) — the starter baseline plus the three campaign
// presets (snapshots of one deck evolving early → mid → late).
const expectedPresetIds = [
    'starter-baseline',
    'threadbare',
    'pilgrim',
    'apostate',
];

const EXPECTED_SIZES: Record<string, number> = { threadbare: 18, pilgrim: 30, apostate: 45 };

const FULL_POOL = new Set([...STARTING_CARD_IDS, ...COMBAT_REWARD_POOL]);

function makeStore() {
    return createAppStore({ adapter: createMemoryAdapter() });
}

describe('Combat deck presets', () => {
    it('exposes the starter baseline + the three campaign presets in campaign order', () => {
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

    it('campaign presets mirror the engine recipes verbatim (18 / 30 / 45, cap 50)', () => {
        const engine = Object.fromEntries(listDeckPresets().map((p) => [p.id, p]));
        for (const preset of COMBAT_DECK_PRESETS) {
            if (preset.id === 'starter-baseline') continue;
            expect(preset.cardIds).toEqual([...engine[preset.id]!.cardIds]);
            expect(preset.cardIds.length).toBe(EXPECTED_SIZES[preset.id]);
            expect(preset.cardIds.length).toBeLessThanOrEqual(50);
            // The MTG copy law: never more than 4 of a card.
            const counts = new Map<string, number>();
            for (const id of preset.cardIds) counts.set(id, (counts.get(id) ?? 0) + 1);
            for (const n of counts.values()) expect(n).toBeLessThanOrEqual(4);
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

        const result = applyCombatDeckPresetAction(store, 'pilgrim');

        expect(result.presetId).toBe('pilgrim');
        expect(result.cardIds.length).toBeGreaterThan(0);
        expect(store.getState().player.knownCards).toEqual(result.cardIds);
        expect(store.getState().player.combatRewardCards).toEqual([]);
    });

    it('is deterministic — the same preset yields the same deck every time', () => {
        const first = applyCombatDeckPresetAction(makeStore(), 'apostate');
        const second = applyCombatDeckPresetAction(makeStore(), 'apostate');
        expect(first.cardIds).toEqual(second.cardIds);
    });

    it('starter-baseline restores the engine starting deck', () => {
        const result = applyCombatDeckPresetAction(makeStore(), 'starter-baseline');
        expect(result.cardIds).toEqual([...STARTING_CARD_IDS]);
        // Phase 104 — the engine starting deck is the grey office.
        expect(result.cardIds).toContain('grey-strike');
        expect(result.cardIds).toContain('grey-ward');
    });

    it('THE LINEAGE LAW: each later preset contains its predecessor minus removals (never a fresh deck)', () => {
        // The three presets are snapshots of ONE evolving deck: everything in
        // an earlier snapshot either survives into the next or was removed at
        // a removal encounter — the engine pins the exact multiset math; here
        // we pin the campaign-facing consequence: pilgrim and apostate share
        // most of their bulk with their predecessor.
        const [threadbare, pilgrim, apostate] = ['threadbare', 'pilgrim', 'apostate']
            .map((id) => COMBAT_DECK_PRESETS.find((p) => p.id === id)!.cardIds);
        const overlap = (a: readonly string[], b: readonly string[]) =>
            [...new Set(a)].filter((id) => b.includes(id)).length;
        expect(overlap(pilgrim, threadbare)).toBeGreaterThanOrEqual(5);
        expect(overlap(apostate, pilgrim)).toBeGreaterThanOrEqual(14);
    });

    it('every campaign deck carries exact aspect thirds (the generalized color law)', () => {
        for (const preset of COMBAT_DECK_PRESETS) {
            if (preset.id === 'starter-baseline') continue;
            const counts = { body: 0, mind: 0, heart: 0 };
            for (const id of preset.cardIds) {
                const card = getCard(id);
                expect(card).toBeTruthy();
                // `stance` is the projected cardStanceColor = philosophicalAspect.
                counts[card!.stance as 'body' | 'mind' | 'heart'] += 1;
            }
            const third = preset.cardIds.length / 3;
            expect(counts).toEqual({ body: third, mind: third, heart: third });
        }
    });

    it('every preset card resolves through the engine card projection', () => {
        for (const preset of COMBAT_DECK_PRESETS) {
            for (const id of new Set(preset.cardIds)) {
                const card = getCard(id);
                expect(card).toBeTruthy();
                expect(card!.rarity).toMatch(/^(common|uncommon|rare)$/);
                expect(card!.cardType).toMatch(/^(spell|oath|hex)$/);
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
