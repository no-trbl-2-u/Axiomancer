/**
 * THE PROFANE CANON — the dark-fantasy PvE card library (2026-08-08 rework).
 *
 * Solo, dark-fantasy, PvE: Magic the Gathering reimagined as a single-player
 * campaign against the world. 57 unique cards: 8 starters (the deliberately
 * weak Threadbare Office), 3 dice-valve relics, 4 enemy-injected curses, and
 * six archetype packages of 7 (2 common spells, 2 uncommon spells, 1 rare
 * spell, 1 enchantment, 1 disenchant):
 *
 *   rot   — the Blight: plant POISON/BLEED/MARK, PROLONG and FESTER them,
 *           detonate with RUPTURE, drink it back with SIPHON.
 *   debt  — the Reckoning: power bought in blood — RECOIL, chosen-X prices,
 *           FALLEN payoffs, fate lines, DOOM as compound interest.
 *   grave — the Exhumation: MILL yourself, RECALL and REPLAY the dead,
 *           REQUIEM gates, IMMOLATE the unworthy.
 *   vigil — the Cold Watch: GUARD/BARRIER walls, THORNS and RIPOSTE, payoffs
 *           for bloodless nights; winter itself as the clock.
 *   trial — the Indictment: CHARGE toward the declared verdict (CONDEMN
 *           alt-win), STAGGER objections, BACKFIRE contempt, MARK as evidence.
 *   choir — the Pale Choir: PLEA toward RELENT, QUARTER, SOULs harvested
 *           from expiring afflictions, REAP to spend the collection.
 *
 * Direct damage is legal (the 2026-08-08 unshackling retired the earlier
 * raw-HP-damage ban): cards may deal raw HP damage, plant DoT (poison /
 * bleed / mark), or both — Enemy HP falls to any authored mix of strikes,
 * DoT ticks, affliction payoffs (RUPTURE/REAP/ruptureMarks), engine drips
 * (BACKFIRE, persistent hooks), and reflect (THORNS/RIPOSTE). Conviction,
 * Surge, and the dice system remain the three locked systems the
 * retirement does not touch.
 *
 * The campaign model (the rework's spine): the player STARTS with the weak
 * 18-card Threadbare Office, earns reward cards after encounters, and REMOVES
 * starters at removal encounters — the three presets in
 * `combat.starter-deck-presets.ts` are snapshots of that one deck evolving
 * (18 → 30 → 45, hard cap 50).
 *
 * DOOM prints without a duration: `debuff_creeping_doom` carries no calendar
 * (it grows +1 intensity each time the foe acts, and ends only by consumption
 * or combat end), so a printed turn-count would be a lie (P0-truth law).
 *
 * Every SPELL ships its pricing arithmetic in a `// pts:` comment; the lint
 * (`cards.pricing.ts` + `src/Cards/e2e/pricing.engine.test.ts`) asserts each
 * lands in its rank band (common 1.5-7.5 · uncommon 4.5-13 · rare 7-19).
 * CURSE cards are deliberately worthless and exempt.
 *
 * The pre-rework 86-card themed library (spec 32 v3, ten themes) is retired
 * to git history — no rescues (the same owner rule that retired the pre-v3
 * 49-card library before it).
 *
 * This file is data-only. All runtime behaviour lives in
 * `src/Cards/card.engine.ts` and `src/Combat/combat.engine.ts`.
 */

import { Card } from './types';
import { bindSandboxLibraryGuard, getSandboxCard } from './cards.sandbox';
import { getHauntById } from './cards.haunts';
import { getAllyById } from './cards.allies';

// ─── THE THREADBARE OFFICE — the 8 starters (weak on purpose) ────────────────
// Six teach one archetype verb each at whisper volume; the heirloom stays
// worth keeping all campaign; the cope is the cantrip a removal encounter
// exists for. All rank 1 but the heirloom — IMMOLATE fuel by construction.

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
    paidSummary: 'Inflict POISON 1 (ticks each card you play, 2 turns).',
    // pts: poison i1 d2 (card-played clock, lifetime ~7.3 HP, tempo ÷3 ≈ 2.1)
    // + FREE MARK i1 d1 (0.75) ≈ 2.85 → Doxa. Deliberately weak: the 2-turn
    // poison dies before it ramps — teaches the seed verb, begs for removal.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 } },
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    addedIn: '2026-08-08',
    tags: ['rot', 'dot', 'starter'],
};

const thumbprickOath: Card = {
    id: 'thumbprick-oath',
    theme: 'debt',
    name: 'Thumbprick Oath',
    philosophicalAspect: 'heart',
    description:
        'Press your thumb to the pin, then to the paper. The Office honors ' +
        'any signature, provided it is red. What you borrow today is small; ' +
        'so is a hook.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'RECOIL 1. DRAW 1 and gain 1 Conviction.',
    // pts: DRAW 1 (2) + 1 Conviction (1) − RECOIL 1 credit (~0.25) = 2.75
    // + FREE 1 Conviction (1.0) ≈ 3.75 → Doxa. The Dark Confidant seed at its
    // weakest honest ratio: 1 blood for 1 card, every time — the clunk IS the
    // lesson.
    free: { conviction: 1 },
    specialMechanics: [
        { kind: 'recoil', hp: 1 },
        { kind: 'rider', rider: { drawCards: 1, conviction: 1 } },
    ],
    addedIn: '2026-08-08',
    tags: ['debt', 'starter'],
};

const firstSpadeful: Card = {
    id: 'first-spadeful',
    theme: 'grave',
    name: 'First Spadeful',
    philosophicalAspect: 'mind',
    description:
        'Every exhumation begins politely: one spade of earth, set aside ' +
        'like a hat at a funeral. The dead are patient — that is the whole ' +
        'of their doctrine. Dig, and see what they were keeping.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'MILL 2. FORETELL 1.',
    // pts: MILL 2 (2) + FORETELL 1 (1) = 3.0 + FREE MILL 1 (1.0) ≈ 4.0 →
    // Doxa. In a starter deck with no RECALL/REQUIEM payoffs yet, milling is
    // nearly a blank — the verb is taught; the payoff must be earned.
    free: { millCards: 1 },
    specialMechanics: [{ kind: 'rider', rider: { millCards: 2, foretell: 1 } }],
    addedIn: '2026-08-08',
    tags: ['grave', 'mill', 'starter'],
};

const chilblainWatch: Card = {
    id: 'chilblain-watch',
    theme: 'vigil',
    name: 'Chilblain Watch',
    philosophicalAspect: 'body',
    description:
        'The wall was here before the parish and will outlast the ' +
        'parishioners keeping it. Stand your hours in boots that froze stiff ' +
        'on Tuesday. The cold gets into the knuckles; the knuckles learn to ' +
        'answer back.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'GUARD 6. Gain THORNS 1 for 2 turns.',
    // pts: GUARD 6 (1.5) + THORNS i1 d2 (1.5) = 3.0 + FREE GUARD 4 (1.0)
    // ≈ 4.0 → Doxa. A small wall with one thorn in it — the wall-is-a-weapon
    // idea at whisper volume.
    free: { guard: 4 },
    combatEffects: [{ effectId: 'buff_thorns', appliedTo: 'self', intensity: 1, duration: 2 }],
    specialMechanics: [{ kind: 'guard', amount: 6 }],
    addedIn: '2026-08-08',
    tags: ['vigil', 'defense', 'starter'],
};

