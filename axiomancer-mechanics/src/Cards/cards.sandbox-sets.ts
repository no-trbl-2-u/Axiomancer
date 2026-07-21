/**
 * Named sandbox card SETS — curated experiment bundles the playtest CLI and
 * the `/deck-tuning` card load with one flag (`--sandbox=<setId>`).
 *
 * A set bundles new experimental cards and/or numeric overrides of library
 * cards. Applying a set registers everything into the sandbox registry
 * (`cards.sandbox.ts`), which `getCardById` consults first — so the set is
 * live across deck building, projection, and execution for that process.
 *
 * SPEC 32 v3 RESET (2026-07-08): the pre-v3 experiment sets referenced retired
 * cards, retired effect ids, and the deleted `basePower` field — all cleared
 * with the library overhaul. `/deck-tuning` authors fresh v3 sets here (cards
 * must use the 30-keyword effect set and the v3 `Card` schema: `rank`,
 * `cardType`, `free` — no raw HP damage; the schema enforces the doctrine).
 *
 * Promotion path: a sandbox card that proves out across stages/policies moves
 * its literal into `cards.library.ts` in the same PR as the evidence table.
 */

import {
    registerSandboxCards,
    registerSandboxOverride,
    type SandboxCardPatch,
} from './cards.sandbox';
import type { Card } from './types';
// ── The per-theme swap pools (owner-ratified fan-out 2026-07-18) ─────────────
// Ten standing candidate sets — 30 spells each, 10/12/8 common/uncommon/rare —
// authored as /deck-tuning measurement-seat candidates for the preset recipes
// (`--deck=preset:<id>+swap:<out>/<in>` + `--sandbox=swap-<theme>`). Never
// player-facing; promotion into cards.library.ts is the only shipping path.
// Contract pinned by src/Cards/e2e/swap-pool.engine.test.ts. NOTE: these are
// deliberately TEN sets, not one umbrella — the doctrine sweep registers every
// set at once, so a duplicate-cards umbrella would collide.
import { SWAP_POOL_AFFLICTION } from './swap-pool/affliction.swap-pool';
import { SWAP_POOL_AKRASIA } from './swap-pool/akrasia.swap-pool';
import { SWAP_POOL_BULWARK } from './swap-pool/bulwark.swap-pool';
import { SWAP_POOL_CHARM } from './swap-pool/charm.swap-pool';
import { SWAP_POOL_CONTROL } from './swap-pool/control.swap-pool';
import { SWAP_POOL_ECHO } from './swap-pool/echo.swap-pool';
import { SWAP_POOL_FORGE } from './swap-pool/forge.swap-pool';
import { SWAP_POOL_HARVEST } from './swap-pool/harvest.swap-pool';
import { SWAP_POOL_ORACLE } from './swap-pool/oracle.swap-pool';
import { SWAP_POOL_PERORATION } from './swap-pool/peroration.swap-pool';

export interface SandboxCardSet {
    id: string;
    name: string;
    description: string;
    cards: readonly Card[];
    overrides?: ReadonlyArray<{ cardId: string; patch: SandboxCardPatch }>;
}

// ── WS7.2 (spec 32 §12 item 5) — the first chosen X-cost card ────────────────

/**
 * The Open Vein — akrasia Theorem, the `recoil_x` witness: RECOIL X of the
 * player's choosing (min 3) → POISON at ceil(X/3) intensity. Sandbox-first;
 * promotion into the library rides the WS7.2 gate (the chosen-X distribution
 * must be non-degenerate across sim policies).
 */
const theOpenVein: Card = {
    id: 'the-open-vein',
    theme: 'akrasia',
    name: 'The Open Vein',
    philosophicalAspect: 'body',
    description:
        'How much will you bleed to make the point? The vein does not ' +
        'bargain — it only opens as wide as you ask, and the argument turns ' +
        'exactly that much more venomous.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts (re-based 2026-07-11, WS3.5 clock pricing; post-Phase-30 merge
    // re-pin 2026-07-12; spec 33 D4 re-derives the card-played cadence 2 →
    // 1.83): expected X ≈ 6 (VERB_POINTS.expectedChosenX) → POISON ceil(6/3)=i2
    // d4 on the card-played clock, tempo-weighted lifetime ≈ 23.6 HP ÷ 3 ≈ 7.87,
    // − recoil credit 6 × healPerHp(1/3) × SELF_COST_CREDIT 0.75 = −1.5, + FREE
    // self-mark i1 d1 0.75 ≈ 7.12 → uncommon band 4.5-13 (Theorem).
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' } },
    specialMechanics: [{ kind: 'recoil_x', min: 3, poisonPerX: 1 / 3 }],
    addedIn: '2026-07-11',
    tags: ['akrasia', 'dot', 'chooseX'],
};

// ── WS3.4 (spec 32 §12 item 3) — the Doom species witness ────────────────────

/**
 * Debt of Days — harvest Thesis, the `debuff_creeping_doom` witness: a small
 * DoT that GROWS +1 intensity every time the enemy acts and never expires by
 * calendar (`calendarExpiry: false` — it ends only when consumed or the
 * combat does). Card-local face keyword DOOM under the 2026-07-10
 * card-keyword doctrine — explicitly NOT keyword #31 (ratified); no atlas row
 * until the species reaches ~3 cards (WS10 policy). Harvest is the natural
 * home: a no-calendar affliction is a standing Soul deposit that only pays
 * out through REAP/RUPTURE consumption.
 */
const debtOfDays: Card = {
    id: 'debt-of-days',
    theme: 'harvest',
    name: 'Debt of Days',
    philosophicalAspect: 'heart',
    description:
        'It is not the argument that ruins them — it is every answer they ' +
        'attempt. Each act of resistance is booked as interest, and the ' +
        'principal is never forgiven, only harvested.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts (post-Phase-30 merge re-pin 2026-07-12 — TICK is dead
    // registry-wide, FREE deposits harvest's currency, a Soul, instead):
    // DOOM (creeping_doom i2, growth +1/enemy action, no calendar —
    // 4-round pricing horizon: 1×(2+3+4+5) = 14 HP ÷ 3 ≈ 4.67) + SOUL 1
    // (0.75) + FREE soul 0.75 = 6.17 → uncommon band 4.5-13 (Thesis).
    free: { souls: 1 },
    combatEffects: [{ effectId: 'debuff_creeping_doom', appliedTo: 'opponent', intensity: 2, duration: 3 }],
    specialMechanics: [{ kind: 'soul_gain', count: 1 }],
    addedIn: '2026-07-11',
    tags: ['harvest', 'dot', 'doom'],
};

// ── WS2.1 — exercise CONJURE via the Thoughtform registry ────────────────────
// The two library-candidate CONJURE cards. Their conjured targets (tf-cinder,
// tf-minor-premise) are NOT sandbox cards — they live permanently in
// `cards.thoughtforms.ts` (correction C-11: Thoughtforms never enter the
// pinned 70-card library, and never enter reward/stage pools).

/**
 * Foundry Sprite — forge Thesis, the first CONJURE exerciser: ripen the
 * Reserve and hammer off a Cinder (a one-use ember token). Sandbox-first;
 * promotion rides the WS2 gate (CONJURE atlas row must earn its `+`).
 */
