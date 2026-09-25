/**
 * Aggregated effect modifiers.
 *
 * One pass over a combatant's `ActiveEffect[]` builds a single
 * `AggregatedEffectModifiers` object the rest of the combat module reads from
 * (defense bonus, advantage grants, action restrictions, DoT
 * totals, regen / drain). Per-application stacking caps and intensity scaling
 * (Q2) are applied here so the consumers stay simple.
 */

import { ActiveEffect, DamageOverTime, DotTickPhase, EffectStatTarget } from '../Effects/types';
import { lookupEffect } from '../Effects/effects.library';
import { evaluateInteractions, checkInteractionTrigger } from '../Effects/interactions';
import { EFFECT_INTERACTIONS } from '../Effects/amplification.registry';
import { INTERACTION_AMPLIFICATION } from './resolution.constants';
import { Stance } from './types';

/**
 * Phase 156 — live DoT combo amplification.
 *
 * Evaluates the active effects against the interaction registry and returns a
 * per-effect-id DoT multiplier for every triggered `amplify_damage` combo. When
 * several combos target the same effect, the single largest multiplier wins (no
 * stacking blowups). Each multiplier is clamped to
 * `INTERACTION_AMPLIFICATION.MAX_DAMAGE_MULTIPLIER`. Multipliers below
 * `MIN_MEANINGFUL_AMPLIFICATION` are dropped so trivial bonuses don't perturb
 * the integer DoT math. Pure — reads effects, mutates nothing persisted.
 */
export function getDotAmplificationByEffect(effects: ActiveEffect[]): Map<string, number> {
    const amp = new Map<string, number>();
    const results = evaluateInteractions(EFFECT_INTERACTIONS, effects);
    for (const result of results) {
        if (result.type !== 'amplify_damage') continue;
        if (result.amplificationValue < INTERACTION_AMPLIFICATION.MIN_MEANINGFUL_AMPLIFICATION) continue;
        const clamped = Math.min(result.amplificationValue, INTERACTION_AMPLIFICATION.MAX_DAMAGE_MULTIPLIER);
        const current = amp.get(result.targetEffectId) ?? 1;
        if (clamped > current) amp.set(result.targetEffectId, clamped);
    }
    return amp;
}

// ── WS3 trigger-clock DoT substrate (spec 32 §12, ratified 2026-07-11 #3) ─────

/** The three EVENT clocks — DoTs that tick on game events, never at the round
 *  boundary. Round-clock triggers ('round-start'/'round-end') stay on the
 *  legacy `tickPhase` aggregation path. */
export type DotEventTrigger = 'card-played' | 'damage-instance' | 'payoff';

/** The event clock a DoT ticks on, or null when it rides a round clock. */
export function dotEventTrigger(dot: DamageOverTime): DotEventTrigger | null {
    return dot.trigger === 'card-played' || dot.trigger === 'damage-instance' || dot.trigger === 'payoff'
        ? dot.trigger
        : null;
}

/** Effective round-clock phase for a DoT: `tickPhase` stays the alias for the
 *  two round clocks ('round-start'/'round-end' map onto it; absent trigger =
 *  legacy `tickPhase ?? 'start'`); null for event-clocked DoTs — they tick
 *  only via `fireDotTrigger`, never at the round boundary. */
export function dotRoundClockPhase(dot: DamageOverTime): DotTickPhase | null {
    if (dot.trigger === undefined) return dot.tickPhase ?? 'start';
    if (dot.trigger === 'round-start') return 'start';
    if (dot.trigger === 'round-end') return 'end';
    return null;
}

/**
 * UNRAVELING ramp (P0-truth wiring of `dotModifiers.escalatesPerTurn`): the
 * effective per-round damage grows the longer the effect has been active —
 *   dprEff = dpr + floor(rampFactor × turnsActive)
 * where turnsActive = currentRound − appliedAt (0 when `currentRound` is not
 * threaded through, so untimed callers keep the flat base tick). Pure.
 */
export function rampedDamagePerRound(
    ae: ActiveEffect,
    dpr: number,
    dotModifiers: { escalatesPerTurn?: boolean; rampFactor?: number } | undefined,
    currentRound?: number,
): number {
    if (!dotModifiers?.escalatesPerTurn || !dotModifiers.rampFactor || currentRound === undefined) return dpr;
    const turnsActive = Math.max(0, currentRound - ae.appliedAt);
    return dpr + Math.floor(dotModifiers.rampFactor * turnsActive);
}

/** One DoT effect's per-tick contribution, with the live combo multiplier surfaced. */
export interface ActiveDotEntry {
    effectId: string;
    label: string;
    /** Unamplified per-tick HP: floor(damagePerRound × intensity). */
    baseAmount: number;
    /** Amplified per-tick HP that actually lands: floor(damagePerRound × intensity × multiplier). */
    amount: number;
    /** Combo multiplier applied to this effect (1 when no combo). */
    multiplier: number;
}

