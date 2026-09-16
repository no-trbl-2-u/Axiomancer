/**
 * DEBT — THE RECKONING — THE BIG NUMBERS REWRITE (2026-09-02).
 *
 * The axis is power now, cost later. Every other theme asks what a card does;
 * this one asks what it will cost you when the note falls due. Debt hits two
 * ranks above its station and bills the difference in VITAE: RECOIL as a
 * printed price, `recoil_x` when the sum is left blank for you to fill in,
 * DOOM as compound interest, IMMOLATE when there is nothing left to pay with
 * but the goods, `fate` when a dead die is offered as collateral, and FALLEN
 * as the payoff for a body already carrying its own afflictions.
 *
 * WRATH is the signature scaler: a combat-long +N to every hit you land. The
 * debt deck does not win a turn — it borrows against six of them and then
 * settles, once, for seventy.
 *
 * Authored against `plan/2026-09-02-card-authoring-brief.md`; shape copied from
 * `starters.cards.ts`. Data only — all runtime behaviour lives in
 * `src/Cards/card.engine.ts` and `src/Combat/combat.engine.ts`.
 */

import type { Card } from '../types';

const ADDED = '2026-09-02';

// ─── ASH — the small notes ───────────────────────────────────────────────────

const promissoryCut: Card = {
    id: 'promissory-cut',
    theme: 'debt',
    name: 'Promissory Cut',
    philosophicalAspect: 'heart',
    description:
        'The note is short and the terms are shorter: whatever is asked, ' +
        'paid at the asking. You open the vein and the page turns itself. ' +
        'Signed is signed.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'RECOIL 4. Draw 2 and gain 2 Conviction.',
    // pts: the Necropotence seed at the new scale — two cards and a tempo beat
    // for four VITAE. Cards cost blood, blood is cheap, blood is not free.
    free: { recoil: 1, drawCards: 1 },
    specialMechanics: [
        { kind: 'recoil', hp: 4 },
        { kind: 'rider', rider: { drawCards: 2, conviction: 2 } },
    ],
    addedIn: ADDED,
    tags: ['debt', 'recoil', 'draw'],
};

const tallyStick: Card = {
    id: 'tally-stick',
    theme: 'debt',
    name: 'Tally Stick',
    philosophicalAspect: 'body',
    description:
        'Hazel, split lengthwise, notched once for every debt and once again ' +
        'for the interest. You keep the stock and they keep the foil, and the ' +
        'two halves only agree about how much you owe.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 7. WRATH 1 — every hit you land deals 1 more for the rest of the fight.',
    // pts: deal 7 (band) + the theme's signature scaler at its smallest. The
    // Ash card that is still doing work on turn nine.
    free: { damage: 3 },
    specialMechanics: [
        { kind: 'deal', amount: 7 },
        { kind: 'wrath', amount: 1 },
    ],
    addedIn: ADDED,
    tags: ['debt', 'wrath', 'scaler'],
};

const chalkOnTheDoorpost: Card = {
    id: 'chalk-on-the-doorpost',
    theme: 'debt',
    name: 'Chalk on the Doorpost',
    philosophicalAspect: 'mind',
    description:
        'A short white stroke by the lintel, added at dusk, never wiped off. ' +
        'The grocer does not have to say anything and neither do you. Rain ' +
        'takes the chalk eventually. It has never once taken the sum.',
    tier: 2, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 6. Afflict DOOM 3 — it swells each time the foe acts.',
    // pts: deal 6 (band) + DOOM 3 as the compound-interest seed. One keyword
    // beyond the damage verb, no condition line — an honest Ash card.
    free: { damage: 2, applyEffect: { effectId: 'debuff_creeping_doom', intensity: 1 } },
    specialMechanics: [{ kind: 'deal', amount: 6 }],
    combatEffects: [
        { effectId: 'debuff_creeping_doom', appliedTo: 'opponent', intensity: 3 },
    ],
    addedIn: ADDED,
    tags: ['debt', 'doom', 'dot'],
};

// ─── TOOTH — the interest starts ─────────────────────────────────────────────

const theVig: Card = {
    id: 'the-vig',
    theme: 'debt',
    name: 'The Vig',
    philosophicalAspect: 'mind',
    description:
        'Nobody remembers borrowing. The interest remembers for them. Every ' +
        'morning the figure is larger, and every morning is the last ' +
        'morning it will ever be this small.',
    tier: 2, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'RECOIL 3. Deal 9. Afflict DOOM 5 — it swells each time the foe acts.',
    // pts: deal 9 (band floor) + DOOM 5 (a rank up on the DoT band), bought
    // with 3 VITAE. Compound interest as a combat verb.
    free: { applyEffect: { effectId: 'debuff_creeping_doom', intensity: 2 } },
    specialMechanics: [
        { kind: 'recoil', hp: 3 },
        { kind: 'deal', amount: 9 },
    ],
    combatEffects: [
        { effectId: 'debuff_creeping_doom', appliedTo: 'opponent', intensity: 5 },
    ],
    addedIn: ADDED,
    tags: ['debt', 'doom', 'recoil'],
};

