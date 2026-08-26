/**
 * Loot-cache choice encounter ("The Reliquary") — engine types (Phase 63,
 * replacing the retired Pick Pool dice-pool minigame).
 *
 * A loot-cache node is one irreversible choice of three — `card` (a rolled
 * reward card), `item` (a tier-scaled consumable haul + the node's
 * currency), or `sacrifice` (nothing to the player; the host tallies a
 * per-map goodwill counter). Two-way like every minigame here: the engine
 * never reads `GameState`, and the host settles the outcome against the
 * real `Character` at claim time. Unlike `RestChoice`'s `cut`, no offer
 * here needs a sub-picker — the `card`/`item` candidates are rolled by the
 * host (who alone has `Character`/RNG-with-deck-context access) and simply
 * named in the outcome, so every offer commits straight to `outcome`.
 */

import type { SeedInput } from '../seed';
import type { Item } from '../../Items/types';

/** The three offers on the table. Exactly one may be committed; all three are always live. */
export type LootCacheChoiceOfferId = 'card' | 'item' | 'sacrifice';

export type LootCacheChoicePhase =
    | 'offer'      // three offers on the table
    | 'outcome'    // the settled ledger
    | 'done';      // host claimed

/** The claim-time ledger. Narrow on `chosen` for the fields that apply. */
export interface LootCacheChoiceOutcome {
    chosen: LootCacheChoiceOfferId;
    /** The host-rolled card id to grant — non-null iff `chosen === 'card'`. */
    rewardCardId: string | null;
    /** The host-rolled consumables to grant — non-empty iff `chosen === 'item'`. */
    items: readonly Item[];
    /** The authored node's currency to grant — >0 iff `chosen === 'item'`. */
    currency: number;
    /** True iff `chosen === 'sacrifice'` — the host increments its goodwill tally. */
    sacrificed: boolean;
}

export interface LootCacheChoiceSession {
    phase: LootCacheChoicePhase;
    /** `rollCombatCardRewards(player, rng, 1)[0]` — the `card` offer's candidate. */
    cardCandidate: string;
    /** `rollCacheReward(...)` output — the `item` offer's candidates. */
    itemCandidates: readonly Item[];
    /** The authored MapEvent payload's currency, carried for the `item` offer. */
    currencyCandidate: number;
    /** The authored MapEvent one-liner, preferred over a placeholder intro when present. */
    description: string | null;
    outcome: LootCacheChoiceOutcome | null;
    seed: SeedInput;
}
