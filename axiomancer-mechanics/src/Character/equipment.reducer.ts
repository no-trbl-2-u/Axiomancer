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

import { Character, BaseStats, DerivedStats } from './types';
import { Equipment, EquipmentSlot } from '../Items/types';
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
 * Folds every equipped item's `statModifiers` into a single aggregated bundle.
 * Same intensity / multiplier conventions as the active-effects path: flat
 * mods sum, multiplier mods accumulate additively over 1.0 so the consumer
 * applies them as `base × (1 + Σ (m - 1))`.
 */
export function getEquipmentModifiers(
    equipment: Partial<Record<EquipmentSlot, Equipment>>,
): AggregatedEquipmentModifiers {
    const agg = emptyAgg();
    for (const slot of Object.keys(equipment) as EquipmentSlot[]) {
        const piece = equipment[slot];
        if (!piece?.statModifiers) continue;
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
        'physicalAttack', 'physicalSkill', 'physicalDefense',
        'mentalAttack',   'mentalSkill',   'mentalDefense',
        'emotionalAttack','emotionalSkill','emotionalDefense',
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
 * Equips `item` onto the wearer, replacing whatever currently occupies its
 * slot. Recomputes `derivedStats` to fold in the new stat modifiers and
 * applies the item's passive effects.
 *
 * Pure — returns a new `Character`; input is untouched.
 */
export function equipItem(character: Character, item: Equipment): Character {
    // Drop whatever's currently in the slot so its modifiers / passives don't
    // double up. Note: we don't return the unequipped item here — callers
    // that need to push it back into `inventory` should call `unequipItem`
    // first and chain through `addItem`.
    const slot = item.slot;
    const previous = character.equipment[slot];

    let nextEffects = character.effects;
    if (previous) {
        nextEffects = removePassiveEffects(nextEffects, previous.id);
    }
    nextEffects = applyPassiveEffects(nextEffects, item);

    const nextEquipment = { ...character.equipment, [slot]: item };
    const mods = getEquipmentModifiers(nextEquipment);
    const nextDerived = recomputeDerivedStats(character.baseStats, mods);

    return {
        ...character,
        equipment:    nextEquipment,
        derivedStats: nextDerived,
        effects:      nextEffects,
    };
}

/**
 * Unequips whatever currently occupies `slot`. No-op (returns the same
 * character reference) when the slot is empty. Pure.
 */
export function unequipItem(character: Character, slot: EquipmentSlot): Character {
    const previous = character.equipment[slot];
    if (!previous) return character;

    const nextEquipment = { ...character.equipment };
    delete nextEquipment[slot];

    const mods = getEquipmentModifiers(nextEquipment);
    const nextDerived = recomputeDerivedStats(character.baseStats, mods);
    const nextEffects = removePassiveEffects(character.effects, previous.id);

    return {
        ...character,
        equipment:    nextEquipment,
        derivedStats: nextDerived,
        effects:      nextEffects,
    };
}

/**
 * List of every currently-equipped piece in slot order. Used by combat
 * helpers that need to walk equipment without caring about slot identity
 * (combat-start tokens, generation bonuses, proc triggers).
 */
export function getEquippedItems(
    equipment: Partial<Record<EquipmentSlot, Equipment>>,
): Equipment[] {
    const SLOT_ORDER: EquipmentSlot[] = [
        'weapon', 'armor', 'accessory', 'head', 'body', 'hands', 'feet',
    ];
    const out: Equipment[] = [];
    for (const slot of SLOT_ORDER) {
        const piece = equipment[slot];
        if (piece) out.push(piece);
    }
    return out;
}

// Internal helper exported only for tests / hermetic e2e introspection.
export { isStanceKey as _isStanceKey };
// Re-export so `equipment.reducer` is a single import surface for callers that
// also want a single `StatModifier`-shaped contract.
export type { StatModifier };
