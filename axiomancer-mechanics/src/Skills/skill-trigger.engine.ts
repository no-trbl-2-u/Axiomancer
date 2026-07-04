/**
 * Skill Trigger Engine — Master Spec §3.4.
 *
 * Wires skill triggering to the existing `CombatResources` token economy
 * (Master Spec §0.1 — the ONLY token currency, no new "skill token").
 *
 * Trigger channel (§3.4): skills are NOT a `CombatAction`. `Combat/combat.engine.ts`
 * exposes `triggerCombatSkill`, a transition function processed independent of
 * (and before) the round's `CombatAction` resolution — token bank is the sole
 * gate, no turn-budget interaction.
 *
 * Resolution split (§3.4):
 *   - `apply_effect` / `cleanse_self` / `strip_enemy_buff` are resolved HERE,
 *     purely against `ActiveEffect[]` arrays, reusing the existing
 *     `Effects/index.ts` (`applyEffect`, `lookupEffect`) and
 *     `Combat/resist.ts` (`resolveEffectApplication`) machinery unchanged —
 *     no duplicated effect-application logic.
 *   - `consume_bank_burst` / `detonate_stacks` / `grant_barrier` are
 *     combat-engine-owned (mirror card `rupture`/`compound`/`barrier`): they
 *     touch enemy max HP and `CombatEncounterState.barrier`, state this module
 *     deliberately does not depend on (mirrors the independence of `Effects`/
 *     `Cards` from `Combat`'s encounter state). This function returns an
 *     `engineHandoff` descriptor with everything `combat.engine.ts` needs to
 *     finish the job.
 */

import type { CombatResources } from '../Cards/types';
import type { Combatant } from '../Combat/types';
import { resolveEffectApplication } from '../Combat/resist';
import { applyEffect, lookupEffect } from '../Effects';
import type { ActiveEffect, Effect } from '../Effects/types';
import type { SkillDefinition, SkillCost, SkillEffect } from './skills.types';

/**
 * Minimal context a combat-engine caller supplies when triggering a skill:
 * the caster's and enemy's current effect arrays (so this module never needs
 * a full `Character`/`Enemy`/`CombatEncounterState`), plus the round number
 * effects need for their `appliedAt` stamp.
 */
export interface SkillTriggerContext {
    round: number;
    casterEffects: ActiveEffect[];
    enemyEffects: ActiveEffect[];
}

/**
 * Combat-engine-owned follow-up work. Present only when `def.effect.kind` is
 * one of the three kinds that needs live HP/barrier state this module doesn't
 * have; `null` once this function has already fully resolved the effect.
 */
export type SkillEngineHandoff =
    | { kind: 'consume_bank_burst'; resource: keyof CombatResources; tokensBurned: number; pctPerToken: number }
    | { kind: 'detonate_stacks'; minDistinctDebuffs: number; perDebuffPct: number }
    | { kind: 'grant_barrier'; amount: number };

/** Result of a skill trigger. */
export interface SkillTriggerResult {
    /** How the token pool changed (negative values — tokens spent/burned). */
    resourceDelta: Partial<CombatResources>;
    /** Updated caster effect array (unchanged reference if nothing changed). */
    casterEffects: ActiveEffect[];
    /** Updated enemy effect array (unchanged reference if nothing changed). */
    enemyEffects: ActiveEffect[];
    /** Whether the mechanical effect actually took hold (a Tier-2 buff can
     *  fumble; a cleanse/strip can find nothing eligible). */
    landed: boolean;
    message: string;
    engineHandoff: SkillEngineHandoff | null;
}

/**
 * True when `resources` can cover every line item in `cost` (no partial
 * spends). Pure — does not mutate `resources`.
 */
export function canAffordSkill(resources: CombatResources, cost: SkillCost): boolean {
    return (Object.keys(cost) as (keyof CombatResources)[]).every(
        key => resources[key] >= (cost[key] ?? 0),
    );
}

/** Subtracts `cost` from `resources`, clamped at 0. Pure — returns a new object. */
export function spendSkillCost(resources: CombatResources, cost: SkillCost): CombatResources {
    const next = { ...resources };
    (Object.keys(cost) as (keyof CombatResources)[]).forEach(key => {
        next[key] = Math.max(0, next[key] - (cost[key] ?? 0));
    });
    return next;
}

/**
 * `resolveEffectApplication`'s `target: Combatant` parameter is unused by
 * every current branch (Phase 80 removed target-side resist entirely — only
 * Tier-2 BUFFS still roll, and that roll is caster-side fumble/crit, not a
 * function of the target at all). This stub lets Skills reuse the resolver
 * without depending on a full `Character`/`Enemy` instance, matching this
 * module's deliberate decoupling from `Combat`'s encounter state.
 */
const RESIST_TARGET_STUB = {} as unknown as Combatant;

/**
 * Lands a single effect application onto `targetArr`. Tier 1 (auto), Tier 2
 * debuffs, and Tier 3 always land (Phase 80 doctrine — see `Combat/resist.ts`);
 * only a Tier 2 BUFF rolls for caster-side fumble/crit via the shared resolver.
 */
