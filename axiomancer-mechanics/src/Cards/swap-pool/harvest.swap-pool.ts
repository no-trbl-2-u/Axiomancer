/**
 * Harvest swap pool — 30 NEW sandbox spells for the `tithe` preset
 * (owner-ratified 2026-07-18: per-theme swap pools feed `/deck-tuning`'s
 * 15-card recipe swaps ONLY — never player-facing, never preset-resident,
 * never in `cards.library.ts`).
 *
 * Vocabulary law: harvest's family (SOUL, REAP, MARK) plus the generic
 * utility verbs the live harvest seven already lean on (short-fuse BLEED
 * seeds, GUARD, HEAL, DRAW, KINDLE-via-REAP, die valves). TICK is dead
 * registry-wide (keyword-atlas row, owner-ratified 2026-07-10) — FREE
 * lines deposit Souls and seeds instead, matching winnowing/the-reaping's
 * phase-30 recut. No neighbor hallmarks, no new mechanics kinds.
 *
 * Die-interaction law: every tier-2 card carries exactly ONE of
 * threshold / dieBonus / fate / die-manipulation / react — the react slot
 * is the WS4.2 `synergy.statePredicate` line, per the tier-2 sandbox
 * precedent (the-unmoved-mover, coda, wages-of-weakness). Die-GRANTING
 * (a reap-KINDLE) is exempt from the count — it adds a die rather than
 * touching one, per the-gleaners-due's library precedent — but no card in
 * this pool pairs a kindle with a second die line anyway.
 *
 * Pricing: every card ships its `// pts:` arithmetic (cards.pricing.ts
 * coefficients); FREE lines hold 25-35% of the total. Bands: common
 * 1.5-7.5 · uncommon 4.5-13 · rare 7-19.
 */

import type { Card } from '../types';
import type { SandboxCardSet } from '../cards.sandbox-sets';

// ─── COMMONS (10 — the ×4 seats: simple, reliable, always live) ──────────────

/** The x4-seat TRADE against brief-candle: a smaller flame, a fatter drip —
 *  the seat A/B is fuel (the resident's i2 Bleed) vs mint (this card's
 *  Souls). The i1 seed washes out next round into one more Soul via the
 *  expiry hook; neither card dominates the other. */
const tallowAndWick: Card = {
    id: 'tallow-and-wick',
    theme: 'harvest',
    name: 'Tallow and Wick',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'The candle is not the point. The point is what drips off it while '
        + 'it burns, and who is holding the plate underneath.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: bleed i1 d1 seed (damage-instance clock: 3 HP ÷ 3 = 1.0) +
    // SOUL 3 (2.25) = 3.25 + FREE [souls 1 (0.75) + heal 2 (0.67)] = 1.42
    // → 4.67 → common band 1.5-7.5 (Doxa). FREE share 30.4%. Less DoT than
    // brief-candle, more mint — a shape A/B, not a number A/B.
    free: { souls: 1, healHp: 2 },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 1, duration: 1 }],
    specialMechanics: [{ kind: 'soul_gain', count: 3 }],
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'dot'],
};

/** The heavier common DoT: a three-stack, one-turn Bleed — all the fuel up
 *  front, all the expiry churn next round. The Lemma-grade x4 candidate. */
const chaffFire: Card = {
    id: 'chaff-fire',
    theme: 'harvest',
    name: 'Chaff Fire',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Straw burns hot and is gone before the smoke settles. Nothing '
        + 'wasted: even the going-out is owed to someone.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: bleed i3 d1 (damage-instance clock: 9+6 = 15 HP ÷ 3 = 5.0) = 5.0
    // + FREE [souls 1 (0.75) + heal 3 (1.0)] = 1.75 → 6.75 → common band
    // 1.5-7.5 (Lemma). FREE share 25.9%.
    free: { souls: 1, healHp: 3 },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 3, duration: 1 }],
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'dot'],
};

/** The MARK common: a standing two-stack Mark plus a Soul, with a mind-die
 *  nicety — the simple amplify-then-harvest opener. */
const gleaningHands: Card = {
    id: 'gleaning-hands',
    theme: 'harvest',
    name: 'Gleaning Hands',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'After the reapers pass, the field still owes. Bare hands, bent '
        + 'back, and every dropped grain accounted against them.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: mark i2 d2 (0.75 × 2 × 2 = 3.0) + SOUL 1 (0.75) = 3.75 + dieBonus
    // mind [souls 1 (0.75)] × 0.6 = 0.45 + FREE [souls 1 (0.75) + heal 2
    // (0.67)] = 1.42 → 5.62 → common band 1.5-7.5 (Doxa). FREE share 25.2%.
    free: { souls: 1, healHp: 2 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'soul_gain', count: 1 }],
    dieBonus: { onColor: 'mind', rider: { souls: 1 } },
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool'],
};

