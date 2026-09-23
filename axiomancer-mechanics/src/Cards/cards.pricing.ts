/**
 * Card pricing — the spec 32 v3 power-budget point table (§4, ledger #1-2).
 *
 * One point ~ 3 HP of neutral-read swing. Every card in
 * `cards.library.ts` ships its arithmetic in a comment; `scoreCard` is the
 * executable form of that arithmetic, and the pricing lint
 * (`src/Cards/e2e/pricing.engine.test.ts`) asserts each card's score is a
 * finite number — the rank-band assertion was repealed 2026-09-02, so the
 * table is ADVISORY. Enchantments and disenchants are engine
 * text (persistent rule rewrites) — they are not scored.
 *
 * The table is intentionally coarse: `/deck-tuning` remains the empirical
 * court. The lint exists to catch broken arithmetic (a NaN score), not to
 * arbitrate half-points.
 */

import type { Card, CardRider, CardSpecialMechanic } from './types';
import type { GlyphPayload } from '../Combat/combat.encounter.types';
import { lookupEffect } from '../Effects/effects.library';
import { dotEventTrigger } from '../Combat/effect-modifiers';
import { EXPECTED_TRIGGERS_PER_ROUND } from '../Combat/effects';
import { OVERHEAT_BUST_CHANCE } from '../Combat/combat.dice';

// ─── The point table (spec 32 v3 §4) ─────────────────────────────────────────

