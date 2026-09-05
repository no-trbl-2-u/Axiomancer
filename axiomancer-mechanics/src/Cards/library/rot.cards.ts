/**
 * ROT — THE BLIGHT. THE BIG NUMBERS REWRITE (2026-09-02).
 *
 * The affliction deck. Its axis is PLANT → DEEPEN → DETONATE: seed POISON and
 * BLEED cheaply, thicken them with FESTER / PROLONG / CURDLE and the standing
 * oath, then cash the whole board with RUPTURE or open the foe with FLAY and
 * put it down with EXECUTE. Nothing here is fast. Everything here compounds.
 *
 * Scale notes for this theme specifically:
 * - Multi-hit is rot's preferred damage shape wherever BLEED is in play: BLEED
 *   ticks on the damage INSTANCE, so `3 × 4` and `12 × 1` are the same headline
 *   and very different fights.
 * - The two rare payoffs are uncapped on purpose. `communion-of-the-worm`
 *   detonates the whole DoT bank (a fed board is 150-250 and it heals half of
 *   it back); `every-wound-accounted` prints 72, doubles it under EXECUTE, and
 *   FLAY pushes the top end past 250.
 * - The FREE lines are the replant. A rot turn with no die still has to leave
 *   fuel in the ground, so every FREE line here either seeds an affliction,
 *   ticks one, or opens the foe for the next card.
 *
 * This file is data-only. All runtime behaviour lives in
 * `src/Cards/card.engine.ts` and `src/Combat/combat.engine.ts`.
 */

import type { Card } from '../types';

const ADDED = '2026-09-02';

// ─── RANK 1 · ASH — the ground gets broken ───────────────────────────────────

const unctionOfBoils: Card = {
    id: 'unction-of-boils',
    theme: 'rot',
    name: 'Unction of Boils',
    philosophicalAspect: 'body',
    description:
        'The chrism went rancid a century back, and the parish anoints with ' +
        'it anyway. Thumb to brow, brow to blister, blister to the blood ' +
        'beneath. Be patient: the blessing takes.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 6. Inflict POISON 3 for 4 turns.',
    // pts: deal 6 + poison i3 d4 + FREE MARK 2 for 2. The anointing card: the
    // FREE line is not a small poison but the amplifier that makes every
    // later tick bite harder, so a dieless turn still buys the theme a turn.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 2 } },
    specialMechanics: [{ kind: 'deal', amount: 6 }],
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 3, duration: 4 }],
    addedIn: ADDED,
    tags: ['rot', 'dot', 'seed'],
};

const saltInTheFont: Card = {
    id: 'salt-in-the-font',
    theme: 'rot',
    name: 'Salt in the Font',
    philosophicalAspect: 'mind',
    description:
        'A handful of grey salt, tipped in while the sexton was counting ' +
        'candles. Everyone who blesses themselves today carries the flaw out ' +
        'into the street with them. You only had to find the water.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 7. Apply MARK 3 for 3 turns.',
    // pts: deal 7 + mark i3 d3 + FREE deal 3. Rot's cheapest amplifier: no
    // fuel of its own, it just makes everyone else's fuel worth more. The
    // FREE line is a real hit so the card is never a blank early.
    free: { damage: 3 },
    specialMechanics: [{ kind: 'deal', amount: 7 }],
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 3, duration: 3 }],
    addedIn: ADDED,
    tags: ['rot', 'mark', 'amplifier'],
};

const vinegarAndGall: Card = {
    id: 'vinegar-and-gall',
    theme: 'rot',
    name: 'Vinegar and Gall',
    philosophicalAspect: 'heart',
    description:
        'What they offered the dying man on the hill, held up on a sponge by ' +
        'somebody who thought he was being kind. You have kept the recipe. ' +
        'You have never once been kind with it.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 8. Inflict POISON 3 for 3 turns.',
    // pts: deal 8 + poison i3 d3 + FREE heal 5. A genuine fork at Ash: the
    // PAID line is the best rank-1 hit in the theme, the FREE line is the
    // only sustain rot gets before Splinter. You will want both.
    free: { healHp: 5 },
    specialMechanics: [{ kind: 'deal', amount: 8 }],
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 3, duration: 3 }],
    addedIn: ADDED,
    tags: ['rot', 'dot', 'seed'],
};

// ─── RANK 2 · TOOTH — it starts keeping its own time ─────────────────────────