const foundrySprite: Card = {
    id: 'foundry-sprite',
    theme: 'forge',
    name: 'Foundry Sprite',
    philosophicalAspect: 'mind',
    description:
        'A leftover intention that never cooled. It ripens what waits in ' +
        'the racks, then hammers a stray thought into something you can ' +
        'throw exactly once.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: CONJURE (2) + PIP 1 (1.5) + FREE pips 1 (1.5) = 5.0 by scoreCard
    // → uncommon band 4.5-13 (Thesis). Design EV: the conjured Cinder plays
    // at ~4.5 (ember i3 d3 + FREE pip, see cards.thoughtforms.ts), so the
    // effective two-play value ≈ 9.5 — the gap between 5.0 and 9.5 is the
    // second die the Cinder play costs.
    free: { pips: 1 },
    specialMechanics: [
        { kind: 'conjure_card', cardId: 'tf-cinder' },
        { kind: 'grant_pip', count: 1 },
    ],
    addedIn: '2026-07-11',
    tags: ['forge', 'dice', 'conjure'],
};

/**
 * Corollary — peroration Lemma, the second CONJURE exerciser: a premise
 * that implies its own follow-up (a one-use Minor Premise token).
 */
const corollary: Card = {
    id: 'corollary',
    theme: 'peroration',
    name: 'Corollary',
    philosophicalAspect: 'heart',
    description:
        'State the premise and its consequence arrives unbidden, already ' +
        'phrased. You did not argue it; it follows.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: PREMISE 1 (0.8) + CONJURE (2) + FREE premise 1 (0.8) = 3.6 by
    // scoreCard → common band 1.5-7.5 (Lemma). Design EV: the conjured
    // Minor Premise cashes ~0.8-1.6 more tally on a later play — effective
    // ≈ 4.4-5.2, safely under the 7.5 common ceiling.
    free: { premises: 1 },
    specialMechanics: [
        { kind: 'premise', count: 1 },
        { kind: 'conjure_card', cardId: 'tf-minor-premise' },
    ],
    addedIn: '2026-07-11',
    tags: ['peroration', 'conjure'],
};

// ── WS4.1 (spec 32 §12 item 4/5) — forge theme-role pass (`roles-forge`) ─────

/**
 * Slag Runoff — forge Lemma, the KINDLE-species driller (WS10.3): RIPEN the
 * Reserve, and every pip that finds no room (Reserve at `RESERVE_PIP_CAP`, or
 * empty) converts into a Kindling Ember on the foe instead of vanishing. The
 * forge's waste heat is never wasted — which also makes the card's floor
 * honest: on a pip-saturated board it becomes a small DoT applier, on a
 * hungry board a pure ripener.
 */
const slagRunoff: Card = {
    id: 'slag-runoff',
    theme: 'forge',
    name: 'Slag Runoff',
    philosophicalAspect: 'mind',
    description:
        'What the mold cannot hold does not return to the crucible — it ' +
        'runs, still glowing, wherever the floor tilts. Let it tilt toward ' +
        'them.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: PAID grant_pip 2 (2 × 1.5 = 3.0) + overflow→ember (kindling_ember
    // i1 d3 printed 3 → phase-36b tempo-weighted 2.31 ÷ 3 = 0.77 per overflowed
    // pip × expectedOverflowPips 1 = 0.77) + FREE pips 1 (1.5) = 5.27 → common
    // band 1.5-7.5 (Lemma). FREE share 1.5/5.27 = 28.5% ✓ the 25-35% window.
    free: { pips: 1 },
    specialMechanics: [{
        kind: 'grant_pip', count: 2,
        overflow: { applyEffect: { effectId: 'debuff_kindling_ember' } },
    }],
    addedIn: '2026-07-11',
    tags: ['forge', 'dice', 'ember'],
};

/**
 * Ingot of Ruin — forge Axiom, the uncapped ALL-spender the theme lacked
 * (WS7 landed: the flat floors are gone; spec 32 §12 item 5 ratifies that an
 * ALL-spender's price is the input opportunity cost). One last hammer-fall
 * (RIPEN 1), then pour EVERYTHING: +1 MARK per 2 pips spent — UNCAPPED — and
 * the closer cashes every MARK at 3 HP per stack. The closer is authored in
 * post-TICK vocabulary: `ruptureMarks` is a payoff-class verb that fires the
 * WS3 'payoff' DoT-trigger clock as it detonates (combat.engine.ts rider
 * loop), NOT the dead TICK keyword.
 */
const ingotOfRuin: Card = {
    id: 'ingot-of-ruin',
    theme: 'forge',
    name: 'Ingot of Ruin',
    philosophicalAspect: 'mind',
    description:
        'Every pip you hoarded was a syllable of their name. Pour the whole ' +
        'crucible at once and read it back to them — cast, cooled, and ' +
        'signed.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: grant_pip 1 (1.5) + spend_all_pips (1.0) + markPer 2 (expected
    // floor(2/2) = 1 MARK stack → statusPoints mark i1 d2 = 1.5; UNCAPPED
    // upside rides the real bank) + closer ruptureMarks 3 (3 × 2/3 = 2.0) +
    // FREE pips 1 (1.5) = 7.5 → rare band 7-19 (Axiom, floor-adjacent by
    // design: the neutral read carries ~2 pips; the ceiling is the emptied
    // bank, §12 item 5).
    free: { pips: 1 },
    specialMechanics: [
        { kind: 'grant_pip', count: 1 },
        { kind: 'spend_all_pips', markPer: 2 },
        { kind: 'rider', rider: { ruptureMarks: 3 } },
    ],
    addedIn: '2026-07-11',
    tags: ['forge', 'dice', 'payoff'],
};

// ── WS4.2 (spec 32 §12 item 4) — bulwark theme-role pass (`roles-bulwark`) ───
// Ratified: RIPOSTE-reflects-the-prevented-blow WINS over consume-all-defense;
// Rampart Reckoning / `consume_defense` is NOT built. These two are the
// ratified supporting cast: a non-reactive sting + the ledger-read wall.

/**
 * Grit Between Stones — bulwark Theorem: the wall that stings without being
 * struck. Applies Nettle Sting (the theme's non-reactive DoT species) plus a
 * payoff-class tick: `ruptureMarks` fires the WS3 'payoff' clock and cashes
 * every MARK on the foe at 2 HP per stack — closing the loop Hedgehog's
 * Dilemma opens (its THORNS reflections print marks that previously had no
 * consumer in-theme; MARK is utility vocabulary, spec 32 §3).
 */
const gritBetweenStones: Card = {
    id: 'grit-between-stones',
    theme: 'bulwark',
    name: 'Grit Between Stones',
    philosophicalAspect: 'body',
    description:
        'The wall was never smooth. Everything they have thrown at it is ' +
        'still in it, edge out — and today the mortar gives it all back.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts (post-Phase-30 merge re-pin 2026-07-12 — FREE lays bulwark's
    // currency, a persistent BARRIER brick, instead of the fading chip
    // guard): nettle sting i2 d3 (printed 12 → phase-36b tempo-weighted 9.25
    // ÷ 3 = 3.08) + Guard 6 (1.5) + payoff-class closer ruptureMarks 2 (2 × 2/3
    // = 1.33) + FREE barrier 2 (0.67) = 6.58 → uncommon band 4.5-13 (Theorem).
    free: { barrier: 2 },
    combatEffects: [
        { effectId: 'debuff_nettle_sting', appliedTo: 'opponent', intensity: 2, duration: 3 },
    ],
    specialMechanics: [
        { kind: 'guard', amount: 6 },
        { kind: 'rider', rider: { ruptureMarks: 2 } },
    ],
    addedIn: '2026-07-11',
    tags: ['bulwark', 'reflect', 'payoff'],
};

/**
 * The Unmoved Mover — bulwark Thesis, the first combat-ledger condition card
 * (spec 32 §12 item 4): reads `enemyDamageLastRound` through the extended
 * CardSynergy state-predicate gate. If the enemy dealt you no damage last
 * round — fully blocked, denied, or idle — the wall answers: THORNS i2 d2 +
 * Guard 4, free. The condition prices at the threshold ×0.5 discount.
 */
