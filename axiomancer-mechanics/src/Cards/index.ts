/**
 * Cards module — types and runtime engine.
 *
 * The engine functions here are pure: callers thread state forward
 * themselves.
 *
 * Card content (the named library) lives in `cards.library`.
 */

export type {
    Card, CardAspect, CardTier, CardTarget,
    CardCombatEffects, CardSpecialMechanic,
} from './types';

export {
    getAvailableCards, learnCard,
} from './card.engine';

export {
    cardLibrary, getCardById,
} from './cards.library';

// Card lanes: the registry the dev menu's CARDS section lists.
export type { CardLane } from './card.lanes';
export { CARD_LANES, GREY_LANE, getCardLane, laneRewardPool } from './card.lanes';

// The rank ladder and the card types.
export type { CardRank, CardRarity, CardType, CardRider } from './types';
export { rankToRarity, CARD_RANK_NAMES } from './types';
// The runtime enumeration of `CardSpecialMechanic['kind']`, bound to
// the union by compile-time assertions in types.ts. Consumers that need to walk
// every kind (mobile KW-2, drift lints) read THIS instead of keeping a copy.
export { CARD_SPECIAL_MECHANIC_KINDS } from './types';
