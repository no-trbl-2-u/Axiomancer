/**
 * Swap pool — AKRASIA (preset `penitent`), 30 new spells.
 *
 * Owner-ratified 2026-07-18: per-theme swap pools feed `/deck-tuning`'s
 * 15-card preset recipe (4x2 commons, 2x2 uncommons, 1x3 rares) as SWAP
 * CANDIDATES ONLY — never player-facing, never in presets, never in
 * `cards.library.ts`. Promotion of any card here rides the standard
 * sandbox-first evidence path.
 *
 * Vocabulary law: hallmarks RECOIL + FALLEN, family utility MARK + HEAL,
 * plus the generic utility verbs akrasia's seven library cards already
 * lean on (DRAW / GUARD / CLEANSE / RUPTURE / SIPHON, bleed/poison DoTs,
 * the chosen-X blood cost, and the die-manipulation verbs pact-of-akrasia
 * precedents). TICK is dead (owner-ratified 2026-07-10, atlas KW-4) — no
 * card below speaks it; FREE lines deposit the theme currency instead
 * (a self-MARK seed toward FALLEN), per the phase-30 FREE-currency law.
 *
 * Condition-line law: every tier-2+ card carries exactly ONE of
 * threshold / dieBonus / fate / die-manipulation / react — FALLEN and
 * `synergy.statePredicate` gates fill the react slot (library
 * `fallen-grace` and the Coda `cards.sandbox-sets.ts` precedents; the
 * ratified five-class wording, CHANGELOG).
 *
 * FALLEN pairing constraint (recipe law): the universal FREE self-MARK
 * seed supplies only ONE distinct self-debuff (MARK stacks by intensity —
 * repeat seeds add no distinctness), and FALLEN needs TWO. A `/deck-tuning`
 * recipe that drafts a FALLEN payoff must keep a second-affliction on-ramp
 * beside it — in this pool: scourge-and-psalm, the-old-habit,
 * the-hair-shirt, the-glad-martyr (self-bleed), relapse (self-poison),
 * the-martyrs-arithmetic (both); in the library: sweet-poison /
 * pact-of-akrasia.
 *
 * Prior art (community-sourced, confidence medium — leads, not canon):
 * kb:dawncaster/keywords/blood.okf.md (src-001) — HP-as-cost family;
 * kb:dawncaster/keywords/corrupted.okf.md (src-001) — threshold state
 * ("4+ Corruptions present") ~ FALLEN; kb:dawncaster/keywords/frenzy.okf.md
 * (src-001) — "triggers when you've taken damage during your turn" ~ the
 * recoil-paid / enemy-drew-blood synergy gates; carrier-density query over
 * cards.json: Blood ~20 / Frenzy ~20 / Lifedrain ~37 / Corruption ~17+26
 * carriers of 1,692 — the genre spreads a blood family across MANY cheap
 * cost-carriers and FEW state-payoffs, which is this pool's shape.
 */

import type { Card } from '../types';
import type { SandboxCardSet } from '../cards.sandbox-sets';

// ─── Commons (10) — the x4-seat candidates: simple, reliable, one verb ───────

/**
 * The plain MARK common: battle-long amp on them, the FALLEN deposit on you.
 * Simplest possible x4 seat — no cost, no condition, always correct.
 */
const smallVice: Card = {
    id: 'small-vice',
    theme: 'akrasia',
    name: 'Small Vice',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'A modest cruelty, taken daily. The dose is nothing; the habit is ' +
        'the weapon.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: mark i2 d2 (0.75 × 2 × 2 = 3.0) + FREE [self-mark i1 d1 (0.75) +
    // heal 2 (0.667)] = 1.417 → 4.42 → common band 1.5-7.5 (Doxa). FREE
    // share 1.417/4.417 = 32.1% ✓ window.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' }, healHp: 2 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    addedIn: '2026-07-18',
    tags: ['akrasia'],
};

/**
 * The live-DoT common (seat law): a front-loaded bleed, nothing else.
 * Duration printed honestly at 1 — BLEED i2 washes out inside the round.
 */
const theFirstCut: Card = {
    id: 'the-first-cut',
    theme: 'akrasia',
    name: 'The First Cut',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'The first cut costs the least, which is how the second is agreed to.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: bleed i2 d1 (washout lifetime 9 HP ÷ 3 = 3.0) + FREE [self-mark
    // i1 d1 (0.75) + guard 2 (0.5)] = 1.25 → 4.25 → common band 1.5-7.5
    // (Doxa). FREE share 1.25/4.25 = 29.4% ✓ window.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' }, guard: 2 },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 1 }],
    addedIn: '2026-07-18',
    tags: ['akrasia', 'dot'],
};

/**
 * The defend common (seat law): a plain wall plus a stitch of HEAL — akrasia
 * defends by patching what it already spent.
 */
