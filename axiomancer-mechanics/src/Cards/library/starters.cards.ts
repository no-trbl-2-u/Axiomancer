/**
 * THE THREADBARE OFFICE + THE CURSES — THE BIG NUMBERS REWRITE (2026-09-02).
 *
 * The eight starters teach one archetype verb each at whisper volume, and the
 * five curses are what the world puts in your deck when you lose an exchange.
 *
 * This file is also the AUTHORING TEMPLATE for the six theme modules beside it
 * (`plan/2026-09-02-card-authoring-brief.md` is the spec). Every card here
 * shows the required shape: a FREE line worth playing without a die, a PAID
 * line whose printed numbers are exactly what the engine applies, a
 * `paidSummary` that names every one of those numbers, and a `// pts:` note
 * recording the intent (advisory since the rank bands were repealed).
 *
 * Ash-rank scale: a hit is 6-9, a wall is 8-12, POISON opens at 3, BLEED at 4,
 * a heal is 5. The starters sit at the bottom of that band on purpose — they
 * are the deck you are trying to grow out of.
 *
 * This file is data-only. All runtime behaviour lives in
 * `src/Cards/card.engine.ts` and `src/Combat/combat.engine.ts`.
 */

import type { Card } from '../types';

const ADDED = '2026-09-02';

// ─── THE THREADBARE OFFICE — the 8 starters (weak on purpose) ────────────────

const spoiledPoultice: Card = {
    id: 'spoiled-poultice',
    theme: 'rot',
    name: 'Spoiled Poultice',
    philosophicalAspect: 'body',
    description:
        'Bread mold and honey, bound in linen the way grandmother taught. It ' +
        'was meant to draw the sickness out — nobody wrote down which ' +
        'direction was out. Press it to their wound and count backward from ten.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 7. Inflict POISON 4 for 3 turns.',
    // pts: deal 7 (2.33) + poison i4 d3 + FREE poison i3 d2. The starter that
    // teaches the seed verb: it finally does something the turn you play it.
    free: { applyEffect: { effectId: 'debuff_poison', intensity: 3, duration: 2 } },
    specialMechanics: [{ kind: 'deal', amount: 7 }],
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 4, duration: 3 }],
    addedIn: ADDED,
    tags: ['rot', 'dot', 'starter'],
};

const chilblainWatch: Card = {
    id: 'chilblain-watch',
    theme: 'vigil',
    name: 'Chilblain Watch',
    philosophicalAspect: 'body',
    description:
        'Four hours on the wall with wet boots and no relief coming. The cold ' +
        'gets into the joints and stays there. You will not be warm again, ' +
        'but nothing came over the ice, and that is the whole of the job.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'GUARD 12. THORNS 4.',
    // pts: guard 12 (3.0) + thorns 4 + FREE guard 5. The wall starter: the
    // FREE line is a real wall at Ash scale, not a gesture at one.
    free: { guard: 5 },
    specialMechanics: [{ kind: 'guard', amount: 12 }],
    combatEffects: [{ effectId: 'buff_thorns', appliedTo: 'self', intensity: 4, duration: 2 }],
    addedIn: ADDED,
    tags: ['vigil', 'guard', 'starter'],
};

const firstSpadeful: Card = {
    id: 'first-spadeful',
    theme: 'grave',
    name: 'First Spadeful',
    philosophicalAspect: 'mind',
    description:
        'The soil comes up easy at the top and hard underneath, and the ' +
        'difference is where they stopped digging last time. You do not have ' +
        'to know what is down there to know that something is.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 6. RECALL 1.',
    // pts: deal 6 (2.0) + recall 1 + FREE mill 2. Teaches the loop: the FREE
    // line feeds the discard the PAID line reaches back into.
    free: { millCards: 2 },
    specialMechanics: [
        { kind: 'deal', amount: 6 },
        { kind: 'reprise', count: 1 },
    ],
    addedIn: ADDED,
    tags: ['grave', 'recall', 'starter'],
};

const pettyIndictment: Card = {
    id: 'petty-indictment',
    theme: 'trial',
    name: 'Petty Indictment',
    philosophicalAspect: 'mind',
    description:
        'A small charge, poorly drafted, filed by a clerk who has read the ' +
        'statute exactly once. It will not convict anyone. It goes in the ' +
        'record, and the record is patient.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 6. Gain 3 Charges. STAGGER 1.',
    // pts: deal 6 (2.0) + 3 charges (2.4) + stagger 1 (2.0) + FREE 2 charges.
    // Teaches the tally and the objection in one card.
    free: { premises: 2 },
    specialMechanics: [
        { kind: 'deal', amount: 6 },
        { kind: 'premise', count: 3 },
        { kind: 'stagger', rungs: 1 },
    ],
    addedIn: ADDED,
    tags: ['trial', 'charge', 'starter'],
};

