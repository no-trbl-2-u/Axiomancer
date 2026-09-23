/**
 * VIGIL — THE COLD WATCH — THE BIG NUMBERS REWRITE (2026-09-02).
 *
 * The deck of walls and reprisal. Its axis is GUARD, BARRIER, THORNS, RIPOSTE
 * and FORETELL, and its payoff is the bloodless round: a night on which nothing
 * crossed the ice is a night the wall got paid.
 *
 * The design promise of the theme, in one line: THIS DECK'S 40 GUARD *IS* 40
 * DAMAGE BACK. The engine has no "deal damage equal to your Guard" verb, so the
 * conversion is printed literally — a vigil card's RIPOSTE number matches its
 * GUARD number, rank for rank, and the Saint capstone turns a 60-point wall into
 * a 60-point answer. `deal` appears on exactly ONE card here (`nothing-to-report`,
 * where the quiet night is the whole point); everything else kills by being hit.
 *
 * Seven ids carry existing art and lore forward (`frostbitten-palisade`,
 * `hoarfrost-teeth`, `nothing-crossed-the-ice`, `the-reprisal-bell`,
 * `the-besiegers-winter`, `every-stone-an-oath`, `caltrops-under-the-snow`) —
 * their names and descriptions are unchanged, their numbers are rewritten to
 * the new scale ladder. The other ten are new.
 *
 * Shape and voice copied from `src/Cards/library/starters.cards.ts`
 * (`plan/2026-09-02-card-authoring-brief.md` is the spec). This file is
 * data-only: all runtime behaviour lives in `src/Cards/card.engine.ts` and
 * `src/Combat/combat.engine.ts`.
 */

import type { Card } from '../types';

const ADDED = '2026-09-02';

// ─── ASH — the first two hours on the wall ───────────────────────────────────

const frostbittenPalisade: Card = {
    id: 'frostbitten-palisade',
    theme: 'vigil',
    name: 'Frostbitten Palisade',
    philosophicalAspect: 'body',
    description:
        'Stakes cut from the drowned orchard, sharpened in October, blessed ' +
        'with nothing. The frost volunteers the rest — it always does. Let ' +
        'them climb. The wall keeps what it catches.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'GUARD 10, then arm RIPOSTE 6 with parry 3.',
    // pts: guard 10 (2.5) + riposte 6 parry 3 (2.4) + FREE guard 4. The Ash
    // teacher for the whole theme: the wall and the answer on one face.
    free: { guard: 4 },
    specialMechanics: [
        { kind: 'guard', amount: 10 },
        { kind: 'riposte', damage: 6, reduce: 3 },
    ],
    addedIn: ADDED,
    tags: ['vigil', 'guard', 'riposte'],
};

const iceOnTheLadderRungs: Card = {
    id: 'ice-on-the-ladder-rungs',
    theme: 'vigil',
    name: 'Ice on the Ladder Rungs',
    philosophicalAspect: 'mind',
    description:
        'You do not have to fight a man on a ladder. You only have to have ' +
        'poured water down it at the third bell, and gone back inside, and ' +
        'let the cold do the trade you agreed to. He comes up once. He does ' +
        'not come up twice.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'GUARD 12. Inflict BLEED 4 for 3 turns.',
    // pts: guard 12 (3.0) + bleed i4 d3 + FREE guard 5 that persists. The wall
    // that bills the climber: vigil's borrowed BLEED, at Ash volume.
    free: { barrier: 5 },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 4, duration: 3 }],
    specialMechanics: [{ kind: 'guard', amount: 12 }],
    addedIn: ADDED,
    tags: ['vigil', 'guard', 'bleed'],
};

// ─── TOOTH — the wall learns what it is for ──────────────────────────────────

