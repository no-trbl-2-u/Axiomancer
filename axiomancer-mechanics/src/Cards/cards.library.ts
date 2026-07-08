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
 * `src/Cards/skill.engine.ts` and `src/Combat/combat.engine.ts`.
 */

import { Card } from './types';
import { bindSandboxLibraryGuard, getSandboxCard } from './cards.sandbox';

// ─── T1 — AFFLICTION (bleed + poison: stack, extend, convert, detonate) ──────

const slipperySlope: Card = {
    id: 'slippery-slope',
    name: 'Slippery Slope',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'One concession, then the next, then the avalanche you promised was ' +
        'inevitable. The ground tilts, and they slide the whole way down.',
    tier: 2, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i1 d4 ramp lifetime 10/3 ≈ 3.3 + FREE tick 0.6 = 3.9 → Doxa (starter)
    free: { tickOne: true },
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1 }],
    learningRequirement: { level: 1 },
    addedIn: '2026-07-08',
    tags: ['affliction', 'dot', 'starter'],
};

const strawMansJab: Card = {
    id: 'straw-mans-jab',
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
    learningRequirement: { level: 2 },
    addedIn: '2026-07-08',
    tags: ['affliction', 'dot'],
};

const festeringArgument: Card = {
    id: 'festering-argument',
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
    learningRequirement: { level: 4 },
    addedIn: '2026-07-08',
    tags: ['affliction', 'glue'],
};

const currysConversion: Card = {
    id: 'currys-conversion',
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
    learningRequirement: { level: 6 },
    addedIn: '2026-07-08',
    tags: ['affliction', 'glue'],
};

const resonanceDetonation: Card = {
    id: 'resonance-detonation',
    name: 'Resonance Detonation',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Every argument you have seeded rings at once, one frequency, one ' +
        'conclusion. The structure was never going to hold.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: RUPTURE 4 + expected fuel value ~8 + tick 0.6 ≈ 12.6 → Axiom
    free: { tickOne: true },
    specialMechanics: [{ kind: 'rupture' }],
    learningRequirement: { level: 10 },
    addedIn: '2026-07-08',
    tags: ['affliction', 'payoff'],
};

const venomAndVein: Card = {
    id: 'venom-and-vein',
    name: 'Venom and Vein',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'The argument in the blood and the blood in the argument. From here ' +
        'on, everything you plant grows deeper roots.',
    tier: 2, rank: 5, cardType: 'enchantment',
    targetType: 'self',
    // pts: persistent +1 intensity on every bleed/poison application ≈ 1.5 × ~8 triggers × min-4 law ≈ 12 → Axiom
    learningRequirement: { level: 10 },
    addedIn: '2026-07-08',
    tags: ['affliction', 'enchantment'],
};

const suppuratingCurse: Card = {
    id: 'suppurating-curse',
    name: 'Suppurating Curse',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'A standing verdict: nothing on them is allowed to close. Every tick ' +
        'of every wound costs one more.',
    tier: 2, rank: 6, cardType: 'disenchant',
    targetType: 'enemy',
    // pts: engine text — +1 HP per DoT tick, rest of combat (Aporia: rule-rewriter)
    learningRequirement: { level: 12 },
    addedIn: '2026-07-08',
    tags: ['affliction', 'disenchant'],
};

// ─── T2 — PERORATION (the PERFORM spin-off: Premises → the conclusion) ───────

const exordium: Card = {
    id: 'exordium',
    name: 'Exordium',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'Every case begins somewhere quiet. You clear your throat, and the ' +
        'room — without knowing why — leans in.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: PAID draw 1 (2) + 1 Premise (0.8) + FREE premise (0.8) = 3.6 → Doxa
    free: { premises: 1 },
    specialMechanics: [{ kind: 'premise', count: 1 }, { kind: 'rider', rider: { drawCards: 1 } }],
    learningRequirement: { level: 1 },
    addedIn: '2026-07-08',
    tags: ['peroration'],
};

