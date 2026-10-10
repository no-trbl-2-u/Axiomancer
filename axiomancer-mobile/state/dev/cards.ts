/**
 * Dev-only CARD LANE helpers — the logic behind the `/dev` CARDS section.
 *
 * The lane registry is engine truth (`CARD_LANES`, mechanics
 * `Cards/card.lanes.ts`). This module only reads it and writes the player
 * slice, so the two CARDS leaves stay presentational.
 *
 * Functions:
 *   listLanes()                    every registered lane: id, name, sizes
 *   setLaneDeck(store, laneId)     replace the whole deck with a lane's test deck
 *   getRewardLaneIds(store)        the lanes the reward-pool override names
 *   setRewardPool(store, laneIds)  narrow the reward draft to those lanes
 *
 * Every write lands on `player` and is saved at once (`checkpoint`), so it
 * survives a reload and a new game clears it.
 */

import { CARD_LANES, getCardLane } from '@mechanics';

import type { AppStore } from '@/state/store';

/**
 * Saves the run now. A failed save must not break the dev row, so it is
 * swallowed (same rule as the combat reward screen's save).
 *
 * @param store - The app store.
 */
function checkpoint(store: AppStore): void {
    try {
        store.getState().save();
    } catch {
        /* persistence must not strand the dev menu */
    }
}

/** One row the CARDS section lists. */
export interface LaneOption {
    /** Lane id, e.g. `'grey'`. */
    id: string;
    /** Display name, e.g. `'Grey office'`. */
    name: string;
    /** How many distinct cards the lane holds (its reward-pool share). */
    cardCount: number;
    /** How many cards SET DECK deals (copies counted). */
    deckSize: number;
}

/**
 * Every registered lane, registry order.
 *
 * @returns One {@link LaneOption} per lane.
 * @example listLanes()[0] // { id: 'grey', name: 'Grey office', cardCount: 3, deckSize: 10 }
 */
export function listLanes(): readonly LaneOption[] {
    return CARD_LANES.map((lane) => ({
        id: lane.id,
        name: lane.name,
        cardCount: lane.cardIds.length,
        deckSize: lane.testDeck.length,
    }));
}

/**
 * Replaces the player's whole combat deck with a lane's test deck: the
 * deck base (`knownCards`) becomes the lane's `testDeck` and the earned
 * reward cards (`combatRewardCards`) are cleared, so the next fight deals
 * exactly the lane deck.
 *
 * @param store  - The app store.
 * @param laneId - The lane to deal.
 * @returns A feedback line for the dev row.
 * @example setLaneDeck(store, 'grey') // 'deck · Grey office · 10 cards'
 */
export function setLaneDeck(store: AppStore, laneId: string): string {
    const lane = getCardLane(laneId);
    if (!lane) return `no lane '${laneId}'`;
    const player = store.getState().player;
    store.setState({ player: { ...player, knownCards: [...lane.testDeck], combatRewardCards: [] } });
    checkpoint(store);
    return `deck · ${lane.name} · ${lane.testDeck.length} cards`;
}

/**
 * The lane ids the reward-pool override currently names.
 *
 * @param store - The app store.
 * @returns The saved override; `[]` when the whole library is the pool.
 */
export function getRewardLaneIds(store: AppStore): readonly string[] {
    return store.getState().player.devRewardLaneIds ?? [];
}

/**
 * Narrows the post-combat card draft to the given lanes. An empty list (or
 * one naming no registered lane) clears the override, and the whole library
 * is the pool again. Unknown ids are dropped before saving.
 *
 * @param store   - The app store.
 * @param laneIds - The checked lane ids.
 * @returns A feedback line for the dev row.
 * @example setRewardPool(store, ['grey']) // 'reward pool · Grey office'
 */
export function setRewardPool(store: AppStore, laneIds: readonly string[]): string {
    const lanes = laneIds
        .map((id) => getCardLane(id))
        .filter((lane): lane is NonNullable<typeof lane> => lane !== undefined);
    const { devRewardLaneIds: _cleared, ...player } = store.getState().player;
    if (lanes.length === 0) {
        store.setState({ player });
        checkpoint(store);
        return 'reward pool · whole library';
    }
    store.setState({ player: { ...player, devRewardLaneIds: lanes.map((lane) => lane.id) } });
    checkpoint(store);
    return `reward pool · ${lanes.map((lane) => lane.name).join(', ')}`;
}
