/**
 * Hermetic E2E — Phase 33b (plan/archive/2026-09-25-trim-t4/plan/phases/phase_33b_enemy-archetypes-variable-rungs.md):
 * enemy archetypes + variable-rung telegraphs.
 *
 * Two things ship here:
 *
 * 1. AUTHORING GAP CLOSED: Phase 33a shipped `CombatThreatEffect.swayCleanse`
 *    / `.premiseShed` (engine hooks) but nothing let a plain authored phase
 *    (linear OR branch) actually carry them — only a hardcoded WS9 branch
 *    special case could ever set `enemyCleanse`. `AuthoredThreatPhase` now
 *    carries `enemyCleanse?` / `swayCleanse?` / `premiseShed?` directly, and
 *    2-3 mid/late enemies per class exercise each hook: CAUTERIZE (Fire
 *    Giant, Elder Fire Giant, alongside the pre-existing Tri-Eyes),
 *    Premise-shed (The Sophist, Zoma), PLEA-cleanse (Lady Gabriella, Rangda).
 *
 * 2. VARIABLE-RUNG TELEGRAPHS: `CombatThreatPhase.rungs` (1-4) overrides the
 *    flat `THREAT_RUNGS`/`THREAT_RUNGS_BOSS` default for that one phase, so
 *    STAGGER reads as a sized answer to a sized threat. Six of the same
 *    touched enemies also author a rung count, in BOTH directions (above and
 *    below the enemy's natural default), proving the override isn't a
 *    one-way escalation dial.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import {
    FireGiant, ElderFireGiant, TheSophist, Zoma, LadyGabriella, Rangda,
} from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import {
    initializeCombatEncounter, rollEncounterDice, resolveThreatPhase, projectIncomingThreat,
} from '../combat.engine';
import { getThreatSequence } from '../combat.threat';
import { THREAT_RUNGS_BOSS } from '../effects';
import type { CombatEncounterState } from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

function makePlayer(hp = 4000): Character {
    const p = deepClone(Player);
    p.knownCards = [];
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = hp; p.maxHealth = hp; p.effects = [];
    return p;
}

/** Boots a real encounter for one of the touched roster enemies and fast-forwards
 *  straight to the given phase (0-indexed) with whatever extra state a hook
 *  needs to actually apply. */
function stateAtPhase(
    enemyTemplate: Parameters<typeof deepClone>[0], phaseIndex: number,
    extra: Partial<CombatEncounterState> = {},
): CombatEncounterState {
    let s = initializeCombatEncounter(makePlayer(), deepClone(enemyTemplate) as Parameters<typeof initializeCombatEncounter>[1], undefined, 5);
    s = rollEncounterDice(s).state;
    return { ...s, currentPhaseIndex: phaseIndex, ...extra };
}

// ── Authoring — the hook fields are directly authorable on a plain phase ────

describe('Phase 33b — CAUTERIZE archetype (enemyCleanse), directly authored', () => {
    it('Fire Giant carries an explicit enemyCleanse on a plain linear phase (no branch)', () => {
        const seq = getThreatSequence(deepClone(FireGiant));
        const phase = seq[1]; // 'The Mountain's Spine' — the cauterize card
        expect(phase.branch).toBeUndefined();
        expect(phase.threatAction.effects.some(e => (e.enemyCleanse ?? 0) > 0)).toBe(true);
        expect(phase.threatAction.description).toContain('sheds 1 affliction');
        // Damage is always > 0 (threatDamageBudget floors at 3), so a phase
        // carrying both damage AND the cleanse debuff reads as 'combo'.
        expect(phase.intentType).toBe('combo');
    });

    it('Elder Fire Giant carries the same hook on its boss-tier escalation', () => {
        const seq = getThreatSequence(deepClone(ElderFireGiant));
        const phase = seq[1];
        expect(phase.threatAction.effects.some(e => (e.enemyCleanse ?? 0) > 0)).toBe(true);
    });

    it('firing Fire Giant\'s cauterize phase sheds one of its own afflictions (a fraction, never the last)', () => {
        const debuffs = [
            { effectId: 'debuff_poison', intensity: 2, remainingDuration: 3, appliedAt: 1, tier: 2 as const },
            { effectId: 'debuff_bleed', intensity: 2, remainingDuration: 3, appliedAt: 1, tier: 2 as const },
        ];
        const s = stateAtPhase(FireGiant, 1, { enemy: { ...deepClone(FireGiant), effects: debuffs } });
        const res = resolveThreatPhase(s);
        expect(res.state.enemy.effects.length).toBe(1); // one shed, one survivor — never a full wipe
        const cleansed = res.state.log.find(e => e.kind === 'threat-cleansed');
        expect(cleansed).toBeDefined();
    });
});

