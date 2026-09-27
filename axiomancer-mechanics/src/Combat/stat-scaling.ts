/**
 * STAT SCALING — Phase S3 (refactor D1 step 3; decisions D40–D43,
 * `plan/2026-09-27-stat-scaling.prompt.md`).
 *
 * The player's three stats scale the numbers their cards print. Which stat is
 * decided by WHERE THE EFFECT LANDS, never by the card's colour:
 *
 *   body  — immediate damage to the foe (DEAL)
 *   mind  — anything that sits on you (GUARD, barrier, heal, THORNS, self-buffs)
 *   heart — anything that sits on the foe (VULNERABLE, POISON, BLEED, STUN)
 *   grey  — everything else (dice, draw, card handling, costs): unscaled
 *
 * and HOW MUCH is decided by the scaling kind:
 *
 *   one-shot  — `base × stat ÷ 5`: 5 is neutral, each point is +20% of the
 *               base. Single amounts and percentages (DEAL, GUARD, VULNERABLE).
 *   repeating — `base × (1 + (stat − 5) ÷ 10)`: half rate, because it fires
 *               again and again (DoT per tick, THORNS per hit, regen).
 *   flat      — never scales: on/off effects and every duration (no
 *               stun-lock), and the long tail of kinds the card purge (P1,
 *               D36) deletes.
 *
 * Nothing is capped (D41). Enemies never use this: their numbers stay
 * authored. No engine state, safe to import from presenters.
 */

import type { BaseStats } from '../Character/types';
import type { Card, CardRider, CardSpecialMechanic } from '../Cards/types';
import type { Effect, EffectPayload } from '../Effects/types';
import { lookupEffect } from '../Effects';

export type StatFamily = 'body' | 'mind' | 'heart' | 'grey';
export type ScalingKind = 'one-shot' | 'repeating' | 'flat';

export interface KeywordScaling {
    /** Where the effect lands. `by-target` = an applied status: heart on the
     *  foe, mind on you (see `effectFamily`). */
    family: StatFamily | 'by-target';
    scaling: ScalingKind;
}

/** The starting value of every stat: a stat of 5 leaves every number as printed. */
export const NEUTRAL_STAT = 5;

/**
 * THE formula. Every scaled player number goes through here. Integer out,
 * floored (the printed number never overstates the hit); a positive base
 * never scales below 1, so a low stat can shrink a card but not erase it.
 */
export function scaleAmount(base: number, stat: number, kind: ScalingKind): number {
    if (base <= 0 || kind === 'flat' || stat === NEUTRAL_STAT) return base;
    const scaled = kind === 'one-shot'
        ? (base * stat) / NEUTRAL_STAT
        : (base * (10 + stat - NEUTRAL_STAT)) / 10;
    return Math.max(1, Math.floor(scaled + 1e-9));
}

/** The stat a family reads. Grey reads the neutral value, so it never scales. */
export function statFor(stats: BaseStats | undefined, family: StatFamily): number {
    if (!stats || family === 'grey') return NEUTRAL_STAT;
    return stats[family];
}

/** Scale `base` for a family and kind against the player's stats. */
export function scaleFor(
    base: number,
    stats: BaseStats | undefined,
    family: StatFamily,
    kind: ScalingKind,
): number {
    return scaleAmount(base, statFor(stats, family), kind);
}

// ─── The keyword table ───────────────────────────────────────────────────────
// Typed as a full `Record` over the mechanic kinds and rider fields, so a new
// kind or rider field without a family is a COMPILE error (and the guard test
// in `e2e/stat-scaling.engine.test.ts` walks the runtime lists as well).

const BODY_ONE_SHOT: KeywordScaling = { family: 'body', scaling: 'one-shot' };
const MIND_ONE_SHOT: KeywordScaling = { family: 'mind', scaling: 'one-shot' };
const body: KeywordScaling = { family: 'body', scaling: 'flat' };
const mind: KeywordScaling = { family: 'mind', scaling: 'flat' };
const heart: KeywordScaling = { family: 'heart', scaling: 'flat' };
const grey: KeywordScaling = { family: 'grey', scaling: 'flat' };

/**
 * Every PAID mechanic kind. Only DEAL, GUARD and barrier scale: they are the
 * numbers that survive the card purge (P1, D36). The rest carry their D40
 * family (so a guided session that revives one knows its stat) but stay
 * `flat` until someone wires them.
 */
