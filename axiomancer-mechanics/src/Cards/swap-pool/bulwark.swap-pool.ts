/**
 * Swap pool: BULWARK — 30 new sandbox spells for the bastion preset
 * (owner-ratified 2026-07-18: per-theme swap pools feed /deck-tuning's
 * 15-card preset recipe ONLY — never player-facing, never presets, never
 * cards.library.ts).
 *
 * Theme gist (spec 32 §6 T9): Guard/Thorns/Riposte — their aggression kills
 * them. Vocabulary: the bulwark hallmarks (THORNS, RIPOSTE) + the family
 * utilities (GUARD incl. the merged persistent BARRIER sense, HEAL) + the
 * generic utility verbs, each registry-legal (spec 32 §3) with honest
 * provenance: MARK's in-theme precedent is the Hedgehog's Dilemma
 * enchantment (its THORNS reflections print marks); the ruptureMarks
 * payoff closer's is sandbox grit-between-stones (cards.sandbox-sets.ts) —
 * no LIBRARY bulwark card carries it; DRAW / CLEANSE / the die valves /
 * the ledger and turn-shape condition gates are new-to-theme utility
 * usage. No new keywords, no new mechanic
 * kinds — everything below composes existing CardSpecialMechanic /
 * CardRider / SynergyStatePredicate members and live effect ids
 * (buff_thorns, debuff_nettle_sting, debuff_mark).
 *
 * Dawncaster prior-art shaping (receipts in the fan-out report):
 * fading block (Armor) is the genre's HIGHEST-density defensive carrier
 * (~85/1692 cards) with persistent block (Barrier) deliberately scarcer
 * (~30) and full-return reflect (Reflect) RARE (4 carriers) — so this
 * pool keeps GUARD/BARRIER on the common x4 seats, spreads THORNS from
 * common up, and concentrates RIPOSTE (our full-block-gated reflect) at
 * uncommon/rare. Rally (heal per enemy card play) is the genre precedent
 * for sustain keyed off the enemy's aggression — echoed here in the
 * enemy-drew-blood / enemy-dealt-no-damage ledger conditions.
 *
 * Every FREE line deposits bulwark's theme currency (a persistent BARRIER
 * brick, phase 30 law) plus at most a weak utility kicker; every tier-2+
 * card carries exactly ONE of threshold / dieBonus / fate / die-valve /
 * riposte(react) / state-predicate condition. Pricing arithmetic per card
 * mirrors `scoreCard` (cards.pricing.ts) verb by verb.
 */

import type { Card } from '../types';
import type { SandboxCardSet } from '../cards.sandbox-sets';

// ─── COMMONS (10 — ranks 1-2, tier 1: simple, reliable, x4-seat candidates) ──

/** Dry-Stone Course — the plainest defend line: a fading course of Guard over
 *  a brick that never fades. The x4-seat baseline the rest of the pool is
 *  measured against. */
const dryStoneCourse: Card = {
    id: 'dry-stone-course',
    theme: 'bulwark',
    name: 'Dry-Stone Course',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'One course laid level, without haste and without mortar. Most of it '
        + 'will be struck; some of it was never going anywhere.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: Guard 6 (6 ÷ 4 = 1.5) + BARRIER 2 (2 ÷ 3 = 0.67) = 2.17 + FREE
    // barrier 3 (1.0) = 3.17 → common band 1.5-7.5 (Doxa). FREE share
    // 1.0/3.17 = 31.6% ✓ window.
    free: { barrier: 3 },
    specialMechanics: [
        { kind: 'guard', amount: 6 },
        { kind: 'barrier', amount: 2 },
    ],
    addedIn: '2026-07-18',
    tags: ['bulwark', 'defense', 'swap-pool'],
};

// PROMOTED OUT 2026-07-19 (owner-ratified): `pebble-in-the-boot` moved to
// `cards.library.ts` and the bastion x4 body common seat (arm b1,
// docs/reports/deck-tuning-2026-07-18.md — mid blind 0.070→0.133).

/** Lean Into the Shield — the fading-block common with a die-color sweetener:
 *  two points of Brace for Impact's guard traded away for a matched-die surge
 *  of extra guard (guard, not barrier — condition riders resolve on the PAID
 *  fired-riders path, which has no barrier arm). A genuine trade against the
 *  library x4 seat (Guard 6 vs 8), never a strict upgrade. Tier-1 carries its
 *  one allowed die line. */
const leanIntoTheShield: Card = {
    id: 'lean-into-the-shield',
    theme: 'bulwark',
    name: 'Lean Into the Shield',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'The shield is not carried; it is inhabited. Set your whole weight '
        + 'behind it and the blow pays the freight.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: Guard 6 (6 ÷ 4 = 1.5) + dieBonus match [guard 3 (0.75)] × 0.6 =
    // 0.45 + FREE barrier 3 (1.0) = 2.95 → common band 1.5-7.5 (Doxa). FREE
    // share 1.0/2.95 = 33.9% ✓ window.
    free: { barrier: 3 },
    specialMechanics: [{ kind: 'guard', amount: 6 }],
    dieBonus: { onColor: 'match', rider: { guard: 3 } },
    addedIn: '2026-07-18',
    tags: ['bulwark', 'defense', 'swap-pool'],
};

/** Cold Iron Nail — the single-minded sting common: one heavier Nettle Sting,
 *  nothing else. The simplest non-reactive erosion the x4 seats can carry. */
