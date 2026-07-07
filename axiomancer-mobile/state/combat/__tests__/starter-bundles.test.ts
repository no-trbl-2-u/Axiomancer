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

describe('Starter bundles — the present-deck picker (all themes)', () => {
    it('exposes a bundle for every combat theme, with the three shipped paths first', () => {
        const ids = STARTER_BUNDLES.map((b) => b.id);
        // The three reward-archetype paths keep their ids (app-routes test picks
        // `bleeding-edge`) and lead the list.
        expect(ids.slice(0, 3)).toEqual(['bleeding-edge', 'patient-defender', 'minds-unraveling']);
        // Every stance / aggression / gold theme is now selectable too.
        expect(ids).toEqual(
            expect.arrayContaining([
                'body-force', 'mind-logic', 'heart-will', 'raw-aggression', 'gold-showcase',
            ]),
        );
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
            // Each themed deck can brace from turn one (a GUARD/defend card).
            const hasGuard = b.cardIds.some((id) => getCard(id)?.verbClass === 'defend');
            expect(hasGuard).toBe(true);
        }
    });

    it('each themed bundle actually contains its theme cards', () => {
        const byId = Object.fromEntries(STARTER_BUNDLES.map((b) => [b.id, b]));
        const has = (id: string, pred: (c: NonNullable<ReturnType<typeof getCard>>) => boolean) =>
            byId[id]!.cardIds.some((c) => { const card = getCard(c); return !!card && pred(card); });
        expect(has('body-force', (c) => c.stance === 'body')).toBe(true);
        expect(has('mind-logic', (c) => c.stance === 'mind')).toBe(true);
        expect(has('heart-will', (c) => c.stance === 'heart')).toBe(true);
        expect(has('raw-aggression', (c) => c.verbClass === 'direct-damage')).toBe(true);
        expect(has('bleeding-edge', (c) => c.effectKind === 'dot')).toBe(true);
    });

    it('seeding a reward-archetype bundle tags the run with its hidden archetype', () => {
        const store = makeStore();
        store.setState({ player: { ...store.getState().player, knownSkills: [] } } as never);
        seedStarterBundleAction(store, 'bleeding-edge');
        const flags = (store.getState() as unknown as { flags?: string[] }).flags ?? [];
        expect(flags).toContain(BUNDLE_CHOSEN_FLAG);
        expect(chosenStarterBundle(store)?.id).toBe('bleeding-edge');
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