const pettyIndictment: Card = {
    id: 'petty-indictment',
    theme: 'trial',
    name: 'Petty Indictment',
    philosophicalAspect: 'mind',
    description:
        'Loitering with intent to exist. The charge will not hold — it does ' +
        'not need to hold. It needs a file, a name on the file, and a drawer ' +
        'that never quite closes.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Apply MARK 1 for 2 turns. Gain 1 CHARGE.',
    // pts: MARK i1 d2 (1.5) + 1 CHARGE (0.8) = 2.3 + FREE 1 CHARGE (0.8)
    // ≈ 3.1 → Doxa. One premise a play against an 8-premise CONDEMN is
    // glacial — the tally verb taught at a pace that makes the player crave
    // real prosecution cards.
    free: { premises: 1 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    specialMechanics: [{ kind: 'premise', count: 1 }],
    addedIn: '2026-08-08',
    tags: ['trial', 'starter'],
};

const thinHymn: Card = {
    id: 'thin-hymn',
    theme: 'choir',
    name: 'Thin Hymn',
    philosophicalAspect: 'heart',
    description:
        'One verse, half-remembered, sung alone in a room built for forty ' +
        'voices. It barely carries. But even a thin hymn tells the listener ' +
        'a choir exists, and that it knows their name.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'PLEA 3.',
    // pts: PLEA 3 (2.7) + FREE PLEA 1 (0.9) ≈ 3.6 → Doxa. PLEA decays
    // 1/turn, so a lone 3-stack mostly evaporates — teaches the RELENT
    // currency and why it needs a chorus behind it.
    free: { sway: 1 },
    specialMechanics: [{ kind: 'sway', amount: 3 }],
    addedIn: '2026-08-08',
    tags: ['choir', 'plea', 'starter'],
};

const grandmothersPsalter: Card = {
    id: 'grandmothers-psalter',
    theme: 'choir',
    name: "Grandmother's Psalter",
    philosophicalAspect: 'mind',
    description:
        'The margins are full of a dead woman\'s corrections, doctrine ' +
        'amended in a hand that never doubted. It opens to the page you ' +
        'need. In forty years it has not once opened to the page you wanted.',
    tier: 1, rank: 5, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'DRAW 2. CLEANSE 1.',
    // pts: DRAW 2 (4) + CLEANSE 1 (1.5) = 5.5 + FREE FORETELL 1 (1) + 1
    // Conviction (1) ≈ 7.5 → Axiom, priced AT the floor by design. The
    // heirloom law: universal verbs only, zero conditions, modest numbers —
    // always worth a slot, never worth building around.
    free: { foretell: 1, conviction: 1 },
    specialMechanics: [{ kind: 'rider', rider: { drawCards: 2, cleanse: 1 } }],
    addedIn: '2026-08-08',
    tags: ['choir', 'heirloom', 'utility', 'starter'],
};

const threadbareCope: Card = {
    id: 'threadbare-cope',
    theme: 'vigil',
    name: 'Threadbare Cope',
    // Recolored body→heart at synthesis (marked recolorable by design) — the
    // preset color law wants a third heart card in the Threadbare Office.
    philosophicalAspect: 'heart',
    description:
        'A processional cloak three funerals old, wool worn thin as an ' +
        'excuse at the shoulders. It keeps off some of the weather. It keeps ' +
        'off none of what the weather is for.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'GUARD 4. DRAW 1.',
    // pts: GUARD 4 (1.0) + DRAW 1 (2) = 3.0 + FREE GUARD 4 (1.0) ≈ 4.0 →
    // Doxa. Cantrip-plus-cloak: never dead, never exciting — the exact card
    // a removal encounter exists for.
    free: { guard: 4 },
    specialMechanics: [{ kind: 'guard', amount: 4 }, { kind: 'rider', rider: { drawCards: 1 } }],
    addedIn: '2026-08-08',
    tags: ['vigil', 'utility', 'starter'],
};

// ─── THE RELIQUARY DICE — three valve relics (one per aspect) ────────────────
// Dice-interaction spells for the D8 valve seats: the flag-on deck swaps one
// same-aspect starter instance for its valve. Conviction, Surge, and the dice
// system are untouched — these cards merely speak the existing die verbs.

const knuckleboneRecant: Card = {
    id: 'knucklebone-recant',
    theme: 'trial',
    name: 'Knucklebone Recant',
    philosophicalAspect: 'body',
    description:
        'Testimony may be withdrawn; so may a bad cast. Sweep the bones off ' +
        'the table before they finish speaking, breathe your side of it ' +
        'across them, and throw again. They lie less the second time.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'Reroll every spent die in your tray. Gain 1 Conviction.',
    // pts: reroll_spent (2) + 1 Conviction (1) = 3.0 + FREE 1 Conviction
    // (1.0) ≈ 4.0 → Lemma. The honest no-guarantee reroll valve for the
    // miss-heavy pool — body's answer to a dead tray.
    free: { conviction: 1 },
    specialMechanics: [{ kind: 'reroll_spent' }, { kind: 'rider', rider: { conviction: 1 } }],
    addedIn: '2026-08-08',
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
    paidSummary: 'Bank the powering die in your Reserve. PIP 1: every Reserve die ripens. FORETELL 1.',
    // pts: bank_spent_die (2) + PIP 1 (1.5) + FORETELL 1 (1) = 4.5 + FREE
    // PIP 1 (1.5) ≈ 6.0 → Thesis. The thrift valve: instead of spending the
    // die you file it, and everything filed ripens.
    free: { pips: 1 },
    specialMechanics: [
        { kind: 'bank_spent_die' },
        { kind: 'grant_pip', count: 1 },
        { kind: 'rider', rider: { foretell: 1 } },
    ],
    addedIn: '2026-08-08',
    tags: ['grave', 'dice', 'valve'],
};

const saintsFingerBone: Card = {
    id: 'saints-finger-bone',
    theme: 'choir',
    name: "The Saint's Finger-Bone",
    philosophicalAspect: 'heart',
    description:
        'The reliquary stands empty; the finger travels. Held loosely, it ' +
        'points — at the next verse, at the mended thing, at the door. The ' +
        'choir has never once said whose hand it was.',
    tier: 1, rank: 3, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'KINDLE a wild die (it joins your Reserve for this combat). HEAL 3.',
    // pts: KINDLE (2.5) + wild premium (0.5) + HEAL 3 (1) = 4.0 + FREE 1
    // Conviction (1) + HEAL 3 (1) ≈ 6.0 → Thesis. The abundance valve: a
    // relic that becomes a die, wild so it answers whichever prayer is
    // short-handed.
    free: { conviction: 1, healHp: 3 },
    specialMechanics: [
        { kind: 'create_temporary_die', color: 'wild' },
        { kind: 'rider', rider: { healHp: 3 } },
    ],
    addedIn: '2026-08-08',
    tags: ['choir', 'dice', 'valve'],
};

// ─── THE CURSES — enemy-injected junk (deck contamination) ───────────────────
// Shuffled into the player's COMBAT deck by enemy curse-injector cards (the
// StS/Arkham attack vector). PAID = PURGE (the card exiles itself — a die and
// a tempo beat buy the deck clean); FREE = a small self-harm. Worthless by
// design: rank 1, exempt from the pricing lint, and the first thing IMMOLATE
// burns (curses are pyre fuel — the player's other answer).

const mouthfulOfBrine: Card = {
    id: 'mouthful-of-brine',
    theme: 'curse',
    name: 'Mouthful of Brine',
    philosophicalAspect: 'body',
    description:
        'You shipped water at the crossing, and the parish logs that as a ' +
        'baptism. It sits cold at the top of your lungs, patient as tide. ' +
        'Spit it out on consecrated ground, or carry it down with you.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'PURGE this curse (it leaves the fight entirely).',
    // pts: curse — unpriced by design (exempt from the band lint).
    free: { recoil: 1 },
    specialMechanics: [{ kind: 'purge_self' }],
    intentionallyAsymmetric: true,
    addedIn: '2026-08-08',
    tags: ['curse', 'drowned-parish'],
};

const gnawMarks: Card = {
    id: 'gnaw-marks',
    theme: 'curse',
    name: 'Gnaw-Marks',
    philosophicalAspect: 'heart',
    description:
        'Their courtesy ends where the reach begins, and the reach extends ' +
        'to your baggage. Little crescents in the strap, the crust, the ' +
        'candle, the page you had not read yet. Always the page you had not ' +
        'read yet.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'PURGE this curse (it leaves the fight entirely).',
    // pts: curse — unpriced by design. Its MILL self-harm is mildly kind to a
    // grave deck (the dredge joke is intentional — the pyre eats curses
    // gladly, and so does the congregation).
    free: { millCards: 1 },
    specialMechanics: [{ kind: 'purge_self' }],
    intentionallyAsymmetric: true,
    addedIn: '2026-08-08',
    tags: ['curse', 'gnawing-court'],
};

const arrears: Card = {
    id: 'arrears',
    theme: 'curse',
    name: 'Arrears',
    philosophicalAspect: 'mind',
    description:
        'You signed nothing; the Office disagrees, and the Office retains ' +
        'the original. Interest accrues nightly, compounding at dusk. ' +
        'Payment is accepted in the only currency you reliably carry.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'PURGE this curse (it leaves the fight entirely).',
    // pts: curse — unpriced by design.
    free: { recoil: 1 },
    specialMechanics: [{ kind: 'purge_self' }],
    intentionallyAsymmetric: true,
    addedIn: '2026-08-08',
    tags: ['curse', 'debt-office'],
};

const overheardName: Card = {
    id: 'overheard-name',
    theme: 'curse',
    name: 'The Overheard Name',
    philosophicalAspect: 'heart',
    description:
        'Between the third knock and the fourth, a voice pronounced a name ' +
        'correctly, and the name was yours. Nobody pronounces it correctly. ' +
        'Un-hearing it is the expensive part.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'PURGE this curse (it leaves the fight entirely).',
    // pts: curse — unpriced by design.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' } },
    specialMechanics: [{ kind: 'purge_self' }],
    intentionallyAsymmetric: true,
    addedIn: '2026-08-08',
    tags: ['curse', 'omen-choir'],
};

// ─── ROT — The Blight (contagion liturgy) ────────────────────────────────────

const unctionOfBoils: Card = {
    id: 'unction-of-boils',
    theme: 'rot',
    name: 'Unction of Boils',
    philosophicalAspect: 'body',
    description:
        'The chrism went rancid a century back, and the parish anoints with ' +
        'it anyway. Thumb to brow, brow to blister, blister to the blood ' +
        'beneath. Be patient: the blessing takes.',
    tier: 2, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Inflict POISON 1 (ticks each card you play, 4 turns).',
    // pts: poison i1 d4 (ramp 4,4,6,6; tempo-weighted 12.91 ÷ 3 ≈ 4.30) +
    // FREE MARK i1 d2 (1.5) ≈ 5.8 → Doxa.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } },
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 4 }],
    addedIn: '2026-08-08',
    tags: ['rot', 'dot', 'seed'],
};

