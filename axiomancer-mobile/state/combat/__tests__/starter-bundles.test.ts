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

describe('Starter bundles — the pre-run deck picker (spec 32 v3 themed decks)', () => {
    it('exposes one bundle per themed preset deck, in the engine display order', () => {
        const ids = STARTER_BUNDLES.map((b) => b.id);
        expect(ids).toEqual([
            'erosion', 'oratory', 'foundry', 'penitent', 'standstill',
            'augury', 'tithe', 'grace', 'bastion', 'refrain',
        ]);
        // No duplicate ids.
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('every bundle is a non-empty, playable deck drawn only from engine card ids', () => {
        for (const b of STARTER_BUNDLES) {
            expect(b.cardIds.length).toBe(15); // the 4/4/2/2/1/1/1 recipe
            for (const id of b.cardIds) {
                expect(FULL_POOL.has(id)).toBe(true);
                expect(getCard(id)).toBeTruthy();
            }
            // Presentation: every tile carries its theme's two signature keywords.
            expect(b.pills.length).toBe(2);
            expect(b.description.length).toBeGreaterThan(0);
        }
    });

    it('each themed bundle actually plays its theme (a spot check per engine)', () => {
        const byId = Object.fromEntries(STARTER_BUNDLES.map((b) => [b.id, b]));
        const has = (id: string, pred: (c: NonNullable<ReturnType<typeof getCard>>) => boolean) =>
            byId[id]!.cardIds.some((c) => { const card = getCard(c); return !!card && pred(card); });
        const effect = (needle: string) =>
            (c: NonNullable<ReturnType<typeof getCard>>) => (c.primaryEffectId ?? '').includes(needle);
        // Erosion stacks DoTs; Grace never strikes (control texture); Bastion
        // braces; every theme ships its enchantment + disenchant rares.
        expect(has('erosion', effect('poison'))).toBe(true);
        expect(has('erosion', effect('bleed'))).toBe(true);
        expect(has('bastion', (c) => c.verbClass === 'defend')).toBe(true);
        for (const b of STARTER_BUNDLES) {
            expect(has(b.id, (c) => c.cardType === 'enchantment')).toBe(true);
            expect(has(b.id, (c) => c.cardType === 'disenchant')).toBe(true);
        }
    });

    it('seeding a reward-archetype bundle tags the run with its hidden archetype', () => {
        const store = makeStore();
        store.setState({ player: { ...store.getState().player, knownSkills: [] } } as never);
        seedStarterBundleAction(store, 'erosion');
        const flags = (store.getState() as unknown as { flags?: string[] }).flags ?? [];
        expect(flags).toContain(BUNDLE_CHOSEN_FLAG);
        expect(chosenStarterBundle(store)?.id).toBe('erosion');
        expect(runArchetype(store)).toBe('bleeder');
        expect(store.getState().player.knownSkills.length).toBeGreaterThan(0);
    });

    it('seeding an unmapped-archetype bundle seeds its deck but applies no reward skew', () => {
        const store = makeStore();
        store.setState({ player: { ...store.getState().player, knownSkills: [] } } as never);
        seedStarterBundleAction(store, 'foundry'); // Forge maps to no reward archetype
        expect(chosenStarterBundle(store)?.id).toBe('foundry');
        expect(runArchetype(store)).toBeNull(); // archetype: null → no skew tag
        expect(store.getState().player.knownSkills.length).toBeGreaterThan(0);
    });
});
