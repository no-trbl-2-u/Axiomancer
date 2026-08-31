/**
 * Hermetic E2E — Phase 33c (plan/phases/phase_33c_the_coveted_die.md):
 * THE COVETED DIE (spec 33 §1, flag-gated).
 *
 * A boss/unique threat phase authored `stake: true` converts to a temp gold
 * die the moment its telegraph is denied (STAGGER-to-0), fully blocked, or
 * its open stance check is answered with a `yields` — a straight mirror of
 * the momentum-surge payout shape (§3), ceiling-gated (overflow → +1◆).
 * One-time per phase index THIS combat (`covetedDiceClaimed`); priority when
 * more than one condition holds: stagger > block > yield. Wholly inert while
 * the flag is off, and never authored outside the 18 boss/unique phases
 * named in `combat.threat-sequences.ts` (D9 precedent's authoring-law shape).
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import { GraveLarva, ENEMY_REGISTRY } from '../../Enemy/enemy.library';
import type { Enemy } from '../../Enemy/types';
import { deepClone } from '../../Utils';
import {
    initializeCombatEncounter, rollEncounterDice, resolveThreatPhase, CONVICTION_CAP,
} from '../combat.engine';
import { AUTHORED_THREAT_SEQUENCES } from '../combat.threat-sequences';
import { isBranchStep } from '../combat.threat';
import { setUpgradeableDice, UPGRADEABLE_TABLE_CEILING, COVETED_DIE_PREFIX } from '../combat.upgradeable-dice';
import type { CombatEncounterState, CombatThreatPhase, CombatEvent } from '../combat.encounter.types';

beforeEach(() => setUpgradeableDice(true));
afterEach(() => { setUpgradeableDice(false); vi.restoreAllMocks(); });

// ── Fixtures ────────────────────────────────────────────────────────────────

function makePlayer(hp = 400): Character {
    const p = deepClone(Player);
    p.knownCards = [];
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = hp; p.maxHealth = hp; p.effects = [];
    return p;
}

function makeEnemy(hp = 500): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-coveted-dummy';
    e.health = hp; e.maxHealth = hp; e.effects = [];
    return e;
}

/** A single-phase authored threat (array length 1 so `processBetweenPhases`
 *  loops it right back to index 0 — a stand-in for a repeating/locked final
 *  phase, exactly the case `covetedDiceClaimed` guards against). */
function stakePhase(overrides: Partial<CombatThreatPhase> = {}): CombatThreatPhase {
    return {
        index: 1,
        enemyStance: 'body',
        threatAction: { description: 'test swing', effects: [{ damage: 40 }] },
        isFinalPhase: true,
        stake: true,
        ...overrides,
    };
}

function baseState(phase: CombatThreatPhase, extra: Partial<CombatEncounterState> = {}): CombatEncounterState {
    const s = initializeCombatEncounter(makePlayer(), makeEnemy(), undefined, 7);
    return {
        ...s,
        threatPhases: [phase],
        threatMarks: ['pending'],
        currentPhaseIndex: 0,
        ...extra,
    };
}

function events(res: { events: CombatEvent[] }, kind: CombatEvent['kind']): CombatEvent[] {
    return res.events.filter(e => e.kind === kind);
}

// ── Flag-off — byte-identical ────────────────────────────────────────────────

describe('Phase 33c — flag off', () => {
    it('a stake:true phase whose conditions are met steals nothing under the flag-off model', () => {
        setUpgradeableDice(false);
        const phase = stakePhase({ rungs: 1 });
        const s = baseState(phase, { staggerRungs: 1 });
        const res = resolveThreatPhase(s, () => 0.5);
        expect(events(res, 'coveted-die-stolen')).toHaveLength(0);
        expect(res.state.dice.some(d => d.id.startsWith(COVETED_DIE_PREFIX))).toBe(false);
        expect(res.state.floatingDice?.some(d => d.id.startsWith(COVETED_DIE_PREFIX)) ?? false).toBe(false);
        expect(res.state.covetedDiceClaimed ?? []).toHaveLength(0);
    });
});

// ── The three steal methods, table has room ─────────────────────────────────