const theSextonsBell: Card = {
    id: 'the-sextons-bell',
    theme: 'rot',
    name: "The Sexton's Bell",
    philosophicalAspect: 'heart',
    description:
        'The sexton rings once for the dying and twice for the dead, and ' +
        'for you he has not stopped ringing. Every toll lands heavier than ' +
        'the last. The grave was dug on the first stroke; the rest is ' +
        'paperwork.',
    tier: 2, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Afflict with BLEED 2 (ticks each hit they take, 2 turns) and DOOM 1 (grows +1 each time the foe acts).',
    // pts: bleed i2 d2 (front-loaded, decays 1/trigger ≈ 3.0) + DOOM i1
    // (no-calendar, 4-round pricing horizon ≈ 2.0) + FREE tickAllDots (1.5)
    // ≈ 6.5 → Lemma.
    free: { tickAllDots: true },
    combatEffects: [
        { effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 2 },
        { effectId: 'debuff_creeping_doom', appliedTo: 'opponent', intensity: 1 },
    ],
    addedIn: '2026-08-08',
    tags: ['rot', 'dot', 'doom', 'seed'],
};

const theLongLent: Card = {
    id: 'the-long-lent',
    theme: 'rot',
    name: 'The Long Lent',
    philosophicalAspect: 'mind',
    description:
        'Forty days, says the canon. But nowhere does it say the fast ends ' +
        'when the forty are spent — only that the flesh must keep giving ' +
        'things up. Your wounds observe the season.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'PROLONG every DoT on the foe by 1 turn.',
    // pts: PROLONG +1 turn across ~3 live DoTs (5.5) + threshold MIND×3:
    // tickAllDots (1.5 × 0.5 = 0.75) + FREE poison i1 d2 (2.1) ≈ 8.35 →
    // Thesis.
    free: { applyEffect: { effectId: 'debuff_poison', intensity: 1, duration: 2 } },
    specialMechanics: [{ kind: 'extend_dots', turns: 1 }],
    threshold: { color: 'mind', count: 3, rider: { tickAllDots: true } },
    addedIn: '2026-08-08',
    tags: ['rot', 'glue', 'prolong'],
};

const gangreneGospel: Card = {
    id: 'gangrene-gospel',
    theme: 'rot',
    name: 'Gangrene Gospel',
    philosophicalAspect: 'body',
    description:
        'The good news travels limb to limb, and every limb believes. What ' +
        'the flesh receives, the flesh must preach onward. By the third ' +
        'sermon there is nothing left to convert.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Apply DOOM 1 (grows +1 each time the foe acts), then FESTER 1: every DoT on the foe gains +1 intensity.',
    // pts: FESTER +1 across ~3 live DoTs (5.0) + DOOM i1 (2.0) + dieBonus
    // match: tickAllDots (1.5 × 0.6 = 0.9) + FREE MARK i1 d4 (3.0) ≈ 10.9 →
    // Theorem. Engine order (combatEffects before mechanics) means the fresh
    // DOOM is immediately festered — the face prints in that order.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 4 } },
    combatEffects: [{ effectId: 'debuff_creeping_doom', appliedTo: 'opponent', intensity: 1 }],
    specialMechanics: [{ kind: 'boost_all_dots', intensity: 1 }],
    dieBonus: { onColor: 'match', rider: { tickAllDots: true } },
    addedIn: '2026-08-08',
    tags: ['rot', 'glue', 'fester', 'doom'],
};

const communionOfTheWorm: Card = {
    id: 'communion-of-the-worm',
    theme: 'rot',
    name: 'Communion of the Worm',
    philosophicalAspect: 'heart',
    description:
        'Take, eat: this is the body, broken open for the worm. Drink: it ' +
        'is still warm. The congregation of rot says grace, and you are ' +
        'seated at the head of the table.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'RUPTURE ALL: consume every affliction on the foe and detonate. SIPHON 50% of the RUPTURE damage.',
    // pts: RUPTURE (4 + expected fuel 8 = 12) + SIPHON 50% (2.0) + FREE
    // replant poison i1 d4 (4.30) + TICK (0.6) ≈ 18.9 → Axiom, deliberately
    // top-of-band — the theme's single detonation (resonance-detonation
    // precedent). The FREE line is the replant: dieless turns rebuild fuel
    // after a detonation wipes the board.
    free: { applyEffect: { effectId: 'debuff_poison', intensity: 1, duration: 4 }, tickOne: true },
    specialMechanics: [
        { kind: 'rupture' },
        { kind: 'siphon', pct: 0.5 },
    ],
    addedIn: '2026-08-08',
    tags: ['rot', 'payoff', 'siphon'],
};

const theUntendedGarden: Card = {
    id: 'the-untended-garden',
    theme: 'rot',
    name: 'The Untended Garden',
    philosophicalAspect: 'mind',
    persistentEffect:
        'At the end of each round, FESTER 1: every DoT on the foe gains +1 intensity.',
    description:
        'No shears, no salt, no gardener — only what the ground wanted all ' +
        'along. Each night the roots go one ring deeper. Nothing planted ' +
        'here has ever asked permission.',
    tier: 2, rank: 5, cardType: 'oath',
    targetType: 'self',
    // pts: engine text — a standing end-of-round FESTER ≈ boost_all_dots 5.0
    // × ~3 remaining rounds ≈ 15-equivalent → Axiom.
    addedIn: '2026-08-08',
    tags: ['rot', 'oath'],
};

