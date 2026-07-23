/**
 * The Themed Deck Library — spec 32 v3 (2026-07-08).
 *
 * 70 unique cards: 10 self-contained themes × 7 (2 common spells ×4 copies,
 * 2 uncommon spells ×2 copies, 1 rare spell + 1 enchantment + 1 disenchant ×1
 * in the preset recipe — see `combat.starter-deck-presets.ts`). Exactly 30 keywords
 * (spec §3); THE STRIKE IS DEAD — no card touches HP outside DoT ticks,
 * affliction payoffs, engine-gated drips, and reflect.
 *
 * Rank ladder (quality axis): 1 Doxa · 2 Lemma · 3 Thesis · 4 Theorem ·
 * 5 Axiom · 6 Aporia. Rarity derives from it: common 1-2 / uncommon 3-4 /
 * rare 5-6. `tier` stays the resist axis.
 *
 * Every card ships its pricing arithmetic in a comment (spec §4 point table;
 * conditional discounts threshold ×0.5 · dieBonus ×0.6 · fate ×0.7 ·
 * theme-state ×0.5; self-cost credits −0.75×). The pricing lint
 * (`cards.pricing.ts` + `src/Cards/e2e/pricing.engine.test.ts`) asserts each
 * sum lands in the printed rank's band.
 *
 * The pre-v3 library (49 cards, 126 effect ids, ~80 keywords) is retired to
 * git history — no rescues (owner rule). Unknown ids drop gracefully from
 * decks; the deprecated-ids ban list is regenerated in
 * `src/Effects/e2e/deprecated-effects.engine.test.ts`.
 *
 * This file is data-only. All runtime behaviour lives in
 * `src/Cards/card.engine.ts` and `src/Combat/combat.engine.ts`.
 */

import { Card } from './types';
import { bindSandboxLibraryGuard, getSandboxCard } from './cards.sandbox';
import { getThoughtformById } from './cards.thoughtforms';

// ─── T1 — AFFLICTION (bleed + poison: stack, extend, convert, detonate) ──────

const slipperySlope: Card = {
    id: 'slippery-slope',
    theme: 'affliction',
    name: 'Slippery Slope',
    philosophicalAspect: 'body',
    description:
        'One concession, then the next, then the avalanche you promised was ' +
        'inevitable. The ground tilts, and they slide the whole way down.',
    tier: 2, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Inflict POISON 1 for 4 turns.',
    // pts (phase 36b tempo horizon; WS3.5 clock; phase 30 FREE-currency law):
    // poison i1 d4 is a RAMP — per-round HP 4,4,6,6, the big ticks landing at
    // rounds 3-4, PAST the ~4-round death clock — so the tempo weight discounts
    // it: printed lifetime 20 → tempo-weighted 12.91 ÷ 3 ≈ 4.30 + FREE MARK seed
    // i1 d1 (0.75, plants the universal affliction-glue currency instead of the
    // retired TICK) = 5.05 → mid Doxa band. The reprice corrects an OVERPAY:
    // the deck never collects a 6-round ramp before it dies
    // (scratch/price-experiment rec #2, seeds-5 late win 3% flat across 4x price)
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 } },
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1 }],
    addedIn: '2026-07-08',
    tags: ['affliction', 'dot', 'starter'],
};

const festeringArgument: Card = {
    id: 'festering-argument',
    theme: 'affliction',
    name: 'Festering Argument',
    philosophicalAspect: 'mind',
    description:
        'Left unanswered, a wound of reasoning does not close. You decline ' +
        'to answer it. Everything they carry runs a little longer.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'PROLONG every DoT on the enemy by 1 turn.',
    // pts (phase 30): +1 duration to ALL DoTs ≈ 1/dot × expected 2-3 live dots
    // ≈ 5.5 + FREE MARK seed i1 d1 (0.6) ≈ 6.1 → Thesis
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 } },
    specialMechanics: [{ kind: 'extend_dots', turns: 1 }],
    addedIn: '2026-07-08',
    tags: ['affliction', 'glue'],
};

const currysConversion: Card = {
    id: 'currys-conversion',
    theme: 'affliction',
    name: "Curry's Conversion",
    philosophicalAspect: 'mind',
    description:
        'If this wound harms you, then it spreads. The conditional is ' +
        'vacuously true. The wound becomes the argument.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'REARGUE — Convert all enemy BLEED to POISON and all POISON to BLEED, ' +
        'then add 1 intensity to each.',
    // pts (phase 30): convert bleed↔poison +1 int ≈ 1.5/instance × ~2 + tempo
    // value ≈ 6.5 + FREE MARK seed i1 d1 (0.6, weak deposit) + DRAW 1 kicker
    // (2, legal alongside a weak-enough deposit) ≈ 9.1 → Theorem
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 }, drawCards: 1 },
    specialMechanics: [{ kind: 'convert_dots', bonusIntensity: 1 }],
    addedIn: '2026-07-08',
    tags: ['affliction', 'glue'],
};

const resonanceDetonation: Card = {
    id: 'resonance-detonation',
    theme: 'affliction',
    name: 'Resonance Detonation',
    philosophicalAspect: 'heart',
    description:
        'Every argument you have seeded rings at once, one frequency, one ' +
        'conclusion. The structure was never going to hold — you drink back a ' +
        'measure of the collapse as it falls, and the ruin remembers its own ' +
        'shape well enough to happen again.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'RUPTURE ALL for 50% more damage. SIPHON 35% of the RUPTURE damage. ' +
        'RECALL 2 cards; fire their FREE lines now.',
    // pts (DRASTIC late-stage rework, 2026-07-08 — deliberately overrides the
    // normal pricing curve per directive): RUPTURE alone caps at
    // ruptureBurstCap() per cast (WS7.1: a pure fraction of enemy max HP), a
    // hard global engine rule this card cannot raise. Even fully fueled, one
    // capped burst cannot close a
    // 1080-1500 HP late pool — the deck's real problem was never a single
    // cast's magnitude, it was ACCESS (only one copy) + TIMING (rupture wipes
    // your own DoT board, so rebuilding fuel for cast #2 was pure redraw luck
    // while round-scaling threat escalation punishes the wait).
    // SIPHON 35% buys the survival window a detonate-then-rebuild loop needs.
    // REPRISE 2 (fireFree) pulls your two best already-discarded DoT/glue
    // cards (Curry's Conversion, Festering Argument, Straw Man's Jab — the
    // engine returns highest-rank-first) straight back to hand the instant
    // you detonate, so replanting for the NEXT cast starts immediately
    // instead of waiting on a natural redraw — this is the deck's real
    // second access route to its own payoff, without a second printed copy.
    // bonusPct 0.5 makes the FIRST detonation of a long fight (thinnest
    // fuel) land closer to the fraction cap instead of undershooting it.
    // This card is tier 3, and combat.stage-profiles.ts caps MID at
    // maxCardTier:2, so this rework is structurally late-stage-only — it
    // cannot leak into the mid-stage roster.
    // phase 30: FREE TICK (the exact "weak chip on a one-copy finisher" trap
    // the owner flagged) replaced with a MARK seed — plants glue currency
    // instead of chipping for ~0 value on an empty board.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 } },
    specialMechanics: [
        { kind: 'rupture', bonusPct: 0.5 },
        { kind: 'siphon', pct: 0.35 },
        { kind: 'reprise', count: 2, fireFree: true },
    ],
    addedIn: '2026-07-08',
    tags: ['affliction', 'payoff', 'recursion'],
};

const venomAndVein: Card = {
    id: 'venom-and-vein',
    theme: 'affliction',
    persistentEffect:
        'When a PAID line includes a DoT, every enemy status on that line ' +
        'gains +1 intensity and +1 duration.',
    name: 'Venom and Vein',
    philosophicalAspect: 'body',
    description:
        'The argument in the blood and the blood in the argument. From here ' +
        'on, everything you plant grows deeper roots.',
    tier: 2, rank: 5, cardType: 'enchantment',
    targetType: 'self',
    // pts: persistent +1 intensity on every bleed/poison application ≈ 1.5 × ~8 triggers × min-4 law ≈ 12 → Axiom
    addedIn: '2026-07-08',
    tags: ['affliction', 'enchantment'],
};

const suppuratingCurse: Card = {
    id: 'suppurating-curse',
    theme: 'affliction',
    persistentEffect:
        'At the end of each round, deal damage equal to the DoT damage the ' +
        'enemy took that round.',
    name: 'Suppurating Curse',
    philosophicalAspect: 'mind',
    description:
        'A standing verdict: nothing on them is allowed to close. Whatever ' +
        'their wounds cost them this round, the curse exacts again — every ' +
        'point of it, a second time, for the rest of the fight.',
    tier: 2, rank: 6, cardType: 'disenchant',
    targetType: 'enemy',
    // pts: engine text — DOUBLES the enemy's total DoT damage each round (a
    // second tick equal to the round's real DoT throughput), rest of combat
    // (Aporia: rule-rewriter). Deliberate late-stage lever; see engine comment
    // at the `suppurating-curse` hook (the description matches this doubling).
    addedIn: '2026-07-08',
    tags: ['affliction', 'disenchant'],
};

// ─── T2 — PERORATION (the PERFORM spin-off: Premises → the conclusion) ───────

const exordium: Card = {
    id: 'exordium',
    theme: 'peroration',
    name: 'Exordium',
    philosophicalAspect: 'heart',
    description:
        'Every case begins somewhere quiet. You clear your throat, and the ' +
        'room — without knowing why — leans in. Somewhere in that first ' +
        'breath, the wound is already open.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Afflict with POISON 1 for 2 turns. Gain 1 PREMISE and DRAW 1.',
    // pts (WS10.1 KW-1 fold, 2026-07-11 — argument-wound folded into POISON;
    // spec 33 D4 re-derives the card-played cadence 2 → 1.83): poison i1 d2
    // card-played clock (lifetime 1.83×(2+2)=7.3, tempo-weighted ÷3 ≈ 2.1) +
    // 1 Premise (0.8) + draw rider (2) + FREE premise (0.8) ≈ 5.7 → Doxa
    free: { premises: 1 },
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', duration: 2 }],
    specialMechanics: [{ kind: 'premise', count: 1 }, { kind: 'rider', rider: { drawCards: 1 } }],
    addedIn: '2026-07-08',
    tags: ['peroration', 'exposure'],
};

const openingStatement: Card = {
    id: 'opening-statement',
    theme: 'peroration',
    name: 'Opening Statement',
    philosophicalAspect: 'heart',
    description:
        'You name what you intend to prove while pointing at the place it ' +
        'will break them. A promise is also a threat — and threats, once ' +
        'named, start to bleed.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Apply MARK 1. Inflict POISON 1 for 2 turns. Gain 2 PREMISES.',
    // pts (WS10.1 KW-1 fold, 2026-07-11 — argument-wound folded into POISON,
    // duration tuned 3 → 2 for the card-played clock; spec 33 D4: cadence
    // 2 → 1.83): mark d2 (1.5) + poison i1 d2 (lifetime 7.3, tempo ÷3 ≈ 2.1)
    // + 2 Premises (1.6) + FREE premise (0.8) ≈ 6.0 → Lemma
    free: { premises: 1 },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', duration: 2 },
        { effectId: 'debuff_poison', appliedTo: 'opponent', duration: 2 },
    ],
    specialMechanics: [{ kind: 'premise', count: 2 }],
    addedIn: '2026-07-08',
    tags: ['peroration', 'exposure'],
};

