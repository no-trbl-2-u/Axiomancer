/**
 * Swap pool — AFFLICTION (preset `erosion`), 30 new spells.
 *
 * Owner-ratified 2026-07-18: per-theme pools of NEW cards used ONLY as
 * `/deck-tuning` swap candidates for the 15-card preset recipe (4x2 commons,
 * 2x2 uncommons, 1x3 rares). NOT player-facing, NOT in presets, NOT in
 * `cards.library.ts`. Vocabulary is strictly the shipped registry: hallmarks
 * POISON / BLEED, glue PROLONG / REARGUE, utility MARK / RUPTURE / SIPHON /
 * GUARD / HEAL / CLEANSE / DRAW plus the die valves the library's affliction
 * cards already lean on (recurring-symptom precedent). No new keywords, no
 * new mechanic kinds, no raw HP damage — the strike is dead.
 *
 * Every card ships its `// pts:` arithmetic (spec 32 §4 point table;
 * discounts threshold x0.5 / dieBonus x0.6 / fate x0.7 / state-gate x0.5;
 * self-cost credit -0.75x). Bands: common 1.5-7.5, uncommon 4.5-13,
 * rare 7-19. FREE lines deposit theme currency at 25-35% of total points.
 * MARK is battle-long (`calendarExpiry: false` — an enemy-borne no-calendar
 * effect never counts down), so a printed duration above 1 is paper credit:
 * every MARK deposit here prints its engine-honest d1, and the FREE window
 * is met with REAL currency — MARK intensity, Conviction, heal, draw, and
 * live DoT seeds. Two flagged exceptions (`intentionallyAsymmetric`, cap 3):
 * one paid-face detonation finisher and one deposit-matched A/B probe.
 */

import type { Card } from '../types';
import type { SandboxCardSet } from '../cards.sandbox-sets';

// ─── Commons (9) — simple, reliable, x4-seat candidates ──────────────────────
// PROMOTED OUT 2026-07-19 (owner-ratified): `poisoned-well` moved to
// `cards.library.ts` and the erosion x4 body common seat (arm e1,
// docs/reports/deck-tuning-2026-07-18.md — mid blind 0.370→0.503).

/** The x4-seat live BLEED line: front-loaded, decay-limited, lands its
 *  whole value inside the ~4-round clock. The decay mirror of poisoned-well. */
const aThousandCuts: Card = {
    id: 'a-thousand-cuts',
    theme: 'affliction',
    name: 'A Thousand Cuts',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'No single objection matters. That was never the design. Count them ' +
        'if there is time.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: bleed i2 d2 (damage-instance clock, decay washout: 9 HP ÷ 3 = 3.0)
    // + FREE mark i2 d1 (0.75×2 = 1.5) = 4.5 → common band 1.5-7.5 (Doxa).
    // FREE share 1.5/4.5 = 33.3% ✓.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 1 } },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'dot'],
};

/** The defend common the theme lacks in-library: a plain wall in affliction's
 *  own voice (old wounds harden), so the erosion preset stops borrowing
 *  bulwark seats for survival. */
const scarTissue: Card = {
    id: 'scar-tissue',
    theme: 'affliction',
    name: 'Scar Tissue',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'What healed wrong healed hard. The old arguments close over the new ' +
        'wound, and nothing gets through.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: GUARD 12 (12 ÷ 4 = 3.0) + FREE mark i2 d1 (1.5) = 4.5 → common
    // band 1.5-7.5 (Doxa). FREE share 1.5/4.5 = 33.3% ✓.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 1 } },
    specialMechanics: [{ kind: 'guard', amount: 12 }],
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'defense'],
};

/** Sting-behind-the-shield: a heart-colored common that seeds the ramp AND
 *  holds the line — probes whether a hybrid seat beats two pure seats. */
const theVeiledSting: Card = {
    id: 'the-veiled-sting',
    theme: 'affliction',
    name: 'The Veiled Sting',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'A courtesy offered with the barb already seated. They accept both, ' +
        'and only notice one.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i1 d2 (tempo-weighted 6.41 ÷ 3 = 2.14) + GUARD 8 (2.0) =
    // 4.14 + FREE [mark i1 d1 (0.75) + heal 3 (1.0)] = 1.75 → 5.88 → common
    // band 1.5-7.5 (Lemma). FREE share 1.75/5.88 = 29.7% ✓.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 }, healHp: 3 },
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    specialMechanics: [{ kind: 'guard', amount: 8 }],
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'dot', 'defense'],
};

