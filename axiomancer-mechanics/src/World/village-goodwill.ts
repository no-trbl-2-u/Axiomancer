/**
 * Phase 65 — village goodwill reward tiers. All three thresholds read
 * `GameState.mapGoodwill[mapName]` and are checked with `>=`, not `===`, so
 * a save that already holds a qualifying tally (e.g. from Phase 63 having
 * shipped before this phase) qualifies the next time any of these are
 * checked — no backfill migration needed. Tier 2/3 grants are themselves
 * idempotent (knownCards-includes / flags-includes at the call site), so
 * re-checking on every sacrifice claim is always safe.
 */

export const GOODWILL_DISCOUNT_THRESHOLD = 1;
/** 10% off BUY prices only — sell prices are untouched. */
export const GOODWILL_DISCOUNT_RATE = 0.10;

export const GOODWILL_ALLY_THRESHOLD = 2;
/** The Ally granted at Tier 2. Phase 62's only shipped Ally. */
export const GOODWILL_ALLY_CARD_ID = 'the-sworn-second';

export const GOODWILL_BONUS_THRESHOLD = 3;
export const GOODWILL_BONUS_CURRENCY = 25;
export const GOODWILL_BONUS_FLAG_PREFIX = 'village-goodwill-bonus:';

/**
 * Buy-price after the Tier 1 discount. Floors, matching `defaultSellPrice`'s
 * rounding convention. No-ops (returns `price` unchanged) below threshold.
 */
export function applyGoodwillDiscount(price: number, goodwillCount: number): number {
    if (goodwillCount < GOODWILL_DISCOUNT_THRESHOLD) return price;
    return Math.max(0, Math.floor(price * (1 - GOODWILL_DISCOUNT_RATE)));
}

/** The per-map flag id gating the one-time Tier 3 currency gift. */
export function goodwillBonusFlag(mapName: string): string {
    return `${GOODWILL_BONUS_FLAG_PREFIX}${mapName}`;
}