/** The plain defend common — the tithe deck's missing wall. Guard in
 *  harvest colors: the hedge stands, and standing is also owed. */
const hedgeOfSheaves: Card = {
    id: 'hedge-of-sheaves',
    theme: 'harvest',
    name: 'Hedge of Sheaves',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Stack the cut grain high enough and it stops arrows. The dead '
        + 'harvest, still working.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: GUARD 8 (8 ÷ 4 = 2.0) + SOUL 1 (0.75) = 2.75 + FREE guard 4
    // (1.0) → 3.75 → common band 1.5-7.5 (Doxa). FREE share 26.7%.
    free: { guard: 4 },
    specialMechanics: [{ kind: 'guard', amount: 8 }, { kind: 'soul_gain', count: 1 }],
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'defense'],
};

/** Defend + churn in one: modest Guard, a light standing Mark, a Soul —
 *  the common that keeps the engine fed while holding the line. */
const threshingFloor: Card = {
    id: 'threshing-floor',
    theme: 'harvest',
    name: 'Threshing Floor',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Everything that lands here gets beaten until the useful part '
        + 'falls off. That includes what they throw at you.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: GUARD 6 (1.5) + mark i1 d2 (0.75 × 1 × 2 = 1.5) + SOUL 1 (0.75)
    // = 3.75 + FREE [guard 3 (0.75) + souls 1 (0.75)] = 1.5 → 5.25 →
    // common band 1.5-7.5 (Lemma). FREE share 28.6%.
    free: { guard: 3, souls: 1 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    specialMechanics: [{ kind: 'guard', amount: 6 }, { kind: 'soul_gain', count: 1 }],
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'defense'],
};

/** The sustain common: heal plus a two-Soul mint. Mercy, in the harvest
 *  register — what is spared is only deferred. */
const whatIsSpared: Card = {
    id: 'what-is-spared',
    theme: 'harvest',
    name: 'What Is Spared',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'Be thankful for what is spared. The field is not: everything '
        + 'spared is merely rescheduled.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: HEAL 6 (6 ÷ 3 = 2.0) + SOUL 2 (1.5) = 3.5 + FREE [heal 3 (1.0)
    // + souls 1 (0.75)] = 1.75 → 5.25 → common band 1.5-7.5 (Doxa).
    // FREE share 33.3%.
    free: { healHp: 3, souls: 1 },
    specialMechanics: [{ kind: 'rider', rider: { healHp: 6 } }, { kind: 'soul_gain', count: 2 }],
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'sustain'],
};

/** The draw-glue common: a card, a short Mark, a Soul — cheap cycle that
 *  keeps the reap payoffs arriving on schedule. */
const whatTheMiceLeave: Card = {
    id: 'what-the-mice-leave',
    theme: 'harvest',
    name: 'What the Mice Leave',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'Granary arithmetic: whatever is missing was eaten, and whatever '
        + 'remains is evidence. Both are useful.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: draw 1 (2.0) + mark i1 d1 (0.75) + SOUL 1 (0.75) = 3.5 + FREE
    // souls 2 (1.5) → 5.0 → common band 1.5-7.5 (Lemma). FREE share 30.0%.
    free: { souls: 2 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 1 }],
    specialMechanics: [{ kind: 'rider', rider: { drawCards: 1 } }, { kind: 'soul_gain', count: 1 }],
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'draw'],
};

/** A short heavy Mark — three stacks, one turn: amplifies this round's
 *  ticks hard, then expires straight into the Soul hook. */
const waxAndWane: Card = {
    id: 'wax-and-wane',
    theme: 'harvest',
    name: 'Wax and Wane',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'A moon that fills in an evening and is gone by the bell. Brief '
        + 'things weigh more per hour.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: mark i3 d1 (0.75 × 3 × 1 = 2.25) + SOUL 1 (0.75) = 3.0 + FREE
    // [souls 1 (0.75) + guard 2 (0.5)] = 1.25 → 4.25 → common band 1.5-7.5
    // (Lemma). FREE share 29.4%.
    free: { souls: 1, guard: 2 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 3, duration: 1 }],
    specialMechanics: [{ kind: 'soul_gain', count: 1 }],
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool'],
};

/** The graceful small spender (the Dawncaster Reave/Soulsearch lesson:
 *  common spenders ride an always-live base line and degrade, never
 *  fizzle the whole card). Guard + heal always land; REAP 2 is gravy. */