/** The MARK-density common: a double stack of the universal amp plus a card
 *  of velocity — Dawncaster fills hallmark density with cheap amplifier
 *  commons (Aura of Venom is common-rarity), not rares. */
const nameTheFlaw: Card = {
    id: 'name-the-flaw',
    theme: 'affliction',
    name: 'Name the Flaw',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'Say it plainly, once, for the record. After that, every blow knows ' +
        'where to land.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: mark i2 d1 (0.75×2 = 1.5) + DRAW 1 (2.0) = 3.5 + FREE [mark i1
    // d1 (0.75) + conviction 1 (1.0)] = 1.75 → 5.25 → common band 1.5-7.5
    // (Lemma). FREE share 1.75/5.25 = 33.3% ✓.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 }, conviction: 1 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 1 }],
    specialMechanics: [{ kind: 'rider', rider: { drawCards: 1 } }],
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'glue'],
};

/** The old straw-man shape reborn: a bleed that lands harder on its own
 *  stance color. The pool's one common dieBonus line (tier 2, one die line). */
const nickTheVein: Card = {
    id: 'nick-the-vein',
    theme: 'affliction',
    name: 'Nick the Vein',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description: 'Small, precise, unremarkable. The artery disagrees.',
    tier: 2, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: bleed i2 d2 (9 HP ÷ 3 = 3.0) + dieBonus match [+1 intensity (1.5)]
    // × 0.6 = 0.9 + FREE mark i2 d1 (1.5) = 5.4 → common band 1.5-7.5
    // (Lemma). FREE share 1.5/5.4 = 27.8% ✓. Die line: dieBonus (the one).
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 1 } },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    dieBonus: { onColor: 'match', rider: { bonusIntensity: 1 } },
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'dot'],
};

/** Heart-colored seed-plus-amp: poison and MARK in one breath, sustain on the
 *  FREE line — color coverage for the 5/5/5 preset law without leaving theme. */
const saltInTheWound: Card = {
    id: 'salt-in-the-wound',
    theme: 'affliction',
    name: 'Salt in the Wound',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description: 'The wound was argument enough. The salt is for emphasis.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i1 d2 (2.14) + mark i2 d1 (1.5) = 3.64 + FREE [mark i1 d1
    // (0.75) + heal 2 (0.67)] = 1.42 → 5.05 → common band 1.5-7.5 (Doxa).
    // FREE share 1.42/5.05 = 28.0% ✓.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 }, healHp: 2 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 },
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 1 },
    ],
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'dot', 'glue'],
};

/** The heart defend common: wall plus salve, cold and honest — the second
 *  in-theme survival seat so both defend colors exist at common. */
const coldComfort: Card = {
    id: 'cold-comfort',
    theme: 'affliction',
    name: 'Cold Comfort',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'No cure. Only the honest arithmetic of endurance: numb it, bind it, ' +
        'outlast it.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: GUARD 10 (2.5) + HEAL 3 (1.0) = 3.5 + FREE mark i2 d1 (1.5) = 5.0
    // → common band 1.5-7.5 (Lemma). FREE share 1.5/5.0 = 30.0% ✓.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 1 } },
    specialMechanics: [
        { kind: 'guard', amount: 10 },
        { kind: 'rider', rider: { healHp: 3 } },
    ],
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'defense'],
};

/** Cycle glue at common: a poison seed that replaces itself — the mind-color
 *  reliability seat for decks that stall on draw. */
const catalogueOfIlls: Card = {
    id: 'catalogue-of-ills',
    theme: 'affliction',
    name: 'Catalogue of Ills',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Every symptom filed, cross-referenced, and read aloud. The reading ' +
        'itself does harm.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i1 d2 (2.14) + DRAW 1 (2.0) = 4.14 + FREE mark i2 d1 (1.5)
    // = 5.63 → common band 1.5-7.5 (Lemma). FREE share 1.5/5.63 = 26.6% ✓.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 1 } },
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    specialMechanics: [{ kind: 'rider', rider: { drawCards: 1 } }],
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'dot', 'glue'],
};

/** The opening-condition common: the turn's first spell plants deeper. Probes
 *  whether a sequencing hook is too much text for an x4 seat. */