export const MECHANIC_SCALING: Record<CardSpecialMechanic['kind'], KeywordScaling> = {
    deal: BODY_ONE_SHOT,
    guard: MIND_ONE_SHOT,
    barrier: MIND_ONE_SHOT,
    // body: immediate damage to the foe
    rupture: body, reap: body, reap_all: body, immolate: body,
    overkill: body, execute: body, recoil_x: body,
    // mind: sits on you
    riposte: mind, wrath: mind, chain: mind, twin: mind, echo: mind,
    foretell: mind, premise: mind, soul_gain: mind, siphon: mind,
    // heart: sits on the foe
    flay: heart, stagger: heart, lock_stance: heart, sway: heart,
    extend_dots: heart, convert_dots: heart, boost_all_dots: heart,
    strip_random_buff: heart, befriend_attempt: heart,
    consume_affliction: heart, turnabout: heart,
    // grey: dice, cards, costs, containers
    reroll_spent: grey, refresh_die: grey, convert_die_color: grey,
    create_temporary_die: grey, grant_pip: grey, overheat: grey,
    bank_spent_die: grey, forge_floating_die: grey, float_x_die: grey,
    omen: grey, peroration: grey, spend_premises: grey, spend_all_pips: grey,
    recoil: grey, echo_next_spell: grey, reprise: grey, replay_last: grey,
    conjure_card: grey, purge_self: grey, rider: grey,
};

/** Every rider field (FREE lines and PAID riders). */
export const RIDER_SCALING: Record<keyof CardRider, KeywordScaling> = {
    damage: BODY_ONE_SHOT,
    guard: MIND_ONE_SHOT,
    barrier: MIND_ONE_SHOT,
    healHp: MIND_ONE_SHOT,
    applyEffect: { family: 'by-target', scaling: 'one-shot' },
    // the long tail, family only
    ruptureMarks: body, pierce: body,
    wrath: mind, chain: mind, conviction: mind, premises: mind, souls: mind,
    foretell: mind, cleanse: mind,
    flay: heart, stagger: heart, sway: heart, revealStance: heart,
    tickAllDots: heart, tickOne: heart, bonusIntensity: heart, bonusDuration: heart,
    intensityPerPip: heart,
    refreshDie: grey, drawCards: grey, pips: grey, recoil: grey, millCards: grey,
};

// ─── Applied statuses ────────────────────────────────────────────────────────

/**
 * How an effect's intensity scales, by what its payload does. A repeating
 * payload wins over a percentage one; an effect that doesn't stack by
 * intensity is on/off and never scales. A full `Record` over the payload keys,
 * so a new payload key has to pick one here.
 */
export const PAYLOAD_SCALING: Record<keyof EffectPayload, ScalingKind> = {
    damageOverTime: 'repeating',
    regeneration: 'repeating',
    reflectDamage: 'repeating',
    tickAmplifyFlat: 'repeating',
    backfirePerRung: 'repeating',
    damageTakenMult: 'one-shot',
    damageTakenMultForStance: 'one-shot',
    outgoingDamageMulPct: 'one-shot',
    outgoingThreatDamageMulPct: 'one-shot',
    powerMulPct: 'one-shot',
    healingReceivedMulPct: 'one-shot',
    outgoingSwayGainMulPct: 'one-shot',
    actionRestriction: 'flat',
    advantageModifier: 'flat',
    rollModifier: 'flat',
    rollModifierPerIntensity: 'flat',
    defenseModifier: 'flat',
    revealsStance: 'flat',
    dotModifiers: 'flat',
    suppressesThreatRiders: 'flat',
    blursStanceHints: 'flat',
    lockedStance: 'flat',
    consumedOnUse: 'flat',
    nextDotTierUpgrade: 'flat',
    restrictsSurgeAccess: 'flat',
    forcesWeakTierNextPlay: 'flat',
    blocksAdvantage: 'flat',
    reducesControlAccuracy: 'flat',
    deniesAllyBuffTargeting: 'flat',
    soloFightFallback: 'flat',
    forceWildOnNextDie: 'flat',
    cleanse: 'flat',
    colorChoice: 'flat',
};

export function effectScaling(def: Effect): ScalingKind {
    if (def.stacking !== 'intensity') return 'flat';
    const kinds = (Object.keys(def.payload) as (keyof EffectPayload)[]).map(k => PAYLOAD_SCALING[k]);
    if (kinds.includes('repeating')) return 'repeating';
    if (kinds.includes('one-shot')) return 'one-shot';
    return 'flat';
}

