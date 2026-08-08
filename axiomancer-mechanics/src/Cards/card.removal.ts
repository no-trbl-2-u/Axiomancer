/**
 * Phase 52a — DECK REMOVAL: the engine's first way to take a card OUT.
 *
 * The engine had no card removal at all before this. (`removeCardFromDeck` in
 * `World/Hazard/hazard.engagement.ts` is a HAZARD-deck helper for a different
 * subsystem — it is not this, and nothing here imports it.) This module is the
 * pure primitive; the rest-choice engine (52c) and the picker screen (52d)
 * sit on top. No player-facing surface lands here.
 *
 * ## What "the deck" means
 *
 * `buildCombatDeck(player, flags)` is the authority, and it deals from TWO
 * lists with different semantics:
 *
 *   - the CARD BASE — the curated loadout (`combat-loadout-card:` flags) when
 *     any loadout flag exists, otherwise `player.knownCards` — and whichever
 *     of the two is in force is **de-duplicated**, so the base contributes at
 *     most ONE deck copy per id however many times it lists that id;
 *   - the REWARDS — `player.combatRewardCards`, duplicates KEPT (extra copies
 *     are the whole point of a deckbuilder pickup). This is the ONLY list whose
 *     duplicates reach the deck.
 *
 * Removal therefore has to answer to whichever list actually owns the copy, or
 * it is invisible: strip a card from `knownCards` while a loadout flag still
 * names it and `buildCombatDeck` deals it anyway.
 *
 * ## The rules, in order
 *
 *   1. The card must be IN the deck `buildCombatDeck` would deal. If it is
 *      not, refuse (`not-in-deck`) — a known-but-benched card is not in the
 *      deck, and benching is already free.
 *   2. The deck must be above `MIN_COMBAT_DECK_SIZE`. At the floor, refuse
 *      (`deck-at-floor`) — REFUSED, never clamped.
 *   3. `combatRewardCards` gives up ONE copy if it has one. Rewards are the
 *      bloat the player is paying to undo; the unlock set is the base. One
 *      copy, never all of them: a player who removed a 4-of would otherwise
 *      nuke a quarter of their deck for one price. The loadout is NOT touched
 *      on this branch — the reward copy is the copy that left.
 *   4. Otherwise the CARD BASE gives it up, and there the id leaves ENTIRELY:
 *      every loadout slot naming it AND every `knownCards` entry. That looks
 *      like more than "one copy" until you read `buildCombatDeck` — the base is
 *      de-duplicated before it is dealt, so however many times it lists the id
 *      it contributes exactly ONE deck copy, and stripping all of its entries
 *      removes exactly ONE deck copy. Anything less is invisible: drop one of
 *      three `combat-loadout-card:thin-hymn:*` slots and the deck is unchanged.
 *      (Both lists really do carry duplicates in shipped data — the mobile
 *      starter-bundle path writes the preset recipe into `knownCards` verbatim,
 *      3× copies and all.)
 *
 * Every accepted removal increments `Character.cardRemovals`, the per-run
 * counter the escalating price reads (`card.removal.pricing.ts`).
 *
 * ## What this does NOT do
 *
 * It spends no currency (52c's transaction), touches no RNG (removal is fully
 * deterministic — there is nothing to roll), and goes nowhere near the LOCKED
 * MECHANICS: Conviction, the Surge meter and the Dice system are not read or
 * written here. A thinner deck draws the same hands off the same dice.
 */

import type { Character } from '../Character/types';
import { buildCombatDeck } from '../Combat/combat.deck';
import { decodeCombatLoadout, removeFromLoadout } from '../Combat/combat.loadout';
import { cardRemovalsOf } from './card.removal.pricing';
import type {
    CardRemovalRefusalCode,
    CardRemovalResult,
    CardRemovalSource,
} from './card.removal.types';

/**
 * The deck-size floor. Removal that would take `buildCombatDeck`'s output
 * below this is REFUSED, not clamped.
 *
 * **12, derived from the shipped Profane Canon (84ef85b), not chosen.** The
 * campaign presets are snapshots of ONE deck evolving — threadbare 18 →
 * pilgrim 30 → apostate 45 under a 50-card hard cap — and the LINEAGE LAW
 * (`PRESET_LINEAGE`, machine-checked in `Combat/e2e/deck-presets.engine.test.ts`)
 * spells out the removals each stage makes. Apply them and the canon's own
 * removal story dips to:
 *
 *   - 18 − `PILGRIM_REMOVED` (6 copies)  = **12**  ← the low-water mark
 *   - 30 − `APOSTATE_REMOVED` (8 copies) = 22
 *
 * So 12 is the TIGHTEST floor under which every documented removal in the
 * shipped campaign is still legal, and one card lower than any of them is not.
 * Two corroborations: 12 is divisible by 3, so the presets' exact-aspect-thirds
 * law (4/4/4) survives at the floor — 10 cannot be an aspect-balanced deck; and
 * 12 is 2.4× `COMBAT_HAND_SIZE` (5), below which the draw pile reshuffles
 * inside a single round and every fight deals the same hand.
 *
 * (The brief's opening proposal of 10 was justified as "the smallest shipped
 * preset shape". That justification died with the Profane Canon: no preset,
 * cap, or pin in the tree is 10 any more. `card-removal.engine.test.ts` pins
 * the derivation, so a future re-cut of the lineage forces this to be re-derived
 * rather than silently drifting.)
 */
export const MIN_COMBAT_DECK_SIZE = 12;