const coldIronNail: Card = {
    id: 'cold-iron-nail',
    theme: 'bulwark',
    name: 'Cold Iron Nail',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Driven once, it does its arguing every hour after. Iron is patient, '
        + 'and so are you.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: nettle sting i2 d3 (printed 12 → tempo-weighted 9.25 ÷ 3 = 3.08)
    // = 3.08 + FREE [barrier 3 (1.0) + heal 1 (0.33)] = 1.33 → 4.42 → common
    // band 1.5-7.5 (Doxa). FREE share 1.33/4.42 = 30.2% ✓ window.
    free: { barrier: 3, healHp: 1 },
    combatEffects: [
        { effectId: 'debuff_nettle_sting', appliedTo: 'opponent', intensity: 2, duration: 3 },
    ],
    addedIn: '2026-07-18',
    tags: ['bulwark', 'dot', 'swap-pool'],
};

/** First Stone Set — the OPENING common (turn-shape condition, WS5 grammar):
 *  the foundation pays double when it is actually laid first. */
const firstStoneSet: Card = {
    id: 'first-stone-set',
    theme: 'bulwark',
    name: 'First Stone Set',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Foundations do not apologize for coming first. Laid before anything '
        + 'else is said, the stone decides where the argument happens.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: Guard 5 (1.25) + BARRIER 3 (1.0) = 2.25 + OPENING (first spell of
    // the turn) rider [guard 5 (1.25)] × threshold 0.5 = 0.63 + FREE barrier
    // 4 (1.33) = 4.21 → common band 1.5-7.5 (Doxa). FREE share 1.33/4.21 =
    // 31.7% ✓ window. Rider is guard-only: the PAID fired-riders path has no
    // barrier arm.
    free: { barrier: 4 },
    specialMechanics: [
        { kind: 'guard', amount: 5 },
        { kind: 'barrier', amount: 3 },
    ],
    synergy: {
        statePredicate: { kind: 'opening', maxPriorSpells: 0 },
        rider: { guard: 5 },
    },
    addedIn: '2026-07-18',
    tags: ['bulwark', 'defense', 'condition', 'sequencing', 'swap-pool'],
};

/** Quickthorn Hedge — the standing-hedge common: the longest THORNS clock in
 *  the commons (thin, but it does not blink) behind a stub of guard. Reads
 *  nothing like nettle-cloak's burst pair — all duration, no sting, a
 *  different composition rather than a same-pair sibling. */
const quickthornHedge: Card = {
    id: 'quickthorn-hedge',
    theme: 'bulwark',
    name: 'Quickthorn Hedge',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Planted in a season, held for a generation. The hedge does not '
        + 'chase; it is simply always where they wanted to go.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: THORNS i1 d4 (0.75 × 1 × 4 = 3.0) + Guard 3 (0.75) = 3.75 + FREE
    // [barrier 4 (1.33) + heal 1 (0.33)] = 1.67 → 5.42 → common band 1.5-7.5
    // (Lemma). FREE share 1.67/5.42 = 30.8% ✓ window.
    free: { barrier: 4, healHp: 1 },
    combatEffects: [
        { effectId: 'buff_thorns', appliedTo: 'self', intensity: 1, duration: 4 },
    ],
    specialMechanics: [{ kind: 'guard', amount: 3 }],
    addedIn: '2026-07-18',
    tags: ['bulwark', 'reflect', 'swap-pool'],
};

/** Patient Masonry — the cycle glue common: a brick and a look at what the
 *  wall wants next. The pool's cheapest card-advantage seat. */
const patientMasonry: Card = {
    id: 'patient-masonry',
    theme: 'bulwark',
    name: 'Patient Masonry',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Study the wall before you add to it. Each course teaches the shape '
        + 'of the next.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: BARRIER 4 (4 ÷ 3 = 1.33) + DRAW 1 (2.0) = 3.33 + FREE [barrier 3
    // (1.0) + heal 1 (0.33)] = 1.33 → 4.67 → common band 1.5-7.5 (Lemma).
    // FREE share 1.33/4.67 = 28.6% ✓ window.
    free: { barrier: 3, healHp: 1 },
    specialMechanics: [
        { kind: 'barrier', amount: 4 },
        { kind: 'rider', rider: { drawCards: 1 } },
    ],
    addedIn: '2026-07-18',
    tags: ['bulwark', 'defense', 'draw', 'swap-pool'],
};

/** Toll of the Gate — the mark-forward common: name the price of approach
 *  (MARK fuel for the theme's ruptureMarks closers) behind a modest shield. */
const tollOfTheGate: Card = {
    id: 'toll-of-the-gate',
    theme: 'bulwark',
    name: 'Toll of the Gate',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'Passage was never free. Name the price at the gate, in writing, and '
        + 'collect it from everyone who insists.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: MARK i2 d2 (0.75 × 2 × 2 = 3.0) + Guard 4 (1.0) = 4.0 + FREE
    // [barrier 4 (1.33) + guard 1 (0.25)] = 1.58 → 5.58 → common band
    // 1.5-7.5 (Lemma). FREE share 1.58/5.58 = 28.4% ✓ window.
    free: { barrier: 4, guard: 1 },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 2 },
    ],
    specialMechanics: [{ kind: 'guard', amount: 4 }],
    addedIn: '2026-07-18',
    tags: ['bulwark', 'defense', 'swap-pool'],
};

/** Tortoise Doctrine — the sustain common (HEAL is family vocabulary the
 *  existing 7 never exercised): mend, shed one affliction, keep the shell up. */