const openingStatement: Card = {
    id: 'opening-statement',
    name: 'Opening Statement',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'You name what you intend to prove while pointing at the place it ' +
        'will break them. A promise is also a threat.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: mark d2 (1.5) + 2 Premises (1.6) + FREE premise (0.8) = 3.9 → Lemma
    free: { premises: 1 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', duration: 2 }],
    specialMechanics: [{ kind: 'premise', count: 2 }],
    learningRequirement: { level: 2 },
    addedIn: '2026-07-08',
    tags: ['peroration', 'exposure'],
};

const mountingCase: Card = {
    id: 'mounting-case',
    name: 'Mounting Case',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'Premise stacked on premise, each one small, none deniable. The ' +
        'weight is the argument.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: mark d3 (2.2) + 2 Premises (1.6) + FREE premise (0.8) + threshold(+1 premise ×0.5 = 0.4)
    //      + tempo ≈ 6.8 → Thesis
    free: { premises: 1 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', duration: 3 }],
    specialMechanics: [{ kind: 'premise', count: 2 }],
    threshold: { color: 'heart', count: 2, rider: { premises: 1 } },
    learningRequirement: { level: 4 },
    addedIn: '2026-07-08',
    tags: ['peroration', 'exposure'],
};

const peroratioInterrupta: Card = {
    id: 'peroratio-interrupta',
    name: 'Peroratio Interrupta',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'You cash the argument early — ugly, effective. The conclusion you ' +
        'spend today cannot be refuted tomorrow.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: spend-all engine (~mark per 2 + draw per 3, scales with tally) ≈ 7-9 + FREE draw 2 ≈ 9 → Theorem
    free: { drawCards: 1 },
    specialMechanics: [{ kind: 'spend_premises', markPer: 2, drawPer: 3 }],
    learningRequirement: { level: 6 },
    addedIn: '2026-07-08',
    tags: ['peroration', 'payoff'],
};

const theClosingWord: Card = {
    id: 'the-closing-word',
    name: 'The Closing Word',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'The conclusion, declared before it is finished being true. At six ' +
        'premises it lands. At eight, they simply concede.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: PERORATION at 6 → consume marks 3/stack + draw 2 + 2 Conviction ≈ 13 (CONCEDE at 8 — alt-win, §9) → Axiom
    free: { premises: 1 },
    specialMechanics: [{
        kind: 'peroration', at: 6, concedeAt: 8,
        rider: { ruptureMarks: 3, drawCards: 2, conviction: 2 },
    }],
    learningRequirement: { level: 10 },
    addedIn: '2026-07-08',
    tags: ['peroration', 'payoff', 'alt-win'],
};

const practicedCadence: Card = {
    id: 'practiced-cadence',
    name: 'Practiced Cadence',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'The rhythm carries the argument when the content flags. From here ' +
        'on, every opening remark counts toward the close.',
    tier: 2, rank: 5, cardType: 'enchantment',
    targetType: 'self',
    // pts: persistent +1 Premise on the first card each turn ≈ 0.8 × ~10 turns, min-4 law ≈ 12 → Axiom
    learningRequirement: { level: 10 },
    addedIn: '2026-07-08',
    tags: ['peroration', 'enchantment'],
};

const captiveAudience: Card = {
    id: 'captive-audience',
    name: 'Captive Audience',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'While the case is building they cannot look away — and what cannot ' +
        'look away stands exposed.',
    tier: 2, rank: 6, cardType: 'disenchant',
    targetType: 'enemy',
    // pts: engine text — while you hold 4+ Premises the enemy stays marked (Aporia)
    learningRequirement: { level: 12 },
    addedIn: '2026-07-08',
    tags: ['peroration', 'disenchant'],
};

// ─── T3 — FORGE (dice from nothing: kindle, ripen, float, overtake) ──────────

const sketchOfAThought: Card = {
    id: 'sketch-of-a-thought',
    name: 'Sketch of a Thought',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Not yet an idea — the shape where an idea will be. You rough it in ' +
        'and it starts paying rent immediately.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: KINDLE mind (2.5) + FREE draw 1 (2 × 0.35 free-share ≈ 0.7) ≈ 3.2 → Doxa
    free: { drawCards: 1 },
    specialMechanics: [{ kind: 'create_temporary_die', color: 'mind' }],
    learningRequirement: { level: 1 },
    addedIn: '2026-07-08',
    tags: ['forge', 'dice'],
};

const halfStep: Card = {
    id: 'half-step',
    name: 'Half-Step',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Zeno was half right: you can always take half a step back. What ' +
        'waits behind the guard, ripens.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: Guard 5 (1.25) + pip (1.5) + FREE guard 2 (0.5) + tempo ≈ 4.3 → Lemma
    free: { guard: 2 },
    specialMechanics: [{ kind: 'guard', amount: 5 }, { kind: 'grant_pip', count: 1 }],
    learningRequirement: { level: 2 },
    addedIn: '2026-07-08',
    tags: ['forge', 'defense'],
};

const bootstrapLoop: Card = {
    id: 'bootstrap-loop',
    name: 'Bootstrap Loop',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'The proof assumes itself and, scandalously, works. The effect funds ' +
        'its own cause.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: KINDLE wild (3) + FREE conviction (1×0.35) + threshold(pip 1.5 ×0.5 = 0.75) + tempo ≈ 6.5 → Thesis
    free: { conviction: 1 },
    specialMechanics: [{ kind: 'create_temporary_die', color: 'wild' }],
    threshold: { color: 'mind', count: 2, rider: { pips: 1 } },
    learningRequirement: { level: 4 },
    addedIn: '2026-07-08',
    tags: ['forge', 'dice'],
};

const exNihilo: Card = {
    id: 'ex-nihilo',
    name: 'Ex Nihilo',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Something from nothing — the oldest scandal in philosophy, sitting ' +
        'in your tray, glinting, permanent until spent.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts: FORGE floating (5) + FREE draw (0.7) + threshold(pips ×0.5 = 0.75) + persistence value ≈ 9.8 → Theorem
    free: { drawCards: 1 },
    specialMechanics: [{ kind: 'forge_floating_die', color: 'powering' }],
    threshold: { color: 'mind', count: 4, rider: { pips: 1 } },
    learningRequirement: { level: 6 },
    addedIn: '2026-07-08',
    tags: ['forge', 'dice', 'floating'],
};

const theOvertake: Card = {
    id: 'the-overtake',
    name: 'The Overtake',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Achilles does pass the tortoise — all at once, every saved step ' +
        'spent in a single stride. Sudden, and total.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: spend ALL pips (+2 Guard per) + RUPTURE +2 fuel per pip ≈ 4 + ~9 scaled ≈ 13 → Axiom
    free: { guard: 2 },
    specialMechanics: [
        { kind: 'spend_all_pips', guardPerPip: 2 },
        { kind: 'rupture', fuelPerPip: 2 },
    ],
    learningRequirement: { level: 10 },
    addedIn: '2026-07-08',
    tags: ['forge', 'payoff'],
};

const anvilOfForm: Card = {
    id: 'anvil-of-form',
    name: 'Anvil of Form',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Matter remembers the shape it was struck into. Everything you forge ' +
        'from here arrives already tempered.',
    tier: 2, rank: 5, cardType: 'enchantment',
    targetType: 'self',
    // pts: persistent +1 pip on every kindled/floating die ≈ 1.5 × ~6 forges, min-4 ≈ 12 → Axiom
    learningRequirement: { level: 10 },
    addedIn: '2026-07-08',
    tags: ['forge', 'enchantment'],
};

const entropyTax: Card = {
    id: 'entropy-tax',
    name: 'Entropy Tax',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Nothing is created free. Every manufactured die you spend, the ' +
        'universe bills to them.',
    tier: 2, rank: 6, cardType: 'disenchant',
    targetType: 'enemy',
    // pts: engine text — every kindled/floating spend marks the enemy (Aporia)
    learningRequirement: { level: 12 },
    addedIn: '2026-07-08',
    tags: ['forge', 'disenchant'],
};

// ─── T4 — AKRASIA (acting against your own judgment; the debt pays) ──────────

const againstMyJudgment: Card = {
    id: 'against-my-judgment',
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
    learningRequirement: { level: 1 },
    addedIn: '2026-07-08',
    tags: ['akrasia'],
};

const sweetPoison: Card = {
    id: 'sweet-poison',
    name: 'Sweet Poison',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'You taste it first, to prove the vintage. The enemy drinks deeper — ' +
        'but you did drink.',
    tier: 2, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i2 d4 (~6.7) − self-bleed i1 d2 credit (−0.75×1.7 ≈ −1.3) + tick 0.6 ≈ 6.0 → Lemma (deliberately rich — the akratic bargain)
    free: { tickOne: true },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 2 },
        { effectId: 'debuff_bleed', appliedTo: 'self', intensity: 1, duration: 2 },
    ],
    learningRequirement: { level: 2 },
    addedIn: '2026-07-08',
    tags: ['akrasia', 'dot'],
};

