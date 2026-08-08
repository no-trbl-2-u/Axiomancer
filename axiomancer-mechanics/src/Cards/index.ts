/**
 * Cards module — types and runtime engine.
 *
 * Cards run on the resonance economy described in `specs/04-cards-engine.md`.
 * The engine functions here are pure: callers thread state forward
 * themselves.
 *
 * Card content (the named library) lives in Spec 04b.
 */

export type {
    Card, StatType, CardTier, CardTarget,
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
    calculateCardDamage, executeCard,
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
    VERB_POINTS, CONDITION_DISCOUNTS, SELF_COST_CREDIT, DOT_TEMPO_SURVIVAL,
    scoreCard, scoreMechanic, scoreRider, statusPoints,
    dotLifetimeHp, dotTempoWeightedHp,
} from './cards.pricing';

// Phase 52a — deck removal: the primitive, the floor, and the escalating
// per-run price (PROVISIONAL until 52f calibrates it).
export {
    removeCardFromCombatDeck, MIN_COMBAT_DECK_SIZE,
    CARD_REMOVAL_PRICING_PLACEHOLDER,
    cardRemovalPrice, cardRemovalPriceFor, cardRemovalsOf, canAffordCardRemoval,
} from './card.removal';
export type {
    CardRemovalResult, CardRemovalAccepted, CardRemovalRefused,
    CardRemovalRefusal, CardRemovalRefusalCode, CardRemovalSource,
} from './card.removal';

// Card themes + their keyword families (spec 32 §3/§6) — the public shape
// mobile's KW-6 parity lint (phase 29) checks its glossary against.
export type { CardTheme } from './card-themes';
export {
    CARD_THEMES, THEME_KEYWORDS, keywordsForTheme, isCardTheme,
} from './card-themes';

// Phase 33d — GLYPHS pilot (sandbox-only): `Card.glyph` / `CardRider.glyphCharge`
// reference the Combat-owned glyph zone; re-exported wholesale here (mirrors
// how `CombatThreatEffect`/`CombatEvent` are already exported wholesale per
// 33a's precedent) so a Cards-only consumer never needs a separate Combat
// import for the types this module's own `Card`/`CardRider` fields carry.
export { crackGlyph } from '../Combat/combat.engine';
export type { GlyphInstance, GlyphPayload } from '../Combat/combat.encounter.types';