const theGracePeriod: Card = {
    id: 'the-grace-period',
    theme: 'debt',
    name: 'The Grace Period',
    philosophicalAspect: 'heart',
    description:
        'The house is generous about when. It has never once been generous ' +
        'about whether. Sleep tonight behind a door nobody will knock on, ' +
        'and understand that the quiet is itemised.',
    tier: 2, rank: 2, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'BARRIER 12. Draw 1. Take DOOM 2 on yourself.',
    // pts: barrier 12 (band ceiling) + draw 1, priced not in VITAE but in a
    // self-affliction — the deck's cheapest way to turn FALLEN on.
    free: { barrier: 5 },
    specialMechanics: [
        { kind: 'barrier', amount: 12 },
        { kind: 'rider', rider: { drawCards: 1 } },
    ],
    combatEffects: [
        { effectId: 'debuff_creeping_doom', appliedTo: 'self', intensity: 2 },
    ],
    addedIn: ADDED,
    tags: ['debt', 'barrier', 'fallen-enabler'],
};

// ─── SPLINTER — collateral ───────────────────────────────────────────────────

const deadPledge: Card = {
    id: 'dead-pledge',
    theme: 'debt',
    name: 'The Dead Pledge',
    philosophicalAspect: 'body',
    description:
        'Mort gage, the old clerks wrote it: the dead pledge. What has died ' +
        'in your hand is not spent — it is collateral. The broker takes the ' +
        'cold die, opens your arm for the difference, and pays out in kind.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'RECOIL 5. Deal 18. Powered by a dead die it deals 12 more, grants WRATH 1, and costs 4 more VITAE.',
    // pts: deal 18 (band ceiling) for 5 VITAE, and a dead X die is not a dead
    // face here — it is collateral worth another 12 and a permanent scaler.
    free: { damage: 6, recoil: 2 },
    specialMechanics: [
        { kind: 'recoil', hp: 5 },
        { kind: 'deal', amount: 18 },
    ],
    fate: { rider: { damage: 12, wrath: 1 }, recoilHp: 4 },
    addedIn: ADDED,
    tags: ['debt', 'fate', 'recoil'],
};

const insolvency: Card = {
    id: 'insolvency',
    theme: 'debt',
    name: 'Insolvency',
    philosophicalAspect: 'mind',
    description:
        'There is a threshold past which the arithmetic stops being about ' +
        'you and starts being about them. Cross it. A man with nothing left ' +
        'to lose is not poor. He is leverage.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 16. FALLEN: deal 14 more and draw 1.',
    // pts: deal 16 (band) doubling to 30 while you carry two of your own
    // afflictions. The FREE line is the enabler — it puts one of them on you.
    free: { damage: 6, applyEffect: { effectId: 'debuff_creeping_doom', intensity: 2, to: 'self' } },
    specialMechanics: [{ kind: 'deal', amount: 16 }],
    fallen: { rider: { damage: 14, drawCards: 1 } },
    addedIn: ADDED,
    tags: ['debt', 'fallen', 'payoff'],
};

const usury: Card = {
    id: 'usury',
    theme: 'debt',
    name: 'Usury',
    philosophicalAspect: 'heart',
    description:
        'The sin is not the lending. The sin is charging for time, which ' +
        'belongs to nobody, and which the church says is God\'s. You have ' +
        'been charging for time all your life and nobody has come for you yet.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'RECOIL 6. Deal 5, 4 times. WRATH 3. Powered off-colour it deals 8 more and costs 3 more VITAE.',
    // pts: 5 × 4 (band) with WRATH 3 riding every one of them, so the card
    // that follows it inherits the loan. The wrong die borrows harder.
    free: { damage: 4, wrath: 1 },
    specialMechanics: [
        { kind: 'recoil', hp: 6 },
        { kind: 'deal', amount: 5, hits: 4 },
        { kind: 'wrath', amount: 3 },
    ],
    dieBonus: { onColor: 'off', rider: { damage: 8, recoil: 3 } },
    addedIn: ADDED,
    tags: ['debt', 'wrath', 'multi-hit'],
};

