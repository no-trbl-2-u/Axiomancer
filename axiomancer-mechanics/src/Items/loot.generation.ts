/**
 * Loot generation — engine-owned procedural drops (Phase 154).
 *
 * The single source of loot truth: rolls real, level-appropriate equipment
 * with rarity-correct named affixes, drawing rarity from the engine's own
 * `rarityWeightTable`. Absorbed from the mobile app (`state/loot/affix-roll`,
 * `state/cache/loot-table`, `state/dev/loot-rarity`) so every drop site —
 * dev tools, loot caches, future drop sources — rolls affixes the same way and
 * mobile keeps only presentation + store-dispatch.
 *
 * Three surfaces:
 *   - {@link equipmentFromTemplate} — inflate an authored template into a bare
 *     base-rarity instance (no rolled affixes), for static seeds / grants.
 *   - {@link rollCacheLoot} — deterministic loot-cache reward set (N items by
 *     rarity + a `rich`-tier unique chance) seeded from a cache seed.
 *   - {@link generateRarityDrop} — generate one verified drop at a requested
 *     rarity (dev "loot rarity" tools); picks an eligible template, rolls, and
 *     verifies the realised affix/modifier count so a drop is never reported at
 *     the wrong rarity.
 *
 * Determinism: same inputs + same seed → same items. All randomness flows
 * through a caller-supplied / seed-derived rng.
 */

import {
    AFFIXES_PER_RARITY,
    countNamedAffixes,
    dropItemAtRarity,
    hasBakedAffix,
    rarityWeightTable,
} from './item.factory';
import { equipmentTemplates } from './equipment.templates';
import { uniqueTemplates } from './unique.templates';
import type {
    Equipment,
    EquipmentTemplate,
    Item,
    ItemRarity,
    UniqueItemTemplate,
} from './types';

// ─── Template inflation ───────────────────────────────────────────────────────

/**
 * Inflate an authored `EquipmentTemplate` into a bare, base-rarity `Equipment`
 * instance ready to drop into an inventory: the template's slot + base stat
 * modifiers, stamped `common` with no rolled affixes. Use for static seeds and
 * fixed grants; use {@link dropItemAtRarity} / {@link rollCacheLoot} when you
 * want a *rolled* drop with rarity-appropriate affixes.
 *
 * Maps the template's `baseStatModifiers` onto the instance's `statModifiers`
 * (the field the equip reducer and inventory presenter both read).
 */
export function equipmentFromTemplate(template: EquipmentTemplate): Equipment {
    return {
        id: template.id,
        name: template.name,
        description: template.description,
        category: 'equipment',
        slot: template.slot,
        rarity: 'common',
        requiredLevel: template.requiredLevel,
        statModifiers: template.baseStatModifiers ?? [],
    };
}

// ─── Seeded PRNG (self-contained; same family as the minigame seed paths) ─────

