/**
 * THE APOCRYPHA — the last-act pool. THE BIG NUMBERS REWRITE (2026-09-02).
 *
 * Twelve cards, all rank 6 (Saint), tier 3, two per theme. These are not the
 * theme capstones — those already sit in `rot.cards.ts`, `debt.cards.ts` and
 * their four siblings. These are the books the parish struck from the canon
 * and kept anyway: each one takes its theme's axis one turn past the point
 * where the axis was still safe to carry.
 *
 * Owner ruling 2026-09-02: "feel free to create some wild late game cards."
 * The scale here is deliberately above the Saint band in the authoring brief.
 * The measured library ceiling on 2026-09-02 was `communion-of-the-worm` at
 * 1112 VITAE in one fed play and a median Saint face near 60-70 flat; these
 * twelve are authored to sit at the top of that distribution:
 *
 * - flat hits of 70-90 (`the-vein-called-in`, `the-long-kyrie`),
 * - multi-hits whose printed sum is only the floor (`the-whole-body-confesses`
 *   prints 96 and doubles it under EXECUTE),
 * - and four uncapped payoffs that reach 200-400 on a board that earned them
 *   (`the-feast-of-all-corruption`, `nothing-stays-buried`,
 *   `all-objections-sustained`, `every-coin-in-the-poorbox`).
 *
 * Every card here is a `spell`: the oath and hex seats of all six themes are
 * already filled, and an apocryphon that only sat there passively would be a
 * seventh standing effect nobody asked for.
 *
 * Aspect split is exactly 4 body / 4 mind / 4 heart so the pool can feed a
 * 5/5/5 deck from any theme pairing.
 *
 * This file is data-only. All runtime behaviour lives in
 * `src/Cards/card.engine.ts` and `src/Combat/combat.engine.ts`.
 */

import type { Card } from '../types';

const ADDED = '2026-09-02';

// ─── ROT — the ground gives up everything it was holding ─────────────────────

const theFeastOfAllCorruption: Card = {
    id: 'the-feast-of-all-corruption',
    theme: 'rot',
    name: 'The Feast of All Corruption',
    philosophicalAspect: 'heart',
    description:
        'The table is laid the length of the nave and every seat is taken by ' +
        'something that used to be a parishioner. Grace is said in one long ' +
        'wet syllable. Then the whole congregation leans in at once, and ' +
        'there is not going to be a second course.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Inflict POISON 15 for 4 turns. FESTER 8. PROLONG every affliction on the foe by 3 turns. Deal 20. PIERCE. RUPTURE ALL. SIPHON 50%.',
    // pts: the detonator that feeds itself. Engine order is combatEffects then
    // mechanics, so the fresh POISON 15 is fattened to 23 by its own FESTER,
    // stretched three turns by its own PROLONG, and then eaten by its own
    // RUPTURE — a self-contained 200+ off an empty board and 350-400 off a fed
    // one, half of it returned as VITAE. Uncapped by law. The FREE line is the
    // replant, because the turn after this the ground is bare.
    free: {
        applyEffect: { effectId: 'debuff_poison', intensity: 8, duration: 3 },
        tickOne: true,
    },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 15, duration: 4 },
    ],
    specialMechanics: [
        { kind: 'boost_all_dots', intensity: 8 },
        { kind: 'extend_dots', turns: 3 },
        { kind: 'deal', amount: 20, pierce: true },
        { kind: 'rupture' },
        { kind: 'siphon', pct: 0.5 },
    ],
    addedIn: ADDED,
    tags: ['rot', 'apocrypha', 'late-game'],
};