/** Verb costs, in points. Names mirror the spec table. */
export const VERB_POINTS = Object.freeze({
    /** Draw 1 card. */
    draw: 2,
    /** GUARD, per HP blocked (HP ÷ 4 — fades at round end). */
    guardPerHp: 1 / 4,
    /** BARRIER, per HP (HP ÷ 3 — persists until consumed). */
    barrierPerHp: 1 / 3,
    /** HEAL, per HP (HP ÷ 3). */
    healPerHp: 1 / 3,
    /** CLEANSE, per affliction removed. */
    cleanse: 1.5,
    /** PLEA, per stack (the RELENT currency). Phase 36a: 0.8 → 0.9. The
     *  RELENT win costs `0.35 × maxHealth` stacks (Combat/effects.ts
     *  `capitulateThreshold`), so per-stack win-parity = (maxHealth ÷ 3) ÷
     *  (0.35 × maxHealth) = 0.95 — enemy-INDEPENDENT (the HP cancels). Take a
     *  ~5% haircut for PLEA's 1/turn decay waste (worst early, where the
     *  floor-10 / current-HP cap bites) → 0.9. A build currency that also
     *  wins, priced honestly against HP-damage parity. */
    swayPerStack: 0.9,
    /** STAGGER, per rung removed (a full 2-rung deny = 4). */
    staggerPerRung: 2,
    /** FORETELL, per card seen. */
    foretellPerCard: 1,
    /** CHARGE, per tally point. A BUILD currency (like `soul`), NOT a win
     *  currency: unlike PLEA, the CONDEMN win costs a FLAT tally
     *  (`CONCEDE_PREMISES_BASE = 8`), so per-tally win-value = (maxHealth ÷ 3)
     *  ÷ 8 = maxHealth ÷ 24 — enemy-DEPENDENT, and most Premises cash to the
     *  smaller peroration riders anyway. So the concede win-value is NOT
     *  smeared across this currency; it rides the declaring card as
     *  `concedeCapstone` (phase 36a). */
    premise: 0.8,
    /** CONDEMN capstone (phase 36a): the flat lump a Peroration's `concedeAt`
     *  alt-win is worth on its DECLARING card. Priced at the
     *  `forgePersistence` / `echoNextSpell` "decisive persistent state-change"
     *  tier — a literal, NOT scaled to `concedeFloorFor`'s elite/boss floors
     *  (that inflation is enemy-dependent → phase 36b). Before 36a the concede
     *  win priced at exactly 0 (the `peroration` case scored only its
     *  `at`-payoff rider). */
    concedeCapstone: 3,
    /** SOUL, per soul granted (grant or expiry-yield). */
    soul: 0.75,
    /** Conviction, per point. */
    conviction: 1,
    /** TICK — one enemy DoT ticks now. */
    tickOne: 0.6,
    /** KINDLE — a temporary die, this combat only. */
    kindle: 2.5,
    /** KINDLE premium when the die is WILD. */
    kindleWildBonus: 0.5,
    /** PIP, per pip granted. */
    pip: 1.5,
    /** FORGE — the floating-die verb itself (spec: 5). Spec 33 §6 reinterprets
     *  the GHOST grant as a TEMPORARY GOLD die (surge-class): it still floats
     *  within the fight (joins the tray, never rerolls, persists across rounds
     *  until spent) but is gone at combat end — so it keeps the within-combat
     *  float premium (5, above KINDLE's 2.5) and DROPS the cross-combat
     *  `forgePersistence` credit (D4, 2026-07-17). */
    forgeFloating: 5,
    /** FORGE cross-combat persistence value (save-persisted, reroll-exempt).
     *  RETIRED from the floating verbs at D4 (spec 33 §6: floating → temp gold,
     *  combat-only) — no longer added to `forge_floating_die` / `float_x_die`.
     *  Kept as the anchor the `concedeCapstone` "decisive persistent
     *  state-change" comment still references. */
    forgePersistence: 3,
    /** FORGE premium when the floating die is WILD. */
    forgeWildBonus: 1,
    /** RUPTURE — the verb (spec: 4)... */
    rupture: 4,
    /** ...plus the expected consumed-affliction fuel at neutral read. */
    ruptureExpectedFuel: 8,
    /** REAP ALL — the verb (spec: 5); burst adds per expected soul below. */
    reapAll: 5,
    /** Expected Souls banked when a Harvest payoff fires. */
    expectedSouls: 4,
    /** TURNABOUT (phase 32 part 4a) — the verb: same base as REAP ALL, the
     *  same "ALL-spender capstone" archetype (spend/consume the whole bank). */
    turnabout: 5,
    /** Expected rungs banked in `rungsDeniedTotal` when a Control capstone
     *  fires: a mid-fight Standstill deck denies ~2-4 rungs/phase across
     *  ~6-8 phases by the time a rank-6 card is drawn — a realistic ~20-rung
     *  bank (2026-07-10-theme-identity.md §2 arithmetic). */
    expectedRungsDenied: 20,
    /** Expected pips banked when a Forge payoff fires. */
    expectedPips: 2,
    /** Expected pips that OVERFLOW a `grant_pip` (no Reserve room) per cast —
     *  the neutral read: one wave lands, one finds the Reserve at cap. */
    expectedOverflowPips: 1,
    /** Expected chosen X on a chosen-X cost (`recoil_x`, WS7.2): min 3, cap ≈
     *  live HP — a mid-fight commit prices at ~6. */
    expectedChosenX: 6,
    /** Expected omen hits when an Oracle payoff fires. */
    expectedOmenHits: 2,
    /** Expected live enemy DoTs when a glue verb (extend/boost) fires. */
    expectedLiveDots: 3,
    /** ECHO — the doubled PAID line multiplier. */
    echoMultiplier: 1.8,
    /** ECHO-NEXT-SPELL — deferred echo on an average spell. */
    echoNextSpell: 4,
    /** REPRISE, per card returned from the discard. */
    reprisePerCard: 2,
    /** REPRISE rider: the reprised card's FREE line fires now. */
    repriseFireFree: 1.5,
    /** REPLAY LAST, per replay of the last spell's PAID payload. */
    replayPerTime: 5,
    /** CONJURE — a one-use Haunt into hand. */
    conjure: 2,
    /** OMEN — declaring the prognostication glimpses the telegraph (info). */
    omenInfo: 1,
    /** Reveal the next threat phase's STANCE CHECK + reactive branch early.
     *  Spec 33 §2 retired the hidden `enemyStance` read; the info verb is
     *  REINTERPRETED (D4, 2026-07-17): everything telegraphs openly now, so what
     *  a card buys is the EARLY sight of the next phase's `punishes`/`yields`
     *  check (and the spec-29 branch it will take). Same info value (1.5) —
     *  reinterpreted, not repriced (spec 33 §6 "reinterpret, never cut"). */
    revealStance: 1.5,
    /** LOCK STANCE — the enemy's next phase keeps its current stance. */
    lockStance: 2.5,
    // ── Die-manipulation verbs, re-fit for the spec-33 four-die pool (D4,
    //    2026-07-17). The old single-draft model made a die-fix pivotal (one
    //    die WAS the turn); the four-die pool makes any single die 1/4 of the
    //    action economy — LESS pivotal — but the pool is MISS-heavy (colored
    //    3/6 usable, gold 2/6), which keeps a reroll/convert live. The two
    //    forces roughly offset, so the point values HOLD from the pre-33 table;
    //    the semantics are reinterpreted below. // PLAYTEST-CALIBRATION (D7
    //    ratifies against the flag-on matrix; the exact re-fit is a hypothesis
    //    until then). ─────────────────────────────────────────────────────────
    /** REFRESH — the powering die returns to `available` (one extra colored
     *  play from the same die). */
    refreshDie: 2,
    /** REROLL — reroll this card's MISS faces (spec 33 §4 valve 3; the honest,
     *  no-guarantee library sibling of Press Fate). ~2.17 misses/round at stock
     *  gear reroll to ~1 extra usable die — held at 2. */
    rerollSpent: 2,
    /** BANK — the powering die goes to the Reserve (ports unchanged, §6). */
    bankSpentDie: 2,
    /** CONVERT — the die returns REFRESHED as WILD: a premium over refresh
     *  because a wild die beats the miss-heavy pool's off-color hard-fizzle. */
    convertDieColor: 2.5,
    /** +1 intensity on the statuses THIS play lands. */
    bonusIntensity: 1.5,
    /** +1 turn on the statuses THIS play lands. */
    bonusDuration: 1,
    /** Immediately tick EVERY enemy DoT once. */
    tickAllDots: 1.5,
    /** Strip one random enemy buff. */
    stripRandomBuff: 2,
    /** Befriend attempt (the mercy line). */
    befriendAttempt: 3,
    /** SIPHON, per 25% of erosion healed. */
    siphonPer25Pct: 1,
    /** Non-DoT status application, per intensity x turn (mark/backfire/rapport/thorns). */
    statusPerIntensityTurn: 0.75,
    /** DoT application: printed lifetime HP ÷ this (with ramp/decay honoured). */
    dotLifetimeDivisor: 3,
    /** RIPOSTE: (damage + parry-reduce) × this (gated on a full block). Printed
     * `damage` prices the FLOOR — spec 32 §2 PA-3, the live counter scales up
     * to the actual prevented blow's size when it exceeds the floor; that
     * upside is unscored, matching Phase 32 Part 1's erosion precedent. */
    riposteFactor: 0.8,
    /** EXTEND DOTS: +1 turn across the expected live DoTs, per turn extended. */
    extendDotsPerTurn: 5.5,
    /** CONVERT DOTS: base swap value + per bonus intensity below. */
    convertDots: 5,
    /** BOOST ALL DOTS: per intensity, across the expected live DoTs. */
    boostAllDotsPerIntensity: 5,
    /** CONSUME AFFLICTION: remaining fuel ticks now (Harvest engine verb). */
    consumeAffliction: 5.5,
    /** SPEND PREMISES: the cash-the-tally-early engine verb. */
    spendPremises: 6.5,
    /** SPEND ALL PIPS: the zero-the-reserve verb (plus per-pip guard below). */
    spendAllPips: 1,
    /** RUPTURE MARKS (peroration rider): per printed HP-per-stack, expected 2 stacks ÷ 3. */
    ruptureMarksPerHp: 2 / 3,
    /** MILL, per card moved deck→discard (phase 30 FREE-currency rider —
     *  Echo's "advance the loop"; weaker than draw, no card-advantage). */
    millPerCard: 1,
    /** GLYPH CHARGE, per charge deposited (phase 33d pilot FREE-currency
     *  rider — priced like the `millPerCard`/`pip`-family small deposits;
     *  the fallback deposit it falls back to when no glyph exists is
     *  unscored here, matching the "one line fires" convention every other
     *  fallback verb follows). */
    glyphChargePerCharge: 0.4,
    // ── THE BIG NUMBERS REWRITE (2026-09-02) — direct damage and its family ──
    // Anchored against HEAL (1/3 per HP): removing an HP from the foe is worth
    // roughly what restoring one to yourself is, and both are cheaper per point
    // than GUARD is per HP blocked. With the rank bands repealed this table is
    // ADVISORY — it feeds the catalog's per-card score and the smell tests, and
    // no longer gates what may ship.
    /** DEAL, per HP of direct damage. */
    damagePerHp: 1 / 3,
    /** PIERCE, flat: ignoring HIDE is worth about one Ash hit against the
     *  armoured foes it is printed for. */
    pierce: 1.5,
    /** WRATH, per point: applies to every remaining hit. `expectedHitsLeft`
     *  hits at 1 HP each, priced through `damagePerHp`. */
    expectedHitsLeft: 6,
    /** FLAY, per stack: +50% on one hit ≈ half a typical hit of that rank.
     *  Priced coarsely — the real value rides the hit it modifies. */
    flayPerStack: 1.2,
    /** TWIN: doubling the next spell's PAID line, at the expected PAID value
     *  of a card one rank below the TWIN carrier. */
    twin: 4,
    /** CHAIN, per point: one hit's worth, discounted for the fade risk. */
    chainPerPoint: 0.5,
    /** EXECUTE: a conditional damage double, priced as the `dieBonus`-class
     *  conditional it is (the foe must already be low). */
    execute: 2.5,
    /** OVERKILL: opportunistic conversion of damage that was going to be
     *  wasted anyway — real, but never the reason to play the card. */
    overkill: 1.5,
    /** IMMOLATE (profane-canon rework) — the per-card-burned cost credit.
     *  Softer than a full draw (2) because the burn also thins junk/curses
     *  out of the cycle, which is value the player keeps. */
    immolateCredit: 1,
});

