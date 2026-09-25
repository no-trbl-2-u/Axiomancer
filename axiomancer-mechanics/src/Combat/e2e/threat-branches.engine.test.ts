/**
 * Hermetic E2E — WS9 (spec 32 §12 item 7, Ratified 2026-07-11): LEGIBLE
 * CONDITIONAL THREAT BRANCHES.
 *
 * A branch step holds a CLOSED condition + two fully-authored forks; the fork
 * commits from observable state at phase START (zero RNG), so the telegraph
 * can show the taken fork AND the condition. Two prototype enemies carry one
 * branch each:
 *
 *   - Tri-Eyes (mid normal) — `bearer-afflictions-gte 3`: stacked with 3+
 *     afflictions it sheds an authored fraction of them (never the last) and
 *     swaps stance (heart → mind).
 *   - Tezcatlipoca (late boss) — `prior-threat-fully-blocked`: a fully
 *     blocked prior threat turns the next action rider-heavy (POISON, the
 *     lighter damage weight) instead of damage-heavy (the heavier weight).
 *
 * The authored fork NUMBERS live in `combat.enemy-cards.ts` and are rescaled
 * freely (THE BIG NUMBERS REWRITE) — what is pinned here is the branch
 * CONTRACT, read off the live data rather than a remembered constant.
 *
 * Evidence here: (a) DETERMINISM — a fixed seed + a scripted player line
 * produces an identical encounter tree across runs; (b) DIVERGENCE — the
 * affliction-stacking and full-block lines flip their prototype's branch.
 * Pure math + a fixed RNG only; no disk / network / TTY.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import { TriEyes, Tezcatlipoca } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { registerSandboxCards } from '../../Cards/cards.sandbox';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard, resolveThreatPhase,
} from '../combat.engine';
import { getThreatSequence } from '../combat.threat';
import type { CombatDieColor, CombatEncounterState } from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

// Three distinct afflictions, all mind-aspect — each paid play is powered by
// its own mind MANA die (spec 33: one die per paid line, no chain refresh).
registerSandboxCards([
    {
        id: 'qa-branch-bleed', name: 'QA Branch Bleed',
        philosophicalAspect: 'mind', description: 'branch-divergence fixture',
        tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        // Intensity 2: bleed decaysPerTick — it must still be standing (at 1)
        // when the phase-2 branch reads the bearer at its START.
        combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 3 }],
    },
    {
        id: 'qa-branch-poison', name: 'QA Branch Poison',
        philosophicalAspect: 'mind', description: 'branch-divergence fixture',
        tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent', intensity: 1, duration: 3 }],
    },
    {
        id: 'qa-branch-mark', name: 'QA Branch Mark',
        philosophicalAspect: 'mind', description: 'branch-divergence fixture',
        tier: 1, targetType: 'enemy', rank: 1, cardType: 'spell',
        combatEffects: [{ effectId: 'debuff_mark', appliedTo: 'opponent', intensity: 1, duration: 3 }],
    },
]);

const rng = (): number => 0.5;
const DECK = ['qa-branch-bleed', 'qa-branch-poison', 'qa-branch-mark'];

function makePlayer(hp: number): Character {
    const p = deepClone(Player);
    p.knownCards = DECK.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = hp; p.maxHealth = hp;
    p.effects = [];
    return p;
}

function setDice(state: CombatEncounterState, colors: CombatDieColor[]): CombatEncounterState {
    const turn = state.turn || 1;
    const dice = colors.map((c, i) => ({
        id: `t${turn}-d${i}`, color: c, face: 'mana' as const,
        state: 'available' as const, temporary: false,
    }));
    return { ...state, dice, turn };
}

/**
 * The AFFLICTION-STACKING line vs Tri-Eyes: play bleed+poison+mark on turn 1
 * (3 affliction instances on the bearer), then let phase 1 resolve — the
 * phase-2 branch commits at its START, at the boundary.
 */