const widowsPortion: Card = {
    id: 'widows-portion',
    theme: 'harvest',
    name: "Widow's Portion",
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'The estate pays out smallest to those who need it most. Take the '
        + 'portion anyway; the ledger remembers who shorted whom.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: GUARD 4 (1.0) + heal 4 (1.33) = 2.33 + REAP 2 [draw 1 (2.0) +
    // heal 2 (0.67)] − soul cost 2 × 0.75 × 0.75 (−1.125) = 1.54 → 3.87 +
    // FREE [souls 1 (0.75) + heal 2 (0.67)] = 1.42 → 5.29 → common band
    // 1.5-7.5 (Lemma). FREE share 26.8%. Base line lives with an empty bank.
    free: { souls: 1, healHp: 2 },
    specialMechanics: [
        { kind: 'guard', amount: 4 },
        { kind: 'rider', rider: { healHp: 4 } },
        { kind: 'reap', cost: 2, rider: { drawCards: 1, healHp: 2 } },
    ],
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'defense', 'sustain'],
};

/** The cheapest mint: a short Mark and two Souls — the Doxa that exists
 *  purely to keep the bank filling on off turns. */
const rustOnTheScythe: Card = {
    id: 'rust-on-the-scythe',
    theme: 'harvest',
    name: 'Rust on the Scythe',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'The blade dulls between seasons. It still owes a harvest, and '
        + 'rust has never once excused a debt.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: mark i2 d1 (0.75 × 2 × 1 = 1.5) + SOUL 2 (1.5) = 3.0 + FREE
    // souls 2 (1.5) → 4.5 → common band 1.5-7.5 (Doxa). FREE share 33.3%.
    free: { souls: 2 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 1 }],
    specialMechanics: [{ kind: 'soul_gain', count: 2 }],
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool'],
};

// ─── UNCOMMONS (12 — the engine seats: consume, reap, churn, condition) ──────

/** The consume RE-SHAPED against winnowing: one account called in for a
 *  Soul AND a card — the resident trades the affliction for bank, this
 *  trades it for tempo (a genuinely different engine rhythm, not a richer
 *  copy). FREE resows the field; the body-die nicety is its one die line. */
const sickleTurn: Card = {
    id: 'sickle-turn',
    theme: 'harvest',
    name: 'Sickle Turn',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'One clean arc: what was ripening is suddenly ripe, and what was '
        + 'owed is suddenly collected. The wrist does the arguing.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: consume_affliction (5.5) + 1 Soul yield (0.75) + draw 1 (2.0) =
    // 8.25 + dieBonus body [souls 1 (0.75)] × 0.6 = 0.45 + FREE bleed-seed
    // i2 d1 (9 HP ÷ 3 = 3.0) → 11.70 → uncommon band 4.5-13 (Theorem).
    // FREE share 25.6%.
    free: { applyEffect: { effectId: 'debuff_bleed', intensity: 2, duration: 1 } },
    specialMechanics: [
        { kind: 'consume_affliction', souls: 1 },
        { kind: 'rider', rider: { drawCards: 1 } },
    ],
    dieBonus: { onColor: 'body', rider: { souls: 1 } },
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'payoff', 'draw'],
};

/** The pure bank-builder: three Souls, a card, and the powering die back —
 *  tempo the tithe deck currently buys from echo borrows. */
const titheLedger: Card = {
    id: 'tithe-ledger',
    theme: 'harvest',
    name: 'Tithe Ledger',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'Every tenth sheaf, every tenth breath. The book does not care '
        + 'what you meant to keep.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: SOUL 3 (2.25) + draw 1 (2.0) + REFRESH the powering die (2.0)
    // = 6.25 + FREE [souls 2 (1.5) + heal 2 (0.67)] = 2.17 → 8.42 →
    // uncommon band 4.5-13 (Thesis). FREE share 25.7%.
    free: { souls: 2, healHp: 2 },
    specialMechanics: [
        { kind: 'soul_gain', count: 3 },
        { kind: 'rider', rider: { drawCards: 1 } },
        { kind: 'refresh_die' },
    ],
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'engine'],
};

/** The Mark churner: standing Marks amplify every tick and payoff, then
 *  expire into Souls; the reroll valve keeps the miss-heavy tray honest. */
const cropRotation: Card = {
    id: 'crop-rotation',
    theme: 'harvest',
    name: 'Crop Rotation',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'Change what grows in them and the same acres pay twice. Fields '
        + 'and grudges are managed identically.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: mark i2 d2 (3.0) + SOUL 2 (1.5) + REROLL miss faces (2.0) = 6.5
    // + FREE [souls 1 (0.75) + mark-seed i1 d2 (1.5)] = 2.25 → 8.75 →
    // uncommon band 4.5-13 (Thesis). FREE share 25.7%.
    free: { souls: 1, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'soul_gain', count: 2 }, { kind: 'reroll_spent' }],
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'engine'],
};

/** The big sow: a three-stack Bleed over two rounds — slower than chaff,
 *  twice the fuel for winnowing-class consumes. X-die fate line pays Souls
 *  for blood. */
