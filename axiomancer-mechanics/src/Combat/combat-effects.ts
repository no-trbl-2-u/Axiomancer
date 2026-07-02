/**
 * Tier 2 / Tier 3 effect procs from `attack` / `defend` actions (Spec 03).
 *
 * Every basic `attack` or `defend` that successfully lands a hit rolls for
 * proc effects defined in `combat-effects.library.json`. The proc table is
 * organised as Stance × action × tier triples; the runtime decides which
 * candidates are eligible based on the actor's per-cell `procUnlocks` cap
 * (default tier 1).
 *
 * Triggering rules (per Spec 03):
 *   Q1 — Hit gate: procs only fire when the action actually damaged the
 *        opponent (`resolveAttackHit`). Fumble self-debuffs still fire even
 *        on a missed/lost contest, but the wiring path runs on hits.
 *   Q2 — Final chance scales with the actor's stance stat plus any active
 *        `buff_status_chance_up` intensity:
 *            chance = baseChance
 *                   + (stanceBaseStat       × STAT_PROC_BONUS_PER_POINT)
 *                   + (statusChanceIntensity × STATUS_CHANCE_BUFF_BONUS)
 *   Q3 — Crit (nat 20) guarantees a proc and adds bonus intensity / duration.
 *        Fumble (nat 1) applies the entry's `fumbleEffectId` as a self-debuff.
 *   Q4 — Each eligible entry rolls independently. Cell unlock caps which
 *        tiers are eligible — basic actors only roll the T1 entry.
 *   Q5 — Switching is out of scope here; it feeds the skill system later.
 *   Q6 — Storage is JSON (this file's sibling), loaded once at module init.
 *   Q7 — Enemies use the same table by default; `procOverrides` on the
 *        Enemy / map can swap effectIds or chances for elites / bosses.
 */

import triggersLibrary from './combat-effects.library.json';
import { Stance, Combatant } from './types';
import { Character } from '../Character/types';
import { Enemy } from '../Enemy/types';
import { ActiveEffect, Effect, EffectApplicationResult, EffectTier } from '../Effects/types';
import { lookupEffect } from '../Effects/effects.library';
import { resolveEffectApplication } from './resist';
import {
    STAT_PROC_BONUS_PER_POINT,
    STATUS_CHANCE_BUFF_BONUS,
    STATUS_CHANCE_EFFECT_ID,
    CRIT_INTENSITY_BONUS,
    CRIT_DURATION_BONUS,
} from './combat.constants';
import { applyEffect } from '../Effects';
import { getBaseStat } from './stats';
import { EquipmentProcTrigger } from '../Items/types';
import { getRng } from '../Utils/rng';
import { EFFECT_BASE_PROC_INTENSITY } from '../Game/game-mechanics.constants';

/** A single Stance × action × tier proc candidate, as authored in JSON. */
export interface CombatEffectTrigger {
    stance: Stance;
    action: 'attack' | 'defend';
    tier: EffectTier;
    effectId: string;
    /**
     * Where the proc lands. `self` for buffs the actor grants themselves;
     * `opponent` for debuffs landed on the defender.
     */
    target: 'self' | 'opponent';
    /** Baseline proc chance (0-1) before stat/buff modifiers. */
    baseChance: number;
    /** Optional override for the applied intensity at first application. */
    intensityOverride?: number;
    /** Optional override for the applied duration at first application. */
    durationOverride?: number;
    /** Self-debuff applied if the actor fumbles their attack roll (nat 1). */
    fumbleEffectId?: string;
}

/**
 * Per-actor tier-cap overrides for the proc table. Default cap is tier 1
 * (only basic procs fire). Unlocking a cell to tier 2 or 3 enables the
 * corresponding higher-tier entries from the table.
 */
export type ProcUnlocks =
    Partial<Record<Stance, Partial<Record<'attack' | 'defend', EffectTier>>>>;

/**
 * Per-actor override map allowing elite / boss enemies to swap or augment
 * the default proc table for a specific cell. If an override is provided
 * for a Stance × action cell, the runtime uses ONLY the override entries
 * for that cell instead of the global table.
 */
