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
import { lookupEffect } from '../Effects/effects.library';
import type { Stance } from './types';
import type {
    CombatIntentType, CombatThreatAction, CombatThreatBranchOutcome, CombatThreatEffect,
    CombatThreatPhase, ThreatBranchCondition,
} from './combat.encounter.types';
import { AUTHORED_THREAT_SEQUENCES } from './combat.threat-sequences';

export type { ThreatBranchCondition } from './combat.encounter.types';

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
    /** Phase 33b — enemy sheds up to this many of its OWN afflictions on
     *  Overwhelm (the CAUTERIZE archetype: a fraction, never the last —
     *  enforced again at resolution in the engine). Previously only
     *  reachable via the WS9 `bearer-afflictions-gte` branch's implicit
     *  reactive cleanse; now directly authorable on any phase, linear or
     *  branch. An explicit value here wins over that implicit fallback. */
    enemyCleanse?: number;
    /** Phase 33a/33b — sheds this much of the player's live SWAY value on
     *  Overwhelm (the SWAY-cleanse archetype: enemy counterplay against the
     *  charm/grace CAPITULATE track). Flat amount, floored at 0; never
     *  touches the one-way milestone-fired flags. */
    swayCleanse?: number;
    /** Phase 33a/33b — sheds this much of the player's spendable Premise
     *  tally on Overwhelm (the Premise-shed archetype: enemy counterplay
     *  against the oratory/peroration CONCEDE track). Flat amount, floored
     *  at 0; never touches the lifetime `premisesThisCombat` counter. */
    premiseShed?: number;
    /** Threat description WITHOUT the damage number — the resolver appends "(+N damage[, Effect])". */
    actionText: string;
    isFinalPhase?: boolean;
    /** Spec 26b §2 — thematic tell implying this phase's hidden stance. */
    stanceHint?: string;
    /** Phase 3 — "rage mode": locks this phase until the resolving round
     *  reaches it (see `CombatThreatPhase.unlockAfterRound`). Undefined on
     *  every authored sequence today — none is gated yet. */
    unlockAfterRound?: number;
    /** Phase 33b — variable-rung telegraph: this phase's authored STAGGER-rung
     *  count (1-4). Undefined = the enemy's natural (difficulty-derived) flat
     *  default (`THREAT_RUNGS`/`THREAT_RUNGS_BOSS`). */
    rungs?: number;
    /** Phase D9 (spec 33 §2) — the open stance check this phase telegraphs.
     *  `punishes: X` → ending the phase in stance X takes the hit at ×1.5;
     *  `yields: X` → ending in X blunts it ×0.5 AND pays +1◆. Both optional and
     *  independent (a boss may name one of each, across different phases, to
     *  satisfy the §2 "two stances" boss law). Undefined = no authored check —
     *  `getThreatSequence`'s backfill (`defaultStanceCheck`) fills the uniform
     *  D6e default instead; an authored value here always wins. Only resolved
     *  while the upgradeable-dice flag is on (`resolveStanceCheck`); inert
     *  otherwise, so authoring it never disturbs the flag-off baseline. */
    stanceCheck?: { punishes?: Stance; yields?: Stance };
    /** Phase 33c (spec 33 §1) — THE COVETED DIE: authored on exactly one
     *  phase (the 2nd authored step) of every BOSS/UNIQUE sequence, never on
     *  elite/normal/simple, never via backfill. Undefined = no coveted die on
     *  this phase (the common case). */
    stake?: boolean;
}

// ── WS9 (spec 32 §12 item 7, Ratified 2026-07-11) — conditional threat branches ──

/**
 * A BRANCH step: one authored phase slot holding a condition and two fully
 * authored forks. `AuthoredThreatPhase` itself is UNCHANGED (ratified) — the
 * branch is a parallel wrapper. Closed condition union, authored data only,
 * zero RNG: the fork commits from observable state at phase START.
 */