const theUnmovedMover: Card = {
    id: 'the-unmoved-mover',
    theme: 'bulwark',
    name: 'The Unmoved Mover',
    philosophicalAspect: 'body',
    description:
        'It moves everything and is moved by nothing. Prove it for one full ' +
        'round — let their whole argument arrive and change you not at all — ' +
        'and the stillness itself starts pushing back.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts (post-Phase-30 merge re-pin 2026-07-12 — FREE lays bulwark's
    // currency, a persistent BARRIER brick, instead of the fading chip
    // guard): BARRIER 8 (8 ÷ 3 = 2.67) + UNMOVED condition rider [thorns i2
    // d2 self (0.75 × 2 × 2 = 3.0) + guard 4 (1.0)] × threshold 0.5 = 2.0 +
    // FREE barrier 2 (0.67) = 5.33 → uncommon band 4.5-13 (Thesis).
    free: { barrier: 2 },
    specialMechanics: [{ kind: 'barrier', amount: 8 }],
    synergy: {
        statePredicate: { kind: 'enemy-dealt-no-damage-last-round' },
        rider: {
            applyEffect: { effectId: 'buff_thorns', intensity: 2, duration: 2, to: 'self' },
            guard: 4,
        },
    },
    addedIn: '2026-07-11',
    tags: ['bulwark', 'defense', 'condition'],
};

// ── WS4.3 (spec 32 §12 item 4) — charm theme-role pass (`roles-charm`) ───────
// Ratified CONDITIONAL: Steadfast Regard (the one-turn SWAY decay-pause) and
// Crescendo of Affection (SWAY + half-current-SWAY scaling) are NOT built —
// spec 32 §12 item 4 keeps both conditional on post-Phase-26/27 telemetry
// STILL showing the charm late hole. This set ships only the
// unconditionally-ratified card.

/**
 * A Sweeter Poison — charm Theorem: the compliment with the pit left in.
 * PAID: SWAY 3, then the RUPTURE-class closer (`ruptureMarks` — a payoff-class
 * verb: it fires the WS3 'payoff' trigger clock, then cashes every STANDING
 * MARK at 2 HP per stack), and only THEN plants MARK ×2 for the next twist of
 * the knife. Rider order is engine order (firedRiders resolve in insertion
 * order), so the closer consumes PRE-EXISTING marks only — on a clean board it
 * is silence, not a strike in disguise. A full `rupture` was rejected twice
 * over: it prices at 12 (V.rupture 4 + expected fuel 8 — rank-dishonest for a
 * Theorem also carrying SWAY + MARK), and it consumes ALL afflictions —
 * including RAPPORT, the charm state the rest of the deck builds.
 */
const aSweeterPoison: Card = {
    id: 'a-sweeter-poison',
    theme: 'charm',
    name: 'A Sweeter Poison',
    philosophicalAspect: 'heart',
    description:
        'Flattery with the pit left in. They swallow the kindness whole, and ' +
        'every flaw you ever named in them turns over at once — sweeter ' +
        'going down, and already naming the next two.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts (phase 36a: SWAY 0.8→0.9): SWAY 3 (2.7) + closer ruptureMarks 2
    // (2 × 2/3 = 1.33) + MARK ×2 (mark i2 d2 = 3.0) + FREE [sway 2 (1.8) +
    // heal 2 (0.67)] = 9.5 → uncommon band 4.5-13 (Theorem). FREE share
    // 2.47/9.5 = 26.0% ✓ window.
    free: { sway: 2, healHp: 2 },
    specialMechanics: [
        { kind: 'sway', amount: 3 },
        { kind: 'rider', rider: { ruptureMarks: 2 } },
        { kind: 'rider', rider: { applyEffect: { effectId: 'debuff_mark', intensity: 2 } } },
    ],
    addedIn: '2026-07-11',
    tags: ['charm', 'payoff', 'alt-win'],
};

// ── WS4.4 — harvest theme-role pass (`roles-harvest`) ────────────────────────
// Builds TOWARD Phase 32's ratified harvest shape (REAP attacks max HP +
// travelling Souls) WITHOUT duplicating Phase 32's own item — the max-HP REAP
// payoff belongs to Phase 32; these two are its supporting cast.

/**
 * The Long Ledger — harvest Thesis: call in two accounts at once. PAID: TWO
 * payoff-class DoT fires — each `consume_affliction` is a payoff-class verb
 * (the engine fires the WS3 'payoff' trigger clock inside it), and the picked
 * affliction's ENTIRE remaining fuel ticks NOW — then a short Bleed is booked
 * as the next entry. The Bleed is rider-carried so it lands AFTER the
 * consumes (the ledger never eats its own fresh line; on a clean board both
 * consumes find nothing and the card chips NOTHING). The consumes print NO
 * Soul yield — the ledger trades yield for tempo (the compression IS the
 * point); the FREE deposit and the fresh Bleed's own churn carry the account.
 */
const theLongLedger: Card = {
    id: 'the-long-ledger',
    theme: 'harvest',
    name: 'The Long Ledger',
    philosophicalAspect: 'mind',
    description:
        'Every wound is an entry, and entries accrue. Today the ledger calls ' +
        'in two accounts at full term, early — and opens a fresh line of ' +
        'credit before the ink of the old ones is dry.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: consume_affliction ×2 (2 × 5.5 = 11.0) + rider bleed i1 d1
    // (damage-instance clock: one 3-HP tick then washout = 3 ÷ 3 = 1.0) +
    // FREE souls 1 (0.75) = 12.75 → uncommon band 4.5-13 (Thesis,
    // ceiling-adjacent by design). FREE share 0.75/12.75 = 5.9% — under the
    // 25-35% window, `intentionallyAsymmetric`: the double-payoff PAID line
    // alone fills the band, so ANY in-window FREE overflows the 13 ceiling
    // (the slippery-slope promotion-note precedent).
    free: { souls: 1 },
    intentionallyAsymmetric: true,
    specialMechanics: [
        { kind: 'consume_affliction', souls: 0 },
        { kind: 'consume_affliction', souls: 0 },
        { kind: 'rider', rider: { applyEffect: { effectId: 'debuff_bleed', intensity: 1, duration: 1 } } },
    ],
    addedIn: '2026-07-11',
    tags: ['harvest', 'payoff', 'dot'],
};

/**
 * Seedcorn Sacrifice — harvest Theorem: closes the flywheel. PAID: REAP 2
 * Souls (fizzles underfunded — the printed cost is real) → sow a heavy short
 * Bleed (i3, one round on the damage-instance clock: two ticks then washout —
 * next season's Souls) and draw 1 (keep the cycle turning). FREE: the
 * standing harvest deposit (SOUL 1) plus the DRAW-1-class kicker — legal
 * under the ratified weak-deposit amendment (deposit 0.75 < the 2.0
 * draw-class floor; gleaner's-due precedent).
 */
