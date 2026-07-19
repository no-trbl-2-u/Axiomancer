/**
 * Swap pool — CHARM (T8; preset `grace`). 30 NEW sandbox spells, authored
 * 2026-07-18 under the owner-ratified per-theme swap-pool directive: these are
 * /deck-tuning SWAP CANDIDATES for the 15-card preset recipe's seats
 * (4×2 commons / 2×2 uncommons / 1×3 rares) — NOT player-facing content, NOT
 * preset members, NOT library cards. Promotion of any card rides the standard
 * sandbox A/B court.
 *
 * Vocabulary law (spec 32 §3): hallmarks SWAY + RAPPORT, family utility
 * CLEANSE + HEAL, plus the generic utility verbs the theme's 7 library cards
 * already lean on (DRAW, GUARD, MARK, the die-manipulation valves). No
 * neighbor-theme hallmark appears. THE STRIKE IS DEAD: the only HP pressure
 * in this pool is the MARK-payoff line (`ruptureMarks`, the a-sweeter-poison
 * precedent — spec 32 §1 source 2); note that NO DoT species is charm-legal
 * (POISON/BLEED are affliction hallmarks, nettle/ember/doom are
 * bulwark/forge/harvest species), so the generic swap-pool "live DoT line"
 * seat is deliberately filled by that mark-payoff pressure line instead.
 *
 * Prior art (Dawncaster, community corpus — leads, not canon):
 * - kb:dawncaster/keywords/charmed.okf.md (src-001, medium) — Charmed is the
 *   genre's capitulation currency ("lose if Health < Charmed stack") and
 *   damage REMOVES it: the archetype commits to not hitting, which is our
 *   never-touch-HP gist made mechanical.
 * - Carrier-density lesson (cards.json sweep, 40/1,692 Charmed carriers): the
 *   genre fills density with varied SHAPES — flat appliers (Casa Nova,
 *   Glimmer), state-gated payoffs (Break a Leg), and converters that turn
 *   other actions into Charmed (Forgiving Grace's heal→Charmed, Heartfelt
 *   Sermon's per-Perform drip) — not with bigger flat numbers. This pool
 *   copies that spread: appliers, converters, condition riders, and closers.
 */

import type { Card } from '../types';
import type { SandboxCardSet } from '../cards.sandbox-sets';

// ─── Commons (10) — simple, reliable; candidates for the ×4 seats ────────────

/** The x4-seat workhorse: SWAY braided with a MARK grace-note — deliberately
 *  a DIFFERENT SHAPE from library soft-word's mono-SWAY 3 (that seat A/B
 *  tests shapes, not magnitudes): the bar moves AND the pressure line gets a
 *  sliver of fuel on every cast. */
const aKindWord: Card = {
    id: 'a-kind-word',
    theme: 'charm',
    name: 'A Kind Word',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'It costs nothing, and it is never forgotten. The soft place it '
        + 'leaves is exactly where everything after knocks.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: SWAY 2 (2 × 0.9 = 1.8) + MARK i1 d2 (0.75 × 1 × 2 = 1.5) = 3.3 +
    // FREE [sway 1 (0.9) + heal 1 (0.33)] = 1.23 → 4.53 → common band 1.5-7.5
    // (Doxa). FREE share 1.23/4.53 = 27.2% ✓.
    free: { sway: 1, healHp: 1 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    specialMechanics: [{ kind: 'sway', amount: 2 }],
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'alt-win', 'affliction-fuel'],
};

/** The commons' defend line, in charm vocabulary: GUARD for the blow that is
 *  coming plus RAPPORT so the next one arrives smaller. */
const theTurnedCheek: Card = {
    id: 'the-turned-cheek',
    theme: 'charm',
    name: 'The Turned Cheek',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Offer the unstruck side as if settling an account. Violence against '
        + 'the willing is a debt, and you are the creditor.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: GUARD 6 (6 ÷ 4 = 1.5) + rapport i1 d2 (0.75 × 1 × 2 = 1.5) = 3.0 +
    // FREE [guard 1 (0.25) + sway 1 (0.9)] = 1.15 → 4.15 → common band
    // 1.5-7.5 (Doxa). FREE share 1.15/4.15 = 27.7% ✓.
    free: { guard: 1, sway: 1 },
    combatEffects: [{ effectId: 'debuff_rapport', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    specialMechanics: [{ kind: 'guard', amount: 6 }],
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'defense'],
};

/** The pressure-line PLANTER: a plain MARK deposit (utility affliction —
 *  charm's only spec-legal erosion fuel) for the pool's closers to cash. */
const aNameRemembered: Card = {
    id: 'a-name-remembered',
    theme: 'charm',
    name: 'A Name Remembered',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'You greet them by the name their faults answer to. Every ill that '
        + 'finds them afterward knows exactly where to knock.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: MARK i2 d2 (0.75 × 2 × 2 = 3.0) + heal 1 (0.33) = 3.33 + FREE
    // [mark i1 d1 (0.75) + sway 1 (0.9)] = 1.65 → 4.98 → common band 1.5-7.5
    // (Doxa). FREE share 1.65/4.98 = 33.1% ✓.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 }, sway: 1 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'rider', rider: { healHp: 1 } }],
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'affliction-fuel'],
};

