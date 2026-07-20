/**
 * Swap pool — PERORATION (preset `oratory`), authored 2026-07-18.
 *
 * 30 NEW spell-only swap candidates for the `/deck-tuning` preset recipe
 * (4×2 commons, 2×2 uncommons, 1×3 rares). NOT player-facing, NOT in any
 * preset, NOT in `cards.library.ts` — this file is data for tuning
 * experiments only. Every card composes EXISTING verbs (spec 32 §3 registry:
 * PREMISE hallmark + DRAW/GUARD family utility + the MARK/POISON/RUPTURE
 * leans the theme's 7 library cards already carry). No new keywords, no new
 * mechanic kinds.
 *
 * Rank quota: 10 commons (r1-2) · 12 uncommons (r3-4) · 8 rares (r5-6).
 * Seat colors follow the ratified 5/5/5 preset color law (oratory's
 * swappable spell seats: heart ×4 exordium/valve · body ×4 brace-for-impact
 * · mind ×2 mounting-case · mind ×2 peroratio-interrupta · heart ×1
 * the-closing-word): commons are heart/body only, engine uncommons lean
 * mind, and every rival conclusion is heart. Deliberate off-seat reach
 * cards are named in the set description.
 * Die-interaction law honoured: every tier-2+ card carries exactly ONE of
 * threshold / dieBonus / fate / die-manipulation / react (a
 * `synergy.statePredicate` gate fills the react slot — Coda precedent,
 * `cards.sandbox-sets.ts`). FREE lines sit in the 25-35% window; none are
 * silent no-ops.
 */

import type { Card } from '../types';
import type { SandboxCardSet } from '../cards.sandbox-sets';

// ─── Commons (10 — rank 1-2, the ×4 seats: simple, reliable) ─────────────────

/**
 * Narratio — peroration Doxa, C-seat deposit + cycle: the statement of facts.
 * Pure tally-and-draw, the simplest possible ×4 workhorse (Mantra-of-Time
 * shape: a common whose whole job is depositing the build currency).
 */
const narratio: Card = {
    id: 'narratio',
    theme: 'peroration',
    name: 'Narratio',
    philosophicalAspect: 'heart',
    description:
        'The facts, laid in order. Nothing asserted yet — and nothing ' +
        'deniable either. A floor is being built under their feet, plank ' +
        'by plank.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: PAID [PREMISE 2 (1.6) + draw 1 (2.0)] = 3.6 + FREE [premises 2
    // (1.6)] → 5.2 → common band 1.5-7.5 (Doxa). FREE share 1.6/5.2 = 30.8%
    // ✓ window.
    free: { premises: 2 },
    specialMechanics: [
        { kind: 'premise', count: 2 },
        { kind: 'rider', rider: { drawCards: 1 } },
    ],
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'engine'],
};

/**
 * Distinguo — peroration Doxa, C-seat defend line: the scholastic "I
 * distinguish." Guard-leaning counterpart to Point of Order; the pool's
 * cheapest wall. Body-colored for the brace-for-impact ×4 seat.
 */
const distinguo: Card = {
    id: 'distinguo',
    theme: 'peroration',
    name: 'Distinguo',
    philosophicalAspect: 'body',
    description:
        'I distinguish. The oldest shield in the schools: split their blow ' +
        'into the part that lands and the part that never existed.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: PAID [GUARD 8 (2.0) + PREMISE 1 (0.8)] = 2.8 + FREE [guard 4
    // (1.0)] → 3.8 → common band 1.5-7.5 (Doxa). FREE share 1.0/3.8 = 26.3%
    // ✓ window.
    free: { guard: 4 },
    specialMechanics: [
        { kind: 'guard', amount: 8 },
        { kind: 'premise', count: 1 },
    ],
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'defense'],
};

// PROMOTED OUT 2026-07-19 (owner-ratified): `videtur-quod` moved to
// `cards.library.ts` and the oratory x4 heart common seat (arm o1,
// docs/reports/deck-tuning-2026-07-18.md — the run's cleanest commons
// engagement gain).

/**
 * Ad Rem — peroration Lemma, C-seat MARK carrier: "to the point." Feeds the
 * theme's ruptureMarks conclusions from a common seat (denser mark supply
 * than opening-statement's d2). Body-colored — the concrete gesture — for
 * the brace-for-impact ×4 seat.
 */
const adRem: Card = {
    id: 'ad-rem',
    theme: 'peroration',
    name: 'Ad Rem',
    philosophicalAspect: 'body',
    description:
        'To the point. No ornament, no digression — the finger set on the ' +
        'place where the argument will break, and left there.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: PAID [mark i1 d4 (3.0) + PREMISE 2 (1.6)] = 4.6 + FREE
    // [premises 2 (1.6)] → 6.2 → common band 1.5-7.5 (Lemma). FREE share
    // 1.6/6.2 = 25.8% ✓ window.
    free: { premises: 2 },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 4 },
    ],
    specialMechanics: [{ kind: 'premise', count: 2 }],
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'exposure'],
};