const tortoiseDoctrine: Card = {
    id: 'tortoise-doctrine',
    theme: 'bulwark',
    name: 'Tortoise Doctrine',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Outlive the argument. The shell is not a retreat — it is the whole '
        + 'position, stated once and then merely maintained.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: HEAL 4 (4 ÷ 3 = 1.33) + CLEANSE 1 (1.5) + Guard 4 (1.0) = 3.83 +
    // FREE [barrier 4 (1.33) + heal 1 (0.33)] = 1.67 → 5.5 → common band
    // 1.5-7.5 (Lemma). FREE share 1.67/5.5 = 30.3% ✓ window.
    free: { barrier: 4, healHp: 1 },
    specialMechanics: [
        { kind: 'rider', rider: { healHp: 4, cleanse: 1 } },
        { kind: 'guard', amount: 4 },
    ],
    addedIn: '2026-07-18',
    tags: ['bulwark', 'sustain', 'defense', 'swap-pool'],
};

/** Spiteful Splinters — the thorns-plus-mark common: the cloak that also
 *  files charges, feeding the theme's mark-payoff closers. */
const spitefulSplinters: Card = {
    id: 'spiteful-splinters',
    theme: 'bulwark',
    name: 'Spiteful Splinters',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Old wood breaks mean. What comes off the palisade stays under their '
        + 'skin, named and numbered.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: THORNS i2 d2 (0.75 × 2 × 2 = 3.0) + MARK i1 d2 (1.5) = 4.5 + FREE
    // [barrier 4 (1.33) + heal 1 (0.33)] = 1.67 → 6.17 → common band 1.5-7.5
    // (Lemma). FREE share 1.67/6.17 = 27.0% ✓ window.
    free: { barrier: 4, healHp: 1 },
    combatEffects: [
        { effectId: 'buff_thorns', appliedTo: 'self', intensity: 2, duration: 2 },
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    addedIn: '2026-07-18',
    tags: ['bulwark', 'reflect', 'swap-pool'],
};

// ─── UNCOMMONS (12 — ranks 3-4, tier 2: the theme's engine) ──────────────────

/** Bristling Parapet — the thorns engine seat: a longer, thinner cloak than
 *  library tu-quoque's (i2 d3 vs i3 d2 — score-identical, a real trade at the
 *  same rank, never a strict upgrade), with the body-die threshold line that
 *  grows the hedge and shores the wall as the actual differentiator. */
const bristlingParapet: Card = {
    id: 'bristling-parapet',
    theme: 'bulwark',
    name: 'Bristling Parapet',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'A wall grown its own opinions. Man it with nothing and it holds the '
        + 'argument alone.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: THORNS i2 d3 (0.75 × 2 × 3 = 4.5) + threshold body 2 [thorns i1
    // d2 self (1.5) + guard 3 (0.75)] × 0.5 = 1.13 + FREE [barrier 5 (1.67)
    // + heal 1 (0.33)] = 2.0 → 7.63 → uncommon band 4.5-13 (Thesis). FREE
    // share 2.0/7.63 = 26.2% ✓ window.
    free: { barrier: 5, healHp: 1 },
    combatEffects: [
        { effectId: 'buff_thorns', appliedTo: 'self', intensity: 2, duration: 3 },
    ],
    threshold: {
        color: 'body', count: 2,
        rider: {
            applyEffect: { effectId: 'buff_thorns', intensity: 1, duration: 2, to: 'self' },
            guard: 3,
        },
    },
    addedIn: '2026-07-18',
    tags: ['bulwark', 'reflect', 'condition', 'swap-pool'],
};

/** The Waiting Answer — the riposte engine seat (react = its one die line),
 *  and the pool's ONLY guard+riposte uncommon: a deliberate sidegrade A/B
 *  against library measured-answer — thinner guard (4 vs 6), heavier reply
 *  (4/2 vs 3/2). Dawncaster keeps full-return reflect rare and
 *  timing-shaped — this is the timing bet at uncommon. */
const theWaitingAnswer: Card = {
    id: 'the-waiting-answer',
    theme: 'bulwark',
    name: 'The Waiting Answer',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'You had the reply before they raised the question. Hold it, let the '
        + 'blow spend itself, then say it once.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: Guard 4 (1.0) + RIPOSTE 4/parry 2 ((4 + 2) × 0.8 = 4.8) = 5.8 +
    // FREE [barrier 5 (1.67) + heal 1 (0.33)] = 2.0 → 7.8 → uncommon band
    // 4.5-13 (Thesis). FREE share 2.0/7.8 = 25.6% ✓ window. RIPOSTE's 4 is a
    // floor — the counter scales to the full prevented blow (unscored upside,
    // phase 32 part 2 precedent).
    free: { barrier: 5, healHp: 1 },
    specialMechanics: [
        { kind: 'guard', amount: 4 },
        { kind: 'riposte', damage: 4, reduce: 2 },
    ],
    addedIn: '2026-07-18',
    tags: ['bulwark', 'reflect', 'swap-pool'],
};

/** Stone Remembers — the drew-blood ledger condition (Rally-lineage: the
 *  enemy's own aggression funds the answer): if they landed damage since your
 *  last turn, the wall stings back and knits. */
const stoneRemembers: Card = {
    id: 'stone-remembers',
    theme: 'bulwark',
    name: 'Stone Remembers',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Every blow the wall has taken is still in the wall. Strike it again '
        + 'and the ledger answers back.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: THORNS i2 d3 (0.75 × 2 × 3 = 4.5) + DREW-BLOOD rider [nettle
    // sting i2 d2 (7.0 ÷ 3 = 2.33) + heal 2 (0.67)] × threshold 0.5 = 1.5 +
    // FREE [barrier 5 (1.67) + heal 2 (0.67)] = 2.33 → 8.33 → uncommon band
    // 4.5-13 (Thesis). FREE share 2.33/8.33 = 28.0% ✓ window.
    free: { barrier: 5, healHp: 2 },
    combatEffects: [
        { effectId: 'buff_thorns', appliedTo: 'self', intensity: 2, duration: 3 },
    ],
    synergy: {
        statePredicate: { kind: 'enemy-drew-blood' },
        rider: {
            applyEffect: { effectId: 'debuff_nettle_sting', intensity: 2, duration: 2 },
            healHp: 2,
        },
    },
    addedIn: '2026-07-18',
    tags: ['bulwark', 'reflect', 'condition', 'dot', 'swap-pool'],
};

/** Spike the Breach — the budget riposte-plus-clock: a light parry over a
 *  slow sting, so the counter-stance still erodes when they refuse to swing. */
const spikeTheBreach: Card = {
    id: 'spike-the-breach',
    theme: 'bulwark',
    name: 'Spike the Breach',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Where they mean to come through, leave something waiting. The gap '
        + 'is the trap.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: RIPOSTE 2/parry 2 ((2 + 2) × 0.8 = 3.2) + nettle sting i1 d3
    // (4.63 ÷ 3 = 1.54) = 4.74 + FREE [barrier 4 (1.33) + heal 1 (0.33)] =
    // 1.67 → 6.41 → uncommon band 4.5-13 (Thesis). FREE share 1.67/6.41 =
    // 26.0% ✓ window.
    free: { barrier: 4, healHp: 1 },
    combatEffects: [
        { effectId: 'debuff_nettle_sting', appliedTo: 'opponent', intensity: 1, duration: 3 },
    ],
    specialMechanics: [{ kind: 'riposte', damage: 2, reduce: 2 }],
    addedIn: '2026-07-18',
    tags: ['bulwark', 'reflect', 'dot', 'swap-pool'],
};

/** The Counterweight — bulwark's fate line (the X die set into the wall):
 *  a heavy MARK account, and the impossible die files two more charges for a
 *  small blood price. */
const theCounterweight: Card = {
    id: 'the-counterweight',
    theme: 'bulwark',
    name: 'The Counterweight',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Set the impossible stone in the scale and the whole account tips. '
        + 'What cannot be rolled can still be weighed against them.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: MARK i2 d3 (0.75 × 2 × 3 = 4.5) + Guard 5 (1.25) = 5.75 + FATE
    // [mark i2 d2 (3.0)] × 0.7 − recoil 2 × (1/3) × 0.75 (= 2.1 − 0.5 = 1.6)
    // + FREE [barrier 6 (2.0) + heal 2 (0.67)] = 2.67 → 10.02 → uncommon
    // band 4.5-13 (Thesis). FREE share 2.67/10.02 = 26.6% ✓ window.
    free: { barrier: 6, healHp: 2 },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 3 },
    ],
    specialMechanics: [{ kind: 'guard', amount: 5 }],
    fate: {
        rider: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 2 } },
        recoilHp: 2,
    },
    addedIn: '2026-07-18',
    tags: ['bulwark', 'defense', 'fate', 'swap-pool'],
};

