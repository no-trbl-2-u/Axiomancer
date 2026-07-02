/**
 * Set-item engine (Phase 54, per Spec 05e).
 *
 * Pure helpers that turn an equipped-items snapshot into a list of
 * active `SetBonus` objects. Combined with sibling helpers for token
 * + generation-bonus aggregation, this is the engine-side surface
 * that `initializeCombat` + `generateBasicActionResources` consume.
 *
 * Authoring of the named sets themselves lives in
 * `src/Items/set.library.ts`.
 */

import type { Character } from '../Character/types';
import type { Equipment, EquipmentSlot } from './types';
import type { ItemSet, SetBonus } from './set.types';
import type { CombatResources } from '../Cards/types';
import { itemSetLibrary } from './set.library';
import { getEquippedItems } from '../Character/equipment.reducer';
import type { EquipmentBonusOutcome } from './equipment.engine';

/**
 * Returns every active `SetBonus` granted by the wearer's equipped
 * items. For each registered `ItemSet`, counts how many member-template
 * IDs match the equipped items; for every threshold in the set's
 * `bonuses` whose count is met, the corresponding `SetBonus` is included.
 *
 * A 3-piece-wearing player on a 3-piece set gets BOTH the 2-piece and
 * 3-piece bonuses (sparse thresholds — Spec Q5).
 *
 * Match logic (Spec Q1 + Phase 54 D2): an equipped item counts toward
 * a set if its `id` matches one of the set's `memberTemplateIds`. The
 * Unique-set-membership fallback (`UniqueItemTemplate.setMembership`)
 * is reserved for a later phase and not implemented here.
 *
 * Order is deterministic: sets are iterated in library order; thresholds
 * within a set are iterated 2 → 3 → 4.
 */
export function getActiveSetBonuses(
    equipment: Partial<Record<EquipmentSlot, Equipment>>,
): SetBonus[] {
    const items = getEquippedItems(equipment);
    const equippedIds = items.map(i => i.id);
    const active: SetBonus[] = [];

    for (const set of itemSetLibrary) {
        let count = 0;
        for (const memberId of set.memberTemplateIds) {
            if (equippedIds.includes(memberId)) count += 1;
        }
        if (count < 2) continue;
        for (const threshold of [2, 3, 4] as const) {
            if (threshold > count) break;
            const bonus = set.bonuses[threshold];
            if (bonus) active.push(bonus);
        }
    }

    return active;
}

/**
 * Sums every active set bonus's `resourceInteraction.combatStartTokens`
 * into a flat `CombatResources` snapshot. Mirrors
 * `aggregateCombatStartTokens` (per-item) so the two can be added.
 *
 * Returns an all-zero counter when no sets are active.
 */
export function aggregateSetStartTokens(
    equipment: Partial<Record<EquipmentSlot, Equipment>>,
): CombatResources {
    const totals: CombatResources = { heart: 0, body: 0, mind: 0, fallacy: 0, paradox: 0 };
    for (const bonus of getActiveSetBonuses(equipment)) {
        const grant = bonus.resourceInteraction?.combatStartTokens;
        if (!grant) continue;
        for (const key of Object.keys(totals) as Array<keyof CombatResources>) {
            const value = grant[key];
            if (typeof value === 'number') totals[key] += value;
        }
    }
    return totals;
}

/**
 * Applies every active set bonus's `resourceInteraction.generationBonus`
 * entries on top of a `CombatResources` snapshot. Mirrors
 * `applyEquipmentGenerationBonus` (per-item). Bonuses with
 * `trigger: 'any'` apply to every basic action; matching triggers apply
 * only to the actor's chosen outcome. Each counter is clamped to ≥ 0 so
 * a negative bonus can't zero out a pool legitimately earned.
 */
export function applySetGenerationBonus(
    resources: CombatResources,
    equipment: Partial<Record<EquipmentSlot, Equipment>>,
    outcome: EquipmentBonusOutcome,
): CombatResources {
    const next: CombatResources = { ...resources };
    for (const bonus of getActiveSetBonuses(equipment)) {
        const bonuses = bonus.resourceInteraction?.generationBonus;
        if (!bonuses) continue;
        for (const entry of bonuses) {
            if (entry.trigger !== 'any' && entry.trigger !== outcome) continue;
            next[entry.resourceType] = Math.max(0, next[entry.resourceType] + entry.bonus);
        }
    }
    return next;
}

/**
 * Returns the effect-library IDs from every active set bonus's
 * `passiveEffects` field. Caller (`initializeCombat`) materialises each
 * id as an `ActiveEffect` on the player at combat start; the existing
 * combat-end cleanup path purges them along with all other effects
 * (per Spec Q4 — combat-scoped lifecycle).
 */
export function getActiveSetPassiveEffectIds(
    equipment: Partial<Record<EquipmentSlot, Equipment>>,
): string[] {
    const ids: string[] = [];
    for (const bonus of getActiveSetBonuses(equipment)) {
        if (!bonus.passiveEffects) continue;
        ids.push(...bonus.passiveEffects);
    }
    return ids;
}

/**
 * Re-exports the helper consumers may want when composing custom
 * UI — e.g. a Character-tab "active sets" summary. Returns the full
 * `ItemSet` entries (not just bonuses) for every set the wearer has
 * any pieces of (count >= 1), so the UI can show "2/3 pieces of Iron
 * Discipline" even when no threshold is met yet.
 */
export function getEquippedItemSets(
    equipment: Partial<Record<EquipmentSlot, Equipment>>,
): Array<{ set: ItemSet; equipped: number }> {
    const items = getEquippedItems(equipment);
    const equippedIds = items.map(i => i.id);
    const out: Array<{ set: ItemSet; equipped: number }> = [];
    for (const set of itemSetLibrary) {
        let count = 0;
        for (const memberId of set.memberTemplateIds) {
            if (equippedIds.includes(memberId)) count += 1;
        }
        if (count > 0) out.push({ set, equipped: count });
    }
    return out;
}

/**
 * Convenience adapter for callers that want active set bonuses for a
 * Character (the common case in CLI / UI code that doesn't already have
 * the slot map in hand).
 */
export function getActiveSetBonusesForCharacter(character: Character): SetBonus[] {
    return getActiveSetBonuses(character.equipment ?? {});
}
