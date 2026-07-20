/**
 * Swap pool — ECHO (preset `refrain`), 30 new sandbox spells.
 *
 * Owner-ratified 2026-07-18: per-theme swap pools exist ONLY as /deck-tuning
 * swap candidates for the 15-card preset recipe (4×2 commons, 2×2 uncommons,
 * 1×3 rares). NOT player-facing, NOT in presets, NOT in `cards.library.ts`.
 *
 * Vocabulary: the echo hallmarks (ECHO, RECALL) + the family utilities
 * (DRAW, MILL — echo's loop currency, phase 30) + the generic utility verbs
 * the 7 library echo cards already lean on (MARK, small POISON lines — the
 * `refrain` precedent, GUARD/HEAL, Conviction, MARK detonation via
 * `ruptureMarks` — the `second-thoughts`/`ouroboros` precedent, and REFRESH,
 * echo's assigned dice valve — the `second-take` precedent). No neighbor
 * hallmarks, no new mechanics kinds, no new keywords.
 *
 * Condition-line law (adversarial review, 2026-07-18): spec 32 §2 governs —
 * AT MOST one condition line per card (threshold / dieBonus / fate /
 * synergy state-predicate; the engine treats a synergy predicate as the
 * same conditional-gate class). Four cards here ride a synergy line as
 * their single gate and carry no die-facing line — spec-legal. A stricter
 * "die line on every tier-2+ card" law would be a spec amendment (owner
 * call), not a pool fix.
 *
 * Detonator law (same review): a `ruptureMarks` closer consumes
 * PRE-EXISTING marks only — any same-card re-plant rides a rider inserted
 * AFTER the closer (the `a-sweeter-poison` rider-order precedent), and an
 * ECHO card never carries its own plant in `combatEffects` (the echo pass
 * would double-feed the closer). Every detonator below follows it.
 *
 * Prior art (Dawncaster, community corpus — leads, not canon):
 * - kb:dawncaster/keywords/echo.okf.md (src-001): a literal Echo keyword —
 *   "cast twice when played from your hand" — with only 4 carriers in 1,692
 *   cards (3 Common, 1 Legendary): the genre keeps the flat double SCARCE and
 *   mostly small. This pool follows that economy: many small echoed lines at
 *   common, few big ones at rare.
 * - kb:dawncaster/cards/1197-recycle-460721.okf.md: "Return a card from your
 *   discard pile to your hand" ships at COMMON — RECALL-at-common is genre-
 *   honest carrier density, so the pool keeps a common RECALL seat candidate.
 * - kb:dawncaster/keywords/ancestral.okf.md + keywords/bury.okf.md: the
 *   discard pile as a COUNTED resource and mill (Bury, 31 carriers) as a
 *   mainstream deck-management verb — the frame behind every FREE MILL line
 *   here (advance the loop without drawing).
 */

import type { Card } from '../types';
import type { SandboxCardSet } from '../cards.sandbox-sets';

// ─── Commons (10) — simple, reliable, ×4-seat candidates ─────────────────────

/** Told Twice — the pure-poison ECHO common: refrain's seat with the MARK
 *  stripped out. Probes whether the x4 seat wants one clean DoT said twice
 *  instead of refrain's two-status spread. */
const toldTwice: Card = {
    id: 'told-twice',
    theme: 'echo',
    name: 'Told Twice',
    philosophicalAspect: 'mind',
    description:
        'The first telling plants it. The second telling proves it was ' +
        'always there. After that it does its own arguing.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i1 d2 (card-played clock 1.83, tempo-weighted 6.4 ÷ 3 =
    // 2.14) × ECHO 1.8 = 3.84 + FREE [mark i1 d1 (0.75) + MILL 1 (1.0)] =
    // 1.75 → 5.59 → common band 1.5-7.5 (Doxa). FREE share 1.75/5.59 = 31.3%.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 }, millCards: 1 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    specialMechanics: [{ kind: 'echo' }],
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'dot'],
};

/** The Naming, Repeated — the MARK stacker common: no DoT, just the flaw
 *  named twice over and a little steadiness. Feeds every detonator in the
 *  pool; probes a payoff-fuel x4 seat. */
const theNamingRepeated: Card = {
    id: 'the-naming-repeated',
    theme: 'echo',
    name: 'The Naming, Repeated',
    philosophicalAspect: 'heart',
    description:
        'Name the flaw once and it is an accusation. Name it again, ' +
        'unhurried, and it becomes the thing everyone already knew.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts: mark i2 d2 (0.75×2×2 = 3.0) + conviction 1 (1.0) = 4.0 + FREE
    // [mark i1 d1 (0.75) + MILL 1 (1.0)] = 1.75 → 5.75 → common band 1.5-7.5
    // (Doxa). FREE share 1.75/5.75 = 30.4%.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 }, millCards: 1 },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 2 },
    ],
    specialMechanics: [{ kind: 'rider', rider: { conviction: 1 } }],
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'exposure'],
};

