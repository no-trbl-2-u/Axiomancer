/**
 * THE RELIQUARY DICE — the three valve relics (THE BIG NUMBERS REWRITE,
 * 2026-09-02).
 *
 * One per aspect, seated across the campaign by `PRESET_DICE_VALVES`
 * (`src/Combat/combat.starter-deck-presets.ts`): body at Threadbare, mind at
 * Pilgrim, heart at Apostate. They are the Upgradeable-Dice valve seats,
 * so their identity is DICE, not damage — a valve fixes a dead tray, banks a
 * die, or mints one. That is why their numbers stayed modest while everything
 * else on the ladder grew: a relic that also hit for 30 would be played for
 * the 30 and the valve would never be the reason.
 *
 * Tagged `dice` + `valve`, which is how `isDiceValveCard` finds them.
 *
 * This file is data-only.
 */

import type { Card } from '../types';

const ADDED = '2026-09-02';

const knuckleboneRecant: Card = {
    id: 'knucklebone-recant',
    theme: 'trial',
    name: 'Knucklebone Recant',
    philosophicalAspect: 'body',
    description:
        'Testimony may be withdrawn. So may a bad cast. Sweep the bones off ' +
        'the table before they finish speaking, breathe your side of it ' +
        'across them, and throw again. They lie less the second time.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'Reroll every spent die in your tray. Gain 2 Conviction. Deal 6.',
    // pts: reroll_spent + 2 Conviction + a token hit, so the valve is never a
    // wasted play on a tray that did not need fixing. The honest
    // no-guarantee reroll — body's answer to a dead tray.
    free: { conviction: 1 },
    specialMechanics: [
        { kind: 'reroll_spent' },
        { kind: 'deal', amount: 6 },
        { kind: 'rider', rider: { conviction: 2 } },
    ],
    addedIn: ADDED,
    tags: ['trial', 'dice', 'valve'],
};

const ossuaryDrawer: Card = {
    id: 'ossuary-drawer',
    theme: 'grave',
    name: 'The Ossuary Drawer',
    philosophicalAspect: 'mind',
    description:
        'Each drawer bears a clerk\'s label: which knuckle, which saint, ' +
        'what the loan settled. File the bone back into the dark and let it ' +
        'ripen there. The dead keep immaculate accounts and charge almost ' +
        'nothing for storage.',
    tier: 1, rank: 3, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'Bank the powering die in your Reserve. PIP 2: every Reserve die ripens. FORETELL 2.',
    // pts: bank_spent_die + PIP 2 + FORETELL 2. The thrift valve: instead of
    // spending the die you file it, and everything filed ripens. PIP went
    // 1 → 2 with PIP_GUARD_BONUS, so a filed die is worth banking for.
    free: { pips: 1 },
    specialMechanics: [
        { kind: 'bank_spent_die' },
        { kind: 'grant_pip', count: 2 },
        { kind: 'rider', rider: { foretell: 2 } },
    ],
    addedIn: ADDED,
    tags: ['grave', 'dice', 'valve'],
};

const saintsFingerBone: Card = {
    id: 'saints-finger-bone',
    theme: 'choir',
    name: "The Saint's Finger-Bone",
    philosophicalAspect: 'heart',
    description:
        'The reliquary stands empty. The finger travels. Held loosely, it ' +
        'points — at the next verse, at the mended thing, at the door. The ' +
        'choir has never once said whose hand it was.',
    tier: 1, rank: 3, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'KINDLE a wild die (it joins your Reserve for this combat). Heal 12. Draw 1.',
    // pts: KINDLE wild + heal + a card. The abundance valve: a relic that
    // becomes a die, wild so it answers whichever prayer is short-handed.
    free: { conviction: 1, healHp: 5 },
    specialMechanics: [
        { kind: 'create_temporary_die', color: 'wild' },
        { kind: 'rider', rider: { healHp: 12, drawCards: 1 } },
    ],
    addedIn: ADDED,
    tags: ['choir', 'dice', 'valve'],
};

/** The three dice-valve relics, in campaign seating order. */
export const RELIC_CARDS: Card[] = [knuckleboneRecant, ossuaryDrawer, saintsFingerBone];
