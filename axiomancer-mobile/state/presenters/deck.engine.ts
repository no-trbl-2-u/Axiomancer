/**
 * The DECK screen presenter (owner finding 7, ratified decision D2).
 *
 * The player had no player-facing view of the combat deck they carry. The
 * only combat-deck surface in the app was `components/DebugCombatDeck.tsx`,
 * a dev tool that swaps presets — useful for testing, useless as an answer to
 * "what is in my deck?". This presenter is the answer: it maps the run's real
 * deck onto a render-ready view-model for `app/(tabs)/deck/index.tsx`.
 *
 * ## Prior art it deliberately copies
 *
 * `state/presenters/hazard-deck.engine.ts` + `app/hazard-deck/index.tsx` are
 * the house idiom for exactly this screen — a durable, out-of-encounter deck
 * listing with tallies and a tap-to-inspect detail. This file mirrors its
 * shape (group + count distinct ids, tally the axes, sort for display, hand
 * the screen a frozen VM) so the two deck surfaces read as one system.
 *
 * ## Where every word on the screen comes from
 *
 * Nothing here derives card text. Finding 4 — "card details sometimes don't
 * match the actual card" — is a correctness bug caused by text being
 * hand-assembled beside the data instead of generated from it, and a second
 * deck-shaped copy of that assembly would be the same bug again in a new
 * place. So:
 *
 * - the DECK LIST is `buildCombatDeck(player, flags)`, the engine function the
 *   fight itself deals from — loadout-aware, copies preserved;
 * - every printed LINE is the engine's own card projection, `toCombatCard`
 *   (`axiomancer-mechanics/src/Combat/combat.cards.ts`);
 * - the ◇ NO DIE / ◆ +DIE shorthand and the KEYWORD ledger come from
 *   `detailStats` in `combat-encounter.engine.ts` — the SAME presenter call
 *   the combat detail overlay makes, so the two panels cannot disagree. That
 *   call now bottoms out in `axiomancer-mechanics/src/Combat/combat.card-text.ts`
 *   (`paidClauses`), the engine-side clause list that fixed finding 4, so this
 *   screen inherits the fix rather than re-deriving anything;
 * - RARITY comes from `card-rarity.engine.ts` (D4), never re-banded here;
 * - FLAVOR is `Card.description`, read straight off the authored row. Per
 *   finding 6 flavor leaves the combat overlay and lands here: out of a
 *   fight, prose is the point rather than the noise.
 *
 * Pure: no store writes, no rule decisions, no text generation.
 */

import {
    buildCombatDeck,
    getCardById,
    lookupEffect,
    toCombatCard,
    type Card,
    type CardAspect,
    type CardRarity,
    type CombatCard,
    type GameState,
} from '@mechanics';

import {
    RARITY_COLOR,
    RARITY_LABEL,
    RARITY_PIPS,
    rarityFor,
} from '@/state/presenters/card-rarity.engine';
import { detailStats, STANCE_COLORS } from '@/state/presenters/combat-encounter.engine';
import { freezeViewModel } from '@/state/presenters/freeze';
import type { AppStoreState } from '@/state/store';

// ---------------------------------------------------------------------------
// VM shapes
// ---------------------------------------------------------------------------

/** The rarity signal, all three legs of D4 at once (label + pips + colour). */
export interface DeckRarityVM {
    band: CardRarity;
    /** 'Common' | 'Uncommon' | 'Rare'. */
    label: string;
    /** Pip COUNT — the leg that survives greyscale. */
    pips: number;
    /** Frame hue. NEVER rendered as the only cue. */
    color: string;
}

