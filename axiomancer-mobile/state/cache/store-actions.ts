/**
 * Loot-cache encounter ("The Reliquary") — store action glue.
 *
 * The pure engine lives in `axiomancer-mechanics` (World/LootCache);
 * these wrappers thread the cache through the mobile `cache` slice.
 * The engine deals in item REFS — the slice's `stash` keeps the real
 * `Item`s behind those refs so claim can map kept uids back into the
 * inventory. Trap bites settle at claim and never kill: vitae floors
 * at 1 (the cache maims, it does not kill — same doctrine as the
 * hazard and gathering minigames).
 */

import type { GameState, Item } from '@mechanics';

import {
    beginLootCache as engineBegin,
    channelLootCacheInsight as engineChannelInsight,
    claimLootCacheOutcome as engineClaim,
    continueLootCacheCard as engineContinue,
    createLootCacheSession,
    delveLootCache as engineDelve,
    pushLootCachePick as enginePushPick,
    retreatLootCachePick as engineRetreatPick,
    sealLootCache as engineSeal,
} from '@mechanics';
import type { CacheItemRef, LootCacheOutcomeTier, LootCacheSession } from '@mechanics';
import { resolveMinigameSeed } from '../minigame-seeds';
import { EMPTY_CACHE_SLICE, type AppStore } from '../store';
import { rollCacheLoot, type CacheLootTier } from '@mechanics';

/** Flag prefix banking a keeper's keepsake. */
export const CACHE_KEEPSAKE_FLAG_PREFIX = 'cache-keepsake:';

/** Flag set once the guided first delve is completed or skipped. */
export const CACHE_TUTORIAL_FLAG = 'cache-tutorial-done';

/**
 * The tutorial session is pinned so the coach script always matches the
 * board: seed 1's first pick pool on THE LID (difficulty 5) rolls
 * `[6, 1, 2]` — one slip, eight progress — cracking the layer clean on
 * the very first push without ever brushing the jam threshold (2 slips).
 */
export const CACHE_TUTORIAL_SEED = 1;
export const CACHE_TUTORIAL_TIER: CacheLootTier = 'modest';
export const CACHE_TUTORIAL_CURRENCY = 4;

/**
 * Dev/test seed override (`globalThis.__AXM_CACHE_SEED__`), mirroring
 * the hazard/gathering/quest hooks.
 */
declare global {
    // eslint-disable-next-line no-var
    var __AXM_CACHE_SEED__: number | undefined;
}

function setSession(store: AppStore, session: LootCacheSession | null): void {
    const prev = store.getState().cache ?? EMPTY_CACHE_SLICE;
    store.setState({ cache: { ...prev, session } });
}

export interface BeginLootCacheOptions {
    /** The authored payload loot (deep-cloned by the engine handler upstream). */
    items?: readonly Item[];
    currency?: number;
    seed?: number;
    /**
     * Phase 129 — roll a real engine-truth loot/relic reward set
     * scaled to the player's level instead of a static roster. Ignored
     * when an explicit `items` list is passed (authored set pieces /
     * dev paths win). The tier scales item count + the unique chance;
     * the engine owns rarity. See `state/cache/loot-table.ts`.
     */
    lootTable?: { tier: CacheLootTier };
    /** Start the guided first delve (pinned seed + tier/currency unless overridden). */
    tutorial?: boolean;
}

export function beginLootCacheAction(store: AppStore, options: BeginLootCacheOptions = {}): boolean {
    const state = store.getState();
    if (state.cache?.session) return false; // one cache at a time
    const seed = resolveMinigameSeed(
        'cache',
        options.seed,
        globalThis.__AXM_CACHE_SEED__,
        options.tutorial ? CACHE_TUTORIAL_SEED : undefined,
    );

    // Explicit authored items win; otherwise roll the level-scaled table
    // when the caller opts in (organic play) or this is the pinned
    // tutorial delve (fixed 'modest' tier). Falls back to an empty list
    // (currency-only cache) when neither applies.
    let items: readonly Item[] = options.items ?? [];
    if (options.items === undefined) {
        const lootTable = options.lootTable ?? (options.tutorial ? { tier: CACHE_TUTORIAL_TIER } : undefined);
        if (lootTable) {
            const playerLevel = (state as unknown as GameState).player?.level ?? 1;
            items = rollCacheLoot({ playerLevel, seed, tier: lootTable.tier });
        }
    }
    const currency = options.currency ?? (options.tutorial ? CACHE_TUTORIAL_CURRENCY : 0);
    const stash: Record<string, Item> = {};
    const refs: CacheItemRef[] = items.map((item, i) => {
        const uid = `cache-${i}`;
        stash[uid] = item;
        return { uid, name: item.name };
    });

    store.setState({
        cache: {
            session: createLootCacheSession(seed, refs, currency),
            stash,
            tutorial: options.tutorial === true,
        },
    });
    return true;
}

