/**
 * Loot-cache-choice screen copy (Phase 63, replacing the retired Pick Pool
 * minigame). Neutral register on purpose, same doctrine as `rest.copy.ts`.
 */

import type { LootCacheChoiceOfferId } from '@mechanics';

export const CACHE_CHOICE_EYEBROW = 'A FIND, UNCLAIMED';
export const CACHE_CHOICE_TITLE = 'THREE WAYS TO LEAVE IT';
export const CACHE_CHOICE_INTRO =
    'The node is spent the moment you stopped here. Pick one — there is no walking back out.';

export const CACHE_CHOICE_OFFER_LABEL: Record<LootCacheChoiceOfferId, string> = Object.freeze({
    card: 'TAKE A CARD',
    item: 'TAKE THE GOODS',
    sacrifice: 'LEAVE IT FOR THE VILLAGE',
});

export const CACHE_CHOICE_OFFER_DESC: Record<LootCacheChoiceOfferId, string> = Object.freeze({
    card: 'One card, straight into the deck.',
    item: "Whatever's inside, plus what it's worth.",
    sacrifice: "Take nothing. It's noted.",
});

export const CACHE_OUTCOME_EYEBROW = 'SETTLED';
export const CACHE_OUTCOME_CLAIM_LABEL = 'MOVE ON';

export function cacheOutcomeCardChip(cardName: string): string {
    return `+ ${cardName.toUpperCase()}`;
}

export function cacheOutcomeItemChip(itemName: string): string {
    return `+ ${itemName.toUpperCase()}`;
}

export function cacheOutcomeCurrencyChip(currency: number): string {
    return `+${currency} SHILLINGS`;
}

export function cacheOutcomeGoodwillChip(mapLabel: string, count: number): string {
    return `HELPED ${mapLabel.toUpperCase()} ${count} TIME${count === 1 ? '' : 'S'}`;
}
