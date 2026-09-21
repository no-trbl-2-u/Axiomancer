/**
 * Quest-reward payout — the resolver for the `Reward` union.
 *
 * ## The gap this closes
 *
 * `Reward` (see `./types.ts`) has always admitted `{ kind: 'item'; item: Item }`
 * and a bare `Item`, but the only place quest rewards are actually paid —
 * `Game/game.reducer.ts`'s `END_COMBAT` branch — handled `{ kind: 'currency' }`
 * and `{ kind: 'experience' }` and nothing else. An authored item reward would
 * have been read, matched no branch, and silently vanished: a quest the player
 * completed paying nothing. Same for `{ kind: 'card' }`.
 *
 * Nothing in the shipped content tree declares an item reward *today* (every
 * live `reward:` in `Continents/**` is currency or experience), so this was a
 * latent gap rather than a live loss — but it is the kind of gap that only
 * announces itself as "the quest I finished gave me nothing", long after the
 * content author has moved on. The resolver is exhaustive so the next authored
 * item reward pays.
 *
 * ## Where this runs
 *
 * `quest.engine.ts` owns log/objective machinery only and deliberately pays no
 * rewards; the payment belongs with the other reward kinds, at the store layer.
 * This module is the pure half of that payment so the rule is testable without
 * a `GameState`, and so every host (the reducer, a CLI, a future dialogue-side
 * completion) resolves a reward the same way.
 *
 * Item rewards route through the shared grant path (`Items/item-grant.ts`), so
 * a quest that hands over a signet relic obeys the same clone / never-destroy
 * contract as every other grant, and the caller can ask
 * `qualifiesForItemRewardScreen` whether it deserves the reward screen.
 */

import { grantItem } from '../Items/item-grant';
import type { Character } from '../Character/types';
import type { Item } from '../Items/types';
import type { Reward } from './types';

/** The object-shaped members of the `Reward` union. */
type KindedReward = Extract<Reward, { kind: string }>;

/** True for the object-shaped `{ kind: … }` rewards. */
export function isKindedReward(reward: Reward): reward is KindedReward {
    return typeof reward === 'object' && reward !== null && 'kind' in reward;
}

/**
 * True for the two shapes that hand over an `Item`: the tagged
 * `{ kind: 'item'; item }` and the bare `Item` the union also admits (which
 * carries `category`, not `kind`, and so falls through every `'kind' in reward`
 * guard in the codebase).
 */
export function isItemReward(reward: Reward | null | undefined): boolean {
    return itemOf(reward) !== null;
}

/** The `Item` a reward hands over, or `null` when it hands over none. */
export function itemOf(reward: Reward | null | undefined): Item | null {
    if (reward === null || reward === undefined) return null;
    if (typeof reward === 'string') return null;
    if (isKindedReward(reward)) {
        return reward.kind === 'item' ? reward.item : null;
    }
    // Bare `Item` member of the union — discriminated by `category`.
    return 'category' in reward ? (reward as Item) : null;
}

export interface QuestRewardPayout {
    /** The player after the reward was paid. Same reference when nothing paid. */
    player: Character;
    /**
     * Items actually granted, as the clones that entered inventory. A caller
     * asks `qualifiesForItemRewardScreen` on these to decide between the reward
     * screen and the inline grant.
     */
    grantedItems: Item[];
    /**
     * Card ids from `{ kind: 'card' }` rewards. Reported, NOT paid: card grants
     * run through the host's own known-cards path, and wiring that is a
     * separate call from closing the item gap. A host that ignores this field
     * behaves exactly as today.
     */
    unpaidCardIds: string[];
}

const empty = (player: Character): QuestRewardPayout => ({
    player,
    grantedItems: [],
    unpaidCardIds: [],
});

/**
 * Pay one quest reward against a player. Pure, total, and never throws:
 * an absent reward, or one of the bare string tags (`'experience'`,
 * `'currency'`, `'card'`, `'quest'` — which carry no amount and have never
 * been payable), returns the player unchanged.
 */
export function payQuestReward(
    player: Character,
    reward: Reward | undefined | null,
): QuestRewardPayout {
    if (reward === undefined || reward === null) return empty(player);
    if (typeof reward === 'string') return empty(player);

    const item = itemOf(reward);
    if (item !== null) {
        const { character, granted } = grantItem(player, item, { equip: false });
        return { player: character, grantedItems: [granted], unpaidCardIds: [] };
    }

    if (!isKindedReward(reward)) return empty(player);

    switch (reward.kind) {
        case 'currency':
            return empty({ ...player, currency: player.currency + reward.amount });
        case 'experience':
            return empty({ ...player, experience: player.experience + reward.amount });
        case 'card':
            return { player, grantedItems: [], unpaidCardIds: [reward.cardId] };
        default:
            return empty(player);
    }
}

/** Pay a list of rewards in declaration order, folding the results. */
export function payQuestRewards(
    player: Character,
    rewards: readonly Reward[] | undefined,
): QuestRewardPayout {
    let acc = empty(player);
    for (const reward of rewards ?? []) {
        const step = payQuestReward(acc.player, reward);
        acc = {
            player: step.player,
            grantedItems: [...acc.grantedItems, ...step.grantedItems],
            unpaidCardIds: [...acc.unpaidCardIds, ...step.unpaidCardIds],
        };
    }
    return acc;
}