const theSextonsBell: Card = {
    id: 'the-sextons-bell',
    theme: 'rot',
    name: "The Sexton's Bell",
    philosophicalAspect: 'heart',
    description:
        'The sexton rings once for the dying and twice for the dead, and ' +
        'for you he has not stopped ringing. Every toll lands heavier than ' +
        'the last. The grave was dug on the first stroke. The rest is ' +
        'paperwork.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 10. Apply DOOM 4.',
    // pts: deal 10 + doom i4 (no calendar, grows per enemy action) + FREE
    // tick-all. The bell is the one rot card that punishes the foe for
    // ACTING, and its FREE line is the impatience valve: pay no die, get the
    // whole board's fuel a turn early.
    free: { tickAllDots: true },
    specialMechanics: [{ kind: 'deal', amount: 10 }],
    combatEffects: [{ effectId: 'debuff_creeping_doom', appliedTo: 'opponent', intensity: 4 }],
    addedIn: ADDED,
    tags: ['rot', 'doom', 'dot'],
};

const theBlisterRosary: Card = {
    id: 'the-blister-rosary',
    theme: 'rot',
    name: 'The Blister Rosary',
    philosophicalAspect: 'body',
    description:
        'Told on the skin instead of the beads, one raised bead of pus per ' +
        'decade. The faithful say the prayer is finished when the string ' +
        'breaks. The string is on their arm and it is going to break.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 3 × 4. Inflict BLEED 4 for 2 turns.',
    // pts: deal 3 four times (12) + bleed i4 d2 + FREE deal 5. Authored as
    // four instances rather than one 12 on purpose: BLEED ticks per damage
    // instance, so this is the card that teaches rot why the small numbers
    // are the big numbers.
    free: { damage: 5 },
    specialMechanics: [{ kind: 'deal', amount: 3, hits: 4 }],
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 4, duration: 2 }],
    addedIn: ADDED,
    tags: ['rot', 'multi-hit', 'bleed'],
};

const theSurgeonsAbsence: Card = {
    id: 'the-surgeons-absence',
    theme: 'rot',
    name: "The Surgeon's Absence",
    philosophicalAspect: 'mind',
    description:
        'He was called away in the spring and the parish has been managing. ' +
        'Managing means nobody closes anything now. What was going to be a ' +
        'small week for this body is going to be its last one.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 9. FESTER 1: every affliction on the foe gains 1 intensity.',
    // pts: deal 9 + fester 1 across the live board + FREE MARK 2 for 3. The
    // first glue card, and the cheapest: FESTER pays exactly as much as the
    // ground you have already broken, which is the whole lesson of the deck.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 3 } },
    specialMechanics: [
        { kind: 'deal', amount: 9 },
        { kind: 'boost_all_dots', intensity: 1 },
    ],
    addedIn: ADDED,
    tags: ['rot', 'glue', 'fester'],
};

// ─── RANK 3 · SPLINTER — the season is observed ──────────────────────────────

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
    paidSummary: 'Deal 14. PROLONG every affliction on the foe by 2 turns.',
    // pts: deal 14 + prolong +2 turns across the board + MIND×3 threshold
    // tick-all + FREE poison i4 d3. PROLONG multiplies whatever is planted,
    // so the FREE line plants; on a fed board the paid +2 turns is the
    // largest single number in the theme that never prints a digit.
    free: { applyEffect: { effectId: 'debuff_poison', intensity: 4, duration: 3 } },
    specialMechanics: [
        { kind: 'deal', amount: 14 },
        { kind: 'extend_dots', turns: 2 },
    ],
    threshold: { color: 'mind', count: 3, rider: { tickAllDots: true } },
    addedIn: ADDED,
    tags: ['rot', 'glue', 'prolong'],
};

const almsOfBadBread: Card = {
    id: 'alms-of-bad-bread',
    theme: 'rot',
    name: 'Alms of Bad Bread',
    philosophicalAspect: 'heart',
    description:
        'You give what you have. What you have is the loaf that has gone ' +
        'blue and hairy at the heel, and a hungry mouth does not inspect a ' +
        'gift. Charity, the almoner insists, is measured by the giving.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 16. Inflict POISON 6 for 4 turns. Heal 12.',
    // pts: deal 16 + poison i6 d4 + heal 12 + match-die bonus intensity 2 +
    // FREE heal 5 and poison i3 d2. Rot's only real sustain card: the same
    // spoiled loaf feeds you and kills them, which is the joke.
    free: { healHp: 5, applyEffect: { effectId: 'debuff_poison', intensity: 3, duration: 2 } },
    specialMechanics: [
        { kind: 'deal', amount: 16 },
        { kind: 'rider', rider: { healHp: 12 } },
    ],
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 6, duration: 4 }],
    dieBonus: { onColor: 'match', rider: { bonusIntensity: 2 } },
    addedIn: ADDED,
    tags: ['rot', 'dot', 'sustain'],
};

