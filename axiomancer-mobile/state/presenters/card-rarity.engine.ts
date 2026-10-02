/**
 * Card rarity affordance — the single mobile source for the rarity signal.
 *
 * ## Why this module exists
 *
 * Rarity shows as one legible signal — **named label + pip row + frame
 * colour, never colour alone** — on the card face, in the rewards overlay, in
 * the detail panel, and on the DECK screen. Four surfaces agreeing needs one
 * module; this is it.
 *
 * ## Rarity is DERIVED, never stored
 *
 * There is no `rarity` field on an authored card row. Cards author
 * `rank: 1..6` (Ash · Tooth · Splinter · Rib · Skull · Saint) and the engine
 * bands it: `rankToRarity()` in `axiomancer-mechanics/src/Cards/types.ts`
 * (common = 1-2, uncommon = 3-4, rare = 5-6). That function is the rule and
 * it stays in mechanics — this module never re-implements the banding, it
 * only calls it and dresses the answer. Keeping the derivation single-sourced
 * is the same law that makes `combat.cards.ts` project
 * `rarity: rankToRarity(card.rank)` onto `CombatCard` rather than letting
 * card authors type a rarity by hand.
 *
 * ## Cards only
 *
 * This module is for CARDS. The signet `Equipment` carries no `rarity`
 * field, every relic is `common` by
 * construction, and the aftermath panel hardcodes `'common'`. Do not reach
 * for this module from an equipment or loot surface (that is
 * `components/inventory/rarityAffordance.ts`), and do not reach for it from
 * the Hazard deck (hazard cards carry their own rarity in
 * `src/World/Hazard/hazard.content.ts`). Different systems, deliberately.
 *
 * ## On the fixed hues below
 *
 * `RARITY_COLOR` reads fixed `HUE` colours (`theme/hue.ts`) rather than
 * theme-driven `AXM` tokens. Rarity is a fixed identity signal that must read
 * the same in every theme — a themed rarity hue would make "purple = rare"
 * unlearnable across a theme switch.
 *
 * Pure: no store reads, no store writes, no rule decisions.
 */

import { rankToRarity, type CardRank, type CardRarity } from '@mechanics';
import { HUE } from '@/theme/axm';

/**
 * The structural shape this module reads a rarity out of.
 *
 * Deliberately loose so every card-ish object in the app satisfies it
 * without a cast or an adapter:
 * - an authored `Card` from the library (`rank` required, no `rarity`);
 * - a projected `CombatCard` from `combat.cards.ts` (`rank?` and `rarity?`,
 *   both optional on the VM type);
 * - a hand/deck view-model that carried only one of the two forward.
 *
 * `null` is accepted alongside `undefined` on both fields because view-models
 * that round-trip through a persisted save can surface an explicit null.
 */
export interface RarityCard {
    /** The authored rank ladder position, 1 (Ash) .. 6 (Saint). */
    rank?: number | null;
    /** A rarity already banded by the engine's projection, if one came along. */
    rarity?: CardRarity | null;
}

/** The banding a card falls back to when it carries no usable rarity signal. */
const DEFAULT_RARITY: CardRarity = 'common';

/**
 * Player-facing name for each band (the "named label" leg).
 *
 * Title case. Screens that shout their chrome
 * (the name band, a chip) apply `textTransform: 'uppercase'` themselves — the
 * casing of a rendered label is the renderer's call, the words are not.
 */
export const RARITY_LABEL: Readonly<Record<CardRarity, string>> = Object.freeze({
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
});

/**
 * How many pips to draw for each band (the "pip row" leg) — one per rank
 * pair, so the count climbs with the ladder: Ash/Tooth 1, Splinter/Rib 2,
 * Skull/Saint 3.
 *
 * The pip COUNT is what survives greyscale and colour blindness, so it is the
 * load-bearing half of the signal and the colour is the decoration. A surface
 * that can only afford one of the two must keep this one.
 */
export const RARITY_PIPS: Readonly<Record<CardRarity, number>> = Object.freeze({
    common: 1,
    uncommon: 2,
    rare: 3,
});

/**
 * Frame / pip hue for each band (the "frame colour" leg).
 *
 * Never render this as the ONLY rarity cue — pair it with
 * {@link RARITY_LABEL} or {@link RARITY_PIPS}.
 */
export const RARITY_COLOR: Readonly<Record<CardRarity, string>> = Object.freeze({
    common: HUE.stoneGrey,
    uncommon: HUE.blockBlue,
    rare: HUE.rareViolet,
});

/** The three bands, as a runtime-checkable set for validating loose input. */
const KNOWN_RARITIES: ReadonlySet<string> = new Set<CardRarity>(['common', 'uncommon', 'rare']);

/**
 * Coerce a loosely-typed rank into a real `CardRank`.
 *
 * @param rank - a rank off a card-ish object: may be absent, null, a float, or
 *   out of the authored 1..6 band if it came from a save or a test fixture.
 * @returns the rank clamped into 1..6, or `null` when there is no usable
 *   number at all.
 *
 * Clamping rather than rejecting is deliberate: an off-ladder rank is still an
 * ORDERING, so a hypothetical rank 7 reading as `rare` is the honest answer,
 * where falling back to `common` would actively mislead. A non-number tells us
 * nothing, so it yields `null` and lets the caller fall back.
 */
function normalizeRank(rank: number | null | undefined): CardRank | null {
    if (typeof rank !== 'number' || !Number.isFinite(rank)) return null;
    const clamped = Math.min(6, Math.max(1, Math.round(rank)));
    return clamped as CardRank;
}

/**
 * The rarity band to show for a card.
 *
 * @param card - anything carrying a `rank` and/or a projected `rarity`; an
 *   authored `Card`, a projected `CombatCard`, a hand/deck VM, or nullish.
 * @returns the card's band: `'common' | 'uncommon' | 'rare'`.
 *
 * Resolution order, and why:
 * 1. **`rank`, banded through the engine's `rankToRarity`.** Rank is what the
 *    card actually authors, so it is the truth. If a projection ever drifts
 *    from its own rank, the rank wins — the same truth-first stance the card
 *    detail work (finding 4) applies to every other printed number.
 * 2. **A projected `rarity`**, used only when no usable rank came along, and
 *    only when it is one of the three real bands.
 * 3. **`'common'`**, for a card carrying neither. This matches the `?? 'common'`
 *    fallbacks already written at both existing call sites, so adopting the
 *    module cannot change what an unranked card renders as.
 *
 * Total and pure: never throws, never mutates, same input always yields the
 * same band.
 */
export function rarityFor(card: RarityCard | null | undefined): CardRarity {
    const rank = normalizeRank(card?.rank);
    if (rank !== null) return rankToRarity(rank);
    const projected = card?.rarity;
    if (typeof projected === 'string' && KNOWN_RARITIES.has(projected)) return projected;
    return DEFAULT_RARITY;
}