const seedInTheFurrow: Card = {
    id: 'seed-in-the-furrow',
    theme: 'harvest',
    name: 'Seed in the Furrow',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Buried now, collected later, with interest the soil never agreed '
        + 'to. Planting is just patient wounding.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: bleed i3 d2 (damage-instance clock, decay + tempo: 9+6 + 2.25 =
    // 17.25 HP ÷ 3 = 5.75) + SOUL 1 (0.75) = 6.5 + FATE X-die [souls 2
    // (1.5)] × 0.7 − recoil 2 × ⅓ × 0.75 (−0.5) = 0.55 + FREE bleed-seed
    // i2 d1 (3.0) → 10.05 → uncommon band 4.5-13 (Theorem). FREE share 29.9%.
    free: { applyEffect: { effectId: 'debuff_bleed', intensity: 2, duration: 1 } },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 3, duration: 2 }],
    specialMechanics: [{ kind: 'soul_gain', count: 1 }],
    fate: { rider: { souls: 2 }, recoilHp: 2 },
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'dot'],
};

/** The react defend: Guard plus Souls, and if the enemy drew no blood last
 *  round the watch pays a card and two more Souls — defense that mints. */
const gravesideWatch: Card = {
    id: 'graveside-watch',
    theme: 'harvest',
    name: 'Graveside Watch',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Sit with the dead long enough and the living learn to wait. '
        + 'Nothing crossed the fence last night; the fence is owed for that.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: GUARD 8 (2.0) + SOUL 2 (1.5) = 3.5 + react [enemy dealt no
    // damage last round: draw 1 (2.0) + souls 2 (1.5)] × 0.5 = 1.75 + FREE
    // [guard 4 (1.0) + souls 2 (1.5)] = 2.5 → 7.75 → uncommon band 4.5-13
    // (Thesis). FREE share 32.3%.
    free: { guard: 4, souls: 2 },
    specialMechanics: [{ kind: 'guard', amount: 8 }, { kind: 'soul_gain', count: 2 }],
    synergy: {
        statePredicate: { kind: 'enemy-dealt-no-damage-last-round' },
        rider: { drawCards: 1, souls: 2 },
    },
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'defense', 'condition'],
};

/** The after-blood react: when they have hurt you, the lean season pays
 *  back in Souls and flesh — harvest's answer to akrasia's wages shape,
 *  paid from the enemy's aggression rather than your own veins. */
const theLeanSeason: Card = {
    id: 'the-lean-season',
    theme: 'harvest',
    name: 'The Lean Season',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'A thin year teaches exact bookkeeping. Every blow they landed is '
        + 'an entry, and entries are collected in any weather.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: heal 6 (2.0) + SOUL 2 (1.5) + mark i2 d2 (3.0) = 6.5 + react
    // [enemy drew blood: souls 2 (1.5) + heal 3 (1.0)] × 0.5 = 1.25 + FREE
    // [heal 4 (1.33) + souls 2 (1.5)] = 2.83 → 10.58 → uncommon band
    // 4.5-13 (Theorem). FREE share 26.8%.
    free: { healHp: 4, souls: 2 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'rider', rider: { healHp: 6 } }, { kind: 'soul_gain', count: 2 }],
    synergy: {
        statePredicate: { kind: 'enemy-drew-blood' },
        rider: { souls: 2, healHp: 3 },
    },
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'sustain', 'condition'],
};

/** The draw engine with a graceful spend (Soulsearch shape at uncommon
 *  size): a card always, two more for two Souls, the die banked to ripen.
 *  (Renamed from glean-the-field — the pool already ships gleaning-hands
 *  beside library the-gleaners-due; three glean titles would blur.) */
const walkTheRowsTwice: Card = {
    id: 'walk-the-rows-twice',
    theme: 'harvest',
    name: 'Walk the Rows Twice',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'Walk the rows twice. The first pass takes what is offered; the '
        + 'second takes what was hidden, which is always more.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts: draw 1 (2.0) + REAP 2 [draw 2 (4.0)] − soul cost 2 × 0.75 × 0.75
    // (−1.125) = 2.875 + BANK the powering die (2.0) = 6.875 + FREE
    // [souls 2 (1.5) + heal 3 (1.0)] = 2.5 → 9.38 → uncommon band 4.5-13
    // (Theorem). FREE share 26.7%. Base draw lives with an empty bank.
    free: { souls: 2, healHp: 3 },
    specialMechanics: [
        { kind: 'rider', rider: { drawCards: 1 } },
        { kind: 'reap', cost: 2, rider: { drawCards: 2 } },
        { kind: 'bank_spent_die' },
    ],
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'draw', 'engine'],
};

/** Consume-then-resow: call in one account now, and a spent-body threshold
 *  replants the Bleed the consume just ate — the flywheel in one card. */
