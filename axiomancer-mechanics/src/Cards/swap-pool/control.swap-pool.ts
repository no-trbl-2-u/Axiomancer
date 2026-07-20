/**
 * Swap pool — CONTROL (T5, preset `standstill`).
 *
 * 30 NEW spells authored 2026-07-18 as /deck-tuning swap candidates for the
 * 15-card standstill recipe (4×2 commons, 2×2 uncommons, 1×3 rares). NOT
 * player-facing, NOT in presets, NOT in `cards.library.ts` — this pool exists
 * only so the tuner has real alternatives per seat.
 *
 * Theme gist: strip action rungs; denied blows bleed inward. Vocabulary is
 * strictly the control family — STAGGER + BACKFIRE hallmarks plus the shared
 * utility verbs (DRAW, GUARD, MARK) and the generic verbs the 7 library
 * control cards already lean on (revealStance as the theme's "information
 * currency", lock_stance, Conviction, die-manipulation valves, and the
 * card-local TURNABOUT cash-out badged "BACKFIRE ALL"). FORETELL is Oracle's
 * HALLMARK, not utility (docs/keyword-atlas.md registry) — this pool carries
 * zero foretell; every information line here is revealStance/DRAW. Control
 * has no POISON/BLEED: its erosion line is BACKFIRE (spec 32 §1 source 3,
 * the engine-gated drip), so this pool's "live DoT" commons are BACKFIRE
 * carriers by design.
 *
 * Prior art (Dawncaster, community corpus, confidence medium):
 * - kb:dawncaster/keywords/stagger.okf.md (src-001) — their Stagger is an
 *   OFFENSE affliction (start-of-turn self-damage), NOT denial: name
 *   collision only, magnitudes do not transfer.
 * - kb:dawncaster/keywords/dazed.okf.md (src-001) — the genuine graduated
 *   deny ladder ("decrease Dazed by 1 per card; at 0 gain Stunned"): rung-by-
 *   rung degradation, the shape our STAGGER rungs already use.
 * - kb:dawncaster/keywords/momentum.okf.md (src-001) — a banked counter that
 *   cashes at a threshold: the "tally becomes payoff" shape behind the second
 *   TURNABOUT-class finisher in this pool.
 * - kb:dawncaster/keywords/slow.okf.md (src-001) — a decaying action TAX
 *   (cost +1, then self-consumes): genre control keywords self-limit, which
 *   BACKFIRE's short printed durations mirror.
 */

import type { Card } from '../types';
import type { SandboxCardSet } from '../cards.sandbox-sets';

// ─── Commons (10 — rank 1-2, tier 1; the x4-seat candidates) ─────────────────

/** The minimal stagger common, mind-colored — zenos-half-step's seat RIVAL,
 *  not its superset: one rung out, a small BACKFIRE so the denial already
 *  drips, and the FREE line paints a MARK instead of repeating zenos's
 *  stance-read. */
const isosthenia: Card = {
    id: 'isosthenia',
    theme: 'control',
    name: 'Isosthenia',
    philosophicalAspect: 'mind',
    description:
        'Set the counterweight and the scales refuse to tip. An argument ' +
        'held in perfect balance moves nothing — least of all them.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: STAGGER 1 (2.0) + backfire i1 d2 (0.75×1×2 = 1.5) = 3.5 + FREE
    // mark i1 d2 (0.75×1×2 = 1.5) = 5.0 → common band 1.5-7.5 (Doxa). FREE
    // share 1.5/5.0 = 30% ✓.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    specialMechanics: [{ kind: 'stagger', rungs: 1 }],
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool'],
};

/** The commons' erosion + defend hybrid: BACKFIRE plus a real Guard line, so
 *  the x4 seat can hold the wall while the drip runs. */
const soritesHalt: Card = {
    id: 'sorites-halt',
    theme: 'control',
    name: 'Sorites Halt',
    philosophicalAspect: 'body',
    description:
        'One grain is not a heap. Neither is the next. Somewhere in the ' +
        'counting their violence stopped accruing — and every denied grain ' +
        'lands inward.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: guard 4 (4÷4 = 1.0) + backfire i2 d2 (0.75×2×2 = 3.0) = 4.0 +
    // FREE mark i1 d2 (0.75×1×2 = 1.5) = 5.5 → common band 1.5-7.5 (Doxa).
    // FREE share 1.5/5.5 = 27.3% ✓.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'guard', amount: 4 }],
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool', 'defend'],
};

/** The heart-colored common the 5/5/5 color law keeps borrowing for:
 *  stagger + draw glue in control's own vocabulary. */