const theWholeBodyConfesses: Card = {
    id: 'the-whole-body-confesses',
    theme: 'rot',
    name: 'The Whole Body Confesses',
    philosophicalAspect: 'body',
    description:
        'Ask the hand and the hand tells you. Ask the gut, the marrow, the ' +
        'small bones of the ear — every one of them has been waiting to be ' +
        'asked. Flesh keeps no secrets. It only keeps them in order, and you ' +
        'have all afternoon.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Inflict BLEED 15 for 4 turns. Deal 16 x 6. FLAY 8. EXECUTE 45%: while the foe is that low, this damage is doubled.',
    // pts: 96 printed across six separate instances into a fresh BLEED 15, so
    // every stack on the board fires six times and the eight FLAY stacks are
    // eaten by this card's own hits. Under EXECUTE the printed sum is 192
    // before the vulnerable multiplier — the honest top end is nearer 280.
    // A matching die adds a ninth FLAY stack and five intensity to the BLEED.
    free: { damage: 30, flay: 2 },
    combatEffects: [
        { effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 15, duration: 4 },
    ],
    specialMechanics: [
        { kind: 'deal', amount: 16, hits: 6 },
        { kind: 'flay', stacks: 8 },
        { kind: 'execute', atPct: 0.45 },
    ],
    dieBonus: { onColor: 'match', rider: { flay: 4, bonusIntensity: 5 } },
    addedIn: ADDED,
    tags: ['rot', 'apocrypha', 'late-game'],
};

// ─── DEBT — the sum is read out, and there is nowhere to appeal to ───────────

const theVeinCalledIn: Card = {
    id: 'the-vein-called-in',
    theme: 'debt',
    name: 'The Vein Called In',
    philosophicalAspect: 'body',
    description:
        'Not a payment. A recall. Everything ever lent against your blood is ' +
        'summoned back through the one narrow door it went out of, all in the ' +
        'same breath, and it does not much care what shape you are in when it ' +
        'arrives. Open the arm. Stand where they can see you.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'RECOIL 30. Deal 90. WRATH 8. OVERKILL: every 3 VITAE spilled past the kill returns 1 Conviction and heals 100 percent of the excess. FALLEN: deal 60 more, gain 3 more WRATH and Heal 40.',
    // pts: the largest printed single hit in the library — 90 for thirty of
    // your own VITAE, 150 while Fallen, with WRATH 8 riding every hit for the
    // rest of the fight. The OVERKILL clause is the reason the overshoot is
    // never waste: whatever spills past the corpse comes back as VITAE and ◆.
    free: { damage: 32, recoil: 12 },
    specialMechanics: [
        { kind: 'recoil', hp: 30 },
        { kind: 'deal', amount: 90 },
        { kind: 'wrath', amount: 8 },
        { kind: 'overkill', per: 3, conviction: 1, healPct: 1 },
    ],
    fallen: { rider: { damage: 60, wrath: 3, healHp: 40 } },
    addedIn: ADDED,
    tags: ['debt', 'apocrypha', 'late-game'],
};

const theNoteFallsDue: Card = {
    id: 'the-note-falls-due',
    theme: 'debt',
    name: 'The Note Falls Due',
    philosophicalAspect: 'heart',
    description:
        'There was a date on it. There is always a date on it, and it is ' +
        'always further off than today until the morning it is not. The house ' +
        'sends nobody. The house does not have to send anybody. Feed the fire ' +
        'and be quiet.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Afflict DOOM 20. IMMOLATE 4: burn the 4 lowest cards in your hand, then deal 75, Heal 35, draw 3 and gain WRATH 4. Powered off-colour it deals 55 more, gains WRATH 3 more, and costs 15 more VITAE.',
    // pts: four cards off the bottom of your hand buy 75 damage, 35 VITAE back
    // and three fresh cards — and the wrong-colour die everyone else wastes is
    // collateral here, worth another 55 for fifteen of your own (off-colour
    // dieBonus, folded from the retired X-die `fate` line). DOOM 20 is
    // the interest that keeps swelling while you spend the principal. The FREE
    // line bleeds you on purpose: it is the fuse for the deck's FALLEN cards.
    free: {
        damage: 22,
        applyEffect: { effectId: 'debuff_bleed', intensity: 6, duration: 2, to: 'self' },
    },
    combatEffects: [
        { effectId: 'debuff_creeping_doom', appliedTo: 'opponent', intensity: 20 },
    ],
    specialMechanics: [
        { kind: 'immolate', count: 4, rider: { damage: 75, healHp: 35, drawCards: 3, wrath: 4 } },
    ],
    dieBonus: { onColor: 'off', rider: { damage: 55, wrath: 3, recoil: 15 } },
    addedIn: ADDED,
    tags: ['debt', 'apocrypha', 'late-game'],
};