const selfFlagellant: Card = {
    id: 'self-flagellant',
    name: 'Self-Flagellant',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'The lash falls on your own back, and every wound you have argued ' +
        'into them deepens in sympathy.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: +1 int to ALL enemy DoTs (~1.5 × ~3 = 4.5) + tick 0.6 − recoil 4 credit (−1) + tempo ≈ 7 → Thesis
    free: { tickOne: true },
    specialMechanics: [{ kind: 'recoil', hp: 4 }, { kind: 'boost_all_dots', intensity: 1 }],
    learningRequirement: { level: 4 },
    addedIn: '2026-07-08',
    tags: ['akrasia', 'dot'],
};

const fallenGrace: Card = {
    id: 'fallen-grace',
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
    learningRequirement: { level: 6 },
    addedIn: '2026-07-08',
    tags: ['akrasia', 'dot'],
};

const pactOfAkrasia: Card = {
    id: 'pact-of-akrasia',
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
    learningRequirement: { level: 10 },
    addedIn: '2026-07-08',
    tags: ['akrasia', 'floating'],
};

const crownOfThorns: Card = {
    id: 'crown-of-thorns',
    name: 'Crown of Thorns',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Wear the damage as regalia. While you are Fallen, everything you ' +
        'inflict inherits the weight.',
    tier: 2, rank: 5, cardType: 'enchantment',
    targetType: 'self',
    // pts: persistent +1 intensity on applications while FALLEN ≈ 1.5 × ~7 gated ×0.5 ≈ 11 → Axiom
    learningRequirement: { level: 10 },
    addedIn: '2026-07-08',
    tags: ['akrasia', 'enchantment'],
};

