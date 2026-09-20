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
 * PROFANE CANON (2026-08-08): the ten theme bundles became THREE campaign
 * snapshots of one evolving deck (threadbare 18 → pilgrim 30 → apostate 45).
 * The picker's contract is unchanged — one tile per seatable deck, every card
 * a real engine id, seeding tags the run — only its roster moved.
 */
describe('Starter bundles — the pre-run deck picker (the campaign snapshots)', () => {
    const EXPECTED_SIZES: Record<string, number> = {
        threadbare: 18,
        pilgrim: 30,
        apostate: 45,
    };

    it('exposes one bundle per campaign snapshot, in the engine display order', () => {
        const ids = STARTER_BUNDLES.map((b) => b.id);
        expect(ids).toEqual(['threadbare', 'pilgrim', 'apostate']);
        // No duplicate ids.
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('every bundle is a non-empty, playable deck drawn only from engine card ids', () => {
        for (const b of STARTER_BUNDLES) {
            expect(b.cardIds.length).toBe(EXPECTED_SIZES[b.id]);
            for (const id of b.cardIds) {
                expect(FULL_POOL.has(id)).toBe(true);
                expect(getCard(id)).toBeTruthy();
            }
            // Presentation: every tile carries its stage's two hallmark keywords.
            expect(b.pills.length).toBe(2);
            expect(b.description.length).toBeGreaterThan(0);
        }
    });

    it('each snapshot actually plays the canon spine (a spot check per stage)', () => {
        const byId = Object.fromEntries(STARTER_BUNDLES.map((b) => [b.id, b]));
        const has = (id: string, pred: (c: NonNullable<ReturnType<typeof getCard>>) => boolean) =>
            byId[id]!.cardIds.some((c) => { const card = getCard(c); return !!card && pred(card); });
        const effect = (needle: string) =>
            (c: NonNullable<ReturnType<typeof getCard>>) => (c.primaryEffectId ?? '').includes(needle);

        // The rot clock runs from the first snapshot to the last; the wall
        // arrives with the pilgrim trimming; the persistent zones are the
        // apostate's signature (the canon seats no oath before then).
        for (const id of ['threadbare', 'pilgrim', 'apostate']) {
            expect(has(id, effect('poison'))).toBe(true);
        }
        expect(has('threadbare', (c) => c.verbClass === 'defend')).toBe(true);
        expect(has('pilgrim', (c) => c.verbClass === 'defend')).toBe(true);
        expect(has('apostate', (c) => c.cardType === 'oath')).toBe(true);
        expect(has('apostate', (c) => c.cardType === 'hex')).toBe(true);
    });

    it('seeding a reward-archetype bundle tags the run with its hidden archetype', () => {
        const store = makeStore();
        store.setState({ player: { ...store.getState().player, knownCards: [] } } as never);
        seedStarterBundleAction(store, 'pilgrim');
        const flags = (store.getState() as unknown as { flags?: string[] }).flags ?? [];
        expect(flags).toContain(BUNDLE_CHOSEN_FLAG);
        expect(chosenStarterBundle(store)?.id).toBe('pilgrim');
        expect(runArchetype(store)).toBe('bleeder');
        expect(store.getState().player.knownCards.length).toBeGreaterThan(0);
    });

    it('seeding an unmapped-archetype bundle seeds its deck but applies no reward skew', () => {
        const store = makeStore();
        store.setState({ player: { ...store.getState().player, knownCards: [] } } as never);
        seedStarterBundleAction(store, 'threadbare'); // the Office maps to no reward archetype
        expect(chosenStarterBundle(store)?.id).toBe('threadbare');
        expect(runArchetype(store)).toBeNull(); // archetype: null → no skew tag
        expect(store.getState().player.knownCards.length).toBeGreaterThan(0);
    });

    it('the new-player default (phase 46b) resolves to the neutral Threadbare Office', () => {
        const bundle = starterBundleById(NEW_PLAYER_STARTER_BUNDLE_ID);
        expect(bundle?.id).toBe('threadbare');
        expect(bundle?.archetype).toBeNull(); // unmapped-archetype — same shape as the test above
    });
});