/** One distinct card in the run deck, with how many copies are carried. */
export interface DeckCardVM {
    /** Engine card id. */
    cardId: string;
    name: string;
    /** Copies of this card in the deck the next fight deals. */
    count: number;
    /** Colour identity (heart / body / mind / any). */
    stance: CardAspect;
    stanceLabel: string;
    stanceColor: string;
    /** spell / oath / hex. */
    cardType: 'spell' | 'oath' | 'hex';
    /** Rank ladder position, 1 (Ash) .. 6 (Saint); null on a card with none. */
    rank: number | null;
    rarity: DeckRarityVM;
    /** 'BODY · ASH · SPELL · DOT' — the combat detail's own meta chip. */
    metaChip: string;
    /** One plain sentence: what playing this card does. */
    outcomeLine: string;
    /** The ◇ NO DIE value (D3 keeps the shorthand; only its source changed). */
    freeText: string;
    /** The ◆ +DIE value, or null when the free line already says all of it. */
    paidText: string | null;
    /** 'Stacks by intensity.' and friends; null when the card does not stack. */
    stacksText: string | null;
    /** Printed die-interaction lines (threshold / die bonus / fate), in real units. */
    dieLines: string[];
    /** Oath/hex only: the free-timed vs paid-permanent fork, as one line. */
    durationFooter: string | null;
    /** Keyword ledger — FIRST in the detail, per finding 5. */
    keywords: { name: string; def: string; minor: boolean }[];
    /** Authored prose (`Card.description`). The reason this screen exists. */
    flavor: string | null;
    /** Screen-reader sentence for the tile (rarity named, never colour-only). */
    a11yLabel: string;
}

/** A card-type section of the list. */
export interface DeckGroupVM {
    key: 'spell' | 'oath' | 'hex';
    /** 'SPELLS' | 'OATHS' | 'HEXES'. */
    label: string;
    /** One line saying how this type behaves in a fight. */
    blurb: string;
    /** Distinct cards in the group, sorted for display. */
    cards: DeckCardVM[];
    /** Total COPIES in the group (not distinct rows). */
    count: number;
}

/** A rarity-distribution row. */
export interface DeckRarityTallyVM extends DeckRarityVM {
    /** Copies at this band. */
    count: number;
}

/** A colour-distribution row. */
export interface DeckStanceTallyVM {
    stance: CardAspect;
    label: string;
    color: string;
    count: number;
}