/** Murmur of Pages — the cycle common: draw one, feed the songbook two.
 *  Pure loop glue; probes whether refrain wants a dedicated mill/draw seat
 *  at common instead of riding FREE lines alone. */
const murmurOfPages: Card = {
    id: 'murmur-of-pages',
    theme: 'echo',
    name: 'Murmur of Pages',
    philosophicalAspect: 'mind',
    description:
        'What is read aloud is kept. What is set down is not lost — it is ' +
        'waiting its turn to be said again.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: draw 1 (2.0) + MILL 2 (2.0) = 4.0 + FREE [MILL 1 (1.0) +
    // conviction 1 (1.0)] = 2.0 → 6.0 → common band 1.5-7.5 (Doxa). FREE
    // share 2.0/6.0 = 33.3%.
    free: { millCards: 1, conviction: 1 },
    specialMechanics: [{ kind: 'rider', rider: { drawCards: 1, millCards: 2 } }],
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'draw'],
};

/** A Breath Kept — the plain defend common (the pool's mandatory defend
 *  line): guard and a small mend, no conditions. The reliable brace for the
 *  x4 seat when the matrix says refrain dies too fast. */
const aBreathKept: Card = {
    id: 'a-breath-kept',
    theme: 'echo',
    name: 'A Breath Kept',
    philosophicalAspect: 'body',
    description:
        'Between the verse and its return there is a rest. Stand in it. ' +
        'Nothing said against you lands on a held breath.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: GUARD 8 (8 ÷ 4 = 2.0) + heal 3 (3 ÷ 3 = 1.0) = 3.0 + FREE
    // [guard 2 (0.5) + MILL 1 (1.0)] = 1.5 → 4.5 → common band 1.5-7.5
    // (Doxa). FREE share 1.5/4.5 = 33.3%.
    free: { guard: 2, millCards: 1 },
    specialMechanics: [
        { kind: 'guard', amount: 8 },
        { kind: 'rider', rider: { healHp: 3 } },
    ],
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'defend'],
};

/** Call and Response — the long-mark hallmark carrier: one deep MARK said
 *  twice, and a FREE face that plants instead of milling. Differentiated
 *  from `refrain` (adversarial review 2026-07-18 — the first cut was
 *  refrain-minus-a-line, no A/B signal): no poison, a d3 mark, a mark-FREE.
 *  Probes whether the x4 seat wants a pure exposure carrier over refrain's
 *  two-status spread. */
const callAndResponse: Card = {
    id: 'call-and-response',
    theme: 'echo',
    name: 'Call and Response',
    philosophicalAspect: 'heart',
    description:
        'Say it to them. Let the room say it back. A claim with a chorus ' +
        'needs no evidence — only timing.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: mark i1 d3 (0.75 × 1 × 3 = 2.25) × ECHO 1.8 = 4.05 + FREE mark i1
    // d2 (1.5) = 5.55 → common band 1.5-7.5 (Lemma). FREE share 1.5/5.55 =
    // 27.0%.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 3 },
    ],
    specialMechanics: [{ kind: 'echo' }],
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'exposure'],
};

/** The Shield, Restated — the echoed defend: GUARD said twice (8 → 16 on the
 *  PAID face). Probes whether echo's defense wants to run through the
 *  hallmark rather than beside it. */
const theShieldRestated: Card = {
    id: 'the-shield-restated',
    theme: 'echo',
    name: 'The Shield, Restated',
    philosophicalAspect: 'body',
    description:
        'A defense given once is a plea. Given twice, in the same words, ' +
        'it is a wall — and walls do not ask to be believed.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: GUARD 8 (8 ÷ 4 = 2.0) × ECHO 1.8 = 3.6 + FREE [guard 2 (0.5) +
    // MILL 1 (1.0)] = 1.5 → 5.1 → common band 1.5-7.5 (Lemma). FREE share
    // 1.5/5.1 = 29.4%.
    free: { guard: 2, millCards: 1 },
    specialMechanics: [
        { kind: 'guard', amount: 8 },
        { kind: 'echo' },
    ],
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'defend'],
};

/** The Line That Lingers — the long-DoT common with the pool's one common
 *  dieBonus: a 3-turn poison that lingers a turn longer on a matched die.
 *  Tier-1 may carry one die line (spec 31 §4.1). */
const theLineThatLingers: Card = {
    id: 'the-line-that-lingers',
    theme: 'echo',
    name: 'The Line That Lingers',
    philosophicalAspect: 'mind',
    description:
        'Some sentences end and are gone. This one ends and stays in the ' +
        'room, working, long after politeness says it should have died.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i1 d3 (card-played clock, tempo-weighted 9.5 ÷ 3 = 3.16) +
    // dieBonus match [bonusDuration 1 (1.0)] × 0.6 = 0.6 + FREE mark i1 d2
    // (1.5) → 5.26 → common band 1.5-7.5 (Lemma). FREE share 1.5/5.26 = 28.5%.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 3 },
    ],
    dieBonus: { onColor: 'match', rider: { bonusDuration: 1 } },
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'dot'],
};