function landSkillEffect(
    targetArr: ActiveEffect[],
    effectId: string,
    round: number,
    intensity: number | undefined,
    sourceId: string,
): { effects: ActiveEffect[]; landed: boolean; message: string; effect?: Effect } {
    const effect = lookupEffect(effectId);
    if (!effect) {
        return { effects: targetArr, landed: false, message: `Unknown effect id "${effectId}".` };
    }

    if (effect.type === 'buff' && effect.tier === 2) {
        const trial: ActiveEffect = {
            effectId: effect.id,
            remainingDuration: effect.duration,
            intensity: intensity ?? 1,
            appliedAt: round,
            tier: effect.tier,
            resistedBy: effect.resistedBy,
            resistDR: effect.resistDR,
            sourceId,
        };
        const resolved = resolveEffectApplication(RESIST_TARGET_STUB, trial, effect.type);
        if (!resolved.success || !resolved.activeEffect) {
            return { effects: targetArr, landed: false, message: resolved.message, effect };
        }
        const applied = applyEffect(targetArr, effect, round, {
            intensityDelta: resolved.activeEffect.intensity, sourceId,
        });
        return { effects: applied.activeEffects, landed: true, message: resolved.message, effect };
    }

    // Tier 1 (auto), Tier 2 debuff, Tier 3 — always land.
    const applied = applyEffect(targetArr, effect, round, { intensityDelta: intensity ?? 1, sourceId });
    return { effects: applied.activeEffects, landed: true, message: `${effect.name} applied.`, effect };
}

/** Removes up to `count` effects from `effects`, optionally filtered to
 *  `category === 'debuff'`. Deterministic (first-eligible order) — Skills
 *  stays rng-free; a future stage can thread an rng in if variety is wanted. */
function cleanseEffects(
    effects: ActiveEffect[],
    count: number,
    category?: 'debuff',
): { effects: ActiveEffect[]; removedIds: string[] } {
    const eligible = effects.filter(ae => {
        if (!category) return true;
        return lookupEffect(ae.effectId)?.type === 'debuff';
    }).slice(0, count);
    const removedIds = eligible.map(ae => ae.effectId);
    return { effects: effects.filter(ae => !eligible.includes(ae)), removedIds };
}

/** Removes up to `count` BUFF effects from `effects` (enemy-targeted strip). */
function stripBuffs(
    effects: ActiveEffect[],
    count: number,
): { effects: ActiveEffect[]; removedIds: string[] } {
    const buffs = effects.filter(ae => lookupEffect(ae.effectId)?.type === 'buff').slice(0, count);
    const removedIds = buffs.map(ae => ae.effectId);
    return { effects: effects.filter(ae => !buffs.includes(ae)), removedIds };
}

/**
 * Trigger hook point (Master Spec §3.4). Spends the skill's cost from
 * `resources`, resolves its `SkillEffect`, and returns everything the caller
 * needs to fold back into live combat state. Callers MUST check
 * `canAffordSkill` (and any `SkillLimit`) first; this function does not
 * re-validate affordability or cooldowns — that bookkeeping lives with
 * whatever holds per-encounter state (`Combat/combat.engine.ts`).
 */
export function triggerSkill(
    context: SkillTriggerContext,
    resources: CombatResources,
    def: SkillDefinition,
): SkillTriggerResult {
    const spent = spendSkillCost(resources, def.cost);
    const resourceDelta: Partial<CombatResources> = {};
    (Object.keys(def.cost) as (keyof CombatResources)[]).forEach(key => {
        resourceDelta[key] = spent[key] - resources[key];
    });

    let casterEffects = context.casterEffects;
    let enemyEffects = context.enemyEffects;
    let landed = true;
    let message = `${def.name} triggered.`;
    let engineHandoff: SkillEngineHandoff | null = null;

    const effect: SkillEffect = def.effect;
    switch (effect.kind) {
        case 'apply_effect': {
            const targetArr = effect.target === 'self' ? casterEffects : enemyEffects;
            const outcome = landSkillEffect(targetArr, effect.effectId, context.round, effect.intensity, def.id);
            if (effect.target === 'self') casterEffects = outcome.effects; else enemyEffects = outcome.effects;
            landed = outcome.landed;
            message = outcome.message;
            break;
        }
        case 'cleanse_self': {
            const outcome = cleanseEffects(casterEffects, effect.count, effect.category);
            casterEffects = outcome.effects;
            landed = outcome.removedIds.length > 0;
            message = landed
                ? `${def.name}: cleansed ${outcome.removedIds.join(', ')}.`
                : `${def.name}: nothing eligible to cleanse.`;
            break;
        }
        case 'strip_enemy_buff': {
            const outcome = stripBuffs(enemyEffects, effect.count);
            enemyEffects = outcome.effects;
            landed = outcome.removedIds.length > 0;
            message = landed
                ? `${def.name}: stripped ${outcome.removedIds.join(', ')}.`
                : `${def.name}: no enemy buff to strip.`;
            break;
        }
        case 'consume_bank_burst': {
            const resourceKey = effect.resource;
            const tokensBurned = spent[resourceKey];
            resourceDelta[resourceKey] = (resourceDelta[resourceKey] ?? 0) - tokensBurned;
            landed = tokensBurned > 0;
            message = `${def.name}: banking ${tokensBurned} ${resourceKey} token(s) into a burst.`;
            engineHandoff = {
                kind: 'consume_bank_burst', resource: resourceKey, tokensBurned, pctPerToken: effect.pctPerToken,
            };
            break;
        }
        case 'detonate_stacks': {
            message = `${def.name}: attempting to detonate stacked debuffs.`;
            engineHandoff = {
                kind: 'detonate_stacks',
                minDistinctDebuffs: effect.minDistinctDebuffs,
                perDebuffPct: effect.perDebuffPct,
            };
            break;
        }
        case 'grant_barrier': {
            message = `${def.name}: raising a barrier.`;
            engineHandoff = { kind: 'grant_barrier', amount: effect.amount };
            break;
        }
        default: {
            const exhaustive: never = effect;
            void exhaustive;
        }
    }

    return { resourceDelta, casterEffects, enemyEffects, landed, message, engineHandoff };
}
