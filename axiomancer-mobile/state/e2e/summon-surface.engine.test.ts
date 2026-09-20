/**
 * SUMMON's player-facing surface, against the real engine (phase 102).
 *
 * `CombatBoard.adds.test.tsx` pins the chips with a hand-built brood; this
 * pins the seam that a hand-built brood cannot: run the ACTUAL engine with an
 * ACTUAL summoning foe, and assert the presenter reports what the engine did.
 *
 * The failure this exists to catch is the one an engine-only ship produces —
 * adds spawning and biting with nothing on screen either explaining the lost
 * VITAE or offering the verb that answers it. Every assertion here is written
 * against engine state the test drove, never against a fixture.
 */

import { describe, expect, it } from '@jest/globals';

import {
    initializeCombatEncounter, rollEncounterDice, processBetweenPhases, resolveThreatPhase,
    strikeAdd, STRIKE_ADD_COST, ADD_WAVE_CAP,
} from '@mechanics';
import type { CombatEncounterState, Enemy } from '@mechanics';
import { buildCombatViewModel, selectCombatLogHistory } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { createAppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

const CARDS = ['shallow-grave', 'spoiled-poultice'];

/** The mock foe, retrofitted with SUMMON 2 — the same shape The Jeweled Tree
 *  now authors, but local so this suite does not break when that enemy is
 *  retuned. */
function summoner(): Enemy {
    const base = createMockEncounterEnemy();
    return { ...base, level: 20, keywords: [{ kind: 'summon', n: 2, addName: 'Brier Shoot' }] } as Enemy;
}

/** The store's real player. `initializeCombatEncounter` reads the equipment
 *  loadout (`getSignaturesForLoadout`), so a hand-rolled object is not a
 *  player — it throws. */
function player() {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    const base = store.getState().player;
    return { ...base, knownCards: CARDS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };
}

/** Open a fight and cross ONE phase boundary, which is where wave 1 spawns. */
function fightWithBrood(): CombatEncounterState {
    let s = rollEncounterDice(initializeCombatEncounter(player(), summoner(), CARDS, 7)).state;
    s = resolveThreatPhase(s, () => 0.5).state;
    s = processBetweenPhases(s, () => 0.5).state;
    return s;
}

describe('SUMMON — the brood reaches the screen', () => {
    it('spawns a wave the presenter renders as chips, one per body', () => {
        const s = fightWithBrood();
        // Engine truth first: the test is worthless if the fight never summoned.
        expect((s.adds ?? []).length).toBe(2);

        const vm = buildCombatViewModel(s);
        expect(vm.enemy.adds).toHaveLength(2);
        expect(vm.enemy.adds.map((a) => a.name)).toEqual(['Brier Shoot', 'Brier Shoot']);
        // The chip's number is the engine's number, not a projection of it.
        expect(vm.enemy.adds.map((a) => a.bite)).toEqual((s.adds ?? []).map((a) => a.bite));
    });

    it('prints SUMMON as a keyword chip on the foe, so the brood is expected before it lands', () => {
        const vm = buildCombatViewModel(fightWithBrood());
        // Legibility is not only about the bodies: a player must be able to read
        // WHY they appeared. The keyword chip is where that lives.
        const summonChip = vm.enemy.keywords.find((k) => k.effectId === 'enemy-keyword-summon');
        expect(summonChip).toBeDefined();
        expect(summonChip!.glyph.label).toBe('SUMMON 2');
        // Its own mark, never FLURRY's asterism: FLURRY is more strikes from one
        // body, SUMMON is more bodies, and two marks that look alike would file
        // them as the same thing.
        expect(summonChip!.glyph.glyph).not.toBe('⁂');
        // The gloss must state the part the player cannot infer from the bodies:
        // that they act even when the foe itself has been shut down.
        expect(summonChip!.gloss).toMatch(/even while the foe is denied/);
    });

    /**
     * The honesty pin, end to end. The engine resolves adds outside the threat
     * loop's `!hindered` gate, so a denied foe still costs the player VITAE.
     * The readout must carry that, or the telegraph actively misleads.
     */
    it('carries the brood into the wall-math readout, separate from the foe’s own hit', () => {
        const s = fightWithBrood();
        const vm = buildCombatViewModel(s);

        const printed = (s.adds ?? []).reduce((sum, a) => sum + a.bite, 0);
        expect(vm.enemy.intent.wallMath.addDamage).toBe(printed);
        // `netDamage` keeps meaning "the FOE's telegraphed hit" — every existing
        // readout depends on that — and the brood rides in its own field.
        expect(vm.enemy.intent.wallMath.totalNetDamage)
            .toBe(vm.enemy.intent.wallMath.netDamage + vm.enemy.intent.wallMath.addNetDamage);
    });

    it('the brood really does cost VITAE, which is what makes the readout load-bearing', () => {
        const s = fightWithBrood();
        const before = s.player.health;
        const after = resolveThreatPhase({ ...s, guard: 0, barrier: 0 }, () => 0.5).state;
        expect(after.player.health).toBeLessThan(before);
    });
});

describe('SUMMON — the verb the chips reach', () => {
    it('striking an add removes exactly that body and charges the printed price', () => {
        const s: CombatEncounterState = { ...fightWithBrood(), phase: 'phase-play', conviction: 12 };
        const vm = buildCombatViewModel(s);
        const target = vm.enemy.adds[0];

        const after = strikeAdd(s, target.id).state;

        expect((after.adds ?? []).map((a) => a.id)).not.toContain(target.id);
        expect((after.adds ?? []).length).toBe(1);
        expect(after.conviction).toBe(12 - STRIKE_ADD_COST);
        // And the surface follows the engine without being told twice.
        expect(buildCombatViewModel(after).enemy.adds).toHaveLength(1);
    });

    it('clearing the whole brood never ends the fight — adds are not a win condition', () => {
        let s: CombatEncounterState = { ...fightWithBrood(), phase: 'phase-play', conviction: 12 };
        for (const a of [...(s.adds ?? [])]) s = strikeAdd(s, a.id).state;

        expect(s.adds ?? []).toHaveLength(0);
        expect(s.phase).toBe('phase-play');
        const vm = buildCombatViewModel(s);
        expect(vm.enemy.adds).toHaveLength(0);
        // The foe is untouched: killing the brood is progress, not victory.
        expect(s.enemy.health).toBe(s.enemy.health);
        expect(vm.enemy.hp).toBeGreaterThan(0);
    });

    it('marks the chips unaffordable rather than hiding them when Conviction is short', () => {
        const s = { ...fightWithBrood(), conviction: STRIKE_ADD_COST - 1 };
        const vm = buildCombatViewModel(s);

        // Still on screen — the player must be able to see the threat they
        // cannot yet answer, and read the price they are short of.
        expect(vm.enemy.adds).toHaveLength(2);
        expect(vm.enemy.adds.every((a) => a.affordable === false)).toBe(true);
        expect(vm.enemy.canStrikeAdd).toBe(false);
    });

    it('does not respawn the wave once cleared — clearing is progress the player keeps', () => {
        let s: CombatEncounterState = { ...fightWithBrood(), phase: 'phase-play', conviction: 12 };
        for (const a of [...(s.adds ?? [])]) s = strikeAdd(s, a.id).state;
        expect(s.adds ?? []).toHaveLength(0);

        // Cross several more boundaries with no STAGE in between.
        for (let i = 0; i < 3; i++) {
            s = resolveThreatPhase(s, () => 0.5).state;
            s = processBetweenPhases(s, () => 0.5).state;
        }

        expect(buildCombatViewModel(s).enemy.adds).toHaveLength(0);
        expect(s.addWavesSpawned ?? 0).toBeLessThanOrEqual(ADD_WAVE_CAP);
    });
});

/**
 * Burn-day audit 3.4 — the property the chips and the readout cannot carry:
 * a player who loses VITAE must be able to find out, after the fact, what
 * took it. Floats die in a second; the log is the ledger.
 *
 * This is the system guard. The unit suite
 * (`state/presenters/__tests__/combat-log-lines.engine.test.ts`) pins the
 * switch arms against hand-built events; only this pins the seam — real
 * engine, real brood, real `state.log`. If someone later renames the brood's
 * events or routes the bite through `damage-dealt`, the unit suite can go
 * green by deletion and this still holds.
 */
describe('SUMMON — the log accounts for what the brood did', () => {
    it('explains the VITAE the brood took', () => {
        const s = fightWithBrood();
        const before = s.player.health;
        const t = resolveThreatPhase({ ...s, guard: 0, barrier: 0 }, () => 0.5);

        // Engine truth first — a log assertion is worthless if nothing bit.
        const bit = (t.events ?? []).find((e) => e.kind === 'add-bit');
        expect(bit).toBeDefined();
        const dealt = (bit as { dealt: number }).dealt;
        expect(dealt).toBeGreaterThan(0);
        expect(t.state.player.health).toBeLessThan(before);

        const history = selectCombatLogHistory(t.state);
        const brood = history.filter((l) => /brood/i.test(l.text));
        expect(brood.length).toBeGreaterThan(0);
        // The engine's own number, not a projection of it.
        expect(brood.some((l) => l.text.includes(String(dealt)))).toBe(true);
    });

    it('records the wave arriving, so the bodies are never unexplained', () => {
        const s = fightWithBrood();
        expect((s.adds ?? []).length).toBe(2);

        const history = selectCombatLogHistory(s);
        const printed = (s.adds ?? [])[0].bite;
        const spawn = history.filter((l) => l.text.includes(`${(s.adds ?? []).length}`) && /bodies/i.test(l.text));
        expect(spawn.length).toBeGreaterThan(0);
        expect(spawn.some((l) => l.text.includes(String(printed)))).toBe(true);
    });

    /**
     * `strikeAdd`'s docblock promises a Conviction shortfall stays
     * "attributable rather than reading as a dead chip". It reached
     * `state.log` and the presenter dropped it, so on screen it read as
     * exactly the dead chip. This is that promise, end to end.
     */
    it('attributes a refused strike in the engine’s own words', () => {
        const s: CombatEncounterState = {
            ...fightWithBrood(), phase: 'phase-play', conviction: STRIKE_ADD_COST - 1,
        };
        const target = (s.adds ?? [])[0];
        const t = strikeAdd(s, target.id);

        const fizzle = (t.events ?? []).find((e) => e.kind === 'effect-fizzled');
        expect(fizzle).toBeDefined();
        const message = (fizzle as { message: string }).message;
        expect((t.state.adds ?? []).length).toBe((s.adds ?? []).length);

        const history = selectCombatLogHistory(t.state);
        expect(history.some((l) => l.text.includes(message))).toBe(true);
    });
});
