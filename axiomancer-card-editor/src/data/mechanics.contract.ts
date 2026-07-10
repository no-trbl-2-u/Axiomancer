/**
 * COMPILE-TIME CONTRACT with the mechanics package.
 *
 * The editor hand-maintains SPECIAL_MECHANIC_KINDS (data/mechanics.ts) as
 * its dropdown source, while the canonical set of kinds lives in mechanics'
 * CardSpecialMechanic discriminated union. Those two can drift silently:
 * a kind added to mechanics but missing here never shows up in the editor
 * UI, with no error anywhere (the type-check-only failure of edba726 was
 * the loud variant of this class; this file makes the quiet variant loud
 * too). These assertions turn any drift into a type-check failure, so
 * `npm run verify -w axiomancer-card-editor` (and the cross-package CI
 * job) catches it the moment the union changes.
 *
 * No runtime cost — everything here is erased.
 */

import type { CardSpecialMechanic } from '@mechanics/Cards/types';
import type { SpecialMechanicKind } from './mechanics';

type CanonicalKind = CardSpecialMechanic['kind'];

/** Resolves to never only when T is never; otherwise surfaces the leak. */
type AssertNever<T extends never> = T;

/**
 * Every kind mechanics defines must appear in the editor's list.
 * A type error here names the kinds the editor is missing.
 */
export type _EditorCoversEveryMechanicKind = AssertNever<
    Exclude<CanonicalKind, SpecialMechanicKind>
>;

/**
 * The editor must not list kinds mechanics no longer defines.
 * A type error here names the stale kinds to delete from
 * SPECIAL_MECHANIC_KINDS.
 */
export type _EditorListsOnlyRealMechanicKinds = AssertNever<
    Exclude<SpecialMechanicKind, CanonicalKind>
>;