/** Taken Back Up — the plain RECALL common (Dawncaster's Recycle ships this
 *  at common — kb:dawncaster/cards/1197-recycle-460721.okf.md): pull one card
 *  back and mark the foe. Direct A/B against second-thoughts' seat. */
const takenBackUp: Card = {
    id: 'taken-back-up',
    theme: 'echo',
    name: 'Taken Back Up',
    philosophicalAspect: 'mind',
    description:
        'Nothing in the pile is finished. It was set down, not surrendered ' +
        '— and what is taken back up returns knowing where it cut.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: RECALL 1 (2.0) + mark i1 d2 (1.5) = 3.5 + FREE [mark i1 d1
    // (0.75) + MILL 1 (1.0)] = 1.75 → 5.25 → common band 1.5-7.5 (Lemma).
    // FREE share 1.75/5.25 = 33.3%.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 }, millCards: 1 },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    specialMechanics: [{ kind: 'reprise', count: 1 }],
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'recursion'],
};

/** The Point Lands — the small MARK detonator at common: cash the board's
 *  ledger at 2 per stack, THEN re-file the flaw for the next pass. Rider
 *  order is engine order (the a-sweeter-poison precedent): the closer
 *  consumes PRE-EXISTING marks only — on a clean board it is silence, not a
 *  strike in disguise — and the trailing plant seeds the NEXT detonator,
 *  never this one. Gives the x4 seats a payoff line so the engine is not
 *  rare-gated. */
const thePointLands: Card = {
    id: 'the-point-lands',
    theme: 'echo',
    name: 'The Point Lands',
    philosophicalAspect: 'heart',
    description:
        'Repetition is patient work: each pass files the same groove ' +
        'deeper. Then, one day, the point does not glance off.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: closer ruptureMarks 2 (2 × 2/3 = 1.33 — the expected-PRE-EXISTING-
    // stacks convention, honest now that the plant trails) + trailing plant
    // mark i2 d2 (3.0) = 4.33 + FREE [mark i1 d1 (0.75) + MILL 1 (1.0)] =
    // 1.75 → 6.08 → common band 1.5-7.5 (Lemma). FREE share 1.75/6.08 = 28.8%.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 }, millCards: 1 },
    specialMechanics: [
        { kind: 'rider', rider: { ruptureMarks: 2 } },
        { kind: 'rider', rider: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 2 } } },
    ],
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'payoff'],
};

/** One More Bar — the REFRESH valve competitor for second-take's seat: same
 *  die back, poison instead of mark. Probes which payload the valve seat
 *  wants under the Upgradeable-Dice flag. */
const oneMoreBar: Card = {
    id: 'one-more-bar',
    theme: 'echo',
    name: 'One More Bar',
    philosophicalAspect: 'mind',
    description:
        'The song was not done with that breath. Take the phrase again ' +
        'from the top — the poison in it does not mind being sung twice.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: REFRESH the powering die (2.0) + poison i1 d2 (tempo-weighted
    // 6.4 ÷ 3 = 2.14) = 4.14 + FREE [mark i1 d1 (0.75) + MILL 1 (1.0)] =
    // 1.75 → 5.88 → common band 1.5-7.5 (Lemma). FREE share 1.75/5.88 = 29.7%.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 }, millCards: 1 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    specialMechanics: [{ kind: 'refresh_die' }],
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'dice', 'dot'],
};

// ─── Uncommons (12) — the theme's engine ─────────────────────────────────────

/** In Other Words — the ad-nauseam identity recovered from spec 32 T10 (the
 *  seat second-take displaced): your next spell gains ECHO, a matched mind
 *  die pays a card. The deferred-echo engine at Thesis. */
const inOtherWords: Card = {
    id: 'in-other-words',
    theme: 'echo',
    name: 'In Other Words',
    philosophicalAspect: 'mind',
    description:
        'Restatement is not repetition — so the restater insists. Whatever ' +
        'is said next will arrive already agreeing with itself.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: your next spell gains ECHO (4.0) + dieBonus mind [draw 1 (2.0)] ×
    // 0.6 = 1.2 + FREE [mark i1 d2 (1.5) + MILL 1 (1.0)] = 2.5 → 7.7 →
    // uncommon band 4.5-13 (Thesis). FREE share 2.5/7.7 = 32.5%.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 }, millCards: 1 },
    specialMechanics: [{ kind: 'echo_next_spell' }],
    dieBonus: { onColor: 'mind', rider: { drawCards: 1 } },
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'engine'],
};

/** The Second Telling — the two-status ECHO mid-card: refrain grown up.
 *  Poison and mark, both said twice, harder on a matched die. */
