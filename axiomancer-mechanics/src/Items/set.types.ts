/**
 * Set-item types (Phase 54, per Spec 05e).
 *
 * A `SetBonus` is what a wearer earns by equipping N pieces of an
 * `ItemSet`. Bonuses reuse the existing Spec 05b shapes
 * (`ResourceInteraction`, `StatModifier`, effect IDs) so the runtime
 * application paths in `initializeCombat` + `generateBasicActionResources`
 * stay unchanged in semantics — they just get fed an additional source
 * of bonuses on top of per-item ones.
 *
 * Per Spec 05e Q3, bonuses are computed on-demand at combat start
 * (`getActiveSetBonuses` in `src/Items/set.engine.ts`), not cached on
 * Character state — matches how individual item `resourceInteraction`
 * is already read.
 */

import type { ResourceInteraction } from './types';
import type { StatModifier } from '../Effects/types';

/**
 * One tier of an `ItemSet`'s bonus block. The fields mirror the
 * Spec 05b `Equipment` runtime extensions so the same wiring paths can
 * fold a set bonus in alongside a per-item bonus.
 *
 * - `resourceInteraction` — applied at `initializeCombat` (start tokens)
 *   and on each basic action (`generationBonus`).
 * - `passiveEffects` — effect-library IDs applied as `ActiveEffect`s at
 *   combat start (per Spec 05e Q4, combat-scoped — they live through the
 *   normal combat-end cleanup, not across equip/unequip events).
 * - `statModifiers` — folded into `derivedStats` for the duration of
 *   combat via the same path equipment `statModifiers` use.
 */
export interface SetBonus {
    resourceInteraction?: Partial<ResourceInteraction>;
    passiveEffects?: string[];
    statModifiers?: StatModifier[];
}

/**
 * A named set of equipment template IDs and the per-threshold bonuses
 * earned for wearing 2 / 3 / 4 of them simultaneously.
 *
 * `bonuses` is sparse (Spec 05e Q5) — a 2-piece set only defines `{ 2 }`,
 * a 3-piece set defines `{ 2, 3 }`, etc. `getActiveSetBonuses` returns
 * every defined threshold whose count is met (so a 3-piece-wearing
 * player gets both the 2-piece and 3-piece bonuses simultaneously).
 *
 * `memberTemplateIds` may include `EquipmentTemplate.id` (the primary
 * matcher) or, in a future extension, `UniqueItemTemplate.setMembership`
 * tags. Initial implementation only matches by `equipment.id` (D2).
 */
export interface ItemSet {
    id: string;
    name: string;
    description: string;
    memberTemplateIds: string[];
    bonuses: Partial<Record<2 | 3 | 4, SetBonus>>;
}