/** The pressure-line JUNIOR CLOSER — the pool's live erosion seat (charm has
 *  no legal DoT species; the mark-payoff IS its clock). Closer fires BEFORE
 *  the fresh plant (a-sweeter-poison rider-order precedent): on a clean board
 *  it is silence, never a strike in disguise. */
const theFlawConfessed: Card = {
    id: 'the-flaw-confessed',
    theme: 'charm',
    name: 'The Flaw Confessed',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Name the flaw they hid and forgive it in the same breath. What was '
        + 'named is owed; the naming collects.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: closer ruptureMarks 1 (1 × 2/3 = 0.67) + plant MARK i1 (def d2:
    // 0.75 × 1 × 2 = 1.5, landed AFTER the closer) = 2.17 + FREE sway 1 (0.9)
    // → 3.07 → common band 1.5-7.5 (Doxa). FREE share 0.9/3.07 = 29.3% ✓.
    free: { sway: 1 },
    specialMechanics: [
        { kind: 'rider', rider: { ruptureMarks: 1 } },
        { kind: 'rider', rider: { applyEffect: { effectId: 'debuff_mark', intensity: 1 } } },
    ],
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'payoff'],
};

/** Cycle glue for the x4 seat: a draw wrapped in RAPPORT so even the deck's
 *  plumbing lowers their arm. */
const plainSpeech: Card = {
    id: 'plain-speech',
    theme: 'charm',
    name: 'Plain Speech',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'Say it plainly and let plainness do the work. The undecorated '
        + 'sentence is the hardest to argue with.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: DRAW 1 (2.0) + rapport i1 d2 (1.5) = 3.5 + FREE [sway 1 (0.9) +
    // heal 1 (0.33)] = 1.23 → 4.73 → common band 1.5-7.5 (Doxa). FREE share
    // 1.23/4.73 = 26.1% ✓.
    free: { sway: 1, healHp: 1 },
    combatEffects: [{ effectId: 'debuff_rapport', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    specialMechanics: [{ kind: 'rider', rider: { drawCards: 1 } }],
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'draw'],
};

/** HEAL/CLEANSE sustain glue on a RAPPORT body. The paid SWAY lump is
 *  deliberately ABSENT (review: {SWAY, HEAL 3, CLEANSE 1} reprinted library
 *  the-olive-branch's paid triple one band down) — the FREE line alone tends
 *  the bar; the paid face mends, forgives, and lowers their arm. */
const smallMercies: Card = {
    id: 'small-mercies',
    theme: 'charm',
    name: 'Small Mercies',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'Forgive the small things aloud, and keep the ledger of it. Mercy at '
        + 'this scale is bookkeeping — each entry in your favor.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: rapport i1 d2 (0.75 × 1 × 2 = 1.5) + HEAL 3 (1.0) + CLEANSE 1
    // (1.5) = 4.0 + FREE sway 2 (1.8) → 5.8 → common band 1.5-7.5 (Lemma).
    // FREE share 1.8/5.8 = 31.0% ✓.
    free: { sway: 2 },
    combatEffects: [{ effectId: 'debuff_rapport', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    specialMechanics: [
        { kind: 'rider', rider: { healHp: 3, cleanse: 1 } },
    ],
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'sustain'],
};

/** Draw + SWAY tempo common: the hand stays full while the bar creeps. */
const anOpenDoor: Card = {
    id: 'an-open-door',
    theme: 'charm',
    name: 'An Open Door',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Leave it open and watch what walks in: their patience, your '
        + 'options. No one guards a door that was never shut.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: DRAW 1 (2.0) + SWAY 2 (1.8) = 3.8 + FREE rapport i1 d2 seed (1.5)
    // → 5.3 → common band 1.5-7.5 (Lemma). FREE share 1.5/5.3 = 28.3% ✓.
    free: { applyEffect: { effectId: 'debuff_rapport', intensity: 1, duration: 2 } },
    specialMechanics: [
        { kind: 'rider', rider: { drawCards: 1 } },
        { kind: 'sway', amount: 2 },
    ],
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'draw', 'alt-win'],
};

/** The commons' REACT defend: answering a landed blow with softness (the
 *  enemy-drew-blood ledger — the ratified WS4.2 gate; charm's turn-the-cheek
 *  reading of it). Tier-1's single allowed condition line. */
const theGentledAnswer: Card = {
    id: 'the-gentled-answer',
    theme: 'charm',
    name: 'The Gentled Answer',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'They strike; you lower your voice. Nothing unsettles an argument '
        + 'like being answered more softly than it deserves.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: GUARD 8 (2.0) + heal 2 (0.67) = 2.67 + drew-blood rider [rapport
    // i1 d2 (1.5) + sway 1 (0.9)] × threshold 0.5 = 1.2 + FREE [guard 2 (0.5)
    // + sway 1 (0.9)] = 1.4 → 5.27 → common band 1.5-7.5 (Lemma). FREE share
    // 1.4/5.27 = 26.6% ✓.
    free: { guard: 2, sway: 1 },
    specialMechanics: [
        { kind: 'guard', amount: 8 },
        { kind: 'rider', rider: { healHp: 2 } },
    ],
    synergy: {
        statePredicate: { kind: 'enemy-drew-blood' },
        rider: {
            applyEffect: { effectId: 'debuff_rapport', intensity: 1, duration: 2 },
            sway: 1,
        },
    },
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'defense', 'condition'],
};