/** Written in Scar — the mark-cycle engine: cash the standing charges
 *  (closer FIRST — it never eats its own plant, a-sweeter-poison rider-order
 *  precedent), then open a fresh page and a slow sting. */
const writtenInScar: Card = {
    id: 'written-in-scar',
    theme: 'bulwark',
    name: 'Written in Scar',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'The wall keeps minutes. Read the standing charges aloud, collect '
        + 'them in full, and open a fresh page in their skin.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: payoff-class closer ruptureMarks 1 (1 × 2/3 = 0.67, cashes
    // STANDING marks only — the plant lands after) + MARK i1 d3 plant (0.75
    // × 1 × 3 = 2.25) + nettle sting i2 d2 (7.0 ÷ 3 = 2.33) = 5.25 + UNMOVED
    // rider [guard 5 (1.25) + heal 2 (0.67)] × threshold 0.5 = 0.96 + FREE
    // [barrier 5 (1.67) + heal 2 (0.67)] = 2.33 → 8.54 → uncommon band
    // 4.5-13 (Thesis). FREE share 2.33/8.54 = 27.3% ✓ window. Rider is
    // guard-shaped: the PAID fired-riders path has no barrier arm.
    free: { barrier: 5, healHp: 2 },
    combatEffects: [
        { effectId: 'debuff_nettle_sting', appliedTo: 'opponent', intensity: 2, duration: 2 },
    ],
    specialMechanics: [
        { kind: 'rider', rider: { ruptureMarks: 1 } },
        { kind: 'rider', rider: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 3 } } },
    ],
    synergy: {
        statePredicate: { kind: 'enemy-dealt-no-damage-last-round' },
        rider: { guard: 5, healHp: 2 },
    },
    addedIn: '2026-07-18',
    tags: ['bulwark', 'payoff', 'condition', 'swap-pool'],
};

/** Mason's Rhythm — the REFRESH die valve in bulwark colors (hold-the-line
 *  banks; this one returns the hand to the hod): a brick, the die back, and
 *  a breath. */