export type ProcOverrides =
    Partial<Record<Stance, Partial<Record<'attack' | 'defend', CombatEffectTrigger[]>>>>;

const TRIGGER_TABLE: readonly CombatEffectTrigger[] =
    triggersLibrary.triggers as CombatEffectTrigger[];

/** True on a natural 1 attack roll; mirrors `Combat/dice.ts` for clarity. */
function isFumble(rawRoll: number): boolean { return rawRoll === 1; }
/** True on a natural 20 attack roll. */
function isCrit(rawRoll: number):   boolean { return rawRoll === 20; }

/** Sum of intensity across every active `buff_status_chance_up` on the actor. */
function getStatusChanceIntensity(actor: Combatant): number {
    return actor.effects
        .filter(ae => ae.effectId === STATUS_CHANCE_EFFECT_ID)
        .reduce((total, ae) => total + (ae.intensity ?? 1), 0);
}

/** Returns the per-cell unlock cap, defaulting to tier 1. */
function unlockedTier(
    unlocks: ProcUnlocks | undefined,
    stance: Stance,
    action: 'attack' | 'defend',
): EffectTier {
    return unlocks?.[stance]?.[action] ?? 1;
}

/**
 * Adapts an `EquipmentProcTrigger` into the `CombatEffectTrigger` shape the
 * proc roller expects. Equipment triggers don't carry a `stance` of their own
 * — they inherit the wearer's current stance — and they always pair with the
 * action that surfaced them (`onHitEffects` ↔ attack, `onDefendEffects` ↔
 * defend). Per Spec 05 Q6 (option A) these adapted entries share the same
 * proc machinery as the JSON-defined Stance × action triggers.
 */
function adaptEquipmentTrigger(
    eq: EquipmentProcTrigger,
    stance: Stance,
    action: 'attack' | 'defend',
): CombatEffectTrigger {
    return {
        stance,
        action,
        tier:              eq.tier,
        effectId:          eq.effectId,
        target:            eq.target,
        baseChance:        eq.baseChance,
        intensityOverride: eq.intensityOverride,
        durationOverride:  eq.durationOverride,
        fumbleEffectId:    eq.fumbleEffectId,
    };
}

/**
 * Pulls the proc entries the actor is allowed to roll for. Per-cell overrides
 * (boss / map-themed enemies) take precedence over the global table; otherwise
 * we filter the global table by Stance × action × tier ≤ unlocked cap.
 *
 * Per Spec 05 Q6 option A: `equipmentTriggers` (equipment-provided onHit /
 * onDefend entries) are appended on top of the cell's eligible list, filtered
 * by the same per-cell unlock cap so equipment can't sneak past tier gating.
 */
export function getEligibleTriggers(
    stance: Stance,
    action: 'attack' | 'defend',
    unlocks?: ProcUnlocks,
    overrides?: ProcOverrides,
    equipmentTriggers?: EquipmentProcTrigger[],
): CombatEffectTrigger[] {
    const cap = unlockedTier(unlocks, stance, action);
    const base = overrides?.[stance]?.[action]
        ? overrides[stance]![action]!.filter(t => t.tier <= cap)
        : TRIGGER_TABLE.filter(t =>
            t.stance === stance && t.action === action && t.tier <= cap,
          );

    if (!equipmentTriggers || equipmentTriggers.length === 0) return base;
    const adapted = equipmentTriggers
        .filter(eq => eq.tier <= cap)
        .map(eq => adaptEquipmentTrigger(eq, stance, action));
    return [...base, ...adapted];
}

/**
 * Final proc chance for a single entry: baseChance plus stat-scaled bonus
 * plus `buff_status_chance_up` bonus. Clamped to [0, 1].
 */
export function calculateProcChance(
    trigger: CombatEffectTrigger,
    actor: Combatant,
): number {
    const statBonus  = getBaseStat(actor, trigger.stance) * STAT_PROC_BONUS_PER_POINT;
    const buffBonus  = getStatusChanceIntensity(actor) * STATUS_CHANCE_BUFF_BONUS;
    const total      = trigger.baseChance + statBonus + buffBonus;
    return Math.max(0, Math.min(1, total));
}

