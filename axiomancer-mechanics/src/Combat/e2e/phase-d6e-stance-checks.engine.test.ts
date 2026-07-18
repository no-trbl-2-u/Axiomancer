/**
 * Hermetic E2E — Phase D6e (plan/phases/phase_D6e_stancecheck_telegraphs.md):
 * enemy stanceCheck telegraphs, the yield-lever content that drains D3 finding
 * F2 (`plan/tuning/2026-07-17-d3-dice-economy.md` §F2 — realized yield income
 * was 0.000 because NO enemy authored a `stanceCheck`).
 *
 * Two things ship here:
 *
 * 1. AUTHORING PIPELINE THREADED: D2 shipped the resolver (`resolveStanceCheck`)
 *    and the resolved-phase field (`CombatThreatPhase.stanceCheck`), but nothing
 *    carried an authored check from `AuthoredThreatPhase` through
 *    `resolveAuthored` — so an authored `stanceCheck` was silently dropped.
 *    `AuthoredThreatPhase` (and the branch fork `CombatThreatBranchOutcome`) now
 *    carry `stanceCheck?`, threaded through `resolveAuthored` /
 *    `resolveBranchOutcome` / `commitThreatBranch`. These tests pin that the
 *    authored field survives to the live phase — the regression guard against
 *    the silent drop.
 *
 * 2. CONTENT: a first batch of open stance checks across the roster (spec 33 §2
 *    authoring law — mono-color builds face 1-2 off-color checks/fight; bosses
 *    may name two stances). The three economy-sim-witnessed enemies (Grave
 *    Larva / Tri-Eyes / Fire Giant) each carry a `yields`, so the D3 economy
 *    witness measures realized yield income > 0 (the CANARY-F2 flip lives in
 *    `combat-dice-economy.sim.test.ts`).
 *
 * The checks are inert while the flag is off (`resolveStanceCheck` is gated on
 * `isUpgradeableDiceEnabled`), so authoring them never disturbs the flag-off
 * baseline — pinned below.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import { GraveLarva, KingOfRevenge } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import {
    initializeCombatEncounter, rollEncounterDice, resolveThreatPhase,
    READ_DAMAGE_MULT, CONVICTION_CAP,
} from '../combat.engine';
import { getThreatSequence, commitThreatBranch, flattenAuthoredSteps } from '../combat.threat';
import { AUTHORED_THREAT_SEQUENCES } from '../combat.threat-sequences';
import { setUpgradeableDice } from '../combat.upgradeable-dice';
import type { CombatEncounterState, CombatThreatPhase } from '../combat.encounter.types';
import type { Stance } from '../types';

const rng = () => 0.5;
const STANCES: readonly Stance[] = ['heart', 'body', 'mind'];

function makePlayer(hp = 4000): Character {
    const p = deepClone(Player);
    p.knownCards = [];
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = hp; p.maxHealth = hp; p.effects = [];
    return p;
}

/** Boots a real encounter for a roster enemy and fast-forwards to `phaseIndex`
 *  with the player pinned into `playerStance` (the stance the check reads). */
function stateAtPhase(
    enemyTemplate: Parameters<typeof deepClone>[0], phaseIndex: number,
    playerStance: Stance | null,
): CombatEncounterState {
    let s = initializeCombatEncounter(
        makePlayer(), deepClone(enemyTemplate) as Parameters<typeof initializeCombatEncounter>[1], undefined, 5,
    );
    s = rollEncounterDice(s).state;
    return { ...s, currentPhaseIndex: phaseIndex, playerStance };
}

function hpLoss(before: CombatEncounterState, after: CombatEncounterState): number {
    return before.player.health - after.player.health;
}

// ── 1. Authoring pipeline — the authored check survives to the live phase ────

describe('Phase D6e — authored stance checks thread through getThreatSequence', () => {
    it('Grave Larva carries its authored yields (mind) and punishes (body)', () => {
        const seq = getThreatSequence(deepClone(GraveLarva));
        expect(seq[0].stanceCheck).toEqual({ yields: 'mind' });
        expect(seq[1].stanceCheck).toEqual({ punishes: 'body' });
    });

    it('a village boss (King of Revenge) names two distinct stances across its phases', () => {
        const seq = getThreatSequence(deepClone(KingOfRevenge));
        const checks = seq.map(p => p.stanceCheck).filter(Boolean) as NonNullable<CombatThreatPhase['stanceCheck']>[];
        expect(checks.length).toBeGreaterThanOrEqual(2);
        const named = new Set<Stance>();
        for (const c of checks) {
            if (c.punishes) named.add(c.punishes);
            if (c.yields) named.add(c.yields);
        }
        expect(named.size).toBeGreaterThanOrEqual(2); // spec §2 boss law: >= two stances
    });

    it('every authored stanceCheck in the roster is well-formed and spans all three stances', () => {
        const seen = new Set<Stance>();
        let total = 0;
        for (const steps of Object.values(AUTHORED_THREAT_SEQUENCES)) {
            for (const phase of flattenAuthoredSteps(steps)) {
                const check = phase.stanceCheck;
                if (!check) continue;
                total += 1;
                // At least one side, and every named side is a real Stance.
                expect(Boolean(check.punishes) || Boolean(check.yields)).toBe(true);
                for (const side of [check.punishes, check.yields]) {
                    if (side) {
                        expect(STANCES).toContain(side);
                        seen.add(side);
                    }
                }
            }
        }
        expect(total).toBeGreaterThanOrEqual(12); // a real first batch, not a token one
        expect([...seen].sort()).toEqual(['body', 'heart', 'mind']); // full distribution
    });
});