const edictOfTheOpenWound: Card = {
    id: 'edict-of-the-open-wound',
    theme: 'rot',
    name: 'Edict of the Open Wound',
    philosophicalAspect: 'body',
    persistentEffect:
        'The foe\'s wounds refuse to close: its POISON, BLEED and DOOM no longer lose duration, and its HEAL fails.',
    description:
        'By order of the parish that buried its last surgeon: let nothing ' +
        'close. The scab is annulled, the salve confiscated, the prayer for ' +
        'mending struck from the book. The wound stays open for inspection.',
    tier: 2, rank: 6, cardType: 'hex',
    targetType: 'enemy',
    // pts: engine text — freezes the enemy-side DoT calendar (a standing
    // PROLONG every round) and denies the enemy's heal riders → Aporia.
    // BLEED's per-trigger intensity decay survives (decay is not calendar).
    addedIn: '2026-08-08',
    tags: ['rot', 'hex'],
};

// ─── DEBT — The Reckoning (power bought in blood) ────────────────────────────

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
    paidSummary: 'RECOIL 3, then DRAW 2.',
    // pts: DRAW 2 (4) − RECOIL 3 credit (0.75) = 3.25 + FREE [DRAW 1 −
    // RECOIL 1] (1.75) ≈ 5.0 → Doxa. The Necropotence seed: cards cost
    // blood, blood is cheap, blood is not free.
    free: { recoil: 1, drawCards: 1 },
    specialMechanics: [
        { kind: 'recoil', hp: 3 },
        { kind: 'rider', rider: { drawCards: 2 } },
    ],
    addedIn: '2026-08-08',
    tags: ['debt', 'draw'],
};

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
    paidSummary:
        'RECOIL 2. Afflict with DOOM 2 (grows +1 each time the foe acts) ' +
        'and MARK 1 for 2 turns.',
    // pts: DOOM i2 (2.9) + MARK d2 (1.5) − RECOIL 2 credit (0.5) = 3.9 +
    // FREE DOOM i1 (2.0) ≈ 5.9 → Lemma. Compound interest as a combat verb.
    free: { applyEffect: { effectId: 'debuff_creeping_doom', intensity: 1 } },
    combatEffects: [
        { effectId: 'debuff_creeping_doom', appliedTo: 'opponent', intensity: 2 },
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    specialMechanics: [{ kind: 'recoil', hp: 2 }],
    addedIn: '2026-08-08',
    tags: ['debt', 'dot', 'doom'],
};

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
        'Afflict with BLEED 2 (ticks each hit they take, 2 turns) and MARK 1 for 2 turns.',
    // pts: bleed i2 d2 (3) + mark d2 (1.5) = 4.5 + fate [DRAW 1 (2) + HEAL 3
    // (1)] × 0.7 (2.1) − fate RECOIL 2 credit (0.5) + FREE [mark d2 (1.5) +
    // TICK (0.6)] ≈ 8.2 → Thesis. The impossible made load-bearing: a dead X
    // die powers the pledge, at a blood price.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 }, tickOne: true },
    combatEffects: [
        { effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 2 },
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    fate: { rider: { drawCards: 1, healHp: 3 }, recoilHp: 2 },
    addedIn: '2026-08-08',
    tags: ['debt', 'fate', 'dot'],
};

const distraint: Card = {
    id: 'distraint',
    theme: 'debt',
    name: 'Distraint',
    philosophicalAspect: 'body',
    description:
        'The bailiff does not knock; he inventories. What cannot be paid in ' +
        'blood is paid in kind — the least thing you carry goes onto the ' +
        'fire, and the ledger, briefly, is warm toward you.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'IMMOLATE 1 (burn the lowest hand card). Afflict BLEED 2 (ticks each hit taken, 3 turns). Gain GUARD 4.',
    // pts: IMMOLATE 1 [bleed i2 d3 (5) + GUARD 4 (1.0)] − 1.0 burn credit =
    // 5.0 + FALLEN [DRAW 1] × 0.5 (1.0) + FREE [DOOM i1 (2.0) + HEAL 4
    // (1.33) − RECOIL 1 (0.25)] ≈ 9.1 → Theorem. The bailiff burns curses
    // first — an injected hex is seizable property.
    free: { recoil: 1, applyEffect: { effectId: 'debuff_creeping_doom', intensity: 1 }, healHp: 4 },
    specialMechanics: [
        {
            kind: 'immolate', count: 1, rider: {
                applyEffect: { effectId: 'debuff_bleed', intensity: 2, duration: 3 },
                guard: 4,
            },
        },
    ],
    fallen: { rider: { drawCards: 1 } },
    addedIn: '2026-08-08',
    tags: ['debt', 'immolate', 'fallen'],
};

const blankIndenture: Card = {
    id: 'blank-indenture',
    theme: 'debt',
    name: 'Blank Indenture',
    philosophicalAspect: 'heart',
    description:
        'The sum is left open, in the oldest courtesy of the trade. You ' +
        'fill the figure in with the only ink the house accepts, and the ' +
        'house honors every drop. Signed is signed; the amount was always ' +
        'yours to regret.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'RECOIL X (at least 3). Afflict POISON 1 per 2 VITAE paid, rounded up, for 4 turns (ticks each card you play).',
    // pts: recoil_x min 3, poisonPerX 0.5 — expected X 6 → POISON i3 d4
    // (~12.9 tempo-weighted) − X credit (1.5) = 11.4 + FREE [DOOM i2 (2.9) +
    // DRAW 1 (2)] ≈ 16.3 → Axiom. THE drawback-is-the-whole-story card: no
    // condition line — the contract is never discounted.
    free: { applyEffect: { effectId: 'debuff_creeping_doom', intensity: 2 }, drawCards: 1 },
    specialMechanics: [{ kind: 'recoil_x', min: 3, poisonPerX: 0.5 }],
    addedIn: '2026-08-08',
    tags: ['debt', 'recoil-x', 'capstone'],
};

const theRedLedger: Card = {
    id: 'the-red-ledger',
    theme: 'debt',
    name: 'The Red Ledger',
    philosophicalAspect: 'mind',
    persistentEffect:
        'Whenever you pay RECOIL, afflict the foe with BLEED 1 (ticks each hit they take, 2 turns).',
    description:
        'Every drop is entered. The book forgives nothing; it forwards. ' +
        'What you pay at your own vein it bills again, promptly, at theirs.',
    tier: 2, rank: 5, cardType: 'oath',
    targetType: 'self',
    // pts: engine text — BLEED 1 per RECOIL paid × ~8 recoil events in a
    // committed debt deck ≈ 8 → Axiom.
    addedIn: '2026-08-08',
    tags: ['debt', 'oath', 'recoil-payoff'],
};

const jointAndSeveral: Card = {
    id: 'joint-and-several',
    theme: 'debt',
    name: 'Joint and Several',
    philosophicalAspect: 'heart',
    persistentEffect:
        'Whenever you pay RECOIL, the foe loses the same amount of VITAE (liable for your debts).',
    description:
        'The amendment is read aloud in the smallest of the nine courts: ' +
        'liability shall be joint and several. From this clause forward, ' +
        'whatever the signatory bleeds, the counterparty bleeds also — coin ' +
        'for coin, drop for drop.',
    tier: 2, rank: 6, cardType: 'hex',
    targetType: 'enemy',
    // pts: engine text — mirrors every RECOIL paid onto the enemy, rest of
    // combat (engine-drip channel; suppurating-curse precedent) → Aporia.
    addedIn: '2026-08-08',
    tags: ['debt', 'hex', 'recoil-payoff'],
};

// ─── GRAVE — The Exhumation (the discard pile as reliquary) ──────────────────