const mountingCase: Card = {
    id: 'mounting-case',
    theme: 'peroration',
    name: 'Mounting Case',
    philosophicalAspect: 'mind',
    description:
        'Premise stacked on premise, each one small, none deniable. The ' +
        'weight is the argument — and the weight is starting to cut.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Afflict with MARK 1 for 3 turns and POISON 1 for 4 turns. Gain 2 ' +
        'PREMISES.',
    // pts (WS10.1 KW-1 fold, 2026-07-11 — argument-wound folded into POISON,
    // intensity tuned 2 → 1 for the card-played clock; spec 33 D4: cadence
    // 2 → 1.83): mark d3 (2.25) + poison i1 d4 (lifetime 1.83×10=18.3,
    // tempo-weighted 11.8 ÷3 ≈ 3.9) + 2 Premises (1.6) + FREE premise (0.8) +
    // threshold(+1 premise x 0.5 = 0.4) ≈ 9.0 -> Thesis
    free: { premises: 1 },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', duration: 3 },
        { effectId: 'debuff_poison', appliedTo: 'opponent', duration: 4, intensity: 1 },
    ],
    specialMechanics: [{ kind: 'premise', count: 2 }],
    threshold: { color: 'heart', count: 2, rider: { premises: 1 } },
    addedIn: '2026-07-08',
    tags: ['peroration', 'exposure'],
};

const peroratioInterrupta: Card = {
    id: 'peroratio-interrupta',
    theme: 'peroration',
    name: 'Peroratio Interrupta',
    philosophicalAspect: 'mind',
    description:
        'You cash the argument early — ugly, effective. Every mark and ' +
        'wound already on them detonates at once; the conclusion you ' +
        'spend today cannot be refuted tomorrow.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'RUPTURE ALL afflictions on the foe.',
    // pts (phase 30): RUPTURE (verb 4 + expected fuel) -> ~12 Theorem. FREE
    // deposits +1 Premise (0.8, matches its peroration siblings) instead of
    // the retired TICK — keeps the card in the uncommon band.
    free: { premises: 1 },
    specialMechanics: [{ kind: 'rupture' }],
    addedIn: '2026-07-08',
    tags: ['peroration', 'payoff'],
};

const theClosingWord: Card = {
    id: 'the-closing-word',
    theme: 'peroration',
    name: 'The Closing Word',
    philosophicalAspect: 'heart',
    description:
        'The conclusion, declared before it is finished being true. At six ' +
        'premises it lands — and carried past eight in a single breath, they ' +
        'simply concede.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'PERORATION at 6 PREMISES: gain 2 Conviction, DRAW 2, and consume ALL ' +
        'MARK stacks for 3 damage each. At 8 PREMISES, CONCEDE — you win ' +
        '(elite 10, boss 12).',
    // pts: PERORATION at 6 → consume marks 3/stack + draw 2 + 2 Conviction ≈ 13 (CONCEDE at 8 — alt-win, §9) → Axiom
    free: { premises: 1 },
    specialMechanics: [{
        kind: 'peroration', at: 6, concedeAt: 8,
        rider: { ruptureMarks: 3, drawCards: 2, conviction: 2 },
    }],
    addedIn: '2026-07-08',
    tags: ['peroration', 'payoff', 'alt-win'],
};

// ─── T3 — FORGE (dice from nothing: kindle, ripen, float, overtake) ──────────

const sketchOfAThought: Card = {
    id: 'sketch-of-a-thought',
    theme: 'forge',
    name: 'Sketch of a Thought',
    philosophicalAspect: 'mind',
    description:
        'Not yet an idea — the shape where an idea will be. You rough it in, ' +
        'and a spark leaps off the sketch and catches on them before they notice.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Kindling Ember 1 on the enemy for 3 turns — 1 damage at the start of ' +
        'each turn — and KINDLE (mind).',
    // pts (phase 30): KINDLE mind (2.5) + FREE PIP 1 (1.5, forge's currency)
    // + ember i1 d3 lifetime 3/3=1 = 5.0 -- fits the 1.5-7.5 Doxa/Lemma band
    // for rank 1.
    free: { pips: 1 },
    combatEffects: [{ effectId: 'debuff_kindling_ember', appliedTo: 'opponent', intensity: 1, duration: 3 }],
    specialMechanics: [{ kind: 'create_temporary_die', color: 'mind' }],
    addedIn: '2026-07-08',
    tags: ['forge', 'dice', 'dot'],
};

const halfStep: Card = {
    id: 'half-step',
    theme: 'forge',
    name: 'Half-Step',
    philosophicalAspect: 'body',
    description:
        'Zeno was half right: you can always take half a step back. What ' +
        'waits behind the guard ripens twice as fast when you learn to be patient about it ' +
        '— push it further and the kiln might just boil over.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    paidSummary:
        'GUARD 5. +2 PIPS to every Reserve die, then PIP 1 past the cap (35% ' +
        'bust halves the die).',
    // pts (phase 30): Guard 5 (1.25) + 2 pips (3.0) + FREE PIP 1 (1.5, forge's
    // real currency, replaces the chip guard 2) = 5.75. Phase 32 part 4c —
    // OVERHEAT 1 pip past the safe RESERVE_PIP_CAP: EV = (1-0.35)x1.5 -
    // 0.35x0.5x2x1.5 = 0.45 (a genuine gamble, not a free pip: a bust HALVES
    // the targeted die's bank instead of wiping it, matching Quacks of
    // Quedlinburg's "choose points or coins, not both" partial-loss shape,
    // not a total-loss explosion) = 6.2 total -- fits the 1.5-7.5
    // Doxa/Lemma band for rank 2.
    free: { pips: 1 },
    specialMechanics: [
        { kind: 'guard', amount: 5 }, { kind: 'grant_pip', count: 2 },
        { kind: 'overheat', pips: 1 },
    ],
    addedIn: '2026-07-08',
    tags: ['forge', 'defense'],
};

const bootstrapLoop: Card = {
    id: 'bootstrap-loop',
    theme: 'forge',
    name: 'Bootstrap Loop',
    philosophicalAspect: 'mind',
    description:
        'The proof assumes itself and, scandalously, works. Even a dead ' +
        'premise funds its own cause.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    paidSummary:
        'FORGE a miss die into a temporary WILD gold die. With no miss to ' +
        'revive, gain +1 Conviction instead.',
    // pts (spec 33 D4 re-word — floating → temporary gold die, combat-only, so
    // the cross-combat persistence credit is dropped): TRANSMUTE miss → WILD
    // temp gold ((5+1)×0.7 + 1×0.3 = 4.5) + FREE PIP 1 (1.5, forge's currency,
    // replaces conviction — which is a system token, not a registry keyword) +
    // threshold(pip 1.5 ×0.5 = 0.75) ≈ 6.75 — fits the 4.5-13 uncommon band for
    // rank 3. (Dice-law rework 2026-07-09: KINDLE wild swapped for float_x_die;
    // 2026-07-17: dead X reframed as a miss die per spec 33 §6.)
    free: { pips: 1 },
    specialMechanics: [{ kind: 'float_x_die' }],
    threshold: { color: 'mind', count: 2, rider: { pips: 1 } },
    addedIn: '2026-07-08',
    tags: ['forge', 'dice', 'floating'],
};

const exNihilo: Card = {
    id: 'ex-nihilo',
    theme: 'forge',
    name: 'Ex Nihilo',
    philosophicalAspect: 'mind',
    description:
        'Something from nothing — and this time it comes out already flexible, ' +
        'the shape of whatever you need it to be. Even the hand that struck it ' +
        'goes back in the tray, unspent.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    paidSummary:
        'FORGE a temporary WILD gold die. The die spent on this card banks to ' +
        'your Reserve at 0 PIPS if a slot is free.',
    // pts (spec 33 D4 re-word — floating → temporary gold die, combat-only, so
    // the cross-combat persistence credit is dropped): FORGE temp gold WILD
    // (5 + wild bonus 1 = 6) + BANK own powering die (2) + FREE PIP 1 (1.5,
    // forge's currency, replaces conviction) = 9.5 -- fits the 4.5-13
    // Thesis/Theorem band for rank 4. The threshold's conditional +1 pip is
    // dropped as redundant now that the FREE line guarantees one every play.
    free: { pips: 1 },
    specialMechanics: [
        { kind: 'forge_floating_die', color: 'wild' },
        { kind: 'bank_spent_die' },
    ],
    addedIn: '2026-07-08',
    tags: ['forge', 'dice', 'floating'],
};

const theOvertake: Card = {
    id: 'the-overtake',
    theme: 'forge',
    name: 'The Overtake',
    philosophicalAspect: 'body',
    description:
        'Achilles does pass the tortoise — all at once, every saved step ' +
        'spent in a single stride, and every wound already worked into them ' +
        'torn loose in the same motion. Sudden, and total. And the leg that ' +
        'carried him is already reset, ready to take the next one.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Spend ALL your PIPS for GUARD 1 each, then RUPTURE ALL afflictions ' +
        'with +3.5 damage per pip spent (needs 2+ pips). Refresh the spent ' +
        'die.',
    // pts: spend ALL pips (+1 Guard per) + RUPTURE (3.5 fuel/pip, +50% burst) —
    // the RUPTURE deliberately ALSO consumes every enemy affliction (its whole
    // DoT board tears loose into the burst), so the finisher must land big to
    // be worth cashing your own DoTs; fuelPerPip 3.5 + bonusPct 0.5 push a
    // fully-charged forge turn to the ruptureBurstCap() fraction cap (WS7.1:
    // a pure fraction of enemy max HP). + REFRESH own powering
    // die -- top of the rank-5 Axiom band; a full FREE PIP (1.5) tips it over,
    // so FREE deposits a MARK seed i1 d1 (0.6, the universal glue currency)
    // instead — still a real theme-currency deposit under the FREE-currency
    // law, just not forge-specific on this particular finisher.
    //
    // CAVEAT (verified in combat.engine.ts): a temporary gold die (spec 33 §6:
    // the reinterpreted floating grant) is spent-and-gone-for-this-combat by
    // design -- refresh_die only returns the powering die to the pool when
    // Overtake is powered by a RESERVE die.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 } },
    specialMechanics: [
        { kind: 'spend_all_pips', guardPerPip: 1 },
        { kind: 'rupture', fuelPerPip: 3.5, bonusPct: 0.5 },
        { kind: 'refresh_die' },
    ],
    addedIn: '2026-07-08',
    tags: ['forge', 'payoff'],
};

const anvilOfForm: Card = {
    id: 'anvil-of-form',
    theme: 'forge',
    persistentEffect: 'Every KINDLEd or FORGEd die arrives with +1 PIP.',
    name: 'Anvil of Form',
    philosophicalAspect: 'mind',
    description:
        'Matter remembers the shape it was struck into. Everything you forge ' +
        'from here arrives already tempered.',
    tier: 2, rank: 5, cardType: 'enchantment',
    targetType: 'self',
    // pts: persistent +1 pip on every kindled/floating die ≈ 1.5 × ~6 forges, min-4 ≈ 12 → Axiom
    addedIn: '2026-07-08',
    tags: ['forge', 'enchantment'],
};

// ─── T4 — AKRASIA (acting against your own judgment; the debt pays) ──────────

const againstMyJudgment: Card = {
    id: 'against-my-judgment',
    theme: 'akrasia',
    name: 'Against My Judgment',
    philosophicalAspect: 'heart',
    description:
        'You know better. You do it anyway — and the knowing-better arrives ' +
        'two cards too late to stop you.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'MARK 1 for 2 turns on yourself, then DRAW 2.',
    // pts (phase 30): draw 2 (4) − self-mark d2 credit (−0.75×1.5 ≈ −1.1) +
    // FREE self-MARK seed i1 d1 (0.6, akrasia's currency — self-afflictions
    // toward FALLEN, replaces conviction which is a system token not a
    // registry keyword) ≈ 3.5 → Doxa
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' } },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'self', duration: 2 }],
    specialMechanics: [{ kind: 'rider', rider: { drawCards: 2 } }],
    addedIn: '2026-07-08',
    tags: ['akrasia'],
};

