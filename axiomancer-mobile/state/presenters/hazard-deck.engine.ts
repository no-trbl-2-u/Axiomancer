/**
 * Persistent Hazard deck presenter (Phase 126).
 *
 * Maps the durable Hazard deck — the implicit starter bag plus the
 * reward / CRACK cards the player has acquired (decoded from
 * `GameState.flags` via the mechanics-owned helpers) — onto a
 * render-ready view-model for the out-of-encounter deck/library
 * screen and the remove-card grid overlay.
 *
 * Pure: no store writes, no rule decisions. The deck COMPOSITION is
 * mechanics truth (`hazardDeckBag` / `hazardStarterBag` /
 * `decodeAcquiredCards`); this presenter only groups, counts, and
 * tallies it for display, then reuses the same `HazardCardVM` stock
 * the in-encounter hand renders (`cardVMFromId`).
 *
 * Deck MUTATION (remove-card) is deliberately NOT implemented here:
 * the brief (Phase 126 §3) forbids local deck-mutation rules, and
 * `axiomancer-mechanics` exposes no remove-card action yet (see
 * `docs/hazard-v2-vs-mechanics-divergence.md` — only
 * `appendAcquiredCard` exists, no counterpart). The VM therefore
 * marks acquired cards as the removable set and carries an explicit
 * `removeBlocked` flag so the screen can present a graceful blocked
 * state instead of silently mutating the save.
 */

import {
    decodeAcquiredCards,
    getHazardCardDef,
    hazardStarterBag,
    type GameState,
    type HazardColor,
} from 'axiomancer-mechanics';

import type { AppStoreState } from '@/state/store';
import { cardVMFromId, type HazardCardVM } from '@/state/presenters/hazard.engine';

// ---------------------------------------------------------------------------
// VM shapes
// ---------------------------------------------------------------------------

/** One distinct card in the deck, with how many copies are held and where they came from. */
export interface HazardDeckEntryVM {
    /** Engine card id (`steps`, `r_grip`, `crack`, …). */
    cardId: string;
    /** Display card view-model (same stock the encounter hand renders). */
    card: HazardCardVM;
    /** Number of copies of this card across the whole deck bag. */
    count: number;
    /** Copies that came from the implicit starter bag (immutable). */
    starterCount: number;
    /** Copies acquired via rewards / consequence (removable when the engine supports it). */
    acquiredCount: number;
    /** True when at least one copy is acquired (and so could be removed). */
    removable: boolean;
    /** True for the dead CRACK / scar cards (rendered with a distinct treatment). */
    scar: boolean;
}

/** Colour-distribution row (red / blue / purple / gold). */
export interface HazardDeckColorTallyVM {
    color: HazardColor;
    label: string;
    count: number;
}

/** Card-type distribution row (NUMBER vs UTILITY vs DEAD). */
export interface HazardDeckTypeTallyVM {
    key: 'number' | 'utility' | 'dead';
    label: string;
    count: number;
}