const seedcornSacrifice: Card = {
    id: 'seedcorn-sacrifice',
    theme: 'harvest',
    name: 'Seedcorn Sacrifice',
    philosophicalAspect: 'body',
    description:
        'Eat the seed and there is no next year; sow the souls you meant to ' +
        'keep and next year arrives early, bleeding. The granary weeps. The ' +
        'field does not.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: REAP 2 → rider [bleed i3 d1 (9+6 = 15 HP ÷ 3 = 5.0) + draw (2.0)]
    // − soul cost 2 × 0.75 × SELF_COST_CREDIT 0.75 (= −1.125) = 5.875 + FREE
    // [souls 1 (0.75) + draw (2.0)] = 8.625 → uncommon band 4.5-13 (Theorem).
    // FREE share 2.75/8.625 = 31.9% ✓ window.
    free: { souls: 1, drawCards: 1 },
    specialMechanics: [{
        kind: 'reap', cost: 2,
        rider: {
            applyEffect: { effectId: 'debuff_bleed', intensity: 3, duration: 1 },
            drawCards: 1,
        },
    }],
    addedIn: '2026-07-11',
    tags: ['harvest', 'dot'],
};

// ── WS5.2 — the sequencing-grammar microset (`sequencing-microset`) ──────────
// Six condition cards that read the turn's SHAPE through the extended
// CardSynergy state-predicate gate (the ONE conditional gate, WS4.2): two
// "early" (OPENING — at most N prior spells this turn), two "late" (the
// closing play — ≤ 2 cards left in hand after this), two "after-cost" (a
// blood price already on the ledger / the enemy drew blood since your last
// turn). Every condition prices at the threshold ×0.5 discount. OPENING is
// the microset's ONE shared face term — card-local per the card-keyword
// doctrine, registered nowhere until it earns ~3 proven cards. The set stays
// sandbox for the whole prototype: promotion is gated on the WS5.3
// falsifiable test AND the WS5.4 draft-appeal evidence (post-Phase-26).

/**
 * Captatio Benevolentiae — peroration Lemma, the OPENING witness: the
 * classical opening bid for goodwill. Worth a Premise and a modest Guard any
 * time; worth double when it actually OPENS (first spell of the turn).
 */
const captatioBenevolentiae: Card = {
    id: 'captatio-benevolentiae',
    theme: 'peroration',
    name: 'Captatio Benevolentiae',
    philosophicalAspect: 'heart',
    description:
        'Win the room before the argument starts. Spoken first, the courtesy '
        + 'is a foundation; spoken third, it is only a pleasantry.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: PAID [guard 5 (1.25) + PREMISE 1 (0.8)] = 2.05 + OPENING rider
    // [guard 5 (1.25) + premise 1 (0.8)] × threshold 0.5 = 1.025 + FREE
    // [premise 1 (0.8) + guard 1 (0.25)] = 1.05 → 4.125 → common band
    // 1.5-7.5 (Lemma). FREE share 1.05/4.125 = 25.5% ✓ window.
    free: { premises: 1, guard: 1 },
    specialMechanics: [
        { kind: 'guard', amount: 5 },
        { kind: 'premise', count: 1 },
    ],
    synergy: {
        statePredicate: { kind: 'opening', maxPriorSpells: 0 },
        rider: { guard: 5, premises: 1 },
    },
    addedIn: '2026-07-11',
    tags: ['peroration', 'sequencing', 'condition'],
};

/**
 * In Medias Res — peroration Thesis, the looser OPENING (first OR second
 * spell): start inside the action and the poison you open with runs deeper
 * (+1 intensity on this play's statuses) while the thread pulls a card.
 */