const sweetPoison: Card = {
    id: 'sweet-poison',
    theme: 'akrasia',
    name: 'Sweet Poison',
    philosophicalAspect: 'body',
    description:
        'You taste it first, to prove the vintage. The enemy drinks deeper — ' +
        'but you did drink.',
    tier: 2, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Afflict with POISON 1 for 4 turns. BLEED 1 for 2 turns on yourself.',
    // pts (WS3.5 clock re-price, 2026-07-11 — intensity tuned 2 → 1; phase 30:
    // FREE self-MARK seed i1 d1 replaces the retired TICK; spec 33 D4 re-derives
    // the card-played cadence 2 → 1.83): poison i1 d4 (lifetime 18.3,
    // tempo-weighted 11.8 ÷3 ≈ 3.9) − self-bleed i1 d2 credit (−0.75×1 = −0.75)
    // + FREE self-mark 0.6 ≈ 3.8 → Lemma (deliberately rich — the akratic
    // bargain)
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' } },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1 },
        { effectId: 'debuff_bleed', appliedTo: 'self', intensity: 1, duration: 2 },
    ],
    addedIn: '2026-07-08',
    tags: ['akrasia', 'dot'],
};

const selfFlagellant: Card = {
    id: 'self-flagellant',
    theme: 'akrasia',
    name: 'Self-Flagellant',
    philosophicalAspect: 'body',
    description:
        'The lash falls on your own back, and every wound you have argued ' +
        'into them — poison, bleed, the guilt mirrored back a dozen times ' +
        'over — comes due at once.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'RECOIL 5, then RUPTURE ALL with 10% more force.',
    // pts: RUPTURE (4 + fuel 8, bonusPct 0.10 ≈ +0.004) − recoil 5 credit
    // (−1.25) + tick 0.6 ≈ 11.35 → fits Thesis/Theorem band. DRASTIC REWORK:
    // was a flat, always-the-same +1-intensity sustained amplifier (~7pts);
    // is now a repeatable detonator. RUPTURE consumes every affliction on the
    // enemy and converts their full remaining lifetime into ONE burst now,
    // capped at 80.
    // phase 30: FREE self-MARK seed i1 d1 (0.6) replaces TICK.
    // phase 32 part 3 (prose only, no numeric change): this RECOIL 5 also
    // posts to the per-combat DEBT ledger (crosses close to one tier on its
    // own — see AKRASIA_DEBT_TIER_HP in combat/effects.ts); an unscored bonus
    // riding the already-priced recoil credit above, same framing as Part 1's
    // REAP erosion.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' } },
    specialMechanics: [
        { kind: 'recoil', hp: 5 },
        { kind: 'rupture', bonusPct: 0.1 },
    ],
    addedIn: '2026-07-08',
    tags: ['akrasia', 'dot'],
};

const fallenGrace: Card = {
    id: 'fallen-grace',
    theme: 'akrasia',
    name: 'Fallen Grace',
    philosophicalAspect: 'heart',
    description:
        'Grace was never for the upright. It finds you face-down, and it ' +
        'pays better there.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Afflict with BLEED 2 for 3 turns.',
    // pts (phase 30): bleed i2 d3 (~5) + FREE self-MARK seed i1 d1 (0.6, weak
    // deposit) + DRAW 1 kicker (2, legal alongside the weak deposit) +
    // FALLEN(heal 4 ≈ 1.3 ×0.5 = 0.7) + tempo ≈ 8.9 → Theorem
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' }, drawCards: 1 },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 3 }],
    fallen: { rider: { healHp: 4 } },
    addedIn: '2026-07-08',
    tags: ['akrasia', 'dot'],
};

const pactOfAkrasia: Card = {
    id: 'pact-of-akrasia',
    theme: 'akrasia',
    name: 'Pact of Akrasia',
    philosophicalAspect: 'body',
    description:
        'The cheapest forge in the world. The bill is written in your own ' +
        'blood, and you sign it smiling.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'self',
    paidSummary:
        'BLEED 1 for 2 turns on yourself. FORGE a temporary WILD gold die and ' +
        'bank the spent die, then RECOIL 6.',
    // pts (spec 33 D4 re-author): the FORGE grant is now a temporary gold die
    // (combat-only), so it lost the cross-combat persistence credit (9 → 6) —
    // which alone dropped this floor-Axiom card below band. The lost value is
    // restored IN-THEME (the die is weaker, so the card does more elsewhere):
    // BANK the powering die (+2, "the cheapest forge keeps everything") and a
    // FALLEN payoff, akrasia's own state gate. FORGE temp gold wild (6) + BANK
    // (2) − RECOIL 6 (−1.5) − self-bleed i1 d2 credit (−0.75) = 5.75 + FREE
    // [RECOIL 1 (−0.25) → GUARD 2 (0.5) = 0.25] + FALLEN[guard 6 (1.5) + heal 3
    // (1.0) = 2.5] × 0.5 = 1.25 → 7.25 → Axiom (7-19), its pre-D4 value.
    // phase 32 part 3 (prose only): the FREE line's RECOIL 1 also posts to the
    // per-combat DEBT ledger alongside its Guard (see AKRASIA_DEBT_TIER_HP).
    free: { recoil: 1, guard: 2 },
    fallen: { rider: { guard: 6, healHp: 3 } },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'self', intensity: 1, duration: 2 }],
    specialMechanics: [
        { kind: 'forge_floating_die', color: 'wild' },
        { kind: 'bank_spent_die' },
        { kind: 'recoil', hp: 6 },
    ],
    addedIn: '2026-07-08',
    tags: ['akrasia', 'floating'],
};

const crownOfThorns: Card = {
    id: 'crown-of-thorns',
    theme: 'akrasia',
    persistentEffect: 'While FALLEN, your statuses land +1 intensity per affliction you carry beyond the first (max +4).',
    name: 'Crown of Thorns',
    philosophicalAspect: 'heart',
    description:
        'Wear the damage as regalia. While you are Fallen, everything you ' +
        'inflict inherits the weight.',
    tier: 2, rank: 5, cardType: 'enchantment',
    targetType: 'self',
    // pts: persistent +1 intensity on applications while FALLEN ≈ 1.5 × ~7 gated ×0.5 ≈ 11 → Axiom
    addedIn: '2026-07-08',
    tags: ['akrasia', 'enchantment'],
};

const mirrorOfGuilt: Card = {
    id: 'mirror-of-guilt',
    theme: 'akrasia',
    persistentEffect: 'Each self-debuff you land also lands 1 stack of itself on the enemy; every 3 RECOIL paid lands 1 more.',
    name: 'Mirror of Guilt',
    philosophicalAspect: 'mind',
    description:
        'A curse of perfect symmetry: whatever you suffer, they now suffer ' +
        'the reflection of. The debt argues for you.',
    tier: 2, rank: 6, cardType: 'disenchant',
    targetType: 'enemy',
    // pts: engine text — every self-debuff you gain lands 1 stack on the enemy (Aporia)
    addedIn: '2026-07-08',
    tags: ['akrasia', 'disenchant'],
};

// ─── T5 — CONTROL (strip the rungs; the denied blow lands inward) ────────────

const zenosHalfStep: Card = {
    id: 'zenos-half-step',
    theme: 'control',
    name: "Zeno's Half-Step",
    philosophicalAspect: 'body',
    description:
        'To reach you, the blow must first cross half the distance. You keep ' +
        'the halves coming.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Apply STAGGER 1 to the enemy\'s next action.',
    // pts (phase 30): STAGGER 1 (~half a phase-deny, 2) + FREE reveal the
    // next stance (1.5, control's currency — "information as theme
    // currency": expose the telegraph before spending a die to strip it —
    // replaces the chip guard 2, and deliberately does NOT compound with
    // the PAID stagger the way a second FREE stagger would) ≈ 3.5 → Doxa
    free: { revealStance: true },
    specialMechanics: [{ kind: 'stagger', rungs: 1 }],
    addedIn: '2026-07-08',
    tags: ['control'],
};

const redHerring: Card = {
    id: 'red-herring',
    theme: 'control',
    name: 'Red Herring',
    philosophicalAspect: 'mind',
    description:
        'Something glints in the corner of the argument. They lunge for it — ' +
        'and every lunge you deny becomes the wound.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Afflict with BACKFIRE 2 for 2 turns.',
    // pts (phase 30): backfire i2 d2 (3) + FREE reveal the next stance (1.5,
    // control's currency, replaces the bare draw) ≈ 4.5 → Lemma
    free: { revealStance: true },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    addedIn: '2026-07-08',
    tags: ['control'],
};

const undistributedMiddle: Card = {
    id: 'undistributed-middle',
    theme: 'control',
    name: 'Undistributed Middle',
    philosophicalAspect: 'mind',
    description:
        'The middle term never quite connects, and neither does their swing. ' +
        'Somewhere between premise and blow, the force goes missing.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Afflict with BACKFIRE 2 for 3 turns, then STAGGER 1.',
    // pts (phase 30): STAGGER 1 (2) + backfire i2 d3 (0.75x2x3=4.5, up from
    // i1/d2=1.5) + FREE reveal the next stance (1.5, control's currency,
    // replaces guard) + threshold(mind x3 -> stagger+1 AND bonusIntensity+1,
    // rider=2+1.5=3.5 x0.5 discount = 1.75) total ~= 9.75, in-band for
    // uncommon [4.5,13].
    free: { revealStance: true },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 2, duration: 3 }],
    specialMechanics: [{ kind: 'stagger', rungs: 1 }],
    threshold: { color: 'mind', count: 3, rider: { stagger: 1, bonusIntensity: 1 } },
    addedIn: '2026-07-08',
    tags: ['control'],
};

const arrowParadox: Card = {
    id: 'arrow-paradox',
    theme: 'control',
    name: 'Arrow Paradox',
    philosophicalAspect: 'body',
    description:
        'At every instant the arrow is at rest. You choose the instant, and ' +
        'pin their next blow to a single shape -- the stillness itself ' +
        'a wound.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'BACKFIRE 1 for 2 turns, lock the enemy\'s next stance, then STAGGER 1.',
    // pts (phase 30): lock_stance (2.5) + STAGGER 1 (2) + backfire i1 d2 on
    // the shared 'debuff_backfire' stack (1.5) + FREE reveal the next stance
    // (1.5, control's currency, replaces guard) = 7.5, in-band for Theorem
    // [4.5,13].
    free: { revealStance: true },
    specialMechanics: [{ kind: 'lock_stance' }, { kind: 'stagger', rungs: 1 }],
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    addedIn: '2026-07-08',
    tags: ['control'],
};

// Phase 32 part 4a (Control — TURNABOUT, 2026-07-10-theme-identity.md §2):
// replaces `paralysisOfAnalysis` in this exact library slot (id, rank-6
// rare-spell recipe seat, 'mind' philosophicalAspect) — the 70-card / 7-per-
// theme / 5-5-5 color-law invariants (curated-library.engine.test.ts,
// deck-presets.engine.test.ts) are pinned counts, so a genuinely NEW card
// must occupy an existing seat rather than grow the library past 70. The
// swapped-out card's STAGGER+BACKFIRE payoff role is superseded by this
// capstone, which finally banks what the theme's denial already does; its
// flavor voice (the doorway/half-step/herring imagery) lives on in the prose
// below. rank 6 (not 5, unlike every other themed rare spell): the FIRST
// spell-type Aporia card in the library — a deliberate deviation, not a typo
// (every other rank-6 card is a disenchant; nothing in the shape contract
// requires that pairing, only that a theme carries 2 common/2 uncommon/3
// rare and exactly 1 enchantment + 1 disenchant, both satisfied here).
const turnabout: Card = {
    id: 'turnabout',
    theme: 'control',
    name: 'Turnabout',
    philosophicalAspect: 'mind',
    description:
        'Nothing you denied them was ever gone. It queued behind the ' +
        'half-step, behind the doorway, behind the herring -- and now the ' +
        'whole withheld argument lands at once.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'BACKFIRE ALL — the enemy takes 1.5 damage for every rung you have ' +
        'ever denied this combat.',
    // pts (phase 32 part 4a): TURNABOUT — the verb (5, same base as REAP ALL
    // — the same "ALL-spender capstone" archetype: consume the whole bank)
    // + 1.5 burst per rung banked in `rungsDeniedTotal` x an expected ~20-rung
    // bank (~2-4 rungs/phase x ~6-8 phases, 2026-07-10-theme-identity.md §2)
    // / 3 (dotLifetimeDivisor) = 5 + 1.5x20/3 = 15 + FREE reveal the next
    // stance (1.5, control's currency) = 16.5, in-band for rare [7,19].
    // Realistic burst at that ~20-rung bank = round(1.5 x 20) = 30 HP,
    // comparable to the-reaping's realistic burst range (burstPerSoul 4 x a
    // ~5-10 Soul bank = 20-40) per the brief's sizing instruction. Prior art:
    // kb:dawncaster/keywords/momentum.okf.md (src-001, community, medium) —
    // the closest Dawncaster analogue to a banked-counter capstone ("whenever
    // you have 5+ Momentum, remove all stacks and draw a card"), though
    // theirs auto-fires at a threshold and pays a card-draw dividend, not a
    // player-spent burst — the magnitude doesn't transfer, only the "a
    // passive tally becomes a real payoff" shape does. TURNABOUT is NOT
    // authored as a 31st registry keyword: its mechanic is a new
    // specialMechanics kind (card-local vocabulary, like REAP ALL / RUPTURE
    // ALL are to REAP / RUPTURE), but its display badge stays "BACKFIRE ALL"
    // — the cash-out variant of the existing BACKFIRE hallmark, not a new
    // keyword word (keeps the 30-keyword proving gate untouched).
    free: { revealStance: true },
    specialMechanics: [{ kind: 'turnabout', burstPerRung: 1.5 }],
    addedIn: '2026-07-08',
    tags: ['control', 'payoff'],
};