const thinHymn: Card = {
    id: 'thin-hymn',
    theme: 'choir',
    name: 'Thin Hymn',
    philosophicalAspect: 'heart',
    description:
        'Two voices where there should be forty, in a nave built to swallow ' +
        'forty. It sounds like an apology. It is not one — nobody here is ' +
        'sorry. It is just what is left of the singing.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'PLEA 8. Heal 5.',
    // pts: plea 8 (7.2) + heal 5 (1.67) + FREE plea 3. Teaches the alt-win
    // currency; the heal is what keeps a heart deck standing while it argues.
    free: { sway: 3 },
    specialMechanics: [
        { kind: 'sway', amount: 8 },
        { kind: 'rider', rider: { healHp: 5 } },
    ],
    addedIn: ADDED,
    tags: ['choir', 'plea', 'starter'],
};

const thumbprickOath: Card = {
    id: 'thumbprick-oath',
    theme: 'debt',
    name: 'Thumbprick Oath',
    philosophicalAspect: 'heart',
    description:
        'A pin, a thumb, a smear on the page where a signature should be. ' +
        'Nobody reads it back to you. The terms were always going to be ' +
        'whatever they turn out to be.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 14. RECOIL 5.',
    // pts: deal 14 (4.67) - recoil 5 credit + FREE deal 4 / RECOIL 2. Teaches
    // the blood price: the best Ash hit in the office, and it bills you.
    free: { damage: 4, recoil: 2 },
    specialMechanics: [
        { kind: 'deal', amount: 14 },
        { kind: 'recoil', hp: 5 },
    ],
    addedIn: ADDED,
    tags: ['debt', 'recoil', 'starter'],
};

const grandmothersPsalter: Card = {
    id: 'grandmothers-psalter',
    theme: 'choir',
    name: "Grandmother's Psalter",
    philosophicalAspect: 'heart',
    description:
        'Her hand in the margins, arguing with the psalmist for sixty years. ' +
        'Half the annotations are recipes. The book has been read to pieces ' +
        'and rebound twice, and it is the only heirloom that survived.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'Heal 8. Draw 2. CLEANSE 1.',
    // pts: heal 8 (2.67) + draw 2 (4.0) + cleanse 1 (1.5) + FREE draw 1. The
    // heirloom: no damage at all, and it is still the card you keep.
    free: { drawCards: 1 },
    specialMechanics: [{ kind: 'rider', rider: { healHp: 8, drawCards: 2, cleanse: 1 } }],
    addedIn: ADDED,
    tags: ['choir', 'heirloom', 'starter'],
};

const threadbareCope: Card = {
    id: 'threadbare-cope',
    theme: 'vigil',
    name: 'Threadbare Cope',
    philosophicalAspect: 'mind',
    description:
        'The good vestment, if you do not look at the hem, or the shoulders, ' +
        'or the place where the orphrey was cut away and sold. Worn for ' +
        'funerals only, which is most days now.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'GUARD 8 (persists). FORETELL 2.',
    // pts: barrier 8 (2.67) + foretell 2 (2.0) + FREE guard 4. Teaches the
    // persistent wall and the look-ahead in the same breath.
    free: { guard: 4 },
    specialMechanics: [
        { kind: 'barrier', amount: 8 },
        { kind: 'foretell', count: 2 },
    ],
    addedIn: ADDED,
    tags: ['vigil', 'barrier', 'starter'],
};

// ─── THE CURSES — what the world puts in your deck ───────────────────────────
// Rank 1, theme `curse`, PAID line is PURGE (buy the deck clean for a die and
// a tempo beat). The FREE line is always a real cost: a curse you can play for
// nothing still bills you for it.

function curse(
    id: string,
    name: string,
    aspect: Card['philosophicalAspect'],
    description: string,
    free: Card['free'],
    freeText: string,
): Card {
    return {
        id,
        theme: 'curse',
        name,
        philosophicalAspect: aspect,
        description,
        tier: 1, rank: 1, cardType: 'spell',
        targetType: 'self',
        paidSummary: `PURGE this card from the fight. ${freeText}`,
        // pts: deliberately worthless — a curse is a tax on your draws, and
        // the PAID line is the receipt for removing it.
        free,
        specialMechanics: [{ kind: 'purge_self' }],
        // A curse's two lines are asymmetric BY DESIGN: the FREE line is the
        // whole card (a cost you eat to cycle it) and the PAID line only buys
        // it out of the deck. Nothing about that split is a balance defect.
        intentionallyAsymmetric: true,
        addedIn: ADDED,
        tags: ['curse'],
    };
}

