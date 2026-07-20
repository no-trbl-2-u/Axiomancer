/**
 * Swap pool — ORACLE (preset `augury`). Owner-ratified 2026-07-18: 30 NEW
 * sandbox spells per theme, used ONLY as /deck-tuning swap candidates for the
 * 15-card preset recipe. NOT player-facing, NOT in presets, NOT in
 * `cards.library.ts`.
 *
 * Theme gist: foresee, declare, and collect on prophecy. Vocabulary held to
 * the family the seven shipped oracle cards already speak — FORETELL, OMEN,
 * DRAW, RUPTURE (incl. the single-affliction `consume_affliction` sense),
 * plus the utility verbs they lean on (MARK, POISON-as-foretold-wound, GUARD,
 * Conviction, revealStance, the CONVERT die valve). No neighbor hallmarks.
 *
 * Prior-art frame (Dawncaster, community corpus, confidence medium):
 * - kb:dawncaster/keywords/foretell.okf.md (src-001) — Foretell is a pure
 *   Deck-Management lookup; carrier density is filled by cheap commons.
 * - kb:dawncaster/cards/0119-augury-449528.okf.md (src-001) — the common
 *   carrier shape: "Foretell 3" + exactly one small kicker.
 * - kb:dawncaster/cards/0100-aries-reflection-612033.okf.md (src-001) — the
 *   volume build-around ("after you Foretell 6+ in a turn ...") demands many
 *   cheap carriers; our analogue is omen-hit-count payoffs (RUPTURE fuel).
 * Commons here are deliberately dense, simple FORETELL/OMEN carriers; rares
 * are the collectors.
 *
 * Die-interaction law as applied here: every tier-2+ card carries exactly ONE
 * of threshold / dieBonus / fate / die-manipulation / react — with OMEN and
 * `synergy.statePredicate` filling the react slot (cassandras-burden and
 * the-unmoved-mover precedents); no card mixes two.
 */

import type { Card } from '../types';
import type { SandboxCardSet } from '../cards.sandbox-sets';

// ─── Commons (10) — x4-seat candidates: simple, reliable, one line each ──────

/** DoT opener — the theme's bread: the foretold wound (POISON + MARK), with a
 *  FREE line that starts painting the target before the die is even spent. */
const omenOfRain: Card = {
    id: 'omen-of-rain',
    theme: 'oracle',
    name: 'Omen of Rain',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'The sky was already grieving when they woke. What falls on them now ' +
        'was written into the clouds a day ago.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i1 d2 (tempo-weighted 2.135 exactly) + mark i1 d2 (1.5) =
    // 3.635 + FREE [foretell 1 (1.0) + mark i1 d1 (0.75)] = 1.75 → 5.385,
    // scorer prints 5.38 → common band 1.5-7.5 (Doxa).
    // FREE share 1.75/5.385 = 32.5% ✓.
    free: { foretell: 1, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'opponent' } },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 },
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    addedIn: '2026-07-18',
    tags: ['oracle', 'dot'],
};

/** The bigger DoT common — one clean POISON line, nothing else. The most
 *  boring card in the pool on purpose: an x4 seat wants a metronome. */
const readTheEntrails: Card = {
    id: 'read-the-entrails',
    theme: 'oracle',
    name: 'Read the Entrails',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'The old way. The opened bird does not lie, and what it says about ' +
        'them is already at work under their skin.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i2 d2 (tempo-weighted ≈ 4.27) + FREE [foretell 1 (1.0) +
    // conviction 1 (1.0)] = 2.0 → 6.27 → common band 1.5-7.5 (Lemma).
    // FREE share 2.0/6.27 = 31.9% ✓.
    free: { foretell: 1, conviction: 1 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 2, duration: 2 },
    ],
    addedIn: '2026-07-18',
    tags: ['oracle', 'dot'],
};

/** The defend common — pure GUARD, priced flat. You do not dodge what you
 *  have already read; you are simply not where it lands. */
const theBlowAlreadyRead: Card = {
    id: 'the-blow-already-read',
    theme: 'oracle',
    name: 'The Blow Already Read',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'It was described to you in full before they thought of it. Standing ' +
        'aside is not speed. It is punctuality.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: GUARD 12 (12 ÷ 4 = 3.0) + FREE [foretell 1 (1.0) + guard 2 (0.5)]
    // = 1.5 → 4.5 → common band 1.5-7.5 (Doxa). FREE share 1.5/4.5 = 33.3% ✓.
    free: { foretell: 1, guard: 2 },
    specialMechanics: [{ kind: 'guard', amount: 12 }],
    addedIn: '2026-07-18',
    tags: ['oracle', 'defense'],
};

/** Defend common #2 — GUARD plus the info verb (see the next phase early),
 *  with a mind-die kicker. The one common that carries a die line. */
