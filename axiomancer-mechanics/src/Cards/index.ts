/**
 * Cards module — types and runtime engine.
 *
 * Cards run on the resonance economy (the original `specs/04-cards-engine.md`
 * was removed in the skill→card unification — see `specs/README.md`).
 * The engine functions here are pure: callers thread state forward
 * themselves.
 *
 * Card content (the named library) lives in Spec 04b.
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

// Spec 32 v3 — the rank ladder (§4) and the card types (D51).
export type { CardRank, CardRarity, CardType, CardRider } from './types';
export { rankToRarity, CARD_RANK_NAMES } from './types';
// Phase 68 — the runtime enumeration of `CardSpecialMechanic['kind']`, bound to
// the union by compile-time assertions in types.ts. Consumers that need to walk
// every kind (mobile KW-2, drift lints) read THIS instead of keeping a copy.
export { CARD_SPECIAL_MECHANIC_KINDS } from './types';
