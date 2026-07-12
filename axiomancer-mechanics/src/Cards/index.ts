/**
 * Cards module — types and runtime engine.
 *
 * Cards (fallacies and paradoxes) run on the five-resource resonance
 * economy described in `specs/04-cards-engine.md`. The engine functions
 * here are pure: callers thread state forward themselves.
 *
 * Card content (the named library) lives in Spec 04b.
 */

export type {
    Card, CardCategory, StatType, CardTier, CardTarget,
    CombatResources,
    CardCombatEffects, CardSpecialMechanic,
    CardSynergy, SynergyPredicate,
    // WS4.2 — combat-state synergy predicate (spec 32 §12 item 4)
    SynergyStatePredicate,
} from './types';

// Phase 142 — Extended synergy predicate types
export type { ExtendedSynergyPredicate, SynergyLedgerView } from './synergy-predicates';

// Phase 142 — Extended synergy predicate functionality
// (+ WS4.2 checkStatePredicate — the combat-ledger gate evaluator)
export {
    evaluateExtendedSynergyPredicate,
    checkSinglePredicate,
    checkAnyCountPredicate,
    checkAllRequiredPredicate,
    checkBuffDebuffCombo,
    checkTotalIntensityPredicate,
    checkStatePredicate,
} from './synergy-predicates';

export {
    generateBasicActionResources, generatePhilosophicalResource,
    calculateCardDamage, executeCard,
    philosophicalCategoryFor,
    getAvailableCards, learnCard,
} from './card.engine';

export type {
    CardEvent, CardResolution, CardLookup,
} from './card.engine';

export {
    cardLibrary, getCardById,
} from './cards.library';

// WS2.1 — the Thoughtform registry: the cards CONJURE creates. Real `Card`
// records outside the pinned 70-card library (correction C-11); resolved by
// `getCardById` via the sandbox → thoughtform → library chain.
export {
    thoughtformLibrary, getThoughtformById,
} from './cards.thoughtforms';

// Spec 32 v3 — rank ladder + card types (§4) and the pricing table (ledger #2).
export type { CardRank, CardRarity, CardType, CardRider } from './types';
export { rankToRarity, CARD_RANK_NAMES } from './types';
export {
    VERB_POINTS, CONDITION_DISCOUNTS, SELF_COST_CREDIT,
    scoreCard, scoreMechanic, scoreRider, statusPoints, dotLifetimeHp,
} from './cards.pricing';

// Card themes + their keyword families (spec 32 §3/§6) — the public shape
// mobile's KW-6 parity lint (phase 29) checks its glossary against.
export type { CardTheme } from './card-themes';
export {
    CARD_THEMES, THEME_KEYWORDS, keywordsForTheme, isCardTheme,
} from './card-themes';