const theSecondTelling: Card = {
    id: 'the-second-telling',
    theme: 'echo',
    name: 'The Second Telling',
    philosophicalAspect: 'mind',
    description:
        'The first telling is contested. The second is corroborated — by ' +
        'the first. That is not a flaw in the method; it is the method.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: [poison i1 d2 (2.14) + mark i1 d2 (1.5)] × ECHO 1.8 = 6.54 +
    // dieBonus match [bonusIntensity 1 (1.5)] × 0.6 = 0.9 + FREE [MILL 2
    // (2.0) + mark i1 d2 (1.5)] = 3.5 → 10.94 → uncommon band 4.5-13
    // (Theorem). FREE share 3.5/10.94 = 32.0%.
    free: { millCards: 2, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 },
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    specialMechanics: [{ kind: 'echo' }],
    dieBonus: { onColor: 'match', rider: { bonusIntensity: 1 } },
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'dot'],
};

/** Word for Word — the RECALL engine card: the reprised card's FREE line
 *  fires now (circular-reasoning's trick at the same rank — Theorem — but
 *  condition-gated and mark-carrying), and playing it as the closing word
 *  pays a draw. */
const wordForWord: Card = {
    id: 'word-for-word',
    theme: 'echo',
    name: 'Word for Word',
    philosophicalAspect: 'mind',
    description:
        'Quote it back exactly. Not the spirit of the thing — the letters ' +
        'of it, in order, so the pile itself testifies for you.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: RECALL 1 + its FREE line fires now (2.0 + 1.5) + mark i1 d2 (1.5)
    // = 5.0 + FINALE (≤2 left) rider [draw 1 (2.0) + conviction 1 (1.0)] ×
    // 0.5 = 1.5 + FREE [MILL 1 (1.0) + mark i1 d2 (1.5)] = 2.5 → 9.0 →
    // uncommon band 4.5-13 (Theorem). FREE share 2.5/9.0 = 27.8%.
    free: { millCards: 1, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    specialMechanics: [{ kind: 'reprise', count: 1, fireFree: true }],
    synergy: {
        statePredicate: { kind: 'finale', cardsLeftAtMost: 2 },
        rider: { drawCards: 1, conviction: 1 },
    },
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'recursion', 'condition'],
};

/** Stanza by Stanza — replay-last at uncommon with the REFRESH valve: say the
 *  last verse again and keep the breath that said it. Probes whether the
 *  replay verb can carry a mid-rank seat (it is rare-only in the library). */
const stanzaByStanza: Card = {
    id: 'stanza-by-stanza',
    theme: 'echo',
    name: 'Stanza by Stanza',
    philosophicalAspect: 'mind',
    description:
        'An argument built like a ballad: each verse takes the last one up ' +
        'and sets it down a little heavier. Nothing new is ever added. ' +
        'Nothing needs to be.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: replay the last spell's PAID line ×1 (5.0) + REFRESH the powering
    // die (2.0) = 7.0 + FREE [MILL 1 (1.0) + mark i1 d2 (1.5)] = 2.5 → 9.5 →
    // uncommon band 4.5-13 (Thesis). FREE share 2.5/9.5 = 26.3%.
    free: { millCards: 1, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } },
    specialMechanics: [
        { kind: 'replay_last', times: 1 },
        { kind: 'refresh_die' },
    ],
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'recursion', 'dice'],
};

/** The Standing Answer — the uncommon wall: a bigger brace with a mend, paid
 *  extra on the theme's own color. Echo's in-pool defense engine. */
const theStandingAnswer: Card = {
    id: 'the-standing-answer',
    theme: 'echo',
    name: 'The Standing Answer',
    philosophicalAspect: 'body',
    description:
        'Give the same answer every time and it stops being an answer. It ' +
        'becomes architecture — a thing objections break against.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: GUARD 10 (10 ÷ 4 = 2.5) + heal 4 (4 ÷ 3 = 1.33) = 3.83 + dieBonus
    // match [guard 4 (1.0)] × 0.6 = 0.6 + FREE [guard 4 (1.0) + MILL 1
    // (1.0)] = 2.0 → 6.43 → uncommon band 4.5-13 (Thesis). FREE share
    // 2.0/6.43 = 31.1%.
    free: { guard: 4, millCards: 1 },
    specialMechanics: [
        { kind: 'guard', amount: 10 },
        { kind: 'rider', rider: { healHp: 4 } },
    ],
    dieBonus: { onColor: 'match', rider: { guard: 4 } },
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'defend'],
};

/** Reading Back the Minutes — the deep-cycle engine: two drawn, two filed,
 *  and even a dead X die can read a page (FATE, priced in a little blood).
 *  Probes draw density for the refrain mid-game. */
const readingBackTheMinutes: Card = {
    id: 'reading-back-the-minutes',
    theme: 'echo',
    name: 'Reading Back the Minutes',
    philosophicalAspect: 'mind',
    description:
        'The record does not care what was meant. It reads out what was ' +
        'said, in the order it was said, until someone flinches.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts: draw 2 (4.0) + MILL 2 (2.0) = 6.0 + FATE [draw 1 (2.0)] × 0.7 =
    // 1.4, recoil 2 (−2 × 1/3 × 0.75 = −0.5) = +0.9 + FREE [MILL 2 (2.0) +
    // conviction 1 (1.0)] = 3.0 → 9.9 → uncommon band 4.5-13 (Theorem).
    // FREE share 3.0/9.9 = 30.3%.
    free: { millCards: 2, conviction: 1 },
    specialMechanics: [{ kind: 'rider', rider: { drawCards: 2, millCards: 2 } }],
    fate: { rider: { drawCards: 1 }, recoilHp: 2 },
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'draw'],
};

