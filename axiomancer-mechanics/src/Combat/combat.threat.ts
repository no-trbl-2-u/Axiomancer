/**
 * Spec 25 — Hazard-Pattern Combat: enemy threat sequences (§4.4, §10).
 *
 * Each enemy fights as an authored *threat sequence* — 2-5 phases, revealed in
 * full at combat start (Hazard's full-information doctrine). HP MODEL: the enemy
 * executes its phase threat action EVERY phase (hitting the player), unless a
 * control status hinders it (`canAct`). There are no clear thresholds — the
 * player wins by dropping the enemy's HP to 0.
 *
 * An authored phase specifies the enemy's hidden stance (the RPS read), a threat
 * action (damage + optional debuff/heal), and a thematic stance tell. Threat
 * damage scales with level + difficulty, so the autonomous balance-tuning loop
 * can move enemy stats without re-authoring the sequences.
 */

import type { Enemy } from '../Enemy/types';
import type { Stance } from './types';
import type {
    CombatIntentType, CombatThreatAction, CombatThreatEffect, CombatThreatPhase,
} from './combat.encounter.types';
import { AUTHORED_THREAT_SEQUENCES } from './combat.threat-sequences';

/**
 * Authored phase template — DESIGN INTENT. The resolver (`resolveAuthored`)
 * computes the numeric clear thresholds (level + difficulty) and the threat-action
 * damage (level/difficulty budget × `damageWeight`) so the whole roster retunes
 * from a handful of constants without re-authoring 60+ enemies. Authoring lives in
 * `combat.threat-sequences.ts`.
 */
export interface AuthoredThreatPhase {
    enemyStance: Stance;
    /** Threat-action damage as a multiple of the level/difficulty budget (default 1.0). */
    damageWeight?: number;
    /** Optional player-debuff applied when this phase is Overwhelmed (telegraphed punish). */
    threatEffectId?: string;
    /** Intensity for `threatEffectId` (default 1). */
    threatIntensity?: number;
    /** Optional enemy self-heal on Overwhelm (a regenerating phase). */
    enemyHeal?: number;
    /** Threat description WITHOUT the damage number — the resolver appends "(+N damage[, Effect])". */
    actionText: string;
    isFinalPhase?: boolean;
    /** Spec 26b §2 — thematic tell implying this phase's hidden stance. */
    stanceHint?: string;
}

/**
 * Per-DIFFICULTY threat-damage multiplier (the win-rate-band lever, HP model).
 * Gives a boss real bite a same-level normal lacks; `simple` foes hit softly.
 * In the HP model the enemy attacks each phase, so its DIFFICULTY lives in its
 * tier + authored pattern + threat damage — there are no clear thresholds.
 */
const DIFFICULTY_MULT: Record<string, number> = {
    simple: 0.7, normal: 0.92, elite: 1.08, boss: 1.5, unique: 1.45,
};

/** Resolves an enemy's per-difficulty threat-damage multiplier (neutral fallback). */
function difficultyMult(enemy: Enemy): number {
    const d = (enemy as Enemy & { difficulty?: string }).difficulty;
    return (d !== undefined && DIFFICULTY_MULT[d] !== undefined) ? DIFFICULTY_MULT[d] : 1.0;
}

// ── Spec 26 §2 — intent derivation (the telegraph; stance stays hidden) ──────

/** True when a threat effect debuffs the player (any applied effectId does). */
function effectIsDebuff(eff: CombatThreatEffect): boolean {
    return !!eff.effectId;
}

/**
 * Derives the enemy's INTENT type from a threat action's effects (Spec 26 §2.2).
 * Damage + a debuff, or damage + self-heal, etc. → `combo`. Pure.
 */
export function deriveIntentType(effects: readonly CombatThreatEffect[]): CombatIntentType {
    const hasDamage = effects.some(e => (e.damage ?? 0) > 0);
    const hasDebuff = effects.some(effectIsDebuff);
    const hasBuff = effects.some(e => (e.enemyHeal ?? 0) > 0);
    const active = [hasDamage, hasDebuff, hasBuff].filter(Boolean).length;
    if (active === 0) return 'pass';
    if (active >= 2) return 'combo';
    if (hasDamage) return 'damage';
    if (hasDebuff) return 'debuff';
    return 'buff';
}

/** Stamps the derived intent (unless an explicit override is present). */
function withIntent(phase: CombatThreatPhase): CombatThreatPhase {
    return phase.intentType ? phase : { ...phase, intentType: deriveIntentType(phase.threatAction.effects) };
}

/** A generic per-stance thematic tell for unauthored enemies. */
const DEFAULT_STANCE_HINTS: Record<Stance, string> = {
    heart: 'Something raw and feeling drives it — it answers from the heart.',
    body: 'It carries itself like a brawler — force is its first language.',
    mind: 'A cold calculation moves behind its eyes — it thinks before it strikes.',
};

/** Picks an enemy's dominant base stat as its phase-1 stance (deterministic). */
function dominantStance(enemy: Enemy): Stance {
    const { heart, body, mind } = enemy.baseStats;
    if (body >= heart && body >= mind) return 'body';
    if (mind >= heart && mind >= body) return 'mind';
    return 'heart';
}