const beggarsBandage: Card = {
    id: 'beggars-bandage',
    theme: 'akrasia',
    name: "Beggar's Bandage",
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Cloth over the wound, gratitude over the shame. It holds better ' +
        'than pride does.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: GUARD 8 (8 ÷ 4 = 2.0) + heal 2 (0.667) = 2.667 + FREE [guard 2
    // (0.5) + self-mark i1 d1 (0.75)] = 1.25 → 3.92 → common band 1.5-7.5
    // (Doxa). FREE share 1.25/3.917 = 31.9% ✓ window.
    free: { guard: 2, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' } },
    specialMechanics: [
        { kind: 'guard', amount: 8 },
        { kind: 'rider', rider: { healHp: 2 } },
    ],
    addedIn: '2026-07-18',
    tags: ['akrasia', 'defense'],
};

/**
 * Cycle glue with a defend half — the common that keeps the hand moving
 * while the debts accrue.
 */
const countTheCost: Card = {
    id: 'count-the-cost',
    theme: 'akrasia',
    name: 'Count the Cost',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Tally what it will take before you pay it. You will pay it anyway ' +
        '— but now the ledger is warm.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: draw 1 (2.0) + GUARD 4 (1.0) = 3.0 + FREE [self-mark i1 d1
    // (0.75) + heal 2 (0.667)] = 1.417 → 4.42 → common band 1.5-7.5 (Doxa).
    // FREE share 1.417/4.417 = 32.1% ✓ window.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' }, healHp: 2 },
    specialMechanics: [
        { kind: 'guard', amount: 4 },
        { kind: 'rider', rider: { drawCards: 1 } },
    ],
    addedIn: '2026-07-18',
    tags: ['akrasia', 'defense'],
};

/**
 * The draw common: a light MARK, a card, and a thin self-cut — the habit
 * takes its toll each time, and the toll is a SECOND distinct affliction
 * beside the FREE self-mark seed. A x4-seat FALLEN on-ramp (see the
 * header pairing constraint).
 */
const theOldHabit: Card = {
    id: 'the-old-habit',
    theme: 'akrasia',
    name: 'The Old Habit',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'It knows the way to your hand, and it always takes a little skin. ' +
        'You do not remember choosing it — only that you always do.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: mark i1 d2 (1.5) + draw 1 (2.0) − self-bleed i1 d2 credit (0.75
    // × 1.0 = −0.75) = 2.75 + FREE [self-mark i1 d1 (0.75) + guard 2 (0.5)]
    // = 1.25 → 4.00 → common band 1.5-7.5 (Doxa). FREE share 1.25/4.0 =
    // 31.3% ✓ window.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' }, guard: 2 },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 },
        { effectId: 'debuff_bleed', appliedTo: 'self', intensity: 1, duration: 2 },
    ],
    specialMechanics: [{ kind: 'rider', rider: { drawCards: 1 } }],
    addedIn: '2026-07-18',
    tags: ['akrasia', 'dot'],
};

/**
 * Bleed-plus-amp in one breath: the thin cut finds every MARK it lands
 * beside. Teaches the theme's tick-amplification loop at the x4 seat.
 */
const saltTheWound: Card = {
    id: 'salt-the-wound',
    theme: 'akrasia',
    name: 'Salt the Wound',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'A thin cut, then salt in measures. The wound does the arguing ' +
        'after that.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: bleed i1 d1 (3 HP ÷ 3 = 1.0) + mark i2 d2 (3.0) = 4.0 + FREE
    // [self-mark i1 d1 (0.75) + heal 2 (0.667)] = 1.417 → 5.42 → common
    // band 1.5-7.5 (Lemma). FREE share 1.417/5.417 = 26.2% ✓ window.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' }, healHp: 2 },
    combatEffects: [
        { effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 1, duration: 1 },
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 2 },
    ],
    addedIn: '2026-07-18',
    tags: ['akrasia', 'dot'],
};

/**
 * The first loan: RECOIL for cards. The cheapest statement of the theme's
 * bargain — power now, the body pays.
 */
const borrowedStrength: Card = {
    id: 'borrowed-strength',
    theme: 'akrasia',
    name: 'Borrowed Strength',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Strength on loan against the body\'s estate. The collector is ' +
        'patient, and the interest is red.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: draw 2 (4.0) − RECOIL 3 credit (3 × 1/3 × 0.75 = −0.75) = 3.25 +
    // FREE [self-mark i1 d1 (0.75) + heal 2 (0.667)] = 1.417 → 4.67 →
    // common band 1.5-7.5 (Lemma). FREE share 1.417/4.667 = 30.4% ✓ window.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' }, healHp: 2 },
    specialMechanics: [
        { kind: 'rider', rider: { drawCards: 2 } },
        { kind: 'recoil', hp: 3 },
    ],
    addedIn: '2026-07-18',
    tags: ['akrasia'],
};

/**
 * The blood-priced DoT common: the HOT clock — POISON i2 d2 against
 * sweet-poison's slow i1 d4. Deliberately NOT that card's shape: it probes
 * whether the short, strong dose earns the x4 seat, and the RECOIL cost
 * (vs the library card's self-bleed financing) stays the A/B lever.
 */
const venomOnCredit: Card = {
    id: 'venom-on-credit',
    theme: 'akrasia',
    name: 'Venom on Credit',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'The strong dose, the short clock. Take it now — the bill arrives ' +
        'with your own blood as postage.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i2 d2 (tempo-weighted lifetime ≈ 12.8 HP ÷ 3 = 4.27) −
    // RECOIL 2 credit (−0.5) = 3.77 + FREE [self-mark i1 d1 (0.75) + heal 2
    // (0.667)] = 1.417 → 5.19 → common band 1.5-7.5 (Lemma). FREE share
    // 1.417/5.187 = 27.3% ✓ window.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' }, healHp: 2 },
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'recoil', hp: 2 }],
    addedIn: '2026-07-18',
    tags: ['akrasia', 'dot'],
};