/**
 * Sed Contra — peroration Lemma, C-seat defend + cycle: "but against this—".
 * The disputation's counter-authority: a wall that also keeps the case
 * moving. Probes whether a 3-verb common still reads simple. Body-colored
 * for the brace-for-impact ×4 seat.
 */
const sedContra: Card = {
    id: 'sed-contra',
    theme: 'peroration',
    name: 'Sed Contra',
    philosophicalAspect: 'body',
    description:
        'But against this stands the authority that outranks them. You ' +
        'raise it, step behind it, and let them argue with the dead.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: PAID [GUARD 6 (1.5) + PREMISE 2 (1.6) + draw 1 (2.0)] = 5.1 +
    // FREE [guard 4 (1.0) + premises 1 (0.8)] = 1.8 → 6.9 → common band
    // 1.5-7.5 (Lemma). FREE share 1.8/6.9 = 26.1% ✓ window.
    free: { guard: 4, premises: 1 },
    specialMechanics: [
        { kind: 'guard', amount: 6 },
        { kind: 'premise', count: 2 },
        { kind: 'rider', rider: { drawCards: 1 } },
    ],
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'defense'],
};

/**
 * A Fortiori — peroration Lemma, C-seat die-line common: "from the stronger."
 * Uses the tier-1 allowance of one die line (dieBonus match) — argued on a
 * heart die, the case simply carries further.
 */
const aFortiori: Card = {
    id: 'a-fortiori',
    theme: 'peroration',
    name: 'A Fortiori',
    philosophicalAspect: 'heart',
    description:
        'From the stronger, the weaker follows. Prove the mountain and the ' +
        'hill concedes itself — said with the right die, it carries further.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: PAID [PREMISE 2 (1.6) + poison i1 d2 (tempo-weighted 6.41 ÷ 3 =
    // 2.14)] = 3.74 + dieBonus match [premises 2 (1.6)] × 0.6 = 0.96 + FREE
    // [premises 2 (1.6)] → 6.3 → common band 1.5-7.5 (Lemma). FREE share
    // 1.6/6.3 = 25.4% ✓ window.
    free: { premises: 2 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    specialMechanics: [{ kind: 'premise', count: 2 }],
    dieBonus: { onColor: 'match', rider: { premises: 2 } },
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'exposure', 'dot'],
};

/**
 * Obiter Dictum — peroration Doxa, C-seat cycle glue: a remark in passing.
 * The smallest honest draw common the theme can print. Heart-colored — the
 * remark that lingers — for the exordium ×4 seat.
 */
const obiterDictum: Card = {
    id: 'obiter-dictum',
    theme: 'peroration',
    name: 'Obiter Dictum',
    philosophicalAspect: 'heart',
    description:
        'A remark in passing — nothing that binds, everything that lingers. ' +
        'The court forgets it was said. The record does not.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: PAID [draw 1 (2.0) + PREMISE 1 (0.8)] = 2.8 + FREE [premises 1
    // (0.8) + guard 2 (0.5)] = 1.3 → 4.1 → common band 1.5-7.5 (Doxa).
    // FREE share 1.3/4.1 = 31.7% ✓ window.
    free: { premises: 1, guard: 2 },
    specialMechanics: [
        { kind: 'premise', count: 1 },
        { kind: 'rider', rider: { drawCards: 1 } },
    ],
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'engine'],
};

/**
 * Res Ipsa Loquitur — peroration Lemma, the threshold common: the thing
 * speaks for itself. Tier 2 with its one die line (threshold heart 2);
 * probes whether a conditioned common still earns a ×4 seat.
 */
const resIpsaLoquitur: Card = {
    id: 'res-ipsa-loquitur',
    theme: 'peroration',
    name: 'Res Ipsa Loquitur',
    philosophicalAspect: 'heart',
    description:
        'The thing speaks for itself. You need only stand aside, gesture ' +
        'once, and let the wreckage testify.',
    tier: 2, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: PAID [mark i1 d3 (2.25) + PREMISE 2 (1.6)] = 3.85 + threshold
    // heart 2 [premises 2 (1.6)] × 0.5 = 0.8 + FREE [premises 2 (1.6)] →
    // 6.25 → common band 1.5-7.5 (Lemma). FREE share 1.6/6.25 = 25.6%
    // ✓ window.
    free: { premises: 2 },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 3 },
    ],
    specialMechanics: [{ kind: 'premise', count: 2 }],
    threshold: { color: 'heart', count: 2, rider: { premises: 2 } },
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'exposure'],
};

/**
 * Point of Order — peroration Doxa, C-seat defend line (premise-leaning):
 * procedure as a shield. Body-colored for the preset's 5/5/5 color law.
 */