const hoarfrostTeeth: Card = {
    id: 'hoarfrost-teeth',
    theme: 'vigil',
    name: 'Hoarfrost Teeth',
    philosophicalAspect: 'body',
    description:
        'By the third night of the siege the rime stands out from the ' +
        'stones like a dog\'s hackles. No mason planned this. The wall has ' +
        'learned what it is for, and grown accordingly.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'GUARD 14. Gain THORNS 6 for 2 turns.',
    // pts: guard 14 (3.5) + thorns i6 d2 + FREE barrier 5. THORNS bites
    // through a full block, so the wall answers even on the turn it holds.
    free: { barrier: 5 },
    combatEffects: [{ effectId: 'buff_thorns', appliedTo: 'self', intensity: 6, duration: 2 }],
    specialMechanics: [{ kind: 'guard', amount: 14 }],
    addedIn: ADDED,
    tags: ['vigil', 'thorns'],
};

const theBellRope: Card = {
    id: 'the-bell-rope',
    theme: 'vigil',
    name: 'The Bell Rope',
    philosophicalAspect: 'heart',
    description:
        'Hemp, waxed, long enough that a small man can hang his whole weight ' +
        'from it. It is not the bell that answers. It is everyone who has ' +
        'ever heard the bell and remembers what it was rung for.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'GUARD 12, then arm RIPOSTE 12 with parry 4.',
    // pts: guard 12 (3.0) + riposte 12 parry 4 (4.8) + FREE guard 5. The first
    // card where the wall number and the answer number are the same number.
    free: { guard: 5 },
    specialMechanics: [
        { kind: 'guard', amount: 12 },
        { kind: 'riposte', damage: 12, reduce: 4 },
    ],
    addedIn: ADDED,
    tags: ['vigil', 'riposte'],
};

// ─── SPLINTER — the watch keeps a ledger ─────────────────────────────────────

const nothingCrossedTheIce: Card = {
    id: 'nothing-crossed-the-ice',
    theme: 'vigil',
    name: 'Nothing Crossed the Ice',
    philosophicalAspect: 'mind',
    description:
        'The sentry\'s ledger, fourth bell: no torches, no ladders, no ' +
        'sound but the lake settling under its lid. An empty page is still ' +
        'an entry. What did not come tonight is being saved for you — so ' +
        'read ahead.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'GUARD 16 (persists). FORETELL 3.',
    // pts: barrier 16 (4.0) + foretell 3 + bloodless-round [draw 2, 2 ◆] × 0.5
    // + FREE [barrier 6, foretell 1]. The theme's card-flow engine: a quiet
    // night pays in cards, and cards are what build the next quiet night.
    free: { barrier: 6, foretell: 1 },
    specialMechanics: [
        { kind: 'barrier', amount: 16 },
        { kind: 'foretell', count: 3 },
    ],
    synergy: {
        statePredicate: { kind: 'enemy-dealt-no-damage-last-round' },
        rider: { drawCards: 2, conviction: 2 },
    },
    addedIn: ADDED,
    tags: ['vigil', 'watch', 'card-flow'],
};

const answerAtThePostern: Card = {
    id: 'answer-at-the-postern',
    theme: 'vigil',
    name: 'Answer at the Postern',
    philosophicalAspect: 'body',
    description:
        'The little door nobody defends, because nobody defends it — that is ' +
        'the entire point of it. You go out through it while they are busy ' +
        'at the gate. You come back through it with less than you left ' +
        'with, and so do they.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'GUARD 20, then arm RIPOSTE 18 with parry 6.',
    // pts: guard 20 (5.0) + riposte 18 parry 6 (7.2) + drew-blood [12 back] ×
    // 0.5 + FREE guard 8. Reprisal at Splinter: the wall is already worth its
    // rank, and the foe's own last hit is what pays for the counter.
    free: { guard: 8 },
    specialMechanics: [
        { kind: 'guard', amount: 20 },
        { kind: 'riposte', damage: 18, reduce: 6 },
    ],
    synergy: {
        statePredicate: { kind: 'enemy-drew-blood' },
        rider: { damage: 12 },
    },
    addedIn: ADDED,
    tags: ['vigil', 'riposte', 'payoff'],
};