const mirrorOfGuilt: Card = {
    id: 'mirror-of-guilt',
    name: 'Mirror of Guilt',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'A curse of perfect symmetry: whatever you suffer, they now suffer ' +
        'the reflection of. The debt argues for you.',
    tier: 2, rank: 6, cardType: 'disenchant',
    targetType: 'enemy',
    // pts: engine text — every self-debuff you gain lands 1 stack on the enemy (Aporia)
    learningRequirement: { level: 12 },
    addedIn: '2026-07-08',
    tags: ['akrasia', 'disenchant'],
};

// ─── T5 — CONTROL (strip the rungs; the denied blow lands inward) ────────────

const zenosHalfStep: Card = {
    id: 'zenos-half-step',
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
    learningRequirement: { level: 1 },
    addedIn: '2026-07-08',
    tags: ['control'],
};

const redHerring: Card = {
    id: 'red-herring',
    name: 'Red Herring',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'Something glints in the corner of the argument. They lunge for it, ' +
        'and the lunge is the wound.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: backfire i2 d2 (3) + FREE draw (0.7) + dieBonus(+1 dur ×0.6 = 0.6) ≈ 4.3 → Lemma
    free: { drawCards: 1 },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    dieBonus: { onColor: 'mind', rider: { bonusDuration: 1 } },
    learningRequirement: { level: 2 },
    addedIn: '2026-07-08',
    tags: ['control'],
};

const undistributedMiddle: Card = {
    id: 'undistributed-middle',
    name: 'Undistributed Middle',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'The middle term never quite connects, and neither does their swing. ' +
        'Somewhere between premise and blow, the force goes missing.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: STAGGER 1 (2) + backfire i1 d2 (1.5) + FREE mark (0.5) + threshold(STAGGER 2 more ×0.5 = 2) ≈ 6-7.5 → Thesis
    free: { applyEffect: { effectId: 'debuff_mark', duration: 1 } },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    specialMechanics: [{ kind: 'stagger', rungs: 1 }],
    threshold: { color: 'mind', count: 3, rider: { stagger: 1 } },
    learningRequirement: { level: 4 },
    addedIn: '2026-07-08',
    tags: ['control'],
};

const arrowParadox: Card = {
    id: 'arrow-paradox',
    name: 'Arrow Paradox',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'At every instant the arrow is at rest. You choose the instant, and ' +
        'hold them in it — motion frozen mid-flight.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: lock stance (2.5) + STAGGER 1 (2) + reveal value + FREE guard (0.5) + tempo ≈ 9.5 → Theorem
    free: { guard: 2 },
    specialMechanics: [{ kind: 'lock_stance' }, { kind: 'stagger', rungs: 1 }],
    learningRequirement: { level: 6 },
    addedIn: '2026-07-08',
    tags: ['control'],
};

const paralysisOfAnalysis: Card = {
    id: 'paralysis-of-analysis',
    name: 'Paralysis of Analysis',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'You hand them every option at once. They stand in the doorway of ' +
        'the decision forever, bleeding from the hinges.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: STAGGER 2 (4 — a full deny) + backfire i2 d2 (3) + FREE draw (0.7) + tier-3 land rate ≈ 13 → Axiom
    free: { drawCards: 1 },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'stagger', rungs: 2 }],
    learningRequirement: { level: 10 },
    addedIn: '2026-07-08',
    tags: ['control', 'payoff'],
};