const eyeBeforeTheStorm: Card = {
    id: 'eye-before-the-storm',
    theme: 'oracle',
    name: 'Eye Before the Storm',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Calm is not the absence of the storm. It is the reading of it, done ' +
        'early, while the first wind is still deciding.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: GUARD 10 (2.5) + revealStance (1.5) = 4.0 + dieBonus mind [guard 4
    // (1.0)] × 0.6 = 0.6 → 4.6 + FREE [foretell 1 (1.0) + guard 3 (0.75)] =
    // 1.75 → 6.35 → common band 1.5-7.5 (Lemma). FREE share 1.75/6.35 = 27.6% ✓.
    free: { foretell: 1, guard: 3 },
    specialMechanics: [
        { kind: 'guard', amount: 10 },
        { kind: 'rider', rider: { revealStance: true } },
    ],
    dieBonus: { onColor: 'mind', rider: { guard: 4 } },
    addedIn: '2026-07-18',
    tags: ['oracle', 'defense', 'dice'],
};

/** Tempo common — FORETELL plus Conviction. The augur who keeps the ledger
 *  even, phase after phase; deck-manipulation glue for the x4 seats. */
const steadyAugur: Card = {
    id: 'steady-augur',
    theme: 'oracle',
    name: 'Steady Augur',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'No visions, no theatre. Read the next two cards of the world, file ' +
        'them, and be paid for accurate work.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: FORETELL 2 (2.0) + conviction 2 (2.0) = 4.0 + FREE [foretell 2
    // (2.0)] → 6.0 → common band 1.5-7.5 (Doxa). FREE share 2.0/6.0 = 33.3% ✓.
    free: { foretell: 2 },
    specialMechanics: [
        { kind: 'foretell', count: 2 },
        { kind: 'rider', rider: { conviction: 2 } },
    ],
    addedIn: '2026-07-18',
    tags: ['oracle', 'draw'],
};

/** The starter OMEN — the smallest stake (1 Conviction) wagered on the tempo
 *  currency ITSELF: ante 1, win 2 back. Deliberately OFF library
 *  signs-and-portents' draw-payout class (review 2026-07-18: the draw-rider
 *  draft was a near-clone that out-pointed the incumbent from a cheaper seat)
 *  and priced below its real 2.90, so a /deck-tuning preference reads the
 *  wager-currency axis, not raw points. */
const smallWager: Card = {
    id: 'small-wager',
    theme: 'oracle',
    name: 'Small Wager',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'A copper coin on tomorrow. Not for the winnings — for the habit of ' +
        'being right.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: OMEN(conviction 2 = 2.0 × 0.6 omen-odds = 1.2 + omenInfo 1.0 −
    // ante 1 × 0.75 = −0.75) = 1.45 + FREE [guard 2 (0.5)] → 1.95 → common
    // band 1.5-7.5 (Doxa). FREE share 0.5/1.95 = 25.6% ✓. Below library
    // signs-and-portents' real 2.90 ✓.
    free: { guard: 2 },
    specialMechanics: [
        { kind: 'omen', maxWindow: 2, anteConviction: 1, rider: { conviction: 2 } },
    ],
    addedIn: '2026-07-18',
    tags: ['oracle', 'omen'],
};

/** MARK + a braced OMEN — name the place it lands, and be stood ready there.
 *  The common-band cousin of cassandras-burden without the DoT half. */
const theCalledShot: Card = {
    id: 'the-called-shot',
    theme: 'oracle',
    name: 'The Called Shot',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Point at the exact rib. Say when. Their pride will aim the blow for ' +
        'you, and your footing is already paid for.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: mark i2 d2 (3.0) + OMEN(Guard 6 = 1.5 × 0.6 = 0.9 + omenInfo 1.0 −
    // ante 1 × 0.75 = −0.75) = 1.15 → 4.15 + FREE [foretell 2 (2.0)] → 6.15 →
    // common band 1.5-7.5 (Lemma). FREE share 2.0/6.15 = 32.5% ✓.
    free: { foretell: 2 },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 2 },
    ],
    specialMechanics: [
        { kind: 'omen', maxWindow: 2, anteConviction: 1, rider: { guard: 6 } },
    ],
    addedIn: '2026-07-18',
    tags: ['oracle', 'omen', 'exposure'],
};

/** The pure carrier — Dawncaster's "Augury" shape verbatim (Foretell 3 + one
 *  kicker, kb:dawncaster/cards/0119-augury-449528.okf.md): scry deep, draw 1. */
const scatteredAuspices: Card = {
    id: 'scattered-auspices',
    theme: 'oracle',
    name: 'Scattered Auspices',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Birds, bones, spilled salt — the signs disagree on everything except ' +
        'the next three turnings. Take the one that reads clean.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: FORETELL 3 (3.0) + DRAW 1 (2.0) = 5.0 + FREE [foretell 1 (1.0) +
    // conviction 1 (1.0)] = 2.0 → 7.0 → common band 1.5-7.5 (Lemma).
    // FREE share 2.0/7.0 = 28.6% ✓.
    free: { foretell: 1, conviction: 1 },
    specialMechanics: [
        { kind: 'foretell', count: 3 },
        { kind: 'rider', rider: { drawCards: 1 } },
    ],
    addedIn: '2026-07-18',
    tags: ['oracle', 'draw'],
};

