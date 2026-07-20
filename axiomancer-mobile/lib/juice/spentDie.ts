export interface SpentDieInput {
    drafted: boolean;
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
 * that's been played should read as spent — grey out / desaturate. A STATIC
 * state change, not an animated primitive; reduced-motion is a no-op here
 * (phase 38 brief §Scope).
 */
export function spentDieTreatment({ drafted, spent, dead }: SpentDieInput): SpentDieTreatment {
    if (dead) return { greyed: true, opacity: 1 };
    if (drafted && spent) return { greyed: true, opacity: 0.55 };
    return { greyed: false, opacity: 1 };
}
