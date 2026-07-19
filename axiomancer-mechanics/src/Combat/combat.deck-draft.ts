/**
 * Seeded combat-deck drafting — weighted random decks with a design FOCUS.
 *
 * Where a preset (`combat.starter-deck-presets.ts`) is a hand-authored list, a DRAFT
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
import { toCombatCard } from './combat.cards';
import type { CombatDeckFocus } from './combat.starter-deck-presets';
import { buildPresetDeck } from './combat.starter-deck-presets';
import type { CombatStageProfile } from './combat.stage-profiles';
import { stageEligibleCardIds } from './combat.stage-profiles';

/** Weight multiplier applied to cards whose verb class fits the draft focus. */
export const FOCUS_WEIGHT = 4;
/** Weight for off-focus cards (every card keeps a chance to appear). */
export const OFF_FOCUS_WEIGHT = 1;
/** Default deck size (excludes the auto-appended Retreat). */
const DEFAULT_DRAFT_SIZE = 10;
/** Default max copies of any single card in a draft. */
const DEFAULT_MAX_COPIES = 2;

/** Verb classes that count as "status-applying" for the draft guarantee. */
const STATUS_VERB_CLASSES: readonly CombatVerbClass[] = Object.freeze([
    'direct-dot', 'direct-control', 'stat-debuff',
]);

export interface DeckDraftOptions {
    /** The lever the draft leans on (reused from `combat.starter-deck-presets`). */
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

/** Verb-class fit per focus: which classes get the FOCUS_WEIGHT multiplier.
 *  Module-level export (not in the locked barrel) — the reward-draft harness
 *  (`combat.reward-draft.sim.ts`) ranks reward offers with the same mapping. */
export function focusWeight(focus: CombatDeckFocus, verbClass: CombatVerbClass): number {
    switch (focus) {
        case 'dot':      return verbClass === 'direct-dot' ? FOCUS_WEIGHT : OFF_FOCUS_WEIGHT;
        case 'control':  return verbClass === 'direct-control' || verbClass === 'stat-debuff'
            ? FOCUS_WEIGHT : OFF_FOCUS_WEIGHT;
        case 'damage':   return verbClass === 'direct-damage' ? FOCUS_WEIGHT : OFF_FOCUS_WEIGHT;
        // spec 32 v3: execute is dead — the rush texture is fast afflictions
        // (DoT / exposure) feeding a payoff burst (REAP / RUPTURE).
        case 'rush-execute': return verbClass === 'direct-dot' || verbClass === 'stat-debuff'
            || verbClass === 'direct-damage'
            ? FOCUS_WEIGHT : OFF_FOCUS_WEIGHT;
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
    const lookupCard = (id: string): Card | undefined => merged.get(id) ?? getCardById(id);
    const maxCopies = Math.max(1, options.maxCopies ?? DEFAULT_MAX_COPIES);

    const candidates: DraftCandidate[] = [];
    for (const id of poolIds) {
        const card = toCombatCard(id, lookupCard, lookupEffect);
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
 * the pool allows. No escape card is appended — no in-combat retreat exists.
 * Deterministic for a given rng state. Pass the result straight into
 * `initializeCombatEncounter`.
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

    return deck.map(c => c.id);
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

/** One measurement-seat substitution: every copy of `out` in the resolved
 *  deck is replaced by `in` (copy count preserved). */
export interface CombatDeckSwap {
    out: string;
    in: string;
}

/** How a playtest cell (or CLI invocation) names the deck it wants. */
export type CombatDeckSelection =
    | { kind: 'preset'; presetId: string; swaps?: readonly CombatDeckSwap[] }
    | { kind: 'draft'; focus: CombatDeckFocus; size?: number }
    | { kind: 'cards'; cardIds: readonly string[] }
    | { kind: 'policy-pick' };

/**
 * Applies measurement-seat swaps to a resolved deck list. Swaps apply in
 * order (a later swap may target an id a prior swap introduced); each swap
 * replaces EVERY copy of `out` — the preset recipe's copy count is the seat,
 * not the card. Loud by design (the `/deck-tuning` A/B surface): a swap whose
 * `out` is not in the deck, or whose `in` does not resolve to a library or
 * REGISTERED sandbox card, throws instead of silently no-oping — a silent
 * no-op would corrupt the experiment it was meant to run.
 */
export function applyDeckSwaps(
    cardIds: readonly string[],
    swaps: readonly CombatDeckSwap[],
): string[] {
    let deck = [...cardIds];
    for (const swap of swaps) {
        if (!deck.includes(swap.out)) {
            throw new Error(
                `Deck swap '${swap.out}'->'${swap.in}': '${swap.out}' is not in the resolved deck `
                + `(${deck.join(', ')}).`,
            );
        }
        if (!getCardById(swap.in)) {
            throw new Error(
                `Deck swap '${swap.out}'->'${swap.in}': '${swap.in}' is not a library card or a `
                + `registered sandbox card — apply the sandbox set first (--sandbox=<setId>).`,
            );
        }
        deck = deck.map(id => (id === swap.out ? swap.in : id));
    }
    return deck;
}

/**
 * Resolves a deck selection into a playable card-id list:
 * - 'preset' → `buildPresetDeck(presetId)` (empty for an unknown preset id),
 *   then `applyDeckSwaps` when the selection carries measurement-seat swaps.
 * - 'draft'  → `draftCombatDeck` with the selection's focus/size, scoped to
 *   `stage` when given.
 * - 'cards'  → the trusted list with invalid ids dropped (exactly like
 *   `buildPresetDeck` does). No escape card is appended.
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
        case 'preset': {
            const deck = buildPresetDeck(selection.presetId);
            if (!selection.swaps || selection.swaps.length === 0) return deck;
            return applyDeckSwaps(deck, selection.swaps);
        }
        case 'draft':
            return draftCombatDeck({ focus: selection.focus, size: selection.size, stage, rng });
        case 'cards':
            return selection.cardIds.filter(id => !!getCardById(id));
        case 'policy-pick':
            throw new Error(
                'resolveDeckSelection: \'policy-pick\' must be resolved by the playtest '
                + 'harness (draft with the policy\'s preferredFocus) before this layer.',
            );
    }
}
