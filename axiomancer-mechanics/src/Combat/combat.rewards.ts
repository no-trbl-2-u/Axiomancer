/**
 * Spec 26b deckbuilder — combat card rewards + the card-unlock hook.
 *
 * Two distinct progression levers (per the design):
 *   1. CARD REWARDS (frequent, after a won combat) grow the DECK — extra copies
 *      and variety. They append to `Character.combatRewardCards`, which
 *      `buildCombatDeck` stacks on top of the learned-card baseline.
 *   2. CARD UNLOCKS (rare, via ethical-dilemma events — not implemented yet)
 *      add a NEW card type. `unlockCardViaDilemma` is the hook those events will
 *      call; it bypasses the normal learning requirements (the dilemma IS the
 *      gate), unlike `learnCard`.
 *
 * Pure: rolling takes an explicit `rng`. The mobile aftermath offers the 1-of-N
 * and persists the pick.
 */

import type { Character } from '../Character/types';
import { cardLibrary, getCardById } from '../Cards/cards.library';
import { rankToRarity } from '../Cards/types';
import { playerArchetype } from './combat.signature';
import type { PlayerArchetype } from './combat.encounter.types';

/**
 * The card-reward pool — spec 32 v3: the ENTIRE 70-card themed library. Drop
 * odds are governed by PER-RARITY weights (the generalized gold-weighting,
 * ledger #16): common cards drop freely, uncommons less, rares are the prize.
 * Invalid ids are filtered at roll time so the list stays safe to edit.
 */
export const COMBAT_REWARD_POOL: readonly string[] = Object.freeze(
    cardLibrary.map(card => card.id),
);

/** Per-rarity drop weights (spec 32 v3 §4 — the reward-roll lever). Tunable. */
export const REWARD_RARITY_WEIGHTS: Readonly<Record<'common' | 'uncommon' | 'rare', number>> =
    Object.freeze({ common: 1, uncommon: 0.5, rare: 0.2 });

/** The cards a brand-new player starts with: an opening offensive card PLUS a
 *  basic defense card, so every player can GUARD from turn one. The rest unlock
 *  through ethical-dilemma events via `unlockCardViaDilemma`. The mobile
 *  bootstrap seeds a new character's `knownCards` from this list. */
export const STARTING_CARD_IDS: readonly string[] = Object.freeze([
    'slippery-slope',       // opening offense
    'brace-for-impact',     // basic defense (GUARD) — guard from turn one
]);

/** The single OFFENSIVE card a brand-new player starts with. Kept for
 *  back-compat; prefer `STARTING_CARD_IDS` (which also grants a defense card). */
export const STARTING_CARD_ID = 'slippery-slope';

/** A valid reward-pool entry must resolve to a real card. */
function validPool(): string[] {
    return COMBAT_REWARD_POOL.filter(id => !!getCardById(id));
}

const ASPECT_OF = (id: string): PlayerArchetype | null => {
    const s = getCardById(id);
    return s ? (s.philosophicalAspect as PlayerArchetype) : null;
};

/**
 * Rolls `count` distinct card-reward offers after a won combat. Biased toward the
 * player's archetype (≈2× weight) so rewards tend to reinforce a build, while
 * still offering cross-aspect variety. Pure (seeded by `rng`).
 */
export function rollCombatCardRewards(
    player: Character,
    rng: () => number,
    count = 3,
): string[] {
    const archetype = playerArchetype(player);
    const pool = validPool();
    const offers: string[] = [];
    const remaining = pool.slice();
    while (offers.length < count && remaining.length > 0) {
        // Weighted pick: archetype-aligned entries get double weight; rarity
        // weights (spec 32 v3 §4) make rares an occasional prize.
        const weights = remaining.map(id => {
            const arch = ASPECT_OF(id) === archetype ? 2 : 1;
            const rank = getCardById(id)?.rank ?? 1;
            return arch * REWARD_RARITY_WEIGHTS[rankToRarity(rank)];
        });
        const total = weights.reduce((a, b) => a + b, 0);
        let roll = rng() * total;
        let idx = 0;
        for (; idx < remaining.length; idx++) {
            roll -= weights[idx];
            if (roll <= 0) break;
        }
        const pick = remaining[Math.min(idx, remaining.length - 1)];
        offers.push(pick);
        remaining.splice(remaining.indexOf(pick), 1);
    }
    return offers;
}

/** Appends a chosen reward card to the player's persistent deck collection. */
export function addRewardCard(player: Character, cardId: string): Character {
    return { ...player, combatRewardCards: [...(player.combatRewardCards ?? []), cardId] };
}

/**
 * Spec 26b §D — unlock a NEW card from an ethical-dilemma event. Bypasses the
 * normal `learnCard` requirement gates (level/stat/prereq) because the dilemma
 * choice is itself the gate. No-op (same ref) when already known or unknown id.
 * The dilemma EVENTS are not implemented yet; this is the hook they will call.
 */
export function unlockCardViaDilemma(player: Character, cardId: string): Character {
    if (player.knownCards.includes(cardId)) return player;
    if (!getCardById(cardId)) return player;
    return { ...player, knownCards: [...player.knownCards, cardId] };
}
