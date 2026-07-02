/**
 * Seeded combat-deck drafting — weighted random decks with a design FOCUS.
 *
 * Where a preset (`combat.deck-presets.ts`) is a hand-authored list, a DRAFT
 * samples the eligible card pool with weights that favor the requested focus:
 * a 'dot' draft leans hard into damage-over-time cards, a 'control' draft into
 * control / stat-debuff locks, and so on. Drafting is how the playtest matrix
 * exercises the WHOLE library instead of the same few curated lists.
 *
 * Doctrine (CLAUDE.md): status effects are the MAIN fun — HP is the sole win
 * condition and status is the EFFICIENT way to drop it. Every draft therefore
 * guarantees at least one defend card and at least one status-applying card
 * (when the pool allows), so no drafted deck is locked out of the status game.
 *
 * Determinism: all randomness flows through the injected `rng` (defaulting to
 * the seedable global singleton, never `Math.random`) — the same rng state
 * always drafts the same deck.
 */

import type { Card } from '../Cards/types';
import { getCardById, cardLibrary } from '../Cards/cards.library';
import { lookupEffect } from '../Effects';
import { getRng } from '../Utils/rng';
import type { CombatVerbClass } from './combat.encounter.types';
import { toCombatCard, isSyntheticCard, SYNTHETIC_CARD_IDS } from './combat.cards';
import type { CombatDeckFocus } from './combat.deck-presets';
import { buildPresetDeck } from './combat.deck-presets';
import type { CombatStageProfile } from './combat.stage-profiles';
import { stageEligibleCardIds } from './combat.stage-profiles';

/** Weight multiplier applied to cards whose verb class fits the draft focus. */
const FOCUS_WEIGHT = 4;
/** Weight for off-focus cards (every card keeps a chance to appear). */
const OFF_FOCUS_WEIGHT = 1;
/** Default deck size (excludes the auto-appended Retreat). */
const DEFAULT_DRAFT_SIZE = 10;
/** Default max copies of any single card in a draft. */
const DEFAULT_MAX_COPIES = 2;

/** Verb classes that count as "status-applying" for the draft guarantee. */
const STATUS_VERB_CLASSES: readonly CombatVerbClass[] = Object.freeze([
    'direct-dot', 'direct-control', 'stat-debuff',
]);

export interface DeckDraftOptions {
    /** The lever the draft leans on (reused from `combat.deck-presets`). */
    focus: CombatDeckFocus;
    /** Restricts the pool to `stageEligibleCardIds(stage)`; default: the full
     *  card library (plus `extraCards`). */
    stage?: CombatStageProfile;
    /** Cards drafted, excluding the auto-appended Retreat. Default 10. */
    size?: number;
    /** Max copies of any single card. Default 2. */
    maxCopies?: number;
    /** Randomness source; default the seedable global singleton. */
    rng?: () => number;
    /** Extra cards (e.g. registered sandbox cards) merged into the pool —
     *  subject to the same tier/level filters when a `stage` is given; a card
     *  sharing a library id OVERRIDES the library entry for this draft. */
    extraCards?: readonly Card[];
}

/** Verb-class fit per focus: which classes get the FOCUS_WEIGHT multiplier. */
function focusWeight(focus: CombatDeckFocus, verbClass: CombatVerbClass): number {
    switch (focus) {
        case 'dot':      return verbClass === 'direct-dot' ? FOCUS_WEIGHT : OFF_FOCUS_WEIGHT;
        case 'control':  return verbClass === 'direct-control' || verbClass === 'stat-debuff'
            ? FOCUS_WEIGHT : OFF_FOCUS_WEIGHT;
        case 'damage':   return verbClass === 'direct-damage' ? FOCUS_WEIGHT : OFF_FOCUS_WEIGHT;
        case 'utility':  return verbClass === 'defend' || verbClass === 'buff-self' || verbClass === 'befriend'
            ? FOCUS_WEIGHT : OFF_FOCUS_WEIGHT;
        case 'balanced': return OFF_FOCUS_WEIGHT;
    }
}

interface DraftCandidate {
    id: string;
    verbClass: CombatVerbClass;
    weight: number;
    copiesLeft: number;
}

/** Resolves the draft pool (ids + verb classes) for the given options. */
function buildCandidates(options: DeckDraftOptions): DraftCandidate[] {
    const extra = options.extraCards ?? [];
    const merged = new Map<string, Card>();
    for (const card of cardLibrary) merged.set(card.id, card);
    for (const card of extra) merged.set(card.id, card);

    const poolIds = options.stage
        ? stageEligibleCardIds(options.stage, extra)
        : [...merged.keys()];
    const lookupSkill = (id: string): Card | undefined => merged.get(id) ?? getCardById(id);
    const maxCopies = Math.max(1, options.maxCopies ?? DEFAULT_MAX_COPIES);

    const candidates: DraftCandidate[] = [];
    for (const id of poolIds) {
        if (isSyntheticCard(id)) continue; // Retreat is appended, never drafted.
        const card = toCombatCard(id, lookupSkill, lookupEffect);
        if (!card) continue;
        candidates.push({
            id,
            verbClass: card.verbClass,
            weight: focusWeight(options.focus, card.verbClass),
            copiesLeft: maxCopies,
        });
    }
    return candidates;
}

