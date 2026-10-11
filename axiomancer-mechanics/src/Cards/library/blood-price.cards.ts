/**
 * THE BLOOD PRICE TRIAL SET — "I pay in my own blood for power."
 *
 * The 30 cards T kept from the Blood Price rehearsal ballot on 2026-10-11
 * (`plan/card-ledger/rehearsal-blood-price.md`), with the ballot's printed
 * numbers, plus the grey Curse the E-01 cards add. Three sub-lanes of ten:
 * Payoff (P), Engine (E) and Misc (M). Ids are `bp-<slot><option>`.
 *
 * A removable trial set (plan/revamp/cards.md → "The trial set"): this file
 * is the whole set, and `cards.library.ts` registers it in one line. The
 * engine pieces the cards use (Global, Curse, SACRIFICE, WAIVE, EXILE, HEAL,
 * TETHER, LEECH) are general systems in `Combat/combat.card-program.ts`;
 * nothing outside this file and its own test names a card here.
 *
 * Colour is what the PAID line's main effect lands on: damage to the foe is
 * body (red), anything on you is mind (blue), a status on the foe is heart
 * (purple). Printed text uses number tokens (`card-program.types.ts`) so a
 * face prints the number the player's stats make it.
 *
 * This file is data-only.
 */

import type { Card, CardAspect, CardType } from '../types';
import type { CardProgram, ProgramCtx, ProgramLine, ProgramQuery } from '../card-program.types';
import type { CardLane, TrialSet } from '../card.lanes';

const ADDED = '2026-10-11';

/** The grey Curse's id: the card the E-01 lines add to your hand. */
const CURSE_ID = 'bp-curse';

const RED: CardAspect = 'body';
const BLUE: CardAspect = 'mind';
const PURPLE: CardAspect = 'heart';

const L = (text: string, run: (c: ProgramCtx) => void, extra?: Partial<ProgramLine>): ProgramLine => ({ text, run, ...extra });

const AT_HALF = { test: (q: ProgramQuery): boolean => q.atHalf, why: 'only at half VITAE or less' };
const CURSE_IN_HAND = { test: (q: ProgramQuery): boolean => q.cursesInHand > 0, why: 'needs a Curse in your hand' };

interface Entry {
    slot: string;
    type: CardType;
    color: CardAspect;
    program: CardProgram;
}

const SUB_LANE: Record<string, string> = { P: 'Payoff', E: 'Engine', M: 'Misc' };