const firstSymptom: Card = {
    id: 'first-symptom',
    theme: 'affliction',
    name: 'First Symptom',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'It begins as almost nothing — a cough in the argument, a tremor in ' +
        'the premise. Begin there.',
    tier: 2, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i1 d3 (3.16) + opening(0) state rider [+1 intensity (1.5)]
    // × 0.5 = 0.75 + FREE mark i2 d1 (1.5) = 5.41 → common band 1.5-7.5
    // (Doxa). FREE share 1.5/5.41 = 27.7% ✓. Die/condition line: the state
    // predicate (the one).
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 1 } },
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 3 }],
    synergy: {
        statePredicate: { kind: 'opening', maxPriorSpells: 0 },
        rider: { bonusIntensity: 1 },
    },
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'dot', 'condition'],
};

// ─── Uncommons (12) — the engine: PROLONG / REARGUE / amplify / glue ─────────

/** PROLONG carrier #2 (the atlas lists it orphan-tier at 1 card): extend the
 *  board and re-seed it in one play, brighter on the matching die. The FREE
 *  line IS the second infection — a live poison seed, not a token. */
const theSecondInfection: Card = {
    id: 'the-second-infection',
    theme: 'affliction',
    name: 'The Second Infection',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'What ails them learns patience. Nothing on them ends when it ' +
        'promised to.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: PROLONG 1 (extend_dots: 5.5) + poison i1 d2 (2.14) = 7.64 +
    // dieBonus match [+1 duration (1.0)] × 0.6 = 0.6 + FREE [poison seed i1
    // d2 (2.14) + conviction 1 (1.0)] = 3.14 → 11.37 → uncommon band 4.5-13
    // (Theorem). FREE share 3.14/11.37 = 27.6% ✓.
    free: { applyEffect: { effectId: 'debuff_poison', intensity: 1, duration: 2 }, conviction: 1 },
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    specialMechanics: [{ kind: 'extend_dots', turns: 1 }],
    dieBonus: { onColor: 'match', rider: { bonusDuration: 1 } },
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'glue', 'dot'],
};

/** REARGUE carrier #2 — the PLAIN flip. Core constant deliberately differs
 *  from the library's currys-conversion (+1) and this pool's
 *  the-wound-rephrased (+2): bonusIntensity 0, one rank down, a body
 *  threshold doing the cutting instead. The A/B asks whether the conversion
 *  engine wants a cheaper kickerless second seat, not whose riders are
 *  prettier. */
const reopenTheQuestion: Card = {
    id: 'reopen-the-question',
    theme: 'affliction',
    name: 'Reopen the Question',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Settled matter, was it? The wound flips its own premise — no deeper, ' +
        'only different, which is worse when the ledger runs to blood.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: REARGUE +0 (convert_dots: 5 + 0×1.5 = 5.0) + threshold body 2
    // [bleed i2 d2 (3.0)] × 0.5 = 1.5 + FREE [mark i2 d1 (1.5) + conviction 1
    // (1.0)] = 2.5 → 9.0 → uncommon band 4.5-13 (Thesis). FREE share
    // 2.5/9.0 = 27.8% ✓.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 1 }, conviction: 1 },
    specialMechanics: [{ kind: 'convert_dots', bonusIntensity: 0 }],
    threshold: {
        color: 'body', count: 2,
        rider: { applyEffect: { effectId: 'debuff_bleed', intensity: 2, duration: 2 } },
    },
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'glue'],
};

/** The amplifier engine: +1 intensity to every live DoT plus the REROLL
 *  valve (recurring-symptom precedent) — Dawncaster puts DoT doubling at
 *  common (Aura of Venom); ours is priced honestly at uncommon. */
const aggravateTheCase: Card = {
    id: 'aggravate-the-case',
    theme: 'affliction',
    name: 'Aggravate the Case',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Nothing new is argued. Everything already argued argues harder, and ' +
        'the misrolled day is rolled again.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: +1 intensity ALL DoTs (boost_all_dots: 5.0) + REROLL misses
    // (reroll_spent: 2.0) = 7.0 + FREE [poison seed i1 d2 (2.14) +
    // conviction 1 (1.0)] = 3.14 → 10.13 → uncommon band 4.5-13 (Theorem).
    // FREE share 3.14/10.13 = 30.9% ✓. Die line: reroll (the one).
    free: { applyEffect: { effectId: 'debuff_poison', intensity: 1, duration: 2 }, conviction: 1 },
    specialMechanics: [
        { kind: 'boost_all_dots', intensity: 1 },
        { kind: 'reroll_spent' },
    ],
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'glue', 'dice'],
};