/** Conditional discounts (spec 32 v3 §4): the rider prices at a fraction. */
export const CONDITION_DISCOUNTS = Object.freeze({
    threshold: 0.5,
    dieBonus: 0.6,
    fate: 0.7,
    /** Theme-state gates (FALLEN). */
    fallen: 0.5,
});

/** Phase 33d (GLYPHS pilot) — a glyph's expected crack value discounts like
 *  `dieBonus`: it fires LATER, not guaranteed at print time (the ripening
 *  dilemma — "never cracked" is a real, printable outcome), so it prices
 *  the same way a die-bonus rider does rather than at full face value. */
export const GLYPH_CRACK_DISCOUNT = 0.6;

/** Self-cost credit: a printed cost refunds −0.75 × its point value. */
export const SELF_COST_CREDIT = 0.75;

/**
 * D4 (spec 33 §7 D4 note, 2026-07-17) — the PRICING view of the DoT event
 * clocks, re-derived against the four-die cadence. The engine's own forecast
 * (`EXPECTED_TRIGGERS_PER_ROUND`, `Combat/effects.ts`) still reads **2** plays
 * per round for the `card-played` clock — that constant also drives the LIVE
 * RUPTURE burst / `computeRoundsToKill`, so moving it is a balance change D7
 * ratifies, NOT a pricing re-fit. This table is the PRICING-ONLY view:
 *
 * - `card-played` → **1.83** — D3's measured realized cadence
 *   (`plan/tuning/2026-07-17-d3-dice-economy.md`: ~1.83 PAID plays/round at
 *   stock gear; FREE lines never tick this clock — `combat.engine.ts`
 *   `fireClock('card-played')` fires once per PAID play), down from the WS3.3
 *   ~2-plays estimate baked into the old lifetime. A fractional rate is priced
 *   as whole ticks + one fractional remainder tick (`walkDotHp`).
 * - `damage-instance` / `payoff` — inherited from the engine forecast
 *   unchanged (BLEED is decay-limited and clock-invariant; payoff fires ~once).
 *
 * DELIBERATE divergence, flagged for D7: pricing a `card-played` DoT at the
 * realized 1.83 while the engine forecasts 2 means a poison card prices ~8.5%
 * BELOW the fuel the live RUPTURE preview reads off it — the conservative
 * direction (never over-priced). D7 re-derives the engine forecast against the
 * same cadence and closes the gap. // PLAYTEST-CALIBRATION
 */