/** Weighted pick among candidates with copies left; null when exhausted. */
function weightedPick(candidates: DraftCandidate[], rng: () => number): DraftCandidate | null {
    const open = candidates.filter(c => c.copiesLeft > 0);
    if (open.length === 0) return null;
    const total = open.reduce((sum, c) => sum + c.weight, 0);
    let roll = rng() * total;
    for (const c of open) {
        roll -= c.weight;
        if (roll < 0) return c;
    }
    return open[open.length - 1];
}

/**
 * Drafts a focused combat deck: a weighted seeded sample of the eligible pool
 * (focus-fitting verb classes at 4x weight), capped at `maxCopies` per card,
 * guaranteed to contain at least one defend and one status-applying card when
 * the pool allows, with 'card-retreat' appended. Deterministic for a given rng
 * state. Pass the result straight into `initializeCombatEncounter`.
 */
export function draftCombatDeck(options: DeckDraftOptions): string[] {
    const rng = options.rng ?? ((): number => getRng().random());
    const size = Math.max(1, options.size ?? DEFAULT_DRAFT_SIZE);
    const candidates = buildCandidates(options);

    const deck: DraftCandidate[] = [];
    for (let i = 0; i < size; i++) {
        const pick = weightedPick(candidates, rng);
        if (!pick) break; // pool exhausted (size > pool * maxCopies)
        pick.copiesLeft -= 1;
        deck.push(pick);
    }

    // Guarantees, in fixed order: >=1 defend, then >=1 status-applying card.
    ensureClassPresent(deck, candidates, rng, c => c.verbClass === 'defend');
    ensureClassPresent(deck, candidates, rng, c => STATUS_VERB_CLASSES.includes(c.verbClass));

    const ids = deck.map(c => c.id);
    for (const syntheticId of SYNTHETIC_CARD_IDS) {
        if (!ids.includes(syntheticId)) ids.push(syntheticId);
    }
    return ids;
}

/**
 * If no drafted card matches `matches`, swap one in from the pool (when the
 * pool has one), replacing the last drafted card that is neither a defend nor
 * a status card — so satisfying one guarantee never breaks the other.
 */
function ensureClassPresent(
    deck: DraftCandidate[],
    candidates: DraftCandidate[],
    rng: () => number,
    matches: (c: DraftCandidate) => boolean,
): void {
    if (deck.length === 0 || deck.some(matches)) return;
    const options = candidates.filter(c => matches(c) && c.copiesLeft > 0);
    if (options.length === 0) return; // pool cannot satisfy the guarantee
    const pick = weightedPick(options, rng);
    if (!pick) return;

    const protectedCard = (c: DraftCandidate): boolean =>
        c.verbClass === 'defend' || STATUS_VERB_CLASSES.includes(c.verbClass);
    let replaceAt = deck.length - 1;
    for (let i = deck.length - 1; i >= 0; i--) {
        if (!protectedCard(deck[i])) { replaceAt = i; break; }
    }
    deck[replaceAt].copiesLeft += 1;
    pick.copiesLeft -= 1;
    deck[replaceAt] = pick;
}

/** How a playtest cell (or CLI invocation) names the deck it wants. */
export type CombatDeckSelection =
    | { kind: 'preset'; presetId: string }
    | { kind: 'draft'; focus: CombatDeckFocus; size?: number }
    | { kind: 'cards'; cardIds: readonly string[] }
    | { kind: 'policy-pick' };

/**
 * Resolves a deck selection into a playable card-id list:
 * - 'preset' → `buildPresetDeck(presetId)` (empty for an unknown preset id).
 * - 'draft'  → `draftCombatDeck` with the selection's focus/size, scoped to
 *   `stage` when given.
 * - 'cards'  → the trusted list with invalid ids dropped (exactly like
 *   `buildPresetDeck` does) and Retreat appended if absent.
 * - 'policy-pick' → THROWS at this layer. A policy-picked deck is resolved by
 *   the playtest harness, which drafts with the policy's `preferredFocus`
 *   before ever reaching this function.
 */
export function resolveDeckSelection(
    selection: CombatDeckSelection,
    stage: CombatStageProfile | undefined,
    rng?: () => number,
): string[] {
    switch (selection.kind) {
        case 'preset':
            return buildPresetDeck(selection.presetId);
        case 'draft':
            return draftCombatDeck({ focus: selection.focus, size: selection.size, stage, rng });
        case 'cards': {
            const deck = selection.cardIds.filter(id => isSyntheticCard(id) || !!getCardById(id));
            const resolved = [...deck];
            for (const syntheticId of SYNTHETIC_CARD_IDS) {
                if (!resolved.includes(syntheticId)) resolved.push(syntheticId);
            }
            return resolved;
        }
        case 'policy-pick':
            throw new Error(
                'resolveDeckSelection: \'policy-pick\' must be resolved by the playtest '
                + 'harness (draft with the policy\'s preferredFocus) before this layer.',
            );
    }
}