// ─── GRAVE — the yard gives its answer, and then gives it again ──────────────

const nothingStaysBuried: Card = {
    id: 'nothing-stays-buried',
    theme: 'grave',
    name: 'Nothing Stays Buried',
    philosophicalAspect: 'mind',
    description:
        'The sexton stopped filling holes years ago. What goes down comes up ' +
        'by Thursday, in worse temper, with the same complaint it had the ' +
        'first time. You have stopped apologising to it. You have started ' +
        'making use of the schedule.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'REPLAY your last spell 3 times. TWIN — your next spell this turn resolves its payload twice. RECALL 3 cards from your discard pile. MILL 4. REQUIEM 30: deal 55 more and draw 3.',
    // pts: the theme's thesis with the brakes off. Point it at a Saint hit and
    // the printed face has no number at all — three replays of a 90 is 270
    // before the TWIN arms the next one. The two hands it gives back and the
    // requiem-30 clause are what stop the turn ending here.
    free: { damage: 26, millCards: 5 },
    specialMechanics: [
        { kind: 'replay_last', times: 3 },
        { kind: 'twin' },
        { kind: 'reprise', count: 3 },
        { kind: 'rider', rider: { millCards: 4 } },
    ],
    synergy: {
        statePredicate: { kind: 'requiem', n: 30 },
        rider: { damage: 55, drawCards: 3 },
    },
    addedIn: ADDED,
    tags: ['grave', 'apocrypha', 'late-game'],
};

const theLastPageTornOut: Card = {
    id: 'the-last-page-torn-out',
    theme: 'grave',
    name: 'The Last Page Torn Out',
    philosophicalAspect: 'body',
    description:
        'Whoever kept the register kept it honestly until the final leaf, and ' +
        'then took that one with them. What burns here is the rest of it: the ' +
        'names, the dates, the little marginal kindnesses. The fire is not ' +
        'reading. The fire is only very hungry, and you brought it something.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'IMMOLATE 5: burn the 5 lowest cards in your hand, then deal 85 and draw 4. RECALL 2 cards and their FREE lines fire now. REQUIEM 36: deal 60 more and gain WRATH 4.',
    // pts: the pyre at its largest printed size — five cards leave the fight
    // forever and pay 85 and four draws for it, then two better bodies come
    // back out of the discard already firing. Burning an injected curse this
    // way is still pure profit, and this burns five.
    free: { damage: 24, millCards: 6 },
    specialMechanics: [
        { kind: 'immolate', count: 5, rider: { damage: 85, drawCards: 4 } },
        { kind: 'reprise', count: 2, fireFree: true },
    ],
    synergy: {
        statePredicate: { kind: 'requiem', n: 36 },
        rider: { damage: 60, wrath: 4 },
    },
    addedIn: ADDED,
    tags: ['grave', 'apocrypha', 'late-game'],
};

// ─── VIGIL — the wall outlasts the siege and then outlasts the walls ─────────

const nineNightsWithoutABreach: Card = {
    id: 'nine-nights-without-a-breach',
    theme: 'vigil',
    name: 'Nine Nights Without a Breach',
    philosophicalAspect: 'mind',
    description:
        'The watch-book has nine identical entries and a hand that got ' +
        'steadier every one of them. Nine nights is not luck. Nine nights is ' +
        'a decision somebody made about ice, and sightlines, and where to ' +
        'stand, repeated until the decision became a wall in its own right.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'GUARD 60 (persists). Gain THORNS 30 for 4 turns. FORETELL 3.',
    // pts: barrier 60 and THORNS at the intensity ceiling for four turns, and
    // the whole card is a bet on the clause below it — a night nobody crossed
    // pays 120 VITAE, three cards and 6 Conviction, free. The wall IS the
    // damage, printed larger here than anywhere else in the library.
    free: { barrier: 22, foretell: 1 },
    combatEffects: [
        { effectId: 'buff_thorns', appliedTo: 'self', intensity: 30, duration: 4 },
    ],
    specialMechanics: [
        { kind: 'barrier', amount: 60 },
        { kind: 'foretell', count: 3 },
    ],
    synergy: {
        statePredicate: { kind: 'enemy-dealt-no-damage-last-round' },
        rider: { damage: 120, drawCards: 3, conviction: 6 },
    },
    addedIn: ADDED,
    tags: ['vigil', 'apocrypha', 'late-game'],
};