export const PRICING_TRIGGERS_PER_ROUND = Object.freeze({
    ...EXPECTED_TRIGGERS_PER_ROUND,
    'card-played': 1.83,
});

// ─── Status pricing ──────────────────────────────────────────────────────────

/**
 * Pricing horizon for a NO-CALENDAR DoT (`calendarExpiry: false` — expires
 * only via decay washout or combat end): its printed duration is nominal, so
 * the lifetime is priced over this many rounds instead (the same conservative
 * "min-4-triggers" convention the enchantment comments use).
 * // PLAYTEST-CALIBRATION
 */
export const NO_CALENDAR_PRICING_ROUNDS = 4;

/**
 * Phase 36b — the TEMPO HORIZON. A DoT tick that lands in combat round `r` is
 * worth `DOT_TEMPO_SURVIVAL ^ (r-1)` of its printed HP in the pricing budget:
 * the probability the fight is still going when that tick would land. Geometric
 * (memoryless) because the FINDINGS mechanism is a ~constant per-round death
 * hazard — enemy output against fixed HP sets the death clock, so
 * `avgRoundsAll` holds ~flat against card price. Mean fight length
 * `1/(1-p) = 4.0` rounds, self-consistent with the measured `avgRoundsAll`
 * ≈ 4.06 and with `NO_CALENDAR_PRICING_ROUNDS`. A pure DISCOUNT (weight ≤ 1,
 * = 1 in round 1, never a >1 front-load bonus that could push a finisher
 * through its rank ceiling): it stops OVERPAYING a slow ramp whose big ticks
 * land after most fights end, while a front-loaded DoT (BLEED decays into
 * rounds 1-2) keeps ~full printed value. Enemy/stage-INDEPENDENT — one global
 * horizon, NOT a per-stage one (that would break scoreCard's stage-
 * independence and re-litigate the late wall through the price lever the
 * erosion ladder proves cannot climb it). Source:
 * `scratch/price-experiment/report/FINDINGS.md` rec #2.
 * // PLAYTEST-CALIBRATION (seeds=2 origin makes the exact p provisional —
 * // /deck-tuning is the empirical court for a higher-seed confirmation)
 */
export const DOT_TEMPO_SURVIVAL = 0.75;

/** Geometric survival weight for a tick landing in round `r` (1-indexed). */
function tempoWeight(round: number): number {
    return Math.pow(DOT_TEMPO_SURVIVAL, round - 1);
}

/**
 * The per-tick DoT walk. `weightFn(round)` scales each tick's floored HP:
 * identity (`() => 1`) yields the PRINTED lifetime (`dotLifetimeHp`), the
 * tempo weight yields the horizon-discounted lifetime (`dotTempoWeightedHp`).
 * Honours the v3 modifiers with the engine's own per-tick walk: POISON ramps
 * per elapsed ROUND (`rampFactor`, floored into the per-tick base), BLEED
 * decays 1 intensity per TICK and washes out at 0, Doom
 * (`growth: 'per-enemy-action'`) gains +1 intensity per round (~1 enemy
 * action/round), and a no-calendar instance prices over
 * `NO_CALENDAR_PRICING_ROUNDS`. The weight multiplies the emitted HP ONLY,
 * never the intensity — so a BLEED's washout round is identical either way.
 * Returns 0 for non-DoT effects.
 */