const buridansAss: Card = {
    id: 'buridans-ass',
    theme: 'control',
    name: "Buridan's Ass",
    philosophicalAspect: 'heart',
    description:
        'Offer two courses of exactly equal appeal. Perfect appetite, ' +
        'perfectly balanced, starves where it stands.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: STAGGER 1 (2.0) + draw 1 (2.0) = 4.0 + FREE draw 1 (2.0) = 6.0 →
    // common band 1.5-7.5 (Doxa). FREE share 2.0/6.0 = 33.3% ✓.
    free: { drawCards: 1 },
    specialMechanics: [
        { kind: 'stagger', rungs: 1 },
        { kind: 'rider', rider: { drawCards: 1 } },
    ],
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool', 'draw'],
};

/** The pure defend common: Guard on both lines with a token drip, for seeds
 *  where standstill's wall — not its denial — is the weak seat. */
const theUnmovedGate: Card = {
    id: 'the-unmoved-gate',
    theme: 'control',
    name: 'The Unmoved Gate',
    philosophicalAspect: 'body',
    description:
        'The gate does not argue. It is simply shut, and shut is a complete ' +
        'sentence.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: guard 6 (6÷4 = 1.5) + backfire i1 d2 (0.75×1×2 = 1.5) = 3.0 +
    // FREE guard 4 (4÷4 = 1.0) = 4.0 → common band 1.5-7.5 (Doxa). FREE
    // share 1.0/4.0 = 25% ✓ (window floor, deliberate: the FREE wall is the
    // point of a defend common).
    free: { guard: 4 },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    specialMechanics: [{ kind: 'guard', amount: 6 }],
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool', 'defend'],
};

/** The information common in control's OWN currency: the stance-read as the
 *  PAID line behind a small wall, with a token drip so the reading never
 *  comes up empty (FORETELL is Oracle's hallmark — not printed here). */
const akatalepsia: Card = {
    id: 'akatalepsia',
    theme: 'control',
    name: 'Akatalepsia',
    philosophicalAspect: 'mind',
    description:
        'Nothing can be known for certain — their next blow included. You, ' +
        'at least, have read the telegraph.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: reveal the next stance (1.5, control's currency) + guard 4 (4÷4 =
    // 1.0) + backfire i1 d2 (0.75×1×2 = 1.5) = 4.0 + FREE draw 1 (2.0) =
    // 6.0 → common band 1.5-7.5 (Doxa). FREE share 2.0/6.0 = 33.3% ✓.
    free: { drawCards: 1 },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    specialMechanics: [
        { kind: 'rider', rider: { revealStance: true } },
        { kind: 'guard', amount: 4 },
    ],
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool', 'information'],
};

/** The erosion common — red-herring's seat RIVAL on a real trade, not its
 *  superset: a longer, COOLER drip (i1 d3 against the library's hotter
 *  i2 d2) rides with a paid MARK to aim at, and the FREE line pays a card
 *  instead of the library's stance-read. Red-herring keeps strictly more
 *  BACKFIRE heat; this keeps the aim-point and the card. */
const theInwardBlow: Card = {
    id: 'the-inward-blow',
    theme: 'control',
    name: 'The Inward Blow',
    philosophicalAspect: 'mind',
    description:
        'A blow denied its target does not vanish. It doubles back along ' +
        'the arm that threw it — and the bruise it leaves is a target.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: backfire i1 d3 (0.75×1×3 = 2.25) + mark i1 d2 (0.75×1×2 = 1.5) =
    // 3.75 + FREE draw 1 (2.0) = 5.75 → common band 1.5-7.5 (Lemma). FREE
    // share 2.0/5.75 = 34.8% ✓.
    free: { drawCards: 1 },
    combatEffects: [
        { effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 1, duration: 3 },
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool', 'dot'],
};

/** Tempo common: a rung, a drip, and a Conviction rebate — the denial pays
 *  its own die forward. */
const movingTheGoalposts: Card = {
    id: 'moving-the-goalposts',
    theme: 'control',
    name: 'Moving the Goalposts',
    philosophicalAspect: 'mind',
    description:
        'Every time they reach the standard, the standard has moved. The ' +
        'reaching is expensive. The moving is free.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: STAGGER 1 (2.0) + backfire i1 d2 (0.75×1×2 = 1.5) + conviction 1
    // (1.0) = 4.5 + FREE mark i1 d2 (0.75×1×2 = 1.5) = 6.0 → common band
    // 1.5-7.5 (Lemma). FREE share 1.5/6.0 = 25% ✓.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    specialMechanics: [
        { kind: 'stagger', rungs: 1 },
        { kind: 'rider', rider: { conviction: 1 } },
    ],
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool'],
};

/** The cycle common: pure DRAW glue with the stance-read riding FREE, no
 *  enemy line at all — the seat for decks that stall on card flow rather
 *  than on denial. */