const achillesAndTheTortoise: Card = {
    id: 'achilles-and-the-tortoise',
    name: 'Achilles and the Tortoise',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'While they chase the conclusion they can never reach, you read. ' +
        'Every denied turn is a page.',
    tier: 2, rank: 5, cardType: 'enchantment',
    targetType: 'self',
    // pts: persistent draw 1 per denied enemy turn ≈ 2 × ~5 denies gated, min-4 ≈ 12 → Axiom
    learningRequirement: { level: 10 },
    addedIn: '2026-07-08',
    tags: ['control', 'enchantment'],
};

const quagmireOfDoubt: Card = {
    id: 'quagmire-of-doubt',
    name: 'Quagmire of Doubt',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'The ground under their certainty goes soft. Every action starts one ' +
        'rung lower than they remember planning it.',
    tier: 2, rank: 6, cardType: 'disenchant',
    targetType: 'enemy',
    // pts: engine text — telegraphs enter play 1 rung lower, rest of combat (Aporia)
    learningRequirement: { level: 12 },
    addedIn: '2026-07-08',
    tags: ['control', 'disenchant'],
};

// ─── T6 — ORACLE (foretell, declare, collect on the future) ──────────────────

const glimpse: Card = {
    id: 'glimpse',
    name: 'Glimpse',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'A crack in the next moment, wide enough for one eye. You look, and ' +
        'mark what looks back.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: FORETELL 2 (2) + mark d2 (1.5) + FREE foretell (0.35) ≈ 3.9 → Doxa
    free: { foretell: 1 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', duration: 2 }],
    specialMechanics: [{ kind: 'foretell', count: 2 }],
    learningRequirement: { level: 1 },
    addedIn: '2026-07-08',
    tags: ['oracle', 'exposure'],
};

const signsAndPortents: Card = {
    id: 'signs-and-portents',
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
    learningRequirement: { level: 2 },
    addedIn: '2026-07-08',
    tags: ['oracle'],
};

const cassandrasBurden: Card = {
    id: 'cassandras-burden',
    name: "Cassandra's Burden",
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'You saw it coming. No one believed you — so you braced alone, and ' +
        'named the exact place it would land.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: OMEN(mark i2 d2 (2.5) + Guard 4 (1)) ×0.6 = 2.1 + FREE draw (0.7) + info ≈ 6.8 → Thesis
    free: { drawCards: 1 },
    specialMechanics: [{
        kind: 'omen',
        rider: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 2 }, guard: 4 },
    }],
    learningRequirement: { level: 4 },
    addedIn: '2026-07-08',
    tags: ['oracle', 'exposure'],
};

const delphicAmbiguity: Card = {
    id: 'delphic-ambiguity',
    name: 'Delphic Ambiguity',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'The oracle answers truly, and you arrange what the truth will be. A ' +
        'great empire will indeed fall.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts: FORETELL 3 (3) + reveal next stance (1.5) + dieBonus(pips ×0.6 = 0.9) + FREE foretell + tempo ≈ 9 → Theorem
    free: { foretell: 1 },
    specialMechanics: [{ kind: 'foretell', count: 3 }, { kind: 'rider', rider: { revealStance: true } }],
    dieBonus: { onColor: 'mind', rider: { pips: 1 } },
    learningRequirement: { level: 6 },
    addedIn: '2026-07-08',
    tags: ['oracle'],
};

const prophecyFulfilled: Card = {
    id: 'prophecy-fulfilled',
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
    learningRequirement: { level: 10 },
    addedIn: '2026-07-08',
    tags: ['oracle', 'payoff'],
};

const theOraclesEye: Card = {
    id: 'the-oracles-eye',
    name: "The Oracle's Eye",
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'The lid never closes again. The enemy stops having a next move you ' +
        'have not already seen.',
    tier: 2, rank: 5, cardType: 'enchantment',
    targetType: 'self',
    // pts: persistent always-revealed next stance + omen riders ×1.5 ≈ 12 (min-4 law) → Axiom
    learningRequirement: { level: 10 },
    addedIn: '2026-07-08',
    tags: ['oracle', 'enchantment'],
};

const fatedCourse: Card = {
    id: 'fated-course',
    name: 'Fated Course',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'A curse of inevitability: the future you named is the only one left ' +
        'to them, and walking into it leaves a mark.',
    tier: 2, rank: 6, cardType: 'disenchant',
    targetType: 'enemy',
    // pts: engine text — every hit omen marks the foe, rest of combat (Aporia)
    learningRequirement: { level: 12 },
    addedIn: '2026-07-08',
    tags: ['oracle', 'disenchant'],
};

// ─── T7 — HARVEST (short afflictions churn into Souls; Souls into the scythe) ─