describe('Phase 33b — Premise-shed archetype, directly authored', () => {
    it('The Sophist carries premiseShed on its signature "strikes your best premise" phase', () => {
        const seq = getThreatSequence(deepClone(TheSophist));
        const phase = seq[2];
        expect(phase.threatAction.effects.some(e => (e.premiseShed ?? 0) > 0)).toBe(true);
        // BIG NUMBERS (2026-09-02): the shed was rescaled 3 -> 5 with the rest
        // of the ladder; the face must still print the number the engine applies.
        expect(phase.threatAction.description).toContain('unravels 5 premises');
    });

    it('Zoma carries premiseShed on its "deemed redundant" phase', () => {
        const seq = getThreatSequence(deepClone(Zoma));
        const phase = seq[1];
        expect(phase.threatAction.effects.some(e => (e.premiseShed ?? 0) > 0)).toBe(true);
    });

    it('firing The Sophist\'s premise-shed phase reduces the live spendable premises tally', () => {
        const s = stateAtPhase(TheSophist, 2, { premises: 8 });
        const res = resolveThreatPhase(s);
        expect(res.state.premises).toBe(3); // 8 - 5 authored (rescaled from 3)
        expect(res.state.log.some(e => e.kind === 'threat-premise-shed')).toBe(true);
    });
});

describe('Phase 33b — PLEA-cleanse archetype, directly authored', () => {
    it('Lady Gabriella carries swayCleanse on her "clinical accuracy" phase', () => {
        const seq = getThreatSequence(deepClone(LadyGabriella));
        const phase = seq[1];
        expect(phase.threatAction.effects.some(e => (e.swayCleanse ?? 0) > 0)).toBe(true);
    });

    it('Rangda carries swayCleanse on her "syllabus of accusation" phase', () => {
        const seq = getThreatSequence(deepClone(Rangda));
        const phase = seq[1];
        expect(phase.threatAction.effects.some(e => (e.swayCleanse ?? 0) > 0)).toBe(true);
    });

    it('firing Lady Gabriella\'s sway-cleanse phase reduces the live sway value', () => {
        const s = stateAtPhase(LadyGabriella, 1, { sway: 10 });
        const res = resolveThreatPhase(s);
        // 10 - 4 (authored swayCleanse, rescaled from 2) - 1 (unconditional
        // turn-boundary decay).
        expect(res.state.sway).toBe(5);
        expect(res.state.log.some(e => e.kind === 'threat-sway-cleansed')).toBe(true);
    });
});

/**
 * THE BIG NUMBERS REWRITE (2026-09-02) gave Elder Fire Giant the UNSHAKEN
 * keyword, which short-circuits rung denial entirely (`combat.engine.ts`:
 * `rungsLost = unshaken ? 0 : …`, `rungDenied = !unshaken && …`). That is a
 * different mechanic from the per-phase `rungs` override these cases exist to
 * prove, so the fixture strips it and the UNSHAKEN behaviour gets its own case
 * below.
 */
function shakeable<T extends { keywords?: readonly { kind: string }[] }>(enemy: T): T {
    const clone = deepClone(enemy) as T & { keywords?: { kind: string }[] };
    clone.keywords = (clone.keywords ?? []).filter(k => k.kind !== 'unshaken');
    return clone;
}

// ── Variable-rung telegraphs ─────────────────────────────────────────────────