const epoche: Card = {
    id: 'epoche',
    theme: 'control',
    name: 'Epoche',
    philosophicalAspect: 'mind',
    description:
        'Suspend judgment. In the stillness where a verdict would have ' +
        'stood there is room to think — and think again.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: draw 2 (2×2 = 4.0) + FREE [reveal the next stance (1.5) + guard 2
    // (0.5)] = 2.0 → 6.0 → common band 1.5-7.5 (Lemma). FREE share 2.0/6.0 =
    // 33.3% ✓.
    free: { revealStance: true, guard: 2 },
    specialMechanics: [{ kind: 'rider', rider: { drawCards: 2 } }],
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool', 'draw'],
};

/** The one conditioned common (tier-1 law: at most one die line): a body
 *  dieBonus that turns the mark-and-rung play into a two-rung deny. */
const theTortoisesLead: Card = {
    id: 'the-tortoises-lead',
    theme: 'control',
    name: "The Tortoise's Lead",
    philosophicalAspect: 'body',
    description:
        'A head start of one step, held forever. Let them halve the ' +
        'distance as many times as they please.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: STAGGER 1 (2.0) + mark i1 d2 (0.75×1×2 = 1.5) = 3.5 + dieBonus
    // body [stagger 1 (2.0) ×0.6 = 1.2] + FREE draw 1 (2.0) = 6.7 → common
    // band 1.5-7.5 (Lemma). FREE share 2.0/6.7 = 29.9% ✓.
    free: { drawCards: 1 },
    combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    specialMechanics: [{ kind: 'stagger', rungs: 1 }],
    dieBonus: { onColor: 'body', rider: { stagger: 1 } },
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool'],
};

/** The second heart common: BACKFIRE behind a small wall, so the standstill
 *  recipe can fill its heart quota without borrowing off-theme. */
const thePatientNo: Card = {
    id: 'the-patient-no',
    theme: 'control',
    name: 'The Patient No',
    philosophicalAspect: 'heart',
    description:
        'Refusal, repeated calmly, outlasts insistence. Each insistence ' +
        'denied is billed to the insister.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: backfire i2 d2 (0.75×2×2 = 3.0) + guard 4 (4÷4 = 1.0) = 4.0 +
    // FREE [guard 2 (0.5) + conviction 1 (1.0)] = 1.5 → 5.5 → common band
    // 1.5-7.5 (Lemma). FREE share 1.5/5.5 = 27.3% ✓.
    free: { guard: 2, conviction: 1 },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'guard', amount: 4 }],
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool', 'defend'],
};

// ─── Uncommons (12 — rank 3-4, tier 2; the theme's engine seats) ─────────────
// Die-interaction law: each carries exactly ONE of threshold / dieBonus /
// fate / die-manipulation / react (state-predicate synergy).

/** Undistributed-middle's seat rival on a changed CONDITION axis: same
 *  stagger+backfire core, but the threshold moves to HEART and pays drip +
 *  card flow — the library's mind×3 already pays denial depth (stagger +
 *  intensity), so the A/B asks which payoff class the engine seat wants. */
const infiniteRegress: Card = {
    id: 'infinite-regress',
    theme: 'control',
    name: 'Infinite Regress',
    philosophicalAspect: 'mind',
    description:
        'Every reason requires a prior reason. Send them down after the ' +
        'first one; the ladder has no bottom rung — and now neither does ' +
        'their next action.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: STAGGER 1 (2.0) + backfire i2 d2 (0.75×2×2 = 3.0) = 5.0 +
    // threshold heart×3 [draw 1 (2.0) + backfire i1 d2 (1.5) = 3.5 ×0.5 =
    // 1.75] + FREE [reveal (1.5) + guard 4 (1.0)] = 2.5 → 9.25 → uncommon
    // band 4.5-13 (Thesis). FREE share 2.5/9.25 = 27.0% ✓.
    free: { revealStance: true, guard: 4 },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'stagger', rungs: 1 }],
    threshold: {
        color: 'heart', count: 3,
        rider: { drawCards: 1, applyEffect: { effectId: 'debuff_backfire', intensity: 1, duration: 2 } },
    },
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool'],
};

/** The REROLL valve wearing control colors: fix the miss faces, keep the
 *  long BACKFIRE running. */
const diallelus: Card = {
    id: 'diallelus',
    theme: 'control',
    name: 'Diallelus',
    philosophicalAspect: 'mind',
    description:
        'The wheel of proof turns on itself. Let them ride it in a circle ' +
        'while the toll accrues.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: REROLL miss faces (2.0) + backfire i2 d3 (0.75×2×3 = 4.5) = 6.5 +
    // FREE [mark i1 d2 (1.5) + conviction 1 (1.0)] = 2.5 → 9.0 → uncommon
    // band 4.5-13 (Thesis). FREE share 2.5/9.0 = 27.8% ✓.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 }, conviction: 1 },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 2, duration: 3 }],
    specialMechanics: [{ kind: 'reroll_spent' }],
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool', 'dice', 'valve'],
};