const pointOfOrder: Card = {
    id: 'point-of-order',
    theme: 'peroration',
    name: 'Point of Order',
    philosophicalAspect: 'body',
    description:
        'Point of order: the proceedings halt, and the blow waits its ' +
        'turn. Procedure is a shield for whoever grips it first.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: PAID [GUARD 5 (1.25) + PREMISE 2 (1.6)] = 2.85 + FREE [guard 5
    // (1.25)] → 4.1 → common band 1.5-7.5 (Doxa). FREE share 1.25/4.1 =
    // 30.5% ✓ window.
    free: { guard: 5 },
    specialMechanics: [
        { kind: 'guard', amount: 5 },
        { kind: 'premise', count: 2 },
    ],
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'defense'],
};

/**
 * Leading Question — peroration Lemma, C-seat DoT + cycle: the exploit
 * common. A question shaped so every answer wounds — poison plus a card.
 */
const leadingQuestion: Card = {
    id: 'leading-question',
    theme: 'peroration',
    name: 'Leading Question',
    philosophicalAspect: 'heart',
    description:
        'A question shaped so that every answer wounds. Cruel, strictly ' +
        'speaking — but they walked into it, and you watched them walk.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: PAID [poison i1 d2 (tempo-weighted 6.41 ÷ 3 = 2.14) + draw 1
    // (2.0)] = 4.14 + FREE [premises 2 (1.6)] → 5.74 → common band 1.5-7.5
    // (Lemma). FREE share 1.6/5.74 = 27.9% ✓ window.
    free: { premises: 2 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    specialMechanics: [{ kind: 'rider', rider: { drawCards: 1 } }],
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'exposure', 'dot'],
};

// ─── Uncommons (12 — rank 3-4, the ×2 seats: the theme's engine) ─────────────

/**
 * Confirmatio — peroration Thesis, U-seat premise engine: the proof proper.
 * The densest raw deposit in the pool (3 + 2 threshold + 2 free).
 * Mind-colored for the mounting-case ×2 seat it rivals.
 */
const confirmatio: Card = {
    id: 'confirmatio',
    theme: 'peroration',
    name: 'Confirmatio',
    philosophicalAspect: 'mind',
    description:
        'The proof proper. Each premise set like a course of stone, and ' +
        'each stone cut to bear the weight of the next.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: PAID [PREMISE 3 (2.4) + mark i1 d3 (2.25)] = 4.65 + threshold
    // mind 2 [premises 2 (1.6)] × 0.5 = 0.8 + FREE [premises 2 (1.6) +
    // guard 2 (0.5)] = 2.1 → 7.55 → uncommon band 4.5-13 (Thesis). FREE
    // share 2.1/7.55 = 27.8% ✓ window.
    free: { premises: 2, guard: 2 },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 3 },
    ],
    specialMechanics: [{ kind: 'premise', count: 3 }],
    threshold: { color: 'mind', count: 2, rider: { premises: 2 } },
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'engine'],
};

/**
 * Refutatio — peroration Thesis, U-seat defensive engine: their case,
 * dismantled and restacked as your wall. Guard + premises + cycle.
 */
const refutatio: Card = {
    id: 'refutatio',
    theme: 'peroration',
    name: 'Refutatio',
    philosophicalAspect: 'mind',
    description:
        'Their case dismantled joint by joint — and the pieces stacked, ' +
        'without apology, into a wall in front of your own.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: PAID [GUARD 10 (2.5) + PREMISE 2 (1.6) + draw 1 (2.0)] = 6.1 +
    // dieBonus match [guard 4 (1.0)] × 0.6 = 0.6 + FREE [guard 6 (1.5) +
    // premises 1 (0.8)] = 2.3 → 9.0 → uncommon band 4.5-13 (Thesis). FREE
    // share 2.3/9.0 = 25.6% ✓ window.
    free: { guard: 6, premises: 1 },
    specialMechanics: [
        { kind: 'guard', amount: 10 },
        { kind: 'premise', count: 2 },
        { kind: 'rider', rider: { drawCards: 1 } },
    ],
    dieBonus: { onColor: 'match', rider: { guard: 4 } },
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'defense', 'engine'],
};

/**
 * Anaphora — peroration Thesis, the REFRESH valve variant: say it again,
 * on the same die. ONE experiment with the live D8 valve restate-the-point
 * (`combat.starter-deck-presets.ts`, `oratory` seat) — the declared
 * valve-seat A/B, not an independent card. Same heart REFRESH core; the
 * trade is the third premise for a CONVICTION line — a payload class
 * restate-the-point cannot express — plus one extra FREE guard.
 */
const anaphora: Card = {
    id: 'anaphora',
    theme: 'peroration',
    name: 'Anaphora',
    philosophicalAspect: 'heart',
    description:
        'Say it again. And again. The same words on the same die, falling ' +
        'on the same place, until the place gives.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: PAID [REFRESH the powering die (2.0) + PREMISE 2 (1.6) +
    // conviction 2 (2.0)] = 5.6 + FREE [premises 2 (1.6) + guard 2 (0.5)] =
    // 2.1 → 7.7 → uncommon band 4.5-13 (Thesis). FREE share 2.1/7.7 = 27.3%
    // ✓ window. Die line = the refresh itself (die-manipulation slot).
    free: { premises: 2, guard: 2 },
    specialMechanics: [
        { kind: 'refresh_die' },
        { kind: 'premise', count: 2 },
        { kind: 'rider', rider: { conviction: 2 } },
    ],
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'dice', 'valve'],
};