const spadework: Card = {
    id: 'spadework',
    theme: 'grave',
    name: 'Spadework',
    philosophicalAspect: 'body',
    description:
        'The yard takes no appointments, only measurements. Dig ahead of ' +
        'need — two spadefuls for the stranger, two for the friend — and ' +
        'somewhere above you, a bell agrees to begin the count.',
    tier: 2, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Inflict DOOM 1 (grows +1 each time the foe acts). MILL 2.',
    // pts: DOOM i1 (2.0) + MILL 2 (2) = 4.0 + FREE MILL 2 (2) ≈ 6.0 → Doxa
    // (rich-common, refrain precedent).
    free: { millCards: 2 },
    combatEffects: [{ effectId: 'debuff_creeping_doom', appliedTo: 'opponent', intensity: 1 }],
    specialMechanics: [{ kind: 'rider', rider: { millCards: 2 } }],
    addedIn: '2026-08-08',
    tags: ['grave', 'dot', 'mill', 'seed'],
};

const shallowGrave: Card = {
    id: 'shallow-grave',
    theme: 'grave',
    name: 'Shallow Grave',
    philosophicalAspect: 'heart',
    description:
        'Buried in haste is remembered in full. What the ground barely ' +
        'holds, the hand barely needs to reach for — and the disturbed ' +
        'dead, being briefly awake, are briefly generous. And briefly angry.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'RECALL 1 card from your discard pile. FORETELL 2. TICK the foe\'s strongest DoT.',
    // pts: RECALL 1 (2) + FORETELL 2 (2) + TICK (0.6) = 4.6 + FREE [MILL 1
    // (1) + FORETELL 1 (1)] ≈ 6.6 → Lemma.
    free: { millCards: 1, foretell: 1 },
    specialMechanics: [
        { kind: 'reprise', count: 1 },
        { kind: 'foretell', count: 2 },
        { kind: 'rider', rider: { tickOne: true } },
    ],
    addedIn: '2026-08-08',
    tags: ['grave', 'recursion', 'info'],
};

const paupersPyre: Card = {
    id: 'paupers-pyre',
    theme: 'grave',
    name: "The Pauper's Pyre",
    philosophicalAspect: 'body',
    description:
        'The parish burns what it cannot afford to bury. Two to the fire, ' +
        'chosen by rank of poverty, and the smoke goes up looking for ' +
        'someone to blame.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'IMMOLATE 2 (burn the 2 lowest hand cards). Inflict DOOM 2 (grows +1 each time the foe acts). TICK every DoT on the foe. DRAW 2.',
    // pts: IMMOLATE-2 rider [DOOM i2 (2.9) + tickAllDots (1.5) + DRAW 2 (4)]
    // = 8.4 − burn credit (2.0) = 6.4 + FREE [MILL 2 (2) + TICK (0.6)]
    // ≈ 9.0 → Thesis. The curse-disposal engine: injected hexes are rank 1
    // and burn first, as pure profit.
    free: { millCards: 2, tickOne: true },
    specialMechanics: [
        {
            kind: 'immolate', count: 2, rider: {
                applyEffect: { effectId: 'debuff_creeping_doom', intensity: 2 },
                tickAllDots: true,
                drawCards: 2,
            },
        },
    ],
    addedIn: '2026-08-08',
    tags: ['grave', 'immolate', 'filter', 'dot'],
};

const dirgeForTheDisinterred: Card = {
    id: 'dirge-for-the-disinterred',
    theme: 'grave',
    name: 'Dirge for the Disinterred',
    philosophicalAspect: 'mind',
    description:
        'Sung once for the dying, twice for the dug-up. And when the pile ' +
        'beneath the pulpit grows to eight, you will find the congregation ' +
        'already knows the words — and joins in.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Inflict DOOM 1 (grows +1 each time the foe acts). ECHO. REQUIEM 8: TICK every DoT on the foe and DRAW 1 (8+ cards in discard).',
    // pts: DOOM i1 (2.0) × ECHO (1.8) ≈ 3.6 + REQUIEM-8 rider [tickAllDots
    // (1.5) + DRAW 1 (2)] × 0.5 (1.75) + FREE [MILL 2 (2) + FORETELL 1 (1)]
    // ≈ 8.35 → Theorem. ECHO's double application stacks the DOOM to i2.
    free: { millCards: 2, foretell: 1 },
    combatEffects: [{ effectId: 'debuff_creeping_doom', appliedTo: 'opponent', intensity: 1 }],
    specialMechanics: [{ kind: 'echo' }],
    synergy: {
        statePredicate: { kind: 'requiem', n: 8 },
        rider: { tickAllDots: true, drawCards: 1 },
    },
    addedIn: '2026-08-08',
    tags: ['grave', 'requiem', 'dot', 'payoff'],
};

const openEveryGrave: Card = {
    id: 'open-every-grave',
    theme: 'grave',
    name: 'Open Every Grave',
    philosophicalAspect: 'heart',
    description:
        'On the parish\'s last day there is no more waiting, and no more ' +
        'quiet. Every plot opens on its own hinge; every voice comes up ' +
        'still arguing; and everything you ever said is said again — ' +
        'louder, and in company.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'REPLAY your last spell 2 times, then RECALL 1 card from your discard pile.',
    // pts: REPLAY ×2 (10) + RECALL 1 (2) = 12 + FREE [MILL 3 (3) + FORETELL
    // 2 (2)] ≈ 17 → Axiom, in band (band honesty over the old ouroboros
    // overshoot).
    free: { millCards: 3, foretell: 2 },
    specialMechanics: [
        { kind: 'replay_last', times: 2 },
        { kind: 'reprise', count: 1 },
    ],
    addedIn: '2026-08-08',
    tags: ['grave', 'recursion', 'payoff', 'finisher'],
};

const theSextonsCount: Card = {
    id: 'the-sextons-count',
    theme: 'grave',
    name: "The Sexton's Count",
    philosophicalAspect: 'mind',
    persistentEffect:
        'Whenever you RECALL or REPLAY a card, inflict DOOM 1 on the foe.',
    description:
        'He rings once for every body raised, as courtesy demands. The bell ' +
        'does not mourn. It counts.',
    tier: 2, rank: 5, cardType: 'oath',
    targetType: 'self',
    // pts: engine text — DOOM 1 per RECALL/REPLAY across a recursion deck's
    // ~5-7 triggers, each compounding under DOOM's growth ≈ Axiom.
    addedIn: '2026-08-08',
    tags: ['grave', 'oath', 'doom'],
};

const theCongregationBelow: Card = {
    id: 'the-congregation-below',
    theme: 'grave',
    name: 'The Congregation Below',
    philosophicalAspect: 'mind',
    persistentEffect:
        'At the end of each round, the foe takes 1 damage per 3 cards you ' +
        'MILL or spend into your discard pile.',
    description:
        'Every burial is a deposition. Below the frost line the parish ' +
        'keeps perfect minutes, and at the close of each round the dead ' +
        'read them into the record — all of them, at once, in your favor.',
    tier: 2, rank: 6, cardType: 'hex',
    targetType: 'enemy',
    // pts: engine text — end-of-round drip of floor(discard ÷ 3): the
    // theme's native clock, scaling with its own MILL engine → Aporia.
    addedIn: '2026-08-08',
    tags: ['grave', 'hex', 'requiem', 'clock'],
};

// ─── VIGIL — The Cold Watch (winter siegecraft) ──────────────────────────────