/** The FATE common — the card that reads even a ruined die. An X die powers
 *  it anyway and the blank face itself becomes the auspice. */
const theUnreadCard: Card = {
    id: 'the-unread-card',
    theme: 'oracle',
    name: 'The Unread Card',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Every deck holds one card no one has turned. The oracle reads its ' +
        'back, bleeds a little for the privilege, and knows it anyway.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: mark i2 d2 (3.0) + fate [foretell 1 (1.0) + draw 1 (2.0)] × 0.7 =
    // 2.1 − recoil 2 × (1/3) × 0.75 = −0.5 → net fate 1.6 → 4.6 + FREE
    // [foretell 1 (1.0) + conviction 1 (1.0)] = 2.0 → 6.6 → common band
    // 1.5-7.5 (Lemma). FREE share 2.0/6.6 = 30.3% ✓.
    free: { foretell: 1, conviction: 1 },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 2 },
    ],
    fate: { rider: { foretell: 1, drawCards: 1 }, recoilHp: 2 },
    addedIn: '2026-07-18',
    tags: ['oracle', 'dice', 'exposure'],
};

/** Threshold common — the wound plus a convergence clause: with enough mind
 *  already spent, the signs line up and the deck rearranges itself. */
const convergingSigns: Card = {
    id: 'converging-signs',
    theme: 'oracle',
    name: 'Converging Signs',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'One omen is a mood. Three, agreeing, are a verdict — and the verdict ' +
        'has already begun its work on them.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i1 d2 (tempo-weighted 2.135 exactly) + threshold mind 3
    // [foretell 1 (1.0) + draw 1 (2.0)] × 0.5 = 1.5 → 3.635 + FREE [foretell 1
    // (1.0) + guard 2 (0.5)] = 1.5 → 5.135, scorer prints 5.13 → common band
    // 1.5-7.5 (Doxa). FREE share 1.5/5.135 = 29.2% ✓.
    free: { foretell: 1, guard: 2 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    threshold: { color: 'mind', count: 3, rider: { foretell: 1, drawCards: 1 } },
    addedIn: '2026-07-18',
    tags: ['oracle', 'dot', 'dice'],
};

// ─── Uncommons (12) — the engine: wagers, rigging, conversion, conditions ────

/** The engine DoT+OMEN — cassandras-burden's rival probe: a heavier wound
 *  (POISON 2, no MARK) and a bigger brace on the same ante, netting 6.67 vs
 *  the incumbent's real 6.74 (the set's rivalry-probe convention: at-or-below,
 *  so a /deck-tuning preference reads the wound-vs-exposure shape, not extra
 *  points — review 2026-07-18 trimmed the omen draw and the FREE draw). OMEN
 *  is the card's react line (die-law: cassandras-burden precedent). */
const theDoomINamed: Card = {
    id: 'the-doom-i-named',
    theme: 'oracle',
    name: 'The Doom I Named',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Naming it was not a warning. It was a summons — and having summoned ' +
        'it, the namer alone stands outside its reach.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i2 d2 (tempo-weighted 4.27) + OMEN(guard 6 = 1.5 × 0.6 =
    // 0.9 + omenInfo 1.0 − ante 2 × 0.75 = −1.5) = 0.4 → 4.67 + FREE
    // [foretell 1 (1.0) + conviction 1 (1.0)] = 2.0 → 6.67 → uncommon band
    // 4.5-13 (Thesis). FREE share 2.0/6.67 = 30.0% ✓.
    free: { foretell: 1, conviction: 1 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 2, duration: 2 },
    ],
    specialMechanics: [
        { kind: 'omen', maxWindow: 2, anteConviction: 2, rider: { guard: 6 } },
    ],
    addedIn: '2026-07-18',
    tags: ['oracle', 'dot', 'omen'],
};

/** OPENING condition — prophecy is worthless said late. Lead with it and the
 *  reading runs twice as deep. statePredicate fills the react slot. */
const beforeTheFirstWord: Card = {
    id: 'before-the-first-word',
    theme: 'oracle',
    name: 'Before the First Word',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'An oracle who speaks second is a critic. Say it before anything else ' +
        'has been said, and the whole hour arranges itself around you.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: FORETELL 2 (2.0) + revealStance (1.5) = 3.5 + OPENING(0 prior
    // spells) [foretell 2 (2.0) + draw 1 (2.0)] × 0.5 = 2.0 → 5.5 + FREE
    // [foretell 1 (1.0) + conviction 1 (1.0)] = 2.0 → 7.5 → uncommon band
    // 4.5-13 (Thesis). FREE share 2.0/7.5 = 26.7% ✓.
    free: { foretell: 1, conviction: 1 },
    specialMechanics: [
        { kind: 'foretell', count: 2 },
        { kind: 'rider', rider: { revealStance: true } },
    ],
    synergy: {
        statePredicate: { kind: 'opening', maxPriorSpells: 0 },
        rider: { foretell: 2, drawCards: 1 },
    },
    addedIn: '2026-07-18',
    tags: ['oracle', 'draw', 'condition'],
};