const masonsRhythm: Card = {
    id: 'masons-rhythm',
    theme: 'bulwark',
    name: "Mason's Rhythm",
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Lay, tap, return the hand to the hod. The wall rises because '
        + 'nothing about the motion is wasted.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts: BARRIER 7 (7 ÷ 3 = 2.33) + REFRESH the powering die (2.0) + HEAL
    // 3 (1.0) = 5.33 + FREE [barrier 5 (1.67) + heal 1 (0.33)] = 2.0 → 7.33
    // → uncommon band 4.5-13 (Theorem). FREE share 2.0/7.33 = 27.3% ✓ window.
    free: { barrier: 5, healHp: 1 },
    specialMechanics: [
        { kind: 'barrier', amount: 7 },
        { kind: 'refresh_die' },
        { kind: 'rider', rider: { healHp: 3 } },
    ],
    addedIn: '2026-07-18',
    tags: ['bulwark', 'defense', 'dice', 'valve', 'swap-pool'],
};

/** Grudge of Granite — the deliberate A/B against sandbox grit-between-stones
 *  (cards.sandbox-sets.ts, same rank 4, same sting clock i2 d3): grit backs
 *  the sting with Guard 6 and a 2-stack closer; grudge drops the guard for a
 *  heavier closer (3) and a body-die line that files the grievance deeper
 *  and longer. Same seat, two supports — the matrix decides between them. */
const grudgeOfGranite: Card = {
    id: 'grudge-of-granite',
    theme: 'bulwark',
    name: 'Grudge of Granite',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Granite forgives nothing and forgets less. The grievance is filed '
        + 'under their skin at survey accuracy.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: nettle sting i2 d3 (printed 12 → tempo-weighted 9.25 ÷ 3 = 3.08)
    // + payoff-class closer ruptureMarks 3 (3 × 2/3 = 2.0) = 5.08 + dieBonus
    // body [+1 intensity (1.5) + +1 turn (1.0)] × 0.6 = 1.5 + FREE [barrier
    // 6 (2.0) + heal 2 (0.67)] = 2.67 → 9.25 → uncommon band 4.5-13
    // (Theorem). FREE share 2.67/9.25 = 28.9% ✓ window.
    free: { barrier: 6, healHp: 2 },
    combatEffects: [
        { effectId: 'debuff_nettle_sting', appliedTo: 'opponent', intensity: 2, duration: 3 },
    ],
    specialMechanics: [{ kind: 'rider', rider: { ruptureMarks: 3 } }],
    dieBonus: { onColor: 'body', rider: { bonusIntensity: 1, bonusDuration: 1 } },
    addedIn: '2026-07-18',
    tags: ['bulwark', 'dot', 'payoff', 'swap-pool'],
};

/** Hedge of Spears — the heavy thorns seat: the biggest cloak in the pool
 *  below rare, thresholded to keep growing while body dice are spent. */
const hedgeOfSpears: Card = {
    id: 'hedge-of-spears',
    theme: 'bulwark',
    name: 'Hedge of Spears',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Not a wall — a schedule of consequences, set at chest height. '
        + 'Advancing becomes a decision they make about themselves.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts: THORNS i4 d2 (0.75 × 4 × 2 = 6.0) + threshold body 3 [guard 4
    // (1.0) + thorns i1 d2 self (1.5)] × 0.5 = 1.25 + FREE [barrier 6 (2.0)
    // + heal 2 (0.67)] = 2.67 → 9.92 → uncommon band 4.5-13 (Theorem). FREE
    // share 2.67/9.92 = 26.9% ✓ window.
    free: { barrier: 6, healHp: 2 },
    combatEffects: [
        { effectId: 'buff_thorns', appliedTo: 'self', intensity: 4, duration: 2 },
    ],
    threshold: {
        color: 'body', count: 3,
        rider: {
            guard: 4,
            applyEffect: { effectId: 'buff_thorns', intensity: 1, duration: 2, to: 'self' },
        },
    },
    addedIn: '2026-07-18',
    tags: ['bulwark', 'reflect', 'condition', 'swap-pool'],
};

/** Shield-Wall Discipline — the card-advantage engine seat: the wall that
 *  teaches. Guard plus two cards, matched dice bracing the line higher
 *  (guard, not barrier — the PAID fired-riders path has no barrier arm). */
const shieldWallDiscipline: Card = {
    id: 'shield-wall-discipline',
    theme: 'bulwark',
    name: 'Shield-Wall Discipline',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'The drill is the argument: shields up, eyes open, learn what the '
        + 'enemy teaches. The line holds because every hand in it is still '
        + 'thinking.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts: Guard 8 (2.0) + DRAW 2 (4.0) = 6.0 + dieBonus match [guard 5
    // (1.25)] × 0.6 = 0.75 + FREE [barrier 6 (2.0) + heal 1 (0.33)] = 2.33 →
    // 9.08 → uncommon band 4.5-13 (Theorem). FREE share 2.33/9.08 = 25.7% ✓
    // window.
    free: { barrier: 6, healHp: 1 },
    specialMechanics: [
        { kind: 'guard', amount: 8 },
        { kind: 'rider', rider: { drawCards: 2 } },
    ],
    dieBonus: { onColor: 'match', rider: { guard: 5 } },
    addedIn: '2026-07-18',
    tags: ['bulwark', 'defense', 'draw', 'swap-pool'],
};