export interface AuthoredThreatBranch {
    branch: {
        condition: ThreatBranchCondition;
        then: AuthoredThreatPhase;
        else: AuthoredThreatPhase;
    };
}

/** One slot of an authored sequence: a linear phase or a branch node. */
export type AuthoredThreatStep = AuthoredThreatPhase | AuthoredThreatBranch;

/** Narrows an authored step to the branch wrapper. */
export function isBranchStep(step: AuthoredThreatStep): step is AuthoredThreatBranch {
    return 'branch' in step;
}

/** Flattens steps to plain phases (branch steps contribute BOTH forks) — the
 *  lens the roster-validation e2es read authored intent through. */
export function flattenAuthoredSteps(steps: readonly AuthoredThreatStep[]): AuthoredThreatPhase[] {
    return steps.flatMap(s => (isBranchStep(s) ? [s.branch.then, s.branch.else] : [s]));
}

/** Human text for a branch condition (the telegraph's "why"). */
export function describeThreatBranchCondition(condition: ThreatBranchCondition): string {
    switch (condition.kind) {
        case 'bearer-afflictions-gte': return `if it carries ${condition.n}+ afflictions`;
        case 'prior-threat-fully-blocked': return 'if its last threat was fully blocked';
    }
}

/**
 * Evaluates a branch condition against phase-START state. Pure and RNG-free:
 * affliction count is the enemy's live debuff instances; the full-block read
 * is the `lastThreatFullyBlocked` combat ledger (spec 32 §12 item 4).
 */
export function evaluateThreatBranchCondition(
    condition: ThreatBranchCondition,
    enemy: Enemy,
    lastThreatFullyBlocked: boolean,
): boolean {
    switch (condition.kind) {
        case 'bearer-afflictions-gte':
            return enemy.effects.filter(ae => lookupEffect(ae.effectId)?.type === 'debuff').length >= condition.n;
        case 'prior-threat-fully-blocked':
            return lastThreatFullyBlocked;
    }
}

/**
 * Commits a branch phase's fork at phase START: evaluates the condition on
 * live state, copies the taken fork onto the phase's face and stamps
 * `branch.taken` (the telegraph then shows the taken fork AND the condition).
 * Returns null when `phases[index]` carries no branch. Re-entering a branch
 * phase (a looping final phase) re-evaluates — each entry is a fresh START.
 */