/**
 * The FALLEN on-ramp common: its self-bleed plus the FREE self-mark seed
 * ESTABLISH Fallen (2 distinct self-afflictions) for every later play.
 * FALLEN reads PRE-play state (combat.engine.ts, getDistinctDebuffCount at
 * play time), so the heal-4 rider stays dark on the on-ramp play itself —
 * the psalm pays only if you were already kneeling walking in.
 */
const scourgeAndPsalm: Card = {
    id: 'scourge-and-psalm',
    theme: 'akrasia',
    name: 'Scourge and Psalm',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Lash, then verse, then lash. The liturgy asks for your back, and ' +
        'pays the kneeling handsomely.',
    tier: 2, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: bleed i2 d1 (3.0) − self-bleed i1 d2 credit (0.75 × 1.0 = −0.75)
    // = 2.25 + FALLEN [heal 4 (1.333)] × 0.5 = 0.667 + FREE [self-mark i1
    // d1 (0.75) + heal 2 (0.667)] = 1.417 → 4.33 → common band 1.5-7.5
    // (Lemma). FREE share 1.417/4.334 = 32.7% ✓ window. Condition line:
    // FALLEN (theme-state; the card's only condition).
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' }, healHp: 2 },
    combatEffects: [
        { effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 1 },
        { effectId: 'debuff_bleed', appliedTo: 'self', intensity: 1, duration: 2 },
    ],
    fallen: { rider: { healHp: 4 } },
    addedIn: '2026-07-18',
    tags: ['akrasia', 'dot', 'condition'],
};

/**
 * The off-color common: akrasia's die law in miniature — the WRONG die,
 * swung anyway, hits harder. dieBonus 'off' is the akratic act itself.
 */
const flinchAndSwing: Card = {
    id: 'flinch-and-swing',
    theme: 'akrasia',
    name: 'Flinch and Swing',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'The wrong hand, the wrong angle, thrown anyway. Conviction was ' +
        'never about aim.',
    tier: 2, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: bleed i2 d1 (3.0) − RECOIL 2 credit (−0.5) = 2.5 + dieBonus off
    // [mark i2 d2 (3.0)] × 0.6 = 1.8 + FREE [self-mark i1 d1 (0.75) + heal
    // 3 (1.0)] = 1.75 → 6.05 → common band 1.5-7.5 (Lemma). FREE share
    // 1.75/6.05 = 28.9% ✓ window. Condition line: dieBonus (the only one).
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' }, healHp: 3 },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 1 }],
    specialMechanics: [{ kind: 'recoil', hp: 2 }],
    dieBonus: { onColor: 'off', rider: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 2 } } },
    addedIn: '2026-07-18',
    tags: ['akrasia', 'dot', 'condition'],
};

// ─── Uncommons (12) — the engine: FALLEN gates, blood synergies, loans ───────

/**
 * The FALLEN engine wall: a self-bleed deposit under a MARK + GUARD shell;
 * while Fallen the discomfort doubles as armor and salve.
 */
const theHairShirt: Card = {
    id: 'the-hair-shirt',
    theme: 'akrasia',
    name: 'The Hair Shirt',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Wear the discomfort next to the skin. It rubs the soul awake, and ' +
        'the waking is armor.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: mark i2 d2 (3.0) + GUARD 4 (1.0) − self-bleed i1 d2 credit
    // (−0.75) = 3.25 + FALLEN [guard 4 (1.0) + heal 3 (1.0)] × 0.5 = 1.0 +
    // FREE [self-mark i1 d1 (0.75) + heal 3 (1.0)] = 1.75 → 6.00 →
    // uncommon band 4.5-13 (Thesis). FREE share 1.75/6.0 = 29.2% ✓ window.
    // Condition line: FALLEN.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' }, healHp: 3 },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 2 },
        { effectId: 'debuff_bleed', appliedTo: 'self', intensity: 1, duration: 2 },
    ],
    specialMechanics: [{ kind: 'guard', amount: 4 }],
    fallen: { rider: { guard: 4, healHp: 3 } },
    addedIn: '2026-07-18',
    tags: ['akrasia', 'defense', 'condition'],
};

/**
 * The Frenzy-after-cost engine (kb:dawncaster/keywords/frenzy.okf.md shape):
 * poison bought with blood, and if a PRIOR play this turn already paid a
 * blood price, the second payment draws and heals.
 */
const goodBloodAfterBad: Card = {
    id: 'good-blood-after-bad',
    theme: 'akrasia',
    name: 'Good Blood After Bad',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'The first payment did not settle it, so you pay again. Ruin, at ' +
        'least, keeps honest books.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i2 d2 (tempo-weighted ≈ 12.8 HP ÷ 3 = 4.27) − RECOIL 3
    // credit (−0.75) = 3.52 + recoil-paid rider [draw 1 (2.0) + heal 3
    // (1.0)] × 0.5 = 1.5 + FREE [self-mark i1 d1 (0.75) + guard 2 (0.5) +
    // heal 3 (1.0)] = 2.25 → 7.27 → uncommon band 4.5-13 (Thesis). FREE
    // share 2.25/7.27 = 30.9% ✓ window. Condition line: the state gate.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' }, guard: 2, healHp: 3 },
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'recoil', hp: 3 }],
    synergy: {
        statePredicate: { kind: 'recoil-paid-this-turn' },
        rider: { drawCards: 1, healHp: 3 },
    },
    addedIn: '2026-07-18',
    tags: ['akrasia', 'dot', 'sequencing', 'condition'],
};