const inMediasRes: Card = {
    id: 'in-medias-res',
    theme: 'peroration',
    name: 'In Medias Res',
    philosophicalAspect: 'mind',
    description:
        'Skip the preamble — begin where the wound already is. An argument '
        + 'entered early runs deeper than one arrived at politely.',
    tier: 1, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: PAID [poison i1 d2 (spec 33 D4 1.83 cadence: tempo-weighted 6.4 ÷ 3
    // = 2.14) + PREMISE 1 (0.8)] = 2.94 + OPENING(≤1) rider [bonusIntensity 1
    // (1.5) + draw (2.0)] × threshold 0.5 = 1.75 + FREE [premises 2 (1.6) +
    // guard 1 (0.25)] = 1.85 → 6.54 → uncommon band 4.5-13 (Thesis). FREE
    // share 1.85/6.54 = 28.3% ✓ window.
    free: { premises: 2, guard: 1 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    specialMechanics: [{ kind: 'premise', count: 1 }],
    synergy: {
        statePredicate: { kind: 'opening', maxPriorSpells: 1 },
        rider: { bonusIntensity: 1, drawCards: 1 },
    },
    addedIn: '2026-07-11',
    tags: ['peroration', 'sequencing', 'condition', 'dot'],
};

/**
 * Coda — echo Thesis, the finale REPRISE: when the verse runs out (≤ 2 cards
 * left behind), the refrain returns and the hand refills. The reprise itself
 * pulls a spent card back, so the coda writes the next movement.
 */
const coda: Card = {
    id: 'coda',
    theme: 'echo',
    name: 'Coda',
    philosophicalAspect: 'mind',
    description:
        'The piece is not over when the notes run out — the ending is where '
        + 'the theme comes back to collect. Save it for the empty bars.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: PAID [REPRISE 1 (2.0) + mark i1 d2 (1.5)] = 3.5 + closing-play
    // rider [draw 2 (4.0)] × threshold 0.5 = 2.0 + FREE [mark i1 d2 (1.5) +
    // conviction 1 (1.0)] = 2.5 → 8.0 → uncommon band 4.5-13 (Thesis).
    // FREE share 2.5/8.0 = 31.3% ✓ window.
    free: { applyEffect: { effectId: 'debuff_mark', duration: 2 }, conviction: 1 },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    specialMechanics: [{ kind: 'reprise', count: 1 }],
    synergy: {
        statePredicate: { kind: 'finale', cardsLeftAtMost: 2 },
        rider: { drawCards: 2 },
    },
    addedIn: '2026-07-11',
    tags: ['echo', 'sequencing', 'condition'],
};

/**
 * Dying Echo — echo Lemma, the finale DoT: a small poison that rings loudest
 * as the last note (played with ≤ 2 cards left behind it lands +2 intensity,
 * +1 turn). Early it is a whisper the card-played clock multiplies; late it
 * is the note that hangs after the music stops.
 */
const dyingEcho: Card = {
    id: 'dying-echo',
    theme: 'echo',
    name: 'Dying Echo',
    philosophicalAspect: 'mind',
    description:
        'Every hall answers the last word longest. Say it when nothing '
        + 'follows, and it never quite stops being said.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: PAID poison i1 d2 (spec 33 D4 1.83 cadence: tempo-weighted 6.4 ÷ 3
    // = 2.14) + closing-play rider [bonusIntensity 2 (3.0) + bonusDuration 1
    // (1.0)] × threshold 0.5 = 2.0 + FREE [mark i1 d1 (0.75) + conviction 1
    // (1.0)] = 1.75 → 5.89 → common band 1.5-7.5 (Lemma). FREE share
    // 1.75/5.89 = 29.7% ✓ window.
    free: { applyEffect: { effectId: 'debuff_mark', duration: 1 }, conviction: 1 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    synergy: {
        statePredicate: { kind: 'finale', cardsLeftAtMost: 2 },
        rider: { bonusIntensity: 2, bonusDuration: 1 },
    },
    addedIn: '2026-07-11',
    tags: ['echo', 'sequencing', 'condition', 'dot'],
};

/**
 * Wages of Weakness — akrasia Thesis, the Frenzy after RECOIL: a bleed and a
 * mark any time, but if a blood price is already on this turn's ledger
 * (`recoilPaidThisTurn > 0` — a PRIOR play paid it; this card pays none), the
 * spilled blood answers: a second bleed and 3 HP back.
 */
const wagesOfWeakness: Card = {
    id: 'wages-of-weakness',
    theme: 'akrasia',
    name: 'Wages of Weakness',
    philosophicalAspect: 'body',
    description:
        'You have already bled for this argument — so collect. Every drop '
        + 'you paid earlier comes back with interest, and the interest cuts.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: PAID [bleed i2 d2 (9 HP ÷ 3 = 3.0) + mark i1 d2 (1.5)] = 4.5 +
    // blood-paid rider [bleed i2 d2 (3.0) + heal 3 (1.0)] × threshold 0.5 =
    // 2.0 + FREE [mark i1 d2 (1.5) + heal 3 (1.0)] = 2.5 → 9.0 → uncommon
    // band 4.5-13 (Thesis). FREE share 2.5/9.0 = 27.8% ✓ window.
    free: { applyEffect: { effectId: 'debuff_mark', duration: 2 }, healHp: 3 },
    combatEffects: [
        { effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 2 },
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    synergy: {
        statePredicate: { kind: 'recoil-paid-this-turn' },
        rider: {
            applyEffect: { effectId: 'debuff_bleed', intensity: 2, duration: 2 },
            healHp: 3,
        },
    },
    addedIn: '2026-07-11',
    tags: ['akrasia', 'sequencing', 'condition', 'dot'],
};

/**
 * Answered in Kind — akrasia Lemma, the Frenzy after the enemy's hit: a short
 * heavy bleed any time; if the enemy drew blood since your last turn
 * (`enemyDamageLastRound > 0` — threats land between player turns), the
 * answer marks them deep (MARK ×2) and closes 2 HP of the wound.
 */
const answeredInKind: Card = {
    id: 'answered-in-kind',
    theme: 'akrasia',
    name: 'Answered in Kind',
    philosophicalAspect: 'heart',
    description:
        'They opened the wound; you only widened the custom. What was taken '
        + 'in blood is returned in blood, at the prevailing rate.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts (post-Phase-30 merge re-pin 2026-07-12 — FREE deposits akrasia's
    // currency, a self-MARK seed toward FALLEN, replacing conviction, which
    // is a system token not a registry keyword; heal 2 stays as the weak-
    // deposit utility kicker): PAID bleed i2 d1 (9 HP ÷ 3 = 3.0) +
    // drew-blood rider [mark i2 d2 (3.0) + heal 2 (0.67)] × threshold 0.5 =
    // 1.83 + FREE [self-mark i1 d1 (0.75) + heal 2 (0.67)] = 1.42 → 6.25 →
    // common band 1.5-7.5 (Lemma). FREE share 1.42/6.25 = 22.7%.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1, to: 'self' }, healHp: 2 },
    combatEffects: [
        { effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 1 },
    ],
    synergy: {
        statePredicate: { kind: 'enemy-drew-blood' },
        rider: {
            applyEffect: { effectId: 'debuff_mark', intensity: 2, duration: 2 },
            healHp: 2,
        },
    },
    addedIn: '2026-07-11',
    tags: ['akrasia', 'sequencing', 'condition'],
};

// ── WS6.2 — cross-theme bridge rewards (`bridge-rewards`) ────────────────────
// Six reward-screen splash cards, ONE per ratified pairing, each speaking the
// utility-10 plus ONLY its two parents' currencies (no third-theme hallmark
// imports; every verb below already exists in the engine — no new mechanic
// kinds). They are sandbox-only: the WS6.1 harness measures them at reward
// screens via `runRewardDraftSim(origin, seed, screens, { sandboxSetId:
// 'bridge-rewards' })`; the WS6.3 gate (picked by ≥2 distinct origins at a
// non-trivial rate) decides promotion — NOT this session.
//
// Two pairings ship as the NEAREST BUILDABLE SHAPE (flagged, not silently
// approximated):
//   - akrasia↔harvest: "self-affliction expiry → Souls" has no engine hook
//     (the Soul economy counts ENEMY affliction expiry only — combat.engine
//     `expiredAfflictions` / `soulWorthyWashouts` are enemy-side). Interest on
//     the Flesh books the loan UP FRONT: the self-Bleed is the printed cost,
//     the Souls are paid now.
//   - control↔echo: "STAGGER'd rung → REPRISE fuel" has no causal ledger (no
//     rungs-denied predicate). Stolen Cadence carries both verbs on one card:
//     the stolen beat and the returned card arrive together, uncoupled.

/**
 * Barbed Compliment — affliction↔charm (theme home: affliction, Lemma). The
 * bridge IS the double-count: MARK is utility vocabulary that reads as an
 * affliction (every DoT tick and payoff hit cashes it; RUPTURE/REAP consume
 * it) AND the same breath deposits SWAY on the CAPITULATE bar. An affliction
 * origin picks it for the amp stacks; a charm origin picks it for the bar.
 */
const barbedCompliment: Card = {
    id: 'barbed-compliment',
    theme: 'affliction',
    name: 'Barbed Compliment',
    philosophicalAspect: 'heart',
    description:
        'Praise with the hook left in. They wear the kind word like a medal, '
        + 'and every wound you deal afterward finds the pin — while something '
        + 'in them starts wanting to agree with you.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts (phase 36a: SWAY 0.8→0.9): MARK i2 d2 (0.75 × 2 × 2 = 3.0) + SWAY 2
    // (1.8) = 4.8 + FREE [mark i1 d1 (0.75) + sway 1 (0.9)] = 1.65 → 6.45 →
    // common band 1.5-7.5 (Lemma). FREE share 1.65/6.45 = 25.6% ✓ the 25-35% window.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 }, sway: 1 },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 2 },
    ],
    specialMechanics: [{ kind: 'sway', amount: 2 }],
    addedIn: '2026-07-11',
    tags: ['bridge', 'affliction', 'charm'],
};

/**
 * The Poured Rampart — forge↔bulwark (theme home: forge, Lemma). Pips → the
 * wall: RIPEN once, then pour the WHOLE bank into Guard (2 per pip spent —
 * `spend_all_pips.guardPerPip`, the existing engine verb) over a small
 * BARRIER footing. Drills the BARRIER/GUARD species per WS10.3: the forge
 * origin picks it as a pip sink, the bulwark origin as a wall that scales.
 */
const thePouredRampart: Card = {
    id: 'the-poured-rampart',
    theme: 'forge',
    name: 'The Poured Rampart',
    philosophicalAspect: 'mind',
    description:
        'Why hammer a blade when the argument only needs a wall? Tip the '
        + 'crucible over the footing and let everything you saved harden '
        + 'exactly where they meant to break through.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: PIP 1 (1.5) + spend_all_pips guardPerPip 2 (1.0 + 2 × 0.5 = 2.0) +
    // BARRIER 3 (3 ÷ 3 = 1.0) = 4.5 + FREE pips 1 (1.5) = 6.0 → common band
    // 1.5-7.5 (Lemma). FREE share 1.5/6.0 = 25.0% ✓ window.
    free: { pips: 1 },
    specialMechanics: [
        { kind: 'grant_pip', count: 1 },
        { kind: 'spend_all_pips', guardPerPip: 2 },
        { kind: 'barrier', amount: 3 },
    ],
    addedIn: '2026-07-11',
    tags: ['bridge', 'forge', 'bulwark', 'defense'],
};

/**
 * Interest on the Flesh — akrasia↔harvest (theme home: akrasia, Thesis). The
 * NEAREST BUILDABLE SHAPE of "self-affliction expiry → Souls" (no engine hook
 * for player-side expiry yields — flagged above): the loan is booked up
 * front. PAID: a short self-Bleed (the akratic printed cost, library
 * precedent: purge-by-fire / the-cutting-truth) + SOUL ×3 banked NOW + MARK
 * ×2 on the foe (utility affliction fuel the harvest engine later consumes).
 */
const interestOnTheFlesh: Card = {
    id: 'interest-on-the-flesh',
    theme: 'akrasia',
    name: 'Interest on the Flesh',
    philosophicalAspect: 'body',
    description:
        'The granary does not ask whose blood watered the field. Open a vein, '
        + 'book the yield in advance, and mark the debtor — every harvest '
        + 'needs a ledger, and every ledger prefers flesh.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: self BLEED i1 d1 (3 HP ÷ 3 = 1.0, self-debuff credit −0.75) +
    // SOUL 3 (2.25) + MARK i2 d2 (3.0) = 4.5 + FREE [souls 1 (0.75) + heal 3
    // (1.0)] = 1.75 → 6.25 → uncommon band 4.5-13 (Thesis). FREE share
    // 1.75/6.25 = 28.0% ✓ window.
    free: { souls: 1, healHp: 3 },
    combatEffects: [
        { effectId: 'debuff_bleed', appliedTo: 'self', intensity: 1, duration: 1 },
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 2 },
    ],
    specialMechanics: [{ kind: 'soul_gain', count: 3 }],
    addedIn: '2026-07-11',
    tags: ['bridge', 'akrasia', 'harvest'],
};

/**
 * Entered into Evidence — oracle↔peroration (theme home: oracle, Thesis).
 * FORETELL confirm → Premise, exactly as the pairing prints it: FORETELL 2
 * reads the future, the OMEN declares it, and when the prediction CONFIRMS at
 * the phase boundary the rider deposits PREMISE ×2 onto the running tally
 * (the omen-resolution path already carries `rider.premises` — an omen-fed
 * Premise can even complete a CONCEDE-grade Peroration).
 */
const enteredIntoEvidence: Card = {
    id: 'entered-into-evidence',
    theme: 'oracle',
    name: 'Entered into Evidence',
    philosophicalAspect: 'mind',
    description:
        'State tomorrow under oath. When it arrives exactly as sworn, the '
        + 'court has no choice: the prophecy stops being a guess and becomes '
        + 'a premise — admitted, numbered, and building toward the verdict.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: FORETELL 2 (2.0) + OMEN rider [premises 2 (1.6)] × dieBonus 0.6 +
    // omen info 1 (= 1.96) = 3.96 + FREE [premises 1 (0.8) + foretell 1
    // (1.0)] = 1.8 → 5.76 (pre phase 32 part 4d).
    // phase 32 part 4d (OMEN v2): anteConviction 1 / maxWindow 2 (this
    // bridge card's smaller premises-2 rider takes a smaller ante than the
    // two rank-2/3 LIBRARY omen carriers' anteConviction 2 — proportioned
    // to its own rider the same way, see cards.library.ts) credits at
    // −0.75× = −0.75, netting mechanic sum 3.96 − 0.75 = 3.21 + FREE 1.8 =
    // 5.01 → still uncommon band 4.5-13 (Thesis). This IS checked by
    // bridge-rewards.engine.test.ts's own band + regression-anchor lints
    // (not exempt just for being a sandbox card).
    free: { premises: 1, foretell: 1 },
    specialMechanics: [
        { kind: 'foretell', count: 2 },
        { kind: 'omen', maxWindow: 2, anteConviction: 1, rider: { premises: 2 } },
    ],
    addedIn: '2026-07-11',
    tags: ['bridge', 'oracle', 'peroration'],
};

/**
 * Stolen Cadence — control↔echo (theme home: control, Thesis). The NEAREST
 * BUILDABLE SHAPE of "STAGGER'd rung → REPRISE fuel" (no rungs-denied ledger
 * exists to gate on — flagged above): STAGGER 1 steals a beat from their next
 * action and REPRISE 1 replays a beat of yours, together on one card. The
 * control origin picks it for the rung; the echo origin for the refrain.
 */
const stolenCadence: Card = {
    id: 'stolen-cadence',
    theme: 'control',
    name: 'Stolen Cadence',
    philosophicalAspect: 'mind',
    description:
        'Every argument keeps time. Lift one beat from their downstroke and '
        + 'the whole phrase stumbles — then play the stolen measure back, in '
        + 'your own key, from a page they thought was spent.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: STAGGER 1 (2.0) + REPRISE 1 (2.0) = 4.0 + FREE [mark i1 d1 (0.75)
    // + conviction 1 (1.0)] = 1.75 → 5.75 → uncommon band 4.5-13 (Thesis).
    // FREE share 1.75/5.75 = 30.4% ✓ window. (FREE deposits MARK + Conviction
    // — the coda/dying-echo precedent; rider-line STAGGER is PAID-path-only
    // in the engine, so the FREE face never prints a silent no-op.)
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 }, conviction: 1 },
    specialMechanics: [
        { kind: 'stagger', rungs: 1 },
        { kind: 'reprise', count: 1 },
    ],
    addedIn: '2026-07-11',
    tags: ['bridge', 'control', 'echo'],
};

/**
 * Unbroken Countenance — bulwark↔charm (theme home: charm, Theorem). Unbroken
 * GUARD → SWAY: raise the wall and press the bar; if the enemy dealt you NO
 * damage last round (fully blocked, denied, or idle — the ratified
 * `enemy-dealt-no-damage-last-round` ledger predicate, The Unmoved Mover's
 * gate), the composure itself persuades: SWAY ×4 + 2 HP composed back.
 */
const unbrokenCountenance: Card = {
    id: 'unbroken-countenance',
    theme: 'charm',
    name: 'Unbroken Countenance',
    philosophicalAspect: 'heart',
    description:
        'Let the whole tirade land and change nothing in your face. There is '
        + 'no rebuttal like composure: they watch their best blow be received '
        + 'as weather, and begin to suspect you might simply be right.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts (phase 36a: SWAY 0.8→0.9): GUARD 8 (8 ÷ 4 = 2.0) + SWAY 2 (1.8) =
    // 3.8 + UNBROKEN condition rider [sway 4 (3.6) + heal 2 (0.67)] ×
    // threshold 0.5 = 2.14 + FREE [guard 2 (0.5) + sway 2 (1.8)] = 2.3 →
    // 8.23 → uncommon band 4.5-13 (Theorem). FREE share 2.3/8.23 = 27.9% ✓ window.
    free: { guard: 2, sway: 2 },
    specialMechanics: [
        { kind: 'guard', amount: 8 },
        { kind: 'sway', amount: 2 },
    ],
    synergy: {
        statePredicate: { kind: 'enemy-dealt-no-damage-last-round' },
        rider: { sway: 4, healHp: 2 },
    },
    addedIn: '2026-07-11',
    tags: ['bridge', 'bulwark', 'charm', 'condition', 'alt-win'],
};

// ── Phase 33d — GLYPHS pilot (`glyphs-33d`) ──────────────────────────────────
// The Option-B grammar experiment: `plan/phases/phase_33d_glyphs_pilot.md`.
// Two themes (affliction — the brief's informal "erosion"; bulwark — the
// brief's informal "bastion"), one inscriber + one pump each. Sandbox-only —
// no CardType edit (rides the existing `'spell'` type via `Card.glyph`), no
// library/preset promotion this phase (Gate-4 scope-discipline note). Charge
// cap 3 for both payloads (locked); PAID lines never chip a clean enemy
// (glyph payloads only resolve on `crackGlyph`, a player action the doctrine
// witness's clean-board PAID sweep never calls).
//
// FREE-line pricing note: `glyphCharge` prices as a flat small deposit
// (`VERB_POINTS.glyphChargePerCharge = 0.4`) and `glyphChargeFallback` is
// deliberately UNSCORED (`scoreRider` — exactly one of the two branches ever
// fires per play). That keeps every FREE line here well under the usual
// 25-35% share window, so all four cards are flagged `intentionallyAsymmetric`
// (the-long-ledger precedent) — a deliberate consequence of the pilot's own
// pricing spec, not an oversight.

/**
 * Glyph of Suppuration — affliction Thesis, the erosion INSCRIBER. PAID:
 * inscribes the glyph (poison, base 1, dur 2, cap 3) and marks the foe now
 * (tempo, so the card is never dead if the glyph is never cracked). FREE:
 * +1 charge to your OWN Glyph of Suppuration if you control one (matched by
 * this card's own `glyph.payload.kind`), else the plain MARK deposit that
 * satisfies the FREE-currency law before any glyph exists.
 */
const glyphOfSuppuration: Card = {
    id: 'glyph-of-suppuration',
    theme: 'affliction',
    name: 'Glyph of Suppuration',
    philosophicalAspect: 'mind',
    description:
        'Cut the mark into them and leave it. A wound heals; a sign does ' +
        'not — it only ripens, patient, on whatever schedule you return to it.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: MARK i2 d2 (statusPoints 0.75×2×2 = 3.0) + glyph term
    // [glyphExpectedValue(poison base1 dur2, cap3: statusPoints(poison,
    // 1+1.5, 2) = 5.34) × GLYPH_CRACK_DISCOUNT 0.6 = 3.20] + FREE glyphCharge
    // 1 (0.4) = 6.60 → uncommon band 4.5-13 (Thesis). FREE share 0.4/6.60 =
    // 6.1% — well under the usual 25-35% window, `intentionallyAsymmetric`
    // (see the section note above: glyphChargeFallback is deliberately
    // unscored, one-of-two-branches).
    free: { glyphCharge: 1, glyphChargeFallback: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 } } },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 2 },
    ],
    glyph: { payload: { kind: 'poison', baseIntensity: 1, duration: 2 }, cap: 3 },
    intentionallyAsymmetric: true,
    addedIn: '2026-07-21',
    tags: ['affliction', 'glyph', 'dot'],
};

