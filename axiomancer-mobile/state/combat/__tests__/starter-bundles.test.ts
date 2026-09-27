import { describe, expect, it } from '@jest/globals';
import { COMBAT_REWARD_POOL, STARTING_CARD_IDS, getCard } from '@mechanics';

import {
    STARTER_BUNDLES,
    NEW_PLAYER_STARTER_BUNDLE_ID,
    seedStarterBundleAction,
    starterBundleById,
    chosenStarterBundle,
    runArchetype,
    BUNDLE_CHOSEN_FLAG,
} from '@/state/combat/store-actions';
import { createAppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

const FULL_POOL = new Set([...STARTING_CARD_IDS, ...COMBAT_REWARD_POOL]);

function makeStore() {
    return createAppStore({ adapter: createMemoryAdapter() });
}

/**
 * THE CARD PURGE (2026-09-27, D36): the campaign snapshots went with the
 * cards they dealt. One preset survives — the grey office every fresh run
 * opens with — so the picker exposes exactly one bundle. The picker's
 * contract is unchanged: one tile per seatable deck, every card a real
 * engine id, seeding tags the run.
 */
describe('Starter bundles — the pre-run deck picker (the grey office)', () => {
    it('exposes one bundle per engine preset, in the engine display order', () => {
        const ids = STARTER_BUNDLES.map((b) => b.id);
        expect(ids).toEqual(['grey']);
        // No duplicate ids.
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('every bundle is a non-empty, playable deck drawn only from engine card ids', () => {
        for (const b of STARTER_BUNDLES) {
            expect(b.cardIds).toEqual([...STARTING_CARD_IDS]);
            for (const id of b.cardIds) {
                expect(FULL_POOL.has(id)).toBe(true);
                expect(getCard(id)).toBeTruthy();
            }
            // Presentation: every tile carries its stage's two hallmark keywords.
            expect(b.pills.length).toBe(2);
            expect(b.description.length).toBeGreaterThan(0);
        }
    });

    it('seeding an unmapped-archetype bundle seeds its deck but applies no reward skew', () => {
        const store = makeStore();
        store.setState({ player: { ...store.getState().player, knownCards: [] } } as never);
        seedStarterBundleAction(store, 'grey'); // the grey office maps to no reward archetype
        const flags = (store.getState() as unknown as { flags?: string[] }).flags ?? [];
        expect(flags).toContain(BUNDLE_CHOSEN_FLAG);
        expect(chosenStarterBundle(store)?.id).toBe('grey');
        expect(runArchetype(store)).toBeNull(); // archetype: null → no skew tag
        expect(store.getState().player.knownCards).toEqual([...STARTING_CARD_IDS]);
    });

    it('the new-player default (phase 46b) resolves to the grey office', () => {
        const bundle = starterBundleById(NEW_PLAYER_STARTER_BUNDLE_ID);
        expect(bundle?.id).toBe('grey');
        expect(bundle?.archetype).toBeNull(); // unmapped-archetype — same shape as the test above
    });
});