/**
 * Hypophora — peroration Thesis, U-seat draw engine: ask the question they
 * dread, answer it yourself. The pool's Focus-shape card advantage.
 */
const hypophora: Card = {
    id: 'hypophora',
    theme: 'peroration',
    name: 'Hypophora',
    philosophicalAspect: 'mind',
    description:
        'Ask the question they dread; answer it yourself before they can ' +
        'draw breath. The room hears only that they were silent.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: PAID [draw 2 (4.0) + PREMISE 2 (1.6)] = 5.6 + threshold mind 2
    // [draw 1 (2.0)] × 0.5 = 1.0 + FREE [premises 2 (1.6) + guard 3 (0.75)]
    // = 2.35 → 8.95 → uncommon band 4.5-13 (Thesis). FREE share 2.35/8.95 =
    // 26.3% ✓ window.
    free: { premises: 2, guard: 3 },
    specialMechanics: [
        { kind: 'rider', rider: { drawCards: 2 } },
        { kind: 'premise', count: 2 },
    ],
    threshold: { color: 'mind', count: 2, rider: { drawCards: 1 } },
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'engine'],
};

/**
 * Onus Probandi — peroration Thesis, the react-gated uncommon: the burden
 * of proof lies with them. If the enemy landed nothing last round, their
 * failure is entered as evidence (state gate fills the react slot).
 */
const onusProbandi: Card = {
    id: 'onus-probandi',
    theme: 'peroration',
    name: 'Onus Probandi',
    philosophicalAspect: 'body',
    description:
        'The burden of proof lies with them — and last round they failed ' +
        'to carry it. Their silence is entered into the record.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: PAID [GUARD 8 (2.0) + PREMISE 2 (1.6)] = 3.6 + enemy-dealt-no-
    // damage-last-round rider [premises 2 (1.6) + draw 1 (2.0)] × 0.5 = 1.8
    // + FREE [guard 4 (1.0) + premises 1 (0.8)] = 1.8 → 7.2 → uncommon band
    // 4.5-13 (Thesis). FREE share 1.8/7.2 = 25.0% ✓ window. Condition line
    // = the state gate (react slot; Coda precedent).
    free: { guard: 4, premises: 1 },
    specialMechanics: [
        { kind: 'guard', amount: 8 },
        { kind: 'premise', count: 2 },
    ],
    synergy: {
        statePredicate: { kind: 'enemy-dealt-no-damage-last-round' },
        rider: { premises: 2, drawCards: 1 },
    },
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'defense', 'condition'],
};

/**
 * The Prepared Rebuttal — peroration Thesis, U-seat guard engine: every
 * objection already answered in the drawer. The pool's heavy wall short of
 * the rare.
 */
const thePreparedRebuttal: Card = {
    id: 'the-prepared-rebuttal',
    theme: 'peroration',
    name: 'The Prepared Rebuttal',
    philosophicalAspect: 'body',
    description:
        'Every objection they might raise, already answered and filed. ' +
        'Preparation is not glamorous; it is merely unbeatable.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: PAID [GUARD 12 (3.0) + PREMISE 2 (1.6)] = 4.6 + threshold body 2
    // [guard 6 (1.5)] × 0.5 = 0.75 + FREE [guard 7 (1.75) + premises 1
    // (0.8)] = 2.55 → 7.9 → uncommon band 4.5-13 (Thesis). FREE share
    // 2.55/7.9 = 32.3% ✓ window.
    free: { guard: 7, premises: 1 },
    specialMechanics: [
        { kind: 'guard', amount: 12 },
        { kind: 'premise', count: 2 },
    ],
    threshold: { color: 'body', count: 2, rider: { guard: 6 } },
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'defense'],
};

/**
 * Elenchus — peroration Theorem, U-seat DoT engine: the Socratic poison.
 * The pool's heaviest exposure line; on a matching die the questions
 * narrow harder (+1 intensity).
 */
const elenchus: Card = {
    id: 'elenchus',
    theme: 'peroration',
    name: 'Elenchus',
    philosophicalAspect: 'mind',
    description:
        'Question after question, each answer narrowing the ground they ' +
        'stand on. Eventually there is no ground, and still you ask.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: PAID [poison i2 d3 (card-played 1.83 cadence, tempo-weighted
    // 18.99 ÷ 3 = 6.33) + PREMISE 2 (1.6)] = 7.93 + dieBonus match
    // [bonusIntensity 1 (1.5)] × 0.6 = 0.9 + FREE [premises 2 (1.6) +
    // guard 6 (1.5)] = 3.1 → 11.93 → uncommon band 4.5-13 (Theorem). FREE
    // share 3.1/11.93 = 26.0% ✓ window.
    free: { premises: 2, guard: 6 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 2, duration: 3 },
    ],
    specialMechanics: [{ kind: 'premise', count: 2 }],
    dieBonus: { onColor: 'match', rider: { bonusIntensity: 1 } },
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'exposure', 'dot'],
};

