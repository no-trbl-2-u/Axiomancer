/**
 * Effect System Types
 *
 * Effects are buffs and debuffs that modify combatant behaviour. The library
 * (./effects.library.ts) defines the catalogue; ActiveEffect tracks a runtime
 * instance attached to a combatant.
 */

import { Stance } from '../Combat/types';

/** Whether an effect helps (`buff`) or hinders (`debuff`) its bearer. */
export type EffectType = 'buff' | 'debuff';

/**
 * How repeated applications of the same effect interact:
 * - `none`      — only the strongest instance wins; reapplications are ignored.
 * - `intensity` — intensity increments (capped); duration resets or extends.
 * - `duration`  — base duration is added to the remaining duration.
 */
export type EffectStacking = 'none' | 'intensity' | 'duration';

/**
 * Tier of the effect, which determines how it is applied/resisted:
 * - 1 — auto-applies, no roll.
 * - 2 — opposed roll determines whether the effect lands.
 * - 3 — only a critical resist (nat 20) repels it.
 */
export type EffectTier = 1 | 2 | 3;

/** Thematic grouping for UI / library queries. */
export type EffectCategory =
    | 'stat' | 'damage' | 'defense' | 'control' | 'regeneration' | 'advantage';

/**
 * Stat target for an effect's modifiers: a base stat (`heart`/`body`/`mind`)
 * or any specific derived stat name.
 */
export type EffectStatTarget =
    | Stance
    | 'physicalAttack'  | 'physicalSkill' | 'physicalDefense' | 'physicalSave' | 'physicalTest'
    | 'mentalAttack'    | 'mentalSkill'   | 'mentalDefense'   | 'mentalSave'   | 'mentalTest'
    | 'emotionalAttack' | 'emotionalSkill'| 'emotionalDefense'| 'emotionalSave'| 'emotionalTest'
    | 'luck';

/** A single stat modifier applied by an effect's payload. */
export interface StatModifier {
    stat: EffectStatTarget;
    value: number;
    /** If true, `value` is a multiplier (1.5 = +50%); otherwise it's a flat delta. */
    isMultiplier?: boolean;
}

/** When in a round a DoT effect ticks. Different damage flavours feel different. */
export type DotTickPhase = 'start' | 'end';

/**
 * Damage dealt each round to the bearer. Total per tick = `damagePerRound × intensity`
 * and is dealt as raw HP loss — DoT bypasses `damageType`-keyed defense (Q5). The
 * `damageType` is informational today and reserved for future immunities.
 */
export interface DamageOverTime {
    damagePerRound: number;
    damageType: EffectStatTarget;
    /** Where in the round this DoT ticks. Defaults to `'start'`. */
    tickPhase?: DotTickPhase;
}

/** Health restored (positive) or drained (negative) at the start of each round. */
export interface RegenerationConfig {
    healthPerRound?: number;
}

/** Constraints on what actions the bearer may take. */
export interface ActionRestriction {
    forcedStance?: Stance;
    blockedStances?: Stance[];
    skipTurn?: boolean;
}

/** Auto-advantage / auto-disadvantage granted to the bearer. */
export interface AdvantageModifier {
    grantAdvantage?: Stance[];
    grantDisadvantage?: Stance[];
}

/**
 * Mechanical payload of an effect. Every field is optional; an effect may
 * combine several (e.g. a buff that grants stat bonuses AND a roll modifier).
 */
export interface EffectPayload {
    statModifiers?: StatModifier[];
    damageOverTime?: DamageOverTime;
    regeneration?: RegenerationConfig;
    actionRestriction?: ActionRestriction;
    advantageModifier?: AdvantageModifier;
    /** Flat bonus / penalty added to dice rolls. Does NOT scale with intensity. */
    rollModifier?: number;
    /** Roll modifier multiplied by the effect's current intensity. */
    rollModifierPerIntensity?: number;
    /** Flat bonus / penalty added to defense values. */
    defenseModifier?: number;
    /** Damage per intensity reflected back when the bearer is hit (thorns). */
    reflectDamage?: number;
    /**
     * VULNERABLE — outgoing-damage multiplier applied to HP the bearer TAKES.
     * `1` (or absent) is neutral; `1.5` means the bearer takes +50% from the
     * attacker's HP sources. Read by the HP-model combat engine
     * (`getDamageTakenMultiplier`) and aggregated additively across the bearer's
     * own payloads, then clamped to `VULNERABLE_MAX_MULT`. Inert in the legacy
     * resolver (it never reads this field), so existing exact-HP tests are
     * byte-identical. See the VULNERABLE epic (mechanics 0.34.0).
     */
    damageTakenMult?: number;
}

/**
 * A definition entry in the effects library.
 *
 * @property id          - Unique identifier used for lookups.
 * @property duration    - Base duration in rounds (-1 permanent, 0 instant).
 * @property tier        - Application/resist tier (1-3).
 * @property resistedBy  - Which stance resists this effect. Absent for tier 1.
 * @property resistDR    - Base difficulty for a resist roll. Absent for tier 1.
 * @property payload     - Mechanical modifiers applied to the bearer.
 */
export interface Effect {
    id: string;
    name: string;
    description: string;
    type: EffectType;
    category: EffectCategory;
    duration: number;
    stacking: EffectStacking;
    tier: EffectTier;
    payload: EffectPayload;
    resistedBy?: Stance;
    resistDR?: number;
    /**
     * Phase 44 — cross-link back to the originating
     * `PhilosophicalAlignmentCell.id` (kebab-case) for effects authored
     * from a fallacy in the 27-cell library. Optional; only set on
     * philosophy-sourced effects. See `docs/philosophy.md`.
     */
    sourcedFromCell?: string;
    /**
     * Content-provenance metadata used by the tuning `--focus` filter
     * (`src/Tuning/focus.parser.ts`). `addedIn` is an ISO date (`YYYY-MM-DD`)
     * or phase tag marking when the effect was authored; `tags` are freeform
     * labels. Both optional and ignored by the effects engine. Present in the
     * JSON library entries as plain fields.
     */
    addedIn?: string;
    tags?: string[];
}

/**
 * A live instance of an Effect attached to a combatant.
 *
 * @property effectId          - Lookup key into the effects library.
 * @property remainingDuration - Rounds left (-1 permanent).
 * @property intensity         - Current stack count for intensity-stacking effects.
 * @property appliedAt         - Combat round when the effect was first applied.
 * @property tier              - Cached from Effect for quick application logic.
 * @property resistedBy        - Cached from Effect for resist-roll lookups.
 * @property resistDR          - Cached from Effect for resist-roll lookups.
 * @property sourceId          - Optional ID of the combatant that applied it.
 */
export interface ActiveEffect {
    effectId: string;
    remainingDuration: number;
    intensity: number;
    appliedAt: number;
    tier: EffectTier;
    resistedBy?: Stance;
    resistDR?: number;
    sourceId?: string;
}

/**
 * Result of attempting to apply an effect.
 *
 * @property success     - True if the effect successfully landed on its intended target.
 * @property activeEffect - The resulting ActiveEffect (if produced).
 * @property message     - Human-readable description for battle logs.
 * @property stackedWith - Previous intensity/duration when reapplied.
 * @property roll        - Roll details, present only for Tier 2 buff effects (caster fumble/crit).
 */
export interface EffectApplicationResult {
    success: boolean;
    activeEffect?: ActiveEffect;
    message: string;
    stackedWith?: { previousIntensity: number; previousDuration: number };
    roll?: {
        rolled: number;
        resistStat: number;
        total: number;
        dr: number;
        wasCrit: boolean;
        wasFumble: boolean;
    };
}