/** The finale-condition bleed: played as the hand empties, the parting word
 *  doubles down. Sequencing texture for the heart color. */
const theLastWordFesters: Card = {
    id: 'the-last-word-festers',
    theme: 'affliction',
    name: 'The Last Word Festers',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description: 'Spoken as the door closes, it has the whole night to work.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: bleed i2 d2 (3.0) + mark i2 d1 (1.5) = 4.5 + finale(≤2 left)
    // state rider [bleed i2 d2 (3.0) + heal 3 (1.0)] × 0.5 = 2.0 + FREE
    // [mark i2 d1 (1.5) + heal 3 (1.0)] = 2.5 → 9.0 → uncommon band
    // 4.5-13 (Theorem). FREE share 2.5/9.0 = 27.8% ✓. Condition line:
    // the state predicate (the one).
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 1 }, healHp: 3 },
    combatEffects: [
        { effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 2 },
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 1 },
    ],
    synergy: {
        statePredicate: { kind: 'finale', cardsLeftAtMost: 2 },
        rider: {
            applyEffect: { effectId: 'debuff_bleed', intensity: 2, duration: 2 },
            healHp: 3,
        },
    },
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'dot', 'condition'],
};

/** The off-color poison engine: the WRONG die spreads it better — a home for
 *  stranded dice in a 5/5/5 tray, the straw-man line inverted. */
const creepingContagion: Card = {
    id: 'creeping-contagion',
    theme: 'affliction',
    name: 'Creeping Contagion',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'It spreads by proximity of belief. The wrong die carries it just as ' +
        'well — better, even.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i2 d2 (tempo-weighted 12.81 ÷ 3 = 4.27) + mark i2 d1 (1.5)
    // = 5.77 + dieBonus off [+1 intensity (1.5)] × 0.6 = 0.9 + FREE [poison
    // seed i1 d2 (2.14) + conviction 1 (1.0)] = 3.14 → 9.81 → uncommon band
    // 4.5-13 (Thesis). FREE share 3.14/9.81 = 32.0% ✓.
    free: { applyEffect: { effectId: 'debuff_poison', intensity: 1, duration: 2 }, conviction: 1 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 2, duration: 2 },
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 1 },
    ],
    dieBonus: { onColor: 'off', rider: { bonusIntensity: 1 } },
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'dot'],
};

/** The uncommon defend engine: wall + self-cleanse + a counter-wound, walling
 *  higher on a body-heavy spend ledger. Affliction survival that still cuts. */
const stanchAndAnswer: Card = {
    id: 'stanch-and-answer',
    theme: 'affliction',
    name: 'Stanch and Answer',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Bind the arm. Scrape the rot from it. Answer the blow with a wound ' +
        'of theirs.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: GUARD 12 (3.0) + CLEANSE 1 (1.5) + bleed i2 d2 (3.0) = 7.5 +
    // threshold body 2 [GUARD 8 (2.0)] × 0.5 = 1.0 + FREE [mark i2 d1 (1.5)
    // + heal 3 (1.0) + conviction 1 (1.0)] = 3.5 → 12.0 → uncommon band
    // 4.5-13 (Theorem). FREE share 3.5/12.0 = 29.2% ✓.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 1 }, healHp: 3, conviction: 1 },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [
        { kind: 'guard', amount: 12 },
        { kind: 'rider', rider: { cleanse: 1 } },
    ],
    threshold: { color: 'body', count: 2, rider: { guard: 8 } },
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'defense'],
};

/** PROLONG carrier #3, the pure tempo read: extend everything and keep the
 *  die. The FREE deposit is deliberately MATCHED to festering-argument's
 *  (mark i1 d1) so the +2.0 refresh_die is the ONLY variable in the rank-3
 *  PROLONG A/B — festering-argument scores 6.25 with the identical deposit;
 *  the whole gap is the valve under test. intentionallyAsymmetric: the FREE
 *  share sits below the 25-35% window BY DESIGN (matched-deposit probe). */
