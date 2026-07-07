import { describe, expect, it } from '@jest/globals';
import { COMBAT_REWARD_POOL, STARTING_SKILL_IDS, getCard } from '@mechanics';

import {
    STARTER_BUNDLES,
    seedStarterBundleAction,
    chosenStarterBundle,
    runArchetype,
    BUNDLE_CHOSEN_FLAG,
} from '@/state/combat/store-actions';
import { createAppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

const FULL_POOL = new Set([...STARTING_SKILL_IDS, ...COMBAT_REWARD_POOL]);

function makeStore() {
    return createAppStore({ adapter: createMemoryAdapter() });
}

describe('Starter bundles — the present-deck picker (keyword deck types)', () => {
    it('exposes a bundle per keyword deck type, in stable order', () => {
        const ids = STARTER_BUNDLES.map((b) => b.id);
        // Keyword deck types (not stance colours), then the gold/rare bench.
        // The app-routes test picks `bleed` (the first bundle).
        expect(ids).toEqual([
            'bleed', 'poison', 'confusion', 'dread', 'guard', 'sustain', 'gold-showcase',
        ]);
        // No duplicate ids.
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('every bundle is a non-empty, playable deck drawn only from engine card ids', () => {
        for (const b of STARTER_BUNDLES) {
            expect(b.cardIds.length).toBeGreaterThan(0);
            expect(new Set(b.cardIds).size).toBe(b.cardIds.length);
            for (const id of b.cardIds) {
                expect(FULL_POOL.has(id)).toBe(true);
            }
            // Each keyword deck can brace from turn one (a GUARD/defend card).
            const hasGuard = b.cardIds.some((id) => getCard(id)?.verbClass === 'defend');
            expect(hasGuard).toBe(true);
        }
    });

    it('each keyword bundle actually contains its keyword cards', () => {
        const byId = Object.fromEntries(STARTER_BUNDLES.map((b) => [b.id, b]));
        const has = (id: string, pred: (c: NonNullable<ReturnType<typeof getCard>>) => boolean) =>
            byId[id]!.cardIds.some((c) => { const card = getCard(c); return !!card && pred(card); });
        const effect = (needle: string) =>
            (c: NonNullable<ReturnType<typeof getCard>>) => (c.primaryEffectId ?? '').includes(needle);
        expect(has('bleed', effect('bleed'))).toBe(true);
        expect(has('poison', effect('poison'))).toBe(true);
        expect(has('confusion', effect('confusion'))).toBe(true);
        expect(has('dread', (c) => effect('fear')(c) || effect('despair')(c))).toBe(true);
        expect(has('guard', (c) => c.verbClass === 'defend')).toBe(true);
        expect(has('sustain', (c) => c.verbClass === 'buff-self')).toBe(true);
    });

    it('seeding a reward-archetype bundle tags the run with its hidden archetype', () => {
        const store = makeStore();
        store.setState({ player: { ...store.getState().player, knownSkills: [] } } as never);
        seedStarterBundleAction(store, 'bleed');
        const flags = (store.getState() as unknown as { flags?: string[] }).flags ?? [];
        expect(flags).toContain(BUNDLE_CHOSEN_FLAG);
        expect(chosenStarterBundle(store)?.id).toBe('bleed');
        expect(runArchetype(store)).toBe('bleeder');
        expect(store.getState().player.knownSkills.length).toBeGreaterThan(0);
    });

    it('seeding a pure theme-test bundle seeds its deck but applies no reward skew', () => {
        const store = makeStore();
        store.setState({ player: { ...store.getState().player, knownSkills: [] } } as never);
        seedStarterBundleAction(store, 'gold-showcase');
        expect(chosenStarterBundle(store)?.id).toBe('gold-showcase');
        expect(runArchetype(store)).toBeNull(); // archetype: null → no skew tag
        expect(store.getState().player.knownSkills.length).toBeGreaterThan(0);
    });
});
