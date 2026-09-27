/**
 * Retired-carrier fixture cards — the engine verbs whose LIBRARY carriers died
 * with the spec-32 library at the Profane-Canon reset (2026-08-08).
 *
 * The verbs are still implemented and still under test; only the cards that
 * printed them left the library. Rather than lose that coverage, the retired
 * card literals live here as SYNTHETIC fixtures, registered per-test through
 * `registerSandboxCards` exactly as the old `applySandboxSet(...)` did. They
 * are test material only - never reward-pool, preset, or catalog content.
 *
 * Themes were re-slugged onto the canon's seven families (forge/echo -> grave,
 * bulwark/control -> vigil, charm/harvest -> choir, peroration/oracle -> trial,
 * akrasia -> debt, affliction -> rot) so the literals still typecheck against
 * `CardTheme`; nothing else about them was touched.
 *
 * Provenance: `src/Cards/cards.sandbox-sets.ts` @ a69eab56 (WS4 theme roles,
 * WS6.2 cross-theme bridges). The WS5.2 sequencing microset had no remaining
 * importer and was deleted in the keyword audit (2026-09-27).
 *
 * The keyword audit also deleted `debuff_kindling_ember`, `debuff_nettle_sting`
 * and `buff_thorns` from the effects library; the fixtures that applied them
 * now name the `fixture_*` effects in `./fixture-effects.ts`, which a test must
 * register (`registerFixtureEffects`) alongside these cards.
 */

import { registerSandboxCards } from '../Cards/cards.sandbox';
import type { Card } from '../Cards/types';

// ── WS4.1 (spec 32 §12 item 4/5) — forge theme-role pass (`roles-forge`) ─────

/**
 * Slag Runoff — forge Tooth, the KINDLE-species driller (WS10.3): RIPEN the
 * Reserve, and every pip that finds no room (Reserve at `RESERVE_PIP_CAP`, or
 * empty) converts into a Kindling Ember on the foe instead of vanishing. The
 * forge's waste heat is never wasted — which also makes the card's floor
 * honest: on a pip-saturated board it becomes a small DoT applier, on a
 * hungry board a pure ripener.
 */
const slagRunoff: Card = {
    id: 'slag-runoff',
    theme: 'grave',
    name: 'Slag Runoff',
    color: 'mind',
    description:
        'What the mold cannot hold does not return to the crucible — it ' +
        'runs, still glowing, wherever the floor tilts. Let it tilt toward ' +
        'them.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: PAID grant_pip 2 (2 × 1.5 = 3.0) + overflow→ember (fixture_ember, the old kindling_ember
    // i1 d3 printed 3 → phase-36b tempo-weighted 2.31 ÷ 3 = 0.77 per overflowed
    // pip × expectedOverflowPips 1 = 0.77) + FREE pips 1 (1.5) = 5.27 → common
    // band 1.5-7.5 (Tooth). FREE share 1.5/5.27 = 28.5% ✓ the 25-35% window.
    free: { pips: 1 },
    specialMechanics: [{
        kind: 'grant_pip', count: 2,
        overflow: { applyEffect: { effectId: 'fixture_ember' } },
    }],
    addedIn: '2026-07-11',
    tags: ['forge', 'dice', 'ember'],
};

/**
 * Ingot of Ruin — forge Skull, the uncapped ALL-spender the theme lacked
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
    theme: 'grave',
    name: 'Ingot of Ruin',
    color: 'mind',
    description:
        'Every pip you hoarded was a syllable of their name. Pour the whole ' +
        'crucible at once and read it back to them — cast, cooled, and ' +
        'signed.',
    tier: 3, rank: 5, cardType: 'spell',
    targetType: 'enemy',
    // pts: grant_pip 1 (1.5) + spend_all_pips (1.0) + markPer 2 (expected
    // floor(2/2) = 1 MARK stack → statusPoints mark i1 d2 = 1.5; UNCAPPED
    // upside rides the real bank) + closer ruptureMarks 3 (3 × 2/3 = 2.0) +
    // FREE pips 1 (1.5) = 7.5 → rare band 7-19 (Skull, floor-adjacent by
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
 * Grit Between Stones — bulwark Rib: the wall that stings without being
 * struck. Applies Nettle Sting (the theme's non-reactive DoT species) plus a
 * payoff-class tick: `ruptureMarks` fires the WS3 'payoff' clock and cashes
 * every MARK on the foe at 2 HP per stack — closing the loop Hedgehog's
 * Dilemma opens (its THORNS reflections print marks that previously had no
 * consumer in-theme; MARK is utility vocabulary, spec 32 §3).
 */
