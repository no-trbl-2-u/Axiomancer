/**
 * Weighted loot-table roller (Spec 07 Q7B).
 *
 * `LootTableEntry { item, weight }` lets enemies express dynamic drop tables
 * — empty buckets (`item: null`) carry the no-drop weight so probability is
 * explicit. The roller normalises weights at call time and returns one entry.
 *
 * RNG injection: pass a `rng()` returning a number in [0, 1). Defaults to
 * `Math.random`. Tests stub via the helpers in `src/test-utils/rng.ts`
 * (`mockSequentialRng` / `mockFixedRng` / `mockAlternatingRng`) or by
 * passing a scripted function.
 */

import { Item } from '../Items/types';
import { LootTableEntry } from './types';
import { getRng } from '../Utils/rng';

/** Pluggable RNG. Returns a number in `[0, 1)`. */
export type LootRng = () => number;

/**
 * Rolls a single drop from `table`. Returns the rolled `Item` or `null` for
 * a no-drop bucket / empty table. Negative or zero weights are ignored so
 * library authors can disable an entry by zeroing its weight without
 * removing it from the table.
 */
export function rollLoot(
    table: LootTableEntry[] | undefined,
    rng: LootRng = () => getRng().random(),
): Item | null {
    if (!table || table.length === 0) return null;

    const positive = table.filter(e => e.weight > 0);
    const totalWeight = positive.reduce((sum, e) => sum + e.weight, 0);
    if (totalWeight <= 0) return null;

    const roll = rng() * totalWeight;
    let cursor = 0;
    for (const entry of positive) {
        cursor += entry.weight;
        if (roll < cursor) return entry.item;
    }
    // Floating-point boundary fallback — return the last positive entry's item.
    return positive[positive.length - 1].item;
}

/**
 * Convenience: roll `n` times against the same table, returning the
 * non-null drops. Multi-roll behaviour is mostly for future "elite drops
 * twice" semantics; today most callers just call `rollLoot` once.
 */
export function rollLootMany(
    table: LootTableEntry[] | undefined,
    n: number,
    rng: LootRng = () => getRng().random(),
): Item[] {
    const out: Item[] = [];
    for (let i = 0; i < n; i++) {
        const drop = rollLoot(table, rng);
        if (drop) out.push(drop);
    }
    return out;
}