const frostbittenPalisade: Card = {
    id: 'frostbitten-palisade',
    theme: 'vigil',
    name: 'Frostbitten Palisade',
    philosophicalAspect: 'body',
    description:
        'Stakes cut from the drowned orchard, sharpened in October, blessed ' +
        'with nothing. The frost volunteers the rest — it always does. Let ' +
        'them climb; the wall keeps what it catches.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'GUARD 8, then gain THORNS 1 for 2 turns.',
    // pts: GUARD 8 (2.0) + THORNS i1 d2 (1.5) = 3.5 + FREE GUARD 5 (1.25)
    // ≈ 4.75 → Doxa.
    free: { guard: 5 },
    combatEffects: [{ effectId: 'buff_thorns', appliedTo: 'self', intensity: 1, duration: 2 }],
    specialMechanics: [{ kind: 'guard', amount: 8 }],
    addedIn: '2026-08-08',
    tags: ['vigil', 'defense', 'reflect'],
};

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
    paidSummary: 'Gain THORNS 2 for 2 turns. GUARD 4.',
    // pts: THORNS i2 d2 (3.0) + GUARD 4 (1.0) = 4.0 + FREE [GUARD 2 persists
    // (0.67) + THORNS i1 d1 (0.75)] ≈ 5.4 → Lemma.
    free: { barrier: 2, applyEffect: { effectId: 'buff_thorns', intensity: 1, duration: 1, to: 'self' } },
    combatEffects: [{ effectId: 'buff_thorns', appliedTo: 'self', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'guard', amount: 4 }],
    addedIn: '2026-08-08',
    tags: ['vigil', 'reflect'],
};

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
    paidSummary: 'GUARD 6 (persists). FORETELL 2.',
    // pts: BARRIER 6 (2.0) + FORETELL 2 (2.0) = 4.0 + UNMOVED [DRAW 1 (2) +
    // 1 Conviction (1)] × 0.5 (1.5) + FREE [GUARD 3 persists (1.0) +
    // FORETELL 1 (1.0)] ≈ 7.5 → Thesis.
    free: { barrier: 3, foretell: 1 },
    specialMechanics: [{ kind: 'barrier', amount: 6 }, { kind: 'foretell', count: 2 }],
    synergy: {
        statePredicate: { kind: 'enemy-dealt-no-damage-last-round' },
        rider: { drawCards: 1, conviction: 1 },
    },
    addedIn: '2026-08-08',
    tags: ['vigil', 'watch', 'card-flow'],
};

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
    paidSummary: 'GUARD 8, then arm RIPOSTE 4 (parry 2) for one threat phase.',
    // pts: GUARD 8 (2.0) + RIPOSTE 4 parry 2 ((4+2) × 0.8 = 4.8; printed 4
    // is the floor, the live counter scales to the prevented blow) = 6.8 +
    // enemy-drew-blood [BLEED i2 d2 (3.0)] × 0.5 (1.5) + FREE [GUARD 4
    // persists (1.33) + THORNS i1 d2 (1.5)] ≈ 11.1 → Theorem.
    free: { barrier: 4, applyEffect: { effectId: 'buff_thorns', intensity: 1, duration: 2, to: 'self' } },
    specialMechanics: [{ kind: 'guard', amount: 8 }, { kind: 'riposte', damage: 4, reduce: 2 }],
    synergy: {
        statePredicate: { kind: 'enemy-drew-blood' },
        rider: { applyEffect: { effectId: 'debuff_bleed', intensity: 2, duration: 2, to: 'opponent' } },
    },
    addedIn: '2026-08-08',
    tags: ['vigil', 'reflect', 'payoff'],
};

const theBesiegersWinter: Card = {
    id: 'the-besiegers-winter',
    theme: 'vigil',
    name: "The Besieger's Winter",
    philosophicalAspect: 'mind',
    description:
        'They counted their grain in weeks. The wall counts in winters, and ' +
        'it is owed several. Every quiet night the frost moves one tent ' +
        'closer to their fires, and it does not knock.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'GUARD 12 (persists). Gain THORNS 2 for 2 turns. Inflict DOOM 2 ' +
        '(grows +1 each time the foe acts).',
    // pts: BARRIER 12 (4.0) + THORNS i2 d2 (3.0) + DOOM i2 (2.9) = 9.9 +
    // UNMOVED [bonusIntensity 2 (3.0)] × 0.5 (1.5) + FREE [GUARD 4 persists
    // (1.33) + DOOM i1 (2.0)] ≈ 14.7 → Axiom. Winter itself is the DoT — the
    // wall always owns a clock, even against a foe who refuses to feed it.
    free: { barrier: 4, applyEffect: { effectId: 'debuff_creeping_doom', intensity: 1 } },
    combatEffects: [
        { effectId: 'buff_thorns', appliedTo: 'self', intensity: 2, duration: 2 },
        { effectId: 'debuff_creeping_doom', appliedTo: 'opponent', intensity: 2 },
    ],
    specialMechanics: [{ kind: 'barrier', amount: 12 }],
    synergy: {
        statePredicate: { kind: 'enemy-dealt-no-damage-last-round' },
        rider: { bonusIntensity: 2 },
    },
    addedIn: '2026-08-08',
    tags: ['vigil', 'defense', 'payoff', 'doom'],
};

const everyStoneAnOath: Card = {
    id: 'every-stone-an-oath',
    theme: 'vigil',
    name: 'Every Stone an Oath',
    philosophicalAspect: 'heart',
    persistentEffect:
        'At the end of each round in which the foe dealt you no damage, gain GUARD 3 that persists.',
    description:
        'The masons swore as they laid each course — not to any saint, but ' +
        'to the stone beneath it. A promise stacked on a promise, mortared ' +
        'with breath. Every bloodless night, the congregation grows by one.',
    tier: 2, rank: 5, cardType: 'oath',
    targetType: 'self',
    // pts: engine text — 3 persistent GUARD per engineered quiet round ≈
    // Axiom-weight standing engine.
    addedIn: '2026-08-08',
    tags: ['vigil', 'oath', 'engine'],
};

const caltropsUnderTheSnow: Card = {
    id: 'caltrops-under-the-snow',
    theme: 'vigil',
    name: 'Caltrops Under the Snow',
    philosophicalAspect: 'body',
    persistentEffect:
        'Whenever the foe deals you damage, it gains BLEED 2 (ticks each hit they take).',
    description:
        'Iron teeth sown before the first snowfall, in rows, like a crop. ' +
        'Whatever reaches you has already walked the field to do it. The ' +
        'snow hides them and keeps the tally, and the red comes up through ' +
        'the white like an early spring.',
    tier: 2, rank: 6, cardType: 'hex',
    targetType: 'enemy',
    // pts: engine text — BLEED i2 seeded per enemy damage instance:
    // self-refreshing against aggression; the rare's DOOM covers the passive
    // tail → Aporia.
    addedIn: '2026-08-08',
    tags: ['vigil', 'hex', 'reflect'],
};

// ─── TRIAL — The Indictment (the witch-trial prosecuted mid-combat) ──────────

const readingOfTheCharges: Card = {
    id: 'reading-of-the-charges',
    theme: 'trial',
    name: 'Reading of the Charges',
    philosophicalAspect: 'mind',
    description:
        'The clerk reads without looking up: seven counts, each in a voice ' +
        'like earth on a coffin lid. By the third, the gallery remembers ' +
        'things it never witnessed. That is the point of reading them aloud.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Apply MARK 1 for 2 turns. Gain 2 CHARGES.',
    // pts: mark i1 d2 (1.5) + 2 PREMISES (1.6) + FREE [mark i1 d1 (0.75) +
    // 1 premise (0.8)] ≈ 4.65 → Doxa.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 }, premises: 1 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    specialMechanics: [{ kind: 'premise', count: 2 }],
    addedIn: '2026-08-08',
    tags: ['trial', 'evidence'],
};

const scoldsBridle: Card = {
    id: 'scolds-bridle',
    theme: 'trial',
    name: "Scold's Bridle",
    philosophicalAspect: 'body',
    description:
        'An iron cage for the jaw and a spike to keep the tongue devout. ' +
        'Whatever they meant to howl is entered in the record as silence. ' +
        'Silence, the court agrees, has always been a confession.',
    tier: 2, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'STAGGER 1. Apply BACKFIRE 1 for 2 turns (1 damage per rung its actions lose).',
    // pts: STAGGER 1 (2) + backfire i1 d2 (1.5) + FREE [backfire i1 d1
    // (0.75) + 1 premise (0.8)] ≈ 5.05 → Lemma.
    free: { applyEffect: { effectId: 'debuff_backfire', intensity: 1, duration: 1 }, premises: 1 },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    specialMechanics: [{ kind: 'stagger', rungs: 1 }],
    addedIn: '2026-08-08',
    tags: ['trial', 'objection'],
};