describe('Phase 33b — variable-rung telegraphs authored in both directions', () => {
    it('The Sophist (boss) also softens its opening phase below the flat boss default', () => {
        const seq = getThreatSequence(deepClone(TheSophist));
        expect(seq[0].rungs).toBe(2);
        expect(THREAT_RUNGS_BOSS).toBe(3); // the boss flat default this phase undercuts
    });

    it('Elder Fire Giant (boss) hardens a phase to the 1-4 ceiling above the flat boss default', () => {
        // Deck composition is authored freely now (the enemy-deck laws are
        // repealed), so find the hardened phase rather than pinning its slot.
        const seq = getThreatSequence(deepClone(ElderFireGiant));
        expect(seq.some(p => p.rungs === 4), 'no phase authors the 4-rung ceiling').toBe(true);
        expect(4).toBeGreaterThan(THREAT_RUNGS_BOSS);
    });

    it('unauthored phases on the same enemies still carry no override (byte-identical fallback)', () => {
        const seq = getThreatSequence(deepClone(Zoma));
        expect(seq.some(p => p.rungs === undefined)).toBe(true);
    });

    /** Slot of the first phase whose `rungs` matches the predicate. */
    function phaseIndexWhere(
        enemy: Parameters<typeof deepClone>[0],
        pred: (rungs: number | undefined) => boolean,
    ): number {
        const i = getThreatSequence(deepClone(enemy) as never).findIndex(p => pred(p.rungs));
        expect(i, 'fixture needs a phase matching the predicate').toBeGreaterThanOrEqual(0);
        return i;
    }

    it('an authored LOW rung count denies with fewer stagger rungs than the flat default would require', () => {
        // The Sophist's opener: authored rungs:2 on a BOSS. Two stagger rungs
        // deny it — the flat boss default (3) would leave it merely weakened,
        // and the elite flat default (2) is the floor it descends to.
        const at = phaseIndexWhere(TheSophist, r => r === 2);
        const s = stateAtPhase(TheSophist, at, { staggerRungs: 2 });
        const projection = projectIncomingThreat(s);
        expect(projection.rungsTotal).toBe(2);
        expect(projection.rungsTotal).toBeLessThan(THREAT_RUNGS_BOSS);
        expect(projection.willDeny).toBe(true);
    });

    it('an authored HIGH rung count survives more stagger than the flat boss default would', () => {
        // Elder Fire Giant's hardened phase: authored rungs:4. 3 stagger rungs
        // (which would fully deny the flat boss default of 3) only weakens it.
        const at = phaseIndexWhere(ElderFireGiant, r => r === 4);
        const s = stateAtPhase(shakeable(ElderFireGiant), at, { staggerRungs: 3 });
        const projection = projectIncomingThreat(s);
        expect(projection.rungsTotal).toBe(4);
        expect(projection.rungsLost).toBe(3);
        expect(projection.willDeny).toBe(false);
    });

    it('an unauthored phase on the same boss still denies at its flat default (regression)', () => {
        // An Elder Fire Giant phase that carries no authored rungs — the
        // untouched flat boss default (3) must still deny at 3 stagger rungs.
        const at = phaseIndexWhere(ElderFireGiant, r => r === undefined);
        const s = stateAtPhase(shakeable(ElderFireGiant), at, { staggerRungs: 3 });
        const projection = projectIncomingThreat(s);
        expect(projection.rungsTotal).toBe(3);
        expect(projection.willDeny).toBe(true);
    });

    it('UNSHAKEN overrides the rung ladder entirely — no rung ever falls (2026-09-02)', () => {
        // The same phase on the SHIPPED Elder Fire Giant, which is UNSHAKEN:
        // the rung count is still telegraphed, but no amount of STAGGER moves it.
        const at = phaseIndexWhere(ElderFireGiant, r => r === undefined);
        const s = stateAtPhase(ElderFireGiant, at, { staggerRungs: 99 });
        const projection = projectIncomingThreat(s);
        expect(projection.rungsTotal).toBe(3);
        expect(projection.rungsLost).toBe(0);
        expect(projection.willDeny).toBe(false);
    });
});