/**
 * The heavy blood-bleed: RECOIL 5 for the biggest bleed an uncommon may
 * print; a body threshold pays the wound partly back.
 */
const mortifyTheFlesh: Card = {
    id: 'mortify-the-flesh',
    theme: 'akrasia',
    name: 'Mortify the Flesh',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'The flesh voted against; overrule it. What the body forfeits, the ' +
        'argument collects — threefold and bleeding.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: bleed i3 d2 (washout lifetime 17.25 HP ÷ 3 = 5.75) − RECOIL 5
    // credit (−1.25) = 4.5 + threshold body 3 [heal 4 (1.333) + mark i1 d2
    // (1.5)] × 0.5 = 1.417 + FREE [self-mark i1 d1 (0.75) + guard 2 (0.5) +
    // heal 3 (1.0)] = 2.25 → 8.17 → uncommon band 4.5-13 (Thesis). FREE
    // share 2.25/8.167 = 27.6% ✓ window. Condition line: threshold.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' }, guard: 2, healHp: 3 },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 3, duration: 2 }],
    specialMechanics: [{ kind: 'recoil', hp: 5 }],
    threshold: {
        color: 'body', count: 3,
        rider: { healHp: 4, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } },
    },
    addedIn: '2026-07-18',
    tags: ['akrasia', 'dot', 'condition'],
};

/**
 * The MARK battery: the deepest plain mark in the pool, with a matched die
 * pressing every status this play lands one point deeper.
 */
const gildTheGuilt: Card = {
    id: 'gild-the-guilt',
    theme: 'akrasia',
    name: 'Gild the Guilt',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'Polish the shame until it shines on them instead. Guilt, properly ' +
        'worn, is jewelry with edges.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: mark i3 d2 (0.75 × 3 × 2 = 4.5) + heal 2 (0.667) = 5.17 +
    // dieBonus match [bonusIntensity 1 (1.5)] × 0.6 = 0.9 + FREE [self-mark
    // i1 d1 (0.75) + guard 2 (0.5) + heal 3 (1.0)] = 2.25 → 8.32 →
    // uncommon band 4.5-13 (Thesis). FREE share 2.25/8.317 = 27.1% ✓
    // window. Condition line: dieBonus.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' }, guard: 2, healHp: 3 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 3, duration: 2 }],
    specialMechanics: [{ kind: 'rider', rider: { healHp: 2 } }],
    dieBonus: { onColor: 'match', rider: { bonusIntensity: 1 } },
    addedIn: '2026-07-18',
    tags: ['akrasia', 'condition'],
};

/**
 * The die-manipulation seat (pact-of-akrasia's BANK precedent): the spent
 * die goes to the Reserve — the loan keeps its collateral.
 */
const theBodyRemembers: Card = {
    id: 'the-body-remembers',
    theme: 'akrasia',
    name: 'The Body Remembers',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Every payment leaves a groove. Set the spent die in the reserve — ' +
        'the body files what the mind forgives.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: BANK spent die (2.0) + mark i2 d2 (3.0) − RECOIL 3 credit
    // (−0.75) = 4.25 + FREE [self-mark i1 d1 (0.75) + heal 3 (1.0)] = 1.75
    // → 6.00 → uncommon band 4.5-13 (Thesis). FREE share 1.75/6.0 = 29.2%
    // ✓ window. Condition line: die-manipulation (BANK).
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' }, healHp: 3 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [
        { kind: 'bank_spent_die' },
        { kind: 'recoil', hp: 3 },
    ],
    addedIn: '2026-07-18',
    tags: ['akrasia', 'condition'],
};

/**
 * The self-poison loan: a big defensive draw turn financed by a slow debt
 * that doubles as FALLEN fuel. Heart threshold pays a stitch back.
 */
const relapse: Card = {
    id: 'relapse',
    theme: 'akrasia',
    name: 'Relapse',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'You swore off. The swearing lasted a season; the returning took an ' +
        'evening — and how well the returning pays.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: draw 2 (4.0) + GUARD 6 (1.5) − self-poison i1 d2 credit (0.75 ×
    // 2.135 = −1.60) = 3.90 + threshold heart 3 [heal 4 (1.333)] × 0.5 =
    // 0.667 + FREE [self-mark i1 d1 (0.75) + heal 3 (1.0)] = 1.75 → 6.32 →
    // uncommon band 4.5-13 (Thesis). FREE share 1.75/6.316 = 27.7% ✓
    // window. Condition line: threshold.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' }, healHp: 3 },
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'self', intensity: 1, duration: 2 }],
    specialMechanics: [
        { kind: 'rider', rider: { drawCards: 2 } },
        { kind: 'guard', amount: 6 },
    ],
    threshold: { color: 'heart', count: 3, rider: { healHp: 4 } },
    addedIn: '2026-07-18',
    tags: ['akrasia', 'defense', 'condition'],
};

/**
 * The opening-shape card (WS5 grammar): the turn's FIRST spell spends the
 * morning's resolve — poison under guard, and the early word draws.
 */