/** The prophecy-of-safety defend — GUARD now; if the last blow you foresaw
 *  never landed, the vindicated reading pays out. React slot: statePredicate. */
const theAvertedBlow: Card = {
    id: 'the-averted-blow',
    theme: 'oracle',
    name: 'The Averted Blow',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'The strike that did not land is still yours. You bought it early, at ' +
        'the cheap hour, and its whole weight is owed back to you.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: GUARD 14 (14 ÷ 4 = 3.5) + UNTOUCHED-last-round [draw 1 (2.0) +
    // conviction 1 (1.0) + foretell 1 (1.0)] × 0.5 = 2.0 → 5.5 + FREE
    // [foretell 1 (1.0) + guard 4 (1.0)] = 2.0 → 7.5 → uncommon band 4.5-13
    // (Thesis). FREE share 2.0/7.5 = 26.7% ✓.
    free: { foretell: 1, guard: 4 },
    specialMechanics: [{ kind: 'guard', amount: 14 }],
    synergy: {
        statePredicate: { kind: 'enemy-dealt-no-damage-last-round' },
        rider: { drawCards: 1, conviction: 1, foretell: 1 },
    },
    addedIn: '2026-07-18',
    tags: ['oracle', 'defense', 'condition'],
};

/** The CONVERT valve, second reading — second-sight's draw-side sibling: the
 *  die recolored WILD, the hand refilled. Die-manipulation is the react slot. */
const recastTheLots: Card = {
    id: 'recast-the-lots',
    theme: 'oracle',
    name: 'Recast the Lots',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'A poor throw is only a poor question. Gather the lots, ask again ' +
        'properly, and the answer arrives with company.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: CONVERT the powering die to WILD (2.5) + DRAW 2 (4.0) = 6.5 + FREE
    // [foretell 1 (1.0) + mark i1 d2 (1.5)] = 2.5 → 9.0 → uncommon band
    // 4.5-13 (Thesis). FREE share 2.5/9.0 = 27.8% ✓.
    free: { foretell: 1, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2, to: 'opponent' } },
    specialMechanics: [
        { kind: 'convert_die_color' },
        { kind: 'rider', rider: { drawCards: 2 } },
    ],
    addedIn: '2026-07-18',
    tags: ['oracle', 'draw', 'dice'],
};

/** The REFRESH reading — the deep scry that hands the die back: the future is
 *  examined and the present has lost nothing. Die-manipulation react slot. */
const thePageTurnsBack: Card = {
    id: 'the-page-turns-back',
    theme: 'oracle',
    name: 'The Page Turns Back',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Read three pages ahead, then return to the sentence you left. The ' +
        'bookmark is still warm. Nothing has been spent but certainty.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: REFRESH the powering die (2.0) + FORETELL 3 (3.0) + conviction 1
    // (1.0) = 6.0 + FREE [foretell 1 (1.0) + conviction 1 (1.0) + guard 2
    // (0.5)] = 2.5 → 8.5 → uncommon band 4.5-13 (Thesis).
    // FREE share 2.5/8.5 = 29.4% ✓.
    free: { foretell: 1, conviction: 1, guard: 2 },
    specialMechanics: [
        { kind: 'refresh_die' },
        { kind: 'foretell', count: 3 },
        { kind: 'rider', rider: { conviction: 1 } },
    ],
    addedIn: '2026-07-18',
    tags: ['oracle', 'dice', 'valve'],
};

/** The mid OMEN engine — a battle-long MARK bed plus the biggest sensible
 *  hedged wager. OMEN fills the react slot. */
const stakeTheFuture: Card = {
    id: 'stake-the-future',
    theme: 'oracle',
    name: 'Stake the Future',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Put tomorrow itself on the table. If it arrives wearing the face you ' +
        'described, the house pays — and you described it exactly.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: mark i2 d3 (0.75 × 2 × 3 = 4.5) + OMEN([draw 2 (4.0) + guard 6
    // (1.5)] = 5.5 × 0.6 = 3.3 + omenInfo 1.0 − ante 3 × 0.75 = −2.25) = 2.05
    // → 6.55 + FREE [foretell 1 (1.0) + draw 1 (2.0)] = 3.0 → 9.55 → uncommon
    // band 4.5-13 (Theorem). FREE share 3.0/9.55 = 31.4% ✓.
    free: { foretell: 1, drawCards: 1 },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 3 },
    ],
    specialMechanics: [
        { kind: 'omen', maxWindow: 2, anteConviction: 3, rider: { drawCards: 2, guard: 6 } },
    ],
    addedIn: '2026-07-18',
    tags: ['oracle', 'omen', 'exposure'],
};

