/**
 * Loot-cache choice engine ("card" / "item" / "sacrifice") — pure engine
 * transitions (Phase 63).
 *
 * Replaces The Reliquary's Pick Pool dice-pool session with T's ruling
 * (2026-08-15: "Card reward, item reward, or sacrifice reward.") — a
 * loot-cache node is one irreversible choice of three. State machine:
 *
 *   offer ──chooseLootCacheChoiceOffer('card'|'item'|'sacrifice')──▶ outcome
 *                                                                        │
 *                                                          claimLootCacheChoiceOutcome
 *                                                                        ▼
 *                                                                      done
 *
 * Every offer commits straight to `outcome` — unlike `RestChoice`'s `cut`,
 * no offer here needs a sub-picker: the `card`/`item` candidates are rolled
 * by the host (who alone has `Character`/RNG-with-deck-context access)
 * before the session is even created, and the engine only names them.
 */

import type {
    LootCacheChoiceOfferId,
    LootCacheChoiceOutcome,
    LootCacheChoiceSession,
} from './lootcachechoice.types';
import type { SeedInput } from '../seed';
import type { Item } from '../../Items/types';

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export interface CreateLootCacheChoiceOptions {
    /** `rollCombatCardRewards(player, rng, 1)[0]` — the `card` offer's candidate. */
    cardCandidate: string;
    /** `rollCacheReward(...)` output — the `item` offer's candidates. */
    itemCandidates: readonly Item[];
    /** The authored MapEvent payload's currency, carried for the `item` offer. */
    currencyCandidate: number;
    /** The authored MapEvent one-liner. `null`/absent falls back to the presenter's placeholder intro. */
    description?: string | null;
}

/** Builds the offer session from the host-rolled candidates. Nothing is read from `GameState`. */
export function createLootCacheChoiceSession(
    seed: SeedInput,
    opts: CreateLootCacheChoiceOptions,
): LootCacheChoiceSession {
    return {
        phase: 'offer',
        cardCandidate: opts.cardCandidate,
        itemCandidates: opts.itemCandidates.slice(),
        currencyCandidate: opts.currencyCandidate,
        description: opts.description?.trim() || null,
        outcome: null,
        seed,
    };
}

function sealOutcome(s: LootCacheChoiceSession, outcome: LootCacheChoiceOutcome): LootCacheChoiceSession {
    return { ...s, phase: 'outcome', outcome };
}

// ---------------------------------------------------------------------------
// Offer commit
// ---------------------------------------------------------------------------

/**
 * offer → outcome. Commits ONE offer — the other two vanish. An invalid
 * phase or unknown offer id is an invalid call: silent no-op (matches the
 * sibling engines' unknown-id contract).
 */
export function chooseLootCacheChoiceOffer(
    s: LootCacheChoiceSession,
    offer: LootCacheChoiceOfferId,
): LootCacheChoiceSession {
    if (s.phase !== 'offer') return s;

    if (offer === 'card') {
        return sealOutcome(s, {
            chosen: 'card', rewardCardId: s.cardCandidate, items: [], currency: 0, sacrificed: false,
        });
    }
    if (offer === 'item') {
        return sealOutcome(s, {
            chosen: 'item', rewardCardId: null, items: s.itemCandidates, currency: s.currencyCandidate, sacrificed: false,
        });
    }
    if (offer === 'sacrifice') {
        return sealOutcome(s, {
            chosen: 'sacrifice', rewardCardId: null, items: [], currency: 0, sacrificed: true,
        });
    }
    return s;
}

// ---------------------------------------------------------------------------
// Claim
// ---------------------------------------------------------------------------

/** outcome → done. The host applies the ledger to the real `Character`/`GameState` and seals the visit. */
export function claimLootCacheChoiceOutcome(s: LootCacheChoiceSession): LootCacheChoiceSession {
    if (s.phase !== 'outcome' || s.outcome === null) return s;
    return { ...s, phase: 'done' };
}