/**
 * Ash that Remembers — affliction Lemma, the erosion PUMP. PAID: a normal
 * standalone thematic POISON application (unrelated to glyphs — the card is
 * never dead in a glyph-less deck). FREE: +1 charge to ANY glyph you
 * control (no `glyph` field of its own — the pump reads the zone broadly),
 * else the same MARK deposit fallback.
 */
const ashThatRemembers: Card = {
    id: 'ash-that-remembers',
    theme: 'affliction',
    name: 'Ash that Remembers',
    philosophicalAspect: 'mind',
    description:
        'Nothing here forgets a fire. Feed the old burn and it deepens on ' +
        'command, wherever you last left your mark standing.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts: POISON i1 d2 (statusPoints via dotTempoWeightedHp ÷ 3 = 2.14) +
    // FREE glyphCharge 1 (0.4) = 2.54 → common band 1.5-7.5 (Lemma). FREE
    // share 0.4/2.54 = 15.7% — under window, `intentionallyAsymmetric` (same
    // reason as glyph-of-suppuration).
    free: { glyphCharge: 1, glyphChargeFallback: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 } } },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 2 },
    ],
    intentionallyAsymmetric: true,
    addedIn: '2026-07-21',
    tags: ['affliction', 'glyph', 'dot'],
};

