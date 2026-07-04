/**
 * Skills System Types — Master Spec §3.
 *
 * IMPORTANT distinction (per the locked product-owner decision): Skills are
 * NOT cards. Cards are what's in the deck and drawn/played (`../Cards`).
 * Skills are a separate, always-available ability system the player can
 * trigger mid-combat by SPENDING accumulated tokens — independent of the
 * current hand. This file intentionally does not import anything from
 * `../Cards` other than the shared `CombatResources` token shape and the
 * `StatType` aspect enum; a `Card`/`CombatCard` never appears here.
 *
 * Token substrate is unified (Master Spec §0.1): `CombatResources`
 * (heart/body/mind/fallacy/paradox) is the ONLY token currency. No separate
 * "skill token" is introduced — skills spend from the same pool that cards
 * generate via `generateStanceToken` / `generateFallacyParadoxToken` and the
 * §2.6 bonus-token card grants.
 *
 * This file is TYPE SCAFFOLDING for a later content stage — see
 * `skills.library.ts` (empty registry) and `skill-trigger.engine.ts` (hook
 * points, no resolution logic yet).
 */

import type { CombatResources, StatType } from '../Cards/types';

/**
 * Resource cost to trigger a skill. A `Partial<CombatResources>` — only the
 * resources actually spent need a key; absent keys cost 0.
 */
export type SkillCost = Partial<CombatResources>;

/**
 * What a skill DOES when triggered. A discriminated union so the trigger
 * engine / combat engine can dispatch on `kind` without runtime tag parsing
 * (mirrors `CardSpecialMechanic` in `../Cards/types`).
 *
 * - `apply_effect`         — routes through the existing `Effects/effects.library.ts`
 *   → `resolveEffectApplication` pipeline unchanged (Master Spec §3.4).
 * - `consume_bank_burst`   — zeroes (or partially drains) one `CombatResources`
 *   pool for a scaled burst. Combat-engine owned (mirrors card `rupture`/
 *   `compound`), same pattern as `CardSpecialMechanic`.
 * - `detonate_stacks`      — the doctrine execute/finisher payoff for Skills:
 *   requires at least `minDistinctDebuffs` distinct debuffs on the target,
 *   consumes them for `perDebuffPct` HP each. Combat-engine owned.
 * - `grant_barrier`        — adds to the player's persistent damage soak
 *   (`CombatEncounterState.barrier`). Combat-engine owned.
 * - `cleanse_self`         — removes `count` active effects from the caster,
 *   optionally filtered to `category` (e.g. only debuffs).
 * - `strip_enemy_buff`     — removes `count` random buffs from the enemy.
 */
export type SkillEffect =
    | { kind: 'apply_effect'; effectId: string; target: 'self' | 'enemy'; intensity?: number }
    | { kind: 'consume_bank_burst'; resource: keyof CombatResources; pctPerToken: number }
    | { kind: 'detonate_stacks'; minDistinctDebuffs: number; perDebuffPct: number }
    | { kind: 'grant_barrier'; amount: number }
    | { kind: 'cleanse_self'; count: number; category?: 'debuff' }
    | { kind: 'strip_enemy_buff'; count: number };

/** How often a skill may be triggered within a single combat. Absent = no
 *  limit beyond affordability. */
export type SkillLimit =
    | { kind: 'once_per_combat' }
    | { kind: 'cooldown'; rounds: number };

/**
 * A skill definition — the CATALOGUE entry (distinct from a player's
 * currently-known skills; see `known-skills.ts`). `requiresUnlock` is the
 * gating seam: `null` means available to everyone today. Down the line this
 * will be populated with a race/class/equipment requirement id WITHOUT
 * changing this shape — `getKnownSkills()` is the only place that needs to
 * grow a real gate check.
 */
export interface SkillDefinition {
    id: string;
    name: string;
    description: string;
    /** Philosophical aspect alignment, or `'mixed'` for tri-cost / cross-aspect
     *  skills (e.g. Unfalsifiable Ward's body+mind+heart cost). */
    aspect: StatType | 'mixed';
    cost: SkillCost;
    effect: SkillEffect;
    limit?: SkillLimit;
    /** `null` = available to everyone today (no gating implemented yet). A
     *  future race/class/equipment requirement id goes here without a rewrite. */
    requiresUnlock: string | null;
}