const theInventoryOfWounds: Card = {
    id: 'the-inventory-of-wounds',
    theme: 'rot',
    name: 'The Inventory of Wounds',
    philosophicalAspect: 'body',
    description:
        'Every hurt this body has taken, listed in a clerk hand, with the ' +
        'dates. You are not reading it for sympathy. You are reading it for ' +
        'the entries that were never crossed out.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 5 × 4. FLAY 3.',
    // pts: deal 5 four times (20) + flay 3 + match-die flay 2 + FREE flay 1.
    // The opener for the Skull cards: FLAY is worth nothing on its own and
    // everything in front of a 12 × 6, and the FREE line is exactly one
    // stack of "the next thing hurts more".
    free: { flay: 1 },
    specialMechanics: [
        { kind: 'deal', amount: 5, hits: 4 },
        { kind: 'flay', stacks: 3 },
    ],
    dieBonus: { onColor: 'match', rider: { flay: 2 } },
    addedIn: ADDED,
    tags: ['rot', 'multi-hit', 'flay'],
};

// ─── RANK 4 · RIB — it preaches, and it turns ────────────────────────────────

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
        'Deal 24. Apply DOOM 3. FESTER 2: every affliction on the foe gains 2 intensity.',
    // pts: deal 24 + doom i3 + fester 2 + match-die tick-all + FREE MARK 3
    // for 3. Engine order (combatEffects before mechanics) means the fresh
    // DOOM is festered by its own card — the face prints in that order and
    // means it.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 3, duration: 3 } },
    specialMechanics: [
        { kind: 'deal', amount: 24 },
        { kind: 'boost_all_dots', intensity: 2 },
    ],
    combatEffects: [{ effectId: 'debuff_creeping_doom', appliedTo: 'opponent', intensity: 3 }],
    dieBonus: { onColor: 'match', rider: { tickAllDots: true } },
    addedIn: ADDED,
    tags: ['rot', 'glue', 'fester', 'doom'],
};

const theLazarsKiss: Card = {
    id: 'the-lazars-kiss',
    theme: 'rot',
    name: "The Lazar's Kiss",
    philosophicalAspect: 'heart',
    description:
        'The old rite says the saint kissed the leper and took the sickness ' +
        'off him. It does not say where the saint put it. You have read the ' +
        'rite the other way round, and it works just as well backwards.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Deal 20. Flips every BLEED on the foe to POISON and every POISON to BLEED, each 3 harder. Heal 16.',
    // pts: deal 20 + curdle +3 both ways + heal 16 + HEART×3 threshold
    // tick-all + FREE heal 6 and bleed i5 d2. The clock-launderer: a board of
    // fast BLEED becomes a slow POISON bank for the detonator, or the other
    // way round when you need it dead this phase.
    free: { healHp: 6, applyEffect: { effectId: 'debuff_bleed', intensity: 5, duration: 2 } },
    specialMechanics: [
        { kind: 'deal', amount: 20 },
        { kind: 'convert_dots', bonusIntensity: 3 },
        { kind: 'rider', rider: { healHp: 16 } },
    ],
    threshold: { color: 'heart', count: 3, rider: { tickAllDots: true } },
    addedIn: ADDED,
    tags: ['rot', 'glue', 'curdle'],
};

// ─── RANK 5 · SKULL — the table is set ───────────────────────────────────────

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
        'Deal 30. PIERCE. RUPTURE ALL: consume every affliction on the foe and detonate. SIPHON 50%.',
    // pts: deal 30 pierce + uncapped rupture of the whole bank + siphon 50% +
    // FREE poison i5 d3 and a tick. THE detonator. A fed board is 150-250 and
    // half of it comes back as VITAE; the FREE line is the replant, because
    // the turn after a detonation the ground is bare and the deck must eat.
    free: { applyEffect: { effectId: 'debuff_poison', intensity: 5, duration: 3 }, tickOne: true },
    specialMechanics: [
        { kind: 'deal', amount: 30, pierce: true },
        { kind: 'rupture' },
        { kind: 'siphon', pct: 0.5 },
    ],
    addedIn: ADDED,
    tags: ['rot', 'payoff', 'rupture', 'siphon'],
};