/** The heart-die reader: SWAY that runs deeper when the powering die matches
 *  the theme's color. Tier-1's single allowed die line. */
const swornGently: Card = {
    id: 'sworn-gently',
    theme: 'charm',
    name: 'Sworn Gently',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'An oath taken quietly binds harder than one shouted. They lean in '
        + 'to hear it, and lean the way you meant.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: SWAY 3 (2.7) + heal 2 (0.67) = 3.37 + dieBonus match [sway 2
    // (1.8)] × 0.6 = 1.08 + FREE rapport i1 d2 seed (1.5) → 5.95 → common
    // band 1.5-7.5 (Lemma). FREE share 1.5/5.95 = 25.2% ✓.
    free: { applyEffect: { effectId: 'debuff_rapport', intensity: 1, duration: 2 } },
    specialMechanics: [
        { kind: 'sway', amount: 3 },
        { kind: 'rider', rider: { healHp: 2 } },
    ],
    dieBonus: { onColor: 'match', rider: { sway: 2 } },
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'alt-win'],
};

/** The LONG-BURN RAPPORT applier — shallow-and-long (i1 d4) where library
 *  disarming-smile is deep-and-short (i2 d2): same point mass, opposite
 *  damping PROFILE, so the seat A/B tests burst-damp vs sustained-damp
 *  rather than restating the incumbent. */
const waterTheStone: Card = {
    id: 'water-the-stone',
    theme: 'charm',
    name: 'Water the Stone',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'No blow, no haste — only the patient wearing-down that water '
        + 'teaches stone. Their edge dulls in your presence.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: rapport i1 d4 (0.75 × 1 × 4 = 3.0) + FREE [sway 1 (0.9) + heal 1
    // (0.33)] = 1.23 → 4.23 → common band 1.5-7.5 (Lemma). FREE share
    // 1.23/4.23 = 29.1% ✓.
    free: { sway: 1, healHp: 1 },
    combatEffects: [{ effectId: 'debuff_rapport', appliedTo: 'opponent', intensity: 1, duration: 4 }],
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'defense'],
};

// ─── Uncommons (12) — the theme's engine; one die/condition line each ────────

/** SWAY + long-burn RAPPORT with a heart-threshold CLEANSE dividend — the
 *  contrast against library common-ground runs three axes (review widened it
 *  from one): the rapport is d3 to its d2, the gate pays CLEANSE (a payoff
 *  class common-ground touches on NO line), and DRAW appears nowhere on this
 *  card (common-ground carries it FREE). A shape probe, not a re-lining. */
const theLongListening: Card = {
    id: 'the-long-listening',
    theme: 'charm',
    name: 'The Long Listening',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'Listen past the point of courtesy, past comfort, past defense. What '
        + 'has been fully heard has nothing left to swing with.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: SWAY 2 (1.8) + rapport i1 d3 (0.75 × 1 × 3 = 2.25) = 4.05 +
    // threshold heart 3 [cleanse 1 (1.5)] × 0.5 = 0.75 + FREE [sway 2 (1.8) +
    // heal 1 (0.33)] = 2.13 → 6.93 → uncommon band 4.5-13 (Thesis). FREE
    // share 2.13/6.93 = 30.8% ✓.
    free: { sway: 2, healHp: 1 },
    combatEffects: [{ effectId: 'debuff_rapport', appliedTo: 'opponent', intensity: 1, duration: 3 }],
    specialMechanics: [{ kind: 'sway', amount: 2 }],
    threshold: { color: 'heart', count: 3, rider: { cleanse: 1 } },
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'alt-win', 'sustain'],
};

/** The engine defend: a real wall plus heavy RAPPORT, and composure under a
 *  landed blow converts to SWAY (drew-blood ledger, charm's reading). */
const graceUnderFire: Card = {
    id: 'grace-under-fire',
    theme: 'charm',
    name: 'Grace Under Fire',
    category: 'paradox',
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
    tags: ['charm', 'swap-pool', 'defense', 'condition'],
};

/** MARK + SWAY braided (the barbed-compliment shape, mind-colored): fuel for
 *  the closers and progress on the bar in one breath. */
