/**
 * Aggregated effect modifiers.
 *
 * One pass over a combatant's `ActiveEffect[]` builds a single
 * `AggregatedEffectModifiers` object the rest of the combat module reads from
 * (action restrictions and the round-clock DoT total). Per-application stacking caps and intensity scaling
 * (Q2) are applied here so the consumers stay simple.
 */

import { ActiveEffect, DamageOverTime } from '../Effects/types';
import { lookupEffect } from '../Effects/effects.library';
import { evaluateInteractions, checkInteractionTrigger } from '../Effects/interactions';
import { EFFECT_INTERACTIONS } from '../Effects/amplification.registry';
import { INTERACTION_AMPLIFICATION } from './resolution.constants';

/**
 * Live DoT combo amplification.
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

// ── Trigger-clock DoT substrate ─────────────────────────────────────────────

/** The three EVENT clocks — DoTs that tick on game events, never at the round
 *  boundary. A DoT with no `trigger` rides the round clock instead. */
export type DotEventTrigger = 'card-played' | 'damage-instance' | 'payoff';

/** The event clock a DoT ticks on, or null when it rides the round clock. */
export function dotEventTrigger(dot: DamageOverTime): DotEventTrigger | null {
    return dot.trigger ?? null;
}

/** True when a DoT ticks at round start (it names no event `trigger`);
 *  event-clocked DoTs tick only via `fireDotTrigger`. */
export function ticksOnRoundClock(dot: DamageOverTime): boolean {
    return dot.trigger === undefined;
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
 * Per-effect AMPLIFIED DoT total for one tick,
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
 * MARK — the flat bonus every DoT tick on the bearer gains:
 * Σ (tickAmplifyFlat × intensity) across the bearer's effects. 0 for an
 * unmarked bearer. Pure.
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
 * - Every numeric is intensity-scaled: a value of `v` at intensity `n`
 *   contributes `v × n`.
 * - `dotStart` is the round-clock DoT total (event-clocked DoTs excluded).
 */
export interface AggregatedEffectModifiers {
    skipTurn: boolean;
    dotStart: number;
}

const emptyAgg = (): AggregatedEffectModifiers => ({
    skipTurn:        false,
    dotStart:        0,
});

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

        if (payload.actionRestriction?.skipTurn) agg.skipTurn = true;

        const dot = payload.damageOverTime;
        if (dot) {
            // Apply live combo amplification to this effect's DoT.
            // Multiplier defaults to 1 (no combo) and floors to an integer to
            // match the rest of the unresisted DoT math. The ramp
            // (`escalatesPerTurn`) grows the per-round base when a round is threaded.
            // MARK: each ticking effect gains the bearer's flat
            // tick-amplify bonus (+1 per Mark stack per tick), added below.
            // Event-clocked DoTs (null round phase) never tick at the
            // round boundary — `fireDotTrigger` owns their clock.
            if (ticksOnRoundClock(dot)) {
                const multiplier = dotAmp.get(ae.effectId) ?? 1;
                const dpr = rampedDamagePerRound(ae, dot.damagePerRound, payload.dotModifiers, currentRound);
                agg.dotStart += Math.floor(dpr * intensity * multiplier) + markBonus;
            }
        }
    }

    return agg;
}

/**
 * Whether the bearer can act this phase: `skipTurn` (stun, sleep, petrify)
 * loses the action outright; `reason` is the short hint for the UI.
 */
export function canAct(effects: ActiveEffect[]): { canAct: boolean; reason: string | null } {
    if (getActiveEffectModifiers(effects).skipTurn) return { canAct: false, reason: 'skipTurn' };
    return { canAct: true, reason: null };
}