const quagmireOfDoubt: Card = {
    id: 'quagmire-of-doubt',
    theme: 'control',
    persistentEffect: 'Enemy telegraphs enter play one STAGGER rung lower.',
    name: 'Quagmire of Doubt',
    philosophicalAspect: 'mind',
    description:
        'The ground under their certainty goes soft. Every action starts one ' +
        'rung lower than they remember planning it.',
    tier: 2, rank: 6, cardType: 'disenchant',
    targetType: 'enemy',
    // pts: engine text — telegraphs enter play 1 rung lower, rest of combat (Aporia)
    addedIn: '2026-07-08',
    tags: ['control', 'disenchant'],
};

// ─── T6 — ORACLE (foretell, declare, collect on the future) ──────────────────

const glimpse: Card = {
    id: 'glimpse',
    theme: 'oracle',
    name: 'Glimpse',
    philosophicalAspect: 'mind',
    description:
        'A crack in the next moment, wide enough for one eye. You look, and ' +
        'mark what looks back — the wound starts arriving a beat before the ' +
        'blow that causes it.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'POISON 1 for 1 turn. MARK 1 for 2 turns. FORETELL 2.',
    // pts (WS10.1 KW-1, 2026-07-11 — foretold-wound replaced by its parts:
    // POISON + MARK double-apply; spec 33 D4: cadence 2 → 1.83): poison i1 d1
    // (lifetime 1.83×2=3.66, tempo ÷3 ≈ 1.22) + mark i1 d2 (1.5) + FORETELL 2
    // (2) + FREE foretell (1) ≈ 5.7 → Doxa
    free: { foretell: 1 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', duration: 1 },
        { effectId: 'debuff_mark', appliedTo: 'opponent', duration: 2 },
    ],
    specialMechanics: [{ kind: 'foretell', count: 2 }],
    addedIn: '2026-07-08',
    tags: ['oracle', 'exposure'],
};

const signsAndPortents: Card = {
    id: 'signs-and-portents',
    theme: 'oracle',
    name: 'Signs and Portents',
    philosophicalAspect: 'heart',
    description:
        'You cast the die as augury and dare tomorrow to disagree. When it ' +
        'does not, the future owes you.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    paidSummary:
        'OMEN — stake a claim in window 1-2, ante 2 Conviction at window 1. ' +
        'On a hit, DRAW 2.',
    // pts (phase 32 part 4d — OMEN v2): the printed rider/dieBonus/info
    // arithmetic is UNCHANGED — OMEN(draw 2 = 4 ×0.6 omen-odds = 2.4) +
    // omenInfo 1 = 3.4 — but the claim now carries a REAL up-front wager:
    // anteConviction 2 credits at −0.75× (same self-cost-credit convention
    // as RECOIL) = −1.5, netting 1.9. + FREE foretell (1) = 2.9 → Lemma
    // (was 4.4; the ante is a genuine new cost, not a re-tune of the rider —
    // see phase_32_theme_deep_work.md §Part 4d Decisions). At the printed
    // window-1 claim the rider is untouched (draw 2, unscaled); a window-2
    // hedge halves both the ante (1◆) and the rider (draw 1).
    free: { foretell: 1 },
    specialMechanics: [{ kind: 'omen', maxWindow: 2, anteConviction: 2, rider: { drawCards: 2 } }],
    addedIn: '2026-07-08',
    tags: ['oracle'],
};

const cassandrasBurden: Card = {
    id: 'cassandras-burden',
    theme: 'oracle',
    name: "Cassandra's Burden",
    philosophicalAspect: 'heart',
    description:
        'You saw it coming. No one believed you — so you braced alone, and ' +
        'named the exact place it would land. It is already starting to hurt.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'POISON 1 and MARK 1 for 2 turns. OMEN — stake window 1-2 (ante 2 ' +
        'Conviction at window 1): on hit, GUARD 4.',
    // pts (WS10.1 KW-1, 2026-07-11 — foretold-wound replaced by its parts:
    // POISON + MARK double-apply, intensity tuned 2 → 1 for the card-played
    // clock; phase 30 FREE-currency law; spec 33 D4: cadence 2 → 1.83): poison
    // i1 d2 (lifetime 7.3, tempo ÷3 ≈ 2.1) + mark i1 d2 (1.5) + OMEN(Guard 4
    // ×0.6 + info 1 = 1.6) + FREE FORETELL 1 (1, oracle's currency, weak
    // deposit) + DRAW 1 kicker (2, legal alongside the weak deposit) ≈ 8.2 →
    // Thesis. The WOUND lands on cast ("already
    // starting to hurt"); the BRACE (guard 4) is the prophecy payoff,
    // realized only when the prediction proves true.
    // phase 32 part 4d (OMEN v2): the OMEN term above is unchanged at the
    // printed window-1 claim (its own −0.75× ante credit now folds in
    // separately) — anteConviction 2 credits at −0.75× = −1.5, netting
    // 8.77 − 1.5 = 7.27 → still Thesis/Theorem-band honest. A window-2
    // hedge halves both the ante (1◆) and the Guard payoff (2) in exchange
    // for a second try at the phase boundary.
    free: { foretell: 1, drawCards: 1 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 },
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    specialMechanics: [{
        kind: 'omen',
        maxWindow: 2,
        anteConviction: 2,
        rider: { guard: 4 },
    }],
    addedIn: '2026-07-08',
    tags: ['oracle', 'exposure'],
};

const delphicAmbiguity: Card = {
    id: 'delphic-ambiguity',
    theme: 'oracle',
    name: 'Delphic Ambiguity',
    philosophicalAspect: 'mind',
    description:
        'The oracle never lies, only arrives early. You read the sentence ' +
        'before it is finished — the first half of the prophecy has already ' +
        'landed on them.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'RUPTURE 1 affliction — its remaining damage lands now. Gain 1 SOUL, ' +
        'then FORETELL 1.',
    // pts (phase 30): consume_affliction/RUPTURE 1 (Foretold Wound fuel,
    // ~4-5) + 1 Soul (0.75) + foretell 1 (1.5) +
    // FREE FORETELL 1 (1, replaces TICK) ≈ 8.25 → Theorem
    free: { foretell: 1 },
    specialMechanics: [
        { kind: 'consume_affliction', souls: 1 },
        { kind: 'foretell', count: 1 },
    ],
    addedIn: '2026-07-08',
    tags: ['oracle', 'payoff'],
};

const prophecyFulfilled: Card = {
    id: 'prophecy-fulfilled',
    theme: 'oracle',
    name: 'Prophecy Fulfilled',
    philosophicalAspect: 'mind',
    description:
        'Every omen that came true is a nail already driven. This is just ' +
        'the hammer falling on all of them at once.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'RUPTURE ALL — deal 3 extra damage for each OMEN hit this combat.',
    // pts: RUPTURE (4 + fuel) + 3 fuel per omen hit ≈ 13 with a played oracle engine → Axiom
    free: { foretell: 1 },
    specialMechanics: [{ kind: 'rupture', fuelPerOmenHit: 3 }],
    addedIn: '2026-07-08',
    tags: ['oracle', 'payoff'],
};

const theOraclesEye: Card = {
    id: 'the-oracles-eye',
    theme: 'oracle',
    persistentEffect: 'The next stance stays revealed (FORETELL); OMEN payoffs land ×1.5 (round up).',
    name: "The Oracle's Eye",
    philosophicalAspect: 'heart',
    description:
        'The lid never closes again. The enemy stops having a next move you ' +
        'have not already seen.',
    tier: 2, rank: 5, cardType: 'enchantment',
    targetType: 'self',
    // pts: persistent always-revealed next stance + omen riders ×1.5 ≈ 12 (min-4 law) → Axiom
    addedIn: '2026-07-08',
    tags: ['oracle', 'enchantment'],
};

// ─── T7 — HARVEST (short afflictions churn into Souls; Souls into the scythe) ─

const briefCandle: Card = {
    id: 'brief-candle',
    theme: 'harvest',
    name: 'Brief Candle',
    philosophicalAspect: 'body',
    description:
        'Out, out. It burns bright, it burns fast, and what it leaves ' +
        'behind is yours to gather — some of it before it even finishes burning.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Afflict with BLEED 2 for 1 turn.',
    // pts (WS3.5 clock re-price, 2026-07-11): bleed i2 d1 on the
    // damage-instance clock — 2 expected ticks land BOTH stacks in the round
    // (6+3 = 9 HP → 3) + FREE souls 1 (0.75) = 3.75 → Doxa, in-budget; the
    // fast washout is the Soul engine's fuel.
    free: { souls: 1 },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 1 }],
    addedIn: '2026-07-08',
    tags: ['harvest', 'dot'],
};

const winnowing: Card = {
    id: 'winnowing',
    theme: 'harvest',
    name: 'Winnowing',
    philosophicalAspect: 'body',
    description:
        'The scythe does not wait for the season. One standing affliction, ' +
        'cut and threshed and pocketed now — and the thresher keeps more of the grain than it used to.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'RUPTURE 1 affliction, then gain 2 SOULS.',
    // pts (phase 30): consume 1 affliction → fuel ticks NOW (~4-5) + 2 Souls
    // (1.5) + FREE short-fuse BLEED seed i1 d1 (~1, plants an affliction that
    // expires next round and yields its own Soul via the SOUL-on-expiry hook
    // — harvest's currency, never minting a Soul directly on FREE) ≈ 7.9-8.9
    // → Thesis-tier.
    free: { applyEffect: { effectId: 'debuff_bleed', intensity: 1, duration: 1 } },
    specialMechanics: [{ kind: 'consume_affliction', souls: 2 }],
    addedIn: '2026-07-08',
    tags: ['harvest', 'payoff'],
};

const theGleanersDue: Card = {
    id: 'the-gleaners-due',
    theme: 'harvest',
    name: "The Gleaner's Due",
    philosophicalAspect: 'mind',
    description:
        'What the field owes the one who walks behind the reapers: a die ' +
        'from the leavings, something to read by, and a coin pressed back into your palm on the way out.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'REAP 2: KINDLE a mind die, DRAW 2, and gain 1 SOUL.',
    // pts: REAP 2 → KINDLE (2.5) + draw 2 (4) − soul cost 2 + rider soul 1 + FREE
    // draw 0.7 + FREE soul 0.75 ≈ 6.45 → Theorem-tier. The PAID reap returns 1
    // Soul ("a coin pressed back into your palm on the way out"), net drain 1.
    // Phase 32 part 1 (unscored, engine-verb behavior): every REAP that spends
    // Souls now also erodes the enemy's maxHealth by round(cost × 2) — a
    // small permanent ceiling bite riding this paid effect for free, matching
    // how bone-orchard's enchant text documents non-scored engine behavior.
    free: { drawCards: 1, souls: 1 },
    specialMechanics: [{ kind: 'reap', cost: 2, rider: { drawCards: 2, souls: 1 }, kindle: 'mind' }],
    addedIn: '2026-07-08',
    tags: ['harvest'],
};