// PROMOTED OUT 2026-07-19 (owner-ratified, the ballot's explicit
// needs-more-data-grade pick): `half-spoken-prophecy` moved to
// `cards.library.ts` and the augury body uncommon seat, RECOLORED mind→body
// for the evicted self-flagellant seat (arm a3,
// docs/reports/deck-tuning-2026-07-18.md — the only augury candidate both
// win- and engagement-positive; 344 mid fizzles is the known caveat).

/** The long-clock DoT — the doom written slowly, with a threshold clause that
 *  sharpens the ink. Threshold fills the react slot. */
const slowWritDoom: Card = {
    id: 'slow-writ-doom',
    theme: 'oracle',
    name: 'Slow-Writ Doom',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Some verdicts are stamped. This one is handwritten, letter by ' +
        'letter, and every hour it gains another clause against them.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i2 d3 (tempo-weighted ≈ 6.33) + mark i1 d2 (1.5) = 7.83 +
    // threshold mind 3 [bonusIntensity 1 (1.5)] × 0.5 = 0.75 → 8.58 + FREE
    // [foretell 1 (1.0) + draw 1 (2.0)] = 3.0 → 11.58 → uncommon band 4.5-13
    // (Theorem). FREE share 3.0/11.58 = 25.9% ✓.
    free: { foretell: 1, drawCards: 1 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 2, duration: 3 },
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    threshold: { color: 'mind', count: 3, rider: { bonusIntensity: 1 } },
    addedIn: '2026-07-18',
    tags: ['oracle', 'dot', 'dice'],
};

/** Exposure DoT with a mind-die reading — the star-chart wound: light poison,
 *  heavy MARK, and the right die pays the reader. DieBonus react slot. */
const venomInTheStars: Card = {
    id: 'venom-in-the-stars',
    theme: 'oracle',
    name: 'Venom in the Stars',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Their birth chart was a diagnosis. You are merely the courier of a ' +
        'toxin the constellations prescribed long ago.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i1 d3 (tempo-weighted ≈ 3.16) + mark i2 d2 (3.0) = 6.16 +
    // dieBonus mind [foretell 1 (1.0) + conviction 1 (1.0)] × 0.6 = 1.2 →
    // 7.36 + FREE [foretell 1 (1.0) + draw 1 (2.0)] = 3.0 → 10.36 → uncommon
    // band 4.5-13 (Thesis). FREE share 3.0/10.36 = 29.0% ✓.
    free: { foretell: 1, drawCards: 1 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 3 },
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 2 },
    ],
    dieBonus: { onColor: 'mind', rider: { foretell: 1, conviction: 1 } },
    addedIn: '2026-07-18',
    tags: ['oracle', 'dot', 'exposure', 'dice'],
};

/** The wagered wall — GUARD now, the next phase read early, and a stake that
 *  doubles the cover if the read was right. OMEN react slot. */
const theBraceForetold: Card = {
    id: 'the-brace-foretold',
    theme: 'oracle',
    name: 'The Brace Foretold',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Set the bone before the fall. If the fall then comes as written, ' +
        'the splint was never a guess — it was a receipt.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: GUARD 10 (2.5) + revealStance (1.5) + OMEN(Guard 10 = 2.5 × 0.6 =
    // 1.5 + omenInfo 1.0 − ante 2 × 0.75 = −1.5) = 1.0 → 5.0 + FREE
    // [foretell 1 (1.0) + guard 4 (1.0)] = 2.0 → 7.0 → uncommon band 4.5-13
    // (Thesis). FREE share 2.0/7.0 = 28.6% ✓.
    free: { foretell: 1, guard: 4 },
    specialMechanics: [
        { kind: 'guard', amount: 10 },
        { kind: 'rider', rider: { revealStance: true } },
        { kind: 'omen', maxWindow: 2, anteConviction: 2, rider: { guard: 10 } },
    ],
    addedIn: '2026-07-18',
    tags: ['oracle', 'defense', 'omen'],
};

/** FINALE condition — the reading done at the bottom of the hand: emptying
 *  yourself into the future refills the present. statePredicate react slot. */
const readToTheEnd: Card = {
    id: 'read-to-the-end',
    theme: 'oracle',
    name: 'Read to the End',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Amateurs stop at the omen that flatters them. Read past it, to the ' +
        'last cold line, and the book hands you the next chapter itself.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts: DRAW 2 (4.0) + FORETELL 2 (2.0) = 6.0 + FINALE(≤2 left) [draw 1
    // (2.0) + foretell 1 (1.0)] × 0.5 = 1.5 → 7.5 + FREE [foretell 1 (1.0) +
    // conviction 2 (2.0)] = 3.0 → 10.5 → uncommon band 4.5-13 (Theorem).
    // FREE share 3.0/10.5 = 28.6% ✓.
    free: { foretell: 1, conviction: 2 },
    specialMechanics: [
        { kind: 'rider', rider: { drawCards: 2 } },
        { kind: 'foretell', count: 2 },
    ],
    synergy: {
        statePredicate: { kind: 'finale', cardsLeftAtMost: 2 },
        rider: { drawCards: 1, foretell: 1 },
    },
    addedIn: '2026-07-18',
    tags: ['oracle', 'draw', 'condition'],
};

