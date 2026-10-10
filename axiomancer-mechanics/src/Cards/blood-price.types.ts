/**
 * BLOOD PRICE SANDBOX — card-line types (branch sandbox/blood-price-sims only).
 *
 * The Blood Price rehearsal ballot (plan/card-ledger/rehearsal-blood-price.md)
 * prints cards whose lines read the player's VITAE, pay SACRIFICE costs, add
 * and play Curses and put Globals into play. None of that fits the grey
 * office's `free` rider / `specialMechanics` shape, so a sandbox card carries
 * a `bloodPrice` spec instead: each line is a small program written against
 * `BpCtx`. The engine runs the same program three ways (cost probe, bot
 * value estimate, real resolution), so a line's printed text, its legality
 * and its effect cannot drift apart.
 *
 * THE CARD HOLD (D37) stands: these types exist for a sandbox simulation.
 * No library card uses them.
 */

/** What a line can read about the fight when it resolves. */
export interface BpQuery {
    vitae: number;
    maxVitae: number;
    /** maxVitae - vitae. */
    missing: number;
    /** VITAE at half of maximum or less. */
    atHalf: boolean;
    /** VITAE at one-third of maximum or less. */
    atThird: boolean;
    /** Every VITAE the player lost last turn (enemy hits, DoT, SACRIFICE). */
    lostLastTurn: number;
    /** Damage the player took last turn (enemy hits and DoT, not SACRIFICE). */
    takenLastTurn: number;
    /** Every VITAE the player lost this combat (cumulative, heals ignored). */
    lostThisCombat: number;
    /** VITAE SACRIFICED this combat (counted amount). */
    sacrificedThisCombat: number;
    /** SACRIFICES made this combat (counted). */
    sacrificesThisCombat: number;
    cursesInHand: number;
    cursesInDiscard: number;
    /** Other cards in hand (the card being played excluded). */
    handSize: number;
}

/** How a Curse is played by another card. */
export type BpCursePlayMode =
    /** WAIVED: no VITAE paid, every SACRIFICE still counts (E-05a, E-05c, E-08c). */
    | 'waived'
    /** The Curse's SACRIFICE is halved, rounded up; it pays and counts (E-05b). */
    | 'half';

/** Per-turn SACRIFICE modifiers (E-04, E-07). */
export type BpSacModifier =
    | { kind: 'next-free'; count: number }      // WAIVE: next N SACRIFICES this turn cost 0 but count
    | { kind: 'all-free' }                      // WAIVE every SACRIFICE this turn
    | { kind: 'next-half' }                     // next SACRIFICE this turn costs half (rounded up)
    | { kind: 'next-counts'; times: number }    // next SACRIFICE this turn counts N times
    | { kind: 'next-double' }                   // next SACRIFICE this turn is doubled (cost and payoffs)
    | { kind: 'all-count-twice' };              // all SACRIFICES this turn count twice

/** The verbs a Blood Price line is written in. */
export interface BpCtx {
    readonly q: BpQuery;
    /** DEAL n: damage to the foe, body-scaled. Returns the damage dealt. */
    deal(n: number): number;
    /** GUARD n, mind-scaled. `exact` copies an already-resolved number
     *  (healing done) and is not rescaled. Returns the GUARD gained. */
    guard(n: number, opts?: { exact?: boolean }): number;
    /** HEAL n, mind-scaled, capped at max VITAE. `exact` copies an
     *  already-resolved number (damage dealt). `overflowToGuard`: healing
     *  past max becomes GUARD. Returns the VITAE restored. */
    heal(n: number, opts?: { exact?: boolean; overflowToGuard?: boolean }): number;
    /** VULNERABLE +pct% for `turns` turns, heart-scaled. */
    vulnerable(pct: number, turns: number): void;
    /** The foe loses n VITAE: unscaled, not a DEAL (no VULNERABLE). */
    foeLoses(n: number): void;
    /** TETHER n: for n turns, each SACRIFICE instance makes the foe take
     *  DEAL x, x = VITAE that instance paid (unscaled; VULNERABLE applies). */
    tether(turns: number): void;
    /** LEECH n (heart-scaled, repeating; adds to the current LEECH). */
    leech(n: number): void;
    conviction(n: number): void;
    /** SACRIFICE n: lose n VITAE, unscaled. A cost. */
    sacrifice(n: number): void;
    /** SACRIFICE any amount up to `max` (null = no printed max). Returns the
     *  amount chosen. `countPer`: counts as one SACRIFICE per that many paid. */
    sacrificeX(max: number | null, opts?: { countPer?: number; usefulMax?: number }): number;
    addCurse(count: number): void;
    /** Play Curse(s) from hand on a given line. Returns how many were played. */
    playCurseFromHand(line: 'free' | 'paid', mode: BpCursePlayMode, all?: boolean): number;
    /** Return a Curse from discard and play it. Returns how many were played. */
    playCurseFromDiscard(line: 'free' | 'paid', mode: BpCursePlayMode): number;
    /** Return Curse(s) from discard to hand. Returns how many moved. */
    returnCurseFromDiscard(all: boolean): number;
    /** EXILE Curse(s) from hand. Returns how many. */
    exileCurseFromHand(all: boolean): number;
    /** Discard a Curse from hand at no cost. Returns how many (0/1). */
    discardCurseFromHand(): number;
    sacModifier(mod: BpSacModifier): void;
    /** This turn, VITAE cannot drop below 1 from damage. */
    deathWard(): void;
    /** Heal at the start of the next turn (HEAL n, scaled now). */
    healNextTurn(n: number): void;
    /** For `turns` turns (this one included), heal `perHit` each time the
     *  player's card or Global makes the foe lose VITAE. */
    drain(perHit: number, turns: number): void;
    /** Rest of combat: healing past max VITAE becomes GUARD. */
    overhealToGuard(): void;
    /** The given GUARD also lasts into the next turn. */
    carryGuard(amount: number): void;
}

/** One printed line (FREE or PAID) of a non-Global card. */
export interface BpLine {
    /** The text as printed on the ballot. */
    text: string;
    /** Extra legality ("Only at half VITAE or less", "needs a Curse in hand"). */
    requires?: (q: BpQuery) => boolean;
    run: (c: BpCtx) => void;
    /** PAID only: the card leaves combat instead of going to discard. */
    exile?: boolean;
}

/** The closed set of Global triggers (plan/revamp/cards.md, Global text template). */
export type BpGlobalTrigger = 'turn' | 'sac' | 'curse';

/** A Global card: one trigger, a FREE body and an optional PAID delta. */
export interface BpGlobalSpec {
    trigger: BpGlobalTrigger;
    /** Printed trigger body (FREE ⏳3). */
    text: string;
    /** Printed PAID delta (PAID ∞), when the PAID line changes anything. */
    paidDelta?: string;
    /** `n` is the SACRIFICE amount for a 🩸 trigger, 0 otherwise. */
    free: (c: BpCtx, n: number) => void;
    paid: (c: BpCtx, n: number) => void;
}

export interface BloodPriceSpec {
    /** Ballot proposal id, e.g. 'P-01a'. 'CURSE' for the grey Curse. */
    proposal: string;
    /** Ballot slot, e.g. 'P-01'. */
    slot: string;
    free?: BpLine;
    paid?: BpLine;
    global?: BpGlobalSpec;
    /** The grey Curse: a dead card that holds a hand slot until played. */
    curse?: boolean;
    /** Not subject to deck tuning (the grey Curse is not a proposal). */
    untuned?: boolean;
    /** Why this colour (sim report). */
    colorReason?: string;
}