const theMorningsResolve: Card = {
    id: 'the-mornings-resolve',
    theme: 'akrasia',
    name: "The Morning's Resolve",
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'The vow is strongest before it is tested. Say the first word of ' +
        'the day and let the resolve spend itself early.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i1 d4 (3.94) + GUARD 4 (1.0) = 4.94 + opening(0) rider
    // [draw 1 (2.0)] × 0.5 = 1.0 + FREE [self-mark i1 d1 (0.75) + heal 3
    // (1.0) + guard 2 (0.5)] = 2.25 → 8.19 → uncommon band 4.5-13
    // (Thesis). FREE share 2.25/8.186 = 27.5% ✓ window. Condition line:
    // the state gate (opening).
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' }, healHp: 3, guard: 2 },
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 4 }],
    specialMechanics: [{ kind: 'guard', amount: 4 }],
    synergy: {
        statePredicate: { kind: 'opening', maxPriorSpells: 0 },
        rider: { drawCards: 1 },
    },
    addedIn: '2026-07-18',
    tags: ['akrasia', 'dot', 'defense', 'sequencing', 'condition'],
};

/**
 * The FALLEN card-advantage engine: pay blood, draw deep, and while Fallen
 * the debt matures into one card more.
 */
const theUsurersDue: Card = {
    id: 'the-usurers-due',
    theme: 'akrasia',
    name: "The Usurer's Due",
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'The debt matured while you were suffering. Collect it — the ' +
        'fallen are owed at a better rate.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: draw 2 (4.0) + mark i2 d2 (3.0) − RECOIL 4 credit (−1.0) = 6.0 +
    // FALLEN [draw 1 (2.0)] × 0.5 = 1.0 + FREE [self-mark i1 d1 (0.75) +
    // draw 1 (2.0)] = 2.75 → 9.75 → uncommon band 4.5-13 (Theorem). FREE
    // share 2.75/9.75 = 28.2% ✓ window. Condition line: FALLEN.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' }, drawCards: 1 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [
        { kind: 'rider', rider: { drawCards: 2 } },
        { kind: 'recoil', hp: 4 },
    ],
    fallen: { rider: { drawCards: 1 } },
    addedIn: '2026-07-18',
    tags: ['akrasia', 'condition'],
};

/**
 * The answered-wound engine (Frenzy's other trigger): a heavy bleed with a
 * direct drink of HEAL; if the enemy drew blood since your last turn, the
 * answer marks them and closes more of the wound.
 */
const drinkDeep: Card = {
    id: 'drink-deep',
    theme: 'akrasia',
    name: 'Drink Deep',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'They drew first. Drink to that — deeply, and from theirs.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: bleed i3 d2 (5.75) + heal 3 (1.0) − RECOIL 3 credit (−0.75) =
    // 6.0 + enemy-drew-blood rider [heal 4 (1.333) + mark i1 d2 (1.5)] ×
    // 0.5 = 1.417 + FREE [self-mark i1 d1 (0.75) + draw 1 (2.0)] = 2.75 →
    // 10.17 → uncommon band 4.5-13 (Theorem). FREE share 2.75/10.167 =
    // 27.0% ✓ window. Condition line: the state gate.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' }, drawCards: 1 },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 3, duration: 2 }],
    specialMechanics: [
        { kind: 'rider', rider: { healHp: 3 } },
        { kind: 'recoil', hp: 3 },
    ],
    synergy: {
        statePredicate: { kind: 'enemy-drew-blood' },
        rider: { healHp: 4, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } },
    },
    addedIn: '2026-07-18',
    tags: ['akrasia', 'dot', 'sequencing', 'condition'],
};

/**
 * The FALLEN amplifier mid: a full poison clock that lands one point
 * deeper while you are Fallen — gratitude as escalation. The accepted
 * wound is literal: a self-bleed that keeps the Fallen state fed (an
 * uncommon on-ramp, see the header pairing constraint).
 */
const theGladMartyr: Card = {
    id: 'the-glad-martyr',
    theme: 'akrasia',
    name: 'The Glad Martyr',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'The wound was accepted with thanks. Nothing unsettles an enemy ' +
        'like gratitude for the harm they do.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i2 d3 (tempo-weighted ≈ 19 HP ÷ 3 = 6.33) − self-bleed i1
    // d2 credit (0.75 × 1.0 = −0.75) = 5.58 + FALLEN [bonusIntensity 1
    // (1.5) + heal 3 (1.0)] × 0.5 = 1.25 + FREE [self-mark i1 d1 (0.75) +
    // heal 4 (1.333) + guard 3 (0.75)] = 2.83 → 9.66 → uncommon band
    // 4.5-13 (Theorem). FREE share 2.833/9.662 = 29.3% ✓ window. Condition
    // line: FALLEN.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' }, healHp: 4, guard: 3 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 2, duration: 3 },
        { effectId: 'debuff_bleed', appliedTo: 'self', intensity: 1, duration: 2 },
    ],
    fallen: { rider: { bonusIntensity: 1, healHp: 3 } },
    addedIn: '2026-07-18',
    tags: ['akrasia', 'dot', 'condition'],
};

/**
 * The absolution valve: the pool's one CLEANSE — pay down one debt, keep
 * the rest as collateral, and bill the confessor. Anti-FALLEN by design;
 * the Fallen guard fires off the state you held walking in.
 */
const absolutionOnAccount: Card = {
    id: 'absolution-on-account',
    theme: 'akrasia',
    name: 'Absolution on Account',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Forgiveness, financed. One sin struck from the record, the rest ' +
        'held as collateral.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: CLEANSE 1 (1.5) + heal 6 (2.0) + mark i2 d2 (3.0) = 6.5 +
    // FALLEN [guard 6 (1.5)] × 0.5 = 0.75 + FREE [self-mark i1 d1 (0.75) +
    // draw 1 (2.0)] = 2.75 → 10.00 → uncommon band 4.5-13 (Theorem). FREE
    // share 2.75/10.0 = 27.5% ✓ window. Condition line: FALLEN (checked at
    // play time, before the cleanse resolves).
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' }, drawCards: 1 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'rider', rider: { cleanse: 1, healHp: 6 } }],
    fallen: { rider: { guard: 6 } },
    addedIn: '2026-07-18',
    tags: ['akrasia', 'condition'],
};