const thePrickingNeedle: Card = {
    id: 'the-pricking-needle',
    theme: 'trial',
    name: 'The Pricking Needle',
    philosophicalAspect: 'body',
    description:
        'Three inches of licensed steel, probing for the spot the Devil ' +
        'kissed numb. Where the needle draws no blood, the court draws its ' +
        'conclusion. Each dry wound is another count, written down twice.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Apply MARK 2 for 3 turns. Gain 2 CHARGES.',
    // pts: mark i2 d3 (4.5) + 2 PREMISES (1.6) + dieBonus match [2 premises
    // (1.6)] × 0.6 (0.96) + FREE [mark i1 d2 (1.5) + 2 premises (1.6)]
    // ≈ 10.2 → Thesis.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 }, premises: 2 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 3 }],
    specialMechanics: [{ kind: 'premise', count: 2 }],
    dieBonus: { onColor: 'match', rider: { premises: 2 } },
    addedIn: '2026-08-08',
    tags: ['trial', 'evidence'],
};

const contemptOfCourt: Card = {
    id: 'contempt-of-court',
    theme: 'trial',
    name: 'Contempt of Court',
    philosophicalAspect: 'heart',
    description:
        'They rose. They struck the rail. Good — every violence offered in ' +
        'this room is testimony now, and the bench is grateful for the ' +
        'demonstration.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Apply BACKFIRE 2 for 3 turns (2 damage per rung its actions lose). STAGGER 1.',
    // pts: backfire i2 d3 (4.5) + STAGGER 1 (2) + enemy-drew-blood [stagger
    // 1 (2) + 2 premises (1.6)] × 0.5 (1.8) + FREE [backfire i1 d2 (1.5) +
    // 2 premises (1.6)] ≈ 11.4 → Theorem. The outburst that struck you
    // becomes the charge.
    free: { applyEffect: { effectId: 'debuff_backfire', intensity: 1, duration: 2 }, premises: 2 },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 2, duration: 3 }],
    specialMechanics: [{ kind: 'stagger', rungs: 1 }],
    synergy: {
        statePredicate: { kind: 'enemy-drew-blood' },
        rider: { stagger: 1, premises: 2 },
    },
    addedIn: '2026-08-08',
    tags: ['trial', 'objection', 'contempt'],
};

const theBlackCap: Card = {
    id: 'the-black-cap',
    theme: 'trial',
    name: 'The Black Cap',
    philosophicalAspect: 'heart',
    description:
        'A square of black silk, lighter than a moth, heavier than the ' +
        'church roof. He sets it upon the wig without hurry, for the ' +
        'sentence was drafted before the arraignment. The trial is only the ' +
        'reading aloud.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Inflict DOOM 2 (grows +1 per foe action). SENTENCE 6: RUPTURE MARK for 2 per stack, DRAW 1. CONDEMN 8 wins (elite 10, boss 12).',
    // pts: DOOM i2 (2.9) + SENTENCE-at-6 rider [ruptureMarks 2 (1.33) +
    // draw 1 (2)] + concedeCapstone (3) + FREE [DOOM i1 (2.0) + 1 premise
    // (0.8)] ≈ 12.0 → Axiom. The declaring card carries no condition line —
    // the sentence was drafted before the arraignment.
    free: { applyEffect: { effectId: 'debuff_creeping_doom', intensity: 1 }, premises: 1 },
    combatEffects: [{ effectId: 'debuff_creeping_doom', appliedTo: 'opponent', intensity: 2 }],
    specialMechanics: [
        { kind: 'peroration', at: 6, rider: { ruptureMarks: 2, drawCards: 1 }, concedeAt: 8 },
    ],
    addedIn: '2026-08-08',
    tags: ['trial', 'verdict', 'payoff', 'alt-win'],
};

const theAssizeBell: Card = {
    id: 'the-assize-bell',
    theme: 'trial',
    name: 'The Assize Bell',
    philosophicalAspect: 'mind',
    persistentEffect:
        'Whenever your STAGGER removes a rung from the foe\'s telegraph, gain 1 CHARGE.',
    description:
        'One bronze syllable above the hall, struck for every objection ' +
        'sustained. The jury stopped hearing words some hours ago. They are ' +
        'counting tolls.',
    tier: 2, rank: 5, cardType: 'oath',
    targetType: 'self',
    // pts: engine text — +1 CHARGE per denied rung × ~12-15 rungs across a
    // trial deck's fight ≈ Axiom.
    addedIn: '2026-08-08',
    tags: ['trial', 'oath', 'objection'],
};

const writOfAttainder: Card = {
    id: 'writ-of-attainder',
    theme: 'trial',
    name: 'Writ of Attainder',
    philosophicalAspect: 'body',
    persistentEffect:
        'At the end of each round, inflict DOOM 1 on the foe (the sentence compounds for the rest of the trial).',
    description:
        'By this writ the blood itself stands condemned: nothing it feeds ' +
        'may inherit, nothing it warms may be spared. Each dawn the seal is ' +
        'pressed anew, and each dawn it bites deeper into the vein.',
    tier: 2, rank: 6, cardType: 'hex',
    targetType: 'enemy',
    // pts: engine text — a fresh DOOM 1 each round onto a stack that already
    // grows as the foe acts: a compounding clock → Aporia.
    addedIn: '2026-08-08',
    tags: ['trial', 'hex', 'doom'],
};

// ─── CHOIR — The Pale Choir (sung mercy and harvested souls) ─────────────────