// PROMOTED OUT 2026-07-19 (owner-ratified): `the-burden-of-repetition` moved
// to `cards.library.ts` and the refrain body uncommon seat, RECOLORED
// heart→body for the evicted self-flagellant seat (arm r1,
// docs/reports/deck-tuning-2026-07-18.md — the strongest result of the run:
// mid blind 0.420→0.583 with sE +0.068; winnowing dominance watch item rides
// the promotion report).

/** First Word, Again — the OPENING condition card: lead with it and the turn
 *  opens into card advantage. The sequencing-grammar shape (WS5.2) in echo's
 *  vocabulary. */
const firstWordAgain: Card = {
    id: 'first-word-again',
    theme: 'echo',
    name: 'First Word, Again',
    philosophicalAspect: 'mind',
    description:
        'Open every exchange with the same sentence. They came prepared to ' +
        'answer it once. Preparation, unlike the sentence, does not repeat.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i1 d2 (2.14) + mark i1 d2 (1.5) = 3.64 + OPENING (first
    // spell this turn) rider [draw 1 (2.0) + mark i1 d2 (1.5)] × 0.5 = 1.75 +
    // FREE [MILL 1 (1.0) + conviction 1 (1.0)] = 2.0 → 7.38 → uncommon band
    // 4.5-13 (Thesis). FREE share 2.0/7.38 = 27.1%.
    free: { millCards: 1, conviction: 1 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 },
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    synergy: {
        statePredicate: { kind: 'opening', maxPriorSpells: 0 },
        rider: { drawCards: 1, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } },
    },
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'dot', 'condition'],
};

/** The Swollen Songbook — RECALL 2 at uncommon: the discard as a granary.
 *  Mind-threshold pays the loop forward. Probes double-recall density the
 *  library never ships below rare. */
const theSwollenSongbook: Card = {
    id: 'the-swollen-songbook',
    theme: 'echo',
    name: 'The Swollen Songbook',
    philosophicalAspect: 'mind',
    description:
        'A discard pile is only a graveyard to people with no memory. To ' +
        'everyone else it is a repertoire.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: RECALL 2 (2 × 2.0 = 4.0) + threshold MIND ×2 [MILL 1 (1.0) +
    // conviction 1 (1.0)] × 0.5 = 1.0 + FREE MILL 2 (2.0) → 7.0 → uncommon
    // band 4.5-13 (Thesis). FREE share 2.0/7.0 = 28.6%.
    free: { millCards: 2 },
    specialMechanics: [{ kind: 'reprise', count: 2 }],
    threshold: { color: 'mind', count: 2, rider: { millCards: 1, conviction: 1 } },
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'recursion'],
};

/** Each Time Worse — the heavy DoT uncommon: a deep poison that runs longer
 *  on a matched die. The pool's mid-game erosion anchor. */
const eachTimeWorse: Card = {
    id: 'each-time-worse',
    theme: 'echo',
    name: 'Each Time Worse',
    philosophicalAspect: 'body',
    description:
        'The body keeps a tally the mind would rather not. Every ' +
        'restatement lands on the bruise the last one left.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i2 d3 (card-played clock, tempo-weighted 19.0 ÷ 3 = 6.33) +
    // dieBonus match [bonusDuration 1 (1.0)] × 0.6 = 0.6 + FREE [mark i1 d2
    // (1.5) + MILL 1 (1.0)] = 2.5 → 9.43 → uncommon band 4.5-13 (Theorem).
    // FREE share 2.5/9.43 = 26.5%.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 }, millCards: 1 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 2, duration: 3 },
    ],
    dieBonus: { onColor: 'match', rider: { bonusDuration: 1 } },
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'dot'],
};

/** Last Verse, Loudest — the FINALE payoff uncommon: recall a card; played
 *  as the closing word, the whole MARK ledger detonates — BOARD stacks only
 *  (condition riders resolve before mechanic riders, so the finale closer
 *  fires first and the trailing plant lands after it: same-play marks never
 *  feed their own detonation) — then the flaw is named once more for
 *  whatever comes after. Coda's seat with a payoff instead of a refill. */