export interface HazardDeckViewModel {
    /** Total card copies in the deck bag (starter + acquired). */
    totalCards: number;
    /** Distinct card ids in the deck. */
    distinctCards: number;
    /** Copies that are starter-bag cards. */
    starterCards: number;
    /** Copies acquired through rewards / consequences. */
    acquiredCards: number;
    /** Dead CRACK / scar copies. */
    scarCards: number;
    /** Distinct entries, grouped + counted, sorted for display. */
    entries: HazardDeckEntryVM[];
    /** Colour distribution across the whole bag. */
    colorTally: HazardDeckColorTallyVM[];
    /** Card-type distribution across the whole bag. */
    typeTally: HazardDeckTypeTallyVM[];
    /** Keyword distribution (id → count), sorted by frequency then name. */
    keywordTally: { id: string; name: string; count: number }[];
    /**
     * True when the player has acquired at least one removable card —
     * the remove-card grid has something to offer. Starter-only decks
     * have nothing to thin (the starter bag is immutable in the flag
     * model).
     */
    hasRemovable: boolean;
    /**
     * Remove-card is blocked: `axiomancer-mechanics` exposes no
     * engine-owned remove action, and mobile must not mutate the deck
     * locally (Phase 126 §3 / divergence doc). The grid stays usable
     * for inspection + selection but the confirm surfaces this block.
     */
    removeBlocked: boolean;
    /** Player-facing reason shown when a removal is confirmed while blocked. */
    removeBlockedReason: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COLOR_ORDER: HazardColor[] = ['red', 'blue', 'purple', 'gold'];
const COLOR_LABEL: Record<HazardColor, string> = {
    red: 'RED',
    blue: 'BLUE',
    purple: 'PURPLE',
    gold: 'YELLOW',
};

const REMOVE_BLOCKED_REASON =
    'Card removal is not yet available — the rules engine has not opened a remove-card action. Your deck is unchanged.';

const EMPTY_VM: HazardDeckViewModel = Object.freeze({
    totalCards: 0,
    distinctCards: 0,
    starterCards: 0,
    acquiredCards: 0,
    scarCards: 0,
    entries: [],
    colorTally: [],
    typeTally: [],
    keywordTally: [],
    hasRemovable: false,
    removeBlocked: true,
    removeBlockedReason: REMOVE_BLOCKED_REASON,
});

function tallyInc<K extends string>(map: Map<K, number>, key: K, by = 1): void {
    map.set(key, (map.get(key) ?? 0) + by);
}

// ---------------------------------------------------------------------------
// Selector
// ---------------------------------------------------------------------------

/**
 * Build the persistent-deck VM from the run's `flags`. The store
 * spreads the engine `GameState` at its root, so `flags` is read off
 * the same `AppStoreState`. A run with no flags still has the full
 * immutable starter bag, so the VM is never empty in practice.
 */
export function selectHazardDeckViewModel(
    state: Pick<AppStoreState, 'player'> & { flags?: readonly string[] },
): HazardDeckViewModel {
    const flags = (state as unknown as GameState).flags ?? [];

    // Starter bag is the implicit, immutable base; acquired cards are
    // the decoded reward / CRACK flags. Both are mechanics truth.
    const starter = hazardStarterBag();
    const acquired = decodeAcquiredCards(flags);
    if (starter.length === 0 && acquired.length === 0) return EMPTY_VM;

    const starterCounts = new Map<string, number>();
    for (const id of starter) tallyInc(starterCounts, id);
    const acquiredCounts = new Map<string, number>();
    for (const id of acquired) tallyInc(acquiredCounts, id);

    const ids = new Set<string>([...starterCounts.keys(), ...acquiredCounts.keys()]);

    const colorCounts = new Map<HazardColor, number>();
    const typeCounts = new Map<'number' | 'utility' | 'dead', number>();
    const keywordCounts = new Map<string, number>();
    const keywordNames = new Map<string, string>();

    let totalCards = 0;
    let scarCards = 0;

    const entries: HazardDeckEntryVM[] = [];
    for (const cardId of ids) {
        const def = getHazardCardDef(cardId);
        const starterCount = starterCounts.get(cardId) ?? 0;
        const acquiredCount = acquiredCounts.get(cardId) ?? 0;
        const count = starterCount + acquiredCount;
        totalCards += count;

        const card = cardVMFromId(cardId);
        const scar = card.dead === true;
        if (scar) scarCards += count;

        // Colour tally (CRACK counts under its purple identity too).
        // `def.kind` is a HazardColor (red/blue/purple/gold) — the wild
        // hex die never appears as a card colour.
        tallyInc(colorCounts, def.kind, count);

        // Type tally.
        const typeKey: 'number' | 'utility' | 'dead' = scar
            ? 'dead'
            : card.utility
              ? 'utility'
              : 'number';
        tallyInc(typeCounts, typeKey, count);

        // Keyword tally (one per distinct keyword, weighted by copies).
        for (const kw of card.keywords) {
            tallyInc(keywordCounts, kw.id, count);
            keywordNames.set(kw.id, kw.name);
        }

        entries.push({
            cardId,
            card,
            count,
            starterCount,
            acquiredCount,
            removable: acquiredCount > 0,
            scar,
        });
    }

    // Display order: scars last; then by colour order; then name.
    entries.sort((a, b) => {
        if (a.scar !== b.scar) return a.scar ? 1 : -1;
        const ca = COLOR_ORDER.indexOf(a.card.kind as HazardColor);
        const cb = COLOR_ORDER.indexOf(b.card.kind as HazardColor);
        if (ca !== cb) return ca - cb;
        return a.card.name.localeCompare(b.card.name);
    });

    const colorTally: HazardDeckColorTallyVM[] = COLOR_ORDER.map((color) => ({
        color,
        label: COLOR_LABEL[color],
        count: colorCounts.get(color) ?? 0,
    })).filter((row) => row.count > 0);

    const TYPE_LABEL: Record<'number' | 'utility' | 'dead', string> = {
        number: 'NUMBER',
        utility: 'UTILITY',
        dead: 'SCAR',
    };
    const typeTally: HazardDeckTypeTallyVM[] = (['number', 'utility', 'dead'] as const)
        .map((key) => ({ key, label: TYPE_LABEL[key], count: typeCounts.get(key) ?? 0 }))
        .filter((row) => row.count > 0);

    const keywordTally = [...keywordCounts.entries()]
        .map(([id, count]) => ({ id, name: keywordNames.get(id) ?? id, count }))
        .sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name));

    const acquiredTotal = acquired.length;
    const hasRemovable = entries.some((e) => e.removable);

    return {
        totalCards,
        distinctCards: entries.length,
        starterCards: totalCards - acquiredTotal,
        acquiredCards: acquiredTotal,
        scarCards,
        entries,
        colorTally,
        typeTally,
        keywordTally,
        hasRemovable,
        removeBlocked: true,
        removeBlockedReason: REMOVE_BLOCKED_REASON,
    };
}
