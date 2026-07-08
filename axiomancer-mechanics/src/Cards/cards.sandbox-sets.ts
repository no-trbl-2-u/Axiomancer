/**
 * Named sandbox card SETS — curated experiment bundles the playtest CLI and
 * the `/deck-tuning` skill load with one flag (`--sandbox=<setId>`).
 *
 * A set bundles new experimental cards and/or numeric overrides of library
 * cards. Applying a set registers everything into the sandbox registry
 * (`cards.sandbox.ts`), which `getCardById` consults first — so the set is
 * live across deck building, projection, and execution for that process.
 *
 * SPEC 32 v3 RESET (2026-07-08): the pre-v3 experiment sets referenced retired
 * cards, retired effect ids, and the deleted `basePower` field — all cleared
 * with the library overhaul. `/deck-tuning` authors fresh v3 sets here (cards
 * must use the 30-keyword effect set and the v3 `Card` schema: `rank`,
 * `cardType`, `free` — no raw HP damage; the schema enforces the doctrine).
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

/** The registry of named experiment sets (empty post-v3-reset; `/deck-tuning`
 *  repopulates it as A/B candidates are authored). */
export const SANDBOX_CARD_SETS: Record<string, SandboxCardSet> = {};

/** All registered sandbox sets, in declaration order. */
export function listSandboxSets(): SandboxCardSet[] {
    return Object.values(SANDBOX_CARD_SETS);
}

/**
 * Applies a set: registers its new cards and overrides into the sandbox
 * registry. Returns the set, or `undefined` for an unknown id. Applying the
 * same set twice throws (its card ids are then already registered) — call
 * `clearSandboxCards()` between experiments.
 */
export function applySandboxSet(setId: string): SandboxCardSet | undefined {
    const set = SANDBOX_CARD_SETS[setId];
    if (!set) return undefined;
    registerSandboxCards(set.cards);
    for (const override of set.overrides ?? []) {
        registerSandboxOverride(override.cardId, override.patch);
    }
    return set;
}