/**
 * Cross-Examination — peroration Theorem, the FATE uncommon: mark pressure
 * that an X die can power. Under the wrong die entirely, the mistold truth
 * still cuts — at a printed price in blood.
 */
const crossExamination: Card = {
    id: 'cross-examination',
    theme: 'peroration',
    name: 'Cross-Examination',
    philosophicalAspect: 'mind',
    description:
        'Under oath, under pressure, under the wrong die entirely — it ' +
        'does not matter. Even a mistold truth can be made to cut.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: PAID [mark i2 d3 (4.5) + PREMISE 2 (1.6)] = 6.1 + FATE [draw 1
    // (2.0) + premises 1 (0.8)] × 0.7 = 1.96 − recoil 2 × ⅓ × 0.75 = −0.5
    // + FREE [premises 2 (1.6) + guard 5 (1.25)] = 2.85 → 10.41 → uncommon
    // band 4.5-13 (Theorem). FREE share 2.85/10.41 = 27.4% ✓ window.
    free: { premises: 2, guard: 5 },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 3 },
    ],
    specialMechanics: [{ kind: 'premise', count: 2 }],
    fate: { rider: { drawCards: 1, premises: 1 }, recoilHp: 2 },
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'exposure', 'condition'],
};

/**
 * Recapitulatio — peroration Theorem, the cash-out engine: the summary,
 * weaponized. Peroratio-interrupta's spend-the-tally sibling, draw-leaning
 * (marks per 3 spent, cards per 2 spent). Mind-colored so it is seat-legal
 * at its sibling's ×2 seat.
 */
const recapitulatio: Card = {
    id: 'recapitulatio',
    theme: 'peroration',
    name: 'Recapitulatio',
    philosophicalAspect: 'mind',
    description:
        'The summary, weaponized: everything already said, said once more ' +
        'and all at once — restated as wounds and as fresh pages.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: PAID [SPEND PREMISES (6.5) + PREMISE 1 (0.8)] = 7.3 + dieBonus
    // match [premises 2 (1.6)] × 0.6 = 0.96 + FREE [draw 1 (2.0) +
    // premises 1 (0.8)] = 2.8 → 11.06 → uncommon band 4.5-13 (Theorem).
    // FREE share 2.8/11.06 = 25.3% ✓ window.
    free: { drawCards: 1, premises: 1 },
    specialMechanics: [
        { kind: 'spend_premises', markPer: 3, drawPer: 2 },
        { kind: 'premise', count: 1 },
    ],
    dieBonus: { onColor: 'match', rider: { premises: 2 } },
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'payoff'],
};

/**
 * The Hostile Witness — peroration Theorem, the drew-blood react card:
 * their strike, entered into evidence. Probes whether Peroration wants a
 * punished-aggression angle (state gate fills the react slot).
 */
const theHostileWitness: Card = {
    id: 'the-hostile-witness',
    theme: 'peroration',
    name: 'The Hostile Witness',
    philosophicalAspect: 'heart',
    description:
        'They struck you, and the strike is now yours: entered into the ' +
        'record, turned to premises. Their temper testifies for you.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: PAID [PREMISE 2 (1.6) + poison i1 d4 (tempo-weighted 11.81 ÷ 3 =
    // 3.94)] = 5.54 + enemy-drew-blood rider [premises 2 (1.6) + guard 4
    // (1.0)] × 0.5 = 1.3 + FREE [premises 2 (1.6) + guard 4 (1.0)] = 2.6 →
    // 9.44 → uncommon band 4.5-13 (Theorem). FREE share 2.6/9.44 = 27.5%
    // ✓ window. Condition line = the state gate (react slot).
    free: { premises: 2, guard: 4 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 4 },
    ],
    specialMechanics: [{ kind: 'premise', count: 2 }],
    synergy: {
        statePredicate: { kind: 'enemy-drew-blood' },
        rider: { premises: 2, guard: 4 },
    },
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'exposure', 'condition', 'dot'],
};

/**
 * Tricolon — peroration Theorem, the rule of three: premises, pressure,
 * and a wall in one breath. Wide-shape engine card (three small verbs)
 * against the pool's tall ones.
 */
const tricolon: Card = {
    id: 'tricolon',
    theme: 'peroration',
    name: 'Tricolon',
    philosophicalAspect: 'heart',
    description:
        'Three beats, one breath. What is said three times acquires the ' +
        'weight of law, and law does not ask permission.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: PAID [PREMISE 3 (2.4) + mark i1 d3 (2.25) + GUARD 6 (1.5)] =
    // 6.15 + threshold heart 3 [premises 3 (2.4)] × 0.5 = 1.2 + FREE
    // [premises 2 (1.6) + guard 4 (1.0)] = 2.6 → 9.95 → uncommon band
    // 4.5-13 (Theorem). FREE share 2.6/9.95 = 26.1% ✓ window.
    free: { premises: 2, guard: 4 },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 3 },
    ],
    specialMechanics: [
        { kind: 'premise', count: 3 },
        { kind: 'guard', amount: 6 },
    ],
    threshold: { color: 'heart', count: 3, rider: { premises: 3 } },
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'engine'],
};