const theReaping: Card = {
    id: 'the-reaping',
    theme: 'harvest',
    name: 'The Reaping',
    philosophicalAspect: 'body',
    description:
        'Every soul you gathered, swung at once — and some of what it costs them ' +
        'comes back to you. The harvest was never for keeping. It was for this, and for what comes after.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'REAP ALL your SOULS — 4 damage each, then SIPHON 40%.',
    // pts (phase 30): REAP ALL — 4 per Soul (burstPerSoul 2→4; caps at 80 dmg
    // off a ~20-Soul bank) + SIPHON 40% of the burst back as healing + FREE
    // short-fuse BLEED seed i1 d1 (~1, replaces TICK) ≈ 17.4-19.4.
    // Phase 32 part 1 (unscored, engine-verb behavior): the same burst that
    // hits current HP now ALSO permanently erodes the enemy's maxHealth by
    // the identical amount — additive, not a replacement, so this card's
    // current-HP output and its priced total are unchanged; the erosion is
    // "REAP attacks MAXIMUM HP" riding the existing paid burst for free.
    free: { applyEffect: { effectId: 'debuff_bleed', intensity: 1, duration: 1 } },
    specialMechanics: [{ kind: 'reap_all', burstPerSoul: 4 }, { kind: 'siphon', pct: 0.4 }],
    addedIn: '2026-07-08',
    tags: ['harvest', 'payoff'],
};

const boneOrchard: Card = {
    id: 'bone-orchard',
    theme: 'harvest',
    persistentEffect: 'Each SOUL you gain deals 1 to the enemy.',
    name: 'Bone Orchard',
    philosophicalAspect: 'mind',
    description:
        'Plant what expires; the orchard does the rest. Every soul that ' +
        'falls to you takes a bite of them on the way.',
    tier: 2, rank: 5, cardType: 'enchantment',
    targetType: 'self',
    // pts: persistent 1 HP per Soul gained (soul-gated drip) ≈ 1 × ~12 souls, min-4 ≈ 12 → Axiom
    addedIn: '2026-07-08',
    tags: ['harvest', 'enchantment'],
};

// ─── T8 — CHARM (SWAY toward CAPITULATION — the deck that never strikes) ─────

const softWord: Card = {
    id: 'soft-word',
    theme: 'charm',
    name: 'Soft Word',
    philosophicalAspect: 'heart',
    description:
        'It turns away wrath — not by winning, but by making wrath feel ' +
        'over-dressed for the occasion.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'SWAY 3.',
    // pts (phase 30): SWAY 3 (2.4) + FREE RAPPORT i1 d2 seed (1.5, charm's
    // rapport-building currency, replaces the bare heal) ≈ 3.9 → Doxa
    free: { applyEffect: { effectId: 'debuff_rapport', intensity: 1, duration: 2 } },
    specialMechanics: [{ kind: 'sway', amount: 3 }],
    addedIn: '2026-07-08',
    tags: ['charm', 'alt-win'],
};

const disarmingSmile: Card = {
    id: 'disarming-smile',
    theme: 'charm',
    name: 'Disarming Smile',
    philosophicalAspect: 'heart',
    description:
        'Hard to swing at someone who seems glad to see you. Their blows ' +
        'arrive apologizing.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Afflict with RAPPORT 2 for 2 turns, then HEAL 2.',
    // pts: rapport i2 d2 (3) + heal 2 (0.65) + FREE sway 1 (0.3) ≈ 4.5 → Lemma
    free: { sway: 1 },
    combatEffects: [{ effectId: 'debuff_rapport', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'rider', rider: { healHp: 2 } }],
    addedIn: '2026-07-08',
    tags: ['charm'],
};