const lastVerseLoudest: Card = {
    id: 'last-verse-loudest',
    theme: 'echo',
    name: 'Last Verse, Loudest',
    philosophicalAspect: 'heart',
    description:
        'Anything sung enough times becomes an anthem, and every anthem ' +
        'saves its full voice for the end.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: RECALL 1 (2.0) + trailing plant mark i1 d2 (1.5, lands AFTER the
    // finale rider — insertion order) = 3.5 + FINALE (≤2 left) rider
    // [ruptureMarks 3 (2.0, pre-existing stacks) + draw 1 (2.0)] × 0.5 = 2.0
    // + FREE [MILL 1 (1.0) + mark i1 d2 (1.5)] = 2.5 → 8.0 → uncommon band
    // 4.5-13 (Theorem). FREE share 2.5/8.0 = 31.3%.
    free: { millCards: 1, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } },
    specialMechanics: [
        { kind: 'reprise', count: 1 },
        { kind: 'rider', rider: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } } },
    ],
    synergy: {
        statePredicate: { kind: 'finale', cardsLeftAtMost: 2 },
        rider: { ruptureMarks: 3, drawCards: 1 },
    },
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'payoff', 'condition'],
};

/** The Drum Insists — the tempo engine: next spell echoes, the die comes
 *  back, the argument steadies. A denser in-other-words for the second
 *  uncommon seat. */
const theDrumInsists: Card = {
    id: 'the-drum-insists',
    theme: 'echo',
    name: 'The Drum Insists',
    philosophicalAspect: 'body',
    description:
        'A drum has one argument and has never lost. Keep the beat and ' +
        'whatever is said over it starts agreeing with the rhythm.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: your next spell gains ECHO (4.0) + conviction 1 (1.0) + REFRESH
    // the powering die (2.0) = 7.0 + FREE [MILL 1 (1.0) + mark i1 d2 (1.5)]
    // = 2.5 → 9.5 → uncommon band 4.5-13 (Thesis). FREE share 2.5/9.5 =
    // 26.3%.
    free: { millCards: 1, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } },
    specialMechanics: [
        { kind: 'echo_next_spell' },
        { kind: 'rider', rider: { conviction: 1 } },
        { kind: 'refresh_die' },
    ],
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'engine', 'dice'],
};

// ─── Rares (8) — finishers and build-arounds ─────────────────────────────────

/** The Argument Eternal — ouroboros's seat, unarmed: replay the last spell
 *  twice with a draw instead of the MARK detonation. Probes whether the
 *  finisher needs the burst or just the loop. */
const theArgumentEternal: Card = {
    id: 'the-argument-eternal',
    theme: 'echo',
    name: 'The Argument Eternal',
    philosophicalAspect: 'mind',
    description:
        'It was never about winning the point. It was about building a ' +
        'point that cannot stop being made — by anyone, ever, including you.',
    tier: 2, rank: 6, cardType: 'spell',
    targetType: 'self',
    // pts: replay the last spell's PAID line ×2 (2 × 5.0 = 10.0) + draw 1
    // (2.0) = 12.0 + dieBonus match [conviction 1 (1.0)] × 0.6 = 0.6 + FREE
    // [MILL 2 (2.0) + mark i2 d2 (3.0)] = 5.0 → 17.6 → rare band 7-19
    // (Aporia). FREE share 5.0/17.6 = 28.4%.
    free: { millCards: 2, applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 2 } },
    specialMechanics: [
        { kind: 'replay_last', times: 2 },
        { kind: 'rider', rider: { drawCards: 1 } },
    ],
    dieBonus: { onColor: 'match', rider: { conviction: 1 } },
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'recursion', 'finisher'],
};

/** Chorus of One — the engine build-around: the next spell echoes, a spent
 *  card returns with its FREE line firing, and the die comes back for more.
 *  One card that winds the whole loop. */
const chorusOfOne: Card = {
    id: 'chorus-of-one',
    theme: 'echo',
    name: 'Chorus of One',
    philosophicalAspect: 'heart',
    description:
        'One voice, disciplined, is a crowd. It answers itself, agrees ' +
        'with itself, and votes itself the victor by acclamation.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'self',
    // pts: your next spell gains ECHO (4.0) + RECALL 1 + its FREE fires now
    // (2.0 + 1.5) + conviction 1 (1.0) + REFRESH the powering die (2.0) =
    // 10.5 + FREE [MILL 2 (2.0) + mark i2 d2 (3.0)] = 5.0 → 15.5 → rare band
    // 7-19 (Axiom). FREE share 5.0/15.5 = 32.3%.
    free: { millCards: 2, applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 2 } },
    specialMechanics: [
        { kind: 'echo_next_spell' },
        { kind: 'reprise', count: 1, fireFree: true },
        { kind: 'rider', rider: { conviction: 1 } },
        { kind: 'refresh_die' },
    ],
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'engine', 'recursion'],
};

/** The Truth by Attrition — the detonation finisher: a poison said twice,
 *  the whole MARK ledger cashed at 4 per stack, the flaw re-filed for the
 *  next swing. Closer before plant (a-sweeter-poison rider order): the
 *  rupture consumes PRE-EXISTING marks only — ECHO doubles the poison, not
 *  the ledger — and the MIND threshold pays a card instead of a second
 *  rupture that would starve the 4/stack closer of its own fuel (riders
 *  resolve in insertion order; threshold fires first). Tier 3 — the
 *  late-stage answer to boss HP walls. */
