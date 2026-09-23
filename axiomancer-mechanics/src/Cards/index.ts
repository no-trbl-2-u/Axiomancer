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
    Card, StatType, CardAspect, CardTier, CardTarget,
    CardCombatEffects, CardSpecialMechanic,
    CardSynergy, SynergyPredicate,
    // WS4.2 — combat-state synergy predicate (spec 32 §12 item 4)
    SynergyStatePredicate,
} from './types';

// Local bindings (`export { x } from 'y'` below does not bind locally) for
// `keywordsOf` (Phase 104).
import { getCardById } from './cards.library';
import { cardKeywords } from './card-keywords';

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

// WS2.1 — the Haunt registry (spec 34 R-13: renamed from Thoughtform): the
// cards CONJURE creates. Real `Card` records outside the curated
// library (correction C-11); resolved by `getCardById` via the sandbox →
// haunt → ally → library chain.
export {
    hauntLibrary, getHauntById,
} from './cards.haunts';

// Phase 62 — the Ally registry: village-goodwill grants (Phase 65). Real
// `Card` records outside the curated library, same sibling-pool
// pattern as Haunts; resolved by `getCardById` via the sandbox → haunt →
// ally → library chain.
export {
    allyLibrary, getAllyById, isAllyCard,
} from './cards.allies';

// Spec 32 v3 — rank ladder + card types (§4) and the pricing table (ledger #2).
export type { CardRank, CardRarity, CardType, CardRider } from './types';
export { rankToRarity, CARD_RANK_NAMES } from './types';
// Phase 68 — the runtime enumeration of `CardSpecialMechanic['kind']`, bound to
// the union by compile-time assertions in types.ts. Consumers that need to walk
// every kind (mobile KW-2, drift lints) read THIS instead of keeping a copy.
export { CARD_SPECIAL_MECHANIC_KINDS, isCardSpecialMechanicKind } from './types';
export {
    VERB_POINTS, CONDITION_DISCOUNTS, SELF_COST_CREDIT, DOT_TEMPO_SURVIVAL,
    scoreCard, scoreMechanic, scoreRider, statusPoints,
    dotLifetimeHp, dotTempoWeightedHp,
} from './cards.pricing';

// Phase 52a — deck removal: the primitive, the floor, and the escalating
// per-run price (PROVISIONAL until 52f calibrates it).
export {
    removeCardFromCombatDeck, MIN_COMBAT_DECK_SIZE,
    CARD_REMOVAL_PRICING,
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

/**
 * Phase 104 — a card's keyword surface for reward-draft matching: what it
 * actually carries (`Cards/card-keywords.ts`), not just its declared theme —
 * DOOM/MARK/BLEED recur across most families on purpose, so matching by
 * theme membership alone would make almost every card match almost every
 * theme. Unknown ids carry none. Not a `Card` field — derived on demand so
 * the reward roll never drags a second source of truth onto the schema.
 */
export function keywordsOf(id: string): readonly string[] {
    const card = getCardById(id);
    return card ? cardKeywords(card) : [];
}

// Phase 33d — GLYPHS pilot (sandbox-only): `Card.glyph` / `CardRider.glyphCharge`
// reference the Combat-owned glyph zone; re-exported wholesale here (mirrors
// how `CombatThreatEffect`/`CombatEvent` are already exported wholesale per
// 33a's precedent) so a Cards-only consumer never needs a separate Combat
// import for the types this module's own `Card`/`CardRider` fields carry.
export { crackGlyph } from '../Combat/combat.engine';
export type { GlyphInstance, GlyphPayload } from '../Combat/combat.encounter.types';
