/**
 * Equipment reducers — pure transitions over a `Character` for `equipItem`
 * and `unequipItem`, plus the `getEquipmentModifiers` aggregator the engine
 * uses to fold equipment stat bonuses into `derivedStats` at equip-time
 * (Spec 05 Q3 option A).
 *
 * Design notes:
 *
 * - Equipment `statModifiers` are persistent and folded into `derivedStats`
 *   *at equip-time*. We recompute `derivedStats` from `baseStats` (+ equipment
 *   modifiers) on every equip / unequip, mirroring `deriveStats` so the math
 *   stays in one place.
 * - Equipment is DECOUPLED FROM EFFECTS (phases 20-23). Equipping/unequipping
 *   applies no effect to `Character.effects`; the old effect channels
 *   (`passiveEffects` / `onHitEffects` / `onDefendEffects` / `combatStartTokens`
 *   / `generationBonus`) and their fields were stripped from `Equipment` in the
 *   phase-23 teardown. `statModifiers` (incl. the phase-19 `maxHp`) is now the
 *   SOLE channel from equipment to the character.
 */

import { Character, BaseStats, DerivedStats, EquipmentLoadout } from './types';
import { Equipment, EquipmentSlot, SLOT_CAPACITY } from '../Items/types';
import { StatModifier } from '../Effects/types';
import { Stance } from '../Combat/types';
import { deriveStats } from '../Utils';

/**
 * Aggregated equipment modifier bundle keyed by stat. Mirrors the shape
 * produced by `getActiveEffectModifiers` for active effects so equipment
 * and effects can share the same recompute pipeline.
 */
export interface AggregatedEquipmentModifiers {
    statFlat:      Map<string, number>;
    statMultBonus: Map<string, number>;
}

const emptyAgg = (): AggregatedEquipmentModifiers => ({
    statFlat:      new Map(),
    statMultBonus: new Map(),
});

const addToMap = (m: Map<string, number>, key: string, value: number): void => {
    m.set(key, (m.get(key) ?? 0) + value);
};

const STANCE_KEYS: ReadonlyArray<Stance> = ['body', 'mind', 'heart'];
const isStanceKey = (s: string): s is Stance =>
    (STANCE_KEYS as readonly string[]).includes(s);

/**
 * Folds every worn item's `statModifiers` into a single aggregated bundle.
 * Same intensity / multiplier conventions as the active-effects path: flat
 * mods sum, multiplier mods accumulate additively over 1.0 so the consumer
 * applies them as `base × (1 + Σ (m - 1))`.
 */
export function getEquipmentModifiers(
    loadout: EquipmentLoadout,
): AggregatedEquipmentModifiers {
    const agg = emptyAgg();
    for (const piece of getEquippedItems(loadout)) {
        if (!piece.statModifiers) continue;
        for (const mod of piece.statModifiers) {
            if (mod.isMultiplier) {
                addToMap(agg.statMultBonus, mod.stat, mod.value - 1);
            } else {
                addToMap(agg.statFlat, mod.stat, mod.value);
            }
        }
    }
    return agg;
}

/**
 * Recomputes `derivedStats` from the wearer's `baseStats` plus every equipped
 * item's `statModifiers`. Per Spec 05 Q2 we use the same `StatModifier` shape
 * as effects so both systems can plug into the same aggregate.
 *
 * Pipeline:
 *   1. Effective base stats = (base + Σ flat) × (1 + Σ (mult - 1))
 *   2. Re-derive `derivedStats` from the effective base stats.
 *   3. Add per-derived-stat flat / multiplier modifiers on top.
 */
function applyFlatAndMult(base: number, flat: number, multBonus: number): number {
    return (base + flat) * (1 + multBonus);
}

export function recomputeDerivedStats(
    baseStats: BaseStats,
    mods: AggregatedEquipmentModifiers,
): DerivedStats {
    const stanceFlat = (s: Stance): number => mods.statFlat.get(s) ?? 0;
    const stanceMult = (s: Stance): number => mods.statMultBonus.get(s) ?? 0;

    const effBase: BaseStats = {
        body:  applyFlatAndMult(baseStats.body,  stanceFlat('body'),  stanceMult('body')),
        mind:  applyFlatAndMult(baseStats.mind,  stanceFlat('mind'),  stanceMult('mind')),
        heart: applyFlatAndMult(baseStats.heart, stanceFlat('heart'), stanceMult('heart')),
    };

    const derived = deriveStats(effBase);

    const derivedKeys = [
        'physicalAttack', 'physicalDefense',
        'mentalAttack',   'mentalDefense',
        'emotionalAttack','emotionalDefense',
        'luck',
    ] as const;

    const patched = { ...derived } as DerivedStats;
    for (const key of derivedKeys) {
        const flat = mods.statFlat.get(key) ?? 0;
        const mult = mods.statMultBonus.get(key) ?? 0;
        patched[key] = applyFlatAndMult(derived[key], flat, mult);
    }
    return patched;
}

/**
 * Summed worn `maxHp` bonus (Phase 19). The two armor relics carry a flat
 * `{ stat: 'maxHp' }` modifier; it is folded onto `Character.maxHealth` here,
 * NOT into `DerivedStats` (which has no HP field — `recomputeDerivedStats`
 * reads only stance/derived keys, so a `maxHp` entry in `statFlat` is inert
 * there). Multiplier `maxHp` mods are unsupported (no content uses them).
 */