const rotInTheGranary: Card = {
    id: 'rot-in-the-granary',
    theme: 'harvest',
    name: 'Rot in the Granary',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'One spoiled sack is never one spoiled sack. Open it, charge it to '
        + 'their account, and watch the spore take the next shelf.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: consume_affliction (5.5) + 1 Soul yield (0.75) = 6.25 +
    // threshold body 2 [bleed-seed i2 d1 (3.0)] × 0.5 = 1.5 + FREE
    // bleed-seed i2 d1 (3.0) → 10.75 → uncommon band 4.5-13 (Theorem).
    // FREE share 27.9%.
    free: { applyEffect: { effectId: 'debuff_bleed', intensity: 2, duration: 1 } },
    specialMechanics: [{ kind: 'consume_affliction', souls: 1 }],
    threshold: {
        color: 'body', count: 2,
        rider: { applyEffect: { effectId: 'debuff_bleed', intensity: 2, duration: 1 } },
    },
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'payoff', 'dot'],
};

/** The defensive spender: three Souls buy a wall and a mended wound — the
 *  bank as armor, with a wild-die convert to keep the tray flexible. */
const barterOfBone: Card = {
    id: 'barter-of-bone',
    theme: 'harvest',
    name: 'Barter of Bone',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'Everything sells, given the right market. Today the dead buy back '
        + 'the living, at a fair price, twice witnessed.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: REAP 3 [guard 12 (3.0) + heal 3 (1.0)] − soul cost 3 × 0.75 ×
    // 0.75 (−1.6875) = 2.31 + SOUL 1 (0.75) = 3.06 + CONVERT the die to
    // wild (2.5) = 5.56 + FREE [guard 4 (1.0) + souls 2 (1.5)] = 2.5 →
    // 8.06 → uncommon band 4.5-13 (Thesis). FREE share 31.0%.
    free: { guard: 4, souls: 2 },
    specialMechanics: [
        { kind: 'reap', cost: 3, rider: { guard: 12, healHp: 3 } },
        { kind: 'soul_gain', count: 1 },
        { kind: 'convert_die_color' },
    ],
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'defense', 'engine'],
};

/** The heavy-Mark line: three stacks for two rounds — every tick and
 *  payoff lands harder — with a mind threshold paying the count forward. */
const theQuietArithmetic: Card = {
    id: 'the-quiet-arithmetic',
    theme: 'harvest',
    name: 'The Quiet Arithmetic',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'No sermon, no scythe raised. Only a column of figures growing at '
        + 'their name, and figures are patient.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: mark i3 d2 (0.75 × 3 × 2 = 4.5) + SOUL 1 (0.75) = 5.25 +
    // threshold mind 3 [souls 2 (1.5) + draw 1 (2.0)] × 0.5 = 1.75 + FREE
    // [souls 2 (1.5) + mark-seed i1 d2 (1.5)] = 3.0 → 10.0 → uncommon band
    // 4.5-13 (Theorem). FREE share 30.0%.
    free: { souls: 2, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 3, duration: 2 }],
    specialMechanics: [{ kind: 'soul_gain', count: 1 }],
    threshold: { color: 'mind', count: 3, rider: { souls: 2, drawCards: 1 } },
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'engine'],
};

/** The mid spender: three Souls buy a fast heavy Bleed plus flesh — REAP
 *  as reinvestment, cashing bank back into churn instead of burst. */
const feastOfAshes: Card = {
    id: 'feast-of-ashes',
    theme: 'harvest',
    name: 'Feast of Ashes',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'What burned still feeds, if you are not particular. Serve them '
        + 'their own field, course by course.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: REAP 3 [bleed-seed i3 d1 (15 HP ÷ 3 = 5.0) + heal 3 (1.0)] −
    // soul cost 3 × 0.75 × 0.75 (−1.6875) = 4.31 + SOUL 1 (0.75) = 5.06 +
    // REFRESH the powering die (2.0) = 7.06 + FREE [souls 2 (1.5) +
    // bleed-seed i1 d1 (1.0)] = 2.5 → 9.56 → uncommon band 4.5-13
    // (Theorem). FREE share 26.1%.
    free: { souls: 2, applyEffect: { effectId: 'debuff_bleed', intensity: 1, duration: 1 } },
    specialMechanics: [
        { kind: 'reap', cost: 3, rider: { applyEffect: { effectId: 'debuff_bleed', intensity: 3, duration: 1 }, healHp: 3 } },
        { kind: 'soul_gain', count: 1 },
        { kind: 'refresh_die' },
    ],
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'dot', 'engine'],
};

/** The finale react: play it as the hand empties and the day's count pays
 *  out — Souls and mending for closing the books on time. */