/**
 * The FATE loan: a dead X die plays this card anyway — the printed rider
 * doubles the bleed, and 4 VITAE is the toll for the impossible face.
 */
const noPriceTooDear: Card = {
    id: 'no-price-too-dear',
    theme: 'akrasia',
    name: 'No Price Too Dear',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'The die shows nothing usable. Use it anyway — the difference is ' +
        'paid where the argument cannot feel it. You can.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: bleed i2 d1 (3.0) + mark i1 d2 (1.5) = 4.5 + fate [bleed i2 d1
    // (3.0)] × 0.7 = 2.1 − fate recoil 4 credit (−1.0) = +1.1 + FREE
    // [self-mark i1 d1 (0.75) + draw 1 (2.0)] = 2.75 → 8.35 → uncommon
    // band 4.5-13 (Theorem). FREE share 2.75/8.35 = 32.9% ✓ window.
    // Condition line: fate.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' }, drawCards: 1 },
    combatEffects: [
        { effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 1 },
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    fate: {
        rider: { applyEffect: { effectId: 'debuff_bleed', intensity: 2, duration: 1 } },
        recoilHp: 4,
    },
    addedIn: '2026-07-18',
    tags: ['akrasia', 'dot', 'condition'],
};

// ─── Rares (8) — finishers and build-arounds: the debt comes due ─────────────

/**
 * The chosen-X build-around (the-open-vein's bigger sibling): RECOIL X of
 * your choosing at a steeper exchange — POISON at ceil(X/2) intensity.
 * Probes whether a rare-grade X keeps the chosen-X distribution honest.
 */
const howMuchIsEnough: Card = {
    id: 'how-much-is-enough',
    theme: 'akrasia',
    name: 'How Much Is Enough',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Name the figure. The vein honors any sum; enough was never a ' +
        'number you believed in.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: RECOIL X (expected X ≈ 6, VERB_POINTS.expectedChosenX) → POISON
    // ceil(6/2) = i3 d4 (tempo-weighted ≈ 35.4 HP ÷ 3 = 11.81) − X credit
    // (6 × 1/3 × 0.75 = −1.5) = 10.31 + dieBonus match [heal 3 (1.0)] ×
    // 0.6 = 0.6 + FREE [self-mark i1 d1 (0.75) + draw 1 (2.0) + heal 3
    // (1.0) + guard 2 (0.5)] = 4.25 → 15.16 → rare band 7-19 (Axiom).
    // FREE share 4.25/15.159 = 28.0% ✓ window. Condition line: dieBonus.
    free: {
        applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' },
        drawCards: 1, healHp: 3, guard: 2,
    },
    specialMechanics: [{ kind: 'recoil_x', min: 2, poisonPerX: 1 / 2 }],
    dieBonus: { onColor: 'match', rider: { healHp: 3 } },
    addedIn: '2026-07-18',
    tags: ['akrasia', 'dot', 'chooseX', 'condition'],
};

/**
 * The FALLEN build-around: deep marks and deep draw, and while Fallen every
 * status this play lands arrives two points heavier — crown-of-thorns'
 * promise as a spell.
 */
const crownTheDebtor: Card = {
    id: 'crown-the-debtor',
    theme: 'akrasia',
    name: 'Crown the Debtor',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Owing everything, he outranks the solvent. The crown fits only a ' +
        'bowed head, and everything it touches lands heavier.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: mark i3 d2 (4.5) + draw 2 (4.0) − RECOIL 4 credit (−1.0) = 7.5 +
    // FALLEN [bonusIntensity 2 (3.0) + heal 4 (1.333)] × 0.5 = 2.167 +
    // FREE [self-mark i1 d1 (0.75) + heal 3 (1.0) + draw 1 (2.0)] = 3.75 →
    // 13.42 → rare band 7-19 (Axiom). FREE share 3.75/13.417 = 28.0% ✓
    // window. Condition line: FALLEN.
    free: {
        applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' },
        healHp: 3, drawCards: 1,
    },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 3, duration: 2 }],
    specialMechanics: [
        { kind: 'rider', rider: { drawCards: 2 } },
        { kind: 'recoil', hp: 4 },
    ],
    fallen: { rider: { bonusIntensity: 2, healHp: 4 } },
    addedIn: '2026-07-18',
    tags: ['akrasia', 'condition'],
};

/**
 * The defensive build-around: wall, salve, and a heavy bleed bought with
 * blood; an enemy that wrote in your ledger bleeds again and pays your
 * healer. The pool's rare defend seat.
 */
