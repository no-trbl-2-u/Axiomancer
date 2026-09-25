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
    CardSynergy,
} from './types';

// Local bindings (`export { x } from 'y'` below does not bind locally) for
// `keywordsOf` (Phase 104).
import { getCardById } from './cards.library';
import { cardKeywords } from './card-keywords';

export {
    getAvailableCards, learnCard,
} from './card.engine';

export {
    cardLibrary, getCardById,
} from './cards.library';

// Spec 32 v3 — rank ladder + card types (§4) and the pricing table (ledger #2).
export type { CardRank, CardRarity, CardType, CardRider } from './types';
export { rankToRarity, CARD_RANK_NAMES } from './types';
// Phase 68 — the runtime enumeration of `CardSpecialMechanic['kind']`, bound to
// the union by compile-time assertions in types.ts. Consumers that need to walk
// every kind (mobile KW-2, drift lints) read THIS instead of keeping a copy.
export { CARD_SPECIAL_MECHANIC_KINDS } from './types';

// Card themes + their keyword families (spec 32 §3/§6) — the public shape
// mobile's KW-6 parity lint (phase 29) checks its glossary against.
export type { CardTheme } from './card-themes';
export {
    THEME_KEYWORDS,
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