/** mulberry32 — small deterministic PRNG. */
function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return function next(): number {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Pick an integer in [min, max] inclusive from an rng. */
function rollInt(rng: () => number, min: number, max: number): number {
    if (max <= min) return min;
    return min + Math.floor(rng() * (max - min + 1));
}

/** Draw one element uniformly, or null when the pool is empty. */
function drawOne<T>(pool: readonly T[], rng: () => number): T | null {
    if (pool.length === 0) return null;
    return pool[Math.floor(rng() * pool.length)];
}

// ─── Loot-cache reward table ────────────────────────────────────────────────

/** Reward depth. `modest` = early locales, `rich` = deeper locales. */
export type CacheLootTier = 'modest' | 'rich';

export interface RollCacheLootOptions {
    /** Player level — the factory throws below a template's requiredLevel. */
    playerLevel: number;
    /** Deterministic seed (cache seed). */
    seed: number;
    /** Reward depth: scales item count + the unique-relic chance. */
    tier: CacheLootTier;
}

interface TierTuning {
    /** Inclusive [min, max] equipment drops. */
    count: readonly [number, number];
    /** Per-cache chance (0..1) of an extra unique relic. */
    uniqueChance: number;
}

/**
 * Tier tuning. `modest` leans 1–2 pieces and no relic; `rich` leans 2–3 pieces
 * with a 12% unique chance. Rarity *inside* each drop is the engine's own
 * weighted draw — tier only scales quantity + the relic gamble.
 */
export const CACHE_LOOT_TUNING: Readonly<Record<CacheLootTier, TierTuning>> = Object.freeze({
    modest: { count: [1, 2], uniqueChance: 0 },
    rich: { count: [2, 3], uniqueChance: 0.12 },
});

/** Procedural rarities (common/uncommon/rare) and their engine weights — the
 * `unique` row is dropped here because uniques come from the separate
 * `rich`-tier relic chance, not the per-drop rarity table. */
const PROCEDURAL_RARITY_WEIGHTS: ReadonlyArray<readonly [ItemRarity, number]> = (
    rarityWeightTable as ReadonlyArray<readonly [ItemRarity, number]>
).filter(([rarity]) => rarity !== 'unique');

/** Draw a procedural rarity from the engine's own weight table. */
function drawProceduralRarity(rng: () => number): ItemRarity {
    const total = PROCEDURAL_RARITY_WEIGHTS.reduce((sum, [, w]) => sum + w, 0);
    let roll = rng() * total;
    for (const [rarity, weight] of PROCEDURAL_RARITY_WEIGHTS) {
        roll -= weight;
        if (roll < 0) return rarity;
    }
    return PROCEDURAL_RARITY_WEIGHTS[0][0];
}

/**
 * Roll a real loot/relic reward set from engine truth.
 *
 * - Filters `equipmentTemplates` to those the player's level clears and that
 *   carry no baked affix (a baked affix would break the rarity↔affix-count
 *   contract).
 * - Draws a tier-scaled count of templates and rolls each via
 *   {@link dropItemAtRarity} (rarity from the engine weight table; named
 *   affixes by rarity).
 * - On `rich` tier, rolls a unique-relic chance against level-eligible
 *   `uniqueTemplates`; on a hit, appends a unique drop.
 * - Empty eligible pool (e.g. level 0) → returns `[]`. Never throws.
 */
export function rollCacheLoot(opts: RollCacheLootOptions): Item[] {
    const { playerLevel, seed, tier } = opts;
    const rng = mulberry32(seed);
    const tuning = CACHE_LOOT_TUNING[tier];

    const eligibleEquip: EquipmentTemplate[] = equipmentTemplates.filter(
        (t) => t.requiredLevel <= playerLevel && !hasBakedAffix(t),
    );

    const out: Item[] = [];
    if (eligibleEquip.length > 0) {
        const count = rollInt(rng, tuning.count[0], tuning.count[1]);
        for (let i = 0; i < count; i++) {
            const tpl = drawOne(eligibleEquip, rng);
            if (!tpl) continue;
            try {
                const rarity = drawProceduralRarity(rng);
                out.push(dropItemAtRarity(tpl.id, playerLevel, rarity, rng));
            } catch {
                // Level gate is pre-filtered; any residual throw must not
                // strand the reward — skip this slot.
            }
        }
    }

    if (tuning.uniqueChance > 0 && rng() < tuning.uniqueChance) {
        const eligibleUnique: UniqueItemTemplate[] = uniqueTemplates.filter(
            (t) => t.requiredLevel <= playerLevel,
        );
        const relic = drawOne(eligibleUnique, rng);
        if (relic) {
            try {
                out.push(dropItemAtRarity(relic.id, playerLevel, 'unique', rng));
            } catch {
                // Same defensive skip as the equipment loop.
            }
        }
    }

    return out;
}

// ─── Verified single rarity drop (dev "loot rarity" tools) ────────────────────

export interface GenerateRarityDropOptions {
    /** Player level — gates eligible templates and scales mod bands. */
    playerLevel: number;
    /** Uniform `[0,1)` rng. Defaults to `Math.random`. */
    rng?: () => number;
    /** Bounded attempt cap — never an unbounded retry loop. Defaults to 16. */
    maxAttempts?: number;
}

export interface GenerateRarityDropResult {
    /** The generated drop, or null when generation failed. */
    item: Equipment | null;
    /** The requested rarity. */
    rarity: ItemRarity;
    /**
     * Realised affix / modifier count for the drop — named affixes for
     * common/uncommon/rare, fixed-modifier count for unique. Null on failure.
     */
    affixCount: number | null;
    /** Human-readable reason when `item` is null. */
    reason: string | null;
}

/**
 * Realised affix/modifier count for verification + reporting. Uniques carry
 * fixed modifiers (not prefix/suffix affixes), so they count `rolledMods`;
 * everything else counts named affixes.
 */
function realisedCount(item: Equipment, rarity: ItemRarity): number {
    return rarity === 'unique' ? item.rolledMods?.length ?? 0 : countNamedAffixes(item);
}

/**
 * Generate one verified drop at the requested rarity.
 *
 * Picks a level-eligible base template (uniques source from `uniqueTemplates`;
 * procedural rarities draw only from templates with no baked affix), rolls it
 * via {@link dropItemAtRarity}, and verifies the realised affix/modifier count
 * matches the rarity's target before accepting — so a drop is never reported at
 * the wrong rarity. Walks the eligible pool from a (deterministic-with-seed)
 * start within a bounded attempt cap.
 *
 * Never throws: a failure to generate returns `item: null` with a visible
 * reason. The caller owns inventory injection + instance-id assignment.
 */
export function generateRarityDrop(
    rarity: ItemRarity,
    opts: GenerateRarityDropOptions,
): GenerateRarityDropResult {
    const { playerLevel, rng = Math.random, maxAttempts = 16 } = opts;
    const target = AFFIXES_PER_RARITY[rarity];

    const eligible: readonly (EquipmentTemplate | UniqueItemTemplate)[] =
        rarity === 'unique'
            ? uniqueTemplates.filter((t) => t.requiredLevel <= playerLevel)
            : equipmentTemplates.filter(
                  (t) => t.requiredLevel <= playerLevel && !hasBakedAffix(t),
              );

    if (eligible.length === 0) {
        return {
            item: null,
            rarity,
            affixCount: null,
            reason:
                rarity === 'unique'
                    ? `no unique relic is available at level ${playerLevel}`
                    : `no level-eligible base template at level ${playerLevel}`,
        };
    }

    // Walk the pool from a varying start so repeated calls vary the base item,
    // bounded by the attempt cap.
    const start = Math.floor(rng() * eligible.length);
    let attempts = 0;
    for (let i = 0; i < eligible.length; i++) {
        if (attempts >= maxAttempts) break;
        attempts++;
        const tpl = eligible[(start + i) % eligible.length];
        try {
            const item = dropItemAtRarity(tpl.id, playerLevel, rarity, rng);
            if (realisedCount(item, rarity) !== target) continue;
            return { item, rarity, affixCount: realisedCount(item, rarity), reason: null };
        } catch {
            // This base template could not roll the requested rarity; try the
            // next one within the bounded cap.
        }
    }

    return {
        item: null,
        rarity,
        affixCount: null,
        reason: `could not generate a ${rarity} drop after ${attempts} attempts`,
    };
}
