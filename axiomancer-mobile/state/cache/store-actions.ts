/**
 * Loot-cache-choice encounter ("The Reliquary", Phase 63) — store action
 * glue, replacing the retired Pick Pool dice-pool minigame.
 *
 * The pure engine lives in `axiomancer-mechanics` (World/LootCacheChoice);
 * these wrappers thread the cache node's one irreversible choice — `card`
 * (a rolled reward card) / `item` (a tier-scaled consumable haul + the
 * node's currency) / `sacrifice` (nothing to the player; increments the
 * per-map goodwill tally) — through the mobile `cache` slice. The engine
 * never reads `GameState`; both candidates (the card to offer, the items to
 * offer) are rolled here, before the session opens, exactly mirroring how
 * `state/rest/store-actions.ts` rolls `deckCardIds` before creating a
 * `RestChoiceSession`.
 */

import type { Character, GameState, Item } from '@mechanics';

import {
    addRewardCard,
    chooseLootCacheChoiceOffer as engineChooseOffer,
    claimLootCacheChoiceOutcome as engineClaim,
    createLootCacheChoiceSession,
    rollCacheReward,
    rollCombatCardRewards,
} from '@mechanics';
import type { CacheLootTier, LootCacheChoiceOfferId, LootCacheChoiceOutcome, LootCacheChoiceSession } from '@mechanics';
import { resolveMinigameSeed } from '../minigame-seeds';
import { EMPTY_CACHE_SLICE, type AppStore } from '../store';

/**
 * Flag prefix banking a keeper's keepsake. Historical only — the retired
 * Pick Pool engine minted these on its deepest layer; the sacrifice offer
 * does not mint a new one (the goodwill counter itself is the record).
 * `/memoir`'s REMAINS section still reads old ones back.
 */
export const CACHE_KEEPSAKE_FLAG_PREFIX = 'cache-keepsake:';

/**
 * Dev/test seed override (`globalThis.__AXM_CACHE_SEED__`), mirroring
 * the hazard/rest/blacksmith hooks. Seeds the `item` offer's
 * `rollCacheReward` roll; the `card` offer rolls via `Math.random` like
 * every other card-reward draft (`rollCombatRewardAction`) — card offers
 * were never part of the minigame seed-replay contract.
 */
declare global {
    // eslint-disable-next-line no-var
    var __AXM_CACHE_SEED__: number | undefined;
}

function setSession(store: AppStore, session: LootCacheChoiceSession | null): void {
    store.setState({ cache: { session } });
}

export interface BeginLootCacheChoiceOptions {
    /** The authored node's currency (offered whole by the `item` branch). */
    currency?: number;
    /** The authored MapEvent one-liner. */
    description?: string | null;
    /** Reward depth for the `item` offer's roll — caller derives from the current map. */
    tier?: CacheLootTier;
    seed?: number;
}

/** Start a loot-cache-choice node. One cache at a time. */
export function beginLootCacheChoiceAction(store: AppStore, options: BeginLootCacheChoiceOptions = {}): boolean {
    const state = store.getState();
    if (state.cache?.session) return false;
    const seed = resolveMinigameSeed('cache', options.seed, globalThis.__AXM_CACHE_SEED__);

    const player = (state as unknown as GameState).player;
    const tier = options.tier ?? 'modest';
    const itemCandidates = rollCacheReward({ playerLevel: player?.level ?? 1, seed, tier });
    const cardCandidate = rollCombatCardRewards(player as Character, Math.random, 1)[0];

    setSession(store, createLootCacheChoiceSession(seed, {
        cardCandidate,
        itemCandidates,
        currencyCandidate: options.currency ?? 0,
        description: options.description,
    }));
    return true;
}

/** offer -> outcome. Commits ONE offer — the other two vanish. */
export function chooseLootCacheChoiceOfferAction(store: AppStore, offer: LootCacheChoiceOfferId): void {
    const s = store.getState().cache?.session;
    if (!s) return;
    setSession(store, engineChooseOffer(s, offer));
}

export interface ClaimLootCacheChoiceResult {
    applied: boolean;
    outcome: LootCacheChoiceOutcome | null;
    /** The current map's new goodwill tally — set only when `outcome.sacrificed`. */
    goodwill: number | null;
}

const NOOP_CLAIM: ClaimLootCacheChoiceResult = Object.freeze({
    applied: false,
    outcome: null,
    goodwill: null,
});

/**
 * Confirms the outcome ledger and applies the cache node to the engine
 * `GameState`: `card` appends the rolled card to the deck, `item` appends
 * the rolled items + currency to the inventory, `sacrifice` increments the
 * current map's goodwill tally. Clears the slice and persists.
 */
export function claimLootCacheChoiceOutcomeAction(store: AppStore): ClaimLootCacheChoiceResult {
    const s = store.getState().cache?.session;
    if (!s || s.phase !== 'outcome' || !s.outcome) return NOOP_CLAIM;
    const done = engineClaim(s);
    if (done.phase !== 'done') return NOOP_CLAIM;

    const outcome = s.outcome;
    const state = store.getState() as unknown as GameState;
    let player: Character = state.player;
    let goodwill: number | null = null;

    if (outcome.chosen === 'card' && outcome.rewardCardId) {
        player = addRewardCard(player, outcome.rewardCardId);
    } else if (outcome.chosen === 'item') {
        player = {
            ...player,
            inventory: [...player.inventory, ...(outcome.items as Item[])],
            currency: player.currency + outcome.currency,
        };
    }

    const patch: Record<string, unknown> = {
        player,
        cache: EMPTY_CACHE_SLICE,
    };

    if (outcome.chosen === 'sacrifice') {
        const mapName = state.world?.currentMap?.name;
        const prevGoodwill = state.mapGoodwill ?? {};
        goodwill = mapName ? (prevGoodwill[mapName] ?? 0) + 1 : null;
        if (mapName) {
            patch.mapGoodwill = { ...prevGoodwill, [mapName]: goodwill };
        }
    }

    store.setState(patch as never);

    try {
        store.getState().save();
    } catch {
        // Persistence failures must not strand the player on the ledger.
    }

    return { applied: true, outcome, goodwill };
}
