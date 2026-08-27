/**
 * Hermetic tests for the loot-cache-choice presenter's Phase 65 additions:
 * `selectCacheVM`'s `allyGrantPreview` / `bonusPreview` fields, which show
 * the player what a sacrifice claim will grant BEFORE they commit to it
 * (mirroring how `goodwillPreview` already previews the tally increment).
 */

import { describe, expect, it } from '@jest/globals';
import type { LootCacheChoiceSession } from '@mechanics';

import { selectCacheVM } from '../cache.engine';
import type { AppStoreState } from '@/state/store';

function sacrificeSession(): LootCacheChoiceSession {
    return {
        phase: 'outcome',
        cardCandidate: '',
        itemCandidates: [],
        currencyCandidate: 0,
        description: null,
        outcome: {
            chosen: 'sacrifice',
            rewardCardId: null,
            items: [],
            currency: 0,
            sacrificed: true,
        },
        seed: 1,
    } as unknown as LootCacheChoiceSession;
}

type CacheState = Pick<AppStoreState, 'cache' | 'mapGoodwill' | 'world' | 'player' | 'flags'>;

function makeState(opts: {
    goodwill?: number;
    knownCards?: readonly string[];
    flags?: readonly string[];
}): CacheState {
    const { goodwill = 0, knownCards = [], flags = [] } = opts;
    return {
        cache: { session: sacrificeSession() } as unknown as AppStoreState['cache'],
        mapGoodwill: { 'northern-forest': goodwill } as unknown as AppStoreState['mapGoodwill'],
        world: { currentMap: { name: 'northern-forest' } } as unknown as AppStoreState['world'],
        player: { knownCards } as unknown as AppStoreState['player'],
        flags: [...flags] as AppStoreState['flags'],
    };
}

describe('selectCacheVM — Phase 65 goodwill previews', () => {
    it('shows no grant preview below Tier 2', () => {
        const vm = selectCacheVM(makeState({ goodwill: 0 }));
        expect(vm.outcome?.goodwillPreview).toBe(1);
        expect(vm.outcome?.allyGrantPreview).toBeNull();
        expect(vm.outcome?.bonusPreview).toBeNull();
    });

    it('previews the Ally grant once the claim would reach Tier 2', () => {
        const vm = selectCacheVM(makeState({ goodwill: 1 }));
        expect(vm.outcome?.goodwillPreview).toBe(2);
        expect(vm.outcome?.allyGrantPreview).toBe('The Sworn Second');
        expect(vm.outcome?.bonusPreview).toBeNull();
    });

    it('does not preview the Ally grant if already known', () => {
        const vm = selectCacheVM(makeState({ goodwill: 1, knownCards: ['the-sworn-second'] }));
        expect(vm.outcome?.allyGrantPreview).toBeNull();
    });

    it('previews the currency bonus once the claim would reach Tier 3', () => {
        const vm = selectCacheVM(makeState({ goodwill: 2 }));
        expect(vm.outcome?.goodwillPreview).toBe(3);
        expect(vm.outcome?.bonusPreview).toBe(25);
    });

    it('does not preview the bonus if the map flag is already set', () => {
        const vm = selectCacheVM(
            makeState({ goodwill: 2, flags: ['village-goodwill-bonus:northern-forest'] }),
        );
        expect(vm.outcome?.bonusPreview).toBeNull();
    });
});
