/**
 * Named sandbox card SETS — curated experiment bundles the playtest CLI and
 * the `/deck-tuning` card load with one flag (`--sandbox=<setId>`).
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

// ── WS7.2 (spec 32 §12 item 5) — the first chosen X-cost card ────────────────

/**
 * The Open Vein — akrasia Theorem, the `recoil_x` witness: RECOIL X of the
 * player's choosing (min 3) → POISON at ceil(X/3) intensity. Sandbox-first;
 * promotion into the library rides the WS7.2 gate (the chosen-X distribution
 * must be non-degenerate across sim policies).
 */
const theOpenVein: Card = {
    id: 'the-open-vein',
    theme: 'akrasia',
    name: 'The Open Vein',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'How much will you bleed to make the point? The vein does not ' +
        'bargain — it only opens as wide as you ask, and the argument turns ' +
        'exactly that much more venomous.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: expected X ≈ 6 (VERB_POINTS.expectedChosenX) → POISON ceil(6/3)=i2
    // d4 lifetime 20 HP ÷ 3 ≈ 6.67, − recoil credit 6 × healPerHp(1/3) ×
    // SELF_COST_CREDIT 0.75 = −1.5, + FREE tickOne 0.6 ≈ 5.77 → uncommon band
    // 4.5-13 (Theorem).
    free: { tickOne: true },
    specialMechanics: [{ kind: 'recoil_x', min: 3, poisonPerX: 1 / 3 }],
    addedIn: '2026-07-11',
    tags: ['akrasia', 'dot', 'chooseX'],
};

/** The registry of named experiment sets (`/deck-tuning`
 *  repopulates it as A/B candidates are authored). */
export const SANDBOX_CARD_SETS: Record<string, SandboxCardSet> = {
    'chooseX-vein': {
        id: 'chooseX-vein',
        name: 'Choose-X: The Open Vein',
        description:
            'WS7.2 first chosen X-cost — RECOIL X (min 3) → POISON per 3. '
            + 'Gate: the chosen-X distribution must vary across sim policies.',
        cards: [theOpenVein],
    },
};

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
