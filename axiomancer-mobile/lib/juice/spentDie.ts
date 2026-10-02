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
 * A die that's been played reads as spent — grey out / desaturate, keeping its
 * face, for the remainder of the round. A STATIC state change, not an animated
 * primitive; reduced-motion is a no-op here.
 *
 * The gate is SPENT alone: a tray die powers a card directly, so it is marked
 * `spent` but never `drafted` (there is no draft step).
 */
export function spentDieTreatment({ spent, dead }: SpentDieInput): SpentDieTreatment {
    if (dead) return { greyed: true, opacity: 1 };
    if (spent) return { greyed: true, opacity: 0.55 };
    return { greyed: false, opacity: 1 };
}