/**
 * Amicus Curiae — peroration Theorem, the off-color engine: a friend of
 * the court. Conviction + cycle, and the straw-man line (dieBonus off)
 * pays premises for arguing on the wrong die. Mind-colored for the
 * mounting-case / peroratio-interrupta ×2 seats.
 */
const amicusCuriae: Card = {
    id: 'amicus-curiae',
    theme: 'peroration',
    name: 'Amicus Curiae',
    philosophicalAspect: 'mind',
    description:
        'A friend of the court, unasked and unpaid. Its counsel costs them ' +
        'nothing — except everything that follows from it.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts: PAID [conviction 2 (2.0) + draw 1 (2.0) + PREMISE 2 (1.6)] = 5.6
    // + dieBonus off [premises 2 (1.6)] × 0.6 = 0.96 + FREE [premises 2
    // (1.6) + guard 4 (1.0)] = 2.6 → 9.16 → uncommon band 4.5-13 (Theorem).
    // FREE share 2.6/9.16 = 28.4% ✓ window.
    free: { premises: 2, guard: 4 },
    specialMechanics: [
        { kind: 'rider', rider: { conviction: 2, drawCards: 1 } },
        { kind: 'premise', count: 2 },
    ],
    dieBonus: { onColor: 'off', rider: { premises: 2 } },
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'engine'],
};

// ─── Rares (7 — rank 5-6, the ×1 seats: finishers and build-arounds) ─────────

// PROMOTED OUT 2026-07-19 (owner-ratified): `quod-erat-demonstrandum` moved
// to `cards.library.ts` and the oratory rare heart spell seat (arm o3,
// docs/reports/deck-tuning-2026-07-18.md — late blind 0.119→0.278; the owner
// accepted the concede-centrality consequence).

/**
 * Ratio Decidendi — peroration Axiom, the fast conclusion WITHOUT a concede
 * line: fires every 4th premise for small, relentless bursts. Probes
 * whether Oratory prefers cadence over the alt-win. Heart-colored so this
 * rival is actually seatable at the-closing-word's ×1 rare seat (5/5/5 law).
 *
 * Order-proof (a-sweeter-poison discipline, `cards.sandbox-sets.ts`): this
 * card's `combatEffects` MARK plant resolves in the payload phase, BEFORE
 * the post-payload premise deposit (`gainPremises`, `combat.engine.ts`) —
 * and a deposit that crosses `at: 4` fires the `ruptureMarks` rider inside
 * that same play. So on a crossing play the conclusion CAN consume the mark
 * this card just planted: 1 fresh stack cashes as a 2 HP burst instead of
 * standing as the full MARK the pts line prices. ACCEPTED deliberately —
 * the self-cash is value-neutral-to-negative (a cadence quirk, not a power
 * leak), and the standing-MARK price below is the card's honest ceiling,
 * not its every-play floor.
 */
const ratioDecidendi: Card = {
    id: 'ratio-decidendi',
    theme: 'peroration',
    name: 'Ratio Decidendi',
    philosophicalAspect: 'heart',
    description:
        'The reason for the decision, applied at every fourth premise: ' +
        'small conclusions, relentlessly enforced. No mercy is offered, ' +
        'because none is required.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: PAID [PERORATION at 4: rider [ruptureMarks 2 (1.33) + draw 1
    // (2.0)] = 3.33 (no concede capstone) + PREMISE 2 (1.6)] = 4.93 +
    // dieBonus match [premises 1 (0.8)] × 0.6 = 0.48 + FREE [premises 2
    // (1.6) + guard 5 (1.25)] = 2.85 → 8.26 → rare band 7-19 (Axiom,
    // floor-adjacent by design: the conclusion is only as strong as the
    // marks the rest of the deck planted). FREE share 2.85/8.26 = 34.5%.
    // NO SELF-PLANT IS LOAD-BEARING (doctrine witness): premise deposits
    // are accounted at END of play (`gainPremises` after the rider loop,
    // combat.engine.ts), so a crossing play's conclusion sees every MARK
    // this same play planted — the self-cash cannot be ordered away, only
    // removed. The cadence conclusion is therefore a PURE CONSUMER: it
    // deposits and cashes, and the deck's planters (the-verdict-foregone
    // is this pool's dedicated MARK fuel) do the printing.
    free: { premises: 2, guard: 5 },
    specialMechanics: [
        { kind: 'peroration', at: 4, rider: { ruptureMarks: 2, drawCards: 1 } },
        { kind: 'premise', count: 2 },
    ],
    dieBonus: { onColor: 'match', rider: { premises: 1 } },
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'payoff'],
};

/**
 * Reductio ad Absurdum — peroration Aporia, the RUPTURE finisher: grant
 * them everything, then detonate the granted edifice. Heart-colored so
 * this rival conclusion is seatable at the-closing-word's ×1 rare seat
 * (5/5/5 law).
 */