const chronicCondition: Card = {
    id: 'chronic-condition',
    theme: 'affliction',
    name: 'Chronic Condition',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description: 'Not fatal, they said. Merely permanent.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: PROLONG 1 (5.5) + REFRESH the powering die (refresh_die: 2.0) =
    // 7.5 + FREE mark i1 d1 (0.75) = 8.25 → uncommon band 4.5-13 (Thesis).
    // FREE share 0.75/8.25 = 9.1% — BELOW the window BY DESIGN (matched
    // deposit; see doc comment). Die line: refresh (the one).
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 } },
    specialMechanics: [
        { kind: 'extend_dots', turns: 1 },
        { kind: 'refresh_die' },
    ],
    intentionallyAsymmetric: true,
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'glue', 'dice'],
};

/** The heavy bleed with the BANK valve: the big front-load now, the die saved
 *  toward the detonation turn — and the hand never quite empties. */
const theSlowKnife: Card = {
    id: 'the-slow-knife',
    theme: 'affliction',
    name: 'The Slow Knife',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'It is in no hurry. Neither is the hand that holds it, which never ' +
        'quite sets it down.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: bleed i3 d2 (decay walk 9+6+2.25 = 17.25 HP ÷ 3 = 5.75) + BANK the
    // powering die (bank_spent_die: 2.0) = 7.75 + FREE [mark i1 d1 (0.75) +
    // draw 1 (2.0)] = 2.75 → 10.5 → uncommon band 4.5-13 (Theorem). FREE
    // share 2.75/10.5 = 26.2% ✓.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 }, drawCards: 1 },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 3, duration: 2 }],
    specialMechanics: [{ kind: 'bank_spent_die' }],
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'dot', 'dice'],
};

/** The opening-condition heart engine: lead with the pleasantry and the MARK
 *  bed is laid before any guard is up. */
const venomedCourtesy: Card = {
    id: 'venomed-courtesy',
    theme: 'affliction',
    name: 'Venomed Courtesy',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'Open with it — the pleasantry lands first, before any guard is ' +
        'raised. It is not a pleasantry.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i2 d2 (4.27) + opening(0) state rider [mark i2 d1 (1.5)] ×
    // 0.5 = 0.75 = 5.02 + FREE [mark i2 d1 (1.5) + conviction 1 (1.0)] = 2.5
    // → 7.52 → uncommon band 4.5-13 (Thesis). FREE share 2.5/7.52 = 33.2% ✓.
    // Condition line: the state predicate (the one).
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 1 }, conviction: 1 },
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    synergy: {
        statePredicate: { kind: 'opening', maxPriorSpells: 0 },
        rider: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 1 } },
    },
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'dot', 'condition'],
};

/** The draw engine: two cards and a seed, a third seed on a mind-heavy
 *  ledger — the cycle glue an erosion deck stalls without. */
const caseHistory: Card = {
    id: 'case-history',
    theme: 'affliction',
    name: 'Case History',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Read enough ruined arguments and the next one drafts itself. The ' +
        'subject worsens; the file grows.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: DRAW 2 (4.0) + poison i1 d2 (2.14) = 6.14 + threshold mind 2
    // [poison i1 d2 (2.14)] × 0.5 = 1.07 + FREE [mark i2 d1 (1.5) + heal 3
    // (1.0)] = 2.5 → 9.70 → uncommon band 4.5-13 (Thesis). FREE share
    // 2.5/9.70 = 25.8% ✓.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 1 }, healHp: 3 },
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    specialMechanics: [{ kind: 'rider', rider: { drawCards: 2 } }],
    threshold: {
        color: 'mind', count: 2,
        rider: { applyEffect: { effectId: 'debuff_poison', intensity: 1, duration: 2 } },
    },
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'glue', 'dot'],
};

/** The reactive engine: if they drew blood since your last turn, the wound is
 *  returned with interest — affliction's answer without borrowing THORNS. */
const woundForWound: Card = {
    id: 'wound-for-wound',
    theme: 'affliction',
    name: 'Wound for Wound',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'An old law, evenly applied. What they open on you is opened on ' +
        'them, measure for measure.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: bleed i2 d2 (3.0) + GUARD 8 (2.0) = 5.0 + enemy-drew-blood state
    // rider [bleed i2 d2 (3.0)] × 0.5 = 1.5 + FREE [mark i2 d1 (1.5) + heal
    // 3 (1.0)] = 2.5 → 9.0 → uncommon band 4.5-13 (Thesis). FREE share
    // 2.5/9.0 = 27.8% ✓. Condition line: the state predicate (the one).
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 1 }, healHp: 3 },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'guard', amount: 8 }],
    synergy: {
        statePredicate: { kind: 'enemy-drew-blood' },
        rider: { applyEffect: { effectId: 'debuff_bleed', intensity: 2, duration: 2 } },
    },
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'dot', 'condition', 'defense'],
};