export interface DeckViewModel {
    /** Total card COPIES in the run deck. */
    totalCards: number;
    /** Distinct card ids. */
    distinctCards: number;
    /** Copies at the rare band — the headline "how good is this deck" number. */
    rareCards: number;
    /** Card-type sections, in engine `CardType` union order. */
    groups: DeckGroupVM[];
    /** Rarity distribution, thinnest band first. */
    rarityTally: DeckRarityTallyVM[];
    /** Colour distribution, most-carried first. */
    stanceTally: DeckStanceTallyVM[];
    /** True when the run carries no deck at all. */
    empty: boolean;
    /** What to show instead of a list when `empty`. */
    emptyReason: string;
    /** One line naming WHAT this screen is showing (see `DECK_SOURCE_NOTE`). */
    sourceNote: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Group order. This is the engine `CardType` union's own declaration order
 * (`'spell' | 'oath' | 'hex'`, `axiomancer-mechanics/src/Cards/types.ts`),
 * mirrored rather than invented, and it happens to be the useful one: spells
 * are the cards that cycle, oaths and hexes are the standing passives.
 */
const CARD_TYPE_ORDER: readonly ('spell' | 'oath' | 'hex')[] = ['spell', 'oath', 'hex'];

const CARD_TYPE_LABEL: Readonly<Record<'spell' | 'oath' | 'hex', string>> = Object.freeze({
    spell: 'SPELLS',
    oath: 'OATHS',
    hex: 'HEXES',
});

/** Singular form, for the screen-reader sentence on a single tile. Spelled out
 *  rather than de-pluralised from the label above, because 'HEXES' de-pluralises
 *  to 'hexe'. */
const CARD_TYPE_SINGULAR: Readonly<Record<'spell' | 'oath' | 'hex', string>> = Object.freeze({
    spell: 'spell',
    oath: 'oath',
    hex: 'hex',
});

/**
 * Player-facing blurbs. Each names the one behaviour that makes the type worth
 * grouping by — why a spell is not an oath at the table, not what the words
 * mean. Terms match the engine's own (`Cards/types.ts`, spec 32 v4).
 */
const CARD_TYPE_BLURB: Readonly<Record<'spell' | 'oath' | 'hex', string>> = Object.freeze({
    spell: 'Played, then discarded — they come back around the reshuffle.',
    oath: 'Standing vows on you. Free for a few rounds, permanent with a die.',
    hex: 'Standing curses on the foe. Free for a few rounds, permanent with a die.',
});

const STANCE_LABEL: Readonly<Record<string, string>> = Object.freeze({
    heart: 'HEART', body: 'BODY', mind: 'MIND', any: 'ANY',
});

/**
 * D5-of-the-deck-screen, decided here and worth stating plainly: this screen
 * always shows the FULL RUN DECK, never the draw pile of a fight in progress.
 *
 * Two reasons, one of them decisive. The soft one: the deck a player reasons
 * about between fights is the durable object — a draw-pile view answers a
 * question ("what is left this fight?") that belongs beside the hand, not in
 * a tab. The decisive one: the tab bar is hard-locked while the encounter
 * modal is open (`app/(tabs)/_layout.tsx`, `lockOtherTabs`), so during a fight
 * this tab is unreachable by construction and a draw-pile mode here would be
 * dead code. The alternative — a live draw-pile / discard readout — belongs on
 * the combat board where the player can act on it, and is filed as a follow-up.
 */
export const DECK_SOURCE_NOTE = 'The whole deck you carry — the cards the next fight deals from.';

/**
 * The kept shorthand for the two play lines (D3: the notation stays, only its
 * SOURCE changes). Constants rather than string literals in the component so
 * the deck detail and the combat detail can be pinned to one spelling — and
 * so that when the combat panel's copy of these glyphs moves into a shared
 * card-text projection, there is exactly one place here to re-point.
 */
export const FREE_LINE_LABEL = '◇ NO DIE';
export const PAID_LINE_LABEL = '◆ +DIE';

const EMPTY_REASON = 'No cards yet. Your starting deck is dealt when your run begins.';

const EMPTY_VM: DeckViewModel = Object.freeze({
    totalCards: 0,
    distinctCards: 0,
    rareCards: 0,
    groups: [],
    rarityTally: [],
    stanceTally: [],
    empty: true,
    emptyReason: EMPTY_REASON,
    sourceNote: DECK_SOURCE_NOTE,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Rarity bands, thinnest first.
 *
 * Derived from `RARITY_PIPS` rather than written out, because the pip count IS
 * the band's position on the ladder (common 1 · uncommon 2 · rare 3) and
 * `card-rarity.engine.ts` deliberately exports no `RARITY_ORDER`. Deriving the
 * order from the shared contract keeps one source of truth; hardcoding a
 * second array here would quietly become a place for the two to disagree.
 */
function rarityBandsAscending(): CardRarity[] {
    return (Object.keys(RARITY_PIPS) as CardRarity[])
        .slice()
        .sort((a, b) => RARITY_PIPS[a] - RARITY_PIPS[b]);
}

function rarityVM(band: CardRarity): DeckRarityVM {
    return {
        band,
        label: RARITY_LABEL[band],
        pips: RARITY_PIPS[band],
        color: RARITY_COLOR[band],
    };
}

function tallyInc<K extends string>(map: Map<K, number>, key: K, by = 1): void {
    map.set(key, (map.get(key) ?? 0) + by);
}

/**
 * Build one card's VM from the engine projection plus the SHARED combat
 * detail presenter. Returns null for an id the card library does not know
 * (a save from a retired card set), so an unknown id drops out of the list
 * instead of rendering a blank row.
 */
function deckCardVM(cardId: string, count: number): DeckCardVM | null {
    const sourceCard: Card | undefined = getCardById(cardId);
    const projected: CombatCard | null = toCombatCard(cardId, getCardById, lookupEffect);
    if (!sourceCard || !projected) return null;

    // The same call the combat detail overlay makes. No enemy is in play on
    // this screen, so `enemyDifficulty` is omitted and every number falls back
    // to its un-scaled, authored value — which is the honest thing to print
    // for a card sitting in a deck rather than pointed at a foe.
    const detail = detailStats(projected, sourceCard);

    const band = rarityFor(projected);
    const rarity = rarityVM(band);
    const stance = projected.stance;
    const stanceLabel = STANCE_LABEL[stance] ?? String(stance).toUpperCase();
    const cardType = projected.cardType ?? 'spell';
    const copies = count > 1 ? `, ${count} copies` : '';

    return {
        cardId,
        name: projected.name,
        count,
        stance,
        stanceLabel,
        stanceColor: STANCE_COLORS[stance] ?? STANCE_COLORS.any,
        cardType,
        rank: projected.rank ?? null,
        rarity,
        metaChip: detail.metaChip,
        outcomeLine: detail.outcomeLine,
        freeText: detail.freePill,
        paidText: detail.diePaidLine,
        stacksText: detail.stacksText,
        dieLines: projected.dieLines ? [...projected.dieLines] : [],
        durationFooter: detail.durationFooter,
        keywords: detail.keywords.map((k) => ({ ...k })),
        flavor: sourceCard.description ?? null,
        a11yLabel: `${projected.name}, ${rarity.label}, ${stanceLabel} ${CARD_TYPE_SINGULAR[cardType]}${copies}`,
    };
}

// ---------------------------------------------------------------------------
// Selector
// ---------------------------------------------------------------------------

/**
 * Build the DECK view-model from the run's character and flags.
 *
 * The store spreads the engine `GameState` at its root, so `flags` is read off
 * the same `AppStoreState` — the identical access the hazard-deck presenter
 * makes. `flags` matters: `buildCombatDeck` prefers a curated loadout when the
 * save carries loadout flags, and a deck screen that ignored them would show a
 * different deck than the one the next fight deals.
 */
export function selectDeckViewModel(
    state: Pick<AppStoreState, 'player'> & { flags?: readonly string[] },
): DeckViewModel {
    const player = state.player;
    if (!player) return EMPTY_VM;

    const flags = (state as unknown as GameState).flags ?? [];
    const deck = buildCombatDeck(player, flags);
    if (deck.length === 0) return EMPTY_VM;

    // Copies are real (the engine preserves them), so count them rather than
    // de-duplicating: a deckbuilder's copy counts are load-bearing and the
    // player is here to read exactly that.
    const copies = new Map<string, number>();
    for (const id of deck) tallyInc(copies, id);

    const cards: DeckCardVM[] = [];
    for (const [cardId, count] of copies) {
        const vm = deckCardVM(cardId, count);
        if (vm) cards.push(vm);
    }
    if (cards.length === 0) return EMPTY_VM;

    const rarityCounts = new Map<CardRarity, number>();
    const stanceCounts = new Map<CardAspect, number>();
    let totalCards = 0;
    for (const card of cards) {
        totalCards += card.count;
        tallyInc(rarityCounts, card.rarity.band, card.count);
        tallyInc(stanceCounts, card.stance, card.count);
    }

    const groups: DeckGroupVM[] = [];
    for (const key of CARD_TYPE_ORDER) {
        const inGroup = cards
            .filter((c) => c.cardType === key)
            // Best first. RANK descending is strictly finer than rarity
            // descending (rarity is banded FROM rank), so this orders by
            // rarity for free without inventing a rarity order. Name breaks
            // ties so the list is stable across renders and saves.
            .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0) || a.name.localeCompare(b.name));
        if (inGroup.length === 0) continue;
        groups.push({
            key,
            label: CARD_TYPE_LABEL[key],
            blurb: CARD_TYPE_BLURB[key],
            cards: inGroup,
            count: inGroup.reduce((sum, c) => sum + c.count, 0),
        });
    }

    const rarityTally: DeckRarityTallyVM[] = rarityBandsAscending()
        .map((band) => ({ ...rarityVM(band), count: rarityCounts.get(band) ?? 0 }))
        .filter((row) => row.count > 0);

    const stanceTally: DeckStanceTallyVM[] = [...stanceCounts.entries()]
        .map(([stance, count]) => ({
            stance,
            label: STANCE_LABEL[stance] ?? String(stance).toUpperCase(),
            color: STANCE_COLORS[stance] ?? STANCE_COLORS.any,
            count,
        }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

    return freezeViewModel({
        totalCards,
        distinctCards: cards.length,
        rareCards: rarityCounts.get('rare') ?? 0,
        groups,
        rarityTally,
        stanceTally,
        empty: false,
        emptyReason: EMPTY_REASON,
        sourceNote: DECK_SOURCE_NOTE,
    });
}
