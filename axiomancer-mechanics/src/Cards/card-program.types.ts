/**
 * CARD PROGRAMS — the line shape for cards that read VITAE, pay SACRIFICE,
 * handle Curses or stay in play as Globals.
 *
 * A grey card's lines are plain data (`free` rider, `specialMechanics`). A
 * card whose line reads the fight ("DEAL 3, or 6 at half VITAE or less"),
 * pays a cost or moves Curses carries a `program` instead: each line is a
 * small function written against {@link ProgramCtx}. The engine
 * (`Combat/combat.card-program.ts`) runs the same function three ways (a cost
 * probe, the sim witness's value estimate, the real resolution), so a line's
 * legality and its effect cannot drift apart.
 *
 * Printed text carries number tokens so a face prints the number the engine
 * applies at the player's stats (`programText`):
 *
 *   {deal:n}   body-scaled one-shot (DEAL)
 *   {guard:n}  mind-scaled one-shot (GUARD)
 *   {heal:n}   mind-scaled one-shot (HEAL)
 *   {vuln:n}   VULNERABLE percent, heart-scaled like the status
 *   {leech:n}  heart-scaled repeating (LEECH)
 *
 * Every other number (SACRIFICE, Conviction, caps, "the foe loses n") is
 * unscaled and printed as written.
 */

/** What a line can read about the fight when it resolves. */
export interface ProgramQuery {
    vitae: number;
    maxVitae: number;
    /** maxVitae - vitae. */
    missing: number;
    /** VITAE at half of maximum or less. */
    atHalf: boolean;
    /** Damage the player took last turn (enemy hits and DoT, not SACRIFICE). */
    takenLastTurn: number;
    /** Every VITAE the player lost this combat (cumulative, heals ignored). */
    lostThisCombat: number;
    cursesInHand: number;
    cursesInDiscard: number;
}

/** Per-turn SACRIFICE modifiers. */
export type SacrificeModifier =
    /** WAIVE: the next `count` SACRIFICES this turn cost no VITAE but still count. */
    | { kind: 'next-free'; count: number }
    /** The next SACRIFICE this turn is doubled: its cost and what it counts as. */
    | { kind: 'next-double' };

/** The verbs a program line is written in. */
export interface ProgramCtx {
    readonly q: ProgramQuery;
    /** DEAL n: damage to the foe, body-scaled, VULNERABLE applies. Returns the damage dealt. */
    deal(n: number): number;
    /** GUARD n, mind-scaled. `exact` copies an already-resolved number. Returns the GUARD gained. */
    guard(n: number, opts?: { exact?: boolean }): number;
    /** HEAL n, mind-scaled, capped at max VITAE. `exact` copies an already
     *  resolved number (damage dealt) unscaled. `overflowToGuard`: healing
     *  past max VITAE becomes GUARD. Returns the VITAE restored. */
    heal(n: number, opts?: { exact?: boolean; overflowToGuard?: boolean }): number;
    /** VULNERABLE +pct% for `turns` turns, heart-scaled. */
    vulnerable(pct: number, turns: number): void;
    /** The foe loses n VITAE: unscaled, not a DEAL (VULNERABLE does not apply). */
    foeLoses(n: number): void;
    /** TETHER n: for n turns (this one included), each SACRIFICE instance makes
     *  the foe take DEAL x, x = the VITAE that instance paid (unscaled;
     *  VULNERABLE applies). */
    tether(turns: number): void;
    /** LEECH n, heart-scaled when applied; adds to the foe's current LEECH. */
    leech(n: number): void;
    /** Gain n Conviction (capped). */
    conviction(n: number): void;
    /** SACRIFICE n: lose n VITAE, unscaled. A cost: never below 1 VITAE. */
    sacrifice(n: number): void;
    /** SACRIFICE any amount from 1 up to `max`, chosen by the player. Returns the amount. */
    sacrificeX(max: number): number;
    /** Add `count` copies of the Curse `curseId` to your hand. */
    addCurse(curseId: string, count: number): void;
    /** Play a Curse from your hand on its PAID line with its SACRIFICE WAIVED.
     *  Returns how many were played (0 or 1). */
    playCurseFromHandWaived(): number;
    /** Return a Curse from your discard to your hand. Returns how many moved (0 or 1). */
    returnCurseFromDiscard(): number;
    /** EXILE a Curse from your hand. Returns how many (0 or 1). */
    exileCurseFromHand(): number;
    /** Set a SACRIFICE modifier for the rest of this turn. */
    sacModifier(mod: SacrificeModifier): void;
    /** This turn, damage cannot take your VITAE below 1. */
    deathWard(): void;
    /** HEAL n at the start of your next turn (scaled now). */
    healNextTurn(n: number): void;
    /** For `turns` turns (this one included), HEAL `perHit` each time your
     *  card or Global makes the foe lose VITAE. */
    drain(perHit: number, turns: number): void;
}

/** One printed line (FREE or PAID) of a card that is not a Global. */
export interface ProgramLine {
    /** The printed text, with number tokens (see the module comment). */
    text: string;
    /** Extra legality ("Only at half VITAE or less", "needs a Curse in hand").
     *  `why` is the reason the game gives when it fails. */
    requires?: { test: (q: ProgramQuery) => boolean; why: string };
    run: (c: ProgramCtx) => void;
    /** PAID only: the card leaves combat (EXILE) instead of going to discard. */
    exile?: boolean;
}

/**
 * The closed set of Global triggers: ⟳ the start of your turn, 🩸 when you
 * SACRIFICE n, 📜 when you play a Curse.
 */
export type GlobalTrigger = 'turn' | 'sac' | 'curse';

/** A Global card: one trigger, a FREE body and an optional PAID change. */
export interface ProgramGlobal {
    trigger: GlobalTrigger;
    /** The printed trigger body (FREE: in play 3 turns), with number tokens. */
    text: string;
    /** The printed PAID change (PAID: in play for the rest of combat), when the PAID line changes anything. */
    paidDelta?: string;
    /** `n` is the SACRIFICE amount for a 🩸 trigger, 0 otherwise. */
    free: (c: ProgramCtx, n: number) => void;
    paid: (c: ProgramCtx, n: number) => void;
}

/** A card's program: two lines, or a Global body. */
export interface CardProgram {
    free?: ProgramLine;
    paid?: ProgramLine;
    global?: ProgramGlobal;
}