/** Rotates heart → body → mind so each phase reads a different stance. */
const STANCE_CYCLE: Stance[] = ['heart', 'body', 'mind'];
function rotateStance(from: Stance, steps: number): Stance {
    const i = STANCE_CYCLE.indexOf(from);
    return STANCE_CYCLE[(i + steps) % STANCE_CYCLE.length];
}

/**
 * Threat-damage budget for an Overwhelmed phase (hazard-combat pass). Anchored to
 * LEVEL + DIFFICULTY, not the enemy's legacy attack stat — the old `atk × scale`
 * model produced ~180 dmg/phase at L50 (instant death) and ~4 at L2 (no bite),
 * because the legacy attack curve is far steeper than HP. As a consistent ~%-of-
 * player-HP punish it keeps a missed clear meaningful at every level. Authored
 * sequences set their own damage; this only backs the generator fallback.
 */
const THREAT_BASE = 4;
const THREAT_PER_LEVEL = 0.95;

/** Damage an Overwhelmed phase deals: a level/difficulty budget × the phase's
 *  authored `damageWeight`. Shared by authored sequences and the generator. */
function threatDamageBudget(level: number, dMult: number, phaseIndex: number, weight = 1): number {
    return Math.max(3, Math.round(
        (THREAT_BASE + THREAT_PER_LEVEL * Math.max(1, level)) * dMult * (1 + 0.2 * phaseIndex) * weight,
    ));
}

/** A short human label for a telegraphed debuff id (e.g. `debuff_fear` → "Fear"). */
function effectLabel(effectId: string): string {
    return effectId.replace(/^debuff_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/** Builds a `CombatThreatAction` from authored intent + the computed damage. */
function buildThreatAction(
    actionText: string, damage: number, effectId?: string, intensity?: number, enemyHeal?: number,
): CombatThreatAction {
    const effects: CombatThreatEffect[] = [];
    if (damage > 0) effects.push({ damage });
    if (effectId) effects.push({ effectId, intensity: intensity ?? 1 });
    if (enemyHeal && enemyHeal > 0) effects.push({ enemyHeal });
    const parts = [`+${damage} damage`];
    if (effectId) parts.push(effectLabel(effectId));
    if (enemyHeal && enemyHeal > 0) parts.push(`heals ${enemyHeal}`);
    return { description: `${actionText} (${parts.join(', ')}).`, effects };
}

/** A level/difficulty-scaled threat action for an unauthored enemy. */
function defaultThreatAction(enemy: Enemy, phaseIndex: number): CombatThreatAction {
    const damage = threatDamageBudget(enemy.level, difficultyMult(enemy), phaseIndex);
    const verb = phaseIndex === 0 ? 'presses the attack' : 'escalates';
    return buildThreatAction(`${enemy.name} ${verb}`, damage);
}

/** Ids that carry an authored threat sequence. */
export const AUTHORED_THREAT_ENEMY_IDS: readonly string[] = Object.freeze(Object.keys(AUTHORED_THREAT_SEQUENCES));

/** Enemy-level fallback tell (from the Enemy record), if authored. */
function enemyStanceHint(enemy: Enemy): string | undefined {
    return (enemy as Enemy & { stanceHint?: string }).stanceHint;
}

function resolveAuthored(enemy: Enemy, authored: AuthoredThreatPhase[]): CombatThreatPhase[] {
    const level = Math.max(1, enemy.level);
    const dMult = difficultyMult(enemy);
    return authored.map((p, i) => {
        const damage = threatDamageBudget(level, dMult, i, p.damageWeight ?? 1);
        return withIntent({
            index: i + 1,
            enemyStance: p.enemyStance,
            threatAction: buildThreatAction(p.actionText, damage, p.threatEffectId, p.threatIntensity, p.enemyHeal),
            isFinalPhase: p.isFinalPhase ?? i === authored.length - 1,
            stanceHint: p.stanceHint ?? enemyStanceHint(enemy) ?? DEFAULT_STANCE_HINTS[p.enemyStance],
        });
    });
}

/** Generates a default 3-phase escalating sequence for an unauthored enemy (§10). */
export function generateDefaultThreatSequence(enemy: Enemy): CombatThreatPhase[] {
    const base = dominantStance(enemy);
    const PHASES = 3;
    return Array.from({ length: PHASES }, (_unused, i) => {
        const enemyStance = rotateStance(base, i);
        return withIntent({
            index: i + 1,
            enemyStance,
            threatAction: defaultThreatAction(enemy, i),
            isFinalPhase: i === PHASES - 1,
            stanceHint: enemyStanceHint(enemy) ?? DEFAULT_STANCE_HINTS[enemyStance],
        });
    });
}

/**
 * Returns the enemy's threat sequence: an explicit `enemy.threatSequence` wins;
 * otherwise an authored sequence keyed by id; otherwise the generated default.
 */
export function getThreatSequence(enemy: Enemy): CombatThreatPhase[] {
    const explicit = (enemy as Enemy & { threatSequence?: CombatThreatPhase[] }).threatSequence;
    if (explicit && explicit.length > 0) {
        return explicit.map(p => withIntent({
            ...p,
            stanceHint: p.stanceHint ?? enemyStanceHint(enemy) ?? DEFAULT_STANCE_HINTS[p.enemyStance],
        }));
    }
    const authored = AUTHORED_THREAT_SEQUENCES[enemy.id];
    if (authored) return resolveAuthored(enemy, authored);
    return generateDefaultThreatSequence(enemy);
}