describe('Phase 33c — the three steal methods pay a coveted die', () => {
    it('STAGGER-to-0 (rungDenied) claims the phase and mints a temp gold die', () => {
        const phase = stakePhase({ rungs: 1 });
        let s = baseState(phase, { staggerRungs: 1 });
        s = rollEncounterDice(s).state;
        const res = resolveThreatPhase(s, () => 0.5);

        const stolen = events(res, 'coveted-die-stolen')[0];
        expect(stolen).toBeDefined();
        expect(stolen.kind === 'coveted-die-stolen' && stolen.method).toBe('stagger');
        expect(stolen.kind === 'coveted-die-stolen' && stolen.phaseIndex).toBe(1);
        const dieId = stolen.kind === 'coveted-die-stolen' ? stolen.dieId : undefined;
        expect(dieId).toBeDefined();
        // `resolveThreatPhase` always runs through `processBetweenPhases`,
        // which clears the spent tray (`dice`) same as every phase boundary —
        // the die survives in `floatingDice`, re-materializing on the next roll.
        const die = res.state.floatingDice?.find(d => d.id === dieId);
        expect(die).toBeDefined();
        expect(die!.color).toBe('wild');
        expect(die!.face).toBe('mana');
        expect(die!.state).toBe('available');
        expect(die!.temporary).toBe(true);
        expect(die!.floating).toBe(true);
        expect(die!.id.startsWith(COVETED_DIE_PREFIX)).toBe(true);
        expect(res.state.covetedDiceClaimed).toEqual([1]);
    });

    it('a FULLY BLOCKED attack claims the phase and mints a die', () => {
        const phase = stakePhase();
        let s = baseState(phase);
        s = rollEncounterDice(s).state;
        s = { ...s, guard: 999 };
        const res = resolveThreatPhase(s, () => 0.5);

        const stolen = events(res, 'coveted-die-stolen')[0];
        expect(stolen).toBeDefined();
        expect(stolen.kind === 'coveted-die-stolen' && stolen.method).toBe('block');
        expect(res.state.floatingDice?.some(d => d.id.startsWith(COVETED_DIE_PREFIX))).toBe(true);
        expect(res.state.covetedDiceClaimed).toEqual([1]);
    });

    it("answering the phase's YIELD claims it (and composes with the check's own +1◆)", () => {
        const phase = stakePhase({ stanceCheck: { yields: 'heart' } });
        let s = baseState(phase);
        s = rollEncounterDice(s).state;
        s = { ...s, playerStance: 'heart' };
        const res = resolveThreatPhase(s, () => 0.5);

        const stolen = events(res, 'coveted-die-stolen')[0];
        expect(stolen).toBeDefined();
        expect(stolen.kind === 'coveted-die-stolen' && stolen.method).toBe('yield');
        expect(res.state.floatingDice?.some(d => d.id.startsWith(COVETED_DIE_PREFIX))).toBe(true);
        // The yield's own read-win bonus still pays — the steal composes on top,
        // it doesn't replace it (the payout here is a die, not more Conviction).
        expect(res.state.conviction).toBe(Math.min(CONVICTION_CAP, s.conviction + 1));
        expect(res.state.covetedDiceClaimed).toEqual([1]);
    });
});

// ── Table full → overflow to Conviction ──────────────────────────────────────

describe('Phase 33c — table-full overflow', () => {
    it('converts the payout to +1◆ (die-overflowed source "coveted") and still marks the phase claimed', () => {
        const phase = stakePhase({ rungs: 1 });
        let s = baseState(phase, { staggerRungs: 1 });
        s = rollEncounterDice(s).state; // 4 rolled tray dice under the flag
        s = {
            ...s,
            reserve: [
                { id: 'r-1', color: 'body', face: 'mana', state: 'available', temporary: false, pips: 0 },
                { id: 'r-2', color: 'mind', face: 'mana', state: 'available', temporary: false, pips: 0 },
                { id: 'r-3', color: 'heart', face: 'mana', state: 'available', temporary: false, pips: 0 },
            ],
        };
        expect(s.dice.length + (s.reserve?.length ?? 0)).toBe(UPGRADEABLE_TABLE_CEILING);

        const before = s.conviction;
        const res = resolveThreatPhase(s, () => 0.5);

        const overflow = events(res, 'die-overflowed').find(e => e.kind === 'die-overflowed' && e.source === 'coveted');
        expect(overflow).toBeDefined();
        const stolen = events(res, 'coveted-die-stolen')[0];
        expect(stolen).toBeDefined();
        expect(stolen.kind === 'coveted-die-stolen' && stolen.method).toBe('stagger');
        expect(stolen.kind === 'coveted-die-stolen' && stolen.dieId).toBeUndefined();
        expect(res.state.conviction).toBe(Math.min(CONVICTION_CAP, before + 1));
        expect(res.state.covetedDiceClaimed).toEqual([1]);
    });
});