function walkDotHp(
    effectId: string,
    intensity: number,
    duration: number,
    weightFn: (round: number) => number,
): number {
    const def = lookupEffect(effectId);
    const dot = def?.payload.damageOverTime;
    if (!def || !dot) return 0;
    const mods = def.payload.dotModifiers;
    const eventClock = dotEventTrigger(dot);
    const ticksPerRound = eventClock ? PRICING_TRIGGERS_PER_ROUND[eventClock] : 1;
    // D4 (spec 33) — a FRACTIONAL event rate (card-played = 1.83) prices as
    // whole ticks + one remainder tick weighted by the fraction. Integer rates
    // (damage-instance = 2, payoff/round-clock = 1) keep `fracTick = 0` and are
    // byte-identical to the pre-33 walk.
    const wholeTicks = Math.floor(ticksPerRound);
    const fracTick = ticksPerRound - wholeTicks;
    const rounds = mods?.calendarExpiry === false
        ? Math.max(duration, NO_CALENDAR_PRICING_ROUNDS)
        : duration;
    let total = 0;
    let tickNo = 0;
    for (let r = 1; r <= rounds; r++) {
        const dpr = mods?.escalatesPerTurn
            ? dot.damagePerRound + Math.floor((r - 1) * (mods.rampFactor ?? 0.5))
            : dot.damagePerRound;
        const grownIntensity = mods?.growth === 'per-enemy-action' ? intensity + (r - 1) : intensity;
        for (let t = 0; t < wholeTicks; t++, tickNo++) {
            const tickIntensity = mods?.decaysPerTick ? grownIntensity - tickNo : grownIntensity;
            if (tickIntensity <= 0) return total; // BLEED washout — the instance is spent
            total += Math.floor(dpr * tickIntensity) * weightFn(r);
        }
        if (fracTick > 0) {
            const tickIntensity = mods?.decaysPerTick ? grownIntensity - tickNo : grownIntensity;
            if (tickIntensity <= 0) return total;
            total += Math.floor(dpr * tickIntensity) * fracTick * weightFn(r);
            tickNo += 1;
        }
    }
    return total;
}

/**
 * PRINTED lifetime HP of a DoT application, priced BY ITS CLOCK (WS3.5,
 * spec 32 §12 #3): round-clocked (legacy) DoTs tick once per printed-duration
 * round; event-clocked DoTs tick `EXPECTED_TRIGGERS_PER_ROUND[trigger]` times
 * per round over the same horizon — the SAME constants the engine fuel math
 * (`getPendingDotTotal` / `computeRoundsToKill`) prices with, so the lint and
 * the RUPTURE preview never diverge. Kept PURE (phase 36b): the tempo
 * discount lives in `dotTempoWeightedHp`, NOT here, so these numbers stay the
 * engine's printed lifetime. Returns 0 for non-DoT effects.
 */
export function dotLifetimeHp(effectId: string, intensity: number, duration: number): number {
    return walkDotHp(effectId, intensity, duration, () => 1);
}

/**
 * TEMPO-WEIGHTED lifetime HP (phase 36b) — the printed lifetime with every
 * tick discounted by `tempoWeight(round)`. This is what `statusPoints` prices
 * a DoT at: a slow ramp whose big ticks land past the ~4-round death clock is
 * no longer OVERPAID at its printed lifetime, while a front-loaded DoT keeps
 * ~full value. Enemy/stage-INDEPENDENT (one global horizon) — see
 * `DOT_TEMPO_SURVIVAL`.
 */
export function dotTempoWeightedHp(effectId: string, intensity: number, duration: number): number {
    return walkDotHp(effectId, intensity, duration, tempoWeight);
}

/**
 * Points for applying `effectId` at `intensity` × `duration`. DoTs price at
 * TEMPO-WEIGHTED lifetime ÷ 3 (phase 36b — a slow ramp is no longer overpaid
 * at its printed lifetime; a front-loaded DoT keeps ~full value); every other
 * status prices at 0.75 per intensity-turn (checks: mark d2 = 1.5, backfire
 * i2 d2 = 3, rapport i1 d2 = 1.5, thorns i3 d2 = 4.5 — all match the spec
 * table, unaffected by tempo).
 */
export function statusPoints(effectId: string, intensity?: number, duration?: number): number {
    const def = lookupEffect(effectId);
    if (!def) return 0;
    const i = intensity ?? 1;
    const d = duration ?? def.duration;
    if (def.payload.damageOverTime) {
        return dotTempoWeightedHp(effectId, i, d) / VERB_POINTS.dotLifetimeDivisor;
    }
    return VERB_POINTS.statusPerIntensityTurn * i * d;
}

/**
 * Phase 33d (GLYPHS pilot) — expected points for a glyph's crack payload, at
 * a "reasonable" crack timing (`cap / 2` charges — cracking early is a real,
 * common line per the design's own ripening dilemma, NOT the max/full-cap
 * charges). Scored through the SAME verb-points table as any other status/
 * barrier rider — poison via `statusPoints` (a DoT, tempo-weighted like every
 * other one), barrier via the flat `barrierPerHp` rate.
 */
export function glyphExpectedValue(glyph: { payload: GlyphPayload; cap: number }): number {
    const expectedCharges = glyph.cap / 2;
    return glyph.payload.kind === 'poison'
        ? statusPoints('debuff_poison', glyph.payload.baseIntensity + expectedCharges, glyph.payload.duration)
        : (glyph.payload.baseAmount + expectedCharges) * VERB_POINTS.barrierPerHp;
}

// ─── Rider pricing ───────────────────────────────────────────────────────────

