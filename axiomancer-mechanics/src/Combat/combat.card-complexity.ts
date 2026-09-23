/**
 * Static complexity — the cognitive-load instrument for cards and presets
 * (metrics-slate item 4, 2026-07-18).
 *
 * PURE STATIC ANALYSIS: no sim runs. A card's complexity is what a player must
 * hold in their head to play it — its keyword vocabulary, its mechanical
 * moving parts, and its conditional gates. A preset's complexity adds the
 * vocabulary-load view: how many distinct keywords the preset deck asks the
 * player to know, and how many of those are ORPHANS (carried by exactly one
 * unique card — pure cognitive load with no in-deck reinforcement).
 *
 * Keyword extraction follows the card-keyword doctrine ("every mechanic is a
 * keyword", 2026-07-10): UPPERCASE runs in the authored face text
 * (`paidSummary` / `persistentEffect`) are keywords unless they are known
 * structural words — the same convention `paid-summary-honesty.engine.test.ts`
 * enforces — plus the keywords implied by rider verbs on FREE / die-interaction
 * lines (a FREE "draw 1" is DRAW even when the prose never prints it). An
 * exclusion list (not an allowlist) keeps the instrument honest as the
 * vocabulary grows: a new keyword shows up in the counts the day its first
 * card ships.
 *
 * The SCORES are deliberately simple additive heuristics (v1) — meant for
 * RANKING cards/presets against each other, not as absolute truth. Pair with
 * the dynamic skill-ceiling metric (`PlaytestPresetSummary.skillGap`): high
 * static + low dynamic = complicated but shallow, the prime trim target.
 */

import type { Card, CardRider } from '../Cards/types';
import { getCardById } from '../Cards/cards.library';
import { getDeckPreset } from './combat.starter-deck-presets';

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
    ['drawCards', 'DRAW'], ['guard', 'GUARD'], ['barrier', 'GUARD'],
    ['healHp', 'HEAL'], ['cleanse', 'CLEANSE'], ['premises', 'CHARGE'],
    ['sway', 'PLEA'], ['souls', 'SOUL'], ['foretell', 'FORETELL'],
    ['tickOne', 'TICK'], ['tickAllDots', 'TICK'], ['stagger', 'STAGGER'],
    ['pips', 'PIP'], ['intensityPerPip', 'PIP'], ['recoil', 'RECOIL'],
    ['millCards', 'MILL'], ['ruptureMarks', 'RUPTURE'],
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
    /** Mechanical moving parts: combat-effect payloads + special mechanics +
     *  synergy clause + die-interaction lines + persistent hook. */
    mechanicCount: number;
    /** Conditional gates (synergy predicate, threshold, dieBonus, fallen). */
    conditionalCount: number;
    /** keywords + mechanics + conditionals — the additive v1 heuristic. */
    score: number;
}

/** Static complexity of one card (pure; no sim). */
export function cardComplexity(card: Card): CardComplexityRow {
    const kws = new Set<string>();
    collectTextKeywords(card.paidSummary, kws);
    collectTextKeywords(card.persistentEffect, kws);
    collectRiderKeywords(card.free, kws);
    collectRiderKeywords(card.threshold?.rider, kws);
    collectRiderKeywords(card.dieBonus?.rider, kws);
    collectRiderKeywords(card.fate?.rider, kws);
    collectRiderKeywords(card.fallen?.rider, kws);

    const conditionalCount = (card.synergy ? 1 : 0) + (card.threshold ? 1 : 0)
        + (card.dieBonus ? 1 : 0) + (card.fallen ? 1 : 0);
    const mechanicCount = (card.combatEffects?.length ?? 0)
        + (card.specialMechanics?.length ?? 0)
        + (card.persistentEffect ? 1 : 0)
        + (card.fate ? 1 : 0)
        + conditionalCount;

    const keywords = [...kws].sort();
    return {
        cardId: card.id,
        keywords,
        mechanicCount,
        conditionalCount,
        score: keywords.length + mechanicCount + conditionalCount,
    };
}

/** One preset's static-complexity rollup. */
export interface PresetComplexity {
    presetId: string;
    /** Unique cards that resolved against the library. */
    uniqueCards: number;
    /** Mean card score over the unique cards. */
    avgCardScore: number;
    /** The single heaviest card and its score. */
    maxCardScore: number;
    maxCardId: string;
    /** Union of keywords across the preset's unique cards, sorted. */
    distinctKeywords: string[];
    /** Keywords carried by exactly ONE unique card — unreinforced vocabulary. */
    orphanKeywords: string[];
    /** avgCardScore + distinct-keyword load + orphan surcharge (v1 heuristic). */
    score: number;
}

/**
 * Static complexity of a preset deck (null for an unknown preset id).
 * Duplicates collapse — complexity is about VOCABULARY, and the 4th copy of a
 * common teaches nothing new; duplication actually LOWERS a deck's real
 * cognitive load, which shows up here as fewer unique cards sharing the same
 * keyword set.
 */
export function presetComplexity(presetId: string): PresetComplexity | null {
    const preset = getDeckPreset(presetId);
    if (!preset) return null;
    const uniqueIds = [...new Set(preset.cardIds)];
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
        presetId,
        uniqueCards: rows.length,
        avgCardScore,
        maxCardScore,
        maxCardId,
        distinctKeywords,
        orphanKeywords,
        score: avgCardScore + distinctKeywords.length + orphanKeywords.length,
    };
}
