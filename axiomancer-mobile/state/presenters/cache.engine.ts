/**
 * Loot-cache-choice presenter (Phase 63, replacing the retired Pick Pool
 * dice-pool minigame) — maps the engine session (`axiomancer-mechanics`
 * World/LootCacheChoice) onto a render-ready view-model. Pure: no store
 * writes, no rolls, no rule decisions.
 *
 * All three offers are always enabled — unlike `RestChoiceOffer`, nothing
 * here can be unaffordable or capped, so there is no `disabledReason` to
 * shape.
 */

import {
    getCardById,
    goodwillBonusFlag,
    GOODWILL_ALLY_CARD_ID,
    GOODWILL_ALLY_THRESHOLD,
    GOODWILL_BONUS_CURRENCY,
    GOODWILL_BONUS_THRESHOLD,
} from '@mechanics';
import type { LootCacheChoiceOfferId, LootCacheChoiceSession } from '@mechanics';
import type { AppStoreState } from '@/state/store';
import {
    CACHE_CHOICE_OFFER_DESC,
    CACHE_CHOICE_OFFER_LABEL,
} from './cache.copy';

// ---------------------------------------------------------------------------
// VM shapes
// ---------------------------------------------------------------------------

export interface CacheChoiceOfferVM {
    id: LootCacheChoiceOfferId;
    label: string;
    desc: string;
}

export interface CacheChoiceOutcomeVM {
    chosen: LootCacheChoiceOfferId;
    label: string;
    /** Set iff `chosen === 'card'`. */
    cardName: string | null;
    /** Non-empty iff `chosen === 'item'`. */
    itemNames: readonly string[];
    /** >0 iff `chosen === 'item'`. */
    currency: number;
    /** Set iff `chosen === 'sacrifice'` — the current map's tally AFTER this claim. */
    goodwillPreview: number | null;
    /** Phase 65 — the Ally's display name, set iff this claim will grant it. */
    allyGrantPreview: string | null;
    /** Phase 65 — the Tier 3 currency amount, set iff this claim will grant it. */
    bonusPreview: number | null;
}

export interface CacheChoiceVM {
    active: boolean;
    phase: LootCacheChoiceSession['phase'] | 'none';
    offers: readonly CacheChoiceOfferVM[];
    outcome: CacheChoiceOutcomeVM | null;
    /** The authored MapEvent one-liner; `null` falls back to the placeholder intro. */
    description: string | null;
}

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

const OFFER_IDS: readonly LootCacheChoiceOfferId[] = Object.freeze(['card', 'item', 'sacrifice']);

const OFFERS: readonly CacheChoiceOfferVM[] = Object.freeze(OFFER_IDS.map(id => ({
    id,
    label: CACHE_CHOICE_OFFER_LABEL[id],
    desc: CACHE_CHOICE_OFFER_DESC[id],
})));

const EMPTY_VM: CacheChoiceVM = Object.freeze({
    active: false,
    phase: 'none',
    offers: Object.freeze([]),
    outcome: null,
    description: null,
});

export function selectHasActiveCache(state: Pick<AppStoreState, 'cache'>): boolean {
    return state.cache?.session != null;
}

export function selectCacheVM(
    state: Pick<AppStoreState, 'cache' | 'mapGoodwill' | 'world' | 'player' | 'flags'>,
): CacheChoiceVM {
    const s = state.cache?.session;
    if (!s) return EMPTY_VM;

    const mapName = state.world?.currentMap?.name ?? '';
    const goodwillPreview = s.outcome?.sacrificed
        ? (state.mapGoodwill?.[mapName] ?? 0) + 1
        : null;
    const knownCards = state.player?.knownCards ?? [];
    const flags = state.flags ?? [];

    const outcome: CacheChoiceOutcomeVM | null = s.outcome === null ? null : {
        chosen: s.outcome.chosen,
        label: CACHE_CHOICE_OFFER_LABEL[s.outcome.chosen],
        cardName: s.outcome.rewardCardId === null ? null : (getCardById(s.outcome.rewardCardId)?.name ?? s.outcome.rewardCardId),
        itemNames: s.outcome.items.map(i => i.name),
        currency: s.outcome.currency,
        goodwillPreview,
        allyGrantPreview: goodwillPreview !== null
            && goodwillPreview >= GOODWILL_ALLY_THRESHOLD
            && !knownCards.includes(GOODWILL_ALLY_CARD_ID)
            ? (getCardById(GOODWILL_ALLY_CARD_ID)?.name ?? GOODWILL_ALLY_CARD_ID)
            : null,
        bonusPreview: goodwillPreview !== null
            && goodwillPreview >= GOODWILL_BONUS_THRESHOLD
            && !flags.includes(goodwillBonusFlag(mapName))
            ? GOODWILL_BONUS_CURRENCY
            : null,
    };

    return {
        active: true,
        phase: s.phase,
        offers: OFFERS,
        outcome,
        description: s.description,
    };
}