/** Loud copy per refusal code. Kept beside the codes so they never drift. */
function refusalReason(code: CardRemovalRefusalCode, cardId: string, deckSize: number): string {
    switch (code) {
        case 'not-in-deck':
            return `Cannot remove '${cardId}': it is not in the combat deck. `
                + 'Only cards the deck actually deals can be removed — a card you '
                + 'know but have not seated is already out of the fight.';
        case 'deck-at-floor':
            return `Cannot remove '${cardId}': the deck is at its floor of `
                + `${MIN_COMBAT_DECK_SIZE} cards (currently ${deckSize}). `
                + 'A deck this thin deals the same hand every fight. Earn more '
                + 'cards before cutting another.';
    }
}

/** Returns `list` with the FIRST occurrence of `id` dropped. */
function dropOneCopy(list: readonly string[], id: string): string[] {
    const i = list.indexOf(id);
    return i === -1 ? list.slice() : [...list.slice(0, i), ...list.slice(i + 1)];
}

/**
 * Removes one copy of `cardId` from the player's combat deck, or refuses.
 *
 * PURE: returns a new `Character` and a new flag array on success; on refusal
 * it returns the SAME `Character` reference it was handed (so a caller can
 * assert nothing moved) plus a copy of the flags.
 *
 * @param player - The character whose deck is being thinned. Never mutated.
 * @param cardId - The card id to remove one copy of.
 * @param flags  - `GameState.flags`. REQUIRED for loadout reconciliation: when
 *   loadout flags exist, `buildCombatDeck` deals the curated list INSTEAD of
 *   `knownCards`, so a removal that ignores them appears to do nothing.
 *   Defaults to `[]` (the no-loadout, `knownCards` path).
 * @returns A {@link CardRemovalResult} — narrow on `ok`. A refusal is a
 *   first-class value carrying a stable `code` and a loud `reason`; nothing is
 *   thrown, and the floor is never silently clamped.
 *
 * @example
 * const result = removeCardFromCombatDeck(player, 'spoiled-poultice', state.flags);
 * if (!result.ok) return showRefusal(result.refusal.reason);
 * apply({ player: result.player, flags: result.flags });
 */
export function removeCardFromCombatDeck(
    player: Character,
    cardId: string,
    flags: readonly string[] = [],
): CardRemovalResult {
    const deckBefore = buildCombatDeck(player, flags);
    const deckSizeBefore = deckBefore.length;
    const removals = cardRemovalsOf(player);

    const refuse = (code: CardRemovalRefusalCode): CardRemovalResult => ({
        ok: false,
        player,
        flags: flags.slice(),
        cardId,
        removedFrom: null,
        loadoutReconciled: false,
        deckSizeBefore,
        deckSizeAfter: deckSizeBefore,
        removals,
        floor: MIN_COMBAT_DECK_SIZE,
        refusal: {
            code,
            reason: refusalReason(code, cardId, deckSizeBefore),
            cardId,
            deckSize: deckSizeBefore,
            floor: MIN_COMBAT_DECK_SIZE,
        },
    });

    // Rule 1 — it has to be in the deck the engine would actually deal.
    if (!deckBefore.includes(cardId)) return refuse('not-in-deck');
    // Rule 2 — the floor is a refusal, never a clamp.
    if (deckSizeBefore <= MIN_COMBAT_DECK_SIZE) return refuse('deck-at-floor');

    const rewards = player.combatRewardCards ?? [];
    const known = player.knownCards ?? [];

    let nextRewards = rewards;
    let nextKnown = known;
    let nextFlags = flags.slice();
    let removedFrom: CardRemovalSource;
    let loadoutReconciled = false;

    if (rewards.includes(cardId)) {
        // Rule 3 — rewards drain first, ONE copy, loadout untouched.
        nextRewards = dropOneCopy(rewards, cardId);
        removedFrom = 'rewards';
    } else {
        // Rule 4 — the card base gives it up, and it goes completely: the base
        // is de-duplicated before it is dealt, so every entry has to go for one
        // deck copy to leave. `removeFromLoadout` drops one slot per call, so
        // drain it (reusing the codec rather than re-deriving the flag format).
        removedFrom = 'known';
        while (decodeCombatLoadout(nextFlags).includes(cardId)) {
            nextFlags = removeFromLoadout(nextFlags, cardId);
            loadoutReconciled = true;
        }
        const kept = known.filter(id => id !== cardId);
        if (kept.length !== known.length) nextKnown = kept;
    }

    // Only write the lists that actually changed, so a sparse-optional
    // `combatRewardCards` is never materialised into an empty array.
    const nextPlayer: Character = { ...player, cardRemovals: removals + 1 };
    if (nextKnown !== known) nextPlayer.knownCards = nextKnown;
    if (nextRewards !== rewards) nextPlayer.combatRewardCards = nextRewards;

    return {
        ok: true,
        player: nextPlayer,
        flags: nextFlags,
        cardId,
        removedFrom,
        loadoutReconciled,
        deckSizeBefore,
        deckSizeAfter: buildCombatDeck(nextPlayer, nextFlags).length,
        removals: removals + 1,
        floor: MIN_COMBAT_DECK_SIZE,
        refusal: null,
    };
}

export {
    CARD_REMOVAL_PRICING_PLACEHOLDER,
    cardRemovalPrice,
    cardRemovalPriceFor,
    cardRemovalsOf,
    canAffordCardRemoval,
} from './card.removal.pricing';
export type {
    CardRemovalRefusal,
    CardRemovalRefusalCode,
    CardRemovalResult,
    CardRemovalSource,
    CardRemovalAccepted,
    CardRemovalRefused,
} from './card.removal.types';