/** Arrow-paradox's seat rival: the stance lock and the rung, with the
 *  dieBonus paying card flow instead of a drip. */
const theLockedPremise: Card = {
    id: 'the-locked-premise',
    theme: 'control',
    name: 'The Locked Premise',
    philosophicalAspect: 'body',
    description:
        'Fix the first premise in place and the whole posture must hold ' +
        'still to keep it. Statues are easy to read.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: lock stance (2.5) + STAGGER 1 (2.0) = 4.5 + dieBonus mind [draw 1
    // (2.0) ×0.6 = 1.2] + FREE draw 1 (2.0) = 7.7 → uncommon band 4.5-13
    // (Thesis). FREE share 2.0/7.7 = 26.0% ✓.
    free: { drawCards: 1 },
    specialMechanics: [{ kind: 'lock_stance' }, { kind: 'stagger', rungs: 1 }],
    dieBonus: { onColor: 'mind', rider: { drawCards: 1 } },
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool'],
};

/** The react engine card: if you blanked them last round, the trilemma pays
 *  a card and a die forward — denial converting into tempo. */
const agrippasTrilemma: Card = {
    id: 'agrippas-trilemma',
    theme: 'control',
    name: "Agrippa's Trilemma",
    philosophicalAspect: 'mind',
    description:
        'Regress, circle, or dogma: three exits, all shut. A round spent ' +
        'hunting the fourth is a round spent going nowhere — your round, ' +
        'banked.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: STAGGER 1 (2.0) + backfire i2 d2 (0.75×2×2 = 3.0) = 5.0 + react
    // [enemy dealt no damage last round → draw 1 (2.0) + conviction 1 (1.0)
    // = 3.0 ×0.5 = 1.5] + FREE [draw 1 (2.0) + guard 2 (0.5)] = 2.5 → 9.0 →
    // uncommon band 4.5-13 (Theorem). FREE share 2.5/9.0 = 27.8% ✓.
    free: { drawCards: 1, guard: 2 },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'stagger', rungs: 1 }],
    synergy: {
        statePredicate: { kind: 'enemy-dealt-no-damage-last-round' },
        rider: { drawCards: 1, conviction: 1 },
    },
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool', 'react'],
};

/** The fate uncommon: the impossible die assumes the conclusion — a free
 *  rung and a hotter drip, paid for in blood. */
const petitioPrincipii: Card = {
    id: 'petitio-principii',
    theme: 'control',
    name: 'Petitio Principii',
    philosophicalAspect: 'heart',
    description:
        'Assume the conclusion, and the argument arrives already finished. ' +
        'The impossible die makes the assumption for you.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: backfire i2 d2 (0.75×2×2 = 3.0) + guard 4 (4÷4 = 1.0) = 4.0 +
    // fate [stagger 1 (2.0) + backfire i1 d2 (1.5) = 3.5 ×0.7 = 2.45,
    // recoil 2 → −2×(1/3)×0.75 = −0.5 → +1.95] + FREE [conviction 1 (1.0) +
    // guard 4 (1.0)] = 2.0 → 7.95 → uncommon band 4.5-13 (Thesis). FREE
    // share 2.0/7.95 = 25.2% ✓.
    free: { conviction: 1, guard: 4 },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'guard', amount: 4 }],
    fate: {
        rider: { stagger: 1, applyEffect: { effectId: 'debuff_backfire', intensity: 1, duration: 2 } },
        recoilHp: 2,
    },
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool', 'fate'],
};

/** The two-rung deny with the BANK valve: the die that stripped the action
 *  waits in the Reserve for the bigger turn. */
const stadiumParadox: Card = {
    id: 'stadium-paradox',
    theme: 'control',
    name: 'Stadium Paradox',
    philosophicalAspect: 'body',
    description:
        'Two rows pass each other and the count of moments will not agree. ' +
        'While the arithmetic quarrels, the die waits in the rack.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: BANK the powering die (2.0) + STAGGER 2 (2×2 = 4.0) = 6.0 + FREE
    // [guard 4 (1.0) + conviction 1 (1.0)] = 2.0 → 8.0 → uncommon band
    // 4.5-13 (Theorem). FREE share 2.0/8.0 = 25% ✓.
    free: { guard: 4, conviction: 1 },
    specialMechanics: [{ kind: 'bank_spent_die' }, { kind: 'stagger', rungs: 2 }],
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool', 'dice', 'valve'],
};

/** The information engine uncommon in legal vocabulary: the stance-read
 *  rides the pool's hottest drip, and the mind threshold converts the
 *  reading into card flow (control reads the BOARD; deck-reading FORETELL
 *  is Oracle's hallmark and stays there). */