// ── 2. The authored check drives resolveStanceCheck through the engine ───────

describe('Phase D6e — authored checks drive resolveStanceCheck (flag on)', () => {
    beforeEach(() => setUpgradeableDice(true));
    afterEach(() => { setUpgradeableDice(false); vi.restoreAllMocks(); });

    it('ending Grave Larva phase 0 in the YIELDED stance (mind) blunts the hit and pays +1◆', () => {
        const neutral = stateAtPhase(GraveLarva, 0, null); // stance-less → check inert
        const yielded = stateAtPhase(GraveLarva, 0, 'mind'); // matches yields: mind
        const neutralRes = resolveThreatPhase(neutral, rng);
        const yieldRes = resolveThreatPhase(yielded, rng);

        expect(hpLoss(neutral, neutralRes.state)).toBeGreaterThan(0);
        expect(hpLoss(yielded, yieldRes.state)).toBeLessThan(hpLoss(neutral, neutralRes.state));

        const resolved = yieldRes.events.find(e => e.kind === 'stance-check-resolved');
        expect(resolved && resolved.kind === 'stance-check-resolved' && resolved.outcome).toBe('yielded');
        expect(yieldRes.state.conviction).toBe(Math.min(CONVICTION_CAP, yielded.conviction + 1));
    });

    it('ending Grave Larva phase 1 in the PUNISHED stance (body) lands a harder hit (×advantage rail)', () => {
        const neutral = stateAtPhase(GraveLarva, 1, null);
        const punished = stateAtPhase(GraveLarva, 1, 'body'); // matches punishes: body
        const neutralLoss = hpLoss(neutral, resolveThreatPhase(neutral, rng).state);
        const punishRes = resolveThreatPhase(punished, rng);
        const punishedLoss = hpLoss(punished, punishRes.state);

        expect(neutralLoss).toBeGreaterThan(0);
        // The stance-check-resolved event is the crisp proof the advantage rail
        // was selected; exact HP magnitude drifts by ±1 from double-rounding at
        // a simple L1 enemy's tiny threat budget, so assert direction + rail.
        const resolved = punishRes.events.find(e => e.kind === 'stance-check-resolved');
        expect(resolved && resolved.kind === 'stance-check-resolved' && resolved.outcome).toBe('punished');
        expect(punishedLoss).toBeGreaterThan(neutralLoss);
        expect(punishedLoss).toBeGreaterThanOrEqual(Math.round(neutralLoss * READ_DAMAGE_MULT.advantage) - 1);
    });

    it('an OFF-check stance neither blunts nor punishes (outcome none)', () => {
        const neutral = stateAtPhase(GraveLarva, 0, null);
        const offCheck = stateAtPhase(GraveLarva, 0, 'body'); // phase 0 checks mind, not body
        expect(hpLoss(offCheck, resolveThreatPhase(offCheck, rng).state))
            .toBe(hpLoss(neutral, resolveThreatPhase(neutral, rng).state));
    });
});

// ── 3. Flag-off — authored checks are inert (baseline undisturbed) ───────────

describe('Phase D6e — authored checks are inert while the flag is off', () => {
    afterEach(() => setUpgradeableDice(false));

    it('the yielded stance takes the full neutral hit and pays no ◆ under the flag-off model', () => {
        setUpgradeableDice(false);
        const neutral = stateAtPhase(GraveLarva, 0, null);
        const wouldYield = stateAtPhase(GraveLarva, 0, 'mind');
        expect(hpLoss(wouldYield, resolveThreatPhase(wouldYield, rng).state))
            .toBe(hpLoss(neutral, resolveThreatPhase(neutral, rng).state));
        expect(resolveThreatPhase(wouldYield, rng).state.conviction).toBe(wouldYield.conviction);
    });
});

// ── 4. Branch forks carry the authored check (commitThreatBranch) ────────────

describe('Phase D6e — branch forks carry stanceCheck onto the committed phase', () => {
    function branchPhase(): CombatThreatPhase {
        const action = { description: 'test', effects: [{ damage: 10 }] };
        return {
            index: 1,
            enemyStance: 'mind',
            threatAction: action,
            stanceCheck: { yields: 'heart' }, // base = the ELSE fork's check
            branch: {
                condition: { kind: 'prior-threat-fully-blocked' },
                conditionText: 'if its last threat was fully blocked',
                then: { enemyStance: 'body', threatAction: action, stanceCheck: { punishes: 'body' } },
                else: { enemyStance: 'mind', threatAction: action, stanceCheck: { yields: 'heart' } },
            },
        } as CombatThreatPhase;
    }

    it('the THEN fork surfaces its own stanceCheck when the branch commits to it', () => {
        const committed = commitThreatBranch([branchPhase()], 0, deepClone(GraveLarva) as never, true);
        expect(committed?.taken).toBe('then');
        expect(committed?.phases[0].stanceCheck).toEqual({ punishes: 'body' });
    });

    it('the ELSE fork surfaces its own stanceCheck when the branch takes the baseline', () => {
        const committed = commitThreatBranch([branchPhase()], 0, deepClone(GraveLarva) as never, false);
        expect(committed?.taken).toBe('else');
        expect(committed?.phases[0].stanceCheck).toEqual({ yields: 'heart' });
    });
});