/**
 * Marks the guided first delve as done (completed or skipped): sets the
 * persistent flag so the map trigger never re-runs it, and persists. The
 * session (if any) keeps running as normal play.
 */
export function completeLootCacheTutorialAction(store: AppStore, skipped: boolean): void {
    const state = store.getState() as unknown as GameState;
    if (!(state.flags ?? []).includes(CACHE_TUTORIAL_FLAG)) {
        store.setState({ flags: [...(state.flags ?? []), CACHE_TUTORIAL_FLAG] } as never);
        try {
            store.getState().save();
        } catch {
            // Persistence failures must not strand the coach.
        }
    }
    void skipped;
}

/** The find acknowledged: intro → delving. */
export function startLootCacheDelvingAction(store: AppStore): void {
    const s = store.getState().cache?.session;
    if (!s) return;
    setSession(store, engineBegin(s));
}

export function delveLootCacheAction(store: AppStore): void {
    const s = store.getState().cache?.session;
    if (!s) return;
    setSession(store, engineDelve(s));
}

/** Rolls the pick pool against the active layer's lock: resolves or continues picking. */
export function pushLootCachePickAction(store: AppStore): void {
    const s = store.getState().cache?.session;
    if (!s) return;
    setSession(store, enginePushPick(s));
}

/** Spends the one per-session Insight charge for a bonus die on the next push. */
export function channelLootCacheInsightAction(store: AppStore): void {
    const s = store.getState().cache?.session;
    if (!s) return;
    setSession(store, engineChannelInsight(s));
}

/** Abandons the current layer's pick attempt cleanly — no loot, no bite. */
export function retreatLootCachePickAction(store: AppStore): void {
    const s = store.getState().cache?.session;
    if (!s) return;
    setSession(store, engineRetreatPick(s));
}

export function sealLootCacheAction(store: AppStore): void {
    const s = store.getState().cache?.session;
    if (!s) return;
    setSession(store, engineSeal(s));
}

export function continueLootCacheCardAction(store: AppStore): void {
    const s = store.getState().cache?.session;
    if (!s) return;
    setSession(store, engineContinue(s));
}

export interface ClaimLootCacheResult {
    applied: boolean;
    itemsAdded: number;
    currency: number;
    bittenVitae: number;
    tier: LootCacheOutcomeTier | null;
    keepsakes: readonly string[];
}

const NOOP_CLAIM: ClaimLootCacheResult = Object.freeze({
    applied: false,
    itemsAdded: 0,
    currency: 0,
    bittenVitae: 0,
    tier: null,
    keepsakes: Object.freeze([]),
});

/**
 * Confirms the ledger and applies the find to the engine `GameState`:
 * kept refs map back to real items, currency lands, the bite settles
 * (vitae floors at 1), keepsakes bank as flags. Clears the slice and
 * persists.
 */
export function claimLootCacheOutcomeAction(store: AppStore): ClaimLootCacheResult {
    const slice = store.getState().cache;
    const s = slice?.session;
    if (!slice || !s || !s.outcome) return NOOP_CLAIM;
    const done = engineClaim(s);
    if (done.phase !== 'done') return NOOP_CLAIM;

    const outcome = s.outcome;
    const state = store.getState() as unknown as GameState;
    const player = state.player;

    const keptItems = outcome.itemsKept
        .map(ref => slice.stash[ref.uid])
        .filter((item): item is Item => item !== undefined);

    let flags = state.flags ?? [];
    for (const keepsake of outcome.keepsakes) {
        const flag = `${CACHE_KEEPSAKE_FLAG_PREFIX}${keepsake}`;
        if (!flags.includes(flag)) flags = [...flags, flag];
    }

    store.setState({
        player: {
            ...player,
            health: Math.max(1, player.health - outcome.bittenVitae),
            currency: player.currency + outcome.currencyKept,
            inventory: [...player.inventory, ...keptItems],
        },
        flags,
        cache: EMPTY_CACHE_SLICE,
    } as never);

    try {
        store.getState().save();
    } catch {
        // Persistence failures must not strand the player on the ledger.
    }

    return {
        applied: true,
        itemsAdded: keptItems.length,
        currency: outcome.currencyKept,
        bittenVitae: outcome.bittenVitae,
        tier: outcome.tier,
        keepsakes: outcome.keepsakes,
    };
}

/** Clears the cache without loot or bites (dev / navigation escape). */
export function abandonLootCacheAction(store: AppStore): void {
    const prev = store.getState().cache ?? EMPTY_CACHE_SLICE;
    store.setState({ cache: { ...prev, session: null, stash: {} } });
}