/** Buff-strip glue in theme voice: take the hopeful reading away, then
 *  deliver the finding — poison with a tempo answer to enemy enchantments. */
const terminalDiagnosis: Card = {
    id: 'terminal-diagnosis',
    theme: 'affliction',
    name: 'Terminal Diagnosis',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Strip the hopeful reading first. Then deliver the finding, which ' +
        'was never hopeful.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: strip 1 enemy buff (2.0) + poison i2 d2 (4.27) = 6.27 + dieBonus
    // match [+1 duration (1.0)] × 0.6 = 0.6 + FREE [mark i2 d1 (1.5) +
    // conviction 1 (1.0)] = 2.5 → 9.37 → uncommon band 4.5-13 (Thesis).
    // FREE share 2.5/9.37 = 26.7% ✓.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 1 }, conviction: 1 },
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'strip_random_buff', appliedTo: 'enemy' }],
    dieBonus: { onColor: 'match', rider: { bonusDuration: 1 } },
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'dot', 'glue'],
};

// ─── Rares (8) — finishers and build-arounds ─────────────────────────────────

/** Second detonation access (the library's known one-copy RUPTURE timing
 *  problem): a leaner verdict — bonusPct 0.25, no SIPHON, no recursion — with
 *  a survival threshold and a real scholar's FREE line where
 *  resonance-detonation spends its budget on drinkback and RECALL. */
const theVerdictOfRot: Card = {
    id: 'the-verdict-of-rot',
    theme: 'affliction',
    name: 'The Verdict of Rot',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Every affliction is called to testify at once. The verdict is ' +
        'unanimous, and it is collapse.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    // pts: RUPTURE ALL +25% (4 + expected fuel 8 + 0.25/25 = 12.01) +
    // threshold body 3 [heal 4 (1.33)] × 0.5 = 0.67 + FREE [mark i2 d1 (1.5)
    // + draw 1 (2.0) + conviction 1 (1.0)] = 4.5 → 17.18 → rare band 7-19
    // (Aporia). FREE share 4.5/17.18 = 26.2% ✓. Tier 3: late-stage-gated,
    // resonance-detonation precedent.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 1 }, drawCards: 1, conviction: 1 },
    specialMechanics: [{ kind: 'rupture', bonusPct: 0.25 }],
    threshold: { color: 'body', count: 3, rider: { healHp: 4 } },
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'payoff'],
};

/** The poison build-around: one enormous ramp, deeper on the matching die —
 *  the single-instance alternative to wide boards, tier-3 gated. */
const theDeepRot: Card = {
    id: 'the-deep-rot',
    theme: 'affliction',
    name: 'The Deep Rot',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Past the skin of the claim, past its bones, into the part that ' +
        'believed itself immortal. It ends slowly there.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i3 d4 (card-played clock, tempo-weighted 35.43 ÷ 3 = 11.81)
    // + dieBonus match [+1 intensity (1.5)] × 0.6 = 0.9 + FREE [mark i2 d1
    // (1.5) + heal 4 (1.33) + draw 1 (2.0)] = 4.83 → 17.54 → rare band 7-19
    // (Axiom). FREE share 4.83/17.54 = 27.6% ✓.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 1 }, healHp: 4, drawCards: 1 },
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 3, duration: 4 }],
    dieBonus: { onColor: 'match', rider: { bonusIntensity: 1 } },
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'dot'],
};

/** The bleed finisher: the widest wound plus a board-wide deepening — bleeds
 *  cash inside the death clock, so this is the anti-tempo-discount rare. */
const bledWhite: Card = {
    id: 'bled-white',
    theme: 'affliction',
    name: 'Bled White',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Every wound widened, then the widest one opened again. What remains ' +
        'is pale and finished.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: bleed i3 d2 (5.75) + +1 intensity ALL DoTs (5.0) = 10.75 +
    // threshold body 3 [bleed i2 d2 (3.0)] × 0.5 = 1.5 + FREE [mark i2 d1
    // (1.5) + draw 1 (2.0) + conviction 1 (1.0)] = 4.5 → 16.75 → rare band
    // 7-19 (Axiom). FREE share 4.5/16.75 = 26.9% ✓.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 1 }, drawCards: 1, conviction: 1 },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 3, duration: 2 }],
    specialMechanics: [{ kind: 'boost_all_dots', intensity: 1 }],
    threshold: {
        color: 'body', count: 3,
        rider: { applyEffect: { effectId: 'debuff_bleed', intensity: 2, duration: 2 } },
    },
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'dot', 'payoff'],
};