const reductioAdAbsurdum: Card = {
    id: 'reductio-ad-absurdum',
    theme: 'peroration',
    name: 'Reductio ad Absurdum',
    philosophicalAspect: 'heart',
    description:
        'Grant them everything. Follow it faithfully, step by patient ' +
        'step, to the absurdity — then detonate the whole granted edifice ' +
        'at once.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    // pts: PAID [RUPTURE (verb 4.0 + expected fuel 8.0 = 12.0) + PREMISE 1
    // (0.8)] = 12.8 + threshold heart 3 [premises 1 (0.8)] × 0.5 = 0.4 +
    // FREE [draw 2 (4.0) + guard 2 (0.5)] = 4.5 → 17.7 → rare band 7-19
    // (Aporia). FREE share 4.5/17.7 = 25.4% ✓ window.
    free: { drawCards: 2, guard: 2 },
    specialMechanics: [
        { kind: 'rupture' },
        { kind: 'premise', count: 1 },
    ],
    threshold: { color: 'heart', count: 3, rider: { premises: 1 } },
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'payoff'],
};

/**
 * The Verdict Foregone — peroration Axiom, the MARK build-around: saturate
 * the record so every conclusion (ruptureMarks, RUPTURE) detonates larger.
 * Fuel card for QED / Ratio Decidendi / Reductio.
 */
const theVerdictForegone: Card = {
    id: 'the-verdict-foregone',
    theme: 'peroration',
    name: 'The Verdict Foregone',
    philosophicalAspect: 'heart',
    description:
        'Marked, and marked, and marked again. By the time the verdict is ' +
        'read aloud it has been true for pages, and everyone in the room ' +
        'knew it.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: PAID [mark i2 d4 (6.0) + PREMISE 2 (1.6)] = 7.6 + dieBonus match
    // [bonusIntensity 1 (1.5)] × 0.6 = 0.9 + FREE [premises 2 (1.6) +
    // guard 6 (1.5)] = 3.1 → 11.6 → rare band 7-19 (Axiom). FREE share
    // 3.1/11.6 = 26.7% ✓ window.
    free: { premises: 2, guard: 6 },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 4 },
    ],
    specialMechanics: [{ kind: 'premise', count: 2 }],
    dieBonus: { onColor: 'match', rider: { bonusIntensity: 1 } },
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'exposure'],
};

/**
 * The Unanswerable Question — peroration Axiom, the engine rare: refresh
 * the die, refill the hand, load the tally. A build-around that converts
 * one die into a whole turn of case-construction.
 */
const theUnanswerableQuestion: Card = {
    id: 'the-unanswerable-question',
    theme: 'peroration',
    name: 'The Unanswerable Question',
    philosophicalAspect: 'mind',
    description:
        'There is a question with no safe answer. You ask it calmly, note ' +
        'the silence — and reload the asking of it.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'self',
    // pts: PAID [REFRESH the powering die (2.0) + draw 2 (4.0) + PREMISE 3
    // (2.4)] = 8.4 + FREE [premises 2 (1.6) + guard 6 (1.5)] = 3.1 → 11.5 →
    // rare band 7-19 (Axiom). FREE share 3.1/11.5 = 27.0% ✓ window. Die
    // line = the refresh itself (die-manipulation slot).
    free: { premises: 2, guard: 6 },
    specialMechanics: [
        { kind: 'refresh_die' },
        { kind: 'rider', rider: { drawCards: 2 } },
        { kind: 'premise', count: 3 },
    ],
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'engine', 'dice', 'valve'],
};

/**
 * Argumentum ad Baculum — peroration Axiom, the exploit-flavored heavy DoT:
 * the appeal to the stick. FATE line lets an X die force the point at a
 * printed price in blood.
 */
const argumentumAdBaculum: Card = {
    id: 'argumentum-ad-baculum',
    theme: 'peroration',
    name: 'Argumentum ad Baculum',
    philosophicalAspect: 'body',
    description:
        'The appeal to the stick. It is beneath a philosopher, which is ' +
        'precisely why it works: the body concedes what the mind was ' +
        'still disputing.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: PAID [poison i2 d4 (card-played 1.83 cadence, tempo-weighted
    // 23.62 ÷ 3 = 7.87) + PREMISE 2 (1.6)] = 9.47 + FATE [bonusIntensity 1
    // (1.5) + premises 1 (0.8)] × 0.7 = 1.61 − recoil 3 × ⅓ × 0.75 = −0.75
    // + FREE [premises 2 (1.6) + draw 1 (2.0)] = 3.6 → 13.93 → rare band
    // 7-19 (Axiom). FREE share 3.6/13.93 = 25.8% ✓ window.
    free: { premises: 2, drawCards: 1 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 2, duration: 4 },
    ],
    specialMechanics: [{ kind: 'premise', count: 2 }],
    fate: { rider: { bonusIntensity: 1, premises: 1 }, recoilHp: 3 },
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'exposure', 'dot', 'condition'],
};