const anEvenReckoning: Card = {
    id: 'an-even-reckoning',
    theme: 'debt',
    name: 'An Even Reckoning',
    philosophicalAspect: 'mind',
    description:
        'The clerk will not close a book on an odd number — bad luck follows ' +
        'an uneven sum out the door and into the world. So he counts twice, ' +
        'and the second count is always the one that matters.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Deal 16. EVENTIDE — with an even number of cards left in your draw pile, deal 14 more and gain 1 Soul.',
    // pts: deal 16 (5.33) + eventide[deal 14 (4.67) + soul 1 (0.75)] × 0.5
    // condition discount = 2.71 → paid ≈ 8.04. FREE deal 6 (2.0). The book
    // only balances on roughly half the draws, same coin-flip reliability
    // as any other condition rider — the Chaos-family gap the loop-call
    // asked this pass to fill, priced through the existing threshold
    // discount rather than a new pricing lever.
    free: { damage: 6 },
    specialMechanics: [{ kind: 'deal', amount: 16 }],
    synergy: {
        statePredicate: { kind: 'eventide' },
        rider: { damage: 14, souls: 1 },
    },
    addedIn: '2026-09-16',
    tags: ['debt', 'eventide', 'payoff'],
};

// ─── RIB — the bailiff calls ─────────────────────────────────────────────────

const distraint: Card = {
    id: 'distraint',
    theme: 'debt',
    name: 'Distraint',
    philosophicalAspect: 'body',
    description:
        'The bailiff does not knock. He inventories. What cannot be paid in ' +
        'blood is paid in kind — the least things you carry go onto the ' +
        'fire, and the ledger, briefly, is warm toward you.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'IMMOLATE 2: burn the 2 lowest cards in your hand, then deal 26 and gain GUARD 24. FALLEN: draw 2.',
    // pts: deal 26 + guard 24 (both at band) bought with two cards off the
    // bottom of your hand. Burning an injected curse this way is pure profit.
    free: { guard: 10, recoil: 2 },
    specialMechanics: [
        { kind: 'immolate', count: 2, rider: { damage: 26, guard: 24 } },
    ],
    fallen: { rider: { drawCards: 2 } },
    addedIn: ADDED,
    tags: ['debt', 'immolate', 'fallen'],
};

const surplusage: Card = {
    id: 'surplusage',
    theme: 'debt',
    name: 'Surplusage',
    philosophicalAspect: 'mind',
    description:
        'Matter pleaded beyond what the case required. The clerks strike it ' +
        'out and the court ignores it and it is still there, in the margin, ' +
        'in your hand, being worth something to somebody.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'RECOIL 6. Deal 24. OVERKILL: every 4 VITAE spilled past the kill returns 1 Conviction.',
    // pts: deal 24 (band) for 6 VITAE, and the swing that overshoots a dying
    // foe funds the next fight instead of evaporating. Nothing is wasted here.
    free: { damage: 9, recoil: 3 },
    specialMechanics: [
        { kind: 'recoil', hp: 6 },
        { kind: 'deal', amount: 24 },
        { kind: 'overkill', per: 4, conviction: 1 },
    ],
    addedIn: ADDED,
    tags: ['debt', 'overkill', 'recoil'],
};

const aPoundOfFlesh: Card = {
    id: 'a-pound-of-flesh',
    theme: 'debt',
    name: 'A Pound of Flesh',
    philosophicalAspect: 'body',
    description:
        'Nearest the heart, the bond specifies, and no blood — as though the ' +
        'two could be separated by anybody who had ever cut anything. You ' +
        'take your pound. You are generous about the blood.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'RECOIL 10. Deal 30. WRATH 2. If you already paid VITAE this turn, deal 14 more and gain 1 more WRATH.',
    // pts: deal 30 (band ceiling) at ten VITAE, and it pays a second dividend
    // to the turn that already bled. The frenzy shape: bleed, then bleed again.
    free: { damage: 10, recoil: 4 },
    specialMechanics: [
        { kind: 'recoil', hp: 10 },
        { kind: 'deal', amount: 30 },
        { kind: 'wrath', amount: 2 },
    ],
    synergy: {
        statePredicate: { kind: 'recoil-paid-this-turn' },
        rider: { damage: 14, wrath: 1 },
    },
    addedIn: ADDED,
    tags: ['debt', 'recoil', 'wrath'],
};

// ─── SKULL — the sum left blank ──────────────────────────────────────────────

const blankIndenture: Card = {
    id: 'blank-indenture',
    theme: 'debt',
    name: 'Blank Indenture',
    philosophicalAspect: 'heart',
    description:
        'The sum is left open, in the oldest courtesy of the trade. You ' +
        'fill the figure in with the only ink the house accepts, and the ' +
        'house honors every drop. Signed is signed. The amount was always ' +
        'yours to regret.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'RECOIL X of your own choosing, at least 6. Afflict POISON 1 for each 1 VITAE paid. WRATH 4.',
    // pts: the chosen-X carrier and the deck's thesis statement — you decide
    // how much of yourself the poison is worth. No condition line: the
    // contract is never discounted.
    free: { applyEffect: { effectId: 'debuff_creeping_doom', intensity: 4 }, drawCards: 1 },
    specialMechanics: [
        { kind: 'recoil_x', min: 6, poisonPerX: 1 },
        { kind: 'wrath', amount: 4 },
    ],
    addedIn: ADDED,
    tags: ['debt', 'recoil-x', 'capstone'],
};