/** The Siege Outlasted — the FINALE condition seat: repair through the turn,
 *  and when the hand runs down to its last cards the garrison eats and the
 *  hedge takes root. Rider payload deliberately DIVERGES from sandbox
 *  the-unmoved-mover's [thorns i2 d2 + guard 4] (cards.sandbox-sets.ts) so
 *  the two gates generate distinguishable telemetry. */
const theSiegeOutlasted: Card = {
    id: 'the-siege-outlasted',
    theme: 'bulwark',
    name: 'The Siege Outlasted',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Sieges are lost by the side that must eat first. Repair, breathe, '
        + 'and when the last card turns, let the wall grow teeth.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts: BARRIER 8 (2.67) + HEAL 4 (1.33) = 4.0 + FINALE (≤2 cards left
    // behind) rider [thorns i1 d3 self (2.25) + heal 3 (1.0)] × threshold
    // 0.5 = 1.63 + FREE [barrier 5 (1.67) + heal 2 (0.67)] = 2.33 → 7.96 →
    // uncommon band 4.5-13 (Theorem). FREE share 2.33/7.96 = 29.3% ✓ window.
    free: { barrier: 5, healHp: 2 },
    specialMechanics: [
        { kind: 'barrier', amount: 8 },
        { kind: 'rider', rider: { healHp: 4 } },
    ],
    synergy: {
        statePredicate: { kind: 'finale', cardsLeftAtMost: 2 },
        rider: {
            applyEffect: { effectId: 'buff_thorns', intensity: 1, duration: 3, to: 'self' },
            healHp: 3,
        },
    },
    addedIn: '2026-07-18',
    tags: ['bulwark', 'sustain', 'condition', 'sequencing', 'swap-pool'],
};

/** The Rebuke in Stone — the premium riposte uncommon, reshaped OFF the
 *  guard+riposte seat (measured-answer's shape; the-waiting-answer holds the
 *  pool's one copy of it): no wall at all — shed the insult (CLEANSE), close
 *  the wound, and hand the whole blow back. Sustain-plus-reply, a read no
 *  library bulwark card has. */
const theRebukeInStone: Card = {
    id: 'the-rebuke-in-stone',
    theme: 'bulwark',
    name: 'The Rebuke in Stone',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Let the whole offense arrive, wipe it off, and correct it. Stone '
        + 'does not raise its voice to be final.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts: RIPOSTE 5/parry 3 ((5 + 3) × 0.8 = 6.4) + CLEANSE 1 (1.5) + HEAL
    // 2 (0.67) = 8.57 + FREE [barrier 7 (2.33) + heal 3 (1.0)] = 3.33 →
    // 11.9 → uncommon band 4.5-13 (Theorem). FREE share 3.33/11.9 = 28.0% ✓
    // window. RIPOSTE floor scales to the prevented blow (unscored upside).
    free: { barrier: 7, healHp: 3 },
    specialMechanics: [
        { kind: 'riposte', damage: 5, reduce: 3 },
        { kind: 'rider', rider: { cleanse: 1, healHp: 2 } },
    ],
    addedIn: '2026-07-18',
    tags: ['bulwark', 'reflect', 'sustain', 'swap-pool'],
};

// ─── RARES (8 — ranks 5-6, tier 2-3: finishers and build-arounds) ────────────

/** The Mountain Answers — the tier-3 riposte finisher, a REAL trade against
 *  library the-adamant-wall (barrier 10 + riposte 4/2): barely more than
 *  half the wall (BARRIER 6), the pool's heaviest reply (7/parry 4). You
 *  keep less stone and say more with it. */
const theMountainAnswers: Card = {
    id: 'the-mountain-answers',
    theme: 'bulwark',
    name: 'The Mountain Answers',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Ask the mountain anything you like. The reply is the mountain.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'self',
    // pts: BARRIER 6 (6 ÷ 3 = 2.0) + RIPOSTE 7/parry 4 ((7 + 4) × 0.8 =
    // 8.8) = 10.8 + FREE [barrier 8 (2.67) + heal 3 (1.0)] = 3.67 → 14.47 →
    // rare band 7-19 (Axiom). FREE share 3.67/14.47 = 25.3% ✓ window.
    // RIPOSTE's 7 is a floor — the counter scales to the full prevented blow
    // (unscored upside, phase 32 part 2 precedent).
    free: { barrier: 8, healHp: 3 },
    specialMechanics: [
        { kind: 'barrier', amount: 6 },
        { kind: 'riposte', damage: 7, reduce: 4 },
    ],
    addedIn: '2026-07-18',
    tags: ['bulwark', 'reflect', 'payoff', 'swap-pool'],
};

/** Field of Caltrops — the reflect build-around: the widest thorns spread in
 *  the pool over a standing sting, thresholded to sharpen the sting
 *  (bonusIntensity boosts enemy-landed statuses only — the caltrops bite
 *  deeper; the self THORNS is untouched) and brace the line. */