/** The glue capstone: PROLONG and deepen the whole board, then the die comes
 *  back WILD — one card that keeps a wide board alive AND colors the next
 *  play. Build-around for the no-detonate erosion line. */
const rotTakesTheRoot: Card = {
    id: 'rot-takes-the-root',
    theme: 'affliction',
    name: 'Rot Takes the Root',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Feed it, lengthen it, recolor the day to serve it. The garden was ' +
        'always going to lose.',
    tier: 2, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    // pts: PROLONG 1 (5.5) + +1 intensity ALL DoTs (5.0) + CONVERT the
    // powering die to WILD (convert_die_color: 2.5) = 13.0 + FREE [mark i2 d1
    // (1.5) + draw 1 (2.0) + conviction 1 (1.0)] = 4.5 → 17.5 → rare band
    // 7-19 (Aporia). FREE share 4.5/17.5 = 25.7% ✓. Die line: convert (the
    // one).
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 1 }, drawCards: 1, conviction: 1 },
    specialMechanics: [
        { kind: 'extend_dots', turns: 1 },
        { kind: 'boost_all_dots', intensity: 1 },
        { kind: 'convert_die_color' },
    ],
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'glue', 'dice'],
};

/** The REARGUE capstone: the hard flip at +2, and the X die may speak it for
 *  blood — the fate line the theme has never carried. The rephrasing writes
 *  itself down: the cycle rides the FREE line. */
const theWoundRephrased: Card = {
    id: 'the-wound-rephrased',
    theme: 'affliction',
    name: 'The Wound, Rephrased',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'The same injury, stated more precisely. Precision, it turns out, is ' +
        'the crueler dialect — even the impossible die can pronounce it, at ' +
        'a price.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: REARGUE +2 (convert_dots: 5 + 2×1.5 = 8.0) + fate [+2 intensity
    // (3.0)] × 0.7 = 2.1 − recoil 3 credit (3 × 1/3 × 0.75 = 0.75) = 9.35 +
    // FREE [mark i2 d1 (1.5) + draw 1 (2.0)] = 3.5 → 12.85 → rare band 7-19
    // (Axiom). FREE share 3.5/12.85 = 27.2% ✓.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 1 }, drawCards: 1 },
    specialMechanics: [{ kind: 'convert_dots', bonusIntensity: 2 }],
    fate: { rider: { bonusIntensity: 2 }, recoilHp: 3 },
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'glue', 'payoff'],
};

/** The sustain finisher: the long ramp that feeds the caster while it eats —
 *  mercy as the poisoner names it. Probes an erosion deck that outlives the
 *  late wall instead of racing it. */
const theMercyOfRot: Card = {
    id: 'the-mercy-of-rot',
    theme: 'affliction',
    name: 'The Mercy of Rot',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'Call it mercy if that helps: you are healed by exactly what devours ' +
        'them. The word does not change the arithmetic.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i2 d4 (tempo-weighted 23.62 ÷ 3 = 7.87) + HEAL 4 (1.33) =
    // 9.21 + threshold heart 2 [heal 4 (1.33) + mark i1 d1 (0.75)] × 0.5 =
    // 1.04 + FREE [mark i2 d1 (1.5) + heal 3 (1.0) + conviction 1 (1.0)] =
    // 3.5 → 13.75 → rare band 7-19 (Axiom). FREE share 3.5/13.75 = 25.5% ✓.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 1 }, healHp: 3, conviction: 1 },
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 2, duration: 4 }],
    specialMechanics: [{ kind: 'rider', rider: { healHp: 4 } }],
    threshold: {
        color: 'heart', count: 2,
        rider: { healHp: 4, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 } },
    },
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'dot', 'sustain'],
};