const briefCandle: Card = {
    id: 'brief-candle',
    name: 'Brief Candle',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Out, out. It burns bright, it burns fast, and what it leaves ' +
        'behind is yours to gather.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: bleed i2 d1 (~2) + fast expiry→Soul (0.75) + FREE tick 0.6 ≈ 3.4 → Doxa
    free: { tickOne: true },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 1 }],
    learningRequirement: { level: 1 },
    addedIn: '2026-07-08',
    tags: ['harvest', 'dot'],
};

const mementoMori: Card = {
    id: 'memento-mori',
    name: 'Memento Mori',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Remember that they die. You remember it AT them, and the ' +
        'remembering leaves a residue you can spend.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: mark i2 d1 (2) + its expiry Soul (0.75) + FREE soul (0.75×0.35) ≈ 4.2 with churn value → Lemma
    free: { souls: 1 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 1 }],
    learningRequirement: { level: 2 },
    addedIn: '2026-07-08',
    tags: ['harvest', 'exposure'],
};

const winnowing: Card = {
    id: 'winnowing',
    name: 'Winnowing',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'The scythe does not wait for the season. One standing affliction, ' +
        'cut and threshed and pocketed now.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: consume 1 affliction → fuel ticks NOW (~4-5) + 1 Soul (0.75) + FREE tick 0.6 ≈ 7 → Thesis
    free: { tickOne: true },
    specialMechanics: [{ kind: 'consume_affliction', souls: 1 }],
    learningRequirement: { level: 4 },
    addedIn: '2026-07-08',
    tags: ['harvest', 'payoff'],
};

const theGleanersDue: Card = {
    id: 'the-gleaners-due',
    name: "The Gleaner's Due",
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'What the field owes the one who walks behind the reapers: a die ' +
        'from the leavings, and something to read by.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts: REAP 3 → KINDLE (2.5) + draw 2 (4) − soul cost (~2.25) + FREE draw 0.7 + engine value ≈ 9 → Theorem
    free: { drawCards: 1 },
    specialMechanics: [{ kind: 'reap', cost: 3, rider: { drawCards: 2 }, kindle: 'mind' }],
    learningRequirement: { level: 6 },
    addedIn: '2026-07-08',
    tags: ['harvest'],
};

const theReaping: Card = {
    id: 'the-reaping',
    name: 'The Reaping',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Every soul you gathered, swung at once. The harvest was never for ' +
        'keeping — it was for this.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: REAP all — 2 per Soul (cap kept), read+vuln scaled ≈ 13 with a running engine → Axiom
    free: { tickOne: true },
    specialMechanics: [{ kind: 'reap_all', burstPerSoul: 2 }],
    learningRequirement: { level: 10 },
    addedIn: '2026-07-08',
    tags: ['harvest', 'payoff'],
};

const boneOrchard: Card = {
    id: 'bone-orchard',
    name: 'Bone Orchard',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'Plant what expires; the orchard does the rest. Every soul that ' +
        'falls to you takes a bite of them on the way.',
    tier: 2, rank: 5, cardType: 'enchantment',
    targetType: 'self',
    // pts: persistent 1 HP per Soul gained (soul-gated drip) ≈ 1 × ~12 souls, min-4 ≈ 12 → Axiom
    learningRequirement: { level: 10 },
    addedIn: '2026-07-08',
    tags: ['harvest', 'enchantment'],
};

const theTithe: Card = {
    id: 'the-tithe',
    name: 'The Tithe',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'A tenth of everything, taken early. Their afflictions ripen a turn ' +
        'sooner, and the collection plate is yours.',
    tier: 2, rank: 6, cardType: 'disenchant',
    targetType: 'enemy',
    // pts: engine text — enemy afflictions expire 1 turn sooner (faster Soul churn) (Aporia)
    learningRequirement: { level: 12 },
    addedIn: '2026-07-08',
    tags: ['harvest', 'disenchant'],
};

// ─── T8 — CHARM (SWAY toward CAPITULATION — the deck that never strikes) ─────

const softWord: Card = {
    id: 'soft-word',
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
    learningRequirement: { level: 1 },
    addedIn: '2026-07-08',
    tags: ['charm', 'alt-win'],
};

const disarmingSmile: Card = {
    id: 'disarming-smile',
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
    learningRequirement: { level: 2 },
    addedIn: '2026-07-08',
    tags: ['charm'],
};

const commonGround: Card = {
    id: 'common-ground',
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
    learningRequirement: { level: 4 },
    addedIn: '2026-07-08',
    tags: ['charm'],
};