const fieldOfCaltrops: Card = {
    id: 'field-of-caltrops',
    theme: 'bulwark',
    name: 'Field of Caltrops',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Sow the ground itself with refusals. However they come on, they '
        + 'come on bleeding — and the field never tires of the point.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'self',
    // pts: THORNS i3 d3 (0.75 × 3 × 3 = 6.75) + nettle sting i2 d3 (printed
    // 12 → tempo-weighted 9.25 ÷ 3 = 3.08) = 9.83 + threshold body 3 [+1
    // intensity, enemy-landed (1.5) + guard 5 (1.25)] × 0.5 = 1.38 + FREE
    // [barrier 9 (3.0) + heal 3 (1.0)] = 4.0 → 15.21 → rare band 7-19
    // (Axiom). FREE share 4.0/15.21 = 26.3% ✓ window.
    free: { barrier: 9, healHp: 3 },
    combatEffects: [
        { effectId: 'buff_thorns', appliedTo: 'self', intensity: 3, duration: 3 },
        { effectId: 'debuff_nettle_sting', appliedTo: 'opponent', intensity: 2, duration: 3 },
    ],
    threshold: {
        color: 'body', count: 3,
        rider: { bonusIntensity: 1, guard: 5 },
    },
    addedIn: '2026-07-18',
    tags: ['bulwark', 'reflect', 'dot', 'swap-pool'],
};

/** The Grinding Wall — the mark-payoff finisher: collect the standing account
 *  at 3 per stack (closer FIRST in the mech chain — it never cashes its own
 *  plant), then file the next decade of charges. The body-die line is
 *  deliberately NOT mark-shaped: dieBonus riders are collected before the
 *  mech chain (combat.engine.ts collection order), so a die-line mark would
 *  land ahead of the closer and be eaten same-play — a sting is outside the
 *  account. Replays across reshuffles as a slow engine. */
const theGrindingWall: Card = {
    id: 'the-grinding-wall',
    theme: 'bulwark',
    name: 'The Grinding Wall',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'The wall advances a finger-width a year and has never once '
        + 'retreated. First it collects what it is owed; then it files the '
        + 'next decade of charges.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: payoff-class closer ruptureMarks 3 (3 × 2/3 = 2.0, cashes
    // STANDING marks — the mech-chain plant lands after, a-sweeter-poison
    // rider-order precedent) + MARK i3 d3 plant (0.75 × 3 × 3 = 6.75) +
    // Guard 6 (1.5) = 10.25 + dieBonus body [nettle sting i1 d2 (printed 4 →
    // tempo-weighted 3.5 ÷ 3 = 1.17)] × 0.6 = 0.7 + FREE [barrier 10 (3.33)
    // + heal 3 (1.0)] = 4.33 → 15.28 → rare band 7-19 (Axiom). FREE share
    // 4.33/15.28 = 28.4% ✓ window.
    free: { barrier: 10, healHp: 3 },
    specialMechanics: [
        { kind: 'rider', rider: { ruptureMarks: 3 } },
        { kind: 'rider', rider: { applyEffect: { effectId: 'debuff_mark', intensity: 3, duration: 3 } } },
        { kind: 'guard', amount: 6 },
    ],
    dieBonus: {
        onColor: 'body',
        rider: { applyEffect: { effectId: 'debuff_nettle_sting', intensity: 1, duration: 2 } },
    },
    addedIn: '2026-07-18',
    tags: ['bulwark', 'payoff', 'swap-pool'],
};

// PROMOTED OUT 2026-07-19 (owner-ratified): `the-anvil-speaks` moved to
// `cards.library.ts` and the bastion rare body spell seat (arm b3,
// docs/reports/deck-tuning-2026-07-18.md — mid +0.030; also inherits the
// bastion D8 valve seat from the-adamant-wall).

/** The Palisade Repays — the hybrid reflect finisher: standing thorns AND an
 *  armed riposte in one play — contact costs, and a fully-blocked swing
 *  costs double. */
const thePalisadeRepays: Card = {
    id: 'the-palisade-repays',
    theme: 'bulwark',
    name: 'The Palisade Repays',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Debts to the wall accrue on contact and are settled the same '
        + 'instant, with interest, in kind.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'self',
    // pts: THORNS i2 d3 (0.75 × 2 × 3 = 4.5) + RIPOSTE 4/parry 2 ((4 + 2) ×
    // 0.8 = 4.8) = 9.3 + FREE [barrier 8 (2.67) + heal 3 (1.0)] = 3.67 →
    // 12.97 → rare band 7-19 (Axiom). FREE share 3.67/12.97 = 28.3% ✓ window.
    free: { barrier: 8, healHp: 3 },
    combatEffects: [
        { effectId: 'buff_thorns', appliedTo: 'self', intensity: 2, duration: 3 },
    ],
    specialMechanics: [{ kind: 'riposte', damage: 4, reduce: 2 }],
    addedIn: '2026-07-18',
    tags: ['bulwark', 'reflect', 'payoff', 'swap-pool'],
};

/** Last Stone Standing — the tier-3 FINALE build-around: the biggest brick in
 *  the pool, and played as the hand's last word the ruin itself grows thorns
 *  and holds the line (finale guard, not barrier — the PAID fired-riders
 *  path has no barrier arm). */
const lastStoneStanding: Card = {
    id: 'last-stone-standing',
    theme: 'bulwark',
    name: 'Last Stone Standing',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'When everything else has been spent, the stone is still there — and '
        + 'it has been taking notes. Say it last and the ruin itself refuses '
        + 'them.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'self',
    // pts: BARRIER 12 (12 ÷ 3 = 4.0) + HEAL 5 (1.67) = 5.67 + FINALE (≤1
    // card left behind) rider [thorns i3 d2 self (4.5) + guard 8 (2.0)] ×
    // threshold 0.5 = 3.25 + FREE [barrier 9 (3.0) + heal 3 (1.0)] = 4.0 →
    // 12.92 → rare band 7-19 (Aporia). FREE share 4.0/12.92 = 31.0% ✓ window.
    free: { barrier: 9, healHp: 3 },
    specialMechanics: [
        { kind: 'barrier', amount: 12 },
        { kind: 'rider', rider: { healHp: 5 } },
    ],
    synergy: {
        statePredicate: { kind: 'finale', cardsLeftAtMost: 1 },
        rider: {
            applyEffect: { effectId: 'buff_thorns', intensity: 3, duration: 2, to: 'self' },
            guard: 8,
        },
    },
    addedIn: '2026-07-18',
    tags: ['bulwark', 'defense', 'condition', 'sequencing', 'swap-pool'],
};