const theTruthByAttrition: Card = {
    id: 'the-truth-by-attrition',
    theme: 'echo',
    name: 'The Truth by Attrition',
    philosophicalAspect: 'mind',
    description:
        'Said often enough, a thing does not become true. It becomes ' +
        'load-bearing — and load-bearing things can be brought down.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    // pts: [poison i1 d2 (tempo-weighted 6.4 ÷ 3 = 2.14) + closer
    // ruptureMarks 4 (4 × 2/3 = 2.67, pre-existing stacks — the plant
    // trails) + trailing plant mark i1 d2 (1.5)] × ECHO 1.8 = 11.34
    // (scorer-exact: the multiplier covers the whole PAID line; the riders
    // fire once at runtime — priced rich, never cheap) + threshold MIND ×3
    // [draw 1 (2.0)] × 0.5 = 1.0 + FREE [MILL 2 (2.0) + mark i2 d2 (3.0)] =
    // 5.0 → 17.34 → rare band 7-19 (Aporia). FREE share 5.0/17.34 = 28.8%.
    free: { millCards: 2, applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 2 } },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    specialMechanics: [
        { kind: 'echo' },
        { kind: 'rider', rider: { ruptureMarks: 4 } },
        { kind: 'rider', rider: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } } },
    ],
    threshold: { color: 'mind', count: 3, rider: { drawCards: 1 } },
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'payoff', 'finisher', 'dot'],
};

/** The Refrain That Rots — the erosion finisher: a deep poison said twice.
 *  No burst, no ledger — just a doubled decline the enemy cannot argue
 *  with. Probes a pure-DoT rare seat for refrain. */
const theRefrainThatRots: Card = {
    id: 'the-refrain-that-rots',
    theme: 'echo',
    name: 'The Refrain That Rots',
    philosophicalAspect: 'mind',
    description:
        'Hum it once and it is a tune. Hum it every hour and it is a ' +
        'tenant — one that eats the beams and pays in silence.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: poison i2 d3 (tempo-weighted 19.0 ÷ 3 = 6.33) × ECHO 1.8 = 11.39
    // + dieBonus match [bonusIntensity 1 (1.5)] × 0.6 = 0.9 + FREE [MILL 1
    // (1.0) + poison i2 d2 (tempo-weighted 12.8 ÷ 3 = 4.27)] = 5.27 → 17.56
    // → rare band 7-19 (Axiom). FREE share 5.27/17.56 = 30.0%.
    free: { millCards: 1, applyEffect: { effectId: 'debuff_poison', intensity: 2, duration: 2 } },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 2, duration: 3 },
    ],
    specialMechanics: [{ kind: 'echo' }],
    dieBonus: { onColor: 'match', rider: { bonusIntensity: 1 } },
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'dot', 'finisher'],
};

/** The Collected Works — the hand-rebuild rare: two cards back from the pile
 *  with their FREE lines firing, plus fresh pages. The build-around for a
 *  RECALL-dense refrain variant. */
const theCollectedWorks: Card = {
    id: 'the-collected-works',
    theme: 'echo',
    name: 'The Collected Works',
    philosophicalAspect: 'mind',
    description:
        'Every discarded draft, bound in one volume. Read together, the ' +
        'abandoned arguments turn out to have been one argument all along.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'self',
    // pts: RECALL 2 + their FREE lines fire now (2 × 2.0 + 1.5 = 5.5) +
    // draw 1 (2.0) + conviction 1 (1.0) = 8.5 + threshold MIND ×2 [draw 1
    // (2.0)] × 0.5 = 1.0 + FREE [MILL 2 (2.0) + mark i1 d2 (1.5)] = 3.5 →
    // 13.0 → rare band 7-19 (Axiom). FREE share 3.5/13.0 = 26.9%.
    free: { millCards: 2, applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 2 } },
    specialMechanics: [
        { kind: 'reprise', count: 2, fireFree: true },
        { kind: 'rider', rider: { drawCards: 1, conviction: 1 } },
    ],
    threshold: { color: 'mind', count: 2, rider: { drawCards: 1 } },
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'recursion', 'draw'],
};

/** Say It Until It Holds — the defensive rare: wall and mend, both said
 *  twice; even a dead X die can add a course of stone, at a price. Gives
 *  refrain a rare defend seat the library theme never had. */