function afflictionLine(seed: number, play: boolean): CombatEncounterState {
    let s = initializeCombatEncounter(makePlayer(3000), deepClone(TriEyes), DECK, seed);
    s = rollEncounterDice(s, rng).state;
    s = setDice(s, ['mind', 'mind', 'mind']);
    if (play) {
        DECK.forEach((id, i) => {
            const entry = s.hand.find(h => h.cardId === id);
            expect(entry, `${id} missing from the opening hand`).toBeDefined();
            const res = playCombatCard(s, { uid: entry!.uid }, true, s.dice[i].id, rng);
            expect(res.events.some(e => e.kind === 'effect-fizzled')).toBe(false);
            s = res.state;
        });
    }
    return resolveThreatPhase(s, rng).state;
}

/**
 * The FULL-BLOCK line vs Tezcatlipoca: stand at phase 2 (index 1) behind a
 * wall (or none) and let it resolve — the phase-3 branch (index 2) commits
 * from the `lastThreatFullyBlocked` ledger at the boundary.
 */
function fullBlockLine(seed: number, guard: number): CombatEncounterState {
    let s = initializeCombatEncounter(makePlayer(4000), deepClone(Tezcatlipoca), DECK, seed);
    s = rollEncounterDice(s, rng).state;
    s = { ...s, currentPhaseIndex: 1, guard };
    return resolveThreatPhase(s, rng).state;
}

// ── The telegraph contract (before commit) ───────────────────────────────────

describe('threat branches — pending telegraph shows condition + BOTH outcomes', () => {
    it('resolves the Tri-Eyes branch with both forks visible and the ELSE face pending', () => {
        const phases = getThreatSequence(deepClone(TriEyes));
        const branchPhase = phases[1];
        expect(branchPhase.branch).toBeDefined();
        const branch = branchPhase.branch!;
        expect(branch.taken).toBeUndefined();
        expect(branch.conditionText).toBe('if it carries 3+ afflictions');
        // Both outcomes fully resolved for the telegraph…
        // Face honesty: the printed shed count IS the applied `enemyCleanse`.
        const cleanse = branch.then.threatAction.effects.find(e => (e.enemyCleanse ?? 0) > 0)?.enemyCleanse ?? 0;
        expect(cleanse).toBeGreaterThan(0);
        expect(branch.then.threatAction.description)
            .toContain(`sheds ${cleanse} affliction${cleanse === 1 ? '' : 's'}`);
        expect(branch.then.enemyStance).toBe('mind');
        expect(branch.else.enemyStance).toBe('heart');
        // …and the pending face is the ELSE (baseline) fork.
        expect(branchPhase.enemyStance).toBe('heart');
        expect(branchPhase.threatAction.description).toBe(branch.else.threatAction.description);
    });

    it('resolves the Tezcatlipoca branch: rider-heavy THEN vs damage-heavy ELSE', () => {
        const phases = getThreatSequence(deepClone(Tezcatlipoca));
        const branch = phases[2].branch;
        expect(branch).toBeDefined();
        expect(branch!.conditionText).toBe('if its last threat was fully blocked');
        const thenDamage = branch!.then.threatAction.effects.find(e => e.damage)?.damage ?? 0;
        const elseDamage = branch!.else.threatAction.effects.find(e => e.damage)?.damage ?? 0;
        expect(thenDamage).toBeLessThan(elseDamage);
        // Rider-heavy THEN: the lighter blow carries the POISON payload.
        expect(branch!.then.threatAction.effects.some(
            e => e.effectId === 'debuff_poison' && (e.intensity ?? 0) > 0,
        )).toBe(true);
    });
});

// ── (a) determinism — identical tree across runs ─────────────────────────────