const theHoneyedSyllogism: Card = {
    id: 'the-honeyed-syllogism',
    theme: 'charm',
    name: 'The Honeyed Syllogism',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'Sound reasoning, sweetly phrased, with the conclusion left where '
        + 'they will step on it. The logic holds; the honey holds harder.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: MARK i2 d2 (3.0) + SWAY 2 (1.8) = 4.8 + dieBonus match [mark i1 d2
    // applyEffect (1.5)] × 0.6 = 0.9 + FREE [sway 2 (1.8) + mark i1 d1
    // (0.75)] = 2.55 → 8.25 → uncommon band 4.5-13 (Thesis). FREE share
    // 2.55/8.25 = 30.9% ✓.
    free: { sway: 2, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 } },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'sway', amount: 2 }],
    dieBonus: { onColor: 'match', rider: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } } },
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'affliction-fuel'],
};

/** The REFRESH valve, charm-voiced — a DECLARED valve-flavor A/B against the
 *  grace preset's D8 valve seat (library change-of-heart, `reroll_spent`):
 *  the probe is deterministic refresh vs stochastic reroll. The rest of the
 *  body is deliberately its own (smaller sway lump + a heal, rapport-seed
 *  FREE line) so the card is a candidate, not change-of-heart with the valve
 *  swapped. */
const aSecondHearing: Card = {
    id: 'a-second-hearing',
    theme: 'charm',
    name: 'A Second Hearing',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'The case is heard again, and the die that argued it is returned to '
        + 'your hand. Patience is a court that never adjourns.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: REFRESH the powering die (2.0) + SWAY 2 (1.8) + heal 2 (0.67) =
    // 4.47 + FREE [rapport i1 d2 seed (1.5) + heal 1 (0.33)] = 1.83 → 6.3 →
    // uncommon band 4.5-13 (Thesis). FREE share 1.83/6.3 = 29.0% ✓.
    free: { applyEffect: { effectId: 'debuff_rapport', intensity: 1, duration: 2 }, healHp: 1 },
    specialMechanics: [
        { kind: 'refresh_die' },
        { kind: 'sway', amount: 2 },
        { kind: 'rider', rider: { healHp: 2 } },
    ],
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'dice', 'valve', 'alt-win'],
};

/** The CONVERT valve, charm-voiced: persuade the die itself to be anything —
 *  the miss-heavy pool's off-color fizzle, talked around. */
const theSoftConversion: Card = {
    id: 'the-soft-conversion',
    theme: 'charm',
    name: 'The Soft Conversion',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Even the die can be brought around. It arrives set in its color and '
        + 'leaves willing to be anything you ask.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: CONVERT the powering die to WILD (2.5) + rapport i1 d2 (1.5) +
    // heal 2 (0.67) = 4.67 + FREE sway 2 (1.8) → 6.47 → uncommon band 4.5-13
    // (Thesis). FREE share 1.8/6.47 = 27.8% ✓.
    free: { sway: 2 },
    combatEffects: [{ effectId: 'debuff_rapport', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    specialMechanics: [
        { kind: 'convert_die_color' },
        { kind: 'rider', rider: { healHp: 2 } },
    ],
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'dice', 'valve'],
};

/** The sustain-TEMPO body: HEAL + DRAW — deliberately NOT the olive-branch
 *  SWAY/CLEANSE/HEAL multiset (post-review that body runs ONCE in this pool,
 *  alms-for-the-argument r5; small-mercies was reshaped off it onto a
 *  rapport body). This card mends while it cycles, and only the heart gate
 *  pays the bar. */
const balmAndBargain: Card = {
    id: 'balm-and-bargain',
    theme: 'charm',
    name: 'Balm and Bargain',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'Every remedy has a price, and this one runs in your favor. Mend '
        + 'what ails you, and come away holding more than you spent.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts: HEAL 6 (2.0) + DRAW 1 (2.0) = 4.0 + threshold heart 3 [sway 2
    // (1.8)] × 0.5 = 0.9 + FREE sway 2 (1.8) → 6.7 → uncommon band 4.5-13
    // (Theorem). FREE share 1.8/6.7 = 26.9% ✓.
    free: { sway: 2 },
    specialMechanics: [
        { kind: 'rider', rider: { healHp: 6, drawCards: 1 } },
    ],
    threshold: { color: 'heart', count: 3, rider: { sway: 2 } },
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'sustain', 'draw'],
};

/** The heavy RAPPORT stacker: three turns of a lowered arm, deepened when the
 *  die matches. The engine's mid-fight damage valve. */