const theSeenBlow: Card = {
    id: 'the-seen-blow',
    theme: 'control',
    name: 'The Seen Blow',
    philosophicalAspect: 'mind',
    description:
        'A blow read three moves early is not a blow. It is a diagram — ' +
        'study it, and bill the author.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: reveal the next stance (1.5) + backfire i2 d3 (0.75×2×3 = 4.5) =
    // 6.0 + threshold mind×2 [draw 1 (2.0) ×0.5 = 1.0] + FREE [draw 1 (2.0)
    // + guard 2 (0.5)] = 2.5 → 9.5 → uncommon band 4.5-13 (Thesis). FREE
    // share 2.5/9.5 = 26.3% ✓.
    free: { drawCards: 1, guard: 2 },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 2, duration: 3 }],
    specialMechanics: [{ kind: 'rider', rider: { revealStance: true } }],
    threshold: { color: 'mind', count: 2, rider: { drawCards: 1 } },
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool', 'information'],
};

/** The card-flow engine: REFRESH the die and draw into it — control's
 *  action economy, the paid line never touching the enemy. FREE carries the
 *  theme's information currency (revealStance), not Oracle's FORETELL. */
const theNarrowingPath: Card = {
    id: 'the-narrowing-path',
    theme: 'control',
    name: 'The Narrowing Path',
    philosophicalAspect: 'mind',
    description:
        'Foreclose the side roads one by one until only your road remains. ' +
        'Then walk it twice.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts: REFRESH the powering die (2.0) + draw 2 (2×2 = 4.0) = 6.0 + FREE
    // [reveal the next stance (1.5) + mark i1 d1 (0.75×1×1 = 0.75)] = 2.25 →
    // 8.25 → uncommon band 4.5-13 (Theorem). FREE share 2.25/8.25 = 27.3% ✓.
    free: { revealStance: true, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 } },
    specialMechanics: [{ kind: 'refresh_die' }, { kind: 'rider', rider: { drawCards: 2 } }],
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool', 'dice', 'valve', 'draw'],
};

/** The heart engine uncommon: a wall that pays BACKFIRE when the wall
 *  already worked — react doubles the drip after a blanked round. */
const theColdGallery: Card = {
    id: 'the-cold-gallery',
    theme: 'control',
    name: 'The Cold Gallery',
    philosophicalAspect: 'heart',
    description:
        'An audience that will not gasp. Perform to stone long enough and ' +
        'the performance turns on the performer.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: backfire i2 d3 (0.75×2×3 = 4.5) + guard 4 (4÷4 = 1.0) = 5.5 +
    // react [enemy dealt no damage last round → backfire i2 d2 (3.0) ×0.5 =
    // 1.5] + FREE [guard 6 (1.5) + conviction 1 (1.0)] = 2.5 → 9.5 →
    // uncommon band 4.5-13 (Theorem). FREE share 2.5/9.5 = 26.3% ✓.
    free: { guard: 6, conviction: 1 },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 2, duration: 3 }],
    specialMechanics: [{ kind: 'guard', amount: 4 }],
    synergy: {
        statePredicate: { kind: 'enemy-dealt-no-damage-last-round' },
        rider: { applyEffect: { effectId: 'debuff_backfire', intensity: 2, duration: 2 } },
    },
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool', 'react', 'defend'],
};

/** The quiet heart cycler: small drip, small wall, cards on every line —
 *  the glue seat for a standstill that keeps running out of hand. */
const quietism: Card = {
    id: 'quietism',
    theme: 'control',
    name: 'Quietism',
    philosophicalAspect: 'heart',
    description:
        'Say less. Want less. The argument never offered cannot be seized, ' +
        'and their grip closes on air, again.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: draw 1 (2.0) + backfire i1 d3 (0.75×1×3 = 2.25) + guard 3 (3÷4 =
    // 0.75) = 5.0 + dieBonus heart [draw 1 (2.0) ×0.6 = 1.2] + FREE [draw 1
    // (2.0) + guard 2 (0.5)] = 2.5 → 8.7 → uncommon band 4.5-13 (Thesis).
    // FREE share 2.5/8.7 = 28.7% ✓.
    free: { drawCards: 1, guard: 2 },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 1, duration: 3 }],
    specialMechanics: [{ kind: 'guard', amount: 3 }, { kind: 'rider', rider: { drawCards: 1 } }],
    dieBonus: { onColor: 'heart', rider: { drawCards: 1 } },
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool', 'draw'],
};

/** The rung-heavy body uncommon: two rungs up front, a third on the body
 *  threshold — the hard-deny engine seat. */