const mouthfulOfBrine: Card = curse(
    'mouthful-of-brine', 'Mouthful of Brine', 'body',
    'Salt water where the air should be. It does not drown you. It just ' +
    'keeps being there, at the back of every breath, for the rest of the fight.',
    { recoil: 3 },
    'Its FREE line costs you 3 VITAE.',
);

const gnawMarks: Card = curse(
    'gnaw-marks', 'Gnaw Marks', 'body',
    'Something has been at you while you were busy. The marks are small and ' +
    'very even, and they go all the way around.',
    { applyEffect: { effectId: 'debuff_bleed', intensity: 3, duration: 2, to: 'self' } },
    'Its FREE line bleeds you for 3.',
);

const arrears: Card = curse(
    'arrears', 'Arrears', 'mind',
    'The sum was small when it was first written down. It has had time, and ' +
    'time is the only thing the ledger has ever needed.',
    { recoil: 2, millCards: 2 },
    'Its FREE line costs you 2 VITAE and mills 2.',
);

const overheardName: Card = curse(
    'overheard-name', 'Overheard Name', 'heart',
    'You heard it said once, in a room you were not in, and now it is yours ' +
    'to carry. Nobody will tell you whose it was.',
    { applyEffect: { effectId: 'debuff_creeping_doom', intensity: 2, to: 'self' } },
    'Its FREE line puts DOOM 2 on you.',
);

/**
 * THE WOUND — the payload of the enemy keyword WOUNDING (Mage Knight's wounds
 * as deck pollution). A hard enough unguarded blow shoves one of these into
 * your draw pile; it is the reason "block it or eat it" has a cost that
 * outlives the phase. `WOUND_CARD_ID` in `combat.engine.ts` points here.
 */
const theWound: Card = curse(
    'the-wound', 'The Wound', 'body',
    'Not a metaphor. Not a lesson. A hole in you that was not there this ' +
    'morning, shuffled in among your good intentions.',
    { recoil: 2 },
    'Its FREE line costs you 2 VITAE.',
);

// ── Phase 104 — THE GREY OFFICE ───────────────────────────────────────────────
// The deck every new run opens with: two shapes, ten copies, no colour. A
// grey card (`philosophicalAspect: 'any'`) is powered by ANY die, so fight
// one teaches STRIKE, WARD, FREE-vs-PAID and the die spend with zero colour
// arithmetic. Both are priced UNDER the starter curve on purpose — like the
// Threadbare Office, they exist to be outgrown and cut. Theme `'grey'` keeps
// them out of the reward pool and out of every deck's theme tally.

const GREY_ADDED = '2026-09-20';

const greyStrike: Card = {
    id: 'grey-strike',
    theme: 'grey',
    name: 'A Plain Blow',
    philosophicalAspect: 'any',
    description:
        'No form to it, no name for it. A fist, a stone, the flat of whatever ' +
        'you were holding. It is the first thing anybody learns and the last ' +
        'thing anybody forgets.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 5.',
    // pts: deal 5 (1.67) + FREE deal 2. Deliberately under the Ash curve.
    free: { damage: 2 },
    specialMechanics: [{ kind: 'deal', amount: 5 }],
    addedIn: GREY_ADDED,
    tags: ['grey', 'damage', 'starter'],
};

const greyWard: Card = {
    id: 'grey-ward',
    theme: 'grey',
    name: 'A Plain Ward',
    philosophicalAspect: 'any',
    description:
        'An arm up. A step back. The oldest prayer there is, and the only one ' +
        'that has never once gone unanswered — for a moment.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'GUARD 5.',
    // pts: guard 5 (1.25) + FREE guard 2. Deliberately under the Ash curve.
    free: { guard: 2 },
    specialMechanics: [{ kind: 'guard', amount: 5 }],
    addedIn: GREY_ADDED,
    tags: ['grey', 'guard', 'starter'],
};

/** Phase 104 — the two grey shapes. Seated 7 STRIKE / 3 WARD by
 *  `STARTING_CARD_IDS` (`Combat/combat.rewards.ts`). */
export const GREY_OFFICE_CARDS: Card[] = [greyStrike, greyWard];

/** The eight starters, in Threadbare seating order. */
export const STARTER_CARDS: Card[] = [
    spoiledPoultice, chilblainWatch, firstSpadeful, pettyIndictment,
    thinHymn, thumbprickOath, grandmothersPsalter, threadbareCope,
];

/** The enemy-injected curses, including WOUNDING's payload. */
export const CURSE_CARDS: Card[] = [
    mouthfulOfBrine, gnawMarks, arrears, overheardName, theWound,
];