const theIceTakesItsTithe: Card = {
    id: 'the-ice-takes-its-tithe',
    theme: 'vigil',
    name: 'The Ice Takes Its Tithe',
    philosophicalAspect: 'heart',
    description:
        'Every parish under the lake keeps a curate, and the curate takes ' +
        'his portion of whatever walks over him. He does not ask for it. He ' +
        'is very cold and very patient, and he has never once been refused.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'GUARD 12. Gain THORNS 6 for 3 turns. Inflict BLEED 6 for 3 turns.',
    // pts: guard 12 (3.0) + thorns i6 d3 + bleed i6 d3 + FREE thorns i3 d2.
    // The bloodless-night card that still has a clock: THORNS and BLEED both
    // tick off the foe's own swings, so a wall turn is never a wasted turn.
    free: { applyEffect: { effectId: 'buff_thorns', intensity: 3, duration: 2, to: 'self' } },
    combatEffects: [
        { effectId: 'buff_thorns', appliedTo: 'self', intensity: 6, duration: 3 },
        { effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 6, duration: 3 },
    ],
    specialMechanics: [{ kind: 'guard', amount: 12 }],
    addedIn: ADDED,
    tags: ['vigil', 'thorns', 'bleed'],
};

const theEvenBell: Card = {
    id: 'the-even-bell',
    theme: 'vigil',
    name: 'The Even Bell',
    philosophicalAspect: 'mind',
    description:
        'The watch keeps its own arithmetic, and the bell answers to nobody ' +
        'but the number of the hour. Ring it on an odd count and it tolls ' +
        'flat and false. Ring it even, and the wall itself leans in to listen.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    paidSummary:
        'GUARD 18. EVENTIDE — with an even number of cards left in your draw pile, also gain THORNS 6 for 3 turns.',
    // pts: guard 18 (4.5) + eventide[thorns i6 d3] (13.5) × 0.5 condition
    // discount = 6.75 → paid ≈ 11.25. FREE thorns i3 d2 (4.5). A wall card
    // that pays out a real reprisal roughly every other draw, not on a
    // narrow turn-position window like AMBUSH/FLOW.
    free: { applyEffect: { effectId: 'buff_thorns', intensity: 3, duration: 2, to: 'self' } },
    specialMechanics: [{ kind: 'guard', amount: 18 }],
    synergy: {
        statePredicate: { kind: 'eventide' },
        rider: { applyEffect: { effectId: 'buff_thorns', intensity: 6, duration: 3, to: 'self' } },
    },
    addedIn: '2026-09-16',
    tags: ['vigil', 'thorns', 'eventide'],
};

// ─── RIB — the debt becomes collectible ──────────────────────────────────────

const theReprisalBell: Card = {
    id: 'the-reprisal-bell',
    theme: 'vigil',
    name: 'The Reprisal Bell',
    philosophicalAspect: 'heart',
    description:
        'It hangs green and untuned above the gatehouse and rings for one ' +
        'occasion only. Not for warning — warning is the watchman\'s work. ' +
        'It rings when your blood is on their hands, to tell the wall the ' +
        'debt is now collectible.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'GUARD 26, then arm RIPOSTE 24 with parry 8.',
    // pts: guard 26 (6.5) + riposte 24 parry 8 (9.6) + drew-blood [bleed i8 d3]
    // × 0.5 + FREE [barrier 10, thorns i4 d2]. The theme thesis at Rib: a
    // 26-point wall is a 24-point answer, and the bell collects the interest.
    free: {
        barrier: 10,
        applyEffect: { effectId: 'buff_thorns', intensity: 4, duration: 2, to: 'self' },
    },
    specialMechanics: [
        { kind: 'guard', amount: 26 },
        { kind: 'riposte', damage: 24, reduce: 8 },
    ],
    synergy: {
        statePredicate: { kind: 'enemy-drew-blood' },
        rider: { applyEffect: { effectId: 'debuff_bleed', intensity: 8, duration: 3, to: 'opponent' } },
    },
    addedIn: ADDED,
    tags: ['vigil', 'riposte', 'payoff'],
};