const theShutDoor: Card = {
    id: 'the-shut-door',
    theme: 'control',
    name: 'The Shut Door',
    philosophicalAspect: 'body',
    description:
        'Some questions end conversations. Shut the door mid-swing; ' +
        'whatever was arriving stays outside with the rest of the weather.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: STAGGER 2 (2×2 = 4.0) + backfire i1 d2 (0.75×1×2 = 1.5) = 5.5 +
    // threshold body×3 [stagger 1 (2.0) ×0.5 = 1.0] + FREE [guard 4 (1.0) +
    // reveal (1.5)] = 2.5 → 9.0 → uncommon band 4.5-13 (Theorem). FREE
    // share 2.5/9.0 = 27.8% ✓.
    free: { guard: 4, revealStance: true },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 1, duration: 2 }],
    specialMechanics: [{ kind: 'stagger', rungs: 2 }],
    threshold: { color: 'body', count: 3, rider: { stagger: 1 } },
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool'],
};

/** Break-the-tempo's seat rival on the PAYOFF-CLASS axis, not its superset:
 *  the same CONVERT valve, but the rung is traded for the theme's erosion
 *  drip — valve+drip here against the library's valve+rung — with the
 *  stance-read (control's information currency, not Oracle's FORETELL)
 *  riding FREE. */
const theForeclosedFuture: Card = {
    id: 'the-foreclosed-future',
    theme: 'control',
    name: 'The Foreclosed Future',
    philosophicalAspect: 'mind',
    description:
        'What will be was decided before they drew breath to object. ' +
        'Recolor the present to match; the objection is already billed, ' +
        'round by round.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: CONVERT the powering die to WILD (2.5) + backfire i2 d3
    // (0.75×2×3 = 4.5) = 7.0 + FREE [reveal the next stance (1.5) + mark i1
    // d2 (1.5)] = 3.0 → 10.0 → uncommon band 4.5-13 (Theorem). FREE share
    // 3.0/10.0 = 30% ✓.
    free: { revealStance: true, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 2, duration: 3 }],
    specialMechanics: [{ kind: 'convert_die_color' }],
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool', 'dice', 'valve'],
};

// ─── Rares (8 — rank 5-6, tier 2-3; finishers and build-arounds) ─────────────

/** Turnabout's seat rival on the TEMPO-vs-TOTAL axis: a smaller BACKFIRE-ALL
 *  cash-out (1.0 per rung against the library's 1.5) that pays an
 *  unconditional draw + Guard on the same turn — the audit that keeps the
 *  office open — plus a threshold rung to seed the NEXT ledger. At the
 *  expected ~20-rung bank the A/B is real: turnabout bursts ~10 HP harder;
 *  this cashes smaller but restocks the hand and holds the wall. Prior art
 *  for the banked-counter shape AND the draw-dividend-on-cash-out:
 *  kb:dawncaster/keywords/momentum.okf.md (src-001, community, medium) —
 *  theirs auto-cashes at a threshold and pays a card draw; the dividend
 *  shape transfers, the magnitudes do not. */
const theCollectedToll: Card = {
    id: 'the-collected-toll',
    theme: 'control',
    name: 'The Collected Toll',
    philosophicalAspect: 'mind',
    description:
        'Collect most of the debt in one visit. A careful creditor leaves ' +
        'the debtor standing, the ledger open, and the door already closing ' +
        'again.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    // pts: TURNABOUT (5.0, the ALL-spender base) + 1.0 burst per rung ×
    // expected ~20-rung bank ÷ 3 (dotLifetimeDivisor) = 6.67 → 11.67 +
    // rider [draw 1 (2.0) + guard 4 (4÷4 = 1.0)] = 3.0 → 14.67 + threshold
    // mind×4 [stagger 1 (2.0) ×0.5 = 1.0] + FREE reveal (1.5) = 17.17 →
    // rare band 7-19 (Aporia). FREE share 1.5/17.17 = 8.7% —
    // intentionallyAsymmetric: a paid-only finisher (turnabout precedent);
    // its FREE line is the theme's information currency, not a second
    // payload.
    intentionallyAsymmetric: true,
    free: { revealStance: true },
    specialMechanics: [
        { kind: 'turnabout', burstPerRung: 1.0 },
        { kind: 'rider', rider: { drawCards: 1, guard: 4 } },
    ],
    threshold: { color: 'mind', count: 4, rider: { stagger: 1 } },
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool', 'payoff'],
};

/** The hard-deny rare: three rungs and a stance lock in one play — the
 *  "this phase simply does not happen" spike. */
const theGreatStillness: Card = {
    id: 'the-great-stillness',
    theme: 'control',
    name: 'The Great Stillness',
    philosophicalAspect: 'mind',
    description:
        'First the hands stop. Then the stance sets. What remains is a ' +
        'portrait titled Intent, hung where the action used to be.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: STAGGER 3 (3×2 = 6.0) + lock stance (2.5) = 8.5 + threshold
    // mind×4 [stagger 1 (2.0) ×0.5 = 1.0] + FREE [reveal (1.5) + draw 1
    // (2.0)] = 3.5 → 13.0 → rare band 7-19 (Axiom). FREE share 3.5/13.0 =
    // 26.9% ✓.
    free: { revealStance: true, drawCards: 1 },
    specialMechanics: [{ kind: 'lock_stance' }, { kind: 'stagger', rungs: 3 }],
    threshold: { color: 'mind', count: 4, rider: { stagger: 1 } },
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool'],
};