const gritBetweenStones: Card = {
    id: 'grit-between-stones',
    theme: 'vigil',
    name: 'Grit Between Stones',
    color: 'body',
    description:
        'The wall was never smooth. Everything they have thrown at it is ' +
        'still in it, edge out — and today the mortar gives it all back.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts (post-Phase-30 merge re-pin 2026-07-12 — FREE lays bulwark's
    // currency, a persistent BARRIER brick, instead of the fading chip
    // guard): nettle sting i2 d3 (printed 12 → phase-36b tempo-weighted 9.25
    // ÷ 3 = 3.08) + Guard 6 (1.5) + payoff-class closer ruptureMarks 2 (2 × 2/3
    // = 1.33) + FREE barrier 2 (0.67) = 6.58 → uncommon band 4.5-13 (Rib).
    free: { barrier: 2 },
    combatEffects: [
        { effectId: 'fixture_nettle', appliedTo: 'opponent', intensity: 2, duration: 3 },
    ],
    specialMechanics: [
        { kind: 'guard', amount: 6 },
        { kind: 'rider', rider: { ruptureMarks: 2 } },
    ],
    addedIn: '2026-07-11',
    tags: ['bulwark', 'reflect', 'payoff'],
};

/**
 * The Unmoved Mover — bulwark Splinter, the first combat-ledger condition card
 * (spec 32 §12 item 4): reads `enemyDamageLastRound` through the extended
 * CardSynergy state-predicate gate. If the enemy dealt you no damage last
 * round — fully blocked, denied, or idle — the wall answers: THORNS i2 d2 +
 * Guard 4, free. The condition prices at the threshold ×0.5 discount.
 */
const theUnmovedMover: Card = {
    id: 'the-unmoved-mover',
    theme: 'vigil',
    name: 'The Unmoved Mover',
    color: 'body',
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
    // FREE barrier 2 (0.67) = 5.33 → uncommon band 4.5-13 (Splinter).
    free: { barrier: 2 },
    specialMechanics: [{ kind: 'barrier', amount: 8 }],
    synergy: {
        statePredicate: { kind: 'enemy-dealt-no-damage-last-round' },
        rider: {
            applyEffect: { effectId: 'fixture_thorns', intensity: 2, duration: 2, to: 'self' },
            guard: 4,
        },
    },
    addedIn: '2026-07-11',
    tags: ['bulwark', 'defense', 'condition'],
};

// ── WS4.3 (spec 32 §12 item 4) — charm theme-role pass (`roles-charm`) ───────
// Ratified CONDITIONAL: Steadfast Regard (the one-turn PLEA decay-pause) and
// Crescendo of Affection (PLEA + half-current-PLEA scaling) are NOT built —
// spec 32 §12 item 4 keeps both conditional on post-Phase-26/27 telemetry
// STILL showing the charm late hole. This set ships only the
// unconditionally-ratified card.

/**
 * A Sweeter Poison — charm Rib: the compliment with the pit left in.
 * PAID: PLEA 3, then the RUPTURE-class closer (`ruptureMarks` — a payoff-class
 * verb: it fires the WS3 'payoff' trigger clock, then cashes every STANDING
 * MARK at 2 HP per stack), and only THEN plants MARK ×2 for the next twist of
 * the knife. Rider order is engine order (firedRiders resolve in insertion
 * order), so the closer consumes PRE-EXISTING marks only — on a clean board it
 * is silence, not a strike in disguise. A full `rupture` was rejected twice
 * over: it prices at 12 (V.rupture 4 + expected fuel 8 — rank-dishonest for a
 * Rib also carrying PLEA + MARK), and it consumes ALL afflictions —
 * including QUARTER, the charm state the rest of the deck builds.
 */