const ledgerOfScars: Card = {
    id: 'ledger-of-scars',
    theme: 'akrasia',
    name: 'Ledger of Scars',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Each scar is an entry; each entry earns. An enemy that writes in ' +
        'your ledger should read the terms first.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: GUARD 8 (2.0) + heal 6 (2.0) + bleed i3 d2 (5.75) − RECOIL 4
    // credit (−1.0) = 8.75 + enemy-drew-blood rider [bleed i2 d1 (3.0) +
    // heal 3 (1.0)] × 0.5 = 2.0 + FREE [guard 2 (0.5) + self-mark i1 d1
    // (0.75) + heal 3 (1.0) + draw 1 (2.0)] = 4.25 → 15.00 → rare band
    // 7-19 (Axiom). FREE share 4.25/15.0 = 28.3% ✓ window. Condition
    // line: the state gate.
    free: {
        guard: 2, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' },
        healHp: 3, drawCards: 1,
    },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 3, duration: 2 }],
    specialMechanics: [
        { kind: 'guard', amount: 8 },
        { kind: 'rider', rider: { healHp: 6 } },
        { kind: 'recoil', hp: 4 },
    ],
    synergy: {
        statePredicate: { kind: 'enemy-drew-blood' },
        rider: { applyEffect: { effectId: 'debuff_bleed', intensity: 2, duration: 1 }, healHp: 3 },
    },
    addedIn: '2026-07-18',
    tags: ['akrasia', 'dot', 'defense', 'condition'],
};

/**
 * The die-manipulation rare: a full poison clock at RECOIL 6, and the
 * powering die comes back refreshed and WILD — blood money spends anywhere.
 */
const uncleanTender: Card = {
    id: 'unclean-tender',
    theme: 'akrasia',
    name: 'Unclean Tender',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Coin with blood in the grain still spends. The die comes back ' +
        'changed — willing now, and unparticular.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: CONVERT (die returns refreshed as WILD, 2.5) + poison i2 d4
    // (tempo-weighted ≈ 23.6 HP ÷ 3 = 7.87) − RECOIL 6 credit (−1.5) =
    // 8.87 + FREE [self-mark i1 d1 (0.75) + heal 2 (0.667) + draw 1 (2.0)]
    // = 3.417 → 12.29 → rare band 7-19 (Axiom). FREE share 3.417/12.29 =
    // 27.8% ✓ window. Condition line: die-manipulation (CONVERT).
    free: {
        applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' },
        healHp: 2, drawCards: 1,
    },
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 2, duration: 4 }],
    specialMechanics: [
        { kind: 'convert_die_color' },
        { kind: 'recoil', hp: 6 },
    ],
    addedIn: '2026-07-18',
    tags: ['akrasia', 'dot', 'condition'],
};

/**
 * The all-in self-affliction build-around: book bleed AND poison on
 * yourself in one play (instantly deep-Fallen with the FREE seed), and the
 * verdict lands as deep marks, deep draw, and a Fallen amp.
 */
const theMartyrsArithmetic: Card = {
    id: 'the-martyrs-arithmetic',
    theme: 'akrasia',
    name: "The Martyr's Arithmetic",
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Sum the sufferings, carry the remainder. In this arithmetic the ' +
        'wounds are assets and the total is a verdict.',
    tier: 2, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    // pts: mark i3 d2 (4.5) + draw 2 (4.0) + heal 6 (2.0) − self-bleed i2
    // d2 credit (0.75 × 3.0 = −2.25) − self-poison i1 d2 credit (0.75 ×
    // 2.135 = −1.60) = 6.65 + FALLEN [bonusIntensity 2 (3.0)] × 0.5 = 1.5 +
    // FREE [self-mark i1 d1 (0.75) + heal 3 (1.0) + draw 1 (2.0)] = 3.75 →
    // 11.90 → rare band 7-19 (Aporia). FREE share 3.75/11.899 = 31.5% ✓
    // window. Condition line: FALLEN.
    free: {
        applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' },
        healHp: 3, drawCards: 1,
    },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 3, duration: 2 },
        { effectId: 'debuff_bleed', appliedTo: 'self', intensity: 2, duration: 2 },
        { effectId: 'debuff_poison', appliedTo: 'self', intensity: 1, duration: 2 },
    ],
    specialMechanics: [{ kind: 'rider', rider: { drawCards: 2, healHp: 6 } }],
    fallen: { rider: { bonusIntensity: 2 } },
    addedIn: '2026-07-18',
    tags: ['akrasia', 'condition'],
};

/**
 * THE finisher: RUPTURE everything at a quarter more force, drink half of
 * it back (SIPHON's honest pairing — a burst, not a clock), for the pool's
 * steepest toll. Deliberately NOT self-flagellant's detonator: the library
 * card settles at bonusPct 0.10 / RECOIL 5 — this probes the steep end of
 * the same curve (0.25 / RECOIL 7) plus the settlement drink. The fate
 * line lets a dead X die trigger settlement at a further blood price.
 */
const theLastRelapse: Card = {
    id: 'the-last-relapse',
    theme: 'akrasia',
    name: 'The Last Relapse',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'One more time, says the vice, and for once it is telling the ' +
        'truth. Everything owed detonates at settlement.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    // pts: RUPTURE ALL (4 + expected fuel 8, bonusPct 0.25 = +0.01 =
    // 12.01) + SIPHON 50% (2.0) − RECOIL 7 credit (−1.75) = 12.26 + fate
    // [heal 4 (1.333)] × 0.7 = 0.933 − fate recoil 3 credit (−0.75) =
    // +0.18 + FREE [self-mark i1 d1 (0.75) + heal 4 (1.333) + draw 1
    // (2.0) + guard 2 (0.5)] = 4.58 → 17.03 → rare band 7-19 (Aporia).
    // FREE share 4.583/17.026 = 26.9% ✓ window. Condition line: fate.
    free: {
        applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' },
        healHp: 4, drawCards: 1, guard: 2,
    },
    specialMechanics: [
        { kind: 'rupture', bonusPct: 0.25 },
        { kind: 'siphon', pct: 50 },
        { kind: 'recoil', hp: 7 },
    ],
    fate: { rider: { healHp: 4 }, recoilHp: 3 },
    addedIn: '2026-07-18',
    tags: ['akrasia', 'payoff', 'condition'],
};