const sayItUntilItHolds: Card = {
    id: 'say-it-until-it-holds',
    theme: 'echo',
    name: 'Say It Until It Holds',
    philosophicalAspect: 'body',
    description:
        'Masons repeat themselves: course upon course, the same motion. ' +
        'That is not stubbornness. That is how anything comes to stand.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'self',
    // pts: [GUARD 12 (12 ÷ 4 = 3.0) + heal 4 (1.33)] × ECHO 1.8 = 7.8 +
    // FATE [guard 6 (1.5)] × 0.7 = 1.05, recoil 2 (−0.5) = +0.55 + FREE
    // [guard 4 (1.0) + MILL 2 (2.0)] = 3.0 → 11.35 → rare band 7-19 (Axiom).
    // FREE share 3.0/11.35 = 26.4%.
    free: { guard: 4, millCards: 2 },
    specialMechanics: [
        { kind: 'rider', rider: { guard: 12, healHp: 4 } },
        { kind: 'echo' },
    ],
    fate: { rider: { guard: 6 }, recoilHp: 2 },
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'defend', 'finisher'],
};

/** The Unfinished Argument — the loop build-around: replay the last line,
 *  recall a spent one with its FREE firing, feed the pile — and as the
 *  closing word it refills the hand. Tier 3, the deck that never ends. */
const theUnfinishedArgument: Card = {
    id: 'the-unfinished-argument',
    theme: 'echo',
    name: 'The Unfinished Argument',
    philosophicalAspect: 'mind',
    description:
        'It does not conclude. It adjourns, and reconvenes, and adjourns ' +
        'again — and every session they attend costs them more than yours.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'self',
    // pts: replay the last spell's PAID line ×1 (5.0) + RECALL 1 + its FREE
    // fires now (2.0 + 1.5) + MILL 2 (2.0) = 10.5 + FINALE (≤2 left) rider
    // [draw 2 (4.0)] × 0.5 = 2.0 + FREE [mark i2 d2 (3.0) + MILL 2 (2.0)] =
    // 5.0 → 17.5 → rare band 7-19 (Aporia). FREE share 5.0/17.5 = 28.6%.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 2 }, millCards: 2 },
    specialMechanics: [
        { kind: 'replay_last', times: 1 },
        { kind: 'reprise', count: 1, fireFree: true },
        { kind: 'rider', rider: { millCards: 2 } },
    ],
    synergy: {
        statePredicate: { kind: 'finale', cardsLeftAtMost: 2 },
        rider: { drawCards: 2 },
    },
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'recursion', 'condition'],
};

/** The Wheel Turns Again — the tempo rare: poison and a fresh page, all of
 *  it twice, and the die that said it returns. The mid-size finisher for
 *  runs where the Aporias read too slow. */
const theWheelTurnsAgain: Card = {
    id: 'the-wheel-turns-again',
    theme: 'echo',
    name: 'The Wheel Turns Again',
    philosophicalAspect: 'heart',
    description:
        'They keep waiting for the argument to run down. But it was never ' +
        'rolling downhill — it was a wheel, and a wheel only knows one trick.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: [poison i1 d2 (2.14) + draw 1 (2.0) + REFRESH the powering die
    // (2.0)] × ECHO 1.8 = 11.04 (the echo re-fires the whole PAID line,
    // refresh included — scorer-exact) + FREE [MILL 1 (1.0) + mark i2 d2
    // (3.0)] = 4.0 → 15.04 → rare band 7-19 (Axiom). FREE share 4.0/15.04
    // = 26.6%.
    free: { millCards: 1, applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 2 } },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    specialMechanics: [
        { kind: 'echo' },
        { kind: 'rider', rider: { drawCards: 1 } },
        { kind: 'refresh_die' },
    ],
    addedIn: '2026-07-18',
    tags: ['echo', 'swap-pool', 'dot', 'dice'],
};

// ─── The set ─────────────────────────────────────────────────────────────────

export const SWAP_POOL_ECHO: SandboxCardSet = {
    id: 'swap-echo',
    name: 'Swap pool: echo',
    description:
        'Thirty new echo spells for /deck-tuning to A/B into the refrain '
        + 'preset recipe seat-by-seat: reliable commons (an echoed DoT, a MARK '
        + 'stacker, plain defends, a common RECALL) for the ×4 slots, '
        + 'engine uncommons (echo-next, recall-fires-FREE, sequencing '
        + 'conditions, the REFRESH valve) for the ×2 slots, and eight rare '
        + 'finishers/build-arounds spanning detonation, pure erosion, '
        + 'defense, and hand-rebuild. Probes carrier density for ECHO/RECALL '
        + 'and whether the theme wants payoff lines below rare.',
    cards: [
        // commons (10)
        toldTwice, theNamingRepeated, murmurOfPages, aBreathKept,
        callAndResponse, theShieldRestated, theLineThatLingers, takenBackUp,
        thePointLands, oneMoreBar,
        // uncommons (11; the-burden-of-repetition promoted out 2026-07-19)
        inOtherWords, theSecondTelling, wordForWord, stanzaByStanza,
        theStandingAnswer, readingBackTheMinutes,
        firstWordAgain, theSwollenSongbook, eachTimeWorse, lastVerseLoudest,
        theDrumInsists,
        // rares (8)
        theArgumentEternal, chorusOfOne, theTruthByAttrition,
        theRefrainThatRots, theCollectedWorks, sayItUntilItHolds,
        theUnfinishedArgument, theWheelTurnsAgain,
    ],
};