/**
 * Result of one proc roll. `decision` is the headline (which path fired) and
 * `appliedTo` mirrors the trigger's target so callers can route the effect
 * onto the right combatant.
 */
export interface ProcRollOutcome {
    trigger: CombatEffectTrigger;
    effect: Effect;
    decision: 'crit' | 'normal' | 'skipped';
    /** Bonus intensity granted by a crit-guaranteed proc. */
    intensityBonus: number;
    /** Bonus duration granted by a crit-guaranteed proc. */
    durationBonus: number;
    appliedTo: 'self' | 'opponent';
}

/**
 * Fumble outcome — generated separately because fumbles are NOT gated by
 * tier and apply on the actor regardless of whether any other proc landed.
 */
export interface FumbleOutcome {
    effect: Effect;
    effectId: string;
}

export interface RollForCombatEffectsParams {
    actor: Combatant;
    stance: Stance;
    action: 'attack' | 'defend';
    /** The d20 attack roll that produced the hit — needed for crit / fumble. */
    rawAttackRoll: number;
    unlocks?: ProcUnlocks;
    overrides?: ProcOverrides;
    /**
     * Equipment-provided proc triggers from the actor's currently-equipped
     * items. Per Spec 05 Q6 option A these are folded into the eligible list
     * before the proc roll, sharing the same chance / crit / fumble math.
     */
    equipmentTriggers?: EquipmentProcTrigger[];
    /**
     * RNG used for the per-trigger proc roll. Defaults to `Math.random`.
     * Injected so tests can pin behavior deterministically alongside the
     * existing `mockFixedRng` flow used elsewhere in Combat.
     */
    rng?: () => number;
}

/**
 * Decides which procs fire for a single landed hit. Returns the list of
 * outcomes to apply plus, when relevant, a fumble self-debuff.
 *
 * Crit forces every eligible entry to fire with bonus intensity / duration.
 * Fumble produces the trigger's `fumbleEffectId` (or the first eligible
 * trigger's fumble if multiple exist) as a self-debuff on the actor.
 * Normal hits roll each entry independently against its computed chance.
 */
export function rollForCombatEffects(
    p: RollForCombatEffectsParams,
): { procs: ProcRollOutcome[]; fumble: FumbleOutcome | null } {
    const rng = p.rng ?? (() => getRng().random());
    const eligible = getEligibleTriggers(
        p.stance, p.action, p.unlocks, p.overrides, p.equipmentTriggers,
    );

    if (isFumble(p.rawAttackRoll)) {
        const fumbleId = eligible.find(t => t.fumbleEffectId)?.fumbleEffectId;
        const effect = fumbleId ? lookupEffect(fumbleId) : undefined;
        return {
            procs: [],
            fumble: effect ? { effect, effectId: fumbleId! } : null,
        };
    }

    const crit  = isCrit(p.rawAttackRoll);
    const procs: ProcRollOutcome[] = [];

    for (const trigger of eligible) {
        const effect = lookupEffect(trigger.effectId);
        if (!effect) continue;

        if (crit) {
            procs.push({
                trigger, effect,
                decision: 'crit',
                intensityBonus: CRIT_INTENSITY_BONUS,
                durationBonus:  CRIT_DURATION_BONUS,
                appliedTo: trigger.target,
            });
            continue;
        }

        const chance = calculateProcChance(trigger, p.actor);
        if (rng() < chance) {
            procs.push({
                trigger, effect,
                decision: 'normal',
                intensityBonus: 0,
                durationBonus: 0,
                appliedTo: trigger.target,
            });
        }
    }

    return { procs, fumble: null };
}

/**
 * Applies a single proc outcome to the relevant combatant via the existing
 * Tier 2 / 3 resist resolver. Returns the updated effect arrays plus the
 * resolver's full `EffectApplicationResult` so callers can emit an event
 * stream (battle log, automation harness, etc.).
 *
 * `attackerHeartBonus` raises the DR for debuff procs, matching the
 * `resolveEffectApplication` contract.
 */
