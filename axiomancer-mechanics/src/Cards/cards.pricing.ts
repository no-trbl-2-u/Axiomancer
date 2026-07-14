/**
 * Card pricing — the spec 32 v3 power-budget point table (§4, ledger #1-2).
 *
 * One point ~ 3 HP of neutral-read swing. Every card in
 * `cards.library.ts` ships its arithmetic in a comment; `scoreCard` is the
 * executable form of that arithmetic, and the pricing lint
 * (`src/Cards/e2e/pricing.engine.test.ts`) asserts each SPELL's score lands
 * inside its printed rank's band. Enchantments and disenchants are engine
 * text (persistent rule rewrites) — they are not scored.
 *
 * The table is intentionally coarse: `/deck-tuning` remains the empirical
 * court. The lint exists to catch rank dishonesty (a rank-6 card scoring 2,
 * a Doxa scoring 14), not to arbitrate half-points.
 */

import type { Card, CardRider, CardSpecialMechanic } from './types';
import { lookupEffect } from '../Effects/effects.library';
import { dotEventTrigger } from '../Combat/effect-modifiers';
import { EXPECTED_TRIGGERS_PER_ROUND } from '../Combat/effects';

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
    /** SWAY, per stack (the CAPITULATE currency). */
    swayPerStack: 0.8,
    /** STAGGER, per rung removed (a full 2-rung deny = 4). */
    staggerPerRung: 2,
    /** FORETELL, per card seen. */
    foretellPerCard: 1,
    /** PREMISE, per tally point. */
    premise: 0.8,
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
    /** FORGE — the floating-die verb itself (spec: 5). */
    forgeFloating: 5,
    /** FORGE cross-combat persistence value (save-persisted, reroll-exempt). */
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
    /** CONJURE — a one-use Thoughtform into hand. */
    conjure: 2,
    /** OMEN — declaring the prognostication glimpses the telegraph (info). */
    omenInfo: 1,
    /** Reveal the next threat phase's hidden stance. */
    revealStance: 1.5,
    /** LOCK STANCE — the enemy's next phase keeps its current stance. */
    lockStance: 2.5,
    /** Die-manipulation verbs (refresh / reroll / bank / convert). */
    refreshDie: 2,
    rerollSpent: 2,
    bankSpentDie: 2,
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
});

/** Conditional discounts (spec 32 v3 §4): the rider prices at a fraction. */
export const CONDITION_DISCOUNTS = Object.freeze({
    threshold: 0.5,
    dieBonus: 0.6,
    fate: 0.7,
    /** Theme-state gates (FALLEN). */
    fallen: 0.5,
});

/** Self-cost credit: a printed cost refunds −0.75 × its point value. */
export const SELF_COST_CREDIT = 0.75;

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
 * Expected lifetime HP of a DoT application, priced BY ITS CLOCK (WS3.5,
 * spec 32 §12 #3): round-clocked (legacy) DoTs tick once per printed-duration
 * round; event-clocked DoTs tick `EXPECTED_TRIGGERS_PER_ROUND[trigger]` times
 * per round over the same horizon — the SAME constants the engine fuel math
 * (`getPendingDotTotal` / `computeRoundsToKill`) prices with, so the lint and
 * the RUPTURE preview never diverge. Honours the v3 modifiers with the
 * engine's own per-tick walk: POISON ramps per elapsed ROUND (`rampFactor`,
 * floored into the per-tick base), BLEED decays 1 intensity per TICK and
 * washes out at 0, Doom (`growth: 'per-enemy-action'`) gains +1 intensity per
 * round (~1 enemy action/round), and a no-calendar instance prices over
 * `NO_CALENDAR_PRICING_ROUNDS`. Returns 0 for non-DoT effects.
 */
export function dotLifetimeHp(effectId: string, intensity: number, duration: number): number {
    const def = lookupEffect(effectId);
    const dot = def?.payload.damageOverTime;
    if (!def || !dot) return 0;
    const mods = def.payload.dotModifiers;
    const eventClock = dotEventTrigger(dot);
    const ticksPerRound = eventClock ? EXPECTED_TRIGGERS_PER_ROUND[eventClock] : 1;
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
        for (let t = 0; t < ticksPerRound; t++, tickNo++) {
            const tickIntensity = mods?.decaysPerTick ? grownIntensity - tickNo : grownIntensity;
            if (tickIntensity <= 0) return total; // BLEED washout — the instance is spent
            total += Math.floor(dpr * tickIntensity);
        }
    }
    return total;
}

/**
 * Points for applying `effectId` at `intensity` × `duration`. DoTs price at
 * lifetime ÷ 3; every other status prices at 0.75 per intensity-turn
 * (checks: mark d2 = 1.5, backfire i2 d2 = 3, rapport i1 d2 = 1.5,
 * thorns i3 d2 = 4.5 — all match the spec table).
 */
export function statusPoints(effectId: string, intensity?: number, duration?: number): number {
    const def = lookupEffect(effectId);
    if (!def) return 0;
    const i = intensity ?? 1;
    const d = duration ?? def.duration;
    if (def.payload.damageOverTime) {
        return dotLifetimeHp(effectId, i, d) / VERB_POINTS.dotLifetimeDivisor;
    }
    return VERB_POINTS.statusPerIntensityTurn * i * d;
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
        case 'bank_spent_die': return V.bankSpentDie;
        case 'forge_floating_die':
            return V.forgeFloating + V.forgePersistence
                + (mechanic.color === 'wild' ? V.forgeWildBonus : 0);
        case 'float_x_die':
            // TRANSMUTE — a full wild FORGE, discounted for needing a dead X in
            // the tray (fate-conditional), floored by the +1 Conviction fallback.
            return (V.forgeFloating + V.forgePersistence + V.forgeWildBonus) * CONDITION_DISCOUNTS.fate
                + V.conviction * (1 - CONDITION_DISCOUNTS.fate);
        case 'stagger': return mechanic.rungs * V.staggerPerRung;
        case 'lock_stance': return V.lockStance;
        case 'foretell': return mechanic.count * V.foretellPerCard;
        case 'omen': return scoreRider(mechanic.rider) * CONDITION_DISCOUNTS.dieBonus + V.omenInfo;
        case 'premise': return mechanic.count * V.premise;
        case 'peroration': return scoreRider(mechanic.rider);
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
    if (card.synergy?.statePredicate && card.synergy.rider) {
        pts += scoreRider(card.synergy.rider) * CONDITION_DISCOUNTS.threshold;
    }

    return pts;
}