export function wornMaxHpBonus(loadout: EquipmentLoadout): number {
    return getEquipmentModifiers(loadout).statFlat.get('maxHp') ?? 0;
}

/**
 * Rebuilds a `Character` around a new loadout: recomputes `derivedStats` and
 * folds the worn `maxHp` delta onto `maxHealth` (growing/clamping current
 * `health` by the same delta, mirroring the stat-allocation HP convention).
 * Shared tail for equip/unequip.
 *
 * Phase 20 — equipment is decoupled from effects: equipping/unequipping no
 * longer touches `Character.effects` (no `passiveEffects` are applied or
 * removed). `statModifiers` (incl. the phase-19 `maxHp`) is the SOLE channel
 * from equipment to the character.
 */
function withLoadout(
    character: Character,
    nextLoadout: EquipmentLoadout,
): Character {
    const mods = getEquipmentModifiers(nextLoadout);
    const nextDerived = recomputeDerivedStats(character.baseStats, mods);

    // Fold the worn maxHp delta onto maxHealth. Equipping a +maxHp armor relic
    // grows current health by the same delta; unequipping lowers maxHealth and
    // clamps health down. `character.maxHealth` already includes the previous
    // loadout's bonus, so the delta is exact and idempotent.
    const hpDelta = (mods.statFlat.get('maxHp') ?? 0) - wornMaxHpBonus(character.equipment);
    const nextMaxHealth = character.maxHealth + hpDelta;
    const nextHealth = Math.max(0, Math.min(character.health + hpDelta, nextMaxHealth));

    return {
        ...character,
        equipment:    nextLoadout,
        derivedStats: nextDerived,
        maxHealth:    nextMaxHealth,
        health:       nextHealth,
    };
}

/**
 * Equips `item` into its slot kind (Phase 18):
 *
 * - **weapon / armor** — replace in place (today's semantics). We don't return
 *   the displaced piece here; callers that need it back in `inventory` chain
 *   `unequipItem` + `addItem` first, per the existing convention.
 * - **accessory** — fills the first free accessory position. When all 3 are
 *   full, a passed `replaceIndex` (0-2) swaps that position; without it the
 *   equip is a **guarded no-op** (returns the same character reference — the
 *   caller surfaces "accessory slots full"), never a throw or silent replace.
 *
 * Pure — returns a new `Character` (or the same reference on the full no-op).
 */
export function equipItem(
    character: Character,
    item: Equipment,
    opts?: { replaceIndex?: number },
): Character {
    const loadout = character.equipment;
    const slot = item.slot;

    if (slot === 'weapon') {
        return withLoadout(character, { ...loadout, weapon: item });
    }
    if (slot === 'armor') {
        return withLoadout(character, { ...loadout, armor: item });
    }

    // accessory
    const acc = loadout.accessories;
    if (acc.length < SLOT_CAPACITY.accessory) {
        return withLoadout(character, { ...loadout, accessories: [...acc, item] });
    }
    // Full row: honour an explicit replaceIndex, otherwise guarded no-op.
    const idx = opts?.replaceIndex;
    if (idx === undefined || !Number.isInteger(idx) || idx < 0 || idx >= acc.length) {
        return character;
    }
    const nextAcc = acc.slice();
    nextAcc[idx] = item;
    return withLoadout(character, { ...loadout, accessories: nextAcc });
}

/**
 * Unequips the piece in `slot`. For `'accessory'`, `index` selects which of the
 * ≤3 positions to free (required); the remaining accessories compact toward the
 * front (positions have no identity). For weapon/armor, `index` is ignored.
 * No-op (returns the same character reference) when the target is empty or the
 * accessory index is out of range. Pure.
 */
export function unequipItem(
    character: Character,
    slot: EquipmentSlot,
    index?: number,
): Character {
    const loadout = character.equipment;

    if (slot === 'weapon') {
        if (!loadout.weapon) return character;
        return withLoadout(character, { ...loadout, weapon: null });
    }
    if (slot === 'armor') {
        if (!loadout.armor) return character;
        return withLoadout(character, { ...loadout, armor: null });
    }

    // accessory
    const acc = loadout.accessories;
    if (index === undefined || !Number.isInteger(index) || index < 0 || index >= acc.length) {
        return character;
    }
    const nextAcc = acc.slice();
    nextAcc.splice(index, 1);
    return withLoadout(character, { ...loadout, accessories: nextAcc });
}

/**
 * List of every worn piece in canonical order (weapon, armor, accessories by
 * position). Used by `getEquipmentModifiers`, the save migration and dev
 * tooling — anything that walks equipment without caring about slot identity.
 */
export function getEquippedItems(loadout: EquipmentLoadout): Equipment[] {
    const out: Equipment[] = [];
    if (loadout.weapon) out.push(loadout.weapon);
    if (loadout.armor)  out.push(loadout.armor);
    for (const a of loadout.accessories) out.push(a);
    return out;
}

// Internal helper exported only for tests / hermetic e2e introspection.
export { isStanceKey as _isStanceKey };
// Re-export so `equipment.reducer` is a single import surface for callers that
// also want a single `StatModifier`-shaped contract.
export type { StatModifier };