/** The pure-magnitude detonation: RUPTURE at +75% and NOTHING else on the
 *  paid face — no SIPHON (the-mercy-of-rot owns the sustain probe), no
 *  recursion (resonance-detonation owns that), no survival threshold
 *  (the-verdict-of-rot owns that). The A/B against the library's finisher is
 *  the constant itself: does the detonation seat want raw burst over the
 *  utility package? The matching die replants the first MARK of the next
 *  board. Paid-face finisher — intentionallyAsymmetric: the FREE line is a
 *  real deposit but deliberately below the 25% window (the payload IS the
 *  paid burst). */
const allWoundsAtOnce: Card = {
    id: 'all-wounds-at-once',
    theme: 'affliction',
    name: 'All Wounds at Once',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'The kindness of the ending is that it is an ending. Everything they ' +
        'carried comes due in a single breath — nothing held back, nothing ' +
        'saved for after.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    // pts: RUPTURE ALL +75% (4 + expected fuel 8 + 0.75/25 = 12.03) +
    // dieBonus match [mark i1 d1 (0.75)] × 0.6 = 0.45 = 12.48 + FREE mark i2
    // d1 (1.5) → 13.98 → rare band 7-19 (Aporia). FREE share 1.5/13.98 =
    // 10.7% — BELOW the 25-35% window BY DESIGN (intentionallyAsymmetric:
    // paid-face finisher). Tier 3: late-stage-gated.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 1 } },
    specialMechanics: [{ kind: 'rupture', bonusPct: 0.75 }],
    dieBonus: {
        onColor: 'match',
        rider: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 } },
    },
    intentionallyAsymmetric: true,
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'payoff'],
};

/** The scholar's build-around: cycle hard, deepen the board, and a mind-heavy
 *  ledger writes a fresh chapter — the mind-color rare the recipe's third
 *  color slot wants. */
const theAnnotatedPlague: Card = {
    id: 'the-annotated-plague',
    theme: 'affliction',
    name: 'The Annotated Plague',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'The disease, with commentary. Scholarship makes everything worse — ' +
        'deliberately, in this case.',
    tier: 2, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    // pts: DRAW 2 (4.0) + +1 intensity ALL DoTs (5.0) = 9.0 + threshold mind
    // 3 [poison i2 d2 (4.27)] × 0.5 = 2.14 + FREE [mark i2 d1 (1.5) + heal 4
    // (1.33) + conviction 1 (1.0)] = 3.83 → 14.97 → rare band 7-19 (Aporia).
    // FREE share 3.83/14.97 = 25.6% ✓.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 1 }, healHp: 4, conviction: 1 },
    specialMechanics: [
        { kind: 'rider', rider: { drawCards: 2 } },
        { kind: 'boost_all_dots', intensity: 1 },
    ],
    threshold: {
        color: 'mind', count: 3,
        rider: { applyEffect: { effectId: 'debuff_poison', intensity: 2, duration: 2 } },
    },
    addedIn: '2026-07-18',
    tags: ['affliction', 'swap-pool', 'glue', 'payoff'],
};

// ─── The set ─────────────────────────────────────────────────────────────────

export const SWAP_POOL_AFFLICTION: SandboxCardSet = {
    id: 'swap-affliction',
    name: 'Swap pool: affliction',
    description:
        'Thirty swap candidates for the erosion preset. Commons probe simple ' +
        'POISON/BLEED/MARK seats (front-loaded reads vs the library ramps) ' +
        'plus the in-theme defend line the library lacks; uncommons drill the ' +
        'orphaned PROLONG/REARGUE glue — including a kickerless REARGUE and a ' +
        'deposit-matched PROLONG A/B — the DoT amplifier, and sequencing ' +
        'conditions; rares probe detonation at both poles (lean +25% with ' +
        'survival vs pure +75% burst), sustain-through-rot, and no-detonate ' +
        'board finishers. All MARK deposits print engine-honest d1.',
    cards: [
        aThousandCuts, scarTissue, theVeiledSting, nameTheFlaw,
        nickTheVein, saltInTheWound, coldComfort, catalogueOfIlls, firstSymptom,
        theSecondInfection, reopenTheQuestion, aggravateTheCase,
        theLastWordFesters, creepingContagion, stanchAndAnswer,
        chronicCondition, theSlowKnife, venomedCourtesy, caseHistory,
        woundForWound, terminalDiagnosis,
        theVerdictOfRot, theDeepRot, bledWhite, rotTakesTheRoot,
        theWoundRephrased, theMercyOfRot, allWoundsAtOnce, theAnnotatedPlague,
    ],
};