/** The prognosis-extender — the foretold wound written longer and deeper when
 *  the mind die confirms it. DieBonus react slot carries the amplifier. */
const theLengtheningShadow: Card = {
    id: 'the-lengthening-shadow',
    theme: 'oracle',
    name: 'The Lengthening Shadow',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Measured at noon, it was nothing. But you cast the measurement ' +
        'forward, hour by hour, and by dusk it owns the whole road.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i2 d2 (tempo-weighted ≈ 4.27) + mark i1 d2 (1.5) = 5.77 +
    // dieBonus mind [bonusIntensity 1 (1.5) + bonusDuration 1 (1.0)] = 2.5 ×
    // 0.6 = 1.5 → 7.27 + FREE [foretell 1 (1.0) + draw 1 (2.0)] = 3.0 →
    // 10.27 → uncommon band 4.5-13 (Theorem). FREE share 3.0/10.27 = 29.2% ✓.
    free: { foretell: 1, drawCards: 1 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 2, duration: 2 },
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    dieBonus: { onColor: 'mind', rider: { bonusIntensity: 1, bonusDuration: 1 } },
    addedIn: '2026-07-18',
    tags: ['oracle', 'dot', 'dice'],
};

// ─── Rares (8) — finishers and build-arounds ─────────────────────────────────

/** The alternate RUPTURE capstone — prophecy-fulfilled's swap rival: a REAL
 *  fuel cut (+1/hit, not +3 — −1.33 pts) traded for a conditional mind-die
 *  cycle line (+1.2 pts), netting BELOW prophecy-fulfilled (14.87 vs 15.00)
 *  so preferring it measures the flow-vs-fuel axis, not extra points. */
const allOmensDue: Card = {
    id: 'all-omens-due',
    theme: 'oracle',
    name: 'All Omens Due',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Prophecy is credit. Every reading extended them a little more ruin ' +
        'on account — and this is the hour the account is called.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: RUPTURE ALL (4.0 + expected fuel 8.0 = 12.0) + 1 fuel per omen hit
    // (1 × expectedOmenHits 2 ÷ 3 ≈ 0.67) = 12.67 + dieBonus mind [draw 1
    // (2.0)] × 0.6 = 1.2 → 13.87 + FREE [foretell 1 (1.0)] → 14.87 → rare
    // band 7-19 (Axiom). FREE share 1.0/14.87 = 6.7% — under the 25-35%
    // window BY DESIGN: a payoff-class finisher whose whole value is the PAID
    // detonation; any in-window FREE line would push the total toward the
    // band ceiling while making the dead-draw turns too cheap
    // (prophecy-fulfilled precedent).
    intentionallyAsymmetric: true,
    free: { foretell: 1 },
    specialMechanics: [{ kind: 'rupture', fuelPerOmenHit: 1 }],
    dieBonus: { onColor: 'mind', rider: { drawCards: 1 } },
    addedIn: '2026-07-18',
    tags: ['oracle', 'payoff'],
};

/** The great wager — the biggest staked claim in the pool, laid over a full
 *  foretold-wound bed. OMEN react slot. */
const theGrandPrognostication: Card = {
    id: 'the-grand-prognostication',
    theme: 'oracle',
    name: 'The Grand Prognostication',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Not a guess. A schedule. The wound is entered first, the hour of ' +
        'proof second, and the payment for being right stands third, waiting.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i2 d2 (tempo-weighted ≈ 4.27) + mark i2 d2 (3.0) = 7.27 +
    // OMEN([draw 2 (4.0) + guard 12 (3.0) + foretell 2 (2.0)] = 9.0 × 0.6 =
    // 5.4 + omenInfo 1.0 − ante 3 × 0.75 = −2.25) = 4.15 → 11.42 + FREE
    // [foretell 2 (2.0) + draw 1 (2.0)] = 4.0 → 15.42 → rare band 7-19
    // (Axiom). FREE share 4.0/15.42 = 25.9% ✓.
    free: { foretell: 2, drawCards: 1 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 2, duration: 2 },
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 2 },
    ],
    specialMechanics: [
        { kind: 'omen', maxWindow: 2, anteConviction: 3, rider: { drawCards: 2, guard: 12, foretell: 2 } },
    ],
    addedIn: '2026-07-18',
    tags: ['oracle', 'omen', 'dot'],
};

/** The scry build-around — Aries' Reflection's lesson (volume payoffs need a
 *  deep-read enabler): the deepest FORETELL in the pool plus real card flow.
 *  DieBonus react slot. */
