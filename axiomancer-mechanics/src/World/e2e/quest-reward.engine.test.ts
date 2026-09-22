/**
 * Quest-reward payout — hermetic E2E tests.
 *
 * The gap being closed: `Reward` admits `{ kind: 'item'; item }` and a bare
 * `Item`, but the only site that pays quest rewards (`Game/game.reducer.ts`'s
 * END_COMBAT branch) matched `'currency'` and `'experience'` only, so an item
 * reward was read, matched nothing, and vanished. These tests pin the resolver
 * that closes it, and the shape of the content tree that made the gap latent
 * rather than live.
 */

import { describe, it, expect } from 'vitest';

import { createCharacter } from '../../Character/index';
import { getRelicById } from '../../Items/relic.library';
import { qualifiesForItemRewardScreen } from '../../Items/item-grant';
import { payQuestReward, payQuestRewards, isItemReward, itemOf } from '../quest-reward';
import { MAP_REGISTRY } from '../map.registry';
import type { Character } from '../../Character/types';
import type { Consumable, Equipment, Item } from '../../Items/types';
import type { Reward } from '../types';

const player = (): Character =>
    createCharacter({
        name: 'Questor',
        level: 2,
        baseStats: { body: 2, mind: 2, heart: 2 },
        currency: 10,
    });

const ring = (): Equipment =>
    JSON.parse(JSON.stringify(getRelicById('relic-disarming-plea'))) as Equipment;

const potion = (): Consumable => ({
    id: 'quest-draught',
    name: 'Draught',
    description: 'A test draught.',
    category: 'consumable',
    quantity: 1,
    healAmount: 10,
});

describe('payQuestReward — the kinds that always paid', () => {
    it('currency adds to the purse', () => {
        const res = payQuestReward(player(), { kind: 'currency', amount: 25 });
        expect(res.player.currency).toBe(35);
        expect(res.grantedItems).toHaveLength(0);
    });

    it('experience adds to the tally', () => {
        const p = player();
        const res = payQuestReward(p, { kind: 'experience', amount: 30 });
        expect(res.player.experience).toBe(p.experience + 30);
    });

    it('a bare string tag carries no amount and pays nothing, unchanged', () => {
        const p = player();
        for (const tag of ['experience', 'currency', 'card', 'quest'] as const) {
            const res = payQuestReward(p, tag);
            expect(res.player).toBe(p);
            expect(res.grantedItems).toHaveLength(0);
        }
    });

    it('an absent reward is a total no-op', () => {
        const p = player();
        expect(payQuestReward(p, undefined).player).toBe(p);
        expect(payQuestReward(p, null).player).toBe(p);
    });
});

describe('payQuestReward — the item gap', () => {
    it('{ kind: item } actually lands in inventory', () => {
        const reward: Reward = { kind: 'item', item: ring() };
        const res = payQuestReward(player(), reward);

        expect(res.grantedItems).toHaveLength(1);
        expect(res.grantedItems[0]!.id).toBe('relic-disarming-plea');
        expect(res.player.inventory.some(i => i.id === 'relic-disarming-plea')).toBe(true);
    });

    it('grants but does not equip — the screen owns that choice (D6/D7)', () => {
        const res = payQuestReward(player(), { kind: 'item', item: ring() });
        expect(res.player.equipment.accessories).toHaveLength(0);
    });

    it('the granted item is a clone, so the authored reward row is never aliased', () => {
        const source = ring();
        const res = payQuestReward(player(), { kind: 'item', item: source });
        expect(res.grantedItems[0]).not.toBe(source);
    });

    it('a bare `Item` reward — the union member that carries `category`, not `kind` — also pays', () => {
        const res = payQuestReward(player(), ring() as Reward);
        expect(res.grantedItems).toHaveLength(1);
        expect(res.player.inventory.some(i => i.id === 'relic-disarming-plea')).toBe(true);
    });

    it('a consumable item reward stacks like any other grant', () => {
        let p = player();
        p = payQuestReward(p, { kind: 'item', item: potion() }).player;
        p = payQuestReward(p, { kind: 'item', item: potion() }).player;
        const rows = p.inventory.filter(i => i.id === 'quest-draught');
        expect(rows).toHaveLength(1);
        expect((rows[0] as Consumable).quantity).toBe(2);
    });

    it('{ kind: card } is reported as unpaid rather than silently dropped', () => {
        const res = payQuestReward(player(), { kind: 'card', cardId: 'card-test' });
        expect(res.unpaidCardIds).toEqual(['card-test']);
        expect(res.grantedItems).toHaveLength(0);
    });
});

describe('isItemReward / itemOf', () => {
    it('recognises both item-bearing shapes and nothing else', () => {
        expect(isItemReward({ kind: 'item', item: ring() })).toBe(true);
        expect(isItemReward(ring() as Reward)).toBe(true);
        expect(isItemReward({ kind: 'currency', amount: 5 })).toBe(false);
        expect(isItemReward({ kind: 'experience', amount: 5 })).toBe(false);
        expect(isItemReward({ kind: 'card', cardId: 'c' })).toBe(false);
        expect(isItemReward('currency')).toBe(false);
    });

    it('itemOf hands back the item a reward carries', () => {
        expect(itemOf({ kind: 'item', item: ring() })?.id).toBe('relic-disarming-plea');
        expect(itemOf({ kind: 'currency', amount: 1 })).toBeNull();
    });
});

describe('payQuestRewards — folding a list', () => {
    it('pays every reward in declaration order', () => {
        const rewards: Reward[] = [
            { kind: 'currency', amount: 5 },
            { kind: 'item', item: ring() },
            { kind: 'experience', amount: 10 },
            { kind: 'item', item: potion() },
        ];
        const p = player();
        const res = payQuestRewards(p, rewards);

        expect(res.player.currency).toBe(15);
        expect(res.player.experience).toBe(p.experience + 10);
        expect(res.grantedItems.map(i => i.id)).toEqual(['relic-disarming-plea', 'quest-draught']);
    });

    it('an empty or absent list is a no-op', () => {
        const p = player();
        expect(payQuestRewards(p, []).player).toBe(p);
        expect(payQuestRewards(p, undefined).player).toBe(p);
    });
});

describe('the content tree today', () => {
    it('every authored quest reward is currency or experience — the item gap was latent, not live', () => {
        const kinds = new Set<string>();
        const defs = Object.values(MAP_REGISTRY).flatMap(byMap => Object.values(byMap));
        for (const def of defs) {
            if (!def) continue;
            for (const quest of def.quests ?? []) {
                const reward = quest.reward as Reward | undefined;
                if (reward === undefined) continue;
                if (typeof reward === 'string') { kinds.add(`tag:${reward}`); continue; }
                if ('kind' in reward) { kinds.add(reward.kind); continue; }
                kinds.add('bare-item');
            }
        }
        expect(defs.length).toBeGreaterThan(0);
        // If this set ever grows an `item` entry, the payout above is what pays it.
        expect([...kinds].sort()).toEqual(['currency', 'experience']);
    });

    it('a relic quest reward would route to the reward screen under D5', () => {
        const res = payQuestReward(player(), { kind: 'item', item: ring() });
        const granted = res.grantedItems[0] as Item;
        expect(qualifiesForItemRewardScreen(granted)).toBe(true);
    });
});
