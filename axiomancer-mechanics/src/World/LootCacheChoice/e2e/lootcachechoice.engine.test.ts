/**
 * Loot-cache-choice engine ("card" / "item" / "sacrifice") — hermetic unit
 * suite (Phase 63).
 *
 * No RNG stub needed: every transition here is deterministic by
 * construction (the candidates are host-rolled and passed in). Driven
 * through the PUBLIC BARREL (`../../../index`), the same module path the
 * mobile screen imports.
 */

import { describe, it, expect } from 'vitest';

import {
    createLootCacheChoiceSession,
    chooseLootCacheChoiceOffer,
    claimLootCacheChoiceOutcome,
    consumableLibrary,
} from '../../../index';
import type { LootCacheChoiceSession, Item } from '../../../index';

const ITEMS: Item[] = consumableLibrary.slice(0, 1).map(item => ({ ...item, quantity: 1 }));

function offerSession(overrides: Partial<Parameters<typeof createLootCacheChoiceSession>[1]> = {}): LootCacheChoiceSession {
    return createLootCacheChoiceSession(1, {
        cardCandidate: 'spoiled-poultice',
        itemCandidates: ITEMS,
        currencyCandidate: 4,
        description: 'A rusted lockbox, half-buried.',
        ...overrides,
    });
}

describe('loot-cache-choice — offer phase + lifecycle', () => {
    it('opens in the offer phase with no outcome yet', () => {
        const s = offerSession();
        expect(s.phase).toBe('offer');
        expect(s.outcome).toBeNull();
        expect(s.description).toBe('A rusted lockbox, half-buried.');
    });

    it('falls back to a null description when the payload carries none', () => {
        const s = offerSession({ description: undefined });
        expect(s.description).toBeNull();
    });

    it('trims a blank description down to null', () => {
        const s = offerSession({ description: '   ' });
        expect(s.description).toBeNull();
    });

    it('an unknown offer id is a silent no-op', () => {
        const s = offerSession();
        // @ts-expect-error — deliberately invalid id for the no-op contract
        expect(chooseLootCacheChoiceOffer(s, 'bogus')).toBe(s);
    });

    it('cannot commit an offer outside the offer phase', () => {
        const s = offerSession();
        const outcome = chooseLootCacheChoiceOffer(s, 'card');
        expect(chooseLootCacheChoiceOffer(outcome, 'item')).toBe(outcome);
    });
});

describe('loot-cache-choice — card offer', () => {
    it('offer -> outcome, naming the host-rolled candidate', () => {
        const s = offerSession();
        const outcome = chooseLootCacheChoiceOffer(s, 'card');
        expect(outcome.phase).toBe('outcome');
        expect(outcome.outcome).toEqual({
            chosen: 'card',
            rewardCardId: 'spoiled-poultice',
            items: [],
            currency: 0,
            sacrificed: false,
        });
    });
});

describe('loot-cache-choice — item offer', () => {
    it('offer -> outcome, carrying the host-rolled items + authored currency', () => {
        const s = offerSession();
        const outcome = chooseLootCacheChoiceOffer(s, 'item');
        expect(outcome.phase).toBe('outcome');
        expect(outcome.outcome).toEqual({
            chosen: 'item',
            rewardCardId: null,
            items: ITEMS,
            currency: 4,
            sacrificed: false,
        });
    });

    it('carries zero items/currency through cleanly when the node authored none', () => {
        const s = offerSession({ itemCandidates: [], currencyCandidate: 0 });
        const outcome = chooseLootCacheChoiceOffer(s, 'item');
        expect(outcome.outcome).toEqual({
            chosen: 'item', rewardCardId: null, items: [], currency: 0, sacrificed: false,
        });
    });
});

describe('loot-cache-choice — sacrifice offer', () => {
    it('offer -> outcome, granting nothing but flagging sacrificed', () => {
        const s = offerSession();
        const outcome = chooseLootCacheChoiceOffer(s, 'sacrifice');
        expect(outcome.phase).toBe('outcome');
        expect(outcome.outcome).toEqual({
            chosen: 'sacrifice', rewardCardId: null, items: [], currency: 0, sacrificed: true,
        });
    });
});

describe('loot-cache-choice — claim', () => {
    it('outcome -> done', () => {
        const s = offerSession();
        const outcome = chooseLootCacheChoiceOffer(s, 'sacrifice');
        const done = claimLootCacheChoiceOutcome(outcome);
        expect(done.phase).toBe('done');
        expect(done.outcome).toEqual(outcome.outcome);
    });

    it('cannot claim from the offer phase (no outcome yet)', () => {
        const s = offerSession();
        expect(claimLootCacheChoiceOutcome(s)).toBe(s);
    });

    it('claiming twice is a no-op the second time', () => {
        const s = offerSession();
        const outcome = chooseLootCacheChoiceOffer(s, 'card');
        const done = claimLootCacheChoiceOutcome(outcome);
        expect(claimLootCacheChoiceOutcome(done)).toBe(done);
    });
});