/**
 * The family of a status the player applies: heart on the foe, mind on
 * yourself. A DEBUFF you put on yourself is a cost (a curse's FREE line), not
 * a benefit, so it stays grey: a better stat must never make a cost worse.
 */
export function effectFamily(def: Effect, onSelf: boolean): StatFamily {
    if (!onSelf) return 'heart';
    return def.type === 'debuff' ? 'grey' : 'mind';
}

/** The intensity a player-applied status actually lands with. */
export function scaleEffectIntensity(
    def: Effect,
    intensity: number,
    onSelf: boolean,
    stats: BaseStats | undefined,
): number {
    return scaleFor(intensity, stats, effectFamily(def, onSelf), effectScaling(def));
}

// ─── The card face: a stat-scaled copy (S3, "final numbers on card faces") ───

/** A rider with every scaled field at the player's stats. Pure. */
export function scaleRider(r: CardRider, stats: BaseStats | undefined): CardRider {
    const out: CardRider = { ...r };
    if (r.damage) out.damage = scaleFor(r.damage, stats, 'body', 'one-shot');
    if (r.guard) out.guard = scaleFor(r.guard, stats, 'mind', 'one-shot');
    if (r.barrier) out.barrier = scaleFor(r.barrier, stats, 'mind', 'one-shot');
    if (r.healHp) out.healHp = scaleFor(r.healHp, stats, 'mind', 'one-shot');
    if (r.applyEffect) {
        const def = lookupEffect(r.applyEffect.effectId);
        if (def) {
            out.applyEffect = {
                ...r.applyEffect,
                intensity: scaleEffectIntensity(def, r.applyEffect.intensity ?? 1, r.applyEffect.to === 'self', stats),
            };
        }
    }
    return out;
}

function isNeutral(stats: BaseStats | undefined): boolean {
    return !stats || (stats.body === NEUTRAL_STAT && stats.mind === NEUTRAL_STAT && stats.heart === NEUTRAL_STAT);
}

/**
 * The card as the player's stats print it: every scaled number replaced by
 * the number the engine will apply (before colour match, the read and the
 * foe's VULNERABLE). For DISPLAY only — the engine always executes the
 * library card and scales at resolution, so never feed this back into play.
 * Returns the same object at neutral stats.
 */
export function scaleCardForStats(card: Card, stats: BaseStats | undefined): Card {
    if (isNeutral(stats)) return card;
    const mechanic = (m: CardSpecialMechanic): CardSpecialMechanic => {
        switch (m.kind) {
            case 'deal': return { ...m, amount: scaleFor(m.amount, stats, 'body', 'one-shot') };
            case 'guard': return { ...m, amount: scaleFor(m.amount, stats, 'mind', 'one-shot') };
            case 'barrier': return { ...m, amount: scaleFor(m.amount, stats, 'mind', 'one-shot') };
            case 'rider': case 'omen': case 'peroration': case 'immolate':
                return { ...m, rider: scaleRider(m.rider, stats) };
            case 'reap': return m.rider ? { ...m, rider: scaleRider(m.rider, stats) } : m;
            case 'grant_pip': return m.overflow ? { ...m, overflow: scaleRider(m.overflow, stats) } : m;
            default: return m;
        }
    };
    const out: Card = { ...card };
    // The authored PAID sentence carries the PRINTED numbers and can't follow
    // the stats, so the scaled copy drops it: the face falls back to the text
    // generated from the scaled mechanics (P0-truth: the printed number is the
    // applied number).
    delete out.paidSummary;
    if (card.specialMechanics) out.specialMechanics = card.specialMechanics.map(mechanic);
    if (card.combatEffects) {
        out.combatEffects = card.combatEffects.map(p => {
            const def = lookupEffect(p.effectId);
            return def ? { ...p, intensity: scaleEffectIntensity(def, p.intensity ?? 1, p.appliedTo === 'self', stats) } : p;
        });
    }
    if (card.free) out.free = scaleRider(card.free, stats);
    if (card.threshold) out.threshold = { ...card.threshold, rider: scaleRider(card.threshold.rider, stats) };
    if (card.dieBonus) out.dieBonus = { ...card.dieBonus, rider: scaleRider(card.dieBonus.rider, stats) };
    if (card.fate) out.fate = { ...card.fate, rider: scaleRider(card.fate.rider, stats) };
    if (card.fallen) out.fallen = { ...card.fallen, rider: scaleRider(card.fallen.rider, stats) };
    if (card.synergy?.rider) out.synergy = { ...card.synergy, rider: scaleRider(card.synergy.rider, stats) };
    return out;
}