/** Points for a `CardRider` bundle (FREE lines and condition riders alike). */
export function scoreRider(rider: CardRider | undefined): number {
    if (!rider) return 0;
    let pts = 0;
    pts += (rider.bonusIntensity ?? 0) * VERB_POINTS.bonusIntensity;
    pts += (rider.bonusDuration ?? 0) * VERB_POINTS.bonusDuration;
    pts += (rider.guard ?? 0) * VERB_POINTS.guardPerHp;
    pts += (rider.conviction ?? 0) * VERB_POINTS.conviction;
    if (rider.refreshDie) pts += VERB_POINTS.refreshDie;
    if (rider.revealStance) pts += VERB_POINTS.revealStance;
    if (rider.tickAllDots) pts += VERB_POINTS.tickAllDots;
    if (rider.tickOne) pts += VERB_POINTS.tickOne;
    pts += (rider.cleanse ?? 0) * VERB_POINTS.cleanse;
    pts += (rider.healHp ?? 0) * VERB_POINTS.healPerHp;
    pts += (rider.drawCards ?? 0) * VERB_POINTS.draw;
    pts += (rider.premises ?? 0) * VERB_POINTS.premise;
    pts += (rider.sway ?? 0) * VERB_POINTS.swayPerStack;
    pts += (rider.souls ?? 0) * VERB_POINTS.soul;
    pts += (rider.foretell ?? 0) * VERB_POINTS.foretellPerCard;
    if (rider.applyEffect) {
        pts += statusPoints(
            rider.applyEffect.effectId,
            rider.applyEffect.intensity,
            rider.applyEffect.duration,
        );
    }
    pts += (rider.ruptureMarks ?? 0) * VERB_POINTS.ruptureMarksPerHp;
    pts += (rider.intensityPerPip ?? 0) * VERB_POINTS.pip;
    pts += (rider.pips ?? 0) * VERB_POINTS.pip;
    pts += (rider.stagger ?? 0) * VERB_POINTS.staggerPerRung;
    // phase 30 — FREE-currency riders (bulwark's persistent GUARD, akrasia's
    // blood-priced cost, echo's loop-advance).
    pts += (rider.barrier ?? 0) * VERB_POINTS.barrierPerHp;
    if (rider.recoil) pts += -(rider.recoil * VERB_POINTS.healPerHp) * SELF_COST_CREDIT;
    pts += (rider.millCards ?? 0) * VERB_POINTS.millPerCard;
    // Phase 33d (GLYPHS pilot) — the fallback rider itself is unscored here
    // (exactly one of glyphCharge-succeeds / glyphChargeFallback fires per
    // play; `glyphChargePerCharge` already represents the FREE line's value).
    pts += (rider.glyphCharge ?? 0) * VERB_POINTS.glyphChargePerCharge;
    // THE BIG NUMBERS REWRITE — the damage family on a rider (FREE lines and
    // condition payoffs), priced identically to the mechanic form.
    pts += (rider.damage ?? 0) * VERB_POINTS.damagePerHp;
    if (rider.pierce && rider.damage) pts += VERB_POINTS.pierce;
    pts += (rider.wrath ?? 0) * VERB_POINTS.expectedHitsLeft * VERB_POINTS.damagePerHp;
    pts += (rider.chain ?? 0) * VERB_POINTS.chainPerPoint;
    pts += (rider.flay ?? 0) * VERB_POINTS.flayPerStack;
    return pts;
}

// ─── Mechanic pricing ────────────────────────────────────────────────────────