const everyLadderBroken: Card = {
    id: 'every-ladder-broken',
    theme: 'vigil',
    name: 'Every Ladder Broken',
    philosophicalAspect: 'body',
    description:
        'They spent the autumn cutting the ladders and the winter carrying ' +
        'them. The watch spends one minute on each. There is a sound a ' +
        'siege makes when it understands, and it is quieter than you would ' +
        'expect, and it comes from a long way down.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Inflict BLEED 15 for 3 turns. GUARD 70. Arm RIPOSTE 70 with parry 25. Deal 8 x 5.',
    // pts: the promise stated at its loudest — a 70 wall is a 70 answer, and
    // the five small instances are there so a fresh BLEED 15 fires five times
    // on the way down. A foe that already drew blood hands back another 60 and
    // three FLAY stacks for the next card.
    free: {
        guard: 26,
        applyEffect: { effectId: 'buff_thorns', intensity: 10, duration: 2, to: 'self' },
    },
    combatEffects: [
        { effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 15, duration: 3 },
    ],
    specialMechanics: [
        { kind: 'guard', amount: 70 },
        { kind: 'riposte', damage: 70, reduce: 25 },
        { kind: 'deal', amount: 8, hits: 5 },
    ],
    synergy: {
        statePredicate: { kind: 'enemy-drew-blood' },
        rider: { damage: 60, flay: 3 },
    },
    addedIn: ADDED,
    tags: ['vigil', 'apocrypha', 'late-game'],
};

// ─── TRIAL — the docket is closed and the ledger is presented ────────────────

const theBenchDoesNotRetire: Card = {
    id: 'the-bench-does-not-retire',
    theme: 'trial',
    name: 'The Bench Does Not Retire',
    philosophicalAspect: 'mind',
    description:
        'No recess, no deliberation, no going out to consider. The bench has ' +
        'been considering since before the arraignment and it considers in ' +
        'its sleep. Sit down. Everything you say from here is going into the ' +
        'total.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Apply MARK 10 for 5 turns. Deal 40. Gain 9 CHARGES. SENTENCE at 10 — deal 60, consume every MARK stack for 14 damage apiece, STAGGER 3 and draw 3. CONDEMN at 12 wins outright against a lesser foe. An elite demands 24, a boss 40, a unique 60.',
    // pts: nine Charges in one play is most of a docket, so the declared
    // SENTENCE lands the same turn against anything already on trial — and
    // the MARK 10 it applies is exactly the evidence its own conclusion
    // consumes at 14 apiece. CONDEMN at 12 clears the boss floor by nothing at
    // all, which is the point: the alt-win is reachable and never cheap.
    free: {
        premises: 4,
        applyEffect: { effectId: 'debuff_mark', intensity: 4, duration: 3 },
    },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 10, duration: 5 },
    ],
    specialMechanics: [
        { kind: 'deal', amount: 40 },
        { kind: 'premise', count: 9 },
        {
            kind: 'peroration',
            at: 10,
            rider: { damage: 60, ruptureMarks: 14, stagger: 3, drawCards: 3 },
            concedeAt: 12,
        },
    ],
    addedIn: ADDED,
    tags: ['trial', 'apocrypha', 'late-game'],
};

