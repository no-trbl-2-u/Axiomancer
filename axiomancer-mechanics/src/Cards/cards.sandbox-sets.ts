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

// ─── GLYPHS_51_PILOT (Phase 51) ───────────────────────────────────────────────
// Phase 33d's GLYPHS pilot (charging Seals: state.glyphs, crackGlyph) is still
// fully live in the engine — only its card content was wiped by the Profane
// Canon reset (84ef85bd, 2026-08-08), leaving `state.glyphs` unreachable in
// real play (mobile's Phase 50 Seal chip row has never rendered outside a
// hand-built test state). This re-authors a LEAN 2-card set — one Seal per
// payload, PAID inscribe only, no FREE-line "pump" card this time (the
// passive +1/round charge tick in `processBetweenPhases` alone exercises the
// ripening dilemma) — so Phase 51's sim `crackAt` policy heuristic has
// something real to crack. Numbers reused verbatim from 33d (charge cap 3,
// poison base intensity 1 / duration 2, barrier base amount 2) per
// `cards.pricing.ts`'s `glyphExpectedValue` — the anchor for both these
// cards' pricing and the `crackAt` default in `combat.sim-policies.ts`.
// Sandbox-only per Gate-4 (33d's own binding decision): register -> A/B ->
// promote still gates any library move; this phase's evidence is for the
// crackAt HEURISTIC, not a promotion verdict for these 2 cards.

const thePlagueSeal: Card = {
    id: 'the-plague-seal',
    theme: 'rot',
    name: 'The Plague Seal',
    philosophicalAspect: 'body',
    description:
        'Wax pressed into the wound while it still weeps, and the parish ' +
        'keeps the impression on file. It does not cure. It does not need ' +
        'to. Every stamp is a debt with a date on it, and the date is yours ' +
        'to choose.',
    tier: 2, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Inscribe a Poison Seal (charges +1 each round, cap 3). Crack it ' +
        'later to inflict POISON scaled by its charges (base 1, 2 turns).',
    // pts: glyph EV — poison i1 d2, cap 3 (expected charges cap/2 = 1.5) =
    // 5.34, × 0.6 GLYPH_CRACK_DISCOUNT (fires later, not guaranteed at print
    // time) = 3.20 + FREE MARK i1 d2 (1.5) ≈ 4.70 → Lemma.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } },
    glyph: { payload: { kind: 'poison', baseIntensity: 1, duration: 2 }, cap: 3 },
    addedIn: '2026-08-23',
    tags: ['rot', 'glyph', 'seal', 'dot'],
};

const theHoarwatchSigil: Card = {
    id: 'the-hoarwatch-sigil',
    theme: 'vigil',
    name: 'The Hoarwatch Sigil',
    philosophicalAspect: 'mind',
    description:
        'Cut into the gatepost the winter the garrison starved, and left ' +
        'there out of spite more than hope. The frost has been filling in ' +
        'the grooves ever since, patient as a debt collector. Break it when ' +
        'the wall needs telling what to remember.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    paidSummary:
        'Inscribe a Barrier Seal (charges +1 each round, cap 3). Crack it ' +
        'later for GUARD scaled by its charges (base 2, persists).',
    // pts: glyph EV — barrier base 2, cap 3 (expected charges cap/2 = 1.5) =
    // 1.17, × 0.6 GLYPH_CRACK_DISCOUNT = 0.70 + FREE THORNS i1 d2 (1.5) ≈
    // 2.20 → Doxa.
    free: { applyEffect: { effectId: 'buff_thorns', intensity: 1, duration: 2, to: 'self' } },
    glyph: { payload: { kind: 'barrier', baseAmount: 2 }, cap: 3 },
    addedIn: '2026-08-23',
    tags: ['vigil', 'glyph', 'seal', 'defense'],
};

/**
 * The registry of named sets. Empty at the canon reset — `/deck-tuning`
 * authors the next generation of measurement-seat candidates here.
 * `GLYPHS_51_PILOT` (Phase 51) is the first entry post-reset.
 */
export const SANDBOX_CARD_SETS: Record<string, SandboxCardSet> = {
    GLYPHS_51_PILOT: {
        id: 'GLYPHS_51_PILOT',
        name: 'GLYPHS 51 pilot — charging Seals, re-authored',
        description:
            'Re-authors the 33d-era GLYPHS pilot the Profane Canon reset wiped: ' +
            '2 inscribe-only Seal cards (rot poison, vigil barrier) so the ' +
            'sim\'s new crackAt policy heuristic has something to crack. No ' +
            'FREE-line pump card — the passive +1/round charge tick alone ' +
            'exercises the ripening dilemma. Sandbox-only (Gate-4).',
        cards: [thePlagueSeal, theHoarwatchSigil],
    },
};

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