const ENTRIES: Entry[] = [
    // ── PAYOFF: benefits for sacrificing ─────────────────────────────────────
    { slot: 'p-01a', type: 'attack', color: RED, program: {
        free: L('SACRIFICE 2, DEAL {deal:5}.', c => { c.sacrifice(2); c.deal(5); }),
        paid: L('SACRIFICE 4, DEAL {deal:12}.', c => { c.sacrifice(4); c.deal(12); }) } },
    { slot: 'p-02a', type: 'skill', color: BLUE, program: {
        free: L('SACRIFICE 2, GUARD {guard:5}.', c => { c.sacrifice(2); c.guard(5); }),
        paid: L('SACRIFICE 4, GUARD {guard:12}.', c => { c.sacrifice(4); c.guard(12); }) } },
    { slot: 'p-03a', type: 'attack', color: RED, program: {
        free: L('DEAL {deal:3}, or {deal:6} at half VITAE or less.', c => { c.deal(c.q.atHalf ? 6 : 3); }),
        paid: L('DEAL {deal:6}, or {deal:14} at half VITAE or less.', c => { c.deal(c.q.atHalf ? 14 : 6); }) } },
    { slot: 'p-04c', type: 'attack', color: RED, program: {
        free: L('Only at half VITAE or less: DEAL {deal:8}.', c => { c.deal(8); }, { requires: AT_HALF }),
        paid: L('Only at half VITAE or less: DEAL {deal:18}. EXILE.', c => { c.deal(18); }, { requires: AT_HALF, exile: true }) } },
    { slot: 'p-05b', type: 'spell', color: PURPLE, program: {
        free: L('SACRIFICE 3, VULNERABLE +{vuln:15}% for 1 turn.', c => { c.sacrifice(3); c.vulnerable(15, 1); }),
        paid: L('SACRIFICE 6, VULNERABLE +{vuln:40}% for 2 turns.', c => { c.sacrifice(6); c.vulnerable(40, 2); }) } },
    { slot: 'p-06d', type: 'skill', color: PURPLE, program: {
        free: L('GUARD {guard:3}.', c => { c.guard(3); }),
        paid: L('LEECH 1 per 10 VITAE missing (max 8).', c => { c.leech(Math.min(8, Math.floor(c.q.missing / 10))); }) } },
    { slot: 'p-07b', type: 'attack', color: RED, program: {
        free: L('DEAL half the VITAE you lost this combat (max 10).', c => { c.deal(Math.min(10, Math.floor(c.q.lostThisCombat / 2))); }),
        paid: L('DEAL all the VITAE you lost this combat (max 30). EXILE.', c => { c.deal(Math.min(30, c.q.lostThisCombat)); }, { exile: true }) } },
    { slot: 'p-08d', type: 'skill', color: PURPLE, program: {
        free: L('SACRIFICE 2, gain 2 Conviction.', c => { c.sacrifice(2); c.conviction(2); }),
        paid: L('TETHER 3. SACRIFICE 4.', c => { c.tether(3); c.sacrifice(4); }) } },
    { slot: 'p-09b', type: 'spell', color: RED, program: {
        free: L('SACRIFICE 4; the foe loses 4 VITAE.', c => { c.sacrifice(4); c.foeLoses(4); }),
        paid: L('SACRIFICE 8; the foe loses 8 VITAE, VULNERABLE +{vuln:25}% for 1 turn.', c => { c.sacrifice(8); c.foeLoses(8); c.vulnerable(25, 1); }) } },
    { slot: 'p-10c', type: 'global', color: RED, program: {
        global: { trigger: 'sac', text: 'GUARD n.', paidDelta: 'DEAL n instead.',
            free: (c, n) => { c.guard(n); }, paid: (c, n) => { c.deal(n); } } } },

    // ── ENGINE: helps you trigger SACRIFICE ──────────────────────────────────
    { slot: 'e-01a', type: 'spell', color: BLUE, program: {
        free: L('Add a grey Curse to your hand. Gain 2 Conviction.', c => { c.addCurse(CURSE_ID, 1); c.conviction(2); }),
        paid: L('Add 2 grey Curses to your hand. Gain 3 Conviction.', c => { c.addCurse(CURSE_ID, 2); c.conviction(3); }) } },
    { slot: 'e-02d', type: 'skill', color: PURPLE, program: {
        free: L('SACRIFICE 1, twice.', c => { c.sacrifice(1); c.sacrifice(1); }),
        paid: L('TETHER 2. SACRIFICE 1, three times.', c => { c.tether(2); for (let i = 0; i < 3; i++) c.sacrifice(1); }) } },
    { slot: 'e-03d', type: 'global', color: PURPLE, program: {
        global: { trigger: 'turn', text: 'SACRIFICE 2, LEECH {leech:2}.', paidDelta: 'LEECH {leech:3} instead.',
            free: c => { c.sacrifice(2); c.leech(2); }, paid: c => { c.sacrifice(2); c.leech(3); } } } },
    { slot: 'e-04c', type: 'spell', color: BLUE, program: {
        free: L('GUARD {guard:3}.', c => { c.guard(3); }),
        paid: L('WAIVE your next SACRIFICE this turn. Gain 1 Conviction.', c => { c.sacModifier({ kind: 'next-free', count: 1 }); c.conviction(1); }) } },
    { slot: 'e-05c', type: 'skill', color: BLUE, program: {
        free: L('DEAL {deal:3}.', c => { c.deal(3); }),
        paid: L('Play a Curse from your hand on its PAID line; WAIVE its SACRIFICE.', c => { c.playCurseFromHandWaived(); }, { requires: CURSE_IN_HAND }) } },
    { slot: 'e-06b', type: 'attack', color: RED, program: {
        free: L('DEAL {deal:4}, then SACRIFICE 2.', c => { c.deal(4); c.sacrifice(2); }),
        paid: L('DEAL {deal:7}, twice; SACRIFICE 2 after each.', c => { c.deal(7); c.sacrifice(2); c.deal(7); c.sacrifice(2); }) } },
    { slot: 'e-07b', type: 'spell', color: BLUE, program: {
        free: L('Your next SACRIFICE this turn is doubled (its cost and its payoffs).', c => { c.sacModifier({ kind: 'next-double' }); }),
        paid: L('Same, and gain 2 Conviction.', c => { c.sacModifier({ kind: 'next-double' }); c.conviction(2); }) } },
    { slot: 'e-08b', type: 'skill', color: BLUE, program: {
        free: L('Return a Curse from your discard to your hand. GUARD {guard:3}.', c => { c.returnCurseFromDiscard(); c.guard(3); }),
        paid: L('Return a Curse from your discard to your hand. GUARD {guard:8}.', c => { c.returnCurseFromDiscard(); c.guard(8); }) } },
    { slot: 'e-09c', type: 'global', color: RED, program: {
        global: { trigger: 'curse', text: 'DEAL {deal:4}.', paidDelta: 'DEAL {deal:6} instead.',
            free: c => { c.deal(4); }, paid: c => { c.deal(6); } } } },
    { slot: 'e-10d', type: 'spell', color: PURPLE, program: {
        free: L('TETHER 1. SACRIFICE 2.', c => { c.tether(1); c.sacrifice(2); }),
        paid: L('TETHER 1. SACRIFICE any amount (max 15).', c => { c.tether(1); c.sacrificeX(15); }) } },

    // ── MISC: related utility ────────────────────────────────────────────────
    { slot: 'm-01d', type: 'skill', color: PURPLE, program: {
        free: L('HEAL {heal:3}.', c => { c.heal(3); }),
        paid: L('LEECH {leech:4}.', c => { c.leech(4); }) } },
    { slot: 'm-02b', type: 'attack', color: RED, program: {
        free: L('DEAL {deal:2}.', c => { c.deal(2); }),
        paid: L('DEAL {deal:6}; HEAL all the damage dealt (max 8).', c => { const d = c.deal(6); c.heal(Math.min(8, d), { exact: true }); }) } },
    { slot: 'm-03d', type: 'skill', color: PURPLE, program: {
        free: L('GUARD {guard:3}.', c => { c.guard(3); }),
        paid: L('LEECH {leech:3}, or {leech:6} at half VITAE or less.', c => { c.leech(c.q.atHalf ? 6 : 3); }) } },
    { slot: 'm-04c', type: 'spell', color: RED, program: {
        free: L('GUARD {guard:3}.', c => { c.guard(3); }),
        paid: L('EXILE a Curse from your hand. DEAL {deal:10}.', c => { c.exileCurseFromHand(); c.deal(10); }) } },
    { slot: 'm-05b', type: 'skill', color: BLUE, program: {
        free: L('GUARD {guard:2}.', c => { c.guard(2); }),
        paid: L('Gain 2 Conviction, or 4 at half VITAE or less.', c => { c.conviction(c.q.atHalf ? 4 : 2); }) } },
    { slot: 'm-06c', type: 'skill', color: BLUE, program: {
        free: L('HEAL {heal:2}.', c => { c.heal(2); }),
        paid: L('This turn, damage cannot take you below 1 VITAE; HEAL {heal:5} next turn. EXILE.', c => { c.deathWard(); c.healNextTurn(5); }, { exile: true }) } },
    { slot: 'm-07a', type: 'spell', color: PURPLE, program: {
        free: L('VULNERABLE +{vuln:10}% for 1 turn.', c => { c.vulnerable(10, 1); }),
        paid: L('VULNERABLE +{vuln:25}% for 2 turns; HEAL {heal:2} each time you damage the foe while it lasts.', c => { c.vulnerable(25, 2); c.drain(2, 2); }) } },
    { slot: 'm-08d', type: 'global', color: PURPLE, program: {
        global: { trigger: 'turn', text: 'LEECH {leech:1}.', paidDelta: 'LEECH {leech:2} instead.',
            free: c => { c.leech(1); }, paid: c => { c.leech(2); } } } },
    { slot: 'm-09a', type: 'skill', color: BLUE, program: {
        free: L('HEAL {heal:4}; healing past max VITAE becomes GUARD.', c => { c.heal(4, { overflowToGuard: true }); }),
        paid: L('HEAL {heal:10}; healing past max VITAE becomes GUARD.', c => { c.heal(10, { overflowToGuard: true }); }) } },
    { slot: 'm-10a', type: 'spell', color: RED, program: {
        free: L('The foe loses VITAE equal to the damage you took last turn (max 5).', c => { c.foeLoses(Math.min(5, c.q.takenLastTurn)); }),
        paid: L('Same, max 15.', c => { c.foeLoses(Math.min(15, c.q.takenLastTurn)); }) } },
];