export function commitThreatBranch(
    phases: readonly CombatThreatPhase[],
    index: number,
    enemy: Enemy,
    lastThreatFullyBlocked: boolean,
): { phases: CombatThreatPhase[]; taken: 'then' | 'else'; conditionText: string } | null {
    const phase = phases[index];
    if (!phase?.branch) return null;
    const taken: 'then' | 'else' =
        evaluateThreatBranchCondition(phase.branch.condition, enemy, lastThreatFullyBlocked) ? 'then' : 'else';
    const outcome = taken === 'then' ? phase.branch.then : phase.branch.else;
    const committed: CombatThreatPhase = {
        ...phase,
        enemyStance: outcome.enemyStance,
        threatAction: outcome.threatAction,
        intentType: outcome.intentType,
        stanceHint: outcome.stanceHint,
        stanceCheck: outcome.stanceCheck,
        stake: outcome.stake,
        branch: { ...phase.branch, taken },
    };
    return {
        phases: phases.map((p, i) => (i === index ? committed : p)),
        taken,
        conditionText: phase.branch.conditionText,
    };
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

/** True when a threat effect debuffs the player (an applied effectId, or
 *  Phase 33a's counterplay hooks stripping the player's SWAY/Premise
 *  win-progress). */
function effectIsDebuff(eff: CombatThreatEffect): boolean {
    return !!eff.effectId || (eff.swayCleanse ?? 0) > 0 || (eff.premiseShed ?? 0) > 0;
}

/**
 * Derives the enemy's INTENT type from a threat action's effects (Spec 26 §2.2).
 * Damage + a debuff, or damage + self-heal, etc. → `combo`. Pure.
 */
export function deriveIntentType(effects: readonly CombatThreatEffect[]): CombatIntentType {
    const hasDamage = effects.some(e => (e.damage ?? 0) > 0);
    // Phase 33a correction: `enemyCleanse` used to read as self-serving
    // (buff) below, but shedding its OWN afflictions erases the player's
    // invested DoT work — that's counterplay against the player, not a
    // benign self-buff, so it now counts toward `hasDebuff` alongside the
    // two new hooks (`effectIsDebuff` already covers those). Only a bare
    // self-heal still reads as `buff`.
    const hasDebuff = effects.some(e => effectIsDebuff(e) || (e.enemyCleanse ?? 0) > 0);
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

/** A short human label for a telegraphed debuff id (e.g. `debuff_bleed` → "Bleed"). */
function effectLabel(effectId: string): string {
    return effectId.replace(/^debuff_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/** Phase 33b — the non-damage/non-debuff riders a threat action can carry. */
interface ThreatActionRiders {
    enemyHeal?: number;
    enemyCleanse?: number;
    swayCleanse?: number;
    premiseShed?: number;
}

/** Builds a `CombatThreatAction` from authored intent + the computed damage. */
function buildThreatAction(
    actionText: string, damage: number, effectId?: string, intensity?: number,
    riders?: ThreatActionRiders,
): CombatThreatAction {
    const { enemyHeal, enemyCleanse, swayCleanse, premiseShed } = riders ?? {};
    const effects: CombatThreatEffect[] = [];
    if (damage > 0) effects.push({ damage });
    if (effectId) effects.push({ effectId, intensity: intensity ?? 1 });
    if (enemyHeal && enemyHeal > 0) effects.push({ enemyHeal });
    if (enemyCleanse && enemyCleanse > 0) effects.push({ enemyCleanse });
    if (swayCleanse && swayCleanse > 0) effects.push({ swayCleanse });
    if (premiseShed && premiseShed > 0) effects.push({ premiseShed });
    const parts = [`+${damage} damage`];
    if (effectId) parts.push(effectLabel(effectId));
    if (enemyHeal && enemyHeal > 0) parts.push(`heals ${enemyHeal}`);
    if (enemyCleanse && enemyCleanse > 0) {
        parts.push(`sheds ${enemyCleanse} affliction${enemyCleanse === 1 ? '' : 's'}`);
    }
    if (swayCleanse && swayCleanse > 0) parts.push(`steadies ${swayCleanse} resolve`);
    if (premiseShed && premiseShed > 0) {
        parts.push(`unravels ${premiseShed} premise${premiseShed === 1 ? '' : 's'}`);
    }
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

/** Resolves one authored fork into a branch outcome (level/difficulty scaled).
 *  `implicitCleanse` is the WS9 afflictions-gte branch's legacy reactive
 *  cleanse (`resolveAuthored` below) — an explicit `p.enemyCleanse` wins. */
function resolveBranchOutcome(
    enemy: Enemy, p: AuthoredThreatPhase, phaseIndex: number, level: number, dMult: number,
    implicitCleanse?: number,
): CombatThreatBranchOutcome {
    const damage = threatDamageBudget(level, dMult, phaseIndex, p.damageWeight ?? 1);
    const threatAction = buildThreatAction(p.actionText, damage, p.threatEffectId, p.threatIntensity, {
        enemyHeal: p.enemyHeal,
        enemyCleanse: p.enemyCleanse ?? implicitCleanse,
        swayCleanse: p.swayCleanse,
        premiseShed: p.premiseShed,
    });
    return {
        enemyStance: p.enemyStance,
        threatAction,
        intentType: deriveIntentType(threatAction.effects),
        stanceHint: p.stanceHint ?? enemyStanceHint(enemy) ?? DEFAULT_STANCE_HINTS[p.enemyStance],
        rungs: p.rungs,
        stanceCheck: p.stanceCheck,
        stake: p.stake,
    };
}

function resolveAuthored(enemy: Enemy, authored: AuthoredThreatStep[]): CombatThreatPhase[] {
    const level = Math.max(1, enemy.level);
    const dMult = difficultyMult(enemy);
    return authored.map((step, i) => {
        if (isBranchStep(step)) {
            const { condition } = step.branch;
            // Phase 33's first reactive verb: the THEN fork of an
            // affliction-count branch carries the spec-29 cleanse — the enemy
            // answers being stacked by shedding ONE affliction (a fraction,
            // never a wipe; enforced again at resolution in the engine).
            const reactiveCleanse = condition.kind === 'bearer-afflictions-gte' ? 1 : undefined;
            const thenOutcome = resolveBranchOutcome(enemy, step.branch.then, i, level, dMult, reactiveCleanse);
            const elseOutcome = resolveBranchOutcome(enemy, step.branch.else, i, level, dMult);
            // Pending face = the ELSE (baseline) fork; `commitThreatBranch`
            // swaps the taken fork in at phase START.
            return {
                index: i + 1,
                ...elseOutcome,
                isFinalPhase: step.branch.else.isFinalPhase ?? i === authored.length - 1,
                unlockAfterRound: step.branch.else.unlockAfterRound,
                branch: {
                    condition,
                    conditionText: describeThreatBranchCondition(condition),
                    then: thenOutcome,
                    else: elseOutcome,
                },
            };
        }
        const p = step;
        const damage = threatDamageBudget(level, dMult, i, p.damageWeight ?? 1);
        return withIntent({
            index: i + 1,
            enemyStance: p.enemyStance,
            threatAction: buildThreatAction(p.actionText, damage, p.threatEffectId, p.threatIntensity, {
                enemyHeal: p.enemyHeal, enemyCleanse: p.enemyCleanse,
                swayCleanse: p.swayCleanse, premiseShed: p.premiseShed,
            }),
            isFinalPhase: p.isFinalPhase ?? i === authored.length - 1,
            stanceHint: p.stanceHint ?? enemyStanceHint(enemy) ?? DEFAULT_STANCE_HINTS[p.enemyStance],
            unlockAfterRound: p.unlockAfterRound,
            rungs: p.rungs,
            stanceCheck: p.stanceCheck,
            stake: p.stake,
        });
    });
}

/**
 * Phase 3 — "rage mode": the generated (unauthored) sequence's appended
 * escalation phase. Locked until `RAGE_UNLOCK_ROUND` — a discrete,
 * qualitative step layered on top of THE CLOCK's continuous numeric
 * escalation (`THREAT_ESCALATION_*`, `combat.engine.ts`), which already
 * saturates a few rounds past its grace window. Harder-hitting AND
 * self-healing (reusing the existing `enemyHeal` rider) so it specifically
 * punishes slow, non-status attrition — locked-in DoT keeps ticking
 * regardless, but a fight won by trading basic strikes gets partially
 * healed back.
 */
export const RAGE_UNLOCK_ROUND = 6;
export const RAGE_DAMAGE_WEIGHT = 1.6;
export const RAGE_HEAL_FRACTION = 0.5;

/**
 * Spec 33 §2 (Upgradeable Dice) — the first-batch open stance-check telegraph
 * (Phase D6e, draining D3-F2). The enemy PUNISHES being met head-on in its own
 * stance (the hit lands at ×1.5) and YIELDS to being answered from the momentum
 * chain's SUCCESSOR color (heart→body→mind, via `rotateStance(s, 1)`; the hit is
 * blunted ×0.5 and pays +1◆) — so the telegraph teaches the chain: don't mirror
 * the enemy, flow past it. Because `enemyStance` rotates across the fight, all
 * three stances appear as `yields` in turn, so a mono-color build faces 1–2
 * off-color checks per fight (§2 authoring law). Wholly inert while the flag is
 * off (`resolveThreatPhase` gates its resolution on `isUpgradeableDiceEnabled`).
 * Density (every phase) + payout (+1◆) are D7 dials — this is the uniform first
 * pass; authored boss sequences (`AUTHORED_THREAT_SEQUENCES`) carry no check yet
 * and are a follow-up for per-boss "two stances / not-X" variety (§2).
 */
export function defaultStanceCheck(enemyStance: Stance): { punishes: Stance; yields: Stance } {
    return { punishes: enemyStance, yields: rotateStance(enemyStance, 1) };
}

/** Generates a default escalating sequence for an unauthored enemy (§10),
 *  topped with a locked rage phase (Phase 3). Each phase carries a spec-33 §2
 *  open stance check (`defaultStanceCheck`) — inert unless the flag is on. */
export function generateDefaultThreatSequence(enemy: Enemy): CombatThreatPhase[] {
    const base = dominantStance(enemy);
    const PHASES = 3;
    const phases = Array.from({ length: PHASES }, (_unused, i) => {
        const enemyStance = rotateStance(base, i);
        return withIntent({
            index: i + 1,
            enemyStance,
            threatAction: defaultThreatAction(enemy, i),
            isFinalPhase: false, // the rage phase below is the true final phase
            stanceHint: enemyStanceHint(enemy) ?? DEFAULT_STANCE_HINTS[enemyStance],
            stanceCheck: defaultStanceCheck(enemyStance),
        });
    });
    const rageStance = rotateStance(base, PHASES);
    const rageDamage = threatDamageBudget(enemy.level, difficultyMult(enemy), PHASES, RAGE_DAMAGE_WEIGHT);
    const rageHeal = Math.round(rageDamage * RAGE_HEAL_FRACTION);
    phases.push(withIntent({
        index: PHASES + 1,
        enemyStance: rageStance,
        threatAction: buildThreatAction(
            `${enemy.name} loses patience and turns savage`, rageDamage, undefined, undefined, { enemyHeal: rageHeal },
        ),
        isFinalPhase: true,
        unlockAfterRound: RAGE_UNLOCK_ROUND,
        stanceHint: enemyStanceHint(enemy) ?? DEFAULT_STANCE_HINTS[rageStance],
        stanceCheck: defaultStanceCheck(rageStance),
    }));
    return phases;
}

/**
 * Returns the enemy's threat sequence: an explicit `enemy.threatSequence` wins;
 * otherwise an authored sequence keyed by id; otherwise the generated default.
 */
export function getThreatSequence(enemy: Enemy): CombatThreatPhase[] {
    const explicit = (enemy as Enemy & { threatSequence?: CombatThreatPhase[] }).threatSequence;
    let seq: CombatThreatPhase[];
    if (explicit && explicit.length > 0) {
        seq = explicit.map(p => withIntent({
            ...p,
            stanceHint: p.stanceHint ?? enemyStanceHint(enemy) ?? DEFAULT_STANCE_HINTS[p.enemyStance],
        }));
    } else {
        const authored = AUTHORED_THREAT_SEQUENCES[enemy.id];
        seq = authored ? resolveAuthored(enemy, authored) : generateDefaultThreatSequence(enemy);
    }
    // Spec 33 §2 (Phase D6e) — backfill the open stance-check telegraph on any
    // phase that authored none, at the single choke point every source funnels
    // through (explicit `threatSequence`, `AUTHORED_THREAT_SEQUENCES`, and the
    // default generator alike — the sim's witness enemies carry short explicit
    // sequences the generator never touched). A hand-authored check is
    // preserved; only absent ones are filled. Inert while the flag is off.
    return seq.map(p => (p.stanceCheck ? p : { ...p, stanceCheck: defaultStanceCheck(p.enemyStance) }));
}