/** Points for one `CardSpecialMechanic`. ECHO is card-level (see scoreCard). */
export function scoreMechanic(mechanic: CardSpecialMechanic): number {
    const V = VERB_POINTS;
    switch (mechanic.kind) {
        case 'strip_random_buff': return V.stripRandomBuff;
        case 'befriend_attempt': return V.befriendAttempt;
        case 'guard': return mechanic.amount * V.guardPerHp;
        case 'rupture':
            return V.rupture + V.ruptureExpectedFuel
                + (mechanic.fuelPerPip ?? 0) * V.expectedPips / V.dotLifetimeDivisor
                + (mechanic.fuelPerOmenHit ?? 0) * V.expectedOmenHits / V.dotLifetimeDivisor
                + (mechanic.bonusPct ?? 0) / 25;
        case 'siphon': return (mechanic.pct / 25) * V.siphonPer25Pct;
        case 'barrier': return mechanic.amount * V.barrierPerHp;
        case 'riposte': return (mechanic.damage + mechanic.reduce) * V.riposteFactor;
        case 'reroll_spent': return V.rerollSpent;
        case 'refresh_die': return V.refreshDie;
        case 'convert_die_color': return V.convertDieColor;
        case 'create_temporary_die':
            return V.kindle + (mechanic.color === 'wild' ? V.kindleWildBonus : 0);
        case 'grant_pip':
            // WS4.1 — the overflow rider prices at its per-fire value × the
            // expected wasted pips (the conversion is opportunistic, not free).
            return mechanic.count * V.pip
                + (mechanic.overflow ? scoreRider(mechanic.overflow) * V.expectedOverflowPips : 0);
        case 'overheat': {
            // Phase 32 part 4c — a genuinely risk-priced verb, not a free pip.
            // Per attempted pip: (1 − bustChance) grants +1 pip (V.pip) against
            // bustChance HALVING the targeted die's pre-push bank (assumed at
            // the typical Forge bank, V.expectedPips) at V.pip each — mirrors
            // the engine's actual `overheatReserve` cost (a partial setback,
            // not a full wipe).
            const gain = (1 - OVERHEAT_BUST_CHANCE) * V.pip;
            const loss = OVERHEAT_BUST_CHANCE * 0.5 * V.expectedPips * V.pip;
            return mechanic.pips * (gain - loss);
        }
        case 'bank_spent_die': return V.bankSpentDie;
        case 'forge_floating_die':
            // Spec 33 §6 (D4) — the floating grant is now a TEMPORARY GOLD die
            // (combat-only): the cross-combat `forgePersistence` credit is gone;
            // the within-combat float premium (5) stays.
            return V.forgeFloating
                + (mechanic.color === 'wild' ? V.forgeWildBonus : 0);
        case 'float_x_die':
            // TRANSMUTE — a wild FORGE fed by a MISS die in the tray (spec 33:
            // misses are the new dead faces), discounted for that fate
            // condition, floored by the +1 Conviction fallback. Combat-only temp
            // gold now, so no `forgePersistence` (D4, spec 33 §6).
            return (V.forgeFloating + V.forgeWildBonus) * CONDITION_DISCOUNTS.fate
                + V.conviction * (1 - CONDITION_DISCOUNTS.fate);
        case 'stagger': return mechanic.rungs * V.staggerPerRung;
        case 'lock_stance': return V.lockStance;
        case 'foretell': return mechanic.count * V.foretellPerCard;
        case 'omen':
            // Phase 32 part 4d — OMEN v2: priced at the boldest (window 1)
            // claim, same "single representative value" convention as
            // `recoil_x`'s `expectedChosenX` — the rider/dieBonus/info terms
            // are UNCHANGED from the pre-v2 formula, plus the new printed
            // `anteConviction` wager credits at the standard −0.75× self-cost
            // rate (same convention as `recoil`/`fate.recoilHp`). A wider
            // hedge scales BOTH the ante and the rider down together (1/window)
            // — a real player lever, not separately priced (same "coarse
            // table, /deck-tuning is the empirical court" spirit as every
            // other conditional-choice verb).
            return scoreRider(mechanic.rider) * CONDITION_DISCOUNTS.dieBonus + V.omenInfo
                - mechanic.anteConviction * V.conviction * SELF_COST_CREDIT;
        case 'premise': return mechanic.count * V.premise;
        case 'peroration':
            // Phase 36a — the `at`-payoff rider PLUS the flat CONDEMN capstone
            // when this declaration can win the argument outright (`concedeAt`
            // set). The capstone is a literal (enemy-independent); scaling it
            // to the elite/boss concede floor is enemy-aware → phase 36b.
            return scoreRider(mechanic.rider)
                + (mechanic.concedeAt !== undefined ? V.concedeCapstone : 0);
        case 'spend_premises': return V.spendPremises;
        case 'spend_all_pips':
            // WS4.1 — `markPer` prices the MARK stacks landed at the expected
            // pip bank (uncapped upside rides REAL pips; the table stays coarse).
            return V.spendAllPips + (mechanic.guardPerPip ?? 0) * 0.5
                + (mechanic.markPer
                    ? statusPoints('debuff_mark', Math.max(1, Math.floor(V.expectedPips / mechanic.markPer)))
                    : 0);
        case 'recoil': return -(mechanic.hp * V.healPerHp) * SELF_COST_CREDIT;
        case 'recoil_x':
            // Chosen X-cost: the payoff is the POISON landed at the expected X
            // (ceil(X × poisonPerX) intensity, default duration); the blood
            // price refunds the standard −0.75× self-cost credit at that X.
            return statusPoints('debuff_poison', Math.ceil(V.expectedChosenX * mechanic.poisonPerX))
                - V.expectedChosenX * V.healPerHp * SELF_COST_CREDIT;
        case 'extend_dots': return mechanic.turns * V.extendDotsPerTurn;
        case 'convert_dots': return V.convertDots + mechanic.bonusIntensity * V.bonusIntensity;
        case 'boost_all_dots': return mechanic.intensity * V.boostAllDotsPerIntensity;
        case 'soul_gain': return mechanic.count * V.soul;
        case 'consume_affliction': return V.consumeAffliction + mechanic.souls * V.soul;
        case 'reap':
            return scoreRider(mechanic.rider)
                + (mechanic.kindle ? V.kindle : 0)
                - mechanic.cost * V.soul * SELF_COST_CREDIT;
        case 'reap_all':
            return V.reapAll + mechanic.burstPerSoul * V.expectedSouls / V.dotLifetimeDivisor;
        case 'turnabout':
            return V.turnabout + mechanic.burstPerRung * V.expectedRungsDenied / V.dotLifetimeDivisor;
        case 'sway': return mechanic.amount * V.swayPerStack;
        case 'echo': return 0; // card-level multiplier (scoreCard)
        case 'echo_next_spell': return V.echoNextSpell;
        case 'reprise':
            return mechanic.count * V.reprisePerCard + (mechanic.fireFree ? V.repriseFireFree : 0);
        case 'replay_last': return mechanic.times * V.replayPerTime;
        case 'conjure_card': return V.conjure;
        case 'rider': return scoreRider(mechanic.rider);
        // Profane-canon rework — IMMOLATE: the rider at full value, minus a
        // flat 1-point credit per card burned (a real cost, but softer than a
        // draw's full 2: the burn also thins junk/curses, which is value).
        case 'immolate':
            return scoreRider(mechanic.rider) - mechanic.count * V.immolateCredit;
        // PURGE — curse self-exile: deliberately unpriced (curse cards are
        // worthless by design and exempt from the band lint).
        case 'purge_self': return 0;
        // ── THE BIG NUMBERS REWRITE — direct damage and its family ──────────
        case 'deal':
            return mechanic.amount * (mechanic.hits ?? 1) * V.damagePerHp
                + (mechanic.pierce ? V.pierce : 0);
        case 'wrath':
            return mechanic.amount * V.expectedHitsLeft * V.damagePerHp;
        case 'flay': return mechanic.stacks * V.flayPerStack;
        case 'twin': return V.twin;
        case 'chain': return mechanic.amount * V.chainPerPoint;
        case 'execute': return V.execute;
        case 'overkill': return V.overkill;
    }
}

