/**
 * Loot-cache encounter ("The Reliquary") — engine types.
 *
 * The dedicated treasure experience (Phase 137, redesigned as the "Pick
 * Pool" lockpicking minigame): instead of a silent item grant, a cache
 * opens in three LAYERS — the lid, the false bottom, the keeper's tithe.
 * Deeper layers hold more and take more cracking. Push-your-luck on LIVE
 * dice-pool risk: each layer has a public difficulty (a target progress
 * number) the player cracks by rolling a d6 pool and choosing, after
 * every roll, whether to push for more progress or bank/retreat. A jam
 * (too many slipped dice in one roll) bites vitae, spoils that layer's
 * loot, and closes it — play continues to the next layer, it does not
 * end the whole session. A single per-session Insight charge grants a
 * bonus die on a layer's opening roll.
 *
 * Two-way like the hazard and gathering minigames: the engine never
 * reads `GameState`. The host passes the authored payload in (item
 * refs + currency) and applies the outcome (kept refs, currency,
 * bitten vitae) at claim time.
 */

import type { SeedInput } from '../seed';
import type { LootCacheRngState } from './lootcache.rng';

// ---------------------------------------------------------------------------
// Loot references
// ---------------------------------------------------------------------------

/**
 * An opaque handle to a host-side item. The engine deals in refs only;
 * the host maps kept uids back to real `Item`s at claim.
 */
export interface CacheItemRef {
    uid: string;
    name: string;
}

// ---------------------------------------------------------------------------
// Layers
// ---------------------------------------------------------------------------

export type LootCacheLayerIndex = 0 | 1 | 2;

export const LOOT_CACHE_LAYER_COUNT = 3;

export interface LootCacheLayerLoot {
    items: readonly CacheItemRef[];
    currency: number;
    /** Keepsake label minted by the deepest layer ('' = none). */
    keepsake: string;
}

export interface LootCacheLayerState {
    index: LootCacheLayerIndex;
    name: string;
    flavor: string;
    /** Progress needed to crack this layer's lock. Public from the start. */
    difficulty: number;
    /** Vitae the pick bites when it jams. */
    trapBite: number;
    opened: boolean;
    /** True when the pick jammed and this layer's loot was lost. */
    spoiled: boolean;
    loot: LootCacheLayerLoot;
}

// ---------------------------------------------------------------------------
// Pick Pool (live dice-pool lockpicking)
// ---------------------------------------------------------------------------

/** One roll of the pick pool against the current layer. */
export interface LootCachePickRoll {
    /** Face values rolled this attempt, including the bonus die if insight was spent. */
    dice: readonly number[];
    /** Count of dice showing 1 ("slips"). */
    slips: number;
    /** Progress added this roll (sum of non-1 dice). */
    gained: number;
    jammed: boolean;
    insightSpent: boolean;
}

/** Live state of the pick attempt in progress on the current layer. */
export interface LootCachePickState {
    layerIndex: LootCacheLayerIndex;
    progress: number;
    pushes: number;
    lastRoll: LootCachePickRoll | null;
    /** True when the next push should add the insight bonus die. */
    insightPending: boolean;
}

// ---------------------------------------------------------------------------
// Cards (result flashes between decisions)
// ---------------------------------------------------------------------------

export interface LootCacheCard {
    title: string;
    body: string;
    /** Loot surfaced by this card (display). */
    items: readonly CacheItemRef[];
    currency: number;
    keepsake: string;
    /** Vitae bitten by this card (display; accrues on the session). */
    bite: number;
    /** True when this card slammed the cache (jam fired). */
    slammed: boolean;
    /** The final roll that resolved the layer, when applicable. */
    pickRoll: LootCachePickRoll | null;
}

// ---------------------------------------------------------------------------
// Outcome
// ---------------------------------------------------------------------------

/**
 * Outcome tiers:
 *  - `emptied` — all three layers lifted clean. The whole hoard.
 *  - `prudent` — sealed it early and walked away unbitten.
 *  - `stung`   — a pick jammed: bitten, one layer spoiled, that layer shut.
 */
export type LootCacheOutcomeTier = 'emptied' | 'prudent' | 'stung';

export interface LootCacheOutcome {
    tier: LootCacheOutcomeTier;
    itemsKept: readonly CacheItemRef[];
    currencyKept: number;
    keepsakes: readonly string[];
    bittenVitae: number;
    layersOpened: number;
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export type LootCachePhase =
    | 'intro'    // the find, described
    | 'delving'  // choosing: delve / seal
    | 'picking'  // live dice-pool pick attempt on the current layer
    | 'card'     // a result card is open
    | 'outcome'  // the ledger
    | 'done';    // host claimed

export interface LootCacheSession {
    phase: LootCachePhase;
    layers: readonly LootCacheLayerState[];
    /** Next unopened layer index; 3 = nothing left. */
    depth: number;
    /** True once the one per-session Insight charge is spent. */
    insightUsed: boolean;
    /** Accrued across jammed picks; the host settles it at claim. */
    bittenVitae: number;
    /** Non-null only during `'picking'`. */
    pick: LootCachePickState | null;
    card: LootCacheCard | null;
    outcome: LootCacheOutcome | null;
    seed: SeedInput;
    rng: LootCacheRngState;
}