const heldInRegard: Card = {
    id: 'held-in-regard',
    theme: 'charm',
    name: 'Held in Regard',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'Regard, sustained, is a hand on the sword arm. They cannot strike '
        + 'what they have begun to hope thinks well of them.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: rapport i2 d3 (0.75 × 2 × 3 = 4.5) + SWAY 2 (1.8) = 6.3 + dieBonus
    // match [sway 2 (1.8)] × 0.6 = 1.08 + FREE [rapport i1 d2 seed (1.5) +
    // sway 1 (0.9) + heal 1 (0.33)] = 2.73 → 10.11 → uncommon band 4.5-13
    // (Theorem). FREE share 2.73/10.11 = 27.0% ✓.
    free: {
        applyEffect: { effectId: 'debuff_rapport', intensity: 1, duration: 2 },
        sway: 1, healHp: 1,
    },
    combatEffects: [{ effectId: 'debuff_rapport', appliedTo: 'opponent', intensity: 2, duration: 3 }],
    specialMechanics: [{ kind: 'sway', amount: 2 }],
    dieBonus: { onColor: 'match', rider: { sway: 2 } },
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'defense', 'alt-win'],
};

/** The mid closer — the CASH-HEAVY INVERSION of sandbox a-sweeter-poison's
 *  shape (theirs: rupture 2, reload i2; this: rupture 3, reload i1). The two
 *  probe opposite mark economies — spend-now vs re-seed — so the A/B court
 *  compares strategies, not near-twins. Closer fires BEFORE the plant
 *  (rider-order precedent): on a clean board it is silence, never a strike
 *  in disguise. */
const theVeiledRebuke: Card = {
    id: 'the-veiled-rebuke',
    theme: 'charm',
    name: 'The Veiled Rebuke',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description:
        'The correction arrives wrapped in courtesy, and every fault already '
        + 'named comes due at once. One new fault is noted for the next '
        + 'occasion.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: SWAY 2 (1.8) + closer ruptureMarks 3 (3 × 2/3 = 2.0) + plant MARK
    // i1 (def d2: 1.5, landed AFTER the closer) = 5.3 + threshold mind 3
    // [draw 1 (2.0)] × 0.5 = 1.0 + FREE [sway 2 (1.8) + mark i1 d1 (0.75)] =
    // 2.55 → 8.85 → uncommon band 4.5-13 (Theorem). FREE share 2.55/8.85 =
    // 28.8% ✓.
    free: { sway: 2, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 } },
    specialMechanics: [
        { kind: 'sway', amount: 2 },
        { kind: 'rider', rider: { ruptureMarks: 3 } },
        { kind: 'rider', rider: { applyEffect: { effectId: 'debuff_mark', intensity: 1 } } },
    ],
    threshold: { color: 'mind', count: 3, rider: { drawCards: 1 } },
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'payoff'],
};

/** The OPENING truce: a big wall priced for going first — offered before the
 *  first blow, it reads as strength (WS5.2 sequencing grammar). */
const anArmisticeSigned: Card = {
    id: 'an-armistice-signed',
    theme: 'charm',
    name: 'An Armistice Signed',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Offered before the first blow, the truce reads as strength. Signed '
        + 'under fire, it reads as bookkeeping. Offer it first.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: GUARD 12 (3.0) + heal 3 (1.0) = 4.0 + OPENING(0) rider [rapport i2
    // d2 (3.0)] × threshold 0.5 = 1.5 + FREE [guard 2 (0.5) + sway 2 (1.8)] =
    // 2.3 → 7.8 → uncommon band 4.5-13 (Thesis). FREE share 2.3/7.8 =
    // 29.5% ✓.
    free: { guard: 2, sway: 2 },
    specialMechanics: [
        { kind: 'guard', amount: 12 },
        { kind: 'rider', rider: { healHp: 3 } },
    ],
    synergy: {
        statePredicate: { kind: 'opening', maxPriorSpells: 0 },
        rider: { applyEffect: { effectId: 'debuff_rapport', intensity: 2, duration: 2 } },
    },
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'defense', 'condition'],
};

/** Draw engine with a finale kicker: the hand empties, the ledger speaks —
 *  card flow that still presses the bar. */
const theQuietLedger: Card = {
    id: 'the-quiet-ledger',
    theme: 'charm',
    name: 'The Quiet Ledger',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Say little; record everything. When the hand runs empty the ledger '
        + 'speaks, and it has been persuading them all along.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: DRAW 2 (4.0) + SWAY 2 (1.8) = 5.8 + finale(≤2) rider [sway 2
    // (1.8)] × threshold 0.5 = 0.9 + FREE [sway 2 (1.8) + heal 2 (0.67)] =
    // 2.47 → 9.17 → uncommon band 4.5-13 (Thesis). FREE share 2.47/9.17 =
    // 26.9% ✓.
    free: { sway: 2, healHp: 2 },
    specialMechanics: [
        { kind: 'rider', rider: { drawCards: 2 } },
        { kind: 'sway', amount: 2 },
    ],
    synergy: {
        statePredicate: { kind: 'finale', cardsLeftAtMost: 2 },
        rider: { sway: 2 },
    },
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'draw', 'condition'],
};

/** The heal→sway converter (Dawncaster's Forgiving Grace lesson) with the
 *  FATE line: even the impossible die, asked kindly, answers kindly. */