const confessionOfJudgment: Card = {
    id: 'confession-of-judgment',
    theme: 'debt',
    name: 'Confession of Judgment',
    philosophicalAspect: 'heart',
    description:
        'You sign away the right to be heard about it later. No hearing, no ' +
        'defence, no delay — only the entry, already drafted, waiting for the ' +
        'day the house decides it is tired of waiting. Feed the fire and be quiet.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'IMMOLATE 3: burn the 3 lowest cards in your hand, then deal 40 and Heal 22. FALLEN: deal 30 more.',
    // pts: deal 40 (band) + heal 22 (band) for three cards off the bottom, and
    // 70 total on a body already carrying two afflictions. The FREE line bleeds
    // you on purpose — it is the fuse for its own PAID line.
    free: { damage: 14, applyEffect: { effectId: 'debuff_bleed', intensity: 4, duration: 2, to: 'self' } },
    specialMechanics: [
        { kind: 'immolate', count: 3, rider: { damage: 40, healHp: 22 } },
    ],
    fallen: { rider: { damage: 30 } },
    addedIn: ADDED,
    tags: ['debt', 'immolate', 'fallen'],
};

const theRedLedger: Card = {
    id: 'the-red-ledger',
    theme: 'debt',
    name: 'The Red Ledger',
    philosophicalAspect: 'mind',
    persistentEffect:
        'Whenever you pay RECOIL, gain WRATH 1 and deal 6 to the foe.',
    description:
        'Every drop is entered. The book forgives nothing. It forwards. ' +
        'What you pay at your own vein it bills again, promptly, at theirs.',
    tier: 3, rank: 5, cardType: 'oath',
    targetType: 'self',
    // pts: engine text — WRATH 1 and 6 damage per RECOIL event, and a committed
    // debt deck pays eight of those in a long fight. The oath is why the deck's
    // costs are its engine and not its tax.
    addedIn: ADDED,
    tags: ['debt', 'oath', 'recoil-payoff', 'wrath'],
};

// ─── SAINT — the reckoning ───────────────────────────────────────────────────

const theLastAssize: Card = {
    id: 'the-last-assize',
    theme: 'debt',
    name: 'The Last Assize',
    philosophicalAspect: 'body',
    description:
        'The circuit judge comes round once. Every account in the parish is ' +
        'read out at once, in a voice that does not tire, and there is no ' +
        'appeal because there is nowhere left to appeal to. Stand up. It is yours.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'RECOIL 20. Deal 70. WRATH 5. OVERKILL: every 5 VITAE spilled past the kill returns 1 Conviction. FALLEN: deal 30 more and Heal 30.',
    // pts: the biggest printed single hit in the library — 70 for twenty of
    // your own VITAE, 100 while Fallen, with the overflow banked as Conviction.
    // The whole deck is a loan taken out against this one settlement.
    free: { damage: 24, recoil: 8 },
    specialMechanics: [
        { kind: 'recoil', hp: 20 },
        { kind: 'deal', amount: 70 },
        { kind: 'wrath', amount: 5 },
        { kind: 'overkill', per: 5, conviction: 1 },
    ],
    fallen: { rider: { damage: 30, healHp: 30 } },
    addedIn: ADDED,
    tags: ['debt', 'recoil', 'overkill', 'capstone'],
};

const jointAndSeveral: Card = {
    id: 'joint-and-several',
    theme: 'debt',
    name: 'Joint and Several',
    philosophicalAspect: 'heart',
    persistentEffect:
        'Whenever you pay RECOIL, the foe loses twice that much VITAE.',
    description:
        'The amendment is read aloud in the smallest of the nine courts: ' +
        'liability shall be joint and several. From this clause forward, ' +
        'whatever the signatory bleeds, the counterparty bleeds twice — coin ' +
        'for coin, drop for drop, and then the drop again.',
    tier: 3, rank: 6, cardType: 'hex',
    targetType: 'enemy',
    // pts: engine text — doubles every RECOIL paid back onto the foe for the
    // rest of combat. Under this hex a Last Assize costs 20 and collects 40
    // before the swing even resolves.
    addedIn: ADDED,
    tags: ['debt', 'hex', 'recoil-payoff'],
};

/** THE RECKONING — 17 cards, rank-ascending. */
export const DEBT_CARDS: Card[] = [
    promissoryCut, tallyStick, chalkOnTheDoorpost,
    theVig, theGracePeriod,
    deadPledge, insolvency, usury, anEvenReckoning,
    distraint, surplusage, aPoundOfFlesh,
    blankIndenture, confessionOfJudgment, theRedLedger,
    theLastAssize, jointAndSeveral,
];