const theOliveBranch: Card = {
    id: 'the-olive-branch',
    name: 'The Olive Branch',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Extended with a steady hand, from inside their reach. Mercy offered ' +
        'from a guard position is twice as loud.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: SWAY 3 (2.4) + cleanse (1.5) + heal 3 (1) + FREE guard (0.5) + tempo ≈ 9 → Theorem
    free: { guard: 2 },
    specialMechanics: [
        { kind: 'sway', amount: 3 },
        { kind: 'rider', rider: { cleanse: 1, healHp: 3 } },
    ],
    learningRequirement: { level: 6 },
    addedIn: '2026-07-08',
    tags: ['charm', 'defense'],
};

const heartOfTheMatter: Card = {
    id: 'heart-of-the-matter',
    name: 'Heart of the Matter',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'You say the thing they have been not-saying their whole life. The ' +
        'fight goes out of a person who feels seen.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: SWAY 5 (4) + heal 4 (1.3) + FREE sway 1 (0.3) + threshold(SWAY +3 ×0.5 = 1.2) + capstone ≈ 13 → Axiom
    free: { sway: 1 },
    specialMechanics: [{ kind: 'sway', amount: 5 }, { kind: 'rider', rider: { healHp: 4 } }],
    threshold: { color: 'heart', count: 5, rider: { sway: 3 } },
    learningRequirement: { level: 10 },
    addedIn: '2026-07-08',
    tags: ['charm', 'alt-win'],
};

const irresistibleGrace: Card = {
    id: 'irresistible-grace',
    name: 'Irresistible Grace',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'What has truly been offered cannot be taken back, and cannot wear ' +
        'off. Your sway stops decaying.',
    tier: 2, rank: 5, cardType: 'enchantment',
    targetType: 'self',
    // pts: persistent — SWAY no longer decays (≈ +1/turn saved × rest of combat), min-4 ≈ 12 → Axiom
    learningRequirement: { level: 10 },
    addedIn: '2026-07-08',
    tags: ['charm', 'enchantment'],
};

const mirrorOfLonging: Card = {
    id: 'mirror-of-longing',
    name: 'Mirror of Longing',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Every blow you turn aside shows them what they actually wanted. ' +
        'Prevented violence converts, at par, to persuasion.',
    tier: 2, rank: 6, cardType: 'disenchant',
    targetType: 'enemy',
    // pts: engine text — damage your defenses prevent becomes SWAY (Aporia)
    learningRequirement: { level: 12 },
    addedIn: '2026-07-08',
    tags: ['charm', 'disenchant', 'alt-win'],
};

// ─── T9 — BULWARK (guard, thorns, riposte — their aggression kills them) ─────

const braceForImpact: Card = {
    id: 'brace-for-impact',
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
    learningRequirement: { level: 1 },
    addedIn: '2026-07-08',
    tags: ['bulwark', 'defense', 'starter'],
};

const nettleCloak: Card = {
    id: 'nettle-cloak',
    name: 'Nettle Cloak',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Wear the argument that stings on contact. Let them figure out the ' +
        'lesson with their knuckles.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: thorns i2 d2 (~3) + FREE guard 2 (0.5) + reflect synergy ≈ 4.3 → Lemma
    free: { guard: 2 },
    combatEffects: [{ effectId: 'buff_thorns', appliedTo: 'self', intensity: 2, duration: 2 }],
    learningRequirement: { level: 2 },
    addedIn: '2026-07-08',
    tags: ['bulwark', 'reflect'],
};

const tuQuoque: Card = {
    id: 'tu-quoque',
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
    dieBonus: { onColor: 'body', rider: { guard: 2 } },
    learningRequirement: { level: 4 },
    addedIn: '2026-07-08',
    tags: ['bulwark', 'reflect'],
};

const measuredAnswer: Card = {
    id: 'measured-answer',
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
    learningRequirement: { level: 6 },
    addedIn: '2026-07-08',
    tags: ['bulwark', 'reflect'],
};

const theAdamantWall: Card = {
    id: 'the-adamant-wall',
    name: 'The Adamant Wall',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Not a defense — a verdict about where the fight ends. Everything ' +
        'that breaks against it answers for the attempt.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'self',
    // pts: BARRIER 10 (3.3) + RIPOSTE 4/parry 2 (~5) + FREE guard 3 (0.75) + persistence ≈ 13 → Axiom
    free: { guard: 3 },
    specialMechanics: [{ kind: 'barrier', amount: 10 }, { kind: 'riposte', damage: 4, reduce: 2 }],
    learningRequirement: { level: 10 },
    addedIn: '2026-07-08',
    tags: ['bulwark', 'reflect', 'payoff'],
};