// ── One-time per phase, per combat ───────────────────────────────────────────

describe('Phase 33c — one-time per phase index (repeating/locked final phase)', () => {
    it('an already-claimed phase index does not re-pay on a second resolution', () => {
        const phase = stakePhase({ rungs: 1 });
        let s = baseState(phase, { staggerRungs: 1 });
        s = rollEncounterDice(s).state;
        const first = resolveThreatPhase(s, () => 0.5);
        expect(events(first, 'coveted-die-stolen')).toHaveLength(1);
        expect(first.state.covetedDiceClaimed).toEqual([1]);

        // The single-phase array loops `currentPhaseIndex` right back to 0
        // (simulating a repeating/locked final phase); re-arm the trigger
        // condition to prove the GUARD — not an incidental non-trigger — is
        // what blocks the second payout.
        const looped: CombatEncounterState = { ...first.state, staggerRungs: 1 };
        const second = resolveThreatPhase(looped, () => 0.5);
        expect(events(second, 'coveted-die-stolen')).toHaveLength(0);
        expect(second.state.covetedDiceClaimed).toEqual([1]);
    });
});

// ── A phase with no `stake` never steals ─────────────────────────────────────

describe('Phase 33c — no `stake` authored, no steal', () => {
    it('conditions met but `stake` absent → no coveted-die-stolen event', () => {
        const phase = stakePhase({ rungs: 1, stake: undefined });
        let s = baseState(phase, { staggerRungs: 1 });
        s = rollEncounterDice(s).state;
        const res = resolveThreatPhase(s, () => 0.5);
        expect(events(res, 'coveted-die-stolen')).toHaveLength(0);
        expect(res.state.dice.some(d => d.id.startsWith(COVETED_DIE_PREFIX))).toBe(false);
        expect(res.state.floatingDice?.some(d => d.id.startsWith(COVETED_DIE_PREFIX)) ?? false).toBe(false);
    });
});

// ── Authoring law: exactly one boss/unique phase per sequence, position 1 ────

describe('Phase 33c — authoring law (stake on exactly one boss/unique phase)', () => {
    it('every boss/unique AUTHORED_THREAT_SEQUENCES entry stakes exactly its 2nd step; no elite/normal/simple entry stakes any', () => {
        const registry = ENEMY_REGISTRY as Record<string, { difficulty?: string }>;
        let bossUniqueSeen = 0;

        for (const [id, steps] of Object.entries(AUTHORED_THREAT_SEQUENCES)) {
            const key = id.replace(/^enemy-/, '');
            const enemy = registry[key];
            if (!enemy) continue; // registry coverage is a separate concern from this authoring law

            const stakedPositions = steps
                .map((step, i) => {
                    const staked = isBranchStep(step)
                        ? Boolean(step.branch.then.stake) || Boolean(step.branch.else.stake)
                        : Boolean(step.stake);
                    return staked ? i : -1;
                })
                .filter(i => i >= 0);

            const isBossOrUnique = enemy.difficulty === 'boss' || enemy.difficulty === 'unique';
            if (isBossOrUnique) {
                expect(stakedPositions, `${id} (boss/unique)`).toEqual([1]);
                bossUniqueSeen += 1;
            } else {
                expect(stakedPositions, `${id} (${enemy.difficulty})`).toEqual([]);
            }
        }

        // 15 boss + 4 unique: the phase brief's 14+4, plus Phase W3's
        // Harbormaster and Phase W4's Waterreeve + Portreeve (growth
        // ledger, THE PIPELINE LIBERATION ¶4).
        expect(bossUniqueSeen).toBe(21);
    });
});