describe('threat branches — determinism', () => {
    it('a fixed seed + a scripted line produces an identical encounter tree across runs', () => {
        const a = afflictionLine(11, true);
        const b = afflictionLine(11, true);
        expect(JSON.stringify(a.threatPhases)).toBe(JSON.stringify(b.threatPhases));
        expect(JSON.stringify(a.log)).toBe(JSON.stringify(b.log));
        expect(a.player.health).toBe(b.player.health);
        expect(a.enemy.health).toBe(b.enemy.health);
        expect(JSON.stringify(a.enemy.effects)).toBe(JSON.stringify(b.enemy.effects));
    });

    it('the full-block line is equally reproducible', () => {
        const a = fullBlockLine(23, 5000);
        const b = fullBlockLine(23, 5000);
        expect(JSON.stringify(a.threatPhases)).toBe(JSON.stringify(b.threatPhases));
        expect(JSON.stringify(a.log)).toBe(JSON.stringify(b.log));
    });
});

// ── (b) divergence — the two lines flip the branch ───────────────────────────

describe('threat branches — divergence (affliction-stacking vs full-block)', () => {
    it('Tri-Eyes takes THEN under 3 afflictions, ELSE without — and the taken fork is the face', () => {
        const stacked = afflictionLine(11, true);
        const clean = afflictionLine(11, false);

        // Both lines committed the phase-2 branch at its START (the boundary)…
        expect(stacked.currentPhaseIndex).toBe(1);
        expect(clean.currentPhaseIndex).toBe(1);
        // …but took DIFFERENT forks, each stamped and legible in the event log.
        expect(stacked.threatPhases[1].branch?.taken).toBe('then');
        expect(clean.threatPhases[1].branch?.taken).toBe('else');
        expect(stacked.log.some(e => e.kind === 'threat-branch' && e.taken === 'then' && e.phaseIndex === 1)).toBe(true);
        expect(clean.log.some(e => e.kind === 'threat-branch' && e.taken === 'else' && e.phaseIndex === 1)).toBe(true);
        // The committed face IS the taken fork (stance swap included).
        expect(stacked.threatPhases[1].enemyStance).toBe('mind');
        expect(clean.threatPhases[1].enemyStance).toBe('heart');
    });

    it('the taken THEN fork cleanses exactly its printed count — and never the last', () => {
        let s = afflictionLine(11, true);
        const before = s.enemy.effects.length;
        expect(before).toBeGreaterThanOrEqual(3);
        // The printed shed count on the committed face is what must be applied.
        const printed = s.threatPhases[1].threatAction.effects
            .find(e => (e.enemyCleanse ?? 0) > 0)?.enemyCleanse ?? 0;
        expect(printed).toBeGreaterThan(0);
        s = resolveThreatPhase(s, rng).state; // the committed branch phase fires
        const cleansed = s.log.find(e => e.kind === 'threat-cleansed');
        expect(cleansed).toBeDefined();
        expect((cleansed as { effectIds: string[] }).effectIds).toHaveLength(printed);
        // A fraction, never a wipe: something is always left standing.
        expect(s.enemy.effects.length).toBeGreaterThanOrEqual(1);
        expect(s.enemy.effects.length).toBe(before - printed);
    });

    it('Tezcatlipoca goes rider-heavy after a full block, damage-heavy otherwise', () => {
        const blocked = fullBlockLine(23, 5000);
        const landed = fullBlockLine(23, 0);

        expect(blocked.lastThreatFullyBlocked).toBe(true);
        expect(landed.lastThreatFullyBlocked).toBe(false);
        expect(blocked.threatPhases[2].branch?.taken).toBe('then');
        expect(landed.threatPhases[2].branch?.taken).toBe('else');
        // Rider-heavy face vs damage-heavy face.
        expect(blocked.threatPhases[2].threatAction.effects.some(
            e => e.effectId === 'debuff_poison' && (e.intensity ?? 0) > 0,
        )).toBe(true);
        expect(landed.threatPhases[2].threatAction.effects.some(
            e => e.effectId === 'debuff_mark',
        )).toBe(true);
    });
});