/**
 * Glyph of the Bulwark — bulwark Lemma, the bastion INSCRIBER. PAID:
 * inscribes the glyph (barrier, base 2, cap 3) and raises Guard now (tempo).
 * FREE: +1 charge to your OWN Glyph of the Bulwark if you control one, else
 * a small BARRIER fallback. Ranked one band below Glyph of Suppuration
 * (Lemma, not Thesis): BARRIER prices structurally cheaper than POISON under
 * the existing verb table (`barrierPerHp` 1/3 flat vs. a DoT's tempo-weighted
 * walk) — inflating the PAID Guard just to reach an uncommon floor would
 * misrepresent "small immediate Guard" as the card's real point, so the rank
 * follows the honest arithmetic instead (card-expert judgment call, per the
 * phase 33d brief's "the arithmetic is not [locked]").
 */
const glyphOfTheBulwark: Card = {
    id: 'glyph-of-the-bulwark',
    theme: 'bulwark',
    name: 'Glyph of the Bulwark',
    philosophicalAspect: 'body',
    description:
        'Carve the ward into the stone before the blow arrives. It does ' +
        'not flinch — it only grows heavier the longer it is left standing.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: Guard 8 (8 × 0.25 = 2.0) + glyph term [glyphExpectedValue(barrier
    // base2, cap3: (2+1.5) × barrierPerHp 1/3 = 1.17) × GLYPH_CRACK_DISCOUNT
    // 0.6 = 0.70] + FREE glyphCharge 1 (0.4) = 3.10 → common band 1.5-7.5
    // (Lemma). FREE share 0.4/3.10 = 12.9% — under window,
    // `intentionallyAsymmetric` (same reason as the erosion pair).
    free: { glyphCharge: 1, glyphChargeFallback: { barrier: 1 } },
    specialMechanics: [{ kind: 'guard', amount: 8 }],
    glyph: { payload: { kind: 'barrier', baseAmount: 2 }, cap: 3 },
    intentionallyAsymmetric: true,
    addedIn: '2026-07-21',
    tags: ['bulwark', 'glyph', 'defense'],
};

/**
 * Ward that Waits — bulwark Doxa, the bastion PUMP. PAID: a normal
 * standalone thematic BARRIER application (unrelated to glyphs). FREE: +1
 * charge to ANY glyph you control, else the same BARRIER fallback.
 */
const wardThatWaits: Card = {
    id: 'ward-that-waits',
    theme: 'bulwark',
    name: 'Ward that Waits',
    philosophicalAspect: 'body',
    description:
        'The wall remembers every stone it was ever given. Add one more, ' +
        'wherever the mortar is already set, and wait.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: BARRIER 5 (5 × 1/3 = 1.67) + FREE glyphCharge 1 (0.4) = 2.07 →
    // common band 1.5-7.5 (Doxa). FREE share 0.4/2.07 = 19.3% — under window,
    // `intentionallyAsymmetric` (same reason as the rest of the set).
    free: { glyphCharge: 1, glyphChargeFallback: { barrier: 1 } },
    specialMechanics: [{ kind: 'barrier', amount: 5 }],
    intentionallyAsymmetric: true,
    addedIn: '2026-07-21',
    tags: ['bulwark', 'glyph', 'defense'],
};

/** The registry of named experiment sets (`/deck-tuning`
 *  repopulates it as A/B candidates are authored). */