const theButchersSacrament: Card = {
    id: 'the-butchers-sacrament',
    theme: 'rot',
    name: "The Butcher's Sacrament",
    philosophicalAspect: 'body',
    description:
        'He blesses the block before the first cut and again after the last, ' +
        'and in between he does not speak. The apprentices think it is ' +
        'piety. It is counting. He has never once lost his place.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 9 × 5. Inflict BLEED 10 for 3 turns. FLAY 3.',
    // pts: deal 9 five times (45) + bleed i10 d3 + flay 3 + FREE deal 14 and
    // flay 1. Five separate instances into a fresh BLEED 10 is the theme's
    // honest big number, and it leaves the foe open for the Saint card.
    free: { damage: 14, flay: 1 },
    specialMechanics: [
        { kind: 'deal', amount: 9, hits: 5 },
        { kind: 'flay', stacks: 3 },
    ],
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 10, duration: 3 }],
    addedIn: ADDED,
    tags: ['rot', 'multi-hit', 'bleed', 'flay'],
};

const theUntendedGarden: Card = {
    id: 'the-untended-garden',
    theme: 'rot',
    name: 'The Untended Garden',
    philosophicalAspect: 'mind',
    persistentEffect:
        'At the end of each round, FESTER 2: every affliction on the foe gains 2 intensity.',
    description:
        'No shears, no salt, no gardener — only what the ground wanted all ' +
        'along. Each night the roots go one ring deeper. Nothing planted ' +
        'here has ever asked permission.',
    tier: 3, rank: 5, cardType: 'oath',
    targetType: 'self',
    // pts: engine text — a standing end-of-round FESTER 2. Three timed rounds
    // on the FREE line, permanent on the PAID one; against a board of four
    // afflictions that is +8 intensity a round, compounding, forever.
    addedIn: ADDED,
    tags: ['rot', 'oath', 'fester'],
};

// ─── RANK 6 · SAINT — nothing closes, and the ledger balances ────────────────

const edictOfTheOpenWound: Card = {
    id: 'edict-of-the-open-wound',
    theme: 'rot',
    name: 'Edict of the Open Wound',
    philosophicalAspect: 'body',
    persistentEffect:
        "The foe's wounds refuse to close: its POISON, BLEED and DOOM no longer lose duration, and its HEAL fails.",
    description:
        'By order of the parish that buried its last surgeon: let nothing ' +
        'close. The scab is annulled, the salve confiscated, the prayer for ' +
        'mending struck from the book. The wound stays open for inspection.',
    tier: 3, rank: 6, cardType: 'hex',
    targetType: 'enemy',
    // pts: engine text — freezes the enemy-side affliction calendar (a
    // standing PROLONG every round) and denies the foe's healing. BLEED's
    // per-trigger intensity decay survives: decay is not calendar. The hex
    // that makes the detonator's bank permanent.
    addedIn: ADDED,
    tags: ['rot', 'hex', 'prolong'],
};

const everyWoundAccounted: Card = {
    id: 'every-wound-accounted',
    theme: 'rot',
    name: 'Every Wound Accounted',
    philosophicalAspect: 'mind',
    description:
        'The clerk closes the book, and there is nothing outstanding. Not ' +
        'one cut unentered, not one fever unpriced, not one hour of it ' +
        'forgiven. You do not gloat. You total it, and you present it.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    paidSummary:
        'Deal 12 × 6. FLAY 6. EXECUTE at 35%: while the foe is that low, this damage is doubled.',
    // pts: deal 12 six times (72) + flay 6 + execute at 35% (144 before FLAY,
    // past 250 behind a fed board's FLAY and BLEED) + FREE deal 22 and flay
    // 2. Six instances is deliberate: every BLEED stack on the foe fires
    // once per instance, so the sum on the face is the floor and never the
    // number you actually see.
    free: { damage: 22, flay: 2 },
    specialMechanics: [
        { kind: 'deal', amount: 12, hits: 6 },
        { kind: 'flay', stacks: 6 },
        { kind: 'execute', atPct: 0.35 },
    ],
    addedIn: ADDED,
    tags: ['rot', 'payoff', 'execute', 'flay'],
};

/** The Blight, rank-ascending. */
export const ROT_CARDS: Card[] = [
    unctionOfBoils, saltInTheFont, vinegarAndGall,
    theSextonsBell, theBlisterRosary, theSurgeonsAbsence,
    theLongLent, almsOfBadBread, theInventoryOfWounds,
    gangreneGospel, theLazarsKiss,
    communionOfTheWorm, theButchersSacrament, theUntendedGarden,
    edictOfTheOpenWound, everyWoundAccounted,
];