const nullaBona: Card = {
    id: 'nulla-bona',
    theme: 'vigil',
    name: 'Nulla Bona',
    philosophicalAspect: 'mind',
    description:
        'The sheriff\'s return on an empty house — nothing found, nothing ' +
        'seized, nothing owed to anyone living. The watch writes the same ' +
        'three words at the fourth bell of a quiet night. Nothing found is ' +
        'still a finding. File it.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'GUARD 22 (persists). FORETELL 3. Draw 2.',
    // pts: barrier 22 (5.5) + foretell 3 + draw 2 + bloodless-round [barrier
    // 12, 2 ◆] × 0.5 + FREE [barrier 8, foretell 1]. The engine card: a night
    // where nothing crossed compounds into the wall that makes the next one.
    free: { barrier: 8, foretell: 1 },
    specialMechanics: [
        { kind: 'barrier', amount: 22 },
        { kind: 'foretell', count: 3 },
        { kind: 'rider', rider: { drawCards: 2 } },
    ],
    synergy: {
        statePredicate: { kind: 'enemy-dealt-no-damage-last-round' },
        rider: { barrier: 12, conviction: 2 },
    },
    addedIn: ADDED,
    tags: ['vigil', 'barrier', 'watch', 'card-flow'],
};

const theHedgehog: Card = {
    id: 'the-hedgehog',
    theme: 'vigil',
    name: 'The Hedgehog',
    philosophicalAspect: 'body',
    description:
        'Stakes lashed in threes and planted at the height of a horse\'s ' +
        'chest, in the dark, by men who will not be there in the morning. It ' +
        'has no face and no name and it does not move. Ride at it and see.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'GUARD 24. Gain THORNS 12 for 3 turns.',
    // pts: guard 24 (6.0) + thorns i12 d3 + TOLL body 3 [thorns i6 d2] × 0.5 +
    // FREE guard 10. A body deck that has already spent three body dice has
    // built the field, and the field grows a second row of stakes.
    free: { guard: 10 },
    combatEffects: [{ effectId: 'buff_thorns', appliedTo: 'self', intensity: 12, duration: 3 }],
    specialMechanics: [{ kind: 'guard', amount: 24 }],
    threshold: {
        color: 'body',
        count: 3,
        rider: { applyEffect: { effectId: 'buff_thorns', intensity: 6, duration: 2, to: 'self' } },
    },
    addedIn: ADDED,
    tags: ['vigil', 'thorns', 'threshold'],
};

// ─── SKULL — winter arrives on the besiegers' side of the wall ───────────────

const theBesiegersWinter: Card = {
    id: 'the-besiegers-winter',
    theme: 'vigil',
    name: 'The Besieger\'s Winter',
    philosophicalAspect: 'mind',
    description:
        'They counted their grain in weeks. The wall counts in winters, and ' +
        'it is owed several. Every quiet night the frost moves one tent ' +
        'closer to their fires, and it does not knock.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'GUARD 30 (persists). Gain THORNS 15 for 3 turns. Inflict DOOM 8, ' +
        'growing +1 each time the foe acts.',
    // pts: barrier 30 (7.5) + thorns i15 d3 + doom i8 + bloodless-round [+6
    // intensity] × 0.5 + FREE [barrier 12, doom i3]. Winter itself is the
    // clock: the wall owns a kill timer even against a foe who refuses to
    // attack into THORNS.
    free: {
        barrier: 12,
        applyEffect: { effectId: 'debuff_creeping_doom', intensity: 3 },
    },
    combatEffects: [
        { effectId: 'buff_thorns', appliedTo: 'self', intensity: 15, duration: 3 },
        { effectId: 'debuff_creeping_doom', appliedTo: 'opponent', intensity: 8 },
    ],
    specialMechanics: [{ kind: 'barrier', amount: 30 }],
    synergy: {
        statePredicate: { kind: 'enemy-dealt-no-damage-last-round' },
        rider: { bonusIntensity: 6 },
    },
    addedIn: ADDED,
    tags: ['vigil', 'barrier', 'doom', 'payoff'],
};