/**
 * The redemption finisher: the pool's heaviest poison bought with blood,
 * and while Fallen the lesson concludes — one debt cleansed, a card, and
 * the wound partly closed. FALLEN cashed, then deliberately walked back.
 */
const theWoundThatTeaches: Card = {
    id: 'the-wound-that-teaches',
    theme: 'akrasia',
    name: 'The Wound That Teaches',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Pain is the one tutor that refunds nothing and is owed attendance ' +
        'anyway. Class concludes; the lesson stands up whole.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i3 d3 (tempo-weighted ≈ 28.5 HP ÷ 3 = 9.49) − RECOIL 5
    // credit (−1.25) = 8.24 + FALLEN [cleanse 1 (1.5) + draw 1 (2.0) +
    // heal 4 (1.333)] × 0.5 = 2.417 + FREE [self-mark i1 d1 (0.75) + draw
    // 1 (2.0) + heal 2 (0.667) + guard 2 (0.5)] = 3.92 → 14.58 → rare
    // band 7-19 (Aporia). FREE share 3.917/14.577 = 26.9% ✓ window.
    // Condition line: FALLEN.
    free: {
        applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' },
        drawCards: 1, healHp: 2, guard: 2,
    },
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 3, duration: 3 }],
    specialMechanics: [{ kind: 'recoil', hp: 5 }],
    fallen: { rider: { cleanse: 1, drawCards: 1, healHp: 4 } },
    addedIn: '2026-07-18',
    tags: ['akrasia', 'dot', 'condition'],
};

/**
 * The MARK-cash closer: every mark on the foe converts to 4 HP at once
 * (the family's own payoff class — RUPTURE-of-MARKS, held at the sibling
 * per-stack ceiling: this pool's commons bank battle-long marks at i2-i3,
 * so realized stacks in a mark-battery recipe already run well above the
 * expected-2 pricing convention), over a fast bleed, for a heavy flat
 * RECOIL. Fallen pays the estate back.
 */
const everyMarkComesDue: Card = {
    id: 'every-mark-comes-due',
    theme: 'akrasia',
    name: 'Every Mark Comes Due',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'The marks were never decoration. They were promissory — and today ' +
        'the ledger closes in one payment.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    // pts: ruptureMarks 4 (consume ALL enemy MARK stacks, 4 HP each: 4 ×
    // 2/3 = 2.67) + bleed i3 d1 (calendar-cut lifetime 15 HP ÷ 3 = 5.0) −
    // RECOIL 6 credit (−1.5) = 6.17 + FALLEN [heal 6 (2.0) + draw 1 (2.0)]
    // × 0.5 = 2.0 + FREE [self-mark i1 d1 (0.75) + heal 3 (1.0) + draw 1
    // (2.0)] = 3.75 → 11.92 → rare band 7-19 (Aporia). FREE share
    // 3.75/11.917 = 31.5% ✓ window. Condition line: FALLEN.
    free: {
        applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' },
        healHp: 3, drawCards: 1,
    },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 3, duration: 1 }],
    specialMechanics: [
        { kind: 'rider', rider: { ruptureMarks: 4 } },
        { kind: 'recoil', hp: 6 },
    ],
    fallen: { rider: { healHp: 6, drawCards: 1 } },
    addedIn: '2026-07-18',
    tags: ['akrasia', 'dot', 'payoff', 'condition'],
};

// ─── The set ─────────────────────────────────────────────────────────────────

export const SWAP_POOL_AKRASIA: SandboxCardSet = {
    id: 'swap-akrasia',
    name: 'Swap pool: akrasia',
    description:
        'Thirty new akrasia spells probing the penitent preset\'s swap '
        + 'seats: blood-priced commons simple enough for the x4 slots (with '
        + 'live bleed/poison lines and two defend seats), a FALLEN/RECOIL '
        + 'engine across the uncommons (state gates, thresholds, the fate '
        + 'loan, one BANK and one CONVERT die line), and payoff-class rares '
        + 'that cash marks, afflictions, and a chosen-X vein. All 30 speak '
        + 'only RECOIL/FALLEN/MARK/HEAL plus the utility verbs the theme\'s '
        + 'seven library cards already lean on — no new keywords.',
    cards: [
        // commons (10)
        smallVice, theFirstCut, beggarsBandage, countTheCost, theOldHabit,
        saltTheWound, borrowedStrength, venomOnCredit, scourgeAndPsalm,
        flinchAndSwing,
        // uncommons (12)
        theHairShirt, goodBloodAfterBad, mortifyTheFlesh, gildTheGuilt,
        theBodyRemembers, relapse, theMorningsResolve, theUsurersDue,
        drinkDeep, theGladMartyr, absolutionOnAccount, noPriceTooDear,
        // rares (8)
        howMuchIsEnough, crownTheDebtor, ledgerOfScars, uncleanTender,
        theMartyrsArithmetic, theLastRelapse, theWoundThatTeaches,
        everyMarkComesDue,
    ],
};