const countingTheSheaves: Card = {
    id: 'counting-the-sheaves',
    theme: 'harvest',
    name: 'Counting the Sheaves',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'The tally happens at dusk, not at noon. Whoever counts last '
        + 'counts correctly.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: SOUL 2 (1.5) + GUARD 6 (1.5) = 3.0 + react [finale ≤2 left:
    // souls 3 (2.25) + heal 3 (1.0)] × 0.5 = 1.625 + FREE [souls 1 (0.75)
    // + guard 4 (1.0)] = 1.75 → 6.38 → uncommon band 4.5-13 (Thesis).
    // FREE share 27.5%.
    free: { souls: 1, guard: 4 },
    specialMechanics: [{ kind: 'soul_gain', count: 2 }, { kind: 'guard', amount: 6 }],
    synergy: {
        statePredicate: { kind: 'finale', cardsLeftAtMost: 2 },
        rider: { souls: 3, healHp: 3 },
    },
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'condition'],
};

// ─── RARES (8 — finishers and build-arounds for the R-spell seat) ────────────

/** The alternate REAP-ALL finisher: a smaller blade than the-reaping (3
 *  per Soul, not 4) that resharpens itself AFTER the swing — two Souls
 *  minted post-spend toward the NEXT harvest, three more on a spent-body
 *  threshold. A/Bs the R seat. */
const theSecondScythe: Card = {
    id: 'the-second-scythe',
    theme: 'harvest',
    name: 'The Second Scythe',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'The first scythe takes the field. The second takes whatever '
        + 'thought itself exempt.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: REAP ALL at 3/Soul (5 + 3 × 4 ÷ 3 = 9.0) + SOUL 2 minted after
    // (1.5) = 10.5 + threshold body 3 [souls 3 (2.25)] × 0.5 = 1.125 + FREE
    // [bleed-seed i2 d1 (3.0) + souls 2 (1.5)] = 4.5 → 16.13 → rare band
    // 7-19 (Axiom). FREE share 27.9%. Mechanics resolve in ARRAY ORDER
    // (combat.engine.ts mech loop), so the spend fires FIRST and the mint
    // never feeds its own swing — on a clean board with an empty bank the
    // PAID play is silence, per the a-sweeter-poison plant-after-closer
    // precedent (cards.sandbox-sets.ts) and the engine's doctrine witness
    // ("a PAID line must not chip a clean enemy"). Threshold Souls land in
    // the rider pass, also post-swing.
    free: { applyEffect: { effectId: 'debuff_bleed', intensity: 2, duration: 1 }, souls: 2 },
    specialMechanics: [
        { kind: 'reap_all', burstPerSoul: 3 },
        { kind: 'soul_gain', count: 2 },
    ],
    threshold: { color: 'body', count: 3, rider: { souls: 3 } },
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'payoff', 'finisher'],
};

/** The Soul-bank build-around: the wain comes home loaded — Souls and
 *  cards, and a mind die counts one more sack in. Pure engine, no burst,
 *  and NO die-bank verb (that valve is bank-the-yield's library identity —
 *  this rare leans fully into draw instead): it exists to test whether
 *  tithe's late wall is a bank-size problem. */
const harvestHome: Card = {
    id: 'harvest-home',
    theme: 'harvest',
    name: 'Harvest Home',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'The last wagon in under the last light, and the whole year '
        + 'suddenly countable. Tonight the granary is an argument no one '
        + 'can lose.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'self',
    // pts: SOUL 3 (2.25) + draw 2 (4.0) = 6.25 + dieBonus mind [draw 1
    // (2.0)] × 0.6 = 1.2 + FREE [souls 2 (1.5) + draw 1 (2.0)] = 3.5 →
    // 10.95 → rare band 7-19 (Axiom). FREE share 32.0%.
    free: { souls: 2, drawCards: 1 },
    specialMechanics: [
        { kind: 'soul_gain', count: 3 },
        { kind: 'rider', rider: { drawCards: 2 } },
    ],
    dieBonus: { onColor: 'mind', rider: { drawCards: 1 } },
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'engine', 'draw', 'build-around'],
};

/** The double consume: two accounts called in at full term in one motion
 *  (the-long-ledger's compression at rare size, WITH the Soul yield the
 *  ledger traded away). Needs a stocked board; pays the whole cycle. */