/** The BACKFIRE build-around: the hottest drip in the pool, and blanking
 *  the enemy re-fuels it — the erosion engine as a rare. */
const everyDoorAWall: Card = {
    id: 'every-door-a-wall',
    theme: 'control',
    name: 'Every Door a Wall',
    philosophicalAspect: 'body',
    description:
        'They will try every exit in order, and the order is: wall, wall, ' +
        'wall. Each attempt is invoiced in full.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: backfire i3 d3 (0.75×3×3 = 6.75) + STAGGER 1 (2.0) = 8.75 +
    // react [enemy dealt no damage last round → backfire i1 d3 (2.25) ×0.5
    // = 1.125] + FREE [guard 6 (1.5) + draw 1 (2.0)] = 3.5 → 13.375 → rare
    // band 7-19 (Axiom). FREE share 3.5/13.375 = 26.2% ✓.
    free: { guard: 6, drawCards: 1 },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 3, duration: 3 }],
    specialMechanics: [{ kind: 'stagger', rungs: 1 }],
    synergy: {
        statePredicate: { kind: 'enemy-dealt-no-damage-last-round' },
        rider: { applyEffect: { effectId: 'debuff_backfire', intensity: 1, duration: 3 } },
    },
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool', 'react', 'dot'],
};

/** The information build-around in control's OWN currency: total sight of
 *  the BOARD — the stance-read plus the deepest draw in the pool — while
 *  the drip keeps the clock honest. Deck-reading FORETELL is Oracle's
 *  hallmark (docs/keyword-atlas.md registry) and does not print here. */
const laplacesDemon: Card = {
    id: 'laplaces-demon',
    theme: 'control',
    name: "Laplace's Demon",
    philosophicalAspect: 'mind',
    description:
        'Grant an intellect the present entire, and the future is mere ' +
        'bookkeeping. Read their next round off a ledger written at the ' +
        'beginning of the world.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: reveal the next stance (1.5) + draw 3 (3×2 = 6.0) + backfire i2
    // d2 (0.75×2×2 = 3.0) = 10.5 + dieBonus mind [draw 1 (2.0) ×0.6 = 1.2]
    // + FREE draw 2 (2×2 = 4.0) → 15.7 → rare band 7-19 (Axiom). FREE share
    // 4.0/15.7 = 25.5% ✓.
    free: { drawCards: 2 },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'rider', rider: { revealStance: true, drawCards: 3 } }],
    dieBonus: { onColor: 'mind', rider: { drawCards: 1 } },
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool', 'information', 'draw'],
};

/** The heart finisher: a two-rung deny on a fate line — the X die spends
 *  blood to make the refusal total. */
const theFinalRefusal: Card = {
    id: 'the-final-refusal',
    theme: 'control',
    name: 'The Final Refusal',
    philosophicalAspect: 'heart',
    description:
        'No — said once more, said last. It costs something to make a word ' +
        'that heavy, and it lands on them heavier.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: STAGGER 2 (2×2 = 4.0) + backfire i2 d3 (0.75×2×3 = 4.5) = 8.5 +
    // fate [stagger 1 (2.0) ×0.7 = 1.4, recoil 3 → −3×(1/3)×0.75 = −0.75 →
    // +0.65] + FREE [guard 4 (1.0) + conviction 1 (1.0) + reveal (1.5)] =
    // 3.5 → 12.65 → rare band 7-19 (Axiom). FREE share 3.5/12.65 = 27.7% ✓.
    free: { guard: 4, conviction: 1, revealStance: true },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 2, duration: 3 }],
    specialMechanics: [{ kind: 'stagger', rungs: 2 }],
    fate: { rider: { stagger: 1 }, recoilHp: 3 },
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool', 'fate'],
};

/** The thesis rare: the full deny suite in one card — rungs, lock, drip —
 *  with the mind threshold paying rung + card. Tier 3: late-stage-gated
 *  by design. */
const motionIsImpossible: Card = {
    id: 'motion-is-impossible',
    theme: 'control',
    name: 'Motion Is Impossible',
    philosophicalAspect: 'mind',
    description:
        'Zeno was not warning you. He was instructing you. The distance ' +
        'halves forever; the blow arrives never; the proof collects its fee.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    // pts: STAGGER 2 (2×2 = 4.0) + lock stance (2.5) + backfire i2 d2
    // (0.75×2×2 = 3.0) = 9.5 + threshold mind×4 [stagger 1 (2.0) + draw 1
    // (2.0) = 4.0 ×0.5 = 2.0] + FREE [draw 1 (2.0) + reveal (1.5) + guard 2
    // (0.5)] = 4.0 → 15.5 → rare band 7-19 (Aporia). FREE share 4.0/15.5 =
    // 25.8% ✓.
    free: { drawCards: 1, revealStance: true, guard: 2 },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 2, duration: 2 }],
    specialMechanics: [{ kind: 'lock_stance' }, { kind: 'stagger', rungs: 2 }],
    threshold: { color: 'mind', count: 4, rider: { stagger: 1, drawCards: 1 } },
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool'],
};

