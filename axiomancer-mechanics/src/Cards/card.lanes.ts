/**
 * CARD LANES — the registry of player card lanes.
 *
 * A lane is a named group of library cards that share a play pattern, plus a
 * test deck that plays it. The registry is what the dev menu's CARDS section
 * lists: its lane-deck picker deals a lane's `testDeck`, and its reward-pool
 * grid narrows the post-combat offer to the checked lanes' `cardIds`.
 *
 * The grey office is the only lane. A new lane is registered here, in the
 * same guided session with T that adds its cards to the library.
 *
 * Everything here is data or a pure function over plain values.
 *
 * Functions (each takes the registry as an optional last argument, so tests
 * can pass fixture lanes):
 *   getCardLane(id)            one lane by id, or undefined
 *   laneRewardPool(laneIds)    the card ids of the named lanes, de-duplicated
 */

import { GREY_OFFICE_CARDS } from './library/starters.cards';

/**
 * One card lane.
 *
 * @property id        - Stable key, saved in `Character.devRewardLaneIds`.
 * @property name      - Label the dev menu prints.
 * @property cardIds   - Every library card that belongs to the lane, in
 *                       library order. The reward pool draws from these.
 * @property testDeck  - The deck the dev menu's SET DECK deals, copies kept
 *                       (an id listed twice is two cards in the deck).
 */
export interface CardLane {
    readonly id: string;
    readonly name: string;
    readonly cardIds: readonly string[];
    readonly testDeck: readonly string[];
}

/**
 * The grey office: three colourless cards. Its test deck is the fresh-run
 * deck, Blow 5 / Ward 3 / Word 2 (`STARTING_CARD_IDS` reads it from here).
 */
export const GREY_LANE: CardLane = Object.freeze({
    id: 'grey',
    name: 'Grey office',
    cardIds: Object.freeze(GREY_OFFICE_CARDS.map(card => card.id)),
    testDeck: Object.freeze([
        'grey-strike', 'grey-strike', 'grey-strike', 'grey-strike', 'grey-strike',
        'grey-ward', 'grey-ward', 'grey-ward',
        'grey-word', 'grey-word',
    ]),
});

/** Every registered lane, in the order the dev menu lists them. */
export const CARD_LANES: readonly CardLane[] = Object.freeze([GREY_LANE]);

/**
 * Looks a lane up by id.
 *
 * @param id    - A lane id, e.g. `'grey'`.
 * @param lanes - The registry to search; defaults to {@link CARD_LANES}.
 * @returns The lane, or `undefined` for an id no lane carries (a save can
 *          name a lane that was later removed).
 * @example getCardLane('grey')?.name // 'Grey office'
 */
export function getCardLane(id: string, lanes: readonly CardLane[] = CARD_LANES): CardLane | undefined {
    return lanes.find(lane => lane.id === id);
}

/**
 * The card ids of the named lanes, merged in the order given, each id once.
 * Unknown lane ids are skipped.
 *
 * @param laneIds - Lane ids, e.g. `['grey']`.
 * @param lanes   - The registry to read; defaults to {@link CARD_LANES}.
 * @returns The merged card ids; `[]` when no id names a registered lane.
 * @example laneRewardPool(['grey']) // ['grey-strike', 'grey-ward', 'grey-word']
 */
export function laneRewardPool(laneIds: readonly string[], lanes: readonly CardLane[] = CARD_LANES): string[] {
    const ids = laneIds
        .map(id => getCardLane(id, lanes))
        .filter((lane): lane is CardLane => lane !== undefined)
        .flatMap(lane => lane.cardIds);
    return [...new Set(ids)];
}