export const SANDBOX_CARD_SETS: Record<string, SandboxCardSet> = {
    'chooseX-vein': {
        id: 'chooseX-vein',
        name: 'Choose-X: The Open Vein',
        description:
            'WS7.2 first chosen X-cost — RECOIL X (min 3) → POISON per 3. '
            + 'Gate: the chosen-X distribution must vary across sim policies.',
        cards: [theOpenVein],
    },
    'doom-species': {
        id: 'doom-species',
        name: 'Doom species: Debt of Days',
        description:
            'WS3.4 Doom witness — creeping doom grows +1 intensity per enemy '
            + 'action and never expires by calendar. Gate: the doom must be '
            + 'consumed (REAP/RUPTURE) or carry fights on its own growth, '
            + 'without collapsing the early band.',
        cards: [debtOfDays],
    },
    'conjure-exercise': {
        id: 'conjure-exercise',
        name: 'CONJURE exercise: Foundry Sprite + Corollary',
        description:
            'WS2.1 — the first two CONJURE cards, targeting the Thoughtform '
            + 'registry (tf-cinder, tf-minor-premise). Gate: the CONJURE atlas '
            + 'row earns its first + (conjured tokens actually played across '
            + 'stages/policies) without either card going dead or dominant.',
        cards: [foundrySprite, corollary],
    },
    'roles-forge': {
        id: 'roles-forge',
        name: 'Theme roles: forge (WS4.1)',
        description:
            'WS4.1 — the forge role pass: Slag Runoff (RIPEN whose overflow '
            + 'converts to Kindling Ember — drills the KINDLE species per '
            + 'WS10.3) and Ingot of Ruin (the uncapped ALL-spender: MARK per '
            + '2 pips spent + a payoff-class ruptureMarks closer, post-TICK '
            + 'vocabulary). Gate: foundry stops winning through utility verbs '
            + 'alone, neither card dead (<never played when eligible) nor '
            + 'dominant (>0.70 win share), balance-band floors hold.',
        cards: [slagRunoff, ingotOfRuin],
    },
    'roles-bulwark': {
        id: 'roles-bulwark',
        name: 'Theme roles: bulwark (WS4.2)',
        description:
            'WS4.2 — the bulwark role pass under the ratified RIPOSTE '
            + 'direction (consume_defense NOT built, spec 32 §12 item 4): '
            + 'Grit Between Stones (non-reactive Nettle Sting + payoff-class '
            + 'mark closer) and The Unmoved Mover (the first combat-ledger '
            + 'condition card — enemyDamageLastRound == 0 gates its rider). '
            + 'Gate: bastion gains a non-reactive kill path against '
            + 'non-attackers without collapsing the early band.',
        cards: [gritBetweenStones, theUnmovedMover],
    },
    'roles-charm': {
        id: 'roles-charm',
        name: 'Theme roles: charm (WS4.3)',
        description:
            'WS4.3 — the charm role pass: A Sweeter Poison (SWAY + a RUPTURE-'
            + 'class mark closer + MARK ×2 planted AFTER the closer, so it '
            + 'never cashes its own plant). Steadfast Regard and Crescendo of '
            + 'Affection are NOT built — spec 32 §12 item 4 keeps them '
            + 'CONDITIONAL on post-Phase-26/27 telemetry still showing the '
            + 'charm late hole. Gate: Grace gains a mark-payoff pressure line '
            + 'without breaching the late band; card neither dead nor '
            + 'dominant.',
        cards: [aSweeterPoison],
    },
    'roles-harvest': {
        id: 'roles-harvest',
        name: 'Theme roles: harvest (WS4.4)',
        description:
            'WS4.4 — the harvest role pass, Phase 32\'s supporting cast (the '
            + 'ratified max-HP REAP payoff + travelling Souls are Phase 32\'s '
            + 'own item, NOT duplicated here): The Long Ledger (two payoff-'
            + 'class DoT fires — consume_affliction ×2 on the WS3 \'payoff\' '
            + 'clock — + a short Bleed booked after them; compresses the Soul '
            + 'cycle) and Seedcorn Sacrifice (REAP 2 → sow a heavy short '
            + 'Bleed + draw 1; closes the flywheel). Gate: tithe gains a '
            + 'mid/late presence without collapsing the early band; neither '
            + 'card dead nor dominant.',
        cards: [theLongLedger, seedcornSacrifice],
    },
    'sequencing-microset': {
        id: 'sequencing-microset',
        name: 'Sequencing grammar: the WS5 microset',
        description:
            'WS5.2 — six turn-shape condition cards through the extended '
            + 'CardSynergy state-predicate gate: two OPENING (early), two '
            + 'closing-play (late), two after-cost (RECOIL paid / the enemy '
            + 'drew blood). Stays sandbox for the whole prototype. Gate: the '
            + 'WS5.3 sequencing test (≥2 materially different orders AND the '
            + 'argmax order differs across ≥2 of 3 threat stances) + WS5.4 '
            + 'draft appeal (picked by ≥2 preset origins). Kill: one dominant '
            + 'order across all stances → log to plan/CRITIQUE.md and '
            + 'revisit hand retention.',
        cards: [
            captatioBenevolentiae, inMediasRes, coda,
            dyingEcho, wagesOfWeakness, answeredInKind,
        ],
    },
    'bridge-rewards': {
        id: 'bridge-rewards',
        name: 'Cross-theme bridge rewards (WS6.2)',
        description:
            'WS6.2 — six reward-screen splash cards, one per ratified pairing '
            + '(affliction↔charm, forge↔bulwark, akrasia↔harvest, '
            + 'oracle↔peroration, control↔echo, bulwark↔charm), utility-10 + '
            + 'parents\' currencies only. Measured at reward screens via the '
            + 'WS6.1 harness sandbox hook. Gate (WS6.3, post-Phase-26): each '
            + 'bridge picked by ≥2 distinct preset origins at a non-trivial '
            + 'rate; kill: single-parent pick = dead (an 8th in-theme card), '
            + 'universal auto-pick = dominant.',
        cards: [
            barbedCompliment, thePouredRampart, interestOnTheFlesh,
            enteredIntoEvidence, stolenCadence, unbrokenCountenance,
        ],
    },
    'glyphs-33d': {
        id: 'glyphs-33d',
        name: 'GLYPHS pilot (phase 33d)',
        description:
            'Phase 33d — the Option-B grammar experiment: a charging seal '
            + 'zone (state.glyphs), player-cracked via the new dieless '
            + 'crackGlyph action. Two themes (affliction, bulwark), one '
            + 'inscriber + one pump each: Glyph of Suppuration / Ash that '
            + 'Remembers (affliction, poison payload) and Glyph of the '
            + 'Bulwark / Ward that Waits (bulwark, barrier payload). '
            + 'Sandbox-only — no library/preset promotion this phase (Gate-4 '
            + 'scope-discipline note); promotion is a later, separate '
            + 'decision, gated on the sim/mobile follow-ups the phase 33d '
            + 'brief lists.',
        cards: [
            glyphOfSuppuration, ashThatRemembers,
            glyphOfTheBulwark, wardThatWaits,
        ],
    },
    // ── The standing per-theme swap pools (2026-07-18 fan-out) ──────────────
    'swap-affliction': SWAP_POOL_AFFLICTION,
    'swap-peroration': SWAP_POOL_PERORATION,
    'swap-forge': SWAP_POOL_FORGE,
    'swap-akrasia': SWAP_POOL_AKRASIA,
    'swap-control': SWAP_POOL_CONTROL,
    'swap-oracle': SWAP_POOL_ORACLE,
    'swap-harvest': SWAP_POOL_HARVEST,
    'swap-charm': SWAP_POOL_CHARM,
    'swap-bulwark': SWAP_POOL_BULWARK,
    'swap-echo': SWAP_POOL_ECHO,
};

/** All registered sandbox sets, in declaration order. */
export function listSandboxSets(): SandboxCardSet[] {
    return Object.values(SANDBOX_CARD_SETS);
}

/**
 * Applies a set: registers its new cards and overrides into the sandbox
 * registry. Returns the set, or `undefined` for an unknown id. Applying the
 * same set twice throws (its card ids are then already registered) — call
 * `clearSandboxCards()` between experiments.
 */
export function applySandboxSet(setId: string): SandboxCardSet | undefined {
    const set = SANDBOX_CARD_SETS[setId];
    if (!set) return undefined;
    registerSandboxCards(set.cards);
    for (const override of set.overrides ?? []) {
        registerSandboxOverride(override.cardId, override.patch);
    }
    return set;
}