/** The wall build-around: the biggest Guard in the pool behind a hot drip
 *  and a banked die — the fortress version of standstill's win. */
const stalemate: Card = {
    id: 'stalemate',
    theme: 'control',
    name: 'Stalemate',
    philosophicalAspect: 'body',
    description:
        'A position with no legal moves is not a pause — it is a verdict. ' +
        'Wall the board, keep a die in reserve, and let their clock run.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: guard 10 (10÷4 = 2.5) + backfire i3 d2 (0.75×3×2 = 4.5) +
    // STAGGER 1 (2.0) + BANK the powering die (2.0) = 11.0 + FREE [guard 6
    // (1.5) + reveal (1.5) + conviction 1 (1.0)] = 4.0 → 15.0 → rare band
    // 7-19 (Axiom). FREE share 4.0/15.0 = 26.7% ✓.
    free: { guard: 6, revealStance: true, conviction: 1 },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 3, duration: 2 }],
    specialMechanics: [
        { kind: 'guard', amount: 10 },
        { kind: 'stagger', rungs: 1 },
        { kind: 'bank_spent_die' },
    ],
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool', 'defend', 'dice', 'valve'],
};

/** The react build-around: the deny-streak payoff — every blanked round
 *  makes the next denial bigger. Tier 3: the pool's third and last
 *  late-gated card. */
const proofByExhaustion: Card = {
    id: 'proof-by-exhaustion',
    theme: 'control',
    name: 'Proof by Exhaustion',
    philosophicalAspect: 'heart',
    description:
        'Check every case. Deny every case. When the last case closes, what ' +
        'is left standing is you — and the ledger they fed all night.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: backfire i2 d3 (0.75×2×3 = 4.5) + STAGGER 1 (2.0) = 6.5 + react
    // [enemy dealt no damage last round → stagger 1 (2.0) + draw 1 (2.0) +
    // backfire i1 d2 (1.5) = 5.5 ×0.5 = 2.75] + FREE [reveal (1.5) + guard
    // 2 (0.5) + mark i1 d2 (1.5)] = 3.5 → 12.75 → rare band 7-19 (Axiom).
    // FREE share 3.5/12.75 = 27.5% ✓.
    free: { revealStance: true, guard: 2, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } },
    combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 2, duration: 3 }],
    specialMechanics: [{ kind: 'stagger', rungs: 1 }],
    synergy: {
        statePredicate: { kind: 'enemy-dealt-no-damage-last-round' },
        rider: {
            stagger: 1,
            drawCards: 1,
            applyEffect: { effectId: 'debuff_backfire', intensity: 1, duration: 2 },
        },
    },
    addedIn: '2026-07-18',
    tags: ['control', 'swap-pool', 'react', 'payoff'],
};

// ─── The set ─────────────────────────────────────────────────────────────────

export const SWAP_POOL_CONTROL: SandboxCardSet = {
    id: 'swap-control',
    name: 'Swap pool: control',
    description:
        'Thirty new control spells for the standstill preset\'s swap seats: ' +
        'commons probe cheaper x4 carriers for the STAGGER/BACKFIRE core ' +
        '(plus native heart-colored options for the 5/5/5 color law), ' +
        'uncommons probe which engine — rung denial, BACKFIRE erosion, ' +
        'stance-read/DRAW flow, or deny-react payoffs — the recipe actually ' +
        'needs, and rares A/B alternative finishers against turnabout, ' +
        'including a tempo-variant BACKFIRE-ALL cash-out and a deny-streak ' +
        'build-around.',
    cards: [
        // commons (10)
        isosthenia, soritesHalt, buridansAss, theUnmovedGate, akatalepsia,
        theInwardBlow, movingTheGoalposts, epoche, theTortoisesLead, thePatientNo,
        // uncommons (12)
        infiniteRegress, diallelus, theLockedPremise, agrippasTrilemma,
        petitioPrincipii, stadiumParadox, theSeenBlow, theNarrowingPath,
        theColdGallery, quietism, theShutDoor, theForeclosedFuture,
        // rares (8)
        theCollectedToll, theGreatStillness, everyDoorAWall, laplacesDemon,
        theFinalRefusal, motionIsImpossible, stalemate, proofByExhaustion,
    ],
};