const allFleshIsGrass: Card = {
    id: 'all-flesh-is-grass',
    theme: 'harvest',
    name: 'All Flesh Is Grass',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'The field does not distinguish. Everything standing is a crop; '
        + 'the only open question is the date of the cutting.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    // pts: consume_affliction ×2 with 1 Soul yield each (2 × [5.5 + 0.75]
    // = 12.5) + dieBonus body [souls 2 (1.5)] × 0.6 = 0.9 + FREE
    // [bleed-seed i2 d1 (3.0) + souls 2 (1.5)] = 4.5 → 17.9 → rare band
    // 7-19 (Aporia). FREE share 25.1%.
    free: { applyEffect: { effectId: 'debuff_bleed', intensity: 2, duration: 1 }, souls: 2 },
    specialMechanics: [
        { kind: 'consume_affliction', souls: 1 },
        { kind: 'consume_affliction', souls: 1 },
    ],
    dieBonus: { onColor: 'body', rider: { souls: 2 } },
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'payoff', 'finisher'],
};

/** The Mark build-around: a heavy standing Mark, a fat mint, and a mind
 *  threshold that stacks the count higher — every later tick and payoff
 *  in the fight lands harder. */
const aTitheOfTeeth: Card = {
    id: 'a-tithe-of-teeth',
    theme: 'harvest',
    name: 'A Tithe of Teeth',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'The church takes grain. The field takes bone. Neither issues '
        + 'receipts, and neither has ever been short at audit.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: mark i3 d2 (4.5) + SOUL 3 (2.25) + draw 1 (2.0) = 8.75 +
    // threshold mind 3 [mark-seed i2 d2 (3.0)] × 0.5 = 1.5 + FREE [souls 2
    // (1.5) + mark-seed i2 d2 (3.0)] = 4.5 → 14.75 → rare band 7-19
    // (Axiom). FREE share 30.5%.
    free: { souls: 2, applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 2 } },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 3, duration: 2 }],
    specialMechanics: [{ kind: 'soul_gain', count: 3 }, { kind: 'rider', rider: { drawCards: 1 } }],
    threshold: { color: 'mind', count: 3, rider: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 2 } } },
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'engine', 'build-around'],
};

/** The condition rare: a stores-and-walls card whose finale line pays the
 *  winter through — biggest react rider in the pool, gated on closing the
 *  hand. Probes whether tithe wants a defensive rare seat at all. */
const winterCount: Card = {
    id: 'winter-count',
    theme: 'harvest',
    name: 'Winter Count',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'The year is written on the hide in one spare line. What survived, '
        + 'survived because it was counted; the count is the shelter.',
    tier: 2, rank: 6, cardType: 'spell',
    targetType: 'self',
    // pts: SOUL 3 (2.25) + GUARD 12 (3.0) + heal 6 (2.0) = 7.25 + react
    // [finale ≤2 left: souls 3 (2.25) + draw 2 (4.0) + heal 4 (1.33)] ×
    // 0.5 = 3.79 + FREE [souls 2 (1.5) + guard 6 (1.5) + heal 3 (1.0)] =
    // 4.0 → 15.04 → rare band 7-19 (Aporia). FREE share 26.6%.
    free: { souls: 2, guard: 6, healHp: 3 },
    specialMechanics: [
        { kind: 'soul_gain', count: 3 },
        { kind: 'guard', amount: 12 },
        { kind: 'rider', rider: { healHp: 6 } },
    ],
    synergy: {
        statePredicate: { kind: 'finale', cardsLeftAtMost: 2 },
        rider: { souls: 3, drawCards: 2, healHp: 4 },
    },
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'defense', 'condition', 'build-around'],
};

/** The deep spender: four Souls buy the whole reliquary — cards, a fast
 *  heavy Bleed, flesh, two Souls pressed back into the box, and a wild die
 *  hammered out of the leavings. The build-around that asks the bank to be
 *  FULL, then rebuilds the churn. The reap-KINDLE is its only die line,
 *  matching the-gleaners-due's library precedent (reap-kindle rides alone). */
const reliquaryOfTheSeason: Card = {
    id: 'reliquary-of-the-season',
    theme: 'harvest',
    name: 'Reliquary of the Season',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Open the box once a year. What the season saved is spent in one '
        + 'breath, and the box is already filling again.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    // pts: REAP 4 [draw 2 (4.0) + bleed-seed i3 d1 (5.0) + heal 4 (1.33) +
    // souls 2 back (1.5)] + KINDLE wild (2.5) − soul cost 4 × 0.75 × 0.75
    // (−2.25) = 12.08 + FREE [souls 3 (2.25) + bleed-seed i2 d1 (3.0)] =
    // 5.25 → 17.33 → rare band 7-19 (Aporia). FREE share 30.3%.
    // Underfunded it fizzles — the FREE line still sows. Net drain 2 Souls
    // ("the box is already filling again" — the-gleaners-due's coin-back
    // shape, deepened).
    free: { souls: 3, applyEffect: { effectId: 'debuff_bleed', intensity: 2, duration: 1 } },
    specialMechanics: [
        {
            kind: 'reap', cost: 4, kindle: 'wild',
            rider: { drawCards: 2, applyEffect: { effectId: 'debuff_bleed', intensity: 3, duration: 1 }, healHp: 4, souls: 2 },
        },
    ],
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'payoff', 'build-around'],
};

