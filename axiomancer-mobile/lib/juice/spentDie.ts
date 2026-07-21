export interface SpentDieInput {
    /** The die has been used to power a card this round (engine `state: 'spent'`). */
    spent: boolean;
    /** A dead face (miss/cracked/X) already reads greyed for its own reasons. */
    dead: boolean;
}

export interface SpentDieTreatment {
    greyed: boolean;
    opacity: number;
}

/**
 * Owner jot (`/jot` 2026-07-20, routed to Phase 38 via `/oversight`): a die
 * that's been played should read as spent — grey out / desaturate, keeping its
 * face, for the remainder of the round. A STATIC state change, not an animated
 * primitive; reduced-motion is a no-op here (phase 38 brief §Scope).
 *
 * The gate is SPENT alone. Under the Upgradeable-Dice model (THE FLIP,
 * 2026-07-18 — on for every build) a tray die powers a card directly: it is
 * marked `spent` but never `drafted` (there is no draft step). The original
 * `drafted && spent` gate was legacy-shaped — where you drafted a die THEN
 * spent it — so it never fired for the live model, and used dice stayed at full
 * colour. Legacy spent dice are drafted too, so `spent` alone covers both.
 */
export function spentDieTreatment({ spent, dead }: SpentDieInput): SpentDieTreatment {
    if (dead) return { greyed: true, opacity: 1 };
    if (spent) return { greyed: true, opacity: 0.55 };
    return { greyed: false, opacity: 1 };
}