const almsOfBreath: Card = {
    id: 'alms-of-breath',
    theme: 'choir',
    name: 'Alms of Breath',
    philosophicalAspect: 'heart',
    description:
        'The Choir does not beg. It offers — a bar of warm song pressed ' +
        'into the cold of you — and notes, in the parish ledger, what ' +
        'loosens as you take it. Charity, in that book, is spelt the same ' +
        'as debt.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Apply QUARTER 1 for 2 turns. PLEA 2. CLEANSE 1.',
    // pts: rapport i1 d2 (1.5) + sway 2 (1.8) + cleanse 1 (1.5) = 4.8 +
    // FREE [sway 1 (0.9) + soul 1 (0.75)] ≈ 6.45 → Doxa.
    free: { sway: 1, souls: 1 },
    combatEffects: [{ effectId: 'debuff_quarter', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    specialMechanics: [
        { kind: 'sway', amount: 2 },
        { kind: 'rider', rider: { cleanse: 1 } },
    ],
    addedIn: '2026-08-08',
    tags: ['choir', 'plea', 'mercy'],
};

const passingBell: Card = {
    id: 'passing-bell',
    theme: 'choir',
    name: 'Passing-Bell',
    philosophicalAspect: 'mind',
    description:
        'In the pale parish the bell is rung before the death, to spare the ' +
        'ringer a second climb. Each round it tolls a little louder, so the ' +
        'body knows its cue. The first soul is collected as a deposit.',
    tier: 2, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Inflict DOOM 2 (grows +1 each time the foe acts). Gain 1 SOUL.',
    // pts: DOOM i2 (2.9) + soul 1 (0.75) = 3.65 + FREE [heal 2 (0.67) +
    // soul 1 (0.75)] ≈ 5.1 → Lemma.
    free: { healHp: 2, souls: 1 },
    combatEffects: [{ effectId: 'debuff_creeping_doom', appliedTo: 'opponent', intensity: 2 }],
    specialMechanics: [{ kind: 'soul_gain', count: 1 }],
    addedIn: '2026-08-08',
    tags: ['choir', 'doom', 'soul'],
};

const lastRitesSungEarly: Card = {
    id: 'last-rites-sung-early',
    theme: 'choir',
    name: 'Last Rites, Sung Early',
    philosophicalAspect: 'body',
    description:
        'Why keep vigil at a sickbed when the psalm already knows the ' +
        'ending? The Choir sings the rite at double time, and whatever ' +
        'ailed them concludes — all of it, at once, as promised. The soul ' +
        'comes away neat, like a tooth already loose.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'RUPTURE 1 affliction: its remaining damage lands now. Gain 2 SOULS.',
    // pts: consume_affliction (5.5) + 2 souls (1.5) = 7.0 + dieBonus match
    // [soul 1 (0.75)] × 0.6 (0.45) + FREE [sway 2 (1.8) + heal 3 (1.0)]
    // ≈ 10.25 → Thesis.
    free: { sway: 2, healHp: 3 },
    specialMechanics: [{ kind: 'consume_affliction', souls: 2 }],
    dieBonus: { onColor: 'match', rider: { souls: 1 } },
    addedIn: '2026-08-08',
    tags: ['choir', 'harvest', 'payoff'],
};

const theOffertoryPlate: Card = {
    id: 'the-offertory-plate',
    theme: 'choir',
    name: 'The Offertory Plate',
    philosophicalAspect: 'heart',
    description:
        'It goes hand to hand and is never empty, and the parish long ago ' +
        'stopped asking what fills it. Spend from it and the Choir grows ' +
        'kind: a new voice in the loft, a gentled foe in the nave, a hymn ' +
        'with your name worked into the descant.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'REAP 3: PLEA 5, apply QUARTER 2 for 2 turns, and KINDLE a heart die.',
    // pts: REAP rider [sway 5 (4.5) + rapport i2 d2 (3.0)] + kindle heart
    // (2.5) − soul cost 3 (−3 × 0.75 ≈ −2.25) = 7.75 + threshold HEART×3
    // [souls 2 (1.5)] × 0.5 (0.75) + FREE [souls 2 (1.5) + sway 2 (1.8)]
    // ≈ 11.8 → Theorem.
    free: { souls: 2, sway: 2 },
    specialMechanics: [
        {
            kind: 'reap', cost: 3, kindle: 'heart',
            rider: { sway: 5, applyEffect: { effectId: 'debuff_quarter', intensity: 2, duration: 2 } },
        },
    ],
    threshold: { color: 'heart', count: 3, rider: { souls: 2 } },
    addedIn: '2026-08-08',
    tags: ['choir', 'reap', 'engine'],
};

const miserere: Card = {
    id: 'miserere',
    theme: 'choir',
    name: 'Miserere',
    philosophicalAspect: 'heart',
    description:
        'Have mercy is a request with a price, and the Choir sings it ' +
        'holding the whole collection. Every soul in the plate goes up at ' +
        'once, one syllable each. Half of what burns comes home to mend the ' +
        'singers.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'REAP ALL: 3 damage per Soul spent. SIPHON 50% of the harvest.',
    // pts: reap_all (5) + 3/soul × expected 4 souls ÷ 3 (4.0) + siphon 50%
    // (2.0) = 11.0 + fate [souls 2 + sway 2] × 0.7 (2.31) − fate RECOIL 2
    // credit (0.5) + FREE [sway 3 (2.7) + souls 3 (2.25)] ≈ 17.8 → Axiom.
    free: { sway: 3, souls: 3 },
    specialMechanics: [
        { kind: 'reap_all', burstPerSoul: 3 },
        { kind: 'siphon', pct: 0.5 },
    ],
    fate: { rider: { souls: 2, sway: 2 }, recoilHp: 2 },
    addedIn: '2026-08-08',
    tags: ['choir', 'reap', 'capstone'],
};

const choirboneReliquary: Card = {
    id: 'choirbone-reliquary',
    theme: 'choir',
    name: 'Choirbone Reliquary',
    philosophicalAspect: 'body',
    persistentEffect:
        'Whenever an affliction on the foe expires or is consumed, gain 1 SOUL and PLEA 1.',
    description:
        'A box of jaws that remembers every ending it has witnessed. When ' +
        'something in the enemy gutters out — a fever, a wound, a curse run ' +
        'dry — the box counts it, and hums.',
    tier: 2, rank: 5, cardType: 'oath',
    targetType: 'self',
    // pts: engine text — ~6-8 expiries/consumes per fight × (soul 0.75 +
    // sway 0.9) ≈ Axiom. Stacks with the ambient soul-on-expiry engine rule
    // (the card's grant is its own, on top).
    addedIn: '2026-08-08',
    tags: ['choir', 'harvest', 'oath'],
};

const theLongAmen: Card = {
    id: 'the-long-amen',
    theme: 'choir',
    name: 'The Long Amen',
    philosophicalAspect: 'mind',
    persistentEffect:
        'At the end of each round, the foe gains PLEA equal to the number of Souls you hold.',
    description:
        'The final word of the service, held past the organ, past the ' +
        'candle-stubs, past the congregation\'s patience. It does not ' +
        'resolve; it accrues. Every soul you keep lends it another voice, ' +
        'and the enemy stands in the nave, listening — agreeing.',
    tier: 2, rank: 6, cardType: 'hex',
    targetType: 'enemy',
    // pts: engine text — PLEA drip = souls held, per round, compounding
    // toward RELENT; rewards HOLDING souls while the plate rewards
    // spending them (a real decision, kept deliberately) → Aporia.
    addedIn: '2026-08-08',
    tags: ['choir', 'plea', 'hex'],
};

export const cardLibrary: Card[] = [
    // The Threadbare Office (starters)
    spoiledPoultice, thumbprickOath, firstSpadeful, chilblainWatch,
    pettyIndictment, thinHymn, grandmothersPsalter, threadbareCope,
    // The reliquary dice (valve relics)
    knuckleboneRecant, ossuaryDrawer, saintsFingerBone,
    // The curses (enemy-injected)
    mouthfulOfBrine, gnawMarks, arrears, overheardName,
    // rot — The Blight
    unctionOfBoils, theSextonsBell, theLongLent, gangreneGospel,
    communionOfTheWorm, theUntendedGarden, edictOfTheOpenWound,
    // debt — The Reckoning
    promissoryCut, theVig, deadPledge, distraint,
    blankIndenture, theRedLedger, jointAndSeveral,
    // grave — The Exhumation
    spadework, shallowGrave, paupersPyre, dirgeForTheDisinterred,
    openEveryGrave, theSextonsCount, theCongregationBelow,
    // vigil — The Cold Watch
    frostbittenPalisade, hoarfrostTeeth, nothingCrossedTheIce, theReprisalBell,
    theBesiegersWinter, everyStoneAnOath, caltropsUnderTheSnow,
    // trial — The Indictment
    readingOfTheCharges, scoldsBridle, thePrickingNeedle, contemptOfCourt,
    theBlackCap, theAssizeBell, writOfAttainder,
    // choir — The Pale Choir
    almsOfBreath, passingBell, lastRitesSungEarly, theOffertoryPlate,
    miserere, choirboneReliquary, theLongAmen,
];

const registry = new Map<string, Card>(cardLibrary.map(card => [card.id, card]));

// Sandbox integration: experimental cards / overrides (loaded via --sandbox)
// take precedence over the curated library at lookup time.
bindSandboxLibraryGuard(id => registry.get(id));

/** O(1) lookup by card id; sandbox-aware. Chain (WS2.1, extended phase 62):
 *  sandbox first (so experiments can shadow anything), then the Haunt
 *  registry (CONJURE targets — real cards, deliberately outside the pinned
 *  library), then the Ally registry (village-goodwill grants — also
 *  deliberately outside the pinned library), then the curated library. */
export function getCardById(id: string): Card | undefined {
    return getSandboxCard(id) ?? getHauntById(id) ?? getAllyById(id) ?? registry.get(id);
}