const hedgehogsDilemma: Card = {
    id: 'hedgehogs-dilemma',
    name: "Hedgehog's Dilemma",
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'To reach you they must come close; to come close is to be pierced. ' +
        'Every prick leaves the flaw named.',
    tier: 2, rank: 5, cardType: 'enchantment',
    targetType: 'self',
    // pts: persistent — every THORNS trigger also marks the enemy ≈ 1 × ~8 triggers, min-4 ≈ 12 → Axiom
    learningRequirement: { level: 10 },
    addedIn: '2026-07-08',
    tags: ['bulwark', 'enchantment'],
};

const crumblingResolve: Card = {
    id: 'crumbling-resolve',
    name: 'Crumbling Resolve',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'A curse for the persistent: every swing your wall swallows whole ' +
        'takes a rung out of their next one.',
    tier: 2, rank: 6, cardType: 'disenchant',
    targetType: 'enemy',
    // pts: engine text — a fully blocked attack staggers the next telegraph (Aporia)
    learningRequirement: { level: 12 },
    addedIn: '2026-07-08',
    tags: ['bulwark', 'disenchant'],
};

// ─── T10 — ECHO (the discard is a songbook; the refrain never ends) ──────────

const refrain: Card = {
    id: 'refrain',
    name: 'Refrain',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Said once, it is a remark. Said twice, in the same breath, it ' +
        'starts to sound like the truth.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: mark d2 ×ECHO (1.5×1.8 = 2.7) + FREE draw (0.7) ≈ 3.4 → Doxa
    free: { drawCards: 1 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', duration: 2 }],
    specialMechanics: [{ kind: 'echo' }],
    learningRequirement: { level: 1 },
    addedIn: '2026-07-08',
    tags: ['echo', 'exposure'],
};

const secondThoughts: Card = {
    id: 'second-thoughts',
    name: 'Second Thoughts',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'The discarded idea was not wrong — it was early. You reach back ' +
        'into the pile and take it again.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: REPRISE 1 (2) + FREE draw (0.7) + selection value (best-of-discard) ≈ 4.2 → Lemma
    free: { drawCards: 1 },
    specialMechanics: [{ kind: 'reprise', count: 1 }],
    learningRequirement: { level: 2 },
    addedIn: '2026-07-08',
    tags: ['echo', 'recursion'],
};

const adNauseam: Card = {
    id: 'ad-nauseam',
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
    learningRequirement: { level: 4 },
    addedIn: '2026-07-08',
    tags: ['echo', 'recursion'],
};

const circularReasoning: Card = {
    id: 'circular-reasoning',
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
    learningRequirement: { level: 6 },
    addedIn: '2026-07-08',
    tags: ['echo', 'recursion'],
};

const ouroboros: Card = {
    id: 'ouroboros',
    name: 'Ouroboros',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'The argument eats its own tail and grows fat on it. Whatever you ' +
        'said last, the serpent says again. Twice.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: replay last spell ×2 (≈ 2 × avg spell payload ~5 = 10) + FREE draw (0.7) + setup cost ≈ 13.5 → Axiom
    free: { drawCards: 1 },
    specialMechanics: [{ kind: 'replay_last', times: 2 }],
    learningRequirement: { level: 10 },
    addedIn: '2026-07-08',
    tags: ['echo', 'recursion', 'payoff'],
};

const resonantChamber: Card = {
    id: 'resonant-chamber',
    name: 'Resonant Chamber',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'The room learns your voice. The first thing you say each turn ' +
        'comes back saying itself.',
    tier: 2, rank: 5, cardType: 'enchantment',
    targetType: 'self',
    // pts: persistent — the first spell each turn gains ECHO ≈ ×0.8 spell/turn × rest, min-4 ≈ 12 → Axiom
    learningRequirement: { level: 10 },
    addedIn: '2026-07-08',
    tags: ['echo', 'enchantment'],
};

const stuckInTheirHead: Card = {
    id: 'stuck-in-their-head',
    name: 'Stuck in Their Head',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'The tune they cannot stop hearing is yours. Every repetition ' +
        'costs them a little more of themselves.',
    tier: 2, rank: 6, cardType: 'disenchant',
    targetType: 'enemy',
    // pts: engine text — every ECHO / REPRISE drips 2 (echo-gated, §1 source 3) (Aporia)
    learningRequirement: { level: 12 },
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

/** O(1) lookup by card id; sandbox-aware. */
export function getCardById(id: string): Card | undefined {
    return getSandboxCard(id) ?? registry.get(id);
}
