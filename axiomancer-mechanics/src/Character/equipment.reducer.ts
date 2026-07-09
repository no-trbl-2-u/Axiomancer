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
 * - Equipment `passiveEffects` are pushed into `Character.effects` as
 *   permanent `ActiveEffect`s (`remainingDuration: -1`). The `sourceId` is
 *   set to the item's `id` so `unequipItem` can remove exactly those entries.
 *   Per Spec 05 Q5 they never tick and disappear when the item is removed.
 * - Equipment `onHitEffects` / `onDefendEffects` are consumed by the combat
 *   resolver (Spec 05 Q6 option A — they share the Spec 03 proc roll) and are
 *   not modelled as `ActiveEffect`s on the character.
 */

import { Character, BaseStats, DerivedStats, EquipmentLoadout } from './types';
import { Equipment, EquipmentSlot, SLOT_CAPACITY } from '../Items/types';
import { ActiveEffect, StatModifier } from '../Effects/types';
import { Stance } from '../Combat/types';
import { lookupEffect } from '../Effects/effects.library';
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
 * Pushes the equipment's `passiveEffects` onto the character's `effects`
 * array as permanent (`remainingDuration: -1`) ActiveEffects, tagging each
 * with `sourceId = item.id` so `unequipItem` can later remove exactly those
 * entries. Unknown effect IDs are skipped silently.
 */
function applyPassiveEffects(
    effects: ActiveEffect[],
    item: Equipment,
): ActiveEffect[] {
    if (!item.passiveEffects || item.passiveEffects.length === 0) return effects;
    const additions: ActiveEffect[] = [];
    for (const effectId of item.passiveEffects) {
        const def = lookupEffect(effectId);
        if (!def) continue;
        additions.push({
            effectId,
            remainingDuration: -1,
            intensity:         1,
            appliedAt:         0,
            tier:              def.tier,
            resistedBy:        def.resistedBy,
            resistDR:          def.resistDR,
            sourceId:          item.id,
        });
    }
    return [...effects, ...additions];
}

/**
 * Removes every passive `ActiveEffect` whose `sourceId` matches the unequipped
 * item's `id`. Active effects from other sources (other equipment, ongoing
 * combat) are preserved.
 */
function removePassiveEffects(
    effects: ActiveEffect[],
    itemId: string,
): ActiveEffect[] {
    return effects.filter(ae => ae.sourceId !== itemId);
}

/**
 * Rebuilds a `Character` around a new loadout: recomputes `derivedStats`,
 * swaps the displaced piece's passives out (`displacedId`) and applies the
 * newly-worn item's passives (`applied`). Shared tail for equip/unequip.
 */
function withLoadout(
    character: Character,
    nextLoadout: EquipmentLoadout,
    displacedId: string | null,
    applied: Equipment | null,
): Character {
    let nextEffects = character.effects;
    if (displacedId) nextEffects = removePassiveEffects(nextEffects, displacedId);
    if (applied)     nextEffects = applyPassiveEffects(nextEffects, applied);

    const mods = getEquipmentModifiers(nextLoadout);
    const nextDerived = recomputeDerivedStats(character.baseStats, mods);

    return {
        ...character,
        equipment:    nextLoadout,
        derivedStats: nextDerived,
        effects:      nextEffects,
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
        return withLoadout(character, { ...loadout, weapon: item }, loadout.weapon?.id ?? null, item);
    }
    if (slot === 'armor') {
        return withLoadout(character, { ...loadout, armor: item }, loadout.armor?.id ?? null, item);
    }

    // accessory
    const acc = loadout.accessories;
    if (acc.length < SLOT_CAPACITY.accessory) {
        return withLoadout(character, { ...loadout, accessories: [...acc, item] }, null, item);
    }
    // Full row: honour an explicit replaceIndex, otherwise guarded no-op.
    const idx = opts?.replaceIndex;
    if (idx === undefined || !Number.isInteger(idx) || idx < 0 || idx >= acc.length) {
        return character;
    }
    const displaced = acc[idx];
    const nextAcc = acc.slice();
    nextAcc[idx] = item;
    return withLoadout(character, { ...loadout, accessories: nextAcc }, displaced.id, item);
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
        return withLoadout(character, { ...loadout, weapon: null }, loadout.weapon.id, null);
    }
    if (slot === 'armor') {
        if (!loadout.armor) return character;
        return withLoadout(character, { ...loadout, armor: null }, loadout.armor.id, null);
    }

    // accessory
    const acc = loadout.accessories;
    if (index === undefined || !Number.isInteger(index) || index < 0 || index >= acc.length) {
        return character;
    }
    const removed = acc[index];
    const nextAcc = acc.slice();
    nextAcc.splice(index, 1);
    return withLoadout(character, { ...loadout, accessories: nextAcc }, removed.id, null);
}

/**
 * List of every worn piece in canonical order (weapon, armor, accessories by
 * position). Used by combat helpers that walk equipment without caring about
 * slot identity (combat-start tokens, generation bonuses, proc triggers) and
 * by `getEquipmentModifiers`.
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
