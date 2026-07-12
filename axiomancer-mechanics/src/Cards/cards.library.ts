/**
 * The Themed Deck Library — spec 32 v3 (2026-07-08).
 *
 * 70 unique cards: 10 self-contained themes × 7 (2 common spells ×4 copies,
 * 2 uncommon spells ×2 copies, 1 rare spell + 1 enchantment + 1 disenchant ×1
 * in the preset recipe — see `combat.deck-presets.ts`). Exactly 30 keywords
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
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'One concession, then the next, then the avalanche you promised was ' +
        'inevitable. The ground tilts, and they slide the whole way down.',
    tier: 2, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts (WS3.5 clock re-price, 2026-07-11): poison i1 d4 on the card-played
    // clock — ramp 2,2,3,3 × 2 expected ticks/round = 20 HP ÷ 3 ≈ 6.67 +
    // FREE tick 0.6 = 7.27 → top of the Doxa band (starter)
    free: { tickOne: true },
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1 }],
    addedIn: '2026-07-08',
    tags: ['affliction', 'dot', 'starter'],
};

const strawMansJab: Card = {
    id: 'straw-mans-jab',
    theme: 'affliction',
    name: "Straw Man's Jab",
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'You hit the version of them that is easiest to hit. It bleeds all ' +
        'the same — wounds do not check citations.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: bleed i2 d2 lifetime ~10/3 ≈ 3.3 + tick 0.6 + dieBonus(+1 int ~1.5 ×0.6 = 0.9) ≈ 4.8 → Lemma
    free: { tickOne: true },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    dieBonus: { onColor: 'body', rider: { bonusIntensity: 1 } },
    addedIn: '2026-07-08',
    tags: ['affliction', 'dot'],
};

const festeringArgument: Card = {
    id: 'festering-argument',
    theme: 'affliction',
    name: 'Festering Argument',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'Left unanswered, a wound of reasoning does not close. You decline ' +
        'to answer it. Everything they carry runs a little longer.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: +1 duration to ALL DoTs ≈ 1/dot × expected 2-3 live dots ≈ 5.5 + tick 0.6 ≈ 6.1 → Thesis
    free: { tickOne: true },
    specialMechanics: [{ kind: 'extend_dots', turns: 1 }],
    addedIn: '2026-07-08',
    tags: ['affliction', 'glue'],
};

const currysConversion: Card = {
    id: 'currys-conversion',
    theme: 'affliction',
    name: "Curry's Conversion",
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'If this wound harms you, then it spreads. The conditional is ' +
        'vacuously true. The wound becomes the argument.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: convert bleed↔poison +1 int ≈ 1.5/instance × ~2 + tempo value ≈ 6.5 + draw 2 ≈ 8.5 → Theorem
    free: { drawCards: 1 },
    specialMechanics: [{ kind: 'convert_dots', bonusIntensity: 1 }],
    addedIn: '2026-07-08',
    tags: ['affliction', 'glue'],
};

const resonanceDetonation: Card = {
    id: 'resonance-detonation',
    theme: 'affliction',
    name: 'Resonance Detonation',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Every argument you have seeded rings at once, one frequency, one ' +
        'conclusion. The structure was never going to hold — you drink back a ' +
        'measure of the collapse as it falls, and the ruin remembers its own ' +
        'shape well enough to happen again.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
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
    free: { tickOne: true },
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
    persistentEffect: 'Every BLEED or POISON you apply lands at +1 intensity.',
    name: 'Venom and Vein',
    category: 'fallacy',
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
    persistentEffect: 'Doubles the total POISON and BLEED damage the enemy takes each round.',
    name: 'Suppurating Curse',
    category: 'fallacy',
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
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'Every case begins somewhere quiet. You clear your throat, and the ' +
        'room — without knowing why — leans in. Somewhere in that first ' +
        'breath, the wound is already open.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts (WS10.1 KW-1 fold, 2026-07-11 — argument-wound folded into POISON):
    // poison i1 d2 card-played clock (lifetime 2×(2+2)=8 → 2.67) + 1 Premise
    // (0.8) + draw rider (2) + FREE premise (0.8) = 6.27 → Doxa
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
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'You name what you intend to prove while pointing at the place it ' +
        'will break them. A promise is also a threat — and threats, once ' +
        'named, start to bleed.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts (WS10.1 KW-1 fold, 2026-07-11 — argument-wound folded into POISON,
    // duration tuned 3 → 2 for the card-played clock): mark d2 (1.5) + poison
    // i1 d2 (8 → 2.67) + 2 Premises (1.6) + FREE premise (0.8) = 6.57 → Lemma
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
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'Premise stacked on premise, each one small, none deniable. The ' +
        'weight is the argument — and the weight is starting to cut.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts (WS10.1 KW-1 fold, 2026-07-11 — argument-wound folded into POISON,
    // intensity tuned 2 → 1 for the card-played clock): mark d3 (2.25) +
    // poison i1 d4 (2×(2+2+3+3)=20 → 6.67) + 2 Premises (1.6) + FREE premise
    // (0.8) + threshold(+1 premise x 0.5 = 0.4) = 11.72 -> Thesis
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
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'You cash the argument early — ugly, effective. Every mark and ' +
        'wound already on them detonates at once; the conclusion you ' +
        'spend today cannot be refuted tomorrow.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: RUPTURE (verb 4 + expected fuel) -> ~12 Theorem. FREE tickOne is the
    // dieless top action (every spell authors a FREE rider; the v3 curated-library
    // contract enforces it — the rework dropped this line by accident). tickOne
    // (0.6) keeps the card in the uncommon band; a draw rider tips it over.
    free: { tickOne: true },
    specialMechanics: [{ kind: 'rupture' }],
    addedIn: '2026-07-08',
    tags: ['peroration', 'payoff'],
};

const theClosingWord: Card = {
    id: 'the-closing-word',
    theme: 'peroration',
    name: 'The Closing Word',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'The conclusion, declared before it is finished being true. At six ' +
        'premises it lands — and carried past eight in a single breath, they ' +
        'simply concede.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: PERORATION at 6 → consume marks 3/stack + draw 2 + 2 Conviction ≈ 13 (CONCEDE at 8 — alt-win, §9) → Axiom
    free: { premises: 1 },
    specialMechanics: [{
        kind: 'peroration', at: 6, concedeAt: 8,
        rider: { ruptureMarks: 3, drawCards: 2, conviction: 2 },
    }],
    addedIn: '2026-07-08',
    tags: ['peroration', 'payoff', 'alt-win'],
};

const practicedCadence: Card = {
    id: 'practiced-cadence',
    theme: 'peroration',
    persistentEffect: '+1 PREMISE on the first card you play each turn.',
    name: 'Practiced Cadence',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'The rhythm carries the argument when the content flags. From here ' +
        'on, every opening remark counts toward the close.',
    tier: 2, rank: 5, cardType: 'enchantment',
    targetType: 'self',
    // pts: persistent +1 Premise on the first card each turn ≈ 0.8 × ~10 turns, min-4 law ≈ 12 → Axiom
    addedIn: '2026-07-08',
    tags: ['peroration', 'enchantment'],
};

const captiveAudience: Card = {
    id: 'captive-audience',
    theme: 'peroration',
    persistentEffect: 'While you hold 4+ PREMISEs, the enemy stays MARKed.',
    name: 'Captive Audience',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'While the case is building they cannot look away — and what cannot ' +
        'look away stands exposed.',
    tier: 2, rank: 6, cardType: 'disenchant',
    targetType: 'enemy',
    // pts: engine text — while you hold 4+ Premises the enemy stays marked (Aporia)
    addedIn: '2026-07-08',
    tags: ['peroration', 'disenchant'],
};

// ─── T3 — FORGE (dice from nothing: kindle, ripen, float, overtake) ──────────

const sketchOfAThought: Card = {
    id: 'sketch-of-a-thought',
    theme: 'forge',
    name: 'Sketch of a Thought',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Not yet an idea — the shape where an idea will be. You rough it in, ' +
        'and a spark leaps off the sketch and catches on them before they notice.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: KINDLE mind (2.5) + FREE draw 1 (2) + ember i1 d3 lifetime 3/3=1 +
    // dieBonus(bonusIntensity 1 × 1.5 × 0.6 = 0.9) = 6.4 -- verified against
    // scoreCard(), fits the 1.5-7.5 Doxa/Lemma band for rank 1.
    free: { drawCards: 1 },
    combatEffects: [{ effectId: 'debuff_kindling_ember', appliedTo: 'opponent', intensity: 1, duration: 3 }],
    dieBonus: { onColor: 'mind', rider: { bonusIntensity: 1 } },
    specialMechanics: [{ kind: 'create_temporary_die', color: 'mind' }],
    addedIn: '2026-07-08',
    tags: ['forge', 'dice', 'dot'],
};

const halfStep: Card = {
    id: 'half-step',
    theme: 'forge',
    name: 'Half-Step',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Zeno was half right: you can always take half a step back. What ' +
        'waits behind the guard ripens twice as fast when you learn to be patient about it.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: Guard 5 (1.25) + 2 pips (3.0) + FREE guard 2 (0.5) = 4.75 -- verified
    // against scoreCard(), fits the 1.5-7.5 Doxa/Lemma band for rank 2.
    free: { guard: 2 },
    specialMechanics: [{ kind: 'guard', amount: 5 }, { kind: 'grant_pip', count: 2 }],
    addedIn: '2026-07-08',
    tags: ['forge', 'defense'],
};

const bootstrapLoop: Card = {
    id: 'bootstrap-loop',
    theme: 'forge',
    name: 'Bootstrap Loop',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'The proof assumes itself and, scandalously, works. Even a dead ' +
        'premise funds its own cause.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: TRANSMUTE dead X → WILD floating ((5+3+1)×0.7 + 1×0.3 = 6.6) + FREE
    // conviction (1×0.35) + threshold(pip 1.5 ×0.5 = 0.75) ≈ 7.7 — fits the
    // 4.5-13 uncommon band for rank 3. (Dice-law rework 2026-07-09: KINDLE wild
    // swapped for float_x_die — the card-effect path that softens dead X faces.)
    free: { conviction: 1 },
    specialMechanics: [{ kind: 'float_x_die' }],
    threshold: { color: 'mind', count: 2, rider: { pips: 1 } },
    addedIn: '2026-07-08',
    tags: ['forge', 'dice', 'floating'],
};

const exNihilo: Card = {
    id: 'ex-nihilo',
    theme: 'forge',
    name: 'Ex Nihilo',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Something from nothing — and this time it comes out already flexible, ' +
        'the shape of whatever you need it to be. Even the hand that struck it ' +
        'goes back in the tray, unspent.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts: FORGE floating WILD (5) + BANK own powering die + threshold(mind×3,
    // rider pips:1 -> 1.5×0.5 = 0.75) + FREE conviction (1) -- fits the 4.5-13
    // Thesis/Theorem band for rank 4. (FREE line was dropped by the rework; the
    // v3 curated-library contract requires every spell to author one — restored;
    // a draw rider tips it over the band, so it authors conviction instead.)
    free: { conviction: 1 },
    specialMechanics: [
        { kind: 'forge_floating_die', color: 'wild' },
        { kind: 'bank_spent_die' },
    ],
    threshold: { color: 'mind', count: 3, rider: { pips: 1 } },
    addedIn: '2026-07-08',
    tags: ['forge', 'dice', 'floating'],
};

const theOvertake: Card = {
    id: 'the-overtake',
    theme: 'forge',
    name: 'The Overtake',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Achilles does pass the tortoise — all at once, every saved step ' +
        'spent in a single stride, and every wound already worked into them ' +
        'torn loose in the same motion. Sudden, and total. And the leg that ' +
        'carried him is already reset, ready to take the next one.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: spend ALL pips (+1 Guard per) + RUPTURE (3.5 fuel/pip, +50% burst) —
    // the RUPTURE deliberately ALSO consumes every enemy affliction (its whole
    // DoT board tears loose into the burst), so the finisher must land big to
    // be worth cashing your own DoTs; fuelPerPip 3.5 + bonusPct 0.5 push a
    // fully-charged forge turn to the ruptureBurstCap() fraction cap. + REFRESH own powering
    // die + FREE guard 2 -- top of the rank-5 Axiom band.
    //
    // CAVEAT (verified in combat.engine.ts): a FLOATING die is spent-and-gone-
    // forever by design -- refresh_die only returns the powering die to the
    // pool when Overtake is powered by a RESERVE die.
    free: { guard: 2 },
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
    category: 'paradox',
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

const entropyTax: Card = {
    id: 'entropy-tax',
    theme: 'forge',
    persistentEffect: 'Every KINDLEd or FORGEd die you spend MARKs the enemy.',
    name: 'Entropy Tax',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Nothing is created free. Every manufactured die you spend, the ' +
        'universe bills to them.',
    tier: 2, rank: 6, cardType: 'disenchant',
    targetType: 'enemy',
    // pts: engine text — every kindled/floating spend marks the enemy (Aporia)
    addedIn: '2026-07-08',
    tags: ['forge', 'disenchant'],
};

// ─── T4 — AKRASIA (acting against your own judgment; the debt pays) ──────────

const againstMyJudgment: Card = {
    id: 'against-my-judgment',
    theme: 'akrasia',
    name: 'Against My Judgment',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'You know better. You do it anyway — and the knowing-better arrives ' +
        'two cards too late to stop you.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: draw 2 (4) − self-mark d2 credit (−0.75×1.5 ≈ −1.1) + FREE conviction 0.35 ≈ 3.3 → Doxa
    free: { conviction: 1 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'self', duration: 2 }],
    specialMechanics: [{ kind: 'rider', rider: { drawCards: 2 } }],
    addedIn: '2026-07-08',
    tags: ['akrasia'],
};

const sweetPoison: Card = {
    id: 'sweet-poison',
    theme: 'akrasia',
    name: 'Sweet Poison',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'You taste it first, to prove the vintage. The enemy drinks deeper — ' +
        'but you did drink.',
    tier: 2, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts (WS3.5 clock re-price, 2026-07-11 — intensity tuned 2 → 1: i1 on
    // the card-played clock prints the SAME 20 HP lifetime the old i2 round
    // clock did): poison i1 d4 (20 → 6.67) − self-bleed i1 d2 credit
    // (−0.75×1 = −0.75) + FREE tick 0.6 = 6.52 → Lemma (deliberately rich —
    // the akratic bargain)
    free: { tickOne: true },
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
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'The lash falls on your own back, and every wound you have argued ' +
        'into them — poison, bleed, the guilt mirrored back a dozen times ' +
        'over — comes due at once.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: RUPTURE (4 + fuel 8, bonusPct 0.10 ≈ +0.004) − recoil 5 credit
    // (−1.25) + tick 0.6 ≈ 11.35 → fits Thesis/Theorem band. DRASTIC REWORK:
    // was a flat, always-the-same +1-intensity sustained amplifier (~7pts);
    // is now a repeatable detonator. RUPTURE consumes every affliction on the
    // enemy and converts their full remaining lifetime into ONE burst now,
    // capped at 80.
    free: { tickOne: true },
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
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Grace was never for the upright. It finds you face-down, and it ' +
        'pays better there.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: bleed i2 d3 (~5) + draw 0.7 + FALLEN(heal 4 ≈ 1.3 ×0.5 = 0.7) + tempo ≈ 9 → Theorem
    free: { drawCards: 1 },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 3 }],
    fallen: { rider: { healHp: 4 } },
    addedIn: '2026-07-08',
    tags: ['akrasia', 'dot'],
};

const pactOfAkrasia: Card = {
    id: 'pact-of-akrasia',
    theme: 'akrasia',
    name: 'Pact of Akrasia',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'The cheapest forge in the world. The bill is written in your own ' +
        'blood, and you sign it smiling.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'self',
    // pts: FORGE wild floating (6) + persistence − recoil 6 (−1.5) − self-bleed credit (−1.3) + wild premium ≈ 12.6 → Axiom
    free: { guard: 2 },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'self', intensity: 1, duration: 2 }],
    specialMechanics: [{ kind: 'forge_floating_die', color: 'wild' }, { kind: 'recoil', hp: 6 }],
    addedIn: '2026-07-08',
    tags: ['akrasia', 'floating'],
};

const crownOfThorns: Card = {
    id: 'crown-of-thorns',
    theme: 'akrasia',
    persistentEffect: 'While FALLEN, your status applications land at +1 intensity.',
    name: 'Crown of Thorns',
    category: 'paradox',
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
    persistentEffect: 'Every self-debuff you take toward FALLEN also lands one stack on the enemy.',
    name: 'Mirror of Guilt',
    category: 'paradox',
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
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'To reach you, the blow must first cross half the distance. You keep ' +
        'the halves coming.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: STAGGER 1 (~half a phase-deny, 2) + FREE guard 2 (0.5) + tempo ≈ 3.5 → Doxa
    free: { guard: 2 },
    specialMechanics: [{ kind: 'stagger', rungs: 1 }],
    addedIn: '2026-07-08',
    tags: ['control'],
};

const redHerring: Card = {
    id: 'red-herring',
    theme: 'control',
    name: 'Red Herring',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'Something glints in the corner of the argument. They lunge for it — ' +
        'and every lunge you deny becomes the wound.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: backfire i2 d2 (3) + FREE draw (0.7) + dieBonus(+1 dur ×0.6 = 0.6) ≈ 4.3 → Lemma
    free: { drawCards: 1 },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    dieBonus: { onColor: 'mind', rider: { bonusDuration: 1 } },
    addedIn: '2026-07-08',
    tags: ['control'],
};

const undistributedMiddle: Card = {
    id: 'undistributed-middle',
    theme: 'control',
    name: 'Undistributed Middle',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'The middle term never quite connects, and neither does their swing. ' +
        'Somewhere between premise and blow, the force goes missing.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts (retuned 2026-07-08, mid/late engagement pass): STAGGER 1 (2) + backfire
    // i2 d3 (0.75x2x3=4.5, up from i1/d2=1.5) + FREE guard 2 (0.5) + threshold(mind
    // x3 -> stagger+1 AND bonusIntensity+1, rider=2+1.5=3.5 x0.5 discount = 1.75)
    // total ~= 8.75, in-band for uncommon [4.5,13]. (FREE line was debuff_mark,
    // which is INERT in a mono-control deck — Mark amplifies DoT ticks, but this
    // deck deals BACKFIRE, not DoT; swapped to a useful in-theme guard.)
    free: { guard: 2 },
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
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'At every instant the arrow is at rest. You choose the instant, and ' +
        'pin their next blow to a single shape -- the stillness itself ' +
        'a wound.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts (reworked 2026-07-08): lock_stance (2.5) + STAGGER 1 (2) + backfire
    // i1 d2 on the shared 'debuff_backfire' stack (1.5, NEW) + FREE guard 2 (0.5)
    // = 6.5, in-band for Theorem [4.5,13].
    free: { guard: 2 },
    specialMechanics: [{ kind: 'lock_stance' }, { kind: 'stagger', rungs: 1 }],
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    addedIn: '2026-07-08',
    tags: ['control'],
};

const paralysisOfAnalysis: Card = {
    id: 'paralysis-of-analysis',
    theme: 'control',
    name: 'Paralysis of Analysis',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'You hand them every option at once. They stand in the doorway of ' +
        'the decision -- and every turn they cannot move, the paralysis ' +
        'turns inward and more of them spills out.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts (WS10.1 KW-1 fold, 2026-07-11 — backfire_acute folded into BACKFIRE
    // at i3; the acute's separate 3-per-rung track retires with the clone id):
    // STAGGER 2 (4, full deny alone) + backfire i3 d3 (6.75) + FREE draw (2)
    // + dieBonus(mind: bonusIntensity 2 + bonusDuration 1, rider=4 x0.6 = 2.4)
    // total = 15.15, in-band for rare [7,19].
    free: { drawCards: 1 },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 3, duration: 3 }],
    specialMechanics: [{ kind: 'stagger', rungs: 2 }],
    dieBonus: { onColor: 'mind', rider: { bonusIntensity: 2, bonusDuration: 1 } },
    addedIn: '2026-07-08',
    tags: ['control', 'payoff'],
};

const achillesAndTheTortoise: Card = {
    id: 'achilles-and-the-tortoise',
    theme: 'control',
    persistentEffect: 'DRAW 1 card each time your STAGGER denies an enemy turn.',
    name: 'Achilles and the Tortoise',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'While they chase the conclusion they can never reach, you read. ' +
        'Every denied turn is a page.',
    tier: 2, rank: 5, cardType: 'enchantment',
    targetType: 'self',
    // pts: persistent draw 1 per denied enemy turn ≈ 2 × ~5 denies gated, min-4 ≈ 12 → Axiom
    addedIn: '2026-07-08',
    tags: ['control', 'enchantment'],
};

const quagmireOfDoubt: Card = {
    id: 'quagmire-of-doubt',
    theme: 'control',
    persistentEffect: 'Enemy telegraphs enter play one STAGGER rung lower.',
    name: 'Quagmire of Doubt',
    category: 'fallacy',
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
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'A crack in the next moment, wide enough for one eye. You look, and ' +
        'mark what looks back — the wound starts arriving a beat before the ' +
        'blow that causes it.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts (WS10.1 KW-1, 2026-07-11 — foretold-wound replaced by its parts:
    // POISON + MARK double-apply): poison i1 d1 (4 → 1.33) + mark i1 d2 (1.5)
    // + FORETELL 2 (2) + FREE foretell (1) = 5.83 → Doxa
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
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'You cast the die as augury and dare tomorrow to disagree. When it ' +
        'does not, the future owes you.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: OMEN(draw 2 = 4 ×0.6 omen-odds = 2.4) + FREE foretell (0.35) + info value ≈ 4.4 → Lemma
    free: { foretell: 1 },
    specialMechanics: [{ kind: 'omen', rider: { drawCards: 2 } }],
    addedIn: '2026-07-08',
    tags: ['oracle'],
};

const cassandrasBurden: Card = {
    id: 'cassandras-burden',
    theme: 'oracle',
    name: "Cassandra's Burden",
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'You saw it coming. No one believed you — so you braced alone, and ' +
        'named the exact place it would land. It is already starting to hurt.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts (WS10.1 KW-1, 2026-07-11 — foretold-wound replaced by its parts:
    // POISON + MARK double-apply, intensity tuned 2 → 1 for the card-played
    // clock): poison i1 d2 (8 → 2.67) + mark i1 d2 (1.5) + OMEN(Guard 4 ×0.6
    // + info 1 = 1.6) + FREE draw (2) = 7.77 → Thesis. The WOUND lands on
    // cast ("already starting to hurt"); the BRACE (guard 4) is the prophecy
    // payoff, realized only when the prediction proves true.
    free: { drawCards: 1 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 },
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    specialMechanics: [{
        kind: 'omen',
        rider: { guard: 4 },
    }],
    addedIn: '2026-07-08',
    tags: ['oracle', 'exposure'],
};

const delphicAmbiguity: Card = {
    id: 'delphic-ambiguity',
    theme: 'oracle',
    name: 'Delphic Ambiguity',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'The oracle never lies, only arrives early. You read the sentence ' +
        'before it is finished — the first half of the prophecy has already ' +
        'landed on them.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: consume_affliction (Foretold Wound fuel, ~4-5) + 1 Soul (0.75) +
    // foretell 1 (1.5) + dieBonus mind pips (0.9) + FREE tickOne (0.6) ≈ 8.75 →
    // Theorem
    free: { tickOne: true },
    specialMechanics: [
        { kind: 'consume_affliction', souls: 1 },
        { kind: 'foretell', count: 1 },
    ],
    dieBonus: { onColor: 'mind', rider: { pips: 1 } },
    addedIn: '2026-07-08',
    tags: ['oracle', 'payoff'],
};

const prophecyFulfilled: Card = {
    id: 'prophecy-fulfilled',
    theme: 'oracle',
    name: 'Prophecy Fulfilled',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Every omen that came true is a nail already driven. This is just ' +
        'the hammer falling on all of them at once.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: RUPTURE (4 + fuel) + 3 fuel per omen hit ≈ 13 with a played oracle engine → Axiom
    free: { foretell: 1 },
    specialMechanics: [{ kind: 'rupture', fuelPerOmenHit: 3 }],
    addedIn: '2026-07-08',
    tags: ['oracle', 'payoff'],
};

const theOraclesEye: Card = {
    id: 'the-oracles-eye',
    theme: 'oracle',
    persistentEffect: 'The next enemy stance is always revealed (FORETELL), and your OMENs hit harder.',
    name: "The Oracle's Eye",
    category: 'paradox',
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

const fatedCourse: Card = {
    id: 'fated-course',
    theme: 'oracle',
    persistentEffect: 'Every OMEN that hits MARKs the foe.',
    name: 'Fated Course',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'A curse of inevitability: the future you named is the only one left ' +
        'to them, and walking into it leaves a mark.',
    tier: 2, rank: 6, cardType: 'disenchant',
    targetType: 'enemy',
    // pts: engine text — every hit omen marks the foe, rest of combat (Aporia)
    addedIn: '2026-07-08',
    tags: ['oracle', 'disenchant'],
};

// ─── T7 — HARVEST (short afflictions churn into Souls; Souls into the scythe) ─

const briefCandle: Card = {
    id: 'brief-candle',
    theme: 'harvest',
    name: 'Brief Candle',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Out, out. It burns bright, it burns fast, and what it leaves ' +
        'behind is yours to gather — some of it before it even finishes burning.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts (WS3.5 clock re-price, 2026-07-11): bleed i2 d1 on the
    // damage-instance clock — 2 expected ticks land BOTH stacks in the round
    // (6+3 = 9 HP → 3) + FREE souls 1 (0.75) = 3.75 → Doxa, in-budget; the
    // fast washout is the Soul engine's fuel.
    free: { souls: 1 },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 1 }],
    addedIn: '2026-07-08',
    tags: ['harvest', 'dot'],
};

const mementoMori: Card = {
    id: 'memento-mori',
    theme: 'harvest',
    name: 'Memento Mori',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Remember that they die. You remember it AT them, and the ' +
        'remembering leaves more of a residue than it used to.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: mark i2 d1 (2, unresisted) + its expiry Soul (0.75) + FREE souls 2
    // (1.5) ≈ 4.25 — matches Lemma-tier budget.
    free: { souls: 2 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 1 }],
    addedIn: '2026-07-08',
    tags: ['harvest', 'exposure'],
};

const winnowing: Card = {
    id: 'winnowing',
    theme: 'harvest',
    name: 'Winnowing',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'The scythe does not wait for the season. One standing affliction, ' +
        'cut and threshed and pocketed now — and the thresher keeps more of the grain than it used to.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: consume 1 affliction → fuel ticks NOW (~4-5) + 2 Souls (1.5) + FREE
    // tick 0.6 ≈ 7.5-8.5 → Thesis-tier.
    free: { tickOne: true },
    specialMechanics: [{ kind: 'consume_affliction', souls: 2 }],
    addedIn: '2026-07-08',
    tags: ['harvest', 'payoff'],
};

const theGleanersDue: Card = {
    id: 'the-gleaners-due',
    theme: 'harvest',
    name: "The Gleaner's Due",
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'What the field owes the one who walks behind the reapers: a die ' +
        'from the leavings, something to read by, and a coin pressed back into your palm on the way out.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts: REAP 2 → KINDLE (2.5) + draw 2 (4) − soul cost 2 + rider soul 1 + FREE
    // draw 0.7 + FREE soul 0.75 ≈ 6.45 → Theorem-tier. The PAID reap returns 1
    // Soul ("a coin pressed back into your palm on the way out"), net drain 1.
    free: { drawCards: 1, souls: 1 },
    specialMechanics: [{ kind: 'reap', cost: 2, rider: { drawCards: 2, souls: 1 }, kindle: 'mind' }],
    addedIn: '2026-07-08',
    tags: ['harvest'],
};

const theReaping: Card = {
    id: 'the-reaping',
    theme: 'harvest',
    name: 'The Reaping',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Every soul you gathered, swung at once — and some of what it costs them ' +
        'comes back to you. The harvest was never for keeping. It was for this, and for what comes after.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: REAP ALL — 4 per Soul (burstPerSoul 2→4; caps at 80 dmg off a ~20-Soul
    // bank) + SIPHON 40% of the burst back as healing + FREE tick 0.6 ≈ 17-19.
    free: { tickOne: true },
    specialMechanics: [{ kind: 'reap_all', burstPerSoul: 4 }, { kind: 'siphon', pct: 0.4 }],
    addedIn: '2026-07-08',
    tags: ['harvest', 'payoff'],
};

const boneOrchard: Card = {
    id: 'bone-orchard',
    theme: 'harvest',
    persistentEffect: 'Drain 1 HP from the enemy for every SOUL you gain.',
    name: 'Bone Orchard',
    category: 'fallacy',
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

const theTithe: Card = {
    id: 'the-tithe',
    theme: 'harvest',
    persistentEffect: 'Enemy afflictions expire one turn sooner (faster SOUL churn).',
    name: 'The Tithe',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'A tenth of everything, taken early. Their afflictions ripen a turn ' +
        'sooner, and the collection plate is yours.',
    tier: 2, rank: 6, cardType: 'disenchant',
    targetType: 'enemy',
    // pts: engine text — enemy afflictions expire 1 turn sooner (faster Soul churn) (Aporia)
    addedIn: '2026-07-08',
    tags: ['harvest', 'disenchant'],
};

// ─── T8 — CHARM (SWAY toward CAPITULATION — the deck that never strikes) ─────

const softWord: Card = {
    id: 'soft-word',
    theme: 'charm',
    name: 'Soft Word',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'It turns away wrath — not by winning, but by making wrath feel ' +
        'over-dressed for the occasion.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: SWAY 3 (2.4) + FREE heal 2 (0.65) + dieBonus(SWAY 1 ×0.6 = 0.5) ≈ 3.6 → Doxa
    free: { healHp: 2 },
    specialMechanics: [{ kind: 'sway', amount: 3 }],
    dieBonus: { onColor: 'heart', rider: { sway: 1 } },
    addedIn: '2026-07-08',
    tags: ['charm', 'alt-win'],
};

const disarmingSmile: Card = {
    id: 'disarming-smile',
    theme: 'charm',
    name: 'Disarming Smile',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'Hard to swing at someone who seems glad to see you. Their blows ' +
        'arrive apologizing.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
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
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'You find the one thing you both believe and stand on it together. ' +
        'It is very hard to duel on shared ground.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: SWAY 2 (1.6) + rapport i1 d2 (1.5) + FREE draw (0.7) + threshold(SWAY 2 ×0.5 = 0.8) + tempo ≈ 7 → Thesis
    free: { drawCards: 1 },
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
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Extended with a steady hand, from inside their reach. Mercy offered ' +
        'from a guard position carries further.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: SWAY 3 (2.4) + cleanse (1.5) + heal 3 (1) + FREE guard (0.5) + tempo ≈ 9 → Theorem
    free: { guard: 2 },
    specialMechanics: [
        { kind: 'sway', amount: 3 },
        { kind: 'rider', rider: { cleanse: 1, healHp: 3 } },
    ],
    addedIn: '2026-07-08',
    tags: ['charm', 'defense'],
};

const heartOfTheMatter: Card = {
    id: 'heart-of-the-matter',
    theme: 'charm',
    name: 'Heart of the Matter',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'You say the thing they have been not-saying their whole life. Said ' +
        'once, it is heard; said again, in the same breath, it is believed. ' +
        'The fight goes out of a person who feels seen, seen twice over.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: SWAY 6 x ECHO (engine echoFactor) + heal-4 rider (NOT echoed) + FREE
    // sway 1 + threshold(SWAY +4) -- this IS the Late-stage finisher burst
    // (rebalance 2026-07-08, Late SWAY ceiling pass). Self-ECHO only doubles the
    // specialMechanics 'sway' entry; free/threshold sway riders add flat.
    free: { sway: 1 },
    specialMechanics: [
        { kind: 'sway', amount: 6 },
        { kind: 'echo' },
        { kind: 'rider', rider: { healHp: 4 } },
    ],
    threshold: { color: 'heart', count: 5, rider: { sway: 4 } },
    addedIn: '2026-07-08',
    tags: ['charm', 'alt-win'],
};

const irresistibleGrace: Card = {
    id: 'irresistible-grace',
    theme: 'charm',
    persistentEffect: 'Your SWAY stops decaying, and each new gesture of it lands harder.',
    name: 'Irresistible Grace',
    category: 'paradox',
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
    persistentEffect: 'Damage your defenses prevent is converted into SWAY.',
    name: 'Mirror of Longing',
    category: 'paradox',
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
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'You set your stance and meet the blow on your own terms — what is ' +
        'braced for cannot break you.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: Guard 8 (2) + FREE guard 2 (0.5) + pip line (+2/pip, situational ≈ 0.8) ≈ 3.3 → Doxa (starter)
    free: { guard: 2 },
    specialMechanics: [{ kind: 'guard', amount: 8 }],
    addedIn: '2026-07-08',
    tags: ['bulwark', 'defense', 'starter'],
};

const nettleCloak: Card = {
    id: 'nettle-cloak',
    theme: 'bulwark',
    name: 'Nettle Cloak',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Wear the argument that stings on contact — and stings just as well ' +
        'standing still. Let them figure out the lesson with their knuckles, ' +
        'or simply, eventually, with their skin.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: thorns i2 d2 (~3, reactive, unchanged) + NEW non-reactive Nettle
    // Sting i1 d2 applied directly to the enemy on cast (~1.5, fires even if
    // they never swing) + FREE guard 2 (0.5) + reflect synergy ≈ 5.8 → Lemma
    free: { guard: 2 },
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
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        '"You also." The oldest counter in the book — whatever they do to ' +
        'you becomes, instantly, about them.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: thorns i3 d2 (~4.5) + FREE guard 2 (0.5) + dieBonus(guard 2 ×0.6 = 0.3) + tempo ≈ 6.5 → Thesis
    free: { guard: 2 },
    combatEffects: [{ effectId: 'buff_thorns', appliedTo: 'self', intensity: 3, duration: 2 }],
    // phase 28: recolored 'body' -> 'heart' — the card is philosophicalAspect
    // 'heart', so the old onColor:'body' bonus was dead text on a heart card.
    dieBonus: { onColor: 'heart', rider: { guard: 2 } },
    addedIn: '2026-07-08',
    tags: ['bulwark', 'reflect'],
};

const measuredAnswer: Card = {
    id: 'measured-answer',
    theme: 'bulwark',
    name: 'Measured Answer',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'You do not interrupt. You let the whole blow arrive, catch it ' +
        'entire, and reply in kind — once, precisely.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts: Guard 6 (1.5) + RIPOSTE 3/parry 2 (~4) + FREE guard 3 (0.75) + full-block gate + tempo ≈ 9 → Theorem
    free: { guard: 3 },
    specialMechanics: [{ kind: 'guard', amount: 6 }, { kind: 'riposte', damage: 3, reduce: 2 }],
    addedIn: '2026-07-08',
    tags: ['bulwark', 'reflect'],
};

const theAdamantWall: Card = {
    id: 'the-adamant-wall',
    theme: 'bulwark',
    name: 'The Adamant Wall',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Not a defense — a verdict about where the fight ends. What breaks ' +
        'against it answers for the attempt.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'self',
    // pts: BARRIER 10 (3.3) + RIPOSTE 4/parry 2 (~5) + FREE guard 3 (0.75) + persistence ≈ 13 → Axiom
    free: { guard: 3 },
    specialMechanics: [{ kind: 'barrier', amount: 10 }, { kind: 'riposte', damage: 4, reduce: 2 }],
    addedIn: '2026-07-08',
    tags: ['bulwark', 'reflect', 'payoff'],
};

const hedgehogsDilemma: Card = {
    id: 'hedgehogs-dilemma',
    theme: 'bulwark',
    persistentEffect: 'Every THORNS reflection also marks the enemy.',
    name: "Hedgehog's Dilemma",
    category: 'paradox',
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
    persistentEffect: 'A fully-blocked (GUARD) attack STAGGERs the enemy a rung on its next telegraph.',
    name: 'Crumbling Resolve',
    category: 'fallacy',
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
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Said once, it is a remark. Said twice, in the same breath, it ' +
        'starts to sound like the truth — and the truth leaves a mark.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts (WS10.1 KW-1 fold, 2026-07-11 — echo_sting folded into POISON,
    // duration tuned 2 → 1: the ECHO already re-applies it, and the
    // card-played clock makes each application tick twice a round):
    // [mark d2 (1.5) + poison i1 d1 (2×2=4 → 1.33)] × ECHO(1.8) = 5.1 +
    // FREE draw (2) = 7.1 → top of the Doxa band (deliberately above stock T1
    // budget -- Early's legal pool is ONLY this + second-thoughts).
    free: { drawCards: 1 },
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
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'The discarded idea was not wrong — it was early. You reach back ' +
        'into the pile, take it again, and cash in what it already cost them.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: REPRISE 1 (2) + FREE draw (0.7) + PAID ruptureMarks:1 (~1.5) +
    // selection value ≈ 5.2 → Lemma. ruptureMarks rides the PAID face (a `rider`
    // specialMechanic) so it detonates WITH the reprise — "cash in what it
    // already cost them" — instead of only on the dieless top play.
    free: { drawCards: 1 },
    specialMechanics: [
        { kind: 'reprise', count: 1 },
        { kind: 'rider', rider: { ruptureMarks: 1 } },
    ],
    addedIn: '2026-07-08',
    tags: ['echo', 'recursion'],
};

const adNauseam: Card = {
    id: 'ad-nauseam',
    theme: 'echo',
    name: 'Ad Nauseam',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'Repetition is not proof — but somewhere around the tenth hearing, ' +
        'the difference stops mattering. Whatever you say next, says itself twice.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: next spell gains ECHO (≈ ×0.8 of an avg spell ≈ 5) + FREE mark (0.5) + dieBonus(draw ×0.6 = 1.2) ≈ 6.7 → Thesis
    free: { applyEffect: { effectId: 'debuff_mark', duration: 1 } },
    specialMechanics: [{ kind: 'echo_next_spell' }],
    dieBonus: { onColor: 'mind', rider: { drawCards: 1 } },
    addedIn: '2026-07-08',
    tags: ['echo', 'recursion'],
};

const circularReasoning: Card = {
    id: 'circular-reasoning',
    theme: 'echo',
    name: 'Circular Reasoning',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'The conclusion proves the premise proves the conclusion. Nothing ' +
        'ever leaves the loop — including your best card.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts: REPRISE 1 + its FREE line fires now (2 + ~1.5) + FREE draw (0.7) + selection ≈ 9 → Theorem
    free: { drawCards: 1 },
    specialMechanics: [{ kind: 'reprise', count: 1, fireFree: true }],
    addedIn: '2026-07-08',
    tags: ['echo', 'recursion'],
};

const ouroboros: Card = {
    id: 'ouroboros',
    theme: 'echo',
    name: 'Ouroboros',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'The argument eats its own tail and grows fat on it. Whatever you ' +
        'said last, the serpent says again — and everything it has already said, it says for damage, all at once.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: replay last spell PAID x2 (~10) + FREE draw (0.7) + PAID
    // ruptureMarks:3 (consumes ALL current Mark stacks, 3 dmg/stack) ≈ 22-33 →
    // Axiom+ (deliberately pushed above the old budget: this is now the deck's
    // actual finisher). ruptureMarks rides the PAID face (a `rider` mechanic) so
    // the detonation fires WITH the replay — "everything it says for damage, all
    // at once" — instead of only on the dieless top play (where it did nothing).
    free: { drawCards: 1 },
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
    persistentEffect: 'The first spell you cast each turn gains ECHO (fires twice).',
    name: 'Resonant Chamber',
    category: 'paradox',
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
    persistentEffect: 'Every ECHO or REPRISE drips 2 damage to the enemy.',
    name: 'Stuck in Their Head',
    category: 'fallacy',
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

export const cardLibrary: Card[] = [
    // T1 Affliction
    slipperySlope, strawMansJab, festeringArgument, currysConversion,
    resonanceDetonation, venomAndVein, suppuratingCurse,
    // T2 Peroration
    exordium, openingStatement, mountingCase, peroratioInterrupta,
    theClosingWord, practicedCadence, captiveAudience,
    // T3 Forge
    sketchOfAThought, halfStep, bootstrapLoop, exNihilo,
    theOvertake, anvilOfForm, entropyTax,
    // T4 Akrasia
    againstMyJudgment, sweetPoison, selfFlagellant, fallenGrace,
    pactOfAkrasia, crownOfThorns, mirrorOfGuilt,
    // T5 Control
    zenosHalfStep, redHerring, undistributedMiddle, arrowParadox,
    paralysisOfAnalysis, achillesAndTheTortoise, quagmireOfDoubt,
    // T6 Oracle
    glimpse, signsAndPortents, cassandrasBurden, delphicAmbiguity,
    prophecyFulfilled, theOraclesEye, fatedCourse,
    // T7 Harvest
    briefCandle, mementoMori, winnowing, theGleanersDue,
    theReaping, boneOrchard, theTithe,
    // T8 Charm
    softWord, disarmingSmile, commonGround, theOliveBranch,
    heartOfTheMatter, irresistibleGrace, mirrorOfLonging,
    // T9 Bulwark
    braceForImpact, nettleCloak, tuQuoque, measuredAnswer,
    theAdamantWall, hedgehogsDilemma, crumblingResolve,
    // T10 Echo
    refrain, secondThoughts, adNauseam, circularReasoning,
    ouroboros, resonantChamber, stuckInTheirHead,
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