/** The defensive rare spender: a hard wall now, a bought wall on top, and
 *  the die returned wild — the granary shut against the worst phase. */
const barTheGranaryDoor: Card = {
    id: 'bar-the-granary-door',
    theme: 'harvest',
    name: 'Bar the Granary Door',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Winter is a siege that always comes. The door is oak, the bar is '
        + 'iron, and the price of both was paid by the dead.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'self',
    // pts: GUARD 12 (3.0) + SOUL 2 (1.5) + REAP 2 [guard 8 (2.0) + heal 4
    // (1.33)] − soul cost 2 × 0.75 × 0.75 (−1.125) = 2.21 → 6.71 + CONVERT
    // the die to wild (2.5) = 9.21 + FREE [guard 8 (2.0) + souls 2 (1.5)]
    // = 3.5 → 12.71 → rare band 7-19 (Axiom). FREE share 27.5%.
    // MECHANIC ORDER IS LOAD-BEARING (doctrine witness): the REAP fires
    // FIRST, drawing on the STANDING bank only — on an empty bank it
    // fizzles, and the same-play SOUL mint lands after it ("the box is
    // already filling again"). Minting first would self-fund the reap's
    // max-HP erosion on a clean board — a strike in disguise.
    free: { guard: 8, souls: 2 },
    specialMechanics: [
        { kind: 'guard', amount: 12 },
        { kind: 'reap', cost: 2, rider: { guard: 8, healHp: 4 } },
        { kind: 'soul_gain', count: 2 },
        { kind: 'convert_die_color' },
    ],
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'defense', 'finisher'],
};

/** The inevitability build-around: cards, Souls, a standing Mark — and the
 *  X-die fate line turns a dead face into three more Souls and a card,
 *  paid for in blood. Both certainties on one face. */
const deathAndTaxes: Card = {
    id: 'death-and-taxes',
    theme: 'harvest',
    name: 'Death and Taxes',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Two collectors, one ledger. Neither is cruel; cruelty would '
        + 'imply the outcome was ever negotiable.',
    tier: 2, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    // pts: draw 2 (4.0) + SOUL 3 (2.25) + mark i2 d2 (3.0) = 9.25 + FATE
    // X-die [souls 3 (2.25) + draw 1 (2.0)] × 0.7 − recoil 3 × ⅓ × 0.75
    // (−0.75) = 2.23 + FREE [souls 2 (1.5) + draw 1 (2.0) + heal 2 (0.67)]
    // = 4.17 → 15.64 → rare band 7-19 (Aporia). FREE share 26.6%.
    free: { souls: 2, drawCards: 1, healHp: 2 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'rider', rider: { drawCards: 2 } }, { kind: 'soul_gain', count: 3 }],
    fate: { rider: { souls: 3, drawCards: 1 }, recoilHp: 3 },
    addedIn: '2026-07-18',
    tags: ['harvest', 'swap-pool', 'draw', 'build-around'],
};

// ─── The set ─────────────────────────────────────────────────────────────────

/**
 * The harvest swap pool: 30 spell-only candidates for `/deck-tuning`'s
 * tithe-preset seat swaps (10 commons / 12 uncommons / 8 rares).
 */
export const SWAP_POOL_HARVEST: SandboxCardSet = {
    id: 'swap-harvest',
    name: 'Swap pool: harvest',
    description:
        'Thirty spell-only swap candidates for the tithe preset. Commons '
        + 'probe simple, reliable churn — short Bleeds, standing Marks, Guard '
        + 'walls, and Soul mints fit for the ×4 seats; uncommons carry the '
        + 'consume/REAP engine across varied die and react lines; rares A/B '
        + 'alternative finishers and build-arounds against the-reaping and '
        + 'the-gleaners-due, including a defensive rare seat and a pure '
        + 'Soul-and-cards engine that tests whether tithe\'s late wall is a '
        + 'bank-size problem.',
    cards: [
        // commons (10)
        tallowAndWick, chaffFire, gleaningHands, hedgeOfSheaves,
        threshingFloor, whatIsSpared, whatTheMiceLeave, waxAndWane,
        widowsPortion, rustOnTheScythe,
        // uncommons (12)
        sickleTurn, titheLedger, cropRotation, seedInTheFurrow,
        gravesideWatch, theLeanSeason, walkTheRowsTwice, rotInTheGranary,
        barterOfBone, theQuietArithmetic, feastOfAshes, countingTheSheaves,
        // rares (8)
        theSecondScythe, harvestHome, allFleshIsGrass, aTitheOfTeeth,
        winterCount, reliquaryOfTheSeason, barTheGranaryDoor, deathAndTaxes,
    ],
};