const eyesOfTheAeon: Card = {
    id: 'eyes-of-the-aeon',
    theme: 'oracle',
    name: 'Eyes of the Aeon',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Open the lid all the way, once. Five turnings of the world lie in ' +
        'plain order, and two of them are already in your hand.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'self',
    // pts: FORETELL 5 (5.0) + DRAW 2 (4.0) + conviction 2 (2.0) = 11.0 +
    // dieBonus mind [draw 1 (2.0)] × 0.6 = 1.2 → 12.2 + FREE [foretell 2
    // (2.0) + draw 1 (2.0) + conviction 1 (1.0)] = 5.0 → 17.2 → rare band
    // 7-19 (Axiom). FREE share 5.0/17.2 = 29.1% ✓.
    free: { foretell: 2, drawCards: 1, conviction: 1 },
    specialMechanics: [
        { kind: 'foretell', count: 5 },
        { kind: 'rider', rider: { drawCards: 2, conviction: 2 } },
    ],
    dieBonus: { onColor: 'mind', rider: { drawCards: 1 } },
    addedIn: '2026-07-18',
    tags: ['oracle', 'draw'],
};

/** The fortress hour — the defensive rare: a wall bought early, and a
 *  vindication clause when the foreseen round passes clean. statePredicate
 *  react slot. */
const theInviolateHour: Card = {
    id: 'the-inviolate-hour',
    theme: 'oracle',
    name: 'The Inviolate Hour',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'There is one hour in every doom through which nothing passes. You ' +
        'found it years ago. You have been standing in it ever since.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'self',
    // pts: GUARD 16 (16 ÷ 4 = 4.0) + revealStance (1.5) = 5.5 +
    // UNTOUCHED-last-round [guard 8 (2.0) + draw 1 (2.0) + conviction 1
    // (1.0)] × 0.5 = 2.5 → 8.0 + FREE [foretell 1 (1.0) + guard 8 (2.0)] =
    // 3.0 → 11.0 → rare band 7-19 (Axiom). FREE share 3.0/11.0 = 27.3% ✓.
    free: { foretell: 1, guard: 8 },
    specialMechanics: [
        { kind: 'guard', amount: 16 },
        { kind: 'rider', rider: { revealStance: true } },
    ],
    synergy: {
        statePredicate: { kind: 'enemy-dealt-no-damage-last-round' },
        rider: { guard: 8, drawCards: 1, conviction: 1 },
    },
    addedIn: '2026-07-18',
    tags: ['oracle', 'defense', 'condition'],
};

/** The heaviest DoT sentence in the pool — the Aporia-grade written doom,
 *  sharpened by the mind threshold. Threshold react slot. */
const writOfRuin: Card = {
    id: 'writ-of-ruin',
    theme: 'oracle',
    name: 'Writ of Ruin',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'The full sentence, fair-copied and sealed. It does not need an ' +
        'executioner. It only needs the days to arrive in order.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i3 d3 (tempo-weighted ≈ 9.49) + mark i1 d3 (0.75 × 1 × 3 =
    // 2.25) = 11.74 + threshold mind 4 [bonusIntensity 1 (1.5)] × 0.5 = 0.75
    // → 12.49 + FREE [foretell 1 (1.0) + draw 2 (4.0)] = 5.0 → 17.49 → rare
    // band 7-19 (Aporia). FREE share 5.0/17.49 = 28.6% ✓.
    free: { foretell: 1, drawCards: 2 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 3, duration: 3 },
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 3 },
    ],
    threshold: { color: 'mind', count: 4, rider: { bonusIntensity: 1 } },
    addedIn: '2026-07-18',
    tags: ['oracle', 'dot', 'dice'],
};

/** The MARK-cashing payoff — every exposure the readings painted comes due at
 *  once. The closer is a DEFERRED rider (`{ kind: 'rider' }` payloads resolve
 *  in the firedRiders pass, AFTER inline mechanics), so nothing on this card
 *  may touch the mark bed inline: the earlier consume_affliction probe was cut
 *  (review 2026-07-18 — on a marks-only board, the pool's signature state,
 *  the inline consume fell back to the merged MARK and ate the closer's fuel
 *  for zero). The RUPTURE-1 axis stays with half-spoken-prophecy, which has
 *  no mark closer to cannibalize. In its place: the deep read and the Soul.
 *  The X-die fate line makes even a dead tray read the verdict. */
const theReckoningReadAloud: Card = {
    id: 'the-reckoning-read-aloud',
    theme: 'oracle',
    name: 'The Reckoning, Read Aloud',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Every mark you set on them was a line in a ledger kept out loud. ' +
        'Tonight the whole page is read back, and the reading is collection.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: RUPTURE MARKS 4/stack (4 × 2/3 ≈ 2.67) + FORETELL 3 (3.0) + 1 Soul
    // (0.75) = 6.42 + fate [foretell 1 (1.0) + draw 1 (2.0)] × 0.7 = 2.1 −
    // recoil 3 × (1/3) × 0.75 = −0.75 → net fate 1.35 → 7.77 + FREE
    // [foretell 1 (1.0) + draw 1 (2.0)] = 3.0 → 10.77 → rare band 7-19
    // (Axiom). FREE share 3.0/10.77 = 27.9% ✓.
    free: { foretell: 1, drawCards: 1 },
    specialMechanics: [
        { kind: 'rider', rider: { ruptureMarks: 4 } },
        { kind: 'foretell', count: 3 },
        { kind: 'soul_gain', count: 1 },
    ],
    fate: { rider: { foretell: 1, drawCards: 1 }, recoilHp: 3 },
    addedIn: '2026-07-18',
    tags: ['oracle', 'payoff', 'dice'],
};