const aSweeterPoison: Card = {
    id: 'a-sweeter-poison',
    theme: 'choir',
    name: 'A Sweeter Poison',
    color: 'heart',
    description:
        'Flattery with the pit left in. They swallow the kindness whole, and ' +
        'every flaw you ever named in them turns over at once — sweeter ' +
        'going down, and already naming the next two.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts (phase 36a: PLEA 0.8→0.9): PLEA 3 (2.7) + closer ruptureMarks 2
    // (2 × 2/3 = 1.33) + MARK ×2 (mark i2 d2 = 3.0) + FREE [sway 2 (1.8) +
    // heal 2 (0.67)] = 9.5 → uncommon band 4.5-13 (Rib). FREE share
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
 * The Long Ledger — harvest Splinter: call in two accounts at once. PAID: TWO
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
    theme: 'choir',
    name: 'The Long Ledger',
    color: 'mind',
    description:
        'Every wound is an entry, and entries accrue. Today the ledger calls ' +
        'in two accounts at full term, early — and opens a fresh line of ' +
        'credit before the ink of the old ones is dry.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: consume_affliction ×2 (2 × 5.5 = 11.0) + rider bleed i1 d1
    // (damage-instance clock: one 3-HP tick then washout = 3 ÷ 3 = 1.0) +
    // FREE souls 1 (0.75) = 12.75 → uncommon band 4.5-13 (Splinter,
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
 * Seedcorn Sacrifice — harvest Rib: closes the flywheel. PAID: REAP 2
 * Souls (fizzles underfunded — the printed cost is real) → sow a heavy short
 * Bleed (i3, one round on the damage-instance clock: two ticks then washout —
 * next season's Souls) and draw 1 (keep the cycle turning). FREE: the
 * standing harvest deposit (SOUL 1) plus the DRAW-1-class kicker — legal
 * under the ratified weak-deposit amendment (deposit 0.75 < the 2.0
 * draw-class floor; gleaner's-due precedent).
 */
const seedcornSacrifice: Card = {
    id: 'seedcorn-sacrifice',
    theme: 'choir',
    name: 'Seedcorn Sacrifice',
    color: 'body',
    description:
        'Eat the seed and there is no next year; sow the souls you meant to ' +
        'keep and next year arrives early, bleeding. The granary weeps. The ' +
        'field does not.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'enemy',
    // pts: REAP 2 → rider [bleed i3 d1 (9+6 = 15 HP ÷ 3 = 5.0) + draw (2.0)]
    // − soul cost 2 × 0.75 × SELF_COST_CREDIT 0.75 (= −1.125) = 5.875 + FREE
    // [souls 1 (0.75) + draw (2.0)] = 8.625 → uncommon band 4.5-13 (Rib).
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
 * Barbed Compliment — affliction↔charm (theme home: affliction, Tooth). The
 * bridge IS the double-count: MARK is utility vocabulary that reads as an
 * affliction (every DoT tick and payoff hit cashes it; RUPTURE/REAP consume
 * it) AND the same breath deposits PLEA on the RELENT bar. An affliction
 * origin picks it for the amp stacks; a charm origin picks it for the bar.
 */
const barbedCompliment: Card = {
    id: 'barbed-compliment',
    theme: 'rot',
    name: 'Barbed Compliment',
    color: 'heart',
    description:
        'Praise with the hook left in. They wear the kind word like a medal, '
        + 'and every wound you deal afterward finds the pin — while something '
        + 'in them starts wanting to agree with you.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'enemy',
    // pts (phase 36a: PLEA 0.8→0.9): MARK i2 d2 (0.75 × 2 × 2 = 3.0) + PLEA 2
    // (1.8) = 4.8 + FREE [mark i1 d1 (0.75) + sway 1 (0.9)] = 1.65 → 6.45 →
    // common band 1.5-7.5 (Tooth). FREE share 1.65/6.45 = 25.6% ✓ the 25-35% window.
    free: { applyEffect: { effectId: 'debuff_mark', intensity: 1, duration: 1 }, sway: 1 },
    combatEffects: [
        { effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 2, duration: 2 },
    ],
    specialMechanics: [{ kind: 'sway', amount: 2 }],
    addedIn: '2026-07-11',
    tags: ['bridge', 'affliction', 'charm'],
};

/**
 * The Poured Rampart — forge↔bulwark (theme home: forge, Tooth). Pips → the
 * wall: RIPEN once, then pour the WHOLE bank into Guard (2 per pip spent —
 * `spend_all_pips.guardPerPip`, the existing engine verb) over a small
 * BARRIER footing. Drills the BARRIER/GUARD species per WS10.3: the forge
 * origin picks it as a pip sink, the bulwark origin as a wall that scales.
 */
const thePouredRampart: Card = {
    id: 'the-poured-rampart',
    theme: 'grave',
    name: 'The Poured Rampart',
    color: 'mind',
    description:
        'Why hammer a blade when the argument only needs a wall? Tip the '
        + 'crucible over the footing and let everything you saved harden '
        + 'exactly where they meant to break through.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: PIP 1 (1.5) + spend_all_pips guardPerPip 2 (1.0 + 2 × 0.5 = 2.0) +
    // BARRIER 3 (3 ÷ 3 = 1.0) = 4.5 + FREE pips 1 (1.5) = 6.0 → common band
    // 1.5-7.5 (Tooth). FREE share 1.5/6.0 = 25.0% ✓ window.
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
 * Interest on the Flesh — akrasia↔harvest (theme home: akrasia, Splinter). The
 * NEAREST BUILDABLE SHAPE of "self-affliction expiry → Souls" (no engine hook
 * for player-side expiry yields — flagged above): the loan is booked up
 * front. PAID: a short self-Bleed (the akratic printed cost, library
 * precedent: purge-by-fire / the-cutting-truth) + SOUL ×3 banked NOW + MARK
 * ×2 on the foe (utility affliction fuel the harvest engine later consumes).
 */
const interestOnTheFlesh: Card = {
    id: 'interest-on-the-flesh',
    theme: 'debt',
    name: 'Interest on the Flesh',
    color: 'body',
    description:
        'The granary does not ask whose blood watered the field. Open a vein, '
        + 'book the yield in advance, and mark the debtor — every harvest '
        + 'needs a ledger, and every ledger prefers flesh.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: self BLEED i1 d1 (3 HP ÷ 3 = 1.0, self-debuff credit −0.75) +
    // SOUL 3 (2.25) + MARK i2 d2 (3.0) = 4.5 + FREE [souls 1 (0.75) + heal 3
    // (1.0)] = 1.75 → 6.25 → uncommon band 4.5-13 (Splinter). FREE share
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
 * Entered into Evidence — oracle↔peroration (theme home: oracle, Splinter).
 * FORETELL confirm → Premise, exactly as the pairing prints it: FORETELL 2
 * reads the future, the OMEN declares it, and when the prediction CONFIRMS at
 * the phase boundary the rider deposits CHARGE ×2 onto the running tally
 * (the omen-resolution path already carries `rider.premises` — an omen-fed
 * Premise can even complete a CONDEMN-grade Peroration).
 */
const enteredIntoEvidence: Card = {
    id: 'entered-into-evidence',
    theme: 'trial',
    name: 'Entered into Evidence',
    color: 'mind',
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
    // 5.01 → still uncommon band 4.5-13 (Splinter). This IS checked by
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
 * Stolen Cadence — control↔echo (theme home: control, Splinter). The NEAREST
 * BUILDABLE SHAPE of "STAGGER'd rung → REPRISE fuel" (no rungs-denied ledger
 * exists to gate on — flagged above): STAGGER 1 steals a beat from their next
 * action and REPRISE 1 replays a beat of yours, together on one card. The
 * control origin picks it for the rung; the echo origin for the refrain.
 */
const stolenCadence: Card = {
    id: 'stolen-cadence',
    theme: 'vigil',
    name: 'Stolen Cadence',
    color: 'mind',
    description:
        'Every argument keeps time. Lift one beat from their downstroke and '
        + 'the whole phrase stumbles — then play the stolen measure back, in '
        + 'your own key, from a page they thought was spent.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'enemy',
    // pts: STAGGER 1 (2.0) + REPRISE 1 (2.0) = 4.0 + FREE [mark i1 d1 (0.75)
    // + conviction 1 (1.0)] = 1.75 → 5.75 → uncommon band 4.5-13 (Splinter).
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
 * Unbroken Countenance — bulwark↔charm (theme home: charm, Rib). Unbroken
 * GUARD → PLEA: raise the wall and press the bar; if the enemy dealt you NO
 * damage last round (fully blocked, denied, or idle — the ratified
 * `enemy-dealt-no-damage-last-round` ledger predicate, The Unmoved Mover's
 * gate), the composure itself persuades: PLEA ×4 + 2 HP composed back.
 */
const unbrokenCountenance: Card = {
    id: 'unbroken-countenance',
    theme: 'choir',
    name: 'Unbroken Countenance',
    color: 'heart',
    description:
        'Let the whole tirade land and change nothing in your face. There is '
        + 'no rebuttal like composure: they watch their best blow be received '
        + 'as weather, and begin to suspect you might simply be right.',
    tier: 2, rank: 4, cardType: 'spell',
    targetType: 'self',
    // pts (phase 36a: PLEA 0.8→0.9): GUARD 8 (8 ÷ 4 = 2.0) + PLEA 2 (1.8) =
    // 3.8 + UNBROKEN condition rider [sway 4 (3.6) + heal 2 (0.67)] ×
    // threshold 0.5 = 2.14 + FREE [guard 2 (0.5) + sway 2 (1.8)] = 2.3 →
    // 8.23 → uncommon band 4.5-13 (Rib). FREE share 2.3/8.23 = 27.9% ✓ window.
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


// -- The retired SETS, as plain fixture bundles ------------------------------

export const ROLES_FORGE_CARDS: readonly Card[] = [slagRunoff, ingotOfRuin];
export const ROLES_BULWARK_CARDS: readonly Card[] = [gritBetweenStones, theUnmovedMover];
export const ROLES_CHARM_CARDS: readonly Card[] = [aSweeterPoison];
export const ROLES_HARVEST_CARDS: readonly Card[] = [theLongLedger, seedcornSacrifice];
export const BRIDGE_REWARD_CARDS: readonly Card[] = [
    barbedCompliment, thePouredRampart, interestOnTheFlesh,
    enteredIntoEvidence, stolenCadence, unbrokenCountenance,
];

/** Registers a fixture bundle into the sandbox registry (the old
 *  `applySandboxSet` call, minus the retired set registry). */
export function applyFixtureCards(cards: readonly Card[]): void {
    registerSandboxCards([...cards]);
}