/**
 * Per-effect AMPLIFIED DoT total for one tick (start + end phases combined),
 * surfacing the live combo multiplier so the mobile honesty layer can render the
 * real numbers (and so payoff cards like RUPTURE read the true detonation total).
 * Pure; mirrors the floor-per-tick math `getActiveEffectModifiers` uses, so the
 * `amount`s sum to the HP the DoT actually erodes each round.
 */
export function getActiveDotTotal(effects: ActiveEffect[], currentRound?: number): { perEffect: ActiveDotEntry[]; total: number } {
    const dotAmp = getDotAmplificationByEffect(effects);
    const markBonus = getTickAmplifyFlat(effects);
    const perEffect: ActiveDotEntry[] = [];
    let total = 0;
    for (const ae of effects) {
        const def = lookupEffect(ae.effectId);
        const dot = def?.payload.damageOverTime;
        if (!def || !dot) continue;
        const intensity = ae.intensity ?? 1;
        const multiplier = dotAmp.get(ae.effectId) ?? 1;
        const dpr = rampedDamagePerRound(ae, dot.damagePerRound, def.payload.dotModifiers, currentRound);
        const baseAmount = Math.floor(dpr * intensity);
        const amount = Math.floor(dpr * intensity * multiplier) + markBonus;
        perEffect.push({ effectId: ae.effectId, label: def.name, baseAmount, amount, multiplier });
        total += amount;
    }
    return { perEffect, total };
}

/**
 * MARK (spec 32 v3, ratified A3) — the flat bonus every DoT tick on the bearer
 * gains: Σ (tickAmplifyFlat × intensity) across the bearer's effects. 0 for an
 * unmarked bearer (every prior case byte-identical). Pure.
 */
export function getTickAmplifyFlat(effects: ActiveEffect[]): number {
    let bonus = 0;
    for (const ae of effects) {
        const flat = lookupEffect(ae.effectId)?.payload.tickAmplifyFlat ?? 0;
        if (flat > 0) bonus += flat * (ae.intensity ?? 1);
    }
    return bonus;
}

/** One live, triggered DoT-amplification combo (e.g. Hemorrhage), named via the registry. */
export interface ActiveDotAmplification {
    targetEffectId: string;
    multiplier: number;
    interactionId: string;
    comboName: string;
}

/**
 * The live `amplify_damage` combos currently triggered on `effects` (poison+bleed
 * → Hemorrhage, acid+poison → Dissolution, burn+acid → Corrosive Fire, …), each
 * with the clamped multiplier and the combo's display name from the registry.
 * Feeds the mobile DoT-combo matrix. Sorted by priority (high first), then id,
 * mirroring `evaluateInteractions`. Pure.
 */
export function getActiveDotAmplifications(effects: ActiveEffect[]): ActiveDotAmplification[] {
    const out: ActiveDotAmplification[] = [];
    for (const interaction of EFFECT_INTERACTIONS) {
        if (interaction.result.type !== 'amplify_damage') continue;
        if (!checkInteractionTrigger(interaction.trigger, effects)) continue;
        const raw = interaction.result.amplificationValue;
        if (raw < INTERACTION_AMPLIFICATION.MIN_MEANINGFUL_AMPLIFICATION) continue;
        out.push({
            targetEffectId: interaction.result.targetEffectId,
            multiplier: Math.min(raw, INTERACTION_AMPLIFICATION.MAX_DAMAGE_MULTIPLIER),
            interactionId: interaction.id,
            comboName: interaction.name,
        });
    }
    out.sort((a, b) => {
        const pa = EFFECT_INTERACTIONS.find(i => i.id === a.interactionId)?.priority ?? 0;
        const pb = EFFECT_INTERACTIONS.find(i => i.id === b.interactionId)?.priority ?? 0;
        if (pa !== pb) return pb - pa;
        return a.interactionId.localeCompare(b.interactionId);
    });
    return out;
}

/**
 * Aggregated, intensity-scaled modifiers from every active effect on a combatant.
 *
 * - `statFlat` and `statMultBonus` are keyed by `EffectStatTarget` and are summed
 *   across every modifier targeting that stat.
 * - Multipliers compose **additively** per Q3: `final = base × (1 + Σ (m - 1))`.
 * - Every numeric is intensity-scaled per Q2: a value of `v` at intensity `n`
 *   contributes `v × n` (multipliers contribute `(m - 1) × n` to `statMultBonus`).
 * - DoT damage is split by tick phase (Q4). Drain is kept separate from regen
 *   so the consumer can render them differently (Q6).
 */
export interface AggregatedEffectModifiers {
    statFlat: Map<EffectStatTarget, number>;
    statMultBonus: Map<EffectStatTarget, number>;
    defenseDelta: number;
    advantageGrants: Set<Stance>;
    advantageDenies: Set<Stance>;
    skipTurn: boolean;
    forcedStance: Stance | null;
    blockedStances: Set<Stance>;
    dotStart: number;
    dotEnd: number;
    healthRegen: number;
    healthDrain: number;
}

const emptyAgg = (): AggregatedEffectModifiers => ({
    statFlat:        new Map(),
    statMultBonus:   new Map(),
    defenseDelta:    0,
    advantageGrants: new Set(),
    advantageDenies: new Set(),
    skipTurn:        false,
    forcedStance:    null,
    blockedStances:  new Set(),
    dotStart:        0,
    dotEnd:          0,
    healthRegen:     0,
    healthDrain:     0,
});