const mercyBegetsMercy: Card = {
    id: 'mercy-begets-mercy',
    theme: 'charm',
    name: 'Mercy Begets Mercy',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'Shown once, it obligates. Shown twice, it converts. The impossible '
        + 'die, asked kindly, answers kindly.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: HEAL 4 (1.33) + SWAY 4 (3.6) = 4.93 + fate [sway 3 (2.7)] × 0.7 =
    // 1.89 + FREE [sway 2 (1.8) + heal 2 (0.67)] = 2.47 → 9.29 → uncommon
    // band 4.5-13 (Theorem). FREE share 2.47/9.29 = 26.6% ✓.
    free: { sway: 2, healHp: 2 },
    specialMechanics: [
        { kind: 'rider', rider: { healHp: 4 } },
        { kind: 'sway', amount: 4 },
    ],
    fate: { rider: { sway: 3 } },
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'sustain', 'alt-win'],
};

/** The SWAY siege engine: the biggest uncommon deposit on the bar, deepened
 *  by the heart tally. The x2 seat's capitulation accelerator. */
const thePatientSiege: Card = {
    id: 'the-patient-siege',
    theme: 'charm',
    name: 'The Patient Siege',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'No ladder, no ram — only the daily, courteous pressure of being '
        + 'right outside the walls. Cities fall to patience politely applied.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: SWAY 5 (4.5) + rapport i1 d2 (1.5) = 6.0 + threshold heart 4 [sway
    // 3 (2.7)] × 0.5 = 1.35 + FREE sway 3 (2.7) → 10.05 → uncommon band
    // 4.5-13 (Theorem). FREE share 2.7/10.05 = 26.9% ✓.
    free: { sway: 3 },
    combatEffects: [{ effectId: 'debuff_rapport', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    specialMechanics: [{ kind: 'sway', amount: 5 }],
    threshold: { color: 'heart', count: 4, rider: { sway: 3 } },
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'alt-win'],
};

// ─── Rares (8) — finishers and build-arounds for the ×1 seats ────────────────

/** The capitulation finisher: the biggest single SWAY deposit in the pool
 *  plus deep RAPPORT. Tier 3 — late-stage-gated by resist design. */
const theUnrefusableOffer: Card = {
    id: 'the-unrefusable-offer',
    theme: 'charm',
    name: 'The Unrefusable Offer',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'Everything they wanted, phrased as surrender — theirs. All it costs '
        + 'is the fight, which was never worth what they were paying for it.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: SWAY 6 (5.4) + rapport i2 d2 (3.0) = 8.4 + threshold heart 5 [sway
    // 4 (3.6)] × 0.5 = 1.8 + FREE sway 4 (3.6) → 13.8 → rare band 7-19
    // (Axiom). FREE share 3.6/13.8 = 26.1% ✓.
    free: { sway: 4 },
    combatEffects: [{ effectId: 'debuff_rapport', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'sway', amount: 6 }],
    threshold: { color: 'heart', count: 5, rider: { sway: 4 } },
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'alt-win', 'finisher'],
};

/** The wall finisher: the pool's biggest defend turn, and a full round of
 *  untouched composure pays RAPPORT stacks, not a SWAY lump. The nearest
 *  precedent is sandbox unbroken-countenance (same unharmed-round ledger
 *  read on a GUARD body) — review moved this card off its payoff axis:
 *  unbroken converts composure to CAPITULATION, this converts it to
 *  DAMPING, so the two wall-seat candidates probe different currencies.
 *  The gate's vacuous turn-1 truth (types.ts) now yields defense, not win
 *  currency, at rare magnitude. */