/** The information capstone — tomorrow delivered whole: the deep read, the
 *  full hand, and one last wager on top. OMEN react slot. */
const tomorrowInFull: Card = {
    id: 'tomorrow-in-full',
    theme: 'oracle',
    name: 'Tomorrow, in Full',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Not a glimpse. The entire day, delivered early: its order, its ' +
        'weather, its one mistake — and a wager on the hour it happens.',
    tier: 2, rank: 6, cardType: 'spell',
    targetType: 'self',
    // pts: FORETELL 4 (4.0) + DRAW 2 (4.0) + conviction 2 (2.0) = 10.0 +
    // OMEN(draw 2 = 4.0 × 0.6 = 2.4 + omenInfo 1.0 − ante 2 × 0.75 = −1.5) =
    // 1.9 → 11.9 + FREE [foretell 2 (2.0) + draw 1 (2.0)] = 4.0 → 15.9 →
    // rare band 7-19 (Aporia). FREE share 4.0/15.9 = 25.2% ✓.
    free: { foretell: 2, drawCards: 1 },
    specialMechanics: [
        { kind: 'foretell', count: 4 },
        { kind: 'rider', rider: { drawCards: 2, conviction: 2 } },
        { kind: 'omen', maxWindow: 2, anteConviction: 2, rider: { drawCards: 2 } },
    ],
    addedIn: '2026-07-18',
    tags: ['oracle', 'draw', 'omen'],
};

/** The two-part sentence — the first half lands on cast; the second half is
 *  staked on the claim and lands as a fresh wound when it proves true. The
 *  omen-as-affliction-source probe. OMEN react slot. */
const sentenceYetUnserved: Card = {
    id: 'sentence-yet-unserved',
    theme: 'oracle',
    name: 'Sentence Yet Unserved',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Half the verdict is served today. The remainder is held in trust, ' +
        'and the moment they act as foreseen, it is served in full.',
    tier: 2, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i2 d3 (tempo-weighted ≈ 6.33) + OMEN([poison i2 d2 via
    // applyEffect (≈ 4.27) + draw 1 (2.0)] = 6.27 × 0.6 = 3.76 + omenInfo 1.0
    // − ante 3 × 0.75 = −2.25) = 2.51 → 8.84 + FREE [foretell 1 (1.0) +
    // draw 1 (2.0)] = 3.0 → 11.84 → rare band 7-19 (Aporia).
    // FREE share 3.0/11.84 = 25.3% ✓.
    free: { foretell: 1, drawCards: 1 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 2, duration: 3 },
    ],
    specialMechanics: [
        {
            kind: 'omen',
            maxWindow: 2,
            anteConviction: 3,
            rider: {
                applyEffect: { effectId: 'debuff_poison', intensity: 2, duration: 2, to: 'opponent' },
                drawCards: 1,
            },
        },
    ],
    addedIn: '2026-07-18',
    tags: ['oracle', 'omen', 'dot'],
};

// ─── The set ─────────────────────────────────────────────────────────────────

export const SWAP_POOL_ORACLE: SandboxCardSet = {
    id: 'swap-oracle',
    name: 'Swap pool: oracle',
    description:
        'Thirty new oracle spells for /deck-tuning swap experiments on the ' +
        'augury preset. Probes three things the shipped seven cannot: FORETELL ' +
        'carrier density at the x4 common seats (the Dawncaster lesson — cheap ' +
        'scry commons feed the volume payoffs), OMEN as a real staked engine ' +
        'across every rarity band, and whether the rare seats prefer an ' +
        'omen-fueled detonation, a MARK-cashing reckoning, or pure information ' +
        'dominance.',
    cards: [
        // commons (10)
        omenOfRain, readTheEntrails, theBlowAlreadyRead, eyeBeforeTheStorm,
        steadyAugur, smallWager, theCalledShot, scatteredAuspices,
        theUnreadCard, convergingSigns,
        // uncommons (11; half-spoken-prophecy promoted out 2026-07-19)
        theDoomINamed, beforeTheFirstWord, theAvertedBlow, recastTheLots,
        thePageTurnsBack, stakeTheFuture, slowWritDoom,
        venomInTheStars, theBraceForetold, readToTheEnd, theLengtheningShadow,
        // rares (8)
        allOmensDue, theGrandPrognostication, eyesOfTheAeon, theInviolateHour,
        writOfRuin, theReckoningReadAloud, tomorrowInFull, sentenceYetUnserved,
    ],
};
