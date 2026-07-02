/**
 * Loot-cache encounter ("The Reliquary") — engine types.
 *
 * The dedicated treasure experience (Phase 137): instead of a silent
 * item grant, a cache opens in three LAYERS — the lid, the false
 * bottom, the keeper's tithe. Deeper layers hold more and are likelier
 * trapped. Push-your-luck on hidden information: each layer's trap
 * fate is sealed at creation; one PROBE per cache reveals the next
 * layer's fate before committing. A sprung trap bites, spoils that
 * layer's loot, and slams the cache shut.
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
    /**
     * The layer's sealed trap fate. HIDDEN INFORMATION: set at session
     * creation, surfaced to the UI only once `revealed` (the probe) or
     * after the layer is opened. Presenters must not leak it early.
     */
    trapped: boolean;
    /** Vitae the trap bites when sprung. */
    trapBite: number;
    /** True once the probe exposed this layer's fate. */
    revealed: boolean;
    opened: boolean;
    /** True when the trap fired and this layer's loot was lost. */
    spoiled: boolean;
    loot: LootCacheLayerLoot;
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
    /** True when this card slammed the cache (trap fired). */
    slammed: boolean;
}

// ---------------------------------------------------------------------------
// Outcome
// ---------------------------------------------------------------------------

/**
 * Outcome tiers:
 *  - `emptied` — all three layers lifted clean. The whole hoard.
 *  - `prudent` — sealed it early and walked away unbitten.
 *  - `stung`   — a trap fired: bitten, one layer spoiled, cache shut.
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
    | 'delving'  // choosing: delve / probe / seal
    | 'card'     // a result card is open
    | 'outcome'  // the ledger
    | 'done';    // host claimed

export interface LootCacheSession {
    phase: LootCachePhase;
    layers: readonly LootCacheLayerState[];
    /** Next unopened layer index; 3 = nothing left. */
    depth: number;
    /** True once the one probe is spent. */
    probeUsed: boolean;
    /** Accrued across sprung traps; the host settles it at claim. */
    bittenVitae: number;
    card: LootCacheCard | null;
    outcome: LootCacheOutcome | null;
    seed: SeedInput;
    rng: LootCacheRngState;
}