const theWhiteFlagWoven: Card = {
    id: 'the-white-flag-woven',
    theme: 'charm',
    name: 'The White Flag, Woven',
    category: 'paradox',
    philosophicalAspect: 'body',
    description:
        'Woven, not waved: the surrender you dress the field in is theirs. A '
        + 'wall so complete it makes yielding feel like the only dignified '
        + 'exit.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'self',
    // pts: GUARD 14 (3.5) + rapport i2 d2 (3.0) + heal 4 (1.33) = 7.83 +
    // unharmed-last-round rider [rapport i2 d2 (3.0)] × threshold 0.5 = 1.5 +
    // FREE [guard 3 (0.75) + sway 3 (2.7)] = 3.45 → 12.78 → rare band 7-19
    // (Axiom). FREE share 3.45/12.78 = 27.0% ✓.
    free: { guard: 3, sway: 3 },
    combatEffects: [{ effectId: 'debuff_rapport', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [
        { kind: 'guard', amount: 14 },
        { kind: 'rider', rider: { healHp: 4 } },
    ],
    synergy: {
        statePredicate: { kind: 'enemy-dealt-no-damage-last-round' },
        rider: { applyEffect: { effectId: 'debuff_rapport', intensity: 2, duration: 2 } },
    },
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'defense', 'condition', 'finisher'],
};

/** The mark-payoff finisher — the pool's erosion capstone: read the whole
 *  record back at once, then open fresh pages. Closer before plant, always.
 *  The dieBonus deliberately carries NO ruptureMarks: condition riders join
 *  `firedRiders` BEFORE mechanic riders (combat.engine.ts pushes threshold/
 *  dieBonus/fate first, `case 'rider'` later; resolution is insertion
 *  order), and `consumeMarks` strips the WHOLE bank — a dieBonus rupture 1
 *  would fire first and downgrade the headline rupture 3 to 1 HP/stack on
 *  every color match. The match pays tempo (draw) instead. */
const theVerdictOfKindness: Card = {
    id: 'the-verdict-of-kindness',
    theme: 'charm',
    name: 'The Verdict of Kindness',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Court is kind and the sentence is thorough. Every named fault is '
        + 'read back at once, and the record opens fresh pages for the '
        + 'appeal.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: SWAY 3 (2.7) + closer ruptureMarks 3 (3 × 2/3 = 2.0) + plant MARK
    // i2 (def d2: 3.0, landed AFTER the closer) = 7.7 + dieBonus match
    // [draw 1 (2.0)] × 0.6 = 1.2 + FREE [sway 3 (2.7) + mark i1 d1 (0.75)] =
    // 3.45 → 12.35 → rare band 7-19 (Axiom). FREE share 3.45/12.35 =
    // 27.9% ✓.
    free: { sway: 3, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 } },
    specialMechanics: [
        { kind: 'sway', amount: 3 },
        { kind: 'rider', rider: { ruptureMarks: 3 } },
        { kind: 'rider', rider: { applyEffect: { effectId: 'debuff_mark', intensity: 2 } } },
    ],
    dieBonus: { onColor: 'match', rider: { drawCards: 1 } },
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'payoff', 'finisher'],
};

/** The sustain build-around: the deepest HEAL/CLEANSE in the pool, with the
 *  FATE line — grace large enough to spend a dead die on. */
const almsForTheArgument: Card = {
    id: 'alms-for-the-argument',
    theme: 'charm',
    name: 'Alms for the Argument',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'Give away what the fight has cost you — the wounds, the grievances '
        + '— as if wealth. Poverty of grudges is a fortune in this trade.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'self',
    // pts: HEAL 8 (2.67) + CLEANSE 2 (3.0) + SWAY 3 (2.7) = 8.37 + fate [heal
    // 4 (1.33) + sway 2 (1.8)] × 0.7 = 2.19 + FREE [sway 3 (2.7) + heal 3
    // (1.0)] = 3.7 → 14.26 → rare band 7-19 (Axiom). FREE share 3.7/14.26 =
    // 25.9% ✓.
    free: { sway: 3, healHp: 3 },
    specialMechanics: [
        { kind: 'rider', rider: { healHp: 8, cleanse: 2 } },
        { kind: 'sway', amount: 3 },
    ],
    fate: { rider: { healHp: 4, sway: 2 } },
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'sustain', 'build-around'],
};

/** The tempo build-around: heavy draw wrapped in RAPPORT, and going first
 *  each turn pays the listener's dividend (OPENING gate). */
const letThemSpeakFirst: Card = {
    id: 'let-them-speak-first',
    theme: 'charm',
    name: 'Let Them Speak First',
    category: 'paradox',
    philosophicalAspect: 'mind',
    description:
        'Yield the floor. Whoever speaks first empties their hand, and '
        + 'whoever listens holds the room when the echo dies.',
    tier: 2, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    // pts: DRAW 2 (4.0) + rapport i2 d2 (3.0) = 7.0 + OPENING(0) rider [sway
    // 3 (2.7) + draw 1 (2.0)] × threshold 0.5 = 2.35 + FREE [sway 2 (1.8) +
    // rapport i1 d2 seed (1.5)] = 3.3 → 12.65 → rare band 7-19 (Aporia).
    // FREE share 3.3/12.65 = 26.1% ✓.
    free: { sway: 2, applyEffect: { effectId: 'debuff_rapport', intensity: 1, duration: 2 } },
    combatEffects: [{ effectId: 'debuff_rapport', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'rider', rider: { drawCards: 2 } }],
    synergy: {
        statePredicate: { kind: 'opening', maxPriorSpells: 0 },
        rider: { sway: 3, drawCards: 1 },
    },
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'draw', 'condition', 'build-around'],
};

/** The grand engine turn: SWAY + three rounds of deep RAPPORT + CLEANSE, and
 *  the REROLL valve (change-of-heart's precedent) — even the dice come
 *  around. Tier 3, the pool's biggest single play. */
const theHundredthHearing: Card = {
    id: 'the-hundredth-hearing',
    theme: 'charm',
    name: 'The Hundredth Hearing',
    category: 'fallacy',
    philosophicalAspect: 'heart',
    description:
        'The same grace, offered the hundredth time, lands differently: not '
        + 'as an offer, but as the standing terms. Even the dice come around.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    // pts: SWAY 4 (3.6) + rapport i2 d3 (4.5) + CLEANSE 1 (1.5) + REROLL miss
    // faces (2.0) = 11.6 + FREE [sway 4 (3.6) + heal 2 (0.67)] = 4.27 → 15.87
    // → rare band 7-19 (Aporia). FREE share 4.27/15.87 = 26.9% ✓.
    free: { sway: 4, healHp: 2 },
    combatEffects: [{ effectId: 'debuff_rapport', appliedTo: 'opponent', intensity: 2, duration: 3 }],
    specialMechanics: [
        { kind: 'sway', amount: 4 },
        { kind: 'rider', rider: { cleanse: 1 } },
        { kind: 'reroll_spent' },
    ],
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'dice', 'valve', 'alt-win', 'build-around'],
};