const theSallyPort: Card = {
    id: 'the-sally-port',
    theme: 'vigil',
    name: 'The Sally Port',
    philosophicalAspect: 'heart',
    description:
        'The gate that opens outward, once a night, and only when the wall ' +
        'has taken enough to be certain. They spent a whole season getting ' +
        'this close to you. You spend one minute making the distance again.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'GUARD 36. Arm RIPOSTE 36 with parry 12. Gain THORNS 15 for 2 turns.',
    // pts: guard 36 (9.0) + riposte 36 parry 12 (14.4) + thorns i15 d2 +
    // drew-blood [20 back, FLAY 2] × 0.5 + FREE [guard 14, thorns i5 d2]. The
    // Skull statement of the promise: the wall number IS the answer number.
    free: {
        guard: 14,
        applyEffect: { effectId: 'buff_thorns', intensity: 5, duration: 2, to: 'self' },
    },
    combatEffects: [{ effectId: 'buff_thorns', appliedTo: 'self', intensity: 15, duration: 2 }],
    specialMechanics: [
        { kind: 'guard', amount: 36 },
        { kind: 'riposte', damage: 36, reduce: 12 },
    ],
    synergy: {
        statePredicate: { kind: 'enemy-drew-blood' },
        rider: { damage: 20, flay: 2 },
    },
    addedIn: ADDED,
    tags: ['vigil', 'riposte', 'thorns', 'payoff'],
};

const everyStoneAnOath: Card = {
    id: 'every-stone-an-oath',
    theme: 'vigil',
    name: 'Every Stone an Oath',
    philosophicalAspect: 'heart',
    persistentEffect:
        'At the end of each round in which the foe dealt you no damage, gain ' +
        'BARRIER 12 and THORNS 4 for 2 turns.',
    description:
        'The masons swore as they laid each course — not to any saint, but ' +
        'to the stone beneath it. A promise stacked on a promise, mortared ' +
        'with breath. Every bloodless night, the congregation grows by one.',
    tier: 2, rank: 5, cardType: 'oath',
    targetType: 'self',
    // pts: engine text — 12 BARRIER (the persisting wall — GUARD resets every
    // phase by definition, so "GUARD that persists" was a contradiction in
    // the game's own vocabulary; renamed to BARRIER, the actually-persisting
    // pool) and 4 THORNS per engineered quiet round. The theme's compounding
    // engine: the wall it builds is what makes the next round quiet, and the
    // THORNS is what makes the wall bite.
    addedIn: ADDED,
    tags: ['vigil', 'oath', 'engine'],
};

// ─── SAINT — the wall answers for everyone who laid it ───────────────────────