const commonGround: Card = {
    id: 'common-ground',
    theme: 'charm',
    name: 'Common Ground',
    philosophicalAspect: 'heart',
    description:
        'You find the one thing you both believe and stand on it together. ' +
        'It is very hard to duel on shared ground.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'RAPPORT 1 for 2 turns, then SWAY 2.',
    // pts (phase 30): SWAY 2 (1.6) + rapport i1 d2 (1.5) + FREE RAPPORT i1 d2
    // seed (1.5, weak-ish deposit) + DRAW 1 kicker (0.7, legal alongside it)
    // + threshold(SWAY 2 ×0.5 = 0.8) + tempo ≈ 8.5 → Thesis
    free: { applyEffect: { effectId: 'debuff_rapport', intensity: 1, duration: 2 }, drawCards: 1 },
    combatEffects: [{ effectId: 'debuff_rapport', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    specialMechanics: [{ kind: 'sway', amount: 2 }],
    threshold: { color: 'heart', count: 3, rider: { sway: 2 } },
    addedIn: '2026-07-08',
    tags: ['charm'],
};

const theOliveBranch: Card = {
    id: 'the-olive-branch',
    theme: 'charm',
    name: 'The Olive Branch',
    philosophicalAspect: 'body',
    description:
        'Extended with a steady hand, from inside their reach. A truce offered ' +
        'from a guard position carries further.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'SWAY 3, then CLEANSE 1 and HEAL 3.',
    // pts (phase 30): SWAY 3 (2.4) + cleanse (1.5) + heal 3 (1) + FREE
    // RAPPORT i1 d2 seed (1.5, replaces the chip guard) + tempo ≈ 9.4 → Theorem
    free: { applyEffect: { effectId: 'debuff_rapport', intensity: 1, duration: 2 } },
    specialMechanics: [
        { kind: 'sway', amount: 3 },
        { kind: 'rider', rider: { cleanse: 1, healHp: 3 } },
    ],
    addedIn: '2026-07-08',
    tags: ['charm', 'defense'],
};

const irresistibleGrace: Card = {
    id: 'irresistible-grace',
    theme: 'charm',
    persistentEffect: 'SWAY does not decay. At the end of each turn, future SWAY gains increase by 12% (maximum +108%).',
    name: 'Irresistible Grace',
    philosophicalAspect: 'heart',
    description:
        'What has truly been offered cannot be taken back, and cannot wear ' +
        'off. Your sway stops decaying — and the longer it holds, the more ' +
        'each new gesture of it lands, gathering momentum with every turn.',
    tier: 2, rank: 5, cardType: 'enchantment',
    targetType: 'self',
    // pts: persistent — SWAY no longer decays (≈ +1/turn saved) AND stacks
    // buff_grace_momentum (+12%/stack, cap 9) so every future SWAY gain
    // compounds while held, rest of combat, min-4 ≈ 12 → Axiom
    addedIn: '2026-07-08',
    tags: ['charm', 'enchantment'],
};

const mirrorOfLonging: Card = {
    id: 'mirror-of-longing',
    theme: 'charm',
    persistentEffect: 'Damage prevented by your GUARD or RIPOSTE becomes SWAY, 1:1.',
    name: 'Mirror of Longing',
    philosophicalAspect: 'heart',
    description:
        'Every blow you turn aside shows them what they actually wanted. ' +
        'Prevented violence converts to persuasion — and to more of it, as ' +
        'your resolve gathers momentum.',
    tier: 2, rank: 6, cardType: 'disenchant',
    targetType: 'enemy',
    // pts: engine text — damage your defenses prevent becomes SWAY (Aporia)
    addedIn: '2026-07-08',
    tags: ['charm', 'disenchant', 'alt-win'],
};

// ─── T9 — BULWARK (guard, thorns, riposte — their aggression kills them) ─────

const braceForImpact: Card = {
    id: 'brace-for-impact',
    theme: 'bulwark',
    name: 'Brace for Impact',
    philosophicalAspect: 'body',
    description:
        'You set your stance and meet the blow on your own terms — what is ' +
        'braced for cannot break you.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'GUARD 8.',
    // pts (phase 30): Guard 8 (2) + FREE persistent GUARD 2 (0.67, bulwark's
    // "lay a brick" currency, replaces the fading chip) + pip line (+2/pip,
    // situational ≈ 0.8) ≈ 3.47 → Doxa (starter)
    free: { barrier: 2 },
    specialMechanics: [{ kind: 'guard', amount: 8 }],
    addedIn: '2026-07-08',
    tags: ['bulwark', 'defense', 'starter'],
};

const nettleCloak: Card = {
    id: 'nettle-cloak',
    theme: 'bulwark',
    name: 'Nettle Cloak',
    philosophicalAspect: 'body',
    description:
        'Wear the argument that stings on contact — and stings just as well ' +
        'standing still. Let them figure out the lesson with their knuckles, ' +
        'or simply, eventually, with their skin.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    paidSummary:
        'THORNS 2 for 2 turns. Nettle Sting 1 on the foe for 2 turns — 2 ' +
        'damage at the end of each turn.',
    // pts (phase 30): thorns i2 d2 (~3, reactive, unchanged) + NEW
    // non-reactive Nettle Sting i1 d2 applied directly to the enemy on cast
    // (~1.5, fires even if they never swing) + FREE persistent GUARD 2
    // (0.67, replaces the fading chip) + reflect synergy ≈ 5.97 → Lemma
    free: { barrier: 2 },
    combatEffects: [
        { effectId: 'buff_thorns', appliedTo: 'self', intensity: 2, duration: 2 },
        { effectId: 'debuff_nettle_sting', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    addedIn: '2026-07-08',
    tags: ['bulwark', 'reflect'],
};

const tuQuoque: Card = {
    id: 'tu-quoque',
    theme: 'bulwark',
    name: 'Tu Quoque',
    philosophicalAspect: 'heart',
    description:
        '"You also." The oldest counter in the book — whatever they do to ' +
        'you becomes, instantly, about them.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'THORNS 3 for 2 turns.',
    // pts (phase 30): thorns i3 d2 (~4.5) + FREE persistent GUARD 2 (0.67,
    // replaces the fading chip) + tempo ≈ 6.37 → Thesis
    free: { barrier: 2 },
    combatEffects: [{ effectId: 'buff_thorns', appliedTo: 'self', intensity: 3, duration: 2 }],
    addedIn: '2026-07-08',
    tags: ['bulwark', 'reflect'],
};

const measuredAnswer: Card = {
    id: 'measured-answer',
    theme: 'bulwark',
    name: 'Measured Answer',
    philosophicalAspect: 'body',
    description:
        'You do not interrupt. You let the whole blow arrive, catch it ' +
        'entire, and reply in kind — once, precisely.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'GUARD 6, then arm RIPOSTE 3 with parry 2 for one threat phase.',
    // pts (phase 30): Guard 6 (1.5) + RIPOSTE 3/parry 2 (~4) + FREE persistent
    // GUARD 3 (1, replaces the fading chip) + full-block gate + tempo ≈ 9.25
    // → Theorem. Phase 32 part 2: RIPOSTE's 3 is now a floor — it counters
    // for the full prevented blow when that exceeds 3 (unscored upside).
    free: { barrier: 3 },
    specialMechanics: [{ kind: 'guard', amount: 6 }, { kind: 'riposte', damage: 3, reduce: 2 }],
    addedIn: '2026-07-08',
    tags: ['bulwark', 'reflect'],
};

const theAdamantWall: Card = {
    id: 'the-adamant-wall',
    theme: 'bulwark',
    name: 'The Adamant Wall',
    philosophicalAspect: 'body',
    description:
        'Not a defense — a verdict about where the fight ends. What breaks ' +
        'against it answers for the attempt.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'GUARD 10 that persists, then arm RIPOSTE 4 with a parry of 2.',
    // pts (phase 30): persistent GUARD 10 (3.3) + RIPOSTE 4/parry 2 (~5) +
    // FREE persistent GUARD 3 (1, replaces the fading chip) + persistence ≈
    // 13.3 → Axiom. Phase 32 part 2: RIPOSTE's 4 is now a floor — it counters
    // for the full prevented blow when that exceeds 4 (unscored upside).
    free: { barrier: 3 },
    specialMechanics: [{ kind: 'barrier', amount: 10 }, { kind: 'riposte', damage: 4, reduce: 2 }],
    addedIn: '2026-07-08',
    tags: ['bulwark', 'reflect', 'payoff'],
};

const hedgehogsDilemma: Card = {
    id: 'hedgehogs-dilemma',
    theme: 'bulwark',
    persistentEffect: 'Every THORNS reflection also MARKs the enemy (i1).',
    name: "Hedgehog's Dilemma",
    philosophicalAspect: 'body',
    description:
        'To reach you they must come close; to come close is to be pierced. ' +
        'Every prick leaves the flaw named.',
    tier: 2, rank: 5, cardType: 'enchantment',
    targetType: 'self',
    // pts: persistent — every THORNS trigger also marks the enemy ≈ 1 × ~8 triggers, min-4 ≈ 12 → Axiom
    addedIn: '2026-07-08',
    tags: ['bulwark', 'enchantment'],
};

const crumblingResolve: Card = {
    id: 'crumbling-resolve',
    theme: 'bulwark',
    persistentEffect: 'After each threat phase, deal 20% of your remaining GUARD (minimum 4). Fully blocking an attack STAGGERs the next telegraph by 1.',
    name: 'Crumbling Resolve',
    philosophicalAspect: 'body',
    description:
        'A curse for the patient too: the wall does not need to be struck to ' +
        'collect. Every round it stands whole, its weight tells on them ' +
        'regardless — and every swing it swallows costs them a rung.',
    tier: 2, rank: 6, cardType: 'disenchant',
    targetType: 'enemy',
    // pts: engine text (Aporia). RETAINS the old clause (a fully-blocked attack
    // still costs the enemy 1 rung on its next telegraph). ADDS the deck's
    // genuine non-reactive lever: at the end of EVERY threat phase, if
    // (leftover guard + persistent barrier) > 0, the enemy takes direct damage
    // = max(4, round(0.2 x (guard+barrier))) -- fires whether or not the enemy
    // attacked that round. See combat.engine.ts hook (2026-07-08 engine pass).
    addedIn: '2026-07-08',
    tags: ['bulwark', 'disenchant'],
};

// ─── T10 — ECHO (the discard is a songbook; the refrain never ends) ──────────

const refrain: Card = {
    id: 'refrain',
    theme: 'echo',
    name: 'Refrain',
    philosophicalAspect: 'mind',
    description:
        'Said once, it is a remark. Said twice, in the same breath, it ' +
        'starts to sound like the truth — and the truth leaves a mark.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'MARK 1 for 2 turns. POISON 1 for 1 turn. ECHO.',
    // pts (WS10.1 KW-1 fold, 2026-07-11 — echo_sting folded into POISON,
    // duration tuned 2 → 1: the ECHO already re-applies it; phase 30
    // FREE-currency law; spec 33 D4: card-played cadence 2 → 1.83): [mark d2
    // (1.5) + poison i1 d1 (lifetime 1.83×2=3.66, tempo ÷3 ≈ 1.22)] ×
    // ECHO(1.8) ≈ 4.9 + FREE MILL 1 (1, echo's "advance the loop" currency —
    // feeds RECALL without drawing, replaces the bare draw) ≈ 5.9 → upper
    // Doxa band (deliberately rich -- Early's legal pool is ONLY this +
    // second-thoughts).
    free: { millCards: 1 },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', duration: 2 },
        { effectId: 'debuff_poison', appliedTo: 'opponent', duration: 1 },
    ],
    specialMechanics: [{ kind: 'echo' }],
    addedIn: '2026-07-08',
    tags: ['echo', 'exposure'],
};

const secondThoughts: Card = {
    id: 'second-thoughts',
    theme: 'echo',
    name: 'Second Thoughts',
    philosophicalAspect: 'mind',
    description:
        'The discarded idea was not wrong — it was early. You reach back ' +
        'into the pile, take it again, and cash in what it already cost them.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'RECALL 1, then consume the foe\'s MARK stacks — 1 damage per stack.',
    // pts (phase 30): RECALL 1 (2) + FREE MILL 1 (1, replaces the bare draw)
    // + PAID ruptureMarks:1 (~1.5) + selection value ≈ 5.5 → Lemma.
    // ruptureMarks rides the PAID face (a `rider` specialMechanic) so it
    // detonates WITH the reprise — "cash in what it already cost them" —
    // instead of only on the dieless top play.
    free: { millCards: 1 },
    specialMechanics: [
        { kind: 'reprise', count: 1 },
        { kind: 'rider', rider: { ruptureMarks: 1 } },
    ],
    addedIn: '2026-07-08',
    tags: ['echo', 'recursion'],
};

const circularReasoning: Card = {
    id: 'circular-reasoning',
    theme: 'echo',
    name: 'Circular Reasoning',
    philosophicalAspect: 'mind',
    description:
        'The conclusion proves the premise proves the conclusion. Nothing ' +
        'ever leaves the loop — including your best card.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'RECALL 1 card — its FREE line fires now.',
    // pts (phase 30): RECALL 1 + its FREE line fires now (2 + ~1.5) + FREE
    // MILL 1 (1, replaces the bare draw) + selection ≈ 9.3 → Theorem
    free: { millCards: 1 },
    specialMechanics: [{ kind: 'reprise', count: 1, fireFree: true }],
    addedIn: '2026-07-08',
    tags: ['echo', 'recursion'],
};

const ouroboros: Card = {
    id: 'ouroboros',
    theme: 'echo',
    name: 'Ouroboros',
    philosophicalAspect: 'mind',
    description:
        'The argument eats its own tail and grows fat on it. Whatever you ' +
        'said last, the serpent says twice more — then every MARK it left ' +
        'behind breaks open at once.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Replay your last spell ×2, then consume the foe\'s MARK stacks — 3 ' +
        'damage per stack.',
    // pts (phase 30): replay last spell PAID x2 (~10) + FREE MILL 1 (1,
    // replaces the bare draw) + PAID ruptureMarks:3 (consumes ALL current
    // Mark stacks, 3 dmg/stack) ≈ 22.3-33.3 → Axiom+ (deliberately pushed
    // above the old budget: this is now the deck's actual finisher).
    // ruptureMarks rides the PAID face (a `rider` mechanic) so the detonation
    // fires WITH the replay — "everything it says for damage, all at once" —
    // instead of only on the dieless top play (where it did nothing).
    free: { millCards: 1 },
    specialMechanics: [
        { kind: 'replay_last', times: 2 },
        { kind: 'rider', rider: { ruptureMarks: 3 } },
    ],
    addedIn: '2026-07-08',
    tags: ['echo', 'recursion', 'payoff'],
};

const resonantChamber: Card = {
    id: 'resonant-chamber',
    theme: 'echo',
    persistentEffect: 'Your first spell each turn gains ECHO.',
    name: 'Resonant Chamber',
    philosophicalAspect: 'mind',
    description:
        'The room learns your voice. The first thing you say each turn ' +
        'comes back saying itself.',
    tier: 2, rank: 5, cardType: 'enchantment',
    targetType: 'self',
    // pts: persistent — the first spell each turn gains ECHO ≈ ×0.8 spell/turn × rest, min-4 ≈ 12 → Axiom
    addedIn: '2026-07-08',
    tags: ['echo', 'enchantment'],
};

const stuckInTheirHead: Card = {
    id: 'stuck-in-their-head',
    theme: 'echo',
    persistentEffect: "Each ECHO, RECALL, or replay deals the foe's MARK stacks as damage (min 2, max 16).",
    name: 'Stuck in Their Head',
    philosophicalAspect: 'heart',
    description:
        'The tune they cannot stop hearing is yours. Every repetition ' +
        'costs them a little more of themselves.',
    tier: 2, rank: 6, cardType: 'disenchant',
    targetType: 'enemy',
    // pts: engine text — every ECHO / REPRISE drips 2 (echo-gated, §1 source 3) (Aporia)
    addedIn: '2026-07-08',
    tags: ['echo', 'disenchant'],
};

// ─── Library assembly ────────────────────────────────────────────────────────

// Spec 33 dice-interaction valves -- promoted from sandbox set
// `dice-valves-33` in Phase D8 (2026-07-18) after the per-preset A/B court;
// each replaces one same-aspect preset seat under the Upgradeable-Dice flag.

/** Recurring Symptom — affliction, the REROLL valve: shake off the misses and
 *  let the venom settle in deeper. */
const recurringSymptom: Card = {
    id: 'recurring-symptom',
    theme: 'affliction',
    name: 'Recurring Symptom',
    philosophicalAspect: 'body',
    description:
        'It never fully clears. Roll the dice of the day however they fall — '
        + 'the fever was always going to come back around, and it comes back worse.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Inflict POISON 1 for 2 turns. Reroll all spent, exhausted, or X dice ' +
        'in your tray except floating dice.',
    // pts (spec 33 D4): REROLL this card's miss faces (2.0) + poison i1 d2
    // (card-played clock, 1.83 cadence: tempo-weighted 6.4 ÷3 = 2.14) = 4.14 +
    // FREE mark i1 d2 (0.75×1×2 = 1.5) = 5.64 → uncommon band 4.5-13 (Thesis).
    // FREE share 1.5/5.64 = 26.6% ✓.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } },
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    specialMechanics: [{ kind: 'reroll_spent' }],
    addedIn: '2026-07-17',
    tags: ['affliction', 'dice', 'valve', 'dot'],
};

/** Break the Tempo — control, the CONVERT valve: turn a die WILD so the denial
 *  always lands on the color it needs. */
const breakTheTempo: Card = {
    id: 'break-the-tempo',
    theme: 'control',
    name: 'Break the Tempo',
    philosophicalAspect: 'mind',
    description:
        'Their whole argument keeps one rhythm. Recolor your answer to match '
        + 'whatever they lean on, and the beat they were counting on drops out.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts (spec 33 D4): CONVERT the powering die to WILD (2.5) + STAGGER 1
    // (2.0) = 4.5 + FREE [mark i1 d1 (0.75) + conviction 1 (1.0)] = 1.75 →
    // 6.25 → uncommon band 4.5-13 (Thesis). FREE share 1.75/6.25 = 28% ✓.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 }, conviction: 1 },
    specialMechanics: [
        { kind: 'convert_die_color' },
        { kind: 'stagger', rungs: 1 },
    ],
    addedIn: '2026-07-17',
    tags: ['control', 'dice', 'valve'],
};

/** Second Take — echo, the REFRESH valve: the die comes back for one more line,
 *  the way the refrain comes back for one more bar. */
const secondTake: Card = {
    id: 'second-take',
    theme: 'echo',
    name: 'Second Take',
    philosophicalAspect: 'mind',
    description:
        'Play it, then play it again from the top — the same die, the same '
        + 'breath, one more pass through the phrase before it is spent.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts (spec 33 D4): REFRESH the powering die back to available (2.0) +
    // mark i1 d2 (1.5) = 3.5 + FREE MILL 1 (echo's loop currency, 1.0) = 4.5
    // → common band 1.5-7.5 (Lemma). FREE share 1.0/4.5 = 22%.
    free: { millCards: 1 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    specialMechanics: [{ kind: 'refresh_die' }],
    addedIn: '2026-07-17',
    tags: ['echo', 'dice', 'valve'],
};

/** Bleed for It — akrasia, the REROLL valve priced in blood: pay to re-roll the
 *  misses, and the spilled blood sharpens the wound. */
const bleedForIt: Card = {
    id: 'bleed-for-it',
    theme: 'akrasia',
    name: 'Bleed for It',
    philosophicalAspect: 'body',
    description:
        'A bad roll is not fate — it is a price you have not paid yet. Open a '
        + 'vein, force the dice over, and let the argument taste what it cost you.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts (spec 33 D4): REROLL miss faces (2.0) + bleed i2 d2 (damage-instance,
    // decay-limited 9 ÷3 = 3.0) + RECOIL 3 (−3 × 1/3 × 0.75 = −0.75) = 4.25 +
    // FREE [self-mark i1 d1 seed toward FALLEN (0.75) + heal 2 (0.67)] = 1.42
    // → 5.67 → uncommon band 4.5-13 (Thesis). FREE share 25%.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' }, healHp: 2 },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [
        { kind: 'reroll_spent' },
        { kind: 'recoil', hp: 3 },
    ],
    addedIn: '2026-07-17',
    tags: ['akrasia', 'dice', 'valve', 'dot'],
};

/** Bank the Yield — harvest, the BANK valve: hold the die over to next phase the
 *  way you hold a soul for the reaping. */
const bankTheYield: Card = {
    id: 'bank-the-yield',
    theme: 'harvest',
    name: 'Bank the Yield',
    philosophicalAspect: 'heart',
    description:
        'Do not spend what will be worth more next season. Set the die aside '
        + 'to ripen in the Reserve, and book the souls it was owed today.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts (spec 33 D4): BANK the powering die to the Reserve (2.0) + SOUL 3
    // (3 × 0.75 = 2.25) = 4.25 + FREE [souls 1 (0.75) + heal 2 (0.67)] = 1.42
    // → 5.67 → uncommon band 4.5-13 (Thesis). FREE share 25%.
    free: { souls: 1, healHp: 2 },
    specialMechanics: [
        { kind: 'bank_spent_die' },
        { kind: 'soul_gain', count: 3 },
    ],
    addedIn: '2026-07-17',
    tags: ['harvest', 'dice', 'valve'],
};

/** Hold the Line — bulwark, the BANK valve: keep the die in Reserve like a stone
 *  kept in the wall, and pour a footing while you wait. */
const holdTheLine: Card = {
    id: 'hold-the-line',
    theme: 'bulwark',
    name: 'Hold the Line',
    philosophicalAspect: 'body',
    description:
        'Not every die is thrown. Some are set into the wall and left there, '
        + 'load-bearing — the argument holds because you refused to spend them.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts (spec 33 D4): BANK the powering die to the Reserve (2.0) + BARRIER 5
    // (5 ÷ 3 = 1.67) = 3.67 + FREE barrier 3 (3 ÷ 3 = 1.0) = 4.67 → common band
    // 1.5-7.5 (Lemma). FREE share 1.0/4.67 = 21%.
    free: { barrier: 3 },
    specialMechanics: [
        { kind: 'bank_spent_die' },
        { kind: 'barrier', amount: 5 },
    ],
    addedIn: '2026-07-17',
    tags: ['bulwark', 'dice', 'valve', 'defense'],
};

/** Restate the Point — peroration, the REFRESH valve: the die comes back so the
 *  argument keeps building without a break. */
const restateThePoint: Card = {
    id: 'restate-the-point',
    theme: 'peroration',
    name: 'Restate the Point',
    philosophicalAspect: 'heart',
    description:
        'Say it once more, plainly, and the die you argued it with is yours '
        + 'again — the case does not pause to reload; it accrues.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts (spec 33 D4): REFRESH the powering die (2.0) + PREMISE 3 (3 × 0.8 =
    // 2.4) = 4.4 + FREE [premises 2 (1.6) + guard 1 (0.25)] = 1.85 → 6.25 →
    // uncommon band 4.5-13 (Thesis). FREE share 1.85/6.25 = 30% ✓.
    free: { premises: 2, guard: 1 },
    specialMechanics: [
        { kind: 'refresh_die' },
        { kind: 'premise', count: 3 },
    ],
    addedIn: '2026-07-17',
    tags: ['peroration', 'dice', 'valve'],
};

/** Second Sight — oracle, the CONVERT valve: recolor the die WILD to read
 *  whatever the future needs read. */
const secondSight: Card = {
    id: 'second-sight',
    theme: 'oracle',
    name: 'Second Sight',
    philosophicalAspect: 'mind',
    description:
        'The first sight shows you the die you were given; the second lets you '
        + 'choose what it means. Recolor it to any omen and read ahead.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts (spec 33 D4): CONVERT the powering die to WILD (2.5) + FORETELL 2
    // (2.0) = 4.5 + FREE [foretell 1 (1.0) + conviction 1 (1.0)] = 2.0 → 6.5 →
    // uncommon band 4.5-13 (Thesis). FREE share 2.0/6.5 = 31% ✓.
    free: { foretell: 1, conviction: 1 },
    specialMechanics: [
        { kind: 'convert_die_color' },
        { kind: 'foretell', count: 2 },
    ],
    addedIn: '2026-07-17',
    tags: ['oracle', 'dice', 'valve'],
};

/** Change of Heart — charm, the REROLL valve: talk the dice around the way you
 *  talk the foe around. */
const changeOfHeart: Card = {
    id: 'change-of-heart',
    theme: 'charm',
    name: 'Change of Heart',
    philosophicalAspect: 'heart',
    description:
        'Even the dice can be persuaded. Coax the misses into reconsidering, '
        + 'and while they soften, so does the one across from you.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts (spec 33 D4): REROLL miss faces (2.0) + SWAY 3 (3 × 0.9 = 2.7) = 4.7
    // + FREE sway 2 (1.8) = 6.5 → uncommon band 4.5-13 (Thesis). FREE share
    // 1.8/6.5 = 28% ✓.
    free: { sway: 2 },
    specialMechanics: [
        { kind: 'reroll_spent' },
        { kind: 'sway', amount: 3 },
    ],
    addedIn: '2026-07-17',
    tags: ['charm', 'dice', 'valve', 'alt-win'],
};

/**
 * Master's Stamp — forge, the special-amplifier enchantment (spec 33 §6). It
 * raises the FIRED special payload (+1◆ per fired special) without changing what
 * a special does (owner-lock D1) — wired by card id at combat.engine.ts's
 * `special-fired` hook (mirrors anvil-of-form / entropy-tax). Engine text, so it
 * scores 0 (priced by hand, min-4-triggers): at ~0.67 specials/round (D3), a
 * full fight fires ~3-4 specials → ~3-4◆ over its life — an Axiom-tier
 * persistent economy lift, same tier as anvil-of-form's +1-pip passive.
 */
const mastersStamp: Card = {
    id: 'forge-masters-stamp',
    theme: 'forge',
    persistentEffect: 'Every SPECIAL die you fire grants +1 Conviction.',
    name: "Master's Stamp",
    philosophicalAspect: 'mind',
    description:
        'Struck once into the die-steel, the maker\'s mark never wears off. '
        + 'Everything that die pays out, it pays out with interest owed to you.',
    tier: 2, rank: 5, cardType: 'enchantment',
    targetType: 'self',
    // pts: engine text — amplifies the fired SPECIAL payload (+1◆), min-4 ≈ 4
    // over a fight → Axiom. Amplifies the PAYLOAD, never the special's identity.
    addedIn: '2026-07-17',
    tags: ['forge', 'enchantment', 'special', 'dice', 'valve'],
};

// ─── 2026-07-19 swap-pool promotions (owner-ratified) ────────────────────────
// Nine measured promote-candidates from the 2026-07-18 swap-pool measurement
// pass (docs/reports/deck-tuning-2026-07-18.md) promoted into the library AND
// their preset recipe seats. Each card's evidence lives in that report; the
// combined-seat evidence lives in deck-tuning-2026-07-19-promotions.md.
// Color-law breaks were resolved by RECOLORING the card to the evicted seat's
// aspect (the-burden-of-repetition heart→body, half-spoken-prophecy
// mind→body); recipe partitions untouched. Evicted incumbents remain library
// cards (reward/unseated pool).

/** The Poisoned Well — promoted from swap-affliction (arm e1): the
 *  front-loaded i2d2 poison read that beat slippery-slope's i1d4 ramp at the
 *  erosion x4 body common seat (mid blind 0.370→0.503). Also carries the
 *  erosion D8 valve seat (recurring-symptom replaces one copy flag-on). */
const poisonedWell: Card = {
    id: 'poisoned-well',
    theme: 'affliction',
    name: 'The Poisoned Well',
    philosophicalAspect: 'body',
    description:
        'Argue from the source and the source obliges: everything they draw ' +
        'from it comes up tainted, and the first draught is the worst.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Inflict POISON 2 for 2 turns.',
    // pts: poison i2 d2 (card-played clock 1.83, tempo-weighted 12.81 ÷ 3 =
    // 4.27) + FREE [mark i1 d1 (0.75) + conviction 1 (1.0)] = 1.75 → 6.02 →
    // common band 1.5-7.5 (Doxa). FREE share 1.75/6.02 = 29.1% ✓.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 }, conviction: 1 },
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    addedIn: '2026-07-18',
    tags: ['affliction', 'dot'],
};

/** Videtur Quod — promoted from swap-peroration (arm o1): the longer-fuse
 *  poison common (d3 vs exordium's d2) at the oratory x4 heart seat; the
 *  run's cleanest commons engagement gain (mid sE 0.216→0.246). Also carries
 *  the oratory D8 valve seat (restate-the-point replaces one copy flag-on). */
const videturQuod: Card = {
    id: 'videtur-quod',
    theme: 'peroration',
    name: 'Videtur Quod',
    philosophicalAspect: 'heart',
    description:
        'It seems that — and there the flaw is stated, fairly, precisely, ' +
        'in their own terms. An argument shown its own wound sickens as ' +
        'it stands.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: PAID [poison i1 d3 (card-played 1.83 cadence, tempo-weighted
    // 9.49 ÷ 3 = 3.16) + PREMISE 1 (0.8)] = 3.96 + FREE [premises 2 (1.6)]
    // → 5.56 → common band 1.5-7.5 (Lemma). FREE share 1.6/5.56 = 28.8%
    // ✓ window.
    free: { premises: 2 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 3 },
    ],
    specialMechanics: [{ kind: 'premise', count: 1 }],
    addedIn: '2026-07-18',
    tags: ['peroration', 'exposure', 'dot'],
};

/** Quod Erat Demonstrandum — promoted from swap-peroration (arm o3): the
 *  faster CONCEDE conclusion (declares at 5, concedes at 8) at oratory's rare
 *  heart seat; the run's biggest curve repair (late blind 0.119→0.278, into
 *  the doctrine band). Owner explicitly accepted the concede-centrality
 *  consequence (CONCEDE ≈ 71% of late wins in the A/B). */
const quodEratDemonstrandum: Card = {
    id: 'quod-erat-demonstrandum',
    theme: 'peroration',
    name: 'Quod Erat Demonstrandum',
    philosophicalAspect: 'heart',
    description:
        'Which was to be demonstrated. The proof closes early and closes ' +
        'often — and a case carried far enough past its close does not ' +
        'conclude. It simply ends.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    // pts: PAID [PERORATION at 5: rider [ruptureMarks 2 (2 × ⅔ = 1.33) +
    // draw 1 (2.0) + conviction 1 (1.0)] = 4.33 + CONCEDE capstone (3.0) +
    // PREMISE 1 (0.8)] = 8.13 + threshold heart 3 [premises 2 (1.6)] × 0.5
    // = 0.8 + FREE [premises 2 (1.6) + draw 1 (2.0)] = 3.6 → 12.53 → rare
    // band 7-19 (Aporia). FREE share 3.6/12.53 = 28.7% ✓ window.
    free: { premises: 2, drawCards: 1 },
    specialMechanics: [
        {
            kind: 'peroration', at: 5, concedeAt: 8,
            rider: { ruptureMarks: 2, drawCards: 1, conviction: 1 },
        },
        { kind: 'premise', count: 1 },
    ],
    threshold: { color: 'heart', count: 3, rider: { premises: 2 } },
    addedIn: '2026-07-18',
    tags: ['peroration', 'payoff', 'alt-win'],
};

/** Tempered Edge — promoted from swap-forge (arm f2): the wall that stings.
 *  Gave foundry its first in-theme enemy-facing line at the x4 body common
 *  seat (early 0.60→0.80, ON band; sE 0.00→0.21). */
const temperedEdge: Card = {
    id: 'tempered-edge',
    theme: 'forge',
    name: 'Tempered Edge',
    philosophicalAspect: 'body',
    description:
        'Hardened twice, sharpened once. What tries the edge learns which ' +
        'of you was made more carefully.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: Guard 5 (1.25) + ember i2 d2 (tempo 3.5 ÷ 3 = 1.17) = 2.42 +
    // threshold body 2: Guard 4 (1.0 × 0.5 = 0.5) + FREE pips 1 (1.5) = 4.42
    // → common band 1.5-7.5 (Lemma). FREE 1.5/4.42 = 34% ✓.
    free: { pips: 1 },
    combatEffects: [{ effectId: 'debuff_kindling_ember', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'guard', amount: 5 }],
    threshold: { color: 'body', count: 2, rider: { guard: 4 } },
    addedIn: '2026-07-18',
    tags: ['forge', 'defense', 'dot'],
};

/** Half-Spoken Prophecy — promoted from swap-oracle (arm a3), the one
 *  needs-more-data-grade promotion explicitly ratified by the owner: the only
 *  augury candidate that was BOTH win- and engagement-positive (mid +0.037,
 *  dot 0.217→0.295); known caveat: 344 precondition fizzles at mid (the
 *  RUPTURE needs a live affliction). RECOLORED mind→body for the evicted
 *  self-flagellant seat (aspect field only; no die/threshold line depended on
 *  the old color). Augury's mid ~0.00 breach remains structural regardless. */
const halfSpokenProphecy: Card = {
    id: 'half-spoken-prophecy',
    theme: 'oracle',
    name: 'Half-Spoken Prophecy',
    philosophicalAspect: 'body',
    description:
        'Speak only the half already proven — it lands now, all at once. The ' +
        'unread half stays on the table as a stake, waiting to be made true.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: RUPTURE 1 affliction / consume_affliction, no Soul (5.5) +
    // OMEN(foretell 2 = 2.0 × 0.6 = 1.2 + omenInfo 1.0 − ante 1 × 0.75 =
    // −0.75) = 1.45 → 6.95 + FREE [foretell 1 (1.0) + mark i1 d2 (1.5)] =
    // 2.5 → 9.45 → uncommon band 4.5-13 (Theorem).
    // FREE share 2.5/9.45 = 26.5% ✓.
    free: { foretell: 1, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2, to: 'opponent' } },
    specialMechanics: [
        { kind: 'consume_affliction', souls: 0 },
        { kind: 'omen', maxWindow: 2, anteConviction: 1, rider: { foretell: 2 } },
    ],
    addedIn: '2026-07-18',
    tags: ['oracle', 'payoff', 'omen'],
};

/** Grace Under Fire — promoted from swap-charm (arm g2): in-theme survival
 *  for the grace body uncommon seat (early 0.689→0.811, ON band; the
 *  strongest legal grace result). Replaces the measured-answer borrow. */
const graceUnderFire: Card = {
    id: 'grace-under-fire',
    theme: 'charm',
    name: 'Grace Under Fire',
    philosophicalAspect: 'body',
    description:
        'Let the blow land on composure itself. What they spend in fury, you '
        + 'bank in standing — unmoved, and owed.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts: GUARD 10 (2.5) + rapport i2 d2 (3.0) = 5.5 + drew-blood rider
    // [sway 3 (2.7)] × threshold 0.5 = 1.35 + FREE [guard 2 (0.5) + sway 2
    // (1.8)] = 2.3 → 9.15 → uncommon band 4.5-13 (Theorem). FREE share
    // 2.3/9.15 = 25.1% ✓.
    free: { guard: 2, sway: 2 },
    combatEffects: [{ effectId: 'debuff_rapport', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'guard', amount: 10 }],
    synergy: {
        statePredicate: { kind: 'enemy-drew-blood' },
        rider: { sway: 3 },
    },
    addedIn: '2026-07-18',
    tags: ['charm', 'defense', 'condition'],
};

/** Pebble in the Boot — promoted from swap-bulwark (arm b1): the commons'
 *  live DoT line at bastion's x4 body common seat (mid blind 0.070→0.133 —
 *  the right first seat of bastion's mid repair). */
const pebbleInTheBoot: Card = {
    id: 'pebble-in-the-boot',
    theme: 'bulwark',
    name: 'Pebble in the Boot',
    philosophicalAspect: 'body',
    description:
        'Too small to answer, too present to forget. Every step they take '
        + 'toward you argues your case.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: nettle sting i1 d3 (printed 6 → tempo-weighted 4.63 ÷ 3 = 1.54) +
    // MARK i1 d2 (0.75 × 1 × 2 = 1.5) = 3.04 + FREE [barrier 3 (1.0) + guard
    // 1 (0.25)] = 1.25 → 4.29 → common band 1.5-7.5 (Doxa). FREE share
    // 1.25/4.29 = 29.1% ✓ window.
    free: { barrier: 3, guard: 1 },
    combatEffects: [
        { effectId: 'debuff_nettle_sting', appliedTo: 'opponent', intensity: 1, duration: 3 },
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    addedIn: '2026-07-18',
    tags: ['bulwark', 'dot'],
};

/** The Anvil Speaks — promoted from swap-bulwark (arm b3): the long-clock
 *  sting under a working guard at bastion's rare body spell seat (mid +0.030;
 *  the answer to enemies that never swing). Also carries the bastion D8 valve
 *  seat (hold-the-line replaces this copy flag-on). */
const theAnvilSpeaks: Card = {
    id: 'the-anvil-speaks',
    theme: 'bulwark',
    name: 'The Anvil Speaks',
    philosophicalAspect: 'body',
    description:
        'Every hammer believes it is the argument, and every anvil knows '
        + 'better. What rings off you rings in them, hour after hour.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: nettle sting i3 d4 (printed 24 → tempo-weighted 16.41 ÷ 3 = 5.47)
    // + Guard 6 (1.5) = 6.97 + dieBonus body [+1 turn (1.0) + heal 3 (1.0)]
    // × 0.6 = 1.2 + FREE [barrier 8 (2.67) + heal 2 (0.67)] = 3.33 → 11.5 →
    // rare band 7-19 (Axiom). FREE share 3.33/11.5 = 29.0% ✓ window.
    free: { barrier: 8, healHp: 2 },
    combatEffects: [
        { effectId: 'debuff_nettle_sting', appliedTo: 'opponent', intensity: 3, duration: 4 },
    ],
    specialMechanics: [{ kind: 'guard', amount: 6 }],
    dieBonus: { onColor: 'body', rider: { bonusDuration: 1, healHp: 3 } },
    addedIn: '2026-07-18',
    tags: ['bulwark', 'dot', 'sustain'],
};

/** The Burden of Repetition — promoted from swap-echo (arm r1): the mid
 *  detonator, the strongest result of the run (mid blind 0.420→0.583, sE
 *  +0.068 — win AND engagement up at every measured cell; retires the
 *  refrain deck's akrasia borrow). RECOLORED heart→body for the evicted
 *  self-flagellant seat (aspect field only; note the `match` dieBonus now
 *  keys to a BODY die — in the refrain recipe's body slot the conviction
 *  kicker fires at least as often as the measured heart-colored A/B form).
 *  Watch item carried into the promotion report: winnowing's dominant-card
 *  share rose to ~0.90 behind burden in the A/B. */
const theBurdenOfRepetition: Card = {
    id: 'the-burden-of-repetition',
    theme: 'echo',
    name: 'The Burden of Repetition',
    philosophicalAspect: 'body',
    description:
        'Each repetition costs them a little dignity, and dignity is ' +
        'structural. Remove enough of it and the argument stands on nothing.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: [poison i1 d1 (tempo-weighted 3.66 ÷ 3 = 1.22) + closer
    // ruptureMarks 2 (1.33, pre-existing stacks — the plant trails) +
    // trailing plant mark i1 d2 (1.5)] × ECHO 1.8 = 7.30 (scorer-exact: the
    // multiplier covers the whole PAID line; the riders fire once at runtime
    // — priced rich, never cheap) + dieBonus match [conviction 1 (1.0)] ×
    // 0.6 = 0.6 + FREE [MILL 2 (2.0) + mark i1 d2 (1.5)] = 3.5 → 11.40 →
    // uncommon band 4.5-13 (Theorem). FREE share 3.5/11.40 = 30.7%.
    free: { millCards: 2, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 1 },
    ],
    specialMechanics: [
        { kind: 'echo' },
        { kind: 'rider', rider: { ruptureMarks: 2 } },
        { kind: 'rider', rider: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } } },
    ],
    dieBonus: { onColor: 'match', rider: { conviction: 1 } },
    addedIn: '2026-07-18',
    tags: ['echo', 'payoff', 'dot'],
};