/** Oath of the Keep — the sustain capstone: whole walls, closed wounds, and a
 *  reward for a round the enemy could not touch you (the UNMOVED ledger).
 *  HEAL/CLEANSE at rare weight — the family verb the theme never scaled. */
const oathOfTheKeep: Card = {
    id: 'oath-of-the-keep',
    theme: 'bulwark',
    name: 'Oath of the Keep',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'The keep swore to no one and outlived everyone who asked. Renew the '
        + 'oath: whole walls, closed wounds, and not one inch of ground '
        + 'revisited.',
    tier: 2, rank: 6, cardType: 'spell',
    targetType: 'self',
    // pts: CLEANSE 2 (2 × 1.5 = 3.0) + HEAL 6 (2.0) + BARRIER 8 (2.67) =
    // 7.67 + UNMOVED rider [heal 4 (1.33) + guard 7 (1.75)] × threshold
    // 0.5 = 1.54 + FREE [barrier 9 (3.0) + heal 3 (1.0)] = 4.0 → 13.21 →
    // rare band 7-19 (Aporia). FREE share 4.0/13.21 = 30.3% ✓ window. Rider
    // is guard-shaped: the PAID fired-riders path has no barrier arm.
    free: { barrier: 9, healHp: 3 },
    specialMechanics: [
        { kind: 'rider', rider: { cleanse: 2, healHp: 6 } },
        { kind: 'barrier', amount: 8 },
    ],
    synergy: {
        statePredicate: { kind: 'enemy-dealt-no-damage-last-round' },
        rider: { healHp: 4, guard: 7 },
    },
    addedIn: '2026-07-18',
    tags: ['bulwark', 'sustain', 'condition', 'swap-pool'],
};

/** Unbreachable — the tier-3 wall finisher: every defense the theme owns in
 *  one verdict — fading guard, standing barrier, the heaviest full-block
 *  reply in the pool, and one insult wiped off the ledger (CLEANSE — the
 *  read library the-adamant-wall never carries, so the capstone seat A/Bs
 *  on shape, not just size). Ceiling-adjacent by design. */
const unbreachable: Card = {
    id: 'unbreachable',
    theme: 'bulwark',
    name: 'Unbreachable',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'There is a ledger of what has passed this wall. It is very old, and '
        + 'it is blank.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'self',
    // pts: Guard 6 (6 ÷ 4 = 1.5) + BARRIER 10 (10 ÷ 3 = 3.33) + RIPOSTE
    // 5/parry 4 ((5 + 4) × 0.8 = 7.2) + CLEANSE 1 (1.5) = 13.53 + FREE
    // [barrier 10 (3.33) + heal 4 (1.33)] = 4.67 → 18.2 → rare band 7-19
    // (Aporia, ceiling-adjacent by design). FREE share 4.67/18.2 = 25.6% ✓
    // window.
    free: { barrier: 10, healHp: 4 },
    specialMechanics: [
        { kind: 'guard', amount: 6 },
        { kind: 'barrier', amount: 10 },
        { kind: 'riposte', damage: 5, reduce: 4 },
        { kind: 'rider', rider: { cleanse: 1 } },
    ],
    addedIn: '2026-07-18',
    tags: ['bulwark', 'reflect', 'defense', 'payoff', 'swap-pool'],
};

/** The bulwark swap pool — /deck-tuning swap candidates ONLY (never
 *  player-facing, never auto-registered; apply via the sandbox machinery). */
export const SWAP_POOL_BULWARK: SandboxCardSet = {
    id: 'swap-bulwark',
    name: 'Swap pool: bulwark',
    description:
        'Thirty new bulwark spells probing the bastion preset\'s swap seats: '
        + 'guard-first commons reliable enough for the x4 seats (with live '
        + 'Nettle Sting clocks so the wall can kill what never swings), '
        + 'threshold/fate/ledger-condition uncommons that carry the reflect '
        + 'engine, and rare finishers that pay the wall out through RIPOSTE, '
        + 'mark payoffs, and finale walls. Every card composes existing '
        + 'registry vocabulary — no new keywords, no new mechanic kinds.',
    cards: [
        // commons (9; pebble-in-the-boot promoted out 2026-07-19)
        dryStoneCourse, leanIntoTheShield, coldIronNail,
        firstStoneSet, quickthornHedge, patientMasonry, tollOfTheGate,
        tortoiseDoctrine, spitefulSplinters,
        // uncommons (12)
        bristlingParapet, theWaitingAnswer, stoneRemembers, spikeTheBreach,
        theCounterweight, writtenInScar, masonsRhythm, grudgeOfGranite,
        hedgeOfSpears, shieldWallDiscipline, theSiegeOutlasted, theRebukeInStone,
        // rares (7; the-anvil-speaks promoted out 2026-07-19)
        theMountainAnswers, fieldOfCaltrops, theGrindingWall,
        thePalisadeRepays, lastStoneStanding, oathOfTheKeep, unbreachable,
    ],
};