export function applyProcOutcome(
    outcome: ProcRollOutcome,
    actor: Character | Enemy,
    actorEffects: ActiveEffect[],
    opponent: Character | Enemy,
    opponentEffects: ActiveEffect[],
    round: number,
    attackerHeartBonus = 0,
): {
    actorEffects: ActiveEffect[];
    opponentEffects: ActiveEffect[];
    appliedTo: 'self' | 'opponent';
    result: EffectApplicationResult;
} {
    const { trigger, effect, intensityBonus, durationBonus, appliedTo } = outcome;

    const intensityDelta = (trigger.intensityOverride ?? EFFECT_BASE_PROC_INTENSITY) + intensityBonus;
    const durationDelta  = (trigger.durationOverride  ?? effect.duration) + durationBonus;

    const targetCombatant = appliedTo === 'self' ? actor : opponent;
    const targetEffects   = appliedTo === 'self' ? actorEffects : opponentEffects;

    // First materialise the ActiveEffect via applyEffect so it has the right
    // intensity / duration / cached resist data, then run resolveEffectApplication
    // to resolve crit / fumble / rebound for tier 2 / 3.
    const { activeEffects: stagedEffects, result: stageResult } = applyEffect(
        targetEffects, effect, round,
        {
            intensityDelta,
            durationMode: 'additive',
            durationDelta,
            sourceId: actor.id,
        },
    );

    if (!stageResult.activeEffect) {
        // Stacking blocked it — return staged arrays untouched.
        if (appliedTo === 'self') {
            return { actorEffects: stagedEffects, opponentEffects, appliedTo, result: stageResult };
        }
        return { actorEffects, opponentEffects: stagedEffects, appliedTo, result: stageResult };
    }

    if (effect.tier === 1) {
        // Tier 1 auto-applies — `applyEffect` already finished the job.
        if (appliedTo === 'self') {
            return { actorEffects: stagedEffects, opponentEffects, appliedTo, result: stageResult };
        }
        return { actorEffects, opponentEffects: stagedEffects, appliedTo, result: stageResult };
    }

    const resolveResult = resolveEffectApplication(
        targetCombatant, stageResult.activeEffect, effect.type, attackerHeartBonus,
    );

    if (resolveResult.success && resolveResult.activeEffect) {
        // Replace the staged effect with the resolver-adjusted one (crit double intensity etc.).
        const finalised = stagedEffects.map(ae =>
            ae.effectId === effect.id ? resolveResult.activeEffect! : ae,
        );
        if (appliedTo === 'self') {
            return { actorEffects: finalised, opponentEffects, appliedTo, result: resolveResult };
        }
        return { actorEffects, opponentEffects: finalised, appliedTo, result: resolveResult };
    }

    // Fumble: revert the staged effect from the target.
    const reverted = stagedEffects.filter(ae => ae.effectId !== effect.id);

    if (appliedTo === 'self') {
        return { actorEffects: reverted, opponentEffects, appliedTo, result: resolveResult };
    }
    return { actorEffects, opponentEffects: reverted, appliedTo, result: resolveResult };
}

/**
 * Applies a fumble self-debuff to the actor. Mirrors `applyProcOutcome` for
 * the simpler "always lands on self" case — fumbles use Tier 1 auto-apply
 * semantics for predictable punishment.
 *
 * `actorId` (Phase 38) stamps `ActiveEffect.sourceId` so a self-fumble is
 * attributable to the combatant who fumbled. Optional for back-compat with
 * any caller that hasn't been threaded yet.
 */
export function applyFumbleOutcome(
    fumble: FumbleOutcome,
    actorEffects: ActiveEffect[],
    round: number,
    actorId?: string,
): { actorEffects: ActiveEffect[]; result: EffectApplicationResult } {
    const { activeEffects, result } = applyEffect(
        actorEffects, fumble.effect, round,
        actorId ? { sourceId: actorId } : undefined,
    );
    return { actorEffects: activeEffects, result };
}

/** Re-exported for tests / docs introspection. */
export const combatEffectsLibrary = TRIGGER_TABLE;