// ─── Card scoring ────────────────────────────────────────────────────────────

/**
 * The pricing-lint entry point: total points for a card —
 *
 *   PAID line (combatEffects + specialMechanics; self-applied debuffs and
 *   RECOIL post as −0.75× credits; ECHO multiplies the whole PAID line
 *   by 1.8) + FREE line + condition riders at their discounts
 *   (threshold ×0.5, dieBonus ×0.6, fate ×0.7 with its recoil credit,
 *   FALLEN ×0.5).
 *
 * Enchantments/disenchants return 0 — persistent passives are engine text,
 * priced by hand (the "min-4-triggers" law in the card comments).
 */
export function scoreCard(card: Card): number {
    if (card.cardType !== 'spell') return 0;

    let paid = 0;
    for (const ce of card.combatEffects ?? []) {
        const def = lookupEffect(ce.effectId);
        const pts = statusPoints(ce.effectId, ce.intensity, ce.duration);
        if (ce.appliedTo === 'self' && def?.type === 'debuff') {
            paid -= pts * SELF_COST_CREDIT; // the akratic bargain: a printed cost
        } else {
            paid += pts;
        }
    }
    let echoed = false;
    for (const m of card.specialMechanics ?? []) {
        if (m.kind === 'echo') { echoed = true; continue; }
        paid += scoreMechanic(m);
    }
    if (echoed) paid *= VERB_POINTS.echoMultiplier;

    let pts = paid + scoreRider(card.free);
    if (card.threshold) pts += scoreRider(card.threshold.rider) * CONDITION_DISCOUNTS.threshold;
    if (card.dieBonus) pts += scoreRider(card.dieBonus.rider) * CONDITION_DISCOUNTS.dieBonus;
    if (card.fate) {
        pts += scoreRider(card.fate.rider) * CONDITION_DISCOUNTS.fate;
        pts -= (card.fate.recoilHp ?? 0) * VERB_POINTS.healPerHp * SELF_COST_CREDIT;
    }
    if (card.fallen) pts += scoreRider(card.fallen.rider) * CONDITION_DISCOUNTS.fallen;
    // WS4.2 — a combat-state synergy condition (ledger-read gate) prices at
    // the threshold ×0.5 discount, per the ratified item-4 direction.
    //
    // D4 note (spec 33 §2, F2 caveat — 2026-07-17): a future STANCE-CHECK
    // synergy (a rider gated on "you end this phase in the `yields` stance")
    // prices through THIS same threshold ×0.5 gate — it is a state-read
    // condition, not a new discount tier. But it is priced CONSERVATIVELY and
    // NOT yet exercised: per D3 finding F2 no enemy authors a `stanceCheck`
    // field, so yield income is DARK and stance-check-synergy pricing cannot be
    // playtest-validated. When stance checks land (enemy content, out of D4
    // scope) a `stance-check` `SynergyStatePredicate` kind slots in here at
    // ×0.5. There are no MOMENTUM/SURGE card RIDERS to price today either —
    // momentum/surge are engine state (spec 33 §3), advanced by any PAID play,
    // with no card verb that grants or reads them; a card that reroll/convert/
    // taps into them uses the die-manipulation verbs priced above.
    if (card.synergy?.statePredicate && card.synergy.rider) {
        pts += scoreRider(card.synergy.rider) * CONDITION_DISCOUNTS.threshold;
    }
    // Phase 33d (GLYPHS pilot) — the PAID-line inscribe: its own scoring
    // branch (not a state-gated rider), discounted like a die-bonus (fires
    // later, not guaranteed at print time).
    if (card.glyph) pts += glyphExpectedValue(card.glyph) * GLYPH_CRACK_DISCOUNT;

    return pts;
}