export const cardLibrary: Card[] = [
    // T1 Affliction
    slipperySlope, festeringArgument, currysConversion,
    resonanceDetonation, venomAndVein, suppuratingCurse,
    // T2 Peroration
    exordium, openingStatement, mountingCase, peroratioInterrupta,
    theClosingWord, 
    // T3 Forge
    sketchOfAThought, halfStep, bootstrapLoop, exNihilo,
    theOvertake, anvilOfForm, 
    // T4 Akrasia
    againstMyJudgment, sweetPoison, selfFlagellant, fallenGrace,
    pactOfAkrasia, crownOfThorns, mirrorOfGuilt,
    // T5 Control
    zenosHalfStep, redHerring, undistributedMiddle, arrowParadox,
    turnabout, quagmireOfDoubt,
    // T6 Oracle
    glimpse, signsAndPortents, cassandrasBurden, delphicAmbiguity,
    prophecyFulfilled, theOraclesEye, 
    // T7 Harvest
    briefCandle, winnowing, theGleanersDue,
    theReaping, boneOrchard, 
    // T8 Charm
    softWord, disarmingSmile, commonGround, theOliveBranch,
    irresistibleGrace, mirrorOfLonging,
    // T9 Bulwark
    braceForImpact, nettleCloak, tuQuoque, measuredAnswer,
    theAdamantWall, hedgehogsDilemma, crumblingResolve,
    // T10 Echo
    refrain, secondThoughts, circularReasoning,
    ouroboros, resonantChamber, stuckInTheirHead,
    // Spec 33 dice-interaction valves (promoted in Phase D8, 2026-07-18)
    // after the per-preset A/B court; each is seated flag-on only, replacing
    // one same-aspect instance in its theme preset.
    recurringSymptom, restateThePoint, mastersStamp, bleedForIt, breakTheTempo,
    secondSight, bankTheYield, changeOfHeart, holdTheLine, secondTake,
    // 2026-07-19 swap-pool promotions (owner-ratified; see the section above):
    // nine measured promote-candidates seated into their preset recipes.
    poisonedWell, videturQuod, quodEratDemonstrandum, temperedEdge,
    halfSpokenProphecy, graceUnderFire, pebbleInTheBoot, theAnvilSpeaks,
    theBurdenOfRepetition,
];

const registry = new Map<string, Card>(cardLibrary.map(card => [card.id, card]));

// Sandbox integration: experimental cards / overrides (loaded via --sandbox)
// take precedence over the curated library at lookup time.
bindSandboxLibraryGuard(id => registry.get(id));

/** O(1) lookup by card id; sandbox-aware. Chain (WS2.1): sandbox first (so
 *  experiments can shadow anything), then the Thoughtform registry (CONJURE
 *  targets — real cards, deliberately outside the pinned 70), then the
 *  curated library. */
export function getCardById(id: string): Card | undefined {
    return getSandboxCard(id) ?? getThoughtformById(id) ?? registry.get(id);
}