const allObjectionsSustained: Card = {
    id: 'all-objections-sustained',
    theme: 'trial',
    name: 'All Objections Sustained',
    philosophicalAspect: 'heart',
    description:
        'Every motion you ever raised, granted at once, retroactively, by a ' +
        'court that has run out of patience with the other side. It arrives ' +
        'as weight rather than as argument. The foe opens its mouth and the ' +
        'whole cold ledger of everything it was not allowed to do lands on it.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Deal 45. STAGGER 3. Lock the next stance of the foe. BACKFIRE ALL — burst 16 for every rung you have ever denied, then the ledger is cleared. FLOW: with 2 spells already resolved this turn, deal 55 more and gain 5 CHARGES.',
    // pts: uncapped by law. A control deck denies 12-20 rungs across a long
    // fight, so BACKFIRE ALL at 16 apiece is 190-320 in one play, and the
    // STAGGER on this same card feeds the ledger it is about to cash. FLOW is
    // the correct gate: this is the third play of a turn, never the first.
    free: { damage: 16, stagger: 2 },
    specialMechanics: [
        { kind: 'deal', amount: 45 },
        { kind: 'stagger', rungs: 3 },
        { kind: 'lock_stance' },
        { kind: 'turnabout', burstPerRung: 16 },
    ],
    synergy: {
        statePredicate: { kind: 'flow', minPriorSpells: 2 },
        rider: { damage: 55, premises: 5 },
    },
    addedIn: ADDED,
    tags: ['trial', 'apocrypha', 'late-game'],
};

// ─── CHOIR — the plate goes up, and the singing does not stop ────────────────

const everyCoinInThePoorbox: Card = {
    id: 'every-coin-in-the-poorbox',
    theme: 'choir',
    name: 'Every Coin in the Poorbox',
    philosophicalAspect: 'heart',
    description:
        'The box has not been opened since the old dean, and the old dean is ' +
        'a rumour. You take the lid off with a chisel and the parish holds ' +
        'its breath. Nothing in there is money. Everything in there was ' +
        'somebody, once, and they have been waiting to be spent.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Gain 6 SOULS. REAP ALL. 26 damage per Soul spent. SIPHON 50%. PLEA 20.',
    // pts: uncapped by law, and it fills its own plate first — six coins are
    // deposited before the plate goes up, so the floor is 156 with an empty
    // bank and a held bank of twelve is over 460, half of it returned as
    // VITAE. Four spent heart dice hand back four coins and 30 VITAE for free.
    free: { souls: 3, sway: 12 },
    specialMechanics: [
        { kind: 'soul_gain', count: 6 },
        { kind: 'reap_all', burstPerSoul: 26 },
        { kind: 'siphon', pct: 0.5 },
        { kind: 'sway', amount: 20 },
    ],
    threshold: { color: 'heart', count: 4, rider: { souls: 4, healHp: 30 } },
    addedIn: ADDED,
    tags: ['choir', 'apocrypha', 'late-game'],
};

const theLongKyrie: Card = {
    id: 'the-long-kyrie',
    theme: 'choir',
    name: 'The Long Kyrie',
    philosophicalAspect: 'mind',
    description:
        'Lord have mercy, forty times, then four hundred, then past counting. ' +
        'It is not a prayer any more by the third hour. It is a weather. The ' +
        'thing in front of you has begun mouthing along and has not noticed ' +
        'that it has.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Apply QUARTER 8 for 4 turns. Gain Grace Momentum 4 for 6 turns, and each stack adds 12 percent to the PLEA you deal. PLEA 70. Heal 30. CLEANSE 3.',
    // pts: the Saint PLEA rate doubled and then multiplied — 70 now, plus a
    // near-half bonus on every PLEA that follows for six turns, against a foe
    // whose blows are arriving at a fraction of their weight. This is the card
    // that talks a thousand-VITAE boss all the way down without killing it.
    free: { sway: 24, healHp: 12 },
    combatEffects: [
        { effectId: 'debuff_quarter', appliedTo: 'opponent', intensity: 8, duration: 4 },
        { effectId: 'buff_grace_momentum', appliedTo: 'self', intensity: 4, duration: 6 },
    ],
    specialMechanics: [
        { kind: 'sway', amount: 70 },
        { kind: 'rider', rider: { healHp: 30, cleanse: 3 } },
    ],
    addedIn: ADDED,
    tags: ['choir', 'apocrypha', 'late-game'],
};

/** THE APOCRYPHA — 12 Saint-rank cards, two per theme, in theme order. */
export const APOCRYPHA_CARDS: Card[] = [
    theFeastOfAllCorruption, theWholeBodyConfesses,
    theVeinCalledIn, theNoteFallsDue,
    nothingStaysBuried, theLastPageTornOut,
    nineNightsWithoutABreach, everyLadderBroken,
    theBenchDoesNotRetire, allObjectionsSustained,
    everyCoinInThePoorbox, theLongKyrie,
];