function toCard(e: Entry): Card {
    const proposal = e.slot.toUpperCase();
    return {
        id: `bp-${e.slot}`,
        name: `Blood Price ${proposal.slice(0, 4)}${e.slot.slice(4)}`,
        color: e.color,
        description: `Blood Price trial card, ${SUB_LANE[proposal[0]]} sub-lane.`,
        tier: 1, rank: 1, cardType: e.type,
        targetType: e.color === BLUE ? 'self' : 'enemy',
        program: e.program,
        addedIn: ADDED,
        tags: ['blood-price', 'trial'],
    };
}

/** The first Curse (plan/revamp/cards.md, T's text): grey, any die. Never a reward. */
const GREY_CURSE: Card = {
    id: CURSE_ID,
    name: 'Grey Curse',
    color: 'any',
    description: 'A dead card that holds a hand slot until played. It cannot be scrapped.',
    tier: 1, rank: 1, cardType: 'curse', targetType: 'self',
    program: {
        free: L('SACRIFICE 5.', c => { c.sacrifice(5); }),
        paid: L('SACRIFICE 10. EXILE.', c => { c.sacrifice(10); }, { exile: true }),
    },
    addedIn: ADDED,
    tags: ['blood-price', 'trial', 'curse'],
};

const LANE_CARDS: Card[] = ENTRIES.map(toCard);

/** The Blood Price lane: the 30 kept cards, and T's 20-card test deck. */
const BLOOD_PRICE_LANE: CardLane = Object.freeze({
    id: 'blood-price',
    name: 'Blood Price',
    cardIds: Object.freeze(LANE_CARDS.map(card => card.id)),
    testDeck: Object.freeze([
        'bp-e-09c', 'bp-p-03a', 'bp-m-04c', 'bp-m-02b', 'bp-e-06b',
        'bp-p-02a', 'bp-e-04c', 'bp-e-05c', 'bp-m-09a', 'bp-m-06c',
        'bp-p-05b', 'bp-m-07a', 'bp-e-03d', 'bp-m-01d', 'bp-m-08d',
        'bp-e-08b', 'bp-m-05b', 'bp-e-07b', 'bp-m-10a', 'bp-p-10c',
    ]),
});

/** The Blood Price trial set. */
export const BLOOD_PRICE_SET: TrialSet = Object.freeze({
    id: 'blood-price',
    cards: Object.freeze([...LANE_CARDS, GREY_CURSE]),
    lanes: Object.freeze([BLOOD_PRICE_LANE]),
});