const theWallSpeaksLast: Card = {
    id: 'the-wall-speaks-last',
    theme: 'vigil',
    name: 'The Wall Speaks Last',
    philosophicalAspect: 'mind',
    description:
        'Every course of it was laid by someone who is dead now, and every ' +
        'one of them had an opinion. Stone holds its tongue through a whole ' +
        'siege, the way stone does. When it finally answers, it answers for ' +
        'all of them at once, and it does not stop to be understood.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'GUARD 60. Arm RIPOSTE 60 with parry 20. Gain THORNS 20 for 3 turns.',
    // pts: guard 60 (15.0) + riposte 60 parry 20 (24.0) + thorns i20 d3 +
    // bloodless-round [40 back, draw 2] × 0.5 + FREE [guard 22, thorns i8 d2].
    // THE capstone: a 60-point wall is a 60-point answer, printed as such,
    // and a quiet night hands you another 40 on top.
    free: {
        guard: 22,
        applyEffect: { effectId: 'buff_thorns', intensity: 8, duration: 2, to: 'self' },
    },
    combatEffects: [{ effectId: 'buff_thorns', appliedTo: 'self', intensity: 20, duration: 3 }],
    specialMechanics: [
        { kind: 'guard', amount: 60 },
        { kind: 'riposte', damage: 60, reduce: 20 },
    ],
    synergy: {
        statePredicate: { kind: 'enemy-dealt-no-damage-last-round' },
        rider: { damage: 40, drawCards: 2 },
    },
    addedIn: ADDED,
    tags: ['vigil', 'riposte', 'capstone'],
};

const nothingToReport: Card = {
    id: 'nothing-to-report',
    theme: 'vigil',
    name: 'Nothing to Report',
    philosophicalAspect: 'heart',
    description:
        'Three words at the foot of the page, in a hand that has finally ' +
        'stopped shaking. The night was quiet. The night was quiet because ' +
        'of what the watch did in it, and the ledger will never say so, and ' +
        'the ledger does not have to.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'GUARD 40 (persists). Gain THORNS 20 for 3 turns. Deal 24.',
    // pts: barrier 40 (10.0) + thorns i20 d3 + deal 24 (8.0) + bloodless-round
    // [60 back, draw 2, 4 ◆] × 0.5 + FREE [barrier 14, FORETELL 1]. The theme's
    // one `deal` card, and the only one: the printed 24 is the consolation, the
    // 60 for a night nobody crossed is the reason you built the wall.
    free: { barrier: 14, foretell: 1 },
    combatEffects: [{ effectId: 'buff_thorns', appliedTo: 'self', intensity: 20, duration: 3 }],
    specialMechanics: [
        { kind: 'barrier', amount: 40 },
        { kind: 'deal', amount: 24 },
    ],
    synergy: {
        statePredicate: { kind: 'enemy-dealt-no-damage-last-round' },
        rider: { damage: 60, drawCards: 2, conviction: 4 },
    },
    addedIn: ADDED,
    tags: ['vigil', 'barrier', 'payoff', 'capstone'],
};

const caltropsUnderTheSnow: Card = {
    id: 'caltrops-under-the-snow',
    theme: 'vigil',
    name: 'Caltrops Under the Snow',
    philosophicalAspect: 'body',
    persistentEffect:
        'Whenever the foe deals you damage it gains BLEED 8. Whenever your ' +
        'GUARD fully blocks its attack it takes 15 damage.',
    description:
        'Iron teeth sown before the first snowfall, in rows, like a crop. ' +
        'Whatever reaches you has already walked the field to do it. The ' +
        'snow hides them and keeps the tally, and the red comes up through ' +
        'the white like an early spring.',
    tier: 2, rank: 6, cardType: 'hex',
    targetType: 'enemy',
    // pts: engine text — the hex that closes the theme's loop from both ends.
    // Hit through the wall and you bleed; fail to get through the wall and you
    // bleed anyway. There is no line of play against it that costs nothing.
    addedIn: ADDED,
    tags: ['vigil', 'hex', 'reflect'],
};

/** VIGIL — the Cold Watch, in rank order. */
export const VIGIL_CARDS: Card[] = [
    frostbittenPalisade, iceOnTheLadderRungs,
    hoarfrostTeeth, theBellRope,
    nothingCrossedTheIce, answerAtThePostern, theIceTakesItsTithe, theEvenBell,
    theReprisalBell, nullaBona, theHedgehog,
    theBesiegersWinter, theSallyPort, everyStoneAnOath,
    theWallSpeaksLast, nothingToReport, caltropsUnderTheSnow,
];
