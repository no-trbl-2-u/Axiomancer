/**
 * Named sandbox card SETS — curated experiment bundles the playtest CLI and
 * `/deck-tuning` load with one flag (`--sandbox=<setId>`).
 *
 * A set bundles new experimental cards and/or numeric overrides of library
 * cards. Applying a set registers everything into the sandbox registry
 * (`cards.sandbox.ts`), which `getCardById` consults first — so the set is
 * live across deck building, projection, and execution for that process.
 *
 * PROFANE-CANON RESET (2026-08-08): the spec-32 experiment sets and the ten
 * per-theme swap pools referenced the retired 86-card themed library and its
 * ten theme slugs — all cleared with the library rework (the same clean-reset
 * rule the spec-32 v3 overhaul applied to ITS predecessors; the retired pools
 * live in git history). `/deck-tuning` authors fresh canon-era sets here
 * (cards must use the profane-canon keyword set and the v3 `Card` schema —
 * direct damage is legal again via `deal` since THE BIG NUMBERS REWRITE).
 *
 * Promotion path: a sandbox card that proves out across stages/policies moves
 * its literal into `cards.library.ts` in the same PR as the evidence table.
 */

import {
    registerSandboxCards,
    registerSandboxOverride,
    type SandboxCardPatch,
} from './cards.sandbox';
import type { Card } from './types';

export interface SandboxCardSet {
    id: string;
    name: string;
    description: string;
    cards: readonly Card[];
    overrides?: ReadonlyArray<{ cardId: string; patch: SandboxCardPatch }>;
}

/**
 * The registry of named sets. Empty since the GLYPHS pilot was cut (trim T5,
 * 2026-09-25); new measurement-seat candidates are authored here.
 */
export const SANDBOX_CARD_SETS: Record<string, SandboxCardSet> = {};

/** All registered sets (stable insertion order). */
export function listSandboxSets(): SandboxCardSet[] {
    return Object.values(SANDBOX_CARD_SETS);
}

/**
 * Applies a set: registers its cards + overrides into the sandbox registry.
 * Returns the set, or undefined for an unknown id (callers report the known
 * ids themselves).
 */
export function applySandboxSet(setId: string): SandboxCardSet | undefined {
    const set = SANDBOX_CARD_SETS[setId];
    if (!set) return undefined;
    registerSandboxCards([...set.cards]);
    for (const o of set.overrides ?? []) {
        registerSandboxOverride(o.cardId, o.patch);
    }
    return set;
}