/**
 * The Eighth Premise — peroration Aporia, the concede ENABLER: the single
 * biggest premise surge in the theme (4 paid + 2 threshold + 2 free = up
 * to 8 in one play) — the "single breath" that jumps a declared
 * conclusion's tally past its concede line.
 */
const theEighthPremise: Card = {
    id: 'the-eighth-premise',
    theme: 'peroration',
    name: 'The Eighth Premise',
    philosophicalAspect: 'heart',
    description:
        'Premises enough, arriving in one breath. The argument does not ' +
        'conclude so much as arrive — whole, standing, past the point of ' +
        'refusal.',
    tier: 2, rank: 6, cardType: 'spell',
    targetType: 'self',
    // pts: PAID [PREMISE 4 (3.2) + draw 1 (2.0) + conviction 2 (2.0)] = 7.2
    // + threshold heart 4 [premises 2 (1.6)] × 0.5 = 0.8 + FREE [premises 2
    // (1.6) + draw 1 (2.0)] = 3.6 → 11.6 → rare band 7-19 (Aporia). FREE
    // share 3.6/11.6 = 31.0% ✓ window.
    free: { premises: 2, drawCards: 1 },
    specialMechanics: [
        { kind: 'premise', count: 4 },
        { kind: 'rider', rider: { drawCards: 1, conviction: 2 } },
    ],
    threshold: { color: 'heart', count: 4, rider: { premises: 2 } },
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'engine', 'alt-win'],
};

/**
 * Stare Decisis — peroration Axiom, the defensive rare: the decision
 * stands. The wall the theme lacks at rare — precedent as fortification,
 * with the case still accruing behind it.
 */
const stareDecisis: Card = {
    id: 'stare-decisis',
    theme: 'peroration',
    name: 'Stare Decisis',
    philosophicalAspect: 'body',
    description:
        'The decision stands. What was ruled once is a wall forever; let ' +
        'them exhaust themselves against precedent.',
    tier: 2, rank: 5, cardType: 'spell',
    targetType: 'self',
    // pts: PAID [GUARD 16 (4.0) + PREMISE 2 (1.6) + draw 1 (2.0)] = 7.6 +
    // threshold body 3 [guard 8 (2.0)] × 0.5 = 1.0 + FREE [guard 8 (2.0) +
    // premises 2 (1.6)] = 3.6 → 12.2 → rare band 7-19 (Axiom). FREE share
    // 3.6/12.2 = 29.5% ✓ window.
    free: { guard: 8, premises: 2 },
    specialMechanics: [
        { kind: 'guard', amount: 16 },
        { kind: 'premise', count: 2 },
        { kind: 'rider', rider: { drawCards: 1 } },
    ],
    threshold: { color: 'body', count: 3, rider: { guard: 8 } },
    addedIn: '2026-07-18',
    tags: ['peroration', 'swap-pool', 'defense'],
};

// ─── The set ─────────────────────────────────────────────────────────────────

export const SWAP_POOL_PERORATION: SandboxCardSet = {
    id: 'swap-peroration',
    name: 'Swap pool: peroration',
    description:
        'Thirty spell-only swap candidates for the oratory preset recipe. ' +
        'Probes: denser Premise deposit at the common seats, a guard spine ' +
        'the theme currently lacks, react- and fate-gated engine uncommons, ' +
        'and three rival conclusions (faster CONCEDE, concede-less cadence, ' +
        'and a RUPTURE detonation) against the-closing-word seat — all ' +
        'three heart, seat-legal under the 5/5/5 color law. Anaphora and ' +
        'the live valve restate-the-point are ONE experiment: the declared ' +
        'valve-seat A/B (same heart REFRESH core; third premise traded for ' +
        'a conviction line). Commons are heart 6 / body 4 for the exordium ' +
        'and brace-for-impact ×4 seats; engine uncommons lean mind (7) for ' +
        'the mounting-case / peroratio-interrupta ×2 seats. Deliberate ' +
        'off-seat reach cards — tricolon + the-hostile-witness (heart U), ' +
        'onus-probandi + the-prepared-rebuttal (body U), ' +
        'the-unanswerable-question (mind R), argumentum-ad-baculum + ' +
        'stare-decisis (body R) — are unswappable without a coordinated ' +
        'multi-seat recolor, which needs owner sign-off.',
    cards: [
        // commons (9; videtur-quod promoted out 2026-07-19)
        narratio, distinguo, adRem, sedContra,
        aFortiori, obiterDictum, resIpsaLoquitur, pointOfOrder, leadingQuestion,
        // uncommons (12)
        confirmatio, refutatio, anaphora, hypophora, onusProbandi,
        thePreparedRebuttal, elenchus, crossExamination, recapitulatio,
        theHostileWitness, tricolon, amicusCuriae,
        // rares (7; quod-erat-demonstrandum promoted out 2026-07-19)
        ratioDecidendi, reductioAdAbsurdum,
        theVerdictForegone, theUnanswerableQuestion, argumentumAdBaculum,
        theEighthPremise, stareDecisis,
    ],
};
