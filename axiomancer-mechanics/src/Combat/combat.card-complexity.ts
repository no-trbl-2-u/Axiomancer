/**
 * Static complexity — the cognitive-load instrument for cards and decks
 * (metrics-slate item 4, 2026-07-18).
 *
 * PURE STATIC ANALYSIS: no sim runs. A card's complexity is what a player must
 * hold in their head to play it — its keyword vocabulary, its mechanical
 * moving parts. A deck's complexity adds the
 * vocabulary-load view: how many distinct keywords the deck asks the
 * player to know, and how many of those are ORPHANS (carried by exactly one
 * unique card — pure cognitive load with no in-deck reinforcement).
 *
 * Keyword extraction follows the card-keyword doctrine ("every mechanic is a
 * keyword", 2026-07-10): UPPERCASE runs in the authored face text
 * (`paidSummary`) are keywords unless they are known
 * structural words — the same convention `paid-summary-honesty.engine.test.ts`
 * enforces — plus the keywords implied by rider verbs on the FREE line (a FREE "draw 1" is DRAW even when the prose never prints it). An
 * exclusion list (not an allowlist) keeps the instrument honest as the
 * vocabulary grows: a new keyword shows up in the counts the day its first
 * card ships.
 *
 * The SCORES are deliberately simple additive heuristics (v1) — meant for
 * RANKING cards/decks against each other, not as absolute truth. Pair with
 * the dynamic skill-ceiling metric (`PlaytestDeckSummary.skillGap`): high
 * static + low dynamic = complicated but shallow, the prime trim target.
 */

import type { Card, CardRider } from '../Cards/types';
import { getCardById } from '../Cards/cards.library';

/** Structural / system words the faces print in caps that are NOT keywords
 *  (mirrors the honesty test's structural set). */
const STRUCTURAL_UPPER: ReadonlySet<string> = new Set([
    'FREE', 'PAID', 'ALL', 'WILD', 'VITAE', 'HP', 'DOT', 'DOTS',
    'CONDEMN', 'SENTENCE', 'OPENING', 'X',
]);

/** Plural face-forms → the singular registry keyword. */
const PLURAL_TO_SINGULAR: Readonly<Record<string, string>> = Object.freeze({
    PREMISES: 'CHARGE', SOULS: 'SOUL', PIPS: 'PIP',
});

/** Rider verb fields → the keyword they imply even when no prose prints it. */
const RIDER_KEYWORDS: readonly (readonly [keyof CardRider, string])[] = [
    ['guard', 'GUARD'],
];

function collectTextKeywords(text: string | undefined, into: Set<string>): void {
    for (const run of text?.match(/[A-Z]{2,}/g) ?? []) {
        if (STRUCTURAL_UPPER.has(run)) continue;
        into.add(PLURAL_TO_SINGULAR[run] ?? run);
    }
}

function collectRiderKeywords(rider: CardRider | undefined, into: Set<string>): void {
    if (!rider) return;
    for (const [field, keyword] of RIDER_KEYWORDS) {
        if (rider[field] !== undefined) into.add(keyword);
    }
}

/** One card's static-complexity breakdown. */
export interface CardComplexityRow {
    cardId: string;
    /** Distinct keywords on the face (text + rider-implied), sorted. */
    keywords: string[];
    /** Mechanical moving parts: combat-effect payloads + special mechanics. */
    mechanicCount: number;
    /** keywords + mechanics — the additive v1 heuristic. */
    score: number;
}

/** Static complexity of one card (pure; no sim). */
export function cardComplexity(card: Card): CardComplexityRow {
    const kws = new Set<string>();
    collectTextKeywords(card.paidSummary, kws);
    collectRiderKeywords(card.free, kws);

    const mechanicCount = (card.combatEffects?.length ?? 0)
        + (card.specialMechanics?.length ?? 0);

    const keywords = [...kws].sort();
    return {
        cardId: card.id,
        keywords,
        mechanicCount,
        score: keywords.length + mechanicCount,
    };
}

/** One deck's static-complexity rollup. */
export interface DeckComplexity {
    /** Unique cards that resolved against the library. */
    uniqueCards: number;
    /** Mean card score over the unique cards. */
    avgCardScore: number;
    /** The single heaviest card and its score. */
    maxCardScore: number;
    maxCardId: string;
    /** Union of keywords across the deck's unique cards, sorted. */
    distinctKeywords: string[];
    /** Keywords carried by exactly ONE unique card — unreinforced vocabulary. */
    orphanKeywords: string[];
    /** avgCardScore + distinct-keyword load + orphan surcharge (v1 heuristic). */
    score: number;
}

/**
 * Static complexity of a deck (card ids; ids that do not resolve are skipped).
 * Duplicates collapse — complexity is about VOCABULARY, and the 4th copy of a
 * common teaches nothing new; duplication actually LOWERS a deck's real
 * cognitive load, which shows up here as fewer unique cards sharing the same
 * keyword set.
 */
export function deckComplexity(cardIds: readonly string[]): DeckComplexity {
    const uniqueIds = [...new Set(cardIds)];
    const rows: CardComplexityRow[] = [];
    for (const id of uniqueIds) {
        const card = getCardById(id);
        if (card) rows.push(cardComplexity(card));
    }
    const keywordOwners = new Map<string, number>();
    for (const row of rows) {
        for (const kw of row.keywords) keywordOwners.set(kw, (keywordOwners.get(kw) ?? 0) + 1);
    }
    const distinctKeywords = [...keywordOwners.keys()].sort();
    const orphanKeywords = distinctKeywords.filter(kw => keywordOwners.get(kw) === 1);
    const avgCardScore = rows.length > 0
        ? rows.reduce((s, r) => s + r.score, 0) / rows.length
        : 0;
    let maxCardScore = 0;
    let maxCardId = '';
    for (const row of rows) {
        if (row.score > maxCardScore) { maxCardScore = row.score; maxCardId = row.cardId; }
    }
    return {
        uniqueCards: rows.length,
        avgCardScore,
        maxCardScore,
        maxCardId,
        distinctKeywords,
        orphanKeywords,
        score: avgCardScore + distinctKeywords.length + orphanKeywords.length,
    };
}