/** The pure capitulation spike: SWAY 8 in one breath, more when a dead die
 *  is spent on the concession (FATE line). One verb, printed huge — the
 *  honest Aporia. The accelerant is deliberately NOT the-unrefusable-offer's
 *  heart-5 threshold (review: two of three tier-3 seats probed the same
 *  big-SWAY + heart-5 finisher shape) — fate vs heart-commit is now the
 *  pair's real A/B axis. Tier 3. */
const theCrownConceded: Card = {
    id: 'the-crown-conceded',
    theme: 'charm',
    name: 'The Crown Conceded',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description:
        'No blade touched it. The crown is set down because keeping it '
        + 'stopped making sense some arguments ago, and only now do they '
        + 'notice.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    // pts: SWAY 8 (7.2) + fate [sway 4 (3.6)] × 0.7 = 2.52 + FREE sway 4
    // (3.6) → 13.32 → rare band 7-19 (Aporia). FREE share 3.6/13.32 =
    // 27.0% ✓.
    free: { sway: 4 },
    specialMechanics: [{ kind: 'sway', amount: 8 }],
    fate: { rider: { sway: 4 } },
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'alt-win', 'finisher'],
};

/** The collection notice: deep RAPPORT plus a drew-blood conversion — every
 *  unanswered blow becomes standing on the capitulation bar. */
const theDebtOfGrace: Card = {
    id: 'the-debt-of-grace',
    theme: 'charm',
    name: 'The Debt of Grace',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description:
        'Every blow you took without answer was a loan at interest. This is '
        + 'the collection notice, delivered with perfect courtesy.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: rapport i3 d2 (0.75 × 3 × 2 = 4.5) + SWAY 3 (2.7) = 7.2 +
    // drew-blood rider [sway 4 (3.6) + heal 3 (1.0)] × threshold 0.5 = 2.3 +
    // FREE [sway 3 (2.7) + guard 2 (0.5)] = 3.2 → 12.7 → rare band 7-19
    // (Axiom). FREE share 3.2/12.7 = 25.2% ✓.
    free: { sway: 3, guard: 2 },
    combatEffects: [{ effectId: 'debuff_rapport', appliedTo: 'opponent', intensity: 3, duration: 2 }],
    specialMechanics: [{ kind: 'sway', amount: 3 }],
    synergy: {
        statePredicate: { kind: 'enemy-drew-blood' },
        rider: { sway: 4, healHp: 3 },
    },
    addedIn: '2026-07-18',
    tags: ['charm', 'swap-pool', 'condition', 'build-around'],
};

// ─── The set ─────────────────────────────────────────────────────────────────

export const SWAP_POOL_CHARM: SandboxCardSet = {
    id: 'swap-charm',
    name: 'Swap pool: charm',
    description:
        'Thirty swap candidates for the grace preset\'s 4/4/2/2/1/1/1 seats: '
        + 'commons probe simple SWAY/RAPPORT appliers plus an in-theme defend '
        + 'line and the MARK-payoff pressure line (charm\'s only spec-legal '
        + 'erosion — no DoT species is charm vocabulary), uncommons carry the '
        + 'engine across all three die colors with one die/condition line '
        + 'each, and rares probe capitulation finishers, a wall finisher, a '
        + 'mark-payoff capstone, and sustain/tempo build-arounds. All 30 speak '
        + 'only SWAY, RAPPORT, CLEANSE, HEAL, MARK, and the generic utility '
        + 'verbs the theme\'s 7 library cards already lean on.',
    cards: [
        // commons (10): 5 Doxa + 5 Lemma
        aKindWord, theTurnedCheek, aNameRemembered, theFlawConfessed,
        plainSpeech, smallMercies, anOpenDoor, theGentledAnswer,
        swornGently, waterTheStone,
        // uncommons (12): 6 Thesis + 6 Theorem
        theLongListening, graceUnderFire, theHoneyedSyllogism,
        aSecondHearing, theSoftConversion, balmAndBargain, heldInRegard,
        theVeiledRebuke, anArmisticeSigned, theQuietLedger,
        mercyBegetsMercy, thePatientSiege,
        // rares (8): 5 Axiom + 3 Aporia
        theUnrefusableOffer, theWhiteFlagWoven, theVerdictOfKindness,
        almsForTheArgument, letThemSpeakFirst, theHundredthHearing,
        theCrownConceded, theDebtOfGrace,
    ],
};