const addToMap = (map: Map<EffectStatTarget, number>, key: EffectStatTarget, value: number): void => {
    map.set(key, (map.get(key) ?? 0) + value);
};

/**
 * Walks `effects` once and returns the aggregated modifier bundle. Pure.
 * Effects whose definition isn't in the library are skipped silently — they
 * may exist as data-only placeholders.
 */
export function getActiveEffectModifiers(effects: ActiveEffect[], currentRound?: number): AggregatedEffectModifiers {
    const agg = emptyAgg();
    const dotAmp = getDotAmplificationByEffect(effects);
    const markBonus = getTickAmplifyFlat(effects);

    for (const ae of effects) {
        const def = lookupEffect(ae.effectId);
        if (!def) continue;

        const intensity = ae.intensity ?? 1;
        const payload = def.payload;

        for (const mod of payload.statModifiers ?? []) {
            const scaled = mod.value * intensity;
            if (mod.isMultiplier) {
                // Convert to bonus-over-1.0 and accumulate additively (Q3).
                addToMap(agg.statMultBonus, mod.stat, (mod.value - 1) * intensity);
            } else {
                addToMap(agg.statFlat, mod.stat, scaled);
            }
        }

        if (payload.defenseModifier) {
            agg.defenseDelta += payload.defenseModifier * intensity;
        }

        if (payload.advantageModifier?.grantAdvantage) {
            for (const s of payload.advantageModifier.grantAdvantage) agg.advantageGrants.add(s);
        }
        if (payload.advantageModifier?.grantDisadvantage) {
            for (const s of payload.advantageModifier.grantDisadvantage) agg.advantageDenies.add(s);
        }

        const restriction = payload.actionRestriction;
        if (restriction) {
            if (restriction.skipTurn) agg.skipTurn = true;
            if (restriction.forcedStance && !agg.forcedStance) {
                // Last-write-wins is unstable — keep the first; ties resolved by effect order.
                agg.forcedStance = restriction.forcedStance;
            }
            for (const s of restriction.blockedStances ?? []) agg.blockedStances.add(s);
        }

        const dot = payload.damageOverTime;
        if (dot) {
            // Phase 156: apply live combo amplification to this effect's DoT.
            // Multiplier defaults to 1 (no combo) and floors to an integer to
            // match the rest of the unresisted DoT math. P0-truth: the ramp
            // (`escalatesPerTurn`) grows the per-round base when a round is threaded.
            // MARK (spec 32 v3): each ticking effect gains the bearer's flat
            // tick-amplify bonus (+1 per Mark stack per tick), added below.
            // WS3: event-clocked DoTs (null round phase) never tick at the
            // round boundary — `fireDotTrigger` owns their clock.
            const phase = dotRoundClockPhase(dot);
            if (phase !== null) {
                const multiplier = dotAmp.get(ae.effectId) ?? 1;
                const dpr = rampedDamagePerRound(ae, dot.damagePerRound, payload.dotModifiers, currentRound);
                const total = Math.floor(dpr * intensity * multiplier) + markBonus;
                if (phase === 'start') agg.dotStart += total;
                else                   agg.dotEnd   += total;
            }
        }

        const regen = payload.regeneration;
        if (regen) {
            const hp = (regen.healthPerRound ?? 0) * intensity;
            if (hp > 0) agg.healthRegen += hp;
            else if (hp < 0) agg.healthDrain += -hp;
        }
    }

    return agg;
}

/**
 * Resolves Q7's action-restriction precedence into a final canAct outcome.
 *
 * Rules (per Q7 default):
 *   1. `skipTurn` wins outright — bearer loses their action regardless of stance.
 *   2. `forcedStance` overrides the requested stance and trumps `blockedStances`.
 *   3. If the requested stance is in `blockedStances`, bearer cannot use it.
 *
 * @param effects        - The bearer's active effects.
 * @param requestedStance - Stance the bearer wants to use this round (`null` if not yet chosen).
 *
 * @returns
 *   - `canAct`         — false when stunned/slept/petrified or the requested stance is blocked.
 *   - `resolvedStance` — the stance that will actually be used (forced > requested).
 *   - `reason`         — short hint for the UI when blocked.
 */
export function canAct(
    effects: ActiveEffect[],
    requestedStance: Stance | null = null,
): { canAct: boolean; resolvedStance: Stance | null; reason: string | null } {
    const mods = getActiveEffectModifiers(effects);

    if (mods.skipTurn) {
        return { canAct: false, resolvedStance: null, reason: 'skipTurn' };
    }

    if (mods.forcedStance) {
        // Forced stance trumps a block — charm overrides silence on its own stance.
        return { canAct: true, resolvedStance: mods.forcedStance, reason: null };
    }

    if (requestedStance && mods.blockedStances.has(requestedStance)) {
        return { canAct: false, resolvedStance: null, reason: 'blockedStance' };
    }

    return { canAct: true, resolvedStance: requestedStance, reason: null };
}
